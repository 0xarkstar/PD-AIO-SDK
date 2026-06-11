/**
 * Extended WebSocket Wrapper — real per-stream protocol (live-verified
 * 2026-06-11, capture in tests/fixtures/extended/)
 *
 * The venue model (the previous single-multiplexed-socket implementation
 * with {action:'subscribe'} frames, JSON auth and a JSON ping/pong heartbeat
 * was fictional — the host it targeted is NXDOMAIN):
 *
 * - ONE socket per (stream, market): `{base}/{stream}/{market}`, e.g.
 *   `{base}/orderbooks/BTC-USD`, `{base}/publicTrades/BTC-USD`. The HTTP
 *   upgrade IS the subscription — the client sends ZERO outbound frames.
 * - Keepalive: the SERVER sends WS protocol-level PINGs (~1s) and the
 *   runtime auto-PONGs. No JSON heartbeat exists, so none is implemented.
 * - Orderbook: first frame per connection is a full SNAPSHOT, every
 *   subsequent frame a DELTA applied via the `c` field (new ABSOLUTE qty,
 *   c=="0" deletes). A FULL unified book is emitted per frame; client
 *   `limit` is served by SLICING the maintained book — `?depth=10`/`20`
 *   silently fail live and are never forwarded.
 * - Trades: the first frame per (re)connection is a 50-trade HISTORICAL
 *   backfill (timestamps predate connect) and is skipped. Non-TRADE flow
 *   (LIQUIDATION/DELEVERAGE) is kept, tagged via `info.tT`.
 * - Reconnect re-opens the per-stream URL; the fresh SNAPSHOT rebuilds the
 *   book. `seq` is per-connection and is passed through as `sequenceId`
 *   (it RESETS to 1 on reconnect — never persisted across connections).
 *
 * Scope: public orderbooks + publicTrades streams only (the venue funding
 * stream exists but is out of scope for this repair).
 */

import type { OrderBook, Trade } from '../../types/common.js';
import type { ExtendedTrade } from './types.js';
import { parseExtendedWSTradesFrame } from './types.js';
import { ExtendedOrderBookState } from './utils.js';
import { ExtendedNormalizer } from './ExtendedNormalizer.js';
import { EXTENDED_WS_CONFIG, EXTENDED_WS_CHANNELS } from './constants.js';
import { PerpDEXError } from '../../types/errors.js';
import { Logger } from '../../core/logger.js';

export interface ExtendedWebSocketConfig {
  /**
   * Per-stream WS BASE (e.g.
   * `wss://api.starknet.extended.exchange/stream.extended.exchange/v1`).
   * The wrapper composes `{base}/{stream}/{market}` per subscription.
   */
  wsUrl: string;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  /** Base reconnect backoff delay in ms (exponential, for tests) */
  reconnectDelayMs?: number;
}

type StreamPayload = OrderBook | Trade;
type StreamHandler = (payload: StreamPayload) => void;

interface StreamConnection {
  readonly url: string;
  readonly stream: string;
  readonly market: string;
  ws?: WebSocket;
  isOpen: boolean;
  readonly handlers: Set<StreamHandler>;
  /** Stateful book — orderbooks streams only */
  readonly bookState?: ExtendedOrderBookState;
  /** publicTrades: first frame per (re)connection = historical backfill */
  awaitingBackfill: boolean;
  reconnectAttempts: number;
  closedByClient: boolean;
}

/**
 * WebSocket wrapper for Extended exchange
 * Provides AsyncGenerator-based streaming for real-time public market data
 */
export class ExtendedWebSocketWrapper {
  /** Maximum queue size for backpressure */
  private static readonly MAX_QUEUE_SIZE = 1000;

  private readonly streamBase: string;
  private readonly reconnect: boolean;
  private readonly maxReconnectAttempts: number;
  private readonly reconnectDelayMs: number;
  private readonly normalizer: ExtendedNormalizer;
  private readonly logger: Logger;
  private readonly streams = new Map<string, StreamConnection>();

  constructor(config: ExtendedWebSocketConfig) {
    this.streamBase = config.wsUrl.replace(/\/+$/, '');
    this.reconnect = config.reconnect ?? true;
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? EXTENDED_WS_CONFIG.reconnectAttempts;
    this.reconnectDelayMs = config.reconnectDelayMs ?? EXTENDED_WS_CONFIG.reconnectDelay;
    this.normalizer = new ExtendedNormalizer();
    this.logger = new Logger('ExtendedWebSocketWrapper');
  }

  /**
   * Watch order book updates
   *
   * Seeds from the connection SNAPSHOT, applies DELTAs via the `c` field and
   * yields a FULL unified OrderBook per frame. `limit` slices the maintained
   * book (never forwarded as `?depth` — depth=10/20 silently fail live).
   */
  async *watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook> {
    const market = this.normalizer.symbolFromCCXT(symbol);

    for await (const payload of this.streamPayloads(EXTENDED_WS_CHANNELS.ORDERBOOKS, market)) {
      const book = payload as OrderBook;
      if (limit !== undefined && limit > 0) {
        yield {
          ...book,
          bids: book.bids.slice(0, limit),
          asks: book.asks.slice(0, limit),
        };
      } else {
        yield book;
      }
    }
  }

  /**
   * Watch public trade updates
   *
   * The first frame per (re)connection (50-trade historical backfill) is
   * skipped. LIQUIDATION/DELEVERAGE flow is kept, tagged via `info.tT`.
   */
  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    const market = this.normalizer.symbolFromCCXT(symbol);

    for await (const payload of this.streamPayloads(EXTENDED_WS_CHANNELS.PUBLIC_TRADES, market)) {
      yield payload as Trade;
    }
  }

  /**
   * Disconnect all per-stream sockets
   */
  disconnect(): void {
    for (const conn of this.streams.values()) {
      conn.closedByClient = true;
      conn.handlers.clear();
      if (conn.ws) {
        conn.ws.close(1000, 'Client disconnect');
        conn.ws = undefined;
      }
      conn.isOpen = false;
    }
    this.streams.clear();
    this.logger.info('WebSocket disconnected (all streams)');
  }

  /**
   * Check if any stream socket is open
   */
  get connected(): boolean {
    for (const conn of this.streams.values()) {
      if (conn.isOpen) {
        return true;
      }
    }
    return false;
  }

  // ==================== Private Methods ====================

  /**
   * Core consumer loop: opens (or joins) the per-stream socket and yields
   * normalized payloads dispatched by {@link handleFrame}.
   */
  private async *streamPayloads(stream: string, market: string): AsyncGenerator<StreamPayload> {
    const key = this.getChannelKey(stream, market);
    const conn = await this.openStream(stream, market);

    const queue: StreamPayload[] = [];
    let resolver: ((value: StreamPayload) => void) | null = null;

    const handler: StreamHandler = (payload) => {
      if (resolver) {
        resolver(payload);
        resolver = null;
      } else {
        // Apply backpressure: drop oldest payload if queue is full
        if (queue.length >= ExtendedWebSocketWrapper.MAX_QUEUE_SIZE) {
          queue.shift();
          this.logger.warn(`Queue overflow on stream ${key}, dropping oldest payload`);
        }
        queue.push(payload);
      }
    };

    conn.handlers.add(handler);

    try {
      while (this.streams.get(key) === conn) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          yield await new Promise<StreamPayload>((resolve) => {
            resolver = resolve;
          });
        }
      }
    } finally {
      conn.handlers.delete(handler);
      if (conn.handlers.size === 0) {
        this.closeStream(key, conn);
      }
    }
  }

  /**
   * Open (or reuse) the socket for a (stream, market) pair
   */
  private async openStream(stream: string, market: string): Promise<StreamConnection> {
    const key = this.getChannelKey(stream, market);
    const existing = this.streams.get(key);
    if (existing) {
      return existing;
    }

    const conn: StreamConnection = {
      url: `${this.streamBase}/${stream}/${market}`,
      stream,
      market,
      isOpen: false,
      handlers: new Set(),
      bookState:
        stream === EXTENDED_WS_CHANNELS.ORDERBOOKS ? new ExtendedOrderBookState() : undefined,
      awaitingBackfill: stream === EXTENDED_WS_CHANNELS.PUBLIC_TRADES,
      reconnectAttempts: 0,
      closedByClient: false,
    };
    this.streams.set(key, conn);

    try {
      await this.connectStream(key, conn);
    } catch (error) {
      this.streams.delete(key);
      throw error;
    }
    return conn;
  }

  /**
   * Connect one per-stream socket. The URL IS the subscription: nothing is
   * sent after the upgrade (no subscribe, no auth, no JSON ping).
   */
  private connectStream(key: string, conn: StreamConnection): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let settled = false;

      try {
        const ws = new WebSocket(conn.url);
        conn.ws = ws;

        ws.onopen = () => {
          conn.isOpen = true;
          conn.reconnectAttempts = 0;
          // New connection ⇒ the venue re-sends the trades backfill frame
          conn.awaitingBackfill = conn.stream === EXTENDED_WS_CHANNELS.PUBLIC_TRADES;
          this.logger.info('WebSocket stream connected', { url: conn.url });
          settled = true;
          resolve();
        };

        ws.onmessage = (event) => {
          this.handleFrame(conn, String(event.data));
        };

        ws.onerror = (error) => {
          this.logger.error(
            'WebSocket stream error',
            error instanceof Error ? error : new Error('WebSocket error'),
            { url: conn.url }
          );
          if (!settled) {
            settled = true;
            reject(
              new PerpDEXError(
                `WebSocket connection failed: ${conn.url}`,
                'WS_CONNECTION_ERROR',
                'extended'
              )
            );
          }
        };

        ws.onclose = (event) => {
          conn.isOpen = false;
          this.logger.info('WebSocket stream closed', {
            url: conn.url,
            code: event.code,
            reason: event.reason,
          });
          if (conn.closedByClient || this.streams.get(key) !== conn) {
            return;
          }
          if (this.reconnect && conn.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(key, conn);
          }
        };
      } catch (error) {
        if (!settled) {
          settled = true;
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      }
    });
  }

  /**
   * Decode one raw frame and dispatch normalized payloads to consumers
   */
  private handleFrame(conn: StreamConnection, rawText: string): void {
    try {
      if (conn.stream === EXTENDED_WS_CHANNELS.ORDERBOOKS) {
        // Validate + apply (SNAPSHOT seed / DELTA via `c`) + emit FULL book
        const book = this.normalizer.normalizeWSOrderBook(JSON.parse(rawText), conn.bookState!);
        conn.handlers.forEach((handler) => handler(book));
        return;
      }

      // publicTrades — int64-safe decode (JSON.parse alone corrupts ids)
      const frame = parseExtendedWSTradesFrame(rawText);
      if (conn.awaitingBackfill) {
        // First frame per (re)connection = 50-trade HISTORICAL backfill
        // (timestamps predate connect) — consumers expect live flow only.
        conn.awaitingBackfill = false;
        this.logger.debug('Skipped trades backfill frame', {
          market: conn.market,
          trades: frame.data.length,
        });
        return;
      }
      for (const rawTrade of frame.data) {
        // tT !== 'TRADE' (LIQUIDATION/DELEVERAGE) is kept — it is real
        // liquidation flow, tagged via info.tT.
        const trade = this.normalizer.normalizeTrade(rawTrade as unknown as ExtendedTrade);
        conn.handlers.forEach((handler) => handler(trade));
      }
    } catch (error) {
      this.logger.error(
        'Failed to handle WebSocket frame',
        error instanceof Error ? error : new Error(String(error)),
        { url: conn.url }
      );
    }
  }

  /**
   * Reconnect = re-open the per-stream URL. There is nothing to replay: the
   * URL is the subscription, the fresh SNAPSHOT rebuilds the book and the
   * trades backfill gate re-arms (see onopen).
   */
  private scheduleReconnect(key: string, conn: StreamConnection): void {
    conn.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelayMs * Math.pow(2, conn.reconnectAttempts - 1),
      EXTENDED_WS_CONFIG.maxReconnectDelay
    );

    this.logger.info(
      `Reconnecting stream in ${delay}ms (attempt ${conn.reconnectAttempts}/${this.maxReconnectAttempts})`,
      { url: conn.url }
    );

    setTimeout(() => {
      if (conn.closedByClient || this.streams.get(key) !== conn) {
        return;
      }
      this.connectStream(key, conn).catch((error) => {
        this.logger.error(
          'Reconnection failed',
          error instanceof Error ? error : new Error(String(error)),
          { url: conn.url }
        );
      });
    }, delay);
  }

  /**
   * Close a stream socket once its last consumer is gone
   */
  private closeStream(key: string, conn: StreamConnection): void {
    if (this.streams.get(key) === conn) {
      this.streams.delete(key);
    }
    conn.closedByClient = true;
    if (conn.ws) {
      conn.ws.close(1000, 'No consumers');
      conn.ws = undefined;
    }
    conn.isOpen = false;
    this.logger.debug('Stream closed (no consumers)', { url: conn.url });
  }

  /**
   * Get stream key for subscription tracking
   */
  private getChannelKey(stream: string, market: string): string {
    return `${stream}/${market}`;
  }
}

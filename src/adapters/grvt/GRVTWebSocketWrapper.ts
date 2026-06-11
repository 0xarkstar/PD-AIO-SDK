/**
 * GRVT WebSocket wrapper (JSON-RPC).
 *
 * GRVT's JSON-RPC WS lives on the `/ws/full` base path on the trades +
 * market-data hosts (the legacy `/ws` path expects a DIFFERENT envelope and
 * rejects this frame with `{"code":1003,...,"status":400}` — live-proven
 * 2026-06-11, fixtures tests/fixtures/grvt/ws-capture-{A,B}.jsonl).
 * Subscriptions are sent as:
 *   {"jsonrpc":"2.0","method":"subscribe",
 *    "params":{"stream":"v1.book.s","selectors":["BTC_USDT_Perp@500-50"]},"id":1}
 *
 * Public streams (market-data host): v1.{book.s,book.d,trade,ticker.s,mini.s}.
 * Private trade-data streams (trades host): v1.{order,fill,position} — these need
 * the `gravity` cookie + `X-Grvt-Account-Id` on connect (carried in the session).
 *
 * Feed frames carry `{ stream, feed, selector, sequence_number }`; the `feed`
 * payload shape matches REST exactly, so it is normalized via the same
 * `GRVTNormalizer`. Error frames (legacy `{code,message,status}` and JSON-RPC
 * `{error:{code,message}}`) are SURFACED to the stream consumer — silently
 * dropping them produced an unrecoverable silent hang.
 * Built on the SDK's typed `WebSocketClient` (auto-reconnect, Node/browser).
 */

import { WebSocketClient } from '../../websocket/WebSocketClient.js';
import type { OrderBook, Trade, Ticker, Position, Order, Balance } from '../../types/common.js';
import type {
  GRVTOrderBook,
  GRVTTrade,
  GRVTTicker,
  GRVTPosition,
  GRVTOrder,
  GRVTSession,
} from './types.js';
import { GRVTNormalizer } from './GRVTNormalizer.js';
import { GRVT_API_URLS, GRVT_WS_STREAMS, GRVT_BOOK_DEPTHS } from './constants.js';
import { Logger } from '../../core/logger.js';

/**
 * GRVT WebSocket wrapper configuration.
 */
export interface GRVTWebSocketConfig {
  /** Use testnet hosts. */
  testnet?: boolean;
  /** Session (cookie + account id) required for private order/fill/position streams. */
  session?: GRVTSession;
  /** Connection timeout (ms). */
  timeout?: number;
}

/**
 * A GRVT WS frame after JSON parsing: a feed frame ({stream, feed, selector,
 * sequence_number}), a JSON-RPC ack/error, or a legacy error frame.
 */
interface GRVTWsFrame {
  stream?: string;
  feed?: Record<string, unknown>;
  selector?: string;
  /** Stream sequence; initial-subscription replay arrives with '0'. */
  sequence_number?: string;
  /** JSON-RPC error member ({error:{code,message}}). */
  error?: { code?: number; message?: string };
  /** Legacy error frame fields ({code,message,status} — e.g. code 1003). */
  code?: number;
  message?: string;
  status?: number;
}

const DEFAULT_BOOK_DEPTH = 50;
const DEFAULT_TRADE_LIMIT = 50;

/**
 * AsyncGenerator-based GRVT WebSocket streaming wrapper.
 */
export class GRVTWebSocketWrapper {
  private static readonly MAX_QUEUE_SIZE = 1000;

  private readonly normalizer = new GRVTNormalizer();
  private readonly logger = new Logger('GRVTWebSocket');
  private readonly publicClient: WebSocketClient;
  private readonly tradeClient: WebSocketClient;
  private readonly session?: GRVTSession;
  private nextId = 1;

  constructor(config: GRVTWebSocketConfig = {}) {
    const urls = config.testnet ? GRVT_API_URLS.testnet : GRVT_API_URLS.mainnet;
    this.session = config.session;
    // GRVT /ws/full is JSON-RPC: the generic JSON {"type":"ping"} heartbeat is
    // NOT protocol and the server rejects it with error 1107 ("JSON RPC version
    // must be 2.0"), which the error-surfacing below would (correctly) deliver
    // to every stream consumer ~30s after connect — live-proven 2026-06-11.
    // Keepalive relies on feed traffic + auto-reconnect (standx/apex precedent).
    const heartbeat = { enabled: false, interval: 30000, timeout: 5000 } as const;
    this.publicClient = new WebSocketClient({
      url: urls.websocketMarketData,
      heartbeat,
      onError: (error) => this.logger.error('Public WS error', error),
    });
    this.tradeClient = new WebSocketClient({
      url: urls.websocketTrades,
      heartbeat,
      onError: (error) => this.logger.error('Trade WS error', error),
    });
  }

  /**
   * Connect the public market-data WebSocket.
   */
  async connect(): Promise<void> {
    await this.publicClient.connect();
  }

  /**
   * Connect the private trade-data WebSocket (requires a session).
   */
  async connectPrivate(): Promise<void> {
    if (!this.session) {
      throw new Error('Session required for private GRVT WebSocket streams');
    }
    await this.tradeClient.connect();
  }

  /**
   * Disconnect both WebSockets.
   */
  disconnect(): void {
    void this.publicClient.disconnect();
    void this.tradeClient.disconnect();
  }

  /**
   * Whether the public WebSocket is connected.
   */
  get connected(): boolean {
    return this.publicClient.isConnected();
  }

  // ==================== Public streams ====================

  /**
   * Watch FULL order-book snapshots for a symbol (`v1.book.s`).
   */
  async *watchOrderBook(symbol: string, depth: number = DEFAULT_BOOK_DEPTH): AsyncGenerator<OrderBook> {
    const instrument = this.normalizer.symbolFromCCXT(symbol);
    const validDepth = (GRVT_BOOK_DEPTHS as readonly number[]).includes(depth) ? depth : DEFAULT_BOOK_DEPTH;
    const selector = `${instrument}@500-${validDepth}`;
    yield* this.stream<OrderBook>(
      this.publicClient,
      GRVT_WS_STREAMS.bookSnapshot,
      [selector],
      instrument,
      (feed, frame) => this.normalizer.normalizeOrderBook(feed as unknown as GRVTOrderBook, frame.sequence_number)
    );
  }

  /**
   * Watch public trades for a symbol (`v1.trade`).
   */
  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    const instrument = this.normalizer.symbolFromCCXT(symbol);
    const selector = `${instrument}@${DEFAULT_TRADE_LIMIT}`;
    yield* this.stream<Trade>(this.publicClient, GRVT_WS_STREAMS.trade, [selector], instrument, (feed) =>
      this.normalizer.normalizeTrade(feed as unknown as GRVTTrade)
    );
  }

  /**
   * Watch ticker snapshots for a symbol (`v1.ticker.s`).
   */
  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    const instrument = this.normalizer.symbolFromCCXT(symbol);
    const selector = `${instrument}@500`;
    yield* this.stream<Ticker>(this.publicClient, GRVT_WS_STREAMS.tickerSnapshot, [selector], instrument, (feed) =>
      this.normalizer.normalizeTicker(feed as unknown as GRVTTicker)
    );
  }

  // ==================== Private streams ====================

  /**
   * Watch position updates (`v1.position`; requires a session).
   */
  async *watchPositions(symbol?: string): AsyncGenerator<Position> {
    this.requireSession();
    await this.connectPrivate();
    const instrument = symbol ? this.normalizer.symbolFromCCXT(symbol) : undefined;
    const selector = this.privateSelector(instrument);
    yield* this.stream<Position>(this.tradeClient, GRVT_WS_STREAMS.position, [selector], instrument, (feed) =>
      this.normalizer.normalizePosition(feed as unknown as GRVTPosition)
    );
  }

  /**
   * Watch order updates (`v1.order`; requires a session).
   */
  async *watchOrders(symbol?: string): AsyncGenerator<Order> {
    this.requireSession();
    await this.connectPrivate();
    const instrument = symbol ? this.normalizer.symbolFromCCXT(symbol) : undefined;
    const selector = this.privateSelector(instrument);
    yield* this.stream<Order>(this.tradeClient, GRVT_WS_STREAMS.order, [selector], instrument, (feed) =>
      this.normalizer.normalizeOrder(feed as unknown as GRVTOrder)
    );
  }

  /**
   * Watch user fills (`v1.fill`; requires a session).
   */
  async *watchMyTrades(symbol?: string): AsyncGenerator<Trade> {
    this.requireSession();
    await this.connectPrivate();
    const instrument = symbol ? this.normalizer.symbolFromCCXT(symbol) : undefined;
    const selector = this.privateSelector(instrument);
    yield* this.stream<Trade>(this.tradeClient, GRVT_WS_STREAMS.fill, [selector], instrument, (feed) =>
      this.normalizer.normalizeFill(feed)
    );
  }

  /**
   * Watch balance updates (derived from the position stream; requires a session).
   */
  async *watchBalance(): AsyncGenerator<Balance[]> {
    for await (const position of this.watchPositions()) {
      const balance: Balance = {
        currency: 'USDT',
        free: position.margin || 0,
        used: 0,
        total: position.margin || 0,
        info: position.info,
      };
      yield [balance];
    }
  }

  // ==================== Internals ====================

  /**
   * Subscribe to one stream and yield normalized values until the generator is
   * closed. Frames for other streams/instruments are ignored; un-normalizable
   * frames are skipped (defensive). Venue error frames are SURFACED as thrown
   * errors (silently dropping them produced an unrecoverable silent hang —
   * the legacy `/ws` path's `{"code":1003,...}` rejection, capture A).
   */
  private async *stream<T>(
    client: WebSocketClient,
    streamName: string,
    selectors: string[],
    instrument: string | undefined,
    normalize: (feed: Record<string, unknown>, frame: GRVTWsFrame) => T
  ): AsyncGenerator<T> {
    const queue: T[] = [];
    let error: Error | null = null;
    let resolver: ((value: T) => void) | null = null;
    let rejecter: ((err: Error) => void) | null = null;

    const fail = (err: Error): void => {
      error = err;
      if (rejecter) {
        const reject = rejecter;
        rejecter = null;
        resolver = null;
        reject(err);
      }
    };

    const onMessage = (raw: unknown): void => {
      const frame = this.parseFrame(raw);
      if (!frame) {
        return;
      }
      const frameError = this.extractErrorFrame(frame);
      if (frameError) {
        fail(frameError);
        return;
      }
      if (frame.stream !== streamName || !frame.feed) {
        return;
      }
      if (instrument && typeof frame.feed.instrument === 'string' && frame.feed.instrument !== instrument) {
        return;
      }
      let value: T;
      try {
        value = normalize(frame.feed, frame);
      } catch {
        return;
      }
      if (resolver) {
        const resolve = resolver;
        resolver = null;
        rejecter = null;
        resolve(value);
      } else {
        this.boundedPush(queue, value, streamName);
      }
    };
    const onError = (err: Error): void => {
      fail(err);
    };

    client.on('message', onMessage);
    client.on('error', onError);

    try {
      if (!client.isConnected()) {
        await client.connect();
      }
      client.send(this.subscribeFrame(streamName, selectors));

      while (true) {
        if (error) {
          throw error;
        }
        let value: T;
        if (queue.length > 0) {
          value = queue.shift() as T;
        } else {
          value = await new Promise<T>((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
          });
        }
        if (error) {
          throw error;
        }
        yield value;
      }
    } finally {
      client.off('message', onMessage);
      client.off('error', onError);
    }
  }

  /**
   * Detect a venue error frame and convert it to an Error (null otherwise).
   *
   * Two live shapes: legacy `{code,message,status}` (e.g. code 1003 from the
   * `/ws` envelope mismatch) and JSON-RPC `{error:{code,message}}`. Subscribe
   * ACKs (`{jsonrpc,result,id,method}`) and feed frames match neither.
   */
  private extractErrorFrame(frame: GRVTWsFrame): Error | null {
    if (frame.error && typeof frame.error === 'object') {
      return new Error(`GRVT WS subscribe error ${frame.error.code ?? ''}: ${frame.error.message ?? 'unknown'}`);
    }
    if (frame.stream === undefined && typeof frame.code === 'number' && typeof frame.message === 'string') {
      const status = frame.status !== undefined ? ` (status ${frame.status})` : '';
      return new Error(`GRVT WS error ${frame.code}: ${frame.message}${status}`);
    }
    return null;
  }

  /**
   * Build a JSON-RPC subscribe frame.
   */
  private subscribeFrame(stream: string, selectors: string[]): string {
    return JSON.stringify({
      jsonrpc: '2.0',
      method: 'subscribe',
      params: { stream, selectors },
      id: this.nextId++,
    });
  }

  /**
   * Parse a WS frame into `{ stream, feed }`, returning null on non-object input.
   */
  private parseFrame(raw: unknown): GRVTWsFrame | null {
    let obj: unknown = raw;
    if (typeof raw === 'string') {
      try {
        obj = JSON.parse(raw);
      } catch {
        return null;
      }
    }
    if (!obj || typeof obj !== 'object') {
      return null;
    }
    return obj as GRVTWsFrame;
  }

  /**
   * The private selector: the sub-account id, optionally scoped to an instrument.
   */
  private privateSelector(instrument?: string): string {
    const subAccountId = this.session?.subAccountId ?? '';
    return instrument ? `${subAccountId}@${instrument}` : subAccountId;
  }

  /**
   * Push with a bounded queue (drop oldest under backpressure).
   */
  private boundedPush<T>(queue: T[], item: T, channel: string): void {
    if (queue.length >= GRVTWebSocketWrapper.MAX_QUEUE_SIZE) {
      queue.shift();
      this.logger.warn(`Queue overflow on ${channel}, dropping oldest message`);
    }
    queue.push(item);
  }

  /**
   * @throws {Error} if no session is configured for a private stream.
   */
  private requireSession(): void {
    if (!this.session) {
      throw new Error('Session required for private GRVT WebSocket streams');
    }
  }
}

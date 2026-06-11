/**
 * StandX WebSocket Wrapper
 *
 * Live protocol (byte-captured 2026-06-11, 121 frames / 12s):
 * - Connect: wss://perps.standx.com/ws-stream/v1 (plain URL, no query/auth).
 * - Subscribe: {"subscribe":{"channel":"depth_book"|"public_trade"|"price",
 *   "symbol":"BTC-USD"}} — NO auth for these three public channels. The venue
 *   docs document no unsubscribe frame → stream teardown is a LOCAL detach.
 * - Messages: {seq, channel, symbol, data}. `seq` is CONNECTION-GLOBAL
 *   (interleaved across channels), NOT per-channel — it is surfaced as
 *   OrderBook.sequenceId for consumer-side gap awareness; per-channel
 *   gap-based resync would false-positive on every interleaved frame.
 * - depth_book = FULL ~130×130 snapshots every ~270ms, SNAPSHOT-ONLY (no
 *   delta protocol documented or observed) — every frame REPLACES the book
 *   (paradex-snapshot-simple; no stateful book maintenance needed). Level
 *   ordering NOT guaranteed → normalizer sorts. `limit` is served by slicing.
 * - public_trade data = ONE trade object per frame; price = compact snapshot.
 * - Heartbeat: the server pings at the WS PROTOCOL level (the runtime
 *   auto-pongs; 5-min pong silence → close {code:408}). There is NO JSON
 *   heartbeat — this wrapper sends NO ping frames (the generic JSON
 *   heartbeat in WebSocketClient stays DISABLED).
 * - Connection rules: 24h max lifetime, 10 conns/IP, 30 new conns/min —
 *   reconnect (with fresh subscribes) handles the 24h recycle.
 */

import { EventEmitter } from 'events';
import type { OrderBook, Ticker, Trade } from '../../types/index.js';
import { WebSocketClient } from '../../websocket/WebSocketClient.js';
import { STANDX_WS_CHANNELS } from './constants.js';
import type { StandxNormalizer } from './StandxNormalizer.js';
import { StandxWSFrameSchema } from './types.js';
import type { StandxDepthBook, StandxWSPrice, StandxWSTrade } from './types.js';

/** Maximum queue size per channel for backpressure */
const MAX_QUEUE_SIZE = 1000;

export interface StandxWebSocketDeps {
  readonly wsUrl: string;
  readonly normalizer: StandxNormalizer;
  /** unified → venue dash symbol ("BTC/USD:USD" → "BTC-USD") */
  readonly symbolToExchange: (symbol: string) => string;
}

interface ChannelSubscription {
  readonly channel: string;
  readonly exchangeSymbol: string;
  handler: (frame: unknown) => void;
  active: boolean;
}

export class StandxWebSocketWrapper extends EventEmitter {
  private readonly wsUrl: string;
  private readonly normalizer: StandxNormalizer;
  private readonly symbolToExchange: (symbol: string) => string;
  private client: WebSocketClient | null = null;
  /** keyed by `${channel}:${exchangeSymbol}` */
  private readonly subscriptions = new Map<string, ChannelSubscription>();

  constructor(deps: StandxWebSocketDeps) {
    super();
    this.setMaxListeners(100);
    this.wsUrl = deps.wsUrl;
    this.normalizer = deps.normalizer;
    this.symbolToExchange = deps.symbolToExchange;
  }

  /** Connect to the plain stream URL (idempotent; no auth, no query params) */
  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    this.client = new WebSocketClient({
      url: this.wsUrl,
      reconnect: {
        enabled: true,
        maxAttempts: 10,
        initialDelay: 500,
        maxDelay: 30000,
        multiplier: 2,
        jitter: 0.1,
      },
      heartbeat: {
        // The venue heartbeat is WS PROTOCOL-LEVEL ping (auto-ponged by the
        // runtime) — there is NO JSON heartbeat; sending one is not protocol.
        enabled: false,
        interval: 30000,
        timeout: 5000,
      },
      onMessage: (data) => this.handleMessage(data),
      onError: (error) => this.emit('error', error),
    });

    this.client.on('reconnected', () => {
      this.resubscribeAll();
    });

    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    this.subscriptions.clear();

    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client?.isConnected() ?? false;
  }

  // ===========================================================================
  // Public streams
  // ===========================================================================

  /**
   * Watch order book — depth_book is SNAPSHOT-ONLY: every frame is a full
   * self-contained book, so each frame normalizes (sorted) and emits directly.
   * `limit` is served by SLICING (the venue has no depth param).
   */
  async *watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook> {
    const exchangeSymbol = this.symbolToExchange(symbol);

    yield* this.watch<OrderBook>(STANDX_WS_CHANNELS.DEPTH_BOOK, exchangeSymbol, (frame) => {
      const parsed = StandxWSFrameSchema.parse(frame);
      const book = this.normalizer.normalizeOrderBook(
        parsed.data as StandxDepthBook,
        symbol,
        parsed.seq
      );
      if (limit !== undefined) {
        return [{ ...book, bids: book.bids.slice(0, limit), asks: book.asks.slice(0, limit) }];
      }
      return [book];
    });
  }

  /** Watch trades — ONE trade object per public_trade frame */
  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    const exchangeSymbol = this.symbolToExchange(symbol);

    yield* this.watch<Trade>(STANDX_WS_CHANNELS.PUBLIC_TRADE, exchangeSymbol, (frame) => {
      const parsed = StandxWSFrameSchema.parse(frame);
      return [this.normalizer.normalizeWSTrade(parsed.data as StandxWSTrade, symbol)];
    });
  }

  /**
   * Watch ticker via the price channel — compact snapshot with REAL bid/ask
   * (spread tuple); 24h stats are not on this channel (tagged in info).
   */
  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    const exchangeSymbol = this.symbolToExchange(symbol);

    yield* this.watch<Ticker>(STANDX_WS_CHANNELS.PRICE, exchangeSymbol, (frame) => {
      const parsed = StandxWSFrameSchema.parse(frame);
      return [this.normalizer.normalizeWSTicker(parsed.data as StandxWSPrice, symbol)];
    });
  }

  // ===========================================================================
  // Subscription machinery
  // ===========================================================================

  private async *watch<T>(
    channel: string,
    exchangeSymbol: string,
    process: (frame: unknown) => T[]
  ): AsyncGenerator<T> {
    const key = `${channel}:${exchangeSymbol}`;
    const queue: T[] = [];
    let resolveNext: ((value: T) => void) | null = null;

    const subscription: ChannelSubscription = {
      channel,
      exchangeSymbol,
      handler: (frame: unknown) => {
        let outputs: T[];
        try {
          outputs = process(frame);
        } catch (error) {
          this.emit('error', new Error(`Failed to process ${key} frame: ${String(error)}`));
          return;
        }
        for (const output of outputs) {
          if (resolveNext) {
            resolveNext(output);
            resolveNext = null;
          } else {
            if (queue.length >= MAX_QUEUE_SIZE) {
              queue.shift();
            }
            queue.push(output);
          }
        }
      },
      active: true,
    };

    this.subscriptions.set(key, subscription);
    this.sendSubscribe(channel, exchangeSymbol);

    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          yield await new Promise<T>((resolve) => {
            resolveNext = resolve;
          });
        }
      }
    } finally {
      // The venue documents NO unsubscribe frame — teardown is a local detach
      // (the server keeps streaming; frames without a subscription are dropped
      // by handleMessage).
      subscription.active = false;
      this.subscriptions.delete(key);
    }
  }

  private sendSubscribe(channel: string, exchangeSymbol: string): void {
    if (!this.client?.isConnected()) {
      return;
    }
    this.client.send({ subscribe: { channel, symbol: exchangeSymbol } });
  }

  /**
   * After a reconnect: re-send all subscribes. depth_book is snapshot-only,
   * so the first post-reconnect frame fully rebuilds every consumer's view.
   */
  private resubscribeAll(): void {
    for (const sub of this.subscriptions.values()) {
      this.sendSubscribe(sub.channel, sub.exchangeSymbol);
    }
  }

  // ===========================================================================
  // Message routing
  // ===========================================================================

  private handleMessage(data: unknown): void {
    try {
      const parsed = data as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object') {
        return;
      }

      // Venue error frames ({code,message}, e.g. the 408 pong-timeout notice)
      // are SURFACED to the consumer, never silently dropped (grvt lesson).
      if (typeof parsed.code === 'number' && typeof parsed.channel !== 'string') {
        this.emit(
          'error',
          new Error(`StandX WS error frame: ${JSON.stringify(parsed)}`)
        );
        return;
      }

      // Data frames route by (channel, symbol)
      if (typeof parsed.channel === 'string') {
        const key = `${parsed.channel}:${String(parsed.symbol ?? '')}`;
        const subscription = this.subscriptions.get(key);
        if (subscription?.active) {
          subscription.handler(parsed);
        }
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to handle message: ${String(error)}`));
    }
  }
}

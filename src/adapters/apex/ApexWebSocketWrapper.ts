/**
 * ApeX Omni WebSocket Wrapper
 *
 * Live protocol (byte-captured 2026-06-11):
 * - Connect: wss://quote.omni.apex.exchange/realtime_public?v=2&timestamp=<ms>
 * - Subscribe: {"op":"subscribe","args":["orderBook200.H.BTCUSDT"]} → ack
 *   {success:true, ret_msg:"", conn_id, request}. ALL topics use NO-DASH symbols.
 * - Orderbook: type:"snapshot" (full book) then type:"delta" (~138ms); size "0"
 *   deletes a level; `u` is STRICTLY +1 continuous; snapshot resets u — on a
 *   u-gap this wrapper resubscribes and waits for a fresh snapshot.
 * - Trades: type:"snapshot" = recent-history backfill (deduped by uuid `i`),
 *   then type:"delta" arrays.
 * - Heartbeat is DUAL (copying the aster template verbatim — heartbeat
 *   disabled — gets the socket closed at 150s): the client pings every 15s
 *   ({op:"ping",args:["<ms>"]}) AND must reply {op:"pong"} to the server's
 *   {op:"ping"} frames. Frame `ts` is MICROSECONDS.
 */

import { EventEmitter } from 'events';
import type { OrderBook, Ticker, Trade } from '../../types/index.js';
import { WebSocketClient } from '../../websocket/WebSocketClient.js';
import { APEX_WS_CLIENT_PING_INTERVAL_MS, APEX_WS_TOPICS } from './constants.js';
import type { ApexNormalizer } from './ApexNormalizer.js';
import { ApexWSOrderBookFrameSchema, ApexWSTradesFrameSchema } from './types.js';

/** Maximum queue size per channel for backpressure */
const MAX_QUEUE_SIZE = 1000;

/** Bounded dedupe window for trade uuids (snapshot backfill overlap) */
const MAX_SEEN_TRADE_IDS = 2000;

export interface ApexWebSocketDeps {
  readonly wsUrl: string;
  readonly normalizer: ApexNormalizer;
  /** unified → NO-DASH exchange symbol (WS topics) */
  readonly symbolToExchange: (symbol: string) => string;
}

interface TopicSubscription {
  readonly topic: string;
  handler: (frame: unknown) => void;
  active: boolean;
}

interface BookState {
  bids: Map<number, number>;
  asks: Map<number, number>;
  lastU: number | null;
}

export class ApexWebSocketWrapper extends EventEmitter {
  private readonly wsUrl: string;
  private readonly normalizer: ApexNormalizer;
  private readonly symbolToExchange: (symbol: string) => string;
  private client: WebSocketClient | null = null;
  private readonly subscriptions = new Map<string, TopicSubscription>();
  private readonly bookStates = new Map<string, BookState>();
  private readonly seenTradeIds = new Map<string, Set<string>>();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(deps: ApexWebSocketDeps) {
    super();
    this.setMaxListeners(100);
    this.wsUrl = deps.wsUrl;
    this.normalizer = deps.normalizer;
    this.symbolToExchange = deps.symbolToExchange;
  }

  /** Connect with the venue-required ?v=2&timestamp=<ms> query (idempotent) */
  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    const url = `${this.wsUrl}?v=2&timestamp=${Date.now()}`;

    this.client = new WebSocketClient({
      url,
      reconnect: {
        enabled: true,
        maxAttempts: 10,
        initialDelay: 500,
        maxDelay: 30000,
        multiplier: 2,
        jitter: 0.1,
      },
      heartbeat: {
        // The generic JSON {"type":"ping"} heartbeat is NOT the venue protocol;
        // apex needs {op:"ping",args:["<ms>"]} — handled by our own interval.
        enabled: false,
        interval: APEX_WS_CLIENT_PING_INTERVAL_MS,
        timeout: 5000,
      },
      onMessage: (data) => this.handleMessage(data),
      onError: (error) => this.emit('error', error),
    });

    this.client.on('reconnected', () => {
      this.resubscribeAll();
    });

    await this.client.connect();
    this.startClientPing();
  }

  async disconnect(): Promise<void> {
    this.stopClientPing();
    this.subscriptions.clear();
    this.bookStates.clear();
    this.seenTradeIds.clear();

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
   * Watch order book — maintains a stateful book from snapshot+delta frames
   * and emits a FULL unified OrderBook per frame. `limit` is served by
   * SLICING the maintained book (topic depth is 25 or 200).
   */
  async *watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook> {
    const exchangeSymbol = this.symbolToExchange(symbol);
    const depth: 25 | 200 = limit !== undefined && limit <= 25 ? 25 : 200;
    const topic = APEX_WS_TOPICS.ORDERBOOK(exchangeSymbol, depth);

    yield* this.watch<OrderBook>(topic, (frame) =>
      this.processOrderBookFrame(frame, topic, symbol, limit)
    );
  }

  /**
   * Watch trades — the first frame is a recent-history snapshot; all trades
   * are deduped by uuid `i` across snapshot/delta overlap.
   */
  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    const exchangeSymbol = this.symbolToExchange(symbol);
    const topic = APEX_WS_TOPICS.TRADES(exchangeSymbol);

    yield* this.watch<Trade>(topic, (frame) => this.processTradesFrame(frame, topic, symbol));
  }

  /**
   * Watch ticker via instrumentInfo.H.{SYMBOL} — update-field-only semantics:
   * the snapshot carries the full object, deltas only changed fields. State is
   * merged per topic; a Ticker is emitted once enough fields accumulated.
   */
  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    const exchangeSymbol = this.symbolToExchange(symbol);
    const topic = APEX_WS_TOPICS.TICKER(exchangeSymbol);
    let merged: Record<string, unknown> = {};

    yield* this.watch<Ticker>(topic, (frame) => {
      const f = frame as { data?: Record<string, unknown>; ts?: number; type?: string };
      if (!f || typeof f !== 'object' || !f.data) {
        return [];
      }
      merged = { ...merged, ...f.data };
      try {
        const ticker = this.normalizer.normalizeTicker(merged as never, symbol);
        return [
          {
            ...ticker,
            timestamp: typeof f.ts === 'number' ? this.normalizer.usToMs(f.ts) : ticker.timestamp,
          },
        ];
      } catch {
        // Not enough fields merged yet (update-field-only deltas before snapshot)
        return [];
      }
    });
  }

  // ===========================================================================
  // Frame processing
  // ===========================================================================

  private processOrderBookFrame(
    frame: unknown,
    topic: string,
    symbol: string,
    limit?: number
  ): OrderBook[] {
    const parsed = ApexWSOrderBookFrameSchema.parse(frame);
    let state = this.bookStates.get(topic);

    if (parsed.type === 'snapshot') {
      // Snapshot RESETS the book and the u counter
      state = { bids: new Map(), asks: new Map(), lastU: parsed.data.u };
      for (const [p, q] of parsed.data.b) {
        const qty = parseFloat(q);
        if (qty > 0) state.bids.set(parseFloat(p), qty);
      }
      for (const [p, q] of parsed.data.a) {
        const qty = parseFloat(q);
        if (qty > 0) state.asks.set(parseFloat(p), qty);
      }
      this.bookStates.set(topic, state);
    } else {
      // delta
      if (!state || state.lastU === null) {
        // No snapshot seeded yet — cannot apply a delta
        return [];
      }
      if (parsed.data.u !== state.lastU + 1) {
        // u is STRICTLY +1 continuous; a gap means missed frames → resync.
        this.bookStates.delete(topic);
        this.resubscribeTopic(topic);
        return [];
      }
      for (const [p, q] of parsed.data.b) {
        const price = parseFloat(p);
        if (q === '0') state.bids.delete(price);
        else state.bids.set(price, parseFloat(q));
      }
      for (const [p, q] of parsed.data.a) {
        const price = parseFloat(p);
        if (q === '0') state.asks.delete(price);
        else state.asks.set(price, parseFloat(q));
      }
      state.lastU = parsed.data.u;
    }

    let bids = Array.from(state.bids.entries()).sort((a, b) => b[0] - a[0]) as Array<
      [number, number]
    >;
    let asks = Array.from(state.asks.entries()).sort((a, b) => a[0] - b[0]) as Array<
      [number, number]
    >;
    if (limit !== undefined) {
      bids = bids.slice(0, limit);
      asks = asks.slice(0, limit);
    }

    return [
      {
        symbol,
        timestamp: this.normalizer.usToMs(parsed.ts),
        bids,
        asks,
        sequenceId: parsed.data.u,
        exchange: 'apex',
      },
    ];
  }

  private processTradesFrame(frame: unknown, topic: string, symbol: string): Trade[] {
    const parsed = ApexWSTradesFrameSchema.parse(frame);

    let seen = this.seenTradeIds.get(topic);
    if (!seen) {
      seen = new Set();
      this.seenTradeIds.set(topic, seen);
    }

    const trades: Trade[] = [];
    for (const raw of parsed.data) {
      if (seen.has(raw.i)) {
        continue;
      }
      seen.add(raw.i);
      while (seen.size > MAX_SEEN_TRADE_IDS) {
        seen.delete(seen.values().next().value as string);
      }
      trades.push(this.normalizer.normalizeWSTrade(raw, symbol));
    }
    return trades;
  }

  // ===========================================================================
  // Subscription machinery
  // ===========================================================================

  private async *watch<T>(topic: string, process: (frame: unknown) => T[]): AsyncGenerator<T> {
    const queue: T[] = [];
    let resolveNext: ((value: T) => void) | null = null;

    const subscription: TopicSubscription = {
      topic,
      handler: (frame: unknown) => {
        let outputs: T[];
        try {
          outputs = process(frame);
        } catch (error) {
          this.emit(
            'error',
            new Error(`Failed to process ${topic} frame: ${String(error)}`)
          );
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

    this.subscriptions.set(topic, subscription);
    this.sendSubscribe(topic);

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
      subscription.active = false;
      this.subscriptions.delete(topic);
      this.bookStates.delete(topic);
      this.seenTradeIds.delete(topic);
      this.sendUnsubscribe(topic);
    }
  }

  private sendSubscribe(topic: string): void {
    if (!this.client?.isConnected()) {
      return;
    }
    this.client.send({ op: 'subscribe', args: [topic] });
  }

  private sendUnsubscribe(topic: string): void {
    if (!this.client?.isConnected()) {
      return;
    }
    this.client.send({ op: 'unsubscribe', args: [topic] });
  }

  /** u-gap resync: unsubscribe + subscribe → server replies with a fresh snapshot */
  private resubscribeTopic(topic: string): void {
    this.sendUnsubscribe(topic);
    this.sendSubscribe(topic);
  }

  /** After a reconnect: books must rebuild from fresh snapshots */
  private resubscribeAll(): void {
    this.bookStates.clear();
    for (const topic of this.subscriptions.keys()) {
      this.sendSubscribe(topic);
    }
  }

  // ===========================================================================
  // Message routing + heartbeat
  // ===========================================================================

  private handleMessage(data: unknown): void {
    try {
      const parsed = data as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object') {
        return;
      }

      // SERVER ping — client MUST reply {op:"pong"} (live-observed; ignoring
      // it gets the connection closed at the 150s staleness threshold)
      if (parsed.op === 'ping') {
        if (this.client?.isConnected()) {
          this.client.send({ op: 'pong' });
        }
        return;
      }

      // Subscribe/ping acks: {success, ret_msg, conn_id, request}
      if (typeof parsed.success === 'boolean') {
        if (parsed.success === false) {
          this.emit('error', new Error(`Apex WS request failed: ${JSON.stringify(parsed)}`));
        }
        return;
      }

      // Data frames route by topic
      if (typeof parsed.topic === 'string') {
        const subscription = this.subscriptions.get(parsed.topic);
        if (subscription?.active) {
          subscription.handler(parsed);
        }
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to handle message: ${String(error)}`));
    }
  }

  private sendClientPing(): void {
    if (!this.client?.isConnected()) {
      return;
    }
    this.client.send({ op: 'ping', args: [String(Date.now())] });
  }

  private startClientPing(): void {
    if (this.pingInterval) {
      return;
    }
    this.pingInterval = setInterval(() => {
      this.sendClientPing();
    }, APEX_WS_CLIENT_PING_INTERVAL_MS);
    // Don't hold the process open for the heartbeat
    this.pingInterval.unref?.();
  }

  private stopClientPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

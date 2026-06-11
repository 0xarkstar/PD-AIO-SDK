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
import type { StandxNormalizer } from './StandxNormalizer.js';
export interface StandxWebSocketDeps {
    readonly wsUrl: string;
    readonly normalizer: StandxNormalizer;
    /** unified → venue dash symbol ("BTC/USD:USD" → "BTC-USD") */
    readonly symbolToExchange: (symbol: string) => string;
}
export declare class StandxWebSocketWrapper extends EventEmitter {
    private readonly wsUrl;
    private readonly normalizer;
    private readonly symbolToExchange;
    private client;
    /** keyed by `${channel}:${exchangeSymbol}` */
    private readonly subscriptions;
    constructor(deps: StandxWebSocketDeps);
    /** Connect to the plain stream URL (idempotent; no auth, no query params) */
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    /**
     * Watch order book — depth_book is SNAPSHOT-ONLY: every frame is a full
     * self-contained book, so each frame normalizes (sorted) and emits directly.
     * `limit` is served by SLICING (the venue has no depth param).
     */
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    /** Watch trades — ONE trade object per public_trade frame */
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    /**
     * Watch ticker via the price channel — compact snapshot with REAL bid/ask
     * (spread tuple); 24h stats are not on this channel (tagged in info).
     */
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    private watch;
    private sendSubscribe;
    /**
     * After a reconnect: re-send all subscribes. depth_book is snapshot-only,
     * so the first post-reconnect frame fully rebuilds every consumer's view.
     */
    private resubscribeAll;
    private handleMessage;
}
//# sourceMappingURL=StandxWebSocketWrapper.d.ts.map
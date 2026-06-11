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
import type { ApexNormalizer } from './ApexNormalizer.js';
export interface ApexWebSocketDeps {
    readonly wsUrl: string;
    readonly normalizer: ApexNormalizer;
    /** unified → NO-DASH exchange symbol (WS topics) */
    readonly symbolToExchange: (symbol: string) => string;
}
export declare class ApexWebSocketWrapper extends EventEmitter {
    private readonly wsUrl;
    private readonly normalizer;
    private readonly symbolToExchange;
    private client;
    private readonly subscriptions;
    private readonly bookStates;
    private readonly seenTradeIds;
    private pingInterval;
    constructor(deps: ApexWebSocketDeps);
    /** Connect with the venue-required ?v=2&timestamp=<ms> query (idempotent) */
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    /**
     * Watch order book — maintains a stateful book from snapshot+delta frames
     * and emits a FULL unified OrderBook per frame. `limit` is served by
     * SLICING the maintained book (topic depth is 25 or 200).
     */
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    /**
     * Watch trades — the first frame is a recent-history snapshot; all trades
     * are deduped by uuid `i` across snapshot/delta overlap.
     */
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    /**
     * Watch ticker via instrumentInfo.H.{SYMBOL} — update-field-only semantics:
     * the snapshot carries the full object, deltas only changed fields. State is
     * merged per topic; a Ticker is emitted once enough fields accumulated.
     */
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    private processOrderBookFrame;
    private processTradesFrame;
    private watch;
    private sendSubscribe;
    private sendUnsubscribe;
    /** u-gap resync: unsubscribe + subscribe → server replies with a fresh snapshot */
    private resubscribeTopic;
    /** After a reconnect: books must rebuild from fresh snapshots */
    private resubscribeAll;
    private handleMessage;
    private sendClientPing;
    private startClientPing;
    private stopClientPing;
}
//# sourceMappingURL=ApexWebSocketWrapper.d.ts.map
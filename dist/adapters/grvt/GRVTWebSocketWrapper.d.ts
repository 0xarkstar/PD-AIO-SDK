/**
 * GRVT WebSocket wrapper (JSON-RPC).
 *
 * GRVT's WS is JSON-RPC over the `/ws` base path on the trades + market-data
 * hosts. Subscriptions are sent as:
 *   {"jsonrpc":"2.0","method":"subscribe",
 *    "params":{"stream":"v1.book.s","selectors":["BTC_USDT_Perp@500-50"]},"id":1}
 *
 * Public streams (market-data host): v1.{book.s,book.d,trade,ticker.s,mini.s}.
 * Private trade-data streams (trades host): v1.{order,fill,position} — these need
 * the `gravity` cookie + `X-Grvt-Account-Id` on connect (carried in the session).
 *
 * Feed frames carry `{ stream, feed, selector }`; the `feed` payload shape
 * matches REST exactly, so it is normalized via the same `GRVTNormalizer`.
 * Built on the SDK's typed `WebSocketClient` (auto-reconnect, Node/browser).
 */
import type { OrderBook, Trade, Ticker, Position, Order, Balance } from '../../types/common.js';
import type { GRVTSession } from './types.js';
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
 * AsyncGenerator-based GRVT WebSocket streaming wrapper.
 */
export declare class GRVTWebSocketWrapper {
    private static readonly MAX_QUEUE_SIZE;
    private readonly normalizer;
    private readonly logger;
    private readonly publicClient;
    private readonly tradeClient;
    private readonly session?;
    private nextId;
    constructor(config?: GRVTWebSocketConfig);
    /**
     * Connect the public market-data WebSocket.
     */
    connect(): Promise<void>;
    /**
     * Connect the private trade-data WebSocket (requires a session).
     */
    connectPrivate(): Promise<void>;
    /**
     * Disconnect both WebSockets.
     */
    disconnect(): void;
    /**
     * Whether the public WebSocket is connected.
     */
    get connected(): boolean;
    /**
     * Watch FULL order-book snapshots for a symbol (`v1.book.s`).
     */
    watchOrderBook(symbol: string, depth?: number): AsyncGenerator<OrderBook>;
    /**
     * Watch public trades for a symbol (`v1.trade`).
     */
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    /**
     * Watch ticker snapshots for a symbol (`v1.ticker.s`).
     */
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    /**
     * Watch position updates (`v1.position`; requires a session).
     */
    watchPositions(symbol?: string): AsyncGenerator<Position>;
    /**
     * Watch order updates (`v1.order`; requires a session).
     */
    watchOrders(symbol?: string): AsyncGenerator<Order>;
    /**
     * Watch user fills (`v1.fill`; requires a session).
     */
    watchMyTrades(symbol?: string): AsyncGenerator<Trade>;
    /**
     * Watch balance updates (derived from the position stream; requires a session).
     */
    watchBalance(): AsyncGenerator<Balance[]>;
    /**
     * Subscribe to one stream and yield normalized values until the generator is
     * closed. Frames for other streams/instruments are ignored; un-normalizable
     * frames are skipped (defensive).
     */
    private stream;
    /**
     * Build a JSON-RPC subscribe frame.
     */
    private subscribeFrame;
    /**
     * Parse a WS frame into `{ stream, feed }`, returning null on non-object input.
     */
    private parseFrame;
    /**
     * The private selector: the sub-account id, optionally scoped to an instrument.
     */
    private privateSelector;
    /**
     * Push with a bounded queue (drop oldest under backpressure).
     */
    private boundedPush;
    /**
     * @throws {Error} if no session is configured for a private stream.
     */
    private requireSession;
}
//# sourceMappingURL=GRVTWebSocketWrapper.d.ts.map
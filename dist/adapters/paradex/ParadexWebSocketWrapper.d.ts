/**
 * Paradex WebSocket Wrapper
 *
 * Provides AsyncGenerator-based streaming interfaces for real-time
 * market data and account updates using native WebSocket.
 *
 * Features:
 * - AsyncGenerator pattern for easy iteration
 * - Automatic reconnection with exponential backoff
 * - Data normalization
 * - Type-safe subscriptions
 *
 * @see https://docs.paradex.trade/websocket
 */
import type { OrderBook, Trade, Ticker, Position, Order, Balance } from '../../types/common.js';
/**
 * WebSocket configuration
 */
export interface ParadexWebSocketConfig {
    wsUrl: string;
    timeout?: number;
    maxReconnectAttempts?: number;
    apiKey?: string;
}
/**
 * Paradex WebSocket Wrapper
 *
 * Implements real-time data streaming using native WebSocket
 *
 * @example
 * ```typescript
 * const ws = new ParadexWebSocketWrapper({
 *   wsUrl: 'wss://ws.testnet.paradex.trade/v1',
 *   apiKey: 'your-api-key',
 * });
 *
 * await ws.connect();
 *
 * // Watch order book
 * for await (const orderBook of ws.watchOrderBook('BTC/USD:USD')) {
 *   console.log('Bid:', orderBook.bids[0]);
 *   console.log('Ask:', orderBook.asks[0]);
 * }
 * ```
 */
export declare class ParadexWebSocketWrapper {
    /** Maximum queue size for backpressure */
    private static readonly MAX_QUEUE_SIZE;
    private ws?;
    private readonly wsUrl;
    private readonly timeout;
    private readonly maxReconnectAttempts;
    private readonly normalizer;
    private readonly logger;
    private isConnected;
    private reconnectAttempts;
    private subscriptionId;
    private readonly subscriptions;
    private readonly subscriptionParams;
    private readonly messageQueue;
    /**
     * Push to queue with bounded size (backpressure)
     */
    private boundedPush;
    constructor(config: ParadexWebSocketConfig);
    /**
     * Connect to WebSocket
     *
     * @throws {PerpDEXError} If connection fails
     */
    connect(): Promise<void>;
    /**
     * Disconnect from WebSocket
     */
    disconnect(): void;
    /**
     * Watch order book updates for a symbol
     *
     * Subscribes to `order_book.{market}.snapshot@15@100ms`: each notification
     * is a full self-contained 15+15 snapshot (`update_type: "s"`), throttled
     * ~100ms (typically 2-4/s, gaps up to ~2s on a quiet book). Every yield is
     * a complete book — consumers self-diff. The incremental
     * `order_book.{market}.deltas` channel is DELTAS DEFERRED.
     *
     * @param symbol - Trading symbol in CCXT format (e.g., "BTC/USD:USD")
     * @param _depth - Ignored: depth is baked into the channel name and fixed
     *   at 15, the only live-verified variant (capture 2026-06-11)
     * @returns AsyncGenerator yielding full OrderBook snapshots
     */
    watchOrderBook(symbol: string, _depth?: number): AsyncGenerator<OrderBook>;
    /**
     * Watch public trades for a symbol
     *
     * @param symbol - Trading symbol in CCXT format
     * @returns AsyncGenerator yielding Trade updates
     */
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    /**
     * Watch ticker for a symbol
     *
     * @param symbol - Trading symbol in CCXT format
     * @returns AsyncGenerator yielding Ticker updates
     */
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    /**
     * Watch position updates for user account
     *
     * @param symbol - Optional symbol filter
     * @returns AsyncGenerator yielding Position updates
     */
    watchPositions(symbol?: string): AsyncGenerator<Position>;
    /**
     * Watch order updates for user account
     *
     * @param symbol - Optional symbol filter
     * @returns AsyncGenerator yielding Order updates
     */
    watchOrders(symbol?: string): AsyncGenerator<Order>;
    /**
     * Watch balance updates
     *
     * @returns AsyncGenerator yielding Balance array
     */
    watchBalance(): AsyncGenerator<Balance[]>;
    /**
     * Watch user trades (fills) in real-time
     *
     * @param symbol - Optional symbol filter
     * @returns AsyncGenerator yielding Trade updates
     */
    watchMyTrades(symbol?: string): AsyncGenerator<Trade>;
    /**
     * Subscribe to a channel
     */
    private subscribe;
    /**
     * Unsubscribe from a channel
     */
    private unsubscribe;
    /**
     * Handle incoming WebSocket message (strict JSON-RPC 2.0 envelope)
     *
     * Data notifications nest channel/data under `params`. Subscribe acks
     * (`result`) are logged only — NEVER gate data on the ack: a notification
     * can arrive BEFORE the ack (observed live: frame 0 = data, frame 1 = ack).
     */
    private handleMessage;
    /**
     * Handle disconnection and attempt reconnect
     */
    private handleDisconnect;
    /**
     * Check if WebSocket is connected
     */
    get connected(): boolean;
}
//# sourceMappingURL=ParadexWebSocketWrapper.d.ts.map
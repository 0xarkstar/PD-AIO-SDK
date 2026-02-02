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
    private readonly apiKey?;
    private readonly normalizer;
    private isConnected;
    private reconnectAttempts;
    private subscriptionId;
    private readonly subscriptions;
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
     * @param symbol - Trading symbol in CCXT format (e.g., "BTC/USD:USD")
     * @param depth - Order book depth (default: 50)
     * @returns AsyncGenerator yielding OrderBook updates
     */
    watchOrderBook(symbol: string, depth?: number): AsyncGenerator<OrderBook>;
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
     * Handle incoming WebSocket message
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
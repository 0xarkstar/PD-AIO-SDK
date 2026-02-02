/**
 * GRVT WebSocket Wrapper
 *
 * Wraps the @grvt/client WS class to provide AsyncGenerator-based
 * streaming interfaces for real-time market data and account updates.
 *
 * Features:
 * - AsyncGenerator pattern for easy iteration
 * - Automatic reconnection via SDK
 * - Data normalization
 * - Type-safe subscriptions
 */
import type { OrderBook, Trade, Position, Order, Balance, Ticker } from '../../types/common.js';
export interface GRVTWebSocketConfig {
    testnet?: boolean;
    subAccountId?: string;
    timeout?: number;
}
/**
 * WebSocket wrapper for GRVT real-time data streams
 */
export declare class GRVTWebSocketWrapper {
    /** Maximum queue size for backpressure */
    private static readonly MAX_QUEUE_SIZE;
    private readonly ws;
    private readonly normalizer;
    private readonly subAccountId?;
    private isConnected;
    /**
     * Push to queue with bounded size (backpressure)
     */
    private boundedPush;
    constructor(config?: GRVTWebSocketConfig);
    /**
     * Connect to WebSocket
     */
    connect(): Promise<void>;
    /**
     * Disconnect from WebSocket
     */
    disconnect(): void;
    /**
     * Watch order book updates for a symbol
     *
     * @param symbol - Trading symbol in CCXT format (e.g., "BTC/USDT:USDT")
     * @param depth - Order book depth (default: 50)
     * @returns AsyncGenerator yielding OrderBook updates
     *
     * @example
     * ```typescript
     * for await (const orderBook of wrapper.watchOrderBook('BTC/USDT:USDT')) {
     *   console.log('Bid:', orderBook.bids[0]);
     *   console.log('Ask:', orderBook.asks[0]);
     * }
     * ```
     */
    watchOrderBook(symbol: string, depth?: number): AsyncGenerator<OrderBook>;
    /**
     * Watch public trades for a symbol
     *
     * @param symbol - Trading symbol in CCXT format
     * @returns AsyncGenerator yielding Trade updates
     *
     * @example
     * ```typescript
     * for await (const trade of wrapper.watchTrades('BTC/USDT:USDT')) {
     *   console.log('Trade:', trade.price, trade.amount, trade.side);
     * }
     * ```
     */
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    /**
     * Watch position updates for user account
     *
     * @param symbol - Optional symbol filter (watch all positions if not provided)
     * @returns AsyncGenerator yielding Position updates
     *
     * @example
     * ```typescript
     * for await (const position of wrapper.watchPositions()) {
     *   console.log('Position:', position.symbol, position.size, position.unrealizedPnl);
     * }
     * ```
     */
    watchPositions(symbol?: string): AsyncGenerator<Position>;
    /**
     * Watch order updates for user account
     *
     * @param symbol - Optional symbol filter
     * @returns AsyncGenerator yielding Order updates
     *
     * @example
     * ```typescript
     * for await (const order of wrapper.watchOrders()) {
     *   console.log('Order:', order.id, order.status, order.filled);
     * }
     * ```
     */
    watchOrders(symbol?: string): AsyncGenerator<Order>;
    /**
     * Watch balance updates for user account
     *
     * @returns AsyncGenerator yielding Balance array
     *
     * @example
     * ```typescript
     * for await (const balances of wrapper.watchBalance()) {
     *   console.log('Balances:', balances);
     * }
     * ```
     */
    watchBalance(): AsyncGenerator<Balance[]>;
    /**
     * Watch ticker updates for a symbol
     *
     * GRVT doesn't have a dedicated ticker stream, so we derive ticker
     * from trade stream updates. Each trade update contains price info
     * that can be used to construct ticker-like updates.
     *
     * @param symbol - Trading symbol in CCXT format (e.g., "BTC/USDT:USDT")
     * @returns AsyncGenerator yielding Ticker updates
     *
     * @example
     * ```typescript
     * for await (const ticker of wrapper.watchTicker('BTC/USDT:USDT')) {
     *   console.log('Price:', ticker.last, 'Volume:', ticker.quoteVolume);
     * }
     * ```
     */
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    /**
     * Watch user trades (fills) in real-time
     *
     * @param symbol - Optional symbol filter
     * @returns AsyncGenerator yielding Trade updates
     *
     * @example
     * ```typescript
     * for await (const trade of wrapper.watchMyTrades()) {
     *   console.log('Fill:', trade.symbol, trade.side, trade.amount, '@', trade.price);
     * }
     * ```
     */
    watchMyTrades(symbol?: string): AsyncGenerator<Trade>;
    /**
     * Check if WebSocket is connected
     */
    get connected(): boolean;
}
//# sourceMappingURL=GRVTWebSocketWrapper.d.ts.map
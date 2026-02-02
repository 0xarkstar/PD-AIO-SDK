/**
 * Hyperliquid Exchange Adapter
 *
 * Implements IExchangeAdapter for Hyperliquid DEX
 */
import { Wallet } from 'ethers';
import type { Balance, ExchangeConfig, FeatureMap, FundingRate, Market, MarketParams, OHLCV, OHLCVParams, OHLCVTimeframe, Order, OrderBook, OrderBookParams, OrderRequest, Position, Ticker, Trade, TradeParams } from '../../types/index.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
export interface HyperliquidConfig extends ExchangeConfig {
    /** Ethereum wallet for signing */
    wallet?: Wallet;
    /** Private key (alternative to wallet) */
    privateKey?: string;
}
export declare class HyperliquidAdapter extends BaseAdapter {
    readonly id = "hyperliquid";
    readonly name = "Hyperliquid";
    readonly has: Partial<FeatureMap>;
    private apiUrl;
    private wsUrl;
    private wsManager?;
    private auth?;
    protected rateLimiter: RateLimiter;
    private normalizer;
    constructor(config?: HyperliquidConfig);
    initialize(): Promise<void>;
    disconnect(): Promise<void>;
    fetchMarkets(params?: MarketParams): Promise<Market[]>;
    fetchTicker(symbol: string): Promise<Ticker>;
    fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    /**
     * Fetch OHLCV (candlestick) data
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
     * @param timeframe - Candlestick timeframe
     * @param params - Optional parameters (since, until, limit)
     * @returns Array of OHLCV tuples [timestamp, open, high, low, close, volume]
     */
    fetchOHLCV(symbol: string, timeframe?: OHLCVTimeframe, params?: OHLCVParams): Promise<OHLCV[]>;
    /**
     * Get default duration based on timeframe for initial data fetch
     */
    private getDefaultDuration;
    fetchFundingRate(symbol: string): Promise<FundingRate>;
    fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(orderId: string, symbol?: string): Promise<Order>;
    cancelAllOrders(symbol?: string): Promise<Order[]>;
    fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]>;
    fetchPositions(symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    setLeverage(symbol: string, leverage: number): Promise<void>;
    fetchUserFees(): Promise<import('../../types/common.js').UserFees>;
    fetchPortfolio(): Promise<import('../../types/common.js').Portfolio>;
    fetchRateLimitStatus(): Promise<import('../../types/common.js').RateLimitStatus>;
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    watchPositions(): AsyncGenerator<Position[]>;
    /**
     * Watch open orders in real-time
     *
     * Subscribes to the USER_FILLS WebSocket channel and yields updated order lists
     * whenever fills occur. Provides real-time updates of the open order book.
     *
     * @returns AsyncGenerator that yields arrays of open orders
     * @throws {Error} If WebSocket manager or authentication is not initialized
     *
     * @example
     * ```typescript
     * // Watch for order updates
     * for await (const orders of adapter.watchOrders()) {
     *   console.log(`Current open orders: ${orders.length}`);
     *   orders.forEach(order => {
     *     console.log(`${order.symbol}: ${order.side} ${order.amount} @ ${order.price}`);
     *   });
     * }
     * ```
     */
    watchOrders(): AsyncGenerator<Order[]>;
    /**
     * Watch user trades (fills) in real-time
     *
     * Subscribes to the USER_FILLS WebSocket channel and yields each trade
     * as it occurs. Provides real-time fill notifications for the authenticated user.
     *
     * @param symbol - Optional symbol to filter trades (e.g., "BTC/USDT:USDT")
     * @returns AsyncGenerator that yields individual trades
     * @throws {Error} If WebSocket manager or authentication is not initialized
     *
     * @example
     * ```typescript
     * for await (const trade of adapter.watchMyTrades()) {
     *   console.log(`Filled: ${trade.side} ${trade.amount} ${trade.symbol} @ ${trade.price}`);
     * }
     * ```
     */
    watchMyTrades(symbol?: string): AsyncGenerator<Trade>;
    protected symbolToExchange(symbol: string): string;
    protected symbolFromExchange(exchangeSymbol: string): string;
    /**
     * Fetch open orders
     *
     * Retrieves all open (unfilled) orders for the authenticated user.
     * Can be filtered by symbol to get orders for a specific trading pair.
     *
     * @param symbol - Optional symbol to filter orders (e.g., "BTC/USDT:USDT")
     * @returns Array of open orders
     * @throws {Error} If authentication is required but not available
     *
     * @example
     * ```typescript
     * // Get all open orders
     * const allOrders = await adapter.fetchOpenOrders();
     *
     * // Get open orders for specific symbol
     * const ethOrders = await adapter.fetchOpenOrders('ETH/USDT:USDT');
     * ```
     */
    fetchOpenOrders(symbol?: string): Promise<Order[]>;
}
//# sourceMappingURL=HyperliquidAdapter.d.ts.map
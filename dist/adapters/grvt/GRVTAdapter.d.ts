/**
 * GRVT Exchange Adapter - Refactored with SDK Integration
 *
 * High-performance hybrid DEX with sub-millisecond latency
 *
 * Features:
 * - Official @grvt/client SDK integration
 * - REST API for trading and market data
 * - WebSocket for real-time updates
 * - API key + session cookie authentication
 * - EIP-712 signatures for orders
 * - Up to 100x leverage
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { Market, OHLCV, OHLCVParams, OHLCVTimeframe, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate, OrderRequest, MarketParams, OrderBookParams, TradeParams } from '../../types/common.js';
import type { FeatureMap } from '../../types/adapter.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { type GRVTAuthConfig } from './GRVTAuth.js';
/**
 * GRVT adapter configuration
 */
export interface GRVTConfig extends GRVTAuthConfig {
    testnet?: boolean;
    timeout?: number;
    debug?: boolean;
    /** Builder code for fee attribution */
    builderCode?: string;
    /** Enable/disable builder code (default: true when builderCode is set) */
    builderCodeEnabled?: boolean;
}
/**
 * @deprecated Use GRVTConfig instead
 */
export type GRVTAdapterConfig = GRVTConfig;
/**
 * GRVT Exchange Adapter
 */
export declare class GRVTAdapter extends BaseAdapter {
    readonly id = "grvt";
    readonly name = "GRVT";
    readonly has: Partial<FeatureMap>;
    private readonly sdk;
    private readonly auth;
    private readonly normalizer;
    private ws?;
    protected readonly rateLimiter: RateLimiter;
    private readonly testnet;
    private readonly builderCode?;
    private readonly builderCodeEnabled;
    constructor(config?: GRVTAdapterConfig);
    initialize(): Promise<void>;
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
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(orderId: string, _symbol?: string): Promise<Order>;
    cancelAllOrders(symbol?: string): Promise<Order[]>;
    fetchOpenOrders(symbol?: string): Promise<Order[]>;
    /**
     * Fetch order history - NOW IMPLEMENTED via SDK!
     */
    fetchOrderHistory(symbol?: string, _since?: number, limit?: number): Promise<Order[]>;
    /**
     * Fetch user trade history - NOW IMPLEMENTED via SDK!
     */
    fetchMyTrades(symbol?: string, _since?: number, limit?: number): Promise<Trade[]>;
    fetchPositions(symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    private mapOrderType;
    private mapTimeInForce;
    fetchFundingRateHistory(_symbol: string, _since?: number, _limit?: number): Promise<FundingRate[]>;
    setLeverage(symbol: string, leverage: number): Promise<void>;
    symbolToExchange(symbol: string): string;
    symbolFromExchange(exchangeSymbol: string): string;
    /**
     * Initialize WebSocket connection if not already initialized
     */
    private ensureWebSocket;
    /**
     * Watch order book updates in real-time
     *
     * @param symbol - Trading symbol (e.g., "BTC/USDT:USDT")
     * @param limit - Order book depth (default: 50)
     * @returns AsyncGenerator yielding OrderBook updates
     *
     * @example
     * ```typescript
     * for await (const orderBook of adapter.watchOrderBook('BTC/USDT:USDT')) {
     *   console.log('Best bid:', orderBook.bids[0]);
     *   console.log('Best ask:', orderBook.asks[0]);
     * }
     * ```
     */
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    /**
     * Watch public trades in real-time
     *
     * @param symbol - Trading symbol
     * @returns AsyncGenerator yielding Trade updates
     *
     * @example
     * ```typescript
     * for await (const trade of adapter.watchTrades('BTC/USDT:USDT')) {
     *   console.log('Trade:', trade.price, trade.amount, trade.side);
     * }
     * ```
     */
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    /**
     * Watch position updates in real-time
     *
     * @returns AsyncGenerator yielding Position array updates
     *
     * @example
     * ```typescript
     * for await (const positions of adapter.watchPositions()) {
     *   for (const position of positions) {
     *     console.log('Position:', position.symbol, position.size, position.unrealizedPnl);
     *   }
     * }
     * ```
     */
    watchPositions(): AsyncGenerator<Position[]>;
    /**
     * Watch order updates in real-time
     *
     * @returns AsyncGenerator yielding Order array updates
     *
     * @example
     * ```typescript
     * for await (const orders of adapter.watchOrders()) {
     *   for (const order of orders) {
     *     console.log('Order update:', order.id, order.status, order.filled);
     *   }
     * }
     * ```
     */
    watchOrders(): AsyncGenerator<Order[]>;
    /**
     * Watch ticker updates in real-time
     *
     * @param symbol - Trading symbol (e.g., "BTC/USDT:USDT")
     * @returns AsyncGenerator yielding Ticker updates
     *
     * @example
     * ```typescript
     * for await (const ticker of adapter.watchTicker('BTC/USDT:USDT')) {
     *   console.log('Price:', ticker.last);
     * }
     * ```
     */
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    /**
     * Watch balance updates in real-time
     *
     * @returns AsyncGenerator yielding Balance array
     *
     * @example
     * ```typescript
     * for await (const balances of adapter.watchBalance()) {
     *   console.log('Balance update:', balances);
     * }
     * ```
     */
    watchBalance(): AsyncGenerator<Balance[]>;
    /**
     * Watch user trades (fills) in real-time
     *
     * @param symbol - Optional symbol filter
     * @returns AsyncGenerator yielding Trade updates
     *
     * @example
     * ```typescript
     * for await (const trade of adapter.watchMyTrades()) {
     *   console.log('Fill:', trade.symbol, trade.side, trade.amount, '@', trade.price);
     * }
     * ```
     */
    watchMyTrades(symbol?: string): AsyncGenerator<Trade>;
    /**
     * Close WebSocket connection
     */
    disconnect(): Promise<void>;
}
//# sourceMappingURL=GRVTAdapter.d.ts.map
/**
 * Extended Exchange Adapter
 *
 * StarkNet-based hybrid CLOB perpetual DEX adapter
 *
 * ## Implementation Status
 *
 * ### Fully Implemented ✅
 * - **Market Data**: fetchMarkets, fetchTicker, fetchOrderBook, fetchTrades, fetchFundingRate
 * - **Trading**: createOrder, cancelOrder, cancelAllOrders, createBatchOrders, cancelBatchOrders
 * - **Account**: fetchPositions, fetchBalance, fetchOrderHistory, fetchMyTrades, fetchUserFees
 * - **Leverage**: setLeverage (up to 100x), setMarginMode (cross/isolated)
 * - **WebSocket**: watchOrderBook, watchTrades, watchTicker, watchPositions, watchOrders, watchBalance, watchFundingRate
 *
 * ### Example Usage
 * ```typescript
 * const adapter = createExchange('extended', {
 *   apiKey: 'your-api-key',
 *   starknetPrivateKey: '0x...',
 *   starknetAccountAddress: '0x...',
 *   testnet: true
 * });
 * await adapter.initialize();
 *
 * // REST API
 * const markets = await adapter.fetchMarkets();
 * const order = await adapter.createOrder({ ... });
 *
 * // WebSocket streaming
 * for await (const orderbook of adapter.watchOrderBook('BTC/USD:USD')) {
 *   console.log('Order book update:', orderbook);
 * }
 *
 * // Private WebSocket (requires API key)
 * for await (const positions of adapter.watchPositions()) {
 *   console.log('Position update:', positions);
 * }
 * ```
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate, OrderRequest, MarketParams, OrderBookParams, TradeParams, Transaction, UserFees, Portfolio, RateLimitStatus } from '../../types/common.js';
import type { FeatureMap } from '../../types/adapter.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
/**
 * Extended adapter configuration
 *
 * Extended is a hybrid CLOB DEX on StarkNet supporting up to 100x leverage.
 *
 * Authentication:
 * - apiKey: Required for trading and account data (createOrder, fetchBalance, etc.)
 * - starknetPrivateKey + starknetAccountAddress: Optional, for on-chain StarkNet transactions
 *
 * Note: Market data methods (fetchMarkets, fetchTicker, etc.) work without authentication.
 */
export interface ExtendedConfig {
    /** API key for trading and account access (required for authenticated endpoints) */
    apiKey?: string;
    /** Use testnet environment (default: false) */
    testnet?: boolean;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** StarkNet private key for on-chain transactions (optional) */
    starknetPrivateKey?: string;
    /** StarkNet account address (required if starknetPrivateKey is provided) */
    starknetAccountAddress?: string;
    /** Custom StarkNet RPC URL */
    starknetRpcUrl?: string;
}
/**
 * Extended exchange adapter
 *
 * Hybrid CLOB perpetual DEX on StarkNet with up to 100x leverage
 */
export declare class ExtendedAdapter extends BaseAdapter {
    readonly id = "extended";
    readonly name = "Extended";
    readonly has: Partial<FeatureMap>;
    private readonly apiUrl;
    private readonly wsUrl;
    private readonly apiKey?;
    protected readonly rateLimiter: RateLimiter;
    protected readonly httpClient: HTTPClient;
    private readonly normalizer;
    private readonly starkNetClient?;
    private wsManager;
    private wsWrapper?;
    constructor(config?: ExtendedConfig);
    initialize(): Promise<void>;
    disconnect(): Promise<void>;
    /**
     * Convert unified symbol to Extended format
     */
    protected symbolToExchange(symbol: string): string;
    /**
     * Convert Extended symbol to unified format
     */
    protected symbolFromExchange(exchangeSymbol: string): string;
    fetchMarkets(params?: MarketParams): Promise<Market[]>;
    fetchTicker(symbol: string): Promise<Ticker>;
    fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    fetchFundingRate(symbol: string): Promise<FundingRate>;
    fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(orderId: string, symbol?: string): Promise<Order>;
    cancelAllOrders(symbol?: string): Promise<Order[]>;
    createBatchOrders(requests: OrderRequest[]): Promise<Order[]>;
    cancelBatchOrders(orderIds: string[], symbol?: string): Promise<Order[]>;
    editOrder(orderId: string, symbol: string, type: 'market' | 'limit', side: 'buy' | 'sell', amount?: number, price?: number): Promise<Order>;
    fetchPositions(symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    setLeverage(symbol: string, leverage: number): Promise<void>;
    setMarginMode(symbol: string, marginMode: 'cross' | 'isolated'): Promise<void>;
    fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]>;
    fetchDeposits(currency?: string, since?: number, limit?: number): Promise<Transaction[]>;
    fetchWithdrawals(currency?: string, since?: number, limit?: number): Promise<Transaction[]>;
    fetchUserFees(): Promise<UserFees>;
    fetchPortfolio(): Promise<Portfolio>;
    fetchRateLimitStatus(): Promise<RateLimitStatus>;
    /**
     * Ensure WebSocket is connected and return the wrapper
     */
    private ensureWebSocketConnected;
    /**
     * Watch real-time order book updates
     */
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    /**
     * Watch real-time trade updates
     */
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    /**
     * Watch real-time ticker updates
     */
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    /**
     * Watch real-time position updates (requires API key)
     */
    watchPositions(): AsyncGenerator<Position[]>;
    /**
     * Watch real-time order updates (requires API key)
     */
    watchOrders(): AsyncGenerator<Order[]>;
    /**
     * Watch real-time balance updates (requires API key)
     */
    watchBalance(): AsyncGenerator<Balance[]>;
    /**
     * Watch real-time funding rate updates
     */
    watchFundingRate(symbol: string): AsyncGenerator<FundingRate>;
    /**
     * Build query string from parameters
     */
    private buildQueryString;
}
//# sourceMappingURL=ExtendedAdapter.d.ts.map
/**
 * Variational Exchange Adapter
 *
 * Arbitrum-based RFQ perpetual DEX adapter
 *
 * ## Implementation Status: FULLY FUNCTIONAL 🟢
 *
 * Variational is an RFQ (Request For Quote) based perpetual DEX on Arbitrum.
 * This adapter supports public market data, trading, and account operations.
 *
 * ### Currently Implemented
 *
 * **Public API:**
 * - ✅ `fetchMarkets()` - Get available trading pairs
 * - ✅ `fetchTicker(symbol)` - Get price information for a symbol
 * - ✅ `fetchOrderBook(symbol)` - Get RFQ quotes as order book
 * - ✅ `fetchFundingRate(symbol)` - Get current funding rate
 *
 * **Trading API (requires API credentials):**
 * - ✅ `createOrder(request)` - Create a new order
 * - ✅ `cancelOrder(orderId)` - Cancel an order
 * - ✅ `cancelAllOrders(symbol?)` - Cancel all orders
 *
 * **Account API (requires API credentials):**
 * - ✅ `fetchPositions(symbols?)` - Get open positions
 * - ✅ `fetchBalance()` - Get account balances
 * - ✅ `fetchOrderHistory(symbol?, since?, limit?)` - Get order history
 * - ✅ `fetchMyTrades(symbol?, since?, limit?)` - Get user trades
 *
 * **RFQ-Specific Methods:**
 * - ✅ `requestQuote(symbol, side, amount)` - Request quotes from market makers
 * - ✅ `acceptQuote(quoteId)` - Accept a quote and execute trade
 *
 * ### Not Yet Implemented
 * - ❌ Public API: fetchTrades, fetchFundingRateHistory
 * - ❌ WebSocket: All streaming methods
 *
 * ### RFQ Order Book Note
 * Unlike traditional order book exchanges, Variational uses an RFQ model.
 * The "order book" is constructed from quotes at different notional sizes
 * ($1k, $100k, $1M), representing available liquidity at each price level.
 *
 * ### Usage
 * ```typescript
 * const adapter = createExchange('variational', {
 *   apiKey: 'your-api-key',
 *   apiSecret: 'your-api-secret',
 *   testnet: true,
 * });
 * await adapter.initialize();
 *
 * // Public API:
 * const markets = await adapter.fetchMarkets();
 * const ticker = await adapter.fetchTicker('BTC/USDC:USDC');
 * const orderbook = await adapter.fetchOrderBook('BTC/USDC:USDC');
 *
 * // Account API:
 * const positions = await adapter.fetchPositions();
 * const balance = await adapter.fetchBalance();
 * const history = await adapter.fetchOrderHistory();
 *
 * // RFQ Trading:
 * const quotes = await adapter.requestQuote('BTC/USDC:USDC', 'buy', 0.1);
 * const order = await adapter.acceptQuote(quotes[0].quoteId);
 *
 * // Standard Trading:
 * const order = await adapter.createOrder({
 *   symbol: 'BTC/USDC:USDC',
 *   type: 'limit',
 *   side: 'buy',
 *   amount: 0.1,
 *   price: 95000,
 * });
 * ```
 *
 * @see https://variational.io/ - Variational official website
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate, OrderRequest, MarketParams, OrderBookParams, TradeParams, Transaction, UserFees, Portfolio, RateLimitStatus } from '../../types/common.js';
import type { FeatureMap } from '../../types/adapter.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import type { VariationalQuote } from './types.js';
/**
 * Variational adapter configuration
 */
export interface VariationalConfig {
    apiKey?: string;
    apiSecret?: string;
    testnet?: boolean;
    timeout?: number;
    rateLimitTier?: 'perIp' | 'global' | 'default';
}
/**
 * Variational exchange adapter
 *
 * RFQ-based perpetual DEX on Arbitrum with HMAC-SHA256 authentication
 */
export declare class VariationalAdapter extends BaseAdapter {
    readonly id = "variational";
    readonly name = "Variational";
    readonly has: Partial<FeatureMap>;
    private readonly apiUrl;
    private readonly wsUrl;
    private readonly apiKey?;
    private readonly apiSecret?;
    protected readonly rateLimiter: RateLimiter;
    protected readonly httpClient: HTTPClient;
    private readonly normalizer;
    private wsManager;
    constructor(config?: VariationalConfig);
    initialize(): Promise<void>;
    disconnect(): Promise<void>;
    /**
     * Convert unified symbol to Variational format
     */
    protected symbolToExchange(symbol: string): string;
    /**
     * Convert Variational symbol to unified format
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
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    watchPositions(): AsyncGenerator<Position[]>;
    watchOrders(): AsyncGenerator<Order[]>;
    watchBalance(): AsyncGenerator<Balance[]>;
    watchFundingRate(symbol: string): AsyncGenerator<FundingRate>;
    /**
     * Request quotes from market makers (RFQ-specific)
     *
     * This method requests quotes from Variational's market makers for a specific
     * trade size. The quotes will expire after a short period (typically 10 seconds).
     *
     * @param symbol - Trading pair in unified format (e.g., "BTC/USDC:USDC")
     * @param side - Trade direction ('buy' or 'sell')
     * @param amount - Trade size in base currency
     * @returns Array of quotes from market makers
     */
    requestQuote(symbol: string, side: 'buy' | 'sell', amount: number): Promise<VariationalQuote[]>;
    /**
     * Accept a quote and execute trade (RFQ-specific)
     *
     * After receiving quotes from requestQuote(), use this method to accept
     * a specific quote and execute the trade. The quote must not be expired.
     *
     * @param quoteId - The ID of the quote to accept
     * @returns The resulting order from accepting the quote
     */
    acceptQuote(quoteId: string): Promise<Order>;
    /**
     * Ensure API credentials are configured
     */
    private ensureAuthenticated;
    /**
     * Generate HMAC-SHA256 signature for authenticated requests
     * Note: This is now async to support browser Web Crypto API
     */
    private generateSignature;
    /**
     * Make an authenticated request to the Variational API
     *
     * All authenticated requests include:
     * - X-API-Key: The API key
     * - X-Timestamp: Unix timestamp in milliseconds
     * - X-Signature: HMAC-SHA256 signature
     */
    private authenticatedRequest;
}
//# sourceMappingURL=VariationalAdapter.d.ts.map
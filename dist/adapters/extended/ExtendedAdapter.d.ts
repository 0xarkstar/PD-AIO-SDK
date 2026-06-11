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
 * - **WebSocket** (live per-stream protocol, capture 2026-06-11):
 *   watchOrderBook, watchTrades — public keyless streams
 *   (`{base}/orderbooks/{market}`, `{base}/publicTrades/{market}`; the HTTP
 *   upgrade IS the subscription)
 *
 * ### NOT Implemented (has=false, BaseAdapter NOT_SUPPORTED throwers) ❌
 * - **WebSocket**: watchTicker, watchPositions, watchOrders, watchBalance,
 *   watchFundingRate — the previous all-true flags described a fictional
 *   multiplexed protocol on a dead host (NXDOMAIN). The venue funding stream
 *   exists but is explicitly out of scope for this repair; private/account
 *   streams were never verified.
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
 * // WebSocket streaming (public, keyless)
 * for await (const orderbook of adapter.watchOrderBook('BTC/USD:USD')) {
 *   console.log('Order book update:', orderbook);
 * }
 * ```
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate, OrderRequest, MarketParams, OrderBookParams, TradeParams, Transaction, UserFees, Portfolio, RateLimitStatus } from '../../types/common.js';
import type { FeatureMap, IExchangeAdapter } from '../../types/adapter.js';
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
export declare class ExtendedAdapter extends BaseAdapter implements IExchangeAdapter {
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
    fetchMarkets(_params?: MarketParams): Promise<Market[]>;
    _fetchTicker(symbol: string): Promise<Ticker>;
    _fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    _fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    _fetchFundingRate(symbol: string): Promise<FundingRate>;
    fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(orderId: string, _symbol?: string): Promise<Order>;
    cancelAllOrders(symbol?: string): Promise<Order[]>;
    createBatchOrders(requests: OrderRequest[]): Promise<Order[]>;
    cancelBatchOrders(orderIds: string[], _symbol?: string): Promise<Order[]>;
    editOrder(orderId: string, symbol: string, type: 'market' | 'limit', side: 'buy' | 'sell', amount?: number, price?: number): Promise<Order>;
    fetchPositions(symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    _setLeverage(symbol: string, leverage: number): Promise<void>;
    setMarginMode(symbol: string, marginMode: 'cross' | 'isolated'): Promise<void>;
    fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]>;
    fetchDeposits(_currency?: string, _since?: number, _limit?: number): Promise<Transaction[]>;
    fetchWithdrawals(_currency?: string, _since?: number, _limit?: number): Promise<Transaction[]>;
    fetchUserFees(): Promise<UserFees>;
    fetchPortfolio(): Promise<Portfolio>;
    fetchRateLimitStatus(): Promise<RateLimitStatus>;
    /**
     * Ensure the WebSocket wrapper exists and return it
     *
     * Passes the STREAM BASE (`{base}` = EXTENDED_API_URLS.*.websocket); the
     * wrapper composes the per-stream URL `{base}/{stream}/{market}` and the
     * HTTP upgrade itself is the subscription — there is no upfront connect,
     * no auth frame and no JSON heartbeat on this venue.
     */
    private ensureWebSocketConnected;
    /**
     * Watch real-time order book updates (public, keyless)
     *
     * Full unified book per frame (SNAPSHOT seed + DELTA apply); `limit` is
     * served by slicing the maintained book.
     */
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    /**
     * Watch real-time trade updates (public, keyless)
     *
     * The first frame per connection (historical backfill) is skipped;
     * LIQUIDATION/DELEVERAGE flow is kept, tagged via `info.tT`.
     */
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    /**
     * Build query string from parameters
     */
    private buildQueryString;
}
//# sourceMappingURL=ExtendedAdapter.d.ts.map
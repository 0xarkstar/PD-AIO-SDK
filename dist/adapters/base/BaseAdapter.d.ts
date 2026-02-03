/**
 * Base Exchange Adapter
 *
 * Abstract base class providing common functionality for all adapters
 */
import type { Balance, Currency, ExchangeConfig, ExchangeStatus, FeatureMap, FundingPayment, FundingRate, IAuthStrategy, IExchangeAdapter, LedgerEntry, Market, MarketParams, OHLCV, OHLCVParams, OHLCVTimeframe, Order, OrderBook, OrderBookParams, OrderRequest, OrderSide, OrderType, Portfolio, Position, RateLimitStatus, Ticker, Trade, TradeParams, Transaction, UserFees } from '../../types/index.js';
import type { HealthCheckConfig, HealthCheckResult, ComponentHealth } from '../../types/health.js';
import type { APIMetrics, MetricsSnapshot } from '../../types/metrics.js';
import { Logger } from '../../core/logger.js';
import { CircuitBreaker } from '../../core/CircuitBreaker.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { PrometheusMetrics } from '../../monitoring/prometheus.js';
export declare abstract class BaseAdapter implements IExchangeAdapter {
    abstract readonly id: string;
    abstract readonly name: string;
    abstract readonly has: Partial<FeatureMap>;
    protected _isReady: boolean;
    protected _isDisconnected: boolean;
    protected readonly config: ExchangeConfig;
    protected authStrategy?: IAuthStrategy;
    protected rateLimiter?: any;
    private _logger?;
    protected circuitBreaker: CircuitBreaker;
    protected httpClient?: HTTPClient;
    protected prometheusMetrics?: PrometheusMetrics;
    protected timers: Set<NodeJS.Timeout>;
    protected intervals: Set<NodeJS.Timeout>;
    protected abortControllers: Set<AbortController>;
    protected marketCache: Market[] | null;
    protected marketCacheExpiry: number;
    protected marketCacheTTL: number;
    protected metrics: APIMetrics;
    constructor(config?: ExchangeConfig);
    /**
     * Get logger instance (lazy initialization with adapter name as context)
     */
    protected get logger(): Logger;
    get isReady(): boolean;
    /**
     * Check if adapter has been disconnected
     */
    isDisconnected(): boolean;
    abstract initialize(): Promise<void>;
    /**
     * Disconnect and cleanup all resources
     *
     * Subclasses should override and call super.disconnect() at the end
     */
    disconnect(): Promise<void>;
    /**
     * Clear all cached data
     */
    clearCache(): void;
    /**
     * Preload market data with configurable TTL
     *
     * @param options - Configuration options
     * @param options.ttl - Time-to-live for cache in milliseconds (default: 5 minutes)
     * @param options.params - Additional parameters to pass to fetchMarkets()
     *
     * @example
     * ```typescript
     * // Preload markets with 10-minute cache
     * await exchange.preloadMarkets({ ttl: 600000 });
     *
     * // Later calls to fetchMarkets() will use cached data
     * const markets = await exchange.fetchMarkets(); // Uses cache
     * ```
     */
    preloadMarkets(options?: {
        ttl?: number;
        params?: MarketParams;
    }): Promise<void>;
    /**
     * Get preloaded markets if cache is still valid
     *
     * @returns Cached markets if available and not expired, null otherwise
     *
     * @example
     * ```typescript
     * const cached = exchange.getPreloadedMarkets();
     * if (cached) {
     *   console.log('Using cached markets:', cached.length);
     * } else {
     *   console.log('Cache expired or empty, fetching fresh data');
     * }
     * ```
     */
    getPreloadedMarkets(): Market[] | null;
    /**
     * Fetch markets from API (bypasses cache)
     * Subclasses should implement this instead of fetchMarkets()
     */
    protected fetchMarketsFromAPI(params?: MarketParams): Promise<Market[]>;
    /**
     * Perform health check on exchange adapter
     */
    healthCheck(config?: HealthCheckConfig): Promise<HealthCheckResult>;
    /**
     * Check API health by making a lightweight request
     */
    protected checkApiHealth(timeout: number): Promise<ComponentHealth>;
    /**
     * Perform exchange-specific API health check
     * Subclasses should override this for optimal lightweight check
     */
    protected performApiHealthCheck(): Promise<void>;
    /**
     * Check WebSocket health
     * Subclasses should override if they use WebSocket
     */
    protected checkWebSocketHealth(): Promise<{
        connected: boolean;
        reconnecting: boolean;
    }>;
    /**
     * Check authentication health
     * Subclasses should override for auth-specific checks
     */
    protected checkAuthHealth(): Promise<{
        valid: boolean;
        expiresAt?: number;
        expiresIn?: number;
        needsRefresh?: boolean;
    }>;
    /**
     * Get current rate limit status
     */
    protected getRateLimitStatus(): {
        remaining: number;
        limit: number;
        resetAt: number;
        percentUsed: number;
    } | undefined;
    abstract fetchMarkets(params?: MarketParams): Promise<Market[]>;
    abstract fetchTicker(symbol: string): Promise<Ticker>;
    abstract fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    abstract fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    abstract fetchFundingRate(symbol: string): Promise<FundingRate>;
    abstract fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;
    /**
     * Fetch OHLCV (candlestick) data
     * Default implementation throws if not supported by exchange
     */
    fetchOHLCV(symbol: string, timeframe: OHLCVTimeframe, params?: OHLCVParams): Promise<OHLCV[]>;
    /**
     * Fetch multiple tickers at once
     * Default implementation fetches tickers sequentially
     */
    fetchTickers(symbols?: string[]): Promise<Record<string, Ticker>>;
    /**
     * Fetch available currencies
     * Default implementation throws if not supported
     */
    fetchCurrencies(): Promise<Record<string, Currency>>;
    /**
     * Fetch exchange status
     * Default implementation returns 'ok' if fetchMarkets succeeds
     */
    fetchStatus(): Promise<ExchangeStatus>;
    /**
     * Fetch exchange server time
     * Default implementation returns local time (not recommended)
     */
    fetchTime(): Promise<number>;
    abstract createOrder(request: OrderRequest): Promise<Order>;
    abstract cancelOrder(orderId: string, symbol?: string): Promise<Order>;
    abstract cancelAllOrders(symbol?: string): Promise<Order[]>;
    abstract fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    abstract fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]>;
    /**
     * Fetch deposit history
     * Default implementation throws if not supported by exchange
     */
    fetchDeposits(currency?: string, since?: number, limit?: number): Promise<Transaction[]>;
    /**
     * Fetch withdrawal history
     * Default implementation throws if not supported by exchange
     */
    fetchWithdrawals(currency?: string, since?: number, limit?: number): Promise<Transaction[]>;
    /**
     * Fetch account ledger (transaction history)
     * Default implementation throws if not supported by exchange
     */
    fetchLedger(currency?: string, since?: number, limit?: number, params?: Record<string, unknown>): Promise<LedgerEntry[]>;
    /**
     * Fetch funding payment history
     * Default implementation throws if not supported by exchange
     */
    fetchFundingHistory(symbol?: string, since?: number, limit?: number): Promise<FundingPayment[]>;
    /**
     * Create multiple orders in batch
     *
     * If the exchange supports native batch creation (has.createBatchOrders === true),
     * subclasses should override this method. Otherwise, falls back to sequential creation.
     *
     * @param requests - Array of order requests
     * @returns Array of created orders
     *
     * @example
     * ```typescript
     * const orders = await exchange.createBatchOrders([
     *   { symbol: 'BTC/USDT:USDT', side: 'buy', type: 'limit', amount: 0.1, price: 50000 },
     *   { symbol: 'ETH/USDT:USDT', side: 'buy', type: 'limit', amount: 1.0, price: 3000 },
     * ]);
     * ```
     */
    createBatchOrders(requests: OrderRequest[]): Promise<Order[]>;
    /**
     * Cancel multiple orders in batch
     *
     * If the exchange supports native batch cancellation (has.cancelBatchOrders === true),
     * subclasses should override this method. Otherwise, falls back to sequential cancellation.
     *
     * @param orderIds - Array of order IDs to cancel
     * @param symbol - Optional symbol (required for some exchanges)
     * @returns Array of canceled orders
     *
     * @example
     * ```typescript
     * const canceled = await exchange.cancelBatchOrders([
     *   'order-123',
     *   'order-456',
     *   'order-789',
     * ], 'BTC/USDT:USDT');
     * ```
     */
    cancelBatchOrders(orderIds: string[], symbol?: string): Promise<Order[]>;
    /**
     * Edit/modify an existing order
     * Default implementation throws if not supported
     */
    editOrder(orderId: string, symbol: string, type: OrderType, side: OrderSide, amount?: number, price?: number, params?: Record<string, unknown>): Promise<Order>;
    /**
     * Fetch a single order by ID
     * Default implementation throws if not supported
     */
    fetchOrder(orderId: string, symbol?: string): Promise<Order>;
    /**
     * Fetch all open/pending orders
     * Default implementation throws if not supported
     */
    fetchOpenOrders(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    /**
     * Fetch closed (filled/canceled) orders
     * Default implementation throws if not supported
     */
    fetchClosedOrders(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    /**
     * Create a limit buy order
     */
    createLimitBuyOrder(symbol: string, amount: number, price: number, params?: Record<string, unknown>): Promise<Order>;
    /**
     * Create a limit sell order
     */
    createLimitSellOrder(symbol: string, amount: number, price: number, params?: Record<string, unknown>): Promise<Order>;
    /**
     * Create a market buy order
     */
    createMarketBuyOrder(symbol: string, amount: number, params?: Record<string, unknown>): Promise<Order>;
    /**
     * Create a market sell order
     */
    createMarketSellOrder(symbol: string, amount: number, params?: Record<string, unknown>): Promise<Order>;
    /**
     * Create a stop loss order
     */
    createStopLossOrder(symbol: string, amount: number, stopPrice: number, params?: Record<string, unknown>): Promise<Order>;
    /**
     * Create a take profit order
     */
    createTakeProfitOrder(symbol: string, amount: number, takeProfitPrice: number, params?: Record<string, unknown>): Promise<Order>;
    abstract fetchPositions(symbols?: string[]): Promise<Position[]>;
    abstract fetchBalance(): Promise<Balance[]>;
    abstract setLeverage(symbol: string, leverage: number): Promise<void>;
    setMarginMode(symbol: string, marginMode: 'cross' | 'isolated'): Promise<void>;
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    watchTickers(symbols?: string[]): AsyncGenerator<Ticker>;
    watchPositions(): AsyncGenerator<Position[]>;
    watchOrders(): AsyncGenerator<Order[]>;
    watchBalance(): AsyncGenerator<Balance[]>;
    watchFundingRate(symbol: string): AsyncGenerator<FundingRate>;
    watchOHLCV(symbol: string, timeframe: OHLCVTimeframe): AsyncGenerator<OHLCV>;
    watchMyTrades(symbol?: string): AsyncGenerator<Trade>;
    /**
     * Fetch user fee rates
     * Default implementation throws if not supported by exchange
     */
    fetchUserFees(): Promise<UserFees>;
    /**
     * Fetch portfolio performance metrics
     * Default implementation throws if not supported by exchange
     */
    fetchPortfolio(): Promise<Portfolio>;
    /**
     * Fetch current rate limit status
     * Default implementation throws if not supported by exchange
     */
    fetchRateLimitStatus(): Promise<RateLimitStatus>;
    /**
     * Check if a feature is supported
     */
    protected supportsFeature(feature: keyof FeatureMap): boolean;
    /**
     * Ensure adapter is initialized
     */
    protected ensureInitialized(): void;
    /**
     * Convert unified symbol to exchange-specific format
     * Must be implemented by subclass
     */
    protected abstract symbolToExchange(symbol: string): string;
    /**
     * Convert exchange-specific symbol to unified format
     * Must be implemented by subclass
     */
    protected abstract symbolFromExchange(exchangeSymbol: string): string;
    /**
     * Make HTTP request with timeout, circuit breaker, retry, and metrics tracking
     */
    protected request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: unknown, headers?: Record<string, string>): Promise<T>;
    /**
     * Register a timer for cleanup tracking
     */
    protected registerTimer(timer: NodeJS.Timeout): void;
    /**
     * Register an interval for cleanup tracking
     */
    protected registerInterval(interval: NodeJS.Timeout): void;
    /**
     * Unregister and clear a timer
     */
    protected unregisterTimer(timer: NodeJS.Timeout): void;
    /**
     * Unregister and clear an interval
     */
    protected unregisterInterval(interval: NodeJS.Timeout): void;
    /**
     * Extract endpoint path from URL for metrics tracking
     */
    protected extractEndpoint(url: string): string;
    /**
     * Update per-endpoint metrics
     */
    protected updateEndpointMetrics(endpointKey: string, latency: number, isError: boolean): void;
    /**
     * Update rolling average latency
     */
    protected updateAverageLatency(latency: number): void;
    /**
     * Get current metrics snapshot
     *
     * @returns Metrics snapshot with aggregated statistics
     *
     * @example
     * ```typescript
     * const metrics = exchange.getMetrics();
     * console.log(`Success rate: ${(metrics.successRate * 100).toFixed(2)}%`);
     * console.log(`Average latency: ${metrics.averageLatency.toFixed(2)}ms`);
     * ```
     */
    getMetrics(): MetricsSnapshot;
    /**
     * Get circuit breaker metrics
     *
     * @returns Circuit breaker metrics including state and performance stats
     *
     * @example
     * ```typescript
     * const cbMetrics = exchange.getCircuitBreakerMetrics();
     * console.log(`Circuit state: ${cbMetrics.state}`);
     * console.log(`Error rate: ${(cbMetrics.errorRate * 100).toFixed(2)}%`);
     * ```
     */
    getCircuitBreakerMetrics(): import("../../core/CircuitBreaker.js").CircuitBreakerMetrics;
    /**
     * Get circuit breaker state
     *
     * @returns Current circuit state: 'CLOSED', 'OPEN', or 'HALF_OPEN'
     */
    getCircuitBreakerState(): import("../../core/CircuitBreaker.js").CircuitState;
    /**
     * Reset all metrics to initial state
     *
     * @example
     * ```typescript
     * exchange.resetMetrics();
     * // All counters reset, collection starts fresh
     * ```
     */
    resetMetrics(): void;
    /**
     * Track rate limit hit (to be called by subclasses when rate limited)
     */
    protected trackRateLimitHit(): void;
    /**
     * Log debug message
     */
    protected debug(message: string, meta?: Record<string, unknown>): void;
    /**
     * Log info message
     */
    protected info(message: string, meta?: Record<string, unknown>): void;
    /**
     * Log warning message
     */
    protected warn(message: string, meta?: Record<string, unknown>): void;
    /**
     * Log error message
     */
    protected error(message: string, error?: Error, meta?: Record<string, unknown>): void;
    /**
     * Alias for fetchMarkets() - Python-style naming
     * @see fetchMarkets
     */
    fetch_markets: (params?: MarketParams) => Promise<Market[]>;
    /**
     * Alias for fetchTicker() - Python-style naming
     * @see fetchTicker
     */
    fetch_ticker: (symbol: string) => Promise<Ticker>;
    /**
     * Alias for fetchOrderBook() - Python-style naming
     * @see fetchOrderBook
     */
    fetch_order_book: (symbol: string, params?: OrderBookParams) => Promise<OrderBook>;
    /**
     * Alias for fetchTrades() - Python-style naming
     * @see fetchTrades
     */
    fetch_trades: (symbol: string, params?: TradeParams) => Promise<Trade[]>;
    /**
     * Alias for fetchFundingRate() - Python-style naming
     * @see fetchFundingRate
     */
    fetch_funding_rate: (symbol: string) => Promise<FundingRate>;
    /**
     * Alias for fetchFundingRateHistory() - Python-style naming
     * @see fetchFundingRateHistory
     */
    fetch_funding_rate_history: (symbol: string, since?: number, limit?: number) => Promise<FundingRate[]>;
    /**
     * Alias for fetchOHLCV() - Python-style naming
     * @see fetchOHLCV
     */
    fetch_ohlcv: (symbol: string, timeframe: OHLCVTimeframe, params?: OHLCVParams) => Promise<OHLCV[]>;
    /**
     * Alias for createOrder() - Python-style naming
     * @see createOrder
     */
    create_order: (request: OrderRequest) => Promise<Order>;
    /**
     * Alias for cancelOrder() - Python-style naming
     * @see cancelOrder
     */
    cancel_order: (orderId: string, symbol?: string) => Promise<Order>;
    /**
     * Alias for cancelAllOrders() - Python-style naming
     * @see cancelAllOrders
     */
    cancel_all_orders: (symbol?: string) => Promise<Order[]>;
    /**
     * Alias for createBatchOrders() - Python-style naming
     * @see createBatchOrders
     */
    create_batch_orders: (requests: OrderRequest[]) => Promise<Order[]>;
    /**
     * Alias for cancelBatchOrders() - Python-style naming
     * @see cancelBatchOrders
     */
    cancel_batch_orders: (orderIds: string[], symbol?: string) => Promise<Order[]>;
    /**
     * Alias for fetchPositions() - Python-style naming
     * @see fetchPositions
     */
    fetch_positions: (symbols?: string[]) => Promise<Position[]>;
    /**
     * Alias for fetchBalance() - Python-style naming
     * @see fetchBalance
     */
    fetch_balance: () => Promise<Balance[]>;
    /**
     * Alias for setLeverage() - Python-style naming
     * @see setLeverage
     */
    set_leverage: (symbol: string, leverage: number) => Promise<void>;
    /**
     * Alias for setMarginMode() - Python-style naming
     * @see setMarginMode
     */
    set_margin_mode: (symbol: string, marginMode: "cross" | "isolated") => Promise<void>;
    /**
     * Alias for fetchOpenOrders() - Python-style naming
     * @see fetchOpenOrders
     */
    fetch_open_orders: (symbol?: string, since?: number, limit?: number) => Promise<Order[]>;
    /**
     * Alias for healthCheck() - Python-style naming
     * @see healthCheck
     */
    health_check: (config?: HealthCheckConfig) => Promise<HealthCheckResult>;
    /**
     * Alias for getMetrics() - Python-style naming
     * @see getMetrics
     */
    get_metrics: () => MetricsSnapshot;
    /**
     * Alias for resetMetrics() - Python-style naming
     * @see resetMetrics
     */
    reset_metrics: () => void;
    /**
     * Alias for preloadMarkets() - Python-style naming
     * @see preloadMarkets
     */
    preload_markets: (options?: {
        ttl?: number;
        params?: MarketParams;
    }) => Promise<void>;
    /**
     * Alias for getPreloadedMarkets() - Python-style naming
     * @see getPreloadedMarkets
     */
    get_preloaded_markets: () => Market[] | null;
    /**
     * Alias for clearCache() - Python-style naming
     * @see clearCache
     */
    clear_cache: () => void;
    /**
     * Alias for fetchDeposits() - Python-style naming
     * @see fetchDeposits
     */
    fetch_deposits: (currency?: string, since?: number, limit?: number) => Promise<Transaction[]>;
    /**
     * Alias for fetchWithdrawals() - Python-style naming
     * @see fetchWithdrawals
     */
    fetch_withdrawals: (currency?: string, since?: number, limit?: number) => Promise<Transaction[]>;
    /**
     * Alias for fetchOrderHistory() - Python-style naming
     * Note: Subclasses must implement fetchOrderHistory
     * @see fetchOrderHistory
     */
    get fetch_order_history(): (symbol?: string, since?: number, limit?: number) => Promise<Order[]>;
    /**
     * Alias for fetchMyTrades() - Python-style naming
     * Note: Subclasses must implement fetchMyTrades
     * @see fetchMyTrades
     */
    get fetch_my_trades(): (symbol?: string, since?: number, limit?: number) => Promise<Trade[]>;
}
//# sourceMappingURL=BaseAdapter.d.ts.map
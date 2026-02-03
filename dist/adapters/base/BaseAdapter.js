/**
 * Base Exchange Adapter
 *
 * Abstract base class providing common functionality for all adapters
 */
import { NotSupportedError } from '../../types/errors.js';
import { determineHealthStatus } from '../../types/health.js';
import { createMetricsSnapshot } from '../../types/metrics.js';
import { Logger, LogLevel, generateCorrelationId } from '../../core/logger.js';
import { CircuitBreaker } from '../../core/CircuitBreaker.js';
import { isMetricsInitialized, getMetrics } from '../../monitoring/prometheus.js';
export class BaseAdapter {
    _isReady = false;
    _isDisconnected = false;
    config;
    authStrategy;
    rateLimiter; // Rate limiter instance (if used)
    _logger;
    circuitBreaker;
    httpClient;
    prometheusMetrics;
    // Resource tracking
    timers = new Set();
    intervals = new Set();
    abortControllers = new Set();
    // Cache management
    marketCache = null;
    marketCacheExpiry = 0;
    marketCacheTTL = 5 * 60 * 1000; // 5 minutes default
    // Metrics tracking
    metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rateLimitHits: 0,
        averageLatency: 0,
        endpointStats: new Map(),
        startedAt: Date.now(),
    };
    constructor(config = {}) {
        this.config = {
            timeout: 30000,
            testnet: false,
            debug: false,
            ...config,
        };
        // Initialize Prometheus metrics if available
        if (isMetricsInitialized()) {
            this.prometheusMetrics = getMetrics();
        }
        // Initialize circuit breaker with config or defaults
        this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
        // Listen to circuit breaker events for logging and metrics
        this.circuitBreaker.on('open', () => {
            this.warn('Circuit breaker OPENED - rejecting requests');
            if (this.prometheusMetrics) {
                this.prometheusMetrics.updateCircuitBreakerState(this.id, 'OPEN');
                this.prometheusMetrics.recordCircuitBreakerTransition(this.id, 'CLOSED', 'OPEN');
            }
        });
        this.circuitBreaker.on('halfOpen', () => {
            this.info('Circuit breaker HALF_OPEN - testing recovery');
            if (this.prometheusMetrics) {
                this.prometheusMetrics.updateCircuitBreakerState(this.id, 'HALF_OPEN');
                this.prometheusMetrics.recordCircuitBreakerTransition(this.id, 'OPEN', 'HALF_OPEN');
            }
        });
        this.circuitBreaker.on('close', () => {
            this.info('Circuit breaker CLOSED - normal operation resumed');
            if (this.prometheusMetrics) {
                this.prometheusMetrics.updateCircuitBreakerState(this.id, 'CLOSED');
                // Could be from OPEN or HALF_OPEN, but we'll use HALF_OPEN as it's the most common path
                this.prometheusMetrics.recordCircuitBreakerTransition(this.id, 'HALF_OPEN', 'CLOSED');
            }
        });
        // Listen to circuit breaker success/failure for metrics
        this.circuitBreaker.on('success', () => {
            if (this.prometheusMetrics) {
                this.prometheusMetrics.recordCircuitBreakerSuccess(this.id);
            }
        });
        this.circuitBreaker.on('failure', () => {
            if (this.prometheusMetrics) {
                this.prometheusMetrics.recordCircuitBreakerFailure(this.id);
            }
        });
    }
    /**
     * Get logger instance (lazy initialization with adapter name as context)
     */
    get logger() {
        if (!this._logger) {
            // Initialize logger with adapter's actual name as context
            // This happens on first access, after subclass has set this.name
            this._logger = new Logger(this.name, {
                level: this.config.debug ? LogLevel.DEBUG : LogLevel.INFO,
                enabled: true,
                maskSensitiveData: true,
            });
        }
        return this._logger;
    }
    get isReady() {
        return this._isReady;
    }
    /**
     * Check if adapter has been disconnected
     */
    isDisconnected() {
        return this._isDisconnected;
    }
    /**
     * Disconnect and cleanup all resources
     *
     * Subclasses should override and call super.disconnect() at the end
     */
    async disconnect() {
        if (this._isDisconnected) {
            this.debug('Already disconnected');
            return;
        }
        this.debug('Disconnecting and cleaning up resources...');
        // 1. Clear all timers
        for (const timer of this.timers) {
            clearTimeout(timer);
        }
        this.timers.clear();
        // 2. Clear all intervals
        for (const interval of this.intervals) {
            clearInterval(interval);
        }
        this.intervals.clear();
        // 3. Abort all pending requests
        for (const controller of this.abortControllers) {
            controller.abort();
        }
        this.abortControllers.clear();
        // 4. Clear caches
        this.clearCache();
        // 5. Destroy circuit breaker
        this.circuitBreaker.destroy();
        // 6. Update state
        this._isReady = false;
        this._isDisconnected = true;
        this.debug('Disconnected and cleanup complete');
    }
    /**
     * Clear all cached data
     */
    clearCache() {
        this.marketCache = null;
        this.marketCacheExpiry = 0;
    }
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
    async preloadMarkets(options) {
        const ttl = options?.ttl ?? this.marketCacheTTL;
        const params = options?.params;
        this.debug('Preloading markets...');
        const markets = await this.fetchMarketsFromAPI(params);
        this.marketCache = markets;
        this.marketCacheExpiry = Date.now() + ttl;
        this.marketCacheTTL = ttl;
        this.debug('Preloaded markets', { count: markets.length, ttl });
    }
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
    getPreloadedMarkets() {
        if (!this.marketCache) {
            return null;
        }
        const isExpired = Date.now() >= this.marketCacheExpiry;
        if (isExpired) {
            this.debug('Market cache expired');
            this.marketCache = null;
            this.marketCacheExpiry = 0;
            return null;
        }
        return this.marketCache;
    }
    /**
     * Fetch markets from API (bypasses cache)
     * Subclasses should implement this instead of fetchMarkets()
     */
    async fetchMarketsFromAPI(params) {
        // Default implementation delegates to fetchMarkets
        // Subclasses override this to provide actual API implementation
        return this.fetchMarkets(params);
    }
    /**
     * Perform health check on exchange adapter
     */
    async healthCheck(config = {}) {
        const { timeout = 5000, checkWebSocket = true, checkAuth = true, includeRateLimit = true, } = config;
        const startTime = Date.now();
        const timestamp = Date.now();
        // Initialize result
        const result = {
            status: 'unhealthy',
            latency: 0,
            exchange: this.id,
            api: {
                reachable: false,
                latency: 0,
            },
            timestamp,
        };
        try {
            // 1. Check API connectivity
            result.api = await this.checkApiHealth(timeout);
            // 2. Check WebSocket (if supported and enabled)
            if (checkWebSocket && this.has.watchOrderBook) {
                result.websocket = await this.checkWebSocketHealth();
            }
            // 3. Check authentication (if applicable)
            if (checkAuth && this.authStrategy) {
                result.auth = await this.checkAuthHealth();
            }
            // 4. Include rate limit info (if available)
            if (includeRateLimit && this.rateLimiter) {
                result.rateLimit = this.getRateLimitStatus();
            }
            // Determine overall status
            result.status = determineHealthStatus(result.api.reachable, result.websocket?.connected, result.auth?.valid);
            result.latency = Date.now() - startTime;
            return result;
        }
        catch (error) {
            result.latency = Date.now() - startTime;
            result.api.error = error instanceof Error ? error.message : 'Unknown error';
            return result;
        }
    }
    /**
     * Check API health by making a lightweight request
     */
    async checkApiHealth(timeout) {
        const startTime = Date.now();
        try {
            // Try to fetch a single ticker (lightweight operation)
            // Subclasses can override this method for exchange-specific checks
            await Promise.race([
                this.performApiHealthCheck(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), timeout)),
            ]);
            return {
                reachable: true,
                latency: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                reachable: false,
                latency: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Perform exchange-specific API health check
     * Subclasses should override this for optimal lightweight check
     */
    async performApiHealthCheck() {
        // Default: try to fetch markets (most exchanges support this)
        await this.fetchMarkets({ active: true });
    }
    /**
     * Check WebSocket health
     * Subclasses should override if they use WebSocket
     */
    async checkWebSocketHealth() {
        // Default implementation - subclasses should override
        return {
            connected: false,
            reconnecting: false,
        };
    }
    /**
     * Check authentication health
     * Subclasses should override for auth-specific checks
     */
    async checkAuthHealth() {
        // Default: assume auth is valid if authStrategy exists
        return {
            valid: !!this.authStrategy,
        };
    }
    /**
     * Get current rate limit status
     */
    getRateLimitStatus() {
        // Subclasses should override if they track rate limits
        return undefined;
    }
    /**
     * Fetch OHLCV (candlestick) data
     * Default implementation throws if not supported by exchange
     */
    async fetchOHLCV(symbol, timeframe, params) {
        if (!this.has.fetchOHLCV) {
            throw new NotSupportedError(`${this.name} does not support OHLCV data`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchOHLCV must be implemented by subclass');
    }
    /**
     * Fetch multiple tickers at once
     * Default implementation fetches tickers sequentially
     */
    async fetchTickers(symbols) {
        if (!this.has.fetchTickers) {
            // Fallback: fetch tickers one by one
            const result = {};
            const symbolsToFetch = symbols ?? (await this.fetchMarkets()).map(m => m.symbol);
            for (const symbol of symbolsToFetch) {
                try {
                    result[symbol] = await this.fetchTicker(symbol);
                }
                catch (error) {
                    this.debug(`Failed to fetch ticker for ${symbol}`, { error });
                }
            }
            return result;
        }
        throw new Error('fetchTickers must be implemented by subclass');
    }
    /**
     * Fetch available currencies
     * Default implementation throws if not supported
     */
    async fetchCurrencies() {
        if (!this.has.fetchCurrencies) {
            throw new NotSupportedError(`${this.name} does not support fetching currencies`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchCurrencies must be implemented by subclass');
    }
    /**
     * Fetch exchange status
     * Default implementation returns 'ok' if fetchMarkets succeeds
     */
    async fetchStatus() {
        if (!this.has.fetchStatus) {
            // Default: check if API is responsive
            try {
                await this.fetchMarkets();
                return {
                    status: 'ok',
                    updated: Date.now(),
                };
            }
            catch (error) {
                return {
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    updated: Date.now(),
                };
            }
        }
        throw new Error('fetchStatus must be implemented by subclass');
    }
    /**
     * Fetch exchange server time
     * Default implementation returns local time (not recommended)
     */
    async fetchTime() {
        if (!this.has.fetchTime) {
            throw new NotSupportedError(`${this.name} does not support fetching server time`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchTime must be implemented by subclass');
    }
    /**
     * Fetch deposit history
     * Default implementation throws if not supported by exchange
     */
    async fetchDeposits(currency, since, limit) {
        if (!this.has.fetchDeposits) {
            throw new NotSupportedError(`${this.name} does not support fetching deposit history`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchDeposits must be implemented by subclass');
    }
    /**
     * Fetch withdrawal history
     * Default implementation throws if not supported by exchange
     */
    async fetchWithdrawals(currency, since, limit) {
        if (!this.has.fetchWithdrawals) {
            throw new NotSupportedError(`${this.name} does not support fetching withdrawal history`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchWithdrawals must be implemented by subclass');
    }
    /**
     * Fetch account ledger (transaction history)
     * Default implementation throws if not supported by exchange
     */
    async fetchLedger(currency, since, limit, params) {
        if (!this.has.fetchLedger) {
            throw new NotSupportedError(`${this.name} does not support fetching ledger`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchLedger must be implemented by subclass');
    }
    /**
     * Fetch funding payment history
     * Default implementation throws if not supported by exchange
     */
    async fetchFundingHistory(symbol, since, limit) {
        if (!this.has.fetchFundingHistory) {
            throw new NotSupportedError(`${this.name} does not support fetching funding history`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchFundingHistory must be implemented by subclass');
    }
    // ===========================================================================
    // Batch Operations - with automatic fallback to sequential execution
    // ===========================================================================
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
    async createBatchOrders(requests) {
        // If native batch is supported, subclass should override this method
        if (this.has.createBatchOrders === true) {
            throw new Error('createBatchOrders must be implemented by subclass when has.createBatchOrders is true');
        }
        // Fallback to sequential execution
        this.debug('No native batch support, creating orders sequentially', { count: requests.length });
        const orders = [];
        const errors = [];
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i];
            if (!request)
                continue; // Skip undefined entries
            try {
                const order = await this.createOrder(request);
                orders.push(order);
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                errors.push({ index: i, error: err });
                this.debug('Failed to create order', { index: i + 1, total: requests.length, error: err.message });
                // Continue with remaining orders despite failure
            }
        }
        // If all orders failed, throw an error
        if (orders.length === 0 && errors.length > 0) {
            const firstError = errors[0];
            if (firstError) {
                throw new Error(`All batch order creations failed. First error: ${firstError.error.message}`);
            }
        }
        // Log summary if some failed
        if (errors.length > 0) {
            this.debug('Batch order creation completed', { succeeded: orders.length, failed: errors.length });
        }
        return orders;
    }
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
    async cancelBatchOrders(orderIds, symbol) {
        // If native batch is supported, subclass should override this method
        if (this.has.cancelBatchOrders === true) {
            throw new Error('cancelBatchOrders must be implemented by subclass when has.cancelBatchOrders is true');
        }
        // Fallback to sequential execution
        this.debug('No native batch support, canceling orders sequentially', { count: orderIds.length });
        const orders = [];
        const errors = [];
        for (let i = 0; i < orderIds.length; i++) {
            const orderId = orderIds[i];
            if (!orderId)
                continue; // Skip undefined entries
            try {
                const order = await this.cancelOrder(orderId, symbol);
                orders.push(order);
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                errors.push({ index: i, orderId, error: err });
                this.debug('Failed to cancel order', { orderId, error: err.message });
                // Continue with remaining orders despite failure
            }
        }
        // If all cancellations failed, throw an error
        if (orders.length === 0 && errors.length > 0) {
            const firstError = errors[0];
            if (firstError) {
                throw new Error(`All batch order cancellations failed. First error: ${firstError.error.message}`);
            }
        }
        // Log summary if some failed
        if (errors.length > 0) {
            this.debug('Batch order cancellation completed', { succeeded: orders.length, failed: errors.length });
        }
        return orders;
    }
    /**
     * Edit/modify an existing order
     * Default implementation throws if not supported
     */
    async editOrder(orderId, symbol, type, side, amount, price, params) {
        if (!this.has.editOrder) {
            throw new NotSupportedError(`${this.name} does not support editing orders`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('editOrder must be implemented by subclass');
    }
    // ===========================================================================
    // Order Query
    // ===========================================================================
    /**
     * Fetch a single order by ID
     * Default implementation throws if not supported
     */
    async fetchOrder(orderId, symbol) {
        if (!this.has.fetchOrder) {
            throw new NotSupportedError(`${this.name} does not support fetching single orders`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchOrder must be implemented by subclass');
    }
    /**
     * Fetch all open/pending orders
     * Default implementation throws if not supported
     */
    async fetchOpenOrders(symbol, since, limit) {
        if (!this.has.fetchOpenOrders) {
            throw new NotSupportedError(`${this.name} does not support fetching open orders`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchOpenOrders must be implemented by subclass');
    }
    /**
     * Fetch closed (filled/canceled) orders
     * Default implementation throws if not supported
     */
    async fetchClosedOrders(symbol, since, limit) {
        if (!this.has.fetchClosedOrders) {
            throw new NotSupportedError(`${this.name} does not support fetching closed orders`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchClosedOrders must be implemented by subclass');
    }
    // ===========================================================================
    // Convenience Order Methods (CCXT-compatible)
    // ===========================================================================
    /**
     * Create a limit buy order
     */
    async createLimitBuyOrder(symbol, amount, price, params) {
        return this.createOrder({
            symbol,
            type: 'limit',
            side: 'buy',
            amount,
            price,
            ...params,
        });
    }
    /**
     * Create a limit sell order
     */
    async createLimitSellOrder(symbol, amount, price, params) {
        return this.createOrder({
            symbol,
            type: 'limit',
            side: 'sell',
            amount,
            price,
            ...params,
        });
    }
    /**
     * Create a market buy order
     */
    async createMarketBuyOrder(symbol, amount, params) {
        return this.createOrder({
            symbol,
            type: 'market',
            side: 'buy',
            amount,
            ...params,
        });
    }
    /**
     * Create a market sell order
     */
    async createMarketSellOrder(symbol, amount, params) {
        return this.createOrder({
            symbol,
            type: 'market',
            side: 'sell',
            amount,
            ...params,
        });
    }
    /**
     * Create a stop loss order
     */
    async createStopLossOrder(symbol, amount, stopPrice, params) {
        return this.createOrder({
            symbol,
            type: 'stopMarket',
            side: 'sell', // Default to sell for stop loss
            amount,
            stopPrice,
            reduceOnly: true,
            ...params,
        });
    }
    /**
     * Create a take profit order
     */
    async createTakeProfitOrder(symbol, amount, takeProfitPrice, params) {
        return this.createOrder({
            symbol,
            type: 'limit',
            side: 'sell', // Default to sell for take profit
            amount,
            price: takeProfitPrice,
            reduceOnly: true,
            ...params,
        });
    }
    async setMarginMode(symbol, marginMode) {
        if (!this.has.setMarginMode || this.has.setMarginMode === 'emulated') {
            throw new NotSupportedError(`${this.name} does not support setting margin mode directly`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('setMarginMode must be implemented by subclass');
    }
    // ===========================================================================
    // WebSocket Streams - default implementation throws if not supported
    // ===========================================================================
    async *watchOrderBook(symbol, limit) {
        if (!this.has.watchOrderBook) {
            throw new NotSupportedError(`${this.name} does not support order book streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('watchOrderBook must be implemented by subclass');
        yield {}; // Type system requirement
    }
    async *watchTrades(symbol) {
        if (!this.has.watchTrades) {
            throw new NotSupportedError(`${this.name} does not support trade streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('watchTrades must be implemented by subclass');
        yield {}; // Type system requirement
    }
    async *watchTicker(symbol) {
        if (!this.has.watchTicker) {
            throw new NotSupportedError(`${this.name} does not support ticker streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('watchTicker must be implemented by subclass');
        yield {}; // Type system requirement
    }
    async *watchTickers(symbols) {
        if (!this.has.watchTickers) {
            throw new NotSupportedError(`${this.name} does not support multiple ticker streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('watchTickers must be implemented by subclass');
        yield {}; // Type system requirement
    }
    async *watchPositions() {
        if (!this.has.watchPositions) {
            throw new NotSupportedError(`${this.name} does not support position streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('watchPositions must be implemented by subclass');
        yield []; // Type system requirement
    }
    async *watchOrders() {
        if (!this.has.watchOrders) {
            throw new NotSupportedError(`${this.name} does not support order streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('watchOrders must be implemented by subclass');
        yield []; // Type system requirement
    }
    async *watchBalance() {
        if (!this.has.watchBalance) {
            throw new NotSupportedError(`${this.name} does not support balance streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('watchBalance must be implemented by subclass');
        yield []; // Type system requirement
    }
    async *watchFundingRate(symbol) {
        if (!this.has.watchFundingRate) {
            throw new NotSupportedError(`${this.name} does not support funding rate streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('watchFundingRate must be implemented by subclass');
        yield {}; // Type system requirement
    }
    async *watchOHLCV(symbol, timeframe) {
        if (!this.has.watchOHLCV) {
            throw new NotSupportedError(`${this.name} does not support OHLCV streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('watchOHLCV must be implemented by subclass');
        yield [0, 0, 0, 0, 0, 0]; // Type system requirement
    }
    async *watchMyTrades(symbol) {
        if (!this.has.watchMyTrades) {
            throw new NotSupportedError(`${this.name} does not support user trade streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('watchMyTrades must be implemented by subclass');
        yield {}; // Type system requirement
    }
    // ===========================================================================
    // Additional Info Methods
    // ===========================================================================
    /**
     * Fetch user fee rates
     * Default implementation throws if not supported by exchange
     */
    async fetchUserFees() {
        if (!this.has.fetchUserFees) {
            throw new NotSupportedError(`${this.name} does not support fetching user fees`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchUserFees must be implemented by subclass');
    }
    /**
     * Fetch portfolio performance metrics
     * Default implementation throws if not supported by exchange
     */
    async fetchPortfolio() {
        if (!this.has.fetchPortfolio) {
            throw new NotSupportedError(`${this.name} does not support fetching portfolio metrics`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchPortfolio must be implemented by subclass');
    }
    /**
     * Fetch current rate limit status
     * Default implementation throws if not supported by exchange
     */
    async fetchRateLimitStatus() {
        if (!this.has.fetchRateLimitStatus) {
            throw new NotSupportedError(`${this.name} does not support fetching rate limit status`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchRateLimitStatus must be implemented by subclass');
    }
    // ===========================================================================
    // Utility Methods
    // ===========================================================================
    /**
     * Check if a feature is supported
     */
    supportsFeature(feature) {
        return this.has[feature] === true;
    }
    /**
     * Assert that a feature is supported, throwing an error if not
     *
     * Use this at the beginning of methods that require specific features
     * to provide clear error messages when unsupported features are called.
     *
     * @param feature - The feature to check
     * @throws NotSupportedError if the feature is not supported
     *
     * @example
     * ```typescript
     * async fetchOHLCV(symbol: string, timeframe: OHLCVTimeframe): Promise<OHLCV[]> {
     *   this.assertFeatureSupported('fetchOHLCV');
     *   // ... implementation
     * }
     * ```
     */
    assertFeatureSupported(feature) {
        if (!this.has[feature]) {
            throw new NotSupportedError(`Feature '${feature}' is not supported by ${this.name}`, 'NOT_SUPPORTED', this.id);
        }
    }
    /**
     * Ensure adapter is initialized
     */
    ensureInitialized() {
        if (!this._isReady) {
            throw new Error(`${this.name} adapter not initialized. Call initialize() first.`);
        }
    }
    /**
     * Make HTTP request with timeout, circuit breaker, retry, and metrics tracking
     */
    async request(method, url, body, headers) {
        // Retry configuration
        const maxAttempts = 3;
        const initialDelay = 1000;
        const maxDelay = 10000;
        const multiplier = 2;
        const retryableStatuses = [408, 429, 500, 502, 503, 504];
        // Generate correlation ID for request tracing
        const correlationId = generateCorrelationId();
        // Wrap the entire request in circuit breaker
        return this.circuitBreaker.execute(async () => {
            let lastError;
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const startTime = Date.now();
                const endpoint = this.extractEndpoint(url);
                const endpointKey = `${method}:${endpoint}`;
                // Log request with correlation ID
                this.debug(`Request ${correlationId}`, {
                    method,
                    endpoint,
                    attempt: attempt + 1,
                    correlationId,
                });
                // Increment total requests
                this.metrics.totalRequests++;
                const controller = new AbortController();
                this.abortControllers.add(controller);
                const timeout = setTimeout(() => controller.abort(), this.config.timeout);
                this.registerTimer(timeout);
                try {
                    const response = await fetch(url, {
                        method,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Correlation-ID': correlationId,
                            ...headers,
                        },
                        body: body ? JSON.stringify(body) : undefined,
                        signal: controller.signal,
                    });
                    if (!response.ok) {
                        const shouldRetry = attempt < maxAttempts - 1 && retryableStatuses.includes(response.status);
                        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                        if (!shouldRetry) {
                            throw error;
                        }
                        // Track failed request (will retry)
                        const latency = Date.now() - startTime;
                        this.metrics.failedRequests++;
                        this.updateEndpointMetrics(endpointKey, latency, true);
                        this.updateAverageLatency(latency);
                        lastError = error;
                        // Calculate delay with exponential backoff
                        const delay = Math.min(initialDelay * Math.pow(multiplier, attempt), maxDelay);
                        // Clean up before retry
                        clearTimeout(timeout);
                        this.timers.delete(timeout);
                        this.abortControllers.delete(controller);
                        // Wait before retry
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    const result = (await response.json());
                    // Track successful request
                    const latency = Date.now() - startTime;
                    this.metrics.successfulRequests++;
                    this.updateEndpointMetrics(endpointKey, latency, false);
                    this.updateAverageLatency(latency);
                    // Log success with correlation ID
                    this.debug(`Request ${correlationId} completed`, {
                        correlationId,
                        latency,
                        status: response.status,
                    });
                    // Track in Prometheus
                    if (this.prometheusMetrics) {
                        this.prometheusMetrics.recordRequest(this.id, endpoint, 'success', latency);
                    }
                    // Clean up
                    clearTimeout(timeout);
                    this.timers.delete(timeout);
                    this.abortControllers.delete(controller);
                    return result;
                }
                catch (error) {
                    // Track failed request
                    const latency = Date.now() - startTime;
                    this.metrics.failedRequests++;
                    this.updateEndpointMetrics(endpointKey, latency, true);
                    this.updateAverageLatency(latency);
                    // Log error with correlation ID
                    this.debug(`Request ${correlationId} failed`, {
                        correlationId,
                        latency,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        attempt: attempt + 1,
                    });
                    // Track in Prometheus
                    if (this.prometheusMetrics) {
                        this.prometheusMetrics.recordRequest(this.id, endpoint, 'error', latency);
                        const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
                        this.prometheusMetrics.recordRequestError(this.id, endpoint, errorType);
                    }
                    // Clean up
                    clearTimeout(timeout);
                    this.timers.delete(timeout);
                    this.abortControllers.delete(controller);
                    // Check if should retry
                    const isNetworkError = error instanceof Error &&
                        (error.name === 'AbortError' || error.message.includes('fetch') || error.message.includes('network'));
                    if (attempt < maxAttempts - 1 && isNetworkError) {
                        lastError = error;
                        // Calculate delay with exponential backoff
                        const delay = Math.min(initialDelay * Math.pow(multiplier, attempt), maxDelay);
                        // Wait before retry
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    throw error;
                }
            }
            throw lastError || new Error('Request failed after retries');
        });
    }
    /**
     * Register a timer for cleanup tracking
     */
    registerTimer(timer) {
        this.timers.add(timer);
    }
    /**
     * Register an interval for cleanup tracking
     */
    registerInterval(interval) {
        this.intervals.add(interval);
    }
    /**
     * Unregister and clear a timer
     */
    unregisterTimer(timer) {
        clearTimeout(timer);
        this.timers.delete(timer);
    }
    /**
     * Unregister and clear an interval
     */
    unregisterInterval(interval) {
        clearInterval(interval);
        this.intervals.delete(interval);
    }
    /**
     * Extract endpoint path from URL for metrics tracking
     */
    extractEndpoint(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname;
        }
        catch {
            // If URL parsing fails, return the URL as-is
            return url;
        }
    }
    /**
     * Update per-endpoint metrics
     */
    updateEndpointMetrics(endpointKey, latency, isError) {
        let stats = this.metrics.endpointStats.get(endpointKey);
        if (!stats) {
            stats = {
                endpoint: endpointKey,
                count: 0,
                totalLatency: 0,
                errors: 0,
                minLatency: Infinity,
                maxLatency: 0,
            };
            this.metrics.endpointStats.set(endpointKey, stats);
        }
        stats.count++;
        stats.totalLatency += latency;
        stats.minLatency = Math.min(stats.minLatency, latency);
        stats.maxLatency = Math.max(stats.maxLatency, latency);
        stats.lastRequestAt = Date.now();
        if (isError) {
            stats.errors++;
        }
    }
    /**
     * Update rolling average latency
     */
    updateAverageLatency(latency) {
        const total = this.metrics.totalRequests;
        const currentAvg = this.metrics.averageLatency;
        // Calculate new rolling average
        this.metrics.averageLatency = (currentAvg * (total - 1) + latency) / total;
    }
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
    getMetrics() {
        return createMetricsSnapshot(this.metrics);
    }
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
    getCircuitBreakerMetrics() {
        return this.circuitBreaker.getMetrics();
    }
    /**
     * Get circuit breaker state
     *
     * @returns Current circuit state: 'CLOSED', 'OPEN', or 'HALF_OPEN'
     */
    getCircuitBreakerState() {
        return this.circuitBreaker.getState();
    }
    /**
     * Reset all metrics to initial state
     *
     * @example
     * ```typescript
     * exchange.resetMetrics();
     * // All counters reset, collection starts fresh
     * ```
     */
    resetMetrics() {
        this.metrics.lastResetAt = Date.now();
        this.metrics.totalRequests = 0;
        this.metrics.successfulRequests = 0;
        this.metrics.failedRequests = 0;
        this.metrics.rateLimitHits = 0;
        this.metrics.averageLatency = 0;
        this.metrics.endpointStats.clear();
    }
    /**
     * Track rate limit hit (to be called by subclasses when rate limited)
     */
    trackRateLimitHit() {
        this.metrics.rateLimitHits++;
    }
    // ===========================================================================
    // Logging Methods
    // ===========================================================================
    /**
     * Log debug message
     */
    debug(message, meta) {
        this.logger.debug(message, meta);
    }
    /**
     * Log info message
     */
    info(message, meta) {
        this.logger.info(message, meta);
    }
    /**
     * Log warning message
     */
    warn(message, meta) {
        this.logger.warn(message, meta);
    }
    /**
     * Log error message
     */
    error(message, error, meta) {
        this.logger.error(message, error, meta);
    }
    // ===========================================================================
    // Python-style Method Aliases
    // ===========================================================================
    // These aliases provide Python/snake_case naming conventions
    // for developers who prefer that style
    /**
     * Alias for fetchMarkets() - Python-style naming
     * @see fetchMarkets
     */
    fetch_markets = this.fetchMarkets.bind(this);
    /**
     * Alias for fetchTicker() - Python-style naming
     * @see fetchTicker
     */
    fetch_ticker = this.fetchTicker.bind(this);
    /**
     * Alias for fetchOrderBook() - Python-style naming
     * @see fetchOrderBook
     */
    fetch_order_book = this.fetchOrderBook.bind(this);
    /**
     * Alias for fetchTrades() - Python-style naming
     * @see fetchTrades
     */
    fetch_trades = this.fetchTrades.bind(this);
    /**
     * Alias for fetchFundingRate() - Python-style naming
     * @see fetchFundingRate
     */
    fetch_funding_rate = this.fetchFundingRate.bind(this);
    /**
     * Alias for fetchFundingRateHistory() - Python-style naming
     * @see fetchFundingRateHistory
     */
    fetch_funding_rate_history = this.fetchFundingRateHistory.bind(this);
    /**
     * Alias for fetchOHLCV() - Python-style naming
     * @see fetchOHLCV
     */
    fetch_ohlcv = this.fetchOHLCV.bind(this);
    /**
     * Alias for createOrder() - Python-style naming
     * @see createOrder
     */
    create_order = this.createOrder.bind(this);
    /**
     * Alias for cancelOrder() - Python-style naming
     * @see cancelOrder
     */
    cancel_order = this.cancelOrder.bind(this);
    /**
     * Alias for cancelAllOrders() - Python-style naming
     * @see cancelAllOrders
     */
    cancel_all_orders = this.cancelAllOrders.bind(this);
    /**
     * Alias for createBatchOrders() - Python-style naming
     * @see createBatchOrders
     */
    create_batch_orders = this.createBatchOrders.bind(this);
    /**
     * Alias for cancelBatchOrders() - Python-style naming
     * @see cancelBatchOrders
     */
    cancel_batch_orders = this.cancelBatchOrders.bind(this);
    /**
     * Alias for fetchPositions() - Python-style naming
     * @see fetchPositions
     */
    fetch_positions = this.fetchPositions.bind(this);
    /**
     * Alias for fetchBalance() - Python-style naming
     * @see fetchBalance
     */
    fetch_balance = this.fetchBalance.bind(this);
    /**
     * Alias for setLeverage() - Python-style naming
     * @see setLeverage
     */
    set_leverage = this.setLeverage.bind(this);
    /**
     * Alias for setMarginMode() - Python-style naming
     * @see setMarginMode
     */
    set_margin_mode = this.setMarginMode.bind(this);
    /**
     * Alias for fetchOpenOrders() - Python-style naming
     * @see fetchOpenOrders
     */
    fetch_open_orders = this.fetchOpenOrders.bind(this);
    /**
     * Alias for healthCheck() - Python-style naming
     * @see healthCheck
     */
    health_check = this.healthCheck.bind(this);
    /**
     * Alias for getMetrics() - Python-style naming
     * @see getMetrics
     */
    get_metrics = this.getMetrics.bind(this);
    /**
     * Alias for resetMetrics() - Python-style naming
     * @see resetMetrics
     */
    reset_metrics = this.resetMetrics.bind(this);
    /**
     * Alias for preloadMarkets() - Python-style naming
     * @see preloadMarkets
     */
    preload_markets = this.preloadMarkets.bind(this);
    /**
     * Alias for getPreloadedMarkets() - Python-style naming
     * @see getPreloadedMarkets
     */
    get_preloaded_markets = this.getPreloadedMarkets.bind(this);
    /**
     * Alias for clearCache() - Python-style naming
     * @see clearCache
     */
    clear_cache = this.clearCache.bind(this);
    /**
     * Alias for fetchDeposits() - Python-style naming
     * @see fetchDeposits
     */
    fetch_deposits = this.fetchDeposits.bind(this);
    /**
     * Alias for fetchWithdrawals() - Python-style naming
     * @see fetchWithdrawals
     */
    fetch_withdrawals = this.fetchWithdrawals.bind(this);
    /**
     * Alias for fetchOrderHistory() - Python-style naming
     * Note: Subclasses must implement fetchOrderHistory
     * @see fetchOrderHistory
     */
    get fetch_order_history() {
        return this.fetchOrderHistory.bind(this);
    }
    /**
     * Alias for fetchMyTrades() - Python-style naming
     * Note: Subclasses must implement fetchMyTrades
     * @see fetchMyTrades
     */
    get fetch_my_trades() {
        return this.fetchMyTrades.bind(this);
    }
}
//# sourceMappingURL=BaseAdapter.js.map
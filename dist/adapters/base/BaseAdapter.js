/**
 * Base Exchange Adapter
 *
 * Abstract base class providing common functionality for all adapters.
 * Composes functionality from multiple mixins while maintaining type safety.
 */
import { NotSupportedError, PerpDEXError } from '../../types/errors.js';
import { determineHealthStatus } from '../../types/health.js';
import { createMetricsSnapshot } from '../../types/metrics.js';
import { Logger, LogLevel, generateCorrelationId } from '../../core/logger.js';
import { CircuitBreaker } from '../../core/CircuitBreaker.js';
import { isMetricsInitialized, getMetrics, } from '../../monitoring/prometheus.js';
import { validateOrderRequest, createValidator } from '../../core/validation/middleware.js';
export class BaseAdapter {
    _isReady = false;
    _isDisconnected = false;
    config;
    authStrategy;
    rateLimiter;
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
    // ===========================================================================
    // Logger Methods (from LoggerMixin)
    // ===========================================================================
    get logger() {
        if (!this._logger) {
            this._logger = new Logger(this.name, {
                level: this.config.debug ? LogLevel.DEBUG : LogLevel.INFO,
                enabled: true,
                maskSensitiveData: true,
            });
        }
        return this._logger;
    }
    debug(message, meta) {
        this.logger.debug(message, meta);
    }
    info(message, meta) {
        this.logger.info(message, meta);
    }
    warn(message, meta) {
        this.logger.warn(message, meta);
    }
    error(message, error, meta) {
        this.logger.error(message, error, meta);
    }
    // ===========================================================================
    // State Getters
    // ===========================================================================
    get isReady() {
        return this._isReady;
    }
    isDisconnected() {
        return this._isDisconnected;
    }
    async disconnect() {
        if (this._isDisconnected) {
            this.debug('Already disconnected');
            return;
        }
        this.debug('Disconnecting and cleaning up resources...');
        for (const timer of this.timers) {
            clearTimeout(timer);
        }
        this.timers.clear();
        for (const interval of this.intervals) {
            clearInterval(interval);
        }
        this.intervals.clear();
        for (const controller of this.abortControllers) {
            controller.abort();
        }
        this.abortControllers.clear();
        this.clearCache();
        this.circuitBreaker.destroy();
        this._isReady = false;
        this._isDisconnected = true;
        this.debug('Disconnected and cleanup complete');
    }
    // ===========================================================================
    // Cache Management (from CacheManagerMixin)
    // ===========================================================================
    clearCache() {
        this.marketCache = null;
        this.marketCacheExpiry = 0;
    }
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
    async fetchMarketsFromAPI(params) {
        return this.fetchMarkets(params);
    }
    // ===========================================================================
    // Health Check (from HealthCheckMixin)
    // ===========================================================================
    async healthCheck(config = {}) {
        const { timeout = 5000, checkWebSocket = true, checkAuth = true, includeRateLimit = true, } = config;
        const startTime = Date.now();
        const timestamp = Date.now();
        const result = {
            status: 'unhealthy',
            latency: 0,
            exchange: this.id,
            api: { reachable: false, latency: 0 },
            timestamp,
        };
        try {
            result.api = await this.checkApiHealth(timeout);
            if (checkWebSocket && this.has.watchOrderBook) {
                result.websocket = await this.checkWebSocketHealth();
            }
            if (checkAuth && this.authStrategy) {
                result.auth = await this.checkAuthHealth();
            }
            if (includeRateLimit && this.rateLimiter) {
                result.rateLimit = this.getRateLimitStatus();
            }
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
    async checkApiHealth(timeout) {
        const startTime = Date.now();
        try {
            await Promise.race([
                this.performApiHealthCheck(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), timeout)),
            ]);
            return { reachable: true, latency: Date.now() - startTime };
        }
        catch (error) {
            return {
                reachable: false,
                latency: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async performApiHealthCheck() {
        await this.fetchMarkets({ active: true });
    }
    async checkWebSocketHealth() {
        return { connected: false, reconnecting: false };
    }
    async checkAuthHealth() {
        return { valid: !!this.authStrategy };
    }
    getRateLimitStatus() {
        return undefined;
    }
    // ===========================================================================
    // Metrics (from MetricsTrackerMixin)
    // ===========================================================================
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
    updateAverageLatency(latency) {
        const total = this.metrics.totalRequests;
        const currentAvg = this.metrics.averageLatency;
        this.metrics.averageLatency = (currentAvg * (total - 1) + latency) / total;
    }
    getMetrics() {
        return createMetricsSnapshot(this.metrics);
    }
    getCircuitBreakerMetrics() {
        return this.circuitBreaker.getMetrics();
    }
    getCircuitBreakerState() {
        return this.circuitBreaker.getState();
    }
    resetMetrics() {
        this.metrics.lastResetAt = Date.now();
        this.metrics.totalRequests = 0;
        this.metrics.successfulRequests = 0;
        this.metrics.failedRequests = 0;
        this.metrics.rateLimitHits = 0;
        this.metrics.averageLatency = 0;
        this.metrics.endpointStats.clear();
    }
    trackRateLimitHit() {
        this.metrics.rateLimitHits++;
    }
    // ===========================================================================
    // HTTP Request (from HttpRequestMixin)
    // ===========================================================================
    async request(method, url, body, headers) {
        const maxAttempts = 3;
        const initialDelay = 1000;
        const maxDelay = 10000;
        const multiplier = 2;
        const retryableStatuses = [408, 429, 500, 502, 503, 504];
        const correlationId = generateCorrelationId();
        return this.circuitBreaker.execute(async () => {
            let lastError;
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const startTime = Date.now();
                const endpoint = this.extractEndpoint(url);
                const endpointKey = `${method}:${endpoint}`;
                this.debug(`Request ${correlationId}`, {
                    method,
                    endpoint,
                    attempt: attempt + 1,
                    correlationId,
                });
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
                        const latency = Date.now() - startTime;
                        this.metrics.failedRequests++;
                        this.updateEndpointMetrics(endpointKey, latency, true);
                        this.updateAverageLatency(latency);
                        lastError = error;
                        const delay = Math.min(initialDelay * Math.pow(multiplier, attempt), maxDelay);
                        clearTimeout(timeout);
                        this.timers.delete(timeout);
                        this.abortControllers.delete(controller);
                        await new Promise((resolve) => setTimeout(resolve, delay));
                        continue;
                    }
                    const result = (await response.json());
                    const latency = Date.now() - startTime;
                    this.metrics.successfulRequests++;
                    this.updateEndpointMetrics(endpointKey, latency, false);
                    this.updateAverageLatency(latency);
                    this.debug(`Request ${correlationId} completed`, {
                        correlationId,
                        latency,
                        status: response.status,
                    });
                    if (this.prometheusMetrics) {
                        this.prometheusMetrics.recordRequest(this.id, endpoint, 'success', latency);
                    }
                    clearTimeout(timeout);
                    this.timers.delete(timeout);
                    this.abortControllers.delete(controller);
                    return result;
                }
                catch (error) {
                    const latency = Date.now() - startTime;
                    this.metrics.failedRequests++;
                    this.updateEndpointMetrics(endpointKey, latency, true);
                    this.updateAverageLatency(latency);
                    this.debug(`Request ${correlationId} failed`, {
                        correlationId,
                        latency,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        attempt: attempt + 1,
                    });
                    if (this.prometheusMetrics) {
                        this.prometheusMetrics.recordRequest(this.id, endpoint, 'error', latency);
                        const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
                        this.prometheusMetrics.recordRequestError(this.id, endpoint, errorType);
                    }
                    clearTimeout(timeout);
                    this.timers.delete(timeout);
                    this.abortControllers.delete(controller);
                    const isNetworkError = error instanceof Error &&
                        (error.name === 'AbortError' ||
                            error.message.includes('fetch') ||
                            error.message.includes('network'));
                    if (attempt < maxAttempts - 1 && isNetworkError) {
                        lastError = error;
                        const delay = Math.min(initialDelay * Math.pow(multiplier, attempt), maxDelay);
                        await new Promise((resolve) => setTimeout(resolve, delay));
                        continue;
                    }
                    throw this.attachCorrelationId(error, correlationId);
                }
            }
            throw this.attachCorrelationId(lastError || new Error('Request failed after retries'), correlationId);
        });
    }
    registerTimer(timer) {
        this.timers.add(timer);
    }
    registerInterval(interval) {
        this.intervals.add(interval);
    }
    unregisterTimer(timer) {
        clearTimeout(timer);
        this.timers.delete(timer);
    }
    unregisterInterval(interval) {
        clearInterval(interval);
        this.intervals.delete(interval);
    }
    extractEndpoint(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname;
        }
        catch {
            return url;
        }
    }
    async fetchOHLCV(_symbol, _timeframe, _params) {
        if (!this.has.fetchOHLCV) {
            throw new NotSupportedError(`${this.name} does not support OHLCV data`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchOHLCV must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchTickers(symbols) {
        if (!this.has.fetchTickers) {
            const result = {};
            const symbolsToFetch = symbols ?? (await this.fetchMarkets()).map((m) => m.symbol);
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
        throw new NotSupportedError('fetchTickers must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchCurrencies() {
        if (!this.has.fetchCurrencies) {
            throw new NotSupportedError(`${this.name} does not support fetching currencies`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchCurrencies must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchStatus() {
        if (!this.has.fetchStatus) {
            try {
                await this.fetchMarkets();
                return { status: 'ok', updated: Date.now() };
            }
            catch (error) {
                return {
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    updated: Date.now(),
                };
            }
        }
        throw new NotSupportedError('fetchStatus must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchTime() {
        if (!this.has.fetchTime) {
            throw new NotSupportedError(`${this.name} does not support fetching server time`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchTime must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchDeposits(_currency, _since, _limit) {
        if (!this.has.fetchDeposits) {
            throw new NotSupportedError(`${this.name} does not support fetching deposit history`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchDeposits must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchWithdrawals(_currency, _since, _limit) {
        if (!this.has.fetchWithdrawals) {
            throw new NotSupportedError(`${this.name} does not support fetching withdrawal history`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchWithdrawals must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchLedger(_currency, _since, _limit, _params) {
        if (!this.has.fetchLedger) {
            throw new NotSupportedError(`${this.name} does not support fetching ledger`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchLedger must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchFundingHistory(_symbol, _since, _limit) {
        if (!this.has.fetchFundingHistory) {
            throw new NotSupportedError(`${this.name} does not support fetching funding history`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchFundingHistory must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    // ===========================================================================
    // Batch Operations (from OrderHelpersMixin)
    // ===========================================================================
    async createBatchOrders(requests) {
        if (this.has.createBatchOrders === true) {
            throw new NotSupportedError('createBatchOrders must be implemented by subclass when has.createBatchOrders is true', 'NOT_IMPLEMENTED', this.id);
        }
        this.debug('No native batch support, creating orders sequentially', { count: requests.length });
        const orders = [];
        const errors = [];
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i];
            if (!request)
                continue;
            try {
                const order = await this.createOrder(request);
                orders.push(order);
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                errors.push({ index: i, error: err });
                this.debug('Failed to create order', {
                    index: i + 1,
                    total: requests.length,
                    error: err.message,
                });
            }
        }
        if (orders.length === 0 && errors.length > 0) {
            const firstError = errors[0];
            if (firstError) {
                throw new PerpDEXError(`All batch order creations failed. First error: ${firstError.error.message}`, 'BATCH_FAILED', this.id, firstError.error);
            }
        }
        if (errors.length > 0) {
            this.debug('Batch order creation completed', {
                succeeded: orders.length,
                failed: errors.length,
            });
        }
        return orders;
    }
    async cancelBatchOrders(orderIds, symbol) {
        if (this.has.cancelBatchOrders === true) {
            throw new NotSupportedError('cancelBatchOrders must be implemented by subclass when has.cancelBatchOrders is true', 'NOT_IMPLEMENTED', this.id);
        }
        this.debug('No native batch support, canceling orders sequentially', {
            count: orderIds.length,
        });
        const orders = [];
        const errors = [];
        for (let i = 0; i < orderIds.length; i++) {
            const orderId = orderIds[i];
            if (!orderId)
                continue;
            try {
                const order = await this.cancelOrder(orderId, symbol);
                orders.push(order);
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                errors.push({ index: i, orderId, error: err });
                this.debug('Failed to cancel order', { orderId, error: err.message });
            }
        }
        if (orders.length === 0 && errors.length > 0) {
            const firstError = errors[0];
            if (firstError) {
                throw new PerpDEXError(`All batch order cancellations failed. First error: ${firstError.error.message}`, 'BATCH_FAILED', this.id, firstError.error);
            }
        }
        if (errors.length > 0) {
            this.debug('Batch order cancellation completed', {
                succeeded: orders.length,
                failed: errors.length,
            });
        }
        return orders;
    }
    async editOrder(_orderId, _symbol, _type, _side, _amount, _price, _params) {
        if (!this.has.editOrder) {
            throw new NotSupportedError(`${this.name} does not support editing orders`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('editOrder must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    // ===========================================================================
    // Order Query
    // ===========================================================================
    async fetchOrder(_orderId, _symbol) {
        if (!this.has.fetchOrder) {
            throw new NotSupportedError(`${this.name} does not support fetching single orders`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchOrder must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchOpenOrders(_symbol, _since, _limit) {
        if (!this.has.fetchOpenOrders) {
            throw new NotSupportedError(`${this.name} does not support fetching open orders`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchOpenOrders must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchClosedOrders(_symbol, _since, _limit) {
        if (!this.has.fetchClosedOrders) {
            throw new NotSupportedError(`${this.name} does not support fetching closed orders`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchClosedOrders must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    // ===========================================================================
    // Convenience Order Methods (CCXT-compatible)
    // ===========================================================================
    async createLimitBuyOrder(symbol, amount, price, params) {
        return this.createOrder({ symbol, type: 'limit', side: 'buy', amount, price, ...params });
    }
    async createLimitSellOrder(symbol, amount, price, params) {
        return this.createOrder({ symbol, type: 'limit', side: 'sell', amount, price, ...params });
    }
    async createMarketBuyOrder(symbol, amount, params) {
        return this.createOrder({ symbol, type: 'market', side: 'buy', amount, ...params });
    }
    async createMarketSellOrder(symbol, amount, params) {
        return this.createOrder({ symbol, type: 'market', side: 'sell', amount, ...params });
    }
    async createStopLossOrder(symbol, amount, stopPrice, params) {
        return this.createOrder({
            symbol,
            type: 'stopMarket',
            side: 'sell',
            amount,
            stopPrice,
            reduceOnly: true,
            ...params,
        });
    }
    async createTakeProfitOrder(symbol, amount, takeProfitPrice, params) {
        return this.createOrder({
            symbol,
            type: 'limit',
            side: 'sell',
            amount,
            price: takeProfitPrice,
            reduceOnly: true,
            ...params,
        });
    }
    async setMarginMode(_symbol, _marginMode) {
        if (!this.has.setMarginMode || this.has.setMarginMode === 'emulated') {
            throw new NotSupportedError(`${this.name} does not support setting margin mode directly`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('setMarginMode must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    // ===========================================================================
    // WebSocket Streams - default implementation throws if not supported
    // ===========================================================================
    async *watchOrderBook(_symbol, _limit) {
        if (!this.has.watchOrderBook) {
            throw new NotSupportedError(`${this.name} does not support order book streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchOrderBook must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield {};
    }
    async *watchTrades(_symbol) {
        if (!this.has.watchTrades) {
            throw new NotSupportedError(`${this.name} does not support trade streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchTrades must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield {};
    }
    async *watchTicker(_symbol) {
        if (!this.has.watchTicker) {
            throw new NotSupportedError(`${this.name} does not support ticker streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchTicker must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield {};
    }
    async *watchTickers(_symbols) {
        if (!this.has.watchTickers) {
            throw new NotSupportedError(`${this.name} does not support multiple ticker streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchTickers must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield {};
    }
    async *watchPositions() {
        if (!this.has.watchPositions) {
            throw new NotSupportedError(`${this.name} does not support position streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchPositions must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield [];
    }
    async *watchOrders() {
        if (!this.has.watchOrders) {
            throw new NotSupportedError(`${this.name} does not support order streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchOrders must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield [];
    }
    async *watchBalance() {
        if (!this.has.watchBalance) {
            throw new NotSupportedError(`${this.name} does not support balance streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchBalance must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield [];
    }
    async *watchFundingRate(_symbol) {
        if (!this.has.watchFundingRate) {
            throw new NotSupportedError(`${this.name} does not support funding rate streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchFundingRate must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield {};
    }
    async *watchOHLCV(_symbol, _timeframe) {
        if (!this.has.watchOHLCV) {
            throw new NotSupportedError(`${this.name} does not support OHLCV streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchOHLCV must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield [0, 0, 0, 0, 0, 0];
    }
    async *watchMyTrades(_symbol) {
        if (!this.has.watchMyTrades) {
            throw new NotSupportedError(`${this.name} does not support user trade streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchMyTrades must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield {};
    }
    // ===========================================================================
    // Additional Info Methods
    // ===========================================================================
    async fetchUserFees() {
        if (!this.has.fetchUserFees) {
            throw new NotSupportedError(`${this.name} does not support fetching user fees`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchUserFees must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchPortfolio() {
        if (!this.has.fetchPortfolio) {
            throw new NotSupportedError(`${this.name} does not support fetching portfolio metrics`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchPortfolio must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchRateLimitStatus() {
        if (!this.has.fetchRateLimitStatus) {
            throw new NotSupportedError(`${this.name} does not support fetching rate limit status`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchRateLimitStatus must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    // ===========================================================================
    // Utility Methods
    // ===========================================================================
    supportsFeature(feature) {
        return this.has[feature] === true;
    }
    assertFeatureSupported(feature) {
        if (!this.has[feature]) {
            throw new NotSupportedError(`Feature '${feature}' is not supported by ${this.name}`, 'NOT_SUPPORTED', this.id);
        }
    }
    ensureInitialized() {
        if (!this._isReady) {
            throw new PerpDEXError(`${this.name} adapter not initialized. Call initialize() first.`, 'NOT_INITIALIZED', this.id);
        }
    }
    // ===========================================================================
    // Input Validation
    // ===========================================================================
    validateOrder(request, correlationId) {
        return validateOrderRequest(request, {
            exchange: this.id,
            context: correlationId ? { correlationId } : undefined,
        });
    }
    getValidator() {
        return createValidator(this.id);
    }
    attachCorrelationId(error, correlationId) {
        if (error instanceof PerpDEXError) {
            error.withCorrelationId(correlationId);
            return error;
        }
        const message = error instanceof Error ? error.message : String(error);
        return new PerpDEXError(message, 'REQUEST_ERROR', this.id, error).withCorrelationId(correlationId);
    }
    // ===========================================================================
    // Python-style Method Aliases
    // ===========================================================================
    fetch_markets = this.fetchMarkets.bind(this);
    fetch_ticker = this.fetchTicker.bind(this);
    fetch_order_book = this.fetchOrderBook.bind(this);
    fetch_trades = this.fetchTrades.bind(this);
    fetch_funding_rate = this.fetchFundingRate.bind(this);
    fetch_funding_rate_history = this.fetchFundingRateHistory.bind(this);
    fetch_ohlcv = this.fetchOHLCV.bind(this);
    create_order = this.createOrder.bind(this);
    cancel_order = this.cancelOrder.bind(this);
    cancel_all_orders = this.cancelAllOrders.bind(this);
    create_batch_orders = this.createBatchOrders.bind(this);
    cancel_batch_orders = this.cancelBatchOrders.bind(this);
    fetch_positions = this.fetchPositions.bind(this);
    fetch_balance = this.fetchBalance.bind(this);
    set_leverage = this.setLeverage.bind(this);
    set_margin_mode = this.setMarginMode.bind(this);
    fetch_open_orders = this.fetchOpenOrders.bind(this);
    health_check = this.healthCheck.bind(this);
    get_metrics = this.getMetrics.bind(this);
    reset_metrics = this.resetMetrics.bind(this);
    preload_markets = this.preloadMarkets.bind(this);
    get_preloaded_markets = this.getPreloadedMarkets.bind(this);
    clear_cache = this.clearCache.bind(this);
    fetch_deposits = this.fetchDeposits.bind(this);
    fetch_withdrawals = this.fetchWithdrawals.bind(this);
    get fetch_order_history() {
        return this.fetchOrderHistory.bind(this);
    }
    get fetch_my_trades() {
        return this.fetchMyTrades.bind(this);
    }
}
//# sourceMappingURL=BaseAdapter.js.map
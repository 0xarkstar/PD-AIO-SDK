/**
 * Base Adapter Core
 *
 * Abstract base class providing infrastructure functionality for all adapters.
 * Contains logger, metrics, cache, health check, HTTP request, and connection management.
 */
import { PerpDEXError } from '../../types/errors.js';
import { determineHealthStatus } from '../../types/health.js';
import { createMetricsSnapshot } from '../../types/metrics.js';
import { Logger, LogLevel, generateCorrelationId } from '../../core/logger.js';
import { CircuitBreaker } from '../../core/CircuitBreaker.js';
import { isMetricsInitialized, getMetrics, } from '../../monitoring/prometheus.js';
import { validateOrderRequest, createValidator } from '../../core/validation/middleware.js';
export class BaseAdapterCore {
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
    // Logger Methods
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
    // Cache Management
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
    // Health Check
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
    // Metrics
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
    // HTTP Request
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
    // ===========================================================================
    // Utility Methods
    // ===========================================================================
    supportsFeature(feature) {
        return this.has[feature] === true;
    }
    assertFeatureSupported(feature) {
        if (!this.has[feature]) {
            throw new PerpDEXError(`Feature '${feature}' is not supported by ${this.name}`, 'NOT_SUPPORTED', this.id);
        }
    }
    ensureInitialized() {
        if (!this._isReady) {
            throw new PerpDEXError(`${this.name} adapter not initialized. Call initialize() first.`, 'NOT_INITIALIZED', this.id);
        }
    }
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
}
//# sourceMappingURL=BaseAdapterCore.js.map
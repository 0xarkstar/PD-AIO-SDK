/**
 * Base Adapter Core
 *
 * Abstract base class providing core functionality for all adapters.
 * Contains state management, abstract method declarations, and essential properties.
 */
import { NotSupportedError } from '../../types/errors.js';
import { CircuitBreaker } from '../../core/CircuitBreaker.js';
import { isMetricsInitialized, getMetrics } from '../../monitoring/prometheus.js';
/**
 * Base Adapter Core
 *
 * Abstract class that forms the foundation for all exchange adapters.
 * Mixins are applied on top of this class to add specific capabilities.
 */
export class BaseAdapterCore {
    // ===========================================================================
    // State Properties
    // ===========================================================================
    _isReady = false;
    _isDisconnected = false;
    config;
    authStrategy;
    rateLimiter;
    circuitBreaker;
    httpClient;
    prometheusMetrics;
    // ===========================================================================
    // Resource Tracking
    // ===========================================================================
    timers = new Set();
    intervals = new Set();
    abortControllers = new Set();
    // ===========================================================================
    // Metrics (will be managed by MetricsTrackerMixin)
    // ===========================================================================
    metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rateLimitHits: 0,
        averageLatency: 0,
        endpointStats: new Map(),
        startedAt: Date.now(),
    };
    // ===========================================================================
    // Constructor
    // ===========================================================================
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
        // Circuit breaker event handlers will be set up in the composed class
        // to have access to logging methods from LoggerMixin
    }
    // ===========================================================================
    // Getters
    // ===========================================================================
    get isReady() {
        return this._isReady;
    }
    /**
     * Check if adapter has been disconnected
     */
    isDisconnected() {
        return this._isDisconnected;
    }
    // ===========================================================================
    // Optional Methods with Default Implementation
    // ===========================================================================
    /**
     * Fetch OHLCV (candlestick) data
     * Default implementation throws if not supported by exchange
     */
    async fetchOHLCV(_symbol, _timeframe, _params) {
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
                catch {
                    // Skip failed tickers
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
     * Default implementation throws if not supported
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
    async fetchDeposits(_currency, _since, _limit) {
        if (!this.has.fetchDeposits) {
            throw new NotSupportedError(`${this.name} does not support fetching deposit history`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchDeposits must be implemented by subclass');
    }
    /**
     * Fetch withdrawal history
     * Default implementation throws if not supported by exchange
     */
    async fetchWithdrawals(_currency, _since, _limit) {
        if (!this.has.fetchWithdrawals) {
            throw new NotSupportedError(`${this.name} does not support fetching withdrawal history`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchWithdrawals must be implemented by subclass');
    }
    /**
     * Fetch account ledger (transaction history)
     * Default implementation throws if not supported by exchange
     */
    async fetchLedger(_currency, _since, _limit, _params) {
        if (!this.has.fetchLedger) {
            throw new NotSupportedError(`${this.name} does not support fetching ledger`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchLedger must be implemented by subclass');
    }
    /**
     * Fetch funding payment history
     * Default implementation throws if not supported by exchange
     */
    async fetchFundingHistory(_symbol, _since, _limit) {
        if (!this.has.fetchFundingHistory) {
            throw new NotSupportedError(`${this.name} does not support fetching funding history`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('fetchFundingHistory must be implemented by subclass');
    }
    /**
     * Set margin mode
     * Default implementation throws if not supported
     */
    async setMarginMode(_symbol, _marginMode) {
        if (!this.has.setMarginMode || this.has.setMarginMode === 'emulated') {
            throw new NotSupportedError(`${this.name} does not support setting margin mode directly`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('setMarginMode must be implemented by subclass');
    }
    // ===========================================================================
    // WebSocket Streams - default implementation throws if not supported
    // ===========================================================================
    async *watchOrderBook(_symbol, _limit) {
        if (!this.has.watchOrderBook) {
            throw new NotSupportedError(`${this.name} does not support order book streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('watchOrderBook must be implemented by subclass');
        yield {}; // Type system requirement
    }
    async *watchTrades(_symbol) {
        if (!this.has.watchTrades) {
            throw new NotSupportedError(`${this.name} does not support trade streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('watchTrades must be implemented by subclass');
        yield {}; // Type system requirement
    }
    async *watchTicker(_symbol) {
        if (!this.has.watchTicker) {
            throw new NotSupportedError(`${this.name} does not support ticker streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('watchTicker must be implemented by subclass');
        yield {}; // Type system requirement
    }
    async *watchTickers(_symbols) {
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
    async *watchFundingRate(_symbol) {
        if (!this.has.watchFundingRate) {
            throw new NotSupportedError(`${this.name} does not support funding rate streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('watchFundingRate must be implemented by subclass');
        yield {}; // Type system requirement
    }
    async *watchOHLCV(_symbol, _timeframe) {
        if (!this.has.watchOHLCV) {
            throw new NotSupportedError(`${this.name} does not support OHLCV streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new Error('watchOHLCV must be implemented by subclass');
        yield [0, 0, 0, 0, 0, 0]; // Type system requirement
    }
    async *watchMyTrades(_symbol) {
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
}
//# sourceMappingURL=BaseAdapterCore.js.map
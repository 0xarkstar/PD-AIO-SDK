/**
 * Base Exchange Adapter
 *
 * Abstract base class providing common functionality for all adapters
 */

import type {
  Balance,
  ExchangeConfig,
  FeatureMap,
  FundingRate,
  IAuthStrategy,
  IExchangeAdapter,
  Market,
  MarketParams,
  Order,
  OrderBook,
  OrderBookParams,
  OrderRequest,
  Portfolio,
  Position,
  RateLimitStatus,
  Ticker,
  Trade,
  TradeParams,
  Transaction,
  UserFees,
} from '../../types/index.js';
import type {
  HealthCheckConfig,
  HealthCheckResult,
  ComponentHealth,
} from '../../types/health.js';
import { determineHealthStatus } from '../../types/health.js';
import type { APIMetrics, EndpointMetrics, MetricsSnapshot } from '../../types/metrics.js';
import { createMetricsSnapshot } from '../../types/metrics.js';
import { Logger, LogLevel } from '../../core/logger.js';

export abstract class BaseAdapter implements IExchangeAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly has: Partial<FeatureMap>;

  protected _isReady = false;
  protected _isDisconnected = false;
  protected readonly config: ExchangeConfig;
  protected authStrategy?: IAuthStrategy;
  protected rateLimiter?: any; // Rate limiter instance (if used)
  private _logger?: Logger;

  // Resource tracking
  protected timers: Set<NodeJS.Timeout> = new Set();
  protected intervals: Set<NodeJS.Timeout> = new Set();
  protected abortControllers: Set<AbortController> = new Set();

  // Cache management
  protected marketCache: Market[] | null = null;
  protected marketCacheExpiry: number = 0;
  protected marketCacheTTL: number = 5 * 60 * 1000; // 5 minutes default

  // Metrics tracking
  protected metrics: APIMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    rateLimitHits: 0,
    averageLatency: 0,
    endpointStats: new Map(),
    startedAt: Date.now(),
  };

  constructor(config: ExchangeConfig = {}) {
    this.config = {
      timeout: 30000,
      testnet: false,
      debug: false,
      ...config,
    };
  }

  /**
   * Get logger instance (lazy initialization with adapter name as context)
   */
  protected get logger(): Logger {
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

  get isReady(): boolean {
    return this._isReady;
  }

  /**
   * Check if adapter has been disconnected
   */
  isDisconnected(): boolean {
    return this._isDisconnected;
  }

  // ===========================================================================
  // Connection Management
  // ===========================================================================

  abstract initialize(): Promise<void>;

  /**
   * Disconnect and cleanup all resources
   *
   * Subclasses should override and call super.disconnect() at the end
   */
  async disconnect(): Promise<void> {
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

    // 5. Update state
    this._isReady = false;
    this._isDisconnected = true;

    this.debug('Disconnected and cleanup complete');
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
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
  async preloadMarkets(options?: {
    ttl?: number;
    params?: MarketParams;
  }): Promise<void> {
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
  getPreloadedMarkets(): Market[] | null {
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
  protected async fetchMarketsFromAPI(params?: MarketParams): Promise<Market[]> {
    // Default implementation delegates to fetchMarkets
    // Subclasses override this to provide actual API implementation
    return this.fetchMarkets(params);
  }

  /**
   * Perform health check on exchange adapter
   */
  async healthCheck(config: HealthCheckConfig = {}): Promise<HealthCheckResult> {
    const {
      timeout = 5000,
      checkWebSocket = true,
      checkAuth = true,
      includeRateLimit = true,
    } = config;

    const startTime = Date.now();
    const timestamp = Date.now();

    // Initialize result
    const result: HealthCheckResult = {
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
      result.status = determineHealthStatus(
        result.api.reachable,
        result.websocket?.connected,
        result.auth?.valid
      );

      result.latency = Date.now() - startTime;

      return result;
    } catch (error) {
      result.latency = Date.now() - startTime;
      result.api.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  /**
   * Check API health by making a lightweight request
   */
  protected async checkApiHealth(timeout: number): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      // Try to fetch a single ticker (lightweight operation)
      // Subclasses can override this method for exchange-specific checks
      await Promise.race([
        this.performApiHealthCheck(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), timeout)
        ),
      ]);

      return {
        reachable: true,
        latency: Date.now() - startTime,
      };
    } catch (error) {
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
  protected async performApiHealthCheck(): Promise<void> {
    // Default: try to fetch markets (most exchanges support this)
    await this.fetchMarkets({ active: true });
  }

  /**
   * Check WebSocket health
   * Subclasses should override if they use WebSocket
   */
  protected async checkWebSocketHealth(): Promise<{
    connected: boolean;
    reconnecting: boolean;
  }> {
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
  protected async checkAuthHealth(): Promise<{
    valid: boolean;
    expiresAt?: number;
    expiresIn?: number;
    needsRefresh?: boolean;
  }> {
    // Default: assume auth is valid if authStrategy exists
    return {
      valid: !!this.authStrategy,
    };
  }

  /**
   * Get current rate limit status
   */
  protected getRateLimitStatus(): {
    remaining: number;
    limit: number;
    resetAt: number;
    percentUsed: number;
  } | undefined {
    // Subclasses should override if they track rate limits
    return undefined;
  }

  // ===========================================================================
  // Market Data (Public) - must be implemented by subclasses
  // ===========================================================================

  abstract fetchMarkets(params?: MarketParams): Promise<Market[]>;
  abstract fetchTicker(symbol: string): Promise<Ticker>;
  abstract fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
  abstract fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
  abstract fetchFundingRate(symbol: string): Promise<FundingRate>;
  abstract fetchFundingRateHistory(
    symbol: string,
    since?: number,
    limit?: number
  ): Promise<FundingRate[]>;

  // ===========================================================================
  // Trading (Private) - must be implemented by subclasses
  // ===========================================================================

  abstract createOrder(request: OrderRequest): Promise<Order>;
  abstract cancelOrder(orderId: string, symbol?: string): Promise<Order>;
  abstract cancelAllOrders(symbol?: string): Promise<Order[]>;

  // ===========================================================================
  // Account History - must be implemented by subclasses
  // ===========================================================================

  abstract fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
  abstract fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]>;

  /**
   * Fetch deposit history
   * Default implementation throws if not supported by exchange
   */
  async fetchDeposits(currency?: string, since?: number, limit?: number): Promise<Transaction[]> {
    if (!this.has.fetchDeposits) {
      throw new Error(`${this.name} does not support fetching deposit history`);
    }
    throw new Error('fetchDeposits must be implemented by subclass');
  }

  /**
   * Fetch withdrawal history
   * Default implementation throws if not supported by exchange
   */
  async fetchWithdrawals(currency?: string, since?: number, limit?: number): Promise<Transaction[]> {
    if (!this.has.fetchWithdrawals) {
      throw new Error(`${this.name} does not support fetching withdrawal history`);
    }
    throw new Error('fetchWithdrawals must be implemented by subclass');
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
  async createBatchOrders(requests: OrderRequest[]): Promise<Order[]> {
    // If native batch is supported, subclass should override this method
    if (this.has.createBatchOrders === true) {
      throw new Error('createBatchOrders must be implemented by subclass when has.createBatchOrders is true');
    }

    // Fallback to sequential execution
    this.debug('No native batch support, creating orders sequentially', { count: requests.length });

    const orders: Order[] = [];
    const errors: Array<{ index: number; error: Error }> = [];

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      if (!request) continue; // Skip undefined entries

      try {
        const order = await this.createOrder(request);
        orders.push(order);
      } catch (error) {
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
        throw new Error(
          `All batch order creations failed. First error: ${firstError.error.message}`
        );
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
  async cancelBatchOrders(orderIds: string[], symbol?: string): Promise<Order[]> {
    // If native batch is supported, subclass should override this method
    if (this.has.cancelBatchOrders === true) {
      throw new Error('cancelBatchOrders must be implemented by subclass when has.cancelBatchOrders is true');
    }

    // Fallback to sequential execution
    this.debug('No native batch support, canceling orders sequentially', { count: orderIds.length });

    const orders: Order[] = [];
    const errors: Array<{ index: number; orderId: string; error: Error }> = [];

    for (let i = 0; i < orderIds.length; i++) {
      const orderId = orderIds[i];
      if (!orderId) continue; // Skip undefined entries

      try {
        const order = await this.cancelOrder(orderId, symbol);
        orders.push(order);
      } catch (error) {
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
        throw new Error(
          `All batch order cancellations failed. First error: ${firstError.error.message}`
        );
      }
    }

    // Log summary if some failed
    if (errors.length > 0) {
      this.debug('Batch order cancellation completed', { succeeded: orders.length, failed: errors.length });
    }

    return orders;
  }

  // ===========================================================================
  // Positions & Balance - must be implemented by subclasses
  // ===========================================================================

  abstract fetchPositions(symbols?: string[]): Promise<Position[]>;
  abstract fetchBalance(): Promise<Balance[]>;
  abstract setLeverage(symbol: string, leverage: number): Promise<void>;

  async setMarginMode(symbol: string, marginMode: 'cross' | 'isolated'): Promise<void> {
    if (!this.has.setMarginMode || this.has.setMarginMode === 'emulated') {
      throw new Error(`${this.name} does not support setting margin mode directly`);
    }
    throw new Error('setMarginMode must be implemented by subclass');
  }

  // ===========================================================================
  // WebSocket Streams - default implementation throws if not supported
  // ===========================================================================

  async *watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook> {
    if (!this.has.watchOrderBook) {
      throw new Error(`${this.name} does not support order book streaming`);
    }
    throw new Error('watchOrderBook must be implemented by subclass');
    yield {} as OrderBook; // Type system requirement
  }

  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    if (!this.has.watchTrades) {
      throw new Error(`${this.name} does not support trade streaming`);
    }
    throw new Error('watchTrades must be implemented by subclass');
    yield {} as Trade; // Type system requirement
  }

  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    if (!this.has.watchTicker) {
      throw new Error(`${this.name} does not support ticker streaming`);
    }
    throw new Error('watchTicker must be implemented by subclass');
    yield {} as Ticker; // Type system requirement
  }

  async *watchPositions(): AsyncGenerator<Position[]> {
    if (!this.has.watchPositions) {
      throw new Error(`${this.name} does not support position streaming`);
    }
    throw new Error('watchPositions must be implemented by subclass');
    yield [] as Position[]; // Type system requirement
  }

  async *watchOrders(): AsyncGenerator<Order[]> {
    if (!this.has.watchOrders) {
      throw new Error(`${this.name} does not support order streaming`);
    }
    throw new Error('watchOrders must be implemented by subclass');
    yield [] as Order[]; // Type system requirement
  }

  async *watchBalance(): AsyncGenerator<Balance[]> {
    if (!this.has.watchBalance) {
      throw new Error(`${this.name} does not support balance streaming`);
    }
    throw new Error('watchBalance must be implemented by subclass');
    yield [] as Balance[]; // Type system requirement
  }

  async *watchFundingRate(symbol: string): AsyncGenerator<FundingRate> {
    if (!this.has.watchFundingRate) {
      throw new Error(`${this.name} does not support funding rate streaming`);
    }
    throw new Error('watchFundingRate must be implemented by subclass');
    yield {} as FundingRate; // Type system requirement
  }

  // ===========================================================================
  // Additional Info Methods
  // ===========================================================================

  /**
   * Fetch user fee rates
   * Default implementation throws if not supported by exchange
   */
  async fetchUserFees(): Promise<UserFees> {
    if (!this.has.fetchUserFees) {
      throw new Error(`${this.name} does not support fetching user fees`);
    }
    throw new Error('fetchUserFees must be implemented by subclass');
  }

  /**
   * Fetch portfolio performance metrics
   * Default implementation throws if not supported by exchange
   */
  async fetchPortfolio(): Promise<Portfolio> {
    if (!this.has.fetchPortfolio) {
      throw new Error(`${this.name} does not support fetching portfolio metrics`);
    }
    throw new Error('fetchPortfolio must be implemented by subclass');
  }

  /**
   * Fetch current rate limit status
   * Default implementation throws if not supported by exchange
   */
  async fetchRateLimitStatus(): Promise<RateLimitStatus> {
    if (!this.has.fetchRateLimitStatus) {
      throw new Error(`${this.name} does not support fetching rate limit status`);
    }
    throw new Error('fetchRateLimitStatus must be implemented by subclass');
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  /**
   * Check if a feature is supported
   */
  protected supportsFeature(feature: keyof FeatureMap): boolean {
    return this.has[feature] === true;
  }

  /**
   * Ensure adapter is initialized
   */
  protected ensureInitialized(): void {
    if (!this._isReady) {
      throw new Error(`${this.name} adapter not initialized. Call initialize() first.`);
    }
  }

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
   * Make HTTP request with timeout and metrics tracking
   */
  protected async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    const startTime = Date.now();
    const endpoint = this.extractEndpoint(url);
    const endpointKey = `${method}:${endpoint}`;

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
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as T;

      // Track successful request
      const latency = Date.now() - startTime;
      this.metrics.successfulRequests++;
      this.updateEndpointMetrics(endpointKey, latency, false);
      this.updateAverageLatency(latency);

      return result;
    } catch (error) {
      // Track failed request
      const latency = Date.now() - startTime;
      this.metrics.failedRequests++;
      this.updateEndpointMetrics(endpointKey, latency, true);
      this.updateAverageLatency(latency);

      throw error;
    } finally {
      clearTimeout(timeout);
      this.timers.delete(timeout);
      this.abortControllers.delete(controller);
    }
  }

  /**
   * Register a timer for cleanup tracking
   */
  protected registerTimer(timer: NodeJS.Timeout): void {
    this.timers.add(timer);
  }

  /**
   * Register an interval for cleanup tracking
   */
  protected registerInterval(interval: NodeJS.Timeout): void {
    this.intervals.add(interval);
  }

  /**
   * Unregister and clear a timer
   */
  protected unregisterTimer(timer: NodeJS.Timeout): void {
    clearTimeout(timer);
    this.timers.delete(timer);
  }

  /**
   * Unregister and clear an interval
   */
  protected unregisterInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  /**
   * Extract endpoint path from URL for metrics tracking
   */
  protected extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      // If URL parsing fails, return the URL as-is
      return url;
    }
  }

  /**
   * Update per-endpoint metrics
   */
  protected updateEndpointMetrics(
    endpointKey: string,
    latency: number,
    isError: boolean
  ): void {
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
  protected updateAverageLatency(latency: number): void {
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
  public getMetrics(): MetricsSnapshot {
    return createMetricsSnapshot(this.metrics);
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
  public resetMetrics(): void {
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
  protected trackRateLimitHit(): void {
    this.metrics.rateLimitHits++;
  }

  // ===========================================================================
  // Logging Methods
  // ===========================================================================

  /**
   * Log debug message
   */
  protected debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  /**
   * Log info message
   */
  protected info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  /**
   * Log warning message
   */
  protected warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  /**
   * Log error message
   */
  protected error(message: string, error?: Error, meta?: Record<string, unknown>): void {
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
  fetch_open_orders(symbol?: string): Promise<Order[]> {
    throw new Error('fetchOpenOrders must be implemented by subclass');
  }

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

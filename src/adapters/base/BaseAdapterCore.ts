/**
 * Base Adapter Core
 *
 * Abstract base class providing infrastructure functionality for all adapters.
 * Contains logger, metrics, cache, health check, HTTP request, and connection management.
 */

import type {
  ExchangeConfig,
  FeatureMap,
  IAuthStrategy,
  Market,
  MarketParams,
  OrderRequest,
} from '../../types/index.js';
import { PerpDEXError } from '../../types/errors.js';
import type { HealthCheckConfig, HealthCheckResult, ComponentHealth } from '../../types/health.js';
import { determineHealthStatus } from '../../types/health.js';
import type { APIMetrics, MetricsSnapshot } from '../../types/metrics.js';
import { createMetricsSnapshot } from '../../types/metrics.js';
import { Logger, LogLevel, generateCorrelationId } from '../../core/logger.js';
import { CircuitBreaker } from '../../core/CircuitBreaker.js';
import type { HTTPClient } from '../../core/http/HTTPClient.js';
import {
  PrometheusMetrics,
  isMetricsInitialized,
  getMetrics,
} from '../../monitoring/prometheus.js';
import type { RateLimiter } from '../../core/RateLimiter.js';
import { validateOrderRequest, createValidator } from '../../core/validation/middleware.js';

export abstract class BaseAdapterCore {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly has: Partial<FeatureMap>;

  protected _isReady = false;
  protected _isDisconnected = false;
  protected readonly config: ExchangeConfig;
  protected authStrategy?: IAuthStrategy;
  protected rateLimiter?: RateLimiter;
  private _logger?: Logger;
  protected circuitBreaker: CircuitBreaker;
  protected httpClient?: HTTPClient;
  protected prometheusMetrics?: PrometheusMetrics;

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

  protected get logger(): Logger {
    if (!this._logger) {
      this._logger = new Logger(this.name, {
        level: this.config.debug ? LogLevel.DEBUG : LogLevel.INFO,
        enabled: true,
        maskSensitiveData: true,
      });
    }
    return this._logger;
  }

  protected debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  protected info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  protected warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  protected error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.logger.error(message, error, meta);
  }

  // ===========================================================================
  // State Getters
  // ===========================================================================

  get isReady(): boolean {
    return this._isReady;
  }

  isDisconnected(): boolean {
    return this._isDisconnected;
  }

  // ===========================================================================
  // Connection Management
  // ===========================================================================

  abstract initialize(): Promise<void>;

  async disconnect(): Promise<void> {
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

  clearCache(): void {
    this.marketCache = null;
    this.marketCacheExpiry = 0;
  }

  async preloadMarkets(options?: { ttl?: number; params?: MarketParams }): Promise<void> {
    const ttl = options?.ttl ?? this.marketCacheTTL;
    const params = options?.params;

    this.debug('Preloading markets...');
    const markets = await this.fetchMarketsFromAPI(params);

    this.marketCache = markets;
    this.marketCacheExpiry = Date.now() + ttl;
    this.marketCacheTTL = ttl;

    this.debug('Preloaded markets', { count: markets.length, ttl });
  }

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

  protected async fetchMarketsFromAPI(params?: MarketParams): Promise<Market[]> {
    return this.fetchMarkets(params);
  }

  // Abstract method needed for cache (will be implemented in concrete adapters)
  abstract fetchMarkets(params?: MarketParams): Promise<Market[]>;

  // ===========================================================================
  // Health Check
  // ===========================================================================

  async healthCheck(config: HealthCheckConfig = {}): Promise<HealthCheckResult> {
    const {
      timeout = 5000,
      checkWebSocket = true,
      checkAuth = true,
      includeRateLimit = true,
    } = config;

    const startTime = Date.now();
    const timestamp = Date.now();

    const result: HealthCheckResult = {
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

  protected async checkApiHealth(timeout: number): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      await Promise.race([
        this.performApiHealthCheck(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), timeout)
        ),
      ]);

      return { reachable: true, latency: Date.now() - startTime };
    } catch (error) {
      return {
        reachable: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  protected async performApiHealthCheck(): Promise<void> {
    await this.fetchMarkets({ active: true });
  }

  protected async checkWebSocketHealth(): Promise<{ connected: boolean; reconnecting: boolean }> {
    return { connected: false, reconnecting: false };
  }

  protected async checkAuthHealth(): Promise<{
    valid: boolean;
    expiresAt?: number;
    expiresIn?: number;
    needsRefresh?: boolean;
  }> {
    return { valid: !!this.authStrategy };
  }

  protected getRateLimitStatus():
    | {
        remaining: number;
        limit: number;
        resetAt: number;
        percentUsed: number;
      }
    | undefined {
    return undefined;
  }

  // ===========================================================================
  // Metrics
  // ===========================================================================

  protected updateEndpointMetrics(endpointKey: string, latency: number, isError: boolean): void {
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

  protected updateAverageLatency(latency: number): void {
    const total = this.metrics.totalRequests;
    const currentAvg = this.metrics.averageLatency;
    this.metrics.averageLatency = (currentAvg * (total - 1) + latency) / total;
  }

  public getMetrics(): MetricsSnapshot {
    return createMetricsSnapshot(this.metrics);
  }

  public getCircuitBreakerMetrics() {
    return this.circuitBreaker.getMetrics();
  }

  public getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }

  public resetMetrics(): void {
    this.metrics.lastResetAt = Date.now();
    this.metrics.totalRequests = 0;
    this.metrics.successfulRequests = 0;
    this.metrics.failedRequests = 0;
    this.metrics.rateLimitHits = 0;
    this.metrics.averageLatency = 0;
    this.metrics.endpointStats.clear();
  }

  protected trackRateLimitHit(): void {
    this.metrics.rateLimitHits++;
  }

  // ===========================================================================
  // HTTP Request
  // ===========================================================================

  protected async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    const maxAttempts = 3;
    const initialDelay = 1000;
    const maxDelay = 10000;
    const multiplier = 2;
    const retryableStatuses = [408, 429, 500, 502, 503, 504];

    const correlationId = generateCorrelationId();

    return this.circuitBreaker.execute(async () => {
      let lastError: Error | undefined;

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
            const shouldRetry =
              attempt < maxAttempts - 1 && retryableStatuses.includes(response.status);
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

          const result = (await response.json()) as T;

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
        } catch (error) {
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

          const isNetworkError =
            error instanceof Error &&
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

      throw this.attachCorrelationId(
        lastError || new Error('Request failed after retries'),
        correlationId
      );
    });
  }

  protected registerTimer(timer: NodeJS.Timeout): void {
    this.timers.add(timer);
  }

  protected registerInterval(interval: NodeJS.Timeout): void {
    this.intervals.add(interval);
  }

  protected unregisterTimer(timer: NodeJS.Timeout): void {
    clearTimeout(timer);
    this.timers.delete(timer);
  }

  protected unregisterInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  protected extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  protected supportsFeature(feature: keyof FeatureMap): boolean {
    return this.has[feature] === true;
  }

  protected assertFeatureSupported(feature: keyof FeatureMap): void {
    if (!this.has[feature]) {
      throw new PerpDEXError(
        `Feature '${feature}' is not supported by ${this.name}`,
        'NOT_SUPPORTED',
        this.id
      );
    }
  }

  protected ensureInitialized(): void {
    if (!this._isReady) {
      throw new PerpDEXError(
        `${this.name} adapter not initialized. Call initialize() first.`,
        'NOT_INITIALIZED',
        this.id
      );
    }
  }

  protected validateOrder(request: OrderRequest, correlationId?: string): OrderRequest {
    return validateOrderRequest(request, {
      exchange: this.id,
      context: correlationId ? { correlationId } : undefined,
    }) as OrderRequest;
  }

  protected getValidator() {
    return createValidator(this.id);
  }

  protected attachCorrelationId(error: unknown, correlationId: string): Error {
    if (error instanceof PerpDEXError) {
      error.withCorrelationId(correlationId);
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    return new PerpDEXError(message, 'REQUEST_ERROR', this.id, error).withCorrelationId(
      correlationId
    );
  }

  protected abstract symbolToExchange(symbol: string): string;
  protected abstract symbolFromExchange(exchangeSymbol: string): string;

}

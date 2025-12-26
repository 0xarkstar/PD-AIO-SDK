/**
 * Prometheus Metrics Integration
 *
 * Provides comprehensive monitoring and observability through Prometheus metrics.
 * Tracks exchange operations, circuit breaker state, request performance, and errors.
 */

import { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';

/**
 * Prometheus metrics configuration
 */
export interface PrometheusConfig {
  /**
   * Enable default system metrics (CPU, memory, etc.)
   */
  enableDefaultMetrics?: boolean;

  /**
   * Prefix for all metric names
   */
  metricPrefix?: string;

  /**
   * Custom registry (if not provided, default registry is used)
   */
  registry?: Registry;

  /**
   * Default metric labels applied to all metrics
   */
  defaultLabels?: Record<string, string>;
}

/**
 * Prometheus Metrics Manager
 *
 * Central manager for all application metrics.
 * Provides counters, gauges, and histograms for tracking performance and health.
 *
 * @example
 * ```typescript
 * const metrics = new PrometheusMetrics({
 *   metricPrefix: 'perpdex_',
 *   enableDefaultMetrics: true,
 * });
 *
 * // Record a successful request
 * metrics.recordRequest('hyperliquid', 'fetchMarkets', 'success', 150);
 *
 * // Update circuit breaker state
 * metrics.updateCircuitBreakerState('hyperliquid', 'OPEN');
 *
 * // Get metrics for scraping
 * const metricsText = await metrics.getMetrics();
 * ```
 */
export class PrometheusMetrics {
  private registry: Registry;
  private prefix: string;

  // Request metrics
  private requestCounter: Counter;
  private requestDuration: Histogram;
  private requestErrorCounter: Counter;

  // Circuit breaker metrics
  private circuitBreakerStateGauge: Gauge;
  private circuitBreakerTransitionCounter: Counter;
  private circuitBreakerFailureCounter: Counter;
  private circuitBreakerSuccessCounter: Counter;

  // WebSocket metrics
  private wsConnectionGauge: Gauge;
  private wsMessageCounter: Counter;
  private wsReconnectCounter: Counter;
  private wsErrorCounter: Counter;

  // Order metrics
  private orderCounter: Counter;
  private orderLatency: Histogram;
  private orderRejectionCounter: Counter;

  // Market data metrics
  private marketDataLatency: Histogram;
  private marketDataUpdateCounter: Counter;

  // Retry metrics
  private retryCounter: Counter;
  private retryAttemptsHistogram: Histogram;

  // Cache metrics
  private cacheHitCounter: Counter;
  private cacheMissCounter: Counter;

  constructor(config: PrometheusConfig = {}) {
    this.prefix = config.metricPrefix || 'perpdex_';
    this.registry = config.registry || new Registry();

    // Apply default labels
    if (config.defaultLabels) {
      this.registry.setDefaultLabels(config.defaultLabels);
    }

    // Enable default system metrics
    if (config.enableDefaultMetrics !== false) {
      collectDefaultMetrics({ register: this.registry });
    }

    // Initialize request metrics
    this.requestCounter = new Counter({
      name: `${this.prefix}requests_total`,
      help: 'Total number of requests made to exchanges',
      labelNames: ['exchange', 'operation', 'status'],
      registers: [this.registry],
    });

    this.requestDuration = new Histogram({
      name: `${this.prefix}request_duration_ms`,
      help: 'Request duration in milliseconds',
      labelNames: ['exchange', 'operation', 'status'],
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000, 10000],
      registers: [this.registry],
    });

    this.requestErrorCounter = new Counter({
      name: `${this.prefix}request_errors_total`,
      help: 'Total number of request errors',
      labelNames: ['exchange', 'operation', 'error_type'],
      registers: [this.registry],
    });

    // Initialize circuit breaker metrics
    this.circuitBreakerStateGauge = new Gauge({
      name: `${this.prefix}circuit_breaker_state`,
      help: 'Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
      labelNames: ['exchange'],
      registers: [this.registry],
    });

    this.circuitBreakerTransitionCounter = new Counter({
      name: `${this.prefix}circuit_breaker_transitions_total`,
      help: 'Total number of circuit breaker state transitions',
      labelNames: ['exchange', 'from_state', 'to_state'],
      registers: [this.registry],
    });

    this.circuitBreakerFailureCounter = new Counter({
      name: `${this.prefix}circuit_breaker_failures_total`,
      help: 'Total number of circuit breaker failures',
      labelNames: ['exchange'],
      registers: [this.registry],
    });

    this.circuitBreakerSuccessCounter = new Counter({
      name: `${this.prefix}circuit_breaker_successes_total`,
      help: 'Total number of circuit breaker successes',
      labelNames: ['exchange'],
      registers: [this.registry],
    });

    // Initialize WebSocket metrics
    this.wsConnectionGauge = new Gauge({
      name: `${this.prefix}websocket_connections`,
      help: 'Number of active WebSocket connections',
      labelNames: ['exchange'],
      registers: [this.registry],
    });

    this.wsMessageCounter = new Counter({
      name: `${this.prefix}websocket_messages_total`,
      help: 'Total number of WebSocket messages',
      labelNames: ['exchange', 'type'],
      registers: [this.registry],
    });

    this.wsReconnectCounter = new Counter({
      name: `${this.prefix}websocket_reconnects_total`,
      help: 'Total number of WebSocket reconnections',
      labelNames: ['exchange'],
      registers: [this.registry],
    });

    this.wsErrorCounter = new Counter({
      name: `${this.prefix}websocket_errors_total`,
      help: 'Total number of WebSocket errors',
      labelNames: ['exchange', 'error_type'],
      registers: [this.registry],
    });

    // Initialize order metrics
    this.orderCounter = new Counter({
      name: `${this.prefix}orders_total`,
      help: 'Total number of orders placed',
      labelNames: ['exchange', 'side', 'type', 'status'],
      registers: [this.registry],
    });

    this.orderLatency = new Histogram({
      name: `${this.prefix}order_latency_ms`,
      help: 'Order placement latency in milliseconds',
      labelNames: ['exchange', 'side', 'type'],
      buckets: [10, 25, 50, 100, 200, 500, 1000, 2000],
      registers: [this.registry],
    });

    this.orderRejectionCounter = new Counter({
      name: `${this.prefix}order_rejections_total`,
      help: 'Total number of order rejections',
      labelNames: ['exchange', 'reason'],
      registers: [this.registry],
    });

    // Initialize market data metrics
    this.marketDataLatency = new Histogram({
      name: `${this.prefix}market_data_latency_ms`,
      help: 'Market data update latency in milliseconds',
      labelNames: ['exchange', 'type'],
      buckets: [1, 5, 10, 25, 50, 100, 200, 500],
      registers: [this.registry],
    });

    this.marketDataUpdateCounter = new Counter({
      name: `${this.prefix}market_data_updates_total`,
      help: 'Total number of market data updates',
      labelNames: ['exchange', 'type'],
      registers: [this.registry],
    });

    // Initialize retry metrics
    this.retryCounter = new Counter({
      name: `${this.prefix}retries_total`,
      help: 'Total number of retries',
      labelNames: ['exchange', 'operation', 'success'],
      registers: [this.registry],
    });

    this.retryAttemptsHistogram = new Histogram({
      name: `${this.prefix}retry_attempts`,
      help: 'Number of retry attempts before success/failure',
      labelNames: ['exchange', 'operation'],
      buckets: [1, 2, 3, 4, 5, 10],
      registers: [this.registry],
    });

    // Initialize cache metrics
    this.cacheHitCounter = new Counter({
      name: `${this.prefix}cache_hits_total`,
      help: 'Total number of cache hits',
      labelNames: ['cache_name'],
      registers: [this.registry],
    });

    this.cacheMissCounter = new Counter({
      name: `${this.prefix}cache_misses_total`,
      help: 'Total number of cache misses',
      labelNames: ['cache_name'],
      registers: [this.registry],
    });
  }

  /**
   * Record a request
   */
  recordRequest(
    exchange: string,
    operation: string,
    status: 'success' | 'error',
    durationMs: number
  ): void {
    this.requestCounter.inc({ exchange, operation, status });
    this.requestDuration.observe({ exchange, operation, status }, durationMs);
  }

  /**
   * Record a request error
   */
  recordRequestError(exchange: string, operation: string, errorType: string): void {
    this.requestErrorCounter.inc({ exchange, operation, error_type: errorType });
  }

  /**
   * Update circuit breaker state
   */
  updateCircuitBreakerState(exchange: string, state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): void {
    const stateValue = state === 'CLOSED' ? 0 : state === 'OPEN' ? 1 : 2;
    this.circuitBreakerStateGauge.set({ exchange }, stateValue);
  }

  /**
   * Record circuit breaker state transition
   */
  recordCircuitBreakerTransition(
    exchange: string,
    fromState: string,
    toState: string
  ): void {
    this.circuitBreakerTransitionCounter.inc({ exchange, from_state: fromState, to_state: toState });
  }

  /**
   * Record circuit breaker failure
   */
  recordCircuitBreakerFailure(exchange: string): void {
    this.circuitBreakerFailureCounter.inc({ exchange });
  }

  /**
   * Record circuit breaker success
   */
  recordCircuitBreakerSuccess(exchange: string): void {
    this.circuitBreakerSuccessCounter.inc({ exchange });
  }

  /**
   * Update WebSocket connection count
   */
  setWebSocketConnections(exchange: string, count: number): void {
    this.wsConnectionGauge.set({ exchange }, count);
  }

  /**
   * Record WebSocket message
   */
  recordWebSocketMessage(exchange: string, type: 'incoming' | 'outgoing'): void {
    this.wsMessageCounter.inc({ exchange, type });
  }

  /**
   * Record WebSocket reconnection
   */
  recordWebSocketReconnect(exchange: string): void {
    this.wsReconnectCounter.inc({ exchange });
  }

  /**
   * Record WebSocket error
   */
  recordWebSocketError(exchange: string, errorType: string): void {
    this.wsErrorCounter.inc({ exchange, error_type: errorType });
  }

  /**
   * Record order
   */
  recordOrder(
    exchange: string,
    side: 'buy' | 'sell',
    type: string,
    status: 'placed' | 'filled' | 'cancelled' | 'rejected',
    latencyMs?: number
  ): void {
    this.orderCounter.inc({ exchange, side, type, status });

    if (latencyMs !== undefined && status === 'placed') {
      this.orderLatency.observe({ exchange, side, type }, latencyMs);
    }
  }

  /**
   * Record order rejection
   */
  recordOrderRejection(exchange: string, reason: string): void {
    this.orderRejectionCounter.inc({ exchange, reason });
  }

  /**
   * Record market data update
   */
  recordMarketDataUpdate(exchange: string, type: 'orderbook' | 'trades' | 'ticker', latencyMs: number): void {
    this.marketDataUpdateCounter.inc({ exchange, type });
    this.marketDataLatency.observe({ exchange, type }, latencyMs);
  }

  /**
   * Record retry
   */
  recordRetry(exchange: string, operation: string, attempts: number, success: boolean): void {
    this.retryCounter.inc({ exchange, operation, success: success ? 'true' : 'false' });
    this.retryAttemptsHistogram.observe({ exchange, operation }, attempts);
  }

  /**
   * Record cache hit
   */
  recordCacheHit(cacheName: string): void {
    this.cacheHitCounter.inc({ cache_name: cacheName });
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(cacheName: string): void {
    this.cacheMissCounter.inc({ cache_name: cacheName });
  }

  /**
   * Get metrics in Prometheus text format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get metrics as JSON
   */
  async getMetricsAsJSON(): Promise<any> {
    return this.registry.getMetricsAsJSON();
  }

  /**
   * Get content type for metrics endpoint
   */
  getContentType(): string {
    return this.registry.contentType;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  resetMetrics(): void {
    this.registry.resetMetrics();
  }

  /**
   * Clear all metrics (removes them from registry)
   */
  clearMetrics(): void {
    this.registry.clear();
  }

  /**
   * Get the registry instance
   */
  getRegistry(): Registry {
    return this.registry;
  }
}

/**
 * Global metrics instance
 */
let globalMetrics: PrometheusMetrics | null = null;

/**
 * Initialize global metrics instance
 */
export function initializeMetrics(config?: PrometheusConfig): PrometheusMetrics {
  globalMetrics = new PrometheusMetrics(config);
  return globalMetrics;
}

/**
 * Get global metrics instance
 */
export function getMetrics(): PrometheusMetrics {
  if (!globalMetrics) {
    throw new Error('Metrics not initialized. Call initializeMetrics() first.');
  }
  return globalMetrics;
}

/**
 * Check if metrics are initialized
 */
export function isMetricsInitialized(): boolean {
  return globalMetrics !== null;
}

/**
 * Prometheus Metrics Integration
 *
 * Provides comprehensive monitoring and observability through Prometheus metrics.
 * Tracks exchange operations, circuit breaker state, request performance, and errors.
 */
import { Registry } from 'prom-client';
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
export declare class PrometheusMetrics {
    private registry;
    private prefix;
    private requestCounter;
    private requestDuration;
    private requestErrorCounter;
    private circuitBreakerStateGauge;
    private circuitBreakerTransitionCounter;
    private circuitBreakerFailureCounter;
    private circuitBreakerSuccessCounter;
    private wsConnectionGauge;
    private wsMessageCounter;
    private wsReconnectCounter;
    private wsErrorCounter;
    private orderCounter;
    private orderLatency;
    private orderRejectionCounter;
    private marketDataLatency;
    private marketDataUpdateCounter;
    private retryCounter;
    private retryAttemptsHistogram;
    private cacheHitCounter;
    private cacheMissCounter;
    constructor(config?: PrometheusConfig);
    /**
     * Record a request
     */
    recordRequest(exchange: string, operation: string, status: 'success' | 'error', durationMs: number): void;
    /**
     * Record a request error
     */
    recordRequestError(exchange: string, operation: string, errorType: string): void;
    /**
     * Update circuit breaker state
     */
    updateCircuitBreakerState(exchange: string, state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): void;
    /**
     * Record circuit breaker state transition
     */
    recordCircuitBreakerTransition(exchange: string, fromState: string, toState: string): void;
    /**
     * Record circuit breaker failure
     */
    recordCircuitBreakerFailure(exchange: string): void;
    /**
     * Record circuit breaker success
     */
    recordCircuitBreakerSuccess(exchange: string): void;
    /**
     * Update WebSocket connection count
     */
    setWebSocketConnections(exchange: string, count: number): void;
    /**
     * Record WebSocket message
     */
    recordWebSocketMessage(exchange: string, type: 'incoming' | 'outgoing'): void;
    /**
     * Record WebSocket reconnection
     */
    recordWebSocketReconnect(exchange: string): void;
    /**
     * Record WebSocket error
     */
    recordWebSocketError(exchange: string, errorType: string): void;
    /**
     * Record order
     */
    recordOrder(exchange: string, side: 'buy' | 'sell', type: string, status: 'placed' | 'filled' | 'cancelled' | 'rejected', latencyMs?: number): void;
    /**
     * Record order rejection
     */
    recordOrderRejection(exchange: string, reason: string): void;
    /**
     * Record market data update
     */
    recordMarketDataUpdate(exchange: string, type: 'orderbook' | 'trades' | 'ticker', latencyMs: number): void;
    /**
     * Record retry
     */
    recordRetry(exchange: string, operation: string, attempts: number, success: boolean): void;
    /**
     * Record cache hit
     */
    recordCacheHit(cacheName: string): void;
    /**
     * Record cache miss
     */
    recordCacheMiss(cacheName: string): void;
    /**
     * Get metrics in Prometheus text format
     */
    getMetrics(): Promise<string>;
    /**
     * Get metrics as JSON
     */
    getMetricsAsJSON(): Promise<any>;
    /**
     * Get content type for metrics endpoint
     */
    getContentType(): string;
    /**
     * Reset all metrics (useful for testing)
     */
    resetMetrics(): void;
    /**
     * Clear all metrics (removes them from registry)
     */
    clearMetrics(): void;
    /**
     * Get the registry instance
     */
    getRegistry(): Registry;
}
/**
 * Initialize global metrics instance
 */
export declare function initializeMetrics(config?: PrometheusConfig): PrometheusMetrics;
/**
 * Get global metrics instance
 */
export declare function getMetrics(): PrometheusMetrics;
/**
 * Check if metrics are initialized
 */
export declare function isMetricsInitialized(): boolean;
//# sourceMappingURL=prometheus.d.ts.map
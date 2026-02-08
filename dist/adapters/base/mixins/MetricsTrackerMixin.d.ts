/**
 * Metrics Tracker Mixin
 *
 * Provides API metrics collection and reporting capabilities.
 */
import type { APIMetrics, MetricsSnapshot } from '../../../types/metrics.js';
import type { Constructor } from './LoggerMixin.js';
import type { CircuitBreaker } from '../../../core/CircuitBreaker.js';
/**
 * Base interface for metrics mixin requirements
 */
export interface IMetricsMixinBase {
    readonly id: string;
    readonly circuitBreaker: CircuitBreaker;
}
/**
 * Interface for metrics capabilities
 */
export interface IMetricsCapable {
    getMetrics(): MetricsSnapshot;
    getCircuitBreakerMetrics(): ReturnType<CircuitBreaker['getMetrics']>;
    getCircuitBreakerState(): ReturnType<CircuitBreaker['getState']>;
    resetMetrics(): void;
}
/**
 * Metrics Tracker Mixin - adds metrics collection capabilities to a class
 *
 * @example
 * ```typescript
 * class MyAdapter extends MetricsTrackerMixin(BaseClass) {
 *   async makeRequest() {
 *     const start = Date.now();
 *     try {
 *       // ... make request
 *       this.updateEndpointMetrics('GET:/api', Date.now() - start, false);
 *     } catch (error) {
 *       this.updateEndpointMetrics('GET:/api', Date.now() - start, true);
 *     }
 *   }
 * }
 * ```
 */
export declare function MetricsTrackerMixin<T extends Constructor<IMetricsMixinBase>>(Base: T): {
    new (...args: any[]): {
        /**
         * Internal metrics storage
         * @internal
         */
        metrics: APIMetrics;
        /**
         * Update per-endpoint metrics
         * @internal
         */
        updateEndpointMetrics(endpointKey: string, latency: number, isError: boolean): void;
        /**
         * Update rolling average latency
         * @internal
         */
        updateAverageLatency(latency: number): void;
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
        getCircuitBreakerMetrics(): import("../../../core/CircuitBreaker.js").CircuitBreakerMetrics;
        /**
         * Get circuit breaker state
         *
         * @returns Current circuit state: 'CLOSED', 'OPEN', or 'HALF_OPEN'
         */
        getCircuitBreakerState(): import("../../../core/CircuitBreaker.js").CircuitState;
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
         * @internal
         */
        trackRateLimitHit(): void;
        readonly id: string;
        readonly circuitBreaker: CircuitBreaker;
    };
} & T;
//# sourceMappingURL=MetricsTrackerMixin.d.ts.map
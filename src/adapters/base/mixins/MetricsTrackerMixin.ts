/**
 * Metrics Tracker Mixin
 *
 * Provides API metrics collection and reporting capabilities.
 */

import type { APIMetrics, MetricsSnapshot } from '../../../types/metrics.js';
import { createMetricsSnapshot } from '../../../types/metrics.js';
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
export function MetricsTrackerMixin<T extends Constructor<IMetricsMixinBase>>(Base: T) {
  return class MetricsTrackerMixinClass extends Base {
    /**
     * Internal metrics storage
     * @internal
     */
    metrics: APIMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitHits: 0,
      averageLatency: 0,
      endpointStats: new Map(),
      startedAt: Date.now(),
    };

    /**
     * Update per-endpoint metrics
     * @internal
     */
    updateEndpointMetrics(endpointKey: string, latency: number, isError: boolean): void {
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
     * @internal
     */
    updateAverageLatency(latency: number): void {
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
    public getCircuitBreakerMetrics() {
      return this.circuitBreaker.getMetrics();
    }

    /**
     * Get circuit breaker state
     *
     * @returns Current circuit state: 'CLOSED', 'OPEN', or 'HALF_OPEN'
     */
    public getCircuitBreakerState() {
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
     * @internal
     */
    trackRateLimitHit(): void {
      this.metrics.rateLimitHits++;
    }
  };
}

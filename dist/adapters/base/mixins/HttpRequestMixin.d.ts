/**
 * HTTP Request Mixin
 *
 * Provides HTTP request handling with retry logic, circuit breaker, and metrics.
 */
import type { ExchangeConfig } from '../../../types/index.js';
import type { CircuitBreaker } from '../../../core/CircuitBreaker.js';
import type { PrometheusMetrics } from '../../../monitoring/prometheus.js';
import type { APIMetrics } from '../../../types/metrics.js';
import type { Constructor } from './LoggerMixin.js';
/**
 * Base interface for HTTP request mixin requirements
 */
export interface IHttpRequestMixinBase {
    readonly id: string;
    readonly config: ExchangeConfig;
    readonly circuitBreaker: CircuitBreaker;
    readonly prometheusMetrics?: PrometheusMetrics;
    readonly metrics: APIMetrics;
    readonly timers: Set<NodeJS.Timeout>;
    readonly abortControllers: Set<AbortController>;
    debug(message: string, meta?: Record<string, unknown>): void;
    updateEndpointMetrics(endpointKey: string, latency: number, isError: boolean): void;
    updateAverageLatency(latency: number): void;
    attachCorrelationId(error: unknown, correlationId: string): Error;
}
/**
 * Interface for HTTP request capabilities
 */
export interface IHttpRequestCapable {
    request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: unknown, headers?: Record<string, string>): Promise<T>;
    registerTimer(timer: NodeJS.Timeout): void;
    unregisterTimer(timer: NodeJS.Timeout): void;
    registerInterval(interval: NodeJS.Timeout): void;
    unregisterInterval(interval: NodeJS.Timeout): void;
}
/**
 * HTTP Request Mixin - adds HTTP request capabilities with retry and circuit breaker
 *
 * @example
 * ```typescript
 * class MyAdapter extends HttpRequestMixin(BaseClass) {
 *   async fetchData() {
 *     return this.request<MyData>('GET', 'https://api.example.com/data');
 *   }
 * }
 * ```
 */
export declare function HttpRequestMixin<T extends Constructor<IHttpRequestMixinBase>>(Base: T): {
    new (...args: any[]): {
        /**
         * Interval tracking for cleanup
         * @internal
         */
        intervals: Set<NodeJS.Timeout>;
        /**
         * Make HTTP request with timeout, circuit breaker, retry, and metrics tracking
         * @internal
         */
        request<R>(method: "GET" | "POST" | "PUT" | "DELETE", url: string, body?: unknown, headers?: Record<string, string>): Promise<R>;
        /**
         * Register a timer for cleanup tracking
         * @internal
         */
        registerTimer(timer: NodeJS.Timeout): void;
        /**
         * Register an interval for cleanup tracking
         * @internal
         */
        registerInterval(interval: NodeJS.Timeout): void;
        /**
         * Unregister and clear a timer
         * @internal
         */
        unregisterTimer(timer: NodeJS.Timeout): void;
        /**
         * Unregister and clear an interval
         * @internal
         */
        unregisterInterval(interval: NodeJS.Timeout): void;
        /**
         * Extract endpoint path from URL for metrics tracking
         * @internal
         */
        extractEndpoint(url: string): string;
        readonly id: string;
        readonly config: ExchangeConfig;
        readonly circuitBreaker: CircuitBreaker;
        readonly prometheusMetrics?: PrometheusMetrics;
        readonly metrics: APIMetrics;
        readonly timers: Set<NodeJS.Timeout>;
        readonly abortControllers: Set<AbortController>;
        debug(message: string, meta?: Record<string, unknown>): void;
        updateEndpointMetrics(endpointKey: string, latency: number, isError: boolean): void;
        updateAverageLatency(latency: number): void;
        attachCorrelationId(error: unknown, correlationId: string): Error;
    };
} & T;
//# sourceMappingURL=HttpRequestMixin.d.ts.map
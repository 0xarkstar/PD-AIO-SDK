/**
 * Production Resilience Utilities
 *
 * Combines circuit breaker, retry logic, and fallback mechanisms
 * for building production-grade fault-tolerant applications.
 */
import { type RetryConfig } from './retry.js';
import { type CircuitBreakerConfig } from './CircuitBreaker.js';
/**
 * Resilience configuration combining circuit breaker and retry
 */
export interface ResilienceConfig {
    /**
     * Circuit breaker configuration
     */
    circuitBreaker?: CircuitBreakerConfig;
    /**
     * Retry configuration
     */
    retry?: Partial<RetryConfig>;
    /**
     * Fallback function to call when both circuit breaker and retries fail
     */
    fallback?: <T>(error: Error) => Promise<T> | T;
    /**
     * Function to call on each failure
     */
    onFailure?: (error: Error, context: FailureContext) => void;
}
/**
 * Context information about a failure
 */
export interface FailureContext {
    /**
     * Type of failure
     */
    type: 'circuit_open' | 'retry_exhausted' | 'fallback_failed';
    /**
     * Number of attempts made (for retries)
     */
    attempts?: number;
    /**
     * Circuit breaker state when failure occurred
     */
    circuitState?: string;
    /**
     * Original operation that failed
     */
    operation: string;
}
/**
 * Create a resilient executor that combines circuit breaker + retry + fallback
 *
 * The resilience layers are applied in this order:
 * 1. Circuit Breaker (outermost) - Fast-fail if service is down
 * 2. Retry Logic - Retry transient failures
 * 3. Fallback - Provide alternative when all else fails
 *
 * @param config - Resilience configuration
 * @returns Resilient executor function
 *
 * @example
 * ```typescript
 * const resilientExecutor = createResilientExecutor({
 *   circuitBreaker: {
 *     failureThreshold: 5,
 *     resetTimeout: 30000,
 *   },
 *   retry: {
 *     maxAttempts: 3,
 *     baseDelay: 1000,
 *   },
 *   fallback: async (error) => {
 *     console.log('Using cached data due to:', error.message);
 *     return getCachedData();
 *   },
 * });
 *
 * // Use it
 * const markets = await resilientExecutor(
 *   () => exchange.fetchMarkets(),
 *   'fetchMarkets'
 * );
 * ```
 */
export declare function createResilientExecutor(config?: ResilienceConfig): <T>(fn: () => Promise<T>, operationName?: string) => Promise<T>;
/**
 * Resilient function wrapper
 *
 * Wraps an async function with circuit breaker, retry, and fallback protection.
 *
 * @param fn - Function to wrap
 * @param config - Resilience configuration
 * @returns Wrapped function with resilience
 *
 * @example
 * ```typescript
 * const resilientFetchMarkets = withResilience(
 *   () => exchange.fetchMarkets(),
 *   {
 *     circuitBreaker: { failureThreshold: 5 },
 *     retry: { maxAttempts: 3 },
 *     fallback: async () => getCachedMarkets(),
 *   }
 * );
 *
 * // Call it
 * const markets = await resilientFetchMarkets();
 * ```
 */
export declare function withResilience<T, Args extends any[]>(fn: (...args: Args) => Promise<T>, config?: ResilienceConfig, operationName?: string): (...args: Args) => Promise<T>;
/**
 * Decorator for adding resilience to class methods
 *
 * @param config - Resilience configuration
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class MyService {
 *   @Resilient({
 *     circuitBreaker: { failureThreshold: 5 },
 *     retry: { maxAttempts: 3 },
 *   })
 *   async fetchData() {
 *     return await fetch('/api/data');
 *   }
 * }
 * ```
 */
export declare function Resilient(config?: ResilienceConfig): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Bulkhead pattern implementation
 *
 * Limits concurrent executions to prevent resource exhaustion.
 *
 * @example
 * ```typescript
 * const bulkhead = new Bulkhead({ maxConcurrent: 10 });
 *
 * // Will queue if more than 10 concurrent requests
 * await bulkhead.execute(() => exchange.fetchMarkets());
 * ```
 */
export declare class Bulkhead {
    private readonly config;
    private currentExecutions;
    private readonly queue;
    constructor(config: {
        maxConcurrent: number;
        maxQueue?: number;
    });
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private executeNow;
    getMetrics(): {
        currentExecutions: number;
        queuedExecutions: number;
        capacity: number;
        utilization: number;
    };
}
/**
 * Timeout wrapper
 *
 * Wraps a promise with a timeout.
 *
 * @param promise - Promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Custom error message
 * @returns Promise that rejects if timeout is reached
 *
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   exchange.fetchMarkets(),
 *   5000,
 *   'Markets fetch timeout'
 * );
 * ```
 */
export declare function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage?: string): Promise<T>;
/**
 * Cache wrapper with TTL
 *
 * Caches the result of a function for a specified time.
 *
 * @example
 * ```typescript
 * const cachedFetchMarkets = withCache(
 *   () => exchange.fetchMarkets(),
 *   60000 // 1 minute TTL
 * );
 *
 * const markets = await cachedFetchMarkets(); // Fetches
 * const markets2 = await cachedFetchMarkets(); // Returns cached
 * ```
 */
export declare function withCache<T>(fn: () => Promise<T>, ttlMs: number): () => Promise<T>;
//# sourceMappingURL=resilience.d.ts.map
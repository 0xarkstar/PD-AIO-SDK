/**
 * Production Resilience Utilities
 *
 * Combines circuit breaker, retry logic, and fallback mechanisms
 * for building production-grade fault-tolerant applications.
 */

import { withRetry, type RetryConfig } from './retry.js';
import {
  CircuitBreaker,
  CircuitBreakerError,
  type CircuitBreakerConfig,
} from './CircuitBreaker.js';

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
export function createResilientExecutor(config: ResilienceConfig = {}) {
  const circuitBreaker = new CircuitBreaker(config.circuitBreaker);

  return async function execute<T>(
    fn: () => Promise<T>,
    operationName: string = 'unknown'
  ): Promise<T> {
    try {
      // Layer 1: Circuit Breaker
      return await circuitBreaker.execute(async () => {
        // Layer 2: Retry Logic
        if (config.retry) {
          return await withRetry(fn, config.retry);
        }
        return await fn();
      });
    } catch (error) {
      const err = error as Error;

      // Determine failure type
      let context: FailureContext;
      if (err instanceof CircuitBreakerError) {
        context = {
          type: 'circuit_open',
          circuitState: err.state,
          operation: operationName,
        };
      } else {
        context = {
          type: 'retry_exhausted',
          attempts: config.retry?.maxAttempts,
          circuitState: circuitBreaker.getState(),
          operation: operationName,
        };
      }

      // Call failure handler
      if (config.onFailure) {
        config.onFailure(err, context);
      }

      // Layer 3: Fallback
      if (config.fallback) {
        try {
          return await config.fallback<T>(err);
        } catch (fallbackError) {
          // Fallback itself failed
          if (config.onFailure) {
            config.onFailure(fallbackError as Error, {
              type: 'fallback_failed',
              operation: operationName,
            });
          }
          throw fallbackError;
        }
      }

      // No fallback, rethrow original error
      throw error;
    }
  };
}

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
export function withResilience<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  config: ResilienceConfig = {},
  operationName?: string
): (...args: Args) => Promise<T> {
  const executor = createResilientExecutor(config);

  return async (...args: Args): Promise<T> => {
    const name = operationName || fn.name || 'anonymous';
    return executor(() => fn(...args), name);
  };
}

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
export function Resilient(config: ResilienceConfig = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== 'function') {
      throw new Error(`@Resilient can only be applied to methods`);
    }

    const executor = createResilientExecutor(config);

    descriptor.value = async function (this: any, ...args: any[]) {
      return executor(
        () => originalMethod.apply(this, args),
        `${target.constructor.name}.${propertyKey}`
      );
    };

    return descriptor;
  };
}

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
export class Bulkhead {
  private currentExecutions = 0;
  private readonly queue: Array<() => void> = [];

  constructor(
    private readonly config: {
      maxConcurrent: number;
      maxQueue?: number;
    }
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if we can execute immediately
    if (this.currentExecutions < this.config.maxConcurrent) {
      return this.executeNow(fn);
    }

    // Check queue limit
    if (this.config.maxQueue && this.queue.length >= this.config.maxQueue) {
      throw new Error('Bulkhead queue is full');
    }

    // Wait in queue
    await new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });

    return this.executeNow(fn);
  }

  private async executeNow<T>(fn: () => Promise<T>): Promise<T> {
    this.currentExecutions++;

    try {
      return await fn();
    } finally {
      this.currentExecutions--;

      // Process queue
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }

  getMetrics() {
    return {
      currentExecutions: this.currentExecutions,
      queuedExecutions: this.queue.length,
      capacity: this.config.maxConcurrent,
      utilization: this.currentExecutions / this.config.maxConcurrent,
    };
  }
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
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs)),
  ]);
}

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
export function withCache<T>(fn: () => Promise<T>, ttlMs: number): () => Promise<T> {
  let cachedValue: T | null = null;
  let cacheExpiry: number = 0;

  return async (): Promise<T> => {
    const now = Date.now();

    if (cachedValue !== null && now < cacheExpiry) {
      return cachedValue;
    }

    cachedValue = await fn();
    cacheExpiry = now + ttlMs;

    return cachedValue;
  };
}

/**
 * Automatic Retry Logic with Exponential Backoff
 *
 * Provides resilient API request handling with configurable retry strategies
 */
/**
 * Retry configuration options
 */
export interface RetryConfig {
    /**
     * Maximum number of retry attempts (default: 3)
     */
    maxAttempts: number;
    /**
     * Base delay between retries in milliseconds (default: 1000)
     */
    baseDelay: number;
    /**
     * Maximum delay cap in milliseconds (default: 30000 = 30s)
     */
    maxDelay: number;
    /**
     * Backoff multiplier for exponential backoff (default: 2)
     */
    backoffMultiplier: number;
    /**
     * Add random jitter to prevent thundering herd (default: true)
     */
    enableJitter: boolean;
    /**
     * Error types that should trigger retry
     */
    retryableErrors: Array<new (...args: any[]) => Error>;
    /**
     * Custom function to determine if error is retryable
     */
    isRetryable?: (error: Error) => boolean;
    /**
     * Callback invoked before each retry
     */
    onRetry?: (attempt: number, error: Error, delay: number) => void;
}
/**
 * Execute a function with automatic retry on failure
 *
 * @param fn - Async function to execute
 * @param config - Retry configuration (optional)
 * @returns Promise resolving to function result
 * @throws Last error if all retries exhausted
 *
 * @example
 * ```typescript
 * import { withRetry, RateLimitError } from 'perp-dex-sdk';
 *
 * // Basic usage with defaults
 * const result = await withRetry(() => exchange.fetchMarkets());
 *
 * // Custom configuration
 * const order = await withRetry(
 *   () => exchange.createOrder({ ... }),
 *   {
 *     maxAttempts: 5,
 *     baseDelay: 2000,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`);
 *     }
 *   }
 * );
 *
 * // Custom retryable check
 * const data = await withRetry(
 *   () => fetchData(),
 *   {
 *     isRetryable: (error) => error.message.includes('timeout')
 *   }
 * );
 * ```
 */
export declare function withRetry<T>(fn: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T>;
/**
 * Create a retry-wrapped version of an async function
 *
 * @param fn - Function to wrap
 * @param config - Retry configuration
 * @returns Wrapped function with automatic retry
 *
 * @example
 * ```typescript
 * const resilientFetchMarkets = withRetryWrapper(
 *   () => exchange.fetchMarkets(),
 *   { maxAttempts: 5 }
 * );
 *
 * // Now can call multiple times with retry built-in
 * const markets1 = await resilientFetchMarkets();
 * const markets2 = await resilientFetchMarkets();
 * ```
 */
export declare function withRetryWrapper<T, Args extends any[]>(fn: (...args: Args) => Promise<T>, config?: Partial<RetryConfig>): (...args: Args) => Promise<T>;
/**
 * Retry a function with linear backoff (instead of exponential)
 *
 * @param fn - Function to execute
 * @param config - Retry configuration
 * @returns Promise resolving to function result
 */
export declare function withLinearRetry<T>(fn: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T>;
/**
 * Retry statistics collector
 */
export declare class RetryStats {
    private attempts;
    private successes;
    private failures;
    record(attempts: number, success: boolean): void;
    getStats(): {
        total: number;
        successes: number;
        failures: number;
        successRate: number;
        averageAttempts: number;
    };
    reset(): void;
}
/**
 * Execute with retry and collect statistics
 */
export declare function withRetryStats<T>(fn: () => Promise<T>, stats: RetryStats, config?: Partial<RetryConfig>): Promise<T>;
//# sourceMappingURL=retry.d.ts.map
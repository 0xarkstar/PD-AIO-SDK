/**
 * Automatic Retry Logic with Exponential Backoff
 *
 * Provides resilient API request handling with configurable retry strategies
 */
import { RateLimitError, ExchangeUnavailableError, WebSocketDisconnectedError, } from '../types/errors.js';
/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    enableJitter: true,
    retryableErrors: [RateLimitError, ExchangeUnavailableError, WebSocketDisconnectedError],
};
/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt, baseDelay, maxDelay, multiplier, enableJitter) {
    // Exponential backoff: baseDelay * multiplier^(attempt - 1)
    let delay = baseDelay * Math.pow(multiplier, attempt - 1);
    // Apply jitter (±25% randomness)
    if (enableJitter) {
        const jitter = delay * 0.25 * (Math.random() * 2 - 1);
        delay += jitter;
    }
    // Cap at max delay
    return Math.min(Math.max(delay, 0), maxDelay);
}
/**
 * Check if error is retryable based on configuration
 */
function isErrorRetryable(error, config) {
    // Use custom check if provided
    if (config.isRetryable) {
        return config.isRetryable(error);
    }
    // Check if error is instance of any retryable error types
    return config.retryableErrors.some((ErrorClass) => error instanceof ErrorClass);
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
export async function withRetry(fn, config = {}) {
    const fullConfig = {
        ...DEFAULT_RETRY_CONFIG,
        ...config,
    };
    let lastError;
    let attempt = 0;
    while (attempt < fullConfig.maxAttempts) {
        attempt++;
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            // Check if we should retry
            const shouldRetry = isErrorRetryable(lastError, fullConfig);
            const isLastAttempt = attempt >= fullConfig.maxAttempts;
            if (!shouldRetry || isLastAttempt) {
                throw error;
            }
            // Calculate delay
            let delay;
            // Special handling for RateLimitError with retryAfter
            if (error instanceof RateLimitError && error.retryAfter) {
                delay = error.retryAfter;
            }
            else {
                delay = calculateDelay(attempt, fullConfig.baseDelay, fullConfig.maxDelay, fullConfig.backoffMultiplier, fullConfig.enableJitter);
            }
            // Invoke retry callback
            if (fullConfig.onRetry) {
                fullConfig.onRetry(attempt, lastError, delay);
            }
            // Wait before retry
            await sleep(delay);
        }
    }
    // This should never be reached, but TypeScript needs it
    throw lastError ?? new Error('Retry failed with unknown error');
}
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
export function withRetryWrapper(fn, config = {}) {
    return async (...args) => {
        return withRetry(() => fn(...args), config);
    };
}
/**
 * Retry a function with linear backoff (instead of exponential)
 *
 * @param fn - Function to execute
 * @param config - Retry configuration
 * @returns Promise resolving to function result
 */
export async function withLinearRetry(fn, config = {}) {
    return withRetry(fn, {
        ...config,
        backoffMultiplier: 1, // Linear backoff
    });
}
/**
 * Retry statistics collector
 */
export class RetryStats {
    attempts = [];
    successes = 0;
    failures = 0;
    record(attempts, success) {
        this.attempts.push(attempts);
        if (success) {
            this.successes++;
        }
        else {
            this.failures++;
        }
    }
    getStats() {
        const total = this.attempts.length;
        const avgAttempts = total > 0 ? this.attempts.reduce((a, b) => a + b, 0) / total : 0;
        return {
            total,
            successes: this.successes,
            failures: this.failures,
            successRate: total > 0 ? this.successes / total : 0,
            averageAttempts: avgAttempts,
        };
    }
    reset() {
        this.attempts = [];
        this.successes = 0;
        this.failures = 0;
    }
}
/**
 * Execute with retry and collect statistics
 */
export async function withRetryStats(fn, stats, config = {}) {
    let attempts = 1; // Start with 1 for the first attempt
    const trackingConfig = {
        ...config,
        onRetry: (attempt, error, delay) => {
            attempts = attempt + 1; // onRetry is called before the next attempt
            if (config.onRetry) {
                config.onRetry(attempt, error, delay);
            }
        },
    };
    try {
        const result = await withRetry(fn, trackingConfig);
        stats.record(attempts, true);
        return result;
    }
    catch (error) {
        stats.record(attempts, false);
        throw error;
    }
}
//# sourceMappingURL=retry.js.map
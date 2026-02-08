/**
 * Automatic Retry Logic with Exponential Backoff
 *
 * Provides resilient API request handling with configurable retry strategies
 */

import {
  RateLimitError,
  ExchangeUnavailableError,
  WebSocketDisconnectedError,
} from '../types/errors.js';

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
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
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
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  multiplier: number,
  enableJitter: boolean
): number {
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
function isErrorRetryable(error: Error, config: RetryConfig): boolean {
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
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | undefined;
  let attempt = 0;

  while (attempt < fullConfig.maxAttempts) {
    attempt++;

    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      const shouldRetry = isErrorRetryable(lastError, fullConfig);
      const isLastAttempt = attempt >= fullConfig.maxAttempts;

      if (!shouldRetry || isLastAttempt) {
        throw error;
      }

      // Calculate delay
      let delay: number;

      // Special handling for RateLimitError with retryAfter
      if (error instanceof RateLimitError && error.retryAfter) {
        delay = error.retryAfter;
      } else {
        delay = calculateDelay(
          attempt,
          fullConfig.baseDelay,
          fullConfig.maxDelay,
          fullConfig.backoffMultiplier,
          fullConfig.enableJitter
        );
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
export function withRetryWrapper<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  config: Partial<RetryConfig> = {}
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
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
export async function withLinearRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  return withRetry(fn, {
    ...config,
    backoffMultiplier: 1, // Linear backoff
  });
}

/**
 * Retry statistics collector
 */
export class RetryStats {
  private attempts: number[] = [];
  private successes = 0;
  private failures = 0;

  record(attempts: number, success: boolean): void {
    this.attempts.push(attempts);
    if (success) {
      this.successes++;
    } else {
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

  reset(): void {
    this.attempts = [];
    this.successes = 0;
    this.failures = 0;
  }
}

/**
 * Execute with retry and collect statistics
 */
export async function withRetryStats<T>(
  fn: () => Promise<T>,
  stats: RetryStats,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  let attempts = 1; // Start with 1 for the first attempt

  const trackingConfig: Partial<RetryConfig> = {
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
  } catch (error) {
    stats.record(attempts, false);
    throw error;
  }
}

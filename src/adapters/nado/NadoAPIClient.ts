/**
 * Nado API Client
 *
 * Handles HTTP communication with Nado Gateway API.
 * Provides retry logic, error mapping, and rate limiting integration.
 *
 * @see https://docs.nado.xyz/developer-resources/api/gateway
 */

import type { RateLimiter } from '../../core/RateLimiter.js';
import type { NadoResponse } from './types.js';
import { NADO_REQUEST_CONFIG } from './constants.js';
import {
  mapNadoError,
  mapHttpError,
  extractNadoError,
  isRetryableError,
} from './error-codes.js';
import { PerpDEXError, ExchangeUnavailableError } from '../../types/errors.js';

/**
 * Retry configuration for API requests
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  multiplier: number;
}

/**
 * API Client configuration
 */
export interface NadoAPIClientConfig {
  apiUrl: string;
  rateLimiter: RateLimiter;
  timeout?: number;
  retryConfig?: Partial<RetryConfig>;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 5000, // 5 seconds
  multiplier: 2,
};

/**
 * Nado API Client
 *
 * Abstracts HTTP communication with Nado Gateway API.
 * Handles retries, rate limiting, and error mapping.
 *
 * @example
 * ```typescript
 * const client = new NadoAPIClient({
 *   apiUrl: 'https://gateway.test.nado.xyz/v1',
 *   rateLimiter: new RateLimiter({ maxTokens: 1200, windowMs: 60000 }),
 * });
 *
 * // Query endpoint
 * const products = await client.query('all_products');
 *
 * // Execute endpoint (with signature)
 * const result = await client.execute('place_order', orderPayload, signature);
 * ```
 */
export class NadoAPIClient {
  private apiUrl: string;
  private rateLimiter: RateLimiter;
  private timeout: number;
  private retryConfig: RetryConfig;
  private abortControllers: Set<AbortController> = new Set();

  constructor(config: NadoAPIClientConfig) {
    this.apiUrl = config.apiUrl;
    this.rateLimiter = config.rateLimiter;
    this.timeout = config.timeout || NADO_REQUEST_CONFIG.timeout;
    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...config.retryConfig,
    };
  }

  // ===========================================================================
  // Public API Methods
  // ===========================================================================

  /**
   * Execute a query request to Nado API
   *
   * Query endpoints are read-only and don't require signatures.
   *
   * @param type - Query type (e.g., 'all_products', 'market_liquidity')
   * @param params - Query parameters (optional)
   * @returns Parsed response data
   *
   * @throws {PerpDEXError} On API or network errors
   *
   * @example
   * ```typescript
   * // Get all products
   * const products = await client.query('all_products');
   *
   * // Get market liquidity for product 2
   * const liquidity = await client.query('market_liquidity', {
   *   product_id: 2,
   * });
   * ```
   */
  async query<T>(type: string, params: any = {}): Promise<T> {
    await this.rateLimiter.acquire('query', 1);

    return this.retryRequest(async () => {
      const response = await this.request<T>('/query', {
        type,
        ...params,
      });

      return response;
    });
  }

  /**
   * Execute a signed request to Nado API
   *
   * Execute endpoints modify state and require EIP-712 signatures.
   *
   * @param type - Execute type (e.g., 'place_order', 'cancel_orders')
   * @param payload - Request payload
   * @param signature - EIP-712 signature (0x-prefixed hex)
   * @returns Parsed response data
   *
   * @throws {PerpDEXError} On API or network errors
   *
   * @example
   * ```typescript
   * const order = {
   *   sender: '0x...',
   *   priceX18: '...',
   *   amount: '...',
   *   // ...
   * };
   *
   * const signature = await auth.signOrder(order, productId);
   * const result = await client.execute('place_order', order, signature);
   * ```
   */
  async execute<T>(type: string, payload: any, signature: string): Promise<T> {
    await this.rateLimiter.acquire('execute', 2); // Execute has 2x weight

    return this.retryRequest(async () => {
      const response = await this.request<T>('/execute', {
        type,
        payload,
        signature,
      });

      return response;
    });
  }

  /**
   * Cancel all pending requests
   *
   * Useful when shutting down the adapter or on critical errors.
   */
  cancelAllRequests(): void {
    this.abortControllers.forEach(controller => {
      controller.abort();
    });
    this.abortControllers.clear();
  }

  // ===========================================================================
  // Private HTTP Methods
  // ===========================================================================

  /**
   * Execute HTTP request with timeout and error handling
   *
   * @param endpoint - API endpoint path (e.g., '/query', '/execute')
   * @param body - Request body
   * @returns Parsed response data
   */
  private async request<T>(endpoint: string, body: any): Promise<T> {
    const controller = new AbortController();
    this.abortControllers.add(controller);
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: NADO_REQUEST_CONFIG.headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      // Check HTTP status
      if (!response.ok) {
        throw mapHttpError(response.status, response.statusText);
      }

      // Parse JSON
      const data: NadoResponse<T> = await response.json();

      // Check Nado status
      if (data.status === 'failure') {
        const { code, message } = extractNadoError(data);
        throw mapNadoError(code, message, data);
      }

      return data.data as T;
    } catch (error) {
      // Map and rethrow
      throw this.mapRequestError(error);
    } finally {
      clearTimeout(timeoutId);
      this.abortControllers.delete(controller);
    }
  }

  // ===========================================================================
  // Retry Logic
  // ===========================================================================

  /**
   * Execute request with automatic retry logic
   *
   * Retries only on transient errors (network, server, rate limit).
   * Client errors are thrown immediately.
   *
   * @param fn - Request function to retry
   * @returns Result of successful request
   */
  private async retryRequest<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.retryConfig.initialDelay;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Check if should retry
        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }

        // Wait before retry (with exponential backoff)
        if (attempt < this.retryConfig.maxAttempts) {
          await this.sleep(delay);
          delay = Math.min(delay * this.retryConfig.multiplier, this.retryConfig.maxDelay);
        }
      }
    }

    // All retries exhausted
    throw new ExchangeUnavailableError(
      `Request failed after ${this.retryConfig.maxAttempts} attempts: ${lastError?.message}`,
      'MAX_RETRIES_EXCEEDED',
      'nado',
      lastError
    );
  }

  /**
   * Determine if error should be retried
   *
   * @param error - Error to check
   * @param attempt - Current attempt number
   * @returns true if should retry
   */
  private shouldRetry(error: any, attempt: number): boolean {
    // Don't retry on last attempt
    if (attempt >= this.retryConfig.maxAttempts) {
      return false;
    }

    // Retry on PerpDEXError with retryable code or HTTP 5xx
    if (error instanceof PerpDEXError) {
      // Check for HTTP 5xx status codes
      if (error.code && typeof error.code === 'string' && error.code.startsWith('HTTP_5')) {
        return true;
      }
      return isRetryableError(error.code);
    }

    // Check both error and wrapped originalError
    return this.isRetryableNetworkError(error) ||
           this.isRetryableNetworkError(error.originalError);
  }

  /**
   * Check if error is a retryable network error
   * @param err - Error to check
   * @returns true if retryable
   */
  private isRetryableNetworkError(err: any): boolean {
    if (!err) return false;

    // Check for AbortError or TimeoutError
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return true;
    }

    // Check for HTTP 5xx server errors
    if (err.code && typeof err.code === 'string' && err.code.startsWith('HTTP_5')) {
      return true;
    }

    // Check error code against retryable list
    if (err.code && isRetryableError(err.code)) {
      return true;
    }

    return false;
  }

  // ===========================================================================
  // Error Mapping
  // ===========================================================================

  /**
   * Map request errors to unified error types
   *
   * @param error - Error to map
   * @returns Mapped PerpDEXError
   */
  private mapRequestError(error: any): Error {
    // Already a PerpDEXError
    if (error instanceof PerpDEXError) {
      return error;
    }

    // Abort/Timeout
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return new ExchangeUnavailableError(
        `Request timeout after ${this.timeout}ms`,
        'TIMEOUT',
        'nado',
        error
      );
    }

    // Network errors
    if (error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNREFUSED') {
      return new ExchangeUnavailableError(
        `Network error: ${error.message}`,
        error.code,
        'nado',
        error
      );
    }

    // Unknown error
    return new PerpDEXError(
      error.message || 'Unknown error',
      'UNKNOWN_ERROR',
      'nado',
      error
    );
  }

  // ===========================================================================
  // Utilities
  // ===========================================================================

  /**
   * Sleep for specified milliseconds
   *
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

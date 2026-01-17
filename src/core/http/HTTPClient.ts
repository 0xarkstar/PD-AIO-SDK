/**
 * Unified HTTP Client
 *
 * Provides:
 * - Automatic retry with exponential backoff
 * - Circuit breaker integration
 * - Configurable timeout
 * - Error handling and mapping
 */

import { CircuitBreaker } from '../CircuitBreaker.js';
import { PerpDEXError, NetworkError, RateLimitError } from '../../types/errors.js';

export interface HTTPClientConfig {
  /**
   * Base URL for all requests
   */
  baseUrl: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Retry configuration
   */
  retry?: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    multiplier?: number;
    /** HTTP status codes to retry on */
    retryableStatuses?: number[];
  };

  /**
   * Circuit breaker configuration
   */
  circuitBreaker?: {
    enabled?: boolean;
    failureThreshold?: number;
    successThreshold?: number;
    resetTimeout?: number;
  };

  /**
   * Default headers for all requests
   */
  defaultHeaders?: Record<string, string>;

  /**
   * Exchange identifier for error reporting
   */
  exchange: string;
}

export interface RequestOptions {
  /**
   * Additional headers for this request
   */
  headers?: Record<string, string>;

  /**
   * Request body
   */
  body?: Record<string, unknown> | string;

  /**
   * Override timeout for this request
   */
  timeout?: number;

  /**
   * Skip retry for this request
   */
  skipRetry?: boolean;
}

const DEFAULT_CONFIG = {
  timeout: 30000,
  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    multiplier: 2,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
  },
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,
    successThreshold: 2,
    resetTimeout: 60000,
  },
};

export class HTTPClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryConfig: Required<NonNullable<HTTPClientConfig['retry']>>;
  private readonly circuitBreaker: CircuitBreaker | null;
  private readonly defaultHeaders: Record<string, string>;
  private readonly exchange: string;

  constructor(config: HTTPClientConfig) {
    this.baseUrl = config.baseUrl;
    this.exchange = config.exchange;
    this.timeout = config.timeout ?? DEFAULT_CONFIG.timeout;
    this.retryConfig = { ...DEFAULT_CONFIG.retry, ...config.retry };
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    };

    // Initialize circuit breaker if enabled
    const cbConfig = { ...DEFAULT_CONFIG.circuitBreaker, ...config.circuitBreaker };
    if (cbConfig.enabled) {
      this.circuitBreaker = new CircuitBreaker({
        failureThreshold: cbConfig.failureThreshold,
        successThreshold: cbConfig.successThreshold,
        resetTimeout: cbConfig.resetTimeout,
      });
    } else {
      this.circuitBreaker = null;
    }
  }

  /**
   * Make HTTP GET request
   */
  async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  /**
   * Make HTTP POST request
   */
  async post<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('POST', path, options);
  }

  /**
   * Make HTTP PUT request
   */
  async put<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('PUT', path, options);
  }

  /**
   * Make HTTP DELETE request
   */
  async delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  /**
   * Make HTTP request with retry and circuit breaker
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    options: RequestOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const timeout = options.timeout ?? this.timeout;

    // Execute with circuit breaker if enabled
    const executeRequest = async (): Promise<T> => {
      if (options.skipRetry) {
        return this.executeRequest<T>(method, url, options, timeout);
      }

      // Retry logic
      let lastError: Error | undefined;
      for (let attempt = 0; attempt < this.retryConfig.maxAttempts; attempt++) {
        try {
          return await this.executeRequest<T>(method, url, options, timeout);
        } catch (error) {
          lastError = error as Error;

          // Don't retry on certain errors
          if (error instanceof PerpDEXError && !this.shouldRetry(error, attempt)) {
            throw error;
          }

          // Last attempt, throw error
          if (attempt === this.retryConfig.maxAttempts - 1) {
            throw error;
          }

          // Calculate delay with exponential backoff
          const delay = Math.min(
            this.retryConfig.initialDelay * Math.pow(this.retryConfig.multiplier, attempt),
            this.retryConfig.maxDelay
          );

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw lastError || new Error('Request failed');
    };

    // Execute with or without circuit breaker
    if (this.circuitBreaker) {
      return this.circuitBreaker.execute(executeRequest);
    } else {
      return executeRequest();
    }
  }

  /**
   * Execute single HTTP request
   */
  private async executeRequest<T>(
    method: string,
    url: string,
    options: RequestOptions,
    timeout: number
  ): Promise<T> {
    // Merge headers
    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    // Prepare request body
    let body: string | undefined;
    if (options.body) {
      body = typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body);
    }

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Parse and return response
      return await response.json();
    } catch (error) {
      // Handle fetch errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new NetworkError(
            `Request timeout after ${timeout}ms`,
            'REQUEST_TIMEOUT',
            this.exchange,
            error
          );
        }

        if (error.message.includes('fetch') || error.message.includes('network')) {
          throw new NetworkError(
            'Network request failed',
            'NETWORK_ERROR',
            this.exchange,
            error
          );
        }
      }

      throw error;
    }
  }

  /**
   * Handle error response
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorBody: any = {};
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse errors
    }

    // Rate limit error
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError(
        'Rate limit exceeded',
        'RATE_LIMIT_EXCEEDED',
        this.exchange,
        retryAfter ? parseInt(retryAfter) : undefined,
        errorBody
      );
    }

    // Generic HTTP error
    throw new PerpDEXError(
      `HTTP ${response.status}: ${response.statusText}`,
      this.mapStatusToCode(response.status),
      this.exchange,
      errorBody
    );
  }

  /**
   * Map HTTP status to error code
   */
  private mapStatusToCode(status: number): string {
    if (status === 400) return 'BAD_REQUEST';
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 429) return 'RATE_LIMIT_EXCEEDED';
    if (status >= 500) return 'SERVER_ERROR';
    return 'HTTP_ERROR';
  }

  /**
   * Determine if error should be retried
   */
  private shouldRetry(error: Error, attempt: number): boolean {
    // Don't retry on last attempt
    if (attempt >= this.retryConfig.maxAttempts - 1) {
      return false;
    }

    // Retry on network errors
    if (error instanceof NetworkError) {
      return true;
    }

    // Retry on specific HTTP status codes
    if (error instanceof PerpDEXError) {
      const retryableCodes = ['REQUEST_TIMEOUT', 'RATE_LIMIT_EXCEEDED', 'SERVER_ERROR'];
      return retryableCodes.includes(error.code);
    }

    return false;
  }

  /**
   * Get circuit breaker state (for monitoring)
   */
  getCircuitBreakerState(): string | null {
    return this.circuitBreaker?.getState() ?? null;
  }
}

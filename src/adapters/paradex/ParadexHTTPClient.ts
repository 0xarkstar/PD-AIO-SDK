/**
 * Paradex HTTP Client
 *
 * Provides HTTP request wrapper with:
 * - Automatic authentication via ParadexAuth
 * - Consistent error handling
 * - Response normalization
 * - Request logging (optional)
 *
 * @see https://docs.paradex.trade/api
 */

import type { ParadexAuth } from './auth.js';
import { mapHttpError, mapAxiosError } from './ParadexErrorMapper.js';
import { PerpDEXError } from '../../types/errors.js';

/**
 * HTTP Client configuration
 */
export interface ParadexHTTPClientConfig {
  baseUrl: string;
  auth: ParadexAuth;
  timeout?: number;
  enableLogging?: boolean;
}

/**
 * Paradex HTTP Client
 *
 * Wraps fetch API with authentication and error handling
 *
 * @example
 * ```typescript
 * const client = new ParadexHTTPClient({
 *   baseUrl: 'https://api.paradex.trade/v1',
 *   auth: paradexAuth,
 * });
 *
 * // GET request
 * const markets = await client.get('/markets');
 *
 * // POST request
 * const order = await client.post('/orders', {
 *   market: 'BTC-USD-PERP',
 *   side: 'BUY',
 *   size: '1.0',
 *   price: '50000',
 * });
 *
 * // DELETE request
 * await client.delete('/orders/123');
 * ```
 */
export class ParadexHTTPClient {
  private readonly baseUrl: string;
  private readonly auth: ParadexAuth;
  private readonly timeout: number;
  private readonly enableLogging: boolean;

  constructor(config: ParadexHTTPClientConfig) {
    this.baseUrl = config.baseUrl;
    this.auth = config.auth;
    this.timeout = config.timeout || 30000; // 30 seconds default
    this.enableLogging = config.enableLogging ?? false;
  }

  /**
   * Make GET request
   *
   * @param path - API endpoint path (e.g., "/markets")
   * @param params - Query parameters
   * @returns Response data
   */
  async get(path: string, params?: Record<string, string | number>): Promise<any> {
    let fullPath = path;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, value.toString());
      });
      const queryString = searchParams.toString();
      fullPath = `${path}${queryString ? `?${queryString}` : ''}`;
    }

    return this.request('GET', fullPath);
  }

  /**
   * Make POST request
   *
   * @param path - API endpoint path
   * @param body - Request body
   * @returns Response data
   */
  async post(path: string, body: any): Promise<any> {
    return this.request('POST', path, body);
  }

  /**
   * Make PUT request
   *
   * @param path - API endpoint path
   * @param body - Request body
   * @returns Response data
   */
  async put(path: string, body: any): Promise<any> {
    return this.request('PUT', path, body);
  }

  /**
   * Make DELETE request
   *
   * @param path - API endpoint path
   * @param params - Query parameters
   * @returns Response data
   */
  async delete(path: string, params?: Record<string, string | number>): Promise<any> {
    let fullPath = path;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, value.toString());
      });
      const queryString = searchParams.toString();
      fullPath = `${path}${queryString ? `?${queryString}` : ''}`;
    }

    return this.request('DELETE', fullPath);
  }

  /**
   * Make HTTP request
   *
   * @param method - HTTP method
   * @param path - API endpoint path
   * @param body - Optional request body
   * @returns Response data
   *
   * @throws {PerpDEXError} On network or API errors
   */
  async request(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;

    // Get authenticated request from auth strategy
    const authenticatedRequest = await this.auth.sign({
      method,
      path,
      body,
    });

    // Build fetch options
    const requestInit: RequestInit = {
      method,
      headers: authenticatedRequest.headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: this.createTimeoutSignal(this.timeout),
    };

    if (this.enableLogging) {
      console.log(`[Paradex HTTP] ${method} ${path}`, body || '');
    }

    try {
      const response = await fetch(url, requestInit);
      return await this.handleResponse(response);
    } catch (error: any) {
      // Handle timeout
      if (error.name === 'AbortError') {
        throw new PerpDEXError(
          `Request timeout after ${this.timeout}ms`,
          'ETIMEDOUT',
          'paradex',
          error
        );
      }

      // Handle network errors
      if (error.code && typeof error.code === 'string') {
        throw mapAxiosError(error);
      }

      // Re-throw if already PerpDEXError
      if (error instanceof PerpDEXError) {
        throw error;
      }

      // Generic error
      throw new PerpDEXError(
        error.message || 'Request failed',
        'UNKNOWN_ERROR',
        'paradex',
        error
      );
    }
  }

  /**
   * Handle HTTP response
   *
   * @param response - Fetch response
   * @returns Response data
   *
   * @throws {PerpDEXError} On HTTP errors
   */
  private async handleResponse(response: Response): Promise<any> {
    // Parse response body
    let data: any;
    try {
      data = await response.json();
    } catch (error) {
      // Empty or non-JSON response
      data = null;
    }

    // Handle HTTP errors
    if (!response.ok) {
      if (this.enableLogging) {
        console.error(
          `[Paradex HTTP] Error ${response.status}: ${response.statusText}`,
          data
        );
      }

      throw mapHttpError(response.status, response.statusText, data);
    }

    if (this.enableLogging) {
      console.log(`[Paradex HTTP] Response:`, data);
    }

    return data;
  }

  /**
   * Create timeout signal for fetch
   *
   * @param timeout - Timeout in milliseconds
   * @returns AbortSignal
   */
  private createTimeoutSignal(timeout: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  }

  /**
   * Get base URL
   */
  get url(): string {
    return this.baseUrl;
  }

  /**
   * Get auth strategy
   */
  get authStrategy(): ParadexAuth {
    return this.auth;
  }
}

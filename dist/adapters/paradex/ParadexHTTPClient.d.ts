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
import type { ParadexAuth } from './ParadexAuth.js';
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
export declare class ParadexHTTPClient {
    private readonly baseUrl;
    private readonly auth;
    private readonly timeout;
    private readonly enableLogging;
    constructor(config: ParadexHTTPClientConfig);
    /**
     * Make GET request
     *
     * @param path - API endpoint path (e.g., "/markets")
     * @param params - Query parameters
     * @returns Response data
     */
    get(path: string, params?: Record<string, string | number>): Promise<any>;
    /**
     * Make POST request
     *
     * @param path - API endpoint path
     * @param body - Request body
     * @returns Response data
     */
    post(path: string, body: any): Promise<any>;
    /**
     * Make PUT request
     *
     * @param path - API endpoint path
     * @param body - Request body
     * @returns Response data
     */
    put(path: string, body: any): Promise<any>;
    /**
     * Make DELETE request
     *
     * @param path - API endpoint path
     * @param params - Query parameters
     * @returns Response data
     */
    delete(path: string, params?: Record<string, string | number>): Promise<any>;
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
    request(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: any): Promise<any>;
    /**
     * Handle HTTP response
     *
     * @param response - Fetch response
     * @returns Response data
     *
     * @throws {PerpDEXError} On HTTP errors
     */
    private handleResponse;
    /**
     * Create timeout signal for fetch
     *
     * @param timeout - Timeout in milliseconds
     * @returns AbortSignal
     */
    private createTimeoutSignal;
    /**
     * Get base URL
     */
    get url(): string;
    /**
     * Get auth strategy
     */
    get authStrategy(): ParadexAuth;
}
//# sourceMappingURL=ParadexHTTPClient.d.ts.map
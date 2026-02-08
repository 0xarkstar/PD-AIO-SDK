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
import { mapHttpError, mapAxiosError } from './ParadexErrorMapper.js';
import { PerpDEXError } from '../../types/errors.js';
import { Logger } from '../../core/logger.js';
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
    baseUrl;
    auth;
    timeout;
    enableLogging;
    logger = new Logger('ParadexHTTPClient');
    constructor(config) {
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
    async get(path, params) {
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
    async post(path, body) {
        return this.request('POST', path, body);
    }
    /**
     * Make PUT request
     *
     * @param path - API endpoint path
     * @param body - Request body
     * @returns Response data
     */
    async put(path, body) {
        return this.request('PUT', path, body);
    }
    /**
     * Make DELETE request
     *
     * @param path - API endpoint path
     * @param params - Query parameters or body
     * @returns Response data
     */
    async delete(path, params) {
        let fullPath = path;
        // Handle as query params if it's simple key-value pairs
        if (params && Object.values(params).every(v => typeof v === 'string' || typeof v === 'number')) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                searchParams.append(key, String(value));
            });
            const queryString = searchParams.toString();
            fullPath = `${path}${queryString ? `?${queryString}` : ''}`;
            return this.request('DELETE', fullPath);
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
    async request(method, path, body) {
        const url = `${this.baseUrl}${path}`;
        // Get authenticated request from auth strategy
        const authenticatedRequest = await this.auth.sign({
            method,
            path,
            body,
        });
        // Build fetch options
        const requestInit = {
            method,
            headers: authenticatedRequest.headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: this.createTimeoutSignal(this.timeout),
        };
        if (this.enableLogging) {
            this.logger.debug(`${method} ${path}`, { body: body || undefined });
        }
        try {
            const response = await fetch(url, requestInit);
            return await this.handleResponse(response);
        }
        catch (error) {
            // Handle timeout
            if (error instanceof Error && error.name === 'AbortError') {
                throw new PerpDEXError(`Request timeout after ${this.timeout}ms`, 'ETIMEDOUT', 'paradex', error);
            }
            // Handle network errors
            if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
                throw mapAxiosError(error);
            }
            // Re-throw if already PerpDEXError
            if (error instanceof PerpDEXError) {
                throw error;
            }
            // Generic error
            const message = error instanceof Error ? error.message : 'Request failed';
            throw new PerpDEXError(message, 'UNKNOWN_ERROR', 'paradex', error);
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
    async handleResponse(response) {
        // Parse response body
        let data;
        try {
            data = await response.json();
        }
        catch {
            // Empty or non-JSON response
            data = null;
        }
        // Handle HTTP errors
        if (!response.ok) {
            if (this.enableLogging) {
                this.logger.error(`Error ${response.status}: ${response.statusText}`, undefined, { data });
            }
            throw mapHttpError(response.status, response.statusText, data);
        }
        if (this.enableLogging) {
            this.logger.debug('Response', { data });
        }
        return data;
    }
    /**
     * Create timeout signal for fetch
     *
     * @param timeout - Timeout in milliseconds
     * @returns AbortSignal
     */
    createTimeoutSignal(timeout) {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), timeout);
        return controller.signal;
    }
    /**
     * Get base URL
     */
    get url() {
        return this.baseUrl;
    }
    /**
     * Get auth strategy
     */
    get authStrategy() {
        return this.auth;
    }
}
//# sourceMappingURL=ParadexHTTPClient.js.map
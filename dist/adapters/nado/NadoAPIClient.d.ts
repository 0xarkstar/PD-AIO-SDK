/**
 * Nado API Client
 *
 * Handles HTTP communication with Nado Gateway API.
 * Provides retry logic, error mapping, and rate limiting integration.
 *
 * @see https://docs.nado.xyz/developer-resources/api/gateway
 */
import type { RateLimiter } from '../../core/RateLimiter.js';
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
export declare class NadoAPIClient {
    private apiUrl;
    private rateLimiter;
    private timeout;
    private retryConfig;
    private abortControllers;
    constructor(config: NadoAPIClientConfig);
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
    query<T>(type: string, params?: any): Promise<T>;
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
    execute<T>(type: string, payload: any, signature: string): Promise<T>;
    /**
     * Cancel all pending requests
     *
     * Useful when shutting down the adapter or on critical errors.
     */
    cancelAllRequests(): void;
    /**
     * Execute HTTP request with timeout and error handling
     *
     * @param endpoint - API endpoint path (e.g., '/query', '/execute')
     * @param body - Request body
     * @returns Parsed response data
     */
    private request;
    /**
     * Execute request with automatic retry logic
     *
     * Retries only on transient errors (network, server, rate limit).
     * Client errors are thrown immediately.
     *
     * @param fn - Request function to retry
     * @returns Result of successful request
     */
    private retryRequest;
    /**
     * Determine if error should be retried
     *
     * @param error - Error to check
     * @param attempt - Current attempt number
     * @returns true if should retry
     */
    private shouldRetry;
    /**
     * Check if error is a retryable network error
     * @param err - Error to check
     * @returns true if retryable
     */
    private isRetryableNetworkError;
    /**
     * Map request errors to unified error types
     *
     * @param error - Error to map
     * @returns Mapped PerpDEXError
     */
    private mapRequestError;
    /**
     * Sleep for specified milliseconds
     *
     * @param ms - Milliseconds to sleep
     */
    private sleep;
}
export {};
//# sourceMappingURL=NadoAPIClient.d.ts.map
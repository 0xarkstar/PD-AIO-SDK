/**
 * Unified HTTP Client
 *
 * Provides:
 * - Automatic retry with exponential backoff
 * - Circuit breaker integration
 * - Configurable timeout
 * - Error handling and mapping
 */
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
export declare class HTTPClient {
    private readonly baseUrl;
    private readonly timeout;
    private readonly retryConfig;
    private readonly circuitBreaker;
    private readonly defaultHeaders;
    private readonly exchange;
    constructor(config: HTTPClientConfig);
    /**
     * Make HTTP GET request
     */
    get<T>(path: string, options?: RequestOptions): Promise<T>;
    /**
     * Make HTTP POST request
     */
    post<T>(path: string, options?: RequestOptions): Promise<T>;
    /**
     * Make HTTP PUT request
     */
    put<T>(path: string, options?: RequestOptions): Promise<T>;
    /**
     * Make HTTP DELETE request
     */
    delete<T>(path: string, options?: RequestOptions): Promise<T>;
    /**
     * Make HTTP request with retry and circuit breaker
     */
    private request;
    /**
     * Execute single HTTP request
     */
    private executeRequest;
    /**
     * Handle error response
     */
    private handleErrorResponse;
    /**
     * Map HTTP status to error code
     */
    private mapStatusToCode;
    /**
     * Determine if error should be retried
     */
    private shouldRetry;
    /**
     * Get circuit breaker state (for monitoring)
     */
    getCircuitBreakerState(): string | null;
}
//# sourceMappingURL=HTTPClient.d.ts.map
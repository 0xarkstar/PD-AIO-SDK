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
    baseUrl;
    timeout;
    retryConfig;
    circuitBreaker;
    defaultHeaders;
    exchange;
    constructor(config) {
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
        }
        else {
            this.circuitBreaker = null;
        }
    }
    /**
     * Make HTTP GET request
     */
    async get(path, options = {}) {
        return this.request('GET', path, options);
    }
    /**
     * Make HTTP POST request
     */
    async post(path, options = {}) {
        return this.request('POST', path, options);
    }
    /**
     * Make HTTP PUT request
     */
    async put(path, options = {}) {
        return this.request('PUT', path, options);
    }
    /**
     * Make HTTP DELETE request
     */
    async delete(path, options = {}) {
        return this.request('DELETE', path, options);
    }
    /**
     * Make HTTP request with retry and circuit breaker
     */
    async request(method, path, options) {
        const url = `${this.baseUrl}${path}`;
        const timeout = options.timeout ?? this.timeout;
        // Execute with circuit breaker if enabled
        const executeRequest = async () => {
            if (options.skipRetry) {
                return this.executeRequest(method, url, options, timeout);
            }
            // Retry logic
            let lastError;
            for (let attempt = 0; attempt < this.retryConfig.maxAttempts; attempt++) {
                try {
                    return await this.executeRequest(method, url, options, timeout);
                }
                catch (error) {
                    lastError = error;
                    // Don't retry on certain errors
                    if (error instanceof PerpDEXError && !this.shouldRetry(error, attempt)) {
                        throw error;
                    }
                    // Last attempt, throw error
                    if (attempt === this.retryConfig.maxAttempts - 1) {
                        throw error;
                    }
                    // Calculate delay with exponential backoff
                    const delay = Math.min(this.retryConfig.initialDelay * Math.pow(this.retryConfig.multiplier, attempt), this.retryConfig.maxDelay);
                    // Wait before retry
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
            throw lastError || new Error('Request failed');
        };
        // Execute with or without circuit breaker
        if (this.circuitBreaker) {
            return this.circuitBreaker.execute(executeRequest);
        }
        else {
            return executeRequest();
        }
    }
    /**
     * Execute single HTTP request
     */
    async executeRequest(method, url, options, timeout) {
        // Merge headers
        const headers = {
            ...this.defaultHeaders,
            ...options.headers,
        };
        // Prepare request body
        let body;
        if (options.body) {
            body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
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
        }
        catch (error) {
            // Handle fetch errors
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new NetworkError(`Request timeout after ${timeout}ms`, 'REQUEST_TIMEOUT', this.exchange, error);
                }
                if (error.message.includes('fetch') || error.message.includes('network')) {
                    throw new NetworkError('Network request failed', 'NETWORK_ERROR', this.exchange, error);
                }
            }
            throw error;
        }
    }
    /**
     * Handle error response
     */
    async handleErrorResponse(response) {
        let errorBody = {};
        try {
            errorBody = await response.json();
        }
        catch {
            // Ignore JSON parse errors
        }
        // Rate limit error
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            throw new RateLimitError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', this.exchange, retryAfter ? parseInt(retryAfter) : undefined, errorBody);
        }
        // Generic HTTP error
        throw new PerpDEXError(`HTTP ${response.status}: ${response.statusText}`, this.mapStatusToCode(response.status), this.exchange, errorBody);
    }
    /**
     * Map HTTP status to error code
     */
    mapStatusToCode(status) {
        if (status === 400)
            return 'BAD_REQUEST';
        if (status === 401)
            return 'UNAUTHORIZED';
        if (status === 403)
            return 'FORBIDDEN';
        if (status === 404)
            return 'NOT_FOUND';
        if (status === 429)
            return 'RATE_LIMIT_EXCEEDED';
        if (status >= 500)
            return 'SERVER_ERROR';
        return 'HTTP_ERROR';
    }
    /**
     * Determine if error should be retried
     */
    shouldRetry(error, attempt) {
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
    getCircuitBreakerState() {
        return this.circuitBreaker?.getState() ?? null;
    }
}
//# sourceMappingURL=HTTPClient.js.map
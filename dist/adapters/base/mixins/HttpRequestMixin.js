/**
 * HTTP Request Mixin
 *
 * Provides HTTP request handling with retry logic, circuit breaker, and metrics.
 */
import { generateCorrelationId } from '../../../core/logger.js';
/**
 * HTTP Request Mixin - adds HTTP request capabilities with retry and circuit breaker
 *
 * @example
 * ```typescript
 * class MyAdapter extends HttpRequestMixin(BaseClass) {
 *   async fetchData() {
 *     return this.request<MyData>('GET', 'https://api.example.com/data');
 *   }
 * }
 * ```
 */
export function HttpRequestMixin(Base) {
    return class HttpRequestMixinClass extends Base {
        /**
         * Interval tracking for cleanup
         * @internal
         */
        intervals = new Set();
        /**
         * Make HTTP request with timeout, circuit breaker, retry, and metrics tracking
         * @internal
         */
        async request(method, url, body, headers) {
            // Retry configuration
            const maxAttempts = 3;
            const initialDelay = 1000;
            const maxDelay = 10000;
            const multiplier = 2;
            const retryableStatuses = [408, 429, 500, 502, 503, 504];
            // Generate correlation ID for request tracing
            const correlationId = generateCorrelationId();
            // Wrap the entire request in circuit breaker
            return this.circuitBreaker.execute(async () => {
                let lastError;
                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    const startTime = Date.now();
                    const endpoint = this.extractEndpoint(url);
                    const endpointKey = `${method}:${endpoint}`;
                    // Log request with correlation ID
                    this.debug(`Request ${correlationId}`, {
                        method,
                        endpoint,
                        attempt: attempt + 1,
                        correlationId,
                    });
                    // Increment total requests
                    this.metrics.totalRequests++;
                    const controller = new AbortController();
                    this.abortControllers.add(controller);
                    const timeout = setTimeout(() => controller.abort(), this.config.timeout);
                    this.registerTimer(timeout);
                    try {
                        const response = await fetch(url, {
                            method,
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Correlation-ID': correlationId,
                                ...headers,
                            },
                            body: body ? JSON.stringify(body) : undefined,
                            signal: controller.signal,
                        });
                        if (!response.ok) {
                            const shouldRetry = attempt < maxAttempts - 1 && retryableStatuses.includes(response.status);
                            const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                            if (!shouldRetry) {
                                throw error;
                            }
                            // Track failed request (will retry)
                            const latency = Date.now() - startTime;
                            this.metrics.failedRequests++;
                            this.updateEndpointMetrics(endpointKey, latency, true);
                            this.updateAverageLatency(latency);
                            lastError = error;
                            // Calculate delay with exponential backoff
                            const delay = Math.min(initialDelay * Math.pow(multiplier, attempt), maxDelay);
                            // Clean up before retry
                            clearTimeout(timeout);
                            this.timers.delete(timeout);
                            this.abortControllers.delete(controller);
                            // Wait before retry
                            await new Promise((resolve) => setTimeout(resolve, delay));
                            continue;
                        }
                        const result = (await response.json());
                        // Track successful request
                        const latency = Date.now() - startTime;
                        this.metrics.successfulRequests++;
                        this.updateEndpointMetrics(endpointKey, latency, false);
                        this.updateAverageLatency(latency);
                        // Log success with correlation ID
                        this.debug(`Request ${correlationId} completed`, {
                            correlationId,
                            latency,
                            status: response.status,
                        });
                        // Track in Prometheus
                        if (this.prometheusMetrics) {
                            this.prometheusMetrics.recordRequest(this.id, endpoint, 'success', latency);
                        }
                        // Clean up
                        clearTimeout(timeout);
                        this.timers.delete(timeout);
                        this.abortControllers.delete(controller);
                        return result;
                    }
                    catch (error) {
                        // Track failed request
                        const latency = Date.now() - startTime;
                        this.metrics.failedRequests++;
                        this.updateEndpointMetrics(endpointKey, latency, true);
                        this.updateAverageLatency(latency);
                        // Log error with correlation ID
                        this.debug(`Request ${correlationId} failed`, {
                            correlationId,
                            latency,
                            error: error instanceof Error ? error.message : 'Unknown error',
                            attempt: attempt + 1,
                        });
                        // Track in Prometheus
                        if (this.prometheusMetrics) {
                            this.prometheusMetrics.recordRequest(this.id, endpoint, 'error', latency);
                            const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
                            this.prometheusMetrics.recordRequestError(this.id, endpoint, errorType);
                        }
                        // Clean up
                        clearTimeout(timeout);
                        this.timers.delete(timeout);
                        this.abortControllers.delete(controller);
                        // Check if should retry
                        const isNetworkError = error instanceof Error &&
                            (error.name === 'AbortError' ||
                                error.message.includes('fetch') ||
                                error.message.includes('network'));
                        if (attempt < maxAttempts - 1 && isNetworkError) {
                            lastError = error;
                            // Calculate delay with exponential backoff
                            const delay = Math.min(initialDelay * Math.pow(multiplier, attempt), maxDelay);
                            // Wait before retry
                            await new Promise((resolve) => setTimeout(resolve, delay));
                            continue;
                        }
                        // Attach correlation ID to PerpDEXError instances
                        throw this.attachCorrelationId(error, correlationId);
                    }
                }
                throw this.attachCorrelationId(lastError || new Error('Request failed after retries'), correlationId);
            });
        }
        /**
         * Register a timer for cleanup tracking
         * @internal
         */
        registerTimer(timer) {
            this.timers.add(timer);
        }
        /**
         * Register an interval for cleanup tracking
         * @internal
         */
        registerInterval(interval) {
            this.intervals.add(interval);
        }
        /**
         * Unregister and clear a timer
         * @internal
         */
        unregisterTimer(timer) {
            clearTimeout(timer);
            this.timers.delete(timer);
        }
        /**
         * Unregister and clear an interval
         * @internal
         */
        unregisterInterval(interval) {
            clearInterval(interval);
            this.intervals.delete(interval);
        }
        /**
         * Extract endpoint path from URL for metrics tracking
         * @internal
         */
        extractEndpoint(url) {
            try {
                const urlObj = new URL(url);
                return urlObj.pathname;
            }
            catch {
                // If URL parsing fails, return the URL as-is
                return url;
            }
        }
    };
}
//# sourceMappingURL=HttpRequestMixin.js.map
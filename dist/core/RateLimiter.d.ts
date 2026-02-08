/**
 * Token Bucket Rate Limiter
 *
 * Implements rate limiting using token bucket algorithm
 */
export interface RateLimiterConfig {
    /** Maximum tokens (requests) available */
    maxTokens: number;
    /** Time window in milliseconds */
    windowMs: number;
    /** Token refill rate (tokens per window) */
    refillRate?: number;
    /** Endpoint-specific weights */
    weights?: Record<string, number>;
    /** Exchange identifier for error messages */
    exchange?: string;
}
export declare class RateLimiter {
    private readonly maxTokens;
    private readonly windowMs;
    private readonly refillRate;
    private readonly weights;
    private bucket;
    private readonly queue;
    private processingQueue;
    private destroyed;
    private pendingTimers;
    constructor(config: RateLimiterConfig);
    /**
     * Acquire tokens for an operation
     *
     * @param endpoint - Endpoint identifier (for weighted rate limiting)
     * @param weight - Custom weight (overrides endpoint weight)
     * @returns Promise that resolves when tokens are available
     * @throws {RateLimitError} If rate limit exceeded
     */
    acquire(endpoint?: string, weight?: number): Promise<void>;
    /**
     * Try to acquire tokens without waiting
     *
     * @param endpoint - Endpoint identifier
     * @param weight - Custom weight
     * @returns true if tokens acquired, false otherwise
     */
    tryAcquire(endpoint?: string, weight?: number): boolean;
    /**
     * Get current available tokens
     */
    getAvailableTokens(): number;
    /**
     * Get time until next token refill (ms)
     */
    getTimeUntilRefill(): number;
    /**
     * Reset rate limiter
     */
    reset(): void;
    /**
     * Process queued requests
     */
    private processQueue;
    /**
     * Refill token bucket based on elapsed time
     */
    private refillBucket;
    /**
     * Sleep helper with timer tracking for cleanup
     */
    private sleep;
    /**
     * Destroy rate limiter and cancel pending operations
     */
    destroy(): void;
    /**
     * Get rate limiter statistics
     */
    getStats(): {
        availableTokens: number;
        maxTokens: number;
        queueLength: number;
        timeUntilRefill: number;
    };
}
//# sourceMappingURL=RateLimiter.d.ts.map
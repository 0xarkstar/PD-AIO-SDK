/**
 * Token Bucket Rate Limiter
 *
 * Implements rate limiting using token bucket algorithm
 */
export class RateLimiter {
    maxTokens;
    windowMs;
    refillRate;
    weights;
    bucket;
    queue = [];
    processingQueue = false;
    destroyed = false;
    pendingTimers = new Set();
    constructor(config) {
        this.maxTokens = config.maxTokens;
        this.windowMs = config.windowMs;
        this.refillRate = config.refillRate ?? config.maxTokens;
        this.weights = config.weights ?? {};
        this.bucket = {
            tokens: this.maxTokens,
            lastRefill: Date.now(),
        };
    }
    /**
     * Acquire tokens for an operation
     *
     * @param endpoint - Endpoint identifier (for weighted rate limiting)
     * @param weight - Custom weight (overrides endpoint weight)
     * @returns Promise that resolves when tokens are available
     * @throws {RateLimitError} If rate limit exceeded
     */
    async acquire(endpoint, weight) {
        const requestWeight = weight ?? (endpoint ? this.weights[endpoint] ?? 1 : 1);
        return new Promise((resolve, reject) => {
            this.queue.push({
                weight: requestWeight,
                resolve,
                reject,
            });
            void this.processQueue();
        });
    }
    /**
     * Try to acquire tokens without waiting
     *
     * @param endpoint - Endpoint identifier
     * @param weight - Custom weight
     * @returns true if tokens acquired, false otherwise
     */
    tryAcquire(endpoint, weight) {
        const requestWeight = weight ?? (endpoint ? this.weights[endpoint] ?? 1 : 1);
        this.refillBucket();
        if (this.bucket.tokens >= requestWeight) {
            this.bucket.tokens -= requestWeight;
            return true;
        }
        return false;
    }
    /**
     * Get current available tokens
     */
    getAvailableTokens() {
        this.refillBucket();
        return this.bucket.tokens;
    }
    /**
     * Get time until next token refill (ms)
     */
    getTimeUntilRefill() {
        const elapsed = Date.now() - this.bucket.lastRefill;
        const remaining = this.windowMs - elapsed;
        return Math.max(0, remaining);
    }
    /**
     * Reset rate limiter
     */
    reset() {
        this.bucket = {
            tokens: this.maxTokens,
            lastRefill: Date.now(),
        };
        this.queue.length = 0;
    }
    /**
     * Process queued requests
     */
    async processQueue() {
        if (this.processingQueue || this.destroyed) {
            return;
        }
        this.processingQueue = true;
        while (this.queue.length > 0 && !this.destroyed) {
            this.refillBucket();
            const request = this.queue[0];
            if (!request)
                break;
            if (this.bucket.tokens >= request.weight) {
                // Tokens available - consume and resolve
                this.bucket.tokens -= request.weight;
                this.queue.shift();
                request.resolve();
            }
            else {
                // Not enough tokens - wait for refill
                const waitTime = this.getTimeUntilRefill();
                if (waitTime > 0) {
                    await this.sleep(Math.min(waitTime, 100)); // Check every 100ms max
                }
                else {
                    // Should refill now
                    this.refillBucket();
                }
            }
        }
        this.processingQueue = false;
    }
    /**
     * Refill token bucket based on elapsed time
     */
    refillBucket() {
        const now = Date.now();
        const elapsed = now - this.bucket.lastRefill;
        if (elapsed >= this.windowMs) {
            // Full refill
            const fullWindows = Math.floor(elapsed / this.windowMs);
            this.bucket.tokens = Math.min(this.maxTokens, this.bucket.tokens + fullWindows * this.refillRate);
            this.bucket.lastRefill = now - (elapsed % this.windowMs);
        }
    }
    /**
     * Sleep helper with timer tracking for cleanup
     */
    sleep(ms) {
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                this.pendingTimers.delete(timer);
                resolve();
            }, ms);
            // Allow process to exit even if timer is pending
            if (timer.unref) {
                timer.unref();
            }
            this.pendingTimers.add(timer);
        });
    }
    /**
     * Destroy rate limiter and cancel pending operations
     */
    destroy() {
        this.destroyed = true;
        // Clear all pending timers
        for (const timer of this.pendingTimers) {
            clearTimeout(timer);
        }
        this.pendingTimers.clear();
        // Reject all queued requests
        const queuedRequests = [...this.queue];
        this.queue.length = 0;
        for (const request of queuedRequests) {
            request.reject(new Error('RateLimiter destroyed'));
        }
        this.processingQueue = false;
    }
    /**
     * Get rate limiter statistics
     */
    getStats() {
        return {
            availableTokens: this.getAvailableTokens(),
            maxTokens: this.maxTokens,
            queueLength: this.queue.length,
            timeUntilRefill: this.getTimeUntilRefill(),
        };
    }
}
//# sourceMappingURL=RateLimiter.js.map
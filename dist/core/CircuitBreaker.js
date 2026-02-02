/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures by temporarily blocking requests to failing services
 * and allowing them time to recover.
 *
 * States:
 * - CLOSED: Normal operation, all requests go through
 * - OPEN: Too many failures, all requests rejected immediately
 * - HALF_OPEN: Testing recovery, limited requests allowed
 */
import { EventEmitter } from 'eventemitter3';
/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
    failureThreshold: 5,
    successThreshold: 2,
    timeWindow: 60000, // 1 minute
    resetTimeout: 30000, // 30 seconds
    minimumRequestVolume: 10,
    errorThresholdPercentage: 0.5, // 50%
};
/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker extends EventEmitter {
    state = 'CLOSED';
    failureCount = 0;
    successCount = 0;
    totalRequests = 0;
    lastFailureTime = 0;
    lastStateChangeTime = Date.now();
    resetTimer = null;
    requestTimestamps = [];
    config;
    constructor(config = {}) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Execute a function with circuit breaker protection
     */
    async execute(fn) {
        // Check if circuit allows the request
        if (!this.canExecute()) {
            this.recordRejection();
            throw new CircuitBreakerError('Circuit breaker is OPEN', 'CIRCUIT_OPEN', this.state);
        }
        try {
            const result = await fn();
            this.recordSuccess();
            return result;
        }
        catch (error) {
            this.recordFailure(error);
            throw error;
        }
    }
    /**
     * Check if circuit allows request execution
     */
    canExecute() {
        if (this.state === 'CLOSED') {
            return true;
        }
        if (this.state === 'OPEN') {
            // Check if enough time has passed to attempt recovery
            const now = Date.now();
            if (now - this.lastStateChangeTime >= this.config.resetTimeout) {
                this.transitionToHalfOpen();
                return true;
            }
            return false;
        }
        // HALF_OPEN: Allow request to test recovery
        return true;
    }
    /**
     * Record successful execution
     */
    recordSuccess() {
        this.totalRequests++;
        this.successCount++;
        this.cleanupOldTimestamps();
        this.requestTimestamps.push(Date.now());
        this.emit('success');
        if (this.state === 'HALF_OPEN') {
            // In HALF_OPEN, count consecutive successes
            if (this.successCount >= this.config.successThreshold) {
                this.transitionToClosed();
            }
        }
        else if (this.state === 'CLOSED') {
            // Reset failure count on success in CLOSED state
            this.failureCount = 0;
        }
    }
    /**
     * Record failed execution
     */
    recordFailure(error) {
        this.totalRequests++;
        this.failureCount++;
        this.lastFailureTime = Date.now();
        this.cleanupOldTimestamps();
        this.requestTimestamps.push(Date.now());
        this.emit('failure', error);
        if (this.state === 'HALF_OPEN') {
            // Any failure in HALF_OPEN immediately reopens circuit
            this.transitionToOpen();
        }
        else if (this.state === 'CLOSED') {
            // Check if we should open the circuit
            this.checkThresholds();
        }
    }
    /**
     * Record rejected request
     */
    recordRejection() {
        this.emit('reject');
    }
    /**
     * Check if failure thresholds are exceeded
     */
    checkThresholds() {
        const recentRequests = this.getRecentRequestCount();
        // Only open if we have enough data
        if (recentRequests < this.config.minimumRequestVolume) {
            return;
        }
        // Check consecutive failures
        if (this.failureCount >= this.config.failureThreshold) {
            this.transitionToOpen();
            return;
        }
        // Check error rate
        const errorRate = this.calculateErrorRate();
        if (errorRate >= this.config.errorThresholdPercentage) {
            this.transitionToOpen();
        }
    }
    /**
     * Calculate current error rate
     */
    calculateErrorRate() {
        const recentRequests = this.getRecentRequestCount();
        if (recentRequests === 0) {
            return 0;
        }
        return this.failureCount / recentRequests;
    }
    /**
     * Get count of recent requests within time window
     */
    getRecentRequestCount() {
        this.cleanupOldTimestamps();
        return this.requestTimestamps.length;
    }
    /**
     * Remove timestamps outside the time window
     */
    cleanupOldTimestamps() {
        const cutoff = Date.now() - this.config.timeWindow;
        this.requestTimestamps = this.requestTimestamps.filter(ts => ts >= cutoff);
    }
    /**
     * Transition to OPEN state
     */
    transitionToOpen() {
        const oldState = this.state;
        this.state = 'OPEN';
        this.lastStateChangeTime = Date.now();
        this.successCount = 0;
        // Schedule automatic transition to HALF_OPEN
        this.scheduleReset();
        this.emit('stateChange', oldState, 'OPEN');
        this.emit('open');
    }
    /**
     * Transition to HALF_OPEN state
     */
    transitionToHalfOpen() {
        const oldState = this.state;
        this.state = 'HALF_OPEN';
        this.lastStateChangeTime = Date.now();
        this.successCount = 0;
        this.failureCount = 0;
        this.clearResetTimer();
        this.emit('stateChange', oldState, 'HALF_OPEN');
        this.emit('halfOpen');
    }
    /**
     * Transition to CLOSED state
     */
    transitionToClosed() {
        const oldState = this.state;
        this.state = 'CLOSED';
        this.lastStateChangeTime = Date.now();
        this.successCount = 0;
        this.failureCount = 0;
        this.requestTimestamps = [];
        this.clearResetTimer();
        this.emit('stateChange', oldState, 'CLOSED');
        this.emit('close');
    }
    /**
     * Schedule automatic reset attempt
     */
    scheduleReset() {
        this.clearResetTimer();
        this.resetTimer = setTimeout(() => {
            if (this.state === 'OPEN') {
                this.transitionToHalfOpen();
            }
        }, this.config.resetTimeout);
    }
    /**
     * Clear reset timer
     */
    clearResetTimer() {
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
            this.resetTimer = null;
        }
    }
    /**
     * Get current state
     */
    getState() {
        return this.state;
    }
    /**
     * Get current metrics
     */
    getMetrics() {
        const recentRequests = this.getRecentRequestCount();
        const recentFailures = this.failureCount;
        const recentSuccesses = this.successCount;
        return {
            state: this.state,
            totalRequests: this.totalRequests,
            successfulRequests: recentSuccesses,
            failedRequests: recentFailures,
            rejectedRequests: 0, // Could track separately if needed
            errorRate: this.calculateErrorRate(),
            lastStateChange: this.lastStateChangeTime,
            consecutiveSuccesses: this.state === 'HALF_OPEN' ? this.successCount : 0,
            consecutiveFailures: this.state === 'CLOSED' ? this.failureCount : 0,
        };
    }
    /**
     * Reset circuit breaker to initial state
     */
    reset() {
        this.transitionToClosed();
    }
    /**
     * Force circuit to OPEN state
     */
    forceOpen() {
        this.transitionToOpen();
    }
    /**
     * Force circuit to CLOSED state
     */
    forceClosed() {
        this.transitionToClosed();
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.clearResetTimer();
        this.removeAllListeners();
    }
}
/**
 * Circuit Breaker Error
 */
export class CircuitBreakerError extends Error {
    code;
    state;
    constructor(message, code, state) {
        super(message);
        this.code = code;
        this.state = state;
        this.name = 'CircuitBreakerError';
    }
}
//# sourceMappingURL=CircuitBreaker.js.map
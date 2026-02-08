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
 * Circuit breaker states
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
    /**
     * Failure threshold (number of failures before opening circuit)
     * @default 5
     */
    failureThreshold?: number;
    /**
     * Success threshold in HALF_OPEN state
     * @default 2
     */
    successThreshold?: number;
    /**
     * Time window for counting failures (ms)
     * @default 60000 (1 minute)
     */
    timeWindow?: number;
    /**
     * Timeout before attempting to recover (ms)
     * @default 30000 (30 seconds)
     */
    resetTimeout?: number;
    /**
     * Minimum request volume before opening circuit
     * @default 10
     */
    minimumRequestVolume?: number;
    /**
     * Error rate threshold (0-1) to open circuit
     * @default 0.5 (50%)
     */
    errorThresholdPercentage?: number;
}
/**
 * Circuit breaker metrics
 */
export interface CircuitBreakerMetrics {
    state: CircuitState;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    rejectedRequests: number;
    errorRate: number;
    lastStateChange: number;
    consecutiveSuccesses: number;
    consecutiveFailures: number;
}
/**
 * Circuit breaker events
 */
interface CircuitBreakerEvents {
    stateChange: (oldState: CircuitState, newState: CircuitState) => void;
    open: () => void;
    halfOpen: () => void;
    close: () => void;
    success: () => void;
    failure: (error: Error) => void;
    reject: () => void;
}
/**
 * Circuit Breaker implementation
 */
export declare class CircuitBreaker extends EventEmitter<CircuitBreakerEvents> {
    private state;
    private failureCount;
    private successCount;
    private totalRequests;
    private lastStateChangeTime;
    private resetTimer;
    private requestTimestamps;
    private readonly config;
    constructor(config?: CircuitBreakerConfig);
    /**
     * Execute a function with circuit breaker protection
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Check if circuit allows request execution
     */
    private canExecute;
    /**
     * Record successful execution
     */
    private recordSuccess;
    /**
     * Record failed execution
     */
    private recordFailure;
    /**
     * Record rejected request
     */
    private recordRejection;
    /**
     * Check if failure thresholds are exceeded
     */
    private checkThresholds;
    /**
     * Calculate current error rate
     */
    private calculateErrorRate;
    /**
     * Get count of recent requests within time window
     */
    private getRecentRequestCount;
    /**
     * Remove timestamps outside the time window
     */
    private cleanupOldTimestamps;
    /**
     * Transition to OPEN state
     */
    private transitionToOpen;
    /**
     * Transition to HALF_OPEN state
     */
    private transitionToHalfOpen;
    /**
     * Transition to CLOSED state
     */
    private transitionToClosed;
    /**
     * Schedule automatic reset attempt
     */
    private scheduleReset;
    /**
     * Clear reset timer
     */
    private clearResetTimer;
    /**
     * Get current state
     */
    getState(): CircuitState;
    /**
     * Get current metrics
     */
    getMetrics(): CircuitBreakerMetrics;
    /**
     * Reset circuit breaker to initial state
     */
    reset(): void;
    /**
     * Force circuit to OPEN state
     */
    forceOpen(): void;
    /**
     * Force circuit to CLOSED state
     */
    forceClosed(): void;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Circuit Breaker Error
 */
export declare class CircuitBreakerError extends Error {
    readonly code: string;
    readonly state: CircuitState;
    constructor(message: string, code: string, state: CircuitState);
}
export {};
//# sourceMappingURL=CircuitBreaker.d.ts.map
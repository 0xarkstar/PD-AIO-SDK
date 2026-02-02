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
 * Default configuration
 */
const DEFAULT_CONFIG: Required<CircuitBreakerConfig> = {
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
export class CircuitBreaker extends EventEmitter<CircuitBreakerEvents> {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private totalRequests = 0;
  private lastFailureTime = 0;
  private lastStateChangeTime = Date.now();
  private resetTimer: NodeJS.Timeout | null = null;
  private requestTimestamps: number[] = [];

  private readonly config: Required<CircuitBreakerConfig>;

  constructor(config: CircuitBreakerConfig = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit allows the request
    if (!this.canExecute()) {
      this.recordRejection();
      throw new CircuitBreakerError(
        'Circuit breaker is OPEN',
        'CIRCUIT_OPEN',
        this.state
      );
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error as Error);
      throw error;
    }
  }

  /**
   * Check if circuit allows request execution
   */
  private canExecute(): boolean {
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
  private recordSuccess(): void {
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
    } else if (this.state === 'CLOSED') {
      // Reset failure count on success in CLOSED state
      this.failureCount = 0;
    }
  }

  /**
   * Record failed execution
   */
  private recordFailure(error: Error): void {
    this.totalRequests++;
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.cleanupOldTimestamps();
    this.requestTimestamps.push(Date.now());

    this.emit('failure', error);

    if (this.state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN immediately reopens circuit
      this.transitionToOpen();
    } else if (this.state === 'CLOSED') {
      // Check if we should open the circuit
      this.checkThresholds();
    }
  }

  /**
   * Record rejected request
   */
  private recordRejection(): void {
    this.emit('reject');
  }

  /**
   * Check if failure thresholds are exceeded
   */
  private checkThresholds(): void {
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
  private calculateErrorRate(): number {
    const recentRequests = this.getRecentRequestCount();
    if (recentRequests === 0) {
      return 0;
    }

    return this.failureCount / recentRequests;
  }

  /**
   * Get count of recent requests within time window
   */
  private getRecentRequestCount(): number {
    this.cleanupOldTimestamps();
    return this.requestTimestamps.length;
  }

  /**
   * Remove timestamps outside the time window
   */
  private cleanupOldTimestamps(): void {
    const cutoff = Date.now() - this.config.timeWindow;
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts >= cutoff);
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
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
  private transitionToHalfOpen(): void {
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
  private transitionToClosed(): void {
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
  private scheduleReset(): void {
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
  private clearResetTimer(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
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
  reset(): void {
    this.transitionToClosed();
  }

  /**
   * Force circuit to OPEN state
   */
  forceOpen(): void {
    this.transitionToOpen();
  }

  /**
   * Force circuit to CLOSED state
   */
  forceClosed(): void {
    this.transitionToClosed();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearResetTimer();
    this.removeAllListeners();
  }
}

/**
 * Circuit Breaker Error
 */
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly state: CircuitState
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

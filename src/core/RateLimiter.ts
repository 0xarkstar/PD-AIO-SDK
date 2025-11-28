/**
 * Token Bucket Rate Limiter
 *
 * Implements rate limiting using token bucket algorithm
 */

import { RateLimitError } from '../types/errors.js';

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

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private readonly maxTokens: number;
  private readonly windowMs: number;
  private readonly refillRate: number;
  private readonly weights: Record<string, number>;
  private readonly exchange: string;
  private bucket: TokenBucket;
  private readonly queue: Array<{
    weight: number;
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];
  private processingQueue = false;

  constructor(config: RateLimiterConfig) {
    this.maxTokens = config.maxTokens;
    this.windowMs = config.windowMs;
    this.refillRate = config.refillRate ?? config.maxTokens;
    this.weights = config.weights ?? {};
    this.exchange = config.exchange ?? 'unknown';

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
  async acquire(endpoint?: string, weight?: number): Promise<void> {
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
  tryAcquire(endpoint?: string, weight?: number): boolean {
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
  getAvailableTokens(): number {
    this.refillBucket();
    return this.bucket.tokens;
  }

  /**
   * Get time until next token refill (ms)
   */
  getTimeUntilRefill(): number {
    const elapsed = Date.now() - this.bucket.lastRefill;
    const remaining = this.windowMs - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Reset rate limiter
   */
  reset(): void {
    this.bucket = {
      tokens: this.maxTokens,
      lastRefill: Date.now(),
    };
    this.queue.length = 0;
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue) {
      return;
    }

    this.processingQueue = true;

    while (this.queue.length > 0) {
      this.refillBucket();

      const request = this.queue[0];
      if (!request) break;

      if (this.bucket.tokens >= request.weight) {
        // Tokens available - consume and resolve
        this.bucket.tokens -= request.weight;
        this.queue.shift();
        request.resolve();
      } else {
        // Not enough tokens - wait for refill
        const waitTime = this.getTimeUntilRefill();

        if (waitTime > 0) {
          await this.sleep(Math.min(waitTime, 100)); // Check every 100ms max
        } else {
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
  private refillBucket(): void {
    const now = Date.now();
    const elapsed = now - this.bucket.lastRefill;

    if (elapsed >= this.windowMs) {
      // Full refill
      const fullWindows = Math.floor(elapsed / this.windowMs);
      this.bucket.tokens = Math.min(
        this.maxTokens,
        this.bucket.tokens + fullWindows * this.refillRate
      );
      this.bucket.lastRefill = now - (elapsed % this.windowMs);
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get rate limiter statistics
   */
  getStats(): {
    availableTokens: number;
    maxTokens: number;
    queueLength: number;
    timeUntilRefill: number;
  } {
    return {
      availableTokens: this.getAvailableTokens(),
      maxTokens: this.maxTokens,
      queueLength: this.queue.length,
      timeUntilRefill: this.getTimeUntilRefill(),
    };
  }
}

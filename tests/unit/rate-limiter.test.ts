/**
 * Rate Limiter Unit Tests
 */

import { RateLimiter } from '../../src/core/RateLimiter.js';

describe('RateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('allows requests within limit', async () => {
    const limiter = new RateLimiter({
      maxTokens: 10,
      windowMs: 1000,
    });

    // Should allow 10 requests immediately
    for (let i = 0; i < 10; i++) {
      await expect(limiter.acquire()).resolves.toBeUndefined();
    }

    expect(limiter.getAvailableTokens()).toBe(0);
  });

  test('blocks requests exceeding limit', async () => {
    const limiter = new RateLimiter({
      maxTokens: 5,
      windowMs: 1000,
    });

    // Consume all tokens
    for (let i = 0; i < 5; i++) {
      await limiter.acquire();
    }

    expect(limiter.getAvailableTokens()).toBe(0);

    // Next request should wait
    const acquirePromise = limiter.acquire();

    // Advance time to refill
    jest.advanceTimersByTime(1000);

    await expect(acquirePromise).resolves.toBeUndefined();
  });

  test('tryAcquire returns false when no tokens available', () => {
    const limiter = new RateLimiter({
      maxTokens: 2,
      windowMs: 1000,
    });

    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false); // No tokens left
  });

  test('respects weighted requests', async () => {
    const limiter = new RateLimiter({
      maxTokens: 10,
      windowMs: 1000,
      weights: {
        heavy: 5,
        light: 1,
      },
    });

    await limiter.acquire('heavy'); // Consumes 5
    await limiter.acquire('light'); // Consumes 1

    expect(limiter.getAvailableTokens()).toBe(4);
  });

  test('refills tokens after time window', () => {
    const limiter = new RateLimiter({
      maxTokens: 10,
      windowMs: 1000,
      refillRate: 10,
    });

    // Consume all tokens
    for (let i = 0; i < 10; i++) {
      limiter.tryAcquire();
    }

    expect(limiter.getAvailableTokens()).toBe(0);

    // Advance time
    jest.advanceTimersByTime(1000);

    expect(limiter.getAvailableTokens()).toBe(10);
  });

  test('reset clears all tokens and queue', () => {
    const limiter = new RateLimiter({
      maxTokens: 5,
      windowMs: 1000,
    });

    // Consume some tokens
    limiter.tryAcquire();
    limiter.tryAcquire();

    expect(limiter.getAvailableTokens()).toBe(3);

    limiter.reset();

    expect(limiter.getAvailableTokens()).toBe(5);
  });

  test('getStats returns correct information', () => {
    const limiter = new RateLimiter({
      maxTokens: 10,
      windowMs: 1000,
    });

    limiter.tryAcquire();
    limiter.tryAcquire();

    const stats = limiter.getStats();

    expect(stats.availableTokens).toBe(8);
    expect(stats.maxTokens).toBe(10);
    expect(stats.queueLength).toBe(0);
  });

  test('processes queued requests in order', async () => {
    const limiter = new RateLimiter({
      maxTokens: 1,
      windowMs: 100,
    });

    const results: number[] = [];

    // First request succeeds immediately
    limiter.acquire().then(() => results.push(1));

    // Second request waits
    const promise2 = limiter.acquire().then(() => results.push(2));

    // Third request waits
    const promise3 = limiter.acquire().then(() => results.push(3));

    // Advance time to process queue
    jest.advanceTimersByTime(100);
    await promise2;

    jest.advanceTimersByTime(100);
    await promise3;

    expect(results).toEqual([1, 2, 3]);
  });

  test('handles custom weight parameter', async () => {
    const limiter = new RateLimiter({
      maxTokens: 10,
      windowMs: 1000,
    });

    await limiter.acquire(undefined, 7); // Custom weight

    expect(limiter.getAvailableTokens()).toBe(3);
  });
});

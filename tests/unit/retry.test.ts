/**
 * Retry Logic Unit Tests
 */

import {
  withRetry,
  withRetryWrapper,
  withLinearRetry,
  withRetryStats,
  RetryStats,
  type RetryConfig,
} from '../../src/core/retry.js';
import { RateLimitError, ExchangeUnavailableError } from '../../src/types/errors.js';

describe('Retry Logic', () => {
  describe('withRetry', () => {
    test('succeeds on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('retries on retryable error', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new ExchangeUnavailableError('down', 'TEST', 'test'))
        .mockResolvedValueOnce('success');

      const result = await withRetry(fn, { baseDelay: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('throws after max attempts exhausted', async () => {
      const error = new ExchangeUnavailableError('always fails', 'TEST', 'test');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(withRetry(fn, { maxAttempts: 3, baseDelay: 10 })).rejects.toThrow(error);

      expect(fn).toHaveBeenCalledTimes(3);
    });

    test('does not retry on non-retryable error', async () => {
      const error = new Error('not retryable');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(withRetry(fn)).rejects.toThrow(error);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('respects RateLimitError retryAfter', async () => {
      const rateLimitError = new RateLimitError('rate limited', 'RATE_LIMIT', 'test', 100);
      const fn = jest
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce('success');

      const start = Date.now();
      const result = await withRetry(fn, { maxAttempts: 2 });
      const elapsed = Date.now() - start;

      expect(result).toBe('success');
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some timing variance
    });

    test('invokes onRetry callback', async () => {
      const onRetry = jest.fn();
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new ExchangeUnavailableError('retry', 'TEST', 'test'))
        .mockResolvedValueOnce('success');

      await withRetry(fn, { baseDelay: 10, onRetry });

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), expect.any(Number));
    });

    test('uses custom isRetryable function', async () => {
      const customError = new Error('custom retryable');
      const fn = jest.fn().mockRejectedValueOnce(customError).mockResolvedValueOnce('success');

      const result = await withRetry(fn, {
        baseDelay: 10,
        isRetryable: (error) => error.message.includes('retryable'),
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('calculates exponential backoff', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new ExchangeUnavailableError('1', 'TEST', 'test'))
        .mockRejectedValueOnce(new ExchangeUnavailableError('2', 'TEST', 'test'))
        .mockResolvedValueOnce('success');

      const delays: number[] = [];
      const onRetry = (attempt: number, error: Error, delay: number) => {
        delays.push(delay);
      };

      await withRetry(fn, {
        maxAttempts: 3,
        baseDelay: 100,
        backoffMultiplier: 2,
        enableJitter: false,
        onRetry,
      });

      // Delays should be: 100, 200
      expect(delays[0]).toBeCloseTo(100, -1);
      expect(delays[1]).toBeCloseTo(200, -1);
    });

    test('respects maxDelay cap', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new ExchangeUnavailableError('1', 'TEST', 'test'))
        .mockRejectedValueOnce(new ExchangeUnavailableError('2', 'TEST', 'test'))
        .mockResolvedValueOnce('success');

      const delays: number[] = [];
      const onRetry = (attempt: number, error: Error, delay: number) => {
        delays.push(delay);
      };

      await withRetry(fn, {
        maxAttempts: 3,
        baseDelay: 1000,
        backoffMultiplier: 10,
        maxDelay: 500,
        enableJitter: false,
        onRetry,
      });

      // All delays should be capped at maxDelay
      delays.forEach((delay) => {
        expect(delay).toBeLessThanOrEqual(500);
      });
    });

    test('applies jitter when enabled', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new ExchangeUnavailableError('1', 'TEST', 'test'))
        .mockRejectedValueOnce(new ExchangeUnavailableError('2', 'TEST', 'test'))
        .mockResolvedValueOnce('success');

      const delaysWithJitter: number[] = [];
      const delaysWithoutJitter: number[] = [];

      // Run with jitter
      await withRetry(fn, {
        maxAttempts: 3,
        baseDelay: 100,
        enableJitter: true,
        onRetry: (attempt, error, delay) => delaysWithJitter.push(delay),
      });

      fn.mockClear();

      // Run without jitter
      fn.mockRejectedValueOnce(new ExchangeUnavailableError('1', 'TEST', 'test'))
        .mockRejectedValueOnce(new ExchangeUnavailableError('2', 'TEST', 'test'))
        .mockResolvedValueOnce('success');

      await withRetry(fn, {
        maxAttempts: 3,
        baseDelay: 100,
        enableJitter: false,
        onRetry: (attempt, error, delay) => delaysWithoutJitter.push(delay),
      });

      // Delays with jitter should be within ±25% of base
      delaysWithJitter.forEach((delay, i) => {
        expect(delay).not.toBe(delaysWithoutJitter[i]);
      });
    });
  });

  describe('withRetryWrapper', () => {
    test('creates wrapper function with retry logic', async () => {
      let callCount = 0;
      const fn = async (x: number) => {
        callCount++;
        if (callCount < 2) {
          throw new ExchangeUnavailableError('retry', 'TEST', 'test');
        }
        return x * 2;
      };

      const wrapped = withRetryWrapper(fn, { baseDelay: 10 });

      const result = await wrapped(5);
      expect(result).toBe(10);
      expect(callCount).toBe(2);
    });
  });

  describe('withLinearRetry', () => {
    test('uses linear backoff instead of exponential', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new ExchangeUnavailableError('1', 'TEST', 'test'))
        .mockRejectedValueOnce(new ExchangeUnavailableError('2', 'TEST', 'test'))
        .mockResolvedValueOnce('success');

      const delays: number[] = [];
      const onRetry = (attempt: number, error: Error, delay: number) => {
        delays.push(delay);
      };

      await withLinearRetry(fn, {
        maxAttempts: 3,
        baseDelay: 100,
        enableJitter: false,
        onRetry,
      });

      // Linear backoff: all delays should be ~100
      expect(delays[0]).toBeCloseTo(100, -1);
      expect(delays[1]).toBeCloseTo(100, -1);
    });
  });

  describe('RetryStats', () => {
    test('tracks retry statistics', () => {
      const stats = new RetryStats();

      stats.record(1, true); // Success on first try
      stats.record(3, true); // Success after 2 retries
      stats.record(5, false); // Failed after max retries

      const result = stats.getStats();

      expect(result.total).toBe(3);
      expect(result.successes).toBe(2);
      expect(result.failures).toBe(1);
      expect(result.successRate).toBeCloseTo(0.666, 2);
      expect(result.averageAttempts).toBeCloseTo(3, 0);
    });

    test('handles empty stats', () => {
      const stats = new RetryStats();
      const result = stats.getStats();

      expect(result.total).toBe(0);
      expect(result.averageAttempts).toBe(0);
      expect(result.successRate).toBe(0);
    });

    test('resets statistics', () => {
      const stats = new RetryStats();
      stats.record(1, true);
      stats.reset();

      const result = stats.getStats();
      expect(result.total).toBe(0);
    });
  });

  describe('withRetryStats', () => {
    test('collects statistics during retry', async () => {
      const stats = new RetryStats();
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new ExchangeUnavailableError('retry', 'TEST', 'test'))
        .mockResolvedValueOnce('success');

      await withRetryStats(() => fn(), stats, { baseDelay: 10 });

      const result = stats.getStats();
      expect(result.total).toBe(1);
      expect(result.successes).toBe(1);
      expect(result.averageAttempts).toBe(2);
    });

    test('records failures', async () => {
      const stats = new RetryStats();
      const fn = jest.fn().mockRejectedValue(new ExchangeUnavailableError('fail', 'TEST', 'test'));

      await expect(
        withRetryStats(() => fn(), stats, { maxAttempts: 2, baseDelay: 10 })
      ).rejects.toThrow();

      const result = stats.getStats();
      expect(result.total).toBe(1);
      expect(result.failures).toBe(1);
    });
  });
});

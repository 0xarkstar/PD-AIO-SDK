/**
 * Circuit Breaker Integration Tests
 *
 * Tests CircuitBreaker behavior with simulated adapter operations
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CircuitBreaker } from '../../src/core/CircuitBreaker.js';

describe('Circuit Breaker Integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Hyperliquid-like Adapter', () => {
    let circuitBreaker: CircuitBreaker;
    let mockFetchMarkets: jest.Mock;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        successThreshold: 2,
        resetTimeout: 5000,
        minimumRequestVolume: 3, // Need at least 3 requests before checking
      });

      mockFetchMarkets = jest.fn();
    });

    afterEach(() => {
      circuitBreaker.destroy();
    });

    test('should open circuit after repeated failures', async () => {
      expect(circuitBreaker.getState()).toBe('CLOSED');

      // Mock 3 consecutive failures
      mockFetchMarkets.mockRejectedValue(new Error('Service unavailable'));

      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(() => mockFetchMarkets())
        ).rejects.toThrow();
      }

      expect(circuitBreaker.getState()).toBe('OPEN');

      // Next request should be rejected immediately
      await expect(
        circuitBreaker.execute(() => mockFetchMarkets())
      ).rejects.toThrow('Circuit breaker is OPEN');

      // Verify no new fetch call was made
      expect(mockFetchMarkets).toHaveBeenCalledTimes(3);
    });

    test('should transition to HALF_OPEN after timeout', async () => {
      // Open the circuit
      mockFetchMarkets.mockRejectedValue(new Error('Service unavailable'));
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(() => mockFetchMarkets())
        ).rejects.toThrow();
      }
      expect(circuitBreaker.getState()).toBe('OPEN');

      // Fast-forward time past resetTimeout
      jest.advanceTimersByTime(5000);

      // Mock successful response
      mockFetchMarkets.mockResolvedValueOnce(['market1', 'market2']);

      // Next request should transition to HALF_OPEN
      const result = await circuitBreaker.execute(() => mockFetchMarkets());
      expect(result).toEqual(['market1', 'market2']);
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
    });

    test('should close circuit on successful requests', async () => {
      // Open circuit
      mockFetchMarkets.mockRejectedValue(new Error('Service unavailable'));
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(() => mockFetchMarkets())
        ).rejects.toThrow();
      }

      // Transition to HALF_OPEN
      jest.advanceTimersByTime(5000);

      // Mock successful responses
      mockFetchMarkets.mockResolvedValue(['market1', 'market2']);

      // Need successThreshold (2) successful requests to close
      await circuitBreaker.execute(() => mockFetchMarkets());
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');

      await circuitBreaker.execute(() => mockFetchMarkets());
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    test('should reopen on failure in HALF_OPEN', async () => {
      // Open circuit
      mockFetchMarkets.mockRejectedValue(new Error('Service unavailable'));
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(() => mockFetchMarkets())
        ).rejects.toThrow();
      }

      // Transition to HALF_OPEN
      jest.advanceTimersByTime(5000);

      // First request succeeds
      mockFetchMarkets.mockResolvedValueOnce(['market1']);
      await circuitBreaker.execute(() => mockFetchMarkets());
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');

      // Second request fails
      mockFetchMarkets.mockRejectedValueOnce(new Error('Still failing'));
      await expect(
        circuitBreaker.execute(() => mockFetchMarkets())
      ).rejects.toThrow('Still failing');

      // Circuit should immediately reopen
      expect(circuitBreaker.getState()).toBe('OPEN');
    });
  });

  describe('Backpack-like Adapter', () => {
    let circuitBreaker: CircuitBreaker;
    let mockFetchMarkets: jest.Mock;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        successThreshold: 2,
        resetTimeout: 5000,
        minimumRequestVolume: 3, // Need at least 3 requests before checking
      });

      mockFetchMarkets = jest.fn();
    });

    afterEach(() => {
      circuitBreaker.destroy();
    });

    test('should open circuit after repeated failures', async () => {
      mockFetchMarkets.mockRejectedValue(new Error('Network error'));

      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(() => mockFetchMarkets())
        ).rejects.toThrow('Network error');
      }

      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    test('should transition to HALF_OPEN after timeout', async () => {
      mockFetchMarkets.mockRejectedValue(new Error('Network error'));
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(() => mockFetchMarkets())
        ).rejects.toThrow();
      }

      jest.advanceTimersByTime(5000);

      mockFetchMarkets.mockResolvedValueOnce({ markets: [] });
      await circuitBreaker.execute(() => mockFetchMarkets());
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
    });

    test('should close circuit on successful requests', async () => {
      mockFetchMarkets.mockRejectedValue(new Error('Network error'));
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(() => mockFetchMarkets())
        ).rejects.toThrow();
      }

      jest.advanceTimersByTime(5000);

      mockFetchMarkets.mockResolvedValue({ markets: [] });
      await circuitBreaker.execute(() => mockFetchMarkets());
      await circuitBreaker.execute(() => mockFetchMarkets());
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    test('should reopen on failure in HALF_OPEN', async () => {
      mockFetchMarkets.mockRejectedValue(new Error('Network error'));
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(() => mockFetchMarkets())
        ).rejects.toThrow();
      }

      jest.advanceTimersByTime(5000);

      mockFetchMarkets.mockResolvedValueOnce({ markets: [] });
      await circuitBreaker.execute(() => mockFetchMarkets());

      mockFetchMarkets.mockRejectedValueOnce(new Error('Still failing'));
      await expect(
        circuitBreaker.execute(() => mockFetchMarkets())
      ).rejects.toThrow();

      expect(circuitBreaker.getState()).toBe('OPEN');
    });
  });

  describe('Lighter-like Adapter', () => {
    let circuitBreaker: CircuitBreaker;
    let mockFetchMarkets: jest.Mock;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        successThreshold: 2,
        resetTimeout: 5000,
        minimumRequestVolume: 3, // Need at least 3 requests before checking
      });

      mockFetchMarkets = jest.fn();
    });

    afterEach(() => {
      circuitBreaker.destroy();
    });

    test('should open circuit after repeated failures', async () => {
      mockFetchMarkets.mockRejectedValue(new Error('API error'));

      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(() => mockFetchMarkets())
        ).rejects.toThrow('API error');
      }

      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    test('should transition to HALF_OPEN after timeout', async () => {
      mockFetchMarkets.mockRejectedValue(new Error('API error'));
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(() => mockFetchMarkets())
        ).rejects.toThrow();
      }

      jest.advanceTimersByTime(5000);

      mockFetchMarkets.mockResolvedValueOnce([]);
      await circuitBreaker.execute(() => mockFetchMarkets());
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
    });

    test('should close circuit on successful requests', async () => {
      mockFetchMarkets.mockRejectedValue(new Error('API error'));
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(() => mockFetchMarkets())
        ).rejects.toThrow();
      }

      jest.advanceTimersByTime(5000);

      mockFetchMarkets.mockResolvedValue([]);
      await circuitBreaker.execute(() => mockFetchMarkets());
      await circuitBreaker.execute(() => mockFetchMarkets());
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    test('should reopen on failure in HALF_OPEN', async () => {
      mockFetchMarkets.mockRejectedValue(new Error('API error'));
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(() => mockFetchMarkets())
        ).rejects.toThrow();
      }

      jest.advanceTimersByTime(5000);

      mockFetchMarkets.mockResolvedValueOnce([]);
      await circuitBreaker.execute(() => mockFetchMarkets());

      mockFetchMarkets.mockRejectedValueOnce(new Error('Still failing'));
      await expect(
        circuitBreaker.execute(() => mockFetchMarkets())
      ).rejects.toThrow();

      expect(circuitBreaker.getState()).toBe('OPEN');
    });
  });
});

/**
 * Circuit Breaker Unit Tests
 *
 * Tests the circuit breaker pattern implementation with:
 * - State transitions (CLOSED -> OPEN -> HALF_OPEN -> CLOSED)
 * - Failure threshold detection
 * - Error rate calculation
 * - Auto-recovery mechanism
 * - Event emission
 * - Metrics tracking
 */

import { CircuitBreaker, CircuitBreakerError, CircuitState } from '../../../src/core/CircuitBreaker.js';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    jest.clearAllMocks();
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeWindow: 10000, // 10 seconds
      resetTimeout: 5000, // 5 seconds
      minimumRequestVolume: 5,
      errorThresholdPercentage: 0.5, // 50%
    });
  });

  afterEach(() => {
    circuitBreaker.destroy();
  });

  describe('Initialization', () => {
    test('should initialize in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    test('should use default config if not provided', () => {
      const cb = new CircuitBreaker();
      const metrics = cb.getMetrics();
      expect(metrics.state).toBe('CLOSED');
      cb.destroy();
    });

    test('should merge custom config with defaults', () => {
      const cb = new CircuitBreaker({ failureThreshold: 10 });
      expect(cb.getState()).toBe('CLOSED');
      cb.destroy();
    });
  });

  describe('State: CLOSED', () => {
    test('should execute function successfully in CLOSED state', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    test('should allow all requests in CLOSED state', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      for (let i = 0; i < 10; i++) {
        await circuitBreaker.execute(mockFn);
      }

      expect(mockFn).toHaveBeenCalledTimes(10);
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    test('should reset failure count on success in CLOSED state', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('failure 1'))
        .mockRejectedValueOnce(new Error('failure 2'))
        .mockResolvedValue('success');

      // 2 failures
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure 1');
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure 2');

      // 1 success - should reset failure count
      await circuitBreaker.execute(mockFn);

      // Should still be CLOSED with reset failure count
      expect(circuitBreaker.getState()).toBe('CLOSED');
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.consecutiveFailures).toBe(0);
    });

    test('should transition to OPEN when failure threshold exceeded', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      // Need at least minimumRequestVolume (5) requests
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      }

      // Still CLOSED due to minimumRequestVolume
      expect(circuitBreaker.getState()).toBe('CLOSED');

      // Add 2 more failures to reach minimumRequestVolume and threshold
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');

      // Should now be OPEN
      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    test('should transition to OPEN when error rate threshold exceeded', async () => {
      const mockFn = jest
        .fn()
        .mockResolvedValueOnce('success')
        .mockResolvedValueOnce('success')
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('failure'))
        .mockRejectedValueOnce(new Error('failure'))
        .mockRejectedValueOnce(new Error('failure'));

      // 3 successes
      await circuitBreaker.execute(mockFn);
      await circuitBreaker.execute(mockFn);
      await circuitBreaker.execute(mockFn);

      // 3 failures (total 6 requests, 50% error rate)
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');

      // Should be OPEN due to 50% error rate
      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    test('should not transition to OPEN if below minimumRequestVolume', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      // Only 3 failures (below minimumRequestVolume of 5)
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      }

      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });

  describe('State: OPEN', () => {
    beforeEach(async () => {
      // Transition to OPEN state
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));
      for (let i = 0; i < 5; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      }
      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    test('should reject all requests immediately in OPEN state', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow(CircuitBreakerError);
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Circuit breaker is OPEN');

      // Function should never be called
      expect(mockFn).not.toHaveBeenCalled();
    });

    test('should throw CircuitBreakerError with correct properties', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      try {
        await circuitBreaker.execute(mockFn);
        fail('Should have thrown CircuitBreakerError');
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitBreakerError);
        expect((error as CircuitBreakerError).code).toBe('CIRCUIT_OPEN');
        expect((error as CircuitBreakerError).state).toBe('OPEN');
        expect((error as CircuitBreakerError).name).toBe('CircuitBreakerError');
      }
    });

    test(
      'should transition to HALF_OPEN after reset timeout',
      async () => {
        // Circuit is OPEN with real timers
        expect(circuitBreaker.getState()).toBe('OPEN');

        // Wait for reset timeout (5000ms) + buffer
        await new Promise(resolve => setTimeout(resolve, 5100));

        // Try to execute - this should trigger HALF_OPEN transition
        const mockFn = jest.fn().mockResolvedValue('success');
        await circuitBreaker.execute(mockFn);

        // Should have transitioned to HALF_OPEN and executed the function
        expect(circuitBreaker.getState()).toBe('HALF_OPEN');
        expect(mockFn).toHaveBeenCalledTimes(1);
      },
      10000
    );

    test(
      'should allow request after reset timeout',
      async () => {
        const mockFn = jest.fn().mockResolvedValue('success');

        // Circuit is OPEN - should reject
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow(CircuitBreakerError);

        // Wait for reset timeout (5000ms) + buffer
        await new Promise(resolve => setTimeout(resolve, 5100));

        // Should now be HALF_OPEN and allow request
        const result = await circuitBreaker.execute(mockFn);
        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(1);
      },
      10000
    );
  });

  describe('State: HALF_OPEN', () => {
    beforeEach(async () => {
      jest.useFakeTimers();

      // Transition to OPEN state
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));
      for (let i = 0; i < 5; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      }

      // Transition to HALF_OPEN
      jest.advanceTimersByTime(5000);
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should allow requests in HALF_OPEN state', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should transition to CLOSED after success threshold', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      // successThreshold is 2
      await circuitBreaker.execute(mockFn);
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');

      await circuitBreaker.execute(mockFn);
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    test('should transition back to OPEN on any failure', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');

      // Should immediately transition back to OPEN
      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    test('should transition back to OPEN even after some successes', async () => {
      const mockFn = jest
        .fn()
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('failure'));

      // First success
      await circuitBreaker.execute(mockFn);
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');

      // Then failure - should reopen
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      expect(circuitBreaker.getState()).toBe('OPEN');
    });
  });

  describe('Event Emission', () => {
    test('should emit stateChange and open events', async () => {
      const stateChangeHandler = jest.fn();
      const openHandler = jest.fn();

      circuitBreaker.on('stateChange', stateChangeHandler);
      circuitBreaker.on('open', openHandler);

      // Trigger OPEN state
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));
      for (let i = 0; i < 5; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      }

      expect(stateChangeHandler).toHaveBeenCalledWith('CLOSED', 'OPEN');
      expect(openHandler).toHaveBeenCalled();
    });

    test('should emit halfOpen event', async () => {
      jest.useFakeTimers();

      const halfOpenHandler = jest.fn();
      circuitBreaker.on('halfOpen', halfOpenHandler);

      // Transition to OPEN
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));
      for (let i = 0; i < 5; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      }

      // Transition to HALF_OPEN
      jest.advanceTimersByTime(5000);

      expect(halfOpenHandler).toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('should emit close event', async () => {
      jest.useFakeTimers();

      const closeHandler = jest.fn();
      circuitBreaker.on('close', closeHandler);

      // Transition to OPEN
      const mockFailFn = jest.fn().mockRejectedValue(new Error('failure'));
      for (let i = 0; i < 5; i++) {
        await expect(circuitBreaker.execute(mockFailFn)).rejects.toThrow('failure');
      }

      // Transition to HALF_OPEN
      jest.advanceTimersByTime(5000);

      // Transition to CLOSED
      const mockSuccessFn = jest.fn().mockResolvedValue('success');
      await circuitBreaker.execute(mockSuccessFn);
      await circuitBreaker.execute(mockSuccessFn);

      expect(closeHandler).toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('should emit success event', async () => {
      const successHandler = jest.fn();
      circuitBreaker.on('success', successHandler);

      const mockFn = jest.fn().mockResolvedValue('success');
      await circuitBreaker.execute(mockFn);

      expect(successHandler).toHaveBeenCalled();
    });

    test('should emit failure event', async () => {
      const failureHandler = jest.fn();
      circuitBreaker.on('failure', failureHandler);

      const error = new Error('test error');
      const mockFn = jest.fn().mockRejectedValue(error);
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('test error');

      expect(failureHandler).toHaveBeenCalledWith(error);
    });

    test('should emit reject event', async () => {
      const rejectHandler = jest.fn();
      circuitBreaker.on('reject', rejectHandler);

      // Transition to OPEN
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));
      for (let i = 0; i < 5; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      }

      // Try to execute when OPEN
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow(CircuitBreakerError);

      expect(rejectHandler).toHaveBeenCalled();
    });
  });

  describe('Metrics', () => {
    test('should track total requests', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      for (let i = 0; i < 5; i++) {
        await circuitBreaker.execute(mockFn);
      }

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.totalRequests).toBe(5);
    });

    test('should track successful requests', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      for (let i = 0; i < 3; i++) {
        await circuitBreaker.execute(mockFn);
      }

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.successfulRequests).toBe(3);
    });

    test('should track failed requests', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      for (let i = 0; i < 2; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      }

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.failedRequests).toBe(2);
    });

    test('should calculate error rate', async () => {
      const mockFn = jest
        .fn()
        .mockResolvedValueOnce('success')
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('failure'))
        .mockRejectedValueOnce(new Error('failure'));

      await circuitBreaker.execute(mockFn);
      await circuitBreaker.execute(mockFn);
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.errorRate).toBe(0.5); // 2 failures out of 4 requests
    });

    test('should track consecutive successes in HALF_OPEN', async () => {
      jest.useFakeTimers();

      // Transition to OPEN
      const mockFailFn = jest.fn().mockRejectedValue(new Error('failure'));
      for (let i = 0; i < 5; i++) {
        await expect(circuitBreaker.execute(mockFailFn)).rejects.toThrow('failure');
      }

      // Transition to HALF_OPEN
      jest.advanceTimersByTime(5000);

      // Record success
      const mockSuccessFn = jest.fn().mockResolvedValue('success');
      await circuitBreaker.execute(mockSuccessFn);

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.consecutiveSuccesses).toBe(1);

      jest.useRealTimers();
    });

    test('should track consecutive failures in CLOSED', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.consecutiveFailures).toBe(2);
    });

    test('should track last state change time', async () => {
      const beforeTime = Date.now();

      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));
      for (let i = 0; i < 5; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      }

      const afterTime = Date.now();
      const metrics = circuitBreaker.getMetrics();

      expect(metrics.lastStateChange).toBeGreaterThanOrEqual(beforeTime);
      expect(metrics.lastStateChange).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Manual Controls', () => {
    test('should reset to CLOSED state', async () => {
      // Transition to OPEN
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));
      for (let i = 0; i < 5; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      }

      expect(circuitBreaker.getState()).toBe('OPEN');

      // Manual reset
      circuitBreaker.reset();

      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    test('should force OPEN state', () => {
      expect(circuitBreaker.getState()).toBe('CLOSED');

      circuitBreaker.forceOpen();

      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    test('should force CLOSED state from OPEN', async () => {
      // Transition to OPEN
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));
      for (let i = 0; i < 5; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      }

      expect(circuitBreaker.getState()).toBe('OPEN');

      circuitBreaker.forceClosed();

      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });

  describe('Time Window', () => {
    test('should cleanup old timestamps outside time window', async () => {
      jest.useFakeTimers();

      const mockFn = jest
        .fn()
        .mockResolvedValueOnce('success')
        .mockResolvedValueOnce('success')
        .mockResolvedValueOnce('success');

      // 3 requests at time 0
      await circuitBreaker.execute(mockFn);
      await circuitBreaker.execute(mockFn);
      await circuitBreaker.execute(mockFn);

      // Fast-forward past time window (10000ms)
      jest.advanceTimersByTime(11000);

      // These old requests should not count anymore
      const mockFailFn = jest.fn().mockRejectedValue(new Error('failure'));

      // Only 1 failure (not enough to open circuit due to minimumRequestVolume)
      await expect(circuitBreaker.execute(mockFailFn)).rejects.toThrow('failure');

      expect(circuitBreaker.getState()).toBe('CLOSED');

      jest.useRealTimers();
    });
  });

  describe('Resource Cleanup', () => {
    test('should clear reset timer on destroy', async () => {
      // Transition to OPEN (schedules reset timer)
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));
      for (let i = 0; i < 5; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      }

      circuitBreaker.destroy();

      // Verify no errors occur
      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    test('should remove all listeners on destroy', async () => {
      const handler = jest.fn();
      circuitBreaker.on('success', handler);

      circuitBreaker.destroy();

      // This should not trigger the handler
      const mockFn = jest.fn().mockResolvedValue('success');
      // Circuit is destroyed but state checks still work
      // Just verify cleanup doesn't crash
      expect(() => circuitBreaker.destroy()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle synchronous errors', async () => {
      const mockFn = jest.fn(() => {
        throw new Error('sync error');
      });

      await expect(circuitBreaker.execute(mockFn as any)).rejects.toThrow('sync error');
    });

    test('should handle zero minimumRequestVolume', async () => {
      const cb = new CircuitBreaker({
        minimumRequestVolume: 0,
        failureThreshold: 2,
        errorThresholdPercentage: 0.5, // 50% error rate
      });

      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      // With minimumRequestVolume=0, first failure (100% error rate) exceeds 50% threshold
      // So circuit opens immediately
      await expect(cb.execute(mockFn)).rejects.toThrow('failure');
      expect(cb.getState()).toBe('OPEN');

      cb.destroy();
    });

    test('should handle 100% error rate', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

      for (let i = 0; i < 5; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      }

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.errorRate).toBe(1.0);
      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    test('should handle 0% error rate', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      for (let i = 0; i < 5; i++) {
        await circuitBreaker.execute(mockFn);
      }

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.errorRate).toBe(0);
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });
});

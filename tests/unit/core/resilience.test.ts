/**
 * Resilience Utilities Tests
 *
 * Tests the production resilience utilities including:
 * - Resilient executor (circuit breaker + retry + fallback)
 * - Bulkhead pattern
 * - Timeout wrapper
 * - Cache wrapper
 */

import {
  createResilientExecutor,
  withResilience,
  Resilient,
  Bulkhead,
  withTimeout,
  withCache,
  type ResilienceConfig,
} from '../../../src/core/resilience.js';
import { CircuitBreakerError } from '../../../src/core/CircuitBreaker.js';

describe('Resilience Utilities', () => {
  describe('createResilientExecutor', () => {
    test('should execute function successfully', async () => {
      const executor = createResilientExecutor();
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await executor(mockFn, 'testOp');

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should retry on failure and eventually succeed', async () => {
      const executor = createResilientExecutor({
        retry: {
          maxAttempts: 3,
          baseDelay: 10,
          isRetryable: () => true, // Retry all errors for testing
        },
      });

      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const result = await executor(mockFn, 'testOp');

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('should use fallback when retries exhausted', async () => {
      const fallbackFn = jest.fn().mockResolvedValue('fallback result');
      const executor = createResilientExecutor({
        retry: {
          maxAttempts: 2,
          baseDelay: 10,
          isRetryable: () => true,
        },
        fallback: fallbackFn,
      });

      const mockFn = jest.fn().mockRejectedValue(new Error('always fails'));

      const result = await executor(mockFn, 'testOp');

      expect(result).toBe('fallback result');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(fallbackFn).toHaveBeenCalledTimes(1);
    });

    test('should call onFailure callback', async () => {
      const onFailure = jest.fn();
      const executor = createResilientExecutor({
        retry: {
          maxAttempts: 1,
          baseDelay: 10,
          isRetryable: () => true,
        },
        onFailure,
      });

      const mockFn = jest.fn().mockRejectedValue(new Error('test error'));

      await expect(executor(mockFn, 'testOp')).rejects.toThrow('test error');

      expect(onFailure).toHaveBeenCalled();
      const call = onFailure.mock.calls[0];
      expect(call[0]).toBeInstanceOf(Error);
      expect(call[1]).toMatchObject({
        type: 'retry_exhausted',
        operation: 'testOp',
      });
    });

    test('should fast-fail when circuit is open', async () => {
      const executor = createResilientExecutor({
        circuitBreaker: {
          failureThreshold: 3,
          minimumRequestVolume: 3, // Minimum 3 requests to check thresholds
          errorThresholdPercentage: 0.5,
        },
      });

      const mockFn = jest.fn().mockRejectedValue(new Error('fail'));

      // First 3 failures to open circuit (failureThreshold = 3, minimumRequestVolume = 3)
      await expect(executor(mockFn, 'testOp')).rejects.toThrow('fail');
      await expect(executor(mockFn, 'testOp')).rejects.toThrow('fail');
      await expect(executor(mockFn, 'testOp')).rejects.toThrow('fail');

      // Circuit should be open now - next attempts should fail with CircuitBreakerError
      await expect(executor(mockFn, 'testOp')).rejects.toThrow(CircuitBreakerError);
      await expect(executor(mockFn, 'testOp')).rejects.toThrow('Circuit breaker is OPEN');

      // Function should not be called when circuit is open
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('should handle fallback failure', async () => {
      const fallbackFn = jest.fn().mockRejectedValue(new Error('fallback failed'));
      const onFailure = jest.fn();

      const executor = createResilientExecutor({
        retry: {
          maxAttempts: 1,
          baseDelay: 10,
          isRetryable: () => true,
        },
        fallback: fallbackFn,
        onFailure,
      });

      const mockFn = jest.fn().mockRejectedValue(new Error('main error'));

      await expect(executor(mockFn, 'testOp')).rejects.toThrow('fallback failed');

      // onFailure should be called twice: once for main error, once for fallback
      expect(onFailure).toHaveBeenCalledTimes(2);
      expect(onFailure.mock.calls[1][1].type).toBe('fallback_failed');
    });

    test('should work without retry config', async () => {
      const executor = createResilientExecutor({
        circuitBreaker: {
          failureThreshold: 5,
        },
      });

      const mockFn = jest.fn().mockResolvedValue('success');
      const result = await executor(mockFn, 'testOp');

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('withResilience', () => {
    test('should wrap function with resilience', async () => {
      const originalFn = jest.fn().mockResolvedValue('success');
      const resilientFn = withResilience(originalFn, {
        retry: {
          maxAttempts: 3,
          baseDelay: 10,
        },
      });

      const result = await resilientFn();

      expect(result).toBe('success');
      expect(originalFn).toHaveBeenCalledTimes(1);
    });

    test('should pass arguments correctly', async () => {
      const originalFn = jest.fn().mockResolvedValue('success');
      const resilientFn = withResilience(originalFn);

      await resilientFn('arg1', 'arg2', 123);

      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });

    test('should use function name as operation name', async () => {
      const onFailure = jest.fn();

      async function myNamedFunction() {
        throw new Error('fail');
      }

      const resilientFn = withResilience(myNamedFunction, {
        retry: { maxAttempts: 1, baseDelay: 10 },
        onFailure,
      });

      await expect(resilientFn()).rejects.toThrow('fail');

      expect(onFailure.mock.calls[0][1].operation).toBe('myNamedFunction');
    });

    test('should use custom operation name if provided', async () => {
      const onFailure = jest.fn();
      const originalFn = async () => {
        throw new Error('fail');
      };

      const resilientFn = withResilience(
        originalFn,
        {
          retry: { maxAttempts: 1, baseDelay: 10 },
          onFailure,
        },
        'customOperation'
      );

      await expect(resilientFn()).rejects.toThrow('fail');

      expect(onFailure.mock.calls[0][1].operation).toBe('customOperation');
    });
  });

  describe('Resilient decorator', () => {
    test('should throw when applied to non-method', () => {
      expect(() => {
        const descriptor = {
          value: 'not a function',
        };
        Resilient()({}, 'prop', descriptor as any);
      }).toThrow('@Resilient can only be applied to methods');
    });

    test('should decorate a method with resilience (manual application)', async () => {
      class TestService {
        callCount = 0;

        async getData() {
          this.callCount++;
          return 'success';
        }
      }

      // Manually apply decorator
      const descriptor = Object.getOwnPropertyDescriptor(TestService.prototype, 'getData')!;
      const decoratedDescriptor = Resilient()(TestService.prototype, 'getData', descriptor);
      Object.defineProperty(TestService.prototype, 'getData', decoratedDescriptor);

      const service = new TestService();
      const result = await service.getData();

      expect(result).toBe('success');
      expect(service.callCount).toBe(1);
    });

    test('should retry on failure when configured (manual application)', async () => {
      class TestService {
        callCount = 0;

        async getData() {
          this.callCount++;
          if (this.callCount < 3) {
            throw new Error('not yet');
          }
          return 'success';
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(TestService.prototype, 'getData')!;
      const decoratedDescriptor = Resilient({
        retry: {
          maxAttempts: 3,
          baseDelay: 10,
          isRetryable: () => true,
        },
      })(TestService.prototype, 'getData', descriptor);
      Object.defineProperty(TestService.prototype, 'getData', decoratedDescriptor);

      const service = new TestService();
      const result = await service.getData();

      expect(result).toBe('success');
      expect(service.callCount).toBe(3);
    });

    test('should use fallback when configured (manual application)', async () => {
      class TestService {
        async getData() {
          throw new Error('always fails');
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(TestService.prototype, 'getData')!;
      const decoratedDescriptor = Resilient({
        retry: { maxAttempts: 1, baseDelay: 10 },
        fallback: async () => 'fallback value',
      })(TestService.prototype, 'getData', descriptor);
      Object.defineProperty(TestService.prototype, 'getData', decoratedDescriptor);

      const service = new TestService();
      const result = await service.getData();

      expect(result).toBe('fallback value');
    });

    test('should include class and method name in operation', async () => {
      const onFailure = jest.fn();

      class MyTestService {
        async fetchData() {
          throw new Error('fail');
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(MyTestService.prototype, 'fetchData')!;
      const decoratedDescriptor = Resilient({
        retry: { maxAttempts: 1, baseDelay: 10 },
        onFailure,
      })(MyTestService.prototype, 'fetchData', descriptor);
      Object.defineProperty(MyTestService.prototype, 'fetchData', decoratedDescriptor);

      const service = new MyTestService();
      await expect(service.fetchData()).rejects.toThrow('fail');

      expect(onFailure).toHaveBeenCalled();
      expect(onFailure.mock.calls[0][1].operation).toBe('MyTestService.fetchData');
    });

    test('should preserve this context (manual application)', async () => {
      class TestService {
        name = 'TestService';

        async getName() {
          return this.name;
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(TestService.prototype, 'getName')!;
      const decoratedDescriptor = Resilient()(TestService.prototype, 'getName', descriptor);
      Object.defineProperty(TestService.prototype, 'getName', decoratedDescriptor);

      const service = new TestService();
      const result = await service.getName();

      expect(result).toBe('TestService');
    });

    test('should pass arguments correctly (manual application)', async () => {
      class TestService {
        async add(a: number, b: number) {
          return a + b;
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(TestService.prototype, 'add')!;
      const decoratedDescriptor = Resilient()(TestService.prototype, 'add', descriptor);
      Object.defineProperty(TestService.prototype, 'add', decoratedDescriptor);

      const service = new TestService();
      const result = await service.add(2, 3);

      expect(result).toBe(5);
    });
  });

  describe('Bulkhead', () => {
    test('should allow executions up to max concurrent', async () => {
      const bulkhead = new Bulkhead({ maxConcurrent: 2 });
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const execute = async () => {
        return bulkhead.execute(async () => {
          concurrentCount++;
          maxConcurrent = Math.max(maxConcurrent, concurrentCount);
          await new Promise((resolve) => setTimeout(resolve, 10));
          concurrentCount--;
          return 'done';
        });
      };

      // Start 5 concurrent executions
      await Promise.all([execute(), execute(), execute(), execute(), execute()]);

      expect(maxConcurrent).toBe(2);
    });

    test('should queue executions when limit reached', async () => {
      const bulkhead = new Bulkhead({ maxConcurrent: 1 });
      const executionOrder: number[] = [];

      const execute = async (id: number) => {
        return bulkhead.execute(async () => {
          executionOrder.push(id);
          await new Promise((resolve) => setTimeout(resolve, 10));
          return id;
        });
      };

      // Start 3 concurrent executions
      await Promise.all([execute(1), execute(2), execute(3)]);

      // All should execute in order
      expect(executionOrder).toHaveLength(3);
    });

    test('should reject when queue is full', async () => {
      const bulkhead = new Bulkhead({
        maxConcurrent: 1,
        maxQueue: 1,
      });

      const longRunning = bulkhead.execute(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'done';
      });

      // Fill the queue
      const queued = bulkhead.execute(async () => 'queued');

      // This should fail - queue is full
      await expect(
        bulkhead.execute(async () => 'overflow')
      ).rejects.toThrow('Bulkhead queue is full');

      // Cleanup
      await Promise.all([longRunning, queued]);
    });

    test('should provide accurate metrics', async () => {
      const bulkhead = new Bulkhead({ maxConcurrent: 2 });

      // Start 2 long-running tasks
      const task1 = bulkhead.execute(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'done';
      });

      const task2 = bulkhead.execute(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'done';
      });

      // Queue one task
      const task3Promise = bulkhead.execute(async () => 'queued');

      // Wait a bit for tasks to start
      await new Promise((resolve) => setTimeout(resolve, 10));

      const metrics = bulkhead.getMetrics();

      expect(metrics.currentExecutions).toBe(2);
      expect(metrics.queuedExecutions).toBe(1);
      expect(metrics.capacity).toBe(2);
      expect(metrics.utilization).toBe(1.0);

      // Cleanup
      await Promise.all([task1, task2, task3Promise]);
    });
  });

  describe('withTimeout', () => {
    test('should resolve if promise completes in time', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeout(promise, 100);

      expect(result).toBe('success');
    });

    test('should reject if promise times out', async () => {
      const promise = new Promise((resolve) => setTimeout(() => resolve('late'), 200));

      await expect(withTimeout(promise, 50, 'Custom timeout')).rejects.toThrow('Custom timeout');
    });

    test('should use default error message', async () => {
      const promise = new Promise((resolve) => setTimeout(() => resolve('late'), 200));

      await expect(withTimeout(promise, 50)).rejects.toThrow('Operation timed out');
    });

    test('should handle rejected promises', async () => {
      const promise = Promise.reject(new Error('promise error'));

      await expect(withTimeout(promise, 100)).rejects.toThrow('promise error');
    });
  });

  describe('withCache', () => {
    test('should cache result for TTL duration', async () => {
      const mockFn = jest.fn().mockResolvedValue('data');
      const cachedFn = withCache(mockFn, 1000);

      // First call
      const result1 = await cachedFn();
      expect(result1).toBe('data');
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Second call within TTL - should use cache
      const result2 = await cachedFn();
      expect(result2).toBe('data');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should refetch after TTL expires', async () => {
      const mockFn = jest.fn().mockResolvedValue('data');
      const cachedFn = withCache(mockFn, 50); // 50ms TTL

      // First call
      await cachedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should refetch
      await cachedFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should cache different values over time', async () => {
      const mockFn = jest
        .fn()
        .mockResolvedValueOnce('data1')
        .mockResolvedValueOnce('data2');

      const cachedFn = withCache(mockFn, 50);

      // First call
      const result1 = await cachedFn();
      expect(result1).toBe('data1');

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Second call after expiry
      const result2 = await cachedFn();
      expect(result2).toBe('data2');

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should not cache errors', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('error'))
        .mockResolvedValueOnce('success');

      const cachedFn = withCache(mockFn, 1000);

      // First call fails
      await expect(cachedFn()).rejects.toThrow('error');

      // Second call should try again (not cached)
      const result = await cachedFn();
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration: Combined Resilience', () => {
    test('should combine circuit breaker, retry, and fallback', async () => {
      const fallbackData = { fallback: true };
      const config: ResilienceConfig = {
        circuitBreaker: {
          failureThreshold: 3,
          minimumRequestVolume: 0,
        },
        retry: {
          maxAttempts: 2,
          baseDelay: 10,
          isRetryable: () => true,
        },
        fallback: async () => fallbackData,
      };

      const executor = createResilientExecutor(config);
      const mockFn = jest.fn().mockRejectedValue(new Error('service down'));

      // Should try 2 times (retry), then use fallback
      const result = await executor(mockFn, 'testOp');

      expect(result).toEqual(fallbackData);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should prevent retry when circuit is open', async () => {
      const config: ResilienceConfig = {
        circuitBreaker: {
          failureThreshold: 1, // Open after just 1 failure
          minimumRequestVolume: 0,
          errorThresholdPercentage: 1.0, // Only open on consecutive failures
        },
        retry: {
          maxAttempts: 3,
          baseDelay: 10,
          isRetryable: () => true,
        },
      };

      const executor = createResilientExecutor(config);
      const mockFn = jest.fn().mockRejectedValue(new Error('fail'));

      // First execution with retries (3 attempts total)
      // All 3 attempts fail, circuit breaker records 1 failure (the retry block failed)
      await expect(executor(mockFn, 'testOp')).rejects.toThrow();
      // Circuit now opens (failureThreshold = 1)

      // Second attempt - circuit is open, no function call
      await expect(executor(mockFn, 'testOp')).rejects.toThrow(CircuitBreakerError);

      // Should have been called:
      // First executor call: 3 times (maxAttempts = 3)
      // Second executor call: 0 times (circuit open, doesn't reach retry logic)
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });
});

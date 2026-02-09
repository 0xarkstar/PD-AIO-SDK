/**
 * MetricsTrackerMixin Unit Tests
 *
 * Tests the MetricsTrackerMixin factory function that adds API metrics
 * collection and reporting capabilities.
 */

import {
  MetricsTrackerMixin,
  type IMetricsMixinBase,
} from '../../src/adapters/base/mixins/MetricsTrackerMixin.js';
import { CircuitBreaker } from '../../src/core/CircuitBreaker.js';
import type { Constructor } from '../../src/adapters/base/mixins/LoggerMixin.js';

// Minimal base class implementing IMetricsMixinBase
class TestBase implements IMetricsMixinBase {
  readonly id: string;
  readonly circuitBreaker: CircuitBreaker;

  constructor(id = 'test-exchange') {
    this.id = id;
    this.circuitBreaker = new CircuitBreaker();
  }
}

// Apply mixin
const TestWithMetrics = MetricsTrackerMixin(TestBase as Constructor<TestBase>);

describe('MetricsTrackerMixin', () => {
  describe('initial state', () => {
    test('initializes with zero counters', () => {
      const instance = new TestWithMetrics();

      expect(instance.metrics.totalRequests).toBe(0);
      expect(instance.metrics.successfulRequests).toBe(0);
      expect(instance.metrics.failedRequests).toBe(0);
      expect(instance.metrics.rateLimitHits).toBe(0);
      expect(instance.metrics.averageLatency).toBe(0);
    });

    test('initializes with empty endpoint stats', () => {
      const instance = new TestWithMetrics();
      expect(instance.metrics.endpointStats.size).toBe(0);
    });

    test('records startedAt timestamp', () => {
      const before = Date.now();
      const instance = new TestWithMetrics();
      const after = Date.now();

      expect(instance.metrics.startedAt).toBeGreaterThanOrEqual(before);
      expect(instance.metrics.startedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('updateEndpointMetrics()', () => {
    test('creates new endpoint stats on first call', () => {
      const instance = new TestWithMetrics();

      instance.updateEndpointMetrics('GET:/api/markets', 100, false);

      const stats = instance.metrics.endpointStats.get('GET:/api/markets');
      expect(stats).toBeDefined();
      expect(stats!.endpoint).toBe('GET:/api/markets');
      expect(stats!.count).toBe(1);
      expect(stats!.totalLatency).toBe(100);
      expect(stats!.errors).toBe(0);
      expect(stats!.minLatency).toBe(100);
      expect(stats!.maxLatency).toBe(100);
    });

    test('accumulates stats on subsequent calls', () => {
      const instance = new TestWithMetrics();

      instance.updateEndpointMetrics('GET:/api/markets', 100, false);
      instance.updateEndpointMetrics('GET:/api/markets', 200, false);
      instance.updateEndpointMetrics('GET:/api/markets', 150, false);

      const stats = instance.metrics.endpointStats.get('GET:/api/markets');
      expect(stats!.count).toBe(3);
      expect(stats!.totalLatency).toBe(450);
      expect(stats!.minLatency).toBe(100);
      expect(stats!.maxLatency).toBe(200);
      expect(stats!.errors).toBe(0);
    });

    test('tracks errors', () => {
      const instance = new TestWithMetrics();

      instance.updateEndpointMetrics('POST:/api/orders', 100, false);
      instance.updateEndpointMetrics('POST:/api/orders', 200, true);
      instance.updateEndpointMetrics('POST:/api/orders', 150, true);

      const stats = instance.metrics.endpointStats.get('POST:/api/orders');
      expect(stats!.count).toBe(3);
      expect(stats!.errors).toBe(2);
    });

    test('tracks min/max latency correctly', () => {
      const instance = new TestWithMetrics();

      instance.updateEndpointMetrics('GET:/api/ticker', 500, false);
      instance.updateEndpointMetrics('GET:/api/ticker', 50, false);
      instance.updateEndpointMetrics('GET:/api/ticker', 250, false);

      const stats = instance.metrics.endpointStats.get('GET:/api/ticker');
      expect(stats!.minLatency).toBe(50);
      expect(stats!.maxLatency).toBe(500);
    });

    test('updates lastRequestAt', () => {
      const instance = new TestWithMetrics();
      const before = Date.now();

      instance.updateEndpointMetrics('GET:/api/markets', 100, false);

      const stats = instance.metrics.endpointStats.get('GET:/api/markets');
      expect(stats!.lastRequestAt).toBeGreaterThanOrEqual(before);
    });

    test('tracks multiple endpoints independently', () => {
      const instance = new TestWithMetrics();

      instance.updateEndpointMetrics('GET:/api/markets', 100, false);
      instance.updateEndpointMetrics('POST:/api/orders', 200, false);
      instance.updateEndpointMetrics('GET:/api/markets', 150, false);

      expect(instance.metrics.endpointStats.size).toBe(2);

      const marketsStats = instance.metrics.endpointStats.get('GET:/api/markets');
      expect(marketsStats!.count).toBe(2);

      const ordersStats = instance.metrics.endpointStats.get('POST:/api/orders');
      expect(ordersStats!.count).toBe(1);
    });
  });

  describe('updateAverageLatency()', () => {
    test('calculates rolling average', () => {
      const instance = new TestWithMetrics();

      // First request: avg = 100
      instance.metrics.totalRequests = 1;
      instance.updateAverageLatency(100);
      expect(instance.metrics.averageLatency).toBe(100);

      // Second request: avg = (100 * 1 + 200) / 2 = 150
      instance.metrics.totalRequests = 2;
      instance.updateAverageLatency(200);
      expect(instance.metrics.averageLatency).toBe(150);

      // Third request: avg = (150 * 2 + 300) / 3 = 200
      instance.metrics.totalRequests = 3;
      instance.updateAverageLatency(300);
      expect(instance.metrics.averageLatency).toBe(200);
    });

    test('handles single request', () => {
      const instance = new TestWithMetrics();
      instance.metrics.totalRequests = 1;
      instance.updateAverageLatency(42);
      expect(instance.metrics.averageLatency).toBe(42);
    });
  });

  describe('getMetrics()', () => {
    test('returns metrics snapshot', () => {
      const instance = new TestWithMetrics();
      instance.metrics.totalRequests = 100;
      instance.metrics.successfulRequests = 95;
      instance.metrics.failedRequests = 5;

      const snapshot = instance.getMetrics();

      expect(snapshot.totalRequests).toBe(100);
      expect(snapshot.successfulRequests).toBe(95);
      expect(snapshot.failedRequests).toBe(5);
      expect(snapshot.successRate).toBe(0.95);
      expect(snapshot.errorRate).toBe(0.05);
    });

    test('returns snapshot with zero requests', () => {
      const instance = new TestWithMetrics();
      const snapshot = instance.getMetrics();

      expect(snapshot.totalRequests).toBe(0);
      expect(snapshot.successRate).toBe(0);
      expect(snapshot.errorRate).toBe(0);
    });

    test('includes endpoint stats in snapshot', () => {
      const instance = new TestWithMetrics();
      instance.metrics.totalRequests = 10;
      instance.updateEndpointMetrics('GET:/api/markets', 100, false);
      instance.updateEndpointMetrics('POST:/api/orders', 200, true);

      const snapshot = instance.getMetrics();
      expect(snapshot.endpoints).toHaveLength(2);
    });
  });

  describe('getCircuitBreakerMetrics()', () => {
    test('delegates to circuit breaker', () => {
      const instance = new TestWithMetrics();
      const cbMetrics = instance.getCircuitBreakerMetrics();

      expect(cbMetrics).toBeDefined();
      expect(typeof cbMetrics.state).toBe('string');
    });
  });

  describe('getCircuitBreakerState()', () => {
    test('returns current circuit breaker state', () => {
      const instance = new TestWithMetrics();
      const state = instance.getCircuitBreakerState();

      expect(state).toBe('CLOSED');
    });
  });

  describe('resetMetrics()', () => {
    test('resets all counters to zero', () => {
      const instance = new TestWithMetrics();
      instance.metrics.totalRequests = 100;
      instance.metrics.successfulRequests = 95;
      instance.metrics.failedRequests = 5;
      instance.metrics.rateLimitHits = 3;
      instance.metrics.averageLatency = 150;
      instance.updateEndpointMetrics('GET:/api/markets', 100, false);

      instance.resetMetrics();

      expect(instance.metrics.totalRequests).toBe(0);
      expect(instance.metrics.successfulRequests).toBe(0);
      expect(instance.metrics.failedRequests).toBe(0);
      expect(instance.metrics.rateLimitHits).toBe(0);
      expect(instance.metrics.averageLatency).toBe(0);
      expect(instance.metrics.endpointStats.size).toBe(0);
    });

    test('sets lastResetAt timestamp', () => {
      const instance = new TestWithMetrics();
      const before = Date.now();

      instance.resetMetrics();

      expect(instance.metrics.lastResetAt).toBeGreaterThanOrEqual(before);
    });
  });

  describe('trackRateLimitHit()', () => {
    test('increments rate limit counter', () => {
      const instance = new TestWithMetrics();

      expect(instance.metrics.rateLimitHits).toBe(0);

      instance.trackRateLimitHit();
      expect(instance.metrics.rateLimitHits).toBe(1);

      instance.trackRateLimitHit();
      instance.trackRateLimitHit();
      expect(instance.metrics.rateLimitHits).toBe(3);
    });
  });

  describe('mixin composition', () => {
    test('preserves base class properties', () => {
      const instance = new TestWithMetrics('my-exchange');
      expect(instance.id).toBe('my-exchange');
      expect(instance.circuitBreaker).toBeInstanceOf(CircuitBreaker);
    });
  });
});

/**
 * API Metrics Tracking Unit Tests
 */

import {
  createMetricsSnapshot,
  getTopEndpoints,
  getSlowestEndpoints,
  getMostErrorProneEndpoints,
  type APIMetrics,
  type EndpointMetrics,
} from '../../src/types/metrics.js';

describe('Metrics Utilities', () => {
  describe('createMetricsSnapshot', () => {
    test('creates snapshot with correct success and error rates', () => {
      const metrics: APIMetrics = {
        totalRequests: 100,
        successfulRequests: 95,
        failedRequests: 5,
        rateLimitHits: 2,
        averageLatency: 125.5,
        endpointStats: new Map(),
        startedAt: Date.now() - 60000, // 1 minute ago
      };

      const snapshot = createMetricsSnapshot(metrics);

      expect(snapshot.totalRequests).toBe(100);
      expect(snapshot.successfulRequests).toBe(95);
      expect(snapshot.failedRequests).toBe(5);
      expect(snapshot.rateLimitHits).toBe(2);
      expect(snapshot.averageLatency).toBe(125.5);
      expect(snapshot.successRate).toBe(0.95);
      expect(snapshot.errorRate).toBe(0.05);
      expect(snapshot.collectionDuration).toBeGreaterThanOrEqual(60000);
    });

    test('handles zero requests gracefully', () => {
      const metrics: APIMetrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rateLimitHits: 0,
        averageLatency: 0,
        endpointStats: new Map(),
        startedAt: Date.now(),
      };

      const snapshot = createMetricsSnapshot(metrics);

      expect(snapshot.successRate).toBe(0);
      expect(snapshot.errorRate).toBe(0);
      expect(snapshot.endpoints).toEqual([]);
    });

    test('includes endpoint statistics in snapshot', () => {
      const metrics: APIMetrics = {
        totalRequests: 50,
        successfulRequests: 48,
        failedRequests: 2,
        rateLimitHits: 0,
        averageLatency: 100,
        endpointStats: new Map([
          [
            'GET:/api/markets',
            {
              endpoint: 'GET:/api/markets',
              count: 30,
              totalLatency: 3000,
              errors: 1,
              minLatency: 80,
              maxLatency: 150,
            },
          ],
          [
            'POST:/api/orders',
            {
              endpoint: 'POST:/api/orders',
              count: 20,
              totalLatency: 2000,
              errors: 1,
              minLatency: 90,
              maxLatency: 120,
            },
          ],
        ]),
        startedAt: Date.now(),
      };

      const snapshot = createMetricsSnapshot(metrics);

      expect(snapshot.endpoints).toHaveLength(2);
      expect(snapshot.endpoints[0]).toMatchObject({
        endpoint: 'GET:/api/markets',
        count: 30,
        averageLatency: 100,
        errorRate: 1 / 30,
      });
      expect(snapshot.endpoints[1]).toMatchObject({
        endpoint: 'POST:/api/orders',
        count: 20,
        averageLatency: 100,
        errorRate: 1 / 20,
      });
    });

    test('sorts endpoints by request count descending', () => {
      const metrics: APIMetrics = {
        totalRequests: 60,
        successfulRequests: 60,
        failedRequests: 0,
        rateLimitHits: 0,
        averageLatency: 100,
        endpointStats: new Map([
          ['GET:/api/a', { endpoint: 'GET:/api/a', count: 10, totalLatency: 1000, errors: 0, minLatency: 100, maxLatency: 100 }],
          ['GET:/api/b', { endpoint: 'GET:/api/b', count: 30, totalLatency: 3000, errors: 0, minLatency: 100, maxLatency: 100 }],
          ['GET:/api/c', { endpoint: 'GET:/api/c', count: 20, totalLatency: 2000, errors: 0, minLatency: 100, maxLatency: 100 }],
        ]),
        startedAt: Date.now(),
      };

      const snapshot = createMetricsSnapshot(metrics);

      expect(snapshot.endpoints[0].endpoint).toBe('GET:/api/b'); // 30 requests
      expect(snapshot.endpoints[1].endpoint).toBe('GET:/api/c'); // 20 requests
      expect(snapshot.endpoints[2].endpoint).toBe('GET:/api/a'); // 10 requests
    });
  });

  describe('getTopEndpoints', () => {
    test('returns top N endpoints by request count', () => {
      const metrics: APIMetrics = {
        totalRequests: 100,
        successfulRequests: 100,
        failedRequests: 0,
        rateLimitHits: 0,
        averageLatency: 100,
        endpointStats: new Map([
          ['GET:/api/a', { endpoint: 'GET:/api/a', count: 50, totalLatency: 5000, errors: 0, minLatency: 100, maxLatency: 100 }],
          ['GET:/api/b', { endpoint: 'GET:/api/b', count: 30, totalLatency: 3000, errors: 0, minLatency: 100, maxLatency: 100 }],
          ['GET:/api/c', { endpoint: 'GET:/api/c', count: 15, totalLatency: 1500, errors: 0, minLatency: 100, maxLatency: 100 }],
          ['GET:/api/d', { endpoint: 'GET:/api/d', count: 5, totalLatency: 500, errors: 0, minLatency: 100, maxLatency: 100 }],
        ]),
        startedAt: Date.now(),
      };

      const top2 = getTopEndpoints(metrics, 2);

      expect(top2).toHaveLength(2);
      expect(top2[0].endpoint).toBe('GET:/api/a');
      expect(top2[0].count).toBe(50);
      expect(top2[1].endpoint).toBe('GET:/api/b');
      expect(top2[1].count).toBe(30);
    });

    test('defaults to top 10 if limit not specified', () => {
      const endpointStats = new Map<string, EndpointMetrics>();
      for (let i = 0; i < 15; i++) {
        endpointStats.set(`GET:/api/endpoint${i}`, {
          endpoint: `GET:/api/endpoint${i}`,
          count: 15 - i, // Descending order
          totalLatency: (15 - i) * 100,
          errors: 0,
          minLatency: 100,
          maxLatency: 100,
        });
      }

      const metrics: APIMetrics = {
        totalRequests: 120,
        successfulRequests: 120,
        failedRequests: 0,
        rateLimitHits: 0,
        averageLatency: 100,
        endpointStats,
        startedAt: Date.now(),
      };

      const top = getTopEndpoints(metrics);

      expect(top).toHaveLength(10);
      expect(top[0].count).toBe(15);
      expect(top[9].count).toBe(6);
    });

    test('returns all endpoints if fewer than limit', () => {
      const metrics: APIMetrics = {
        totalRequests: 30,
        successfulRequests: 30,
        failedRequests: 0,
        rateLimitHits: 0,
        averageLatency: 100,
        endpointStats: new Map([
          ['GET:/api/a', { endpoint: 'GET:/api/a', count: 20, totalLatency: 2000, errors: 0, minLatency: 100, maxLatency: 100 }],
          ['GET:/api/b', { endpoint: 'GET:/api/b', count: 10, totalLatency: 1000, errors: 0, minLatency: 100, maxLatency: 100 }],
        ]),
        startedAt: Date.now(),
      };

      const top10 = getTopEndpoints(metrics, 10);

      expect(top10).toHaveLength(2);
    });
  });

  describe('getSlowestEndpoints', () => {
    test('returns endpoints sorted by average latency', () => {
      const metrics: APIMetrics = {
        totalRequests: 100,
        successfulRequests: 100,
        failedRequests: 0,
        rateLimitHits: 0,
        averageLatency: 150,
        endpointStats: new Map([
          ['GET:/api/fast', { endpoint: 'GET:/api/fast', count: 10, totalLatency: 500, errors: 0, minLatency: 50, maxLatency: 50 }],
          ['GET:/api/slow', { endpoint: 'GET:/api/slow', count: 10, totalLatency: 5000, errors: 0, minLatency: 500, maxLatency: 500 }],
          ['GET:/api/medium', { endpoint: 'GET:/api/medium', count: 10, totalLatency: 1500, errors: 0, minLatency: 150, maxLatency: 150 }],
        ]),
        startedAt: Date.now(),
      };

      const slowest = getSlowestEndpoints(metrics, 3);

      expect(slowest).toHaveLength(3);
      expect(slowest[0].endpoint).toBe('GET:/api/slow');
      expect(slowest[0].averageLatency).toBe(500);
      expect(slowest[1].endpoint).toBe('GET:/api/medium');
      expect(slowest[1].averageLatency).toBe(150);
      expect(slowest[2].endpoint).toBe('GET:/api/fast');
      expect(slowest[2].averageLatency).toBe(50);
    });

    test('includes request count in results', () => {
      const metrics: APIMetrics = {
        totalRequests: 50,
        successfulRequests: 50,
        failedRequests: 0,
        rateLimitHits: 0,
        averageLatency: 100,
        endpointStats: new Map([
          ['GET:/api/a', { endpoint: 'GET:/api/a', count: 25, totalLatency: 5000, errors: 0, minLatency: 200, maxLatency: 200 }],
          ['GET:/api/b', { endpoint: 'GET:/api/b', count: 25, totalLatency: 2500, errors: 0, minLatency: 100, maxLatency: 100 }],
        ]),
        startedAt: Date.now(),
      };

      const slowest = getSlowestEndpoints(metrics, 2);

      expect(slowest[0].count).toBe(25);
      expect(slowest[1].count).toBe(25);
    });

    test('handles zero-count endpoints', () => {
      const metrics: APIMetrics = {
        totalRequests: 10,
        successfulRequests: 10,
        failedRequests: 0,
        rateLimitHits: 0,
        averageLatency: 100,
        endpointStats: new Map([
          ['GET:/api/a', { endpoint: 'GET:/api/a', count: 0, totalLatency: 0, errors: 0, minLatency: Infinity, maxLatency: 0 }],
          ['GET:/api/b', { endpoint: 'GET:/api/b', count: 10, totalLatency: 1000, errors: 0, minLatency: 100, maxLatency: 100 }],
        ]),
        startedAt: Date.now(),
      };

      const slowest = getSlowestEndpoints(metrics, 2);

      expect(slowest[0].averageLatency).toBe(100);
      expect(slowest[1].averageLatency).toBe(0);
    });
  });

  describe('getMostErrorProneEndpoints', () => {
    test('returns endpoints sorted by error rate', () => {
      const metrics: APIMetrics = {
        totalRequests: 100,
        successfulRequests: 85,
        failedRequests: 15,
        rateLimitHits: 0,
        averageLatency: 100,
        endpointStats: new Map([
          ['GET:/api/reliable', { endpoint: 'GET:/api/reliable', count: 50, totalLatency: 5000, errors: 1, minLatency: 100, maxLatency: 100 }],
          ['GET:/api/flaky', { endpoint: 'GET:/api/flaky', count: 30, totalLatency: 3000, errors: 12, minLatency: 100, maxLatency: 100 }],
          ['GET:/api/unstable', { endpoint: 'GET:/api/unstable', count: 20, totalLatency: 2000, errors: 2, minLatency: 100, maxLatency: 100 }],
        ]),
        startedAt: Date.now(),
      };

      const errorProne = getMostErrorProneEndpoints(metrics, 3);

      expect(errorProne).toHaveLength(3);
      expect(errorProne[0].endpoint).toBe('GET:/api/flaky');
      expect(errorProne[0].errorRate).toBe(12 / 30); // 40%
      expect(errorProne[0].errors).toBe(12);
      expect(errorProne[0].total).toBe(30);

      expect(errorProne[1].endpoint).toBe('GET:/api/unstable');
      expect(errorProne[1].errorRate).toBe(2 / 20); // 10%

      expect(errorProne[2].endpoint).toBe('GET:/api/reliable');
      expect(errorProne[2].errorRate).toBe(1 / 50); // 2%
    });

    test('handles endpoints with no errors', () => {
      const metrics: APIMetrics = {
        totalRequests: 100,
        successfulRequests: 100,
        failedRequests: 0,
        rateLimitHits: 0,
        averageLatency: 100,
        endpointStats: new Map([
          ['GET:/api/a', { endpoint: 'GET:/api/a', count: 50, totalLatency: 5000, errors: 0, minLatency: 100, maxLatency: 100 }],
          ['GET:/api/b', { endpoint: 'GET:/api/b', count: 50, totalLatency: 5000, errors: 0, minLatency: 100, maxLatency: 100 }],
        ]),
        startedAt: Date.now(),
      };

      const errorProne = getMostErrorProneEndpoints(metrics, 2);

      expect(errorProne).toHaveLength(2);
      expect(errorProne[0].errorRate).toBe(0);
      expect(errorProne[1].errorRate).toBe(0);
    });

    test('includes error count and total in results', () => {
      const metrics: APIMetrics = {
        totalRequests: 50,
        successfulRequests: 45,
        failedRequests: 5,
        rateLimitHits: 0,
        averageLatency: 100,
        endpointStats: new Map([
          ['GET:/api/a', { endpoint: 'GET:/api/a', count: 25, totalLatency: 2500, errors: 3, minLatency: 100, maxLatency: 100 }],
          ['GET:/api/b', { endpoint: 'GET:/api/b', count: 25, totalLatency: 2500, errors: 2, minLatency: 100, maxLatency: 100 }],
        ]),
        startedAt: Date.now(),
      };

      const errorProne = getMostErrorProneEndpoints(metrics, 2);

      expect(errorProne[0].errors).toBe(3);
      expect(errorProne[0].total).toBe(25);
      expect(errorProne[1].errors).toBe(2);
      expect(errorProne[1].total).toBe(25);
    });
  });
});

describe('Metrics Integration', () => {
  test('endpoint stats structure is correct', () => {
    const stats: EndpointMetrics = {
      endpoint: 'GET:/api/test',
      count: 100,
      totalLatency: 10000,
      errors: 5,
      minLatency: 50,
      maxLatency: 250,
      lastRequestAt: Date.now(),
    };

    expect(stats).toMatchObject({
      endpoint: expect.any(String),
      count: expect.any(Number),
      totalLatency: expect.any(Number),
      errors: expect.any(Number),
      minLatency: expect.any(Number),
      maxLatency: expect.any(Number),
    });
  });

  test('metrics snapshot includes timestamp', () => {
    const beforeSnapshot = Date.now();

    const metrics: APIMetrics = {
      totalRequests: 10,
      successfulRequests: 10,
      failedRequests: 0,
      rateLimitHits: 0,
      averageLatency: 100,
      endpointStats: new Map(),
      startedAt: beforeSnapshot - 5000,
    };

    const snapshot = createMetricsSnapshot(metrics);
    const afterSnapshot = Date.now();

    expect(snapshot.timestamp).toBeGreaterThanOrEqual(beforeSnapshot);
    expect(snapshot.timestamp).toBeLessThanOrEqual(afterSnapshot);
  });

  test('collection duration calculates correctly', () => {
    const startedAt = Date.now() - 120000; // 2 minutes ago

    const metrics: APIMetrics = {
      totalRequests: 100,
      successfulRequests: 100,
      failedRequests: 0,
      rateLimitHits: 0,
      averageLatency: 100,
      endpointStats: new Map(),
      startedAt,
    };

    const snapshot = createMetricsSnapshot(metrics);

    expect(snapshot.collectionDuration).toBeGreaterThanOrEqual(120000);
    expect(snapshot.collectionDuration).toBeLessThanOrEqual(121000); // Allow 1s variance
  });

  test('average latency calculation in snapshot', () => {
    const metrics: APIMetrics = {
      totalRequests: 100,
      successfulRequests: 100,
      failedRequests: 0,
      rateLimitHits: 0,
      averageLatency: 123.456,
      endpointStats: new Map(),
      startedAt: Date.now(),
    };

    const snapshot = createMetricsSnapshot(metrics);

    expect(snapshot.averageLatency).toBe(123.456);
  });

  test('rate limit hits are tracked in snapshot', () => {
    const metrics: APIMetrics = {
      totalRequests: 100,
      successfulRequests: 90,
      failedRequests: 10,
      rateLimitHits: 5,
      averageLatency: 100,
      endpointStats: new Map(),
      startedAt: Date.now(),
    };

    const snapshot = createMetricsSnapshot(metrics);

    expect(snapshot.rateLimitHits).toBe(5);
  });
});

/**
 * HttpRequestMixin Unit Tests
 *
 * Tests the HttpRequestMixin factory function that adds HTTP request
 * capabilities with retry logic, circuit breaker, and metrics.
 */

import {
  HttpRequestMixin,
  type IHttpRequestMixinBase,
} from '../../src/adapters/base/mixins/HttpRequestMixin.js';
import { CircuitBreaker } from '../../src/core/CircuitBreaker.js';
import { PerpDEXError } from '../../src/types/errors.js';
import type { APIMetrics } from '../../src/types/metrics.js';
import type { ExchangeConfig } from '../../src/types/index.js';
import type { Constructor } from '../../src/adapters/base/mixins/LoggerMixin.js';

// Minimal base class implementing IHttpRequestMixinBase
class TestBase implements IHttpRequestMixinBase {
  readonly id = 'test-exchange';
  readonly config: ExchangeConfig;
  readonly circuitBreaker: CircuitBreaker;
  readonly prometheusMetrics = undefined;
  readonly metrics: APIMetrics;
  readonly timers: Set<NodeJS.Timeout> = new Set();
  readonly abortControllers: Set<AbortController> = new Set();

  constructor(config: Partial<ExchangeConfig> = {}) {
    this.config = { timeout: 5000, testnet: false, debug: false, ...config };
    this.circuitBreaker = new CircuitBreaker();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitHits: 0,
      averageLatency: 0,
      endpointStats: new Map(),
      startedAt: Date.now(),
    };
  }

  debug(_message: string, _meta?: Record<string, unknown>): void {}
  updateEndpointMetrics(_key: string, _latency: number, _isError: boolean): void {}
  updateAverageLatency(_latency: number): void {}

  attachCorrelationId(error: unknown, correlationId: string): Error {
    if (error instanceof PerpDEXError) {
      error.withCorrelationId(correlationId);
      return error;
    }
    const message = error instanceof Error ? error.message : String(error);
    return new PerpDEXError(message, 'REQUEST_ERROR', this.id, error).withCorrelationId(
      correlationId
    );
  }
}

// Apply mixin
const TestWithHttp = HttpRequestMixin(TestBase as Constructor<TestBase>);

// Helper to create mock fetch responses
function mockFetchResponse(status: number, body: unknown, statusText = 'OK'): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: () => Promise.resolve(body),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    text: jest.fn(),
    bytes: jest.fn(),
  } as unknown as Response;
}

describe('HttpRequestMixin', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    jest.useFakeTimers({ advanceTimers: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
  });

  describe('request() - successful requests', () => {
    test('makes GET request and returns parsed JSON', async () => {
      const responseData = { markets: ['BTC', 'ETH'] };
      globalThis.fetch = jest.fn().mockResolvedValue(mockFetchResponse(200, responseData));

      const instance = new TestWithHttp();
      const result = await instance.request<typeof responseData>('GET', 'https://api.test.com/markets');

      expect(result).toEqual(responseData);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    test('makes POST request with body', async () => {
      const requestBody = { symbol: 'BTC/USDT', amount: 1 };
      const responseData = { orderId: '123' };
      globalThis.fetch = jest.fn().mockResolvedValue(mockFetchResponse(200, responseData));

      const instance = new TestWithHttp();
      await instance.request('POST', 'https://api.test.com/orders', requestBody);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.test.com/orders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
    });

    test('includes default headers', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(mockFetchResponse(200, {}));

      const instance = new TestWithHttp();
      await instance.request('GET', 'https://api.test.com/test');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Correlation-ID': expect.any(String),
          }),
        })
      );
    });

    test('merges custom headers', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(mockFetchResponse(200, {}));

      const instance = new TestWithHttp();
      await instance.request('GET', 'https://api.test.com/test', undefined, {
        'X-API-Key': 'test-key',
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'test-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    test('tracks successful request metrics', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(mockFetchResponse(200, {}));

      const instance = new TestWithHttp();
      const updateEndpointSpy = jest.spyOn(instance, 'updateEndpointMetrics');
      const updateAvgSpy = jest.spyOn(instance, 'updateAverageLatency');

      await instance.request('GET', 'https://api.test.com/markets');

      expect(instance.metrics.totalRequests).toBe(1);
      expect(instance.metrics.successfulRequests).toBe(1);
      expect(updateEndpointSpy).toHaveBeenCalledWith(
        expect.stringContaining('GET:'),
        expect.any(Number),
        false
      );
      expect(updateAvgSpy).toHaveBeenCalled();
    });
  });

  describe('request() - retry logic', () => {
    test('retries on 500 status', async () => {
      globalThis.fetch = jest
        .fn()
        .mockResolvedValueOnce(mockFetchResponse(500, {}, 'Internal Server Error'))
        .mockResolvedValueOnce(mockFetchResponse(200, { success: true }));

      const instance = new TestWithHttp();
      const result = await instance.request<{ success: boolean }>('GET', 'https://api.test.com/markets');

      expect(result).toEqual({ success: true });
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    test('retries on 429 status', async () => {
      globalThis.fetch = jest
        .fn()
        .mockResolvedValueOnce(mockFetchResponse(429, {}, 'Too Many Requests'))
        .mockResolvedValueOnce(mockFetchResponse(200, { ok: true }));

      const instance = new TestWithHttp();
      const result = await instance.request<{ ok: boolean }>('GET', 'https://api.test.com/test');

      expect(result).toEqual({ ok: true });
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    test('retries on 502, 503, 504 status', async () => {
      for (const status of [502, 503, 504]) {
        jest.restoreAllMocks();
        globalThis.fetch = jest
          .fn()
          .mockResolvedValueOnce(mockFetchResponse(status, {}, `Error ${status}`))
          .mockResolvedValueOnce(mockFetchResponse(200, { ok: true }));

        const instance = new TestWithHttp();
        const result = await instance.request<{ ok: boolean }>('GET', 'https://api.test.com/test');
        expect(result).toEqual({ ok: true });
      }
    });

    test('does not retry on 400 status', async () => {
      globalThis.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(400, {}, 'Bad Request'));

      const instance = new TestWithHttp();

      await expect(
        instance.request('GET', 'https://api.test.com/test')
      ).rejects.toThrow('HTTP 400');

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    test('does not retry on 401 status', async () => {
      globalThis.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(401, {}, 'Unauthorized'));

      const instance = new TestWithHttp();

      await expect(
        instance.request('GET', 'https://api.test.com/test')
      ).rejects.toThrow('HTTP 401');

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    test('gives up after max attempts (3)', async () => {
      globalThis.fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(500, {}, 'Internal Server Error'));

      const instance = new TestWithHttp();

      await expect(
        instance.request('GET', 'https://api.test.com/test')
      ).rejects.toThrow();

      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    });

    test('retries on network errors', async () => {
      const networkError = new Error('fetch failed');
      globalThis.fetch = jest
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(mockFetchResponse(200, { recovered: true }));

      const instance = new TestWithHttp();
      const result = await instance.request<{ recovered: boolean }>('GET', 'https://api.test.com/test');

      expect(result).toEqual({ recovered: true });
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    test('tracks failed request metrics on retry', async () => {
      globalThis.fetch = jest
        .fn()
        .mockResolvedValueOnce(mockFetchResponse(500, {}, 'Error'))
        .mockResolvedValueOnce(mockFetchResponse(200, {}));

      const instance = new TestWithHttp();
      await instance.request('GET', 'https://api.test.com/test');

      // First attempt fails, second succeeds
      expect(instance.metrics.failedRequests).toBe(1);
      expect(instance.metrics.successfulRequests).toBe(1);
      // totalRequests: 2 (one per attempt)
      expect(instance.metrics.totalRequests).toBe(2);
    });
  });

  describe('request() - abort signal', () => {
    test('registers and cleans up abort controller', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(mockFetchResponse(200, {}));

      const instance = new TestWithHttp();
      await instance.request('GET', 'https://api.test.com/test');

      // After successful request, abort controller should be cleaned up
      expect(instance.abortControllers.size).toBe(0);
    });
  });

  describe('registerTimer / unregisterTimer', () => {
    test('registers a timer', () => {
      const instance = new TestWithHttp();
      const timer = setTimeout(() => {}, 1000);

      instance.registerTimer(timer);
      expect(instance.timers.has(timer)).toBe(true);

      clearTimeout(timer);
    });

    test('unregisters and clears a timer', () => {
      const instance = new TestWithHttp();
      const timer = setTimeout(() => {}, 1000);

      instance.registerTimer(timer);
      instance.unregisterTimer(timer);

      expect(instance.timers.has(timer)).toBe(false);
    });
  });

  describe('registerInterval / unregisterInterval', () => {
    test('registers an interval', () => {
      const instance = new TestWithHttp();
      const interval = setInterval(() => {}, 1000);

      instance.registerInterval(interval);
      expect(instance.intervals.has(interval)).toBe(true);

      clearInterval(interval);
    });

    test('unregisters and clears an interval', () => {
      const instance = new TestWithHttp();
      const interval = setInterval(() => {}, 1000);

      instance.registerInterval(interval);
      instance.unregisterInterval(interval);

      expect(instance.intervals.has(interval)).toBe(false);
    });
  });

  describe('extractEndpoint()', () => {
    test('extracts pathname from valid URL', () => {
      const instance = new TestWithHttp();
      expect(instance.extractEndpoint('https://api.test.com/api/v1/markets')).toBe(
        '/api/v1/markets'
      );
    });

    test('returns raw string for invalid URL', () => {
      const instance = new TestWithHttp();
      expect(instance.extractEndpoint('not-a-url')).toBe('not-a-url');
    });

    test('handles URL with query params', () => {
      const instance = new TestWithHttp();
      expect(
        instance.extractEndpoint('https://api.test.com/api/v1/orders?symbol=BTC')
      ).toBe('/api/v1/orders');
    });
  });

  describe('debug logging', () => {
    test('logs request details', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(mockFetchResponse(200, {}));

      const instance = new TestWithHttp();
      const debugSpy = jest.spyOn(instance, 'debug');

      await instance.request('GET', 'https://api.test.com/markets');

      // Should log at least the request start and completion
      expect(debugSpy).toHaveBeenCalledTimes(2);
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Request'),
        expect.objectContaining({
          method: 'GET',
          correlationId: expect.any(String),
        })
      );
    });
  });
});

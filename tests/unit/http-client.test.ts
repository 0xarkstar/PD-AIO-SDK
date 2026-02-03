/**
 * HTTPClient Tests
 *
 * Tests for the unified HTTP client with retry, circuit breaker, and error handling
 */

import { HTTPClient, HTTPClientConfig } from '../../src/core/http/HTTPClient.js';
import { PerpDEXError, NetworkError, RateLimitError } from '../../src/types/errors.js';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('HTTPClient', () => {
  const defaultConfig: HTTPClientConfig = {
    baseUrl: 'https://api.example.com',
    exchange: 'test-exchange',
    timeout: 5000,
  };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('constructor', () => {
    test('creates client with minimal config', () => {
      const client = new HTTPClient({
        baseUrl: 'https://api.test.com',
        exchange: 'test',
      });
      expect(client).toBeInstanceOf(HTTPClient);
    });

    test('creates client with full config', () => {
      const client = new HTTPClient({
        baseUrl: 'https://api.test.com',
        exchange: 'test',
        timeout: 10000,
        retry: {
          maxAttempts: 5,
          initialDelay: 500,
          maxDelay: 5000,
          multiplier: 1.5,
          retryableStatuses: [500, 502, 503],
        },
        circuitBreaker: {
          enabled: true,
          failureThreshold: 3,
          successThreshold: 1,
          resetTimeout: 30000,
        },
        defaultHeaders: {
          'X-Custom-Header': 'value',
        },
      });
      expect(client).toBeInstanceOf(HTTPClient);
    });

    test('creates client with circuit breaker disabled', () => {
      const client = new HTTPClient({
        baseUrl: 'https://api.test.com',
        exchange: 'test',
        circuitBreaker: {
          enabled: false,
        },
      });
      expect(client).toBeInstanceOf(HTTPClient);
      expect(client.getCircuitBreakerState()).toBeNull();
    });
  });

  describe('HTTP methods', () => {
    test('GET request returns data', async () => {
      const responseData = { success: true, data: [1, 2, 3] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      });

      const client = new HTTPClient(defaultConfig);
      const result = await client.get('/test');

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    test('POST request with body', async () => {
      const responseData = { id: 123 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      });

      const client = new HTTPClient(defaultConfig);
      const result = await client.post('/create', {
        body: { name: 'test', value: 42 },
      });

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/create',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test', value: 42 }),
        })
      );
    });

    test('POST request with string body', async () => {
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      });

      const client = new HTTPClient(defaultConfig);
      await client.post('/raw', {
        body: 'raw string body',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/raw',
        expect.objectContaining({
          body: 'raw string body',
        })
      );
    });

    test('PUT request', async () => {
      const responseData = { updated: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      });

      const client = new HTTPClient(defaultConfig);
      const result = await client.put('/update/1', {
        body: { name: 'updated' },
      });

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/update/1',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });

    test('DELETE request', async () => {
      const responseData = { deleted: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      });

      const client = new HTTPClient(defaultConfig);
      const result = await client.delete('/item/1');

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/item/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    test('request with custom headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const client = new HTTPClient({
        ...defaultConfig,
        defaultHeaders: { 'X-Default': 'default-value' },
      });

      await client.get('/test', {
        headers: { 'X-Custom': 'custom-value' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Default': 'default-value',
            'X-Custom': 'custom-value',
          }),
        })
      );
    });

    test('request with custom timeout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const client = new HTTPClient(defaultConfig);
      await client.get('/test', { timeout: 1000 });

      // Verify AbortController was set up (implicitly through signal)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });

  describe('error handling', () => {
    test('handles 400 Bad Request', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid parameter' }),
        headers: new Headers(),
      });

      const client = new HTTPClient({
        ...defaultConfig,
        retry: { maxAttempts: 1 },
      });

      await expect(client.get('/test')).rejects.toThrow(PerpDEXError);
      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    });

    test('handles 401 Unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid API key' }),
        headers: new Headers(),
      });

      const client = new HTTPClient({
        ...defaultConfig,
        retry: { maxAttempts: 1 },
      });

      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    test('handles 403 Forbidden', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({}),
        headers: new Headers(),
      });

      const client = new HTTPClient({
        ...defaultConfig,
        retry: { maxAttempts: 1 },
      });

      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });

    test('handles 404 Not Found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
        headers: new Headers(),
      });

      const client = new HTTPClient({
        ...defaultConfig,
        retry: { maxAttempts: 1 },
      });

      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    test('handles 429 Rate Limit with Retry-After header', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' }),
        headers: new Headers({ 'Retry-After': '60' }),
      });

      const client = new HTTPClient({
        ...defaultConfig,
        retry: { maxAttempts: 1 },
      });

      try {
        await client.get('/test');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBe(60);
      }
    });

    test('handles 429 Rate Limit without Retry-After header', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({}),
        headers: new Headers(),
      });

      const client = new HTTPClient({
        ...defaultConfig,
        retry: { maxAttempts: 1 },
      });

      await expect(client.get('/test')).rejects.toBeInstanceOf(RateLimitError);
    });

    test('handles 500 Server Error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
        headers: new Headers(),
      });

      const client = new HTTPClient({
        ...defaultConfig,
        retry: { maxAttempts: 1 },
      });

      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'SERVER_ERROR',
      });
    });

    test('handles non-JSON error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Not JSON');
        },
        headers: new Headers(),
      });

      const client = new HTTPClient({
        ...defaultConfig,
        retry: { maxAttempts: 1 },
      });

      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'SERVER_ERROR',
      });
    });

    test('handles timeout error', async () => {
      mockFetch.mockImplementation(() => {
        const error = new Error('Aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const client = new HTTPClient({
        ...defaultConfig,
        timeout: 100,
        retry: { maxAttempts: 1 },
      });

      await expect(client.get('/test')).rejects.toBeInstanceOf(NetworkError);
      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'REQUEST_TIMEOUT',
      });
    });

    test('handles network error', async () => {
      mockFetch.mockRejectedValue(new Error('fetch failed: network error'));

      const client = new HTTPClient({
        ...defaultConfig,
        retry: { maxAttempts: 1 },
      });

      await expect(client.get('/test')).rejects.toBeInstanceOf(NetworkError);
      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
      });
    });

    test('rethrows unknown errors', async () => {
      const unknownError = { custom: 'error' };
      mockFetch.mockRejectedValue(unknownError);

      const client = new HTTPClient({
        ...defaultConfig,
        retry: { maxAttempts: 1 },
      });

      await expect(client.get('/test')).rejects.toEqual(unknownError);
    });
  });

  describe('retry logic', () => {
    test('retries on server error', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({}),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({}),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const client = new HTTPClient({
        ...defaultConfig,
        retry: {
          maxAttempts: 3,
          initialDelay: 10,
          maxDelay: 100,
          multiplier: 2,
        },
      });

      const result = await client.get('/test');

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('retries on network error', async () => {
      const networkError = new Error('network connection failed');
      mockFetch
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const client = new HTTPClient({
        ...defaultConfig,
        retry: {
          maxAttempts: 2,
          initialDelay: 10,
        },
      });

      const result = await client.get('/test');

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('does not retry on 400 errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid' }),
        headers: new Headers(),
      });

      const client = new HTTPClient({
        ...defaultConfig,
        retry: { maxAttempts: 3 },
      });

      await expect(client.get('/test')).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('does not retry on 401 errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
        headers: new Headers(),
      });

      const client = new HTTPClient({
        ...defaultConfig,
        retry: { maxAttempts: 3 },
      });

      await expect(client.get('/test')).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('respects skipRetry option', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: async () => ({}),
        headers: new Headers(),
      });

      const client = new HTTPClient({
        ...defaultConfig,
        retry: { maxAttempts: 3 },
      });

      await expect(client.get('/test', { skipRetry: true })).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('exhausts all retries then throws', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: async () => ({}),
        headers: new Headers(),
      });

      const client = new HTTPClient({
        ...defaultConfig,
        retry: {
          maxAttempts: 3,
          initialDelay: 10,
        },
      });

      await expect(client.get('/test')).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('calculates exponential backoff with max delay cap', async () => {
      const startTime = Date.now();
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: async () => ({}),
        headers: new Headers(),
      });

      const client = new HTTPClient({
        ...defaultConfig,
        retry: {
          maxAttempts: 3,
          initialDelay: 50,
          maxDelay: 100,
          multiplier: 2,
        },
      });

      await expect(client.get('/test')).rejects.toThrow();

      const elapsed = Date.now() - startTime;
      // Should have waited: 50ms + 100ms (capped from 100) = 150ms minimum
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });

  describe('circuit breaker', () => {
    test('circuit breaker state is accessible', () => {
      const client = new HTTPClient({
        ...defaultConfig,
        circuitBreaker: { enabled: true },
      });

      expect(client.getCircuitBreakerState()).toBe('CLOSED');
    });

    test('returns null when circuit breaker is disabled', () => {
      const client = new HTTPClient({
        ...defaultConfig,
        circuitBreaker: { enabled: false },
      });

      expect(client.getCircuitBreakerState()).toBeNull();
    });

    test('works without circuit breaker', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      const client = new HTTPClient({
        ...defaultConfig,
        circuitBreaker: { enabled: false },
      });

      const result = await client.get('/test');
      expect(result).toEqual({ data: 'test' });
    });
  });
});

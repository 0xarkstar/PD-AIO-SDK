/**
 * Unit Tests for ParadexHTTPClient
 *
 * Tests HTTP request wrapper with mocked fetch
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ParadexHTTPClient } from '../../src/adapters/paradex/ParadexHTTPClient.js';
import type { ParadexAuth } from '../../src/adapters/paradex/auth.js';
import { PerpDEXError } from '../../src/types/errors.js';

// Mock fetch globally
const globalFetch = global.fetch;

describe('ParadexHTTPClient', () => {
  let client: ParadexHTTPClient;
  let mockAuth: jest.Mocked<ParadexAuth>;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    // Create mock auth
    mockAuth = {
      sign: jest.fn(),
    } as any;

    // Mock auth.sign to return headers
    mockAuth.sign.mockResolvedValue({
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'test-api-key',
        'X-Timestamp': '1234567890',
      },
    });

    // Create HTTP client
    client = new ParadexHTTPClient({
      baseUrl: 'https://api.paradex.test/v1',
      auth: mockAuth,
      timeout: 5000,
      enableLogging: false,
    });

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch as any;
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = globalFetch;
    jest.clearAllMocks();
  });

  describe('GET Requests', () => {
    it('should make GET request successfully', async () => {
      const mockResponse = {
        markets: [{ symbol: 'BTC-USD-PERP' }],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as any);

      const result = await client.get('/markets');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.paradex.test/v1/markets',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-API-KEY': 'test-api-key',
          }),
        })
      );
    });

    it('should make GET request with query parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      } as any);

      await client.get('/markets', { symbol: 'BTC-USD-PERP', limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.paradex.test/v1/markets?symbol=BTC-USD-PERP&limit=10',
        expect.any(Object)
      );
    });

    it('should handle GET request with empty params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as any);

      await client.get('/markets', {});

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.paradex.test/v1/markets',
        expect.any(Object)
      );
    });
  });

  describe('POST Requests', () => {
    it('should make POST request successfully', async () => {
      const requestBody = {
        market: 'BTC-USD-PERP',
        side: 'BUY',
        size: '1.0',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ order_id: '123' }),
      } as any);

      const result = await client.post('/orders', requestBody);

      expect(result).toEqual({ order_id: '123' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.paradex.test/v1/orders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('should include auth headers in POST', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as any);

      await client.post('/orders', {});

      expect(mockAuth.sign).toHaveBeenCalledWith({
        method: 'POST',
        path: '/orders',
        body: {},
      });
    });
  });

  describe('PUT Requests', () => {
    it('should make PUT request successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ updated: true }),
      } as any);

      const result = await client.put('/orders/123', { size: '2.0' });

      expect(result).toEqual({ updated: true });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.paradex.test/v1/orders/123',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });
  });

  describe('DELETE Requests', () => {
    it('should make DELETE request successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ deleted: true }),
      } as any);

      const result = await client.delete('/orders/123');

      expect(result).toEqual({ deleted: true });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.paradex.test/v1/orders/123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should make DELETE request with query params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as any);

      await client.delete('/orders', { market: 'BTC-USD-PERP' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.paradex.test/v1/orders?market=BTC-USD-PERP',
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP 404 error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          code: 1003,
          message: 'Order not found',
        }),
      } as any);

      await expect(client.get('/orders/123')).rejects.toThrow(PerpDEXError);
    });

    it('should handle HTTP 401 error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
      } as any);

      await expect(client.get('/markets')).rejects.toThrow(PerpDEXError);
    });

    it('should handle HTTP 429 rate limit', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          code: 4001,
          message: 'Rate limit exceeded',
        }),
      } as any);

      await expect(client.get('/markets')).rejects.toThrow(PerpDEXError);
    });

    it('should handle HTTP 500 server error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      } as any);

      await expect(client.get('/markets')).rejects.toThrow(PerpDEXError);
    });

    it('should handle non-JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as any);

      await expect(client.get('/markets')).rejects.toThrow(PerpDEXError);
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValue({
        code: 'ECONNRESET',
        message: 'Connection reset',
      });

      await expect(client.get('/markets')).rejects.toThrow(PerpDEXError);
    });

    it('should handle timeout error', async () => {
      mockFetch.mockRejectedValue({
        name: 'AbortError',
        message: 'The operation was aborted',
      });

      await expect(client.get('/markets')).rejects.toThrow(PerpDEXError);
      await expect(client.get('/markets')).rejects.toThrow(/timeout/i);
    });

    it('should preserve PerpDEXError', async () => {
      const customError = new PerpDEXError('Custom error', 'CUSTOM', 'paradex');

      mockFetch.mockRejectedValue(customError);

      await expect(client.get('/markets')).rejects.toThrow(customError);
    });

    it('should handle generic error', async () => {
      mockFetch.mockRejectedValue(new Error('Unknown error'));

      await expect(client.get('/markets')).rejects.toThrow(PerpDEXError);
    });
  });

  describe('Response Handling', () => {
    it('should parse JSON response', async () => {
      const mockData = { result: 'success', data: [1, 2, 3] };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as any);

      const result = await client.get('/test');

      expect(result).toEqual(mockData);
    });

    it('should handle null response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('No content');
        },
      } as any);

      const result = await client.get('/test');

      expect(result).toBeNull();
    });
  });

  describe('Authentication Integration', () => {
    it('should call auth.sign for every request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as any);

      await client.get('/markets');

      expect(mockAuth.sign).toHaveBeenCalledWith({
        method: 'GET',
        path: '/markets',
        body: undefined,
      });
    });

    it('should use headers from auth.sign', async () => {
      mockAuth.sign.mockResolvedValue({
        headers: {
          'X-Custom-Header': 'custom-value',
          Authorization: 'Bearer token123',
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as any);

      await client.get('/markets');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
            Authorization: 'Bearer token123',
          }),
        })
      );
    });
  });

  describe('Configuration', () => {
    it('should expose base URL', () => {
      expect(client.url).toBe('https://api.paradex.test/v1');
    });

    it('should expose auth strategy', () => {
      expect(client.authStrategy).toBe(mockAuth);
    });

    it('should use custom timeout', async () => {
      const clientWithTimeout = new ParadexHTTPClient({
        baseUrl: 'https://api.test',
        auth: mockAuth,
        timeout: 1000, // 1 second
      });

      mockFetch.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 2000)));

      // The test would timeout if timeout is not working
      await expect(clientWithTimeout.get('/test')).rejects.toThrow();
    });
  });

  describe('Request Method', () => {
    it('should handle all HTTP methods', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as any);

      await client.request('GET', '/test');
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'GET' })
      );

      await client.request('POST', '/test', { data: 'test' });
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST' })
      );

      await client.request('PUT', '/test', { data: 'test' });
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT' })
      );

      await client.request('DELETE', '/test');
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should include body only for POST/PUT', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as any);

      await client.request('GET', '/test');
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ body: undefined })
      );

      await client.request('POST', '/test', { key: 'value' });
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ body: JSON.stringify({ key: 'value' }) })
      );
    });
  });
});

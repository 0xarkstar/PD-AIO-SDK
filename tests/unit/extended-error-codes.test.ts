/**
 * Extended Error Codes Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import { mapError } from '../../src/adapters/extended/utils.js';
import { PerpDEXError, NetworkError, RateLimitError } from '../../src/types/errors.js';

describe('Extended Error Codes', () => {
  describe('mapError', () => {
    it('should pass through PerpDEXError instances', () => {
      const originalError = new PerpDEXError('Test error', 'INVALID_REQUEST', 'extended');

      const result = mapError(originalError);

      expect(result).toBe(originalError);
      expect(result.message).toBe('Test error');
      expect(result.code).toBe('INVALID_REQUEST');
      expect(result.exchange).toBe('extended');
    });

    it('should map rate limit errors', () => {
      const error = {
        response: {
          status: 429,
          data: { error: 'Rate limit exceeded' },
        },
      };

      const result = mapError(error);

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should map authentication errors - 401', () => {
      const error = {
        response: {
          status: 401,
          data: { error: 'Invalid API key' },
        },
      };

      const result = mapError(error);

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.code).toBe('INVALID_API_KEY');
      expect(result.message).toContain('Invalid API key');
    });

    it('should map authentication errors - 403', () => {
      const error = {
        response: {
          status: 403,
          data: { error: 'Forbidden' },
        },
      };

      const result = mapError(error);

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.code).toBe('FORBIDDEN');
    });

    it('should map bad request errors - 400', () => {
      const error = {
        response: {
          status: 400,
          data: { error: 'Invalid parameter' },
        },
      };

      const result = mapError(error);

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.code).toBe('INVALID_ORDER');
    });

    it('should map not found errors - 404', () => {
      const error = {
        response: {
          status: 404,
          data: { error: 'Resource not found' },
        },
      };

      const result = mapError(error);

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.code).toBe('ORDER_NOT_FOUND');
    });

    it('should map insufficient balance errors', () => {
      const error = {
        response: {
          status: 400,
          data: { error: 'Insufficient balance', code: 'INSUFFICIENT_BALANCE' },
        },
      };

      const result = mapError(error);

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.code).toBe('INSUFFICIENT_BALANCE');
      expect(result.message).toContain('Insufficient balance');
    });

    it('should map order not found errors', () => {
      const error = {
        response: {
          status: 404,
          data: { error: 'Order not found' },
        },
      };

      const result = mapError(error);

      expect(result.code).toBe('ORDER_NOT_FOUND');
      expect(result.message).toContain('Order not found');
    });

    it('should map invalid order errors', () => {
      const error = {
        response: {
          status: 400,
          data: { error: 'Invalid order size' },
        },
      };

      const result = mapError(error);

      expect(result.code).toBe('INVALID_ORDER');
      expect(result.message).toContain('Invalid order');
    });

    it('should map network timeout errors', () => {
      const error = {
        code: 'ETIMEDOUT',
        message: 'Request timeout',
      };

      const result = mapError(error);

      expect(result).toBeInstanceOf(NetworkError);
      expect(result.message).toContain('timeout');
    });

    it('should map connection errors', () => {
      const error = {
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      };

      const result = mapError(error);

      expect(result).toBeInstanceOf(NetworkError);
      expect(result.message).toContain('Connection');
    });

    it('should map DNS errors', () => {
      const error = {
        code: 'ENOTFOUND',
        message: 'DNS lookup failed',
      };

      const result = mapError(error);

      expect(result).toBeInstanceOf(NetworkError);
      expect(result.message).toContain('network');
    });

    it('should map server errors - 500', () => {
      const error = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      };

      const result = mapError(error);

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.message).toContain('Internal server error');
    });

    it('should map service unavailable errors - 503', () => {
      const error = {
        response: {
          status: 503,
          data: { error: 'Service temporarily unavailable' },
        },
      };

      const result = mapError(error);

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('should include error message from response data', () => {
      const error = {
        response: {
          status: 400,
          data: { error: 'Custom error message from API' },
        },
      };

      const result = mapError(error);

      expect(result.message).toContain('Custom error message from API');
    });

    it('should handle response data with message field', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Error message in message field' },
        },
      };

      const result = mapError(error);

      expect(result.message).toContain('Error message in message field');
    });

    it('should handle response data as string', () => {
      const error = {
        response: {
          status: 400,
          data: 'Plain text error',
        },
      };

      const result = mapError(error);

      expect(result.code).toBe('INVALID_ORDER'); // 400 maps to INVALID_ORDER
    });

    it('should handle errors without response', () => {
      const error = new Error('Generic error');

      const result = mapError(error);

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toContain('Generic error');
    });

    it('should handle string errors', () => {
      const error = 'String error message';

      const result = mapError(error);

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.message).toContain('String error message');
    });

    it('should handle unknown error types', () => {
      const error = { someUnknownField: 'value' };

      const result = mapError(error);

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    it('should preserve error stack traces', () => {
      const originalError = new Error('Test error with stack');

      const result = mapError(originalError);

      expect(result.stack).toBeTruthy();
    });

    it('should handle null/undefined errors', () => {
      const result1 = mapError(null);
      const result2 = mapError(undefined);

      expect(result1).toBeInstanceOf(PerpDEXError);
      expect(result2).toBeInstanceOf(PerpDEXError);
      expect(result1.code).toBe('UNKNOWN_ERROR');
      expect(result2.code).toBe('UNKNOWN_ERROR');
    });

    it('should map position limit errors', () => {
      const error = {
        response: {
          status: 400,
          data: { error: 'Position size exceeds limit' },
        },
      };

      const result = mapError(error);

      expect(result.code).toBe('INVALID_ORDER'); // 400 maps to INVALID_ORDER by default
      expect(result.message).toContain('Position size');
    });

    it('should map leverage errors', () => {
      const error = {
        response: {
          status: 400,
          data: { error: 'Invalid leverage' },
        },
      };

      const result = mapError(error);

      expect(result.code).toBe('INVALID_LEVERAGE'); // Matches error message pattern
      expect(result.message).toContain('Invalid leverage');
    });

    it('should map market closed errors', () => {
      const error = {
        response: {
          status: 400,
          data: { error: 'Market closed' },
        },
      };

      const result = mapError(error);

      expect(result.code).toBe('MARKET_CLOSED'); // Matches error message pattern
    });
  });

  describe('error code constants', () => {
    it('should have correct error code for authentication', () => {
      const error = new PerpDEXError('Auth failed', 'AUTHENTICATION_ERROR', 'extended');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should have correct error code for rate limits', () => {
      const error = new RateLimitError('Rate limit', 'RATE_LIMIT_EXCEEDED', 'extended');
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should have correct error code for network errors', () => {
      const error = new NetworkError('Network failed', 'NETWORK_ERROR', 'extended');
      expect(error.code).toBe('NETWORK_ERROR');
    });

    it('should have correct error code for invalid requests', () => {
      const error = new PerpDEXError('Invalid', 'INVALID_REQUEST', 'extended');
      expect(error.code).toBe('INVALID_REQUEST');
    });

    it('should have correct error code for not found', () => {
      const error = new PerpDEXError('Not found', 'NOT_FOUND', 'extended');
      expect(error.code).toBe('NOT_FOUND');
    });
  });
});

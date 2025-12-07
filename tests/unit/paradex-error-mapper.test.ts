/**
 * Unit Tests for ParadexErrorMapper
 *
 * Tests error classification and mapping logic
 */

import { describe, it, expect } from '@jest/globals';
import {
  PARADEX_CLIENT_ERRORS,
  PARADEX_SERVER_ERRORS,
  PARADEX_RATE_LIMIT_ERROR,
  PARADEX_NETWORK_ERRORS,
  isClientError,
  isServerError,
  isNetworkError,
  isRetryableError,
  mapParadexError,
  extractParadexError,
  mapHttpError,
  mapAxiosError,
} from '../../src/adapters/paradex/ParadexErrorMapper.js';
import {
  InvalidOrderError,
  InsufficientMarginError,
  OrderNotFoundError,
  PositionNotFoundError,
  InvalidSignatureError,
  ExpiredAuthError,
  InsufficientPermissionsError,
  RateLimitError,
  ExchangeUnavailableError,
  PerpDEXError,
} from '../../src/types/errors.js';

describe('ParadexErrorMapper', () => {
  describe('Error Classification', () => {
    describe('isClientError', () => {
      it('should identify client errors (1xxx range)', () => {
        expect(isClientError(1001)).toBe(true);
        expect(isClientError(1002)).toBe(true);
        expect(isClientError(1999)).toBe(true);
      });

      it('should identify auth errors (2xxx range)', () => {
        expect(isClientError(2001)).toBe(true);
        expect(isClientError(2002)).toBe(true);
        expect(isClientError(2999)).toBe(true);
      });

      it('should identify HTTP 4xx as client errors', () => {
        expect(isClientError(400)).toBe(true);
        expect(isClientError(401)).toBe(true);
        expect(isClientError(404)).toBe(true);
        expect(isClientError(429)).toBe(true);
        expect(isClientError(499)).toBe(true);
      });

      it('should NOT identify server errors as client errors', () => {
        expect(isClientError(5001)).toBe(false);
        expect(isClientError(500)).toBe(false);
      });

      it('should handle string error codes', () => {
        expect(isClientError('1001')).toBe(true);
        expect(isClientError('2001')).toBe(true);
        expect(isClientError('400')).toBe(true);
      });
    });

    describe('isServerError', () => {
      it('should identify server errors (5xxx range)', () => {
        expect(isServerError(5001)).toBe(true);
        expect(isServerError(5002)).toBe(true);
        expect(isServerError(5999)).toBe(true);
      });

      it('should identify HTTP 5xx as server errors', () => {
        expect(isServerError(500)).toBe(true);
        expect(isServerError(503)).toBe(true);
        expect(isServerError(599)).toBe(true);
      });

      it('should NOT identify client errors as server errors', () => {
        expect(isServerError(1001)).toBe(false);
        expect(isServerError(400)).toBe(false);
      });

      it('should handle string error codes', () => {
        expect(isServerError('5001')).toBe(true);
        expect(isServerError('500')).toBe(true);
      });
    });

    describe('isNetworkError', () => {
      it('should identify network error codes', () => {
        expect(isNetworkError('ECONNRESET')).toBe(true);
        expect(isNetworkError('ETIMEDOUT')).toBe(true);
        expect(isNetworkError('ENOTFOUND')).toBe(true);
        expect(isNetworkError('ECONNREFUSED')).toBe(true);
        expect(isNetworkError('ECONNABORTED')).toBe(true);
        expect(isNetworkError('NETWORK_ERROR')).toBe(true);
        expect(isNetworkError('WEBSOCKET_CLOSED')).toBe(true);
        expect(isNetworkError('WEBSOCKET_ERROR')).toBe(true);
      });

      it('should NOT identify non-network errors', () => {
        expect(isNetworkError('1001')).toBe(false);
        expect(isNetworkError('INVALID_ORDER')).toBe(false);
      });
    });

    describe('isRetryableError', () => {
      it('should identify server errors as retryable', () => {
        expect(isRetryableError(5001)).toBe(true);
        expect(isRetryableError(500)).toBe(true);
      });

      it('should identify network errors as retryable', () => {
        expect(isRetryableError('ECONNRESET')).toBe(true);
        expect(isRetryableError('ETIMEDOUT')).toBe(true);
      });

      it('should identify rate limit as retryable', () => {
        expect(isRetryableError(4001)).toBe(true);
        expect(isRetryableError('4001')).toBe(true);
      });

      it('should NOT identify client errors as retryable', () => {
        expect(isRetryableError(1001)).toBe(false);
        expect(isRetryableError(2001)).toBe(false);
        expect(isRetryableError(400)).toBe(false);
      });
    });
  });

  describe('mapParadexError', () => {
    it('should map INVALID_SIGNATURE to InvalidSignatureError', () => {
      const error = mapParadexError(
        PARADEX_CLIENT_ERRORS.INVALID_SIGNATURE,
        'Invalid signature'
      );

      expect(error).toBeInstanceOf(InvalidSignatureError);
      expect(error.code).toBe('2001');
      expect(error.exchange).toBe('paradex');
    });

    it('should map INVALID_API_KEY to InvalidSignatureError', () => {
      const error = mapParadexError(
        PARADEX_CLIENT_ERRORS.INVALID_API_KEY,
        'Invalid API key'
      );

      expect(error).toBeInstanceOf(InvalidSignatureError);
    });

    it('should map EXPIRED_AUTH to ExpiredAuthError', () => {
      const error = mapParadexError(PARADEX_CLIENT_ERRORS.EXPIRED_AUTH, 'JWT token expired');

      expect(error).toBeInstanceOf(ExpiredAuthError);
      expect(error.code).toBe('2002');
    });

    it('should map UNAUTHORIZED to InsufficientPermissionsError', () => {
      const error = mapParadexError(PARADEX_CLIENT_ERRORS.UNAUTHORIZED, 'Unauthorized');

      expect(error).toBeInstanceOf(InsufficientPermissionsError);
    });

    it('should map FORBIDDEN to InsufficientPermissionsError', () => {
      const error = mapParadexError(PARADEX_CLIENT_ERRORS.FORBIDDEN, 'Forbidden');

      expect(error).toBeInstanceOf(InsufficientPermissionsError);
    });

    it('should map INSUFFICIENT_MARGIN to InsufficientMarginError', () => {
      const error = mapParadexError(
        PARADEX_CLIENT_ERRORS.INSUFFICIENT_MARGIN,
        'Insufficient margin'
      );

      expect(error).toBeInstanceOf(InsufficientMarginError);
      expect(error.code).toBe('1002');
    });

    it('should map INSUFFICIENT_BALANCE to InsufficientMarginError', () => {
      const error = mapParadexError(
        PARADEX_CLIENT_ERRORS.INSUFFICIENT_BALANCE,
        'Insufficient balance'
      );

      expect(error).toBeInstanceOf(InsufficientMarginError);
    });

    it('should map ORDER_NOT_FOUND to OrderNotFoundError', () => {
      const error = mapParadexError(PARADEX_CLIENT_ERRORS.ORDER_NOT_FOUND, 'Order not found');

      expect(error).toBeInstanceOf(OrderNotFoundError);
      expect(error.code).toBe('1003');
    });

    it('should map POSITION_NOT_FOUND to PositionNotFoundError', () => {
      const error = mapParadexError(
        PARADEX_CLIENT_ERRORS.POSITION_NOT_FOUND,
        'Position not found'
      );

      expect(error).toBeInstanceOf(PositionNotFoundError);
      expect(error.code).toBe('1004');
    });

    it('should map INVALID_ORDER to InvalidOrderError', () => {
      const error = mapParadexError(PARADEX_CLIENT_ERRORS.INVALID_ORDER, 'Invalid order');

      expect(error).toBeInstanceOf(InvalidOrderError);
      expect(error.code).toBe('1001');
    });

    it('should map order validation errors to InvalidOrderError', () => {
      const errorCodes = [
        PARADEX_CLIENT_ERRORS.INVALID_SIZE,
        PARADEX_CLIENT_ERRORS.INVALID_PRICE,
        PARADEX_CLIENT_ERRORS.MIN_SIZE_NOT_MET,
        PARADEX_CLIENT_ERRORS.MAX_SIZE_EXCEEDED,
        PARADEX_CLIENT_ERRORS.PRICE_OUT_OF_RANGE,
        PARADEX_CLIENT_ERRORS.SELF_TRADE,
        PARADEX_CLIENT_ERRORS.ORDER_ALREADY_FILLED,
        PARADEX_CLIENT_ERRORS.ORDER_ALREADY_CANCELLED,
        PARADEX_CLIENT_ERRORS.REDUCE_ONLY_VIOLATION,
        PARADEX_CLIENT_ERRORS.POST_ONLY_VIOLATION,
        PARADEX_CLIENT_ERRORS.INVALID_TIME_IN_FORCE,
      ];

      errorCodes.forEach((code) => {
        const error = mapParadexError(code, 'Test error');
        expect(error).toBeInstanceOf(InvalidOrderError);
      });
    });

    it('should map market errors to InvalidOrderError', () => {
      const errorCodes = [
        PARADEX_CLIENT_ERRORS.INVALID_MARKET,
        PARADEX_CLIENT_ERRORS.MARKET_NOT_ACTIVE,
        PARADEX_CLIENT_ERRORS.MARKET_CLOSED,
        PARADEX_CLIENT_ERRORS.TRADING_HALTED,
      ];

      errorCodes.forEach((code) => {
        const error = mapParadexError(code, 'Test error');
        expect(error).toBeInstanceOf(InvalidOrderError);
      });
    });

    it('should map leverage errors to InvalidOrderError', () => {
      const errorCodes = [
        PARADEX_CLIENT_ERRORS.INVALID_LEVERAGE,
        PARADEX_CLIENT_ERRORS.MAX_LEVERAGE_EXCEEDED,
        PARADEX_CLIENT_ERRORS.MAX_POSITION_EXCEEDED,
      ];

      errorCodes.forEach((code) => {
        const error = mapParadexError(code, 'Test error');
        expect(error).toBeInstanceOf(InvalidOrderError);
      });
    });

    it('should map RATE_LIMIT_EXCEEDED to RateLimitError', () => {
      const error = mapParadexError(PARADEX_RATE_LIMIT_ERROR, 'Rate limit exceeded');

      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.code).toBe('4001');
    });

    it('should map server errors to ExchangeUnavailableError', () => {
      const error = mapParadexError(
        PARADEX_SERVER_ERRORS.INTERNAL_ERROR,
        'Internal server error'
      );

      expect(error).toBeInstanceOf(ExchangeUnavailableError);
      expect(error.code).toBe('5001');
    });

    it('should map network errors to ExchangeUnavailableError', () => {
      const error = mapParadexError('ECONNRESET', 'Connection reset');

      expect(error).toBeInstanceOf(ExchangeUnavailableError);
    });

    it('should handle string error codes', () => {
      const error = mapParadexError('1001', 'Invalid order');

      expect(error).toBeInstanceOf(InvalidOrderError);
      expect(error.code).toBe('1001');
    });

    it('should preserve original error', () => {
      const originalError = { custom: 'data' };
      const error = mapParadexError(1001, 'Test', originalError);

      expect(error.originalError).toBe(originalError);
    });

    it('should default to PerpDEXError for unknown codes', () => {
      const error = mapParadexError(9999, 'Unknown error');

      expect(error).toBeInstanceOf(PerpDEXError);
      expect(error.code).toBe('9999');
    });
  });

  describe('extractParadexError', () => {
    it('should extract error from { code, message } format', () => {
      const response = {
        code: 1001,
        message: 'Invalid order',
      };

      const { code, message } = extractParadexError(response);

      expect(code).toBe('1001');
      expect(message).toBe('Invalid order');
    });

    it('should extract error from { error: { code, message } } format', () => {
      const response = {
        error: {
          code: 1002,
          message: 'Insufficient margin',
        },
      };

      const { code, message } = extractParadexError(response);

      expect(code).toBe('1002');
      expect(message).toBe('Insufficient margin');
    });

    it('should handle missing code', () => {
      const response = {
        message: 'Some error',
      };

      const { code } = extractParadexError(response);

      expect(code).toBe('UNKNOWN_ERROR');
    });

    it('should handle missing message', () => {
      const response = {
        code: 1001,
      };

      const { message } = extractParadexError(response);

      expect(message).toBe('Unknown error occurred');
    });
  });

  describe('mapHttpError', () => {
    it('should map 401 to InvalidSignatureError', () => {
      const error = mapHttpError(401, 'Unauthorized');

      expect(error).toBeInstanceOf(InvalidSignatureError);
      expect(error.message).toContain('Unauthorized');
    });

    it('should map 403 to InsufficientPermissionsError', () => {
      const error = mapHttpError(403, 'Forbidden');

      expect(error).toBeInstanceOf(InsufficientPermissionsError);
      expect(error.message).toContain('Forbidden');
    });

    it('should map 404 to OrderNotFoundError', () => {
      const error = mapHttpError(404, 'Not Found');

      expect(error).toBeInstanceOf(OrderNotFoundError);
      expect(error.message).toContain('Not found');
    });

    it('should map 429 to RateLimitError', () => {
      const error = mapHttpError(429, 'Too Many Requests');

      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.message).toContain('Rate limit exceeded');
    });

    it('should map 4xx to InvalidOrderError', () => {
      const error = mapHttpError(400, 'Bad Request');

      expect(error).toBeInstanceOf(InvalidOrderError);
      expect(error.code).toBe('HTTP_400');
    });

    it('should map 503 to ExchangeUnavailableError', () => {
      const error = mapHttpError(503, 'Service Unavailable');

      expect(error).toBeInstanceOf(ExchangeUnavailableError);
      expect(error.message).toContain('Service unavailable');
    });

    it('should map 5xx to ExchangeUnavailableError', () => {
      const error = mapHttpError(500, 'Internal Server Error');

      expect(error).toBeInstanceOf(ExchangeUnavailableError);
      expect(error.code).toBe('HTTP_500');
    });

    it('should extract Paradex error from response data', () => {
      const responseData = {
        code: 1002,
        message: 'Insufficient margin',
      };

      const error = mapHttpError(400, 'Bad Request', responseData);

      expect(error).toBeInstanceOf(InsufficientMarginError);
      expect(error.code).toBe('1002');
    });

    it('should handle retry-after header in 429 response', () => {
      const responseData = {
        headers: {
          'retry-after': '60',
        },
      };

      const error = mapHttpError(429, 'Too Many Requests', responseData);

      expect(error).toBeInstanceOf(RateLimitError);
      // retryAfter is private, can't test directly
    });
  });

  describe('mapAxiosError', () => {
    it('should map network errors', () => {
      const axiosError = {
        code: 'ECONNRESET',
        message: 'Connection reset by peer',
      };

      const error = mapAxiosError(axiosError);

      expect(error).toBeInstanceOf(ExchangeUnavailableError);
      expect(error.code).toBe('ECONNRESET');
    });

    it('should map HTTP errors with response', () => {
      const axiosError = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: {
            code: 1003,
            message: 'Order not found',
          },
        },
      };

      const error = mapAxiosError(axiosError);

      expect(error).toBeInstanceOf(OrderNotFoundError);
      expect(error.code).toBe('1003');
    });

    it('should map timeout errors', () => {
      const axiosError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      };

      const error = mapAxiosError(axiosError);

      expect(error).toBeInstanceOf(ExchangeUnavailableError);
      expect(error.code).toBe('ECONNABORTED'); // Preserves original code
      expect(error.message).toContain('timeout');
    });

    it('should handle generic errors', () => {
      const axiosError = {
        message: 'Something went wrong',
      };

      const error = mapAxiosError(axiosError);

      expect(error).toBeInstanceOf(PerpDEXError);
      expect(error.code).toBe('UNKNOWN_ERROR');
    });

    it('should preserve original error', () => {
      const axiosError = {
        code: 'ECONNRESET',
        message: 'Connection reset',
        custom: 'data',
      };

      const error = mapAxiosError(axiosError);

      expect(error.originalError).toBe(axiosError);
    });
  });

  describe('Error Constants', () => {
    it('should have correct client error codes', () => {
      expect(PARADEX_CLIENT_ERRORS.INVALID_ORDER).toBe(1001);
      expect(PARADEX_CLIENT_ERRORS.INSUFFICIENT_MARGIN).toBe(1002);
      expect(PARADEX_CLIENT_ERRORS.ORDER_NOT_FOUND).toBe(1003);
      expect(PARADEX_CLIENT_ERRORS.POSITION_NOT_FOUND).toBe(1004);
      expect(PARADEX_CLIENT_ERRORS.INVALID_SIGNATURE).toBe(2001);
      expect(PARADEX_CLIENT_ERRORS.EXPIRED_AUTH).toBe(2002);
      expect(PARADEX_CLIENT_ERRORS.INVALID_API_KEY).toBe(2003);
    });

    it('should have correct server error codes', () => {
      expect(PARADEX_SERVER_ERRORS.INTERNAL_ERROR).toBe(5001);
      expect(PARADEX_SERVER_ERRORS.SERVICE_UNAVAILABLE).toBe(5002);
      expect(PARADEX_SERVER_ERRORS.GATEWAY_TIMEOUT).toBe(5003);
    });

    it('should have correct rate limit code', () => {
      expect(PARADEX_RATE_LIMIT_ERROR).toBe(4001);
    });

    it('should have network error codes', () => {
      expect(PARADEX_NETWORK_ERRORS.ECONNRESET).toBe('ECONNRESET');
      expect(PARADEX_NETWORK_ERRORS.ETIMEDOUT).toBe('ETIMEDOUT');
      expect(PARADEX_NETWORK_ERRORS.ENOTFOUND).toBe('ENOTFOUND');
    });
  });
});

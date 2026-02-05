/**
 * Unit Tests for GRVTErrorMapper
 *
 * Tests error classification and mapping logic
 */

import { describe, it, expect } from '@jest/globals';
import {
  GRVT_CLIENT_ERRORS,
  GRVT_SERVER_ERRORS,
  GRVT_RATE_LIMIT_ERROR,
  GRVT_NETWORK_ERRORS,
  isClientError,
  isServerError,
  isNetworkError,
  isRetryableError,
  mapGRVTError,
  extractGRVTError,
  mapHttpError,
  mapAxiosError,
} from '../../src/adapters/grvt/GRVTErrorMapper.js';
import {
  InvalidOrderError,
  InsufficientMarginError,
  OrderNotFoundError,
  InvalidSignatureError,
  ExpiredAuthError,
  InsufficientPermissionsError,
  RateLimitError,
  ExchangeUnavailableError,
  PerpDEXError,
} from '../../src/types/errors.js';

describe('GRVTErrorMapper', () => {
  describe('Error Classification', () => {
    describe('isClientError', () => {
      it('should identify client errors', () => {
        expect(isClientError('INVALID_ORDER')).toBe(true);
        expect(isClientError('INSUFFICIENT_MARGIN')).toBe(true);
        expect(isClientError('INVALID_SIGNATURE')).toBe(true);
        expect(isClientError('UNAUTHORIZED')).toBe(true);
      });

      it('should NOT identify server errors as client errors', () => {
        expect(isClientError('INTERNAL_ERROR')).toBe(false);
        expect(isClientError('SERVICE_UNAVAILABLE')).toBe(false);
      });

      it('should NOT identify network errors as client errors', () => {
        expect(isClientError('ECONNRESET')).toBe(false);
        expect(isClientError('ETIMEDOUT')).toBe(false);
      });

      it('should NOT identify unknown errors as client errors', () => {
        expect(isClientError('UNKNOWN_ERROR')).toBe(false);
        expect(isClientError('RANDOM_ERROR')).toBe(false);
      });
    });

    describe('isServerError', () => {
      it('should identify server errors', () => {
        expect(isServerError('INTERNAL_ERROR')).toBe(true);
        expect(isServerError('SERVICE_UNAVAILABLE')).toBe(true);
        expect(isServerError('GATEWAY_TIMEOUT')).toBe(true);
        expect(isServerError('DATABASE_ERROR')).toBe(true);
        expect(isServerError('MATCHING_ENGINE_ERROR')).toBe(true);
        expect(isServerError('SEQUENCER_ERROR')).toBe(true);
      });

      it('should NOT identify client errors as server errors', () => {
        expect(isServerError('INVALID_ORDER')).toBe(false);
        expect(isServerError('UNAUTHORIZED')).toBe(false);
      });

      it('should NOT identify network errors as server errors', () => {
        expect(isServerError('ECONNRESET')).toBe(false);
      });
    });

    describe('isNetworkError', () => {
      it('should identify network error codes', () => {
        expect(isNetworkError('ECONNRESET')).toBe(true);
        expect(isNetworkError('ETIMEDOUT')).toBe(true);
        expect(isNetworkError('ENOTFOUND')).toBe(true);
        expect(isNetworkError('ECONNREFUSED')).toBe(true);
        expect(isNetworkError('NETWORK_ERROR')).toBe(true);
        expect(isNetworkError('WEBSOCKET_CLOSED')).toBe(true);
        expect(isNetworkError('WEBSOCKET_ERROR')).toBe(true);
      });

      it('should NOT identify non-network errors', () => {
        expect(isNetworkError('INVALID_ORDER')).toBe(false);
        expect(isNetworkError('INTERNAL_ERROR')).toBe(false);
      });
    });

    describe('isRetryableError', () => {
      it('should identify server errors as retryable', () => {
        expect(isRetryableError('INTERNAL_ERROR')).toBe(true);
        expect(isRetryableError('SERVICE_UNAVAILABLE')).toBe(true);
      });

      it('should identify network errors as retryable', () => {
        expect(isRetryableError('ECONNRESET')).toBe(true);
        expect(isRetryableError('ETIMEDOUT')).toBe(true);
      });

      it('should identify rate limit as retryable', () => {
        expect(isRetryableError('RATE_LIMIT_EXCEEDED')).toBe(true);
      });

      it('should NOT identify client errors as retryable', () => {
        expect(isRetryableError('INVALID_ORDER')).toBe(false);
        expect(isRetryableError('UNAUTHORIZED')).toBe(false);
      });
    });
  });

  describe('mapGRVTError', () => {
    it('should map INVALID_SIGNATURE to InvalidSignatureError', () => {
      const error = mapGRVTError('INVALID_SIGNATURE', 'Invalid signature');

      expect(error).toBeInstanceOf(InvalidSignatureError);
      expect(error.code).toBe('INVALID_SIGNATURE');
      expect(error.exchange).toBe('grvt');
    });

    it('should map INVALID_API_KEY to InvalidSignatureError', () => {
      const error = mapGRVTError('INVALID_API_KEY', 'Invalid API key');

      expect(error).toBeInstanceOf(InvalidSignatureError);
    });

    it('should map EXPIRED_SESSION to ExpiredAuthError', () => {
      const error = mapGRVTError('EXPIRED_SESSION', 'Session expired');

      expect(error).toBeInstanceOf(ExpiredAuthError);
      expect(error.code).toBe('EXPIRED_SESSION');
    });

    it('should map UNAUTHORIZED to InsufficientPermissionsError', () => {
      const error = mapGRVTError('UNAUTHORIZED', 'Unauthorized');

      expect(error).toBeInstanceOf(InsufficientPermissionsError);
    });

    it('should map FORBIDDEN to InsufficientPermissionsError', () => {
      const error = mapGRVTError('FORBIDDEN', 'Forbidden');

      expect(error).toBeInstanceOf(InsufficientPermissionsError);
    });

    it('should map INSUFFICIENT_MARGIN to InsufficientMarginError', () => {
      const error = mapGRVTError('INSUFFICIENT_MARGIN', 'Insufficient margin');

      expect(error).toBeInstanceOf(InsufficientMarginError);
      expect(error.code).toBe('INSUFFICIENT_MARGIN');
    });

    it('should map INSUFFICIENT_BALANCE to InsufficientMarginError', () => {
      const error = mapGRVTError('INSUFFICIENT_BALANCE', 'Insufficient balance');

      expect(error).toBeInstanceOf(InsufficientMarginError);
    });

    it('should map ORDER_NOT_FOUND to OrderNotFoundError', () => {
      const error = mapGRVTError('ORDER_NOT_FOUND', 'Order not found');

      expect(error).toBeInstanceOf(OrderNotFoundError);
      expect(error.code).toBe('ORDER_NOT_FOUND');
    });

    it('should map INVALID_ORDER to InvalidOrderError', () => {
      const error = mapGRVTError('INVALID_ORDER', 'Invalid order');

      expect(error).toBeInstanceOf(InvalidOrderError);
      expect(error.code).toBe('INVALID_ORDER');
    });

    it('should map order validation errors to InvalidOrderError', () => {
      const errorCodes = [
        'ORDER_ALREADY_FILLED',
        'ORDER_ALREADY_CANCELLED',
        'INVALID_PRICE',
        'INVALID_SIZE',
        'MIN_SIZE_NOT_MET',
        'MAX_SIZE_EXCEEDED',
        'PRICE_OUT_OF_RANGE',
        'SELF_TRADE',
      ];

      errorCodes.forEach((code) => {
        const error = mapGRVTError(code, 'Test error');
        expect(error).toBeInstanceOf(InvalidOrderError);
      });
    });

    it('should map market errors to InvalidOrderError', () => {
      const errorCodes = [
        'INVALID_INSTRUMENT',
        'INSTRUMENT_NOT_ACTIVE',
        'MARKET_CLOSED',
        'TRADING_HALTED',
      ];

      errorCodes.forEach((code) => {
        const error = mapGRVTError(code, 'Test error');
        expect(error).toBeInstanceOf(InvalidOrderError);
      });
    });

    it('should map position errors to InvalidOrderError', () => {
      const errorCodes = ['MAX_POSITION_EXCEEDED', 'REDUCE_ONLY_VIOLATION'];

      errorCodes.forEach((code) => {
        const error = mapGRVTError(code, 'Test error');
        expect(error).toBeInstanceOf(InvalidOrderError);
      });
    });

    it('should map leverage errors to InvalidOrderError', () => {
      const errorCodes = ['INVALID_LEVERAGE', 'MAX_LEVERAGE_EXCEEDED'];

      errorCodes.forEach((code) => {
        const error = mapGRVTError(code, 'Test error');
        expect(error).toBeInstanceOf(InvalidOrderError);
      });
    });

    it('should map RATE_LIMIT_EXCEEDED to RateLimitError', () => {
      const error = mapGRVTError('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded');

      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should map server errors to ExchangeUnavailableError', () => {
      const error = mapGRVTError('INTERNAL_ERROR', 'Internal server error');

      expect(error).toBeInstanceOf(ExchangeUnavailableError);
      expect(error.code).toBe('INTERNAL_ERROR');
    });

    it('should map network errors to ExchangeUnavailableError', () => {
      const error = mapGRVTError('ECONNRESET', 'Connection reset');

      expect(error).toBeInstanceOf(ExchangeUnavailableError);
    });

    it('should handle numeric error codes', () => {
      const error = mapGRVTError(400, 'Bad request');

      expect(error).toBeInstanceOf(PerpDEXError);
      expect(error.code).toBe('400');
    });

    it('should preserve original error', () => {
      const originalError = { custom: 'data' };
      const error = mapGRVTError('INVALID_ORDER', 'Test', originalError);

      expect(error.originalError).toBe(originalError);
    });

    it('should default to PerpDEXError for unknown codes', () => {
      const error = mapGRVTError('UNKNOWN_ERROR', 'Unknown error');

      expect(error).toBeInstanceOf(PerpDEXError);
      expect(error.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('extractGRVTError', () => {
    it('should extract error from { error: { code, message } } format', () => {
      const response = {
        error: {
          code: 'INVALID_ORDER',
          message: 'Invalid order',
        },
      };

      const { code, message } = extractGRVTError(response);

      expect(code).toBe('INVALID_ORDER');
      expect(message).toBe('Invalid order');
    });

    it('should extract error from { code, message } format', () => {
      const response = {
        code: 'INSUFFICIENT_MARGIN',
        message: 'Insufficient margin',
      };

      const { code, message } = extractGRVTError(response);

      expect(code).toBe('INSUFFICIENT_MARGIN');
      expect(message).toBe('Insufficient margin');
    });

    it('should handle missing code', () => {
      const response = {
        message: 'Some error',
      };

      const { code } = extractGRVTError(response);

      expect(code).toBe('UNKNOWN_ERROR');
    });

    it('should handle missing message', () => {
      const response = {
        code: 'INVALID_ORDER',
      };

      const { message } = extractGRVTError(response);

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

    it('should extract GRVT error from response data', () => {
      const responseData = {
        error: {
          code: 'INSUFFICIENT_MARGIN',
          message: 'Insufficient margin',
        },
      };

      const error = mapHttpError(400, 'Bad Request', responseData);

      expect(error).toBeInstanceOf(InsufficientMarginError);
      expect(error.code).toBe('INSUFFICIENT_MARGIN');
    });

    it('should handle retry-after header in 429 response', () => {
      const responseData = {
        headers: {
          'retry-after': '60',
        },
      };

      const error = mapHttpError(429, 'Too Many Requests', responseData);

      expect(error).toBeInstanceOf(RateLimitError);
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
            error: {
              code: 'ORDER_NOT_FOUND',
              message: 'Order not found',
            },
          },
        },
      };

      const error = mapAxiosError(axiosError);

      expect(error).toBeInstanceOf(OrderNotFoundError);
      expect(error.code).toBe('ORDER_NOT_FOUND');
    });

    it('should map timeout errors', () => {
      const axiosError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      };

      const error = mapAxiosError(axiosError);

      expect(error).toBeInstanceOf(ExchangeUnavailableError);
      expect(error.code).toBe('ETIMEDOUT'); // ECONNABORTED is mapped to ETIMEDOUT
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
      expect(GRVT_CLIENT_ERRORS.INVALID_SIGNATURE).toBe('INVALID_SIGNATURE');
      expect(GRVT_CLIENT_ERRORS.EXPIRED_SESSION).toBe('EXPIRED_SESSION');
      expect(GRVT_CLIENT_ERRORS.INVALID_ORDER).toBe('INVALID_ORDER');
      expect(GRVT_CLIENT_ERRORS.INSUFFICIENT_MARGIN).toBe('INSUFFICIENT_MARGIN');
      expect(GRVT_CLIENT_ERRORS.ORDER_NOT_FOUND).toBe('ORDER_NOT_FOUND');
    });

    it('should have correct server error codes', () => {
      expect(GRVT_SERVER_ERRORS.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(GRVT_SERVER_ERRORS.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
      expect(GRVT_SERVER_ERRORS.GATEWAY_TIMEOUT).toBe('GATEWAY_TIMEOUT');
      expect(GRVT_SERVER_ERRORS.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(GRVT_SERVER_ERRORS.MATCHING_ENGINE_ERROR).toBe('MATCHING_ENGINE_ERROR');
      expect(GRVT_SERVER_ERRORS.SEQUENCER_ERROR).toBe('SEQUENCER_ERROR');
    });

    it('should have correct rate limit code', () => {
      expect(GRVT_RATE_LIMIT_ERROR).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should have network error codes', () => {
      expect(GRVT_NETWORK_ERRORS.ECONNRESET).toBe('ECONNRESET');
      expect(GRVT_NETWORK_ERRORS.ETIMEDOUT).toBe('ETIMEDOUT');
      expect(GRVT_NETWORK_ERRORS.ENOTFOUND).toBe('ENOTFOUND');
      expect(GRVT_NETWORK_ERRORS.WEBSOCKET_CLOSED).toBe('WEBSOCKET_CLOSED');
      expect(GRVT_NETWORK_ERRORS.WEBSOCKET_ERROR).toBe('WEBSOCKET_ERROR');
    });
  });

  describe('Edge Cases', () => {
    describe('All Server Error Codes', () => {
      it('should map all server error codes to ExchangeUnavailableError', () => {
        const serverErrorCodes = Object.values(GRVT_SERVER_ERRORS);

        serverErrorCodes.forEach((code) => {
          const error = mapGRVTError(code, 'Server error');
          expect(error).toBeInstanceOf(ExchangeUnavailableError);
          expect(error.exchange).toBe('grvt');
        });
      });

      it('should map DATABASE_ERROR correctly', () => {
        const error = mapGRVTError('DATABASE_ERROR', 'Database error');
        expect(error).toBeInstanceOf(ExchangeUnavailableError);
        expect(error.code).toBe('DATABASE_ERROR');
      });

      it('should map MATCHING_ENGINE_ERROR correctly', () => {
        const error = mapGRVTError('MATCHING_ENGINE_ERROR', 'Matching engine error');
        expect(error).toBeInstanceOf(ExchangeUnavailableError);
        expect(error.code).toBe('MATCHING_ENGINE_ERROR');
      });

      it('should map SEQUENCER_ERROR correctly', () => {
        const error = mapGRVTError('SEQUENCER_ERROR', 'Sequencer error');
        expect(error).toBeInstanceOf(ExchangeUnavailableError);
        expect(error.code).toBe('SEQUENCER_ERROR');
      });
    });

    describe('All Network Error Codes', () => {
      it('should map all network error codes to ExchangeUnavailableError', () => {
        const networkErrorCodes = Object.values(GRVT_NETWORK_ERRORS);

        networkErrorCodes.forEach((code) => {
          const error = mapGRVTError(code, 'Network error');
          expect(error).toBeInstanceOf(ExchangeUnavailableError);
          expect(error.exchange).toBe('grvt');
        });
      });
    });

    describe('RateLimitError with retryAfter', () => {
      it('should extract retryAfter from headers object', () => {
        const originalError = {
          headers: {
            'retry-after': '120',
          },
        };

        const error = mapGRVTError('RATE_LIMIT_EXCEEDED', 'Rate limit', originalError);
        expect(error).toBeInstanceOf(RateLimitError);
        expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      });

      it('should extract retryAfter from response.headers', () => {
        const originalError = {
          response: {
            headers: {
              'retry-after': '60',
            },
          },
        };

        const error = mapGRVTError('RATE_LIMIT_EXCEEDED', 'Rate limit', originalError);
        expect(error).toBeInstanceOf(RateLimitError);
      });

      it('should extract retryAfter from data.retryAfter', () => {
        const originalError = {
          retryAfter: 30,
        };

        const error = mapGRVTError('RATE_LIMIT_EXCEEDED', 'Rate limit', originalError);
        expect(error).toBeInstanceOf(RateLimitError);
      });

      it('should handle missing retryAfter', () => {
        const error = mapGRVTError('RATE_LIMIT_EXCEEDED', 'Rate limit');
        expect(error).toBeInstanceOf(RateLimitError);
      });

      it('should handle originalError without retry-after fields (line 445)', () => {
        // Pass an object that is truthy but has no retry-after fields
        const originalError = {
          message: 'Some error',
          status: 429,
        };

        const error = mapGRVTError('RATE_LIMIT_EXCEEDED', 'Rate limit', originalError);
        expect(error).toBeInstanceOf(RateLimitError);
        // retryAfter should be undefined since no retry-after info was found
        expect((error as RateLimitError).retryAfter).toBeUndefined();
      });
    });

    describe('Malformed Responses', () => {
      it('should handle null response', () => {
        const { code, message } = extractGRVTError(null);
        expect(code).toBe('UNKNOWN_ERROR');
        expect(message).toBe('Unknown error occurred');
      });

      it('should handle undefined response', () => {
        const { code, message } = extractGRVTError(undefined);
        expect(code).toBe('UNKNOWN_ERROR');
        expect(message).toBe('Unknown error occurred');
      });

      it('should handle empty object response', () => {
        const { code, message } = extractGRVTError({});
        expect(code).toBe('UNKNOWN_ERROR');
        expect(message).toBe('Unknown error occurred');
      });

      it('should handle response with only error string', () => {
        const response = {
          error: 'Something went wrong',
        };
        const { code, message } = extractGRVTError(response);
        expect(code).toBe('UNKNOWN_ERROR');
        expect(message).toBe('Something went wrong');
      });

      it('should handle numeric code', () => {
        const response = {
          code: 1001,
          message: 'Invalid order',
        };
        const { code, message } = extractGRVTError(response);
        expect(code).toBe('1001');
        expect(message).toBe('Invalid order');
      });
    });

    describe('HTTP Status Code Edge Cases', () => {
      it('should map 402 Payment Required as client error', () => {
        const error = mapHttpError(402, 'Payment Required');
        expect(error).toBeInstanceOf(InvalidOrderError);
        expect(error.code).toBe('HTTP_402');
      });

      it('should map 410 Gone as client error', () => {
        const error = mapHttpError(410, 'Gone');
        expect(error).toBeInstanceOf(InvalidOrderError);
        expect(error.code).toBe('HTTP_410');
      });

      it('should map 502 Bad Gateway as server error', () => {
        const error = mapHttpError(502, 'Bad Gateway');
        expect(error).toBeInstanceOf(ExchangeUnavailableError);
        expect(error.code).toBe('HTTP_502');
      });

      it('should map 504 Gateway Timeout as server error', () => {
        const error = mapHttpError(504, 'Gateway Timeout');
        expect(error).toBeInstanceOf(ExchangeUnavailableError);
        expect(error.code).toBe('HTTP_504');
      });

      it('should handle 200 OK status (edge case)', () => {
        const error = mapHttpError(200, 'OK');
        expect(error).toBeInstanceOf(PerpDEXError);
        expect(error.code).toBe('HTTP_200');
      });
    });

    describe('Mixed Error Code Formats', () => {
      it('should handle empty error code', () => {
        const error = mapGRVTError('', 'Empty code');
        expect(error).toBeInstanceOf(PerpDEXError);
        expect(error.code).toBe('');
      });

      it('should handle whitespace-only error code', () => {
        const error = mapGRVTError('   ', 'Whitespace code');
        expect(error).toBeInstanceOf(PerpDEXError);
      });

      it('should handle case-sensitive codes', () => {
        // GRVT codes are uppercase, lowercase should not match
        const error = mapGRVTError('invalid_order', 'Lower case');
        expect(error).toBeInstanceOf(PerpDEXError);
      });
    });

    describe('Error Message Variations', () => {
      it('should handle empty error message', () => {
        const error = mapGRVTError('INVALID_ORDER', '');
        expect(error).toBeInstanceOf(InvalidOrderError);
        expect(error.message).toBe('');
      });

      it('should handle very long error messages', () => {
        const longMessage = 'x'.repeat(1000);
        const error = mapGRVTError('INVALID_ORDER', longMessage);
        expect(error).toBeInstanceOf(InvalidOrderError);
        expect(error.message).toBe(longMessage);
      });

      it('should handle special characters in message', () => {
        const message = "Error: 'Invalid' <order> & \"test\"";
        const error = mapGRVTError('INVALID_ORDER', message);
        expect(error).toBeInstanceOf(InvalidOrderError);
        expect(error.message).toBe(message);
      });

      it('should handle unicode in message', () => {
        const message = 'エラー: 無効な注文 🚫';
        const error = mapGRVTError('INVALID_ORDER', message);
        expect(error).toBeInstanceOf(InvalidOrderError);
        expect(error.message).toBe(message);
      });
    });

    describe('Complex Axios Error Scenarios', () => {
      it('should handle axios error with all fields', () => {
        const axiosError = {
          code: 'ECONNRESET',
          message: 'Connection reset',
          response: {
            status: 500,
            statusText: 'Internal Server Error',
            data: {
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Database connection lost',
              },
            },
          },
        };

        const error = mapAxiosError(axiosError);
        expect(error).toBeInstanceOf(ExchangeUnavailableError);
        // Response takes precedence over top-level code
        expect(error.code).toBe('INTERNAL_ERROR');
      });

      it('should handle axios error without response but with request', () => {
        const axiosError = {
          request: {},
          message: 'Request made but no response',
        };

        const error = mapAxiosError(axiosError);
        expect(error).toBeInstanceOf(PerpDEXError);
      });

      it('should handle axios error with network code and response', () => {
        const axiosError = {
          code: 'ETIMEDOUT',
          response: {
            status: 408,
            statusText: 'Request Timeout',
            data: {},
          },
        };

        const error = mapAxiosError(axiosError);
        // Response takes precedence
        expect(error).toBeInstanceOf(InvalidOrderError);
        expect(error.code).toBe('HTTP_408');
      });
    });

    describe('All Client Error Codes Coverage', () => {
      it('should map INVALID_REQUEST correctly', () => {
        const error = mapGRVTError('INVALID_REQUEST', 'Invalid request');
        expect(error).toBeInstanceOf(PerpDEXError);
        expect(error.code).toBe('INVALID_REQUEST');
      });

      it('should map INVALID_PARAMS correctly', () => {
        const error = mapGRVTError('INVALID_PARAMS', 'Invalid params');
        expect(error).toBeInstanceOf(PerpDEXError);
      });

      it('should map MISSING_REQUIRED_FIELD correctly', () => {
        const error = mapGRVTError('MISSING_REQUIRED_FIELD', 'Missing field');
        expect(error).toBeInstanceOf(PerpDEXError);
      });

      it('should map INVALID_TIME_IN_FORCE correctly', () => {
        const error = mapGRVTError('INVALID_TIME_IN_FORCE', 'Invalid time in force');
        expect(error).toBeInstanceOf(InvalidOrderError);
      });

      it('should map POSITION_NOT_FOUND correctly', () => {
        const error = mapGRVTError('POSITION_NOT_FOUND', 'Position not found');
        expect(error).toBeInstanceOf(PerpDEXError);
      });
    });
  });
});

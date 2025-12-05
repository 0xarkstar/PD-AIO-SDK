/**
 * Unit Tests for Nado Error Handling
 *
 * Tests error classification, mapping, and retry logic.
 */

import { describe, it, expect } from '@jest/globals';
import {
  mapNadoError,
  extractNadoError,
  mapHttpError,
  isClientError,
  isServerError,
  isNetworkError,
  isRetryableError,
  NADO_CLIENT_ERRORS,
  NADO_SERVER_ERRORS,
  NADO_RATE_LIMIT_ERROR,
  NADO_NETWORK_ERRORS,
} from '../../src/adapters/nado/errors.js';
import {
  PerpDEXError,
  InvalidOrderError,
  InsufficientMarginError,
  OrderNotFoundError,
  InvalidSignatureError,
  RateLimitError,
  ExchangeUnavailableError,
} from '../../src/types/errors.js';

describe('Nado Error Handling', () => {
  // ===========================================================================
  // Error Classification
  // ===========================================================================

  describe('isClientError', () => {
    it('should identify client errors correctly', () => {
      expect(isClientError(NADO_CLIENT_ERRORS.INVALID_ORDER)).toBe(true);
      expect(isClientError(NADO_CLIENT_ERRORS.INSUFFICIENT_MARGIN)).toBe(true);
      expect(isClientError(NADO_CLIENT_ERRORS.INVALID_SIGNATURE)).toBe(true);
      expect(isClientError(NADO_CLIENT_ERRORS.ORDER_NOT_FOUND)).toBe(true);
    });

    it('should return false for non-client errors', () => {
      expect(isClientError(NADO_SERVER_ERRORS.INTERNAL_ERROR)).toBe(false);
      expect(isClientError(NADO_RATE_LIMIT_ERROR)).toBe(false);
      expect(isClientError('UNKNOWN_ERROR')).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should identify server errors correctly', () => {
      expect(isServerError(NADO_SERVER_ERRORS.INTERNAL_ERROR)).toBe(true);
      expect(isServerError(NADO_SERVER_ERRORS.SERVICE_UNAVAILABLE)).toBe(true);
      expect(isServerError(NADO_SERVER_ERRORS.TIMEOUT)).toBe(true);
      expect(isServerError(NADO_SERVER_ERRORS.DATABASE_ERROR)).toBe(true);
    });

    it('should return false for non-server errors', () => {
      expect(isServerError(NADO_CLIENT_ERRORS.INVALID_ORDER)).toBe(false);
      expect(isServerError('UNKNOWN_ERROR')).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('should identify network errors correctly', () => {
      expect(isNetworkError(NADO_NETWORK_ERRORS.ECONNRESET)).toBe(true);
      expect(isNetworkError(NADO_NETWORK_ERRORS.ETIMEDOUT)).toBe(true);
      expect(isNetworkError(NADO_NETWORK_ERRORS.ENOTFOUND)).toBe(true);
      expect(isNetworkError(NADO_NETWORK_ERRORS.ECONNREFUSED)).toBe(true);
    });

    it('should return false for non-network errors', () => {
      expect(isNetworkError(NADO_CLIENT_ERRORS.INVALID_ORDER)).toBe(false);
      expect(isNetworkError('UNKNOWN_ERROR')).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors (server)', () => {
      expect(isRetryableError(NADO_SERVER_ERRORS.INTERNAL_ERROR)).toBe(true);
      expect(isRetryableError(NADO_SERVER_ERRORS.SERVICE_UNAVAILABLE)).toBe(true);
    });

    it('should identify retryable errors (network)', () => {
      expect(isRetryableError(NADO_NETWORK_ERRORS.ECONNRESET)).toBe(true);
      expect(isRetryableError(NADO_NETWORK_ERRORS.ETIMEDOUT)).toBe(true);
    });

    it('should identify retryable errors (rate limit)', () => {
      expect(isRetryableError(NADO_RATE_LIMIT_ERROR)).toBe(true);
    });

    it('should identify non-retryable errors (client)', () => {
      expect(isRetryableError(NADO_CLIENT_ERRORS.INVALID_ORDER)).toBe(false);
      expect(isRetryableError(NADO_CLIENT_ERRORS.INSUFFICIENT_MARGIN)).toBe(false);
      expect(isRetryableError(NADO_CLIENT_ERRORS.INVALID_SIGNATURE)).toBe(false);
    });

    it('should identify unknown errors as non-retryable', () => {
      expect(isRetryableError('UNKNOWN_ERROR')).toBe(false);
    });
  });

  // ===========================================================================
  // Error Mapping
  // ===========================================================================

  describe('mapNadoError', () => {
    describe('signature errors', () => {
      it('should map invalid_signature to InvalidSignatureError', () => {
        const error = mapNadoError(
          NADO_CLIENT_ERRORS.INVALID_SIGNATURE,
          'Signature verification failed'
        );

        expect(error).toBeInstanceOf(InvalidSignatureError);
        expect(error.message).toContain('Signature verification failed');
        expect(error.exchange).toBe('nado');
      });

      it('should map expired_signature to InvalidSignatureError', () => {
        const error = mapNadoError(
          NADO_CLIENT_ERRORS.EXPIRED_SIGNATURE,
          'Signature has expired'
        );

        expect(error).toBeInstanceOf(InvalidSignatureError);
      });
    });

    describe('margin errors', () => {
      it('should map insufficient_margin to InsufficientMarginError', () => {
        const error = mapNadoError(
          NADO_CLIENT_ERRORS.INSUFFICIENT_MARGIN,
          'Not enough margin to place order'
        );

        expect(error).toBeInstanceOf(InsufficientMarginError);
        expect(error.message).toContain('Not enough margin');
      });
    });

    describe('order errors', () => {
      it('should map order_not_found to OrderNotFoundError', () => {
        const error = mapNadoError(
          NADO_CLIENT_ERRORS.ORDER_NOT_FOUND,
          'Order does not exist'
        );

        expect(error).toBeInstanceOf(OrderNotFoundError);
      });

      it('should map invalid_order to InvalidOrderError', () => {
        const error = mapNadoError(
          NADO_CLIENT_ERRORS.INVALID_ORDER,
          'Order validation failed'
        );

        expect(error).toBeInstanceOf(InvalidOrderError);
      });

      it('should map order_expired to InvalidOrderError', () => {
        const error = mapNadoError(
          NADO_CLIENT_ERRORS.ORDER_EXPIRED,
          'Order has expired'
        );

        expect(error).toBeInstanceOf(InvalidOrderError);
      });

      it('should map invalid_price to InvalidOrderError', () => {
        const error = mapNadoError(
          NADO_CLIENT_ERRORS.INVALID_PRICE,
          'Price out of range'
        );

        expect(error).toBeInstanceOf(InvalidOrderError);
      });

      it('should map invalid_amount to InvalidOrderError', () => {
        const error = mapNadoError(
          NADO_CLIENT_ERRORS.INVALID_AMOUNT,
          'Amount too small'
        );

        expect(error).toBeInstanceOf(InvalidOrderError);
      });

      it('should map min_size_not_met to InvalidOrderError', () => {
        const error = mapNadoError(
          NADO_CLIENT_ERRORS.MIN_SIZE_NOT_MET,
          'Order size below minimum'
        );

        expect(error).toBeInstanceOf(InvalidOrderError);
      });

      it('should map max_size_exceeded to InvalidOrderError', () => {
        const error = mapNadoError(
          NADO_CLIENT_ERRORS.MAX_SIZE_EXCEEDED,
          'Order size exceeds maximum'
        );

        expect(error).toBeInstanceOf(InvalidOrderError);
      });

      it('should map invalid_nonce to InvalidOrderError', () => {
        const error = mapNadoError(
          NADO_CLIENT_ERRORS.INVALID_NONCE,
          'Nonce already used'
        );

        expect(error).toBeInstanceOf(InvalidOrderError);
      });
    });

    describe('rate limit errors', () => {
      it('should map rate_limit_exceeded to RateLimitError', () => {
        const error = mapNadoError(
          NADO_RATE_LIMIT_ERROR,
          'Too many requests'
        );

        expect(error).toBeInstanceOf(RateLimitError);
        expect(error.message).toContain('Too many requests');
      });

      it('should pass undefined for retryAfter parameter', () => {
        const error = mapNadoError(
          NADO_RATE_LIMIT_ERROR,
          'Rate limit exceeded'
        ) as RateLimitError;

        expect(error).toBeInstanceOf(RateLimitError);
        expect(error.retryAfter).toBeUndefined();
      });
    });

    describe('server/network errors', () => {
      it('should map server errors to ExchangeUnavailableError', () => {
        const error = mapNadoError(
          NADO_SERVER_ERRORS.INTERNAL_ERROR,
          'Internal server error'
        );

        expect(error).toBeInstanceOf(ExchangeUnavailableError);
      });

      it('should map network errors to ExchangeUnavailableError', () => {
        const error = mapNadoError(
          NADO_NETWORK_ERRORS.ECONNRESET,
          'Connection reset'
        );

        expect(error).toBeInstanceOf(ExchangeUnavailableError);
      });
    });

    describe('unknown errors', () => {
      it('should map unknown errors to generic PerpDEXError', () => {
        const error = mapNadoError(
          'UNKNOWN_ERROR_CODE',
          'Something went wrong'
        );

        expect(error).toBeInstanceOf(PerpDEXError);
        expect(error.message).toContain('Something went wrong');
        expect(error.code).toBe('UNKNOWN_ERROR_CODE');
      });
    });

    describe('numeric error codes', () => {
      it('should handle numeric error codes', () => {
        const error = mapNadoError(
          400,
          'Bad request'
        );

        expect(error).toBeInstanceOf(PerpDEXError);
        expect(error.code).toBe('400');
      });
    });

    describe('originalError preservation', () => {
      it('should preserve original error', () => {
        const originalError = new Error('Original error');
        const error = mapNadoError(
          NADO_CLIENT_ERRORS.INVALID_ORDER,
          'Order validation failed',
          originalError
        );

        expect(error.originalError).toBe(originalError);
      });
    });
  });

  // ===========================================================================
  // extractNadoError
  // ===========================================================================

  describe('extractNadoError', () => {
    it('should extract error code and message from response', () => {
      const response = {
        error_code: 'invalid_order',
        error: 'Order validation failed',
      };

      const { code, message } = extractNadoError(response);

      expect(code).toBe('invalid_order');
      expect(message).toBe('Order validation failed');
    });

    it('should handle numeric error codes', () => {
      const response = {
        error_code: 400,
        error: 'Bad request',
      };

      const { code, message } = extractNadoError(response);

      expect(code).toBe('400');
      expect(message).toBe('Bad request');
    });

    it('should use default code if missing', () => {
      const response = {
        error: 'Something went wrong',
      };

      const { code, message } = extractNadoError(response);

      expect(code).toBe('UNKNOWN_ERROR');
      expect(message).toBe('Something went wrong');
    });

    it('should use default message if missing', () => {
      const response = {
        error_code: 'test_error',
      };

      const { code, message } = extractNadoError(response);

      expect(code).toBe('test_error');
      expect(message).toBe('Unknown error occurred');
    });

    it('should handle message field as fallback', () => {
      const response = {
        error_code: 'test_error',
        message: 'Fallback message',
      };

      const { code, message } = extractNadoError(response);

      expect(code).toBe('test_error');
      expect(message).toBe('Fallback message');
    });

    it('should prefer error field over message field', () => {
      const response = {
        error_code: 'test_error',
        error: 'Primary error message',
        message: 'Fallback message',
      };

      const { code, message } = extractNadoError(response);

      expect(message).toBe('Primary error message');
    });
  });

  // ===========================================================================
  // mapHttpError
  // ===========================================================================

  describe('mapHttpError', () => {
    describe('rate limit errors (429)', () => {
      it('should map 429 to RateLimitError', () => {
        const error = mapHttpError(429, 'Too Many Requests');

        expect(error).toBeInstanceOf(RateLimitError);
        expect(error.message).toContain('Rate limit exceeded');
        expect(error.code).toBe(NADO_RATE_LIMIT_ERROR);
      });

      it('should pass undefined for retryAfter parameter', () => {
        const error = mapHttpError(429, 'Too Many Requests') as RateLimitError;

        expect(error.retryAfter).toBeUndefined();
      });
    });

    describe('client errors (4xx)', () => {
      it('should map 400 to InvalidOrderError', () => {
        const error = mapHttpError(400, 'Bad Request');

        expect(error).toBeInstanceOf(InvalidOrderError);
        expect(error.code).toBe('HTTP_400');
      });

      it('should map 401 to InvalidOrderError', () => {
        const error = mapHttpError(401, 'Unauthorized');

        expect(error).toBeInstanceOf(InvalidOrderError);
        expect(error.code).toBe('HTTP_401');
      });

      it('should map 404 to InvalidOrderError', () => {
        const error = mapHttpError(404, 'Not Found');

        expect(error).toBeInstanceOf(InvalidOrderError);
        expect(error.code).toBe('HTTP_404');
      });
    });

    describe('server errors (5xx)', () => {
      it('should map 500 to ExchangeUnavailableError', () => {
        const error = mapHttpError(500, 'Internal Server Error');

        expect(error).toBeInstanceOf(ExchangeUnavailableError);
        expect(error.code).toBe('HTTP_500');
      });

      it('should map 502 to ExchangeUnavailableError', () => {
        const error = mapHttpError(502, 'Bad Gateway');

        expect(error).toBeInstanceOf(ExchangeUnavailableError);
        expect(error.code).toBe('HTTP_502');
      });

      it('should map 503 to ExchangeUnavailableError', () => {
        const error = mapHttpError(503, 'Service Unavailable');

        expect(error).toBeInstanceOf(ExchangeUnavailableError);
        expect(error.code).toBe('HTTP_503');
      });
    });

    describe('other status codes', () => {
      it('should map unknown status to generic PerpDEXError', () => {
        const error = mapHttpError(999, 'Unknown Status');

        expect(error).toBeInstanceOf(PerpDEXError);
        expect(error.code).toBe('HTTP_999');
        expect(error.message).toContain('999');
      });
    });
  });
});

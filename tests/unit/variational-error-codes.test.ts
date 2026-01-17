/**
 * Variational Error Codes Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import { mapError } from '../../src/adapters/variational/utils.js';
import {
  mapVariationalError,
  mapHTTPError,
  extractErrorCode,
  extractErrorCodeFromStatus,
  isClientError,
  isServerError,
  isRetryableError,
} from '../../src/adapters/variational/error-codes.js';
import {
  PerpDEXError,
  InsufficientMarginError,
  InvalidOrderError,
  OrderNotFoundError,
  InvalidSignatureError,
  RateLimitError,
  ExchangeUnavailableError,
  NetworkError,
} from '../../src/types/errors.js';

describe('Variational Error Codes', () => {
  describe('mapError', () => {
    it('should pass through PerpDEXError instances', () => {
      const originalError = new PerpDEXError('Test error', 'INVALID_ORDER', 'variational');

      const result = mapError(originalError);

      expect(result).toBe(originalError);
      expect(result.message).toBe('Test error');
      expect(result.code).toBe('INVALID_ORDER');
      expect(result.exchange).toBe('variational');
    });

    it('should map error with code property', () => {
      const error = {
        code: 'INVALID_SYMBOL',
        message: 'Invalid trading symbol',
      };

      const result = mapError(error);

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.code).toBe('INVALID_SYMBOL');
    });

    it('should map error with status property', () => {
      const error = {
        status: 429,
        message: 'Rate limit exceeded',
      };

      const result = mapError(error);

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should handle errors without code or status', () => {
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
  });

  describe('mapHTTPError', () => {
    it('should map rate limit errors', () => {
      const result = mapHTTPError(429, { error: 'Rate limit exceeded' });

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should map authentication errors - 401', () => {
      const result = mapHTTPError(401, { error: 'Unauthorized' });

      expect(result).toBeInstanceOf(InvalidSignatureError);
      expect(result.code).toBe('UNAUTHORIZED');
    });

    it('should map forbidden errors - 403', () => {
      const result = mapHTTPError(403, { error: 'Forbidden' });

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.code).toBe('FORBIDDEN');
    });

    it('should map bad request errors - 400', () => {
      const result = mapHTTPError(400, { error: 'Invalid parameter' });

      expect(result).toBeInstanceOf(InvalidOrderError);
      expect(result.code).toBe('INVALID_ORDER');
    });

    it('should map not found errors - 404', () => {
      const result = mapHTTPError(404, { error: 'Order not found' });

      expect(result).toBeInstanceOf(OrderNotFoundError);
      expect(result.code).toBe('ORDER_NOT_FOUND');
    });

    it('should map server errors - 500', () => {
      const result = mapHTTPError(500, { error: 'Internal server error' });

      expect(result).toBeInstanceOf(NetworkError);
      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.message).toContain('Internal server error');
    });

    it('should map service unavailable errors - 503', () => {
      const result = mapHTTPError(503, { error: 'Service temporarily unavailable' });

      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('should include error message from response data', () => {
      const result = mapHTTPError(400, { error: 'Custom error message from API' });

      expect(result.message).toContain('Custom error message from API');
    });

    it('should handle response data with message field', () => {
      const result = mapHTTPError(400, { message: 'Error message in message field' });

      expect(result.message).toContain('Error message in message field');
    });

    it('should use HTTP status as message fallback', () => {
      const result = mapHTTPError(400, {});

      expect(result.message).toBe('HTTP 400');
    });
  });

  describe('mapVariationalError', () => {
    it('should map insufficient margin error', () => {
      const result = mapVariationalError('INSUFFICIENT_MARGIN', 'Insufficient margin');

      expect(result).toBeInstanceOf(InsufficientMarginError);
      expect(result.code).toBe('INSUFFICIENT_MARGIN');
    });

    it('should map invalid signature error', () => {
      const result = mapVariationalError('INVALID_SIGNATURE', 'Invalid signature');

      expect(result).toBeInstanceOf(InvalidSignatureError);
      expect(result.code).toBe('INVALID_SIGNATURE');
    });

    it('should map invalid order error', () => {
      const result = mapVariationalError('INVALID_ORDER', 'Invalid order');

      expect(result).toBeInstanceOf(InvalidOrderError);
      expect(result.code).toBe('INVALID_ORDER');
    });

    it('should map quote expired error', () => {
      const result = mapVariationalError('QUOTE_EXPIRED', 'Quote expired');

      expect(result).toBeInstanceOf(InvalidOrderError);
      expect(result.code).toBe('QUOTE_EXPIRED');
    });

    it('should map quote not found error', () => {
      const result = mapVariationalError('QUOTE_NOT_FOUND', 'Quote not found');

      expect(result).toBeInstanceOf(OrderNotFoundError);
      expect(result.code).toBe('QUOTE_NOT_FOUND');
    });

    it('should map rate limit error', () => {
      const result = mapVariationalError('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded');

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should map service unavailable error', () => {
      const result = mapVariationalError('SERVICE_UNAVAILABLE', 'Service unavailable');

      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('should map internal error', () => {
      const result = mapVariationalError('INTERNAL_ERROR', 'Internal server error');

      expect(result).toBeInstanceOf(NetworkError);
      expect(result.code).toBe('INTERNAL_ERROR');
    });

    it('should map HTTP status codes', () => {
      const result = mapVariationalError(404, 'Not found');

      expect(result).toBeInstanceOf(OrderNotFoundError);
      expect(result.code).toBe('ORDER_NOT_FOUND');
    });

    it('should include context in error', () => {
      const context = { userId: '123', timestamp: 1234567890 };
      const result = mapVariationalError('INVALID_ORDER', 'Invalid order', context);

      expect(result.originalError).toEqual(context);
    });

    it('should return generic PerpDEXError for unknown codes', () => {
      const result = mapVariationalError('UNKNOWN_CODE', 'Unknown error');

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.code).toBe('UNKNOWN_CODE');
    });
  });

  describe('extractErrorCode', () => {
    it('should extract error code from insufficient margin message', () => {
      expect(extractErrorCode('Insufficient margin to open position')).toBe('INSUFFICIENT_MARGIN');
      expect(extractErrorCode('insufficient balance')).toBe('INSUFFICIENT_MARGIN');
    });

    it('should extract error code from signature messages', () => {
      expect(extractErrorCode('Invalid signature provided')).toBe('INVALID_SIGNATURE');
      expect(extractErrorCode('Signature verification failed')).toBe('INVALID_SIGNATURE');
    });

    it('should extract error code from order messages', () => {
      expect(extractErrorCode('Invalid order parameters')).toBe('INVALID_ORDER');
      expect(extractErrorCode('invalid symbol provided')).toBe('INVALID_SYMBOL');
      expect(extractErrorCode('invalid amount specified')).toBe('INVALID_AMOUNT');
      expect(extractErrorCode('invalid price')).toBe('INVALID_PRICE');
    });

    it('should extract error code from quote messages', () => {
      expect(extractErrorCode('Quote not found')).toBe('QUOTE_NOT_FOUND');
      expect(extractErrorCode('Quote expired')).toBe('QUOTE_EXPIRED');
      expect(extractErrorCode('quote expired, please request new')).toBe('QUOTE_EXPIRED');
    });

    it('should extract error code from rate limit messages', () => {
      expect(extractErrorCode('Rate limit exceeded')).toBe('RATE_LIMIT_EXCEEDED');
      expect(extractErrorCode('Too many requests')).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should extract error code from server error messages', () => {
      expect(extractErrorCode('Internal server error')).toBe('INTERNAL_ERROR');
      expect(extractErrorCode('Service unavailable')).toBe('SERVICE_UNAVAILABLE');
      expect(extractErrorCode('Request timeout')).toBe('TIMEOUT');
      expect(extractErrorCode('Matching engine error')).toBe('MATCHING_ENGINE_ERROR');
    });

    it('should return UNKNOWN_ERROR for unrecognized messages', () => {
      expect(extractErrorCode('Some random error')).toBe('UNKNOWN_ERROR');
      expect(extractErrorCode('')).toBe('UNKNOWN_ERROR');
    });

    it('should handle case insensitivity', () => {
      expect(extractErrorCode('INVALID ORDER')).toBe('INVALID_ORDER');
      expect(extractErrorCode('InVaLiD oRdEr')).toBe('INVALID_ORDER');
    });
  });

  describe('extractErrorCodeFromStatus', () => {
    it('should extract error codes from HTTP statuses', () => {
      expect(extractErrorCodeFromStatus(400)).toBe('INVALID_ORDER');
      expect(extractErrorCodeFromStatus(401)).toBe('UNAUTHORIZED');
      expect(extractErrorCodeFromStatus(403)).toBe('FORBIDDEN');
      expect(extractErrorCodeFromStatus(404)).toBe('ORDER_NOT_FOUND');
      expect(extractErrorCodeFromStatus(429)).toBe('RATE_LIMIT_EXCEEDED');
      expect(extractErrorCodeFromStatus(500)).toBe('INTERNAL_ERROR');
      expect(extractErrorCodeFromStatus(502)).toBe('SERVICE_UNAVAILABLE');
      expect(extractErrorCodeFromStatus(503)).toBe('SERVICE_UNAVAILABLE');
      expect(extractErrorCodeFromStatus(504)).toBe('TIMEOUT');
    });

    it('should return UNKNOWN_ERROR for unmapped statuses', () => {
      expect(extractErrorCodeFromStatus(418)).toBe('UNKNOWN_ERROR');
      expect(extractErrorCodeFromStatus(999)).toBe('UNKNOWN_ERROR');
    });
  });

  describe('isClientError', () => {
    it('should return true for client error codes', () => {
      expect(isClientError('INSUFFICIENT_MARGIN')).toBe(true);
      expect(isClientError('INVALID_SIGNATURE')).toBe(true);
      expect(isClientError('INVALID_ORDER')).toBe(true);
      expect(isClientError('ORDER_NOT_FOUND')).toBe(true);
      expect(isClientError('QUOTE_EXPIRED')).toBe(true);
      expect(isClientError('UNAUTHORIZED')).toBe(true);
    });

    it('should return false for server error codes', () => {
      expect(isClientError('INTERNAL_ERROR')).toBe(false);
      expect(isClientError('SERVICE_UNAVAILABLE')).toBe(false);
      expect(isClientError('TIMEOUT')).toBe(false);
    });

    it('should return false for unknown codes', () => {
      expect(isClientError('UNKNOWN_CODE')).toBe(false);
      expect(isClientError('RATE_LIMIT_EXCEEDED')).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should return true for server error codes', () => {
      expect(isServerError('INTERNAL_ERROR')).toBe(true);
      expect(isServerError('SERVICE_UNAVAILABLE')).toBe(true);
      expect(isServerError('TIMEOUT')).toBe(true);
      expect(isServerError('MATCHING_ENGINE_ERROR')).toBe(true);
    });

    it('should return false for client error codes', () => {
      expect(isServerError('INSUFFICIENT_MARGIN')).toBe(false);
      expect(isServerError('INVALID_ORDER')).toBe(false);
      expect(isServerError('UNAUTHORIZED')).toBe(false);
    });

    it('should return false for unknown codes', () => {
      expect(isServerError('UNKNOWN_CODE')).toBe(false);
      expect(isServerError('RATE_LIMIT_EXCEEDED')).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for server errors', () => {
      expect(isRetryableError('INTERNAL_ERROR')).toBe(true);
      expect(isRetryableError('SERVICE_UNAVAILABLE')).toBe(true);
      expect(isRetryableError('TIMEOUT')).toBe(true);
    });

    it('should return true for rate limit errors', () => {
      expect(isRetryableError('RATE_LIMIT_EXCEEDED')).toBe(true);
    });

    it('should return false for client errors', () => {
      expect(isRetryableError('INSUFFICIENT_MARGIN')).toBe(false);
      expect(isRetryableError('INVALID_ORDER')).toBe(false);
      expect(isRetryableError('UNAUTHORIZED')).toBe(false);
      expect(isRetryableError('QUOTE_EXPIRED')).toBe(false);
    });

    it('should return false for unknown codes', () => {
      expect(isRetryableError('UNKNOWN_CODE')).toBe(false);
    });
  });
});

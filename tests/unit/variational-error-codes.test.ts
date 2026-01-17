/**
 * Variational Error Codes Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  VARIATIONAL_CLIENT_ERRORS,
  VARIATIONAL_SERVER_ERRORS,
  VARIATIONAL_RATE_LIMIT_ERROR,
  VARIATIONAL_HTTP_ERROR_CODES,
  isClientError,
  isServerError,
  isRetryableError,
  extractErrorCode,
  extractErrorCodeFromStatus,
  mapVariationalError,
  mapHTTPError,
} from '../../src/adapters/variational/error-codes.js';
import {
  PerpDEXError,
  InvalidOrderError,
  InsufficientMarginError,
  OrderNotFoundError,
  InvalidSignatureError,
  RateLimitError,
  ExchangeUnavailableError,
  NetworkError,
} from '../../src/types/errors.js';

describe('Variational Error Codes', () => {
  describe('Error Code Constants', () => {
    it('should have client error codes defined', () => {
      expect(VARIATIONAL_CLIENT_ERRORS.INSUFFICIENT_MARGIN).toBe('INSUFFICIENT_MARGIN');
      expect(VARIATIONAL_CLIENT_ERRORS.INVALID_ORDER).toBe('INVALID_ORDER');
      expect(VARIATIONAL_CLIENT_ERRORS.ORDER_NOT_FOUND).toBe('ORDER_NOT_FOUND');
      expect(VARIATIONAL_CLIENT_ERRORS.QUOTE_EXPIRED).toBe('QUOTE_EXPIRED');
      expect(VARIATIONAL_CLIENT_ERRORS.UNAUTHORIZED).toBe('UNAUTHORIZED');
    });

    it('should have server error codes defined', () => {
      expect(VARIATIONAL_SERVER_ERRORS.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(VARIATIONAL_SERVER_ERRORS.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
      expect(VARIATIONAL_SERVER_ERRORS.TIMEOUT).toBe('TIMEOUT');
    });

    it('should have rate limit error code defined', () => {
      expect(VARIATIONAL_RATE_LIMIT_ERROR).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should have HTTP error codes mapped', () => {
      expect(VARIATIONAL_HTTP_ERROR_CODES[400]).toBe('INVALID_ORDER');
      expect(VARIATIONAL_HTTP_ERROR_CODES[401]).toBe('UNAUTHORIZED');
      expect(VARIATIONAL_HTTP_ERROR_CODES[429]).toBe('RATE_LIMIT_EXCEEDED');
      expect(VARIATIONAL_HTTP_ERROR_CODES[500]).toBe('INTERNAL_ERROR');
    });
  });

  describe('isClientError', () => {
    it('should return true for client errors', () => {
      expect(isClientError('INSUFFICIENT_MARGIN')).toBe(true);
      expect(isClientError('INVALID_ORDER')).toBe(true);
      expect(isClientError('QUOTE_EXPIRED')).toBe(true);
    });

    it('should return false for server errors', () => {
      expect(isClientError('INTERNAL_ERROR')).toBe(false);
      expect(isClientError('SERVICE_UNAVAILABLE')).toBe(false);
    });

    it('should return false for unknown codes', () => {
      expect(isClientError('UNKNOWN')).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should return true for server errors', () => {
      expect(isServerError('INTERNAL_ERROR')).toBe(true);
      expect(isServerError('SERVICE_UNAVAILABLE')).toBe(true);
      expect(isServerError('TIMEOUT')).toBe(true);
    });

    it('should return false for client errors', () => {
      expect(isServerError('INSUFFICIENT_MARGIN')).toBe(false);
      expect(isServerError('INVALID_ORDER')).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for server errors', () => {
      expect(isRetryableError('INTERNAL_ERROR')).toBe(true);
      expect(isRetryableError('SERVICE_UNAVAILABLE')).toBe(true);
    });

    it('should return true for rate limit error', () => {
      expect(isRetryableError('RATE_LIMIT_EXCEEDED')).toBe(true);
    });

    it('should return false for client errors', () => {
      expect(isRetryableError('INSUFFICIENT_MARGIN')).toBe(false);
      expect(isRetryableError('INVALID_ORDER')).toBe(false);
    });
  });

  describe('extractErrorCode', () => {
    it('should extract insufficient margin error', () => {
      expect(extractErrorCode('Insufficient margin for order')).toBe('INSUFFICIENT_MARGIN');
      expect(extractErrorCode('Insufficient balance')).toBe('INSUFFICIENT_MARGIN');
    });

    it('should extract invalid order error', () => {
      expect(extractErrorCode('Invalid order parameters')).toBe('INVALID_ORDER');
    });

    it('should extract signature errors', () => {
      expect(extractErrorCode('Invalid signature')).toBe('INVALID_SIGNATURE');
      expect(extractErrorCode('Signature verification failed')).toBe('INVALID_SIGNATURE');
    });

    it('should extract quote errors', () => {
      expect(extractErrorCode('Quote not found')).toBe('QUOTE_NOT_FOUND');
      expect(extractErrorCode('Quote expired')).toBe('QUOTE_EXPIRED');
    });

    it('should extract rate limit error', () => {
      expect(extractErrorCode('Rate limit exceeded')).toBe('RATE_LIMIT_EXCEEDED');
      expect(extractErrorCode('Too many requests')).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should return UNKNOWN_ERROR for unrecognized messages', () => {
      expect(extractErrorCode('Some random error')).toBe('UNKNOWN_ERROR');
    });
  });

  describe('extractErrorCodeFromStatus', () => {
    it('should extract code from HTTP status', () => {
      expect(extractErrorCodeFromStatus(400)).toBe('INVALID_ORDER');
      expect(extractErrorCodeFromStatus(401)).toBe('UNAUTHORIZED');
      expect(extractErrorCodeFromStatus(429)).toBe('RATE_LIMIT_EXCEEDED');
      expect(extractErrorCodeFromStatus(500)).toBe('INTERNAL_ERROR');
    });

    it('should return UNKNOWN_ERROR for unmapped status', () => {
      expect(extractErrorCodeFromStatus(418)).toBe('UNKNOWN_ERROR');
    });
  });

  describe('mapVariationalError', () => {
    it('should map insufficient margin error', () => {
      expect(mapVariationalError('INSUFFICIENT_MARGIN', 'Margin error')).toBeInstanceOf(InsufficientMarginError);
    });

    it('should map auth errors', () => {
      expect(mapVariationalError('INVALID_SIGNATURE', 'Sig error')).toBeInstanceOf(InvalidSignatureError);
      expect(mapVariationalError('INVALID_API_KEY', 'API key error')).toBeInstanceOf(InvalidSignatureError);
      expect(mapVariationalError('UNAUTHORIZED', 'Unauthorized')).toBeInstanceOf(InvalidSignatureError);
    });

    it('should map invalid order errors', () => {
      expect(mapVariationalError('INVALID_ORDER', 'Order error')).toBeInstanceOf(InvalidOrderError);
      expect(mapVariationalError('INVALID_SYMBOL', 'Symbol error')).toBeInstanceOf(InvalidOrderError);
      expect(mapVariationalError('INVALID_AMOUNT', 'Amount error')).toBeInstanceOf(InvalidOrderError);
      expect(mapVariationalError('INVALID_PRICE', 'Price error')).toBeInstanceOf(InvalidOrderError);
      expect(mapVariationalError('QUOTE_EXPIRED', 'Expired')).toBeInstanceOf(InvalidOrderError);
    });

    it('should map order not found errors', () => {
      expect(mapVariationalError('ORDER_NOT_FOUND', 'Not found')).toBeInstanceOf(OrderNotFoundError);
      expect(mapVariationalError('QUOTE_NOT_FOUND', 'Not found')).toBeInstanceOf(OrderNotFoundError);
    });

    it('should map rate limit error', () => {
      expect(mapVariationalError('RATE_LIMIT_EXCEEDED', 'Rate limited')).toBeInstanceOf(RateLimitError);
    });

    it('should map unavailable errors', () => {
      expect(mapVariationalError('SERVICE_UNAVAILABLE', 'Down')).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapVariationalError('TIMEOUT', 'Timeout')).toBeInstanceOf(ExchangeUnavailableError);
    });

    it('should map network errors', () => {
      expect(mapVariationalError('INTERNAL_ERROR', 'Error')).toBeInstanceOf(NetworkError);
      expect(mapVariationalError('MATCHING_ENGINE_ERROR', 'Error')).toBeInstanceOf(NetworkError);
    });

    it('should map unknown errors to generic PerpDEXError', () => {
      expect(mapVariationalError('UNKNOWN', 'Unknown')).toBeInstanceOf(PerpDEXError);
    });

    it('should accept numeric HTTP status codes', () => {
      expect(mapVariationalError(429, 'Rate limited')).toBeInstanceOf(RateLimitError);
      expect(mapVariationalError(500, 'Error')).toBeInstanceOf(NetworkError);
    });
  });

  describe('mapHTTPError', () => {
    it('should map from body code', () => {
      const error = mapHTTPError(400, { code: 'INSUFFICIENT_MARGIN', message: 'Margin error' });
      expect(error).toBeInstanceOf(InsufficientMarginError);
    });

    it('should use HTTP status when no code in body', () => {
      const error = mapHTTPError(429, { message: 'Rate limited' });
      expect(error).toBeInstanceOf(RateLimitError);
    });

    it('should handle body with error property', () => {
      const error = mapHTTPError(500, { error: 'Internal server error' });
      expect(error).toBeInstanceOf(NetworkError);
    });

    it('should handle empty body', () => {
      const error = mapHTTPError(404, null);
      expect(error).toBeInstanceOf(OrderNotFoundError);
    });
  });
});

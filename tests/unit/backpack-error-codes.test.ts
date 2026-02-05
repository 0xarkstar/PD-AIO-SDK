/**
 * Backpack Error Codes Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  BACKPACK_CLIENT_ERRORS,
  BACKPACK_SERVER_ERRORS,
  BACKPACK_RATE_LIMIT_ERROR,
  BACKPACK_NETWORK_ERRORS,
  isClientError,
  isServerError,
  isNetworkError,
  isRetryableError,
  mapBackpackError,
  extractBackpackError,
  mapHttpError,
} from '../../src/adapters/backpack/error-codes.js';
import {
  PerpDEXError,
  InvalidOrderError,
  InsufficientMarginError,
  OrderNotFoundError,
  PositionNotFoundError,
  InvalidSignatureError,
  ExpiredAuthError,
  RateLimitError,
  ExchangeUnavailableError,
} from '../../src/types/errors.js';

describe('Backpack Error Codes', () => {
  describe('Error Code Constants', () => {
    it('should have client error codes defined', () => {
      expect(BACKPACK_CLIENT_ERRORS.INVALID_ORDER).toBe(1001);
      expect(BACKPACK_CLIENT_ERRORS.INSUFFICIENT_MARGIN).toBe(1002);
      expect(BACKPACK_CLIENT_ERRORS.ORDER_NOT_FOUND).toBe(1003);
      expect(BACKPACK_CLIENT_ERRORS.INVALID_SIGNATURE).toBe(2001);
      expect(BACKPACK_CLIENT_ERRORS.EXPIRED_AUTH).toBe(2002);
    });

    it('should have server error codes defined', () => {
      expect(BACKPACK_SERVER_ERRORS.EXCHANGE_UNAVAILABLE).toBe(5001);
      expect(BACKPACK_SERVER_ERRORS.INTERNAL_ERROR).toBe(5002);
      expect(BACKPACK_SERVER_ERRORS.TIMEOUT).toBe(5004);
    });

    it('should have rate limit error code defined', () => {
      expect(BACKPACK_RATE_LIMIT_ERROR).toBe(4001);
    });

    it('should have network error codes defined', () => {
      expect(BACKPACK_NETWORK_ERRORS.ECONNRESET).toBe('ECONNRESET');
      expect(BACKPACK_NETWORK_ERRORS.ETIMEDOUT).toBe('ETIMEDOUT');
    });
  });

  describe('isClientError', () => {
    it('should return true for client errors', () => {
      expect(isClientError(1001)).toBe(true);
      expect(isClientError(1002)).toBe(true);
      expect(isClientError(2001)).toBe(true);
      expect(isClientError(3001)).toBe(true);
    });

    it('should return true for codes in 1000-3999 range', () => {
      expect(isClientError(1500)).toBe(true);
      expect(isClientError(2500)).toBe(true);
      expect(isClientError(3500)).toBe(true);
    });

    it('should return false for server/rate limit errors', () => {
      expect(isClientError(4001)).toBe(false);
      expect(isClientError(5001)).toBe(false);
    });

    it('should handle string codes', () => {
      expect(isClientError('1001')).toBe(true);
      expect(isClientError('5001')).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should return true for server errors', () => {
      expect(isServerError(5001)).toBe(true);
      expect(isServerError(5002)).toBe(true);
      expect(isServerError(5003)).toBe(true);
      expect(isServerError(5004)).toBe(true);
    });

    it('should return true for codes in 5000+ range', () => {
      expect(isServerError(5500)).toBe(true);
    });

    it('should return false for client errors', () => {
      expect(isServerError(1001)).toBe(false);
      expect(isServerError(2001)).toBe(false);
    });

    it('should handle string codes', () => {
      expect(isServerError('5001')).toBe(true);
    });
  });

  describe('isNetworkError', () => {
    it('should return true for network errors', () => {
      expect(isNetworkError('ECONNRESET')).toBe(true);
      expect(isNetworkError('ETIMEDOUT')).toBe(true);
      expect(isNetworkError('ENOTFOUND')).toBe(true);
      expect(isNetworkError('NETWORK_ERROR')).toBe(true);
    });

    it('should return false for non-network errors', () => {
      expect(isNetworkError('INVALID_ORDER')).toBe(false);
      expect(isNetworkError(1001 as any)).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for server errors', () => {
      expect(isRetryableError(5001)).toBe(true);
      expect(isRetryableError(5002)).toBe(true);
    });

    it('should return true for rate limit error', () => {
      expect(isRetryableError(4001)).toBe(true);
    });

    it('should return true for network errors', () => {
      expect(isRetryableError('ECONNRESET')).toBe(true);
      expect(isRetryableError('ETIMEDOUT')).toBe(true);
    });

    it('should return false for client errors', () => {
      expect(isRetryableError(1001)).toBe(false);
      expect(isRetryableError(2001)).toBe(false);
    });
  });

  describe('mapBackpackError', () => {
    it('should map invalid order errors', () => {
      expect(mapBackpackError(1001, 'Invalid order')).toBeInstanceOf(InvalidOrderError);
      expect(mapBackpackError(1005, 'Invalid price')).toBeInstanceOf(InvalidOrderError);
      expect(mapBackpackError(1006, 'Invalid amount')).toBeInstanceOf(InvalidOrderError);
    });

    it('should map insufficient margin error', () => {
      const error = mapBackpackError(1002, 'Not enough margin');
      expect(error).toBeInstanceOf(InsufficientMarginError);
    });

    it('should map order not found error', () => {
      const error = mapBackpackError(1003, 'Order not found');
      expect(error).toBeInstanceOf(OrderNotFoundError);
    });

    it('should map position not found error', () => {
      const error = mapBackpackError(1004, 'Position not found');
      expect(error).toBeInstanceOf(PositionNotFoundError);
    });

    it('should map invalid signature error', () => {
      expect(mapBackpackError(2001, 'Invalid signature')).toBeInstanceOf(InvalidSignatureError);
    });

    it('should map unknown auth errors to generic error', () => {
      // 2003 INVALID_API_KEY is not specifically mapped, falls to generic
      const error = mapBackpackError(2003, 'Invalid API key');
      expect(error).toBeInstanceOf(PerpDEXError);
    });

    it('should map expired auth error', () => {
      const error = mapBackpackError(2002, 'Auth expired');
      expect(error).toBeInstanceOf(ExpiredAuthError);
    });

    it('should map rate limit error', () => {
      const error = mapBackpackError(4001, 'Rate limited');
      expect(error).toBeInstanceOf(RateLimitError);
    });

    it('should map server errors', () => {
      expect(mapBackpackError(5001, 'Unavailable')).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapBackpackError(5002, 'Internal error')).toBeInstanceOf(ExchangeUnavailableError);
    });

    it('should return generic error for unknown codes', () => {
      const error = mapBackpackError(9999, 'Unknown');
      expect(error).toBeInstanceOf(PerpDEXError);
    });

    it('should map network error string codes to ExchangeUnavailableError (line 209)', () => {
      const error = mapBackpackError('ECONNRESET', 'Connection reset');
      expect(error).toBeInstanceOf(ExchangeUnavailableError);

      const error2 = mapBackpackError('ETIMEDOUT', 'Connection timed out');
      expect(error2).toBeInstanceOf(ExchangeUnavailableError);

      const error3 = mapBackpackError('NETWORK_ERROR', 'Network failure');
      expect(error3).toBeInstanceOf(ExchangeUnavailableError);
    });
  });

  describe('extractBackpackError', () => {
    it('should extract error code from response with code property', () => {
      const response = { code: 1002, message: 'Insufficient margin' };
      const result = extractBackpackError(response);
      expect(result.code).toBe(1002);
      expect(result.message).toBe('Insufficient margin');
    });

    it('should extract from error_code property', () => {
      const response = { error_code: 5001, error_message: 'Server error' };
      const result = extractBackpackError(response);
      expect(result.code).toBe(5001);
    });

    it('should handle responses without error codes', () => {
      const response = { data: 'success' };
      const result = extractBackpackError(response);
      expect(result.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('mapHttpError', () => {
    it('should map 429 to RateLimitError', () => {
      const error = mapHttpError(429, 'Too Many Requests');
      expect(error).toBeInstanceOf(RateLimitError);
    });

    it('should map 4xx to InvalidOrderError', () => {
      expect(mapHttpError(400, 'Bad Request')).toBeInstanceOf(InvalidOrderError);
      expect(mapHttpError(401, 'Unauthorized')).toBeInstanceOf(InvalidOrderError);
    });

    it('should map 5xx to ExchangeUnavailableError', () => {
      expect(mapHttpError(500, 'Internal Error')).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapHttpError(503, 'Service Unavailable')).toBeInstanceOf(ExchangeUnavailableError);
    });

    it('should map other codes to generic PerpDEXError', () => {
      const error = mapHttpError(200, 'OK');
      expect(error).toBeInstanceOf(PerpDEXError);
    });
  });
});

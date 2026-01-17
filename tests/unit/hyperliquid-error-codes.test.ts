/**
 * Hyperliquid Error Codes Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  HYPERLIQUID_CLIENT_ERRORS,
  HYPERLIQUID_SERVER_ERRORS,
  HYPERLIQUID_RATE_LIMIT_ERROR,
  HYPERLIQUID_ERROR_MESSAGES,
  isRetryableError,
  extractErrorCode,
  mapHyperliquidError,
  mapError,
} from '../../src/adapters/hyperliquid/error-codes.js';
import {
  PerpDEXError,
  InvalidOrderError,
  InsufficientMarginError,
  OrderNotFoundError,
  PositionNotFoundError,
  InvalidSignatureError,
  RateLimitError,
  ExchangeUnavailableError,
} from '../../src/types/errors.js';

describe('Hyperliquid Error Codes', () => {
  describe('Error Code Constants', () => {
    it('should define client error codes', () => {
      expect(HYPERLIQUID_CLIENT_ERRORS.INSUFFICIENT_MARGIN).toBe('INSUFFICIENT_MARGIN');
      expect(HYPERLIQUID_CLIENT_ERRORS.INVALID_SIGNATURE).toBe('INVALID_SIGNATURE');
      expect(HYPERLIQUID_CLIENT_ERRORS.INVALID_ORDER).toBe('INVALID_ORDER');
    });

    it('should define server error codes', () => {
      expect(HYPERLIQUID_SERVER_ERRORS.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(HYPERLIQUID_SERVER_ERRORS.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
      expect(HYPERLIQUID_SERVER_ERRORS.TIMEOUT).toBe('TIMEOUT');
    });

    it('should define rate limit error', () => {
      expect(HYPERLIQUID_RATE_LIMIT_ERROR).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('isRetryableError', () => {
    it('should mark rate limit as retryable', () => {
      expect(isRetryableError(HYPERLIQUID_RATE_LIMIT_ERROR)).toBe(true);
    });

    it('should mark server errors as retryable', () => {
      expect(isRetryableError(HYPERLIQUID_SERVER_ERRORS.SERVICE_UNAVAILABLE)).toBe(true);
      expect(isRetryableError(HYPERLIQUID_SERVER_ERRORS.TIMEOUT)).toBe(true);
    });

    it('should not mark client errors as retryable', () => {
      expect(isRetryableError(HYPERLIQUID_CLIENT_ERRORS.INVALID_ORDER)).toBe(false);
      expect(isRetryableError(HYPERLIQUID_CLIENT_ERRORS.INSUFFICIENT_MARGIN)).toBe(false);
    });
  });

  describe('extractErrorCode', () => {
    it('should extract error code from message', () => {
      expect(extractErrorCode('insufficient margin')).toBe(
        HYPERLIQUID_CLIENT_ERRORS.INSUFFICIENT_MARGIN
      );
      expect(extractErrorCode('invalid signature')).toBe(
        HYPERLIQUID_CLIENT_ERRORS.INVALID_SIGNATURE
      );
      expect(extractErrorCode('rate limit exceeded')).toBe(HYPERLIQUID_RATE_LIMIT_ERROR);
    });

    it('should handle case insensitive matching', () => {
      expect(extractErrorCode('INSUFFICIENT MARGIN')).toBe(
        HYPERLIQUID_CLIENT_ERRORS.INSUFFICIENT_MARGIN
      );
    });

    it('should extract from order would immediately match', () => {
      expect(extractErrorCode('Order would immediately match')).toBe(
        HYPERLIQUID_CLIENT_ERRORS.ORDER_WOULD_MATCH
      );
    });

    it('should extract from position does not exist', () => {
      expect(extractErrorCode('Position does not exist')).toBe(
        HYPERLIQUID_CLIENT_ERRORS.POSITION_NOT_FOUND
      );
    });

    it('should extract from order not found', () => {
      expect(extractErrorCode('Order not found')).toBe(
        HYPERLIQUID_CLIENT_ERRORS.ORDER_NOT_FOUND
      );
    });

    it('should extract from too many requests', () => {
      expect(extractErrorCode('Too many requests')).toBe(HYPERLIQUID_RATE_LIMIT_ERROR);
    });

    it('should extract from rate limit', () => {
      expect(extractErrorCode('rate limit')).toBe(HYPERLIQUID_RATE_LIMIT_ERROR);
    });

    it('should detect HTTP 429 status code', () => {
      expect(extractErrorCode('HTTP Error 429')).toBe(HYPERLIQUID_RATE_LIMIT_ERROR);
    });

    it('should detect HTTP 500 status code', () => {
      expect(extractErrorCode('HTTP Error 500')).toBe(HYPERLIQUID_SERVER_ERRORS.SERVICE_UNAVAILABLE);
    });

    it('should detect HTTP 503 status code', () => {
      expect(extractErrorCode('HTTP Error 503')).toBe(HYPERLIQUID_SERVER_ERRORS.SERVICE_UNAVAILABLE);
    });

    it('should return UNKNOWN_ERROR for unrecognized messages', () => {
      expect(extractErrorCode('some random error')).toBe('UNKNOWN_ERROR');
    });
  });

  describe('mapHyperliquidError', () => {
    it('should map insufficient margin error', () => {
      const error = mapHyperliquidError(
        HYPERLIQUID_CLIENT_ERRORS.INSUFFICIENT_MARGIN,
        'Insufficient margin'
      );
      expect(error).toBeInstanceOf(InsufficientMarginError);
      expect(error.message).toBe('Insufficient margin');
      expect(error.code).toBe('INSUFFICIENT_MARGIN');
      expect(error.exchange).toBe('hyperliquid');
    });

    it('should map invalid signature error', () => {
      const error = mapHyperliquidError(
        HYPERLIQUID_CLIENT_ERRORS.INVALID_SIGNATURE,
        'Invalid signature'
      );
      expect(error).toBeInstanceOf(InvalidSignatureError);
    });

    it('should map unauthorized error to InvalidSignatureError', () => {
      const error = mapHyperliquidError(
        HYPERLIQUID_CLIENT_ERRORS.UNAUTHORIZED,
        'Unauthorized'
      );
      expect(error).toBeInstanceOf(InvalidSignatureError);
    });

    it('should map order would match error', () => {
      const error = mapHyperliquidError(
        HYPERLIQUID_CLIENT_ERRORS.ORDER_WOULD_MATCH,
        'Order would match'
      );
      expect(error).toBeInstanceOf(InvalidOrderError);
    });

    it('should map invalid order error', () => {
      const error = mapHyperliquidError(
        HYPERLIQUID_CLIENT_ERRORS.INVALID_ORDER,
        'Invalid order'
      );
      expect(error).toBeInstanceOf(InvalidOrderError);
    });

    it('should map invalid price error', () => {
      const error = mapHyperliquidError(
        HYPERLIQUID_CLIENT_ERRORS.INVALID_PRICE,
        'Invalid price'
      );
      expect(error).toBeInstanceOf(InvalidOrderError);
    });

    it('should map invalid size error', () => {
      const error = mapHyperliquidError(
        HYPERLIQUID_CLIENT_ERRORS.INVALID_SIZE,
        'Invalid size'
      );
      expect(error).toBeInstanceOf(InvalidOrderError);
    });

    it('should map position not found error', () => {
      const error = mapHyperliquidError(
        HYPERLIQUID_CLIENT_ERRORS.POSITION_NOT_FOUND,
        'Position not found'
      );
      expect(error).toBeInstanceOf(PositionNotFoundError);
    });

    it('should map order not found error', () => {
      const error = mapHyperliquidError(
        HYPERLIQUID_CLIENT_ERRORS.ORDER_NOT_FOUND,
        'Order not found'
      );
      expect(error).toBeInstanceOf(OrderNotFoundError);
    });

    it('should map rate limit error', () => {
      const error = mapHyperliquidError(HYPERLIQUID_RATE_LIMIT_ERROR, 'Rate limit exceeded');
      expect(error).toBeInstanceOf(RateLimitError);
    });

    it('should map server errors', () => {
      expect(mapHyperliquidError(HYPERLIQUID_SERVER_ERRORS.SERVICE_UNAVAILABLE, 'Service unavailable')).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapHyperliquidError(HYPERLIQUID_SERVER_ERRORS.INTERNAL_ERROR, 'Internal error')).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapHyperliquidError(HYPERLIQUID_SERVER_ERRORS.TIMEOUT, 'Timeout')).toBeInstanceOf(ExchangeUnavailableError);
    });

    it('should map unknown errors as PerpDEXError', () => {
      const error = mapHyperliquidError('UNKNOWN_CODE', 'Unknown error');
      expect(error).toBeInstanceOf(PerpDEXError);
    });

    it('should preserve original error', () => {
      const originalError = new Error('Original');
      const error = mapHyperliquidError('INSUFFICIENT_MARGIN', 'Margin error', originalError);
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('mapError', () => {
    it('should return existing PerpDEXError unchanged', () => {
      const existing = new PerpDEXError('Test', 'TEST', 'hyperliquid');
      expect(mapError(existing)).toBe(existing);
    });

    it('should map Error with insufficient margin message', () => {
      const error = mapError(new Error('Insufficient margin for order'));
      expect(error).toBeInstanceOf(InsufficientMarginError);
    });

    it('should map Error with invalid signature message', () => {
      const error = mapError(new Error('Invalid signature'));
      expect(error).toBeInstanceOf(InvalidSignatureError);
    });

    it('should map Error with rate limit message', () => {
      const error = mapError(new Error('Rate limit exceeded'));
      expect(error).toBeInstanceOf(RateLimitError);
    });

    it('should map Error with unknown message', () => {
      const error = mapError(new Error('Something went wrong'));
      expect(error).toBeInstanceOf(PerpDEXError);
    });

    it('should map non-Error values to ExchangeUnavailableError', () => {
      const error = mapError('string error');
      expect(error).toBeInstanceOf(ExchangeUnavailableError);
      expect(error.message).toBe('Unknown exchange error');
    });

    it('should handle null/undefined', () => {
      const error = mapError(null);
      expect(error).toBeInstanceOf(ExchangeUnavailableError);
    });
  });

  describe('Error Message Mapping', () => {
    it('should have mappings for common error messages', () => {
      expect(HYPERLIQUID_ERROR_MESSAGES['insufficient margin']).toBe(
        HYPERLIQUID_CLIENT_ERRORS.INSUFFICIENT_MARGIN
      );
      expect(HYPERLIQUID_ERROR_MESSAGES['invalid signature']).toBe(
        HYPERLIQUID_CLIENT_ERRORS.INVALID_SIGNATURE
      );
      expect(HYPERLIQUID_ERROR_MESSAGES['rate limit exceeded']).toBe(
        HYPERLIQUID_RATE_LIMIT_ERROR
      );
    });
  });
});

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
} from '../../src/adapters/hyperliquid/error-codes.js';

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
      expect(error.name).toBe('InsufficientMarginError');
      expect(error.message).toBe('Insufficient margin');
    });

    it('should map invalid signature error', () => {
      const error = mapHyperliquidError(
        HYPERLIQUID_CLIENT_ERRORS.INVALID_SIGNATURE,
        'Invalid signature'
      );
      expect(error.name).toBe('InvalidSignatureError');
    });

    it('should map rate limit error', () => {
      const error = mapHyperliquidError(HYPERLIQUID_RATE_LIMIT_ERROR, 'Rate limit exceeded');
      expect(error.name).toBe('RateLimitError');
    });

    it('should map server errors', () => {
      const error = mapHyperliquidError(HYPERLIQUID_SERVER_ERRORS.SERVICE_UNAVAILABLE, 'Service unavailable');
      expect(error.name).toBe('ExchangeUnavailableError');
    });

    it('should map unknown errors as PerpDEXError', () => {
      const error = mapHyperliquidError('UNKNOWN_CODE', 'Unknown error');
      expect(error.name).toBe('PerpDEXError');
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

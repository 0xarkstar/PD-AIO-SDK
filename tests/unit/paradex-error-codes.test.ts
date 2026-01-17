/**
 * Paradex Error Codes Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  PARADEX_CLIENT_ERRORS,
  PARADEX_SERVER_ERRORS,
  PARADEX_RATE_LIMIT_ERROR,
  mapParadexError,
  mapError,
} from '../../src/adapters/paradex/error-codes.js';
import {
  PerpDEXError,
  InvalidOrderError,
  InsufficientMarginError,
  OrderNotFoundError,
  InvalidSignatureError,
  RateLimitError,
  ExchangeUnavailableError,
} from '../../src/types/errors.js';

describe('Paradex Error Codes', () => {
  describe('Error Code Constants', () => {
    it('should have client error codes defined', () => {
      expect(PARADEX_CLIENT_ERRORS.INVALID_SIGNATURE).toBe('INVALID_SIGNATURE');
      expect(PARADEX_CLIENT_ERRORS.INVALID_ORDER).toBe('INVALID_ORDER');
      expect(PARADEX_CLIENT_ERRORS.INSUFFICIENT_MARGIN).toBe('INSUFFICIENT_MARGIN');
      expect(PARADEX_CLIENT_ERRORS.ORDER_NOT_FOUND).toBe('ORDER_NOT_FOUND');
      expect(PARADEX_CLIENT_ERRORS.INVALID_PARAMS).toBe('INVALID_PARAMS');
      expect(PARADEX_CLIENT_ERRORS.UNAUTHORIZED).toBe('UNAUTHORIZED');
    });

    it('should have server error codes defined', () => {
      expect(PARADEX_SERVER_ERRORS.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(PARADEX_SERVER_ERRORS.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
      expect(PARADEX_SERVER_ERRORS.TIMEOUT).toBe('TIMEOUT');
    });

    it('should have rate limit error code defined', () => {
      expect(PARADEX_RATE_LIMIT_ERROR).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('mapParadexError', () => {
    it('should map insufficient margin error', () => {
      const error = mapParadexError('INSUFFICIENT_MARGIN', 'Not enough margin');
      expect(error).toBeInstanceOf(InsufficientMarginError);
    });

    it('should map invalid signature error', () => {
      const error = mapParadexError('INVALID_SIGNATURE', 'Bad signature');
      expect(error).toBeInstanceOf(InvalidSignatureError);
    });

    it('should map unauthorized error', () => {
      const error = mapParadexError('UNAUTHORIZED', 'Unauthorized');
      expect(error).toBeInstanceOf(InvalidSignatureError);
    });

    it('should map invalid order error', () => {
      const error = mapParadexError('INVALID_ORDER', 'Invalid order');
      expect(error).toBeInstanceOf(InvalidOrderError);
    });

    it('should map invalid params error', () => {
      const error = mapParadexError('INVALID_PARAMS', 'Invalid params');
      expect(error).toBeInstanceOf(InvalidOrderError);
    });

    it('should map order not found error', () => {
      const error = mapParadexError('ORDER_NOT_FOUND', 'Not found');
      expect(error).toBeInstanceOf(OrderNotFoundError);
    });

    it('should map rate limit error', () => {
      const error = mapParadexError('RATE_LIMIT_EXCEEDED', 'Rate limited');
      expect(error).toBeInstanceOf(RateLimitError);
    });

    it('should map server errors', () => {
      expect(mapParadexError('INTERNAL_ERROR', 'Internal')).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapParadexError('SERVICE_UNAVAILABLE', 'Down')).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapParadexError('TIMEOUT', 'Timeout')).toBeInstanceOf(ExchangeUnavailableError);
    });

    it('should return generic error for unknown codes', () => {
      const error = mapParadexError('UNKNOWN', 'Unknown error');
      expect(error).toBeInstanceOf(PerpDEXError);
    });
  });

  describe('mapError', () => {
    it('should return existing PerpDEXError unchanged', () => {
      const existing = new PerpDEXError('Test', 'TEST', 'paradex');
      expect(mapError(existing)).toBe(existing);
    });

    it('should map signature errors from message', () => {
      const error = mapError(new Error('Invalid signature'));
      expect(error).toBeInstanceOf(InvalidSignatureError);
    });

    it('should map margin errors from message', () => {
      const error = mapError(new Error('Insufficient margin'));
      expect(error).toBeInstanceOf(InsufficientMarginError);
    });

    it('should map not found errors from message', () => {
      const error = mapError(new Error('Order not found'));
      expect(error).toBeInstanceOf(OrderNotFoundError);
    });

    it('should handle string errors', () => {
      const error = mapError('Some error message');
      expect(error).toBeInstanceOf(PerpDEXError);
    });

    it('should handle rate limit from message', () => {
      const error = mapError(new Error('Rate limit exceeded'));
      expect(error).toBeInstanceOf(RateLimitError);
    });

    it('should handle unknown errors', () => {
      const error = mapError(new Error('Some unknown error'));
      expect(error).toBeInstanceOf(PerpDEXError);
    });
  });
});

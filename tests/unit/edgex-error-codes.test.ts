/**
 * EdgeX Error Codes Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  EDGEX_CLIENT_ERRORS,
  EDGEX_SERVER_ERRORS,
  EDGEX_RATE_LIMIT_ERROR,
  mapEdgeXError,
  mapError,
  isRetryableError,
} from '../../src/adapters/edgex/error-codes.js';
import {
  PerpDEXError,
  InvalidOrderError,
  InsufficientMarginError,
  OrderNotFoundError,
  InvalidSignatureError,
  RateLimitError,
  ExchangeUnavailableError,
} from '../../src/types/errors.js';

describe('EdgeX Error Codes', () => {
  describe('Error Code Constants', () => {
    it('should have client error codes defined', () => {
      expect(EDGEX_CLIENT_ERRORS.INVALID_SIGNATURE).toBe('INVALID_SIGNATURE');
      expect(EDGEX_CLIENT_ERRORS.INVALID_ORDER).toBe('INVALID_ORDER');
      expect(EDGEX_CLIENT_ERRORS.INSUFFICIENT_MARGIN).toBe('INSUFFICIENT_MARGIN');
      expect(EDGEX_CLIENT_ERRORS.ORDER_NOT_FOUND).toBe('ORDER_NOT_FOUND');
    });

    it('should have server error codes defined', () => {
      expect(EDGEX_SERVER_ERRORS.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(EDGEX_SERVER_ERRORS.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
      expect(EDGEX_SERVER_ERRORS.TIMEOUT).toBe('TIMEOUT');
    });

    it('should have rate limit error code defined', () => {
      expect(EDGEX_RATE_LIMIT_ERROR).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('mapEdgeXError', () => {
    it('should map insufficient margin error', () => {
      const error = mapEdgeXError('INSUFFICIENT_MARGIN', 'Not enough margin');
      expect(error).toBeInstanceOf(InsufficientMarginError);
    });

    it('should map invalid signature error', () => {
      const error = mapEdgeXError('INVALID_SIGNATURE', 'Bad signature');
      expect(error).toBeInstanceOf(InvalidSignatureError);
    });

    it('should map unauthorized error', () => {
      const error = mapEdgeXError('UNAUTHORIZED', 'Unauthorized');
      expect(error).toBeInstanceOf(InvalidSignatureError);
    });

    it('should map invalid order error', () => {
      const error = mapEdgeXError('INVALID_ORDER', 'Invalid order');
      expect(error).toBeInstanceOf(InvalidOrderError);
    });

    it('should map invalid params error', () => {
      const error = mapEdgeXError('INVALID_PARAMS', 'Invalid params');
      expect(error).toBeInstanceOf(InvalidOrderError);
    });

    it('should map order not found error', () => {
      const error = mapEdgeXError('ORDER_NOT_FOUND', 'Not found');
      expect(error).toBeInstanceOf(OrderNotFoundError);
    });

    it('should map rate limit error', () => {
      const error = mapEdgeXError('RATE_LIMIT_EXCEEDED', 'Rate limited');
      expect(error).toBeInstanceOf(RateLimitError);
    });

    it('should map server errors', () => {
      expect(mapEdgeXError('INTERNAL_ERROR', 'Internal')).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapEdgeXError('SERVICE_UNAVAILABLE', 'Down')).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapEdgeXError('TIMEOUT', 'Timeout')).toBeInstanceOf(ExchangeUnavailableError);
    });

    it('should return generic error for unknown codes', () => {
      const error = mapEdgeXError('UNKNOWN', 'Unknown error');
      expect(error).toBeInstanceOf(PerpDEXError);
    });
  });

  describe('mapError', () => {
    it('should return existing PerpDEXError unchanged', () => {
      const existing = new PerpDEXError('Test', 'TEST', 'edgex');
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

    it('should map rate limit errors from message (line 102)', () => {
      const error = mapError(new Error('Rate limit exceeded'));
      expect(error).toBeInstanceOf(RateLimitError);
    });
  });

  describe('isRetryableError (line 112)', () => {
    it('should return true for server errors', () => {
      expect(isRetryableError('INTERNAL_ERROR')).toBe(true);
      expect(isRetryableError('SERVICE_UNAVAILABLE')).toBe(true);
      expect(isRetryableError('TIMEOUT')).toBe(true);
    });

    it('should return true for rate limit error', () => {
      expect(isRetryableError('RATE_LIMIT_EXCEEDED')).toBe(true);
    });

    it('should return false for client errors', () => {
      expect(isRetryableError('INVALID_ORDER')).toBe(false);
      expect(isRetryableError('INVALID_SIGNATURE')).toBe(false);
      expect(isRetryableError('ORDER_NOT_FOUND')).toBe(false);
    });

    it('should return false for unknown errors', () => {
      expect(isRetryableError('UNKNOWN_ERROR')).toBe(false);
    });
  });
});

/**
 * GRVT Error Codes Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  GRVT_CLIENT_ERRORS,
  GRVT_SERVER_ERRORS,
  GRVT_RATE_LIMIT_ERROR,
  mapGRVTError,
  mapError,
  isRetryableError,
} from '../../src/adapters/grvt/error-codes.js';
import {
  PerpDEXError,
  InvalidOrderError,
  InsufficientMarginError,
  OrderNotFoundError,
  RateLimitError,
  ExchangeUnavailableError,
} from '../../src/types/errors.js';

describe('GRVT Error Codes', () => {
  describe('Error Code Constants', () => {
    it('should have client error codes defined', () => {
      expect(GRVT_CLIENT_ERRORS.INVALID_ORDER).toBe('INVALID_ORDER');
      expect(GRVT_CLIENT_ERRORS.INSUFFICIENT_MARGIN).toBe('INSUFFICIENT_MARGIN');
      expect(GRVT_CLIENT_ERRORS.ORDER_NOT_FOUND).toBe('ORDER_NOT_FOUND');
      expect(GRVT_CLIENT_ERRORS.INVALID_SIGNATURE).toBe('INVALID_SIGNATURE');
    });

    it('should have server error codes defined', () => {
      expect(GRVT_SERVER_ERRORS.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(GRVT_SERVER_ERRORS.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
      expect(GRVT_SERVER_ERRORS.TIMEOUT).toBe('TIMEOUT');
    });

    it('should have rate limit error code defined', () => {
      expect(GRVT_RATE_LIMIT_ERROR).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('mapGRVTError', () => {
    it('should map insufficient margin error', () => {
      const error = mapGRVTError('INSUFFICIENT_MARGIN', 'Not enough margin');
      expect(error).toBeInstanceOf(InsufficientMarginError);
    });

    it('should map invalid order error', () => {
      const error = mapGRVTError('INVALID_ORDER', 'Invalid order');
      expect(error).toBeInstanceOf(InvalidOrderError);
    });

    it('should map invalid params error', () => {
      const error = mapGRVTError('INVALID_PARAMS', 'Invalid params');
      expect(error).toBeInstanceOf(InvalidOrderError);
    });

    it('should map order not found error', () => {
      const error = mapGRVTError('ORDER_NOT_FOUND', 'Not found');
      expect(error).toBeInstanceOf(OrderNotFoundError);
    });

    it('should map rate limit error', () => {
      const error = mapGRVTError('RATE_LIMIT_EXCEEDED', 'Rate limited');
      expect(error).toBeInstanceOf(RateLimitError);
    });

    it('should map server errors', () => {
      expect(mapGRVTError('INTERNAL_ERROR', 'Internal')).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapGRVTError('SERVICE_UNAVAILABLE', 'Down')).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapGRVTError('TIMEOUT', 'Timeout')).toBeInstanceOf(ExchangeUnavailableError);
    });

    it('should return generic error for unknown codes', () => {
      const error = mapGRVTError('UNKNOWN', 'Unknown error');
      expect(error).toBeInstanceOf(PerpDEXError);
    });
  });

  describe('mapError', () => {
    it('should return existing PerpDEXError unchanged', () => {
      const existing = new PerpDEXError('Test', 'TEST', 'grvt');
      expect(mapError(existing)).toBe(existing);
    });

    it('should wrap Error in PerpDEXError', () => {
      const error = mapError(new Error('SDK error'));
      expect(error).toBeInstanceOf(PerpDEXError);
      expect(error.code).toBe('SDK_ERROR');
    });

    it('should wrap string in PerpDEXError', () => {
      const error = mapError('Some error');
      expect(error).toBeInstanceOf(PerpDEXError);
    });
  });

  describe('isRetryableError', () => {
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
      expect(isRetryableError('INSUFFICIENT_MARGIN')).toBe(false);
    });
  });
});

/**
 * Extended Error Codes Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  EXTENDED_CLIENT_ERRORS,
  EXTENDED_SERVER_ERRORS,
  EXTENDED_RATE_LIMIT_ERROR,
  EXTENDED_STARKNET_ERRORS,
  EXTENDED_HTTP_ERROR_CODES,
  isClientError,
  isServerError,
  isStarkNetError,
  isRetryableError,
  extractErrorCode,
  extractErrorCodeFromStatus,
  mapExtendedError,
  mapHTTPError,
  mapStarkNetError,
} from '../../src/adapters/extended/error-codes.js';
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

describe('Extended Error Codes', () => {
  describe('Error Code Constants', () => {
    it('should have client error codes defined', () => {
      expect(EXTENDED_CLIENT_ERRORS.INSUFFICIENT_MARGIN).toBe('INSUFFICIENT_MARGIN');
      expect(EXTENDED_CLIENT_ERRORS.INVALID_ORDER).toBe('INVALID_ORDER');
      expect(EXTENDED_CLIENT_ERRORS.ORDER_NOT_FOUND).toBe('ORDER_NOT_FOUND');
      expect(EXTENDED_CLIENT_ERRORS.UNAUTHORIZED).toBe('UNAUTHORIZED');
    });

    it('should have server error codes defined', () => {
      expect(EXTENDED_SERVER_ERRORS.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(EXTENDED_SERVER_ERRORS.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
      expect(EXTENDED_SERVER_ERRORS.TIMEOUT).toBe('TIMEOUT');
    });

    it('should have rate limit error code defined', () => {
      expect(EXTENDED_RATE_LIMIT_ERROR).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should have StarkNet error codes defined', () => {
      expect(EXTENDED_STARKNET_ERRORS.TRANSACTION_FAILED).toBe('STARKNET_TRANSACTION_FAILED');
      expect(EXTENDED_STARKNET_ERRORS.INVALID_SIGNATURE).toBe('STARKNET_INVALID_SIGNATURE');
      expect(EXTENDED_STARKNET_ERRORS.CONTRACT_ERROR).toBe('STARKNET_CONTRACT_ERROR');
    });

    it('should have HTTP error codes mapped', () => {
      expect(EXTENDED_HTTP_ERROR_CODES[400]).toBe('INVALID_ORDER');
      expect(EXTENDED_HTTP_ERROR_CODES[401]).toBe('UNAUTHORIZED');
      expect(EXTENDED_HTTP_ERROR_CODES[429]).toBe('RATE_LIMIT_EXCEEDED');
      expect(EXTENDED_HTTP_ERROR_CODES[500]).toBe('INTERNAL_ERROR');
    });
  });

  describe('isClientError', () => {
    it('should return true for client errors', () => {
      expect(isClientError('INSUFFICIENT_MARGIN')).toBe(true);
      expect(isClientError('INVALID_ORDER')).toBe(true);
      expect(isClientError('UNAUTHORIZED')).toBe(true);
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

  describe('isStarkNetError', () => {
    it('should return true for StarkNet errors', () => {
      expect(isStarkNetError('STARKNET_TRANSACTION_FAILED')).toBe(true);
      expect(isStarkNetError('STARKNET_INVALID_SIGNATURE')).toBe(true);
      expect(isStarkNetError('STARKNET_CONTRACT_ERROR')).toBe(true);
    });

    it('should return false for non-StarkNet errors', () => {
      expect(isStarkNetError('INTERNAL_ERROR')).toBe(false);
      expect(isStarkNetError('INVALID_ORDER')).toBe(false);
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

    it('should return true for nonce mismatch', () => {
      expect(isRetryableError('STARKNET_NONCE_MISMATCH')).toBe(true);
    });

    it('should return false for client errors', () => {
      expect(isRetryableError('INSUFFICIENT_MARGIN')).toBe(false);
      expect(isRetryableError('INVALID_ORDER')).toBe(false);
    });
  });

  describe('extractErrorCode', () => {
    it('should extract insufficient margin error', () => {
      expect(extractErrorCode('Insufficient margin for order')).toBe('INSUFFICIENT_MARGIN');
    });

    it('should extract invalid order error', () => {
      expect(extractErrorCode('Invalid order parameters')).toBe('INVALID_ORDER');
    });

    it('should extract rate limit error', () => {
      expect(extractErrorCode('Rate limit exceeded')).toBe('RATE_LIMIT_EXCEEDED');
      expect(extractErrorCode('Too many requests')).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should extract StarkNet errors', () => {
      expect(extractErrorCode('Transaction failed')).toBe('STARKNET_TRANSACTION_FAILED');
      expect(extractErrorCode('Contract error occurred')).toBe('STARKNET_CONTRACT_ERROR');
    });

    it('should return UNKNOWN_ERROR for unrecognized messages', () => {
      expect(extractErrorCode('Some random error')).toBe('UNKNOWN_ERROR');
    });

    it('should be case-insensitive', () => {
      expect(extractErrorCode('INSUFFICIENT MARGIN')).toBe('INSUFFICIENT_MARGIN');
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

  describe('mapExtendedError', () => {
    it('should map insufficient margin errors', () => {
      expect(mapExtendedError('INSUFFICIENT_MARGIN', 'Margin error')).toBeInstanceOf(InsufficientMarginError);
      expect(mapExtendedError('INSUFFICIENT_BALANCE', 'Balance error')).toBeInstanceOf(InsufficientMarginError);
      expect(mapExtendedError('LIQUIDATION_RISK', 'Risk error')).toBeInstanceOf(InsufficientMarginError);
    });

    it('should map auth errors', () => {
      expect(mapExtendedError('INVALID_API_KEY', 'API key error')).toBeInstanceOf(InvalidSignatureError);
      expect(mapExtendedError('UNAUTHORIZED', 'Unauthorized')).toBeInstanceOf(InvalidSignatureError);
      expect(mapExtendedError('STARKNET_INVALID_SIGNATURE', 'Sig error')).toBeInstanceOf(InvalidSignatureError);
    });

    it('should map invalid order errors', () => {
      expect(mapExtendedError('INVALID_ORDER', 'Order error')).toBeInstanceOf(InvalidOrderError);
      expect(mapExtendedError('INVALID_SYMBOL', 'Symbol error')).toBeInstanceOf(InvalidOrderError);
      expect(mapExtendedError('INVALID_QUANTITY', 'Qty error')).toBeInstanceOf(InvalidOrderError);
      expect(mapExtendedError('INVALID_PRICE', 'Price error')).toBeInstanceOf(InvalidOrderError);
      expect(mapExtendedError('MARKET_CLOSED', 'Closed')).toBeInstanceOf(InvalidOrderError);
    });

    it('should map order not found errors', () => {
      expect(mapExtendedError('ORDER_NOT_FOUND', 'Not found')).toBeInstanceOf(OrderNotFoundError);
      expect(mapExtendedError('POSITION_NOT_FOUND', 'Not found')).toBeInstanceOf(OrderNotFoundError);
    });

    it('should map rate limit error', () => {
      expect(mapExtendedError('RATE_LIMIT_EXCEEDED', 'Rate limited')).toBeInstanceOf(RateLimitError);
    });

    it('should map unavailable errors', () => {
      expect(mapExtendedError('SERVICE_UNAVAILABLE', 'Down')).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapExtendedError('TIMEOUT', 'Timeout')).toBeInstanceOf(ExchangeUnavailableError);
    });

    it('should map network/server errors', () => {
      expect(mapExtendedError('INTERNAL_ERROR', 'Error')).toBeInstanceOf(NetworkError);
      expect(mapExtendedError('MATCHING_ENGINE_ERROR', 'Error')).toBeInstanceOf(NetworkError);
      expect(mapExtendedError('STARKNET_TRANSACTION_FAILED', 'Failed')).toBeInstanceOf(NetworkError);
    });

    it('should map unknown errors to generic PerpDEXError', () => {
      expect(mapExtendedError('UNKNOWN', 'Unknown')).toBeInstanceOf(PerpDEXError);
    });

    it('should accept numeric HTTP status codes', () => {
      expect(mapExtendedError(429, 'Rate limited')).toBeInstanceOf(RateLimitError);
      expect(mapExtendedError(500, 'Error')).toBeInstanceOf(NetworkError);
    });
  });

  describe('mapHTTPError', () => {
    it('should map from body code', () => {
      const error = mapHTTPError(400, { code: 'INSUFFICIENT_MARGIN', message: 'Margin error' });
      expect(error).toBeInstanceOf(InsufficientMarginError);
    });

    it('should extract code from message when no code in body', () => {
      const error = mapHTTPError(400, { message: 'Insufficient margin for trade' });
      expect(error).toBeInstanceOf(InsufficientMarginError);
    });

    it('should fall back to HTTP status mapping', () => {
      const error = mapHTTPError(429, { error: 'Slow down' });
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

  describe('mapStarkNetError', () => {
    it('should map StarkNet error with message', () => {
      const error = mapStarkNetError(new Error('Transaction failed'));
      expect(error).toBeInstanceOf(NetworkError);
    });

    it('should map StarkNet error from string', () => {
      const error = mapStarkNetError('Contract error in execution');
      expect(error).toBeInstanceOf(NetworkError);
    });

    it('should handle unknown StarkNet errors', () => {
      const error = mapStarkNetError('Some unknown starknet error');
      expect(error).toBeInstanceOf(PerpDEXError);
    });
  });
});

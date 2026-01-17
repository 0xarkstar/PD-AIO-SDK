/**
 * Lighter Error Codes Tests
 *
 * Tests for the Lighter error code mapping functionality
 */

import { describe, it, expect } from '@jest/globals';
import {
  LIGHTER_CLIENT_ERRORS,
  LIGHTER_SERVER_ERRORS,
  LIGHTER_RATE_LIMIT_ERROR,
  LIGHTER_NETWORK_ERRORS,
  isClientError,
  isServerError,
  isNetworkError,
  isRetryableError,
  extractErrorCode,
  mapLighterError,
  mapError,
  mapHttpError,
} from '../../src/adapters/lighter/error-codes.js';
import {
  PerpDEXError,
  InvalidOrderError,
  InsufficientMarginError,
  OrderNotFoundError,
  InvalidSignatureError,
  RateLimitError,
  ExchangeUnavailableError,
} from '../../src/types/errors.js';

describe('Lighter Error Codes', () => {
  describe('Error Code Constants', () => {
    it('should have client error codes defined', () => {
      expect(LIGHTER_CLIENT_ERRORS.INVALID_SIGNATURE).toBe('invalid_signature');
      expect(LIGHTER_CLIENT_ERRORS.UNAUTHORIZED).toBe('unauthorized');
      expect(LIGHTER_CLIENT_ERRORS.INSUFFICIENT_MARGIN).toBe('insufficient_margin');
      expect(LIGHTER_CLIENT_ERRORS.INSUFFICIENT_BALANCE).toBe('insufficient_balance');
      expect(LIGHTER_CLIENT_ERRORS.INVALID_ORDER).toBe('invalid_order');
      expect(LIGHTER_CLIENT_ERRORS.ORDER_NOT_FOUND).toBe('order_not_found');
      expect(LIGHTER_CLIENT_ERRORS.INVALID_PRICE).toBe('invalid_price');
      expect(LIGHTER_CLIENT_ERRORS.INVALID_AMOUNT).toBe('invalid_amount');
    });

    it('should have server error codes defined', () => {
      expect(LIGHTER_SERVER_ERRORS.INTERNAL_ERROR).toBe('internal_error');
      expect(LIGHTER_SERVER_ERRORS.SERVICE_UNAVAILABLE).toBe('service_unavailable');
      expect(LIGHTER_SERVER_ERRORS.TIMEOUT).toBe('timeout');
      expect(LIGHTER_SERVER_ERRORS.MAINTENANCE).toBe('maintenance');
    });

    it('should have rate limit error code defined', () => {
      expect(LIGHTER_RATE_LIMIT_ERROR).toBe('rate_limit_exceeded');
    });

    it('should have network error codes defined', () => {
      expect(LIGHTER_NETWORK_ERRORS.ECONNRESET).toBe('ECONNRESET');
      expect(LIGHTER_NETWORK_ERRORS.ETIMEDOUT).toBe('ETIMEDOUT');
      expect(LIGHTER_NETWORK_ERRORS.ENOTFOUND).toBe('ENOTFOUND');
    });
  });

  describe('isClientError', () => {
    it('should return true for client errors', () => {
      expect(isClientError('invalid_signature')).toBe(true);
      expect(isClientError('insufficient_margin')).toBe(true);
      expect(isClientError('invalid_order')).toBe(true);
      expect(isClientError('order_not_found')).toBe(true);
    });

    it('should return false for non-client errors', () => {
      expect(isClientError('internal_error')).toBe(false);
      expect(isClientError('service_unavailable')).toBe(false);
      expect(isClientError('unknown')).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should return true for server errors', () => {
      expect(isServerError('internal_error')).toBe(true);
      expect(isServerError('service_unavailable')).toBe(true);
      expect(isServerError('timeout')).toBe(true);
      expect(isServerError('maintenance')).toBe(true);
    });

    it('should return false for non-server errors', () => {
      expect(isServerError('invalid_order')).toBe(false);
      expect(isServerError('insufficient_margin')).toBe(false);
      expect(isServerError('unknown')).toBe(false);
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
      expect(isNetworkError('invalid_order')).toBe(false);
      expect(isNetworkError('internal_error')).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for server errors', () => {
      expect(isRetryableError('internal_error')).toBe(true);
      expect(isRetryableError('service_unavailable')).toBe(true);
    });

    it('should return true for network errors', () => {
      expect(isRetryableError('ECONNRESET')).toBe(true);
      expect(isRetryableError('ETIMEDOUT')).toBe(true);
    });

    it('should return true for rate limit error', () => {
      expect(isRetryableError('rate_limit_exceeded')).toBe(true);
    });

    it('should return false for client errors', () => {
      expect(isRetryableError('invalid_order')).toBe(false);
      expect(isRetryableError('insufficient_margin')).toBe(false);
    });
  });

  describe('extractErrorCode', () => {
    it('should extract rate limit error code', () => {
      expect(extractErrorCode('Rate limit exceeded')).toBe('rate_limit_exceeded');
      expect(extractErrorCode('Too many requests')).toBe('rate_limit_exceeded');
    });

    it('should extract insufficient margin error code', () => {
      expect(extractErrorCode('Insufficient margin to place order')).toBe('insufficient_margin');
    });

    it('should extract insufficient balance error code', () => {
      expect(extractErrorCode('Insufficient balance')).toBe('insufficient_balance');
    });

    it('should extract invalid order error codes', () => {
      expect(extractErrorCode('Invalid order')).toBe('invalid_order');
      expect(extractErrorCode('Invalid order size')).toBe('invalid_order_size');
      expect(extractErrorCode('Invalid price')).toBe('invalid_price');
    });

    it('should extract order not found error code', () => {
      expect(extractErrorCode('Order not found')).toBe('order_not_found');
    });

    it('should extract authentication error codes', () => {
      expect(extractErrorCode('Unauthorized')).toBe('invalid_signature');
      expect(extractErrorCode('Invalid signature')).toBe('invalid_signature');
      expect(extractErrorCode('Authentication failed')).toBe('invalid_signature');
    });

    it('should extract service unavailable error codes', () => {
      expect(extractErrorCode('Service unavailable')).toBe('service_unavailable');
      expect(extractErrorCode('Server is under maintenance')).toBe('service_unavailable');
      expect(extractErrorCode('Exchange is offline')).toBe('service_unavailable');
    });

    it('should return unknown error for unrecognized messages', () => {
      expect(extractErrorCode('Some random error')).toBe('UNKNOWN_ERROR');
    });
  });

  describe('mapLighterError', () => {
    it('should map rate limit error', () => {
      const error = mapLighterError('rate_limit_exceeded', 'Rate limit exceeded');
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.code).toBe('rate_limit_exceeded');
    });

    it('should map insufficient margin error', () => {
      const error = mapLighterError('insufficient_margin', 'Not enough margin');
      expect(error).toBeInstanceOf(InsufficientMarginError);
    });

    it('should map insufficient balance error', () => {
      const error = mapLighterError('insufficient_balance', 'Not enough balance');
      expect(error).toBeInstanceOf(InsufficientMarginError);
    });

    it('should map invalid order errors', () => {
      expect(mapLighterError('invalid_order', 'Invalid order')).toBeInstanceOf(InvalidOrderError);
      expect(mapLighterError('invalid_price', 'Invalid price')).toBeInstanceOf(InvalidOrderError);
      expect(mapLighterError('invalid_amount', 'Invalid amount')).toBeInstanceOf(InvalidOrderError);
      expect(mapLighterError('invalid_order_size', 'Invalid size')).toBeInstanceOf(InvalidOrderError);
      expect(mapLighterError('min_size_not_met', 'Min size not met')).toBeInstanceOf(InvalidOrderError);
      expect(mapLighterError('max_size_exceeded', 'Max size exceeded')).toBeInstanceOf(InvalidOrderError);
    });

    it('should map order not found error', () => {
      const error = mapLighterError('order_not_found', 'Order not found');
      expect(error).toBeInstanceOf(OrderNotFoundError);
    });

    it('should map authentication errors', () => {
      expect(mapLighterError('invalid_signature', 'Invalid signature')).toBeInstanceOf(InvalidSignatureError);
      expect(mapLighterError('unauthorized', 'Unauthorized')).toBeInstanceOf(InvalidSignatureError);
      expect(mapLighterError('invalid_api_key', 'Invalid API key')).toBeInstanceOf(InvalidSignatureError);
    });

    it('should map server errors', () => {
      expect(mapLighterError('internal_error', 'Internal error')).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapLighterError('service_unavailable', 'Service unavailable')).toBeInstanceOf(ExchangeUnavailableError);
    });

    it('should map network errors', () => {
      expect(mapLighterError('ECONNRESET', 'Connection reset')).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapLighterError('ETIMEDOUT', 'Timeout')).toBeInstanceOf(ExchangeUnavailableError);
    });

    it('should return generic PerpDEXError for unknown codes', () => {
      const error = mapLighterError('unknown_code', 'Unknown error');
      expect(error).toBeInstanceOf(PerpDEXError);
    });

    it('should accept original error parameter', () => {
      const originalError = new Error('Original');
      const error = mapLighterError('invalid_order', 'Invalid order', originalError);
      expect(error).toBeInstanceOf(InvalidOrderError);
    });
  });

  describe('mapError', () => {
    it('should return existing PerpDEXError unchanged', () => {
      const existing = new PerpDEXError('Test', 'TEST', 'lighter');
      const result = mapError(existing);
      expect(result).toBe(existing);
    });

    it('should map Error to PerpDEXError', () => {
      const error = new Error('Rate limit exceeded');
      const result = mapError(error);
      expect(result).toBeInstanceOf(RateLimitError);
    });

    it('should map string to PerpDEXError', () => {
      const result = mapError('Insufficient margin');
      expect(result).toBeInstanceOf(InsufficientMarginError);
    });

    it('should handle unknown error types', () => {
      const result = mapError({ custom: 'error' });
      expect(result).toBeInstanceOf(PerpDEXError);
    });
  });

  describe('mapHttpError', () => {
    it('should map 429 to RateLimitError', () => {
      const error = mapHttpError(429, 'Too Many Requests');
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.code).toBe('rate_limit_exceeded');
    });

    it('should map 4xx to InvalidOrderError', () => {
      expect(mapHttpError(400, 'Bad Request')).toBeInstanceOf(InvalidOrderError);
      expect(mapHttpError(401, 'Unauthorized')).toBeInstanceOf(InvalidOrderError);
      expect(mapHttpError(403, 'Forbidden')).toBeInstanceOf(InvalidOrderError);
      expect(mapHttpError(404, 'Not Found')).toBeInstanceOf(InvalidOrderError);
    });

    it('should map 5xx to ExchangeUnavailableError', () => {
      expect(mapHttpError(500, 'Internal Server Error')).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapHttpError(502, 'Bad Gateway')).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapHttpError(503, 'Service Unavailable')).toBeInstanceOf(ExchangeUnavailableError);
    });

    it('should map other codes to generic PerpDEXError', () => {
      const error = mapHttpError(200, 'OK');
      expect(error).toBeInstanceOf(PerpDEXError);
    });
  });
});

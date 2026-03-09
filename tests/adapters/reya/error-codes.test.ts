/**
 * Reya Error Codes Tests
 *
 * Tests for extractErrorCode, mapReyaError, mapError, isRetryableError.
 */

import { describe, test, expect } from '@jest/globals';
import {
  extractErrorCode,
  mapReyaError,
  mapError,
  isRetryableError,
  REYA_CLIENT_ERRORS,
  REYA_SERVER_ERRORS,
  REYA_RATE_LIMIT_ERROR,
} from '../../../src/adapters/reya/error-codes.js';
import {
  PerpDEXError,
  InvalidOrderError,
  InsufficientMarginError,
  OrderNotFoundError,
  InvalidSignatureError,
  RateLimitError,
  ExchangeUnavailableError,
  BadRequestError,
} from '../../../src/types/errors.js';

describe('Reya Error Codes', () => {
  // =========================================================================
  // extractErrorCode
  // =========================================================================

  describe('extractErrorCode', () => {
    test('extracts INSUFFICIENT_MARGIN from message', () => {
      expect(extractErrorCode('insufficient margin for this trade')).toBe('INSUFFICIENT_MARGIN');
    });

    test('extracts SYMBOL_NOT_FOUND from message', () => {
      expect(extractErrorCode('symbol not found: XYZRUSDPERP')).toBe(REYA_CLIENT_ERRORS.SYMBOL_NOT_FOUND);
    });

    test('extracts UNAUTHORIZED_SIGNATURE from "invalid signature"', () => {
      expect(extractErrorCode('invalid signature provided')).toBe(REYA_CLIENT_ERRORS.UNAUTHORIZED_SIGNATURE);
    });

    test('extracts UNAUTHORIZED_SIGNATURE from "unauthorized"', () => {
      expect(extractErrorCode('Unauthorized access')).toBe(REYA_CLIENT_ERRORS.UNAUTHORIZED_SIGNATURE);
    });

    test('extracts RATE_LIMIT_EXCEEDED from "rate limit"', () => {
      expect(extractErrorCode('rate limit exceeded')).toBe(REYA_RATE_LIMIT_ERROR);
    });

    test('extracts RATE_LIMIT_EXCEEDED from "too many requests"', () => {
      expect(extractErrorCode('too many requests')).toBe(REYA_RATE_LIMIT_ERROR);
    });

    test('extracts RATE_LIMIT_EXCEEDED from 429 status', () => {
      expect(extractErrorCode('HTTP error 429')).toBe(REYA_RATE_LIMIT_ERROR);
    });

    test('extracts INVALID_NONCE from message', () => {
      expect(extractErrorCode('invalid nonce value')).toBe(REYA_CLIENT_ERRORS.INVALID_NONCE);
    });

    test('extracts ORDER_DEADLINE_PASSED from message', () => {
      expect(extractErrorCode('deadline passed for order')).toBe(REYA_CLIENT_ERRORS.ORDER_DEADLINE_PASSED);
    });

    test('extracts UNAVAILABLE_MATCHING_ENGINE from message', () => {
      expect(extractErrorCode('matching engine unavailable')).toBe(REYA_SERVER_ERRORS.UNAVAILABLE_MATCHING_ENGINE);
    });

    test('extracts INTERNAL_SERVER_ERROR from 500 status', () => {
      expect(extractErrorCode('HTTP error 500')).toBe(REYA_SERVER_ERRORS.INTERNAL_SERVER_ERROR);
    });

    test('extracts INTERNAL_SERVER_ERROR from 503 status', () => {
      expect(extractErrorCode('HTTP error 503')).toBe(REYA_SERVER_ERRORS.INTERNAL_SERVER_ERROR);
    });

    test('returns UNKNOWN_ERROR for unrecognized message', () => {
      expect(extractErrorCode('something went wrong')).toBe('UNKNOWN_ERROR');
    });
  });

  // =========================================================================
  // mapReyaError
  // =========================================================================

  describe('mapReyaError', () => {
    test('maps INSUFFICIENT_MARGIN to InsufficientMarginError', () => {
      const err = mapReyaError('INSUFFICIENT_MARGIN', 'not enough margin');
      expect(err).toBeInstanceOf(InsufficientMarginError);
      expect(err.exchange).toBe('reya');
    });

    test('maps UNAUTHORIZED_SIGNATURE to InvalidSignatureError', () => {
      const err = mapReyaError(REYA_CLIENT_ERRORS.UNAUTHORIZED_SIGNATURE, 'bad sig');
      expect(err).toBeInstanceOf(InvalidSignatureError);
    });

    test('maps INPUT_VALIDATION_ERROR to BadRequestError', () => {
      const err = mapReyaError(REYA_CLIENT_ERRORS.INPUT_VALIDATION_ERROR, 'bad input');
      expect(err).toBeInstanceOf(BadRequestError);
    });

    test('maps NUMERIC_OVERFLOW to BadRequestError', () => {
      const err = mapReyaError(REYA_CLIENT_ERRORS.NUMERIC_OVERFLOW, 'overflow');
      expect(err).toBeInstanceOf(BadRequestError);
    });

    test('maps SYMBOL_NOT_FOUND to BadRequestError', () => {
      const err = mapReyaError(REYA_CLIENT_ERRORS.SYMBOL_NOT_FOUND, 'not found');
      expect(err).toBeInstanceOf(BadRequestError);
    });

    test('maps CREATE_ORDER_ERROR to InvalidOrderError', () => {
      const err = mapReyaError(REYA_CLIENT_ERRORS.CREATE_ORDER_ERROR, 'order failed');
      expect(err).toBeInstanceOf(InvalidOrderError);
    });

    test('maps ORDER_DEADLINE_PASSED to InvalidOrderError', () => {
      const err = mapReyaError(REYA_CLIENT_ERRORS.ORDER_DEADLINE_PASSED, 'expired');
      expect(err).toBeInstanceOf(InvalidOrderError);
    });

    test('maps INVALID_NONCE to InvalidOrderError', () => {
      const err = mapReyaError(REYA_CLIENT_ERRORS.INVALID_NONCE, 'bad nonce');
      expect(err).toBeInstanceOf(InvalidOrderError);
    });

    test('maps CANCEL_ORDER_ERROR to OrderNotFoundError', () => {
      const err = mapReyaError(REYA_CLIENT_ERRORS.CANCEL_ORDER_ERROR, 'cancel failed');
      expect(err).toBeInstanceOf(OrderNotFoundError);
    });

    test('maps RATE_LIMIT_EXCEEDED to RateLimitError', () => {
      const err = mapReyaError(REYA_RATE_LIMIT_ERROR, 'throttled');
      expect(err).toBeInstanceOf(RateLimitError);
    });

    test('maps INTERNAL_SERVER_ERROR to ExchangeUnavailableError', () => {
      const err = mapReyaError(REYA_SERVER_ERRORS.INTERNAL_SERVER_ERROR, 'server error');
      expect(err).toBeInstanceOf(ExchangeUnavailableError);
    });

    test('maps UNAVAILABLE_MATCHING_ENGINE to ExchangeUnavailableError', () => {
      const err = mapReyaError(REYA_SERVER_ERRORS.UNAVAILABLE_MATCHING_ENGINE, 'engine down');
      expect(err).toBeInstanceOf(ExchangeUnavailableError);
    });

    test('maps unknown code to PerpDEXError', () => {
      const err = mapReyaError('SOME_OTHER_ERROR', 'unknown');
      expect(err).toBeInstanceOf(PerpDEXError);
      expect(err.code).toBe('SOME_OTHER_ERROR');
    });

    test('preserves original error in mapped error', () => {
      const original = new Error('original');
      const err = mapReyaError('INSUFFICIENT_MARGIN', 'not enough', original);
      // PerpDEXError stores originalError privately, exposed via toJSON
      const json = err.toJSON();
      expect(json.originalError).toBeDefined();
      expect((json.originalError as Record<string, unknown>).message).toBe('original');
    });
  });

  // =========================================================================
  // mapError
  // =========================================================================

  describe('mapError', () => {
    test('returns PerpDEXError as-is', () => {
      const perr = new PerpDEXError('already mapped', 'CODE', 'reya');
      expect(mapError(perr)).toBe(perr);
    });

    test('maps standard Error via extractErrorCode', () => {
      const err = mapError(new Error('insufficient margin'));
      expect(err).toBeInstanceOf(InsufficientMarginError);
    });

    test('maps non-Error to ExchangeUnavailableError', () => {
      const err = mapError('just a string');
      expect(err).toBeInstanceOf(ExchangeUnavailableError);
      expect(err.message).toBe('Unknown exchange error');
    });

    test('maps null to ExchangeUnavailableError', () => {
      const err = mapError(null);
      expect(err).toBeInstanceOf(ExchangeUnavailableError);
    });
  });

  // =========================================================================
  // isRetryableError
  // =========================================================================

  describe('isRetryableError', () => {
    test('INTERNAL_SERVER_ERROR is retryable', () => {
      expect(isRetryableError(REYA_SERVER_ERRORS.INTERNAL_SERVER_ERROR)).toBe(true);
    });

    test('UNAVAILABLE_MATCHING_ENGINE is retryable', () => {
      expect(isRetryableError(REYA_SERVER_ERRORS.UNAVAILABLE_MATCHING_ENGINE)).toBe(true);
    });

    test('RATE_LIMIT_EXCEEDED is retryable', () => {
      expect(isRetryableError(REYA_RATE_LIMIT_ERROR)).toBe(true);
    });

    test('INSUFFICIENT_MARGIN is not retryable', () => {
      expect(isRetryableError('INSUFFICIENT_MARGIN')).toBe(false);
    });

    test('UNAUTHORIZED_SIGNATURE is not retryable', () => {
      expect(isRetryableError(REYA_CLIENT_ERRORS.UNAUTHORIZED_SIGNATURE)).toBe(false);
    });

    test('UNKNOWN_ERROR is not retryable', () => {
      expect(isRetryableError('UNKNOWN_ERROR')).toBe(false);
    });
  });
});

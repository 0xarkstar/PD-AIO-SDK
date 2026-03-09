/**
 * Ethereal Error Codes Tests
 *
 * Tests for error code extraction, mapping, and classification.
 */

import {
  extractErrorCode,
  mapEtherealError,
  mapError,
  isRetryableError,
  ETHEREAL_CLIENT_ERRORS,
  ETHEREAL_SERVER_ERRORS,
  ETHEREAL_RATE_LIMIT_ERROR,
} from '../../../src/adapters/ethereal/error-codes.js';
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

describe('Ethereal Error Codes', () => {
  // =========================================================================
  // extractErrorCode
  // =========================================================================

  describe('extractErrorCode', () => {
    test('extracts INSUFFICIENT_MARGIN from message', () => {
      expect(extractErrorCode('insufficient margin for order')).toBe('INSUFFICIENT_MARGIN');
    });

    test('extracts SYMBOL_NOT_FOUND from message', () => {
      expect(extractErrorCode('symbol not found: XYZ-USD')).toBe(ETHEREAL_CLIENT_ERRORS.SYMBOL_NOT_FOUND);
    });

    test('extracts INVALID_SIGNATURE from unauthorized', () => {
      expect(extractErrorCode('unauthorized request')).toBe(ETHEREAL_CLIENT_ERRORS.INVALID_SIGNATURE);
    });

    test('extracts RATE_LIMIT_EXCEEDED from rate limit message', () => {
      expect(extractErrorCode('rate limit exceeded')).toBe(ETHEREAL_RATE_LIMIT_ERROR);
    });

    test('extracts RATE_LIMIT_EXCEEDED from too many requests', () => {
      expect(extractErrorCode('too many requests')).toBe(ETHEREAL_RATE_LIMIT_ERROR);
    });

    test('extracts RATE_LIMIT_EXCEEDED from 429 status', () => {
      expect(extractErrorCode('HTTP 429 error')).toBe(ETHEREAL_RATE_LIMIT_ERROR);
    });

    test('extracts INTERNAL_SERVER_ERROR from 500 status', () => {
      expect(extractErrorCode('HTTP 500 error')).toBe(ETHEREAL_SERVER_ERRORS.INTERNAL_SERVER_ERROR);
    });

    test('extracts INTERNAL_SERVER_ERROR from 503 status', () => {
      expect(extractErrorCode('HTTP 503 error')).toBe(ETHEREAL_SERVER_ERRORS.INTERNAL_SERVER_ERROR);
    });

    test('extracts ORDER_NOT_FOUND', () => {
      expect(extractErrorCode('order not found')).toBe(ETHEREAL_CLIENT_ERRORS.ORDER_NOT_FOUND);
    });

    test('extracts INVALID_ORDER', () => {
      expect(extractErrorCode('invalid order parameters')).toBe(ETHEREAL_CLIENT_ERRORS.INVALID_ORDER);
    });

    test('extracts INVALID_NONCE', () => {
      expect(extractErrorCode('invalid nonce value')).toBe(ETHEREAL_CLIENT_ERRORS.INVALID_NONCE);
    });

    test('extracts SERVICE_UNAVAILABLE', () => {
      expect(extractErrorCode('service unavailable right now')).toBe(ETHEREAL_SERVER_ERRORS.SERVICE_UNAVAILABLE);
    });

    test('returns UNKNOWN_ERROR for unrecognized messages', () => {
      expect(extractErrorCode('something completely different')).toBe('UNKNOWN_ERROR');
    });
  });

  // =========================================================================
  // mapEtherealError
  // =========================================================================

  describe('mapEtherealError', () => {
    test('maps INSUFFICIENT_MARGIN to InsufficientMarginError', () => {
      const err = mapEtherealError('INSUFFICIENT_MARGIN', 'Not enough margin', null);
      expect(err).toBeInstanceOf(InsufficientMarginError);
      expect(err.exchange).toBe('ethereal');
    });

    test('maps INVALID_SIGNATURE to InvalidSignatureError', () => {
      const err = mapEtherealError(ETHEREAL_CLIENT_ERRORS.INVALID_SIGNATURE, 'Bad sig', null);
      expect(err).toBeInstanceOf(InvalidSignatureError);
    });

    test('maps INPUT_VALIDATION_ERROR to BadRequestError', () => {
      const err = mapEtherealError(ETHEREAL_CLIENT_ERRORS.INPUT_VALIDATION_ERROR, 'Bad input', null);
      expect(err).toBeInstanceOf(BadRequestError);
    });

    test('maps SYMBOL_NOT_FOUND to BadRequestError', () => {
      const err = mapEtherealError(ETHEREAL_CLIENT_ERRORS.SYMBOL_NOT_FOUND, 'No symbol', null);
      expect(err).toBeInstanceOf(BadRequestError);
    });

    test('maps ACCOUNT_NOT_FOUND to BadRequestError', () => {
      const err = mapEtherealError(ETHEREAL_CLIENT_ERRORS.ACCOUNT_NOT_FOUND, 'No account', null);
      expect(err).toBeInstanceOf(BadRequestError);
    });

    test('maps INVALID_ORDER to InvalidOrderError', () => {
      const err = mapEtherealError(ETHEREAL_CLIENT_ERRORS.INVALID_ORDER, 'Bad order', null);
      expect(err).toBeInstanceOf(InvalidOrderError);
    });

    test('maps INVALID_NONCE to InvalidOrderError', () => {
      const err = mapEtherealError(ETHEREAL_CLIENT_ERRORS.INVALID_NONCE, 'Bad nonce', null);
      expect(err).toBeInstanceOf(InvalidOrderError);
    });

    test('maps ORDER_NOT_FOUND to OrderNotFoundError', () => {
      const err = mapEtherealError(ETHEREAL_CLIENT_ERRORS.ORDER_NOT_FOUND, 'Not found', null);
      expect(err).toBeInstanceOf(OrderNotFoundError);
    });

    test('maps RATE_LIMIT_EXCEEDED to RateLimitError', () => {
      const err = mapEtherealError(ETHEREAL_RATE_LIMIT_ERROR, 'Too fast', null);
      expect(err).toBeInstanceOf(RateLimitError);
    });

    test('maps server errors to ExchangeUnavailableError', () => {
      const err = mapEtherealError(ETHEREAL_SERVER_ERRORS.INTERNAL_SERVER_ERROR, 'Server down', null);
      expect(err).toBeInstanceOf(ExchangeUnavailableError);
    });

    test('maps SERVICE_UNAVAILABLE to ExchangeUnavailableError', () => {
      const err = mapEtherealError(ETHEREAL_SERVER_ERRORS.SERVICE_UNAVAILABLE, 'Unavailable', null);
      expect(err).toBeInstanceOf(ExchangeUnavailableError);
    });

    test('maps unknown code to PerpDEXError', () => {
      const err = mapEtherealError('TOTALLY_UNKNOWN', 'Unknown', null);
      expect(err).toBeInstanceOf(PerpDEXError);
      expect(err).not.toBeInstanceOf(ExchangeUnavailableError);
    });
  });

  // =========================================================================
  // mapError
  // =========================================================================

  describe('mapError', () => {
    test('returns PerpDEXError as-is', () => {
      const original = new PerpDEXError('test', 'CODE', 'ethereal');
      const result = mapError(original);
      expect(result).toBe(original);
    });

    test('maps standard Error by extracting code from message', () => {
      const err = mapError(new Error('insufficient margin'));
      expect(err).toBeInstanceOf(InsufficientMarginError);
    });

    test('maps unknown error type to ExchangeUnavailableError', () => {
      const err = mapError('string error');
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
    test('server errors are retryable', () => {
      expect(isRetryableError(ETHEREAL_SERVER_ERRORS.INTERNAL_SERVER_ERROR)).toBe(true);
      expect(isRetryableError(ETHEREAL_SERVER_ERRORS.SERVICE_UNAVAILABLE)).toBe(true);
    });

    test('rate limit errors are retryable', () => {
      expect(isRetryableError(ETHEREAL_RATE_LIMIT_ERROR)).toBe(true);
    });

    test('client errors are not retryable', () => {
      expect(isRetryableError(ETHEREAL_CLIENT_ERRORS.INVALID_ORDER)).toBe(false);
      expect(isRetryableError(ETHEREAL_CLIENT_ERRORS.ORDER_NOT_FOUND)).toBe(false);
      expect(isRetryableError('UNKNOWN_ERROR')).toBe(false);
    });
  });
});

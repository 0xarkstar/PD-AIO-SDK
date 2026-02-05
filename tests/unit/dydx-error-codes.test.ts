/**
 * dYdX v4 Error Codes Unit Tests
 */

import {
  mapDydxError,
  DydxErrorCodes,
} from '../../src/adapters/dydx/error-codes.js';
import {
  PerpDEXError,
  InsufficientMarginError,
  InvalidSignatureError,
  InvalidOrderError,
  PositionNotFoundError,
  OrderNotFoundError,
  RateLimitError,
  ExchangeUnavailableError,
  InvalidSymbolError,
} from '../../src/types/errors.js';

describe('dYdX Error Codes', () => {
  describe('mapDydxError', () => {
    test('returns same error if already PerpDEXError', () => {
      const originalError = new PerpDEXError('Test error', 'TEST', 'dydx');
      const mapped = mapDydxError(originalError);

      expect(mapped).toBe(originalError);
    });

    test('maps insufficient margin error', () => {
      const error = new Error('insufficient margin for order');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(InsufficientMarginError);
      expect(mapped.code).toBe('INSUFFICIENT_MARGIN');
      expect(mapped.exchange).toBe('dydx');
    });

    test('maps insufficient funds error', () => {
      const error = new Error('insufficient funds');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(InsufficientMarginError);
    });

    test('maps invalid signature error', () => {
      const error = new Error('invalid signature');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(InvalidSignatureError);
      expect(mapped.code).toBe('INVALID_SIGNATURE');
    });

    test('maps order would match error', () => {
      const error = new Error('order would immediately match');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(InvalidOrderError);
      expect(mapped.code).toBe('ORDER_WOULD_MATCH');
    });

    test('maps position not found error', () => {
      const error = new Error('position does not exist');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(PositionNotFoundError);
      expect(mapped.code).toBe('POSITION_NOT_FOUND');
    });

    test('maps order not found error', () => {
      const error = new Error('order not found');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(OrderNotFoundError);
      expect(mapped.code).toBe('ORDER_NOT_FOUND');
    });

    test('maps order does not exist error', () => {
      const error = new Error('order does not exist');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(OrderNotFoundError);
    });

    test('maps subaccount not found error (line 57)', () => {
      const error = new Error('subaccount not found');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(PerpDEXError);
      expect(mapped.code).toBe('SUBACCOUNT_NOT_FOUND');
    });

    test('maps rate limit exceeded error', () => {
      const error = new Error('rate limit exceeded');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(RateLimitError);
      expect(mapped.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    test('maps invalid order size error', () => {
      const error = new Error('invalid order size');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(InvalidOrderError);
      expect(mapped.code).toBe('INVALID_ORDER_SIZE');
    });

    test('maps price out of bounds error', () => {
      const error = new Error('price out of bounds');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(InvalidOrderError);
      expect(mapped.code).toBe('PRICE_OUT_OF_BOUNDS');
    });

    test('maps market not found error', () => {
      const error = new Error('market not found');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(InvalidSymbolError);
      expect(mapped.code).toBe('MARKET_NOT_FOUND');
    });

    test('maps unauthorized error', () => {
      const error = new Error('unauthorized');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(InvalidSignatureError);
      expect(mapped.code).toBe('UNAUTHORIZED');
    });

    test('maps HTTP 429 rate limit error', () => {
      const error = new Error('HTTP 429 Too Many Requests');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(RateLimitError);
    });

    test('maps HTTP 503 service unavailable error', () => {
      const error = new Error('HTTP 503 Service Unavailable');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(ExchangeUnavailableError);
    });

    test('maps HTTP 502 bad gateway error', () => {
      const error = new Error('HTTP 502 Bad Gateway');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(ExchangeUnavailableError);
    });

    test('maps HTTP 504 gateway timeout error', () => {
      const error = new Error('HTTP 504 Gateway Timeout');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(ExchangeUnavailableError);
    });

    test('maps HTTP 401 unauthorized error', () => {
      const error = new Error('HTTP 401 Unauthorized');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(InvalidSignatureError);
    });

    test('maps HTTP 403 forbidden error', () => {
      const error = new Error('HTTP 403 Forbidden');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(InvalidSignatureError);
    });

    test('maps HTTP 404 not found error', () => {
      const error = new Error('HTTP 404 Not Found');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(PerpDEXError);
      expect(mapped.code).toBe('NOT_FOUND');
    });

    test('maps HTTP 400 bad request error', () => {
      const error = new Error('HTTP 400 Bad Request');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(InvalidOrderError);
      expect(mapped.code).toBe('BAD_REQUEST');
    });

    test('maps unknown error to ExchangeUnavailableError', () => {
      const error = new Error('Some unknown error occurred');
      const mapped = mapDydxError(error);

      expect(mapped).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapped.code).toBe('UNKNOWN_ERROR');
    });

    test('handles non-Error objects', () => {
      const mapped = mapDydxError('string error');

      expect(mapped).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapped.code).toBe('UNKNOWN_ERROR');
    });

    test('handles null/undefined', () => {
      const mappedNull = mapDydxError(null);
      const mappedUndefined = mapDydxError(undefined);

      expect(mappedNull).toBeInstanceOf(ExchangeUnavailableError);
      expect(mappedUndefined).toBeInstanceOf(ExchangeUnavailableError);
    });
  });

  describe('DydxErrorCodes', () => {
    test('all error codes are defined', () => {
      expect(DydxErrorCodes.INSUFFICIENT_MARGIN).toBe('INSUFFICIENT_MARGIN');
      expect(DydxErrorCodes.INVALID_ORDER_SIZE).toBe('INVALID_ORDER_SIZE');
      expect(DydxErrorCodes.PRICE_OUT_OF_BOUNDS).toBe('PRICE_OUT_OF_BOUNDS');
      expect(DydxErrorCodes.ORDER_WOULD_MATCH).toBe('ORDER_WOULD_MATCH');
      expect(DydxErrorCodes.ORDER_NOT_FOUND).toBe('ORDER_NOT_FOUND');
      expect(DydxErrorCodes.POSITION_NOT_FOUND).toBe('POSITION_NOT_FOUND');
      expect(DydxErrorCodes.MARKET_NOT_FOUND).toBe('MARKET_NOT_FOUND');
      expect(DydxErrorCodes.MARKET_PAUSED).toBe('MARKET_PAUSED');
      expect(DydxErrorCodes.SUBACCOUNT_NOT_FOUND).toBe('SUBACCOUNT_NOT_FOUND');
      expect(DydxErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(DydxErrorCodes.INVALID_SIGNATURE).toBe('INVALID_SIGNATURE');
      expect(DydxErrorCodes.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(DydxErrorCodes.EXCHANGE_DOWN).toBe('EXCHANGE_DOWN');
      expect(DydxErrorCodes.TIMEOUT).toBe('TIMEOUT');
      expect(DydxErrorCodes.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
      expect(DydxErrorCodes.BAD_REQUEST).toBe('BAD_REQUEST');
      expect(DydxErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
    });
  });
});

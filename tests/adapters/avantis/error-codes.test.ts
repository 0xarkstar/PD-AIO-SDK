/**
 * Avantis Error Codes Unit Tests
 */

import { describe, test, expect } from '@jest/globals';
import {
  extractErrorCode,
  mapAvantisError,
  mapError,
  isRetryableError,
  AVANTIS_REVERT_ERRORS,
  AVANTIS_TX_ERRORS,
} from '../../../src/adapters/avantis/error-codes.js';
import {
  PerpDEXError,
  InvalidOrderError,
  InsufficientMarginError,
  RateLimitError,
  ExchangeUnavailableError,
  BadRequestError,
} from '../../../src/types/errors.js';

describe('Avantis Error Codes', () => {
  describe('extractErrorCode', () => {
    test('should extract INSUFFICIENT_GAS from "insufficient funds"', () => {
      expect(extractErrorCode('insufficient funds for gas')).toBe(AVANTIS_TX_ERRORS.INSUFFICIENT_GAS);
    });

    test('should extract NONCE_TOO_LOW', () => {
      expect(extractErrorCode('nonce too low')).toBe(AVANTIS_TX_ERRORS.NONCE_TOO_LOW);
    });

    test('should extract TRANSACTION_REVERTED from "transaction reverted"', () => {
      expect(extractErrorCode('transaction reverted without reason')).toBe(AVANTIS_TX_ERRORS.TRANSACTION_REVERTED);
    });

    test('should extract TRANSACTION_REVERTED from "execution reverted"', () => {
      expect(extractErrorCode('execution reverted: WRONG_TRADE')).toBe(AVANTIS_TX_ERRORS.TRANSACTION_REVERTED);
    });

    test('should extract WRONG_TRADE from revert string', () => {
      expect(extractErrorCode('wrong_trade')).toBe(AVANTIS_REVERT_ERRORS.WRONG_TRADE);
    });

    test('should extract MAX_TRADES_PER_PAIR', () => {
      expect(extractErrorCode('max_trades_per_pair reached')).toBe(AVANTIS_REVERT_ERRORS.MAX_TRADES_PER_PAIR);
    });

    test('should extract PAIR_NOT_LISTED', () => {
      expect(extractErrorCode('pair_not_listed')).toBe(AVANTIS_REVERT_ERRORS.PAIR_NOT_LISTED);
    });

    test('should extract INSUFFICIENT_MARGIN', () => {
      expect(extractErrorCode('insufficient margin for trade')).toBe('INSUFFICIENT_MARGIN');
    });

    test('should detect rate limit from 429 status', () => {
      expect(extractErrorCode('HTTP 429 Too Many Requests')).toBe('RATE_LIMIT_EXCEEDED');
    });

    test('should detect rate limit from message', () => {
      expect(extractErrorCode('rate limit exceeded')).toBe('RATE_LIMIT_EXCEEDED');
    });

    test('should detect RPC error from 500 status', () => {
      expect(extractErrorCode('HTTP 500 Internal Server Error')).toBe(AVANTIS_TX_ERRORS.RPC_ERROR);
    });

    test('should detect RPC error from 503 status', () => {
      expect(extractErrorCode('HTTP 503 Service Unavailable')).toBe(AVANTIS_TX_ERRORS.RPC_ERROR);
    });

    test('should return UNKNOWN_ERROR for unrecognized messages', () => {
      expect(extractErrorCode('something totally unexpected')).toBe('UNKNOWN_ERROR');
    });
  });

  describe('mapAvantisError', () => {
    test('should map INSUFFICIENT_MARGIN to InsufficientMarginError', () => {
      const result = mapAvantisError('INSUFFICIENT_MARGIN', 'Not enough margin');
      expect(result).toBeInstanceOf(InsufficientMarginError);
      expect(result.exchange).toBe('avantis');
    });

    test('should map INSUFFICIENT_GAS to InsufficientMarginError', () => {
      const result = mapAvantisError(AVANTIS_TX_ERRORS.INSUFFICIENT_GAS, 'No gas');
      expect(result).toBeInstanceOf(InsufficientMarginError);
    });

    test('should map WRONG_TRADE to InvalidOrderError', () => {
      const result = mapAvantisError(AVANTIS_REVERT_ERRORS.WRONG_TRADE, 'Bad trade');
      expect(result).toBeInstanceOf(InvalidOrderError);
    });

    test('should map WRONG_LEVERAGE to InvalidOrderError', () => {
      const result = mapAvantisError(AVANTIS_REVERT_ERRORS.WRONG_LEVERAGE, 'Bad leverage');
      expect(result).toBeInstanceOf(InvalidOrderError);
    });

    test('should map ABOVE_MAX_POS to InvalidOrderError', () => {
      const result = mapAvantisError(AVANTIS_REVERT_ERRORS.ABOVE_MAX_POS, 'Too large');
      expect(result).toBeInstanceOf(InvalidOrderError);
    });

    test('should map PAIR_NOT_LISTED to BadRequestError', () => {
      const result = mapAvantisError(AVANTIS_REVERT_ERRORS.PAIR_NOT_LISTED, 'Not listed');
      expect(result).toBeInstanceOf(BadRequestError);
    });

    test('should map NO_TRADE to InvalidOrderError', () => {
      const result = mapAvantisError(AVANTIS_REVERT_ERRORS.NO_TRADE, 'No trade');
      expect(result).toBeInstanceOf(InvalidOrderError);
    });

    test('should map NO_LIMIT to InvalidOrderError', () => {
      const result = mapAvantisError(AVANTIS_REVERT_ERRORS.NO_LIMIT, 'No limit');
      expect(result).toBeInstanceOf(InvalidOrderError);
    });

    test('should map RATE_LIMIT_EXCEEDED to RateLimitError', () => {
      const result = mapAvantisError('RATE_LIMIT_EXCEEDED', 'Too fast');
      expect(result).toBeInstanceOf(RateLimitError);
    });

    test('should map TX errors to ExchangeUnavailableError', () => {
      const result = mapAvantisError(AVANTIS_TX_ERRORS.RPC_ERROR, 'RPC down');
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
    });

    test('should map TIMEOUT to ExchangeUnavailableError', () => {
      const result = mapAvantisError(AVANTIS_TX_ERRORS.TIMEOUT, 'Timed out');
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
    });

    test('should map unknown code to generic PerpDEXError', () => {
      const result = mapAvantisError('SOMETHING_ELSE', 'Unknown');
      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.exchange).toBe('avantis');
    });
  });

  describe('mapError', () => {
    test('should pass through PerpDEXError unchanged', () => {
      const original = new PerpDEXError('Test', 'TEST', 'avantis');
      expect(mapError(original)).toBe(original);
    });

    test('should map standard Error', () => {
      const error = new Error('insufficient funds');
      const result = mapError(error);
      expect(result).toBeInstanceOf(InsufficientMarginError);
    });

    test('should map unknown error types to ExchangeUnavailableError', () => {
      const result = mapError('string error');
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    test('should map null/undefined to ExchangeUnavailableError', () => {
      const result = mapError(null);
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
    });
  });

  describe('isRetryableError', () => {
    test('should be retryable for RPC_ERROR', () => {
      expect(isRetryableError(AVANTIS_TX_ERRORS.RPC_ERROR)).toBe(true);
    });

    test('should be retryable for TIMEOUT', () => {
      expect(isRetryableError(AVANTIS_TX_ERRORS.TIMEOUT)).toBe(true);
    });

    test('should be retryable for NONCE_TOO_LOW', () => {
      expect(isRetryableError(AVANTIS_TX_ERRORS.NONCE_TOO_LOW)).toBe(true);
    });

    test('should be retryable for RATE_LIMIT_EXCEEDED', () => {
      expect(isRetryableError('RATE_LIMIT_EXCEEDED')).toBe(true);
    });

    test('should NOT be retryable for WRONG_TRADE', () => {
      expect(isRetryableError(AVANTIS_REVERT_ERRORS.WRONG_TRADE)).toBe(false);
    });

    test('should NOT be retryable for INSUFFICIENT_GAS', () => {
      expect(isRetryableError(AVANTIS_TX_ERRORS.INSUFFICIENT_GAS)).toBe(false);
    });
  });
});

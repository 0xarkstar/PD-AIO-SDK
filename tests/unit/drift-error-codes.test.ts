/**
 * Drift Protocol Error Codes Tests
 */

import { describe, test, expect } from '@jest/globals';
import {
  mapDriftError,
  DriftErrorCodes,
} from '../../src/adapters/drift/error-codes.js';
import {
  PerpDEXError,
  InsufficientMarginError,
  InsufficientBalanceError,
  PositionNotFoundError,
  OrderNotFoundError,
  InvalidOrderError,
  ExchangeUnavailableError,
  RateLimitError,
  TransactionFailedError,
  InvalidSignatureError,
  LiquidationError,
} from '../../src/types/errors.js';

describe('Drift Error Codes', () => {
  describe('DriftErrorCodes', () => {
    test('should have all required error codes', () => {
      expect(DriftErrorCodes.INSUFFICIENT_MARGIN).toBe('INSUFFICIENT_MARGIN');
      expect(DriftErrorCodes.INSUFFICIENT_BALANCE).toBe('INSUFFICIENT_BALANCE');
      expect(DriftErrorCodes.INSUFFICIENT_SOL).toBe('INSUFFICIENT_SOL');
      expect(DriftErrorCodes.MAX_LEVERAGE_EXCEEDED).toBe('MAX_LEVERAGE_EXCEEDED');
      expect(DriftErrorCodes.MIN_ORDER_SIZE).toBe('MIN_ORDER_SIZE');
      expect(DriftErrorCodes.POSITION_NOT_FOUND).toBe('POSITION_NOT_FOUND');
      expect(DriftErrorCodes.ORDER_NOT_FOUND).toBe('ORDER_NOT_FOUND');
      expect(DriftErrorCodes.ORACLE_ERROR).toBe('ORACLE_ERROR');
      expect(DriftErrorCodes.MARKET_PAUSED).toBe('MARKET_PAUSED');
      expect(DriftErrorCodes.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(DriftErrorCodes.TRANSACTION_FAILED).toBe('TRANSACTION_FAILED');
      expect(DriftErrorCodes.LIQUIDATION).toBe('LIQUIDATION');
    });
  });

  describe('mapDriftError', () => {
    test('should return PerpDEXError unchanged', () => {
      const original = new PerpDEXError('test', 'TEST', 'drift');
      const mapped = mapDriftError(original);
      expect(mapped).toBe(original);
    });

    // Tests using error patterns that match DRIFT_ERROR_MESSAGES
    test('should map insufficient collateral errors', () => {
      const error = new Error('Insufficient collateral for this trade');
      const mapped = mapDriftError(error);
      expect(mapped).toBeInstanceOf(InsufficientMarginError);
      expect(mapped.exchange).toBe('drift');
    });

    test('should map insufficient balance errors', () => {
      const error = new Error('Insufficient balance available');
      const mapped = mapDriftError(error);
      expect(mapped).toBeInstanceOf(InsufficientBalanceError);
      expect(mapped.exchange).toBe('drift');
    });

    test('should map position not found errors', () => {
      const error = new Error('Position does not exist for this market');
      const mapped = mapDriftError(error);
      expect(mapped).toBeInstanceOf(PositionNotFoundError);
      expect(mapped.exchange).toBe('drift');
    });

    test('should map order not found errors', () => {
      const error = new Error('Order does not exist with ID 12345');
      const mapped = mapDriftError(error);
      expect(mapped).toBeInstanceOf(OrderNotFoundError);
      expect(mapped.exchange).toBe('drift');
    });

    test('should map max leverage errors', () => {
      const error = new Error('Max leverage exceeded for this position');
      const mapped = mapDriftError(error);
      expect(mapped).toBeInstanceOf(InvalidOrderError);
      expect(mapped.code).toBe('MAX_LEVERAGE_EXCEEDED');
    });

    test('should map min order size errors', () => {
      const error = new Error('Min order size requirement not met');
      const mapped = mapDriftError(error);
      expect(mapped).toBeInstanceOf(InvalidOrderError);
      expect(mapped.code).toBe('MIN_ORDER_SIZE');
    });

    test('should map reduce only violation errors', () => {
      const error = new Error('Reduce only order would increase position');
      const mapped = mapDriftError(error);
      expect(mapped).toBeInstanceOf(InvalidOrderError);
      expect(mapped.code).toBe('REDUCE_ONLY_VIOLATION');
    });

    test('should map post only violation errors', () => {
      const error = new Error('Post only order would be filled immediately');
      const mapped = mapDriftError(error);
      expect(mapped).toBeInstanceOf(InvalidOrderError);
      expect(mapped.code).toBe('POST_ONLY_VIOLATION');
    });

    test('should map oracle errors', () => {
      const error = new Error('Oracle price unavailable for market');
      const mapped = mapDriftError(error);
      expect(mapped).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapped.code).toBe('ORACLE_ERROR');
    });

    test('should map market paused errors', () => {
      const error = new Error('Market paused for trading');
      const mapped = mapDriftError(error);
      expect(mapped).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapped.code).toBe('MARKET_PAUSED');
    });

    test('should map rate limit errors', () => {
      const error = new Error('Rate limit exceeded for API calls');
      const mapped = mapDriftError(error);
      expect(mapped).toBeInstanceOf(RateLimitError);
      expect(mapped.exchange).toBe('drift');
    });

    test('should map transaction failed errors', () => {
      const error = new Error('Transaction failed to execute');
      const mapped = mapDriftError(error);
      expect(mapped).toBeInstanceOf(TransactionFailedError);
      expect(mapped.exchange).toBe('drift');
    });

    test('should map liquidation errors', () => {
      const error = new Error('Position liquidation triggered');
      const mapped = mapDriftError(error);
      expect(mapped).toBeInstanceOf(LiquidationError);
      expect(mapped.exchange).toBe('drift');
    });

    describe('Solana-specific errors', () => {
      test('should map blockhash expired errors', () => {
        const error = new Error('Transaction blockhash expired');
        const mapped = mapDriftError(error);
        expect(mapped).toBeInstanceOf(TransactionFailedError);
        expect(mapped.code).toBe('TRANSACTION_EXPIRED');
      });

      test('should map signature verification errors', () => {
        const error = new Error('Signature verification failed');
        const mapped = mapDriftError(error);
        expect(mapped).toBeInstanceOf(InvalidSignatureError);
        expect(mapped.code).toBe('INVALID_SIGNATURE');
      });

      test('should map insufficient lamports errors', () => {
        const error = new Error('Insufficient lamports for transaction');
        const mapped = mapDriftError(error);
        expect(mapped).toBeInstanceOf(InsufficientBalanceError);
        expect(mapped.code).toBe('INSUFFICIENT_SOL');
      });

      test('should map insufficient SOL errors', () => {
        const error = new Error('Insufficient sol for rent');
        const mapped = mapDriftError(error);
        expect(mapped).toBeInstanceOf(InsufficientBalanceError);
        expect(mapped.code).toBe('INSUFFICIENT_SOL');
      });

      test('should map account not found errors', () => {
        const error = new Error('Account not found on chain');
        const mapped = mapDriftError(error);
        expect(mapped).toBeInstanceOf(PerpDEXError);
        expect(mapped.code).toBe('ACCOUNT_NOT_FOUND');
      });

      test('should map user account not found errors', () => {
        // "user account not found" is the pattern that triggers USER_NOT_INITIALIZED
        const error = new Error('User account not found');
        const mapped = mapDriftError(error);
        expect(mapped).toBeInstanceOf(PerpDEXError);
        expect(mapped.code).toBe('USER_NOT_INITIALIZED');
      });
    });

    describe('RPC errors', () => {
      test('should map 429 rate limit errors', () => {
        const error = new Error('HTTP 429 too many requests');
        const mapped = mapDriftError(error);
        expect(mapped).toBeInstanceOf(RateLimitError);
        expect(mapped.code).toBe('RATE_LIMIT');
      });

      test('should map 503 service unavailable errors', () => {
        const error = new Error('HTTP 503 service unavailable');
        const mapped = mapDriftError(error);
        expect(mapped).toBeInstanceOf(ExchangeUnavailableError);
        expect(mapped.code).toBe('RPC_UNAVAILABLE');
      });

      test('should map timeout errors', () => {
        const error = new Error('Request timed out');
        const mapped = mapDriftError(error);
        expect(mapped).toBeInstanceOf(ExchangeUnavailableError);
        expect(mapped.code).toBe('TIMEOUT');
      });
    });

    describe('Drift-specific errors', () => {
      test('should map max positions error', () => {
        const error = new Error('Max number of positions reached');
        const mapped = mapDriftError(error);
        expect(mapped).toBeInstanceOf(InvalidOrderError);
        expect(mapped.code).toBe('MAX_POSITIONS');
      });

      test('should map market not active error', () => {
        const error = new Error('Market not active for trading');
        const mapped = mapDriftError(error);
        expect(mapped).toBeInstanceOf(ExchangeUnavailableError);
        expect(mapped.code).toBe('MARKET_NOT_ACTIVE');
      });

      test('should map price bands error', () => {
        const error = new Error('Order price outside price bands');
        const mapped = mapDriftError(error);
        expect(mapped).toBeInstanceOf(InvalidOrderError);
        expect(mapped.code).toBe('PRICE_BANDS_BREACHED');
      });

      test('should map slippage exceeded error', () => {
        const error = new Error('Order would be filled at worse price than limit');
        const mapped = mapDriftError(error);
        expect(mapped).toBeInstanceOf(InvalidOrderError);
        expect(mapped.code).toBe('SLIPPAGE_EXCEEDED');
      });
    });

    test('should map unknown errors to ExchangeUnavailableError', () => {
      const error = new Error('Some completely unknown error occurred');
      const mapped = mapDriftError(error);
      expect(mapped).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapped.code).toBe('UNKNOWN_ERROR');
      expect(mapped.exchange).toBe('drift');
    });

    test('should handle non-Error objects', () => {
      const mapped = mapDriftError('string error');
      expect(mapped).toBeInstanceOf(ExchangeUnavailableError);
      expect(mapped.code).toBe('UNKNOWN_ERROR');
    });

    test('should handle null/undefined', () => {
      const mappedNull = mapDriftError(null);
      expect(mappedNull).toBeInstanceOf(ExchangeUnavailableError);

      const mappedUndefined = mapDriftError(undefined);
      expect(mappedUndefined).toBeInstanceOf(ExchangeUnavailableError);
    });
  });
});

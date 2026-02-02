/**
 * Jupiter Error Codes Unit Tests
 */

import { describe, test, expect } from '@jest/globals';
import { mapJupiterError, JupiterErrorCodes } from '../../src/adapters/jupiter/error-codes.js';
import {
  PerpDEXError,
  InsufficientMarginError,
  InsufficientBalanceError,
  PositionNotFoundError,
  InvalidOrderError,
  ExchangeUnavailableError,
  RateLimitError,
  TransactionFailedError,
  InvalidSignatureError,
} from '../../src/types/errors.js';

describe('mapJupiterError', () => {
  describe('passthrough', () => {
    test('returns PerpDEXError unchanged', () => {
      const error = new PerpDEXError('Test error', 'TEST_ERROR', 'jupiter');
      const result = mapJupiterError(error);

      expect(result).toBe(error);
    });
  });

  describe('margin errors', () => {
    test('maps insufficient collateral to InsufficientMarginError', () => {
      const error = new Error('Insufficient collateral for position');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(InsufficientMarginError);
      expect(result.exchange).toBe('jupiter');
    });
  });

  describe('balance errors', () => {
    test('maps insufficient balance to InsufficientBalanceError', () => {
      const error = new Error('Insufficient balance to complete trade');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(InsufficientBalanceError);
      expect(result.exchange).toBe('jupiter');
    });

    test('maps insufficient lamports to InsufficientBalanceError', () => {
      const error = new Error('Insufficient lamports for transaction');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(InsufficientBalanceError);
      expect(result.code).toBe('INSUFFICIENT_SOL');
    });

    test('maps insufficient SOL to InsufficientBalanceError', () => {
      const error = new Error('Insufficient SOL for fees');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(InsufficientBalanceError);
      expect(result.code).toBe('INSUFFICIENT_SOL');
    });
  });

  describe('position errors', () => {
    test('maps position not found to PositionNotFoundError', () => {
      const error = new Error('Position not found in account');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(PositionNotFoundError);
      expect(result.exchange).toBe('jupiter');
    });
  });

  describe('order errors', () => {
    test('maps invalid leverage to InvalidOrderError', () => {
      const error = new Error('Invalid leverage specified');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(InvalidOrderError);
      expect(result.exchange).toBe('jupiter');
    });

    test('maps max leverage exceeded to InvalidOrderError', () => {
      const error = new Error('Max leverage exceeded for this market');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(InvalidOrderError);
    });

    test('maps min position size to InvalidOrderError', () => {
      const error = new Error('Below min position size required');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(InvalidOrderError);
    });

    test('maps pool capacity exceeded to InvalidOrderError', () => {
      const error = new Error('Pool capacity exceeded');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(InvalidOrderError);
    });
  });

  describe('oracle errors', () => {
    test('maps oracle price stale to ExchangeUnavailableError', () => {
      const error = new Error('Oracle price stale');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.exchange).toBe('jupiter');
    });
  });

  describe('transaction errors', () => {
    test('maps transaction failed to TransactionFailedError', () => {
      const error = new Error('Transaction failed to confirm');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(TransactionFailedError);
      expect(result.exchange).toBe('jupiter');
    });

    test('maps blockhash expired to TransactionFailedError', () => {
      const error = new Error('Blockhash expired, please retry');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(TransactionFailedError);
      expect(result.code).toBe('TRANSACTION_EXPIRED');
    });

    test('maps expired to TransactionFailedError', () => {
      const error = new Error('Transaction expired');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(TransactionFailedError);
      expect(result.code).toBe('TRANSACTION_EXPIRED');
    });
  });

  describe('signature errors', () => {
    test('maps signature verification to InvalidSignatureError', () => {
      const error = new Error('Signature verification failed');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(InvalidSignatureError);
      expect(result.exchange).toBe('jupiter');
    });
  });

  describe('account errors', () => {
    test('maps account not found to PerpDEXError', () => {
      const error = new Error('Account not found');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.code).toBe('ACCOUNT_NOT_FOUND');
    });

    test('maps account does not exist to PerpDEXError', () => {
      const error = new Error('Account does not exist');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.code).toBe('ACCOUNT_NOT_FOUND');
    });
  });

  describe('rate limit errors', () => {
    test('maps rate limit to RateLimitError', () => {
      const error = new Error('Rate limit exceeded');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(RateLimitError);
      expect(result.exchange).toBe('jupiter');
    });

    test('maps 429 to RateLimitError', () => {
      const error = new Error('HTTP 429: Too Many Requests');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(RateLimitError);
    });

    test('maps too many requests to RateLimitError', () => {
      const error = new Error('Too many requests');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(RateLimitError);
    });
  });

  describe('RPC errors', () => {
    test('maps 503 to ExchangeUnavailableError', () => {
      const error = new Error('HTTP 503: Service Unavailable');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('RPC_UNAVAILABLE');
    });

    test('maps 502 to ExchangeUnavailableError', () => {
      const error = new Error('HTTP 502: Bad Gateway');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('RPC_UNAVAILABLE');
    });

    test('maps 504 to ExchangeUnavailableError', () => {
      const error = new Error('HTTP 504: Gateway Timeout');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('RPC_UNAVAILABLE');
    });
  });

  describe('timeout errors', () => {
    test('maps timeout to ExchangeUnavailableError', () => {
      const error = new Error('Request timeout');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('TIMEOUT');
    });

    test('maps timed out to ExchangeUnavailableError', () => {
      const error = new Error('Connection timed out');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('TIMEOUT');
    });
  });

  describe('unknown errors', () => {
    test('maps unknown error to ExchangeUnavailableError', () => {
      const error = new Error('Something unexpected happened');
      const result = mapJupiterError(error);

      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.exchange).toBe('jupiter');
    });

    test('maps non-Error to ExchangeUnavailableError', () => {
      const result = mapJupiterError('string error');

      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    test('maps null to ExchangeUnavailableError', () => {
      const result = mapJupiterError(null);

      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('UNKNOWN_ERROR');
    });
  });
});

describe('JupiterErrorCodes', () => {
  test('has all expected error codes', () => {
    expect(JupiterErrorCodes.INSUFFICIENT_MARGIN).toBe('INSUFFICIENT_MARGIN');
    expect(JupiterErrorCodes.INSUFFICIENT_BALANCE).toBe('INSUFFICIENT_BALANCE');
    expect(JupiterErrorCodes.INSUFFICIENT_SOL).toBe('INSUFFICIENT_SOL');
    expect(JupiterErrorCodes.INVALID_LEVERAGE).toBe('INVALID_LEVERAGE');
    expect(JupiterErrorCodes.MAX_LEVERAGE_EXCEEDED).toBe('MAX_LEVERAGE_EXCEEDED');
    expect(JupiterErrorCodes.MIN_POSITION_SIZE).toBe('MIN_POSITION_SIZE');
    expect(JupiterErrorCodes.POOL_CAPACITY_EXCEEDED).toBe('POOL_CAPACITY_EXCEEDED');
    expect(JupiterErrorCodes.POSITION_NOT_FOUND).toBe('POSITION_NOT_FOUND');
    expect(JupiterErrorCodes.POSITION_LIQUIDATED).toBe('POSITION_LIQUIDATED');
    expect(JupiterErrorCodes.ORACLE_ERROR).toBe('ORACLE_ERROR');
    expect(JupiterErrorCodes.ORACLE_STALE).toBe('ORACLE_STALE');
    expect(JupiterErrorCodes.TRANSACTION_FAILED).toBe('TRANSACTION_FAILED');
    expect(JupiterErrorCodes.TRANSACTION_EXPIRED).toBe('TRANSACTION_EXPIRED');
    expect(JupiterErrorCodes.INVALID_SIGNATURE).toBe('INVALID_SIGNATURE');
    expect(JupiterErrorCodes.ACCOUNT_NOT_FOUND).toBe('ACCOUNT_NOT_FOUND');
    expect(JupiterErrorCodes.INVALID_ACCOUNT).toBe('INVALID_ACCOUNT');
    expect(JupiterErrorCodes.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    expect(JupiterErrorCodes.RPC_UNAVAILABLE).toBe('RPC_UNAVAILABLE');
    expect(JupiterErrorCodes.TIMEOUT).toBe('TIMEOUT');
    expect(JupiterErrorCodes.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
  });
});

/**
 * GMX v2 Error Codes Unit Tests
 */

import { describe, test, expect } from '@jest/globals';
import { mapGmxError, GmxErrorCodes } from '../../src/adapters/gmx/error-codes.js';
import {
  PerpDEXError,
  InsufficientMarginError,
  InsufficientBalanceError,
  InvalidOrderError,
  InvalidSignatureError,
  OrderNotFoundError,
  PositionNotFoundError,
  RateLimitError,
  TransactionFailedError,
  ExchangeUnavailableError,
  LiquidationError,
} from '../../src/types/errors.js';

describe('mapGmxError', () => {
  describe('PerpDEXError passthrough', () => {
    test('should return same error if already PerpDEXError', () => {
      const originalError = new PerpDEXError('Test error', 'TEST_CODE', 'gmx');
      const result = mapGmxError(originalError);
      expect(result).toBe(originalError);
    });
  });

  describe('Trading errors', () => {
    test('should map insufficient collateral to InsufficientMarginError', () => {
      const error = new Error('Transaction failed: insufficient collateral for position');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(InsufficientMarginError);
      expect(result.exchange).toBe('gmx');
    });

    test('should map insufficient balance to InsufficientBalanceError', () => {
      const error = new Error('insufficient balance in account');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(InsufficientBalanceError);
      expect(result.exchange).toBe('gmx');
    });

    test('should map max leverage exceeded to InvalidOrderError', () => {
      const error = new Error('max leverage exceeded for this market');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(InvalidOrderError);
      expect(result.code).toBe('MAX_LEVERAGE_EXCEEDED');
    });

    test('should map min order size to InvalidOrderError', () => {
      const error = new Error('Order size below min order size requirement');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(InvalidOrderError);
      expect(result.code).toBe('MIN_ORDER_SIZE');
    });

    test('should map slippage exceeded to InvalidOrderError', () => {
      const error = new Error('slippage tolerance exceeded');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(InvalidOrderError);
      expect(result.code).toBe('SLIPPAGE_EXCEEDED');
    });

    test('should map invalid price to InvalidOrderError', () => {
      const error = new Error('invalid price for order');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(InvalidOrderError);
      expect(result.code).toBe('INVALID_PRICE');
    });
  });

  describe('Position errors', () => {
    test('should map position not found to PositionNotFoundError', () => {
      const error = new Error('position not found for account');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(PositionNotFoundError);
      expect(result.exchange).toBe('gmx');
    });

    test('should map liquidation to LiquidationError', () => {
      const error = new Error('Position is under liquidation');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(LiquidationError);
      expect(result.code).toBe('LIQUIDATION');
    });
  });

  describe('Order errors', () => {
    test('should map order not found to OrderNotFoundError', () => {
      const error = new Error('order not found with key');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(OrderNotFoundError);
      expect(result.exchange).toBe('gmx');
    });
  });

  describe('Oracle and market errors', () => {
    test('should map oracle error to ExchangeUnavailableError', () => {
      const error = new Error('oracle error: price feed not available');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('ORACLE_ERROR');
    });

    test('should map market disabled to ExchangeUnavailableError', () => {
      const error = new Error('market disabled temporarily');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('MARKET_PAUSED');
    });

    test('should map market paused to ExchangeUnavailableError', () => {
      const error = new Error('market is paused');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('MARKET_DISABLED');
    });
  });

  describe('Transaction errors', () => {
    test('should map execution failed to TransactionFailedError', () => {
      const error = new Error('Order execution failed by keeper');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(TransactionFailedError);
    });

    test('should map keeper error to ExchangeUnavailableError', () => {
      const error = new Error('keeper not responding');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('KEEPER_ERROR');
    });

    test('should map transaction reverted to TransactionFailedError', () => {
      const error = new Error('Transaction reverted without reason');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(TransactionFailedError);
      expect(result.code).toBe('TX_REVERTED');
    });

    test('should map nonce error to TransactionFailedError', () => {
      const error = new Error('nonce too low');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(TransactionFailedError);
      expect(result.code).toBe('NONCE_ERROR');
    });
  });

  describe('Chain errors', () => {
    test('should map insufficient funds to InsufficientBalanceError', () => {
      const error = new Error('insufficient funds for gas');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(InsufficientBalanceError);
      expect(result.code).toBe('INSUFFICIENT_GAS');
    });

    test('should map insufficient gas to InsufficientBalanceError', () => {
      const error = new Error('insufficient gas for transaction');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(InsufficientBalanceError);
      expect(result.code).toBe('INSUFFICIENT_GAS');
    });

    test('should map signature error to InvalidSignatureError', () => {
      const error = new Error('invalid signature for transaction');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(InvalidSignatureError);
    });

    test('should map unauthorized to InvalidSignatureError', () => {
      const error = new Error('unauthorized: invalid credentials');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(InvalidSignatureError);
    });
  });

  describe('Network errors', () => {
    test('should map 429 to RateLimitError', () => {
      const error = new Error('Request failed with status 429');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(RateLimitError);
    });

    test('should map rate limit to RateLimitError', () => {
      const error = new Error('rate limit exceeded');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(RateLimitError);
    });

    test('should map too many requests to RateLimitError', () => {
      const error = new Error('too many requests');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(RateLimitError);
    });

    test('should map 503 to ExchangeUnavailableError', () => {
      const error = new Error('Request failed with status 503');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('API_UNAVAILABLE');
    });

    test('should map 502 to ExchangeUnavailableError', () => {
      const error = new Error('Request failed with status 502');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
    });

    test('should map timeout to ExchangeUnavailableError', () => {
      const error = new Error('Request timed out');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('TIMEOUT');
    });

    test('should map network error to ExchangeUnavailableError', () => {
      const error = new Error('network connection failed');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    test('should map connection error to ExchangeUnavailableError', () => {
      const error = new Error('connection refused');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('NETWORK_ERROR');
    });
  });

  describe('Subgraph errors', () => {
    test('should map graphql error to ExchangeUnavailableError', () => {
      const error = new Error('graphql query failed');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('SUBGRAPH_ERROR');
    });

    test('should map query error to ExchangeUnavailableError', () => {
      const error = new Error('Invalid query syntax');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('SUBGRAPH_ERROR');
    });
  });

  describe('Market specific errors', () => {
    test('should map market not found to InvalidOrderError', () => {
      const error = new Error('market not found for symbol');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(InvalidOrderError);
      expect(result.code).toBe('INVALID_MARKET');
    });

    test('should map invalid market to InvalidOrderError', () => {
      const error = new Error('invalid market address');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(InvalidOrderError);
      expect(result.code).toBe('INVALID_MARKET');
    });

    test('should map position size exceeds to InvalidOrderError', () => {
      const error = new Error('position size exceeds maximum');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(InvalidOrderError);
      expect(result.code).toBe('MAX_POSITION_SIZE');
    });

    test('should map min collateral to InsufficientMarginError', () => {
      const error = new Error('Below min collateral requirement');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(InsufficientMarginError);
      expect(result.code).toBe('MIN_COLLATERAL');
    });
  });

  describe('Unknown errors', () => {
    test('should return ExchangeUnavailableError for unknown error', () => {
      const error = new Error('Some completely unknown error');
      const result = mapGmxError(error);
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.exchange).toBe('gmx');
    });

    test('should handle non-Error objects', () => {
      const result = mapGmxError('string error');
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    test('should handle null', () => {
      const result = mapGmxError(null);
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
    });

    test('should handle undefined', () => {
      const result = mapGmxError(undefined);
      expect(result).toBeInstanceOf(ExchangeUnavailableError);
    });
  });
});

describe('GmxErrorCodes', () => {
  test('should have trading error codes', () => {
    expect(GmxErrorCodes.INSUFFICIENT_MARGIN).toBe('INSUFFICIENT_MARGIN');
    expect(GmxErrorCodes.INSUFFICIENT_BALANCE).toBe('INSUFFICIENT_BALANCE');
    expect(GmxErrorCodes.MAX_LEVERAGE_EXCEEDED).toBe('MAX_LEVERAGE_EXCEEDED');
    expect(GmxErrorCodes.MIN_ORDER_SIZE).toBe('MIN_ORDER_SIZE');
  });

  test('should have position error codes', () => {
    expect(GmxErrorCodes.POSITION_NOT_FOUND).toBe('POSITION_NOT_FOUND');
    expect(GmxErrorCodes.POSITION_LIQUIDATED).toBe('POSITION_LIQUIDATED');
  });

  test('should have order error codes', () => {
    expect(GmxErrorCodes.ORDER_NOT_FOUND).toBe('ORDER_NOT_FOUND');
    expect(GmxErrorCodes.ORDER_CANCELLED).toBe('ORDER_CANCELLED');
    expect(GmxErrorCodes.INVALID_MARKET).toBe('INVALID_MARKET');
  });

  test('should have oracle error codes', () => {
    expect(GmxErrorCodes.ORACLE_ERROR).toBe('ORACLE_ERROR');
    expect(GmxErrorCodes.INVALID_ORACLE_PRICE).toBe('INVALID_ORACLE_PRICE');
  });

  test('should have market error codes', () => {
    expect(GmxErrorCodes.MARKET_PAUSED).toBe('MARKET_PAUSED');
    expect(GmxErrorCodes.MARKET_DISABLED).toBe('MARKET_DISABLED');
  });

  test('should have transaction error codes', () => {
    expect(GmxErrorCodes.TRANSACTION_FAILED).toBe('TRANSACTION_FAILED');
    expect(GmxErrorCodes.TX_REVERTED).toBe('TX_REVERTED');
    expect(GmxErrorCodes.NONCE_ERROR).toBe('NONCE_ERROR');
  });

  test('should have keeper error codes', () => {
    expect(GmxErrorCodes.KEEPER_ERROR).toBe('KEEPER_ERROR');
    expect(GmxErrorCodes.KEEPER_EXECUTION_FAILED).toBe('KEEPER_EXECUTION_FAILED');
  });

  test('should have network error codes', () => {
    expect(GmxErrorCodes.RATE_LIMIT).toBe('RATE_LIMIT');
    expect(GmxErrorCodes.API_UNAVAILABLE).toBe('API_UNAVAILABLE');
    expect(GmxErrorCodes.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(GmxErrorCodes.TIMEOUT).toBe('TIMEOUT');
    expect(GmxErrorCodes.SUBGRAPH_ERROR).toBe('SUBGRAPH_ERROR');
  });

  test('should have liquidation error code', () => {
    expect(GmxErrorCodes.LIQUIDATION).toBe('LIQUIDATION');
  });

  test('should have unknown error code', () => {
    expect(GmxErrorCodes.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
  });
});

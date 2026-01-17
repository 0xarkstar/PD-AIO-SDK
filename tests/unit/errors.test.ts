/**
 * Error Types Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  PerpDEXError,
  InsufficientMarginError,
  OrderNotFoundError,
  InvalidOrderError,
  PositionNotFoundError,
  NetworkError,
  RateLimitError,
  ExchangeUnavailableError,
  WebSocketDisconnectedError,
  InvalidSignatureError,
  ExpiredAuthError,
  InsufficientPermissionsError,
  TransactionFailedError,
  SlippageExceededError,
  LiquidationError,
  isPerpDEXError,
  isRateLimitError,
  isAuthError,
} from '../../src/types/errors.js';

describe('Error Types', () => {
  describe('PerpDEXError', () => {
    it('should create base error with all properties', () => {
      const error = new PerpDEXError('Test error', 'TEST_CODE', 'test-exchange');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.exchange).toBe('test-exchange');
      expect(error.name).toBe('PerpDEXError');
    });

    it('should preserve original error', () => {
      const original = new Error('Original');
      const error = new PerpDEXError('Test', 'CODE', 'exchange', original);
      expect(error.originalError).toBe(original);
    });

    it('should serialize to JSON', () => {
      const original = new Error('Original');
      const error = new PerpDEXError('Test', 'CODE', 'exchange', original);
      const json = error.toJSON();
      expect(json.name).toBe('PerpDEXError');
      expect(json.message).toBe('Test');
      expect(json.code).toBe('CODE');
      expect(json.exchange).toBe('exchange');
      expect(json.originalError).toBe(original);
    });

    it('should be instanceof Error', () => {
      const error = new PerpDEXError('Test', 'CODE', 'exchange');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('Trading Errors', () => {
    it('InsufficientMarginError should have correct name', () => {
      const error = new InsufficientMarginError('Margin error', 'MARGIN', 'exchange');
      expect(error.name).toBe('InsufficientMarginError');
      expect(error).toBeInstanceOf(PerpDEXError);
    });

    it('OrderNotFoundError should have correct name', () => {
      const error = new OrderNotFoundError('Order not found', 'NOT_FOUND', 'exchange');
      expect(error.name).toBe('OrderNotFoundError');
      expect(error).toBeInstanceOf(PerpDEXError);
    });

    it('InvalidOrderError should have correct name', () => {
      const error = new InvalidOrderError('Invalid order', 'INVALID', 'exchange');
      expect(error.name).toBe('InvalidOrderError');
      expect(error).toBeInstanceOf(PerpDEXError);
    });

    it('PositionNotFoundError should have correct name', () => {
      const error = new PositionNotFoundError('Position not found', 'NOT_FOUND', 'exchange');
      expect(error.name).toBe('PositionNotFoundError');
      expect(error).toBeInstanceOf(PerpDEXError);
    });
  });

  describe('Network Errors', () => {
    it('NetworkError should have correct name', () => {
      const error = new NetworkError('Network error', 'NETWORK', 'exchange');
      expect(error.name).toBe('NetworkError');
      expect(error).toBeInstanceOf(PerpDEXError);
    });

    it('RateLimitError should have correct name and retryAfter', () => {
      const error = new RateLimitError('Rate limited', 'RATE_LIMIT', 'exchange', 60);
      expect(error.name).toBe('RateLimitError');
      expect(error.retryAfter).toBe(60);
      expect(error).toBeInstanceOf(PerpDEXError);
    });

    it('RateLimitError should work without retryAfter', () => {
      const error = new RateLimitError('Rate limited', 'RATE_LIMIT', 'exchange');
      expect(error.retryAfter).toBeUndefined();
    });

    it('ExchangeUnavailableError should have correct name', () => {
      const error = new ExchangeUnavailableError('Unavailable', 'UNAVAILABLE', 'exchange');
      expect(error.name).toBe('ExchangeUnavailableError');
      expect(error).toBeInstanceOf(PerpDEXError);
    });

    it('WebSocketDisconnectedError should have correct name', () => {
      const error = new WebSocketDisconnectedError('Disconnected', 'DISCONNECTED', 'exchange');
      expect(error.name).toBe('WebSocketDisconnectedError');
      expect(error).toBeInstanceOf(PerpDEXError);
    });
  });

  describe('Authentication Errors', () => {
    it('InvalidSignatureError should have correct name', () => {
      const error = new InvalidSignatureError('Invalid signature', 'INVALID_SIG', 'exchange');
      expect(error.name).toBe('InvalidSignatureError');
      expect(error).toBeInstanceOf(PerpDEXError);
    });

    it('ExpiredAuthError should have correct name', () => {
      const error = new ExpiredAuthError('Expired', 'EXPIRED', 'exchange');
      expect(error.name).toBe('ExpiredAuthError');
      expect(error).toBeInstanceOf(PerpDEXError);
    });

    it('InsufficientPermissionsError should have correct name', () => {
      const error = new InsufficientPermissionsError('No permissions', 'NO_PERMS', 'exchange');
      expect(error.name).toBe('InsufficientPermissionsError');
      expect(error).toBeInstanceOf(PerpDEXError);
    });
  });

  describe('DEX-Specific Errors', () => {
    it('TransactionFailedError should have correct name and txHash', () => {
      const error = new TransactionFailedError('Tx failed', 'TX_FAILED', 'exchange', '0x123');
      expect(error.name).toBe('TransactionFailedError');
      expect(error.txHash).toBe('0x123');
      expect(error).toBeInstanceOf(PerpDEXError);
    });

    it('TransactionFailedError should work without txHash', () => {
      const error = new TransactionFailedError('Tx failed', 'TX_FAILED', 'exchange');
      expect(error.txHash).toBeUndefined();
    });

    it('SlippageExceededError should have correct name and prices', () => {
      const error = new SlippageExceededError(
        'Slippage exceeded',
        'SLIPPAGE',
        'exchange',
        100,
        105
      );
      expect(error.name).toBe('SlippageExceededError');
      expect(error.expectedPrice).toBe(100);
      expect(error.actualPrice).toBe(105);
      expect(error).toBeInstanceOf(PerpDEXError);
    });

    it('LiquidationError should have correct name', () => {
      const error = new LiquidationError('Liquidated', 'LIQUIDATION', 'exchange');
      expect(error.name).toBe('LiquidationError');
      expect(error).toBeInstanceOf(PerpDEXError);
    });
  });

  describe('Type Guards', () => {
    it('isPerpDEXError should return true for PerpDEXError', () => {
      const error = new PerpDEXError('Test', 'CODE', 'exchange');
      expect(isPerpDEXError(error)).toBe(true);
    });

    it('isPerpDEXError should return true for subclasses', () => {
      expect(isPerpDEXError(new InsufficientMarginError('Test', 'CODE', 'exchange'))).toBe(true);
      expect(isPerpDEXError(new RateLimitError('Test', 'CODE', 'exchange'))).toBe(true);
    });

    it('isPerpDEXError should return false for regular errors', () => {
      expect(isPerpDEXError(new Error('Test'))).toBe(false);
    });

    it('isPerpDEXError should return false for non-errors', () => {
      expect(isPerpDEXError('string')).toBe(false);
      expect(isPerpDEXError(null)).toBe(false);
      expect(isPerpDEXError(undefined)).toBe(false);
    });

    it('isRateLimitError should return true for RateLimitError', () => {
      const error = new RateLimitError('Rate limited', 'CODE', 'exchange');
      expect(isRateLimitError(error)).toBe(true);
    });

    it('isRateLimitError should return false for other errors', () => {
      expect(isRateLimitError(new PerpDEXError('Test', 'CODE', 'exchange'))).toBe(false);
      expect(isRateLimitError(new Error('Test'))).toBe(false);
    });

    it('isAuthError should return true for auth errors', () => {
      expect(isAuthError(new InvalidSignatureError('Test', 'CODE', 'exchange'))).toBe(true);
      expect(isAuthError(new ExpiredAuthError('Test', 'CODE', 'exchange'))).toBe(true);
      expect(isAuthError(new InsufficientPermissionsError('Test', 'CODE', 'exchange'))).toBe(true);
    });

    it('isAuthError should return false for non-auth errors', () => {
      expect(isAuthError(new PerpDEXError('Test', 'CODE', 'exchange'))).toBe(false);
      expect(isAuthError(new RateLimitError('Test', 'CODE', 'exchange'))).toBe(false);
      expect(isAuthError(new Error('Test'))).toBe(false);
    });
  });
});

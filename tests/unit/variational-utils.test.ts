/**
 * Variational Utils Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  convertOrderRequest,
  countDecimals,
  formatSymbolForAPI,
  parseSymbolFromAPI,
  validateOrderRequest,
  generateClientOrderId,
  isQuoteExpired,
  getQuoteTimeRemaining,
  formatPrice,
  formatAmount,
  safeParseFloat,
} from '../../src/adapters/variational/utils.js';
import type { OrderRequest } from '../../src/types/common.js';
import { PerpDEXError } from '../../src/types/errors.js';

describe('Variational Utils', () => {
  describe('convertOrderRequest', () => {
    it('should convert limit order request', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 1.5,
        price: 50000,
      };

      const result = convertOrderRequest(request);

      expect(result.symbol).toBe('BTC/USDT:USDT');
      expect(result.type).toBe('limit');
      expect(result.side).toBe('buy');
      expect(result.amount).toBe('1.5');
      expect(result.price).toBe('50000');
    });

    it('should convert market order request', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USDT:USDT',
        type: 'market',
        side: 'sell',
        amount: 5.0,
      };

      const result = convertOrderRequest(request);

      expect(result.type).toBe('market');
      expect(result.price).toBeUndefined();
      expect(result.amount).toBe('5');
    });

    it('should include client order ID if provided', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 1.0,
        price: 50000,
        clientOrderId: 'custom-id-123',
      };

      const result = convertOrderRequest(request);

      expect(result.clientOrderId).toBe('custom-id-123');
    });

    it('should handle reduce only flag', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'sell',
        amount: 1.0,
        price: 51000,
        reduceOnly: true,
      };

      const result = convertOrderRequest(request);

      expect(result.reduceOnly).toBe(true);
    });

    it('should handle post only flag', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 1.0,
        price: 49000,
        postOnly: true,
      };

      const result = convertOrderRequest(request);

      expect(result.postOnly).toBe(true);
    });
  });

  describe('countDecimals', () => {
    it('should count decimal places correctly', () => {
      expect(countDecimals('0.5')).toBe(1);
      expect(countDecimals('0.01')).toBe(2);
      expect(countDecimals('0.001')).toBe(3);
      expect(countDecimals('0.0001')).toBe(4);
    });

    it('should return 0 for integers', () => {
      expect(countDecimals('1')).toBe(0);
      expect(countDecimals('100')).toBe(0);
    });

    it('should handle empty or invalid values', () => {
      expect(countDecimals('')).toBe(0);
      expect(countDecimals('abc')).toBe(0);
    });
  });

  describe('formatSymbolForAPI', () => {
    it('should convert unified symbol to Variational format', () => {
      expect(formatSymbolForAPI('BTC/USDT:USDT')).toBe('BTC-USDT-PERP');
      expect(formatSymbolForAPI('ETH/USDT:USDT')).toBe('ETH-USDT-PERP');
      expect(formatSymbolForAPI('SOL/USDT:USDT')).toBe('SOL-USDT-PERP');
    });

    it('should return symbol as-is for invalid format', () => {
      expect(formatSymbolForAPI('INVALID')).toBe('INVALID');
      expect(formatSymbolForAPI('BTC')).toBe('BTC');
    });
  });

  describe('parseSymbolFromAPI', () => {
    it('should convert Variational symbol to unified format', () => {
      expect(parseSymbolFromAPI('BTC-USDT-PERP')).toBe('BTC/USDT:USDT');
      expect(parseSymbolFromAPI('ETH-USDT-PERP')).toBe('ETH/USDT:USDT');
      expect(parseSymbolFromAPI('SOL-USDT-PERP')).toBe('SOL/USDT:USDT');
    });

    it('should return symbol as-is for invalid format', () => {
      expect(parseSymbolFromAPI('INVALID')).toBe('INVALID');
      expect(parseSymbolFromAPI('BTC-USDT')).toBe('BTC-USDT');
    });
  });

  describe('validateOrderRequest', () => {
    it('should validate valid order request', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 1.0,
        price: 50000,
      };

      expect(() => validateOrderRequest(request)).not.toThrow();
    });

    it('should throw error for missing symbol', () => {
      const request = {
        type: 'limit',
        side: 'buy',
        amount: 1.0,
        price: 50000,
      } as OrderRequest;

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
      expect(() => validateOrderRequest(request)).toThrow('Symbol is required');
    });

    it('should throw error for missing type', () => {
      const request = {
        symbol: 'BTC/USDT:USDT',
        side: 'buy',
        amount: 1.0,
        price: 50000,
      } as OrderRequest;

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
      expect(() => validateOrderRequest(request)).toThrow('Order type is required');
    });

    it('should throw error for missing side', () => {
      const request = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        amount: 1.0,
        price: 50000,
      } as OrderRequest;

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
      expect(() => validateOrderRequest(request)).toThrow('Order side is required');
    });

    it('should throw error for missing amount', () => {
      const request = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        price: 50000,
      } as OrderRequest;

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
      expect(() => validateOrderRequest(request)).toThrow('Amount must be greater than 0');
    });

    it('should throw error for invalid amount', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0,
        price: 50000,
      };

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
      expect(() => validateOrderRequest(request)).toThrow('Amount must be greater than 0');
    });

    it('should throw error for negative amount', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: -1.0,
        price: 50000,
      };

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
    });

    it('should throw error for limit order without price', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 1.0,
      };

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
      expect(() => validateOrderRequest(request)).toThrow('Price is required for limit orders');
    });

    it('should allow market order without price', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USDT:USDT',
        type: 'market',
        side: 'buy',
        amount: 1.0,
      };

      expect(() => validateOrderRequest(request)).not.toThrow();
    });

    it('should throw error for invalid price', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 1.0,
        price: 0,
      };

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
    });

    it('should throw error for negative price', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 1.0,
        price: -1000,
      };

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
    });
  });

  describe('generateClientOrderId', () => {
    it('should generate unique client order IDs', () => {
      const id1 = generateClientOrderId();
      const id2 = generateClientOrderId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with correct prefix', () => {
      const id = generateClientOrderId();

      expect(id).toMatch(/^var_/);
    });

    it('should generate IDs with reasonable length', () => {
      const id = generateClientOrderId();

      expect(id.length).toBeGreaterThan(15);
      expect(id.length).toBeLessThan(50);
    });
  });

  describe('isQuoteExpired', () => {
    it('should return true for expired quotes', () => {
      const pastTime = Date.now() - 10000; // 10 seconds ago
      expect(isQuoteExpired(pastTime)).toBe(true);
    });

    it('should return false for valid quotes', () => {
      const futureTime = Date.now() + 10000; // 10 seconds from now
      expect(isQuoteExpired(futureTime)).toBe(false);
    });

    it('should return true for exactly expired quotes', () => {
      const now = Date.now();
      expect(isQuoteExpired(now)).toBe(true);
    });
  });

  describe('getQuoteTimeRemaining', () => {
    it('should return time remaining for valid quotes', () => {
      const futureTime = Date.now() + 5000; // 5 seconds from now
      const remaining = getQuoteTimeRemaining(futureTime);

      expect(remaining).toBeGreaterThan(4900); // Allow small variance
      expect(remaining).toBeLessThanOrEqual(5000);
    });

    it('should return 0 for expired quotes', () => {
      const pastTime = Date.now() - 5000; // 5 seconds ago
      expect(getQuoteTimeRemaining(pastTime)).toBe(0);
    });

    it('should return 0 for exactly expired quotes', () => {
      const now = Date.now();
      const remaining = getQuoteTimeRemaining(now);
      expect(remaining).toBeLessThanOrEqual(1); // Allow tiny variance from execution time
    });
  });

  describe('formatPrice', () => {
    it('should format price with correct precision', () => {
      expect(formatPrice(50000.123, '0.5')).toBe('50000.1');
      expect(formatPrice(50000.123, '0.01')).toBe('50000.12');
      expect(formatPrice(50000.123, '0.001')).toBe('50000.123');
    });

    it('should handle integer tick sizes', () => {
      expect(formatPrice(50000.789, '1')).toBe('50001'); // toFixed rounds up
      expect(formatPrice(50000.123, '10')).toBe('50000');
    });
  });

  describe('formatAmount', () => {
    it('should format amount with correct precision', () => {
      expect(formatAmount(1.5678, '0.1')).toBe('1.6');
      expect(formatAmount(1.5678, '0.01')).toBe('1.57');
      expect(formatAmount(1.5678, '0.001')).toBe('1.568');
    });

    it('should handle integer minimum order sizes', () => {
      expect(formatAmount(1.789, '1')).toBe('2');
    });
  });

  describe('safeParseFloat', () => {
    it('should parse valid number strings', () => {
      expect(safeParseFloat('123.45')).toBe(123.45);
      expect(safeParseFloat('0.001')).toBe(0.001);
      expect(safeParseFloat('1000000')).toBe(1000000);
    });

    it('should parse negative numbers', () => {
      expect(safeParseFloat('-123.45')).toBe(-123.45);
    });

    it('should return 0 for invalid strings', () => {
      expect(safeParseFloat('invalid')).toBe(0);
      expect(safeParseFloat('abc')).toBe(0);
      expect(safeParseFloat('')).toBe(0);
    });

    it('should return 0 for null/undefined', () => {
      expect(safeParseFloat(null as any)).toBe(0);
      expect(safeParseFloat(undefined as any)).toBe(0);
    });

    it('should handle scientific notation', () => {
      expect(safeParseFloat('1e6')).toBe(1000000);
      expect(safeParseFloat('1.5e-3')).toBe(0.0015);
    });

    it('should handle numbers with leading/trailing spaces', () => {
      expect(safeParseFloat('  123.45  ')).toBe(123.45);
    });

    it('should handle numeric values directly', () => {
      expect(safeParseFloat(123.45)).toBe(123.45);
      expect(safeParseFloat(0)).toBe(0);
    });
  });
});

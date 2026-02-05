/**
 * Extended Utils Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  convertOrderRequest,
  validateOrderRequest,
  validateLeverage,
  generateClientOrderId,
  safeParseFloat,
  formatStarkNetAddress,
  isValidStarkNetAddress,
  mapError,
  countDecimals,
  formatSymbolForAPI,
  parseSymbolFromAPI,
  formatPrice,
  formatQuantity,
  calculateLiquidationPrice,
  calculateRequiredMargin,
  calculateUnrealizedPnl,
  formatTimestamp,
  parseTimestamp,
} from '../../src/adapters/extended/utils.js';
import type { OrderRequest } from '../../src/types/common.js';
import { PerpDEXError } from '../../src/types/errors.js';

describe('Extended Utils', () => {
  describe('convertOrderRequest', () => {
    it('should convert limit order request', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: 1.5,
        price: 50000,
      };

      const result = convertOrderRequest(request);

      expect(result.symbol).toBe('BTC/USD:USD');
      expect(result.type).toBe('limit');
      expect(result.side).toBe('buy');
      expect(result.quantity).toBe('1.5');
      expect(result.price).toBe('50000');
    });

    it('should convert market order request', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USD:USD',
        type: 'market',
        side: 'sell',
        amount: 5.0,
      };

      const result = convertOrderRequest(request);

      expect(result.type).toBe('market');
      expect(result.price).toBeUndefined();
      expect(result.quantity).toBe('5');
    });

    it('should include client order ID if provided', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: 1.0,
        price: 50000,
        clientOrderId: 'custom-id-123',
      };

      const result = convertOrderRequest(request);

      expect(result.clientOrderId).toBe('custom-id-123');
    });

    it('should include stop price if provided', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: 1.0,
        price: 50000,
        stopPrice: 49000,
      };

      const result = convertOrderRequest(request);

      expect(result.stopPrice).toBe('49000');
    });

    it('should handle reduce only flag', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
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
        symbol: 'BTC/USD:USD',
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

  describe('validateOrderRequest', () => {
    it('should validate valid order request', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
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
        symbol: 'BTC/USD:USD',
        side: 'buy',
        amount: 1.0,
        price: 50000,
      } as OrderRequest;

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
      expect(() => validateOrderRequest(request)).toThrow('type');
    });

    it('should throw error for missing side', () => {
      const request = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        amount: 1.0,
        price: 50000,
      } as OrderRequest;

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
      expect(() => validateOrderRequest(request)).toThrow('side');
    });

    it('should throw error for missing amount', () => {
      const request = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        price: 50000,
      } as OrderRequest;

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
      expect(() => validateOrderRequest(request)).toThrow('Quantity must be greater than 0');
    });

    it('should throw error for invalid amount', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: 0,
        price: 50000,
      };

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
      expect(() => validateOrderRequest(request)).toThrow('Quantity must be greater than 0');
    });

    it('should throw error for negative amount', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: -1.0,
        price: 50000,
      };

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
    });

    it('should throw error for limit order without price', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: 1.0,
      };

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
      expect(() => validateOrderRequest(request)).toThrow('Price is required for limit orders');
    });

    it('should allow market order without price', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'market',
        side: 'buy',
        amount: 1.0,
      };

      expect(() => validateOrderRequest(request)).not.toThrow();
    });

    it('should throw error for invalid price', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: 1.0,
        price: 0,
      };

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
    });

    it('should throw error for negative price', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: 1.0,
        price: -1000,
      };

      expect(() => validateOrderRequest(request)).toThrow(PerpDEXError);
    });
  });

  describe('validateLeverage', () => {
    it('should validate leverage within range', () => {
      expect(() => validateLeverage(1)).not.toThrow();
      expect(() => validateLeverage(10)).not.toThrow();
      expect(() => validateLeverage(50)).not.toThrow();
      expect(() => validateLeverage(100)).not.toThrow();
    });

    it('should throw error for leverage below minimum', () => {
      expect(() => validateLeverage(0)).toThrow(PerpDEXError);
      expect(() => validateLeverage(-5)).toThrow(PerpDEXError);
    });

    it('should throw error for leverage above maximum', () => {
      expect(() => validateLeverage(101)).toThrow(PerpDEXError);
      expect(() => validateLeverage(200)).toThrow(PerpDEXError);
    });

    it('should throw error for non-integer leverage', () => {
      expect(() => validateLeverage(10.5)).toThrow(PerpDEXError);
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

      expect(id).toMatch(/^ext_/);
    });

    it('should generate IDs with reasonable length', () => {
      const id = generateClientOrderId();

      expect(id.length).toBeGreaterThan(15);
      expect(id.length).toBeLessThan(50);
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
  });

  describe('formatStarkNetAddress', () => {
    it('should format valid StarkNet address', () => {
      const address = '0x1234567890abcdef';
      const result = formatStarkNetAddress(address);

      expect(result).toBeTruthy();
      expect(result).toMatch(/^0x/);
    });

    it('should add 0x prefix if missing', () => {
      const address = '1234567890abcdef';
      const result = formatStarkNetAddress(address);

      expect(result).toBe('0x1234567890abcdef');
    });

    it('should handle already prefixed addresses', () => {
      const address = '0x1234567890abcdef';
      const result = formatStarkNetAddress(address);

      expect(result).toBe('0x1234567890abcdef');
    });

    it('should convert to lowercase', () => {
      const address = '0x1234567890ABCDEF';
      const result = formatStarkNetAddress(address);

      expect(result).toBe('0x1234567890abcdef');
    });

    it('should handle long addresses', () => {
      const address = '0x' + '1'.repeat(63);
      const result = formatStarkNetAddress(address);

      expect(result).toMatch(/^0x1{63}$/);
    });
  });

  describe('isValidStarkNetAddress', () => {
    it('should validate correct StarkNet addresses', () => {
      expect(isValidStarkNetAddress('0x1234567890abcdef')).toBe(true);
      expect(isValidStarkNetAddress('0x' + '0'.repeat(63))).toBe(true);
    });

    it('should reject addresses without 0x prefix', () => {
      expect(isValidStarkNetAddress('1234567890abcdef')).toBe(false);
    });

    it('should reject empty addresses', () => {
      expect(isValidStarkNetAddress('')).toBe(false);
      expect(isValidStarkNetAddress('0x')).toBe(false);
    });

    it('should reject too short addresses', () => {
      expect(isValidStarkNetAddress('0x123')).toBe(false);
    });

    it('should reject addresses with invalid characters', () => {
      expect(isValidStarkNetAddress('0x123g567890abcdef')).toBe(false);
      expect(isValidStarkNetAddress('0x123 567890abcdef')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(isValidStarkNetAddress('0x1234567890ABCDEF')).toBe(true);
      expect(isValidStarkNetAddress('0x1234567890AbCdEf')).toBe(true);
    });
  });

  describe('mapError', () => {
    it('should pass through PerpDEXError unchanged', () => {
      const originalError = new PerpDEXError('Test error', 'TEST_CODE', 'extended');
      const result = mapError(originalError);
      expect(result).toBe(originalError);
    });

    it('should map HTTP response error', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Bad request' },
        },
      };
      const result = mapError(error);
      expect(result).toBeInstanceOf(PerpDEXError);
    });

    it('should map network error (ETIMEDOUT)', () => {
      const error = {
        code: 'ETIMEDOUT',
        message: 'Connection timed out',
      };
      const result = mapError(error);
      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    it('should map network error (ECONNREFUSED)', () => {
      const error = {
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      };
      const result = mapError(error);
      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    it('should map generic Error', () => {
      const error = new Error('Something went wrong');
      const result = mapError(error);
      expect(result).toBeInstanceOf(PerpDEXError);
    });

    it('should handle string error', () => {
      const result = mapError('string error message');
      expect(result).toBeInstanceOf(PerpDEXError);
    });
  });

  describe('countDecimals', () => {
    it('should count decimal places in string', () => {
      expect(countDecimals('0.001')).toBe(3);
      expect(countDecimals('0.1')).toBe(1);
      expect(countDecimals('123.456789')).toBe(6);
    });

    it('should count decimal places in number', () => {
      expect(countDecimals(0.001)).toBe(3);
      expect(countDecimals(0.1)).toBe(1);
    });

    it('should return 0 for integers', () => {
      expect(countDecimals('100')).toBe(0);
      expect(countDecimals(100)).toBe(0);
    });
  });

  describe('formatSymbolForAPI', () => {
    it('should convert unified perpetual symbol to Extended format', () => {
      expect(formatSymbolForAPI('BTC/USD:USD')).toBe('BTC-USD-PERP');
      expect(formatSymbolForAPI('ETH/USDC:USDC')).toBe('ETH-USDC-PERP');
    });

    it('should return original for invalid format', () => {
      expect(formatSymbolForAPI('INVALID')).toBe('INVALID');
      expect(formatSymbolForAPI('BTC')).toBe('BTC');
    });
  });

  describe('parseSymbolFromAPI', () => {
    it('should convert Extended perpetual format to unified', () => {
      expect(parseSymbolFromAPI('BTC-USD-PERP')).toBe('BTC/USD:USD');
      expect(parseSymbolFromAPI('ETH-USDC-PERP')).toBe('ETH/USDC:USDC');
    });

    it('should handle simple dash format', () => {
      expect(parseSymbolFromAPI('BTC-USD')).toBe('BTC/USD:USD');
    });

    it('should handle concatenated format BTCUSD', () => {
      expect(parseSymbolFromAPI('BTCUSD')).toBe('BTC/USD:USD');
      expect(parseSymbolFromAPI('ETHUSDT')).toBe('ETH/USDT:USDT');
      expect(parseSymbolFromAPI('SOLUSDC')).toBe('SOL/USDC:USDC');
    });

    it('should return original for unrecognized format', () => {
      expect(parseSymbolFromAPI('INVALID')).toBe('INVALID');
    });
  });

  describe('formatPrice', () => {
    it('should format price with specified precision', () => {
      expect(formatPrice(50000.123456, 2)).toBe('50000.12');
      expect(formatPrice(50000.123456, 4)).toBe('50000.1235');
      expect(formatPrice(50000.123456, 0)).toBe('50000');
    });
  });

  describe('formatQuantity', () => {
    it('should format quantity with specified precision', () => {
      expect(formatQuantity(1.23456789, 4)).toBe('1.2346');
      expect(formatQuantity(1.23456789, 2)).toBe('1.23');
      expect(formatQuantity(1.23456789, 0)).toBe('1');
    });
  });

  describe('calculateLiquidationPrice', () => {
    it('should calculate liquidation price for long position', () => {
      const liqPrice = calculateLiquidationPrice('long', 50000, 10, 0.005);
      // Long: entry * (1 - 1/leverage + mmr) = 50000 * (1 - 0.1 + 0.005) = 50000 * 0.905 = 45250
      expect(liqPrice).toBeCloseTo(45250, 0);
    });

    it('should calculate liquidation price for short position', () => {
      const liqPrice = calculateLiquidationPrice('short', 50000, 10, 0.005);
      // Short: entry * (1 + 1/leverage - mmr) = 50000 * (1 + 0.1 - 0.005) = 50000 * 1.095 = 54750
      expect(liqPrice).toBeCloseTo(54750, 0);
    });

    it('should use default maintenance margin ratio', () => {
      const liqPrice = calculateLiquidationPrice('long', 50000, 10);
      expect(liqPrice).toBeCloseTo(45250, 0);
    });
  });

  describe('calculateRequiredMargin', () => {
    it('should calculate required margin', () => {
      // positionValue = 1 * 50000 = 50000, margin = 50000 / 10 = 5000
      expect(calculateRequiredMargin(1, 50000, 10)).toBe(5000);
      expect(calculateRequiredMargin(0.5, 50000, 20)).toBe(1250);
    });
  });

  describe('calculateUnrealizedPnl', () => {
    it('should calculate unrealized PnL for long position', () => {
      // Long: size * (markPrice - entryPrice) = 1 * (52000 - 50000) = 2000
      expect(calculateUnrealizedPnl('long', 1, 50000, 52000)).toBe(2000);
      expect(calculateUnrealizedPnl('long', 1, 50000, 48000)).toBe(-2000);
    });

    it('should calculate unrealized PnL for short position', () => {
      // Short: size * (entryPrice - markPrice) = 1 * (50000 - 52000) = -2000
      expect(calculateUnrealizedPnl('short', 1, 50000, 52000)).toBe(-2000);
      expect(calculateUnrealizedPnl('short', 1, 50000, 48000)).toBe(2000);
    });
  });

  describe('formatTimestamp', () => {
    it('should return timestamp as-is', () => {
      expect(formatTimestamp(1234567890000)).toBe(1234567890000);
      expect(formatTimestamp(1234567890)).toBe(1234567890);
    });
  });

  describe('parseTimestamp', () => {
    it('should keep millisecond timestamps as-is', () => {
      expect(parseTimestamp(1234567890000)).toBe(1234567890000);
    });

    it('should convert second timestamps to milliseconds', () => {
      expect(parseTimestamp(1234567890)).toBe(1234567890000);
    });
  });
});

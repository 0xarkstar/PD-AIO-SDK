/**
 * Avantis Utils Unit Tests
 */

import { describe, test, expect } from '@jest/globals';
import {
  getPairIndex,
  getBaseFromPairIndex,
  getPythFeedId,
  convertPythPrice,
  fromUsdcDecimals,
  toUsdcDecimals,
  fromPriceDecimals,
  toPriceDecimals,
  buildOrderParams,
} from '../../../src/adapters/avantis/utils.js';
import type { OrderRequest } from '../../../src/types/common.js';

describe('Avantis Utils', () => {
  describe('getPairIndex', () => {
    test('should return 0 for BTC/USD:USD', () => {
      expect(getPairIndex('BTC/USD:USD')).toBe(0);
    });

    test('should return 1 for ETH/USD:USD', () => {
      expect(getPairIndex('ETH/USD:USD')).toBe(1);
    });

    test('should throw for unknown symbol', () => {
      expect(() => getPairIndex('UNKNOWN/USD:USD')).toThrow('Unknown pair for symbol');
    });
  });

  describe('getBaseFromPairIndex', () => {
    test('should return BTC for index 0', () => {
      expect(getBaseFromPairIndex(0)).toBe('BTC');
    });

    test('should return ETH for index 1', () => {
      expect(getBaseFromPairIndex(1)).toBe('ETH');
    });

    test('should throw for unknown index', () => {
      expect(() => getBaseFromPairIndex(999)).toThrow('Unknown pairIndex');
    });
  });

  describe('getPythFeedId', () => {
    test('should return feed ID for BTC', () => {
      const feedId = getPythFeedId('BTC');
      expect(feedId).toBeDefined();
      expect(feedId).toMatch(/^0x[a-f0-9]+$/);
    });

    test('should return undefined for unknown base', () => {
      expect(getPythFeedId('UNKNOWN')).toBeUndefined();
    });
  });

  describe('convertPythPrice', () => {
    test('should convert with negative exponent', () => {
      // 5000000000 * 10^-8 = 50.0
      expect(convertPythPrice('5000000000', -8)).toBeCloseTo(50.0);
    });

    test('should convert bigint input', () => {
      expect(convertPythPrice(BigInt('5000000000'), -8)).toBeCloseTo(50.0);
    });

    test('should handle zero price', () => {
      expect(convertPythPrice('0', -8)).toBe(0);
    });

    test('should handle large BTC-like price', () => {
      // 6500000000000 * 10^-8 = 65000.0
      expect(convertPythPrice('6500000000000', -8)).toBeCloseTo(65000.0);
    });
  });

  describe('fromUsdcDecimals', () => {
    test('should convert 1000000 to 1.0', () => {
      expect(fromUsdcDecimals('1000000')).toBe(1.0);
    });

    test('should convert bigint input', () => {
      expect(fromUsdcDecimals(BigInt('5000000'))).toBe(5.0);
    });

    test('should handle zero', () => {
      expect(fromUsdcDecimals('0')).toBe(0);
    });
  });

  describe('toUsdcDecimals', () => {
    test('should convert 1.0 to 1000000n', () => {
      expect(toUsdcDecimals(1.0)).toBe(BigInt(1000000));
    });

    test('should convert 100.5 to 100500000n', () => {
      expect(toUsdcDecimals(100.5)).toBe(BigInt(100500000));
    });
  });

  describe('fromPriceDecimals', () => {
    test('should convert 10 decimal price', () => {
      // 650000000000000 / 1e10 = 65000.0
      expect(fromPriceDecimals('650000000000000')).toBeCloseTo(65000.0);
    });

    test('should convert bigint input', () => {
      expect(fromPriceDecimals(BigInt('30000000000000'))).toBeCloseTo(3000.0);
    });
  });

  describe('toPriceDecimals', () => {
    test('should convert 65000.0 to bigint', () => {
      expect(toPriceDecimals(65000.0)).toBe(BigInt('650000000000000'));
    });

    test('should handle fractional prices', () => {
      expect(toPriceDecimals(0.5)).toBe(BigInt('5000000000'));
    });
  });

  describe('buildOrderParams', () => {
    const traderAddress = '0x1234567890123456789012345678901234567890';

    test('should build market buy order params', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'market',
        side: 'buy',
        amount: 100,
      };

      const params = buildOrderParams(request, traderAddress);
      expect(params.trader).toBe(traderAddress);
      expect(params.pairIndex).toBe(0);
      expect(params.buy).toBe(true);
      expect(params.leverage).toBe(10); // default leverage
      expect(params.openPrice).toBe('0'); // market orders use 0
      expect(params.positionSizeDai).toBe(toUsdcDecimals(100).toString());
    });

    test('should build limit sell order with price', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USD:USD',
        type: 'limit',
        side: 'sell',
        amount: 50,
        price: 3500,
      };

      const params = buildOrderParams(request, traderAddress);
      expect(params.pairIndex).toBe(1);
      expect(params.buy).toBe(false);
      expect(params.openPrice).toBe(toPriceDecimals(3500).toString());
    });

    test('should respect custom leverage', () => {
      const request: OrderRequest = {
        symbol: 'SOL/USD:USD',
        type: 'market',
        side: 'buy',
        amount: 200,
        leverage: 50,
      };

      const params = buildOrderParams(request, traderAddress);
      expect(params.leverage).toBe(50);
    });

    test('should set stop loss from stopPrice', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'market',
        side: 'buy',
        amount: 100,
        stopPrice: 60000,
      };

      const params = buildOrderParams(request, traderAddress);
      expect(params.sl).toBe(toPriceDecimals(60000).toString());
      expect(params.tp).toBe('0');
    });

    test('should set index and initialPosToken to 0', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'market',
        side: 'buy',
        amount: 100,
      };

      const params = buildOrderParams(request, traderAddress);
      expect(params.index).toBe(0);
      expect(params.initialPosToken).toBe(0);
    });
  });
});

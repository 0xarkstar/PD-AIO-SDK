/**
 * Unit Tests for Base Normalizer Utilities
 *
 * Tests common normalization functions
 */

import { describe, it, expect } from '@jest/globals';
import {
  parseDecimal,
  parseBigInt,
  parseX18,
  formatX18,
  buildUnifiedSymbol,
  parseUnifiedSymbol,
  extractBaseFromPerpSymbol,
  mapOrderStatus,
  mapOrderType,
  mapOrderSide,
  mapTimeInForce,
  normalizeTimestamp,
  roundToDecimals,
  roundToTickSize,
  roundToStepSize,
  getDecimalPlaces,
} from '../../src/adapters/base/BaseNormalizer.js';

describe('BaseNormalizer', () => {
  describe('parseDecimal', () => {
    it('should parse valid numeric strings', () => {
      expect(parseDecimal('123.45')).toBe(123.45);
      expect(parseDecimal('0')).toBe(0);
      expect(parseDecimal('-50.5')).toBe(-50.5);
    });

    it('should handle number input', () => {
      expect(parseDecimal(123.45)).toBe(123.45);
      expect(parseDecimal(0)).toBe(0);
    });

    it('should return default for null/undefined', () => {
      expect(parseDecimal(null)).toBe(0);
      expect(parseDecimal(undefined)).toBe(0);
      expect(parseDecimal('')).toBe(0);
    });

    it('should return custom default for invalid input', () => {
      expect(parseDecimal('invalid', -1)).toBe(-1);
      expect(parseDecimal(null, 100)).toBe(100);
    });

    it('should handle NaN', () => {
      expect(parseDecimal(NaN)).toBe(0);
      expect(parseDecimal(NaN, -1)).toBe(-1);
    });
  });

  describe('parseBigInt', () => {
    it('should parse valid strings', () => {
      expect(parseBigInt('1000000000000000000')).toBe(BigInt('1000000000000000000'));
      expect(parseBigInt('0')).toBe(BigInt(0));
    });

    it('should handle number input', () => {
      expect(parseBigInt(1000)).toBe(BigInt(1000));
    });

    it('should handle bigint input', () => {
      expect(parseBigInt(BigInt(1000))).toBe(BigInt(1000));
    });

    it('should return default for invalid input', () => {
      expect(parseBigInt(null)).toBe(BigInt(0));
      expect(parseBigInt(undefined, BigInt(-1))).toBe(BigInt(-1));
    });
  });

  describe('parseX18', () => {
    it('should parse x18 format', () => {
      expect(parseX18('1000000000000000000')).toBe(1.0);
      expect(parseX18('1500000000000000000')).toBe(1.5);
      expect(parseX18('500000000000000000')).toBe(0.5);
    });

    it('should handle zero', () => {
      expect(parseX18('0')).toBe(0);
      expect(parseX18(0)).toBe(0);
    });

    it('should handle null/undefined', () => {
      expect(parseX18(null)).toBe(0);
      expect(parseX18(undefined)).toBe(0);
    });

    it('should handle custom decimals', () => {
      expect(parseX18('1000000', 6)).toBe(1.0);
      expect(parseX18('1500000', 6)).toBe(1.5);
    });
  });

  describe('formatX18', () => {
    it('should format to x18', () => {
      expect(formatX18(1.0)).toBe('1000000000000000000');
      expect(formatX18(1.5)).toBe('1500000000000000000');
    });

    it('should handle zero', () => {
      expect(formatX18(0)).toBe('0');
    });

    it('should handle custom decimals', () => {
      expect(formatX18(1.0, 6)).toBe('1000000');
    });
  });

  describe('buildUnifiedSymbol', () => {
    it('should build spot symbol', () => {
      expect(buildUnifiedSymbol('BTC', 'USDT')).toBe('BTC/USDT');
    });

    it('should build perpetual symbol', () => {
      expect(buildUnifiedSymbol('BTC', 'USDT', 'USDT')).toBe('BTC/USDT:USDT');
      expect(buildUnifiedSymbol('ETH', 'USD', 'USD')).toBe('ETH/USD:USD');
    });
  });

  describe('parseUnifiedSymbol', () => {
    it('should parse spot symbol', () => {
      const result = parseUnifiedSymbol('BTC/USDT');
      expect(result.base).toBe('BTC');
      expect(result.quote).toBe('USDT');
      expect(result.settle).toBeUndefined();
      expect(result.isPerp).toBe(false);
    });

    it('should parse perpetual symbol', () => {
      const result = parseUnifiedSymbol('BTC/USDT:USDT');
      expect(result.base).toBe('BTC');
      expect(result.quote).toBe('USDT');
      expect(result.settle).toBe('USDT');
      expect(result.isPerp).toBe(true);
    });
  });

  describe('extractBaseFromPerpSymbol', () => {
    it('should extract base from BTC-PERP format', () => {
      expect(extractBaseFromPerpSymbol('BTC-PERP')).toBe('BTC');
      expect(extractBaseFromPerpSymbol('ETH-PERP')).toBe('ETH');
    });

    it('should extract base from BTC-USD-PERP format', () => {
      expect(extractBaseFromPerpSymbol('BTC-USD-PERP')).toBe('BTC');
    });

    it('should extract base from BTCUSD_PERP format', () => {
      expect(extractBaseFromPerpSymbol('BTCUSD_PERP')).toBe('BTC');
    });

    it('should extract base from BTC_USDT_Perp format', () => {
      expect(extractBaseFromPerpSymbol('BTC_USDT_Perp')).toBe('BTC');
    });

    it('should handle unknown formats', () => {
      // BTCUSDT matches the pattern and extracts BTC
      expect(extractBaseFromPerpSymbol('BTCUSDT')).toBe('BTC');
      expect(extractBaseFromPerpSymbol('BTC')).toBe('BTC');
    });
  });

  describe('mapOrderStatus', () => {
    it('should map open statuses', () => {
      expect(mapOrderStatus('open')).toBe('open');
      expect(mapOrderStatus('new')).toBe('open');
      expect(mapOrderStatus('pending')).toBe('open');
      expect(mapOrderStatus('OPEN')).toBe('open');
    });

    it('should map partially filled to open', () => {
      expect(mapOrderStatus('partially_filled')).toBe('open');
      expect(mapOrderStatus('partiallyFilled')).toBe('open');
    });

    it('should map filled statuses', () => {
      expect(mapOrderStatus('filled')).toBe('closed');
      expect(mapOrderStatus('closed')).toBe('closed');
      expect(mapOrderStatus('executed')).toBe('closed');
    });

    it('should map canceled statuses', () => {
      expect(mapOrderStatus('canceled')).toBe('canceled');
      expect(mapOrderStatus('cancelled')).toBe('canceled');
    });

    it('should return default for unknown', () => {
      expect(mapOrderStatus('unknown')).toBe('open');
      expect(mapOrderStatus('unknown', 'rejected')).toBe('rejected');
    });
  });

  describe('mapOrderType', () => {
    it('should map common order types', () => {
      expect(mapOrderType('limit')).toBe('limit');
      expect(mapOrderType('market')).toBe('market');
      expect(mapOrderType('LIMIT')).toBe('limit');
    });

    it('should map stop order types', () => {
      expect(mapOrderType('stop_market')).toBe('stopMarket');
      expect(mapOrderType('stop_limit')).toBe('stopLimit');
      expect(mapOrderType('stoploss')).toBe('stopMarket');
    });

    it('should return default for unknown', () => {
      expect(mapOrderType('unknown')).toBe('limit');
      expect(mapOrderType('unknown', 'market')).toBe('market');
    });
  });

  describe('mapOrderSide', () => {
    it('should map string sides', () => {
      expect(mapOrderSide('buy')).toBe('buy');
      expect(mapOrderSide('sell')).toBe('sell');
      expect(mapOrderSide('BUY')).toBe('buy');
      expect(mapOrderSide('SELL')).toBe('sell');
    });

    it('should map alternative names', () => {
      expect(mapOrderSide('long')).toBe('buy');
      expect(mapOrderSide('short')).toBe('sell');
      expect(mapOrderSide('bid')).toBe('buy');
      expect(mapOrderSide('ask')).toBe('sell');
    });

    it('should map numeric sides', () => {
      expect(mapOrderSide(1)).toBe('buy');
      expect(mapOrderSide(0)).toBe('buy');
      expect(mapOrderSide(2)).toBe('sell');
    });
  });

  describe('mapTimeInForce', () => {
    it('should map common TIF values', () => {
      expect(mapTimeInForce('GTC')).toBe('GTC');
      expect(mapTimeInForce('IOC')).toBe('IOC');
      expect(mapTimeInForce('FOK')).toBe('FOK');
      expect(mapTimeInForce('PO')).toBe('PO');
    });

    it('should handle long form names', () => {
      expect(mapTimeInForce('GOOD_TIL_CANCEL')).toBe('GTC');
      expect(mapTimeInForce('IMMEDIATE_OR_CANCEL')).toBe('IOC');
      expect(mapTimeInForce('POST_ONLY')).toBe('PO');
    });

    it('should return GTC for undefined', () => {
      expect(mapTimeInForce(undefined)).toBe('GTC');
    });
  });

  describe('normalizeTimestamp', () => {
    it('should handle milliseconds', () => {
      const now = Date.now();
      expect(normalizeTimestamp(now)).toBe(now);
    });

    it('should convert seconds to milliseconds', () => {
      const seconds = 1700000000;
      expect(normalizeTimestamp(seconds)).toBe(seconds * 1000);
    });

    it('should parse ISO strings', () => {
      const iso = '2024-01-01T00:00:00.000Z';
      expect(normalizeTimestamp(iso)).toBe(Date.parse(iso));
    });

    it('should handle Date objects', () => {
      const date = new Date();
      expect(normalizeTimestamp(date)).toBe(date.getTime());
    });

    it('should return current time for null/undefined', () => {
      const before = Date.now();
      const result = normalizeTimestamp(null);
      const after = Date.now();
      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });
  });

  describe('roundToDecimals', () => {
    it('should round to specified decimals', () => {
      expect(roundToDecimals(1.2345, 2)).toBe(1.23);
      expect(roundToDecimals(1.2355, 2)).toBe(1.24);
      expect(roundToDecimals(1.5, 0)).toBe(2);
    });
  });

  describe('roundToTickSize', () => {
    it('should round to tick size', () => {
      expect(roundToTickSize(50123.25, 0.5)).toBe(50123.5);
      expect(roundToTickSize(50123.74, 0.5)).toBe(50123.5);
      expect(roundToTickSize(50123.76, 0.5)).toBe(50124);
    });
  });

  describe('roundToStepSize', () => {
    it('should round down to step size', () => {
      expect(roundToStepSize(1.234, 0.01)).toBe(1.23);
      expect(roundToStepSize(1.239, 0.01)).toBe(1.23);
      expect(roundToStepSize(5.5, 1)).toBe(5);
    });
  });

  describe('getDecimalPlaces', () => {
    it('should return decimal places', () => {
      expect(getDecimalPlaces(0.001)).toBe(3);
      expect(getDecimalPlaces(0.01)).toBe(2);
      expect(getDecimalPlaces(0.1)).toBe(1);
      expect(getDecimalPlaces(1)).toBe(0);
      expect(getDecimalPlaces(10)).toBe(0);
    });
  });
});

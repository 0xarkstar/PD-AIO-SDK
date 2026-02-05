/**
 * dYdX v4 Utilities Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  convertOrderRequest,
  mapTimeframeToDydx,
  getDefaultOHLCVDuration,
  roundToPrecision,
  roundToTickSize,
  roundToStepSize,
  getGoodTilTimeInSeconds,
  parseISOTimestamp,
  buildSubaccountId,
  parseSubaccountId,
  buildQueryString,
  buildUrl,
  DYDX_CANDLE_RESOLUTIONS,
} from '../../src/adapters/dydx/utils.js';
import { unifiedToDydx, dydxToUnified } from '../../src/adapters/dydx/constants.js';
import type { OrderRequest, OHLCVTimeframe } from '../../src/types/index.js';

describe('dYdX Utils', () => {
  // ==========================================================================
  // Symbol Conversion Tests
  // ==========================================================================

  describe('Symbol Conversion', () => {
    describe('unifiedToDydx', () => {
      it('should convert unified perpetual symbol to dYdX format', () => {
        expect(unifiedToDydx('BTC/USD:USD')).toBe('BTC-USD');
        expect(unifiedToDydx('ETH/USD:USD')).toBe('ETH-USD');
        expect(unifiedToDydx('SOL/USD:USD')).toBe('SOL-USD');
      });

      it('should handle simple symbols without settle currency', () => {
        expect(unifiedToDydx('DOGE/USD')).toBe('DOGE-USD');
        expect(unifiedToDydx('AVAX/USD')).toBe('AVAX-USD');
      });

      it('should throw for invalid symbol format', () => {
        expect(() => unifiedToDydx('')).toThrow('Invalid symbol format');
      });
    });

    describe('dydxToUnified', () => {
      it('should convert dYdX symbol to unified format', () => {
        expect(dydxToUnified('BTC-USD')).toBe('BTC/USD:USD');
        expect(dydxToUnified('ETH-USD')).toBe('ETH/USD:USD');
        expect(dydxToUnified('SOL-USD')).toBe('SOL/USD:USD');
      });

      it('should handle symbols without quote', () => {
        // Should use USD as default
        expect(dydxToUnified('BTC')).toBe('BTC/USD:USD');
      });
    });
  });

  // ==========================================================================
  // Order Request Conversion Tests
  // ==========================================================================

  describe('convertOrderRequest', () => {
    it('should convert limit buy order', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
      };

      const result = convertOrderRequest(request, 0);

      expect(result.marketId).toBe('BTC-USD');
      expect(result.side).toBe('BUY');
      expect(result.type).toBe('LIMIT');
      expect(result.size).toBe('0.1');
      expect(result.price).toBe('50000');
      expect(result.subaccountNumber).toBe(0);
    });

    it('should convert market sell order', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USD:USD',
        type: 'market',
        side: 'sell',
        amount: 1.5,
      };

      const result = convertOrderRequest(request, 1);

      expect(result.side).toBe('SELL');
      expect(result.type).toBe('MARKET');
      expect(result.subaccountNumber).toBe(1);
    });

    it('should convert stop limit order', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'stopLimit',
        side: 'sell',
        amount: 0.5,
        price: 48000,
        stopPrice: 49000,
      };

      const result = convertOrderRequest(request, 0);

      expect(result.type).toBe('STOP_LIMIT');
      expect(result.triggerPrice).toBe('49000');
    });

    it('should convert stop market order', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'stopMarket',
        side: 'sell',
        amount: 0.5,
        stopPrice: 49000,
      };

      const result = convertOrderRequest(request, 0);

      expect(result.type).toBe('STOP_MARKET');
      expect(result.triggerPrice).toBe('49000');
    });

    it('should handle IOC time in force', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
        timeInForce: 'IOC',
      };

      const result = convertOrderRequest(request, 0);

      expect(result.timeInForce).toBe('IOC');
      expect(result.execution).toBe('IOC');
    });

    it('should handle FOK time in force', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
        timeInForce: 'FOK',
      };

      const result = convertOrderRequest(request, 0);

      expect(result.timeInForce).toBe('FOK');
      expect(result.execution).toBe('FOK');
    });

    it('should handle post only orders', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
        postOnly: true,
      };

      const result = convertOrderRequest(request, 0);

      expect(result.postOnly).toBe(true);
      expect(result.execution).toBe('POST_ONLY');
    });

    it('should handle reduce only orders', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'sell',
        amount: 0.1,
        price: 51000,
        reduceOnly: true,
      };

      const result = convertOrderRequest(request, 0);

      expect(result.reduceOnly).toBe(true);
    });

    it('should handle client order ID', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
        clientOrderId: '12345',
      };

      const result = convertOrderRequest(request, 0);

      expect(result.clientId).toBe(12345);
    });

    it('should handle non-numeric client order ID', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
        clientOrderId: 'abc-def',
      };

      const result = convertOrderRequest(request, 0);

      // Should fallback to timestamp
      expect(result.clientId).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // OHLCV Timeframe Tests
  // ==========================================================================

  describe('mapTimeframeToDydx', () => {
    it('should map standard timeframes', () => {
      expect(mapTimeframeToDydx('1m')).toBe('1MIN');
      expect(mapTimeframeToDydx('5m')).toBe('5MINS');
      expect(mapTimeframeToDydx('15m')).toBe('15MINS');
      expect(mapTimeframeToDydx('30m')).toBe('30MINS');
      expect(mapTimeframeToDydx('1h')).toBe('1HOUR');
      expect(mapTimeframeToDydx('4h')).toBe('4HOURS');
      expect(mapTimeframeToDydx('1d')).toBe('1DAY');
    });

    it('should default to 1HOUR for unknown timeframes', () => {
      expect(mapTimeframeToDydx('2h' as OHLCVTimeframe)).toBe('1HOUR');
      expect(mapTimeframeToDydx('1w' as OHLCVTimeframe)).toBe('1HOUR');
    });
  });

  describe('getDefaultOHLCVDuration', () => {
    it('should return appropriate durations for timeframes', () => {
      // 1m should return 24 hours
      expect(getDefaultOHLCVDuration('1m')).toBe(24 * 60 * 60 * 1000);

      // 1h should return 30 days
      expect(getDefaultOHLCVDuration('1h')).toBe(30 * 24 * 60 * 60 * 1000);

      // 1d should return 1 year
      expect(getDefaultOHLCVDuration('1d')).toBe(365 * 24 * 60 * 60 * 1000);
    });

    it('should default to 30 days for unknown timeframes', () => {
      expect(getDefaultOHLCVDuration('2h' as OHLCVTimeframe)).toBe(30 * 24 * 60 * 60 * 1000);
    });
  });

  describe('DYDX_CANDLE_RESOLUTIONS constant', () => {
    it('should have all expected resolutions', () => {
      expect(DYDX_CANDLE_RESOLUTIONS['1m']).toBe('1MIN');
      expect(DYDX_CANDLE_RESOLUTIONS['5m']).toBe('5MINS');
      expect(DYDX_CANDLE_RESOLUTIONS['15m']).toBe('15MINS');
      expect(DYDX_CANDLE_RESOLUTIONS['30m']).toBe('30MINS');
      expect(DYDX_CANDLE_RESOLUTIONS['1h']).toBe('1HOUR');
      expect(DYDX_CANDLE_RESOLUTIONS['4h']).toBe('4HOURS');
      expect(DYDX_CANDLE_RESOLUTIONS['1d']).toBe('1DAY');
    });
  });

  // ==========================================================================
  // Precision Helpers Tests
  // ==========================================================================

  describe('roundToPrecision', () => {
    it('should round to specified decimal places', () => {
      expect(roundToPrecision(1.23456, 2)).toBe(1.23);
      expect(roundToPrecision(1.23456, 3)).toBe(1.235);
      expect(roundToPrecision(1.23456, 4)).toBe(1.2346);
    });

    it('should handle zero precision', () => {
      expect(roundToPrecision(1.5, 0)).toBe(2);
      expect(roundToPrecision(1.4, 0)).toBe(1);
    });

    it('should handle negative numbers', () => {
      expect(roundToPrecision(-1.23456, 2)).toBe(-1.23);
    });
  });

  describe('roundToTickSize', () => {
    it('should round price to tick size', () => {
      expect(roundToTickSize(50000.05, 0.1)).toBeCloseTo(50000.1, 2);
      expect(roundToTickSize(50000.04, 0.1)).toBeCloseTo(50000.0, 2);
    });

    it('should handle small tick sizes', () => {
      expect(roundToTickSize(1.2345, 0.001)).toBeCloseTo(1.235, 4);
    });

    it('should handle large tick sizes', () => {
      expect(roundToTickSize(50005, 10)).toBe(50010);
      expect(roundToTickSize(50004, 10)).toBe(50000);
    });
  });

  describe('roundToStepSize', () => {
    it('should floor amount to step size', () => {
      // Note: uses floor, not round - use toBeCloseTo for floating point precision
      expect(roundToStepSize(1.29, 0.1)).toBeCloseTo(1.2, 10);
      expect(roundToStepSize(1.99, 0.1)).toBeCloseTo(1.9, 10);
    });

    it('should handle small step sizes', () => {
      expect(roundToStepSize(0.1234, 0.001)).toBeCloseTo(0.123, 4);
    });
  });

  // ==========================================================================
  // Time Helpers Tests
  // ==========================================================================

  describe('getGoodTilTimeInSeconds', () => {
    it('should return future timestamp', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const result = getGoodTilTimeInSeconds(600);

      expect(result).toBeGreaterThan(nowSeconds);
      expect(result).toBeLessThanOrEqual(nowSeconds + 601); // Allow 1 second variance
    });

    it('should use default duration of 600 seconds', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const result = getGoodTilTimeInSeconds();

      expect(result).toBeGreaterThanOrEqual(nowSeconds + 599);
      expect(result).toBeLessThanOrEqual(nowSeconds + 601);
    });

    it('should handle custom duration', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const result = getGoodTilTimeInSeconds(3600); // 1 hour

      expect(result).toBeGreaterThanOrEqual(nowSeconds + 3599);
      expect(result).toBeLessThanOrEqual(nowSeconds + 3601);
    });
  });

  describe('parseISOTimestamp', () => {
    it('should parse ISO timestamp to milliseconds', () => {
      expect(parseISOTimestamp('2024-01-15T12:00:00.000Z')).toBe(1705320000000);
    });

    it('should handle various ISO formats', () => {
      // Without milliseconds
      expect(parseISOTimestamp('2024-01-15T12:00:00Z')).toBe(1705320000000);

      // With timezone offset
      const result = parseISOTimestamp('2024-01-15T12:00:00+00:00');
      expect(result).toBe(1705320000000);
    });
  });

  // ==========================================================================
  // Subaccount Helpers Tests
  // ==========================================================================

  describe('buildSubaccountId', () => {
    it('should build subaccount ID from address and number', () => {
      expect(buildSubaccountId('dydx1abc123', 0)).toBe('dydx1abc123/0');
      expect(buildSubaccountId('dydx1abc123', 1)).toBe('dydx1abc123/1');
      expect(buildSubaccountId('dydx1xyz789', 5)).toBe('dydx1xyz789/5');
    });
  });

  describe('parseSubaccountId', () => {
    it('should parse subaccount ID into components', () => {
      const result = parseSubaccountId('dydx1abc123/0');

      expect(result.address).toBe('dydx1abc123');
      expect(result.subaccountNumber).toBe(0);
    });

    it('should handle subaccount number greater than 0', () => {
      const result = parseSubaccountId('dydx1xyz789/5');

      expect(result.address).toBe('dydx1xyz789');
      expect(result.subaccountNumber).toBe(5);
    });

    it('should handle missing subaccount number', () => {
      const result = parseSubaccountId('dydx1abc123');

      expect(result.address).toBe('dydx1abc123');
      expect(result.subaccountNumber).toBe(0);
    });

    it('should round-trip with buildSubaccountId', () => {
      const address = 'dydx1test123';
      const subaccountNumber = 3;
      const id = buildSubaccountId(address, subaccountNumber);
      const parsed = parseSubaccountId(id);

      expect(parsed.address).toBe(address);
      expect(parsed.subaccountNumber).toBe(subaccountNumber);
    });
  });

  // ==========================================================================
  // URL Helpers Tests
  // ==========================================================================

  describe('buildQueryString', () => {
    it('should build query string from params', () => {
      const params = { foo: 'bar', count: 10 };
      const result = buildQueryString(params);

      expect(result).toContain('foo=bar');
      expect(result).toContain('count=10');
      expect(result).toContain('&');
    });

    it('should filter out undefined values', () => {
      const params = { foo: 'bar', baz: undefined, count: 10 };
      const result = buildQueryString(params);

      expect(result).toContain('foo=bar');
      expect(result).toContain('count=10');
      expect(result).not.toContain('baz');
    });

    it('should handle boolean values', () => {
      const params = { active: true, disabled: false };
      const result = buildQueryString(params);

      expect(result).toContain('active=true');
      expect(result).toContain('disabled=false');
    });

    it('should encode special characters', () => {
      const params = { search: 'foo bar', symbol: 'BTC/USD' };
      const result = buildQueryString(params);

      expect(result).toContain('search=foo%20bar');
      expect(result).toContain('symbol=BTC%2FUSD');
    });

    it('should return empty string for empty params', () => {
      expect(buildQueryString({})).toBe('');
    });
  });

  describe('buildUrl', () => {
    it('should build URL with path', () => {
      const result = buildUrl('https://api.dydx.exchange', '/v4/markets');

      expect(result).toBe('https://api.dydx.exchange/v4/markets');
    });

    it('should build URL with query parameters', () => {
      const result = buildUrl('https://api.dydx.exchange', '/v4/candles', {
        marketId: 'BTC-USD',
        limit: 100,
      });

      expect(result).toContain('https://api.dydx.exchange/v4/candles?');
      expect(result).toContain('marketId=BTC-USD');
      expect(result).toContain('limit=100');
    });

    it('should handle undefined params', () => {
      const result = buildUrl('https://api.dydx.exchange', '/v4/markets', undefined);

      expect(result).toBe('https://api.dydx.exchange/v4/markets');
    });

    it('should handle empty params object', () => {
      const result = buildUrl('https://api.dydx.exchange', '/v4/markets', {});

      expect(result).toBe('https://api.dydx.exchange/v4/markets');
    });

    it('should filter undefined param values', () => {
      const result = buildUrl('https://api.dydx.exchange', '/v4/orders', {
        marketId: 'BTC-USD',
        status: undefined,
      });

      expect(result).toContain('marketId=BTC-USD');
      expect(result).not.toContain('status');
    });
  });
});

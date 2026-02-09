/**
 * HyperliquidMarketData Unit Tests
 *
 * Tests for OHLCV, funding rate parsing, and interval mapping helpers.
 */

import { describe, it, expect } from '@jest/globals';
import {
  getInterval,
  getDefaultDuration,
  buildOHLCVRequest,
  parseCandles,
  parseFundingRates,
  buildCurrentFundingRate,
} from '../../src/adapters/hyperliquid/HyperliquidMarketData.js';
import type { HyperliquidCandle } from '../../src/adapters/hyperliquid/HyperliquidMarketData.js';

describe('HyperliquidMarketData', () => {
  // =========================================================================
  // getInterval
  // =========================================================================
  describe('getInterval', () => {
    it('should return matching interval for all standard timeframes', () => {
      expect(getInterval('1m')).toBe('1m');
      expect(getInterval('5m')).toBe('5m');
      expect(getInterval('15m')).toBe('15m');
      expect(getInterval('1h')).toBe('1h');
      expect(getInterval('4h')).toBe('4h');
      expect(getInterval('1d')).toBe('1d');
      expect(getInterval('1w')).toBe('1w');
      expect(getInterval('1M')).toBe('1M');
    });

    it('should return all mapped timeframes', () => {
      expect(getInterval('3m')).toBe('3m');
      expect(getInterval('30m')).toBe('30m');
      expect(getInterval('2h')).toBe('2h');
      expect(getInterval('6h')).toBe('6h');
      expect(getInterval('8h')).toBe('8h');
      expect(getInterval('12h')).toBe('12h');
      expect(getInterval('3d')).toBe('3d');
    });

    it('should default to 1h for unknown timeframes', () => {
      expect(getInterval('2m' as any)).toBe('1h');
      expect(getInterval('invalid' as any)).toBe('1h');
    });
  });

  // =========================================================================
  // getDefaultDuration
  // =========================================================================
  describe('getDefaultDuration', () => {
    it('should return positive durations for all timeframes', () => {
      const timeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'] as const;
      for (const tf of timeframes) {
        expect(getDefaultDuration(tf)).toBeGreaterThan(0);
      }
    });

    it('should have longer durations for larger timeframes', () => {
      expect(getDefaultDuration('1d')).toBeGreaterThan(getDefaultDuration('1h'));
      expect(getDefaultDuration('1h')).toBeGreaterThan(getDefaultDuration('1m'));
      expect(getDefaultDuration('1w')).toBeGreaterThan(getDefaultDuration('1d'));
      expect(getDefaultDuration('1M')).toBeGreaterThan(getDefaultDuration('1w'));
    });

    it('should return 30 days for unknown timeframes', () => {
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      expect(getDefaultDuration('invalid' as any)).toBe(thirtyDays);
    });
  });

  // =========================================================================
  // buildOHLCVRequest
  // =========================================================================
  describe('buildOHLCVRequest', () => {
    it('should build request with defaults when no params provided', () => {
      const before = Date.now();
      const result = buildOHLCVRequest('BTC', '1h');
      const after = Date.now();

      expect(result.coin).toBe('BTC');
      expect(result.interval).toBe('1h');
      expect(result.endTime).toBeGreaterThanOrEqual(before);
      expect(result.endTime).toBeLessThanOrEqual(after);
      expect(result.startTime).toBeLessThan(result.endTime);
    });

    it('should use provided since and until', () => {
      const since = 1700000000000;
      const until = 1700100000000;
      const result = buildOHLCVRequest('ETH', '5m', { since, until });

      expect(result.startTime).toBe(since);
      expect(result.endTime).toBe(until);
    });

    it('should use provided since with default endTime', () => {
      const since = 1700000000000;
      const before = Date.now();
      const result = buildOHLCVRequest('BTC', '1d', { since });

      expect(result.startTime).toBe(since);
      expect(result.endTime).toBeGreaterThanOrEqual(before);
    });

    it('should use default startTime with provided until', () => {
      const until = Date.now() + 100000; // future timestamp
      const result = buildOHLCVRequest('BTC', '15m', { until });

      expect(result.endTime).toBe(until);
      expect(result.startTime).toBeLessThan(result.endTime);
    });

    it('should map different timeframe intervals', () => {
      expect(buildOHLCVRequest('BTC', '1m').interval).toBe('1m');
      expect(buildOHLCVRequest('BTC', '4h').interval).toBe('4h');
      expect(buildOHLCVRequest('BTC', '1w').interval).toBe('1w');
    });
  });

  // =========================================================================
  // parseCandles
  // =========================================================================
  describe('parseCandles', () => {
    const mockCandles: HyperliquidCandle[] = [
      { t: 1700000000000, o: '36000.5', h: '36500.0', l: '35800.0', c: '36200.0', v: '1500.5' },
      { t: 1700003600000, o: '36200.0', h: '36800.0', l: '36100.0', c: '36700.0', v: '1200.3' },
      { t: 1700007200000, o: '36700.0', h: '37000.0', l: '36500.0', c: '36900.0', v: '1800.7' },
    ];

    it('should parse candles into OHLCV tuples', () => {
      const result = parseCandles(mockCandles);
      expect(result).toHaveLength(3);

      const [timestamp, open, high, low, close, volume] = result[0];
      expect(timestamp).toBe(1700000000000);
      expect(open).toBe(36000.5);
      expect(high).toBe(36500.0);
      expect(low).toBe(35800.0);
      expect(close).toBe(36200.0);
      expect(volume).toBe(1500.5);
    });

    it('should apply limit (takes last N candles)', () => {
      const result = parseCandles(mockCandles, 2);
      expect(result).toHaveLength(2);
      expect(result[0][0]).toBe(1700003600000);
      expect(result[1][0]).toBe(1700007200000);
    });

    it('should return empty array for null response', () => {
      expect(parseCandles(null)).toEqual([]);
    });

    it('should return empty array for undefined response', () => {
      expect(parseCandles(undefined)).toEqual([]);
    });

    it('should return empty array for non-array response', () => {
      expect(parseCandles('not-an-array' as any)).toEqual([]);
    });

    it('should return all candles when limit exceeds length', () => {
      const result = parseCandles(mockCandles, 100);
      expect(result).toHaveLength(3);
    });

    it('should handle candle with optional n field', () => {
      const candlesWithN: HyperliquidCandle[] = [
        { t: 1700000000000, o: '36000', h: '36500', l: '35800', c: '36200', v: '1500', n: 42 },
      ];
      const result = parseCandles(candlesWithN);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(6); // n is not included in OHLCV tuple
    });
  });

  // =========================================================================
  // parseFundingRates
  // =========================================================================
  describe('parseFundingRates', () => {
    const mockResponse = [
      { coin: 'BTC', fundingRate: '0.0001', premium: '0.0002', time: 1700000000000 },
      { coin: 'BTC', fundingRate: '0.00015', premium: '0.00025', time: 1700028800000 },
      { coin: 'BTC', fundingRate: '-0.0001', premium: '-0.0002', time: 1699971200000 },
    ];

    it('should parse funding rates into unified format', () => {
      const result = parseFundingRates(mockResponse, 'BTC/USDT:USDT', 36000);
      expect(result).toHaveLength(3);

      const rate = result[0];
      expect(rate.symbol).toBe('BTC/USDT:USDT');
      expect(typeof rate.fundingRate).toBe('number');
      expect(rate.markPrice).toBe(36000);
      expect(rate.indexPrice).toBe(36000);
      expect(rate.fundingIntervalHours).toBe(8);
    });

    it('should calculate nextFundingTimestamp as +8 hours', () => {
      const result = parseFundingRates(mockResponse, 'BTC/USDT:USDT', 36000);
      const rate = result[0];
      expect(rate.nextFundingTimestamp).toBe(rate.fundingTimestamp + 8 * 3600 * 1000);
    });

    it('should sort by timestamp descending (newest first)', () => {
      const result = parseFundingRates(mockResponse, 'BTC/USDT:USDT', 36000);
      expect(result[0].fundingTimestamp).toBeGreaterThan(result[1].fundingTimestamp);
      expect(result[1].fundingTimestamp).toBeGreaterThan(result[2].fundingTimestamp);
    });

    it('should apply limit', () => {
      const result = parseFundingRates(mockResponse, 'BTC/USDT:USDT', 36000, 1);
      expect(result).toHaveLength(1);
      // Should be the newest
      expect(result[0].fundingTimestamp).toBe(1700028800000);
    });

    it('should handle negative funding rates', () => {
      const result = parseFundingRates(mockResponse, 'ETH/USDT:USDT', 2000);
      const negativeRate = result.find((r) => r.fundingRate < 0);
      expect(negativeRate).toBeDefined();
      expect(negativeRate!.fundingRate).toBe(-0.0001);
    });

    it('should return all when no limit provided', () => {
      const result = parseFundingRates(mockResponse, 'BTC/USDT:USDT', 36000);
      expect(result).toHaveLength(3);
    });
  });

  // =========================================================================
  // buildCurrentFundingRate
  // =========================================================================
  describe('buildCurrentFundingRate', () => {
    it('should build a single funding rate from latest entry', () => {
      const latest = { coin: 'BTC', fundingRate: '0.0001', premium: '0.0002', time: 1700000000000 };
      const result = buildCurrentFundingRate(latest, 'BTC/USDT:USDT', 36000);

      expect(result.symbol).toBe('BTC/USDT:USDT');
      expect(result.fundingRate).toBe(0.0001);
      expect(result.fundingTimestamp).toBe(1700000000000);
      expect(result.nextFundingTimestamp).toBe(1700000000000 + 8 * 3600 * 1000);
      expect(result.markPrice).toBe(36000);
      expect(result.indexPrice).toBe(36000);
      expect(result.fundingIntervalHours).toBe(8);
    });

    it('should handle zero funding rate', () => {
      const latest = { coin: 'ETH', fundingRate: '0', premium: '0', time: 1700000000000 };
      const result = buildCurrentFundingRate(latest, 'ETH/USDT:USDT', 2000);
      expect(result.fundingRate).toBe(0);
    });

    it('should handle negative funding rate', () => {
      const latest = { coin: 'BTC', fundingRate: '-0.0005', premium: '-0.0003', time: 1700000000000 };
      const result = buildCurrentFundingRate(latest, 'BTC/USDT:USDT', 36000);
      expect(result.fundingRate).toBe(-0.0005);
    });
  });
});

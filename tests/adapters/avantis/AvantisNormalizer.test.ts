/**
 * Avantis Normalizer Unit Tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { AvantisNormalizer } from '../../../src/adapters/avantis/AvantisNormalizer.js';
import type {
  AvantisPairInfo,
  AvantisOpenTrade,
  AvantisBalance,
  AvantisPythPrice,
  AvantisFundingFees,
} from '../../../src/adapters/avantis/types.js';

describe('AvantisNormalizer', () => {
  let normalizer: AvantisNormalizer;

  beforeEach(() => {
    normalizer = new AvantisNormalizer();
  });

  describe('symbolToCCXT', () => {
    test('should convert pair index 0 to BTC/USD:USD', () => {
      expect(normalizer.symbolToCCXT(0)).toBe('BTC/USD:USD');
    });

    test('should convert pair index 1 to ETH/USD:USD', () => {
      expect(normalizer.symbolToCCXT(1)).toBe('ETH/USD:USD');
    });
  });

  describe('normalizeMarket', () => {
    const mockPair: AvantisPairInfo = {
      pairIndex: 0,
      from: 'BTC',
      to: 'USD',
      spreadP: '1500000000', // 0.15% spread in raw form
      groupIndex: 0,
      feeIndex: 0,
    };

    test('should normalize market with correct symbol', () => {
      const market = normalizer.normalizeMarket(mockPair);
      expect(market.symbol).toBe('BTC/USD:USD');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('USD');
    });

    test('should set id to pairIndex string', () => {
      const market = normalizer.normalizeMarket(mockPair);
      expect(market.id).toBe('0');
    });

    test('should set active to true', () => {
      const market = normalizer.normalizeMarket(mockPair);
      expect(market.active).toBe(true);
    });

    test('should parse spread as fee', () => {
      const market = normalizer.normalizeMarket(mockPair);
      const expectedFee = parseFloat('1500000000') / 100;
      expect(market.makerFee).toBe(expectedFee);
      expect(market.takerFee).toBe(expectedFee);
    });

    test('should set maxLeverage to 150', () => {
      const market = normalizer.normalizeMarket(mockPair);
      expect(market.maxLeverage).toBe(150);
    });

    test('should include raw info', () => {
      const market = normalizer.normalizeMarket(mockPair);
      expect(market.info.pairIndex).toBe(0);
      expect(market.info.groupIndex).toBe(0);
      expect(market.info.feeIndex).toBe(0);
    });

    test('should set precision values', () => {
      const market = normalizer.normalizeMarket(mockPair);
      expect(market.pricePrecision).toBe(8);
      expect(market.amountPrecision).toBe(6);
    });

    test('should set tick and step sizes', () => {
      const market = normalizer.normalizeMarket(mockPair);
      expect(market.priceTickSize).toBe(0.01);
      expect(market.amountStepSize).toBe(0.001);
    });
  });

  describe('normalizeTicker', () => {
    const mockPythPrice: AvantisPythPrice = {
      price: '6500000000000',   // 65000 * 10^8
      conf: '50000000',         // 0.5 * 10^8
      expo: -8,
      publishTime: 1700000000,
    };

    test('should normalize ticker with correct symbol', () => {
      const ticker = normalizer.normalizeTicker(0, mockPythPrice);
      expect(ticker.symbol).toBe('BTC/USD:USD');
    });

    test('should compute last price from pyth data', () => {
      const ticker = normalizer.normalizeTicker(0, mockPythPrice);
      expect(ticker.last).toBeCloseTo(65000.0);
    });

    test('should compute bid/ask from confidence interval', () => {
      const ticker = normalizer.normalizeTicker(0, mockPythPrice);
      const confidence = 50000000 * Math.pow(10, -8);
      expect(ticker.bid).toBeCloseTo(65000.0 - confidence);
      expect(ticker.ask).toBeCloseTo(65000.0 + confidence);
    });

    test('should set close to price', () => {
      const ticker = normalizer.normalizeTicker(0, mockPythPrice);
      expect(ticker.close).toBeCloseTo(65000.0);
    });

    test('should set timestamp from publishTime (ms)', () => {
      const ticker = normalizer.normalizeTicker(0, mockPythPrice);
      expect(ticker.timestamp).toBe(1700000000 * 1000);
    });

    test('should set volume fields to 0 (oracle-based)', () => {
      const ticker = normalizer.normalizeTicker(0, mockPythPrice);
      expect(ticker.baseVolume).toBe(0);
      expect(ticker.quoteVolume).toBe(0);
    });

    test('should include pyth info in info field', () => {
      const ticker = normalizer.normalizeTicker(0, mockPythPrice);
      expect(ticker.info.pythPrice).toBe('6500000000000');
      expect(ticker.info.pythConf).toBe('50000000');
      expect(ticker.info.pythExpo).toBe(-8);
    });
  });

  describe('normalizePosition', () => {
    const mockTrade: AvantisOpenTrade = {
      trader: '0xTrader',
      pairIndex: 0,
      index: 0,
      initialPosToken: '0',
      positionSizeDai: '100000000', // 100 USDC (6 decimals)
      openPrice: '650000000000000', // 65000 (10 decimals)
      buy: true,
      leverage: '10',
      tp: '700000000000000',
      sl: '600000000000000',
    };

    test('should normalize long position', () => {
      const pos = normalizer.normalizePosition(mockTrade, 66000);
      expect(pos.symbol).toBe('BTC/USD:USD');
      expect(pos.side).toBe('long');
    });

    test('should normalize short position', () => {
      const shortTrade = { ...mockTrade, buy: false };
      const pos = normalizer.normalizePosition(shortTrade, 64000);
      expect(pos.side).toBe('short');
    });

    test('should compute size in base units', () => {
      const pos = normalizer.normalizePosition(mockTrade, 66000);
      // positionSize = 100, leverage = 10, entryPrice = 65000
      // size = (100 * 10) / 65000
      const expectedSize = (100 * 10) / 65000;
      expect(pos.size).toBeCloseTo(expectedSize, 6);
    });

    test('should compute positive unrealizedPnl for profitable long', () => {
      const pos = normalizer.normalizePosition(mockTrade, 66000);
      // priceDelta = 66000 - 65000 = 1000
      // unrealizedPnl = size * 1000
      expect(pos.unrealizedPnl).toBeGreaterThan(0);
    });

    test('should compute negative unrealizedPnl for losing long', () => {
      const pos = normalizer.normalizePosition(mockTrade, 64000);
      expect(pos.unrealizedPnl).toBeLessThan(0);
    });

    test('should set margin to positionSize in USDC', () => {
      const pos = normalizer.normalizePosition(mockTrade, 66000);
      expect(pos.margin).toBeCloseTo(100.0);
    });

    test('should set marginMode to isolated', () => {
      const pos = normalizer.normalizePosition(mockTrade, 66000);
      expect(pos.marginMode).toBe('isolated');
    });

    test('should include trade info', () => {
      const pos = normalizer.normalizePosition(mockTrade, 66000);
      expect(pos.info.trader).toBe('0xTrader');
      expect(pos.info.pairIndex).toBe(0);
      expect(pos.info.tradeIndex).toBe(0);
    });
  });

  describe('normalizeBalance', () => {
    test('should normalize USDC balance with 6 decimals', () => {
      const balance: AvantisBalance = {
        asset: 'USDC',
        balance: '5000000000', // 5000 USDC
        decimals: 6,
      };
      const result = normalizer.normalizeBalance(balance);
      expect(result.currency).toBe('USDC');
      expect(result.total).toBeCloseTo(5000.0);
      expect(result.free).toBeCloseTo(5000.0);
      expect(result.used).toBe(0);
      expect(result.usdValue).toBeCloseTo(5000.0);
    });

    test('should handle zero balance', () => {
      const balance: AvantisBalance = {
        asset: 'USDC',
        balance: '0',
        decimals: 6,
      };
      const result = normalizer.normalizeBalance(balance);
      expect(result.total).toBe(0);
      expect(result.free).toBe(0);
    });
  });

  describe('normalizeFundingRate', () => {
    const mockFunding: AvantisFundingFees = {
      accPerOiLong: '1000000000000000000',  // 1e18 = 1.0
      accPerOiShort: '500000000000000000',  // 0.5e18 = 0.5
      lastUpdateBlock: 12345678,
    };

    test('should normalize funding rate with correct symbol', () => {
      const result = normalizer.normalizeFundingRate(0, mockFunding, 65000);
      expect(result.symbol).toBe('BTC/USD:USD');
    });

    test('should compute fundingRate as longRate - shortRate', () => {
      const result = normalizer.normalizeFundingRate(0, mockFunding, 65000);
      // 1.0 - 0.5 = 0.5
      expect(result.fundingRate).toBeCloseTo(0.5);
    });

    test('should set markPrice and indexPrice', () => {
      const result = normalizer.normalizeFundingRate(0, mockFunding, 65000);
      expect(result.markPrice).toBe(65000);
      expect(result.indexPrice).toBe(65000);
    });

    test('should set funding interval to 1 hour', () => {
      const result = normalizer.normalizeFundingRate(0, mockFunding, 65000);
      expect(result.fundingIntervalHours).toBe(1);
    });

    test('should set nextFundingTimestamp 1 hour after fundingTimestamp', () => {
      const result = normalizer.normalizeFundingRate(0, mockFunding, 65000);
      expect(result.nextFundingTimestamp - result.fundingTimestamp).toBe(1 * 3600 * 1000);
    });
  });
});

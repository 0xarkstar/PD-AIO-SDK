/**
 * GMX v2 Integration Tests
 *
 * These tests require network access to GMX API.
 * Run with: npm test -- --testPathPattern="integration/gmx"
 *
 * Tests are skipped by default. Remove .skip to run with live API.
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { GmxAdapter } from '../../src/adapters/gmx/GmxAdapter.js';
import { GMX_MARKETS } from '../../src/adapters/gmx/constants.js';

describe('GMX v2 Integration Tests', () => {
  let adapter: GmxAdapter;

  beforeAll(async () => {
    adapter = new GmxAdapter({ chain: 'arbitrum' });
  });

  afterAll(async () => {
    await adapter.disconnect();
  });

  describe.skip('Initialization', () => {
    test('should initialize successfully', async () => {
      await adapter.initialize();
      expect(adapter.isReady).toBe(true);
    });
  });

  describe.skip('Market Data', () => {
    beforeAll(async () => {
      if (!adapter.isReady) {
        await adapter.initialize();
      }
    });

    test('should fetch markets', async () => {
      const markets = await adapter.fetchMarkets();

      expect(markets.length).toBeGreaterThan(0);

      const ethMarket = markets.find((m) => m.symbol === 'ETH/USD:ETH');
      expect(ethMarket).toBeDefined();
      expect(ethMarket?.base).toBe('ETH');
      expect(ethMarket?.quote).toBe('USD');
      expect(ethMarket?.active).toBe(true);
    });

    test('should fetch ETH ticker', async () => {
      const ticker = await adapter.fetchTicker('ETH/USD:ETH');

      expect(ticker.symbol).toBe('ETH/USD:ETH');
      expect(ticker.last).toBeGreaterThan(0);
      expect(ticker.bid).toBeGreaterThan(0);
      expect(ticker.ask).toBeGreaterThan(0);
      expect(ticker.ask).toBeGreaterThanOrEqual(ticker.bid);
    });

    test('should fetch BTC ticker', async () => {
      const ticker = await adapter.fetchTicker('BTC/USD:BTC');

      expect(ticker.symbol).toBe('BTC/USD:BTC');
      expect(ticker.last).toBeGreaterThan(0);
    });

    test('should throw for invalid market', async () => {
      await expect(adapter.fetchTicker('INVALID/USD')).rejects.toThrow();
    });
  });

  describe.skip('OHLCV Data', () => {
    beforeAll(async () => {
      if (!adapter.isReady) {
        await adapter.initialize();
      }
    });

    test('should fetch 1h candles', async () => {
      const candles = await adapter.fetchOHLCV('ETH/USD:ETH', '1h', { limit: 10 });

      expect(candles.length).toBeGreaterThan(0);
      expect(candles.length).toBeLessThanOrEqual(10);

      // Check OHLCV format [timestamp, open, high, low, close, volume]
      const [timestamp, open, high, low, close, volume] = candles[0];
      expect(timestamp).toBeGreaterThan(0);
      expect(open).toBeGreaterThan(0);
      expect(high).toBeGreaterThanOrEqual(open);
      expect(high).toBeGreaterThanOrEqual(low);
      expect(low).toBeLessThanOrEqual(open);
      expect(close).toBeGreaterThan(0);
    });

    test('should fetch 4h candles', async () => {
      const candles = await adapter.fetchOHLCV('ETH/USD:ETH', '4h', { limit: 5 });

      expect(candles.length).toBeGreaterThan(0);
    });

    test('should fetch daily candles', async () => {
      const candles = await adapter.fetchOHLCV('BTC/USD:BTC', '1d', { limit: 7 });

      expect(candles.length).toBeGreaterThan(0);
    });
  });

  describe.skip('Funding Rate', () => {
    beforeAll(async () => {
      if (!adapter.isReady) {
        await adapter.initialize();
      }
    });

    test('should fetch ETH funding rate', async () => {
      const funding = await adapter.fetchFundingRate('ETH/USD:ETH');

      expect(funding.symbol).toBe('ETH/USD:ETH');
      expect(typeof funding.fundingRate).toBe('number');
      expect(funding.fundingTimestamp).toBeGreaterThan(0);
      expect(funding.markPrice).toBeGreaterThan(0);
      expect(funding.indexPrice).toBeGreaterThan(0);
    });

    test('should fetch BTC funding rate', async () => {
      const funding = await adapter.fetchFundingRate('BTC/USD:BTC');

      expect(funding.symbol).toBe('BTC/USD:BTC');
      expect(typeof funding.fundingRate).toBe('number');
    });

    test('funding info should include open interest', async () => {
      const funding = await adapter.fetchFundingRate('ETH/USD:ETH');

      expect(funding.info).toBeDefined();
      expect(typeof funding.info.longOpenInterestUsd).toBe('number');
      expect(typeof funding.info.shortOpenInterestUsd).toBe('number');
    });
  });

  describe.skip('Avalanche Chain', () => {
    let avaxAdapter: GmxAdapter;

    beforeAll(async () => {
      avaxAdapter = new GmxAdapter({ chain: 'avalanche' });
      await avaxAdapter.initialize();
    });

    afterAll(async () => {
      await avaxAdapter.disconnect();
    });

    test('should fetch Avalanche markets', async () => {
      const markets = await avaxAdapter.fetchMarkets();

      expect(markets.length).toBeGreaterThan(0);

      const avaxMarket = markets.find((m) => m.base === 'AVAX');
      expect(avaxMarket).toBeDefined();
    });

    test('should fetch AVAX ticker', async () => {
      const ticker = await avaxAdapter.fetchTicker('AVAX/USD:AVAX');

      expect(ticker.symbol).toBe('AVAX/USD:AVAX');
      expect(ticker.last).toBeGreaterThan(0);
    });
  });

  describe.skip('Error Handling', () => {
    beforeAll(async () => {
      if (!adapter.isReady) {
        await adapter.initialize();
      }
    });

    test('should handle invalid symbol gracefully', async () => {
      await expect(adapter.fetchTicker('NOTEXIST/USD')).rejects.toThrow(/invalid|not found|unknown/i);
    });

    test('should handle invalid timeframe gracefully', async () => {
      // GMX adapter maps unsupported timeframes to nearest supported
      const candles = await adapter.fetchOHLCV('ETH/USD:ETH', '1m', { limit: 5 });
      expect(candles.length).toBeGreaterThan(0);
    });
  });
});

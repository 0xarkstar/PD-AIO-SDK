/**
 * Drift Protocol Integration Tests
 *
 * These tests make real API calls to Drift Protocol's DLOB API.
 * They are skipped by default unless DRIFT_INTEGRATION_TESTS=true is set.
 *
 * To run:
 *   DRIFT_INTEGRATION_TESTS=true npm test -- --testPathPattern="drift-integration"
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { DriftAdapter, type DriftConfig } from '../../src/adapters/drift/DriftAdapter.js';

const INTEGRATION_TESTS_ENABLED = process.env.DRIFT_INTEGRATION_TESTS === 'true';

const describeIfIntegration = INTEGRATION_TESTS_ENABLED ? describe : describe.skip;

describeIfIntegration('Drift Integration Tests', () => {
  let adapter: DriftAdapter;

  beforeAll(async () => {
    // Use a read-only wallet address for integration tests
    // This is a random valid Solana address for testing
    const config: DriftConfig = {
      walletAddress: process.env.DRIFT_WALLET_ADDRESS || '11111111111111111111111111111111',
      testnet: false, // Use mainnet for integration tests (more reliable)
    };

    adapter = new DriftAdapter(config);
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('Market Data', () => {
    test('should fetch markets', async () => {
      const markets = await adapter.fetchMarkets();

      expect(Array.isArray(markets)).toBe(true);
      expect(markets.length).toBeGreaterThan(0);

      // Check first market structure
      const market = markets[0];
      expect(market.symbol).toBeDefined();
      expect(market.base).toBeDefined();
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('USD');
      expect(market.maxLeverage).toBeGreaterThan(0);

      console.log(`Fetched ${markets.length} markets`);
      console.log('Sample market:', {
        symbol: market.symbol,
        base: market.base,
        maxLeverage: market.maxLeverage,
        minAmount: market.minAmount,
      });
    });

    test('should fetch SOL ticker', async () => {
      const ticker = await adapter.fetchTicker('SOL/USD:USD');

      expect(ticker.symbol).toBe('SOL/USD:USD');
      expect(ticker.last).toBeGreaterThan(0);
      expect(ticker.bid).toBeGreaterThan(0);
      expect(ticker.ask).toBeGreaterThan(0);
      expect(ticker.timestamp).toBeDefined();

      console.log('SOL ticker:', {
        last: ticker.last,
        bid: ticker.bid,
        ask: ticker.ask,
        volume: ticker.quoteVolume,
      });
    });

    test('should fetch BTC ticker', async () => {
      const ticker = await adapter.fetchTicker('BTC/USD:USD');

      expect(ticker.symbol).toBe('BTC/USD:USD');
      expect(ticker.last).toBeGreaterThan(10000); // BTC should be > $10k
      expect(ticker.bid).toBeGreaterThan(0);
      expect(ticker.ask).toBeGreaterThan(0);

      console.log('BTC ticker:', {
        last: ticker.last,
        bid: ticker.bid,
        ask: ticker.ask,
      });
    });

    test('should fetch ETH ticker', async () => {
      const ticker = await adapter.fetchTicker('ETH/USD:USD');

      expect(ticker.symbol).toBe('ETH/USD:USD');
      expect(ticker.last).toBeGreaterThan(100); // ETH should be > $100
      expect(ticker.bid).toBeGreaterThan(0);
      expect(ticker.ask).toBeGreaterThan(0);

      console.log('ETH ticker:', {
        last: ticker.last,
        bid: ticker.bid,
        ask: ticker.ask,
      });
    });

    test('should fetch orderbook', async () => {
      const orderbook = await adapter.fetchOrderBook('SOL/USD:USD', 10);

      expect(orderbook.symbol).toBe('SOL/USD:USD');
      expect(orderbook.exchange).toBe('drift');
      expect(Array.isArray(orderbook.bids)).toBe(true);
      expect(Array.isArray(orderbook.asks)).toBe(true);
      expect(orderbook.bids.length).toBeGreaterThan(0);
      expect(orderbook.asks.length).toBeGreaterThan(0);

      // Verify bid/ask structure
      const [bidPrice, bidSize] = orderbook.bids[0];
      const [askPrice, askSize] = orderbook.asks[0];

      expect(bidPrice).toBeGreaterThan(0);
      expect(bidSize).toBeGreaterThan(0);
      expect(askPrice).toBeGreaterThan(0);
      expect(askSize).toBeGreaterThan(0);
      expect(bidPrice).toBeLessThan(askPrice); // Bid < Ask

      console.log('Orderbook:', {
        bestBid: bidPrice,
        bestAsk: askPrice,
        spread: ((askPrice - bidPrice) / bidPrice * 100).toFixed(4) + '%',
        bidLevels: orderbook.bids.length,
        askLevels: orderbook.asks.length,
      });
    });

    test('should fetch recent trades', async () => {
      const trades = await adapter.fetchTrades('SOL/USD:USD', undefined, 10);

      expect(Array.isArray(trades)).toBe(true);
      expect(trades.length).toBeGreaterThan(0);

      const trade = trades[0];
      expect(trade.symbol).toBe('SOL/USD:USD');
      expect(trade.price).toBeGreaterThan(0);
      expect(trade.amount).toBeGreaterThan(0);
      expect(['buy', 'sell']).toContain(trade.side);
      expect(trade.timestamp).toBeDefined();

      console.log('Recent trades:', {
        count: trades.length,
        latestTrade: {
          side: trade.side,
          price: trade.price,
          amount: trade.amount,
        },
      });
    });
  });

  describe('Funding Data', () => {
    test('should fetch current funding rate', async () => {
      const funding = await adapter.fetchFundingRate('SOL/USD:USD');

      expect(funding.symbol).toBe('SOL/USD:USD');
      expect(typeof funding.fundingRate).toBe('number');
      expect(funding.fundingTimestamp).toBeDefined();
      expect(funding.nextFundingTimestamp).toBeDefined();
      expect(funding.fundingIntervalHours).toBe(1);

      // Funding rate should be reasonable (< 1% per hour)
      expect(Math.abs(funding.fundingRate)).toBeLessThan(0.01);

      console.log('Funding rate:', {
        symbol: funding.symbol,
        rate: (funding.fundingRate * 100).toFixed(6) + '%',
        annualized: (funding.fundingRate * 24 * 365 * 100).toFixed(2) + '%',
        nextFunding: new Date(funding.nextFundingTimestamp).toISOString(),
      });
    });

    test('should fetch funding rate for BTC', async () => {
      const funding = await adapter.fetchFundingRate('BTC/USD:USD');

      expect(funding.symbol).toBe('BTC/USD:USD');
      expect(typeof funding.fundingRate).toBe('number');

      console.log('BTC funding rate:', {
        rate: (funding.fundingRate * 100).toFixed(6) + '%',
      });
    });
  });

  describe('OHLCV Data', () => {
    test('should fetch hourly OHLCV', async () => {
      const ohlcv = await adapter.fetchOHLCV('SOL/USD:USD', '1h', undefined, 24);

      expect(Array.isArray(ohlcv)).toBe(true);
      expect(ohlcv.length).toBeGreaterThan(0);

      const candle = ohlcv[0];
      expect(candle).toHaveLength(6);
      const [timestamp, open, high, low, close, volume] = candle;

      expect(timestamp).toBeGreaterThan(0);
      expect(open).toBeGreaterThan(0);
      expect(high).toBeGreaterThanOrEqual(open);
      expect(high).toBeGreaterThanOrEqual(close);
      expect(low).toBeLessThanOrEqual(open);
      expect(low).toBeLessThanOrEqual(close);
      expect(close).toBeGreaterThan(0);
      expect(volume).toBeGreaterThanOrEqual(0);

      console.log('OHLCV data:', {
        candleCount: ohlcv.length,
        latestCandle: {
          time: new Date(timestamp).toISOString(),
          open,
          high,
          low,
          close,
          volume,
        },
      });
    });

    test('should fetch daily OHLCV', async () => {
      const ohlcv = await adapter.fetchOHLCV('SOL/USD:USD', '1d', undefined, 7);

      expect(Array.isArray(ohlcv)).toBe(true);
      expect(ohlcv.length).toBeGreaterThan(0);

      console.log(`Fetched ${ohlcv.length} daily candles`);
    });
  });

  describe('Multiple Markets', () => {
    test('should fetch tickers for multiple markets', async () => {
      const symbols = ['SOL/USD:USD', 'BTC/USD:USD', 'ETH/USD:USD'];
      const tickers = await Promise.all(
        symbols.map(s => adapter.fetchTicker(s))
      );

      expect(tickers).toHaveLength(3);
      tickers.forEach((ticker, i) => {
        expect(ticker.symbol).toBe(symbols[i]);
        expect(ticker.last).toBeGreaterThan(0);
      });

      console.log('Multiple tickers:', tickers.map(t => ({
        symbol: t.symbol,
        price: t.last,
      })));
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid symbol gracefully', async () => {
      await expect(
        adapter.fetchTicker('INVALID/USD:USD')
      ).rejects.toThrow();
    });
  });
});

// Run a quick sanity check even when skipping full integration tests
describe('Drift Sanity Check', () => {
  test('should create adapter successfully', () => {
    const adapter = new DriftAdapter({
      walletAddress: '11111111111111111111111111111111',
      testnet: true,
    });

    expect(adapter.id).toBe('drift');
    expect(adapter.has.fetchMarkets).toBe(true);
    expect(adapter.has.fetchTicker).toBe(true);
    expect(adapter.has.fetchOrderBook).toBe(true);
  });
});

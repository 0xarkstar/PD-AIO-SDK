/**
 * Jupiter Perps Integration Tests
 *
 * These tests run against the actual Jupiter Price API.
 * They verify real API connectivity and data normalization.
 *
 * Note: These tests require network access and may be slow.
 * Run with: npm test -- --testPathPattern="integration/jupiter"
 */

import { JupiterAdapter } from '../../src/adapters/jupiter/JupiterAdapter.js';

// Skip integration tests if not explicitly enabled
const INTEGRATION_TESTS_ENABLED = process.env.RUN_INTEGRATION_TESTS === 'true';

const describeIfIntegration = INTEGRATION_TESTS_ENABLED ? describe : describe.skip;

describeIfIntegration('Jupiter Perps Integration Tests', () => {
  let adapter: JupiterAdapter;

  beforeAll(async () => {
    adapter = new JupiterAdapter({
      timeout: 30000,
    });

    await adapter.initialize();
  }, 60000);

  afterAll(async () => {
    await adapter.disconnect();
  });

  describe('Market Data', () => {
    test('fetchMarkets returns valid market data', async () => {
      const markets = await adapter.fetchMarkets();

      expect(markets).toBeInstanceOf(Array);
      expect(markets.length).toBeGreaterThan(0);

      // Check first market structure
      const market = markets[0];
      expect(market.id).toBeDefined();
      expect(market.symbol).toMatch(/^[A-Z]+\/USD:USD$/);
      expect(market.base).toBeDefined();
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('USD');
      expect(market.type).toBe('swap');
      expect(typeof market.active).toBe('boolean');
      expect(typeof market.minAmount).toBe('number');
      expect(typeof market.pricePrecision).toBe('number');
      expect(typeof market.amountPrecision).toBe('number');
      expect(market.maxLeverage).toBe(250);
    }, 30000);

    test('fetchMarkets includes SOL, ETH, BTC', async () => {
      const markets = await adapter.fetchMarkets();
      const symbols = markets.map(m => m.symbol);

      expect(symbols).toContain('SOL/USD:USD');
      expect(symbols).toContain('ETH/USD:USD');
      expect(symbols).toContain('BTC/USD:USD');
    }, 30000);

    test('fetchMarkets filters active markets', async () => {
      const activeMarkets = await adapter.fetchMarkets({ active: true });

      expect(activeMarkets.length).toBeGreaterThan(0);
      expect(activeMarkets.every(m => m.active)).toBe(true);
    }, 30000);

    test('fetchTicker returns valid ticker data for SOL', async () => {
      const ticker = await adapter.fetchTicker('SOL/USD:USD');

      expect(ticker.symbol).toBe('SOL/USD:USD');
      expect(typeof ticker.last).toBe('number');
      expect(ticker.last).toBeGreaterThan(0);
      expect(typeof ticker.timestamp).toBe('number');
      expect(ticker.timestamp).toBeGreaterThan(0);
    }, 30000);

    test('fetchTicker returns valid ticker data for ETH', async () => {
      const ticker = await adapter.fetchTicker('ETH/USD:USD');

      expect(ticker.symbol).toBe('ETH/USD:USD');
      expect(typeof ticker.last).toBe('number');
      expect(ticker.last).toBeGreaterThan(0);
    }, 30000);

    test('fetchTicker returns valid ticker data for BTC', async () => {
      const ticker = await adapter.fetchTicker('BTC/USD:USD');

      expect(ticker.symbol).toBe('BTC/USD:USD');
      expect(typeof ticker.last).toBe('number');
      expect(ticker.last).toBeGreaterThan(0);
    }, 30000);

    test('fetchOrderBook returns synthetic order book', async () => {
      const orderBook = await adapter.fetchOrderBook('SOL/USD:USD');

      expect(orderBook.symbol).toBe('SOL/USD:USD');
      expect(orderBook.exchange).toBe('jupiter');
      expect(orderBook.bids).toBeInstanceOf(Array);
      expect(orderBook.asks).toBeInstanceOf(Array);
      expect(typeof orderBook.timestamp).toBe('number');
    }, 30000);

    test('fetchTrades returns empty array', async () => {
      const trades = await adapter.fetchTrades('SOL/USD:USD');

      expect(trades).toBeInstanceOf(Array);
      expect(trades).toHaveLength(0);
    }, 30000);

    test('fetchFundingRate returns valid borrow rate', async () => {
      const fundingRate = await adapter.fetchFundingRate('SOL/USD:USD');

      expect(fundingRate.symbol).toBe('SOL/USD:USD');
      expect(typeof fundingRate.fundingRate).toBe('number');
      expect(typeof fundingRate.fundingTimestamp).toBe('number');
      expect(typeof fundingRate.nextFundingTimestamp).toBe('number');
      expect(typeof fundingRate.markPrice).toBe('number');
      expect(fundingRate.fundingIntervalHours).toBe(1);
      expect(fundingRate.info?.isBorrowFee).toBe(true);
    }, 30000);
  });

  describe('Error Handling', () => {
    test('throws on invalid market', async () => {
      await expect(adapter.fetchTicker('INVALID/USD:USD')).rejects.toThrow(
        'Invalid market'
      );
    }, 30000);

    test('handles rate limiting gracefully', async () => {
      // Make multiple rapid requests
      const promises = Array(5)
        .fill(null)
        .map(() => adapter.fetchTicker('SOL/USD:USD'));

      // Should either succeed or throw rate limit error
      const results = await Promise.allSettled(promises);

      // At least some should succeed
      const successes = results.filter(r => r.status === 'fulfilled');
      expect(successes.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Health Check', () => {
    test('health check returns healthy status', async () => {
      const health = await adapter.healthCheck();

      expect(health.exchange).toBe('jupiter');
      expect(['healthy', 'degraded']).toContain(health.status);
      expect(health.api.reachable).toBe(true);
      expect(typeof health.latency).toBe('number');
    }, 30000);
  });

  describe('Price Consistency', () => {
    test('prices are consistent across multiple calls', async () => {
      const ticker1 = await adapter.fetchTicker('SOL/USD:USD');
      const ticker2 = await adapter.fetchTicker('SOL/USD:USD');

      // Prices should be within 1% of each other (accounting for market movement)
      const priceDiff = Math.abs(ticker1.last - ticker2.last) / ticker1.last;
      expect(priceDiff).toBeLessThan(0.01);
    }, 30000);

    test('all market prices are reasonable', async () => {
      const solTicker = await adapter.fetchTicker('SOL/USD:USD');
      const ethTicker = await adapter.fetchTicker('ETH/USD:USD');
      const btcTicker = await adapter.fetchTicker('BTC/USD:USD');

      // SOL should be < ETH < BTC (typical price ordering)
      expect(solTicker.last).toBeGreaterThan(0);
      expect(ethTicker.last).toBeGreaterThan(solTicker.last);
      expect(btcTicker.last).toBeGreaterThan(ethTicker.last);

      // Reasonable price ranges (as of 2024/2025)
      expect(solTicker.last).toBeGreaterThan(10);
      expect(solTicker.last).toBeLessThan(1000);

      expect(ethTicker.last).toBeGreaterThan(1000);
      expect(ethTicker.last).toBeLessThan(20000);

      expect(btcTicker.last).toBeGreaterThan(20000);
      expect(btcTicker.last).toBeLessThan(500000);
    }, 30000);
  });
});

// Test with wallet address (requires JUPITER_WALLET_ADDRESS env var)
const WALLET_TESTS_ENABLED =
  INTEGRATION_TESTS_ENABLED && process.env.JUPITER_WALLET_ADDRESS !== undefined;

const describeIfWallet = WALLET_TESTS_ENABLED ? describe : describe.skip;

describeIfWallet('Jupiter Perps Wallet Integration Tests', () => {
  let adapter: JupiterAdapter;

  beforeAll(async () => {
    adapter = new JupiterAdapter({
      walletAddress: process.env.JUPITER_WALLET_ADDRESS,
      timeout: 30000,
    });

    await adapter.initialize();
  }, 60000);

  afterAll(async () => {
    await adapter.disconnect();
  });

  describe('Account Data', () => {
    test('fetchPositions returns array (may be empty)', async () => {
      const positions = await adapter.fetchPositions();

      expect(positions).toBeInstanceOf(Array);

      // If positions exist, validate structure
      if (positions.length > 0) {
        const position = positions[0];
        expect(position.symbol).toMatch(/^[A-Z]+\/USD:USD$/);
        expect(['long', 'short']).toContain(position.side);
        expect(typeof position.size).toBe('number');
        expect(typeof position.entryPrice).toBe('number');
      }
    }, 30000);

    test('fetchBalance returns array (may be empty)', async () => {
      const balances = await adapter.fetchBalance();

      expect(balances).toBeInstanceOf(Array);

      // If balances exist, validate structure
      if (balances.length > 0) {
        const balance = balances[0];
        expect(typeof balance.currency).toBe('string');
        expect(typeof balance.total).toBe('number');
        expect(typeof balance.free).toBe('number');
        expect(typeof balance.used).toBe('number');
      }
    }, 30000);

    test('fetchOpenOrders returns empty array', async () => {
      const orders = await adapter.fetchOpenOrders();

      expect(orders).toBeInstanceOf(Array);
      expect(orders).toHaveLength(0); // Jupiter uses instant execution
    }, 30000);
  });

  describe('Address Retrieval', () => {
    test('getAddress returns configured wallet address', async () => {
      const address = await adapter.getAddress();

      expect(address).toBe(process.env.JUPITER_WALLET_ADDRESS);
    });
  });
});

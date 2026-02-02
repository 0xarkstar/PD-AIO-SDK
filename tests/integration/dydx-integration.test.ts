/**
 * dYdX v4 Integration Tests
 *
 * These tests run against the actual dYdX testnet Indexer API.
 * They verify real API connectivity and data normalization.
 *
 * Note: These tests require network access and may be slow.
 * Run with: npm test -- --testPathPattern="integration/dydx"
 */

import { DydxAdapter } from '../../src/adapters/dydx/DydxAdapter.js';

// Skip integration tests if not explicitly enabled
const INTEGRATION_TESTS_ENABLED = process.env.RUN_INTEGRATION_TESTS === 'true';

const describeIfIntegration = INTEGRATION_TESTS_ENABLED ? describe : describe.skip;

describeIfIntegration('dYdX v4 Integration Tests', () => {
  let adapter: DydxAdapter;

  beforeAll(async () => {
    adapter = new DydxAdapter({
      testnet: true,
      timeout: 30000, // 30 second timeout for testnet
    });

    // Initialize adapter (validates API connectivity)
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
      expect(typeof market.active).toBe('boolean');
      expect(typeof market.minAmount).toBe('number');
      expect(typeof market.pricePrecision).toBe('number');
      expect(typeof market.amountPrecision).toBe('number');
    }, 30000);

    test('fetchMarkets filters active markets', async () => {
      const activeMarkets = await adapter.fetchMarkets({ active: true });

      expect(activeMarkets.length).toBeGreaterThan(0);
      expect(activeMarkets.every((m) => m.active)).toBe(true);
    }, 30000);

    test('fetchTicker returns valid ticker data', async () => {
      const ticker = await adapter.fetchTicker('BTC/USD:USD');

      expect(ticker.symbol).toBe('BTC/USD:USD');
      expect(typeof ticker.last).toBe('number');
      expect(ticker.last).toBeGreaterThan(0);
      expect(typeof ticker.timestamp).toBe('number');
      expect(ticker.timestamp).toBeGreaterThan(0);
    }, 30000);

    test('fetchOrderBook returns valid order book', async () => {
      const orderBook = await adapter.fetchOrderBook('BTC/USD:USD');

      expect(orderBook.symbol).toBe('BTC/USD:USD');
      expect(orderBook.exchange).toBe('dydx');
      expect(orderBook.bids).toBeInstanceOf(Array);
      expect(orderBook.asks).toBeInstanceOf(Array);
      expect(typeof orderBook.timestamp).toBe('number');

      // Check bid/ask structure [price, size]
      if (orderBook.bids.length > 0) {
        expect(orderBook.bids[0]).toHaveLength(2);
        expect(typeof orderBook.bids[0][0]).toBe('number'); // price
        expect(typeof orderBook.bids[0][1]).toBe('number'); // size
      }
    }, 30000);

    test('fetchTrades returns valid trade data', async () => {
      const trades = await adapter.fetchTrades('BTC/USD:USD', { limit: 10 });

      expect(trades).toBeInstanceOf(Array);

      if (trades.length > 0) {
        const trade = trades[0];
        expect(trade.symbol).toBe('BTC/USD:USD');
        expect(typeof trade.id).toBe('string');
        expect(['buy', 'sell']).toContain(trade.side);
        expect(typeof trade.price).toBe('number');
        expect(typeof trade.amount).toBe('number');
        expect(typeof trade.cost).toBe('number');
        expect(typeof trade.timestamp).toBe('number');
      }
    }, 30000);

    test('fetchFundingRate returns valid funding rate', async () => {
      const fundingRate = await adapter.fetchFundingRate('BTC/USD:USD');

      expect(fundingRate.symbol).toBe('BTC/USD:USD');
      expect(typeof fundingRate.fundingRate).toBe('number');
      expect(typeof fundingRate.fundingTimestamp).toBe('number');
      expect(typeof fundingRate.nextFundingTimestamp).toBe('number');
      expect(typeof fundingRate.markPrice).toBe('number');
      expect(fundingRate.fundingIntervalHours).toBe(1);
    }, 30000);

    test('fetchFundingRateHistory returns funding history', async () => {
      const history = await adapter.fetchFundingRateHistory('BTC/USD:USD', undefined, 10);

      expect(history).toBeInstanceOf(Array);

      if (history.length > 0) {
        const rate = history[0];
        expect(rate.symbol).toBe('BTC/USD:USD');
        expect(typeof rate.fundingRate).toBe('number');
        expect(typeof rate.fundingTimestamp).toBe('number');
      }
    }, 30000);

    test('fetchOHLCV returns valid candle data', async () => {
      const candles = await adapter.fetchOHLCV('BTC/USD:USD', '1h', { limit: 10 });

      expect(candles).toBeInstanceOf(Array);

      if (candles.length > 0) {
        const candle = candles[0];
        expect(candle).toHaveLength(6);
        expect(typeof candle[0]).toBe('number'); // timestamp
        expect(typeof candle[1]).toBe('number'); // open
        expect(typeof candle[2]).toBe('number'); // high
        expect(typeof candle[3]).toBe('number'); // low
        expect(typeof candle[4]).toBe('number'); // close
        expect(typeof candle[5]).toBe('number'); // volume

        // High >= Low
        expect(candle[2]).toBeGreaterThanOrEqual(candle[3]);
      }
    }, 30000);
  });

  describe('Error Handling', () => {
    test('throws on invalid market', async () => {
      await expect(adapter.fetchTicker('INVALID/USD:USD')).rejects.toThrow();
    }, 30000);

    test('handles rate limiting gracefully', async () => {
      // Make multiple rapid requests to test rate limiting
      const promises = Array(5).fill(null).map(() =>
        adapter.fetchTicker('BTC/USD:USD')
      );

      // Should either succeed or throw rate limit error
      const results = await Promise.allSettled(promises);

      // At least some should succeed
      const successes = results.filter((r) => r.status === 'fulfilled');
      expect(successes.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Health Check', () => {
    test('health check returns healthy status', async () => {
      const health = await adapter.healthCheck();

      expect(health.exchange).toBe('dydx');
      expect(['healthy', 'degraded']).toContain(health.status);
      expect(health.api.reachable).toBe(true);
      expect(typeof health.latency).toBe('number');
    }, 30000);
  });
});

// Test with authenticated adapter (requires credentials)
const AUTHENTICATED_TESTS_ENABLED =
  INTEGRATION_TESTS_ENABLED && process.env.DYDX_TESTNET_MNEMONIC !== undefined;

const describeIfAuthenticated = AUTHENTICATED_TESTS_ENABLED ? describe : describe.skip;

describeIfAuthenticated('dYdX v4 Authenticated Integration Tests', () => {
  let adapter: DydxAdapter;

  beforeAll(async () => {
    adapter = new DydxAdapter({
      testnet: true,
      mnemonic: process.env.DYDX_TESTNET_MNEMONIC,
      subaccountNumber: 0,
      timeout: 30000,
    });

    await adapter.initialize();
  }, 60000);

  afterAll(async () => {
    await adapter.disconnect();
  });

  describe('Account Data', () => {
    test('fetchBalance returns balance data', async () => {
      const balances = await adapter.fetchBalance();

      expect(balances).toBeInstanceOf(Array);
      expect(balances.length).toBeGreaterThan(0);

      const balance = balances[0];
      expect(balance.currency).toBe('USDC');
      expect(typeof balance.total).toBe('number');
      expect(typeof balance.free).toBe('number');
      expect(typeof balance.used).toBe('number');
    }, 30000);

    test('fetchPositions returns position data', async () => {
      const positions = await adapter.fetchPositions();

      expect(positions).toBeInstanceOf(Array);

      // May be empty if no positions
      if (positions.length > 0) {
        const position = positions[0];
        expect(position.symbol).toMatch(/^[A-Z]+\/USD:USD$/);
        expect(['long', 'short']).toContain(position.side);
        expect(typeof position.size).toBe('number');
        expect(typeof position.entryPrice).toBe('number');
        expect(typeof position.unrealizedPnl).toBe('number');
      }
    }, 30000);

    test('fetchOpenOrders returns open orders', async () => {
      const orders = await adapter.fetchOpenOrders();

      expect(orders).toBeInstanceOf(Array);

      // May be empty if no open orders
      if (orders.length > 0) {
        const order = orders[0];
        expect(order.status).toBe('open');
        expect(typeof order.id).toBe('string');
        expect(typeof order.symbol).toBe('string');
      }
    }, 30000);

    test('fetchOrderHistory returns order history', async () => {
      const orders = await adapter.fetchOrderHistory(undefined, undefined, 10);

      expect(orders).toBeInstanceOf(Array);

      if (orders.length > 0) {
        const order = orders[0];
        expect(typeof order.id).toBe('string');
        expect(typeof order.symbol).toBe('string');
        expect(['buy', 'sell']).toContain(order.side);
        expect(['limit', 'market', 'stopLimit', 'stopMarket']).toContain(order.type);
      }
    }, 30000);

    test('fetchMyTrades returns trade history', async () => {
      const trades = await adapter.fetchMyTrades(undefined, undefined, 10);

      expect(trades).toBeInstanceOf(Array);

      if (trades.length > 0) {
        const trade = trades[0];
        expect(typeof trade.id).toBe('string');
        expect(typeof trade.symbol).toBe('string');
        expect(typeof trade.price).toBe('number');
        expect(typeof trade.amount).toBe('number');
      }
    }, 30000);
  });

  describe('Address Retrieval', () => {
    test('getAddress returns dYdX address', async () => {
      const address = await adapter.getAddress();

      expect(address).toBeDefined();
      expect(address?.startsWith('dydx')).toBe(true);
    });
  });
});

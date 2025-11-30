/**
 * Method Name Aliases Unit Tests
 *
 * Tests Python-style snake_case method aliases
 */

import { BaseAdapter } from '../../src/adapters/base/BaseAdapter.js';
import type { Market, MarketParams, Order, OrderRequest } from '../../src/types/common.js';

// Mock adapter for testing
class MockAdapter extends BaseAdapter {
  readonly id = 'mock';
  readonly name = 'Mock Exchange';
  readonly has = {};

  async initialize(): Promise<void> {
    this._isReady = true;
  }

  async disconnect(): Promise<void> {
    await super.disconnect();
  }

  // Implement required abstract methods with test doubles
  async fetchMarkets(params?: MarketParams): Promise<Market[]> {
    return [{
      id: 'BTC-USDT',
      symbol: 'BTC/USDT:USDT',
      base: 'BTC',
      quote: 'USDT',
      settle: 'USDT',
      type: 'swap',
      spot: false,
      margin: false,
      swap: true,
      future: false,
      option: false,
      active: true,
      contract: true,
      linear: true,
      inverse: false,
      contractSize: 1,
      precision: { amount: 0.001, price: 0.1 },
      limits: {
        amount: { min: 0.001, max: 1000 },
        price: { min: 0.1, max: 1000000 },
        cost: { min: 5, max: undefined },
      },
    }];
  }

  async fetchTicker(symbol: string) {
    return {
      symbol,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      high: 50000,
      low: 48000,
      bid: 49000,
      bidVolume: 10,
      ask: 49100,
      askVolume: 5,
      vwap: 49050,
      open: 48500,
      close: 49000,
      last: 49000,
      previousClose: 48500,
      change: 500,
      percentage: 1.03,
      average: 48750,
      baseVolume: 1000,
      quoteVolume: 49000000,
    };
  }

  async fetchOrderBook(symbol: string) {
    return {
      symbol,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      nonce: Date.now(),
      bids: [[49000, 1], [48900, 2]],
      asks: [[49100, 1], [49200, 2]],
    };
  }

  async fetchTrades(symbol: string) {
    return [];
  }

  async fetchFundingRate(symbol: string) {
    return {
      symbol,
      fundingRate: 0.0001,
      fundingTimestamp: Date.now() + 8 * 60 * 60 * 1000,
      fundingDatetime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
    };
  }

  async fetchFundingRateHistory() {
    return [];
  }

  async createOrder(request: OrderRequest): Promise<Order> {
    return {
      id: 'test-order-123',
      clientOrderId: request.clientOrderId,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      lastTradeTimestamp: undefined,
      symbol: request.symbol,
      type: request.type,
      timeInForce: request.timeInForce,
      postOnly: request.postOnly,
      reduceOnly: request.reduceOnly,
      side: request.side,
      price: request.price,
      amount: request.amount,
      cost: undefined,
      average: undefined,
      filled: 0,
      remaining: request.amount,
      status: 'open',
      fee: undefined,
      trades: [],
    };
  }

  async cancelOrder(orderId: string, symbol?: string) {
    return {
      id: orderId,
      clientOrderId: undefined,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      lastTradeTimestamp: undefined,
      symbol: symbol || 'BTC/USDT:USDT',
      type: 'limit',
      timeInForce: undefined,
      postOnly: undefined,
      reduceOnly: undefined,
      side: 'buy',
      price: 50000,
      amount: 0.1,
      cost: undefined,
      average: undefined,
      filled: 0,
      remaining: 0,
      status: 'canceled',
      fee: undefined,
      trades: [],
    };
  }

  async cancelAllOrders() {
    return [];
  }

  async fetchPositions() {
    return [];
  }

  async fetchBalance() {
    return [];
  }

  async setLeverage() {}

  protected symbolToExchange(symbol: string) {
    return symbol;
  }

  protected symbolFromExchange(symbol: string) {
    return symbol;
  }
}

describe('Method Name Aliases', () => {
  let adapter: MockAdapter;

  beforeEach(async () => {
    adapter = new MockAdapter();
    await adapter.initialize();
  });

  afterEach(async () => {
    await adapter.disconnect();
  });

  describe('Market Data Aliases', () => {
    test('fetch_markets is alias for fetchMarkets', async () => {
      const result1 = await adapter.fetchMarkets();
      const result2 = await adapter.fetch_markets();

      expect(result1).toEqual(result2);
      expect(result1).toHaveLength(1);
      expect(result1[0].symbol).toBe('BTC/USDT:USDT');
    });

    test('fetch_ticker is alias for fetchTicker', async () => {
      const symbol = 'BTC/USDT:USDT';
      const result1 = await adapter.fetchTicker(symbol);
      const result2 = await adapter.fetch_ticker(symbol);

      // Compare key properties (not timestamp which may differ by 1ms)
      expect(result1.symbol).toBe(result2.symbol);
      expect(result1.last).toBe(result2.last);
      expect(result1.bid).toBe(result2.bid);
      expect(result1.ask).toBe(result2.ask);
      expect(result1.symbol).toBe(symbol);
      expect(result1.last).toBe(49000);
    });

    test('fetch_order_book is alias for fetchOrderBook', async () => {
      const symbol = 'BTC/USDT:USDT';
      const result1 = await adapter.fetchOrderBook(symbol);
      const result2 = await adapter.fetch_order_book(symbol);

      // Compare key properties (not timestamp/nonce which may differ by 1ms)
      expect(result1.symbol).toBe(result2.symbol);
      expect(result1.bids).toEqual(result2.bids);
      expect(result1.asks).toEqual(result2.asks);
      expect(result1.symbol).toBe(symbol);
      expect(result1.bids).toHaveLength(2);
      expect(result1.asks).toHaveLength(2);
    });

    test('fetch_trades is alias for fetchTrades', async () => {
      const symbol = 'BTC/USDT:USDT';
      const result1 = await adapter.fetchTrades(symbol);
      const result2 = await adapter.fetch_trades(symbol);

      expect(result1).toEqual(result2);
      expect(Array.isArray(result1)).toBe(true);
    });

    test('fetch_funding_rate is alias for fetchFundingRate', async () => {
      const symbol = 'BTC/USDT:USDT';
      const result1 = await adapter.fetchFundingRate(symbol);
      const result2 = await adapter.fetch_funding_rate(symbol);

      expect(result1).toEqual(result2);
      expect(result1.symbol).toBe(symbol);
      expect(result1.fundingRate).toBe(0.0001);
    });

    test('fetch_funding_rate_history is alias for fetchFundingRateHistory', async () => {
      const symbol = 'BTC/USDT:USDT';
      const result1 = await adapter.fetchFundingRateHistory(symbol);
      const result2 = await adapter.fetch_funding_rate_history(symbol);

      expect(result1).toEqual(result2);
      expect(Array.isArray(result1)).toBe(true);
    });
  });

  describe('Trading Aliases', () => {
    test('create_order is alias for createOrder', async () => {
      const request: OrderRequest = {
        symbol: 'BTC/USDT:USDT',
        side: 'buy',
        type: 'limit',
        amount: 0.1,
        price: 50000,
      };

      const result1 = await adapter.createOrder(request);
      const result2 = await adapter.create_order(request);

      expect(result1.symbol).toBe(request.symbol);
      expect(result2.symbol).toBe(request.symbol);
      expect(result1.status).toBe('open');
      expect(result2.status).toBe('open');
    });

    test('cancel_order is alias for cancelOrder', async () => {
      const orderId = 'test-order-123';
      const symbol = 'BTC/USDT:USDT';

      const result1 = await adapter.cancelOrder(orderId, symbol);
      const result2 = await adapter.cancel_order(orderId, symbol);

      expect(result1.id).toBe(orderId);
      expect(result2.id).toBe(orderId);
      expect(result1.status).toBe('canceled');
      expect(result2.status).toBe('canceled');
    });

    test('cancel_all_orders is alias for cancelAllOrders', async () => {
      const result1 = await adapter.cancelAllOrders();
      const result2 = await adapter.cancel_all_orders();

      expect(result1).toEqual(result2);
      expect(Array.isArray(result1)).toBe(true);
    });
  });

  describe('Account Aliases', () => {
    test('fetch_positions is alias for fetchPositions', async () => {
      const result1 = await adapter.fetchPositions();
      const result2 = await adapter.fetch_positions();

      expect(result1).toEqual(result2);
      expect(Array.isArray(result1)).toBe(true);
    });

    test('fetch_balance is alias for fetchBalance', async () => {
      const result1 = await adapter.fetchBalance();
      const result2 = await adapter.fetch_balance();

      expect(result1).toEqual(result2);
      expect(Array.isArray(result1)).toBe(true);
    });

    test('set_leverage is alias for setLeverage', async () => {
      const symbol = 'BTC/USDT:USDT';
      const leverage = 10;

      await expect(adapter.setLeverage(symbol, leverage)).resolves.not.toThrow();
      await expect(adapter.set_leverage(symbol, leverage)).resolves.not.toThrow();
    });
  });

  describe('Monitoring Aliases', () => {
    test('health_check is alias for healthCheck', async () => {
      const result1 = await adapter.healthCheck();
      const result2 = await adapter.health_check();

      expect(result1.exchange).toBe('mock');
      expect(result2.exchange).toBe('mock');
      expect(result1.status).toBeDefined();
      expect(result2.status).toBeDefined();
    });

    test('get_metrics is alias for getMetrics', () => {
      const result1 = adapter.getMetrics();
      const result2 = adapter.get_metrics();

      // Compare key properties (not timestamp/collectionDuration which may differ by 1ms)
      expect(result1.totalRequests).toBe(result2.totalRequests);
      expect(result1.successfulRequests).toBe(result2.successfulRequests);
      expect(result1.failedRequests).toBe(result2.failedRequests);
      expect(result1.averageLatency).toBe(result2.averageLatency);
      expect(result1.rateLimitHits).toBe(result2.rateLimitHits);
    });

    test('reset_metrics is alias for resetMetrics', () => {
      adapter.resetMetrics();
      adapter.reset_metrics();

      const metrics = adapter.getMetrics();
      expect(metrics.totalRequests).toBe(0);
    });
  });

  describe('Caching Aliases', () => {
    test('preload_markets is alias for preloadMarkets', async () => {
      await adapter.preloadMarkets();
      await adapter.preload_markets();

      const cached = adapter.getPreloadedMarkets();
      expect(cached).not.toBeNull();
      expect(cached).toHaveLength(1);
    });

    test('get_preloaded_markets is alias for getPreloadedMarkets', async () => {
      await adapter.preloadMarkets();

      const result1 = adapter.getPreloadedMarkets();
      const result2 = adapter.get_preloaded_markets();

      expect(result1).toEqual(result2);
      expect(result1).not.toBeNull();
    });

    test('clear_cache is alias for clearCache', async () => {
      await adapter.preloadMarkets();
      expect(adapter.getPreloadedMarkets()).not.toBeNull();

      adapter.clearCache();
      expect(adapter.getPreloadedMarkets()).toBeNull();

      await adapter.preloadMarkets();
      expect(adapter.getPreloadedMarkets()).not.toBeNull();

      adapter.clear_cache();
      expect(adapter.getPreloadedMarkets()).toBeNull();
    });
  });

  describe('Alias binding', () => {
    test('aliases maintain correct context', async () => {
      // Extract alias method
      const fetch_markets = adapter.fetch_markets;

      // Call without context - should still work due to .bind(this)
      const result = await fetch_markets();

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('BTC/USDT:USDT');
    });

    test('aliases can be destructured', async () => {
      const { fetch_ticker, fetch_order_book } = adapter;

      const ticker = await fetch_ticker('BTC/USDT:USDT');
      const orderBook = await fetch_order_book('BTC/USDT:USDT');

      expect(ticker.symbol).toBe('BTC/USDT:USDT');
      expect(orderBook.symbol).toBe('BTC/USDT:USDT');
    });

    test('both naming styles work interchangeably', async () => {
      // Mix camelCase and snake_case
      const markets = await adapter.fetch_markets();
      const ticker = await adapter.fetchTicker('BTC/USDT:USDT');
      const orderBook = await adapter.fetch_order_book('BTC/USDT:USDT');
      const trades = await adapter.fetchTrades('BTC/USDT:USDT');

      expect(markets).toHaveLength(1);
      expect(ticker.symbol).toBe('BTC/USDT:USDT');
      expect(orderBook.symbol).toBe('BTC/USDT:USDT');
      expect(Array.isArray(trades)).toBe(true);
    });
  });

  describe('Method consistency', () => {
    test('aliases produce identical results', async () => {
      // Call same method multiple times with both styles
      const results = await Promise.all([
        adapter.fetchMarkets(),
        adapter.fetch_markets(),
        adapter.fetchMarkets(),
        adapter.fetch_markets(),
      ]);

      // All results should be equal
      results.forEach((result) => {
        expect(result).toEqual(results[0]);
      });
    });

    test('aliases accept same parameters', async () => {
      const symbol = 'BTC/USDT:USDT';
      const params = { limit: 10 };

      // Both should accept parameters the same way
      await expect(adapter.fetchTrades(symbol, params)).resolves.toBeDefined();
      await expect(adapter.fetch_trades(symbol, params)).resolves.toBeDefined();
    });
  });
});

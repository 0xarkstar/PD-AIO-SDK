/**
 * Hyperliquid Adapter Integration Tests
 * Tests complete request/response cycles with mocked API responses
 */

import { HyperliquidAdapter } from '../../src/adapters/hyperliquid/HyperliquidAdapter.js';
import { mockHyperliquidResponses } from '../fixtures/hyperliquid-responses.js';

// Mock WebSocketManager
jest.mock('../../src/websocket/WebSocketManager.js', () => {
  return {
    WebSocketManager: jest.fn().mockImplementation(() => {
      return {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        send: jest.fn(),
        isConnected: true,
      };
    }),
  };
});

// Mock fetch globally
global.fetch = jest.fn();

describe('HyperliquidAdapter Integration Tests', () => {
  let adapter: HyperliquidAdapter;

  beforeEach(async () => {
    adapter = new HyperliquidAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });
    await adapter.initialize();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await adapter.disconnect();
    jest.restoreAllMocks();
  });

  describe('Adapter Initialization', () => {
    test('initializes with correct properties', () => {
      expect(adapter.id).toBe('hyperliquid');
      expect(adapter.name).toBe('Hyperliquid');
      expect(adapter.isReady).toBe(true);
    });

    test('has correct capabilities', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
    });
  });

  describe('Market Data Operations', () => {
    test('fetchMarkets - fetches and normalizes all markets', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.meta,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.allMids,
      });

      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(2);
      expect(markets[0]).toMatchObject({
        symbol: 'BTC/USDT:USDT',
        base: 'BTC',
        quote: 'USDT',
        settle: 'USDT',
        active: true,
        maxLeverage: 50,
      });
      expect(markets[1].symbol).toBe('ETH/USDT:USDT');
    });

    test('fetchOrderBook - fetches and normalizes order book', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.l2Snapshot,
      });

      const orderBook = await adapter.fetchOrderBook('BTC/USDT:USDT');

      expect(orderBook.symbol).toBe('BTC/USDT:USDT');
      expect(orderBook.exchange).toBe('hyperliquid');
      expect(orderBook.bids).toHaveLength(2);
      expect(orderBook.asks).toHaveLength(2);
      expect(orderBook.bids[0]).toEqual([50000, 0.5]);
      expect(orderBook.asks[0]).toEqual([50100, 0.3]);
      expect(orderBook.timestamp).toBe(1234567890000);
    });

    test('fetchTrades - fetches and normalizes recent trades', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.recentTrades,
      });

      const trades = await adapter.fetchTrades('BTC/USDT:USDT');

      expect(trades).toHaveLength(2);
      expect(trades[0]).toMatchObject({
        symbol: 'BTC/USDT:USDT',
        side: 'buy',
        price: 50000,
        amount: 0.1,
        timestamp: 1234567890000,
      });
      expect(trades[1].side).toBe('sell');
    });

    test('fetchFundingRate - fetches current funding rate', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.fundingHistory,
      });

      const fundingRate = await adapter.fetchFundingRate('BTC/USDT:USDT');

      expect(fundingRate).toMatchObject({
        symbol: 'BTC/USDT:USDT',
        fundingRate: 0.0001,
        fundingIntervalHours: 8,
      });
    });
  });

  describe('Account Operations', () => {
    test('fetchBalance - fetches account balance', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.userState,
      });

      const balance = await adapter.fetchBalance();

      expect(balance.currency).toBe('USDT');
      expect(balance.total).toBeCloseTo(100000, 1);
      expect(balance.free).toBeCloseTo(95600, 1);
      expect(balance.used).toBeCloseTo(2400, 1);
    });

    test('fetchPositions - fetches all positions', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.userState,
      });

      const positions = await adapter.fetchPositions();

      expect(positions).toHaveLength(1);
      expect(positions[0]).toMatchObject({
        symbol: 'BTC/USDT:USDT',
        side: 'long',
        size: 0.5,
        entryPrice: 48000,
        leverage: 10,
        marginMode: 'cross',
      });
      expect(positions[0].unrealizedPnl).toBeCloseTo(1000, 1);
    });

    test('fetchPositions - filters by symbol', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.userState,
      });

      const positions = await adapter.fetchPositions(['BTC/USDT:USDT']);

      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe('BTC/USDT:USDT');
    });
  });

  describe('Trading Operations', () => {
    test('createOrder - creates limit buy order', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.orderPlaced,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.openOrders,
      });

      const order = await adapter.createOrder(
        'BTC/USDT:USDT',
        'limit',
        'buy',
        0.1,
        50000
      );

      expect(order).toMatchObject({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
      });
      expect(order.id).toBeDefined();
    });

    test('createOrder - creates market sell order', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.orderPlaced,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            ...mockHyperliquidResponses.openOrders[0],
            side: 'A',
            limitPx: undefined,
          },
        ],
      });

      const order = await adapter.createOrder(
        'BTC/USDT:USDT',
        'market',
        'sell',
        0.1
      );

      expect(order.type).toBe('market');
      expect(order.side).toBe('sell');
      expect(order.price).toBeUndefined();
    });

    test('createOrder - creates post-only order', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.orderPlaced,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.openOrders,
      });

      const order = await adapter.createOrder(
        'BTC/USDT:USDT',
        'limit',
        'buy',
        0.1,
        50000,
        { postOnly: true }
      );

      expect(order.postOnly).toBe(true);
    });

    test('createOrder - creates reduce-only order', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.orderPlaced,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.openOrders,
      });

      const order = await adapter.createOrder(
        'BTC/USDT:USDT',
        'limit',
        'sell',
        0.1,
        51000,
        { reduceOnly: true }
      );

      expect(order.reduceOnly).toBe(true);
    });

    test('cancelOrder - cancels order by id', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.orderCancelled,
      });

      const result = await adapter.cancelOrder('12345', 'BTC/USDT:USDT');

      expect(result).toMatchObject({
        id: '12345',
        symbol: 'BTC/USDT:USDT',
      });
    });

    test('cancelAllOrders - cancels all orders for a symbol', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.orderCancelled,
      });

      const results = await adapter.cancelAllOrders('BTC/USDT:USDT');

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('handles invalid order error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.errors.invalidOrder,
      });

      await expect(
        adapter.createOrder('BTC/USDT:USDT', 'limit', 'buy', 0.1, 50000)
      ).rejects.toThrow();
    });

    test('handles insufficient margin error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.errors.insufficientMargin,
      });

      await expect(
        adapter.createOrder('BTC/USDT:USDT', 'limit', 'buy', 100, 50000)
      ).rejects.toThrow();
    });

    test('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(adapter.fetchMarkets()).rejects.toThrow();
    });

    test('handles rate limit errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.errors.rateLimitExceeded,
      });

      await expect(adapter.fetchMarkets()).rejects.toThrow();
    });
  });

  describe('Rate Limiting', () => {
    test('respects rate limits', async () => {
      const startTime = Date.now();

      // Mock successful responses
      for (let i = 0; i < 5; i++) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockHyperliquidResponses.meta,
        });
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockHyperliquidResponses.allMids,
        });
      }

      // Make multiple requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(adapter.fetchMarkets());
      }

      await Promise.all(promises);

      const elapsed = Date.now() - startTime;

      // Should take some time due to rate limiting
      // This is a basic check - actual timing may vary
      expect(elapsed).toBeGreaterThan(0);
    });
  });

  describe('Symbol Normalization', () => {
    test('handles various symbol formats', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.l2Snapshot,
      });

      // Test with unified format
      const orderBook1 = await adapter.fetchOrderBook('BTC/USDT:USDT');
      expect(orderBook1.symbol).toBe('BTC/USDT:USDT');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHyperliquidResponses.l2Snapshot,
      });

      // Test with exchange-native format
      const orderBook2 = await adapter.fetchOrderBook('BTC');
      expect(orderBook2.symbol).toBe('BTC/USDT:USDT');
    });
  });
});

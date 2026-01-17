/**
 * Integration Tests for LighterAdapter
 *
 * Tests adapter methods with mocked API responses
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LighterAdapter } from '../../src/adapters/lighter/LighterAdapter.js';
import type {
  LighterMarket,
  LighterOrder,
  LighterPosition,
  LighterBalance,
  LighterOrderBook,
  LighterTrade,
  LighterTicker,
  LighterFundingRate,
} from '../../src/adapters/lighter/types.js';
import WebSocket from 'ws';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock WebSocket
jest.mock('ws', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
    readyState: 1, // OPEN
  }));
});

describe('LighterAdapter Integration Tests', () => {
  let adapter: LighterAdapter;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    // Setup WebSocket mock to auto-trigger 'open' event
    (WebSocket as unknown as jest.Mock).mockImplementation(() => {
      const mockWs = {
        on: jest.fn((event: string, handler: Function) => {
          if (event === 'open') {
            // Trigger open event asynchronously
            setTimeout(() => handler(), 0);
          }
        }),
        send: jest.fn(),
        close: jest.fn(),
        readyState: 1,
      };
      return mockWs;
    });

    // Create adapter
    adapter = new LighterAdapter({
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      testnet: true,
      rateLimitTier: 'tier3', // Use tier3 for testing (high limits)
    });
  });

  // Helper to mock successful API response
  const mockSuccessResponse = (data: any) => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => data,
    } as Response);
  };

  // Helper to mock failed API response
  const mockFailedResponse = (status: number, statusText: string) => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      statusText,
      json: async () => ({ error: statusText }),
    } as Response);
  };

  describe('Initialization', () => {
    it('should initialize adapter correctly', async () => {
      await adapter.initialize();
      expect(adapter).toBeDefined();
      expect(adapter.id).toBe('lighter');
      expect(adapter.name).toBe('Lighter');
      expect(adapter.isReady).toBe(true);
    });

    it('should have correct feature flags', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.fetchFundingRateHistory).toBe(false);
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.cancelAllOrders).toBe(true);
      expect(adapter.has.createBatchOrders).toBe(false);
      expect(adapter.has.setLeverage).toBe(false);
      expect(adapter.has.watchOrderBook).toBe(true);
      expect(adapter.has.watchTrades).toBe(true);
      expect(adapter.has.watchPositions).toBe(true);
    });
  });

  describe('Market Data Methods', () => {
    describe('fetchMarkets', () => {
      it('should fetch and normalize markets', async () => {
        const mockMarkets: LighterMarket[] = [
          {
            symbol: 'BTC-USDT-PERP',
            baseCurrency: 'BTC',
            quoteCurrency: 'USDT',
            active: true,
            minOrderSize: 0.001,
            maxOrderSize: 100,
            tickSize: 0.5,
            stepSize: 0.001,
            makerFee: 0.0002,
            takerFee: 0.0005,
            maxLeverage: 50,
          },
          {
            symbol: 'ETH-USDT-PERP',
            baseCurrency: 'ETH',
            quoteCurrency: 'USDT',
            active: true,
            minOrderSize: 0.01,
            maxOrderSize: 1000,
            tickSize: 0.1,
            stepSize: 0.01,
            makerFee: 0.0002,
            takerFee: 0.0005,
            maxLeverage: 50,
          },
        ];

        mockSuccessResponse(mockMarkets);

        const markets = await adapter.fetchMarkets();

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(markets).toHaveLength(2);
        expect(markets[0].symbol).toBe('BTC/USDT:USDT');
        expect(markets[0].base).toBe('BTC');
        expect(markets[0].quote).toBe('USDT');
        expect(markets[0].active).toBe(true);
        expect(markets[1].symbol).toBe('ETH/USDT:USDT');
      });

      it('should handle empty markets list', async () => {
        mockSuccessResponse([]);

        const markets = await adapter.fetchMarkets();

        expect(markets).toEqual([]);
      });

      it('should throw error on invalid response', async () => {
        mockSuccessResponse({ invalid: 'response' });

        await expect(adapter.fetchMarkets()).rejects.toThrow();
      });
    });

    describe('fetchOrderBook', () => {
      it('should fetch and normalize order book', async () => {
        const mockOrderBook: LighterOrderBook = {
          symbol: 'BTC-USDT-PERP',
          bids: [
            [50000, 1.5],
            [49990, 2.0],
          ],
          asks: [
            [50010, 1.0],
            [50020, 1.5],
          ],
          timestamp: 1234567890000,
        };

        mockSuccessResponse(mockOrderBook);

        const orderBook = await adapter.fetchOrderBook('BTC/USDT:USDT');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(orderBook.symbol).toBe('BTC/USDT:USDT');
        expect(orderBook.bids).toHaveLength(2);
        expect(orderBook.asks).toHaveLength(2);
        expect(orderBook.bids[0]).toEqual([50000, 1.5]);
        expect(orderBook.asks[0]).toEqual([50010, 1.0]);
      });

      it('should handle custom depth limit', async () => {
        const mockOrderBook: LighterOrderBook = {
          symbol: 'ETH-USDT-PERP',
          bids: [[3000, 10]],
          asks: [[3010, 5]],
          timestamp: 1234567890000,
        };

        mockSuccessResponse(mockOrderBook);

        const orderBook = await adapter.fetchOrderBook('ETH/USDT:USDT', { limit: 100 });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const url = (mockFetch.mock.calls[0][0] as string);
        expect(url).toContain('limit=100');
      });
    });

    describe('fetchTrades', () => {
      it('should fetch and normalize public trades', async () => {
        const mockTrades: LighterTrade[] = [
          {
            id: 'trade-1',
            symbol: 'BTC-USDT-PERP',
            side: 'buy',
            price: 50000,
            amount: 0.5,
            timestamp: 1234567890000,
          },
          {
            id: 'trade-2',
            symbol: 'BTC-USDT-PERP',
            side: 'sell',
            price: 50010,
            amount: 0.3,
            timestamp: 1234567891000,
          },
        ];

        mockSuccessResponse(mockTrades);

        const trades = await adapter.fetchTrades('BTC/USDT:USDT');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(trades).toHaveLength(2);
        expect(trades[0].symbol).toBe('BTC/USDT:USDT');
        expect(trades[0].side).toBe('buy');
        expect(trades[0].price).toBe(50000);
        expect(trades[1].side).toBe('sell');
      });

      it('should handle limit parameter', async () => {
        mockSuccessResponse([]);

        await adapter.fetchTrades('BTC/USDT:USDT', { limit: 50 });

        const url = (mockFetch.mock.calls[0][0] as string);
        expect(url).toContain('limit=50');
      });
    });

    describe('fetchTicker', () => {
      it('should fetch and normalize ticker', async () => {
        const mockTicker: LighterTicker = {
          symbol: 'BTC-USDT-PERP',
          last: 50000,
          bid: 49995,
          ask: 50005,
          high: 51000,
          low: 49000,
          volume: 1000,
          timestamp: 1234567890000,
        };

        mockSuccessResponse(mockTicker);

        const ticker = await adapter.fetchTicker('BTC/USDT:USDT');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(ticker.symbol).toBe('BTC/USDT:USDT');
        expect(ticker.last).toBe(50000);
        expect(ticker.bid).toBe(49995);
        expect(ticker.ask).toBe(50005);
        expect(ticker.baseVolume).toBe(1000);
      });
    });

    describe('fetchFundingRate', () => {
      it('should fetch and normalize funding rate', async () => {
        const mockFundingRate: LighterFundingRate = {
          symbol: 'BTC-USDT-PERP',
          fundingRate: 0.0001,
          markPrice: 50000,
          nextFundingTime: 1234567890000,
        };

        mockSuccessResponse(mockFundingRate);

        const fundingRate = await adapter.fetchFundingRate('BTC/USDT:USDT');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(fundingRate.symbol).toBe('BTC/USDT:USDT');
        expect(fundingRate.fundingRate).toBe(0.0001);
        expect(fundingRate.markPrice).toBe(50000);
        expect(fundingRate.fundingIntervalHours).toBe(8);
      });
    });
  });

  describe('Account Methods', () => {
    describe('fetchPositions', () => {
      it('should fetch and normalize positions', async () => {
        const mockPositions: LighterPosition[] = [
          {
            symbol: 'BTC-USDT-PERP',
            side: 'long',
            size: 1.5,
            entryPrice: 49000,
            markPrice: 50000,
            liquidationPrice: 45000,
            unrealizedPnl: 1500,
            margin: 1000,
            leverage: 10,
          },
        ];

        mockSuccessResponse(mockPositions);

        const positions = await adapter.fetchPositions();

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(positions).toHaveLength(1);
        expect(positions[0].symbol).toBe('BTC/USDT:USDT');
        expect(positions[0].side).toBe('long');
        expect(positions[0].size).toBe(1.5);
        expect(positions[0].unrealizedPnl).toBe(1500);
      });

      it('should handle empty positions', async () => {
        mockSuccessResponse([]);

        const positions = await adapter.fetchPositions();

        expect(positions).toEqual([]);
      });

      it('should filter positions by symbol', async () => {
        const mockPositions: LighterPosition[] = [
          {
            symbol: 'BTC-USDT-PERP',
            side: 'long',
            size: 1.5,
            entryPrice: 49000,
            markPrice: 50000,
            liquidationPrice: 45000,
            unrealizedPnl: 1500,
            margin: 1000,
            leverage: 10,
          },
        ];

        mockSuccessResponse(mockPositions);

        const positions = await adapter.fetchPositions('BTC/USDT:USDT');

        expect(positions).toHaveLength(1);
        expect(positions[0].symbol).toBe('BTC/USDT:USDT');
      });
    });

    describe('fetchBalance', () => {
      it('should fetch and normalize balance', async () => {
        const mockBalances: LighterBalance[] = [
          {
            currency: 'USDT',
            total: 10000,
            available: 8000,
            reserved: 2000,
          },
          {
            currency: 'BTC',
            total: 1.5,
            available: 1.0,
            reserved: 0.5,
          },
        ];

        mockSuccessResponse(mockBalances);

        const balances = await adapter.fetchBalance();

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(balances).toHaveLength(2);
        expect(balances[0].currency).toBe('USDT');
        expect(balances[0].total).toBe(10000);
        expect(balances[0].free).toBe(8000);
        expect(balances[0].used).toBe(2000);
        expect(balances[1].currency).toBe('BTC');
      });

      it('should handle empty balance', async () => {
        mockSuccessResponse([]);

        const balances = await adapter.fetchBalance();

        expect(balances).toEqual([]);
      });
    });
  });

  describe('Trading Methods', () => {
    describe('createOrder', () => {
      it('should create limit buy order', async () => {
        const mockOrder: LighterOrder = {
          orderId: 'order-123',
          clientOrderId: 'client-123',
          symbol: 'BTC-USDT-PERP',
          side: 'buy',
          type: 'limit',
          price: 50000,
          size: 0.1,
          filledSize: 0,
          status: 'open',
          timestamp: 1234567890000,
          reduceOnly: false,
        };

        mockSuccessResponse(mockOrder);

        const order = await adapter.createOrder({
          symbol: 'BTC/USDT:USDT',
          type: 'limit',
          side: 'buy',
          amount: 0.1,
          price: 50000,
        });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(order.id).toBe('order-123');
        expect(order.symbol).toBe('BTC/USDT:USDT');
        expect(order.type).toBe('limit');
        expect(order.side).toBe('buy');
        expect(order.amount).toBe(0.1);
        expect(order.status).toBe('open');
      });

      it('should create market sell order', async () => {
        const mockOrder: LighterOrder = {
          orderId: 'order-456',
          symbol: 'ETH-USDT-PERP',
          side: 'sell',
          type: 'market',
          size: 1.0,
          filledSize: 0,
          status: 'open',
          timestamp: 1234567890000,
          reduceOnly: false,
        };

        mockSuccessResponse(mockOrder);

        const order = await adapter.createOrder({
          symbol: 'ETH/USDT:USDT',
          type: 'market',
          side: 'sell',
          amount: 1.0,
        });

        expect(order.type).toBe('market');
        expect(order.side).toBe('sell');
      });

      it('should create post-only order', async () => {
        const mockOrder: LighterOrder = {
          orderId: 'order-789',
          symbol: 'BTC-USDT-PERP',
          side: 'buy',
          type: 'limit',
          price: 50000,
          size: 0.1,
          filledSize: 0,
          status: 'open',
          timestamp: 1234567890000,
          reduceOnly: false,
        };

        mockSuccessResponse(mockOrder);

        const order = await adapter.createOrder({
          symbol: 'BTC/USDT:USDT',
          type: 'limit',
          side: 'buy',
          amount: 0.1,
          price: 50000,
          postOnly: true,
        });

        // Verify request body converts postOnly to timeInForce='PO'
        const requestBody = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
        expect(requestBody.timeInForce).toBe('PO');
      });

      it('should create reduce-only order', async () => {
        const mockOrder: LighterOrder = {
          orderId: 'order-reduce',
          symbol: 'BTC-USDT-PERP',
          side: 'sell',
          type: 'limit',
          price: 51000,
          size: 0.5,
          filledSize: 0,
          status: 'open',
          timestamp: 1234567890000,
          reduceOnly: true,
        };

        mockSuccessResponse(mockOrder);

        const order = await adapter.createOrder({
          symbol: 'BTC/USDT:USDT',
          type: 'limit',
          side: 'sell',
          amount: 0.5,
          price: 51000,
          reduceOnly: true,
        });

        expect(order.reduceOnly).toBe(true);
      });
    });

    describe('cancelOrder', () => {
      it('should cancel an order', async () => {
        const mockOrder: LighterOrder = {
          orderId: 'order-123',
          symbol: 'BTC-USDT-PERP',
          side: 'buy',
          type: 'limit',
          price: 50000,
          size: 0.1,
          filledSize: 0,
          status: 'cancelled',
          timestamp: 1234567890000,
          reduceOnly: false,
        };
        mockSuccessResponse(mockOrder);

        const order = await adapter.cancelOrder('order-123', 'BTC/USDT:USDT');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(order.status).toBe('canceled');
        const url = (mockFetch.mock.calls[0][0] as string);
        expect(url).toContain('/orders/order-123');
      });
    });

    describe('cancelAllOrders', () => {
      it('should cancel all orders for a symbol', async () => {
        mockSuccessResponse({ success: true, canceledCount: 5 });

        await adapter.cancelAllOrders('BTC/USDT:USDT');

        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('should cancel all orders for all symbols', async () => {
        mockSuccessResponse({ success: true, canceledCount: 10 });

        await adapter.cancelAllOrders();

        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(adapter.fetchMarkets()).rejects.toThrow();
    });

    it('should handle 401 unauthorized', async () => {
      mockFailedResponse(401, 'Unauthorized');

      await expect(adapter.fetchBalance()).rejects.toThrow();
    });

    it('should handle 429 rate limit', async () => {
      mockFailedResponse(429, 'Too Many Requests');

      await expect(adapter.fetchMarkets()).rejects.toThrow();
    });

    it('should handle 500 server error', async () => {
      mockFailedResponse(500, 'Internal Server Error');

      await expect(adapter.fetchMarkets()).rejects.toThrow();
    });

    it('should handle invalid order parameters', async () => {
      mockSuccessResponse({ error: 'Invalid order size' });

      await expect(
        adapter.createOrder({
          symbol: 'BTC/USDT:USDT',
          type: 'limit',
          side: 'buy',
          amount: -1, // Invalid negative amount
          price: 50000,
        })
      ).rejects.toThrow();
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      // Create adapter with tier1 (low limits)
      const limitedAdapter = new LighterAdapter({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        testnet: true,
        rateLimitTier: 'tier1', // 60 requests per minute
      });

      // Mock 60 responses for 60 requests
      for (let i = 0; i < 60; i++) {
        mockSuccessResponse([]);
      }

      // Make 60 requests
      const promises = Array.from({ length: 60 }, () => limitedAdapter.fetchMarkets());

      await Promise.all(promises);

      expect(mockFetch).toHaveBeenCalledTimes(60);
    });

    it('should track endpoint weights', async () => {
      const mockOrder: LighterOrder = {
        orderId: 'order-weight-test',
        symbol: 'BTC-USDT-PERP',
        side: 'buy',
        type: 'limit',
        price: 50000,
        size: 0.1,
        filledSize: 0,
        status: 'open',
        timestamp: 1234567890000,
        reduceOnly: false,
      };
      mockSuccessResponse(mockOrder);

      // createOrder has weight 5 (higher than fetchMarkets weight 1)
      await adapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Symbol Normalization', () => {
    it('should correctly convert unified to Lighter format', () => {
      // BTC/USDT:USDT -> BTC-USDT-PERP
      const normalizer = (adapter as any).normalizer;
      expect(normalizer.toLighterSymbol('BTC/USDT:USDT')).toBe('BTC-USDT-PERP');
      expect(normalizer.toLighterSymbol('ETH/USDT:USDT')).toBe('ETH-USDT-PERP');
    });

    it('should correctly convert Lighter to unified format', () => {
      const normalizer = (adapter as any).normalizer;
      expect(normalizer.normalizeSymbol('BTC-USDT-PERP')).toBe('BTC/USDT:USDT');
      expect(normalizer.normalizeSymbol('ETH-USDT-PERP')).toBe('ETH/USDT:USDT');
    });
  });
});

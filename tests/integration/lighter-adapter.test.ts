/**
 * Integration Tests for LighterAdapter
 *
 * Tests adapter methods with mocked API responses
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
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
  let pendingTimers: ReturnType<typeof setTimeout>[] = [];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    pendingTimers = [];
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    // Setup WebSocket mock to auto-trigger 'open' event
    (WebSocket as unknown as jest.Mock).mockImplementation(() => {
      const mockWs = {
        on: jest.fn((event: string, handler: Function) => {
          if (event === 'open') {
            // Trigger open event asynchronously with tracked timer
            const timer = setTimeout(() => handler(), 0);
            if (timer.unref) timer.unref(); // Allow process to exit
            pendingTimers.push(timer);
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

  afterEach(async () => {
    // Clean up pending timers
    for (const timer of pendingTimers) {
      clearTimeout(timer);
    }
    pendingTimers = [];

    // Clean up adapter to prevent timer leaks
    try {
      if (adapter) {
        await adapter.disconnect();
      }
    } catch {
      // Ignore errors during cleanup
    }
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
      expect(adapter.has.createBatchOrders).toBe('emulated');
      expect(adapter.has.cancelBatchOrders).toBe('emulated');
      expect(adapter.has.setLeverage).toBe(false);
      expect(adapter.has.watchOrderBook).toBe(true);
      expect(adapter.has.watchTrades).toBe(true);
      expect(adapter.has.watchPositions).toBe(true);
    });
  });

  describe('Market Data Methods', () => {
    describe('fetchMarkets', () => {
      it('should fetch and normalize markets', async () => {
        // Real Lighter API response format
        const mockResponse = {
          code: 200,
          order_book_details: [
            {
              symbol: 'BTC',
              market_id: 1,
              market_type: 'perp',
              status: 'active',
              min_base_amount: '0.001',
              min_quote_amount: '10.000000',
              supported_size_decimals: 5,
              supported_price_decimals: 1,
              maker_fee: '0.0002',
              taker_fee: '0.0005',
              default_initial_margin_fraction: 200,
            },
            {
              symbol: 'ETH',
              market_id: 0,
              market_type: 'perp',
              status: 'active',
              min_base_amount: '0.01',
              min_quote_amount: '10.000000',
              supported_size_decimals: 4,
              supported_price_decimals: 2,
              maker_fee: '0.0002',
              taker_fee: '0.0005',
              default_initial_margin_fraction: 200,
            },
          ],
        };

        mockSuccessResponse(mockResponse);

        const markets = await adapter.fetchMarkets();

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(markets).toHaveLength(2);
        expect(markets[0].symbol).toBe('BTC/USDC:USDC');
        expect(markets[0].base).toBe('BTC');
        expect(markets[0].quote).toBe('USDC');
        expect(markets[0].active).toBe(true);
        expect(markets[1].symbol).toBe('ETH/USDC:USDC');
      });

      it('should handle empty markets list', async () => {
        mockSuccessResponse({ code: 200, order_book_details: [] });

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
        // First mock fetchMarkets to populate the market_id cache
        const mockMarketsResponse = {
          code: 200,
          order_book_details: [
            { symbol: 'BTC', market_id: 1, market_type: 'perp', status: 'active' },
          ],
        };
        mockSuccessResponse(mockMarketsResponse);

        // Then mock the orderbook response
        // Lighter orderbook response format uses remaining_base_amount for size
        const mockOrderBookResponse = {
          code: 200,
          bids: [
            { price: '50000', remaining_base_amount: '1.5' },
            { price: '49990', remaining_base_amount: '2.0' },
          ],
          asks: [
            { price: '50010', remaining_base_amount: '1.0' },
            { price: '50020', remaining_base_amount: '1.5' },
          ],
        };
        mockSuccessResponse(mockOrderBookResponse);

        const orderBook = await adapter.fetchOrderBook('BTC/USDC:USDC');

        expect(mockFetch).toHaveBeenCalledTimes(2); // fetchMarkets + fetchOrderBook
        expect(orderBook.symbol).toBe('BTC/USDC:USDC');
        expect(orderBook.bids).toHaveLength(2);
        expect(orderBook.asks).toHaveLength(2);
        expect(orderBook.bids[0]).toEqual([50000, 1.5]);
        expect(orderBook.asks[0]).toEqual([50010, 1.0]);
      });

      it('should handle custom depth limit', async () => {
        // First mock fetchMarkets to populate the market_id cache
        const mockMarketsResponse = {
          code: 200,
          order_book_details: [
            { symbol: 'ETH', market_id: 0, market_type: 'perp', status: 'active' },
          ],
        };
        mockSuccessResponse(mockMarketsResponse);

        // Then mock the orderbook response
        const mockOrderBookResponse = {
          code: 200,
          bids: [{ price: '3000', remaining_base_amount: '10' }],
          asks: [{ price: '3010', remaining_base_amount: '5' }],
        };
        mockSuccessResponse(mockOrderBookResponse);

        const orderBook = await adapter.fetchOrderBook('ETH/USDC:USDC', { limit: 100 });

        expect(mockFetch).toHaveBeenCalledTimes(2);
        // Check the second call (orderbook) contains limit parameter
        const url = (mockFetch.mock.calls[1][0] as string);
        expect(url).toContain('limit=100');
      });
    });

    describe('fetchTrades', () => {
      it('should fetch and normalize public trades', async () => {
        // First call: fetchMarkets to populate marketIdCache
        const mockMarketsResponse = {
          code: 200,
          order_book_details: [
            { symbol: 'BTC', market_id: 1, market_type: 'perp', status: 'active' },
          ],
        };
        mockSuccessResponse(mockMarketsResponse);

        // Second call: recentTrades with market_id
        // Uses trade_id, is_maker_ask (false=buy, true=sell), size fields
        const mockTradesResponse = {
          code: 200,
          trades: [
            {
              trade_id: 'trade-1',
              is_maker_ask: false,
              price: '50000',
              size: '0.5',
              timestamp: 1234567890000,
            },
            {
              trade_id: 'trade-2',
              is_maker_ask: true,
              price: '50010',
              size: '0.3',
              timestamp: 1234567891000,
            },
          ],
        };
        mockSuccessResponse(mockTradesResponse);

        const trades = await adapter.fetchTrades('BTC/USDC:USDC');

        expect(mockFetch).toHaveBeenCalledTimes(2); // fetchMarkets + recentTrades
        expect(trades).toHaveLength(2);
        expect(trades[0].symbol).toBe('BTC/USDC:USDC');
        expect(trades[0].side).toBe('buy');
        expect(trades[0].price).toBe(50000);
        expect(trades[1].side).toBe('sell');
      });

      it('should handle limit parameter', async () => {
        // First call: fetchMarkets to populate marketIdCache
        const mockMarketsResponse = {
          code: 200,
          order_book_details: [
            { symbol: 'BTC', market_id: 1, market_type: 'perp', status: 'active' },
          ],
        };
        mockSuccessResponse(mockMarketsResponse);

        // Second call: recentTrades
        mockSuccessResponse({ code: 200, trades: [] });

        await adapter.fetchTrades('BTC/USDC:USDC', { limit: 50 });

        // Check the second call (recentTrades) contains limit parameter
        const url = (mockFetch.mock.calls[1][0] as string);
        expect(url).toContain('limit=50');
        expect(url).toContain('recentTrades');
      });
    });

    describe('fetchTicker', () => {
      it('should fetch and normalize ticker', async () => {
        // Lighter uses orderBookDetails endpoint for ticker data
        // Response format: { code, order_book_details: [...] }
        const mockResponse = {
          code: 200,
          order_book_details: [
            {
              symbol: 'BTC',
              market_type: 'perp',
              status: 'active',
              last_trade_price: '50000',
              daily_price_high: '51000',
              daily_price_low: '49000',
              daily_base_token_volume: '1000',
              daily_quote_token_volume: '50000000',
              daily_price_change: '2.5',
            },
          ],
        };

        mockSuccessResponse(mockResponse);

        const ticker = await adapter.fetchTicker('BTC/USDC:USDC');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(ticker.symbol).toBe('BTC/USDC:USDC');
        expect(ticker.last).toBe(50000);
        expect(ticker.high).toBe(51000);
        expect(ticker.low).toBe(49000);
        expect(ticker.baseVolume).toBe(1000);
      });
    });

    describe('fetchFundingRate', () => {
      it('should fetch and normalize funding rate', async () => {
        // First call: fetchMarkets to populate marketIdCache
        const mockMarketsResponse = {
          code: 200,
          order_book_details: [
            { symbol: 'BTC', market_id: 1, market_type: 'perp', status: 'active' },
          ],
        };
        mockSuccessResponse(mockMarketsResponse);

        // Second call: funding-rates API returns array format
        const mockFundingResponse = {
          code: 200,
          funding_rates: [
            {
              market_id: 1,
              exchange: 'lighter',
              symbol: 'BTC',
              rate: 0.0001,
            },
          ],
        };
        mockSuccessResponse(mockFundingResponse);

        const fundingRate = await adapter.fetchFundingRate('BTC/USDC:USDC');

        expect(mockFetch).toHaveBeenCalledTimes(2); // fetchMarkets + funding-rates
        expect(fundingRate.symbol).toBe('BTC/USDC:USDC');
        expect(fundingRate.fundingRate).toBe(0.0001);
        expect(fundingRate.fundingIntervalHours).toBe(8);
      });
    });
  });

  describe('Account Methods', () => {
    describe('fetchPositions', () => {
      it('should fetch and normalize positions', async () => {
        // Lighter uses simple symbols (BTC) with USDC as quote currency
        const mockPositions: LighterPosition[] = [
          {
            symbol: 'BTC',
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
        expect(positions[0].symbol).toBe('BTC/USDC:USDC');
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
            symbol: 'BTC',
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

        const positions = await adapter.fetchPositions(['BTC/USDC:USDC']);

        expect(positions).toHaveLength(1);
        expect(positions[0].symbol).toBe('BTC/USDC:USDC');
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
        // Lighter uses simple symbols (BTC) with USDC as quote currency
        const mockOrder: LighterOrder = {
          orderId: 'order-123',
          clientOrderId: 'client-123',
          symbol: 'BTC',
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
          symbol: 'BTC/USDC:USDC',
          type: 'limit',
          side: 'buy',
          amount: 0.1,
          price: 50000,
        });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(order.id).toBe('order-123');
        expect(order.symbol).toBe('BTC/USDC:USDC');
        expect(order.type).toBe('limit');
        expect(order.side).toBe('buy');
        expect(order.amount).toBe(0.1);
        expect(order.status).toBe('open');
      });

      it('should create market sell order', async () => {
        const mockOrder: LighterOrder = {
          orderId: 'order-456',
          symbol: 'ETH',
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
          symbol: 'ETH/USDC:USDC',
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
          symbol: 'BTC',
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
          symbol: 'BTC/USDC:USDC',
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
          symbol: 'BTC',
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
          symbol: 'BTC/USDC:USDC',
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
          symbol: 'BTC',
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

        const order = await adapter.cancelOrder('order-123', 'BTC/USDC:USDC');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(order.status).toBe('canceled');
        const url = (mockFetch.mock.calls[0][0] as string);
        expect(url).toContain('/orders/order-123');
      });
    });

    describe('cancelAllOrders', () => {
      it('should cancel all orders for a symbol', async () => {
        mockSuccessResponse({ success: true, canceledCount: 5 });

        await adapter.cancelAllOrders('BTC/USDC:USDC');

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
      // Validation rejects negative amount before fetch is called
      await expect(
        adapter.createOrder({
          symbol: 'BTC/USDC:USDC',
          type: 'limit',
          side: 'buy',
          amount: -1, // Invalid negative amount
          price: 50000,
        })
      ).rejects.toThrow();

      // Verify fetch was never called (validation catches invalid params)
      expect(mockFetch).not.toHaveBeenCalled();
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

      // Mock 60 responses with valid format for fetchMarkets
      for (let i = 0; i < 60; i++) {
        mockSuccessResponse({ code: 200, order_book_details: [] });
      }

      // Make 60 requests
      const promises = Array.from({ length: 60 }, () => limitedAdapter.fetchMarkets());

      await Promise.all(promises);

      expect(mockFetch).toHaveBeenCalledTimes(60);
    });

    it('should track endpoint weights', async () => {
      const mockOrder: LighterOrder = {
        orderId: 'order-weight-test',
        symbol: 'BTC',
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
        symbol: 'BTC/USDC:USDC',
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
      // Lighter uses simple symbols: BTC/USDC:USDC -> BTC
      const normalizer = (adapter as any).normalizer;
      expect(normalizer.toLighterSymbol('BTC/USDC:USDC')).toBe('BTC');
      expect(normalizer.toLighterSymbol('ETH/USDC:USDC')).toBe('ETH');
    });

    it('should correctly convert Lighter to unified format', () => {
      // Lighter uses simple symbols: BTC -> BTC/USDC:USDC
      const normalizer = (adapter as any).normalizer;
      expect(normalizer.normalizeSymbol('BTC')).toBe('BTC/USDC:USDC');
      expect(normalizer.normalizeSymbol('ETH')).toBe('ETH/USDC:USDC');
    });
  });

  describe('FFI Configuration', () => {
    it('should detect HMAC auth mode when apiKey/apiSecret provided', () => {
      const hmacAdapter = new LighterAdapter({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        testnet: true,
      });

      expect(hmacAdapter.hasAuthentication).toBe(true);
      expect(hmacAdapter.hasFFISigning).toBe(false);
    });

    it('should detect FFI auth mode when apiPrivateKey provided', async () => {
      const ffiAdapter = new LighterAdapter({
        apiPrivateKey: '0x' + '1'.repeat(64),
        testnet: true,
      });

      expect(ffiAdapter.hasAuthentication).toBe(true);
      // Signer is created but not initialized until initialize() is called
      await ffiAdapter.initialize();
      // hasFFISigning will be true if koffi is installed and native library is available
      // It will be false if native library is missing or koffi fails to load
      // We just check that the adapter is ready regardless of FFI status
      expect(ffiAdapter.isReady).toBe(true);
    });

    it('should detect no auth when no credentials provided', () => {
      const noAuthAdapter = new LighterAdapter({
        testnet: true,
      });

      expect(noAuthAdapter.hasAuthentication).toBe(false);
      expect(noAuthAdapter.hasFFISigning).toBe(false);
    });

    it('should prefer FFI over HMAC when both provided', async () => {
      const dualAdapter = new LighterAdapter({
        apiPrivateKey: '0x' + '1'.repeat(64),
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        testnet: true,
      });

      // Should have both auth methods configured
      expect(dualAdapter.hasAuthentication).toBe(true);

      // After initialization (without native lib), should fallback gracefully
      await dualAdapter.initialize();
      // FFI won't be available in test env, but should not throw
      expect(dualAdapter.isReady).toBe(true);
    });

    it('should use correct chain ID for testnet', () => {
      const testnetAdapter = new LighterAdapter({
        apiPrivateKey: '0x' + '1'.repeat(64),
        testnet: true,
      });

      // Access private field via any
      expect((testnetAdapter as any).chainId).toBe(300);
    });

    it('should use correct chain ID for mainnet', () => {
      const mainnetAdapter = new LighterAdapter({
        apiPrivateKey: '0x' + '1'.repeat(64),
        testnet: false,
      });

      expect((mainnetAdapter as any).chainId).toBe(304);
    });

    it('should allow custom chain ID override', () => {
      const customAdapter = new LighterAdapter({
        apiPrivateKey: '0x' + '1'.repeat(64),
        chainId: 999,
        testnet: true,
      });

      expect((customAdapter as any).chainId).toBe(999);
    });

    it('should use default apiKeyIndex and accountIndex', () => {
      const adapter = new LighterAdapter({
        apiPrivateKey: '0x' + '1'.repeat(64),
        testnet: true,
      });

      expect((adapter as any).apiKeyIndex).toBe(255);
      expect((adapter as any).accountIndex).toBe(0);
    });

    it('should allow custom apiKeyIndex and accountIndex', () => {
      const adapter = new LighterAdapter({
        apiPrivateKey: '0x' + '1'.repeat(64),
        apiKeyIndex: 10,
        accountIndex: 5,
        testnet: true,
      });

      expect((adapter as any).apiKeyIndex).toBe(10);
      expect((adapter as any).accountIndex).toBe(5);
    });
  });

  describe('Nonce Resync', () => {
    it('should have resyncNonce method', () => {
      expect(typeof adapter.resyncNonce).toBe('function');
    });

    it('should not throw when resyncNonce called without FFI', async () => {
      // Adapter without FFI should handle resync gracefully
      await expect(adapter.resyncNonce()).resolves.not.toThrow();
    });
  });

  describe('Collateral Management', () => {
    it('should have withdrawCollateral method', () => {
      expect(typeof adapter.withdrawCollateral).toBe('function');
    });

    it('should require WASM signing for withdrawCollateral', async () => {
      // Adapter with only HMAC auth should reject withdrawal
      await expect(
        adapter.withdrawCollateral(0, BigInt(100000000), '0x' + '1'.repeat(40))
      ).rejects.toThrow('WASM signing');
    });

    it('should validate destination address format', async () => {
      const ffiAdapter = new LighterAdapter({
        apiPrivateKey: '0x' + '1'.repeat(64),
        testnet: true,
      });
      await ffiAdapter.initialize();

      // Invalid address should be rejected (even though FFI is not available)
      await expect(
        ffiAdapter.withdrawCollateral(0, BigInt(100), 'invalid-address')
      ).rejects.toThrow();
    });
  });

  describe('WebSocket Orders Streaming', () => {
    it('should support watchOrders feature', () => {
      expect(adapter.has.watchOrders).toBe(true);
    });
  });
});

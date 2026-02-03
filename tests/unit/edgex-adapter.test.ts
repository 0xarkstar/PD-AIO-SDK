/**
 * EdgeXAdapter Tests
 *
 * Tests for EdgeX Exchange adapter
 */

import { EdgeXAdapter } from '../../src/adapters/edgex/EdgeXAdapter.js';
import { PerpDEXError } from '../../src/types/errors.js';

// Mock WebSocketManager
jest.mock('../../src/websocket/WebSocketManager.js', () => ({
  WebSocketManager: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(),
  })),
}));

describe('EdgeXAdapter', () => {
  let adapter: EdgeXAdapter;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    adapter = new EdgeXAdapter();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('creates adapter with default config', () => {
      const adapter = new EdgeXAdapter();
      expect(adapter.id).toBe('edgex');
      expect(adapter.name).toBe('EdgeX');
    });

    test('creates adapter with stark private key', () => {
      const adapter = new EdgeXAdapter({
        starkPrivateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      });
      expect(adapter).toBeInstanceOf(EdgeXAdapter);
    });

    test('creates adapter for testnet', () => {
      const adapter = new EdgeXAdapter({ testnet: true });
      expect(adapter).toBeInstanceOf(EdgeXAdapter);
    });

    test('has expected features', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(false); // Not available via REST
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
    });
  });

  describe('initialize', () => {
    test('initializes adapter', async () => {
      await adapter.initialize();
      expect(adapter.isReady).toBe(true);
    });
  });

  describe('disconnect', () => {
    test('disconnects cleanly', async () => {
      await adapter.initialize();
      await expect(adapter.disconnect()).resolves.not.toThrow();
    });
  });

  describe('fetchMarkets', () => {
    test('fetches and normalizes markets from new API format', async () => {
      const mockResponse = {
        code: 'SUCCESS',
        data: {
          contractList: [
            {
              contractId: '10001',
              contractName: 'BTCUSD',
              settleCoin: 'USD',
              displayName: 'BTC/USD',
              minOrderSize: '0.001',
              tickSize: '0.1',
              stepSize: '0.001',
              enableTrade: true,
              riskTierList: [{ maxLeverage: '100' }],
            },
            {
              contractId: '10002',
              contractName: 'ETHUSD',
              settleCoin: 'USD',
              displayName: 'ETH/USD',
              minOrderSize: '0.01',
              tickSize: '0.01',
              stepSize: '0.01',
              enableTrade: true,
              riskTierList: [{ maxLeverage: '50' }],
            },
          ],
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(2);
      expect(markets[0].symbol).toContain('BTC');
    });

    test('fetches markets from legacy format', async () => {
      const mockResponse = {
        markets: [
          {
            contractId: '10001',
            contractName: 'BTCUSD',
            symbol: 'BTCUSDT',
            baseAsset: 'BTC',
            quoteAsset: 'USDT',
            tickSize: '0.1',
            stepSize: '0.001',
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(1);
    });

    test('throws on invalid response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'data' }),
      });

      await expect(adapter.fetchMarkets()).rejects.toThrow(PerpDEXError);
    });
  });

  describe('fetchTicker', () => {
    test('fetches ticker for symbol', async () => {
      const mockResponse = {
        code: 'SUCCESS',
        data: [
          {
            contractId: '10001',
            lastPrice: '50000.00',
            high24h: '51000.00',
            low24h: '49000.00',
            volume24h: '1000.00',
            priceChange24h: '500.00',
            priceChangePercent24h: '1.00',
            markPrice: '50000.50',
            indexPrice: '50000.25',
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const ticker = await adapter.fetchTicker('BTC/USDT:USDT');

      expect(ticker).toBeDefined();
    });

    test('throws on empty data array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ code: 'SUCCESS', data: [] }),
      });

      await expect(adapter.fetchTicker('BTC/USDT:USDT')).rejects.toThrow(PerpDEXError);
    });

    test('throws on invalid response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ code: 'SUCCESS', data: null }),
      });

      await expect(adapter.fetchTicker('BTC/USDT:USDT')).rejects.toThrow(PerpDEXError);
    });
  });

  describe('fetchOrderBook', () => {
    test('fetches order book', async () => {
      const mockResponse = {
        code: 'SUCCESS',
        data: [
          {
            bids: [{ price: '50000.00', size: '1.5' }],
            asks: [{ price: '50001.00', size: '1.0' }],
            timestamp: Date.now(),
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const orderBook = await adapter.fetchOrderBook('BTC/USDT:USDT');

      expect(orderBook).toBeDefined();
      expect(orderBook.bids).toBeDefined();
      expect(orderBook.asks).toBeDefined();
    });

    test('fetches order book with limit', async () => {
      const mockResponse = {
        code: 'SUCCESS',
        data: [
          {
            bids: [],
            asks: [],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await adapter.fetchOrderBook('BTC/USDT:USDT', { limit: 10 });

      expect(mockFetch).toHaveBeenCalled();
    });

    test('throws on empty data array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ code: 'SUCCESS', data: [] }),
      });

      await expect(adapter.fetchOrderBook('BTC/USDT:USDT')).rejects.toThrow(PerpDEXError);
    });

    test('throws on invalid response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ code: 'SUCCESS', data: null }),
      });

      await expect(adapter.fetchOrderBook('BTC/USDT:USDT')).rejects.toThrow(PerpDEXError);
    });
  });

  describe('fetchFundingRate', () => {
    test('fetches current funding rate', async () => {
      const mockResponse = {
        code: 'SUCCESS',
        data: [
          {
            contractId: '10001',
            fundingRate: '0.0001',
            fundingTime: Date.now(),
            nextFundingTime: Date.now() + 3600000,
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const fundingRate = await adapter.fetchFundingRate('BTC/USDT:USDT');

      expect(fundingRate).toBeDefined();
    });

    test('throws on empty data array', async () => {
      const mockResponse = {
        code: 'SUCCESS',
        data: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(adapter.fetchFundingRate('BTC/USDT:USDT')).rejects.toThrow(PerpDEXError);
    });

    test('throws on invalid response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ code: 'SUCCESS', data: null }),
      });

      await expect(adapter.fetchFundingRate('BTC/USDT:USDT')).rejects.toThrow(PerpDEXError);
    });

    test('throws on error code', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ code: 'ERROR', message: 'Something went wrong' }),
      });

      await expect(adapter.fetchFundingRate('BTC/USDT:USDT')).rejects.toThrow(PerpDEXError);
    });
  });

  describe('private methods requiring auth', () => {
    describe('without credentials', () => {
      test('fetchPositions throws without auth', async () => {
        await expect(adapter.fetchPositions()).rejects.toThrow(PerpDEXError);
        await expect(adapter.fetchPositions()).rejects.toMatchObject({
          code: 'MISSING_CREDENTIALS',
        });
      });

      test('fetchBalance throws without auth', async () => {
        await expect(adapter.fetchBalance()).rejects.toThrow(PerpDEXError);
        await expect(adapter.fetchBalance()).rejects.toMatchObject({
          code: 'MISSING_CREDENTIALS',
        });
      });

      test('createOrder throws without auth', async () => {
        await expect(
          adapter.createOrder({
            symbol: 'BTC/USDT:USDT',
            side: 'buy',
            type: 'limit',
            amount: 0.1,
            price: 50000,
          })
        ).rejects.toMatchObject({
          code: 'MISSING_CREDENTIALS',
        });
      });

      test('cancelOrder throws without auth', async () => {
        await expect(adapter.cancelOrder('order-123')).rejects.toMatchObject({
          code: 'MISSING_CREDENTIALS',
        });
      });

      test('cancelAllOrders throws without auth', async () => {
        await expect(adapter.cancelAllOrders()).rejects.toMatchObject({
          code: 'MISSING_CREDENTIALS',
        });
      });

      test('fetchOpenOrders throws without auth', async () => {
        await expect(adapter.fetchOpenOrders()).rejects.toMatchObject({
          code: 'MISSING_CREDENTIALS',
        });
      });

      test('fetchOrder throws without auth', async () => {
        await expect(adapter.fetchOrder('order-123')).rejects.toMatchObject({
          code: 'MISSING_CREDENTIALS',
        });
      });

      // Note: setLeverage, fetchOrderHistory, fetchMyTrades don't call requireAuth()
      // They will fail later in makeRequest when trying to sign without credentials
      test('setLeverage throws error without auth', async () => {
        await expect(adapter.setLeverage('BTC/USDT:USDT', 10)).rejects.toThrow();
      });

      test('fetchOrderHistory throws error without auth', async () => {
        await expect(adapter.fetchOrderHistory()).rejects.toThrow();
      });

      test('fetchMyTrades throws error without auth', async () => {
        await expect(adapter.fetchMyTrades()).rejects.toThrow();
      });
    });
  });

  describe('symbol conversion', () => {
    test('converts unified symbol to exchange format', () => {
      const exchangeSymbol = adapter.symbolToExchange('BTC/USDT:USDT');
      expect(exchangeSymbol).toBeDefined();
      expect(typeof exchangeSymbol).toBe('string');
    });

    test('converts exchange symbol to unified format', () => {
      const unifiedSymbol = adapter.symbolFromExchange('BTCUSDT');
      expect(unifiedSymbol).toBeDefined();
      expect(typeof unifiedSymbol).toBe('string');
    });
  });
});

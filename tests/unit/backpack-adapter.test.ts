/**
 * BackpackAdapter Tests
 *
 * Tests for Backpack Exchange adapter
 */

import { BackpackAdapter } from '../../src/adapters/backpack/BackpackAdapter.js';
import { PerpDEXError } from '../../src/types/errors.js';

// Mock HTTPClient
jest.mock('../../src/core/http/HTTPClient.js', () => ({
  HTTPClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock WebSocketManager
jest.mock('../../src/websocket/WebSocketManager.js', () => ({
  WebSocketManager: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(),
  })),
}));

describe('BackpackAdapter', () => {
  let adapter: BackpackAdapter;
  let mockHttpClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new BackpackAdapter();
    // Get the mocked HTTP client instance
    mockHttpClient = (adapter as any).httpClient;
  });

  describe('constructor', () => {
    test('creates adapter with default config', () => {
      const adapter = new BackpackAdapter();
      expect(adapter.id).toBe('backpack');
      expect(adapter.name).toBe('Backpack');
    });

    test('creates adapter with API credentials', () => {
      const adapter = new BackpackAdapter({
        apiKey: 'test-key',
        apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      });
      expect(adapter).toBeInstanceOf(BackpackAdapter);
    });

    test('creates adapter for testnet', () => {
      const adapter = new BackpackAdapter({ testnet: true });
      expect(adapter).toBeInstanceOf(BackpackAdapter);
    });

    test('creates adapter with custom timeout', () => {
      const adapter = new BackpackAdapter({ timeout: 60000 });
      expect(adapter).toBeInstanceOf(BackpackAdapter);
    });

    test('has expected features', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
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
    test('fetches and normalizes markets', async () => {
      const mockMarkets = [
        {
          symbol: 'BTC_USDC_PERP',
          baseCurrency: 'BTC',
          quoteCurrency: 'USDC',
          minOrderSize: '0.001',
          tickSize: '0.1',
          stepSize: '0.001',
        },
        {
          symbol: 'ETH_USDC_PERP',
          baseCurrency: 'ETH',
          quoteCurrency: 'USDC',
          minOrderSize: '0.01',
          tickSize: '0.01',
          stepSize: '0.01',
        },
      ];

      mockHttpClient.get.mockResolvedValue(mockMarkets);

      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(2);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/markets',
        expect.any(Object)
      );
    });

    test('throws on invalid response', async () => {
      mockHttpClient.get.mockResolvedValue({ invalid: 'data' });

      await expect(adapter.fetchMarkets()).rejects.toThrow(PerpDEXError);
      await expect(adapter.fetchMarkets()).rejects.toMatchObject({
        code: 'INVALID_RESPONSE',
      });
    });
  });

  describe('fetchTicker', () => {
    test('fetches ticker for symbol', async () => {
      const mockTicker = {
        symbol: 'BTC_USDC_PERP',
        lastPrice: '50000.00',
        high24h: '51000.00',
        low24h: '49000.00',
        volume24h: '1000.00',
        priceChange24h: '500.00',
        priceChangePercent24h: '1.00',
      };

      mockHttpClient.get.mockResolvedValue(mockTicker);

      const ticker = await adapter.fetchTicker('BTC/USDC:USDC');

      expect(ticker).toBeDefined();
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ticker'),
        expect.any(Object)
      );
    });
  });

  describe('fetchOrderBook', () => {
    test('fetches order book', async () => {
      const mockOrderBook = {
        bids: [['50000.00', '1.5'], ['49999.00', '2.0']],
        asks: [['50001.00', '1.0'], ['50002.00', '3.0']],
        lastUpdateId: 12345,
      };

      mockHttpClient.get.mockResolvedValue(mockOrderBook);

      const orderBook = await adapter.fetchOrderBook('BTC/USDC:USDC');

      expect(orderBook).toBeDefined();
      expect(orderBook.bids).toBeDefined();
      expect(orderBook.asks).toBeDefined();
    });

    test('fetches order book with limit', async () => {
      const mockOrderBook = {
        bids: [['50000.00', '1.5']],
        asks: [['50001.00', '1.0']],
      };

      mockHttpClient.get.mockResolvedValue(mockOrderBook);

      await adapter.fetchOrderBook('BTC/USDC:USDC', { limit: 10 });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('depth=10'),
        expect.any(Object)
      );
    });
  });

  describe('fetchTrades', () => {
    test('fetches recent trades', async () => {
      const mockTrades = [
        {
          id: '1',
          price: '50000.00',
          quantity: '0.1',
          time: Date.now(),
          isBuyerMaker: true,
        },
        {
          id: '2',
          price: '50001.00',
          quantity: '0.2',
          time: Date.now(),
          isBuyerMaker: false,
        },
      ];

      mockHttpClient.get.mockResolvedValue(mockTrades);

      const trades = await adapter.fetchTrades('BTC/USDC:USDC');

      expect(trades).toHaveLength(2);
    });

    test('throws on invalid trades response', async () => {
      mockHttpClient.get.mockResolvedValue({ invalid: 'data' });

      await expect(adapter.fetchTrades('BTC/USDC:USDC')).rejects.toThrow(PerpDEXError);
    });

    test('fetches trades with limit', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      await adapter.fetchTrades('BTC/USDC:USDC', { limit: 50 });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );
    });
  });

  describe('fetchFundingRate', () => {
    test('fetches current funding rate', async () => {
      const mockFundingRates = [
        {
          symbol: 'BTC_USDC_PERP',
          fundingRate: '0.0001',
          intervalEndTimestamp: new Date().toISOString(),
        },
      ];

      mockHttpClient.get.mockResolvedValue(mockFundingRates);

      const fundingRate = await adapter.fetchFundingRate('BTC/USDC:USDC');

      expect(fundingRate).toBeDefined();
      expect(fundingRate.symbol).toBeDefined();
    });

    test('throws when no funding rate data', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      await expect(adapter.fetchFundingRate('BTC/USDC:USDC')).rejects.toThrow(PerpDEXError);
    });

    test('throws on invalid funding rate response', async () => {
      mockHttpClient.get.mockResolvedValue({ invalid: 'data' });

      await expect(adapter.fetchFundingRate('BTC/USDC:USDC')).rejects.toThrow(PerpDEXError);
    });
  });

  describe('fetchFundingRateHistory', () => {
    test('fetches funding rate history', async () => {
      const now = Date.now();
      const mockFundingRates = [
        { symbol: 'BTC_USDC_PERP', fundingRate: '0.0001', intervalEndTimestamp: new Date(now - 3600000).toISOString() },
        { symbol: 'BTC_USDC_PERP', fundingRate: '0.0002', intervalEndTimestamp: new Date(now).toISOString() },
      ];

      mockHttpClient.get.mockResolvedValue(mockFundingRates);

      const history = await adapter.fetchFundingRateHistory('BTC/USDC:USDC');

      expect(history).toHaveLength(2);
    });

    test('filters by since timestamp', async () => {
      const now = Date.now();
      const mockFundingRates = [
        { symbol: 'BTC_USDC_PERP', fundingRate: '0.0001', intervalEndTimestamp: new Date(now - 7200000).toISOString() },
        { symbol: 'BTC_USDC_PERP', fundingRate: '0.0002', intervalEndTimestamp: new Date(now).toISOString() },
      ];

      mockHttpClient.get.mockResolvedValue(mockFundingRates);

      const history = await adapter.fetchFundingRateHistory('BTC/USDC:USDC', now - 3600000);

      expect(history).toHaveLength(1);
    });

    test('limits results', async () => {
      const now = Date.now();
      const mockFundingRates = [
        { symbol: 'BTC_USDC_PERP', fundingRate: '0.0001', intervalEndTimestamp: new Date(now - 3600000).toISOString() },
        { symbol: 'BTC_USDC_PERP', fundingRate: '0.0002', intervalEndTimestamp: new Date(now).toISOString() },
      ];

      mockHttpClient.get.mockResolvedValue(mockFundingRates);

      const history = await adapter.fetchFundingRateHistory('BTC/USDC:USDC', undefined, 1);

      expect(history).toHaveLength(1);
    });

    test('throws on invalid response', async () => {
      mockHttpClient.get.mockResolvedValue({ invalid: 'data' });

      await expect(adapter.fetchFundingRateHistory('BTC/USDC:USDC')).rejects.toThrow(PerpDEXError);
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
            symbol: 'BTC/USDC:USDC',
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

      test('setLeverage throws without auth', async () => {
        await expect(adapter.setLeverage('BTC/USDC:USDC', 10)).rejects.toMatchObject({
          code: 'MISSING_CREDENTIALS',
        });
      });

      test('fetchOrderHistory throws without auth', async () => {
        await expect(adapter.fetchOrderHistory()).rejects.toMatchObject({
          code: 'MISSING_CREDENTIALS',
        });
      });

      test('fetchMyTrades throws without auth', async () => {
        await expect(adapter.fetchMyTrades()).rejects.toMatchObject({
          code: 'MISSING_CREDENTIALS',
        });
      });
    });

    describe('with credentials', () => {
      let authAdapter: BackpackAdapter;
      let authMockClient: any;

      beforeEach(() => {
        authAdapter = new BackpackAdapter({
          apiKey: 'test-key',
          apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        });
        authMockClient = (authAdapter as any).httpClient;
      });

      test('fetchPositions returns positions', async () => {
        const mockPositions = {
          positions: [
            {
              market: 'BTC_USDC_PERP',
              side: 'LONG',
              size: '1.5',
              entry_price: '50000',
              unrealized_pnl: '100',
              liquidation_price: '45000',
              leverage: '10',
            },
          ],
        };

        authMockClient.get.mockResolvedValue(mockPositions);

        const positions = await authAdapter.fetchPositions();

        expect(positions).toHaveLength(1);
      });

      test('fetchPositions filters by symbols', async () => {
        const mockPositions = {
          positions: [
            { market: 'BTC_USDC_PERP', side: 'LONG', size: '1.5', entry_price: '50000', unrealized_pnl: '100', liquidation_price: '45000', leverage: '10' },
            { market: 'ETH_USDC_PERP', side: 'SHORT', size: '10', entry_price: '3000', unrealized_pnl: '-50', liquidation_price: '3500', leverage: '5' },
          ],
        };

        authMockClient.get.mockResolvedValue(mockPositions);

        const positions = await authAdapter.fetchPositions(['BTC/USDC:USDC']);

        expect(positions).toHaveLength(1);
      });

      test('fetchPositions throws on invalid response', async () => {
        authMockClient.get.mockResolvedValue({ invalid: 'data' });

        await expect(authAdapter.fetchPositions()).rejects.toThrow(PerpDEXError);
      });

      test('fetchBalance returns balances', async () => {
        const mockBalance = {
          USDC: { available: '10000', locked: '500', staked: '0' },
          BTC: { available: '1.5', locked: '0.5', staked: '0' },
        };

        authMockClient.get.mockResolvedValue(mockBalance);

        const balances = await authAdapter.fetchBalance();

        expect(balances).toHaveLength(2);
        expect(balances.find(b => b.currency === 'USDC')).toBeDefined();
      });

      test('fetchBalance throws on invalid response', async () => {
        authMockClient.get.mockResolvedValue(null);

        await expect(authAdapter.fetchBalance()).rejects.toThrow(PerpDEXError);
      });

      test('fetchOpenOrders returns orders', async () => {
        const mockOrders = {
          orders: [
            {
              order_id: 'order-1',
              market: 'BTC_USDC_PERP',
              side: 'Bid',
              type: 'Limit',
              price: '50000',
              size: '0.1',
              filled_size: '0',
              status: 'New',
              time_in_force: 'GTC',
              created_at: Date.now(),
            },
          ],
        };

        authMockClient.get.mockResolvedValue(mockOrders);

        const orders = await authAdapter.fetchOpenOrders();

        expect(orders).toHaveLength(1);
      });

      test('fetchOpenOrders throws on invalid response', async () => {
        authMockClient.get.mockResolvedValue({ invalid: 'data' });

        await expect(authAdapter.fetchOpenOrders()).rejects.toThrow(PerpDEXError);
      });

      test('cancelAllOrders returns cancelled orders', async () => {
        const mockResponse = {
          orders: [
            { order_id: 'order-1', market: 'BTC_USDC_PERP', status: 'Cancelled', side: 'Bid', type: 'Limit', price: '50000', size: '0.1', filled_size: '0', time_in_force: 'GTC', created_at: Date.now() },
            { order_id: 'order-2', market: 'ETH_USDC_PERP', status: 'Cancelled', side: 'Ask', type: 'Limit', price: '3000', size: '1', filled_size: '0', time_in_force: 'GTC', created_at: Date.now() },
          ],
        };

        authMockClient.delete.mockResolvedValue(mockResponse);

        const orders = await authAdapter.cancelAllOrders();

        expect(orders).toHaveLength(2);
      });

      test('cancelAllOrders with symbol filter', async () => {
        const mockResponse = {
          orders: [{ order_id: 'order-1', market: 'BTC_USDC_PERP', status: 'Cancelled', side: 'Bid', type: 'Limit', price: '50000', size: '0.1', filled_size: '0', time_in_force: 'GTC', created_at: Date.now() }],
        };

        authMockClient.delete.mockResolvedValue(mockResponse);

        await authAdapter.cancelAllOrders('BTC/USDC:USDC');

        expect(authMockClient.delete).toHaveBeenCalledWith(
          '/api/v1/orders',
          expect.objectContaining({
            body: expect.objectContaining({ market: expect.any(String) }),
          })
        );
      });

      test('cancelAllOrders throws on invalid response', async () => {
        authMockClient.delete.mockResolvedValue({ invalid: 'data' });

        await expect(authAdapter.cancelAllOrders()).rejects.toThrow(PerpDEXError);
      });

      test('fetchOrderHistory returns history', async () => {
        const mockHistory = [
          { order_id: 'order-1', market: 'BTC_USDC_PERP', status: 'Filled', side: 'Bid', type: 'Limit', price: '50000', size: '0.1', filled_size: '0.1', time_in_force: 'GTC', created_at: Date.now() },
          { order_id: 'order-2', market: 'ETH_USDC_PERP', status: 'Cancelled', side: 'Ask', type: 'Limit', price: '3000', size: '1', filled_size: '0', time_in_force: 'GTC', created_at: Date.now() },
        ];

        authMockClient.get.mockResolvedValue(mockHistory);

        const history = await authAdapter.fetchOrderHistory();

        expect(history).toHaveLength(2);
      });

      test('fetchOrderHistory throws on invalid response', async () => {
        authMockClient.get.mockResolvedValue({ invalid: 'data' });

        await expect(authAdapter.fetchOrderHistory()).rejects.toThrow(PerpDEXError);
      });

      test('fetchMyTrades returns trades', async () => {
        const mockTrades = [
          { id: 'trade-1', symbol: 'BTC_USDC_PERP', price: '50000', quantity: '0.1', side: 'buy', time: Date.now(), isBuyerMaker: true },
        ];

        authMockClient.get.mockResolvedValue(mockTrades);

        const trades = await authAdapter.fetchMyTrades();

        expect(trades).toHaveLength(1);
      });

      test('fetchMyTrades throws on invalid response', async () => {
        authMockClient.get.mockResolvedValue({ invalid: 'data' });

        await expect(authAdapter.fetchMyTrades()).rejects.toThrow(PerpDEXError);
      });
    });
  });

  describe('symbol conversion', () => {
    test('converts unified symbol to exchange format', () => {
      const exchangeSymbol = adapter.symbolToExchange('BTC/USDC:USDC');
      expect(exchangeSymbol).toBeDefined();
      expect(typeof exchangeSymbol).toBe('string');
    });

    test('converts exchange symbol to unified format', () => {
      const unifiedSymbol = adapter.symbolFromExchange('BTC_USDC_PERP');
      expect(unifiedSymbol).toBeDefined();
      expect(typeof unifiedSymbol).toBe('string');
    });
  });
});

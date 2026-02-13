/**
 * ParadexAdapter Tests
 *
 * Tests for Paradex Exchange adapter
 */

import { ParadexAdapter } from '../../src/adapters/paradex/ParadexAdapter.js';
import { PerpDEXError } from '../../src/types/errors.js';

// Mock ParadexHTTPClient
jest.mock('../../src/adapters/paradex/ParadexHTTPClient.js', () => ({
  ParadexHTTPClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock ParadexAuth
jest.mock('../../src/adapters/paradex/ParadexAuth.js', () => ({
  ParadexAuth: jest.fn().mockImplementation((config) => ({
    hasCredentials: jest.fn().mockReturnValue(!!config.starkPrivateKey || !!config.apiKey),
    clearJWTToken: jest.fn(),
    getStarkPublicKey: jest.fn(),
  })),
}));

// Mock ParadexParaclearWrapper
jest.mock('../../src/adapters/paradex/ParadexParaclearWrapper.js', () => ({
  ParadexParaclearWrapper: jest.fn().mockImplementation(() => ({})),
}));

// Mock ParadexWebSocketWrapper
jest.mock('../../src/adapters/paradex/ParadexWebSocketWrapper.js', () => ({
  ParadexWebSocketWrapper: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

describe('ParadexAdapter', () => {
  let adapter: ParadexAdapter;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new ParadexAdapter();
    mockClient = (adapter as any).client;
  });

  describe('constructor', () => {
    test('creates adapter with default config', () => {
      const adapter = new ParadexAdapter();
      expect(adapter.id).toBe('paradex');
      expect(adapter.name).toBe('Paradex');
    });

    test('creates adapter with stark private key', () => {
      const adapter = new ParadexAdapter({
        starkPrivateKey: '0x1234567890abcdef',
      });
      expect(adapter).toBeInstanceOf(ParadexAdapter);
    });

    test('creates adapter with API credentials', () => {
      const adapter = new ParadexAdapter({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });
      expect(adapter).toBeInstanceOf(ParadexAdapter);
    });

    test('creates adapter for testnet', () => {
      const adapter = new ParadexAdapter({ testnet: true });
      expect(adapter).toBeInstanceOf(ParadexAdapter);
    });

    test('has expected features', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.fetchFundingRateHistory).toBe(true);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.watchMyTrades).toBe(true);
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
      expect(adapter.isReady).toBe(false);
    });
  });

  describe('fetchMarkets', () => {
    test('fetches and normalizes markets', async () => {
      const mockMarkets = {
        results: [
          {
            symbol: 'BTC-USD-PERP',
            base_currency: 'BTC',
            quote_currency: 'USD',
            settlement_currency: 'USDC',
            min_order_size: '0.001',
            tick_size: '0.1',
            step_size: '0.001',
            max_leverage: '50',
          },
          {
            symbol: 'ETH-USD-PERP',
            base_currency: 'ETH',
            quote_currency: 'USD',
            settlement_currency: 'USDC',
            min_order_size: '0.01',
            tick_size: '0.01',
            step_size: '0.01',
            max_leverage: '25',
          },
        ],
      };

      mockClient.get.mockResolvedValue(mockMarkets);

      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(2);
      expect(mockClient.get).toHaveBeenCalledWith('/markets');
    });

    test('handles legacy markets format', async () => {
      const mockMarkets = {
        markets: [
          {
            symbol: 'BTC-USD-PERP',
            base_currency: 'BTC',
            quote_currency: 'USD',
          },
        ],
      };

      mockClient.get.mockResolvedValue(mockMarkets);

      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(1);
    });

    test('throws on invalid response', async () => {
      mockClient.get.mockResolvedValue({ invalid: 'data' });

      await expect(adapter.fetchMarkets()).rejects.toThrow(PerpDEXError);
    });
  });

  describe('fetchTicker', () => {
    test('fetches ticker for symbol', async () => {
      const mockSummary = {
        results: [
          {
            symbol: 'BTC-USD-PERP',
            last_traded_price: '50000.00',
            price_change_rate_24h: '1.00',
            bid: '49999.00',
            ask: '50001.00',
            volume_24h: '1000.00',
            mark_price: '50000.50',
            underlying_price: '50000.00',
            open_interest: '500.00',
            funding_rate: '-0.0001',
            created_at: Date.now(),
          },
        ],
      };

      mockClient.get.mockResolvedValue(mockSummary);

      const ticker = await adapter.fetchTicker('BTC/USD:USDC');

      expect(ticker).toBeDefined();
      expect(mockClient.get).toHaveBeenCalledWith('/markets/summary?market=BTC-USD-PERP');
    });
  });

  describe('fetchOrderBook', () => {
    test('fetches order book', async () => {
      const mockOrderBook = {
        market: 'BTC-USD-PERP',
        bids: [
          ['50000.00', '1.5'],
          ['49999.00', '2.0'],
        ],
        asks: [
          ['50001.00', '1.0'],
          ['50002.00', '3.0'],
        ],
        timestamp: Date.now(),
      };

      mockClient.get.mockResolvedValue(mockOrderBook);

      const orderBook = await adapter.fetchOrderBook('BTC/USD:USDC');

      expect(orderBook).toBeDefined();
      expect(orderBook.bids).toBeDefined();
      expect(orderBook.asks).toBeDefined();
    });

    test('fetches order book with limit', async () => {
      const mockOrderBook = {
        market: 'BTC-USD-PERP',
        bids: [['50000.00', '1.5']],
        asks: [['50001.00', '1.0']],
        timestamp: Date.now(),
      };

      mockClient.get.mockResolvedValue(mockOrderBook);

      await adapter.fetchOrderBook('BTC/USD:USDC', { limit: 10 });

      expect(mockClient.get).toHaveBeenCalledWith('/orderbook/BTC-USD-PERP?depth=10');
    });
  });

  describe('fetchTrades', () => {
    test('fetches recent trades', async () => {
      const mockTrades = {
        results: [
          {
            id: 'trade-1',
            market: 'BTC-USDC-PERP',
            price: '50000.00',
            size: '0.1',
            side: 'BUY',
            created_at: Date.now(),
          },
          {
            id: 'trade-2',
            market: 'BTC-USDC-PERP',
            price: '50001.00',
            size: '0.2',
            side: 'SELL',
            created_at: Date.now(),
          },
        ],
      };

      mockClient.get.mockResolvedValue(mockTrades);

      const trades = await adapter.fetchTrades('BTC/USD:USDC');

      expect(trades).toHaveLength(2);
    });

    test('throws on invalid trades response', async () => {
      mockClient.get.mockResolvedValue({ invalid: 'data' });

      await expect(adapter.fetchTrades('BTC/USD:USDC')).rejects.toThrow(PerpDEXError);
    });

    test('fetches trades with limit', async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      await adapter.fetchTrades('BTC/USD:USDC', { limit: 50 });

      expect(mockClient.get).toHaveBeenCalledWith('/trades?market=BTC-USD-PERP&limit=50');
    });
  });

  describe('fetchFundingRate', () => {
    test('fetches current funding rate', async () => {
      const mockFunding = {
        results: [
          {
            market: 'BTC-USDC-PERP',
            funding_rate: '0.0001',
            funding_premium: '50000.50',
            created_at: Date.now(),
          },
        ],
      };

      mockClient.get.mockResolvedValue(mockFunding);

      const fundingRate = await adapter.fetchFundingRate('BTC/USD:USDC');

      expect(fundingRate).toBeDefined();
    });
  });

  describe('fetchFundingRateHistory', () => {
    test('fetches funding rate history', async () => {
      const mockHistory = {
        results: [
          {
            market: 'BTC-USDC-PERP',
            funding_rate: '0.0001',
            funding_premium: '50000.50',
            created_at: Date.now() - 3600000,
          },
          {
            market: 'BTC-USDC-PERP',
            funding_rate: '0.0002',
            funding_premium: '50100.50',
            created_at: Date.now(),
          },
        ],
      };

      mockClient.get.mockResolvedValue(mockHistory);

      const history = await adapter.fetchFundingRateHistory('BTC/USD:USDC');

      expect(history).toHaveLength(2);
    });

    test('fetches with since and limit parameters', async () => {
      const since = Date.now() - 86400000;
      mockClient.get.mockResolvedValue({ results: [] });

      await adapter.fetchFundingRateHistory('BTC/USD:USDC', since, 10);

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('start_at=')
      );
      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('page_size=10')
      );
    });

    test('throws on invalid response', async () => {
      mockClient.get.mockResolvedValue({ invalid: 'data' });

      await expect(adapter.fetchFundingRateHistory('BTC/USD:USDC')).rejects.toThrow(PerpDEXError);
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
            symbol: 'BTC/USD:USDC',
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
        await expect(adapter.setLeverage('BTC/USD:USDC', 10)).rejects.toMatchObject({
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
      let authAdapter: ParadexAdapter;
      let authMockClient: any;

      beforeEach(() => {
        authAdapter = new ParadexAdapter({
          starkPrivateKey: '0x1234567890abcdef',
        });
        authMockClient = (authAdapter as any).client;
      });

      test('fetchPositions returns positions', async () => {
        const mockPositions = {
          positions: [
            {
              market: 'BTC-USD-PERP',
              side: 'LONG',
              size: '1.5',
              avg_entry_price: '50000',
              unrealized_pnl: '100',
              liquidation_price: '45000',
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
            {
              market: 'BTC-USD-PERP',
              side: 'LONG',
              size: '1.5',
              entry_price: '50000',
              mark_price: '50100',
              liquidation_price: '45000',
              unrealized_pnl: '100',
              realized_pnl: '50',
              margin: '5000',
              leverage: '10',
              last_updated: Date.now(),
            },
            {
              market: 'ETH-USD-PERP',
              side: 'SHORT',
              size: '10',
              entry_price: '3000',
              mark_price: '2950',
              liquidation_price: '3500',
              unrealized_pnl: '500',
              realized_pnl: '100',
              margin: '3000',
              leverage: '10',
              last_updated: Date.now(),
            },
          ],
        };

        authMockClient.get.mockResolvedValue(mockPositions);

        // BTC-USD-PERP normalizes to BTC/USD:USD
        const positions = await authAdapter.fetchPositions(['BTC/USD:USD']);

        expect(positions).toHaveLength(1);
      });

      test('fetchPositions throws on invalid response', async () => {
        authMockClient.get.mockResolvedValue({ invalid: 'data' });

        await expect(authAdapter.fetchPositions()).rejects.toThrow(PerpDEXError);
      });

      test('fetchBalance returns balances', async () => {
        const mockBalance = {
          balances: [
            { currency: 'USDC', free: '10000', used: '500', total: '10500' },
          ],
        };

        authMockClient.get.mockResolvedValue(mockBalance);

        const balances = await authAdapter.fetchBalance();

        expect(balances).toHaveLength(1);
      });

      test('fetchBalance throws on invalid response', async () => {
        authMockClient.get.mockResolvedValue({ invalid: 'data' });

        await expect(authAdapter.fetchBalance()).rejects.toThrow(PerpDEXError);
      });

      test('fetchOpenOrders returns orders', async () => {
        const mockOrders = {
          orders: [
            {
              id: 'order-1',
              market: 'BTC-USD-PERP',
              side: 'BUY',
              type: 'LIMIT',
              price: '50000',
              size: '0.1',
              status: 'OPEN',
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
            {
              id: 'order-1',
              client_id: 'client-1',
              market: 'BTC-USD-PERP',
              type: 'LIMIT',
              side: 'BUY',
              size: '0.1',
              price: '50000',
              filled_size: '0',
              status: 'CANCELLED',
              time_in_force: 'GTC',
              post_only: false,
              reduce_only: false,
              created_at: Date.now(),
              updated_at: Date.now(),
            },
            {
              id: 'order-2',
              client_id: 'client-2',
              market: 'ETH-USD-PERP',
              type: 'LIMIT',
              side: 'SELL',
              size: '1',
              price: '3000',
              filled_size: '0',
              status: 'CANCELLED',
              time_in_force: 'GTC',
              post_only: false,
              reduce_only: false,
              created_at: Date.now(),
              updated_at: Date.now(),
            },
          ],
        };

        authMockClient.delete.mockResolvedValue(mockResponse);

        const orders = await authAdapter.cancelAllOrders();

        expect(orders).toHaveLength(2);
      });

      test('cancelAllOrders with symbol filter', async () => {
        const mockResponse = {
          orders: [
            {
              id: 'order-1',
              client_id: 'client-1',
              market: 'BTC-USD-PERP',
              type: 'LIMIT',
              side: 'BUY',
              size: '0.1',
              price: '50000',
              filled_size: '0',
              status: 'CANCELLED',
              time_in_force: 'GTC',
              post_only: false,
              reduce_only: false,
              created_at: Date.now(),
              updated_at: Date.now(),
            },
          ],
        };

        authMockClient.delete.mockResolvedValue(mockResponse);

        await authAdapter.cancelAllOrders('BTC/USD:USD');

        expect(authMockClient.delete).toHaveBeenCalledWith('/orders', {
          market: 'BTC-USD-PERP',
        });
      });

      test('cancelAllOrders throws on invalid response', async () => {
        authMockClient.delete.mockResolvedValue({ invalid: 'data' });

        await expect(authAdapter.cancelAllOrders()).rejects.toThrow(PerpDEXError);
      });

      test('fetchOrderHistory returns history', async () => {
        const mockHistory = {
          results: [
            {
              id: 'order-1',
              client_id: 'client-1',
              market: 'BTC-USD-PERP',
              type: 'LIMIT',
              side: 'BUY',
              size: '0.1',
              price: '50000',
              filled_size: '0.1',
              avg_fill_price: '49950',
              status: 'FILLED',
              time_in_force: 'GTC',
              post_only: false,
              reduce_only: false,
              created_at: Date.now() - 3600000,
              updated_at: Date.now(),
            },
            {
              id: 'order-2',
              client_id: 'client-2',
              market: 'ETH-USD-PERP',
              type: 'LIMIT',
              side: 'SELL',
              size: '1',
              price: '3000',
              filled_size: '0',
              status: 'CANCELLED',
              time_in_force: 'GTC',
              post_only: false,
              reduce_only: false,
              created_at: Date.now() - 7200000,
              updated_at: Date.now() - 3600000,
            },
          ],
        };

        authMockClient.get.mockResolvedValue(mockHistory);

        const history = await authAdapter.fetchOrderHistory();

        expect(history).toHaveLength(2);
      });

      test('fetchOrderHistory throws on invalid response', async () => {
        authMockClient.get.mockResolvedValue({ invalid: 'data' });

        await expect(authAdapter.fetchOrderHistory()).rejects.toThrow(PerpDEXError);
      });

      test('fetchMyTrades returns trades', async () => {
        const mockTrades = {
          results: [
            {
              id: 'trade-1',
              market: 'BTC-USD-PERP',
              side: 'BUY',
              price: '50000',
              size: '0.1',
              timestamp: Date.now(),
            },
          ],
        };

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
      const exchangeSymbol = adapter.symbolToExchange('BTC/USD:USDC');
      expect(exchangeSymbol).toBeDefined();
      expect(typeof exchangeSymbol).toBe('string');
    });

    test('converts exchange symbol to unified format', () => {
      const unifiedSymbol = adapter.symbolFromExchange('BTC-USD-PERP');
      expect(unifiedSymbol).toBeDefined();
      expect(typeof unifiedSymbol).toBe('string');
    });
  });
});

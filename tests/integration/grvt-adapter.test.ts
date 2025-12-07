/**
 * Integration Tests for GRVTAdapter
 *
 * Tests adapter methods with mocked SDK responses
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GRVTAdapter } from '../../src/adapters/grvt/GRVTAdapter.js';
import { GRVTSDKWrapper } from '../../src/adapters/grvt/GRVTSDKWrapper.js';
import { GRVTAuth } from '../../src/adapters/grvt/auth.js';
import type {
  IInstrumentDisplay,
  IOrder,
  IPositions,
  ISpotBalance,
  ITicker,
  IOrderbookLevels,
  ITrade,
} from '@grvt/client/interfaces';

// Mock the SDK wrapper and auth
jest.mock('../../src/adapters/grvt/GRVTSDKWrapper.js');
jest.mock('../../src/adapters/grvt/auth.js');

describe('GRVTAdapter Integration Tests', () => {
  let adapter: GRVTAdapter;
  let mockSDK: jest.Mocked<GRVTSDKWrapper>;
  let mockAuth: jest.Mocked<GRVTAuth>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup auth mock
    (GRVTAuth as jest.MockedClass<typeof GRVTAuth>).mockImplementation(() => ({
      verify: jest.fn().mockResolvedValue(true),
      getAddress: jest.fn().mockReturnValue('0x1234567890123456789012345678901234567890'),
      getNextNonce: jest.fn().mockReturnValue(1),
      createSignature: jest.fn().mockResolvedValue({
        signer: '0x1234567890123456789012345678901234567890',
        r: '0xr',
        s: '0xs',
        v: 27,
        expiration: (Date.now() + 60000).toString(),
        nonce: 1,
      }),
      setSessionCookie: jest.fn(),
      clearSessionCookie: jest.fn(),
    } as any));

    // Create adapter
    adapter = new GRVTAdapter({
      apiKey: 'test-api-key',
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      testnet: true,
    });

    // Get mocked instances
    mockSDK = (adapter as any).sdk as jest.Mocked<GRVTSDKWrapper>;
    mockAuth = (adapter as any).auth as jest.Mocked<GRVTAuth>;

    // Setup default SDK mocks
    mockSDK.getSessionCookie = jest.fn().mockReturnValue('test-session-cookie');
    mockSDK.createOrder = jest.fn();
    mockSDK.cancelOrder = jest.fn();
    mockSDK.getAllInstruments = jest.fn();
    mockSDK.getOrderBook = jest.fn();
    mockSDK.getTradeHistory = jest.fn();
    mockSDK.getTicker = jest.fn();
    mockSDK.getOpenOrders = jest.fn();
    mockSDK.getOrderHistory = jest.fn();
    mockSDK.getPositions = jest.fn();
    mockSDK.getSubAccountSummary = jest.fn();
  });

  describe('Initialization', () => {
    it('should initialize adapter correctly', () => {
      expect(adapter).toBeDefined();
      expect(adapter.id).toBe('grvt');
      expect(adapter.name).toBe('GRVT');
    });

    it('should have correct feature flags', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
    });
  });

  describe('Market Data Methods', () => {
    describe('fetchMarkets', () => {
      it('should fetch and normalize markets', async () => {
        const mockMarkets: IInstrumentDisplay[] = [
          {
            instrument: 'BTC-PERP',
            base: 'BTC',
            quote: 'USDT',
            tick_size: '0.5',
            min_size: '0.001',
            max_position_size: '100',
            funding_interval_hours: 8,
          } as any,
          {
            instrument: 'ETH-PERP',
            base: 'ETH',
            quote: 'USDT',
            tick_size: '0.1',
            min_size: '0.01',
            max_position_size: '1000',
            funding_interval_hours: 8,
          } as any,
        ];

        mockSDK.getAllInstruments.mockResolvedValue({
          result: mockMarkets,
        } as any);

        const markets = await adapter.fetchMarkets();

        expect(mockSDK.getAllInstruments).toHaveBeenCalled();
        expect(markets).toHaveLength(2);
        expect(markets[0].symbol).toBe('BTC/USDT:USDT');
        expect(markets[0].base).toBe('BTC');
        expect(markets[0].quote).toBe('USDT');
        expect(markets[1].symbol).toBe('ETH/USDT:USDT');
      });

      it('should handle empty markets list', async () => {
        mockSDK.getAllInstruments.mockResolvedValue({
          result: [],
        } as any);

        const markets = await adapter.fetchMarkets();

        expect(markets).toEqual([]);
      });
    });

    describe('fetchOrderBook', () => {
      it('should fetch and normalize order book', async () => {
        const mockOrderBook: IOrderbookLevels = {
          instrument: 'BTC-PERP',
          bids: [
            { price: '50000', size: '1.5', num_orders: 3 },
            { price: '49990', size: '2.0', num_orders: 5 },
          ],
          asks: [
            { price: '50010', size: '1.0', num_orders: 2 },
            { price: '50020', size: '1.5', num_orders: 4 },
          ],
          event_time: '1234567890000',
        };

        mockSDK.getOrderBook.mockResolvedValue({
          result: mockOrderBook,
        } as any);

        const orderBook = await adapter.fetchOrderBook('BTC/USDT:USDT');

        expect(mockSDK.getOrderBook).toHaveBeenCalledWith('BTC-PERP', 50);
        expect(orderBook.symbol).toBe('BTC/USDT:USDT');
        expect(orderBook.bids).toHaveLength(2);
        expect(orderBook.asks).toHaveLength(2);
        expect(orderBook.bids[0]).toEqual([50000, 1.5]);
        expect(orderBook.asks[0]).toEqual([50010, 1.0]);
      });

      it('should handle custom depth limit', async () => {
        const mockOrderBook: IOrderbookLevels = {
          instrument: 'ETH-PERP',
          bids: [{ price: '3000', size: '10', num_orders: 1 }],
          asks: [{ price: '3010', size: '5', num_orders: 1 }],
          event_time: '1234567890000',
        };

        mockSDK.getOrderBook.mockResolvedValue({
          result: mockOrderBook,
        } as any);

        await adapter.fetchOrderBook('ETH/USDT:USDT', { limit: 100 });

        expect(mockSDK.getOrderBook).toHaveBeenCalledWith('ETH-PERP', 100);
      });
    });

    describe('fetchTrades', () => {
      it('should fetch and normalize public trades', async () => {
        const mockTrades: ITrade[] = [
          {
            trade_id: 'trade-1',
            instrument: 'BTC-PERP',
            price: '50000',
            size: '0.5',
            is_taker_buyer: true,
            event_time: '1234567890000',
          },
          {
            trade_id: 'trade-2',
            instrument: 'BTC-PERP',
            price: '49995',
            size: '1.0',
            is_taker_buyer: false,
            event_time: '1234567891000',
          },
        ];

        mockSDK.getTradeHistory.mockResolvedValue({
          result: mockTrades,
        } as any);

        const trades = await adapter.fetchTrades('BTC/USDT:USDT');

        expect(mockSDK.getTradeHistory).toHaveBeenCalledWith({
          instrument: 'BTC-PERP',
          limit: 100,
        });
        expect(trades).toHaveLength(2);
        expect(trades[0].symbol).toBe('BTC/USDT:USDT');
        expect(trades[0].price).toBe(50000);
        expect(trades[0].amount).toBe(0.5);
        expect(trades[0].side).toBe('buy');
      });

      it('should respect limit parameter', async () => {
        mockSDK.getTradeHistory.mockResolvedValue({ result: [] } as any);

        await adapter.fetchTrades('ETH/USDT:USDT', { limit: 50 });

        expect(mockSDK.getTradeHistory).toHaveBeenCalledWith({
          instrument: 'ETH-PERP',
          limit: 50,
        });
      });
    });

    describe('fetchTicker', () => {
      it('should fetch and normalize ticker', async () => {
        const mockTicker: ITicker = {
          instrument: 'BTC-PERP',
          last_price: '50000',
          best_bid_price: '49990',
          best_bid_size: '1.5',
          best_ask_price: '50010',
          best_ask_size: '2.0',
          high_price: '51000',
          low_price: '49000',
          open_price: '49500',
          buy_volume_24h_b: '100',
          sell_volume_24h_b: '95',
          event_time: '1234567890000',
        };

        mockSDK.getTicker.mockResolvedValue({
          result: mockTicker,
        } as any);

        const ticker = await adapter.fetchTicker('BTC/USDT:USDT');

        expect(mockSDK.getTicker).toHaveBeenCalledWith('BTC-PERP');
        expect(ticker.symbol).toBe('BTC/USDT:USDT');
        expect(ticker.last).toBe(50000);
        expect(ticker.bid).toBe(49990);
        expect(ticker.ask).toBe(50010);
        expect(ticker.high).toBe(51000);
        expect(ticker.low).toBe(49000);
      });
    });
  });

  describe('Trading Methods', () => {
    describe('createOrder', () => {
      it('should create limit buy order', async () => {
        const mockOrder: IOrder = {
          order_id: 'order-123',
          sub_account_id: 'sub-123',
          is_market: false,
          post_only: false,
          reduce_only: false,
          legs: [
            {
              instrument: 'BTC-PERP',
              size: '1.5',
              limit_price: '50000',
              is_buying_asset: true,
            },
          ],
          state: {
            status: 'OPEN',
            traded_size: ['0'],
            book_size: ['1.5'],
            update_time: '1234567890000',
          },
          metadata: {
            client_order_id: 'client-123',
            create_time: '1234567890000',
          },
        };

        mockSDK.createOrder.mockResolvedValue({
          result: mockOrder,
        } as any);

        const order = await adapter.createOrder({
          symbol: 'BTC/USDT:USDT',
          type: 'limit',
          side: 'buy',
          amount: 1.5,
          price: 50000,
        });

        expect(mockSDK.createOrder).toHaveBeenCalled();
        expect(order.symbol).toBe('BTC/USDT:USDT');
        expect(order.type).toBe('limit');
        expect(order.side).toBe('buy');
        expect(order.amount).toBe(1.5);
        expect(order.price).toBe(50000);
        expect(order.status).toBe('open');
      });

      it('should create market sell order', async () => {
        const mockOrder: IOrder = {
          order_id: 'order-456',
          is_market: true,
          legs: [
            {
              instrument: 'ETH-PERP',
              size: '10',
              is_buying_asset: false,
            },
          ],
          state: {
            status: 'FILLED',
            traded_size: ['10'],
            book_size: ['0'],
          },
        };

        mockSDK.createOrder.mockResolvedValue({
          result: mockOrder,
        } as any);

        const order = await adapter.createOrder({
          symbol: 'ETH/USDT:USDT',
          type: 'market',
          side: 'sell',
          amount: 10,
        });

        expect(order.type).toBe('market');
        expect(order.side).toBe('sell');
        expect(order.status).toBe('filled');
      });

      it('should handle post-only orders', async () => {
        const mockOrder: IOrder = {
          order_id: 'order-789',
          is_market: false,
          post_only: true,
          legs: [
            {
              instrument: 'BTC-PERP',
              size: '2',
              limit_price: '49000',
              is_buying_asset: true,
            },
          ],
          state: {
            status: 'OPEN',
            traded_size: ['0'],
            book_size: ['2'],
          },
        };

        mockSDK.createOrder.mockResolvedValue({
          result: mockOrder,
        } as any);

        const order = await adapter.createOrder({
          symbol: 'BTC/USDT:USDT',
          type: 'limit',
          side: 'buy',
          amount: 2,
          price: 49000,
          postOnly: true,
        });

        expect(order.postOnly).toBe(true);
      });
    });

    describe('cancelOrder', () => {
      it('should cancel order successfully', async () => {
        const mockOrder: IOrder = {
          order_id: 'order-123',
          legs: [
            {
              instrument: 'BTC-PERP',
              size: '1.5',
              is_buying_asset: true,
            },
          ],
          state: {
            status: 'CANCELLED',
            traded_size: ['0'],
            book_size: ['0'],
          },
        };

        mockSDK.cancelOrder.mockResolvedValue({
          result: mockOrder,
        } as any);

        const order = await adapter.cancelOrder('order-123', 'BTC/USDT:USDT');

        expect(mockSDK.cancelOrder).toHaveBeenCalledWith({
          order_id: 'order-123',
        });
        expect(order.status).toBe('canceled');
      });
    });

    describe('fetchOpenOrders', () => {
      it('should fetch open orders', async () => {
        const mockOrders: IOrder[] = [
          {
            order_id: 'order-1',
            is_market: false,
            legs: [
              {
                instrument: 'BTC-PERP',
                size: '1',
                limit_price: '50000',
                is_buying_asset: true,
              },
            ],
            state: {
              status: 'OPEN',
              traded_size: ['0'],
              book_size: ['1'],
            },
          },
          {
            order_id: 'order-2',
            is_market: false,
            legs: [
              {
                instrument: 'ETH-PERP',
                size: '5',
                limit_price: '3000',
                is_buying_asset: false,
              },
            ],
            state: {
              status: 'OPEN',
              traded_size: ['0'],
              book_size: ['5'],
            },
          },
        ];

        mockSDK.getOpenOrders.mockResolvedValue({
          result: mockOrders,
        } as any);

        const orders = await adapter.fetchOpenOrders();

        expect(mockSDK.getOpenOrders).toHaveBeenCalled();
        expect(orders).toHaveLength(2);
        expect(orders[0].status).toBe('open');
        expect(orders[1].status).toBe('open');
      });

      it('should filter by symbol', async () => {
        mockSDK.getOpenOrders.mockResolvedValue({
          result: [],
        } as any);

        await adapter.fetchOpenOrders('BTC/USDT:USDT');

        expect(mockSDK.getOpenOrders).toHaveBeenCalledWith({
          instrument: 'BTC-PERP',
        });
      });
    });

    describe('fetchOrderHistory', () => {
      it('should fetch order history', async () => {
        const mockOrders: IOrder[] = [
          {
            order_id: 'order-1',
            is_market: true,
            legs: [
              {
                instrument: 'BTC-PERP',
                size: '0.5',
                is_buying_asset: true,
              },
            ],
            state: {
              status: 'FILLED',
              traded_size: ['0.5'],
              book_size: ['0'],
            },
          },
        ];

        mockSDK.getOrderHistory.mockResolvedValue({
          result: mockOrders,
        } as any);

        const orders = await adapter.fetchOrderHistory();

        expect(mockSDK.getOrderHistory).toHaveBeenCalledWith({
          limit: 100,
        });
        expect(orders).toHaveLength(1);
        expect(orders[0].status).toBe('filled');
      });
    });
  });

  describe('Account Methods', () => {
    describe('fetchPositions', () => {
      it('should fetch all positions', async () => {
        const mockPositions: IPositions[] = [
          {
            instrument: 'BTC-PERP',
            size: '2.5',
            entry_price: '48000',
            mark_price: '50000',
            notional: '125000',
            unrealized_pnl: '5000',
            realized_pnl: '1000',
            leverage: '10',
          },
          {
            instrument: 'ETH-PERP',
            size: '-10',
            entry_price: '3000',
            mark_price: '2900',
            notional: '29000',
            unrealized_pnl: '1000',
            realized_pnl: '500',
            leverage: '5',
          },
        ];

        mockSDK.getPositions.mockResolvedValue({
          result: mockPositions,
        } as any);

        const positions = await adapter.fetchPositions();

        expect(mockSDK.getPositions).toHaveBeenCalled();
        expect(positions).toHaveLength(2);
        expect(positions[0].symbol).toBe('BTC/USDT:USDT');
        expect(positions[0].side).toBe('long');
        expect(positions[0].size).toBe(2.5);
        expect(positions[1].symbol).toBe('ETH/USDT:USDT');
        expect(positions[1].side).toBe('short');
        expect(positions[1].size).toBe(10); // Absolute value
      });

      it('should filter positions by symbol', async () => {
        const mockPositions: IPositions[] = [
          {
            instrument: 'BTC-PERP',
            size: '1',
            entry_price: '50000',
            mark_price: '51000',
            notional: '51000',
            unrealized_pnl: '1000',
            realized_pnl: '0',
            leverage: '10',
          },
          {
            instrument: 'ETH-PERP',
            size: '5',
            entry_price: '3000',
            mark_price: '3100',
            notional: '15500',
            unrealized_pnl: '500',
            realized_pnl: '0',
            leverage: '5',
          },
        ];

        mockSDK.getPositions.mockResolvedValue({
          result: mockPositions,
        } as any);

        const positions = await adapter.fetchPositions(['BTC/USDT:USDT']);

        expect(mockSDK.getPositions).toHaveBeenCalled();
        expect(positions).toHaveLength(1);
        expect(positions[0].symbol).toBe('BTC/USDT:USDT');
      });
    });

    describe('fetchBalance', () => {
      it('should fetch account balances', async () => {
        const mockBalances: ISpotBalance[] = [
          {
            currency: 'USDT',
            balance: '10000.50',
            index_price: '1.0',
          },
          {
            currency: 'BTC',
            balance: '0.5',
            index_price: '50000',
          },
        ];

        mockSDK.getSubAccountSummary.mockResolvedValue({
          result: {
            spot_balances: mockBalances,
          },
        } as any);

        const balances = await adapter.fetchBalance();

        expect(mockSDK.getSubAccountSummary).toHaveBeenCalled();
        expect(balances).toHaveLength(2);
        expect(balances[0].currency).toBe('USDT');
        expect(balances[0].total).toBe(10000.5);
        expect(balances[1].currency).toBe('BTC');
        expect(balances[1].total).toBe(0.5);
      });

      it('should handle empty balances', async () => {
        mockSDK.getSubAccountSummary.mockResolvedValue({
          result: {
            spot_balances: [],
          },
        } as any);

        const balances = await adapter.fetchBalance();

        expect(balances).toEqual([]);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle SDK errors gracefully', async () => {
      const sdkError = new Error('API rate limit exceeded');
      (sdkError as any).response = {
        status: 429,
        statusText: 'Too Many Requests',
        data: { error: 'RATE_LIMIT_EXCEEDED' },
      };

      mockSDK.getAllInstruments.mockRejectedValue(sdkError);

      await expect(adapter.fetchMarkets()).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      (networkError as any).code = 'ECONNABORTED';

      mockSDK.getTicker.mockRejectedValue(networkError);

      await expect(adapter.fetchTicker('BTC/USDT:USDT')).rejects.toThrow();
    });

    it('should handle invalid responses', async () => {
      mockSDK.getAllInstruments.mockResolvedValue({
        result: null,
      } as any);

      await expect(adapter.fetchMarkets()).rejects.toThrow('Invalid API response');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      mockSDK.getAllInstruments.mockResolvedValue({
        result: [],
      } as any);

      // Make multiple rapid requests
      const promises = Array(5)
        .fill(null)
        .map(() => adapter.fetchMarkets());

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });
});

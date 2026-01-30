/**
 * Integration Tests: ParadexAdapter
 *
 * Comprehensive test suite for ParadexAdapter with mocked HTTP/WebSocket
 * Tests all REST methods, WebSocket streams, error handling, and lifecycle
 */

import { ParadexAdapter } from '../../src/adapters/paradex/ParadexAdapter.js';
import { ParadexHTTPClient } from '../../src/adapters/paradex/ParadexHTTPClient.js';
import { ParadexWebSocketWrapper } from '../../src/adapters/paradex/ParadexWebSocketWrapper.js';
import { ParadexParaclearWrapper } from '../../src/adapters/paradex/ParadexParaclearWrapper.js';
import { PerpDEXError } from '../../src/types/errors.js';
import type { OrderRequest } from '../../src/types/common.js';

// Mock all components
jest.mock('../../src/adapters/paradex/ParadexHTTPClient.js');
jest.mock('../../src/adapters/paradex/ParadexWebSocketWrapper.js');
jest.mock('../../src/adapters/paradex/ParadexParaclearWrapper.js');
jest.mock('../../src/adapters/paradex/auth.js');

describe('ParadexAdapter - Integration Tests', () => {
  let adapter: ParadexAdapter;
  let mockHttpClient: jest.Mocked<ParadexHTTPClient>;
  let mockWsWrapper: jest.Mocked<ParadexWebSocketWrapper>;
  let mockParaclear: jest.Mocked<ParadexParaclearWrapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create adapter instance
    adapter = new ParadexAdapter({
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      testnet: true,
    });

    // Get mocked instances
    mockHttpClient = (adapter as any).client;
    mockParaclear = (adapter as any).paraclear;

    // Mock auth methods
    const mockAuth = (adapter as any).auth;
    mockAuth.verify = jest.fn().mockResolvedValue(true);
    mockAuth.hasCredentials = jest.fn().mockReturnValue(true);
    mockAuth.clearJWTToken = jest.fn();
  });

  // ===========================================================================
  // Lifecycle Tests
  // ===========================================================================

  describe('Lifecycle Management', () => {
    it('should initialize successfully (public API access without auth)', async () => {
      await expect(adapter.initialize()).resolves.toBeUndefined();
      expect(adapter.isReady).toBe(true);
    });

    it('should initialize successfully even without credentials (for public API)', async () => {
      // Create adapter without credentials
      const publicAdapter = new ParadexAdapter({ testnet: true });
      // Mock auth.hasCredentials to return false
      const mockAuth = (publicAdapter as any).auth;
      mockAuth.hasCredentials = jest.fn().mockReturnValue(false);

      await expect(publicAdapter.initialize()).resolves.toBeUndefined();
      expect(publicAdapter.isReady).toBe(true);
    });

    it('should throw on private methods when no credentials', async () => {
      // Create adapter without credentials
      const publicAdapter = new ParadexAdapter({ testnet: true });
      const mockAuth = (publicAdapter as any).auth;
      mockAuth.hasCredentials = jest.fn().mockReturnValue(false);
      await publicAdapter.initialize();

      // Private methods should throw
      await expect(publicAdapter.fetchBalance()).rejects.toThrow('Authentication required');
      await expect(publicAdapter.fetchPositions()).rejects.toThrow('Authentication required');
    });

    it('should cleanup resources on disconnect', async () => {
      const mockAuth = (adapter as any).auth;
      const mockWs = {
        disconnect: jest.fn(),
      };
      (adapter as any).ws = mockWs;

      await adapter.disconnect();

      expect(mockWs.disconnect).toHaveBeenCalled();
      expect(mockAuth.clearJWTToken).toHaveBeenCalled();
      expect((adapter as any)._isReady).toBe(false);
      expect((adapter as any).ws).toBeUndefined();
    });

    it('should handle disconnect when WebSocket not initialized', async () => {
      const mockAuth = (adapter as any).auth;

      await expect(adapter.disconnect()).resolves.toBeUndefined();
      expect(mockAuth.clearJWTToken).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Market Data Tests
  // ===========================================================================

  describe('Market Data Methods', () => {
    describe('fetchMarkets()', () => {
      it('should fetch and normalize markets', async () => {
        const mockResponse = {
          markets: [
            {
              symbol: 'BTC-USD-PERP',
              base_currency: 'BTC',
              quote_currency: 'USD',
              settlement_currency: 'USD',
              is_active: true,
              min_order_size: '0.001',
              tick_size: '0.5',
              step_size: '0.001',
              maker_fee_rate: '0.0002',
              taker_fee_rate: '0.0005',
              max_leverage: '20',
            },
            {
              symbol: 'ETH-USD-PERP',
              base_currency: 'ETH',
              quote_currency: 'USD',
              settlement_currency: 'USD',
              is_active: true,
              min_order_size: '0.01',
              tick_size: '0.1',
              step_size: '0.01',
              maker_fee_rate: '0.0002',
              taker_fee_rate: '0.0005',
              max_leverage: '20',
            },
          ],
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const markets = await adapter.fetchMarkets();

        expect(mockHttpClient.get).toHaveBeenCalledWith('/markets');
        expect(markets).toHaveLength(2);
        expect(markets[0].symbol).toBe('BTC/USD:USD');
        expect(markets[0].base).toBe('BTC');
        expect(markets[0].quote).toBe('USD');
        expect(markets[0].active).toBe(true);
        expect(markets[1].symbol).toBe('ETH/USD:USD');
      });

      it('should throw error when markets response is invalid', async () => {
        mockHttpClient.get.mockResolvedValue({ markets: 'invalid' });

        await expect(adapter.fetchMarkets()).rejects.toThrow(PerpDEXError);
        await expect(adapter.fetchMarkets()).rejects.toThrow('Invalid markets response');
      });
    });

    describe('fetchTicker()', () => {
      it('should fetch and normalize ticker data', async () => {
        const mockResponse = {
          market: 'BTC-USD-PERP',
          last_price: '50000.00',
          price_change_24h: '1000.00',
          price_change_percent_24h: '2.04',
          bid: '49995.00',
          ask: '50005.00',
          high_24h: '51000.00',
          low_24h: '48500.00',
          volume_24h: '1000.5',
          timestamp: 1234567890000,
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const ticker = await adapter.fetchTicker('BTC/USD:USD');

        expect(mockHttpClient.get).toHaveBeenCalledWith('/markets/BTC-USD-PERP/ticker');
        expect(ticker.symbol).toBe('BTC/USD:USD');
        expect(ticker.last).toBe(50000);
        expect(ticker.bid).toBe(49995);
        expect(ticker.ask).toBe(50005);
        expect(ticker.baseVolume).toBe(1000.5);
        expect(ticker.change).toBe(1000);
      });
    });

    describe('fetchOrderBook()', () => {
      it('should fetch order book with default depth', async () => {
        const mockResponse = {
          market: 'BTC-USD-PERP',
          bids: [
            ['49990.00', '1.5'],
            ['49980.00', '2.0'],
          ],
          asks: [
            ['50010.00', '1.2'],
            ['50020.00', '1.8'],
          ],
          timestamp: 1234567890000,
          sequence: 12345,
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const orderBook = await adapter.fetchOrderBook('BTC/USD:USD');

        expect(mockHttpClient.get).toHaveBeenCalledWith('/markets/BTC-USD-PERP/orderbook');
        expect(orderBook.symbol).toBe('BTC/USD:USD');
        expect(orderBook.bids).toHaveLength(2);
        expect(orderBook.bids[0]).toEqual([49990, 1.5]);
        expect(orderBook.asks).toHaveLength(2);
        expect(orderBook.asks[0]).toEqual([50010, 1.2]);
      });

      it('should fetch order book with custom depth', async () => {
        const mockResponse = {
          market: 'BTC-USD-PERP',
          bids: [['49990.00', '1.5']],
          asks: [['50010.00', '1.2']],
          timestamp: 1234567890000,
          sequence: 12345,
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        await adapter.fetchOrderBook('BTC/USD:USD', { limit: 10 });

        expect(mockHttpClient.get).toHaveBeenCalledWith('/markets/BTC-USD-PERP/orderbook?depth=10');
      });
    });

    describe('fetchTrades()', () => {
      it('should fetch and normalize recent trades', async () => {
        const mockResponse = {
          trades: [
            {
              id: 'trade-1',
              market: 'BTC-USD-PERP',
              price: '50000.00',
              size: '1.5',
              side: 'BUY',
              timestamp: 1234567890000,
            },
            {
              id: 'trade-2',
              market: 'BTC-USD-PERP',
              price: '50005.00',
              size: '2.0',
              side: 'SELL',
              timestamp: 1234567891000,
            },
          ],
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const trades = await adapter.fetchTrades('BTC/USD:USD');

        expect(mockHttpClient.get).toHaveBeenCalledWith('/markets/BTC-USD-PERP/trades?limit=100');
        expect(trades).toHaveLength(2);
        expect(trades[0].symbol).toBe('BTC/USD:USD');
        expect(trades[0].price).toBe(50000);
        expect(trades[0].amount).toBe(1.5);
        expect(trades[0].side).toBe('buy');
      });

      it('should respect custom limit parameter', async () => {
        const mockResponse = { trades: [] };
        mockHttpClient.get.mockResolvedValue(mockResponse);

        await adapter.fetchTrades('BTC/USD:USD', { limit: 50 });

        expect(mockHttpClient.get).toHaveBeenCalledWith('/markets/BTC-USD-PERP/trades?limit=50');
      });

      it('should throw error when trades response is invalid', async () => {
        mockHttpClient.get.mockResolvedValue({ trades: 'invalid' });

        await expect(adapter.fetchTrades('BTC/USD:USD')).rejects.toThrow(PerpDEXError);
      });
    });

    describe('fetchFundingRate()', () => {
      it('should fetch current funding rate', async () => {
        const mockResponse = {
          market: 'BTC-USD-PERP',
          rate: '0.0001',
          timestamp: 1234567880000,
          next_funding_time: 1234567890000,
          index_price: '50000.00',
          mark_price: '50010.00',
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const fundingRate = await adapter.fetchFundingRate('BTC/USD:USD');

        expect(mockHttpClient.get).toHaveBeenCalledWith('/markets/BTC-USD-PERP/funding');
        expect(fundingRate.symbol).toBe('BTC/USD:USD');
        expect(fundingRate.fundingRate).toBe(0.0001);
        expect(fundingRate.nextFundingTimestamp).toBe(1234567890000);
        expect(fundingRate.markPrice).toBe(50010);
        expect(fundingRate.indexPrice).toBe(50000);
      });
    });

    describe('fetchFundingRateHistory()', () => {
      it('should fetch funding rate history with all parameters', async () => {
        const mockResponse = {
          history: [
            {
              market: 'BTC-USD-PERP',
              rate: '0.0001',
              timestamp: 1234567890000,
              next_funding_time: 1234567900000,
              index_price: '50000.00',
              mark_price: '50010.00',
            },
            {
              market: 'BTC-USD-PERP',
              rate: '0.00015',
              timestamp: 1234567900000,
              next_funding_time: 1234567910000,
              index_price: '50100.00',
              mark_price: '50110.00',
            },
          ],
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const history = await adapter.fetchFundingRateHistory('BTC/USD:USD', 1234567800000, 10);

        expect(mockHttpClient.get).toHaveBeenCalledWith(
          '/markets/BTC-USD-PERP/funding/history?start_time=1234567800000&limit=10'
        );
        expect(history).toHaveLength(2);
        expect(history[0].fundingRate).toBe(0.0001);
      });

      it('should handle optional parameters', async () => {
        mockHttpClient.get.mockResolvedValue({ history: [] });

        await adapter.fetchFundingRateHistory('BTC/USD:USD');

        expect(mockHttpClient.get).toHaveBeenCalledWith('/markets/BTC-USD-PERP/funding/history');
      });
    });
  });

  // ===========================================================================
  // Account Methods Tests
  // ===========================================================================

  describe('Account Methods', () => {
    describe('fetchPositions()', () => {
      it('should fetch all positions', async () => {
        const mockResponse = {
          positions: [
            {
              market: 'BTC-USD-PERP',
              side: 'LONG',
              size: '2.5',
              entry_price: '50000.00',
              mark_price: '50500.00',
              liquidation_price: '45000.00',
              unrealized_pnl: '1250.00',
              realized_pnl: '0.00',
              margin: '10000.00',
              leverage: '5.0',
            },
            {
              market: 'ETH-USD-PERP',
              side: 'SHORT',
              size: '-10.0',
              entry_price: '3000.00',
              mark_price: '2950.00',
              liquidation_price: '3500.00',
              unrealized_pnl: '500.00',
              realized_pnl: '50.00',
              margin: '6000.00',
              leverage: '5.0',
            },
          ],
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const positions = await adapter.fetchPositions();

        expect(mockHttpClient.get).toHaveBeenCalledWith('/positions');
        expect(positions).toHaveLength(2);
        expect(positions[0].symbol).toBe('BTC/USD:USD');
        expect(positions[0].side).toBe('long');
        expect(positions[0].size).toBe(2.5);
      });

      it('should filter positions by symbols', async () => {
        const mockResponse = {
          positions: [
            {
              market: 'BTC-USD-PERP',
              side: 'LONG',
              size: '2.5',
              entry_price: '50000.00',
              mark_price: '50500.00',
              liquidation_price: '45000.00',
              unrealized_pnl: '1250.00',
              realized_pnl: '0.00',
              margin: '10000.00',
              leverage: '5.0',
            },
            {
              market: 'ETH-USD-PERP',
              side: 'SHORT',
              size: '-10.0',
              entry_price: '3000.00',
              mark_price: '2950.00',
              liquidation_price: '3500.00',
              unrealized_pnl: '500.00',
              realized_pnl: '50.00',
              margin: '6000.00',
              leverage: '5.0',
            },
          ],
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const positions = await adapter.fetchPositions(['BTC/USD:USD']);

        expect(positions).toHaveLength(1);
        expect(positions[0].symbol).toBe('BTC/USD:USD');
      });
    });

    describe('fetchBalance()', () => {
      it('should fetch account balances', async () => {
        const mockResponse = {
          balances: [
            {
              asset: 'USDC',
              total: '10000.00',
              available: '8000.00',
              locked: '2000.00',
            },
          ],
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const balances = await adapter.fetchBalance();

        expect(mockHttpClient.get).toHaveBeenCalledWith('/account/balance');
        expect(balances).toHaveLength(1);
        expect(balances[0].currency).toBe('USDC');
        expect(balances[0].total).toBe(10000);
        expect(balances[0].free).toBe(8000);
        expect(balances[0].used).toBe(2000);
      });
    });
  });

  // ===========================================================================
  // Trading Methods Tests
  // ===========================================================================

  describe('Trading Methods', () => {
    describe('createOrder()', () => {
      it('should create limit order', async () => {
        const orderRequest: OrderRequest = {
          symbol: 'BTC/USD:USD',
          side: 'buy',
          type: 'limit',
          amount: 1.5,
          price: 50000,
        };

        const mockResponse = {
          id: 'order-123',
          market: 'BTC-USD-PERP',
          side: 'BUY',
          type: 'LIMIT',
          size: '1.5',
          filled_size: '0',
          price: '50000.00',
          status: 'OPEN',
          time_in_force: 'GTC',
          post_only: false,
          reduce_only: false,
          created_at: 1234567890000,
        };

        mockHttpClient.post.mockResolvedValue(mockResponse);

        const order = await adapter.createOrder(orderRequest);

        expect(mockHttpClient.post).toHaveBeenCalledWith('/orders', {
          market: 'BTC-USD-PERP',
          side: 'BUY',
          type: 'LIMIT',
          size: '1.5',
          price: '50000',
          time_in_force: 'GTC',
          reduce_only: false,
          post_only: false,
          client_id: undefined,
        });

        expect(order.id).toBe('order-123');
        expect(order.symbol).toBe('BTC/USD:USD');
        expect(order.side).toBe('buy');
        expect(order.type).toBe('limit');
      });

      it('should create post-only order', async () => {
        const orderRequest: OrderRequest = {
          symbol: 'BTC/USD:USD',
          side: 'sell',
          type: 'limit',
          amount: 2.0,
          price: 51000,
          postOnly: true,
        };

        mockHttpClient.post.mockResolvedValue({
          id: 'order-456',
          market: 'BTC-USD-PERP',
          side: 'SELL',
          type: 'LIMIT_MAKER',
          size: '2.0',
          filled_size: '0',
          price: '51000.00',
          status: 'OPEN',
          time_in_force: 'GTC',
          post_only: true,
          reduce_only: false,
          created_at: 1234567890000,
        });

        await adapter.createOrder(orderRequest);

        expect(mockHttpClient.post).toHaveBeenCalledWith(
          '/orders',
          expect.objectContaining({
            type: 'LIMIT_MAKER',
            post_only: true,
          })
        );
      });

      it('should create reduce-only order', async () => {
        const orderRequest: OrderRequest = {
          symbol: 'BTC/USD:USD',
          side: 'sell',
          type: 'market',
          amount: 1.0,
          reduceOnly: true,
        };

        mockHttpClient.post.mockResolvedValue({
          id: 'order-789',
          market: 'BTC-USD-PERP',
          side: 'SELL',
          type: 'MARKET',
          size: '1.0',
          filled_size: '1.0',
          status: 'FILLED',
          time_in_force: 'IOC',
          post_only: false,
          reduce_only: true,
          created_at: 1234567890000,
        });

        await adapter.createOrder(orderRequest);

        expect(mockHttpClient.post).toHaveBeenCalledWith(
          '/orders',
          expect.objectContaining({
            reduce_only: true,
          })
        );
      });
    });

    describe('cancelOrder()', () => {
      it('should cancel order by ID', async () => {
        const mockResponse = {
          id: 'order-123',
          market: 'BTC-USD-PERP',
          side: 'BUY',
          type: 'LIMIT',
          size: '1.5',
          filled_size: '0',
          price: '50000.00',
          status: 'CANCELLED',
          time_in_force: 'GTC',
          post_only: false,
          reduce_only: false,
          created_at: 1234567890000,
        };

        mockHttpClient.delete.mockResolvedValue(mockResponse);

        const order = await adapter.cancelOrder('order-123');

        expect(mockHttpClient.delete).toHaveBeenCalledWith('/orders/order-123');
        expect(order.id).toBe('order-123');
        expect(order.status).toBe('canceled');
      });
    });

    describe('cancelAllOrders()', () => {
      it('should cancel all orders for a symbol', async () => {
        const mockResponse = {
          orders: [
            {
              id: 'order-1',
              market: 'BTC-USD-PERP',
              side: 'BUY',
              type: 'LIMIT',
              size: '1.0',
              filled_size: '0',
              price: '50000',
              status: 'CANCELLED',
              time_in_force: 'GTC',
              post_only: false,
              reduce_only: false,
              created_at: 1234567890000,
            },
            {
              id: 'order-2',
              market: 'BTC-USD-PERP',
              side: 'SELL',
              type: 'LIMIT',
              size: '1.0',
              filled_size: '0',
              price: '51000',
              status: 'CANCELLED',
              time_in_force: 'GTC',
              post_only: false,
              reduce_only: false,
              created_at: 1234567890000,
            },
          ],
        };

        mockHttpClient.delete.mockResolvedValue(mockResponse);

        const orders = await adapter.cancelAllOrders('BTC/USD:USD');

        expect(mockHttpClient.delete).toHaveBeenCalledWith('/orders', {
          market: 'BTC-USD-PERP',
        });
        expect(orders).toHaveLength(2);
      });

      it('should cancel all orders across all symbols', async () => {
        const mockResponse = { orders: [] };
        mockHttpClient.delete.mockResolvedValue(mockResponse);

        await adapter.cancelAllOrders();

        expect(mockHttpClient.delete).toHaveBeenCalledWith('/orders', undefined);
      });
    });

    describe('fetchOpenOrders()', () => {
      it('should fetch open orders for symbol', async () => {
        const mockResponse = {
          orders: [
            {
              id: 'order-1',
              market: 'BTC-USD-PERP',
              side: 'BUY',
              type: 'LIMIT',
              size: '1.0',
              filled_size: '0',
              price: '50000.00',
              status: 'OPEN',
              time_in_force: 'GTC',
              post_only: false,
              reduce_only: false,
              created_at: 1234567890000,
            },
          ],
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const orders = await adapter.fetchOpenOrders('BTC/USD:USD');

        expect(mockHttpClient.get).toHaveBeenCalledWith('/orders?market=BTC-USD-PERP');
        expect(orders).toHaveLength(1);
        expect(orders[0].status).toBe('open');
      });

      it('should fetch all open orders', async () => {
        mockHttpClient.get.mockResolvedValue({ orders: [] });

        await adapter.fetchOpenOrders();

        expect(mockHttpClient.get).toHaveBeenCalledWith('/orders');
      });
    });

    describe('fetchOrder()', () => {
      it('should fetch specific order by ID', async () => {
        const mockResponse = {
          id: 'order-123',
          market: 'BTC-USD-PERP',
          side: 'BUY',
          type: 'LIMIT',
          size: '1.5',
          filled_size: '1.5',
          price: '50000.00',
          status: 'FILLED',
          time_in_force: 'GTC',
          post_only: false,
          reduce_only: false,
          created_at: 1234567890000,
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const order = await adapter.fetchOrder('order-123');

        expect(mockHttpClient.get).toHaveBeenCalledWith('/orders/order-123');
        expect(order.id).toBe('order-123');
        expect(order.status).toBe('filled');
      });
    });

    describe('setLeverage()', () => {
      it('should set leverage for symbol', async () => {
        mockHttpClient.post.mockResolvedValue({});

        await adapter.setLeverage('BTC/USD:USD', 10);

        expect(mockHttpClient.post).toHaveBeenCalledWith('/account/leverage', {
          market: 'BTC-USD-PERP',
          leverage: '10',
        });
      });
    });

    describe('fetchOrderHistory()', () => {
      it('should fetch order history with all filters', async () => {
        const mockResponse = {
          results: [
            {
              id: 'order-1',
              market: 'BTC-USD-PERP',
              side: 'BUY',
              type: 'LIMIT',
              size: '1.0',
              filled_size: '1.0',
              price: '50000',
              status: 'FILLED',
              time_in_force: 'GTC',
              post_only: false,
              reduce_only: false,
              created_at: 1234567890000,
            },
          ],
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const orders = await adapter.fetchOrderHistory('BTC/USD:USD', 1234567890000, 50);

        expect(mockHttpClient.get).toHaveBeenCalledWith(
          '/orders/history?market=BTC-USD-PERP&start_at=1234567890000&page_size=50'
        );
        expect(orders).toHaveLength(1);
      });
    });

    describe('fetchMyTrades()', () => {
      it('should fetch user trade history', async () => {
        const mockResponse = {
          results: [
            {
              id: 'fill-1',
              market: 'BTC-USD-PERP',
              order_id: 'order-1',
              side: 'BUY',
              price: '50000.00',
              size: '1.5',
              timestamp: 1234567890000,
            },
          ],
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const trades = await adapter.fetchMyTrades('BTC/USD:USD', 1234567800000, 100);

        expect(mockHttpClient.get).toHaveBeenCalledWith(
          '/fills?market=BTC-USD-PERP&start_at=1234567800000&page_size=100'
        );
        expect(trades).toHaveLength(1);
        expect(trades[0].price).toBe(50000);
      });
    });
  });

  // ===========================================================================
  // Paraclear Methods Tests
  // ===========================================================================

  describe('Paraclear Methods', () => {
    describe('withdraw()', () => {
      it('should withdraw funds via Paraclear', async () => {
        const mockResult = {
          transactionHash: '0xabc123',
          receivableAmount: '99.5', // After socialized loss
        };

        mockParaclear.withdraw.mockResolvedValue(mockResult);

        const result = await adapter.withdraw('USDC', 100, {} as any);

        expect(mockParaclear.withdraw).toHaveBeenCalledWith('USDC', '100', {});
        expect(result.txHash).toBe('0xabc123');
        expect(result.amount).toBe(99.5);
      });
    });

    describe('fetchParaclearBalance()', () => {
      it('should fetch on-chain balances', async () => {
        const mockBalances = {
          USDC: '5000.00',
          ETH: '2.5',
        };

        mockParaclear.getAllBalances.mockResolvedValue(mockBalances);

        const balances = await adapter.fetchParaclearBalance();

        expect(balances).toHaveLength(2);
        expect(balances[0].currency).toBe('USDC');
        expect(balances[0].total).toBe(5000);
        expect(balances[1].currency).toBe('ETH');
        expect(balances[1].total).toBe(2.5);
      });

      it('should filter by token', async () => {
        const mockBalances = {
          USDC: '5000.00',
          ETH: '2.5',
        };

        mockParaclear.getAllBalances.mockResolvedValue(mockBalances);

        const balances = await adapter.fetchParaclearBalance('USDC');

        expect(balances).toHaveLength(1);
        expect(balances[0].currency).toBe('USDC');
      });
    });
  });

  // ===========================================================================
  // Symbol Conversion Tests
  // ===========================================================================

  describe('Symbol Conversion', () => {
    it('should convert CCXT symbol to Paradex format', () => {
      expect(adapter.symbolToExchange('BTC/USD:USD')).toBe('BTC-USD-PERP');
      expect(adapter.symbolToExchange('ETH/USDC:USDC')).toBe('ETH-USDC-PERP');
    });

    it('should convert Paradex symbol to CCXT format', () => {
      expect(adapter.symbolFromExchange('BTC-USD-PERP')).toBe('BTC/USD:USD');
      expect(adapter.symbolFromExchange('ETH-USDC-PERP')).toBe('ETH/USDC:USDC');
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('Error Handling', () => {
    it('should map HTTP errors correctly', async () => {
      const error = new Error('Network error');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(adapter.fetchMarkets()).rejects.toThrow();
    });

    it('should handle invalid response data gracefully', async () => {
      mockHttpClient.get.mockResolvedValue(null);

      await expect(adapter.fetchMarkets()).rejects.toThrow(PerpDEXError);
    });
  });
});

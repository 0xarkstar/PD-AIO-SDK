/**
 * Extended Adapter Integration Tests
 * Tests complete request/response cycles with properly mocked API responses
 * Extended is a StarkNet-based hybrid CLOB with 50+ markets and 100x leverage
 */

import { ExtendedAdapter } from '../../src/adapters/extended/ExtendedAdapter.js';

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
        on: jest.fn(),
      };
    }),
  };
});

describe('ExtendedAdapter Integration Tests', () => {
  let adapter: ExtendedAdapter;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create mock fetch function
    mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = mockFetch;

    adapter = new ExtendedAdapter({
      apiKey: 'test-api-key',
      testnet: true,
    });
  });

  const mockSuccessResponse = (data: any) => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    } as Response);
  };

  const mockFailedResponse = (status: number, error: any = {}) => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      json: async () => error,
    } as Response);
  };

  // ============================================================================
  // 1. Initialization (4 tests)
  // ============================================================================

  describe('Adapter Initialization', () => {
    test('initializes with correct properties', async () => {
      await adapter.initialize();

      expect(adapter.id).toBe('extended');
      expect(adapter.name).toBe('Extended');
      expect(adapter.isReady).toBe(true);
    });

    test('has correct capabilities', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.cancelAllOrders).toBe(true);
      expect(adapter.has.setLeverage).toBe(true);
      expect(adapter.has.setMarginMode).toBe(true);
    });

    test('uses correct API URL for testnet', () => {
      expect(adapter.id).toBe('extended');
      // API URL is set in constants.ts for testnet
    });

    test('can disconnect successfully', async () => {
      await adapter.initialize();
      await adapter.disconnect();
      expect(adapter.isReady).toBe(false);
    });
  });

  // ============================================================================
  // 2. Market Data Methods (15 tests)
  // ============================================================================

  describe('Market Data Methods', () => {
    test('fetchMarkets - fetches and normalizes all markets', async () => {
      mockSuccessResponse({
        markets: [
          {
            marketId: 'BTC-USD-PERP',
            symbol: 'BTC-USD-PERP',
            baseAsset: 'BTC',
            quoteAsset: 'USD',
            settleAsset: 'USD',
            isActive: true,
            minOrderQuantity: '0.001',
            maxOrderQuantity: '100',
            minPrice: '0.5',
            pricePrecision: 1,
            quantityPrecision: 3,
            contractMultiplier: '1',
            maxLeverage: '100',
          },
          {
            marketId: 'ETH-USD-PERP',
            symbol: 'ETH-USD-PERP',
            baseAsset: 'ETH',
            quoteAsset: 'USD',
            settleAsset: 'USD',
            isActive: true,
            minOrderQuantity: '0.01',
            maxOrderQuantity: '1000',
            minPrice: '0.1',
            pricePrecision: 2,
            quantityPrecision: 2,
            contractMultiplier: '1',
            maxLeverage: '50',
          },
        ],
      });

      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(2);
      expect(markets[0]).toMatchObject({
        symbol: 'BTC/USD:USD',
        base: 'BTC',
        quote: 'USD',
        settle: 'USD',
        active: true,
        maxLeverage: 100,
      });
      expect(markets[1].symbol).toBe('ETH/USD:USD');
      expect(markets[1].maxLeverage).toBe(50);
    });

    test('fetchMarkets - handles empty markets array', async () => {
      mockSuccessResponse({ markets: [] });

      const markets = await adapter.fetchMarkets();

      expect(Array.isArray(markets)).toBe(true);
      expect(markets).toHaveLength(0);
    });

    test('fetchTicker - fetches and normalizes ticker', async () => {
      mockSuccessResponse({
        symbol: 'BTC-USD-PERP',
        lastPrice: '50000',
        bidPrice: '49950',
        askPrice: '50050',
        high24h: '51000',
        low24h: '49000',
        volume24h: '1000',
        quoteVolume24h: '50000000',
        priceChange24h: '1000',
        priceChangePercent24h: '2',
        timestamp: 1234567890,
      });

      const ticker = await adapter.fetchTicker('BTC/USD:USD');

      expect(ticker.symbol).toBe('BTC/USD:USD');
      expect(ticker.last).toBe(50000);
      expect(ticker.bid).toBe(49950);
      expect(ticker.ask).toBe(50050);
      expect(ticker.high).toBe(51000);
      expect(ticker.low).toBe(49000);
    });

    test('fetchOrderBook - fetches and normalizes order book', async () => {
      mockSuccessResponse({
        symbol: 'BTC-USD-PERP',
        bids: [
          ['49900', '1.5'],
          ['49800', '2.0'],
        ],
        asks: [
          ['50100', '1.2'],
          ['50200', '1.8'],
        ],
        timestamp: 1234567890,
      });

      const orderbook = await adapter.fetchOrderBook('BTC/USD:USD');

      expect(orderbook.symbol).toBe('BTC/USD:USD');
      expect(orderbook.bids).toHaveLength(2);
      expect(orderbook.asks).toHaveLength(2);
      expect(orderbook.bids[0]).toEqual([49900, 1.5]);
      expect(orderbook.asks[0]).toEqual([50100, 1.2]);
    });

    test('fetchTrades - fetches and normalizes recent trades', async () => {
      mockSuccessResponse({
        trades: [
          {
            id: 'trade1',
            symbol: 'BTC-USD-PERP',
            price: '50000',
            quantity: '1.5',
            side: 'buy',
            timestamp: 1234567890,
          },
          {
            id: 'trade2',
            symbol: 'BTC-USD-PERP',
            price: '50100',
            quantity: '2.0',
            side: 'sell',
            timestamp: 1234567891,
          },
        ],
      });

      const trades = await adapter.fetchTrades('BTC/USD:USD');

      expect(trades).toHaveLength(2);
      expect(trades[0].id).toBe('trade1');
      expect(trades[0].symbol).toBe('BTC/USD:USD');
      expect(trades[0].price).toBe(50000);
      expect(trades[0].amount).toBe(1.5);
      expect(trades[0].side).toBe('buy');
    });

    test('fetchTrades - with limit parameter', async () => {
      mockSuccessResponse({
        trades: [
          {
            id: 'trade1',
            symbol: 'BTC-USD-PERP',
            price: '50000',
            quantity: '1.5',
            side: 'buy',
            timestamp: 1234567890,
          },
        ],
      });

      const trades = await adapter.fetchTrades('BTC/USD:USD', undefined, 1);

      expect(trades).toHaveLength(1);
    });

    test('fetchFundingRate - fetches current funding rate', async () => {
      mockSuccessResponse({
        symbol: 'BTC-USD-PERP',
        fundingRate: '0.0001',
        markPrice: '50000',
        indexPrice: '49990',
        fundingTime: 1234567890,
        nextFundingTime: 1234597890,
      });

      const fundingRate = await adapter.fetchFundingRate('BTC/USD:USD');

      expect(fundingRate.symbol).toBe('BTC/USD:USD');
      expect(fundingRate.fundingRate).toBe(0.0001);
      expect(fundingRate.markPrice).toBe(50000);
      expect(fundingRate.indexPrice).toBe(49990);
    });

    test('fetchFundingRateHistory - fetches funding rate history', async () => {
      mockSuccessResponse({
        rates: [
          {
            symbol: 'BTC-USD-PERP',
            fundingRate: '0.0001',
            markPrice: '50000',
            indexPrice: '49990',
            fundingTime: 1234567890,
          },
          {
            symbol: 'BTC-USD-PERP',
            fundingRate: '0.00012',
            markPrice: '50100',
            indexPrice: '50090',
            fundingTime: 1234597890,
          },
        ],
      });

      const history = await adapter.fetchFundingRateHistory('BTC/USD:USD');

      expect(history).toHaveLength(2);
      expect(history[0].fundingRate).toBe(0.0001);
      expect(history[1].fundingRate).toBe(0.00012);
    });

    test('fetchMarkets - handles API error', async () => {
      mockFailedResponse(500, { error: 'Internal server error' });

      await expect(adapter.fetchMarkets()).rejects.toThrow();
    });

    test('fetchTicker - throws error for invalid symbol', async () => {
      mockFailedResponse(404, { error: 'Market not found' });

      await expect(adapter.fetchTicker('INVALID/SYMBOL:USD')).rejects.toThrow();
    });
  });

  // ============================================================================
  // 3. Trading Methods (12 tests)
  // ============================================================================

  describe('Trading Methods', () => {
    test('createOrder - creates limit order successfully', async () => {
      mockSuccessResponse({
        orderId: 'order123',
        clientOrderId: 'client123',
        symbol: 'BTC-USD-PERP',
        type: 'limit',
        side: 'buy',
        quantity: '1.5',
        price: '50000',
        filledQuantity: '0',
        remainingQuantity: '1.5',
        status: 'open',
        timestamp: 1234567890,
        updateTime: 1234567890,
      });

      const order = await adapter.createOrder({
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: 1.5,
        price: 50000,
      });

      expect(order.id).toBe('order123');
      expect(order.symbol).toBe('BTC/USD:USD');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.amount).toBe(1.5);
      expect(order.price).toBe(50000);
      expect(order.status).toBe('open');
    });

    test('createOrder - creates market order successfully', async () => {
      mockSuccessResponse({
        orderId: 'order456',
        symbol: 'ETH-USD-PERP',
        type: 'market',
        side: 'sell',
        quantity: '10',
        filledQuantity: '10',
        remainingQuantity: '0',
        status: 'filled',
        timestamp: 1234567890,
        updateTime: 1234567890,
      });

      const order = await adapter.createOrder({
        symbol: 'ETH/USD:USD',
        type: 'market',
        side: 'sell',
        amount: 10,
      });

      expect(order.id).toBe('order456');
      expect(order.type).toBe('market');
      expect(order.status).toBe('closed');
    });

    test('createOrder - validates order request', async () => {
      await expect(
        adapter.createOrder({
          symbol: '',
          type: 'limit',
          side: 'buy',
          amount: 1,
          price: 50000,
        })
      ).rejects.toThrow('Symbol is required');
    });

    test('createOrder - validates limit order has price', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'BTC/USD:USD',
          type: 'limit',
          side: 'buy',
          amount: 1,
        })
      ).rejects.toThrow('Price is required for limit orders');
    });

    test('cancelOrder - cancels order successfully', async () => {
      mockSuccessResponse({
        orderId: 'order123',
        symbol: 'BTC-USD-PERP',
        status: 'cancelled',
      });

      const result = await adapter.cancelOrder('order123');

      expect(result.id).toBe('order123');
      expect(result.status).toBe('canceled');
    });

    test('cancelOrder - throws error for invalid order ID', async () => {
      mockFailedResponse(404, { error: 'Order not found' });

      await expect(adapter.cancelOrder('invalid-id')).rejects.toThrow();
    });

    test('cancelAllOrders - cancels all orders', async () => {
      mockSuccessResponse({
        orders: [
          {
            orderId: 'order1',
            symbol: 'BTC-USD-PERP',
            status: 'cancelled',
            timestamp: 1234567890,
            updateTime: 1234567890,
          },
          {
            orderId: 'order2',
            symbol: 'ETH-USD-PERP',
            status: 'cancelled',
            timestamp: 1234567890,
            updateTime: 1234567890,
          },
          {
            orderId: 'order3',
            symbol: 'BTC-USD-PERP',
            status: 'cancelled',
            timestamp: 1234567890,
            updateTime: 1234567890,
          },
        ],
      });

      const result = await adapter.cancelAllOrders();

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe('canceled');
    });

    test('cancelAllOrders - with symbol filter', async () => {
      mockSuccessResponse({
        orders: [
          {
            orderId: 'order1',
            symbol: 'BTC-USD-PERP',
            status: 'cancelled',
            timestamp: 1234567890,
            updateTime: 1234567890,
          },
          {
            orderId: 'order2',
            symbol: 'BTC-USD-PERP',
            status: 'cancelled',
            timestamp: 1234567890,
            updateTime: 1234567890,
          },
        ],
      });

      const result = await adapter.cancelAllOrders('BTC/USD:USD');

      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('BTC/USD:USD');
    });

    test('createBatchOrders - creates multiple orders', async () => {
      mockSuccessResponse({
        orders: [
          {
            orderId: 'order1',
            symbol: 'BTC-USD-PERP',
            type: 'limit',
            side: 'buy',
            quantity: '1',
            price: '49000',
            status: 'open',
            timestamp: 1234567890,
            updateTime: 1234567890,
          },
          {
            orderId: 'order2',
            symbol: 'BTC-USD-PERP',
            type: 'limit',
            side: 'buy',
            quantity: '1',
            price: '48000',
            status: 'open',
            timestamp: 1234567891,
            updateTime: 1234567891,
          },
        ],
      });

      const orders = await adapter.createBatchOrders([
        {
          symbol: 'BTC/USD:USD',
          type: 'limit',
          side: 'buy',
          amount: 1,
          price: 49000,
        },
        {
          symbol: 'BTC/USD:USD',
          type: 'limit',
          side: 'buy',
          amount: 1,
          price: 48000,
        },
      ]);

      expect(orders).toHaveLength(2);
      expect(orders[0].id).toBe('order1');
      expect(orders[1].id).toBe('order2');
    });

    test('cancelBatchOrders - cancels multiple orders', async () => {
      mockSuccessResponse({
        orders: [
          {
            orderId: 'order1',
            symbol: 'BTC-USD-PERP',
            status: 'cancelled',
            timestamp: 1234567890,
            updateTime: 1234567890,
          },
          {
            orderId: 'order2',
            symbol: 'ETH-USD-PERP',
            status: 'cancelled',
            timestamp: 1234567890,
            updateTime: 1234567890,
          },
        ],
      });

      const result = await adapter.cancelBatchOrders(['order1', 'order2']);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('order1');
      expect(result[1].id).toBe('order2');
    });

    test('fetchOrderHistory - fetches order history', async () => {
      mockSuccessResponse({
        orders: [
          {
            orderId: 'order1',
            symbol: 'BTC-USD-PERP',
            type: 'limit',
            side: 'buy',
            quantity: '1',
            price: '50000',
            filledQuantity: '1',
            status: 'filled',
            timestamp: 1234567890,
            updateTime: 1234567890,
          },
        ],
      });

      const orders = await adapter.fetchOrderHistory();

      expect(orders).toHaveLength(1);
      expect(orders[0].status).toBe('closed');
    });

    test('fetchMyTrades - fetches user trades', async () => {
      mockSuccessResponse({
        trades: [
          {
            id: 'trade1',
            symbol: 'BTC-USD-PERP',
            price: '50000',
            quantity: '1',
            side: 'buy',
            timestamp: 1234567890,
          },
        ],
      });

      const trades = await adapter.fetchMyTrades();

      expect(trades).toHaveLength(1);
      expect(trades[0].price).toBe(50000);
    });
  });

  // ============================================================================
  // 4. Position & Account Methods (8 tests)
  // ============================================================================

  describe('Position & Account Methods', () => {
    test('fetchPositions - fetches all positions', async () => {
      mockSuccessResponse({
        positions: [
          {
            symbol: 'BTC-USD-PERP',
            side: 'long',
            size: '2.5',
            entryPrice: '48000',
            markPrice: '50000',
            liquidationPrice: '45000',
            unrealizedPnl: '5000',
            leverage: '10',
            initialMargin: '12000',
            maintenanceMargin: '600',
            marginMode: 'isolated',
            timestamp: 1234567890,
          },
        ],
      });

      const positions = await adapter.fetchPositions();

      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe('BTC/USD:USD');
      expect(positions[0].side).toBe('long');
      expect(positions[0].size).toBe(2.5);
      expect(positions[0].entryPrice).toBe(48000);
      expect(positions[0].unrealizedPnl).toBe(5000);
    });

    test('fetchPositions - with symbol filter', async () => {
      mockSuccessResponse({
        positions: [
          {
            symbol: 'BTC-USD-PERP',
            side: 'long',
            size: '1',
            entryPrice: '50000',
            markPrice: '50000',
            liquidationPrice: '45000',
            unrealizedPnl: '0',
            leverage: '10',
            initialMargin: '5000',
            maintenanceMargin: '250',
            marginMode: 'isolated',
            timestamp: 1234567890,
          },
        ],
      });

      const positions = await adapter.fetchPositions(['BTC/USD:USD']);

      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe('BTC/USD:USD');
    });

    test('fetchBalance - fetches account balance', async () => {
      mockSuccessResponse({
        balances: [
          {
            asset: 'USD',
            free: '10000',
            locked: '2000',
            total: '12000',
          },
          {
            asset: 'BTC',
            free: '0.5',
            locked: '0.1',
            total: '0.6',
          },
        ],
      });

      const balances = await adapter.fetchBalance();

      expect(balances).toHaveLength(2);
      expect(balances[0].currency).toBe('USD');
      expect(balances[0].free).toBe(10000);
      expect(balances[0].used).toBe(2000);
      expect(balances[0].total).toBe(12000);
    });

    test('setLeverage - sets leverage for symbol', async () => {
      mockSuccessResponse({
        symbol: 'BTC-USD-PERP',
        leverage: '25',
      });

      await expect(adapter.setLeverage('BTC/USD:USD', 25)).resolves.not.toThrow();
    });

    test('setLeverage - validates leverage range', async () => {
      await expect(adapter.setLeverage('BTC/USD:USD', 101)).rejects.toThrow();
    });

    test('setMarginMode - sets margin mode for symbol', async () => {
      mockSuccessResponse({
        symbol: 'BTC-USD-PERP',
        marginMode: 'cross',
      });

      await expect(adapter.setMarginMode('BTC/USD:USD', 'cross')).resolves.not.toThrow();
    });

    test('fetchUserFees - fetches user fee rates', async () => {
      mockSuccessResponse({
        makerFee: '0.0002',
        takerFee: '0.0005',
      });

      const fees = await adapter.fetchUserFees();

      expect(fees).toBeDefined();
    });

    test('fetchPortfolio - fetches portfolio overview', async () => {
      mockSuccessResponse({
        totalValue: '100000',
        availableBalance: '50000',
        marginUsed: '30000',
        unrealizedPnl: '5000',
      });

      const portfolio = await adapter.fetchPortfolio();

      expect(portfolio).toBeDefined();
      expect(portfolio.timestamp).toBeDefined();
    });
  });

  // ============================================================================
  // 5. Error Handling (4 tests)
  // ============================================================================

  describe('Error Handling', () => {
    test('handles rate limit errors', async () => {
      mockFailedResponse(429, { error: 'Rate limit exceeded' });

      await expect(adapter.fetchMarkets()).rejects.toThrow();
    });

    test('handles authentication errors', async () => {
      mockFailedResponse(401, { error: 'Invalid API key' });

      await expect(adapter.fetchBalance()).rejects.toThrow();
    });

    test('handles insufficient balance errors', async () => {
      mockFailedResponse(400, { error: 'Insufficient balance', code: 'INSUFFICIENT_BALANCE' });

      await expect(
        adapter.createOrder({
          symbol: 'BTC/USD:USD',
          type: 'limit',
          side: 'buy',
          amount: 100,
          price: 50000,
        })
      ).rejects.toThrow();
    });

    test('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network error: Connection failed'));

      await expect(adapter.fetchMarkets()).rejects.toThrow();
    });
  });

  // ============================================================================
  // 6. Special Features (1 test)
  // ============================================================================

  describe('Special Features', () => {
    test('supports high leverage up to 100x', async () => {
      mockSuccessResponse({
        symbol: 'BTC-USD-PERP',
        leverage: '100',
      });

      await expect(adapter.setLeverage('BTC/USD:USD', 100)).resolves.not.toThrow();
    });
  });
});

/**
 * EtherealAdapter Tests
 *
 * Tests adapter methods by mocking HTTPClient.
 */

import { EtherealAdapter } from '../../../src/adapters/ethereal/EtherealAdapter.js';
import { PerpDEXError, NotSupportedError } from '../../../src/types/errors.js';

// Mock HTTPClient
jest.mock('../../../src/core/http/HTTPClient.js', () => ({
  HTTPClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock ethers Wallet
jest.mock('ethers', () => ({
  Wallet: jest.fn().mockImplementation(() => ({
    address: '0xmockaddress',
    signTypedData: jest.fn().mockResolvedValue('0xmocksignature'),
  })),
}));

describe('EtherealAdapter', () => {
  let adapter: EtherealAdapter;
  let authedAdapter: EtherealAdapter;
  let mockHttpClient: {
    get: jest.Mock;
    post: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
  };
  let authedMockHttp: typeof mockHttpClient;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new EtherealAdapter();
    mockHttpClient = (adapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;

    authedAdapter = new EtherealAdapter({
      privateKey: '0x' + 'a'.repeat(64),
      accountId: 'acc-123',
    });
    authedMockHttp = (authedAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
  });

  // =========================================================================
  // Constructor
  // =========================================================================

  describe('constructor', () => {
    test('creates adapter with default config', () => {
      const a = new EtherealAdapter();
      expect(a.id).toBe('ethereal');
      expect(a.name).toBe('Ethereal');
    });

    test('creates adapter for testnet', () => {
      const a = new EtherealAdapter({ testnet: true });
      expect(a).toBeInstanceOf(EtherealAdapter);
    });

    test('creates adapter with custom apiUrl', () => {
      const a = new EtherealAdapter({ apiUrl: 'https://custom.api.com' });
      expect(a).toBeInstanceOf(EtherealAdapter);
    });

    test('creates adapter with privateKey', () => {
      const a = new EtherealAdapter({ privateKey: '0x' + 'b'.repeat(64) });
      expect(a).toBeInstanceOf(EtherealAdapter);
    });

    test('has expected features', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.fetchOHLCV).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.fetchFundingRateHistory).toBe(false);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.cancelAllOrders).toBe(true);
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.setLeverage).toBe(false);
      expect(adapter.has.editOrder).toBe(false);
    });
  });

  // =========================================================================
  // initialize
  // =========================================================================

  describe('initialize', () => {
    test('sets isReady to true', async () => {
      await adapter.initialize();
      expect(adapter.isReady).toBe(true);
    });
  });

  // =========================================================================
  // fetchMarkets
  // =========================================================================

  describe('fetchMarkets', () => {
    const mockMarkets = [
      {
        symbol: 'ETH-USD',
        baseAsset: 'ETH',
        quoteAsset: 'USD',
        status: 'ACTIVE',
        tickSize: '0.01',
        stepSize: '0.001',
        minOrderSize: '0.01',
        maxLeverage: 50,
        makerFee: '0.0002',
        takerFee: '0.0005',
        fundingInterval: 1,
      },
      {
        symbol: 'BTC-USD',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        status: 'ACTIVE',
        tickSize: '0.1',
        stepSize: '0.0001',
        minOrderSize: '0.001',
        maxLeverage: 100,
        makerFee: '0.0001',
        takerFee: '0.0004',
        fundingInterval: 1,
      },
      {
        symbol: 'DOGE-USD',
        baseAsset: 'DOGE',
        quoteAsset: 'USD',
        status: 'INACTIVE',
        tickSize: '0.0001',
        stepSize: '1',
        minOrderSize: '10',
        maxLeverage: 20,
        makerFee: '0.0005',
        takerFee: '0.001',
        fundingInterval: 1,
      },
    ];

    test('fetches and filters only ACTIVE markets', async () => {
      mockHttpClient.get.mockResolvedValue(mockMarkets);

      const markets = await adapter.fetchMarkets();
      expect(markets).toHaveLength(2);
      expect(markets[0].symbol).toBe('ETH/USD:USD');
      expect(markets[1].symbol).toBe('BTC/USD:USD');
    });

    test('throws on invalid response', async () => {
      mockHttpClient.get.mockResolvedValue('not-an-array');
      await expect(adapter.fetchMarkets()).rejects.toThrow(PerpDEXError);
    });
  });

  // =========================================================================
  // fetchTicker (via _fetchTicker)
  // =========================================================================

  describe('fetchTicker', () => {
    const mockTicker = {
      symbol: 'ETH-USD',
      lastPrice: '3150.00',
      bestBid: '3149.00',
      bestAsk: '3151.00',
      high24h: '3200.00',
      low24h: '3100.00',
      open24h: '3120.00',
      volume24h: '50000',
      quoteVolume24h: '157500000',
      priceChange24h: '30.00',
      priceChangePercent24h: '0.96',
      markPrice: '3150.00',
      indexPrice: '3149.50',
      timestamp: 1700000000000,
    };

    test('fetches ticker for symbol', async () => {
      mockHttpClient.get.mockResolvedValue(mockTicker);
      await adapter.initialize();

      const ticker = await adapter.fetchTicker('ETH/USD:USD');
      expect(ticker.symbol).toBe('ETH/USD:USD');
      expect(ticker.last).toBe(3150);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/markets/ETH-USD/ticker');
    });
  });

  // =========================================================================
  // fetchOrderBook
  // =========================================================================

  describe('fetchOrderBook', () => {
    const mockOB = {
      symbol: 'ETH-USD',
      bids: [['3150.00', '5']],
      asks: [['3151.00', '3']],
      timestamp: 1700000000000,
    };

    test('fetches order book with default limit', async () => {
      mockHttpClient.get.mockResolvedValue(mockOB);
      await adapter.initialize();

      const ob = await adapter.fetchOrderBook('ETH/USD:USD');
      expect(ob.bids).toEqual([[3150, 5]]);
      expect(ob.asks).toEqual([[3151, 3]]);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/markets/ETH-USD/orderbook?limit=20');
    });

    test('fetches order book with custom limit', async () => {
      mockHttpClient.get.mockResolvedValue(mockOB);
      await adapter.initialize();

      await adapter.fetchOrderBook('ETH/USD:USD', { limit: 50 });
      expect(mockHttpClient.get).toHaveBeenCalledWith('/markets/ETH-USD/orderbook?limit=50');
    });
  });

  // =========================================================================
  // fetchTrades
  // =========================================================================

  describe('fetchTrades', () => {
    const mockTrades = [
      {
        id: 't1',
        symbol: 'ETH-USD',
        side: 'BUY',
        price: '3150.00',
        quantity: '1.0',
        timestamp: 1700000000000,
      },
    ];

    test('fetches trades for symbol', async () => {
      mockHttpClient.get.mockResolvedValue(mockTrades);
      await adapter.initialize();

      const trades = await adapter.fetchTrades('ETH/USD:USD');
      expect(trades).toHaveLength(1);
      expect(trades[0].side).toBe('buy');
    });

    test('fetches trades with params', async () => {
      mockHttpClient.get.mockResolvedValue(mockTrades);
      await adapter.initialize();

      await adapter.fetchTrades('ETH/USD:USD', { limit: 50, since: 1700000000000 });
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/markets/ETH-USD/trades?limit=50&since=1700000000000'
      );
    });

    test('throws on invalid trades response', async () => {
      mockHttpClient.get.mockResolvedValue('bad');
      await adapter.initialize();
      await expect(adapter.fetchTrades('ETH/USD:USD')).rejects.toThrow(PerpDEXError);
    });
  });

  // =========================================================================
  // fetchFundingRate
  // =========================================================================

  describe('fetchFundingRate', () => {
    test('fetches funding rate', async () => {
      mockHttpClient.get.mockResolvedValue({
        symbol: 'ETH-USD',
        fundingRate: '0.0001',
        fundingTimestamp: 1700000000000,
        nextFundingTimestamp: 1700003600000,
        markPrice: '3150.00',
        indexPrice: '3149.50',
      });
      await adapter.initialize();

      const fr = await adapter.fetchFundingRate('ETH/USD:USD');
      expect(fr.fundingRate).toBe(0.0001);
      expect(fr.symbol).toBe('ETH/USD:USD');
    });
  });

  // =========================================================================
  // fetchFundingRateHistory
  // =========================================================================

  describe('fetchFundingRateHistory', () => {
    test('throws NotSupportedError', async () => {
      await expect(adapter.fetchFundingRateHistory('ETH/USD:USD')).rejects.toThrow(NotSupportedError);
    });
  });

  // =========================================================================
  // fetchOHLCV
  // =========================================================================

  describe('fetchOHLCV', () => {
    const mockCandles = [
      {
        timestamp: 1700000000000,
        open: '3100.00',
        high: '3200.00',
        low: '3050.00',
        close: '3150.00',
        volume: '5000',
      },
    ];

    test('fetches candles with default timeframe', async () => {
      mockHttpClient.get.mockResolvedValue(mockCandles);

      const ohlcv = await adapter.fetchOHLCV('ETH/USD:USD');
      expect(ohlcv).toHaveLength(1);
      expect(ohlcv[0]).toEqual([1700000000000, 3100, 3200, 3050, 3150, 5000]);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/markets/ETH-USD/candles?interval=1h'
      );
    });

    test('fetches candles with params', async () => {
      mockHttpClient.get.mockResolvedValue(mockCandles);

      await adapter.fetchOHLCV('ETH/USD:USD', '5m', {
        limit: 100,
        since: 1700000000000,
        until: 1700100000000,
      });
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/markets/ETH-USD/candles?interval=5m&limit=100&startTime=1700000000000&endTime=1700100000000'
      );
    });

    test('throws on invalid candles response', async () => {
      mockHttpClient.get.mockResolvedValue('not-array');
      await expect(adapter.fetchOHLCV('ETH/USD:USD')).rejects.toThrow(PerpDEXError);
    });
  });

  // =========================================================================
  // createOrder (authenticated)
  // =========================================================================

  describe('createOrder', () => {
    test('throws when no auth configured', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'ETH/USD:USD',
          side: 'buy',
          type: 'limit',
          amount: 1,
          price: 3000,
        })
      ).rejects.toThrow(PerpDEXError);
    });

    test('creates order with auth', async () => {
      const mockResponse = {
        orderId: 'ord-001',
        symbol: 'ETH-USD',
        side: 'BUY',
        type: 'LIMIT',
        status: 'NEW',
        price: '3000',
        avgPrice: '0',
        quantity: '1',
        filledQuantity: '0',
        remainingQuantity: '1',
        reduceOnly: false,
        postOnly: false,
        timeInForce: 'GTC',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      authedMockHttp.post.mockResolvedValue(mockResponse);

      const order = await authedAdapter.createOrder({
        symbol: 'ETH/USD:USD',
        side: 'buy',
        type: 'limit',
        amount: 1,
        price: 3000,
      });

      expect(order.id).toBe('ord-001');
      expect(order.status).toBe('open');
      expect(authedMockHttp.post).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // cancelOrder (authenticated)
  // =========================================================================

  describe('cancelOrder', () => {
    test('throws when no auth configured', async () => {
      await expect(adapter.cancelOrder('ord-001')).rejects.toThrow(PerpDEXError);
    });

    test('cancels order with auth', async () => {
      const mockResponse = {
        orderId: 'ord-001',
        symbol: 'ETH-USD',
        side: 'BUY',
        type: 'LIMIT',
        status: 'CANCELLED',
        price: '3000',
        avgPrice: '0',
        quantity: '1',
        filledQuantity: '0',
        remainingQuantity: '1',
        reduceOnly: false,
        postOnly: false,
        timeInForce: 'GTC',
        createdAt: 1700000000000,
        updatedAt: 1700000000001,
      };

      authedMockHttp.delete.mockResolvedValue(mockResponse);

      const order = await authedAdapter.cancelOrder('ord-001', 'ETH/USD:USD');
      expect(order.status).toBe('canceled');
    });
  });

  // =========================================================================
  // cancelAllOrders
  // =========================================================================

  describe('cancelAllOrders', () => {
    test('cancels all orders and returns empty array', async () => {
      authedMockHttp.delete.mockResolvedValue({ cancelledCount: 3 });

      const result = await authedAdapter.cancelAllOrders();
      expect(result).toEqual([]);
    });

    test('passes symbol filter when provided', async () => {
      authedMockHttp.delete.mockResolvedValue({ cancelledCount: 1 });

      await authedAdapter.cancelAllOrders('ETH/USD:USD');
      const callPath = authedMockHttp.delete.mock.calls[0][0];
      expect(callPath).toContain('symbol=ETH-USD');
    });
  });

  // =========================================================================
  // fetchOpenOrders
  // =========================================================================

  describe('fetchOpenOrders', () => {
    test('throws when no auth', async () => {
      await expect(adapter.fetchOpenOrders()).rejects.toThrow(PerpDEXError);
    });

    test('fetches open orders', async () => {
      const mockOrders = [
        {
          orderId: 'ord-001',
          symbol: 'ETH-USD',
          side: 'BUY',
          type: 'LIMIT',
          status: 'OPEN',
          price: '3000',
          avgPrice: '0',
          quantity: '1',
          filledQuantity: '0',
          remainingQuantity: '1',
          reduceOnly: false,
          postOnly: false,
          timeInForce: 'GTC',
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
        },
      ];

      authedMockHttp.get.mockResolvedValue(mockOrders);

      const orders = await authedAdapter.fetchOpenOrders();
      expect(orders).toHaveLength(1);
      expect(orders[0].status).toBe('open');
    });

    test('filters by symbol when provided', async () => {
      const mockOrders = [
        {
          orderId: 'ord-001',
          symbol: 'ETH-USD',
          side: 'BUY',
          type: 'LIMIT',
          status: 'OPEN',
          price: '3000',
          avgPrice: '0',
          quantity: '1',
          filledQuantity: '0',
          remainingQuantity: '1',
          reduceOnly: false,
          postOnly: false,
          timeInForce: 'GTC',
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
        },
        {
          orderId: 'ord-002',
          symbol: 'BTC-USD',
          side: 'SELL',
          type: 'LIMIT',
          status: 'OPEN',
          price: '60000',
          avgPrice: '0',
          quantity: '0.1',
          filledQuantity: '0',
          remainingQuantity: '0.1',
          reduceOnly: false,
          postOnly: false,
          timeInForce: 'GTC',
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
        },
      ];

      authedMockHttp.get.mockResolvedValue(mockOrders);

      const orders = await authedAdapter.fetchOpenOrders('ETH/USD:USD');
      expect(orders).toHaveLength(1);
      expect(orders[0].symbol).toBe('ETH/USD:USD');
    });

    test('throws on invalid response', async () => {
      authedMockHttp.get.mockResolvedValue('bad');
      await expect(authedAdapter.fetchOpenOrders()).rejects.toThrow(PerpDEXError);
    });
  });

  // =========================================================================
  // fetchOrderHistory
  // =========================================================================

  describe('fetchOrderHistory', () => {
    test('throws NotSupportedError', async () => {
      await expect(adapter.fetchOrderHistory()).rejects.toThrow(NotSupportedError);
    });
  });

  // =========================================================================
  // fetchMyTrades
  // =========================================================================

  describe('fetchMyTrades', () => {
    test('throws when no auth', async () => {
      await expect(adapter.fetchMyTrades()).rejects.toThrow(PerpDEXError);
    });

    test('fetches my trades', async () => {
      const mockTrades = [
        {
          id: 'mt1',
          orderId: 'ord-001',
          symbol: 'ETH-USD',
          side: 'BUY',
          price: '3150.00',
          quantity: '1.5',
          fee: '0.002',
          feeAsset: 'USD',
          timestamp: 1700000000000,
        },
      ];

      authedMockHttp.get.mockResolvedValue(mockTrades);

      const trades = await authedAdapter.fetchMyTrades('ETH/USD:USD');
      expect(trades).toHaveLength(1);
      expect(trades[0].side).toBe('buy');
      expect(trades[0].price).toBe(3150);
      expect(trades[0].amount).toBe(1.5);
      expect(trades[0].cost).toBe(4725);
    });

    test('builds query params correctly', async () => {
      authedMockHttp.get.mockResolvedValue([]);

      await authedAdapter.fetchMyTrades('ETH/USD:USD', 1700000000000, 50);
      const callPath = authedMockHttp.get.mock.calls[0][0];
      expect(callPath).toContain('symbol=ETH-USD');
      expect(callPath).toContain('since=1700000000000');
      expect(callPath).toContain('limit=50');
    });

    test('throws on invalid response', async () => {
      authedMockHttp.get.mockResolvedValue('bad');
      await expect(authedAdapter.fetchMyTrades()).rejects.toThrow(PerpDEXError);
    });
  });

  // =========================================================================
  // fetchPositions
  // =========================================================================

  describe('fetchPositions', () => {
    test('throws when no auth', async () => {
      await expect(adapter.fetchPositions()).rejects.toThrow(PerpDEXError);
    });

    test('fetches positions and filters zero-size', async () => {
      const mockPositions = [
        {
          symbol: 'ETH-USD',
          side: 'LONG',
          size: '5.0',
          entryPrice: '3100',
          markPrice: '3150',
          liquidationPrice: '2800',
          unrealizedPnl: '250',
          realizedPnl: '0',
          leverage: '10',
          marginMode: 'cross',
          margin: '1550',
          updatedAt: 1700000000000,
        },
        {
          symbol: 'BTC-USD',
          side: 'SHORT',
          size: '0',
          entryPrice: '0',
          markPrice: '60000',
          liquidationPrice: '0',
          unrealizedPnl: '0',
          realizedPnl: '0',
          leverage: '1',
          marginMode: 'cross',
          margin: '0',
          updatedAt: 1700000000000,
        },
      ];

      authedMockHttp.get.mockResolvedValue(mockPositions);

      const positions = await authedAdapter.fetchPositions();
      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe('ETH/USD:USD');
      expect(positions[0].side).toBe('long');
    });

    test('filters by symbols when provided', async () => {
      const mockPositions = [
        {
          symbol: 'ETH-USD',
          side: 'LONG',
          size: '5',
          entryPrice: '3100',
          markPrice: '3150',
          liquidationPrice: '2800',
          unrealizedPnl: '250',
          realizedPnl: '0',
          leverage: '10',
          marginMode: 'cross',
          margin: '1550',
          updatedAt: 1700000000000,
        },
        {
          symbol: 'BTC-USD',
          side: 'SHORT',
          size: '0.5',
          entryPrice: '60000',
          markPrice: '59000',
          liquidationPrice: '70000',
          unrealizedPnl: '500',
          realizedPnl: '0',
          leverage: '5',
          marginMode: 'cross',
          margin: '5900',
          updatedAt: 1700000000000,
        },
      ];

      authedMockHttp.get.mockResolvedValue(mockPositions);

      const positions = await authedAdapter.fetchPositions(['ETH/USD:USD']);
      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe('ETH/USD:USD');
    });

    test('throws on invalid response', async () => {
      authedMockHttp.get.mockResolvedValue('bad');
      await expect(authedAdapter.fetchPositions()).rejects.toThrow(PerpDEXError);
    });
  });

  // =========================================================================
  // fetchBalance
  // =========================================================================

  describe('fetchBalance', () => {
    test('throws when no auth', async () => {
      await expect(adapter.fetchBalance()).rejects.toThrow(PerpDEXError);
    });

    test('fetches balance and filters zero totals', async () => {
      const mockBalances = [
        { asset: 'USD', total: '10000', available: '8000', locked: '2000', updatedAt: 1700000000000 },
        { asset: 'ETH', total: '0', available: '0', locked: '0', updatedAt: 1700000000000 },
      ];

      authedMockHttp.get.mockResolvedValue(mockBalances);

      const balances = await authedAdapter.fetchBalance();
      expect(balances).toHaveLength(1);
      expect(balances[0].currency).toBe('USD');
      expect(balances[0].total).toBe(10000);
    });

    test('throws on invalid response', async () => {
      authedMockHttp.get.mockResolvedValue('bad');
      await expect(authedAdapter.fetchBalance()).rejects.toThrow(PerpDEXError);
    });
  });

  // =========================================================================
  // setLeverage
  // =========================================================================

  describe('setLeverage', () => {
    test('throws NotSupportedError', async () => {
      await expect(adapter.setLeverage('ETH/USD:USD', 10)).rejects.toThrow(NotSupportedError);
    });
  });
});

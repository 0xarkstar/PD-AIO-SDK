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

const MOCK_PRODUCT_ID = 'bc7d5575-3711-4532-a000-312bfacfb767';

/** Helper to build mock /product response */
function mockProductResponse() {
  return {
    data: [
      {
        id: MOCK_PRODUCT_ID,
        ticker: 'ETHUSD',
        displayTicker: 'ETH-USD',
        status: 'ACTIVE',
        baseTokenName: 'ETH',
        quoteTokenName: 'USD',
        tickSize: '0.01',
        lotSize: '0.001',
        minQuantity: '0.01',
        maxQuantity: '500',
        maxLeverage: 50,
        makerFee: '0.0002',
        takerFee: '0.0005',
        volume24h: '50000',
        openInterest: '10000',
        fundingRate1h: '0.0001',
        minPrice: '0.1',
        maxPrice: '100000',
        onchainId: 2,
        engineType: 0,
      },
      {
        id: 'aaaa-bbbb-cccc',
        ticker: 'BTCUSD',
        displayTicker: 'BTC-USD',
        status: 'ACTIVE',
        baseTokenName: 'BTC',
        quoteTokenName: 'USD',
        tickSize: '0.1',
        lotSize: '0.0001',
        minQuantity: '0.001',
        maxQuantity: '25',
        maxLeverage: 100,
        makerFee: '0.0001',
        takerFee: '0.0004',
        volume24h: '220',
        openInterest: '500',
        fundingRate1h: '-0.0001',
        minPrice: '1',
        maxPrice: '10000000',
        onchainId: 1,
        engineType: 0,
      },
      {
        id: 'dddd-eeee-ffff',
        ticker: 'DOGEUSD',
        displayTicker: 'DOGE-USD',
        status: 'INACTIVE',
        baseTokenName: 'DOGE',
        quoteTokenName: 'USD',
        tickSize: '0.0001',
        lotSize: '1',
        minQuantity: '10',
        maxQuantity: '100000',
        maxLeverage: 20,
        makerFee: '0.0005',
        takerFee: '0.001',
        volume24h: '0',
        openInterest: '0',
        fundingRate1h: '0',
        minPrice: '0.0001',
        maxPrice: '100',
        onchainId: 3,
        engineType: 0,
      },
    ],
  };
}

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
      expect(adapter.has.fetchOHLCV).toBe(false);
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
    test('fetches and filters only ACTIVE markets', async () => {
      mockHttpClient.get.mockResolvedValue(mockProductResponse());

      const markets = await adapter.fetchMarkets();
      expect(markets).toHaveLength(2);
      expect(markets[0].symbol).toBe('ETH/USD:USD');
      expect(markets[1].symbol).toBe('BTC/USD:USD');
      expect(mockHttpClient.get).toHaveBeenCalledWith('/product');
    });

    test('throws on invalid response', async () => {
      mockHttpClient.get.mockResolvedValue({ data: 'not-an-array' });
      await expect(adapter.fetchMarkets()).rejects.toThrow(PerpDEXError);
    });
  });

  // =========================================================================
  // fetchTicker (via _fetchTicker)
  // =========================================================================

  describe('fetchTicker', () => {
    test('fetches ticker for symbol', async () => {
      // First call returns products (for UUID lookup), second returns market price
      mockHttpClient.get
        .mockResolvedValueOnce(mockProductResponse())
        .mockResolvedValueOnce({
          data: [
            {
              productId: MOCK_PRODUCT_ID,
              bestAskPrice: '3151.00',
              bestBidPrice: '3149.00',
              oraclePrice: '3150.00',
              price24hAgo: '3120.00',
            },
          ],
        });
      await adapter.initialize();

      const ticker = await adapter.fetchTicker('ETH/USD:USD');
      expect(ticker.symbol).toBe('ETH/USD:USD');
      expect(ticker.bid).toBe(3149);
      expect(ticker.ask).toBe(3151);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/product/market-price?productIds=${MOCK_PRODUCT_ID}`
      );
    });
  });

  // =========================================================================
  // fetchOrderBook
  // =========================================================================

  describe('fetchOrderBook', () => {
    const mockOB = {
      productId: MOCK_PRODUCT_ID,
      timestamp: 1700000000000,
      previousTimestamp: 1699999999000,
      bids: [['3150.00', '5']],
      asks: [['3151.00', '3']],
    };

    test('fetches order book', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce(mockProductResponse())
        .mockResolvedValueOnce(mockOB);
      await adapter.initialize();

      const ob = await adapter.fetchOrderBook('ETH/USD:USD');
      expect(ob.bids).toEqual([[3150, 5]]);
      expect(ob.asks).toEqual([[3151, 3]]);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/product/market-liquidity?productId=${MOCK_PRODUCT_ID}`
      );
    });
  });

  // =========================================================================
  // fetchTrades
  // =========================================================================

  describe('fetchTrades', () => {
    const mockTrades = {
      data: [
        {
          id: 't1',
          productId: MOCK_PRODUCT_ID,
          makerOrderId: 'mo1',
          takerOrderId: 'to1',
          makerSide: 1,
          takerSide: 0,
          price: '3150.00',
          filled: '1.0',
          makerFeeUsd: '0',
          takerFeeUsd: '0.945',
          createdAt: 1700000000000,
        },
      ],
    };

    test('fetches trades for symbol', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce(mockProductResponse())
        .mockResolvedValueOnce(mockTrades);
      await adapter.initialize();

      const trades = await adapter.fetchTrades('ETH/USD:USD');
      expect(trades).toHaveLength(1);
      expect(trades[0].side).toBe('buy');
      expect(trades[0].amount).toBe(1.0);
    });

    test('fetches trades with params', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce(mockProductResponse())
        .mockResolvedValueOnce(mockTrades);
      await adapter.initialize();

      await adapter.fetchTrades('ETH/USD:USD', { limit: 50, since: 1700000000000 });
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/order/trade?productId=${MOCK_PRODUCT_ID}&limit=50&since=1700000000000`
      );
    });

    test('throws on invalid trades response', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce(mockProductResponse())
        .mockResolvedValueOnce({ data: 'bad' });
      await adapter.initialize();
      await expect(adapter.fetchTrades('ETH/USD:USD')).rejects.toThrow(PerpDEXError);
    });
  });

  // =========================================================================
  // fetchFundingRate
  // =========================================================================

  describe('fetchFundingRate', () => {
    test('fetches funding rate', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce(mockProductResponse())
        .mockResolvedValueOnce({
          productId: MOCK_PRODUCT_ID,
          fundingRateProjected1h: '-0.000017773',
          fundingRate1h: '-0.000022881',
        });
      await adapter.initialize();

      const fr = await adapter.fetchFundingRate('ETH/USD:USD');
      expect(fr.fundingRate).toBe(-0.000022881);
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
    test('throws NotSupportedError', async () => {
      await expect(adapter.fetchOHLCV('ETH/USD:USD')).rejects.toThrow(NotSupportedError);
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
      // Verify it posts to /order not /orders
      expect(authedMockHttp.post.mock.calls[0][0]).toBe('/order');
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

      authedMockHttp.post.mockResolvedValue(mockResponse);

      const order = await authedAdapter.cancelOrder('ord-001', 'ETH/USD:USD');
      expect(order.status).toBe('canceled');
      // Verify it posts to /order/cancel
      expect(authedMockHttp.post.mock.calls[0][0]).toBe('/order/cancel');
    });
  });

  // =========================================================================
  // cancelAllOrders
  // =========================================================================

  describe('cancelAllOrders', () => {
    test('cancels all orders and returns empty array', async () => {
      authedMockHttp.post.mockResolvedValue({ cancelledCount: 3 });

      const result = await authedAdapter.cancelAllOrders();
      expect(result).toEqual([]);
      expect(authedMockHttp.post.mock.calls[0][0]).toBe('/order/cancel');
    });

    test('passes productId filter when symbol provided', async () => {
      authedMockHttp.get.mockResolvedValueOnce(mockProductResponse());
      authedMockHttp.post.mockResolvedValue({ cancelledCount: 1 });

      await authedAdapter.cancelAllOrders('ETH/USD:USD');
      const callBody = authedMockHttp.post.mock.calls[0][1].body;
      expect(callBody.productId).toBe(MOCK_PRODUCT_ID);
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
      // First call for product map, then for trades
      authedMockHttp.get
        .mockResolvedValueOnce(mockProductResponse())
        .mockResolvedValueOnce([
          {
            id: 'mt1',
            productId: MOCK_PRODUCT_ID,
            makerOrderId: 'mo1',
            takerOrderId: 'to1',
            makerSide: 1,
            takerSide: 0,
            price: '3150.00',
            filled: '1.5',
            makerFeeUsd: '0',
            takerFeeUsd: '0.002',
            createdAt: 1700000000000,
          },
        ]);

      const trades = await authedAdapter.fetchMyTrades('ETH/USD:USD');
      expect(trades).toHaveLength(1);
      expect(trades[0].side).toBe('buy');
      expect(trades[0].price).toBe(3150);
      expect(trades[0].amount).toBe(1.5);
      expect(trades[0].cost).toBe(4725);
    });

    test('builds query params correctly', async () => {
      authedMockHttp.get
        .mockResolvedValueOnce(mockProductResponse())
        .mockResolvedValueOnce([]);

      await authedAdapter.fetchMyTrades('ETH/USD:USD', 1700000000000, 50);
      const callPath = authedMockHttp.get.mock.calls[1][0];
      expect(callPath).toContain(`productId=${MOCK_PRODUCT_ID}`);
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

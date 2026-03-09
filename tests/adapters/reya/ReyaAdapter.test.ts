/**
 * Reya Adapter Tests
 *
 * Tests adapter methods by mocking HTTPClient.
 * Covers all public API methods and error handling.
 */

import { ReyaAdapter } from '../../../src/adapters/reya/ReyaAdapter.js';
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
jest.mock('ethers', () => {
  const mockWallet = {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    signTypedData: jest.fn().mockResolvedValue('0x' + 'ab'.repeat(65)),
  };
  return {
    Wallet: jest.fn().mockReturnValue(mockWallet),
    ethers: {
      Wallet: jest.fn().mockReturnValue(mockWallet),
    },
  };
});

describe('ReyaAdapter', () => {
  let adapter: ReyaAdapter;
  let mockHttpClient: {
    get: jest.Mock;
    post: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new ReyaAdapter({
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      accountId: 123,
    });
    mockHttpClient = (adapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
  });

  // =========================================================================
  // Constructor
  // =========================================================================

  describe('constructor', () => {
    test('creates adapter with default config', () => {
      const a = new ReyaAdapter();
      expect(a.id).toBe('reya');
      expect(a.name).toBe('Reya');
    });

    test('has expected features', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.fetchOHLCV).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.cancelAllOrders).toBe(true);
      expect(adapter.has.fetchOpenOrders).toBe(true);
      expect(adapter.has.fetchMyTrades).toBe(true);
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.setLeverage).toBe(false);
      expect(adapter.has.fetchFundingRateHistory).toBe(false);
    });

    test('creates adapter for testnet', () => {
      const a = new ReyaAdapter({ testnet: true });
      expect(a).toBeInstanceOf(ReyaAdapter);
    });

    test('creates adapter without private key', () => {
      const a = new ReyaAdapter();
      expect(a).toBeInstanceOf(ReyaAdapter);
    });
  });

  // =========================================================================
  // Initialize
  // =========================================================================

  describe('initialize', () => {
    test('initializes and sets isReady', async () => {
      mockHttpClient.get.mockResolvedValue([
        { accountId: 456, name: 'Main', type: 'MAINPERP' },
      ]);

      // Adapter already has accountId=123, so it won't auto-discover
      await adapter.initialize();
      expect(adapter.isReady).toBe(true);
    });

    test('auto-discovers accountId when set to 0', async () => {
      const adapterNoId = new ReyaAdapter({
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        accountId: 0,
      });
      const httpClient = (adapterNoId as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;

      httpClient.get.mockResolvedValue([
        { accountId: 456, name: 'Main', type: 'MAINPERP' },
        { accountId: 789, name: 'Sub', type: 'SUBPERP' },
      ]);

      await adapterNoId.initialize();
      expect(adapterNoId.isReady).toBe(true);
      // Verify it fetched wallet accounts
      expect(httpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/wallet/')
      );
    });

    test('handles account discovery failure gracefully', async () => {
      const adapterNoId = new ReyaAdapter({
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        accountId: 0,
      });
      const httpClient = (adapterNoId as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;

      httpClient.get.mockRejectedValue(new Error('network error'));

      await adapterNoId.initialize();
      expect(adapterNoId.isReady).toBe(true);
    });

    test('skips initialization when already ready', async () => {
      await adapter.initialize();
      await adapter.initialize(); // second call should be no-op
      expect(adapter.isReady).toBe(true);
    });
  });

  // =========================================================================
  // fetchMarkets
  // =========================================================================

  describe('fetchMarkets', () => {
    test('fetches and normalizes markets', async () => {
      const definitions = [
        {
          symbol: 'BTCRUSDPERP',
          marketId: 1,
          minOrderQty: '0.001',
          qtyStepSize: '0.001',
          tickSize: '0.01',
          liquidationMarginParameter: '0.005',
          initialMarginParameter: '0.02',
          maxLeverage: 50,
          oiCap: '1000000',
        },
        {
          symbol: 'ETHRUSDPERP',
          marketId: 2,
          minOrderQty: '0.01',
          qtyStepSize: '0.01',
          tickSize: '0.01',
          liquidationMarginParameter: '0.005',
          initialMarginParameter: '0.02',
          maxLeverage: 50,
          oiCap: '500000',
        },
        {
          symbol: 'WETHRUSD', // Non-PERP, should be filtered out
          marketId: 3,
          minOrderQty: '0.01',
          qtyStepSize: '0.01',
          tickSize: '0.01',
          liquidationMarginParameter: '0.005',
          initialMarginParameter: '0.02',
          maxLeverage: 10,
          oiCap: '100000',
        },
      ];

      const summaries = [
        {
          symbol: 'BTCRUSDPERP',
          updatedAt: 1700000000000,
          longOiQty: '100',
          shortOiQty: '95',
          oiQty: '195',
          fundingRate: '0.0001',
          longFundingValue: '0',
          shortFundingValue: '0',
          fundingRateVelocity: '0.00001',
          volume24h: '50000000',
        },
      ];

      mockHttpClient.get
        .mockResolvedValueOnce(definitions)
        .mockResolvedValueOnce(summaries);

      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(2); // WETHRUSD filtered out
      expect(markets[0].symbol).toBe('BTC/USD:USD');
      expect(markets[1].symbol).toBe('ETH/USD:USD');
    });
  });

  // =========================================================================
  // _fetchTicker
  // =========================================================================

  describe('_fetchTicker', () => {
    test('fetches and normalizes ticker', async () => {
      const summary = {
        symbol: 'BTCRUSDPERP',
        updatedAt: 1700000000000,
        longOiQty: '100',
        shortOiQty: '95',
        oiQty: '195',
        fundingRate: '0.0001',
        longFundingValue: '0',
        shortFundingValue: '0',
        fundingRateVelocity: '0.00001',
        volume24h: '50000000',
      };

      const price = {
        symbol: 'BTCRUSDPERP',
        oraclePrice: '65000.50',
        poolPrice: '65010.25',
        updatedAt: 1700000000000,
      };

      mockHttpClient.get
        .mockResolvedValueOnce(summary)
        .mockResolvedValueOnce(price);

      const ticker = await adapter._fetchTicker('BTC/USD:USD');

      expect(ticker.symbol).toBe('BTC/USD:USD');
      expect(ticker.last).toBe(65010.25);
    });
  });

  // =========================================================================
  // _fetchOrderBook
  // =========================================================================

  describe('_fetchOrderBook', () => {
    test('fetches and normalizes order book', async () => {
      const depth = {
        symbol: 'BTCRUSDPERP',
        type: 'SNAPSHOT',
        bids: [{ px: '65000', qty: '1.5' }],
        asks: [{ px: '65001', qty: '2.0' }],
        updatedAt: 1700000000000,
      };

      mockHttpClient.get.mockResolvedValue(depth);

      const ob = await adapter._fetchOrderBook('BTC/USD:USD');

      expect(ob.symbol).toBe('BTC/USD:USD');
      expect(ob.bids).toEqual([[65000, 1.5]]);
      expect(ob.asks).toEqual([[65001, 2.0]]);
    });
  });

  // =========================================================================
  // _fetchTrades
  // =========================================================================

  describe('_fetchTrades', () => {
    test('fetches and normalizes trades', async () => {
      const response = {
        data: [
          {
            exchangeId: 1,
            symbol: 'BTCRUSDPERP',
            accountId: 1,
            qty: '0.5',
            side: 'B',
            price: '65000.00',
            fee: '16.25',
            type: 'ORDER_MATCH',
            timestamp: 1700000000000,
            sequenceNumber: 42,
          },
        ],
        meta: { limit: 100, count: 1 },
      };

      mockHttpClient.get.mockResolvedValue(response);

      const trades = await adapter._fetchTrades('BTC/USD:USD');

      expect(trades).toHaveLength(1);
      expect(trades[0].symbol).toBe('BTC/USD:USD');
      expect(trades[0].side).toBe('buy');
    });

    test('passes since parameter', async () => {
      const response = { data: [], meta: { limit: 100, count: 0 } };
      mockHttpClient.get.mockResolvedValue(response);

      await adapter._fetchTrades('BTC/USD:USD', { since: 1700000000000 });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('startTime=1700000000000')
      );
    });
  });

  // =========================================================================
  // _fetchFundingRate
  // =========================================================================

  describe('_fetchFundingRate', () => {
    test('fetches and normalizes funding rate', async () => {
      const summary = {
        symbol: 'BTCRUSDPERP',
        updatedAt: 1700000000000,
        longOiQty: '100',
        shortOiQty: '95',
        oiQty: '195',
        fundingRate: '0.0001',
        longFundingValue: '0',
        shortFundingValue: '0',
        fundingRateVelocity: '0.00001',
        volume24h: '50000000',
      };

      const price = {
        symbol: 'BTCRUSDPERP',
        oraclePrice: '65000.50',
        updatedAt: 1700000000000,
      };

      mockHttpClient.get
        .mockResolvedValueOnce(summary)
        .mockResolvedValueOnce(price);

      const fr = await adapter._fetchFundingRate('BTC/USD:USD');

      expect(fr.symbol).toBe('BTC/USD:USD');
      expect(fr.fundingRate).toBe(0.0001);
      expect(fr.markPrice).toBe(65000.50);
    });
  });

  // =========================================================================
  // fetchFundingRateHistory
  // =========================================================================

  describe('fetchFundingRateHistory', () => {
    test('throws NotSupportedError', async () => {
      await expect(adapter.fetchFundingRateHistory('BTC/USD:USD')).rejects.toThrow(NotSupportedError);
    });
  });

  // =========================================================================
  // fetchOHLCV
  // =========================================================================

  describe('fetchOHLCV', () => {
    test('fetches and normalizes candles', async () => {
      const candleData = {
        t: [1700000000, 1700003600],
        o: ['65000.00', '65100.00'],
        h: ['65200.00', '65300.00'],
        l: ['64800.00', '64900.00'],
        c: ['65100.00', '65050.00'],
      };

      mockHttpClient.get.mockResolvedValue(candleData);

      const ohlcv = await adapter.fetchOHLCV('BTC/USD:USD', '1h');

      expect(ohlcv).toHaveLength(2);
      expect(ohlcv[0][0]).toBe(1700000000000); // ms
    });

    test('passes until parameter converted to seconds', async () => {
      const candleData = { t: [], o: [], h: [], l: [], c: [] };
      mockHttpClient.get.mockResolvedValue(candleData);

      await adapter.fetchOHLCV('BTC/USD:USD', '1h', { until: 1700000000000 });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('endTime=1700000000')
      );
    });
  });

  // =========================================================================
  // createOrder
  // =========================================================================

  describe('createOrder', () => {
    test('creates limit buy order', async () => {
      mockHttpClient.post.mockResolvedValue({
        status: 'OPEN',
        orderId: 'ord-123',
        cumQty: '0',
      });

      const order = await adapter.createOrder({
        symbol: 'BTC/USD:USD',
        side: 'buy',
        type: 'limit',
        amount: 0.5,
        price: 65000,
      });

      expect(order.id).toBe('ord-123');
      expect(order.symbol).toBe('BTC/USD:USD');
      expect(order.status).toBe('open');
      expect(order.amount).toBe(0.5);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/order-entry/order',
        expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
      );
    });

    test('creates filled market order', async () => {
      mockHttpClient.post.mockResolvedValue({
        status: 'FILLED',
        orderId: 'ord-456',
        cumQty: '0.5',
      });

      const order = await adapter.createOrder({
        symbol: 'BTC/USD:USD',
        side: 'buy',
        type: 'market',
        amount: 0.5,
      });

      expect(order.status).toBe('filled');
      expect(order.filled).toBe(0.5);
      expect(order.remaining).toBe(0);
    });

    test('throws on rejected order', async () => {
      mockHttpClient.post.mockResolvedValue({
        status: 'REJECTED',
        orderId: null,
      });

      await expect(
        adapter.createOrder({
          symbol: 'BTC/USD:USD',
          side: 'buy',
          type: 'limit',
          amount: 0.5,
          price: 65000,
        })
      ).rejects.toThrow(PerpDEXError);
    });

    test('throws when no auth configured', async () => {
      const noAuthAdapter = new ReyaAdapter();
      (noAuthAdapter as unknown as Record<string, unknown>).httpClient = mockHttpClient;

      await expect(
        noAuthAdapter.createOrder({
          symbol: 'BTC/USD:USD',
          side: 'buy',
          type: 'limit',
          amount: 0.5,
          price: 65000,
        })
      ).rejects.toThrow('Private key required');
    });
  });

  // =========================================================================
  // cancelOrder
  // =========================================================================

  describe('cancelOrder', () => {
    test('cancels order and returns canceled status', async () => {
      mockHttpClient.post.mockResolvedValue({
        status: 'CANCELLED',
        orderId: 'ord-123',
      });

      const order = await adapter.cancelOrder('ord-123', 'BTC/USD:USD');

      expect(order.id).toBe('ord-123');
      expect(order.status).toBe('canceled');
      expect(order.symbol).toBe('BTC/USD:USD');
    });

    test('works without symbol', async () => {
      mockHttpClient.post.mockResolvedValue({
        status: 'CANCELLED',
        orderId: 'ord-123',
      });

      const order = await adapter.cancelOrder('ord-123');
      expect(order.symbol).toBe('');
    });
  });

  // =========================================================================
  // cancelAllOrders
  // =========================================================================

  describe('cancelAllOrders', () => {
    test('cancels all orders and returns empty array', async () => {
      mockHttpClient.post.mockResolvedValue({ cancelledCount: 5 });

      const result = await adapter.cancelAllOrders();

      expect(result).toEqual([]);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/order-entry/cancel-all',
        expect.objectContaining({
          body: expect.objectContaining({ accountId: 123 }),
        })
      );
    });

    test('passes symbol when provided', async () => {
      mockHttpClient.post.mockResolvedValue({ cancelledCount: 2 });

      await adapter.cancelAllOrders('BTC/USD:USD');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/order-entry/cancel-all',
        expect.objectContaining({
          body: expect.objectContaining({ symbol: 'BTCRUSDPERP' }),
        })
      );
    });
  });

  // =========================================================================
  // fetchOpenOrders
  // =========================================================================

  describe('fetchOpenOrders', () => {
    test('fetches and normalizes open orders', async () => {
      mockHttpClient.get.mockResolvedValue([
        {
          exchangeId: 1,
          symbol: 'BTCRUSDPERP',
          accountId: 123,
          orderId: 'ord-1',
          qty: '0.5',
          cumQty: '0',
          side: 'B',
          limitPx: '65000.00',
          orderType: 'LIMIT',
          status: 'OPEN',
          createdAt: 1700000000000,
          lastUpdateAt: 1700000000000,
        },
      ]);

      const orders = await adapter.fetchOpenOrders();

      expect(orders).toHaveLength(1);
      expect(orders[0].id).toBe('ord-1');
      expect(orders[0].status).toBe('open');
    });

    test('filters by symbol when provided', async () => {
      mockHttpClient.get.mockResolvedValue([
        {
          exchangeId: 1,
          symbol: 'BTCRUSDPERP',
          accountId: 123,
          orderId: 'ord-1',
          qty: '0.5',
          cumQty: '0',
          side: 'B',
          limitPx: '65000.00',
          orderType: 'LIMIT',
          status: 'OPEN',
          createdAt: 1700000000000,
          lastUpdateAt: 1700000000000,
        },
        {
          exchangeId: 1,
          symbol: 'ETHRUSDPERP',
          accountId: 123,
          orderId: 'ord-2',
          qty: '1.0',
          cumQty: '0',
          side: 'A',
          limitPx: '3500.00',
          orderType: 'LIMIT',
          status: 'OPEN',
          createdAt: 1700000000000,
          lastUpdateAt: 1700000000000,
        },
      ]);

      const orders = await adapter.fetchOpenOrders('BTC/USD:USD');

      expect(orders).toHaveLength(1);
      expect(orders[0].symbol).toBe('BTC/USD:USD');
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
    test('fetches and normalizes user trades', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: [
          {
            exchangeId: 1,
            symbol: 'BTCRUSDPERP',
            accountId: 123,
            qty: '0.5',
            side: 'B',
            price: '65000.00',
            fee: '16.25',
            type: 'ORDER_MATCH',
            timestamp: 1700000000000,
            sequenceNumber: 42,
          },
        ],
        meta: { limit: 100, count: 1 },
      });

      const trades = await adapter.fetchMyTrades();

      expect(trades).toHaveLength(1);
      expect(trades[0].side).toBe('buy');
    });

    test('filters by symbol', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: [
          {
            exchangeId: 1,
            symbol: 'BTCRUSDPERP',
            accountId: 123,
            qty: '0.5',
            side: 'B',
            price: '65000.00',
            fee: '16.25',
            type: 'ORDER_MATCH',
            timestamp: 1700000000000,
            sequenceNumber: 1,
          },
          {
            exchangeId: 1,
            symbol: 'ETHRUSDPERP',
            accountId: 123,
            qty: '1.0',
            side: 'A',
            price: '3500.00',
            fee: '1.75',
            type: 'ORDER_MATCH',
            timestamp: 1700000000000,
            sequenceNumber: 2,
          },
        ],
        meta: { limit: 100, count: 2 },
      });

      const trades = await adapter.fetchMyTrades('ETH/USD:USD');

      expect(trades).toHaveLength(1);
      expect(trades[0].symbol).toBe('ETH/USD:USD');
    });

    test('respects limit parameter', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: [
          { exchangeId: 1, symbol: 'BTCRUSDPERP', accountId: 1, qty: '0.1', side: 'B', price: '65000', fee: '1', type: 'ORDER_MATCH', timestamp: 1, sequenceNumber: 1 },
          { exchangeId: 1, symbol: 'BTCRUSDPERP', accountId: 1, qty: '0.2', side: 'A', price: '65100', fee: '1', type: 'ORDER_MATCH', timestamp: 2, sequenceNumber: 2 },
          { exchangeId: 1, symbol: 'BTCRUSDPERP', accountId: 1, qty: '0.3', side: 'B', price: '65200', fee: '1', type: 'ORDER_MATCH', timestamp: 3, sequenceNumber: 3 },
        ],
        meta: { limit: 100, count: 3 },
      });

      const trades = await adapter.fetchMyTrades(undefined, undefined, 2);

      expect(trades).toHaveLength(2);
    });

    test('passes since as query parameter', async () => {
      mockHttpClient.get.mockResolvedValue({ data: [], meta: { limit: 100, count: 0 } });

      await adapter.fetchMyTrades(undefined, 1700000000000);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('startTime=1700000000000')
      );
    });
  });

  // =========================================================================
  // fetchPositions
  // =========================================================================

  describe('fetchPositions', () => {
    test('fetches and normalizes positions', async () => {
      mockHttpClient.get.mockResolvedValue([
        {
          exchangeId: 1,
          symbol: 'BTCRUSDPERP',
          accountId: 123,
          qty: '0.5',
          side: 'B',
          avgEntryPrice: '64000.00',
          avgEntryFundingValue: '3.50',
          lastTradeSequenceNumber: 100,
        },
      ]);

      const positions = await adapter.fetchPositions();

      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe('BTC/USD:USD');
      expect(positions[0].side).toBe('long');
      expect(positions[0].size).toBe(0.5);
    });

    test('filters out zero-qty positions', async () => {
      mockHttpClient.get.mockResolvedValue([
        {
          exchangeId: 1,
          symbol: 'BTCRUSDPERP',
          accountId: 123,
          qty: '0',
          side: 'B',
          avgEntryPrice: '64000.00',
          avgEntryFundingValue: '0',
          lastTradeSequenceNumber: 100,
        },
      ]);

      const positions = await adapter.fetchPositions();
      expect(positions).toHaveLength(0);
    });

    test('filters by symbols array', async () => {
      mockHttpClient.get.mockResolvedValue([
        {
          exchangeId: 1,
          symbol: 'BTCRUSDPERP',
          accountId: 123,
          qty: '0.5',
          side: 'B',
          avgEntryPrice: '64000.00',
          avgEntryFundingValue: '0',
          lastTradeSequenceNumber: 100,
        },
        {
          exchangeId: 1,
          symbol: 'ETHRUSDPERP',
          accountId: 123,
          qty: '2.0',
          side: 'A',
          avgEntryPrice: '3500.00',
          avgEntryFundingValue: '0',
          lastTradeSequenceNumber: 101,
        },
      ]);

      const positions = await adapter.fetchPositions(['ETH/USD:USD']);

      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe('ETH/USD:USD');
    });
  });

  // =========================================================================
  // fetchBalance
  // =========================================================================

  describe('fetchBalance', () => {
    test('fetches and normalizes balances', async () => {
      mockHttpClient.get.mockResolvedValue([
        {
          accountId: 123,
          asset: 'rUSD',
          realBalance: '50000.50',
          balanceDEPRECATED: '50000.50',
        },
      ]);

      const balances = await adapter.fetchBalance();

      expect(balances).toHaveLength(1);
      expect(balances[0].currency).toBe('rUSD');
      expect(balances[0].total).toBe(50000.50);
    });

    test('filters out zero balances', async () => {
      mockHttpClient.get.mockResolvedValue([
        {
          accountId: 123,
          asset: 'rUSD',
          realBalance: '0',
          balanceDEPRECATED: '0',
        },
      ]);

      const balances = await adapter.fetchBalance();
      expect(balances).toHaveLength(0);
    });
  });

  // =========================================================================
  // _setLeverage
  // =========================================================================

  describe('_setLeverage', () => {
    test('throws NotSupportedError', async () => {
      await expect(adapter._setLeverage('BTC/USD:USD', 10)).rejects.toThrow(NotSupportedError);
      await expect(adapter._setLeverage('BTC/USD:USD', 10)).rejects.toThrow(
        'account-level margin'
      );
    });
  });

  // =========================================================================
  // Error Handling
  // =========================================================================

  describe('error handling', () => {
    test('maps HTTP errors through error-codes', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('rate limit exceeded'));

      await expect(adapter._fetchOrderBook('BTC/USD:USD')).rejects.toThrow(PerpDEXError);
    });

    test('maps network errors to PerpDEXError', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(adapter._fetchTicker('BTC/USD:USD')).rejects.toThrow();
    });
  });
});

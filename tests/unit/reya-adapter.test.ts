/**
 * ReyaAdapter Tests
 *
 * Tests for Reya Exchange adapter (L2 perpetual DEX with EIP-712 signing)
 */

import { ReyaAdapter } from '../../src/adapters/reya/ReyaAdapter.js';
import { ReyaNormalizer } from '../../src/adapters/reya/ReyaNormalizer.js';
import { PerpDEXError, RateLimitError, InvalidSignatureError, OrderNotFoundError, InsufficientMarginError, InvalidOrderError, ExchangeUnavailableError, NotSupportedError, BadRequestError } from '../../src/types/errors.js';
import { mapReyaError, extractErrorCode, isRetryableError, mapError, REYA_CLIENT_ERRORS, REYA_SERVER_ERRORS, REYA_RATE_LIMIT_ERROR } from '../../src/adapters/reya/error-codes.js';
import { buildOrderRequest, mapOrderStatus, parseReyaSymbol, mapTimeframeToResolution } from '../../src/adapters/reya/utils.js';
import { REYA_MAINNET_API, REYA_TESTNET_API, REYA_RATE_LIMIT, REYA_ORDER_STATUS, unifiedToReya, reyaToUnified, REYA_EXCHANGE_ID, REYA_FUNDING_INTERVAL_HOURS } from '../../src/adapters/reya/constants.js';

// Mock HTTPClient
jest.mock('../../src/core/http/HTTPClient.js', () => ({
  HTTPClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock ethers for ReyaAuth
jest.mock('ethers', () => ({
  Wallet: jest.fn().mockImplementation(() => ({
    address: '0xMockAddress',
    signTypedData: jest.fn().mockResolvedValue('0xMockSignature'),
  })),
  ethers: {
    Wallet: jest.fn().mockImplementation(() => ({
      address: '0xMockAddress',
      signTypedData: jest.fn().mockResolvedValue('0xMockSignature'),
    })),
  },
}));

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
    adapter = new ReyaAdapter();
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

    test('creates adapter with privateKey', () => {
      const a = new ReyaAdapter({
        privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      });
      expect(a).toBeInstanceOf(ReyaAdapter);
    });

    test('creates adapter for testnet', () => {
      const a = new ReyaAdapter({ testnet: true });
      expect(a).toBeInstanceOf(ReyaAdapter);
    });

    test('creates adapter with accountId', () => {
      const a = new ReyaAdapter({ accountId: 42 });
      expect(a).toBeInstanceOf(ReyaAdapter);
    });

    test('creates adapter with custom timeout', () => {
      const a = new ReyaAdapter({ timeout: 60000 });
      expect(a).toBeInstanceOf(ReyaAdapter);
    });

    test('creates adapter with exchangeId', () => {
      const a = new ReyaAdapter({ exchangeId: 2 });
      expect(a).toBeInstanceOf(ReyaAdapter);
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
      expect(adapter.has.fetchOpenOrders).toBe(true);
      expect(adapter.has.fetchOrderHistory).toBe(false);
      expect(adapter.has.fetchMyTrades).toBe(true);
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.setLeverage).toBe(false);
      expect(adapter.has.editOrder).toBe(false);
    });
  });

  // =========================================================================
  // Initialize / Disconnect
  // =========================================================================

  describe('initialize', () => {
    test('initializes adapter', async () => {
      await adapter.initialize();
      expect(adapter.isReady).toBe(true);
    });

    test('does not re-initialize if already ready', async () => {
      await adapter.initialize();
      await adapter.initialize();
      expect(adapter.isReady).toBe(true);
    });

    test('auto-discovers account ID when auth is present', async () => {
      const authAdapter = new ReyaAdapter({
        privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      });
      const authMock = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
      authMock.get.mockResolvedValue([
        { accountId: 5, name: 'Main', type: 'MAINPERP' },
        { accountId: 6, name: 'Sub', type: 'SUBPERP' },
      ]);

      await authAdapter.initialize();
      expect(authAdapter.isReady).toBe(true);
    });
  });

  describe('disconnect', () => {
    test('disconnects cleanly', async () => {
      await adapter.initialize();
      await expect(adapter.disconnect()).resolves.not.toThrow();
    });
  });

  // =========================================================================
  // fetchMarkets
  // =========================================================================

  describe('fetchMarkets', () => {
    const mockDefinitions = [
      {
        symbol: 'BTCRUSDPERP',
        marketId: 1,
        minOrderQty: '0.001',
        qtyStepSize: '0.001',
        tickSize: '0.1',
        liquidationMarginParameter: '0.005',
        initialMarginParameter: '0.01',
        maxLeverage: 100,
        oiCap: '1000000',
      },
      {
        symbol: 'ETHRUSDPERP',
        marketId: 2,
        minOrderQty: '0.01',
        qtyStepSize: '0.01',
        tickSize: '0.01',
        liquidationMarginParameter: '0.005',
        initialMarginParameter: '0.01',
        maxLeverage: 50,
        oiCap: '500000',
      },
      {
        symbol: 'WETHRUSD',
        marketId: 3,
        minOrderQty: '0.01',
        qtyStepSize: '0.01',
        tickSize: '0.01',
        liquidationMarginParameter: '0.005',
        initialMarginParameter: '0.01',
        maxLeverage: 10,
        oiCap: '100000',
      },
    ];

    const mockSummaries = [
      {
        symbol: 'BTCRUSDPERP',
        updatedAt: 1700000000000,
        longOiQty: '100',
        shortOiQty: '80',
        oiQty: '180',
        fundingRate: '0.0001',
        longFundingValue: '10',
        shortFundingValue: '8',
        fundingRateVelocity: '0.00001',
        volume24h: '5000000',
        pxChange24h: '0.02',
      },
      {
        symbol: 'ETHRUSDPERP',
        updatedAt: 1700000000000,
        longOiQty: '500',
        shortOiQty: '400',
        oiQty: '900',
        fundingRate: '0.00005',
        longFundingValue: '5',
        shortFundingValue: '4',
        fundingRateVelocity: '0.000005',
        volume24h: '3000000',
        pxChange24h: '0.01',
      },
    ];

    test('fetches and normalizes markets', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce(mockDefinitions)
        .mockResolvedValueOnce(mockSummaries);

      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(2); // Only PERP symbols
      expect(markets[0].symbol).toBe('BTC/USD:USD');
      expect(markets[0].base).toBe('BTC');
      expect(markets[0].quote).toBe('USD');
      expect(markets[0].active).toBe(true);
      expect(markets[0].priceTickSize).toBe(0.1);
      expect(markets[0].amountStepSize).toBe(0.001);
      expect(markets[0].minAmount).toBe(0.001);
      expect(markets[0].maxLeverage).toBe(100);
    });

    test('filters out non-PERP symbols', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce(mockDefinitions)
        .mockResolvedValueOnce(mockSummaries);

      const markets = await adapter.fetchMarkets();

      const spot = markets.find((m) => m.id === '3');
      expect(spot).toBeUndefined();
    });

    test('maps summary data to definitions', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce(mockDefinitions)
        .mockResolvedValueOnce(mockSummaries);

      const markets = await adapter.fetchMarkets();

      expect(markets[1].symbol).toBe('ETH/USD:USD');
      expect(markets[1].maxLeverage).toBe(50);
    });
  });

  // =========================================================================
  // _fetchTicker
  // =========================================================================

  describe('fetchTicker', () => {
    const mockSummary = {
      symbol: 'BTCRUSDPERP',
      updatedAt: 1700000000000,
      longOiQty: '100',
      shortOiQty: '80',
      oiQty: '180',
      fundingRate: '0.0001',
      longFundingValue: '10',
      shortFundingValue: '8',
      fundingRateVelocity: '0.00001',
      volume24h: '5000000',
      pxChange24h: '0.02',
    };

    const mockPrice = {
      symbol: 'BTCRUSDPERP',
      oraclePrice: '50000.5',
      poolPrice: '50001.0',
      updatedAt: 1700000000000,
    };

    test('fetches and normalizes ticker', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce(mockSummary)
        .mockResolvedValueOnce(mockPrice);

      const ticker = await adapter.fetchTicker('BTC/USD:USD');

      expect(ticker.symbol).toBe('BTC/USD:USD');
      expect(ticker.last).toBe(50001.0);
      expect(ticker.quoteVolume).toBe(5000000);
      expect(ticker.timestamp).toBe(1700000000000);
    });

    test('converts symbol correctly in API call', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce(mockSummary)
        .mockResolvedValueOnce(mockPrice);

      await adapter.fetchTicker('ETH/USD:USD');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/market-data/market/summary?symbol=ETHRUSDPERP'
      );
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/market-data/price?symbol=ETHRUSDPERP'
      );
    });
  });

  // =========================================================================
  // _fetchOrderBook
  // =========================================================================

  describe('fetchOrderBook', () => {
    const mockDepth = {
      symbol: 'BTCRUSDPERP',
      type: 'SNAPSHOT' as const,
      bids: [{ px: '50000', qty: '1.5' }, { px: '49999', qty: '2.0' }],
      asks: [{ px: '50001', qty: '2.0' }, { px: '50002', qty: '3.0' }],
      updatedAt: 1700000000000,
    };

    test('fetches and normalizes order book', async () => {
      mockHttpClient.get.mockResolvedValue(mockDepth);

      const ob = await adapter.fetchOrderBook('BTC/USD:USD');

      expect(ob.symbol).toBe('BTC/USD:USD');
      expect(ob.exchange).toBe('reya');
      expect(ob.bids).toHaveLength(2);
      expect(ob.bids[0]).toEqual([50000, 1.5]);
      expect(ob.asks[0]).toEqual([50001, 2.0]);
      expect(ob.timestamp).toBe(1700000000000);
    });

    test('calls correct API endpoint', async () => {
      mockHttpClient.get.mockResolvedValue(mockDepth);

      await adapter.fetchOrderBook('BTC/USD:USD');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/market-data/market/depth?symbol=BTCRUSDPERP'
      );
    });
  });

  // =========================================================================
  // _fetchTrades
  // =========================================================================

  describe('fetchTrades', () => {
    const mockExecutions = {
      data: [
        {
          exchangeId: 1,
          symbol: 'BTCRUSDPERP',
          accountId: 1,
          qty: '0.5',
          side: 'B' as const,
          price: '50000',
          fee: '5.0',
          type: 'ORDER_MATCH' as const,
          timestamp: 1700000000000,
          sequenceNumber: 123,
        },
        {
          exchangeId: 1,
          symbol: 'BTCRUSDPERP',
          accountId: 2,
          qty: '1.0',
          side: 'A' as const,
          price: '50001',
          fee: '10.0',
          type: 'ORDER_MATCH' as const,
          timestamp: 1700000001000,
          sequenceNumber: 124,
        },
      ],
      meta: { limit: 100, count: 2 },
    };

    test('fetches and normalizes trades', async () => {
      mockHttpClient.get.mockResolvedValue(mockExecutions);

      const trades = await adapter.fetchTrades('BTC/USD:USD');

      expect(trades).toHaveLength(2);
      expect(trades[0].id).toBe('123');
      expect(trades[0].price).toBe(50000);
      expect(trades[0].amount).toBe(0.5);
      expect(trades[0].side).toBe('buy');
      expect(trades[0].cost).toBe(25000);
      expect(trades[1].side).toBe('sell');
    });

    test('passes since parameter', async () => {
      mockHttpClient.get.mockResolvedValue(mockExecutions);

      await adapter.fetchTrades('BTC/USD:USD', { since: 1700000000000 });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/market-data/market/perp-executions?symbol=BTCRUSDPERP&startTime=1700000000000'
      );
    });
  });

  // =========================================================================
  // _fetchFundingRate
  // =========================================================================

  describe('fetchFundingRate', () => {
    const mockSummary = {
      symbol: 'BTCRUSDPERP',
      updatedAt: 1700000000000,
      longOiQty: '100',
      shortOiQty: '80',
      oiQty: '180',
      fundingRate: '0.0001',
      longFundingValue: '10',
      shortFundingValue: '8',
      fundingRateVelocity: '0.00001',
      volume24h: '5000000',
      pxChange24h: '0.02',
    };

    const mockPrice = {
      symbol: 'BTCRUSDPERP',
      oraclePrice: '50000.5',
      poolPrice: '50001.0',
      updatedAt: 1700000000000,
    };

    test('fetches and normalizes funding rate', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce(mockSummary)
        .mockResolvedValueOnce(mockPrice);

      const fr = await adapter.fetchFundingRate('BTC/USD:USD');

      expect(fr.symbol).toBe('BTC/USD:USD');
      expect(fr.fundingRate).toBe(0.0001);
      expect(fr.markPrice).toBe(50000.5);
      expect(fr.indexPrice).toBe(50000.5);
      expect(fr.fundingIntervalHours).toBe(REYA_FUNDING_INTERVAL_HOURS);
    });
  });

  // =========================================================================
  // fetchOHLCV
  // =========================================================================

  describe('fetchOHLCV', () => {
    const mockCandles = {
      t: [1700000000, 1700003600],
      o: ['50000', '50100'],
      h: ['50200', '50300'],
      l: ['49900', '50000'],
      c: ['50100', '50200'],
    };

    test('fetches and normalizes OHLCV data', async () => {
      mockHttpClient.get.mockResolvedValue(mockCandles);

      const candles = await adapter.fetchOHLCV('BTC/USD:USD', '1h');

      expect(candles).toHaveLength(2);
      expect(candles[0]).toEqual([1700000000000, 50000, 50200, 49900, 50100, 0]);
      expect(candles[1][0]).toBe(1700003600000);
    });

    test('passes until param and converts to seconds', async () => {
      mockHttpClient.get.mockResolvedValue(mockCandles);

      await adapter.fetchOHLCV('BTC/USD:USD', '4h', {
        until: 1700100000000,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/market-data/candles?symbol=BTCRUSDPERP&resolution=4h&endTime=1700100000'
      );
    });

    test('respects limit parameter', async () => {
      mockHttpClient.get.mockResolvedValue(mockCandles);

      const candles = await adapter.fetchOHLCV('BTC/USD:USD', '1h', { limit: 1 });

      expect(candles).toHaveLength(1);
    });
  });

  // =========================================================================
  // createOrder
  // =========================================================================

  describe('createOrder', () => {
    let authAdapter: ReyaAdapter;
    let authMock: typeof mockHttpClient;

    beforeEach(() => {
      authAdapter = new ReyaAdapter({
        privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        accountId: 1,
      });
      authMock = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    });

    test('creates a limit order', async () => {
      authMock.post.mockResolvedValue({
        status: 'OPEN',
        orderId: 'abc123',
        cumQty: '0',
      });

      const order = await authAdapter.createOrder({
        symbol: 'BTC/USD:USD',
        side: 'buy',
        type: 'limit',
        amount: 0.5,
        price: 50000,
      });

      expect(order.id).toBe('abc123');
      expect(order.symbol).toBe('BTC/USD:USD');
      expect(order.side).toBe('buy');
      expect(order.type).toBe('limit');
      expect(order.amount).toBe(0.5);
      expect(order.status).toBe('open');
      expect(order.filled).toBe(0);
    });

    test('creates a filled order', async () => {
      authMock.post.mockResolvedValue({
        status: 'FILLED',
        orderId: 'def456',
        cumQty: '0.5',
      });

      const order = await authAdapter.createOrder({
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
      authMock.post.mockResolvedValue({
        status: 'REJECTED',
        orderId: 'rej789',
      });

      await expect(
        authAdapter.createOrder({
          symbol: 'BTC/USD:USD',
          side: 'buy',
          type: 'limit',
          amount: 0.5,
          price: 50000,
        })
      ).rejects.toThrow('Order rejected');
    });

    test('throws without auth', async () => {
      const noAuthAdapter = new ReyaAdapter();

      await expect(
        noAuthAdapter.createOrder({
          symbol: 'BTC/USD:USD',
          side: 'buy',
          type: 'limit',
          amount: 0.5,
          price: 50000,
        })
      ).rejects.toThrow('Private key required');
    });
  });

  // =========================================================================
  // cancelOrder
  // =========================================================================

  describe('cancelOrder', () => {
    let authAdapter: ReyaAdapter;
    let authMock: typeof mockHttpClient;

    beforeEach(() => {
      authAdapter = new ReyaAdapter({
        privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        accountId: 1,
      });
      authMock = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    });

    test('cancels an order', async () => {
      authMock.post.mockResolvedValue({
        status: 'CANCELLED',
        orderId: 'abc123',
      });

      const order = await authAdapter.cancelOrder('abc123', 'BTC/USD:USD');

      expect(order.id).toBe('abc123');
      expect(order.status).toBe('canceled');
      expect(order.symbol).toBe('BTC/USD:USD');
    });

    test('throws without auth', async () => {
      const noAuthAdapter = new ReyaAdapter();
      await expect(noAuthAdapter.cancelOrder('abc123')).rejects.toThrow('Private key required');
    });
  });

  // =========================================================================
  // cancelAllOrders
  // =========================================================================

  describe('cancelAllOrders', () => {
    let authAdapter: ReyaAdapter;
    let authMock: typeof mockHttpClient;

    beforeEach(() => {
      authAdapter = new ReyaAdapter({
        privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        accountId: 1,
      });
      authMock = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    });

    test('cancels all orders', async () => {
      authMock.post.mockResolvedValue({ cancelledCount: 3 });

      const result = await authAdapter.cancelAllOrders();

      expect(result).toEqual([]);
      expect(authMock.post).toHaveBeenCalled();
    });

    test('cancels orders for a specific symbol', async () => {
      authMock.post.mockResolvedValue({ cancelledCount: 2 });

      await authAdapter.cancelAllOrders('BTC/USD:USD');

      const callArgs = authMock.post.mock.calls[0];
      expect(callArgs[1].body.symbol).toBe('BTCRUSDPERP');
    });
  });

  // =========================================================================
  // fetchOpenOrders
  // =========================================================================

  describe('fetchOpenOrders', () => {
    let authAdapter: ReyaAdapter;
    let authMock: typeof mockHttpClient;

    const mockOrders = [
      {
        exchangeId: 1,
        symbol: 'BTCRUSDPERP',
        accountId: 1,
        orderId: 'abc123',
        qty: '0.5',
        side: 'B' as const,
        limitPx: '50000',
        orderType: 'LIMIT' as const,
        timeInForce: 'GTC' as const,
        status: 'OPEN' as const,
        createdAt: 1700000000000,
        lastUpdateAt: 1700000000000,
      },
    ];

    beforeEach(() => {
      authAdapter = new ReyaAdapter({
        privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        accountId: 1,
      });
      authMock = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    });

    test('fetches and normalizes open orders', async () => {
      authMock.get.mockResolvedValue(mockOrders);

      const orders = await authAdapter.fetchOpenOrders();

      expect(orders).toHaveLength(1);
      expect(orders[0].id).toBe('abc123');
      expect(orders[0].symbol).toBe('BTC/USD:USD');
      expect(orders[0].type).toBe('limit');
      expect(orders[0].side).toBe('buy');
      expect(orders[0].status).toBe('open');
    });

    test('filters by symbol', async () => {
      authMock.get.mockResolvedValue(mockOrders);

      const orders = await authAdapter.fetchOpenOrders('ETH/USD:USD');

      expect(orders).toHaveLength(0);
    });
  });

  // =========================================================================
  // fetchMyTrades
  // =========================================================================

  describe('fetchMyTrades', () => {
    let authAdapter: ReyaAdapter;
    let authMock: typeof mockHttpClient;

    const mockTradeResponse = {
      data: [
        {
          exchangeId: 1,
          symbol: 'BTCRUSDPERP',
          accountId: 1,
          qty: '0.5',
          side: 'B' as const,
          price: '50000',
          fee: '5.0',
          type: 'ORDER_MATCH' as const,
          timestamp: 1700000000000,
          sequenceNumber: 123,
        },
      ],
      meta: { limit: 100, count: 1 },
    };

    beforeEach(() => {
      authAdapter = new ReyaAdapter({
        privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        accountId: 1,
      });
      authMock = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    });

    test('fetches user trades', async () => {
      authMock.get.mockResolvedValue(mockTradeResponse);

      const trades = await authAdapter.fetchMyTrades();

      expect(trades).toHaveLength(1);
      expect(trades[0].id).toBe('123');
      expect(trades[0].symbol).toBe('BTC/USD:USD');
      expect(trades[0].side).toBe('buy');
    });

    test('filters by symbol', async () => {
      authMock.get.mockResolvedValue(mockTradeResponse);

      const trades = await authAdapter.fetchMyTrades('ETH/USD:USD');

      expect(trades).toHaveLength(0);
    });

    test('limits results', async () => {
      const twoTrades = {
        data: [
          ...mockTradeResponse.data,
          { ...mockTradeResponse.data[0], sequenceNumber: 124, timestamp: 1700000001000 },
        ],
        meta: { limit: 100, count: 2 },
      };
      authMock.get.mockResolvedValue(twoTrades);

      const trades = await authAdapter.fetchMyTrades(undefined, undefined, 1);

      expect(trades).toHaveLength(1);
    });
  });

  // =========================================================================
  // fetchPositions
  // =========================================================================

  describe('fetchPositions', () => {
    let authAdapter: ReyaAdapter;
    let authMock: typeof mockHttpClient;

    const mockPositions = [
      {
        exchangeId: 1,
        symbol: 'BTCRUSDPERP',
        accountId: 1,
        qty: '0.5',
        side: 'B' as const,
        avgEntryPrice: '50000',
        avgEntryFundingValue: '0',
        lastTradeSequenceNumber: 100,
      },
      {
        exchangeId: 1,
        symbol: 'ETHRUSDPERP',
        accountId: 1,
        qty: '0',
        side: 'B' as const,
        avgEntryPrice: '3000',
        avgEntryFundingValue: '0',
        lastTradeSequenceNumber: 50,
      },
    ];

    beforeEach(() => {
      authAdapter = new ReyaAdapter({
        privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        accountId: 1,
      });
      authMock = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    });

    test('fetches and normalizes positions', async () => {
      authMock.get.mockResolvedValue(mockPositions);

      const positions = await authAdapter.fetchPositions();

      expect(positions).toHaveLength(1); // Filters out zero qty
      expect(positions[0].symbol).toBe('BTC/USD:USD');
      expect(positions[0].side).toBe('long');
      expect(positions[0].size).toBe(0.5);
      expect(positions[0].entryPrice).toBe(50000);
      expect(positions[0].marginMode).toBe('cross');
    });

    test('filters by symbols', async () => {
      authMock.get.mockResolvedValue(mockPositions);

      const positions = await authAdapter.fetchPositions(['ETH/USD:USD']);

      expect(positions).toHaveLength(0); // ETH has zero qty
    });
  });

  // =========================================================================
  // fetchBalance
  // =========================================================================

  describe('fetchBalance', () => {
    let authAdapter: ReyaAdapter;
    let authMock: typeof mockHttpClient;

    const mockBalances = [
      {
        accountId: 1,
        asset: 'rUSD',
        realBalance: '10000.5',
        balanceDEPRECATED: '10000.5',
      },
      {
        accountId: 1,
        asset: 'WETH',
        realBalance: '0',
        balanceDEPRECATED: '0',
      },
    ];

    beforeEach(() => {
      authAdapter = new ReyaAdapter({
        privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        accountId: 1,
      });
      authMock = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    });

    test('fetches and normalizes balances', async () => {
      authMock.get.mockResolvedValue(mockBalances);

      const balances = await authAdapter.fetchBalance();

      expect(balances).toHaveLength(1); // Filters out zero balances
      expect(balances[0].currency).toBe('rUSD');
      expect(balances[0].total).toBe(10000.5);
      expect(balances[0].free).toBe(10000.5);
      expect(balances[0].used).toBe(0);
      expect(balances[0].usdValue).toBe(10000.5);
    });
  });

  // =========================================================================
  // NotSupportedError for unsupported methods
  // =========================================================================

  describe('NotSupportedError', () => {
    test('setLeverage throws NotSupportedError', async () => {
      await expect(adapter.setLeverage('BTC/USD:USD', 10)).rejects.toThrow(NotSupportedError);
      await expect(adapter.setLeverage('BTC/USD:USD', 10)).rejects.toThrow(
        'account-level margin'
      );
    });

    test('fetchFundingRateHistory throws NotSupportedError', async () => {
      await expect(adapter.fetchFundingRateHistory('BTC/USD:USD')).rejects.toThrow(
        NotSupportedError
      );
      await expect(adapter.fetchFundingRateHistory('BTC/USD:USD')).rejects.toThrow(
        'continuous funding rates'
      );
    });

    test('fetchOrderHistory throws NotSupportedError', async () => {
      await expect(adapter.fetchOrderHistory('BTC/USD:USD')).rejects.toThrow(NotSupportedError);
    });
  });

  // =========================================================================
  // Error handling
  // =========================================================================

  describe('error handling', () => {
    test('maps network errors to ExchangeUnavailableError', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error 500'));

      await expect(adapter.fetchMarkets()).rejects.toThrow(ExchangeUnavailableError);
    });

    test('re-throws PerpDEXError as-is', async () => {
      const originalError = new PerpDEXError('Test error', 'TEST', 'reya');
      mockHttpClient.get.mockRejectedValue(originalError);

      await expect(adapter.fetchMarkets()).rejects.toBe(originalError);
    });
  });
});

// =============================================================================
// Symbol Conversion
// =============================================================================

describe('Symbol Conversion', () => {
  describe('unifiedToReya', () => {
    test('converts BTC/USD:USD to BTCRUSDPERP', () => {
      expect(unifiedToReya('BTC/USD:USD')).toBe('BTCRUSDPERP');
    });

    test('converts ETH/USD:USD to ETHRUSDPERP', () => {
      expect(unifiedToReya('ETH/USD:USD')).toBe('ETHRUSDPERP');
    });

    test('handles symbol without settle part', () => {
      expect(unifiedToReya('SOL/USD')).toBe('SOLRUSDPERP');
    });

    test('throws on empty base', () => {
      expect(() => unifiedToReya('/USD:USD')).toThrow('Invalid symbol format');
    });
  });

  describe('reyaToUnified', () => {
    test('converts BTCRUSDPERP to BTC/USD:USD', () => {
      expect(reyaToUnified('BTCRUSDPERP')).toBe('BTC/USD:USD');
    });

    test('converts ETHRUSDPERP to ETH/USD:USD', () => {
      expect(reyaToUnified('ETHRUSDPERP')).toBe('ETH/USD:USD');
    });

    test('handles spot symbol without PERP', () => {
      expect(reyaToUnified('WETHRUSD')).toBe('WETH/USD:USD');
    });

    test('returns unknown symbol as-is', () => {
      expect(reyaToUnified('UNKNOWN')).toBe('UNKNOWN');
    });
  });
});

// =============================================================================
// ReyaNormalizer
// =============================================================================

describe('ReyaNormalizer', () => {
  let normalizer: ReyaNormalizer;

  beforeEach(() => {
    normalizer = new ReyaNormalizer();
  });

  describe('symbolToCCXT', () => {
    test('converts Reya symbol to unified', () => {
      expect(normalizer.symbolToCCXT('BTCRUSDPERP')).toBe('BTC/USD:USD');
    });
  });

  describe('symbolFromCCXT', () => {
    test('converts unified symbol to Reya', () => {
      expect(normalizer.symbolFromCCXT('BTC/USD:USD')).toBe('BTCRUSDPERP');
    });
  });

  describe('normalizeMarket', () => {
    test('normalizes a market definition', () => {
      const definition = {
        symbol: 'BTCRUSDPERP',
        marketId: 1,
        minOrderQty: '0.001',
        qtyStepSize: '0.001',
        tickSize: '0.1',
        liquidationMarginParameter: '0.005',
        initialMarginParameter: '0.01',
        maxLeverage: 100,
        oiCap: '1000000',
      };

      const market = normalizer.normalizeMarket(definition);

      expect(market.id).toBe('1');
      expect(market.symbol).toBe('BTC/USD:USD');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('USD');
      expect(market.active).toBe(true);
      expect(market.minAmount).toBe(0.001);
      expect(market.priceTickSize).toBe(0.1);
      expect(market.amountStepSize).toBe(0.001);
      expect(market.pricePrecision).toBe(1);
      expect(market.amountPrecision).toBe(3);
      expect(market.maxLeverage).toBe(100);
      expect(market.fundingIntervalHours).toBe(REYA_FUNDING_INTERVAL_HOURS);
    });
  });

  describe('normalizeTicker', () => {
    test('normalizes summary and price to ticker', () => {
      const summary = {
        symbol: 'BTCRUSDPERP',
        updatedAt: 1700000000000,
        longOiQty: '100',
        shortOiQty: '80',
        oiQty: '180',
        fundingRate: '0.0001',
        longFundingValue: '10',
        shortFundingValue: '8',
        fundingRateVelocity: '0.00001',
        volume24h: '5000000',
        pxChange24h: '0.02',
      };

      const price = {
        symbol: 'BTCRUSDPERP',
        oraclePrice: '50000.5',
        poolPrice: '50001.0',
        updatedAt: 1700000000000,
      };

      const ticker = normalizer.normalizeTicker(summary, price);

      expect(ticker.symbol).toBe('BTC/USD:USD');
      expect(ticker.last).toBe(50001.0);
      expect(ticker.bid).toBe(50001.0);
      expect(ticker.ask).toBe(50001.0);
      expect(ticker.quoteVolume).toBe(5000000);
      expect(ticker.change).toBe(0.02);
      expect(ticker.percentage).toBe(2);
    });
  });

  describe('normalizeOrderBook', () => {
    test('normalizes depth to order book', () => {
      const depth = {
        symbol: 'BTCRUSDPERP',
        type: 'SNAPSHOT' as const,
        bids: [{ px: '50000', qty: '1.5' }],
        asks: [{ px: '50001', qty: '2.0' }],
        updatedAt: 1700000000000,
      };

      const ob = normalizer.normalizeOrderBook(depth);

      expect(ob.symbol).toBe('BTC/USD:USD');
      expect(ob.bids).toEqual([[50000, 1.5]]);
      expect(ob.asks).toEqual([[50001, 2.0]]);
      expect(ob.exchange).toBe('reya');
    });
  });

  describe('normalizeTrade', () => {
    test('normalizes perp execution to trade', () => {
      const execution = {
        exchangeId: 1,
        symbol: 'BTCRUSDPERP',
        accountId: 1,
        qty: '0.5',
        side: 'B' as const,
        price: '50000',
        fee: '5.0',
        type: 'ORDER_MATCH' as const,
        timestamp: 1700000000000,
        sequenceNumber: 123,
      };

      const trade = normalizer.normalizeTrade(execution);

      expect(trade.id).toBe('123');
      expect(trade.symbol).toBe('BTC/USD:USD');
      expect(trade.side).toBe('buy');
      expect(trade.price).toBe(50000);
      expect(trade.amount).toBe(0.5);
      expect(trade.cost).toBe(25000);
      expect(trade.info.fee).toBe('5.0');
    });

    test('normalizes sell side', () => {
      const execution = {
        exchangeId: 1,
        symbol: 'BTCRUSDPERP',
        accountId: 1,
        qty: '1.0',
        side: 'A' as const,
        price: '50000',
        fee: '10.0',
        type: 'LIQUIDATION' as const,
        timestamp: 1700000000000,
        sequenceNumber: 200,
      };

      const trade = normalizer.normalizeTrade(execution);

      expect(trade.side).toBe('sell');
      expect(trade.info.executionType).toBe('LIQUIDATION');
    });
  });

  describe('normalizeOrder', () => {
    test('normalizes open order', () => {
      const order = {
        exchangeId: 1,
        symbol: 'BTCRUSDPERP',
        accountId: 1,
        orderId: 'abc123',
        qty: '0.5',
        side: 'B' as const,
        limitPx: '50000',
        orderType: 'LIMIT' as const,
        timeInForce: 'GTC' as const,
        status: 'OPEN' as const,
        createdAt: 1700000000000,
        lastUpdateAt: 1700000000000,
      };

      const normalized = normalizer.normalizeOrder(order);

      expect(normalized.id).toBe('abc123');
      expect(normalized.symbol).toBe('BTC/USD:USD');
      expect(normalized.type).toBe('limit');
      expect(normalized.side).toBe('buy');
      expect(normalized.amount).toBe(0.5);
      expect(normalized.price).toBe(50000);
      expect(normalized.status).toBe('open');
    });

    test('normalizes SL order type', () => {
      const order = {
        exchangeId: 1,
        symbol: 'BTCRUSDPERP',
        accountId: 1,
        orderId: 'sl123',
        qty: '0.5',
        side: 'A' as const,
        limitPx: '49000',
        orderType: 'SL' as const,
        triggerPx: '49500',
        status: 'OPEN' as const,
        createdAt: 1700000000000,
        lastUpdateAt: 1700000000000,
      };

      const normalized = normalizer.normalizeOrder(order);

      expect(normalized.type).toBe('stopMarket');
      expect(normalized.side).toBe('sell');
    });
  });

  describe('normalizePosition', () => {
    test('normalizes long position', () => {
      const position = {
        exchangeId: 1,
        symbol: 'BTCRUSDPERP',
        accountId: 1,
        qty: '0.5',
        side: 'B' as const,
        avgEntryPrice: '50000',
        avgEntryFundingValue: '0',
        lastTradeSequenceNumber: 100,
      };

      const normalized = normalizer.normalizePosition(position);

      expect(normalized.symbol).toBe('BTC/USD:USD');
      expect(normalized.side).toBe('long');
      expect(normalized.size).toBe(0.5);
      expect(normalized.entryPrice).toBe(50000);
      expect(normalized.marginMode).toBe('cross');
    });

    test('normalizes short position', () => {
      const position = {
        exchangeId: 1,
        symbol: 'ETHRUSDPERP',
        accountId: 1,
        qty: '-2.0',
        side: 'A' as const,
        avgEntryPrice: '3000',
        avgEntryFundingValue: '10',
        lastTradeSequenceNumber: 200,
      };

      const normalized = normalizer.normalizePosition(position);

      expect(normalized.side).toBe('short');
      expect(normalized.size).toBe(2.0);
    });
  });

  describe('normalizeBalance', () => {
    test('normalizes account balance', () => {
      const balance = {
        accountId: 1,
        asset: 'rUSD',
        realBalance: '10000.5',
        balanceDEPRECATED: '10000.5',
      };

      const normalized = normalizer.normalizeBalance(balance);

      expect(normalized.currency).toBe('rUSD');
      expect(normalized.total).toBe(10000.5);
      expect(normalized.free).toBe(10000.5);
      expect(normalized.used).toBe(0);
      expect(normalized.usdValue).toBe(10000.5);
    });
  });

  describe('normalizeFundingRate', () => {
    test('normalizes funding rate', () => {
      const summary = {
        symbol: 'BTCRUSDPERP',
        updatedAt: 1700000000000,
        longOiQty: '100',
        shortOiQty: '80',
        oiQty: '180',
        fundingRate: '0.0001',
        longFundingValue: '10',
        shortFundingValue: '8',
        fundingRateVelocity: '0.00001',
        volume24h: '5000000',
      };

      const fr = normalizer.normalizeFundingRate(summary, 50000.5);

      expect(fr.symbol).toBe('BTC/USD:USD');
      expect(fr.fundingRate).toBe(0.0001);
      expect(fr.markPrice).toBe(50000.5);
      expect(fr.indexPrice).toBe(50000.5);
      expect(fr.fundingIntervalHours).toBe(REYA_FUNDING_INTERVAL_HOURS);
      expect(fr.nextFundingTimestamp).toBe(1700000000000 + REYA_FUNDING_INTERVAL_HOURS * 3600 * 1000);
    });
  });

  describe('normalizeCandles', () => {
    test('normalizes candle data', () => {
      const data = {
        t: [1700000000, 1700003600],
        o: ['50000', '50100'],
        h: ['50200', '50300'],
        l: ['49900', '50000'],
        c: ['50100', '50200'],
      };

      const candles = normalizer.normalizeCandles(data);

      expect(candles).toHaveLength(2);
      expect(candles[0]).toEqual([1700000000000, 50000, 50200, 49900, 50100, 0]);
      expect(candles[1]).toEqual([1700003600000, 50100, 50300, 50000, 50200, 0]);
    });

    test('respects limit', () => {
      const data = {
        t: [1700000000, 1700003600, 1700007200],
        o: ['50000', '50100', '50200'],
        h: ['50200', '50300', '50400'],
        l: ['49900', '50000', '50100'],
        c: ['50100', '50200', '50300'],
      };

      const candles = normalizer.normalizeCandles(data, 2);

      expect(candles).toHaveLength(2);
    });

    test('handles empty candle data', () => {
      const data = { t: [], o: [], h: [], l: [], c: [] };
      const candles = normalizer.normalizeCandles(data);
      expect(candles).toHaveLength(0);
    });
  });

  describe('helper methods', () => {
    test('normalizeSymbol delegates to symbolToCCXT', () => {
      expect(normalizer.normalizeSymbol('BTCRUSDPERP')).toBe('BTC/USD:USD');
    });

    test('toExchangeSymbol delegates to symbolFromCCXT', () => {
      expect(normalizer.toExchangeSymbol('BTC/USD:USD')).toBe('BTCRUSDPERP');
    });
  });
});

// =============================================================================
// Error Codes
// =============================================================================

describe('Error Codes', () => {
  describe('extractErrorCode', () => {
    test('extracts insufficient margin', () => {
      expect(extractErrorCode('Insufficient margin for order')).toBe('INSUFFICIENT_MARGIN');
    });

    test('extracts unauthorized signature', () => {
      expect(extractErrorCode('Invalid signature provided')).toBe(REYA_CLIENT_ERRORS.UNAUTHORIZED_SIGNATURE);
    });

    test('extracts rate limit from message', () => {
      expect(extractErrorCode('Rate limit exceeded')).toBe(REYA_RATE_LIMIT_ERROR);
    });

    test('extracts rate limit from too many requests', () => {
      expect(extractErrorCode('Too many requests')).toBe(REYA_RATE_LIMIT_ERROR);
    });

    test('extracts rate limit from 429 status', () => {
      expect(extractErrorCode('HTTP 429')).toBe(REYA_RATE_LIMIT_ERROR);
    });

    test('extracts server error from 500 status', () => {
      expect(extractErrorCode('HTTP 500')).toBe(REYA_SERVER_ERRORS.INTERNAL_SERVER_ERROR);
    });

    test('extracts server error from 503 status', () => {
      expect(extractErrorCode('HTTP 503')).toBe(REYA_SERVER_ERRORS.INTERNAL_SERVER_ERROR);
    });

    test('extracts invalid nonce', () => {
      expect(extractErrorCode('Invalid nonce value')).toBe(REYA_CLIENT_ERRORS.INVALID_NONCE);
    });

    test('extracts deadline passed', () => {
      expect(extractErrorCode('Order deadline passed')).toBe(REYA_CLIENT_ERRORS.ORDER_DEADLINE_PASSED);
    });

    test('extracts matching engine unavailable', () => {
      expect(extractErrorCode('Matching engine unavailable')).toBe(REYA_SERVER_ERRORS.UNAVAILABLE_MATCHING_ENGINE);
    });

    test('returns UNKNOWN_ERROR for unrecognized messages', () => {
      expect(extractErrorCode('something random')).toBe('UNKNOWN_ERROR');
    });
  });

  describe('mapReyaError', () => {
    test('maps INSUFFICIENT_MARGIN to InsufficientMarginError', () => {
      const err = mapReyaError('INSUFFICIENT_MARGIN', 'Not enough margin');
      expect(err).toBeInstanceOf(InsufficientMarginError);
    });

    test('maps UNAUTHORIZED_SIGNATURE to InvalidSignatureError', () => {
      const err = mapReyaError(REYA_CLIENT_ERRORS.UNAUTHORIZED_SIGNATURE, 'Bad sig');
      expect(err).toBeInstanceOf(InvalidSignatureError);
    });

    test('maps INPUT_VALIDATION_ERROR to BadRequestError', () => {
      const err = mapReyaError(REYA_CLIENT_ERRORS.INPUT_VALIDATION_ERROR, 'Bad input');
      expect(err).toBeInstanceOf(BadRequestError);
    });

    test('maps SYMBOL_NOT_FOUND to BadRequestError', () => {
      const err = mapReyaError(REYA_CLIENT_ERRORS.SYMBOL_NOT_FOUND, 'No symbol');
      expect(err).toBeInstanceOf(BadRequestError);
    });

    test('maps CREATE_ORDER_ERROR to InvalidOrderError', () => {
      const err = mapReyaError(REYA_CLIENT_ERRORS.CREATE_ORDER_ERROR, 'Order error');
      expect(err).toBeInstanceOf(InvalidOrderError);
    });

    test('maps ORDER_DEADLINE_PASSED to InvalidOrderError', () => {
      const err = mapReyaError(REYA_CLIENT_ERRORS.ORDER_DEADLINE_PASSED, 'Deadline');
      expect(err).toBeInstanceOf(InvalidOrderError);
    });

    test('maps CANCEL_ORDER_ERROR to OrderNotFoundError', () => {
      const err = mapReyaError(REYA_CLIENT_ERRORS.CANCEL_ORDER_ERROR, 'Cancel fail');
      expect(err).toBeInstanceOf(OrderNotFoundError);
    });

    test('maps RATE_LIMIT_EXCEEDED to RateLimitError', () => {
      const err = mapReyaError(REYA_RATE_LIMIT_ERROR, 'Rate limited');
      expect(err).toBeInstanceOf(RateLimitError);
    });

    test('maps server errors to ExchangeUnavailableError', () => {
      const err = mapReyaError(REYA_SERVER_ERRORS.INTERNAL_SERVER_ERROR, 'Server down');
      expect(err).toBeInstanceOf(ExchangeUnavailableError);
    });

    test('maps UNAVAILABLE_MATCHING_ENGINE to ExchangeUnavailableError', () => {
      const err = mapReyaError(REYA_SERVER_ERRORS.UNAVAILABLE_MATCHING_ENGINE, 'ME down');
      expect(err).toBeInstanceOf(ExchangeUnavailableError);
    });

    test('maps unknown error code to PerpDEXError', () => {
      const err = mapReyaError('SOME_UNKNOWN', 'Unknown');
      expect(err).toBeInstanceOf(PerpDEXError);
    });
  });

  describe('mapError', () => {
    test('passes through PerpDEXError', () => {
      const original = new PerpDEXError('Test', 'TEST', 'reya');
      const result = mapError(original);
      expect(result).toBe(original);
    });

    test('maps Error to appropriate PerpDEXError subclass', () => {
      const err = mapError(new Error('Insufficient margin'));
      expect(err).toBeInstanceOf(InsufficientMarginError);
    });

    test('maps unknown error to ExchangeUnavailableError', () => {
      const err = mapError('string error');
      expect(err).toBeInstanceOf(ExchangeUnavailableError);
    });
  });

  describe('isRetryableError', () => {
    test('server errors are retryable', () => {
      expect(isRetryableError(REYA_SERVER_ERRORS.INTERNAL_SERVER_ERROR)).toBe(true);
      expect(isRetryableError(REYA_SERVER_ERRORS.UNAVAILABLE_MATCHING_ENGINE)).toBe(true);
    });

    test('rate limit is retryable', () => {
      expect(isRetryableError(REYA_RATE_LIMIT_ERROR)).toBe(true);
    });

    test('client errors are not retryable', () => {
      expect(isRetryableError(REYA_CLIENT_ERRORS.SYMBOL_NOT_FOUND)).toBe(false);
      expect(isRetryableError(REYA_CLIENT_ERRORS.UNAUTHORIZED_SIGNATURE)).toBe(false);
      expect(isRetryableError('INSUFFICIENT_MARGIN')).toBe(false);
    });
  });
});

// =============================================================================
// Utils
// =============================================================================

describe('Utils', () => {
  describe('buildOrderRequest', () => {
    test('builds limit buy order', () => {
      const req = buildOrderRequest(
        { symbol: 'BTC/USD:USD', side: 'buy', type: 'limit', amount: 0.5, price: 50000 },
        1, 1, 'sig', 'nonce1', '0xWallet'
      );

      expect(req.symbol).toBe('BTCRUSDPERP');
      expect(req.isBuy).toBe(true);
      expect(req.limitPx).toBe('50000');
      expect(req.qty).toBe('0.5');
      expect(req.orderType).toBe('LIMIT');
      expect(req.timeInForce).toBe('GTC');
      expect(req.accountId).toBe(1);
      expect(req.signature).toBe('sig');
      expect(req.nonce).toBe('nonce1');
      expect(req.signerWallet).toBe('0xWallet');
    });

    test('builds market order with IOC and extreme limit price', () => {
      const req = buildOrderRequest(
        { symbol: 'BTC/USD:USD', side: 'buy', type: 'market', amount: 1 },
        1, 1, 'sig', 'nonce1', '0xWallet'
      );

      expect(req.isBuy).toBe(true);
      expect(req.limitPx).toBe('999999999');
      expect(req.timeInForce).toBe('IOC');
    });

    test('builds sell market order with low limit price', () => {
      const req = buildOrderRequest(
        { symbol: 'BTC/USD:USD', side: 'sell', type: 'market', amount: 1 },
        1, 1, 'sig', 'nonce1', '0xWallet'
      );

      expect(req.isBuy).toBe(false);
      expect(req.limitPx).toBe('0.000001');
    });

    test('builds stop loss order', () => {
      const req = buildOrderRequest(
        { symbol: 'BTC/USD:USD', side: 'sell', type: 'stopMarket' as 'market', amount: 0.5, price: 49000, stopPrice: 49500 },
        1, 1, 'sig', 'nonce1', '0xWallet'
      );

      expect(req.orderType).toBe('SL');
      expect(req.triggerPx).toBe('49500');
    });

    test('builds take profit order', () => {
      const req = buildOrderRequest(
        { symbol: 'BTC/USD:USD', side: 'sell', type: 'takeProfit' as 'market', amount: 0.5, price: 55000 },
        1, 1, 'sig', 'nonce1', '0xWallet'
      );

      expect(req.orderType).toBe('TP');
    });

    test('includes clientOrderId when provided', () => {
      const req = buildOrderRequest(
        { symbol: 'BTC/USD:USD', side: 'buy', type: 'limit', amount: 0.5, price: 50000, clientOrderId: '12345' },
        1, 1, 'sig', 'nonce1', '0xWallet'
      );

      expect(req.clientOrderId).toBe(12345);
    });

    test('includes reduceOnly when set', () => {
      const req = buildOrderRequest(
        { symbol: 'BTC/USD:USD', side: 'sell', type: 'limit', amount: 0.5, price: 50000, reduceOnly: true },
        1, 1, 'sig', 'nonce1', '0xWallet'
      );

      expect(req.reduceOnly).toBe(true);
    });
  });

  describe('mapOrderStatus', () => {
    test('maps OPEN to open', () => {
      expect(mapOrderStatus('OPEN')).toBe('open');
    });

    test('maps FILLED to filled', () => {
      expect(mapOrderStatus('FILLED')).toBe('filled');
    });

    test('maps CANCELLED to canceled', () => {
      expect(mapOrderStatus('CANCELLED')).toBe('canceled');
    });

    test('maps REJECTED to rejected', () => {
      expect(mapOrderStatus('REJECTED')).toBe('rejected');
    });
  });

  describe('parseReyaSymbol', () => {
    test('parses BTCRUSDPERP', () => {
      expect(parseReyaSymbol('BTCRUSDPERP')).toEqual({ base: 'BTC', quote: 'USD' });
    });

    test('parses ETHRUSDPERP', () => {
      expect(parseReyaSymbol('ETHRUSDPERP')).toEqual({ base: 'ETH', quote: 'USD' });
    });

    test('parses symbol without PERP suffix', () => {
      expect(parseReyaSymbol('BTCRUSD')).toEqual({ base: 'BTC', quote: 'USD' });
    });

    test('handles symbol without RUSD pattern', () => {
      const result = parseReyaSymbol('UNKNOWN');
      expect(result.base).toBe('UNKNOWN');
      expect(result.quote).toBe('USD');
    });
  });

  describe('mapTimeframeToResolution', () => {
    test('maps 1m', () => {
      expect(mapTimeframeToResolution('1m')).toBe('1m');
    });

    test('maps 5m', () => {
      expect(mapTimeframeToResolution('5m')).toBe('5m');
    });

    test('maps 15m', () => {
      expect(mapTimeframeToResolution('15m')).toBe('15m');
    });

    test('maps 1h', () => {
      expect(mapTimeframeToResolution('1h')).toBe('1h');
    });

    test('maps 4h', () => {
      expect(mapTimeframeToResolution('4h')).toBe('4h');
    });

    test('maps 1d', () => {
      expect(mapTimeframeToResolution('1d')).toBe('1d');
    });

    test('defaults to 1h for unknown timeframe', () => {
      expect(mapTimeframeToResolution('2h')).toBe('1h');
    });
  });
});

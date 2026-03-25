/**
 * KatanaAdapter Tests
 *
 * Integration tests for the Katana Network Exchange adapter.
 * HTTPClient and auth are replaced with jest mocks after construction.
 */

import { KatanaAdapter } from '../../src/adapters/katana/KatanaAdapter.js';
import { PerpDEXError } from '../../src/types/errors.js';

// Mock HTTPClient to prevent real network calls
jest.mock('../../src/core/http/HTTPClient.js', () => ({
  HTTPClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAdapter(config: Record<string, unknown> = {}): KatanaAdapter {
  const adapter = new KatanaAdapter(config as any);
  // Bypass real rate-limiter so tests are synchronous
  (adapter as any).rateLimiter = { acquire: jest.fn().mockResolvedValue(undefined), destroy: jest.fn() };
  return adapter;
}

function stubAuth(adapter: KatanaAdapter, overrides: Record<string, unknown> = {}): void {
  (adapter as any).auth = {
    requireAuth: jest.fn(),
    requireWallet: jest.fn(),
    getAddress: jest.fn().mockReturnValue('0xWALLET'),
    generateNonce: jest.fn().mockReturnValue('test-nonce-uuid'),
    signOrder: jest.fn().mockResolvedValue('0xSIGNATURE'),
    signCancel: jest.fn().mockResolvedValue('0xCANCEL_SIG'),
    sign: jest.fn().mockResolvedValue({ headers: { 'KP-API-KEY': 'key', 'KP-HMAC-SIGNATURE': 'sig' } }),
    setServerTimeOffset: jest.fn(),
    ...overrides,
  };
}

function getHttp(adapter: KatanaAdapter): jest.Mocked<{ get: jest.Mock; post: jest.Mock; delete: jest.Mock }> {
  return (adapter as any).http;
}

// ---------------------------------------------------------------------------
// Mock data factories
// ---------------------------------------------------------------------------

const NOW = 1700000000000;

function mockMarket(overrides: Record<string, unknown> = {}) {
  return {
    market: 'BTC-USD',
    type: 'perpetual',
    status: 'active',
    baseAsset: 'BTC',
    quoteAsset: 'USD',
    stepSize: '0.00100000',
    tickSize: '0.10000000',
    indexPrice: '50000.00000000',
    indexPrice24h: '49000.00000000',
    indexPricePercentChange: '2.04081633',
    lastFundingRate: '0.00010000',
    currentFundingRate: '0.00010000',
    nextFundingTime: NOW + 3600000,
    makerOrderMinimum: '1.00000000',
    takerOrderMinimum: '1.00000000',
    marketOrderExecutionPriceLimit: '0.05000000',
    limitOrderExecutionPriceLimit: '0.05000000',
    minimumPositionSize: '0.00100000',
    maximumPositionSize: '100.00000000',
    initialMarginFraction: '0.05000000',
    maintenanceMarginFraction: '0.03000000',
    basePositionSize: '10.00000000',
    incrementalPositionSize: '10.00000000',
    incrementalInitialMarginFraction: '0.00500000',
    makerFeeRate: '0.00010000',
    takerFeeRate: '0.00040000',
    volume24h: '1000000.00000000',
    trades24h: 5000,
    openInterest: '50000.00000000',
    ...overrides,
  };
}

function mockTicker(overrides: Record<string, unknown> = {}) {
  return {
    market: 'BTC-USD',
    time: NOW,
    open: '49000.00000000',
    high: '51000.00000000',
    low: '48500.00000000',
    close: '50000.00000000',
    closeQuantity: '0.10000000',
    baseVolume: '1000.00000000',
    quoteVolume: '50000000.00000000',
    percentChange: '2.04081633',
    trades: 5000,
    ask: '50001.00000000',
    bid: '49999.00000000',
    markPrice: '50000.00000000',
    indexPrice: '50000.00000000',
    indexPrice24h: '49000.00000000',
    indexPricePercentChange: '2.04081633',
    lastFundingRate: '0.00010000',
    currentFundingRate: '0.00010000',
    nextFundingTime: NOW + 3600000,
    openInterest: '50000.00000000',
    sequence: 1,
    ...overrides,
  };
}

function mockOrderBook(overrides: Record<string, unknown> = {}) {
  return {
    sequence: 1,
    bids: [['49999.00000000', '1.00000000', 3], ['49998.00000000', '2.00000000', 5]],
    asks: [['50001.00000000', '0.50000000', 2], ['50002.00000000', '1.50000000', 4]],
    lastPrice: '50000.00000000',
    markPrice: '50000.00000000',
    indexPrice: '50000.00000000',
    ...overrides,
  };
}

function mockTrade(overrides: Record<string, unknown> = {}) {
  return {
    fillId: 'fill-001',
    market: 'BTC-USD',
    price: '50000.00000000',
    quantity: '0.10000000',
    quoteQuantity: '5000.00000000',
    time: NOW,
    side: 'buy',
    sequence: 1,
    ...overrides,
  };
}

function mockCandle(overrides: Record<string, unknown> = {}) {
  return {
    start: NOW - 3600000,
    open: '49000.00000000',
    high: '51000.00000000',
    low: '48500.00000000',
    close: '50000.00000000',
    baseVolume: '1000.00000000',
    quoteVolume: '50000000.00000000',
    trades: 5000,
    sequence: 1,
    ...overrides,
  };
}

function mockFundingRate(overrides: Record<string, unknown> = {}) {
  return {
    market: 'BTC-USD',
    rate: '0.00010000',
    time: NOW,
    ...overrides,
  };
}

function mockOrder(overrides: Record<string, unknown> = {}) {
  return {
    orderId: 'order-001',
    clientOrderId: 'client-001',
    market: 'BTC-USD',
    type: 1,
    side: 0,
    state: 'active',
    quantity: '0.10000000',
    filledQuantity: '0.00000000',
    limitPrice: '50000.00000000',
    triggerPrice: '0.00000000',
    time: NOW,
    fees: '0.00000000',
    createdAt: NOW,
    ...overrides,
  };
}

function mockPosition(overrides: Record<string, unknown> = {}) {
  return {
    market: 'BTC-USD',
    quantity: '1.00000000',
    maximumQuantity: '100.00000000',
    entryPrice: '50000.00000000',
    exitPrice: '0.00000000',
    markPrice: '50100.00000000',
    indexPrice: '50100.00000000',
    liquidationPrice: '45000.00000000',
    value: '50100.00000000',
    realizedPnL: '0.00000000',
    unrealizedPnL: '100.00000000',
    marginRequirement: '2500.00000000',
    leverage: '20.00000000',
    totalFunding: '0.00000000',
    totalOpen: '1.00000000',
    totalClose: '0.00000000',
    adlQuintile: 1,
    openedByFillId: 'fill-001',
    lastFillId: 'fill-001',
    time: NOW,
    ...overrides,
  };
}

function mockWallet(overrides: Record<string, unknown> = {}) {
  return {
    wallet: '0xWALLET',
    equity: '10000.00000000',
    freeCollateral: '7500.00000000',
    heldCollateral: '2500.00000000',
    availableCollateral: '7500.00000000',
    buyingPower: '150000.00000000',
    leverage: '15.00000000',
    marginRatio: '0.25000000',
    quoteBalance: '10000.00000000',
    unrealizedPnL: '100.00000000',
    makerFeeRate: '0.00010000',
    takerFeeRate: '0.00040000',
    ...overrides,
  };
}

function mockFill(overrides: Record<string, unknown> = {}) {
  return {
    fillId: 'fill-001',
    orderId: 'order-001',
    market: 'BTC-USD',
    price: '50000.00000000',
    quantity: '0.10000000',
    quoteQuantity: '5000.00000000',
    side: 'buy',
    time: NOW,
    fee: '2.00000000',
    feeAsset: 'USD',
    liquidity: 'taker',
    sequence: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('KatanaAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. Constructor & lifecycle
  // -------------------------------------------------------------------------

  describe('constructor & lifecycle', () => {
    test('creates adapter with default config', () => {
      const adapter = makeAdapter();
      expect(adapter.id).toBe('katana');
      expect(adapter.name).toBe('Katana');
    });

    test('creates adapter with testnet config (sandbox URL)', () => {
      const adapter = makeAdapter({ testnet: true });
      expect(adapter).toBeInstanceOf(KatanaAdapter);
      // The baseUrl should be the sandbox URL; accessible via private field
      expect((adapter as any).baseUrl).toContain('sandbox');
    });

    test('symbolToExchange and symbolFromExchange round-trip', () => {
      const adapter = makeAdapter();
      const exchange = (adapter as any).symbolToExchange('BTC/USD:USD');
      expect(exchange).toBe('BTC-USD');

      const unified = (adapter as any).symbolFromExchange('BTC-USD');
      expect(unified).toBe('BTC/USD:USD');
    });
  });

  // -------------------------------------------------------------------------
  // 2. Public market data
  // -------------------------------------------------------------------------

  describe('fetchMarkets', () => {
    test('returns normalized markets and caches them', async () => {
      const adapter = makeAdapter();
      const http = getHttp(adapter);
      http.get.mockResolvedValue([mockMarket(), mockMarket({ market: 'ETH-USD', baseAsset: 'ETH' })]);

      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(2);
      expect(markets[0]!.symbol).toBe('BTC/USD:USD');
      expect(markets[1]!.symbol).toBe('ETH/USD:USD');
      // Cache should be populated
      expect((adapter as any).marketCache).toHaveLength(2);
    });

    test('calls /markets endpoint', async () => {
      const adapter = makeAdapter();
      const http = getHttp(adapter);
      http.get.mockResolvedValue([mockMarket()]);

      await adapter.fetchMarkets();

      expect(http.get).toHaveBeenCalledWith(expect.stringContaining('/markets'));
    });
  });

  describe('_fetchTicker', () => {
    test('returns normalized ticker', async () => {
      const adapter = makeAdapter();
      const http = getHttp(adapter);
      http.get.mockResolvedValue([mockTicker()]);

      const ticker = await adapter._fetchTicker('BTC/USD:USD');

      expect(ticker).toBeDefined();
      expect(ticker.symbol).toBe('BTC/USD:USD');
      expect(typeof ticker.last).toBe('number');
    });

    test('throws PerpDEXError when response is empty', async () => {
      const adapter = makeAdapter();
      const http = getHttp(adapter);
      http.get.mockResolvedValue([]);

      await expect(adapter._fetchTicker('BTC/USD:USD')).rejects.toThrow(PerpDEXError);
      await expect(adapter._fetchTicker('BTC/USD:USD')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('_fetchOrderBook', () => {
    test('returns normalized orderbook with bids and asks', async () => {
      const adapter = makeAdapter();
      const http = getHttp(adapter);
      http.get.mockResolvedValue(mockOrderBook());

      const ob = await adapter._fetchOrderBook('BTC/USD:USD');

      expect(ob).toBeDefined();
      expect(ob.symbol).toBe('BTC/USD:USD');
      expect(Array.isArray(ob.bids)).toBe(true);
      expect(Array.isArray(ob.asks)).toBe(true);
      expect(ob.bids[0]).toHaveLength(2);
      expect(ob.asks[0]).toHaveLength(2);
    });
  });

  describe('_fetchTrades', () => {
    test('returns normalized trades array', async () => {
      const adapter = makeAdapter();
      const http = getHttp(adapter);
      http.get.mockResolvedValue([mockTrade(), mockTrade({ fillId: 'fill-002', side: 'sell' })]);

      const trades = await adapter._fetchTrades('BTC/USD:USD');

      expect(trades).toHaveLength(2);
      expect(trades[0]!.symbol).toBe('BTC/USD:USD');
      expect(typeof trades[0]!.price).toBe('number');
    });
  });

  describe('fetchOHLCV', () => {
    test('returns OHLCV tuples as [timestamp, o, h, l, c, v]', async () => {
      const adapter = makeAdapter();
      const http = getHttp(adapter);
      http.get.mockResolvedValue([mockCandle()]);

      const ohlcv = await adapter.fetchOHLCV('BTC/USD:USD', '1h');

      expect(ohlcv).toHaveLength(1);
      const candle = ohlcv[0]!;
      expect(candle).toHaveLength(6);
      expect(candle[0]).toBe(NOW - 3600000); // timestamp
      expect(typeof candle[1]).toBe('number'); // open
      expect(typeof candle[2]).toBe('number'); // high
      expect(typeof candle[3]).toBe('number'); // low
      expect(typeof candle[4]).toBe('number'); // close
      expect(typeof candle[5]).toBe('number'); // volume
    });
  });

  describe('_fetchFundingRate', () => {
    test('returns normalized funding rate', async () => {
      const adapter = makeAdapter();
      const http = getHttp(adapter);
      http.get.mockResolvedValue([mockFundingRate()]);

      const fr = await adapter._fetchFundingRate('BTC/USD:USD');

      expect(fr).toBeDefined();
      expect(fr.symbol).toBe('BTC/USD:USD');
      expect(typeof fr.fundingRate).toBe('number');
    });
  });

  describe('fetchFundingRateHistory', () => {
    test('returns array of normalized funding rates', async () => {
      const adapter = makeAdapter();
      const http = getHttp(adapter);
      http.get.mockResolvedValue([
        mockFundingRate(),
        mockFundingRate({ time: NOW - 28800000, rate: '0.00020000' }),
      ]);

      const history = await adapter.fetchFundingRateHistory('BTC/USD:USD');

      expect(history).toHaveLength(2);
      expect(history[0]!.symbol).toBe('BTC/USD:USD');
    });

    test('passes since param as start query parameter', async () => {
      const adapter = makeAdapter();
      const http = getHttp(adapter);
      http.get.mockResolvedValue([mockFundingRate()]);

      await adapter.fetchFundingRateHistory('BTC/USD:USD', NOW - 86400000, 10);

      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('start='),
      );
    });
  });

  // -------------------------------------------------------------------------
  // 3. Private trading
  // -------------------------------------------------------------------------

  describe('createOrder', () => {
    test('calls signOrder and posts to /orders', async () => {
      const adapter = makeAdapter();
      stubAuth(adapter);
      const http = getHttp(adapter);
      http.post.mockResolvedValue(mockOrder());

      const order = await adapter.createOrder({
        symbol: 'BTC/USD:USD',
        side: 'buy',
        type: 'limit',
        amount: 0.1,
        price: 50000,
      });

      expect((adapter as any).auth.signOrder).toHaveBeenCalledTimes(1);
      expect(http.post).toHaveBeenCalledWith(
        '/orders',
        expect.objectContaining({ body: expect.objectContaining({ signature: '0xSIGNATURE' }) }),
      );
      expect(order.id).toBe('order-001');
    });
  });

  describe('cancelOrder', () => {
    test('calls signCancel and sends DELETE /orders', async () => {
      const adapter = makeAdapter();
      stubAuth(adapter);
      const http = getHttp(adapter);
      http.delete.mockResolvedValue(mockOrder({ state: 'canceled' }));

      const order = await adapter.cancelOrder('order-001', 'BTC/USD:USD');

      expect((adapter as any).auth.signCancel).toHaveBeenCalledTimes(1);
      expect(http.delete).toHaveBeenCalledWith(
        '/orders',
        expect.objectContaining({ body: expect.objectContaining({ orderId: 'order-001', signature: '0xCANCEL_SIG' }) }),
      );
      expect(order.id).toBe('order-001');
    });
  });

  describe('cancelAllOrders', () => {
    test('handles array response and returns normalized orders', async () => {
      const adapter = makeAdapter();
      stubAuth(adapter);
      const http = getHttp(adapter);
      http.delete.mockResolvedValue([mockOrder({ state: 'canceled' }), mockOrder({ orderId: 'order-002', state: 'canceled' })]);

      const orders = await adapter.cancelAllOrders();

      expect(orders).toHaveLength(2);
      expect(orders[0]!.status).toBe('canceled');
    });
  });

  describe('fetchOpenOrders', () => {
    test('passes wallet and status=open as query params', async () => {
      const adapter = makeAdapter();
      stubAuth(adapter);
      const http = getHttp(adapter);
      http.get.mockResolvedValue([mockOrder()]);

      const orders = await adapter.fetchOpenOrders();

      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('status=open'),
        expect.any(Object),
      );
      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('wallet=0xWALLET'),
        expect.any(Object),
      );
      expect(orders).toHaveLength(1);
    });
  });

  describe('fetchOrderHistory', () => {
    test('passes since and limit params', async () => {
      const adapter = makeAdapter();
      stubAuth(adapter);
      const http = getHttp(adapter);
      http.get.mockResolvedValue([mockOrder({ state: 'filled' })]);

      await adapter.fetchOrderHistory('BTC/USD:USD', NOW - 86400000, 25);

      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('start='),
        expect.any(Object),
      );
      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=25'),
        expect.any(Object),
      );
    });
  });

  describe('fetchMyTrades', () => {
    test('calls /fills endpoint and returns normalized trades', async () => {
      const adapter = makeAdapter();
      stubAuth(adapter);
      const http = getHttp(adapter);
      http.get.mockResolvedValue([mockFill(), mockFill({ fillId: 'fill-002', side: 'sell' })]);

      const trades = await adapter.fetchMyTrades('BTC/USD:USD');

      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('/fills'),
        expect.any(Object),
      );
      expect(trades).toHaveLength(2);
      expect(trades[0]!.symbol).toBe('BTC/USD:USD');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Positions & balance
  // -------------------------------------------------------------------------

  describe('fetchPositions', () => {
    test('returns normalized positions', async () => {
      const adapter = makeAdapter();
      stubAuth(adapter);
      const http = getHttp(adapter);
      http.get.mockResolvedValue([mockPosition(), mockPosition({ market: 'ETH-USD', quantity: '10.00000000' })]);

      const positions = await adapter.fetchPositions();

      expect(positions).toHaveLength(2);
      expect(positions[0]!.symbol).toBe('BTC/USD:USD');
      expect(typeof positions[0]!.size).toBe('number');
    });

    test('filters positions by symbol', async () => {
      const adapter = makeAdapter();
      stubAuth(adapter);
      const http = getHttp(adapter);
      http.get.mockResolvedValue([mockPosition(), mockPosition({ market: 'ETH-USD', quantity: '10.00000000' })]);

      const positions = await adapter.fetchPositions(['BTC/USD:USD']);

      expect(positions).toHaveLength(1);
      expect(positions[0]!.symbol).toBe('BTC/USD:USD');
    });
  });

  describe('fetchBalance', () => {
    test('normalizes vbUSDC collateral and returns balance array', async () => {
      const adapter = makeAdapter();
      stubAuth(adapter);
      const http = getHttp(adapter);
      http.get.mockResolvedValue(mockWallet());

      const balances = await adapter.fetchBalance();

      expect(balances).toHaveLength(1);
      // Katana quote asset is USD/vbUSDC — normalizeBalance maps it to USDC or USD
      expect(['USDC', 'USD', 'vbUSDC']).toContain(balances[0]!.currency);
      expect(typeof balances[0]!.total).toBe('number');
      expect(typeof balances[0]!.free).toBe('number');
    });
  });

  describe('_setLeverage', () => {
    test('calls /initialMarginFractionOverride with correct fraction', async () => {
      const adapter = makeAdapter();
      stubAuth(adapter);
      const http = getHttp(adapter);
      http.post.mockResolvedValue({});

      await adapter._setLeverage('BTC/USD:USD', 20);

      expect(http.post).toHaveBeenCalledWith(
        '/initialMarginFractionOverride',
        expect.objectContaining({
          body: expect.objectContaining({
            market: 'BTC-USD',
            // 1/20 = 0.05 formatted as 8-decimal string
            initialMarginFraction: '0.05000000',
          }),
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // 5. Emergency close
  // -------------------------------------------------------------------------

  describe('emergencyCloseAll', () => {
    test('calls DELETE /wallets/{wallet} with signed payload', async () => {
      const adapter = makeAdapter();
      stubAuth(adapter);
      const http = getHttp(adapter);
      http.delete.mockResolvedValue({});

      await adapter.emergencyCloseAll();

      expect((adapter as any).auth.signCancel).toHaveBeenCalledTimes(1);
      expect(http.delete).toHaveBeenCalledWith(
        '/wallets/0xWALLET',
        expect.objectContaining({
          body: expect.objectContaining({ wallet: '0xWALLET', signature: '0xCANCEL_SIG' }),
        }),
      );
    });

    test('throws when wallet is not available', async () => {
      const adapter = makeAdapter();
      stubAuth(adapter, {
        requireWallet: jest.fn().mockImplementation(() => {
          throw new Error('Wallet required for trading operations. Provide wallet in config.');
        }),
      });

      await expect(adapter.emergencyCloseAll()).rejects.toThrow('Wallet required');
    });
  });

  // -------------------------------------------------------------------------
  // 6. FeatureMap
  // -------------------------------------------------------------------------

  describe('FeatureMap', () => {
    test('has.createBatchOrders is false', () => {
      const adapter = makeAdapter();
      expect(adapter.has.createBatchOrders).toBe(false);
    });

    test('has.setMarginMode is false (cross-margin only)', () => {
      const adapter = makeAdapter();
      expect(adapter.has.setMarginMode).toBe(false);
    });
  });
});

/**
 * AsterAdapter Tests
 *
 * Tests for Aster Exchange adapter (Binance-style API, BNB Chain)
 */

import { AsterAdapter } from '../../src/adapters/aster/AsterAdapter.js';
import { AsterNormalizer } from '../../src/adapters/aster/AsterNormalizer.js';
import { PerpDEXError, RateLimitError, InvalidSignatureError, OrderNotFoundError, InsufficientMarginError, InvalidOrderError, ExchangeUnavailableError } from '../../src/types/errors.js';
import { mapAsterError, isRetryableError, ASTER_ERROR_CODES } from '../../src/adapters/aster/error-codes.js';
import { toAsterSymbol, toUnifiedSymbol, toAsterOrderSide, toAsterOrderType, toAsterTimeInForce, buildOrderParams, parsePrecision } from '../../src/adapters/aster/utils.js';
import { ASTER_API_URLS, ASTER_ORDER_STATUS } from '../../src/adapters/aster/constants.js';

// Mock HTTPClient
jest.mock('../../src/core/http/HTTPClient.js', () => ({
  HTTPClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock crypto for AsterAuth
jest.mock('../../src/utils/crypto.js', () => ({
  createHmacSha256: jest.fn().mockResolvedValue('mock-signature'),
}));

describe('AsterAdapter', () => {
  let adapter: AsterAdapter;
  let mockHttpClient: {
    get: jest.Mock;
    post: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new AsterAdapter();
    mockHttpClient = (adapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
  });

  // =========================================================================
  // Constructor
  // =========================================================================

  describe('constructor', () => {
    test('creates adapter with default config', () => {
      const a = new AsterAdapter();
      expect(a.id).toBe('aster');
      expect(a.name).toBe('Aster');
    });

    test('creates adapter with API credentials', () => {
      const a = new AsterAdapter({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });
      expect(a).toBeInstanceOf(AsterAdapter);
    });

    test('creates adapter for testnet', () => {
      const a = new AsterAdapter({ testnet: true });
      expect(a).toBeInstanceOf(AsterAdapter);
    });

    test('creates adapter with referral code', () => {
      const a = new AsterAdapter({ referralCode: 'REF123' });
      expect(a).toBeInstanceOf(AsterAdapter);
    });

    test('creates adapter with builderCode as referral fallback', () => {
      const a = new AsterAdapter({ builderCode: 'BUILD456' });
      expect(a).toBeInstanceOf(AsterAdapter);
    });

    test('creates adapter with custom timeout', () => {
      const a = new AsterAdapter({ timeout: 60000 });
      expect(a).toBeInstanceOf(AsterAdapter);
    });

    test('creates adapter with custom apiUrl', () => {
      const a = new AsterAdapter({ apiUrl: 'https://custom.api.com' });
      expect(a).toBeInstanceOf(AsterAdapter);
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
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.setLeverage).toBe(true);
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
    const mockExchangeInfo = {
      timezone: 'UTC',
      serverTime: 1700000000000,
      symbols: [
        {
          symbol: 'BTCUSDT',
          pair: 'BTCUSDT',
          contractType: 'PERPETUAL',
          deliveryDate: 0,
          onboardDate: 1700000000000,
          status: 'TRADING',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          marginAsset: 'USDT',
          pricePrecision: 2,
          quantityPrecision: 3,
          baseAssetPrecision: 8,
          quotePrecision: 8,
          underlyingType: 'COIN',
          settlePlan: 0,
          triggerProtect: '0.0500',
          filters: [
            { filterType: 'PRICE_FILTER', minPrice: '0.10', maxPrice: '1000000', tickSize: '0.10' },
            { filterType: 'LOT_SIZE', minQty: '0.001', maxQty: '1000', stepSize: '0.001' },
          ],
          orderTypes: ['LIMIT', 'MARKET'],
          timeInForce: ['GTC', 'IOC', 'FOK'],
          liquidationFee: '0.012500',
          marketTakeBound: '0.05',
        },
        {
          symbol: 'ETHUSDT',
          pair: 'ETHUSDT',
          contractType: 'PERPETUAL',
          deliveryDate: 0,
          onboardDate: 1700000000000,
          status: 'TRADING',
          baseAsset: 'ETH',
          quoteAsset: 'USDT',
          marginAsset: 'USDT',
          pricePrecision: 2,
          quantityPrecision: 3,
          baseAssetPrecision: 8,
          quotePrecision: 8,
          underlyingType: 'COIN',
          settlePlan: 0,
          triggerProtect: '0.0500',
          filters: [
            { filterType: 'PRICE_FILTER', minPrice: '0.01', maxPrice: '100000', tickSize: '0.01' },
            { filterType: 'LOT_SIZE', minQty: '0.01', maxQty: '10000', stepSize: '0.01' },
          ],
          orderTypes: ['LIMIT', 'MARKET'],
          timeInForce: ['GTC', 'IOC', 'FOK'],
          liquidationFee: '0.012500',
          marketTakeBound: '0.05',
        },
        {
          symbol: 'BTCUSDT_0329',
          pair: 'BTCUSDT',
          contractType: 'CURRENT_QUARTER',
          deliveryDate: 1711670400000,
          onboardDate: 1700000000000,
          status: 'TRADING',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          marginAsset: 'USDT',
          pricePrecision: 2,
          quantityPrecision: 3,
          baseAssetPrecision: 8,
          quotePrecision: 8,
          underlyingType: 'COIN',
          settlePlan: 0,
          triggerProtect: '0.0500',
          filters: [],
          orderTypes: ['LIMIT', 'MARKET'],
          timeInForce: ['GTC'],
          liquidationFee: '0.012500',
          marketTakeBound: '0.05',
        },
      ],
    };

    test('fetches and normalizes markets', async () => {
      mockHttpClient.get.mockResolvedValue(mockExchangeInfo);

      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(2); // Only PERPETUAL + TRADING
      expect(markets[0].symbol).toBe('BTC/USDT:USDT');
      expect(markets[0].base).toBe('BTC');
      expect(markets[0].quote).toBe('USDT');
      expect(markets[0].active).toBe(true);
      expect(markets[0].pricePrecision).toBe(2);
      expect(markets[0].priceTickSize).toBe(0.1);
      expect(markets[0].amountStepSize).toBe(0.001);
      expect(markets[0].minAmount).toBe(0.001);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/fapi/v1/exchangeInfo');
    });

    test('filters out non-PERPETUAL contracts', async () => {
      mockHttpClient.get.mockResolvedValue(mockExchangeInfo);

      const markets = await adapter.fetchMarkets();

      const quarterly = markets.find((m) => m.id === 'BTCUSDT_0329');
      expect(quarterly).toBeUndefined();
    });

    test('throws on invalid response', async () => {
      mockHttpClient.get.mockResolvedValue({ invalid: true });

      await expect(adapter.fetchMarkets()).rejects.toThrow(PerpDEXError);
    });

    test('throws on null response', async () => {
      mockHttpClient.get.mockResolvedValue(null);

      await expect(adapter.fetchMarkets()).rejects.toThrow('Invalid exchangeInfo response');
    });
  });

  // =========================================================================
  // fetchTicker
  // =========================================================================

  describe('fetchTicker', () => {
    const mockTicker = {
      symbol: 'BTCUSDT',
      priceChange: '500.00',
      priceChangePercent: '1.25',
      weightedAvgPrice: '40250.00',
      lastPrice: '40500.00',
      lastQty: '0.1',
      openPrice: '40000.00',
      highPrice: '41000.00',
      lowPrice: '39500.00',
      volume: '50000',
      quoteVolume: '2012500000',
      openTime: 1700000000000,
      closeTime: 1700086400000,
      firstId: 1,
      lastId: 100000,
      count: 100000,
    };

    test('fetches and normalizes ticker', async () => {
      mockHttpClient.get.mockResolvedValue(mockTicker);

      const ticker = await adapter.fetchTicker('BTC/USDT:USDT');

      expect(ticker.symbol).toBe('BTC/USDT:USDT');
      expect(ticker.last).toBe(40500);
      expect(ticker.high).toBe(41000);
      expect(ticker.low).toBe(39500);
      expect(ticker.open).toBe(40000);
      expect(ticker.change).toBe(500);
      expect(ticker.percentage).toBe(1.25);
      expect(ticker.baseVolume).toBe(50000);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/fapi/v1/ticker/24hr?symbol=BTCUSDT');
    });

    test('converts symbol correctly', async () => {
      mockHttpClient.get.mockResolvedValue(mockTicker);

      await adapter.fetchTicker('ETH/USDT:USDT');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/fapi/v1/ticker/24hr?symbol=ETHUSDT');
    });
  });

  // =========================================================================
  // fetchOrderBook
  // =========================================================================

  describe('fetchOrderBook', () => {
    const mockOrderBook = {
      lastUpdateId: 12345,
      bids: [['40000.00', '1.5'], ['39999.00', '2.0']] as [string, string][],
      asks: [['40001.00', '1.0'], ['40002.00', '3.0']] as [string, string][],
      T: 1700000000000,
    };

    test('fetches and normalizes order book', async () => {
      mockHttpClient.get.mockResolvedValue(mockOrderBook);

      const ob = await adapter.fetchOrderBook('BTC/USDT:USDT');

      expect(ob.symbol).toBe('BTC/USDT:USDT');
      expect(ob.exchange).toBe('aster');
      expect(ob.bids).toHaveLength(2);
      expect(ob.bids[0]).toEqual([40000, 1.5]);
      expect(ob.asks[0]).toEqual([40001, 1.0]);
      expect(ob.timestamp).toBe(1700000000000);
    });

    test('passes limit parameter', async () => {
      mockHttpClient.get.mockResolvedValue(mockOrderBook);

      await adapter.fetchOrderBook('BTC/USDT:USDT', { limit: 50 });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/fapi/v1/depth?symbol=BTCUSDT&limit=50');
    });

    test('uses default limit of 20', async () => {
      mockHttpClient.get.mockResolvedValue(mockOrderBook);

      await adapter.fetchOrderBook('BTC/USDT:USDT');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/fapi/v1/depth?symbol=BTCUSDT&limit=20');
    });
  });

  // =========================================================================
  // fetchTrades
  // =========================================================================

  describe('fetchTrades', () => {
    const mockTrades = [
      { id: 1, price: '40000', qty: '0.5', quoteQty: '20000', time: 1700000000000, isBuyerMaker: false },
      { id: 2, price: '40001', qty: '1.0', quoteQty: '40001', time: 1700000001000, isBuyerMaker: true },
    ];

    test('fetches and normalizes trades', async () => {
      mockHttpClient.get.mockResolvedValue(mockTrades);

      const trades = await adapter.fetchTrades('BTC/USDT:USDT');

      expect(trades).toHaveLength(2);
      expect(trades[0].id).toBe('1');
      expect(trades[0].price).toBe(40000);
      expect(trades[0].amount).toBe(0.5);
      expect(trades[0].side).toBe('buy'); // isBuyerMaker=false => taker bought
      expect(trades[1].side).toBe('sell'); // isBuyerMaker=true => taker sold
    });

    test('throws on invalid response', async () => {
      mockHttpClient.get.mockResolvedValue({ invalid: true });

      await expect(adapter.fetchTrades('BTC/USDT:USDT')).rejects.toThrow('Invalid trades response');
    });

    test('passes limit parameter', async () => {
      mockHttpClient.get.mockResolvedValue(mockTrades);

      await adapter.fetchTrades('BTC/USDT:USDT', { limit: 50 });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/fapi/v1/trades?symbol=BTCUSDT&limit=50');
    });
  });

  // =========================================================================
  // fetchFundingRate
  // =========================================================================

  describe('fetchFundingRate', () => {
    const mockFundingRate = {
      symbol: 'BTCUSDT',
      markPrice: '40500.00',
      indexPrice: '40490.00',
      estimatedSettlePrice: '40495.00',
      lastFundingRate: '0.0001',
      nextFundingTime: 1700028800000,
      interestRate: '0.0001',
      time: 1700000000000,
    };

    test('fetches and normalizes funding rate', async () => {
      mockHttpClient.get.mockResolvedValue(mockFundingRate);

      const fr = await adapter.fetchFundingRate('BTC/USDT:USDT');

      expect(fr.symbol).toBe('BTC/USDT:USDT');
      expect(fr.fundingRate).toBe(0.0001);
      expect(fr.markPrice).toBe(40500);
      expect(fr.indexPrice).toBe(40490);
      expect(fr.nextFundingTimestamp).toBe(1700028800000);
      expect(fr.fundingIntervalHours).toBe(8);
    });
  });

  // =========================================================================
  // fetchOHLCV
  // =========================================================================

  describe('fetchOHLCV', () => {
    const mockKlines = [
      [1700000000000, '40000', '40500', '39500', '40250', '1000', 1700003600000, '40250000', 500, '600', '24150000', '0'],
      [1700003600000, '40250', '40800', '40100', '40700', '800', 1700007200000, '32560000', 400, '500', '20350000', '0'],
    ];

    test('fetches and normalizes OHLCV data', async () => {
      mockHttpClient.get.mockResolvedValue(mockKlines);

      const candles = await adapter.fetchOHLCV('BTC/USDT:USDT', '1h');

      expect(candles).toHaveLength(2);
      expect(candles[0]).toEqual([1700000000000, 40000, 40500, 39500, 40250, 1000]);
      expect(candles[1][0]).toBe(1700003600000);
    });

    test('passes limit, since, and until params', async () => {
      mockHttpClient.get.mockResolvedValue(mockKlines);

      await adapter.fetchOHLCV('BTC/USDT:USDT', '4h', {
        limit: 100,
        since: 1700000000000,
        until: 1700100000000,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/fapi/v1/klines?symbol=BTCUSDT&interval=4h&limit=100&startTime=1700000000000&endTime=1700100000000'
      );
    });

    test('throws on invalid response', async () => {
      mockHttpClient.get.mockResolvedValue({ invalid: true });

      await expect(adapter.fetchOHLCV('BTC/USDT:USDT', '1h')).rejects.toThrow('Invalid klines response');
    });
  });

  // =========================================================================
  // createOrder (requires auth)
  // =========================================================================

  describe('createOrder', () => {
    let authAdapter: AsterAdapter;
    let authMockHttp: typeof mockHttpClient;

    beforeEach(() => {
      authAdapter = new AsterAdapter({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });
      authMockHttp = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    });

    const mockOrderResponse = {
      orderId: 123456,
      symbol: 'BTCUSDT',
      status: 'NEW',
      clientOrderId: 'my-order-1',
      price: '40000.00',
      avgPrice: '0',
      origQty: '0.1',
      executedQty: '0',
      cumQuote: '0',
      timeInForce: 'GTC',
      type: 'LIMIT',
      reduceOnly: false,
      closePosition: false,
      side: 'BUY',
      positionSide: 'BOTH',
      stopPrice: '0',
      workingType: 'CONTRACT_PRICE',
      origType: 'LIMIT',
      updateTime: 1700000000000,
    };

    test('creates a limit order', async () => {
      authMockHttp.post.mockResolvedValue(mockOrderResponse);

      const order = await authAdapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 40000,
      });

      expect(order.id).toBe('123456');
      expect(order.symbol).toBe('BTC/USDT:USDT');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.amount).toBe(0.1);
      expect(order.status).toBe('open');
    });

    test('creates a market order', async () => {
      const marketResponse = { ...mockOrderResponse, type: 'MARKET', origType: 'MARKET', price: '0' };
      authMockHttp.post.mockResolvedValue(marketResponse);

      const order = await authAdapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'market',
        side: 'sell',
        amount: 0.5,
      });

      expect(order.type).toBe('market');
      expect(order.side).toBe('buy'); // mock has side: 'BUY' -> normalized to 'buy'
    });

    test('includes referral code from adapter config', async () => {
      const refAdapter = new AsterAdapter({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        referralCode: 'REF_CODE',
      });
      const refMock = (refAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
      refMock.post.mockResolvedValue(mockOrderResponse);

      await refAdapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 40000,
      });

      expect(refMock.post).toHaveBeenCalled();
    });

    test('builderCode in order overrides adapter referral code', async () => {
      const refAdapter = new AsterAdapter({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        referralCode: 'ADAPTER_REF',
      });
      const refMock = (refAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
      refMock.post.mockResolvedValue(mockOrderResponse);

      await refAdapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 40000,
        builderCode: 'ORDER_REF',
      });

      expect(refMock.post).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // cancelOrder
  // =========================================================================

  describe('cancelOrder', () => {
    let authAdapter: AsterAdapter;
    let authMockHttp: typeof mockHttpClient;

    beforeEach(() => {
      authAdapter = new AsterAdapter({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });
      authMockHttp = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    });

    test('cancels an order', async () => {
      const mockCancelResponse = {
        orderId: 123456,
        symbol: 'BTCUSDT',
        status: 'CANCELED',
        clientOrderId: 'my-order-1',
        price: '40000.00',
        avgPrice: '0',
        origQty: '0.1',
        executedQty: '0',
        cumQuote: '0',
        timeInForce: 'GTC',
        type: 'LIMIT',
        reduceOnly: false,
        closePosition: false,
        side: 'BUY',
        positionSide: 'BOTH',
        stopPrice: '0',
        workingType: 'CONTRACT_PRICE',
        origType: 'LIMIT',
        updateTime: 1700000000000,
      };

      authMockHttp.delete.mockResolvedValue(mockCancelResponse);

      const order = await authAdapter.cancelOrder('123456', 'BTC/USDT:USDT');

      expect(order.id).toBe('123456');
      expect(order.status).toBe('canceled');
    });

    test('throws when symbol is missing', async () => {
      await expect(authAdapter.cancelOrder('123456')).rejects.toThrow('Symbol required');
    });
  });

  // =========================================================================
  // cancelAllOrders
  // =========================================================================

  describe('cancelAllOrders', () => {
    let authAdapter: AsterAdapter;
    let authMockHttp: typeof mockHttpClient;

    beforeEach(() => {
      authAdapter = new AsterAdapter({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });
      authMockHttp = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    });

    test('cancels all orders for a symbol', async () => {
      authMockHttp.delete.mockResolvedValue({ code: 200, msg: 'success' });

      const orders = await authAdapter.cancelAllOrders('BTC/USDT:USDT');

      expect(orders).toEqual([]);
      expect(authMockHttp.delete).toHaveBeenCalled();
    });

    test('throws when symbol is missing', async () => {
      await expect(authAdapter.cancelAllOrders()).rejects.toThrow('Symbol required');
    });
  });

  // =========================================================================
  // fetchPositions
  // =========================================================================

  describe('fetchPositions', () => {
    let authAdapter: AsterAdapter;
    let authMockHttp: typeof mockHttpClient;

    beforeEach(() => {
      authAdapter = new AsterAdapter({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });
      authMockHttp = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    });

    test('fetches and normalizes positions', async () => {
      const mockPositions = [
        {
          symbol: 'BTCUSDT',
          positionAmt: '0.5',
          entryPrice: '40000',
          markPrice: '40500',
          unRealizedProfit: '250',
          liquidationPrice: '35000',
          leverage: '10',
          maxNotionalValue: '1000000',
          marginType: 'cross',
          isolatedMargin: '0',
          isAutoAddMargin: 'false',
          positionSide: 'BOTH',
          notional: '20250',
          isolatedWallet: '0',
          updateTime: 1700000000000,
        },
        {
          symbol: 'ETHUSDT',
          positionAmt: '0',
          entryPrice: '0',
          markPrice: '2200',
          unRealizedProfit: '0',
          liquidationPrice: '0',
          leverage: '5',
          maxNotionalValue: '500000',
          marginType: 'cross',
          isolatedMargin: '0',
          isAutoAddMargin: 'false',
          positionSide: 'BOTH',
          notional: '0',
          isolatedWallet: '0',
          updateTime: 1700000000000,
        },
      ];

      authMockHttp.get.mockResolvedValue(mockPositions);

      const positions = await authAdapter.fetchPositions();

      expect(positions).toHaveLength(1); // Filters zero-amount positions
      expect(positions[0].symbol).toBe('BTCUSDT');
      expect(positions[0].size).toBe(0.5);
      expect(positions[0].side).toBe('long');
      expect(positions[0].entryPrice).toBe(40000);
      expect(positions[0].leverage).toBe(10);
      expect(positions[0].marginMode).toBe('cross');
    });

    test('filters zero-amount positions', async () => {
      const mockPositions = [
        {
          symbol: 'BTCUSDT', positionAmt: '0', entryPrice: '0', markPrice: '40000',
          unRealizedProfit: '0', liquidationPrice: '0', leverage: '10',
          maxNotionalValue: '1000000', marginType: 'cross', isolatedMargin: '0',
          isAutoAddMargin: 'false', positionSide: 'BOTH', notional: '0',
          isolatedWallet: '0', updateTime: 1700000000000,
        },
      ];

      authMockHttp.get.mockResolvedValue(mockPositions);

      const positions = await authAdapter.fetchPositions();

      expect(positions).toHaveLength(0);
    });

    test('throws on invalid response', async () => {
      authMockHttp.get.mockResolvedValue({ invalid: true });

      await expect(authAdapter.fetchPositions()).rejects.toThrow('Invalid positions response');
    });
  });

  // =========================================================================
  // fetchBalance
  // =========================================================================

  describe('fetchBalance', () => {
    let authAdapter: AsterAdapter;
    let authMockHttp: typeof mockHttpClient;

    beforeEach(() => {
      authAdapter = new AsterAdapter({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });
      authMockHttp = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    });

    test('fetches and normalizes balances', async () => {
      const mockBalances = [
        {
          accountAlias: 'main', asset: 'USDT', balance: '10000',
          crossWalletBalance: '9000', crossUnPnl: '250',
          availableBalance: '8000', maxWithdrawAmount: '8000',
          marginAvailable: true, updateTime: 1700000000000,
        },
        {
          accountAlias: 'main', asset: 'BNB', balance: '0',
          crossWalletBalance: '0', crossUnPnl: '0',
          availableBalance: '0', maxWithdrawAmount: '0',
          marginAvailable: true, updateTime: 1700000000000,
        },
      ];

      authMockHttp.get.mockResolvedValue(mockBalances);

      const balances = await authAdapter.fetchBalance();

      expect(balances).toHaveLength(1); // Filters zero balances
      expect(balances[0].currency).toBe('USDT');
      expect(balances[0].total).toBe(10000);
      expect(balances[0].free).toBe(8000);
      expect(balances[0].used).toBe(2000);
    });

    test('filters zero balances', async () => {
      const mockBalances = [
        {
          accountAlias: 'main', asset: 'USDT', balance: '0',
          crossWalletBalance: '0', crossUnPnl: '0',
          availableBalance: '0', maxWithdrawAmount: '0',
          marginAvailable: true, updateTime: 1700000000000,
        },
      ];

      authMockHttp.get.mockResolvedValue(mockBalances);

      const balances = await authAdapter.fetchBalance();

      expect(balances).toHaveLength(0);
    });

    test('throws on invalid response', async () => {
      authMockHttp.get.mockResolvedValue({ invalid: true });

      await expect(authAdapter.fetchBalance()).rejects.toThrow('Invalid balance response');
    });
  });

  // =========================================================================
  // setLeverage
  // =========================================================================

  describe('setLeverage', () => {
    let authAdapter: AsterAdapter;
    let authMockHttp: typeof mockHttpClient;

    beforeEach(() => {
      authAdapter = new AsterAdapter({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });
      authMockHttp = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    });

    test('sets leverage for a symbol', async () => {
      authMockHttp.post.mockResolvedValue({
        leverage: 20,
        maxNotionalValue: '500000',
        symbol: 'BTCUSDT',
      });

      await expect(
        authAdapter.setLeverage('BTC/USDT:USDT', 20)
      ).resolves.not.toThrow();
    });
  });

  // =========================================================================
  // requireAuth
  // =========================================================================

  describe('requireAuth', () => {
    test('throws when no credentials', async () => {
      const noAuthAdapter = new AsterAdapter();

      await expect(
        noAuthAdapter.createOrder({
          symbol: 'BTC/USDT:USDT',
          type: 'market',
          side: 'buy',
          amount: 0.1,
        })
      ).rejects.toThrow('API key and secret required');
    });

    test('throws for fetchPositions without auth', async () => {
      const noAuthAdapter = new AsterAdapter();

      await expect(noAuthAdapter.fetchPositions()).rejects.toThrow('API key and secret required');
    });

    test('throws for fetchBalance without auth', async () => {
      const noAuthAdapter = new AsterAdapter();

      await expect(noAuthAdapter.fetchBalance()).rejects.toThrow('API key and secret required');
    });

    test('throws for setLeverage without auth', async () => {
      const noAuthAdapter = new AsterAdapter();

      await expect(noAuthAdapter.setLeverage('BTC/USDT:USDT', 10)).rejects.toThrow('API key and secret required');
    });
  });

  // =========================================================================
  // Error mapping
  // =========================================================================

  describe('error mapping', () => {
    test('maps rate limit errors', () => {
      const err = mapAsterError(-1003, 'Too many requests');
      expect(err).toBeInstanceOf(RateLimitError);
      expect(err.exchange).toBe('aster');
    });

    test('maps too many orders as rate limit', () => {
      const err = mapAsterError(-1015, 'Too many orders');
      expect(err).toBeInstanceOf(RateLimitError);
    });

    test('maps invalid signature errors', () => {
      const err = mapAsterError(-1022, 'Invalid signature');
      expect(err).toBeInstanceOf(InvalidSignatureError);
    });

    test('maps bad API key format', () => {
      const err = mapAsterError(-2014, 'Bad API key');
      expect(err).toBeInstanceOf(InvalidSignatureError);
    });

    test('maps rejected MBX key', () => {
      const err = mapAsterError(-2015, 'Rejected key');
      expect(err).toBeInstanceOf(InvalidSignatureError);
    });

    test('maps order not found errors', () => {
      const err = mapAsterError(-2013, 'No such order');
      expect(err).toBeInstanceOf(OrderNotFoundError);
    });

    test('maps order not found by code -2026', () => {
      const err = mapAsterError(-2026, 'Order not found');
      expect(err).toBeInstanceOf(OrderNotFoundError);
    });

    test('maps insufficient balance error', () => {
      const err = mapAsterError(-2018, 'Balance not sufficient');
      expect(err).toBeInstanceOf(InsufficientMarginError);
    });

    test('maps insufficient margin error', () => {
      const err = mapAsterError(-2019, 'Margin not sufficient');
      expect(err).toBeInstanceOf(InsufficientMarginError);
    });

    test('maps invalid order errors', () => {
      const err = mapAsterError(-2010, 'Order rejected');
      expect(err).toBeInstanceOf(InvalidOrderError);
    });

    test('maps post-only reject', () => {
      const err = mapAsterError(-4046, 'Post only reject');
      expect(err).toBeInstanceOf(InvalidOrderError);
    });

    test('maps exchange unavailable errors', () => {
      const err = mapAsterError(-1001, 'Disconnected');
      expect(err).toBeInstanceOf(ExchangeUnavailableError);
    });

    test('maps server busy', () => {
      const err = mapAsterError(-1010, 'Server busy');
      expect(err).toBeInstanceOf(ExchangeUnavailableError);
    });

    test('maps unknown codes to PerpDEXError', () => {
      const err = mapAsterError(-9999, 'Unknown error');
      expect(err).toBeInstanceOf(PerpDEXError);
      expect(err.code).toBe('-9999');
    });

    test('isRetryableError returns true for retryable codes', () => {
      expect(isRetryableError(-1001)).toBe(true);
      expect(isRetryableError(-1003)).toBe(true);
      expect(isRetryableError(-1006)).toBe(true);
      expect(isRetryableError(-1007)).toBe(true);
      expect(isRetryableError(-1010)).toBe(true);
      expect(isRetryableError(-1016)).toBe(true);
    });

    test('isRetryableError returns false for non-retryable codes', () => {
      expect(isRetryableError(-1022)).toBe(false);
      expect(isRetryableError(-2010)).toBe(false);
      expect(isRetryableError(-2013)).toBe(false);
    });
  });

  // =========================================================================
  // Utility functions
  // =========================================================================

  describe('utils', () => {
    test('toAsterSymbol converts unified to exchange format', () => {
      expect(toAsterSymbol('BTC/USDT:USDT')).toBe('BTCUSDT');
      expect(toAsterSymbol('ETH/USDT:USDT')).toBe('ETHUSDT');
    });

    test('toUnifiedSymbol converts exchange to unified format', () => {
      expect(toUnifiedSymbol('BTCUSDT', 'BTC', 'USDT')).toBe('BTC/USDT:USDT');
    });

    test('toAsterOrderSide maps sides', () => {
      expect(toAsterOrderSide('buy')).toBe('BUY');
      expect(toAsterOrderSide('sell')).toBe('SELL');
      expect(toAsterOrderSide('UNKNOWN')).toBe('UNKNOWN');
    });

    test('toAsterOrderType maps types', () => {
      expect(toAsterOrderType('market')).toBe('MARKET');
      expect(toAsterOrderType('limit')).toBe('LIMIT');
      expect(toAsterOrderType('stopMarket')).toBe('STOP_MARKET');
      expect(toAsterOrderType('stopLimit')).toBe('STOP');
      expect(toAsterOrderType('takeProfit')).toBe('TAKE_PROFIT_MARKET');
      expect(toAsterOrderType('UNKNOWN')).toBe('UNKNOWN');
    });

    test('toAsterTimeInForce maps time in force', () => {
      expect(toAsterTimeInForce('GTC')).toBe('GTC');
      expect(toAsterTimeInForce('IOC')).toBe('IOC');
      expect(toAsterTimeInForce('FOK')).toBe('FOK');
      expect(toAsterTimeInForce('PO')).toBe('GTX');
      expect(toAsterTimeInForce(undefined, true)).toBe('GTX');
      expect(toAsterTimeInForce()).toBe('GTC');
    });

    test('buildOrderParams creates correct params for limit order', () => {
      const params = buildOrderParams(
        {
          symbol: 'BTC/USDT:USDT',
          type: 'limit',
          side: 'buy',
          amount: 0.1,
          price: 40000,
          timeInForce: 'GTC',
        },
        'BTCUSDT'
      );

      expect(params.symbol).toBe('BTCUSDT');
      expect(params.side).toBe('BUY');
      expect(params.type).toBe('LIMIT');
      expect(params.quantity).toBe(0.1);
      expect(params.price).toBe(40000);
      expect(params.timeInForce).toBe('GTC');
    });

    test('buildOrderParams includes referral code', () => {
      const params = buildOrderParams(
        {
          symbol: 'BTC/USDT:USDT',
          type: 'market',
          side: 'buy',
          amount: 0.1,
        },
        'BTCUSDT',
        'REF123'
      );

      expect(params.referralCode).toBe('REF123');
    });

    test('buildOrderParams prefers order builderCode over adapter referral', () => {
      const params = buildOrderParams(
        {
          symbol: 'BTC/USDT:USDT',
          type: 'market',
          side: 'buy',
          amount: 0.1,
          builderCode: 'ORDER_REF',
        },
        'BTCUSDT',
        'ADAPTER_REF'
      );

      expect(params.referralCode).toBe('ORDER_REF');
    });

    test('buildOrderParams includes reduceOnly', () => {
      const params = buildOrderParams(
        {
          symbol: 'BTC/USDT:USDT',
          type: 'market',
          side: 'sell',
          amount: 0.1,
          reduceOnly: true,
        },
        'BTCUSDT'
      );

      expect(params.reduceOnly).toBe('true');
    });

    test('buildOrderParams includes clientOrderId', () => {
      const params = buildOrderParams(
        {
          symbol: 'BTC/USDT:USDT',
          type: 'limit',
          side: 'buy',
          amount: 0.1,
          price: 40000,
          clientOrderId: 'my-id-123',
        },
        'BTCUSDT'
      );

      expect(params.newClientOrderId).toBe('my-id-123');
    });

    test('parsePrecision extracts decimal precision', () => {
      expect(parsePrecision('0.01')).toBe(2);
      expect(parsePrecision('0.001')).toBe(3);
      expect(parsePrecision('0.10')).toBe(1);
      expect(parsePrecision('1')).toBe(0);
      expect(parsePrecision('0')).toBe(0);
      expect(parsePrecision('')).toBe(0);
    });
  });

  // =========================================================================
  // Normalizer
  // =========================================================================

  describe('AsterNormalizer', () => {
    const normalizer = new AsterNormalizer();

    test('normalizeOrder handles FILLED status', () => {
      const raw = {
        orderId: 1,
        symbol: 'BTCUSDT',
        status: 'FILLED',
        clientOrderId: 'test',
        price: '40000',
        avgPrice: '40050',
        origQty: '0.1',
        executedQty: '0.1',
        cumQuote: '4005',
        timeInForce: 'GTC',
        type: 'LIMIT',
        reduceOnly: false,
        closePosition: false,
        side: 'SELL',
        positionSide: 'BOTH',
        stopPrice: '0',
        workingType: 'CONTRACT_PRICE',
        origType: 'LIMIT',
        updateTime: 1700000000000,
      };

      const order = normalizer.normalizeOrder(raw, 'BTC/USDT:USDT');

      expect(order.status).toBe('filled');
      expect(order.side).toBe('sell');
      expect(order.filled).toBe(0.1);
      expect(order.remaining).toBe(0);
      expect(order.averagePrice).toBe(40050);
    });

    test('normalizePosition for short position', () => {
      const raw = {
        symbol: 'ETHUSDT',
        positionAmt: '-5.0',
        entryPrice: '2200',
        markPrice: '2150',
        unRealizedProfit: '250',
        liquidationPrice: '2500',
        leverage: '5',
        maxNotionalValue: '500000',
        marginType: 'isolated',
        isolatedMargin: '2200',
        isAutoAddMargin: 'false',
        positionSide: 'SHORT',
        notional: '-10750',
        isolatedWallet: '2200',
        updateTime: 1700000000000,
      };

      const position = normalizer.normalizePosition(raw);

      expect(position.side).toBe('short');
      expect(position.size).toBe(5);
      expect(position.marginMode).toBe('isolated');
    });
  });

  // =========================================================================
  // Constants
  // =========================================================================

  describe('constants', () => {
    test('ASTER_API_URLS has mainnet and testnet', () => {
      expect(ASTER_API_URLS.mainnet.rest).toBe('https://fapi.asterdex.com');
      expect(ASTER_API_URLS.testnet.rest).toBe('https://testnet-fapi.asterdex.com');
    });

    test('ASTER_ORDER_STATUS maps correctly', () => {
      expect(ASTER_ORDER_STATUS['NEW']).toBe('open');
      expect(ASTER_ORDER_STATUS['FILLED']).toBe('filled');
      expect(ASTER_ORDER_STATUS['CANCELED']).toBe('canceled');
      expect(ASTER_ORDER_STATUS['PARTIALLY_FILLED']).toBe('partiallyFilled');
    });

    test('ASTER_ERROR_CODES has expected entries', () => {
      expect(ASTER_ERROR_CODES[-1003]).toBe('TOO_MANY_REQUESTS');
      expect(ASTER_ERROR_CODES[-1022]).toBe('INVALID_SIGNATURE');
      expect(ASTER_ERROR_CODES[-2013]).toBe('NO_SUCH_ORDER');
    });
  });
});

/**
 * PacificaAdapter Tests
 *
 * Comprehensive tests for Pacifica Exchange adapter
 * Updated to match real API at https://api.pacifica.fi/api/v1
 */

import { PacificaAdapter } from '../../src/adapters/pacifica/PacificaAdapter.js';
import { PacificaNormalizer } from '../../src/adapters/pacifica/PacificaNormalizer.js';
import { PacificaAuth } from '../../src/adapters/pacifica/PacificaAuth.js';
import { mapPacificaError, isRetryableError, PACIFICA_ERROR_CODES } from '../../src/adapters/pacifica/error-codes.js';
import { toPacificaSymbol, toUnifiedSymbol, buildOrderBody } from '../../src/adapters/pacifica/utils.js';
import { PACIFICA_API_URLS, PACIFICA_RATE_LIMITS } from '../../src/adapters/pacifica/constants.js';
import {
  PerpDEXError,
  RateLimitError,
  InvalidSignatureError,
  OrderNotFoundError,
  InsufficientMarginError,
  InvalidOrderError,
  ExchangeUnavailableError,
} from '../../src/types/errors.js';
import type {
  PacificaMarket,
  PacificaTicker,
  PacificaOrderBook,
  PacificaTradeResponse,
  PacificaFundingHistory,
  PacificaOrderResponse,
  PacificaPosition,
  PacificaAccountInfo,
} from '../../src/adapters/pacifica/types.js';

// Mock HTTPClient
jest.mock('../../src/core/http/HTTPClient.js', () => ({
  HTTPClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock WebSocketManager
jest.mock('../../src/websocket/WebSocketManager.js', () => ({
  WebSocketManager: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(),
  })),
}));

// ============================================================================
// Test Data Fixtures — matches real Pacifica API responses
// ============================================================================

const mockMarket: PacificaMarket = {
  symbol: 'BTC',
  tick_size: '1',
  lot_size: '0.00001',
  min_tick: '0',
  max_tick: '1000000',
  max_leverage: 50,
  isolated_only: false,
  min_order_size: '10',
  max_order_size: '5000000',
  funding_rate: '0.00000772',
  next_funding_rate: '0.00001221',
  created_at: 1748881333944,
};

const mockTicker: PacificaTicker = {
  symbol: 'BTC',
  mark: '69449',
  mid: '69448.5',
  oracle: '69450',
  funding: '0.00000772',
  next_funding: '0.00001221',
  open_interest: '123.45',
  volume_24h: '50000000',
  yesterday_price: '69000',
  timestamp: 1699999000000,
};

const mockAllTickers: PacificaTicker[] = [
  mockTicker,
  {
    symbol: 'ETH',
    mark: '3500',
    mid: '3499.5',
    oracle: '3501',
    funding: '0.0001',
    next_funding: '0.00005',
    open_interest: '5000',
    volume_24h: '10000000',
    yesterday_price: '3400',
    timestamp: 1699999000000,
  },
];

const mockOrderBook: PacificaOrderBook = {
  s: 'BTC',
  l: [
    [
      { p: '50000.0', a: '1.5', n: 1 },
      { p: '49999.0', a: '2.0', n: 2 },
    ],
    [
      { p: '50001.0', a: '1.0', n: 1 },
      { p: '50002.0', a: '3.0', n: 3 },
    ],
  ],
  t: 1699999000000,
};

const mockTrade: PacificaTradeResponse = {
  event_type: 'fulfill_taker',
  price: '50000.5',
  amount: '0.1',
  side: 'open_long',
  cause: 'normal',
  created_at: 1699999000000,
};

const mockFundingHistory: PacificaFundingHistory = {
  oracle_price: '69605.794',
  bid_impact_price: '69576.137741',
  ask_impact_price: '69585',
  funding_rate: '0.00000962',
  next_funding_rate: '0.00000772',
  created_at: 1773226800077,
};

const mockOrderResponse: PacificaOrderResponse = {
  order_id: 'order-001',
  client_order_id: 'my-order-1',
  symbol: 'BTC',
  side: 'buy',
  type: 'limit',
  price: '50000.0',
  size: '0.1',
  filled_size: '0.0',
  status: 'open',
  reduce_only: false,
  post_only: false,
  created_at: 1699999000000,
  updated_at: 1699999000000,
};

const mockFilledOrder: PacificaOrderResponse = {
  ...mockOrderResponse,
  order_id: 'order-002',
  type: 'market',
  filled_size: '0.1',
  avg_fill_price: '50000.5',
  status: 'filled',
};

const mockPosition: PacificaPosition = {
  symbol: 'BTC',
  side: 'long',
  size: '0.5',
  entry_price: '49000.0',
  mark_price: '50000.0',
  liquidation_price: '45000.0',
  unrealized_pnl: '500.0',
  realized_pnl: '100.0',
  leverage: 10,
  margin_mode: 'cross',
  margin: '2450.0',
  maintenance_margin: '245.0',
  timestamp: 1699999000000,
};

const mockZeroPosition: PacificaPosition = {
  ...mockPosition,
  size: '0',
  unrealized_pnl: '0',
};

const mockAccountInfo: PacificaAccountInfo = {
  total_equity: '10000.0',
  available_balance: '7500.0',
  used_margin: '2500.0',
  unrealized_pnl: '500.0',
  currency: 'USDC',
};

// ============================================================================
// Tests
// ============================================================================

describe('PacificaAdapter', () => {
  let adapter: PacificaAdapter;
  let mockHttpClient: {
    get: jest.Mock;
    post: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new PacificaAdapter();
    mockHttpClient = (adapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
  });

  // --------------------------------------------------------------------------
  // Constructor
  // --------------------------------------------------------------------------

  describe('constructor', () => {
    test('creates adapter with default config', () => {
      const a = new PacificaAdapter();
      expect(a.id).toBe('pacifica');
      expect(a.name).toBe('Pacifica');
    });

    test('creates adapter with API credentials', () => {
      const a = new PacificaAdapter({
        apiKey: 'test-key',
        apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      });
      expect(a).toBeInstanceOf(PacificaAdapter);
    });

    test('creates adapter for testnet', () => {
      const a = new PacificaAdapter({ testnet: true });
      expect(a).toBeInstanceOf(PacificaAdapter);
    });

    test('creates adapter with custom timeout', () => {
      const a = new PacificaAdapter({ timeout: 60000 });
      expect(a).toBeInstanceOf(PacificaAdapter);
    });

    test('creates adapter with builder code config', () => {
      const a = new PacificaAdapter({
        builderCode: 'my-builder',
        maxBuilderFeeRate: 200,
      });
      expect(a).toBeInstanceOf(PacificaAdapter);
    });

    test('has expected features', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.cancelAllOrders).toBe(false);
      expect(adapter.has.fetchFundingRateHistory).toBe(true);
      expect(adapter.has.fetchOrderHistory).toBe(false);
      expect(adapter.has.fetchMyTrades).toBe(false);
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.setLeverage).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Initialize
  // --------------------------------------------------------------------------

  describe('initialize', () => {
    test('initializes adapter without builder code', async () => {
      await adapter.initialize();
      expect(adapter.isReady).toBe(true);
    });

    test('registers builder code on init when configured', async () => {
      const a = new PacificaAdapter({
        apiKey: 'test-key',
        apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        builderCode: 'my-builder',
        maxBuilderFeeRate: 300,
      });
      const http = (a as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
      http.post.mockResolvedValue({ success: true });

      await a.initialize();

      expect(a.isReady).toBe(true);
      expect(http.post).toHaveBeenCalledWith(
        '/account/builder_codes/approve',
        expect.objectContaining({
          body: {
            type: 'approve_builder_code',
            builder_code: 'my-builder',
            max_fee_rate: 300,
          },
        })
      );
    });

    test('skips builder code registration without credentials', async () => {
      const a = new PacificaAdapter({ builderCode: 'my-builder' });
      const http = (a as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;

      await a.initialize();

      expect(a.isReady).toBe(true);
      expect(http.post).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // fetchMarkets — GET /info
  // --------------------------------------------------------------------------

  describe('fetchMarkets', () => {
    test('fetches and normalizes markets from /info', async () => {
      mockHttpClient.get.mockResolvedValue([mockMarket]);

      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(1);
      expect(markets[0].symbol).toBe('BTC/USDC:USDC');
      expect(markets[0].base).toBe('BTC');
      expect(markets[0].quote).toBe('USDC');
      expect(markets[0].active).toBe(true);
      expect(markets[0].maxLeverage).toBe(50);
      expect(markets[0].priceTickSize).toBe(1);
      expect(markets[0].amountStepSize).toBe(0.00001);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/info');
    });

    test('unwraps { success, data } envelope', async () => {
      mockHttpClient.get.mockResolvedValue({ success: true, data: [mockMarket] });

      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(1);
      expect(markets[0].symbol).toBe('BTC/USDC:USDC');
    });

    test('throws on invalid response', async () => {
      mockHttpClient.get.mockResolvedValue({ not: 'an array' });

      await expect(adapter.fetchMarkets()).rejects.toThrow(PerpDEXError);
    });
  });

  // --------------------------------------------------------------------------
  // fetchTicker — GET /info/prices
  // --------------------------------------------------------------------------

  describe('fetchTicker', () => {
    test('fetches ticker from /info/prices and finds matching symbol', async () => {
      mockHttpClient.get.mockResolvedValue(mockAllTickers);

      const ticker = await adapter.fetchTicker('BTC/USDC:USDC');

      expect(ticker.symbol).toBe('BTC/USDC:USDC');
      expect(ticker.last).toBe(69448.5);
      expect(ticker.quoteVolume).toBe(50000000);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/info/prices');
    });

    test('unwraps { success, data } envelope for prices', async () => {
      mockHttpClient.get.mockResolvedValue({ success: true, data: mockAllTickers });

      const ticker = await adapter.fetchTicker('BTC/USDC:USDC');

      expect(ticker.symbol).toBe('BTC/USDC:USDC');
    });

    test('throws when symbol not found in prices', async () => {
      mockHttpClient.get.mockResolvedValue([
        { ...mockTicker, symbol: 'ETH' },
      ]);

      await expect(adapter.fetchTicker('BTC/USDC:USDC')).rejects.toThrow('Ticker not found');
    });
  });

  // --------------------------------------------------------------------------
  // fetchOrderBook
  // --------------------------------------------------------------------------

  describe('fetchOrderBook', () => {
    test('fetches and normalizes order book', async () => {
      mockHttpClient.get.mockResolvedValue(mockOrderBook);

      const book = await adapter.fetchOrderBook('BTC/USDC:USDC');

      expect(book.symbol).toBe('BTC/USDC:USDC');
      expect(book.bids).toHaveLength(2);
      expect(book.asks).toHaveLength(2);
      expect(book.bids[0]).toEqual([50000.0, 1.5]);
      expect(book.asks[0]).toEqual([50001.0, 1.0]);
      expect(book.exchange).toBe('pacifica');
    });

    test('passes limit parameter', async () => {
      mockHttpClient.get.mockResolvedValue(mockOrderBook);

      await adapter.fetchOrderBook('BTC/USDC:USDC', { limit: 50 });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/book?symbol=BTC&limit=50');
    });

    test('uses default limit of 20', async () => {
      mockHttpClient.get.mockResolvedValue(mockOrderBook);

      await adapter.fetchOrderBook('BTC/USDC:USDC');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/book?symbol=BTC&limit=20');
    });
  });

  // --------------------------------------------------------------------------
  // fetchTrades — GET /trades?symbol=X
  // --------------------------------------------------------------------------

  describe('fetchTrades', () => {
    test('fetches and normalizes trades', async () => {
      mockHttpClient.get.mockResolvedValue([mockTrade]);

      const trades = await adapter.fetchTrades('BTC/USDC:USDC');

      expect(trades).toHaveLength(1);
      expect(trades[0].symbol).toBe('BTC/USDC:USDC');
      expect(trades[0].side).toBe('buy');
      expect(trades[0].price).toBe(50000.5);
      expect(trades[0].amount).toBe(0.1);
      expect(trades[0].cost).toBe(5000.05);
      expect(trades[0].id).toBe('1699999000000-0');
    });

    test('unwraps { success, data } envelope for trades', async () => {
      mockHttpClient.get.mockResolvedValue({ success: true, data: [mockTrade] });

      const trades = await adapter.fetchTrades('BTC/USDC:USDC');
      expect(trades).toHaveLength(1);
    });

    test('throws on invalid response', async () => {
      mockHttpClient.get.mockResolvedValue({ not: 'an array' });

      await expect(adapter.fetchTrades('BTC/USDC:USDC')).rejects.toThrow(PerpDEXError);
    });

    test('passes limit parameter', async () => {
      mockHttpClient.get.mockResolvedValue([mockTrade]);

      await adapter.fetchTrades('BTC/USDC:USDC', { limit: 50 });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/trades?symbol=BTC&limit=50');
    });
  });

  // --------------------------------------------------------------------------
  // fetchFundingRate — GET /funding_rate/history?symbol=X&limit=1
  // --------------------------------------------------------------------------

  describe('fetchFundingRate', () => {
    test('fetches and normalizes funding rate', async () => {
      mockHttpClient.get.mockResolvedValue([mockFundingHistory]);

      const rate = await adapter.fetchFundingRate('BTC/USDC:USDC');

      expect(rate.symbol).toBe('BTC/USDC:USDC');
      expect(rate.fundingRate).toBe(0.00000962);
      expect(rate.markPrice).toBe(69605.794);
      expect(rate.indexPrice).toBe(69605.794);
      expect(rate.fundingIntervalHours).toBe(1);
    });

    test('unwraps { success, data } envelope for funding', async () => {
      mockHttpClient.get.mockResolvedValue({ success: true, data: [mockFundingHistory] });

      const rate = await adapter.fetchFundingRate('BTC/USDC:USDC');
      expect(rate.fundingRate).toBe(0.00000962);
    });

    test('throws on empty response', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      await expect(adapter.fetchFundingRate('BTC/USDC:USDC')).rejects.toThrow('No funding rate data');
    });

    test('throws on non-array response', async () => {
      mockHttpClient.get.mockResolvedValue({ not: 'an array' });

      await expect(adapter.fetchFundingRate('BTC/USDC:USDC')).rejects.toThrow('No funding rate data');
    });
  });

  // --------------------------------------------------------------------------
  // fetchFundingRateHistory — GET /funding_rate/history?symbol=X
  // --------------------------------------------------------------------------

  describe('fetchFundingRateHistory', () => {
    test('fetches funding rate history', async () => {
      mockHttpClient.get.mockResolvedValue([mockFundingHistory, mockFundingHistory]);

      const rates = await adapter.fetchFundingRateHistory('BTC/USDC:USDC');

      expect(rates).toHaveLength(2);
      expect(rates[0].fundingRate).toBe(0.00000962);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/funding_rate/history?symbol=BTC&limit=100');
    });

    test('returns empty array on non-array response', async () => {
      mockHttpClient.get.mockResolvedValue({ not: 'an array' });

      const rates = await adapter.fetchFundingRateHistory('BTC/USDC:USDC');
      expect(rates).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // createOrder
  // --------------------------------------------------------------------------

  describe('createOrder', () => {
    let authAdapter: PacificaAdapter;
    let authHttpClient: typeof mockHttpClient;

    beforeEach(() => {
      authAdapter = new PacificaAdapter({
        apiKey: 'test-key',
        apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      });
      authHttpClient = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    });

    test('creates a limit order', async () => {
      authHttpClient.post.mockResolvedValue(mockOrderResponse);

      const order = await authAdapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
      });

      expect(order.id).toBe('order-001');
      expect(order.symbol).toBe('BTC/USDC:USDC');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.amount).toBe(0.1);
      expect(order.status).toBe('open');
      expect(authHttpClient.post).toHaveBeenCalledWith(
        '/orders/create',
        expect.objectContaining({
          body: expect.objectContaining({
            symbol: 'BTC',
            side: 'buy',
            type: 'limit',
            size: '0.1',
            price: '50000',
          }),
        })
      );
    });

    test('creates a market order', async () => {
      authHttpClient.post.mockResolvedValue(mockFilledOrder);

      const order = await authAdapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        type: 'market',
        side: 'buy',
        amount: 0.1,
      });

      expect(order.id).toBe('order-002');
      expect(order.status).toBe('filled');
      expect(order.filled).toBe(0.1);
      expect(order.averagePrice).toBe(50000.5);
    });

    test('includes adapter-level builder code', async () => {
      const builderAdapter = new PacificaAdapter({
        apiKey: 'test-key',
        apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        builderCode: 'adapter-builder',
      });
      const builderHttp = (builderAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
      builderHttp.post.mockResolvedValue(mockOrderResponse);

      await builderAdapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
      });

      expect(builderHttp.post).toHaveBeenCalledWith(
        '/orders/create',
        expect.objectContaining({
          body: expect.objectContaining({
            builder_code: 'adapter-builder',
          }),
        })
      );
    });

    test('per-order builder code overrides adapter-level', async () => {
      const builderAdapter = new PacificaAdapter({
        apiKey: 'test-key',
        apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        builderCode: 'adapter-builder',
      });
      const builderHttp = (builderAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
      builderHttp.post.mockResolvedValue(mockOrderResponse);

      await builderAdapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
        builderCode: 'order-builder',
      });

      expect(builderHttp.post).toHaveBeenCalledWith(
        '/orders/create',
        expect.objectContaining({
          body: expect.objectContaining({
            builder_code: 'order-builder',
          }),
        })
      );
    });

    test('includes reduce_only and post_only flags', async () => {
      authHttpClient.post.mockResolvedValue(mockOrderResponse);

      await authAdapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        type: 'limit',
        side: 'sell',
        amount: 0.1,
        price: 51000,
        reduceOnly: true,
        postOnly: true,
      });

      expect(authHttpClient.post).toHaveBeenCalledWith(
        '/orders/create',
        expect.objectContaining({
          body: expect.objectContaining({
            reduce_only: true,
            post_only: true,
          }),
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // cancelOrder
  // --------------------------------------------------------------------------

  describe('cancelOrder', () => {
    let authAdapter: PacificaAdapter;
    let authHttpClient: typeof mockHttpClient;

    beforeEach(() => {
      authAdapter = new PacificaAdapter({
        apiKey: 'test-key',
        apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      });
      authHttpClient = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    });

    test('cancels an order', async () => {
      const cancelledOrder: PacificaOrderResponse = {
        ...mockOrderResponse,
        status: 'cancelled',
      };
      authHttpClient.post.mockResolvedValue(cancelledOrder);

      const order = await authAdapter.cancelOrder('order-001');

      expect(order.id).toBe('order-001');
      expect(order.status).toBe('canceled');
      expect(authHttpClient.post).toHaveBeenCalledWith(
        '/orders/cancel',
        expect.objectContaining({
          body: { order_id: 'order-001' },
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // registerBuilderCode
  // --------------------------------------------------------------------------

  describe('registerBuilderCode', () => {
    test('sends correct builder code approval body', async () => {
      const authAdapter = new PacificaAdapter({
        apiKey: 'test-key',
        apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      });
      const authHttp = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
      authHttp.post.mockResolvedValue({ success: true });

      await authAdapter.registerBuilderCode('test-code', 500);

      expect(authHttp.post).toHaveBeenCalledWith(
        '/account/builder_codes/approve',
        expect.objectContaining({
          body: {
            type: 'approve_builder_code',
            builder_code: 'test-code',
            max_fee_rate: 500,
          },
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // fetchPositions
  // --------------------------------------------------------------------------

  describe('fetchPositions', () => {
    let authAdapter: PacificaAdapter;
    let authHttpClient: typeof mockHttpClient;

    beforeEach(() => {
      authAdapter = new PacificaAdapter({
        apiKey: 'test-key',
        apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      });
      authHttpClient = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    });

    test('fetches and normalizes positions', async () => {
      authHttpClient.get.mockResolvedValue([mockPosition]);

      const positions = await authAdapter.fetchPositions();

      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe('BTC/USDC:USDC');
      expect(positions[0].side).toBe('long');
      expect(positions[0].size).toBe(0.5);
      expect(positions[0].entryPrice).toBe(49000.0);
      expect(positions[0].markPrice).toBe(50000.0);
      expect(positions[0].leverage).toBe(10);
      expect(positions[0].marginMode).toBe('cross');
    });

    test('filters zero-size positions', async () => {
      authHttpClient.get.mockResolvedValue([mockPosition, mockZeroPosition]);

      const positions = await authAdapter.fetchPositions();

      expect(positions).toHaveLength(1);
    });

    test('throws on invalid response', async () => {
      authHttpClient.get.mockResolvedValue({ not: 'an array' });

      await expect(authAdapter.fetchPositions()).rejects.toThrow('Invalid positions response');
    });
  });

  // --------------------------------------------------------------------------
  // fetchBalance
  // --------------------------------------------------------------------------

  describe('fetchBalance', () => {
    test('fetches and normalizes balance', async () => {
      const authAdapter = new PacificaAdapter({
        apiKey: 'test-key',
        apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      });
      const authHttp = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
      authHttp.get.mockResolvedValue(mockAccountInfo);

      const balances = await authAdapter.fetchBalance();

      expect(balances).toHaveLength(1);
      expect(balances[0].currency).toBe('USDC');
      expect(balances[0].total).toBe(10000.0);
      expect(balances[0].free).toBe(7500.0);
      expect(balances[0].used).toBe(2500.0);
    });
  });

  // --------------------------------------------------------------------------
  // setLeverage
  // --------------------------------------------------------------------------

  describe('setLeverage', () => {
    test('sets leverage for symbol', async () => {
      const authAdapter = new PacificaAdapter({
        apiKey: 'test-key',
        apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      });
      const authHttp = (authAdapter as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
      authHttp.post.mockResolvedValue({ success: true });

      await authAdapter.setLeverage('BTC/USDC:USDC', 20);

      expect(authHttp.post).toHaveBeenCalledWith(
        '/account/leverage',
        expect.objectContaining({
          body: { symbol: 'BTC', leverage: 20 },
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // requireAuth
  // --------------------------------------------------------------------------

  describe('requireAuth', () => {
    test('throws when no credentials for createOrder', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'BTC/USDC:USDC',
          type: 'limit',
          side: 'buy',
          amount: 0.1,
          price: 50000,
        })
      ).rejects.toThrow('API key and secret required');
    });

    test('throws when no credentials for cancelOrder', async () => {
      await expect(adapter.cancelOrder('order-001')).rejects.toThrow(
        'API key and secret required'
      );
    });

    test('throws when no credentials for fetchPositions', async () => {
      await expect(adapter.fetchPositions()).rejects.toThrow('API key and secret required');
    });

    test('throws when no credentials for fetchBalance', async () => {
      await expect(adapter.fetchBalance()).rejects.toThrow('API key and secret required');
    });

    test('throws when no credentials for setLeverage', async () => {
      await expect(adapter.setLeverage('BTC/USDC:USDC', 10)).rejects.toThrow(
        'API key and secret required'
      );
    });
  });

  // --------------------------------------------------------------------------
  // disconnect
  // --------------------------------------------------------------------------

  describe('disconnect', () => {
    test('disconnects cleanly', async () => {
      await adapter.initialize();
      await expect(adapter.disconnect()).resolves.not.toThrow();
    });
  });
});

// ============================================================================
// Error Mapping Tests
// ============================================================================

describe('Pacifica Error Mapping', () => {
  test('maps RATE_LIMIT_EXCEEDED to RateLimitError', () => {
    const error = mapPacificaError('RATE_LIMIT_EXCEEDED', 'Too many requests');
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.exchange).toBe('pacifica');
  });

  test('maps INVALID_SIGNATURE to InvalidSignatureError', () => {
    const error = mapPacificaError('INVALID_SIGNATURE', 'Bad sig');
    expect(error).toBeInstanceOf(InvalidSignatureError);
  });

  test('maps EXPIRED_TIMESTAMP to InvalidSignatureError', () => {
    const error = mapPacificaError('EXPIRED_TIMESTAMP', 'Expired');
    expect(error).toBeInstanceOf(InvalidSignatureError);
  });

  test('maps INVALID_API_KEY to InvalidSignatureError', () => {
    const error = mapPacificaError('INVALID_API_KEY', 'Bad key');
    expect(error).toBeInstanceOf(InvalidSignatureError);
  });

  test('maps ORDER_NOT_FOUND to OrderNotFoundError', () => {
    const error = mapPacificaError('ORDER_NOT_FOUND', 'Not found');
    expect(error).toBeInstanceOf(OrderNotFoundError);
  });

  test('maps INSUFFICIENT_MARGIN to InsufficientMarginError', () => {
    const error = mapPacificaError('INSUFFICIENT_MARGIN', 'No margin');
    expect(error).toBeInstanceOf(InsufficientMarginError);
  });

  test('maps INSUFFICIENT_BALANCE to InsufficientMarginError', () => {
    const error = mapPacificaError('INSUFFICIENT_BALANCE', 'No balance');
    expect(error).toBeInstanceOf(InsufficientMarginError);
  });

  test('maps INVALID_ORDER to InvalidOrderError', () => {
    const error = mapPacificaError('INVALID_ORDER', 'Bad order');
    expect(error).toBeInstanceOf(InvalidOrderError);
  });

  test('maps INVALID_PRICE to InvalidOrderError', () => {
    const error = mapPacificaError('INVALID_PRICE', 'Bad price');
    expect(error).toBeInstanceOf(InvalidOrderError);
  });

  test('maps INVALID_SIZE to InvalidOrderError', () => {
    const error = mapPacificaError('INVALID_SIZE', 'Bad size');
    expect(error).toBeInstanceOf(InvalidOrderError);
  });

  test('maps REDUCE_ONLY_REJECTED to InvalidOrderError', () => {
    const error = mapPacificaError('REDUCE_ONLY_REJECTED', 'Rejected');
    expect(error).toBeInstanceOf(InvalidOrderError);
  });

  test('maps POST_ONLY_REJECTED to InvalidOrderError', () => {
    const error = mapPacificaError('POST_ONLY_REJECTED', 'Rejected');
    expect(error).toBeInstanceOf(InvalidOrderError);
  });

  test('maps MAX_LEVERAGE_EXCEEDED to InvalidOrderError', () => {
    const error = mapPacificaError('MAX_LEVERAGE_EXCEEDED', 'Too high');
    expect(error).toBeInstanceOf(InvalidOrderError);
  });

  test('maps BUILDER_CODE_INVALID to InvalidOrderError', () => {
    const error = mapPacificaError('BUILDER_CODE_INVALID', 'Bad code');
    expect(error).toBeInstanceOf(InvalidOrderError);
  });

  test('maps SERVICE_UNAVAILABLE to ExchangeUnavailableError', () => {
    const error = mapPacificaError('SERVICE_UNAVAILABLE', 'Down');
    expect(error).toBeInstanceOf(ExchangeUnavailableError);
  });

  test('maps INTERNAL_ERROR to ExchangeUnavailableError', () => {
    const error = mapPacificaError('INTERNAL_ERROR', 'Server error');
    expect(error).toBeInstanceOf(ExchangeUnavailableError);
  });

  test('maps unknown code to PerpDEXError', () => {
    const error = mapPacificaError('UNKNOWN_CODE', 'Unknown');
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.code).toBe('UNKNOWN_CODE');
  });

  test('isRetryableError returns true for retryable codes', () => {
    expect(isRetryableError('RATE_LIMIT_EXCEEDED')).toBe(true);
    expect(isRetryableError('SERVICE_UNAVAILABLE')).toBe(true);
    expect(isRetryableError('INTERNAL_ERROR')).toBe(true);
  });

  test('isRetryableError returns false for non-retryable codes', () => {
    expect(isRetryableError('INVALID_SIGNATURE')).toBe(false);
    expect(isRetryableError('ORDER_NOT_FOUND')).toBe(false);
    expect(isRetryableError('INSUFFICIENT_MARGIN')).toBe(false);
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('Pacifica Utils', () => {
  test('toPacificaSymbol converts unified to plain symbol', () => {
    expect(toPacificaSymbol('BTC/USDC:USDC')).toBe('BTC');
    expect(toPacificaSymbol('ETH/USDC:USDC')).toBe('ETH');
    expect(toPacificaSymbol('SOL/USDC:USDC')).toBe('SOL');
  });

  test('toUnifiedSymbol converts plain symbol to unified format', () => {
    expect(toUnifiedSymbol('BTC')).toBe('BTC/USDC:USDC');
    expect(toUnifiedSymbol('ETH')).toBe('ETH/USDC:USDC');
    expect(toUnifiedSymbol('SOL')).toBe('SOL/USDC:USDC');
  });

  describe('buildOrderBody', () => {
    test('builds basic order body', () => {
      const body = buildOrderBody(
        { symbol: 'BTC/USDC:USDC', type: 'market', side: 'buy', amount: 0.1 },
        'BTC'
      );
      expect(body).toEqual({
        symbol: 'BTC',
        side: 'buy',
        type: 'market',
        size: '0.1',
      });
    });

    test('includes price for limit orders', () => {
      const body = buildOrderBody(
        { symbol: 'BTC/USDC:USDC', type: 'limit', side: 'buy', amount: 0.1, price: 50000 },
        'BTC'
      );
      expect(body.price).toBe('50000');
    });

    test('includes builder code from parameter', () => {
      const body = buildOrderBody(
        { symbol: 'BTC/USDC:USDC', type: 'market', side: 'buy', amount: 0.1 },
        'BTC',
        'my-builder'
      );
      expect(body.builder_code).toBe('my-builder');
    });

    test('per-order builder code overrides adapter builder code', () => {
      const body = buildOrderBody(
        { symbol: 'BTC/USDC:USDC', type: 'market', side: 'buy', amount: 0.1, builderCode: 'order-code' },
        'BTC',
        'adapter-code'
      );
      expect(body.builder_code).toBe('order-code');
    });

    test('includes optional flags', () => {
      const body = buildOrderBody(
        {
          symbol: 'BTC/USDC:USDC',
          type: 'limit',
          side: 'sell',
          amount: 0.1,
          price: 51000,
          reduceOnly: true,
          postOnly: true,
          clientOrderId: 'my-id',
          timeInForce: 'GTC',
        },
        'BTC'
      );
      expect(body.reduce_only).toBe(true);
      expect(body.post_only).toBe(true);
      expect(body.client_order_id).toBe('my-id');
      expect(body.time_in_force).toBe('GTC');
    });
  });
});

// ============================================================================
// Constants Tests
// ============================================================================

describe('Pacifica Constants', () => {
  test('mainnet API URLs are correct', () => {
    expect(PACIFICA_API_URLS.mainnet.rest).toBe('https://api.pacifica.fi/api/v1');
    expect(PACIFICA_API_URLS.mainnet.websocket).toBe('wss://ws.pacifica.fi/ws');
  });

  test('testnet API URLs are correct', () => {
    expect(PACIFICA_API_URLS.testnet.rest).toBe('https://test-api.pacifica.fi/api/v1');
    expect(PACIFICA_API_URLS.testnet.websocket).toBe('wss://test-ws.pacifica.fi/ws');
  });

  test('rate limits are defined', () => {
    expect(PACIFICA_RATE_LIMITS.rest.maxRequests).toBe(600);
    expect(PACIFICA_RATE_LIMITS.rest.windowMs).toBe(60000);
  });

  test('error codes are all defined', () => {
    expect(PACIFICA_ERROR_CODES.INVALID_SIGNATURE).toBe('INVALID_SIGNATURE');
    expect(PACIFICA_ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    expect(PACIFICA_ERROR_CODES.BUILDER_CODE_INVALID).toBe('BUILDER_CODE_INVALID');
  });
});

// ============================================================================
// Normalizer Tests
// ============================================================================

describe('PacificaNormalizer', () => {
  const normalizer = new PacificaNormalizer();

  test('normalizeMarket computes precision correctly', () => {
    const market = normalizer.normalizeMarket(mockMarket);
    expect(market.pricePrecision).toBe(0);
    expect(market.amountPrecision).toBe(5);
    expect(market.priceTickSize).toBe(1);
    expect(market.amountStepSize).toBe(0.00001);
    expect(market.fundingIntervalHours).toBe(1);
    expect(market.base).toBe('BTC');
    expect(market.quote).toBe('USDC');
  });

  test('normalizeOrder handles partially_filled status', () => {
    const rawPartial: PacificaOrderResponse = {
      ...mockOrderResponse,
      filled_size: '0.05',
      status: 'partially_filled',
    };
    const order = normalizer.normalizeOrder(rawPartial);
    expect(order.status).toBe('partiallyFilled');
    expect(order.filled).toBe(0.05);
    expect(order.remaining).toBe(0.05);
  });

  test('normalizeBalance calculates used correctly', () => {
    const balance = normalizer.normalizeBalance(mockAccountInfo);
    expect(balance.used).toBe(2500.0);
  });

  test('normalizeFundingRate uses oracle_price for mark/index', () => {
    const rate = normalizer.normalizeFundingRate(mockFundingHistory, 'BTC/USDC:USDC');
    expect(rate.markPrice).toBe(69605.794);
    expect(rate.indexPrice).toBe(69605.794);
    expect(rate.nextFundingTimestamp).toBe(mockFundingHistory.created_at + 3600000);
  });

  test('normalizeTrade maps side correctly', () => {
    const buyTrade = normalizer.normalizeTrade(
      { ...mockTrade, side: 'open_long' },
      'BTC/USDC:USDC',
      0
    );
    expect(buyTrade.side).toBe('buy');

    const sellTrade = normalizer.normalizeTrade(
      { ...mockTrade, side: 'close_long' },
      'BTC/USDC:USDC',
      1
    );
    expect(sellTrade.side).toBe('sell');

    const shortTrade = normalizer.normalizeTrade(
      { ...mockTrade, side: 'open_short' },
      'BTC/USDC:USDC',
      2
    );
    expect(shortTrade.side).toBe('sell');
  });
});

// ============================================================================
// builderCodeEnabled Tests
// ============================================================================

describe('PacificaAdapter builderCodeEnabled', () => {
  let mockHttpClient: {
    get: jest.Mock;
    post: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
  };

  const mockOrderResponse: PacificaOrderResponse = {
    order_id: 'order-toggle',
    client_order_id: 'toggle-1',
    symbol: 'BTC',
    side: 'buy',
    type: 'limit',
    price: '50000.0',
    size: '0.1',
    filled_size: '0.0',
    status: 'open',
    reduce_only: false,
    post_only: false,
    created_at: 1699999000000,
    updated_at: 1699999000000,
  };

  test('builderCodeEnabled defaults to true', () => {
    const a = new PacificaAdapter({ builderCode: 'my-builder' });
    expect((a as any).builderCodeEnabled).toBe(true);
  });

  test('builderCodeEnabled=false disables builder code in createOrder', async () => {
    const a = new PacificaAdapter({
      apiKey: 'test-key',
      apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      builderCode: 'my-builder',
      builderCodeEnabled: false,
    });
    mockHttpClient = (a as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    mockHttpClient.post.mockResolvedValue(mockOrderResponse);

    await a.createOrder({
      symbol: 'BTC/USDC:USDC',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 50000,
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/orders/create',
      expect.objectContaining({
        body: expect.not.objectContaining({
          builder_code: expect.anything(),
        }),
      })
    );
  });

  test('builderCodeEnabled=true still attaches builder code in createOrder', async () => {
    const a = new PacificaAdapter({
      apiKey: 'test-key',
      apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      builderCode: 'my-builder',
      builderCodeEnabled: true,
    });
    mockHttpClient = (a as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    mockHttpClient.post.mockResolvedValue(mockOrderResponse);

    await a.createOrder({
      symbol: 'BTC/USDC:USDC',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 50000,
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/orders/create',
      expect.objectContaining({
        body: expect.objectContaining({
          builder_code: 'my-builder',
        }),
      })
    );
  });

  test('builderCodeEnabled=false skips registerBuilderCode on initialize', async () => {
    const a = new PacificaAdapter({
      apiKey: 'test-key',
      apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      builderCode: 'my-builder',
      builderCodeEnabled: false,
    });
    mockHttpClient = (a as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;

    await a.initialize();

    expect(a.isReady).toBe(true);
    expect(mockHttpClient.post).not.toHaveBeenCalled();
  });

  test('per-order builderCode still works when builderCodeEnabled=true', async () => {
    const a = new PacificaAdapter({
      apiKey: 'test-key',
      apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      builderCode: 'adapter-builder',
      builderCodeEnabled: true,
    });
    mockHttpClient = (a as unknown as Record<string, unknown>).httpClient as typeof mockHttpClient;
    mockHttpClient.post.mockResolvedValue(mockOrderResponse);

    await a.createOrder({
      symbol: 'BTC/USDC:USDC',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 50000,
      builderCode: 'order-override',
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/orders/create',
      expect.objectContaining({
        body: expect.objectContaining({
          builder_code: 'order-override',
        }),
      })
    );
  });
});

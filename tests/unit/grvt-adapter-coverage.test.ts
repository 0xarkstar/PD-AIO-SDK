/**
 * GRVTAdapter Coverage Tests
 *
 * Additional tests for GRVTAdapter methods to boost coverage:
 * - Market data (fetchMarkets, fetchTicker, fetchOrderBook, fetchTrades, fetchOHLCV, fetchFundingRate)
 * - Trading (createOrder, cancelOrder, cancelAllOrders)
 * - Account (fetchPositions, fetchBalance, fetchOpenOrders, fetchOrderHistory, fetchMyTrades)
 * - Helpers (mapOrderType, mapTimeInForce, setLeverage, disconnect, fetchFundingRateHistory)
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GRVTAdapter } from '../../src/adapters/grvt/GRVTAdapter.js';

// Helper: create adapter with mocked internals
function createTestAdapter(): GRVTAdapter {
  const adapter = new GRVTAdapter({ testnet: true });

  // Mock internal SDK
  const mockSdk: any = {
    getAllInstruments: jest.fn(async () => ({ result: [{ instrument: 'BTC_USDT_Perp' }] })),
    getTicker: jest.fn(async () => ({ result: { instrument: 'BTC_USDT_Perp', last_price: '36000' } })),
    getOrderBook: jest.fn(async () => ({ result: { bids: [], asks: [] } })),
    getTradeHistory: jest.fn(async () => ({ result: [{ id: '1', price: '36000' }] })),
    getCandlestick: jest.fn(async () => ({ result: [{ t: 1700000000000, o: '36000', h: '36500', l: '35800', c: '36200', v: '100' }] })),
    getFunding: jest.fn(async () => ({ result: [{ funding_rate: '0.0001', funding_time: '1700000000000', mark_price: '36000' }] })),
    createOrder: jest.fn(async () => ({ result: { order_id: '123', status: 'active' } })),
    cancelOrder: jest.fn(async () => ({ result: { order_id: '123', status: 'canceled' } })),
    cancelAllOrders: jest.fn(async () => ({ result: 5 })),
    getOpenOrders: jest.fn(async () => ({ result: [{ order_id: '1' }] })),
    getOrderHistory: jest.fn(async () => ({ result: [{ order_id: '1' }] })),
    getFillHistory: jest.fn(async () => ({ result: [{ fill_id: '1' }] })),
    getPositions: jest.fn(async () => ({ result: [{ instrument: 'BTC_USDT_Perp' }] })),
    getSubAccountSummary: jest.fn(async () => ({ result: { spot_balances: [{ currency: 'USDT', total: '10000' }] } })),
    setInitialLeverage: jest.fn(async () => ({ result: true })),
    getSessionCookie: jest.fn(() => 'session-cookie'),
    clearSession: jest.fn(),
  };

  const mockAuth: any = {
    hasCredentials: jest.fn(() => true),
    verify: jest.fn(async () => true),
    requireAuth: jest.fn(),
    getAddress: jest.fn(() => '0xabc'),
    getNextNonce: jest.fn(() => 1),
    createSignature: jest.fn(async () => '0xsig'),
    setSessionCookie: jest.fn(),
    clearSessionCookie: jest.fn(),
  };

  const mockNormalizer: any = {
    symbolFromCCXT: jest.fn((s: string) => s.replace('/USDT:USDT', '_USDT_Perp')),
    symbolToCCXT: jest.fn((s: string) => s.replace('_USDT_Perp', '/USDT:USDT')),
    normalizeMarkets: jest.fn((data: any) => data.map((d: any) => ({ symbol: 'BTC/USDT:USDT', active: true, info: d }))),
    normalizeTicker: jest.fn((data: any) => ({ symbol: 'BTC/USDT:USDT', last: 36000, info: data })),
    normalizeOrderBook: jest.fn((data: any) => ({ symbol: 'BTC/USDT:USDT', bids: [], asks: [], timestamp: Date.now() })),
    normalizeTrades: jest.fn((data: any) => data.map((d: any) => ({ id: d.id, price: 36000 }))),
    normalizeOrder: jest.fn((data: any) => ({ id: data.order_id || '1', symbol: 'BTC/USDT:USDT', status: data.status || 'open' })),
    normalizeOrders: jest.fn((data: any) => data.map((d: any) => ({ id: d.order_id, symbol: 'BTC/USDT:USDT' }))),
    normalizeFills: jest.fn((data: any) => data.map((d: any) => ({ id: d.fill_id, symbol: 'BTC/USDT:USDT' }))),
    normalizePositions: jest.fn((data: any) => data.map((d: any) => ({ symbol: 'BTC/USDT:USDT', size: 0.1 }))),
    normalizeBalances: jest.fn((data: any) => data.map((d: any) => ({ currency: d.currency, total: parseFloat(d.total) }))),
  };

  // Inject mocks
  (adapter as any).sdk = mockSdk;
  (adapter as any).auth = mockAuth;
  (adapter as any).normalizer = mockNormalizer;
  (adapter as any).rateLimiter = { acquire: jest.fn(async () => {}) };
  (adapter as any)._isReady = true;

  return adapter;
}

describe('GRVTAdapter Coverage', () => {
  let adapter: GRVTAdapter;

  beforeEach(() => {
    adapter = createTestAdapter();
  });

  // =========================================================================
  // Market Data
  // =========================================================================
  describe('fetchMarkets', () => {
    it('should fetch and normalize markets', async () => {
      const result = await adapter.fetchMarkets();
      expect(result).toHaveLength(1);
    });

    it('should filter by active param', async () => {
      const result = await adapter.fetchMarkets({ active: true });
      expect(result).toHaveLength(1);
    });

    it('should throw on null result', async () => {
      (adapter as any).sdk.getAllInstruments.mockResolvedValue({ result: null });
      await expect(adapter.fetchMarkets()).rejects.toThrow('Invalid API response');
    });
  });

  describe('fetchTicker', () => {
    it('should fetch and normalize ticker', async () => {
      const result = await adapter.fetchTicker('BTC/USDT:USDT');
      expect(result.symbol).toBe('BTC/USDT:USDT');
    });

    it('should throw on null result', async () => {
      (adapter as any).sdk.getTicker.mockResolvedValue({ result: null });
      await expect(adapter.fetchTicker('BTC/USDT:USDT')).rejects.toThrow('Invalid API response');
    });
  });

  describe('fetchOrderBook', () => {
    it('should fetch with default depth', async () => {
      await adapter.fetchOrderBook('BTC/USDT:USDT');
      expect((adapter as any).sdk.getOrderBook).toHaveBeenCalledWith('BTC_USDT_Perp', 50);
    });

    it('should use small depth for limit <= 10', async () => {
      await adapter.fetchOrderBook('BTC/USDT:USDT', { limit: 5 });
      expect((adapter as any).sdk.getOrderBook).toHaveBeenCalledWith('BTC_USDT_Perp', 10);
    });

    it('should use 100 for limit > 50', async () => {
      await adapter.fetchOrderBook('BTC/USDT:USDT', { limit: 75 });
      expect((adapter as any).sdk.getOrderBook).toHaveBeenCalledWith('BTC_USDT_Perp', 100);
    });
  });

  describe('fetchTrades', () => {
    it('should fetch and normalize trades', async () => {
      const result = await adapter.fetchTrades('BTC/USDT:USDT');
      expect(result).toHaveLength(1);
    });

    it('should pass limit param', async () => {
      await adapter.fetchTrades('BTC/USDT:USDT', { limit: 50 });
      expect((adapter as any).sdk.getTradeHistory).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50 })
      );
    });
  });

  describe('fetchOHLCV', () => {
    it('should fetch OHLCV data', async () => {
      const result = await adapter.fetchOHLCV('BTC/USDT:USDT', '1h');
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(6);
    });

    it('should return empty for null result', async () => {
      (adapter as any).sdk.getCandlestick.mockResolvedValue({ result: null });
      const result = await adapter.fetchOHLCV('BTC/USDT:USDT');
      expect(result).toEqual([]);
    });

    it('should handle different timeframes', async () => {
      await adapter.fetchOHLCV('BTC/USDT:USDT', '1m');
      await adapter.fetchOHLCV('BTC/USDT:USDT', '4h');
      await adapter.fetchOHLCV('BTC/USDT:USDT', '1d');
      expect((adapter as any).sdk.getCandlestick).toHaveBeenCalledTimes(3);
    });

    it('should use since and until params', async () => {
      await adapter.fetchOHLCV('BTC/USDT:USDT', '1h', { since: 1700000000000, until: 1700100000000, limit: 100 });
      expect((adapter as any).sdk.getCandlestick).toHaveBeenCalledWith(
        expect.objectContaining({
          start_time: 1700000000000,
          end_time: 1700100000000,
          limit: 100,
        })
      );
    });
  });

  describe('fetchFundingRate', () => {
    it('should fetch funding rate', async () => {
      const result = await adapter.fetchFundingRate('BTC/USDT:USDT');
      expect(result.symbol).toBe('BTC/USDT:USDT');
      expect(result.fundingRate).toBe(0.0001);
    });

    it('should throw on empty result', async () => {
      (adapter as any).sdk.getFunding.mockResolvedValue({ result: [] });
      await expect(adapter.fetchFundingRate('BTC/USDT:USDT')).rejects.toThrow('Invalid API response');
    });

    it('should throw on null result', async () => {
      (adapter as any).sdk.getFunding.mockResolvedValue({ result: null });
      await expect(adapter.fetchFundingRate('BTC/USDT:USDT')).rejects.toThrow('Invalid API response');
    });
  });

  // =========================================================================
  // Trading
  // =========================================================================
  describe('createOrder', () => {
    it('should create order with signature', async () => {
      const result = await adapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 36000,
      });
      expect(result.id).toBe('123');
      expect((adapter as any).auth.createSignature).toHaveBeenCalled();
    });

    it('should set session cookie from response', async () => {
      await adapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 36000,
      });
      expect((adapter as any).auth.setSessionCookie).toHaveBeenCalledWith('session-cookie');
    });

    it('should throw on null result', async () => {
      (adapter as any).sdk.createOrder.mockResolvedValue({ result: null });
      await expect(adapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 36000,
      })).rejects.toThrow('Invalid API response');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order', async () => {
      const result = await adapter.cancelOrder('123');
      expect(result.id).toBe('123');
    });

    it('should throw on null result', async () => {
      (adapter as any).sdk.cancelOrder.mockResolvedValue({ result: null });
      await expect(adapter.cancelOrder('123')).rejects.toThrow('Invalid API response');
    });
  });

  describe('cancelAllOrders', () => {
    it('should cancel all orders without symbol', async () => {
      const result = await adapter.cancelAllOrders();
      expect(result).toEqual([]);
    });

    it('should pass instrument for specific symbol', async () => {
      await adapter.cancelAllOrders('BTC/USDT:USDT');
      expect((adapter as any).sdk.cancelAllOrders).toHaveBeenCalledWith(
        expect.objectContaining({ instrument: 'BTC_USDT_Perp' })
      );
    });
  });

  // =========================================================================
  // Account
  // =========================================================================
  describe('fetchPositions', () => {
    it('should fetch positions', async () => {
      const result = await adapter.fetchPositions();
      expect(result).toHaveLength(1);
    });

    it('should filter by symbols', async () => {
      const result = await adapter.fetchPositions(['BTC/USDT:USDT']);
      expect(result).toHaveLength(1);
    });

    it('should filter out non-matching symbols', async () => {
      const result = await adapter.fetchPositions(['SOL/USDT:USDT']);
      expect(result).toHaveLength(0);
    });
  });

  describe('fetchBalance', () => {
    it('should fetch balances', async () => {
      const result = await adapter.fetchBalance();
      expect(result).toHaveLength(1);
    });

    it('should handle empty spot_balances', async () => {
      (adapter as any).sdk.getSubAccountSummary.mockResolvedValue({ result: { spot_balances: [] } });
      const result = await adapter.fetchBalance();
      expect(result).toHaveLength(0);
    });
  });

  describe('fetchOpenOrders', () => {
    it('should fetch open orders', async () => {
      const result = await adapter.fetchOpenOrders();
      expect(result).toHaveLength(1);
    });

    it('should pass symbol filter', async () => {
      await adapter.fetchOpenOrders('BTC/USDT:USDT');
      expect((adapter as any).sdk.getOpenOrders).toHaveBeenCalledWith(
        expect.objectContaining({ instrument: 'BTC_USDT_Perp' })
      );
    });
  });

  describe('fetchOrderHistory', () => {
    it('should fetch order history', async () => {
      const result = await adapter.fetchOrderHistory();
      expect(result).toHaveLength(1);
    });

    it('should pass limit', async () => {
      await adapter.fetchOrderHistory(undefined, undefined, 50);
      expect((adapter as any).sdk.getOrderHistory).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50 })
      );
    });
  });

  describe('fetchMyTrades', () => {
    it('should fetch user trades', async () => {
      const result = await adapter.fetchMyTrades();
      expect(result).toHaveLength(1);
    });
  });

  // =========================================================================
  // Helpers
  // =========================================================================
  describe('fetchFundingRateHistory', () => {
    it('should throw NOT_SUPPORTED', async () => {
      await expect(adapter.fetchFundingRateHistory('BTC/USDT:USDT')).rejects.toThrow('does not provide');
    });
  });

  describe('setLeverage', () => {
    it('should call SDK setInitialLeverage', async () => {
      await adapter.setLeverage('BTC/USDT:USDT', 10);
      expect((adapter as any).sdk.setInitialLeverage).toHaveBeenCalledWith(
        expect.objectContaining({ instrument: 'BTC_USDT_Perp', leverage: '10' })
      );
    });
  });

  describe('symbolToExchange', () => {
    it('should convert unified to GRVT format', () => {
      expect(adapter.symbolToExchange('BTC/USDT:USDT')).toBe('BTC_USDT_Perp');
    });
  });

  describe('symbolFromExchange', () => {
    it('should convert GRVT to unified format', () => {
      expect(adapter.symbolFromExchange('BTC_USDT_Perp')).toBe('BTC/USDT:USDT');
    });
  });

  describe('disconnect', () => {
    it('should clear session and auth', async () => {
      await adapter.disconnect();
      expect((adapter as any).auth.clearSessionCookie).toHaveBeenCalled();
      expect((adapter as any).sdk.clearSession).toHaveBeenCalled();
      expect((adapter as any)._isReady).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should verify credentials', async () => {
      const freshAdapter = createTestAdapter();
      (freshAdapter as any)._isReady = false;
      await freshAdapter.initialize();
      expect((freshAdapter as any).auth.verify).toHaveBeenCalled();
    });

    it('should throw on invalid credentials', async () => {
      const freshAdapter = createTestAdapter();
      (freshAdapter as any)._isReady = false;
      (freshAdapter as any).auth.verify.mockResolvedValue(false);
      await expect(freshAdapter.initialize()).rejects.toThrow('verify GRVT credentials');
    });

    it('should skip verification when no credentials', async () => {
      const freshAdapter = createTestAdapter();
      (freshAdapter as any)._isReady = false;
      (freshAdapter as any).auth.hasCredentials.mockReturnValue(false);
      await freshAdapter.initialize();
      expect((freshAdapter as any).auth.verify).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Builder Code
  // =========================================================================
  describe('builder code', () => {
    it('should store builderCode from config', () => {
      const a = new GRVTAdapter({ builderCode: 'GRVT_BUILDER_1' });
      expect((a as any).builderCode).toBe('GRVT_BUILDER_1');
    });

    it('should default builderCodeEnabled to true', () => {
      const a = new GRVTAdapter({ builderCode: 'GRVT_BUILDER_1' });
      expect((a as any).builderCodeEnabled).toBe(true);
    });

    it('should respect builderCodeEnabled=false', () => {
      const a = new GRVTAdapter({ builderCode: 'GRVT_BUILDER_1', builderCodeEnabled: false });
      expect((a as any).builderCodeEnabled).toBe(false);
    });

    it('should add builder_id to order when builderCode is set', async () => {
      const a = new GRVTAdapter({ builderCode: 'GRVT_BUILDER_1' });
      // Inject mocks
      const mockSdk: any = {
        createOrder: jest.fn(async (req: any) => ({ result: { order_id: '456', status: 'active' } })),
        getSessionCookie: jest.fn(() => null),
      };
      const mockAuth: any = {
        hasCredentials: jest.fn(() => true),
        requireAuth: jest.fn(),
        getAddress: jest.fn(() => '0xabc'),
        getNextNonce: jest.fn(() => 1),
        createSignature: jest.fn(async () => '0xsig'),
        setSessionCookie: jest.fn(),
      };
      const mockNormalizer: any = {
        symbolFromCCXT: jest.fn((s: string) => s.replace('/USDT:USDT', '_USDT_Perp')),
        normalizeOrder: jest.fn((data: any) => ({ id: data.order_id, status: data.status })),
      };
      (a as any).sdk = mockSdk;
      (a as any).auth = mockAuth;
      (a as any).normalizer = mockNormalizer;
      (a as any).rateLimiter = { acquire: jest.fn(async () => {}) };
      (a as any)._isReady = true;

      await a.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 36000,
      });

      const orderArg = mockSdk.createOrder.mock.calls[0][0];
      expect(orderArg.builder_id).toBe('GRVT_BUILDER_1');
    });

    it('should NOT add builder_id when builderCode is not set', async () => {
      const a = createTestAdapter();

      await a.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 36000,
      });

      const orderArg = (a as any).sdk.createOrder.mock.calls[0][0];
      expect(orderArg.builder_id).toBeUndefined();
    });

    it('should NOT add builder_id when builderCodeEnabled=false', async () => {
      const a = new GRVTAdapter({ builderCode: 'GRVT_BUILDER_1', builderCodeEnabled: false });
      const mockSdk: any = {
        createOrder: jest.fn(async () => ({ result: { order_id: '789', status: 'active' } })),
        getSessionCookie: jest.fn(() => null),
      };
      const mockAuth: any = {
        hasCredentials: jest.fn(() => true),
        requireAuth: jest.fn(),
        getAddress: jest.fn(() => '0xabc'),
        getNextNonce: jest.fn(() => 1),
        createSignature: jest.fn(async () => '0xsig'),
        setSessionCookie: jest.fn(),
      };
      const mockNormalizer: any = {
        symbolFromCCXT: jest.fn((s: string) => s.replace('/USDT:USDT', '_USDT_Perp')),
        normalizeOrder: jest.fn((data: any) => ({ id: data.order_id, status: data.status })),
      };
      (a as any).sdk = mockSdk;
      (a as any).auth = mockAuth;
      (a as any).normalizer = mockNormalizer;
      (a as any).rateLimiter = { acquire: jest.fn(async () => {}) };
      (a as any)._isReady = true;

      await a.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 36000,
      });

      const orderArg = mockSdk.createOrder.mock.calls[0][0];
      expect(orderArg.builder_id).toBeUndefined();
    });

    it('should allow per-order builderCode override', async () => {
      const a = new GRVTAdapter({ builderCode: 'ADAPTER_BUILDER' });
      const mockSdk: any = {
        createOrder: jest.fn(async () => ({ result: { order_id: '101', status: 'active' } })),
        getSessionCookie: jest.fn(() => null),
      };
      const mockAuth: any = {
        hasCredentials: jest.fn(() => true),
        requireAuth: jest.fn(),
        getAddress: jest.fn(() => '0xabc'),
        getNextNonce: jest.fn(() => 1),
        createSignature: jest.fn(async () => '0xsig'),
        setSessionCookie: jest.fn(),
      };
      const mockNormalizer: any = {
        symbolFromCCXT: jest.fn((s: string) => s.replace('/USDT:USDT', '_USDT_Perp')),
        normalizeOrder: jest.fn((data: any) => ({ id: data.order_id, status: data.status })),
      };
      (a as any).sdk = mockSdk;
      (a as any).auth = mockAuth;
      (a as any).normalizer = mockNormalizer;
      (a as any).rateLimiter = { acquire: jest.fn(async () => {}) };
      (a as any)._isReady = true;

      await a.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 36000,
        builderCode: 'ORDER_BUILDER',
      });

      const orderArg = mockSdk.createOrder.mock.calls[0][0];
      expect(orderArg.builder_id).toBe('ORDER_BUILDER');
    });

    it('should use adapter builderCode when per-order is not set', async () => {
      const a = new GRVTAdapter({ builderCode: 'ADAPTER_BUILDER' });
      const mockSdk: any = {
        createOrder: jest.fn(async () => ({ result: { order_id: '102', status: 'active' } })),
        getSessionCookie: jest.fn(() => null),
      };
      const mockAuth: any = {
        hasCredentials: jest.fn(() => true),
        requireAuth: jest.fn(),
        getAddress: jest.fn(() => '0xabc'),
        getNextNonce: jest.fn(() => 1),
        createSignature: jest.fn(async () => '0xsig'),
        setSessionCookie: jest.fn(),
      };
      const mockNormalizer: any = {
        symbolFromCCXT: jest.fn((s: string) => s.replace('/USDT:USDT', '_USDT_Perp')),
        normalizeOrder: jest.fn((data: any) => ({ id: data.order_id, status: data.status })),
      };
      (a as any).sdk = mockSdk;
      (a as any).auth = mockAuth;
      (a as any).normalizer = mockNormalizer;
      (a as any).rateLimiter = { acquire: jest.fn(async () => {}) };
      (a as any)._isReady = true;

      await a.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 36000,
      });

      const orderArg = mockSdk.createOrder.mock.calls[0][0];
      expect(orderArg.builder_id).toBe('ADAPTER_BUILDER');
    });

    it('should default builderCodeEnabled to true when not specified', () => {
      const a = new GRVTAdapter({});
      expect((a as any).builderCodeEnabled).toBe(true);
    });

    it('should not have builderCode when not configured', () => {
      const a = new GRVTAdapter({});
      expect((a as any).builderCode).toBeUndefined();
    });
  });
});

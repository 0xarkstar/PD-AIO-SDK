/**
 * NadoAdapter Coverage Tests
 *
 * Tests for NadoAdapter methods including trading, account, market data, and WebSocket.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { NadoAdapter } from '../../src/adapters/nado/NadoAdapter.js';

// Helper to create adapter with mocked internals
function createTestAdapter(): NadoAdapter {
  const adapter = new NadoAdapter({ testnet: true });

  const mockApiClient: any = {
    query: jest.fn(async () => ({})),
    execute: jest.fn(async () => ({})),
  };

  const mockAuth: any = {
    getAddress: jest.fn(() => '0xabc123'),
    getCurrentNonce: jest.fn(() => 1),
    getNextNonce: jest.fn(() => 2),
    setNonce: jest.fn(),
    signOrder: jest.fn(async () => '0xsignature'),
    signCancellation: jest.fn(async () => '0xsignature'),
  };

  const mockNormalizer: any = {
    normalizeSymbol: jest.fn((data: any) => ({
      symbol: `${data.base_currency || 'BTC'}/USDT:USDT`,
      active: true,
      base: data.base_currency || 'BTC',
      quote: 'USDT',
      info: data,
    })),
    normalizeTicker: jest.fn((_data: any, symbol: string) => ({
      symbol,
      last: 36000,
      info: { fundingRate: '0.0001', nextFundingTime: Date.now() + 28800000, markPrice: '36000', indexPrice: '36000' },
    })),
    normalizeOrderBook: jest.fn((data: any, symbol: string) => ({
      symbol,
      bids: [],
      asks: [],
      timestamp: Date.now(),
    })),
    normalizeOrder: jest.fn((data: any, _mapping: any) => ({
      id: data.order_id || '1',
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      price: 36000,
      amount: 0.1,
      filled: 0,
      remaining: 0.1,
      status: 'open',
      timestamp: Date.now(),
      info: data,
    })),
    normalizePosition: jest.fn((data: any, _mapping: any) => ({
      symbol: 'BTC/USDT:USDT',
      side: 'long',
      size: 0.1,
      entryPrice: 36000,
      markPrice: 36500,
      unrealizedPnl: 50,
      leverage: 10,
      info: data,
    })),
    normalizeBalance: jest.fn((data: any) => ([{
      currency: 'USDT',
      total: 10000,
      free: 8000,
      used: 2000,
    }])),
    normalizeTrade: jest.fn((data: any, _mapping: any) => ({
      id: data.trade_id || '1',
      symbol: 'BTC/USDT:USDT',
      side: 'buy',
      price: 36000,
      amount: 0.1,
      timestamp: Date.now(),
    })),
  };

  // Inject mocks
  (adapter as any).apiClient = mockApiClient;
  (adapter as any).auth = mockAuth;
  (adapter as any).normalizer = mockNormalizer;
  (adapter as any)._isReady = true;
  (adapter as any).contractsInfo = { chain_id: 57073, endpoint_addr: '0xendpoint' };
  (adapter as any).productMappings = new Map([
    ['BTC/USDT:USDT', { productId: 1, symbol: 'BTC-PERP', ccxtSymbol: 'BTC/USDT:USDT' }],
    ['ETH/USDT:USDT', { productId: 2, symbol: 'ETH-PERP', ccxtSymbol: 'ETH/USDT:USDT' }],
  ]);

  return adapter;
}

describe('NadoAdapter Coverage', () => {
  let adapter: NadoAdapter;

  beforeEach(() => {
    adapter = createTestAdapter();
  });

  // =========================================================================
  // Constructor & Config
  // =========================================================================
  describe('constructor', () => {
    it('should create with default config', () => {
      const a = new NadoAdapter();
      expect(a.id).toBe('nado');
      expect(a.name).toBe('Nado');
    });

    it('should create with testnet config', () => {
      const a = new NadoAdapter({ testnet: true });
      expect(a.id).toBe('nado');
    });

    it('should create without auth when no credentials', () => {
      const a = new NadoAdapter({ testnet: true });
      expect((a as any).auth).toBeUndefined();
    });

    it('should have correct feature map', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.fetchTrades).toBe(false);
      expect(adapter.has.watchOrderBook).toBe(true);
    });
  });

  // =========================================================================
  // Market Data
  // =========================================================================
  describe('fetchTicker', () => {
    it('should fetch ticker for valid symbol', async () => {
      // NadoTickerSchema expects { product_id: number, bid_x18: string, ask_x18: string }
      (adapter as any).apiClient.query.mockResolvedValue({
        market_prices: [{ product_id: 1, bid_x18: '36000000000000000000000', ask_x18: '36001000000000000000000' }],
      });

      const result = await adapter.fetchTicker('BTC/USDT:USDT');
      expect(result.symbol).toBe('BTC/USDT:USDT');
    });

    it('should throw for unknown symbol', async () => {
      await expect(adapter.fetchTicker('SOL/USDT:USDT')).rejects.toThrow('Product mapping not found');
    });

    it('should throw when no ticker data', async () => {
      (adapter as any).apiClient.query.mockResolvedValue({ market_prices: [] });

      await expect(adapter.fetchTicker('BTC/USDT:USDT')).rejects.toThrow('No ticker data');
    });
  });

  describe('fetchOrderBook', () => {
    it('should fetch order book', async () => {
      (adapter as any).apiClient.query.mockResolvedValue({ bids: [], asks: [] });

      const result = await adapter.fetchOrderBook('BTC/USDT:USDT');
      expect(result.symbol).toBe('BTC/USDT:USDT');
    });

    it('should use default depth 20', async () => {
      (adapter as any).apiClient.query.mockResolvedValue({ bids: [], asks: [] });
      await adapter.fetchOrderBook('BTC/USDT:USDT');

      expect((adapter as any).apiClient.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ depth: 20 })
      );
    });

    it('should use custom depth', async () => {
      (adapter as any).apiClient.query.mockResolvedValue({ bids: [], asks: [] });
      await adapter.fetchOrderBook('BTC/USDT:USDT', { limit: 50 });

      expect((adapter as any).apiClient.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ depth: 50 })
      );
    });
  });

  describe('fetchTrades', () => {
    it('should throw NOT_SUPPORTED', async () => {
      await expect(adapter.fetchTrades('BTC/USDT:USDT')).rejects.toThrow('not supported');
    });
  });

  describe('fetchFundingRate', () => {
    it('should fetch funding rate', async () => {
      // fetchFundingRate calls fetchTicker internally, which calls apiClient.query
      (adapter as any).apiClient.query.mockResolvedValue({
        market_prices: [{ product_id: 1, bid_x18: '36000000000000000000000', ask_x18: '36001000000000000000000' }],
      });

      const result = await adapter.fetchFundingRate('BTC/USDT:USDT');
      expect(result.symbol).toBe('BTC/USDT:USDT');
      expect(typeof result.fundingRate).toBe('number');
    });
  });

  // =========================================================================
  // Trading
  // =========================================================================
  describe('createOrder', () => {
    it('should create an order', async () => {
      // NadoOrderSchema expects full order structure
      (adapter as any).apiClient.execute.mockResolvedValue({
        order_id: '99', digest: '0xdigest', product_id: 1, sender: '0xabc123',
        price_x18: '36000000000000000000000', amount: '100000000000000000',
        side: 0, expiration: 1700100000, nonce: 1, status: 'open',
        filled_amount: '0', remaining_amount: '100000000000000000', timestamp: 1700000000,
      });

      const result = await adapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 36000,
      });
      expect(result.id).toBeDefined();
    });

    it('should throw if no contracts info', async () => {
      (adapter as any).contractsInfo = undefined;

      await expect(adapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 36000,
      })).rejects.toThrow('Contracts info not loaded');
    });

    it('should throw without auth', async () => {
      (adapter as any).auth = undefined;

      await expect(adapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 36000,
      })).rejects.toThrow();
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order by id', async () => {
      // cancelOrder first queries the order, then cancels it
      // query returns raw NadoOrder that passes NadoOrderSchema.parse()
      (adapter as any).apiClient.query.mockResolvedValue({
        order_id: '99', digest: '0xdigest', product_id: 1, sender: '0xabc123',
        price_x18: '36000000000000000000000', amount: '100000000000000000',
        side: 0, expiration: 1700100000, nonce: 1, status: 'open',
        filled_amount: '0', remaining_amount: '100000000000000000', timestamp: 1700000000,
      });

      const result = await adapter.cancelOrder('99');
      expect(result).toBeDefined();
    });

    it('should throw if no contracts info', async () => {
      (adapter as any).contractsInfo = undefined;
      await expect(adapter.cancelOrder('99')).rejects.toThrow('Contracts info not loaded');
    });
  });

  describe('cancelAllOrders', () => {
    it('should return empty if no open orders', async () => {
      (adapter as any).apiClient.query.mockResolvedValue([]);

      const result = await adapter.cancelAllOrders();
      expect(result).toEqual([]);
    });

    it('should cancel all open orders', async () => {
      (adapter as any).apiClient.query.mockResolvedValue([
        { order_id: '1', product_id: 1, digest: '0xa' },
        { order_id: '2', product_id: 2, digest: '0xb' },
      ]);

      const result = await adapter.cancelAllOrders();
      expect(result).toHaveLength(2);
    });

    it('should filter by symbol', async () => {
      (adapter as any).apiClient.query.mockResolvedValue([
        { order_id: '1', product_id: 1, digest: '0xa' },
        { order_id: '2', product_id: 2, digest: '0xb' },
      ]);

      const result = await adapter.cancelAllOrders('BTC/USDT:USDT');
      expect(result).toHaveLength(1);
    });
  });

  // =========================================================================
  // Account
  // =========================================================================
  describe('fetchPositions', () => {
    it('should fetch positions', async () => {
      // NadoPositionSchema expects full structure
      (adapter as any).apiClient.query.mockResolvedValue([{
        product_id: 1, subaccount: '0xabc123', size: '500000000000000000',
        entry_price: '36000000000000000000000', mark_price: '36500000000000000000000',
        unrealized_pnl: '50000000000000000000', realized_pnl: '0',
        leverage: '10000000000000000000', margin: '3600000000000000000000', timestamp: 1700000000,
      }]);

      const result = await adapter.fetchPositions();
      expect(result).toHaveLength(1);
    });

    it('should skip positions without mapping', async () => {
      (adapter as any).apiClient.query.mockResolvedValue([{
        product_id: 999, subaccount: '0xabc123', size: '500000000000000000',
        entry_price: '36000000000000000000000', mark_price: '36500000000000000000000',
        unrealized_pnl: '0', realized_pnl: '0',
        leverage: '10000000000000000000', margin: '3600000000000000000000', timestamp: 1700000000,
      }]);

      const result = await adapter.fetchPositions();
      expect(result).toHaveLength(0);
    });
  });

  describe('fetchBalance', () => {
    it('should fetch balance', async () => {
      // NadoBalanceSchema expects full structure
      (adapter as any).apiClient.query.mockResolvedValue({
        subaccount: '0xabc123',
        quote_balance: '10000000000000000000000',
        total_equity: '15000000000000000000000',
        used_margin: '5000000000000000000000',
        free_margin: '10000000000000000000000',
        unrealized_pnl: '500000000000000000000',
        health: '3000000000000000000',
        timestamp: 1700000000,
      });

      const result = await adapter.fetchBalance();
      expect(result).toHaveLength(1);
    });
  });

  describe('fetchOpenOrders', () => {
    it('should fetch open orders', async () => {
      (adapter as any).apiClient.query.mockResolvedValue([
        { order_id: '1', product_id: 1 },
      ]);

      const result = await adapter.fetchOpenOrders();
      expect(result).toHaveLength(1);
    });

    it('should return empty for no orders', async () => {
      (adapter as any).apiClient.query.mockResolvedValue([]);

      const result = await adapter.fetchOpenOrders();
      expect(result).toEqual([]);
    });

    it('should filter by symbol', async () => {
      (adapter as any).apiClient.query.mockResolvedValue([
        { order_id: '1', product_id: 1 },
        { order_id: '2', product_id: 2 },
      ]);

      const result = await adapter.fetchOpenOrders('BTC/USDT:USDT');
      expect(result).toHaveLength(1);
    });

    it('should skip orders without mapping', async () => {
      (adapter as any).apiClient.query.mockResolvedValue([
        { order_id: '1', product_id: 999 },
      ]);

      const result = await adapter.fetchOpenOrders();
      expect(result).toHaveLength(0);
    });
  });

  // =========================================================================
  // Auth
  // =========================================================================
  describe('requireAuth', () => {
    it('should throw when no auth configured', async () => {
      (adapter as any).auth = undefined;

      await expect(adapter.fetchPositions()).rejects.toThrow('Authentication required');
    });
  });

  // =========================================================================
  // WebSocket
  // =========================================================================
  describe('WebSocket methods', () => {
    it('watchOrderBook should throw if wsManager not initialized', async () => {
      (adapter as any).wsManager = undefined;
      const gen = adapter.watchOrderBook('BTC/USDT:USDT');
      await expect(gen.next()).rejects.toThrow('WebSocket not initialized');
    });

    it('watchPositions should throw if wsManager not initialized', async () => {
      (adapter as any).wsManager = undefined;
      const gen = adapter.watchPositions();
      await expect(gen.next()).rejects.toThrow();
    });

    it('watchOrders should throw if wsManager not initialized', async () => {
      (adapter as any).wsManager = undefined;
      const gen = adapter.watchOrders();
      await expect(gen.next()).rejects.toThrow();
    });

    it('watchTrades should throw if wsManager not initialized', async () => {
      (adapter as any).wsManager = undefined;
      const gen = adapter.watchTrades('BTC/USDT:USDT');
      await expect(gen.next()).rejects.toThrow('WebSocket not initialized');
    });
  });

  // =========================================================================
  // Disconnect
  // =========================================================================
  describe('disconnect', () => {
    it('should clear state', async () => {
      (adapter as any).wsManager = { disconnect: jest.fn(async () => {}) };
      await adapter.disconnect();
      expect((adapter as any).wsManager).toBeUndefined();
    });

    it('should handle disconnect without wsManager', async () => {
      (adapter as any).wsManager = undefined;
      await expect(adapter.disconnect()).resolves.not.toThrow();
    });
  });

  describe('connect', () => {
    it('should alias to initialize', async () => {
      const initSpy = jest.spyOn(adapter, 'initialize').mockResolvedValue();
      await adapter.connect();
      expect(initSpy).toHaveBeenCalled();
    });
  });
});

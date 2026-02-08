/**
 * Backpack Adapter Extended Tests
 *
 * Additional test coverage for Backpack adapter edge cases and untested methods
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { BackpackAdapter } from '../../src/adapters/backpack/BackpackAdapter.js';
import { PerpDEXError } from '../../src/types/errors.js';

// Mock dependencies
jest.mock('../../src/core/http/HTTPClient.js', () => ({
  HTTPClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('../../src/websocket/WebSocketManager.js', () => ({
  WebSocketManager: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(),
  })),
}));

describe('BackpackAdapter Extended Tests', () => {
  let adapter: BackpackAdapter;
  let authAdapter: BackpackAdapter;
  let mockHttpClient: any;
  let authMockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new BackpackAdapter();
    mockHttpClient = (adapter as any).httpClient;

    authAdapter = new BackpackAdapter({
      apiKey: 'test-key',
      apiSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    });
    authMockClient = (authAdapter as any).httpClient;
  });

  describe('createOrder edge cases', () => {
    test('should create market order with minimal params', async () => {
      const mockOrder = {
        order_id: 'order-123',
        market: 'BTC_USDC_PERP',
        status: 'New',
        side: 'Bid',
        type: 'Limit', // Backpack returns Limit even for market
        price: '50000',
        size: '0.1',
        filled_size: '0',
        time_in_force: 'GTC',
        created_at: Date.now(),
      };

      authMockClient.post.mockResolvedValue(mockOrder);

      const order = await authAdapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        side: 'buy',
        type: 'market',
        amount: 0.1,
      });

      expect(order).toBeDefined();
      expect(order.type).toBe('limit');
    });

    test('should create limit order with post-only', async () => {
      const mockOrder = {
        order_id: 'order-456',
        market: 'BTC_USDC_PERP',
        status: 'New',
        side: 'Bid',
        type: 'Limit',
        price: '49000',
        size: '0.1',
        filled_size: '0',
        time_in_force: 'POST_ONLY',
        created_at: Date.now(),
      };

      authMockClient.post.mockResolvedValue(mockOrder);

      const order = await authAdapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        side: 'buy',
        type: 'limit',
        amount: 0.1,
        price: 49000,
        postOnly: true,
      });

      expect(order).toBeDefined();
    });

    test('should create order with client order ID', async () => {
      const mockOrder = {
        order_id: 'order-789',
        client_order_id: 'my-client-id',
        market: 'ETH_USDC_PERP',
        status: 'New',
        side: 'Ask',
        type: 'Limit',
        price: '3000',
        size: '1',
        filled_size: '0',
        time_in_force: 'GTC',
        created_at: Date.now(),
      };

      authMockClient.post.mockResolvedValue(mockOrder);

      const order = await authAdapter.createOrder({
        symbol: 'ETH/USDC:USDC',
        side: 'sell',
        type: 'limit',
        amount: 1,
        price: 3000,
        clientOrderId: 'my-client-id',
      });

      expect(order.clientOrderId).toBe('my-client-id');
    });

    test('should create reduce-only order', async () => {
      const mockOrder = {
        order_id: 'order-reduce',
        market: 'BTC_USDC_PERP',
        status: 'New',
        side: 'Ask',
        type: 'Market',
        price: '50000',
        size: '0.5',
        filled_size: '0',
        time_in_force: 'GTC',
        reduce_only: true,
        created_at: Date.now(),
      };

      authMockClient.post.mockResolvedValue(mockOrder);

      const order = await authAdapter.createOrder({
        symbol: 'BTC/USDC:USDC',
        side: 'sell',
        type: 'market',
        amount: 0.5,
        reduceOnly: true,
      });

      expect(order).toBeDefined();
    });

    test('should handle order creation error', async () => {
      authMockClient.post.mockRejectedValue({ code: 1001, message: 'Invalid order' });

      await expect(
        authAdapter.createOrder({
          symbol: 'BTC/USDC:USDC',
          side: 'buy',
          type: 'market',
          amount: 0.1,
        })
      ).rejects.toThrow();
    });
  });

  describe('cancelOrder edge cases', () => {
    test('should cancel order by order ID', async () => {
      const mockOrder = {
        order_id: 'order-123',
        market: 'BTC_USDC_PERP',
        status: 'New', // Status might not change immediately
        side: 'Bid',
        type: 'Limit',
        price: '50000',
        size: '0.1',
        filled_size: '0',
        time_in_force: 'GTC',
        created_at: Date.now(),
      };

      authMockClient.delete.mockResolvedValue(mockOrder);

      const order = await authAdapter.cancelOrder('order-123');

      expect(order.status).toBe('open');
    });

    test('should cancel order by client order ID', async () => {
      const mockOrder = {
        order_id: 'order-456',
        client_order_id: 'my-client-id',
        market: 'BTC_USDC_PERP',
        status: 'Cancelled',
        side: 'Bid',
        type: 'Limit',
        price: '50000',
        size: '0.1',
        filled_size: '0',
        time_in_force: 'GTC',
        created_at: Date.now(),
      };

      authMockClient.delete.mockResolvedValue(mockOrder);

      const order = await authAdapter.cancelOrder('my-client-id', 'BTC/USDC:USDC');

      expect(order).toBeDefined();
    });

    test('should throw on cancel order not found', async () => {
      authMockClient.delete.mockRejectedValue({ code: 1003 });

      await expect(authAdapter.cancelOrder('nonexistent-order')).rejects.toThrow();
    });
  });

  describe('fetchOrder', () => {
    test('should fetch order by order ID', async () => {
      const mockOrder = {
        order_id: 'order-123',
        market: 'BTC_USDC_PERP',
        status: 'Filled',
        side: 'Bid',
        type: 'Limit',
        price: '50000',
        size: '0.1',
        filled_size: '0.1',
        time_in_force: 'GTC',
        created_at: Date.now(),
      };

      authMockClient.get.mockResolvedValue(mockOrder);

      const order = await authAdapter.fetchOrder('order-123');

      expect(order).toBeDefined();
      expect(order.id).toBe('order-123');
    });

    test('should throw when order not found', async () => {
      authMockClient.get.mockResolvedValue(null);

      await expect(authAdapter.fetchOrder('nonexistent-order')).rejects.toThrow();
    });
  });

  describe('setLeverage', () => {
    test('should set leverage for symbol', async () => {
      authMockClient.post.mockResolvedValue({ leverage: '10' });

      await authAdapter.setLeverage('BTC/USDC:USDC', 10);

      expect(authMockClient.post).toHaveBeenCalledWith(
        expect.stringContaining('/leverage'),
        expect.any(Object)
      );
    });

    test('should validate leverage range', async () => {
      authMockClient.post.mockRejectedValue({ code: 1001, message: 'Invalid leverage' });

      await expect(authAdapter.setLeverage('BTC/USDC:USDC', 0)).rejects.toThrow();
      await expect(authAdapter.setLeverage('BTC/USDC:USDC', 101)).rejects.toThrow();
    });
  });

  describe('symbol conversion edge cases', () => {
    test('should handle various symbol formats', () => {
      const testCases = [
        ['BTC/USDC:USDC', 'BTC_USDC_PERP'],
        ['ETH/USDC:USDC', 'ETH_USDC_PERP'],
        ['SOL/USDC:USDC', 'SOL_USDC_PERP'],
      ];

      testCases.forEach(([unified, exchange]) => {
        const result = (adapter as any).symbolToExchange(unified);
        expect(result).toBe(exchange);

        const reverse = (adapter as any).symbolFromExchange(exchange);
        expect(reverse).toBe(unified);
      });
    });
  });

  describe('error handling', () => {
    test('should handle rate limit error', async () => {
      mockHttpClient.get.mockRejectedValue({ code: 4001 });

      await expect(adapter.fetchMarkets()).rejects.toMatchObject({
        code: 'RATE_LIMIT_EXCEEDED',
      });
    });

    test('should handle exchange unavailable error', async () => {
      mockHttpClient.get.mockRejectedValue({ code: 5001 });

      await expect(adapter.fetchMarkets()).rejects.toMatchObject({
        code: 'EXCHANGE_UNAVAILABLE',
      });
    });

    test('should handle invalid signature error', async () => {
      authMockClient.get.mockRejectedValue({ code: 2001 });

      await expect(authAdapter.fetchPositions()).rejects.toMatchObject({
        code: 'INVALID_SIGNATURE',
      });
    });

    test('should handle expired auth error', async () => {
      authMockClient.get.mockRejectedValue({ code: 2002 });

      await expect(authAdapter.fetchPositions()).rejects.toMatchObject({
        code: 'EXPIRED_AUTH',
      });
    });

    test('should handle insufficient margin error', async () => {
      authMockClient.post.mockRejectedValue({ code: 1002 });

      await expect(
        authAdapter.createOrder({
          symbol: 'BTC/USDC:USDC',
          side: 'buy',
          type: 'market',
          amount: 100,
        })
      ).rejects.toMatchObject({
        code: 'INSUFFICIENT_MARGIN',
      });
    });
  });

  describe('normalization edge cases', () => {
    test('should normalize empty market list', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(0);
    });

    test('should normalize empty positions list', async () => {
      authMockClient.get.mockResolvedValue({ positions: [] });

      const positions = await authAdapter.fetchPositions();

      expect(positions).toHaveLength(0);
    });

    test('should normalize empty balance', async () => {
      authMockClient.get.mockResolvedValue({});

      const balances = await authAdapter.fetchBalance();

      expect(balances).toHaveLength(0);
    });

    test('should normalize partially filled order', async () => {
      const mockOrder = {
        order_id: 'order-partial',
        market: 'BTC_USDC_PERP',
        status: 'PartiallyFilled',
        side: 'Bid',
        type: 'Limit',
        price: '50000',
        size: '1.0',
        filled_size: '0.5',
        time_in_force: 'GTC',
        created_at: Date.now(),
      };

      authMockClient.get.mockResolvedValue(mockOrder);

      const order = await authAdapter.fetchOrder('order-partial');

      expect(order.filled).toBe(0.5);
      expect(order.remaining).toBe(0.5);
    });
  });

  describe('pagination and filtering', () => {
    test('should fetch trades with limit', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      await adapter.fetchTrades('BTC/USDC:USDC', { limit: 100 });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=100'),
        expect.any(Object)
      );
    });

    test('should fetch trades since timestamp', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      const since = Date.now() - 3600000;
      await adapter.fetchTrades('BTC/USDC:USDC', { since });

      expect(mockHttpClient.get).toHaveBeenCalled();
    });

    test('should filter positions by symbols', async () => {
      const mockPositions = {
        positions: [
          { market: 'BTC_USDC_PERP', side: 'LONG', size: '1', entry_price: '50000', unrealized_pnl: '100', liquidation_price: '45000', leverage: '10' },
          { market: 'ETH_USDC_PERP', side: 'SHORT', size: '10', entry_price: '3000', unrealized_pnl: '-50', liquidation_price: '3500', leverage: '5' },
          { market: 'SOL_USDC_PERP', side: 'LONG', size: '100', entry_price: '100', unrealized_pnl: '50', liquidation_price: '90', leverage: '3' },
        ],
      };

      authMockClient.get.mockResolvedValue(mockPositions);

      const positions = await authAdapter.fetchPositions(['BTC/USDC:USDC', 'ETH/USDC:USDC']);

      expect(positions).toHaveLength(2);
    });
  });

  describe('HTTP client configuration', () => {
    test('should use testnet URL when testnet is true', () => {
      const testnetAdapter = new BackpackAdapter({ testnet: true });

      expect((testnetAdapter as any).baseUrl).toContain('testnet');
    });

    test('should use mainnet URL when testnet is false', () => {
      const mainnetAdapter = new BackpackAdapter({ testnet: false });

      expect((mainnetAdapter as any).baseUrl).not.toContain('testnet');
    });

    test('should use custom timeout', () => {
      const customAdapter = new BackpackAdapter({ timeout: 60000 });

      expect((customAdapter as any).httpClient).toBeDefined();
    });
  });
});

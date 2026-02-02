/**
 * dYdX v4 Adapter Unit Tests
 */

import { DydxAdapter, type DydxConfig } from '../../src/adapters/dydx/DydxAdapter.js';

describe('DydxAdapter', () => {
  describe('constructor', () => {
    test('creates adapter with default config', () => {
      const adapter = new DydxAdapter();

      expect(adapter.id).toBe('dydx');
      expect(adapter.name).toBe('dYdX v4');
      expect(adapter.isReady).toBe(false);
    });

    test('creates adapter with testnet config', () => {
      const adapter = new DydxAdapter({ testnet: true });

      expect(adapter.id).toBe('dydx');
    });

    test('creates adapter with custom subaccount number', () => {
      const adapter = new DydxAdapter({
        subaccountNumber: 5,
      });

      expect(adapter.getSubaccountNumber()).toBe(5);
    });

    test('defaults to subaccount 0', () => {
      const adapter = new DydxAdapter();

      expect(adapter.getSubaccountNumber()).toBe(0);
    });
  });

  describe('has capabilities', () => {
    let adapter: DydxAdapter;

    beforeAll(() => {
      adapter = new DydxAdapter();
    });

    test('supports market data', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.fetchOHLCV).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.fetchFundingRateHistory).toBe(true);
    });

    test('supports trading', () => {
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.cancelAllOrders).toBe(true);
    });

    test('has correct batch order support', () => {
      expect(adapter.has.createBatchOrders).toBe(false);
      expect(adapter.has.cancelBatchOrders).toBe('emulated');
    });

    test('supports account data', () => {
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.fetchOrderHistory).toBe(true);
      expect(adapter.has.fetchMyTrades).toBe(true);
    });

    test('does not support leverage/margin mode changes', () => {
      // dYdX v4 uses cross-margin without per-symbol leverage
      expect(adapter.has.setLeverage).toBe(false);
      expect(adapter.has.setMarginMode).toBe(false);
    });

    test('supports WebSocket streams', () => {
      expect(adapter.has.watchOrderBook).toBe(true);
      expect(adapter.has.watchTrades).toBe(true);
      expect(adapter.has.watchTicker).toBe(true);
      expect(adapter.has.watchPositions).toBe(true);
      expect(adapter.has.watchOrders).toBe(true);
      expect(adapter.has.watchBalance).toBe(true);
      expect(adapter.has.watchOHLCV).toBe(true);
    });

    test('does not support deposits/withdrawals', () => {
      expect(adapter.has.fetchDeposits).toBe(false);
      expect(adapter.has.fetchWithdrawals).toBe(false);
    });
  });

  describe('symbol conversion', () => {
    let adapter: DydxAdapter;

    beforeAll(() => {
      adapter = new DydxAdapter();
    });

    test('converts unified symbol to dYdX format', () => {
      // Access protected method through any
      const symbolToExchange = (adapter as any).symbolToExchange.bind(adapter);

      expect(symbolToExchange('BTC/USD:USD')).toBe('BTC-USD');
      expect(symbolToExchange('ETH/USD:USD')).toBe('ETH-USD');
      expect(symbolToExchange('SOL/USD:USD')).toBe('SOL-USD');
    });

    test('converts dYdX symbol to unified format', () => {
      const symbolFromExchange = (adapter as any).symbolFromExchange.bind(adapter);

      expect(symbolFromExchange('BTC-USD')).toBe('BTC/USD:USD');
      expect(symbolFromExchange('ETH-USD')).toBe('ETH/USD:USD');
      expect(symbolFromExchange('SOL-USD')).toBe('SOL/USD:USD');
    });
  });

  describe('disconnect', () => {
    test('cleans up resources on disconnect', async () => {
      const adapter = new DydxAdapter();

      await adapter.disconnect();

      expect(adapter.isDisconnected()).toBe(true);
    });
  });

  describe('setLeverage', () => {
    test('throws error because dYdX v4 uses cross-margin', async () => {
      const adapter = new DydxAdapter();

      await expect(adapter.setLeverage('BTC/USD:USD', 10)).rejects.toThrow('cross-margin');
    });
  });

  describe('authentication requirement', () => {
    let adapter: DydxAdapter;

    beforeAll(() => {
      adapter = new DydxAdapter();
    });

    test('fetchPositions requires authentication', async () => {
      // Without authentication, it should fail
      // Note: This test may need adjustment based on actual implementation
      await expect(adapter.fetchPositions()).rejects.toThrow();
    });

    test('fetchBalance requires authentication', async () => {
      await expect(adapter.fetchBalance()).rejects.toThrow();
    });

    test('fetchOrderHistory requires authentication', async () => {
      await expect(adapter.fetchOrderHistory()).rejects.toThrow();
    });

    test('fetchMyTrades requires authentication', async () => {
      await expect(adapter.fetchMyTrades()).rejects.toThrow();
    });

    test('createOrder requires authentication', async () => {
      await expect(adapter.createOrder({
        symbol: 'BTC/USD:USD',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
      })).rejects.toThrow();
    });

    test('cancelOrder requires authentication', async () => {
      await expect(adapter.cancelOrder('order-123', 'BTC/USD:USD')).rejects.toThrow();
    });

    test('cancelAllOrders requires authentication', async () => {
      await expect(adapter.cancelAllOrders()).rejects.toThrow();
    });
  });

  describe('getAddress', () => {
    test('returns undefined when not authenticated', async () => {
      const adapter = new DydxAdapter();

      const address = await adapter.getAddress();

      expect(address).toBeUndefined();
    });

    test('returns address when authenticated', async () => {
      const adapter = new DydxAdapter({
        mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      });

      const address = await adapter.getAddress();

      expect(address).toBeDefined();
      expect(address?.startsWith('dydx')).toBe(true);
    });
  });

  describe('rate limiter', () => {
    test('initializes rate limiter with correct config', () => {
      const adapter = new DydxAdapter({
        rateLimit: {
          maxRequests: 50,
          windowMs: 30000,
        },
      });

      // Rate limiter is protected, so we just verify adapter created successfully
      expect(adapter).toBeInstanceOf(DydxAdapter);
    });
  });
});

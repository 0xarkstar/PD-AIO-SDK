/**
 * BaseAdapter Error Standardization Tests
 *
 * Validates that BaseAdapter methods throw typed errors (NotSupportedError, PerpDEXError)
 * instead of generic Error instances.
 */

import { BaseAdapter } from '../../src/adapters/base/BaseAdapter.js';
import { NotSupportedError, PerpDEXError } from '../../src/types/errors.js';
import type {
  FeatureMap,
  Market,
  Ticker,
  OrderBook,
  Trade,
  FundingRate,
  Position,
  Balance,
  Order,
  OrderRequest,
} from '../../src/types/index.js';

/**
 * Concrete adapter for testing base class behavior.
 * Declares support for features but does NOT implement them,
 * triggering the "must be implemented by subclass" code paths.
 */
class TestAdapter extends BaseAdapter {
  readonly id = 'test-adapter';
  readonly name = 'Test Adapter';
  readonly has: Partial<FeatureMap> = {};

  constructor(features: Partial<FeatureMap> = {}) {
    super({});
    (this as any).has = features;
  }

  async initialize(): Promise<void> {
    this._isReady = true;
  }

  async fetchMarkets(): Promise<Market[]> {
    return [];
  }

  async fetchTicker(): Promise<Ticker> {
    throw new Error('Not needed for these tests');
  }

  async fetchOrderBook(): Promise<OrderBook> {
    throw new Error('Not needed for these tests');
  }

  async fetchTrades(): Promise<Trade[]> {
    return [];
  }

  async fetchFundingRate(): Promise<FundingRate> {
    throw new Error('Not needed for these tests');
  }

  async fetchFundingRateHistory(): Promise<FundingRate[]> {
    return [];
  }

  async createOrder(): Promise<Order> {
    throw new Error('Not needed for these tests');
  }

  async cancelOrder(): Promise<Order> {
    throw new Error('Not needed for these tests');
  }

  async cancelAllOrders(): Promise<Order[]> {
    return [];
  }

  async fetchOrderHistory(): Promise<Order[]> {
    return [];
  }

  async fetchMyTrades(): Promise<Trade[]> {
    return [];
  }

  async fetchPositions(): Promise<Position[]> {
    return [];
  }

  async fetchBalance(): Promise<Balance[]> {
    return [];
  }

  async setLeverage(): Promise<void> {}

  protected symbolToExchange(symbol: string): string {
    return symbol;
  }

  protected symbolFromExchange(symbol: string): string {
    return symbol;
  }
}

describe('BaseAdapter Error Standardization', () => {
  describe('NOT_SUPPORTED errors (feature disabled)', () => {
    let adapter: TestAdapter;

    beforeEach(async () => {
      // No features enabled — triggers "does not support" path
      adapter = new TestAdapter({});
      await adapter.initialize();
    });

    afterEach(async () => {
      await adapter.disconnect();
    });

    const unsupportedMethods: Array<{
      method: string;
      call: (a: TestAdapter) => Promise<unknown>;
    }> = [
      { method: 'fetchOHLCV', call: (a) => a.fetchOHLCV('BTC/USDT', '1h') },
      { method: 'fetchCurrencies', call: (a) => a.fetchCurrencies() },
      { method: 'fetchTime', call: (a) => a.fetchTime() },
      { method: 'fetchDeposits', call: (a) => a.fetchDeposits() },
      { method: 'fetchWithdrawals', call: (a) => a.fetchWithdrawals() },
      { method: 'fetchLedger', call: (a) => a.fetchLedger() },
      { method: 'fetchFundingHistory', call: (a) => a.fetchFundingHistory() },
      { method: 'editOrder', call: (a) => a.editOrder('id', 'SYM', 'limit', 'buy') },
      { method: 'fetchOrder', call: (a) => a.fetchOrder('id') },
      { method: 'fetchOpenOrders', call: (a) => a.fetchOpenOrders() },
      { method: 'fetchClosedOrders', call: (a) => a.fetchClosedOrders() },
      { method: 'fetchUserFees', call: (a) => a.fetchUserFees() },
      { method: 'fetchPortfolio', call: (a) => a.fetchPortfolio() },
      { method: 'fetchRateLimitStatus', call: (a) => a.fetchRateLimitStatus() },
    ];

    test.each(unsupportedMethods)(
      '$method throws NotSupportedError with NOT_SUPPORTED code when feature is disabled',
      async ({ call }) => {
        try {
          await call(adapter);
          fail('Expected NotSupportedError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(NotSupportedError);
          expect((error as NotSupportedError).code).toBe('NOT_SUPPORTED');
          expect((error as NotSupportedError).exchange).toBe('test-adapter');
        }
      }
    );
  });

  describe('NOT_IMPLEMENTED errors (feature enabled but not overridden)', () => {
    let adapter: TestAdapter;

    beforeEach(async () => {
      // Enable features that have the "must be implemented" fallthrough
      adapter = new TestAdapter({
        fetchOHLCV: true,
        fetchTickers: true,
        fetchCurrencies: true,
        fetchStatus: true,
        fetchTime: true,
        fetchDeposits: true,
        fetchWithdrawals: true,
        fetchLedger: true,
        fetchFundingHistory: true,
        editOrder: true,
        fetchOrder: true,
        fetchOpenOrders: true,
        fetchClosedOrders: true,
        setMarginMode: true,
        fetchUserFees: true,
        fetchPortfolio: true,
        fetchRateLimitStatus: true,
        createBatchOrders: true,
        cancelBatchOrders: true,
      });
      await adapter.initialize();
    });

    afterEach(async () => {
      await adapter.disconnect();
    });

    const notImplementedMethods: Array<{
      method: string;
      call: (a: TestAdapter) => Promise<unknown>;
    }> = [
      { method: 'fetchOHLCV', call: (a) => a.fetchOHLCV('BTC/USDT', '1h') },
      { method: 'fetchTickers', call: (a) => a.fetchTickers() },
      { method: 'fetchCurrencies', call: (a) => a.fetchCurrencies() },
      { method: 'fetchStatus', call: (a) => a.fetchStatus() },
      { method: 'fetchTime', call: (a) => a.fetchTime() },
      { method: 'fetchDeposits', call: (a) => a.fetchDeposits() },
      { method: 'fetchWithdrawals', call: (a) => a.fetchWithdrawals() },
      { method: 'fetchLedger', call: (a) => a.fetchLedger() },
      { method: 'fetchFundingHistory', call: (a) => a.fetchFundingHistory() },
      { method: 'editOrder', call: (a) => a.editOrder('id', 'SYM', 'limit', 'buy') },
      { method: 'fetchOrder', call: (a) => a.fetchOrder('id') },
      { method: 'fetchOpenOrders', call: (a) => a.fetchOpenOrders() },
      { method: 'fetchClosedOrders', call: (a) => a.fetchClosedOrders() },
      { method: 'setMarginMode', call: (a) => a.setMarginMode('SYM', 'cross') },
      { method: 'fetchUserFees', call: (a) => a.fetchUserFees() },
      { method: 'fetchPortfolio', call: (a) => a.fetchPortfolio() },
      { method: 'fetchRateLimitStatus', call: (a) => a.fetchRateLimitStatus() },
      { method: 'createBatchOrders', call: (a) => a.createBatchOrders([{ symbol: 'BTC/USDT', side: 'buy', type: 'limit', amount: 1, price: 100 }]) },
      { method: 'cancelBatchOrders', call: (a) => a.cancelBatchOrders(['id1']) },
    ];

    test.each(notImplementedMethods)(
      '$method throws NotSupportedError with NOT_IMPLEMENTED code when feature enabled but not overridden',
      async ({ call }) => {
        try {
          await call(adapter);
          fail('Expected NotSupportedError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(NotSupportedError);
          expect((error as NotSupportedError).code).toBe('NOT_IMPLEMENTED');
          expect((error as NotSupportedError).exchange).toBe('test-adapter');
          expect((error as NotSupportedError).message).toContain('must be implemented by subclass');
        }
      }
    );
  });

  describe('ensureInitialized throws PerpDEXError', () => {
    test('throws PerpDEXError with NOT_INITIALIZED code when adapter not initialized', async () => {
      // Adapter with features that use ensureInitialized() — use a subclass
      // that exposes the protected method
      class ExposedAdapter extends TestAdapter {
        public callEnsureInitialized(): void {
          this.ensureInitialized();
        }
      }

      const adapter = new ExposedAdapter({});
      // Do NOT call initialize()

      try {
        adapter.callEnsureInitialized();
        fail('Expected PerpDEXError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PerpDEXError);
        expect((error as PerpDEXError).code).toBe('NOT_INITIALIZED');
        expect((error as PerpDEXError).exchange).toBe('test-adapter');
        expect((error as PerpDEXError).message).toContain('not initialized');
      }

      await adapter.disconnect();
    });

    test('does not throw when adapter is initialized', async () => {
      class ExposedAdapter extends TestAdapter {
        public callEnsureInitialized(): void {
          this.ensureInitialized();
        }
      }

      const adapter = new ExposedAdapter({});
      await adapter.initialize();

      expect(() => adapter.callEnsureInitialized()).not.toThrow();

      await adapter.disconnect();
    });
  });

  describe('Batch operation errors', () => {
    test('createBatchOrders throws PerpDEXError with BATCH_FAILED when all orders fail', async () => {
      class FailingAdapter extends TestAdapter {
        async createOrder(): Promise<Order> {
          throw new Error('Order creation failed');
        }
      }

      const adapter = new FailingAdapter({});
      await adapter.initialize();

      const requests: OrderRequest[] = [
        { symbol: 'BTC/USDT', side: 'buy', type: 'limit', amount: 1, price: 100 },
        { symbol: 'ETH/USDT', side: 'buy', type: 'limit', amount: 1, price: 100 },
      ];

      try {
        await adapter.createBatchOrders(requests);
        fail('Expected PerpDEXError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PerpDEXError);
        expect((error as PerpDEXError).code).toBe('BATCH_FAILED');
        expect((error as PerpDEXError).exchange).toBe('test-adapter');
        expect((error as PerpDEXError).message).toContain('All batch order creations failed');
      }

      await adapter.disconnect();
    });

    test('cancelBatchOrders throws PerpDEXError with BATCH_FAILED when all cancellations fail', async () => {
      class FailingAdapter extends TestAdapter {
        async cancelOrder(): Promise<Order> {
          throw new Error('Cancel failed');
        }
      }

      const adapter = new FailingAdapter({});
      await adapter.initialize();

      try {
        await adapter.cancelBatchOrders(['id1', 'id2']);
        fail('Expected PerpDEXError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PerpDEXError);
        expect((error as PerpDEXError).code).toBe('BATCH_FAILED');
        expect((error as PerpDEXError).exchange).toBe('test-adapter');
        expect((error as PerpDEXError).message).toContain('All batch order cancellations failed');
      }

      await adapter.disconnect();
    });
  });

  describe('WebSocket stream NOT_SUPPORTED errors', () => {
    let adapter: TestAdapter;

    beforeEach(async () => {
      adapter = new TestAdapter({});
      await adapter.initialize();
    });

    afterEach(async () => {
      await adapter.disconnect();
    });

    const wsMethodsDisabled: Array<{
      method: string;
      call: (a: TestAdapter) => AsyncGenerator<unknown>;
    }> = [
      { method: 'watchOrderBook', call: (a) => a.watchOrderBook('BTC/USDT') },
      { method: 'watchTrades', call: (a) => a.watchTrades('BTC/USDT') },
      { method: 'watchTicker', call: (a) => a.watchTicker('BTC/USDT') },
      { method: 'watchTickers', call: (a) => a.watchTickers() },
      { method: 'watchPositions', call: (a) => a.watchPositions() },
      { method: 'watchOrders', call: (a) => a.watchOrders() },
      { method: 'watchBalance', call: (a) => a.watchBalance() },
      { method: 'watchFundingRate', call: (a) => a.watchFundingRate('BTC/USDT') },
      { method: 'watchOHLCV', call: (a) => a.watchOHLCV('BTC/USDT', '1h') },
      { method: 'watchMyTrades', call: (a) => a.watchMyTrades() },
    ];

    test.each(wsMethodsDisabled)(
      '$method throws NotSupportedError when feature not supported',
      async ({ call }) => {
        const gen = call(adapter);
        try {
          await gen.next();
          fail('Expected NotSupportedError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(NotSupportedError);
          expect((error as NotSupportedError).code).toBe('NOT_SUPPORTED');
          expect((error as NotSupportedError).exchange).toBe('test-adapter');
        }
      }
    );
  });

  describe('WebSocket stream NOT_IMPLEMENTED errors', () => {
    let adapter: TestAdapter;

    beforeEach(async () => {
      adapter = new TestAdapter({
        watchOrderBook: true,
        watchTrades: true,
        watchTicker: true,
        watchTickers: true,
        watchPositions: true,
        watchOrders: true,
        watchBalance: true,
        watchFundingRate: true,
        watchOHLCV: true,
        watchMyTrades: true,
      });
      await adapter.initialize();
    });

    afterEach(async () => {
      await adapter.disconnect();
    });

    const wsMethodsEnabled: Array<{
      method: string;
      call: (a: TestAdapter) => AsyncGenerator<unknown>;
    }> = [
      { method: 'watchOrderBook', call: (a) => a.watchOrderBook('BTC/USDT') },
      { method: 'watchTrades', call: (a) => a.watchTrades('BTC/USDT') },
      { method: 'watchTicker', call: (a) => a.watchTicker('BTC/USDT') },
      { method: 'watchTickers', call: (a) => a.watchTickers() },
      { method: 'watchPositions', call: (a) => a.watchPositions() },
      { method: 'watchOrders', call: (a) => a.watchOrders() },
      { method: 'watchBalance', call: (a) => a.watchBalance() },
      { method: 'watchFundingRate', call: (a) => a.watchFundingRate('BTC/USDT') },
      { method: 'watchOHLCV', call: (a) => a.watchOHLCV('BTC/USDT', '1h') },
      { method: 'watchMyTrades', call: (a) => a.watchMyTrades() },
    ];

    test.each(wsMethodsEnabled)(
      '$method throws NotSupportedError with NOT_IMPLEMENTED when feature enabled but not overridden',
      async ({ call }) => {
        const gen = call(adapter);
        try {
          await gen.next();
          fail('Expected NotSupportedError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(NotSupportedError);
          expect((error as NotSupportedError).code).toBe('NOT_IMPLEMENTED');
          expect((error as NotSupportedError).exchange).toBe('test-adapter');
          expect((error as NotSupportedError).message).toContain('must be implemented by subclass');
        }
      }
    );
  });

  describe('setMarginMode NOT_SUPPORTED for emulated mode', () => {
    test('throws NotSupportedError when setMarginMode is emulated', async () => {
      const adapter = new TestAdapter({ setMarginMode: 'emulated' });
      await adapter.initialize();

      await expect(adapter.setMarginMode('BTC/USDT', 'cross')).rejects.toThrow(NotSupportedError);

      await adapter.disconnect();
    });
  });
});

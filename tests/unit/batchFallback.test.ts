/**
 * Batch Operation Fallback Unit Tests
 *
 * Tests automatic fallback to sequential execution when native batch operations
 * are not supported by the exchange.
 */

import { BaseAdapter } from '../../src/adapters/base/BaseAdapter.js';
import type { Market, MarketParams, Order, OrderRequest } from '../../src/types/common.js';

// Mock adapter WITHOUT batch support
class MockAdapterNoBatch extends BaseAdapter {
  readonly id = 'mock-no-batch';
  readonly name = 'Mock Exchange (No Batch)';
  readonly has = {
    createBatchOrders: false, // Explicitly no batch support
    cancelBatchOrders: false,
  };

  private orderIdCounter = 1;
  private orders: Map<string, Order> = new Map();

  async initialize(): Promise<void> {
    this._isReady = true;
  }

  async disconnect(): Promise<void> {
    await super.disconnect();
  }

  async createOrder(request: OrderRequest): Promise<Order> {
    const orderId = `order-${this.orderIdCounter++}`;
    const order: Order = {
      id: orderId,
      clientOrderId: request.clientOrderId,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      lastTradeTimestamp: undefined,
      symbol: request.symbol,
      type: request.type,
      timeInForce: request.timeInForce,
      postOnly: request.postOnly,
      reduceOnly: request.reduceOnly,
      side: request.side,
      price: request.price,
      amount: request.amount,
      cost: undefined,
      average: undefined,
      filled: 0,
      remaining: request.amount,
      status: 'open',
      fee: undefined,
      trades: [],
    };

    this.orders.set(orderId, order);
    return order;
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const canceled: Order = {
      ...order,
      status: 'canceled',
      remaining: 0,
    };

    this.orders.set(orderId, canceled);
    return canceled;
  }

  async cancelAllOrders() {
    return [];
  }

  async fetchMarkets(): Promise<Market[]> {
    return [];
  }

  async fetchTicker() {
    throw new Error('Not implemented');
  }

  async fetchOrderBook() {
    throw new Error('Not implemented');
  }

  async fetchTrades() {
    return [];
  }

  async fetchFundingRate() {
    throw new Error('Not implemented');
  }

  async fetchFundingRateHistory() {
    return [];
  }

  async fetchPositions() {
    return [];
  }

  async fetchBalance() {
    return [];
  }

  async setLeverage() {}

  protected symbolToExchange(symbol: string) {
    return symbol;
  }

  protected symbolFromExchange(symbol: string) {
    return symbol;
  }
}

// Mock adapter WITH batch support (but not implemented)
class MockAdapterWithBatch extends MockAdapterNoBatch {
  readonly id = 'mock-with-batch';
  readonly name = 'Mock Exchange (With Batch)';
  readonly has = {
    createBatchOrders: true, // Claims batch support
    cancelBatchOrders: true,
  };
}

describe('Batch Operation Fallbacks', () => {
  describe('createBatchOrders', () => {
    let adapter: MockAdapterNoBatch;

    beforeEach(async () => {
      adapter = new MockAdapterNoBatch();
      await adapter.initialize();
    });

    afterEach(async () => {
      await adapter.disconnect();
    });

    test('falls back to sequential execution when batch not supported', async () => {
      const requests: OrderRequest[] = [
        { symbol: 'BTC/USDT:USDT', side: 'buy', type: 'limit', amount: 0.1, price: 50000 },
        { symbol: 'ETH/USDT:USDT', side: 'buy', type: 'limit', amount: 1.0, price: 3000 },
        { symbol: 'SOL/USDT:USDT', side: 'sell', type: 'limit', amount: 10, price: 100 },
      ];

      const orders = await adapter.createBatchOrders(requests);

      expect(orders).toHaveLength(3);
      expect(orders[0].symbol).toBe('BTC/USDT:USDT');
      expect(orders[0].status).toBe('open');
      expect(orders[1].symbol).toBe('ETH/USDT:USDT');
      expect(orders[2].symbol).toBe('SOL/USDT:USDT');
    });

    test('creates orders sequentially in correct order', async () => {
      const requests: OrderRequest[] = [
        { symbol: 'A/USDT:USDT', side: 'buy', type: 'limit', amount: 1, price: 100 },
        { symbol: 'B/USDT:USDT', side: 'buy', type: 'limit', amount: 2, price: 200 },
        { symbol: 'C/USDT:USDT', side: 'buy', type: 'limit', amount: 3, price: 300 },
      ];

      const orders = await adapter.createBatchOrders(requests);

      expect(orders[0].symbol).toBe('A/USDT:USDT');
      expect(orders[0].amount).toBe(1);
      expect(orders[1].symbol).toBe('B/USDT:USDT');
      expect(orders[1].amount).toBe(2);
      expect(orders[2].symbol).toBe('C/USDT:USDT');
      expect(orders[2].amount).toBe(3);
    });

    test('continues execution despite individual order failures', async () => {
      // Create a mock that fails on the second order
      class FailingAdapter extends MockAdapterNoBatch {
        private callCount = 0;

        async createOrder(request: OrderRequest): Promise<Order> {
          this.callCount++;
          if (this.callCount === 2) {
            throw new Error('Simulated order failure');
          }
          return super.createOrder(request);
        }
      }

      const failingAdapter = new FailingAdapter();
      await failingAdapter.initialize();

      const requests: OrderRequest[] = [
        { symbol: 'BTC/USDT:USDT', side: 'buy', type: 'limit', amount: 0.1, price: 50000 },
        { symbol: 'ETH/USDT:USDT', side: 'buy', type: 'limit', amount: 1.0, price: 3000 }, // This will fail
        { symbol: 'SOL/USDT:USDT', side: 'sell', type: 'limit', amount: 10, price: 100 },
      ];

      const orders = await failingAdapter.createBatchOrders(requests);

      // Should have 2 successful orders (1st and 3rd)
      expect(orders).toHaveLength(2);
      expect(orders[0].symbol).toBe('BTC/USDT:USDT');
      expect(orders[1].symbol).toBe('SOL/USDT:USDT');

      await failingAdapter.disconnect();
    });

    test('throws error if all orders fail', async () => {
      class AllFailingAdapter extends MockAdapterNoBatch {
        async createOrder(): Promise<Order> {
          throw new Error('All orders fail');
        }
      }

      const failingAdapter = new AllFailingAdapter();
      await failingAdapter.initialize();

      const requests: OrderRequest[] = [
        { symbol: 'BTC/USDT:USDT', side: 'buy', type: 'limit', amount: 0.1, price: 50000 },
        { symbol: 'ETH/USDT:USDT', side: 'buy', type: 'limit', amount: 1.0, price: 3000 },
      ];

      await expect(failingAdapter.createBatchOrders(requests)).rejects.toThrow(
        'All batch order creations failed'
      );

      await failingAdapter.disconnect();
    });

    test('handles empty batch gracefully', async () => {
      const orders = await adapter.createBatchOrders([]);
      expect(orders).toHaveLength(0);
    });

    test('handles single order batch', async () => {
      const requests: OrderRequest[] = [
        { symbol: 'BTC/USDT:USDT', side: 'buy', type: 'limit', amount: 0.1, price: 50000 },
      ];

      const orders = await adapter.createBatchOrders(requests);

      expect(orders).toHaveLength(1);
      expect(orders[0].symbol).toBe('BTC/USDT:USDT');
    });
  });

  describe('cancelBatchOrders', () => {
    let adapter: MockAdapterNoBatch;

    beforeEach(async () => {
      adapter = new MockAdapterNoBatch();
      await adapter.initialize();

      // Create some orders first
      await adapter.createOrder({
        symbol: 'BTC/USDT:USDT',
        side: 'buy',
        type: 'limit',
        amount: 0.1,
        price: 50000,
      });
      await adapter.createOrder({
        symbol: 'ETH/USDT:USDT',
        side: 'buy',
        type: 'limit',
        amount: 1.0,
        price: 3000,
      });
      await adapter.createOrder({
        symbol: 'SOL/USDT:USDT',
        side: 'sell',
        type: 'limit',
        amount: 10,
        price: 100,
      });
    });

    afterEach(async () => {
      await adapter.disconnect();
    });

    test('falls back to sequential cancellation when batch not supported', async () => {
      const orderIds = ['order-1', 'order-2', 'order-3'];

      const canceled = await adapter.cancelBatchOrders(orderIds);

      expect(canceled).toHaveLength(3);
      expect(canceled[0].id).toBe('order-1');
      expect(canceled[0].status).toBe('canceled');
      expect(canceled[1].id).toBe('order-2');
      expect(canceled[2].id).toBe('order-3');
    });

    test('continues execution despite individual cancellation failures', async () => {
      // Try to cancel some orders that exist and some that don't
      const orderIds = ['order-1', 'non-existent', 'order-2'];

      const canceled = await adapter.cancelBatchOrders(orderIds);

      // Should have 2 successful cancellations
      expect(canceled).toHaveLength(2);
      expect(canceled[0].id).toBe('order-1');
      expect(canceled[1].id).toBe('order-2');
    });

    test('throws error if all cancellations fail', async () => {
      const orderIds = ['non-existent-1', 'non-existent-2'];

      await expect(adapter.cancelBatchOrders(orderIds)).rejects.toThrow(
        'All batch order cancellations failed'
      );
    });

    test('handles empty batch gracefully', async () => {
      const canceled = await adapter.cancelBatchOrders([]);
      expect(canceled).toHaveLength(0);
    });

    test('handles single order cancellation', async () => {
      const canceled = await adapter.cancelBatchOrders(['order-1']);

      expect(canceled).toHaveLength(1);
      expect(canceled[0].id).toBe('order-1');
      expect(canceled[0].status).toBe('canceled');
    });

    test('accepts optional symbol parameter', async () => {
      const canceled = await adapter.cancelBatchOrders(['order-1', 'order-2'], 'BTC/USDT:USDT');

      expect(canceled).toHaveLength(2);
    });
  });

  describe('Native batch support behavior', () => {
    test('throws error when native batch is supported but not implemented', async () => {
      const adapterWithBatch = new MockAdapterWithBatch();
      await adapterWithBatch.initialize();

      const requests: OrderRequest[] = [
        { symbol: 'BTC/USDT:USDT', side: 'buy', type: 'limit', amount: 0.1, price: 50000 },
      ];

      await expect(adapterWithBatch.createBatchOrders(requests)).rejects.toThrow(
        'createBatchOrders must be implemented by subclass'
      );

      await adapterWithBatch.disconnect();
    });

    test('cancelBatchOrders throws when native batch is supported but not implemented', async () => {
      const adapterWithBatch = new MockAdapterWithBatch();
      await adapterWithBatch.initialize();

      await expect(adapterWithBatch.cancelBatchOrders(['order-1'])).rejects.toThrow(
        'cancelBatchOrders must be implemented by subclass'
      );

      await adapterWithBatch.disconnect();
    });
  });

  describe('Performance characteristics', () => {
    test('sequential fallback executes in order', async () => {
      const adapter = new MockAdapterNoBatch();
      await adapter.initialize();

      const executionOrder: string[] = [];

      class TrackedAdapter extends MockAdapterNoBatch {
        async createOrder(request: OrderRequest): Promise<Order> {
          executionOrder.push(request.symbol);
          return super.createOrder(request);
        }
      }

      const tracked = new TrackedAdapter();
      await tracked.initialize();

      const requests: OrderRequest[] = [
        { symbol: 'A/USDT:USDT', side: 'buy', type: 'limit', amount: 1, price: 100 },
        { symbol: 'B/USDT:USDT', side: 'buy', type: 'limit', amount: 1, price: 100 },
        { symbol: 'C/USDT:USDT', side: 'buy', type: 'limit', amount: 1, price: 100 },
      ];

      await tracked.createBatchOrders(requests);

      expect(executionOrder).toEqual(['A/USDT:USDT', 'B/USDT:USDT', 'C/USDT:USDT']);

      await tracked.disconnect();
      await adapter.disconnect();
    });

    test('handles large batch efficiently', async () => {
      const adapter = new MockAdapterNoBatch();
      await adapter.initialize();

      const requests: OrderRequest[] = Array.from({ length: 100 }, (_, i) => ({
        symbol: `SYMBOL${i}/USDT:USDT`,
        side: 'buy' as const,
        type: 'limit' as const,
        amount: 1,
        price: 100,
      }));

      const startTime = Date.now();
      const orders = await adapter.createBatchOrders(requests);
      const duration = Date.now() - startTime;

      expect(orders).toHaveLength(100);
      // Should complete in reasonable time (< 1 second for 100 mock orders)
      expect(duration).toBeLessThan(1000);

      await adapter.disconnect();
    });
  });
});

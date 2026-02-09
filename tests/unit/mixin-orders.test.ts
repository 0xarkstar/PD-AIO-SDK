/**
 * OrderHelpersMixin Unit Tests
 *
 * Tests the OrderHelpersMixin factory function that adds convenience
 * order methods, batch operations, and validation.
 */

import {
  OrderHelpersMixin,
  type IOrderHelpersMixinBase,
} from '../../src/adapters/base/mixins/OrderHelpersMixin.js';
import { NotSupportedError, PerpDEXError } from '../../src/types/errors.js';
import type { Order, OrderRequest, FeatureMap } from '../../src/types/index.js';
import type { Constructor } from '../../src/adapters/base/mixins/LoggerMixin.js';

// Mock order for responses
function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    timestamp: Date.now(),
    datetime: new Date().toISOString(),
    symbol: 'BTC/USDT:USDT',
    type: 'limit',
    side: 'buy',
    price: 50000,
    amount: 0.1,
    filled: 0,
    remaining: 0.1,
    status: 'open',
    trades: [],
    ...overrides,
  };
}

// Minimal base class implementing IOrderHelpersMixinBase
class TestBase implements IOrderHelpersMixinBase {
  readonly id: string;
  readonly name: string;
  readonly has: Partial<FeatureMap>;
  readonly _isReady: boolean;
  createOrderCalls: OrderRequest[] = [];
  cancelOrderCalls: Array<{ orderId: string; symbol?: string }> = [];
  shouldFailCreateOrder = false;
  failOnIndex = -1;
  private orderCounter = 0;

  constructor(
    id = 'test-exchange',
    name = 'Test Exchange',
    has: Partial<FeatureMap> = {},
    isReady = true
  ) {
    this.id = id;
    this.name = name;
    this.has = has;
    this._isReady = isReady;
  }

  async createOrder(request: OrderRequest): Promise<Order> {
    this.createOrderCalls.push(request);
    this.orderCounter++;

    if (this.shouldFailCreateOrder) {
      throw new Error('Create order failed');
    }
    if (this.failOnIndex === this.orderCounter) {
      throw new Error(`Order ${this.orderCounter} failed`);
    }

    return createMockOrder({
      id: `order-${this.orderCounter}`,
      symbol: request.symbol,
      type: request.type,
      side: request.side,
      price: request.price,
      amount: request.amount,
    });
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    this.cancelOrderCalls.push({ orderId, symbol });

    if (orderId.startsWith('non-existent')) {
      throw new Error(`Order ${orderId} not found`);
    }

    return createMockOrder({
      id: orderId,
      status: 'canceled',
    });
  }

  debug(_message: string, _meta?: Record<string, unknown>): void {}
}

// Apply mixin
const TestWithOrders = OrderHelpersMixin(TestBase as Constructor<TestBase>);

describe('OrderHelpersMixin', () => {
  describe('createBatchOrders()', () => {
    test('executes orders sequentially when batch not supported', async () => {
      const instance = new TestWithOrders('test', 'Test', { createBatchOrders: false });
      const requests: OrderRequest[] = [
        { symbol: 'BTC/USDT:USDT', side: 'buy', type: 'limit', amount: 0.1, price: 50000 },
        { symbol: 'ETH/USDT:USDT', side: 'buy', type: 'limit', amount: 1.0, price: 3000 },
      ];

      const orders = await instance.createBatchOrders(requests);

      expect(orders).toHaveLength(2);
      expect(orders[0].symbol).toBe('BTC/USDT:USDT');
      expect(orders[1].symbol).toBe('ETH/USDT:USDT');
      expect(instance.createOrderCalls).toHaveLength(2);
    });

    test('throws when native batch is supported but not implemented', async () => {
      const instance = new TestWithOrders('test', 'Test', { createBatchOrders: true });
      const requests: OrderRequest[] = [
        { symbol: 'BTC/USDT:USDT', side: 'buy', type: 'limit', amount: 0.1, price: 50000 },
      ];

      await expect(instance.createBatchOrders(requests)).rejects.toThrow(
        'createBatchOrders must be implemented by subclass'
      );
    });

    test('continues on individual order failure', async () => {
      const instance = new TestWithOrders('test', 'Test', {});
      instance.failOnIndex = 2; // Second order fails

      const requests: OrderRequest[] = [
        { symbol: 'BTC/USDT:USDT', side: 'buy', type: 'limit', amount: 0.1, price: 50000 },
        { symbol: 'ETH/USDT:USDT', side: 'buy', type: 'limit', amount: 1.0, price: 3000 },
        { symbol: 'SOL/USDT:USDT', side: 'buy', type: 'limit', amount: 10, price: 100 },
      ];

      const orders = await instance.createBatchOrders(requests);

      expect(orders).toHaveLength(2);
      expect(orders[0].symbol).toBe('BTC/USDT:USDT');
      expect(orders[1].symbol).toBe('SOL/USDT:USDT');
    });

    test('throws when all orders fail', async () => {
      const instance = new TestWithOrders('test', 'Test', {});
      instance.shouldFailCreateOrder = true;

      const requests: OrderRequest[] = [
        { symbol: 'BTC/USDT:USDT', side: 'buy', type: 'limit', amount: 0.1, price: 50000 },
        { symbol: 'ETH/USDT:USDT', side: 'buy', type: 'limit', amount: 1.0, price: 3000 },
      ];

      await expect(instance.createBatchOrders(requests)).rejects.toThrow(
        'All batch order creations failed'
      );
    });

    test('handles empty batch', async () => {
      const instance = new TestWithOrders();
      const orders = await instance.createBatchOrders([]);
      expect(orders).toHaveLength(0);
    });

    test('logs batch activity', async () => {
      const instance = new TestWithOrders('test', 'Test', {});
      const debugSpy = jest.spyOn(instance, 'debug');

      await instance.createBatchOrders([
        { symbol: 'BTC/USDT:USDT', side: 'buy', type: 'limit', amount: 0.1, price: 50000 },
      ]);

      expect(debugSpy).toHaveBeenCalledWith(
        'No native batch support, creating orders sequentially',
        { count: 1 }
      );
    });
  });

  describe('cancelBatchOrders()', () => {
    test('cancels orders sequentially when batch not supported', async () => {
      const instance = new TestWithOrders('test', 'Test', { cancelBatchOrders: false });

      const canceled = await instance.cancelBatchOrders(['order-1', 'order-2']);

      expect(canceled).toHaveLength(2);
      expect(canceled[0].id).toBe('order-1');
      expect(canceled[0].status).toBe('canceled');
    });

    test('throws when native batch cancellation is supported but not implemented', async () => {
      const instance = new TestWithOrders('test', 'Test', { cancelBatchOrders: true });

      await expect(instance.cancelBatchOrders(['order-1'])).rejects.toThrow(
        'cancelBatchOrders must be implemented by subclass'
      );
    });

    test('continues on individual cancel failure', async () => {
      const instance = new TestWithOrders();

      const canceled = await instance.cancelBatchOrders([
        'order-1',
        'non-existent-1',
        'order-2',
      ]);

      expect(canceled).toHaveLength(2);
    });

    test('throws when all cancellations fail', async () => {
      const instance = new TestWithOrders();

      await expect(
        instance.cancelBatchOrders(['non-existent-1', 'non-existent-2'])
      ).rejects.toThrow('All batch order cancellations failed');
    });

    test('handles empty batch', async () => {
      const instance = new TestWithOrders();
      const canceled = await instance.cancelBatchOrders([]);
      expect(canceled).toHaveLength(0);
    });

    test('passes symbol to cancelOrder', async () => {
      const instance = new TestWithOrders();
      await instance.cancelBatchOrders(['order-1'], 'BTC/USDT:USDT');

      expect(instance.cancelOrderCalls[0]).toEqual({
        orderId: 'order-1',
        symbol: 'BTC/USDT:USDT',
      });
    });
  });

  describe('editOrder()', () => {
    test('throws NotSupportedError when editOrder not supported', async () => {
      const instance = new TestWithOrders('test', 'Test Exchange', {});

      await expect(
        instance.editOrder('order-1', 'BTC/USDT:USDT', 'limit', 'buy', 0.1, 50000)
      ).rejects.toThrow(NotSupportedError);
    });

    test('throws implementation error when supported but not overridden', async () => {
      const instance = new TestWithOrders('test', 'Test Exchange', { editOrder: true });

      await expect(
        instance.editOrder('order-1', 'BTC/USDT:USDT', 'limit', 'buy', 0.1, 50000)
      ).rejects.toThrow('editOrder must be implemented by subclass');
    });
  });

  describe('fetchOrder()', () => {
    test('throws NotSupportedError when not supported', async () => {
      const instance = new TestWithOrders('test', 'Test Exchange', {});

      await expect(instance.fetchOrder('order-1')).rejects.toThrow(NotSupportedError);
    });

    test('throws implementation error when supported but not overridden', async () => {
      const instance = new TestWithOrders('test', 'Test', { fetchOrder: true });

      await expect(instance.fetchOrder('order-1')).rejects.toThrow(
        'fetchOrder must be implemented by subclass'
      );
    });
  });

  describe('fetchOpenOrders()', () => {
    test('throws NotSupportedError when not supported', async () => {
      const instance = new TestWithOrders('test', 'Test Exchange', {});

      await expect(instance.fetchOpenOrders()).rejects.toThrow(NotSupportedError);
    });

    test('throws implementation error when supported but not overridden', async () => {
      const instance = new TestWithOrders('test', 'Test', { fetchOpenOrders: true });

      await expect(instance.fetchOpenOrders()).rejects.toThrow(
        'fetchOpenOrders must be implemented by subclass'
      );
    });
  });

  describe('fetchClosedOrders()', () => {
    test('throws NotSupportedError when not supported', async () => {
      const instance = new TestWithOrders('test', 'Test Exchange', {});

      await expect(instance.fetchClosedOrders()).rejects.toThrow(NotSupportedError);
    });

    test('throws implementation error when supported but not overridden', async () => {
      const instance = new TestWithOrders('test', 'Test', { fetchClosedOrders: true });

      await expect(instance.fetchClosedOrders()).rejects.toThrow(
        'fetchClosedOrders must be implemented by subclass'
      );
    });
  });

  describe('convenience order methods', () => {
    test('createLimitBuyOrder creates correct order request', async () => {
      const instance = new TestWithOrders();

      const order = await instance.createLimitBuyOrder('BTC/USDT:USDT', 0.1, 50000);

      expect(instance.createOrderCalls[0]).toMatchObject({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
      });
      expect(order.side).toBe('buy');
    });

    test('createLimitSellOrder creates correct order request', async () => {
      const instance = new TestWithOrders();

      await instance.createLimitSellOrder('ETH/USDT:USDT', 1.0, 3000);

      expect(instance.createOrderCalls[0]).toMatchObject({
        symbol: 'ETH/USDT:USDT',
        type: 'limit',
        side: 'sell',
        amount: 1.0,
        price: 3000,
      });
    });

    test('createMarketBuyOrder creates correct order request', async () => {
      const instance = new TestWithOrders();

      await instance.createMarketBuyOrder('BTC/USDT:USDT', 0.5);

      expect(instance.createOrderCalls[0]).toMatchObject({
        symbol: 'BTC/USDT:USDT',
        type: 'market',
        side: 'buy',
        amount: 0.5,
      });
    });

    test('createMarketSellOrder creates correct order request', async () => {
      const instance = new TestWithOrders();

      await instance.createMarketSellOrder('SOL/USDT:USDT', 10);

      expect(instance.createOrderCalls[0]).toMatchObject({
        symbol: 'SOL/USDT:USDT',
        type: 'market',
        side: 'sell',
        amount: 10,
      });
    });

    test('createStopLossOrder creates correct order request', async () => {
      const instance = new TestWithOrders();

      await instance.createStopLossOrder('BTC/USDT:USDT', 0.1, 45000);

      expect(instance.createOrderCalls[0]).toMatchObject({
        symbol: 'BTC/USDT:USDT',
        type: 'stopMarket',
        side: 'sell',
        amount: 0.1,
        stopPrice: 45000,
        reduceOnly: true,
      });
    });

    test('createTakeProfitOrder creates correct order request', async () => {
      const instance = new TestWithOrders();

      await instance.createTakeProfitOrder('BTC/USDT:USDT', 0.1, 55000);

      expect(instance.createOrderCalls[0]).toMatchObject({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'sell',
        amount: 0.1,
        price: 55000,
        reduceOnly: true,
      });
    });

    test('convenience methods pass additional params', async () => {
      const instance = new TestWithOrders();

      await instance.createLimitBuyOrder('BTC/USDT:USDT', 0.1, 50000, {
        timeInForce: 'GTC',
        postOnly: true,
      });

      expect(instance.createOrderCalls[0]).toMatchObject({
        symbol: 'BTC/USDT:USDT',
        timeInForce: 'GTC',
        postOnly: true,
      });
    });
  });

  describe('supportsFeature()', () => {
    test('returns true for supported features', () => {
      const instance = new TestWithOrders('test', 'Test', { fetchOrder: true });
      expect(instance.supportsFeature('fetchOrder')).toBe(true);
    });

    test('returns false for unsupported features', () => {
      const instance = new TestWithOrders('test', 'Test', {});
      expect(instance.supportsFeature('fetchOrder')).toBe(false);
    });
  });

  describe('assertFeatureSupported()', () => {
    test('does not throw for supported features', () => {
      const instance = new TestWithOrders('test', 'Test', { fetchOHLCV: true });
      expect(() => instance.assertFeatureSupported('fetchOHLCV')).not.toThrow();
    });

    test('throws NotSupportedError for unsupported features', () => {
      const instance = new TestWithOrders('test', 'Test Exchange', {});
      expect(() => instance.assertFeatureSupported('fetchOHLCV')).toThrow(NotSupportedError);
      expect(() => instance.assertFeatureSupported('fetchOHLCV')).toThrow(
        "Feature 'fetchOHLCV' is not supported by Test Exchange"
      );
    });
  });

  describe('ensureInitialized()', () => {
    test('does not throw when adapter is ready', () => {
      const instance = new TestWithOrders('test', 'Test', {}, true);
      expect(() => instance.ensureInitialized()).not.toThrow();
    });

    test('throws when adapter is not ready', () => {
      const instance = new TestWithOrders('test', 'Test Exchange', {}, false);
      expect(() => instance.ensureInitialized()).toThrow(
        'Test Exchange adapter not initialized. Call initialize() first.'
      );
    });
  });

  describe('attachCorrelationId()', () => {
    test('attaches correlation ID to PerpDEXError', () => {
      const instance = new TestWithOrders();
      const error = new PerpDEXError('test error', 'TEST', 'test');

      const result = instance.attachCorrelationId(error, 'corr-123');

      expect(result).toBe(error);
      expect((result as PerpDEXError).correlationId).toBe('corr-123');
    });

    test('wraps non-PerpDEXError in PerpDEXError', () => {
      const instance = new TestWithOrders();
      const error = new Error('generic error');

      const result = instance.attachCorrelationId(error, 'corr-456');

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.message).toBe('generic error');
      expect((result as PerpDEXError).correlationId).toBe('corr-456');
    });

    test('handles string errors', () => {
      const instance = new TestWithOrders();

      const result = instance.attachCorrelationId('string error', 'corr-789');

      expect(result).toBeInstanceOf(PerpDEXError);
      expect(result.message).toBe('string error');
      expect((result as PerpDEXError).correlationId).toBe('corr-789');
    });
  });

  describe('validateOrder()', () => {
    test('validates a valid order request', () => {
      const instance = new TestWithOrders();
      const request: OrderRequest = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
      };

      // Should not throw for valid request
      const validated = instance.validateOrder(request);
      expect(validated.symbol).toBe('BTC/USDT:USDT');
    });

    test('passes correlationId to validator', () => {
      const instance = new TestWithOrders();
      const request: OrderRequest = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 50000,
      };

      // Should not throw
      const validated = instance.validateOrder(request, 'corr-123');
      expect(validated).toBeDefined();
    });
  });

  describe('getValidator()', () => {
    test('returns a validator instance', () => {
      const instance = new TestWithOrders();
      const validator = instance.getValidator();
      expect(validator).toBeDefined();
    });
  });
});

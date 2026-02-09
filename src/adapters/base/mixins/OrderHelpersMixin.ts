/**
 * Order Helpers Mixin
 *
 * Provides convenience methods for order creation, batch operations, and validation.
 */

import type {
  Order,
  OrderRequest,
  OrderSide,
  OrderType,
  FeatureMap,
} from '../../../types/index.js';
import { NotSupportedError, PerpDEXError } from '../../../types/errors.js';
import { validateOrderRequest, createValidator } from '../../../core/validation/middleware.js';
import type { Constructor } from './LoggerMixin.js';

/**
 * Base interface for order helpers mixin requirements
 */
export interface IOrderHelpersMixinBase {
  readonly id: string;
  readonly name: string;
  readonly has: Partial<FeatureMap>;
  readonly _isReady: boolean;
  createOrder(request: OrderRequest): Promise<Order>;
  cancelOrder(_orderId: string, _symbol?: string): Promise<Order>;
  debug(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Interface for order helper capabilities
 */
export interface IOrderHelpersCapable {
  createBatchOrders(requests: OrderRequest[]): Promise<Order[]>;
  cancelBatchOrders(orderIds: string[], symbol?: string): Promise<Order[]>;
  editOrder(
    orderId: string,
    symbol: string,
    type: OrderType,
    side: OrderSide,
    amount?: number,
    price?: number,
    params?: Record<string, unknown>
  ): Promise<Order>;
  fetchOrder(orderId: string, symbol?: string): Promise<Order>;
  fetchOpenOrders(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
  fetchClosedOrders(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
  createLimitBuyOrder(
    symbol: string,
    amount: number,
    price: number,
    params?: Record<string, unknown>
  ): Promise<Order>;
  createLimitSellOrder(
    symbol: string,
    amount: number,
    price: number,
    params?: Record<string, unknown>
  ): Promise<Order>;
  createMarketBuyOrder(
    symbol: string,
    amount: number,
    params?: Record<string, unknown>
  ): Promise<Order>;
  createMarketSellOrder(
    symbol: string,
    amount: number,
    params?: Record<string, unknown>
  ): Promise<Order>;
  createStopLossOrder(
    symbol: string,
    amount: number,
    stopPrice: number,
    params?: Record<string, unknown>
  ): Promise<Order>;
  createTakeProfitOrder(
    symbol: string,
    amount: number,
    takeProfitPrice: number,
    params?: Record<string, unknown>
  ): Promise<Order>;
}

/**
 * Order Helpers Mixin - adds convenience order methods and batch operations
 *
 * @example
 * ```typescript
 * class MyAdapter extends OrderHelpersMixin(BaseClass) {
 *   async buyBTC() {
 *     return this.createLimitBuyOrder('BTC/USDT:USDT', 0.1, 50000);
 *   }
 * }
 * ```
 */
export function OrderHelpersMixin<T extends Constructor<IOrderHelpersMixinBase>>(Base: T) {
  return class OrderHelpersMixinClass extends Base {
    // ===========================================================================
    // Batch Operations - with automatic fallback to sequential execution
    // ===========================================================================

    /**
     * Create multiple orders in batch
     *
     * If the exchange supports native batch creation (has.createBatchOrders === true),
     * subclasses should override this method. Otherwise, falls back to sequential creation.
     *
     * @param requests - Array of order requests
     * @returns Array of created orders
     *
     * @example
     * ```typescript
     * const orders = await exchange.createBatchOrders([
     *   { symbol: 'BTC/USDT:USDT', side: 'buy', type: 'limit', amount: 0.1, price: 50000 },
     *   { symbol: 'ETH/USDT:USDT', side: 'buy', type: 'limit', amount: 1.0, price: 3000 },
     * ]);
     * ```
     */
    async createBatchOrders(requests: OrderRequest[]): Promise<Order[]> {
      // If native batch is supported, subclass should override this method
      if (this.has.createBatchOrders === true) {
        throw new Error(
          'createBatchOrders must be implemented by subclass when has.createBatchOrders is true'
        );
      }

      // Fallback to sequential execution
      this.debug('No native batch support, creating orders sequentially', {
        count: requests.length,
      });

      const orders: Order[] = [];
      const errors: Array<{ index: number; error: Error }> = [];

      for (let i = 0; i < requests.length; i++) {
        const request = requests[i];
        if (!request) continue; // Skip undefined entries

        try {
          const order = await this.createOrder(request);
          orders.push(order);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          errors.push({ index: i, error: err });

          this.debug('Failed to create order', {
            index: i + 1,
            total: requests.length,
            error: err.message,
          });
          // Continue with remaining orders despite failure
        }
      }

      // If all orders failed, throw an error
      if (orders.length === 0 && errors.length > 0) {
        const firstError = errors[0];
        if (firstError) {
          throw new Error(
            `All batch order creations failed. First error: ${firstError.error.message}`
          );
        }
      }

      // Log summary if some failed
      if (errors.length > 0) {
        this.debug('Batch order creation completed', {
          succeeded: orders.length,
          failed: errors.length,
        });
      }

      return orders;
    }

    /**
     * Cancel multiple orders in batch
     *
     * If the exchange supports native batch cancellation (has.cancelBatchOrders === true),
     * subclasses should override this method. Otherwise, falls back to sequential cancellation.
     *
     * @param orderIds - Array of order IDs to cancel
     * @param symbol - Optional symbol (required for some exchanges)
     * @returns Array of canceled orders
     *
     * @example
     * ```typescript
     * const canceled = await exchange.cancelBatchOrders([
     *   'order-123',
     *   'order-456',
     *   'order-789',
     * ], 'BTC/USDT:USDT');
     * ```
     */
    async cancelBatchOrders(orderIds: string[], symbol?: string): Promise<Order[]> {
      // If native batch is supported, subclass should override this method
      if (this.has.cancelBatchOrders === true) {
        throw new Error(
          'cancelBatchOrders must be implemented by subclass when has.cancelBatchOrders is true'
        );
      }

      // Fallback to sequential execution
      this.debug('No native batch support, canceling orders sequentially', {
        count: orderIds.length,
      });

      const orders: Order[] = [];
      const errors: Array<{ index: number; orderId: string; error: Error }> = [];

      for (let i = 0; i < orderIds.length; i++) {
        const orderId = orderIds[i];
        if (!orderId) continue; // Skip undefined entries

        try {
          const order = await this.cancelOrder(orderId, symbol);
          orders.push(order);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          errors.push({ index: i, orderId, error: err });

          this.debug('Failed to cancel order', { orderId, error: err.message });
          // Continue with remaining orders despite failure
        }
      }

      // If all cancellations failed, throw an error
      if (orders.length === 0 && errors.length > 0) {
        const firstError = errors[0];
        if (firstError) {
          throw new Error(
            `All batch order cancellations failed. First error: ${firstError.error.message}`
          );
        }
      }

      // Log summary if some failed
      if (errors.length > 0) {
        this.debug('Batch order cancellation completed', {
          succeeded: orders.length,
          failed: errors.length,
        });
      }

      return orders;
    }

    /**
     * Edit/modify an existing order
     * Default implementation throws if not supported
     */
    async editOrder(
      _orderId: string,
      _symbol: string,
      _type: OrderType,
      _side: OrderSide,
      _amount?: number,
      _price?: number,
      _params?: Record<string, unknown>
    ): Promise<Order> {
      if (!this.has.editOrder) {
        throw new NotSupportedError(
          `${this.name} does not support editing orders`,
          'NOT_SUPPORTED',
          this.id
        );
      }
      throw new Error('editOrder must be implemented by subclass');
    }

    // ===========================================================================
    // Order Query
    // ===========================================================================

    /**
     * Fetch a single order by ID
     * Default implementation throws if not supported
     */
    async fetchOrder(_orderId: string, _symbol?: string): Promise<Order> {
      if (!this.has.fetchOrder) {
        throw new NotSupportedError(
          `${this.name} does not support fetching single orders`,
          'NOT_SUPPORTED',
          this.id
        );
      }
      throw new Error('fetchOrder must be implemented by subclass');
    }

    /**
     * Fetch all open/pending orders
     * Default implementation throws if not supported
     */
    async fetchOpenOrders(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]> {
      if (!this.has.fetchOpenOrders) {
        throw new NotSupportedError(
          `${this.name} does not support fetching open orders`,
          'NOT_SUPPORTED',
          this.id
        );
      }
      throw new Error('fetchOpenOrders must be implemented by subclass');
    }

    /**
     * Fetch closed (filled/canceled) orders
     * Default implementation throws if not supported
     */
    async fetchClosedOrders(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]> {
      if (!this.has.fetchClosedOrders) {
        throw new NotSupportedError(
          `${this.name} does not support fetching closed orders`,
          'NOT_SUPPORTED',
          this.id
        );
      }
      throw new Error('fetchClosedOrders must be implemented by subclass');
    }

    // ===========================================================================
    // Convenience Order Methods (CCXT-compatible)
    // ===========================================================================

    /**
     * Create a limit buy order
     */
    async createLimitBuyOrder(
      symbol: string,
      amount: number,
      price: number,
      params?: Record<string, unknown>
    ): Promise<Order> {
      return this.createOrder({
        symbol,
        type: 'limit',
        side: 'buy',
        amount,
        price,
        ...params,
      });
    }

    /**
     * Create a limit sell order
     */
    async createLimitSellOrder(
      symbol: string,
      amount: number,
      price: number,
      params?: Record<string, unknown>
    ): Promise<Order> {
      return this.createOrder({
        symbol,
        type: 'limit',
        side: 'sell',
        amount,
        price,
        ...params,
      });
    }

    /**
     * Create a market buy order
     */
    async createMarketBuyOrder(
      symbol: string,
      amount: number,
      params?: Record<string, unknown>
    ): Promise<Order> {
      return this.createOrder({
        symbol,
        type: 'market',
        side: 'buy',
        amount,
        ...params,
      });
    }

    /**
     * Create a market sell order
     */
    async createMarketSellOrder(
      symbol: string,
      amount: number,
      params?: Record<string, unknown>
    ): Promise<Order> {
      return this.createOrder({
        symbol,
        type: 'market',
        side: 'sell',
        amount,
        ...params,
      });
    }

    /**
     * Create a stop loss order
     */
    async createStopLossOrder(
      symbol: string,
      amount: number,
      stopPrice: number,
      params?: Record<string, unknown>
    ): Promise<Order> {
      return this.createOrder({
        symbol,
        type: 'stopMarket',
        side: 'sell', // Default to sell for stop loss
        amount,
        stopPrice,
        reduceOnly: true,
        ...params,
      });
    }

    /**
     * Create a take profit order
     */
    async createTakeProfitOrder(
      symbol: string,
      amount: number,
      takeProfitPrice: number,
      params?: Record<string, unknown>
    ): Promise<Order> {
      return this.createOrder({
        symbol,
        type: 'limit',
        side: 'sell', // Default to sell for take profit
        amount,
        price: takeProfitPrice,
        reduceOnly: true,
        ...params,
      });
    }

    // ===========================================================================
    // Utility Methods
    // ===========================================================================

    /**
     * Check if a feature is supported
     * @internal
     */
    supportsFeature(feature: keyof FeatureMap): boolean {
      return this.has[feature] === true;
    }

    /**
     * Assert that a feature is supported, throwing an error if not
     *
     * Use this at the beginning of methods that require specific features
     * to provide clear error messages when unsupported features are called.
     *
     * @param feature - The feature to check
     * @throws NotSupportedError if the feature is not supported
     * @internal
     *
     * @example
     * ```typescript
     * async fetchOHLCV(symbol: string, timeframe: OHLCVTimeframe): Promise<OHLCV[]> {
     *   this.assertFeatureSupported('fetchOHLCV');
     *   // ... implementation
     * }
     * ```
     */
    assertFeatureSupported(feature: keyof FeatureMap): void {
      if (!this.has[feature]) {
        throw new NotSupportedError(
          `Feature '${feature}' is not supported by ${this.name}`,
          'NOT_SUPPORTED',
          this.id
        );
      }
    }

    /**
     * Ensure adapter is initialized
     * @internal
     */
    ensureInitialized(): void {
      if (!this._isReady) {
        throw new Error(`${this.name} adapter not initialized. Call initialize() first.`);
      }
    }

    // ===========================================================================
    // Input Validation
    // ===========================================================================

    /**
     * Validate an order request using Zod schemas
     *
     * Validates that the order request has all required fields and
     * enforces type-specific constraints (e.g., limit orders need price).
     *
     * @param request - Order request to validate
     * @param correlationId - Optional correlation ID for error tracking
     * @returns Validated order request
     * @throws {InvalidOrderError} If validation fails
     * @internal
     *
     * @example
     * ```typescript
     * async createOrder(request: OrderRequest): Promise<Order> {
     *   const validated = this.validateOrder(request);
     *   // ... create order with validated data
     * }
     * ```
     */
    validateOrder(request: OrderRequest, correlationId?: string): OrderRequest {
      return validateOrderRequest(request, {
        exchange: this.id,
        context: correlationId ? { correlationId } : undefined,
      }) as OrderRequest;
    }

    /**
     * Get a validator instance for this adapter
     *
     * Creates a validator bound to this adapter's exchange ID
     * for use with custom validation needs.
     *
     * @returns Validator with methods for common validation tasks
     * @internal
     *
     * @example
     * ```typescript
     * const validator = this.getValidator();
     * const params = validator.orderBookParams(rawParams);
     * ```
     */
    getValidator() {
      return createValidator(this.id);
    }

    /**
     * Attach correlation ID to an error for request tracing
     *
     * If the error is a PerpDEXError, attaches the correlation ID directly.
     * Otherwise, wraps the error in a PerpDEXError with the correlation ID.
     *
     * @param error - Error to attach correlation ID to
     * @param correlationId - Correlation ID for request tracing
     * @returns Error with correlation ID attached
     * @internal
     */
    attachCorrelationId(error: unknown, correlationId: string): Error {
      if (error instanceof PerpDEXError) {
        error.withCorrelationId(correlationId);
        return error;
      }

      const message = error instanceof Error ? error.message : String(error);
      return new PerpDEXError(message, 'REQUEST_ERROR', this.id, error).withCorrelationId(
        correlationId
      );
    }
  };
}

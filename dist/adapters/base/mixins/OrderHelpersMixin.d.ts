/**
 * Order Helpers Mixin
 *
 * Provides convenience methods for order creation, batch operations, and validation.
 */
import type { Order, OrderRequest, OrderSide, OrderType, FeatureMap } from '../../../types/index.js';
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
    editOrder(orderId: string, symbol: string, type: OrderType, side: OrderSide, amount?: number, price?: number, params?: Record<string, unknown>): Promise<Order>;
    fetchOrder(orderId: string, symbol?: string): Promise<Order>;
    fetchOpenOrders(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    fetchClosedOrders(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    createLimitBuyOrder(symbol: string, amount: number, price: number, params?: Record<string, unknown>): Promise<Order>;
    createLimitSellOrder(symbol: string, amount: number, price: number, params?: Record<string, unknown>): Promise<Order>;
    createMarketBuyOrder(symbol: string, amount: number, params?: Record<string, unknown>): Promise<Order>;
    createMarketSellOrder(symbol: string, amount: number, params?: Record<string, unknown>): Promise<Order>;
    createStopLossOrder(symbol: string, amount: number, stopPrice: number, params?: Record<string, unknown>): Promise<Order>;
    createTakeProfitOrder(symbol: string, amount: number, takeProfitPrice: number, params?: Record<string, unknown>): Promise<Order>;
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
export declare function OrderHelpersMixin<T extends Constructor<IOrderHelpersMixinBase>>(Base: T): {
    new (...args: any[]): {
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
        createBatchOrders(requests: OrderRequest[]): Promise<Order[]>;
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
        cancelBatchOrders(orderIds: string[], symbol?: string): Promise<Order[]>;
        /**
         * Edit/modify an existing order
         * Default implementation throws if not supported
         */
        editOrder(_orderId: string, _symbol: string, _type: OrderType, _side: OrderSide, _amount?: number, _price?: number, _params?: Record<string, unknown>): Promise<Order>;
        /**
         * Fetch a single order by ID
         * Default implementation throws if not supported
         */
        fetchOrder(_orderId: string, _symbol?: string): Promise<Order>;
        /**
         * Fetch all open/pending orders
         * Default implementation throws if not supported
         */
        fetchOpenOrders(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
        /**
         * Fetch closed (filled/canceled) orders
         * Default implementation throws if not supported
         */
        fetchClosedOrders(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
        /**
         * Create a limit buy order
         */
        createLimitBuyOrder(symbol: string, amount: number, price: number, params?: Record<string, unknown>): Promise<Order>;
        /**
         * Create a limit sell order
         */
        createLimitSellOrder(symbol: string, amount: number, price: number, params?: Record<string, unknown>): Promise<Order>;
        /**
         * Create a market buy order
         */
        createMarketBuyOrder(symbol: string, amount: number, params?: Record<string, unknown>): Promise<Order>;
        /**
         * Create a market sell order
         */
        createMarketSellOrder(symbol: string, amount: number, params?: Record<string, unknown>): Promise<Order>;
        /**
         * Create a stop loss order
         */
        createStopLossOrder(symbol: string, amount: number, stopPrice: number, params?: Record<string, unknown>): Promise<Order>;
        /**
         * Create a take profit order
         */
        createTakeProfitOrder(symbol: string, amount: number, takeProfitPrice: number, params?: Record<string, unknown>): Promise<Order>;
        /**
         * Check if a feature is supported
         * @internal
         */
        supportsFeature(feature: keyof FeatureMap): boolean;
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
        assertFeatureSupported(feature: keyof FeatureMap): void;
        /**
         * Ensure adapter is initialized
         * @internal
         */
        ensureInitialized(): void;
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
        validateOrder(request: OrderRequest, correlationId?: string): OrderRequest;
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
        getValidator(): {
            validate: <T_1>(schema: import("zod").ZodType<T_1>, data: unknown, context?: import("../../../index.js").RequestContext) => T_1;
            orderRequest: (data: unknown, context?: import("../../../index.js").RequestContext) => import("zod").TypeOf<typeof import("../../../index.js").OrderRequestSchema>;
            orderBookParams: (data: unknown, context?: import("../../../index.js").RequestContext) => import("zod").TypeOf<typeof import("../../../core/index.js").OrderBookParamsSchema> | undefined;
            tradeParams: (data: unknown, context?: import("../../../index.js").RequestContext) => import("zod").TypeOf<typeof import("../../../core/index.js").TradeParamsSchema> | undefined;
            marketParams: (data: unknown, context?: import("../../../index.js").RequestContext) => import("zod").TypeOf<typeof import("../../../core/index.js").MarketParamsSchema> | undefined;
            ohlcvParams: (data: unknown, context?: import("../../../index.js").RequestContext) => import("zod").TypeOf<typeof import("../../../core/validation/schemas.js").OHLCVParamsSchema> | undefined;
            ohlcvTimeframe: (data: unknown, context?: import("../../../index.js").RequestContext) => import("zod").TypeOf<typeof import("../../../core/validation/schemas.js").OHLCVTimeframeSchema>;
            array: <T_1>(schema: import("zod").ZodType<T_1>, data: unknown[], context?: import("../../../index.js").RequestContext) => T_1[];
        };
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
        attachCorrelationId(error: unknown, correlationId: string): Error;
        readonly id: string;
        readonly name: string;
        readonly has: Partial<FeatureMap>;
        readonly _isReady: boolean;
        createOrder(request: OrderRequest): Promise<Order>;
        cancelOrder(_orderId: string, _symbol?: string): Promise<Order>;
        debug(message: string, meta?: Record<string, unknown>): void;
    };
} & T;
//# sourceMappingURL=OrderHelpersMixin.d.ts.map
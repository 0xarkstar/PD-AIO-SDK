/**
 * Validation Middleware
 *
 * Provides consistent request/response validation across all adapters
 * with support for correlation IDs and detailed error reporting.
 */
import { z } from 'zod';
import { OrderRequestSchema, OrderBookParamsSchema, TradeParamsSchema, MarketParamsSchema, OHLCVParamsSchema, OHLCVTimeframeSchema } from './schemas.js';
import type { RequestContext } from '../logger.js';
/**
 * Validation result with detailed error information
 */
export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    errors?: ValidationError[];
}
/**
 * Detailed validation error
 */
export interface ValidationError {
    field: string;
    message: string;
    code: string;
    value?: unknown;
}
/**
 * Validation options
 */
export interface ValidationOptions {
    /** Exchange identifier for error context */
    exchange: string;
    /** Request context for correlation tracking (only correlationId is used) */
    context?: RequestContext | {
        correlationId: string;
    };
    /** Whether to throw on validation failure (default: true) */
    throwOnError?: boolean;
    /** Custom error message prefix */
    errorPrefix?: string;
}
/**
 * Validates data against a Zod schema with detailed error reporting
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param options - Validation options
 * @returns Validated data or throws error
 *
 * @example
 * ```typescript
 * const validatedOrder = validate(OrderRequestSchema, orderData, {
 *   exchange: 'hyperliquid',
 *   context: requestContext,
 * });
 * ```
 */
export declare function validate<T>(schema: z.ZodType<T>, data: unknown, options: ValidationOptions): T;
/**
 * Validates data and returns a result object instead of throwing
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with success flag and data/errors
 */
export declare function validateSafe<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T>;
/**
 * Validates an order request with specific error handling
 *
 * @param data - Order request data
 * @param options - Validation options
 * @returns Validated order request
 * @throws {InvalidOrderError} If validation fails
 */
export declare function validateOrderRequest(data: unknown, options: ValidationOptions): z.infer<typeof OrderRequestSchema>;
/**
 * Validates order book params
 */
export declare function validateOrderBookParams(data: unknown, options: ValidationOptions): z.infer<typeof OrderBookParamsSchema> | undefined;
/**
 * Validates trade params
 */
export declare function validateTradeParams(data: unknown, options: ValidationOptions): z.infer<typeof TradeParamsSchema> | undefined;
/**
 * Validates market params
 */
export declare function validateMarketParams(data: unknown, options: ValidationOptions): z.infer<typeof MarketParamsSchema> | undefined;
/**
 * Validates OHLCV params
 */
export declare function validateOHLCVParams(data: unknown, options: ValidationOptions): z.infer<typeof OHLCVParamsSchema> | undefined;
/**
 * Validates OHLCV timeframe
 */
export declare function validateOHLCVTimeframe(data: unknown, options: ValidationOptions): z.infer<typeof OHLCVTimeframeSchema>;
/**
 * Validates an array of items against a schema
 *
 * @param schema - Schema for individual items
 * @param data - Array of data to validate
 * @param options - Validation options
 * @returns Array of validated items
 */
export declare function validateArray<T>(schema: z.ZodType<T>, data: unknown[], options: ValidationOptions): T[];
/**
 * Creates a validation middleware for a specific exchange
 *
 * @param exchange - Exchange identifier
 * @returns Object with validation methods bound to the exchange
 *
 * @example
 * ```typescript
 * const validator = createValidator('hyperliquid');
 *
 * const order = validator.orderRequest(orderData, context);
 * const params = validator.orderBookParams(paramsData, context);
 * ```
 */
export declare function createValidator(exchange: string): {
    /**
     * Validate any data against a schema
     */
    validate: <T>(schema: z.ZodType<T>, data: unknown, context?: RequestContext) => T;
    /**
     * Validate order request
     */
    orderRequest: (data: unknown, context?: RequestContext) => z.infer<typeof OrderRequestSchema>;
    /**
     * Validate order book params
     */
    orderBookParams: (data: unknown, context?: RequestContext) => z.infer<typeof OrderBookParamsSchema> | undefined;
    /**
     * Validate trade params
     */
    tradeParams: (data: unknown, context?: RequestContext) => z.infer<typeof TradeParamsSchema> | undefined;
    /**
     * Validate market params
     */
    marketParams: (data: unknown, context?: RequestContext) => z.infer<typeof MarketParamsSchema> | undefined;
    /**
     * Validate OHLCV params
     */
    ohlcvParams: (data: unknown, context?: RequestContext) => z.infer<typeof OHLCVParamsSchema> | undefined;
    /**
     * Validate OHLCV timeframe
     */
    ohlcvTimeframe: (data: unknown, context?: RequestContext) => z.infer<typeof OHLCVTimeframeSchema>;
    /**
     * Validate array of items
     */
    array: <T>(schema: z.ZodType<T>, data: unknown[], context?: RequestContext) => T[];
};
/**
 * Response validation decorator factory
 *
 * Validates the response of an async function
 *
 * @param schema - Schema to validate response against
 * @param exchange - Exchange identifier for error context
 *
 * @example
 * ```typescript
 * class MyAdapter {
 *   @validateResponse(OrderSchema, 'myexchange')
 *   async createOrder(request: OrderRequest): Promise<Order> {
 *     // ... implementation
 *   }
 * }
 * ```
 */
export declare function validateResponse<T>(schema: z.ZodType<T>, exchange: string): MethodDecorator;
//# sourceMappingURL=middleware.d.ts.map
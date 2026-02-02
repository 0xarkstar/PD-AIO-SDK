/**
 * Validation Middleware
 *
 * Provides consistent request/response validation across all adapters
 * with support for correlation IDs and detailed error reporting.
 */
import { PerpDEXError, InvalidOrderError } from '../../types/errors.js';
import { OrderRequestSchema, OrderBookParamsSchema, TradeParamsSchema, MarketParamsSchema, OHLCVParamsSchema, OHLCVTimeframeSchema, } from './schemas.js';
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
export function validate(schema, data, options) {
    const result = schema.safeParse(data);
    if (!result.success) {
        const errors = mapZodErrors(result.error);
        const errorMessage = formatValidationErrors(errors, options.errorPrefix);
        if (options.throwOnError !== false) {
            const error = new PerpDEXError(errorMessage, 'VALIDATION_ERROR', options.exchange);
            if (options.context?.correlationId) {
                error.withCorrelationId(options.context.correlationId);
            }
            throw error;
        }
    }
    return result.data;
}
/**
 * Validates data and returns a result object instead of throwing
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with success flag and data/errors
 */
export function validateSafe(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return {
        success: false,
        errors: mapZodErrors(result.error),
    };
}
/**
 * Validates an order request with specific error handling
 *
 * @param data - Order request data
 * @param options - Validation options
 * @returns Validated order request
 * @throws {InvalidOrderError} If validation fails
 */
export function validateOrderRequest(data, options) {
    const result = OrderRequestSchema.safeParse(data);
    if (!result.success) {
        const errors = mapZodErrors(result.error);
        const errorMessage = formatValidationErrors(errors, 'Invalid order');
        const error = new InvalidOrderError(errorMessage, 'INVALID_ORDER_REQUEST', options.exchange);
        if (options.context?.correlationId) {
            error.withCorrelationId(options.context.correlationId);
        }
        throw error;
    }
    return result.data;
}
/**
 * Validates order book params
 */
export function validateOrderBookParams(data, options) {
    if (data === undefined || data === null) {
        return undefined;
    }
    return validate(OrderBookParamsSchema, data, {
        ...options,
        errorPrefix: 'Invalid order book params',
    });
}
/**
 * Validates trade params
 */
export function validateTradeParams(data, options) {
    if (data === undefined || data === null) {
        return undefined;
    }
    return validate(TradeParamsSchema, data, {
        ...options,
        errorPrefix: 'Invalid trade params',
    });
}
/**
 * Validates market params
 */
export function validateMarketParams(data, options) {
    if (data === undefined || data === null) {
        return undefined;
    }
    return validate(MarketParamsSchema, data, {
        ...options,
        errorPrefix: 'Invalid market params',
    });
}
/**
 * Validates OHLCV params
 */
export function validateOHLCVParams(data, options) {
    if (data === undefined || data === null) {
        return undefined;
    }
    return validate(OHLCVParamsSchema, data, {
        ...options,
        errorPrefix: 'Invalid OHLCV params',
    });
}
/**
 * Validates OHLCV timeframe
 */
export function validateOHLCVTimeframe(data, options) {
    return validate(OHLCVTimeframeSchema, data, {
        ...options,
        errorPrefix: 'Invalid OHLCV timeframe',
    });
}
/**
 * Validates an array of items against a schema
 *
 * @param schema - Schema for individual items
 * @param data - Array of data to validate
 * @param options - Validation options
 * @returns Array of validated items
 */
export function validateArray(schema, data, options) {
    const results = [];
    const errors = [];
    for (let i = 0; i < data.length; i++) {
        const result = schema.safeParse(data[i]);
        if (result.success) {
            results.push(result.data);
        }
        else {
            const itemErrors = mapZodErrors(result.error);
            errors.push(...itemErrors.map((e) => ({
                ...e,
                field: `[${i}].${e.field}`,
            })));
        }
    }
    if (errors.length > 0 && options.throwOnError !== false) {
        const errorMessage = formatValidationErrors(errors, options.errorPrefix);
        const error = new PerpDEXError(errorMessage, 'VALIDATION_ERROR', options.exchange);
        if (options.context?.correlationId) {
            error.withCorrelationId(options.context.correlationId);
        }
        throw error;
    }
    return results;
}
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
export function createValidator(exchange) {
    return {
        /**
         * Validate any data against a schema
         */
        validate: (schema, data, context) => validate(schema, data, { exchange, context }),
        /**
         * Validate order request
         */
        orderRequest: (data, context) => validateOrderRequest(data, { exchange, context }),
        /**
         * Validate order book params
         */
        orderBookParams: (data, context) => validateOrderBookParams(data, { exchange, context }),
        /**
         * Validate trade params
         */
        tradeParams: (data, context) => validateTradeParams(data, { exchange, context }),
        /**
         * Validate market params
         */
        marketParams: (data, context) => validateMarketParams(data, { exchange, context }),
        /**
         * Validate OHLCV params
         */
        ohlcvParams: (data, context) => validateOHLCVParams(data, { exchange, context }),
        /**
         * Validate OHLCV timeframe
         */
        ohlcvTimeframe: (data, context) => validateOHLCVTimeframe(data, { exchange, context }),
        /**
         * Validate array of items
         */
        array: (schema, data, context) => validateArray(schema, data, { exchange, context }),
    };
}
/**
 * Maps Zod errors to ValidationError format
 */
function mapZodErrors(zodError) {
    return zodError.errors.map((err) => ({
        field: err.path.join('.') || 'root',
        message: err.message,
        code: err.code,
        value: 'received' in err ? err.received : undefined,
    }));
}
/**
 * Formats validation errors into a human-readable message
 */
function formatValidationErrors(errors, prefix) {
    const errorMessages = errors.map((e) => {
        const location = e.field !== 'root' ? ` at '${e.field}'` : '';
        return `${e.message}${location}`;
    });
    const baseMessage = prefix ? `${prefix}: ` : 'Validation failed: ';
    return `${baseMessage}${errorMessages.join('; ')}`;
}
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
export function validateResponse(schema, exchange) {
    return function (_target, _propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const result = await originalMethod.apply(this, args);
            return validate(schema, result, { exchange, errorPrefix: 'Invalid response' });
        };
        return descriptor;
    };
}
//# sourceMappingURL=middleware.js.map
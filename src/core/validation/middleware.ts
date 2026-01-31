/**
 * Validation Middleware
 *
 * Provides consistent request/response validation across all adapters
 * with support for correlation IDs and detailed error reporting.
 */

import { z } from 'zod';
import { PerpDEXError, InvalidOrderError } from '../../types/errors.js';
import {
  OrderRequestSchema,
  OrderBookParamsSchema,
  TradeParamsSchema,
  MarketParamsSchema,
  OHLCVParamsSchema,
  OHLCVTimeframeSchema,
} from './schemas.js';
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
  /** Request context for correlation tracking */
  context?: RequestContext;
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
export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown,
  options: ValidationOptions
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = mapZodErrors(result.error);
    const errorMessage = formatValidationErrors(errors, options.errorPrefix);

    if (options.throwOnError !== false) {
      const error = new PerpDEXError(
        errorMessage,
        'VALIDATION_ERROR',
        options.exchange
      );

      if (options.context?.correlationId) {
        error.withCorrelationId(options.context.correlationId);
      }

      throw error;
    }
  }

  return result.data as T;
}

/**
 * Validates data and returns a result object instead of throwing
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with success flag and data/errors
 */
export function validateSafe<T>(
  schema: z.ZodType<T>,
  data: unknown
): ValidationResult<T> {
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
export function validateOrderRequest(
  data: unknown,
  options: ValidationOptions
): z.infer<typeof OrderRequestSchema> {
  const result = OrderRequestSchema.safeParse(data);

  if (!result.success) {
    const errors = mapZodErrors(result.error);
    const errorMessage = formatValidationErrors(errors, 'Invalid order');

    const error = new InvalidOrderError(
      errorMessage,
      'INVALID_ORDER_REQUEST',
      options.exchange
    );

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
export function validateOrderBookParams(
  data: unknown,
  options: ValidationOptions
): z.infer<typeof OrderBookParamsSchema> | undefined {
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
export function validateTradeParams(
  data: unknown,
  options: ValidationOptions
): z.infer<typeof TradeParamsSchema> | undefined {
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
export function validateMarketParams(
  data: unknown,
  options: ValidationOptions
): z.infer<typeof MarketParamsSchema> | undefined {
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
export function validateOHLCVParams(
  data: unknown,
  options: ValidationOptions
): z.infer<typeof OHLCVParamsSchema> | undefined {
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
export function validateOHLCVTimeframe(
  data: unknown,
  options: ValidationOptions
): z.infer<typeof OHLCVTimeframeSchema> {
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
export function validateArray<T>(
  schema: z.ZodType<T>,
  data: unknown[],
  options: ValidationOptions
): T[] {
  const results: T[] = [];
  const errors: ValidationError[] = [];

  for (let i = 0; i < data.length; i++) {
    const result = schema.safeParse(data[i]);

    if (result.success) {
      results.push(result.data);
    } else {
      const itemErrors = mapZodErrors(result.error);
      errors.push(
        ...itemErrors.map((e) => ({
          ...e,
          field: `[${i}].${e.field}`,
        }))
      );
    }
  }

  if (errors.length > 0 && options.throwOnError !== false) {
    const errorMessage = formatValidationErrors(errors, options.errorPrefix);
    const error = new PerpDEXError(
      errorMessage,
      'VALIDATION_ERROR',
      options.exchange
    );

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
export function createValidator(exchange: string) {
  return {
    /**
     * Validate any data against a schema
     */
    validate: <T>(
      schema: z.ZodType<T>,
      data: unknown,
      context?: RequestContext
    ): T => validate(schema, data, { exchange, context }),

    /**
     * Validate order request
     */
    orderRequest: (
      data: unknown,
      context?: RequestContext
    ): z.infer<typeof OrderRequestSchema> =>
      validateOrderRequest(data, { exchange, context }),

    /**
     * Validate order book params
     */
    orderBookParams: (
      data: unknown,
      context?: RequestContext
    ): z.infer<typeof OrderBookParamsSchema> | undefined =>
      validateOrderBookParams(data, { exchange, context }),

    /**
     * Validate trade params
     */
    tradeParams: (
      data: unknown,
      context?: RequestContext
    ): z.infer<typeof TradeParamsSchema> | undefined =>
      validateTradeParams(data, { exchange, context }),

    /**
     * Validate market params
     */
    marketParams: (
      data: unknown,
      context?: RequestContext
    ): z.infer<typeof MarketParamsSchema> | undefined =>
      validateMarketParams(data, { exchange, context }),

    /**
     * Validate OHLCV params
     */
    ohlcvParams: (
      data: unknown,
      context?: RequestContext
    ): z.infer<typeof OHLCVParamsSchema> | undefined =>
      validateOHLCVParams(data, { exchange, context }),

    /**
     * Validate OHLCV timeframe
     */
    ohlcvTimeframe: (
      data: unknown,
      context?: RequestContext
    ): z.infer<typeof OHLCVTimeframeSchema> =>
      validateOHLCVTimeframe(data, { exchange, context }),

    /**
     * Validate array of items
     */
    array: <T>(
      schema: z.ZodType<T>,
      data: unknown[],
      context?: RequestContext
    ): T[] => validateArray(schema, data, { exchange, context }),
  };
}

/**
 * Maps Zod errors to ValidationError format
 */
function mapZodErrors(zodError: z.ZodError): ValidationError[] {
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
function formatValidationErrors(
  errors: ValidationError[],
  prefix?: string
): string {
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
export function validateResponse<T>(
  schema: z.ZodType<T>,
  exchange: string
): MethodDecorator {
  return function (
    _target: any,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      return validate(schema, result, { exchange, errorPrefix: 'Invalid response' });
    };

    return descriptor;
  };
}

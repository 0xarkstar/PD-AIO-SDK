/**
 * Zod Validation Schemas
 *
 * Runtime validation for all external data
 */

import { z } from 'zod';

// =============================================================================
// Base Schemas
// =============================================================================

const PositiveNumberSchema = z.number().positive();
const NonNegativeNumberSchema = z.number().nonnegative();
const TimestampSchema = z.number().int().positive();
const SymbolSchema = z.string().min(1);

// =============================================================================
// Order Schemas
// =============================================================================

export const OrderTypeSchema = z.enum(['market', 'limit', 'stopMarket', 'stopLimit']);

export const OrderSideSchema = z.enum(['buy', 'sell']);

export const OrderStatusSchema = z.enum([
  'open',
  'closed',
  'canceled',
  'expired',
  'rejected',
  'filled',
  'partiallyFilled',
]);

export const TimeInForceSchema = z.enum(['GTC', 'IOC', 'FOK', 'PO']);

export const OrderRequestSchema = z
  .object({
    symbol: SymbolSchema,
    type: OrderTypeSchema,
    side: OrderSideSchema,
    amount: PositiveNumberSchema,
    price: PositiveNumberSchema.optional(),
    stopPrice: PositiveNumberSchema.optional(),
    timeInForce: TimeInForceSchema.optional(),
    reduceOnly: z.boolean().default(false),
    postOnly: z.boolean().default(false),
    clientOrderId: z.string().optional(),
    leverage: z.number().int().min(1).max(100).optional(),
    params: z.record(z.unknown()).optional(),
  })
  .refine(
    (data) => {
      // Limit orders must have price
      if (data.type === 'limit' || data.type === 'stopLimit') {
        return data.price !== undefined && data.price > 0;
      }
      return true;
    },
    {
      message: 'Limit orders require a valid price',
      path: ['price'],
    }
  )
  .refine(
    (data) => {
      // Stop orders must have stopPrice
      if (data.type === 'stopMarket' || data.type === 'stopLimit') {
        return data.stopPrice !== undefined && data.stopPrice > 0;
      }
      return true;
    },
    {
      message: 'Stop orders require a valid stopPrice',
      path: ['stopPrice'],
    }
  );

export const OrderSchema = z.object({
  id: z.string(),
  symbol: SymbolSchema,
  type: OrderTypeSchema,
  side: OrderSideSchema,
  amount: PositiveNumberSchema,
  price: PositiveNumberSchema.optional(),
  stopPrice: PositiveNumberSchema.optional(),
  status: OrderStatusSchema,
  filled: NonNegativeNumberSchema,
  remaining: NonNegativeNumberSchema,
  averagePrice: PositiveNumberSchema.optional(),
  timeInForce: TimeInForceSchema.optional(),
  reduceOnly: z.boolean(),
  postOnly: z.boolean(),
  clientOrderId: z.string().optional(),
  timestamp: TimestampSchema,
  lastUpdateTimestamp: TimestampSchema.optional(),
  info: z.record(z.unknown()).optional(),
});

// =============================================================================
// Position Schemas
// =============================================================================

export const PositionSideSchema = z.enum(['long', 'short']);

export const MarginModeSchema = z.enum(['cross', 'isolated']);

export const PositionSchema = z.object({
  symbol: SymbolSchema,
  side: PositionSideSchema,
  size: PositiveNumberSchema,
  entryPrice: PositiveNumberSchema,
  markPrice: PositiveNumberSchema,
  liquidationPrice: PositiveNumberSchema,
  unrealizedPnl: z.number(),
  realizedPnl: z.number(),
  leverage: z.number().int().positive(),
  marginMode: MarginModeSchema,
  margin: NonNegativeNumberSchema,
  maintenanceMargin: NonNegativeNumberSchema,
  marginRatio: z.number().min(0).max(1),
  timestamp: TimestampSchema,
  info: z.record(z.unknown()).optional(),
});

// =============================================================================
// Market Schemas
// =============================================================================

export const MarketSchema = z.object({
  id: z.string(),
  symbol: SymbolSchema,
  base: z.string(),
  quote: z.string(),
  settle: z.string(),
  active: z.boolean(),
  minAmount: PositiveNumberSchema,
  maxAmount: PositiveNumberSchema.optional(),
  minCost: PositiveNumberSchema.optional(),
  pricePrecision: z.number().int().nonnegative(),
  amountPrecision: z.number().int().nonnegative(),
  priceTickSize: PositiveNumberSchema,
  amountStepSize: PositiveNumberSchema,
  makerFee: z.number(),
  takerFee: z.number().nonnegative(),
  maxLeverage: z.number().int().positive(),
  fundingIntervalHours: z.number().positive(),
  contractSize: PositiveNumberSchema.optional(),
  info: z.record(z.unknown()).optional(),
});

// =============================================================================
// Order Book Schemas
// =============================================================================

export const PriceLevelSchema = z.tuple([PositiveNumberSchema, NonNegativeNumberSchema]);

export const OrderBookSchema = z.object({
  symbol: SymbolSchema,
  timestamp: TimestampSchema,
  bids: z.array(PriceLevelSchema),
  asks: z.array(PriceLevelSchema),
  sequenceId: z.number().optional(),
  checksum: z.string().optional(),
  exchange: z.string(),
});

// =============================================================================
// Trade Schemas
// =============================================================================

export const TradeSchema = z.object({
  id: z.string(),
  symbol: SymbolSchema,
  orderId: z.string().optional(),
  side: OrderSideSchema,
  price: PositiveNumberSchema,
  amount: PositiveNumberSchema,
  cost: PositiveNumberSchema,
  timestamp: TimestampSchema,
  info: z.record(z.unknown()).optional(),
});

// =============================================================================
// Funding Rate Schemas
// =============================================================================

export const FundingRateSchema = z.object({
  symbol: SymbolSchema,
  fundingRate: z.number(),
  fundingTimestamp: TimestampSchema,
  nextFundingTimestamp: TimestampSchema,
  markPrice: PositiveNumberSchema,
  indexPrice: PositiveNumberSchema,
  fundingIntervalHours: z.number().positive(),
  info: z.record(z.unknown()).optional(),
});

// =============================================================================
// Balance Schemas
// =============================================================================

export const BalanceSchema = z.object({
  currency: z.string(),
  total: NonNegativeNumberSchema,
  free: NonNegativeNumberSchema,
  used: NonNegativeNumberSchema,
  usdValue: NonNegativeNumberSchema.optional(),
  info: z.record(z.unknown()).optional(),
});

// =============================================================================
// Ticker Schemas
// =============================================================================

export const TickerSchema = z.object({
  symbol: SymbolSchema,
  last: PositiveNumberSchema,
  bid: PositiveNumberSchema,
  bidVolume: NonNegativeNumberSchema.optional(),
  ask: PositiveNumberSchema,
  askVolume: NonNegativeNumberSchema.optional(),
  high: PositiveNumberSchema,
  low: PositiveNumberSchema,
  open: PositiveNumberSchema,
  close: PositiveNumberSchema,
  change: z.number(),
  percentage: z.number(),
  baseVolume: NonNegativeNumberSchema,
  quoteVolume: NonNegativeNumberSchema,
  timestamp: TimestampSchema,
  info: z.record(z.unknown()).optional(),
});

// =============================================================================
// Parameter Schemas
// =============================================================================

export const MarketParamsSchema = z
  .object({
    active: z.boolean().optional(),
    ids: z.array(z.string()).optional(),
  })
  .optional();

export const OrderBookParamsSchema = z
  .object({
    limit: z.number().int().positive().optional(),
  })
  .optional();

export const TradeParamsSchema = z
  .object({
    limit: z.number().int().positive().optional(),
    since: TimestampSchema.optional(),
  })
  .optional();

// =============================================================================
// Type Inference
// =============================================================================

export type OrderRequest = z.infer<typeof OrderRequestSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type Market = z.infer<typeof MarketSchema>;
export type OrderBook = z.infer<typeof OrderBookSchema>;
export type Trade = z.infer<typeof TradeSchema>;
export type FundingRate = z.infer<typeof FundingRateSchema>;
export type Balance = z.infer<typeof BalanceSchema>;
export type Ticker = z.infer<typeof TickerSchema>;
export type MarketParams = z.infer<typeof MarketParamsSchema>;
export type OrderBookParams = z.infer<typeof OrderBookParamsSchema>;
export type TradeParams = z.infer<typeof TradeParamsSchema>;

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Safely parse and validate data with detailed error messages
 */
export function validateData<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context?: string
): T | never {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);

    throw new Error(
      `Validation failed${context ? ` for ${context}` : ''}: ${errors.join(', ')}`
    );
  }

  return result.data;
}

/**
 * Validate array of items
 */
export function validateArray<T>(
  schema: z.ZodType<T>,
  data: unknown[],
  context?: string
): T[] | never {
  return data.map((item, index) => validateData(schema, item, `${context}[${index}]`));
}

/**
 * Lighter-specific type definitions
 */
import { z } from 'zod';
export const LighterOrderSchema = z
    .object({
    orderId: z.string(),
    clientOrderId: z.string().optional(),
    symbol: z.string(),
    side: z.enum(['buy', 'sell']),
    type: z.enum(['market', 'limit']),
    price: z.number().optional(),
    size: z.number(),
    filledSize: z.number(),
    status: z.enum(['open', 'filled', 'cancelled', 'partially_filled']),
    timestamp: z.number(),
    reduceOnly: z.boolean(),
})
    .passthrough();
export const LighterPositionSchema = z
    .object({
    symbol: z.string(),
    side: z.enum(['long', 'short']),
    size: z.number(),
    entryPrice: z.number(),
    markPrice: z.number(),
    liquidationPrice: z.number(),
    unrealizedPnl: z.number(),
    margin: z.number(),
    leverage: z.number(),
})
    .passthrough();
export const LighterBalanceSchema = z
    .object({
    currency: z.string(),
    total: z.number(),
    available: z.number(),
    reserved: z.number(),
})
    .passthrough();
export const LighterFundingRateSchema = z
    .object({
    symbol: z.string(),
    fundingRate: z.number(),
    markPrice: z.number().optional().default(0),
    nextFundingTime: z.number().optional().default(0),
})
    .passthrough();
export const LighterAPIMarketSchema = z
    .object({
    symbol: z.string(),
    market_type: z.string().optional(),
    status: z.string().optional(),
    supported_price_decimals: z.union([z.string(), z.number()]).optional(),
    price_decimals: z.union([z.string(), z.number()]).optional(),
    supported_size_decimals: z.union([z.string(), z.number()]).optional(),
    size_decimals: z.union([z.string(), z.number()]).optional(),
    min_base_amount: z.string().optional(),
    maker_fee: z.string().optional(),
    taker_fee: z.string().optional(),
    max_leverage: z.string().optional(),
    default_initial_margin_fraction: z.number().optional(),
    is_active: z.boolean().optional(),
})
    .passthrough();
export const LighterAPITickerSchema = z
    .object({
    symbol: z.string(),
    last_trade_price: z.union([z.string(), z.number()]).optional(),
    daily_price_high: z.union([z.string(), z.number()]).optional(),
    daily_price_low: z.union([z.string(), z.number()]).optional(),
    daily_base_token_volume: z.union([z.string(), z.number()]).optional(),
    daily_quote_token_volume: z.union([z.string(), z.number()]).optional(),
    daily_price_change: z.union([z.string(), z.number()]).optional(),
})
    .passthrough();
//# sourceMappingURL=types.js.map
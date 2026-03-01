/**
 * Pacifica Exchange-Specific Types
 */
import { z } from 'zod';
// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================
export const PacificaMarketSchema = z
    .object({
    symbol: z.string(),
    base_currency: z.string(),
    quote_currency: z.string(),
    status: z.string(),
    price_step: z.string(),
    size_step: z.string(),
    min_size: z.string(),
    max_leverage: z.number(),
    maker_fee: z.string(),
    taker_fee: z.string(),
    funding_interval: z.number(),
})
    .passthrough();
export const PacificaTickerSchema = z
    .object({
    symbol: z.string(),
    last_price: z.string(),
    mark_price: z.string(),
    index_price: z.string(),
    bid_price: z.string(),
    ask_price: z.string(),
    high_24h: z.string(),
    low_24h: z.string(),
    volume_24h: z.string(),
    quote_volume_24h: z.string(),
    open_interest: z.string(),
    funding_rate: z.string(),
    next_funding_time: z.number(),
    timestamp: z.number(),
})
    .passthrough();
export const PacificaOrderBookLevelSchema = z
    .object({
    price: z.string(),
    size: z.string(),
})
    .passthrough();
export const PacificaOrderBookSchema = z
    .object({
    bids: z.array(PacificaOrderBookLevelSchema),
    asks: z.array(PacificaOrderBookLevelSchema),
    timestamp: z.number(),
    sequence: z.number(),
})
    .passthrough();
export const PacificaTradeResponseSchema = z
    .object({
    id: z.string(),
    symbol: z.string(),
    price: z.union([z.string(), z.number()]),
    size: z.union([z.string(), z.number()]),
    side: z.string(),
    timestamp: z.number(),
})
    .passthrough();
export const PacificaFundingHistorySchema = z
    .object({
    symbol: z.string(),
    funding_rate: z.string(),
    mark_price: z.string(),
    index_price: z.string(),
    timestamp: z.number(),
})
    .passthrough();
export const PacificaOrderResponseSchema = z
    .object({
    order_id: z.string(),
    client_order_id: z.string().optional(),
    symbol: z.string(),
    side: z.string(),
    type: z.string(),
    price: z.union([z.string(), z.number()]).optional(),
    size: z.union([z.string(), z.number()]),
    filled_size: z.union([z.string(), z.number()]),
    avg_fill_price: z.union([z.string(), z.number()]).optional(),
    status: z.string(),
    reduce_only: z.boolean(),
    post_only: z.boolean(),
    created_at: z.number(),
    updated_at: z.number(),
})
    .passthrough();
export const PacificaPositionSchema = z
    .object({
    symbol: z.string(),
    side: z.string(),
    size: z.union([z.string(), z.number()]),
    entry_price: z.union([z.string(), z.number()]),
    mark_price: z.union([z.string(), z.number()]),
    liquidation_price: z.union([z.string(), z.number()]),
    unrealized_pnl: z.union([z.string(), z.number()]),
    realized_pnl: z.union([z.string(), z.number()]),
    leverage: z.number(),
    margin_mode: z.string(),
    margin: z.union([z.string(), z.number()]),
    maintenance_margin: z.union([z.string(), z.number()]),
    timestamp: z.number(),
})
    .passthrough();
export const PacificaAccountInfoSchema = z
    .object({
    total_equity: z.string(),
    available_balance: z.string(),
    used_margin: z.string(),
    unrealized_pnl: z.string(),
    currency: z.string(),
})
    .passthrough();
//# sourceMappingURL=types.js.map
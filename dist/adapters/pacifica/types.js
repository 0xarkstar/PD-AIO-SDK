/**
 * Pacifica Exchange-Specific Types
 *
 * Based on real API responses from https://api.pacifica.fi/api/v1
 * @see https://docs.pacifica.fi/api-documentation/api/rest-api
 */
import { z } from 'zod';
// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================
export const PacificaApiResponseSchema = (dataSchema) => z.object({
    success: z.boolean(),
    data: dataSchema,
});
export const PacificaMarketSchema = z
    .object({
    symbol: z.string(),
    tick_size: z.string(),
    lot_size: z.string(),
    min_tick: z.string().optional(),
    max_tick: z.string().optional(),
    max_leverage: z.number(),
    isolated_only: z.boolean().optional(),
    min_order_size: z.string().optional(),
    max_order_size: z.string().optional(),
    funding_rate: z.string().optional(),
    next_funding_rate: z.string().optional(),
    created_at: z.number().optional(),
})
    .passthrough();
export const PacificaTickerSchema = z
    .object({
    symbol: z.string(),
    mark: z.string(),
    mid: z.string(),
    oracle: z.string(),
    funding: z.string(),
    next_funding: z.string(),
    open_interest: z.string(),
    volume_24h: z.string(),
    yesterday_price: z.string(),
    timestamp: z.number(),
})
    .passthrough();
export const PacificaOrderBookLevelSchema = z
    .object({
    p: z.string(),
    a: z.string(),
    n: z.number(),
})
    .passthrough();
export const PacificaOrderBookSchema = z
    .object({
    s: z.string(),
    l: z.array(z.array(PacificaOrderBookLevelSchema)),
    t: z.number(),
})
    .passthrough();
export const PacificaTradeResponseSchema = z
    .object({
    event_type: z.string(),
    price: z.union([z.string(), z.number()]),
    amount: z.union([z.string(), z.number()]),
    side: z.string(),
    cause: z.string().optional(),
    created_at: z.number(),
})
    .passthrough();
export const PacificaFundingHistorySchema = z
    .object({
    oracle_price: z.string(),
    bid_impact_price: z.string().optional(),
    ask_impact_price: z.string().optional(),
    funding_rate: z.string(),
    next_funding_rate: z.string().optional(),
    created_at: z.number(),
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
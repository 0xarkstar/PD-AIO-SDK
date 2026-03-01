/**
 * Paradex-specific type definitions
 */
import { z } from 'zod';
export const ParadexMarketSchema = z
    .object({
    symbol: z.string(),
    base_currency: z.string(),
    quote_currency: z.string(),
    settlement_currency: z.string(),
    status: z.string(),
    min_order_size: z.string(),
    max_order_size: z.string(),
    tick_size: z.string(),
    step_size: z.string(),
    maker_fee_rate: z.string(),
    taker_fee_rate: z.string(),
    max_leverage: z.string(),
    is_active: z.boolean(),
})
    .passthrough();
export const ParadexOrderSchema = z
    .object({
    id: z.string(),
    client_id: z.string().optional(),
    market: z.string(),
    side: z.string(),
    type: z.string(),
    size: z.string(),
    price: z.string().optional(),
    filled_size: z.string(),
    avg_fill_price: z.string().optional(),
    status: z.string(),
    time_in_force: z.string(),
    post_only: z.boolean(),
    reduce_only: z.boolean(),
    created_at: z.number(),
    updated_at: z.number(),
})
    .passthrough();
export const ParadexPositionSchema = z
    .object({
    market: z.string(),
    side: z.string(),
    size: z.string(),
    entry_price: z.string(),
    mark_price: z.string(),
    liquidation_price: z.string().optional(),
    unrealized_pnl: z.string(),
    realized_pnl: z.string(),
    margin: z.string(),
    leverage: z.string(),
    last_updated: z.number(),
})
    .passthrough();
export const ParadexBalanceSchema = z
    .object({
    asset: z.string(),
    total: z.string(),
    available: z.string(),
    locked: z.string(),
})
    .passthrough();
export const ParadexOrderBookSchema = z
    .object({
    market: z.string(),
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
    timestamp: z.number(),
    sequence: z.number(),
})
    .passthrough();
export const ParadexTradeSchema = z
    .object({
    id: z.string(),
    market: z.string(),
    side: z.string(),
    price: z.string(),
    size: z.string(),
    timestamp: z.number(),
})
    .passthrough();
export const ParadexTickerSchema = z
    .object({
    market: z.string(),
    last_price: z.string(),
    bid: z.string(),
    ask: z.string(),
    high_24h: z.string(),
    low_24h: z.string(),
    volume_24h: z.string(),
    price_change_24h: z.string(),
    price_change_percent_24h: z.string(),
    timestamp: z.number(),
})
    .passthrough();
export const ParadexFundingRateSchema = z
    .object({
    market: z.string(),
    rate: z.string(),
    timestamp: z.number(),
    next_funding_time: z.number(),
    mark_price: z.string(),
    index_price: z.string(),
})
    .passthrough();
export const ParadexAPIMarketSchema = z
    .object({
    symbol: z.string(),
    base_currency: z.string(),
    quote_currency: z.string(),
    settlement_currency: z.string(),
    status: z.string().optional(),
    is_active: z.boolean().optional(),
    open_at: z.number().optional(),
    price_tick_size: z.string().optional(),
    order_size_increment: z.string().optional(),
    min_notional: z.string().optional(),
    funding_period_hours: z.number().optional(),
    fee_config: z
        .object({
        api_fee: z
            .object({
            maker_fee: z.object({ fee: z.string().optional() }).passthrough().optional(),
            taker_fee: z.object({ fee: z.string().optional() }).passthrough().optional(),
        })
            .passthrough()
            .optional(),
    })
        .passthrough()
        .optional(),
    delta1_cross_margin_params: z
        .object({
        imf_base: z.string().optional(),
    })
        .passthrough()
        .optional(),
    tick_size: z.string().optional(),
    step_size: z.string().optional(),
    min_order_size: z.string().optional(),
    max_order_size: z.string().optional(),
    maker_fee_rate: z.string().optional(),
    taker_fee_rate: z.string().optional(),
    max_leverage: z.string().optional(),
})
    .passthrough();
//# sourceMappingURL=types.js.map
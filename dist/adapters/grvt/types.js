/**
 * GRVT-specific type definitions
 */
// =============================================================================
// Zod Validation Schemas
// =============================================================================
import { z } from 'zod';
/**
 * GRVT Market Schema
 */
export const GRVTMarketSchema = z.object({
    instrument_id: z.string(),
    instrument: z.string(),
    base_currency: z.string(),
    quote_currency: z.string(),
    settlement_currency: z.string(),
    instrument_type: z.enum(['PERP', 'SPOT']),
    is_active: z.boolean(),
    maker_fee: z.string(),
    taker_fee: z.string(),
    max_leverage: z.string(),
    min_size: z.string(),
    max_size: z.string(),
    tick_size: z.string(),
    step_size: z.string(),
    mark_price: z.string(),
    index_price: z.string(),
    funding_rate: z.string().optional(),
    next_funding_time: z.number().optional(),
    open_interest: z.string().optional(),
});
/**
 * GRVT Order Book Schema
 */
export const GRVTOrderBookSchema = z.object({
    instrument: z.string(),
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
    timestamp: z.number(),
    sequence: z.number(),
});
/**
 * GRVT Order Schema
 */
export const GRVTOrderSchema = z.object({
    order_id: z.string(),
    client_order_id: z.string().optional(),
    instrument: z.string(),
    order_type: z.enum(['MARKET', 'LIMIT', 'LIMIT_MAKER']),
    side: z.enum(['BUY', 'SELL']),
    size: z.string(),
    price: z.string().optional(),
    time_in_force: z.enum(['GTC', 'IOC', 'FOK', 'POST_ONLY']),
    reduce_only: z.boolean(),
    post_only: z.boolean(),
    status: z.enum(['PENDING', 'OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED']),
    filled_size: z.string(),
    average_fill_price: z.string().optional(),
    created_at: z.number(),
    updated_at: z.number(),
});
/**
 * GRVT Position Schema
 */
export const GRVTPositionSchema = z.object({
    instrument: z.string(),
    side: z.enum(['LONG', 'SHORT']),
    size: z.string(),
    entry_price: z.string(),
    mark_price: z.string(),
    liquidation_price: z.string().optional(),
    unrealized_pnl: z.string(),
    realized_pnl: z.string(),
    margin: z.string(),
    leverage: z.string(),
    timestamp: z.number(),
});
/**
 * GRVT Balance Schema
 */
export const GRVTBalanceSchema = z.object({
    currency: z.string(),
    total: z.string(),
    available: z.string(),
    reserved: z.string(),
    unrealized_pnl: z.string(),
});
/**
 * GRVT Trade Schema
 */
export const GRVTTradeSchema = z.object({
    trade_id: z.string(),
    instrument: z.string(),
    side: z.enum(['BUY', 'SELL']),
    price: z.string(),
    size: z.string(),
    timestamp: z.number(),
    is_buyer_maker: z.boolean(),
});
/**
 * GRVT Ticker Schema
 */
export const GRVTTickerSchema = z.object({
    instrument: z.string(),
    last_price: z.string(),
    best_bid: z.string(),
    best_ask: z.string(),
    volume_24h: z.string(),
    high_24h: z.string(),
    low_24h: z.string(),
    price_change_24h: z.string(),
    timestamp: z.number(),
});
//# sourceMappingURL=types.js.map
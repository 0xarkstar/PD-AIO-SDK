/**
 * Nado Exchange Type Definitions
 *
 * TypeScript types and Zod schemas for Nado API requests and responses.
 *
 * @see https://docs.nado.xyz
 */
import { z } from 'zod';
export const NadoResponseSchema = (dataSchema) => z.object({
    status: z.enum(['success', 'failure']),
    data: dataSchema.optional(),
    error: z.string().optional(),
    error_code: z.number().optional(),
    request_type: z.string().optional(),
});
export const NadoSymbolSchema = z.object({
    type: z.enum(['perp', 'spot']),
    product_id: z.number(),
    symbol: z.string(),
    price_increment_x18: z.string(),
    size_increment: z.string(),
    min_size: z.string(),
    maker_fee_rate_x18: z.string(),
    taker_fee_rate_x18: z.string(),
    long_weight_initial_x18: z.string(),
    long_weight_maintenance_x18: z.string(),
    max_open_interest_x18: z.string().nullable().optional(),
});
/**
 * @deprecated Use NadoSymbolSchema instead
 */
export const NadoProductSchema = z.object({
    product_id: z.number(),
    symbol: z.string(),
    base_currency: z.string(),
    quote_currency: z.string(),
    contract_size: z.string(),
    tick_size: z.string(),
    min_size: z.string(),
    max_position_size: z.string().optional(),
    maker_fee: z.string(),
    taker_fee: z.string(),
    is_active: z.boolean(),
    product_type: z.enum(['perpetual', 'spot', 'future']),
});
export const NadoOrderBookSchema = z.object({
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
});
export const NadoOrderSchema = z.object({
    order_id: z.string(),
    digest: z.string(),
    product_id: z.number(),
    sender: z.string(),
    price_x18: z.string(),
    amount: z.string(),
    side: z.union([z.literal(0), z.literal(1)]),
    expiration: z.number(),
    nonce: z.number(),
    status: z.enum(['open', 'filled', 'cancelled', 'expired', 'rejected']),
    filled_amount: z.string(),
    remaining_amount: z.string(),
    avg_fill_price: z.string().optional(),
    timestamp: z.number(),
    is_reduce_only: z.boolean().optional(),
    post_only: z.boolean().optional(),
    time_in_force: z.enum(['gtc', 'ioc', 'fok']).optional(),
});
export const NadoPositionSchema = z.object({
    product_id: z.number(),
    subaccount: z.string(),
    size: z.string(),
    entry_price: z.string(),
    mark_price: z.string(),
    liquidation_price: z.string().optional(),
    unrealized_pnl: z.string(),
    realized_pnl: z.string(),
    leverage: z.string(),
    margin: z.string(),
    timestamp: z.number(),
});
export const NadoBalanceSchema = z.object({
    subaccount: z.string(),
    quote_balance: z.string(),
    total_equity: z.string(),
    used_margin: z.string(),
    free_margin: z.string(),
    unrealized_pnl: z.string(),
    health: z.string(),
    timestamp: z.number(),
});
export const NadoTradeSchema = z.object({
    trade_id: z.string(),
    product_id: z.number(),
    price: z.string(),
    size: z.string(),
    side: z.union([z.literal(0), z.literal(1)]),
    timestamp: z.number(),
    is_maker: z.boolean(),
});
export const NadoTickerSchema = z.object({
    product_id: z.number(),
    bid_x18: z.string(),
    ask_x18: z.string(),
});
export const NadoContractsSchema = z.object({
    chain_id: z.string(),
    endpoint_addr: z.string(),
    products: z
        .record(z.string(), z.object({
        address: z.string(),
        symbol: z.string(),
    }))
        .optional(),
});
//# sourceMappingURL=types.js.map
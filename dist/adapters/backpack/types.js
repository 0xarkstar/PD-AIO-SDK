/**
 * Backpack-specific type definitions
 */
import { z } from 'zod';
export const BackpackMarketSchema = z
    .object({
    symbol: z.string(),
    baseSymbol: z.string().optional(),
    quoteSymbol: z.string().optional(),
    marketType: z.enum(['SPOT', 'PERP']).optional(),
    orderBookState: z.string().optional(),
    visible: z.boolean().optional(),
    filters: z
        .object({
        price: z
            .object({
            tickSize: z.string(),
            minPrice: z.string().optional(),
            maxPrice: z.string().nullable().optional(),
        })
            .optional(),
        quantity: z
            .object({
            stepSize: z.string(),
            minQuantity: z.string(),
            maxQuantity: z.string().nullable().optional(),
        })
            .optional(),
    })
        .optional(),
    fundingInterval: z.number().nullable().optional(),
    imfFunction: z.unknown().optional(),
    mmfFunction: z.unknown().optional(),
    positionLimitWeight: z.unknown().optional(),
    openInterestLimit: z.string().optional(),
})
    .passthrough();
export const BackpackOrderSchema = z
    .object({
    order_id: z.string(),
    client_order_id: z.string().optional(),
    market: z.string(),
    side: z.string(),
    type: z.string(),
    size: z.string(),
    price: z.string().optional(),
    filled_size: z.string(),
    avg_price: z.string().optional(),
    status: z.string(),
    time_in_force: z.string().optional(),
    post_only: z.boolean().optional(),
    reduce_only: z.boolean().optional(),
    created_at: z.number().optional(),
    updated_at: z.number().optional(),
})
    .passthrough();
export const BackpackPositionSchema = z
    .object({
    market: z.string(),
    side: z.string().optional(),
    size: z.string().optional(),
    entry_price: z.string().optional(),
    mark_price: z.string().optional(),
    liquidation_price: z.string().optional(),
    unrealized_pnl: z.string().optional(),
    realized_pnl: z.string().optional(),
    margin: z.string().optional(),
    leverage: z.string().optional(),
    timestamp: z.number().optional(),
})
    .passthrough();
export const BackpackBalanceSchema = z
    .object({
    asset: z.string(),
    total: z.string(),
    available: z.string(),
    locked: z.string(),
})
    .passthrough();
export const BackpackOrderBookSchema = z
    .object({
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
    lastUpdateId: z.union([z.string(), z.number()]).optional(),
})
    .passthrough();
export const BackpackTradeSchema = z
    .object({
    id: z.union([z.number(), z.string()]),
    price: z.string(),
    quantity: z.string(),
    quoteQuantity: z.string().optional(),
    timestamp: z.number().optional(),
    isBuyerMaker: z.boolean(),
})
    .passthrough();
export const BackpackTickerSchema = z
    .object({
    symbol: z.string(),
    firstPrice: z.string().optional(),
    lastPrice: z.string().optional(),
    high: z.string().optional(),
    low: z.string().optional(),
    volume: z.string().optional(),
    quoteVolume: z.string().optional(),
    priceChange: z.string().optional(),
    priceChangePercent: z.string().optional(),
    trades: z.string().optional(),
})
    .passthrough();
export const BackpackFundingRateSchema = z
    .object({
    symbol: z.string(),
    fundingRate: z.string().default('0'),
    intervalEndTimestamp: z.string().optional().default(new Date().toISOString()),
})
    .passthrough();
//# sourceMappingURL=types.js.map
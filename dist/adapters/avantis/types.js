/**
 * Avantis Exchange-Specific Types
 */
import { z } from 'zod';
export const AvantisPairInfoSchema = z
    .object({
    pairIndex: z.number(),
    from: z.string(),
    to: z.string(),
    spreadP: z.string(),
    groupIndex: z.number(),
    feeIndex: z.number(),
})
    .passthrough();
export const AvantisOpenTradeSchema = z
    .object({
    trader: z.string(),
    pairIndex: z.number(),
    index: z.number(),
    initialPosToken: z.string(),
    positionSizeDai: z.string(),
    openPrice: z.string(),
    buy: z.boolean(),
    leverage: z.string(),
    tp: z.string(),
    sl: z.string(),
})
    .passthrough();
export const AvantisOpenLimitOrderSchema = z
    .object({
    trader: z.string(),
    pairIndex: z.number(),
    index: z.number(),
    positionSize: z.string(),
    buy: z.boolean(),
    leverage: z.string(),
    tp: z.string(),
    sl: z.string(),
    minPrice: z.string(),
    maxPrice: z.string(),
    block: z.number(),
    tokenId: z.number(),
})
    .passthrough();
export const AvantisPythPriceSchema = z
    .object({
    price: z.string(),
    conf: z.string(),
    expo: z.number(),
    publishTime: z.number(),
})
    .passthrough();
export const AvantisFundingFeesSchema = z
    .object({
    accPerOiLong: z.string(),
    accPerOiShort: z.string(),
    lastUpdateBlock: z.number(),
})
    .passthrough();
export const AvantisOrderParamsSchema = z
    .object({
    trader: z.string(),
    pairIndex: z.number(),
    index: z.number(),
    initialPosToken: z.number(),
    positionSizeDai: z.string(),
    openPrice: z.string(),
    buy: z.boolean(),
    leverage: z.number(),
    tp: z.string(),
    sl: z.string(),
})
    .passthrough();
export const AvantisBalanceSchema = z
    .object({
    asset: z.string(),
    balance: z.string(),
    decimals: z.number(),
})
    .passthrough();
//# sourceMappingURL=types.js.map
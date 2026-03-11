/**
 * Ostium Exchange-Specific Types
 */
import { z } from 'zod';
// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================
export const OstiumPairInfoSchema = z
    .object({
    pairIndex: z.number(),
    name: z.string(),
    from: z.string(),
    to: z.string(),
    groupIndex: z.number(),
    groupName: z.string(),
    spreadP: z.string(),
    maxLeverage: z.number(),
    minLeverage: z.number(),
    maxPositionSize: z.string(),
    minPositionSize: z.string(),
    feedId: z.string(),
})
    .passthrough();
export const OstiumPriceResponseSchema = z
    .object({
    pair: z.string().optional(),
    price: z.string().optional(),
    timestamp: z.number().optional(),
    source: z.string().optional(),
    mid: z.union([z.string(), z.number()]).optional(),
    bid: z.union([z.string(), z.number()]).optional(),
    ask: z.union([z.string(), z.number()]).optional(),
    timestampSeconds: z.number().optional(),
})
    .passthrough();
export const OstiumOpenTradeSchema = z
    .object({
    trader: z.string(),
    pairIndex: z.number(),
    index: z.number(),
    positionSizeDai: z.string(),
    openPrice: z.string(),
    buy: z.boolean(),
    leverage: z.number(),
    tp: z.string(),
    sl: z.string(),
    timestamp: z.number(),
})
    .passthrough();
export const OstiumSubgraphTradeSchema = z
    .object({
    id: z.string(),
    trader: z.string(),
    pairIndex: z.string(),
    action: z.string(),
    price: z.string(),
    size: z.string(),
    buy: z.boolean(),
    leverage: z.string(),
    pnl: z.string(),
    timestamp: z.string(),
    txHash: z.string(),
})
    .passthrough();
export const OstiumSubgraphPositionSchema = z
    .object({
    id: z.string(),
    trader: z.string(),
    pairIndex: z.string(),
    index: z.string(),
    positionSizeDai: z.string(),
    openPrice: z.string(),
    buy: z.boolean(),
    leverage: z.string(),
    tp: z.string(),
    sl: z.string(),
    timestamp: z.string(),
})
    .passthrough();
//# sourceMappingURL=types.js.map
/**
 * Hyperliquid Exchange-Specific Types
 */
import { z } from 'zod';
export const HyperliquidMetaSchema = z
    .object({
    universe: z.array(z.any()),
})
    .passthrough();
export const HyperliquidAssetSchema = z
    .object({
    name: z.string(),
    szDecimals: z.number(),
    maxLeverage: z.number(),
    onlyIsolated: z.boolean(),
})
    .passthrough();
export const HyperliquidOrderResponseSchema = z
    .object({
    status: z.enum(['ok', 'err']),
    response: z
        .object({
        type: z.literal('order'),
        data: z
            .object({
            statuses: z.array(z.any()),
        })
            .passthrough(),
    })
        .passthrough(),
})
    .passthrough();
export const HyperliquidOpenOrderSchema = z
    .object({
    coin: z.string(),
    side: z.string(),
    limitPx: z.string(),
    sz: z.string(),
    oid: z.number(),
    timestamp: z.number(),
    origSz: z.string(),
    cloid: z.string().optional(),
})
    .passthrough();
export const HyperliquidUserStateSchema = z
    .object({
    assetPositions: z.array(z.any()).optional(),
    crossMarginSummary: z.any().optional(),
    marginSummary: z.any().optional(),
    withdrawable: z.string().optional(),
})
    .passthrough();
export const HyperliquidPositionSchema = z
    .object({
    position: z
        .object({
        coin: z.string(),
        entryPx: z.string().optional(),
        leverage: z.any().optional(),
        liquidationPx: z.string().nullable().optional(),
        marginUsed: z.string().optional(),
        positionValue: z.string().optional(),
        returnOnEquity: z.string().optional(),
        szi: z.string().optional(),
        unrealizedPnl: z.string().optional(),
    })
        .passthrough(),
    type: z.any().optional(),
})
    .passthrough();
export const HyperliquidL2LevelSchema = z
    .object({
    px: z.string(),
    sz: z.string(),
    n: z.number(),
})
    .passthrough();
export const HyperliquidL2BookSchema = z
    .object({
    coin: z.string(),
    levels: z.tuple([z.array(HyperliquidL2LevelSchema), z.array(HyperliquidL2LevelSchema)]),
    time: z.number(),
})
    .passthrough();
export const HyperliquidAllMidsSchema = z.record(z.string(), z.string());
export const HyperliquidAllMidsWsMessageSchema = z
    .object({
    mids: z.record(z.string(), z.string()),
})
    .passthrough();
export const HyperliquidFundingRateSchema = z
    .object({
    coin: z.string(),
    fundingRate: z.string(),
    premium: z.string(),
    time: z.number(),
})
    .passthrough();
export const HyperliquidWsTradeSchema = z
    .object({
    coin: z.string(),
    side: z.string(),
    px: z.string(),
    sz: z.string(),
    time: z.number(),
    hash: z.string(),
})
    .passthrough();
export const HyperliquidFillSchema = z
    .object({
    coin: z.string(),
    px: z.string(),
    sz: z.string(),
    side: z.string(),
    time: z.number(),
    startPosition: z.string(),
    dir: z.string(),
    closedPnl: z.string(),
    hash: z.string(),
    oid: z.number(),
    crossed: z.boolean(),
    fee: z.string(),
    tid: z.number(),
})
    .passthrough();
export const HyperliquidHistoricalOrderSchema = z
    .object({
    order: z
        .object({
        coin: z.string(),
        side: z.string(),
        limitPx: z.string(),
        sz: z.string(),
        oid: z.number(),
        timestamp: z.number(),
        origSz: z.string(),
        cloid: z.string().optional(),
        orderType: z.string().optional(),
    })
        .passthrough(),
    status: z.string(),
    statusTimestamp: z.number(),
})
    .passthrough();
export const HyperliquidUserFillSchema = z
    .object({
    coin: z.string(),
    px: z.string(),
    sz: z.string(),
    side: z.string(),
    time: z.number(),
    startPosition: z.string(),
    dir: z.string(),
    closedPnl: z.string(),
    hash: z.string(),
    oid: z.number(),
    crossed: z.boolean(),
    fee: z.string(),
    tid: z.number(),
    feeToken: z.string(),
})
    .passthrough();
//# sourceMappingURL=types.js.map
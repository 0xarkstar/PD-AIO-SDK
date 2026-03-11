/**
 * Reya Exchange-Specific Types
 */
import { z } from 'zod';
export const ReyaMarketDefinitionSchema = z
    .object({
    symbol: z.string(),
    marketId: z.number(),
    minOrderQty: z.string(),
    qtyStepSize: z.string(),
    tickSize: z.string(),
    liquidationMarginParameter: z.string(),
    initialMarginParameter: z.string(),
    maxLeverage: z.number(),
    oiCap: z.string(),
})
    .passthrough();
export const ReyaMarketSummarySchema = z
    .object({
    symbol: z.string(),
    updatedAt: z.number(),
    longOiQty: z.string(),
    shortOiQty: z.string(),
    oiQty: z.string(),
    fundingRate: z.string(),
    longFundingValue: z.string(),
    shortFundingValue: z.string(),
    fundingRateVelocity: z.string(),
    volume24h: z.string(),
    pxChange24h: z.string().optional(),
    throttledOraclePrice: z.string().optional(),
    throttledPoolPrice: z.string().optional(),
    pricesUpdatedAt: z.number().optional(),
})
    .passthrough();
export const ReyaPriceSchema = z
    .object({
    symbol: z.string(),
    oraclePrice: z.string(),
    poolPrice: z.string().optional(),
    updatedAt: z.number(),
})
    .passthrough();
export const ReyaDepthLevelSchema = z
    .object({
    px: z.string(),
    qty: z.string(),
})
    .passthrough();
export const ReyaDepthSchema = z
    .object({
    symbol: z.string(),
    type: z.enum(['SNAPSHOT', 'UPDATE']),
    bids: z.array(ReyaDepthLevelSchema),
    asks: z.array(ReyaDepthLevelSchema),
    updatedAt: z.number(),
})
    .passthrough();
export const ReyaPerpExecutionSchema = z
    .object({
    exchangeId: z.number(),
    symbol: z.string(),
    accountId: z.number(),
    qty: z.string(),
    side: z.enum(['B', 'A']),
    price: z.string(),
    fee: z.string(),
    type: z.enum(['ORDER_MATCH', 'LIQUIDATION', 'ADL']),
    timestamp: z.number(),
    sequenceNumber: z.number(),
})
    .passthrough();
export const ReyaOrderSchema = z
    .object({
    exchangeId: z.number(),
    symbol: z.string(),
    accountId: z.number(),
    orderId: z.string(),
    qty: z.string().optional(),
    execQty: z.string().optional(),
    cumQty: z.string().optional(),
    side: z.enum(['B', 'A']),
    limitPx: z.string(),
    orderType: z.enum(['LIMIT', 'TP', 'SL']),
    triggerPx: z.string().optional(),
    timeInForce: z.enum(['IOC', 'GTC']).optional(),
    reduceOnly: z.boolean().optional(),
    status: z.enum(['OPEN', 'FILLED', 'CANCELLED', 'REJECTED']),
    createdAt: z.number(),
    lastUpdateAt: z.number(),
})
    .passthrough();
export const ReyaPositionSchema = z
    .object({
    exchangeId: z.number(),
    symbol: z.string(),
    accountId: z.number(),
    qty: z.string(),
    side: z.enum(['B', 'A']),
    avgEntryPrice: z.string(),
    avgEntryFundingValue: z.string(),
    lastTradeSequenceNumber: z.number(),
})
    .passthrough();
export const ReyaAccountBalanceSchema = z
    .object({
    accountId: z.number(),
    asset: z.string(),
    realBalance: z.string(),
    balanceDEPRECATED: z.string(),
})
    .passthrough();
export const ReyaAccountSchema = z
    .object({
    accountId: z.number(),
    name: z.string(),
    type: z.enum(['MAINPERP', 'SUBPERP', 'SPOT']),
})
    .passthrough();
export const ReyaCandleHistoryDataSchema = z
    .object({
    t: z.array(z.number()),
    o: z.array(z.string()),
    h: z.array(z.string()),
    l: z.array(z.string()),
    c: z.array(z.string()),
})
    .passthrough();
export const ReyaCreateOrderResponseSchema = z
    .object({
    status: z.enum(['OPEN', 'FILLED', 'CANCELLED', 'REJECTED']),
    execQty: z.string().optional(),
    cumQty: z.string().optional(),
    orderId: z.string().optional(),
    clientOrderId: z.number().optional(),
})
    .passthrough();
export const ReyaCancelOrderResponseSchema = z
    .object({
    status: z.enum(['OPEN', 'FILLED', 'CANCELLED', 'REJECTED']),
    orderId: z.string(),
    clientOrderId: z.number().optional(),
})
    .passthrough();
export const ReyaMassCancelResponseSchema = z
    .object({
    cancelledCount: z.number(),
})
    .passthrough();
export const ReyaPerpExecutionListSchema = z
    .object({
    data: z.array(ReyaPerpExecutionSchema),
    meta: z
        .object({
        limit: z.number(),
        count: z.number(),
        endTime: z.number().optional(),
        startTime: z.number().optional(),
    })
        .passthrough(),
})
    .passthrough();
export const ReyaAssetDefinitionSchema = z
    .object({
    asset: z.string(),
    spotMarketSymbol: z.string().optional(),
    priceHaircut: z.string(),
    liquidationDiscount: z.string(),
    status: z.enum(['ENABLED', 'WITHDRAWAL_ONLY']),
    decimals: z.number(),
    displayDecimals: z.number(),
})
    .passthrough();
export const ReyaFeeTierParametersSchema = z
    .object({
    tierId: z.number(),
    takerFee: z.string(),
    makerFee: z.string(),
    volume14d: z.string(),
    tierType: z.enum(['REGULAR', 'VIP']),
})
    .passthrough();
//# sourceMappingURL=types.js.map
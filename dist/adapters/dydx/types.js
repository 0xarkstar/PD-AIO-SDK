/**
 * dYdX v4 Exchange-Specific Types
 *
 * Type definitions for dYdX v4 Indexer API responses and WebSocket messages
 */
import { z } from 'zod';
export const DydxPerpetualMarketSchema = z
    .object({
    ticker: z.string(),
    status: z.string().optional(),
    baseAsset: z.string().optional(),
    quoteAsset: z.string().optional(),
    oraclePrice: z.string().optional(),
    priceChange24H: z.string().optional(),
    volume24H: z.string().optional(),
    trades24H: z.union([z.number(), z.string()]).optional(),
    openInterest: z.string().optional(),
    openInterestUSDC: z.string().optional(),
    nextFundingRate: z.string().optional(),
    nextFundingAt: z.string().optional(),
    initialMarginFraction: z.string().optional(),
    maintenanceMarginFraction: z.string().optional(),
    stepSize: z.string().optional(),
    stepBaseQuantums: z.number().optional(),
    subticksPerTick: z.number().optional(),
    tickSize: z.string().optional(),
    atomicResolution: z.number().optional(),
    quantumConversionExponent: z.number().optional(),
    basePositionNotional: z.string().optional(),
})
    .passthrough();
export const DydxPerpetualMarketsResponseSchema = z
    .object({
    markets: z.record(z.string(), DydxPerpetualMarketSchema),
})
    .passthrough();
export const DydxOrderBookLevelSchema = z
    .object({
    price: z.string(),
    size: z.string(),
})
    .passthrough();
export const DydxOrderBookResponseSchema = z
    .object({
    bids: z.array(DydxOrderBookLevelSchema),
    asks: z.array(DydxOrderBookLevelSchema),
})
    .passthrough();
export const DydxTradeSchema = z
    .object({
    id: z.string(),
    side: z.string(),
    size: z.string(),
    price: z.string(),
    type: z.string(),
    createdAt: z.string(),
    createdAtHeight: z.string(),
})
    .passthrough();
export const DydxTradesResponseSchema = z
    .object({
    trades: z.array(DydxTradeSchema),
})
    .passthrough();
export const DydxOrderSchema = z
    .object({
    id: z.string(),
    subaccountId: z.string().optional(),
    clientId: z.union([z.string(), z.null()]).optional(),
    clobPairId: z.union([z.string(), z.number()]).optional(),
    side: z.string().optional(),
    size: z.string().optional(),
    price: z.union([z.string(), z.null()]).optional(),
    totalFilled: z.string().optional(),
    goodTilBlock: z.union([z.string(), z.number(), z.null()]).optional(),
    goodTilBlockTime: z.union([z.string(), z.number(), z.null()]).optional(),
    status: z.string().optional(),
    type: z.string().optional(),
    timeInForce: z.string().optional(),
    postOnly: z.boolean().optional(),
    reduceOnly: z.boolean().optional(),
    ticker: z.string().optional(),
    orderFlags: z.string().optional(),
    triggerPrice: z.union([z.string(), z.null()]).optional(),
    createdAtHeight: z.string().optional(),
    updatedAt: z.string().optional(),
    updatedAtHeight: z.string().optional(),
    clientMetadata: z.string().optional(),
    removalReason: z.union([z.string(), z.null()]).optional(),
})
    .passthrough();
export const DydxOrdersResponseSchema = z
    .object({
    orders: z.array(DydxOrderSchema).optional(),
})
    .passthrough();
export const DydxFillSchema = z
    .object({
    id: z.string(),
    side: z.string().optional(),
    liquidity: z.string().optional(),
    type: z.string().optional(),
    market: z.string().optional(),
    marketType: z.string().optional(),
    price: z.string().optional(),
    size: z.string().optional(),
    fee: z.string().optional(),
    createdAt: z.string().optional(),
    createdAtHeight: z.string().optional(),
    orderId: z.string().optional(),
    clientMetadata: z.string().optional(),
    subaccountNumber: z.number().optional(),
})
    .passthrough();
export const DydxFillsResponseSchema = z
    .object({
    fills: z.array(DydxFillSchema),
})
    .passthrough();
export const DydxPerpetualPositionSchema = z
    .object({
    market: z.string(),
    status: z.string().optional(),
    side: z.string().optional(),
    size: z.string().optional(),
    maxSize: z.string().optional(),
    entryPrice: z.string().optional(),
    exitPrice: z.string().optional().nullable(),
    realizedPnl: z.string().optional(),
    unrealizedPnl: z.string().optional(),
    createdAt: z.string().optional(),
    createdAtHeight: z.string().optional(),
    closedAt: z.string().optional().nullable(),
    sumOpen: z.string().optional(),
    sumClose: z.string().optional(),
    netFunding: z.string().optional(),
    subaccountNumber: z.number().optional(),
})
    .passthrough();
export const DydxAssetPositionSchema = z
    .object({
    symbol: z.string(),
    side: z.string(),
    size: z.string(),
    assetId: z.string(),
    subaccountNumber: z.number(),
})
    .passthrough();
export const DydxSubaccountSchema = z
    .object({
    address: z.string().optional(),
    subaccountNumber: z.number().optional(),
    equity: z.string().optional(),
    freeCollateral: z.string().optional(),
    pendingDeposits: z.string().optional(),
    pendingWithdrawals: z.string().optional(),
    marginEnabled: z.boolean().optional(),
    updatedAtHeight: z.string().optional(),
    latestProcessedBlockHeight: z.string().optional(),
    openPerpetualPositions: z.any().optional(),
    assetPositions: z.any().optional(),
})
    .passthrough();
export const DydxSubaccountResponseSchema = z
    .object({
    subaccount: DydxSubaccountSchema,
})
    .passthrough();
export const DydxSubaccountsResponseSchema = z
    .object({
    subaccounts: z.array(DydxSubaccountSchema),
})
    .passthrough();
export const DydxHistoricalFundingSchema = z
    .object({
    ticker: z.string(),
    rate: z.string(),
    price: z.string(),
    effectiveAt: z.string(),
    effectiveAtHeight: z.string(),
})
    .passthrough();
export const DydxHistoricalFundingResponseSchema = z
    .object({
    historicalFunding: z.array(DydxHistoricalFundingSchema),
})
    .passthrough();
export const DydxCandleSchema = z
    .object({
    startedAt: z.string().optional(),
    ticker: z.string().optional(),
    resolution: z.string().optional(),
    low: z.string().optional(),
    high: z.string().optional(),
    open: z.string().optional(),
    close: z.string().optional(),
    baseTokenVolume: z.string().optional(),
    usdVolume: z.string().optional(),
    trades: z.union([z.number(), z.string()]).optional(),
    startingOpenInterest: z.string().optional(),
})
    .passthrough();
export const DydxCandlesResponseSchema = z
    .object({
    candles: z.array(DydxCandleSchema),
})
    .passthrough();
//# sourceMappingURL=types.js.map
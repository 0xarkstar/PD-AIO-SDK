/**
 * Katana-specific type definitions and Zod schemas
 */
import { z } from 'zod';
export const KatanaMarketSchema = z
    .object({
    market: z.string(),
    type: z.string(),
    status: z.string(),
    baseAsset: z.string(),
    quoteAsset: z.string(),
    stepSize: z.string(),
    tickSize: z.string(),
    indexPrice: z.string(),
    lastFundingRate: z.string(),
    currentFundingRate: z.string(),
    nextFundingTime: z.number(),
    makerOrderMinimum: z.string(),
    takerOrderMinimum: z.string(),
    minimumPositionSize: z.string(),
    maximumPositionSize: z.string(),
    initialMarginFraction: z.string(),
    maintenanceMarginFraction: z.string(),
    makerFeeRate: z.string(),
    takerFeeRate: z.string(),
    volume24h: z.string(),
    openInterest: z.string(),
})
    .passthrough();
export const KatanaTickerSchema = z
    .object({
    market: z.string(),
    time: z.number(),
    open: z.string(),
    high: z.string(),
    low: z.string(),
    close: z.string(),
    baseVolume: z.string(),
    quoteVolume: z.string(),
    percentChange: z.string(),
    ask: z.string(),
    bid: z.string(),
    markPrice: z.string(),
    indexPrice: z.string(),
})
    .passthrough();
export const KatanaOrderBookSchema = z
    .object({
    sequence: z.number(),
    bids: z.array(z.tuple([z.string(), z.string(), z.number()])),
    asks: z.array(z.tuple([z.string(), z.string(), z.number()])),
    lastPrice: z.string(),
    markPrice: z.string(),
    indexPrice: z.string(),
})
    .passthrough();
export const KatanaTradeSchema = z
    .object({
    fillId: z.string(),
    market: z.string(),
    price: z.string(),
    quantity: z.string(),
    quoteQuantity: z.string(),
    time: z.number(),
    side: z.string(),
})
    .passthrough();
export const KatanaCandleSchema = z
    .object({
    start: z.number(),
    open: z.string(),
    high: z.string(),
    low: z.string(),
    close: z.string(),
    baseVolume: z.string(),
    quoteVolume: z.string(),
    trades: z.number(),
})
    .passthrough();
export const KatanaFundingRateSchema = z
    .object({
    market: z.string(),
    rate: z.string(),
    time: z.number(),
})
    .passthrough();
export const KatanaOrderSchema = z
    .object({
    orderId: z.string(),
    clientOrderId: z.string(),
    market: z.string(),
    type: z.number(),
    side: z.number(),
    state: z.string(),
    quantity: z.string(),
    filledQuantity: z.string(),
    limitPrice: z.string(),
    triggerPrice: z.string(),
    time: z.number(),
    fees: z.string(),
    createdAt: z.number(),
})
    .passthrough();
export const KatanaPositionSchema = z
    .object({
    market: z.string(),
    quantity: z.string(),
    entryPrice: z.string(),
    markPrice: z.string(),
    indexPrice: z.string(),
    liquidationPrice: z.string(),
    realizedPnL: z.string(),
    unrealizedPnL: z.string(),
    marginRequirement: z.string(),
    leverage: z.string(),
    adlQuintile: z.number(),
    time: z.number(),
})
    .passthrough();
export const KatanaWalletSchema = z
    .object({
    wallet: z.string(),
    equity: z.string(),
    freeCollateral: z.string(),
    heldCollateral: z.string(),
    availableCollateral: z.string(),
    quoteBalance: z.string(),
    unrealizedPnL: z.string(),
})
    .passthrough();
export const KatanaFillSchema = z
    .object({
    fillId: z.string(),
    orderId: z.string(),
    market: z.string(),
    price: z.string(),
    quantity: z.string(),
    quoteQuantity: z.string(),
    side: z.string(),
    time: z.number(),
    fee: z.string(),
})
    .passthrough();
//# sourceMappingURL=types.js.map
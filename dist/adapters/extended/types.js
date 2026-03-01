/**
 * Extended Exchange Types
 *
 * TypeScript types and Zod schemas for Extended API responses
 */
import { z } from 'zod';
export const ExtendedMarketApiFormatSchema = z
    .object({
    name: z.string(),
    assetName: z.string(),
    collateralAssetName: z.string(),
    active: z.boolean(),
    tradingConfig: z
        .object({
        minOrderSize: z.string().optional(),
        maxPositionValue: z.string().optional(),
        maxLeverage: z.string().optional(),
        minPriceChange: z.string().optional(),
        minOrderSizeChange: z.string().optional(),
    })
        .passthrough()
        .optional(),
    assetPrecision: z.number().optional(),
    collateralAssetPrecision: z.number().optional(),
    contractMultiplier: z.string().optional(),
    fundingInterval: z.number().optional(),
    settlementPeriod: z.number().optional(),
})
    .passthrough();
export const ExtendedFundingRateSchema = z
    .object({
    symbol: z.string(),
    fundingRate: z.string(),
    fundingTime: z.number(),
    nextFundingTime: z.number().optional(),
    indexPrice: z.string(),
    markPrice: z.string(),
    premiumRate: z.string().optional(),
})
    .passthrough();
// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================
export const ExtendedMarketSchema = z
    .object({
    marketId: z.string().optional(),
    symbol: z.string(),
    baseAsset: z.string().optional(),
    quoteAsset: z.string().optional(),
    settleAsset: z.string().optional(),
    isActive: z.boolean().optional(),
    minOrderQuantity: z.string().optional(),
    maxOrderQuantity: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    quantityPrecision: z.number().optional(),
    pricePrecision: z.number().optional(),
    contractMultiplier: z.string().optional(),
    maxLeverage: z.string().optional(),
    fundingInterval: z.number().optional(),
    settlementPeriod: z.number().optional(),
})
    .passthrough();
export const ExtendedTickerSchema = z
    .object({
    symbol: z.string(),
    lastPrice: z.string().optional(),
    bidPrice: z.string().optional(),
    askPrice: z.string().optional(),
    volume24h: z.string().optional(),
    quoteVolume24h: z.string().optional(),
    high24h: z.string().optional(),
    low24h: z.string().optional(),
    priceChange24h: z.string().optional(),
    priceChangePercent24h: z.string().optional(),
    openInterest: z.string().optional(),
    indexPrice: z.string().optional(),
    markPrice: z.string().optional(),
    fundingRate: z.string().optional(),
    nextFundingTime: z.number().optional(),
    timestamp: z.number().optional(),
})
    .passthrough();
export const ExtendedOrderBookSchema = z
    .object({
    symbol: z.string(),
    bids: z.array(z.tuple([z.string(), z.string()])).optional(),
    asks: z.array(z.tuple([z.string(), z.string()])).optional(),
    timestamp: z.number().optional(),
    sequence: z.number().optional(),
    checksum: z.string().optional(),
})
    .passthrough();
export const ExtendedTradeSchema = z
    .object({
    id: z.string(),
    symbol: z.string(),
    price: z.string().optional(),
    quantity: z.string().optional(),
    side: z.string().optional(),
    timestamp: z.number().optional(),
    isMaker: z.boolean().optional(),
    tradeId: z.string().optional(),
})
    .passthrough();
export const ExtendedOrderSchema = z
    .object({
    orderId: z.string(),
    clientOrderId: z.string().optional(),
    symbol: z.string(),
    type: z.enum(['market', 'limit', 'stop', 'stop_limit']),
    side: z.enum(['buy', 'sell']),
    status: z.enum(['pending', 'open', 'filled', 'partially_filled', 'cancelled', 'rejected', 'expired']),
    price: z.string().optional(),
    stopPrice: z.string().optional(),
    quantity: z.string(),
    filledQuantity: z.string().optional(),
    remainingQuantity: z.string().optional(),
    averagePrice: z.string().optional(),
    leverage: z.string().optional(),
    marginMode: z.string().optional(),
    timestamp: z.number(),
    updateTime: z.number().optional(),
    postOnly: z.boolean().optional(),
    reduceOnly: z.boolean().optional(),
    timeInForce: z.string().optional(),
    fees: z
        .object({
        asset: z.string(),
        amount: z.string(),
    })
        .passthrough()
        .optional(),
    starknetTxHash: z.string().optional(),
})
    .passthrough();
export const ExtendedPositionSchema = z
    .object({
    symbol: z.string(),
    side: z.enum(['long', 'short']),
    size: z.string(),
    entryPrice: z.string(),
    markPrice: z.string(),
    indexPrice: z.string().optional(),
    liquidationPrice: z.string(),
    margin: z.string(),
    initialMargin: z.string(),
    maintenanceMargin: z.string(),
    leverage: z.string(),
    marginMode: z.enum(['cross', 'isolated']),
    unrealizedPnl: z.string(),
    realizedPnl: z.string(),
    roi: z.string().optional(),
    adlLevel: z.number().optional(),
    timestamp: z.number(),
    starknetPosition: z.any().optional(),
})
    .passthrough();
export const ExtendedBalanceSchema = z
    .object({
    asset: z.string(),
    free: z.string(),
    locked: z.string(),
    total: z.string(),
    availableMargin: z.string(),
    usedMargin: z.string(),
    equity: z.string().optional(),
    timestamp: z.number().optional(),
})
    .passthrough();
//# sourceMappingURL=types.js.map
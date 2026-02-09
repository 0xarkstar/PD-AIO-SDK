/**
 * Extended Exchange Types
 *
 * TypeScript types and Zod schemas for Extended API responses
 */
import { z } from 'zod';
// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================
export const ExtendedMarketSchema = z.object({
    marketId: z.string(),
    symbol: z.string(),
    baseAsset: z.string(),
    quoteAsset: z.string(),
    settleAsset: z.string(),
    isActive: z.boolean(),
    minOrderQuantity: z.string(),
    maxOrderQuantity: z.string(),
    minPrice: z.string(),
    maxPrice: z.string(),
    quantityPrecision: z.number(),
    pricePrecision: z.number(),
    contractMultiplier: z.string(),
    maxLeverage: z.string(),
    fundingInterval: z.number(),
    settlementPeriod: z.number().optional(),
});
export const ExtendedTickerSchema = z.object({
    symbol: z.string(),
    lastPrice: z.string(),
    bidPrice: z.string(),
    askPrice: z.string(),
    volume24h: z.string(),
    quoteVolume24h: z.string(),
    high24h: z.string(),
    low24h: z.string(),
    priceChange24h: z.string(),
    priceChangePercent24h: z.string(),
    openInterest: z.string().optional(),
    indexPrice: z.string().optional(),
    markPrice: z.string().optional(),
    fundingRate: z.string().optional(),
    nextFundingTime: z.number().optional(),
    timestamp: z.number(),
});
export const ExtendedOrderBookSchema = z.object({
    symbol: z.string(),
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
    timestamp: z.number(),
    sequence: z.number().optional(),
    checksum: z.string().optional(),
});
export const ExtendedTradeSchema = z.object({
    id: z.string(),
    symbol: z.string(),
    price: z.string(),
    quantity: z.string(),
    side: z.enum(['buy', 'sell']),
    timestamp: z.number(),
    isMaker: z.boolean().optional(),
    tradeId: z.string().optional(),
});
export const ExtendedOrderSchema = z.object({
    orderId: z.string(),
    clientOrderId: z.string().optional(),
    symbol: z.string(),
    type: z.enum(['market', 'limit', 'stop', 'stop_limit']),
    side: z.enum(['buy', 'sell']),
    status: z.enum([
        'pending',
        'open',
        'filled',
        'partially_filled',
        'cancelled',
        'rejected',
        'expired',
    ]),
    price: z.string().optional(),
    stopPrice: z.string().optional(),
    quantity: z.string(),
    filledQuantity: z.string().optional(),
    remainingQuantity: z.string().optional(),
    averagePrice: z.string().optional(),
    leverage: z.string().optional(),
    marginMode: z.enum(['cross', 'isolated']).optional(),
    timestamp: z.number(),
    updateTime: z.number().optional(),
    postOnly: z.boolean().optional(),
    reduceOnly: z.boolean().optional(),
    timeInForce: z.enum(['GTC', 'IOC', 'FOK']).optional(),
    fees: z
        .object({
        asset: z.string(),
        amount: z.string(),
    })
        .optional(),
    starknetTxHash: z.string().optional(),
});
export const ExtendedPositionSchema = z.object({
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
});
export const ExtendedBalanceSchema = z.object({
    asset: z.string(),
    free: z.string(),
    locked: z.string(),
    total: z.string(),
    availableMargin: z.string(),
    usedMargin: z.string(),
    equity: z.string().optional(),
    timestamp: z.number().optional(),
});
//# sourceMappingURL=types.js.map
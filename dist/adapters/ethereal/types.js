/**
 * Ethereal Exchange-Specific Types
 */
import { z } from 'zod';
export const EtherealMarketInfoSchema = z
    .object({
    id: z.string(),
    ticker: z.string(),
    displayTicker: z.string(),
    status: z.string(),
    baseTokenName: z.string(),
    quoteTokenName: z.string(),
    tickSize: z.string(),
    lotSize: z.string(),
    minQuantity: z.string(),
    maxQuantity: z.string(),
    maxLeverage: z.number(),
    makerFee: z.string(),
    takerFee: z.string(),
})
    .passthrough();
export const EtherealTickerSchema = z
    .object({
    productId: z.string(),
    bestAskPrice: z.string(),
    bestBidPrice: z.string(),
    oraclePrice: z.string(),
    price24hAgo: z.string(),
})
    .passthrough();
export const EtherealOrderBookResponseSchema = z
    .object({
    productId: z.string(),
    timestamp: z.number(),
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
})
    .passthrough();
export const EtherealTradeResponseSchema = z
    .object({
    id: z.string(),
    productId: z.string(),
    price: z.string(),
    filled: z.string(),
    makerSide: z.number(),
    takerSide: z.number(),
    createdAt: z.number(),
})
    .passthrough();
export const EtherealOrderResponseSchema = z
    .object({
    orderId: z.string(),
    symbol: z.string(),
    side: z.string(),
    type: z.string(),
    status: z.string(),
    price: z.string(),
    avgPrice: z.string(),
    quantity: z.string(),
    filledQuantity: z.string(),
    remainingQuantity: z.string(),
    reduceOnly: z.boolean(),
    postOnly: z.boolean(),
    clientOrderId: z.string().optional(),
    timeInForce: z.string(),
    createdAt: z.number(),
    updatedAt: z.number(),
})
    .passthrough();
export const EtherealPositionResponseSchema = z
    .object({
    symbol: z.string(),
    side: z.string(),
    size: z.string(),
    entryPrice: z.string(),
    markPrice: z.string(),
    liquidationPrice: z.string(),
    unrealizedPnl: z.string(),
    realizedPnl: z.string(),
    leverage: z.string(),
    marginMode: z.string(),
    margin: z.string(),
    updatedAt: z.number(),
})
    .passthrough();
export const EtherealBalanceResponseSchema = z
    .object({
    asset: z.string(),
    total: z.string(),
    available: z.string(),
    locked: z.string(),
    updatedAt: z.number(),
})
    .passthrough();
export const EtherealCandleResponseSchema = z
    .object({
    timestamp: z.number(),
    open: z.string(),
    high: z.string(),
    low: z.string(),
    close: z.string(),
    volume: z.string(),
})
    .passthrough();
export const EtherealFundingRateResponseSchema = z
    .object({
    productId: z.string(),
    fundingRateProjected1h: z.string(),
    fundingRate1h: z.string(),
})
    .passthrough();
export const EtherealMyTradeResponseSchema = EtherealTradeResponseSchema;
//# sourceMappingURL=types.js.map
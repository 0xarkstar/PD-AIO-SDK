/**
 * Aster Exchange-Specific Types
 */
import { z } from 'zod';
export const AsterSymbolInfoSchema = z
    .object({
    symbol: z.string(),
    pair: z.string(),
    contractType: z.string(),
    deliveryDate: z.number(),
    onboardDate: z.number(),
    status: z.string(),
    baseAsset: z.string(),
    quoteAsset: z.string(),
    marginAsset: z.string(),
    pricePrecision: z.number(),
    quantityPrecision: z.number(),
    baseAssetPrecision: z.number(),
    quotePrecision: z.number(),
    underlyingType: z.string(),
    settlePlan: z.number(),
    triggerProtect: z.string(),
    filters: z.array(z.any()), // AsterFilter is a union type
    orderTypes: z.array(z.string()),
    timeInForce: z.array(z.string()),
    liquidationFee: z.string(),
    marketTakeBound: z.string(),
})
    .passthrough();
export const AsterTicker24hrSchema = z
    .object({
    symbol: z.string(),
    priceChange: z.string(),
    priceChangePercent: z.string(),
    weightedAvgPrice: z.string(),
    lastPrice: z.string(),
    lastQty: z.string(),
    openPrice: z.string(),
    highPrice: z.string(),
    lowPrice: z.string(),
    volume: z.string(),
    quoteVolume: z.string(),
    openTime: z.number(),
    closeTime: z.number(),
    firstId: z.number(),
    lastId: z.number(),
    count: z.number(),
})
    .passthrough();
export const AsterOrderBookResponseSchema = z
    .object({
    lastUpdateId: z.number(),
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
    T: z.number(),
})
    .passthrough();
export const AsterTradeResponseSchema = z
    .object({
    id: z.number(),
    price: z.string(),
    qty: z.string(),
    quoteQty: z.string(),
    time: z.number(),
    isBuyerMaker: z.boolean(),
})
    .passthrough();
export const AsterPremiumIndexSchema = z
    .object({
    symbol: z.string(),
    markPrice: z.string(),
    indexPrice: z.string(),
    estimatedSettlePrice: z.string(),
    lastFundingRate: z.string(),
    nextFundingTime: z.number(),
    interestRate: z.string(),
    time: z.number(),
})
    .passthrough();
export const AsterOrderResponseSchema = z
    .object({
    orderId: z.number(),
    symbol: z.string(),
    status: z.string(),
    clientOrderId: z.string(),
    price: z.string(),
    avgPrice: z.string(),
    origQty: z.string(),
    executedQty: z.string(),
    cumQuote: z.string(),
    timeInForce: z.string(),
    type: z.string(),
    reduceOnly: z.boolean(),
    closePosition: z.boolean(),
    side: z.string(),
    positionSide: z.string(),
    stopPrice: z.string(),
    workingType: z.string(),
    origType: z.string(),
    updateTime: z.number(),
})
    .passthrough();
export const AsterPositionRiskSchema = z
    .object({
    symbol: z.string(),
    positionAmt: z.string(),
    entryPrice: z.string(),
    markPrice: z.string(),
    unRealizedProfit: z.string(),
    liquidationPrice: z.string(),
    leverage: z.string(),
    maxNotionalValue: z.string(),
    marginType: z.string(),
    isolatedMargin: z.string(),
    isAutoAddMargin: z.string(),
    positionSide: z.string(),
    notional: z.string(),
    isolatedWallet: z.string(),
    updateTime: z.number(),
})
    .passthrough();
export const AsterAccountBalanceSchema = z
    .object({
    accountAlias: z.string(),
    asset: z.string(),
    balance: z.string(),
    crossWalletBalance: z.string(),
    crossUnPnl: z.string(),
    availableBalance: z.string(),
    maxWithdrawAmount: z.string(),
    marginAvailable: z.boolean(),
    updateTime: z.number(),
})
    .passthrough();
//# sourceMappingURL=types.js.map
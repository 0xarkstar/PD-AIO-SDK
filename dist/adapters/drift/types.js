/**
 * Drift Protocol Exchange-Specific Types
 *
 * Type definitions for Drift Protocol on-chain data and API responses.
 * Drift uses Solana program accounts for trading data.
 *
 * @see https://docs.drift.trade/
 * @see https://drift-labs.github.io/v2-teacher/
 */
import { z } from 'zod';
export const DriftPerpPositionSchema = z
    .object({
    marketIndex: z.number(),
    baseAssetAmount: z.string(),
    quoteAssetAmount: z.string(),
    quoteEntryAmount: z.string(),
    quoteBreakEvenAmount: z.string(),
    openOrders: z.number(),
    openBids: z.string(),
    openAsks: z.string(),
    settledPnl: z.string(),
    lpShares: z.string(),
    lastCumulativeFundingRate: z.string(),
    perLpBase: z.number(),
})
    .passthrough();
export const DriftSpotPositionSchema = z
    .object({
    marketIndex: z.number(),
    scaledBalance: z.string(),
    balanceType: z.string(),
    openOrders: z.number(),
    cumulativeDeposits: z.string(),
})
    .passthrough();
export const DriftOrderSchema = z
    .object({
    status: z.string(),
    orderType: z.string(),
    marketType: z.string(),
    slot: z.number(),
    orderId: z.number(),
    userOrderId: z.number(),
    marketIndex: z.number(),
    price: z.string(),
    baseAssetAmount: z.string(),
    baseAssetAmountFilled: z.string(),
    quoteAssetAmountFilled: z.string(),
    direction: z.string(),
    reduceOnly: z.boolean(),
    triggerPrice: z.string(),
    triggerCondition: z.string(),
    existingPositionDirection: z.string(),
    postOnly: z.string(),
    immediateOrCancel: z.boolean(),
    maxTs: z.string(),
    oraclePriceOffset: z.number(),
    auctionDuration: z.number(),
    auctionStartPrice: z.string(),
    auctionEndPrice: z.string(),
})
    .passthrough();
export const DriftPerpMarketAccountSchema = z
    .object({
    status: z.string(),
    marketIndex: z.number(),
    pnlPool: z
        .object({
        scaledBalance: z.string(),
        marketIndex: z.number(),
    })
        .passthrough(),
    name: z.string(),
    amm: z.any(), // AMM structure is complex and varies
    numberOfUsersWithBase: z.number(),
    numberOfUsers: z.number(),
    marginRatioInitial: z.coerce.number(),
    marginRatioMaintenance: z.coerce.number(),
    nextFillRecordId: z.string(),
    nextFundingRateRecordId: z.string(),
    nextCurveRecordId: z.string(),
    imfFactor: z.coerce.number(),
    unrealizedPnlImfFactor: z.coerce.number(),
    liquidatorFee: z.coerce.number(),
    ifLiquidationFee: z.coerce.number(),
    unrealizedPnlMaxImbalance: z.string(),
    expiryTs: z.string(),
    expiryPrice: z.string(),
    insuranceClaim: z.any(),
    contractType: z.string(),
    contractTier: z.string(),
    pausedOperations: z.number(),
    quoteSpotMarketIndex: z.number(),
    feeAdjustment: z.coerce.number(),
})
    .passthrough();
export const DriftL2OrderBookSchema = z
    .object({
    marketIndex: z.number(),
    marketType: z.string(),
    bids: z
        .array(z.object({
        price: z.string(),
        size: z.string(),
        sources: z.record(z.string(), z.string()).optional(),
    })),
    asks: z
        .array(z.object({
        price: z.string(),
        size: z.string(),
        sources: z.record(z.string(), z.string()).optional(),
    })),
    oraclePrice: z.string(),
    slot: z.number(),
})
    .passthrough();
export const DriftTradeSchema = z
    .object({
    recordId: z.union([z.string(), z.number()]),
    fillRecordId: z.union([z.string(), z.number()]),
    marketIndex: z.number(),
    marketType: z.string(),
    taker: z.string(),
    takerOrderId: z.number(),
    takerOrderDirection: z.string(),
    maker: z.string(),
    makerOrderId: z.number(),
    makerOrderDirection: z.string(),
    baseAssetAmount: z.string(),
    quoteAssetAmount: z.string(),
    fillPrice: z.string(),
    action: z.string(),
    actionExplanation: z.string(),
    txSig: z.string(),
    slot: z.number(),
    ts: z.number(),
})
    .passthrough();
export const DriftFundingRateSchema = z
    .object({
    marketIndex: z.number(),
    fundingRate: z.string(),
    fundingRateLong: z.string(),
    fundingRateShort: z.string(),
    cumulativeFundingRateLong: z.string(),
    cumulativeFundingRateShort: z.string(),
    oraclePrice: z.string(),
    markPriceTwap: z.string(),
    ts: z.number(),
})
    .passthrough();
export const DriftFundingRateRecordSchema = z
    .object({
    recordId: z.union([z.string(), z.number()]),
    marketIndex: z.number(),
    fundingRate: z.string(),
    fundingRateLong: z.string(),
    fundingRateShort: z.string(),
    cumulativeFundingRateLong: z.string(),
    cumulativeFundingRateShort: z.string(),
    oraclePriceTwap: z.string(),
    markPriceTwap: z.string(),
    periodRevenue: z.string(),
    baseAssetAmountWithAmm: z.string(),
    baseAssetAmountWithUnsettledLp: z.string(),
    ts: z.number(),
})
    .passthrough();
export const DriftMarketStatsSchema = z
    .object({
    marketIndex: z.number(),
    oraclePrice: z.string(),
    markPrice: z.string(),
    bidPrice: z.string(),
    askPrice: z.string(),
    lastFillPrice: z.string(),
    volume24h: z.string(),
    openInterest: z.string(),
    openInterestLong: z.string(),
    openInterestShort: z.string(),
    fundingRate: z.string(),
    fundingRate24h: z.string(),
    nextFundingRate: z.string(),
    nextFundingTs: z.number(),
    ts: z.number(),
})
    .passthrough();
export const DriftCandleSchema = z
    .object({
    start: z.number(),
    end: z.number(),
    resolution: z.number(),
    open: z.string(),
    high: z.string(),
    low: z.string(),
    close: z.string(),
    volume: z.string(),
    trades: z.number(),
})
    .passthrough();
//# sourceMappingURL=types.js.map
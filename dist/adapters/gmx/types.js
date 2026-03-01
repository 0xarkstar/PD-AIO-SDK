/**
 * GMX v2 Exchange-Specific Types
 *
 * Type definitions for GMX v2 API responses and on-chain data.
 *
 * @see https://docs.gmx.io/docs/api/rest-v2/
 */
import { z } from 'zod';
const GmxTokenInfoSchema = z
    .object({
    address: z.string(),
    symbol: z.string(),
    decimals: z.number(),
    prices: z
        .object({
        minPrice: z.string(),
        maxPrice: z.string(),
    })
        .passthrough(),
})
    .passthrough();
export const GmxMarketInfoSchema = z
    .object({
    marketToken: z.string(),
    indexToken: z.string(),
    longToken: z.string(),
    shortToken: z.string(),
    name: z.string().optional(),
    isListed: z.boolean().optional(),
    indexTokenInfo: GmxTokenInfoSchema.optional(),
    longTokenInfo: GmxTokenInfoSchema.optional(),
    shortTokenInfo: GmxTokenInfoSchema.optional(),
    longPoolAmount: z.string(),
    shortPoolAmount: z.string(),
    maxLongPoolAmount: z.string(),
    maxShortPoolAmount: z.string(),
    maxLongPoolUsdForDeposit: z.string(),
    maxShortPoolUsdForDeposit: z.string(),
    longPoolAmountAdjustment: z.string(),
    shortPoolAmountAdjustment: z.string(),
    poolValueMin: z.string(),
    poolValueMax: z.string(),
    reserveFactorLong: z.string(),
    reserveFactorShort: z.string(),
    openInterestReserveFactorLong: z.string(),
    openInterestReserveFactorShort: z.string(),
    maxOpenInterestLong: z.string(),
    maxOpenInterestShort: z.string(),
    totalBorrowingFees: z.string(),
    positionImpactPoolAmount: z.string(),
    minPositionImpactPoolAmount: z.string(),
    positionImpactPoolDistributionRate: z.string(),
    swapImpactPoolAmountLong: z.string(),
    swapImpactPoolAmountShort: z.string(),
    borrowingFactorLong: z.string(),
    borrowingFactorShort: z.string(),
    borrowingExponentFactorLong: z.string(),
    borrowingExponentFactorShort: z.string(),
    fundingFactor: z.string(),
    fundingExponentFactor: z.string(),
    fundingIncreaseFactorPerSecond: z.string(),
    fundingDecreaseFactorPerSecond: z.string(),
    thresholdForStableFunding: z.string(),
    thresholdForDecreaseFunding: z.string(),
    minFundingFactorPerSecond: z.string(),
    maxFundingFactorPerSecond: z.string(),
    pnlLongMax: z.string(),
    pnlLongMin: z.string(),
    pnlShortMax: z.string(),
    pnlShortMin: z.string(),
    netPnlMax: z.string(),
    netPnlMin: z.string(),
    maxPnlFactorForTradersLong: z.string(),
    maxPnlFactorForTradersShort: z.string(),
    minCollateralFactor: z.string(),
    minCollateralFactorForOpenInterestLong: z.string(),
    minCollateralFactorForOpenInterestShort: z.string(),
    claimableFundingAmountLong: z.string(),
    claimableFundingAmountShort: z.string(),
    positionFeeFactorForPositiveImpact: z.string(),
    positionFeeFactorForNegativeImpact: z.string(),
    positionImpactFactorPositive: z.string(),
    positionImpactFactorNegative: z.string(),
    maxPositionImpactFactorPositive: z.string(),
    maxPositionImpactFactorNegativePrice: z.string(),
    positionImpactExponentFactor: z.string(),
    swapFeeFactorForPositiveImpact: z.string(),
    swapFeeFactorForNegativeImpact: z.string(),
    swapImpactFactorPositive: z.string(),
    swapImpactFactorNegative: z.string(),
    swapImpactExponentFactor: z.string(),
    longInterestInTokens: z.string(),
    shortInterestInTokens: z.string(),
    longInterestUsd: z.string(),
    shortInterestUsd: z.string(),
    longInterestInTokensUsingLongToken: z.string(),
    longInterestInTokensUsingShortToken: z.string(),
    shortInterestInTokensUsingLongToken: z.string(),
    shortInterestInTokensUsingShortToken: z.string(),
    isDisabled: z.boolean(),
    virtualPoolAmountForLongToken: z.string(),
    virtualPoolAmountForShortToken: z.string(),
    virtualInventoryForPositions: z.string(),
    virtualMarketId: z.string(),
    virtualLongTokenId: z.string(),
    virtualShortTokenId: z.string(),
})
    .passthrough();
export const GmxCandleTupleSchema = z.array(z.number());
export const GmxCandlesResponseSchema = z
    .object({
    period: z.string(),
    candles: z.array(GmxCandleTupleSchema),
})
    .passthrough();
export const GmxPositionSchema = z
    .object({
    account: z.string(),
    market: z.string(),
    collateralToken: z.string(),
    sizeInUsd: z.string(),
    sizeInTokens: z.string(),
    collateralAmount: z.string(),
    borrowingFactor: z.string(),
    fundingFeeAmountPerSize: z.string(),
    longTokenClaimableFundingAmountPerSize: z.string(),
    shortTokenClaimableFundingAmountPerSize: z.string(),
    increasedAtBlock: z.string(),
    decreasedAtBlock: z.string(),
    isLong: z.boolean(),
})
    .passthrough();
export const GmxOrderSchema = z
    .object({
    key: z.string(),
    account: z.string(),
    receiver: z.string(),
    callbackContract: z.string(),
    uiFeeReceiver: z.string(),
    market: z.string(),
    initialCollateralToken: z.string(),
    swapPath: z.array(z.string()),
    orderType: z.number(),
    decreasePositionSwapType: z.number(),
    sizeDeltaUsd: z.string(),
    initialCollateralDeltaAmount: z.string(),
    triggerPrice: z.string(),
    acceptablePrice: z.string(),
    executionFee: z.string(),
    callbackGasLimit: z.string(),
    minOutputAmount: z.string(),
    updatedAtBlock: z.string(),
    isLong: z.boolean(),
    isFrozen: z.boolean(),
    status: z.string(),
    createdTxn: z.string(),
    cancelledTxn: z.string().optional(),
    executedTxn: z.string().optional(),
})
    .passthrough();
export const GmxTradeSchema = z
    .object({
    id: z.string(),
    account: z.string(),
    market: z.string(),
    collateralToken: z.string(),
    sizeDeltaUsd: z.string(),
    sizeDeltaInTokens: z.string(),
    collateralDeltaAmount: z.string(),
    borrowingFactor: z.string(),
    fundingFeeAmountPerSize: z.string(),
    pnlUsd: z.string(),
    priceImpactUsd: z.string(),
    orderType: z.number(),
    isLong: z.boolean(),
    executionPrice: z.string(),
    timestamp: z.number(),
    transactionHash: z.string(),
})
    .passthrough();
export const GmxFundingRateSchema = z
    .object({
    market: z.string(),
    fundingFactorPerSecond: z.string(),
    longsPayShorts: z.boolean(),
    fundingFeeAmountPerSizeLong: z.string(),
    fundingFeeAmountPerSizeShort: z.string(),
    timestamp: z.number(),
})
    .passthrough();
//# sourceMappingURL=types.js.map
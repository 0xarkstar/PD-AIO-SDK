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
    longPoolAmount: z.string().optional().default('0'),
    shortPoolAmount: z.string().optional().default('0'),
    maxLongPoolAmount: z.string().optional().default('0'),
    maxShortPoolAmount: z.string().optional().default('0'),
    maxLongPoolUsdForDeposit: z.string().optional().default('0'),
    maxShortPoolUsdForDeposit: z.string().optional().default('0'),
    longPoolAmountAdjustment: z.string().optional().default('0'),
    shortPoolAmountAdjustment: z.string().optional().default('0'),
    poolValueMin: z.string().optional().default('0'),
    poolValueMax: z.string().optional().default('0'),
    reserveFactorLong: z.string().optional().default('0'),
    reserveFactorShort: z.string().optional().default('0'),
    openInterestReserveFactorLong: z.string().optional().default('0'),
    openInterestReserveFactorShort: z.string().optional().default('0'),
    maxOpenInterestLong: z.string().optional().default('0'),
    maxOpenInterestShort: z.string().optional().default('0'),
    totalBorrowingFees: z.string().optional().default('0'),
    positionImpactPoolAmount: z.string().optional().default('0'),
    minPositionImpactPoolAmount: z.string().optional().default('0'),
    positionImpactPoolDistributionRate: z.string().optional().default('0'),
    swapImpactPoolAmountLong: z.string().optional().default('0'),
    swapImpactPoolAmountShort: z.string().optional().default('0'),
    borrowingFactorLong: z.string().optional().default('0'),
    borrowingFactorShort: z.string().optional().default('0'),
    borrowingExponentFactorLong: z.string().optional().default('0'),
    borrowingExponentFactorShort: z.string().optional().default('0'),
    fundingFactor: z.string().optional().default('0'),
    fundingExponentFactor: z.string().optional().default('0'),
    fundingIncreaseFactorPerSecond: z.string().optional().default('0'),
    fundingDecreaseFactorPerSecond: z.string().optional().default('0'),
    thresholdForStableFunding: z.string().optional().default('0'),
    thresholdForDecreaseFunding: z.string().optional().default('0'),
    minFundingFactorPerSecond: z.string().optional().default('0'),
    maxFundingFactorPerSecond: z.string().optional().default('0'),
    pnlLongMax: z.string().optional().default('0'),
    pnlLongMin: z.string().optional().default('0'),
    pnlShortMax: z.string().optional().default('0'),
    pnlShortMin: z.string().optional().default('0'),
    netPnlMax: z.string().optional().default('0'),
    netPnlMin: z.string().optional().default('0'),
    maxPnlFactorForTradersLong: z.string().optional().default('0'),
    maxPnlFactorForTradersShort: z.string().optional().default('0'),
    minCollateralFactor: z.string().optional().default('0'),
    minCollateralFactorForOpenInterestLong: z.string().optional().default('0'),
    minCollateralFactorForOpenInterestShort: z.string().optional().default('0'),
    claimableFundingAmountLong: z.string().optional().default('0'),
    claimableFundingAmountShort: z.string().optional().default('0'),
    positionFeeFactorForPositiveImpact: z.string().optional().default('0'),
    positionFeeFactorForNegativeImpact: z.string().optional().default('0'),
    positionImpactFactorPositive: z.string().optional().default('0'),
    positionImpactFactorNegative: z.string().optional().default('0'),
    maxPositionImpactFactorPositive: z.string().optional().default('0'),
    maxPositionImpactFactorNegativePrice: z.string().optional().default('0'),
    positionImpactExponentFactor: z.string().optional().default('0'),
    swapFeeFactorForPositiveImpact: z.string().optional().default('0'),
    swapFeeFactorForNegativeImpact: z.string().optional().default('0'),
    swapImpactFactorPositive: z.string().optional().default('0'),
    swapImpactFactorNegative: z.string().optional().default('0'),
    swapImpactExponentFactor: z.string().optional().default('0'),
    longInterestInTokens: z.string().optional().default('0'),
    shortInterestInTokens: z.string().optional().default('0'),
    longInterestUsd: z.string().optional().default('0'),
    shortInterestUsd: z.string().optional().default('0'),
    longInterestInTokensUsingLongToken: z.string().optional().default('0'),
    longInterestInTokensUsingShortToken: z.string().optional().default('0'),
    shortInterestInTokensUsingLongToken: z.string().optional().default('0'),
    shortInterestInTokensUsingShortToken: z.string().optional().default('0'),
    isDisabled: z.boolean().optional().default(false),
    virtualPoolAmountForLongToken: z.string().optional().default('0'),
    virtualPoolAmountForShortToken: z.string().optional().default('0'),
    virtualInventoryForPositions: z.string().optional().default('0'),
    virtualMarketId: z.string().optional().default(''),
    virtualLongTokenId: z.string().optional().default(''),
    virtualShortTokenId: z.string().optional().default(''),
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
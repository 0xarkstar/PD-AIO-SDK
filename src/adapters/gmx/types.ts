/**
 * GMX v2 Exchange-Specific Types
 *
 * Type definitions for GMX v2 API responses and on-chain data.
 *
 * @see https://docs.gmx.io/docs/api/rest-v2/
 */

import { z } from 'zod';

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Market info from /markets/info endpoint
 */
export interface GmxMarketInfo {
  /** Market token address (API field: marketToken) */
  marketToken: string;
  /** Index token address (API field: indexToken) */
  indexToken: string;
  /** Long token address (API field: longToken) */
  longToken: string;
  /** Short token address (API field: shortToken) */
  shortToken: string;
  /** Market name */
  name?: string;
  /** Whether market is listed */
  isListed?: boolean;
  /** Index token info (may not be in API response) */
  indexTokenInfo?: GmxTokenInfo;
  /** Long token info (may not be in API response) */
  longTokenInfo?: GmxTokenInfo;
  /** Short token info (may not be in API response) */
  shortTokenInfo?: GmxTokenInfo;
  longPoolAmount: string;
  shortPoolAmount: string;
  maxLongPoolAmount: string;
  maxShortPoolAmount: string;
  maxLongPoolUsdForDeposit: string;
  maxShortPoolUsdForDeposit: string;
  longPoolAmountAdjustment: string;
  shortPoolAmountAdjustment: string;
  poolValueMin: string;
  poolValueMax: string;
  reserveFactorLong: string;
  reserveFactorShort: string;
  openInterestReserveFactorLong: string;
  openInterestReserveFactorShort: string;
  maxOpenInterestLong: string;
  maxOpenInterestShort: string;
  totalBorrowingFees: string;
  positionImpactPoolAmount: string;
  minPositionImpactPoolAmount: string;
  positionImpactPoolDistributionRate: string;
  swapImpactPoolAmountLong: string;
  swapImpactPoolAmountShort: string;
  borrowingFactorLong: string;
  borrowingFactorShort: string;
  borrowingExponentFactorLong: string;
  borrowingExponentFactorShort: string;
  fundingFactor: string;
  fundingExponentFactor: string;
  fundingIncreaseFactorPerSecond: string;
  fundingDecreaseFactorPerSecond: string;
  thresholdForStableFunding: string;
  thresholdForDecreaseFunding: string;
  minFundingFactorPerSecond: string;
  maxFundingFactorPerSecond: string;
  pnlLongMax: string;
  pnlLongMin: string;
  pnlShortMax: string;
  pnlShortMin: string;
  netPnlMax: string;
  netPnlMin: string;
  maxPnlFactorForTradersLong: string;
  maxPnlFactorForTradersShort: string;
  minCollateralFactor: string;
  minCollateralFactorForOpenInterestLong: string;
  minCollateralFactorForOpenInterestShort: string;
  claimableFundingAmountLong: string;
  claimableFundingAmountShort: string;
  positionFeeFactorForPositiveImpact: string;
  positionFeeFactorForNegativeImpact: string;
  positionImpactFactorPositive: string;
  positionImpactFactorNegative: string;
  maxPositionImpactFactorPositive: string;
  maxPositionImpactFactorNegativePrice: string;
  positionImpactExponentFactor: string;
  swapFeeFactorForPositiveImpact: string;
  swapFeeFactorForNegativeImpact: string;
  swapImpactFactorPositive: string;
  swapImpactFactorNegative: string;
  swapImpactExponentFactor: string;
  longInterestInTokens: string;
  shortInterestInTokens: string;
  longInterestUsd: string;
  shortInterestUsd: string;
  longInterestInTokensUsingLongToken: string;
  longInterestInTokensUsingShortToken: string;
  shortInterestInTokensUsingLongToken: string;
  shortInterestInTokensUsingShortToken: string;
  isDisabled: boolean;
  virtualPoolAmountForLongToken: string;
  virtualPoolAmountForShortToken: string;
  virtualInventoryForPositions: string;
  virtualMarketId: string;
  virtualLongTokenId: string;
  virtualShortTokenId: string;
}

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

/**
 * Token info
 */
export interface GmxTokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  prices: {
    minPrice: string;
    maxPrice: string;
  };
}

/**
 * Candlestick data tuple from /prices/candles endpoint
 * Format: [timestamp_seconds, open, high, low, close]
 */
export type GmxCandleTuple = number[];

export const GmxCandleTupleSchema = z.array(z.number());

/**
 * Response wrapper from /prices/candles endpoint
 */
export interface GmxCandlesResponse {
  period: string;
  candles: GmxCandleTuple[];
}

export const GmxCandlesResponseSchema = z
  .object({
    period: z.string(),
    candles: z.array(GmxCandleTupleSchema),
  })
  .passthrough();

/**
 * @deprecated Use GmxCandleTuple instead — API returns tuples, not objects
 */
export interface GmxCandlestick {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Position data from subgraph
 */
export interface GmxPosition {
  account: string;
  market: string;
  collateralToken: string;
  sizeInUsd: string;
  sizeInTokens: string;
  collateralAmount: string;
  borrowingFactor: string;
  fundingFeeAmountPerSize: string;
  longTokenClaimableFundingAmountPerSize: string;
  shortTokenClaimableFundingAmountPerSize: string;
  increasedAtBlock: string;
  decreasedAtBlock: string;
  isLong: boolean;
}

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

/**
 * Order data from subgraph
 */
export interface GmxOrder {
  key: string;
  account: string;
  receiver: string;
  callbackContract: string;
  uiFeeReceiver: string;
  market: string;
  initialCollateralToken: string;
  swapPath: string[];
  orderType: number;
  decreasePositionSwapType: number;
  sizeDeltaUsd: string;
  initialCollateralDeltaAmount: string;
  triggerPrice: string;
  acceptablePrice: string;
  executionFee: string;
  callbackGasLimit: string;
  minOutputAmount: string;
  updatedAtBlock: string;
  isLong: boolean;
  isFrozen: boolean;
  status: string;
  createdTxn: string;
  cancelledTxn?: string;
  executedTxn?: string;
}

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

/**
 * Trade/Fill data from subgraph
 */
export interface GmxTrade {
  id: string;
  account: string;
  market: string;
  collateralToken: string;
  sizeDeltaUsd: string;
  sizeDeltaInTokens: string;
  collateralDeltaAmount: string;
  borrowingFactor: string;
  fundingFeeAmountPerSize: string;
  pnlUsd: string;
  priceImpactUsd: string;
  orderType: number;
  isLong: boolean;
  executionPrice: string;
  timestamp: number;
  transactionHash: string;
}

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

/**
 * Funding rate data
 */
export interface GmxFundingRate {
  market: string;
  fundingFactorPerSecond: string;
  longsPayShorts: boolean;
  fundingFeeAmountPerSizeLong: string;
  fundingFeeAmountPerSizeShort: string;
  timestamp: number;
}

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

/**
 * Price data from oracle
 */
export interface GmxPriceData {
  token: string;
  minPrice: string;
  maxPrice: string;
  timestamp: number;
}

// =============================================================================
// Subgraph Query Types
// =============================================================================

/**
 * Market stats from subgraph
 */
export interface GmxMarketStats {
  marketAddress: string;
  longOpenInterest: string;
  shortOpenInterest: string;
  longOpenInterestInTokens: string;
  shortOpenInterestInTokens: string;
  netOpenInterest: string;
  volumeUsd24h: string;
  fees24h: string;
  lastPrice: string;
}

/**
 * Account stats from subgraph
 */
export interface GmxAccountStats {
  account: string;
  totalTrades: number;
  totalVolume: string;
  totalPnl: string;
  totalFees: string;
}

// =============================================================================
// Order Request Types
// =============================================================================

/**
 * Create order request params
 */
export interface GmxCreateOrderParams {
  receiver: string;
  callbackContract: string;
  uiFeeReceiver: string;
  market: string;
  initialCollateralToken: string;
  swapPath: string[];
  sizeDeltaUsd: bigint;
  initialCollateralDeltaAmount: bigint;
  triggerPrice: bigint;
  acceptablePrice: bigint;
  executionFee: bigint;
  callbackGasLimit: bigint;
  minOutputAmount: bigint;
  orderType: number;
  decreasePositionSwapType: number;
  isLong: boolean;
  shouldUnwrapNativeToken: boolean;
  referralCode: string;
}

// =============================================================================
// Normalized Types for SDK
// =============================================================================

/**
 * Normalized position for SDK
 */
export interface GmxNormalizedPosition {
  symbol: string;
  marketAddress: string;
  side: 'long' | 'short';
  size: number;
  sizeUsd: number;
  collateral: number;
  collateralUsd: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  leverage: number;
  borrowingFee: number;
  fundingFee: number;
}

/**
 * Normalized order for SDK
 */
export interface GmxNormalizedOrder {
  id: string;
  symbol: string;
  marketAddress: string;
  type: 'market' | 'limit' | 'stopMarket' | 'stopLimit';
  side: 'buy' | 'sell';
  isLong: boolean;
  amount: number;
  price: number;
  triggerPrice?: number;
  status: 'open' | 'filled' | 'cancelled' | 'expired';
  timestamp: number;
}

/**
 * Normalized trade for SDK
 */
export interface GmxNormalizedTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  isLong: boolean;
  amount: number;
  price: number;
  cost: number;
  pnl: number;
  fee: number;
  timestamp: number;
  transactionHash: string;
}

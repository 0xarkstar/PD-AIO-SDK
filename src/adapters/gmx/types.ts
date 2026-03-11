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

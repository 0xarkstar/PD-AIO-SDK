/**
 * GMX v2 Exchange-Specific Types
 *
 * Type definitions for GMX v2 API responses and on-chain data.
 *
 * @see https://docs.gmx.io/docs/api/rest-v2/
 */

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
 * Candlestick data from /candlesticks endpoint
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

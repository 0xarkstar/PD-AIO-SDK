/**
 * Drift Protocol Adapter
 *
 * Unified interface for Drift Protocol on Solana.
 *
 * @packageDocumentation
 */

// Main adapter
export { DriftAdapter, type DriftConfig } from './DriftAdapter.js';

// Authentication
export { DriftAuth, type DriftAuthConfig, isValidSolanaAddress, isValidSolanaPrivateKey } from './DriftAuth.js';

// Client Wrapper
export {
  DriftClientWrapper,
  type DriftClientWrapperConfig,
  type DriftOrderParams,
  type PlaceOrderResult,
  type CancelOrderResult,
} from './DriftClientWrapper.js';

// Order Builder
export {
  DriftOrderBuilder,
  type DriftOrderBuilderConfig,
  createOrderBuilder,
} from './orderBuilder.js';

// Normalizer
export { DriftNormalizer } from './DriftNormalizer.js';

// Constants
export {
  DRIFT_API_URLS,
  DRIFT_MAINNET_DLOB_API,
  DRIFT_MAINNET_DATA_API,
  DRIFT_DEVNET_DLOB_API,
  DRIFT_PROGRAM_ID,
  DRIFT_PRECISION,
  DRIFT_RATE_LIMIT,
  DRIFT_PERP_MARKETS,
  DRIFT_MARKET_INDEX_MAP,
  DRIFT_ORDER_TYPES,
  DRIFT_DIRECTIONS,
  DRIFT_MARKET_TYPES,
  DRIFT_FUNDING,
  DRIFT_WS_CHANNELS,
  DRIFT_ERROR_MESSAGES,
  unifiedToDrift,
  driftToUnified,
  getMarketIndex,
  getSymbolFromIndex,
  getBaseToken,
} from './constants.js';

// Error mapping
export { mapDriftError, DriftErrorCodes, type DriftErrorCode } from './error-codes.js';

// Types
export type {
  // Enums
  DriftOrderType,
  DriftDirection,
  DriftMarketType,
  DriftOrderStatus,
  DriftPositionDirection,
  DriftTriggerCondition,
  DriftPostOnlyParams,
  // On-chain types
  DriftPerpPosition,
  DriftSpotPosition,
  DriftOrder,
  DriftUserAccount,
  DriftAMM,
  DriftPerpMarketAccount,
  // API types
  DriftL2OrderBook,
  DriftTrade,
  DriftFundingRate,
  DriftFundingRateRecord,
  DriftMarketStats,
  DriftCandle,
  // Normalized types
  DriftNormalizedPosition,
  DriftNormalizedOrder,
} from './types.js';

// Utilities
export {
  getMarketConfig,
  getMarketConfigByIndex,
  isValidMarket,
  getAllMarketIndices,
  priceToOnChain,
  priceFromOnChain,
  baseToOnChain,
  baseFromOnChain,
  quoteToOnChain,
  quoteFromOnChain,
  formatPrice,
  formatSize,
  roundToTickSize,
  roundToStepSize,
  validateLeverage,
  calculatePositionSize,
  calculateRequiredCollateral,
  toDriftOrderType,
  toDriftDirection,
  fromDriftDirection,
  getPostOnlyParams,
  validateOrderParams,
  fundingRateFromOnChain,
  annualizeFundingRate,
  calculateFundingPayment,
  calculateLiquidationPrice,
  isLiquidatable,
  buildOrderbookUrl,
  buildTradesUrl,
  buildHistoricalUrl,
  getNextFundingTimestamp,
  getTimeUntilFunding,
  slotToTimestamp,
} from './utils.js';

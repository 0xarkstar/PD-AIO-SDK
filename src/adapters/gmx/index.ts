/**
 * GMX v2 Adapter
 *
 * Unified interface for GMX v2 perpetuals on Arbitrum and Avalanche.
 *
 * @packageDocumentation
 */

// Main adapter
export { GmxAdapter, type GmxConfig, type GmxChain } from './GmxAdapter.js';

// Normalizer
export { GmxNormalizer } from './GmxNormalizer.js';

// Constants
export {
  GMX_API_URLS,
  GMX_ARBITRUM_API,
  GMX_AVALANCHE_API,
  GMX_PRECISION,
  GMX_RATE_LIMIT,
  GMX_MARKETS,
  GMX_MARKET_ADDRESS_MAP,
  GMX_ORDER_TYPES,
  GMX_DECREASE_POSITION_SWAP_TYPES,
  GMX_CONTRACTS,
  GMX_FUNDING,
  GMX_ERROR_MESSAGES,
  unifiedToGmx,
  gmxToUnified,
  getMarketByAddress,
  getBaseToken,
  getMarketsForChain,
  type GMXMarketKey,
} from './constants.js';

// Error mapping
export { mapGmxError, GmxErrorCodes, type GmxErrorCode } from './error-codes.js';

// Types
export type {
  // API types
  GmxMarketInfo,
  GmxTokenInfo,
  GmxCandlestick,
  GmxPosition,
  GmxOrder,
  GmxTrade,
  GmxFundingRate,
  GmxPriceData,
  GmxMarketStats,
  GmxAccountStats,
  GmxCreateOrderParams,
  // Normalized types
  GmxNormalizedPosition,
  GmxNormalizedOrder,
  GmxNormalizedTrade,
} from './types.js';

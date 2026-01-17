/**
 * Extended Exchange Adapter
 *
 * Public exports for Extended adapter
 */

// Main adapter
export { ExtendedAdapter } from './ExtendedAdapter.js';

// Configuration type
export type { ExtendedConfig } from './ExtendedAdapter.js';

// Types
export type {
  ExtendedMarket,
  ExtendedTicker,
  ExtendedOrderBook,
  ExtendedTrade,
  ExtendedFundingRate,
  ExtendedOrder,
  ExtendedPosition,
  ExtendedBalance,
  ExtendedOrderRequest,
  ExtendedUserFees,
  ExtendedPortfolio,
  ExtendedLeverageSettings,
  ExtendedStarkNetState,
  ExtendedStarkNetTransaction,
} from './types.js';

// Constants
export {
  EXTENDED_API_URLS,
  EXTENDED_ENDPOINTS,
  EXTENDED_RATE_LIMITS,
  EXTENDED_ORDER_TYPES,
  EXTENDED_ORDER_SIDES,
  EXTENDED_ORDER_STATUS,
  EXTENDED_LEVERAGE_TIERS,
  EXTENDED_MARGIN_MODES,
} from './constants.js';

// Error codes
export {
  EXTENDED_CLIENT_ERRORS,
  EXTENDED_SERVER_ERRORS,
  EXTENDED_RATE_LIMIT_ERROR,
  EXTENDED_STARKNET_ERRORS,
  mapExtendedError,
  mapStarkNetError,
} from './error-codes.js';

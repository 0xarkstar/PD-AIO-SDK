/**
 * Variational Exchange Adapter
 *
 * Public exports for Variational adapter
 */

// Main adapter
export { VariationalAdapter } from './VariationalAdapter.js';

// Configuration type
export type { VariationalConfig } from './VariationalAdapter.js';

// Types
export type {
  VariationalMarket,
  VariationalTicker,
  VariationalOrderBook,
  VariationalTrade,
  VariationalFundingRate,
  VariationalQuote,
  VariationalOrder,
  VariationalPosition,
  VariationalBalance,
  VariationalOrderRequest,
  VariationalQuoteRequest,
  VariationalUserFees,
  VariationalPortfolio,
} from './types.js';

// Constants
export {
  VARIATIONAL_API_URLS,
  VARIATIONAL_ENDPOINTS,
  VARIATIONAL_RATE_LIMITS,
  VARIATIONAL_ORDER_TYPES,
  VARIATIONAL_ORDER_SIDES,
  VARIATIONAL_ORDER_STATUS,
} from './constants.js';

// Error codes
export {
  VARIATIONAL_CLIENT_ERRORS,
  VARIATIONAL_SERVER_ERRORS,
  VARIATIONAL_RATE_LIMIT_ERROR,
  mapVariationalError,
} from './error-codes.js';

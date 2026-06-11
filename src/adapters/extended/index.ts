/**
 * Extended Exchange Adapter
 *
 * Public exports for Extended adapter
 */

// Main adapter
export { ExtendedAdapter } from './ExtendedAdapter.js';

// WebSocket wrapper
export { ExtendedWebSocketWrapper } from './ExtendedWebSocketWrapper.js';
export type { ExtendedWebSocketConfig } from './ExtendedWebSocketWrapper.js';

// StarkNet client
export { ExtendedStarkNetClient } from './ExtendedStarkNetClient.js';
export type { ExtendedStarkNetConfig } from './ExtendedStarkNetClient.js';

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
  // WebSocket types (RAW wire envelopes, live-verified 2026-06-11)
  ExtendedWSOrderBookFrame,
  ExtendedWSTrade,
  ExtendedWSTradesFrame,
} from './types.js';

// WebSocket wire schemas + int64-safe trades frame decoder
export {
  ExtendedWSOrderBookSchema,
  ExtendedWSTradesSchema,
  ExtendedWSTradeSchema,
  parseExtendedWSTradesFrame,
} from './types.js';

// Stateful WS order book (SNAPSHOT seed + DELTA apply via `c`)
export { ExtendedOrderBookState } from './utils.js';

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
  EXTENDED_WS_CONFIG,
  EXTENDED_WS_CHANNELS,
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

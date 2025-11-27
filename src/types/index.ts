/**
 * Type Exports for Perp DEX SDK
 */

// Common types
export type {
  Order,
  OrderRequest,
  OrderType,
  OrderSide,
  OrderStatus,
  TimeInForce,
  Position,
  PositionSide,
  MarginMode,
  Market,
  OrderBook,
  PriceLevel,
  Trade,
  FundingRate,
  Balance,
  Ticker,
  MarketParams,
  OrderBookParams,
  TradeParams,
} from './common.js';

export {
  ORDER_TYPES,
  ORDER_SIDES,
  ORDER_STATUSES,
  TIME_IN_FORCE,
  POSITION_SIDES,
  MARGIN_MODES,
} from './common.js';

// Adapter interface
export type {
  IExchangeAdapter,
  IAuthStrategy,
  FeatureMap,
  RequestParams,
  AuthenticatedRequest,
  ExchangeConfig,
  RateLimitConfig,
} from './adapter.js';

// Errors
export {
  PerpDEXError,
  InsufficientMarginError,
  OrderNotFoundError,
  InvalidOrderError,
  PositionNotFoundError,
  RateLimitError,
  ExchangeUnavailableError,
  WebSocketDisconnectedError,
  InvalidSignatureError,
  ExpiredAuthError,
  InsufficientPermissionsError,
  TransactionFailedError,
  SlippageExceededError,
  LiquidationError,
  isPerpDEXError,
  isRateLimitError,
  isAuthError,
} from './errors.js';

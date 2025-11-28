/**
 * Perp DEX SDK - Main Entry Point
 *
 * Unified TypeScript SDK for decentralized perpetual exchanges
 */

// =============================================================================
// Factory Functions
// =============================================================================

export { createExchange, getSupportedExchanges, isExchangeSupported } from './factory.js';
export type { SupportedExchange, ExchangeConfigMap } from './factory.js';

// =============================================================================
// Types
// =============================================================================

export type {
  // Common types
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
  // Adapter interface
  IExchangeAdapter,
  IAuthStrategy,
  FeatureMap,
  RequestParams,
  AuthenticatedRequest,
  ExchangeConfig,
  RateLimitConfig,
} from './types/index.js';

export {
  // Constants
  ORDER_TYPES,
  ORDER_SIDES,
  ORDER_STATUSES,
  TIME_IN_FORCE,
  POSITION_SIDES,
  MARGIN_MODES,
  // Errors
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
} from './types/index.js';

// =============================================================================
// WebSocket Infrastructure
// =============================================================================

export { WebSocketClient, WebSocketManager } from './websocket/index.js';

export type {
  ConnectionState,
  WebSocketConfig,
  ReconnectConfig,
  HeartbeatConfig,
  Subscription,
  WebSocketMessage,
  MessageHandler,
  WebSocketMetrics,
} from './websocket/index.js';

// =============================================================================
// Core Utilities
// =============================================================================

// Rate Limiter
export { RateLimiter } from './core/RateLimiter.js';
export type { RateLimiterConfig } from './core/RateLimiter.js';

// PnL Calculations
export {
  calculateUnrealizedPnl,
  calculateLiquidationPrice,
  calculateRequiredMargin,
  calculatePositionValue,
  calculateROE,
  calculateMarginRatio,
  calculateEffectiveLeverage,
  calculateFundingPayment,
  calculateBreakEvenPrice,
  calculateMaxPositionSize,
  calculateAverageEntryPrice,
  calculateMarkToMarket,
} from './core/calculations/pnl.js';

// Symbol Utilities
export {
  parseSymbol,
  buildSymbol,
  isValidSymbol,
  getBaseCurrency,
  getQuoteCurrency,
  getSettleCurrency,
  isPerpetual,
  normalizeSymbol,
  compareSymbols,
  filterByBase,
  filterByQuote,
  groupByBase,
} from './utils/symbols.js';
export type { SymbolParts } from './utils/symbols.js';

// =============================================================================
// Validation
// =============================================================================

export {
  OrderRequestSchema,
  OrderSchema,
  PositionSchema,
  MarketSchema,
  OrderBookSchema,
  TradeSchema,
  FundingRateSchema,
  BalanceSchema,
  TickerSchema,
  validateData,
  validateArray,
} from './core/validation/schemas.js';

// =============================================================================
// Exchange Adapters
// =============================================================================

// Base adapter
export { BaseAdapter } from './adapters/base/BaseAdapter.js';

// Hyperliquid
export { HyperliquidAdapter, HyperliquidAuth } from './adapters/hyperliquid/index.js';
export type { HyperliquidConfig } from './adapters/hyperliquid/index.js';

// Lighter
export { LighterAdapter } from './adapters/lighter/index.js';
export type { LighterConfig } from './adapters/lighter/index.js';

// GRVT (temporarily disabled - under development)
// export { GRVTAdapter, GRVTAuth } from './adapters/grvt/index.js';
// export type { GRVTAdapterConfig, GRVTAuthConfig } from './adapters/grvt/index.js';

// =============================================================================
// Version
// =============================================================================

export const VERSION = '0.1.0';

/**
 * Validation Module
 *
 * Provides Zod schemas and validation middleware for consistent
 * request/response validation across all adapters.
 */

// Re-export all schemas
export {
  // Base schemas
  OrderTypeSchema,
  OrderSideSchema,
  OrderStatusSchema,
  TimeInForceSchema,
  OrderRequestSchema,
  OrderSchema,
  // Position schemas
  PositionSideSchema,
  MarginModeSchema,
  PositionSchema,
  // Market schemas
  MarketSchema,
  // Order book schemas
  PriceLevelSchema,
  OrderBookSchema,
  // Trade schemas
  TradeSchema,
  // Funding rate schemas
  FundingRateSchema,
  // Balance schemas
  BalanceSchema,
  // Ticker schemas
  TickerSchema,
  // Parameter schemas
  MarketParamsSchema,
  OrderBookParamsSchema,
  TradeParamsSchema,
  // Validation helpers
  validateData,
  validateArray as validateArraySimple,
} from './schemas.js';

// Re-export types from schemas
export type {
  OrderRequest,
  Order,
  Position,
  Market,
  OrderBook,
  Trade,
  FundingRate,
  Balance,
  Ticker,
  MarketParams,
  OrderBookParams,
  TradeParams,
} from './schemas.js';

// Re-export middleware
export {
  // Main validation functions
  validate,
  validateSafe,
  validateOrderRequest,
  validateOrderBookParams,
  validateTradeParams,
  validateMarketParams,
  validateArray,
  // Factory function
  createValidator,
  // Decorator
  validateResponse,
} from './middleware.js';

// Re-export middleware types
export type { ValidationResult, ValidationError, ValidationOptions } from './middleware.js';

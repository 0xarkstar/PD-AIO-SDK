/**
 * Validation Module
 *
 * Provides Zod schemas and validation middleware for consistent
 * request/response validation across all adapters.
 */
export { OrderTypeSchema, OrderSideSchema, OrderStatusSchema, TimeInForceSchema, OrderRequestSchema, OrderSchema, PositionSideSchema, MarginModeSchema, PositionSchema, MarketSchema, PriceLevelSchema, OrderBookSchema, TradeSchema, FundingRateSchema, BalanceSchema, TickerSchema, MarketParamsSchema, OrderBookParamsSchema, TradeParamsSchema, validateData, validateArray as validateArraySimple, } from './schemas.js';
export type { OrderRequest, Order, Position, Market, OrderBook, Trade, FundingRate, Balance, Ticker, MarketParams, OrderBookParams, TradeParams, } from './schemas.js';
export { validate, validateSafe, validateOrderRequest, validateOrderBookParams, validateTradeParams, validateMarketParams, validateArray, createValidator, validateResponse, } from './middleware.js';
export type { ValidationResult, ValidationError, ValidationOptions } from './middleware.js';
//# sourceMappingURL=index.d.ts.map
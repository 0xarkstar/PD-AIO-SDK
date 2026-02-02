/**
 * Type Exports for Perp DEX SDK
 */
export type { Order, OrderRequest, OrderType, OrderSide, OrderStatus, TimeInForce, Position, PositionSide, MarginMode, Market, OrderBook, PriceLevel, Trade, FundingRate, Balance, Ticker, Transaction, TransactionType, TransactionStatus, UserFees, Portfolio, RateLimitStatus, MarketParams, OrderBookParams, TradeParams, OHLCV, OHLCVData, OHLCVTimeframe, OHLCVParams, } from './common.js';
export { ORDER_TYPES, ORDER_SIDES, ORDER_STATUSES, TIME_IN_FORCE, POSITION_SIDES, MARGIN_MODES, TRANSACTION_TYPES, TRANSACTION_STATUSES, OHLCV_TIMEFRAMES, } from './common.js';
export type { IExchangeAdapter, IAuthStrategy, FeatureMap, RequestParams, AuthenticatedRequest, ExchangeConfig, RateLimitConfig, } from './adapter.js';
export type { HealthStatus, HealthCheckResult, HealthCheckConfig, ComponentHealth, AuthHealth, WebSocketHealth, } from './health.js';
export { determineHealthStatus, isHealthy, isCriticallyUnhealthy, } from './health.js';
export { PerpDEXError, InsufficientMarginError, OrderNotFoundError, InvalidOrderError, PositionNotFoundError, RateLimitError, ExchangeUnavailableError, WebSocketDisconnectedError, InvalidSignatureError, ExpiredAuthError, InsufficientPermissionsError, TransactionFailedError, SlippageExceededError, LiquidationError, isPerpDEXError, isRateLimitError, isAuthError, } from './errors.js';
//# sourceMappingURL=index.d.ts.map
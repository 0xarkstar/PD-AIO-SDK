/**
 * Type Exports for Perp DEX SDK
 */
export { ORDER_TYPES, ORDER_SIDES, ORDER_STATUSES, TIME_IN_FORCE, POSITION_SIDES, MARGIN_MODES, TRANSACTION_TYPES, TRANSACTION_STATUSES, OHLCV_TIMEFRAMES, 
// New CCXT-compatible constants
LEDGER_ENTRY_TYPES, EXCHANGE_STATUS_VALUES, } from './common.js';
export { determineHealthStatus, isHealthy, isCriticallyUnhealthy, } from './health.js';
// Errors
export { PerpDEXError, 
// General Exchange Errors (CCXT-compatible)
ExchangeError, NotSupportedError, BadRequestError, BadResponseError, AuthenticationError, 
// Trading Errors
InsufficientMarginError, OrderNotFoundError, InvalidOrderError, PositionNotFoundError, 
// Network Errors
NetworkError, RateLimitError, ExchangeUnavailableError, WebSocketDisconnectedError, 
// Auth Errors
InvalidSignatureError, ExpiredAuthError, InsufficientPermissionsError, 
// Validation Errors
ValidationError, InvalidSymbolError, InvalidParameterError, 
// Timeout Errors
TimeoutError, RequestTimeoutError, 
// Order Execution Errors
InsufficientBalanceError, OrderRejectedError, MinimumOrderSizeError, 
// DEX-Specific Errors
TransactionFailedError, SlippageExceededError, LiquidationError, 
// Type Guards
isPerpDEXError, isRateLimitError, isAuthError, isNetworkError, isTimeoutError, isValidationError, isExchangeError, isNotSupportedError, isBadRequestError, isBadResponseError, isAuthenticationError, isOrderError, isTradingError, 
// Standard Error Codes
StandardErrorCodes, } from './errors.js';
//# sourceMappingURL=index.js.map
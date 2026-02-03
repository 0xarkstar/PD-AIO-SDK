/**
 * Error Hierarchy for Perp DEX SDK
 *
 * All errors extend PerpDEXError with exchange context
 */
/**
 * Base error class for all SDK errors
 */
export declare class PerpDEXError extends Error {
    readonly code: string;
    readonly exchange: string;
    readonly originalError?: unknown;
    /** Correlation ID for request tracing */
    correlationId?: string;
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
    /**
     * Set correlation ID for this error
     */
    withCorrelationId(correlationId: string): this;
    toJSON(): Record<string, unknown>;
}
/**
 * General exchange error - base for exchange-specific errors
 */
export declare class ExchangeError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
/**
 * Feature not supported by exchange
 */
export declare class NotSupportedError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
/**
 * Bad request - malformed or invalid request parameters
 */
export declare class BadRequestError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
/**
 * Bad response - invalid or unexpected API response
 */
export declare class BadResponseError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
/**
 * General authentication error
 */
export declare class AuthenticationError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
export declare class InsufficientMarginError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
export declare class OrderNotFoundError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
export declare class InvalidOrderError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
export declare class PositionNotFoundError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
export declare class NetworkError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
export declare class RateLimitError extends PerpDEXError {
    readonly retryAfter?: number | undefined;
    constructor(message: string, code: string, exchange: string, retryAfter?: number | undefined, originalError?: unknown);
}
export declare class ExchangeUnavailableError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
export declare class WebSocketDisconnectedError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
export declare class InvalidSignatureError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
export declare class ExpiredAuthError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
export declare class InsufficientPermissionsError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
export declare class ValidationError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
export declare class InvalidSymbolError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
export declare class InvalidParameterError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
export declare class TimeoutError extends PerpDEXError {
    readonly timeoutMs?: number | undefined;
    constructor(message: string, code: string, exchange: string, timeoutMs?: number | undefined, originalError?: unknown);
}
export declare class RequestTimeoutError extends TimeoutError {
    constructor(message: string, code: string, exchange: string, timeoutMs?: number, originalError?: unknown);
}
export declare class InsufficientBalanceError extends PerpDEXError {
    readonly required?: number | undefined;
    readonly available?: number | undefined;
    constructor(message: string, code: string, exchange: string, required?: number | undefined, available?: number | undefined, originalError?: unknown);
}
export declare class OrderRejectedError extends PerpDEXError {
    readonly reason?: string | undefined;
    constructor(message: string, code: string, exchange: string, reason?: string | undefined, originalError?: unknown);
}
export declare class MinimumOrderSizeError extends PerpDEXError {
    readonly minSize?: number | undefined;
    readonly requestedSize?: number | undefined;
    constructor(message: string, code: string, exchange: string, minSize?: number | undefined, requestedSize?: number | undefined, originalError?: unknown);
}
export declare class TransactionFailedError extends PerpDEXError {
    readonly txHash?: string | undefined;
    constructor(message: string, code: string, exchange: string, txHash?: string | undefined, originalError?: unknown);
}
export declare class SlippageExceededError extends PerpDEXError {
    readonly expectedPrice: number;
    readonly actualPrice: number;
    constructor(message: string, code: string, exchange: string, expectedPrice: number, actualPrice: number, originalError?: unknown);
}
export declare class LiquidationError extends PerpDEXError {
    constructor(message: string, code: string, exchange: string, originalError?: unknown);
}
export declare function isPerpDEXError(error: unknown): error is PerpDEXError;
export declare function isRateLimitError(error: unknown): error is RateLimitError;
export declare function isAuthError(error: unknown): error is InvalidSignatureError | ExpiredAuthError | InsufficientPermissionsError;
export declare function isNetworkError(error: unknown): error is NetworkError;
export declare function isTimeoutError(error: unknown): error is TimeoutError;
export declare function isValidationError(error: unknown): error is ValidationError;
export declare function isExchangeError(error: unknown): error is ExchangeError;
export declare function isNotSupportedError(error: unknown): error is NotSupportedError;
export declare function isBadRequestError(error: unknown): error is BadRequestError;
export declare function isBadResponseError(error: unknown): error is BadResponseError;
export declare function isAuthenticationError(error: unknown): error is AuthenticationError;
export declare function isOrderError(error: unknown): error is InvalidOrderError | OrderNotFoundError | OrderRejectedError;
export declare function isTradingError(error: unknown): error is InsufficientMarginError | InsufficientBalanceError | LiquidationError;
/**
 * Standardized error codes used across all adapters.
 * When mapping exchange-specific errors, prefer using these standard codes.
 */
export declare const StandardErrorCodes: {
    readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
    readonly INVALID_RESPONSE: "INVALID_RESPONSE";
    readonly NOT_SUPPORTED: "NOT_SUPPORTED";
    readonly NOT_IMPLEMENTED: "NOT_IMPLEMENTED";
    readonly EXCHANGE_ERROR: "EXCHANGE_ERROR";
    readonly BAD_REQUEST: "BAD_REQUEST";
    readonly BAD_RESPONSE: "BAD_RESPONSE";
    readonly MISSING_CREDENTIALS: "MISSING_CREDENTIALS";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly INVALID_SIGNATURE: "INVALID_SIGNATURE";
    readonly EXPIRED_AUTH: "EXPIRED_AUTH";
    readonly INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly REQUEST_TIMEOUT: "REQUEST_TIMEOUT";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly EXCHANGE_UNAVAILABLE: "EXCHANGE_UNAVAILABLE";
    readonly WEBSOCKET_DISCONNECTED: "WEBSOCKET_DISCONNECTED";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INVALID_SYMBOL: "INVALID_SYMBOL";
    readonly INVALID_PARAMETER: "INVALID_PARAMETER";
    readonly INVALID_ORDER_TYPE: "INVALID_ORDER_TYPE";
    readonly INVALID_AMOUNT: "INVALID_AMOUNT";
    readonly INVALID_PRICE: "INVALID_PRICE";
    readonly ORDER_NOT_FOUND: "ORDER_NOT_FOUND";
    readonly ORDER_REJECTED: "ORDER_REJECTED";
    readonly ORDER_ALREADY_FILLED: "ORDER_ALREADY_FILLED";
    readonly ORDER_ALREADY_CANCELLED: "ORDER_ALREADY_CANCELLED";
    readonly INSUFFICIENT_MARGIN: "INSUFFICIENT_MARGIN";
    readonly INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE";
    readonly MIN_ORDER_SIZE: "MIN_ORDER_SIZE";
    readonly MAX_ORDER_SIZE: "MAX_ORDER_SIZE";
    readonly PRICE_OUT_OF_RANGE: "PRICE_OUT_OF_RANGE";
    readonly POSITION_NOT_FOUND: "POSITION_NOT_FOUND";
    readonly MAX_LEVERAGE_EXCEEDED: "MAX_LEVERAGE_EXCEEDED";
    readonly REDUCE_ONLY_VIOLATION: "REDUCE_ONLY_VIOLATION";
    readonly TRANSACTION_FAILED: "TRANSACTION_FAILED";
    readonly SLIPPAGE_EXCEEDED: "SLIPPAGE_EXCEEDED";
    readonly LIQUIDATION: "LIQUIDATION";
    readonly NONCE_ERROR: "NONCE_ERROR";
};
export type StandardErrorCode = typeof StandardErrorCodes[keyof typeof StandardErrorCodes];
//# sourceMappingURL=errors.d.ts.map
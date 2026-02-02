/**
 * Error Hierarchy for Perp DEX SDK
 *
 * All errors extend PerpDEXError with exchange context
 */
/**
 * Base error class for all SDK errors
 */
export class PerpDEXError extends Error {
    code;
    exchange;
    originalError;
    /** Correlation ID for request tracing */
    correlationId;
    constructor(message, code, exchange, originalError) {
        super(message);
        this.code = code;
        this.exchange = exchange;
        this.originalError = originalError;
        this.name = 'PerpDEXError';
        Object.setPrototypeOf(this, PerpDEXError.prototype);
    }
    /**
     * Set correlation ID for this error
     */
    withCorrelationId(correlationId) {
        this.correlationId = correlationId;
        return this;
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            exchange: this.exchange,
            correlationId: this.correlationId,
            originalError: this.originalError,
        };
    }
}
// =============================================================================
// Trading Errors
// =============================================================================
export class InsufficientMarginError extends PerpDEXError {
    constructor(message, code, exchange, originalError) {
        super(message, code, exchange, originalError);
        this.name = 'InsufficientMarginError';
        Object.setPrototypeOf(this, InsufficientMarginError.prototype);
    }
}
export class OrderNotFoundError extends PerpDEXError {
    constructor(message, code, exchange, originalError) {
        super(message, code, exchange, originalError);
        this.name = 'OrderNotFoundError';
        Object.setPrototypeOf(this, OrderNotFoundError.prototype);
    }
}
export class InvalidOrderError extends PerpDEXError {
    constructor(message, code, exchange, originalError) {
        super(message, code, exchange, originalError);
        this.name = 'InvalidOrderError';
        Object.setPrototypeOf(this, InvalidOrderError.prototype);
    }
}
export class PositionNotFoundError extends PerpDEXError {
    constructor(message, code, exchange, originalError) {
        super(message, code, exchange, originalError);
        this.name = 'PositionNotFoundError';
        Object.setPrototypeOf(this, PositionNotFoundError.prototype);
    }
}
// =============================================================================
// Network Errors
// =============================================================================
export class NetworkError extends PerpDEXError {
    constructor(message, code, exchange, originalError) {
        super(message, code, exchange, originalError);
        this.name = 'NetworkError';
        Object.setPrototypeOf(this, NetworkError.prototype);
    }
}
export class RateLimitError extends PerpDEXError {
    retryAfter;
    constructor(message, code, exchange, retryAfter, originalError) {
        super(message, code, exchange, originalError);
        this.retryAfter = retryAfter;
        this.name = 'RateLimitError';
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}
export class ExchangeUnavailableError extends PerpDEXError {
    constructor(message, code, exchange, originalError) {
        super(message, code, exchange, originalError);
        this.name = 'ExchangeUnavailableError';
        Object.setPrototypeOf(this, ExchangeUnavailableError.prototype);
    }
}
export class WebSocketDisconnectedError extends PerpDEXError {
    constructor(message, code, exchange, originalError) {
        super(message, code, exchange, originalError);
        this.name = 'WebSocketDisconnectedError';
        Object.setPrototypeOf(this, WebSocketDisconnectedError.prototype);
    }
}
// =============================================================================
// Authentication Errors
// =============================================================================
export class InvalidSignatureError extends PerpDEXError {
    constructor(message, code, exchange, originalError) {
        super(message, code, exchange, originalError);
        this.name = 'InvalidSignatureError';
        Object.setPrototypeOf(this, InvalidSignatureError.prototype);
    }
}
export class ExpiredAuthError extends PerpDEXError {
    constructor(message, code, exchange, originalError) {
        super(message, code, exchange, originalError);
        this.name = 'ExpiredAuthError';
        Object.setPrototypeOf(this, ExpiredAuthError.prototype);
    }
}
export class InsufficientPermissionsError extends PerpDEXError {
    constructor(message, code, exchange, originalError) {
        super(message, code, exchange, originalError);
        this.name = 'InsufficientPermissionsError';
        Object.setPrototypeOf(this, InsufficientPermissionsError.prototype);
    }
}
// =============================================================================
// Validation Errors
// =============================================================================
export class ValidationError extends PerpDEXError {
    constructor(message, code, exchange, originalError) {
        super(message, code, exchange, originalError);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
export class InvalidSymbolError extends PerpDEXError {
    constructor(message, code, exchange, originalError) {
        super(message, code, exchange, originalError);
        this.name = 'InvalidSymbolError';
        Object.setPrototypeOf(this, InvalidSymbolError.prototype);
    }
}
export class InvalidParameterError extends PerpDEXError {
    constructor(message, code, exchange, originalError) {
        super(message, code, exchange, originalError);
        this.name = 'InvalidParameterError';
        Object.setPrototypeOf(this, InvalidParameterError.prototype);
    }
}
// =============================================================================
// Timeout Errors
// =============================================================================
export class TimeoutError extends PerpDEXError {
    timeoutMs;
    constructor(message, code, exchange, timeoutMs, originalError) {
        super(message, code, exchange, originalError);
        this.timeoutMs = timeoutMs;
        this.name = 'TimeoutError';
        Object.setPrototypeOf(this, TimeoutError.prototype);
    }
}
export class RequestTimeoutError extends TimeoutError {
    constructor(message, code, exchange, timeoutMs, originalError) {
        super(message, code, exchange, timeoutMs, originalError);
        this.name = 'RequestTimeoutError';
        Object.setPrototypeOf(this, RequestTimeoutError.prototype);
    }
}
// =============================================================================
// Order Execution Errors
// =============================================================================
export class InsufficientBalanceError extends PerpDEXError {
    required;
    available;
    constructor(message, code, exchange, required, available, originalError) {
        super(message, code, exchange, originalError);
        this.required = required;
        this.available = available;
        this.name = 'InsufficientBalanceError';
        Object.setPrototypeOf(this, InsufficientBalanceError.prototype);
    }
}
export class OrderRejectedError extends PerpDEXError {
    reason;
    constructor(message, code, exchange, reason, originalError) {
        super(message, code, exchange, originalError);
        this.reason = reason;
        this.name = 'OrderRejectedError';
        Object.setPrototypeOf(this, OrderRejectedError.prototype);
    }
}
export class MinimumOrderSizeError extends PerpDEXError {
    minSize;
    requestedSize;
    constructor(message, code, exchange, minSize, requestedSize, originalError) {
        super(message, code, exchange, originalError);
        this.minSize = minSize;
        this.requestedSize = requestedSize;
        this.name = 'MinimumOrderSizeError';
        Object.setPrototypeOf(this, MinimumOrderSizeError.prototype);
    }
}
// =============================================================================
// DEX-Specific Errors
// =============================================================================
export class TransactionFailedError extends PerpDEXError {
    txHash;
    constructor(message, code, exchange, txHash, originalError) {
        super(message, code, exchange, originalError);
        this.txHash = txHash;
        this.name = 'TransactionFailedError';
        Object.setPrototypeOf(this, TransactionFailedError.prototype);
    }
}
export class SlippageExceededError extends PerpDEXError {
    expectedPrice;
    actualPrice;
    constructor(message, code, exchange, expectedPrice, actualPrice, originalError) {
        super(message, code, exchange, originalError);
        this.expectedPrice = expectedPrice;
        this.actualPrice = actualPrice;
        this.name = 'SlippageExceededError';
        Object.setPrototypeOf(this, SlippageExceededError.prototype);
    }
}
export class LiquidationError extends PerpDEXError {
    constructor(message, code, exchange, originalError) {
        super(message, code, exchange, originalError);
        this.name = 'LiquidationError';
        Object.setPrototypeOf(this, LiquidationError.prototype);
    }
}
// =============================================================================
// Type Guards
// =============================================================================
export function isPerpDEXError(error) {
    return error instanceof PerpDEXError;
}
export function isRateLimitError(error) {
    return error instanceof RateLimitError;
}
export function isAuthError(error) {
    return (error instanceof InvalidSignatureError ||
        error instanceof ExpiredAuthError ||
        error instanceof InsufficientPermissionsError);
}
export function isNetworkError(error) {
    return error instanceof NetworkError;
}
export function isTimeoutError(error) {
    return error instanceof TimeoutError;
}
export function isValidationError(error) {
    return error instanceof ValidationError;
}
export function isOrderError(error) {
    return (error instanceof InvalidOrderError ||
        error instanceof OrderNotFoundError ||
        error instanceof OrderRejectedError);
}
export function isTradingError(error) {
    return (error instanceof InsufficientMarginError ||
        error instanceof InsufficientBalanceError ||
        error instanceof LiquidationError);
}
// =============================================================================
// Standard Error Codes
// =============================================================================
/**
 * Standardized error codes used across all adapters.
 * When mapping exchange-specific errors, prefer using these standard codes.
 */
export const StandardErrorCodes = {
    // Generic
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    INVALID_RESPONSE: 'INVALID_RESPONSE',
    NOT_SUPPORTED: 'NOT_SUPPORTED',
    NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
    // Authentication
    MISSING_CREDENTIALS: 'MISSING_CREDENTIALS',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    INVALID_SIGNATURE: 'INVALID_SIGNATURE',
    EXPIRED_AUTH: 'EXPIRED_AUTH',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    // Network
    NETWORK_ERROR: 'NETWORK_ERROR',
    REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    EXCHANGE_UNAVAILABLE: 'EXCHANGE_UNAVAILABLE',
    WEBSOCKET_DISCONNECTED: 'WEBSOCKET_DISCONNECTED',
    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_SYMBOL: 'INVALID_SYMBOL',
    INVALID_PARAMETER: 'INVALID_PARAMETER',
    INVALID_ORDER_TYPE: 'INVALID_ORDER_TYPE',
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    INVALID_PRICE: 'INVALID_PRICE',
    // Order Errors
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    ORDER_REJECTED: 'ORDER_REJECTED',
    ORDER_ALREADY_FILLED: 'ORDER_ALREADY_FILLED',
    ORDER_ALREADY_CANCELLED: 'ORDER_ALREADY_CANCELLED',
    INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    MIN_ORDER_SIZE: 'MIN_ORDER_SIZE',
    MAX_ORDER_SIZE: 'MAX_ORDER_SIZE',
    PRICE_OUT_OF_RANGE: 'PRICE_OUT_OF_RANGE',
    // Position Errors
    POSITION_NOT_FOUND: 'POSITION_NOT_FOUND',
    MAX_LEVERAGE_EXCEEDED: 'MAX_LEVERAGE_EXCEEDED',
    REDUCE_ONLY_VIOLATION: 'REDUCE_ONLY_VIOLATION',
    // DEX-Specific
    TRANSACTION_FAILED: 'TRANSACTION_FAILED',
    SLIPPAGE_EXCEEDED: 'SLIPPAGE_EXCEEDED',
    LIQUIDATION: 'LIQUIDATION',
    NONCE_ERROR: 'NONCE_ERROR',
};
//# sourceMappingURL=errors.js.map
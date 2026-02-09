/**
 * Lighter Error Handling
 *
 * Provides error code constants and mapping functions for Lighter-specific errors.
 * Translates Lighter API error responses to unified SDK error types.
 *
 * @see https://docs.lighter.xyz/api/errors
 */
import { includesValue } from '../../utils/type-guards.js';
import { PerpDEXError, InvalidOrderError, InsufficientMarginError, OrderNotFoundError, InvalidSignatureError, RateLimitError, ExchangeUnavailableError, } from '../../types/errors.js';
/**
 * Lighter Client Error Codes
 * These errors indicate client-side issues and should NOT be retried.
 */
export const LIGHTER_CLIENT_ERRORS = {
    // Authentication & Signature
    INVALID_SIGNATURE: 'invalid_signature',
    UNAUTHORIZED: 'unauthorized',
    INVALID_API_KEY: 'invalid_api_key',
    MISSING_API_KEY: 'missing_api_key',
    // Order Errors
    INVALID_ORDER: 'invalid_order',
    INSUFFICIENT_MARGIN: 'insufficient_margin',
    INSUFFICIENT_BALANCE: 'insufficient_balance',
    ORDER_NOT_FOUND: 'order_not_found',
    INVALID_PRICE: 'invalid_price',
    INVALID_AMOUNT: 'invalid_amount',
    INVALID_ORDER_SIZE: 'invalid_order_size',
    MIN_SIZE_NOT_MET: 'min_size_not_met',
    MAX_SIZE_EXCEEDED: 'max_size_exceeded',
    INVALID_SYMBOL: 'invalid_symbol',
    // Market Errors
    MARKET_CLOSED: 'market_closed',
    MARKET_NOT_FOUND: 'market_not_found',
    TRADING_SUSPENDED: 'trading_suspended',
    // Validation Errors
    INVALID_PARAMS: 'invalid_params',
    MISSING_REQUIRED_FIELD: 'missing_required_field',
    // Transaction/Nonce Errors
    INVALID_NONCE: 'invalid_nonce',
    NONCE_TOO_LOW: 'nonce_too_low',
    NONCE_TOO_HIGH: 'nonce_too_high',
    TRANSACTION_FAILED: 'transaction_failed',
    SIGNING_FAILED: 'signing_failed',
};
/**
 * Lighter Server Error Codes
 * These errors indicate server-side issues and MAY be retried with backoff.
 */
export const LIGHTER_SERVER_ERRORS = {
    INTERNAL_ERROR: 'internal_error',
    SERVICE_UNAVAILABLE: 'service_unavailable',
    EXCHANGE_UNAVAILABLE: 'exchange_unavailable',
    TIMEOUT: 'timeout',
    MAINTENANCE: 'maintenance',
    OFFLINE: 'offline',
    DATABASE_ERROR: 'database_error',
};
/**
 * Lighter Rate Limit Error
 * Should be retried with exponential backoff.
 */
export const LIGHTER_RATE_LIMIT_ERROR = 'rate_limit_exceeded';
/**
 * Lighter Network Errors
 * Connection and network-related errors that may be transient.
 */
export const LIGHTER_NETWORK_ERRORS = {
    ECONNRESET: 'ECONNRESET',
    ETIMEDOUT: 'ETIMEDOUT',
    ENOTFOUND: 'ENOTFOUND',
    ECONNREFUSED: 'ECONNREFUSED',
    NETWORK_ERROR: 'NETWORK_ERROR',
};
/**
 * Check if an error code indicates a client error (non-retryable)
 *
 * @param errorCode - Error code to check
 * @returns true if client error
 */
export function isClientError(errorCode) {
    return includesValue(Object.values(LIGHTER_CLIENT_ERRORS), errorCode);
}
/**
 * Check if an error code indicates a server error (retryable)
 *
 * @param errorCode - Error code to check
 * @returns true if server error
 */
export function isServerError(errorCode) {
    return includesValue(Object.values(LIGHTER_SERVER_ERRORS), errorCode);
}
/**
 * Check if an error code indicates a network error (retryable)
 *
 * @param errorCode - Error code to check
 * @returns true if network error
 */
export function isNetworkError(errorCode) {
    return includesValue(Object.values(LIGHTER_NETWORK_ERRORS), errorCode);
}
/**
 * Check if an error should be retried
 *
 * @param errorCode - Error code to check
 * @returns true if retryable
 */
export function isRetryableError(errorCode) {
    return (isServerError(errorCode) || isNetworkError(errorCode) || errorCode === LIGHTER_RATE_LIMIT_ERROR);
}
/**
 * Map Lighter error message to error code
 * Lighter uses message-based error detection
 *
 * @param errorMessage - Error message from Lighter API
 * @returns Error code
 */
export function extractErrorCode(errorMessage) {
    const messageLower = errorMessage.toLowerCase();
    // Rate limit
    if (messageLower.includes('rate limit') || messageLower.includes('too many requests')) {
        return LIGHTER_RATE_LIMIT_ERROR;
    }
    // Insufficient margin/balance
    if (messageLower.includes('insufficient')) {
        if (messageLower.includes('margin')) {
            return LIGHTER_CLIENT_ERRORS.INSUFFICIENT_MARGIN;
        }
        if (messageLower.includes('balance')) {
            return LIGHTER_CLIENT_ERRORS.INSUFFICIENT_BALANCE;
        }
    }
    // Invalid order
    if (messageLower.includes('invalid order') ||
        messageLower.includes('order size') ||
        messageLower.includes('price')) {
        if (messageLower.includes('size')) {
            return LIGHTER_CLIENT_ERRORS.INVALID_ORDER_SIZE;
        }
        if (messageLower.includes('price')) {
            return LIGHTER_CLIENT_ERRORS.INVALID_PRICE;
        }
        return LIGHTER_CLIENT_ERRORS.INVALID_ORDER;
    }
    // Order not found
    if (messageLower.includes('not found') && messageLower.includes('order')) {
        return LIGHTER_CLIENT_ERRORS.ORDER_NOT_FOUND;
    }
    // Authentication
    if (messageLower.includes('unauthorized') ||
        messageLower.includes('authentication') ||
        messageLower.includes('invalid signature')) {
        return LIGHTER_CLIENT_ERRORS.INVALID_SIGNATURE;
    }
    // Exchange unavailable
    if (messageLower.includes('service') ||
        messageLower.includes('unavailable') ||
        messageLower.includes('maintenance') ||
        messageLower.includes('offline')) {
        return LIGHTER_SERVER_ERRORS.SERVICE_UNAVAILABLE;
    }
    // Nonce errors
    if (messageLower.includes('nonce')) {
        if (messageLower.includes('too low') || messageLower.includes('already used')) {
            return LIGHTER_CLIENT_ERRORS.NONCE_TOO_LOW;
        }
        if (messageLower.includes('too high') || messageLower.includes('future')) {
            return LIGHTER_CLIENT_ERRORS.NONCE_TOO_HIGH;
        }
        return LIGHTER_CLIENT_ERRORS.INVALID_NONCE;
    }
    // Transaction/Signing errors
    if (messageLower.includes('signing') || messageLower.includes('sign failed')) {
        return LIGHTER_CLIENT_ERRORS.SIGNING_FAILED;
    }
    if (messageLower.includes('transaction') && messageLower.includes('failed')) {
        return LIGHTER_CLIENT_ERRORS.TRANSACTION_FAILED;
    }
    return 'UNKNOWN_ERROR';
}
/**
 * Map Lighter error to unified SDK error type
 *
 * @param errorCode - Lighter error code
 * @param message - Error message
 * @param originalError - Original error object (optional)
 * @returns Mapped PerpDEXError subclass
 *
 * @example
 * ```typescript
 * const error = mapLighterError(
 *   'insufficient_margin',
 *   'Insufficient margin to place order'
 * );
 *
 * if (error instanceof InsufficientMarginError) {
 *   console.log('Need more collateral');
 * }
 * ```
 */
export function mapLighterError(errorCode, message, originalError) {
    // Rate Limit
    if (errorCode === LIGHTER_RATE_LIMIT_ERROR) {
        return new RateLimitError(message, errorCode, 'lighter', undefined, originalError);
    }
    // Insufficient Margin
    if (errorCode === LIGHTER_CLIENT_ERRORS.INSUFFICIENT_MARGIN ||
        errorCode === LIGHTER_CLIENT_ERRORS.INSUFFICIENT_BALANCE) {
        return new InsufficientMarginError(message, errorCode, 'lighter', originalError);
    }
    // Invalid Order
    if (errorCode === LIGHTER_CLIENT_ERRORS.INVALID_ORDER ||
        errorCode === LIGHTER_CLIENT_ERRORS.INVALID_PRICE ||
        errorCode === LIGHTER_CLIENT_ERRORS.INVALID_AMOUNT ||
        errorCode === LIGHTER_CLIENT_ERRORS.INVALID_ORDER_SIZE ||
        errorCode === LIGHTER_CLIENT_ERRORS.MIN_SIZE_NOT_MET ||
        errorCode === LIGHTER_CLIENT_ERRORS.MAX_SIZE_EXCEEDED) {
        return new InvalidOrderError(message, errorCode, 'lighter', originalError);
    }
    // Order Not Found
    if (errorCode === LIGHTER_CLIENT_ERRORS.ORDER_NOT_FOUND) {
        return new OrderNotFoundError(message, errorCode, 'lighter', originalError);
    }
    // Authentication
    if (errorCode === LIGHTER_CLIENT_ERRORS.INVALID_SIGNATURE ||
        errorCode === LIGHTER_CLIENT_ERRORS.UNAUTHORIZED ||
        errorCode === LIGHTER_CLIENT_ERRORS.INVALID_API_KEY) {
        return new InvalidSignatureError(message, errorCode, 'lighter', originalError);
    }
    // Nonce/Transaction Errors (treat as invalid order since they prevent order execution)
    if (errorCode === LIGHTER_CLIENT_ERRORS.INVALID_NONCE ||
        errorCode === LIGHTER_CLIENT_ERRORS.NONCE_TOO_LOW ||
        errorCode === LIGHTER_CLIENT_ERRORS.NONCE_TOO_HIGH ||
        errorCode === LIGHTER_CLIENT_ERRORS.TRANSACTION_FAILED ||
        errorCode === LIGHTER_CLIENT_ERRORS.SIGNING_FAILED) {
        return new InvalidOrderError(message, errorCode, 'lighter', originalError);
    }
    // Server/Network Errors
    if (isServerError(errorCode) || isNetworkError(errorCode)) {
        return new ExchangeUnavailableError(message, errorCode, 'lighter', originalError);
    }
    // Default: Generic PerpDEXError
    return new PerpDEXError(message, errorCode, 'lighter', originalError);
}
/**
 * Map error from unknown type (backward compatibility with utils.ts)
 *
 * @param error - Error object
 * @returns Mapped PerpDEXError
 */
export function mapError(error) {
    if (error instanceof PerpDEXError) {
        return error;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = extractErrorCode(errorMessage);
    const originalError = error instanceof Error ? error : undefined;
    return mapLighterError(errorCode, errorMessage, originalError);
}
/**
 * Map HTTP status code to error
 *
 * @param status - HTTP status code
 * @param statusText - HTTP status text
 * @returns Mapped error
 */
export function mapHttpError(status, statusText) {
    // 429 Rate Limit
    if (status === 429) {
        return new RateLimitError(`Rate limit exceeded: ${statusText}`, LIGHTER_RATE_LIMIT_ERROR, 'lighter', undefined // retryAfter parameter
        );
    }
    // 4xx Client Errors
    if (status >= 400 && status < 500) {
        return new InvalidOrderError(`Client error (${status}): ${statusText}`, `HTTP_${status}`, 'lighter');
    }
    // 5xx Server Errors
    if (status >= 500) {
        return new ExchangeUnavailableError(`Server error (${status}): ${statusText}`, `HTTP_${status}`, 'lighter');
    }
    // Other
    return new PerpDEXError(`HTTP error (${status}): ${statusText}`, `HTTP_${status}`, 'lighter');
}
//# sourceMappingURL=error-codes.js.map
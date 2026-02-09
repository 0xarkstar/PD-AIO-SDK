/**
 * Hyperliquid Error Handling
 *
 * Provides error code constants and mapping functions for Hyperliquid-specific errors.
 * Translates Hyperliquid API error responses to unified SDK error types.
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/errors
 */
import { includesValue } from '../../utils/type-guards.js';
import { PerpDEXError, InvalidOrderError, InsufficientMarginError, OrderNotFoundError, PositionNotFoundError, InvalidSignatureError, RateLimitError, ExchangeUnavailableError, } from '../../types/errors.js';
/**
 * Hyperliquid Client Error Codes
 */
export const HYPERLIQUID_CLIENT_ERRORS = {
    INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
    INVALID_SIGNATURE: 'INVALID_SIGNATURE',
    ORDER_WOULD_MATCH: 'ORDER_WOULD_MATCH',
    POSITION_NOT_FOUND: 'POSITION_NOT_FOUND',
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    INVALID_ORDER: 'INVALID_ORDER',
    INVALID_PRICE: 'INVALID_PRICE',
    INVALID_SIZE: 'INVALID_SIZE',
    UNAUTHORIZED: 'UNAUTHORIZED',
};
/**
 * Hyperliquid Server Error Codes
 */
export const HYPERLIQUID_SERVER_ERRORS = {
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    TIMEOUT: 'TIMEOUT',
};
/**
 * Hyperliquid Rate Limit Error
 */
export const HYPERLIQUID_RATE_LIMIT_ERROR = 'RATE_LIMIT_EXCEEDED';
/**
 * Hyperliquid Error Message Patterns
 * Maps error message patterns to error codes
 */
export const HYPERLIQUID_ERROR_MESSAGES = {
    'insufficient margin': HYPERLIQUID_CLIENT_ERRORS.INSUFFICIENT_MARGIN,
    'invalid signature': HYPERLIQUID_CLIENT_ERRORS.INVALID_SIGNATURE,
    'order would immediately match': HYPERLIQUID_CLIENT_ERRORS.ORDER_WOULD_MATCH,
    'position does not exist': HYPERLIQUID_CLIENT_ERRORS.POSITION_NOT_FOUND,
    'order not found': HYPERLIQUID_CLIENT_ERRORS.ORDER_NOT_FOUND,
    'rate limit exceeded': HYPERLIQUID_RATE_LIMIT_ERROR,
    'rate limit': HYPERLIQUID_RATE_LIMIT_ERROR,
    'too many requests': HYPERLIQUID_RATE_LIMIT_ERROR,
};
/**
 * Extract error code from error message
 */
export function extractErrorCode(errorMessage) {
    const messageLower = errorMessage.toLowerCase();
    for (const [pattern, code] of Object.entries(HYPERLIQUID_ERROR_MESSAGES)) {
        if (messageLower.includes(pattern)) {
            return code;
        }
    }
    // HTTP status code detection
    if (messageLower.includes('429')) {
        return HYPERLIQUID_RATE_LIMIT_ERROR;
    }
    if (messageLower.includes('500') || messageLower.includes('503')) {
        return HYPERLIQUID_SERVER_ERRORS.SERVICE_UNAVAILABLE;
    }
    return 'UNKNOWN_ERROR';
}
/**
 * Map Hyperliquid error to unified SDK error type
 */
export function mapHyperliquidError(errorCode, message, originalError) {
    switch (errorCode) {
        case HYPERLIQUID_CLIENT_ERRORS.INSUFFICIENT_MARGIN:
            return new InsufficientMarginError(message, errorCode, 'hyperliquid', originalError);
        case HYPERLIQUID_CLIENT_ERRORS.INVALID_SIGNATURE:
        case HYPERLIQUID_CLIENT_ERRORS.UNAUTHORIZED:
            return new InvalidSignatureError(message, errorCode, 'hyperliquid', originalError);
        case HYPERLIQUID_CLIENT_ERRORS.ORDER_WOULD_MATCH:
        case HYPERLIQUID_CLIENT_ERRORS.INVALID_ORDER:
        case HYPERLIQUID_CLIENT_ERRORS.INVALID_PRICE:
        case HYPERLIQUID_CLIENT_ERRORS.INVALID_SIZE:
            return new InvalidOrderError(message, errorCode, 'hyperliquid', originalError);
        case HYPERLIQUID_CLIENT_ERRORS.POSITION_NOT_FOUND:
            return new PositionNotFoundError(message, errorCode, 'hyperliquid', originalError);
        case HYPERLIQUID_CLIENT_ERRORS.ORDER_NOT_FOUND:
            return new OrderNotFoundError(message, errorCode, 'hyperliquid', originalError);
        case HYPERLIQUID_RATE_LIMIT_ERROR:
            return new RateLimitError(message, errorCode, 'hyperliquid', undefined, originalError);
        default:
            if (includesValue(Object.values(HYPERLIQUID_SERVER_ERRORS), errorCode)) {
                return new ExchangeUnavailableError(message, errorCode, 'hyperliquid', originalError);
            }
            return new PerpDEXError(message, errorCode, 'hyperliquid', originalError);
    }
}
/**
 * Map error from unknown type (backward compatibility)
 */
export function mapError(error) {
    if (error instanceof PerpDEXError) {
        return error;
    }
    if (error instanceof Error) {
        const errorCode = extractErrorCode(error.message);
        return mapHyperliquidError(errorCode, error.message, error);
    }
    return new ExchangeUnavailableError('Unknown exchange error', 'UNKNOWN_ERROR', 'hyperliquid', error);
}
/**
 * Check if error is retryable
 */
export function isRetryableError(errorCode) {
    return (includesValue(Object.values(HYPERLIQUID_SERVER_ERRORS), errorCode) ||
        errorCode === HYPERLIQUID_RATE_LIMIT_ERROR);
}
//# sourceMappingURL=error-codes.js.map
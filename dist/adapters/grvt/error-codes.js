/**
 * GRVT Error Handling
 *
 * Provides error code constants and mapping functions for GRVT-specific errors.
 * GRVT uses official SDK which handles errors internally, but we provide
 * additional error mapping for completeness.
 */
import { includesValue } from '../../utils/type-guards.js';
import { PerpDEXError, InvalidOrderError, InsufficientMarginError, OrderNotFoundError, RateLimitError, ExchangeUnavailableError, } from '../../types/errors.js';
/**
 * GRVT Client Error Codes
 */
export const GRVT_CLIENT_ERRORS = {
    INVALID_ORDER: 'INVALID_ORDER',
    INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    INVALID_SIGNATURE: 'INVALID_SIGNATURE',
    INVALID_PARAMS: 'INVALID_PARAMS',
};
/**
 * GRVT Server Error Codes
 */
export const GRVT_SERVER_ERRORS = {
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    TIMEOUT: 'TIMEOUT',
};
/**
 * GRVT Rate Limit Error
 */
export const GRVT_RATE_LIMIT_ERROR = 'RATE_LIMIT_EXCEEDED';
/**
 * Map GRVT error to unified SDK error type
 */
export function mapGRVTError(errorCode, message, originalError) {
    switch (errorCode) {
        case GRVT_CLIENT_ERRORS.INSUFFICIENT_MARGIN:
            return new InsufficientMarginError(message, errorCode, 'grvt', originalError);
        case GRVT_CLIENT_ERRORS.INVALID_ORDER:
        case GRVT_CLIENT_ERRORS.INVALID_PARAMS:
            return new InvalidOrderError(message, errorCode, 'grvt', originalError);
        case GRVT_CLIENT_ERRORS.ORDER_NOT_FOUND:
            return new OrderNotFoundError(message, errorCode, 'grvt', originalError);
        case GRVT_RATE_LIMIT_ERROR:
            return new RateLimitError(message, errorCode, 'grvt', undefined, originalError);
        default:
            if (includesValue(Object.values(GRVT_SERVER_ERRORS), errorCode)) {
                return new ExchangeUnavailableError(message, errorCode, 'grvt', originalError);
            }
            return new PerpDEXError(message, errorCode, 'grvt', originalError);
    }
}
/**
 * Map error from unknown type
 */
export function mapError(error) {
    if (error instanceof PerpDEXError) {
        return error;
    }
    const message = error instanceof Error ? error.message : String(error);
    const originalError = error instanceof Error ? error : undefined;
    // GRVT SDK errors are already typed, so we mostly pass through
    return new PerpDEXError(message, 'SDK_ERROR', 'grvt', originalError);
}
/**
 * Check if error is retryable
 */
export function isRetryableError(errorCode) {
    return (includesValue(Object.values(GRVT_SERVER_ERRORS), errorCode) ||
        errorCode === GRVT_RATE_LIMIT_ERROR);
}
//# sourceMappingURL=error-codes.js.map
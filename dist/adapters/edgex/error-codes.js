/**
 * EdgeX Error Handling
 *
 * Provides error code constants and mapping functions for EdgeX-specific errors.
 * Translates EdgeX API error responses to unified SDK error types.
 *
 * @see https://docs.edgex.exchange/api/errors
 */
import { includesValue } from '../../utils/type-guards.js';
import { PerpDEXError, InvalidOrderError, InsufficientMarginError, OrderNotFoundError, InvalidSignatureError, RateLimitError, ExchangeUnavailableError, } from '../../types/errors.js';
/**
 * EdgeX Client Error Codes
 */
export const EDGEX_CLIENT_ERRORS = {
    INVALID_SIGNATURE: 'INVALID_SIGNATURE',
    INVALID_ORDER: 'INVALID_ORDER',
    INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    INVALID_PARAMS: 'INVALID_PARAMS',
    UNAUTHORIZED: 'UNAUTHORIZED',
};
/**
 * EdgeX Server Error Codes
 */
export const EDGEX_SERVER_ERRORS = {
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    TIMEOUT: 'TIMEOUT',
};
/**
 * EdgeX Rate Limit Error
 */
export const EDGEX_RATE_LIMIT_ERROR = 'RATE_LIMIT_EXCEEDED';
/**
 * Map EdgeX error to unified SDK error type
 */
export function mapEdgeXError(errorCode, message, originalError) {
    switch (errorCode) {
        case EDGEX_CLIENT_ERRORS.INSUFFICIENT_MARGIN:
            return new InsufficientMarginError(message, errorCode, 'edgex', originalError);
        case EDGEX_CLIENT_ERRORS.INVALID_SIGNATURE:
        case EDGEX_CLIENT_ERRORS.UNAUTHORIZED:
            return new InvalidSignatureError(message, errorCode, 'edgex', originalError);
        case EDGEX_CLIENT_ERRORS.INVALID_ORDER:
        case EDGEX_CLIENT_ERRORS.INVALID_PARAMS:
            return new InvalidOrderError(message, errorCode, 'edgex', originalError);
        case EDGEX_CLIENT_ERRORS.ORDER_NOT_FOUND:
            return new OrderNotFoundError(message, errorCode, 'edgex', originalError);
        case EDGEX_RATE_LIMIT_ERROR:
            return new RateLimitError(message, errorCode, 'edgex', undefined, originalError);
        default:
            if (includesValue(Object.values(EDGEX_SERVER_ERRORS), errorCode)) {
                return new ExchangeUnavailableError(message, errorCode, 'edgex', originalError);
            }
            return new PerpDEXError(message, errorCode, 'edgex', originalError);
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
    // Extract error code from message if possible
    const messageLower = message.toLowerCase();
    let errorCode = 'UNKNOWN_ERROR';
    if (messageLower.includes('signature')) {
        errorCode = EDGEX_CLIENT_ERRORS.INVALID_SIGNATURE;
    }
    else if (messageLower.includes('margin') || messageLower.includes('insufficient')) {
        errorCode = EDGEX_CLIENT_ERRORS.INSUFFICIENT_MARGIN;
    }
    else if (messageLower.includes('not found')) {
        errorCode = EDGEX_CLIENT_ERRORS.ORDER_NOT_FOUND;
    }
    else if (messageLower.includes('rate limit')) {
        errorCode = EDGEX_RATE_LIMIT_ERROR;
    }
    return mapEdgeXError(errorCode, message, originalError);
}
/**
 * Check if error is retryable
 */
export function isRetryableError(errorCode) {
    return (includesValue(Object.values(EDGEX_SERVER_ERRORS), errorCode) ||
        errorCode === EDGEX_RATE_LIMIT_ERROR);
}
//# sourceMappingURL=error-codes.js.map
/**
 * Ethereal Error Handling
 *
 * Provides error code constants and mapping functions for Ethereal-specific errors.
 */
import { includesValue } from '../../utils/type-guards.js';
import { PerpDEXError, InvalidOrderError, InsufficientMarginError, OrderNotFoundError, InvalidSignatureError, RateLimitError, ExchangeUnavailableError, BadRequestError, } from '../../types/errors.js';
/**
 * Ethereal Client Error Codes
 */
export const ETHEREAL_CLIENT_ERRORS = {
    SYMBOL_NOT_FOUND: 'SYMBOL_NOT_FOUND',
    INVALID_ORDER: 'INVALID_ORDER',
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    INVALID_SIGNATURE: 'INVALID_SIGNATURE',
    INVALID_NONCE: 'INVALID_NONCE',
    INPUT_VALIDATION_ERROR: 'INPUT_VALIDATION_ERROR',
    ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
};
/**
 * Ethereal Server Error Codes
 */
export const ETHEREAL_SERVER_ERRORS = {
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};
/**
 * Ethereal Rate Limit Error
 */
export const ETHEREAL_RATE_LIMIT_ERROR = 'RATE_LIMIT_EXCEEDED';
/**
 * Ethereal Error Message Patterns
 */
export const ETHEREAL_ERROR_MESSAGES = {
    'insufficient margin': 'INSUFFICIENT_MARGIN',
    'symbol not found': ETHEREAL_CLIENT_ERRORS.SYMBOL_NOT_FOUND,
    'invalid signature': ETHEREAL_CLIENT_ERRORS.INVALID_SIGNATURE,
    unauthorized: ETHEREAL_CLIENT_ERRORS.INVALID_SIGNATURE,
    'rate limit': ETHEREAL_RATE_LIMIT_ERROR,
    'too many requests': ETHEREAL_RATE_LIMIT_ERROR,
    'invalid nonce': ETHEREAL_CLIENT_ERRORS.INVALID_NONCE,
    'order not found': ETHEREAL_CLIENT_ERRORS.ORDER_NOT_FOUND,
    'invalid order': ETHEREAL_CLIENT_ERRORS.INVALID_ORDER,
    'service unavailable': ETHEREAL_SERVER_ERRORS.SERVICE_UNAVAILABLE,
};
/**
 * Extract error code from error message
 */
export function extractErrorCode(errorMessage) {
    const messageLower = errorMessage.toLowerCase();
    for (const [pattern, code] of Object.entries(ETHEREAL_ERROR_MESSAGES)) {
        if (messageLower.includes(pattern)) {
            return code;
        }
    }
    if (messageLower.includes('429')) {
        return ETHEREAL_RATE_LIMIT_ERROR;
    }
    if (messageLower.includes('500') || messageLower.includes('503')) {
        return ETHEREAL_SERVER_ERRORS.INTERNAL_SERVER_ERROR;
    }
    return 'UNKNOWN_ERROR';
}
/**
 * Map Ethereal error to unified SDK error type
 */
export function mapEtherealError(errorCode, message, originalError) {
    switch (errorCode) {
        case 'INSUFFICIENT_MARGIN':
            return new InsufficientMarginError(message, errorCode, 'ethereal', originalError);
        case ETHEREAL_CLIENT_ERRORS.INVALID_SIGNATURE:
            return new InvalidSignatureError(message, errorCode, 'ethereal', originalError);
        case ETHEREAL_CLIENT_ERRORS.INPUT_VALIDATION_ERROR:
        case ETHEREAL_CLIENT_ERRORS.SYMBOL_NOT_FOUND:
        case ETHEREAL_CLIENT_ERRORS.ACCOUNT_NOT_FOUND:
            return new BadRequestError(message, errorCode, 'ethereal', originalError);
        case ETHEREAL_CLIENT_ERRORS.INVALID_ORDER:
        case ETHEREAL_CLIENT_ERRORS.INVALID_NONCE:
            return new InvalidOrderError(message, errorCode, 'ethereal', originalError);
        case ETHEREAL_CLIENT_ERRORS.ORDER_NOT_FOUND:
            return new OrderNotFoundError(message, errorCode, 'ethereal', originalError);
        case ETHEREAL_RATE_LIMIT_ERROR:
            return new RateLimitError(message, errorCode, 'ethereal', undefined, originalError);
        default:
            if (includesValue(Object.values(ETHEREAL_SERVER_ERRORS), errorCode)) {
                return new ExchangeUnavailableError(message, errorCode, 'ethereal', originalError);
            }
            return new PerpDEXError(message, errorCode, 'ethereal', originalError);
    }
}
/**
 * Map error from unknown type
 */
export function mapError(error) {
    if (error instanceof PerpDEXError) {
        return error;
    }
    if (error instanceof Error) {
        const errorCode = extractErrorCode(error.message);
        return mapEtherealError(errorCode, error.message, error);
    }
    return new ExchangeUnavailableError('Unknown exchange error', 'UNKNOWN_ERROR', 'ethereal', error);
}
/**
 * Check if error is retryable
 */
export function isRetryableError(errorCode) {
    return (includesValue(Object.values(ETHEREAL_SERVER_ERRORS), errorCode) ||
        errorCode === ETHEREAL_RATE_LIMIT_ERROR);
}
//# sourceMappingURL=error-codes.js.map
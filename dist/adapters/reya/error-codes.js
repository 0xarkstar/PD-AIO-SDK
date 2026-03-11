/**
 * Reya Error Handling
 *
 * Provides error code constants and mapping functions for Reya-specific errors.
 */
import { includesValue } from '../../utils/type-guards.js';
import { PerpDEXError, InvalidOrderError, InsufficientMarginError, OrderNotFoundError, InvalidSignatureError, RateLimitError, ExchangeUnavailableError, BadRequestError, } from '../../types/errors.js';
/**
 * Reya Client Error Codes
 */
export const REYA_CLIENT_ERRORS = {
    SYMBOL_NOT_FOUND: 'SYMBOL_NOT_FOUND',
    NO_ACCOUNTS_FOUND: 'NO_ACCOUNTS_FOUND',
    NO_PRICES_FOUND: 'NO_PRICES_FOUND_FOR_SYMBOL',
    INPUT_VALIDATION_ERROR: 'INPUT_VALIDATION_ERROR',
    CREATE_ORDER_ERROR: 'CREATE_ORDER_OTHER_ERROR',
    CANCEL_ORDER_ERROR: 'CANCEL_ORDER_OTHER_ERROR',
    ORDER_DEADLINE_PASSED: 'ORDER_DEADLINE_PASSED_ERROR',
    ORDER_DEADLINE_TOO_HIGH: 'ORDER_DEADLINE_TOO_HIGH_ERROR',
    INVALID_NONCE: 'INVALID_NONCE_ERROR',
    UNAUTHORIZED_SIGNATURE: 'UNAUTHORIZED_SIGNATURE_ERROR',
    NUMERIC_OVERFLOW: 'NUMERIC_OVERFLOW_ERROR',
};
/**
 * Reya Server Error Codes
 */
export const REYA_SERVER_ERRORS = {
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    UNAVAILABLE_MATCHING_ENGINE: 'UNAVAILABLE_MATCHING_ENGINE_ERROR',
};
/**
 * Reya Rate Limit Error
 */
export const REYA_RATE_LIMIT_ERROR = 'RATE_LIMIT_EXCEEDED';
/**
 * Reya Error Message Patterns
 */
export const REYA_ERROR_MESSAGES = {
    'insufficient margin': 'INSUFFICIENT_MARGIN',
    'symbol not found': REYA_CLIENT_ERRORS.SYMBOL_NOT_FOUND,
    'invalid signature': REYA_CLIENT_ERRORS.UNAUTHORIZED_SIGNATURE,
    unauthorized: REYA_CLIENT_ERRORS.UNAUTHORIZED_SIGNATURE,
    'rate limit': REYA_RATE_LIMIT_ERROR,
    'too many requests': REYA_RATE_LIMIT_ERROR,
    'invalid nonce': REYA_CLIENT_ERRORS.INVALID_NONCE,
    'deadline passed': REYA_CLIENT_ERRORS.ORDER_DEADLINE_PASSED,
    'matching engine unavailable': REYA_SERVER_ERRORS.UNAVAILABLE_MATCHING_ENGINE,
};
/**
 * Extract error code from error message
 */
export function extractErrorCode(errorMessage) {
    const messageLower = errorMessage.toLowerCase();
    for (const [pattern, code] of Object.entries(REYA_ERROR_MESSAGES)) {
        if (messageLower.includes(pattern)) {
            return code;
        }
    }
    if (messageLower.includes('429')) {
        return REYA_RATE_LIMIT_ERROR;
    }
    if (messageLower.includes('500') || messageLower.includes('503')) {
        return REYA_SERVER_ERRORS.INTERNAL_SERVER_ERROR;
    }
    return 'UNKNOWN_ERROR';
}
/**
 * Map Reya error to unified SDK error type
 */
export function mapReyaError(errorCode, message, originalError) {
    switch (errorCode) {
        case 'INSUFFICIENT_MARGIN':
            return new InsufficientMarginError(message, errorCode, 'reya', originalError);
        case REYA_CLIENT_ERRORS.UNAUTHORIZED_SIGNATURE:
            return new InvalidSignatureError(message, errorCode, 'reya', originalError);
        case REYA_CLIENT_ERRORS.INPUT_VALIDATION_ERROR:
        case REYA_CLIENT_ERRORS.NUMERIC_OVERFLOW:
        case REYA_CLIENT_ERRORS.SYMBOL_NOT_FOUND:
            return new BadRequestError(message, errorCode, 'reya', originalError);
        case REYA_CLIENT_ERRORS.CREATE_ORDER_ERROR:
        case REYA_CLIENT_ERRORS.ORDER_DEADLINE_PASSED:
        case REYA_CLIENT_ERRORS.ORDER_DEADLINE_TOO_HIGH:
        case REYA_CLIENT_ERRORS.INVALID_NONCE:
            return new InvalidOrderError(message, errorCode, 'reya', originalError);
        case REYA_CLIENT_ERRORS.CANCEL_ORDER_ERROR:
            return new OrderNotFoundError(message, errorCode, 'reya', originalError);
        case REYA_RATE_LIMIT_ERROR:
            return new RateLimitError(message, errorCode, 'reya', undefined, originalError);
        default:
            if (includesValue(Object.values(REYA_SERVER_ERRORS), errorCode)) {
                return new ExchangeUnavailableError(message, errorCode, 'reya', originalError);
            }
            return new PerpDEXError(message, errorCode, 'reya', originalError);
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
        return mapReyaError(errorCode, error.message, error);
    }
    return new ExchangeUnavailableError('Unknown exchange error', 'UNKNOWN_ERROR', 'reya', error);
}
/**
 * Check if error is retryable
 */
export function isRetryableError(errorCode) {
    return (includesValue(Object.values(REYA_SERVER_ERRORS), errorCode) ||
        errorCode === REYA_RATE_LIMIT_ERROR);
}
//# sourceMappingURL=error-codes.js.map
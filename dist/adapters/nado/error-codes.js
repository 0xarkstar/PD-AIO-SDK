/**
 * Nado Error Handling
 *
 * Provides error code constants and mapping functions for Nado-specific errors.
 * Translates Nado API error responses to unified SDK error types.
 *
 * @see https://docs.nado.xyz/developer-resources/api/errors
 */
import { PerpDEXError, InvalidOrderError, InsufficientMarginError, OrderNotFoundError, InvalidSignatureError, RateLimitError, ExchangeUnavailableError, } from '../../types/errors.js';
/**
 * Nado Client Error Codes (4xx)
 * These errors indicate client-side issues and should NOT be retried.
 */
export const NADO_CLIENT_ERRORS = {
    // Authentication & Signature
    INVALID_SIGNATURE: 'invalid_signature',
    INVALID_NONCE: 'invalid_nonce',
    EXPIRED_SIGNATURE: 'expired_signature',
    // Order Errors
    INVALID_ORDER: 'invalid_order',
    INSUFFICIENT_MARGIN: 'insufficient_margin',
    ORDER_NOT_FOUND: 'order_not_found',
    ORDER_EXPIRED: 'order_expired',
    INVALID_PRICE: 'invalid_price',
    INVALID_AMOUNT: 'invalid_amount',
    MIN_SIZE_NOT_MET: 'min_size_not_met',
    MAX_SIZE_EXCEEDED: 'max_size_exceeded',
    // Product/Market Errors
    INVALID_PRODUCT: 'invalid_product',
    PRODUCT_NOT_ACTIVE: 'product_not_active',
    MARKET_CLOSED: 'market_closed',
    // Subaccount Errors
    SUBACCOUNT_NOT_FOUND: 'subaccount_not_found',
    INVALID_SUBACCOUNT: 'invalid_subaccount',
    // Validation Errors
    INVALID_PARAMS: 'invalid_params',
    MISSING_REQUIRED_FIELD: 'missing_required_field',
};
/**
 * Nado Server Error Codes (5xx)
 * These errors indicate server-side issues and MAY be retried with backoff.
 */
export const NADO_SERVER_ERRORS = {
    INTERNAL_ERROR: 'internal_error',
    SERVICE_UNAVAILABLE: 'service_unavailable',
    TIMEOUT: 'timeout',
    DATABASE_ERROR: 'database_error',
    SEQUENCER_ERROR: 'sequencer_error',
};
/**
 * Nado Rate Limit Error
 * Should be retried with exponential backoff.
 */
export const NADO_RATE_LIMIT_ERROR = 'rate_limit_exceeded';
/**
 * Nado Network Errors
 * Connection and network-related errors that may be transient.
 */
export const NADO_NETWORK_ERRORS = {
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
    return Object.values(NADO_CLIENT_ERRORS).includes(errorCode);
}
/**
 * Check if an error code indicates a server error (retryable)
 *
 * @param errorCode - Error code to check
 * @returns true if server error
 */
export function isServerError(errorCode) {
    return Object.values(NADO_SERVER_ERRORS).includes(errorCode);
}
/**
 * Check if an error code indicates a network error (retryable)
 *
 * @param errorCode - Error code to check
 * @returns true if network error
 */
export function isNetworkError(errorCode) {
    return Object.values(NADO_NETWORK_ERRORS).includes(errorCode);
}
/**
 * Check if an error should be retried
 *
 * @param errorCode - Error code to check
 * @returns true if retryable
 */
export function isRetryableError(errorCode) {
    return (isServerError(errorCode) ||
        isNetworkError(errorCode) ||
        errorCode === NADO_RATE_LIMIT_ERROR);
}
/**
 * Map Nado error code and message to unified SDK error type
 *
 * @param errorCode - Nado error code (string or number)
 * @param message - Error message
 * @param originalError - Original error object (optional)
 * @returns Mapped PerpDEXError subclass
 *
 * @example
 * ```typescript
 * const nadoResponse = {
 *   status: 'failure',
 *   error: 'Insufficient margin to place order',
 *   error_code: 'insufficient_margin',
 * };
 *
 * const error = mapNadoError(
 *   nadoResponse.error_code,
 *   nadoResponse.error
 * );
 *
 * if (error instanceof InsufficientMarginError) {
 *   console.log('Need more collateral');
 * }
 * ```
 */
export function mapNadoError(errorCode, message, originalError) {
    const code = errorCode.toString();
    // Authentication & Signature Errors
    if (code === NADO_CLIENT_ERRORS.INVALID_SIGNATURE ||
        code === NADO_CLIENT_ERRORS.EXPIRED_SIGNATURE) {
        return new InvalidSignatureError(message, code, 'nado', originalError);
    }
    // Insufficient Margin
    if (code === NADO_CLIENT_ERRORS.INSUFFICIENT_MARGIN) {
        return new InsufficientMarginError(message, code, 'nado', originalError);
    }
    // Order Not Found
    if (code === NADO_CLIENT_ERRORS.ORDER_NOT_FOUND) {
        return new OrderNotFoundError(message, code, 'nado', originalError);
    }
    // Invalid Order (general)
    if (code === NADO_CLIENT_ERRORS.INVALID_ORDER ||
        code === NADO_CLIENT_ERRORS.ORDER_EXPIRED ||
        code === NADO_CLIENT_ERRORS.INVALID_PRICE ||
        code === NADO_CLIENT_ERRORS.INVALID_AMOUNT ||
        code === NADO_CLIENT_ERRORS.MIN_SIZE_NOT_MET ||
        code === NADO_CLIENT_ERRORS.MAX_SIZE_EXCEEDED ||
        code === NADO_CLIENT_ERRORS.INVALID_NONCE) {
        return new InvalidOrderError(message, code, 'nado', originalError);
    }
    // Rate Limit
    if (code === NADO_RATE_LIMIT_ERROR) {
        return new RateLimitError(message, code, 'nado', undefined, originalError);
    }
    // Server/Network Errors (service unavailable)
    if (isServerError(code) || isNetworkError(code)) {
        return new ExchangeUnavailableError(message, code, 'nado', originalError);
    }
    // Default: Generic PerpDEXError
    return new PerpDEXError(message, code, 'nado', originalError);
}
/**
 * Extract error information from Nado API response
 *
 * @param response - Nado API response object
 * @returns Error code and message
 */
export function extractNadoError(response) {
    const code = response.error_code?.toString() || 'UNKNOWN_ERROR';
    const message = response.error || response.message || 'Unknown error occurred';
    return { code, message };
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
        return new RateLimitError(`Rate limit exceeded: ${statusText}`, NADO_RATE_LIMIT_ERROR, 'nado', undefined // retryAfter parameter
        );
    }
    // 4xx Client Errors
    if (status >= 400 && status < 500) {
        return new InvalidOrderError(`Client error (${status}): ${statusText}`, `HTTP_${status}`, 'nado');
    }
    // 5xx Server Errors
    if (status >= 500) {
        return new ExchangeUnavailableError(`Server error (${status}): ${statusText}`, `HTTP_${status}`, 'nado');
    }
    // Other
    return new PerpDEXError(`HTTP error (${status}): ${statusText}`, `HTTP_${status}`, 'nado');
}
//# sourceMappingURL=error-codes.js.map
/**
 * GRVT Error Handling
 *
 * Provides error code constants and mapping functions for GRVT-specific errors.
 * Translates GRVT API error responses to unified SDK error types.
 *
 * @see https://docs.grvt.io/developer-resources/api/errors
 */
import { PerpDEXError, InvalidOrderError, InsufficientMarginError, OrderNotFoundError, InvalidSignatureError, RateLimitError, ExchangeUnavailableError, ExpiredAuthError, InsufficientPermissionsError, } from '../../types/errors.js';
/**
 * GRVT Client Error Codes (4xx)
 * These errors indicate client-side issues and should NOT be retried.
 */
export const GRVT_CLIENT_ERRORS = {
    // Authentication & Signature
    INVALID_SIGNATURE: 'INVALID_SIGNATURE',
    EXPIRED_SESSION: 'EXPIRED_SESSION',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INVALID_API_KEY: 'INVALID_API_KEY',
    // Order Errors
    INVALID_ORDER: 'INVALID_ORDER',
    INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    ORDER_ALREADY_FILLED: 'ORDER_ALREADY_FILLED',
    ORDER_ALREADY_CANCELLED: 'ORDER_ALREADY_CANCELLED',
    INVALID_PRICE: 'INVALID_PRICE',
    INVALID_SIZE: 'INVALID_SIZE',
    MIN_SIZE_NOT_MET: 'MIN_SIZE_NOT_MET',
    MAX_SIZE_EXCEEDED: 'MAX_SIZE_EXCEEDED',
    PRICE_OUT_OF_RANGE: 'PRICE_OUT_OF_RANGE',
    SELF_TRADE: 'SELF_TRADE',
    // Market/Instrument Errors
    INVALID_INSTRUMENT: 'INVALID_INSTRUMENT',
    INSTRUMENT_NOT_ACTIVE: 'INSTRUMENT_NOT_ACTIVE',
    MARKET_CLOSED: 'MARKET_CLOSED',
    TRADING_HALTED: 'TRADING_HALTED',
    // Position Errors
    POSITION_NOT_FOUND: 'POSITION_NOT_FOUND',
    MAX_POSITION_EXCEEDED: 'MAX_POSITION_EXCEEDED',
    REDUCE_ONLY_VIOLATION: 'REDUCE_ONLY_VIOLATION',
    // Leverage Errors
    INVALID_LEVERAGE: 'INVALID_LEVERAGE',
    MAX_LEVERAGE_EXCEEDED: 'MAX_LEVERAGE_EXCEEDED',
    // Validation Errors
    INVALID_REQUEST: 'INVALID_REQUEST',
    INVALID_PARAMS: 'INVALID_PARAMS',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    INVALID_TIME_IN_FORCE: 'INVALID_TIME_IN_FORCE',
};
/**
 * GRVT Server Error Codes (5xx)
 * These errors indicate server-side issues and MAY be retried with backoff.
 */
export const GRVT_SERVER_ERRORS = {
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
    DATABASE_ERROR: 'DATABASE_ERROR',
    MATCHING_ENGINE_ERROR: 'MATCHING_ENGINE_ERROR',
    SEQUENCER_ERROR: 'SEQUENCER_ERROR',
};
/**
 * GRVT Rate Limit Error
 * Should be retried with exponential backoff.
 */
export const GRVT_RATE_LIMIT_ERROR = 'RATE_LIMIT_EXCEEDED';
/**
 * GRVT Network Errors
 * Connection and network-related errors that may be transient.
 */
export const GRVT_NETWORK_ERRORS = {
    ECONNRESET: 'ECONNRESET',
    ETIMEDOUT: 'ETIMEDOUT',
    ENOTFOUND: 'ENOTFOUND',
    ECONNREFUSED: 'ECONNREFUSED',
    NETWORK_ERROR: 'NETWORK_ERROR',
    WEBSOCKET_CLOSED: 'WEBSOCKET_CLOSED',
    WEBSOCKET_ERROR: 'WEBSOCKET_ERROR',
};
/**
 * Check if an error code indicates a client error (non-retryable)
 *
 * @param errorCode - Error code to check
 * @returns true if client error
 */
export function isClientError(errorCode) {
    return Object.values(GRVT_CLIENT_ERRORS).includes(errorCode);
}
/**
 * Check if an error code indicates a server error (retryable)
 *
 * @param errorCode - Error code to check
 * @returns true if server error
 */
export function isServerError(errorCode) {
    return Object.values(GRVT_SERVER_ERRORS).includes(errorCode);
}
/**
 * Check if an error code indicates a network error (retryable)
 *
 * @param errorCode - Error code to check
 * @returns true if network error
 */
export function isNetworkError(errorCode) {
    return Object.values(GRVT_NETWORK_ERRORS).includes(errorCode);
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
        errorCode === GRVT_RATE_LIMIT_ERROR);
}
/**
 * Map GRVT error code and message to unified SDK error type
 *
 * @param errorCode - GRVT error code (string or number)
 * @param message - Error message
 * @param originalError - Original error object (optional)
 * @returns Mapped PerpDEXError subclass
 *
 * @example
 * ```typescript
 * const grvtResponse = {
 *   error: {
 *     code: 'INSUFFICIENT_MARGIN',
 *     message: 'Insufficient margin to place order',
 *   },
 * };
 *
 * const error = mapGRVTError(
 *   grvtResponse.error.code,
 *   grvtResponse.error.message
 * );
 *
 * if (error instanceof InsufficientMarginError) {
 *   console.log('Need more collateral');
 * }
 * ```
 */
export function mapGRVTError(errorCode, message, originalError) {
    const code = errorCode.toString();
    // Authentication & Signature Errors
    if (code === GRVT_CLIENT_ERRORS.INVALID_SIGNATURE ||
        code === GRVT_CLIENT_ERRORS.INVALID_API_KEY) {
        return new InvalidSignatureError(message, code, 'grvt', originalError);
    }
    // Expired Session/Auth
    if (code === GRVT_CLIENT_ERRORS.EXPIRED_SESSION) {
        return new ExpiredAuthError(message, code, 'grvt', originalError);
    }
    // Permission Errors
    if (code === GRVT_CLIENT_ERRORS.UNAUTHORIZED ||
        code === GRVT_CLIENT_ERRORS.FORBIDDEN) {
        return new InsufficientPermissionsError(message, code, 'grvt', originalError);
    }
    // Insufficient Margin/Balance
    if (code === GRVT_CLIENT_ERRORS.INSUFFICIENT_MARGIN ||
        code === GRVT_CLIENT_ERRORS.INSUFFICIENT_BALANCE) {
        return new InsufficientMarginError(message, code, 'grvt', originalError);
    }
    // Order Not Found
    if (code === GRVT_CLIENT_ERRORS.ORDER_NOT_FOUND) {
        return new OrderNotFoundError(message, code, 'grvt', originalError);
    }
    // Invalid Order (general)
    if (code === GRVT_CLIENT_ERRORS.INVALID_ORDER ||
        code === GRVT_CLIENT_ERRORS.ORDER_ALREADY_FILLED ||
        code === GRVT_CLIENT_ERRORS.ORDER_ALREADY_CANCELLED ||
        code === GRVT_CLIENT_ERRORS.INVALID_PRICE ||
        code === GRVT_CLIENT_ERRORS.INVALID_SIZE ||
        code === GRVT_CLIENT_ERRORS.MIN_SIZE_NOT_MET ||
        code === GRVT_CLIENT_ERRORS.MAX_SIZE_EXCEEDED ||
        code === GRVT_CLIENT_ERRORS.PRICE_OUT_OF_RANGE ||
        code === GRVT_CLIENT_ERRORS.SELF_TRADE ||
        code === GRVT_CLIENT_ERRORS.INVALID_INSTRUMENT ||
        code === GRVT_CLIENT_ERRORS.INSTRUMENT_NOT_ACTIVE ||
        code === GRVT_CLIENT_ERRORS.MARKET_CLOSED ||
        code === GRVT_CLIENT_ERRORS.TRADING_HALTED ||
        code === GRVT_CLIENT_ERRORS.MAX_POSITION_EXCEEDED ||
        code === GRVT_CLIENT_ERRORS.REDUCE_ONLY_VIOLATION ||
        code === GRVT_CLIENT_ERRORS.INVALID_LEVERAGE ||
        code === GRVT_CLIENT_ERRORS.MAX_LEVERAGE_EXCEEDED ||
        code === GRVT_CLIENT_ERRORS.INVALID_TIME_IN_FORCE) {
        return new InvalidOrderError(message, code, 'grvt', originalError);
    }
    // Rate Limit
    if (code === GRVT_RATE_LIMIT_ERROR) {
        // Try to extract retry-after from original error
        const retryAfter = extractRetryAfter(originalError);
        return new RateLimitError(message, code, 'grvt', retryAfter, originalError);
    }
    // Server/Network Errors (service unavailable)
    if (isServerError(code) || isNetworkError(code)) {
        return new ExchangeUnavailableError(message, code, 'grvt', originalError);
    }
    // Default: Generic PerpDEXError
    return new PerpDEXError(message, code, 'grvt', originalError);
}
/**
 * Extract error information from GRVT API response
 *
 * @param response - GRVT API response object
 * @returns Error code and message
 */
export function extractGRVTError(response) {
    // Handle null/undefined
    if (!response) {
        return { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' };
    }
    // GRVT uses { error: { code, message } } format
    const errorObj = response.error || response;
    // Handle case where error is a string
    if (typeof errorObj === 'string') {
        return { code: 'UNKNOWN_ERROR', message: errorObj };
    }
    const code = errorObj.code?.toString() || 'UNKNOWN_ERROR';
    const message = errorObj.message || errorObj.error || 'Unknown error occurred';
    return { code, message };
}
/**
 * Map HTTP status code to error
 *
 * @param status - HTTP status code
 * @param statusText - HTTP status text
 * @param responseData - Optional response data
 * @returns Mapped error
 */
export function mapHttpError(status, statusText, responseData) {
    // Try to extract GRVT error from response
    if (responseData && responseData.error) {
        const { code, message } = extractGRVTError(responseData);
        return mapGRVTError(code, message, responseData);
    }
    // 401 Unauthorized
    if (status === 401) {
        return new InvalidSignatureError(`Unauthorized: ${statusText}`, 'UNAUTHORIZED', 'grvt');
    }
    // 403 Forbidden
    if (status === 403) {
        return new InsufficientPermissionsError(`Forbidden: ${statusText}`, 'FORBIDDEN', 'grvt');
    }
    // 404 Not Found
    if (status === 404) {
        return new OrderNotFoundError(`Not found: ${statusText}`, 'NOT_FOUND', 'grvt');
    }
    // 429 Rate Limit
    if (status === 429) {
        const retryAfter = extractRetryAfter(responseData);
        return new RateLimitError(`Rate limit exceeded: ${statusText}`, GRVT_RATE_LIMIT_ERROR, 'grvt', retryAfter);
    }
    // 4xx Client Errors
    if (status >= 400 && status < 500) {
        return new InvalidOrderError(`Client error (${status}): ${statusText}`, `HTTP_${status}`, 'grvt');
    }
    // 503 Service Unavailable
    if (status === 503) {
        return new ExchangeUnavailableError(`Service unavailable: ${statusText}`, 'SERVICE_UNAVAILABLE', 'grvt');
    }
    // 5xx Server Errors
    if (status >= 500) {
        return new ExchangeUnavailableError(`Server error (${status}): ${statusText}`, `HTTP_${status}`, 'grvt');
    }
    // Other
    return new PerpDEXError(`HTTP error (${status}): ${statusText}`, `HTTP_${status}`, 'grvt');
}
/**
 * Map axios error to PerpDEXError
 *
 * @param error - Axios error object
 * @returns Mapped error
 */
export function mapAxiosError(error) {
    // HTTP errors with response (check FIRST - takes precedence)
    if (error.response) {
        const { status, statusText, data } = error.response;
        return mapHttpError(status, statusText, data);
    }
    // Network errors
    if (error.code && isNetworkError(error.code)) {
        return new ExchangeUnavailableError(error.message || 'Network error occurred', error.code, 'grvt', error);
    }
    // Request timeout
    if (error.code === 'ECONNABORTED') {
        return new ExchangeUnavailableError('Request timeout', 'ETIMEDOUT', 'grvt', error);
    }
    // Generic error
    return new PerpDEXError(error.message || 'Unknown error occurred', error.code || 'UNKNOWN_ERROR', 'grvt', error);
}
/**
 * Extract retry-after value from error response
 *
 * @param error - Error object or response data
 * @returns Retry-after value in seconds, or undefined
 */
function extractRetryAfter(error) {
    if (!error)
        return undefined;
    // Check headers
    if (error.headers && error.headers['retry-after']) {
        const value = parseInt(error.headers['retry-after'], 10);
        return isNaN(value) ? undefined : value;
    }
    // Check response data
    if (error.response && error.response.headers && error.response.headers['retry-after']) {
        const value = parseInt(error.response.headers['retry-after'], 10);
        return isNaN(value) ? undefined : value;
    }
    // Check data.retryAfter
    if (error.retryAfter) {
        const value = parseInt(error.retryAfter, 10);
        return isNaN(value) ? undefined : value;
    }
    return undefined;
}
//# sourceMappingURL=GRVTErrorMapper.js.map
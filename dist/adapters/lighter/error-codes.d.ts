/**
 * Lighter Error Handling
 *
 * Provides error code constants and mapping functions for Lighter-specific errors.
 * Translates Lighter API error responses to unified SDK error types.
 *
 * @see https://docs.lighter.xyz/api/errors
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * Lighter Client Error Codes
 * These errors indicate client-side issues and should NOT be retried.
 */
export declare const LIGHTER_CLIENT_ERRORS: {
    readonly INVALID_SIGNATURE: "invalid_signature";
    readonly UNAUTHORIZED: "unauthorized";
    readonly INVALID_API_KEY: "invalid_api_key";
    readonly MISSING_API_KEY: "missing_api_key";
    readonly INVALID_ORDER: "invalid_order";
    readonly INSUFFICIENT_MARGIN: "insufficient_margin";
    readonly INSUFFICIENT_BALANCE: "insufficient_balance";
    readonly ORDER_NOT_FOUND: "order_not_found";
    readonly INVALID_PRICE: "invalid_price";
    readonly INVALID_AMOUNT: "invalid_amount";
    readonly INVALID_ORDER_SIZE: "invalid_order_size";
    readonly MIN_SIZE_NOT_MET: "min_size_not_met";
    readonly MAX_SIZE_EXCEEDED: "max_size_exceeded";
    readonly INVALID_SYMBOL: "invalid_symbol";
    readonly MARKET_CLOSED: "market_closed";
    readonly MARKET_NOT_FOUND: "market_not_found";
    readonly TRADING_SUSPENDED: "trading_suspended";
    readonly INVALID_PARAMS: "invalid_params";
    readonly MISSING_REQUIRED_FIELD: "missing_required_field";
    readonly INVALID_NONCE: "invalid_nonce";
    readonly NONCE_TOO_LOW: "nonce_too_low";
    readonly NONCE_TOO_HIGH: "nonce_too_high";
    readonly TRANSACTION_FAILED: "transaction_failed";
    readonly SIGNING_FAILED: "signing_failed";
};
/**
 * Lighter Server Error Codes
 * These errors indicate server-side issues and MAY be retried with backoff.
 */
export declare const LIGHTER_SERVER_ERRORS: {
    readonly INTERNAL_ERROR: "internal_error";
    readonly SERVICE_UNAVAILABLE: "service_unavailable";
    readonly EXCHANGE_UNAVAILABLE: "exchange_unavailable";
    readonly TIMEOUT: "timeout";
    readonly MAINTENANCE: "maintenance";
    readonly OFFLINE: "offline";
    readonly DATABASE_ERROR: "database_error";
};
/**
 * Lighter Rate Limit Error
 * Should be retried with exponential backoff.
 */
export declare const LIGHTER_RATE_LIMIT_ERROR = "rate_limit_exceeded";
/**
 * Lighter Network Errors
 * Connection and network-related errors that may be transient.
 */
export declare const LIGHTER_NETWORK_ERRORS: {
    readonly ECONNRESET: "ECONNRESET";
    readonly ETIMEDOUT: "ETIMEDOUT";
    readonly ENOTFOUND: "ENOTFOUND";
    readonly ECONNREFUSED: "ECONNREFUSED";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
};
/**
 * Check if an error code indicates a client error (non-retryable)
 *
 * @param errorCode - Error code to check
 * @returns true if client error
 */
export declare function isClientError(errorCode: string): boolean;
/**
 * Check if an error code indicates a server error (retryable)
 *
 * @param errorCode - Error code to check
 * @returns true if server error
 */
export declare function isServerError(errorCode: string): boolean;
/**
 * Check if an error code indicates a network error (retryable)
 *
 * @param errorCode - Error code to check
 * @returns true if network error
 */
export declare function isNetworkError(errorCode: string): boolean;
/**
 * Check if an error should be retried
 *
 * @param errorCode - Error code to check
 * @returns true if retryable
 */
export declare function isRetryableError(errorCode: string): boolean;
/**
 * Map Lighter error message to error code
 * Lighter uses message-based error detection
 *
 * @param errorMessage - Error message from Lighter API
 * @returns Error code
 */
export declare function extractErrorCode(errorMessage: string): string;
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
export declare function mapLighterError(errorCode: string, message: string, originalError?: any): PerpDEXError;
/**
 * Map error from unknown type (backward compatibility with utils.ts)
 *
 * @param error - Error object
 * @returns Mapped PerpDEXError
 */
export declare function mapError(error: unknown): PerpDEXError;
/**
 * Map HTTP status code to error
 *
 * @param status - HTTP status code
 * @param statusText - HTTP status text
 * @returns Mapped error
 */
export declare function mapHttpError(status: number, statusText: string): PerpDEXError;
//# sourceMappingURL=error-codes.d.ts.map
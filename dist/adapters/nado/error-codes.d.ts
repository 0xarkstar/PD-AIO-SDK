/**
 * Nado Error Handling
 *
 * Provides error code constants and mapping functions for Nado-specific errors.
 * Translates Nado API error responses to unified SDK error types.
 *
 * @see https://docs.nado.xyz/developer-resources/api/errors
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * Nado Client Error Codes (4xx)
 * These errors indicate client-side issues and should NOT be retried.
 */
export declare const NADO_CLIENT_ERRORS: {
    readonly INVALID_SIGNATURE: "invalid_signature";
    readonly INVALID_NONCE: "invalid_nonce";
    readonly EXPIRED_SIGNATURE: "expired_signature";
    readonly INVALID_ORDER: "invalid_order";
    readonly INSUFFICIENT_MARGIN: "insufficient_margin";
    readonly ORDER_NOT_FOUND: "order_not_found";
    readonly ORDER_EXPIRED: "order_expired";
    readonly INVALID_PRICE: "invalid_price";
    readonly INVALID_AMOUNT: "invalid_amount";
    readonly MIN_SIZE_NOT_MET: "min_size_not_met";
    readonly MAX_SIZE_EXCEEDED: "max_size_exceeded";
    readonly INVALID_PRODUCT: "invalid_product";
    readonly PRODUCT_NOT_ACTIVE: "product_not_active";
    readonly MARKET_CLOSED: "market_closed";
    readonly SUBACCOUNT_NOT_FOUND: "subaccount_not_found";
    readonly INVALID_SUBACCOUNT: "invalid_subaccount";
    readonly INVALID_PARAMS: "invalid_params";
    readonly MISSING_REQUIRED_FIELD: "missing_required_field";
};
/**
 * Nado Server Error Codes (5xx)
 * These errors indicate server-side issues and MAY be retried with backoff.
 */
export declare const NADO_SERVER_ERRORS: {
    readonly INTERNAL_ERROR: "internal_error";
    readonly SERVICE_UNAVAILABLE: "service_unavailable";
    readonly TIMEOUT: "timeout";
    readonly DATABASE_ERROR: "database_error";
    readonly SEQUENCER_ERROR: "sequencer_error";
};
/**
 * Nado Rate Limit Error
 * Should be retried with exponential backoff.
 */
export declare const NADO_RATE_LIMIT_ERROR = "rate_limit_exceeded";
/**
 * Nado Network Errors
 * Connection and network-related errors that may be transient.
 */
export declare const NADO_NETWORK_ERRORS: {
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
export declare function mapNadoError(errorCode: string | number, message: string, originalError?: any): PerpDEXError;
/**
 * Extract error information from Nado API response
 *
 * @param response - Nado API response object
 * @returns Error code and message
 */
export declare function extractNadoError(response: any): {
    code: string;
    message: string;
};
/**
 * Map HTTP status code to error
 *
 * @param status - HTTP status code
 * @param statusText - HTTP status text
 * @returns Mapped error
 */
export declare function mapHttpError(status: number, statusText: string): PerpDEXError;
//# sourceMappingURL=error-codes.d.ts.map
/**
 * Backpack Error Handling
 *
 * Provides error code constants and mapping functions for Backpack-specific errors.
 * Translates Backpack API error responses to unified SDK error types.
 *
 * @see https://docs.backpack.exchange/api-reference/errors
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * Backpack Client Error Codes (1xxx - 2xxx)
 * These errors indicate client-side issues and should NOT be retried.
 */
export declare const BACKPACK_CLIENT_ERRORS: {
    readonly INVALID_ORDER: 1001;
    readonly INSUFFICIENT_MARGIN: 1002;
    readonly ORDER_NOT_FOUND: 1003;
    readonly POSITION_NOT_FOUND: 1004;
    readonly INVALID_PRICE: 1005;
    readonly INVALID_AMOUNT: 1006;
    readonly MIN_SIZE_NOT_MET: 1007;
    readonly MAX_SIZE_EXCEEDED: 1008;
    readonly MARKET_CLOSED: 1009;
    readonly INVALID_SYMBOL: 1010;
    readonly INVALID_SIGNATURE: 2001;
    readonly EXPIRED_AUTH: 2002;
    readonly INVALID_API_KEY: 2003;
    readonly MISSING_API_KEY: 2004;
    readonly INSUFFICIENT_PERMISSIONS: 2005;
    readonly INVALID_NONCE: 2006;
    readonly INVALID_PARAMS: 3001;
    readonly MISSING_REQUIRED_FIELD: 3002;
    readonly INVALID_FIELD_VALUE: 3003;
};
/**
 * Backpack Rate Limit Error (4xxx)
 * Should be retried with exponential backoff.
 */
export declare const BACKPACK_RATE_LIMIT_ERROR = 4001;
/**
 * Backpack Server Error Codes (5xxx)
 * These errors indicate server-side issues and MAY be retried with backoff.
 */
export declare const BACKPACK_SERVER_ERRORS: {
    readonly EXCHANGE_UNAVAILABLE: 5001;
    readonly INTERNAL_ERROR: 5002;
    readonly SERVICE_UNAVAILABLE: 5003;
    readonly TIMEOUT: 5004;
    readonly DATABASE_ERROR: 5005;
};
/**
 * Backpack Network Errors
 * Connection and network-related errors that may be transient.
 */
export declare const BACKPACK_NETWORK_ERRORS: {
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
export declare function isClientError(errorCode: number | string): boolean;
/**
 * Check if an error code indicates a server error (retryable)
 *
 * @param errorCode - Error code to check
 * @returns true if server error
 */
export declare function isServerError(errorCode: number | string): boolean;
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
export declare function isRetryableError(errorCode: number | string): boolean;
/**
 * Map Backpack error code and message to unified SDK error type
 *
 * @param errorCode - Backpack error code (string or number)
 * @param message - Error message
 * @param originalError - Original error object (optional)
 * @returns Mapped PerpDEXError subclass
 *
 * @example
 * ```typescript
 * const backpackResponse = {
 *   code: 1002,
 *   message: 'Insufficient margin to place order',
 * };
 *
 * const error = mapBackpackError(
 *   backpackResponse.code,
 *   backpackResponse.message
 * );
 *
 * if (error instanceof InsufficientMarginError) {
 *   console.log('Need more collateral');
 * }
 * ```
 */
export declare function mapBackpackError(errorCode: string | number, message: string, originalError?: any): PerpDEXError;
/**
 * Extract error information from Backpack API response
 *
 * @param response - Backpack API response object
 * @returns Error code and message
 */
export declare function extractBackpackError(response: any): {
    code: number | string;
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
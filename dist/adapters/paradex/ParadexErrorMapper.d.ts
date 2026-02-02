/**
 * Paradex Error Handling
 *
 * Provides error code constants and mapping functions for Paradex-specific errors.
 * Translates Paradex API error responses to unified SDK error types.
 *
 * @see https://docs.paradex.trade/api/errors
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * Paradex Client Error Codes (1xxx, 2xxx)
 * These errors indicate client-side issues and should NOT be retried.
 */
export declare const PARADEX_CLIENT_ERRORS: {
    readonly INVALID_ORDER: 1001;
    readonly INSUFFICIENT_MARGIN: 1002;
    readonly ORDER_NOT_FOUND: 1003;
    readonly POSITION_NOT_FOUND: 1004;
    readonly INVALID_SIZE: 1005;
    readonly INVALID_PRICE: 1006;
    readonly MIN_SIZE_NOT_MET: 1007;
    readonly MAX_SIZE_EXCEEDED: 1008;
    readonly PRICE_OUT_OF_RANGE: 1009;
    readonly SELF_TRADE: 1010;
    readonly ORDER_ALREADY_FILLED: 1011;
    readonly ORDER_ALREADY_CANCELLED: 1012;
    readonly REDUCE_ONLY_VIOLATION: 1013;
    readonly POST_ONLY_VIOLATION: 1014;
    readonly INVALID_TIME_IN_FORCE: 1015;
    readonly INVALID_MARKET: 1020;
    readonly MARKET_NOT_ACTIVE: 1021;
    readonly MARKET_CLOSED: 1022;
    readonly TRADING_HALTED: 1023;
    readonly INVALID_LEVERAGE: 1030;
    readonly MAX_LEVERAGE_EXCEEDED: 1031;
    readonly INSUFFICIENT_BALANCE: 1032;
    readonly MAX_POSITION_EXCEEDED: 1033;
    readonly INVALID_SIGNATURE: 2001;
    readonly EXPIRED_AUTH: 2002;
    readonly INVALID_API_KEY: 2003;
    readonly UNAUTHORIZED: 2004;
    readonly FORBIDDEN: 2005;
    readonly INVALID_REQUEST: 2006;
    readonly INVALID_PARAMS: 2010;
    readonly MISSING_REQUIRED_FIELD: 2011;
    readonly INVALID_TIMESTAMP: 2012;
    readonly NONCE_TOO_LOW: 2013;
    readonly NONCE_TOO_HIGH: 2014;
};
/**
 * Paradex Rate Limit Error (4xxx)
 */
export declare const PARADEX_RATE_LIMIT_ERROR = 4001;
/**
 * Paradex Server Error Codes (5xxx)
 * These errors indicate server-side issues and MAY be retried with backoff.
 */
export declare const PARADEX_SERVER_ERRORS: {
    readonly INTERNAL_ERROR: 5001;
    readonly SERVICE_UNAVAILABLE: 5002;
    readonly GATEWAY_TIMEOUT: 5003;
    readonly DATABASE_ERROR: 5004;
    readonly MATCHING_ENGINE_ERROR: 5005;
    readonly SEQUENCER_ERROR: 5006;
    readonly MAINTENANCE_MODE: 5007;
};
/**
 * Paradex Network Errors
 * Connection and network-related errors that may be transient.
 */
export declare const PARADEX_NETWORK_ERRORS: {
    readonly ECONNRESET: "ECONNRESET";
    readonly ETIMEDOUT: "ETIMEDOUT";
    readonly ENOTFOUND: "ENOTFOUND";
    readonly ECONNREFUSED: "ECONNREFUSED";
    readonly ECONNABORTED: "ECONNABORTED";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly WEBSOCKET_CLOSED: "WEBSOCKET_CLOSED";
    readonly WEBSOCKET_ERROR: "WEBSOCKET_ERROR";
};
/**
 * Check if an error code indicates a client error (non-retryable)
 *
 * @param code - Error code to check
 * @returns true if client error
 */
export declare function isClientError(code: string | number): boolean;
/**
 * Check if an error code indicates a server error (retryable)
 *
 * @param code - Error code to check
 * @returns true if server error
 */
export declare function isServerError(code: string | number): boolean;
/**
 * Check if an error code indicates a network error (retryable)
 *
 * @param code - Error code to check
 * @returns true if network error
 */
export declare function isNetworkError(code: string): boolean;
/**
 * Check if an error should be retried
 *
 * @param code - Error code to check
 * @returns true if retryable
 */
export declare function isRetryableError(code: string | number): boolean;
/**
 * Map Paradex error code and message to unified SDK error type
 *
 * @param errorCode - Paradex error code (string or number)
 * @param message - Error message
 * @param originalError - Original error object (optional)
 * @returns Mapped PerpDEXError subclass
 *
 * @example
 * ```typescript
 * const paradexResponse = {
 *   error: {
 *     code: 1002,
 *     message: 'Insufficient margin to place order',
 *   },
 * };
 *
 * const error = mapParadexError(
 *   paradexResponse.error.code,
 *   paradexResponse.error.message
 * );
 *
 * if (error instanceof InsufficientMarginError) {
 *   console.log('Need more collateral');
 * }
 * ```
 */
export declare function mapParadexError(errorCode: string | number, message: string, originalError?: any): PerpDEXError;
/**
 * Extract error information from Paradex API response
 *
 * @param response - Paradex API response object
 * @returns Error code and message
 */
export declare function extractParadexError(response: any): {
    code: string;
    message: string;
};
/**
 * Map HTTP status code to error
 *
 * @param status - HTTP status code
 * @param statusText - HTTP status text
 * @param responseData - Optional response data
 * @returns Mapped error
 */
export declare function mapHttpError(status: number, statusText: string, responseData?: any): PerpDEXError;
/**
 * Map axios error to PerpDEXError
 *
 * @param error - Axios error object
 * @returns Mapped error
 */
export declare function mapAxiosError(error: any): PerpDEXError;
//# sourceMappingURL=ParadexErrorMapper.d.ts.map
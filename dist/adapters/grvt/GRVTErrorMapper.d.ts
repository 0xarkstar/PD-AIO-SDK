/**
 * GRVT Error Handling
 *
 * Provides error code constants and mapping functions for GRVT-specific errors.
 * Translates GRVT API error responses to unified SDK error types.
 *
 * @see https://docs.grvt.io/developer-resources/api/errors
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * GRVT Client Error Codes (4xx)
 * These errors indicate client-side issues and should NOT be retried.
 */
export declare const GRVT_CLIENT_ERRORS: {
    readonly INVALID_SIGNATURE: "INVALID_SIGNATURE";
    readonly EXPIRED_SESSION: "EXPIRED_SESSION";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly INVALID_API_KEY: "INVALID_API_KEY";
    readonly INVALID_ORDER: "INVALID_ORDER";
    readonly INSUFFICIENT_MARGIN: "INSUFFICIENT_MARGIN";
    readonly INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE";
    readonly ORDER_NOT_FOUND: "ORDER_NOT_FOUND";
    readonly ORDER_ALREADY_FILLED: "ORDER_ALREADY_FILLED";
    readonly ORDER_ALREADY_CANCELLED: "ORDER_ALREADY_CANCELLED";
    readonly INVALID_PRICE: "INVALID_PRICE";
    readonly INVALID_SIZE: "INVALID_SIZE";
    readonly MIN_SIZE_NOT_MET: "MIN_SIZE_NOT_MET";
    readonly MAX_SIZE_EXCEEDED: "MAX_SIZE_EXCEEDED";
    readonly PRICE_OUT_OF_RANGE: "PRICE_OUT_OF_RANGE";
    readonly SELF_TRADE: "SELF_TRADE";
    readonly INVALID_INSTRUMENT: "INVALID_INSTRUMENT";
    readonly INSTRUMENT_NOT_ACTIVE: "INSTRUMENT_NOT_ACTIVE";
    readonly MARKET_CLOSED: "MARKET_CLOSED";
    readonly TRADING_HALTED: "TRADING_HALTED";
    readonly POSITION_NOT_FOUND: "POSITION_NOT_FOUND";
    readonly MAX_POSITION_EXCEEDED: "MAX_POSITION_EXCEEDED";
    readonly REDUCE_ONLY_VIOLATION: "REDUCE_ONLY_VIOLATION";
    readonly INVALID_LEVERAGE: "INVALID_LEVERAGE";
    readonly MAX_LEVERAGE_EXCEEDED: "MAX_LEVERAGE_EXCEEDED";
    readonly INVALID_REQUEST: "INVALID_REQUEST";
    readonly INVALID_PARAMS: "INVALID_PARAMS";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly INVALID_TIME_IN_FORCE: "INVALID_TIME_IN_FORCE";
};
/**
 * GRVT Server Error Codes (5xx)
 * These errors indicate server-side issues and MAY be retried with backoff.
 */
export declare const GRVT_SERVER_ERRORS: {
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly GATEWAY_TIMEOUT: "GATEWAY_TIMEOUT";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly MATCHING_ENGINE_ERROR: "MATCHING_ENGINE_ERROR";
    readonly SEQUENCER_ERROR: "SEQUENCER_ERROR";
};
/**
 * GRVT Rate Limit Error
 * Should be retried with exponential backoff.
 */
export declare const GRVT_RATE_LIMIT_ERROR = "RATE_LIMIT_EXCEEDED";
/**
 * GRVT Network Errors
 * Connection and network-related errors that may be transient.
 */
export declare const GRVT_NETWORK_ERRORS: {
    readonly ECONNRESET: "ECONNRESET";
    readonly ETIMEDOUT: "ETIMEDOUT";
    readonly ENOTFOUND: "ENOTFOUND";
    readonly ECONNREFUSED: "ECONNREFUSED";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly WEBSOCKET_CLOSED: "WEBSOCKET_CLOSED";
    readonly WEBSOCKET_ERROR: "WEBSOCKET_ERROR";
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
export declare function mapGRVTError(errorCode: string | number, message: string, originalError?: any): PerpDEXError;
/**
 * Extract error information from GRVT API response
 *
 * @param response - GRVT API response object
 * @returns Error code and message
 */
export declare function extractGRVTError(response: any): {
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
//# sourceMappingURL=GRVTErrorMapper.d.ts.map
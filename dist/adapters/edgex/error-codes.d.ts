/**
 * EdgeX Error Handling
 *
 * Provides error code constants and mapping functions for EdgeX-specific errors.
 * Translates EdgeX API error responses to unified SDK error types.
 *
 * @see https://docs.edgex.exchange/api/errors
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * EdgeX Client Error Codes
 */
export declare const EDGEX_CLIENT_ERRORS: {
    readonly INVALID_SIGNATURE: "INVALID_SIGNATURE";
    readonly INVALID_ORDER: "INVALID_ORDER";
    readonly INSUFFICIENT_MARGIN: "INSUFFICIENT_MARGIN";
    readonly ORDER_NOT_FOUND: "ORDER_NOT_FOUND";
    readonly INVALID_PARAMS: "INVALID_PARAMS";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
};
/**
 * EdgeX Server Error Codes
 */
export declare const EDGEX_SERVER_ERRORS: {
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly TIMEOUT: "TIMEOUT";
};
/**
 * EdgeX Rate Limit Error
 */
export declare const EDGEX_RATE_LIMIT_ERROR = "RATE_LIMIT_EXCEEDED";
/**
 * Map EdgeX error to unified SDK error type
 */
export declare function mapEdgeXError(errorCode: string, message: string, originalError?: any): PerpDEXError;
/**
 * Map error from unknown type
 */
export declare function mapError(error: unknown): PerpDEXError;
/**
 * Check if error is retryable
 */
export declare function isRetryableError(errorCode: string): boolean;
//# sourceMappingURL=error-codes.d.ts.map
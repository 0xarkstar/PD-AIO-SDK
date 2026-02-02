/**
 * GRVT Error Handling
 *
 * Provides error code constants and mapping functions for GRVT-specific errors.
 * GRVT uses official SDK which handles errors internally, but we provide
 * additional error mapping for completeness.
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * GRVT Client Error Codes
 */
export declare const GRVT_CLIENT_ERRORS: {
    readonly INVALID_ORDER: "INVALID_ORDER";
    readonly INSUFFICIENT_MARGIN: "INSUFFICIENT_MARGIN";
    readonly ORDER_NOT_FOUND: "ORDER_NOT_FOUND";
    readonly INVALID_SIGNATURE: "INVALID_SIGNATURE";
    readonly INVALID_PARAMS: "INVALID_PARAMS";
};
/**
 * GRVT Server Error Codes
 */
export declare const GRVT_SERVER_ERRORS: {
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly TIMEOUT: "TIMEOUT";
};
/**
 * GRVT Rate Limit Error
 */
export declare const GRVT_RATE_LIMIT_ERROR = "RATE_LIMIT_EXCEEDED";
/**
 * Map GRVT error to unified SDK error type
 */
export declare function mapGRVTError(errorCode: string, message: string, originalError?: any): PerpDEXError;
/**
 * Map error from unknown type
 */
export declare function mapError(error: unknown): PerpDEXError;
/**
 * Check if error is retryable
 */
export declare function isRetryableError(errorCode: string): boolean;
//# sourceMappingURL=error-codes.d.ts.map
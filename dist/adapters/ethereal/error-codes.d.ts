/**
 * Ethereal Error Handling
 *
 * Provides error code constants and mapping functions for Ethereal-specific errors.
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * Ethereal Client Error Codes
 */
export declare const ETHEREAL_CLIENT_ERRORS: {
    readonly SYMBOL_NOT_FOUND: "SYMBOL_NOT_FOUND";
    readonly INVALID_ORDER: "INVALID_ORDER";
    readonly ORDER_NOT_FOUND: "ORDER_NOT_FOUND";
    readonly INVALID_SIGNATURE: "INVALID_SIGNATURE";
    readonly INVALID_NONCE: "INVALID_NONCE";
    readonly INPUT_VALIDATION_ERROR: "INPUT_VALIDATION_ERROR";
    readonly ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND";
};
/**
 * Ethereal Server Error Codes
 */
export declare const ETHEREAL_SERVER_ERRORS: {
    readonly INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
};
/**
 * Ethereal Rate Limit Error
 */
export declare const ETHEREAL_RATE_LIMIT_ERROR = "RATE_LIMIT_EXCEEDED";
/**
 * Ethereal Error Message Patterns
 */
export declare const ETHEREAL_ERROR_MESSAGES: Record<string, string>;
/**
 * Extract error code from error message
 */
export declare function extractErrorCode(errorMessage: string): string;
/**
 * Map Ethereal error to unified SDK error type
 */
export declare function mapEtherealError(errorCode: string, message: string, originalError?: unknown): PerpDEXError;
/**
 * Map error from unknown type
 */
export declare function mapError(error: unknown): PerpDEXError;
/**
 * Check if error is retryable
 */
export declare function isRetryableError(errorCode: string): boolean;
//# sourceMappingURL=error-codes.d.ts.map
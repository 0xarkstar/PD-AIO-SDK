/**
 * Reya Error Handling
 *
 * Provides error code constants and mapping functions for Reya-specific errors.
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * Reya Client Error Codes
 */
export declare const REYA_CLIENT_ERRORS: {
    readonly SYMBOL_NOT_FOUND: "SYMBOL_NOT_FOUND";
    readonly NO_ACCOUNTS_FOUND: "NO_ACCOUNTS_FOUND";
    readonly NO_PRICES_FOUND: "NO_PRICES_FOUND_FOR_SYMBOL";
    readonly INPUT_VALIDATION_ERROR: "INPUT_VALIDATION_ERROR";
    readonly CREATE_ORDER_ERROR: "CREATE_ORDER_OTHER_ERROR";
    readonly CANCEL_ORDER_ERROR: "CANCEL_ORDER_OTHER_ERROR";
    readonly ORDER_DEADLINE_PASSED: "ORDER_DEADLINE_PASSED_ERROR";
    readonly ORDER_DEADLINE_TOO_HIGH: "ORDER_DEADLINE_TOO_HIGH_ERROR";
    readonly INVALID_NONCE: "INVALID_NONCE_ERROR";
    readonly UNAUTHORIZED_SIGNATURE: "UNAUTHORIZED_SIGNATURE_ERROR";
    readonly NUMERIC_OVERFLOW: "NUMERIC_OVERFLOW_ERROR";
};
/**
 * Reya Server Error Codes
 */
export declare const REYA_SERVER_ERRORS: {
    readonly INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR";
    readonly UNAVAILABLE_MATCHING_ENGINE: "UNAVAILABLE_MATCHING_ENGINE_ERROR";
};
/**
 * Reya Rate Limit Error
 */
export declare const REYA_RATE_LIMIT_ERROR = "RATE_LIMIT_EXCEEDED";
/**
 * Reya Error Message Patterns
 */
export declare const REYA_ERROR_MESSAGES: Record<string, string>;
/**
 * Extract error code from error message
 */
export declare function extractErrorCode(errorMessage: string): string;
/**
 * Map Reya error to unified SDK error type
 */
export declare function mapReyaError(errorCode: string, message: string, originalError?: unknown): PerpDEXError;
/**
 * Map error from unknown type
 */
export declare function mapError(error: unknown): PerpDEXError;
/**
 * Check if error is retryable
 */
export declare function isRetryableError(errorCode: string): boolean;
//# sourceMappingURL=error-codes.d.ts.map
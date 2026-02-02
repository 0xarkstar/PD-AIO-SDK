/**
 * Hyperliquid Error Handling
 *
 * Provides error code constants and mapping functions for Hyperliquid-specific errors.
 * Translates Hyperliquid API error responses to unified SDK error types.
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/errors
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * Hyperliquid Client Error Codes
 */
export declare const HYPERLIQUID_CLIENT_ERRORS: {
    readonly INSUFFICIENT_MARGIN: "INSUFFICIENT_MARGIN";
    readonly INVALID_SIGNATURE: "INVALID_SIGNATURE";
    readonly ORDER_WOULD_MATCH: "ORDER_WOULD_MATCH";
    readonly POSITION_NOT_FOUND: "POSITION_NOT_FOUND";
    readonly ORDER_NOT_FOUND: "ORDER_NOT_FOUND";
    readonly INVALID_ORDER: "INVALID_ORDER";
    readonly INVALID_PRICE: "INVALID_PRICE";
    readonly INVALID_SIZE: "INVALID_SIZE";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
};
/**
 * Hyperliquid Server Error Codes
 */
export declare const HYPERLIQUID_SERVER_ERRORS: {
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly TIMEOUT: "TIMEOUT";
};
/**
 * Hyperliquid Rate Limit Error
 */
export declare const HYPERLIQUID_RATE_LIMIT_ERROR = "RATE_LIMIT_EXCEEDED";
/**
 * Hyperliquid Error Message Patterns
 * Maps error message patterns to error codes
 */
export declare const HYPERLIQUID_ERROR_MESSAGES: Record<string, string>;
/**
 * Extract error code from error message
 */
export declare function extractErrorCode(errorMessage: string): string;
/**
 * Map Hyperliquid error to unified SDK error type
 */
export declare function mapHyperliquidError(errorCode: string, message: string, originalError?: any): PerpDEXError;
/**
 * Map error from unknown type (backward compatibility)
 */
export declare function mapError(error: unknown): PerpDEXError;
/**
 * Check if error is retryable
 */
export declare function isRetryableError(errorCode: string): boolean;
//# sourceMappingURL=error-codes.d.ts.map
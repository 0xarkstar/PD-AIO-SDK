/**
 * Variational Error Codes
 *
 * Error code definitions and mapping functions for Variational exchange
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * Variational client error codes (4xx)
 */
export declare const VARIATIONAL_CLIENT_ERRORS: {
    readonly INSUFFICIENT_MARGIN: "INSUFFICIENT_MARGIN";
    readonly INVALID_SIGNATURE: "INVALID_SIGNATURE";
    readonly INVALID_ORDER: "INVALID_ORDER";
    readonly INVALID_SYMBOL: "INVALID_SYMBOL";
    readonly INVALID_AMOUNT: "INVALID_AMOUNT";
    readonly INVALID_PRICE: "INVALID_PRICE";
    readonly ORDER_NOT_FOUND: "ORDER_NOT_FOUND";
    readonly POSITION_NOT_FOUND: "POSITION_NOT_FOUND";
    readonly QUOTE_NOT_FOUND: "QUOTE_NOT_FOUND";
    readonly QUOTE_EXPIRED: "QUOTE_EXPIRED";
    readonly INVALID_API_KEY: "INVALID_API_KEY";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
};
/**
 * Variational server error codes (5xx)
 */
export declare const VARIATIONAL_SERVER_ERRORS: {
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly TIMEOUT: "TIMEOUT";
    readonly MATCHING_ENGINE_ERROR: "MATCHING_ENGINE_ERROR";
};
/**
 * Variational rate limit error
 */
export declare const VARIATIONAL_RATE_LIMIT_ERROR = "RATE_LIMIT_EXCEEDED";
/**
 * HTTP status code to error code mapping
 */
export declare const VARIATIONAL_HTTP_ERROR_CODES: Record<number, string>;
/**
 * Error message to error code mapping
 */
export declare const VARIATIONAL_ERROR_MESSAGES: Record<string, string>;
/**
 * Check if error code is a client error
 */
export declare function isClientError(code: string): boolean;
/**
 * Check if error code is a server error
 */
export declare function isServerError(code: string): boolean;
/**
 * Check if error is retryable
 */
export declare function isRetryableError(code: string): boolean;
/**
 * Extract error code from error message
 */
export declare function extractErrorCode(message: string): string;
/**
 * Extract error code from HTTP status
 */
export declare function extractErrorCodeFromStatus(status: number): string;
/**
 * Map Variational error to unified PerpDEXError
 */
export declare function mapVariationalError(code: string | number, message: string, context?: Record<string, unknown>): PerpDEXError;
/**
 * Map HTTP response to error
 */
export declare function mapHTTPError(status: number, body: any): PerpDEXError;
//# sourceMappingURL=error-codes.d.ts.map
/**
 * Extended Error Codes
 *
 * Error code definitions and mapping functions for Extended exchange
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * Extended client error codes (4xx)
 */
export declare const EXTENDED_CLIENT_ERRORS: {
    readonly INSUFFICIENT_MARGIN: "INSUFFICIENT_MARGIN";
    readonly INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE";
    readonly INVALID_API_KEY: "INVALID_API_KEY";
    readonly INVALID_ORDER: "INVALID_ORDER";
    readonly INVALID_SYMBOL: "INVALID_SYMBOL";
    readonly INVALID_QUANTITY: "INVALID_QUANTITY";
    readonly INVALID_PRICE: "INVALID_PRICE";
    readonly INVALID_LEVERAGE: "INVALID_LEVERAGE";
    readonly ORDER_NOT_FOUND: "ORDER_NOT_FOUND";
    readonly POSITION_NOT_FOUND: "POSITION_NOT_FOUND";
    readonly LEVERAGE_TOO_HIGH: "LEVERAGE_TOO_HIGH";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly MARKET_CLOSED: "MARKET_CLOSED";
    readonly LIQUIDATION_RISK: "LIQUIDATION_RISK";
};
/**
 * Extended server error codes (5xx)
 */
export declare const EXTENDED_SERVER_ERRORS: {
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly TIMEOUT: "TIMEOUT";
    readonly MATCHING_ENGINE_ERROR: "MATCHING_ENGINE_ERROR";
    readonly STARKNET_ERROR: "STARKNET_ERROR";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
};
/**
 * Extended rate limit error
 */
export declare const EXTENDED_RATE_LIMIT_ERROR = "RATE_LIMIT_EXCEEDED";
/**
 * Extended StarkNet-specific errors
 */
export declare const EXTENDED_STARKNET_ERRORS: {
    readonly TRANSACTION_FAILED: "STARKNET_TRANSACTION_FAILED";
    readonly INVALID_SIGNATURE: "STARKNET_INVALID_SIGNATURE";
    readonly INSUFFICIENT_FUNDS: "STARKNET_INSUFFICIENT_FUNDS";
    readonly CONTRACT_ERROR: "STARKNET_CONTRACT_ERROR";
    readonly NONCE_MISMATCH: "STARKNET_NONCE_MISMATCH";
};
/**
 * HTTP status code to error code mapping
 */
export declare const EXTENDED_HTTP_ERROR_CODES: Record<number, string>;
/**
 * Error message to error code mapping
 */
export declare const EXTENDED_ERROR_MESSAGES: Record<string, string>;
/**
 * Check if error code is a client error
 */
export declare function isClientError(code: string): boolean;
/**
 * Check if error code is a server error
 */
export declare function isServerError(code: string): boolean;
/**
 * Check if error code is a StarkNet error
 */
export declare function isStarkNetError(code: string): boolean;
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
 * Map Extended error to unified PerpDEXError
 */
export declare function mapExtendedError(code: string | number, message: string, context?: Record<string, unknown>): PerpDEXError;
/**
 * Map HTTP response to error
 */
export declare function mapHTTPError(status: number, body: any): PerpDEXError;
/**
 * Map StarkNet error to PerpDEXError
 */
export declare function mapStarkNetError(error: any): PerpDEXError;
//# sourceMappingURL=error-codes.d.ts.map
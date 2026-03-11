/**
 * Avantis Error Handling
 *
 * Maps on-chain errors (reverts, gas issues) to unified SDK error types.
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * On-chain revert error patterns
 */
export declare const AVANTIS_REVERT_ERRORS: {
    readonly WRONG_TRADE: "WRONG_TRADE";
    readonly WRONG_LEVERAGE: "WRONG_LEVERAGE";
    readonly WRONG_TP: "WRONG_TP";
    readonly WRONG_SL: "WRONG_SL";
    readonly MAX_TRADES_PER_PAIR: "MAX_TRADES_PER_PAIR";
    readonly ABOVE_MAX_POS: "ABOVE_MAX_POS";
    readonly BELOW_MIN_POS: "BELOW_MIN_POS";
    readonly PAIR_NOT_LISTED: "PAIR_NOT_LISTED";
    readonly NO_TRADE: "NO_TRADE";
    readonly NO_LIMIT: "NO_LIMIT";
    readonly ALREADY_BEING_CLOSED: "ALREADY_BEING_CLOSED";
    readonly PRICE_NOT_HIT: "PRICE_NOT_HIT";
};
/**
 * Transaction-level errors
 */
export declare const AVANTIS_TX_ERRORS: {
    readonly INSUFFICIENT_GAS: "INSUFFICIENT_GAS";
    readonly NONCE_TOO_LOW: "NONCE_TOO_LOW";
    readonly TRANSACTION_REVERTED: "TRANSACTION_REVERTED";
    readonly REPLACEMENT_UNDERPRICED: "REPLACEMENT_UNDERPRICED";
    readonly RPC_ERROR: "RPC_ERROR";
    readonly TIMEOUT: "TIMEOUT";
};
/**
 * Error message pattern mapping
 */
export declare const AVANTIS_ERROR_MESSAGES: Record<string, string>;
/**
 * Extract error code from error message
 */
export declare function extractErrorCode(errorMessage: string): string;
/**
 * Map Avantis error to unified SDK error type
 */
export declare function mapAvantisError(errorCode: string, message: string, originalError?: unknown): PerpDEXError;
/**
 * Map error from unknown type
 */
export declare function mapError(error: unknown): PerpDEXError;
/**
 * Check if error is retryable
 */
export declare function isRetryableError(errorCode: string): boolean;
//# sourceMappingURL=error-codes.d.ts.map
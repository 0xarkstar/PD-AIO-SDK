/**
 * Drift Protocol Error Code Mappings
 *
 * Maps Drift-specific error messages to standardized error types
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * Map Drift/Solana errors to unified PerpDEX error types
 *
 * @param error - Error from Drift/Solana
 * @returns Unified PerpDEXError
 */
export declare function mapDriftError(error: unknown): PerpDEXError;
/**
 * Standard Drift error codes for reference
 */
export declare const DriftErrorCodes: {
    readonly INSUFFICIENT_MARGIN: "INSUFFICIENT_MARGIN";
    readonly INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE";
    readonly INSUFFICIENT_SOL: "INSUFFICIENT_SOL";
    readonly MAX_LEVERAGE_EXCEEDED: "MAX_LEVERAGE_EXCEEDED";
    readonly MIN_ORDER_SIZE: "MIN_ORDER_SIZE";
    readonly MAX_POSITIONS: "MAX_POSITIONS";
    readonly REDUCE_ONLY_VIOLATION: "REDUCE_ONLY_VIOLATION";
    readonly POST_ONLY_VIOLATION: "POST_ONLY_VIOLATION";
    readonly SLIPPAGE_EXCEEDED: "SLIPPAGE_EXCEEDED";
    readonly PRICE_BANDS_BREACHED: "PRICE_BANDS_BREACHED";
    readonly POSITION_NOT_FOUND: "POSITION_NOT_FOUND";
    readonly POSITION_LIQUIDATED: "POSITION_LIQUIDATED";
    readonly ORDER_NOT_FOUND: "ORDER_NOT_FOUND";
    readonly ORDER_EXPIRED: "ORDER_EXPIRED";
    readonly ORACLE_ERROR: "ORACLE_ERROR";
    readonly ORACLE_STALE: "ORACLE_STALE";
    readonly MARKET_PAUSED: "MARKET_PAUSED";
    readonly MARKET_NOT_ACTIVE: "MARKET_NOT_ACTIVE";
    readonly TRANSACTION_FAILED: "TRANSACTION_FAILED";
    readonly TRANSACTION_EXPIRED: "TRANSACTION_EXPIRED";
    readonly INVALID_SIGNATURE: "INVALID_SIGNATURE";
    readonly ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND";
    readonly USER_NOT_INITIALIZED: "USER_NOT_INITIALIZED";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly RPC_UNAVAILABLE: "RPC_UNAVAILABLE";
    readonly TIMEOUT: "TIMEOUT";
    readonly LIQUIDATION: "LIQUIDATION";
    readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
};
export type DriftErrorCode = (typeof DriftErrorCodes)[keyof typeof DriftErrorCodes];
//# sourceMappingURL=error-codes.d.ts.map
/**
 * Jupiter Perps Error Code Mappings
 *
 * Maps Jupiter-specific error messages to standardized error types
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * Map Jupiter/Solana errors to unified PerpDEX error types
 *
 * @param error - Error from Jupiter/Solana
 * @returns Unified PerpDEXError
 */
export declare function mapJupiterError(error: unknown): PerpDEXError;
/**
 * Standard Jupiter error codes for reference
 */
export declare const JupiterErrorCodes: {
    readonly INSUFFICIENT_MARGIN: "INSUFFICIENT_MARGIN";
    readonly INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE";
    readonly INSUFFICIENT_SOL: "INSUFFICIENT_SOL";
    readonly INVALID_LEVERAGE: "INVALID_LEVERAGE";
    readonly MAX_LEVERAGE_EXCEEDED: "MAX_LEVERAGE_EXCEEDED";
    readonly MIN_POSITION_SIZE: "MIN_POSITION_SIZE";
    readonly POOL_CAPACITY_EXCEEDED: "POOL_CAPACITY_EXCEEDED";
    readonly POSITION_NOT_FOUND: "POSITION_NOT_FOUND";
    readonly POSITION_LIQUIDATED: "POSITION_LIQUIDATED";
    readonly ORACLE_ERROR: "ORACLE_ERROR";
    readonly ORACLE_STALE: "ORACLE_STALE";
    readonly TRANSACTION_FAILED: "TRANSACTION_FAILED";
    readonly TRANSACTION_EXPIRED: "TRANSACTION_EXPIRED";
    readonly INVALID_SIGNATURE: "INVALID_SIGNATURE";
    readonly ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND";
    readonly INVALID_ACCOUNT: "INVALID_ACCOUNT";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly RPC_UNAVAILABLE: "RPC_UNAVAILABLE";
    readonly TIMEOUT: "TIMEOUT";
    readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
};
export type JupiterErrorCode = typeof JupiterErrorCodes[keyof typeof JupiterErrorCodes];
//# sourceMappingURL=error-codes.d.ts.map
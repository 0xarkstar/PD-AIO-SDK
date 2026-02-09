/**
 * GMX v2 Error Code Mappings
 *
 * Maps GMX-specific error messages to standardized error types
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * Map GMX errors to unified PerpDEX error types
 *
 * @param error - Error from GMX API or on-chain
 * @returns Unified PerpDEXError
 */
export declare function mapGmxError(error: unknown): PerpDEXError;
/**
 * Standard GMX error codes for reference
 */
export declare const GmxErrorCodes: {
    readonly INSUFFICIENT_MARGIN: "INSUFFICIENT_MARGIN";
    readonly INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE";
    readonly INSUFFICIENT_GAS: "INSUFFICIENT_GAS";
    readonly MAX_LEVERAGE_EXCEEDED: "MAX_LEVERAGE_EXCEEDED";
    readonly MIN_ORDER_SIZE: "MIN_ORDER_SIZE";
    readonly MAX_POSITION_SIZE: "MAX_POSITION_SIZE";
    readonly MIN_COLLATERAL: "MIN_COLLATERAL";
    readonly SLIPPAGE_EXCEEDED: "SLIPPAGE_EXCEEDED";
    readonly INVALID_PRICE: "INVALID_PRICE";
    readonly POSITION_NOT_FOUND: "POSITION_NOT_FOUND";
    readonly POSITION_LIQUIDATED: "POSITION_LIQUIDATED";
    readonly ORDER_NOT_FOUND: "ORDER_NOT_FOUND";
    readonly ORDER_CANCELLED: "ORDER_CANCELLED";
    readonly INVALID_MARKET: "INVALID_MARKET";
    readonly ORACLE_ERROR: "ORACLE_ERROR";
    readonly INVALID_ORACLE_PRICE: "INVALID_ORACLE_PRICE";
    readonly MARKET_PAUSED: "MARKET_PAUSED";
    readonly MARKET_DISABLED: "MARKET_DISABLED";
    readonly TRANSACTION_FAILED: "TRANSACTION_FAILED";
    readonly TX_REVERTED: "TX_REVERTED";
    readonly NONCE_ERROR: "NONCE_ERROR";
    readonly INVALID_SIGNATURE: "INVALID_SIGNATURE";
    readonly KEEPER_ERROR: "KEEPER_ERROR";
    readonly KEEPER_EXECUTION_FAILED: "KEEPER_EXECUTION_FAILED";
    readonly RATE_LIMIT: "RATE_LIMIT";
    readonly API_UNAVAILABLE: "API_UNAVAILABLE";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly TIMEOUT: "TIMEOUT";
    readonly SUBGRAPH_ERROR: "SUBGRAPH_ERROR";
    readonly LIQUIDATION: "LIQUIDATION";
    readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
};
export type GmxErrorCode = (typeof GmxErrorCodes)[keyof typeof GmxErrorCodes];
//# sourceMappingURL=error-codes.d.ts.map
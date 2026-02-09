/**
 * dYdX v4 Error Code Mappings
 *
 * Maps dYdX-specific error messages to standardized error types
 */
import { PerpDEXError } from '../../types/errors.js';
/**
 * Map dYdX API errors to unified PerpDEX error types
 *
 * @param error - Error from dYdX API
 * @returns Unified PerpDEXError
 */
export declare function mapDydxError(error: unknown): PerpDEXError;
/**
 * Standard dYdX error codes for reference
 */
export declare const DydxErrorCodes: {
    readonly INSUFFICIENT_MARGIN: "INSUFFICIENT_MARGIN";
    readonly INVALID_ORDER_SIZE: "INVALID_ORDER_SIZE";
    readonly PRICE_OUT_OF_BOUNDS: "PRICE_OUT_OF_BOUNDS";
    readonly ORDER_WOULD_MATCH: "ORDER_WOULD_MATCH";
    readonly ORDER_NOT_FOUND: "ORDER_NOT_FOUND";
    readonly POSITION_NOT_FOUND: "POSITION_NOT_FOUND";
    readonly MARKET_NOT_FOUND: "MARKET_NOT_FOUND";
    readonly MARKET_PAUSED: "MARKET_PAUSED";
    readonly SUBACCOUNT_NOT_FOUND: "SUBACCOUNT_NOT_FOUND";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly INVALID_SIGNATURE: "INVALID_SIGNATURE";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly EXCHANGE_DOWN: "EXCHANGE_DOWN";
    readonly TIMEOUT: "TIMEOUT";
    readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
    readonly BAD_REQUEST: "BAD_REQUEST";
    readonly NOT_FOUND: "NOT_FOUND";
};
export type DydxErrorCode = (typeof DydxErrorCodes)[keyof typeof DydxErrorCodes];
//# sourceMappingURL=error-codes.d.ts.map
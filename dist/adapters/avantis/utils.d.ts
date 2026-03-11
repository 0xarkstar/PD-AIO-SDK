/**
 * Avantis Utility Functions
 */
import type { OrderRequest } from '../../types/common.js';
import type { AvantisOrderParams } from './types.js';
/**
 * Get pairIndex from unified symbol
 * @example "BTC/USD:USD" -> 0
 */
export declare function getPairIndex(symbol: string): number;
/**
 * Get base symbol from pairIndex
 * @example 0 -> "BTC"
 */
export declare function getBaseFromPairIndex(pairIndex: number): string;
/**
 * Get Pyth price feed ID for a base symbol
 */
export declare function getPythFeedId(base: string): string | undefined;
/**
 * Convert Pyth oracle price to human-readable number.
 * Pyth prices are stored as (price * 10^expo).
 *
 * @param price - Raw price value from Pyth
 * @param expo - Exponent from Pyth (typically negative, e.g. -8)
 * @returns Human-readable price
 */
export declare function convertPythPrice(price: bigint | string, expo: number): number;
/**
 * Convert USDC amount from on-chain format (6 decimals) to number
 */
export declare function fromUsdcDecimals(amount: bigint | string): number;
/**
 * Convert number to USDC on-chain format (6 decimals)
 */
export declare function toUsdcDecimals(amount: number): bigint;
/**
 * Convert on-chain price (10 decimals) to number
 */
export declare function fromPriceDecimals(price: bigint | string): number;
/**
 * Convert number to on-chain price (10 decimals)
 */
export declare function toPriceDecimals(price: number): bigint;
/**
 * Build order params for on-chain transaction
 */
export declare function buildOrderParams(request: OrderRequest, traderAddress: string): AvantisOrderParams;
//# sourceMappingURL=utils.d.ts.map
/**
 * Lighter Order Utilities
 *
 * Pure utility functions for order building and conversion.
 * Extracted from LighterAdapter to improve modularity.
 */
import type { OrderRequest } from '../../types/common.js';
import { OrderType, TimeInForce } from './signer/index.js';
/**
 * Convert amount to base units (integer representation)
 *
 * @param amount - Human-readable amount
 * @param decimals - Number of decimal places
 * @returns BigInt representation
 */
export declare function toBaseUnits(amount: number, decimals: number): bigint;
/**
 * Convert price to price units (tick-adjusted)
 *
 * @param price - Human-readable price
 * @param tickSize - Minimum price increment
 * @returns Tick-adjusted price
 */
export declare function toPriceUnits(price: number, tickSize: number): number;
/**
 * Convert price from tick units back to human-readable
 *
 * @param priceUnits - Price in tick units
 * @param tickSize - Minimum price increment
 * @returns Human-readable price
 */
export declare function fromPriceUnits(priceUnits: number, tickSize: number): number;
/**
 * Convert amount from base units back to human-readable
 *
 * @param baseUnits - Amount in base units
 * @param decimals - Number of decimal places
 * @returns Human-readable amount
 */
export declare function fromBaseUnits(baseUnits: bigint | number, decimals: number): number;
/**
 * Map unified order type string to Lighter OrderType enum
 *
 * @param type - Unified order type string
 * @returns Lighter OrderType enum value
 */
export declare function mapOrderType(type: string): OrderType;
/**
 * Map Lighter OrderType enum to unified string
 *
 * @param type - Lighter OrderType enum value
 * @returns Unified order type string
 */
export declare function mapOrderTypeToString(type: OrderType): string;
/**
 * Map unified time in force string to Lighter TimeInForce enum
 *
 * @param tif - Unified time in force string
 * @param postOnly - Whether order is post-only
 * @returns Lighter TimeInForce enum value
 */
export declare function mapTimeInForce(tif?: string, postOnly?: boolean): TimeInForce;
/**
 * Map Lighter TimeInForce enum to unified string
 *
 * @param tif - Lighter TimeInForce enum value
 * @returns Unified time in force string
 */
export declare function mapTimeInForceToString(tif: TimeInForce): string;
/**
 * Convert unified order request to Lighter format (for HMAC mode)
 *
 * @param request - Unified OrderRequest
 * @param lighterSymbol - Lighter-native symbol
 * @returns Lighter order format
 */
export declare function convertOrderRequest(request: OrderRequest, lighterSymbol: string): Record<string, unknown>;
/**
 * Map order side to Lighter side value
 *
 * @param side - Unified side ('buy' | 'sell')
 * @returns Lighter side value (1 = buy, 2 = sell)
 */
export declare function mapSideToLighter(side: 'buy' | 'sell'): number;
/**
 * Map Lighter side value to unified side
 *
 * @param side - Lighter side value (1 = buy, 2 = sell)
 * @returns Unified side ('buy' | 'sell')
 */
export declare function mapSideFromLighter(side: number): 'buy' | 'sell';
/**
 * Calculate order expiration timestamp
 *
 * @param ttlSeconds - Time to live in seconds (0 = no expiry)
 * @returns Expiration timestamp in milliseconds
 */
export declare function calculateExpiration(ttlSeconds?: number): number;
/**
 * Validate order parameters
 *
 * @param request - Order request to validate
 * @throws Error if validation fails
 */
export declare function validateLighterOrder(request: OrderRequest): void;
//# sourceMappingURL=LighterOrderUtils.d.ts.map
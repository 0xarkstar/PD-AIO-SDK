/**
 * Base Normalizer Utilities
 *
 * Common utility functions for data normalization across all exchange adapters.
 * Provides standardized parsing, formatting, and mapping functions.
 */
import type { OrderSide, OrderStatus, OrderType, TimeInForce } from '../../types/common.js';
/**
 * Safely parse a numeric string to number
 *
 * @param value - Value to parse (string, number, null, undefined)
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed number or default value
 *
 * @example
 * ```typescript
 * parseDecimal('123.45');      // 123.45
 * parseDecimal('invalid');     // 0
 * parseDecimal(null, -1);      // -1
 * parseDecimal(undefined);     // 0
 * ```
 */
export declare function parseDecimal(value: string | number | null | undefined, defaultValue?: number): number;
/**
 * Safely parse a numeric string to bigint
 *
 * @param value - Value to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed bigint or default value
 */
export declare function parseBigInt(value: string | number | bigint | null | undefined, defaultValue?: bigint): bigint;
/**
 * Parse a string that may have x18 format (18 decimal places)
 *
 * @param value - Value in x18 format (e.g., "1000000000000000000" = 1.0)
 * @param decimals - Number of decimal places (default: 18)
 * @returns Parsed number
 */
export declare function parseX18(value: string | number | null | undefined, decimals?: number): number;
/**
 * Format a number to x18 format string
 *
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 18)
 * @returns Formatted x18 string
 */
export declare function formatX18(value: number, decimals?: number): string;
/**
 * Build a CCXT-style unified symbol
 *
 * @param base - Base currency (e.g., "BTC")
 * @param quote - Quote currency (e.g., "USDT")
 * @param settle - Settlement currency (e.g., "USDT") for perpetuals
 * @returns Unified symbol (e.g., "BTC/USDT:USDT")
 */
export declare function buildUnifiedSymbol(base: string, quote: string, settle?: string): string;
/**
 * Parse a CCXT-style unified symbol
 *
 * @param symbol - Unified symbol (e.g., "BTC/USDT:USDT")
 * @returns Parsed symbol parts
 */
export declare function parseUnifiedSymbol(symbol: string): {
    base: string;
    quote: string;
    settle?: string;
    isPerp: boolean;
};
/**
 * Convert perpetual symbol format
 *
 * @param symbol - Exchange-specific symbol (e.g., "BTC-PERP", "BTCUSD_PERP")
 * @param patterns - Regex patterns to match
 * @returns Base currency extracted from symbol
 */
export declare function extractBaseFromPerpSymbol(symbol: string): string;
/**
 * Common order status mappings from exchange-specific to unified format
 */
export declare const ORDER_STATUS_MAP: Record<string, OrderStatus>;
/**
 * Map exchange order status to unified format
 *
 * @param status - Exchange-specific status
 * @param defaultStatus - Default status if not found
 * @returns Unified order status
 */
export declare function mapOrderStatus(status: string, defaultStatus?: OrderStatus): OrderStatus;
/**
 * Common order type mappings
 */
export declare const ORDER_TYPE_MAP: Record<string, OrderType>;
/**
 * Map exchange order type to unified format
 */
export declare function mapOrderType(type: string, defaultType?: OrderType): OrderType;
/**
 * Map order side from various formats
 */
export declare function mapOrderSide(side: string | number): OrderSide;
/**
 * Map time in force from various formats
 */
export declare function mapTimeInForce(tif: string | undefined): TimeInForce;
/**
 * Normalize timestamp to milliseconds
 *
 * @param timestamp - Timestamp in various formats (seconds, milliseconds, ISO string)
 * @returns Timestamp in milliseconds
 */
export declare function normalizeTimestamp(timestamp: number | string | Date | null | undefined): number;
/**
 * Format timestamp to ISO string
 */
export declare function formatTimestamp(timestamp: number): string;
/**
 * Round a number to specified decimal places
 *
 * @param value - Value to round
 * @param decimals - Number of decimal places
 * @returns Rounded value
 */
export declare function roundToDecimals(value: number, decimals: number): number;
/**
 * Round price to tick size
 *
 * @param price - Price to round
 * @param tickSize - Minimum price increment
 * @returns Rounded price
 */
export declare function roundToTickSize(price: number, tickSize: number): number;
/**
 * Round amount to step size
 *
 * @param amount - Amount to round
 * @param stepSize - Minimum amount increment
 * @returns Rounded amount
 */
export declare function roundToStepSize(amount: number, stepSize: number): number;
/**
 * Get number of decimal places from precision value
 *
 * @param precision - Precision value (e.g., 0.001)
 * @returns Number of decimal places (e.g., 3)
 */
export declare function getDecimalPlaces(precision: number): number;
//# sourceMappingURL=BaseNormalizer.d.ts.map
/**
 * dYdX v4 Utility Functions
 *
 * Helper functions for request conversion and data handling.
 */
import type { OrderRequest, OHLCVTimeframe } from '../../types/index.js';
import type { DydxPlaceOrderParams } from './types.js';
/**
 * Convert unified order request to dYdX format
 *
 * This is a conversion utility for building order parameters
 * that can be used with the dYdX client SDK.
 *
 * @param request - Unified order request
 * @param subaccountNumber - The subaccount number to use
 * @returns dYdX order parameters
 */
export declare function convertOrderRequest(request: OrderRequest, subaccountNumber: number): DydxPlaceOrderParams;
/**
 * dYdX candle resolutions
 */
export declare const DYDX_CANDLE_RESOLUTIONS: {
    readonly '1m': "1MIN";
    readonly '5m': "5MINS";
    readonly '15m': "15MINS";
    readonly '30m': "30MINS";
    readonly '1h': "1HOUR";
    readonly '4h': "4HOURS";
    readonly '1d': "1DAY";
};
/**
 * Map unified timeframe to dYdX resolution
 *
 * @param timeframe - Unified timeframe (e.g., '1h', '4h')
 * @returns dYdX resolution string
 */
export declare function mapTimeframeToDydx(timeframe: OHLCVTimeframe): string;
/**
 * Get default duration for OHLCV data fetch based on timeframe
 *
 * @param timeframe - Unified timeframe
 * @returns Duration in milliseconds
 */
export declare function getDefaultOHLCVDuration(timeframe: OHLCVTimeframe): number;
/**
 * Round a number to specified decimal places
 *
 * @param value - Number to round
 * @param precision - Decimal places
 * @returns Rounded number
 */
export declare function roundToPrecision(value: number, precision: number): number;
/**
 * Round price to tick size
 *
 * @param price - Price to round
 * @param tickSize - Tick size
 * @returns Rounded price
 */
export declare function roundToTickSize(price: number, tickSize: number): number;
/**
 * Round amount to step size
 *
 * @param amount - Amount to round
 * @param stepSize - Step size
 * @returns Rounded amount
 */
export declare function roundToStepSize(amount: number, stepSize: number): number;
/**
 * Get good-til-time in seconds from now
 *
 * @param durationSeconds - Duration in seconds (default: 10 minutes)
 * @returns Unix timestamp in seconds
 */
export declare function getGoodTilTimeInSeconds(durationSeconds?: number): number;
/**
 * Parse ISO timestamp to milliseconds
 *
 * @param isoString - ISO 8601 timestamp string
 * @returns Unix timestamp in milliseconds
 */
export declare function parseISOTimestamp(isoString: string): number;
/**
 * Build subaccount ID from address and number
 *
 * @param address - dYdX address
 * @param subaccountNumber - Subaccount number
 * @returns Subaccount ID string
 */
export declare function buildSubaccountId(address: string, subaccountNumber: number): string;
/**
 * Parse subaccount ID into components
 *
 * @param subaccountId - Subaccount ID string
 * @returns Object with address and subaccountNumber
 */
export declare function parseSubaccountId(subaccountId: string): {
    address: string;
    subaccountNumber: number;
};
/**
 * Build query string from parameters
 *
 * @param params - Query parameters object
 * @returns Query string (without leading ?)
 */
export declare function buildQueryString(params: Record<string, string | number | boolean | undefined>): string;
/**
 * Build URL with query parameters
 *
 * @param baseUrl - Base URL
 * @param path - Path to append
 * @param params - Query parameters
 * @returns Full URL string
 */
export declare function buildUrl(baseUrl: string, path: string, params?: Record<string, string | number | boolean | undefined>): string;
//# sourceMappingURL=utils.d.ts.map
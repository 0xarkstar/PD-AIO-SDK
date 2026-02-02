/**
 * Extended Utility Functions
 *
 * Helper functions for Extended adapter
 */
import type { OrderRequest } from '../../types/common.js';
import type { ExtendedOrderRequest } from './types.js';
import { PerpDEXError } from '../../types/errors.js';
/**
 * Convert unified order request to Extended format
 */
export declare function convertOrderRequest(request: OrderRequest): ExtendedOrderRequest;
/**
 * Map error from Extended API
 */
export declare function mapError(error: any): PerpDEXError;
/**
 * Count decimal places in a number string
 */
export declare function countDecimals(value: string | number): number;
/**
 * Format symbol for Extended API
 * Handles multiple possible formats
 */
export declare function formatSymbolForAPI(unifiedSymbol: string): string;
/**
 * Parse symbol from Extended format
 * Converts various Extended formats to unified format
 */
export declare function parseSymbolFromAPI(extendedSymbol: string): string;
/**
 * Validate order request parameters
 */
export declare function validateOrderRequest(request: OrderRequest): void;
/**
 * Validate leverage value
 */
export declare function validateLeverage(leverage: number): void;
/**
 * Generate a unique client order ID
 */
export declare function generateClientOrderId(): string;
/**
 * Format price with correct precision
 */
export declare function formatPrice(price: number, precision: number): string;
/**
 * Format quantity with correct precision
 */
export declare function formatQuantity(quantity: number, precision: number): string;
/**
 * Safely parse a numeric string value
 */
export declare function safeParseFloat(value: string | number | undefined): number;
/**
 * Calculate liquidation price for a position
 * This is a simplified calculation - actual liquidation price depends on
 * exchange's specific margin requirements and maintenance margin ratio
 */
export declare function calculateLiquidationPrice(side: 'long' | 'short', entryPrice: number, leverage: number, maintenanceMarginRatio?: number): number;
/**
 * Calculate margin required for a position
 */
export declare function calculateRequiredMargin(quantity: number, price: number, leverage: number): number;
/**
 * Calculate unrealized PnL for a position
 */
export declare function calculateUnrealizedPnl(side: 'long' | 'short', size: number, entryPrice: number, markPrice: number): number;
/**
 * Format StarkNet address (ensure 0x prefix and lowercase)
 */
export declare function formatStarkNetAddress(address: string): string;
/**
 * Validate StarkNet address format
 */
export declare function isValidStarkNetAddress(address: string): boolean;
/**
 * Convert timestamp to Extended API format (if needed)
 */
export declare function formatTimestamp(timestamp: number): number;
/**
 * Parse timestamp from Extended API format
 */
export declare function parseTimestamp(timestamp: number): number;
//# sourceMappingURL=utils.d.ts.map
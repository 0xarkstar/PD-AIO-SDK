/**
 * Variational Utility Functions
 *
 * Helper functions for Variational adapter
 */
import type { OrderRequest } from '../../types/common.js';
import type { VariationalOrderRequest } from './types.js';
import { PerpDEXError } from '../../types/errors.js';
/**
 * Convert unified order request to Variational format
 */
export declare function convertOrderRequest(request: OrderRequest): VariationalOrderRequest;
/**
 * Map error from Variational API
 */
export declare function mapError(error: any): PerpDEXError;
/**
 * Count decimal places in a number string
 */
export declare function countDecimals(value: string): number;
/**
 * Format symbol for Variational API
 * Converts "BTC/USDT:USDT" to "BTC-USDT-PERP"
 */
export declare function formatSymbolForAPI(unifiedSymbol: string): string;
/**
 * Parse symbol from Variational format
 * Converts "BTC-USDT-PERP" to "BTC/USDT:USDT"
 */
export declare function parseSymbolFromAPI(variationalSymbol: string): string;
/**
 * Validate order request parameters
 */
export declare function validateOrderRequest(request: OrderRequest): void;
/**
 * Generate a unique client order ID
 */
export declare function generateClientOrderId(): string;
/**
 * Check if quote has expired
 */
export declare function isQuoteExpired(expiresAt: number): boolean;
/**
 * Calculate time until quote expiration (in milliseconds)
 */
export declare function getQuoteTimeRemaining(expiresAt: number): number;
/**
 * Format price with correct precision
 */
export declare function formatPrice(price: number, tickSize: string): string;
/**
 * Format amount with correct precision
 */
export declare function formatAmount(amount: number, minOrderSize: string): string;
/**
 * Safely parse a numeric string value
 */
export declare function safeParseFloat(value: string | number | undefined): number;
//# sourceMappingURL=utils.d.ts.map
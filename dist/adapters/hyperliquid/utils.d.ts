/**
 * Hyperliquid Utility Functions
 *
 * Helper functions for order conversion and error mapping.
 * Normalization functions have been moved to HyperliquidNormalizer.ts
 */
import { PerpDEXError } from '../../types/errors.js';
import type { OrderRequest } from '../../types/index.js';
import type { HyperliquidOrderRequest } from './types.js';
/**
 * Convert unified order request to Hyperliquid format
 *
 * This is a conversion utility, not a normalization function.
 * It transforms outgoing order requests from unified format to Hyperliquid's API format.
 *
 * @param request - Unified order request
 * @param exchangeSymbol - Hyperliquid symbol (e.g., "BTC-PERP")
 * @returns Hyperliquid order request
 */
export declare function convertOrderRequest(request: OrderRequest, exchangeSymbol: string): HyperliquidOrderRequest;
/**
 * Map Hyperliquid errors to unified error types
 *
 * @param error - Error from Hyperliquid API
 * @returns Unified PerpDEXError
 */
export declare function mapError(error: unknown): PerpDEXError;
//# sourceMappingURL=utils.d.ts.map
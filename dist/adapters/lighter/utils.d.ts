/**
 * Lighter Utility Functions
 *
 * Helper functions for order conversion and error mapping.
 * Normalization functions have been moved to LighterNormalizer.ts
 */
import type { OrderRequest } from '../../types/common.js';
import { PerpDEXError } from '../../types/errors.js';
/**
 * Convert unified order request to Lighter format
 */
export declare function convertOrderRequest(request: OrderRequest, lighterSymbol: string): Record<string, unknown>;
/**
 * Map Lighter errors to unified error types
 */
export declare function mapError(error: unknown): PerpDEXError;
//# sourceMappingURL=utils.d.ts.map
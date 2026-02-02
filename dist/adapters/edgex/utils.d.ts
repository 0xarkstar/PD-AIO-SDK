/**
 * EdgeX Utility Functions
 *
 * Helper functions for order conversion and error mapping.
 * Normalization functions have been moved to EdgeXNormalizer.ts
 */
import type { OrderSide, OrderType, TimeInForce } from '../../types/common.js';
/**
 * Convert unified order type to EdgeX format
 */
export declare function toEdgeXOrderType(type: OrderType): string;
/**
 * Convert unified order side to EdgeX format
 */
export declare function toEdgeXOrderSide(side: OrderSide): string;
/**
 * Convert unified time in force to EdgeX format
 */
export declare function toEdgeXTimeInForce(tif?: TimeInForce): string;
/**
 * Map EdgeX error to unified error code
 */
export declare function mapEdgeXError(error: unknown): {
    code: string;
    message: string;
};
//# sourceMappingURL=utils.d.ts.map
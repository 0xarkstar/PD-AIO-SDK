/**
 * Backpack Utility Functions
 *
 * Helper functions for order conversion and error mapping.
 * Normalization functions have been moved to BackpackNormalizer.ts
 */
import type { OrderSide, OrderType, TimeInForce } from '../../types/common.js';
/**
 * Convert unified order type to Backpack format
 */
export declare function toBackpackOrderType(type: OrderType, postOnly?: boolean): string;
/**
 * Convert unified order side to Backpack format
 */
export declare function toBackpackOrderSide(side: OrderSide): string;
/**
 * Convert unified time in force to Backpack format
 */
export declare function toBackpackTimeInForce(tif?: TimeInForce, postOnly?: boolean): string;
/**
 * Map Backpack error to unified error code
 * @deprecated Use mapBackpackError from error-codes.ts instead
 */
export declare function mapBackpackError(error: unknown): {
    code: string;
    message: string;
};
//# sourceMappingURL=utils.d.ts.map
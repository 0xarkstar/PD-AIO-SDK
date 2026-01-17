/**
 * Backpack Utility Functions
 *
 * Helper functions for order conversion and error mapping.
 * Normalization functions have been moved to BackpackNormalizer.ts
 */

import type { OrderSide, OrderType, TimeInForce } from '../../types/common.js';
import {
  BACKPACK_ORDER_TYPES,
  BACKPACK_ORDER_SIDES,
  BACKPACK_TIME_IN_FORCE,
} from './constants.js';

/**
 * Convert unified order type to Backpack format
 */
export function toBackpackOrderType(type: OrderType, postOnly?: boolean): string {
  if (type === 'market') {
    return BACKPACK_ORDER_TYPES.market;
  }

  if (postOnly) {
    return BACKPACK_ORDER_TYPES.postOnly;
  }

  return BACKPACK_ORDER_TYPES.limit;
}

/**
 * Convert unified order side to Backpack format
 */
export function toBackpackOrderSide(side: OrderSide): string {
  return side === 'buy' ? BACKPACK_ORDER_SIDES.buy : BACKPACK_ORDER_SIDES.sell;
}

/**
 * Convert unified time in force to Backpack format
 */
export function toBackpackTimeInForce(tif?: TimeInForce, postOnly?: boolean): string {
  if (postOnly) {
    return BACKPACK_TIME_IN_FORCE.POST_ONLY;
  }

  switch (tif) {
    case 'IOC':
      return BACKPACK_TIME_IN_FORCE.IOC;
    case 'FOK':
      return BACKPACK_TIME_IN_FORCE.FOK;
    case 'PO':
      return BACKPACK_TIME_IN_FORCE.POST_ONLY;
    case 'GTC':
    default:
      return BACKPACK_TIME_IN_FORCE.GTC;
  }
}

/**
 * Map Backpack error to unified error code
 * @deprecated Use mapBackpackError from error-codes.ts instead
 */
export function mapBackpackError(error: unknown): { code: string; message: string } {
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: number; message?: string };

    switch (err.code) {
      case 1001:
        return { code: 'INVALID_ORDER', message: 'Invalid order parameters' };
      case 1002:
        return { code: 'INSUFFICIENT_MARGIN', message: 'Insufficient margin' };
      case 1003:
        return { code: 'ORDER_NOT_FOUND', message: 'Order not found' };
      case 1004:
        return { code: 'POSITION_NOT_FOUND', message: 'Position not found' };
      case 2001:
        return { code: 'INVALID_SIGNATURE', message: 'Invalid signature' };
      case 2002:
        return { code: 'EXPIRED_AUTH', message: 'Authentication expired' };
      case 2003:
        return { code: 'INVALID_API_KEY', message: 'Invalid API key' };
      case 4001:
        return { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded' };
      case 5001:
        return { code: 'EXCHANGE_UNAVAILABLE', message: 'Exchange unavailable' };
      default:
        return {
          code: 'UNKNOWN_ERROR',
          message: (err.message as string | undefined) ?? 'Unknown error occurred',
        };
    }
  }

  return { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' };
}

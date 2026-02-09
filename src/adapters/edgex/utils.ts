/**
 * EdgeX Utility Functions
 *
 * Helper functions for order conversion and error mapping.
 * Normalization functions have been moved to EdgeXNormalizer.ts
 */

import type { OrderSide, OrderType, TimeInForce } from '../../types/common.js';
import { EDGEX_ORDER_TYPES, EDGEX_ORDER_SIDES, EDGEX_TIME_IN_FORCE } from './constants.js';

/**
 * Convert unified order type to EdgeX format
 */
export function toEdgeXOrderType(type: OrderType): string {
  return type === 'market' ? EDGEX_ORDER_TYPES.market : EDGEX_ORDER_TYPES.limit;
}

/**
 * Convert unified order side to EdgeX format
 */
export function toEdgeXOrderSide(side: OrderSide): string {
  return side === 'buy' ? EDGEX_ORDER_SIDES.buy : EDGEX_ORDER_SIDES.sell;
}

/**
 * Convert unified time in force to EdgeX format
 */
export function toEdgeXTimeInForce(tif?: TimeInForce): string {
  switch (tif) {
    case 'IOC':
      return EDGEX_TIME_IN_FORCE.IOC;
    case 'FOK':
      return EDGEX_TIME_IN_FORCE.FOK;
    case 'GTC':
    default:
      return EDGEX_TIME_IN_FORCE.GTC;
  }
}

/**
 * Map EdgeX error to unified error code
 */
export function mapEdgeXError(error: unknown): { code: string; message: string } {
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
          message: err.message ?? 'Unknown error occurred',
        };
    }
  }

  return { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' };
}

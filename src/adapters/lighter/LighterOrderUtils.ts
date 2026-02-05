/**
 * Lighter Order Utilities
 *
 * Pure utility functions for order building and conversion.
 * Extracted from LighterAdapter to improve modularity.
 */

import type { OrderRequest } from '../../types/common.js';
import { OrderType, TimeInForce } from './signer/index.js';

/**
 * Convert amount to base units (integer representation)
 *
 * @param amount - Human-readable amount
 * @param decimals - Number of decimal places
 * @returns BigInt representation
 */
export function toBaseUnits(amount: number, decimals: number): bigint {
  const factor = 10 ** decimals;
  return BigInt(Math.round(amount * factor));
}

/**
 * Convert price to price units (tick-adjusted)
 *
 * @param price - Human-readable price
 * @param tickSize - Minimum price increment
 * @returns Tick-adjusted price
 */
export function toPriceUnits(price: number, tickSize: number): number {
  return Math.round(price / tickSize);
}

/**
 * Convert price from tick units back to human-readable
 *
 * @param priceUnits - Price in tick units
 * @param tickSize - Minimum price increment
 * @returns Human-readable price
 */
export function fromPriceUnits(priceUnits: number, tickSize: number): number {
  return priceUnits * tickSize;
}

/**
 * Convert amount from base units back to human-readable
 *
 * @param baseUnits - Amount in base units
 * @param decimals - Number of decimal places
 * @returns Human-readable amount
 */
export function fromBaseUnits(baseUnits: bigint | number, decimals: number): number {
  const factor = 10 ** decimals;
  return Number(baseUnits) / factor;
}

/**
 * Map unified order type string to Lighter OrderType enum
 *
 * @param type - Unified order type string
 * @returns Lighter OrderType enum value
 */
export function mapOrderType(type: string): OrderType {
  switch (type.toLowerCase()) {
    case 'limit':
      return OrderType.LIMIT;
    case 'market':
      return OrderType.MARKET;
    case 'stop_limit':
    case 'stop-limit':
    case 'stoplimit':
      return OrderType.STOP_LIMIT;
    case 'stop_market':
    case 'stop-market':
    case 'stopmarket':
      return OrderType.STOP_MARKET;
    default:
      return OrderType.LIMIT;
  }
}

/**
 * Map Lighter OrderType enum to unified string
 *
 * @param type - Lighter OrderType enum value
 * @returns Unified order type string
 */
export function mapOrderTypeToString(type: OrderType): string {
  switch (type) {
    case OrderType.LIMIT:
      return 'limit';
    case OrderType.MARKET:
      return 'market';
    case OrderType.STOP_LIMIT:
      return 'stopLimit';
    case OrderType.STOP_MARKET:
      return 'stopMarket';
    default:
      return 'limit';
  }
}

/**
 * Map unified time in force string to Lighter TimeInForce enum
 *
 * @param tif - Unified time in force string
 * @param postOnly - Whether order is post-only
 * @returns Lighter TimeInForce enum value
 */
export function mapTimeInForce(tif?: string, postOnly?: boolean): TimeInForce {
  if (postOnly) {
    return TimeInForce.POST_ONLY;
  }

  switch (tif?.toUpperCase()) {
    case 'IOC':
      return TimeInForce.IOC;
    case 'FOK':
      return TimeInForce.FOK;
    case 'PO':
    case 'POST_ONLY':
    case 'POSTONLY':
      return TimeInForce.POST_ONLY;
    case 'GTC':
    default:
      return TimeInForce.GTC;
  }
}

/**
 * Map Lighter TimeInForce enum to unified string
 *
 * @param tif - Lighter TimeInForce enum value
 * @returns Unified time in force string
 */
export function mapTimeInForceToString(tif: TimeInForce): string {
  switch (tif) {
    case TimeInForce.IOC:
      return 'IOC';
    case TimeInForce.FOK:
      return 'FOK';
    case TimeInForce.POST_ONLY:
      return 'PO';
    case TimeInForce.GTC:
    default:
      return 'GTC';
  }
}

/**
 * Convert unified order request to Lighter format (for HMAC mode)
 *
 * @param request - Unified OrderRequest
 * @param lighterSymbol - Lighter-native symbol
 * @returns Lighter order format
 */
export function convertOrderRequest(
  request: OrderRequest,
  lighterSymbol: string
): Record<string, unknown> {
  const order: Record<string, unknown> = {
    symbol: lighterSymbol,
    side: request.side,
    type: request.type,
    quantity: request.amount,
  };

  if (request.price !== undefined) {
    order.price = request.price;
  }

  if (request.clientOrderId) {
    order.clientOrderId = request.clientOrderId;
  }

  if (request.reduceOnly) {
    order.reduceOnly = true;
  }

  if (request.postOnly) {
    order.timeInForce = 'PO';
  } else if (request.timeInForce) {
    order.timeInForce = request.timeInForce;
  }

  return order;
}

/**
 * Map order side to Lighter side value
 *
 * @param side - Unified side ('buy' | 'sell')
 * @returns Lighter side value (1 = buy, 2 = sell)
 */
export function mapSideToLighter(side: 'buy' | 'sell'): number {
  return side === 'buy' ? 1 : 2;
}

/**
 * Map Lighter side value to unified side
 *
 * @param side - Lighter side value (1 = buy, 2 = sell)
 * @returns Unified side ('buy' | 'sell')
 */
export function mapSideFromLighter(side: number): 'buy' | 'sell' {
  return side === 1 ? 'buy' : 'sell';
}

/**
 * Calculate order expiration timestamp
 *
 * @param ttlSeconds - Time to live in seconds (0 = no expiry)
 * @returns Expiration timestamp in milliseconds
 */
export function calculateExpiration(ttlSeconds: number = 0): number {
  if (ttlSeconds <= 0) {
    // No expiration - use max safe integer
    return Number.MAX_SAFE_INTEGER;
  }
  return Date.now() + ttlSeconds * 1000;
}

/**
 * Validate order parameters
 *
 * @param request - Order request to validate
 * @throws Error if validation fails
 */
export function validateLighterOrder(request: OrderRequest): void {
  if (!request.symbol) {
    throw new Error('Order symbol is required');
  }

  if (!request.side || !['buy', 'sell'].includes(request.side)) {
    throw new Error('Order side must be "buy" or "sell"');
  }

  if (!request.amount || request.amount <= 0) {
    throw new Error('Order amount must be positive');
  }

  if (request.type === 'limit' && (!request.price || request.price <= 0)) {
    throw new Error('Limit order requires a positive price');
  }
}

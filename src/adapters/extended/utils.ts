/**
 * Extended Utility Functions
 *
 * Helper functions for Extended adapter
 */

import type { OrderRequest, PriceLevel } from '../../types/common.js';
import type { ExtendedOrderRequest, ExtendedWSOrderBookFrame } from './types.js';
import { PerpDEXError, NetworkError } from '../../types/errors.js';
import { mapExtendedError, mapHTTPError, extractErrorCode } from './error-codes.js';
import { EXTENDED_LEVERAGE_TIERS } from './constants.js';

/**
 * Convert unified order request to Extended format
 */
export function convertOrderRequest(request: OrderRequest): ExtendedOrderRequest {
  return {
    symbol: request.symbol,
    type: request.type as 'market' | 'limit' | 'stop' | 'stop_limit',
    side: request.side,
    quantity: request.amount.toString(),
    price: request.price?.toString(),
    stopPrice: request.stopPrice?.toString(),
    clientOrderId: request.clientOrderId,
    postOnly: request.postOnly,
    reduceOnly: request.reduceOnly,
    timeInForce: request.timeInForce as 'GTC' | 'IOC' | 'FOK' | undefined,
  };
}

/**
 * Map error from Extended API
 */
export function mapError(error: any): PerpDEXError {
  if (error instanceof PerpDEXError) {
    return error;
  }

  // Handle HTTP response errors
  if (error?.response?.status) {
    const status = error.response.status;
    const body = error.response.data;
    return mapHTTPError(status, body);
  }

  // Handle network errors (ETIMEDOUT, ECONNREFUSED, etc.)
  if (error?.code && typeof error.code === 'string' && error.code.startsWith('E')) {
    const originalMessage = error.message || 'Network error';
    const message = originalMessage.toLowerCase().includes('network')
      ? originalMessage
      : `network error: ${originalMessage}`;
    return new NetworkError(message, 'NETWORK_ERROR', 'extended', { originalError: error });
  }

  // Handle generic errors
  const message = error?.message || error?.error || String(error);
  const code = extractErrorCode(message);
  const context = {
    originalError: error,
  };

  return mapExtendedError(code, message, context);
}

/**
 * Count decimal places in a number string
 */
export function countDecimals(value: string | number): number {
  const strValue = String(value);
  if (!strValue.includes('.')) {
    return 0;
  }
  return strValue.split('.')[1]?.length || 0;
}

/**
 * Format symbol for Extended API
 * Handles multiple possible formats
 */
export function formatSymbolForAPI(unifiedSymbol: string): string {
  const [pair] = unifiedSymbol.split(':');
  if (!pair) {
    return unifiedSymbol;
  }

  const [base, quote] = pair.split('/');
  if (!base || !quote) {
    return unifiedSymbol;
  }

  // Extended uses format like "BTC-USD-PERP" or "BTCUSD"
  // Check API docs for exact format - assuming "BTC-USD-PERP" for now
  return `${base}-${quote}-PERP`;
}

/**
 * Parse symbol from Extended format
 * Converts various Extended formats to unified format
 */
export function parseSymbolFromAPI(extendedSymbol: string): string {
  // Handle "BTC-USD-PERP" format
  if (extendedSymbol.includes('-')) {
    const parts = extendedSymbol.split('-');
    if (parts.length >= 2) {
      const [base, quote] = parts;
      return `${base}/${quote}:${quote}`;
    }
  }

  // Handle "BTCUSD" format
  const match = extendedSymbol.match(/^([A-Z]+)(USD|USDT|USDC)$/);
  if (match) {
    const [, base, quote] = match;
    return `${base}/${quote}:${quote}`;
  }

  return extendedSymbol;
}

/**
 * Validate order request parameters
 */
export function validateOrderRequest(request: OrderRequest): void {
  if (!request.symbol) {
    throw new PerpDEXError('Symbol is required', 'INVALID_SYMBOL', 'extended');
  }

  if (!request.type) {
    throw new PerpDEXError('Order type is required', 'INVALID_ORDER_TYPE', 'extended');
  }

  if (!request.side) {
    throw new PerpDEXError('Order side is required', 'INVALID_ORDER_SIDE', 'extended');
  }

  if (!request.amount || request.amount <= 0) {
    throw new PerpDEXError('Quantity must be greater than 0', 'INVALID_QUANTITY', 'extended');
  }

  if (
    (request.type === 'limit' || request.type === 'stopLimit') &&
    (!request.price || request.price <= 0)
  ) {
    throw new PerpDEXError('Price is required for limit orders', 'INVALID_PRICE', 'extended');
  }

  if (
    (request.type === 'stopMarket' || request.type === 'stopLimit') &&
    (!request.stopPrice || request.stopPrice <= 0)
  ) {
    throw new PerpDEXError(
      'Stop price is required for stop orders',
      'INVALID_STOP_PRICE',
      'extended'
    );
  }
}

/**
 * Validate leverage value
 */
export function validateLeverage(leverage: number): void {
  if (!Number.isInteger(leverage)) {
    throw new PerpDEXError('Leverage must be an integer', 'INVALID_LEVERAGE', 'extended');
  }

  if (leverage < EXTENDED_LEVERAGE_TIERS.MIN || leverage > EXTENDED_LEVERAGE_TIERS.MAX) {
    throw new PerpDEXError(
      `Leverage must be between ${EXTENDED_LEVERAGE_TIERS.MIN}x and ${EXTENDED_LEVERAGE_TIERS.MAX}x`,
      'INVALID_LEVERAGE',
      'extended'
    );
  }
}

/**
 * Generate a unique client order ID
 */
export function generateClientOrderId(): string {
  return `ext_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Format price with correct precision
 */
export function formatPrice(price: number, precision: number): string {
  return price.toFixed(precision);
}

/**
 * Format quantity with correct precision
 */
export function formatQuantity(quantity: number, precision: number): string {
  return quantity.toFixed(precision);
}

/**
 * Safely parse a numeric string value
 */
export function safeParseFloat(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate liquidation price for a position
 * This is a simplified calculation - actual liquidation price depends on
 * exchange's specific margin requirements and maintenance margin ratio
 */
export function calculateLiquidationPrice(
  side: 'long' | 'short',
  entryPrice: number,
  leverage: number,
  maintenanceMarginRatio: number = 0.005 // 0.5% default
): number {
  if (side === 'long') {
    // Long liquidation: entry * (1 - 1/leverage + maintenanceMarginRatio)
    return entryPrice * (1 - 1 / leverage + maintenanceMarginRatio);
  } else {
    // Short liquidation: entry * (1 + 1/leverage - maintenanceMarginRatio)
    return entryPrice * (1 + 1 / leverage - maintenanceMarginRatio);
  }
}

/**
 * Calculate margin required for a position
 */
export function calculateRequiredMargin(quantity: number, price: number, leverage: number): number {
  const positionValue = quantity * price;
  return positionValue / leverage;
}

/**
 * Calculate unrealized PnL for a position
 */
export function calculateUnrealizedPnl(
  side: 'long' | 'short',
  size: number,
  entryPrice: number,
  markPrice: number
): number {
  if (side === 'long') {
    return size * (markPrice - entryPrice);
  } else {
    return size * (entryPrice - markPrice);
  }
}

/**
 * Format StarkNet address (ensure 0x prefix and lowercase)
 */
export function formatStarkNetAddress(address: string): string {
  const formatted = address.toLowerCase();
  return formatted.startsWith('0x') ? formatted : `0x${formatted}`;
}

/**
 * Validate StarkNet address format
 */
export function isValidStarkNetAddress(address: string): boolean {
  // StarkNet addresses are felt252 values (up to 63 hex chars)
  // Require minimum 4 hex characters as sanity check
  const hexPattern = /^0x[0-9a-fA-F]{4,64}$/;
  return hexPattern.test(address);
}

/**
 * Convert timestamp to Extended API format (if needed)
 */
export function formatTimestamp(timestamp: number): number {
  // Extended API may use seconds or milliseconds - adjust if needed
  return timestamp;
}

/**
 * Parse timestamp from Extended API format
 */
export function parseTimestamp(timestamp: number): number {
  // Convert to milliseconds if API returns seconds
  return timestamp > 10000000000 ? timestamp : timestamp * 1000;
}

/**
 * Stateful WS order book for one Extended stream (live protocol 2026-06-11)
 *
 * The orderbooks stream has NO snapshot-only full-depth channel: the first
 * frame per connection is a full SNAPSHOT, every subsequent frame a DELTA
 * that is NOT self-contained. This class maintains the book so a FULL
 * unified snapshot can be emitted per frame.
 *
 * - SNAPSHOT (incl. depth=1 BBO frames, d:"1") fully REPLACES the book —
 *   this is also what makes reconnect rebuilds work (fresh connection ⇒
 *   fresh SNAPSHOT, seq resets to 1).
 * - DELTA apply rule: level qty := parseFloat(c) (the new ABSOLUTE qty);
 *   DELETE the level when c == "0". `q` (signed change) is informational.
 */
export class ExtendedOrderBookState {
  // Keys are NUMERIC prices: the live wire mixes string representations of
  // the same price ("61979.0" in the SNAPSHOT vs "61979" in DELTAs,
  // "61975.000000" elsewhere) — string keys would split one level in two.
  private readonly bids = new Map<number, number>();
  private readonly asks = new Map<number, number>();

  apply(frame: ExtendedWSOrderBookFrame): void {
    if (frame.type === 'SNAPSHOT') {
      this.bids.clear();
      this.asks.clear();
      for (const level of frame.data.b) {
        this.bids.set(safeParseFloat(level.p), safeParseFloat(level.q));
      }
      for (const level of frame.data.a) {
        this.asks.set(safeParseFloat(level.p), safeParseFloat(level.q));
      }
      return;
    }

    applyDeltaLevels(this.bids, frame.data.b);
    applyDeltaLevels(this.asks, frame.data.a);
  }

  /** Full maintained book as unified levels: bids DESC, asks ASC */
  sides(): { bids: PriceLevel[]; asks: PriceLevel[] } {
    const toLevels = (side: Map<number, number>): PriceLevel[] =>
      Array.from(side.entries(), ([price, qty]): PriceLevel => [price, qty]);

    return {
      bids: toLevels(this.bids).sort((a, b) => b[0] - a[0]),
      asks: toLevels(this.asks).sort((a, b) => a[0] - b[0]),
    };
  }
}

function applyDeltaLevels(
  side: Map<number, number>,
  levels: ReadonlyArray<{ p: string; c: string }>
): void {
  for (const level of levels) {
    const price = safeParseFloat(level.p);
    const qty = safeParseFloat(level.c);
    if (qty === 0) {
      side.delete(price);
    } else {
      side.set(price, qty);
    }
  }
}

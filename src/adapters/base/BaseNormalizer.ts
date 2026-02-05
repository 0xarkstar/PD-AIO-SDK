/**
 * Base Normalizer Utilities
 *
 * Common utility functions for data normalization across all exchange adapters.
 * Provides standardized parsing, formatting, and mapping functions.
 */

import type { OrderSide, OrderStatus, OrderType, TimeInForce } from '../../types/common.js';

// =============================================================================
// Numeric Parsing
// =============================================================================

/**
 * Safely parse a numeric string to number
 *
 * @param value - Value to parse (string, number, null, undefined)
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed number or default value
 *
 * @example
 * ```typescript
 * parseDecimal('123.45');      // 123.45
 * parseDecimal('invalid');     // 0
 * parseDecimal(null, -1);      // -1
 * parseDecimal(undefined);     // 0
 * ```
 */
export function parseDecimal(
  value: string | number | null | undefined,
  defaultValue: number = 0
): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : value;
  }

  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely parse a numeric string to bigint
 *
 * @param value - Value to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed bigint or default value
 */
export function parseBigInt(
  value: string | number | bigint | null | undefined,
  defaultValue: bigint = BigInt(0)
): bigint {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  try {
    return BigInt(value);
  } catch {
    return defaultValue;
  }
}

/**
 * Parse a string that may have x18 format (18 decimal places)
 *
 * @param value - Value in x18 format (e.g., "1000000000000000000" = 1.0)
 * @param decimals - Number of decimal places (default: 18)
 * @returns Parsed number
 */
export function parseX18(
  value: string | number | null | undefined,
  decimals: number = 18
): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const bigValue = typeof value === 'string' ? BigInt(value) : BigInt(Math.floor(Number(value)));
  const divisor = BigInt(10 ** decimals);

  // Integer part
  const intPart = bigValue / divisor;
  // Fractional part
  const fracPart = bigValue % divisor;

  // Combine for full precision
  return Number(intPart) + Number(fracPart) / Number(divisor);
}

/**
 * Format a number to x18 format string
 *
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 18)
 * @returns Formatted x18 string
 */
export function formatX18(value: number, decimals: number = 18): string {
  const multiplier = BigInt(10 ** decimals);
  const bigValue = BigInt(Math.floor(value * Number(multiplier)));
  return bigValue.toString();
}

// =============================================================================
// Symbol Formatting
// =============================================================================

/**
 * Build a CCXT-style unified symbol
 *
 * @param base - Base currency (e.g., "BTC")
 * @param quote - Quote currency (e.g., "USDT")
 * @param settle - Settlement currency (e.g., "USDT") for perpetuals
 * @returns Unified symbol (e.g., "BTC/USDT:USDT")
 */
export function buildUnifiedSymbol(base: string, quote: string, settle?: string): string {
  if (settle) {
    return `${base}/${quote}:${settle}`;
  }
  return `${base}/${quote}`;
}

/**
 * Parse a CCXT-style unified symbol
 *
 * @param symbol - Unified symbol (e.g., "BTC/USDT:USDT")
 * @returns Parsed symbol parts
 */
export function parseUnifiedSymbol(symbol: string): {
  base: string;
  quote: string;
  settle?: string;
  isPerp: boolean;
} {
  const [pair, settle] = symbol.split(':');
  const pairStr = pair || '';
  const [base, quote] = pairStr.split('/');

  return {
    base: base || '',
    quote: quote || '',
    settle: settle || undefined,
    isPerp: !!settle,
  };
}

/**
 * Convert perpetual symbol format
 *
 * @param symbol - Exchange-specific symbol (e.g., "BTC-PERP", "BTCUSD_PERP")
 * @param patterns - Regex patterns to match
 * @returns Base currency extracted from symbol
 */
export function extractBaseFromPerpSymbol(symbol: string): string {
  // Common patterns: BTC-PERP, BTCUSD_PERP, BTC_USDT_Perp, BTC-USD-PERP
  const patterns = [
    /^([A-Z0-9]+)-(?:USD-)?PERP$/i,      // BTC-PERP, BTC-USD-PERP
    /^([A-Z0-9]+)USD_PERP$/i,            // BTCUSD_PERP
    /^([A-Z0-9]+)_USDT?_Perp$/i,         // BTC_USDT_Perp
    /^([A-Z0-9]+)USDT?$/i,               // BTCUSDT
  ];

  for (const pattern of patterns) {
    const match = symbol.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Fallback: return first part before any delimiter
  const parts = symbol.split(/[-_/]/);
  return parts[0] || symbol;
}

// =============================================================================
// Status Mapping
// =============================================================================

/**
 * Common order status mappings from exchange-specific to unified format
 */
export const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  // Common statuses
  'open': 'open',
  'new': 'open',
  'pending': 'open',
  'active': 'open',

  // Partial fills
  'partial': 'open',
  'partially_filled': 'open',
  'partiallyFilled': 'open',

  // Filled
  'filled': 'closed',
  'closed': 'closed',
  'done': 'closed',
  'executed': 'closed',

  // Canceled
  'canceled': 'canceled',
  'cancelled': 'canceled',
  'cancel': 'canceled',

  // Expired
  'expired': 'expired',

  // Rejected
  'rejected': 'rejected',
  'failed': 'rejected',
};

/**
 * Map exchange order status to unified format
 *
 * @param status - Exchange-specific status
 * @param defaultStatus - Default status if not found
 * @returns Unified order status
 */
export function mapOrderStatus(
  status: string,
  defaultStatus: OrderStatus = 'open'
): OrderStatus {
  const normalized = status.toLowerCase().replace(/[^a-z_]/g, '');
  return ORDER_STATUS_MAP[normalized] || defaultStatus;
}

/**
 * Common order type mappings
 */
export const ORDER_TYPE_MAP: Record<string, OrderType> = {
  'limit': 'limit',
  'market': 'market',
  'stop': 'stopMarket',
  'stop_market': 'stopMarket',
  'stopmarket': 'stopMarket',
  'stop_loss': 'stopMarket',
  'stoploss': 'stopMarket',
  'stop_limit': 'stopLimit',
  'stoplimit': 'stopLimit',
  'take_profit': 'takeProfit',
  'takeprofit': 'takeProfit',
  'trailing_stop': 'trailingStop',
  'trailingstop': 'trailingStop',
};

/**
 * Map exchange order type to unified format
 */
export function mapOrderType(type: string, defaultType: OrderType = 'limit'): OrderType {
  const normalized = type.toLowerCase().replace(/[^a-z_]/g, '');
  return ORDER_TYPE_MAP[normalized] || defaultType;
}

/**
 * Map order side from various formats
 */
export function mapOrderSide(side: string | number): OrderSide {
  if (typeof side === 'number') {
    return side === 1 || side === 0 ? 'buy' : 'sell';
  }
  const normalized = side.toLowerCase();
  return normalized === 'buy' || normalized === 'long' || normalized === 'bid' ? 'buy' : 'sell';
}

/**
 * Map time in force from various formats
 */
export function mapTimeInForce(tif: string | undefined): TimeInForce {
  if (!tif) return 'GTC';

  const normalized = tif.toUpperCase();
  switch (normalized) {
    case 'GTC':
    case 'GOOD_TIL_CANCEL':
      return 'GTC';
    case 'IOC':
    case 'IMMEDIATE_OR_CANCEL':
      return 'IOC';
    case 'FOK':
    case 'FILL_OR_KILL':
      return 'FOK';
    case 'PO':
    case 'POST_ONLY':
    case 'MAKER_ONLY':
      return 'PO';
    default:
      return 'GTC';
  }
}

// =============================================================================
// Timestamp Utilities
// =============================================================================

/**
 * Normalize timestamp to milliseconds
 *
 * @param timestamp - Timestamp in various formats (seconds, milliseconds, ISO string)
 * @returns Timestamp in milliseconds
 */
export function normalizeTimestamp(
  timestamp: number | string | Date | null | undefined
): number {
  if (timestamp === null || timestamp === undefined) {
    return Date.now();
  }

  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }

  if (typeof timestamp === 'string') {
    // ISO string
    const parsed = Date.parse(timestamp);
    return isNaN(parsed) ? Date.now() : parsed;
  }

  // If timestamp is less than year 2000 in ms, assume it's in seconds
  if (timestamp < 946684800000) {
    return timestamp * 1000;
  }

  return timestamp;
}

/**
 * Format timestamp to ISO string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

// =============================================================================
// Precision Utilities
// =============================================================================

/**
 * Round a number to specified decimal places
 *
 * @param value - Value to round
 * @param decimals - Number of decimal places
 * @returns Rounded value
 */
export function roundToDecimals(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Round price to tick size
 *
 * @param price - Price to round
 * @param tickSize - Minimum price increment
 * @returns Rounded price
 */
export function roundToTickSize(price: number, tickSize: number): number {
  return Math.round(price / tickSize) * tickSize;
}

/**
 * Round amount to step size
 *
 * @param amount - Amount to round
 * @param stepSize - Minimum amount increment
 * @returns Rounded amount
 */
export function roundToStepSize(amount: number, stepSize: number): number {
  return Math.floor(amount / stepSize) * stepSize;
}

/**
 * Get number of decimal places from precision value
 *
 * @param precision - Precision value (e.g., 0.001)
 * @returns Number of decimal places (e.g., 3)
 */
export function getDecimalPlaces(precision: number): number {
  if (precision >= 1) return 0;
  return Math.ceil(-Math.log10(precision));
}

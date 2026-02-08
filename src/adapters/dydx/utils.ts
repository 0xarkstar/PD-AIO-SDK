/**
 * dYdX v4 Utility Functions
 *
 * Helper functions for request conversion and data handling.
 */

import type { OrderRequest, OHLCVTimeframe } from '../../types/index.js';
import { unifiedToDydx } from './constants.js';
import type { DydxPlaceOrderParams } from './types.js';

// =============================================================================
// Order Request Conversion
// =============================================================================

/**
 * Convert unified order request to dYdX format
 *
 * This is a conversion utility for building order parameters
 * that can be used with the dYdX client SDK.
 *
 * @param request - Unified order request
 * @param subaccountNumber - The subaccount number to use
 * @returns dYdX order parameters
 */
export function convertOrderRequest(
  request: OrderRequest,
  subaccountNumber: number
): DydxPlaceOrderParams {
  const marketId = unifiedToDydx(request.symbol);

  // Map order type
  let type: DydxPlaceOrderParams['type'] = 'LIMIT';
  if (request.type === 'market') {
    type = 'MARKET';
  } else if (request.type === 'stopLimit') {
    type = 'STOP_LIMIT';
  } else if (request.type === 'stopMarket') {
    type = 'STOP_MARKET';
  }

  // Map time in force
  let timeInForce: DydxPlaceOrderParams['timeInForce'] = 'GTT';
  if (request.timeInForce === 'IOC') {
    timeInForce = 'IOC';
  } else if (request.timeInForce === 'FOK') {
    timeInForce = 'FOK';
  }

  // Determine execution type
  let execution: DydxPlaceOrderParams['execution'] = 'DEFAULT';
  if (request.postOnly) {
    execution = 'POST_ONLY';
  } else if (request.timeInForce === 'IOC') {
    execution = 'IOC';
  } else if (request.timeInForce === 'FOK') {
    execution = 'FOK';
  }

  const params: DydxPlaceOrderParams = {
    subaccountNumber,
    marketId,
    side: request.side === 'buy' ? 'BUY' : 'SELL',
    type,
    timeInForce,
    price: request.price?.toString() ?? '0',
    size: request.amount.toString(),
    postOnly: request.postOnly,
    reduceOnly: request.reduceOnly,
    execution,
  };

  // Add trigger price for stop orders
  if (request.stopPrice && (type === 'STOP_LIMIT' || type === 'STOP_MARKET')) {
    params.triggerPrice = request.stopPrice.toString();
  }

  // Add client ID if provided
  if (request.clientOrderId) {
    params.clientId = parseInt(request.clientOrderId, 10) || Date.now();
  }

  return params;
}

// =============================================================================
// OHLCV Timeframe Mapping
// =============================================================================

/**
 * dYdX candle resolutions
 */
export const DYDX_CANDLE_RESOLUTIONS = {
  '1m': '1MIN',
  '5m': '5MINS',
  '15m': '15MINS',
  '30m': '30MINS',
  '1h': '1HOUR',
  '4h': '4HOURS',
  '1d': '1DAY',
} as const;

/**
 * Map unified timeframe to dYdX resolution
 *
 * @param timeframe - Unified timeframe (e.g., '1h', '4h')
 * @returns dYdX resolution string
 */
export function mapTimeframeToDydx(timeframe: OHLCVTimeframe): string {
  const mapping: Partial<Record<OHLCVTimeframe, string>> = {
    '1m': '1MIN',
    '5m': '5MINS',
    '15m': '15MINS',
    '30m': '30MINS',
    '1h': '1HOUR',
    '4h': '4HOURS',
    '1d': '1DAY',
  };

  return mapping[timeframe] || '1HOUR';
}

/**
 * Get default duration for OHLCV data fetch based on timeframe
 *
 * @param timeframe - Unified timeframe
 * @returns Duration in milliseconds
 */
export function getDefaultOHLCVDuration(timeframe: OHLCVTimeframe): number {
  const durationMap: Partial<Record<OHLCVTimeframe, number>> = {
    '1m': 24 * 60 * 60 * 1000,         // 24 hours of 1m candles
    '5m': 5 * 24 * 60 * 60 * 1000,     // 5 days
    '15m': 7 * 24 * 60 * 60 * 1000,    // 7 days
    '30m': 14 * 24 * 60 * 60 * 1000,   // 14 days
    '1h': 30 * 24 * 60 * 60 * 1000,    // 30 days
    '4h': 90 * 24 * 60 * 60 * 1000,    // 90 days
    '1d': 365 * 24 * 60 * 60 * 1000,   // 1 year
  };

  return durationMap[timeframe] || 30 * 24 * 60 * 60 * 1000; // Default 30 days
}

// =============================================================================
// Precision Helpers
// =============================================================================

/**
 * Round a number to specified decimal places
 *
 * @param value - Number to round
 * @param precision - Decimal places
 * @returns Rounded number
 */
export function roundToPrecision(value: number, precision: number): number {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Round price to tick size
 *
 * @param price - Price to round
 * @param tickSize - Tick size
 * @returns Rounded price
 */
export function roundToTickSize(price: number, tickSize: number): number {
  return Math.round(price / tickSize) * tickSize;
}

/**
 * Round amount to step size
 *
 * @param amount - Amount to round
 * @param stepSize - Step size
 * @returns Rounded amount
 */
export function roundToStepSize(amount: number, stepSize: number): number {
  return Math.floor(amount / stepSize) * stepSize;
}

// =============================================================================
// Time Helpers
// =============================================================================

/**
 * Get good-til-time in seconds from now
 *
 * @param durationSeconds - Duration in seconds (default: 10 minutes)
 * @returns Unix timestamp in seconds
 */
export function getGoodTilTimeInSeconds(durationSeconds: number = 600): number {
  return Math.floor(Date.now() / 1000) + durationSeconds;
}

/**
 * Parse ISO timestamp to milliseconds
 *
 * @param isoString - ISO 8601 timestamp string
 * @returns Unix timestamp in milliseconds
 */
export function parseISOTimestamp(isoString: string): number {
  return new Date(isoString).getTime();
}

// =============================================================================
// Subaccount Helpers
// =============================================================================

/**
 * Build subaccount ID from address and number
 *
 * @param address - dYdX address
 * @param subaccountNumber - Subaccount number
 * @returns Subaccount ID string
 */
export function buildSubaccountId(address: string, subaccountNumber: number): string {
  return `${address}/${subaccountNumber}`;
}

/**
 * Parse subaccount ID into components
 *
 * @param subaccountId - Subaccount ID string
 * @returns Object with address and subaccountNumber
 */
export function parseSubaccountId(subaccountId: string): { address: string; subaccountNumber: number } {
  const parts = subaccountId.split('/');
  return {
    address: parts[0] || '',
    subaccountNumber: parseInt(parts[1] || '0', 10),
  };
}

// =============================================================================
// URL Helpers
// =============================================================================

/**
 * Build query string from parameters
 *
 * @param params - Query parameters object
 * @returns Query string (without leading ?)
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return entries.join('&');
}

/**
 * Build URL with query parameters
 *
 * @param baseUrl - Base URL
 * @param path - Path to append
 * @param params - Query parameters
 * @returns Full URL string
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const url = `${baseUrl}${path}`;
  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  const queryString = buildQueryString(params);
  return queryString ? `${url}?${queryString}` : url;
}

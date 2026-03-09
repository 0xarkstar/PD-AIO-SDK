/**
 * Avantis Utility Functions
 */

import type { OrderRequest } from '../../types/common.js';
import type { AvantisOrderParams } from './types.js';
import {
  AVANTIS_PAIR_INDEX_MAP,
  AVANTIS_INDEX_TO_SYMBOL,
  PYTH_PRICE_FEED_IDS,
} from './constants.js';

/**
 * Get pairIndex from unified symbol
 * @example "BTC/USD:USD" -> 0
 */
export function getPairIndex(symbol: string): number {
  const base = symbol.split('/')[0] ?? '';
  const index = AVANTIS_PAIR_INDEX_MAP[base];
  if (index === undefined) {
    throw new Error(`Unknown pair for symbol: ${symbol}`);
  }
  return index;
}

/**
 * Get base symbol from pairIndex
 * @example 0 -> "BTC"
 */
export function getBaseFromPairIndex(pairIndex: number): string {
  const base = AVANTIS_INDEX_TO_SYMBOL[pairIndex];
  if (!base) {
    throw new Error(`Unknown pairIndex: ${pairIndex}`);
  }
  return base;
}

/**
 * Get Pyth price feed ID for a base symbol
 */
export function getPythFeedId(base: string): string | undefined {
  return PYTH_PRICE_FEED_IDS[base];
}

/**
 * Convert Pyth oracle price to human-readable number.
 * Pyth prices are stored as (price * 10^expo).
 *
 * @param price - Raw price value from Pyth
 * @param expo - Exponent from Pyth (typically negative, e.g. -8)
 * @returns Human-readable price
 */
export function convertPythPrice(price: bigint | string, expo: number): number {
  const priceNum = typeof price === 'bigint' ? Number(price) : parseFloat(price);
  return priceNum * Math.pow(10, expo);
}

/**
 * Convert USDC amount from on-chain format (6 decimals) to number
 */
export function fromUsdcDecimals(amount: bigint | string): number {
  const raw = typeof amount === 'bigint' ? amount : BigInt(amount);
  return Number(raw) / 1e6;
}

/**
 * Convert number to USDC on-chain format (6 decimals)
 */
export function toUsdcDecimals(amount: number): bigint {
  return BigInt(Math.round(amount * 1e6));
}

/**
 * Convert on-chain price (10 decimals) to number
 */
export function fromPriceDecimals(price: bigint | string): number {
  const raw = typeof price === 'bigint' ? price : BigInt(price);
  return Number(raw) / 1e10;
}

/**
 * Convert number to on-chain price (10 decimals)
 */
export function toPriceDecimals(price: number): bigint {
  return BigInt(Math.round(price * 1e10));
}

/**
 * Build order params for on-chain transaction
 */
export function buildOrderParams(request: OrderRequest, traderAddress: string): AvantisOrderParams {
  const pairIndex = getPairIndex(request.symbol);
  const isBuy = request.side === 'buy';
  const leverage = request.leverage ?? 10;
  const positionSize = request.amount;

  // Price for market orders: use 0 (contract handles slippage)
  let openPrice = '0';
  if (request.type === 'limit' && request.price) {
    openPrice = toPriceDecimals(request.price).toString();
  }

  // TP/SL (stopPrice is used for SL in the unified OrderRequest)
  const tp = '0';
  const sl = request.stopPrice ? toPriceDecimals(request.stopPrice).toString() : '0';

  return {
    trader: traderAddress,
    pairIndex,
    index: 0,
    initialPosToken: 0,
    positionSizeDai: toUsdcDecimals(positionSize).toString(),
    openPrice,
    buy: isBuy,
    leverage,
    tp,
    sl,
  };
}

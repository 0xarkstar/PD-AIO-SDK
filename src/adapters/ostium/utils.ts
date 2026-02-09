/**
 * Ostium Utility Functions
 */

import { OSTIUM_PAIRS, OSTIUM_COLLATERAL_DECIMALS, OSTIUM_PRICE_DECIMALS } from './constants.js';
import type { OstiumPairInfo } from './types.js';

export function toOstiumPairIndex(unified: string): number {
  const parts = unified.split(/[/:]/);
  const name = `${parts[0]}/${parts[1]}`;

  const pair = OSTIUM_PAIRS.find((p) => p.name === name);
  if (pair) return pair.pairIndex;

  throw new Error(`Unknown Ostium pair: ${unified}`);
}

export function toUnifiedSymbol(pairIndex: number): string {
  const pair = OSTIUM_PAIRS.find((p) => p.pairIndex === pairIndex);
  if (!pair) return `UNKNOWN-${pairIndex}/USD:USD`;
  return `${pair.from}/${pair.to}:${pair.to}`;
}

export function toUnifiedSymbolFromName(name: string): string {
  const parts = name.split('/');
  return `${parts[0]}/${parts[1]}:${parts[1]}`;
}

export function getPairInfo(pairIndex: number): OstiumPairInfo | undefined {
  return OSTIUM_PAIRS.find((p) => p.pairIndex === pairIndex);
}

export function formatCollateral(amount: number): string {
  return String(Math.round(amount * 10 ** OSTIUM_COLLATERAL_DECIMALS));
}

export function parseCollateral(raw: string): number {
  return parseInt(raw, 10) / 10 ** OSTIUM_COLLATERAL_DECIMALS;
}

export function formatPrice(price: number): string {
  return String(Math.round(price * 10 ** OSTIUM_PRICE_DECIMALS));
}

export function parsePrice(raw: string): number {
  return parseInt(raw, 10) / 10 ** OSTIUM_PRICE_DECIMALS;
}

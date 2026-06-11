/**
 * StandX Utility Functions
 *
 * Symbol format (recon 2026-06-11): the venue uses ONE dash form "BTC-USD"
 * on EVERY REST endpoint and WS channel (no per-endpoint split, unlike apex).
 * Unified form: "BTC/USD:USD". Quote/settlement asset is the DUSD stablecoin
 * (quote_asset field) while symbols are spelled "-USD" — the unified mapping
 * follows the venue spelling; the raw DUSD fields are preserved in info.
 *
 * Timestamp formats are MIXED on the wire:
 * - REST trades / funding / symbol_market `time`: ISO-8601 (µs precision)
 * - WS price channel `time`: ISO-8601 with NANOSECOND precision
 * - WS public_trade / depth_book `time`: epoch ms int (passthrough)
 */

import { PerpDEXError } from '../../types/errors.js';

/** Unified "BTC/USD:USD" → venue "BTC-USD" (all endpoints + WS channels) */
export function toStandxSymbol(unified: string): string {
  const parts = unified.split(/[/:]/);
  return `${parts[0]}-${parts[1]}`;
}

/** Venue "BTC-USD" → unified "BTC/USD:USD" */
export function toUnifiedSymbol(venueSymbol: string): string {
  const [base, quote] = venueSymbol.split('-');
  return `${base}/${quote}:${quote}`;
}

/**
 * ISO-8601 → epoch ms. The venue emits up to NANOSECOND fractional precision
 * ("2026-06-11T03:17:02.461486466Z") — sub-millisecond digits are trimmed
 * before parsing so the result is always exact 13-digit ms, never NaN.
 */
export function isoToMs(iso: string): number {
  const trimmed = iso.replace(/(\.\d{3})\d+(Z|[+-]\d{2}:?\d{2})$/, '$1$2');
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) {
    throw new PerpDEXError(`Unparseable timestamp: ${iso}`, 'INVALID_RESPONSE', 'standx');
  }
  return ms;
}

/** Decimal count → tick size: 2 → 0.01, 4 → 0.0001, 0 → 1 */
export function decimalsToTickSize(decimals: number): number {
  return Number(`1e-${decimals}`);
}

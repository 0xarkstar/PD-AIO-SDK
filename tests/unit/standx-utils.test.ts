/**
 * StandX utils tests — symbol converters + timestamp/tick helpers.
 *
 * Venue facts (recon 2026-06-11):
 * - Symbols are spelled "BTC-USD" on EVERY endpoint and WS channel (no
 *   per-endpoint format split, unlike apex). Unified form: "BTC/USD:USD".
 * - Timestamp formats are MIXED: REST trades/funding/price `time` is
 *   ISO-8601 (the WS price channel carries NANOSECOND-precision ISO);
 *   WS public_trade / depth_book `time` is epoch ms int.
 * - Precision arrives as DECIMAL COUNTS (price_tick_decimals=2 → tick 0.01).
 */

import { describe, expect, test } from '@jest/globals';
import {
  toStandxSymbol,
  toUnifiedSymbol,
  isoToMs,
  decimalsToTickSize,
} from '../../src/adapters/standx/utils.js';

describe('standx utils', () => {
  describe('toStandxSymbol (unified → venue dash form, ALL endpoints + WS)', () => {
    test('converts unified to the venue dash form', () => {
      expect(toStandxSymbol('BTC/USD:USD')).toBe('BTC-USD');
      expect(toStandxSymbol('ETH/USD:USD')).toBe('ETH-USD');
      expect(toStandxSymbol('XAU/USD:USD')).toBe('XAU-USD');
    });
  });

  describe('toUnifiedSymbol (venue → unified)', () => {
    test('converts the venue dash symbol to unified', () => {
      expect(toUnifiedSymbol('BTC-USD')).toBe('BTC/USD:USD');
      expect(toUnifiedSymbol('HYPE-USD')).toBe('HYPE/USD:USD');
    });

    test('round-trips with toStandxSymbol', () => {
      expect(toStandxSymbol(toUnifiedSymbol('BTC-USD'))).toBe('BTC-USD');
    });
  });

  describe('isoToMs (mixed ISO precisions → epoch ms)', () => {
    test('parses standard ISO-8601', () => {
      expect(isoToMs('2026-06-10T04:00:00Z')).toBe(1781064000000);
    });

    test('parses microsecond-precision ISO (REST trades)', () => {
      expect(isoToMs('2026-06-11T03:15:56.451148Z')).toBe(1781147756451);
    });

    test('parses NANOSECOND-precision ISO (WS price channel) — truncates, never NaN', () => {
      expect(isoToMs('2026-06-11T03:17:02.461486466Z')).toBe(1781147822461);
      expect(String(isoToMs('2026-06-11T03:17:02.461486466Z'))).toHaveLength(13);
    });

    test('throws on an unparseable timestamp instead of returning NaN', () => {
      expect(() => isoToMs('not-a-time')).toThrow();
    });
  });

  describe('decimalsToTickSize', () => {
    test('converts decimal counts to tick sizes', () => {
      expect(decimalsToTickSize(2)).toBe(0.01);
      expect(decimalsToTickSize(4)).toBe(0.0001);
      expect(decimalsToTickSize(0)).toBe(1);
    });
  });
});

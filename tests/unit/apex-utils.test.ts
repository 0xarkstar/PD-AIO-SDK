/**
 * ApeX Omni utils tests — dual symbol converters.
 *
 * APEX symbol formats are STRICT and PER-ENDPOINT (recon 2026-06-11):
 * - NO-DASH "BTCUSDT" for /depth, /trades, /ticker, /klines and ALL WS topics
 * - DASH "BTC-USDT" for /history-funding and the `symbol` field inside /symbols
 * Sending the dash form to /depth returns HTTP 200 {"data":{"a":null,"b":null,...}}
 * (silent empty) — the converters must never leak the wrong form.
 */

import { describe, expect, test } from '@jest/globals';
import {
  toApexNoDashSymbol,
  toApexDashSymbol,
  toUnifiedSymbol,
  dashToUnifiedSymbol,
  parsePrecision,
} from '../../src/adapters/apex/utils.js';

describe('apex utils — dual symbol converters', () => {
  describe('toApexNoDashSymbol (depth/trades/ticker/klines/WS)', () => {
    test('converts unified to no-dash form', () => {
      expect(toApexNoDashSymbol('BTC/USDT:USDT')).toBe('BTCUSDT');
      expect(toApexNoDashSymbol('ETH/USDT:USDT')).toBe('ETHUSDT');
      expect(toApexNoDashSymbol('1000PEPE/USDT:USDT')).toBe('1000PEPEUSDT');
    });

    test('never emits a dash (silent-empty depth trap)', () => {
      expect(toApexNoDashSymbol('BTC/USDT:USDT')).not.toContain('-');
    });
  });

  describe('toApexDashSymbol (history-funding/markets)', () => {
    test('converts unified to dash form', () => {
      expect(toApexDashSymbol('BTC/USDT:USDT')).toBe('BTC-USDT');
      expect(toApexDashSymbol('ETH/USDT:USDT')).toBe('ETH-USDT');
    });

    test('always contains exactly one dash', () => {
      const s = toApexDashSymbol('BTC/USDT:USDT');
      expect(s.split('-')).toHaveLength(2);
    });
  });

  describe('toUnifiedSymbol', () => {
    test('builds unified perp symbol from base + settle', () => {
      expect(toUnifiedSymbol('BTC', 'USDT')).toBe('BTC/USDT:USDT');
    });
  });

  describe('dashToUnifiedSymbol', () => {
    test('converts venue dash symbol to unified', () => {
      expect(dashToUnifiedSymbol('BTC-USDT')).toBe('BTC/USDT:USDT');
      expect(dashToUnifiedSymbol('ETH-USDT')).toBe('ETH/USDT:USDT');
    });
  });

  describe('parsePrecision', () => {
    test('derives decimal places from tick/step size strings', () => {
      expect(parsePrecision('0.1')).toBe(1);
      expect(parsePrecision('0.001')).toBe(3);
      expect(parsePrecision('1')).toBe(0);
    });
  });
});

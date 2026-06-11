/**
 * GRVT REST normalization — fixture-backed against LIVE wire shapes
 * (captured 2026-06-11 mainnet, byte-faithful fixtures in tests/fixtures/grvt/).
 *
 * Pins the two systematic wire-unit fixes (paradex-repair house pattern):
 * - GRVT timestamps are unix NANOSECOND strings (19 digits) EVERYWHERE on the
 *   wire (book/trade/ticker `event_time`, ticker `next_funding_time`, funding
 *   `funding_time`). 19-digit ns exceeds Number.MAX_SAFE_INTEGER, so the
 *   normalizer must string-slice (`Number(s.slice(0, -6))` — exact), never
 *   `parseInt(s)` (treated ns as ms -> year ~58,000,000) nor `parseInt(s)/1e6`
 *   (lossy float).
 * - `funding_rate` is PERCENT-per-interval on the wire (`"0.01"` = 0.01%/8h
 *   = 1e-4 fractional). The normalizer divides by 100.
 * - the funding endpoint returns `{result: [...]}` — an ARRAY (history, newest
 *   first) whose entries have NO `index_price` and NO `next_funding_time`.
 *   Schemas must not require those fields (paradex phantom-field precedent).
 */

import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { GRVTNormalizer } from '../../src/adapters/grvt/GRVTNormalizer.js';
import {
  GRVTOrderBookSchema,
  GRVTTradeSchema,
  GRVTTickerSchema,
  GRVTFundingSchema,
} from '../../src/adapters/grvt/types.js';
import type {
  GRVTOrderBook,
  GRVTTrade,
  GRVTTicker,
  GRVTFunding,
} from '../../src/adapters/grvt/types.js';

const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'grvt');

function loadFixture(name: string): any {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

const bookFixture = loadFixture('rest-book-BTC_USDT_Perp-raw.json');
const tradeFixture = loadFixture('rest-trade-BTC_USDT_Perp-raw.json');
const tickerFixture = loadFixture('rest-ticker-BTC_USDT_Perp-raw.json');
const fundingFixture = loadFixture('rest-funding-BTC_USDT_Perp-raw.json');

const normalizer = new GRVTNormalizer();

/** A normalized GRVT timestamp must be 13-digit epoch ms (2020..2100). */
function expectEpochMs(ts: number | undefined): void {
  expect(ts).toBeDefined();
  expect(Number.isInteger(ts)).toBe(true);
  expect(ts!).toBeGreaterThan(1577836800000); // 2020-01-01
  expect(ts!).toBeLessThan(4102444800000); // 2100-01-01
}

describe('GRVT REST normalization (live fixtures)', () => {
  describe('order book (full/v1/book)', () => {
    it('raw fixture validates against the zod wire schema', () => {
      expect(() => GRVTOrderBookSchema.parse(bookFixture.result)).not.toThrow();
    });

    it('converts the 19-digit ns event_time to exact epoch ms', () => {
      const book = normalizer.normalizeOrderBook(bookFixture.result as GRVTOrderBook);
      // wire: event_time "1781147737050000000" (ns) -> 1781147737050 (ms)
      expect(book.timestamp).toBe(1781147737050);
      expectEpochMs(book.timestamp);
    });

    it('normalizes levels and leaves REST sequenceId undefined', () => {
      const book = normalizer.normalizeOrderBook(bookFixture.result as GRVTOrderBook);
      expect(book.symbol).toBe('BTC/USDT:USDT');
      expect(book.exchange).toBe('grvt');
      expect(book.bids[0]).toEqual([62057.0, 5.62]);
      expect(book.asks[0]).toEqual([62057.1, 0.577]);
      expect(book.sequenceId).toBeUndefined();
    });
  });

  describe('trades (full/v1/trade)', () => {
    it('raw fixture validates against the zod wire schema', () => {
      for (const t of tradeFixture.result) {
        expect(() => GRVTTradeSchema.parse(t)).not.toThrow();
      }
    });

    it('converts ns event_time to exact epoch ms (string-slice, not lossy /1e6)', () => {
      const trade = normalizer.normalizeTrade(tradeFixture.result[0] as GRVTTrade);
      // wire: "1781147817714299257" ns -> 1781147817714 ms EXACTLY
      // (parseInt(s)/1e6 would give 1781147817714.2993 — non-integer)
      expect(trade.timestamp).toBe(1781147817714);
      expect(Number.isInteger(trade.timestamp)).toBe(true);
    });

    it('all fixture trades normalize to 13-digit ms timestamps', () => {
      for (const raw of tradeFixture.result) {
        const trade = normalizer.normalizeTrade(raw as GRVTTrade);
        expectEpochMs(trade.timestamp);
      }
    });
  });

  describe('ticker (full/v1/ticker)', () => {
    it('raw fixture validates against the zod wire schema', () => {
      expect(() => GRVTTickerSchema.parse(tickerFixture.result)).not.toThrow();
    });

    it('converts ns event_time to epoch ms', () => {
      const ticker = normalizer.normalizeTicker(tickerFixture.result as GRVTTicker);
      // wire: "1781147845000000000" ns -> 1781147845000 ms
      expect(ticker.timestamp).toBe(1781147845000);
      expectEpochMs(ticker.timestamp);
    });
  });

  describe('funding (full/v1/funding)', () => {
    it('schema accepts the REAL array-entry shape (no index_price, no next_funding_time)', () => {
      expect(Array.isArray(fundingFixture.result)).toBe(true);
      for (const entry of fundingFixture.result) {
        expect(() => GRVTFundingSchema.parse(entry)).not.toThrow();
        expect(entry.index_price).toBeUndefined();
        expect(entry.next_funding_time).toBeUndefined();
      }
    });

    it('converts the PERCENT-per-interval rate to a fraction (0.01 -> 1e-4)', () => {
      const funding = normalizer.normalizeFundingRate(fundingFixture.result[0] as GRVTFunding);
      // wire: funding_rate "0.01" = 0.01%/8h = 1e-4 fractional
      expect(funding.fundingRate).toBe(0.0001);
    });

    it('converts a negative percent rate', () => {
      const negative = fundingFixture.result.find(
        (e: { funding_rate: string }) => e.funding_rate === '-0.0155'
      );
      expect(negative).toBeDefined();
      const funding = normalizer.normalizeFundingRate(negative as GRVTFunding);
      expect(funding.fundingRate).toBeCloseTo(-0.000155, 12);
    });

    it('converts ns funding_time and derives nextFundingTimestamp = +interval', () => {
      const funding = normalizer.normalizeFundingRate(fundingFixture.result[0] as GRVTFunding);
      // wire: funding_time "1781136000000000000" ns -> 1781136000000 ms
      expect(funding.fundingTimestamp).toBe(1781136000000);
      expect(funding.fundingIntervalHours).toBe(8);
      // +8h == the venue-authoritative ticker next_funding_time
      // ("1781164800000000000" ns -> 1781164800000 ms) — live cross-check.
      expect(funding.nextFundingTimestamp).toBe(1781164800000);
      expectEpochMs(funding.fundingTimestamp);
      expectEpochMs(funding.nextFundingTimestamp);
    });
  });
});

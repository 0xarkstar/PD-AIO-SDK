/**
 * ApeX Omni normalizer tests — fixture-backed against the LIVE wire shapes
 * (recon capture 2026-06-11, https://omni.apex.exchange/api/v3 +
 * wss://quote.omni.apex.exchange/realtime_public).
 *
 * Fixtures in tests/fixtures/apex/ are byte-faithful raw payloads.
 * Key venue facts pinned here:
 * - Funding interval is HOURLY (19/19 captured gaps exactly 1.0h); rates are
 *   FRACTIONAL per-interval (passthrough, no percent conversion).
 * - Ticker `data` is an ARRAY of one object; `nextFundingTime` is ISO-8601 STRING.
 * - Klines are keyed BY SYMBOL: {"BTCUSDT":[...]}.
 * - WS frame `ts` is MICROSECONDS (16 digits) → must come out as 13-digit ms.
 * - /depth with a DASH symbol silently returns {a:null,b:null,s:"",u:0} — the
 *   depth schema must HARD-REJECT that shape.
 */

import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ApexNormalizer } from '../../src/adapters/apex/ApexNormalizer.js';
import {
  ApexDepthDataSchema,
  ApexErrorEnvelopeSchema,
} from '../../src/adapters/apex/types.js';
import { mapApexError } from '../../src/adapters/apex/error-codes.js';
import { PerpDEXError } from '../../src/types/errors.js';

const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'apex');

function loadFixture(name: string): any {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

const depthFixture = loadFixture('rest_depth_symbol_BTCUSDT_limit_100.json');
const tradesFixture = loadFixture('rest_trades_symbol_BTCUSDT_limit_50.json');
const tickerFixture = loadFixture('rest_ticker_symbol_BTCUSDT.json');
const fundingFixture = loadFixture('rest_history-funding_symbol_BTC-USDT_limit_20.json');
const klinesFixture = loadFixture('rest_klines_symbol_BTCUSDT_interval_1_limit_3.json');
const symbolsFixture = loadFixture('symbols_raw.json');

const SYMBOL = 'BTC/USDT:USDT';
const normalizer = new ApexNormalizer();

describe('ApexNormalizer (fixture-backed)', () => {
  describe('normalizeOrderBook (REST /depth)', () => {
    test('normalizes the captured depth payload', () => {
      const book = normalizer.normalizeOrderBook(depthFixture.data, SYMBOL);

      expect(book.exchange).toBe('apex');
      expect(book.symbol).toBe(SYMBOL);
      expect(book.bids).toHaveLength(100);
      expect(book.asks).toHaveLength(100);

      // Top of book from the capture
      expect(book.bids[0]).toEqual([62037.4, 0.852]);
      expect(book.asks[0]).toEqual([62042.2, 0.887]);

      // bids DESC, asks ASC
      for (let i = 1; i < book.bids.length; i++) {
        expect(book.bids[i]![0]).toBeLessThan(book.bids[i - 1]![0]);
      }
      for (let i = 1; i < book.asks.length; i++) {
        expect(book.asks[i]![0]).toBeGreaterThan(book.asks[i - 1]![0]);
      }
      expect(book.bids[0]![0]).toBeLessThan(book.asks[0]![0]);

      // sequenceId from the venue updateId `u`
      expect(book.sequenceId).toBe(17060617);
      // ms timestamp (synthesized locally — /depth carries no ts field)
      expect(String(book.timestamp)).toHaveLength(13);
    });

    test('HARD-REJECTS the silent-empty null-book shape (dash-symbol trap)', () => {
      const nullBook = { a: null, b: null, s: '', u: 0 };
      expect(() => ApexDepthDataSchema.parse(nullBook)).toThrow();
      expect(() => normalizer.normalizeOrderBook(nullBook as any, SYMBOL)).toThrow();
    });
  });

  describe('normalizeTrade (REST /trades)', () => {
    test('normalizes the first captured trade', () => {
      const trade = normalizer.normalizeTrade(tradesFixture.data[0], SYMBOL);

      expect(trade.id).toBe('2cb892c9-37c5-58c4-a793-ef16ec730fc3');
      expect(trade.symbol).toBe(SYMBOL);
      expect(trade.side).toBe('buy');
      expect(trade.price).toBe(61987.3);
      expect(trade.amount).toBe(0.116);
      expect(trade.cost).toBeCloseTo(61987.3 * 0.116, 6);
      // Already epoch ms on the wire — 13-digit assertion
      expect(trade.timestamp).toBe(1781147624672);
      expect(String(trade.timestamp)).toHaveLength(13);
    });

    test('maps Sell → sell', () => {
      const trade = normalizer.normalizeTrade(tradesFixture.data[1], SYMBOL);
      expect(trade.side).toBe('sell');
    });
  });

  describe('normalizeTicker (REST /ticker — data is ARRAY of one)', () => {
    test('normalizes the single ticker object', () => {
      const ticker = normalizer.normalizeTicker(tickerFixture.data[0], SYMBOL);

      expect(ticker.symbol).toBe(SYMBOL);
      expect(ticker.last).toBe(62048.7);
      expect(ticker.high).toBe(62825.8);
      expect(ticker.low).toBe(60720);
      expect(ticker.baseVolume).toBe(14896.419);
      expect(ticker.quoteVolume).toBe(918136630.9046);
      // price24hPcnt is a FRACTION on the wire → percentage in unified form
      expect(ticker.percentage).toBeCloseTo(1.0418685239436, 9);
      // No bid/ask in the payload — derived from last, tagged in info
      expect(ticker.bid).toBe(62048.7);
      expect(ticker.ask).toBe(62048.7);
      expect((ticker.info as any)._bidAskSource).toBe('last_price');
    });
  });

  describe('normalizeFundingRateFromTicker (current funding via /ticker)', () => {
    test('fractional passthrough + ISO-8601 nextFundingTime → ms', () => {
      const fr = normalizer.normalizeFundingRateFromTicker(tickerFixture.data[0], SYMBOL);

      expect(fr.symbol).toBe(SYMBOL);
      // FRACTIONAL per-interval — NO percent conversion
      expect(fr.fundingRate).toBe(-0.00001374);
      // ISO string "2026-06-11T04:00:00Z" → epoch ms
      expect(fr.nextFundingTimestamp).toBe(Date.parse('2026-06-11T04:00:00Z'));
      expect(String(fr.nextFundingTimestamp)).toHaveLength(13);
      // HOURLY settlement (live-verified: 19/19 gaps exactly 1.0h)
      expect(fr.fundingIntervalHours).toBe(1);
      expect(fr.markPrice).toBe(62048.7);
      expect(fr.indexPrice).toBe(62060.31);
    });
  });

  describe('normalizeFundingRateHistoryEntry (REST /history-funding)', () => {
    test('ms timestamps passthrough + hourly interval', () => {
      const entry = fundingFixture.data.historyFunds[0];
      const fr = normalizer.normalizeFundingRateHistoryEntry(entry, SYMBOL);

      expect(fr.fundingRate).toBe(-0.00000632);
      expect(fr.fundingTimestamp).toBe(1781146800000);
      expect(String(fr.fundingTimestamp)).toHaveLength(13);
      expect(fr.nextFundingTimestamp).toBe(1781146800000 + 3_600_000);
      expect(fr.fundingIntervalHours).toBe(1);
      expect(fr.markPrice).toBe(62147.54);
    });

    test('captured history confirms HOURLY settlement (every gap exactly 1h)', () => {
      const funds = fundingFixture.data.historyFunds;
      for (let i = 1; i < funds.length; i++) {
        expect(funds[i - 1].fundingTime - funds[i].fundingTime).toBe(3_600_000);
      }
    });
  });

  describe('normalizeOHLCV (REST /klines — keyed BY SYMBOL)', () => {
    test('unwraps the record-by-symbol shape', () => {
      const klines = normalizer.unwrapKlines(klinesFixture.data, 'BTCUSDT');
      expect(klines).toHaveLength(3);
    });

    test('normalizes a kline to unified OHLCV tuple', () => {
      const klines = normalizer.unwrapKlines(klinesFixture.data, 'BTCUSDT');
      const ohlcv = normalizer.normalizeOHLCV(klines[0]!);
      // [t, o, h, l, c, v]
      expect(ohlcv).toEqual([1781147520000, 62032.7, 62032.7, 61984.3, 61984.5, 11]);
    });

    test('throws when the requested symbol key is missing', () => {
      expect(() => normalizer.unwrapKlines({}, 'BTCUSDT')).toThrow();
    });
  });

  describe('normalizeMarket (/symbols → contractConfig.perpetualContract[])', () => {
    const btc = symbolsFixture.data.contractConfig.perpetualContract.find(
      (c: any) => c.symbol === 'BTC-USDT'
    );

    test('normalizes the BTC-USDT perpetual contract', () => {
      const market = normalizer.normalizeMarket(btc);

      expect(market.symbol).toBe('BTC/USDT:USDT');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USDT');
      expect(market.settle).toBe('USDT');
      expect(market.active).toBe(true);
      expect(market.priceTickSize).toBe(0.1);
      expect(market.amountStepSize).toBe(0.001);
      expect(market.minAmount).toBe(0.001);
      expect(market.maxLeverage).toBe(100);
      // HOURLY funding (live-verified)
      expect(market.fundingIntervalHours).toBe(1);
    });

    test('inactive when enableTrade=false or isPrelaunch=true', () => {
      expect(normalizer.normalizeMarket({ ...btc, enableTrade: false }).active).toBe(false);
      expect(normalizer.normalizeMarket({ ...btc, isPrelaunch: true }).active).toBe(false);
    });
  });

  describe('WS µs→ms conversion', () => {
    test('16-digit microsecond frame ts → 13-digit ms', () => {
      // From the captured WS orderbook snapshot frame
      expect(normalizer.usToMs(1781147751179227)).toBe(1781147751179);
      expect(String(normalizer.usToMs(1781147751179227))).toHaveLength(13);
    });
  });

  describe('error envelope {code, msg}', () => {
    test('schema accepts the captured error shape', () => {
      const parsed = ApexErrorEnvelopeSchema.parse({ code: 3, msg: 'invalid symbol', timeCost: 1 });
      expect(parsed.code).toBe(3);
    });

    test('mapApexError produces a PerpDEXError tagged apex', () => {
      const err = mapApexError(3, 'invalid symbol');
      expect(err).toBeInstanceOf(PerpDEXError);
      expect(err.exchange).toBe('apex');
      expect(err.code).toBe('3');
    });
  });
});

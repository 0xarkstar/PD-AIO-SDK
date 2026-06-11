/**
 * StandX normalizer tests — fixture-backed against the LIVE wire shapes
 * (recon capture 2026-06-11, https://perps.standx.com + wss://perps.standx.com/ws-stream/v1).
 *
 * Fixtures in tests/fixtures/standx/ are byte-faithful raw payloads.
 * Key venue facts pinned here:
 * - Depth levels are UNSORTED by venue contract (documented warning) — the
 *   normalizer MUST sort client-side (bids DESC, asks ASC) even though the
 *   capture happened to arrive sorted.
 * - Timestamp formats are MIXED: REST trades/funding/symbol_market `time` is
 *   ISO-8601; WS public_trade + depth_book `time` is epoch ms int; the WS
 *   price channel is NANOSECOND-precision ISO. All normalize to 13-digit ms.
 * - REST trades expose `is_buyer_taker` (no side); WS trades expose `side`
 *   (no is_buyer_taker) — unified side derives from whichever is present.
 * - Funding is FRACTIONAL + HOURLY on the wire (0.0000125; 23/23 captured
 *   gaps exactly 1.0h) — passthrough, NO unit conversion (no grvt % trap).
 * - REST trades carry NO id — the normalizer synthesizes a deterministic one.
 */

import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { StandxNormalizer } from '../../src/adapters/standx/StandxNormalizer.js';
import { StandxDepthBookSchema } from '../../src/adapters/standx/types.js';

const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'standx');

function loadFixture(name: string): any {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

const depthFixture = loadFixture('rest-query_depth_book_symbol_BTC-USD.json');
const tradesFixture = loadFixture('rest-query_recent_trades_symbol_BTC-USD.json');
const fundingFixture = loadFixture('rest-query_funding_rates.json');
const symbolMarketFixture = loadFixture('rest-query_symbol_market_symbol_BTC-USD.json');
const symbolInfoFixture = loadFixture('rest-query_symbol_info_symbol_BTC-USD.json');
const klineFixture = loadFixture('rest-kline_history.json');

const wsFrames: any[] = readFileSync(join(FIXTURE_DIR, 'ws-frames.ndjson'), 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l));
const wsDepthFrames = wsFrames.filter((f) => f.channel === 'depth_book');
const wsTradeFrames = wsFrames.filter((f) => f.channel === 'public_trade');
const wsPriceFrames = wsFrames.filter((f) => f.channel === 'price');

const SYMBOL = 'BTC/USD:USD';
const normalizer = new StandxNormalizer();

describe('StandxNormalizer (fixture-backed)', () => {
  describe('normalizeOrderBook (REST query_depth_book + WS depth_book — same wire shape)', () => {
    test('normalizes the captured REST depth payload', () => {
      const book = normalizer.normalizeOrderBook(depthFixture, SYMBOL);

      expect(book.exchange).toBe('standx');
      expect(book.symbol).toBe(SYMBOL);
      expect(book.bids).toHaveLength(130);
      expect(book.asks).toHaveLength(130);

      // Top of book from the capture
      expect(book.bids[0]).toEqual([62059, 0.2394]);
      expect(book.asks[0]).toEqual([62060, 0.001]);

      // bids DESC, asks ASC, not crossed
      for (let i = 1; i < book.bids.length; i++) {
        expect(book.bids[i]![0]).toBeLessThan(book.bids[i - 1]![0]);
      }
      for (let i = 1; i < book.asks.length; i++) {
        expect(book.asks[i]![0]).toBeGreaterThan(book.asks[i - 1]![0]);
      }
      expect(book.bids[0]![0]).toBeLessThan(book.asks[0]![0]);

      // Wire `time` is epoch ms — carried through, 13 digits
      expect(book.timestamp).toBe(depthFixture.time);
      expect(String(book.timestamp)).toHaveLength(13);
    });

    test('SORTS unsorted levels (venue contract: ordering NOT guaranteed)', () => {
      const shuffled = {
        ...depthFixture,
        asks: [...depthFixture.asks].reverse(),
        bids: [...depthFixture.bids].reverse(),
      };
      const book = normalizer.normalizeOrderBook(shuffled, SYMBOL);
      expect(book.bids[0]).toEqual([62059, 0.2394]);
      expect(book.asks[0]).toEqual([62060, 0.001]);
      for (let i = 1; i < book.asks.length; i++) {
        expect(book.asks[i]![0]).toBeGreaterThan(book.asks[i - 1]![0]);
      }
    });

    test('WS depth_book frame normalizes with sequenceId from the frame seq', () => {
      const frame = wsDepthFrames[0];
      const book = normalizer.normalizeOrderBook(frame.data, SYMBOL, frame.seq);

      expect(book.bids).toHaveLength(130);
      expect(book.asks).toHaveLength(130);
      expect(book.asks[0]![0]).toBe(62074);
      expect(book.bids[0]![0]).toBe(62065);
      expect(book.sequenceId).toBe(1);
      // WS depth time is epoch ms int (NOT ISO)
      expect(book.timestamp).toBe(1781147823495);
    });

    test('schema rejects a malformed book (missing bids)', () => {
      expect(() => StandxDepthBookSchema.parse({ asks: [], symbol: 'BTC-USD' })).toThrow();
    });
  });

  describe('normalizeRestTrade (is_buyer_taker → side; ISO time → ms; synthesized id)', () => {
    test('normalizes the first captured trade (is_buyer_taker=true → buy)', () => {
      const trade = normalizer.normalizeRestTrade(tradesFixture[0], SYMBOL);

      expect(trade.symbol).toBe(SYMBOL);
      expect(trade.side).toBe('buy');
      expect(trade.price).toBe(62059.72);
      expect(trade.amount).toBe(0.0745);
      expect(trade.cost).toBeCloseTo(62059.72 * 0.0745, 6);
      // ISO "2026-06-11T03:15:56.451148Z" → epoch ms
      expect(trade.timestamp).toBe(1781147756451);
      expect(String(trade.timestamp)).toHaveLength(13);
      // REST trades carry NO id on the wire — synthesized + tagged
      expect(trade.id).toBeTruthy();
      expect((trade.info as any)._idSource).toBe('synthesized');
    });

    test('is_buyer_taker=false → sell', () => {
      const trade = normalizer.normalizeRestTrade(tradesFixture[1], SYMBOL);
      expect(trade.side).toBe('sell');
    });

    test('synthesized id is deterministic for the same wire trade', () => {
      const a = normalizer.normalizeRestTrade(tradesFixture[0], SYMBOL);
      const b = normalizer.normalizeRestTrade(tradesFixture[0], SYMBOL);
      expect(a.id).toBe(b.id);
    });
  });

  describe('normalizeWSTrade (side on the wire; epoch ms time; int id)', () => {
    test('normalizes the first captured WS trade', () => {
      const trade = normalizer.normalizeWSTrade(wsTradeFrames[0].data, SYMBOL);

      expect(trade.id).toBe('236175881');
      expect(trade.side).toBe('sell');
      expect(trade.price).toBe(62065.27);
      expect(trade.amount).toBe(0.0001);
      // WS public_trade time is ALREADY epoch ms (no ISO parse)
      expect(trade.timestamp).toBe(1781147823698);
    });
  });

  describe('normalizeTicker (REST query_symbol_market — mixed string/number wire types)', () => {
    test('normalizes the captured symbol_market payload', () => {
      const ticker = normalizer.normalizeTicker(symbolMarketFixture, SYMBOL);

      expect(ticker.symbol).toBe(SYMBOL);
      expect(ticker.last).toBe(62046.91);
      // Real bid/ask from bid1/ask1 (strings on the wire)
      expect(ticker.bid).toBe(62059.74);
      expect(ticker.ask).toBe(62059.75);
      // 24h stats are NUMBERS on the wire (not strings)
      expect(ticker.high).toBe(62819.75);
      expect(ticker.low).toBe(60735.03);
      expect(ticker.open).toBe(61400.54);
      expect(ticker.change).toBeCloseTo(660.67, 2);
      // price_change_pct is ALREADY percent units (1.076 = +1.076%)
      expect(ticker.percentage).toBeCloseTo(1.0760003087920698, 9);
      expect(ticker.baseVolume).toBeCloseTo(10530.0493, 4);
      expect(ticker.quoteVolume).toBeCloseTo(649170834.911164, 3);
      // ISO time → ms
      expect(ticker.timestamp).toBe(1781147762428);
    });
  });

  describe('normalizeWSTicker (WS price channel — ns-precision ISO, no 24h stats)', () => {
    test('normalizes the captured price frame', () => {
      const ticker = normalizer.normalizeWSTicker(wsPriceFrames[0].data, SYMBOL);

      expect(ticker.last).toBe(62069.91);
      // spread tuple is [bid, ask]
      expect(ticker.bid).toBe(62062.07);
      expect(ticker.ask).toBe(62065.06);
      // NANOSECOND-precision ISO "…T03:17:02.461486466Z" → 13-digit ms
      expect(ticker.timestamp).toBe(1781147822461);
      // 24h stats are NOT on this channel — placeholders are TAGGED, not lied
      expect((ticker.info as any)._24hStatsSource).toBe('unavailable_on_ws_price_channel');
    });
  });

  describe('normalizeFundingRate (current, via query_symbol_market)', () => {
    test('fractional passthrough + hourly interval + ISO next_funding_time → ms', () => {
      const fr = normalizer.normalizeFundingRate(symbolMarketFixture, SYMBOL);

      // FRACTIONAL on the wire (0.0000125) — NO percent conversion (no grvt trap)
      expect(fr.fundingRate).toBe(0.0000125);
      expect(fr.nextFundingTimestamp).toBe(Date.parse('2026-06-11T04:00:00Z'));
      expect(fr.fundingTimestamp).toBe(Date.parse('2026-06-11T04:00:00Z') - 3_600_000);
      expect(fr.fundingIntervalHours).toBe(1);
      expect(fr.markPrice).toBe(62061.21);
      expect(fr.indexPrice).toBe(62081.72);
    });
  });

  describe('normalizeFundingRateHistoryEntry (query_funding_rates)', () => {
    test('normalizes the first captured entry', () => {
      const fr = normalizer.normalizeFundingRateHistoryEntry(fundingFixture[0], SYMBOL);

      expect(fr.fundingRate).toBe(0.0000125);
      expect(fr.fundingTimestamp).toBe(1781064000000);
      expect(fr.nextFundingTimestamp).toBe(1781064000000 + 3_600_000);
      expect(fr.fundingIntervalHours).toBe(1);
      expect(fr.markPrice).toBe(61532.33);
      expect(fr.indexPrice).toBe(61549.13);
    });

    test('captured history confirms HOURLY settlement (every gap exactly 1h)', () => {
      for (let i = 1; i < fundingFixture.length; i++) {
        expect(
          Date.parse(fundingFixture[i].time) - Date.parse(fundingFixture[i - 1].time)
        ).toBe(3_600_000);
      }
    });
  });

  describe('normalizeOHLCV (TradingView-UDF column arrays, t in SECONDS)', () => {
    test('zips the column arrays into unified [t,o,h,l,c,v] rows (t → ms)', () => {
      const ohlcv = normalizer.normalizeOHLCV(klineFixture);

      expect(ohlcv).toHaveLength(5);
      expect(ohlcv[0]).toEqual([
        1781147520000, 62042.02, 62047.99, 62001.01, 62004.04, 5.901799999999999,
      ]);
      expect(String(ohlcv[0]![0])).toHaveLength(13);
    });

    test('returns [] for the UDF no_data status', () => {
      expect(normalizer.normalizeOHLCV({ s: 'no_data' })).toEqual([]);
    });

    test('throws on the UDF error status', () => {
      expect(() => normalizer.normalizeOHLCV({ s: 'error', errmsg: 'boom' })).toThrow();
    });
  });

  describe('normalizeMarket (query_symbol_info)', () => {
    const btcInfo = symbolInfoFixture[0];

    test('normalizes the BTC-USD symbol info', () => {
      const market = normalizer.normalizeMarket(btcInfo);

      expect(market.id).toBe('BTC-USD');
      expect(market.symbol).toBe('BTC/USD:USD');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('USD');
      expect(market.active).toBe(true);
      expect(market.minAmount).toBe(0.0001);
      expect(market.maxAmount).toBe(100);
      // price_tick_decimals=2 / qty_tick_decimals=4 → DECIMAL COUNTS on the wire
      expect(market.pricePrecision).toBe(2);
      expect(market.amountPrecision).toBe(4);
      expect(market.priceTickSize).toBe(0.01);
      expect(market.amountStepSize).toBe(0.0001);
      expect(market.makerFee).toBe(0.0001);
      expect(market.takerFee).toBe(0.0004);
      expect(market.maxLeverage).toBe(40);
      expect(market.fundingIntervalHours).toBe(1);
      // Margin/settlement asset is DUSD (venue spells symbols "-USD") — tagged
      expect((market.info as any).quote_asset).toBe('DUSD');
    });

    test('inactive when status is not "trading"', () => {
      const market = normalizer.normalizeMarket({ ...btcInfo, status: 'halted' });
      expect(market.active).toBe(false);
    });
  });
});

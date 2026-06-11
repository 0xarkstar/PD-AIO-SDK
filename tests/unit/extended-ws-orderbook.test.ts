/**
 * Extended WS order book + trades schema/state tests — fixture-backed against
 * the LIVE per-stream protocol (capture 2026-06-11).
 *
 * Real protocol (live-verified; the old wss://ws.starknet.extended.exchange
 * model was fictional — NXDOMAIN):
 * - Per-stream URLs ARE the subscription:
 *   wss://api.starknet.extended.exchange/stream.extended.exchange/v1/{stream}/{market}
 * - Orderbook envelope {type:"SNAPSHOT"|"DELTA", data:{t,m,b,a,d}, ts, seq};
 *   SNAPSHOT levels {q,p}; DELTA levels {q,p,c} where c is the new ABSOLUTE
 *   qty (c=="0" deletes; q is the SIGNED change, informational only).
 * - Trades envelope {data:[{i,m,S,tT,T,p,q}], ts, seq} — NO type field.
 * - Trade ids are int64: JSON.parse silently corrupts them past 2^53
 *   (2064908781480841219 → 2064908781480841200).
 *
 * Fixtures in tests/fixtures/extended/ are byte-faithful wire payloads.
 */

import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  ExtendedWSOrderBookSchema,
  ExtendedWSTradesSchema,
  parseExtendedWSTradesFrame,
} from '../../src/adapters/extended/types.js';
import { ExtendedOrderBookState } from '../../src/adapters/extended/utils.js';
import { ExtendedNormalizer } from '../../src/adapters/extended/ExtendedNormalizer.js';

const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'extended');

function readFixture(name: string): string {
  return readFileSync(join(FIXTURE_DIR, name), 'utf8');
}

function readNdjson(name: string): string[] {
  return readFixture(name)
    .split('\n')
    .filter((line) => line.trim().length > 0);
}

const snapshotRaw = readFixture('orderbook_frame_000.raw.json');
const snapshotFrame = JSON.parse(snapshotRaw);
const deltaLines = readNdjson('orderbook_frames_001-020.raw.ndjson');
const bboRaw = readFixture('obd1_frame_000.raw.json');
const bboLines = readNdjson('obd1_frames_001-020.raw.ndjson');
const tradesBackfillRaw = readFixture('trades_frame_000.raw.json');
const tradesLines = readNdjson('trades_frames_001-020.raw.ndjson');

describe('ExtendedWSOrderBookSchema (raw wire envelope)', () => {
  it('parses the full-depth SNAPSHOT frame (2414 bids + 5010 asks)', () => {
    const frame = ExtendedWSOrderBookSchema.parse(snapshotFrame);

    expect(frame.type).toBe('SNAPSHOT');
    expect(frame.data.t).toBe('SNAPSHOT');
    expect(frame.data.m).toBe('BTC-USD');
    expect(frame.data.d).toBe('f');
    expect(frame.ts).toBe(1781147688647);
    expect(frame.seq).toBe(1);
    expect(frame.data.b).toHaveLength(2414);
    expect(frame.data.a).toHaveLength(5010);
    // SNAPSHOT level shape: {q, p} strings
    expect(frame.data.b[0]).toMatchObject({ q: '0.32260', p: '61993' });
    expect(frame.data.a[0]).toMatchObject({ q: '18.83808', p: '61994' });
  });

  it('parses every captured DELTA frame; seq is monotonic +1 per connection', () => {
    let expectedSeq = 2;
    for (const line of deltaLines) {
      const frame = ExtendedWSOrderBookSchema.parse(JSON.parse(line));
      expect(frame.type).toBe('DELTA');
      expect(frame.data.t).toBe('DELTA');
      expect(frame.seq).toBe(expectedSeq);
      expectedSeq++;
      // DELTA level shape: {q: signed change, p, c: new ABSOLUTE qty}
      for (const level of [...frame.data.b, ...frame.data.a]) {
        expect(typeof level.q).toBe('string');
        expect(typeof level.p).toBe('string');
        expect(typeof level.c).toBe('string');
      }
    }
    expect(expectedSeq).toBe(22); // frames seq 2..21
  });

  it('captures include c=="0" removal levels', () => {
    const removals = deltaLines
      .map((line) => ExtendedWSOrderBookSchema.parse(JSON.parse(line)))
      .flatMap((frame) =>
        frame.type === 'DELTA' ? [...frame.data.b, ...frame.data.a] : []
      )
      .filter((level) => level.c === '0');
    expect(removals.length).toBe(9);
  });

  it('parses depth=1 BBO frames (every frame SNAPSHOT, d:"1", exactly 1+1)', () => {
    for (const raw of [bboRaw, ...bboLines]) {
      const frame = ExtendedWSOrderBookSchema.parse(JSON.parse(raw));
      expect(frame.type).toBe('SNAPSHOT');
      expect(frame.data.d).toBe('1');
      expect(frame.data.b).toHaveLength(1);
      expect(frame.data.a).toHaveLength(1);
    }
  });

  it('rejects a trades envelope (no type field) and garbage', () => {
    expect(() => ExtendedWSOrderBookSchema.parse(JSON.parse(tradesBackfillRaw))).toThrow();
    expect(() => ExtendedWSOrderBookSchema.parse({ hello: 'world' })).toThrow();
  });
});

describe('ExtendedWSTradesSchema + int64-safe frame parsing', () => {
  it('parses the 50-trade HISTORICAL backfill frame (first frame per connection)', () => {
    const frame = parseExtendedWSTradesFrame(tradesBackfillRaw);
    expect(frame.seq).toBe(1);
    expect(frame.ts).toBe(1781147694134);
    expect(frame.data).toHaveLength(50);
    // Backfill is historical: every trade timestamp predates the envelope ts
    expect(frame.data.every((t) => t.T < frame.ts)).toBe(true);
    // Trades envelope deliberately has NO type field (separate schema)
    expect('type' in frame).toBe(false);
  });

  it('parses every live trades frame ({i,m,S,tT,T,p,q})', () => {
    let expectedSeq = 2;
    for (const line of tradesLines) {
      const frame = parseExtendedWSTradesFrame(line);
      expect(frame.seq).toBe(expectedSeq);
      expectedSeq++;
      for (const trade of frame.data) {
        expect(trade.m).toBe('BTC-USD');
        expect(['BUY', 'SELL']).toContain(trade.S);
        expect(['TRADE', 'LIQUIDATION', 'DELEVERAGE']).toContain(trade.tT);
        expect(typeof trade.T).toBe('number');
        expect(typeof trade.p).toBe('string');
        expect(typeof trade.q).toBe('string');
      }
    }
  });

  it('preserves int64 trade ids byte-exact (JSON.parse alone corrupts them)', () => {
    // Live-proven corruption: wire i:2064908781480841219 → JSON.parse →
    // 2064908781480841200 (last 2 digits LOST; String() after parse is
    // already corrupted).
    const corrupted = JSON.parse(tradesBackfillRaw);
    expect(String(corrupted.data[0].i)).toBe('2064908781480841200');
    expect(String(corrupted.data[0].i)).not.toBe('2064908781480841219');

    // The bigint-preserving reviver path keeps the exact wire id as a string.
    const frame = parseExtendedWSTradesFrame(tradesBackfillRaw);
    expect(frame.data[0]!.i).toBe('2064908781480841219');
  });

  it('rejects an orderbook envelope (data is an object, not an array)', () => {
    expect(() => ExtendedWSTradesSchema.parse(snapshotFrame)).toThrow();
  });
});

describe('ExtendedOrderBookState (stateful book per stream)', () => {
  function seeded(): ExtendedOrderBookState {
    const state = new ExtendedOrderBookState();
    state.apply(ExtendedWSOrderBookSchema.parse(snapshotFrame));
    return state;
  }

  it('seeds from SNAPSHOT: full depth, bids desc, asks asc, not crossed', () => {
    const { bids, asks } = seeded().sides();
    expect(bids).toHaveLength(2414);
    expect(asks).toHaveLength(5010);
    expect(bids[0]).toEqual([61993, 0.3226]);
    expect(asks[0]).toEqual([61994, 18.83808]);
    for (let i = 1; i < 50; i++) {
      expect(bids[i]![0]).toBeLessThan(bids[i - 1]![0]);
      expect(asks[i]![0]).toBeGreaterThan(asks[i - 1]![0]);
    }
    expect(bids[0]![0]).toBeLessThan(asks[0]![0]);
  });

  it('applies DELTA via the c field (qty := parseFloat(c)); c=="0" deletes', () => {
    const state = seeded();
    // First captured DELTA (seq 2): bids 61979→3.19109, 61978→6.62962,
    // 40296→c "0" (removal); no ask changes.
    state.apply(ExtendedWSOrderBookSchema.parse(JSON.parse(deltaLines[0]!)));
    const { bids, asks } = state.sides();

    const bidMap = new Map(bids.map(([p, q]) => [p, q]));
    expect(bidMap.get(61979)).toBe(3.19109);
    expect(bidMap.get(61978)).toBe(6.62962);
    expect(bidMap.has(40296)).toBe(false); // deleted via c=="0"
    expect(bids).toHaveLength(2413); // one removal, no inserts on bids
    expect(asks).toHaveLength(5010);
  });

  it('replays all 20 captured DELTAs: book stays sorted and uncrossed', () => {
    const state = seeded();
    for (const line of deltaLines) {
      state.apply(ExtendedWSOrderBookSchema.parse(JSON.parse(line)));
    }
    const { bids, asks } = state.sides();
    expect(bids.length).toBeGreaterThan(0);
    expect(asks.length).toBeGreaterThan(0);
    for (let i = 1; i < bids.length; i++) {
      expect(bids[i]![0]).toBeLessThan(bids[i - 1]![0]);
    }
    for (let i = 1; i < asks.length; i++) {
      expect(asks[i]![0]).toBeGreaterThan(asks[i - 1]![0]);
    }
    expect(bids[0]![0]).toBeLessThan(asks[0]![0]);
  });

  it('reconnect rebuild: a fresh SNAPSHOT fully replaces the book', () => {
    const state = seeded();
    for (const line of deltaLines) {
      state.apply(ExtendedWSOrderBookSchema.parse(JSON.parse(line)));
    }
    // Reconnect ⇒ venue sends a fresh SNAPSHOT (seq resets to 1); applying it
    // must rebuild the book exactly, discarding all delta-applied state.
    state.apply(ExtendedWSOrderBookSchema.parse(snapshotFrame));
    expect(state.sides()).toEqual(seeded().sides());
  });

  it('BBO (d:"1") frames are self-contained snapshots replacing the book', () => {
    const state = new ExtendedOrderBookState();
    for (const raw of [bboRaw, ...bboLines]) {
      state.apply(ExtendedWSOrderBookSchema.parse(JSON.parse(raw)));
      const { bids, asks } = state.sides();
      expect(bids).toHaveLength(1);
      expect(asks).toHaveLength(1);
    }
  });
});

describe('ExtendedNormalizer.normalizeWSOrderBook (WS decoder ≠ REST decoder)', () => {
  const normalizer = new ExtendedNormalizer();

  it('emits a FULL unified OrderBook from the raw SNAPSHOT frame', () => {
    const state = new ExtendedOrderBookState();
    const book = normalizer.normalizeWSOrderBook(snapshotFrame, state);

    expect(book.exchange).toBe('extended');
    expect(book.symbol).toBe('BTC/USD:USD');
    expect(book.timestamp).toBe(1781147688647); // envelope ts
    expect(book.sequenceId).toBe(1); // envelope seq
    expect(book.bids).toHaveLength(2414);
    expect(book.asks).toHaveLength(5010);
    expect(book.bids[0]).toEqual([61993, 0.3226]);
    expect(book.asks[0]).toEqual([61994, 18.83808]);
  });

  it('emits a FULL book per DELTA frame (consumers expect snapshots)', () => {
    const state = new ExtendedOrderBookState();
    normalizer.normalizeWSOrderBook(snapshotFrame, state);
    const book = normalizer.normalizeWSOrderBook(JSON.parse(deltaLines[0]!), state);

    expect(book.timestamp).toBe(1781147688731);
    expect(book.sequenceId).toBe(2);
    // Full maintained book, not the 3-level delta payload
    expect(book.bids).toHaveLength(2413);
    expect(book.asks).toHaveLength(5010);
  });

  it('rejects malformed frames via zod', () => {
    const state = new ExtendedOrderBookState();
    expect(() => normalizer.normalizeWSOrderBook({ bogus: true }, state)).toThrow();
  });
});

describe('ExtendedNormalizer.normalizeTrade (live i/m/S/tT/T/p/q wire shape)', () => {
  const normalizer = new ExtendedNormalizer();

  it('normalizes a live WS trade to the unified Trade', () => {
    const frame = parseExtendedWSTradesFrame(tradesLines[0]!);
    const trade = normalizer.normalizeTrade(frame.data[0]!);

    expect(trade.id).toBe('2064909243445678080'); // int64-safe string id
    expect(trade.symbol).toBe('BTC/USD:USD');
    expect(trade.side).toBe('sell');
    expect(trade.price).toBe(61993);
    expect(trade.amount).toBe(0.03572);
    expect(trade.cost).toBeCloseTo(61993 * 0.03572, 6);
    expect(trade.timestamp).toBe(1781147702453);
    // The raw trade type rides along in info (LIQUIDATION/DELEVERAGE tagging)
    expect((trade.info as Record<string, unknown>).tT).toBe('TRADE');
  });

  it('keeps non-TRADE flow (LIQUIDATION/DELEVERAGE), tagged via info.tT', () => {
    const frame = parseExtendedWSTradesFrame(
      tradesLines[0]!.replace('"tT":"TRADE"', '"tT":"LIQUIDATION"')
    );
    const trade = normalizer.normalizeTrade(frame.data[0]!);
    expect((trade.info as Record<string, unknown>).tT).toBe('LIQUIDATION');
    expect(trade.price).toBe(61993);
  });
});

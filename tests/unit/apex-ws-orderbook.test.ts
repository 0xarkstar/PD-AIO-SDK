/**
 * ApeX Omni WS tests — fixture-backed against the LIVE protocol
 * (capture 2026-06-11, wss://quote.omni.apex.exchange/realtime_public?v=2&timestamp=<ms>).
 *
 * Fixtures in tests/fixtures/apex/ are byte-faithful wire payloads:
 * - ws_orderbook_snapshot.json: type:"snapshot" full 200×200 book, `u` updateId,
 *   `ts` in MICROSECONDS (16 digits).
 * - ws_orderbook_deltas_first5.json: type:"delta" frames; size "0" deletes a level;
 *   `u` strictly +1 continuous (measured 127 deltas, every gap == 1).
 * - ws_trades_snapshot.json: type:"snapshot" = 50-trade recent history (dedupe by uuid `i`).
 * - ws_trades_deltas_first5.json: live delta trades.
 * - ws_control_frames.json: subscribe ack {success:true,...}, SERVER {op:"ping"}
 *   (client MUST reply {op:"pong"}), client-ping ack.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

// --- Mock WebSocketClient (the wrapper reuses src/websocket/WebSocketClient like aster) ---

type MessageHandler = (data: unknown) => void;

const mockInstances: MockWebSocketClient[] = [];

class MockWebSocketClient {
  config: any;
  sent: any[] = [];
  connected = false;
  listeners = new Map<string, Array<(...args: any[]) => void>>();

  constructor(config: any) {
    this.config = config;
    mockInstances.push(this);
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  send(data: unknown): void {
    this.sent.push(typeof data === 'string' ? JSON.parse(data) : data);
  }

  on(event: string, handler: (...args: any[]) => void): this {
    const arr = this.listeners.get(event) ?? [];
    arr.push(handler);
    this.listeners.set(event, arr);
    return this;
  }

  /** Feed a parsed frame into the wrapper (WebSocketClient delivers parsed JSON) */
  simulate(frame: unknown): void {
    const onMessage = this.config.onMessage as MessageHandler;
    onMessage(frame);
  }
}

jest.mock('../../src/websocket/WebSocketClient.js', () => ({
  WebSocketClient: jest
    .fn()
    .mockImplementation((config: unknown) => new MockWebSocketClient(config)),
}));

// Import AFTER the mock so the wrapper picks it up
import { ApexWebSocketWrapper } from '../../src/adapters/apex/ApexWebSocketWrapper.js';
import { ApexNormalizer } from '../../src/adapters/apex/ApexNormalizer.js';

const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'apex');

function loadFixture(name: string): any {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

const obSnapshot = loadFixture('ws_orderbook_snapshot.json');
const obDeltas = loadFixture('ws_orderbook_deltas_first5.json');
const tradesSnapshot = loadFixture('ws_trades_snapshot.json');
const tradesDeltas = loadFixture('ws_trades_deltas_first5.json');
const controlFrames = loadFixture('ws_control_frames.json');

const SYMBOL = 'BTC/USDT:USDT';

function lastInstance(): MockWebSocketClient {
  return mockInstances[mockInstances.length - 1]!;
}

async function tick(ms = 10): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

describe('ApexWebSocketWrapper (live protocol, fixture-fed)', () => {
  let wrapper: ApexWebSocketWrapper;

  beforeEach(() => {
    mockInstances.length = 0;
    wrapper = new ApexWebSocketWrapper({
      wsUrl: 'wss://quote.omni.apex.exchange/realtime_public',
      normalizer: new ApexNormalizer(),
      symbolToExchange: () => 'BTCUSDT',
    });
  });

  afterEach(async () => {
    await wrapper.disconnect();
    jest.clearAllMocks();
  });

  describe('connection + subscribe framing', () => {
    it('connects with ?v=2&timestamp=<ms> query params', async () => {
      await wrapper.connect();
      const url: string = lastInstance().config.url;
      expect(url).toMatch(/\?v=2&timestamp=\d{13}$/);
      expect(url.startsWith('wss://quote.omni.apex.exchange/realtime_public')).toBe(true);
    });

    it('sends {op:"subscribe",args:[topic]} with the NO-DASH WS topic', async () => {
      await wrapper.connect();
      const gen = wrapper.watchOrderBook(SYMBOL);
      const next = gen.next();
      await tick();

      const subs = lastInstance().sent.filter((f) => f.op === 'subscribe');
      expect(subs).toHaveLength(1);
      expect(subs[0]).toEqual({ op: 'subscribe', args: ['orderBook200.H.BTCUSDT'] });

      lastInstance().simulate(obSnapshot);
      await next;
      await gen.return(undefined as any);
    });
  });

  describe('orderbook snapshot + delta book maintenance', () => {
    it('yields the full unified book from the snapshot frame (µs→ms, sequenceId=u)', async () => {
      await wrapper.connect();
      const gen = wrapper.watchOrderBook(SYMBOL);
      const next = gen.next();
      await tick();

      lastInstance().simulate(obSnapshot);
      const result = await next;

      expect(result.done).toBe(false);
      const book = result.value;
      expect(book.exchange).toBe('apex');
      expect(book.symbol).toBe(SYMBOL);
      expect(book.bids).toHaveLength(200);
      expect(book.asks).toHaveLength(200);
      expect(book.sequenceId).toBe(17061395);
      // frame ts 1781147751179227 µs (16 digits) → 1781147751179 ms (13 digits)
      expect(book.timestamp).toBe(1781147751179);
      // sorted: bids DESC, asks ASC, not crossed
      expect(book.bids[0]![0]).toBe(62028.6);
      expect(book.asks[0]![0]).toBe(62029.1);
      for (let i = 1; i < book.bids.length; i++) {
        expect(book.bids[i]![0]).toBeLessThan(book.bids[i - 1]![0]);
      }
      for (let i = 1; i < book.asks.length; i++) {
        expect(book.asks[i]![0]).toBeGreaterThan(book.asks[i - 1]![0]);
      }

      await gen.return(undefined as any);
    });

    it('applies deltas: size "0" deletes, new level inserts, existing level updates', async () => {
      await wrapper.connect();
      const gen = wrapper.watchOrderBook(SYMBOL);
      const first = gen.next();
      await tick();
      lastInstance().simulate(obSnapshot);
      await first;

      const second = gen.next();
      lastInstance().simulate(obDeltas[0]);
      const result = await second;

      const book = result.value;
      expect(book.sequenceId).toBe(17061396);

      const bidMap = new Map(book.bids.map(([p, q]) => [p, q]));
      const askMap = new Map(book.asks.map(([p, q]) => [p, q]));

      // snapshot had bid 61962.4 @ 0.008 → delta sets "0" → DELETED
      expect(bidMap.has(61962.4)).toBe(false);
      // 61993.1 was NOT in the snapshot → delta inserts 0.015
      expect(bidMap.get(61993.1)).toBe(0.015);
      // ask 62029.1 was 8.205 → delta updates to 8.060
      expect(askMap.get(62029.1)).toBe(8.06);
      // ask 62083.1 was 0.007 → delta "0" → DELETED
      expect(askMap.has(62083.1)).toBe(false);

      await gen.return(undefined as any);
    });

    it('applies the 5 captured deltas in order — u strictly +1 each frame', async () => {
      await wrapper.connect();
      const gen = wrapper.watchOrderBook(SYMBOL);
      const first = gen.next();
      await tick();
      lastInstance().simulate(obSnapshot);
      await first;

      for (const delta of obDeltas) {
        const next = gen.next();
        lastInstance().simulate(delta);
        const result = await next;
        expect(result.value.sequenceId).toBe(delta.data.u);
      }

      await gen.return(undefined as any);
    });

    it('on u-gap: does NOT emit the gapped frame and resubscribes', async () => {
      await wrapper.connect();
      const gen = wrapper.watchOrderBook(SYMBOL);
      const first = gen.next();
      await tick();
      lastInstance().simulate(obSnapshot);
      await first;

      const sentBefore = lastInstance().sent.length;

      // Gap: snapshot u=17061395, feed a delta with u=17061400 (skips 4)
      const gapped = obDeltas[4]; // u=17061400
      const next = gen.next();
      lastInstance().simulate(gapped);
      await tick();

      // Resubscribe protocol: unsubscribe + subscribe sent for the topic
      const sentAfter = lastInstance().sent.slice(sentBefore);
      expect(sentAfter.some((f) => f.op === 'unsubscribe')).toBe(true);
      expect(
        sentAfter.some(
          (f) => f.op === 'subscribe' && f.args?.[0] === 'orderBook200.H.BTCUSDT'
        )
      ).toBe(true);

      // A fresh snapshot rebuilds the book and resumes emission
      lastInstance().simulate(obSnapshot);
      const result = await next;
      expect(result.value.sequenceId).toBe(17061395);

      await gen.return(undefined as any);
    });

    it('honors limit by slicing the maintained book (orderBook25 topic for limit<=25)', async () => {
      await wrapper.connect();
      const gen = wrapper.watchOrderBook(SYMBOL, 5);
      const next = gen.next();
      await tick();

      const subs = lastInstance().sent.filter((f) => f.op === 'subscribe');
      expect(subs[0].args[0]).toBe('orderBook25.H.BTCUSDT');

      const snapshot25 = {
        ...obSnapshot,
        topic: 'orderBook25.H.BTCUSDT',
      };
      lastInstance().simulate(snapshot25);
      const result = await next;
      expect(result.value.bids).toHaveLength(5);
      expect(result.value.asks).toHaveLength(5);
      // Best levels survive the slice
      expect(result.value.bids[0]![0]).toBe(62028.6);
      expect(result.value.asks[0]![0]).toBe(62029.1);

      await gen.return(undefined as any);
    });
  });

  describe('trades stream', () => {
    it('emits snapshot (recent history) trades then deltas, deduped by uuid i', async () => {
      await wrapper.connect();
      const gen = wrapper.watchTrades(SYMBOL);

      const subsPromise = gen.next();
      await tick();
      const subs = lastInstance().sent.filter((f) => f.op === 'subscribe');
      expect(subs[0]).toEqual({ op: 'subscribe', args: ['recentlyTrade.H.BTCUSDT'] });

      lastInstance().simulate(tradesSnapshot);
      const first = await subsPromise;
      expect(first.done).toBe(false);
      expect(first.value.id).toBe(tradesSnapshot.data[0].i);
      expect(first.value.side).toBe('buy');
      expect(first.value.price).toBe(62029.1);
      expect(first.value.amount).toBe(0.145);
      expect(String(first.value.timestamp)).toHaveLength(13);

      // Drain the remaining 49 snapshot trades
      for (let i = 1; i < tradesSnapshot.data.length; i++) {
        const r = await gen.next();
        expect(r.value.id).toBe(tradesSnapshot.data[i].i);
      }

      // Live delta arrives
      const next = gen.next();
      lastInstance().simulate(tradesDeltas[0]);
      const result = await next;
      expect(result.value.id).toBe('3d207cc0-d05b-5b9f-8a16-3ae1d133fb07');
      expect(result.value.timestamp).toBe(1781147751171);

      // Replaying the SAME delta does not re-emit (dedupe by uuid `i`)
      const after = gen.next();
      lastInstance().simulate(tradesDeltas[0]);
      lastInstance().simulate(tradesDeltas[1]);
      const dedupedNext = await after;
      expect(dedupedNext.value.id).toBe('e4764da9-47a8-5346-863e-06a26d5a8cad');

      await gen.return(undefined as any);
    });
  });

  describe('heartbeat (dual ping/pong — copying aster verbatim would die at 150s)', () => {
    it('replies {op:"pong"} to the SERVER {op:"ping"} frame', async () => {
      await wrapper.connect();
      const serverPing = controlFrames.find((f: any) => f.op === 'ping');
      expect(serverPing).toBeDefined();

      lastInstance().simulate(serverPing);
      await tick();

      expect(lastInstance().sent.some((f) => f.op === 'pong')).toBe(true);
    });

    it('starts a 15s client ping interval on connect and sends {op:"ping",args:["<ms>"]}', async () => {
      await wrapper.connect();

      // Trigger the client ping directly (interval cadence is 15s)
      (wrapper as any).sendClientPing();

      const pings = lastInstance().sent.filter((f) => f.op === 'ping');
      expect(pings.length).toBeGreaterThanOrEqual(1);
      expect(pings[0].args).toHaveLength(1);
      expect(pings[0].args[0]).toMatch(/^\d{13}$/);

      // Interval registered (cleared on disconnect)
      expect((wrapper as any).pingInterval).not.toBeNull();
      await wrapper.disconnect();
      expect((wrapper as any).pingInterval).toBeNull();
    });

    it('ignores subscribe acks and ping acks without throwing', async () => {
      await wrapper.connect();
      for (const frame of controlFrames) {
        expect(() => lastInstance().simulate(frame)).not.toThrow();
      }
    });
  });
});

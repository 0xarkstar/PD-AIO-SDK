/**
 * StandX WS tests — fixture-backed against the LIVE protocol
 * (capture 2026-06-11, wss://perps.standx.com/ws-stream/v1, 121 frames / 12s).
 *
 * Protocol facts pinned here:
 * - Subscribe frame: {"subscribe":{"channel":"depth_book"|"public_trade"|"price","symbol":"BTC-USD"}}.
 *   NO auth for these three public channels.
 * - Every message: {seq, channel, symbol, data}. `seq` is CONNECTION-GLOBAL
 *   (interleaved across channels — fixture depth seqs are 1,7,9,… while price
 *   and public_trade frames fill the gaps), so per-channel gap-based resync
 *   would false-positive on every interleaved frame. `seq` is surfaced as
 *   OrderBook.sequenceId for consumer-side gap awareness instead.
 * - depth_book = FULL ~130×130 snapshots every ~270ms, SNAPSHOT-ONLY (no
 *   delta protocol) — each frame REPLACES the book (paradex-snapshot-simple).
 * - Level ordering NOT guaranteed (venue-documented) — wrapper output sorted.
 * - public_trade data is ONE trade object per frame ({id,price,qty,side,
 *   symbol,time:ms}); price channel data carries ns-precision ISO time.
 * - Heartbeat: server uses WS protocol-level ping (runtime auto-pongs); there
 *   is NO JSON heartbeat — the wrapper must send NO ping frames of its own.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

// --- Mock WebSocketClient (the wrapper reuses src/websocket/WebSocketClient like apex/aster) ---

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

  emit(event: string): void {
    for (const handler of this.listeners.get(event) ?? []) {
      handler();
    }
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
import { StandxWebSocketWrapper } from '../../src/adapters/standx/StandxWebSocketWrapper.js';
import { StandxNormalizer } from '../../src/adapters/standx/StandxNormalizer.js';

const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'standx');

const wsFrames: any[] = readFileSync(join(FIXTURE_DIR, 'ws-frames.ndjson'), 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l));
const depthFrames = wsFrames.filter((f) => f.channel === 'depth_book');
const tradeFrames = wsFrames.filter((f) => f.channel === 'public_trade');
const priceFrames = wsFrames.filter((f) => f.channel === 'price');

const SYMBOL = 'BTC/USD:USD';

function lastInstance(): MockWebSocketClient {
  return mockInstances[mockInstances.length - 1]!;
}

async function tick(ms = 10): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

describe('StandxWebSocketWrapper (live protocol, fixture-fed)', () => {
  let wrapper: StandxWebSocketWrapper;

  beforeEach(() => {
    mockInstances.length = 0;
    wrapper = new StandxWebSocketWrapper({
      wsUrl: 'wss://perps.standx.com/ws-stream/v1',
      normalizer: new StandxNormalizer(),
      symbolToExchange: () => 'BTC-USD',
    });
  });

  afterEach(async () => {
    await wrapper.disconnect();
    jest.clearAllMocks();
  });

  describe('connection + subscribe framing', () => {
    it('connects to the plain stream URL (no query params, no auth frame)', async () => {
      await wrapper.connect();
      expect(lastInstance().config.url).toBe('wss://perps.standx.com/ws-stream/v1');
      expect(lastInstance().sent).toHaveLength(0);
    });

    it('sends {"subscribe":{channel,symbol}} with the venue dash symbol', async () => {
      await wrapper.connect();
      const gen = wrapper.watchOrderBook(SYMBOL);
      const next = gen.next();
      await tick();

      const subs = lastInstance().sent.filter((f) => f.subscribe);
      expect(subs).toHaveLength(1);
      expect(subs[0]).toEqual({ subscribe: { channel: 'depth_book', symbol: 'BTC-USD' } });

      lastInstance().simulate(depthFrames[0]);
      await next;
      await gen.return(undefined as any);
    });

    it('sends NO JSON heartbeat frames (server pings at the WS protocol level)', async () => {
      await wrapper.connect();
      const gen = wrapper.watchOrderBook(SYMBOL);
      const next = gen.next();
      await tick(30);

      lastInstance().simulate(depthFrames[0]);
      await next;

      // ONLY the subscribe frame went out — no {op:ping}/{type:ping}/pong
      expect(lastInstance().sent).toHaveLength(1);
      expect(lastInstance().sent[0].subscribe).toBeDefined();

      await gen.return(undefined as any);
    });
  });

  describe('orderbook (SNAPSHOT-ONLY full book, ~270ms cadence)', () => {
    it('yields the full unified book per frame (sorted, ms timestamp, sequenceId=seq)', async () => {
      await wrapper.connect();
      const gen = wrapper.watchOrderBook(SYMBOL);
      const next = gen.next();
      await tick();

      lastInstance().simulate(depthFrames[0]);
      const result = await next;

      expect(result.done).toBe(false);
      const book = result.value;
      expect(book.exchange).toBe('standx');
      expect(book.symbol).toBe(SYMBOL);
      expect(book.bids).toHaveLength(130);
      expect(book.asks).toHaveLength(130);
      expect(book.bids[0]![0]).toBe(62065);
      expect(book.asks[0]![0]).toBe(62074);
      // Connection-global frame seq surfaced as sequenceId
      expect(book.sequenceId).toBe(1);
      // depth_book data.time is epoch ms int
      expect(book.timestamp).toBe(1781147823495);
      for (let i = 1; i < book.bids.length; i++) {
        expect(book.bids[i]![0]).toBeLessThan(book.bids[i - 1]![0]);
      }
      for (let i = 1; i < book.asks.length; i++) {
        expect(book.asks[i]![0]).toBeGreaterThan(book.asks[i - 1]![0]);
      }

      await gen.return(undefined as any);
    });

    it('each frame REPLACES the book (snapshot-only — no merge with prior frames)', async () => {
      await wrapper.connect();
      const gen = wrapper.watchOrderBook(SYMBOL);
      const first = gen.next();
      await tick();
      lastInstance().simulate(depthFrames[0]);
      await first;

      const second = gen.next();
      lastInstance().simulate(depthFrames[1]);
      const result = await second;
      const book = result.value;

      const askMap = new Map(book.asks.map(([p, q]) => [p, q]));
      // ask 62096 (qty 4.2656) exists ONLY in frame 0 — a merge would leak it
      expect(askMap.has(62096)).toBe(false);
      // ask 62074 changed 0.0003 → 0.0011 between frames — must be the NEW qty
      expect(askMap.get(62074)).toBe(0.0011);
      // ask 62073 is NEW in frame 1
      expect(askMap.get(62073)).toBe(0.1566);
      // frame 1 metadata
      expect(book.sequenceId).toBe(7);
      expect(book.timestamp).toBe(1781147823909);

      await gen.return(undefined as any);
    });

    it('sequenceId tracks the connection-global seq across emitted books', async () => {
      await wrapper.connect();
      const gen = wrapper.watchOrderBook(SYMBOL);
      const seqs: number[] = [];

      for (const frame of depthFrames.slice(0, 4)) {
        const next = gen.next();
        await tick(1);
        lastInstance().simulate(frame);
        const result = await next;
        seqs.push(result.value.sequenceId!);
      }

      expect(seqs).toEqual(depthFrames.slice(0, 4).map((f) => f.seq));
      // Strictly increasing — consumers can gap-detect; gaps WITHIN a channel
      // are normal (seq is global across channels), so the wrapper does NOT resync
      for (let i = 1; i < seqs.length; i++) {
        expect(seqs[i]!).toBeGreaterThan(seqs[i - 1]!);
      }

      await gen.return(undefined as any);
    });

    it('sorts an out-of-order frame (venue contract: ordering NOT guaranteed)', async () => {
      await wrapper.connect();
      const gen = wrapper.watchOrderBook(SYMBOL);
      const next = gen.next();
      await tick();

      const shuffled = {
        ...depthFrames[0],
        data: {
          ...depthFrames[0].data,
          asks: [...depthFrames[0].data.asks].reverse(),
          bids: [...depthFrames[0].data.bids].reverse(),
        },
      };
      lastInstance().simulate(shuffled);
      const result = await next;
      expect(result.value.asks[0]![0]).toBe(62074);
      expect(result.value.bids[0]![0]).toBe(62065);

      await gen.return(undefined as any);
    });

    it('honors limit by slicing the snapshot (venue has no depth param)', async () => {
      await wrapper.connect();
      const gen = wrapper.watchOrderBook(SYMBOL, 5);
      const next = gen.next();
      await tick();

      lastInstance().simulate(depthFrames[0]);
      const result = await next;
      expect(result.value.bids).toHaveLength(5);
      expect(result.value.asks).toHaveLength(5);
      // Best levels survive the slice
      expect(result.value.bids[0]![0]).toBe(62065);
      expect(result.value.asks[0]![0]).toBe(62074);

      await gen.return(undefined as any);
    });
  });

  describe('trades stream (ONE trade object per frame)', () => {
    it('emits unified trades from public_trade frames', async () => {
      await wrapper.connect();
      const gen = wrapper.watchTrades(SYMBOL);

      const first = gen.next();
      await tick();
      const subs = lastInstance().sent.filter((f) => f.subscribe);
      expect(subs[0]).toEqual({ subscribe: { channel: 'public_trade', symbol: 'BTC-USD' } });

      lastInstance().simulate(tradeFrames[0]);
      const result = await first;
      expect(result.value.id).toBe('236175881');
      expect(result.value.side).toBe('sell');
      expect(result.value.price).toBe(62065.27);
      expect(result.value.amount).toBe(0.0001);
      expect(result.value.timestamp).toBe(1781147823698);

      const second = gen.next();
      lastInstance().simulate(tradeFrames[1]);
      const r2 = await second;
      expect(r2.value.id).toBe('236175889');
      expect(r2.value.amount).toBe(0.0775);

      await gen.return(undefined as any);
    });
  });

  describe('ticker stream (price channel)', () => {
    it('emits unified tickers with real bid/ask from the spread tuple', async () => {
      await wrapper.connect();
      const gen = wrapper.watchTicker(SYMBOL);

      const first = gen.next();
      await tick();
      const subs = lastInstance().sent.filter((f) => f.subscribe);
      expect(subs[0]).toEqual({ subscribe: { channel: 'price', symbol: 'BTC-USD' } });

      lastInstance().simulate(priceFrames[0]);
      const result = await first;
      expect(result.value.last).toBe(62069.91);
      expect(result.value.bid).toBe(62062.07);
      expect(result.value.ask).toBe(62065.06);
      // ns-precision ISO → 13-digit ms
      expect(result.value.timestamp).toBe(1781147822461);

      await gen.return(undefined as any);
    });
  });

  describe('routing + error surfacing', () => {
    it('routes frames by (channel, symbol) — a price frame never leaks into the book stream', async () => {
      await wrapper.connect();
      const gen = wrapper.watchOrderBook(SYMBOL);
      const next = gen.next();
      await tick();

      lastInstance().simulate(priceFrames[0]); // wrong channel
      lastInstance().simulate(tradeFrames[0]); // wrong channel
      lastInstance().simulate(depthFrames[0]);
      const result = await next;
      expect(result.value.sequenceId).toBe(depthFrames[0].seq);

      await gen.return(undefined as any);
    });

    it('surfaces venue error frames ({code,message}) instead of dropping them (grvt lesson)', async () => {
      await wrapper.connect();
      const errors: Error[] = [];
      wrapper.on('error', (e: Error) => errors.push(e));

      lastInstance().simulate({ code: 408, message: 'disconnecting due to not receive Pong' });
      await tick();

      expect(errors).toHaveLength(1);
      expect(errors[0]!.message).toContain('408');
    });

    it('ignores unknown channels without throwing', async () => {
      await wrapper.connect();
      expect(() =>
        lastInstance().simulate({ seq: 1, channel: 'auth', data: { code: 200, msg: 'success' } })
      ).not.toThrow();
    });
  });

  describe('reconnect', () => {
    it('re-sends subscribe frames after a reconnect (snapshot-only — next frame rebuilds)', async () => {
      await wrapper.connect();
      const gen = wrapper.watchOrderBook(SYMBOL);
      const next = gen.next();
      await tick();

      const sentBefore = lastInstance().sent.length;
      lastInstance().emit('reconnected');
      await tick();

      const resent = lastInstance().sent.slice(sentBefore).filter((f) => f.subscribe);
      expect(resent).toHaveLength(1);
      expect(resent[0]).toEqual({ subscribe: { channel: 'depth_book', symbol: 'BTC-USD' } });

      lastInstance().simulate(depthFrames[0]);
      await next;
      await gen.return(undefined as any);
    });
  });
});

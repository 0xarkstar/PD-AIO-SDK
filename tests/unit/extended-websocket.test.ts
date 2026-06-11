/**
 * ExtendedWebSocketWrapper tests — fixture-backed against the LIVE per-stream
 * protocol (capture 2026-06-11).
 *
 * The real venue model (the old single-multiplexed-socket model with
 * {action:'subscribe'} frames, JSON auth and JSON ping was fictional):
 * - One socket per (stream, market): {base}/{stream}/{market}; the HTTP
 *   upgrade IS the subscription — the client sends ZERO outbound frames.
 * - Keepalive is a server-side WS protocol-level PING (~1s); the runtime
 *   auto-PONGs. No JSON heartbeat exists.
 * - Orderbook: stateful book seeded by SNAPSHOT, mutated by DELTA `c` field,
 *   FULL unified book emitted per frame; `limit` served by slicing the
 *   maintained book (never forwarded as ?depth — depth=10/20 silently fail).
 * - Trades: first frame per (re)connection is a 50-trade HISTORICAL backfill
 *   and is skipped.
 * - Reconnect re-opens the per-stream URL; the fresh SNAPSHOT rebuilds the
 *   book; seq is per-connection (resets to 1 — never persisted).
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ExtendedWebSocketWrapper } from '../../src/adapters/extended/ExtendedWebSocketWrapper.js';
import { EXTENDED_API_URLS } from '../../src/adapters/extended/constants.js';

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
const deltaLines = readNdjson('orderbook_frames_001-020.raw.ndjson');
const tradesBackfillRaw = readFixture('trades_frame_000.raw.json');
const tradesLines = readNdjson('trades_frames_001-020.raw.ndjson');

const STREAM_BASE = 'wss://api.starknet.extended.exchange/stream.extended.exchange/v1';

// Mock WebSocket (house pattern, cf. paradex-ws-orderbook.test.ts)
class MockWebSocket {
  static instances: MockWebSocket[] = [];

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  readyState = this.CONNECTING;
  onopen: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  sentFrames: string[] = [];
  private connectionTimer: NodeJS.Timeout | null = null;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
    this.connectionTimer = setTimeout(() => {
      this.readyState = this.OPEN;
      if (this.onopen) {
        this.onopen({});
      }
    }, 5);
  }

  send(data: string): void {
    this.sentFrames.push(data);
  }

  close(code = 1000, reason = ''): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
    this.readyState = this.CLOSED;
    if (this.onclose) {
      this.onclose({ code, reason });
    }
  }

  /** Simulate a server-side close (e.g. 1006) without client intent */
  simulateServerClose(code = 1006): void {
    this.readyState = this.CLOSED;
    if (this.onclose) {
      this.onclose({ code, reason: '' });
    }
  }

  /** Feed a raw wire string (byte-faithful) into the message handler */
  simulateRaw(raw: string): void {
    if (this.onmessage) {
      this.onmessage({ data: raw });
    }
  }
}

const originalWebSocket = global.WebSocket;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function nextWithTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Test timeout')), ms)),
  ]);
}

describe('ExtendedWebSocketWrapper (live per-stream protocol)', () => {
  let wrapper: ExtendedWebSocketWrapper;

  beforeEach(() => {
    MockWebSocket.instances = [];
    (global as any).WebSocket = jest.fn((url: string) => new MockWebSocket(url));
    wrapper = new ExtendedWebSocketWrapper({
      wsUrl: STREAM_BASE,
      reconnect: true,
      reconnectDelayMs: 10,
    });
  });

  afterEach(async () => {
    wrapper.disconnect();
    await sleep(30);
    global.WebSocket = originalWebSocket as any;
    jest.clearAllMocks();
  });

  describe('per-stream URL = subscription', () => {
    it('opens {base}/orderbooks/{market} and sends ZERO outbound frames', async () => {
      const generator = wrapper.watchOrderBook('BTC/USD:USD');
      const nextPromise = generator.next();
      await sleep(20);

      expect(MockWebSocket.instances).toHaveLength(1);
      const socket = MockWebSocket.instances[0]!;
      expect(socket.url).toBe(`${STREAM_BASE}/orderbooks/BTC-USD`);

      socket.simulateRaw(snapshotRaw);
      await nextWithTimeout(nextPromise);

      // The HTTP upgrade IS the subscription — no subscribe, no auth, no JSON ping
      expect(socket.sentFrames).toHaveLength(0);
      await generator.return(undefined as any);
    });

    it('opens {base}/publicTrades/{market} for trades', async () => {
      const generator = wrapper.watchTrades('BTC/USD:USD');
      const nextPromise = generator.next();
      await sleep(20);

      const socket = MockWebSocket.instances[0]!;
      expect(socket.url).toBe(`${STREAM_BASE}/publicTrades/BTC-USD`);

      socket.simulateRaw(tradesBackfillRaw); // skipped (backfill)
      socket.simulateRaw(tradesLines[0]!);
      await nextWithTimeout(nextPromise);
      expect(socket.sentFrames).toHaveLength(0);
      await generator.return(undefined as any);
    });

    it('never forwards limit as a ?depth query param', async () => {
      const generator = wrapper.watchOrderBook('BTC/USD:USD', 10);
      const nextPromise = generator.next();
      await sleep(20);

      const socket = MockWebSocket.instances[0]!;
      // depth=10/20 SILENTLY FAIL live — limit is served by slicing instead
      expect(socket.url).not.toContain('depth');
      expect(socket.url).toBe(`${STREAM_BASE}/orderbooks/BTC-USD`);

      socket.simulateRaw(snapshotRaw);
      await nextWithTimeout(nextPromise);
      await generator.return(undefined as any);
    });

    it('shares ONE socket between two consumers of the same stream', async () => {
      const gen1 = wrapper.watchOrderBook('BTC/USD:USD');
      const next1 = gen1.next();
      await sleep(20);
      const gen2 = wrapper.watchOrderBook('BTC/USD:USD');
      const next2 = gen2.next();
      await sleep(20);

      expect(MockWebSocket.instances).toHaveLength(1);

      MockWebSocket.instances[0]!.simulateRaw(snapshotRaw);
      const [r1, r2] = await nextWithTimeout(Promise.all([next1, next2]));
      expect(r1.value.bids.length).toBeGreaterThan(0);
      expect(r2.value.bids.length).toBeGreaterThan(0);

      await gen1.return(undefined as any);
      await gen2.return(undefined as any);
    });

    it('opens SEPARATE sockets for different streams', async () => {
      const obGen = wrapper.watchOrderBook('BTC/USD:USD');
      const obNext = obGen.next();
      const trGen = wrapper.watchTrades('BTC/USD:USD');
      const trNext = trGen.next();
      await sleep(20);

      expect(MockWebSocket.instances).toHaveLength(2);
      const urls = MockWebSocket.instances.map((s) => s.url).sort();
      expect(urls).toEqual([
        `${STREAM_BASE}/orderbooks/BTC-USD`,
        `${STREAM_BASE}/publicTrades/BTC-USD`,
      ]);

      // Settle the pending generators so cleanup is deterministic
      MockWebSocket.instances
        .find((s) => s.url.includes('orderbooks'))!
        .simulateRaw(snapshotRaw);
      const tradesSocket = MockWebSocket.instances.find((s) => s.url.includes('publicTrades'))!;
      tradesSocket.simulateRaw(tradesBackfillRaw);
      tradesSocket.simulateRaw(tradesLines[0]!);
      await nextWithTimeout(Promise.all([obNext, trNext]));

      await obGen.return(undefined as any);
      await trGen.return(undefined as any);
    });
  });

  describe('stateful order book streaming', () => {
    it('yields a FULL unified book per frame: SNAPSHOT seed then DELTA apply', async () => {
      const generator = wrapper.watchOrderBook('BTC/USD:USD');
      const first = generator.next();
      await sleep(20);
      const socket = MockWebSocket.instances[0]!;

      socket.simulateRaw(snapshotRaw);
      const snap = await nextWithTimeout(first);
      expect(snap.value.exchange).toBe('extended');
      expect(snap.value.symbol).toBe('BTC/USD:USD');
      expect(snap.value.sequenceId).toBe(1);
      expect(snap.value.bids).toHaveLength(2414);
      expect(snap.value.asks).toHaveLength(5010);
      expect(snap.value.bids[0]).toEqual([61993, 0.3226]);

      const second = generator.next();
      socket.simulateRaw(deltaLines[0]!);
      const delta = await nextWithTimeout(second);
      // Full book emitted (not the 3-level delta); one bid removed via c=="0"
      expect(delta.value.sequenceId).toBe(2);
      expect(delta.value.timestamp).toBe(1781147688731);
      expect(delta.value.bids).toHaveLength(2413);
      expect(delta.value.asks).toHaveLength(5010);
      const bidMap = new Map(delta.value.bids.map(([p, q]: [number, number]) => [p, q]));
      expect(bidMap.get(61979)).toBe(3.19109);
      expect(bidMap.has(40296)).toBe(false);

      await generator.return(undefined as any);
    });

    it('serves limit by slicing the maintained full book', async () => {
      const generator = wrapper.watchOrderBook('BTC/USD:USD', 5);
      const first = generator.next();
      await sleep(20);
      const socket = MockWebSocket.instances[0]!;

      socket.simulateRaw(snapshotRaw);
      const snap = await nextWithTimeout(first);
      expect(snap.value.bids).toHaveLength(5);
      expect(snap.value.asks).toHaveLength(5);
      expect(snap.value.bids[0]).toEqual([61993, 0.3226]);

      // The MAINTAINED book stays full: the next delta still yields top-5
      // sliced from full depth
      const second = generator.next();
      socket.simulateRaw(deltaLines[0]!);
      const delta = await nextWithTimeout(second);
      expect(delta.value.bids).toHaveLength(5);
      expect(delta.value.asks).toHaveLength(5);

      await generator.return(undefined as any);
    });

    it('survives malformed frames and keeps streaming', async () => {
      const generator = wrapper.watchOrderBook('BTC/USD:USD');
      const first = generator.next();
      await sleep(20);
      const socket = MockWebSocket.instances[0]!;

      expect(() => socket.simulateRaw('invalid json {')).not.toThrow();
      expect(() => socket.simulateRaw('{"unexpected":"shape"}')).not.toThrow();

      socket.simulateRaw(snapshotRaw);
      const snap = await nextWithTimeout(first);
      expect(snap.value.bids).toHaveLength(2414);

      await generator.return(undefined as any);
    });
  });

  describe('trades streaming', () => {
    it('skips the 50-trade backfill frame, then yields live trades', async () => {
      const generator = wrapper.watchTrades('BTC/USD:USD');
      const first = generator.next();
      await sleep(20);
      const socket = MockWebSocket.instances[0]!;

      // Frame 1 = HISTORICAL backfill (timestamps predate connect) — skipped
      socket.simulateRaw(tradesBackfillRaw);
      // Frame 2 = first live trade
      socket.simulateRaw(tradesLines[0]!);

      const result = await nextWithTimeout(first);
      expect(result.value.id).toBe('2064909243445678080'); // int64-exact
      expect(result.value.symbol).toBe('BTC/USD:USD');
      expect(result.value.side).toBe('sell');
      expect(result.value.price).toBe(61993);
      expect(result.value.amount).toBe(0.03572);
      expect(result.value.timestamp).toBe(1781147702453);

      await generator.return(undefined as any);
    });

    it('keeps LIQUIDATION flow, tagged via info.tT', async () => {
      const generator = wrapper.watchTrades('BTC/USD:USD');
      const first = generator.next();
      await sleep(20);
      const socket = MockWebSocket.instances[0]!;

      socket.simulateRaw(tradesBackfillRaw);
      socket.simulateRaw(tradesLines[0]!.replace('"tT":"TRADE"', '"tT":"LIQUIDATION"'));

      const result = await nextWithTimeout(first);
      expect((result.value.info as Record<string, unknown>).tT).toBe('LIQUIDATION');

      await generator.return(undefined as any);
    });
  });

  describe('reconnect', () => {
    it('re-opens the per-stream URL and rebuilds from the fresh SNAPSHOT (seq resets)', async () => {
      const generator = wrapper.watchOrderBook('BTC/USD:USD');
      const first = generator.next();
      await sleep(20);
      const socket1 = MockWebSocket.instances[0]!;

      socket1.simulateRaw(snapshotRaw);
      const snap1 = await nextWithTimeout(first);
      expect(snap1.value.sequenceId).toBe(1);

      const second = generator.next();
      socket1.simulateRaw(deltaLines[0]!);
      expect((await nextWithTimeout(second)).value.sequenceId).toBe(2);

      // Server drops the connection → wrapper reconnects to the SAME URL
      const third = generator.next();
      socket1.simulateServerClose(1006);
      await sleep(60);

      expect(MockWebSocket.instances).toHaveLength(2);
      const socket2 = MockWebSocket.instances[1]!;
      expect(socket2.url).toBe(`${STREAM_BASE}/orderbooks/BTC-USD`);
      expect(socket2.sentFrames).toHaveLength(0); // still zero outbound frames

      // Fresh connection ⇒ fresh SNAPSHOT, seq RESET to 1 (never persisted)
      socket2.simulateRaw(snapshotRaw);
      const snap2 = await nextWithTimeout(third);
      expect(snap2.value.sequenceId).toBe(1);
      expect(snap2.value.bids).toHaveLength(2414);

      await generator.return(undefined as any);
    });

    it('re-gates the trades backfill after reconnect', async () => {
      const generator = wrapper.watchTrades('BTC/USD:USD');
      const first = generator.next();
      await sleep(20);
      const socket1 = MockWebSocket.instances[0]!;

      socket1.simulateRaw(tradesBackfillRaw); // skipped
      socket1.simulateRaw(tradesLines[0]!);
      await nextWithTimeout(first);

      const second = generator.next();
      socket1.simulateServerClose(1006);
      await sleep(60);

      const socket2 = MockWebSocket.instances[1]!;
      // New connection sends a new backfill — it must be skipped again
      socket2.simulateRaw(tradesBackfillRaw);
      socket2.simulateRaw(tradesLines[1]!);

      const result = await nextWithTimeout(second);
      const live2 = JSON.parse(tradesLines[1]!);
      expect(result.value.timestamp).toBe(live2.data[0].T);

      await generator.return(undefined as any);
    });

    it('does not reconnect when disabled', async () => {
      const noReconnect = new ExtendedWebSocketWrapper({
        wsUrl: STREAM_BASE,
        reconnect: false,
      });
      const generator = noReconnect.watchOrderBook('BTC/USD:USD');
      const first = generator.next();
      await sleep(20);

      MockWebSocket.instances[0]!.simulateRaw(snapshotRaw);
      await nextWithTimeout(first);

      MockWebSocket.instances[0]!.simulateServerClose(1006);
      await sleep(60);
      expect(MockWebSocket.instances).toHaveLength(1);

      await generator.return(undefined as any);
      noReconnect.disconnect();
    });
  });

  describe('disconnect', () => {
    it('closes all per-stream sockets', async () => {
      const obGen = wrapper.watchOrderBook('BTC/USD:USD');
      const obNext = obGen.next();
      const trGen = wrapper.watchTrades('BTC/USD:USD');
      const trNext = trGen.next();
      await sleep(20);
      expect(MockWebSocket.instances).toHaveLength(2);

      wrapper.disconnect();
      await sleep(20);

      for (const socket of MockWebSocket.instances) {
        expect(socket.readyState).toBe(socket.CLOSED);
      }
      // No reconnect after a client-initiated disconnect
      await sleep(60);
      expect(MockWebSocket.instances).toHaveLength(2);

      void obNext;
      void trNext;
    });

    it('handles disconnect when nothing is open', () => {
      expect(() => wrapper.disconnect()).not.toThrow();
    });
  });
});

describe('Extended WS constants (repair)', () => {
  it('uses the live per-stream base, not the dead ws.starknet host (NXDOMAIN)', () => {
    expect(EXTENDED_API_URLS.mainnet.websocket).toBe(STREAM_BASE);
    expect(EXTENDED_API_URLS.mainnet.websocket).not.toContain('wss://ws.starknet');
    expect(EXTENDED_API_URLS.testnet.websocket).toBe(
      'wss://starknet.sepolia.extended.exchange/stream.extended.exchange/v1'
    );
  });
});

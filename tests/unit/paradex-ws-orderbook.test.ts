/**
 * Paradex WS order book tests — fixture-backed against the LIVE protocol
 * (capture 2026-06-11, wss://ws.api.prod.paradex.trade/v1, strict JSON-RPC 2.0).
 *
 * Fixtures in tests/fixtures/paradex/ are byte-faithful wire payloads:
 * - ws_orderbook_snapshot_frame.json: one `order_book.{m}.snapshot@15@100ms`
 *   data notification ({jsonrpc, method:"subscription", params:{channel, data}})
 *   where the full 15+15 book sits in `inserts` as side-tagged objects.
 * - ws_subscribe_ack_frame.json: success ack {jsonrpc, id, result:{channel}}.
 * - ws_strictness_errors.json: the -32600 rejections the OLD framing produced.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ParadexWebSocketWrapper } from '../../src/adapters/paradex/ParadexWebSocketWrapper.js';
import { ParadexNormalizer } from '../../src/adapters/paradex/ParadexNormalizer.js';
import { paradexOrderBookSnapshotChannel } from '../../src/adapters/paradex/constants.js';

const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'paradex');

function loadFixtureRaw(name: string): string {
  return readFileSync(join(FIXTURE_DIR, name), 'utf8');
}

function loadFixture(name: string): any {
  return JSON.parse(loadFixtureRaw(name));
}

const snapshotFrame = loadFixture('ws_orderbook_snapshot_frame.json');
const ackFrame = loadFixture('ws_subscribe_ack_frame.json');
const strictnessErrors = loadFixture('ws_strictness_errors.json');

const SNAPSHOT_CHANNEL = 'order_book.BTC-USD-PERP.snapshot@15@100ms';

// Mock WebSocket (house pattern, cf. paradex-websocket-wrapper.test.ts)
class MockWebSocket {
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  readyState = this.CONNECTING;
  onopen: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  private connectionTimer: NodeJS.Timeout | null = null;

  constructor(public url: string) {
    this.connectionTimer = setTimeout(() => {
      this.readyState = this.OPEN;
      if (this.onopen) {
        this.onopen({});
      }
    }, 10);
  }

  send(_data: string): void {
    // Mock send
  }

  close(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
    this.readyState = this.CLOSED;
    if (this.onclose) {
      this.onclose({});
    }
  }

  /** Feed a raw wire string (byte-faithful) into the message handler */
  simulateRaw(raw: string): void {
    if (this.onmessage) {
      this.onmessage({ data: raw });
    }
  }

  simulateMessage(data: any): void {
    this.simulateRaw(JSON.stringify(data));
  }
}

const originalWebSocket = global.WebSocket;

describe('Paradex WS order book (live protocol)', () => {
  let wrapper: ParadexWebSocketWrapper;
  let mockWS: MockWebSocket;

  beforeEach(() => {
    jest.useRealTimers();
    (global as any).WebSocket = jest.fn((url: string) => {
      mockWS = new MockWebSocket(url);
      return mockWS;
    });
    wrapper = new ParadexWebSocketWrapper({
      wsUrl: 'wss://ws.api.prod.paradex.trade/v1',
    });
  });

  afterEach(async () => {
    if (wrapper) {
      wrapper.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    global.WebSocket = originalWebSocket as any;
    jest.clearAllMocks();
  });

  describe('channel name', () => {
    it('builds the live snapshot channel (not the dead orderbook.{m} channel)', () => {
      const channel = paradexOrderBookSnapshotChannel('BTC-USD-PERP');
      expect(channel).toBe(SNAPSHOT_CHANNEL);
      // The OLD channel was rejected live with -32600 "invalid channel"
      expect(channel).not.toBe('orderbook.BTC-USD-PERP');
    });
  });

  describe('subscribe frame shape', () => {
    it('sends a strict JSON-RPC 2.0 subscribe frame', async () => {
      await wrapper.connect();
      const sendSpy = jest.spyOn(mockWS, 'send');

      const generator = wrapper.watchOrderBook('BTC/USD:USD');
      const nextPromise = generator.next();

      // Wait for the subscribe frame, then feed data so the generator yields
      await new Promise((resolve) => setTimeout(resolve, 30));
      mockWS.simulateMessage(snapshotFrame);
      await Promise.race([
        nextPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 3000)),
      ]);

      expect(sendSpy).toHaveBeenCalled();
      const frame = JSON.parse(sendSpy.mock.calls[0][0] as string);

      // The exact bug: a frame without "jsonrpc":"2.0" is rejected with
      // {"error":{"code":-32600,"message":"invalid request object"}}
      expect(frame.jsonrpc).toBe('2.0');
      expect(frame).toEqual({
        jsonrpc: '2.0',
        method: 'subscribe',
        params: { channel: SNAPSHOT_CHANNEL },
        id: expect.any(Number),
      });

      // Contrast with the captured strictness errors (numeric -32600 codes)
      expect(strictnessErrors[0].error.code).toBe(-32600);
      expect(strictnessErrors[1].error.data).toBe('invalid channel');

      await generator.return(undefined as any);
    });
  });

  describe('envelope parse + dispatch', () => {
    it('dispatches params.data from the nested JSON-RPC subscription envelope', async () => {
      await wrapper.connect();

      const generator = wrapper.watchOrderBook('BTC/USD:USD');
      const nextPromise = generator.next();

      // Feed the byte-faithful captured frame (channel/data nested under params)
      await new Promise((resolve) => setTimeout(resolve, 30));
      mockWS.simulateRaw(loadFixtureRaw('ws_orderbook_snapshot_frame.json'));

      const result = await Promise.race([
        nextPromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Test timeout')), 3000)
        ),
      ]);

      expect(result.done).toBe(false);
      expect(result.value.symbol).toBe('BTC/USD:USD');
      expect(result.value.exchange).toBe('paradex');
      // Regression vs the old empty-book bug (decoder read data.bids/data.asks)
      expect(result.value.bids.length).toBeGreaterThan(0);
      expect(result.value.asks.length).toBeGreaterThan(0);

      await generator.return(undefined as any);
    });

    it('does not gate data on the subscribe ack (data can arrive BEFORE ack)', async () => {
      await wrapper.connect();

      const generator = wrapper.watchOrderBook('BTC/USD:USD');
      const nextPromise = generator.next();

      // Captured ordering gotcha: frame 0 = data notification, frame 1 = ack
      await new Promise((resolve) => setTimeout(resolve, 30));
      mockWS.simulateMessage(snapshotFrame);
      mockWS.simulateMessage(ackFrame);

      const result = await Promise.race([
        nextPromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Test timeout')), 3000)
        ),
      ]);

      expect(result.done).toBe(false);
      expect(result.value.bids.length).toBeGreaterThan(0);
      expect(result.value.asks.length).toBeGreaterThan(0);

      await generator.return(undefined as any);
    });

    it('survives real error frames ({code:number,message,data})', async () => {
      await wrapper.connect();
      for (const errFrame of strictnessErrors) {
        expect(() => mockWS.simulateMessage(errFrame)).not.toThrow();
      }
      expect(wrapper.connected).toBe(true);
    });
  });

  describe('normalizeWSOrderBook', () => {
    const normalizer = new ParadexNormalizer();

    it('partitions side-tagged inserts into a sorted unified book', () => {
      const book = normalizer.normalizeWSOrderBook(snapshotFrame.params.data);

      expect(book.symbol).toBe('BTC/USD:USD');
      expect(book.exchange).toBe('paradex');
      expect(book.timestamp).toBe(1781122628860);
      expect(book.sequenceId).toBe(7510711798);

      // Full 15+15 book from the @15 snapshot channel
      expect(book.bids).toHaveLength(15);
      expect(book.asks).toHaveLength(15);

      // Top of book from the capture
      expect(book.bids[0]).toEqual([61706.7, 0.01484]);
      expect(book.asks[0]).toEqual([61726.5, 0.02265]);

      // bids DESC, asks ASC
      for (let i = 1; i < book.bids.length; i++) {
        expect(book.bids[i]![0]).toBeLessThan(book.bids[i - 1]![0]);
      }
      for (let i = 1; i < book.asks.length; i++) {
        expect(book.asks[i]![0]).toBeGreaterThan(book.asks[i - 1]![0]);
      }

      // Sanity: book not crossed
      expect(book.bids[0]![0]).toBeLessThan(book.asks[0]![0]);
    });

    it('rejects delta frames (DELTAS DEFERRED — snapshot channel only)', () => {
      const deltaFrame = {
        ...snapshotFrame.params.data,
        update_type: 'd',
      };
      expect(() => normalizer.normalizeWSOrderBook(deltaFrame)).toThrow();
    });
  });
});

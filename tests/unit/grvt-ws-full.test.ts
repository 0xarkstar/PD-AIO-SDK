/**
 * GRVT WS `/ws/full` repair tests — fixture-backed against the LIVE protocol
 * (captures 2026-06-11 mainnet, byte-faithful in tests/fixtures/grvt/).
 *
 * Root cause (proven live): the SDK already built the correct JSON-RPC
 * subscribe frame but connected to the LEGACY `/ws` path, which expects a
 * different envelope and answers `{"code":1003,"message":"...malformed
 * syntax","status":400}` (ws-capture-A.jsonl). That error frame has no
 * `stream`/`feed` keys, so the wrapper silently dropped it -> unrecoverable
 * silent hang. On `/ws/full` the SAME frame gets a clean JSON-RPC ack and then
 * `v1.book.s` / `v1.trade` feed frames (ws-capture-B.jsonl).
 *
 * Pins:
 * - all six WS URLs use `/ws/full` (mainnet+testnet x marketData+trades+alias);
 * - the captured ack parses without crashing; book/trade feed frames decode;
 * - `OrderBook.sequenceId` is populated from the frame `sequence_number`
 *   (initial-subscription replay arrives with sequence_number "0" — the burst
 *   must be tolerated, NOT used for delta logic);
 * - subscribe-error frames (legacy `{code,message,status}` and JSON-RPC
 *   `{error:{code,message}}`) are SURFACED to the stream consumer.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { GRVTWebSocketWrapper } from '../../src/adapters/grvt/GRVTWebSocketWrapper.js';
import { GRVT_API_URLS } from '../../src/adapters/grvt/constants.js';

const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'grvt');

interface CaptureLine {
  dir: 'sent' | 'recv';
  ts: number;
  raw: string;
}

function loadCapture(name: string): CaptureLine[] {
  return readFileSync(join(FIXTURE_DIR, name), 'utf8')
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l) as CaptureLine);
}

const captureB = loadCapture('ws-capture-B.jsonl');
const captureA = loadCapture('ws-capture-A.jsonl');

/** recv frames of capture B, JSON-parsed alongside their raw text. */
const recvB = captureB
  .filter((l) => l.dir === 'recv')
  .map((l) => ({ raw: l.raw, frame: JSON.parse(l.raw) as Record<string, any> }));

const bookAck = recvB.find((f) => f.frame.method === 'subscribe' && f.frame.result?.stream === 'v1.book.s')!;
const bookReplayFrame = recvB.find((f) => f.frame.stream === 'v1.book.s' && f.frame.sequence_number === '0')!;
const bookLiveFrame = recvB.find((f) => f.frame.stream === 'v1.book.s' && f.frame.sequence_number !== '0')!;
const tradeFrame = recvB.find((f) => f.frame.stream === 'v1.trade')!;
const sentBookSubscribe = JSON.parse(captureB.find((l) => l.dir === 'sent')!.raw) as Record<string, any>;

/** The byte-exact legacy error the dead `/ws` path produced (capture A). */
const legacyErrorRaw = captureA.find((l) => l.dir === 'recv' && l.raw.includes('"code":1003'))!.raw;

/**
 * Controllable fake WebSocketClient (house pattern, cf. grvt-websocket.test.ts).
 */
class FakeClient {
  connected = false;
  sent: string[] = [];
  private handlers = new Map<string, Array<(arg: unknown) => void>>();

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
    this.sent.push(typeof data === 'string' ? data : JSON.stringify(data));
  }
  on(event: string, handler: (arg: unknown) => void): this {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
    return this;
  }
  off(event: string, handler: (arg: unknown) => void): this {
    const list = this.handlers.get(event) ?? [];
    this.handlers.set(
      event,
      list.filter((h) => h !== handler)
    );
    return this;
  }
  emit(event: string, arg: unknown): void {
    for (const h of this.handlers.get(event) ?? []) h(arg);
  }
}

function makeWrapper(): { wrapper: GRVTWebSocketWrapper; publicClient: FakeClient } {
  const wrapper = new GRVTWebSocketWrapper({});
  const publicClient = new FakeClient();
  (wrapper as any).publicClient = publicClient;
  return { wrapper, publicClient };
}

async function tick(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('GRVT WS /ws/full repair', () => {
  describe('constants: WS URLs', () => {
    it.each([
      ['mainnet websocketMarketData', GRVT_API_URLS.mainnet.websocketMarketData],
      ['mainnet websocketTrades', GRVT_API_URLS.mainnet.websocketTrades],
      ['mainnet websocket (alias)', GRVT_API_URLS.mainnet.websocket],
      ['testnet websocketMarketData', GRVT_API_URLS.testnet.websocketMarketData],
      ['testnet websocketTrades', GRVT_API_URLS.testnet.websocketTrades],
      ['testnet websocket (alias)', GRVT_API_URLS.testnet.websocket],
    ])('%s uses the JSON-RPC /ws/full path (NOT the legacy /ws)', (_name, url) => {
      expect(url.endsWith('/ws/full')).toBe(true);
    });
  });

  describe('subscribe frame', () => {
    it('matches the live-acked captured frame byte shape', async () => {
      const { wrapper, publicClient } = makeWrapper();
      const iterator = wrapper.watchOrderBook('BTC/USDT:USDT', 10)[Symbol.asyncIterator]();
      const pending = iterator.next();
      await tick();

      const sub = JSON.parse(publicClient.sent[0]!);
      // Captured sent frame got a clean ack on /ws/full (capture B).
      expect(sub.jsonrpc).toBe(sentBookSubscribe.jsonrpc);
      expect(sub.method).toBe(sentBookSubscribe.method);
      expect(sub.params).toEqual(sentBookSubscribe.params);

      // settle the pending next() so the generator can clean up
      publicClient.emit('message', bookReplayFrame.raw);
      await pending;
      await iterator.return?.(undefined);
    });
  });

  describe('feed decoding (byte-faithful frames from capture B)', () => {
    it('ignores the JSON-RPC subscribe ack and decodes the replay book frame (sequence_number "0")', async () => {
      const { wrapper, publicClient } = makeWrapper();
      const iterator = wrapper.watchOrderBook('BTC/USDT:USDT', 10)[Symbol.asyncIterator]();
      const next = iterator.next();
      await tick();

      publicClient.emit('message', bookAck.raw); // must not crash or emit
      publicClient.emit('message', bookReplayFrame.raw);

      const { value: book } = await next;
      expect(book.exchange).toBe('grvt');
      expect(book.symbol).toBe('BTC/USDT:USDT');
      // initial-subscription replay: sequence_number "0" must be tolerated
      expect(book.sequenceId).toBe(0);
      // ns event_time -> ms
      const expectedMs = Number((bookReplayFrame.frame.feed.event_time as string).slice(0, -6));
      expect(book.timestamp).toBe(expectedMs);
      expect(book.bids.length).toBeGreaterThan(0);
      expect(book.asks.length).toBeGreaterThan(0);

      await iterator.return?.(undefined);
    });

    it('populates sequenceId from a live frame sequence_number', async () => {
      const { wrapper, publicClient } = makeWrapper();
      const iterator = wrapper.watchOrderBook('BTC/USDT:USDT', 10)[Symbol.asyncIterator]();
      const next = iterator.next();
      await tick();

      publicClient.emit('message', bookLiveFrame.raw);

      const { value: book } = await next;
      expect(book.sequenceId).toBe(Number(bookLiveFrame.frame.sequence_number));
      expect(book.sequenceId).toBeGreaterThan(0);

      await iterator.return?.(undefined);
    });

    it('decodes a captured v1.trade frame with ms timestamp', async () => {
      const { wrapper, publicClient } = makeWrapper();
      const iterator = wrapper.watchTrades('BTC/USDT:USDT')[Symbol.asyncIterator]();
      const next = iterator.next();
      await tick();

      publicClient.emit('message', tradeFrame.raw);

      const { value: trade } = await next;
      expect(trade.id).toBe(tradeFrame.frame.feed.trade_id);
      expect(trade.side).toBe(tradeFrame.frame.feed.is_taker_buyer ? 'buy' : 'sell');
      const expectedMs = Number((tradeFrame.frame.feed.event_time as string).slice(0, -6));
      expect(trade.timestamp).toBe(expectedMs);

      await iterator.return?.(undefined);
    });
  });

  describe('subscribe-error surfacing (kills the silent-hang failure mode)', () => {
    it('surfaces the legacy {code,message,status} error frame (byte-exact from capture A)', async () => {
      const { wrapper, publicClient } = makeWrapper();
      const iterator = wrapper.watchOrderBook('BTC/USDT:USDT', 10)[Symbol.asyncIterator]();
      const next = iterator.next();
      await tick();

      publicClient.emit('message', legacyErrorRaw);

      await expect(next).rejects.toThrow(/1003|malformed/i);
    });

    it('surfaces a JSON-RPC {error:{code,message}} frame', async () => {
      const { wrapper, publicClient } = makeWrapper();
      const iterator = wrapper.watchTrades('BTC/USDT:USDT')[Symbol.asyncIterator]();
      const next = iterator.next();
      await tick();

      // Synthetic (shape per JSON-RPC 2.0; not observed live on /ws/full).
      publicClient.emit(
        'message',
        JSON.stringify({ jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: 1 })
      );

      await expect(next).rejects.toThrow(/-32600|Invalid Request/);
    });
  });

  describe('heartbeat (live-proven error-1107 regression)', () => {
    it('disables the generic JSON {"type":"ping"} heartbeat on both clients', () => {
      // /ws/full is JSON-RPC: the WebSocketClient default {"type":"ping"}
      // frame is answered with error 1107 ("JSON RPC version must be 2.0"),
      // which the error-surfacing path above (correctly) delivers to every
      // stream consumer ~30s after connect — live-proven 2026-06-11 smoke.
      const wrapper = new GRVTWebSocketWrapper({});
      for (const key of ['publicClient', 'tradeClient'] as const) {
        const client = (wrapper as any)[key];
        expect(client.heartbeatConfig.enabled).toBe(false);
      }
    });
  });
});

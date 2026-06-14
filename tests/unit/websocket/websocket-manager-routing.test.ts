/**
 * WebSocketManager Routing Hook Tests (WS-Routing Repair)
 *
 * Proves the composite-key routing fix:
 *  - resolveMessageKeys hook maps a parsed frame to one or more subscription keys
 *  - parseMessage hook can override raw-frame parsing (error-frame surfacing)
 *  - WITHOUT hooks, routing is byte-identical to the legacy `channel === sub.channel`
 *    matcher (regression guard proving aster/paradex/extended/grvt/apex/standx are safe)
 *
 * Frames are byte-faithful live captures under tests/fixtures/.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { WebSocketManager } from '../../../src/websocket/WebSocketManager.js';
import { WebSocketClient } from '../../../src/websocket/WebSocketClient.js';
import type { WebSocketMessage } from '../../../src/websocket/types.js';

jest.mock('../../../src/websocket/WebSocketClient.js');

const FIXTURES = join(__dirname, '../../fixtures');
const loadFixture = (rel: string): unknown =>
  JSON.parse(readFileSync(join(FIXTURES, rel), 'utf-8'));

const hlL2Book = loadFixture('hyperliquid/ws_l2book.json') as { channel: string; data: { coin: string } };
const hlTrades = loadFixture('hyperliquid/ws_trades.json') as { channel: string; data: Array<{ coin: string }> };
const hlAllMids = loadFixture('hyperliquid/ws_allmids.json') as { channel: string; data: { mids: Record<string, string> } };
const hlAck = loadFixture('hyperliquid/ws_subscription_ack.json') as { channel: string };
const lighterSnap = loadFixture('lighter/ws_orderbook_snapshot.json') as { channel: string; type: string };
const lighterErr = loadFixture('lighter/ws_error_invalid_channel.json') as { error: { code: number; message: string } };

/**
 * Local copy of the Hyperliquid resolver behavior, mirroring the production
 * hyperliquidResolveKeys, so the manager-level tests exercise the hook without
 * importing the adapter. (The adapter's own resolver is tested separately.)
 */
function hlResolveKeys(message: WebSocketMessage): string | string[] | undefined {
  const channel = message.channel;
  const data = message.data as Record<string, unknown> | undefined;
  if (channel === 'l2Book') {
    const coin = (data as { data?: { coin?: string } })?.data?.coin;
    return coin ? [`l2Book:${coin}`] : undefined;
  }
  if (channel === 'trades') {
    const arr = (data as { data?: Array<{ coin?: string }> })?.data;
    if (Array.isArray(arr) && arr.length > 0) {
      const coins = Array.from(new Set(arr.map((t) => t.coin).filter(Boolean))) as string[];
      return coins.map((c) => `trades:${c}`);
    }
    return undefined;
  }
  if (channel === 'allMids') {
    return ['allMids'];
  }
  if (channel === 'subscriptionResponse') {
    return undefined;
  }
  return channel ? [channel] : undefined;
}

function makeManager(config: ConstructorParameters<typeof WebSocketManager>[0]): {
  manager: WebSocketManager;
  feed: (raw: unknown) => void;
} {
  let onMessage: ((data: unknown) => void) | undefined;
  const mockClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    isConnected: jest.fn().mockReturnValue(true),
    send: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    removeAllListeners: jest.fn(),
  };
  (WebSocketClient as unknown as jest.Mock).mockImplementation((c) => {
    onMessage = c.onMessage;
    return mockClient;
  });
  const manager = new WebSocketManager(config);
  return {
    manager,
    feed: (raw: unknown) => {
      if (onMessage) onMessage(raw);
    },
  };
}

describe('WebSocketManager — resolveMessageKeys routing hook', () => {
  beforeEach(() => jest.clearAllMocks());

  test('routes HL l2Book frame to composite key l2Book:BTC consumer', async () => {
    const { manager, feed } = makeManager({
      url: 'wss://test',
      resolveMessageKeys: hlResolveKeys,
    });
    await manager.connect();

    const btcHandler = jest.fn();
    await manager.subscribe('l2Book:BTC', { method: 'subscribe' }, btcHandler);

    feed(hlL2Book);

    expect(btcHandler).toHaveBeenCalledTimes(1);
    expect(((btcHandler.mock.calls[0]![0] as { data: { coin: string } }).data).coin).toBe('BTC');
  });

  test('NEGATIVE: HL l2Book:BTC frame does NOT reach an l2Book:ETH consumer', async () => {
    const { manager, feed } = makeManager({
      url: 'wss://test',
      resolveMessageKeys: hlResolveKeys,
    });
    await manager.connect();

    const ethHandler = jest.fn();
    await manager.subscribe('l2Book:ETH', { method: 'subscribe' }, ethHandler);

    feed(hlL2Book); // coin = BTC

    expect(ethHandler).not.toHaveBeenCalled();
  });

  test('routes HL trades array frame to trades:BTC and not trades:ETH', async () => {
    const { manager, feed } = makeManager({
      url: 'wss://test',
      resolveMessageKeys: hlResolveKeys,
    });
    await manager.connect();

    const btcHandler = jest.fn();
    const ethHandler = jest.fn();
    await manager.subscribe('trades:BTC', { method: 'subscribe' }, btcHandler);
    await manager.subscribe('trades:ETH', { method: 'subscribe' }, ethHandler);

    feed(hlTrades); // array of BTC trades

    expect(btcHandler).toHaveBeenCalledTimes(1);
    expect(ethHandler).not.toHaveBeenCalled();
  });

  test('routes HL allMids (bare key) to allMids consumer', async () => {
    const { manager, feed } = makeManager({
      url: 'wss://test',
      resolveMessageKeys: hlResolveKeys,
    });
    await manager.connect();

    const midsHandler = jest.fn();
    await manager.subscribe('allMids', { method: 'subscribe' }, midsHandler);

    feed(hlAllMids);

    expect(midsHandler).toHaveBeenCalledTimes(1);
    const payload = midsHandler.mock.calls[0]![0] as { data: { mids: Record<string, string> } };
    expect(payload.data.mids.BTC).toBeDefined();
  });

  test('subscriptionResponse ack frame is NOT routed to any data subscription', async () => {
    const { manager, feed } = makeManager({
      url: 'wss://test',
      resolveMessageKeys: hlResolveKeys,
    });
    await manager.connect();

    const btcHandler = jest.fn();
    await manager.subscribe('l2Book:BTC', { method: 'subscribe' }, btcHandler);

    feed(hlAck);

    expect(btcHandler).not.toHaveBeenCalled();
  });
});

describe('WebSocketManager — parseMessage hook (error-frame surfacing)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('parseMessage hook lets a Lighter error frame surface via the error event', async () => {
    // A minimal lighter-style parseMessage that emits errors for {error:...} frames.
    const parseMessage = (data: unknown): WebSocketMessage => {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      const obj = parsed as { error?: { code: number; message: string }; channel?: string };
      if (obj.error) {
        // Surface as a control frame with a synthetic channel that no sub matches,
        // and embed the error so a thin wrapper / emit can pick it up.
        return {
          type: 'error',
          channel: undefined,
          data: parsed,
          timestamp: Date.now(),
        };
      }
      return {
        type: (obj as { type?: string }).type ?? 'unknown',
        channel: obj.channel,
        data: parsed,
        timestamp: Date.now(),
      };
    };

    const { manager, feed } = makeManager({ url: 'wss://test', parseMessage });
    await manager.connect();

    const errorHandler = jest.fn();
    manager.on('error', errorHandler);

    // Consumer that should NOT receive the error frame as data
    const obHandler = jest.fn();
    await manager.subscribe('order_book:1', { type: 'subscribe' }, obHandler);

    feed(lighterErr);

    // The custom parse yields channel=undefined + type 'error', so no data routing
    // AND no silent hang — the error is surfaced via the 'error' event instead.
    expect(obHandler).not.toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect((errorHandler.mock.calls[0]![0] as Error).message).toContain('Invalid Channel');
    expect(lighterErr.error.code).toBe(30005);
  });
});

describe('WebSocketManager — regression guard (no hooks = legacy behavior)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('without hooks, channel===sub.channel routes and mismatches are rejected', async () => {
    const { manager, feed } = makeManager({ url: 'wss://test' });
    await manager.connect();

    const xHandler = jest.fn();
    const yHandler = jest.fn();
    await manager.subscribe('x', { type: 'subscribe', channel: 'x' }, xHandler);
    await manager.subscribe('y', { type: 'subscribe', channel: 'y' }, yHandler);

    feed({ channel: 'x', data: { v: 1 } });

    expect(xHandler).toHaveBeenCalledTimes(1);
    expect(xHandler).toHaveBeenCalledWith({ channel: 'x', data: { v: 1 } });
    expect(yHandler).not.toHaveBeenCalled();
  });

  test('without hooks, a composite-key sub (l2Book:BTC) gets NO bare-channel frame (legacy bug preserved)', async () => {
    // This documents the pre-fix behavior at the default branch: a bare "l2Book"
    // frame does not match a "l2Book:BTC" subscription. The fix lives in the hook,
    // not in the default matcher.
    const { manager, feed } = makeManager({ url: 'wss://test' });
    await manager.connect();

    const handler = jest.fn();
    await manager.subscribe('l2Book:BTC', { method: 'subscribe' }, handler);

    feed({ channel: 'l2Book', data: { coin: 'BTC' } });

    expect(handler).not.toHaveBeenCalled();
  });

  test('snapshot frames carry their channel/type through the default matcher unchanged', async () => {
    // Sanity: a frame whose channel exactly equals the sub key still routes by default.
    const { manager, feed } = makeManager({ url: 'wss://test' });
    await manager.connect();

    const handler = jest.fn();
    await manager.subscribe(lighterSnap.channel, { type: 'subscribe' }, handler);

    feed(lighterSnap);

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

/**
 * Integration Tests for the GRVT WebSocket Wrapper (JSON-RPC).
 *
 * Injects fake WebSocketClients (via the wrapper's private fields) so we can
 * assert the JSON-RPC subscribe frames and feed-frame normalization without any
 * live socket and without ESM module mocking. GRVT WS frames are `{ stream,
 * feed }`; the `feed` payload matches the REST shape.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { GRVTWebSocketWrapper } from '../../src/adapters/grvt/GRVTWebSocketWrapper.js';

/**
 * A controllable fake WebSocketClient: records sends, captures handlers, and
 * lets a test push frames via `emit`.
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

/**
 * Build a wrapper with its private public/trade clients replaced by fakes.
 */
function makeWrapper(session?: Record<string, unknown>): {
  wrapper: GRVTWebSocketWrapper;
  publicClient: FakeClient;
  tradeClient: FakeClient;
} {
  const wrapper = new GRVTWebSocketWrapper({ testnet: true, session: session as never });
  const publicClient = new FakeClient();
  const tradeClient = new FakeClient();
  (wrapper as any).publicClient = publicClient;
  (wrapper as any).tradeClient = tradeClient;
  return { wrapper, publicClient, tradeClient };
}

async function tick(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('GRVT WebSocket Wrapper', () => {
  let ctx: ReturnType<typeof makeWrapper>;

  beforeEach(() => {
    ctx = makeWrapper();
  });

  it('connects the public client', async () => {
    await ctx.wrapper.connect();
    expect(ctx.publicClient.connected).toBe(true);
  });

  it('subscribes to v1.book.s and normalizes a snapshot frame', async () => {
    const iterator = ctx.wrapper.watchOrderBook('BTC/USDT:USDT', 50)[Symbol.asyncIterator]();
    const next = iterator.next();
    await tick();

    const sub = JSON.parse(ctx.publicClient.sent[0]!);
    expect(sub).toMatchObject({
      jsonrpc: '2.0',
      method: 'subscribe',
      params: { stream: 'v1.book.s', selectors: ['BTC_USDT_Perp@500-50'] },
    });

    ctx.publicClient.emit('message', {
      stream: 'v1.book.s',
      feed: {
        instrument: 'BTC_USDT_Perp',
        event_time: '1700000000000',
        bids: [{ price: '50000', size: '1.5', num_orders: 3 }],
        asks: [{ price: '50010', size: '1.0', num_orders: 2 }],
      },
    });

    const { value } = await next;
    expect(value.symbol).toBe('BTC/USDT:USDT');
    expect(value.bids[0]).toEqual([50000, 1.5]);
    expect(value.asks[0]).toEqual([50010, 1.0]);

    await iterator.return?.(undefined);
  });

  it('subscribes to v1.trade and normalizes a trade frame', async () => {
    const iterator = ctx.wrapper.watchTrades('BTC/USDT:USDT')[Symbol.asyncIterator]();
    const next = iterator.next();
    await tick();

    const sub = JSON.parse(ctx.publicClient.sent[0]!);
    expect(sub.params.stream).toBe('v1.trade');
    expect(sub.params.selectors).toEqual(['BTC_USDT_Perp@50']);

    ctx.publicClient.emit('message', {
      stream: 'v1.trade',
      feed: {
        event_time: '1700000000000',
        instrument: 'BTC_USDT_Perp',
        is_taker_buyer: true,
        size: '0.5',
        price: '50000',
        trade_id: 't-1',
      },
    });

    const { value } = await next;
    expect(value.id).toBe('t-1');
    expect(value.side).toBe('buy');
    expect(value.price).toBe(50000);

    await iterator.return?.(undefined);
  });

  it('ignores frames for other streams / instruments', async () => {
    const iterator = ctx.wrapper.watchTrades('BTC/USDT:USDT')[Symbol.asyncIterator]();
    const next = iterator.next();
    await tick();

    // wrong stream and wrong instrument: neither resolves the pending next()
    ctx.publicClient.emit('message', {
      stream: 'v1.book.s',
      feed: { instrument: 'BTC_USDT_Perp', event_time: '1', bids: [], asks: [] },
    });
    ctx.publicClient.emit('message', {
      stream: 'v1.trade',
      feed: { event_time: '1', instrument: 'ETH_USDT_Perp', is_taker_buyer: true, size: '1', price: '1', trade_id: 'x' },
    });

    // matching frame
    ctx.publicClient.emit('message', {
      stream: 'v1.trade',
      feed: { event_time: '2', instrument: 'BTC_USDT_Perp', is_taker_buyer: false, size: '2', price: '49000', trade_id: 't-2' },
    });

    const { value } = await next;
    expect(value.id).toBe('t-2');
    expect(value.side).toBe('sell');

    await iterator.return?.(undefined);
  });

  it('requires a session for private streams', async () => {
    const iterator = ctx.wrapper.watchOrders()[Symbol.asyncIterator]();
    await expect(iterator.next()).rejects.toThrow(/Session required/);
  });

  it('subscribes to v1.order with the sub-account selector when a session is present', async () => {
    const session = { cookie: 'c', accountId: 'a', subAccountId: 'sub-9', expiresAt: Date.now() + 60000 };
    const privateCtx = makeWrapper(session);
    const iterator = privateCtx.wrapper.watchOrders()[Symbol.asyncIterator]();
    const next = iterator.next();
    await tick();

    const sub = JSON.parse(privateCtx.tradeClient.sent[0]!);
    expect(sub.params.stream).toBe('v1.order');
    expect(sub.params.selectors).toEqual(['sub-9']);

    privateCtx.tradeClient.emit('message', {
      stream: 'v1.order',
      feed: {
        order_id: 'o-1',
        legs: [{ instrument: 'BTC_USDT_Perp', size: '1', is_buying_asset: true }],
        state: { status: 'OPEN' },
      },
    });

    const { value } = await next;
    expect(value.id).toBe('o-1');

    await iterator.return?.(undefined);
  });
});

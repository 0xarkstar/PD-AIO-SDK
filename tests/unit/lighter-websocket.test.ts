/**
 * LighterWebSocket Unit Tests
 *
 * Tests for WebSocket streaming handler — construction, auth checks, subscriptions.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { LighterWebSocket } from '../../src/adapters/lighter/LighterWebSocket.js';
import type { LighterWebSocketDeps } from '../../src/adapters/lighter/LighterWebSocket.js';

function createMockDeps(overrides: Partial<LighterWebSocketDeps> = {}): LighterWebSocketDeps {
  return {
    wsManager: {
      watch: jest.fn<any>().mockReturnValue((async function* () {})()),
    } as any,
    normalizer: {
      toLighterSymbol: jest.fn((s: string) => s.replace('/USDC:USDC', 'USDC')),
      normalizeOrderBook: jest.fn((data: any) => data),
      normalizeTrade: jest.fn((data: any) => data),
      normalizeTicker: jest.fn((data: any) => data),
      normalizePosition: jest.fn((data: any) => data),
      normalizeOrder: jest.fn((data: any) => data),
      normalizeBalance: jest.fn((data: any) => data),
    } as any,
    signer: null,
    apiKey: undefined,
    accountIndex: 0,
    apiKeyIndex: 255,
    hasAuthentication: false,
    hasWasmSigning: false,
    // Lighter addresses WS markets by integer market_id; seed BTC=1, ETH=0
    // (BTCUSDC/ETHUSDC are what the mock toLighterSymbol returns).
    marketIdCache: new Map<string, number>([
      ['BTCUSDC', 1],
      ['ETHUSDC', 0],
    ]),
    ensureMarkets: jest.fn<any>().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('LighterWebSocket', () => {
  let deps: LighterWebSocketDeps;
  let ws: LighterWebSocket;

  beforeEach(() => {
    deps = createMockDeps();
    ws = new LighterWebSocket(deps);
  });

  describe('constructor', () => {
    it('should create instance', () => {
      expect(ws).toBeInstanceOf(LighterWebSocket);
    });
  });

  // =========================================================================
  // Public streams (no auth required)
  // =========================================================================
  describe('watchOrderBook', () => {
    it('should subscribe with slash-form wire channel and colon-form routing key', async () => {
      const gen = ws.watchOrderBook('BTC/USDC:USDC');
      await gen.next();

      // Routing key (colon, matches server echo) + wire subscribe (slash, no symbol).
      expect(deps.wsManager.watch).toHaveBeenCalledWith(
        'order_book:1',
        expect.objectContaining({ type: 'subscribe', channel: 'order_book/1' })
      );
      // No legacy `symbol` field on the wire.
      const sub = (deps.wsManager.watch as jest.Mock).mock.calls[0][1] as Record<string, unknown>;
      expect(sub).not.toHaveProperty('symbol');
    });

    it('should yield normalized order book from a raw wire frame', async () => {
      const rawFrame = {
        channel: 'order_book:1',
        type: 'subscribed/order_book',
        timestamp: 123,
        order_book: {
          asks: [{ price: '64474.8', size: '0.00007' }],
          bids: [{ price: '64474.7', size: '0.05086' }],
        },
      };
      const normalized = { bids: [], asks: [], symbol: 'BTC/USDC:USDC', timestamp: 123 };
      (deps.normalizer.normalizeOrderBook as jest.Mock).mockReturnValue(normalized);
      (deps.wsManager.watch as jest.Mock).mockReturnValue(
        (async function* () { yield rawFrame; })()
      );

      const gen = ws.watchOrderBook('BTC/USDC:USDC');
      const result = await gen.next();

      expect(result.value).toBe(normalized);
      // Transformed shape passed to the normalizer: number tuples + symbol.
      const passed = (deps.normalizer.normalizeOrderBook as jest.Mock).mock.calls[0][0];
      expect(passed.asks).toEqual([[64474.8, 0.00007]]);
      expect(passed.bids).toEqual([[64474.7, 0.05086]]);
    });

    it('should throw a clear error for an unknown market', async () => {
      const gen = ws.watchOrderBook('UNKNOWN/USDC:USDC');
      await expect(gen.next()).rejects.toThrow(/Unknown Lighter market/);
    });

    it('folds snapshot + delta into a full uncrossed book (delete on size 0)', async () => {
      // Live truth: "subscribed/order_book" = full snapshot; "update/order_book"
      // carries only CHANGED levels (absolute size; size "0" deletes). Without
      // folding, a raw delta frame is partial/crossed.
      const snapshot = {
        channel: 'order_book:1',
        type: 'subscribed/order_book',
        timestamp: 1,
        order_book: {
          bids: [
            { price: '100.0', size: '1.0' },
            { price: '99.0', size: '2.0' },
          ],
          asks: [
            { price: '101.0', size: '1.5' },
            { price: '102.0', size: '2.5' },
          ],
        },
      };
      // Delta: replace 99.0 bid size, delete the 101.0 ask (size 0), add 103.0 ask.
      const delta = {
        channel: 'order_book:1',
        type: 'update/order_book',
        timestamp: 2,
        order_book: {
          bids: [{ price: '99.0', size: '5.0' }],
          asks: [
            { price: '101.0', size: '0.00000' },
            { price: '103.0', size: '3.0' },
          ],
        },
      };
      // Pass the transformed book straight through the normalizer mock.
      (deps.normalizer.normalizeOrderBook as jest.Mock).mockImplementation((d: any) => d);
      (deps.wsManager.watch as jest.Mock).mockReturnValue(
        (async function* () {
          yield snapshot;
          yield delta;
        })()
      );

      const gen = ws.watchOrderBook('BTC/USDC:USDC');
      const first = (await gen.next()).value as { bids: number[][]; asks: number[][] };
      const second = (await gen.next()).value as { bids: number[][]; asks: number[][] };

      // First yield = the full snapshot (bids DESC, asks ASC).
      expect(first.bids).toEqual([
        [100.0, 1.0],
        [99.0, 2.0],
      ]);
      expect(first.asks).toEqual([
        [101.0, 1.5],
        [102.0, 2.5],
      ]);

      // Second yield = folded: 99.0 bid resized, 101.0 ask deleted, 103.0 ask added.
      expect(second.bids).toEqual([
        [100.0, 1.0],
        [99.0, 5.0],
      ]);
      expect(second.asks).toEqual([
        [102.0, 2.5],
        [103.0, 3.0],
      ]);

      // The folded book is uncrossed (best bid < best ask).
      expect(second.bids[0][0]).toBeLessThan(second.asks[0][0]);
    });
  });

  describe('watchTrades', () => {
    it('should subscribe with slash-form wire channel and colon-form routing key', async () => {
      const gen = ws.watchTrades('ETH/USDC:USDC');
      await gen.next();

      expect(deps.wsManager.watch).toHaveBeenCalledWith(
        'trade:0',
        expect.objectContaining({ type: 'subscribe', channel: 'trade/0' })
      );
    });

    it('should yield a normalized trade per element of the raw frame', async () => {
      const rawFrame = {
        channel: 'trade:1',
        type: 'subscribed/trade',
        trades: [
          {
            trade_id: 22670119915,
            market_id: 1,
            size: '0.00012',
            price: '64486.2',
            is_maker_ask: true,
            timestamp: 1781410715437,
          },
        ],
      };
      const normalized = { id: '22670119915', symbol: 'BTC/USDC:USDC', price: 64486.2 };
      (deps.normalizer.normalizeTrade as jest.Mock).mockReturnValue(normalized);
      (deps.wsManager.watch as jest.Mock).mockReturnValue(
        (async function* () { yield rawFrame; })()
      );

      const gen = ws.watchTrades('BTC/USDC:USDC');
      const result = await gen.next();

      expect(result.value).toBe(normalized);
      const passed = (deps.normalizer.normalizeTrade as jest.Mock).mock.calls[0][0];
      expect(passed.price).toBe(64486.2);
      expect(passed.amount).toBe(0.00012);
      expect(passed.id).toBe('22670119915');
    });
  });

  describe('watchTicker', () => {
    it('should subscribe to ticker channel', async () => {
      const gen = ws.watchTicker('BTC/USDC:USDC');
      await gen.next();

      expect(deps.wsManager.watch).toHaveBeenCalledWith(
        'ticker:BTCUSDC',
        expect.objectContaining({ type: 'subscribe', channel: 'ticker', symbol: 'BTCUSDC' })
      );
    });
  });

  // =========================================================================
  // Private streams (auth required)
  // =========================================================================
  describe('watchPositions', () => {
    it('should throw when no authentication', async () => {
      const gen = ws.watchPositions();
      await expect(gen.next()).rejects.toThrow('API credentials required');
    });

    it('should subscribe when authenticated via apiKey', async () => {
      const authDeps = createMockDeps({
        hasAuthentication: true,
        apiKey: 'test-key',
      });
      const authWs = new LighterWebSocket(authDeps);

      const gen = authWs.watchPositions();
      await gen.next();

      expect(authDeps.wsManager.watch).toHaveBeenCalledWith(
        expect.stringContaining('positions:'),
        expect.objectContaining({ type: 'subscribe', channel: 'positions', apiKey: 'test-key' })
      );
    });

    it('should use WASM auth token when available', async () => {
      const mockSigner = {
        createAuthToken: jest.fn(async () => 'wasm-token'),
      };
      const authDeps = createMockDeps({
        hasAuthentication: true,
        hasWasmSigning: true,
        signer: mockSigner as any,
        accountIndex: 1,
        apiKeyIndex: 10,
      });
      const authWs = new LighterWebSocket(authDeps);

      const gen = authWs.watchPositions();
      await gen.next();

      expect(mockSigner.createAuthToken).toHaveBeenCalled();
      expect(authDeps.wsManager.watch).toHaveBeenCalledWith(
        'positions:account-1-10',
        expect.objectContaining({ authToken: 'wasm-token' })
      );
    });

    it('should fall back to apiKey when WASM auth fails', async () => {
      const mockSigner = {
        createAuthToken: jest.fn(async () => { throw new Error('wasm error'); }),
      };
      const authDeps = createMockDeps({
        hasAuthentication: true,
        hasWasmSigning: true,
        signer: mockSigner as any,
        apiKey: 'fallback-key',
      });
      const authWs = new LighterWebSocket(authDeps);

      const gen = authWs.watchPositions();
      await gen.next();

      expect(authDeps.wsManager.watch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ apiKey: 'fallback-key' })
      );
    });
  });

  describe('watchOrders', () => {
    it('should throw when no authentication', async () => {
      const gen = ws.watchOrders();
      await expect(gen.next()).rejects.toThrow('API credentials required');
    });

    it('should subscribe with auth', async () => {
      const authDeps = createMockDeps({ hasAuthentication: true, apiKey: 'test' });
      const authWs = new LighterWebSocket(authDeps);

      const gen = authWs.watchOrders();
      await gen.next();

      expect(authDeps.wsManager.watch).toHaveBeenCalledWith(
        expect.stringContaining('orders:'),
        expect.objectContaining({ channel: 'orders' })
      );
    });
  });

  describe('watchBalance', () => {
    it('should throw when no authentication', async () => {
      const gen = ws.watchBalance();
      await expect(gen.next()).rejects.toThrow('API credentials required');
    });

    it('should subscribe with auth', async () => {
      const authDeps = createMockDeps({ hasAuthentication: true, apiKey: 'test' });
      const authWs = new LighterWebSocket(authDeps);

      const gen = authWs.watchBalance();
      await gen.next();

      expect(authDeps.wsManager.watch).toHaveBeenCalledWith(
        expect.stringContaining('balance:'),
        expect.objectContaining({ channel: 'balance' })
      );
    });
  });

  describe('watchMyTrades', () => {
    it('should throw when no authentication', async () => {
      const gen = ws.watchMyTrades();
      await expect(gen.next()).rejects.toThrow('API credentials required');
    });

    it('should subscribe with symbol filter', async () => {
      const authDeps = createMockDeps({ hasAuthentication: true, apiKey: 'test' });
      const authWs = new LighterWebSocket(authDeps);

      const gen = authWs.watchMyTrades('BTC/USDC:USDC');
      await gen.next();

      expect(authDeps.wsManager.watch).toHaveBeenCalledWith(
        expect.stringContaining('fills:'),
        expect.objectContaining({ channel: 'fills', symbol: 'BTCUSDC' })
      );
    });

    it('should subscribe without symbol filter', async () => {
      const authDeps = createMockDeps({ hasAuthentication: true, apiKey: 'test' });
      const authWs = new LighterWebSocket(authDeps);

      const gen = authWs.watchMyTrades();
      await gen.next();

      const subMsg = (authDeps.wsManager.watch as jest.Mock).mock.calls[0][1] as any;
      expect(subMsg.symbol).toBeUndefined();
    });
  });

  // =========================================================================
  // Auth identifier
  // =========================================================================
  describe('getAuthIdentifier logic', () => {
    it('should use account index for WASM signing', async () => {
      const authDeps = createMockDeps({
        hasAuthentication: true,
        hasWasmSigning: true,
        signer: { createAuthToken: jest.fn(async () => 'token') } as any,
        accountIndex: 3,
        apiKeyIndex: 7,
      });
      const authWs = new LighterWebSocket(authDeps);

      const gen = authWs.watchOrders();
      await gen.next();

      expect(authDeps.wsManager.watch).toHaveBeenCalledWith(
        'orders:account-3-7',
        expect.any(Object)
      );
    });

    it('should use apiKey for HMAC auth', async () => {
      const authDeps = createMockDeps({
        hasAuthentication: true,
        hasWasmSigning: false,
        apiKey: 'my-api-key',
      });
      const authWs = new LighterWebSocket(authDeps);

      const gen = authWs.watchOrders();
      await gen.next();

      expect(authDeps.wsManager.watch).toHaveBeenCalledWith(
        'orders:my-api-key',
        expect.any(Object)
      );
    });

    it('should use anonymous when no apiKey', async () => {
      const authDeps = createMockDeps({
        hasAuthentication: true,
        hasWasmSigning: false,
        apiKey: undefined,
      });
      const authWs = new LighterWebSocket(authDeps);

      const gen = authWs.watchOrders();
      await gen.next();

      expect(authDeps.wsManager.watch).toHaveBeenCalledWith(
        'orders:anonymous',
        expect.any(Object)
      );
    });
  });
});

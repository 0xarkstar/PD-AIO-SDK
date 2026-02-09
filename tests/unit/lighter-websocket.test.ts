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
    it('should subscribe to orderbook channel', async () => {
      const gen = ws.watchOrderBook('BTC/USDC:USDC');
      await gen.next();

      expect(deps.wsManager.watch).toHaveBeenCalledWith(
        'orderbook:BTCUSDC',
        expect.objectContaining({ type: 'subscribe', channel: 'orderbook', symbol: 'BTCUSDC' })
      );
    });

    it('should use default limit of 50', async () => {
      const gen = ws.watchOrderBook('BTC/USDC:USDC');
      await gen.next();

      expect(deps.wsManager.watch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ limit: 50 })
      );
    });

    it('should use provided limit', async () => {
      const gen = ws.watchOrderBook('BTC/USDC:USDC', 20);
      await gen.next();

      expect(deps.wsManager.watch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ limit: 20 })
      );
    });

    it('should yield normalized order book', async () => {
      const mockData = { bids: [], asks: [] };
      const normalized = { bids: [], asks: [], symbol: 'BTC/USDC:USDC', timestamp: 123 };
      (deps.normalizer.normalizeOrderBook as jest.Mock).mockReturnValue(normalized);
      (deps.wsManager.watch as jest.Mock).mockReturnValue(
        (async function* () { yield mockData; })()
      );

      const gen = ws.watchOrderBook('BTC/USDC:USDC');
      const result = await gen.next();

      expect(result.value).toBe(normalized);
    });
  });

  describe('watchTrades', () => {
    it('should subscribe to trades channel', async () => {
      const gen = ws.watchTrades('ETH/USDC:USDC');
      await gen.next();

      expect(deps.wsManager.watch).toHaveBeenCalledWith(
        'trades:ETHUSDC',
        expect.objectContaining({ type: 'subscribe', channel: 'trades', symbol: 'ETHUSDC' })
      );
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

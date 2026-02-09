/**
 * HyperliquidWebSocket Unit Tests
 *
 * Tests for WebSocket streaming handler — construction, auth checks, and subscription building.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { HyperliquidWebSocket } from '../../src/adapters/hyperliquid/HyperliquidWebSocket.js';
import type { HyperliquidWebSocketDeps } from '../../src/adapters/hyperliquid/HyperliquidWebSocket.js';

// Helper to create mock dependencies
function createMockDeps(overrides: Partial<HyperliquidWebSocketDeps> = {}): HyperliquidWebSocketDeps {
  return {
    wsManager: {
      watch: jest.fn(),
    } as any,
    normalizer: {
      normalizeOrderBook: jest.fn((data: any) => data),
      normalizeTrade: jest.fn((data: any) => data),
      normalizeTicker: jest.fn((_sym: string, data: any) => data),
      normalizePosition: jest.fn((data: any) => data),
      normalizeUserFill: jest.fn((data: any) => data),
    } as any,
    symbolToExchange: jest.fn((symbol: string) => symbol.split('/')[0]),
    fetchOpenOrders: jest.fn(async () => []),
    ...overrides,
  };
}

describe('HyperliquidWebSocket', () => {
  let deps: HyperliquidWebSocketDeps;
  let ws: HyperliquidWebSocket;

  beforeEach(() => {
    deps = createMockDeps();
    ws = new HyperliquidWebSocket(deps);
  });

  describe('constructor', () => {
    it('should create instance with required deps', () => {
      expect(ws).toBeInstanceOf(HyperliquidWebSocket);
    });

    it('should create instance without auth', () => {
      const noAuthDeps = createMockDeps({ auth: undefined });
      const noAuthWs = new HyperliquidWebSocket(noAuthDeps);
      expect(noAuthWs).toBeInstanceOf(HyperliquidWebSocket);
    });

    it('should create instance with auth', () => {
      const authDeps = createMockDeps({
        auth: { getAddress: jest.fn(() => '0xabc123') } as any,
      });
      const authWs = new HyperliquidWebSocket(authDeps);
      expect(authWs).toBeInstanceOf(HyperliquidWebSocket);
    });
  });

  describe('watchPositions', () => {
    it('should throw when no auth is provided', async () => {
      const gen = ws.watchPositions();
      await expect(gen.next()).rejects.toThrow('Authentication required');
    });
  });

  describe('watchOrders', () => {
    it('should throw when no auth is provided', async () => {
      const gen = ws.watchOrders();
      await expect(gen.next()).rejects.toThrow('Authentication required');
    });
  });

  describe('watchMyTrades', () => {
    it('should throw when no auth is provided', async () => {
      const gen = ws.watchMyTrades();
      await expect(gen.next()).rejects.toThrow('Authentication required');
    });

    it('should throw when no auth even with symbol filter', async () => {
      const gen = ws.watchMyTrades('BTC/USDT:USDT');
      await expect(gen.next()).rejects.toThrow('Authentication required');
    });
  });

  describe('watchOrderBook', () => {
    it('should call symbolToExchange with the symbol', async () => {
      // Set up watch to return an async iterable that immediately ends
      const mockWatch = jest.fn<any>().mockReturnValue((async function* () {})());
      deps.wsManager.watch = mockWatch;

      const gen = ws.watchOrderBook('BTC/USDT:USDT');
      await gen.next();

      expect(deps.symbolToExchange).toHaveBeenCalledWith('BTC/USDT:USDT');
    });

    it('should subscribe to l2Book channel', async () => {
      const mockWatch = jest.fn<any>().mockReturnValue((async function* () {})());
      deps.wsManager.watch = mockWatch;

      const gen = ws.watchOrderBook('BTC/USDT:USDT');
      await gen.next();

      expect(mockWatch).toHaveBeenCalledWith(
        'l2Book:BTC',
        expect.objectContaining({
          method: 'subscribe',
          subscription: expect.objectContaining({ type: 'l2Book', coin: 'BTC' }),
        }),
        expect.objectContaining({
          method: 'unsubscribe',
          subscription: expect.objectContaining({ type: 'l2Book', coin: 'BTC' }),
        })
      );
    });

    it('should yield normalized order book data', async () => {
      const mockData = { levels: [[['36000', '1.5']]] };
      const normalizedData = { bids: [], asks: [], symbol: 'BTC/USDT:USDT', timestamp: Date.now() };
      (deps.normalizer.normalizeOrderBook as jest.Mock).mockReturnValue(normalizedData);

      const mockWatch = jest.fn<any>().mockReturnValue(
        (async function* () {
          yield mockData;
        })()
      );
      deps.wsManager.watch = mockWatch;

      const gen = ws.watchOrderBook('BTC/USDT:USDT');
      const result = await gen.next();

      expect(result.value).toBe(normalizedData);
      expect(deps.normalizer.normalizeOrderBook).toHaveBeenCalledWith(mockData);
    });
  });

  describe('watchTrades', () => {
    it('should call symbolToExchange with the symbol', async () => {
      const mockWatch = jest.fn<any>().mockReturnValue((async function* () {})());
      deps.wsManager.watch = mockWatch;

      const gen = ws.watchTrades('ETH/USDT:USDT');
      await gen.next();

      expect(deps.symbolToExchange).toHaveBeenCalledWith('ETH/USDT:USDT');
    });

    it('should subscribe to trades channel', async () => {
      const mockWatch = jest.fn<any>().mockReturnValue((async function* () {})());
      deps.wsManager.watch = mockWatch;

      const gen = ws.watchTrades('ETH/USDT:USDT');
      await gen.next();

      expect(mockWatch).toHaveBeenCalledWith(
        'trades:ETH',
        expect.objectContaining({
          method: 'subscribe',
          subscription: expect.objectContaining({ type: 'trades', coin: 'ETH' }),
        })
      );
    });
  });

  describe('watchTicker', () => {
    it('should subscribe to allMids channel', async () => {
      const mockWatch = jest.fn<any>().mockReturnValue((async function* () {})());
      deps.wsManager.watch = mockWatch;

      const gen = ws.watchTicker('BTC/USDT:USDT');
      await gen.next();

      expect(mockWatch).toHaveBeenCalledWith(
        'allMids',
        expect.objectContaining({
          method: 'subscribe',
          subscription: expect.objectContaining({ type: 'allMids' }),
        })
      );
    });

    it('should yield ticker when mid price exists for symbol', async () => {
      const tickerData = { last: 36000, symbol: 'BTC/USDT:USDT' };
      (deps.normalizer.normalizeTicker as jest.Mock).mockReturnValue(tickerData);

      const mockWatch = jest.fn<any>().mockReturnValue(
        (async function* () {
          yield { mids: { BTC: '36000' } };
        })()
      );
      deps.wsManager.watch = mockWatch;

      const gen = ws.watchTicker('BTC/USDT:USDT');
      const result = await gen.next();

      expect(result.value).toBe(tickerData);
    });

    it('should skip messages without mid for requested symbol', async () => {
      const mockWatch = jest.fn<any>().mockReturnValue(
        (async function* () {
          yield { mids: { ETH: '2000' } }; // No BTC
        })()
      );
      deps.wsManager.watch = mockWatch;

      const gen = ws.watchTicker('BTC/USDT:USDT');
      const result = await gen.next();

      expect(result.done).toBe(true);
    });
  });

  describe('authenticated streams with auth', () => {
    let authWs: HyperliquidWebSocket;
    let authDeps: HyperliquidWebSocketDeps;

    beforeEach(() => {
      authDeps = createMockDeps({
        auth: { getAddress: jest.fn(() => '0xabc123') } as any,
      });
      authWs = new HyperliquidWebSocket(authDeps);
    });

    it('watchPositions should subscribe to user channel', async () => {
      const mockWatch = jest.fn<any>().mockReturnValue((async function* () {})());
      authDeps.wsManager.watch = mockWatch;

      const gen = authWs.watchPositions();
      await gen.next();

      expect(mockWatch).toHaveBeenCalledWith(
        'user:0xabc123',
        expect.objectContaining({
          method: 'subscribe',
          subscription: expect.objectContaining({ type: 'user', user: '0xabc123' }),
        })
      );
    });

    it('watchOrders should yield initial orders then watch fills', async () => {
      const initialOrders = [{ id: '1', symbol: 'BTC/USDT:USDT' }];
      (authDeps.fetchOpenOrders as jest.Mock).mockResolvedValue(initialOrders);

      const mockWatch = jest.fn<any>().mockReturnValue((async function* () {})());
      authDeps.wsManager.watch = mockWatch;

      const gen = authWs.watchOrders();
      const first = await gen.next();

      expect(first.value).toEqual(initialOrders);
      expect(authDeps.fetchOpenOrders).toHaveBeenCalled();
    });

    it('watchMyTrades should subscribe to userFills channel', async () => {
      const mockWatch = jest.fn<any>().mockReturnValue((async function* () {})());
      authDeps.wsManager.watch = mockWatch;

      const gen = authWs.watchMyTrades();
      await gen.next();

      expect(mockWatch).toHaveBeenCalledWith(
        'userFills:0xabc123',
        expect.objectContaining({
          method: 'subscribe',
          subscription: expect.objectContaining({ type: 'userFills', user: '0xabc123' }),
        })
      );
    });
  });
});

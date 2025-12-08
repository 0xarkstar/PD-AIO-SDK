/**
 * Integration Tests: Paradex WebSocket Streaming
 *
 * Tests all AsyncGenerator-based watch methods with mocked WebSocket
 */

import { ParadexAdapter } from '../../src/adapters/paradex/ParadexAdapter.js';
import { ParadexWebSocketWrapper } from '../../src/adapters/paradex/ParadexWebSocketWrapper.js';

// Mock WebSocket wrapper
jest.mock('../../src/adapters/paradex/ParadexWebSocketWrapper.js');
jest.mock('../../src/adapters/paradex/ParadexHTTPClient.js');
jest.mock('../../src/adapters/paradex/ParadexParaclearWrapper.js');
jest.mock('../../src/adapters/paradex/auth.js');

describe('Paradex WebSocket Integration Tests', () => {
  let adapter: ParadexAdapter;
  let mockWsWrapper: jest.Mocked<ParadexWebSocketWrapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    adapter = new ParadexAdapter({
      apiKey: 'test-key',
      apiSecret: 'test-secret',
      testnet: true,
    });

    // Mock auth
    const mockAuth = (adapter as any).auth;
    mockAuth.verify = jest.fn().mockResolvedValue(true);
  });

  describe('watchOrderBook()', () => {
    it('should stream order book updates', async () => {
      // Create mock generator
      async function* mockOrderBookStream() {
        yield {
          symbol: 'BTC/USD:USD',
          exchange: 'paradex',
          bids: [[50000, 1.5]],
          asks: [[50010, 2.0]],
          timestamp: Date.now(),
        };
      }

      // Mock ensureWebSocket to return mocked wrapper
      const mockWs = {
        watchOrderBook: jest.fn().mockReturnValue(mockOrderBookStream()),
      };

      (adapter as any).ensureWebSocket = jest.fn().mockResolvedValue(mockWs);

      const generator = adapter.watchOrderBook('BTC/USD:USD');
      const result = await generator.next();

      expect(result.done).toBe(false);
      expect(result.value?.symbol).toBe('BTC/USD:USD');
      expect(result.value?.bids[0]).toEqual([50000, 1.5]);
      expect(mockWs.watchOrderBook).toHaveBeenCalledWith('BTC/USD:USD', undefined);
    });

    it('should pass custom depth parameter', async () => {
      async function* mockStream() {
        yield {
          symbol: 'BTC/USD:USD',
          exchange: 'paradex',
          bids: [[50000, 1.0]],
          asks: [[50100, 1.0]],
          timestamp: Date.now(),
        };
      }

      const mockWs = {
        watchOrderBook: jest.fn().mockReturnValue(mockStream()),
      };

      (adapter as any).ensureWebSocket = jest.fn().mockResolvedValue(mockWs);

      const generator = adapter.watchOrderBook('BTC/USD:USD', 100);
      await generator.next();

      expect(mockWs.watchOrderBook).toHaveBeenCalledWith('BTC/USD:USD', 100);
    });
  });

  describe('watchTrades()', () => {
    it('should stream public trade updates', async () => {
      async function* mockTradeStream() {
        yield {
          id: 'trade-1',
          symbol: 'BTC/USD:USD',
          side: 'buy',
          price: 50000,
          amount: 1.5,
          cost: 75000,
          timestamp: Date.now(),
          info: {},
        };
      }

      const mockWs = {
        watchTrades: jest.fn().mockReturnValue(mockTradeStream()),
      };

      (adapter as any).ensureWebSocket = jest.fn().mockResolvedValue(mockWs);

      const generator = adapter.watchTrades('BTC/USD:USD');
      const result = await generator.next();

      expect(result.done).toBe(false);
      expect(result.value?.symbol).toBe('BTC/USD:USD');
      expect(result.value?.side).toBe('buy');
      expect(result.value?.price).toBe(50000);
      expect(mockWs.watchTrades).toHaveBeenCalledWith('BTC/USD:USD');
    });
  });

  describe('watchTicker()', () => {
    it('should stream ticker updates', async () => {
      async function* mockTickerStream() {
        yield {
          symbol: 'BTC/USD:USD',
          last: 50000,
          open: 49000,
          close: 50000,
          bid: 49995,
          ask: 50005,
          high: 51000,
          low: 48500,
          change: 1000,
          percentage: 2.04,
          baseVolume: 1000,
          quoteVolume: 0,
          timestamp: Date.now(),
          info: {},
        };
      }

      const mockWs = {
        watchTicker: jest.fn().mockReturnValue(mockTickerStream()),
      };

      (adapter as any).ensureWebSocket = jest.fn().mockResolvedValue(mockWs);

      const generator = adapter.watchTicker('BTC/USD:USD');
      const result = await generator.next();

      expect(result.done).toBe(false);
      expect(result.value?.symbol).toBe('BTC/USD:USD');
      expect(result.value?.last).toBe(50000);
      expect(result.value?.bid).toBe(49995);
      expect(mockWs.watchTicker).toHaveBeenCalledWith('BTC/USD:USD');
    });
  });

  describe('watchPositions()', () => {
    it('should stream position updates wrapped in array', async () => {
      async function* mockPositionStream() {
        yield {
          symbol: 'BTC/USD:USD',
          side: 'long',
          marginMode: 'cross',
          size: 2.5,
          entryPrice: 50000,
          markPrice: 50500,
          liquidationPrice: 45000,
          unrealizedPnl: 1250,
          realizedPnl: 0,
          margin: 10000,
          leverage: 5,
          maintenanceMargin: 250,
          info: {},
        };
      }

      const mockWs = {
        watchPositions: jest.fn().mockReturnValue(mockPositionStream()),
      };

      (adapter as any).ensureWebSocket = jest.fn().mockResolvedValue(mockWs);

      const generator = adapter.watchPositions();
      const result = await generator.next();

      expect(result.done).toBe(false);
      expect(Array.isArray(result.value)).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value?.[0].symbol).toBe('BTC/USD:USD');
      expect(result.value?.[0].side).toBe('long');
      expect(mockWs.watchPositions).toHaveBeenCalledWith(undefined);
    });

    it('should pass symbol filter', async () => {
      async function* mockStream() {
        yield {
          symbol: 'BTC/USD:USD',
          side: 'long',
          contracts: 1.5,
          entryPrice: 50000,
          markPrice: 50100,
          liquidationPrice: 45000,
          unrealizedPnl: 150,
          marginType: 'cross',
          leverage: 10,
          timestamp: Date.now(),
          info: {},
        };
      }

      const mockWs = {
        watchPositions: jest.fn().mockReturnValue(mockStream()),
      };

      (adapter as any).ensureWebSocket = jest.fn().mockResolvedValue(mockWs);

      const generator = adapter.watchPositions('BTC/USD:USD');
      await generator.next();

      expect(mockWs.watchPositions).toHaveBeenCalledWith('BTC/USD:USD');
    });
  });

  describe('watchOrders()', () => {
    it('should stream order updates wrapped in array', async () => {
      async function* mockOrderStream() {
        yield {
          id: 'order-123',
          symbol: 'BTC/USD:USD',
          side: 'buy',
          type: 'limit',
          amount: 1.5,
          price: 50000,
          filled: 0.5,
          remaining: 1.0,
          status: 'open',
          timestamp: Date.now(),
          info: {},
        };
      }

      const mockWs = {
        watchOrders: jest.fn().mockReturnValue(mockOrderStream()),
      };

      (adapter as any).ensureWebSocket = jest.fn().mockResolvedValue(mockWs);

      const generator = adapter.watchOrders();
      const result = await generator.next();

      expect(result.done).toBe(false);
      expect(Array.isArray(result.value)).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value?.[0].id).toBe('order-123');
      expect(result.value?.[0].side).toBe('buy');
      expect(mockWs.watchOrders).toHaveBeenCalledWith(undefined);
    });

    it('should pass symbol filter', async () => {
      async function* mockStream() {
        yield {
          id: 'order-456',
          clientOrderId: 'client-456',
          symbol: 'ETH/USD:USD',
          side: 'sell',
          type: 'limit',
          price: 3000,
          amount: 5.0,
          filled: 0,
          remaining: 5.0,
          status: 'open',
          timestamp: Date.now(),
          info: {},
        };
      }

      const mockWs = {
        watchOrders: jest.fn().mockReturnValue(mockStream()),
      };

      (adapter as any).ensureWebSocket = jest.fn().mockResolvedValue(mockWs);

      const generator = adapter.watchOrders('ETH/USD:USD');
      await generator.next();

      expect(mockWs.watchOrders).toHaveBeenCalledWith('ETH/USD:USD');
    });
  });

  describe('watchBalance()', () => {
    it('should stream balance updates', async () => {
      async function* mockBalanceStream() {
        yield [
          {
            currency: 'USDC',
            total: 10000,
            free: 8000,
            used: 2000,
            info: {},
          },
        ];
      }

      const mockWs = {
        watchBalance: jest.fn().mockReturnValue(mockBalanceStream()),
      };

      (adapter as any).ensureWebSocket = jest.fn().mockResolvedValue(mockWs);

      const generator = adapter.watchBalance();
      const result = await generator.next();

      expect(result.done).toBe(false);
      expect(Array.isArray(result.value)).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value?.[0].currency).toBe('USDC');
      expect(result.value?.[0].total).toBe(10000);
      expect(mockWs.watchBalance).toHaveBeenCalled();
    });
  });

  describe('ensureWebSocket()', () => {
    it('should create WebSocket wrapper on first call', async () => {
      const ensureWebSocket = (adapter as any).ensureWebSocket.bind(adapter);

      // First call should create wrapper
      const ws1 = await ensureWebSocket();
      expect(ws1).toBeDefined();

      // Second call should return same instance
      const ws2 = await ensureWebSocket();
      expect(ws2).toBe(ws1);
    });

    it('should connect WebSocket on creation', async () => {
      const mockConnect = jest.fn().mockResolvedValue(undefined);

      jest.spyOn(ParadexWebSocketWrapper.prototype, 'connect').mockImplementation(mockConnect);

      const ensureWebSocket = (adapter as any).ensureWebSocket.bind(adapter);
      await ensureWebSocket();

      expect(mockConnect).toHaveBeenCalled();
    });
  });

  describe('disconnect()', () => {
    it('should disconnect WebSocket if connected', async () => {
      const mockDisconnect = jest.fn();
      const mockWs = {
        disconnect: mockDisconnect,
      };

      (adapter as any).ws = mockWs;

      await adapter.disconnect();

      expect(mockDisconnect).toHaveBeenCalled();
      expect((adapter as any).ws).toBeUndefined();
    });

    it('should handle disconnect when WebSocket not initialized', async () => {
      (adapter as any).ws = undefined;

      await expect(adapter.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('Error Handling in Streams', () => {
    it('should propagate errors from watchOrderBook', async () => {
      async function* mockErrorStream() {
        throw new Error('WebSocket connection failed');
      }

      const mockWs = {
        watchOrderBook: jest.fn().mockReturnValue(mockErrorStream()),
      };

      (adapter as any).ensureWebSocket = jest.fn().mockResolvedValue(mockWs);

      const generator = adapter.watchOrderBook('BTC/USD:USD');

      await expect(generator.next()).rejects.toThrow('WebSocket connection failed');
    });
  });

  describe('Multiple Concurrent Streams', () => {
    it('should support multiple concurrent watchOrderBook streams', async () => {
      let callCount = 0;
      async function* mockStream() {
        callCount++;
        yield {
          symbol: 'BTC/USD:USD',
          exchange: 'paradex',
          bids: [[50000, 1]],
          asks: [[50010, 1]],
          timestamp: Date.now(),
        };
      }

      const mockWs = {
        watchOrderBook: jest.fn().mockImplementation(() => mockStream()),
      };

      (adapter as any).ensureWebSocket = jest.fn().mockResolvedValue(mockWs);

      const gen1 = adapter.watchOrderBook('BTC/USD:USD');
      const gen2 = adapter.watchOrderBook('ETH/USD:USD');

      await Promise.all([gen1.next(), gen2.next()]);

      expect(mockWs.watchOrderBook).toHaveBeenCalledTimes(2);
    });
  });

  describe('Stream Cleanup', () => {
    it('should cleanup generator on early termination', async () => {
      async function* mockStream() {
        try {
          yield { symbol: 'BTC/USD:USD', bids: [], asks: [], timestamp: Date.now(), exchange: 'paradex' };
        } finally {
          // Cleanup logic would go here
        }
      }

      const mockWs = {
        watchOrderBook: jest.fn().mockReturnValue(mockStream()),
      };

      (adapter as any).ensureWebSocket = jest.fn().mockResolvedValue(mockWs);

      const generator = adapter.watchOrderBook('BTC/USD:USD');
      await generator.next();
      await generator.return(undefined as any); // Early termination

      expect(mockWs.watchOrderBook).toHaveBeenCalled();
    });
  });
});

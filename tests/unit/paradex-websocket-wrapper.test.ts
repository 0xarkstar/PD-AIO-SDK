/**
 * Unit Tests for ParadexWebSocketWrapper
 *
 * Tests WebSocket wrapper with mocked WebSocket
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ParadexWebSocketWrapper } from '../../src/adapters/paradex/ParadexWebSocketWrapper.js';

// Mock WebSocket
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

  constructor(public url: string, private autoConnect: boolean = true) {
    // Simulate connection only if autoConnect is true
    if (autoConnect) {
      this.connectionTimer = setTimeout(() => {
        this.readyState = this.OPEN;
        if (this.onopen) {
          this.onopen({});
        }
      }, 10);
    }
  }

  send(data: string): void {
    // Mock send
  }

  close(): void {
    // Clear any pending connection timer
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
    this.readyState = this.CLOSED;
    if (this.onclose) {
      this.onclose({});
    }
  }

  simulateMessage(data: any): void {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }
}

// Replace global WebSocket
const originalWebSocket = global.WebSocket;

describe('ParadexWebSocketWrapper', () => {
  let wrapper: ParadexWebSocketWrapper;
  let mockWS: MockWebSocket;

  beforeEach(() => {
    // Ensure we're using real timers
    jest.useRealTimers();

    // Mock WebSocket constructor
    (global as any).WebSocket = jest.fn((url: string) => {
      mockWS = new MockWebSocket(url);
      return mockWS;
    });

    wrapper = new ParadexWebSocketWrapper({
      wsUrl: 'wss://ws.test.paradex.trade/v1',
    });
  });

  afterEach(async () => {
    // Properly disconnect and clear any pending operations
    if (wrapper) {
      wrapper.disconnect();
      // Give time for cleanup
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    global.WebSocket = originalWebSocket as any;
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket', async () => {
      await wrapper.connect();

      expect(wrapper.connected).toBe(true);
      expect(global.WebSocket).toHaveBeenCalledWith('wss://ws.test.paradex.trade/v1');
    });

    it('should disconnect from WebSocket', async () => {
      await wrapper.connect();
      expect(wrapper.connected).toBe(true);

      wrapper.disconnect();

      expect(wrapper.connected).toBe(false);
    });

    it('should handle connection timeout', async () => {
      const slowWrapper = new ParadexWebSocketWrapper({
        wsUrl: 'wss://slow.test',
        timeout: 100,
      });

      // Mock slow connection that never completes
      (global as any).WebSocket = jest.fn(() => {
        return new MockWebSocket('wss://slow.test', false); // autoConnect = false
      });

      await expect(slowWrapper.connect()).rejects.toThrow(/timeout/i);
    });
  });

  describe('State Management', () => {
    it('should report connected state correctly', async () => {
      expect(wrapper.connected).toBe(false);

      await wrapper.connect();
      expect(wrapper.connected).toBe(true);

      wrapper.disconnect();
      expect(wrapper.connected).toBe(false);
    });
  });

  describe('Subscription Pattern', () => {
    it('should send subscription request', async () => {
      await wrapper.connect();

      const sendSpy = jest.spyOn(mockWS, 'send');

      // Create generator to trigger subscription
      const generator = wrapper.watchOrderBook('BTC/USD:USD');

      // Simulate data to allow generator to yield
      setTimeout(() => {
        mockWS.simulateMessage({
          channel: 'orderbook.BTC-USD-PERP',
          data: {
            market: 'BTC-USD-PERP',
            bids: [['50000', '1.0']],
            asks: [['50100', '1.0']],
            timestamp: Date.now(),
          },
        });
      }, 30);

      // Get first value from generator with timeout
      const result = await Promise.race([
        generator.next(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 3000))
      ]);

      expect(sendSpy).toHaveBeenCalled();
      const calls = sendSpy.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      const request = JSON.parse(lastCall as string);

      expect(request.method).toBe('subscribe');
      expect(request.params.channel).toContain('orderbook');

      // Cleanup
      await generator.return(undefined as any);
    });

    it('should handle multiple concurrent subscriptions', async () => {
      await wrapper.connect();

      const gen1 = wrapper.watchOrderBook('BTC/USD:USD');
      const gen2 = wrapper.watchTrades('ETH/USD:USD');

      // Simulate data for both generators
      setTimeout(() => {
        mockWS.simulateMessage({
          channel: 'orderbook.BTC-USD-PERP',
          data: { market: 'BTC-USD-PERP', bids: [['50000', '1']], asks: [['50100', '1']], timestamp: Date.now() }
        });
        mockWS.simulateMessage({
          channel: 'trades.ETH-USD-PERP',
          data: { id: '1', market: 'ETH-USD-PERP', price: '3000', size: '1', side: 'BUY', timestamp: Date.now() }
        });
      }, 30);

      // Get first value from both generators with timeout
      const results = await Promise.race([
        Promise.all([gen1.next(), gen2.next()]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 3000))
      ]);

      // Both should be active
      expect(wrapper.connected).toBe(true);

      // Cleanup
      await gen1.return(undefined as any);
      await gen2.return(undefined as any);
    });
  });

  describe('Message Handling', () => {
    it('should handle orderbook messages', async () => {
      await wrapper.connect();

      const generator = wrapper.watchOrderBook('BTC/USD:USD');
      const nextPromise = generator.next();

      // Simulate WebSocket message
      mockWS.simulateMessage({
        channel: 'orderbook.BTC-USD-PERP',
        data: {
          market: 'BTC-USD-PERP',
          bids: [['50000', '1.5']],
          asks: [['50010', '2.0']],
          timestamp: Date.now(),
        },
      });

      const result = await nextPromise;

      expect(result.done).toBe(false);
      expect(result.value).toHaveProperty('symbol', 'BTC/USD:USD');
      expect(result.value).toHaveProperty('bids');
      expect(result.value).toHaveProperty('asks');
      expect(result.value.bids[0]).toEqual([50000, 1.5]);
    });

    it('should handle trade messages', async () => {
      await wrapper.connect();

      const generator = wrapper.watchTrades('BTC/USD:USD');
      const nextPromise = generator.next();

      mockWS.simulateMessage({
        channel: 'trades.BTC-USD-PERP',
        data: {
          id: 'trade-123',
          market: 'BTC-USD-PERP',
          price: '50000',
          size: '0.5',
          side: 'BUY',
          timestamp: Date.now(),
        },
      });

      const result = await nextPromise;

      expect(result.done).toBe(false);
      expect(result.value).toHaveProperty('symbol', 'BTC/USD:USD');
      expect(result.value).toHaveProperty('price', 50000);
      expect(result.value).toHaveProperty('amount', 0.5);
      expect(result.value).toHaveProperty('side', 'buy');
    });

    it('should handle error messages', async () => {
      await wrapper.connect();

      // Error messages are now handled by internal Logger, not console
      // This test verifies the wrapper doesn't crash on error messages
      mockWS.simulateMessage({
        error: {
          code: '1001',
          message: 'Invalid subscription',
        },
      });

      // Wrapper should continue to function after error
      expect(wrapper.connected).toBe(true);
    });
  });

  describe('AsyncGenerator Cleanup', () => {
    it('should unsubscribe when generator is closed', async () => {
      await wrapper.connect();

      const sendSpy = jest.spyOn(mockWS, 'send');
      sendSpy.mockClear();

      const generator = wrapper.watchOrderBook('BTC/USD:USD');

      // Simulate data to allow generator to proceed
      setTimeout(() => {
        mockWS.simulateMessage({
          channel: 'orderbook.BTC-USD-PERP',
          data: { market: 'BTC-USD-PERP', bids: [['50000', '1']], asks: [['50100', '1']], timestamp: Date.now() }
        });
      }, 30);

      // Get first value then close
      await Promise.race([
        generator.next(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 3000))
      ]);

      // Close generator
      await generator.return(undefined as any);

      // Should send unsubscribe
      const calls = sendSpy.mock.calls.map((c) => JSON.parse(c[0] as string));
      const unsubscribe = calls.find((c) => c.method === 'unsubscribe');

      expect(unsubscribe).toBeDefined();
    });
  });

  describe('All Watch Methods', () => {
    beforeEach(async () => {
      await wrapper.connect();
    });

    it('should support watchOrderBook', async () => {
      const gen = wrapper.watchOrderBook('BTC/USD:USD');
      expect(gen).toBeDefined();
      expect(typeof gen.next).toBe('function');
    });

    it('should support watchTrades', async () => {
      const gen = wrapper.watchTrades('BTC/USD:USD');
      expect(gen).toBeDefined();
    });

    it('should support watchTicker', async () => {
      const gen = wrapper.watchTicker('BTC/USD:USD');
      expect(gen).toBeDefined();
    });

    it('should support watchPositions', async () => {
      const gen = wrapper.watchPositions();
      expect(gen).toBeDefined();
    });

    it('should support watchOrders', async () => {
      const gen = wrapper.watchOrders();
      expect(gen).toBeDefined();
    });

    it('should support watchBalance', async () => {
      const gen = wrapper.watchBalance();
      expect(gen).toBeDefined();
    });
  });

  describe('Symbol Conversion', () => {
    it('should convert CCXT symbols to Paradex format', async () => {
      await wrapper.connect();

      const sendSpy = jest.spyOn(mockWS, 'send');

      const generator = wrapper.watchOrderBook('BTC/USD:USD');

      // Simulate data to allow generator to proceed
      setTimeout(() => {
        mockWS.simulateMessage({
          channel: 'orderbook.BTC-USD-PERP',
          data: { market: 'BTC-USD-PERP', bids: [['50000', '1']], asks: [['50100', '1']], timestamp: Date.now() }
        });
      }, 30);

      // Get first value with timeout
      await Promise.race([
        generator.next(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 3000))
      ]);

      const calls = sendSpy.mock.calls;
      const request = JSON.parse(calls[calls.length - 1][0] as string);

      // Should subscribe to BTC-USD-PERP
      expect(request.params.channel).toContain('BTC-USD-PERP');

      // Cleanup
      await generator.return(undefined as any);
    });
  });
});

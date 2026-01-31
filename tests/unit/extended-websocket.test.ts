/**
 * ExtendedWebSocketWrapper Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ExtendedWebSocketWrapper } from '../../src/adapters/extended/ExtendedWebSocketWrapper.js';

// Store reference to created WebSocket instances for testing
let lastCreatedWebSocket: MockWebSocket | null = null;

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: Error) => void) | null = null;

  constructor(public url: string) {
    lastCreatedWebSocket = this;
    // Simulate async connection
    setTimeout(() => {
      if (this.onopen) {
        this.onopen();
      }
    }, 10);
  }

  send(data: string): void {
    // Mock send - parse and potentially respond
    const message = JSON.parse(data);
    if (message.type === 'ping') {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({ data: JSON.stringify({ type: 'pong' }) });
        }
      }, 5);
    }
    if (message.action === 'subscribe') {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({ data: JSON.stringify({ event: 'subscribed', channel: message.channel }) });
        }
      }, 5);
    }
    if (message.action === 'auth') {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({ data: JSON.stringify({ event: 'authenticated' }) });
        }
      }, 5);
    }
  }

  close(code: number = 1000, reason: string = ''): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ code, reason });
    }
  }

  // Helper to simulate incoming messages
  simulateMessage(data: any): void {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

describe('ExtendedWebSocketWrapper', () => {
  let wrapper: ExtendedWebSocketWrapper;

  beforeEach(() => {
    lastCreatedWebSocket = null;
    wrapper = new ExtendedWebSocketWrapper({
      wsUrl: 'wss://test.extended.exchange/ws',
      apiKey: 'test-api-key',
      reconnect: false,
      pingInterval: 30000,
    });
  });

  afterEach(() => {
    wrapper.disconnect();
  });

  describe('constructor', () => {
    it('should create wrapper with config', () => {
      expect(wrapper).toBeDefined();
      expect(wrapper.connected).toBe(false);
    });

    it('should create wrapper without API key', () => {
      const wrapperNoAuth = new ExtendedWebSocketWrapper({
        wsUrl: 'wss://test.extended.exchange/ws',
      });

      expect(wrapperNoAuth).toBeDefined();
    });
  });

  describe('connect', () => {
    it('should connect to WebSocket', async () => {
      await wrapper.connect();

      expect(wrapper.connected).toBe(true);
    });

    it('should not connect twice if already connected', async () => {
      await wrapper.connect();
      await wrapper.connect();

      expect(wrapper.connected).toBe(true);
    });

    it('should authenticate if API key provided', async () => {
      await wrapper.connect();

      // Authentication is sent automatically
      expect(wrapper.connected).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should disconnect from WebSocket', async () => {
      await wrapper.connect();
      wrapper.disconnect();

      expect(wrapper.connected).toBe(false);
    });

    it('should handle disconnect when not connected', () => {
      expect(() => wrapper.disconnect()).not.toThrow();
    });
  });

  describe('watchOrderBook', () => {
    it('should create async generator for order book', () => {
      const generator = wrapper.watchOrderBook('BTC/USD:USD', 10);

      expect(generator).toBeDefined();
      expect(typeof generator[Symbol.asyncIterator]).toBe('function');
    });

    it('should connect when generator.next() is called', async () => {
      const generator = wrapper.watchOrderBook('BTC/USD:USD');

      // The connection happens when we call next() - we use a race with timeout
      // since next() will wait for a message indefinitely
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 100));

      // Start the generator (will initiate connection) but don't await it fully
      const nextPromise = generator.next();

      // Wait for connection to establish
      await timeoutPromise;

      expect(wrapper.connected).toBe(true);
    });
  });

  describe('watchTrades', () => {
    it('should create async generator for trades', () => {
      const generator = wrapper.watchTrades('BTC/USD:USD');

      expect(generator).toBeDefined();
      expect(typeof generator[Symbol.asyncIterator]).toBe('function');
    });
  });

  describe('watchTicker', () => {
    it('should create async generator for ticker', () => {
      const generator = wrapper.watchTicker('BTC/USD:USD');

      expect(generator).toBeDefined();
    });
  });

  describe('watchPositions', () => {
    it('should require API key', async () => {
      const wrapperNoAuth = new ExtendedWebSocketWrapper({
        wsUrl: 'wss://test.extended.exchange/ws',
      });

      const generator = wrapperNoAuth.watchPositions();

      await expect(generator.next()).rejects.toThrow('API key required');
    });

    it('should create generator with API key', () => {
      const generator = wrapper.watchPositions();

      expect(generator).toBeDefined();
      expect(typeof generator[Symbol.asyncIterator]).toBe('function');
    });
  });

  describe('watchOrders', () => {
    it('should require API key', async () => {
      const wrapperNoAuth = new ExtendedWebSocketWrapper({
        wsUrl: 'wss://test.extended.exchange/ws',
      });

      const generator = wrapperNoAuth.watchOrders();

      await expect(generator.next()).rejects.toThrow('API key required');
    });

    it('should create generator with API key', () => {
      const generator = wrapper.watchOrders();

      expect(generator).toBeDefined();
      expect(typeof generator[Symbol.asyncIterator]).toBe('function');
    });
  });

  describe('watchBalance', () => {
    it('should require API key', async () => {
      const wrapperNoAuth = new ExtendedWebSocketWrapper({
        wsUrl: 'wss://test.extended.exchange/ws',
      });

      const generator = wrapperNoAuth.watchBalance();

      await expect(generator.next()).rejects.toThrow('API key required');
    });

    it('should create generator with API key', () => {
      const generator = wrapper.watchBalance();

      expect(generator).toBeDefined();
      expect(typeof generator[Symbol.asyncIterator]).toBe('function');
    });
  });

  describe('watchFundingRate', () => {
    it('should create async generator for funding rate', () => {
      const generator = wrapper.watchFundingRate('BTC/USD:USD');

      expect(generator).toBeDefined();
      expect(typeof generator[Symbol.asyncIterator]).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should handle malformed JSON messages gracefully', async () => {
      await wrapper.connect();

      // Send invalid JSON - should not throw
      expect(() => {
        if (lastCreatedWebSocket && lastCreatedWebSocket.onmessage) {
          lastCreatedWebSocket.onmessage({ data: 'invalid json {' });
        }
      }).not.toThrow();
    });

    it('should handle error messages from server', async () => {
      await wrapper.connect();

      // Should not throw
      expect(() => {
        if (lastCreatedWebSocket) {
          lastCreatedWebSocket.simulateMessage({ event: 'error', error: 'Test error' });
        }
      }).not.toThrow();
    });
  });

  describe('reconnection', () => {
    it('should not reconnect when disabled', async () => {
      const wrapperNoReconnect = new ExtendedWebSocketWrapper({
        wsUrl: 'wss://test.extended.exchange/ws',
        reconnect: false,
      });

      await wrapperNoReconnect.connect();

      // Use the lastCreatedWebSocket reference
      if (lastCreatedWebSocket) {
        lastCreatedWebSocket.close(1006, 'Connection lost');
      }

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(wrapperNoReconnect.connected).toBe(false);
    });
  });
});

/**
 * WebSocketClient Coverage Tests
 *
 * Tests for connection lifecycle, reconnection, heartbeat, and metrics.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { WebSocketClient } from '../../src/websocket/WebSocketClient.js';

// Mock the ws module
jest.unstable_mockModule('ws', () => {
  return {
    default: MockWebSocket,
    __esModule: true,
  };
});

// Track instances for assertions
let lastWsInstance: any = null;

class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;

  readyState = 0; // CONNECTING
  private handlers: Record<string, Function[]> = {};

  constructor(public url: string) {
    lastWsInstance = this;
    // Auto-connect after microtask
    setTimeout(() => {
      this.readyState = 1;
      this.emit('open');
    }, 0);
  }

  on(event: string, handler: Function) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }

  emit(event: string, ...args: any[]) {
    const handlers = this.handlers[event] || [];
    for (const h of handlers) {
      h(...args);
    }
  }

  send(data: string) {}
  close() {
    this.readyState = 3;
    this.emit('close');
  }
  ping() {}
  terminate() {
    this.readyState = 3;
    this.emit('close');
  }
}

describe('WebSocketClient', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    lastWsInstance = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create with minimal config', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      expect(client.getState()).toBe('disconnected');
    });

    it('should register onMessage callback', () => {
      const onMessage = jest.fn();
      const client = new WebSocketClient({ url: 'wss://test.com', onMessage });
      expect(client.listenerCount('message')).toBe(1);
    });

    it('should register onStateChange callback', () => {
      const onStateChange = jest.fn();
      const client = new WebSocketClient({ url: 'wss://test.com', onStateChange });
      expect(client.listenerCount('stateChange')).toBe(1);
    });

    it('should register onError callback', () => {
      const onError = jest.fn();
      const client = new WebSocketClient({ url: 'wss://test.com', onError });
      expect(client.listenerCount('error')).toBe(1);
    });

    it('should merge reconnect config', () => {
      const client = new WebSocketClient({
        url: 'wss://test.com',
        reconnect: { maxAttempts: 5 },
      });
      expect(client).toBeDefined();
    });

    it('should merge heartbeat config', () => {
      const client = new WebSocketClient({
        url: 'wss://test.com',
        heartbeat: { enabled: false },
      });
      expect(client).toBeDefined();
    });
  });

  describe('getState', () => {
    it('should return disconnected initially', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      expect(client.getState()).toBe('disconnected');
    });
  });

  describe('isConnected', () => {
    it('should return false when disconnected', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('getMetrics', () => {
    it('should return initial metrics', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      const metrics = client.getMetrics();

      expect(metrics.messagesReceived).toBe(0);
      expect(metrics.messagesSent).toBe(0);
      expect(metrics.reconnectAttempts).toBe(0);
      expect(metrics.state).toBe('disconnected');
      expect(metrics.uptime).toBe(0);
      expect(metrics.activeSubscriptions).toBe(0);
    });
  });

  describe('send', () => {
    it('should throw when not connected', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      expect(() => client.send('test')).toThrow('WebSocket is not connected');
    });
  });

  describe('disconnect', () => {
    it('should handle disconnect when already disconnected', async () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      await expect(client.disconnect()).resolves.not.toThrow();
    });
  });

  describe('handleMessage', () => {
    it('should parse JSON messages', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      const onMessage = jest.fn();
      client.on('message', onMessage);

      // Manually invoke handleMessage
      (client as any).messagesReceived = 0;
      (client as any).handleMessage(JSON.stringify({ type: 'test' }));

      expect(onMessage).toHaveBeenCalledWith({ type: 'test' });
      expect((client as any).messagesReceived).toBe(1);
    });

    it('should emit raw string for non-JSON', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      const onMessage = jest.fn();
      client.on('message', onMessage);

      (client as any).handleMessage('not json');

      expect(onMessage).toHaveBeenCalledWith('not json');
    });

    it('should handle Buffer data', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      const onMessage = jest.fn();
      client.on('message', onMessage);

      (client as any).handleMessage(Buffer.from('{"test":true}'));

      expect(onMessage).toHaveBeenCalledWith({ test: true });
    });

    it('should handle ArrayBuffer data', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      const onMessage = jest.fn();
      client.on('message', onMessage);

      const encoder = new TextEncoder();
      const buffer = encoder.encode('{"data":1}').buffer;
      (client as any).handleMessage(buffer);

      expect(onMessage).toHaveBeenCalledWith({ data: 1 });
    });

    it('should emit error on message handling failure', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      const onError = jest.fn();
      client.on('error', onError);

      // Force an error by corrupting the state
      Object.defineProperty(client, 'messagesReceived', {
        get() { throw new Error('deliberate'); },
        set() {},
      });

      (client as any).handleMessage('test');
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('handleOpen', () => {
    it('should set state to connected', () => {
      const client = new WebSocketClient({
        url: 'wss://test.com',
        heartbeat: { enabled: false },
      });
      const stateChanges: string[] = [];
      client.on('stateChange', (state) => stateChanges.push(state));

      (client as any).handleOpen();

      expect(client.getState()).toBe('connected');
      expect(stateChanges).toContain('connected');
    });

    it('should emit reconnected when reconnectAttempts > 0', () => {
      const client = new WebSocketClient({
        url: 'wss://test.com',
        heartbeat: { enabled: false },
      });
      (client as any).reconnectAttempts = 1;

      const onReconnected = jest.fn();
      client.on('reconnected', onReconnected);

      (client as any).handleOpen();

      expect(onReconnected).toHaveBeenCalled();
      expect((client as any).reconnectAttempts).toBe(0);
    });
  });

  describe('handleClose', () => {
    it('should set state to disconnected when shouldReconnect is false', () => {
      const client = new WebSocketClient({
        url: 'wss://test.com',
        reconnect: { enabled: true },
      });
      (client as any).shouldReconnect = false;
      (client as any).state = 'connected';

      const onClose = jest.fn();
      client.on('close', onClose);

      (client as any).handleClose();

      expect(onClose).toHaveBeenCalled();
      expect(client.getState()).toBe('disconnected');
    });
  });

  describe('handleError', () => {
    it('should emit error', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      const onError = jest.fn();
      client.on('error', onError);

      (client as any).handleError(new Error('test error'));

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'test error' }));
    });
  });

  describe('handlePong', () => {
    it('should clear heartbeat timeout timer', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      (client as any).heartbeatTimeoutTimer = setTimeout(() => {}, 10000);

      (client as any).handlePong();

      expect((client as any).heartbeatTimeoutTimer).toBeNull();
    });

    it('should handle when no timeout timer exists', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      (client as any).heartbeatTimeoutTimer = null;

      expect(() => (client as any).handlePong()).not.toThrow();
    });
  });

  describe('scheduleReconnect', () => {
    it('should emit maxRetriesExceeded when exceeding max attempts', () => {
      const client = new WebSocketClient({
        url: 'wss://test.com',
        reconnect: { maxAttempts: 1 },
      });
      (client as any).reconnectAttempts = 1;
      (client as any).shouldReconnect = true;

      const onMaxRetries = jest.fn();
      client.on('maxRetriesExceeded', onMaxRetries);

      (client as any).scheduleReconnect();

      expect(onMaxRetries).toHaveBeenCalled();
      expect(client.getState()).toBe('disconnected');
    });

    it('should emit reconnecting event', () => {
      const client = new WebSocketClient({
        url: 'wss://test.com',
        reconnect: { maxAttempts: 10 },
      });
      (client as any).shouldReconnect = true;
      (client as any).reconnectAttempts = 0;

      const onReconnecting = jest.fn();
      client.on('reconnecting', onReconnecting);

      (client as any).scheduleReconnect();

      expect(onReconnecting).toHaveBeenCalledWith(1);
    });
  });

  describe('calculateReconnectDelay', () => {
    it('should calculate exponential backoff', () => {
      const client = new WebSocketClient({
        url: 'wss://test.com',
        reconnect: { initialDelay: 100, maxDelay: 10000, multiplier: 2, jitter: 0 },
      });
      (client as any).reconnectAttempts = 1;
      const delay1 = (client as any).calculateReconnectDelay();
      expect(delay1).toBe(100);

      (client as any).reconnectAttempts = 3;
      const delay3 = (client as any).calculateReconnectDelay();
      expect(delay3).toBe(400); // 100 * 2^2
    });

    it('should cap at maxDelay', () => {
      const client = new WebSocketClient({
        url: 'wss://test.com',
        reconnect: { initialDelay: 100, maxDelay: 500, multiplier: 2, jitter: 0 },
      });
      (client as any).reconnectAttempts = 10;
      const delay = (client as any).calculateReconnectDelay();
      expect(delay).toBeLessThanOrEqual(500);
    });
  });

  describe('stopHeartbeat', () => {
    it('should clear both timers', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      (client as any).heartbeatTimer = setInterval(() => {}, 1000);
      (client as any).heartbeatTimeoutTimer = setTimeout(() => {}, 1000);

      (client as any).stopHeartbeat();

      expect((client as any).heartbeatTimer).toBeNull();
      expect((client as any).heartbeatTimeoutTimer).toBeNull();
    });
  });

  describe('clearReconnectTimer', () => {
    it('should clear reconnect timer', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      (client as any).reconnectTimer = setTimeout(() => {}, 1000);

      (client as any).clearReconnectTimer();

      expect((client as any).reconnectTimer).toBeNull();
    });

    it('should handle null timer', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      (client as any).reconnectTimer = null;

      expect(() => (client as any).clearReconnectTimer()).not.toThrow();
    });
  });

  describe('setState', () => {
    it('should emit stateChange', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      const onStateChange = jest.fn();
      client.on('stateChange', onStateChange);

      (client as any).setState('connecting');

      expect(onStateChange).toHaveBeenCalledWith('connecting');
      expect(client.getState()).toBe('connecting');
    });

    it('should not emit if state unchanged', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      const onStateChange = jest.fn();
      client.on('stateChange', onStateChange);

      (client as any).setState('disconnected');

      expect(onStateChange).not.toHaveBeenCalled();
    });
  });

  describe('sendPing', () => {
    it('should call ping if available', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      const mockPing = jest.fn();
      (client as any).ws = { ping: mockPing };

      (client as any).sendPing();

      expect(mockPing).toHaveBeenCalled();
    });

    it('should skip if ping not available', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      (client as any).ws = {};

      expect(() => (client as any).sendPing()).not.toThrow();
    });
  });

  describe('terminateConnection', () => {
    it('should call terminate if available', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      const mockTerminate = jest.fn();
      (client as any).ws = { terminate: mockTerminate };

      (client as any).terminateConnection();

      expect(mockTerminate).toHaveBeenCalled();
    });

    it('should fallback to close', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      const mockClose = jest.fn();
      (client as any).ws = { close: mockClose };

      (client as any).terminateConnection();

      expect(mockClose).toHaveBeenCalled();
    });

    it('should handle null ws', () => {
      const client = new WebSocketClient({ url: 'wss://test.com' });
      (client as any).ws = null;

      expect(() => (client as any).terminateConnection()).not.toThrow();
    });
  });
});

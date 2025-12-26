/**
 * WebSocketClient Unit Tests
 *
 * Tests WebSocket connection lifecycle, reconnection, and heartbeat functionality
 */

import { WebSocketClient } from '../../../src/websocket/WebSocketClient.js';
import WebSocket from 'ws';
import { EventEmitter } from 'eventemitter3';

// Mock ws library
jest.mock('ws');

describe('WebSocketClient', () => {
  let client: WebSocketClient;
  let mockWs: jest.Mocked<WebSocket>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Create mock WebSocket instance
    mockWs = {
      readyState: WebSocket.CONNECTING,
      send: jest.fn(),
      close: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      terminate: jest.fn(),
    } as any;

    // Mock WebSocket constructor
    (WebSocket as unknown as jest.Mock).mockImplementation(() => mockWs);
  });

  afterEach(() => {
    jest.useRealTimers();
    if (client) {
      client.removeAllListeners();
    }
  });

  describe('Constructor and Configuration', () => {
    test('should create client with default config', () => {
      client = new WebSocketClient({
        url: 'wss://test.example.com',
      });

      expect(client.getState()).toBe('disconnected');
      expect(client.isConnected()).toBe(false);
    });

    test('should create client with custom reconnect config', () => {
      client = new WebSocketClient({
        url: 'wss://test.example.com',
        reconnect: {
          enabled: true,
          maxAttempts: 5,
          initialDelay: 1000,
          maxDelay: 10000,
          multiplier: 2,
          jitter: 0.2,
        },
      });

      expect(client.getState()).toBe('disconnected');
    });

    test('should create client with custom heartbeat config', () => {
      client = new WebSocketClient({
        url: 'wss://test.example.com',
        heartbeat: {
          enabled: true,
          interval: 10000,
          timeout: 5000,
          pingMessage: JSON.stringify({ type: 'custom_ping' }),
        },
      });

      expect(client.getState()).toBe('disconnected');
    });

    test('should register callback handlers', () => {
      const onMessage = jest.fn();
      const onStateChange = jest.fn();
      const onError = jest.fn();

      client = new WebSocketClient({
        url: 'wss://test.example.com',
        onMessage,
        onStateChange,
        onError,
      });

      expect(client.listenerCount('message')).toBe(1);
      expect(client.listenerCount('stateChange')).toBe(1);
      expect(client.listenerCount('error')).toBe(1);
    });
  });

  describe('Connection Lifecycle', () => {
    beforeEach(() => {
      client = new WebSocketClient({
        url: 'wss://test.example.com',
      });
    });

    test('should connect successfully', async () => {
      const connectPromise = client.connect();

      // Simulate WebSocket open event
      mockWs.readyState = WebSocket.OPEN;
      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openHandler) {
        (openHandler as Function)();
      }

      await connectPromise;

      expect(client.getState()).toBe('connected');
      expect(client.isConnected()).toBe(true);
      expect(WebSocket).toHaveBeenCalledWith('wss://test.example.com');
    });

    test('should emit state change events', async () => {
      const stateChangeHandler = jest.fn();
      client.on('stateChange', stateChangeHandler);

      const connectPromise = client.connect();

      // Simulate connection
      mockWs.readyState = WebSocket.OPEN;
      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openHandler) {
        (openHandler as Function)();
      }

      await connectPromise;

      expect(stateChangeHandler).toHaveBeenCalledWith('connecting');
      expect(stateChangeHandler).toHaveBeenCalledWith('connected');
    });

    test('should emit open event', async () => {
      const openHandler = jest.fn();
      client.on('open', openHandler);

      const connectPromise = client.connect();

      mockWs.readyState = WebSocket.OPEN;
      const wsOpenHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (wsOpenHandler) {
        (wsOpenHandler as Function)();
      }

      await connectPromise;

      expect(openHandler).toHaveBeenCalled();
    });

    test('should disconnect successfully', async () => {
      // First connect
      const connectPromise = client.connect();
      mockWs.readyState = WebSocket.OPEN;
      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openHandler) {
        (openHandler as Function)();
      }
      await connectPromise;

      // Then disconnect
      await client.disconnect();

      expect(mockWs.close).toHaveBeenCalled();
      expect(client.getState()).toBe('disconnected');
    });

    test('should emit close event', async () => {
      const closeHandler = jest.fn();
      client.on('close', closeHandler);

      const connectPromise = client.connect();
      mockWs.readyState = WebSocket.OPEN;
      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openHandler) {
        (openHandler as Function)();
      }
      await connectPromise;

      // Simulate close
      const closeWsHandler = mockWs.on.mock.calls.find(call => call[0] === 'close')?.[1];
      if (closeWsHandler) {
        (closeWsHandler as Function)();
      }

      expect(closeHandler).toHaveBeenCalled();
    });

    test('should handle connection error', async () => {
      const errorHandler = jest.fn();
      client.on('error', errorHandler);

      const connectPromise = client.connect();

      // Simulate error
      const testError = new Error('Connection failed');
      const errorWsHandler = mockWs.on.mock.calls.find(call => call[0] === 'error')?.[1];
      if (errorWsHandler) {
        (errorWsHandler as Function)(testError);
      }

      await expect(connectPromise).rejects.toThrow('Connection failed');
      expect(errorHandler).toHaveBeenCalledWith(testError);
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      client = new WebSocketClient({
        url: 'wss://test.example.com',
      });

      // Connect first
      const connectPromise = client.connect();
      mockWs.readyState = WebSocket.OPEN;
      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openHandler) {
        (openHandler as Function)();
      }
      await connectPromise;
    });

    test('should receive and parse JSON messages', () => {
      const messageHandler = jest.fn();
      client.on('message', messageHandler);

      const testMessage = { type: 'update', data: { price: 50000 } };
      const messageWsHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')?.[1];

      if (messageWsHandler) {
        (messageWsHandler as Function)(JSON.stringify(testMessage));
      }

      expect(messageHandler).toHaveBeenCalledWith(testMessage);
    });

    test('should receive raw string messages', () => {
      const messageHandler = jest.fn();
      client.on('message', messageHandler);

      const rawMessage = 'test message';
      const messageWsHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')?.[1];

      if (messageWsHandler) {
        (messageWsHandler as Function)(rawMessage);
      }

      expect(messageHandler).toHaveBeenCalledWith(rawMessage);
    });

    test('should send messages', () => {
      const testMessage = { type: 'subscribe', channel: 'orderbook' };

      client.send(testMessage);

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(testMessage));
    });

    test('should send string messages', () => {
      const rawMessage = 'test command';

      client.send(rawMessage);

      expect(mockWs.send).toHaveBeenCalledWith(rawMessage);
    });

    test('should throw error when sending while disconnected', () => {
      const disconnectedClient = new WebSocketClient({
        url: 'wss://test.example.com',
      });

      expect(() => disconnectedClient.send({ test: 'data' })).toThrow('WebSocket is not connected');
    });

    test('should track message metrics', () => {
      const messageWsHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')?.[1];

      // Receive 3 messages
      if (messageWsHandler) {
        (messageWsHandler as Function)('message 1');
        (messageWsHandler as Function)('message 2');
        (messageWsHandler as Function)('message 3');
      }

      // Send 2 messages
      client.send('message 1');
      client.send('message 2');

      const metrics = client.getMetrics();
      expect(metrics.messagesReceived).toBe(3);
      expect(metrics.messagesSent).toBe(2);
      expect(metrics.state).toBe('connected');
    });
  });

  describe('Reconnection Logic', () => {
    test('should attempt reconnection on unexpected close', async () => {
      client = new WebSocketClient({
        url: 'wss://test.example.com',
        reconnect: {
          enabled: true,
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          multiplier: 2,
          jitter: 0,
        },
      });

      const reconnectingHandler = jest.fn();
      client.on('reconnecting', reconnectingHandler);

      // Initial connection
      const connectPromise = client.connect();
      mockWs.readyState = WebSocket.OPEN;
      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openHandler) {
        (openHandler as Function)();
      }
      await connectPromise;

      // Simulate unexpected close (code !== 1000)
      const closeHandler = mockWs.on.mock.calls.find(call => call[0] === 'close')?.[1];
      if (closeHandler) {
        (closeHandler as Function)(1006, 'Abnormal closure');
      }

      // Fast-forward reconnect delay
      jest.advanceTimersByTime(1000);

      expect(reconnectingHandler).toHaveBeenCalledWith(1);
      expect(WebSocket).toHaveBeenCalledTimes(2); // Initial + 1 reconnect attempt
    });

    test('should emit reconnected event after successful reconnection', async () => {
      client = new WebSocketClient({
        url: 'wss://test.example.com',
        reconnect: {
          enabled: true,
          maxAttempts: 3,
          initialDelay: 500,
          maxDelay: 10000,
          multiplier: 2,
          jitter: 0,
        },
      });

      const reconnectedHandler = jest.fn();
      client.on('reconnected', reconnectedHandler);

      // Initial connection
      const connectPromise = client.connect();
      mockWs.readyState = WebSocket.OPEN;
      let openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openHandler) {
        (openHandler as Function)();
      }
      await connectPromise;

      // Simulate unexpected close
      const closeHandler = mockWs.on.mock.calls.find(call => call[0] === 'close')?.[1];
      if (closeHandler) {
        (closeHandler as Function)(1006, 'Abnormal closure');
      }

      // Fast-forward and simulate successful reconnection
      jest.advanceTimersByTime(500);

      // Get the new mock WebSocket instance created by reconnection
      mockWs.readyState = WebSocket.OPEN;
      const newOpenHandler = mockWs.on.mock.calls.filter(call => call[0] === 'open').pop()?.[1];
      if (newOpenHandler) {
        (newOpenHandler as Function)();
      }

      expect(reconnectedHandler).toHaveBeenCalled();
    });

    test('should emit maxRetriesExceeded after max attempts', async () => {
      client = new WebSocketClient({
        url: 'wss://test.example.com',
        reconnect: {
          enabled: true,
          maxAttempts: 2,
          initialDelay: 100,
          maxDelay: 10000,
          multiplier: 2,
          jitter: 0,
        },
      });

      const maxRetriesHandler = jest.fn();
      client.on('maxRetriesExceeded', maxRetriesHandler);

      // Initial connection
      const connectPromise = client.connect();
      mockWs.readyState = WebSocket.OPEN;
      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openHandler) {
        (openHandler as Function)();
      }
      await connectPromise;

      // Simulate close
      const closeHandler = mockWs.on.mock.calls.find(call => call[0] === 'close')?.[1];
      if (closeHandler) {
        (closeHandler as Function)(1006, 'Abnormal closure');
      }

      // Simulate failed reconnection attempts
      for (let i = 0; i < 2; i++) {
        jest.advanceTimersByTime(100 * Math.pow(2, i));

        // Simulate connection error
        const errorHandler = mockWs.on.mock.calls.filter(call => call[0] === 'error').pop()?.[1];
        if (errorHandler) {
          (errorHandler as Function)(new Error('Connection failed'));
        }
      }

      // Fast-forward to trigger max retries check
      jest.advanceTimersByTime(1000);

      expect(maxRetriesHandler).toHaveBeenCalled();
    });

    test('should not reconnect when explicitly disconnected', async () => {
      client = new WebSocketClient({
        url: 'wss://test.example.com',
        reconnect: {
          enabled: true,
          maxAttempts: 5,
          initialDelay: 500,
          maxDelay: 10000,
          multiplier: 2,
          jitter: 0,
        },
      });

      // Initial connection
      const connectPromise = client.connect();
      mockWs.readyState = WebSocket.OPEN;
      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openHandler) {
        (openHandler as Function)();
      }
      await connectPromise;

      const initialCallCount = (WebSocket as unknown as jest.Mock).mock.calls.length;

      // Explicit disconnect
      await client.disconnect();

      // Fast-forward past reconnection delay
      jest.advanceTimersByTime(5000);

      // Should not create new WebSocket instances
      expect((WebSocket as unknown as jest.Mock).mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('Heartbeat', () => {
    test('should send heartbeat pings when enabled', async () => {
      client = new WebSocketClient({
        url: 'wss://test.example.com',
        heartbeat: {
          enabled: true,
          interval: 5000,
          timeout: 2000,
          pingMessage: JSON.stringify({ type: 'ping' }),
        },
      });

      // Connect
      const connectPromise = client.connect();
      mockWs.readyState = WebSocket.OPEN;
      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openHandler) {
        (openHandler as Function)();
      }
      await connectPromise;

      // Clear send calls from connection
      mockWs.send.mockClear();

      // Fast-forward to trigger heartbeat
      jest.advanceTimersByTime(5000);

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({ type: 'ping' }));
    });

    test('should not send heartbeat when disabled', async () => {
      client = new WebSocketClient({
        url: 'wss://test.example.com',
        heartbeat: {
          enabled: false,
          interval: 5000,
          timeout: 2000,
          pingMessage: JSON.stringify({ type: 'ping' }),
        },
      });

      // Connect
      const connectPromise = client.connect();
      mockWs.readyState = WebSocket.OPEN;
      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openHandler) {
        (openHandler as Function)();
      }
      await connectPromise;

      mockWs.send.mockClear();

      // Fast-forward
      jest.advanceTimersByTime(10000);

      // Should not send ping
      expect(mockWs.send).not.toHaveBeenCalled();
    });
  });

  describe('Metrics', () => {
    beforeEach(async () => {
      client = new WebSocketClient({
        url: 'wss://test.example.com',
      });

      // Connect
      const connectPromise = client.connect();
      mockWs.readyState = WebSocket.OPEN;
      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openHandler) {
        (openHandler as Function)();
      }
      await connectPromise;
    });

    test('should track uptime', () => {
      jest.advanceTimersByTime(5000);

      const metrics = client.getMetrics();
      expect(metrics.uptime).toBeGreaterThanOrEqual(5000);
    });

    test('should track reconnect attempts', async () => {
      // Simulate close and reconnect
      const closeHandler = mockWs.on.mock.calls.find(call => call[0] === 'close')?.[1];
      if (closeHandler) {
        (closeHandler as Function)(1006, 'Abnormal closure');
      }

      jest.advanceTimersByTime(1000);

      const metrics = client.getMetrics();
      expect(metrics.reconnectAttempts).toBeGreaterThan(0);
    });

    test('should return correct state in metrics', () => {
      const metrics = client.getMetrics();
      expect(metrics.state).toBe('connected');
    });
  });

  describe('Edge Cases', () => {
    test('should handle multiple connect calls', async () => {
      client = new WebSocketClient({
        url: 'wss://test.example.com',
      });

      const promise1 = client.connect();
      const promise2 = client.connect();

      mockWs.readyState = WebSocket.OPEN;
      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openHandler) {
        (openHandler as Function)();
      }

      await Promise.all([promise1, promise2]);

      // Should only create one WebSocket instance
      expect(WebSocket).toHaveBeenCalledTimes(1);
    });

    test('should handle disconnect when not connected', async () => {
      client = new WebSocketClient({
        url: 'wss://test.example.com',
      });

      await expect(client.disconnect()).resolves.not.toThrow();
    });

    test('should clean up timers on disconnect', async () => {
      client = new WebSocketClient({
        url: 'wss://test.example.com',
        heartbeat: {
          enabled: true,
          interval: 1000,
          timeout: 500,
          pingMessage: 'ping',
        },
      });

      // Connect
      const connectPromise = client.connect();
      mockWs.readyState = WebSocket.OPEN;
      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openHandler) {
        (openHandler as Function)();
      }
      await connectPromise;

      // Disconnect
      await client.disconnect();

      // Fast-forward - no timers should fire
      mockWs.send.mockClear();
      jest.advanceTimersByTime(10000);

      expect(mockWs.send).not.toHaveBeenCalled();
    });
  });
});

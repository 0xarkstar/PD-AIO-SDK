/**
 * WebSocketManager Unit Tests
 *
 * Tests WebSocket subscription management, message routing, and resubscription logic
 */

import { WebSocketManager } from '../../../src/websocket/WebSocketManager.js';
import { WebSocketClient } from '../../../src/websocket/WebSocketClient.js';
import { EventEmitter } from 'eventemitter3';

// Mock WebSocketClient
jest.mock('../../../src/websocket/WebSocketClient.js');

describe('WebSocketManager', () => {
  let manager: WebSocketManager;
  let mockClient: jest.Mocked<WebSocketClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock WebSocketClient
    mockClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(true),
      send: jest.fn(),
      getState: jest.fn().mockReturnValue('connected'),
      getMetrics: jest.fn().mockReturnValue({
        messagesReceived: 0,
        messagesSent: 0,
        state: 'connected',
        uptime: 0,
        reconnectAttempts: 0,
      }),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn(),
    } as any;

    // Mock WebSocketClient constructor
    (WebSocketClient as unknown as jest.Mock).mockImplementation((config) => {
      // Call onMessage handler when provided
      if (config.onMessage) {
        // Store for later use
        (mockClient as any)._onMessage = config.onMessage;
      }
      if (config.onError) {
        (mockClient as any)._onError = config.onError;
      }
      return mockClient;
    });

    manager = new WebSocketManager({
      url: 'wss://test.example.com',
    });
  });

  afterEach(() => {
    manager.removeAllListeners();
  });

  describe('Connection Management', () => {
    test('should connect successfully', async () => {
      await manager.connect();

      expect(WebSocketClient).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'wss://test.example.com',
        })
      );
      expect(mockClient.connect).toHaveBeenCalled();
    });

    test('should not create multiple clients on multiple connect calls', async () => {
      await manager.connect();
      await manager.connect();

      expect(WebSocketClient).toHaveBeenCalledTimes(1);
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
    });

    test('should disconnect successfully', async () => {
      await manager.connect();
      await manager.disconnect();

      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    test('should handle disconnect when not connected', async () => {
      await expect(manager.disconnect()).resolves.not.toThrow();
    });

    test('should return connection status', async () => {
      expect(manager.isConnected()).toBe(false);

      await manager.connect();

      expect(manager.isConnected()).toBe(true);
    });

    test('should clear subscriptions on disconnect', async () => {
      await manager.connect();

      const subscriptionId = await manager.subscribe(
        'orderbook',
        { type: 'subscribe', channel: 'orderbook' },
        jest.fn()
      );

      expect(manager.getSubscriptionCount()).toBe(1);

      await manager.disconnect();

      expect(manager.getSubscriptionCount()).toBe(0);
    });
  });

  describe('Subscription Management', () => {
    beforeEach(async () => {
      await manager.connect();
    });

    test('should subscribe to a channel', async () => {
      const handler = jest.fn();
      const subscribeMessage = { type: 'subscribe', channel: 'orderbook' };

      const subscriptionId = await manager.subscribe('orderbook', subscribeMessage, handler);

      expect(subscriptionId).toMatch(/^orderbook_/);
      expect(mockClient.send).toHaveBeenCalledWith(subscribeMessage);
      expect(manager.getSubscriptionCount()).toBe(1);
    });

    test('should emit subscribed event', async () => {
      const subscribedHandler = jest.fn();
      manager.on('subscribed', subscribedHandler);

      const subscriptionId = await manager.subscribe(
        'orderbook',
        { type: 'subscribe', channel: 'orderbook' },
        jest.fn()
      );

      expect(subscribedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: subscriptionId,
          channel: 'orderbook',
          active: true,
        })
      );
    });

    test('should throw error when subscribing without connection', async () => {
      const disconnectedManager = new WebSocketManager({
        url: 'wss://test.example.com',
      });

      await expect(
        disconnectedManager.subscribe('orderbook', { type: 'subscribe' }, jest.fn())
      ).rejects.toThrow('WebSocket not initialized');
    });

    test('should handle subscription errors', async () => {
      mockClient.send.mockImplementationOnce(() => {
        throw new Error('Send failed');
      });

      await expect(
        manager.subscribe('orderbook', { type: 'subscribe' }, jest.fn())
      ).rejects.toThrow('Failed to subscribe to orderbook');
    });

    test('should queue subscription when not connected', async () => {
      mockClient.isConnected.mockReturnValue(false);

      const handler = jest.fn();
      const subscriptionId = await manager.subscribe(
        'orderbook',
        { type: 'subscribe', channel: 'orderbook' },
        handler
      );

      expect(subscriptionId).toBeDefined();
      expect(mockClient.send).not.toHaveBeenCalled();
      expect(manager.getSubscriptionCount()).toBe(1);
    });

    test('should unsubscribe from a channel', async () => {
      const subscriptionId = await manager.subscribe(
        'orderbook',
        { type: 'subscribe', channel: 'orderbook' },
        jest.fn()
      );

      expect(manager.getSubscriptionCount()).toBe(1);

      await manager.unsubscribe(subscriptionId, { type: 'unsubscribe', channel: 'orderbook' });

      expect(manager.getSubscriptionCount()).toBe(0);
      expect(mockClient.send).toHaveBeenCalledWith({
        type: 'unsubscribe',
        channel: 'orderbook',
      });
    });

    test('should emit unsubscribed event', async () => {
      const unsubscribedHandler = jest.fn();
      manager.on('unsubscribed', unsubscribedHandler);

      const subscriptionId = await manager.subscribe(
        'orderbook',
        { type: 'subscribe', channel: 'orderbook' },
        jest.fn()
      );

      await manager.unsubscribe(subscriptionId);

      expect(unsubscribedHandler).toHaveBeenCalledWith(subscriptionId);
    });

    test('should handle unsubscribe for non-existent subscription', async () => {
      await expect(manager.unsubscribe('invalid-id')).resolves.not.toThrow();
    });

    test('should handle unsubscribe errors gracefully', async () => {
      const errorHandler = jest.fn();
      manager.on('error', errorHandler);

      const subscriptionId = await manager.subscribe(
        'orderbook',
        { type: 'subscribe' },
        jest.fn()
      );

      mockClient.send.mockImplementationOnce(() => {
        throw new Error('Unsubscribe failed');
      });

      await manager.unsubscribe(subscriptionId, { type: 'unsubscribe' });

      expect(errorHandler).toHaveBeenCalled();
      expect(manager.getSubscriptionCount()).toBe(0);
    });

    test('should unsubscribe from all channels', async () => {
      await manager.subscribe('orderbook', { type: 'subscribe', channel: 'orderbook' }, jest.fn());
      await manager.subscribe('trades', { type: 'subscribe', channel: 'trades' }, jest.fn());
      await manager.subscribe('ticker', { type: 'subscribe', channel: 'ticker' }, jest.fn());

      expect(manager.getSubscriptionCount()).toBe(3);

      await manager.unsubscribeAll();

      expect(manager.getSubscriptionCount()).toBe(0);
    });

    test('should handle multiple subscriptions to same channel', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const id1 = await manager.subscribe('orderbook', { type: 'subscribe' }, handler1);
      const id2 = await manager.subscribe('orderbook', { type: 'subscribe' }, handler2);

      expect(id1).not.toBe(id2);
      expect(manager.getSubscriptionCount()).toBe(2);
    });
  });

  describe('Message Routing', () => {
    beforeEach(async () => {
      await manager.connect();
    });

    test('should route messages to correct subscription handler', async () => {
      const orderbookHandler = jest.fn();
      const tradesHandler = jest.fn();

      await manager.subscribe(
        'orderbook',
        { type: 'subscribe', channel: 'orderbook' },
        orderbookHandler
      );
      await manager.subscribe('trades', { type: 'subscribe', channel: 'trades' }, tradesHandler);

      // Simulate incoming messages
      const onMessage = (mockClient as any)._onMessage;
      if (onMessage) {
        onMessage({ channel: 'orderbook', data: { bids: [], asks: [] } });
        onMessage({ channel: 'trades', data: { trades: [] } });
      }

      expect(orderbookHandler).toHaveBeenCalledWith({
        channel: 'orderbook',
        data: { bids: [], asks: [] },
      });
      expect(tradesHandler).toHaveBeenCalledWith({
        channel: 'trades',
        data: { trades: [] },
      });
    });

    test('should emit message event for each incoming message', async () => {
      const messageHandler = jest.fn();
      manager.on('message', messageHandler);

      await manager.subscribe('orderbook', { type: 'subscribe', channel: 'orderbook' }, jest.fn());

      const onMessage = (mockClient as any)._onMessage;
      if (onMessage) {
        onMessage({ channel: 'orderbook', data: { test: 'data' } });
      }

      expect(messageHandler).toHaveBeenCalledWith('orderbook', {
        channel: 'orderbook',
        data: { test: 'data' },
      });
    });

    test('should not route messages to inactive subscriptions', async () => {
      const handler = jest.fn();

      const subscriptionId = await manager.subscribe(
        'orderbook',
        { type: 'subscribe', channel: 'orderbook' },
        handler
      );

      await manager.unsubscribe(subscriptionId);

      const onMessage = (mockClient as any)._onMessage;
      if (onMessage) {
        onMessage({ channel: 'orderbook', data: { test: 'data' } });
      }

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Reconnection and Resubscription', () => {
    test('should resubscribe on reconnect', async () => {
      await manager.connect();

      // Subscribe to channels
      await manager.subscribe('orderbook', { type: 'subscribe', channel: 'orderbook' }, jest.fn());
      await manager.subscribe('trades', { type: 'subscribe', channel: 'trades' }, jest.fn());

      // Clear send calls
      mockClient.send.mockClear();

      // Simulate reconnection event
      const onHandler = mockClient.on.mock.calls.find((call) => call[0] === 'reconnected')?.[1];
      if (onHandler) {
        await (onHandler as Function)();
      }

      // Should resend subscription messages
      expect(mockClient.send).toHaveBeenCalledTimes(2);
      expect(mockClient.send).toHaveBeenCalledWith({ type: 'subscribe', channel: 'orderbook' });
      expect(mockClient.send).toHaveBeenCalledWith({ type: 'subscribe', channel: 'trades' });
    });

    test('should emit reconnected event', async () => {
      const reconnectedHandler = jest.fn();
      manager.on('reconnected', reconnectedHandler);

      await manager.connect();

      // Simulate reconnection
      const onHandler = mockClient.on.mock.calls.find((call) => call[0] === 'reconnected')?.[1];
      if (onHandler) {
        await (onHandler as Function)();
      }

      expect(reconnectedHandler).toHaveBeenCalled();
    });
  });

  describe('Async Generator (watch)', () => {
    beforeEach(async () => {
      await manager.connect();
    });

    test('should yield messages from async generator', async () => {
      const generator = manager.watch('orderbook', { type: 'subscribe', channel: 'orderbook' });

      // Simulate incoming message
      setTimeout(() => {
        const onMessage = (mockClient as any)._onMessage;
        if (onMessage) {
          onMessage({ channel: 'orderbook', data: { price: 50000 } });
        }
      }, 10);

      const { value } = await generator.next();

      expect(value).toEqual({ channel: 'orderbook', data: { price: 50000 } });

      await generator.return();
    });

    test('should cleanup subscription when generator exits', async () => {
      const generator = manager.watch(
        'orderbook',
        { type: 'subscribe', channel: 'orderbook' },
        { type: 'unsubscribe', channel: 'orderbook' }
      );

      // Trigger the generator to execute subscription
      const nextPromise = generator.next();

      // Send a message to unblock the generator
      setTimeout(() => {
        const onMessage = (mockClient as any)._onMessage;
        if (onMessage) {
          onMessage({ channel: 'orderbook', data: { test: true } });
        }
      }, 10);

      // Wait for the first message
      await nextPromise;

      expect(manager.getSubscriptionCount()).toBe(1);

      await generator.return();

      expect(manager.getSubscriptionCount()).toBe(0);
      expect(mockClient.send).toHaveBeenCalledWith({ type: 'unsubscribe', channel: 'orderbook' });
    });

    test('should queue messages when not immediately consumed', async () => {
      const generator = manager.watch('orderbook', { type: 'subscribe', channel: 'orderbook' });

      // Trigger the generator to complete subscription
      const firstNext = generator.next();
      await Promise.resolve(); // Allow subscription to complete

      // Send multiple messages before consuming
      const onMessage = (mockClient as any)._onMessage;
      if (onMessage) {
        onMessage({ channel: 'orderbook', data: { seq: 1 } });
        onMessage({ channel: 'orderbook', data: { seq: 2 } });
        onMessage({ channel: 'orderbook', data: { seq: 3 } });
      }

      // Consume messages
      const message1 = await firstNext; // First message already queued
      const message2 = await generator.next();
      const message3 = await generator.next();

      expect(message1.value).toEqual({ channel: 'orderbook', data: { seq: 1 } });
      expect(message2.value).toEqual({ channel: 'orderbook', data: { seq: 2 } });
      expect(message3.value).toEqual({ channel: 'orderbook', data: { seq: 3 } });

      await generator.return();
    });
  });

  describe('Error Handling', () => {
    test('should forward client errors', async () => {
      const errorHandler = jest.fn();
      manager.on('error', errorHandler);

      await manager.connect();

      const testError = new Error('Connection error');
      const onError = (mockClient as any)._onError;
      if (onError) {
        onError(testError);
      }

      expect(errorHandler).toHaveBeenCalledWith(testError);
    });

    test('should handle errors during message handling', async () => {
      const errorHandler = jest.fn();
      manager.on('error', errorHandler);

      await manager.connect();

      // Subscribe with handler that throws
      const throwingHandler = jest.fn(() => {
        throw new Error('Handler error');
      });

      await manager.subscribe('orderbook', { type: 'subscribe' }, throwingHandler);

      // Should not crash when message arrives
      const onMessage = (mockClient as any)._onMessage;
      if (onMessage) {
        expect(() => {
          onMessage({ channel: 'orderbook', data: {} });
        }).not.toThrow();
      }
    });
  });

  describe('Metrics and Status', () => {
    beforeEach(async () => {
      await manager.connect();
    });

    test('should track subscription count', async () => {
      expect(manager.getSubscriptionCount()).toBe(0);

      await manager.subscribe('orderbook', { type: 'subscribe' }, jest.fn());
      expect(manager.getSubscriptionCount()).toBe(1);

      await manager.subscribe('trades', { type: 'subscribe' }, jest.fn());
      expect(manager.getSubscriptionCount()).toBe(2);

      const subscriptionId = await manager.subscribe('ticker', { type: 'subscribe' }, jest.fn());
      expect(manager.getSubscriptionCount()).toBe(3);

      await manager.unsubscribe(subscriptionId);
      expect(manager.getSubscriptionCount()).toBe(2);
    });

    test('should only count active subscriptions', async () => {
      const id1 = await manager.subscribe('orderbook', { type: 'subscribe' }, jest.fn());
      const id2 = await manager.subscribe('trades', { type: 'subscribe' }, jest.fn());

      expect(manager.getSubscriptionCount()).toBe(2);

      await manager.unsubscribe(id1);

      expect(manager.getSubscriptionCount()).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid subscribe/unsubscribe', async () => {
      await manager.connect();

      const id = await manager.subscribe('orderbook', { type: 'subscribe' }, jest.fn());
      await manager.unsubscribe(id);

      expect(manager.getSubscriptionCount()).toBe(0);
    });

    test('should handle subscription before connection established', async () => {
      mockClient.isConnected.mockReturnValue(false);

      await manager.connect();

      const id = await manager.subscribe('orderbook', { type: 'subscribe' }, jest.fn());

      expect(id).toBeDefined();
      expect(manager.getSubscriptionCount()).toBe(1);
    });

    test('should generate unique subscription IDs', async () => {
      await manager.connect();

      const ids = new Set();

      for (let i = 0; i < 100; i++) {
        const id = await manager.subscribe('orderbook', { type: 'subscribe' }, jest.fn());
        ids.add(id);
      }

      expect(ids.size).toBe(100); // All IDs should be unique
    });

    test('should handle messages with missing channel field', async () => {
      const handler = jest.fn();
      manager.on('message', handler);

      await manager.connect();

      await manager.subscribe('orderbook', { type: 'subscribe' }, jest.fn());

      const onMessage = (mockClient as any)._onMessage;
      if (onMessage) {
        onMessage({ data: { test: 'data' } }); // No channel field
      }

      // Should not crash
      expect(() => {
        onMessage({ data: { test: 'data' } });
      }).not.toThrow();
    });
  });

  describe('Dropped Message Counter (lines 40-47)', () => {
    test('should return 0 initially for dropped message count', () => {
      expect(manager.getDroppedMessageCount()).toBe(0);
    });

    test('should reset dropped message count to 0', () => {
      manager.resetDroppedMessageCount();
      expect(manager.getDroppedMessageCount()).toBe(0);
    });
  });
});

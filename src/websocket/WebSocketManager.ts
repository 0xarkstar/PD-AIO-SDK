/**
 * WebSocket Manager
 *
 * Manages multiple WebSocket connections and subscriptions
 */

import EventEmitter from 'eventemitter3';
import { WebSocketDisconnectedError } from '../types/errors.js';
import type { Subscription, WebSocketConfig, WebSocketMessage } from './types.js';
import { WebSocketClient } from './WebSocketClient.js';

interface ManagerEvents {
  message: (channel: string, data: unknown) => void;
  error: (error: Error) => void;
  subscribed: (subscription: Subscription) => void;
  unsubscribed: (subscriptionId: string) => void;
  reconnected: () => void;
}

export class WebSocketManager extends EventEmitter<ManagerEvents> {
  private client: WebSocketClient | null = null;
  private subscriptions = new Map<string, Subscription>();
  private messageQueue: Array<{ channel: string; data: unknown }> = [];
  private isResubscribing = false;

  constructor(private readonly config: WebSocketConfig) {
    super();
  }

  /**
   * Initialize connection
   */
  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    this.client = new WebSocketClient({
      ...this.config,
      onMessage: (data) => this.handleMessage(data),
      onError: (error) => this.emit('error', error),
    });

    this.client.on('reconnected', () => {
      void this.resubscribeAll();
    });

    await this.client.connect();
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    this.subscriptions.clear();
    this.messageQueue = [];

    await this.client.disconnect();
    this.client = null;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client?.isConnected() ?? false;
  }

  /**
   * Subscribe to a channel
   *
   * @param channel - Channel identifier
   * @param subscriptionMessage - Subscription message to send
   * @param handler - Message handler for this subscription
   * @returns Subscription ID
   */
  async subscribe(
    channel: string,
    subscriptionMessage: unknown,
    handler: (data: unknown) => void
  ): Promise<string> {
    if (!this.client) {
      throw new WebSocketDisconnectedError(
        'WebSocket not initialized',
        'WS_NOT_INITIALIZED',
        'unknown'
      );
    }

    // Generate subscription ID
    const subscriptionId = `${channel}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create subscription record
    const subscription: Subscription = {
      id: subscriptionId,
      channel,
      handler,
      active: true,
      timestamp: Date.now(),
      params: subscriptionMessage as Record<string, unknown>,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription message if connected
    if (this.isConnected()) {
      try {
        this.client.send(subscriptionMessage);
        this.emit('subscribed', subscription);
      } catch (error) {
        this.subscriptions.delete(subscriptionId);
        throw new WebSocketDisconnectedError(
          `Failed to subscribe to ${channel}`,
          'SUBSCRIPTION_FAILED',
          'unknown',
          error
        );
      }
    } else {
      // Queue subscription for when connection is established
      this.messageQueue.push({ channel, data: subscriptionMessage });
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from a channel
   *
   * @param subscriptionId - Subscription ID to remove
   * @param unsubscribeMessage - Optional unsubscribe message
   */
  async unsubscribe(subscriptionId: string, unsubscribeMessage?: unknown): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);

    if (!subscription) {
      return;
    }

    // Mark as inactive
    subscription.active = false;

    // Send unsubscribe message if provided and connected
    if (unsubscribeMessage && this.isConnected() && this.client) {
      try {
        this.client.send(unsubscribeMessage);
      } catch (error) {
        this.emit('error', new Error(`Failed to unsubscribe: ${error}`));
      }
    }

    // Remove subscription
    this.subscriptions.delete(subscriptionId);
    this.emit('unsubscribed', subscriptionId);
  }

  /**
   * Unsubscribe from all subscriptions
   */
  async unsubscribeAll(): Promise<void> {
    const subscriptionIds = Array.from(this.subscriptions.keys());

    for (const id of subscriptionIds) {
      await this.unsubscribe(id);
    }
  }

  /**
   * Get active subscription count
   */
  getSubscriptionCount(): number {
    return Array.from(this.subscriptions.values()).filter((sub) => sub.active).length;
  }

  /**
   * Create async generator for subscribing to a channel
   *
   * @param channel - Channel identifier
   * @param subscriptionMessage - Subscription message to send
   * @param unsubscribeMessage - Optional unsubscribe message
   * @returns Async generator yielding channel messages
   */
  async *watch<T>(
    channel: string,
    subscriptionMessage: unknown,
    unsubscribeMessage?: unknown
  ): AsyncGenerator<T> {
    const messageQueue: T[] = [];
    let resolveNext: ((value: T) => void) | null = null;
    let subscriptionId: string | null = null;

    try {
      // Subscribe with handler that queues messages
      subscriptionId = await this.subscribe(channel, subscriptionMessage, (data: unknown) => {
        const typedData = data as T;

        if (resolveNext) {
          resolveNext(typedData);
          resolveNext = null;
        } else {
          messageQueue.push(typedData);
        }
      });

      // Yield messages as they arrive
      while (true) {
        if (messageQueue.length > 0) {
          yield messageQueue.shift()!;
        } else {
          // Wait for next message
          yield await new Promise<T>((resolve) => {
            resolveNext = resolve;
          });
        }
      }
    } finally {
      // Cleanup on generator exit
      if (subscriptionId) {
        await this.unsubscribe(subscriptionId, unsubscribeMessage);
      }
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: unknown): void {
    try {
      const message = this.parseMessage(data);

      // Route message to appropriate subscription handlers
      for (const subscription of this.subscriptions.values()) {
        if (subscription.active && this.messageMatchesSubscription(message, subscription)) {
          try {
            subscription.handler(message.data);
          } catch (error) {
            this.emit('error', new Error(`Subscription handler error: ${error}`));
          }
        }
      }

      // Emit message event
      if (message.channel) {
        this.emit('message', message.channel, message.data);
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to handle message: ${error}`));
    }
  }

  /**
   * Parse incoming message into structured format
   */
  private parseMessage(data: unknown): WebSocketMessage {
    // Default parsing - exchanges will override this
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    return {
      type: (parsed as { type?: string }).type ?? 'unknown',
      channel: (parsed as { channel?: string }).channel,
      data: parsed,
      timestamp: Date.now(),
      sequenceId: (parsed as { sequenceId?: number }).sequenceId,
    };
  }

  /**
   * Check if message matches subscription
   */
  private messageMatchesSubscription(
    message: WebSocketMessage,
    subscription: Subscription
  ): boolean {
    // Default matching by channel
    return message.channel === subscription.channel;
  }

  /**
   * Resubscribe to all active subscriptions
   */
  private async resubscribeAll(): Promise<void> {
    if (this.isResubscribing || !this.isConnected() || !this.client) {
      return;
    }

    this.isResubscribing = true;

    try {
      // Process queued messages first
      for (const { data } of this.messageQueue) {
        try {
          this.client.send(data);
        } catch (error) {
          this.emit('error', new Error(`Failed to send queued message: ${error}`));
        }
      }

      this.messageQueue = [];

      // Resubscribe to all active subscriptions
      for (const subscription of this.subscriptions.values()) {
        if (subscription.active && subscription.params) {
          try {
            this.client.send(subscription.params);
          } catch (error) {
            this.emit(
              'error',
              new Error(`Failed to resubscribe to ${subscription.channel}: ${error}`)
            );
          }
        }
      }

      this.emit('reconnected');
    } finally {
      this.isResubscribing = false;
    }
  }
}

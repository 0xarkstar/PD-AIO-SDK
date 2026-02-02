/**
 * WebSocket Manager
 *
 * Manages multiple WebSocket connections and subscriptions
 * with bounded queue and backpressure support
 */
import EventEmitter from 'eventemitter3';
import { WebSocketDisconnectedError } from '../types/errors.js';
import { WebSocketClient } from './WebSocketClient.js';
/** Maximum queue size for message backpressure */
const MAX_QUEUE_SIZE = 1000;
export class WebSocketManager extends EventEmitter {
    config;
    client = null;
    subscriptions = new Map();
    messageQueue = [];
    isResubscribing = false;
    droppedMessageCount = 0;
    constructor(config) {
        super();
        this.config = config;
    }
    /**
     * Get the number of messages dropped due to queue overflow
     */
    getDroppedMessageCount() {
        return this.droppedMessageCount;
    }
    /**
     * Reset the dropped message counter
     */
    resetDroppedMessageCount() {
        this.droppedMessageCount = 0;
    }
    /**
     * Initialize connection
     */
    async connect() {
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
    async disconnect() {
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
    isConnected() {
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
    async subscribe(channel, subscriptionMessage, handler) {
        if (!this.client) {
            throw new WebSocketDisconnectedError('WebSocket not initialized', 'WS_NOT_INITIALIZED', 'unknown');
        }
        // Generate subscription ID
        const subscriptionId = `${channel}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Create subscription record
        const subscription = {
            id: subscriptionId,
            channel,
            handler,
            active: true,
            timestamp: Date.now(),
            params: subscriptionMessage,
        };
        this.subscriptions.set(subscriptionId, subscription);
        // Send subscription message if connected
        if (this.isConnected()) {
            try {
                this.client.send(subscriptionMessage);
                this.emit('subscribed', subscription);
            }
            catch (error) {
                this.subscriptions.delete(subscriptionId);
                throw new WebSocketDisconnectedError(`Failed to subscribe to ${channel}`, 'SUBSCRIPTION_FAILED', 'unknown', error);
            }
        }
        else {
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
    async unsubscribe(subscriptionId, unsubscribeMessage) {
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
            }
            catch (error) {
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
    async unsubscribeAll() {
        const subscriptionIds = Array.from(this.subscriptions.keys());
        for (const id of subscriptionIds) {
            await this.unsubscribe(id);
        }
    }
    /**
     * Get active subscription count
     */
    getSubscriptionCount() {
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
    async *watch(channel, subscriptionMessage, unsubscribeMessage) {
        const messageQueue = [];
        let resolveNext = null;
        let subscriptionId = null;
        let localDroppedCount = 0;
        // Subscribe with handler that queues messages with bounded queue
        subscriptionId = await this.subscribe(channel, subscriptionMessage, (data) => {
            const typedData = data;
            if (resolveNext) {
                // Immediately resolve if waiting
                resolveNext(typedData);
                resolveNext = null;
            }
            else {
                // Apply backpressure: drop oldest message if queue is full
                if (messageQueue.length >= MAX_QUEUE_SIZE) {
                    messageQueue.shift();
                    localDroppedCount++;
                    this.droppedMessageCount++;
                    this.emit('queueOverflow', channel, localDroppedCount);
                }
                messageQueue.push(typedData);
            }
        });
        try {
            // Yield messages as they arrive
            while (true) {
                if (messageQueue.length > 0) {
                    yield messageQueue.shift();
                }
                else {
                    // Wait for next message - event-driven, no polling
                    yield await new Promise((resolve) => {
                        resolveNext = resolve;
                    });
                }
            }
        }
        finally {
            // Cleanup on generator exit
            if (subscriptionId) {
                await this.unsubscribe(subscriptionId, unsubscribeMessage);
            }
        }
    }
    /**
     * Handle incoming WebSocket message
     */
    handleMessage(data) {
        try {
            const message = this.parseMessage(data);
            // Route message to appropriate subscription handlers
            for (const subscription of this.subscriptions.values()) {
                if (subscription.active && this.messageMatchesSubscription(message, subscription)) {
                    try {
                        subscription.handler(message.data);
                    }
                    catch (error) {
                        this.emit('error', new Error(`Subscription handler error: ${error}`));
                    }
                }
            }
            // Emit message event
            if (message.channel) {
                this.emit('message', message.channel, message.data);
            }
        }
        catch (error) {
            this.emit('error', new Error(`Failed to handle message: ${error}`));
        }
    }
    /**
     * Parse incoming message into structured format
     */
    parseMessage(data) {
        // Default parsing - exchanges will override this
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        return {
            type: parsed.type ?? 'unknown',
            channel: parsed.channel,
            data: parsed,
            timestamp: Date.now(),
            sequenceId: parsed.sequenceId,
        };
    }
    /**
     * Check if message matches subscription
     */
    messageMatchesSubscription(message, subscription) {
        // Default matching by channel
        return message.channel === subscription.channel;
    }
    /**
     * Resubscribe to all active subscriptions
     */
    async resubscribeAll() {
        if (this.isResubscribing || !this.isConnected() || !this.client) {
            return;
        }
        this.isResubscribing = true;
        try {
            // Process queued messages first
            for (const { data } of this.messageQueue) {
                try {
                    this.client.send(data);
                }
                catch (error) {
                    this.emit('error', new Error(`Failed to send queued message: ${error}`));
                }
            }
            this.messageQueue = [];
            // Resubscribe to all active subscriptions
            for (const subscription of this.subscriptions.values()) {
                if (subscription.active && subscription.params) {
                    try {
                        this.client.send(subscription.params);
                    }
                    catch (error) {
                        this.emit('error', new Error(`Failed to resubscribe to ${subscription.channel}: ${error}`));
                    }
                }
            }
            this.emit('reconnected');
        }
        finally {
            this.isResubscribing = false;
        }
    }
}
//# sourceMappingURL=WebSocketManager.js.map
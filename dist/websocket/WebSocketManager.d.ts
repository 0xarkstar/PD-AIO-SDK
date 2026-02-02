/**
 * WebSocket Manager
 *
 * Manages multiple WebSocket connections and subscriptions
 * with bounded queue and backpressure support
 */
import EventEmitter from 'eventemitter3';
import type { Subscription, WebSocketConfig } from './types.js';
interface ManagerEvents {
    message: (channel: string, data: unknown) => void;
    error: (error: Error) => void;
    subscribed: (subscription: Subscription) => void;
    unsubscribed: (subscriptionId: string) => void;
    reconnected: () => void;
    queueOverflow: (channel: string, droppedCount: number) => void;
}
export declare class WebSocketManager extends EventEmitter<ManagerEvents> {
    private readonly config;
    private client;
    private subscriptions;
    private messageQueue;
    private isResubscribing;
    private droppedMessageCount;
    constructor(config: WebSocketConfig);
    /**
     * Get the number of messages dropped due to queue overflow
     */
    getDroppedMessageCount(): number;
    /**
     * Reset the dropped message counter
     */
    resetDroppedMessageCount(): void;
    /**
     * Initialize connection
     */
    connect(): Promise<void>;
    /**
     * Disconnect and cleanup
     */
    disconnect(): Promise<void>;
    /**
     * Check if connected
     */
    isConnected(): boolean;
    /**
     * Subscribe to a channel
     *
     * @param channel - Channel identifier
     * @param subscriptionMessage - Subscription message to send
     * @param handler - Message handler for this subscription
     * @returns Subscription ID
     */
    subscribe(channel: string, subscriptionMessage: unknown, handler: (data: unknown) => void): Promise<string>;
    /**
     * Unsubscribe from a channel
     *
     * @param subscriptionId - Subscription ID to remove
     * @param unsubscribeMessage - Optional unsubscribe message
     */
    unsubscribe(subscriptionId: string, unsubscribeMessage?: unknown): Promise<void>;
    /**
     * Unsubscribe from all subscriptions
     */
    unsubscribeAll(): Promise<void>;
    /**
     * Get active subscription count
     */
    getSubscriptionCount(): number;
    /**
     * Create async generator for subscribing to a channel
     *
     * @param channel - Channel identifier
     * @param subscriptionMessage - Subscription message to send
     * @param unsubscribeMessage - Optional unsubscribe message
     * @returns Async generator yielding channel messages
     */
    watch<T>(channel: string, subscriptionMessage: unknown, unsubscribeMessage?: unknown): AsyncGenerator<T>;
    /**
     * Handle incoming WebSocket message
     */
    private handleMessage;
    /**
     * Parse incoming message into structured format
     */
    private parseMessage;
    /**
     * Check if message matches subscription
     */
    private messageMatchesSubscription;
    /**
     * Resubscribe to all active subscriptions
     */
    private resubscribeAll;
}
export {};
//# sourceMappingURL=WebSocketManager.d.ts.map
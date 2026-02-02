/**
 * WebSocket Client with Auto-Reconnection
 *
 * Handles connection lifecycle, reconnection logic, and heartbeat.
 * Works in both Node.js and browser environments.
 */
import { EventEmitter } from 'eventemitter3';
import type { ConnectionState, WebSocketConfig, WebSocketMetrics } from './types.js';
interface WebSocketEvents {
    stateChange: (state: ConnectionState) => void;
    message: (data: unknown) => void;
    error: (error: Error) => void;
    open: () => void;
    close: () => void;
    reconnecting: (attempt: number) => void;
    reconnected: () => void;
    maxRetriesExceeded: () => void;
}
export declare class WebSocketClient extends EventEmitter<WebSocketEvents> {
    private ws;
    private state;
    private reconnectAttempts;
    private reconnectTimer;
    private heartbeatTimer;
    private heartbeatTimeoutTimer;
    private connectTimestamp;
    private messagesSent;
    private messagesReceived;
    private shouldReconnect;
    private readonly url;
    private readonly reconnectConfig;
    private readonly heartbeatConfig;
    constructor(config: WebSocketConfig);
    /**
     * Get current connection state
     */
    getState(): ConnectionState;
    /**
     * Check if connected
     */
    isConnected(): boolean;
    /**
     * Get connection metrics
     */
    getMetrics(): WebSocketMetrics;
    /**
     * Connect to WebSocket server
     */
    connect(): Promise<void>;
    /**
     * Disconnect from WebSocket server
     */
    disconnect(): Promise<void>;
    /**
     * Send message through WebSocket
     */
    send(data: unknown): void;
    /**
     * Create WebSocket connection
     * Supports both Node.js (ws package) and browser (native WebSocket)
     */
    private createConnection;
    /**
     * Handle connection open
     */
    private handleOpen;
    /**
     * Handle incoming message
     * Supports both Node.js Buffer and browser string/ArrayBuffer
     */
    private handleMessage;
    /**
     * Handle connection close
     */
    private handleClose;
    /**
     * Handle connection error
     */
    private handleError;
    /**
     * Handle pong response (heartbeat)
     */
    private handlePong;
    /**
     * Schedule reconnection attempt
     */
    private scheduleReconnect;
    /**
     * Calculate reconnect delay with exponential backoff and jitter
     */
    private calculateReconnectDelay;
    /**
     * Start heartbeat/ping mechanism
     * In browsers, we rely on application-level ping messages since
     * the WebSocket API doesn't expose ping/pong frames.
     */
    private startHeartbeat;
    /**
     * Send WebSocket ping frame (Node.js only)
     */
    private sendPing;
    /**
     * Forcefully terminate the connection
     * Uses terminate() on Node.js, close() on browsers
     */
    private terminateConnection;
    /**
     * Stop heartbeat mechanism
     */
    private stopHeartbeat;
    /**
     * Clear reconnect timer
     */
    private clearReconnectTimer;
    /**
     * Update connection state
     */
    private setState;
}
export {};
//# sourceMappingURL=WebSocketClient.d.ts.map
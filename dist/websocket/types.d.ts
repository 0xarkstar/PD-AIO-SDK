/**
 * WebSocket Types and Interfaces
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnecting' | 'disconnected';
export interface WebSocketConfig {
    /** WebSocket URL */
    url: string;
    /** Reconnection configuration */
    reconnect?: ReconnectConfig;
    /** Heartbeat/ping configuration */
    heartbeat?: HeartbeatConfig;
    /** Message handler */
    onMessage?: (message: unknown) => void;
    /** Connection state change handler */
    onStateChange?: (state: ConnectionState) => void;
    /** Error handler */
    onError?: (error: Error) => void;
}
export interface ReconnectConfig {
    /** Enable auto-reconnection */
    enabled: boolean;
    /** Maximum retry attempts (0 = unlimited) */
    maxAttempts: number;
    /** Initial delay before first retry (ms) */
    initialDelay: number;
    /** Maximum delay cap (ms) */
    maxDelay: number;
    /** Multiplier for exponential backoff */
    multiplier: number;
    /** Random jitter factor (0-1) */
    jitter: number;
}
export interface HeartbeatConfig {
    /** Enable heartbeat/ping-pong */
    enabled: boolean;
    /** Interval between pings (ms) */
    interval: number;
    /** Timeout to consider connection dead (ms) */
    timeout: number;
    /** Custom ping message */
    pingMessage?: unknown;
}
export interface Subscription {
    /** Unique subscription ID */
    id: string;
    /** Channel identifier */
    channel: string;
    /** Subscription parameters */
    params?: Record<string, unknown>;
    /** Message handler for this subscription */
    handler: (data: unknown) => void;
    /** Whether subscription is active */
    active: boolean;
    /** Timestamp when subscribed (ms) */
    timestamp: number;
}
export interface WebSocketMessage {
    /** Message type/method */
    type: string;
    /** Message channel */
    channel?: string;
    /** Message data */
    data: unknown;
    /** Message timestamp (ms) */
    timestamp: number;
    /** Message sequence ID (if available) */
    sequenceId?: number;
}
export type MessageHandler = (message: WebSocketMessage) => void;
export interface WebSocketMetrics {
    /** Total messages received */
    messagesReceived: number;
    /** Total messages sent */
    messagesSent: number;
    /** Number of reconnection attempts */
    reconnectAttempts: number;
    /** Current connection state */
    state: ConnectionState;
    /** Connection uptime (ms) */
    uptime: number;
    /** Last error */
    lastError?: string;
    /** Active subscriptions count */
    activeSubscriptions: number;
}
//# sourceMappingURL=types.d.ts.map
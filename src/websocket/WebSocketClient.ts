/**
 * WebSocket Client with Auto-Reconnection
 *
 * Handles connection lifecycle, reconnection logic, and heartbeat
 */

import EventEmitter from 'eventemitter3';
import WebSocket from 'ws';
import type {
  ConnectionState,
  HeartbeatConfig,
  ReconnectConfig,
  WebSocketConfig,
  WebSocketMetrics,
} from './types.js';

const DEFAULT_RECONNECT_CONFIG: ReconnectConfig = {
  enabled: true,
  maxAttempts: 10,
  initialDelay: 500,
  maxDelay: 30000,
  multiplier: 2,
  jitter: 0.1,
};

const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
  enabled: false,
  interval: 30000,
  timeout: 5000,
  pingMessage: JSON.stringify({ type: 'ping' }),
};

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

export class WebSocketClient extends EventEmitter<WebSocketEvents> {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private heartbeatTimeoutTimer: NodeJS.Timeout | null = null;
  private connectTimestamp = 0;
  private messagesSent = 0;
  private messagesReceived = 0;
  private shouldReconnect = true;

  private readonly url: string;
  private readonly reconnectConfig: ReconnectConfig;
  private readonly heartbeatConfig: HeartbeatConfig;

  constructor(config: WebSocketConfig) {
    super();

    this.url = config.url;
    this.reconnectConfig = { ...DEFAULT_RECONNECT_CONFIG, ...config.reconnect };
    this.heartbeatConfig = { ...DEFAULT_HEARTBEAT_CONFIG, ...config.heartbeat };

    if (config.onMessage) {
      this.on('message', config.onMessage);
    }

    if (config.onStateChange) {
      this.on('stateChange', config.onStateChange);
    }

    if (config.onError) {
      this.on('error', config.onError);
    }
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection metrics
   */
  getMetrics(): WebSocketMetrics {
    return {
      messagesReceived: this.messagesReceived,
      messagesSent: this.messagesSent,
      reconnectAttempts: this.reconnectAttempts,
      state: this.state,
      uptime: this.connectTimestamp > 0 ? Date.now() - this.connectTimestamp : 0,
      activeSubscriptions: 0, // Will be tracked by WebSocketManager
    };
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.state === 'connecting' || this.state === 'connected') {
      return;
    }

    this.shouldReconnect = true;
    await this.createConnection();
  }

  /**
   * Disconnect from WebSocket server
   */
  async disconnect(): Promise<void> {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    this.stopHeartbeat();

    if (this.ws) {
      this.setState('disconnecting');
      this.ws.close();
      this.ws = null;
    }

    this.setState('disconnected');
  }

  /**
   * Send message through WebSocket
   */
  send(data: unknown): void {
    if (!this.isConnected()) {
      throw new Error('WebSocket is not connected');
    }

    const message = typeof data === 'string' ? data : JSON.stringify(data);
    this.ws!.send(message);
    this.messagesSent++;
  }

  /**
   * Create WebSocket connection
   */
  private async createConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.setState('connecting');

        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          this.handleOpen();
          resolve();
        });

        this.ws.on('message', (data: WebSocket.RawData) => {
          this.handleMessage(data);
        });

        this.ws.on('close', () => {
          this.handleClose();
        });

        this.ws.on('error', (error: Error) => {
          this.handleError(error);
          reject(error);
        });

        this.ws.on('pong', () => {
          this.handlePong();
        });
      } catch (error) {
        this.handleError(error instanceof Error ? error : new Error(String(error)));
        reject(error);
      }
    });
  }

  /**
   * Handle connection open
   */
  private handleOpen(): void {
    this.setState('connected');
    this.connectTimestamp = Date.now();

    // Emit reconnected event before resetting counter
    if (this.reconnectAttempts > 0) {
      this.emit('reconnected');
    }

    this.reconnectAttempts = 0;

    this.emit('open');
    this.startHeartbeat();
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: WebSocket.RawData): void {
    try {
      this.messagesReceived++;

      const message = data.toString();

      // Try to parse as JSON, fallback to raw string
      try {
        const parsed = JSON.parse(message);
        this.emit('message', parsed);
      } catch {
        // Not JSON, emit raw string
        this.emit('message', message);
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to handle message: ${error}`));
    }
  }

  /**
   * Handle connection close
   */
  private handleClose(): void {
    this.stopHeartbeat();
    this.emit('close');

    if (this.shouldReconnect && this.reconnectConfig.enabled) {
      this.scheduleReconnect();
    } else {
      this.setState('disconnected');
    }
  }

  /**
   * Handle connection error
   */
  private handleError(error: Error): void {
    this.emit('error', error);
  }

  /**
   * Handle pong response (heartbeat)
   */
  private handlePong(): void {
    // Clear timeout - connection is alive
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;

    if (
      this.reconnectConfig.maxAttempts > 0 &&
      this.reconnectAttempts > this.reconnectConfig.maxAttempts
    ) {
      this.emit('maxRetriesExceeded');
      this.setState('disconnected');
      this.shouldReconnect = false;
      return;
    }

    const delay = this.calculateReconnectDelay();

    this.emit('reconnecting', this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.createConnection().catch((error) => {
        this.emit('error', error instanceof Error ? error : new Error(String(error)));
        // Retry reconnection on failure
        if (this.shouldReconnect && this.reconnectConfig.enabled) {
          this.scheduleReconnect();
        }
      });
    }, delay);
  }

  /**
   * Calculate reconnect delay with exponential backoff and jitter
   */
  private calculateReconnectDelay(): number {
    const { initialDelay, maxDelay, multiplier, jitter } = this.reconnectConfig;

    // Exponential backoff
    const exponentialDelay = Math.min(
      initialDelay * Math.pow(multiplier, this.reconnectAttempts - 1),
      maxDelay
    );

    // Add jitter to prevent thundering herd
    const jitterAmount = exponentialDelay * jitter * (Math.random() - 0.5);

    return Math.max(0, exponentialDelay + jitterAmount);
  }

  /**
   * Start heartbeat/ping mechanism
   */
  private startHeartbeat(): void {
    if (!this.heartbeatConfig.enabled) {
      return;
    }

    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        try {
          // Send ping
          if (this.heartbeatConfig.pingMessage) {
            this.send(this.heartbeatConfig.pingMessage);
          } else {
            // Use WebSocket ping frame
            this.ws!.ping();
          }

          // Set timeout for pong response
          this.heartbeatTimeoutTimer = setTimeout(() => {
            // No pong received - connection is dead
            this.emit('error', new Error('Heartbeat timeout - no pong received'));
            this.ws?.terminate();
          }, this.heartbeatConfig.timeout);
        } catch (error) {
          this.emit('error', new Error(`Heartbeat failed: ${error}`));
        }
      }
    }, this.heartbeatConfig.interval);
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Update connection state
   */
  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.emit('stateChange', newState);
    }
  }
}

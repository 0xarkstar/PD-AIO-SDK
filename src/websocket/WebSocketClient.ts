/**
 * WebSocket Client with Auto-Reconnection
 *
 * Handles connection lifecycle, reconnection logic, and heartbeat.
 * Works in both Node.js and browser environments.
 */

import { EventEmitter } from 'eventemitter3';
import type {
  ConnectionState,
  HeartbeatConfig,
  ReconnectConfig,
  WebSocketConfig,
  WebSocketMetrics,
} from './types.js';

// Browser/Node.js WebSocket detection
const isBrowser = typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined';

// Import Node.js ws types for type safety
import type WsWebSocket from 'ws';

// WebSocket type that works for both environments
type WebSocketLike = WsWebSocket | globalThis.WebSocket;

// Cached WebSocket class (lazy-loaded)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let WS: any = null;

// Helper to load ws module in Node.js (async, using dynamic imports)
// Works in both CommonJS (Jest) and ESM (runtime) contexts
async function loadWsModule(): Promise<unknown> {
  // Check if we're in a CommonJS context where require is globally available

  if (typeof require === 'function') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('ws');
    } catch {
      // Fall through to ESM approach
    }
  }

  // ESM context - dynamically import Node.js modules
  const { createRequire } = await import('module');
  const { pathToFileURL } = await import('url');

  // Use pathToFileURL with __filename fallback or process.cwd()
  // This avoids import.meta.url which breaks in Jest
  const baseUrl =
    typeof __filename !== 'undefined'
      ? pathToFileURL(__filename).href
      : pathToFileURL(process.cwd() + '/index.js').href;
  const esmRequire = createRequire(baseUrl);
  return esmRequire('ws');
}

// Get the appropriate WebSocket class (lazy initialization)
async function getWebSocketClass(): Promise<typeof WebSocket> {
  if (WS) {
    return WS;
  }

  if (isBrowser) {
    WS = window.WebSocket;
  } else {
    WS = await loadWsModule();
  }

  return WS;
}

const DEFAULT_RECONNECT_CONFIG: ReconnectConfig = {
  enabled: true,
  maxAttempts: 10,
  initialDelay: 500,
  maxDelay: 30000,
  multiplier: 2,
  jitter: 0.1,
};

const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
  enabled: true,
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
  private ws: WebSocketLike | null = null;
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
   * Note: WebSocket.OPEN = 1 is a constant across all implementations
   */
  isConnected(): boolean {
    return this.state === 'connected' && this.ws?.readyState === 1;
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
   * Supports both Node.js (ws package) and browser (native WebSocket)
   */
  private async createConnection(): Promise<void> {
    // Get WebSocket class (lazy-loaded for browser compatibility)
    const WebSocketClass = await getWebSocketClass();

    return new Promise((resolve, reject) => {
      try {
        this.setState('connecting');

        this.ws = new WebSocketClass(this.url) as WebSocketLike;

        if (isBrowser) {
          // Browser WebSocket uses addEventListener
          // Use type casting to avoid conflicts between DOM types and ws types
          const browserWs = this.ws as unknown as globalThis.WebSocket;

          browserWs.onopen = () => {
            this.handleOpen();
            resolve();
          };

          browserWs.onmessage = (event) => {
            this.handleMessage(event.data);
          };

          browserWs.onclose = () => {
            this.handleClose();
          };

          browserWs.onerror = () => {
            const error = new Error('WebSocket error');
            this.handleError(error);
            reject(error);
          };

          // Browser WebSocket doesn't have 'pong' event
          // Heartbeat timeout will handle connection health
        } else {
          // Node.js ws package uses .on() method
          const ws = this.ws as WsWebSocket;

          ws.on('open', () => {
            this.handleOpen();
            resolve();
          });

          ws.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
            this.handleMessage(data);
          });

          ws.on('close', () => {
            this.handleClose();
          });

          ws.on('error', (error: Error) => {
            this.handleError(error);
            reject(error);
          });

          ws.on('pong', () => {
            this.handlePong();
          });
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.handleError(err);
        reject(err);
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
   * Supports both Node.js Buffer and browser string/ArrayBuffer
   */
  private handleMessage(data: unknown): void {
    try {
      this.messagesReceived++;

      // Convert data to string based on type
      let message: string;
      if (typeof data === 'string') {
        message = data;
      } else if (data instanceof ArrayBuffer) {
        message = new TextDecoder().decode(data);
      } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
        message = data.toString();
      } else {
        message = String(data);
      }

      // Try to parse as JSON, fallback to raw string
      try {
        const parsed = JSON.parse(message);
        this.emit('message', parsed);
      } catch {
        // Not JSON, emit raw string
        this.emit('message', message);
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to handle message: ${String(error)}`));
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
   * In browsers, we rely on application-level ping messages since
   * the WebSocket API doesn't expose ping/pong frames.
   */
  private startHeartbeat(): void {
    if (!this.heartbeatConfig.enabled) {
      return;
    }

    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        try {
          // Send ping message
          if (this.heartbeatConfig.pingMessage) {
            this.send(this.heartbeatConfig.pingMessage);
          } else if (!isBrowser) {
            // Use WebSocket ping frame (Node.js only)
            this.sendPing();
          }
          // In browser without pingMessage, skip ping (browser handles keep-alive)

          // Set timeout for pong response (only if we sent a ping)
          if (this.heartbeatConfig.pingMessage || !isBrowser) {
            this.heartbeatTimeoutTimer = setTimeout(() => {
              // No pong received - connection is dead
              this.emit('error', new Error('Heartbeat timeout - no pong received'));
              this.terminateConnection();
            }, this.heartbeatConfig.timeout);
          }
        } catch (error) {
          this.emit('error', new Error(`Heartbeat failed: ${String(error)}`));
        }
      }
    }, this.heartbeatConfig.interval);
  }

  /**
   * Send WebSocket ping frame (Node.js only)
   */
  private sendPing(): void {
    if (
      this.ws &&
      'ping' in this.ws &&
      typeof (this.ws as { ping?: () => void }).ping === 'function'
    ) {
      (this.ws as { ping: () => void }).ping();
    }
  }

  /**
   * Forcefully terminate the connection
   * Uses terminate() on Node.js, close() on browsers
   */
  private terminateConnection(): void {
    if (this.ws) {
      if (
        'terminate' in this.ws &&
        typeof (this.ws as { terminate?: () => void }).terminate === 'function'
      ) {
        // Node.js ws package has terminate()
        (this.ws as { terminate: () => void }).terminate();
      } else {
        // Browser WebSocket only has close()
        this.ws.close();
      }
    }
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

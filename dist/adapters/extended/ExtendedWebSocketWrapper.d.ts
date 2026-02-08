/**
 * Extended WebSocket Wrapper
 *
 * WebSocket client for Extended exchange real-time data streaming
 * Implements AsyncGenerator-based streaming for all watch* methods
 */
import type { OrderBook, Trade, Ticker, Position, Order, Balance, FundingRate } from '../../types/common.js';
export interface ExtendedWebSocketConfig {
    wsUrl: string;
    apiKey?: string;
    reconnect?: boolean;
    pingInterval?: number;
    maxReconnectAttempts?: number;
}
/**
 * WebSocket wrapper for Extended exchange
 * Provides AsyncGenerator-based streaming for real-time data
 */
export declare class ExtendedWebSocketWrapper {
    private ws?;
    private readonly wsUrl;
    private readonly apiKey?;
    private readonly normalizer;
    private readonly logger;
    private isConnected;
    private isConnecting;
    private reconnectAttempts;
    private readonly maxReconnectAttempts;
    private readonly reconnect;
    private pingInterval?;
    private readonly pingIntervalMs;
    private pongTimeout?;
    private readonly subscriptions;
    private connectionPromise?;
    constructor(config: ExtendedWebSocketConfig);
    /**
     * Connect to WebSocket
     */
    connect(): Promise<void>;
    /**
     * Disconnect from WebSocket
     */
    disconnect(): void;
    /**
     * Watch order book updates
     */
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    /**
     * Watch trade updates
     */
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    /**
     * Watch ticker updates
     */
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    /**
     * Watch position updates (requires authentication)
     */
    watchPositions(): AsyncGenerator<Position[]>;
    /**
     * Watch order updates (requires authentication)
     */
    watchOrders(): AsyncGenerator<Order[]>;
    /**
     * Watch balance updates (requires authentication)
     */
    watchBalance(): AsyncGenerator<Balance[]>;
    /**
     * Watch funding rate updates
     */
    watchFundingRate(symbol: string): AsyncGenerator<FundingRate>;
    /**
     * Subscribe to a channel
     */
    private subscribe;
    /**
     * Unsubscribe from a channel
     */
    private unsubscribe;
    /**
     * Authenticate the WebSocket connection
     */
    private authenticate;
    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage;
    /**
     * Create an async iterator for messages on a channel
     */
    /** Maximum queue size for backpressure */
    private static readonly MAX_QUEUE_SIZE;
    private createMessageIterator;
    /**
     * Ensure WebSocket is connected
     */
    private ensureConnected;
    /**
     * Send a message through WebSocket
     */
    private send;
    /**
     * Get channel key for subscription tracking
     */
    private getChannelKey;
    /**
     * Start heartbeat ping/pong
     */
    private startHeartbeat;
    /**
     * Stop heartbeat
     */
    private stopHeartbeat;
    /**
     * Handle pong response
     */
    private handlePong;
    /**
     * Schedule reconnection
     */
    private scheduleReconnect;
    /**
     * Resubscribe to all channels after reconnection
     */
    private resubscribeAll;
    /**
     * Check if connected
     */
    get connected(): boolean;
}
//# sourceMappingURL=ExtendedWebSocketWrapper.d.ts.map
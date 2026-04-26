/**
 * Aster WebSocket Handler
 *
 * Manages WebSocket subscriptions and real-time data streaming
 * for the Aster DEX exchange adapter.
 *
 * Aster uses Binance Futures-compatible WebSocket protocol:
 * - Combined streams: wss://fstream.asterdex.com/stream?streams=<s1>/<s2>
 * - Subscribe: {"method":"SUBSCRIBE","params":["btcusdt@aggTrade"],"id":1}
 * - Unsubscribe: {"method":"UNSUBSCRIBE","params":["btcusdt@aggTrade"],"id":1}
 */
import { EventEmitter } from 'events';
import type { OrderBook, Ticker, Trade } from '../../types/index.js';
import type { AsterNormalizer } from './AsterNormalizer.js';
import type { AsterAuth } from './AsterAuth.js';
export interface AsterWebSocketDeps {
    readonly wsUrl: string;
    readonly normalizer: AsterNormalizer;
    readonly auth?: AsterAuth;
    readonly symbolToExchange: (symbol: string) => string;
}
/**
 * WebSocket streaming handler for Aster
 *
 * Uses Binance Futures-compatible combined stream protocol.
 * Provides async generators for real-time market data.
 */
export declare class AsterWebSocket extends EventEmitter {
    private readonly wsUrl;
    private readonly symbolToExchange;
    private client;
    private readonly subscriptions;
    private subscribeIdCounter;
    constructor(deps: AsterWebSocketDeps);
    /**
     * Connect to the Aster combined stream WebSocket endpoint
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
     * Watch order book updates in real-time
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
     * @param limit - Depth levels (default: 20)
     */
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    /**
     * Watch trades in real-time
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
     */
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    /**
     * Watch ticker updates in real-time
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
     */
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    /**
     * Core watch method - subscribes to a channel and yields messages
     *
     * Uses the Binance combined stream protocol for message routing.
     * The combined stream wraps each message with {"stream":"<name>","data":{...}}.
     */
    private watch;
    /**
     * Send a SUBSCRIBE message for a channel
     */
    private sendSubscribe;
    /**
     * Send an UNSUBSCRIBE message for a channel
     */
    private sendUnsubscribe;
    /**
     * Handle incoming WebSocket message
     *
     * Routes messages to the correct subscription handler based on
     * the Binance combined stream format: {"stream":"<name>","data":{...}}
     */
    private handleMessage;
    /**
     * Resolve channel name from event type and symbol
     */
    private resolveChannelFromEvent;
    /**
     * Resubscribe to all active channels after reconnection
     */
    private resubscribeAll;
    /**
     * Normalize a WS depth update to unified OrderBook
     */
    private normalizeDepthUpdate;
    /**
     * Normalize a WS aggTrade to unified Trade
     */
    private normalizeAggTrade;
    /**
     * Normalize a WS 24hrTicker to unified Ticker
     */
    private normalizeWsTicker;
}
//# sourceMappingURL=AsterWebSocket.d.ts.map
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
import { WebSocketClient } from '../../websocket/WebSocketClient.js';
/** Maximum queue size per channel for backpressure */
const MAX_QUEUE_SIZE = 1000;
/** Aster WS channel templates */
const ASTER_WS_CHANNELS = {
    DEPTH: (symbol, levels = 20) => `${symbol}@depth${levels}@100ms`,
    AGG_TRADE: (symbol) => `${symbol}@aggTrade`,
    TICKER: (symbol) => `${symbol}@ticker`,
};
/**
 * WebSocket streaming handler for Aster
 *
 * Uses Binance Futures-compatible combined stream protocol.
 * Provides async generators for real-time market data.
 */
export class AsterWebSocket extends EventEmitter {
    wsUrl;
    symbolToExchange;
    client = null;
    subscriptions = new Map();
    subscribeIdCounter = 1;
    constructor(deps) {
        super();
        this.setMaxListeners(100);
        this.wsUrl = deps.wsUrl;
        this.symbolToExchange = deps.symbolToExchange;
    }
    /**
     * Connect to the Aster combined stream WebSocket endpoint
     */
    async connect() {
        if (this.client) {
            return;
        }
        // Use the combined stream endpoint for multiplexing
        const url = `${this.wsUrl}/stream`;
        this.client = new WebSocketClient({
            url,
            reconnect: {
                enabled: true,
                maxAttempts: 10,
                initialDelay: 500,
                maxDelay: 30000,
                multiplier: 2,
                jitter: 0.1,
            },
            heartbeat: {
                enabled: false, // Aster/Binance handles ping/pong at protocol level
                interval: 30000,
                timeout: 5000,
            },
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
     * Watch order book updates in real-time
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
     * @param limit - Depth levels (default: 20)
     */
    async *watchOrderBook(symbol, limit) {
        const exchangeSymbol = this.symbolToExchange(symbol).toLowerCase();
        const levels = limit ?? 20;
        const channel = ASTER_WS_CHANNELS.DEPTH(exchangeSymbol, levels);
        for await (const data of this.watch(channel)) {
            yield this.normalizeDepthUpdate(data, symbol);
        }
    }
    /**
     * Watch trades in real-time
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
     */
    async *watchTrades(symbol) {
        const exchangeSymbol = this.symbolToExchange(symbol).toLowerCase();
        const channel = ASTER_WS_CHANNELS.AGG_TRADE(exchangeSymbol);
        for await (const data of this.watch(channel)) {
            yield this.normalizeAggTrade(data, symbol);
        }
    }
    /**
     * Watch ticker updates in real-time
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
     */
    async *watchTicker(symbol) {
        const exchangeSymbol = this.symbolToExchange(symbol).toLowerCase();
        const channel = ASTER_WS_CHANNELS.TICKER(exchangeSymbol);
        for await (const data of this.watch(channel)) {
            yield this.normalizeWsTicker(data, symbol);
        }
    }
    // ===========================================================================
    // Internal subscription management
    // ===========================================================================
    /**
     * Core watch method - subscribes to a channel and yields messages
     *
     * Uses the Binance combined stream protocol for message routing.
     * The combined stream wraps each message with {"stream":"<name>","data":{...}}.
     */
    async *watch(channel) {
        const messageQueue = [];
        let resolveNext = null;
        const subscription = {
            channel,
            handler: (data) => {
                const typedData = data;
                if (resolveNext) {
                    resolveNext(typedData);
                    resolveNext = null;
                }
                else {
                    if (messageQueue.length >= MAX_QUEUE_SIZE) {
                        messageQueue.shift();
                    }
                    messageQueue.push(typedData);
                }
            },
            active: true,
        };
        this.subscriptions.set(channel, subscription);
        // Send subscribe message
        this.sendSubscribe(channel);
        try {
            while (true) {
                if (messageQueue.length > 0) {
                    yield messageQueue.shift();
                }
                else {
                    yield await new Promise((resolve) => {
                        resolveNext = resolve;
                    });
                }
            }
        }
        finally {
            // Cleanup on generator exit
            subscription.active = false;
            this.subscriptions.delete(channel);
            this.sendUnsubscribe(channel);
        }
    }
    /**
     * Send a SUBSCRIBE message for a channel
     */
    sendSubscribe(channel) {
        if (!this.client?.isConnected()) {
            return;
        }
        const id = this.subscribeIdCounter++;
        this.client.send({
            method: 'SUBSCRIBE',
            params: [channel],
            id,
        });
    }
    /**
     * Send an UNSUBSCRIBE message for a channel
     */
    sendUnsubscribe(channel) {
        if (!this.client?.isConnected()) {
            return;
        }
        const id = this.subscribeIdCounter++;
        this.client.send({
            method: 'UNSUBSCRIBE',
            params: [channel],
            id,
        });
    }
    /**
     * Handle incoming WebSocket message
     *
     * Routes messages to the correct subscription handler based on
     * the Binance combined stream format: {"stream":"<name>","data":{...}}
     */
    handleMessage(data) {
        try {
            const parsed = data;
            // Binance combined stream format
            if (parsed.stream && parsed.data) {
                const msg = parsed;
                const subscription = this.subscriptions.get(msg.stream);
                if (subscription?.active) {
                    subscription.handler(msg.data);
                }
                return;
            }
            // Single stream format (no stream wrapper) - route by event type + symbol
            const eventType = parsed.e;
            const symbolField = parsed.s;
            if (eventType && symbolField) {
                const channelFromEvent = this.resolveChannelFromEvent(eventType, symbolField.toLowerCase());
                if (channelFromEvent) {
                    const subscription = this.subscriptions.get(channelFromEvent);
                    if (subscription?.active) {
                        subscription.handler(parsed);
                    }
                }
            }
        }
        catch (error) {
            this.emit('error', new Error(`Failed to handle message: ${String(error)}`));
        }
    }
    /**
     * Resolve channel name from event type and symbol
     */
    resolveChannelFromEvent(eventType, symbol) {
        switch (eventType) {
            case 'depthUpdate': {
                // Find matching depth channel for this symbol
                for (const channel of this.subscriptions.keys()) {
                    if (channel.startsWith(`${symbol}@depth`)) {
                        return channel;
                    }
                }
                return undefined;
            }
            case 'aggTrade':
                return `${symbol}@aggTrade`;
            case '24hrTicker':
                return `${symbol}@ticker`;
            default:
                return undefined;
        }
    }
    /**
     * Resubscribe to all active channels after reconnection
     */
    async resubscribeAll() {
        const channels = Array.from(this.subscriptions.keys());
        if (channels.length === 0) {
            return;
        }
        // Batch subscribe to all channels at once
        const id = this.subscribeIdCounter++;
        if (this.client?.isConnected()) {
            this.client.send({
                method: 'SUBSCRIBE',
                params: channels,
                id,
            });
        }
    }
    // ===========================================================================
    // Normalization helpers
    // ===========================================================================
    /**
     * Normalize a WS depth update to unified OrderBook
     */
    normalizeDepthUpdate(data, symbol) {
        return {
            symbol,
            timestamp: data.T ?? Date.now(),
            bids: data.b.map(([p, s]) => [parseFloat(p), parseFloat(s)]),
            asks: data.a.map(([p, s]) => [parseFloat(p), parseFloat(s)]),
            exchange: 'aster',
        };
    }
    /**
     * Normalize a WS aggTrade to unified Trade
     */
    normalizeAggTrade(data, symbol) {
        const price = parseFloat(data.p);
        const amount = parseFloat(data.q);
        return {
            id: String(data.a),
            symbol,
            side: data.m ? 'sell' : 'buy',
            price,
            amount,
            cost: price * amount,
            timestamp: data.T,
            info: data,
        };
    }
    /**
     * Normalize a WS 24hrTicker to unified Ticker
     */
    normalizeWsTicker(data, symbol) {
        const last = parseFloat(data.c);
        return {
            symbol,
            last,
            bid: last,
            ask: last,
            high: parseFloat(data.h),
            low: parseFloat(data.l),
            open: parseFloat(data.o),
            close: last,
            change: parseFloat(data.p),
            percentage: parseFloat(data.P),
            baseVolume: parseFloat(data.v),
            quoteVolume: parseFloat(data.q),
            timestamp: data.E,
            info: {
                ...data,
                _bidAskSource: 'last_price',
            },
        };
    }
}
//# sourceMappingURL=AsterWebSocket.js.map
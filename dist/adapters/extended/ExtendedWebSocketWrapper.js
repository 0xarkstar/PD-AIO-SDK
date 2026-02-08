/**
 * Extended WebSocket Wrapper
 *
 * WebSocket client for Extended exchange real-time data streaming
 * Implements AsyncGenerator-based streaming for all watch* methods
 */
import { ExtendedNormalizer } from './ExtendedNormalizer.js';
import { EXTENDED_WS_CONFIG, EXTENDED_WS_CHANNELS } from './constants.js';
import { Logger } from '../../core/logger.js';
/**
 * WebSocket wrapper for Extended exchange
 * Provides AsyncGenerator-based streaming for real-time data
 */
export class ExtendedWebSocketWrapper {
    ws;
    wsUrl;
    apiKey;
    normalizer;
    logger;
    isConnected = false;
    isConnecting = false;
    reconnectAttempts = 0;
    maxReconnectAttempts;
    reconnect;
    pingInterval;
    pingIntervalMs;
    pongTimeout;
    subscriptions = new Map();
    connectionPromise;
    constructor(config) {
        this.wsUrl = config.wsUrl;
        this.apiKey = config.apiKey;
        this.normalizer = new ExtendedNormalizer();
        this.logger = new Logger('ExtendedWebSocketWrapper');
        this.reconnect = config.reconnect ?? true;
        this.pingIntervalMs = config.pingInterval ?? EXTENDED_WS_CONFIG.pingInterval;
        this.maxReconnectAttempts = config.maxReconnectAttempts ?? EXTENDED_WS_CONFIG.reconnectAttempts;
    }
    /**
     * Connect to WebSocket
     */
    async connect() {
        if (this.isConnected) {
            return;
        }
        if (this.isConnecting && this.connectionPromise) {
            return this.connectionPromise;
        }
        this.isConnecting = true;
        this.connectionPromise = new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.wsUrl);
                this.ws.onopen = () => {
                    this.isConnected = true;
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.logger.info('WebSocket connected');
                    this.startHeartbeat();
                    // Authenticate if API key provided
                    if (this.apiKey) {
                        this.authenticate();
                    }
                    // Resubscribe to existing channels
                    this.resubscribeAll();
                    resolve();
                };
                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };
                this.ws.onerror = (error) => {
                    this.logger.error('WebSocket error', error instanceof Error ? error : new Error('WebSocket error'));
                    if (this.isConnecting) {
                        this.isConnecting = false;
                        reject(new Error('WebSocket connection failed'));
                    }
                };
                this.ws.onclose = (event) => {
                    this.isConnected = false;
                    this.isConnecting = false;
                    this.stopHeartbeat();
                    this.logger.info('WebSocket closed', { code: event.code, reason: event.reason });
                    if (this.reconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect();
                    }
                };
            }
            catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
        return this.connectionPromise;
    }
    /**
     * Disconnect from WebSocket
     */
    disconnect() {
        this.reconnect && (this.reconnectAttempts = this.maxReconnectAttempts); // Prevent reconnection
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = undefined;
        }
        this.isConnected = false;
        this.isConnecting = false;
        this.subscriptions.clear();
        this.logger.info('WebSocket disconnected');
    }
    /**
     * Watch order book updates
     */
    async *watchOrderBook(symbol, limit) {
        const channel = this.getChannelKey(EXTENDED_WS_CHANNELS.ORDERBOOK, symbol);
        const exchangeSymbol = this.normalizer.symbolFromCCXT(symbol);
        await this.subscribe(EXTENDED_WS_CHANNELS.ORDERBOOK, exchangeSymbol);
        try {
            for await (const message of this.createMessageIterator(channel)) {
                if (message.channel === 'orderbook' && message.symbol === exchangeSymbol) {
                    const orderbook = {
                        exchange: 'extended',
                        symbol: this.normalizer.symbolToCCXT(message.symbol),
                        bids: message.bids.slice(0, limit).map(([price, amount]) => [
                            parseFloat(price),
                            parseFloat(amount),
                        ]),
                        asks: message.asks.slice(0, limit).map(([price, amount]) => [
                            parseFloat(price),
                            parseFloat(amount),
                        ]),
                        timestamp: message.timestamp,
                        sequenceId: message.sequence,
                        checksum: message.checksum,
                    };
                    yield orderbook;
                }
            }
        }
        finally {
            await this.unsubscribe(EXTENDED_WS_CHANNELS.ORDERBOOK, exchangeSymbol);
        }
    }
    /**
     * Watch trade updates
     */
    async *watchTrades(symbol) {
        const channel = this.getChannelKey(EXTENDED_WS_CHANNELS.TRADES, symbol);
        const exchangeSymbol = this.normalizer.symbolFromCCXT(symbol);
        await this.subscribe(EXTENDED_WS_CHANNELS.TRADES, exchangeSymbol);
        try {
            for await (const message of this.createMessageIterator(channel)) {
                if (message.channel === 'trades' && message.symbol === exchangeSymbol) {
                    const price = parseFloat(message.price);
                    const amount = parseFloat(message.quantity);
                    const trade = {
                        id: message.id,
                        symbol: this.normalizer.symbolToCCXT(message.symbol),
                        side: message.side,
                        price,
                        amount,
                        cost: price * amount,
                        timestamp: message.timestamp,
                    };
                    yield trade;
                }
            }
        }
        finally {
            await this.unsubscribe(EXTENDED_WS_CHANNELS.TRADES, exchangeSymbol);
        }
    }
    /**
     * Watch ticker updates
     */
    async *watchTicker(symbol) {
        const channel = this.getChannelKey(EXTENDED_WS_CHANNELS.TICKER, symbol);
        const exchangeSymbol = this.normalizer.symbolFromCCXT(symbol);
        await this.subscribe(EXTENDED_WS_CHANNELS.TICKER, exchangeSymbol);
        try {
            for await (const message of this.createMessageIterator(channel)) {
                if (message.channel === 'ticker' && message.symbol === exchangeSymbol) {
                    const lastPrice = parseFloat(message.lastPrice);
                    const ticker = {
                        symbol: this.normalizer.symbolToCCXT(message.symbol),
                        timestamp: message.timestamp,
                        high: parseFloat(message.high24h),
                        low: parseFloat(message.low24h),
                        bid: parseFloat(message.bidPrice),
                        ask: parseFloat(message.askPrice),
                        last: lastPrice,
                        open: lastPrice, // WebSocket may not provide open price
                        close: lastPrice,
                        baseVolume: parseFloat(message.volume24h),
                        quoteVolume: parseFloat(message.quoteVolume24h),
                        change: parseFloat(message.priceChange24h),
                        percentage: parseFloat(message.priceChangePercent24h),
                    };
                    yield ticker;
                }
            }
        }
        finally {
            await this.unsubscribe(EXTENDED_WS_CHANNELS.TICKER, exchangeSymbol);
        }
    }
    /**
     * Watch position updates (requires authentication)
     */
    async *watchPositions() {
        if (!this.apiKey) {
            throw new Error('API key required for watching positions');
        }
        const channel = EXTENDED_WS_CHANNELS.POSITIONS;
        await this.subscribe(channel);
        try {
            for await (const message of this.createMessageIterator(channel)) {
                if (message.channel === 'positions') {
                    const positions = message.positions.map((pos) => this.normalizer.normalizePosition(pos));
                    yield positions;
                }
            }
        }
        finally {
            await this.unsubscribe(channel);
        }
    }
    /**
     * Watch order updates (requires authentication)
     */
    async *watchOrders() {
        if (!this.apiKey) {
            throw new Error('API key required for watching orders');
        }
        const channel = EXTENDED_WS_CHANNELS.ORDERS;
        await this.subscribe(channel);
        try {
            for await (const message of this.createMessageIterator(channel)) {
                if (message.channel === 'orders') {
                    const orders = message.orders.map((ord) => this.normalizer.normalizeOrder(ord));
                    yield orders;
                }
            }
        }
        finally {
            await this.unsubscribe(channel);
        }
    }
    /**
     * Watch balance updates (requires authentication)
     */
    async *watchBalance() {
        if (!this.apiKey) {
            throw new Error('API key required for watching balance');
        }
        const channel = EXTENDED_WS_CHANNELS.BALANCE;
        await this.subscribe(channel);
        try {
            for await (const message of this.createMessageIterator(channel)) {
                if (message.channel === 'balance') {
                    const balances = message.balances.map((bal) => this.normalizer.normalizeBalance(bal));
                    yield balances;
                }
            }
        }
        finally {
            await this.unsubscribe(channel);
        }
    }
    /**
     * Watch funding rate updates
     */
    async *watchFundingRate(symbol) {
        const channel = this.getChannelKey(EXTENDED_WS_CHANNELS.FUNDING, symbol);
        const exchangeSymbol = this.normalizer.symbolFromCCXT(symbol);
        await this.subscribe(EXTENDED_WS_CHANNELS.FUNDING, exchangeSymbol);
        try {
            for await (const message of this.createMessageIterator(channel)) {
                if (message.channel === 'funding' && message.symbol === exchangeSymbol) {
                    const fundingRate = {
                        symbol: this.normalizer.symbolToCCXT(message.symbol),
                        fundingRate: parseFloat(message.fundingRate),
                        fundingTimestamp: message.fundingTime,
                        nextFundingTimestamp: message.nextFundingTime || 0,
                        markPrice: parseFloat(message.markPrice),
                        indexPrice: parseFloat(message.indexPrice),
                        fundingIntervalHours: 8,
                    };
                    yield fundingRate;
                }
            }
        }
        finally {
            await this.unsubscribe(EXTENDED_WS_CHANNELS.FUNDING, exchangeSymbol);
        }
    }
    // ==================== Private Methods ====================
    /**
     * Subscribe to a channel
     */
    async subscribe(channel, symbol) {
        await this.ensureConnected();
        const channelKey = this.getChannelKey(channel, symbol);
        if (!this.subscriptions.has(channelKey)) {
            this.subscriptions.set(channelKey, new Set());
        }
        const message = {
            action: 'subscribe',
            channel,
            symbol,
        };
        this.send(message);
        this.logger.debug('Subscribed to channel', { channel, symbol });
    }
    /**
     * Unsubscribe from a channel
     */
    async unsubscribe(channel, symbol) {
        const channelKey = this.getChannelKey(channel, symbol);
        if (this.subscriptions.has(channelKey)) {
            this.subscriptions.delete(channelKey);
            if (this.isConnected) {
                const message = {
                    action: 'unsubscribe',
                    channel,
                    symbol,
                };
                this.send(message);
            }
            this.logger.debug('Unsubscribed from channel', { channel, symbol });
        }
    }
    /**
     * Authenticate the WebSocket connection
     */
    authenticate() {
        if (!this.apiKey)
            return;
        const authMessage = {
            action: 'auth',
            apiKey: this.apiKey,
            timestamp: Date.now(),
        };
        this.send(authMessage);
        this.logger.debug('Sent authentication message');
    }
    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            // Handle pong response
            if (message.type === 'pong' || message.event === 'pong') {
                this.handlePong();
                return;
            }
            // Handle subscription confirmations
            if (message.event === 'subscribed' || message.event === 'unsubscribed') {
                this.logger.debug('Subscription event', { event: message.event, channel: message.channel });
                return;
            }
            // Handle authentication response
            if (message.event === 'authenticated') {
                this.logger.info('WebSocket authenticated');
                return;
            }
            // Handle error messages
            if (message.error || message.event === 'error') {
                this.logger.error('WebSocket error message', new Error(message.error || message.message));
                return;
            }
            // Dispatch to subscribers
            const channel = message.channel;
            const symbol = message.symbol;
            const channelKey = this.getChannelKey(channel, symbol);
            const handlers = this.subscriptions.get(channelKey);
            if (handlers) {
                handlers.forEach((handler) => handler(message));
            }
        }
        catch (error) {
            this.logger.error('Failed to parse WebSocket message', error instanceof Error ? error : new Error(String(error)));
        }
    }
    /**
     * Create an async iterator for messages on a channel
     */
    /** Maximum queue size for backpressure */
    static MAX_QUEUE_SIZE = 1000;
    async *createMessageIterator(channelKey) {
        const messageQueue = [];
        let resolver = null;
        let isActive = true;
        const handler = (message) => {
            if (resolver) {
                resolver(message);
                resolver = null;
            }
            else {
                // Apply backpressure: drop oldest message if queue is full
                if (messageQueue.length >= ExtendedWebSocketWrapper.MAX_QUEUE_SIZE) {
                    messageQueue.shift();
                    this.logger.warn(`Queue overflow on channel ${channelKey}, dropping oldest message`);
                }
                messageQueue.push(message);
            }
        };
        // Register handler
        const handlers = this.subscriptions.get(channelKey);
        if (handlers) {
            handlers.add(handler);
        }
        try {
            while (isActive && this.subscriptions.has(channelKey)) {
                if (messageQueue.length > 0) {
                    yield messageQueue.shift();
                }
                else {
                    yield await new Promise((resolve) => {
                        resolver = resolve;
                    });
                }
            }
        }
        finally {
            isActive = false;
            if (handlers) {
                handlers.delete(handler);
            }
        }
    }
    /**
     * Ensure WebSocket is connected
     */
    async ensureConnected() {
        if (!this.isConnected) {
            await this.connect();
        }
    }
    /**
     * Send a message through WebSocket
     */
    send(message) {
        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify(message));
        }
    }
    /**
     * Get channel key for subscription tracking
     */
    getChannelKey(channel, symbol) {
        return symbol ? `${channel}:${symbol}` : channel;
    }
    /**
     * Start heartbeat ping/pong
     */
    startHeartbeat() {
        this.stopHeartbeat();
        this.pingInterval = setInterval(() => {
            if (this.isConnected) {
                this.send({ type: 'ping', timestamp: Date.now() });
                // Set pong timeout
                this.pongTimeout = setTimeout(() => {
                    this.logger.warn('Pong timeout, reconnecting...');
                    this.ws?.close(4000, 'Pong timeout');
                }, EXTENDED_WS_CONFIG.pongTimeout);
            }
        }, this.pingIntervalMs);
    }
    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = undefined;
        }
        if (this.pongTimeout) {
            clearTimeout(this.pongTimeout);
            this.pongTimeout = undefined;
        }
    }
    /**
     * Handle pong response
     */
    handlePong() {
        if (this.pongTimeout) {
            clearTimeout(this.pongTimeout);
            this.pongTimeout = undefined;
        }
    }
    /**
     * Schedule reconnection
     */
    scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = Math.min(EXTENDED_WS_CONFIG.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), EXTENDED_WS_CONFIG.maxReconnectDelay);
        this.logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => {
            this.connect().catch((error) => {
                this.logger.error('Reconnection failed', error instanceof Error ? error : new Error(String(error)));
            });
        }, delay);
    }
    /**
     * Resubscribe to all channels after reconnection
     */
    resubscribeAll() {
        for (const channelKey of this.subscriptions.keys()) {
            const parts = channelKey.split(':');
            const channel = parts[0] ?? '';
            const symbol = parts[1];
            if (channel) {
                const message = {
                    action: 'subscribe',
                    channel,
                    symbol: symbol || undefined,
                };
                this.send(message);
            }
        }
    }
    /**
     * Check if connected
     */
    get connected() {
        return this.isConnected;
    }
}
//# sourceMappingURL=ExtendedWebSocketWrapper.js.map
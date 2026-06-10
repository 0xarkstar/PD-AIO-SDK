/**
 * GRVT WebSocket wrapper (JSON-RPC).
 *
 * GRVT's WS is JSON-RPC over the `/ws` base path on the trades + market-data
 * hosts. Subscriptions are sent as:
 *   {"jsonrpc":"2.0","method":"subscribe",
 *    "params":{"stream":"v1.book.s","selectors":["BTC_USDT_Perp@500-50"]},"id":1}
 *
 * Public streams (market-data host): v1.{book.s,book.d,trade,ticker.s,mini.s}.
 * Private trade-data streams (trades host): v1.{order,fill,position} — these need
 * the `gravity` cookie + `X-Grvt-Account-Id` on connect (carried in the session).
 *
 * Feed frames carry `{ stream, feed, selector }`; the `feed` payload shape
 * matches REST exactly, so it is normalized via the same `GRVTNormalizer`.
 * Built on the SDK's typed `WebSocketClient` (auto-reconnect, Node/browser).
 */
import { WebSocketClient } from '../../websocket/WebSocketClient.js';
import { GRVTNormalizer } from './GRVTNormalizer.js';
import { GRVT_API_URLS, GRVT_WS_STREAMS, GRVT_BOOK_DEPTHS } from './constants.js';
import { Logger } from '../../core/logger.js';
const DEFAULT_BOOK_DEPTH = 50;
const DEFAULT_TRADE_LIMIT = 50;
/**
 * AsyncGenerator-based GRVT WebSocket streaming wrapper.
 */
export class GRVTWebSocketWrapper {
    static MAX_QUEUE_SIZE = 1000;
    normalizer = new GRVTNormalizer();
    logger = new Logger('GRVTWebSocket');
    publicClient;
    tradeClient;
    session;
    nextId = 1;
    constructor(config = {}) {
        const urls = config.testnet ? GRVT_API_URLS.testnet : GRVT_API_URLS.mainnet;
        this.session = config.session;
        this.publicClient = new WebSocketClient({
            url: urls.websocketMarketData,
            onError: (error) => this.logger.error('Public WS error', error),
        });
        this.tradeClient = new WebSocketClient({
            url: urls.websocketTrades,
            onError: (error) => this.logger.error('Trade WS error', error),
        });
    }
    /**
     * Connect the public market-data WebSocket.
     */
    async connect() {
        await this.publicClient.connect();
    }
    /**
     * Connect the private trade-data WebSocket (requires a session).
     */
    async connectPrivate() {
        if (!this.session) {
            throw new Error('Session required for private GRVT WebSocket streams');
        }
        await this.tradeClient.connect();
    }
    /**
     * Disconnect both WebSockets.
     */
    disconnect() {
        void this.publicClient.disconnect();
        void this.tradeClient.disconnect();
    }
    /**
     * Whether the public WebSocket is connected.
     */
    get connected() {
        return this.publicClient.isConnected();
    }
    // ==================== Public streams ====================
    /**
     * Watch FULL order-book snapshots for a symbol (`v1.book.s`).
     */
    async *watchOrderBook(symbol, depth = DEFAULT_BOOK_DEPTH) {
        const instrument = this.normalizer.symbolFromCCXT(symbol);
        const validDepth = GRVT_BOOK_DEPTHS.includes(depth) ? depth : DEFAULT_BOOK_DEPTH;
        const selector = `${instrument}@500-${validDepth}`;
        yield* this.stream(this.publicClient, GRVT_WS_STREAMS.bookSnapshot, [selector], instrument, (feed) => this.normalizer.normalizeOrderBook(feed));
    }
    /**
     * Watch public trades for a symbol (`v1.trade`).
     */
    async *watchTrades(symbol) {
        const instrument = this.normalizer.symbolFromCCXT(symbol);
        const selector = `${instrument}@${DEFAULT_TRADE_LIMIT}`;
        yield* this.stream(this.publicClient, GRVT_WS_STREAMS.trade, [selector], instrument, (feed) => this.normalizer.normalizeTrade(feed));
    }
    /**
     * Watch ticker snapshots for a symbol (`v1.ticker.s`).
     */
    async *watchTicker(symbol) {
        const instrument = this.normalizer.symbolFromCCXT(symbol);
        const selector = `${instrument}@500`;
        yield* this.stream(this.publicClient, GRVT_WS_STREAMS.tickerSnapshot, [selector], instrument, (feed) => this.normalizer.normalizeTicker(feed));
    }
    // ==================== Private streams ====================
    /**
     * Watch position updates (`v1.position`; requires a session).
     */
    async *watchPositions(symbol) {
        this.requireSession();
        await this.connectPrivate();
        const instrument = symbol ? this.normalizer.symbolFromCCXT(symbol) : undefined;
        const selector = this.privateSelector(instrument);
        yield* this.stream(this.tradeClient, GRVT_WS_STREAMS.position, [selector], instrument, (feed) => this.normalizer.normalizePosition(feed));
    }
    /**
     * Watch order updates (`v1.order`; requires a session).
     */
    async *watchOrders(symbol) {
        this.requireSession();
        await this.connectPrivate();
        const instrument = symbol ? this.normalizer.symbolFromCCXT(symbol) : undefined;
        const selector = this.privateSelector(instrument);
        yield* this.stream(this.tradeClient, GRVT_WS_STREAMS.order, [selector], instrument, (feed) => this.normalizer.normalizeOrder(feed));
    }
    /**
     * Watch user fills (`v1.fill`; requires a session).
     */
    async *watchMyTrades(symbol) {
        this.requireSession();
        await this.connectPrivate();
        const instrument = symbol ? this.normalizer.symbolFromCCXT(symbol) : undefined;
        const selector = this.privateSelector(instrument);
        yield* this.stream(this.tradeClient, GRVT_WS_STREAMS.fill, [selector], instrument, (feed) => this.normalizer.normalizeFill(feed));
    }
    /**
     * Watch balance updates (derived from the position stream; requires a session).
     */
    async *watchBalance() {
        for await (const position of this.watchPositions()) {
            const balance = {
                currency: 'USDT',
                free: position.margin || 0,
                used: 0,
                total: position.margin || 0,
                info: position.info,
            };
            yield [balance];
        }
    }
    // ==================== Internals ====================
    /**
     * Subscribe to one stream and yield normalized values until the generator is
     * closed. Frames for other streams/instruments are ignored; un-normalizable
     * frames are skipped (defensive).
     */
    async *stream(client, streamName, selectors, instrument, normalize) {
        const queue = [];
        let error = null;
        let resolver = null;
        const onMessage = (raw) => {
            const frame = this.parseFrame(raw);
            if (!frame || frame.stream !== streamName || !frame.feed) {
                return;
            }
            if (instrument && typeof frame.feed.instrument === 'string' && frame.feed.instrument !== instrument) {
                return;
            }
            let value;
            try {
                value = normalize(frame.feed);
            }
            catch {
                return;
            }
            if (resolver) {
                resolver(value);
                resolver = null;
            }
            else {
                this.boundedPush(queue, value, streamName);
            }
        };
        const onError = (err) => {
            error = err;
        };
        client.on('message', onMessage);
        client.on('error', onError);
        try {
            if (!client.isConnected()) {
                await client.connect();
            }
            client.send(this.subscribeFrame(streamName, selectors));
            while (true) {
                if (error) {
                    throw error;
                }
                let value;
                if (queue.length > 0) {
                    value = queue.shift();
                }
                else {
                    value = await new Promise((resolve) => {
                        resolver = resolve;
                    });
                }
                if (error) {
                    throw error;
                }
                yield value;
            }
        }
        finally {
            client.off('message', onMessage);
            client.off('error', onError);
        }
    }
    /**
     * Build a JSON-RPC subscribe frame.
     */
    subscribeFrame(stream, selectors) {
        return JSON.stringify({
            jsonrpc: '2.0',
            method: 'subscribe',
            params: { stream, selectors },
            id: this.nextId++,
        });
    }
    /**
     * Parse a WS frame into `{ stream, feed }`, returning null on non-object input.
     */
    parseFrame(raw) {
        let obj = raw;
        if (typeof raw === 'string') {
            try {
                obj = JSON.parse(raw);
            }
            catch {
                return null;
            }
        }
        if (!obj || typeof obj !== 'object') {
            return null;
        }
        return obj;
    }
    /**
     * The private selector: the sub-account id, optionally scoped to an instrument.
     */
    privateSelector(instrument) {
        const subAccountId = this.session?.subAccountId ?? '';
        return instrument ? `${subAccountId}@${instrument}` : subAccountId;
    }
    /**
     * Push with a bounded queue (drop oldest under backpressure).
     */
    boundedPush(queue, item, channel) {
        if (queue.length >= GRVTWebSocketWrapper.MAX_QUEUE_SIZE) {
            queue.shift();
            this.logger.warn(`Queue overflow on ${channel}, dropping oldest message`);
        }
        queue.push(item);
    }
    /**
     * @throws {Error} if no session is configured for a private stream.
     */
    requireSession() {
        if (!this.session) {
            throw new Error('Session required for private GRVT WebSocket streams');
        }
    }
}
//# sourceMappingURL=GRVTWebSocketWrapper.js.map
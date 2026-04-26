/**
 * Hyperliquid WebSocket Handler
 *
 * Manages WebSocket subscriptions and real-time data streaming
 * for the Hyperliquid exchange adapter.
 */
import { EventEmitter } from 'events';
import { HYPERLIQUID_WS_CHANNELS } from './constants.js';
import { AuthenticationError } from '../../types/errors.js';
/**
 * WebSocket streaming handler for Hyperliquid
 *
 * Provides async generators for real-time market data and user events.
 * Extracted from HyperliquidAdapter to improve code organization.
 */
export class HyperliquidWebSocket extends EventEmitter {
    wsManager;
    normalizer;
    auth;
    symbolToExchange;
    fetchOpenOrders;
    reconnectAttempts = 0;
    maxReconnectAttempts;
    intentionalDisconnect = false;
    constructor(deps) {
        super();
        this.wsManager = deps.wsManager;
        this.normalizer = deps.normalizer;
        this.auth = deps.auth;
        this.symbolToExchange = deps.symbolToExchange;
        this.fetchOpenOrders = deps.fetchOpenOrders;
        this.maxReconnectAttempts = deps.maxReconnectAttempts ?? 10;
        this.setupReconnectHandling();
    }
    /**
     * Disconnect and prevent further reconnection attempts
     */
    disconnect() {
        this.intentionalDisconnect = true;
    }
    /**
     * Wire reconnect tracking to wsManager events.
     * wsManager extends EventEmitter in production; guards handle test mocks.
     */
    setupReconnectHandling() {
        if (typeof this.wsManager.on !== 'function') {
            return;
        }
        this.wsManager.on('reconnected', () => {
            this.reconnectAttempts = 0;
        });
        this.wsManager.on('error', (error) => {
            if (this.intentionalDisconnect) {
                return;
            }
            this.reconnectAttempts++;
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.emit('websocket.reconnect_failed', new Error(`Hyperliquid WebSocket reconnect failed after ${this.maxReconnectAttempts} attempts: ${error.message}`));
            }
        });
    }
    /**
     * Watch order book updates in real-time
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
     * @param _limit - Optional depth limit (not used by Hyperliquid)
     */
    async *watchOrderBook(symbol, _limit) {
        const exchangeSymbol = this.symbolToExchange(symbol);
        const subscription = {
            method: 'subscribe',
            subscription: {
                type: HYPERLIQUID_WS_CHANNELS.L2_BOOK,
                coin: exchangeSymbol,
            },
        };
        const unsubscribe = {
            method: 'unsubscribe',
            subscription: {
                type: HYPERLIQUID_WS_CHANNELS.L2_BOOK,
                coin: exchangeSymbol,
            },
        };
        for await (const data of this.wsManager.watch(`${HYPERLIQUID_WS_CHANNELS.L2_BOOK}:${exchangeSymbol}`, subscription, unsubscribe)) {
            yield this.normalizer.normalizeOrderBook(data);
        }
    }
    /**
     * Watch trades in real-time
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
     */
    async *watchTrades(symbol) {
        const exchangeSymbol = this.symbolToExchange(symbol);
        const subscription = {
            method: 'subscribe',
            subscription: {
                type: HYPERLIQUID_WS_CHANNELS.TRADES,
                coin: exchangeSymbol,
            },
        };
        for await (const data of this.wsManager.watch(`${HYPERLIQUID_WS_CHANNELS.TRADES}:${exchangeSymbol}`, subscription)) {
            yield this.normalizer.normalizeTrade(data);
        }
    }
    /**
     * Watch ticker updates in real-time
     *
     * Subscribes to allMids channel and filters for the requested symbol.
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
     */
    async *watchTicker(symbol) {
        const subscription = {
            method: 'subscribe',
            subscription: {
                type: HYPERLIQUID_WS_CHANNELS.ALL_MIDS,
            },
        };
        const exchangeSymbol = this.symbolToExchange(symbol);
        for await (const data of this.wsManager.watch(HYPERLIQUID_WS_CHANNELS.ALL_MIDS, subscription)) {
            const mid = data.mids?.[exchangeSymbol];
            if (mid) {
                yield this.normalizer.normalizeTicker(exchangeSymbol, { mid });
            }
        }
    }
    /**
     * Watch position updates in real-time
     *
     * Requires authentication.
     */
    async *watchPositions() {
        if (!this.auth) {
            throw new AuthenticationError('Authentication required for position streaming', 'MISSING_CREDENTIALS', 'hyperliquid');
        }
        const subscription = {
            method: 'subscribe',
            subscription: {
                type: HYPERLIQUID_WS_CHANNELS.USER,
                user: this.auth.getAddress(),
            },
        };
        for await (const data of this.wsManager.watch(`${HYPERLIQUID_WS_CHANNELS.USER}:${this.auth.getAddress()}`, subscription)) {
            const positions = data.assetPositions
                .filter((p) => parseFloat(p.position.szi) !== 0)
                .map((p) => this.normalizer.normalizePosition(p));
            yield positions;
        }
    }
    /**
     * Watch open orders in real-time
     *
     * Subscribes to user fills and yields updated order list when fills occur.
     * Requires authentication.
     */
    async *watchOrders() {
        if (!this.auth) {
            throw new AuthenticationError('Authentication required for order streaming', 'MISSING_CREDENTIALS', 'hyperliquid');
        }
        const subscription = {
            method: 'subscribe',
            subscription: {
                type: HYPERLIQUID_WS_CHANNELS.USER_FILLS,
                user: this.auth.getAddress(),
            },
        };
        // Yield initial orders
        yield await this.fetchOpenOrders();
        // Watch for fill events and fetch updated orders
        for await (const _unused of this.wsManager.watch(`${HYPERLIQUID_WS_CHANNELS.USER_FILLS}:${this.auth.getAddress()}`, subscription)) {
            const orders = await this.fetchOpenOrders();
            yield orders;
        }
    }
    /**
     * Watch user trades (fills) in real-time
     *
     * Requires authentication.
     *
     * @param symbol - Optional symbol to filter trades
     */
    async *watchMyTrades(symbol) {
        if (!this.auth) {
            throw new AuthenticationError('Authentication required for trade streaming', 'MISSING_CREDENTIALS', 'hyperliquid');
        }
        const subscription = {
            method: 'subscribe',
            subscription: {
                type: HYPERLIQUID_WS_CHANNELS.USER_FILLS,
                user: this.auth.getAddress(),
            },
        };
        const exchangeSymbol = symbol ? this.symbolToExchange(symbol) : undefined;
        for await (const fill of this.wsManager.watch(`${HYPERLIQUID_WS_CHANNELS.USER_FILLS}:${this.auth.getAddress()}`, subscription)) {
            // Filter by symbol if provided
            if (exchangeSymbol && fill.coin !== exchangeSymbol) {
                continue;
            }
            yield this.normalizer.normalizeUserFill(fill);
        }
    }
}
//# sourceMappingURL=HyperliquidWebSocket.js.map
/**
 * Lighter WebSocket Handler
 *
 * Manages WebSocket subscriptions and real-time data streaming
 * for the Lighter exchange adapter.
 */
import { EventEmitter } from 'events';
import type { WebSocketManager } from '../../websocket/WebSocketManager.js';
import type { Balance, Order, OrderBook, Position, Ticker, Trade } from '../../types/common.js';
import type { LighterNormalizer } from './LighterNormalizer.js';
import type { LighterWasmSigner } from './signer/index.js';
export interface LighterWebSocketDeps {
    wsManager: WebSocketManager;
    normalizer: LighterNormalizer;
    signer: LighterWasmSigner | null;
    apiKey?: string;
    accountIndex: number;
    apiKeyIndex: number;
    hasAuthentication: boolean;
    hasWasmSigning: boolean;
    maxReconnectAttempts?: number;
    /** symbol → integer market_id map (Lighter addresses WS markets by int id). */
    marketIdCache: Map<string, number>;
    /** Ensure the market id cache is warm (mirrors the REST path). */
    ensureMarkets?: () => Promise<void>;
}
/**
 * WebSocket streaming handler for Lighter
 *
 * Provides async generators for real-time market data and user events.
 * Extracted from LighterAdapter to improve code organization.
 */
export declare class LighterWebSocket extends EventEmitter {
    private readonly wsManager;
    private readonly normalizer;
    private readonly signer;
    private readonly apiKey?;
    private readonly accountIndex;
    private readonly apiKeyIndex;
    private readonly _hasAuthentication;
    private readonly _hasWasmSigning;
    private reconnectAttempts;
    private readonly maxReconnectAttempts;
    private intentionalDisconnect;
    private readonly marketIdCache;
    private readonly ensureMarkets?;
    constructor(deps: LighterWebSocketDeps);
    /**
     * Resolve the integer market_id for a Lighter symbol, warming the cache if cold.
     * Throws a clear error rather than hanging if the market is unknown.
     */
    private resolveMarketId;
    /**
     * Disconnect and prevent further reconnection attempts
     */
    disconnect(): void;
    /**
     * Wire reconnect tracking to wsManager events.
     * wsManager extends EventEmitter in production; guards handle test mocks.
     */
    private setupReconnectHandling;
    /**
     * Watch order book updates in real-time
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDC:USDC")
     * @param limit - Optional depth limit (default: 50)
     */
    watchOrderBook(symbol: string, _limit?: number): AsyncGenerator<OrderBook>;
    /**
     * Build the unified LighterOrderBook shape the normalizer expects
     * ({ symbol, bids:[[px,sz]], asks:[[px,sz]], timestamp }) from the folded
     * per-stream book state.
     */
    private toLighterOrderBook;
    /**
     * Watch trades in real-time
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDC:USDC")
     */
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    /**
     * Transform a raw Lighter trade into the unified LighterTrade shape the
     * normalizer expects ({ id, symbol, side, price, amount, timestamp }).
     * Lighter encodes side via is_maker_ask (maker on the ask → aggressor bought).
     */
    private toLighterTrade;
    /**
     * Watch ticker updates in real-time
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDC:USDC")
     */
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    /**
     * Watch position updates in real-time
     *
     * Requires authentication.
     */
    watchPositions(): AsyncGenerator<Position[]>;
    /**
     * Watch open orders in real-time
     *
     * Requires authentication.
     */
    watchOrders(): AsyncGenerator<Order[]>;
    /**
     * Watch balance updates in real-time
     *
     * Requires authentication.
     */
    watchBalance(): AsyncGenerator<Balance[]>;
    /**
     * Watch user trades (fills) in real-time
     *
     * Requires authentication.
     *
     * @param symbol - Optional symbol to filter trades
     */
    watchMyTrades(symbol?: string): AsyncGenerator<Trade>;
    /**
     * Build authenticated subscription object for WebSocket
     */
    private buildAuthenticatedSubscription;
    /**
     * Get authentication identifier for channel naming
     */
    private getAuthIdentifier;
}
//# sourceMappingURL=LighterWebSocket.d.ts.map
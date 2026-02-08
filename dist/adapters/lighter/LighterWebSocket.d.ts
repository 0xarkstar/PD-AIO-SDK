/**
 * Lighter WebSocket Handler
 *
 * Manages WebSocket subscriptions and real-time data streaming
 * for the Lighter exchange adapter.
 */
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
}
/**
 * WebSocket streaming handler for Lighter
 *
 * Provides async generators for real-time market data and user events.
 * Extracted from LighterAdapter to improve code organization.
 */
export declare class LighterWebSocket {
    private readonly wsManager;
    private readonly normalizer;
    private readonly signer;
    private readonly apiKey?;
    private readonly accountIndex;
    private readonly apiKeyIndex;
    private readonly _hasAuthentication;
    private readonly _hasWasmSigning;
    constructor(deps: LighterWebSocketDeps);
    /**
     * Watch order book updates in real-time
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDC:USDC")
     * @param limit - Optional depth limit (default: 50)
     */
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    /**
     * Watch trades in real-time
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDC:USDC")
     */
    watchTrades(symbol: string): AsyncGenerator<Trade>;
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
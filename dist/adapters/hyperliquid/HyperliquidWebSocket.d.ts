/**
 * Hyperliquid WebSocket Handler
 *
 * Manages WebSocket subscriptions and real-time data streaming
 * for the Hyperliquid exchange adapter.
 */
import type { WebSocketManager } from '../../websocket/index.js';
import type { OrderBook, Position, Ticker, Trade, Order } from '../../types/index.js';
import type { HyperliquidAuth } from './HyperliquidAuth.js';
import type { HyperliquidNormalizer } from './HyperliquidNormalizer.js';
export interface HyperliquidWebSocketDeps {
    wsManager: WebSocketManager;
    normalizer: HyperliquidNormalizer;
    auth?: HyperliquidAuth;
    symbolToExchange: (symbol: string) => string;
    fetchOpenOrders: (symbol?: string) => Promise<Order[]>;
}
/**
 * WebSocket streaming handler for Hyperliquid
 *
 * Provides async generators for real-time market data and user events.
 * Extracted from HyperliquidAdapter to improve code organization.
 */
export declare class HyperliquidWebSocket {
    private readonly wsManager;
    private readonly normalizer;
    private readonly auth?;
    private readonly symbolToExchange;
    private readonly fetchOpenOrders;
    constructor(deps: HyperliquidWebSocketDeps);
    /**
     * Watch order book updates in real-time
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
     * @param _limit - Optional depth limit (not used by Hyperliquid)
     */
    watchOrderBook(symbol: string, _limit?: number): AsyncGenerator<OrderBook>;
    /**
     * Watch trades in real-time
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
     */
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    /**
     * Watch ticker updates in real-time
     *
     * Subscribes to allMids channel and filters for the requested symbol.
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
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
     * Subscribes to user fills and yields updated order list when fills occur.
     * Requires authentication.
     */
    watchOrders(): AsyncGenerator<Order[]>;
    /**
     * Watch user trades (fills) in real-time
     *
     * Requires authentication.
     *
     * @param symbol - Optional symbol to filter trades
     */
    watchMyTrades(symbol?: string): AsyncGenerator<Trade>;
}
//# sourceMappingURL=HyperliquidWebSocket.d.ts.map
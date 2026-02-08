/**
 * EdgeX Exchange Adapter
 *
 * High-performance perpetual DEX with ECDSA + SHA3 signatures
 * API Docs: https://edgex-1.gitbook.io/edgeX-documentation/api
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { Market, Order, OrderRequest, Position, Balance, OrderBook, Trade, Ticker, FundingRate, MarketParams, OrderBookParams, TradeParams } from '../../types/common.js';
import type { FeatureMap } from '../../types/adapter.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import type { EdgeXConfig } from './types.js';
/**
 * EdgeX adapter implementation
 */
export declare class EdgeXAdapter extends BaseAdapter {
    readonly id = "edgex";
    readonly name = "EdgeX";
    readonly has: Partial<FeatureMap>;
    private readonly auth?;
    private readonly baseUrl;
    protected rateLimiter: RateLimiter;
    private normalizer;
    constructor(config?: EdgeXConfig);
    /**
     * Initialize the adapter
     * Note: starkPrivateKey is only required for private API operations (trading)
     */
    initialize(): Promise<void>;
    /**
     * Require authentication for private API operations
     */
    private requireAuth;
    /**
     * Cleanup resources
     */
    disconnect(): Promise<void>;
    /**
     * Fetch all available markets
     */
    fetchMarkets(_params?: MarketParams): Promise<Market[]>;
    /**
     * Fetch ticker for a symbol
     */
    fetchTicker(symbol: string): Promise<Ticker>;
    /**
     * Fetch order book for a symbol
     * Note: EdgeX only supports level=15 or level=200 for order book depth
     */
    fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    /**
     * Fetch recent trades for a symbol
     * Note: EdgeX does not expose public trades via REST API.
     * Use WebSocket (watchTrades) for real-time trade data.
     */
    fetchTrades(_symbol: string, _params?: TradeParams): Promise<Trade[]>;
    /**
     * Fetch current funding rate
     */
    fetchFundingRate(symbol: string): Promise<FundingRate>;
    /**
     * Fetch funding rate history
     */
    fetchFundingRateHistory(_symbol: string, _since?: number, _limit?: number): Promise<FundingRate[]>;
    /**
     * Fetch all open positions
     */
    fetchPositions(symbols?: string[]): Promise<Position[]>;
    /**
     * Fetch account balance
     */
    fetchBalance(): Promise<Balance[]>;
    /**
     * Create a new order
     */
    createOrder(request: OrderRequest): Promise<Order>;
    /**
     * Cancel an existing order
     */
    cancelOrder(orderId: string, _symbol?: string): Promise<Order>;
    /**
     * Cancel all orders
     */
    cancelAllOrders(symbol?: string): Promise<Order[]>;
    /**
     * Create multiple orders in a single request
     *
     * @param orders - Array of order requests
     * @returns Array of created orders
     */
    createBatchOrders(orders: OrderRequest[]): Promise<Order[]>;
    /**
     * Modify an existing order
     *
     * @param orderId - Order ID to modify
     * @param symbol - Trading symbol
     * @param type - Order type (market/limit)
     * @param side - Order side (buy/sell)
     * @param amount - New order amount (optional)
     * @param price - New order price (optional)
     * @returns Modified order
     */
    modifyOrder(orderId: string, _symbol: string, _type: 'market' | 'limit', _side: 'buy' | 'sell', amount?: number, price?: number): Promise<Order>;
    /**
     * Fetch open orders
     */
    fetchOpenOrders(symbol?: string): Promise<Order[]>;
    /**
     * Fetch a specific order
     */
    fetchOrder(orderId: string, _symbol?: string): Promise<Order>;
    /**
     * Set leverage for a symbol
     */
    setLeverage(symbol: string, leverage: number): Promise<void>;
    /**
     * Fetch order history
     *
     * Retrieves closed/filled orders from EdgeX.
     * Uses /api/v1/private/order/getOrderFillTransactionPage endpoint.
     *
     * @param symbol - Optional symbol filter
     * @param since - Optional start timestamp
     * @param limit - Optional limit (default 100, max 500)
     * @returns Array of historical orders
     */
    fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    /**
     * Fetch user trade history
     *
     * Retrieves user's executed trades from EdgeX.
     * Uses /api/v1/private/order/getOrderFillTransactionPage endpoint.
     *
     * @param symbol - Optional symbol filter
     * @param since - Optional start timestamp
     * @param limit - Optional limit (default 100, max 500)
     * @returns Array of trades
     */
    fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]>;
    /**
     * Convert unified symbol to exchange format
     */
    symbolToExchange(symbol: string): string;
    /**
     * Convert exchange symbol to unified format
     */
    symbolFromExchange(exchangeSymbol: string): string;
    /**
     * Make HTTP request
     * Authentication headers are added for private endpoints
     */
    protected makeRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, endpoint: string, body?: Record<string, unknown>): Promise<any>;
}
//# sourceMappingURL=EdgeXAdapter.d.ts.map
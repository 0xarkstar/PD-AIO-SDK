/**
 * Backpack Exchange Adapter
 *
 * Centralized exchange with perpetual futures using ED25519 signatures
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { Market, Order, OrderRequest, Position, Balance, OrderBook, Trade, Ticker, FundingRate, MarketParams, OrderBookParams, TradeParams } from '../../types/common.js';
import type { FeatureMap } from '../../types/adapter.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import type { BackpackConfig } from './types.js';
/**
 * Backpack adapter implementation
 */
export declare class BackpackAdapter extends BaseAdapter {
    readonly id = "backpack";
    readonly name = "Backpack";
    readonly has: Partial<FeatureMap>;
    private readonly auth?;
    private readonly baseUrl;
    protected readonly httpClient: HTTPClient;
    protected rateLimiter: RateLimiter;
    private normalizer;
    constructor(config?: BackpackConfig);
    /**
     * Initialize the adapter
     * Public API methods work without authentication
     */
    initialize(): Promise<void>;
    /**
     * Check if credentials are available for private API methods
     */
    private hasCredentials;
    /**
     * Require credentials for private methods
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
     */
    fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    /**
     * Fetch recent trades for a symbol
     */
    fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    /**
     * Fetch current funding rate
     * Returns the most recent funding rate from history
     */
    fetchFundingRate(symbol: string): Promise<FundingRate>;
    /**
     * Fetch funding rate history
     */
    fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;
    /**
     * Fetch all open positions
     */
    fetchPositions(symbols?: string[]): Promise<Position[]>;
    /**
     * Fetch account balance
     *
     * Backpack balance endpoint: GET /api/v1/capital
     * Response format: { "ASSET": { available: "...", locked: "...", staked: "..." }, ... }
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
     */
    fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    /**
     * Fetch user trade history
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
     * Instruction mapping for Backpack API endpoints.
     * The instruction value is required for the ED25519 signature payload.
     */
    private static readonly INSTRUCTION_MAP;
    /**
     * Make authenticated HTTP request using HTTPClient
     *
     * Backpack API uses /api/v1 prefix for all endpoints.
     */
    protected makeRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, endpoint: string, body?: Record<string, unknown>): Promise<any>;
}
//# sourceMappingURL=BackpackAdapter.d.ts.map
/**
 * Paradex Exchange Adapter
 *
 * StarkNet-based perpetual DEX with JWT authentication
 *
 * Architecture:
 * - ParadexHTTPClient: HTTP requests with JWT management
 * - ParadexNormalizer: Data transformation
 * - ParadexErrorMapper: Error classification
 * - ParadexParaclearWrapper: Withdrawal operations via SDK
 * - ParadexWebSocketWrapper: Real-time streams
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { Market, Order, OrderRequest, Position, Balance, OrderBook, Trade, Ticker, FundingRate, MarketParams, OrderBookParams, TradeParams } from '../../types/common.js';
import type { FeatureMap } from '../../types/adapter.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import type { ParadexConfig } from './types.js';
/**
 * Paradex adapter implementation
 */
export declare class ParadexAdapter extends BaseAdapter {
    readonly id = "paradex";
    readonly name = "Paradex";
    readonly has: Partial<FeatureMap>;
    private readonly auth;
    private readonly client;
    private readonly normalizer;
    private readonly paraclear;
    private ws?;
    protected rateLimiter: RateLimiter;
    private readonly wsUrl;
    constructor(config?: ParadexConfig);
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
     */
    fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    /**
     * Fetch recent trades for a symbol
     */
    fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    /**
     * Fetch current funding rate
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
     * Withdraw funds from Paraclear
     *
     * IMPORTANT: Requires Ethereum signer to be initialized via paraclear.initializeAccount()
     *
     * @param token - Token symbol (e.g., "USDC", "ETH")
     * @param amount - Amount to withdraw (as number)
     * @param bridgeCall - StarkNet bridge call for L1 transfer
     * @returns Transaction hash and actual receivable amount (after socialized loss)
     *
     * @example
     * ```typescript
     * // Initialize Paraclear account first
     * const signer = new ethers.Wallet(privateKey);
     * await adapter.paraclear.initializeAccount(signer);
     *
     * // Withdraw USDC
     * const result = await adapter.withdraw('USDC', 100, bridgeCall);
     * console.log('TX:', result.txHash);
     * console.log('Actual amount:', result.amount); // May be less if socialized loss active
     * ```
     */
    withdraw(token: string, amount: number, bridgeCall: any): Promise<{
        txHash: string;
        amount: number;
    }>;
    /**
     * Fetch Paraclear (on-chain) balance
     *
     * This queries the StarkNet chain directly via Paraclear SDK,
     * which may differ from API balance due to pending operations.
     *
     * @param token - Optional token filter (e.g., "USDC")
     * @returns Balance array
     */
    fetchParaclearBalance(token?: string): Promise<Balance[]>;
    /**
     * Ensure WebSocket is connected
     */
    private ensureWebSocket;
    /**
     * Watch order book updates for a symbol
     *
     * @param symbol - Trading symbol in CCXT format
     * @param limit - Order book depth (default: 50)
     * @returns AsyncGenerator yielding OrderBook updates
     */
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    /**
     * Watch public trades for a symbol
     *
     * @param symbol - Trading symbol in CCXT format
     * @returns AsyncGenerator yielding Trade updates
     */
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    /**
     * Watch ticker for a symbol
     *
     * @param symbol - Trading symbol in CCXT format
     * @returns AsyncGenerator yielding Ticker updates
     */
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    /**
     * Watch position updates for user account
     *
     * @param symbol - Optional symbol filter
     * @returns AsyncGenerator yielding Position updates
     */
    watchPositions(symbol?: string): AsyncGenerator<Position[]>;
    /**
     * Watch order updates for user account
     *
     * @param symbol - Optional symbol filter
     * @returns AsyncGenerator yielding Order updates
     */
    watchOrders(symbol?: string): AsyncGenerator<Order[]>;
    /**
     * Watch balance updates
     *
     * @returns AsyncGenerator yielding Balance array
     */
    watchBalance(): AsyncGenerator<Balance[]>;
    /**
     * Watch user trades (fills) in real-time
     *
     * @param symbol - Optional symbol filter
     * @returns AsyncGenerator yielding Trade updates
     */
    watchMyTrades(symbol?: string): AsyncGenerator<Trade>;
    /**
     * Convert unified symbol to exchange format
     */
    symbolToExchange(symbol: string): string;
    /**
     * Convert exchange symbol to unified format
     */
    symbolFromExchange(exchangeSymbol: string): string;
}
//# sourceMappingURL=ParadexAdapter.d.ts.map
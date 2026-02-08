/**
 * Jupiter Perps Exchange Adapter
 *
 * Adapter for Jupiter Perpetuals on Solana.
 * Jupiter Perps uses on-chain positions and the JLP pool for liquidity.
 *
 * Key characteristics:
 * - On-chain positions via Solana program
 * - Borrow fees instead of funding rates
 * - Supports SOL, ETH, BTC perpetuals
 * - Up to 250x leverage
 *
 * @see https://jup.ag/perps
 * @see https://dev.jup.ag/docs/perps
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { Balance, ExchangeConfig, FeatureMap, FundingRate, Market, MarketParams, Order, OrderBook, OrderBookParams, OrderRequest, Position, Ticker, Trade, TradeParams } from '../../types/index.js';
/**
 * Jupiter adapter configuration
 */
export interface JupiterConfig extends ExchangeConfig {
    /** Solana private key for trading (optional for read-only) */
    privateKey?: string | Uint8Array;
    /** Wallet address for fetching positions/balances */
    walletAddress?: string;
    /** Custom Solana RPC endpoint */
    rpcEndpoint?: string;
}
/**
 * @deprecated Use JupiterConfig instead
 */
export type JupiterAdapterConfig = JupiterConfig;
/**
 * Jupiter Perpetuals Exchange Adapter
 *
 * @example
 * ```typescript
 * // Read-only mode (market data only)
 * const jupiter = new JupiterAdapter();
 * await jupiter.initialize();
 *
 * // Fetch ticker
 * const ticker = await jupiter.fetchTicker('SOL/USD:USD');
 *
 * // With wallet for trading
 * const jupiter = new JupiterAdapter({
 *   privateKey: 'your-solana-private-key',
 *   rpcEndpoint: 'https://your-rpc-endpoint.com',
 * });
 * await jupiter.initialize();
 *
 * // Create order
 * const order = await jupiter.createOrder({
 *   symbol: 'SOL/USD:USD',
 *   side: 'buy',
 *   type: 'market',
 *   amount: 1.0,
 *   leverage: 10,
 * });
 * ```
 */
export declare class JupiterAdapter extends BaseAdapter {
    readonly id = "jupiter";
    readonly name = "Jupiter Perps";
    readonly has: Partial<FeatureMap>;
    private normalizer;
    private auth?;
    private solanaClient?;
    private instructionBuilder?;
    private priceCache;
    private priceCacheTTL;
    private readonly adapterConfig;
    constructor(config?: JupiterAdapterConfig);
    initialize(): Promise<void>;
    protected symbolToExchange(symbol: string): string;
    protected symbolFromExchange(exchangeSymbol: string): string;
    fetchMarkets(params?: MarketParams): Promise<Market[]>;
    fetchTicker(symbol: string): Promise<Ticker>;
    fetchOrderBook(symbol: string, _params?: OrderBookParams): Promise<OrderBook>;
    fetchTrades(_symbol: string, _params?: TradeParams): Promise<Trade[]>;
    fetchFundingRate(symbol: string): Promise<FundingRate>;
    fetchFundingRateHistory(_symbol: string, _since?: number, _limit?: number): Promise<FundingRate[]>;
    fetchPositions(symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    fetchOpenOrders(_symbol?: string): Promise<Order[]>;
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(_orderId: string, _symbol?: string): Promise<Order>;
    cancelAllOrders(_symbol?: string): Promise<Order[]>;
    /**
     * Close a position
     */
    closePosition(positionId: string, params?: {
        sizeUsd?: number;
        priceLimit?: number;
    }): Promise<Order>;
    fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
    fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<Trade[]>;
    setLeverage(_symbol: string, _leverage: number): Promise<void>;
    protected performApiHealthCheck(): Promise<void>;
    /**
     * Get current price for a symbol
     */
    private getCurrentPrice;
    /**
     * Fetch price from Jupiter Price API
     */
    private fetchPrice;
    /**
     * Fetch prices for multiple tokens
     */
    private fetchPrices;
    /**
     * Filter markets by params
     */
    private filterMarkets;
    /**
     * Create mock custody account for funding rate calculation
     */
    private createMockCustodyForFunding;
    /**
     * Parse position account data from buffer
     */
    private parsePositionAccount;
    /**
     * Get symbol from custody address
     */
    private getSymbolFromCustody;
    /**
     * Normalize position to SDK format
     */
    private normalizePosition;
    /**
     * Get wallet address (for position queries)
     */
    getAddress(): Promise<string | undefined>;
}
//# sourceMappingURL=JupiterAdapter.d.ts.map
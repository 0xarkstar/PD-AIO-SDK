/**
 * Drift Protocol Exchange Adapter
 *
 * Adapter for Drift Protocol on Solana.
 * Drift is a decentralized perpetuals DEX with cross-margin and up to 20x leverage.
 *
 * Key characteristics:
 * - On-chain positions via Solana program
 * - Hourly funding rate settlements
 * - Supports 10+ perpetual markets
 * - Cross-margin by default
 * - DLOB (Decentralized Limit Order Book)
 *
 * @see https://docs.drift.trade/
 * @see https://drift-labs.github.io/v2-teacher/
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { Balance, ExchangeConfig, FeatureMap, FundingRate, Market, MarketParams, Order, OrderBook, OrderBookParams, OrderRequest, Position, Ticker, Trade, TradeParams } from '../../types/index.js';
import { type DriftOrderBuilderConfig } from './orderBuilder.js';
/**
 * Drift adapter configuration
 */
export interface DriftConfig extends ExchangeConfig {
    /** Solana private key for trading (optional for read-only) */
    privateKey?: string | Uint8Array;
    /** Wallet address for fetching positions/balances */
    walletAddress?: string;
    /** Sub-account ID (default: 0) */
    subAccountId?: number;
    /** Custom Solana RPC endpoint */
    rpcEndpoint?: string;
    /** Order builder configuration */
    orderConfig?: DriftOrderBuilderConfig;
}
/**
 * Drift Protocol Exchange Adapter
 *
 * @example
 * ```typescript
 * // Read-only mode (market data only)
 * const drift = new DriftAdapter();
 * await drift.initialize();
 *
 * // Fetch ticker
 * const ticker = await drift.fetchTicker('SOL/USD:USD');
 *
 * // With wallet for positions
 * const drift = new DriftAdapter({
 *   walletAddress: 'your-solana-wallet-address',
 * });
 * await drift.initialize();
 * const positions = await drift.fetchPositions();
 *
 * // Full trading mode
 * const drift = new DriftAdapter({
 *   privateKey: '[1,2,3,...,64]', // JSON array format
 * });
 * await drift.initialize();
 * const order = await drift.createOrder({
 *   symbol: 'SOL/USD:USD',
 *   side: 'buy',
 *   type: 'market',
 *   amount: 1,
 * });
 * ```
 */
export declare class DriftAdapter extends BaseAdapter {
    readonly id = "drift";
    readonly name = "Drift Protocol";
    readonly has: Partial<FeatureMap>;
    private normalizer;
    private auth?;
    private driftClient?;
    private orderBuilder?;
    private dlobBaseUrl;
    private isTestnet;
    private marketStatsCache;
    private statsCacheTTL;
    constructor(config?: DriftConfig);
    initialize(): Promise<void>;
    /**
     * Initialize the Drift SDK client for trading
     */
    private initializeDriftClient;
    disconnect(): Promise<void>;
    protected symbolToExchange(symbol: string): string;
    protected symbolFromExchange(exchangeSymbol: string): string;
    fetchMarkets(params?: MarketParams): Promise<Market[]>;
    fetchTicker(symbol: string): Promise<Ticker>;
    fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    fetchFundingRate(symbol: string): Promise<FundingRate>;
    fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;
    fetchPositions(symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    fetchOpenOrders(symbol?: string): Promise<Order[]>;
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(orderId: string, symbol?: string): Promise<Order>;
    cancelAllOrders(symbol?: string): Promise<Order[]>;
    fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]>;
    setLeverage(symbol: string, leverage: number): Promise<void>;
    protected performApiHealthCheck(): Promise<void>;
    /**
     * Filter markets by params
     */
    private filterMarkets;
    /**
     * Get wallet address (for position queries)
     */
    getAddress(): Promise<string | undefined>;
    /**
     * Get sub-account ID
     */
    getSubAccountId(): number;
}
//# sourceMappingURL=DriftAdapter.d.ts.map
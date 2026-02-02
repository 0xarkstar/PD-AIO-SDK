/**
 * GMX v2 Exchange Adapter
 *
 * Adapter for GMX v2 perpetuals on Arbitrum and Avalanche.
 * GMX v2 uses synthetics-based perpetuals with on-chain keeper execution.
 *
 * Key characteristics:
 * - Up to 100x leverage
 * - Cross-margin
 * - Continuous funding rate
 * - On-chain order execution via keepers
 * - Multi-collateral support
 *
 * @see https://docs.gmx.io/docs/api/rest-v2/
 * @see https://github.com/gmx-io/gmx-synthetics
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { Balance, ExchangeConfig, FeatureMap, FundingRate, Market, MarketParams, OHLCV, OHLCVParams, OHLCVTimeframe, Order, OrderBook, OrderBookParams, OrderRequest, Position, Ticker, Trade, TradeParams } from '../../types/index.js';
import { type OrderBuilderConfig } from './GmxOrderBuilder.js';
export type GmxChain = 'arbitrum' | 'avalanche';
/**
 * GMX adapter configuration
 */
export interface GmxConfig extends ExchangeConfig {
    /** Chain to use (default: arbitrum) */
    chain?: GmxChain;
    /** Wallet address for fetching positions */
    walletAddress?: string;
    /** Private key for trading */
    privateKey?: string;
    /** Custom RPC endpoint */
    rpcEndpoint?: string;
    /** Order builder configuration */
    orderConfig?: OrderBuilderConfig;
}
/**
 * GMX v2 Exchange Adapter
 *
 * @example
 * ```typescript
 * // Read-only mode (market data only)
 * const gmx = new GmxAdapter({ chain: 'arbitrum' });
 * await gmx.initialize();
 *
 * // Fetch ticker
 * const ticker = await gmx.fetchTicker('ETH/USD:ETH');
 *
 * // With wallet for positions
 * const gmx = new GmxAdapter({
 *   chain: 'arbitrum',
 *   walletAddress: '0x...',
 * });
 * await gmx.initialize();
 * const positions = await gmx.fetchPositions();
 *
 * // Full trading mode
 * const gmx = new GmxAdapter({
 *   chain: 'arbitrum',
 *   privateKey: '0x...',
 * });
 * await gmx.initialize();
 * const order = await gmx.createOrder({
 *   symbol: 'ETH/USD:ETH',
 *   side: 'buy',
 *   type: 'market',
 *   amount: 0.1,
 *   leverage: 10,
 * });
 * ```
 */
export declare class GmxAdapter extends BaseAdapter {
    readonly id = "gmx";
    readonly name = "GMX v2";
    readonly has: Partial<FeatureMap>;
    private normalizer;
    private chain;
    private apiBaseUrl;
    private walletAddress?;
    private auth?;
    private contracts?;
    private subgraph?;
    private orderBuilder?;
    private orderConfig?;
    private marketsCache;
    private marketsCacheTimestamp;
    private marketsCacheTTL;
    private pricesCache;
    private pricesCacheTimestamp;
    private pricesCacheTTL;
    constructor(config?: GmxConfig);
    initialize(): Promise<void>;
    disconnect(): Promise<void>;
    fetchMarkets(params?: MarketParams): Promise<Market[]>;
    fetchTicker(symbol: string): Promise<Ticker>;
    fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    fetchFundingRate(symbol: string): Promise<FundingRate>;
    fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;
    fetchOHLCV(symbol: string, timeframe?: OHLCVTimeframe, params?: OHLCVParams): Promise<OHLCV[]>;
    fetchPositions(symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    fetchOpenOrders(symbol?: string): Promise<Order[]>;
    fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]>;
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(orderId: string, symbol?: string): Promise<Order>;
    cancelAllOrders(symbol?: string): Promise<Order[]>;
    setLeverage(symbol: string, leverage: number): Promise<void>;
    /**
     * Fetch markets info from API with caching
     */
    private fetchMarketsInfo;
    /**
     * Fetch token prices from API with caching
     */
    private fetchPrices;
    /**
     * Convert timeframe to GMX interval
     */
    private timeframeToInterval;
    /**
     * Convert symbol to exchange format
     */
    protected symbolToExchange(symbol: string): string;
    /**
     * Convert exchange symbol to unified format
     */
    protected symbolFromExchange(exchangeSymbol: string): string;
    /**
     * Get chain info
     */
    getChain(): GmxChain;
    /**
     * Get API base URL
     */
    getApiBaseUrl(): string;
}
//# sourceMappingURL=GmxAdapter.d.ts.map
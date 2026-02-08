/**
 * dYdX v4 Exchange Adapter
 *
 * Implements IExchangeAdapter for dYdX v4 Perpetual DEX.
 * dYdX v4 is built on a Cosmos SDK L1 blockchain with its own validator set.
 *
 * Features:
 * - 220+ perpetual markets
 * - Hourly funding rates
 * - Cross-margin trading
 * - Full orderbook
 *
 * @see https://docs.dydx.exchange/
 */
import type { Balance, ExchangeConfig, FeatureMap, FundingRate, Market, MarketParams, OHLCV, OHLCVParams, OHLCVTimeframe, Order, OrderBook, OrderBookParams, OrderRequest, Position, Ticker, Trade, TradeParams } from '../../types/index.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
/**
 * dYdX v4 adapter configuration
 */
export interface DydxConfig extends ExchangeConfig {
    /** Mnemonic phrase for trading (24 words) */
    mnemonic?: string;
    /** Private key for trading (alternative to mnemonic) */
    privateKey?: string;
    /** Subaccount number (default: 0) */
    subaccountNumber?: number;
}
/**
 * dYdX v4 Exchange Adapter
 *
 * Provides access to dYdX v4's perpetual futures markets through the Indexer API.
 *
 * @example
 * ```typescript
 * // Read-only mode (no authentication needed)
 * const dydx = new DydxAdapter({ testnet: true });
 * await dydx.initialize();
 *
 * const markets = await dydx.fetchMarkets();
 * const ticker = await dydx.fetchTicker('BTC/USD:USD');
 *
 * // Trading mode (requires mnemonic)
 * const dydxTrading = new DydxAdapter({
 *   mnemonic: 'your 24 word mnemonic...',
 *   subaccountNumber: 0,
 * });
 * await dydxTrading.initialize();
 *
 * const positions = await dydxTrading.fetchPositions();
 * ```
 */
export declare class DydxAdapter extends BaseAdapter {
    readonly id = "dydx";
    readonly name = "dYdX v4";
    readonly has: Partial<FeatureMap>;
    private apiUrl;
    private auth?;
    protected rateLimiter: RateLimiter;
    private normalizer;
    private subaccountNumber;
    private marketDataCache;
    private readonly marketDataCacheTTL;
    constructor(config?: DydxConfig);
    initialize(): Promise<void>;
    disconnect(): Promise<void>;
    fetchMarkets(params?: MarketParams): Promise<Market[]>;
    fetchTicker(symbol: string): Promise<Ticker>;
    fetchOrderBook(symbol: string, _params?: OrderBookParams): Promise<OrderBook>;
    fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    fetchFundingRate(symbol: string): Promise<FundingRate>;
    fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;
    fetchOHLCV(symbol: string, timeframe?: OHLCVTimeframe, params?: OHLCVParams): Promise<OHLCV[]>;
    createOrder(_request: OrderRequest): Promise<Order>;
    cancelOrder(_orderId: string, _symbol?: string): Promise<Order>;
    cancelAllOrders(_symbol?: string): Promise<Order[]>;
    fetchPositions(symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    setLeverage(_symbol: string, _leverage: number): Promise<void>;
    fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]>;
    /**
     * Fetch open orders
     *
     * @param symbol - Optional symbol to filter orders
     * @returns Array of open orders
     */
    fetchOpenOrders(symbol?: string): Promise<Order[]>;
    watchOrderBook(_symbol: string, _limit?: number): AsyncGenerator<OrderBook>;
    watchTrades(_symbol: string): AsyncGenerator<Trade>;
    watchTicker(_symbol: string): AsyncGenerator<Ticker>;
    watchPositions(): AsyncGenerator<Position[]>;
    watchOrders(): AsyncGenerator<Order[]>;
    watchBalance(): AsyncGenerator<Balance[]>;
    protected symbolToExchange(symbol: string): string;
    protected symbolFromExchange(exchangeSymbol: string): string;
    /**
     * Get oracle price from cache or fetch fresh
     */
    private getOraclePrice;
    /**
     * Get the dYdX address (if authenticated)
     */
    getAddress(): Promise<string | undefined>;
    /**
     * Get the configured subaccount number
     */
    getSubaccountNumber(): number;
}
//# sourceMappingURL=DydxAdapter.d.ts.map
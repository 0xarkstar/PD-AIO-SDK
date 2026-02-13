/**
 * Hyperliquid Exchange Adapter
 *
 * Implements IExchangeAdapter for Hyperliquid DEX
 */
import { Wallet } from 'ethers';
import type { Balance, ExchangeConfig, FeatureMap, FundingRate, Market, MarketParams, OHLCV, OHLCVParams, OHLCVTimeframe, Order, OrderBook, OrderBookParams, OrderRequest, Position, Ticker, Trade, TradeParams } from '../../types/index.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
export interface HyperliquidConfig extends ExchangeConfig {
    /** Ethereum wallet for signing */
    wallet?: Wallet;
    /** Private key (alternative to wallet) */
    privateKey?: string;
    /** Builder fee address for order attribution */
    builderAddress?: string;
}
export declare class HyperliquidAdapter extends BaseAdapter {
    readonly id = "hyperliquid";
    readonly name = "Hyperliquid";
    readonly has: Partial<FeatureMap>;
    private apiUrl;
    private wsUrl;
    private wsManager?;
    private wsHandler?;
    private auth?;
    protected rateLimiter: RateLimiter;
    private normalizer;
    private readonly builderAddress?;
    private readonly builderCodeEnabled;
    constructor(config?: HyperliquidConfig);
    initialize(): Promise<void>;
    disconnect(): Promise<void>;
    fetchMarkets(params?: MarketParams): Promise<Market[]>;
    fetchTicker(symbol: string): Promise<Ticker>;
    fetchOrderBook(symbol: string, _params?: OrderBookParams): Promise<OrderBook>;
    fetchTrades(_symbol: string, _params?: TradeParams): Promise<Trade[]>;
    /**
     * Fetch OHLCV (candlestick) data
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
     * @param timeframe - Candlestick timeframe
     * @param params - Optional parameters (since, until, limit)
     * @returns Array of OHLCV tuples [timestamp, open, high, low, close, volume]
     */
    fetchOHLCV(symbol: string, timeframe?: OHLCVTimeframe, params?: OHLCVParams): Promise<OHLCV[]>;
    fetchFundingRate(symbol: string): Promise<FundingRate>;
    fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(orderId: string, symbol?: string): Promise<Order>;
    cancelAllOrders(symbol?: string): Promise<Order[]>;
    fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]>;
    fetchPositions(symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    setLeverage(symbol: string, leverage: number): Promise<void>;
    /** Ensure authenticated and return auth instance */
    private ensureAuth;
    /** Make authenticated info request */
    private authInfoRequest;
    fetchUserFees(): Promise<import('../../types/common.js').UserFees>;
    fetchPortfolio(): Promise<import('../../types/common.js').Portfolio>;
    fetchRateLimitStatus(): Promise<import('../../types/common.js').RateLimitStatus>;
    private ensureWsHandler;
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    watchPositions(): AsyncGenerator<Position[]>;
    watchOrders(): AsyncGenerator<Order[]>;
    watchMyTrades(symbol?: string): AsyncGenerator<Trade>;
    /** Get default duration for OHLCV timeframe */
    protected getDefaultDuration(timeframe: OHLCVTimeframe): number;
    protected symbolToExchange(symbol: string): string;
    protected symbolFromExchange(exchangeSymbol: string): string;
    /**
     * Fetch open orders
     *
     * @param symbol - Optional symbol to filter orders (e.g., "BTC/USDT:USDT")
     * @returns Array of open orders
     */
    fetchOpenOrders(symbol?: string): Promise<Order[]>;
}
//# sourceMappingURL=HyperliquidAdapter.d.ts.map
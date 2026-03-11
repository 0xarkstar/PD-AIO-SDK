/**
 * Ethereal Exchange Adapter
 *
 * Implements IExchangeAdapter for Ethereal DEX.
 * Ethereal is a perpetual DEX with REST API and EIP-712 authentication.
 */
import type { Balance, FundingRate, Market, MarketParams, OHLCV, OHLCVParams, OHLCVTimeframe, Order, OrderBook, OrderBookParams, OrderRequest, Position, Ticker, Trade, TradeParams } from '../../types/common.js';
import type { FeatureMap, IExchangeAdapter } from '../../types/adapter.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import type { EtherealConfig } from './types.js';
export { EtherealConfig };
export declare class EtherealAdapter extends BaseAdapter implements IExchangeAdapter {
    readonly id = "ethereal";
    readonly name = "Ethereal";
    readonly has: Partial<FeatureMap>;
    private readonly auth?;
    private readonly baseUrl;
    protected readonly httpClient: HTTPClient;
    protected rateLimiter: RateLimiter;
    private normalizer;
    private readonly accountId;
    /** Maps unified symbol (e.g. "ETH/USD:USD") to product UUID */
    private productMap;
    /** Maps product UUID to cached product info */
    private productCache;
    constructor(config?: EtherealConfig);
    initialize(): Promise<void>;
    protected symbolToExchange(symbol: string): string;
    protected symbolFromExchange(exchangeSymbol: string): string;
    private requireAuth;
    private publicGet;
    private authenticatedRequest;
    private ensureProductMap;
    private getProductId;
    private getProductInfo;
    fetchMarkets(_params?: MarketParams): Promise<Market[]>;
    _fetchTicker(symbol: string): Promise<Ticker>;
    _fetchOrderBook(symbol: string, _params?: OrderBookParams): Promise<OrderBook>;
    _fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    _fetchFundingRate(symbol: string): Promise<FundingRate>;
    fetchFundingRateHistory(_symbol: string, _since?: number, _limit?: number): Promise<FundingRate[]>;
    fetchOHLCV(_symbol: string, _timeframe?: OHLCVTimeframe, _params?: OHLCVParams): Promise<OHLCV[]>;
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(orderId: string, symbol?: string): Promise<Order>;
    cancelAllOrders(symbol?: string): Promise<Order[]>;
    fetchOpenOrders(symbol?: string): Promise<Order[]>;
    fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
    fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]>;
    fetchPositions(symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    _setLeverage(_symbol: string, _leverage: number): Promise<void>;
}
//# sourceMappingURL=EtherealAdapter.d.ts.map
/**
 * Aster Exchange Adapter
 *
 * Implements IExchangeAdapter for Aster DEX (Binance-style API)
 */
import type { Balance, FundingRate, Market, MarketParams, OHLCV, OHLCVParams, OHLCVTimeframe, Order, OrderBook, OrderBookParams, OrderRequest, Position, Ticker, Trade, TradeParams } from '../../types/common.js';
import type { FeatureMap } from '../../types/adapter.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import type { AsterConfig } from './types.js';
export declare class AsterAdapter extends BaseAdapter {
    readonly id = "aster";
    readonly name = "Aster";
    readonly has: Partial<FeatureMap>;
    private readonly auth?;
    private readonly baseUrl;
    protected readonly httpClient: HTTPClient;
    protected rateLimiter: RateLimiter;
    private normalizer;
    private readonly referralCode?;
    private readonly builderCodeEnabled;
    constructor(config?: AsterConfig);
    initialize(): Promise<void>;
    protected symbolToExchange(symbol: string): string;
    protected symbolFromExchange(exchangeSymbol: string): string;
    private requireAuth;
    private publicGet;
    private signedRequest;
    private handleError;
    fetchMarkets(_params?: MarketParams): Promise<Market[]>;
    fetchTicker(symbol: string): Promise<Ticker>;
    fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    fetchFundingRate(symbol: string): Promise<FundingRate>;
    fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;
    fetchOHLCV(symbol: string, timeframe: OHLCVTimeframe, params?: OHLCVParams): Promise<OHLCV[]>;
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(orderId: string, symbol?: string): Promise<Order>;
    cancelAllOrders(symbol?: string): Promise<Order[]>;
    fetchPositions(_symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    setLeverage(symbol: string, leverage: number): Promise<void>;
    fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
    fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<Trade[]>;
}
//# sourceMappingURL=AsterAdapter.d.ts.map
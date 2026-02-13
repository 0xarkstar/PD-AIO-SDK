/**
 * Ostium Exchange Adapter
 *
 * Implements IExchangeAdapter for Ostium (Arbitrum, RWA perps)
 * Uses: REST metadata + GraphQL subgraph + EVM contracts
 */
import type { Balance, FeatureMap, FundingRate, Market, MarketParams, Order, OrderBook, OrderBookParams, OrderRequest, Position, Ticker, Trade, TradeParams } from '../../types/index.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import type { OstiumConfig } from './types.js';
export declare class OstiumAdapter extends BaseAdapter {
    readonly id = "ostium";
    readonly name = "Ostium";
    readonly has: Partial<FeatureMap>;
    private readonly metadataUrl;
    private readonly auth?;
    private contracts?;
    private subgraph;
    protected rateLimiter: RateLimiter;
    private normalizer;
    private readonly referralAddress;
    private readonly builderCodeEnabled;
    constructor(config?: OstiumConfig);
    initialize(): Promise<void>;
    private requireAuth;
    private fetchMetadata;
    fetchMarkets(_params?: MarketParams): Promise<Market[]>;
    fetchTicker(symbol: string): Promise<Ticker>;
    fetchOrderBook(_symbol: string, _params?: OrderBookParams): Promise<OrderBook>;
    fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    fetchFundingRate(_symbol: string): Promise<FundingRate>;
    fetchFundingRateHistory(_symbol: string, _since?: number, _limit?: number): Promise<FundingRate[]>;
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(orderId: string, _symbol?: string): Promise<Order>;
    cancelAllOrders(_symbol?: string): Promise<Order[]>;
    fetchPositions(_symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    setLeverage(_symbol: string, _leverage: number): Promise<void>;
    fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
    fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<Trade[]>;
    protected symbolToExchange(symbol: string): string;
    protected symbolFromExchange(exchangeSymbol: string): string;
}
//# sourceMappingURL=OstiumAdapter.d.ts.map
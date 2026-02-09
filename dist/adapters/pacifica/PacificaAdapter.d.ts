/**
 * Pacifica Exchange Adapter
 *
 * Implements IExchangeAdapter for Pacifica DEX (Solana, Ed25519 auth)
 */
import type { Balance, FundingRate, Market, MarketParams, Order, OrderBook, OrderBookParams, OrderRequest, Position, Ticker, Trade, TradeParams } from '../../types/common.js';
import type { FeatureMap } from '../../types/adapter.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import type { PacificaConfig } from './types.js';
export declare class PacificaAdapter extends BaseAdapter {
    readonly id = "pacifica";
    readonly name = "Pacifica";
    readonly has: Partial<FeatureMap>;
    private readonly auth?;
    private readonly baseUrl;
    protected readonly httpClient: HTTPClient;
    protected rateLimiter: RateLimiter;
    private normalizer;
    private readonly builderCode?;
    private readonly maxBuilderFeeRate;
    constructor(config?: PacificaConfig);
    initialize(): Promise<void>;
    private requireAuth;
    private publicGet;
    private signedRequest;
    private handleError;
    registerBuilderCode(code: string, maxFeeRate: number): Promise<void>;
    fetchMarkets(_params?: MarketParams): Promise<Market[]>;
    fetchTicker(symbol: string): Promise<Ticker>;
    fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    fetchFundingRate(symbol: string): Promise<FundingRate>;
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(orderId: string, _symbol?: string): Promise<Order>;
    fetchPositions(_symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    setLeverage(symbol: string, leverage: number): Promise<void>;
    fetchFundingRateHistory(_symbol: string, _since?: number, _limit?: number): Promise<FundingRate[]>;
    cancelAllOrders(_symbol?: string): Promise<Order[]>;
    fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
    fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<Trade[]>;
    symbolToExchange(symbol: string): string;
    symbolFromExchange(exchangeSymbol: string): string;
}
//# sourceMappingURL=PacificaAdapter.d.ts.map
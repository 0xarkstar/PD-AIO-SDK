/**
 * Pacifica Exchange Adapter
 *
 * Implements IExchangeAdapter for Pacifica DEX (Solana, Ed25519 auth)
 * @see https://docs.pacifica.fi/api-documentation/api/rest-api
 */
import type { Balance, FundingRate, Market, MarketParams, Order, OrderBook, OrderBookParams, OrderRequest, Position, Ticker, Trade, TradeParams } from '../../types/common.js';
import type { FeatureMap, IExchangeAdapter } from '../../types/adapter.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import type { PacificaConfig } from './types.js';
export declare class PacificaAdapter extends BaseAdapter implements IExchangeAdapter {
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
    private readonly builderCodeEnabled;
    constructor(config?: PacificaConfig);
    initialize(): Promise<void>;
    private requireAuth;
    private publicGet;
    private signedRequest;
    private handleError;
    /**
     * Unwrap `{ success, data }` envelope. Returns `data` if present,
     * otherwise returns the raw response (for mocked / non-wrapped responses).
     */
    private unwrapResponse;
    registerBuilderCode(code: string, maxFeeRate: number): Promise<void>;
    fetchMarkets(_params?: MarketParams): Promise<Market[]>;
    _fetchTicker(symbol: string): Promise<Ticker>;
    _fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    _fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    _fetchFundingRate(symbol: string): Promise<FundingRate>;
    fetchFundingRateHistory(symbol: string, _since?: number, _limit?: number): Promise<FundingRate[]>;
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(orderId: string, _symbol?: string): Promise<Order>;
    fetchPositions(_symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    _setLeverage(symbol: string, leverage: number): Promise<void>;
    cancelAllOrders(_symbol?: string): Promise<Order[]>;
    fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
    fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<Trade[]>;
    protected symbolToExchange(symbol: string): string;
    protected symbolFromExchange(exchangeSymbol: string): string;
}
//# sourceMappingURL=PacificaAdapter.d.ts.map
/**
 * Reya Exchange Adapter
 *
 * Implements IExchangeAdapter for Reya DEX.
 * Reya is an L2 perpetual DEX with REST + WebSocket APIs,
 * EIP-712 signing, and continuous funding rates.
 */
import type { Balance, FundingRate, Market, MarketParams, OHLCV, OHLCVParams, OHLCVTimeframe, Order, OrderBook, OrderBookParams, OrderRequest, Position, Ticker, Trade, TradeParams } from '../../types/common.js';
import type { FeatureMap, IExchangeAdapter } from '../../types/adapter.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import type { ReyaConfig } from './types.js';
export { ReyaConfig };
export declare class ReyaAdapter extends BaseAdapter implements IExchangeAdapter {
    readonly id = "reya";
    readonly name = "Reya";
    readonly has: Partial<FeatureMap>;
    private readonly auth?;
    private readonly baseUrl;
    protected readonly httpClient: HTTPClient;
    protected rateLimiter: RateLimiter;
    private normalizer;
    private accountId;
    private readonly exchangeId;
    constructor(config?: ReyaConfig);
    initialize(): Promise<void>;
    protected symbolToExchange(symbol: string): string;
    protected symbolFromExchange(exchangeSymbol: string): string;
    private requireAuth;
    private publicGet;
    fetchMarkets(_params?: MarketParams): Promise<Market[]>;
    _fetchTicker(symbol: string): Promise<Ticker>;
    _fetchOrderBook(symbol: string, _params?: OrderBookParams): Promise<OrderBook>;
    _fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    _fetchFundingRate(symbol: string): Promise<FundingRate>;
    fetchFundingRateHistory(_symbol: string, _since?: number, _limit?: number): Promise<FundingRate[]>;
    fetchOHLCV(symbol: string, timeframe?: OHLCVTimeframe, params?: OHLCVParams): Promise<OHLCV[]>;
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
//# sourceMappingURL=ReyaAdapter.d.ts.map
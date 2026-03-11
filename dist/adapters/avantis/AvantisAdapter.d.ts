/**
 * Avantis Exchange Adapter
 *
 * Implements IExchangeAdapter for Avantis, an on-chain perpetual DEX
 * on Base chain using Pyth oracle price feeds. All interactions happen
 * via smart contract calls using ethers.js.
 */
import type { Balance, FundingRate, Market, MarketParams, OHLCV, OHLCVParams, OHLCVTimeframe, Order, OrderBook, OrderBookParams, OrderRequest, Position, Ticker, Trade, TradeParams } from '../../types/common.js';
import type { FeatureMap, IExchangeAdapter } from '../../types/adapter.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import type { AvantisConfig } from './types.js';
export { AvantisConfig };
export declare class AvantisAdapter extends BaseAdapter implements IExchangeAdapter {
    readonly id = "avantis";
    readonly name = "Avantis";
    readonly has: Partial<FeatureMap>;
    private readonly auth?;
    private readonly provider;
    private readonly normalizer;
    protected rateLimiter: RateLimiter;
    private tradingContract?;
    private storageContract?;
    private pairInfoContract?;
    private pythContract?;
    private usdcContract?;
    private readonly contracts;
    constructor(config?: AvantisConfig);
    initialize(): Promise<void>;
    protected symbolToExchange(symbol: string): string;
    protected symbolFromExchange(exchangeSymbol: string): string;
    private requireAuth;
    private requireContract;
    fetchMarkets(_params?: MarketParams): Promise<Market[]>;
    _fetchTicker(symbol: string): Promise<Ticker>;
    _fetchOrderBook(_symbol: string, _params?: OrderBookParams): Promise<OrderBook>;
    _fetchTrades(_symbol: string, _params?: TradeParams): Promise<Trade[]>;
    _fetchFundingRate(symbol: string): Promise<FundingRate>;
    fetchFundingRateHistory(_symbol: string, _since?: number, _limit?: number): Promise<FundingRate[]>;
    fetchOHLCV(_symbol: string, _timeframe: OHLCVTimeframe, _params?: OHLCVParams): Promise<OHLCV[]>;
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(orderId: string, symbol?: string): Promise<Order>;
    cancelAllOrders(_symbol?: string): Promise<Order[]>;
    fetchOpenOrders(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
    fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
    fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<Trade[]>;
    fetchPositions(symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    _setLeverage(_symbol: string, _leverage: number): Promise<void>;
}
//# sourceMappingURL=AvantisAdapter.d.ts.map
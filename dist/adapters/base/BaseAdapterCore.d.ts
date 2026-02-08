/**
 * Base Adapter Core
 *
 * Abstract base class providing core functionality for all adapters.
 * Contains state management, abstract method declarations, and essential properties.
 */
import type { Balance, Currency, ExchangeConfig, ExchangeStatus, FeatureMap, FundingPayment, FundingRate, IAuthStrategy, LedgerEntry, Market, MarketParams, OHLCV, OHLCVParams, OHLCVTimeframe, Order, OrderBook, OrderBookParams, OrderRequest, Portfolio, Position, RateLimitStatus, Ticker, Trade, TradeParams, Transaction, UserFees } from '../../types/index.js';
import type { APIMetrics } from '../../types/metrics.js';
import { CircuitBreaker } from '../../core/CircuitBreaker.js';
import type { HTTPClient } from '../../core/http/HTTPClient.js';
import { PrometheusMetrics } from '../../monitoring/prometheus.js';
import type { RateLimiter } from '../../core/RateLimiter.js';
/**
 * Base Adapter Core
 *
 * Abstract class that forms the foundation for all exchange adapters.
 * Mixins are applied on top of this class to add specific capabilities.
 */
export declare abstract class BaseAdapterCore {
    abstract readonly id: string;
    abstract readonly name: string;
    abstract readonly has: Partial<FeatureMap>;
    protected _isReady: boolean;
    protected _isDisconnected: boolean;
    protected readonly config: ExchangeConfig;
    protected authStrategy?: IAuthStrategy;
    protected rateLimiter?: RateLimiter;
    protected circuitBreaker: CircuitBreaker;
    protected httpClient?: HTTPClient;
    protected prometheusMetrics?: PrometheusMetrics;
    protected timers: Set<NodeJS.Timeout>;
    protected intervals: Set<NodeJS.Timeout>;
    protected abortControllers: Set<AbortController>;
    protected metrics: APIMetrics;
    constructor(config?: ExchangeConfig);
    get isReady(): boolean;
    /**
     * Check if adapter has been disconnected
     */
    isDisconnected(): boolean;
    abstract initialize(): Promise<void>;
    abstract fetchMarkets(params?: MarketParams): Promise<Market[]>;
    abstract fetchTicker(symbol: string): Promise<Ticker>;
    abstract fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    abstract fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    abstract fetchFundingRate(symbol: string): Promise<FundingRate>;
    abstract fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;
    abstract createOrder(request: OrderRequest): Promise<Order>;
    abstract cancelOrder(_orderId: string, _symbol?: string): Promise<Order>;
    abstract cancelAllOrders(_symbol?: string): Promise<Order[]>;
    abstract fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
    abstract fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<Trade[]>;
    abstract fetchPositions(symbols?: string[]): Promise<Position[]>;
    abstract fetchBalance(): Promise<Balance[]>;
    abstract setLeverage(symbol: string, leverage: number): Promise<void>;
    protected abstract symbolToExchange(symbol: string): string;
    protected abstract symbolFromExchange(exchangeSymbol: string): string;
    /**
     * Fetch OHLCV (candlestick) data
     * Default implementation throws if not supported by exchange
     */
    fetchOHLCV(_symbol: string, _timeframe: OHLCVTimeframe, _params?: OHLCVParams): Promise<OHLCV[]>;
    /**
     * Fetch multiple tickers at once
     * Default implementation fetches tickers sequentially
     */
    fetchTickers(symbols?: string[]): Promise<Record<string, Ticker>>;
    /**
     * Fetch available currencies
     * Default implementation throws if not supported
     */
    fetchCurrencies(): Promise<Record<string, Currency>>;
    /**
     * Fetch exchange status
     * Default implementation returns 'ok' if fetchMarkets succeeds
     */
    fetchStatus(): Promise<ExchangeStatus>;
    /**
     * Fetch exchange server time
     * Default implementation throws if not supported
     */
    fetchTime(): Promise<number>;
    /**
     * Fetch deposit history
     * Default implementation throws if not supported by exchange
     */
    fetchDeposits(_currency?: string, _since?: number, _limit?: number): Promise<Transaction[]>;
    /**
     * Fetch withdrawal history
     * Default implementation throws if not supported by exchange
     */
    fetchWithdrawals(_currency?: string, _since?: number, _limit?: number): Promise<Transaction[]>;
    /**
     * Fetch account ledger (transaction history)
     * Default implementation throws if not supported by exchange
     */
    fetchLedger(_currency?: string, _since?: number, _limit?: number, _params?: Record<string, unknown>): Promise<LedgerEntry[]>;
    /**
     * Fetch funding payment history
     * Default implementation throws if not supported by exchange
     */
    fetchFundingHistory(_symbol?: string, _since?: number, _limit?: number): Promise<FundingPayment[]>;
    /**
     * Set margin mode
     * Default implementation throws if not supported
     */
    setMarginMode(_symbol: string, _marginMode: 'cross' | 'isolated'): Promise<void>;
    watchOrderBook(_symbol: string, _limit?: number): AsyncGenerator<OrderBook>;
    watchTrades(_symbol: string): AsyncGenerator<Trade>;
    watchTicker(_symbol: string): AsyncGenerator<Ticker>;
    watchTickers(_symbols?: string[]): AsyncGenerator<Ticker>;
    watchPositions(): AsyncGenerator<Position[]>;
    watchOrders(): AsyncGenerator<Order[]>;
    watchBalance(): AsyncGenerator<Balance[]>;
    watchFundingRate(_symbol: string): AsyncGenerator<FundingRate>;
    watchOHLCV(_symbol: string, _timeframe: OHLCVTimeframe): AsyncGenerator<OHLCV>;
    watchMyTrades(_symbol?: string): AsyncGenerator<Trade>;
    /**
     * Fetch user fee rates
     * Default implementation throws if not supported by exchange
     */
    fetchUserFees(): Promise<UserFees>;
    /**
     * Fetch portfolio performance metrics
     * Default implementation throws if not supported by exchange
     */
    fetchPortfolio(): Promise<Portfolio>;
    /**
     * Fetch current rate limit status
     * Default implementation throws if not supported by exchange
     */
    fetchRateLimitStatus(): Promise<RateLimitStatus>;
}
//# sourceMappingURL=BaseAdapterCore.d.ts.map
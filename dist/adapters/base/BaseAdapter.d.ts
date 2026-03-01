/**
 * Base Exchange Adapter
 *
 * Abstract base class providing API surface methods for all adapters.
 * Extends BaseAdapterCore to inherit infrastructure functionality.
 */
import type { Balance, Currency, ExchangeStatus, FundingPayment, FundingRate, LedgerEntry, Market, OHLCV, OHLCVParams, OHLCVTimeframe, Order, OrderBook, OrderRequest, OrderSide, OrderType, Portfolio, Position, RateLimitStatus, Ticker, Trade, Transaction, UserFees } from '../../types/index.js';
import { BaseAdapterCore } from './BaseAdapterCore.js';
export declare abstract class BaseAdapter extends BaseAdapterCore {
    abstract fetchMarkets(params?: any): Promise<any>;
    abstract fetchTicker(symbol: string): Promise<any>;
    abstract fetchOrderBook(symbol: string, params?: any): Promise<any>;
    abstract fetchTrades(symbol: string, params?: any): Promise<any>;
    abstract fetchFundingRate(symbol: string): Promise<any>;
    abstract fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<any>;
    abstract createOrder(request: OrderRequest): Promise<Order>;
    abstract cancelOrder(_orderId: string, _symbol?: string): Promise<Order>;
    abstract cancelAllOrders(_symbol?: string): Promise<Order[]>;
    abstract fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
    abstract fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<any>;
    abstract fetchPositions(symbols?: string[]): Promise<Position[]>;
    abstract fetchBalance(): Promise<Balance[]>;
    abstract setLeverage(symbol: string, leverage: number): Promise<void>;
    fetchOHLCV(_symbol: string, _timeframe: OHLCVTimeframe, _params?: OHLCVParams): Promise<OHLCV[]>;
    fetchTickers(symbols?: string[]): Promise<Record<string, Ticker>>;
    fetchCurrencies(): Promise<Record<string, Currency>>;
    fetchStatus(): Promise<ExchangeStatus>;
    fetchTime(): Promise<number>;
    fetchDeposits(_currency?: string, _since?: number, _limit?: number): Promise<Transaction[]>;
    fetchWithdrawals(_currency?: string, _since?: number, _limit?: number): Promise<Transaction[]>;
    fetchLedger(_currency?: string, _since?: number, _limit?: number, _params?: Record<string, unknown>): Promise<LedgerEntry[]>;
    fetchFundingHistory(_symbol?: string, _since?: number, _limit?: number): Promise<FundingPayment[]>;
    createBatchOrders(requests: OrderRequest[]): Promise<Order[]>;
    cancelBatchOrders(orderIds: string[], symbol?: string): Promise<Order[]>;
    editOrder(_orderId: string, _symbol: string, _type: OrderType, _side: OrderSide, _amount?: number, _price?: number, _params?: Record<string, unknown>): Promise<Order>;
    fetchOrder(_orderId: string, _symbol?: string): Promise<Order>;
    fetchOpenOrders(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
    fetchClosedOrders(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
    createLimitBuyOrder(symbol: string, amount: number, price: number, params?: Record<string, unknown>): Promise<Order>;
    createLimitSellOrder(symbol: string, amount: number, price: number, params?: Record<string, unknown>): Promise<Order>;
    createMarketBuyOrder(symbol: string, amount: number, params?: Record<string, unknown>): Promise<Order>;
    createMarketSellOrder(symbol: string, amount: number, params?: Record<string, unknown>): Promise<Order>;
    createStopLossOrder(symbol: string, amount: number, stopPrice: number, params?: Record<string, unknown>): Promise<Order>;
    createTakeProfitOrder(symbol: string, amount: number, takeProfitPrice: number, params?: Record<string, unknown>): Promise<Order>;
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
    fetchUserFees(): Promise<UserFees>;
    fetchPortfolio(): Promise<Portfolio>;
    fetchRateLimitStatus(): Promise<RateLimitStatus>;
    fetch_markets: (params?: any) => Promise<any>;
    fetch_ticker: (symbol: string) => Promise<any>;
    fetch_order_book: (symbol: string, params?: any) => Promise<any>;
    fetch_trades: (symbol: string, params?: any) => Promise<any>;
    fetch_funding_rate: (symbol: string) => Promise<any>;
    fetch_funding_rate_history: (symbol: string, since?: number, limit?: number) => Promise<any>;
    fetch_ohlcv: (_symbol: string, _timeframe: OHLCVTimeframe, _params?: OHLCVParams) => Promise<OHLCV[]>;
    create_order: (request: OrderRequest) => Promise<Order>;
    cancel_order: (_orderId: string, _symbol?: string) => Promise<Order>;
    cancel_all_orders: (_symbol?: string) => Promise<Order[]>;
    create_batch_orders: (requests: OrderRequest[]) => Promise<Order[]>;
    cancel_batch_orders: (orderIds: string[], symbol?: string) => Promise<Order[]>;
    fetch_positions: (symbols?: string[]) => Promise<Position[]>;
    fetch_balance: () => Promise<Balance[]>;
    set_leverage: (symbol: string, leverage: number) => Promise<void>;
    set_margin_mode: (_symbol: string, _marginMode: "cross" | "isolated") => Promise<void>;
    fetch_open_orders: (_symbol?: string, _since?: number, _limit?: number) => Promise<Order[]>;
    health_check: (config?: import("../../types/health.js").HealthCheckConfig) => Promise<import("../../types/health.js").HealthCheckResult>;
    get_metrics: () => import("../../types/metrics.js").MetricsSnapshot;
    reset_metrics: () => void;
    preload_markets: (options?: {
        ttl?: number;
        params?: import("../../types/common.js").MarketParams;
    }) => Promise<void>;
    get_preloaded_markets: () => Market[] | null;
    clear_cache: () => void;
    fetch_deposits: (_currency?: string, _since?: number, _limit?: number) => Promise<Transaction[]>;
    fetch_withdrawals: (_currency?: string, _since?: number, _limit?: number) => Promise<Transaction[]>;
    get fetch_order_history(): (_symbol?: string, _since?: number, _limit?: number) => Promise<Order[]>;
    get fetch_my_trades(): (_symbol?: string, _since?: number, _limit?: number) => Promise<any>;
}
//# sourceMappingURL=BaseAdapter.d.ts.map
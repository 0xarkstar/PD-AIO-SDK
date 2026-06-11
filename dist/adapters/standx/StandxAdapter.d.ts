/**
 * StandX Exchange Adapter — PUBLIC MARKET DATA FIRST
 *
 * Implements IExchangeAdapter for StandX perps (https://perps.standx.com),
 * recon-verified live 2026-06-11. Every market-data surface is KEYLESS.
 *
 * SCOPE: public market data ONLY. All trading/auth/account methods
 * (createOrder, cancelOrder, cancelAllOrders, fetchPositions, fetchBalance,
 * setLeverage, editOrder, setMarginMode, fetchOpenOrders, fetchOrderHistory,
 * fetchMyTrades, watchOrders/Positions/Balance) are NOT_IMPLEMENTED throwers
 * with `has` = false — the flags are TRUTHFUL by contract. StandX private
 * surface requires JWT wallet-signature auth (EVM/BSC or Solana) plus
 * x-request-* body signing — a deliberate later phase.
 *
 * Venue footguns handled here:
 * - REST responses are BARE payloads (no envelope); errors are JSON
 *   {code,message} with real HTTP statuses (401/429/…). Malformed queries can
 *   return plain-text 400 bodies.
 * - Symbol discovery comes from query_market_overview (live has 10 symbols;
 *   the docs reference page is STALE at 4 — never hardcode from docs),
 *   joined with query_symbol_info (keyless no-param form returns ALL).
 * - query_depth_book has NO limit param and level ordering is NOT guaranteed
 *   — `limit` is sliced client-side AFTER the normalizer sorts.
 * - query_funding_rates REQUIRES start_time AND end_time (ms) — both are
 *   always sent (omitting either is a 400).
 * - kline/history is TradingView-UDF: from/to are SECONDS, columns not rows.
 * - /api/health requires JWT — NEVER used as a keyless ping (kline/time is).
 * - Rate limit: credit bucket ⇒ ~22 req/s sustained, 20-request burst.
 */
import type { Balance, FundingRate, Market, MarketParams, OHLCV, OHLCVParams, OHLCVTimeframe, Order, OrderBook, OrderBookParams, OrderRequest, Position, Ticker, Trade, TradeParams } from '../../types/common.js';
import type { FeatureMap, IExchangeAdapter } from '../../types/adapter.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import type { StandxConfig } from './types.js';
export declare class StandxAdapter extends BaseAdapter implements IExchangeAdapter {
    readonly id = "standx";
    readonly name = "StandX";
    /**
     * TRUTHFUL feature map. true = implemented against the live API and
     * fixture-tested; false = NOT_IMPLEMENTED thrower (public-data-first scope).
     */
    readonly has: Partial<FeatureMap>;
    private readonly baseUrl;
    private readonly wsUrl;
    protected readonly httpClient: HTTPClient;
    protected rateLimiter: RateLimiter;
    private normalizer;
    private wsHandler?;
    constructor(config?: StandxConfig);
    /**
     * Prepares the WS wrapper WITHOUT opening a connection — the socket is
     * opened lazily on the first watch* call (public REST needs no socket).
     */
    initialize(): Promise<void>;
    disconnect(): Promise<void>;
    protected symbolToExchange(symbol: string): string;
    protected symbolFromExchange(exchangeSymbol: string): string;
    /** Bare-payload GET (no envelope). Defensively maps {code,message} bodies. */
    private publicGet;
    private handleError;
    /**
     * Markets = query_market_overview (symbol DISCOVERY — live 10 symbols,
     * docs stale at 4) joined with query_symbol_info (no-param form returns
     * ALL symbols' fees/ticks/leverage; keyless, live-verified). Cached.
     */
    fetchMarkets(_params?: MarketParams): Promise<Market[]>;
    /** query_symbol_market — full market snapshot (real bid1/ask1) */
    _fetchTicker(symbol: string): Promise<Ticker>;
    /**
     * query_depth_book — NO venue limit param; level ordering NOT guaranteed.
     * The normalizer sorts; `limit` is sliced client-side afterwards.
     */
    _fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    /** query_recent_trades — venue has no limit param; sliced client-side */
    _fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    /** Current funding via query_symbol_market (rate + ISO next_funding_time) */
    _fetchFundingRate(symbol: string): Promise<FundingRate>;
    /**
     * query_funding_rates — start_time AND end_time (ms) are REQUIRED by the
     * venue (omitting either is a 400), so both are always sent. The venue
     * returns the window ascending; since/limit are applied client-side.
     */
    fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;
    /** kline/history — TradingView-UDF; from/to are SECONDS; columns→rows */
    fetchOHLCV(symbol: string, timeframe: OHLCVTimeframe, params?: OHLCVParams): Promise<OHLCV[]>;
    private ensureWebSocketConnected;
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    createOrder(_request: OrderRequest): Promise<Order>;
    cancelOrder(_orderId: string, _symbol?: string): Promise<Order>;
    cancelAllOrders(_symbol?: string): Promise<Order[]>;
    fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
    fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<Trade[]>;
    fetchPositions(_symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    protected _setLeverage(_symbol: string, _leverage: number): Promise<void>;
}
//# sourceMappingURL=StandxAdapter.d.ts.map
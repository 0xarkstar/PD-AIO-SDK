/**
 * ApeX Omni Exchange Adapter — PUBLIC MARKET DATA FIRST
 *
 * Implements IExchangeAdapter for ApeX Omni (https://omni.apex.exchange/api/v3),
 * recon-verified live 2026-06-11.
 *
 * SCOPE: public market data ONLY. All trading/auth/account methods
 * (createOrder, cancelOrder, cancelAllOrders, fetchPositions, fetchBalance,
 * setLeverage, editOrder, setMarginMode, fetchOpenOrders, fetchOrderHistory,
 * fetchMyTrades, watchOrders/Positions/Balance) are NOT_IMPLEMENTED throwers
 * with `has` = false — the flags are TRUTHFUL by contract; flip them only
 * when the methods are actually implemented and live-verified.
 *
 * Venue footguns handled here:
 * - Symbol formats are STRICT and PER-ENDPOINT: NO-DASH "BTCUSDT" for
 *   /depth /trades /ticker /klines + ALL WS topics; DASH "BTC-USDT" for
 *   /history-funding (+ /symbols `symbol` field). /depth with a dash returns
 *   HTTP 200 {a:null,b:null,...} (silent empty — schema hard-rejects).
 * - Envelope: success {data,timeCost} / error {code,msg,timeCost} (HTTP 200).
 * - Funding settles HOURLY; rates are FRACTIONAL per-interval (passthrough).
 * - Klines are keyed BY SYMBOL; start/end query params are SECONDS.
 * - Rate limit 600 req/60s/IP; HTTP 403 = IP BAN. The heavy 731KB /symbols
 *   payload is cached (marketCacheTTL).
 * - No dedicated open-interest endpoint → fetchOpenInterest is NOT claimed
 *   (ticker.openInterest base units is the only public OI source, in info).
 */
import type { Balance, FundingRate, Market, MarketParams, OHLCV, OHLCVParams, OHLCVTimeframe, Order, OrderBook, OrderBookParams, OrderRequest, Position, Ticker, Trade, TradeParams } from '../../types/common.js';
import type { FeatureMap, IExchangeAdapter } from '../../types/adapter.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import type { ApexConfig } from './types.js';
export declare class ApexAdapter extends BaseAdapter implements IExchangeAdapter {
    readonly id = "apex";
    readonly name = "ApeX Omni";
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
    constructor(config?: ApexConfig);
    /**
     * Prepares the WS wrapper WITHOUT opening a connection — the socket is
     * opened lazily on the first watch* call (public REST needs no socket).
     */
    initialize(): Promise<void>;
    disconnect(): Promise<void>;
    /** Primary exchange form = NO-DASH (depth/trades/ticker/klines/WS topics) */
    protected symbolToExchange(symbol: string): string;
    protected symbolFromExchange(exchangeSymbol: string): string;
    private publicGet;
    /** Success {data,timeCost} / error {code,msg,timeCost} — both HTTP 200 */
    private unwrapEnvelope;
    private handleError;
    /**
     * /v3/symbols → data.contractConfig.perpetualContract[] (the payload also
     * carries spot/prediction/stock/prelaunch configs — perps only here),
     * filtered by enableTrade && !isPrelaunch. The 731KB payload is cached.
     */
    fetchMarkets(_params?: MarketParams): Promise<Market[]>;
    /** /v3/ticker?symbol=<NO-DASH> — data is an ARRAY of one object */
    _fetchTicker(symbol: string): Promise<Ticker>;
    /** /v3/depth?symbol=<NO-DASH>&limit=N — null-book shape hard-rejected */
    _fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    /** /v3/trades?symbol=<NO-DASH>&limit=N */
    _fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    /** Current funding via /v3/ticker (fundingRate + ISO nextFundingTime) */
    _fetchFundingRate(symbol: string): Promise<FundingRate>;
    /**
     * /v3/history-funding?symbol=<DASH>&limit=N — the DASH form is REQUIRED
     * (no-dash errors {code:3}). The venue API has no start param — `since`
     * is filtered client-side.
     */
    fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;
    /** /v3/klines?symbol=<NO-DASH>&interval=<code> — start/end are SECONDS */
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
//# sourceMappingURL=ApexAdapter.d.ts.map
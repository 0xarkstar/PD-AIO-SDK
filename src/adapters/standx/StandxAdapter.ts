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

import type {
  Balance,
  FundingRate,
  Market,
  MarketParams,
  OHLCV,
  OHLCVParams,
  OHLCVTimeframe,
  Order,
  OrderBook,
  OrderBookParams,
  OrderRequest,
  Position,
  Ticker,
  Trade,
  TradeParams,
} from '../../types/common.js';
import type { FeatureMap, IExchangeAdapter } from '../../types/adapter.js';
import { PerpDEXError } from '../../types/errors.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import {
  STANDX_API_URLS,
  STANDX_KLINE_RESOLUTIONS,
  STANDX_RATE_LIMITS,
  STANDX_TIMEFRAME_SECONDS,
} from './constants.js';
import { StandxNormalizer } from './StandxNormalizer.js';
import { StandxWebSocketWrapper } from './StandxWebSocketWrapper.js';
import { mapStandxError } from './error-codes.js';
import { toStandxSymbol, toUnifiedSymbol } from './utils.js';
import type {
  StandxConfig,
  StandxDepthBook,
  StandxFundingEntry,
  StandxKlineHistory,
  StandxMarketOverview,
  StandxRestTrade,
  StandxSymbolInfo,
  StandxSymbolMarket,
} from './types.js';

const NOT_IMPLEMENTED_SUFFIX =
  'not implemented — standx adapter is PUBLIC-MARKET-DATA-FIRST (has-flag is false)';

/** Default funding-history window when neither since nor limit narrows it */
const DEFAULT_FUNDING_WINDOW_MS = 24 * 3_600_000;

/** Default kline count when no limit/since given */
const DEFAULT_OHLCV_LIMIT = 200;

export class StandxAdapter extends BaseAdapter implements IExchangeAdapter {
  readonly id = 'standx';
  readonly name = 'StandX';

  /**
   * TRUTHFUL feature map. true = implemented against the live API and
   * fixture-tested; false = NOT_IMPLEMENTED thrower (public-data-first scope).
   */
  readonly has: Partial<FeatureMap> = {
    // Public market data — implemented + fixture-tested
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchOHLCV: true,
    fetchFundingRate: true,
    fetchFundingRateHistory: true,
    watchOrderBook: true,
    watchTrades: true,
    watchTicker: true,

    // Trading/auth/account — OUT OF SCOPE (NOT_IMPLEMENTED throwers)
    createOrder: false,
    cancelOrder: false,
    cancelAllOrders: false,
    editOrder: false,
    setMarginMode: false,
    fetchPositions: false,
    fetchBalance: false,
    setLeverage: false,
    fetchOpenOrders: false,
    fetchOrderHistory: false,
    fetchMyTrades: false,
    watchOrders: false,
    watchPositions: false,
    watchBalance: false,
  };

  private readonly baseUrl: string;
  private readonly wsUrl: string;
  protected readonly httpClient: HTTPClient;
  protected rateLimiter: RateLimiter;
  private normalizer: StandxNormalizer;
  private wsHandler?: StandxWebSocketWrapper;

  constructor(config: StandxConfig = {}) {
    super(config);

    // No testnet is documented for StandX perps — mainnet only
    this.baseUrl = config.apiUrl ?? STANDX_API_URLS.mainnet.rest;
    this.wsUrl = config.wsUrl ?? STANDX_API_URLS.mainnet.websocket;

    this.normalizer = new StandxNormalizer();

    this.rateLimiter = new RateLimiter({
      maxTokens: config.rateLimit?.maxRequests ?? STANDX_RATE_LIMITS.rest.maxRequests,
      windowMs: config.rateLimit?.windowMs ?? STANDX_RATE_LIMITS.rest.windowMs,
      refillRate: config.rateLimit?.maxRequests ?? STANDX_RATE_LIMITS.rest.maxRequests,
    });

    this.httpClient = new HTTPClient({
      baseUrl: this.baseUrl,
      timeout: config.timeout ?? 30000,
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        multiplier: 2,
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        resetTimeout: 60000,
      },
      exchange: this.id,
    });
  }

  /**
   * Prepares the WS wrapper WITHOUT opening a connection — the socket is
   * opened lazily on the first watch* call (public REST needs no socket).
   */
  async initialize(): Promise<void> {
    this.wsHandler = new StandxWebSocketWrapper({
      wsUrl: this.wsUrl,
      normalizer: this.normalizer,
      symbolToExchange: this.symbolToExchange.bind(this),
    });
    this._isReady = true;
  }

  async disconnect(): Promise<void> {
    if (this.wsHandler) {
      await this.wsHandler.disconnect();
    }
    this._isReady = false;
  }

  // === Symbol conversion (required by BaseAdapter) ===

  protected symbolToExchange(symbol: string): string {
    return toStandxSymbol(symbol);
  }

  protected symbolFromExchange(exchangeSymbol: string): string {
    return toUnifiedSymbol(exchangeSymbol);
  }

  // === HTTP helpers ===

  /** Bare-payload GET (no envelope). Defensively maps {code,message} bodies. */
  private async publicGet<T>(path: string, feature: string): Promise<T> {
    await this.rateLimiter.acquire(feature);

    let response: unknown;
    try {
      response = await this.httpClient.get<unknown>(path);
    } catch (error: unknown) {
      throw this.handleError(error);
    }

    if (response && typeof response === 'object' && !Array.isArray(response)) {
      const rec = response as Record<string, unknown>;
      if (typeof rec.code === 'number' && typeof rec.message === 'string') {
        throw mapStandxError(rec.code, rec.message);
      }
    }
    return response as T;
  }

  private handleError(error: unknown): PerpDEXError {
    if (error instanceof PerpDEXError) return error;

    if (error instanceof Error) {
      const match = error.message.match(/"code"\s*:\s*(\d+)/);
      if (match?.[1]) {
        return mapStandxError(parseInt(match[1], 10), error.message);
      }
    }

    return new PerpDEXError(
      error instanceof Error ? error.message : 'Unknown error',
      'UNKNOWN',
      'standx'
    );
  }

  // === Public Market Data ===

  /**
   * Markets = query_market_overview (symbol DISCOVERY — live 10 symbols,
   * docs stale at 4) joined with query_symbol_info (no-param form returns
   * ALL symbols' fees/ticks/leverage; keyless, live-verified). Cached.
   */
  async fetchMarkets(_params?: MarketParams): Promise<Market[]> {
    if (this.marketCache && Date.now() < this.marketCacheExpiry) {
      return this.marketCache;
    }

    const [overview, infos] = await Promise.all([
      this.publicGet<StandxMarketOverview>('/api/query_market_overview', 'fetchMarkets'),
      this.publicGet<StandxSymbolInfo[]>('/api/query_symbol_info', 'fetchMarkets'),
    ]);

    if (!Array.isArray(overview?.symbols) || !Array.isArray(infos)) {
      throw new PerpDEXError('Invalid markets response', 'INVALID_RESPONSE', 'standx');
    }

    const infoBySymbol = new Map(infos.map((i) => [i.symbol, i]));
    const markets = overview.symbols
      .map((s) => infoBySymbol.get(s.symbol))
      .filter((info): info is StandxSymbolInfo => info !== undefined)
      .map((info) => this.normalizer.normalizeMarket(info));

    this.marketCache = markets;
    this.marketCacheExpiry = Date.now() + this.marketCacheTTL;
    return markets;
  }

  /** query_symbol_market — full market snapshot (real bid1/ask1) */
  async _fetchTicker(symbol: string): Promise<Ticker> {
    const venueSymbol = toStandxSymbol(symbol);
    const data = await this.publicGet<StandxSymbolMarket>(
      `/api/query_symbol_market?symbol=${venueSymbol}`,
      'fetchTicker'
    );
    return this.normalizer.normalizeTicker(data, symbol);
  }

  /**
   * query_depth_book — NO venue limit param; level ordering NOT guaranteed.
   * The normalizer sorts; `limit` is sliced client-side afterwards.
   */
  async _fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    const venueSymbol = toStandxSymbol(symbol);
    const data = await this.publicGet<StandxDepthBook>(
      `/api/query_depth_book?symbol=${venueSymbol}`,
      'fetchOrderBook'
    );
    const book = this.normalizer.normalizeOrderBook(data, symbol);

    if (params?.limit !== undefined) {
      return {
        ...book,
        bids: book.bids.slice(0, params.limit),
        asks: book.asks.slice(0, params.limit),
      };
    }
    return book;
  }

  /** query_recent_trades — venue has no limit param; sliced client-side */
  async _fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    const venueSymbol = toStandxSymbol(symbol);
    const data = await this.publicGet<StandxRestTrade[]>(
      `/api/query_recent_trades?symbol=${venueSymbol}`,
      'fetchTrades'
    );

    if (!Array.isArray(data)) {
      throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'standx');
    }

    const trades = data.map((t) => this.normalizer.normalizeRestTrade(t, symbol));
    return params?.limit !== undefined ? trades.slice(0, params.limit) : trades;
  }

  /** Current funding via query_symbol_market (rate + ISO next_funding_time) */
  async _fetchFundingRate(symbol: string): Promise<FundingRate> {
    const venueSymbol = toStandxSymbol(symbol);
    const data = await this.publicGet<StandxSymbolMarket>(
      `/api/query_symbol_market?symbol=${venueSymbol}`,
      'fetchFundingRate'
    );
    return this.normalizer.normalizeFundingRate(data, symbol);
  }

  /**
   * query_funding_rates — start_time AND end_time (ms) are REQUIRED by the
   * venue (omitting either is a 400), so both are always sent. The venue
   * returns the window ascending; since/limit are applied client-side.
   */
  async fetchFundingRateHistory(
    symbol: string,
    since?: number,
    limit?: number
  ): Promise<FundingRate[]> {
    const venueSymbol = toStandxSymbol(symbol);
    const endTime = Date.now();
    const startTime =
      since ?? endTime - (limit !== undefined ? limit * 3_600_000 : DEFAULT_FUNDING_WINDOW_MS);

    const data = await this.publicGet<StandxFundingEntry[]>(
      `/api/query_funding_rates?symbol=${venueSymbol}&start_time=${startTime}&end_time=${endTime}`,
      'fetchFundingRateHistory'
    );

    if (!Array.isArray(data)) {
      throw new PerpDEXError('Invalid funding rates response', 'INVALID_RESPONSE', 'standx');
    }

    const history = data
      .map((entry) => this.normalizer.normalizeFundingRateHistoryEntry(entry, symbol))
      .filter((f) => since === undefined || f.fundingTimestamp >= since);

    return limit !== undefined ? history.slice(0, limit) : history;
  }

  /** kline/history — TradingView-UDF; from/to are SECONDS; columns→rows */
  async fetchOHLCV(
    symbol: string,
    timeframe: OHLCVTimeframe,
    params?: OHLCVParams
  ): Promise<OHLCV[]> {
    const venueSymbol = toStandxSymbol(symbol);
    const resolution = STANDX_KLINE_RESOLUTIONS[timeframe];
    const tfSeconds = STANDX_TIMEFRAME_SECONDS[timeframe];
    if (!resolution || !tfSeconds) {
      throw new PerpDEXError(
        `Unsupported timeframe for standx: ${timeframe} (venue supports ${Object.keys(STANDX_KLINE_RESOLUTIONS).join(', ')})`,
        'INVALID_PARAM',
        'standx'
      );
    }

    const limit = params?.limit ?? DEFAULT_OHLCV_LIMIT;
    const to = Math.floor((params?.until ?? Date.now()) / 1000);
    const from = params?.since !== undefined ? Math.floor(params.since / 1000) : to - limit * tfSeconds;

    const data = await this.publicGet<StandxKlineHistory>(
      `/api/kline/history?symbol=${venueSymbol}&resolution=${resolution}&from=${from}&to=${to}`,
      'fetchOHLCV'
    );
    const ohlcv = this.normalizer.normalizeOHLCV(data);
    return params?.limit !== undefined ? ohlcv.slice(-params.limit) : ohlcv;
  }

  // === WebSocket Streams (lazy connect — opened on first watch*) ===

  private async ensureWebSocketConnected(): Promise<StandxWebSocketWrapper> {
    this.ensureInitialized();
    if (!this.wsHandler) {
      throw new PerpDEXError('WebSocket handler not initialized', 'NO_WEBSOCKET', 'standx');
    }
    await this.wsHandler.connect();
    return this.wsHandler;
  }

  async *watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook> {
    const ws = await this.ensureWebSocketConnected();
    yield* ws.watchOrderBook(symbol, limit);
  }

  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    const ws = await this.ensureWebSocketConnected();
    yield* ws.watchTrades(symbol);
  }

  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    const ws = await this.ensureWebSocketConnected();
    yield* ws.watchTicker(symbol);
  }

  // ===========================================================================
  // NOT IMPLEMENTED — PUBLIC-MARKET-DATA-FIRST scope (has-flags are false).
  // BaseAdapter requires these abstract members; they throw rather than lie.
  // StandX trading needs JWT wallet-signature auth + body signing (later phase).
  // ===========================================================================

  async createOrder(_request: OrderRequest): Promise<Order> {
    throw new PerpDEXError(`createOrder ${NOT_IMPLEMENTED_SUFFIX}`, 'NOT_IMPLEMENTED', 'standx');
  }

  async cancelOrder(_orderId: string, _symbol?: string): Promise<Order> {
    throw new PerpDEXError(`cancelOrder ${NOT_IMPLEMENTED_SUFFIX}`, 'NOT_IMPLEMENTED', 'standx');
  }

  async cancelAllOrders(_symbol?: string): Promise<Order[]> {
    throw new PerpDEXError(
      `cancelAllOrders ${NOT_IMPLEMENTED_SUFFIX}`,
      'NOT_IMPLEMENTED',
      'standx'
    );
  }

  async fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]> {
    throw new PerpDEXError(
      `fetchOrderHistory ${NOT_IMPLEMENTED_SUFFIX}`,
      'NOT_IMPLEMENTED',
      'standx'
    );
  }

  async fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<Trade[]> {
    throw new PerpDEXError(`fetchMyTrades ${NOT_IMPLEMENTED_SUFFIX}`, 'NOT_IMPLEMENTED', 'standx');
  }

  async fetchPositions(_symbols?: string[]): Promise<Position[]> {
    throw new PerpDEXError(
      `fetchPositions ${NOT_IMPLEMENTED_SUFFIX}`,
      'NOT_IMPLEMENTED',
      'standx'
    );
  }

  async fetchBalance(): Promise<Balance[]> {
    throw new PerpDEXError(`fetchBalance ${NOT_IMPLEMENTED_SUFFIX}`, 'NOT_IMPLEMENTED', 'standx');
  }

  protected async _setLeverage(_symbol: string, _leverage: number): Promise<void> {
    throw new PerpDEXError(`setLeverage ${NOT_IMPLEMENTED_SUFFIX}`, 'NOT_IMPLEMENTED', 'standx');
  }
}

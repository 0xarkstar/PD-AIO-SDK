/**
 * GRVT Exchange Adapter.
 *
 * High-performance hybrid perp DEX (ZKsync hyperchain). This adapter talks to
 * the REAL GRVT API directly (cookie-session auth + POST `full/v1/*` + leg-based
 * EIP-712 order signing delegated to `signing.ts`). It builds + sends correctly
 * signed orders; it does NOT run any auto-execution/trading loop.
 *
 * Auth: `GRVTSDKWrapper.login()` exchanges the API key for a `gravity` session
 * cookie + `X-Grvt-Account-Id` + `sub_account_id`; that sub-account id and the
 * cached instrument meta (instrument_hash + base_decimals) feed `createOrder`.
 */

import { BaseAdapter } from '../base/BaseAdapter.js';
import type {
  Market,
  OHLCV,
  OHLCVParams,
  OHLCVTimeframe,
  Order,
  Position,
  Balance,
  OrderBook,
  Trade,
  Ticker,
  FundingRate,
  OrderRequest,
  MarketParams,
  OrderBookParams,
  TradeParams,
} from '../../types/common.js';
import type { FeatureMap, IExchangeAdapter } from '../../types/adapter.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { InvalidSignatureError, NotSupportedError, PerpDEXError } from '../../types/errors.js';

import { GRVTSDKWrapper } from './GRVTSDKWrapper.js';
import { GRVTAuth, type GRVTAuthConfig } from './GRVTAuth.js';
import { GRVTNormalizer } from './GRVTNormalizer.js';
import { mapAxiosError } from './GRVTErrorMapper.js';
import { GRVTWebSocketWrapper } from './GRVTWebSocketWrapper.js';

import {
  GRVT_RATE_LIMITS,
  GRVT_ENDPOINT_WEIGHTS,
  GRVT_UNIFIED_TIF_TO_API,
  GRVT_BOOK_DEPTHS,
} from './constants.js';
import type {
  GRVTMarket,
  GRVTTicker,
  GRVTOrderBook,
  GRVTTrade,
  GRVTFunding,
  GRVTOrder,
  GRVTPosition,
  GRVTSpotBalance,
  GRVTFill,
  GRVTCreateOrderBody,
} from './types.js';
import type { GrvtTimeInForce } from './signing.js';

/**
 * Cached instrument metadata needed to build a signed order.
 */
interface GRVTInstrumentMeta {
  instrumentHash: string;
  baseDecimals: number;
}

/**
 * GRVT adapter configuration.
 */
export interface GRVTConfig extends GRVTAuthConfig {
  testnet?: boolean;
  timeout?: number;
  debug?: boolean;
  /** Builder address for fee attribution (enables OrderWithBuilderFee signing). */
  builderCode?: string;
  /** Builder fee (human units) when a builder address is set. */
  builderFee?: string;
  /** Enable/disable builder code (default: true when builderCode is set). */
  builderCodeEnabled?: boolean;
}

/**
 * @deprecated Use GRVTConfig instead
 */
export type GRVTAdapterConfig = GRVTConfig;

/**
 * GRVT Exchange Adapter.
 */
export class GRVTAdapter extends BaseAdapter implements IExchangeAdapter {
  readonly id = 'grvt';
  readonly name = 'GRVT';

  readonly has: Partial<FeatureMap> = {
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchOHLCV: true,
    fetchFundingRate: true,
    fetchFundingRateHistory: false,
    fetchPositions: true,
    fetchBalance: true,
    fetchOrderHistory: true,
    fetchMyTrades: true,
    createOrder: true,
    createBatchOrders: true,
    cancelOrder: true,
    cancelAllOrders: true,
    watchOrderBook: true,
    watchTrades: true,
    watchTicker: true,
    watchPositions: true,
    watchOrders: true,
    watchBalance: true,
    watchMyTrades: true,
    cancelBatchOrders: false,
    editOrder: false,
    fetchOpenOrders: true,
    setLeverage: false,
    setMarginMode: false,
  };

  private readonly sdk: GRVTSDKWrapper;
  private readonly auth: GRVTAuth;
  private readonly normalizer: GRVTNormalizer;
  private ws?: GRVTWebSocketWrapper;
  protected readonly rateLimiter: RateLimiter;
  private readonly testnet: boolean;
  private readonly builderCode?: string;
  private readonly builderFee?: string;
  private readonly builderCodeEnabled: boolean;
  /** instrument -> { instrument_hash, base_decimals }, cached from fetchMarkets. */
  private instrumentMeta = new Map<string, GRVTInstrumentMeta>();

  constructor(config: GRVTAdapterConfig = {}) {
    super(config);

    this.testnet = config.testnet ?? false;

    this.auth = new GRVTAuth(config);
    this.normalizer = new GRVTNormalizer();
    this.sdk = new GRVTSDKWrapper({
      testnet: this.testnet,
      apiKey: config.apiKey,
      timeout: config.timeout,
    });

    this.rateLimiter = new RateLimiter({
      maxTokens: GRVT_RATE_LIMITS.rest.maxRequests,
      refillRate: GRVT_RATE_LIMITS.rest.maxRequests / (GRVT_RATE_LIMITS.rest.windowMs / 1000),
      windowMs: GRVT_RATE_LIMITS.rest.windowMs,
      weights: GRVT_ENDPOINT_WEIGHTS,
    });

    this.builderCode = config.builderCode;
    this.builderFee = config.builderFee;
    this.builderCodeEnabled = config.builderCodeEnabled ?? true;
  }

  async initialize(): Promise<void> {
    if (this.auth.hasCredentials()) {
      const isValid = await this.auth.verify();
      if (!isValid) {
        throw new InvalidSignatureError(
          'Failed to verify GRVT credentials',
          'INVALID_CREDENTIALS',
          'grvt'
        );
      }
      // Establish the cookie session (login) and share it with the auth strategy.
      const session = await this.sdk.login();
      this.auth.setSession(session);
    }

    this._isReady = true;
  }

  // ==================== Market Data ====================

  async fetchMarkets(params?: MarketParams): Promise<Market[]> {
    await this.rateLimiter.acquire('fetchMarkets');

    try {
      const result = (await this.sdk.getInstruments()) as GRVTMarket[] | null;
      if (!result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }

      // Cache instrument meta (hash + base_decimals) for order signing.
      for (const m of result) {
        if (m.instrument && m.instrument_hash) {
          this.instrumentMeta.set(m.instrument, {
            instrumentHash: m.instrument_hash,
            baseDecimals: m.base_decimals,
          });
        }
      }

      let markets = this.normalizer.normalizeMarkets(result);
      if (params?.active !== undefined) {
        markets = markets.filter((m) => m.active === params.active);
      }
      return markets;
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async _fetchTicker(symbol: string): Promise<Ticker> {
    await this.rateLimiter.acquire('fetchTicker');

    try {
      const grvtSymbol = this.normalizer.symbolFromCCXT(symbol);
      const result = (await this.sdk.getTicker(grvtSymbol)) as GRVTTicker | null;
      if (!result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }
      return this.normalizer.normalizeTicker(result);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async _fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    await this.rateLimiter.acquire('fetchOrderBook');

    try {
      const grvtSymbol = this.normalizer.symbolFromCCXT(symbol);
      const depth = this.resolveDepth(params?.limit);
      const result = (await this.sdk.getOrderBook(grvtSymbol, depth)) as GRVTOrderBook | null;
      if (!result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }
      return this.normalizer.normalizeOrderBook(result);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async _fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    await this.rateLimiter.acquire('fetchTrades');

    try {
      const grvtSymbol = this.normalizer.symbolFromCCXT(symbol);
      const result = (await this.sdk.getTrades(grvtSymbol, params?.limit ?? 100)) as GRVTTrade[] | null;
      if (!result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }
      return this.normalizer.normalizeTrades(result);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async fetchOHLCV(
    symbol: string,
    timeframe: OHLCVTimeframe = '1h',
    params?: OHLCVParams
  ): Promise<OHLCV[]> {
    await this.rateLimiter.acquire('fetchOHLCV');

    try {
      const grvtSymbol = this.normalizer.symbolFromCCXT(symbol);

      if (timeframe === '1M') {
        throw new NotSupportedError(
          'GRVT does not support monthly (1M) candlestick intervals',
          'UNSUPPORTED_TIMEFRAME',
          'grvt'
        );
      }

      const intervalMap: Record<string, string> = {
        '1m': 'CI_1_M',
        '3m': 'CI_3_M',
        '5m': 'CI_5_M',
        '15m': 'CI_15_M',
        '30m': 'CI_30_M',
        '1h': 'CI_1_H',
        '2h': 'CI_2_H',
        '4h': 'CI_4_H',
        '6h': 'CI_6_H',
        '8h': 'CI_8_H',
        '12h': 'CI_12_H',
        '1d': 'CI_1_D',
        '3d': 'CI_3_D',
        '1w': 'CI_1_W',
      };
      const interval = intervalMap[timeframe] || 'CI_1_H';

      const now = Date.now();
      const startTime = params?.since ?? now - this.getDefaultDuration(timeframe);
      const endTime = params?.until ?? now;
      const startTimeNs = (BigInt(startTime) * 1_000_000n).toString();
      const endTimeNs = (BigInt(endTime) * 1_000_000n).toString();

      const result = (await this.sdk.getKline({
        instrument: grvtSymbol,
        interval,
        type: 'TRADE',
        start_time: startTimeNs,
        end_time: endTimeNs,
        limit: params?.limit ?? 100,
      })) as Array<Record<string, string>> | null;

      if (!result || !Array.isArray(result)) {
        return [];
      }

      return result.map(
        (candle): OHLCV => [
          Number(BigInt(candle.open_time || '0') / 1_000_000n),
          parseFloat(candle.open || '0'),
          parseFloat(candle.high || '0'),
          parseFloat(candle.low || '0'),
          parseFloat(candle.close || '0'),
          parseFloat(candle.volume_b || candle.volume || '0'),
        ]
      );
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  private getDefaultDuration(timeframe: OHLCVTimeframe): number {
    const day = 24 * 60 * 60 * 1000;
    const durationMap: Record<OHLCVTimeframe, number> = {
      '1m': day,
      '3m': 3 * day,
      '5m': 5 * day,
      '15m': 7 * day,
      '30m': 14 * day,
      '1h': 30 * day,
      '2h': 60 * day,
      '4h': 90 * day,
      '6h': 120 * day,
      '8h': 180 * day,
      '12h': 365 * day,
      '1d': 365 * day,
      '3d': 2 * 365 * day,
      '1w': 3 * 365 * day,
      '1M': 5 * 365 * day,
    };
    return durationMap[timeframe] || 30 * day;
  }

  async _fetchFundingRate(symbol: string): Promise<FundingRate> {
    await this.rateLimiter.acquire('fetchFundingRate');

    try {
      const grvtSymbol = this.normalizer.symbolFromCCXT(symbol);
      const result = (await this.sdk.getFunding(grvtSymbol)) as GRVTFunding[] | GRVTFunding | null;
      if (!result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }
      const entry = Array.isArray(result) ? result[0] : result;
      if (!entry) {
        throw new PerpDEXError('No funding data available', 'NO_FUNDING_DATA', 'grvt');
      }
      return this.normalizer.normalizeFundingRate(entry);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  // ==================== Trading ====================

  async createOrder(request: OrderRequest): Promise<Order> {
    const validatedRequest = this.validateOrder(request);
    this.auth.requireAuth();
    await this.rateLimiter.acquire('createOrder');

    try {
      const grvtSymbol = this.normalizer.symbolFromCCXT(validatedRequest.symbol);
      const meta = await this.getInstrumentMeta(grvtSymbol);
      const subAccountId = this.requireSubAccountId();

      const isMarket = validatedRequest.type === 'market';
      const postOnly = validatedRequest.postOnly ?? false;
      const reduceOnly = validatedRequest.reduceOnly ?? false;
      const timeInForce = this.resolveSignTimeInForce(validatedRequest.timeInForce, isMarket, postOnly);

      // Build + sign the leg-based EIP-712 order (delegated to signing.ts).
      const builderCode = this.builderCodeEnabled
        ? (request.builderCode ?? this.builderCode)
        : undefined;

      const signature = await this.auth.signOrder({
        subAccountId,
        isMarket,
        timeInForce,
        postOnly,
        reduceOnly,
        legs: [
          {
            instrumentHash: meta.instrumentHash,
            baseDecimals: meta.baseDecimals,
            size: validatedRequest.amount.toString(),
            limitPrice: (validatedRequest.price ?? 0).toString(),
            isBuyingAsset: validatedRequest.side === 'buy',
          },
        ],
        builder: builderCode,
        builderFee: builderCode ? this.builderFee : undefined,
      });

      const body: GRVTCreateOrderBody = {
        sub_account_id: subAccountId,
        is_market: isMarket,
        time_in_force: GRVT_UNIFIED_TIF_TO_API[
          (validatedRequest.timeInForce ?? (postOnly ? 'PO' : 'GTC')) as keyof typeof GRVT_UNIFIED_TIF_TO_API
        ],
        post_only: postOnly,
        reduce_only: reduceOnly,
        legs: [
          {
            instrument: grvtSymbol,
            size: validatedRequest.amount.toString(),
            limit_price: (validatedRequest.price ?? 0).toString(),
            is_buying_asset: validatedRequest.side === 'buy',
          },
        ],
        signature: {
          r: signature.r,
          s: signature.s,
          v: signature.v,
          expiration: signature.expiration,
          nonce: signature.nonce,
          signer: signature.signer,
        },
        metadata: {
          client_order_id: validatedRequest.clientOrderId ?? this.generateClientOrderId(),
        },
      };

      const result = (await this.sdk.createOrder(body)) as GRVTOrder | null;
      if (!result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }
      return this.normalizer.normalizeOrder(result);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async cancelOrder(orderId: string, _symbol?: string): Promise<Order> {
    this.auth.requireAuth();
    await this.rateLimiter.acquire('cancelOrder');

    try {
      const subAccountId = this.requireSubAccountId();
      const result = (await this.sdk.cancelOrder({
        sub_account_id: subAccountId,
        order_id: orderId,
      })) as GRVTOrder | null;
      if (!result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }
      return this.normalizer.normalizeOrder(result);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async cancelAllOrders(_symbol?: string): Promise<Order[]> {
    this.auth.requireAuth();
    await this.rateLimiter.acquire('cancelAllOrders');

    try {
      const subAccountId = this.requireSubAccountId();
      await this.sdk.cancelAllOrders(subAccountId);
      // GRVT returns a count, not the cancelled orders.
      return [];
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    this.auth.requireAuth();
    await this.rateLimiter.acquire('fetchOpenOrders');

    try {
      const subAccountId = this.requireSubAccountId();
      const instrument = symbol ? this.normalizer.symbolFromCCXT(symbol) : undefined;
      const result = (await this.sdk.getOpenOrders(subAccountId, instrument)) as GRVTOrder[] | null;
      if (!result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }
      return this.normalizer.normalizeOrders(result);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async fetchOrderHistory(symbol?: string, _since?: number, limit?: number): Promise<Order[]> {
    this.auth.requireAuth();
    await this.rateLimiter.acquire('fetchClosedOrders');

    try {
      const subAccountId = this.requireSubAccountId();
      const instrument = symbol ? this.normalizer.symbolFromCCXT(symbol) : undefined;
      const result = (await this.sdk.getOrderHistory(subAccountId, instrument, limit ?? 100)) as
        | GRVTOrder[]
        | null;
      if (!result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }
      return this.normalizer.normalizeOrders(result);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async fetchMyTrades(symbol?: string, _since?: number, limit?: number): Promise<Trade[]> {
    this.auth.requireAuth();
    await this.rateLimiter.acquire('fetchMyTrades');

    try {
      const subAccountId = this.requireSubAccountId();
      const instrument = symbol ? this.normalizer.symbolFromCCXT(symbol) : undefined;
      const result = (await this.sdk.getFillHistory(subAccountId, instrument, limit ?? 100)) as
        | GRVTFill[]
        | null;
      if (!result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }
      return this.normalizer.normalizeFills(result);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  // ==================== Account ====================

  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    this.auth.requireAuth();
    await this.rateLimiter.acquire('fetchPositions');

    try {
      const subAccountId = this.requireSubAccountId();
      const result = (await this.sdk.getPositions(subAccountId)) as GRVTPosition[] | null;
      if (!result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }
      let positions = this.normalizer.normalizePositions(result);
      if (symbols && symbols.length > 0) {
        positions = positions.filter((p) => symbols.includes(p.symbol));
      }
      return positions;
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async fetchBalance(): Promise<Balance[]> {
    this.auth.requireAuth();
    await this.rateLimiter.acquire('fetchBalance');

    try {
      const subAccountId = this.requireSubAccountId();
      const result = (await this.sdk.getSubAccountSummary(subAccountId)) as
        | { spot_balances?: GRVTSpotBalance[] }
        | null;
      if (!result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }
      return this.normalizer.normalizeBalances(result.spot_balances ?? []);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  // ==================== Helpers ====================

  /**
   * Resolve a requested book depth to the nearest valid GRVT depth.
   */
  private resolveDepth(limit?: number): number {
    const requested = limit ?? 50;
    for (const depth of GRVT_BOOK_DEPTHS) {
      if (requested <= depth) {
        return depth;
      }
    }
    return 500;
  }

  /**
   * Map the unified TIF + market/post-only intent to the SIGN-enum TIF key.
   * Maker quotes (post_only, non-market) use GOOD_TILL_TIME.
   */
  private resolveSignTimeInForce(
    tif: string | undefined,
    isMarket: boolean,
    postOnly: boolean
  ): GrvtTimeInForce {
    if (postOnly && !isMarket) {
      return 'GOOD_TILL_TIME';
    }
    switch (tif) {
      case 'IOC':
        return 'IMMEDIATE_OR_CANCEL';
      case 'FOK':
        return 'FILL_OR_KILL';
      case 'GTC':
      case 'PO':
      default:
        return isMarket ? 'IMMEDIATE_OR_CANCEL' : 'GOOD_TILL_TIME';
    }
  }

  /**
   * Get cached instrument meta (hash + base_decimals), fetching markets if the
   * cache is cold.
   *
   * @throws {PerpDEXError} if the instrument is unknown after fetching markets.
   */
  private async getInstrumentMeta(grvtSymbol: string): Promise<GRVTInstrumentMeta> {
    if (!this.instrumentMeta.has(grvtSymbol)) {
      await this.fetchMarkets();
    }
    const meta = this.instrumentMeta.get(grvtSymbol);
    if (!meta) {
      throw new PerpDEXError(
        `Unknown GRVT instrument: ${grvtSymbol}`,
        'UNKNOWN_INSTRUMENT',
        'grvt'
      );
    }
    return meta;
  }

  /**
   * The trading sub-account id from the active session.
   *
   * @throws {PerpDEXError} if no session/sub-account id is available.
   */
  private requireSubAccountId(): string {
    const subAccountId = this.sdk.getSubAccountId() ?? this.auth.getSession()?.subAccountId;
    if (!subAccountId) {
      throw new PerpDEXError(
        'No GRVT sub-account id; call initialize() to log in first',
        'NO_SUB_ACCOUNT',
        'grvt'
      );
    }
    return subAccountId;
  }

  /**
   * Generate a GRVT client_order_id: a random integer in [2^63, 2^64-1].
   */
  private generateClientOrderId(): string {
    const min = 1n << 63n;
    const span = (1n << 64n) - min; // 2^63
    const randomBits =
      (BigInt(Math.floor(Math.random() * 0xffffffff)) << 32n) |
      BigInt(Math.floor(Math.random() * 0xffffffff));
    return (min + (randomBits % span)).toString();
  }

  async fetchFundingRateHistory(
    _symbol: string,
    _since?: number,
    _limit?: number
  ): Promise<FundingRate[]> {
    throw new PerpDEXError(
      'GRVT does not provide funding rate history via API',
      'NOT_SUPPORTED',
      'grvt'
    );
  }

  async _setLeverage(_symbol: string, _leverage: number): Promise<void> {
    throw new NotSupportedError(
      'GRVT uses cross-margin; setLeverage is not supported',
      'NOT_SUPPORTED',
      'grvt'
    );
  }

  symbolToExchange(symbol: string): string {
    return this.normalizer.symbolFromCCXT(symbol);
  }

  symbolFromExchange(exchangeSymbol: string): string {
    return this.normalizer.symbolToCCXT(exchangeSymbol);
  }

  // ==================== WebSocket ====================

  private async ensureWebSocket(): Promise<GRVTWebSocketWrapper> {
    if (!this.ws) {
      this.ws = new GRVTWebSocketWrapper({
        testnet: this.testnet,
        session: this.auth.getSession(),
        timeout: this.config.timeout,
      });
      await this.ws.connect();
    }
    return this.ws;
  }

  async *watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook> {
    const ws = await this.ensureWebSocket();
    yield* ws.watchOrderBook(symbol, limit ?? 50);
  }

  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    const ws = await this.ensureWebSocket();
    yield* ws.watchTrades(symbol);
  }

  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    const ws = await this.ensureWebSocket();
    yield* ws.watchTicker(symbol);
  }

  async *watchPositions(): AsyncGenerator<Position[]> {
    const ws = await this.ensureWebSocket();
    for await (const position of ws.watchPositions()) {
      yield [position];
    }
  }

  async *watchOrders(): AsyncGenerator<Order[]> {
    const ws = await this.ensureWebSocket();
    for await (const order of ws.watchOrders()) {
      yield [order];
    }
  }

  async *watchBalance(): AsyncGenerator<Balance[]> {
    const ws = await this.ensureWebSocket();
    yield* ws.watchBalance();
  }

  async *watchMyTrades(symbol?: string): AsyncGenerator<Trade> {
    const ws = await this.ensureWebSocket();
    yield* ws.watchMyTrades(symbol);
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.disconnect();
      this.ws = undefined;
    }
    this.auth.clearSession();
    this.sdk.clearSession();
    this._isReady = false;
  }
}

/**
 * Aster Exchange Adapter
 *
 * Implements IExchangeAdapter for Aster DEX (Binance-style API)
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
import type { FeatureMap } from '../../types/adapter.js';
import { PerpDEXError } from '../../types/errors.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import {
  ASTER_API_URLS,
  ASTER_RATE_LIMITS,
  ASTER_ENDPOINT_WEIGHTS,
  ASTER_KLINE_INTERVALS,
} from './constants.js';
import { AsterAuth } from './AsterAuth.js';
import { AsterNormalizer } from './AsterNormalizer.js';
import { toAsterSymbol, buildOrderParams, toUnifiedSymbol } from './utils.js';
import { mapAsterError } from './error-codes.js';
import type {
  AsterConfig,
  AsterExchangeInfo,
  AsterTicker24hr,
  AsterOrderBookResponse,
  AsterTradeResponse,
  AsterPremiumIndex,
  AsterKlineResponse,
  AsterOrderResponse,
  AsterPositionRisk,
  AsterAccountBalance,
} from './types.js';

export class AsterAdapter extends BaseAdapter {
  readonly id = 'aster';
  readonly name = 'Aster';

  readonly has: Partial<FeatureMap> = {
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchOHLCV: true,
    fetchFundingRate: true,
    createOrder: true,
    cancelOrder: true,
    cancelAllOrders: true,
    fetchPositions: true,
    fetchBalance: true,
    setLeverage: true,
    fetchFundingRateHistory: true,
  };

  private readonly auth?: AsterAuth;
  private readonly baseUrl: string;
  protected readonly httpClient: HTTPClient;
  protected rateLimiter: RateLimiter;
  private normalizer: AsterNormalizer;
  private readonly referralCode?: string;

  constructor(config: AsterConfig = {}) {
    super(config);

    const urls = config.testnet ? ASTER_API_URLS.testnet : ASTER_API_URLS.mainnet;
    this.baseUrl = config.apiUrl ?? urls.rest;
    this.referralCode = config.referralCode ?? config.builderCode;

    if (config.apiKey && config.apiSecret) {
      this.auth = new AsterAuth({
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
      });
    }

    this.normalizer = new AsterNormalizer();

    this.rateLimiter = new RateLimiter({
      maxTokens: config.rateLimit?.maxRequests ?? ASTER_RATE_LIMITS.rest.maxRequests,
      windowMs: config.rateLimit?.windowMs ?? ASTER_RATE_LIMITS.rest.windowMs,
      refillRate: (config.rateLimit?.maxRequests ?? ASTER_RATE_LIMITS.rest.maxRequests) / 60,
      weights: ASTER_ENDPOINT_WEIGHTS,
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

  async initialize(): Promise<void> {
    this._isReady = true;
  }

  // === Symbol conversion (required by BaseAdapter) ===

  protected symbolToExchange(symbol: string): string {
    return toAsterSymbol(symbol);
  }

  protected symbolFromExchange(exchangeSymbol: string): string {
    // Best-effort reverse mapping without market data
    // "BTCUSDT" -> "BTC/USDT:USDT" (assumes USDT settle for perps)
    const quoteAssets = ['USDT', 'USDC', 'BUSD'];
    for (const quote of quoteAssets) {
      if (exchangeSymbol.endsWith(quote)) {
        const base = exchangeSymbol.slice(0, -quote.length);
        return toUnifiedSymbol(exchangeSymbol, base, quote);
      }
    }
    return exchangeSymbol;
  }

  // === Auth helpers ===

  private requireAuth(): void {
    if (!this.auth?.hasCredentials()) {
      throw new PerpDEXError('API key and secret required', 'MISSING_CREDENTIALS', 'aster');
    }
  }

  private async publicGet<T>(path: string, feature: string): Promise<T> {
    await this.rateLimiter.acquire(feature);
    try {
      return await this.httpClient.get<T>(path);
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  private async signedRequest<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    feature: string,
    body?: Record<string, string | number | boolean>
  ): Promise<T> {
    this.requireAuth();
    await this.rateLimiter.acquire(feature);

    try {
      const signed = await this.auth!.sign({
        method,
        path,
        body,
      });

      const queryString = Object.entries(signed.params ?? {})
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&');

      const fullPath = queryString ? `${path}?${queryString}` : path;
      const headers = signed.headers ?? {};

      if (method === 'GET') {
        return await this.httpClient.get<T>(fullPath, { headers });
      } else if (method === 'DELETE') {
        return await this.httpClient.delete<T>(fullPath, { headers });
      } else {
        return await this.httpClient.post<T>(fullPath, { headers });
      }
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): PerpDEXError {
    if (error instanceof PerpDEXError) return error;

    if (error instanceof Error) {
      const match = error.message.match(/code["\s:]+(-?\d+)/);
      if (match?.[1]) {
        return mapAsterError(parseInt(match[1], 10), error.message);
      }
    }

    return new PerpDEXError(
      error instanceof Error ? error.message : 'Unknown error',
      'UNKNOWN',
      'aster'
    );
  }

  // === Public Market Data ===

  async fetchMarkets(_params?: MarketParams): Promise<Market[]> {
    const response = await this.publicGet<AsterExchangeInfo>(
      '/fapi/v1/exchangeInfo',
      'fetchMarkets'
    );

    if (!response?.symbols || !Array.isArray(response.symbols)) {
      throw new PerpDEXError('Invalid exchangeInfo response', 'INVALID_RESPONSE', 'aster');
    }

    return response.symbols
      .filter((s) => s.contractType === 'PERPETUAL' && s.status === 'TRADING')
      .map((s) => this.normalizer.normalizeMarket(s));
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    const asterSymbol = toAsterSymbol(symbol);
    const response = await this.publicGet<AsterTicker24hr>(
      `/fapi/v1/ticker/24hr?symbol=${asterSymbol}`,
      'fetchTicker'
    );
    return this.normalizer.normalizeTicker(response, symbol);
  }

  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    const asterSymbol = toAsterSymbol(symbol);
    const limit = params?.limit ?? 20;
    const response = await this.publicGet<AsterOrderBookResponse>(
      `/fapi/v1/depth?symbol=${asterSymbol}&limit=${limit}`,
      'fetchOrderBook'
    );
    return this.normalizer.normalizeOrderBook(response, symbol);
  }

  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    const asterSymbol = toAsterSymbol(symbol);
    const limit = params?.limit ?? 100;
    const response = await this.publicGet<AsterTradeResponse[]>(
      `/fapi/v1/trades?symbol=${asterSymbol}&limit=${limit}`,
      'fetchTrades'
    );

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'aster');
    }

    return response.map((t) => this.normalizer.normalizeTrade(t, symbol));
  }

  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    const asterSymbol = toAsterSymbol(symbol);
    const response = await this.publicGet<AsterPremiumIndex>(
      `/fapi/v1/premiumIndex?symbol=${asterSymbol}`,
      'fetchFundingRate'
    );
    return this.normalizer.normalizeFundingRate(response, symbol);
  }

  async fetchFundingRateHistory(
    symbol: string,
    since?: number,
    limit?: number
  ): Promise<FundingRate[]> {
    const asterSymbol = toAsterSymbol(symbol);
    let path = `/fapi/v1/fundingRate?symbol=${asterSymbol}`;
    if (since) path += `&startTime=${since}`;
    if (limit) path += `&limit=${limit}`;

    const response = await this.publicGet<AsterPremiumIndex[]>(path, 'fetchFundingRate');

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid funding rate history response', 'INVALID_RESPONSE', 'aster');
    }

    return response.map((r) => this.normalizer.normalizeFundingRate(r, symbol));
  }

  async fetchOHLCV(
    symbol: string,
    timeframe: OHLCVTimeframe,
    params?: OHLCVParams
  ): Promise<OHLCV[]> {
    const asterSymbol = toAsterSymbol(symbol);
    const interval = ASTER_KLINE_INTERVALS[timeframe] ?? '1h';
    let path = `/fapi/v1/klines?symbol=${asterSymbol}&interval=${interval}`;

    if (params?.limit) path += `&limit=${params.limit}`;
    if (params?.since) path += `&startTime=${params.since}`;
    if (params?.until) path += `&endTime=${params.until}`;

    const response = await this.publicGet<AsterKlineResponse[]>(path, 'fetchOHLCV');

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid klines response', 'INVALID_RESPONSE', 'aster');
    }

    return response.map((k) => this.normalizer.normalizeOHLCV(k));
  }

  // === Private Trading ===

  async createOrder(request: OrderRequest): Promise<Order> {
    const asterSymbol = toAsterSymbol(request.symbol);
    const orderParams = buildOrderParams(request, asterSymbol, this.referralCode);

    const response = await this.signedRequest<AsterOrderResponse>(
      'POST',
      '/fapi/v1/order',
      'createOrder',
      orderParams
    );

    return this.normalizer.normalizeOrder(response, request.symbol);
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    if (!symbol) {
      throw new PerpDEXError('Symbol required to cancel order', 'MISSING_PARAM', 'aster');
    }

    const asterSymbol = toAsterSymbol(symbol);
    const response = await this.signedRequest<AsterOrderResponse>(
      'DELETE',
      '/fapi/v1/order',
      'cancelOrder',
      { symbol: asterSymbol, orderId: parseInt(orderId, 10) }
    );

    return this.normalizer.normalizeOrder(response, symbol);
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    if (!symbol) {
      throw new PerpDEXError('Symbol required to cancel all orders', 'MISSING_PARAM', 'aster');
    }

    const asterSymbol = toAsterSymbol(symbol);
    await this.signedRequest<{ code: number; msg: string }>(
      'DELETE',
      '/fapi/v1/allOpenOrders',
      'cancelAllOrders',
      { symbol: asterSymbol }
    );

    return [];
  }

  // === Private Account ===

  async fetchPositions(_symbols?: string[]): Promise<Position[]> {
    const response = await this.signedRequest<AsterPositionRisk[]>(
      'GET',
      '/fapi/v1/positionRisk',
      'fetchPositions'
    );

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid positions response', 'INVALID_RESPONSE', 'aster');
    }

    return response
      .filter((p) => parseFloat(p.positionAmt) !== 0)
      .map((p) => this.normalizer.normalizePosition(p));
  }

  async fetchBalance(): Promise<Balance[]> {
    const response = await this.signedRequest<AsterAccountBalance[]>(
      'GET',
      '/fapi/v2/balance',
      'fetchBalance'
    );

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid balance response', 'INVALID_RESPONSE', 'aster');
    }

    return response
      .filter((b) => parseFloat(b.balance) > 0)
      .map((b) => this.normalizer.normalizeBalance(b));
  }

  async setLeverage(symbol: string, leverage: number): Promise<void> {
    const asterSymbol = toAsterSymbol(symbol);
    await this.signedRequest<{
      leverage: number;
      maxNotionalValue: string;
      symbol: string;
    }>('POST', '/fapi/v1/leverage', 'setLeverage', { symbol: asterSymbol, leverage });
  }

  // === Account History (required abstract methods) ===

  async fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]> {
    throw new PerpDEXError('fetchOrderHistory not yet implemented', 'NOT_IMPLEMENTED', 'aster');
  }

  async fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<Trade[]> {
    throw new PerpDEXError('fetchMyTrades not yet implemented', 'NOT_IMPLEMENTED', 'aster');
  }
}

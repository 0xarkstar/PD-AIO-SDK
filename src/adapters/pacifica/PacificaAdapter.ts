/**
 * Pacifica Exchange Adapter
 *
 * Implements IExchangeAdapter for Pacifica DEX (Solana, Ed25519 auth)
 * @see https://docs.pacifica.fi/api-documentation/api/rest-api
 */

import type {
  Balance,
  FundingRate,
  Market,
  MarketParams,
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
import { PACIFICA_API_URLS, PACIFICA_RATE_LIMITS, PACIFICA_ENDPOINT_WEIGHTS } from './constants.js';
import { PacificaAuth } from './PacificaAuth.js';
import { PacificaNormalizer } from './PacificaNormalizer.js';
import { toPacificaSymbol, toUnifiedSymbol, buildOrderBody } from './utils.js';
import { mapPacificaError } from './error-codes.js';
import type {
  PacificaConfig,
  PacificaMarket,
  PacificaTicker,
  PacificaOrderBook as PacificaOrderBookType,
  PacificaTradeResponse,
  PacificaFundingHistory,
  PacificaOrderResponse,
  PacificaPosition as PacificaPositionType,
  PacificaAccountInfo,
  PacificaApiResponse,
} from './types.js';

export class PacificaAdapter extends BaseAdapter implements IExchangeAdapter {
  readonly id = 'pacifica';
  readonly name = 'Pacifica';

  readonly has: Partial<FeatureMap> = {
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchFundingRate: true,
    fetchOHLCV: false,
    createOrder: true,
    cancelOrder: true,
    cancelAllOrders: false,
    fetchFundingRateHistory: true,
    fetchOrderHistory: false,
    fetchMyTrades: false,
    fetchPositions: true,
    fetchBalance: true,
    setLeverage: true,
    setMarginMode: false,
    editOrder: false,
    fetchOpenOrders: false,
    watchOrderBook: false,
    watchTrades: false,
    watchTicker: false,
    watchOrders: false,
    watchPositions: false,
    watchBalance: false,
  };

  private readonly auth?: PacificaAuth;
  private readonly baseUrl: string;
  protected readonly httpClient: HTTPClient;
  protected rateLimiter: RateLimiter;
  private normalizer: PacificaNormalizer;
  private readonly builderCode?: string;
  private readonly maxBuilderFeeRate: number;
  private readonly builderCodeEnabled: boolean;

  constructor(config: PacificaConfig = {}) {
    super(config);

    const urls = config.testnet ? PACIFICA_API_URLS.testnet : PACIFICA_API_URLS.mainnet;
    this.baseUrl = config.apiUrl ?? urls.rest;
    this.builderCode = config.builderCode;
    this.maxBuilderFeeRate = config.maxBuilderFeeRate ?? 500;
    this.builderCodeEnabled = config.builderCodeEnabled ?? true;

    if (config.apiKey && config.apiSecret) {
      this.auth = new PacificaAuth({
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
      });
    }

    this.normalizer = new PacificaNormalizer();

    this.rateLimiter = new RateLimiter({
      maxTokens: config.rateLimit?.maxRequests ?? PACIFICA_RATE_LIMITS.rest.maxRequests,
      windowMs: config.rateLimit?.windowMs ?? PACIFICA_RATE_LIMITS.rest.windowMs,
      refillRate: (config.rateLimit?.maxRequests ?? PACIFICA_RATE_LIMITS.rest.maxRequests) / 60,
      weights: PACIFICA_ENDPOINT_WEIGHTS,
    });

    this.httpClient = new HTTPClient({
      baseUrl: this.baseUrl,
      timeout: config.timeout ?? 30000,
      retry: { maxAttempts: 3, initialDelay: 1000, maxDelay: 10000, multiplier: 2 },
      circuitBreaker: { enabled: true, failureThreshold: 5, resetTimeout: 60000 },
      exchange: this.id,
    });
  }

  async initialize(): Promise<void> {
    if (this.auth?.hasCredentials() && this.builderCode && this.builderCodeEnabled) {
      await this.registerBuilderCode(this.builderCode, this.maxBuilderFeeRate);
    }
    this._isReady = true;
  }

  private requireAuth(): void {
    if (!this.auth?.hasCredentials()) {
      throw new PerpDEXError('API key and secret required', 'MISSING_CREDENTIALS', 'pacifica');
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
    method: 'GET' | 'POST',
    path: string,
    feature: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    this.requireAuth();
    await this.rateLimiter.acquire(feature);

    try {
      const signed = await this.auth!.sign({
        method,
        path,
        body,
      });

      const headers = signed.headers ?? {};

      if (method === 'GET') {
        return await this.httpClient.get<T>(path, { headers });
      } else {
        return await this.httpClient.post<T>(path, { headers, body });
      }
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): PerpDEXError {
    if (error instanceof PerpDEXError) return error;

    if (error instanceof Error) {
      const codeMatch = error.message.match(/"code"\s*:\s*"([^"]+)"/);
      if (codeMatch?.[1]) {
        return mapPacificaError(codeMatch[1], error.message);
      }
    }

    return new PerpDEXError(
      error instanceof Error ? error.message : 'Unknown error',
      'UNKNOWN',
      'pacifica'
    );
  }

  /**
   * Unwrap `{ success, data }` envelope. Returns `data` if present,
   * otherwise returns the raw response (for mocked / non-wrapped responses).
   */
  private unwrapResponse<T>(response: unknown): T {
    if (
      response !== null &&
      typeof response === 'object' &&
      'success' in (response as Record<string, unknown>) &&
      'data' in (response as Record<string, unknown>)
    ) {
      return (response as PacificaApiResponse<T>).data;
    }
    return response as T;
  }

  async registerBuilderCode(code: string, maxFeeRate: number): Promise<void> {
    await this.signedRequest<{ success: boolean }>(
      'POST',
      '/account/builder_codes/approve',
      'registerBuilderCode',
      {
        type: 'approve_builder_code',
        builder_code: code,
        max_fee_rate: maxFeeRate,
      }
    );
  }

  // === Public Market Data ===

  async fetchMarkets(_params?: MarketParams): Promise<Market[]> {
    const response = await this.publicGet<PacificaMarket[] | PacificaApiResponse<PacificaMarket[]>>(
      '/info',
      'fetchMarkets'
    );
    const markets = this.unwrapResponse<PacificaMarket[]>(response);

    if (!Array.isArray(markets)) {
      throw new PerpDEXError('Invalid markets response', 'INVALID_RESPONSE', 'pacifica');
    }

    return markets.map((m) => this.normalizer.normalizeMarket(m));
  }

  async _fetchTicker(symbol: string): Promise<Ticker> {
    const pacificaSymbol = toPacificaSymbol(symbol);
    const response = await this.publicGet<PacificaTicker[] | PacificaApiResponse<PacificaTicker[]>>(
      '/info/prices',
      'fetchTicker'
    );
    const prices = this.unwrapResponse<PacificaTicker[]>(response);

    if (Array.isArray(prices)) {
      const match = prices.find((p) => p.symbol === pacificaSymbol);
      if (match) {
        return this.normalizer.normalizeTicker(match, symbol);
      }
    }

    throw new PerpDEXError(
      `Ticker not found for ${pacificaSymbol}`,
      'INVALID_RESPONSE',
      'pacifica'
    );
  }

  async _fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    const pacificaSymbol = toPacificaSymbol(symbol);
    const limit = params?.limit ?? 20;
    const response = await this.publicGet<PacificaOrderBookType | PacificaApiResponse<PacificaOrderBookType>>(
      `/book?symbol=${pacificaSymbol}&limit=${limit}`,
      'fetchOrderBook'
    );
    const orderbook = this.unwrapResponse<PacificaOrderBookType>(response);
    return this.normalizer.normalizeOrderBook(orderbook, symbol);
  }

  async _fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    const pacificaSymbol = toPacificaSymbol(symbol);
    const limit = params?.limit ?? 100;
    const response = await this.publicGet<
      PacificaTradeResponse[] | PacificaApiResponse<PacificaTradeResponse[]>
    >(`/trades?symbol=${pacificaSymbol}&limit=${limit}`, 'fetchTrades');
    const trades = this.unwrapResponse<PacificaTradeResponse[]>(response);

    if (!Array.isArray(trades)) {
      throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'pacifica');
    }

    return trades.map((t, i) => this.normalizer.normalizeTrade(t, symbol, i));
  }

  async _fetchFundingRate(symbol: string): Promise<FundingRate> {
    const pacificaSymbol = toPacificaSymbol(symbol);
    const response = await this.publicGet<
      PacificaFundingHistory[] | PacificaApiResponse<PacificaFundingHistory[]>
    >(`/funding_rate/history?symbol=${pacificaSymbol}&limit=1`, 'fetchFundingRate');
    const history = this.unwrapResponse<PacificaFundingHistory[]>(response);

    if (!Array.isArray(history) || history.length === 0) {
      throw new PerpDEXError('No funding rate data', 'INVALID_RESPONSE', 'pacifica');
    }

    return this.normalizer.normalizeFundingRate(history[0]!, symbol);
  }

  async fetchFundingRateHistory(
    symbol: string,
    _since?: number,
    _limit?: number
  ): Promise<FundingRate[]> {
    const pacificaSymbol = toPacificaSymbol(symbol);
    const limit = _limit ?? 100;
    const response = await this.publicGet<
      PacificaFundingHistory[] | PacificaApiResponse<PacificaFundingHistory[]>
    >(`/funding_rate/history?symbol=${pacificaSymbol}&limit=${limit}`, 'fetchFundingRate');
    const history = this.unwrapResponse<PacificaFundingHistory[]>(response);

    if (!Array.isArray(history)) {
      return [];
    }

    return history.map((h) => this.normalizer.normalizeFundingRate(h, symbol));
  }

  // === Private Trading ===

  async createOrder(request: OrderRequest): Promise<Order> {
    const pacificaSymbol = toPacificaSymbol(request.symbol);
    const effectiveBuilderCode = this.builderCodeEnabled ? this.builderCode : undefined;
    const body = buildOrderBody(request, pacificaSymbol, effectiveBuilderCode);

    const response = await this.signedRequest<PacificaOrderResponse>(
      'POST',
      '/orders/create',
      'createOrder',
      body
    );

    return this.normalizer.normalizeOrder(response, request.symbol);
  }

  async cancelOrder(orderId: string, _symbol?: string): Promise<Order> {
    const response = await this.signedRequest<PacificaOrderResponse>(
      'POST',
      '/orders/cancel',
      'cancelOrder',
      { order_id: orderId }
    );

    return this.normalizer.normalizeOrder(response);
  }

  // === Private Account ===

  async fetchPositions(_symbols?: string[]): Promise<Position[]> {
    const response = await this.signedRequest<PacificaPositionType[]>(
      'GET',
      '/positions',
      'fetchPositions'
    );

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid positions response', 'INVALID_RESPONSE', 'pacifica');
    }

    return response
      .filter((p) => parseFloat(p.size) > 0)
      .map((p) => this.normalizer.normalizePosition(p));
  }

  async fetchBalance(): Promise<Balance[]> {
    const response = await this.signedRequest<PacificaAccountInfo>(
      'GET',
      '/account',
      'fetchBalance'
    );

    return [this.normalizer.normalizeBalance(response)];
  }

  async _setLeverage(symbol: string, leverage: number): Promise<void> {
    const pacificaSymbol = toPacificaSymbol(symbol);
    await this.signedRequest<{ success: boolean }>('POST', '/account/leverage', 'setLeverage', {
      symbol: pacificaSymbol,
      leverage,
    });
  }

  // === Abstract method stubs (not supported by Pacifica) ===

  async cancelAllOrders(_symbol?: string): Promise<Order[]> {
    return [];
  }

  async fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]> {
    return [];
  }

  async fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<Trade[]> {
    return [];
  }

  protected symbolToExchange(symbol: string): string {
    return toPacificaSymbol(symbol);
  }

  protected symbolFromExchange(exchangeSymbol: string): string {
    return toUnifiedSymbol(exchangeSymbol);
  }
}

/**
 * Pacifica Exchange Adapter
 *
 * Implements IExchangeAdapter for Pacifica DEX (Solana, Ed25519 auth)
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
import type { FeatureMap } from '../../types/adapter.js';
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
} from './types.js';

export class PacificaAdapter extends BaseAdapter {
  readonly id = 'pacifica';
  readonly name = 'Pacifica';

  readonly has: Partial<FeatureMap> = {
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchFundingRate: true,
    createOrder: true,
    cancelOrder: true,
    fetchPositions: true,
    fetchBalance: true,
    setLeverage: true,
  };

  private readonly auth?: PacificaAuth;
  private readonly baseUrl: string;
  protected readonly httpClient: HTTPClient;
  protected rateLimiter: RateLimiter;
  private normalizer: PacificaNormalizer;
  private readonly builderCode?: string;
  private readonly maxBuilderFeeRate: number;

  constructor(config: PacificaConfig = {}) {
    super(config);

    const urls = config.testnet ? PACIFICA_API_URLS.testnet : PACIFICA_API_URLS.mainnet;
    this.baseUrl = config.apiUrl ?? urls.rest;
    this.builderCode = config.builderCode;
    this.maxBuilderFeeRate = config.maxBuilderFeeRate ?? 500;

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
    if (this.auth?.hasCredentials() && this.builderCode) {
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
    const response = await this.publicGet<PacificaMarket[]>('/markets', 'fetchMarkets');

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid markets response', 'INVALID_RESPONSE', 'pacifica');
    }

    return response
      .filter((m) => m.status === 'active')
      .map((m) => this.normalizer.normalizeMarket(m));
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    const pacificaSymbol = toPacificaSymbol(symbol);
    const response = await this.publicGet<PacificaTicker>(
      `/prices?symbol=${pacificaSymbol}`,
      'fetchTicker'
    );
    return this.normalizer.normalizeTicker(response, symbol);
  }

  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    const pacificaSymbol = toPacificaSymbol(symbol);
    const limit = params?.limit ?? 20;
    const response = await this.publicGet<PacificaOrderBookType>(
      `/book?symbol=${pacificaSymbol}&limit=${limit}`,
      'fetchOrderBook'
    );
    return this.normalizer.normalizeOrderBook(response, symbol);
  }

  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    const pacificaSymbol = toPacificaSymbol(symbol);
    const limit = params?.limit ?? 100;
    const response = await this.publicGet<PacificaTradeResponse[]>(
      `/trades?symbol=${pacificaSymbol}&limit=${limit}`,
      'fetchTrades'
    );

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'pacifica');
    }

    return response.map((t) => this.normalizer.normalizeTrade(t, symbol));
  }

  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    const pacificaSymbol = toPacificaSymbol(symbol);
    const response = await this.publicGet<PacificaFundingHistory[]>(
      `/funding/historical?symbol=${pacificaSymbol}&limit=1`,
      'fetchFundingRate'
    );

    if (!Array.isArray(response) || response.length === 0) {
      throw new PerpDEXError('No funding rate data', 'INVALID_RESPONSE', 'pacifica');
    }

    return this.normalizer.normalizeFundingRate(response[0]!, symbol);
  }

  // === Private Trading ===

  async createOrder(request: OrderRequest): Promise<Order> {
    const pacificaSymbol = toPacificaSymbol(request.symbol);
    const body = buildOrderBody(request, pacificaSymbol, this.builderCode);

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

  async setLeverage(symbol: string, leverage: number): Promise<void> {
    const pacificaSymbol = toPacificaSymbol(symbol);
    await this.signedRequest<{ success: boolean }>('POST', '/account/leverage', 'setLeverage', {
      symbol: pacificaSymbol,
      leverage,
    });
  }

  // === Abstract method stubs (not supported by Pacifica) ===

  async fetchFundingRateHistory(
    _symbol: string,
    _since?: number,
    _limit?: number
  ): Promise<FundingRate[]> {
    return [];
  }

  async cancelAllOrders(_symbol?: string): Promise<Order[]> {
    return [];
  }

  async fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]> {
    return [];
  }

  async fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<Trade[]> {
    return [];
  }

  symbolToExchange(symbol: string): string {
    return toPacificaSymbol(symbol);
  }

  symbolFromExchange(exchangeSymbol: string): string {
    return toUnifiedSymbol(exchangeSymbol);
  }
}

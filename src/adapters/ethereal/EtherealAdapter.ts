/**
 * Ethereal Exchange Adapter
 *
 * Implements IExchangeAdapter for Ethereal DEX.
 * Ethereal is a perpetual DEX with REST API and EIP-712 authentication.
 */

import { Wallet } from 'ethers';
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
import { PerpDEXError, NotSupportedError } from '../../types/errors.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import {
  ETHEREAL_API_URLS,
  ETHEREAL_RATE_LIMITS,
  ETHEREAL_ENDPOINT_WEIGHTS,
  ETHEREAL_KLINE_INTERVALS,
  unifiedToEthereal,
  etherealToUnified,
} from './constants.js';
import { EtherealAuth } from './EtherealAuth.js';
import { EtherealNormalizer } from './EtherealNormalizer.js';
import { buildOrderRequest, mapTimeframeToInterval } from './utils.js';
import { mapError } from './error-codes.js';
import type {
  EtherealConfig,
  EtherealMarketInfo,
  EtherealTicker,
  EtherealOrderBookResponse,
  EtherealTradeResponse,
  EtherealFundingRateResponse,
  EtherealCandleResponse,
  EtherealOrderResponse,
  EtherealPositionResponse,
  EtherealBalanceResponse,
  EtherealMyTradeResponse,
} from './types.js';

export { EtherealConfig };

export class EtherealAdapter extends BaseAdapter implements IExchangeAdapter {
  readonly id = 'ethereal';
  readonly name = 'Ethereal';

  readonly has: Partial<FeatureMap> = {
    // Market Data
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchOHLCV: true,
    fetchFundingRate: true,
    fetchFundingRateHistory: false,

    // Trading
    createOrder: true,
    cancelOrder: true,
    cancelAllOrders: true,
    editOrder: false,

    // Account
    fetchOpenOrders: true,
    fetchOrderHistory: false,
    fetchMyTrades: true,
    fetchDeposits: false,
    fetchWithdrawals: false,

    // Positions & Balance
    fetchPositions: true,
    fetchBalance: true,
    setLeverage: false,
    setMarginMode: false,

    // WebSocket
    watchOrderBook: false,
    watchTrades: false,
    watchTicker: false,
    watchOrders: false,
    watchPositions: false,
    watchBalance: false,
  };

  private readonly auth?: EtherealAuth;
  private readonly baseUrl: string;
  protected readonly httpClient: HTTPClient;
  protected rateLimiter: RateLimiter;
  private normalizer: EtherealNormalizer;
  private readonly accountId: string;

  constructor(config: EtherealConfig = {}) {
    super(config);

    const urls = config.testnet ? ETHEREAL_API_URLS.testnet : ETHEREAL_API_URLS.mainnet;
    this.baseUrl = config.apiUrl ?? urls.rest;
    this.accountId = config.accountId ?? '';

    if (config.privateKey) {
      const wallet = new Wallet(config.privateKey);
      this.auth = new EtherealAuth(wallet);
    }

    this.normalizer = new EtherealNormalizer();

    this.rateLimiter = new RateLimiter({
      maxTokens: config.rateLimit?.maxRequests ?? ETHEREAL_RATE_LIMITS.rest.maxRequests,
      windowMs: config.rateLimit?.windowMs ?? ETHEREAL_RATE_LIMITS.rest.windowMs,
      refillRate: (config.rateLimit?.maxRequests ?? ETHEREAL_RATE_LIMITS.rest.maxRequests) / 60,
      weights: ETHEREAL_ENDPOINT_WEIGHTS,
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
    return unifiedToEthereal(symbol);
  }

  protected symbolFromExchange(exchangeSymbol: string): string {
    return etherealToUnified(exchangeSymbol);
  }

  // === Auth helpers ===

  private requireAuth(): EtherealAuth {
    if (!this.auth) {
      throw new PerpDEXError(
        'Private key required for authenticated operations',
        'MISSING_CREDENTIALS',
        'ethereal'
      );
    }
    return this.auth;
  }

  private async publicGet<T>(path: string, feature: string): Promise<T> {
    await this.rateLimiter.acquire(feature);
    try {
      return await this.httpClient.get<T>(path);
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  private async authenticatedRequest<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    feature: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    this.requireAuth();
    await this.rateLimiter.acquire(feature);

    try {
      const headers = this.auth!.getHeaders();

      if (method === 'GET') {
        return await this.httpClient.get<T>(path, { headers });
      } else if (method === 'DELETE') {
        return await this.httpClient.delete<T>(path, { headers });
      } else {
        return await this.httpClient.post<T>(path, { body, headers });
      }
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  // === Public Market Data ===

  async fetchMarkets(_params?: MarketParams): Promise<Market[]> {
    const response = await this.publicGet<EtherealMarketInfo[]>('/markets', 'fetchMarkets');

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid markets response', 'INVALID_RESPONSE', 'ethereal');
    }

    return response
      .filter((m) => m.status === 'ACTIVE')
      .map((m) => this.normalizer.normalizeMarket(m));
  }

  async _fetchTicker(symbol: string): Promise<Ticker> {
    const etherealSymbol = unifiedToEthereal(symbol);
    const response = await this.publicGet<EtherealTicker>(
      `/markets/${etherealSymbol}/ticker`,
      'fetchTicker'
    );
    return this.normalizer.normalizeTicker(response, symbol);
  }

  async _fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    const etherealSymbol = unifiedToEthereal(symbol);
    const limit = params?.limit ?? 20;
    const response = await this.publicGet<EtherealOrderBookResponse>(
      `/markets/${etherealSymbol}/orderbook?limit=${limit}`,
      'fetchOrderBook'
    );
    return this.normalizer.normalizeOrderBook(response, symbol);
  }

  async _fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    const etherealSymbol = unifiedToEthereal(symbol);
    let path = `/markets/${etherealSymbol}/trades`;
    const queryParts: string[] = [];

    if (params?.limit) {
      queryParts.push(`limit=${params.limit}`);
    }
    if (params?.since) {
      queryParts.push(`since=${params.since}`);
    }

    if (queryParts.length > 0) {
      path += `?${queryParts.join('&')}`;
    }

    const response = await this.publicGet<EtherealTradeResponse[]>(path, 'fetchTrades');

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'ethereal');
    }

    return response.map((t) => this.normalizer.normalizeTrade(t, symbol));
  }

  async _fetchFundingRate(symbol: string): Promise<FundingRate> {
    const etherealSymbol = unifiedToEthereal(symbol);
    const response = await this.publicGet<EtherealFundingRateResponse>(
      `/markets/${etherealSymbol}/funding`,
      'fetchFundingRate'
    );
    return this.normalizer.normalizeFundingRate(response, symbol);
  }

  async fetchFundingRateHistory(
    _symbol: string,
    _since?: number,
    _limit?: number
  ): Promise<FundingRate[]> {
    throw new NotSupportedError(
      'Ethereal does not support funding rate history via REST API',
      'NOT_SUPPORTED',
      'ethereal'
    );
  }

  async fetchOHLCV(
    symbol: string,
    timeframe: OHLCVTimeframe = '1h',
    params?: OHLCVParams
  ): Promise<OHLCV[]> {
    const etherealSymbol = unifiedToEthereal(symbol);
    const interval = ETHEREAL_KLINE_INTERVALS[timeframe] ?? mapTimeframeToInterval(timeframe);
    let path = `/markets/${etherealSymbol}/candles?interval=${interval}`;

    if (params?.limit) path += `&limit=${params.limit}`;
    if (params?.since) path += `&startTime=${params.since}`;
    if (params?.until) path += `&endTime=${params.until}`;

    const response = await this.publicGet<EtherealCandleResponse[]>(path, 'fetchOHLCV');

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid candles response', 'INVALID_RESPONSE', 'ethereal');
    }

    return this.normalizer.normalizeCandles(response);
  }

  // === Private Trading ===

  async createOrder(request: OrderRequest): Promise<Order> {
    const auth = this.requireAuth();
    await this.rateLimiter.acquire('createOrder');

    try {
      const { signature, nonce } = await auth.signOrderAction({
        accountId: this.accountId,
      });

      const orderReq = buildOrderRequest(request, this.accountId, signature, nonce);

      const response = await this.httpClient.post<EtherealOrderResponse>('/orders', {
        body: orderReq as unknown as Record<string, unknown>,
        headers: auth.getHeaders(),
      });

      return this.normalizer.normalizeOrder(response, request.symbol);
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    const auth = this.requireAuth();
    await this.rateLimiter.acquire('cancelOrder');

    try {
      const { signature, nonce } = await auth.signCancelAction(this.accountId, orderId);

      const response = await this.httpClient.delete<EtherealOrderResponse>(`/orders/${orderId}`, {
        headers: {
          ...auth.getHeaders(),
          'X-Signature': signature,
          'X-Nonce': nonce,
          'X-Account-Id': this.accountId,
        },
      });

      return this.normalizer.normalizeOrder(response, symbol);
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    const auth = this.requireAuth();
    await this.rateLimiter.acquire('cancelAllOrders');

    try {
      const { signature, nonce } = await auth.signCancelAction(this.accountId);

      let path = '/orders';
      if (symbol) {
        const etherealSymbol = unifiedToEthereal(symbol);
        path += `?symbol=${etherealSymbol}`;
      }

      await this.httpClient.delete<{ cancelledCount: number }>(path, {
        headers: {
          ...auth.getHeaders(),
          'X-Signature': signature,
          'X-Nonce': nonce,
          'X-Account-Id': this.accountId,
        },
      });

      return [];
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  // === Account History ===

  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    this.requireAuth();

    const response = await this.authenticatedRequest<EtherealOrderResponse[]>(
      'GET',
      '/account/orders?status=OPEN',
      'fetchOpenOrders'
    );

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid orders response', 'INVALID_RESPONSE', 'ethereal');
    }

    let orders = response.map((o) => this.normalizer.normalizeOrder(o));

    if (symbol) {
      orders = orders.filter((o) => o.symbol === symbol);
    }

    return orders;
  }

  async fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]> {
    throw new NotSupportedError(
      'Ethereal does not provide order history via REST API',
      'NOT_SUPPORTED',
      'ethereal'
    );
  }

  async fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]> {
    this.requireAuth();

    let path = '/account/trades';
    const queryParts: string[] = [];

    if (symbol) {
      const etherealSymbol = unifiedToEthereal(symbol);
      queryParts.push(`symbol=${etherealSymbol}`);
    }
    if (since) {
      queryParts.push(`since=${since}`);
    }
    if (limit) {
      queryParts.push(`limit=${limit}`);
    }

    if (queryParts.length > 0) {
      path += `?${queryParts.join('&')}`;
    }

    const response = await this.authenticatedRequest<EtherealMyTradeResponse[]>(
      'GET',
      path,
      'fetchMyTrades'
    );

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'ethereal');
    }

    return response.map((t) => {
      const price = parseFloat(t.price);
      const amount = parseFloat(t.quantity);
      const tradeSymbol = symbol ?? etherealToUnified(t.symbol);

      return {
        id: t.id,
        symbol: tradeSymbol,
        side: t.side === 'BUY' ? ('buy' as const) : ('sell' as const),
        price,
        amount,
        cost: price * amount,
        timestamp: t.timestamp,
        info: t as unknown as Record<string, unknown>,
      };
    });
  }

  // === Positions & Balance ===

  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    this.requireAuth();

    const response = await this.authenticatedRequest<EtherealPositionResponse[]>(
      'GET',
      '/account/positions',
      'fetchPositions'
    );

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid positions response', 'INVALID_RESPONSE', 'ethereal');
    }

    let positions = response
      .filter((p) => parseFloat(p.size) !== 0)
      .map((p) => this.normalizer.normalizePosition(p));

    if (symbols && symbols.length > 0) {
      positions = positions.filter((p) => symbols.includes(p.symbol));
    }

    return positions;
  }

  async fetchBalance(): Promise<Balance[]> {
    this.requireAuth();

    const response = await this.authenticatedRequest<EtherealBalanceResponse[]>(
      'GET',
      '/account/balance',
      'fetchBalance'
    );

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid balance response', 'INVALID_RESPONSE', 'ethereal');
    }

    return response
      .filter((b) => parseFloat(b.total) > 0)
      .map((b) => this.normalizer.normalizeBalance(b));
  }

  async _setLeverage(_symbol: string, _leverage: number): Promise<void> {
    throw new NotSupportedError(
      'Ethereal does not support per-symbol leverage setting via REST API',
      'NOT_SUPPORTED',
      'ethereal'
    );
  }
}

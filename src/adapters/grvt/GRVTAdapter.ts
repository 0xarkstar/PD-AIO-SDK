/**
 * GRVT exchange adapter implementation
 */

import { BaseAdapter } from '../base/BaseAdapter.js';
import { WebSocketManager } from '../../websocket/WebSocketManager.js';
import type {
  Market,
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
import type { FeatureMap } from '../../types/adapter.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import {
  PerpDEXError,
  InsufficientMarginError,
  OrderNotFoundError,
  InvalidOrderError,
  RateLimitError,
  ExchangeUnavailableError,
  InvalidSignatureError,
  ExpiredAuthError,
} from '../../types/errors.js';
import { GRVTAuth, type GRVTAuthConfig } from './auth.js';
import {
  GRVT_API_URLS,
  GRVT_RATE_LIMITS,
  GRVT_ENDPOINT_WEIGHTS,
  GRVT_WS_CHANNELS,
} from './constants.js';
import {
  normalizeMarket,
  normalizeOrder,
  normalizePosition,
  normalizeBalance,
  normalizeOrderBook,
  normalizeTrade,
  normalizeTicker,
  toGRVTSymbol,
  toGRVTOrderType,
  toGRVTOrderSide,
  toGRVTTimeInForce,
  normalizeSymbol,
  mapGRVTError,
} from './utils.js';
import type {
  GRVTResponse,
  GRVTMarket,
  GRVTOrder,
  GRVTPosition,
  GRVTBalance,
  GRVTOrderBook,
  GRVTTrade,
  GRVTTicker,
  GRVTOrderRequest,
  GRVTWsOrderBookUpdate,
  GRVTWsTradeUpdate,
  GRVTWsPositionUpdate,
  GRVTWsOrderUpdate,
  GRVTSubscription,
} from './types.js';

/**
 * GRVT adapter configuration
 */
export interface GRVTAdapterConfig extends GRVTAuthConfig {
  testnet?: boolean;
  timeout?: number;
  debug?: boolean;
}

/**
 * GRVT exchange adapter
 *
 * High-performance hybrid DEX with sub-millisecond latency
 *
 * Features:
 * - REST API for trading and market data
 * - WebSocket for real-time updates
 * - API key + session cookie authentication
 * - EIP-712 signatures for orders
 * - Up to 100x leverage
 */
export class GRVTAdapter extends BaseAdapter {
  readonly id = 'grvt';
  readonly name = 'GRVT';

  readonly has: Partial<FeatureMap> = {
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchFundingRate: true,
    fetchFundingRateHistory: false,
    fetchPositions: true,
    fetchBalance: true,
    createOrder: true,
    createBatchOrders: true,
    cancelOrder: true,
    cancelAllOrders: true,
    watchOrderBook: true,
    watchTrades: true,
    watchPositions: true,
  };

  private readonly apiUrl: string;
  private readonly wsUrl: string;
  private readonly auth: GRVTAuth;
  private readonly rateLimiter: RateLimiter;
  private readonly testnet: boolean;
  private readonly wsManager: WebSocketManager;

  constructor(config: GRVTAdapterConfig = {}) {
    super(config);

    this.testnet = config.testnet ?? false;

    const urls = this.testnet ? GRVT_API_URLS.testnet : GRVT_API_URLS.mainnet;
    this.apiUrl = urls.rest;
    this.wsUrl = urls.websocket;

    this.auth = new GRVTAuth(config);

    this.rateLimiter = new RateLimiter({
      maxTokens: GRVT_RATE_LIMITS.rest.maxRequests,
      refillRate: GRVT_RATE_LIMITS.rest.maxRequests / (GRVT_RATE_LIMITS.rest.windowMs / 1000),
      windowMs: GRVT_RATE_LIMITS.rest.windowMs,
      weights: GRVT_ENDPOINT_WEIGHTS,
    });

    this.wsManager = new WebSocketManager({ url: this.wsUrl });
  }

  async initialize(): Promise<void> {
    const isValid = await this.auth.verify();

    if (!isValid) {
      throw new InvalidSignatureError(
        'Failed to verify GRVT credentials',
        'INVALID_CREDENTIALS',
        'grvt'
      );
    }

    this._isReady = true;
  }

  async disconnect(): Promise<void> {
    this.auth.clearSessionCookie();
    this._isReady = false;
  }

  // ==================== Market Data Methods ====================

  async fetchMarkets(params?: MarketParams): Promise<Market[]> {
    await this.rateLimiter.acquire('fetchMarkets');

    const response = await this.request<GRVTResponse<GRVTMarket[]>>(
      'GET',
      `${this.apiUrl}/markets`
    );

    if (response.error) {
      throw this.mapError(response.error);
    }

    let markets = response.result.map(normalizeMarket);

    if (params?.active !== undefined) {
      markets = markets.filter((m) => m.active === params.active);
    }

    return markets;
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    await this.rateLimiter.acquire('fetchTicker');

    const grvtSymbol = toGRVTSymbol(symbol);

    const response = await this.request<GRVTResponse<GRVTTicker>>(
      'GET',
      `${this.apiUrl}/ticker/${grvtSymbol}`
    );

    if (response.error) {
      throw this.mapError(response.error);
    }

    return normalizeTicker(response.result);
  }

  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    await this.rateLimiter.acquire('fetchOrderBook');

    const grvtSymbol = toGRVTSymbol(symbol);
    const limit = params?.limit;

    const queryParams = limit ? `?depth=${limit}` : '';

    const response = await this.request<GRVTResponse<GRVTOrderBook>>(
      'GET',
      `${this.apiUrl}/orderbook/${grvtSymbol}${queryParams}`
    );

    if (response.error) {
      throw this.mapError(response.error);
    }

    return normalizeOrderBook(response.result);
  }

  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    await this.rateLimiter.acquire('fetchTrades');

    const grvtSymbol = toGRVTSymbol(symbol);

    const queryParams = new URLSearchParams();
    if (params?.since) queryParams.append('since', params.since.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = `${this.apiUrl}/trades/${grvtSymbol}${queryString ? `?${queryString}` : ''}`;

    const response = await this.request<GRVTResponse<GRVTTrade[]>>(
      'GET',
      url
    );

    if (response.error) {
      throw this.mapError(response.error);
    }

    return response.result.map(normalizeTrade);
  }

  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    await this.rateLimiter.acquire('fetchFundingRate');

    const grvtSymbol = toGRVTSymbol(symbol);

    const response = await this.request<GRVTResponse<{
      instrument: string;
      funding_rate: string;
      mark_price: string;
      next_funding_time: number;
    }>>(
      'GET',
      `${this.apiUrl}/funding/${grvtSymbol}`
    );

    if (response.error) {
      throw this.mapError(response.error);
    }

    const data = response.result;

    return {
      symbol: normalizeSymbol(data.instrument),
      fundingRate: parseFloat(data.funding_rate),
      fundingTimestamp: Date.now(),
      markPrice: parseFloat(data.mark_price),
      indexPrice: parseFloat(data.mark_price), // GRVT doesn't provide separate index price
      nextFundingTimestamp: data.next_funding_time,
      fundingIntervalHours: 8,
      info: data as unknown as Record<string, unknown>,
    };
  }

  // ==================== Trading Methods ====================

  async createOrder(request: OrderRequest): Promise<Order> {
    await this.rateLimiter.acquire('createOrder');

    const grvtSymbol = toGRVTSymbol(request.symbol);

    const grvtRequest: GRVTOrderRequest = {
      instrument: grvtSymbol,
      order_type: toGRVTOrderType(request.type, request.postOnly) as 'MARKET' | 'LIMIT' | 'LIMIT_MAKER',
      side: toGRVTOrderSide(request.side) as 'BUY' | 'SELL',
      size: request.amount.toString(),
      price: request.price?.toString(),
      time_in_force: toGRVTTimeInForce(request.timeInForce, request.postOnly) as 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY',
      reduce_only: request.reduceOnly ?? false,
      post_only: request.postOnly ?? false,
      client_order_id: request.clientOrderId,
    };

    const response = await this.authenticatedRequest<GRVTResponse<GRVTOrder>>(
      'POST',
      `${this.apiUrl}/orders`,
      grvtRequest
    );

    if (response.error) {
      throw this.mapError(response.error);
    }

    return normalizeOrder(response.result);
  }

  async createBatchOrders(requests: OrderRequest[]): Promise<Order[]> {
    await this.rateLimiter.acquire('createBatchOrders');

    const grvtRequests: GRVTOrderRequest[] = requests.map((request) => ({
      instrument: toGRVTSymbol(request.symbol),
      order_type: toGRVTOrderType(request.type, request.postOnly) as 'MARKET' | 'LIMIT' | 'LIMIT_MAKER',
      side: toGRVTOrderSide(request.side) as 'BUY' | 'SELL',
      size: request.amount.toString(),
      price: request.price?.toString(),
      time_in_force: toGRVTTimeInForce(request.timeInForce, request.postOnly) as 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY',
      reduce_only: request.reduceOnly ?? false,
      post_only: request.postOnly ?? false,
      client_order_id: request.clientOrderId,
    }));

    const response = await this.authenticatedRequest<GRVTResponse<GRVTOrder[]>>(
      'POST',
      `${this.apiUrl}/orders/batch`,
      { orders: grvtRequests }
    );

    if (response.error) {
      throw this.mapError(response.error);
    }

    return response.result.map(normalizeOrder);
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    await this.rateLimiter.acquire('cancelOrder');

    const response = await this.authenticatedRequest<GRVTResponse<GRVTOrder>>(
      'DELETE',
      `${this.apiUrl}/orders/${orderId}`
    );

    if (response.error) {
      throw this.mapError(response.error);
    }

    return normalizeOrder(response.result);
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    await this.rateLimiter.acquire('cancelAllOrders');

    const body = symbol ? { instrument: toGRVTSymbol(symbol) } : {};

    const response = await this.authenticatedRequest<GRVTResponse<GRVTOrder[]>>(
      'DELETE',
      `${this.apiUrl}/orders/all`,
      body
    );

    if (response.error) {
      throw this.mapError(response.error);
    }

    return response.result.map(normalizeOrder);
  }

  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    await this.rateLimiter.acquire('fetchOpenOrders');

    const params = symbol ? `?instrument=${toGRVTSymbol(symbol)}` : '';

    const response = await this.authenticatedRequest<GRVTResponse<GRVTOrder[]>>(
      'GET',
      `${this.apiUrl}/orders/open${params}`
    );

    if (response.error) {
      throw this.mapError(response.error);
    }

    return response.result.map(normalizeOrder);
  }

  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    await this.rateLimiter.acquire('fetchPositions');

    const response = await this.authenticatedRequest<GRVTResponse<GRVTPosition[]>>(
      'GET',
      `${this.apiUrl}/positions`
    );

    if (response.error) {
      throw this.mapError(response.error);
    }

    let positions = response.result.map(normalizePosition);

    if (symbols && symbols.length > 0) {
      const symbolSet = new Set(symbols);
      positions = positions.filter((p) => symbolSet.has(p.symbol));
    }

    return positions;
  }

  async fetchBalance(): Promise<Balance[]> {
    await this.rateLimiter.acquire('fetchBalance');

    const response = await this.authenticatedRequest<GRVTResponse<GRVTBalance[]>>(
      'GET',
      `${this.apiUrl}/balance`
    );

    if (response.error) {
      throw this.mapError(response.error);
    }

    return response.result.map(normalizeBalance);
  }

  // ==================== WebSocket Methods ====================

  async *watchOrderBook(symbol: string): AsyncGenerator<OrderBook> {
    const grvtSymbol = toGRVTSymbol(symbol);
    const channel = `${GRVT_WS_CHANNELS.orderbook}.${grvtSymbol}`;

    const subscription: GRVTSubscription = {
      method: 'subscribe',
      params: {
        channels: [channel],
      },
    };

    for await (const data of this.wsManager.watch<GRVTWsOrderBookUpdate>(
      channel,
      subscription
    )) {
      yield normalizeOrderBook(data);
    }
  }

  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    const grvtSymbol = toGRVTSymbol(symbol);
    const channel = `${GRVT_WS_CHANNELS.trades}.${grvtSymbol}`;

    const subscription: GRVTSubscription = {
      method: 'subscribe',
      params: {
        channels: [channel],
      },
    };

    for await (const data of this.wsManager.watch<GRVTWsTradeUpdate>(
      channel,
      subscription
    )) {
      for (const trade of data.trades) {
        yield normalizeTrade(trade);
      }
    }
  }

  async *watchPositions(): AsyncGenerator<Position[]> {
    const channel = GRVT_WS_CHANNELS.positions;

    const subscription: GRVTSubscription = {
      method: 'subscribe',
      params: {
        channels: [channel],
      },
    };

    for await (const data of this.wsManager.watch<GRVTWsPositionUpdate>(
      channel,
      subscription
    )) {
      yield data.positions.map(normalizePosition);
    }
  }

  async *watchOrders(): AsyncGenerator<Order[]> {
    const channel = GRVT_WS_CHANNELS.orders;

    const subscription: GRVTSubscription = {
      method: 'subscribe',
      params: {
        channels: [channel],
      },
    };

    for await (const data of this.wsManager.watch<GRVTWsOrderUpdate>(
      channel,
      subscription
    )) {
      yield data.orders.map(normalizeOrder);
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Make authenticated API request
   */
  private async authenticatedRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    body?: unknown
  ): Promise<T> {
    const requestParams = {
      method,
      path: url.replace(this.apiUrl, ''),
      body,
    };

    const authenticatedRequest = await this.auth.sign(requestParams);

    return this.request<T>(method, url, body, authenticatedRequest.headers);
  }

  /**
   * Make HTTP request
   */
  protected async request<T>(
    method: string,
    url: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw this.mapError(errorData);
    }

    return response.json();
  }

  /**
   * Map GRVT error to unified error type
   */
  private mapError(error: unknown): Error {
    const { code, message } = mapGRVTError(error);

    switch (code) {
      case 'INVALID_ORDER':
        return new InvalidOrderError(message, code, 'grvt', error);
      case 'INSUFFICIENT_MARGIN':
        return new InsufficientMarginError(message, code, 'grvt', error);
      case 'ORDER_NOT_FOUND':
        return new OrderNotFoundError(message, code, 'grvt', error);
      case 'INVALID_SIGNATURE':
        return new InvalidSignatureError(message, code, 'grvt', error);
      case 'EXPIRED_AUTH':
        return new ExpiredAuthError(message, code, 'grvt', error);
      case 'RATE_LIMIT_EXCEEDED':
        return new RateLimitError(message, code, 'grvt', undefined, error);
      case 'EXCHANGE_UNAVAILABLE':
        return new ExchangeUnavailableError(message, code, 'grvt', error);
      default:
        return new PerpDEXError(message, code, 'grvt', error);
    }
  }

  // ==================== Required BaseAdapter Methods ====================

  async fetchFundingRateHistory(
    symbol: string,
    since?: number,
    limit?: number
  ): Promise<FundingRate[]> {
    throw new Error('GRVT does not support funding rate history');
  }

  async setLeverage(symbol: string, leverage: number): Promise<void> {
    // GRVT uses automatic cross-margin, leverage is not set per position
    throw new Error('GRVT uses cross-margin, leverage cannot be set manually');
  }

  symbolToExchange(symbol: string): string {
    return toGRVTSymbol(symbol);
  }

  symbolFromExchange(exchangeSymbol: string): string {
    return normalizeSymbol(exchangeSymbol);
  }
}

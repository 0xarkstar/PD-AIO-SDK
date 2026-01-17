/**
 * Lighter exchange adapter implementation
 */

import { createHmac } from 'crypto';
import { BaseAdapter } from '../base/BaseAdapter.js';
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
import { PerpDEXError, InvalidOrderError } from '../../types/errors.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { WebSocketManager } from '../../websocket/WebSocketManager.js';
import { LIGHTER_API_URLS, LIGHTER_RATE_LIMITS, LIGHTER_ENDPOINT_WEIGHTS, LIGHTER_WS_CONFIG, LIGHTER_WS_CHANNELS } from './constants.js';
import { LighterNormalizer } from './LighterNormalizer.js';
import { convertOrderRequest, mapError } from './utils.js';
import type {
  LighterMarket,
  LighterOrder,
  LighterPosition,
  LighterBalance,
  LighterOrderBook,
  LighterTrade,
  LighterTicker,
  LighterFundingRate,
} from './types.js';

/**
 * Lighter adapter configuration
 */
export interface LighterConfig {
  apiKey?: string;
  apiSecret?: string;
  testnet?: boolean;
  timeout?: number;
  rateLimitTier?: 'tier1' | 'tier2' | 'tier3';
}

/**
 * Lighter exchange adapter
 *
 * High-performance order book DEX on Arbitrum
 */
export class LighterAdapter extends BaseAdapter {
  readonly id = 'lighter';
  readonly name = 'Lighter';

  readonly has: Partial<FeatureMap> = {
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchFundingRate: true,
    fetchFundingRateHistory: false,
    fetchPositions: true,
    fetchBalance: true,
    fetchOrderHistory: true,
    fetchMyTrades: true,
    createOrder: true,
    createBatchOrders: false,
    cancelOrder: true,
    cancelAllOrders: true,
    setLeverage: false,
    watchOrderBook: true,
    watchTrades: true,
    watchPositions: true,
  };

  private readonly apiUrl: string;
  private readonly wsUrl: string;
  private readonly apiKey?: string;
  private readonly apiSecret?: string;
  protected readonly rateLimiter: RateLimiter;
  protected readonly httpClient: HTTPClient;
  private normalizer: LighterNormalizer;
  private wsManager: WebSocketManager | null = null;

  constructor(config: LighterConfig = {}) {
    super(config);

    const testnet = config.testnet ?? false;
    const urls = testnet ? LIGHTER_API_URLS.testnet : LIGHTER_API_URLS.mainnet;

    this.apiUrl = urls.rest;
    this.wsUrl = urls.websocket;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;

    // Initialize normalizer
    this.normalizer = new LighterNormalizer();

    const tier = config.rateLimitTier ?? 'tier1';
    const limits = LIGHTER_RATE_LIMITS[tier];

    this.rateLimiter = new RateLimiter({
      maxTokens: limits.maxRequests,
      refillRate: limits.maxRequests / (limits.windowMs / 1000),
      windowMs: limits.windowMs,
      weights: LIGHTER_ENDPOINT_WEIGHTS,
    });

    // Initialize HTTP client
    this.httpClient = new HTTPClient({
      baseUrl: this.apiUrl,
      timeout: config.timeout || 30000,
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        multiplier: 2,
        retryableStatuses: [408, 429, 500, 502, 503, 504],
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        successThreshold: 2,
        resetTimeout: 60000,
      },
      exchange: this.id,
    });
  }

  async initialize(): Promise<void> {
    // Initialize WebSocket manager (optional - will be initialized on first watch call if needed)
    try {
      this.wsManager = new WebSocketManager({
        url: this.wsUrl,
        reconnect: {
          enabled: true,
          initialDelay: LIGHTER_WS_CONFIG.reconnectDelay,
          maxDelay: LIGHTER_WS_CONFIG.maxReconnectDelay,
          maxAttempts: LIGHTER_WS_CONFIG.reconnectAttempts,
          multiplier: 2,
          jitter: 0.1,
        },
        heartbeat: {
          enabled: true,
          interval: LIGHTER_WS_CONFIG.pingInterval,
          timeout: LIGHTER_WS_CONFIG.pongTimeout,
        },
      });

      await this.wsManager.connect();
    } catch (error) {
      // WebSocket initialization is optional - watch methods will throw if needed
      this.wsManager = null;
    }

    this._isReady = true;
  }

  async disconnect(): Promise<void> {
    if (this.wsManager) {
      await this.wsManager.disconnect();
      this.wsManager = null;
    }
    this._isReady = false;
  }

  // ==================== Market Data Methods ====================

  async fetchMarkets(params?: MarketParams): Promise<Market[]> {
    await this.rateLimiter.acquire('fetchMarkets');

    try {
      const response = await this.request<LighterMarket[]>('GET', '/markets');

      if (!Array.isArray(response)) {
        throw new PerpDEXError('Invalid markets response', 'INVALID_RESPONSE', 'lighter');
      }

      return response.map((market: any) => this.normalizer.normalizeMarket(market));
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    await this.rateLimiter.acquire('fetchTicker');

    try {
      const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
      const response = await this.request<LighterTicker>('GET', `/ticker/${lighterSymbol}`);

      return this.normalizer.normalizeTicker(response);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    await this.rateLimiter.acquire('fetchOrderBook');

    try {
      const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
      const limit = params?.limit || 50;
      const response = await this.request<LighterOrderBook>(
        'GET',
        `/orderbook/${lighterSymbol}?limit=${limit}`
      );

      return this.normalizer.normalizeOrderBook(response);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    await this.rateLimiter.acquire('fetchTrades');

    try {
      const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
      const limit = params?.limit || 100;
      const response = await this.request<LighterTrade[]>(
        'GET',
        `/trades/${lighterSymbol}?limit=${limit}`
      );

      if (!Array.isArray(response)) {
        throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'lighter');
      }

      return response.map((trade: any) => this.normalizer.normalizeTrade(trade));
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    await this.rateLimiter.acquire('fetchFundingRate');

    try {
      const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
      const response = await this.request<LighterFundingRate>('GET', `/funding/${lighterSymbol}`);

      return this.normalizer.normalizeFundingRate(response);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchFundingRateHistory(
    symbol: string,
    since?: number,
    limit?: number
  ): Promise<FundingRate[]> {
    throw new Error('Lighter does not support funding rate history');
  }

  // ==================== Trading Methods ====================

  async createOrder(request: OrderRequest): Promise<Order> {
    await this.rateLimiter.acquire('createOrder');

    if (!this.apiKey || !this.apiSecret) {
      throw new InvalidOrderError(
        'API key and secret required for trading',
        'AUTH_REQUIRED',
        'lighter'
      );
    }

    try {
      const lighterSymbol = this.normalizer.toLighterSymbol(request.symbol);
      const orderRequest = convertOrderRequest(request, lighterSymbol);

      const response = await this.request<LighterOrder>('POST', '/orders', orderRequest);

      return this.normalizer.normalizeOrder(response);
    } catch (error) {
      throw mapError(error);
    }
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    await this.rateLimiter.acquire('cancelOrder');

    if (!this.apiKey || !this.apiSecret) {
      throw new InvalidOrderError(
        'API key and secret required for trading',
        'AUTH_REQUIRED',
        'lighter'
      );
    }

    try {
      const response = await this.request<LighterOrder>('DELETE', `/orders/${orderId}`);

      return this.normalizer.normalizeOrder(response);
    } catch (error) {
      throw mapError(error);
    }
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    await this.rateLimiter.acquire('cancelAllOrders');

    if (!this.apiKey || !this.apiSecret) {
      throw new InvalidOrderError(
        'API key and secret required for trading',
        'AUTH_REQUIRED',
        'lighter'
      );
    }

    try {
      const path = symbol ? `/orders?symbol=${this.normalizer.toLighterSymbol(symbol)}` : '/orders';
      const response = await this.request<LighterOrder[]>('DELETE', path);

      if (!Array.isArray(response)) {
        return [];
      }

      return response.map((order: any) => this.normalizer.normalizeOrder(order));
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    await this.rateLimiter.acquire('fetchPositions');

    if (!this.apiKey || !this.apiSecret) {
      throw new PerpDEXError(
        'API key and secret required',
        'AUTH_REQUIRED',
        'lighter'
      );
    }

    try {
      const response = await this.request<LighterPosition[]>('GET', '/account/positions');

      if (!Array.isArray(response)) {
        throw new PerpDEXError('Invalid positions response', 'INVALID_RESPONSE', 'lighter');
      }

      let positions = response.map((position: any) => this.normalizer.normalizePosition(position));

      // Filter by symbols if provided
      if (symbols && symbols.length > 0) {
        positions = positions.filter(p => symbols.includes(p.symbol));
      }

      return positions;
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchBalance(): Promise<Balance[]> {
    await this.rateLimiter.acquire('fetchBalance');

    if (!this.apiKey || !this.apiSecret) {
      throw new PerpDEXError(
        'API key and secret required',
        'AUTH_REQUIRED',
        'lighter'
      );
    }

    try {
      const response = await this.request<LighterBalance[]>('GET', '/account/balance');

      if (!Array.isArray(response)) {
        throw new PerpDEXError('Invalid balance response', 'INVALID_RESPONSE', 'lighter');
      }

      return response.map((balance: any) => this.normalizer.normalizeBalance(balance));
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    await this.rateLimiter.acquire('fetchOpenOrders');

    if (!this.apiKey || !this.apiSecret) {
      throw new PerpDEXError(
        'API key and secret required',
        'AUTH_REQUIRED',
        'lighter'
      );
    }

    try {
      const path = symbol ? `/orders?symbol=${this.normalizer.toLighterSymbol(symbol)}` : '/orders';
      const response = await this.request<LighterOrder[]>('GET', path);

      if (!Array.isArray(response)) {
        throw new PerpDEXError('Invalid open orders response', 'INVALID_RESPONSE', 'lighter');
      }

      return response.map((order: any) => this.normalizer.normalizeOrder(order));
    } catch (error) {
      throw mapError(error);
    }
  }

  // ==================== Required BaseAdapter Methods ====================

  async setLeverage(symbol: string, leverage: number): Promise<void> {
    throw new Error('Lighter does not support setLeverage');
  }

  /**
   * Fetch order history
   */
  async fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]> {
    await this.rateLimiter.acquire('fetchOrderHistory');

    if (!this.apiKey || !this.apiSecret) {
      throw new PerpDEXError(
        'API key and secret required',
        'AUTH_REQUIRED',
        'lighter'
      );
    }

    try {
      const params = new URLSearchParams();
      if (symbol) params.append('symbol', this.normalizer.toLighterSymbol(symbol));
      if (since) params.append('startTime', since.toString());
      if (limit) params.append('limit', limit.toString());

      const queryString = params.toString();
      const response = await this.request<LighterOrder[]>(
        'GET',
        `/account/inactiveOrders${queryString ? `?${queryString}` : ''}`
      );

      if (!Array.isArray(response)) {
        throw new PerpDEXError('Invalid order history response', 'INVALID_RESPONSE', 'lighter');
      }

      return response.map((order: any) => this.normalizer.normalizeOrder(order));
    } catch (error) {
      throw mapError(error);
    }
  }

  /**
   * Fetch user trade history
   */
  async fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]> {
    await this.rateLimiter.acquire('fetchMyTrades');

    if (!this.apiKey || !this.apiSecret) {
      throw new PerpDEXError(
        'API key and secret required',
        'AUTH_REQUIRED',
        'lighter'
      );
    }

    try {
      const params = new URLSearchParams();
      if (symbol) params.append('symbol', this.normalizer.toLighterSymbol(symbol));
      if (since) params.append('startTime', since.toString());
      if (limit) params.append('limit', limit.toString());

      const queryString = params.toString();
      const response = await this.request<LighterTrade[]>(
        'GET',
        `/account/fills${queryString ? `?${queryString}` : ''}`
      );

      if (!Array.isArray(response)) {
        throw new PerpDEXError('Invalid trade history response', 'INVALID_RESPONSE', 'lighter');
      }

      return response.map((trade: any) => this.normalizer.normalizeTrade(trade));
    } catch (error) {
      throw mapError(error);
    }
  }

  symbolToExchange(symbol: string): string {
    return this.normalizer.toLighterSymbol(symbol);
  }

  symbolFromExchange(exchangeSymbol: string): string {
    return this.normalizer.normalizeSymbol(exchangeSymbol);
  }

  // ==================== Private Helper Methods ====================

  /**
   * Make HTTP request to Lighter API using HTTPClient
   */
  protected async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const headers: Record<string, string> = {};

    // Add authentication headers if available
    if (this.apiKey && this.apiSecret) {
      const timestamp = Date.now().toString();
      const signature = this.generateSignature(method, path, timestamp, body);
      headers['X-API-KEY'] = this.apiKey;
      headers['X-TIMESTAMP'] = timestamp;
      headers['X-SIGNATURE'] = signature;
    }

    try {
      switch (method) {
        case 'GET':
          return await this.httpClient.get<T>(path, { headers });
        case 'POST':
          return await this.httpClient.post<T>(path, { headers, body });
        case 'DELETE':
          return await this.httpClient.delete<T>(path, { headers, body });
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
    } catch (error) {
      throw mapError(error);
    }
  }

  // ==================== WebSocket Streaming Methods ====================

  async *watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook> {
    if (!this.wsManager) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }

    const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
    const subscription = {
      type: 'subscribe',
      channel: LIGHTER_WS_CHANNELS.ORDERBOOK,
      symbol: lighterSymbol,
      limit: limit || 50,
    };

    const channelId = `${LIGHTER_WS_CHANNELS.ORDERBOOK}:${lighterSymbol}`;

    for await (const update of this.wsManager.watch<LighterOrderBook>(channelId, subscription)) {
      yield this.normalizer.normalizeOrderBook(update);
    }
  }

  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    if (!this.wsManager) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }

    const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
    const subscription = {
      type: 'subscribe',
      channel: LIGHTER_WS_CHANNELS.TRADES,
      symbol: lighterSymbol,
    };

    const channelId = `${LIGHTER_WS_CHANNELS.TRADES}:${lighterSymbol}`;

    for await (const trade of this.wsManager.watch<LighterTrade>(channelId, subscription)) {
      yield this.normalizer.normalizeTrade(trade);
    }
  }

  async *watchPositions(): AsyncGenerator<Position[]> {
    if (!this.wsManager) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }

    if (!this.apiKey) {
      throw new PerpDEXError('API key required for position streaming', 'AUTH_REQUIRED', this.id);
    }

    const subscription = {
      type: 'subscribe',
      channel: LIGHTER_WS_CHANNELS.POSITIONS,
      apiKey: this.apiKey,
    };

    const channelId = `${LIGHTER_WS_CHANNELS.POSITIONS}:${this.apiKey}`;

    for await (const positions of this.wsManager.watch<LighterPosition[]>(channelId, subscription)) {
      yield positions.map(position => this.normalizer.normalizePosition(position));
    }
  }

  // ==================== Private Helper Methods ====================

  /**
   * Generate HMAC signature for authenticated requests
   */
  private generateSignature(
    method: string,
    path: string,
    timestamp: string,
    body?: Record<string, unknown>
  ): string {
    const message = `${timestamp}${method}${path}${body ? JSON.stringify(body) : ''}`;
    return createHmac('sha256', this.apiSecret!)
      .update(message)
      .digest('hex');
  }
}

/**
 * Paradex Exchange Adapter
 *
 * StarkNet-based perpetual DEX with JWT authentication
 */

import { BaseAdapter } from '../base/BaseAdapter.js';
import type {
  Market,
  Order,
  OrderRequest,
  Position,
  Balance,
  OrderBook,
  Trade,
  Ticker,
  FundingRate,
  OrderBookParams,
  TradeParams,
} from '../../types/common.js';
import type { FeatureMap } from '../../types/adapter.js';
import { PerpDEXError } from '../../types/errors.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { WebSocketManager } from '../../websocket/WebSocketManager.js';
import {
  PARADEX_API_URLS,
  PARADEX_RATE_LIMITS,
  PARADEX_ENDPOINT_WEIGHTS,
} from './constants.js';
import {
  normalizeSymbol,
  toParadexSymbol,
  normalizeMarket,
  normalizeOrder,
  normalizePosition,
  normalizeBalance,
  normalizeOrderBook,
  normalizeTrade,
  normalizeTicker,
  normalizeFundingRate,
  toParadexOrderType,
  toParadexOrderSide,
  toParadexTimeInForce,
  mapParadexError,
} from './utils.js';
import { ParadexAuth } from './auth.js';
import type { ParadexConfig } from './types.js';

/**
 * Paradex adapter implementation
 */
export class ParadexAdapter extends BaseAdapter {
  readonly id = 'paradex';
  readonly name = 'Paradex';

  readonly has: Partial<FeatureMap> = {
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchFundingRate: true,
    fetchFundingRateHistory: true,
    fetchPositions: true,
    fetchBalance: true,
    fetchOrderHistory: true,
    fetchMyTrades: true,
    createOrder: true,
    cancelOrder: true,
    cancelAllOrders: true,
    setLeverage: true,
    watchOrderBook: true,
    watchTrades: true,
    watchTicker: true,
    watchPositions: true,
    watchOrders: true,
    watchBalance: true,
  };

  private readonly auth: ParadexAuth;
  private readonly baseUrl: string;
  private readonly wsUrl: string;
  private wsManager: WebSocketManager;
  protected rateLimiter: RateLimiter;

  constructor(config: ParadexConfig = {}) {
    super(config);

    const tier = config.rateLimitTier ?? 'default';
    const limits = PARADEX_RATE_LIMITS[tier];

    this.rateLimiter = new RateLimiter({
      maxTokens: limits.maxRequests,
      refillRate: limits.maxRequests / (limits.windowMs / 1000),
      windowMs: limits.windowMs,
      weights: PARADEX_ENDPOINT_WEIGHTS,
    });

    const urls = config.testnet ? PARADEX_API_URLS.testnet : PARADEX_API_URLS.mainnet;
    this.baseUrl = urls.rest;
    this.wsUrl = urls.websocket;

    this.auth = new ParadexAuth({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      privateKey: config.privateKey,
      starkPrivateKey: config.starkPrivateKey,
      testnet: config.testnet,
    });

    this.wsManager = new WebSocketManager({ url: this.wsUrl });
  }

  /**
   * Initialize the adapter
   */
  async initialize(): Promise<void> {
    await this.auth.verify();
  }

  /**
   * Cleanup resources
   */
  async disconnect(): Promise<void> {
    // Cleanup if needed
  }

  /**
   * Fetch all available markets
   */
  async fetchMarkets(): Promise<Market[]> {
    const response = await this.makeRequest('GET', '/markets', 'fetchMarkets');

    if (!Array.isArray(response.markets)) {
      throw new PerpDEXError('Invalid markets response', 'INVALID_RESPONSE', 'paradex');
    }

    return response.markets.map(normalizeMarket);
  }

  /**
   * Fetch ticker for a symbol
   */
  async fetchTicker(symbol: string): Promise<Ticker> {
    const market = toParadexSymbol(symbol);
    const response = await this.makeRequest('GET', `/markets/${market}/ticker`, 'fetchTicker');

    return normalizeTicker(response);
  }

  /**
   * Fetch order book for a symbol
   */
  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    const market = toParadexSymbol(symbol);
    const limit = params?.limit;

    const queryParams = limit ? `?depth=${limit}` : '';
    const response = await this.makeRequest(
      'GET',
      `/markets/${market}/orderbook${queryParams}`,
      'fetchOrderBook'
    );

    return normalizeOrderBook(response);
  }

  /**
   * Fetch recent trades for a symbol
   */
  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    const market = toParadexSymbol(symbol);
    const limit = params?.limit ?? 100;

    const response = await this.makeRequest(
      'GET',
      `/markets/${market}/trades?limit=${limit}`,
      'fetchTrades'
    );

    if (!Array.isArray(response.trades)) {
      throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'paradex');
    }

    return response.trades.map(normalizeTrade);
  }

  /**
   * Fetch current funding rate
   */
  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    const market = toParadexSymbol(symbol);
    const response = await this.makeRequest(
      'GET',
      `/markets/${market}/funding`,
      'fetchFundingRate'
    );

    return normalizeFundingRate(response);
  }

  /**
   * Fetch funding rate history
   */
  async fetchFundingRateHistory(
    symbol: string,
    since?: number,
    limit?: number
  ): Promise<FundingRate[]> {
    const market = toParadexSymbol(symbol);
    const params = new URLSearchParams();

    if (since) params.append('start_time', since.toString());
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const path = `/markets/${market}/funding/history${queryString ? `?${queryString}` : ''}`;

    const response = await this.makeRequest('GET', path, 'fetchFundingRateHistory');

    if (!Array.isArray(response.history)) {
      throw new PerpDEXError('Invalid funding rate history response', 'INVALID_RESPONSE', 'paradex');
    }

    return response.history.map(normalizeFundingRate);
  }

  /**
   * Fetch all open positions
   */
  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    const response = await this.makeRequest('GET', '/positions', 'fetchPositions');

    if (!Array.isArray(response.positions)) {
      throw new PerpDEXError('Invalid positions response', 'INVALID_RESPONSE', 'paradex');
    }

    let positions = response.positions.map(normalizePosition);

    if (symbols && symbols.length > 0) {
      positions = positions.filter((p: Position) => symbols.includes(p.symbol));
    }

    return positions;
  }

  /**
   * Fetch account balance
   */
  async fetchBalance(): Promise<Balance[]> {
    const response = await this.makeRequest('GET', '/account/balance', 'fetchBalance');

    if (!Array.isArray(response.balances)) {
      throw new PerpDEXError('Invalid balance response', 'INVALID_RESPONSE', 'paradex');
    }

    return response.balances.map(normalizeBalance);
  }

  /**
   * Create a new order
   */
  async createOrder(order: OrderRequest): Promise<Order> {
    const market = toParadexSymbol(order.symbol);
    const orderType = toParadexOrderType(order.type, order.postOnly);
    const side = toParadexOrderSide(order.side);
    const timeInForce = toParadexTimeInForce(order.timeInForce, order.postOnly);

    const payload = {
      market,
      side,
      type: orderType,
      size: order.amount.toString(),
      price: order.price?.toString(),
      time_in_force: timeInForce,
      reduce_only: order.reduceOnly ?? false,
      post_only: order.postOnly ?? false,
      client_id: order.clientOrderId,
    };

    const response = await this.makeRequest('POST', '/orders', 'createOrder', payload);

    return normalizeOrder(response);
  }

  /**
   * Cancel an existing order
   */
  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    const response = await this.makeRequest('DELETE', `/orders/${orderId}`, 'cancelOrder');

    return normalizeOrder(response);
  }

  /**
   * Cancel all orders
   */
  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    const payload = symbol ? { market: toParadexSymbol(symbol) } : {};

    const response = await this.makeRequest('DELETE', '/orders', 'cancelAllOrders', payload);

    if (!Array.isArray(response.orders)) {
      throw new PerpDEXError('Invalid cancel all orders response', 'INVALID_RESPONSE', 'paradex');
    }

    return response.orders.map(normalizeOrder);
  }

  /**
   * Fetch open orders
   */
  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    const params = symbol ? `?market=${toParadexSymbol(symbol)}` : '';
    const response = await this.makeRequest('GET', `/orders${params}`, 'fetchOpenOrders');

    if (!Array.isArray(response.orders)) {
      throw new PerpDEXError('Invalid open orders response', 'INVALID_RESPONSE', 'paradex');
    }

    return response.orders.map(normalizeOrder);
  }

  /**
   * Fetch a specific order
   */
  async fetchOrder(orderId: string, symbol?: string): Promise<Order> {
    const response = await this.makeRequest('GET', `/orders/${orderId}`, 'fetchOrder');

    return normalizeOrder(response);
  }

  /**
   * Set leverage for a symbol
   */
  async setLeverage(symbol: string, leverage: number): Promise<void> {
    const market = toParadexSymbol(symbol);

    await this.makeRequest('POST', '/account/leverage', 'setLeverage', {
      market,
      leverage: leverage.toString(),
    });
  }

  /**
   * Fetch order history
   */
  async fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]> {
    const params = new URLSearchParams();
    if (symbol) params.append('market', toParadexSymbol(symbol));
    if (since) params.append('start_at', since.toString());
    if (limit) params.append('page_size', limit.toString());

    const queryString = params.toString();
    const response = await this.makeRequest(
      'GET',
      `/orders/history${queryString ? `?${queryString}` : ''}`,
      'fetchOrderHistory'
    );

    if (!Array.isArray(response.results)) {
      throw new PerpDEXError('Invalid order history response', 'INVALID_RESPONSE', 'paradex');
    }

    return response.results.map(normalizeOrder);
  }

  /**
   * Fetch user trade history
   */
  async fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]> {
    const params = new URLSearchParams();
    if (symbol) params.append('market', toParadexSymbol(symbol));
    if (since) params.append('start_at', since.toString());
    if (limit) params.append('page_size', limit.toString());

    const queryString = params.toString();
    const response = await this.makeRequest(
      'GET',
      `/fills${queryString ? `?${queryString}` : ''}`,
      'fetchMyTrades'
    );

    if (!Array.isArray(response.results)) {
      throw new PerpDEXError('Invalid fills response', 'INVALID_RESPONSE', 'paradex');
    }

    return response.results.map(normalizeTrade);
  }

  /**
   * Convert unified symbol to exchange format
   */
  symbolToExchange(symbol: string): string {
    return toParadexSymbol(symbol);
  }

  /**
   * Convert exchange symbol to unified format
   */
  symbolFromExchange(exchangeSymbol: string): string {
    return normalizeSymbol(exchangeSymbol);
  }

  /**
   * Make authenticated HTTP request
   */
  protected async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<any> {
    await this.rateLimiter.acquire(endpoint);

    const url = `${this.baseUrl}${path}`;
    const requestParams = { method, path, body };
    const authenticatedRequest = await this.auth.sign(requestParams);

    try {
      const response = await fetch(url, {
        method,
        headers: authenticatedRequest.headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const { code, message } = mapParadexError(error);
        throw new PerpDEXError(`Paradex API error: ${response.statusText}`, code, 'paradex', error);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof PerpDEXError) {
        throw error;
      }
      const { code, message } = mapParadexError(error);
      throw new PerpDEXError('Request failed', code, 'paradex', error);
    }
  }
}

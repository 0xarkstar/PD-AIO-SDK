/**
 * Backpack Exchange Adapter
 *
 * Centralized exchange with perpetual futures using ED25519 signatures
 */

import * as ed from '@noble/ed25519';
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
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { WebSocketManager } from '../../websocket/WebSocketManager.js';
import {
  BACKPACK_API_URLS,
  BACKPACK_RATE_LIMITS,
  BACKPACK_ENDPOINT_WEIGHTS,
} from './constants.js';
import { BackpackNormalizer } from './BackpackNormalizer.js';
import {
  toBackpackOrderType,
  toBackpackOrderSide,
  toBackpackTimeInForce,
  mapBackpackError,
} from './utils.js';
import type { BackpackConfig } from './types.js';

/**
 * Backpack adapter implementation
 */
export class BackpackAdapter extends BaseAdapter {
  readonly id = 'backpack';
  readonly name = 'Backpack';

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

  private readonly apiKey?: string;
  private readonly apiSecret?: string;
  private readonly baseUrl: string;
  private readonly wsUrl: string;
  protected readonly httpClient: HTTPClient;
  private wsManager: WebSocketManager;
  protected rateLimiter: RateLimiter;
  private normalizer: BackpackNormalizer;

  constructor(config: BackpackConfig = {}) {
    super(config);

    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;

    // Initialize normalizer
    this.normalizer = new BackpackNormalizer();

    this.rateLimiter = new RateLimiter({
      maxTokens: BACKPACK_RATE_LIMITS.rest.maxRequests,
      refillRate: BACKPACK_RATE_LIMITS.rest.maxRequests / (BACKPACK_RATE_LIMITS.rest.windowMs / 1000),
      windowMs: BACKPACK_RATE_LIMITS.rest.windowMs,
      weights: BACKPACK_ENDPOINT_WEIGHTS,
    });

    const urls = config.testnet ? BACKPACK_API_URLS.testnet : BACKPACK_API_URLS.mainnet;
    this.baseUrl = urls.rest;
    this.wsUrl = urls.websocket;

    // Initialize HTTP client
    this.httpClient = new HTTPClient({
      baseUrl: this.baseUrl,
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

    this.wsManager = new WebSocketManager({ url: this.wsUrl });
  }

  /**
   * Initialize the adapter
   */
  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new PerpDEXError('API key is required for Backpack', 'MISSING_CONFIG', 'backpack');
    }
    this._isReady = true;
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
      throw new PerpDEXError('Invalid markets response', 'INVALID_RESPONSE', 'backpack');
    }

    return response.markets.map((market: any) => this.normalizer.normalizeMarket(market));
  }

  /**
   * Fetch ticker for a symbol
   */
  async fetchTicker(symbol: string): Promise<Ticker> {
    const market = this.normalizer.toBackpackSymbol(symbol);
    const response = await this.makeRequest('GET', `/markets/${market}/ticker`, 'fetchTicker');

    return this.normalizer.normalizeTicker(response);
  }

  /**
   * Fetch order book for a symbol
   */
  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    const market = this.normalizer.toBackpackSymbol(symbol);
    const limit = params?.limit;

    const queryParams = limit ? `?depth=${limit}` : '';
    const response = await this.makeRequest(
      'GET',
      `/markets/${market}/orderbook${queryParams}`,
      'fetchOrderBook'
    );

    return this.normalizer.normalizeOrderBook(response);
  }

  /**
   * Fetch recent trades for a symbol
   */
  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    const market = this.normalizer.toBackpackSymbol(symbol);
    const limit = params?.limit ?? 100;

    const response = await this.makeRequest(
      'GET',
      `/markets/${market}/trades?limit=${limit}`,
      'fetchTrades'
    );

    if (!Array.isArray(response.trades)) {
      throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'backpack');
    }

    return response.trades.map((trade: any) => this.normalizer.normalizeTrade(trade));
  }

  /**
   * Fetch current funding rate
   */
  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    const market = this.normalizer.toBackpackSymbol(symbol);
    const response = await this.makeRequest(
      'GET',
      `/markets/${market}/funding`,
      'fetchFundingRate'
    );

    return this.normalizer.normalizeFundingRate(response);
  }

  /**
   * Fetch funding rate history
   */
  async fetchFundingRateHistory(
    symbol: string,
    since?: number,
    limit?: number
  ): Promise<FundingRate[]> {
    throw new PerpDEXError('Backpack does not support funding rate history', 'NOT_SUPPORTED', 'backpack');
  }

  /**
   * Fetch all open positions
   */
  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    const response = await this.makeRequest('GET', '/positions', 'fetchPositions');

    if (!Array.isArray(response.positions)) {
      throw new PerpDEXError('Invalid positions response', 'INVALID_RESPONSE', 'backpack');
    }

    let positions = response.positions.map((position: any) => this.normalizer.normalizePosition(position));

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
      throw new PerpDEXError('Invalid balance response', 'INVALID_RESPONSE', 'backpack');
    }

    return response.balances.map((balance: any) => this.normalizer.normalizeBalance(balance));
  }

  /**
   * Create a new order
   */
  async createOrder(order: OrderRequest): Promise<Order> {
    const market = this.normalizer.toBackpackSymbol(order.symbol);
    const orderType = toBackpackOrderType(order.type, order.postOnly);
    const side = toBackpackOrderSide(order.side);
    const timeInForce = toBackpackTimeInForce(order.timeInForce, order.postOnly);

    const payload = {
      market,
      side,
      type: orderType,
      size: order.amount.toString(),
      price: order.price?.toString(),
      time_in_force: timeInForce,
      reduce_only: order.reduceOnly ?? false,
      post_only: order.postOnly ?? false,
      client_order_id: order.clientOrderId,
    };

    const response = await this.makeRequest('POST', '/orders', 'createOrder', payload);

    return this.normalizer.normalizeOrder(response);
  }

  /**
   * Cancel an existing order
   */
  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    const response = await this.makeRequest('DELETE', `/orders/${orderId}`, 'cancelOrder');

    return this.normalizer.normalizeOrder(response);
  }

  /**
   * Cancel all orders
   */
  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    const payload = symbol ? { market: this.normalizer.toBackpackSymbol(symbol) } : {};

    const response = await this.makeRequest('DELETE', '/orders', 'cancelAllOrders', payload);

    if (!Array.isArray(response.orders)) {
      throw new PerpDEXError('Invalid cancel all orders response', 'INVALID_RESPONSE', 'backpack');
    }

    return response.orders.map((order: any) => this.normalizer.normalizeOrder(order));
  }

  /**
   * Fetch open orders
   */
  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    const params = symbol ? `?market=${this.normalizer.toBackpackSymbol(symbol)}` : '';
    const response = await this.makeRequest('GET', `/orders${params}`, 'fetchOpenOrders');

    if (!Array.isArray(response.orders)) {
      throw new PerpDEXError('Invalid open orders response', 'INVALID_RESPONSE', 'backpack');
    }

    return response.orders.map((order: any) => this.normalizer.normalizeOrder(order));
  }

  /**
   * Fetch a specific order
   */
  async fetchOrder(orderId: string, symbol?: string): Promise<Order> {
    const response = await this.makeRequest('GET', `/orders/${orderId}`, 'fetchOrder');

    return this.normalizer.normalizeOrder(response);
  }

  /**
   * Set leverage for a symbol
   */
  async setLeverage(symbol: string, leverage: number): Promise<void> {
    const market = this.normalizer.toBackpackSymbol(symbol);

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
    if (symbol) params.append('symbol', this.normalizer.toBackpackSymbol(symbol));
    if (since) params.append('startTime', since.toString());
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const response = await this.makeRequest(
      'GET',
      `/history/orders${queryString ? `?${queryString}` : ''}`,
      'fetchOrderHistory'
    );

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid order history response', 'INVALID_RESPONSE', 'backpack');
    }

    return response.map((order: any) => this.normalizer.normalizeOrder(order));
  }

  /**
   * Fetch user trade history
   */
  async fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]> {
    const params = new URLSearchParams();
    if (symbol) params.append('symbol', this.normalizer.toBackpackSymbol(symbol));
    if (since) params.append('startTime', since.toString());
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const response = await this.makeRequest(
      'GET',
      `/fills${queryString ? `?${queryString}` : ''}`,
      'fetchMyTrades'
    );

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid fills response', 'INVALID_RESPONSE', 'backpack');
    }

    return response.map((trade: any) => this.normalizer.normalizeTrade(trade));
  }

  /**
   * Convert unified symbol to exchange format
   */
  symbolToExchange(symbol: string): string {
    return this.normalizer.toBackpackSymbol(symbol);
  }

  /**
   * Convert exchange symbol to unified format
   */
  symbolFromExchange(exchangeSymbol: string): string {
    return this.normalizer.normalizeSymbol(exchangeSymbol);
  }

  /**
   * Make authenticated HTTP request using HTTPClient
   */
  protected async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<any> {
    await this.rateLimiter.acquire(endpoint);

    const headers: Record<string, string> = {};

    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
    }

    if (this.apiSecret) {
      const timestamp = Date.now().toString();
      headers['X-Timestamp'] = timestamp;
      headers['X-Signature'] = await this.signRequest(method, path, timestamp, body);
    }

    try {
      switch (method) {
        case 'GET':
          return await this.httpClient.get(path, { headers });
        case 'POST':
          return await this.httpClient.post(path, { headers, body });
        case 'PUT':
          return await this.httpClient.put(path, { headers, body });
        case 'DELETE':
          return await this.httpClient.delete(path, { headers, body });
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
    } catch (error) {
      if (error instanceof PerpDEXError) {
        throw error;
      }
      const { code, message } = mapBackpackError(error);
      throw new PerpDEXError('Request failed', code, 'backpack', error);
    }
  }

  /**
   * Sign request with ED25519 signature
   */
  private async signRequest(
    method: string,
    path: string,
    timestamp: string,
    body?: Record<string, unknown>
  ): Promise<string> {
    if (!this.apiSecret) {
      return '';
    }

    try {
      // Create message to sign
      const message = `${method}${path}${timestamp}${body ? JSON.stringify(body) : ''}`;
      const messageBytes = new TextEncoder().encode(message);

      // Convert private key from hex string to Uint8Array
      const privateKeyHex = this.apiSecret.startsWith('0x') ? this.apiSecret.slice(2) : this.apiSecret;
      const privateKey = Uint8Array.from(Buffer.from(privateKeyHex, 'hex'));

      // Sign the message with ED25519
      const signature = await ed.signAsync(messageBytes, privateKey);

      // Return signature as hex string
      return Buffer.from(signature).toString('hex');
    } catch (error) {
      throw new PerpDEXError(
        `Failed to sign request: ${error instanceof Error ? error.message : String(error)}`,
        'SIGNATURE_ERROR',
        'backpack'
      );
    }
  }
}

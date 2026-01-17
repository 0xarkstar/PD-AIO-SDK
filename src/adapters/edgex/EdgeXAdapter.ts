/**
 * EdgeX Exchange Adapter
 *
 * StarkEx-based perpetual DEX with Pedersen hash signatures
 */

import { ec, hash } from 'starknet';
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
  EDGEX_API_URLS,
  EDGEX_RATE_LIMITS,
  EDGEX_ENDPOINT_WEIGHTS,
} from './constants.js';
import { EdgeXNormalizer } from './EdgeXNormalizer.js';
import {
  toEdgeXOrderType,
  toEdgeXOrderSide,
  toEdgeXTimeInForce,
  mapEdgeXError,
} from './utils.js';
import type { EdgeXConfig } from './types.js';

/**
 * EdgeX adapter implementation
 */
export class EdgeXAdapter extends BaseAdapter {
  readonly id = 'edgex';
  readonly name = 'EdgeX';

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
  private wsManager: WebSocketManager;
  protected rateLimiter: RateLimiter;
  private normalizer: EdgeXNormalizer;

  constructor(config: EdgeXConfig = {}) {
    super(config);

    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;

    // Initialize normalizer
    this.normalizer = new EdgeXNormalizer();

    this.rateLimiter = new RateLimiter({
      maxTokens: EDGEX_RATE_LIMITS.rest.maxRequests,
      refillRate: EDGEX_RATE_LIMITS.rest.maxRequests / (EDGEX_RATE_LIMITS.rest.windowMs / 1000),
      windowMs: EDGEX_RATE_LIMITS.rest.windowMs,
      weights: EDGEX_ENDPOINT_WEIGHTS,
    });

    const urls = config.testnet ? EDGEX_API_URLS.testnet : EDGEX_API_URLS.mainnet;
    this.baseUrl = urls.rest;
    this.wsUrl = urls.websocket;

    this.wsManager = new WebSocketManager({ url: this.wsUrl });
  }

  /**
   * Initialize the adapter
   */
  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new PerpDEXError('API key is required for EdgeX', 'MISSING_CONFIG', 'edgex');
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
      throw new PerpDEXError('Invalid markets response', 'INVALID_RESPONSE', 'edgex');
    }

    return response.markets.map((market: any) => this.normalizer.normalizeMarket(market));
  }

  /**
   * Fetch ticker for a symbol
   */
  async fetchTicker(symbol: string): Promise<Ticker> {
    const market = this.normalizer.toEdgeXSymbol(symbol);
    const response = await this.makeRequest('GET', `/markets/${market}/ticker`, 'fetchTicker');

    return this.normalizer.normalizeTicker(response);
  }

  /**
   * Fetch order book for a symbol
   */
  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    const market = this.normalizer.toEdgeXSymbol(symbol);
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
    const market = this.normalizer.toEdgeXSymbol(symbol);
    const limit = params?.limit ?? 100;

    const response = await this.makeRequest(
      'GET',
      `/markets/${market}/trades?limit=${limit}`,
      'fetchTrades'
    );

    if (!Array.isArray(response.trades)) {
      throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'edgex');
    }

    return response.trades.map((trade: any) => this.normalizer.normalizeTrade(trade));
  }

  /**
   * Fetch current funding rate
   */
  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    const market = this.normalizer.toEdgeXSymbol(symbol);
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
    throw new PerpDEXError('EdgeX does not support funding rate history', 'NOT_SUPPORTED', 'edgex');
  }

  /**
   * Fetch all open positions
   */
  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    const response = await this.makeRequest('GET', '/positions', 'fetchPositions');

    if (!Array.isArray(response.positions)) {
      throw new PerpDEXError('Invalid positions response', 'INVALID_RESPONSE', 'edgex');
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
      throw new PerpDEXError('Invalid balance response', 'INVALID_RESPONSE', 'edgex');
    }

    return response.balances.map((balance: any) => this.normalizer.normalizeBalance(balance));
  }

  /**
   * Create a new order
   */
  async createOrder(order: OrderRequest): Promise<Order> {
    const market = this.normalizer.toEdgeXSymbol(order.symbol);
    const orderType = toEdgeXOrderType(order.type);
    const side = toEdgeXOrderSide(order.side);
    const timeInForce = toEdgeXTimeInForce(order.timeInForce);

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
    const payload = symbol ? { market: this.normalizer.toEdgeXSymbol(symbol) } : {};

    const response = await this.makeRequest('DELETE', '/orders', 'cancelAllOrders', payload);

    if (!Array.isArray(response.orders)) {
      throw new PerpDEXError('Invalid cancel all orders response', 'INVALID_RESPONSE', 'edgex');
    }

    return response.orders.map((order: any) => this.normalizer.normalizeOrder(order));
  }

  /**
   * Fetch open orders
   */
  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    const params = symbol ? `?market=${this.normalizer.toEdgeXSymbol(symbol)}` : '';
    const response = await this.makeRequest('GET', `/orders${params}`, 'fetchOpenOrders');

    if (!Array.isArray(response.orders)) {
      throw new PerpDEXError('Invalid open orders response', 'INVALID_RESPONSE', 'edgex');
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
    const market = this.normalizer.toEdgeXSymbol(symbol);

    await this.makeRequest('POST', '/account/leverage', 'setLeverage', {
      market,
      leverage: leverage.toString(),
    });
  }

  /**
   * Fetch order history
   * Note: Not currently implemented - EdgeX API documentation required
   */
  async fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]> {
    throw new PerpDEXError(
      'NOT_IMPLEMENTED: fetchOrderHistory not yet implemented for EdgeX - API documentation required',
      'NOT_IMPLEMENTED',
      'edgex'
    );
  }

  /**
   * Fetch user trade history
   * Note: Not currently implemented - EdgeX API documentation required
   */
  async fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]> {
    throw new PerpDEXError(
      'fetchMyTrades not yet implemented for EdgeX',
      'NOT_IMPLEMENTED',
      'edgex'
    );
  }

  /**
   * Convert unified symbol to exchange format
   */
  symbolToExchange(symbol: string): string {
    return this.normalizer.toEdgeXSymbol(symbol);
  }

  /**
   * Convert exchange symbol to unified format
   */
  symbolFromExchange(exchangeSymbol: string): string {
    return this.normalizer.normalizeSymbol(exchangeSymbol);
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
    }

    if (this.apiSecret) {
      const timestamp = Date.now().toString();
      headers['X-Timestamp'] = timestamp;
      headers['X-Signature'] = await this.signRequest(method, path, timestamp, body);
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const { code, message } = mapEdgeXError(error);
        throw new PerpDEXError(`EdgeX API error: ${response.statusText}`, code, 'edgex', error);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof PerpDEXError) {
        throw error;
      }
      const { code, message } = mapEdgeXError(error);
      throw new PerpDEXError('Request failed', code, 'edgex', error);
    }
  }

  /**
   * Sign request with StarkEx ECDSA signature
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

      // Hash the message using Pedersen hash (StarkEx standard)
      const messageHash = hash.computeHashOnElements([message]);

      // Sign with StarkEx ECDSA
      const signature = ec.starkCurve.sign(messageHash, this.apiSecret);

      // Return signature in hex format: r,s
      return `0x${signature.r.toString(16)},0x${signature.s.toString(16)}`;
    } catch (error) {
      throw new PerpDEXError(
        `Failed to sign StarkEx request: ${error instanceof Error ? error.message : String(error)}`,
        'SIGNATURE_ERROR',
        'edgex'
      );
    }
  }
}

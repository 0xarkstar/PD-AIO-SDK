/**
 * Variational Exchange Adapter
 *
 * Arbitrum-based RFQ perpetual DEX adapter
 *
 * ## Implementation Status: FULLY FUNCTIONAL 🟢
 *
 * Variational is an RFQ (Request For Quote) based perpetual DEX on Arbitrum.
 * This adapter supports public market data, trading, and account operations.
 *
 * ### Currently Implemented
 *
 * **Public API:**
 * - ✅ `fetchMarkets()` - Get available trading pairs
 * - ✅ `fetchTicker(symbol)` - Get price information for a symbol
 * - ✅ `fetchOrderBook(symbol)` - Get RFQ quotes as order book
 * - ✅ `fetchFundingRate(symbol)` - Get current funding rate
 *
 * **Trading API (requires API credentials):**
 * - ✅ `createOrder(request)` - Create a new order
 * - ✅ `cancelOrder(orderId)` - Cancel an order
 * - ✅ `cancelAllOrders(symbol?)` - Cancel all orders
 *
 * **Account API (requires API credentials):**
 * - ✅ `fetchPositions(symbols?)` - Get open positions
 * - ✅ `fetchBalance()` - Get account balances
 * - ✅ `fetchOrderHistory(symbol?, since?, limit?)` - Get order history
 * - ✅ `fetchMyTrades(symbol?, since?, limit?)` - Get user trades
 *
 * **RFQ-Specific Methods:**
 * - ✅ `requestQuote(symbol, side, amount)` - Request quotes from market makers
 * - ✅ `acceptQuote(quoteId)` - Accept a quote and execute trade
 *
 * ### Not Yet Implemented
 * - ❌ Public API: fetchTrades, fetchFundingRateHistory
 * - ❌ WebSocket: All streaming methods
 *
 * ### RFQ Order Book Note
 * Unlike traditional order book exchanges, Variational uses an RFQ model.
 * The "order book" is constructed from quotes at different notional sizes
 * ($1k, $100k, $1M), representing available liquidity at each price level.
 *
 * ### Usage
 * ```typescript
 * const adapter = createExchange('variational', {
 *   apiKey: 'your-api-key',
 *   apiSecret: 'your-api-secret',
 *   testnet: true,
 * });
 * await adapter.initialize();
 *
 * // Public API:
 * const markets = await adapter.fetchMarkets();
 * const ticker = await adapter.fetchTicker('BTC/USDC:USDC');
 * const orderbook = await adapter.fetchOrderBook('BTC/USDC:USDC');
 *
 * // Account API:
 * const positions = await adapter.fetchPositions();
 * const balance = await adapter.fetchBalance();
 * const history = await adapter.fetchOrderHistory();
 *
 * // RFQ Trading:
 * const quotes = await adapter.requestQuote('BTC/USDC:USDC', 'buy', 0.1);
 * const order = await adapter.acceptQuote(quotes[0].quoteId);
 *
 * // Standard Trading:
 * const order = await adapter.createOrder({
 *   symbol: 'BTC/USDC:USDC',
 *   type: 'limit',
 *   side: 'buy',
 *   amount: 0.1,
 *   price: 95000,
 * });
 * ```
 *
 * @see https://variational.io/ - Variational official website
 */

import { createHmacSha256 } from '../../utils/crypto.js';
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
  Transaction,
  UserFees,
  Portfolio,
  RateLimitStatus,
} from '../../types/common.js';
import type { FeatureMap } from '../../types/adapter.js';
import { PerpDEXError } from '../../types/errors.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { WebSocketManager } from '../../websocket/WebSocketManager.js';
import {
  VARIATIONAL_API_URLS,
  VARIATIONAL_ENDPOINTS,
  VARIATIONAL_RATE_LIMITS,
  VARIATIONAL_ENDPOINT_WEIGHTS,
  VARIATIONAL_DEFAULTS,
} from './constants.js';
import { VariationalNormalizer } from './VariationalNormalizer.js';
import {
  convertOrderRequest,
  mapError,
  validateOrderRequest,
  generateClientOrderId,
} from './utils.js';
import type {
  VariationalOrder,
  VariationalPosition,
  VariationalBalance,
  VariationalTrade,
  VariationalQuote,
} from './types.js';

/**
 * Variational adapter configuration
 */
export interface VariationalConfig {
  apiKey?: string;
  apiSecret?: string;
  testnet?: boolean;
  timeout?: number;
  rateLimitTier?: 'perIp' | 'global' | 'default';
}

/**
 * Variational exchange adapter
 *
 * RFQ-based perpetual DEX on Arbitrum with HMAC-SHA256 authentication
 */
export class VariationalAdapter extends BaseAdapter {
  readonly id = 'variational';
  readonly name = 'Variational';

  readonly has: Partial<FeatureMap> = {
    // Public API (Available)
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true, // RFQ-based order book from quotes
    fetchFundingRate: true, // From metadata/stats

    // Public API (Not yet implemented/documented)
    fetchTrades: false, // No trades endpoint for RFQ DEX
    fetchFundingRateHistory: false,

    // Trading API (Implemented - requires API endpoint availability)
    createOrder: true,
    cancelOrder: true,
    cancelAllOrders: true,
    createBatchOrders: false, // Not supported natively
    cancelBatchOrders: false, // Not supported natively
    editOrder: false, // Not supported

    // Account API (Implemented)
    fetchPositions: true,
    fetchBalance: true,
    fetchOrderHistory: true,
    fetchMyTrades: true,
    fetchOpenOrders: false, // Not yet implemented
    fetchUserFees: false,
    fetchPortfolio: false,
    setLeverage: false, // Not supported
    setMarginMode: false, // Not supported
    fetchDeposits: false, // Not supported
    fetchWithdrawals: false, // Not supported

    // WebSocket (Not yet available)
    watchOrderBook: false,
    watchTrades: false,
    watchTicker: false,
    watchPositions: false,
    watchOrders: false,
    watchBalance: false,
  };

  private readonly apiUrl: string;
  private readonly apiKey?: string;
  private readonly apiSecret?: string;
  protected readonly rateLimiter: RateLimiter;
  protected readonly httpClient: HTTPClient;
  private readonly normalizer: VariationalNormalizer;
  private wsManager: WebSocketManager | null = null;

  constructor(config: VariationalConfig = {}) {
    super(config);

    const testnet = config.testnet ?? false;
    const urls = testnet ? VARIATIONAL_API_URLS.testnet : VARIATIONAL_API_URLS.mainnet;

    this.apiUrl = urls.rest;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;

    this.normalizer = new VariationalNormalizer();

    const tier = config.rateLimitTier ?? VARIATIONAL_DEFAULTS.rateLimitTier;
    const limits = VARIATIONAL_RATE_LIMITS[tier];

    this.rateLimiter = new RateLimiter({
      maxTokens: limits.maxRequests,
      refillRate: limits.maxRequests / (limits.windowMs / 1000),
      windowMs: limits.windowMs,
      weights: VARIATIONAL_ENDPOINT_WEIGHTS,
    });

    this.httpClient = new HTTPClient({
      baseUrl: this.apiUrl,
      timeout: config.timeout || VARIATIONAL_DEFAULTS.timeout,
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
    this._isReady = true;
    this._isDisconnected = false;
    this.info('Variational adapter initialized');
  }

  async disconnect(): Promise<void> {
    if (this.wsManager) {
      await this.wsManager.disconnect();
      this.wsManager = null;
    }
    this._isReady = false;
    this._isDisconnected = true;
    this.info('Variational adapter disconnected');
  }

  // ==================== Symbol Conversion Methods ====================

  /**
   * Convert unified symbol to Variational format
   */
  protected symbolToExchange(symbol: string): string {
    return this.normalizer.symbolFromCCXT(symbol);
  }

  /**
   * Convert Variational symbol to unified format
   */
  protected symbolFromExchange(exchangeSymbol: string): string {
    return this.normalizer.symbolToCCXT(exchangeSymbol);
  }

  // ==================== Market Data Methods ====================

  async fetchMarkets(_params?: MarketParams): Promise<Market[]> {
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.METADATA_STATS);

    try {
      const response = await this.httpClient.get<{ listings: any[] }>(
        VARIATIONAL_ENDPOINTS.METADATA_STATS,
        {}
      );

      const listings = response.listings || [];
      return this.normalizer.normalizeMarketsFromListings(listings);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.METADATA_STATS);

    if (!symbol) {
      throw new PerpDEXError('Symbol is required', 'INVALID_SYMBOL', this.id);
    }

    try {
      // Extract ticker from unified symbol format (e.g., "BTC/USDC:USDC" -> "BTC")
      const ticker = symbol.split('/')[0];

      const response = await this.httpClient.get<{ listings: any[] }>(
        VARIATIONAL_ENDPOINTS.METADATA_STATS,
        {}
      );

      const listings = response.listings || [];
      const listing = listings.find((l: any) => l.ticker === ticker);

      if (!listing) {
        throw new PerpDEXError(`Market not found: ${symbol}`, 'NOT_FOUND', this.id);
      }

      return this.normalizer.normalizeTickerFromListing(listing);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchOrderBook(symbol: string, _params?: OrderBookParams): Promise<OrderBook> {
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.METADATA_STATS);

    if (!symbol) {
      throw new PerpDEXError('Symbol is required', 'INVALID_SYMBOL', this.id);
    }

    try {
      // Extract ticker from unified symbol format (e.g., "BTC/USDC:USDC" -> "BTC")
      const ticker = symbol.split('/')[0];

      const response = await this.httpClient.get<{ listings: any[] }>(
        VARIATIONAL_ENDPOINTS.METADATA_STATS,
        {}
      );

      const listings = response.listings || [];
      const listing = listings.find((l: any) => l.ticker === ticker);

      if (!listing) {
        throw new PerpDEXError(`Market not found: ${symbol}`, 'NOT_FOUND', this.id);
      }

      // Variational is an RFQ DEX - order book is constructed from quotes at different sizes
      return this.normalizer.normalizeOrderBookFromListing(listing);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchTrades(_symbol: string, _params?: TradeParams): Promise<Trade[]> {
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.TRADES);
    throw new PerpDEXError('fetchTrades not implemented', 'NOT_IMPLEMENTED', this.id);
  }

  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.METADATA_STATS);

    if (!symbol) {
      throw new PerpDEXError('Symbol is required', 'INVALID_SYMBOL', this.id);
    }

    try {
      // Extract ticker from unified symbol format (e.g., "BTC/USDC:USDC" -> "BTC")
      const ticker = symbol.split('/')[0];

      const response = await this.httpClient.get<{ listings: any[] }>(
        VARIATIONAL_ENDPOINTS.METADATA_STATS,
        {}
      );

      const listings = response.listings || [];
      const listing = listings.find((l: any) => l.ticker === ticker);

      if (!listing) {
        throw new PerpDEXError(`Market not found: ${symbol}`, 'NOT_FOUND', this.id);
      }

      return this.normalizer.normalizeFundingRateFromListing(listing);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchFundingRateHistory(
    _symbol: string,
    _since?: number,
    _limit?: number
  ): Promise<FundingRate[]> {
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.FUNDING_HISTORY);
    throw new PerpDEXError('fetchFundingRateHistory not implemented', 'NOT_IMPLEMENTED', this.id);
  }

  // ==================== Trading Methods ====================

  async createOrder(request: OrderRequest): Promise<Order> {
    this.ensureAuthenticated();
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.CREATE_ORDER);

    validateOrderRequest(request);

    try {
      const orderRequest = convertOrderRequest(request);
      orderRequest.clientOrderId = orderRequest.clientOrderId || generateClientOrderId();

      // Convert symbol to Variational format
      orderRequest.symbol = this.symbolToExchange(request.symbol);

      const response = await this.authenticatedRequest<VariationalOrder>(
        'POST',
        VARIATIONAL_ENDPOINTS.CREATE_ORDER,
        orderRequest as unknown as Record<string, unknown>
      );

      return this.normalizer.normalizeOrder(response);
    } catch (error) {
      throw mapError(error);
    }
  }

  async cancelOrder(orderId: string, _symbol?: string): Promise<Order> {
    this.ensureAuthenticated();
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.CANCEL_ORDER);

    if (!orderId) {
      throw new PerpDEXError('Order ID is required', 'INVALID_ORDER_ID', this.id);
    }

    try {
      const endpoint = VARIATIONAL_ENDPOINTS.CANCEL_ORDER.replace('{orderId}', orderId);
      const response = await this.authenticatedRequest<VariationalOrder>('DELETE', endpoint);

      return this.normalizer.normalizeOrder(response);
    } catch (error) {
      throw mapError(error);
    }
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    this.ensureAuthenticated();
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.CANCEL_ALL_ORDERS);

    try {
      const body = symbol ? { symbol: this.symbolToExchange(symbol) } : undefined;
      const response = await this.authenticatedRequest<{ orders: VariationalOrder[] }>(
        'DELETE',
        VARIATIONAL_ENDPOINTS.CANCEL_ALL_ORDERS,
        body
      );

      return this.normalizer.normalizeOrders(response.orders || []);
    } catch (error) {
      throw mapError(error);
    }
  }

  async createBatchOrders(_requests: OrderRequest[]): Promise<Order[]> {
    // Variational doesn't support batch orders natively
    // Use sequential execution through BaseAdapter
    throw new PerpDEXError('createBatchOrders not supported', 'NOT_SUPPORTED', this.id);
  }

  async cancelBatchOrders(_orderIds: string[], _symbol?: string): Promise<Order[]> {
    // Variational doesn't support batch cancellations natively
    throw new PerpDEXError('cancelBatchOrders not supported', 'NOT_SUPPORTED', this.id);
  }

  // ==================== Account Methods ====================

  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    this.ensureAuthenticated();
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.POSITIONS);

    try {
      const response = await this.authenticatedRequest<{ positions: VariationalPosition[] }>(
        'GET',
        VARIATIONAL_ENDPOINTS.POSITIONS
      );

      let positions = this.normalizer.normalizePositions(response.positions || []);

      // Filter by symbols if provided
      if (symbols && symbols.length > 0) {
        positions = positions.filter((p) => symbols.includes(p.symbol));
      }

      return positions;
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchBalance(): Promise<Balance[]> {
    this.ensureAuthenticated();
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.BALANCE);

    try {
      const response = await this.authenticatedRequest<{ balances: VariationalBalance[] }>(
        'GET',
        VARIATIONAL_ENDPOINTS.BALANCE
      );

      return this.normalizer.normalizeBalances(response.balances || []);
    } catch (error) {
      throw mapError(error);
    }
  }

  async setLeverage(_symbol: string, _leverage: number): Promise<void> {
    throw new PerpDEXError('setLeverage not supported', 'NOT_SUPPORTED', this.id);
  }

  async setMarginMode(_symbol: string, _marginMode: 'cross' | 'isolated'): Promise<void> {
    throw new PerpDEXError('setMarginMode not supported', 'NOT_SUPPORTED', this.id);
  }

  async fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]> {
    this.ensureAuthenticated();
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.ORDER_HISTORY);

    try {
      const params: Record<string, string> = {};
      if (symbol) {
        params.symbol = this.symbolToExchange(symbol);
      }
      if (since) {
        params.since = since.toString();
      }
      if (limit) {
        params.limit = limit.toString();
      }

      // Build query string
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      const endpoint = queryString
        ? `${VARIATIONAL_ENDPOINTS.ORDER_HISTORY}?${queryString}`
        : VARIATIONAL_ENDPOINTS.ORDER_HISTORY;

      const response = await this.authenticatedRequest<{ orders: VariationalOrder[] }>(
        'GET',
        endpoint
      );

      return this.normalizer.normalizeOrders(response.orders || []);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]> {
    this.ensureAuthenticated();
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.USER_TRADES);

    try {
      const params: Record<string, string> = {};
      if (symbol) {
        params.symbol = this.symbolToExchange(symbol);
      }
      if (since) {
        params.since = since.toString();
      }
      if (limit) {
        params.limit = limit.toString();
      }

      // Build query string
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      const endpoint = queryString
        ? `${VARIATIONAL_ENDPOINTS.USER_TRADES}?${queryString}`
        : VARIATIONAL_ENDPOINTS.USER_TRADES;

      const response = await this.authenticatedRequest<{ trades: VariationalTrade[] }>(
        'GET',
        endpoint
      );

      return this.normalizer.normalizeTrades(response.trades || []);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchDeposits(
    _currency?: string,
    _since?: number,
    _limit?: number
  ): Promise<Transaction[]> {
    throw new PerpDEXError('fetchDeposits not supported', 'NOT_SUPPORTED', this.id);
  }

  async fetchWithdrawals(
    _currency?: string,
    _since?: number,
    _limit?: number
  ): Promise<Transaction[]> {
    throw new PerpDEXError('fetchWithdrawals not supported', 'NOT_SUPPORTED', this.id);
  }

  async fetchUserFees(): Promise<UserFees> {
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.USER_FEES);
    throw new PerpDEXError('fetchUserFees not implemented', 'NOT_IMPLEMENTED', this.id);
  }

  async fetchPortfolio(): Promise<Portfolio> {
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.PORTFOLIO);
    throw new PerpDEXError('fetchPortfolio not implemented', 'NOT_IMPLEMENTED', this.id);
  }

  async fetchRateLimitStatus(): Promise<RateLimitStatus> {
    throw new PerpDEXError('fetchRateLimitStatus not implemented', 'NOT_IMPLEMENTED', this.id);
  }

  // ==================== WebSocket Methods ====================

  async *watchOrderBook(_symbol: string, _limit?: number): AsyncGenerator<OrderBook> {
    throw new PerpDEXError('watchOrderBook not implemented', 'NOT_IMPLEMENTED', this.id);
  }

  async *watchTrades(_symbol: string): AsyncGenerator<Trade> {
    throw new PerpDEXError('watchTrades not implemented', 'NOT_IMPLEMENTED', this.id);
  }

  async *watchTicker(_symbol: string): AsyncGenerator<Ticker> {
    throw new PerpDEXError('watchTicker not implemented', 'NOT_IMPLEMENTED', this.id);
  }

  async *watchPositions(): AsyncGenerator<Position[]> {
    throw new PerpDEXError('watchPositions not implemented', 'NOT_IMPLEMENTED', this.id);
  }

  async *watchOrders(): AsyncGenerator<Order[]> {
    throw new PerpDEXError('watchOrders not implemented', 'NOT_IMPLEMENTED', this.id);
  }

  async *watchBalance(): AsyncGenerator<Balance[]> {
    throw new PerpDEXError('watchBalance not implemented', 'NOT_IMPLEMENTED', this.id);
  }

  async *watchFundingRate(_symbol: string): AsyncGenerator<FundingRate> {
    throw new PerpDEXError('watchFundingRate not implemented', 'NOT_IMPLEMENTED', this.id);
  }

  // ==================== RFQ-Specific Methods ====================

  /**
   * Request quotes from market makers (RFQ-specific)
   *
   * This method requests quotes from Variational's market makers for a specific
   * trade size. The quotes will expire after a short period (typically 10 seconds).
   *
   * @param symbol - Trading pair in unified format (e.g., "BTC/USDC:USDC")
   * @param side - Trade direction ('buy' or 'sell')
   * @param amount - Trade size in base currency
   * @returns Array of quotes from market makers
   */
  async requestQuote(
    symbol: string,
    side: 'buy' | 'sell',
    amount: number
  ): Promise<VariationalQuote[]> {
    this.ensureAuthenticated();
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.REQUEST_QUOTE);

    if (!symbol) {
      throw new PerpDEXError('Symbol is required', 'INVALID_SYMBOL', this.id);
    }

    if (!['buy', 'sell'].includes(side)) {
      throw new PerpDEXError('Invalid order side', 'INVALID_ORDER_SIDE', this.id);
    }

    if (!amount || amount <= 0) {
      throw new PerpDEXError('Amount must be greater than 0', 'INVALID_AMOUNT', this.id);
    }

    try {
      const request = {
        symbol: this.symbolToExchange(symbol),
        side,
        amount: amount.toString(),
      };

      const response = await this.authenticatedRequest<{ quotes: VariationalQuote[] }>(
        'POST',
        VARIATIONAL_ENDPOINTS.REQUEST_QUOTE,
        request
      );

      return response.quotes || [];
    } catch (error) {
      throw mapError(error);
    }
  }

  /**
   * Accept a quote and execute trade (RFQ-specific)
   *
   * After receiving quotes from requestQuote(), use this method to accept
   * a specific quote and execute the trade. The quote must not be expired.
   *
   * @param quoteId - The ID of the quote to accept
   * @returns The resulting order from accepting the quote
   */
  async acceptQuote(quoteId: string): Promise<Order> {
    this.ensureAuthenticated();
    await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.ACCEPT_QUOTE);

    if (!quoteId) {
      throw new PerpDEXError('Quote ID is required', 'INVALID_QUOTE_ID', this.id);
    }

    try {
      const endpoint = VARIATIONAL_ENDPOINTS.ACCEPT_QUOTE.replace('{quoteId}', quoteId);
      const response = await this.authenticatedRequest<VariationalOrder>('POST', endpoint);

      return this.normalizer.normalizeOrder(response);
    } catch (error) {
      throw mapError(error);
    }
  }

  // ==================== Private Helper Methods ====================

  /**
   * Ensure API credentials are configured
   */
  private ensureAuthenticated(): void {
    if (!this.apiKey || !this.apiSecret) {
      throw new PerpDEXError(
        'API credentials required for this operation',
        'AUTHENTICATION_REQUIRED',
        this.id
      );
    }
  }

  /**
   * Generate HMAC-SHA256 signature for authenticated requests
   * Note: This is now async to support browser Web Crypto API
   */
  private async generateSignature(
    method: string,
    path: string,
    timestamp: string,
    body?: Record<string, unknown>
  ): Promise<string> {
    if (!this.apiSecret) {
      throw new PerpDEXError(
        'API secret required for authentication',
        'MISSING_API_SECRET',
        this.id
      );
    }

    const message = `${timestamp}${method}${path}${body ? JSON.stringify(body) : ''}`;
    return createHmacSha256(this.apiSecret, message);
  }

  /**
   * Make an authenticated request to the Variational API
   *
   * All authenticated requests include:
   * - X-API-Key: The API key
   * - X-Timestamp: Unix timestamp in milliseconds
   * - X-Signature: HMAC-SHA256 signature
   */
  private async authenticatedRequest<T>(
    method: 'GET' | 'POST' | 'DELETE' | 'PUT',
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const timestamp = Date.now().toString();
    const signature = await this.generateSignature(method, path, timestamp, body);

    const headers = {
      'X-API-Key': this.apiKey!,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
    };

    const options = {
      headers,
      body,
    };

    try {
      let response: T;

      switch (method) {
        case 'GET':
          response = await this.httpClient.get<T>(path, { headers });
          break;
        case 'POST':
          response = await this.httpClient.post<T>(path, options);
          break;
        case 'DELETE':
          response = await this.httpClient.delete<T>(path, options);
          break;
        case 'PUT':
          response = await this.httpClient.put<T>(path, options);
          break;
        default:
          throw new PerpDEXError(
            `Unsupported HTTP method: ${String(method)}`,
            'INVALID_REQUEST',
            this.id
          );
      }

      return response;
    } catch (error) {
      throw mapError(error);
    }
  }
}

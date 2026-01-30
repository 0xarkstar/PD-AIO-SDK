/**
 * Extended Exchange Adapter
 *
 * StarkNet-based hybrid CLOB perpetual DEX adapter
 *
 * ## Implementation Status
 *
 * ### Fully Implemented ✅
 * - **Market Data**: fetchMarkets, fetchTicker, fetchOrderBook, fetchTrades, fetchFundingRate
 * - **Trading**: createOrder, cancelOrder, cancelAllOrders, createBatchOrders, cancelBatchOrders
 * - **Account**: fetchPositions, fetchBalance, fetchOrderHistory, fetchMyTrades, fetchUserFees
 * - **Leverage**: setLeverage (up to 100x), setMarginMode (cross/isolated)
 *
 * ### Not Implemented ❌ - WebSocket Streaming
 * WebSocket streaming is **NOT YET IMPLEMENTED** for Extended exchange.
 * All watch* methods will throw `NOT_IMPLEMENTED` errors:
 * - `watchOrderBook()` - ❌ Not implemented
 * - `watchTrades()` - ❌ Not implemented
 * - `watchTicker()` - ❌ Not implemented
 * - `watchPositions()` - ❌ Not implemented
 * - `watchOrders()` - ❌ Not implemented
 * - `watchBalance()` - ❌ Not implemented
 * - `watchFundingRate()` - ❌ Not implemented
 *
 * For real-time data, use polling with REST API methods instead.
 *
 * ### Example Usage
 * ```typescript
 * const adapter = createExchange('extended', {
 *   apiKey: 'your-api-key',
 *   starknetPrivateKey: '0x...',
 *   starknetAccountAddress: '0x...',
 *   testnet: true
 * });
 * await adapter.initialize();
 *
 * // REST API (works)
 * const markets = await adapter.fetchMarkets();
 * const order = await adapter.createOrder({ ... });
 *
 * // WebSocket (throws NOT_IMPLEMENTED)
 * for await (const ob of adapter.watchOrderBook('BTC/USDT:USDT')) { } // ❌
 * ```
 */

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
  EXTENDED_API_URLS,
  EXTENDED_ENDPOINTS,
  EXTENDED_RATE_LIMITS,
  EXTENDED_ENDPOINT_WEIGHTS,
  EXTENDED_WS_CONFIG,
  EXTENDED_DEFAULTS,
  EXTENDED_LEVERAGE_TIERS,
} from './constants.js';
import { ExtendedNormalizer } from './ExtendedNormalizer.js';
import { ExtendedStarkNetClient } from './ExtendedStarkNetClient.js';
import {
  convertOrderRequest,
  mapError,
  validateOrderRequest,
  validateLeverage,
  generateClientOrderId,
} from './utils.js';
import type {
  ExtendedMarket,
  ExtendedOrder,
  ExtendedPosition,
  ExtendedBalance,
  ExtendedOrderBook,
  ExtendedTrade,
  ExtendedTicker,
  ExtendedFundingRate,
} from './types.js';

/**
 * Extended adapter configuration
 *
 * Extended is a hybrid CLOB DEX on StarkNet supporting up to 100x leverage.
 *
 * Authentication:
 * - apiKey: Required for trading and account data (createOrder, fetchBalance, etc.)
 * - starknetPrivateKey + starknetAccountAddress: Optional, for on-chain StarkNet transactions
 *
 * Note: Market data methods (fetchMarkets, fetchTicker, etc.) work without authentication.
 */
export interface ExtendedConfig {
  /** API key for trading and account access (required for authenticated endpoints) */
  apiKey?: string;
  /** Use testnet environment (default: false) */
  testnet?: boolean;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** StarkNet private key for on-chain transactions (optional) */
  starknetPrivateKey?: string;
  /** StarkNet account address (required if starknetPrivateKey is provided) */
  starknetAccountAddress?: string;
  /** Custom StarkNet RPC URL */
  starknetRpcUrl?: string;
}

/**
 * Extended exchange adapter
 *
 * Hybrid CLOB perpetual DEX on StarkNet with up to 100x leverage
 */
export class ExtendedAdapter extends BaseAdapter {
  readonly id = 'extended';
  readonly name = 'Extended';

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
    fetchUserFees: true,
    fetchPortfolio: true,
    fetchRateLimitStatus: false,
    createOrder: true,
    createBatchOrders: true,
    cancelOrder: true,
    cancelAllOrders: true,
    cancelBatchOrders: true,
    editOrder: true,
    setLeverage: true,
    setMarginMode: true,
    fetchDeposits: false,
    fetchWithdrawals: false,
    watchOrderBook: false,
    watchTrades: false,
    watchTicker: false,
    watchPositions: false,
    watchOrders: false,
    watchBalance: false,
    watchFundingRate: false,
  };

  private readonly apiUrl: string;
  private readonly wsUrl: string;
  private readonly apiKey?: string;
  protected readonly rateLimiter: RateLimiter;
  protected readonly httpClient: HTTPClient;
  private readonly normalizer: ExtendedNormalizer;
  private readonly starkNetClient?: ExtendedStarkNetClient;
  private wsManager: WebSocketManager | null = null;

  constructor(config: ExtendedConfig = {}) {
    super(config);

    const testnet = config.testnet ?? false;
    const urls = testnet ? EXTENDED_API_URLS.testnet : EXTENDED_API_URLS.mainnet;

    this.apiUrl = urls.rest;
    this.wsUrl = urls.websocket;
    this.apiKey = config.apiKey;

    this.normalizer = new ExtendedNormalizer();

    // Initialize StarkNet client if credentials provided
    if (config.starknetPrivateKey && config.starknetAccountAddress) {
      this.starkNetClient = new ExtendedStarkNetClient({
        network: testnet ? 'testnet' : 'mainnet',
        privateKey: config.starknetPrivateKey,
        accountAddress: config.starknetAccountAddress,
        rpcUrl: config.starknetRpcUrl || urls.starknet,
      });
    }

    const limits = EXTENDED_RATE_LIMITS.default;

    this.rateLimiter = new RateLimiter({
      maxTokens: limits.maxRequests,
      refillRate: limits.maxRequests / (limits.windowMs / 1000),
      windowMs: limits.windowMs,
      weights: EXTENDED_ENDPOINT_WEIGHTS,
    });

    this.httpClient = new HTTPClient({
      baseUrl: this.apiUrl,
      timeout: config.timeout || EXTENDED_DEFAULTS.timeout,
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
    this.info('Extended adapter initialized', {
      starkNetEnabled: !!this.starkNetClient,
    });
  }

  async disconnect(): Promise<void> {
    if (this.wsManager) {
      await this.wsManager.disconnect();
      this.wsManager = null;
    }
    if (this.starkNetClient) {
      await this.starkNetClient.disconnect();
    }
    this._isReady = false;
    this.info('Extended adapter disconnected');
  }

  // ==================== Symbol Conversion Methods ====================

  /**
   * Convert unified symbol to Extended format
   */
  protected symbolToExchange(symbol: string): string {
    return this.normalizer.symbolFromCCXT(symbol);
  }

  /**
   * Convert Extended symbol to unified format
   */
  protected symbolFromExchange(exchangeSymbol: string): string {
    return this.normalizer.symbolToCCXT(exchangeSymbol);
  }

  // ==================== Market Data Methods ====================

  async fetchMarkets(params?: MarketParams): Promise<Market[]> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.MARKETS);

    try {
      const response = await this.httpClient.get<{ markets: ExtendedMarket[] }>(
        EXTENDED_ENDPOINTS.MARKETS,
        {}
      );

      const markets = response.markets || [];
      return this.normalizer.normalizeMarkets(markets);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.TICKER_SYMBOL);

    try {
      const market = this.symbolToExchange(symbol);
      const endpoint = EXTENDED_ENDPOINTS.TICKER_SYMBOL.replace('{market}', market);

      const ticker = await this.httpClient.get<ExtendedTicker>(endpoint, {});
      return this.normalizer.normalizeTicker(ticker);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.ORDERBOOK);

    try {
      const market = this.symbolToExchange(symbol);
      let endpoint = EXTENDED_ENDPOINTS.ORDERBOOK.replace('{market}', market);

      const queryParams: Record<string, any> = {};
      if (params?.limit) {
        queryParams.depth = params.limit;
      }

      endpoint += this.buildQueryString(queryParams);

      const orderbook = await this.httpClient.get<ExtendedOrderBook>(endpoint, {});
      return this.normalizer.normalizeOrderBook(orderbook);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.TRADES);

    try {
      const market = this.symbolToExchange(symbol);
      let endpoint = EXTENDED_ENDPOINTS.TRADES.replace('{market}', market);

      const queryParams: Record<string, any> = {};
      if (params?.since) {
        queryParams.startTime = params.since;
      }
      if (params?.limit) {
        queryParams.limit = params.limit;
      }

      endpoint += this.buildQueryString(queryParams);

      const response = await this.httpClient.get<{ trades: ExtendedTrade[] }>(endpoint, {});
      const trades = response.trades || [];
      return this.normalizer.normalizeTrades(trades);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.FUNDING_RATE);

    try {
      const market = this.symbolToExchange(symbol);
      const endpoint = EXTENDED_ENDPOINTS.FUNDING_RATE.replace('{market}', market);

      const fundingRate = await this.httpClient.get<ExtendedFundingRate>(endpoint, {});
      return this.normalizer.normalizeFundingRate(fundingRate);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.FUNDING_HISTORY);

    try {
      const market = this.symbolToExchange(symbol);
      let endpoint = EXTENDED_ENDPOINTS.FUNDING_HISTORY.replace('{market}', market);

      const queryParams: Record<string, any> = {};
      if (since) {
        queryParams.startTime = since;
      }
      if (limit) {
        queryParams.limit = limit;
      }

      endpoint += this.buildQueryString(queryParams);

      const response = await this.httpClient.get<{ rates: ExtendedFundingRate[] }>(endpoint, {});
      const rates = response.rates || [];
      return this.normalizer.normalizeFundingRates(rates);
    } catch (error) {
      throw mapError(error);
    }
  }

  // ==================== Trading Methods ====================

  async createOrder(request: OrderRequest): Promise<Order> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.CREATE_ORDER);
    validateOrderRequest(request);

    if (!this.apiKey) {
      throw new PerpDEXError('API key required for trading', 'AUTHENTICATION_ERROR', this.id);
    }

    try {
      const extendedOrder = convertOrderRequest(request);

      const order = await this.httpClient.post<ExtendedOrder>(
        EXTENDED_ENDPOINTS.CREATE_ORDER,
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: extendedOrder as unknown as Record<string, unknown>,
        }
      );

      return this.normalizer.normalizeOrder(order);
    } catch (error) {
      throw mapError(error);
    }
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.CANCEL_ORDER);

    if (!this.apiKey) {
      throw new PerpDEXError('API key required for trading', 'AUTHENTICATION_ERROR', this.id);
    }

    try {
      const endpoint = EXTENDED_ENDPOINTS.CANCEL_ORDER.replace('{orderId}', orderId);

      const order = await this.httpClient.delete<ExtendedOrder>(endpoint, {
        headers: {
          'X-Api-Key': this.apiKey,
        },
      });

      return this.normalizer.normalizeOrder(order);
    } catch (error) {
      throw mapError(error);
    }
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.CANCEL_ALL_ORDERS);

    if (!this.apiKey) {
      throw new PerpDEXError('API key required for trading', 'AUTHENTICATION_ERROR', this.id);
    }

    try {
      const queryParams: Record<string, any> = {};
      if (symbol) {
        queryParams.market = this.symbolToExchange(symbol);
      }

      let endpoint = EXTENDED_ENDPOINTS.CANCEL_ALL_ORDERS;
      endpoint += this.buildQueryString(queryParams);

      const response = await this.httpClient.delete<{ orders: ExtendedOrder[] }>(
        endpoint,
        {
          headers: {
            'X-Api-Key': this.apiKey,
          },
        }
      );

      const orders = response.orders || [];
      return this.normalizer.normalizeOrders(orders);
    } catch (error) {
      throw mapError(error);
    }
  }

  async createBatchOrders(requests: OrderRequest[]): Promise<Order[]> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.BATCH_ORDERS);

    if (!this.apiKey) {
      throw new PerpDEXError('API key required for trading', 'AUTHENTICATION_ERROR', this.id);
    }

    try {
      requests.forEach((req) => validateOrderRequest(req));

      const extendedOrders = requests.map((req) => convertOrderRequest(req));

      const response = await this.httpClient.post<{ orders: ExtendedOrder[] }>(
        EXTENDED_ENDPOINTS.BATCH_ORDERS,
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: { orders: extendedOrders },
        }
      );

      const orders = response.orders || [];
      return this.normalizer.normalizeOrders(orders);
    } catch (error) {
      throw mapError(error);
    }
  }

  async cancelBatchOrders(orderIds: string[], symbol?: string): Promise<Order[]> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.CANCEL_ALL_ORDERS);

    if (!this.apiKey) {
      throw new PerpDEXError('API key required for trading', 'AUTHENTICATION_ERROR', this.id);
    }

    try {
      const response = await this.httpClient.delete<{ orders: ExtendedOrder[] }>(
        EXTENDED_ENDPOINTS.CANCEL_ALL_ORDERS,
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: { orderIds },
        }
      );

      const orders = response.orders || [];
      return this.normalizer.normalizeOrders(orders);
    } catch (error) {
      throw mapError(error);
    }
  }

  // ==================== Account Methods ====================

  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.POSITIONS);

    if (!this.apiKey) {
      throw new PerpDEXError('API key required for account data', 'AUTHENTICATION_ERROR', this.id);
    }

    try {
      const queryParams: Record<string, any> = {};
      if (symbols && symbols.length > 0) {
        queryParams.markets = symbols.map((s) => this.symbolToExchange(s)).join(',');
      }

      let endpoint = EXTENDED_ENDPOINTS.POSITIONS;
      endpoint += this.buildQueryString(queryParams);

      const response = await this.httpClient.get<{ positions: ExtendedPosition[] }>(
        endpoint,
        {
          headers: {
            'X-Api-Key': this.apiKey,
          },
        }
      );

      const positions = response.positions || [];
      return this.normalizer.normalizePositions(positions);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchBalance(): Promise<Balance[]> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.BALANCE);

    if (!this.apiKey) {
      throw new PerpDEXError('API key required for account data', 'AUTHENTICATION_ERROR', this.id);
    }

    try {
      const response = await this.httpClient.get<{ balances: ExtendedBalance[] }>(
        EXTENDED_ENDPOINTS.BALANCE,
        {
          headers: {
            'X-Api-Key': this.apiKey,
          },
        }
      );

      const balances = response.balances || [];
      return this.normalizer.normalizeBalances(balances);
    } catch (error) {
      throw mapError(error);
    }
  }

  async setLeverage(symbol: string, leverage: number): Promise<void> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.LEVERAGE);
    validateLeverage(leverage);

    if (!this.apiKey) {
      throw new PerpDEXError('API key required for leverage changes', 'AUTHENTICATION_ERROR', this.id);
    }

    try {
      const market = this.symbolToExchange(symbol);

      await this.httpClient.post(
        EXTENDED_ENDPOINTS.LEVERAGE,
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: {
            market,
            leverage,
          },
        }
      );
    } catch (error) {
      throw mapError(error);
    }
  }

  async setMarginMode(symbol: string, marginMode: 'cross' | 'isolated'): Promise<void> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.MARGIN_MODE);

    if (!this.apiKey) {
      throw new PerpDEXError('API key required for margin mode changes', 'AUTHENTICATION_ERROR', this.id);
    }

    try {
      const market = this.symbolToExchange(symbol);

      await this.httpClient.post(
        EXTENDED_ENDPOINTS.MARGIN_MODE,
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: {
            market,
            marginMode,
          },
        }
      );
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.ORDER_HISTORY);

    if (!this.apiKey) {
      throw new PerpDEXError('API key required for order history', 'AUTHENTICATION_ERROR', this.id);
    }

    try {
      const queryParams: Record<string, any> = {};
      if (symbol) {
        queryParams.market = this.symbolToExchange(symbol);
      }
      if (since) {
        queryParams.startTime = since;
      }
      if (limit) {
        queryParams.limit = limit;
      }

      let endpoint = EXTENDED_ENDPOINTS.ORDER_HISTORY;
      endpoint += this.buildQueryString(queryParams);

      const response = await this.httpClient.get<{ orders: ExtendedOrder[] }>(
        endpoint,
        {
          headers: {
            'X-Api-Key': this.apiKey,
          },
        }
      );

      const orders = response.orders || [];
      return this.normalizer.normalizeOrders(orders);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.USER_TRADES);

    if (!this.apiKey) {
      throw new PerpDEXError('API key required for trade history', 'AUTHENTICATION_ERROR', this.id);
    }

    try {
      const queryParams: Record<string, any> = {};
      if (symbol) {
        queryParams.market = this.symbolToExchange(symbol);
      }
      if (since) {
        queryParams.startTime = since;
      }
      if (limit) {
        queryParams.limit = limit;
      }

      let endpoint = EXTENDED_ENDPOINTS.USER_TRADES;
      endpoint += this.buildQueryString(queryParams);

      const response = await this.httpClient.get<{ trades: ExtendedTrade[] }>(
        endpoint,
        {
          headers: {
            'X-Api-Key': this.apiKey,
          },
        }
      );

      const trades = response.trades || [];
      return this.normalizer.normalizeTrades(trades);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchDeposits(currency?: string, since?: number, limit?: number): Promise<Transaction[]> {
    throw new PerpDEXError('fetchDeposits not supported', 'NOT_SUPPORTED', this.id);
  }

  async fetchWithdrawals(currency?: string, since?: number, limit?: number): Promise<Transaction[]> {
    throw new PerpDEXError('fetchWithdrawals not supported', 'NOT_SUPPORTED', this.id);
  }

  async fetchUserFees(): Promise<UserFees> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.USER_FEES);

    if (!this.apiKey) {
      throw new PerpDEXError('API key required for fee information', 'AUTHENTICATION_ERROR', this.id);
    }

    try {
      const response = await this.httpClient.get<{
        maker: string;
        taker: string;
        volume30d?: string;
      }>(EXTENDED_ENDPOINTS.USER_FEES, {
        headers: {
          'X-Api-Key': this.apiKey,
        },
      });

      return {
        maker: parseFloat(response.maker),
        taker: parseFloat(response.taker),
        volume30d: response.volume30d ? parseFloat(response.volume30d) : undefined,
      };
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchPortfolio(): Promise<Portfolio> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.PORTFOLIO);

    if (!this.apiKey) {
      throw new PerpDEXError('API key required for portfolio data', 'AUTHENTICATION_ERROR', this.id);
    }

    try {
      const response = await this.httpClient.get<{
        totalValue: string;
        dailyPnl: string;
        dailyPnlPercentage: string;
      }>(EXTENDED_ENDPOINTS.PORTFOLIO, {
        headers: {
          'X-Api-Key': this.apiKey,
        },
      });

      return {
        totalValue: parseFloat(response.totalValue),
        dailyPnl: parseFloat(response.dailyPnl),
        dailyPnlPercentage: parseFloat(response.dailyPnlPercentage),
        timestamp: Date.now(),
      };
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchRateLimitStatus(): Promise<RateLimitStatus> {
    throw new PerpDEXError('fetchRateLimitStatus not supported', 'NOT_SUPPORTED', this.id);
  }

  // ==================== WebSocket Methods ====================
  // NOTE: WebSocket streaming is NOT YET IMPLEMENTED for Extended exchange.
  // The exchange does provide WebSocket endpoints, but this adapter has not
  // yet implemented the WebSocket client integration.
  //
  // For real-time data, consider:
  // 1. Polling with REST API methods (fetchOrderBook, fetchTrades, etc.)
  // 2. Using a third-party WebSocket library directly with Extended's WS API
  //
  // All watch* methods below will throw NOT_IMPLEMENTED errors.
  // ========================================================================

  async *watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook> {
    throw new PerpDEXError('watchOrderBook not implemented - WebSocket not supported for Extended adapter', 'NOT_IMPLEMENTED', this.id);
  }

  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    throw new PerpDEXError('watchTrades not implemented - WebSocket not supported for Extended adapter', 'NOT_IMPLEMENTED', this.id);
  }

  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    throw new PerpDEXError('watchTicker not implemented - WebSocket not supported for Extended adapter', 'NOT_IMPLEMENTED', this.id);
  }

  async *watchPositions(): AsyncGenerator<Position[]> {
    throw new PerpDEXError('watchPositions not implemented - WebSocket not supported for Extended adapter', 'NOT_IMPLEMENTED', this.id);
  }

  async *watchOrders(): AsyncGenerator<Order[]> {
    throw new PerpDEXError('watchOrders not implemented - WebSocket not supported for Extended adapter', 'NOT_IMPLEMENTED', this.id);
  }

  async *watchBalance(): AsyncGenerator<Balance[]> {
    throw new PerpDEXError('watchBalance not implemented - WebSocket not supported for Extended adapter', 'NOT_IMPLEMENTED', this.id);
  }

  async *watchFundingRate(symbol: string): AsyncGenerator<FundingRate> {
    throw new PerpDEXError('watchFundingRate not implemented - WebSocket not supported for Extended adapter', 'NOT_IMPLEMENTED', this.id);
  }

  // ==================== Private Helper Methods ====================

  /**
   * Build query string from parameters
   */
  private buildQueryString(params: Record<string, any>): string {
    const filtered = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);

    return filtered.length > 0 ? `?${filtered.join('&')}` : '';
  }
}

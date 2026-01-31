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
 * - **WebSocket**: watchOrderBook, watchTrades, watchTicker, watchPositions, watchOrders, watchBalance, watchFundingRate
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
 * // REST API
 * const markets = await adapter.fetchMarkets();
 * const order = await adapter.createOrder({ ... });
 *
 * // WebSocket streaming
 * for await (const orderbook of adapter.watchOrderBook('BTC/USD:USD')) {
 *   console.log('Order book update:', orderbook);
 * }
 *
 * // Private WebSocket (requires API key)
 * for await (const positions of adapter.watchPositions()) {
 *   console.log('Position update:', positions);
 * }
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
import { ExtendedWebSocketWrapper } from './ExtendedWebSocketWrapper.js';
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
    watchOrderBook: true,
    watchTrades: true,
    watchTicker: true,
    watchPositions: true,
    watchOrders: true,
    watchBalance: true,
    watchFundingRate: true,
  };

  private readonly apiUrl: string;
  private readonly wsUrl: string;
  private readonly apiKey?: string;
  protected readonly rateLimiter: RateLimiter;
  protected readonly httpClient: HTTPClient;
  private readonly normalizer: ExtendedNormalizer;
  private readonly starkNetClient?: ExtendedStarkNetClient;
  private wsManager: WebSocketManager | null = null;
  private wsWrapper?: ExtendedWebSocketWrapper;

  constructor(config: ExtendedConfig = {}) {
    super(config);

    // Note: Extended testnet (Sepolia) is not currently operational
    // Always use mainnet URLs - testnet flag is ignored with a warning
    const testnet = config.testnet ?? false;
    if (testnet) {
      console.warn('[ExtendedAdapter] Warning: Extended testnet (Sepolia) is not operational. Using mainnet instead.');
    }
    // Always use mainnet URLs since testnet returns 404
    const urls = EXTENDED_API_URLS.mainnet;

    this.apiUrl = urls.rest;
    this.wsUrl = urls.websocket;
    this.apiKey = config.apiKey;

    this.normalizer = new ExtendedNormalizer();

    // Initialize StarkNet client if credentials provided
    // Always use mainnet network since testnet is not operational
    if (config.starknetPrivateKey && config.starknetAccountAddress) {
      this.starkNetClient = new ExtendedStarkNetClient({
        network: 'mainnet',
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
    if (this.wsWrapper) {
      this.wsWrapper.disconnect();
      this.wsWrapper = undefined;
    }
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

  async editOrder(
    orderId: string,
    symbol: string,
    type: 'market' | 'limit',
    side: 'buy' | 'sell',
    amount?: number,
    price?: number
  ): Promise<Order> {
    await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.EDIT_ORDER);

    if (!this.apiKey) {
      throw new PerpDEXError('API key required for trading', 'AUTHENTICATION_ERROR', this.id);
    }

    try {
      const endpoint = EXTENDED_ENDPOINTS.EDIT_ORDER.replace('{orderId}', orderId);
      const market = this.symbolToExchange(symbol);

      const body: Record<string, unknown> = {
        symbol: market,
        type,
        side,
      };

      if (amount !== undefined) {
        body.quantity = amount.toString();
      }
      if (price !== undefined) {
        body.price = price.toString();
      }

      const order = await this.httpClient.put<ExtendedOrder>(endpoint, {
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body,
      });

      return this.normalizer.normalizeOrder(order);
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

  /**
   * Ensure WebSocket is connected and return the wrapper
   */
  private async ensureWebSocketConnected(): Promise<ExtendedWebSocketWrapper> {
    if (!this.wsWrapper) {
      this.wsWrapper = new ExtendedWebSocketWrapper({
        wsUrl: this.wsUrl,
        apiKey: this.apiKey,
        reconnect: true,
        pingInterval: EXTENDED_WS_CONFIG.pingInterval,
        maxReconnectAttempts: EXTENDED_WS_CONFIG.reconnectAttempts,
      });
    }

    if (!this.wsWrapper.connected) {
      await this.wsWrapper.connect();
    }

    return this.wsWrapper;
  }

  /**
   * Watch real-time order book updates
   */
  async *watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook> {
    const ws = await this.ensureWebSocketConnected();
    yield* ws.watchOrderBook(symbol, limit);
  }

  /**
   * Watch real-time trade updates
   */
  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    const ws = await this.ensureWebSocketConnected();
    yield* ws.watchTrades(symbol);
  }

  /**
   * Watch real-time ticker updates
   */
  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    const ws = await this.ensureWebSocketConnected();
    yield* ws.watchTicker(symbol);
  }

  /**
   * Watch real-time position updates (requires API key)
   */
  async *watchPositions(): AsyncGenerator<Position[]> {
    if (!this.apiKey) {
      throw new PerpDEXError('API key required for watching positions', 'AUTHENTICATION_ERROR', this.id);
    }
    const ws = await this.ensureWebSocketConnected();
    yield* ws.watchPositions();
  }

  /**
   * Watch real-time order updates (requires API key)
   */
  async *watchOrders(): AsyncGenerator<Order[]> {
    if (!this.apiKey) {
      throw new PerpDEXError('API key required for watching orders', 'AUTHENTICATION_ERROR', this.id);
    }
    const ws = await this.ensureWebSocketConnected();
    yield* ws.watchOrders();
  }

  /**
   * Watch real-time balance updates (requires API key)
   */
  async *watchBalance(): AsyncGenerator<Balance[]> {
    if (!this.apiKey) {
      throw new PerpDEXError('API key required for watching balance', 'AUTHENTICATION_ERROR', this.id);
    }
    const ws = await this.ensureWebSocketConnected();
    yield* ws.watchBalance();
  }

  /**
   * Watch real-time funding rate updates
   */
  async *watchFundingRate(symbol: string): AsyncGenerator<FundingRate> {
    const ws = await this.ensureWebSocketConnected();
    yield* ws.watchFundingRate(symbol);
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

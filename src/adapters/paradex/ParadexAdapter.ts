/**
 * Paradex Exchange Adapter
 *
 * StarkNet-based perpetual DEX with JWT authentication
 *
 * Architecture:
 * - ParadexHTTPClient: HTTP requests with JWT management
 * - ParadexNormalizer: Data transformation
 * - ParadexErrorMapper: Error classification
 * - ParadexParaclearWrapper: Withdrawal operations via SDK
 * - ParadexWebSocketWrapper: Real-time streams
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
  MarketParams,
  OrderBookParams,
  TradeParams,
} from '../../types/common.js';
import type { FeatureMap } from '../../types/adapter.js';
import { PerpDEXError } from '../../types/errors.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import {
  PARADEX_API_URLS,
  PARADEX_RATE_LIMITS,
  PARADEX_ENDPOINT_WEIGHTS,
} from './constants.js';
import { ParadexAuth } from './ParadexAuth.js';
import { ParadexHTTPClient } from './ParadexHTTPClient.js';
import { ParadexNormalizer } from './ParadexNormalizer.js';
import { mapAxiosError } from './ParadexErrorMapper.js';
import { ParadexParaclearWrapper } from './ParadexParaclearWrapper.js';
import { ParadexWebSocketWrapper } from './ParadexWebSocketWrapper.js';
import type {
  ParadexConfig,
  ParadexMarket,
  ParadexTicker,
  ParadexOrderBook,
  ParadexTrade,
  ParadexFundingRate,
  ParadexPosition,
  ParadexBalance,
  ParadexOrder,
} from './types.js';

/**
 * Response wrapper types for Paradex API
 */
interface MarketsResponse {
  results?: ParadexMarket[];
  markets?: ParadexMarket[];
}

interface TradesResponse {
  trades: ParadexTrade[];
}

interface FundingHistoryResponse {
  history: ParadexFundingRate[];
}

interface PositionsResponse {
  positions: ParadexPosition[];
}

interface BalancesResponse {
  balances: ParadexBalance[];
}

interface OrdersResponse {
  orders: ParadexOrder[];
}

interface OrderHistoryResponse {
  results: ParadexOrder[];
}

interface FillsResponse {
  results: ParadexTrade[];
}

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
    watchMyTrades: true,
  };

  // Component architecture
  private readonly auth: ParadexAuth;
  private readonly client: ParadexHTTPClient;
  private readonly normalizer: ParadexNormalizer;
  private readonly paraclear: ParadexParaclearWrapper;
  private ws?: ParadexWebSocketWrapper;
  protected rateLimiter: RateLimiter;
  private readonly wsUrl: string;

  constructor(config: ParadexConfig = {}) {
    super(config);

    // Rate limiter
    const tier = config.rateLimitTier ?? 'default';
    const limits = PARADEX_RATE_LIMITS[tier];

    this.rateLimiter = new RateLimiter({
      maxTokens: limits.maxRequests,
      refillRate: limits.maxRequests / (limits.windowMs / 1000),
      windowMs: limits.windowMs,
      weights: PARADEX_ENDPOINT_WEIGHTS,
    });

    // URLs
    const urls = config.testnet ? PARADEX_API_URLS.testnet : PARADEX_API_URLS.mainnet;
    this.wsUrl = urls.websocket;

    // Components
    this.auth = new ParadexAuth({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      privateKey: config.privateKey,
      starkPrivateKey: config.starkPrivateKey,
      testnet: config.testnet,
    });

    this.normalizer = new ParadexNormalizer();

    this.client = new ParadexHTTPClient({
      baseUrl: urls.rest,
      auth: this.auth,
    });

    this.paraclear = new ParadexParaclearWrapper({
      testnet: config.testnet,
    });
  }

  /**
   * Initialize the adapter
   * Note: starkPrivateKey is only required for private API operations (trading)
   */
  async initialize(): Promise<void> {
    // Public API can be accessed without credentials
    this._isReady = true;
  }

  /**
   * Require authentication for private API operations
   */
  private requireAuth(): void {
    if (!this.auth.hasCredentials()) {
      throw new PerpDEXError(
        'Authentication required. Provide apiKey or starkPrivateKey in config.',
        'MISSING_CREDENTIALS',
        'paradex'
      );
    }
  }

  /**
   * Cleanup resources
   */
  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.disconnect();
      this.ws = undefined;
    }
    this.auth.clearJWTToken();
    this._isReady = false;
  }

  // ===========================================================================
  // Market Data Methods
  // ===========================================================================

  /**
   * Fetch all available markets
   */
  async fetchMarkets(_params?: MarketParams): Promise<Market[]> {
    await this.rateLimiter.acquire('fetchMarkets');

    try {
      const response = await this.client.get<MarketsResponse>('/markets');

      // Paradex API returns { results: [...] }
      const markets = response.results || response.markets;
      if (!Array.isArray(markets)) {
        throw new PerpDEXError('Invalid markets response', 'INVALID_RESPONSE', 'paradex');
      }

      return this.normalizer.normalizeMarkets(markets);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Fetch ticker for a symbol
   */
  async fetchTicker(symbol: string): Promise<Ticker> {
    await this.rateLimiter.acquire('fetchTicker');

    try {
      const market = this.normalizer.symbolFromCCXT(symbol);
      const response = await this.client.get<ParadexTicker>(`/markets/${market}/ticker`);

      return this.normalizer.normalizeTicker(response);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Fetch order book for a symbol
   */
  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    await this.rateLimiter.acquire('fetchOrderBook');

    try {
      const market = this.normalizer.symbolFromCCXT(symbol);
      const limit = params?.limit;

      const queryParams = limit ? `?depth=${limit}` : '';
      const response = await this.client.get<ParadexOrderBook>(`/markets/${market}/orderbook${queryParams}`);

      return this.normalizer.normalizeOrderBook(response);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Fetch recent trades for a symbol
   */
  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    await this.rateLimiter.acquire('fetchTrades');

    try {
      const market = this.normalizer.symbolFromCCXT(symbol);
      const limit = params?.limit ?? 100;

      const response = await this.client.get<TradesResponse>(`/markets/${market}/trades?limit=${limit}`);

      if (!Array.isArray(response.trades)) {
        throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'paradex');
      }

      return this.normalizer.normalizeTrades(response.trades);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Fetch current funding rate
   */
  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    await this.rateLimiter.acquire('fetchFundingRate');

    try {
      const market = this.normalizer.symbolFromCCXT(symbol);
      const response = await this.client.get<ParadexFundingRate>(`/markets/${market}/funding`);

      return this.normalizer.normalizeFundingRate(response);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Fetch funding rate history
   */
  async fetchFundingRateHistory(
    symbol: string,
    since?: number,
    limit?: number
  ): Promise<FundingRate[]> {
    await this.rateLimiter.acquire('fetchFundingRateHistory');

    try {
      const market = this.normalizer.symbolFromCCXT(symbol);
      const params = new URLSearchParams();

      if (since) params.append('start_time', since.toString());
      if (limit) params.append('limit', limit.toString());

      const queryString = params.toString();
      const path = `/markets/${market}/funding/history${queryString ? `?${queryString}` : ''}`;

      const response = await this.client.get<FundingHistoryResponse>(path);

      if (!Array.isArray(response.history)) {
        throw new PerpDEXError('Invalid funding rate history response', 'INVALID_RESPONSE', 'paradex');
      }

      return this.normalizer.normalizeFundingRates(response.history);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  // ===========================================================================
  // Account Methods
  // ===========================================================================

  /**
   * Fetch all open positions
   */
  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    this.requireAuth();
    await this.rateLimiter.acquire('fetchPositions');

    try {
      const response = await this.client.get<PositionsResponse>('/positions');

      if (!Array.isArray(response.positions)) {
        throw new PerpDEXError('Invalid positions response', 'INVALID_RESPONSE', 'paradex');
      }

      let positions = this.normalizer.normalizePositions(response.positions);

      if (symbols && symbols.length > 0) {
        positions = positions.filter((p: Position) => symbols.includes(p.symbol));
      }

      return positions;
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Fetch account balance
   */
  async fetchBalance(): Promise<Balance[]> {
    this.requireAuth();
    await this.rateLimiter.acquire('fetchBalance');

    try {
      const response = await this.client.get<BalancesResponse>('/account/balance');

      if (!Array.isArray(response.balances)) {
        throw new PerpDEXError('Invalid balance response', 'INVALID_RESPONSE', 'paradex');
      }

      return this.normalizer.normalizeBalances(response.balances);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  // ===========================================================================
  // Trading Methods
  // ===========================================================================

  /**
   * Create a new order
   */
  async createOrder(request: OrderRequest): Promise<Order> {
    // Validate order request
    const validatedRequest = this.validateOrder(request);

    this.requireAuth();
    await this.rateLimiter.acquire('createOrder');

    try {
      const market = this.normalizer.symbolFromCCXT(validatedRequest.symbol);
      const orderType = this.normalizer.toParadexOrderType(validatedRequest.type, validatedRequest.postOnly);
      const side = this.normalizer.toParadexOrderSide(validatedRequest.side);
      const timeInForce = this.normalizer.toParadexTimeInForce(validatedRequest.timeInForce, validatedRequest.postOnly);

      const payload = {
        market,
        side,
        type: orderType,
        size: validatedRequest.amount.toString(),
        price: validatedRequest.price?.toString(),
        time_in_force: timeInForce,
        reduce_only: validatedRequest.reduceOnly ?? false,
        post_only: validatedRequest.postOnly ?? false,
        client_id: validatedRequest.clientOrderId,
      };

      const response = await this.client.post<ParadexOrder>('/orders', payload);

      return this.normalizer.normalizeOrder(response);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Cancel an existing order
   */
  async cancelOrder(orderId: string, _symbol?: string): Promise<Order> {
    this.requireAuth();
    await this.rateLimiter.acquire('cancelOrder');

    try {
      const response = await this.client.delete<ParadexOrder>(`/orders/${orderId}`);

      return this.normalizer.normalizeOrder(response);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Cancel all orders
   */
  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    this.requireAuth();
    await this.rateLimiter.acquire('cancelAllOrders');

    try {
      const payload = symbol ? { market: this.normalizer.symbolFromCCXT(symbol) } : undefined;

      const response = await this.client.delete<OrdersResponse>('/orders', payload);

      if (!Array.isArray(response.orders)) {
        throw new PerpDEXError('Invalid cancel all orders response', 'INVALID_RESPONSE', 'paradex');
      }

      return this.normalizer.normalizeOrders(response.orders);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Fetch open orders
   */
  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    this.requireAuth();
    await this.rateLimiter.acquire('fetchOpenOrders');

    try {
      const params = symbol ? `?market=${this.normalizer.symbolFromCCXT(symbol)}` : '';
      const response = await this.client.get<OrdersResponse>(`/orders${params}`);

      if (!Array.isArray(response.orders)) {
        throw new PerpDEXError('Invalid open orders response', 'INVALID_RESPONSE', 'paradex');
      }

      return this.normalizer.normalizeOrders(response.orders);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Fetch a specific order
   */
  async fetchOrder(orderId: string, _symbol?: string): Promise<Order> {
    this.requireAuth();
    await this.rateLimiter.acquire('fetchOrder');

    try {
      const response = await this.client.get<ParadexOrder>(`/orders/${orderId}`);

      return this.normalizer.normalizeOrder(response);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Set leverage for a symbol
   */
  async setLeverage(symbol: string, leverage: number): Promise<void> {
    this.requireAuth();
    await this.rateLimiter.acquire('setLeverage');

    try {
      const market = this.normalizer.symbolFromCCXT(symbol);

      await this.client.post('/account/leverage', {
        market,
        leverage: leverage.toString(),
      });
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Fetch order history
   */
  async fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]> {
    this.requireAuth();
    await this.rateLimiter.acquire('fetchOrderHistory');

    try {
      const params = new URLSearchParams();
      if (symbol) params.append('market', this.normalizer.symbolFromCCXT(symbol));
      if (since) params.append('start_at', since.toString());
      if (limit) params.append('page_size', limit.toString());

      const queryString = params.toString();
      const response = await this.client.get<OrderHistoryResponse>(`/orders/history${queryString ? `?${queryString}` : ''}`);

      if (!Array.isArray(response.results)) {
        throw new PerpDEXError('Invalid order history response', 'INVALID_RESPONSE', 'paradex');
      }

      return this.normalizer.normalizeOrders(response.results);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Fetch user trade history
   */
  async fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]> {
    this.requireAuth();
    await this.rateLimiter.acquire('fetchMyTrades');

    try {
      const params = new URLSearchParams();
      if (symbol) params.append('market', this.normalizer.symbolFromCCXT(symbol));
      if (since) params.append('start_at', since.toString());
      if (limit) params.append('page_size', limit.toString());

      const queryString = params.toString();
      const response = await this.client.get<FillsResponse>(`/fills${queryString ? `?${queryString}` : ''}`);

      if (!Array.isArray(response.results)) {
        throw new PerpDEXError('Invalid fills response', 'INVALID_RESPONSE', 'paradex');
      }

      return this.normalizer.normalizeTrades(response.results);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  // ===========================================================================
  // Paraclear Methods (Withdrawal Operations)
  // ===========================================================================

  /**
   * Withdraw funds from Paraclear
   *
   * IMPORTANT: Requires Ethereum signer to be initialized via paraclear.initializeAccount()
   *
   * @param token - Token symbol (e.g., "USDC", "ETH")
   * @param amount - Amount to withdraw (as number)
   * @param bridgeCall - StarkNet bridge call for L1 transfer
   * @returns Transaction hash and actual receivable amount (after socialized loss)
   *
   * @example
   * ```typescript
   * // Initialize Paraclear account first
   * const signer = new ethers.Wallet(privateKey);
   * await adapter.paraclear.initializeAccount(signer);
   *
   * // Withdraw USDC
   * const result = await adapter.withdraw('USDC', 100, bridgeCall);
   * console.log('TX:', result.txHash);
   * console.log('Actual amount:', result.amount); // May be less if socialized loss active
   * ```
   */
  async withdraw(
    token: string,
    amount: number,
    bridgeCall: any
  ): Promise<{ txHash: string; amount: number }> {
    this.requireAuth();
    await this.rateLimiter.acquire('withdraw');

    try {
      const result = await this.paraclear.withdraw(token, amount.toString(), bridgeCall);

      return {
        txHash: result.transactionHash,
        amount: parseFloat(result.receivableAmount),
      };
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Fetch Paraclear (on-chain) balance
   *
   * This queries the StarkNet chain directly via Paraclear SDK,
   * which may differ from API balance due to pending operations.
   *
   * @param token - Optional token filter (e.g., "USDC")
   * @returns Balance array
   */
  async fetchParaclearBalance(token?: string): Promise<Balance[]> {
    this.requireAuth();
    await this.rateLimiter.acquire('fetchBalance');

    try {
      const balances = await this.paraclear.getAllBalances();

      // Convert to Balance[] format
      return Object.entries(balances)
        .filter(([currency]) => !token || currency === token)
        .map(([currency, total]) => ({
          currency,
          total: parseFloat(total),
          free: parseFloat(total),
          used: 0,
        }));
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  // ===========================================================================
  // WebSocket Methods (Real-time Streams)
  // ===========================================================================

  /**
   * Ensure WebSocket is connected
   */
  private async ensureWebSocket(): Promise<ParadexWebSocketWrapper> {
    if (!this.ws) {
      this.ws = new ParadexWebSocketWrapper({
        wsUrl: this.wsUrl,
        timeout: 30000,
      });
      await this.ws.connect();
    }
    return this.ws;
  }

  /**
   * Watch order book updates for a symbol
   *
   * @param symbol - Trading symbol in CCXT format
   * @param limit - Order book depth (default: 50)
   * @returns AsyncGenerator yielding OrderBook updates
   */
  async *watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook> {
    const ws = await this.ensureWebSocket();
    yield* ws.watchOrderBook(symbol, limit);
  }

  /**
   * Watch public trades for a symbol
   *
   * @param symbol - Trading symbol in CCXT format
   * @returns AsyncGenerator yielding Trade updates
   */
  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    const ws = await this.ensureWebSocket();
    yield* ws.watchTrades(symbol);
  }

  /**
   * Watch ticker for a symbol
   *
   * @param symbol - Trading symbol in CCXT format
   * @returns AsyncGenerator yielding Ticker updates
   */
  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    const ws = await this.ensureWebSocket();
    yield* ws.watchTicker(symbol);
  }

  /**
   * Watch position updates for user account
   *
   * @param symbol - Optional symbol filter
   * @returns AsyncGenerator yielding Position updates
   */
  async *watchPositions(symbol?: string): AsyncGenerator<Position[]> {
    this.requireAuth();
    const ws = await this.ensureWebSocket();

    // Paradex sends individual position updates, wrap in array
    for await (const position of ws.watchPositions(symbol)) {
      yield [position];
    }
  }

  /**
   * Watch order updates for user account
   *
   * @param symbol - Optional symbol filter
   * @returns AsyncGenerator yielding Order updates
   */
  async *watchOrders(symbol?: string): AsyncGenerator<Order[]> {
    this.requireAuth();
    const ws = await this.ensureWebSocket();

    // Paradex sends individual order updates, wrap in array
    for await (const order of ws.watchOrders(symbol)) {
      yield [order];
    }
  }

  /**
   * Watch balance updates
   *
   * @returns AsyncGenerator yielding Balance array
   */
  async *watchBalance(): AsyncGenerator<Balance[]> {
    this.requireAuth();
    const ws = await this.ensureWebSocket();
    yield* ws.watchBalance();
  }

  /**
   * Watch user trades (fills) in real-time
   *
   * @param symbol - Optional symbol filter
   * @returns AsyncGenerator yielding Trade updates
   */
  async *watchMyTrades(symbol?: string): AsyncGenerator<Trade> {
    this.requireAuth();
    const ws = await this.ensureWebSocket();
    yield* ws.watchMyTrades(symbol);
  }

  // ===========================================================================
  // Symbol Conversion
  // ===========================================================================

  /**
   * Convert unified symbol to exchange format
   */
  symbolToExchange(symbol: string): string {
    return this.normalizer.symbolFromCCXT(symbol);
  }

  /**
   * Convert exchange symbol to unified format
   */
  symbolFromExchange(exchangeSymbol: string): string {
    return this.normalizer.symbolToCCXT(exchangeSymbol);
  }
}

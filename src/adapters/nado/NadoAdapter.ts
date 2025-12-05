/**
 * Nado Exchange Adapter
 *
 * Implements IExchangeAdapter for Nado DEX on Ink L2
 * Built by Kraken team with 5-15ms latency
 *
 * @see https://docs.nado.xyz
 */

import { Wallet, ethers } from 'ethers';
import type {
  Balance,
  ExchangeConfig,
  FeatureMap,
  FundingRate,
  Market,
  MarketParams,
  Order,
  OrderBook,
  OrderBookParams,
  OrderRequest,
  Position,
  Ticker,
  Trade,
  TradeParams,
} from '../../types/index.js';
import { PerpDEXError, ExchangeUnavailableError, InvalidOrderError } from '../../types/errors.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { WebSocketManager } from '../../websocket/index.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import {
  NADO_API_URLS,
  NADO_CHAIN_ID,
  NADO_RATE_LIMITS,
  NADO_WS_CONFIG,
  NADO_REQUEST_CONFIG,
  NADO_ORDER_SIDES,
  NADO_QUERY_TYPES,
  NADO_EXECUTE_TYPES,
  NADO_WS_CHANNELS,
} from './constants.js';
import type {
  NadoConfig,
  NadoResponse,
  NadoProduct,
  NadoOrderBook,
  NadoOrder,
  NadoPosition,
  NadoBalance,
  NadoTrade,
  NadoTicker,
  NadoContracts,
  NadoEIP712Order,
  NadoEIP712Cancellation,
  ProductMapping,
} from './types.js';
import {
  NadoResponseSchema,
  NadoProductSchema,
  NadoOrderBookSchema,
  NadoOrderSchema,
  NadoPositionSchema,
  NadoBalanceSchema,
  NadoTradeSchema,
  NadoTickerSchema,
  NadoContractsSchema,
} from './types.js';
import {
  normalizeNadoProduct,
  normalizeNadoOrder,
  normalizeNadoPosition,
  normalizeNadoBalance,
  normalizeNadoTrade,
  normalizeNadoTicker,
  normalizeNadoOrderBook,
  nadoSymbolToCCXT,
  ccxtSymbolToNado,
  signNadoOrder,
  signNadoCancellation,
  toX18,
  fromX18,
  productIdToVerifyingContract,
} from './utils.js';

export class NadoAdapter extends BaseAdapter {
  readonly id = 'nado';
  readonly name = 'Nado';

  readonly has: Partial<FeatureMap> = {
    // Market Data
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchFundingRate: true,
    fetchFundingRateHistory: false,

    // Trading
    createOrder: true,
    cancelOrder: true,
    cancelAllOrders: true,
    createBatchOrders: false,
    cancelBatchOrders: true,
    editOrder: false,

    // Account History
    fetchOrderHistory: true,
    fetchMyTrades: false,
    fetchDeposits: false,
    fetchWithdrawals: false,

    // Positions & Balance
    fetchPositions: true,
    fetchBalance: true,
    setLeverage: false, // Unified margin system
    setMarginMode: false,

    // WebSocket
    watchOrderBook: true,
    watchTrades: true,
    watchTicker: false,
    watchPositions: true,
    watchOrders: true,
    watchBalance: true,
    watchFundingRate: false,

    // Advanced
    twapOrders: false,
    vaultTrading: false,

    // Additional Info
    fetchUserFees: true,
    fetchPortfolio: false,
    fetchRateLimitStatus: false,
  };

  private apiUrl: string;
  private wsUrl: string;
  private wsManager?: WebSocketManager;
  private wallet?: Wallet;
  protected rateLimiter: RateLimiter;

  // Nado-specific state
  private chainId: number;
  private contractsInfo?: NadoContracts;
  private productMappings: Map<number, ProductMapping> = new Map();
  private symbolToProductId: Map<string, number> = new Map();
  private currentNonce: number = 0;

  constructor(config: NadoConfig = {}) {
    super(config);

    // Validate wallet configuration
    if (!config.wallet && !config.privateKey) {
      throw new PerpDEXError(
        'Nado adapter requires either wallet or privateKey in config',
        'MISSING_CREDENTIALS',
        'nado'
      );
    }

    // Initialize wallet
    if (config.wallet) {
      this.wallet = config.wallet;
    } else if (config.privateKey) {
      this.wallet = new Wallet(config.privateKey);
    }

    // Set API URLs
    const urls = config.testnet ? NADO_API_URLS.testnet : NADO_API_URLS.mainnet;
    this.apiUrl = urls.rest;
    this.wsUrl = urls.ws;

    // Set chain ID
    this.chainId = config.testnet ? NADO_CHAIN_ID.testnet : NADO_CHAIN_ID.mainnet;

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter({
      maxTokens: NADO_RATE_LIMITS.queriesPerMinute,
      windowMs: 60000, // 1 minute
      weights: {
        query: 1,
        execute: 2,
      },
      exchange: 'nado',
    });
  }

  // ===========================================================================
  // Connection Management
  // ===========================================================================

  async initialize(): Promise<void> {
    if (this._isReady) {
      this.debug('Already initialized');
      return;
    }

    try {
      this.debug('Initializing Nado adapter...');

      // 1. Fetch contracts info (contains chain ID and endpoint addresses)
      this.contractsInfo = await this.fetchContracts();
      this.debug('Contracts info fetched', {
        chainId: this.contractsInfo.chain_id,
        endpoint: this.contractsInfo.endpoint_address,
      });

      // 2. Fetch current nonce
      await this.fetchCurrentNonce();
      this.debug('Current nonce fetched', { nonce: this.currentNonce });

      // 3. Preload markets and build product mappings
      await this.preloadMarkets();
      this.debug('Markets preloaded', { count: this.productMappings.size });

      // 4. Initialize WebSocket manager
      this.wsManager = new WebSocketManager({
        url: this.wsUrl,
        reconnect: {
          enabled: true,
          initialDelay: NADO_WS_CONFIG.reconnectDelay,
          maxDelay: NADO_WS_CONFIG.maxReconnectDelay,
          maxAttempts: NADO_WS_CONFIG.reconnectAttempts,
          multiplier: 2,
          jitter: 0.1,
        },
        heartbeat: {
          enabled: true,
          interval: NADO_WS_CONFIG.pingInterval,
          timeout: NADO_WS_CONFIG.pongTimeout,
        },
      });

      this._isReady = true;
      this.debug('Nado adapter initialized successfully');
    } catch (error) {
      this.error('Failed to initialize Nado adapter', error as Error);
      throw new ExchangeUnavailableError(
        `Nado initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INIT_FAILED',
        this.id,
        error
      );
    }
  }

  async disconnect(): Promise<void> {
    this.debug('Disconnecting from Nado...');

    // Close WebSocket
    if (this.wsManager) {
      await this.wsManager.disconnect();
      this.wsManager = undefined;
    }

    // Clear product mappings
    this.productMappings.clear();
    this.symbolToProductId.clear();

    // Call parent disconnect for resource cleanup
    await super.disconnect();

    this.debug('Disconnected from Nado');
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  /**
   * Make a query request to Nado API
   */
  private async query<T>(type: string, params: any = {}): Promise<T> {
    await this.rateLimiter.acquire('query', 1);

    const startTime = Date.now();
    const controller = new AbortController();
    this.abortControllers.add(controller);

    try {
      const response = await fetch(`${this.apiUrl}/query`, {
        method: 'POST',
        headers: NADO_REQUEST_CONFIG.headers,
        body: JSON.stringify({
          type,
          ...params,
        }),
        signal: controller.signal,
        // @ts-ignore - timeout not in standard fetch types
        timeout: NADO_REQUEST_CONFIG.timeout,
      });

      if (!response.ok) {
        throw new ExchangeUnavailableError(
          `Nado API error: ${response.status} ${response.statusText}`,
          'API_ERROR',
          this.id
        );
      }

      const data: NadoResponse<T> = await response.json();

      // Track metrics
      this.trackRequest('query', Date.now() - startTime, data.status === 'success');

      if (data.status === 'failure') {
        throw new PerpDEXError(
          `Nado query failed: ${data.error}`,
          data.error_code?.toString() || 'QUERY_FAILED',
          this.id
        );
      }

      return data.data as T;
    } catch (error) {
      this.trackRequest('query', Date.now() - startTime, false);
      throw this.mapError(error);
    } finally {
      this.abortControllers.delete(controller);
    }
  }

  /**
   * Make an execute request to Nado API (requires EIP712 signature)
   */
  private async execute<T>(type: string, payload: any, signature: string): Promise<T> {
    await this.rateLimiter.acquire('execute', 2);

    const startTime = Date.now();
    const controller = new AbortController();
    this.abortControllers.add(controller);

    try {
      const response = await fetch(`${this.apiUrl}/execute`, {
        method: 'POST',
        headers: NADO_REQUEST_CONFIG.headers,
        body: JSON.stringify({
          type,
          payload,
          signature,
        }),
        signal: controller.signal,
        // @ts-ignore
        timeout: NADO_REQUEST_CONFIG.timeout,
      });

      if (!response.ok) {
        throw new ExchangeUnavailableError(
          `Nado API error: ${response.status} ${response.statusText}`,
          'API_ERROR',
          this.id
        );
      }

      const data: NadoResponse<T> = await response.json();

      // Track metrics
      this.trackRequest('execute', Date.now() - startTime, data.status === 'success');

      if (data.status === 'failure') {
        throw new InvalidOrderError(
          `Nado execute failed: ${data.error}`,
          data.error_code?.toString() || 'EXECUTE_FAILED',
          this.id
        );
      }

      return data.data as T;
    } catch (error) {
      this.trackRequest('execute', Date.now() - startTime, false);
      throw this.mapError(error);
    } finally {
      this.abortControllers.delete(controller);
    }
  }

  /**
   * Fetch contracts information
   */
  private async fetchContracts(): Promise<NadoContracts> {
    const data = await this.query<NadoContracts>(NADO_QUERY_TYPES.CONTRACTS);
    return NadoContractsSchema.parse(data);
  }

  /**
   * Fetch current nonce for the wallet
   */
  private async fetchCurrentNonce(): Promise<void> {
    if (!this.wallet) {
      throw new PerpDEXError('Wallet not initialized', 'NO_WALLET', this.id);
    }

    const data = await this.query<{ nonce: number }>(NADO_QUERY_TYPES.NONCES, {
      subaccount: this.wallet.address,
    });

    this.currentNonce = data.nonce;
  }

  /**
   * Get next nonce and increment
   */
  private getNextNonce(): number {
    return this.currentNonce++;
  }

  /**
   * Get product mapping by symbol
   */
  private getProductMapping(symbol: string): ProductMapping {
    const nadoSymbol = ccxtSymbolToNado(symbol);
    const productId = this.symbolToProductId.get(nadoSymbol);

    if (productId === undefined) {
      throw new InvalidOrderError(
        `Unknown symbol: ${symbol}`,
        'UNKNOWN_SYMBOL',
        this.id
      );
    }

    const mapping = this.productMappings.get(productId);
    if (!mapping) {
      throw new InvalidOrderError(
        `Product mapping not found for ${symbol}`,
        'MAPPING_NOT_FOUND',
        this.id
      );
    }

    return mapping;
  }

  /**
   * Map errors to unified error types
   */
  private mapError(error: any): Error {
    if (error instanceof PerpDEXError) {
      return error;
    }

    if (error.name === 'AbortError') {
      return new ExchangeUnavailableError('Request timeout', 'TIMEOUT', this.id, error);
    }

    return new PerpDEXError(error.message || 'Unknown error', 'UNKNOWN_ERROR', this.id, error);
  }

  /**
   * Track request metrics
   */
  private trackRequest(endpoint: string, latency: number, success: boolean): void {
    this.metrics.totalRequests++;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average latency
    const totalLatency = this.metrics.averageLatency * (this.metrics.totalRequests - 1) + latency;
    this.metrics.averageLatency = totalLatency / this.metrics.totalRequests;
  }

  // ===========================================================================
  // Market Data - Public Methods
  // ===========================================================================

  async fetchMarkets(params?: MarketParams): Promise<Market[]> {
    // Check cache first
    const cached = this.getPreloadedMarkets();
    if (cached) {
      this.debug('Returning cached markets', { count: cached.length });
      return cached;
    }

    return this.fetchMarketsFromAPI(params);
  }

  /**
   * Internal method to fetch markets from API (bypasses cache)
   */
  protected async fetchMarketsFromAPI(params?: MarketParams): Promise<Market[]> {
    this.debug('Fetching markets from API...');

    const products = await this.query<NadoProduct[]>(NADO_QUERY_TYPES.ALL_PRODUCTS);

    // Build product mappings
    this.productMappings.clear();
    this.symbolToProductId.clear();

    const markets: Market[] = [];

    for (const product of products) {
      const market = normalizeNadoProduct(product);
      markets.push(market);

      // Store mappings
      const mapping: ProductMapping = {
        productId: product.product_id,
        symbol: product.symbol,
        ccxtSymbol: market.symbol,
      };

      this.productMappings.set(product.product_id, mapping);
      this.symbolToProductId.set(product.symbol, product.product_id);
    }

    this.debug('Markets fetched', { count: markets.length });
    return markets;
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    const mapping = this.getProductMapping(symbol);

    const ticker = await this.query<NadoTicker>(NADO_QUERY_TYPES.MARKET_PRICES, {
      product_id: mapping.productId,
    });

    return normalizeNadoTicker(NadoTickerSchema.parse(ticker));
  }

  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    const mapping = this.getProductMapping(symbol);

    const orderBook = await this.query<NadoOrderBook>(NADO_QUERY_TYPES.MARKET_LIQUIDITY, {
      product_id: mapping.productId,
    });

    return normalizeNadoOrderBook(NadoOrderBookSchema.parse(orderBook), symbol);
  }

  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    // Nado doesn't have a public trades endpoint in the standard query API
    // This would require WebSocket subscription to recent_trades channel
    this.warn('fetchTrades not fully supported on Nado (requires WebSocket)');
    return [];
  }

  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    const ticker = await this.fetchTicker(symbol);

    if (!ticker.info?.fundingRate) {
      throw new PerpDEXError(
        'Funding rate not available for this symbol',
        'NO_FUNDING_RATE',
        this.id
      );
    }

    const info = ticker.info as any;
    return {
      symbol,
      fundingRate: parseFloat(info.fundingRate as string),
      fundingTimestamp: Date.now(),
      nextFundingTimestamp: (info.nextFundingTime as number) || Date.now() + 8 * 3600 * 1000,
      markPrice: parseFloat(info.markPrice as string),
      indexPrice: parseFloat(info.indexPrice as string),
      fundingIntervalHours: 8,
    };
  }

  // ===========================================================================
  // Trading - Private Methods (Require Authentication)
  // ===========================================================================

  async createOrder(request: OrderRequest): Promise<Order> {
    if (!this.wallet) {
      throw new PerpDEXError('Wallet not initialized', 'NO_WALLET', this.id);
    }

    if (!this.contractsInfo) {
      throw new PerpDEXError('Contracts info not loaded', 'NO_CONTRACTS', this.id);
    }

    const mapping = this.getProductMapping(request.symbol);

    // Convert order to Nado format
    const priceX18 = toX18(request.price || 0);
    const amount = toX18(request.amount);
    const expiration = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
    const nonce = this.getNextNonce();

    const orderData: NadoEIP712Order = {
      sender: this.wallet.address,
      priceX18,
      amount,
      expiration,
      nonce,
      appendix: {
        productId: mapping.productId,
        side: request.side === 'buy' ? NADO_ORDER_SIDES.BUY : NADO_ORDER_SIDES.SELL,
        reduceOnly: request.reduceOnly || false,
        postOnly: request.postOnly || false,
      },
    };

    // Sign the order
    const signature = await signNadoOrder(
      this.wallet,
      orderData,
      this.chainId,
      mapping.productId
    );

    // Execute the order
    const response = await this.execute<NadoOrder>(
      NADO_EXECUTE_TYPES.PLACE_ORDER,
      orderData,
      signature
    );

    return normalizeNadoOrder(NadoOrderSchema.parse(response), mapping);
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    if (!this.wallet) {
      throw new PerpDEXError('Wallet not initialized', 'NO_WALLET', this.id);
    }

    if (!this.contractsInfo) {
      throw new PerpDEXError('Contracts info not loaded', 'NO_CONTRACTS', this.id);
    }

    // Fetch the order to get its digest
    const order = await this.query<NadoOrder>(NADO_QUERY_TYPES.ORDER, {
      order_id: orderId,
    });

    const mapping = this.productMappings.get(order.product_id);
    if (!mapping) {
      throw new InvalidOrderError('Product mapping not found', 'MAPPING_NOT_FOUND', this.id);
    }

    const cancellationData: NadoEIP712Cancellation = {
      sender: this.wallet.address,
      productIds: [order.product_id],
      digests: [order.digest],
      nonce: this.getNextNonce(),
    };

    const signature = await signNadoCancellation(
      this.wallet,
      cancellationData,
      this.chainId,
      this.contractsInfo.endpoint_address
    );

    await this.execute(NADO_EXECUTE_TYPES.CANCEL_ORDERS, cancellationData, signature);

    // Return updated order
    return normalizeNadoOrder(NadoOrderSchema.parse(order), mapping);
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    if (!this.wallet) {
      throw new PerpDEXError('Wallet not initialized', 'NO_WALLET', this.id);
    }

    if (!this.contractsInfo) {
      throw new PerpDEXError('Contracts info not loaded', 'NO_CONTRACTS', this.id);
    }

    // Fetch all open orders
    const orders = await this.query<NadoOrder[]>(NADO_QUERY_TYPES.ORDERS, {
      subaccount: this.wallet.address,
      status: 'open',
    });

    if (orders.length === 0) {
      return [];
    }

    // Filter by symbol if provided
    let ordersToCancel = orders;
    if (symbol) {
      const mapping = this.getProductMapping(symbol);
      ordersToCancel = orders.filter((o) => o.product_id === mapping.productId);
    }

    // Build cancellation data
    const cancellationData: NadoEIP712Cancellation = {
      sender: this.wallet.address,
      productIds: ordersToCancel.map((o) => o.product_id),
      digests: ordersToCancel.map((o) => o.digest),
      nonce: this.getNextNonce(),
    };

    const signature = await signNadoCancellation(
      this.wallet,
      cancellationData,
      this.chainId,
      this.contractsInfo.endpoint_address
    );

    await this.execute(NADO_EXECUTE_TYPES.CANCEL_ORDERS, cancellationData, signature);

    // Return cancelled orders
    return ordersToCancel.map((order) => {
      const mapping = this.productMappings.get(order.product_id)!;
      return normalizeNadoOrder(order, mapping);
    });
  }

  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    if (!this.wallet) {
      throw new PerpDEXError('Wallet not initialized', 'NO_WALLET', this.id);
    }

    const positions = await this.query<NadoPosition[]>(
      NADO_QUERY_TYPES.ISOLATED_POSITIONS,
      {
        subaccount: this.wallet.address,
      }
    );

    const normalized: Position[] = [];
    for (const position of positions) {
      const mapping = this.productMappings.get(position.product_id);
      if (!mapping) {
        this.warn(`Product mapping not found for product ID ${position.product_id}`);
        continue;
      }

      const normalizedPosition = normalizeNadoPosition(NadoPositionSchema.parse(position), mapping);
      if (normalizedPosition) {
        normalized.push(normalizedPosition);
      }
    }

    return normalized;
  }

  async fetchBalance(): Promise<Balance[]> {
    if (!this.wallet) {
      throw new PerpDEXError('Wallet not initialized', 'NO_WALLET', this.id);
    }

    const balance = await this.query<NadoBalance>(NADO_QUERY_TYPES.SUBACCOUNT_INFO, {
      subaccount: this.wallet.address,
    });

    return normalizeNadoBalance(NadoBalanceSchema.parse(balance));
  }

  /**
   * Fetch open orders
   *
   * Retrieves all open (unfilled) orders for the authenticated wallet.
   * Can be filtered by symbol to get orders for a specific trading pair.
   *
   * @param symbol - Optional symbol to filter orders (e.g., "BTC/USDT:USDT")
   * @returns Array of open orders
   * @throws {PerpDEXError} If wallet is not initialized
   *
   * @example
   * ```typescript
   * // Get all open orders
   * const allOrders = await adapter.fetchOpenOrders();
   *
   * // Get open orders for specific symbol
   * const btcOrders = await adapter.fetchOpenOrders('BTC/USDT:USDT');
   * ```
   */
  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    if (!this.wallet) {
      throw new PerpDEXError('Wallet not initialized', 'NO_WALLET', this.id);
    }

    const orders = await this.query<NadoOrder[]>(NADO_QUERY_TYPES.ORDERS, {
      subaccount: this.wallet.address,
      status: 'open',
    });

    if (orders.length === 0) {
      return [];
    }

    // Filter by symbol if provided
    let filteredOrders = orders;
    if (symbol) {
      const mapping = this.getProductMapping(symbol);
      filteredOrders = orders.filter((o) => o.product_id === mapping.productId);
    }

    // Normalize and return
    return filteredOrders
      .map((order) => {
        const mapping = this.productMappings.get(order.product_id);
        if (!mapping) return null;
        return normalizeNadoOrder(order, mapping);
      })
      .filter((o): o is Order => o !== null);
  }

  // ===========================================================================
  // WebSocket Streaming
  // ===========================================================================

  async *watchOrderBook(symbol: string): AsyncGenerator<OrderBook> {
    if (!this.wsManager) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }

    const mapping = this.getProductMapping(symbol);

    const subscription = {
      type: 'subscribe',
      channel: NADO_WS_CHANNELS.ORDERBOOK,
      product_id: mapping.productId,
    };

    const channel = `${NADO_WS_CHANNELS.ORDERBOOK}:${mapping.productId}`;

    for await (const update of this.wsManager.watch<NadoOrderBook>(
      channel,
      subscription
    )) {
      yield normalizeNadoOrderBook(update, symbol);
    }
  }

  async *watchPositions(): AsyncGenerator<Position[]> {
    if (!this.wsManager) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }

    if (!this.wallet) {
      throw new PerpDEXError('Wallet not initialized', 'NO_WALLET', this.id);
    }

    const subscription = {
      type: 'subscribe',
      channel: NADO_WS_CHANNELS.POSITIONS,
      subaccount: this.wallet.address,
    };

    const channel = `${NADO_WS_CHANNELS.POSITIONS}:${this.wallet.address}`;

    for await (const positions of this.wsManager.watch<NadoPosition[]>(
      channel,
      subscription
    )) {
      const normalized: Position[] = [];
      for (const position of positions) {
        const mapping = this.productMappings.get(position.product_id);
        if (!mapping) continue;
        const normalizedPos = normalizeNadoPosition(position, mapping);
        if (normalizedPos) normalized.push(normalizedPos);
      }

      yield normalized;
    }
  }

  async *watchOrders(): AsyncGenerator<Order[]> {
    if (!this.wsManager) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }

    if (!this.wallet) {
      throw new PerpDEXError('Wallet not initialized', 'NO_WALLET', this.id);
    }

    const subscription = {
      type: 'subscribe',
      channel: NADO_WS_CHANNELS.ORDERS,
      subaccount: this.wallet.address,
    };

    const channel = `${NADO_WS_CHANNELS.ORDERS}:${this.wallet.address}`;

    for await (const orders of this.wsManager.watch<NadoOrder[]>(
      channel,
      subscription
    )) {
      const normalized: Order[] = [];
      for (const order of orders) {
        const mapping = this.productMappings.get(order.product_id);
        if (!mapping) continue;
        normalized.push(normalizeNadoOrder(order, mapping));
      }

      yield normalized;
    }
  }

  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    if (!this.wsManager) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }

    const mapping = this.getProductMapping(symbol);

    const subscription = {
      type: 'subscribe',
      channel: NADO_WS_CHANNELS.TRADES,
      product_id: mapping.productId,
    };

    const channel = `${NADO_WS_CHANNELS.TRADES}:${mapping.productId}`;

    for await (const trade of this.wsManager.watch<NadoTrade>(
      channel,
      subscription
    )) {
      yield normalizeNadoTrade(trade, mapping);
    }
  }

  // ===========================================================================
  // Symbol Conversion (Required by BaseAdapter)
  // ===========================================================================

  protected symbolToExchange(symbol: string): string {
    return ccxtSymbolToNado(symbol);
  }

  protected symbolFromExchange(exchangeSymbol: string): string {
    return nadoSymbolToCCXT(exchangeSymbol);
  }

  // ===========================================================================
  // Not Implemented Methods (Return empty/throw)
  // ===========================================================================

  async fetchFundingRateHistory(
    _symbol: string,
    _since?: number,
    _limit?: number
  ): Promise<FundingRate[]> {
    throw new PerpDEXError(
      'fetchFundingRateHistory not supported on Nado',
      'NOT_SUPPORTED',
      this.id
    );
  }

  async fetchOrderHistory(
    _symbol?: string,
    _since?: number,
    _limit?: number
  ): Promise<Order[]> {
    if (!this.wallet) {
      throw new PerpDEXError('Wallet not initialized', 'NO_WALLET', this.id);
    }

    const orders = await this.query<NadoOrder[]>(NADO_QUERY_TYPES.ORDERS, {
      subaccount: this.wallet.address,
    });

    return orders
      .map((order) => {
        const mapping = this.productMappings.get(order.product_id);
        if (!mapping) return null;
        return normalizeNadoOrder(order, mapping);
      })
      .filter((o): o is Order => o !== null);
  }

  async fetchMyTrades(
    _symbol?: string,
    _since?: number,
    _limit?: number
  ): Promise<Trade[]> {
    throw new PerpDEXError(
      'fetchMyTrades not supported on Nado (use WebSocket fills channel)',
      'NOT_SUPPORTED',
      this.id
    );
  }

  async setLeverage(_symbol: string, _leverage: number): Promise<void> {
    throw new PerpDEXError(
      'setLeverage not supported on Nado (unified cross-margin system)',
      'NOT_SUPPORTED',
      this.id
    );
  }
}

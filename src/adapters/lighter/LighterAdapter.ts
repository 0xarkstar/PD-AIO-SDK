/**
 * Lighter exchange adapter implementation
 *
 * Supports two authentication modes:
 * 1. HMAC mode (legacy): Uses apiKey + apiSecret for HMAC-SHA256 signing
 * 2. WASM mode (recommended): Uses apiPrivateKey for WASM-based signing
 *
 * WASM signing is cross-platform and requires no native dependencies.
 * Install @oraichain/lighter-ts-sdk for full trading functionality.
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
} from '../../types/common.js';
import type { FeatureMap } from '../../types/adapter.js';
import { PerpDEXError, InvalidOrderError } from '../../types/errors.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { WebSocketManager } from '../../websocket/WebSocketManager.js';
import { LIGHTER_API_URLS, LIGHTER_RATE_LIMITS, LIGHTER_ENDPOINT_WEIGHTS, LIGHTER_WS_CONFIG } from './constants.js';
import { LighterNormalizer } from './LighterNormalizer.js';
import { LighterWebSocket } from './LighterWebSocket.js';
import { mapError } from './utils.js';
import { LighterWasmSigner } from './signer/index.js';
import { NonceManager } from './NonceManager.js';
import type { LighterConfig } from './types.js';
import {
  createOrderWasm,
  createOrderHMAC,
  cancelOrderWasm,
  cancelOrderHMAC,
  cancelAllOrdersWasm,
  cancelAllOrdersHMAC,
  withdrawCollateral as withdrawCollateralHelper,
  type TradingDeps,
} from './LighterTrading.js';
import {
  fetchMarketsData,
  fetchTickerData,
  fetchOrderBookData,
  fetchTradesData,
  fetchFundingRateData,
  type MarketDataDeps,
} from './LighterMarketData.js';
import {
  fetchPositionsData,
  fetchBalanceData,
  fetchOpenOrdersData,
  fetchOrderHistoryData,
  fetchMyTradesData,
  type AccountDeps,
} from './LighterAccount.js';

// Re-export LighterConfig from types.ts (replaces local interface)
export type { LighterConfig } from './types.js';

/** Chain IDs for Lighter */
const LIGHTER_CHAIN_IDS = {
  mainnet: 304,
  testnet: 300,
} as const;

/**
 * Lighter exchange adapter
 *
 * High-performance order book DEX on zkProof L2
 *
 * @example
 * ```typescript
 * // WASM mode (recommended - full trading, cross-platform)
 * const lighter = new LighterAdapter({
 *   apiPrivateKey: '0x...',
 *   testnet: true,
 * });
 *
 * // HMAC mode (legacy)
 * const lighterLegacy = new LighterAdapter({
 *   apiKey: 'your-api-key',
 *   apiSecret: 'your-api-secret',
 * });
 * ```
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
    createBatchOrders: 'emulated',
    cancelBatchOrders: 'emulated',
    cancelOrder: true,
    cancelAllOrders: true,
    setLeverage: false,
    watchOrderBook: true,
    watchTrades: true,
    watchTicker: true,
    watchPositions: true,
    watchOrders: true,
    watchBalance: true,
    watchMyTrades: true,
  };

  private readonly apiUrl: string;
  private readonly wsUrl: string;
  private readonly testnet: boolean;
  private readonly chainId: number;

  // HMAC auth (legacy)
  private readonly apiKey?: string;
  private readonly apiSecret?: string;

  // WASM auth (recommended - cross-platform signing)
  private readonly apiPrivateKey?: string;
  private signer: LighterWasmSigner | null = null;
  private nonceManager: NonceManager | null = null;
  private readonly accountIndex: number;
  private readonly apiKeyIndex: number;

  protected readonly rateLimiter: RateLimiter;
  protected readonly httpClient: HTTPClient;
  private normalizer: LighterNormalizer;
  private wsManager: WebSocketManager | null = null;
  private wsHandler: LighterWebSocket | null = null;

  // Cache for symbol -> market_id mapping (Lighter API requires market_id for orderbook)
  private marketIdCache: Map<string, number> = new Map();
  // Cache for symbol -> market metadata (for unit conversions)
  private marketMetadataCache: Map<string, {
    baseDecimals: number;
    quoteDecimals: number;
    tickSize: number;
    stepSize: number;
  }> = new Map();

  constructor(config: LighterConfig = {}) {
    super(config);

    this.testnet = config.testnet ?? false;
    const urls = this.testnet ? LIGHTER_API_URLS.testnet : LIGHTER_API_URLS.mainnet;

    this.apiUrl = urls.rest;
    this.wsUrl = urls.websocket;
    this.chainId = config.chainId ?? (this.testnet ? LIGHTER_CHAIN_IDS.testnet : LIGHTER_CHAIN_IDS.mainnet);

    // HMAC auth
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;

    // FFI auth
    this.apiPrivateKey = config.apiPrivateKey;
    this.accountIndex = config.accountIndex ?? 0;
    this.apiKeyIndex = config.apiKeyIndex ?? 255;

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

    // Setup WASM signer if private key is provided
    if (this.apiPrivateKey) {
      this.signer = new LighterWasmSigner({
        apiPrivateKey: this.apiPrivateKey,
        apiPublicKey: config.apiPublicKey,
        accountIndex: this.accountIndex,
        apiKeyIndex: this.apiKeyIndex,
        chainId: this.chainId,
      });

      this.nonceManager = new NonceManager({
        httpClient: this.httpClient,
        apiKeyIndex: this.apiKeyIndex,
      });
    }
  }

  /**
   * Check if WASM signing is available and initialized
   * Alias for hasWasmSigning for backward compatibility
   */
  get hasFFISigning(): boolean {
    return this.hasWasmSigning;
  }

  /**
   * Check if WASM signing is available and initialized
   */
  get hasWasmSigning(): boolean {
    return this.signer !== null && this.signer.isInitialized;
  }

  /**
   * Check if any authentication is configured
   */
  get hasAuthentication(): boolean {
    return !!(this.apiPrivateKey || (this.apiKey && this.apiSecret));
  }

  async initialize(): Promise<void> {
    // Initialize WASM signer if configured
    if (this.signer) {
      try {
        await this.signer.initialize();
      } catch (error) {
        // WASM initialization failed - fall back to HMAC or public-only mode
        this.logger.warn('WASM signer initialization failed, falling back to HMAC mode', { error: error instanceof Error ? error.message : String(error) });
        this.signer = null;
        this.nonceManager = null;
      }
    }

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

      // Initialize WebSocket handler
      this.wsHandler = new LighterWebSocket({
        wsManager: this.wsManager,
        normalizer: this.normalizer,
        signer: this.signer,
        apiKey: this.apiKey,
        accountIndex: this.accountIndex,
        apiKeyIndex: this.apiKeyIndex,
        hasAuthentication: this.hasAuthentication,
        hasWasmSigning: this.hasWasmSigning,
      });
    } catch (error) {
      // WebSocket initialization is optional - watch methods will throw if needed
      this.wsManager = null;
      this.wsHandler = null;
    }

    this._isReady = true;
  }

  async disconnect(): Promise<void> {
    // Disconnect WebSocket
    if (this.wsManager) {
      await this.wsManager.disconnect();
      this.wsManager = null;
      this.wsHandler = null;
    }

    // Clean up rate limiter to prevent hanging timers
    this.rateLimiter.destroy();

    // Reset signer and nonce manager
    this.signer = null;
    this.nonceManager = null;

    this._isReady = false;
  }

  // ==================== Market Data Methods ====================

  /** Get market data dependencies for helper functions */
  private getMarketDataDeps(): MarketDataDeps {
    return {
      normalizer: this.normalizer,
      marketIdCache: this.marketIdCache,
      marketMetadataCache: this.marketMetadataCache,
      request: <T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: Record<string, unknown>) =>
        this.request<T>(method, path, body),
    };
  }

  async fetchMarkets(_params?: MarketParams): Promise<Market[]> {
    await this.rateLimiter.acquire('fetchMarkets');
    return fetchMarketsData(this.getMarketDataDeps());
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    await this.rateLimiter.acquire('fetchTicker');
    return fetchTickerData(this.getMarketDataDeps(), symbol);
  }

  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    await this.rateLimiter.acquire('fetchOrderBook');
    return fetchOrderBookData(this.getMarketDataDeps(), symbol, params?.limit || 50, () => this.fetchMarkets());
  }

  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    await this.rateLimiter.acquire('fetchTrades');
    return fetchTradesData(this.getMarketDataDeps(), symbol, params?.limit || 100);
  }

  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    await this.rateLimiter.acquire('fetchFundingRate');
    return fetchFundingRateData(this.getMarketDataDeps(), symbol);
  }

  async fetchFundingRateHistory(
    _symbol: string,
    _since?: number,
    _limit?: number
  ): Promise<FundingRate[]> {
    throw new Error('Lighter does not support funding rate history');
  }

  // ==================== Trading Methods ====================

  /** Get trading dependencies for helper functions */
  private getTradingDeps(): TradingDeps {
    return {
      normalizer: this.normalizer,
      signer: this.signer,
      nonceManager: this.nonceManager,
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      marketIdCache: this.marketIdCache,
      marketMetadataCache: this.marketMetadataCache,
      fetchMarkets: () => this.fetchMarkets(),
      request: <T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: Record<string, unknown>) =>
        this.request<T>(method, path, body),
      handleTransactionError: (code: number) => this.handleTransactionError(code),
    };
  }

  async createOrder(request: OrderRequest): Promise<Order> {
    // Validate order request
    const validatedRequest = this.validateOrder(request);

    await this.rateLimiter.acquire('createOrder');

    const deps = this.getTradingDeps();

    // WASM signing is preferred for trading
    if (this.signer && this.nonceManager) {
      return createOrderWasm(deps, validatedRequest);
    }

    // Fall back to HMAC if available
    if (this.apiKey && this.apiSecret) {
      return createOrderHMAC(deps, validatedRequest);
    }

    throw new InvalidOrderError(
      'API credentials required for trading. Provide apiPrivateKey (recommended) or apiKey + apiSecret.',
      'AUTH_REQUIRED',
      'lighter'
    );
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    await this.rateLimiter.acquire('cancelOrder');

    const deps = this.getTradingDeps();

    // WASM signing is preferred
    if (this.signer && this.nonceManager) {
      return cancelOrderWasm(deps, orderId, symbol);
    }

    // Fall back to HMAC
    if (this.apiKey && this.apiSecret) {
      return cancelOrderHMAC(deps, orderId);
    }

    throw new InvalidOrderError(
      'API credentials required for trading',
      'AUTH_REQUIRED',
      'lighter'
    );
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    await this.rateLimiter.acquire('cancelAllOrders');

    const deps = this.getTradingDeps();

    // WASM signing is preferred
    if (this.signer && this.nonceManager) {
      return cancelAllOrdersWasm(deps, symbol);
    }

    // Fall back to HMAC
    if (this.apiKey && this.apiSecret) {
      return cancelAllOrdersHMAC(deps, symbol);
    }

    throw new InvalidOrderError(
      'API credentials required for trading',
      'AUTH_REQUIRED',
      'lighter'
    );
  }

  // ==================== Collateral Management ====================

  /**
   * Withdraw collateral from trading account
   *
   * Requires WASM signing - HMAC mode does not support withdrawals.
   *
   * @param collateralIndex - Collateral type index (0 = USDC)
   * @param amount - Amount to withdraw in base units
   * @param destinationAddress - Ethereum address to withdraw to
   * @returns Transaction hash
   */
  async withdrawCollateral(
    collateralIndex: number,
    amount: bigint,
    destinationAddress: string
  ): Promise<string> {
    return withdrawCollateralHelper(this.getTradingDeps(), collateralIndex, amount, destinationAddress);
  }

  /**
   * Handle transaction errors and auto-resync nonce if needed
   */
  private async handleTransactionError(code: number): Promise<void> {
    // Common nonce-related error codes
    const nonceErrorCodes = [
      1001, // Nonce too low
      1002, // Nonce too high
      1003, // Invalid nonce
    ];

    if (nonceErrorCodes.includes(code)) {
      this.logger.warn(`Nonce error detected (code ${code}), resyncing...`);
      await this.resyncNonce();
    }
  }

  /** Get account dependencies for helper functions */
  private getAccountDeps(): AccountDeps {
    return {
      normalizer: this.normalizer,
      request: <T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: Record<string, unknown>) =>
        this.request<T>(method, path, body),
    };
  }

  private ensureAuthenticated(): void {
    if (!this.hasAuthentication) {
      throw new PerpDEXError('API credentials required', 'AUTH_REQUIRED', 'lighter');
    }
  }

  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    await this.rateLimiter.acquire('fetchPositions');
    this.ensureAuthenticated();
    return fetchPositionsData(this.getAccountDeps(), symbols);
  }

  async fetchBalance(): Promise<Balance[]> {
    await this.rateLimiter.acquire('fetchBalance');
    this.ensureAuthenticated();
    return fetchBalanceData(this.getAccountDeps());
  }

  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    await this.rateLimiter.acquire('fetchOpenOrders');
    this.ensureAuthenticated();
    return fetchOpenOrdersData(this.getAccountDeps(), symbol);
  }

  // ==================== Required BaseAdapter Methods ====================

  async setLeverage(_symbol: string, _leverage: number): Promise<void> {
    throw new Error('Lighter does not support setLeverage');
  }

  async fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]> {
    await this.rateLimiter.acquire('fetchOrderHistory');
    this.ensureAuthenticated();
    return fetchOrderHistoryData(this.getAccountDeps(), symbol, since, limit);
  }

  async fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]> {
    await this.rateLimiter.acquire('fetchMyTrades');
    this.ensureAuthenticated();
    return fetchMyTradesData(this.getAccountDeps(), symbol, since, limit);
  }

  symbolToExchange(symbol: string): string {
    return this.normalizer.toLighterSymbol(symbol);
  }

  symbolFromExchange(exchangeSymbol: string): string {
    return this.normalizer.normalizeSymbol(exchangeSymbol);
  }

  /**
   * Make HTTP request to Lighter API using HTTPClient
   */
  protected async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const headers: Record<string, string> = {};

    // Add authentication headers
    if (this.signer && this.signer.isInitialized) {
      // For FFI mode, use auth token
      try {
        const authToken = await this.signer.createAuthToken();
        headers['Authorization'] = `Bearer ${authToken}`;
      } catch {
        // Fall back to HMAC if token creation fails
        if (this.apiKey && this.apiSecret) {
          await this.addHMACHeaders(headers, method, path, body);
        }
      }
    } else if (this.apiKey && this.apiSecret) {
      // HMAC mode
      await this.addHMACHeaders(headers, method, path, body);
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

  /**
   * Add HMAC authentication headers
   * Note: This is now async to support browser Web Crypto API
   */
  private async addHMACHeaders(
    headers: Record<string, string>,
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<void> {
    const timestamp = Date.now().toString();
    const signature = await this.generateSignature(method, path, timestamp, body);
    headers['X-API-KEY'] = this.apiKey!;
    headers['X-TIMESTAMP'] = timestamp;
    headers['X-SIGNATURE'] = signature;
  }

  // ==================== WebSocket Streaming Methods (delegated to LighterWebSocket) ====================

  async *watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook> {
    if (!this.wsHandler) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }
    yield* this.wsHandler.watchOrderBook(symbol, limit);
  }

  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    if (!this.wsHandler) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }
    yield* this.wsHandler.watchTrades(symbol);
  }

  async *watchPositions(): AsyncGenerator<Position[]> {
    if (!this.wsHandler) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }
    yield* this.wsHandler.watchPositions();
  }

  async *watchOrders(): AsyncGenerator<Order[]> {
    if (!this.wsHandler) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }
    yield* this.wsHandler.watchOrders();
  }

  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    if (!this.wsHandler) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }
    yield* this.wsHandler.watchTicker(symbol);
  }

  async *watchBalance(): AsyncGenerator<Balance[]> {
    if (!this.wsHandler) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }
    yield* this.wsHandler.watchBalance();
  }

  /**
   * Watch user trades (fills) in real-time
   *
   * @param symbol - Optional symbol filter
   * @returns AsyncGenerator yielding Trade updates
   */
  async *watchMyTrades(symbol?: string): AsyncGenerator<Trade> {
    if (!this.wsHandler) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }
    yield* this.wsHandler.watchMyTrades(symbol);
  }

  // ==================== Private Helper Methods ====================

  /**
   * Generate HMAC signature for authenticated requests
   * Note: This is now async to support browser Web Crypto API
   */
  private async generateSignature(
    method: string,
    path: string,
    timestamp: string,
    body?: Record<string, unknown>
  ): Promise<string> {
    const message = `${timestamp}${method}${path}${body ? JSON.stringify(body) : ''}`;
    return createHmacSha256(this.apiSecret!, message);
  }

  /**
   * Resync nonce with server (useful after errors)
   */
  async resyncNonce(): Promise<void> {
    if (this.nonceManager) {
      await this.nonceManager.sync();
    }
  }

  // ==================== Health Check Methods ====================

  /**
   * Ping the server to check connectivity
   *
   * @returns Response time in milliseconds
   */
  async ping(): Promise<number> {
    const startTime = Date.now();
    try {
      await this.request<{ code: number }>('GET', '/api/v1/orderBookDetails');
      return Date.now() - startTime;
    } catch (error) {
      throw mapError(error);
    }
  }

  /**
   * Get adapter status including connection health
   */
  async getStatus(): Promise<{
    ready: boolean;
    authenticated: boolean;
    authMode: 'wasm' | 'hmac' | 'none';
    wsConnected: boolean;
    network: 'mainnet' | 'testnet';
    latencyMs?: number;
    rateLimiter: {
      availableTokens: number;
      queueLength: number;
    };
  }> {
    let latencyMs: number | undefined;
    try {
      latencyMs = await this.ping();
    } catch {
      // Server unreachable
    }

    const rateLimiterStats = this.rateLimiter.getStats();

    return {
      ready: this._isReady,
      authenticated: this.hasAuthentication,
      authMode: this.hasWasmSigning ? 'wasm' : (this.apiKey && this.apiSecret ? 'hmac' : 'none'),
      wsConnected: this.wsManager !== null,
      network: this.testnet ? 'testnet' : 'mainnet',
      latencyMs,
      rateLimiter: {
        availableTokens: rateLimiterStats.availableTokens,
        queueLength: rateLimiterStats.queueLength,
      },
    };
  }

  /**
   * Check if the adapter is healthy and ready for trading
   */
  async isHealthy(): Promise<boolean> {
    if (!this._isReady) return false;

    try {
      const latency = await this.ping();
      return latency < 5000; // Consider healthy if response under 5 seconds
    } catch {
      return false;
    }
  }
}

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
import { LIGHTER_API_URLS, LIGHTER_RATE_LIMITS, LIGHTER_ENDPOINT_WEIGHTS, LIGHTER_WS_CONFIG, LIGHTER_WS_CHANNELS } from './constants.js';
import { LighterNormalizer } from './LighterNormalizer.js';
import { mapError } from './utils.js';
import { LighterWasmSigner, OrderType, TimeInForce } from './signer/index.js';
import { NonceManager } from './NonceManager.js';
import type {
  LighterConfig,
  LighterOrder,
  LighterPosition,
  LighterBalance,
  LighterOrderBook,
  LighterTrade,
  LighterTicker,
  LighterFundingRate,
} from './types.js';

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
   * @deprecated Use hasWasmSigning instead
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
        console.warn('WASM signer initialization failed, falling back to HMAC mode:', error);
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
    } catch (error) {
      // WebSocket initialization is optional - watch methods will throw if needed
      this.wsManager = null;
    }

    this._isReady = true;
  }

  async disconnect(): Promise<void> {
    // Disconnect WebSocket
    if (this.wsManager) {
      await this.wsManager.disconnect();
      this.wsManager = null;
    }

    // Clean up rate limiter to prevent hanging timers
    this.rateLimiter.destroy();

    // Reset signer and nonce manager
    this.signer = null;
    this.nonceManager = null;

    this._isReady = false;
  }

  // ==================== Market Data Methods ====================

  async fetchMarkets(params?: MarketParams): Promise<Market[]> {
    await this.rateLimiter.acquire('fetchMarkets');

    try {
      const response = await this.request<{ code: number; order_book_details: any[] }>(
        'GET',
        '/api/v1/orderBookDetails'
      );

      if (!response.order_book_details || !Array.isArray(response.order_book_details)) {
        throw new PerpDEXError('Invalid markets response', 'INVALID_RESPONSE', 'lighter');
      }

      // Filter for perp markets only
      const perpMarkets = response.order_book_details.filter(
        (m: any) => m.market_type === 'perp'
      );

      // Cache market_id and metadata for each symbol
      for (const market of perpMarkets) {
        if (market.symbol && market.market_id !== undefined) {
          this.marketIdCache.set(market.symbol, market.market_id);
          this.marketMetadataCache.set(market.symbol, {
            baseDecimals: market.base_decimals ?? 8,
            quoteDecimals: market.quote_decimals ?? 6,
            tickSize: parseFloat(market.tick_size ?? '0.01'),
            stepSize: parseFloat(market.step_size ?? '0.001'),
          });
        }
      }

      return perpMarkets.map((market: any) => this.normalizer.normalizeMarket(market));
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    await this.rateLimiter.acquire('fetchTicker');

    try {
      const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
      const response = await this.request<{ code: number; order_book_details: any[] }>(
        'GET',
        '/api/v1/orderBookDetails'
      );

      if (!response.order_book_details) {
        throw new PerpDEXError('Invalid ticker response', 'INVALID_RESPONSE', 'lighter');
      }

      // Find the market matching the symbol
      const market = response.order_book_details.find(
        (m: any) => m.symbol === lighterSymbol && m.market_type === 'perp'
      );

      if (!market) {
        throw new PerpDEXError(`Market not found: ${symbol}`, 'INVALID_SYMBOL', 'lighter');
      }

      return this.normalizer.normalizeTicker(market);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    await this.rateLimiter.acquire('fetchOrderBook');

    try {
      const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
      const limit = params?.limit || 50;

      // Get market_id from cache, or fetch markets first if cache is empty
      let marketId = this.marketIdCache.get(lighterSymbol);
      if (marketId === undefined) {
        await this.fetchMarkets();
        marketId = this.marketIdCache.get(lighterSymbol);
        if (marketId === undefined) {
          throw new PerpDEXError(`Market not found: ${symbol}`, 'INVALID_SYMBOL', 'lighter');
        }
      }

      // Lighter API requires market_id parameter for orderBookOrders endpoint
      const response = await this.request<{ code: number; asks: any[]; bids: any[] }>(
        'GET',
        `/api/v1/orderBookOrders?market_id=${marketId}&limit=${limit}`
      );

      // Convert to LighterOrderBook format
      // Response format: { asks: [{price, remaining_base_amount, ...}], bids: [...] }
      const orderBook: LighterOrderBook = {
        symbol: lighterSymbol,
        bids: response.bids?.map((b: any) => [
          parseFloat(b.price || '0'),
          parseFloat(b.remaining_base_amount || b.size || '0')
        ]) || [],
        asks: response.asks?.map((a: any) => [
          parseFloat(a.price || '0'),
          parseFloat(a.remaining_base_amount || a.size || '0')
        ]) || [],
        timestamp: Date.now(),
      };

      return this.normalizer.normalizeOrderBook(orderBook);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    await this.rateLimiter.acquire('fetchTrades');

    try {
      const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
      const limit = params?.limit || 100;
      // Lighter API uses /api/v1/trades endpoint
      const response = await this.request<{ code: number; trades: any[] }>(
        'GET',
        `/api/v1/trades?symbol=${lighterSymbol}&limit=${limit}`
      );

      const trades = response.trades || [];
      if (!Array.isArray(trades)) {
        throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'lighter');
      }

      // Map trades to expected format
      return trades.map((trade: any) => {
        const normalizedTrade: LighterTrade = {
          id: trade.id || trade.trade_id || String(Date.now()),
          symbol: lighterSymbol,
          side: (trade.side || 'buy').toLowerCase() as 'buy' | 'sell',
          price: parseFloat(trade.price || '0'),
          amount: parseFloat(trade.size || trade.amount || '0'),
          timestamp: trade.timestamp || trade.created_at || Date.now(),
        };
        return this.normalizer.normalizeTrade(normalizedTrade);
      });
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
    // Validate order request
    const validatedRequest = this.validateOrder(request);

    await this.rateLimiter.acquire('createOrder');

    // WASM signing is preferred for trading
    if (this.signer && this.nonceManager) {
      return this.createOrderWasm(validatedRequest);
    }

    // Fall back to HMAC if available
    if (this.apiKey && this.apiSecret) {
      return this.createOrderHMAC(validatedRequest);
    }

    throw new InvalidOrderError(
      'API credentials required for trading. Provide apiPrivateKey (recommended) or apiKey + apiSecret.',
      'AUTH_REQUIRED',
      'lighter'
    );
  }

  /**
   * Create order using WASM signing
   */
  private async createOrderWasm(request: OrderRequest): Promise<Order> {
    const lighterSymbol = this.normalizer.toLighterSymbol(request.symbol);

    // Ensure market metadata is loaded
    let marketId = this.marketIdCache.get(lighterSymbol);
    if (marketId === undefined) {
      await this.fetchMarkets();
      marketId = this.marketIdCache.get(lighterSymbol);
      if (marketId === undefined) {
        throw new InvalidOrderError(`Market not found: ${request.symbol}`, 'INVALID_SYMBOL', 'lighter');
      }
    }

    const metadata = this.marketMetadataCache.get(lighterSymbol);
    if (!metadata) {
      throw new InvalidOrderError(`Market metadata not found: ${request.symbol}`, 'INVALID_SYMBOL', 'lighter');
    }

    // Get nonce
    const nonce = await this.nonceManager!.getNextNonce();

    try {
      // Convert to base units
      const baseAmount = this.toBaseUnits(request.amount, metadata.baseDecimals);
      const price = this.toPriceUnits(request.price || 0, metadata.tickSize);

      // Map order type
      const orderType = this.mapOrderType(request.type);
      const timeInForce = this.mapTimeInForce(request.timeInForce, request.postOnly);

      // Sign the order
      const signedTx = await this.signer!.signCreateOrder({
        marketIndex: marketId,
        clientOrderIndex: BigInt(request.clientOrderId || Date.now()),
        baseAmount,
        price,
        isAsk: request.side === 'sell',
        orderType,
        timeInForce,
        reduceOnly: request.reduceOnly ?? false,
        triggerPrice: request.stopPrice ? this.toPriceUnits(request.stopPrice, metadata.tickSize) : 0,
        orderExpiry: BigInt(0), // No expiry
        nonce,
      });

      // Send the transaction
      const response = await this.request<{ code: number; order: any }>('POST', '/api/v1/sendTx', {
        tx_type: signedTx.txType,
        tx_info: signedTx.txInfo,
      });

      if (response.code !== 0) {
        // Check for nonce errors and auto-resync
        await this.handleTransactionError(response.code);
        throw new InvalidOrderError(`Order creation failed: code ${response.code}`, 'ORDER_REJECTED', 'lighter');
      }

      return this.normalizer.normalizeOrder(response.order);
    } catch (error) {
      // Rollback nonce on pre-submission errors (signing failed, etc.)
      const errorMsg = error instanceof Error ? error.message : '';
      if (!errorMsg.includes('code')) {
        this.nonceManager!.rollback();
      }
      throw mapError(error);
    }
  }

  /**
   * Create order using HMAC signing (legacy)
   */
  private async createOrderHMAC(request: OrderRequest): Promise<Order> {
    const lighterSymbol = this.normalizer.toLighterSymbol(request.symbol);
    const orderRequest = this.convertOrderRequest(request, lighterSymbol);

    const response = await this.request<LighterOrder>('POST', '/orders', orderRequest);

    return this.normalizer.normalizeOrder(response);
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    await this.rateLimiter.acquire('cancelOrder');

    // WASM signing is preferred
    if (this.signer && this.nonceManager) {
      return this.cancelOrderWasm(orderId, symbol);
    }

    // Fall back to HMAC
    if (this.apiKey && this.apiSecret) {
      return this.cancelOrderHMAC(orderId);
    }

    throw new InvalidOrderError(
      'API credentials required for trading',
      'AUTH_REQUIRED',
      'lighter'
    );
  }

  /**
   * Cancel order using WASM signing
   */
  private async cancelOrderWasm(orderId: string, symbol?: string): Promise<Order> {
    // Get market index
    let marketIndex = 0;
    if (symbol) {
      const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
      const cached = this.marketIdCache.get(lighterSymbol);
      if (cached === undefined) {
        await this.fetchMarkets();
        marketIndex = this.marketIdCache.get(lighterSymbol) ?? 0;
      } else {
        marketIndex = cached;
      }
    }

    const nonce = await this.nonceManager!.getNextNonce();

    try {
      const signedTx = await this.signer!.signCancelOrder({
        marketIndex,
        orderId: BigInt(orderId),
        nonce,
      });

      const response = await this.request<{ code: number; order: any }>('POST', '/api/v1/sendTx', {
        tx_type: signedTx.txType,
        tx_info: signedTx.txInfo,
      });

      if (response.code !== 0) {
        await this.handleTransactionError(response.code);
        throw new InvalidOrderError(`Cancel failed: code ${response.code}`, 'CANCEL_REJECTED', 'lighter');
      }

      return this.normalizer.normalizeOrder(response.order);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '';
      if (!errorMsg.includes('code')) {
        this.nonceManager!.rollback();
      }
      throw mapError(error);
    }
  }

  /**
   * Cancel order using HMAC signing (legacy)
   */
  private async cancelOrderHMAC(orderId: string): Promise<Order> {
    const response = await this.request<LighterOrder>('DELETE', `/orders/${orderId}`);
    return this.normalizer.normalizeOrder(response);
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    await this.rateLimiter.acquire('cancelAllOrders');

    // WASM signing is preferred
    if (this.signer && this.nonceManager) {
      return this.cancelAllOrdersWasm(symbol);
    }

    // Fall back to HMAC
    if (this.apiKey && this.apiSecret) {
      return this.cancelAllOrdersHMAC(symbol);
    }

    throw new InvalidOrderError(
      'API credentials required for trading',
      'AUTH_REQUIRED',
      'lighter'
    );
  }

  /**
   * Cancel all orders using WASM signing
   */
  private async cancelAllOrdersWasm(symbol?: string): Promise<Order[]> {
    // Get market index (-1 for all markets)
    let marketIndex = -1;
    if (symbol) {
      const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
      const cached = this.marketIdCache.get(lighterSymbol);
      if (cached !== undefined) {
        marketIndex = cached;
      } else {
        await this.fetchMarkets();
        marketIndex = this.marketIdCache.get(lighterSymbol) ?? -1;
      }
    }

    const nonce = await this.nonceManager!.getNextNonce();

    try {
      const signedTx = await this.signer!.signCancelAllOrders({
        marketIndex: marketIndex >= 0 ? marketIndex : undefined,
        nonce,
      });

      const response = await this.request<{ code: number; orders: any[] }>('POST', '/api/v1/sendTx', {
        tx_type: signedTx.txType,
        tx_info: signedTx.txInfo,
      });

      if (response.code !== 0) {
        await this.handleTransactionError(response.code);
        throw new InvalidOrderError(`Cancel all failed: code ${response.code}`, 'CANCEL_REJECTED', 'lighter');
      }

      return (response.orders || []).map((order: any) => this.normalizer.normalizeOrder(order));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '';
      if (!errorMsg.includes('code')) {
        this.nonceManager!.rollback();
      }
      throw mapError(error);
    }
  }

  /**
   * Cancel all orders using HMAC signing (legacy)
   */
  private async cancelAllOrdersHMAC(symbol?: string): Promise<Order[]> {
    const path = symbol ? `/orders?symbol=${this.normalizer.toLighterSymbol(symbol)}` : '/orders';
    const response = await this.request<LighterOrder[]>('DELETE', path);

    if (!Array.isArray(response)) {
      return [];
    }

    return response.map((order: any) => this.normalizer.normalizeOrder(order));
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
   *
   * @example
   * ```typescript
   * // Withdraw 100 USDC
   * const txHash = await lighter.withdrawCollateral(
   *   0,          // USDC collateral index
   *   100000000n, // 100 USDC (6 decimals)
   *   '0x...'     // Your wallet address
   * );
   * ```
   */
  async withdrawCollateral(
    collateralIndex: number,
    amount: bigint,
    destinationAddress: string
  ): Promise<string> {
    if (!this.hasWasmSigning || !this.nonceManager) {
      throw new PerpDEXError(
        'Withdrawals require WASM signing. Configure apiPrivateKey and install @oraichain/lighter-ts-sdk.',
        'AUTH_REQUIRED',
        'lighter'
      );
    }

    // Validate address format
    if (!destinationAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new InvalidOrderError(
        'Invalid destination address format',
        'INVALID_ADDRESS',
        'lighter'
      );
    }

    const nonce = await this.nonceManager.getNextNonce();

    try {
      const signedTx = await this.signer!.signWithdrawCollateral({
        collateralIndex,
        amount,
        destinationAddress,
        nonce,
      });

      const response = await this.request<{ code: number; tx_hash: string }>('POST', '/api/v1/sendTx', {
        tx_type: signedTx.txType,
        tx_info: signedTx.txInfo,
      });

      if (response.code !== 0) {
        // Check for nonce errors and resync
        await this.handleTransactionError(response.code);
        throw new PerpDEXError(
          `Withdrawal failed: code ${response.code}`,
          'WITHDRAWAL_FAILED',
          'lighter'
        );
      }

      return response.tx_hash || signedTx.txHash;
    } catch (error) {
      this.nonceManager.rollback();
      throw mapError(error);
    }
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
      console.warn(`Nonce error detected (code ${code}), resyncing...`);
      await this.resyncNonce();
    }
  }

  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    await this.rateLimiter.acquire('fetchPositions');

    if (!this.hasAuthentication) {
      throw new PerpDEXError(
        'API credentials required',
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

    if (!this.hasAuthentication) {
      throw new PerpDEXError(
        'API credentials required',
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

    if (!this.hasAuthentication) {
      throw new PerpDEXError(
        'API credentials required',
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

    if (!this.hasAuthentication) {
      throw new PerpDEXError(
        'API credentials required',
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

    if (!this.hasAuthentication) {
      throw new PerpDEXError(
        'API credentials required',
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
   * Convert amount to base units
   */
  private toBaseUnits(amount: number, decimals: number): bigint {
    const factor = 10 ** decimals;
    return BigInt(Math.round(amount * factor));
  }

  /**
   * Convert price to price units
   */
  private toPriceUnits(price: number, tickSize: number): number {
    return Math.round(price / tickSize);
  }

  /**
   * Map unified order type to Lighter order type
   */
  private mapOrderType(type: string): OrderType {
    switch (type.toLowerCase()) {
      case 'limit':
        return OrderType.LIMIT;
      case 'market':
        return OrderType.MARKET;
      case 'stop_limit':
      case 'stop-limit':
        return OrderType.STOP_LIMIT;
      case 'stop_market':
      case 'stop-market':
        return OrderType.STOP_MARKET;
      default:
        return OrderType.LIMIT;
    }
  }

  /**
   * Map unified time in force to Lighter time in force
   */
  private mapTimeInForce(tif?: string, postOnly?: boolean): TimeInForce {
    if (postOnly) {
      return TimeInForce.POST_ONLY;
    }
    switch (tif?.toUpperCase()) {
      case 'IOC':
        return TimeInForce.IOC;
      case 'FOK':
        return TimeInForce.FOK;
      case 'PO':
      case 'POST_ONLY':
        return TimeInForce.POST_ONLY;
      case 'GTC':
      default:
        return TimeInForce.GTC;
    }
  }

  /**
   * Convert unified order request to Lighter format (for HMAC mode)
   */
  private convertOrderRequest(
    request: OrderRequest,
    lighterSymbol: string
  ): Record<string, unknown> {
    const order: Record<string, unknown> = {
      symbol: lighterSymbol,
      side: request.side,
      type: request.type,
      quantity: request.amount,
    };

    if (request.price !== undefined) {
      order.price = request.price;
    }

    if (request.clientOrderId) {
      order.clientOrderId = request.clientOrderId;
    }

    if (request.reduceOnly) {
      order.reduceOnly = true;
    }

    if (request.postOnly) {
      order.timeInForce = 'PO';
    } else if (request.timeInForce) {
      order.timeInForce = request.timeInForce;
    }

    return order;
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

    if (!this.hasAuthentication) {
      throw new PerpDEXError('API credentials required for position streaming', 'AUTH_REQUIRED', this.id);
    }

    // Build subscription with appropriate auth
    const subscription = await this.buildAuthenticatedSubscription(LIGHTER_WS_CHANNELS.POSITIONS);

    const channelId = `${LIGHTER_WS_CHANNELS.POSITIONS}:${this.getAuthIdentifier()}`;

    for await (const positions of this.wsManager.watch<LighterPosition[]>(channelId, subscription)) {
      yield positions.map(position => this.normalizer.normalizePosition(position));
    }
  }

  async *watchOrders(): AsyncGenerator<Order[]> {
    if (!this.wsManager) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }

    if (!this.hasAuthentication) {
      throw new PerpDEXError('API credentials required for order streaming', 'AUTH_REQUIRED', this.id);
    }

    const subscription = await this.buildAuthenticatedSubscription(LIGHTER_WS_CHANNELS.ORDERS);

    const channelId = `${LIGHTER_WS_CHANNELS.ORDERS}:${this.getAuthIdentifier()}`;

    for await (const orders of this.wsManager.watch<LighterOrder[]>(channelId, subscription)) {
      yield orders.map(order => this.normalizer.normalizeOrder(order));
    }
  }

  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    if (!this.wsManager) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }

    const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
    const subscription = {
      type: 'subscribe',
      channel: LIGHTER_WS_CHANNELS.TICKER,
      symbol: lighterSymbol,
    };

    const channelId = `${LIGHTER_WS_CHANNELS.TICKER}:${lighterSymbol}`;

    for await (const ticker of this.wsManager.watch<LighterTicker>(channelId, subscription)) {
      yield this.normalizer.normalizeTicker(ticker);
    }
  }

  async *watchBalance(): AsyncGenerator<Balance[]> {
    if (!this.wsManager) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }

    if (!this.hasAuthentication) {
      throw new PerpDEXError('API credentials required for balance streaming', 'AUTH_REQUIRED', this.id);
    }

    // Lighter doesn't have a dedicated balance channel, so we use positions channel
    // and extract balance info, or poll periodically
    const subscription = await this.buildAuthenticatedSubscription('balance');

    const channelId = `balance:${this.getAuthIdentifier()}`;

    for await (const balances of this.wsManager.watch<LighterBalance[]>(channelId, subscription)) {
      yield balances.map(balance => this.normalizer.normalizeBalance(balance));
    }
  }

  /**
   * Watch user trades (fills) in real-time
   *
   * @param symbol - Optional symbol filter
   * @returns AsyncGenerator yielding Trade updates
   *
   * @example
   * ```typescript
   * for await (const trade of adapter.watchMyTrades('BTC/USDT:USDT')) {
   *   console.log('Fill:', trade.symbol, trade.side, trade.amount, '@', trade.price);
   * }
   * ```
   */
  async *watchMyTrades(symbol?: string): AsyncGenerator<Trade> {
    if (!this.wsManager) {
      throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
    }

    if (!this.hasAuthentication) {
      throw new PerpDEXError('API credentials required for trade streaming', 'AUTH_REQUIRED', this.id);
    }

    const subscription = await this.buildAuthenticatedSubscription(LIGHTER_WS_CHANNELS.FILLS);

    if (symbol) {
      const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
      (subscription as any).symbol = lighterSymbol;
    }

    const channelId = `${LIGHTER_WS_CHANNELS.FILLS}:${this.getAuthIdentifier()}`;

    for await (const trade of this.wsManager.watch<LighterTrade>(channelId, subscription)) {
      yield this.normalizer.normalizeTrade(trade);
    }
  }

  /**
   * Build authenticated subscription object for WebSocket
   */
  private async buildAuthenticatedSubscription(channel: string): Promise<Record<string, unknown>> {
    const subscription: Record<string, unknown> = {
      type: 'subscribe',
      channel,
    };

    // Use auth token for FFI mode, apiKey for HMAC mode
    if (this.hasWasmSigning) {
      try {
        const authToken = await this.signer!.createAuthToken();
        subscription.authToken = authToken;
      } catch {
        // Fall back to apiKey
        subscription.apiKey = this.apiKey;
      }
    } else if (this.apiKey) {
      subscription.apiKey = this.apiKey;
    }

    return subscription;
  }

  /**
   * Get authentication identifier for channel naming
   */
  private getAuthIdentifier(): string {
    if (this.hasWasmSigning) {
      return `account-${this.accountIndex}-${this.apiKeyIndex}`;
    }
    return this.apiKey || 'anonymous';
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

/**
 * Exchange Adapter Interface
 *
 * Defines the contract that all exchange adapters must implement
 */

import type {
  Balance,
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
} from './common.js';

/**
 * Feature capabilities map
 */
export interface FeatureMap {
  // Market Data (Public)
  fetchMarkets: boolean;
  fetchTicker: boolean;
  fetchOrderBook: boolean;
  fetchTrades: boolean;
  fetchFundingRate: boolean;
  fetchFundingRateHistory: boolean;

  // Trading (Private)
  createOrder: boolean;
  cancelOrder: boolean;
  cancelAllOrders: boolean;
  createBatchOrders: boolean;
  cancelBatchOrders: boolean;
  editOrder: boolean;

  // Positions & Balance
  fetchPositions: boolean;
  fetchBalance: boolean;
  setLeverage: boolean;
  setMarginMode: boolean | 'emulated';

  // WebSocket Streams
  watchOrderBook: boolean;
  watchTrades: boolean;
  watchTicker: boolean;
  watchPositions: boolean;
  watchOrders: boolean;
  watchBalance: boolean;
  watchFundingRate: boolean;

  // Advanced Features
  twapOrders: boolean;
  vaultTrading: boolean;
}

/**
 * Main exchange adapter interface
 */
export interface IExchangeAdapter {
  /**
   * Exchange identifier (e.g., "hyperliquid", "paradex")
   */
  readonly id: string;

  /**
   * Exchange display name
   */
  readonly name: string;

  /**
   * Feature capability flags
   */
  readonly has: Partial<FeatureMap>;

  /**
   * Whether adapter is initialized and ready
   */
  readonly isReady: boolean;

  // ===========================================================================
  // Connection Management
  // ===========================================================================

  /**
   * Initialize the exchange adapter
   *
   * @throws {ExchangeUnavailableError} If initialization fails
   */
  initialize(): Promise<void>;

  /**
   * Disconnect and cleanup resources
   *
   * Cleans up:
   * - WebSocket connections
   * - Active timers and intervals
   * - Pending HTTP requests
   * - Cached data
   */
  disconnect(): Promise<void>;

  /**
   * Check if adapter has been disconnected
   *
   * @returns true if disconnect() has been called
   */
  isDisconnected(): boolean;

  /**
   * Clear all cached data
   */
  clearCache(): void;

  /**
   * Perform health check on exchange adapter
   *
   * Checks:
   * - API connectivity and latency
   * - WebSocket connection (if applicable)
   * - Authentication validity (if authenticated)
   * - Rate limit status
   *
   * @param config - Health check configuration
   * @returns Promise resolving to health check result
   *
   * @example
   * ```typescript
   * const health = await exchange.healthCheck();
   * if (health.status === 'healthy') {
   *   console.log('Exchange is operational');
   * } else {
   *   console.warn('Exchange issues detected:', health);
   * }
   * ```
   */
  healthCheck(config?: import('./health.js').HealthCheckConfig): Promise<import('./health.js').HealthCheckResult>;

  // ===========================================================================
  // Market Data (Public)
  // ===========================================================================

  /**
   * Fetch all available markets
   *
   * @param params - Optional filtering parameters
   * @returns Promise resolving to array of markets
   * @throws {ExchangeUnavailableError} If API is unavailable
   * @throws {RateLimitError} If rate limit exceeded
   *
   * @example
   * ```typescript
   * const markets = await exchange.fetchMarkets({ active: true });
   * console.log(markets[0].symbol); // "BTC/USDT:USDT"
   * ```
   */
  fetchMarkets(params?: MarketParams): Promise<Market[]>;

  /**
   * Fetch 24h ticker statistics for a symbol
   *
   * @param symbol - Symbol in unified format
   * @returns Promise resolving to ticker data
   * @throws {ExchangeUnavailableError} If API is unavailable
   */
  fetchTicker(symbol: string): Promise<Ticker>;

  /**
   * Fetch order book for a symbol
   *
   * @param symbol - Symbol in unified format
   * @param params - Optional parameters (limit)
   * @returns Promise resolving to order book snapshot
   * @throws {ExchangeUnavailableError} If API is unavailable
   */
  fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;

  /**
   * Fetch recent trades for a symbol
   *
   * @param symbol - Symbol in unified format
   * @param params - Optional parameters (limit, since)
   * @returns Promise resolving to array of trades
   * @throws {ExchangeUnavailableError} If API is unavailable
   */
  fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;

  /**
   * Fetch current funding rate for a symbol
   *
   * @param symbol - Symbol in unified format
   * @returns Promise resolving to funding rate data
   * @throws {ExchangeUnavailableError} If API is unavailable
   */
  fetchFundingRate(symbol: string): Promise<FundingRate>;

  /**
   * Fetch historical funding rates for a symbol
   *
   * @param symbol - Symbol in unified format
   * @param since - Start timestamp (ms)
   * @param limit - Maximum number of records
   * @returns Promise resolving to array of historical funding rates
   * @throws {ExchangeUnavailableError} If API is unavailable
   */
  fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;

  // ===========================================================================
  // Trading (Private)
  // ===========================================================================

  /**
   * Create a new order
   *
   * @param request - Order parameters
   * @returns Promise resolving to created order
   * @throws {InsufficientMarginError} If insufficient margin
   * @throws {InvalidOrderError} If order parameters invalid
   * @throws {RateLimitError} If rate limit exceeded
   *
   * @example
   * ```typescript
   * const order = await exchange.createOrder({
   *   symbol: 'BTC/USDT:USDT',
   *   type: 'limit',
   *   side: 'buy',
   *   amount: 0.1,
   *   price: 50000,
   *   postOnly: true
   * });
   * ```
   */
  createOrder(request: OrderRequest): Promise<Order>;

  /**
   * Cancel an existing order
   *
   * @param orderId - Order ID to cancel
   * @param symbol - Symbol (required by some exchanges)
   * @returns Promise resolving to canceled order
   * @throws {OrderNotFoundError} If order not found
   */
  cancelOrder(orderId: string, symbol?: string): Promise<Order>;

  /**
   * Cancel all open orders (optionally filtered by symbol)
   *
   * @param symbol - Optional symbol to filter cancellations
   * @returns Promise resolving to array of canceled orders
   */
  cancelAllOrders(symbol?: string): Promise<Order[]>;

  /**
   * Create multiple orders in a batch (if supported)
   *
   * @param requests - Array of order requests
   * @returns Promise resolving to array of created orders
   * @throws {InvalidOrderError} If any order invalid
   */
  createBatchOrders(requests: OrderRequest[]): Promise<Order[]>;

  /**
   * Cancel multiple orders in a batch (if supported)
   *
   * @param orderIds - Array of order IDs to cancel
   * @param symbol - Optional symbol
   * @returns Promise resolving to array of canceled orders
   */
  cancelBatchOrders(orderIds: string[], symbol?: string): Promise<Order[]>;

  // ===========================================================================
  // Positions & Balance
  // ===========================================================================

  /**
   * Fetch all open positions
   *
   * @param symbols - Optional array of symbols to filter
   * @returns Promise resolving to array of positions
   * @throws {ExchangeUnavailableError} If API is unavailable
   */
  fetchPositions(symbols?: string[]): Promise<Position[]>;

  /**
   * Fetch account balance
   *
   * @returns Promise resolving to balance information
   * @throws {ExchangeUnavailableError} If API is unavailable
   */
  fetchBalance(): Promise<Balance[]>;

  /**
   * Set leverage for a symbol
   *
   * @param symbol - Symbol in unified format
   * @param leverage - Leverage value (e.g., 10 for 10x)
   * @returns Promise resolving when leverage is set
   * @throws {InvalidOrderError} If leverage value invalid
   */
  setLeverage(symbol: string, leverage: number): Promise<void>;

  /**
   * Set margin mode for a symbol
   *
   * @param symbol - Symbol in unified format
   * @param marginMode - 'cross' or 'isolated'
   * @returns Promise resolving when margin mode is set
   */
  setMarginMode(symbol: string, marginMode: 'cross' | 'isolated'): Promise<void>;

  // ===========================================================================
  // WebSocket Streams
  // ===========================================================================

  /**
   * Subscribe to real-time order book updates
   *
   * @param symbol - Symbol in unified format
   * @param limit - Optional depth limit
   * @returns Async generator yielding order book updates
   * @throws {WebSocketDisconnectedError} If connection fails
   *
   * @example
   * ```typescript
   * for await (const orderbook of exchange.watchOrderBook('BTC/USDT:USDT')) {
   *   console.log('Bid:', orderbook.bids[0]);
   *   console.log('Ask:', orderbook.asks[0]);
   * }
   * ```
   */
  watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;

  /**
   * Subscribe to real-time trade updates
   *
   * @param symbol - Symbol in unified format
   * @returns Async generator yielding trades
   */
  watchTrades(symbol: string): AsyncGenerator<Trade>;

  /**
   * Subscribe to real-time ticker updates
   *
   * @param symbol - Symbol in unified format
   * @returns Async generator yielding ticker updates
   */
  watchTicker(symbol: string): AsyncGenerator<Ticker>;

  /**
   * Subscribe to real-time position updates
   *
   * @returns Async generator yielding position arrays
   */
  watchPositions(): AsyncGenerator<Position[]>;

  /**
   * Subscribe to real-time order updates
   *
   * @returns Async generator yielding order arrays
   */
  watchOrders(): AsyncGenerator<Order[]>;

  /**
   * Subscribe to real-time balance updates
   *
   * @returns Async generator yielding balance arrays
   */
  watchBalance(): AsyncGenerator<Balance[]>;

  /**
   * Subscribe to real-time funding rate updates
   *
   * @param symbol - Symbol in unified format
   * @returns Async generator yielding funding rate updates
   */
  watchFundingRate(symbol: string): AsyncGenerator<FundingRate>;
}

/**
 * Authentication strategy interface
 */
export interface IAuthStrategy {
  /**
   * Sign a request with appropriate authentication
   *
   * @param request - Request parameters to sign
   * @returns Promise resolving to authenticated request
   */
  sign(request: RequestParams): Promise<AuthenticatedRequest>;

  /**
   * Get authentication headers
   *
   * @returns Headers object
   */
  getHeaders(): Record<string, string>;

  /**
   * Refresh authentication (for token-based auth)
   *
   * @returns Promise resolving when auth is refreshed
   */
  refresh?(): Promise<void>;
}

/**
 * Request parameters for authentication
 */
export interface RequestParams {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  timestamp?: number;
  nonce?: number;
}

/**
 * Authenticated request
 */
export interface AuthenticatedRequest extends RequestParams {
  headers?: Record<string, string>;
  signature?: string;
}

/**
 * Exchange configuration
 */
export interface ExchangeConfig {
  /** API endpoint URL */
  apiUrl?: string;

  /** WebSocket endpoint URL */
  wsUrl?: string;

  /** Use testnet */
  testnet?: boolean;

  /** Request timeout (ms) */
  timeout?: number;

  /** Enable debug logging */
  debug?: boolean;

  /** Custom rate limit settings */
  rateLimit?: RateLimitConfig;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;

  /** Time window (ms) */
  windowMs: number;

  /** Endpoint-specific weights */
  weights?: Record<string, number>;
}

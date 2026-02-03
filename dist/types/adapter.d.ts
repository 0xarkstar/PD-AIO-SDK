/**
 * Exchange Adapter Interface
 *
 * Defines the contract that all exchange adapters must implement
 */
import type { CircuitBreakerConfig } from '../core/CircuitBreaker.js';
import type { Balance, Currency, ExchangeStatus, FundingPayment, FundingRate, LedgerEntry, Market, MarketParams, OHLCV, OHLCVParams, OHLCVTimeframe, Order, OrderBook, OrderBookParams, OrderRequest, OrderSide, OrderType, Portfolio, Position, RateLimitStatus, Ticker, Trade, TradeParams, Transaction, UserFees } from './common.js';
/**
 * Feature capabilities map
 */
export interface FeatureMap {
    fetchMarkets: boolean;
    fetchTicker: boolean;
    fetchTickers: boolean;
    fetchOrderBook: boolean;
    fetchTrades: boolean;
    fetchOHLCV: boolean;
    fetchFundingRate: boolean;
    fetchFundingRateHistory: boolean;
    fetchCurrencies: boolean;
    fetchStatus: boolean;
    fetchTime: boolean;
    createOrder: boolean;
    cancelOrder: boolean;
    cancelAllOrders: boolean;
    createBatchOrders: boolean | 'emulated';
    cancelBatchOrders: boolean | 'emulated';
    editOrder: boolean;
    fetchOpenOrders: boolean;
    fetchClosedOrders: boolean;
    fetchOrder: boolean;
    fetchOrderHistory: boolean;
    fetchMyTrades: boolean;
    fetchDeposits: boolean;
    fetchWithdrawals: boolean;
    fetchLedger: boolean;
    fetchFundingHistory: boolean;
    fetchPositions: boolean;
    fetchBalance: boolean;
    setLeverage: boolean;
    setMarginMode: boolean | 'emulated';
    watchOrderBook: boolean;
    watchTrades: boolean;
    watchTicker: boolean;
    watchTickers: boolean;
    watchOHLCV: boolean;
    watchPositions: boolean;
    watchOrders: boolean;
    watchBalance: boolean;
    watchFundingRate: boolean;
    watchMyTrades: boolean;
    twapOrders: boolean;
    vaultTrading: boolean;
    fetchUserFees: boolean;
    fetchPortfolio: boolean;
    fetchRateLimitStatus: boolean;
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
    /**
     * Fetch OHLCV (candlestick) data for a symbol
     *
     * @param symbol - Symbol in unified format
     * @param timeframe - Candlestick timeframe (e.g., '1m', '1h', '1d')
     * @param params - Optional parameters (since, until, limit)
     * @returns Promise resolving to array of OHLCV tuples
     * @throws {ExchangeUnavailableError} If API is unavailable
     *
     * @example
     * ```typescript
     * const candles = await exchange.fetchOHLCV('BTC/USDT:USDT', '1h', { limit: 100 });
     * for (const [timestamp, open, high, low, close, volume] of candles) {
     *   console.log(`${new Date(timestamp).toISOString()}: O=${open} H=${high} L=${low} C=${close} V=${volume}`);
     * }
     * ```
     */
    fetchOHLCV(symbol: string, timeframe: OHLCVTimeframe, params?: OHLCVParams): Promise<OHLCV[]>;
    /**
     * Fetch 24h ticker statistics for multiple symbols
     *
     * @param symbols - Optional array of symbols (fetches all if not provided)
     * @returns Promise resolving to map of symbol to ticker
     * @throws {ExchangeUnavailableError} If API is unavailable
     *
     * @example
     * ```typescript
     * const tickers = await exchange.fetchTickers(['BTC/USDT:USDT', 'ETH/USDT:USDT']);
     * console.log(tickers['BTC/USDT:USDT'].last);
     * ```
     */
    fetchTickers(symbols?: string[]): Promise<Record<string, Ticker>>;
    /**
     * Fetch available currencies/assets
     *
     * @returns Promise resolving to map of currency code to currency info
     * @throws {ExchangeUnavailableError} If API is unavailable
     */
    fetchCurrencies(): Promise<Record<string, Currency>>;
    /**
     * Fetch exchange operational status
     *
     * @returns Promise resolving to exchange status
     * @throws {ExchangeUnavailableError} If API is unavailable
     */
    fetchStatus(): Promise<ExchangeStatus>;
    /**
     * Fetch exchange server time
     *
     * @returns Promise resolving to server timestamp (ms)
     * @throws {ExchangeUnavailableError} If API is unavailable
     */
    fetchTime(): Promise<number>;
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
    /**
     * Edit/modify an existing order
     *
     * @param orderId - Order ID to modify
     * @param symbol - Symbol in unified format
     * @param type - New order type
     * @param side - Order side
     * @param amount - New amount (optional)
     * @param price - New price (optional)
     * @param params - Additional parameters
     * @returns Promise resolving to modified order
     * @throws {OrderNotFoundError} If order not found
     * @throws {NotSupportedError} If exchange doesn't support order editing
     */
    editOrder(orderId: string, symbol: string, type: OrderType, side: OrderSide, amount?: number, price?: number, params?: Record<string, unknown>): Promise<Order>;
    /**
     * Fetch a single order by ID
     *
     * @param orderId - Order ID to fetch
     * @param symbol - Symbol (required by some exchanges)
     * @returns Promise resolving to order
     * @throws {OrderNotFoundError} If order not found
     */
    fetchOrder(orderId: string, symbol?: string): Promise<Order>;
    /**
     * Fetch all open/pending orders
     *
     * @param symbol - Optional symbol to filter (fetches all symbols if not provided)
     * @param since - Optional start timestamp (ms)
     * @param limit - Optional maximum number of orders
     * @returns Promise resolving to array of open orders
     * @throws {ExchangeUnavailableError} If API is unavailable
     */
    fetchOpenOrders(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    /**
     * Fetch closed (filled/canceled) orders
     *
     * @param symbol - Optional symbol to filter (fetches all symbols if not provided)
     * @param since - Optional start timestamp (ms)
     * @param limit - Optional maximum number of orders
     * @returns Promise resolving to array of closed orders
     * @throws {ExchangeUnavailableError} If API is unavailable
     */
    fetchClosedOrders(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    /**
     * Create a limit buy order
     *
     * @param symbol - Symbol in unified format
     * @param amount - Order amount
     * @param price - Limit price
     * @param params - Additional parameters
     * @returns Promise resolving to created order
     */
    createLimitBuyOrder(symbol: string, amount: number, price: number, params?: Record<string, unknown>): Promise<Order>;
    /**
     * Create a limit sell order
     *
     * @param symbol - Symbol in unified format
     * @param amount - Order amount
     * @param price - Limit price
     * @param params - Additional parameters
     * @returns Promise resolving to created order
     */
    createLimitSellOrder(symbol: string, amount: number, price: number, params?: Record<string, unknown>): Promise<Order>;
    /**
     * Create a market buy order
     *
     * @param symbol - Symbol in unified format
     * @param amount - Order amount
     * @param params - Additional parameters
     * @returns Promise resolving to created order
     */
    createMarketBuyOrder(symbol: string, amount: number, params?: Record<string, unknown>): Promise<Order>;
    /**
     * Create a market sell order
     *
     * @param symbol - Symbol in unified format
     * @param amount - Order amount
     * @param params - Additional parameters
     * @returns Promise resolving to created order
     */
    createMarketSellOrder(symbol: string, amount: number, params?: Record<string, unknown>): Promise<Order>;
    /**
     * Create a stop loss order
     *
     * @param symbol - Symbol in unified format
     * @param amount - Order amount
     * @param stopPrice - Stop/trigger price
     * @param params - Additional parameters
     * @returns Promise resolving to created order
     */
    createStopLossOrder(symbol: string, amount: number, stopPrice: number, params?: Record<string, unknown>): Promise<Order>;
    /**
     * Create a take profit order
     *
     * @param symbol - Symbol in unified format
     * @param amount - Order amount
     * @param takeProfitPrice - Take profit price
     * @param params - Additional parameters
     * @returns Promise resolving to created order
     */
    createTakeProfitOrder(symbol: string, amount: number, takeProfitPrice: number, params?: Record<string, unknown>): Promise<Order>;
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
    /**
     * Fetch order history
     *
     * @param symbol - Optional symbol to filter (fetches all symbols if not provided)
     * @param since - Optional start timestamp (ms)
     * @param limit - Optional maximum number of orders
     * @returns Promise resolving to array of historical orders
     * @throws {ExchangeUnavailableError} If API is unavailable
     *
     * @example
     * ```typescript
     * // Fetch all order history
     * const orders = await exchange.fetchOrderHistory();
     *
     * // Fetch BTC orders from last 24h
     * const btcOrders = await exchange.fetchOrderHistory(
     *   'BTC/USDT:USDT',
     *   Date.now() - 86400000
     * );
     * ```
     */
    fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    /**
     * Fetch trade history (user fills)
     *
     * @param symbol - Optional symbol to filter (fetches all symbols if not provided)
     * @param since - Optional start timestamp (ms)
     * @param limit - Optional maximum number of trades
     * @returns Promise resolving to array of trade fills
     * @throws {ExchangeUnavailableError} If API is unavailable
     *
     * @example
     * ```typescript
     * // Fetch all trade history
     * const trades = await exchange.fetchMyTrades();
     *
     * // Fetch recent ETH trades
     * const ethTrades = await exchange.fetchMyTrades('ETH/USDT:USDT', undefined, 100);
     * ```
     */
    fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]>;
    /**
     * Fetch deposit history
     *
     * @param currency - Optional currency to filter
     * @param since - Optional start timestamp (ms)
     * @param limit - Optional maximum number of records
     * @returns Promise resolving to array of deposits
     * @throws {ExchangeUnavailableError} If API is unavailable
     */
    fetchDeposits(currency?: string, since?: number, limit?: number): Promise<Transaction[]>;
    /**
     * Fetch withdrawal history
     *
     * @param currency - Optional currency to filter
     * @param since - Optional start timestamp (ms)
     * @param limit - Optional maximum number of records
     * @returns Promise resolving to array of withdrawals
     * @throws {ExchangeUnavailableError} If API is unavailable
     */
    fetchWithdrawals(currency?: string, since?: number, limit?: number): Promise<Transaction[]>;
    /**
     * Fetch account ledger (transaction history)
     *
     * @param currency - Optional currency to filter
     * @param since - Optional start timestamp (ms)
     * @param limit - Optional maximum number of entries
     * @param params - Additional parameters
     * @returns Promise resolving to array of ledger entries
     * @throws {ExchangeUnavailableError} If API is unavailable
     *
     * @example
     * ```typescript
     * const ledger = await exchange.fetchLedger('USDT', Date.now() - 86400000);
     * for (const entry of ledger) {
     *   console.log(`${entry.type}: ${entry.amount} ${entry.currency}`);
     * }
     * ```
     */
    fetchLedger(currency?: string, since?: number, limit?: number, params?: Record<string, unknown>): Promise<LedgerEntry[]>;
    /**
     * Fetch funding payment history
     *
     * @param symbol - Optional symbol to filter
     * @param since - Optional start timestamp (ms)
     * @param limit - Optional maximum number of payments
     * @returns Promise resolving to array of funding payments
     * @throws {ExchangeUnavailableError} If API is unavailable
     *
     * @example
     * ```typescript
     * const payments = await exchange.fetchFundingHistory('BTC/USDT:USDT');
     * for (const payment of payments) {
     *   console.log(`Funding: ${payment.amount} at rate ${payment.fundingRate}`);
     * }
     * ```
     */
    fetchFundingHistory(symbol?: string, since?: number, limit?: number): Promise<FundingPayment[]>;
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
     * Subscribe to real-time ticker updates for multiple symbols
     *
     * @param symbols - Optional array of symbols (subscribes to all if not provided)
     * @returns Async generator yielding ticker updates
     *
     * @example
     * ```typescript
     * for await (const ticker of exchange.watchTickers(['BTC/USDT:USDT', 'ETH/USDT:USDT'])) {
     *   console.log(`${ticker.symbol}: ${ticker.last}`);
     * }
     * ```
     */
    watchTickers(symbols?: string[]): AsyncGenerator<Ticker>;
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
    /**
     * Subscribe to real-time OHLCV (candlestick) updates
     *
     * @param symbol - Symbol in unified format
     * @param timeframe - Candlestick timeframe (e.g., '1m', '1h', '1d')
     * @returns Async generator yielding OHLCV tuples
     *
     * @example
     * ```typescript
     * for await (const candle of exchange.watchOHLCV('BTC/USDT:USDT', '1m')) {
     *   const [timestamp, open, high, low, close, volume] = candle;
     *   console.log(`Candle update: ${close}`);
     * }
     * ```
     */
    watchOHLCV(symbol: string, timeframe: OHLCVTimeframe): AsyncGenerator<OHLCV>;
    /**
     * Subscribe to real-time user trade (fill) updates
     *
     * @param symbol - Optional symbol to filter
     * @returns Async generator yielding trade fills
     *
     * @example
     * ```typescript
     * for await (const trade of exchange.watchMyTrades('BTC/USDT:USDT')) {
     *   console.log(`Fill: ${trade.amount} @ ${trade.price}`);
     * }
     * ```
     */
    watchMyTrades(symbol?: string): AsyncGenerator<Trade>;
    /**
     * Fetch user fee rates
     *
     * @returns Promise resolving to user fee information
     * @throws {ExchangeUnavailableError} If API is unavailable
     *
     * @example
     * ```typescript
     * const fees = await exchange.fetchUserFees();
     * console.log(`Maker: ${fees.maker * 100}%, Taker: ${fees.taker * 100}%`);
     * ```
     */
    fetchUserFees(): Promise<UserFees>;
    /**
     * Fetch portfolio performance metrics
     *
     * @returns Promise resolving to portfolio information
     * @throws {ExchangeUnavailableError} If API is unavailable
     *
     * @example
     * ```typescript
     * const portfolio = await exchange.fetchPortfolio();
     * console.log(`Daily PnL: ${portfolio.dailyPnl}`);
     * ```
     */
    fetchPortfolio(): Promise<Portfolio>;
    /**
     * Fetch current rate limit status
     *
     * @returns Promise resolving to rate limit information
     * @throws {ExchangeUnavailableError} If API is unavailable
     *
     * @example
     * ```typescript
     * const status = await exchange.fetchRateLimitStatus();
     * console.log(`${status.remaining}/${status.limit} requests remaining`);
     * ```
     */
    fetchRateLimitStatus(): Promise<RateLimitStatus>;
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
    /** Circuit breaker configuration */
    circuitBreaker?: CircuitBreakerConfig;
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
//# sourceMappingURL=adapter.d.ts.map
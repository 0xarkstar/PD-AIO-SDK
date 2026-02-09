/**
 * Base Adapter Core
 *
 * Abstract base class providing core functionality for all adapters.
 * Contains state management, abstract method declarations, and essential properties.
 */

import type {
  Balance,
  Currency,
  ExchangeConfig,
  ExchangeStatus,
  FeatureMap,
  FundingPayment,
  FundingRate,
  IAuthStrategy,
  LedgerEntry,
  Market,
  MarketParams,
  OHLCV,
  OHLCVParams,
  OHLCVTimeframe,
  Order,
  OrderBook,
  OrderBookParams,
  OrderRequest,
  Portfolio,
  Position,
  RateLimitStatus,
  Ticker,
  Trade,
  TradeParams,
  Transaction,
  UserFees,
} from '../../types/index.js';
import { NotSupportedError } from '../../types/errors.js';
import type { APIMetrics } from '../../types/metrics.js';
import { CircuitBreaker } from '../../core/CircuitBreaker.js';
import type { HTTPClient } from '../../core/http/HTTPClient.js';
import {
  PrometheusMetrics,
  isMetricsInitialized,
  getMetrics,
} from '../../monitoring/prometheus.js';
import type { RateLimiter } from '../../core/RateLimiter.js';

/**
 * Base Adapter Core
 *
 * Abstract class that forms the foundation for all exchange adapters.
 * Mixins are applied on top of this class to add specific capabilities.
 */
export abstract class BaseAdapterCore {
  // ===========================================================================
  // Abstract Properties - must be defined by subclasses
  // ===========================================================================

  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly has: Partial<FeatureMap>;

  // ===========================================================================
  // State Properties
  // ===========================================================================

  protected _isReady = false;
  protected _isDisconnected = false;
  protected readonly config: ExchangeConfig;
  protected authStrategy?: IAuthStrategy;
  protected rateLimiter?: RateLimiter;
  protected circuitBreaker: CircuitBreaker;
  protected httpClient?: HTTPClient;
  protected prometheusMetrics?: PrometheusMetrics;

  // ===========================================================================
  // Resource Tracking
  // ===========================================================================

  protected timers: Set<NodeJS.Timeout> = new Set();
  protected intervals: Set<NodeJS.Timeout> = new Set();
  protected abortControllers: Set<AbortController> = new Set();

  // ===========================================================================
  // Metrics (will be managed by MetricsTrackerMixin)
  // ===========================================================================

  protected metrics: APIMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    rateLimitHits: 0,
    averageLatency: 0,
    endpointStats: new Map(),
    startedAt: Date.now(),
  };

  // ===========================================================================
  // Constructor
  // ===========================================================================

  constructor(config: ExchangeConfig = {}) {
    this.config = {
      timeout: 30000,
      testnet: false,
      debug: false,
      ...config,
    };

    // Initialize Prometheus metrics if available
    if (isMetricsInitialized()) {
      this.prometheusMetrics = getMetrics();
    }

    // Initialize circuit breaker with config or defaults
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);

    // Circuit breaker event handlers will be set up in the composed class
    // to have access to logging methods from LoggerMixin
  }

  // ===========================================================================
  // Getters
  // ===========================================================================

  get isReady(): boolean {
    return this._isReady;
  }

  /**
   * Check if adapter has been disconnected
   */
  isDisconnected(): boolean {
    return this._isDisconnected;
  }

  // ===========================================================================
  // Abstract Methods - Connection Management
  // ===========================================================================

  abstract initialize(): Promise<void>;

  // ===========================================================================
  // Abstract Methods - Market Data (Public)
  // ===========================================================================

  abstract fetchMarkets(params?: MarketParams): Promise<Market[]>;
  abstract fetchTicker(symbol: string): Promise<Ticker>;
  abstract fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
  abstract fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
  abstract fetchFundingRate(symbol: string): Promise<FundingRate>;
  abstract fetchFundingRateHistory(
    symbol: string,
    since?: number,
    limit?: number
  ): Promise<FundingRate[]>;

  // ===========================================================================
  // Abstract Methods - Trading (Private)
  // ===========================================================================

  abstract createOrder(request: OrderRequest): Promise<Order>;
  abstract cancelOrder(_orderId: string, _symbol?: string): Promise<Order>;
  abstract cancelAllOrders(_symbol?: string): Promise<Order[]>;

  // ===========================================================================
  // Abstract Methods - Account History
  // ===========================================================================

  abstract fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
  abstract fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<Trade[]>;

  // ===========================================================================
  // Abstract Methods - Positions & Balance
  // ===========================================================================

  abstract fetchPositions(symbols?: string[]): Promise<Position[]>;
  abstract fetchBalance(): Promise<Balance[]>;
  abstract setLeverage(symbol: string, leverage: number): Promise<void>;

  // ===========================================================================
  // Abstract Methods - Symbol Conversion
  // ===========================================================================

  protected abstract symbolToExchange(symbol: string): string;
  protected abstract symbolFromExchange(exchangeSymbol: string): string;

  // ===========================================================================
  // Optional Methods with Default Implementation
  // ===========================================================================

  /**
   * Fetch OHLCV (candlestick) data
   * Default implementation throws if not supported by exchange
   */
  async fetchOHLCV(
    _symbol: string,
    _timeframe: OHLCVTimeframe,
    _params?: OHLCVParams
  ): Promise<OHLCV[]> {
    if (!this.has.fetchOHLCV) {
      throw new NotSupportedError(
        `${this.name} does not support OHLCV data`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('fetchOHLCV must be implemented by subclass');
  }

  /**
   * Fetch multiple tickers at once
   * Default implementation fetches tickers sequentially
   */
  async fetchTickers(symbols?: string[]): Promise<Record<string, Ticker>> {
    if (!this.has.fetchTickers) {
      // Fallback: fetch tickers one by one
      const result: Record<string, Ticker> = {};
      const symbolsToFetch = symbols ?? (await this.fetchMarkets()).map((m) => m.symbol);

      for (const symbol of symbolsToFetch) {
        try {
          result[symbol] = await this.fetchTicker(symbol);
        } catch {
          // Skip failed tickers
        }
      }
      return result;
    }
    throw new Error('fetchTickers must be implemented by subclass');
  }

  /**
   * Fetch available currencies
   * Default implementation throws if not supported
   */
  async fetchCurrencies(): Promise<Record<string, Currency>> {
    if (!this.has.fetchCurrencies) {
      throw new NotSupportedError(
        `${this.name} does not support fetching currencies`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('fetchCurrencies must be implemented by subclass');
  }

  /**
   * Fetch exchange status
   * Default implementation returns 'ok' if fetchMarkets succeeds
   */
  async fetchStatus(): Promise<ExchangeStatus> {
    if (!this.has.fetchStatus) {
      // Default: check if API is responsive
      try {
        await this.fetchMarkets();
        return {
          status: 'ok',
          updated: Date.now(),
        };
      } catch (error) {
        return {
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
          updated: Date.now(),
        };
      }
    }
    throw new Error('fetchStatus must be implemented by subclass');
  }

  /**
   * Fetch exchange server time
   * Default implementation throws if not supported
   */
  async fetchTime(): Promise<number> {
    if (!this.has.fetchTime) {
      throw new NotSupportedError(
        `${this.name} does not support fetching server time`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('fetchTime must be implemented by subclass');
  }

  /**
   * Fetch deposit history
   * Default implementation throws if not supported by exchange
   */
  async fetchDeposits(
    _currency?: string,
    _since?: number,
    _limit?: number
  ): Promise<Transaction[]> {
    if (!this.has.fetchDeposits) {
      throw new NotSupportedError(
        `${this.name} does not support fetching deposit history`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('fetchDeposits must be implemented by subclass');
  }

  /**
   * Fetch withdrawal history
   * Default implementation throws if not supported by exchange
   */
  async fetchWithdrawals(
    _currency?: string,
    _since?: number,
    _limit?: number
  ): Promise<Transaction[]> {
    if (!this.has.fetchWithdrawals) {
      throw new NotSupportedError(
        `${this.name} does not support fetching withdrawal history`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('fetchWithdrawals must be implemented by subclass');
  }

  /**
   * Fetch account ledger (transaction history)
   * Default implementation throws if not supported by exchange
   */
  async fetchLedger(
    _currency?: string,
    _since?: number,
    _limit?: number,
    _params?: Record<string, unknown>
  ): Promise<LedgerEntry[]> {
    if (!this.has.fetchLedger) {
      throw new NotSupportedError(
        `${this.name} does not support fetching ledger`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('fetchLedger must be implemented by subclass');
  }

  /**
   * Fetch funding payment history
   * Default implementation throws if not supported by exchange
   */
  async fetchFundingHistory(
    _symbol?: string,
    _since?: number,
    _limit?: number
  ): Promise<FundingPayment[]> {
    if (!this.has.fetchFundingHistory) {
      throw new NotSupportedError(
        `${this.name} does not support fetching funding history`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('fetchFundingHistory must be implemented by subclass');
  }

  /**
   * Set margin mode
   * Default implementation throws if not supported
   */
  async setMarginMode(_symbol: string, _marginMode: 'cross' | 'isolated'): Promise<void> {
    if (!this.has.setMarginMode || this.has.setMarginMode === 'emulated') {
      throw new NotSupportedError(
        `${this.name} does not support setting margin mode directly`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('setMarginMode must be implemented by subclass');
  }

  // ===========================================================================
  // WebSocket Streams - default implementation throws if not supported
  // ===========================================================================

  async *watchOrderBook(_symbol: string, _limit?: number): AsyncGenerator<OrderBook> {
    if (!this.has.watchOrderBook) {
      throw new NotSupportedError(
        `${this.name} does not support order book streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('watchOrderBook must be implemented by subclass');
    yield {} as OrderBook; // Type system requirement
  }

  async *watchTrades(_symbol: string): AsyncGenerator<Trade> {
    if (!this.has.watchTrades) {
      throw new NotSupportedError(
        `${this.name} does not support trade streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('watchTrades must be implemented by subclass');
    yield {} as Trade; // Type system requirement
  }

  async *watchTicker(_symbol: string): AsyncGenerator<Ticker> {
    if (!this.has.watchTicker) {
      throw new NotSupportedError(
        `${this.name} does not support ticker streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('watchTicker must be implemented by subclass');
    yield {} as Ticker; // Type system requirement
  }

  async *watchTickers(_symbols?: string[]): AsyncGenerator<Ticker> {
    if (!this.has.watchTickers) {
      throw new NotSupportedError(
        `${this.name} does not support multiple ticker streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('watchTickers must be implemented by subclass');
    yield {} as Ticker; // Type system requirement
  }

  async *watchPositions(): AsyncGenerator<Position[]> {
    if (!this.has.watchPositions) {
      throw new NotSupportedError(
        `${this.name} does not support position streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('watchPositions must be implemented by subclass');
    yield [] as Position[]; // Type system requirement
  }

  async *watchOrders(): AsyncGenerator<Order[]> {
    if (!this.has.watchOrders) {
      throw new NotSupportedError(
        `${this.name} does not support order streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('watchOrders must be implemented by subclass');
    yield [] as Order[]; // Type system requirement
  }

  async *watchBalance(): AsyncGenerator<Balance[]> {
    if (!this.has.watchBalance) {
      throw new NotSupportedError(
        `${this.name} does not support balance streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('watchBalance must be implemented by subclass');
    yield [] as Balance[]; // Type system requirement
  }

  async *watchFundingRate(_symbol: string): AsyncGenerator<FundingRate> {
    if (!this.has.watchFundingRate) {
      throw new NotSupportedError(
        `${this.name} does not support funding rate streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('watchFundingRate must be implemented by subclass');
    yield {} as FundingRate; // Type system requirement
  }

  async *watchOHLCV(_symbol: string, _timeframe: OHLCVTimeframe): AsyncGenerator<OHLCV> {
    if (!this.has.watchOHLCV) {
      throw new NotSupportedError(
        `${this.name} does not support OHLCV streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('watchOHLCV must be implemented by subclass');
    yield [0, 0, 0, 0, 0, 0] as OHLCV; // Type system requirement
  }

  async *watchMyTrades(_symbol?: string): AsyncGenerator<Trade> {
    if (!this.has.watchMyTrades) {
      throw new NotSupportedError(
        `${this.name} does not support user trade streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('watchMyTrades must be implemented by subclass');
    yield {} as Trade; // Type system requirement
  }

  // ===========================================================================
  // Additional Info Methods
  // ===========================================================================

  /**
   * Fetch user fee rates
   * Default implementation throws if not supported by exchange
   */
  async fetchUserFees(): Promise<UserFees> {
    if (!this.has.fetchUserFees) {
      throw new NotSupportedError(
        `${this.name} does not support fetching user fees`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('fetchUserFees must be implemented by subclass');
  }

  /**
   * Fetch portfolio performance metrics
   * Default implementation throws if not supported by exchange
   */
  async fetchPortfolio(): Promise<Portfolio> {
    if (!this.has.fetchPortfolio) {
      throw new NotSupportedError(
        `${this.name} does not support fetching portfolio metrics`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('fetchPortfolio must be implemented by subclass');
  }

  /**
   * Fetch current rate limit status
   * Default implementation throws if not supported by exchange
   */
  async fetchRateLimitStatus(): Promise<RateLimitStatus> {
    if (!this.has.fetchRateLimitStatus) {
      throw new NotSupportedError(
        `${this.name} does not support fetching rate limit status`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new Error('fetchRateLimitStatus must be implemented by subclass');
  }
}

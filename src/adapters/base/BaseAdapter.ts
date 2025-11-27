/**
 * Base Exchange Adapter
 *
 * Abstract base class providing common functionality for all adapters
 */

import type {
  Balance,
  ExchangeConfig,
  FeatureMap,
  FundingRate,
  IAuthStrategy,
  IExchangeAdapter,
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

export abstract class BaseAdapter implements IExchangeAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly has: Partial<FeatureMap>;

  protected _isReady = false;
  protected readonly config: ExchangeConfig;
  protected authStrategy?: IAuthStrategy;

  constructor(config: ExchangeConfig = {}) {
    this.config = {
      timeout: 30000,
      testnet: false,
      debug: false,
      ...config,
    };
  }

  get isReady(): boolean {
    return this._isReady;
  }

  // ===========================================================================
  // Connection Management (must be implemented by subclasses)
  // ===========================================================================

  abstract initialize(): Promise<void>;
  abstract disconnect(): Promise<void>;

  // ===========================================================================
  // Market Data (Public) - must be implemented by subclasses
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
  // Trading (Private) - must be implemented by subclasses
  // ===========================================================================

  abstract createOrder(request: OrderRequest): Promise<Order>;
  abstract cancelOrder(orderId: string, symbol?: string): Promise<Order>;
  abstract cancelAllOrders(symbol?: string): Promise<Order[]>;

  // ===========================================================================
  // Batch Operations - default implementation throws if not supported
  // ===========================================================================

  async createBatchOrders(requests: OrderRequest[]): Promise<Order[]> {
    if (!this.has.createBatchOrders) {
      throw new Error(`${this.name} does not support batch order creation`);
    }
    throw new Error('createBatchOrders must be implemented by subclass');
  }

  async cancelBatchOrders(orderIds: string[], symbol?: string): Promise<Order[]> {
    if (!this.has.cancelBatchOrders) {
      throw new Error(`${this.name} does not support batch order cancellation`);
    }
    throw new Error('cancelBatchOrders must be implemented by subclass');
  }

  // ===========================================================================
  // Positions & Balance - must be implemented by subclasses
  // ===========================================================================

  abstract fetchPositions(symbols?: string[]): Promise<Position[]>;
  abstract fetchBalance(): Promise<Balance[]>;
  abstract setLeverage(symbol: string, leverage: number): Promise<void>;

  async setMarginMode(symbol: string, marginMode: 'cross' | 'isolated'): Promise<void> {
    if (!this.has.setMarginMode || this.has.setMarginMode === 'emulated') {
      throw new Error(`${this.name} does not support setting margin mode directly`);
    }
    throw new Error('setMarginMode must be implemented by subclass');
  }

  // ===========================================================================
  // WebSocket Streams - default implementation throws if not supported
  // ===========================================================================

  async *watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook> {
    if (!this.has.watchOrderBook) {
      throw new Error(`${this.name} does not support order book streaming`);
    }
    throw new Error('watchOrderBook must be implemented by subclass');
    yield {} as OrderBook; // Type system requirement
  }

  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    if (!this.has.watchTrades) {
      throw new Error(`${this.name} does not support trade streaming`);
    }
    throw new Error('watchTrades must be implemented by subclass');
    yield {} as Trade; // Type system requirement
  }

  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    if (!this.has.watchTicker) {
      throw new Error(`${this.name} does not support ticker streaming`);
    }
    throw new Error('watchTicker must be implemented by subclass');
    yield {} as Ticker; // Type system requirement
  }

  async *watchPositions(): AsyncGenerator<Position[]> {
    if (!this.has.watchPositions) {
      throw new Error(`${this.name} does not support position streaming`);
    }
    throw new Error('watchPositions must be implemented by subclass');
    yield [] as Position[]; // Type system requirement
  }

  async *watchOrders(): AsyncGenerator<Order[]> {
    if (!this.has.watchOrders) {
      throw new Error(`${this.name} does not support order streaming`);
    }
    throw new Error('watchOrders must be implemented by subclass');
    yield [] as Order[]; // Type system requirement
  }

  async *watchBalance(): AsyncGenerator<Balance[]> {
    if (!this.has.watchBalance) {
      throw new Error(`${this.name} does not support balance streaming`);
    }
    throw new Error('watchBalance must be implemented by subclass');
    yield [] as Balance[]; // Type system requirement
  }

  async *watchFundingRate(symbol: string): AsyncGenerator<FundingRate> {
    if (!this.has.watchFundingRate) {
      throw new Error(`${this.name} does not support funding rate streaming`);
    }
    throw new Error('watchFundingRate must be implemented by subclass');
    yield {} as FundingRate; // Type system requirement
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  /**
   * Check if a feature is supported
   */
  protected supportsFeature(feature: keyof FeatureMap): boolean {
    return this.has[feature] === true;
  }

  /**
   * Ensure adapter is initialized
   */
  protected ensureInitialized(): void {
    if (!this._isReady) {
      throw new Error(`${this.name} adapter not initialized. Call initialize() first.`);
    }
  }

  /**
   * Convert unified symbol to exchange-specific format
   * Must be implemented by subclass
   */
  protected abstract symbolToExchange(symbol: string): string;

  /**
   * Convert exchange-specific symbol to unified format
   * Must be implemented by subclass
   */
  protected abstract symbolFromExchange(exchangeSymbol: string): string;

  /**
   * Make HTTP request with timeout
   */
  protected async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Log debug message
   */
  protected debug(message: string, ...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`[${this.name}]`, message, ...args);
    }
  }
}

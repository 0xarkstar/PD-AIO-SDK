/**
 * Base Exchange Adapter
 *
 * Abstract base class providing API surface methods for all adapters.
 * Extends BaseAdapterCore to inherit infrastructure functionality.
 */

import type {
  Balance,
  Currency,
  ExchangeStatus,
  FundingPayment,
  FundingRate,
  LedgerEntry,
  Market,
  OHLCV,
  OHLCVParams,
  OHLCVTimeframe,
  Order,
  OrderBook,
  OrderRequest,
  OrderSide,
  OrderType,
  Portfolio,
  Position,
  RateLimitStatus,
  Ticker,
  Trade,
  Transaction,
  UserFees,
} from '../../types/index.js';
import { NotSupportedError, PerpDEXError } from '../../types/errors.js';
import { BaseAdapterCore } from './BaseAdapterCore.js';

export abstract class BaseAdapter extends BaseAdapterCore {
  // ===========================================================================
  // Abstract Methods - Market Data (Public)
  // ===========================================================================

  abstract fetchMarkets(params?: any): Promise<any>;
  abstract fetchTicker(symbol: string): Promise<any>;
  abstract fetchOrderBook(symbol: string, params?: any): Promise<any>;
  abstract fetchTrades(symbol: string, params?: any): Promise<any>;
  abstract fetchFundingRate(symbol: string): Promise<any>;
  abstract fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<any>;

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
  abstract fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<any>;

  // ===========================================================================
  // Abstract Methods - Positions & Balance
  // ===========================================================================

  abstract fetchPositions(symbols?: string[]): Promise<Position[]>;
  abstract fetchBalance(): Promise<Balance[]>;
  abstract setLeverage(symbol: string, leverage: number): Promise<void>;

  // ===========================================================================
  // Market Data (Public) - Optional implementations
  // ===========================================================================

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
    throw new NotSupportedError(
      'fetchOHLCV must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
  }

  async fetchTickers(symbols?: string[]): Promise<Record<string, Ticker>> {
    if (!this.has.fetchTickers) {
      const result: Record<string, Ticker> = {};
      const symbolsToFetch = symbols ?? (await this.fetchMarkets()).map((m: Market) => m.symbol);

      for (const symbol of symbolsToFetch) {
        try {
          result[symbol] = await this.fetchTicker(symbol);
        } catch (error) {
          this.debug(`Failed to fetch ticker for ${symbol}`, { error });
        }
      }
      return result;
    }
    throw new NotSupportedError(
      'fetchTickers must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
  }

  async fetchCurrencies(): Promise<Record<string, Currency>> {
    if (!this.has.fetchCurrencies) {
      throw new NotSupportedError(
        `${this.name} does not support fetching currencies`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'fetchCurrencies must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
  }

  async fetchStatus(): Promise<ExchangeStatus> {
    if (!this.has.fetchStatus) {
      try {
        await this.fetchMarkets();
        return { status: 'ok', updated: Date.now() };
      } catch (error) {
        return {
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
          updated: Date.now(),
        };
      }
    }
    throw new NotSupportedError(
      'fetchStatus must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
  }

  async fetchTime(): Promise<number> {
    if (!this.has.fetchTime) {
      throw new NotSupportedError(
        `${this.name} does not support fetching server time`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'fetchTime must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
  }

  // ===========================================================================
  // Trading & Account History (implemented by concrete adapters)
  // ===========================================================================

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
    throw new NotSupportedError(
      'fetchDeposits must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
  }

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
    throw new NotSupportedError(
      'fetchWithdrawals must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
  }

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
    throw new NotSupportedError(
      'fetchLedger must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
  }

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
    throw new NotSupportedError(
      'fetchFundingHistory must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
  }

  // ===========================================================================
  // Batch Operations (from OrderHelpersMixin)
  // ===========================================================================

  async createBatchOrders(requests: OrderRequest[]): Promise<Order[]> {
    if (this.has.createBatchOrders === true) {
      throw new NotSupportedError(
        'createBatchOrders must be implemented by subclass when has.createBatchOrders is true',
        'NOT_IMPLEMENTED',
        this.id
      );
    }

    this.debug('No native batch support, creating orders sequentially', { count: requests.length });

    const orders: Order[] = [];
    const errors: Array<{ index: number; error: Error }> = [];

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      if (!request) continue;

      try {
        const order = await this.createOrder(request);
        orders.push(order);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push({ index: i, error: err });
        this.debug('Failed to create order', {
          index: i + 1,
          total: requests.length,
          error: err.message,
        });
      }
    }

    if (orders.length === 0 && errors.length > 0) {
      const firstError = errors[0];
      if (firstError) {
        throw new PerpDEXError(
          `All batch order creations failed. First error: ${firstError.error.message}`,
          'BATCH_FAILED',
          this.id,
          firstError.error
        );
      }
    }

    if (errors.length > 0) {
      this.debug('Batch order creation completed', {
        succeeded: orders.length,
        failed: errors.length,
      });
    }

    return orders;
  }

  async cancelBatchOrders(orderIds: string[], symbol?: string): Promise<Order[]> {
    if (this.has.cancelBatchOrders === true) {
      throw new NotSupportedError(
        'cancelBatchOrders must be implemented by subclass when has.cancelBatchOrders is true',
        'NOT_IMPLEMENTED',
        this.id
      );
    }

    this.debug('No native batch support, canceling orders sequentially', {
      count: orderIds.length,
    });

    const orders: Order[] = [];
    const errors: Array<{ index: number; orderId: string; error: Error }> = [];

    for (let i = 0; i < orderIds.length; i++) {
      const orderId = orderIds[i];
      if (!orderId) continue;

      try {
        const order = await this.cancelOrder(orderId, symbol);
        orders.push(order);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push({ index: i, orderId, error: err });
        this.debug('Failed to cancel order', { orderId, error: err.message });
      }
    }

    if (orders.length === 0 && errors.length > 0) {
      const firstError = errors[0];
      if (firstError) {
        throw new PerpDEXError(
          `All batch order cancellations failed. First error: ${firstError.error.message}`,
          'BATCH_FAILED',
          this.id,
          firstError.error
        );
      }
    }

    if (errors.length > 0) {
      this.debug('Batch order cancellation completed', {
        succeeded: orders.length,
        failed: errors.length,
      });
    }

    return orders;
  }

  async editOrder(
    _orderId: string,
    _symbol: string,
    _type: OrderType,
    _side: OrderSide,
    _amount?: number,
    _price?: number,
    _params?: Record<string, unknown>
  ): Promise<Order> {
    if (!this.has.editOrder) {
      throw new NotSupportedError(
        `${this.name} does not support editing orders`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'editOrder must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
  }

  // ===========================================================================
  // Order Query
  // ===========================================================================

  async fetchOrder(_orderId: string, _symbol?: string): Promise<Order> {
    if (!this.has.fetchOrder) {
      throw new NotSupportedError(
        `${this.name} does not support fetching single orders`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'fetchOrder must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
  }

  async fetchOpenOrders(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]> {
    if (!this.has.fetchOpenOrders) {
      throw new NotSupportedError(
        `${this.name} does not support fetching open orders`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'fetchOpenOrders must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
  }

  async fetchClosedOrders(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]> {
    if (!this.has.fetchClosedOrders) {
      throw new NotSupportedError(
        `${this.name} does not support fetching closed orders`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'fetchClosedOrders must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
  }

  // ===========================================================================
  // Convenience Order Methods (CCXT-compatible)
  // ===========================================================================

  async createLimitBuyOrder(
    symbol: string,
    amount: number,
    price: number,
    params?: Record<string, unknown>
  ): Promise<Order> {
    return this.createOrder({ symbol, type: 'limit', side: 'buy', amount, price, ...params });
  }

  async createLimitSellOrder(
    symbol: string,
    amount: number,
    price: number,
    params?: Record<string, unknown>
  ): Promise<Order> {
    return this.createOrder({ symbol, type: 'limit', side: 'sell', amount, price, ...params });
  }

  async createMarketBuyOrder(
    symbol: string,
    amount: number,
    params?: Record<string, unknown>
  ): Promise<Order> {
    return this.createOrder({ symbol, type: 'market', side: 'buy', amount, ...params });
  }

  async createMarketSellOrder(
    symbol: string,
    amount: number,
    params?: Record<string, unknown>
  ): Promise<Order> {
    return this.createOrder({ symbol, type: 'market', side: 'sell', amount, ...params });
  }

  async createStopLossOrder(
    symbol: string,
    amount: number,
    stopPrice: number,
    params?: Record<string, unknown>
  ): Promise<Order> {
    return this.createOrder({
      symbol,
      type: 'stopMarket',
      side: 'sell',
      amount,
      stopPrice,
      reduceOnly: true,
      ...params,
    });
  }

  async createTakeProfitOrder(
    symbol: string,
    amount: number,
    takeProfitPrice: number,
    params?: Record<string, unknown>
  ): Promise<Order> {
    return this.createOrder({
      symbol,
      type: 'limit',
      side: 'sell',
      amount,
      price: takeProfitPrice,
      reduceOnly: true,
      ...params,
    });
  }

  // ===========================================================================
  // Positions & Balance
  // ===========================================================================

  async setMarginMode(_symbol: string, _marginMode: 'cross' | 'isolated'): Promise<void> {
    if (!this.has.setMarginMode || this.has.setMarginMode === 'emulated') {
      throw new NotSupportedError(
        `${this.name} does not support setting margin mode directly`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'setMarginMode must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
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
    throw new NotSupportedError(
      'watchOrderBook must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
    yield {} as OrderBook;
  }

  async *watchTrades(_symbol: string): AsyncGenerator<Trade> {
    if (!this.has.watchTrades) {
      throw new NotSupportedError(
        `${this.name} does not support trade streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'watchTrades must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
    yield {} as Trade;
  }

  async *watchTicker(_symbol: string): AsyncGenerator<Ticker> {
    if (!this.has.watchTicker) {
      throw new NotSupportedError(
        `${this.name} does not support ticker streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'watchTicker must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
    yield {} as Ticker;
  }

  async *watchTickers(_symbols?: string[]): AsyncGenerator<Ticker> {
    if (!this.has.watchTickers) {
      throw new NotSupportedError(
        `${this.name} does not support multiple ticker streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'watchTickers must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
    yield {} as Ticker;
  }

  async *watchPositions(): AsyncGenerator<Position[]> {
    if (!this.has.watchPositions) {
      throw new NotSupportedError(
        `${this.name} does not support position streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'watchPositions must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
    yield [] as Position[];
  }

  async *watchOrders(): AsyncGenerator<Order[]> {
    if (!this.has.watchOrders) {
      throw new NotSupportedError(
        `${this.name} does not support order streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'watchOrders must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
    yield [] as Order[];
  }

  async *watchBalance(): AsyncGenerator<Balance[]> {
    if (!this.has.watchBalance) {
      throw new NotSupportedError(
        `${this.name} does not support balance streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'watchBalance must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
    yield [] as Balance[];
  }

  async *watchFundingRate(_symbol: string): AsyncGenerator<FundingRate> {
    if (!this.has.watchFundingRate) {
      throw new NotSupportedError(
        `${this.name} does not support funding rate streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'watchFundingRate must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
    yield {} as FundingRate;
  }

  async *watchOHLCV(_symbol: string, _timeframe: OHLCVTimeframe): AsyncGenerator<OHLCV> {
    if (!this.has.watchOHLCV) {
      throw new NotSupportedError(
        `${this.name} does not support OHLCV streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'watchOHLCV must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
    yield [0, 0, 0, 0, 0, 0] as OHLCV;
  }

  async *watchMyTrades(_symbol?: string): AsyncGenerator<Trade> {
    if (!this.has.watchMyTrades) {
      throw new NotSupportedError(
        `${this.name} does not support user trade streaming`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'watchMyTrades must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
    yield {} as Trade;
  }

  // ===========================================================================
  // Additional Info Methods
  // ===========================================================================

  async fetchUserFees(): Promise<UserFees> {
    if (!this.has.fetchUserFees) {
      throw new NotSupportedError(
        `${this.name} does not support fetching user fees`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'fetchUserFees must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
  }

  async fetchPortfolio(): Promise<Portfolio> {
    if (!this.has.fetchPortfolio) {
      throw new NotSupportedError(
        `${this.name} does not support fetching portfolio metrics`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'fetchPortfolio must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
  }

  async fetchRateLimitStatus(): Promise<RateLimitStatus> {
    if (!this.has.fetchRateLimitStatus) {
      throw new NotSupportedError(
        `${this.name} does not support fetching rate limit status`,
        'NOT_SUPPORTED',
        this.id
      );
    }
    throw new NotSupportedError(
      'fetchRateLimitStatus must be implemented by subclass',
      'NOT_IMPLEMENTED',
      this.id
    );
  }

  // ===========================================================================
  // Python-style Method Aliases
  // ===========================================================================

  fetch_markets = this.fetchMarkets.bind(this);
  fetch_ticker = this.fetchTicker.bind(this);
  fetch_order_book = this.fetchOrderBook.bind(this);
  fetch_trades = this.fetchTrades.bind(this);
  fetch_funding_rate = this.fetchFundingRate.bind(this);
  fetch_funding_rate_history = this.fetchFundingRateHistory.bind(this);
  fetch_ohlcv = this.fetchOHLCV.bind(this);
  create_order = this.createOrder.bind(this);
  cancel_order = this.cancelOrder.bind(this);
  cancel_all_orders = this.cancelAllOrders.bind(this);
  create_batch_orders = this.createBatchOrders.bind(this);
  cancel_batch_orders = this.cancelBatchOrders.bind(this);
  fetch_positions = this.fetchPositions.bind(this);
  fetch_balance = this.fetchBalance.bind(this);
  set_leverage = this.setLeverage.bind(this);
  set_margin_mode = this.setMarginMode.bind(this);
  fetch_open_orders = this.fetchOpenOrders.bind(this);
  health_check = this.healthCheck.bind(this);
  get_metrics = this.getMetrics.bind(this);
  reset_metrics = this.resetMetrics.bind(this);
  preload_markets = this.preloadMarkets.bind(this);
  get_preloaded_markets = this.getPreloadedMarkets.bind(this);
  clear_cache = this.clearCache.bind(this);
  fetch_deposits = this.fetchDeposits.bind(this);
  fetch_withdrawals = this.fetchWithdrawals.bind(this);

  get fetch_order_history() {
    return this.fetchOrderHistory.bind(this);
  }

  get fetch_my_trades() {
    return this.fetchMyTrades.bind(this);
  }
}

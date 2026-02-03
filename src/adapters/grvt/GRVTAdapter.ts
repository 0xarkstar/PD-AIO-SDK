/**
 * GRVT Exchange Adapter - Refactored with SDK Integration
 *
 * High-performance hybrid DEX with sub-millisecond latency
 *
 * Features:
 * - Official @grvt/client SDK integration
 * - REST API for trading and market data
 * - WebSocket for real-time updates
 * - API key + session cookie authentication
 * - EIP-712 signatures for orders
 * - Up to 100x leverage
 */

import { BaseAdapter } from '../base/BaseAdapter.js';
import type {
  Market,
  OHLCV,
  OHLCVParams,
  OHLCVTimeframe,
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
import { RateLimiter } from '../../core/RateLimiter.js';
import { InvalidSignatureError, PerpDEXError } from '../../types/errors.js';

// New components
import { GRVTSDKWrapper } from './GRVTSDKWrapper.js';
import { GRVTAuth, type GRVTAuthConfig } from './GRVTAuth.js';
import { GRVTNormalizer } from './GRVTNormalizer.js';
import { mapAxiosError, mapGRVTError } from './GRVTErrorMapper.js';
import { GRVTWebSocketWrapper } from './GRVTWebSocketWrapper.js';

import {
  GRVT_API_URLS,
  GRVT_RATE_LIMITS,
  GRVT_ENDPOINT_WEIGHTS,
} from './constants.js';

/**
 * GRVT adapter configuration
 */
export interface GRVTAdapterConfig extends GRVTAuthConfig {
  testnet?: boolean;
  timeout?: number;
  debug?: boolean;
}

/**
 * GRVT Exchange Adapter
 */
export class GRVTAdapter extends BaseAdapter {
  readonly id = 'grvt';
  readonly name = 'GRVT';

  readonly has: Partial<FeatureMap> = {
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchOHLCV: true,
    fetchFundingRate: true,
    fetchFundingRateHistory: false, // GRVT doesn't provide historical funding rates
    fetchPositions: true,
    fetchBalance: true,
    fetchOrderHistory: true, // NOW IMPLEMENTED via SDK
    fetchMyTrades: true, // NOW IMPLEMENTED via SDK
    createOrder: true,
    createBatchOrders: true,
    cancelOrder: true,
    cancelAllOrders: true,
    watchOrderBook: true,
    watchTrades: true,
    watchTicker: true,
    watchPositions: true,
    watchOrders: true,
    watchBalance: true,
    watchMyTrades: true,
  };

  private readonly sdk: GRVTSDKWrapper;
  private readonly auth: GRVTAuth;
  private readonly normalizer: GRVTNormalizer;
  private ws?: GRVTWebSocketWrapper;
  protected readonly rateLimiter: RateLimiter;
  private readonly testnet: boolean;

  constructor(config: GRVTAdapterConfig = {}) {
    super(config);

    this.testnet = config.testnet ?? false;
    const urls = this.testnet ? GRVT_API_URLS.testnet : GRVT_API_URLS.mainnet;

    // Initialize components
    this.auth = new GRVTAuth(config);
    this.normalizer = new GRVTNormalizer();
    this.sdk = new GRVTSDKWrapper({
      host: urls.rest,
      apiKey: config.apiKey,
      timeout: config.timeout,
    });

    this.rateLimiter = new RateLimiter({
      maxTokens: GRVT_RATE_LIMITS.rest.maxRequests,
      refillRate: GRVT_RATE_LIMITS.rest.maxRequests / (GRVT_RATE_LIMITS.rest.windowMs / 1000),
      windowMs: GRVT_RATE_LIMITS.rest.windowMs,
      weights: GRVT_ENDPOINT_WEIGHTS,
    });
  }

  async initialize(): Promise<void> {
    // Verify credentials only if provided
    // Public API methods work without authentication
    if (this.auth.hasCredentials()) {
      const isValid = await this.auth.verify();
      if (!isValid) {
        throw new InvalidSignatureError(
          'Failed to verify GRVT credentials',
          'INVALID_CREDENTIALS',
          'grvt'
        );
      }
    }

    this._isReady = true;
  }

  // ==================== Market Data Methods ====================

  async fetchMarkets(params?: MarketParams): Promise<Market[]> {
    await this.rateLimiter.acquire('fetchMarkets');

    try {
      const response = await this.sdk.getAllInstruments();

      if (!response.result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }

      let markets = this.normalizer.normalizeMarkets(response.result);

      if (params?.active !== undefined) {
        markets = markets.filter((m) => m.active === params.active);
      }

      return markets;
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    await this.rateLimiter.acquire('fetchTicker');

    try {
      const grvtSymbol = this.normalizer.symbolFromCCXT(symbol);
      const response = await this.sdk.getTicker(grvtSymbol);

      if (!response.result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }

      return this.normalizer.normalizeTicker(response.result);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    await this.rateLimiter.acquire('fetchOrderBook');

    try {
      const grvtSymbol = this.normalizer.symbolFromCCXT(symbol);
      // GRVT only supports specific depth values: 10, 50, 100
      const requestedLimit = params?.limit || 50;
      const depth = requestedLimit <= 10 ? 10 : requestedLimit <= 50 ? 50 : 100;
      const response = await this.sdk.getOrderBook(grvtSymbol, depth);

      if (!response.result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }

      return this.normalizer.normalizeOrderBook(response.result);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    await this.rateLimiter.acquire('fetchTrades');

    try {
      const grvtSymbol = this.normalizer.symbolFromCCXT(symbol);
      const response = await this.sdk.getTradeHistory({
        instrument: grvtSymbol,
        limit: params?.limit || 100,
      });

      if (!response.result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }

      return this.normalizer.normalizeTrades(response.result);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Fetch OHLCV (candlestick) data
   *
   * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
   * @param timeframe - Candlestick timeframe
   * @param params - Optional parameters (since, until, limit)
   * @returns Array of OHLCV tuples [timestamp, open, high, low, close, volume]
   */
  async fetchOHLCV(
    symbol: string,
    timeframe: OHLCVTimeframe = '1h',
    params?: OHLCVParams
  ): Promise<OHLCV[]> {
    await this.rateLimiter.acquire('fetchOHLCV');

    try {
      const grvtSymbol = this.normalizer.symbolFromCCXT(symbol);

      // Map unified timeframe to GRVT interval
      // GRVT uses seconds-based intervals
      const intervalMap: Record<OHLCVTimeframe, number> = {
        '1m': 60,
        '3m': 180,
        '5m': 300,
        '15m': 900,
        '30m': 1800,
        '1h': 3600,
        '2h': 7200,
        '4h': 14400,
        '6h': 21600,
        '8h': 28800,
        '12h': 43200,
        '1d': 86400,
        '3d': 259200,
        '1w': 604800,
        '1M': 2592000,
      };

      const interval = intervalMap[timeframe] || 3600;

      // Calculate time range
      const now = Date.now();
      const defaultDuration = this.getDefaultDuration(timeframe);
      const startTime = params?.since ?? now - defaultDuration;
      const endTime = params?.until ?? now;

      const response = await this.sdk.getCandlestick({
        instrument: grvtSymbol,
        interval,
        start_time: startTime,
        end_time: endTime,
        limit: params?.limit,
      });

      if (!response.result || !Array.isArray(response.result)) {
        return [];
      }

      // Convert GRVT candle format to OHLCV tuple
      return response.result.map((candle: any): OHLCV => [
        candle.time || candle.t,
        parseFloat(candle.open || candle.o || '0'),
        parseFloat(candle.high || candle.h || '0'),
        parseFloat(candle.low || candle.l || '0'),
        parseFloat(candle.close || candle.c || '0'),
        parseFloat(candle.volume || candle.v || '0'),
      ]);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Get default duration based on timeframe for initial data fetch
   */
  private getDefaultDuration(timeframe: OHLCVTimeframe): number {
    const durationMap: Record<OHLCVTimeframe, number> = {
      '1m': 24 * 60 * 60 * 1000,         // 24 hours
      '3m': 3 * 24 * 60 * 60 * 1000,     // 3 days
      '5m': 5 * 24 * 60 * 60 * 1000,     // 5 days
      '15m': 7 * 24 * 60 * 60 * 1000,    // 7 days
      '30m': 14 * 24 * 60 * 60 * 1000,   // 14 days
      '1h': 30 * 24 * 60 * 60 * 1000,    // 30 days
      '2h': 60 * 24 * 60 * 60 * 1000,    // 60 days
      '4h': 90 * 24 * 60 * 60 * 1000,    // 90 days
      '6h': 120 * 24 * 60 * 60 * 1000,   // 120 days
      '8h': 180 * 24 * 60 * 60 * 1000,   // 180 days
      '12h': 365 * 24 * 60 * 60 * 1000,  // 1 year
      '1d': 365 * 24 * 60 * 60 * 1000,   // 1 year
      '3d': 2 * 365 * 24 * 60 * 60 * 1000,  // 2 years
      '1w': 3 * 365 * 24 * 60 * 60 * 1000,  // 3 years
      '1M': 5 * 365 * 24 * 60 * 60 * 1000,  // 5 years
    };
    return durationMap[timeframe] || 30 * 24 * 60 * 60 * 1000;
  }

  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    await this.rateLimiter.acquire('fetchFundingRate');

    try {
      const grvtSymbol = this.normalizer.symbolFromCCXT(symbol);
      const response = await this.sdk.getFunding(grvtSymbol);

      if (!response.result || response.result.length === 0) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }

      // SDK returns array, take the first (latest) funding rate
      const funding = response.result[0];

      // Add type guard to ensure funding exists
      if (!funding) {
        throw new PerpDEXError('No funding data available', 'NO_FUNDING_DATA', 'grvt');
      }

      const fundingTimestamp = funding.funding_time ? parseInt(funding.funding_time) : Date.now();
      const fundingIntervalHours = funding.funding_interval_hours ?? 8;
      const nextFundingTimestamp = fundingTimestamp + fundingIntervalHours * 60 * 60 * 1000;

      return {
        symbol,
        fundingRate: parseFloat(funding.funding_rate ?? '0'),
        fundingTimestamp,
        nextFundingTimestamp,
        markPrice: parseFloat(funding.mark_price ?? '0'),
        indexPrice: 0, // Not provided in funding API
        fundingIntervalHours,
        info: funding as any,
      };
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  // ==================== Trading Methods ====================

  async createOrder(request: OrderRequest): Promise<Order> {
    // Validate order request
    const validatedRequest = this.validateOrder(request);

    this.auth.requireAuth();
    await this.rateLimiter.acquire('createOrder');

    try {
      const grvtSymbol = this.normalizer.symbolFromCCXT(validatedRequest.symbol);

      // Prepare order request
      const orderRequest: any = {
        instrument: grvtSymbol,
        order_type: this.mapOrderType(validatedRequest.type),
        side: validatedRequest.side === 'buy' ? 'BUY' : 'SELL',
        size: validatedRequest.amount.toString(),
        price: validatedRequest.price?.toString() || '0',
        time_in_force: this.mapTimeInForce(validatedRequest.timeInForce),
        reduce_only: validatedRequest.reduceOnly || false,
        post_only: validatedRequest.postOnly || false,
        client_order_id: validatedRequest.clientOrderId,
      };

      // Sign if wallet available
      if (this.auth.getAddress()) {
        const payload = {
          instrument: grvtSymbol,
          order_type: orderRequest.order_type,
          side: orderRequest.side,
          size: orderRequest.size,
          price: orderRequest.price,
          time_in_force: orderRequest.time_in_force,
          reduce_only: orderRequest.reduce_only,
          post_only: orderRequest.post_only,
          nonce: this.auth.getNextNonce(),
          expiry: Date.now() + 60000, // 1 minute
        };

        const signature = await this.auth.createSignature(payload);
        orderRequest.signature = signature;
      }

      const response = await this.sdk.createOrder(orderRequest);

      if (!response.result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }

      // Extract and store session cookie
      const sessionCookie = this.sdk.getSessionCookie();
      if (sessionCookie) {
        this.auth.setSessionCookie(sessionCookie);
      }

      return this.normalizer.normalizeOrder(response.result);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    this.auth.requireAuth();
    await this.rateLimiter.acquire('cancelOrder');

    try {
      const response = await this.sdk.cancelOrder({ order_id: orderId });

      if (!response.result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }

      return this.normalizer.normalizeOrder(response.result);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    this.auth.requireAuth();
    await this.rateLimiter.acquire('cancelAllOrders');

    try {
      const params: any = {};
      if (symbol) {
        params.instrument = this.normalizer.symbolFromCCXT(symbol);
      }

      const response = await this.sdk.cancelAllOrders(params);

      // SDK returns number of canceled orders, not the orders themselves
      // Return empty array since we don't have order details
      return [];
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    this.auth.requireAuth();
    await this.rateLimiter.acquire('fetchOpenOrders');

    try {
      const params: any = {};
      if (symbol) {
        params.instrument = this.normalizer.symbolFromCCXT(symbol);
      }

      const response = await this.sdk.getOpenOrders(params);

      if (!response.result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }

      return this.normalizer.normalizeOrders(response.result);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Fetch order history - NOW IMPLEMENTED via SDK!
   */
  async fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]> {
    this.auth.requireAuth();
    await this.rateLimiter.acquire('fetchClosedOrders');

    try {
      const params: any = { limit: limit || 100 };
      if (symbol) {
        params.instrument = this.normalizer.symbolFromCCXT(symbol);
      }

      const response = await this.sdk.getOrderHistory(params);

      if (!response.result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }

      return this.normalizer.normalizeOrders(response.result);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  /**
   * Fetch user trade history - NOW IMPLEMENTED via SDK!
   */
  async fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]> {
    this.auth.requireAuth();
    await this.rateLimiter.acquire('fetchMyTrades');

    try {
      const params: any = { limit: limit || 100 };
      if (symbol) {
        params.instrument = this.normalizer.symbolFromCCXT(symbol);
      }

      const response = await this.sdk.getFillHistory(params);

      if (!response.result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }

      return this.normalizer.normalizeFills(response.result);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  // ==================== Account Methods ====================

  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    this.auth.requireAuth();
    await this.rateLimiter.acquire('fetchPositions');

    try {
      const response = await this.sdk.getPositions();

      if (!response.result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }

      let positions = this.normalizer.normalizePositions(response.result);

      if (symbols && symbols.length > 0) {
        positions = positions.filter((p) => symbols.includes(p.symbol));
      }

      return positions;
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  async fetchBalance(): Promise<Balance[]> {
    this.auth.requireAuth();
    await this.rateLimiter.acquire('fetchBalance');

    try {
      const response = await this.sdk.getSubAccountSummary();

      if (!response.result) {
        throw new PerpDEXError('Invalid API response', 'INVALID_RESPONSE', 'grvt');
      }

      // Extract balances from sub-account summary
      const balances = response.result.spot_balances || [];
      return this.normalizer.normalizeBalances(balances);
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  // ==================== Helper Methods ====================

  private mapOrderType(type: string): string {
    const typeMap: Record<string, string> = {
      market: 'MARKET',
      limit: 'LIMIT',
      limitMaker: 'LIMIT_MAKER',
    };
    return typeMap[type] || 'LIMIT';
  }

  private mapTimeInForce(tif?: string): string {
    if (!tif) return 'GTC';

    const tifMap: Record<string, string> = {
      GTC: 'GTC',
      IOC: 'IOC',
      FOK: 'FOK',
      PO: 'POST_ONLY',
    };
    return tifMap[tif] || 'GTC';
  }

  // ==================== Required BaseAdapter Methods ====================

  async fetchFundingRateHistory(
    symbol: string,
    since?: number,
    limit?: number
  ): Promise<FundingRate[]> {
    throw new PerpDEXError(
      'GRVT does not provide funding rate history via API',
      'NOT_SUPPORTED',
      'grvt'
    );
  }

  async setLeverage(symbol: string, leverage: number): Promise<void> {
    // GRVT uses cross-margin, but we can try to set initial leverage
    await this.rateLimiter.acquire('modifyOrder');

    try {
      const grvtSymbol = this.normalizer.symbolFromCCXT(symbol);
      await this.sdk.setInitialLeverage({
        instrument: grvtSymbol,
        leverage: leverage.toString(),
      });
    } catch (error) {
      throw mapAxiosError(error);
    }
  }

  symbolToExchange(symbol: string): string {
    return this.normalizer.symbolFromCCXT(symbol);
  }

  symbolFromExchange(exchangeSymbol: string): string {
    return this.normalizer.symbolToCCXT(exchangeSymbol);
  }

  // ==================== WebSocket Methods ====================

  /**
   * Initialize WebSocket connection if not already initialized
   */
  private async ensureWebSocket(): Promise<GRVTWebSocketWrapper> {
    if (!this.ws) {
      // Get sub-account ID from config if available
      const subAccountId = (this.config as any).subAccountId as string | undefined;

      this.ws = new GRVTWebSocketWrapper({
        testnet: this.testnet,
        subAccountId,
        timeout: this.config.timeout,
      });

      await this.ws.connect();
    }

    return this.ws;
  }

  /**
   * Watch order book updates in real-time
   *
   * @param symbol - Trading symbol (e.g., "BTC/USDT:USDT")
   * @param limit - Order book depth (default: 50)
   * @returns AsyncGenerator yielding OrderBook updates
   *
   * @example
   * ```typescript
   * for await (const orderBook of adapter.watchOrderBook('BTC/USDT:USDT')) {
   *   console.log('Best bid:', orderBook.bids[0]);
   *   console.log('Best ask:', orderBook.asks[0]);
   * }
   * ```
   */
  async *watchOrderBook(
    symbol: string,
    limit?: number
  ): AsyncGenerator<OrderBook> {
    const ws = await this.ensureWebSocket();
    const depth = limit || 50;

    yield* ws.watchOrderBook(symbol, depth);
  }

  /**
   * Watch public trades in real-time
   *
   * @param symbol - Trading symbol
   * @returns AsyncGenerator yielding Trade updates
   *
   * @example
   * ```typescript
   * for await (const trade of adapter.watchTrades('BTC/USDT:USDT')) {
   *   console.log('Trade:', trade.price, trade.amount, trade.side);
   * }
   * ```
   */
  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    const ws = await this.ensureWebSocket();
    yield* ws.watchTrades(symbol);
  }

  /**
   * Watch position updates in real-time
   *
   * @returns AsyncGenerator yielding Position array updates
   *
   * @example
   * ```typescript
   * for await (const positions of adapter.watchPositions()) {
   *   for (const position of positions) {
   *     console.log('Position:', position.symbol, position.size, position.unrealizedPnl);
   *   }
   * }
   * ```
   */
  async *watchPositions(): AsyncGenerator<Position[]> {
    const ws = await this.ensureWebSocket();

    // GRVT sends individual position updates, collect and yield as array
    for await (const position of ws.watchPositions()) {
      yield [position];
    }
  }

  /**
   * Watch order updates in real-time
   *
   * @returns AsyncGenerator yielding Order array updates
   *
   * @example
   * ```typescript
   * for await (const orders of adapter.watchOrders()) {
   *   for (const order of orders) {
   *     console.log('Order update:', order.id, order.status, order.filled);
   *   }
   * }
   * ```
   */
  async *watchOrders(): AsyncGenerator<Order[]> {
    const ws = await this.ensureWebSocket();

    // GRVT sends individual order updates, collect and yield as array
    for await (const order of ws.watchOrders()) {
      yield [order];
    }
  }

  /**
   * Watch ticker updates in real-time
   *
   * @param symbol - Trading symbol (e.g., "BTC/USDT:USDT")
   * @returns AsyncGenerator yielding Ticker updates
   *
   * @example
   * ```typescript
   * for await (const ticker of adapter.watchTicker('BTC/USDT:USDT')) {
   *   console.log('Price:', ticker.last);
   * }
   * ```
   */
  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    const ws = await this.ensureWebSocket();
    yield* ws.watchTicker(symbol);
  }

  /**
   * Watch balance updates in real-time
   *
   * @returns AsyncGenerator yielding Balance array
   *
   * @example
   * ```typescript
   * for await (const balances of adapter.watchBalance()) {
   *   console.log('Balance update:', balances);
   * }
   * ```
   */
  async *watchBalance(): AsyncGenerator<Balance[]> {
    const ws = await this.ensureWebSocket();
    yield* ws.watchBalance();
  }

  /**
   * Watch user trades (fills) in real-time
   *
   * @param symbol - Optional symbol filter
   * @returns AsyncGenerator yielding Trade updates
   *
   * @example
   * ```typescript
   * for await (const trade of adapter.watchMyTrades()) {
   *   console.log('Fill:', trade.symbol, trade.side, trade.amount, '@', trade.price);
   * }
   * ```
   */
  async *watchMyTrades(symbol?: string): AsyncGenerator<Trade> {
    const ws = await this.ensureWebSocket();
    yield* ws.watchMyTrades(symbol);
  }

  /**
   * Close WebSocket connection
   */
  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.disconnect();
      this.ws = undefined;
    }

    this.auth.clearSessionCookie();
    this.sdk.clearSession();
    this._isReady = false;
  }
}

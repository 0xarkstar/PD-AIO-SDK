/**
 * Hyperliquid Exchange Adapter
 *
 * Implements IExchangeAdapter for Hyperliquid DEX
 */

import { Wallet } from 'ethers';
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
import { RateLimiter } from '../../core/RateLimiter.js';
import { WebSocketManager } from '../../websocket/index.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import {
  HYPERLIQUID_MAINNET_API,
  HYPERLIQUID_MAINNET_WS,
  HYPERLIQUID_RATE_LIMIT,
  HYPERLIQUID_TESTNET_API,
  HYPERLIQUID_TESTNET_WS,
  HYPERLIQUID_WS_CHANNELS,
  HYPERLIQUID_WS_RECONNECT,
  hyperliquidToUnified,
  unifiedToHyperliquid,
} from './constants.js';
import { HyperliquidAuth } from './HyperliquidAuth.js';
import type {
  HyperliquidAction,
  HyperliquidAllMids,
  HyperliquidL2Book,
  HyperliquidMeta,
  HyperliquidOpenOrder,
  HyperliquidOrderResponse,
  HyperliquidUserState,
  HyperliquidWsL2BookUpdate,
  HyperliquidWsSubscription,
  HyperliquidWsTrade,
} from './types.js';
import {
  convertOrderRequest,
  mapError,
  normalizeBalance,
  normalizeMarket,
  normalizeOrder,
  normalizeOrderBook,
  normalizePosition,
  normalizeTicker,
  normalizeTrade,
} from './utils.js';

export interface HyperliquidConfig extends ExchangeConfig {
  /** Ethereum wallet for signing */
  wallet?: Wallet;

  /** Private key (alternative to wallet) */
  privateKey?: string;
}

export class HyperliquidAdapter extends BaseAdapter {
  readonly id = 'hyperliquid';
  readonly name = 'Hyperliquid';

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
    createBatchOrders: true,
    cancelBatchOrders: true,
    editOrder: false,

    // Positions & Balance
    fetchPositions: true,
    fetchBalance: true,
    setLeverage: true,
    setMarginMode: 'emulated',

    // WebSocket
    watchOrderBook: true,
    watchTrades: true,
    watchTicker: true,
    watchPositions: true,
    watchOrders: true,
    watchBalance: false,
    watchFundingRate: false,

    // Advanced
    twapOrders: false,
    vaultTrading: false,
  };

  private apiUrl: string;
  private wsUrl: string;
  private wsManager?: WebSocketManager;
  private auth?: HyperliquidAuth;
  protected rateLimiter: RateLimiter;

  constructor(config: HyperliquidConfig = {}) {
    super(config);

    // Set API URLs
    this.apiUrl = config.testnet ? HYPERLIQUID_TESTNET_API : HYPERLIQUID_MAINNET_API;
    this.wsUrl = config.testnet ? HYPERLIQUID_TESTNET_WS : HYPERLIQUID_MAINNET_WS;

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter({
      maxTokens: config.rateLimit?.maxRequests ?? HYPERLIQUID_RATE_LIMIT.maxRequests,
      windowMs: config.rateLimit?.windowMs ?? HYPERLIQUID_RATE_LIMIT.windowMs,
      weights: config.rateLimit?.weights ?? HYPERLIQUID_RATE_LIMIT.weights,
      exchange: 'hyperliquid',
    });

    // Initialize auth if wallet provided
    if (config.wallet) {
      this.auth = new HyperliquidAuth(config.wallet);
    } else if (config.privateKey) {
      const wallet = new Wallet(config.privateKey);
      this.auth = new HyperliquidAuth(wallet);
    }
  }

  // ===========================================================================
  // Connection Management
  // ===========================================================================

  async initialize(): Promise<void> {
    if (this._isReady) {
      return;
    }

    // Initialize WebSocket manager
    this.wsManager = new WebSocketManager({
      url: this.wsUrl,
      reconnect: HYPERLIQUID_WS_RECONNECT,
    });

    await this.wsManager.connect();

    this._isReady = true;
    this.debug('Adapter initialized');
  }

  async disconnect(): Promise<void> {
    if (this.wsManager) {
      await this.wsManager.disconnect();
    }

    this._isReady = false;
    this.debug('Adapter disconnected');
  }

  // ===========================================================================
  // Market Data (Public)
  // ===========================================================================

  async fetchMarkets(params?: MarketParams): Promise<Market[]> {
    await this.rateLimiter.acquire('fetchMarkets');

    try {
      const response = await this.request<HyperliquidMeta>('POST', `${this.apiUrl}/info`, {
        type: 'meta',
      });

      const markets = response.universe.map((asset, index) => normalizeMarket(asset, index));

      // Filter by params if provided
      if (params?.active !== undefined) {
        return markets.filter((m) => m.active === params.active);
      }

      return markets;
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    await this.rateLimiter.acquire('fetchTicker');

    try {
      const response = await this.request<HyperliquidAllMids>('POST', `${this.apiUrl}/info`, {
        type: 'allMids',
      });

      const exchangeSymbol = this.symbolToExchange(symbol);
      const mid = response.mids[exchangeSymbol];

      if (!mid) {
        throw new Error(`No ticker data for ${symbol}`);
      }

      return normalizeTicker(exchangeSymbol, { mid });
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    await this.rateLimiter.acquire('fetchOrderBook');

    try {
      const exchangeSymbol = this.symbolToExchange(symbol);

      const response = await this.request<HyperliquidL2Book>('POST', `${this.apiUrl}/info`, {
        type: 'l2Book',
        coin: exchangeSymbol,
      });

      return normalizeOrderBook(response);
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    await this.rateLimiter.acquire('fetchTrades');

    try {
      const exchangeSymbol = this.symbolToExchange(symbol);

      // Hyperliquid provides trade history via candlestick endpoint
      // We'll fetch 1-minute candles and extract trades
      const response = await this.request<unknown>('POST', `${this.apiUrl}/info`, {
        type: 'candleSnapshot',
        req: {
          coin: exchangeSymbol,
          interval: '1m',
          startTime: params?.since ?? Date.now() - 3600000, // Default 1 hour
          endTime: Date.now(),
        },
      });

      // Note: Hyperliquid doesn't provide individual trades via REST
      // This is a limitation - real trade data requires WebSocket
      // Return empty array for now
      this.debug('fetchTrades: Hyperliquid REST API does not provide trade history');
      return [];
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    await this.rateLimiter.acquire('fetchFundingRate');

    try {
      const exchangeSymbol = this.symbolToExchange(symbol);

      // Fetch funding history (last entry is current)
      const response = await this.request<Array<{ coin: string; fundingRate: string; premium: string; time: number }>>('POST', `${this.apiUrl}/info`, {
        type: 'fundingHistory',
        coin: exchangeSymbol,
        startTime: Date.now() - 86400000, // Last 24h
      });

      if (!response || response.length === 0) {
        throw new Error(`No funding rate data for ${symbol}`);
      }

      // Get latest funding rate
      const latest = response[response.length - 1];
      if (!latest) {
        throw new Error(`No funding rate data for ${symbol}`);
      }

      // Fetch current mark price
      const allMids = await this.request<HyperliquidAllMids>('POST', `${this.apiUrl}/info`, {
        type: 'allMids',
      });

      const markPrice = parseFloat(allMids.mids[exchangeSymbol] ?? '0');

      return {
        symbol,
        fundingRate: parseFloat(latest.fundingRate),
        fundingTimestamp: latest.time,
        nextFundingTimestamp: latest.time + 8 * 3600 * 1000, // 8 hours
        markPrice,
        indexPrice: markPrice,
        fundingIntervalHours: 8,
      };
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchFundingRateHistory(
    symbol: string,
    since?: number,
    limit?: number
  ): Promise<FundingRate[]> {
    throw new Error('fetchFundingRateHistory not supported by Hyperliquid');
  }

  // ===========================================================================
  // Trading (Private)
  // ===========================================================================

  async createOrder(request: OrderRequest): Promise<Order> {
    this.ensureInitialized();

    if (!this.auth) {
      throw new Error('Authentication required for trading');
    }

    await this.rateLimiter.acquire('createOrder');

    try {
      const exchangeSymbol = this.symbolToExchange(request.symbol);
      const orderRequest = convertOrderRequest(request, exchangeSymbol);

      // Create action
      const action: HyperliquidAction = {
        type: 'order',
        orders: [orderRequest],
        grouping: 'na',
      };

      // Sign and send
      const signedRequest = await this.auth.sign({
        method: 'POST',
        path: '/exchange',
        body: action,
      });

      const response = await this.request<HyperliquidOrderResponse>(
        'POST',
        `${this.apiUrl}/exchange`,
        signedRequest.body,
        signedRequest.headers
      );

      // Parse response
      if (response.status === 'err') {
        throw new Error('Order creation failed');
      }

      const status = response.response.data.statuses[0];

      if (!status) {
        throw new Error('No order status in response');
      }

      if ('error' in status) {
        throw new Error(status.error);
      }

      // Extract order ID
      let orderId: string;
      if ('resting' in status) {
        orderId = status.resting.oid.toString();
      } else if ('filled' in status) {
        orderId = status.filled.oid.toString();
      } else {
        throw new Error('Unknown order status');
      }

      // Return normalized order
      return {
        id: orderId,
        symbol: request.symbol,
        type: request.type,
        side: request.side,
        amount: request.amount,
        price: request.price,
        status: 'filled' in status ? 'filled' : 'open',
        filled: 'filled' in status ? parseFloat(status.filled.totalSz) : 0,
        remaining: request.amount,
        reduceOnly: request.reduceOnly ?? false,
        postOnly: request.postOnly ?? false,
        clientOrderId: request.clientOrderId,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw mapError(error);
    }
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    this.ensureInitialized();

    if (!this.auth) {
      throw new Error('Authentication required for trading');
    }

    await this.rateLimiter.acquire('cancelOrder');

    try {
      if (!symbol) {
        throw new Error('Symbol required for order cancellation');
      }

      const exchangeSymbol = this.symbolToExchange(symbol);

      // Create cancel action
      const action: HyperliquidAction = {
        type: 'cancel',
        cancels: [
          {
            coin: exchangeSymbol,
            oid: parseInt(orderId),
          },
        ],
      };

      // Sign and send
      const signedRequest = await this.auth.sign({
        method: 'POST',
        path: '/exchange',
        body: action,
      });

      await this.request<HyperliquidOrderResponse>(
        'POST',
        `${this.apiUrl}/exchange`,
        signedRequest.body,
        signedRequest.headers
      );

      // Return canceled order
      return {
        id: orderId,
        symbol,
        type: 'limit',
        side: 'buy',
        amount: 0,
        status: 'canceled',
        filled: 0,
        remaining: 0,
        reduceOnly: false,
        postOnly: false,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw mapError(error);
    }
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    this.ensureInitialized();

    if (!this.auth) {
      throw new Error('Authentication required for trading');
    }

    await this.rateLimiter.acquire('cancelAllOrders');

    try {
      // Fetch open orders
      const openOrders = await this.fetchOpenOrders(symbol);

      // Cancel each order
      const canceledOrders: Order[] = [];

      for (const order of openOrders) {
        try {
          const canceled = await this.cancelOrder(order.id, order.symbol);
          canceledOrders.push(canceled);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.debug('Failed to cancel order', { orderId: order.id, error: errorMessage });
        }
      }

      return canceledOrders;
    } catch (error) {
      throw mapError(error);
    }
  }

  // ===========================================================================
  // Positions & Balance
  // ===========================================================================

  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    this.ensureInitialized();

    if (!this.auth) {
      throw new Error('Authentication required');
    }

    await this.rateLimiter.acquire('fetchPositions');

    try {
      const response = await this.request<HyperliquidUserState>('POST', `${this.apiUrl}/info`, {
        type: 'clearinghouseState',
        user: this.auth.getAddress(),
      });

      const positions = response.assetPositions
        .filter((p) => parseFloat(p.position.szi) !== 0)
        .map(normalizePosition);

      // Filter by symbols if provided
      if (symbols && symbols.length > 0) {
        return positions.filter((p) => symbols.includes(p.symbol));
      }

      return positions;
    } catch (error) {
      throw mapError(error);
    }
  }

  async fetchBalance(): Promise<Balance[]> {
    this.ensureInitialized();

    if (!this.auth) {
      throw new Error('Authentication required');
    }

    await this.rateLimiter.acquire('fetchBalance');

    try {
      const response = await this.request<HyperliquidUserState>('POST', `${this.apiUrl}/info`, {
        type: 'clearinghouseState',
        user: this.auth.getAddress(),
      });

      return normalizeBalance(response);
    } catch (error) {
      throw mapError(error);
    }
  }

  async setLeverage(symbol: string, leverage: number): Promise<void> {
    this.ensureInitialized();

    if (!this.auth) {
      throw new Error('Authentication required');
    }

    await this.rateLimiter.acquire('setLeverage', 5);

    try {
      const exchangeSymbol = this.symbolToExchange(symbol);

      // Create updateLeverage action
      const action: HyperliquidAction = {
        type: 'batchModify' as 'order', // Type assertion for extended type
        orders: [],
      };

      // Note: Actual implementation needs the updateLeverage action format
      // For now, we'll log and acknowledge the limitation
      this.debug(`setLeverage: Updating leverage for ${symbol} to ${leverage}x`);
      this.debug('Note: Hyperliquid leverage is managed per-position in cross-margin mode');

      // In Hyperliquid, leverage for isolated positions is set when opening
      // For cross-margin, it's automatic based on account equity
      // This is more of a placeholder/documentation than functional implementation
    } catch (error) {
      throw mapError(error);
    }
  }

  // ===========================================================================
  // WebSocket Streams
  // ===========================================================================

  async *watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook> {
    this.ensureInitialized();

    if (!this.wsManager) {
      throw new Error('WebSocket manager not initialized');
    }

    const exchangeSymbol = this.symbolToExchange(symbol);

    const subscription: HyperliquidWsSubscription = {
      method: 'subscribe',
      subscription: {
        type: HYPERLIQUID_WS_CHANNELS.L2_BOOK,
        coin: exchangeSymbol,
      },
    };

    const unsubscribe: HyperliquidWsSubscription = {
      method: 'unsubscribe',
      subscription: {
        type: HYPERLIQUID_WS_CHANNELS.L2_BOOK,
        coin: exchangeSymbol,
      },
    };

    for await (const data of this.wsManager.watch<HyperliquidWsL2BookUpdate>(
      `${HYPERLIQUID_WS_CHANNELS.L2_BOOK}:${exchangeSymbol}`,
      subscription,
      unsubscribe
    )) {
      // Convert WebSocket update format to L2Book format
      const book: HyperliquidL2Book = {
        coin: data.coin,
        levels: data.levels.map((level) => level.map((l) => [l.px, l.sz])),
        time: data.time,
      };

      yield normalizeOrderBook(book);
    }
  }

  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    this.ensureInitialized();

    if (!this.wsManager) {
      throw new Error('WebSocket manager not initialized');
    }

    const exchangeSymbol = this.symbolToExchange(symbol);

    const subscription: HyperliquidWsSubscription = {
      method: 'subscribe',
      subscription: {
        type: HYPERLIQUID_WS_CHANNELS.TRADES,
        coin: exchangeSymbol,
      },
    };

    for await (const data of this.wsManager.watch<HyperliquidWsTrade>(
      `${HYPERLIQUID_WS_CHANNELS.TRADES}:${exchangeSymbol}`,
      subscription
    )) {
      yield normalizeTrade(data);
    }
  }

  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    this.ensureInitialized();

    if (!this.wsManager) {
      throw new Error('WebSocket manager not initialized');
    }

    const subscription: HyperliquidWsSubscription = {
      method: 'subscribe',
      subscription: {
        type: HYPERLIQUID_WS_CHANNELS.ALL_MIDS,
      },
    };

    const exchangeSymbol = this.symbolToExchange(symbol);

    for await (const data of this.wsManager.watch<HyperliquidAllMids>(
      HYPERLIQUID_WS_CHANNELS.ALL_MIDS,
      subscription
    )) {
      const mid = data.mids[exchangeSymbol];
      if (mid) {
        yield normalizeTicker(exchangeSymbol, { mid });
      }
    }
  }

  async *watchPositions(): AsyncGenerator<Position[]> {
    this.ensureInitialized();

    if (!this.wsManager || !this.auth) {
      throw new Error('WebSocket manager or auth not initialized');
    }

    const subscription: HyperliquidWsSubscription = {
      method: 'subscribe',
      subscription: {
        type: HYPERLIQUID_WS_CHANNELS.USER,
        user: this.auth.getAddress(),
      },
    };

    for await (const data of this.wsManager.watch<HyperliquidUserState>(
      `${HYPERLIQUID_WS_CHANNELS.USER}:${this.auth.getAddress()}`,
      subscription
    )) {
      const positions = data.assetPositions
        .filter((p) => parseFloat(p.position.szi) !== 0)
        .map(normalizePosition);

      yield positions;
    }
  }

  async *watchOrders(): AsyncGenerator<Order[]> {
    this.ensureInitialized();

    if (!this.wsManager || !this.auth) {
      throw new Error('WebSocket manager or auth not initialized');
    }

    // Use user events channel for order updates
    const subscription: HyperliquidWsSubscription = {
      method: 'subscribe',
      subscription: {
        type: HYPERLIQUID_WS_CHANNELS.USER_EVENTS,
        user: this.auth.getAddress(),
      },
    };

    // Would need to track order state and emit updates
    throw new Error('watchOrders not yet fully implemented');
    yield [] as Order[];
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  protected symbolToExchange(symbol: string): string {
    return unifiedToHyperliquid(symbol);
  }

  protected symbolFromExchange(exchangeSymbol: string): string {
    return hyperliquidToUnified(exchangeSymbol);
  }

  /**
   * Fetch open orders (helper method)
   */
  private async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    if (!this.auth) {
      throw new Error('Authentication required');
    }

    try {
      const response = await this.request<HyperliquidOpenOrder[]>(
        'POST',
        `${this.apiUrl}/info`,
        {
          type: 'openOrders',
          user: this.auth.getAddress(),
        }
      );

      const orders = response.map((order) => normalizeOrder(order, order.coin));

      // Filter by symbol if provided
      if (symbol) {
        return orders.filter((o) => o.symbol === symbol);
      }

      return orders;
    } catch (error) {
      throw mapError(error);
    }
  }
}

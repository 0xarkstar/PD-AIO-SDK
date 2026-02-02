/**
 * GRVT WebSocket Wrapper
 *
 * Wraps the @grvt/client WS class to provide AsyncGenerator-based
 * streaming interfaces for real-time market data and account updates.
 *
 * Features:
 * - AsyncGenerator pattern for easy iteration
 * - Automatic reconnection via SDK
 * - Data normalization
 * - Type-safe subscriptions
 */

import { WS, EStream } from '@grvt/client/ws/index.js';
import type {
  IWSBookRequest,
  IWSTradeRequest,
  IWSTdgPositionRequest,
  IWSTdgOrderRequest,
} from '@grvt/client/ws/interfaces.js';
import type {
  IOrderbookLevels,
  ITrade,
  IPositions,
  IOrder,
} from '@grvt/client/interfaces';
import type { OrderBook, Trade, Position, Order, Balance, Ticker } from '../../types/common.js';
import { GRVTNormalizer } from './GRVTNormalizer.js';
import { GRVT_API_URLS } from './constants.js';

export interface GRVTWebSocketConfig {
  testnet?: boolean;
  subAccountId?: string;
  timeout?: number;
}

/**
 * WebSocket wrapper for GRVT real-time data streams
 */
export class GRVTWebSocketWrapper {
  /** Maximum queue size for backpressure */
  private static readonly MAX_QUEUE_SIZE = 1000;

  private readonly ws: WS;
  private readonly normalizer: GRVTNormalizer;
  private readonly subAccountId?: string;
  private isConnected = false;

  /**
   * Push to queue with bounded size (backpressure)
   */
  private boundedPush<T>(queue: T[], item: T, channel?: string): void {
    if (queue.length >= GRVTWebSocketWrapper.MAX_QUEUE_SIZE) {
      queue.shift(); // Drop oldest message
      if (channel) {
        console.warn(`[GRVT WebSocket] Queue overflow on ${channel}, dropping oldest message`);
      }
    }
    queue.push(item);
  }

  constructor(config: GRVTWebSocketConfig = {}) {
    const urls = config.testnet ? GRVT_API_URLS.testnet : GRVT_API_URLS.mainnet;

    this.normalizer = new GRVTNormalizer();
    this.subAccountId = config.subAccountId;

    // Initialize GRVT SDK WebSocket
    this.ws = new WS({
      url: urls.websocket,
      timeout: config.timeout || 30000,
      reconnectStrategy: (retries) => {
        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(1000 * Math.pow(2, retries), 30000);
        return delay;
      },
    });

    // Setup connection event handlers
    this.ws.onConnect(() => {
      this.isConnected = true;
    });

    this.ws.onClose(() => {
      this.isConnected = false;
    });

    this.ws.onError((error) => {
      console.error('[GRVT WebSocket] Error:', error);
    });
  }

  /**
   * Connect to WebSocket
   */
  async connect(): Promise<void> {
    this.ws.connect();
    await this.ws.ready(5000); // Wait up to 5s for connection
    this.isConnected = true;
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.ws.disconnect();
    this.isConnected = false;
  }

  /**
   * Watch order book updates for a symbol
   *
   * @param symbol - Trading symbol in CCXT format (e.g., "BTC/USDT:USDT")
   * @param depth - Order book depth (default: 50)
   * @returns AsyncGenerator yielding OrderBook updates
   *
   * @example
   * ```typescript
   * for await (const orderBook of wrapper.watchOrderBook('BTC/USDT:USDT')) {
   *   console.log('Bid:', orderBook.bids[0]);
   *   console.log('Ask:', orderBook.asks[0]);
   * }
   * ```
   */
  async *watchOrderBook(symbol: string, depth: number = 50): AsyncGenerator<OrderBook> {
    const instrument = this.normalizer.symbolFromCCXT(symbol);

    // Queue to hold incoming order book updates
    const queue: IOrderbookLevels[] = [];
    let error: Error | null = null;
    let subscriptionKey: string | null = null;
    let resolver: ((value: IOrderbookLevels) => void) | null = null;
    let rejecter: ((err: Error) => void) | null = null;

    // Subscribe to order book stream
    const request: IWSBookRequest = {
      stream: EStream.RPI_BOOK_SNAP, // Use RPI (Retail Price Improvement) snapshot stream
      params: {
        instrument,
        depth,
      },
      onData: (data) => {
        if (resolver) {
          resolver(data);
          resolver = null;
          rejecter = null;
        } else {
          this.boundedPush(queue, data, 'orderbook');
        }
      },
      onError: (err) => {
        error = err;
        // Wake up any waiting resolver with error
        if (rejecter) {
          rejecter(err);
          resolver = null;
          rejecter = null;
        }
      },
    };

    try {
      subscriptionKey = this.ws.subscribe(request);

      // Yield order books as they arrive
      while (true) {
        // Check for errors
        if (error) {
          throw error;
        }

        let orderBookData: IOrderbookLevels;

        // Event-driven: wait for data without busy polling
        if (queue.length > 0) {
          orderBookData = queue.shift()!;
        } else {
          orderBookData = await new Promise<IOrderbookLevels>((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
          });
        }

        // Check for errors after awaiting
        if (error) {
          throw error;
        }

        const normalized = this.normalizer.normalizeOrderBook(orderBookData);
        yield normalized;
      }
    } finally {
      // Cleanup: unsubscribe when generator is closed
      if (subscriptionKey) {
        this.ws.unsubscribe(subscriptionKey);
      }
    }
  }

  /**
   * Watch public trades for a symbol
   *
   * @param symbol - Trading symbol in CCXT format
   * @returns AsyncGenerator yielding Trade updates
   *
   * @example
   * ```typescript
   * for await (const trade of wrapper.watchTrades('BTC/USDT:USDT')) {
   *   console.log('Trade:', trade.price, trade.amount, trade.side);
   * }
   * ```
   */
  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    const instrument = this.normalizer.symbolFromCCXT(symbol);

    const queue: ITrade[] = [];
    let error: Error | null = null;
    let subscriptionKey: string | null = null;
    let resolver: ((value: ITrade) => void) | null = null;
    let rejecter: ((err: Error) => void) | null = null;

    const request: IWSTradeRequest = {
      stream: EStream.TRADE,
      params: {
        instrument,
      },
      onData: (data) => {
        if (resolver) {
          resolver(data);
          resolver = null;
          rejecter = null;
        } else {
          this.boundedPush(queue, data, 'trades');
        }
      },
      onError: (err) => {
        error = err;
        if (rejecter) {
          rejecter(err);
          resolver = null;
          rejecter = null;
        }
      },
    };

    try {
      subscriptionKey = this.ws.subscribe(request);

      while (true) {
        if (error) throw error;

        let tradeData: ITrade;

        if (queue.length > 0) {
          tradeData = queue.shift()!;
        } else {
          tradeData = await new Promise<ITrade>((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
          });
        }

        if (error) throw error;

        const normalized = this.normalizer.normalizeTrade(tradeData);
        yield normalized;
      }
    } finally {
      if (subscriptionKey) {
        this.ws.unsubscribe(subscriptionKey);
      }
    }
  }

  /**
   * Watch position updates for user account
   *
   * @param symbol - Optional symbol filter (watch all positions if not provided)
   * @returns AsyncGenerator yielding Position updates
   *
   * @example
   * ```typescript
   * for await (const position of wrapper.watchPositions()) {
   *   console.log('Position:', position.symbol, position.size, position.unrealizedPnl);
   * }
   * ```
   */
  async *watchPositions(symbol?: string): AsyncGenerator<Position> {
    if (!this.subAccountId) {
      throw new Error('Sub-account ID required for watching positions');
    }

    const instrument = symbol ? this.normalizer.symbolFromCCXT(symbol) : undefined;

    const queue: IPositions[] = [];
    let error: Error | null = null;
    let subscriptionKey: string | null = null;
    let resolver: ((value: IPositions) => void) | null = null;
    let rejecter: ((err: Error) => void) | null = null;

    const request: IWSTdgPositionRequest = {
      stream: EStream.POSITION,
      params: {
        sub_account_id: this.subAccountId,
        ...(instrument && { instrument }),
      },
      onData: (data) => {
        if (resolver) {
          resolver(data);
          resolver = null;
          rejecter = null;
        } else {
          this.boundedPush(queue, data, 'positions');
        }
      },
      onError: (err) => {
        error = err;
        if (rejecter) {
          rejecter(err);
          resolver = null;
          rejecter = null;
        }
      },
    };

    try {
      subscriptionKey = this.ws.subscribe(request);

      while (true) {
        if (error) throw error;

        let positionData: IPositions;

        if (queue.length > 0) {
          positionData = queue.shift()!;
        } else {
          positionData = await new Promise<IPositions>((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
          });
        }

        if (error) throw error;

        const normalized = this.normalizer.normalizePosition(positionData);
        yield normalized;
      }
    } finally {
      if (subscriptionKey) {
        this.ws.unsubscribe(subscriptionKey);
      }
    }
  }

  /**
   * Watch order updates for user account
   *
   * @param symbol - Optional symbol filter
   * @returns AsyncGenerator yielding Order updates
   *
   * @example
   * ```typescript
   * for await (const order of wrapper.watchOrders()) {
   *   console.log('Order:', order.id, order.status, order.filled);
   * }
   * ```
   */
  async *watchOrders(symbol?: string): AsyncGenerator<Order> {
    if (!this.subAccountId) {
      throw new Error('Sub-account ID required for watching orders');
    }

    const instrument = symbol ? this.normalizer.symbolFromCCXT(symbol) : undefined;

    const queue: IOrder[] = [];
    let error: Error | null = null;
    let subscriptionKey: string | null = null;
    let resolver: ((value: IOrder) => void) | null = null;
    let rejecter: ((err: Error) => void) | null = null;

    const request: IWSTdgOrderRequest = {
      stream: EStream.ORDER,
      params: {
        sub_account_id: this.subAccountId,
        ...(instrument && { instrument }),
      },
      onData: (data) => {
        if (resolver) {
          resolver(data);
          resolver = null;
          rejecter = null;
        } else {
          this.boundedPush(queue, data, 'orders');
        }
      },
      onError: (err) => {
        error = err;
        if (rejecter) {
          rejecter(err);
          resolver = null;
          rejecter = null;
        }
      },
    };

    try {
      subscriptionKey = this.ws.subscribe(request);

      while (true) {
        if (error) throw error;

        let orderData: IOrder;

        if (queue.length > 0) {
          orderData = queue.shift()!;
        } else {
          orderData = await new Promise<IOrder>((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
          });
        }

        if (error) throw error;

        const normalized = this.normalizer.normalizeOrder(orderData);
        yield normalized;
      }
    } finally {
      if (subscriptionKey) {
        this.ws.unsubscribe(subscriptionKey);
      }
    }
  }

  /**
   * Watch balance updates for user account
   *
   * @returns AsyncGenerator yielding Balance array
   *
   * @example
   * ```typescript
   * for await (const balances of wrapper.watchBalance()) {
   *   console.log('Balances:', balances);
   * }
   * ```
   */
  async *watchBalance(): AsyncGenerator<Balance[]> {
    if (!this.subAccountId) {
      throw new Error('Sub-account ID required for watching balance');
    }

    // GRVT WebSocket doesn't have a direct balance stream
    // Balance updates come through position updates
    // We'll wrap position stream and extract balance info
    for await (const position of this.watchPositions()) {
      // Return balance from position info
      const balance: Balance = {
        currency: 'USDT',
        free: position.margin || 0,
        used: 0,
        total: position.margin || 0,
        info: position.info,
      };
      yield [balance];
    }
  }

  /**
   * Watch ticker updates for a symbol
   *
   * GRVT doesn't have a dedicated ticker stream, so we derive ticker
   * from trade stream updates. Each trade update contains price info
   * that can be used to construct ticker-like updates.
   *
   * @param symbol - Trading symbol in CCXT format (e.g., "BTC/USDT:USDT")
   * @returns AsyncGenerator yielding Ticker updates
   *
   * @example
   * ```typescript
   * for await (const ticker of wrapper.watchTicker('BTC/USDT:USDT')) {
   *   console.log('Price:', ticker.last, 'Volume:', ticker.quoteVolume);
   * }
   * ```
   */
  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    const instrument = this.normalizer.symbolFromCCXT(symbol);

    const queue: ITrade[] = [];
    let error: Error | null = null;
    let subscriptionKey: string | null = null;
    let resolver: ((value: ITrade) => void) | null = null;
    let rejecter: ((err: Error) => void) | null = null;

    // Use trade stream to derive ticker updates
    const request: IWSTradeRequest = {
      stream: EStream.TRADE,
      params: {
        instrument,
      },
      onData: (data) => {
        if (resolver) {
          resolver(data);
          resolver = null;
          rejecter = null;
        } else {
          this.boundedPush(queue, data, 'ticker');
        }
      },
      onError: (err) => {
        error = err;
        if (rejecter) {
          rejecter(err);
          resolver = null;
          rejecter = null;
        }
      },
    };

    try {
      subscriptionKey = this.ws.subscribe(request);

      while (true) {
        if (error) throw error;

        let tradeData: ITrade;

        if (queue.length > 0) {
          tradeData = queue.shift()!;
        } else {
          tradeData = await new Promise<ITrade>((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
          });
        }

        if (error) throw error;

        // Convert trade to ticker-like update
        // Note: GRVT doesn't have a dedicated ticker stream, so we derive from trades
        // Some fields are set to 0 as they require aggregated 24h data
        const lastPrice = parseFloat(tradeData.price || '0');
        const lastSize = parseFloat(tradeData.size || '0');
        const ticker: Ticker = {
          symbol: this.normalizer.symbolToCCXT(instrument),
          timestamp: typeof tradeData.event_time === 'number' ? tradeData.event_time : Date.now(),
          last: lastPrice,
          bid: 0,  // Not available from trade stream
          ask: 0,  // Not available from trade stream
          high: lastPrice,  // Single trade, same as last
          low: lastPrice,   // Single trade, same as last
          open: lastPrice,  // Single trade, same as last
          close: lastPrice,
          change: 0,  // Requires 24h aggregation
          percentage: 0,  // Requires 24h aggregation
          baseVolume: lastSize,
          quoteVolume: lastPrice * lastSize,
          info: tradeData as unknown as Record<string, unknown>,
        };

        yield ticker;
      }
    } finally {
      if (subscriptionKey) {
        this.ws.unsubscribe(subscriptionKey);
      }
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
   * for await (const trade of wrapper.watchMyTrades()) {
   *   console.log('Fill:', trade.symbol, trade.side, trade.amount, '@', trade.price);
   * }
   * ```
   */
  async *watchMyTrades(symbol?: string): AsyncGenerator<Trade> {
    if (!this.subAccountId) {
      throw new Error('Sub-account ID required for watching fills');
    }

    const instrument = symbol ? this.normalizer.symbolFromCCXT(symbol) : undefined;

    const queue: any[] = [];
    let error: Error | null = null;
    let subscriptionKey: string | null = null;
    let resolver: ((value: any) => void) | null = null;
    let rejecter: ((err: Error) => void) | null = null;

    const request = {
      stream: EStream.FILL,
      params: {
        sub_account_id: this.subAccountId,
        ...(instrument && { instrument }),
      },
      onData: (data: any) => {
        if (resolver) {
          resolver(data);
          resolver = null;
          rejecter = null;
        } else {
          this.boundedPush(queue, data, 'fills');
        }
      },
      onError: (err: Error) => {
        error = err;
        if (rejecter) {
          rejecter(err);
          resolver = null;
          rejecter = null;
        }
      },
    };

    try {
      subscriptionKey = this.ws.subscribe(request as any);

      while (true) {
        if (error) throw error;

        let data: any;

        if (queue.length > 0) {
          data = queue.shift()!;
        } else {
          data = await new Promise<any>((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
          });
        }

        if (error) throw error;

        // Normalize fill to Trade
        const trade: Trade = {
          id: data.fill_id || data.id || String(Date.now()),
          symbol: this.normalizer.symbolToCCXT(data.instrument || data.symbol),
          orderId: data.order_id,
          side: data.is_buyer ? 'buy' : 'sell',
          price: parseFloat(data.price || '0'),
          amount: parseFloat(data.filled || data.quantity || '0'),
          cost: parseFloat(data.price || '0') * parseFloat(data.filled || data.quantity || '0'),
          timestamp: data.event_time || Date.now(),
          info: data,
        };

        yield trade;
      }
    } finally {
      if (subscriptionKey) {
        this.ws.unsubscribe(subscriptionKey);
      }
    }
  }

  /**
   * Check if WebSocket is connected
   */
  get connected(): boolean {
    return this.isConnected;
  }
}

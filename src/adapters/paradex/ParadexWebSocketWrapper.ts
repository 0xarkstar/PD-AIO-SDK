/**
 * Paradex WebSocket Wrapper
 *
 * Provides AsyncGenerator-based streaming interfaces for real-time
 * market data and account updates using native WebSocket.
 *
 * Features:
 * - AsyncGenerator pattern for easy iteration
 * - Automatic reconnection with exponential backoff
 * - Data normalization
 * - Type-safe subscriptions
 *
 * @see https://docs.paradex.trade/websocket
 */

import type {
  OrderBook,
  Trade,
  Ticker,
  Position,
  Order,
  Balance,
} from '../../types/common.js';
import { ParadexNormalizer } from './ParadexNormalizer.js';
import { PerpDEXError } from '../../types/errors.js';
import { Logger } from '../../core/logger.js';

/**
 * WebSocket configuration
 */
export interface ParadexWebSocketConfig {
  wsUrl: string;
  timeout?: number;
  maxReconnectAttempts?: number;
  apiKey?: string;
}

/**
 * WebSocket message types
 */
interface WSMessage {
  channel: string;
  type?: string;
  data?: any;
  id?: number;
  error?: { code: string; message: string };
}

/**
 * Subscription request
 */
interface SubscriptionRequest {
  method: 'subscribe';
  params: {
    channel: string;
    [key: string]: any;
  };
  id: number;
}

/**
 * Paradex WebSocket Wrapper
 *
 * Implements real-time data streaming using native WebSocket
 *
 * @example
 * ```typescript
 * const ws = new ParadexWebSocketWrapper({
 *   wsUrl: 'wss://ws.testnet.paradex.trade/v1',
 *   apiKey: 'your-api-key',
 * });
 *
 * await ws.connect();
 *
 * // Watch order book
 * for await (const orderBook of ws.watchOrderBook('BTC/USD:USD')) {
 *   console.log('Bid:', orderBook.bids[0]);
 *   console.log('Ask:', orderBook.asks[0]);
 * }
 * ```
 */
export class ParadexWebSocketWrapper {
  /** Maximum queue size for backpressure */
  private static readonly MAX_QUEUE_SIZE = 1000;

  private ws?: WebSocket;
  private readonly wsUrl: string;
  private readonly timeout: number;
  private readonly maxReconnectAttempts: number;
  private readonly apiKey?: string;
  private readonly normalizer: ParadexNormalizer;
  private readonly logger = new Logger('ParadexWebSocket');
  private isConnected = false;
  private reconnectAttempts = 0;
  private subscriptionId = 0;
  private readonly subscriptions = new Map<string, Set<(data: any) => void>>();
  private readonly messageQueue = new Map<string, any[]>();

  /**
   * Push to queue with bounded size (backpressure)
   */
  private boundedPush<T>(queue: T[], item: T, channel?: string): void {
    if (queue.length >= ParadexWebSocketWrapper.MAX_QUEUE_SIZE) {
      queue.shift(); // Drop oldest message
      if (channel) {
        this.logger.warn(`Queue overflow on ${channel}, dropping oldest message`);
      }
    }
    queue.push(item);
  }

  constructor(config: ParadexWebSocketConfig) {
    this.wsUrl = config.wsUrl;
    this.timeout = config.timeout || 30000;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 10;
    this.apiKey = config.apiKey;
    this.normalizer = new ParadexNormalizer();
  }

  /**
   * Connect to WebSocket
   *
   * @throws {PerpDEXError} If connection fails
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          this.logger.error('WebSocket error', undefined, { error });
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.handleDisconnect();
        };

        // Timeout
        setTimeout(() => {
          if (!this.isConnected) {
            reject(
              new PerpDEXError(
                'WebSocket connection timeout',
                'WS_TIMEOUT',
                'paradex'
              )
            );
          }
        }, this.timeout);
      } catch (error) {
        reject(
          new PerpDEXError(
            `Failed to connect WebSocket: ${error instanceof Error ? error.message : String(error)}`,
            'WS_CONNECTION_ERROR',
            'paradex',
            error
          )
        );
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    this.isConnected = false;
    this.subscriptions.clear();
    this.messageQueue.clear();
  }

  /**
   * Watch order book updates for a symbol
   *
   * @param symbol - Trading symbol in CCXT format (e.g., "BTC/USD:USD")
   * @param depth - Order book depth (default: 50)
   * @returns AsyncGenerator yielding OrderBook updates
   */
  async *watchOrderBook(symbol: string, depth: number = 50): AsyncGenerator<OrderBook> {
    const market = this.normalizer.symbolFromCCXT(symbol);
    const channel = `orderbook.${market}`;

    const queue: any[] = [];
    let error: Error | null = null;
    let resolver: ((value: any) => void) | null = null;

    const callback = (data: any) => {
      if (resolver) {
        resolver(data);
        resolver = null;
      } else {
        this.boundedPush(queue, data, 'orderbook');
      }
    };

    try {
      // Subscribe
      await this.subscribe(channel, { market, depth }, callback);

      // Yield order books as they arrive
      while (true) {
        if (error) throw error;

        let data: any;

        if (queue.length > 0) {
          data = queue.shift()!;
        } else {
          data = await new Promise<any>((resolve) => {
            resolver = resolve;
          });
        }

        if (error) throw error;

        const normalized = this.normalizer.normalizeOrderBook({
          market: data.market || market,
          bids: data.bids || [],
          asks: data.asks || [],
          timestamp: data.timestamp || Date.now(),
          sequence: data.sequence || 0,
        });

        yield normalized;
      }
    } finally {
      this.unsubscribe(channel, callback);
    }
  }

  /**
   * Watch public trades for a symbol
   *
   * @param symbol - Trading symbol in CCXT format
   * @returns AsyncGenerator yielding Trade updates
   */
  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    const market = this.normalizer.symbolFromCCXT(symbol);
    const channel = `trades.${market}`;

    const queue: any[] = [];
    let error: Error | null = null;
    let resolver: ((value: any) => void) | null = null;

    const callback = (data: any) => {
      // Handle both single trade and array of trades
      const trades = Array.isArray(data) ? data : [data];
      for (const trade of trades) {
        if (resolver) {
          resolver(trade);
          resolver = null;
        } else {
          this.boundedPush(queue, trade, 'trades');
        }
      }
    };

    try {
      await this.subscribe(channel, { market }, callback);

      while (true) {
        if (error) throw error;

        let data: any;

        if (queue.length > 0) {
          data = queue.shift()!;
        } else {
          data = await new Promise<any>((resolve) => {
            resolver = resolve;
          });
        }

        if (error) throw error;

        const normalized = this.normalizer.normalizeTrade({
          id: data.id || data.trade_id || String(Date.now()),
          market: data.market || market,
          price: data.price,
          size: data.size || data.amount,
          side: data.side,
          timestamp: data.timestamp || Date.now(),
        });

        yield normalized;
      }
    } finally {
      this.unsubscribe(channel, callback);
    }
  }

  /**
   * Watch ticker for a symbol
   *
   * @param symbol - Trading symbol in CCXT format
   * @returns AsyncGenerator yielding Ticker updates
   */
  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    const market = this.normalizer.symbolFromCCXT(symbol);
    const channel = `ticker.${market}`;

    const queue: any[] = [];
    let error: Error | null = null;
    let resolver: ((value: any) => void) | null = null;

    const callback = (data: any) => {
      if (resolver) {
        resolver(data);
        resolver = null;
      } else {
        this.boundedPush(queue, data, 'ticker');
      }
    };

    try {
      await this.subscribe(channel, { market }, callback);

      while (true) {
        if (error) throw error;

        let data: any;

        if (queue.length > 0) {
          data = queue.shift()!;
        } else {
          data = await new Promise<any>((resolve) => {
            resolver = resolve;
          });
        }

        if (error) throw error;

        const normalized = this.normalizer.normalizeTicker({
          market: data.market || market,
          last_price: data.last_price || data.last,
          bid: data.bid || data.best_bid,
          ask: data.ask || data.best_ask,
          high_24h: data.high_24h || data.high,
          low_24h: data.low_24h || data.low,
          volume_24h: data.volume_24h || data.volume,
          price_change_24h: data.price_change_24h || '0',
          price_change_percent_24h: data.price_change_percent_24h || '0',
          timestamp: data.timestamp || Date.now(),
        });

        yield normalized;
      }
    } finally {
      this.unsubscribe(channel, callback);
    }
  }

  /**
   * Watch position updates for user account
   *
   * @param symbol - Optional symbol filter
   * @returns AsyncGenerator yielding Position updates
   */
  async *watchPositions(symbol?: string): AsyncGenerator<Position> {
    const channel = symbol ? `positions.${this.normalizer.symbolFromCCXT(symbol)}` : 'positions';

    const queue: any[] = [];
    let error: Error | null = null;
    let resolver: ((value: any) => void) | null = null;

    const callback = (data: any) => {
      // Handle both single position and array
      const positions = Array.isArray(data) ? data : [data];
      for (const pos of positions) {
        if (resolver) {
          resolver(pos);
          resolver = null;
        } else {
          this.boundedPush(queue, pos, 'positions');
        }
      }
    };

    try {
      await this.subscribe(channel, symbol ? { market: this.normalizer.symbolFromCCXT(symbol) } : {}, callback);

      while (true) {
        if (error) throw error;

        let data: any;

        if (queue.length > 0) {
          data = queue.shift()!;
        } else {
          data = await new Promise<any>((resolve) => {
            resolver = resolve;
          });
        }

        if (error) throw error;

        const normalized = this.normalizer.normalizePosition({
          market: data.market,
          side: data.side,
          size: data.size,
          entry_price: data.entry_price || data.entryPrice,
          mark_price: data.mark_price || data.markPrice,
          liquidation_price: data.liquidation_price || data.liquidationPrice,
          unrealized_pnl: data.unrealized_pnl || data.unrealizedPnl || '0',
          realized_pnl: data.realized_pnl || data.realizedPnl || '0',
          margin: data.margin || '0',
          leverage: data.leverage || '1',
          last_updated: data.last_updated || data.timestamp || Date.now(),
        });

        yield normalized;
      }
    } finally {
      this.unsubscribe(channel, callback);
    }
  }

  /**
   * Watch order updates for user account
   *
   * @param symbol - Optional symbol filter
   * @returns AsyncGenerator yielding Order updates
   */
  async *watchOrders(symbol?: string): AsyncGenerator<Order> {
    const channel = symbol ? `orders.${this.normalizer.symbolFromCCXT(symbol)}` : 'orders';

    const queue: any[] = [];
    let error: Error | null = null;
    let resolver: ((value: any) => void) | null = null;

    const callback = (data: any) => {
      const orders = Array.isArray(data) ? data : [data];
      for (const order of orders) {
        if (resolver) {
          resolver(order);
          resolver = null;
        } else {
          this.boundedPush(queue, order, 'orders');
        }
      }
    };

    try {
      await this.subscribe(channel, symbol ? { market: this.normalizer.symbolFromCCXT(symbol) } : {}, callback);

      while (true) {
        if (error) throw error;

        let data: any;

        if (queue.length > 0) {
          data = queue.shift()!;
        } else {
          data = await new Promise<any>((resolve) => {
            resolver = resolve;
          });
        }

        if (error) throw error;

        const normalized = this.normalizer.normalizeOrder({
          id: data.id || data.order_id,
          client_id: data.client_id || data.clientOrderId,
          market: data.market,
          type: data.type,
          side: data.side,
          size: data.size || data.amount,
          price: data.price,
          filled_size: data.filled_size || data.filled || '0',
          avg_fill_price: data.avg_fill_price || data.averagePrice,
          status: data.status,
          time_in_force: data.time_in_force || data.timeInForce || 'GTC',
          post_only: data.post_only || false,
          reduce_only: data.reduce_only || false,
          created_at: data.created_at || data.timestamp || Date.now(),
          updated_at: data.updated_at || data.timestamp || Date.now(),
        });

        yield normalized;
      }
    } finally {
      this.unsubscribe(channel, callback);
    }
  }

  /**
   * Watch balance updates
   *
   * @returns AsyncGenerator yielding Balance array
   */
  async *watchBalance(): AsyncGenerator<Balance[]> {
    const channel = 'balances';

    const queue: any[] = [];
    let error: Error | null = null;
    let resolver: ((value: any) => void) | null = null;

    const callback = (data: any) => {
      if (resolver) {
        resolver(data);
        resolver = null;
      } else {
        this.boundedPush(queue, data, 'balance');
      }
    };

    try {
      await this.subscribe(channel, {}, callback);

      while (true) {
        if (error) throw error;

        let data: any;

        if (queue.length > 0) {
          data = queue.shift()!;
        } else {
          data = await new Promise<any>((resolve) => {
            resolver = resolve;
          });
        }

        if (error) throw error;

        const balances = Array.isArray(data) ? data : [data];

        const normalized = balances.map((bal) =>
          this.normalizer.normalizeBalance({
            asset: bal.asset || bal.currency,
            total: bal.total || bal.balance || '0',
            available: bal.available || bal.free || '0',
            locked: bal.locked || bal.used || '0',
          })
        );

        yield normalized;
      }
    } finally {
      this.unsubscribe(channel, callback);
    }
  }

  /**
   * Watch user trades (fills) in real-time
   *
   * @param symbol - Optional symbol filter
   * @returns AsyncGenerator yielding Trade updates
   */
  async *watchMyTrades(symbol?: string): AsyncGenerator<Trade> {
    const channel = symbol ? `fills.${this.normalizer.symbolFromCCXT(symbol)}` : 'fills';

    const queue: any[] = [];
    let error: Error | null = null;
    let resolver: ((value: any) => void) | null = null;

    const callback = (data: any) => {
      const fills = Array.isArray(data) ? data : [data];
      for (const fill of fills) {
        if (resolver) {
          resolver(fill);
          resolver = null;
        } else {
          this.boundedPush(queue, fill, 'fills');
        }
      }
    };

    try {
      await this.subscribe(channel, symbol ? { market: this.normalizer.symbolFromCCXT(symbol) } : {}, callback);

      while (true) {
        if (error) throw error;

        let data: any;

        if (queue.length > 0) {
          data = queue.shift()!;
        } else {
          data = await new Promise<any>((resolve) => {
            resolver = resolve;
          });
        }

        if (error) throw error;

        // Normalize fill to trade
        const trade = this.normalizer.normalizeTrade({
          id: data.id || data.fill_id || String(Date.now()),
          market: data.market,
          side: data.side,
          price: data.price,
          size: data.size || data.amount,
          timestamp: data.timestamp || data.created_at || Date.now(),
        });

        yield trade;
      }
    } finally {
      this.unsubscribe(channel, callback);
    }
  }

  /**
   * Subscribe to a channel
   */
  private async subscribe(
    channel: string,
    params: any,
    callback: (data: any) => void
  ): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    // Add callback to subscribers
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(callback);

    // Send subscription request
    const request: SubscriptionRequest = {
      method: 'subscribe',
      params: {
        channel,
        ...params,
      },
      id: ++this.subscriptionId,
    };

    this.ws!.send(JSON.stringify(request));
  }

  /**
   * Unsubscribe from a channel
   */
  private unsubscribe(channel: string, callback: (data: any) => void): void {
    const subscribers = this.subscriptions.get(channel);
    if (subscribers) {
      subscribers.delete(callback);

      // If no more subscribers, unsubscribe from channel
      if (subscribers.size === 0) {
        this.subscriptions.delete(channel);

        if (this.ws && this.isConnected) {
          this.ws.send(
            JSON.stringify({
              method: 'unsubscribe',
              params: { channel },
              id: ++this.subscriptionId,
            })
          );
        }
      }
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(rawData: string): void {
    try {
      const message: WSMessage = JSON.parse(rawData);

      // Handle errors
      if (message.error) {
        this.logger.error('WebSocket error', undefined, { error: message.error });
        return;
      }

      // Handle subscription confirmations
      if (message.type === 'subscribed') {
        return;
      }

      // Dispatch to subscribers
      if (message.channel && message.data) {
        const subscribers = this.subscriptions.get(message.channel);
        if (subscribers) {
          subscribers.forEach((callback) => callback(message.data));
        }
      }
    } catch (error) {
      this.logger.error('Failed to parse message', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Handle disconnection and attempt reconnect
   */
  private async handleDisconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      await this.connect();

      // Resubscribe to all channels
      for (const [channel] of this.subscriptions) {
        // Extract params from channel name (simplified)
        const params: any = {};
        this.ws!.send(
          JSON.stringify({
            method: 'subscribe',
            params: { channel, ...params },
            id: ++this.subscriptionId,
          })
        );
      }
    } catch (error) {
      this.logger.error('Reconnect failed', error instanceof Error ? error : undefined);
      this.handleDisconnect(); // Retry
    }
  }

  /**
   * Check if WebSocket is connected
   */
  get connected(): boolean {
    return this.isConnected;
  }
}

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

import { WS, EStream } from '@grvt/client/ws';
import type {
  IWSBookRequest,
  IWSTradeRequest,
  IWSTdgPositionRequest,
  IWSTdgOrderRequest,
} from '@grvt/client/ws/interfaces';
import type {
  IOrderbookLevels,
  ITrade,
  IPositions,
  IOrder,
} from '@grvt/client/interfaces';
import type { OrderBook, Trade, Position, Order } from '../../types/common.js';
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
  private readonly ws: WS;
  private readonly normalizer: GRVTNormalizer;
  private readonly subAccountId?: string;
  private isConnected = false;

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

    // Subscribe to order book stream
    const request: IWSBookRequest = {
      stream: EStream.RPI_BOOK_SNAP, // Use RPI (Retail Price Improvement) snapshot stream
      params: {
        instrument,
        depth,
      },
      onData: (data) => {
        queue.push(data);
      },
      onError: (err) => {
        error = err;
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

        // Wait for data
        if (queue.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          continue;
        }

        // Process queued updates
        const orderBookData = queue.shift()!;
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

    const request: IWSTradeRequest = {
      stream: EStream.TRADE,
      params: {
        instrument,
      },
      onData: (data) => {
        queue.push(data);
      },
      onError: (err) => {
        error = err;
      },
    };

    try {
      subscriptionKey = this.ws.subscribe(request);

      while (true) {
        if (error) throw error;

        if (queue.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          continue;
        }

        const tradeData = queue.shift()!;
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

    const request: IWSTdgPositionRequest = {
      stream: EStream.POSITION,
      params: {
        sub_account_id: this.subAccountId,
        ...(instrument && { instrument }),
      },
      onData: (data) => {
        queue.push(data);
      },
      onError: (err) => {
        error = err;
      },
    };

    try {
      subscriptionKey = this.ws.subscribe(request);

      while (true) {
        if (error) throw error;

        if (queue.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          continue;
        }

        const positionData = queue.shift()!;
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

    const request: IWSTdgOrderRequest = {
      stream: EStream.ORDER,
      params: {
        sub_account_id: this.subAccountId,
        ...(instrument && { instrument }),
      },
      onData: (data) => {
        queue.push(data);
      },
      onError: (err) => {
        error = err;
      },
    };

    try {
      subscriptionKey = this.ws.subscribe(request);

      while (true) {
        if (error) throw error;

        if (queue.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          continue;
        }

        const orderData = queue.shift()!;
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
   * Check if WebSocket is connected
   */
  get connected(): boolean {
    return this.isConnected;
  }
}

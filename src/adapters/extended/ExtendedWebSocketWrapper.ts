/**
 * Extended WebSocket Wrapper
 *
 * WebSocket client for Extended exchange real-time data streaming
 * Implements AsyncGenerator-based streaming for all watch* methods
 */

import type {
  OrderBook,
  Trade,
  Ticker,
  Position,
  Order,
  Balance,
  FundingRate,
} from '../../types/common.js';
import type {
  ExtendedWsOrderBookUpdate,
  ExtendedWsTradeUpdate,
  ExtendedWsTickerUpdate,
  ExtendedWsPositionUpdate,
  ExtendedWsOrderUpdate,
  ExtendedWsBalanceUpdate,
  ExtendedWsFundingRateUpdate,
  ExtendedWsSubscription,
  ExtendedWsAuth,
  ExtendedWsMessage,
} from './types.js';
import { ExtendedNormalizer } from './ExtendedNormalizer.js';
import { EXTENDED_WS_CONFIG, EXTENDED_WS_CHANNELS } from './constants.js';
import { Logger } from '../../core/logger.js';

export interface ExtendedWebSocketConfig {
  wsUrl: string;
  apiKey?: string;
  reconnect?: boolean;
  pingInterval?: number;
  maxReconnectAttempts?: number;
}

type MessageHandler = (data: ExtendedWsMessage) => void;

/**
 * WebSocket wrapper for Extended exchange
 * Provides AsyncGenerator-based streaming for real-time data
 */
export class ExtendedWebSocketWrapper {
  private ws?: WebSocket;
  private readonly wsUrl: string;
  private readonly apiKey?: string;
  private readonly normalizer: ExtendedNormalizer;
  private readonly logger: Logger;

  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number;
  private readonly reconnect: boolean;

  private pingInterval?: ReturnType<typeof setInterval>;
  private readonly pingIntervalMs: number;
  private pongTimeout?: ReturnType<typeof setTimeout>;

  private readonly subscriptions: Map<string, Set<MessageHandler>> = new Map();
  private readonly messageQueue: ExtendedWsMessage[] = [];
  private connectionPromise?: Promise<void>;
  private connectionResolver?: () => void;

  constructor(config: ExtendedWebSocketConfig) {
    this.wsUrl = config.wsUrl;
    this.apiKey = config.apiKey;
    this.normalizer = new ExtendedNormalizer();
    this.logger = new Logger('ExtendedWebSocketWrapper');
    this.reconnect = config.reconnect ?? true;
    this.pingIntervalMs = config.pingInterval ?? EXTENDED_WS_CONFIG.pingInterval;
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? EXTENDED_WS_CONFIG.reconnectAttempts;
  }

  /**
   * Connect to WebSocket
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise<void>((resolve, reject) => {
      this.connectionResolver = resolve;

      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.logger.info('WebSocket connected');
          this.startHeartbeat();

          // Authenticate if API key provided
          if (this.apiKey) {
            this.authenticate();
          }

          // Resubscribe to existing channels
          this.resubscribeAll();

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          this.logger.error('WebSocket error', error instanceof Error ? error : new Error('WebSocket error'));
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('WebSocket connection failed'));
          }
        };

        this.ws.onclose = (event) => {
          this.isConnected = false;
          this.isConnecting = false;
          this.stopHeartbeat();
          this.logger.info('WebSocket closed', { code: event.code, reason: event.reason });

          if (this.reconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.reconnect && (this.reconnectAttempts = this.maxReconnectAttempts); // Prevent reconnection
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = undefined;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.subscriptions.clear();
    this.logger.info('WebSocket disconnected');
  }

  /**
   * Watch order book updates
   */
  async *watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook> {
    const channel = this.getChannelKey(EXTENDED_WS_CHANNELS.ORDERBOOK, symbol);
    const exchangeSymbol = this.normalizer.symbolFromCCXT(symbol);

    await this.subscribe(EXTENDED_WS_CHANNELS.ORDERBOOK, exchangeSymbol);

    try {
      for await (const message of this.createMessageIterator<ExtendedWsOrderBookUpdate>(channel)) {
        if (message.channel === 'orderbook' && message.symbol === exchangeSymbol) {
          const orderbook: OrderBook = {
            exchange: 'extended',
            symbol: this.normalizer.symbolToCCXT(message.symbol),
            bids: message.bids.slice(0, limit).map(([price, amount]) => [
              parseFloat(price),
              parseFloat(amount),
            ]),
            asks: message.asks.slice(0, limit).map(([price, amount]) => [
              parseFloat(price),
              parseFloat(amount),
            ]),
            timestamp: message.timestamp,
            sequenceId: message.sequence,
            checksum: message.checksum,
          };
          yield orderbook;
        }
      }
    } finally {
      await this.unsubscribe(EXTENDED_WS_CHANNELS.ORDERBOOK, exchangeSymbol);
    }
  }

  /**
   * Watch trade updates
   */
  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    const channel = this.getChannelKey(EXTENDED_WS_CHANNELS.TRADES, symbol);
    const exchangeSymbol = this.normalizer.symbolFromCCXT(symbol);

    await this.subscribe(EXTENDED_WS_CHANNELS.TRADES, exchangeSymbol);

    try {
      for await (const message of this.createMessageIterator<ExtendedWsTradeUpdate>(channel)) {
        if (message.channel === 'trades' && message.symbol === exchangeSymbol) {
          const price = parseFloat(message.price);
          const amount = parseFloat(message.quantity);
          const trade: Trade = {
            id: message.id,
            symbol: this.normalizer.symbolToCCXT(message.symbol),
            side: message.side,
            price,
            amount,
            cost: price * amount,
            timestamp: message.timestamp,
          };
          yield trade;
        }
      }
    } finally {
      await this.unsubscribe(EXTENDED_WS_CHANNELS.TRADES, exchangeSymbol);
    }
  }

  /**
   * Watch ticker updates
   */
  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    const channel = this.getChannelKey(EXTENDED_WS_CHANNELS.TICKER, symbol);
    const exchangeSymbol = this.normalizer.symbolFromCCXT(symbol);

    await this.subscribe(EXTENDED_WS_CHANNELS.TICKER, exchangeSymbol);

    try {
      for await (const message of this.createMessageIterator<ExtendedWsTickerUpdate>(channel)) {
        if (message.channel === 'ticker' && message.symbol === exchangeSymbol) {
          const lastPrice = parseFloat(message.lastPrice);
          const ticker: Ticker = {
            symbol: this.normalizer.symbolToCCXT(message.symbol),
            timestamp: message.timestamp,
            high: parseFloat(message.high24h),
            low: parseFloat(message.low24h),
            bid: parseFloat(message.bidPrice),
            ask: parseFloat(message.askPrice),
            last: lastPrice,
            open: lastPrice, // WebSocket may not provide open price
            close: lastPrice,
            baseVolume: parseFloat(message.volume24h),
            quoteVolume: parseFloat(message.quoteVolume24h),
            change: parseFloat(message.priceChange24h),
            percentage: parseFloat(message.priceChangePercent24h),
          };
          yield ticker;
        }
      }
    } finally {
      await this.unsubscribe(EXTENDED_WS_CHANNELS.TICKER, exchangeSymbol);
    }
  }

  /**
   * Watch position updates (requires authentication)
   */
  async *watchPositions(): AsyncGenerator<Position[]> {
    if (!this.apiKey) {
      throw new Error('API key required for watching positions');
    }

    const channel = EXTENDED_WS_CHANNELS.POSITIONS;
    await this.subscribe(channel);

    try {
      for await (const message of this.createMessageIterator<ExtendedWsPositionUpdate>(channel)) {
        if (message.channel === 'positions') {
          const positions: Position[] = message.positions.map((pos) =>
            this.normalizer.normalizePosition(pos)
          );
          yield positions;
        }
      }
    } finally {
      await this.unsubscribe(channel);
    }
  }

  /**
   * Watch order updates (requires authentication)
   */
  async *watchOrders(): AsyncGenerator<Order[]> {
    if (!this.apiKey) {
      throw new Error('API key required for watching orders');
    }

    const channel = EXTENDED_WS_CHANNELS.ORDERS;
    await this.subscribe(channel);

    try {
      for await (const message of this.createMessageIterator<ExtendedWsOrderUpdate>(channel)) {
        if (message.channel === 'orders') {
          const orders: Order[] = message.orders.map((ord) =>
            this.normalizer.normalizeOrder(ord)
          );
          yield orders;
        }
      }
    } finally {
      await this.unsubscribe(channel);
    }
  }

  /**
   * Watch balance updates (requires authentication)
   */
  async *watchBalance(): AsyncGenerator<Balance[]> {
    if (!this.apiKey) {
      throw new Error('API key required for watching balance');
    }

    const channel = EXTENDED_WS_CHANNELS.BALANCE;
    await this.subscribe(channel);

    try {
      for await (const message of this.createMessageIterator<ExtendedWsBalanceUpdate>(channel)) {
        if (message.channel === 'balance') {
          const balances: Balance[] = message.balances.map((bal) =>
            this.normalizer.normalizeBalance(bal)
          );
          yield balances;
        }
      }
    } finally {
      await this.unsubscribe(channel);
    }
  }

  /**
   * Watch funding rate updates
   */
  async *watchFundingRate(symbol: string): AsyncGenerator<FundingRate> {
    const channel = this.getChannelKey(EXTENDED_WS_CHANNELS.FUNDING, symbol);
    const exchangeSymbol = this.normalizer.symbolFromCCXT(symbol);

    await this.subscribe(EXTENDED_WS_CHANNELS.FUNDING, exchangeSymbol);

    try {
      for await (const message of this.createMessageIterator<ExtendedWsFundingRateUpdate>(channel)) {
        if (message.channel === 'funding' && message.symbol === exchangeSymbol) {
          const fundingRate: FundingRate = {
            symbol: this.normalizer.symbolToCCXT(message.symbol),
            fundingRate: parseFloat(message.fundingRate),
            fundingTimestamp: message.fundingTime,
            nextFundingTimestamp: message.nextFundingTime || 0,
            markPrice: parseFloat(message.markPrice),
            indexPrice: parseFloat(message.indexPrice),
            fundingIntervalHours: 8,
          };
          yield fundingRate;
        }
      }
    } finally {
      await this.unsubscribe(EXTENDED_WS_CHANNELS.FUNDING, exchangeSymbol);
    }
  }

  // ==================== Private Methods ====================

  /**
   * Subscribe to a channel
   */
  private async subscribe(channel: string, symbol?: string): Promise<void> {
    await this.ensureConnected();

    const channelKey = this.getChannelKey(channel, symbol);

    if (!this.subscriptions.has(channelKey)) {
      this.subscriptions.set(channelKey, new Set());
    }

    const message: ExtendedWsSubscription = {
      action: 'subscribe',
      channel,
      symbol,
    };

    this.send(message);
    this.logger.debug('Subscribed to channel', { channel, symbol });
  }

  /**
   * Unsubscribe from a channel
   */
  private async unsubscribe(channel: string, symbol?: string): Promise<void> {
    const channelKey = this.getChannelKey(channel, symbol);

    if (this.subscriptions.has(channelKey)) {
      this.subscriptions.delete(channelKey);

      if (this.isConnected) {
        const message: ExtendedWsSubscription = {
          action: 'unsubscribe',
          channel,
          symbol,
        };
        this.send(message);
      }

      this.logger.debug('Unsubscribed from channel', { channel, symbol });
    }
  }

  /**
   * Authenticate the WebSocket connection
   */
  private authenticate(): void {
    if (!this.apiKey) return;

    const authMessage: ExtendedWsAuth = {
      action: 'auth',
      apiKey: this.apiKey,
      timestamp: Date.now(),
    };

    this.send(authMessage);
    this.logger.debug('Sent authentication message');
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // Handle pong response
      if (message.type === 'pong' || message.event === 'pong') {
        this.handlePong();
        return;
      }

      // Handle subscription confirmations
      if (message.event === 'subscribed' || message.event === 'unsubscribed') {
        this.logger.debug('Subscription event', { event: message.event, channel: message.channel });
        return;
      }

      // Handle authentication response
      if (message.event === 'authenticated') {
        this.logger.info('WebSocket authenticated');
        return;
      }

      // Handle error messages
      if (message.error || message.event === 'error') {
        this.logger.error('WebSocket error message', new Error(message.error || message.message));
        return;
      }

      // Dispatch to subscribers
      const channel = message.channel;
      const symbol = message.symbol;
      const channelKey = this.getChannelKey(channel, symbol);

      const handlers = this.subscriptions.get(channelKey);
      if (handlers) {
        handlers.forEach((handler) => handler(message as ExtendedWsMessage));
      }
    } catch (error) {
      this.logger.error('Failed to parse WebSocket message', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Create an async iterator for messages on a channel
   */
  private async *createMessageIterator<T extends ExtendedWsMessage>(
    channelKey: string
  ): AsyncGenerator<T> {
    const messageQueue: T[] = [];
    let resolver: ((value: T) => void) | null = null;
    let isActive = true;

    const handler = (message: ExtendedWsMessage) => {
      if (resolver) {
        resolver(message as T);
        resolver = null;
      } else {
        messageQueue.push(message as T);
      }
    };

    // Register handler
    const handlers = this.subscriptions.get(channelKey);
    if (handlers) {
      handlers.add(handler);
    }

    try {
      while (isActive && this.subscriptions.has(channelKey)) {
        if (messageQueue.length > 0) {
          yield messageQueue.shift()!;
        } else {
          yield await new Promise<T>((resolve) => {
            resolver = resolve;
          });
        }
      }
    } finally {
      isActive = false;
      if (handlers) {
        handlers.delete(handler);
      }
    }
  }

  /**
   * Ensure WebSocket is connected
   */
  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  /**
   * Send a message through WebSocket
   */
  private send(message: object): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Get channel key for subscription tracking
   */
  private getChannelKey(channel: string, symbol?: string): string {
    return symbol ? `${channel}:${symbol}` : channel;
  }

  /**
   * Start heartbeat ping/pong
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping', timestamp: Date.now() });

        // Set pong timeout
        this.pongTimeout = setTimeout(() => {
          this.logger.warn('Pong timeout, reconnecting...');
          this.ws?.close(4000, 'Pong timeout');
        }, EXTENDED_WS_CONFIG.pongTimeout);
      }
    }, this.pingIntervalMs);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = undefined;
    }
  }

  /**
   * Handle pong response
   */
  private handlePong(): void {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = undefined;
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(
      EXTENDED_WS_CONFIG.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      EXTENDED_WS_CONFIG.maxReconnectDelay
    );

    this.logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        this.logger.error('Reconnection failed', error instanceof Error ? error : new Error(String(error)));
      });
    }, delay);
  }

  /**
   * Resubscribe to all channels after reconnection
   */
  private resubscribeAll(): void {
    for (const channelKey of this.subscriptions.keys()) {
      const parts = channelKey.split(':');
      const channel = parts[0] ?? '';
      const symbol = parts[1];
      if (channel) {
        const message: ExtendedWsSubscription = {
          action: 'subscribe',
          channel,
          symbol: symbol || undefined,
        };
        this.send(message);
      }
    }
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected;
  }
}

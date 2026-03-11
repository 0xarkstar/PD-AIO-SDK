/**
 * Aster WebSocket Handler
 *
 * Manages WebSocket subscriptions and real-time data streaming
 * for the Aster DEX exchange adapter.
 *
 * Aster uses Binance Futures-compatible WebSocket protocol:
 * - Combined streams: wss://fstream.asterdex.com/stream?streams=<s1>/<s2>
 * - Subscribe: {"method":"SUBSCRIBE","params":["btcusdt@aggTrade"],"id":1}
 * - Unsubscribe: {"method":"UNSUBSCRIBE","params":["btcusdt@aggTrade"],"id":1}
 */

import { EventEmitter } from 'events';
import type { OrderBook, Ticker, Trade } from '../../types/index.js';
import { WebSocketClient } from '../../websocket/WebSocketClient.js';
import type { AsterNormalizer } from './AsterNormalizer.js';
import type { AsterAuth } from './AsterAuth.js';

/** Maximum queue size per channel for backpressure */
const MAX_QUEUE_SIZE = 1000;

/** Aster WS channel templates */
const ASTER_WS_CHANNELS = {
  DEPTH: (symbol: string, levels: number = 20) => `${symbol}@depth${levels}@100ms`,
  AGG_TRADE: (symbol: string) => `${symbol}@aggTrade`,
  TICKER: (symbol: string) => `${symbol}@ticker`,
} as const;

/** Raw Aster WS depth update message */
interface AsterWsDepthUpdate {
  readonly e: 'depthUpdate';
  readonly s: string;
  readonly b: ReadonlyArray<readonly [string, string]>;
  readonly a: ReadonlyArray<readonly [string, string]>;
  readonly T: number;
  readonly E: number;
}

/** Raw Aster WS aggregated trade message */
interface AsterWsAggTrade {
  readonly e: 'aggTrade';
  readonly s: string;
  readonly p: string;
  readonly q: string;
  readonly m: boolean;
  readonly T: number;
  readonly a: number;
  readonly E: number;
}

/** Raw Aster WS 24hr ticker message */
interface AsterWsTicker {
  readonly e: '24hrTicker';
  readonly s: string;
  readonly c: string;
  readonly o: string;
  readonly h: string;
  readonly l: string;
  readonly v: string;
  readonly q: string;
  readonly p: string;
  readonly P: string;
  readonly E: number;
}

/** Binance-style combined stream wrapper */
interface AsterCombinedStreamMessage {
  readonly stream: string;
  readonly data: unknown;
}

export interface AsterWebSocketDeps {
  readonly wsUrl: string;
  readonly normalizer: AsterNormalizer;
  readonly auth?: AsterAuth;
  readonly symbolToExchange: (symbol: string) => string;
}

interface ChannelSubscription {
  readonly channel: string;
  handler: (data: unknown) => void;
  active: boolean;
}

/**
 * WebSocket streaming handler for Aster
 *
 * Uses Binance Futures-compatible combined stream protocol.
 * Provides async generators for real-time market data.
 */
export class AsterWebSocket extends EventEmitter {
  private readonly wsUrl: string;
  private readonly symbolToExchange: (symbol: string) => string;
  private client: WebSocketClient | null = null;
  private readonly subscriptions = new Map<string, ChannelSubscription>();
  private subscribeIdCounter = 1;

  constructor(deps: AsterWebSocketDeps) {
    super();
    this.setMaxListeners(100);
    this.wsUrl = deps.wsUrl;
    this.symbolToExchange = deps.symbolToExchange;
  }

  /**
   * Connect to the Aster combined stream WebSocket endpoint
   */
  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    // Use the combined stream endpoint for multiplexing
    const url = `${this.wsUrl}/stream`;

    this.client = new WebSocketClient({
      url,
      reconnect: {
        enabled: true,
        maxAttempts: 10,
        initialDelay: 500,
        maxDelay: 30000,
        multiplier: 2,
        jitter: 0.1,
      },
      heartbeat: {
        enabled: false, // Aster/Binance handles ping/pong at protocol level
        interval: 30000,
        timeout: 5000,
      },
      onMessage: (data) => this.handleMessage(data),
      onError: (error) => this.emit('error', error),
    });

    this.client.on('reconnected', () => {
      void this.resubscribeAll();
    });

    await this.client.connect();
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    this.subscriptions.clear();
    await this.client.disconnect();
    this.client = null;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client?.isConnected() ?? false;
  }

  /**
   * Watch order book updates in real-time
   *
   * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
   * @param limit - Depth levels (default: 20)
   */
  async *watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook> {
    const exchangeSymbol = this.symbolToExchange(symbol).toLowerCase();
    const levels = limit ?? 20;
    const channel = ASTER_WS_CHANNELS.DEPTH(exchangeSymbol, levels);

    for await (const data of this.watch<AsterWsDepthUpdate>(channel)) {
      yield this.normalizeDepthUpdate(data, symbol);
    }
  }

  /**
   * Watch trades in real-time
   *
   * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
   */
  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    const exchangeSymbol = this.symbolToExchange(symbol).toLowerCase();
    const channel = ASTER_WS_CHANNELS.AGG_TRADE(exchangeSymbol);

    for await (const data of this.watch<AsterWsAggTrade>(channel)) {
      yield this.normalizeAggTrade(data, symbol);
    }
  }

  /**
   * Watch ticker updates in real-time
   *
   * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
   */
  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    const exchangeSymbol = this.symbolToExchange(symbol).toLowerCase();
    const channel = ASTER_WS_CHANNELS.TICKER(exchangeSymbol);

    for await (const data of this.watch<AsterWsTicker>(channel)) {
      yield this.normalizeWsTicker(data, symbol);
    }
  }

  // ===========================================================================
  // Internal subscription management
  // ===========================================================================

  /**
   * Core watch method - subscribes to a channel and yields messages
   *
   * Uses the Binance combined stream protocol for message routing.
   * The combined stream wraps each message with {"stream":"<name>","data":{...}}.
   */
  private async *watch<T>(channel: string): AsyncGenerator<T> {
    const messageQueue: T[] = [];
    let resolveNext: ((value: T) => void) | null = null;

    const subscription: ChannelSubscription = {
      channel,
      handler: (data: unknown) => {
        const typedData = data as T;
        if (resolveNext) {
          resolveNext(typedData);
          resolveNext = null;
        } else {
          if (messageQueue.length >= MAX_QUEUE_SIZE) {
            messageQueue.shift();
          }
          messageQueue.push(typedData);
        }
      },
      active: true,
    };

    this.subscriptions.set(channel, subscription);

    // Send subscribe message
    this.sendSubscribe(channel);

    try {
      while (true) {
        if (messageQueue.length > 0) {
          yield messageQueue.shift()!;
        } else {
          yield await new Promise<T>((resolve) => {
            resolveNext = resolve;
          });
        }
      }
    } finally {
      // Cleanup on generator exit
      subscription.active = false;
      this.subscriptions.delete(channel);
      this.sendUnsubscribe(channel);
    }
  }

  /**
   * Send a SUBSCRIBE message for a channel
   */
  private sendSubscribe(channel: string): void {
    if (!this.client?.isConnected()) {
      return;
    }

    const id = this.subscribeIdCounter++;
    this.client.send({
      method: 'SUBSCRIBE',
      params: [channel],
      id,
    });
  }

  /**
   * Send an UNSUBSCRIBE message for a channel
   */
  private sendUnsubscribe(channel: string): void {
    if (!this.client?.isConnected()) {
      return;
    }

    const id = this.subscribeIdCounter++;
    this.client.send({
      method: 'UNSUBSCRIBE',
      params: [channel],
      id,
    });
  }

  /**
   * Handle incoming WebSocket message
   *
   * Routes messages to the correct subscription handler based on
   * the Binance combined stream format: {"stream":"<name>","data":{...}}
   */
  private handleMessage(data: unknown): void {
    try {
      const parsed = data as Record<string, unknown>;

      // Binance combined stream format
      if (parsed.stream && parsed.data) {
        const msg = parsed as unknown as AsterCombinedStreamMessage;
        const subscription = this.subscriptions.get(msg.stream);

        if (subscription?.active) {
          subscription.handler(msg.data);
        }
        return;
      }

      // Single stream format (no stream wrapper) - route by event type + symbol
      const eventType = parsed.e as string | undefined;
      const symbolField = parsed.s as string | undefined;

      if (eventType && symbolField) {
        const channelFromEvent = this.resolveChannelFromEvent(
          eventType,
          symbolField.toLowerCase()
        );

        if (channelFromEvent) {
          const subscription = this.subscriptions.get(channelFromEvent);
          if (subscription?.active) {
            subscription.handler(parsed);
          }
        }
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to handle message: ${String(error)}`));
    }
  }

  /**
   * Resolve channel name from event type and symbol
   */
  private resolveChannelFromEvent(eventType: string, symbol: string): string | undefined {
    switch (eventType) {
      case 'depthUpdate': {
        // Find matching depth channel for this symbol
        for (const channel of this.subscriptions.keys()) {
          if (channel.startsWith(`${symbol}@depth`)) {
            return channel;
          }
        }
        return undefined;
      }
      case 'aggTrade':
        return `${symbol}@aggTrade`;
      case '24hrTicker':
        return `${symbol}@ticker`;
      default:
        return undefined;
    }
  }

  /**
   * Resubscribe to all active channels after reconnection
   */
  private async resubscribeAll(): Promise<void> {
    const channels = Array.from(this.subscriptions.keys());

    if (channels.length === 0) {
      return;
    }

    // Batch subscribe to all channels at once
    const id = this.subscribeIdCounter++;
    if (this.client?.isConnected()) {
      this.client.send({
        method: 'SUBSCRIBE',
        params: channels,
        id,
      });
    }
  }

  // ===========================================================================
  // Normalization helpers
  // ===========================================================================

  /**
   * Normalize a WS depth update to unified OrderBook
   */
  private normalizeDepthUpdate(data: AsterWsDepthUpdate, symbol: string): OrderBook {
    return {
      symbol,
      timestamp: data.T ?? Date.now(),
      bids: data.b.map(([p, s]) => [parseFloat(p), parseFloat(s)] as [number, number]),
      asks: data.a.map(([p, s]) => [parseFloat(p), parseFloat(s)] as [number, number]),
      exchange: 'aster',
    };
  }

  /**
   * Normalize a WS aggTrade to unified Trade
   */
  private normalizeAggTrade(data: AsterWsAggTrade, symbol: string): Trade {
    const price = parseFloat(data.p);
    const amount = parseFloat(data.q);

    return {
      id: String(data.a),
      symbol,
      side: data.m ? 'sell' : 'buy',
      price,
      amount,
      cost: price * amount,
      timestamp: data.T,
      info: data as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize a WS 24hrTicker to unified Ticker
   */
  private normalizeWsTicker(data: AsterWsTicker, symbol: string): Ticker {
    const last = parseFloat(data.c);

    return {
      symbol,
      last,
      bid: last,
      ask: last,
      high: parseFloat(data.h),
      low: parseFloat(data.l),
      open: parseFloat(data.o),
      close: last,
      change: parseFloat(data.p),
      percentage: parseFloat(data.P),
      baseVolume: parseFloat(data.v),
      quoteVolume: parseFloat(data.q),
      timestamp: data.E,
      info: {
        ...(data as unknown as Record<string, unknown>),
        _bidAskSource: 'last_price',
      },
    };
  }
}

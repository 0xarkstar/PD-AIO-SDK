/**
 * Lighter WebSocket Handler
 *
 * Manages WebSocket subscriptions and real-time data streaming
 * for the Lighter exchange adapter.
 */

import { EventEmitter } from 'events';
import type { WebSocketManager } from '../../websocket/WebSocketManager.js';
import type { Balance, Order, OrderBook, Position, Ticker, Trade } from '../../types/common.js';
import { PerpDEXError } from '../../types/errors.js';
import { LIGHTER_WS_CHANNELS } from './constants.js';
import type { LighterNormalizer } from './LighterNormalizer.js';
import type { LighterWasmSigner } from './signer/index.js';
import type {
  LighterBalance,
  LighterOrder,
  LighterOrderBook,
  LighterPosition,
  LighterTicker,
  LighterTrade,
} from './types.js';

export interface LighterWebSocketDeps {
  wsManager: WebSocketManager;
  normalizer: LighterNormalizer;
  signer: LighterWasmSigner | null;
  apiKey?: string;
  accountIndex: number;
  apiKeyIndex: number;
  hasAuthentication: boolean;
  hasWasmSigning: boolean;
  maxReconnectAttempts?: number;
  /** symbol → integer market_id map (Lighter addresses WS markets by int id). */
  marketIdCache: Map<string, number>;
  /** Ensure the market id cache is warm (mirrors the REST path). */
  ensureMarkets?: () => Promise<void>;
}

/** Raw Lighter order_book wire frame (echoed colon-form channel). */
interface LighterRawOrderBookFrame {
  channel: string;
  /**
   * "subscribed/order_book" = full SNAPSHOT (replaces the book);
   * "update/order_book"     = DELTA (each level's `size` is the new ABSOLUTE
   *                            size at that price; `size` "0"/"0.00000" deletes).
   */
  type: string;
  timestamp?: number;
  last_updated_at?: number;
  order_book: {
    asks: Array<{ price: string; size: string }>;
    bids: Array<{ price: string; size: string }>;
  };
}

/**
 * Per-stream order-book state for Lighter.
 *
 * Lighter streams a full snapshot once ("subscribed/order_book"), then emits
 * deltas ("update/order_book") that carry only the CHANGED price levels. Each
 * delta level's `size` is the new ABSOLUTE size at that price; a `size` of zero
 * deletes the level. Without folding, raw delta frames look like tiny — and
 * frequently CROSSED — books. This mirrors {@link ExtendedOrderBookState}.
 *
 * Keys are NUMERIC prices so string representations of the same price collapse
 * to one level.
 */
class LighterOrderBookState {
  private readonly bids = new Map<number, number>();
  private readonly asks = new Map<number, number>();

  apply(frame: LighterRawOrderBookFrame): void {
    const isSnapshot = frame.type.startsWith('subscribed');
    if (isSnapshot) {
      this.bids.clear();
      this.asks.clear();
    }
    applyLevels(this.bids, frame.order_book.bids);
    applyLevels(this.asks, frame.order_book.asks);
  }

  /** Full maintained book as unified [price, size] levels: bids DESC, asks ASC. */
  sides(): { bids: Array<[number, number]>; asks: Array<[number, number]> } {
    const toLevels = (side: Map<number, number>): Array<[number, number]> =>
      Array.from(side.entries(), ([price, size]): [number, number] => [price, size]);
    return {
      bids: toLevels(this.bids).sort((a, b) => b[0] - a[0]),
      asks: toLevels(this.asks).sort((a, b) => a[0] - b[0]),
    };
  }
}

function applyLevels(
  side: Map<number, number>,
  levels: ReadonlyArray<{ price: string; size: string }>
): void {
  for (const level of levels) {
    const price = parseFloat(level.price);
    const size = parseFloat(level.size);
    if (size === 0) {
      side.delete(price);
    } else {
      side.set(price, size);
    }
  }
}

/** Raw Lighter trade wire frame (echoed colon-form channel). */
interface LighterRawTradeFrame {
  channel: string;
  type: string;
  trades?: Array<{
    trade_id: number;
    market_id: number;
    size: string;
    price: string;
    is_maker_ask: boolean;
    timestamp: number;
  }>;
}

/**
 * WebSocket streaming handler for Lighter
 *
 * Provides async generators for real-time market data and user events.
 * Extracted from LighterAdapter to improve code organization.
 */
export class LighterWebSocket extends EventEmitter {
  private readonly wsManager: WebSocketManager;
  private readonly normalizer: LighterNormalizer;
  private readonly signer: LighterWasmSigner | null;
  private readonly apiKey?: string;
  private readonly accountIndex: number;
  private readonly apiKeyIndex: number;
  private readonly _hasAuthentication: boolean;
  private readonly _hasWasmSigning: boolean;

  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number;
  private intentionalDisconnect: boolean = false;
  private readonly marketIdCache: Map<string, number>;
  private readonly ensureMarkets?: () => Promise<void>;

  constructor(deps: LighterWebSocketDeps) {
    super();
    this.wsManager = deps.wsManager;
    this.normalizer = deps.normalizer;
    this.signer = deps.signer;
    this.apiKey = deps.apiKey;
    this.accountIndex = deps.accountIndex;
    this.apiKeyIndex = deps.apiKeyIndex;
    this._hasAuthentication = deps.hasAuthentication;
    this._hasWasmSigning = deps.hasWasmSigning;
    this.maxReconnectAttempts = deps.maxReconnectAttempts ?? 10;
    this.marketIdCache = deps.marketIdCache;
    this.ensureMarkets = deps.ensureMarkets;

    this.setupReconnectHandling();
  }

  /**
   * Resolve the integer market_id for a Lighter symbol, warming the cache if cold.
   * Throws a clear error rather than hanging if the market is unknown.
   */
  private async resolveMarketId(lighterSymbol: string): Promise<number> {
    let marketId = this.marketIdCache.get(lighterSymbol);
    if (marketId === undefined && this.ensureMarkets) {
      await this.ensureMarkets();
      marketId = this.marketIdCache.get(lighterSymbol);
    }
    if (marketId === undefined) {
      throw new PerpDEXError(
        `Unknown Lighter market for symbol "${lighterSymbol}"`,
        'UNKNOWN_MARKET',
        'lighter'
      );
    }
    return marketId;
  }

  /**
   * Disconnect and prevent further reconnection attempts
   */
  disconnect(): void {
    this.intentionalDisconnect = true;
  }

  /**
   * Wire reconnect tracking to wsManager events.
   * wsManager extends EventEmitter in production; guards handle test mocks.
   */
  private setupReconnectHandling(): void {
    if (typeof this.wsManager.on !== 'function') {
      return;
    }

    this.wsManager.on('reconnected', () => {
      this.reconnectAttempts = 0;
    });

    this.wsManager.on('error', (error: Error) => {
      if (this.intentionalDisconnect) {
        return;
      }
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit(
          'websocket.reconnect_failed',
          new Error(
            `Lighter WebSocket reconnect failed after ${this.maxReconnectAttempts} attempts: ${error.message}`
          )
        );
      }
    });
  }


  /**
   * Watch order book updates in real-time
   *
   * @param symbol - Symbol in unified format (e.g., "BTC/USDC:USDC")
   * @param limit - Optional depth limit (default: 50)
   */
  async *watchOrderBook(symbol: string, _limit?: number): AsyncGenerator<OrderBook> {
    const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
    const marketId = await this.resolveMarketId(lighterSymbol);

    // WIRE subscribe uses SLASH form ("order_book/{id}"); the server echoes COLON
    // form ("order_book:{id}") which is the routing key. No `symbol` field.
    const subscription = {
      type: 'subscribe',
      channel: `${LIGHTER_WS_CHANNELS.ORDERBOOK}/${marketId}`,
    };

    const channelId = `${LIGHTER_WS_CHANNELS.ORDERBOOK}:${marketId}`;

    // Lighter streams a snapshot then deltas; fold them into a full book so each
    // yield is a complete, uncrossed book (raw delta frames are crossed/partial).
    const state = new LighterOrderBookState();

    for await (const frame of this.wsManager.watch<LighterRawOrderBookFrame>(
      channelId,
      subscription
    )) {
      state.apply(frame);
      yield this.normalizer.normalizeOrderBook(this.toLighterOrderBook(state, frame, symbol));
    }
  }

  /**
   * Build the unified LighterOrderBook shape the normalizer expects
   * ({ symbol, bids:[[px,sz]], asks:[[px,sz]], timestamp }) from the folded
   * per-stream book state.
   */
  private toLighterOrderBook(
    state: LighterOrderBookState,
    frame: LighterRawOrderBookFrame,
    symbol: string
  ): LighterOrderBook {
    const { bids, asks } = state.sides();
    return {
      symbol: this.normalizer.toLighterSymbol(symbol),
      bids,
      asks,
      timestamp: frame.timestamp ?? Date.now(),
    };
  }

  /**
   * Watch trades in real-time
   *
   * @param symbol - Symbol in unified format (e.g., "BTC/USDC:USDC")
   */
  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
    const marketId = await this.resolveMarketId(lighterSymbol);

    const subscription = {
      type: 'subscribe',
      channel: `${LIGHTER_WS_CHANNELS.TRADES}/${marketId}`,
    };

    const channelId = `${LIGHTER_WS_CHANNELS.TRADES}:${marketId}`;

    for await (const frame of this.wsManager.watch<LighterRawTradeFrame>(channelId, subscription)) {
      for (const trade of frame.trades ?? []) {
        yield this.normalizer.normalizeTrade(this.toLighterTrade(trade, symbol));
      }
    }
  }

  /**
   * Transform a raw Lighter trade into the unified LighterTrade shape the
   * normalizer expects ({ id, symbol, side, price, amount, timestamp }).
   * Lighter encodes side via is_maker_ask (maker on the ask → aggressor bought).
   */
  private toLighterTrade(
    trade: NonNullable<LighterRawTradeFrame['trades']>[number],
    symbol: string
  ): LighterTrade {
    return {
      id: String(trade.trade_id),
      symbol: this.normalizer.toLighterSymbol(symbol),
      side: trade.is_maker_ask ? 'buy' : 'sell',
      price: parseFloat(trade.price),
      amount: parseFloat(trade.size),
      timestamp: trade.timestamp,
    };
  }

  /**
   * Watch ticker updates in real-time
   *
   * @param symbol - Symbol in unified format (e.g., "BTC/USDC:USDC")
   */
  async *watchTicker(symbol: string): AsyncGenerator<Ticker> {
    const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
    const subscription = {
      type: 'subscribe',
      channel: LIGHTER_WS_CHANNELS.TICKER,
      symbol: lighterSymbol,
    };

    const channelId = `${LIGHTER_WS_CHANNELS.TICKER}:${lighterSymbol}`;

    for await (const ticker of this.wsManager.watch<LighterTicker>(channelId, subscription)) {
      yield this.normalizer.normalizeTicker(ticker);
    }
  }

  /**
   * Watch position updates in real-time
   *
   * Requires authentication.
   */
  async *watchPositions(): AsyncGenerator<Position[]> {
    if (!this._hasAuthentication) {
      throw new PerpDEXError(
        'API credentials required for position streaming',
        'AUTH_REQUIRED',
        'lighter'
      );
    }

    const subscription = await this.buildAuthenticatedSubscription(LIGHTER_WS_CHANNELS.POSITIONS);
    const channelId = `${LIGHTER_WS_CHANNELS.POSITIONS}:${this.getAuthIdentifier()}`;

    for await (const positions of this.wsManager.watch<LighterPosition[]>(
      channelId,
      subscription
    )) {
      yield positions.map((position) => this.normalizer.normalizePosition(position));
    }
  }

  /**
   * Watch open orders in real-time
   *
   * Requires authentication.
   */
  async *watchOrders(): AsyncGenerator<Order[]> {
    if (!this._hasAuthentication) {
      throw new PerpDEXError(
        'API credentials required for order streaming',
        'AUTH_REQUIRED',
        'lighter'
      );
    }

    const subscription = await this.buildAuthenticatedSubscription(LIGHTER_WS_CHANNELS.ORDERS);
    const channelId = `${LIGHTER_WS_CHANNELS.ORDERS}:${this.getAuthIdentifier()}`;

    for await (const orders of this.wsManager.watch<LighterOrder[]>(channelId, subscription)) {
      yield orders.map((order) => this.normalizer.normalizeOrder(order));
    }
  }

  /**
   * Watch balance updates in real-time
   *
   * Requires authentication.
   */
  async *watchBalance(): AsyncGenerator<Balance[]> {
    if (!this._hasAuthentication) {
      throw new PerpDEXError(
        'API credentials required for balance streaming',
        'AUTH_REQUIRED',
        'lighter'
      );
    }

    const subscription = await this.buildAuthenticatedSubscription('balance');
    const channelId = `balance:${this.getAuthIdentifier()}`;

    for await (const balances of this.wsManager.watch<LighterBalance[]>(channelId, subscription)) {
      yield balances.map((balance) => this.normalizer.normalizeBalance(balance));
    }
  }

  /**
   * Watch user trades (fills) in real-time
   *
   * Requires authentication.
   *
   * @param symbol - Optional symbol to filter trades
   */
  async *watchMyTrades(symbol?: string): AsyncGenerator<Trade> {
    if (!this._hasAuthentication) {
      throw new PerpDEXError(
        'API credentials required for trade streaming',
        'AUTH_REQUIRED',
        'lighter'
      );
    }

    const subscription = await this.buildAuthenticatedSubscription(LIGHTER_WS_CHANNELS.FILLS);

    if (symbol) {
      const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
      subscription.symbol = lighterSymbol;
    }

    const channelId = `${LIGHTER_WS_CHANNELS.FILLS}:${this.getAuthIdentifier()}`;

    for await (const trade of this.wsManager.watch<LighterTrade>(channelId, subscription)) {
      yield this.normalizer.normalizeTrade(trade);
    }
  }

  /**
   * Build authenticated subscription object for WebSocket
   */
  private async buildAuthenticatedSubscription(channel: string): Promise<Record<string, unknown>> {
    const subscription: Record<string, unknown> = {
      type: 'subscribe',
      channel,
    };

    // Use auth token for WASM mode, apiKey for HMAC mode
    if (this._hasWasmSigning && this.signer) {
      try {
        const authToken = await this.signer.createAuthToken();
        subscription.authToken = authToken;
      } catch {
        // Fall back to apiKey
        subscription.apiKey = this.apiKey;
      }
    } else if (this.apiKey) {
      subscription.apiKey = this.apiKey;
    }

    return subscription;
  }

  /**
   * Get authentication identifier for channel naming
   */
  private getAuthIdentifier(): string {
    if (this._hasWasmSigning) {
      return `account-${this.accountIndex}-${this.apiKeyIndex}`;
    }
    return this.apiKey || 'anonymous';
  }
}

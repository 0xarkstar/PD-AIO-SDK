/**
 * Lighter WebSocket Handler
 *
 * Manages WebSocket subscriptions and real-time data streaming
 * for the Lighter exchange adapter.
 */

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
}

/**
 * WebSocket streaming handler for Lighter
 *
 * Provides async generators for real-time market data and user events.
 * Extracted from LighterAdapter to improve code organization.
 */
export class LighterWebSocket {
  private readonly wsManager: WebSocketManager;
  private readonly normalizer: LighterNormalizer;
  private readonly signer: LighterWasmSigner | null;
  private readonly apiKey?: string;
  private readonly accountIndex: number;
  private readonly apiKeyIndex: number;
  private readonly _hasAuthentication: boolean;
  private readonly _hasWasmSigning: boolean;

  constructor(deps: LighterWebSocketDeps) {
    this.wsManager = deps.wsManager;
    this.normalizer = deps.normalizer;
    this.signer = deps.signer;
    this.apiKey = deps.apiKey;
    this.accountIndex = deps.accountIndex;
    this.apiKeyIndex = deps.apiKeyIndex;
    this._hasAuthentication = deps.hasAuthentication;
    this._hasWasmSigning = deps.hasWasmSigning;
  }

  /**
   * Watch order book updates in real-time
   *
   * @param symbol - Symbol in unified format (e.g., "BTC/USDC:USDC")
   * @param limit - Optional depth limit (default: 50)
   */
  async *watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook> {
    const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
    const subscription = {
      type: 'subscribe',
      channel: LIGHTER_WS_CHANNELS.ORDERBOOK,
      symbol: lighterSymbol,
      limit: limit || 50,
    };

    const channelId = `${LIGHTER_WS_CHANNELS.ORDERBOOK}:${lighterSymbol}`;

    for await (const update of this.wsManager.watch<LighterOrderBook>(channelId, subscription)) {
      yield this.normalizer.normalizeOrderBook(update);
    }
  }

  /**
   * Watch trades in real-time
   *
   * @param symbol - Symbol in unified format (e.g., "BTC/USDC:USDC")
   */
  async *watchTrades(symbol: string): AsyncGenerator<Trade> {
    const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
    const subscription = {
      type: 'subscribe',
      channel: LIGHTER_WS_CHANNELS.TRADES,
      symbol: lighterSymbol,
    };

    const channelId = `${LIGHTER_WS_CHANNELS.TRADES}:${lighterSymbol}`;

    for await (const trade of this.wsManager.watch<LighterTrade>(channelId, subscription)) {
      yield this.normalizer.normalizeTrade(trade);
    }
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
      throw new PerpDEXError('API credentials required for position streaming', 'AUTH_REQUIRED', 'lighter');
    }

    const subscription = await this.buildAuthenticatedSubscription(LIGHTER_WS_CHANNELS.POSITIONS);
    const channelId = `${LIGHTER_WS_CHANNELS.POSITIONS}:${this.getAuthIdentifier()}`;

    for await (const positions of this.wsManager.watch<LighterPosition[]>(channelId, subscription)) {
      yield positions.map(position => this.normalizer.normalizePosition(position));
    }
  }

  /**
   * Watch open orders in real-time
   *
   * Requires authentication.
   */
  async *watchOrders(): AsyncGenerator<Order[]> {
    if (!this._hasAuthentication) {
      throw new PerpDEXError('API credentials required for order streaming', 'AUTH_REQUIRED', 'lighter');
    }

    const subscription = await this.buildAuthenticatedSubscription(LIGHTER_WS_CHANNELS.ORDERS);
    const channelId = `${LIGHTER_WS_CHANNELS.ORDERS}:${this.getAuthIdentifier()}`;

    for await (const orders of this.wsManager.watch<LighterOrder[]>(channelId, subscription)) {
      yield orders.map(order => this.normalizer.normalizeOrder(order));
    }
  }

  /**
   * Watch balance updates in real-time
   *
   * Requires authentication.
   */
  async *watchBalance(): AsyncGenerator<Balance[]> {
    if (!this._hasAuthentication) {
      throw new PerpDEXError('API credentials required for balance streaming', 'AUTH_REQUIRED', 'lighter');
    }

    const subscription = await this.buildAuthenticatedSubscription('balance');
    const channelId = `balance:${this.getAuthIdentifier()}`;

    for await (const balances of this.wsManager.watch<LighterBalance[]>(channelId, subscription)) {
      yield balances.map(balance => this.normalizer.normalizeBalance(balance));
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
      throw new PerpDEXError('API credentials required for trade streaming', 'AUTH_REQUIRED', 'lighter');
    }

    const subscription = await this.buildAuthenticatedSubscription(LIGHTER_WS_CHANNELS.FILLS);

    if (symbol) {
      const lighterSymbol = this.normalizer.toLighterSymbol(symbol);
      (subscription as Record<string, unknown>).symbol = lighterSymbol;
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

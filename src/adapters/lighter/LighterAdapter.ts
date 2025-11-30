/**
 * Lighter exchange adapter implementation
 */

import { BaseAdapter } from '../base/BaseAdapter.js';
import type {
  Market,
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
import { InvalidOrderError } from '../../types/errors.js';
import { LIGHTER_API_URLS, LIGHTER_RATE_LIMITS, LIGHTER_ENDPOINT_WEIGHTS } from './constants.js';

/**
 * Lighter adapter configuration
 */
export interface LighterConfig {
  apiKey?: string;
  apiSecret?: string;
  testnet?: boolean;
  timeout?: number;
  rateLimitTier?: 'tier1' | 'tier2' | 'tier3';
}

/**
 * Lighter exchange adapter
 *
 * High-performance order book DEX on Arbitrum
 */
export class LighterAdapter extends BaseAdapter {
  readonly id = 'lighter';
  readonly name = 'Lighter';

  readonly has: Partial<FeatureMap> = {
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchFundingRate: true,
    fetchFundingRateHistory: false,
    fetchPositions: true,
    fetchBalance: true,
    createOrder: true,
    createBatchOrders: false,
    cancelOrder: true,
    cancelAllOrders: true,
    watchOrderBook: false,
    watchTrades: false,
    watchPositions: false,
  };

  private readonly apiUrl: string;
  private readonly wsUrl: string;
  private readonly apiKey?: string;
  private readonly apiSecret?: string;
  protected readonly rateLimiter: RateLimiter;

  constructor(config: LighterConfig = {}) {
    super(config);

    const testnet = config.testnet ?? false;
    const urls = testnet ? LIGHTER_API_URLS.testnet : LIGHTER_API_URLS.mainnet;

    this.apiUrl = urls.rest;
    this.wsUrl = urls.websocket;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;

    const tier = config.rateLimitTier ?? 'tier1';
    const limits = LIGHTER_RATE_LIMITS[tier];

    this.rateLimiter = new RateLimiter({
      maxTokens: limits.maxRequests,
      refillRate: limits.maxRequests / (limits.windowMs / 1000),
      windowMs: limits.windowMs,
      weights: LIGHTER_ENDPOINT_WEIGHTS,
    });
  }

  async initialize(): Promise<void> {
    this._isReady = true;
  }

  async disconnect(): Promise<void> {
    this._isReady = false;
  }

  // ==================== Market Data Methods ====================

  async fetchMarkets(params?: MarketParams): Promise<Market[]> {
    await this.rateLimiter.acquire('fetchMarkets');

    // TODO: Implement actual API call
    // For now, return minimal stub
    return [];
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    await this.rateLimiter.acquire('fetchTicker');

    // TODO: Implement actual API call
    throw new Error('fetchTicker not yet implemented');
  }

  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    await this.rateLimiter.acquire('fetchOrderBook');

    // TODO: Implement actual API call
    throw new Error('fetchOrderBook not yet implemented');
  }

  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    await this.rateLimiter.acquire('fetchTrades');

    // TODO: Implement actual API call
    return [];
  }

  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    await this.rateLimiter.acquire('fetchFundingRate');

    // TODO: Implement actual API call
    throw new Error('fetchFundingRate not yet implemented');
  }

  async fetchFundingRateHistory(
    symbol: string,
    since?: number,
    limit?: number
  ): Promise<FundingRate[]> {
    throw new Error('Lighter does not support funding rate history');
  }

  // ==================== Trading Methods ====================

  async createOrder(request: OrderRequest): Promise<Order> {
    await this.rateLimiter.acquire('createOrder');

    if (!this.apiKey || !this.apiSecret) {
      throw new InvalidOrderError(
        'API key and secret required for trading',
        'AUTH_REQUIRED',
        'lighter'
      );
    }

    // TODO: Implement actual API call
    throw new Error('createOrder not yet implemented');
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    await this.rateLimiter.acquire('cancelOrder');

    // TODO: Implement actual API call
    throw new Error('cancelOrder not yet implemented');
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    await this.rateLimiter.acquire('cancelAllOrders');

    // TODO: Implement actual API call
    return [];
  }

  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    await this.rateLimiter.acquire('fetchPositions');

    // TODO: Implement actual API call
    return [];
  }

  async fetchBalance(): Promise<Balance[]> {
    await this.rateLimiter.acquire('fetchBalance');

    // TODO: Implement actual API call
    return [];
  }

  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    await this.rateLimiter.acquire('fetchOpenOrders');

    // TODO: Implement actual API call
    return [];
  }

  // ==================== Required BaseAdapter Methods ====================

  async setLeverage(symbol: string, leverage: number): Promise<void> {
    throw new Error('Lighter does not support setLeverage');
  }

  symbolToExchange(symbol: string): string {
    // Convert BTC/USDT:USDT to BTC-USDT-PERP
    return symbol.replace('/', '-').replace(':USDT', '-PERP');
  }

  symbolFromExchange(exchangeSymbol: string): string {
    // Convert BTC-USDT-PERP to BTC/USDT:USDT
    const parts = exchangeSymbol.replace('-PERP', '').split('-');
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}:${parts[1]}`;
    }
    return exchangeSymbol;
  }
}

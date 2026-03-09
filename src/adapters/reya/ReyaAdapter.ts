/**
 * Reya Exchange Adapter
 *
 * Implements IExchangeAdapter for Reya DEX.
 * Reya is an L2 perpetual DEX with REST + WebSocket APIs,
 * EIP-712 signing, and continuous funding rates.
 */

import { Wallet } from 'ethers';
import type {
  Balance,
  FundingRate,
  Market,
  MarketParams,
  OHLCV,
  OHLCVParams,
  OHLCVTimeframe,
  Order,
  OrderBook,
  OrderBookParams,
  OrderRequest,
  Position,
  Ticker,
  Trade,
  TradeParams,
} from '../../types/common.js';
import type { FeatureMap, IExchangeAdapter } from '../../types/adapter.js';
import { PerpDEXError, NotSupportedError } from '../../types/errors.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import {
  REYA_MAINNET_API,
  REYA_TESTNET_API,
  REYA_RATE_LIMIT,
  REYA_EXCHANGE_ID,
  unifiedToReya,
  reyaToUnified,
} from './constants.js';
import { ReyaAuth } from './ReyaAuth.js';
import { ReyaNormalizer } from './ReyaNormalizer.js';
import { buildOrderRequest, mapTimeframeToResolution } from './utils.js';
import { mapError } from './error-codes.js';
import type {
  ReyaConfig,
  ReyaMarketDefinition,
  ReyaMarketSummary,
  ReyaDepth,
  ReyaPerpExecutionList,
  ReyaPrice,
  ReyaCandleHistoryData,
  ReyaCreateOrderResponse,
  ReyaCancelOrderResponse,
  ReyaMassCancelResponse,
  ReyaOrder,
  ReyaPosition,
  ReyaAccountBalance,
  ReyaAccount,
} from './types.js';

export { ReyaConfig };

export class ReyaAdapter extends BaseAdapter implements IExchangeAdapter {
  readonly id = 'reya';
  readonly name = 'Reya';

  readonly has: Partial<FeatureMap> = {
    // Market Data
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchOHLCV: true,
    fetchFundingRate: true,
    fetchFundingRateHistory: false,

    // Trading
    createOrder: true,
    cancelOrder: true,
    cancelAllOrders: true,
    editOrder: false,

    // Account
    fetchOpenOrders: true,
    fetchOrderHistory: false,
    fetchMyTrades: true,
    fetchDeposits: false,
    fetchWithdrawals: false,

    // Positions & Balance
    fetchPositions: true,
    fetchBalance: true,
    setLeverage: false,
    setMarginMode: false,

    // WebSocket
    watchOrderBook: false,
    watchTrades: false,
    watchTicker: false,
    watchOrders: false,
    watchPositions: false,
    watchBalance: false,
  };

  private readonly auth?: ReyaAuth;
  private readonly baseUrl: string;
  protected readonly httpClient: HTTPClient;
  protected rateLimiter: RateLimiter;
  private normalizer: ReyaNormalizer;
  private accountId: number;
  private readonly exchangeId: number;

  constructor(config: ReyaConfig = {}) {
    super(config);

    this.baseUrl = config.testnet ? REYA_TESTNET_API : REYA_MAINNET_API;
    this.accountId = config.accountId ?? 0;
    this.exchangeId = config.exchangeId ?? REYA_EXCHANGE_ID;

    if (config.privateKey) {
      const wallet = new Wallet(config.privateKey);
      this.auth = new ReyaAuth(wallet);
    }

    this.normalizer = new ReyaNormalizer();

    this.rateLimiter = new RateLimiter({
      maxTokens: config.rateLimit?.maxRequests ?? REYA_RATE_LIMIT.maxRequests,
      windowMs: config.rateLimit?.windowMs ?? REYA_RATE_LIMIT.windowMs,
      weights: REYA_RATE_LIMIT.weights,
    });

    this.httpClient = new HTTPClient({
      baseUrl: this.baseUrl,
      timeout: config.timeout ?? 30000,
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        multiplier: 2,
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        resetTimeout: 60000,
      },
      exchange: this.id,
    });
  }

  async initialize(): Promise<void> {
    if (this._isReady) {
      return;
    }

    // Optionally discover account ID
    if (this.auth && this.accountId === 0) {
      try {
        const accounts = await this.httpClient.get<ReyaAccount[]>(
          `/wallet/${this.auth.getAddress()}/accounts`
        );
        const perpAccount = accounts.find((a) => a.type === 'MAINPERP');
        if (perpAccount) {
          this.accountId = perpAccount.accountId;
        }
      } catch {
        this.debug('Could not auto-discover account ID');
      }
    }

    this._isReady = true;
    this.debug('Adapter initialized');
  }

  // === Symbol conversion ===

  protected symbolToExchange(symbol: string): string {
    return unifiedToReya(symbol);
  }

  protected symbolFromExchange(exchangeSymbol: string): string {
    return reyaToUnified(exchangeSymbol);
  }

  // === Auth helpers ===

  private requireAuth(): ReyaAuth {
    if (!this.auth) {
      throw new PerpDEXError(
        'Private key required for authenticated operations',
        'MISSING_CREDENTIALS',
        'reya'
      );
    }
    return this.auth;
  }

  private async publicGet<T>(path: string, feature: string): Promise<T> {
    await this.rateLimiter.acquire(feature);
    try {
      return await this.httpClient.get<T>(path);
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  // === Public Market Data ===

  async fetchMarkets(_params?: MarketParams): Promise<Market[]> {
    const [definitions, summaries] = await Promise.all([
      this.publicGet<ReyaMarketDefinition[]>('/reference-data/market-definitions', 'fetchMarkets'),
      this.publicGet<ReyaMarketSummary[]>('/market-data/markets/summary', 'fetchMarkets'),
    ]);

    const summaryMap = new Map<string, ReyaMarketSummary>();
    for (const s of summaries) {
      summaryMap.set(s.symbol, s);
    }

    return definitions
      .filter((d) => d.symbol.endsWith('PERP'))
      .map((d) => this.normalizer.normalizeMarket(d, summaryMap.get(d.symbol)));
  }

  async _fetchTicker(symbol: string): Promise<Ticker> {
    const reyaSymbol = this.symbolToExchange(symbol);

    const [summary, price] = await Promise.all([
      this.publicGet<ReyaMarketSummary>(
        `/market-data/market/summary?symbol=${reyaSymbol}`,
        'fetchTicker'
      ),
      this.publicGet<ReyaPrice>(`/market-data/price?symbol=${reyaSymbol}`, 'fetchTicker'),
    ]);

    return this.normalizer.normalizeTicker(summary, price);
  }

  async _fetchOrderBook(symbol: string, _params?: OrderBookParams): Promise<OrderBook> {
    const reyaSymbol = this.symbolToExchange(symbol);

    const depth = await this.publicGet<ReyaDepth>(
      `/market-data/market/depth?symbol=${reyaSymbol}`,
      'fetchOrderBook'
    );

    return this.normalizer.normalizeOrderBook(depth);
  }

  async _fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    const reyaSymbol = this.symbolToExchange(symbol);
    let path = `/market-data/market/perp-executions?symbol=${reyaSymbol}`;

    if (params?.since) {
      path += `&startTime=${params.since}`;
    }

    const response = await this.publicGet<ReyaPerpExecutionList>(path, 'fetchTrades');

    return response.data.map((exec) => this.normalizer.normalizeTrade(exec));
  }

  async _fetchFundingRate(symbol: string): Promise<FundingRate> {
    const reyaSymbol = this.symbolToExchange(symbol);

    const [summary, price] = await Promise.all([
      this.publicGet<ReyaMarketSummary>(
        `/market-data/market/summary?symbol=${reyaSymbol}`,
        'fetchFundingRate'
      ),
      this.publicGet<ReyaPrice>(`/market-data/price?symbol=${reyaSymbol}`, 'fetchFundingRate'),
    ]);

    const markPrice = parseFloat(price.oraclePrice);
    return this.normalizer.normalizeFundingRate(summary, markPrice);
  }

  async fetchFundingRateHistory(
    _symbol: string,
    _since?: number,
    _limit?: number
  ): Promise<FundingRate[]> {
    throw new NotSupportedError(
      'Reya uses continuous funding rates; historical snapshots are not available via REST API',
      'NOT_SUPPORTED',
      'reya'
    );
  }

  async fetchOHLCV(
    symbol: string,
    timeframe: OHLCVTimeframe = '1h',
    params?: OHLCVParams
  ): Promise<OHLCV[]> {
    const reyaSymbol = this.symbolToExchange(symbol);
    const resolution = mapTimeframeToResolution(timeframe);

    let path = `/market-data/candles?symbol=${reyaSymbol}&resolution=${resolution}`;
    if (params?.until) {
      path += `&endTime=${Math.floor(params.until / 1000)}`; // Convert to seconds
    }

    const response = await this.publicGet<ReyaCandleHistoryData>(path, 'fetchOHLCV');

    return this.normalizer.normalizeCandles(response, params?.limit);
  }

  // === Private Trading ===

  async createOrder(request: OrderRequest): Promise<Order> {
    const auth = this.requireAuth();
    await this.rateLimiter.acquire('createOrder');

    try {
      const { signature, nonce } = await auth.signOrderAction({
        accountId: this.accountId,
      });

      const orderReq = buildOrderRequest(
        request,
        this.accountId,
        this.exchangeId,
        signature,
        nonce,
        auth.getAddress()
      );

      const response = await this.httpClient.post<ReyaCreateOrderResponse>('/order-entry/order', {
        body: orderReq as unknown as Record<string, unknown>,
        headers: auth.getHeaders(),
      });

      if (response.status === 'REJECTED') {
        throw new PerpDEXError('Order rejected', 'ORDER_REJECTED', 'reya');
      }

      return {
        id: response.orderId ?? '',
        symbol: request.symbol,
        type: request.type,
        side: request.side,
        amount: request.amount,
        price: request.price,
        status: response.status === 'FILLED' ? 'filled' : 'open',
        filled: response.cumQty ? parseFloat(response.cumQty) : 0,
        remaining: request.amount - (response.cumQty ? parseFloat(response.cumQty) : 0),
        reduceOnly: request.reduceOnly ?? false,
        postOnly: request.postOnly ?? false,
        clientOrderId: request.clientOrderId,
        timestamp: Date.now(),
      };
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    const auth = this.requireAuth();
    await this.rateLimiter.acquire('cancelOrder');

    try {
      const { signature, nonce } = await auth.signCancelAction(this.accountId, orderId);

      const response = await this.httpClient.post<ReyaCancelOrderResponse>('/order-entry/cancel', {
        body: {
          orderId,
          accountId: this.accountId,
          signature,
          nonce,
        },
        headers: auth.getHeaders(),
      });

      return {
        id: response.orderId,
        symbol: symbol ?? '',
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
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    const auth = this.requireAuth();
    await this.rateLimiter.acquire('cancelAllOrders');

    try {
      const { signature, nonce } = await auth.signCancelAction(this.accountId);

      const body: Record<string, unknown> = {
        accountId: this.accountId,
        signature,
        nonce,
        expiresAfter: Math.floor(Date.now() / 1000) + 300,
      };

      if (symbol) {
        body.symbol = this.symbolToExchange(symbol);
      }

      const response = await this.httpClient.post<ReyaMassCancelResponse>(
        '/order-entry/cancel-all',
        {
          body,
          headers: auth.getHeaders(),
        }
      );

      this.debug(`Cancelled ${response.cancelledCount} orders`);
      return [];
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  // === Account History ===

  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    const auth = this.requireAuth();
    await this.rateLimiter.acquire('fetchOpenOrders');

    try {
      const address = auth.getAddress();
      const orders = await this.httpClient.get<ReyaOrder[]>(
        `/wallet-data/wallet/${address}/open-orders`
      );

      let normalized = orders.map((o) => this.normalizer.normalizeOrder(o));

      if (symbol) {
        normalized = normalized.filter((o) => o.symbol === symbol);
      }

      return normalized;
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]> {
    throw new NotSupportedError(
      'Reya does not provide order history via REST API',
      'NOT_SUPPORTED',
      'reya'
    );
  }

  async fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]> {
    const auth = this.requireAuth();
    await this.rateLimiter.acquire('fetchMyTrades');

    try {
      const address = auth.getAddress();
      let path = `/wallet-data/wallet/${address}/perp-executions`;
      const params: string[] = [];

      if (since) {
        params.push(`startTime=${since}`);
      }

      if (params.length > 0) {
        path += `?${params.join('&')}`;
      }

      const response = await this.httpClient.get<ReyaPerpExecutionList>(path);

      let trades = response.data.map((exec) => this.normalizer.normalizeTrade(exec));

      if (symbol) {
        trades = trades.filter((t) => t.symbol === symbol);
      }

      if (limit && trades.length > limit) {
        trades = trades.slice(0, limit);
      }

      return trades;
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  // === Positions & Balance ===

  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    const auth = this.requireAuth();
    await this.rateLimiter.acquire('fetchPositions');

    try {
      const address = auth.getAddress();
      const positions = await this.httpClient.get<ReyaPosition[]>(
        `/wallet-data/wallet/${address}/positions`
      );

      let normalized = positions
        .filter((p) => parseFloat(p.qty) !== 0)
        .map((p) => this.normalizer.normalizePosition(p));

      if (symbols && symbols.length > 0) {
        normalized = normalized.filter((p) => symbols.includes(p.symbol));
      }

      return normalized;
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async fetchBalance(): Promise<Balance[]> {
    const auth = this.requireAuth();
    await this.rateLimiter.acquire('fetchBalance');

    try {
      const address = auth.getAddress();
      const balances = await this.httpClient.get<ReyaAccountBalance[]>(
        `/wallet-data/wallet/${address}/account-balances`
      );

      return balances
        .filter((b) => parseFloat(b.realBalance) !== 0)
        .map((b) => this.normalizer.normalizeBalance(b));
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async _setLeverage(_symbol: string, _leverage: number): Promise<void> {
    throw new NotSupportedError(
      'Reya uses account-level margin; per-symbol leverage is not supported',
      'NOT_SUPPORTED',
      'reya'
    );
  }
}

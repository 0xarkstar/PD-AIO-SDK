/**
 * GMX v2 Exchange Adapter
 *
 * Adapter for GMX v2 perpetuals on Arbitrum and Avalanche.
 * GMX v2 uses synthetics-based perpetuals with on-chain keeper execution.
 *
 * Key characteristics:
 * - Up to 100x leverage
 * - Cross-margin
 * - Continuous funding rate
 * - On-chain order execution via keepers
 * - Multi-collateral support
 *
 * @see https://docs.gmx.io/docs/api/rest-v2/
 * @see https://github.com/gmx-io/gmx-synthetics
 */

import { BaseAdapter } from '../base/BaseAdapter.js';
import type {
  Balance,
  ExchangeConfig,
  FeatureMap,
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
} from '../../types/index.js';
import { GmxNormalizer } from './GmxNormalizer.js';
import {
  GMX_API_URLS,
  GMX_MARKETS,
  GMX_PRECISION,
  unifiedToGmx,
  gmxToUnified,
  getMarketsForChain,
  type GMXMarketKey,
} from './constants.js';
import { mapGmxError } from './error-codes.js';
import type {
  GmxMarketInfo,
  GmxCandlestick,
} from './types.js';

export type GmxChain = 'arbitrum' | 'avalanche';

/**
 * GMX adapter configuration
 */
export interface GmxConfig extends ExchangeConfig {
  /** Chain to use (default: arbitrum) */
  chain?: GmxChain;
  /** Wallet address for fetching positions */
  walletAddress?: string;
  /** Custom RPC endpoint */
  rpcEndpoint?: string;
}

/**
 * GMX v2 Exchange Adapter
 *
 * @example
 * ```typescript
 * // Read-only mode (market data only)
 * const gmx = new GmxAdapter({ chain: 'arbitrum' });
 * await gmx.initialize();
 *
 * // Fetch ticker
 * const ticker = await gmx.fetchTicker('ETH/USD:ETH');
 *
 * // With wallet for positions
 * const gmx = new GmxAdapter({
 *   chain: 'arbitrum',
 *   walletAddress: '0x...',
 * });
 * await gmx.initialize();
 * const positions = await gmx.fetchPositions();
 * ```
 */
export class GmxAdapter extends BaseAdapter {
  readonly id = 'gmx';
  readonly name = 'GMX v2';

  readonly has: Partial<FeatureMap> = {
    // Market data
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: false, // GMX doesn't have a traditional orderbook
    fetchTrades: false, // Requires subgraph query
    fetchFundingRate: true,
    fetchFundingRateHistory: false,
    fetchOHLCV: true,

    // Trading (requires on-chain transactions)
    createOrder: false, // Requires wallet integration
    cancelOrder: false,
    cancelAllOrders: false,
    createBatchOrders: false,
    cancelBatchOrders: false,

    // Account data (requires subgraph)
    fetchPositions: false, // Requires subgraph
    fetchBalance: false,
    fetchOpenOrders: false,
    fetchOrderHistory: false,
    fetchMyTrades: false,

    // Position management
    setLeverage: false, // Leverage is per-position
    setMarginMode: false, // Always cross margin

    // WebSocket (not available via REST)
    watchOrderBook: false,
    watchTrades: false,
    watchTicker: false,
    watchPositions: false,
    watchOrders: false,
    watchBalance: false,
  };

  private normalizer: GmxNormalizer;
  private chain: GmxChain;
  private apiBaseUrl: string;
  private walletAddress?: string;
  private marketsCache: Map<string, GmxMarketInfo> = new Map();
  private marketsCacheTimestamp: number = 0;
  private marketsCacheTTL = 60000; // 1 minute

  constructor(config: GmxConfig = {}) {
    super({
      timeout: 30000,
      ...config,
    });

    this.chain = config.chain || 'arbitrum';
    this.apiBaseUrl = GMX_API_URLS[this.chain].api;
    this.walletAddress = config.walletAddress;
    this.normalizer = new GmxNormalizer();
  }

  // ==========================================================================
  // Connection Management
  // ==========================================================================

  async initialize(): Promise<void> {
    if (this._isReady) {
      this.debug('Already initialized');
      return;
    }

    this.debug('Initializing GMX adapter...');

    try {
      // Validate API connectivity by fetching markets
      await this.fetchMarketsInfo();

      this._isReady = true;
      this.info(`GMX adapter initialized successfully (${this.chain})`);
    } catch (error) {
      this.error('Failed to initialize GMX adapter', error instanceof Error ? error : undefined);
      throw mapGmxError(error);
    }
  }

  async disconnect(): Promise<void> {
    this._isReady = false;
    this.marketsCache.clear();
    this.info('GMX adapter disconnected');
  }

  // ==========================================================================
  // Market Data
  // ==========================================================================

  async fetchMarkets(params?: MarketParams): Promise<Market[]> {
    this.ensureInitialized();

    try {
      const marketsInfo = await this.fetchMarketsInfo();
      let markets = this.normalizer.normalizeMarkets(marketsInfo, this.chain);

      // Filter if requested
      if (params?.active !== undefined) {
        markets = markets.filter(m => m.active === params.active);
      }

      return markets;
    } catch (error) {
      throw mapGmxError(error);
    }
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    this.ensureInitialized();

    const marketKey = unifiedToGmx(symbol);
    if (!marketKey) {
      throw new Error(`Invalid market: ${symbol}`);
    }

    try {
      const marketsInfo = await this.fetchMarketsInfo();
      const config = GMX_MARKETS[marketKey];
      const marketInfo = marketsInfo.find(
        m => m.marketTokenAddress.toLowerCase() === config.marketAddress.toLowerCase()
      );

      if (!marketInfo) {
        throw new Error(`Market info not found for ${symbol}`);
      }

      return this.normalizer.normalizeTicker(marketInfo);
    } catch (error) {
      throw mapGmxError(error);
    }
  }

  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    // GMX doesn't have a traditional orderbook - it's AMM-based with price impact
    throw new Error('GMX does not have a traditional orderbook. Use fetchTicker for price data.');
  }

  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    // Would require subgraph query - not implemented for REST-only version
    throw new Error('fetchTrades requires subgraph integration. Not available via REST API.');
  }

  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    this.ensureInitialized();

    const marketKey = unifiedToGmx(symbol);
    if (!marketKey) {
      throw new Error(`Invalid market: ${symbol}`);
    }

    try {
      const marketsInfo = await this.fetchMarketsInfo();
      const config = GMX_MARKETS[marketKey];
      const marketInfo = marketsInfo.find(
        m => m.marketTokenAddress.toLowerCase() === config.marketAddress.toLowerCase()
      );

      if (!marketInfo) {
        throw new Error(`Market info not found for ${symbol}`);
      }

      // Get price for calculations
      const minPrice = parseFloat(marketInfo.indexToken.prices.minPrice) / GMX_PRECISION.PRICE;
      const maxPrice = parseFloat(marketInfo.indexToken.prices.maxPrice) / GMX_PRECISION.PRICE;
      const indexPrice = (minPrice + maxPrice) / 2;

      // Calculate funding rate from market info
      const longOI = parseFloat(marketInfo.longInterestUsd) / GMX_PRECISION.USD;
      const shortOI = parseFloat(marketInfo.shortInterestUsd) / GMX_PRECISION.USD;
      const fundingFactor = parseFloat(marketInfo.fundingFactor) / GMX_PRECISION.FACTOR;

      // GMX funding rate is based on OI imbalance
      const imbalance = longOI - shortOI;
      const totalOI = longOI + shortOI;
      const imbalanceRatio = totalOI > 0 ? Math.abs(imbalance) / totalOI : 0;

      // Hourly funding rate (approximate)
      const hourlyRate = fundingFactor * imbalanceRatio * 3600;
      const fundingRate = imbalance > 0 ? hourlyRate : -hourlyRate;

      return {
        symbol: config.symbol,
        fundingRate,
        fundingTimestamp: Date.now(),
        nextFundingTimestamp: Date.now() + 3600000, // Next hour
        markPrice: indexPrice,
        indexPrice,
        fundingIntervalHours: 1,
        info: {
          marketAddress: config.marketAddress,
          longOpenInterestUsd: longOI,
          shortOpenInterestUsd: shortOI,
          imbalance,
          imbalanceRatio,
          fundingFactor: marketInfo.fundingFactor,
        },
      };
    } catch (error) {
      throw mapGmxError(error);
    }
  }

  async fetchFundingRateHistory(
    symbol: string,
    since?: number,
    limit?: number
  ): Promise<FundingRate[]> {
    // Would require subgraph query - not implemented for REST-only version
    throw new Error('fetchFundingRateHistory requires subgraph integration. Not available via REST API.');
  }

  async fetchOHLCV(
    symbol: string,
    timeframe: OHLCVTimeframe = '1h',
    params?: OHLCVParams
  ): Promise<OHLCV[]> {
    this.ensureInitialized();

    const marketKey = unifiedToGmx(symbol);
    if (!marketKey) {
      throw new Error(`Invalid market: ${symbol}`);
    }

    const config = GMX_MARKETS[marketKey];

    try {
      // Convert timeframe to GMX interval
      const interval = this.timeframeToInterval(timeframe);

      // Build query params
      const queryParams = new URLSearchParams({
        marketAddress: config.marketAddress,
        period: interval,
      });

      if (params?.since) {
        queryParams.set('from', Math.floor(params.since / 1000).toString());
      }
      if (params?.limit) {
        queryParams.set('limit', params.limit.toString());
      }

      const url = `${this.apiBaseUrl}/candlesticks?${queryParams.toString()}`;
      const candles = await this.request<GmxCandlestick[]>('GET', url);

      return this.normalizer.normalizeCandles(candles);
    } catch (error) {
      throw mapGmxError(error);
    }
  }

  // ==========================================================================
  // Account Data (Not available via REST API)
  // ==========================================================================

  async fetchPositions(): Promise<Position[]> {
    throw new Error('fetchPositions requires subgraph integration. Not available via REST API.');
  }

  async fetchBalance(): Promise<Balance[]> {
    throw new Error('fetchBalance requires on-chain RPC calls. Not available via REST API.');
  }

  async fetchOpenOrders(): Promise<Order[]> {
    throw new Error('fetchOpenOrders requires subgraph integration. Not available via REST API.');
  }

  async fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]> {
    throw new Error('fetchOrderHistory requires subgraph integration. Not available via REST API.');
  }

  async fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]> {
    throw new Error('fetchMyTrades requires subgraph integration. Not available via REST API.');
  }

  // ==========================================================================
  // Trading (Not available - requires on-chain transactions)
  // ==========================================================================

  async createOrder(request: OrderRequest): Promise<Order> {
    throw new Error(
      'GMX trading requires on-chain transactions via the ExchangeRouter contract. ' +
      'Use the @gmx-io/sdk for trading operations.'
    );
  }

  async cancelOrder(orderId: string, symbol: string): Promise<Order> {
    throw new Error(
      'GMX order cancellation requires on-chain transactions. ' +
      'Use the @gmx-io/sdk for trading operations.'
    );
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    throw new Error(
      'GMX order cancellation requires on-chain transactions. ' +
      'Use the @gmx-io/sdk for trading operations.'
    );
  }

  async setLeverage(symbol: string, leverage: number): Promise<void> {
    // GMX v2 leverage is per-position, not per-account or per-symbol
    // Leverage is determined at order creation time
    throw new Error(
      'GMX v2 does not have account-level leverage settings. ' +
      'Leverage is determined per-position at order creation time.'
    );
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Fetch markets info from API with caching
   */
  private async fetchMarketsInfo(): Promise<GmxMarketInfo[]> {
    const now = Date.now();

    // Return cached if fresh
    if (this.marketsCache.size > 0 && now - this.marketsCacheTimestamp < this.marketsCacheTTL) {
      return Array.from(this.marketsCache.values());
    }

    const url = `${this.apiBaseUrl}/markets/info`;
    const response = await this.request<{ markets: GmxMarketInfo[] }>('GET', url);

    // Update cache
    this.marketsCache.clear();
    for (const market of response.markets) {
      this.marketsCache.set(market.marketTokenAddress.toLowerCase(), market);
    }
    this.marketsCacheTimestamp = now;

    return response.markets;
  }

  /**
   * Convert timeframe to GMX interval
   */
  private timeframeToInterval(timeframe: OHLCVTimeframe): string {
    const mapping: Record<OHLCVTimeframe, string> = {
      '1m': '1m',
      '3m': '5m', // GMX doesn't support 3m, use 5m
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '2h': '4h', // GMX doesn't support 2h, use 4h
      '4h': '4h',
      '6h': '4h', // GMX doesn't support 6h, use 4h
      '8h': '1d', // GMX doesn't support 8h, use 1d
      '12h': '1d', // GMX doesn't support 12h, use 1d
      '1d': '1d',
      '3d': '1w', // GMX doesn't support 3d, use 1w
      '1w': '1w',
      '1M': '1w', // GMX doesn't support 1M, use 1w
    };

    return mapping[timeframe] || '1h';
  }

  // ==========================================================================
  // Symbol Conversion
  // ==========================================================================

  /**
   * Convert symbol to exchange format
   */
  protected symbolToExchange(symbol: string): string {
    const gmxSymbol = unifiedToGmx(symbol);
    if (!gmxSymbol) {
      throw new Error(`Invalid market symbol: ${symbol}`);
    }
    return gmxSymbol;
  }

  /**
   * Convert exchange symbol to unified format
   */
  protected symbolFromExchange(exchangeSymbol: string): string {
    // If it's already a valid GMX market key
    if (exchangeSymbol in GMX_MARKETS) {
      return gmxToUnified(exchangeSymbol as GMXMarketKey);
    }
    return exchangeSymbol;
  }

  /**
   * Get chain info
   */
  getChain(): GmxChain {
    return this.chain;
  }

  /**
   * Get API base URL
   */
  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }
}

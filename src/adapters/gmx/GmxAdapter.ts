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
import { GmxAuth } from './GmxAuth.js';
import { GmxContracts } from './GmxContracts.js';
import { GmxSubgraph } from './GmxSubgraph.js';
import { GmxOrderBuilder, type GmxPriceData, type OrderBuilderConfig } from './GmxOrderBuilder.js';
import {
  GMX_API_URLS,
  GMX_MARKETS,
  GMX_PRECISION,
  unifiedToGmx,
  gmxToUnified,
  type GMXMarketKey,
} from './constants.js';
import { mapGmxError } from './error-codes.js';
import type { GmxMarketInfo, GmxCandlestick } from './types.js';

/**
 * Ticker price data from GMX API
 */
interface GmxTickerPrice {
  tokenAddress: string;
  tokenSymbol?: string;
  minPrice: string;
  maxPrice: string;
  updatedAt?: number;
}

export type GmxChain = 'arbitrum' | 'avalanche';

/**
 * GMX adapter configuration
 */
export interface GmxConfig extends ExchangeConfig {
  /** Chain to use (default: arbitrum) */
  chain?: GmxChain;
  /** Wallet address for fetching positions */
  walletAddress?: string;
  /** Private key for trading */
  privateKey?: string;
  /** Custom RPC endpoint */
  rpcEndpoint?: string;
  /** Order builder configuration */
  orderConfig?: OrderBuilderConfig;
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
 *
 * // Full trading mode
 * const gmx = new GmxAdapter({
 *   chain: 'arbitrum',
 *   privateKey: '0x...',
 * });
 * await gmx.initialize();
 * const order = await gmx.createOrder({
 *   symbol: 'ETH/USD:ETH',
 *   side: 'buy',
 *   type: 'market',
 *   amount: 0.1,
 *   leverage: 10,
 * });
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

    // Trading (enabled with private key)
    createOrder: true,
    cancelOrder: true,
    cancelAllOrders: true,
    createBatchOrders: false,
    cancelBatchOrders: false,

    // Account data
    fetchPositions: true,
    fetchBalance: true,
    fetchOpenOrders: true,
    fetchOrderHistory: true,
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
  private auth?: GmxAuth;
  private contracts?: GmxContracts;
  private subgraph?: GmxSubgraph;
  private orderBuilder?: GmxOrderBuilder;
  private orderConfig?: OrderBuilderConfig;
  private marketsCache: Map<string, GmxMarketInfo> = new Map();
  private marketsCacheTimestamp: number = 0;
  private marketsCacheTTL = 60000; // 1 minute
  private pricesCache: Map<string, GmxTickerPrice> = new Map();
  private pricesCacheTimestamp: number = 0;
  private pricesCacheTTL = 5000; // 5 seconds for price data

  constructor(config: GmxConfig = {}) {
    super({
      timeout: 30000,
      ...config,
    });

    this.chain = config.chain || 'arbitrum';
    this.apiBaseUrl = GMX_API_URLS[this.chain].api;
    this.walletAddress = config.walletAddress;
    this.orderConfig = config.orderConfig;

    // Bridge unified builderCode to GMX-specific referralCode
    if (config.builderCode && !this.orderConfig?.referralCode) {
      this.orderConfig = { ...this.orderConfig, referralCode: config.builderCode };
    }
    // When builderCodeEnabled is false, clear referralCode
    if (config.builderCodeEnabled === false) {
      this.orderConfig = { ...this.orderConfig, referralCode: undefined };
    }

    this.normalizer = new GmxNormalizer();

    // Initialize auth if credentials provided
    if (config.privateKey) {
      this.auth = new GmxAuth({
        privateKey: config.privateKey,
        chain: this.chain,
        rpcEndpoint: config.rpcEndpoint,
      });
      this.walletAddress = this.auth.getWalletAddress();
    } else if (config.walletAddress) {
      this.auth = new GmxAuth({
        walletAddress: config.walletAddress,
        chain: this.chain,
        rpcEndpoint: config.rpcEndpoint,
      });
    }
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

      // Initialize contracts and subgraph if auth is available
      if (this.auth) {
        this.contracts = new GmxContracts(
          this.chain,
          this.auth.getProvider(),
          this.auth.getSigner()
        );
        this.subgraph = new GmxSubgraph(this.chain);

        // Initialize order builder if trading is enabled
        if (this.auth.canSign() && this.contracts) {
          this.orderBuilder = new GmxOrderBuilder(
            this.chain,
            this.auth,
            this.contracts,
            this.orderConfig
          );
        }
      }

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
    this.pricesCache.clear();
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
        markets = markets.filter((m) => m.active === params.active);
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
      const [marketsInfo, prices] = await Promise.all([
        this.fetchMarketsInfo(),
        this.fetchPrices(),
      ]);
      const config = GMX_MARKETS[marketKey];
      const marketInfo = marketsInfo.find(
        (m) => m.marketToken.toLowerCase() === config.marketAddress.toLowerCase()
      );

      if (!marketInfo) {
        throw new Error(`Market info not found for ${symbol}`);
      }

      // Get price for the index token
      const indexTokenPrice = prices.get(config.indexToken.toLowerCase());
      const priceData = indexTokenPrice
        ? {
            minPrice: parseFloat(indexTokenPrice.minPrice) / GMX_PRECISION.PRICE,
            maxPrice: parseFloat(indexTokenPrice.maxPrice) / GMX_PRECISION.PRICE,
          }
        : undefined;

      return this.normalizer.normalizeTicker(marketInfo, priceData);
    } catch (error) {
      throw mapGmxError(error);
    }
  }

  async fetchOrderBook(_symbol: string, _params?: OrderBookParams): Promise<OrderBook> {
    // GMX doesn't have a traditional orderbook - it's AMM-based with price impact
    throw new Error('GMX does not have a traditional orderbook. Use fetchTicker for price data.');
  }

  async fetchTrades(_symbol: string, _params?: TradeParams): Promise<Trade[]> {
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
      const [marketsInfo, prices] = await Promise.all([
        this.fetchMarketsInfo(),
        this.fetchPrices(),
      ]);
      const config = GMX_MARKETS[marketKey];
      const marketInfo = marketsInfo.find(
        (m) => m.marketToken.toLowerCase() === config.marketAddress.toLowerCase()
      );

      if (!marketInfo) {
        throw new Error(`Market info not found for ${symbol}`);
      }

      // Get price for calculations from prices endpoint
      const indexTokenPrice = prices.get(config.indexToken.toLowerCase());
      let indexPrice = 0;
      if (indexTokenPrice) {
        const minPrice = parseFloat(indexTokenPrice.minPrice) / GMX_PRECISION.PRICE;
        const maxPrice = parseFloat(indexTokenPrice.maxPrice) / GMX_PRECISION.PRICE;
        indexPrice = (minPrice + maxPrice) / 2;
      }

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
    _symbol: string,
    _since?: number,
    _limit?: number
  ): Promise<FundingRate[]> {
    // Would require subgraph query - not implemented for REST-only version
    throw new Error(
      'fetchFundingRateHistory requires subgraph integration. Not available via REST API.'
    );
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
        tokenSymbol: config.baseAsset,
        period: interval,
      });

      if (params?.since) {
        queryParams.set('from', Math.floor(params.since / 1000).toString());
      }
      if (params?.limit) {
        queryParams.set('limit', params.limit.toString());
      }

      const url = `${this.apiBaseUrl}/prices/candles?${queryParams.toString()}`;
      const candles = await this.request<GmxCandlestick[]>('GET', url);

      return this.normalizer.normalizeCandles(candles);
    } catch (error) {
      throw mapGmxError(error);
    }
  }

  // ==========================================================================
  // Account Data
  // ==========================================================================

  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    this.ensureInitialized();

    if (!this.auth || !this.walletAddress) {
      throw new Error('Wallet address required to fetch positions');
    }

    if (!this.subgraph) {
      throw new Error('Subgraph not initialized');
    }

    try {
      // Get positions from subgraph
      const rawPositions = await this.subgraph.fetchPositions(this.walletAddress);

      // Get current prices for PnL calculation
      const prices = await this.fetchPrices();

      // Normalize positions
      const positions: Position[] = [];
      for (const pos of rawPositions) {
        // Get mark price for this position's market
        const marketConfig = Object.values(GMX_MARKETS).find(
          (m) => m.marketAddress.toLowerCase() === pos.market.toLowerCase()
        );

        if (!marketConfig) continue;

        const indexTokenPrice = prices.get(marketConfig.indexToken.toLowerCase());
        let markPrice = 0;
        if (indexTokenPrice) {
          const minPrice = parseFloat(indexTokenPrice.minPrice) / GMX_PRECISION.PRICE;
          const maxPrice = parseFloat(indexTokenPrice.maxPrice) / GMX_PRECISION.PRICE;
          markPrice = (minPrice + maxPrice) / 2;
        }

        const position = this.normalizer.normalizePosition(pos, markPrice, this.chain);

        // Filter by symbols if provided
        if (!symbols || symbols.includes(position.symbol)) {
          positions.push(position);
        }
      }

      return positions;
    } catch (error) {
      throw mapGmxError(error);
    }
  }

  async fetchBalance(): Promise<Balance[]> {
    this.ensureInitialized();

    if (!this.auth || !this.walletAddress) {
      throw new Error('Wallet address required to fetch balance');
    }

    try {
      // Fetch ETH balance
      const ethBalance = await this.auth.getBalance();
      const ethBalanceNum = Number(ethBalance) / 1e18;

      // Get ETH price
      const prices = await this.fetchPrices();
      const wethAddress =
        this.chain === 'arbitrum'
          ? '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
          : '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7';

      const ethPriceData = prices.get(wethAddress.toLowerCase());
      let ethPrice = 0;
      if (ethPriceData) {
        const minPrice = parseFloat(ethPriceData.minPrice) / GMX_PRECISION.PRICE;
        const maxPrice = parseFloat(ethPriceData.maxPrice) / GMX_PRECISION.PRICE;
        ethPrice = (minPrice + maxPrice) / 2;
      }

      const balances: Balance[] = [
        {
          currency: this.chain === 'arbitrum' ? 'ETH' : 'AVAX',
          total: ethBalanceNum,
          free: ethBalanceNum,
          used: 0,
          usdValue: ethBalanceNum * ethPrice,
        },
      ];

      // Fetch USDC balance
      const usdcAddress =
        this.chain === 'arbitrum'
          ? '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
          : '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E';

      const usdcBalance = await this.auth.getTokenBalance(usdcAddress);
      const usdcBalanceNum = Number(usdcBalance) / 1e6;

      balances.push({
        currency: 'USDC',
        total: usdcBalanceNum,
        free: usdcBalanceNum,
        used: 0,
        usdValue: usdcBalanceNum,
      });

      return balances;
    } catch (error) {
      throw mapGmxError(error);
    }
  }

  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    this.ensureInitialized();

    if (!this.auth || !this.walletAddress) {
      throw new Error('Wallet address required to fetch orders');
    }

    if (!this.subgraph) {
      throw new Error('Subgraph not initialized');
    }

    try {
      const orders = await this.subgraph.fetchOpenOrders(this.walletAddress);

      // Get current prices for amount calculation
      const prices = await this.fetchPrices();

      const normalizedOrders: Order[] = [];
      for (const order of orders) {
        const marketConfig = Object.values(GMX_MARKETS).find(
          (m) => m.marketAddress.toLowerCase() === order.market.toLowerCase()
        );

        let marketPrice: number | undefined;
        if (marketConfig) {
          const indexTokenPrice = prices.get(marketConfig.indexToken.toLowerCase());
          if (indexTokenPrice) {
            const minPrice = parseFloat(indexTokenPrice.minPrice) / GMX_PRECISION.PRICE;
            const maxPrice = parseFloat(indexTokenPrice.maxPrice) / GMX_PRECISION.PRICE;
            marketPrice = (minPrice + maxPrice) / 2;
          }
        }

        const normalizedOrder = this.normalizer.normalizeOrder(order, marketPrice);

        // Filter by symbol if provided
        if (!symbol || normalizedOrder.symbol === symbol) {
          normalizedOrders.push(normalizedOrder);
        }
      }

      return normalizedOrders;
    } catch (error) {
      throw mapGmxError(error);
    }
  }

  async fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]> {
    this.ensureInitialized();

    if (!this.auth || !this.walletAddress) {
      throw new Error('Wallet address required to fetch order history');
    }

    if (!this.subgraph) {
      throw new Error('Subgraph not initialized');
    }

    try {
      const orders = await this.subgraph.fetchOrderHistory(this.walletAddress, since);

      // Get current prices for amount calculation
      const prices = await this.fetchPrices();

      const normalizedOrders: Order[] = [];
      for (const order of orders) {
        const marketConfig = Object.values(GMX_MARKETS).find(
          (m) => m.marketAddress.toLowerCase() === order.market.toLowerCase()
        );

        let marketPrice: number | undefined;
        if (marketConfig) {
          const indexTokenPrice = prices.get(marketConfig.indexToken.toLowerCase());
          if (indexTokenPrice) {
            const minPrice = parseFloat(indexTokenPrice.minPrice) / GMX_PRECISION.PRICE;
            const maxPrice = parseFloat(indexTokenPrice.maxPrice) / GMX_PRECISION.PRICE;
            marketPrice = (minPrice + maxPrice) / 2;
          }
        }

        const normalizedOrder = this.normalizer.normalizeOrder(order, marketPrice);

        // Filter by symbol if provided
        if (!symbol || normalizedOrder.symbol === symbol) {
          normalizedOrders.push(normalizedOrder);
        }
      }

      // Apply limit
      if (limit && normalizedOrders.length > limit) {
        return normalizedOrders.slice(0, limit);
      }

      return normalizedOrders;
    } catch (error) {
      throw mapGmxError(error);
    }
  }

  async fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<Trade[]> {
    throw new Error('fetchMyTrades requires subgraph integration. Not available via REST API.');
  }

  // ==========================================================================
  // Trading Operations
  // ==========================================================================

  async createOrder(request: OrderRequest): Promise<Order> {
    this.ensureInitialized();

    if (!this.auth || !this.auth.canSign()) {
      throw new Error('Private key required for trading');
    }

    if (!this.contracts || !this.orderBuilder) {
      throw new Error('Trading components not initialized');
    }

    try {
      // Validate order parameters
      this.orderBuilder.validateOrderParams(request);

      // Get current prices
      const prices = await this.fetchPrices();
      const marketKey = unifiedToGmx(request.symbol);
      if (!marketKey) {
        throw new Error(`Invalid market: ${request.symbol}`);
      }
      const marketConfig = GMX_MARKETS[marketKey];

      // Get index token price
      const indexTokenPrice = prices.get(marketConfig.indexToken.toLowerCase());
      if (!indexTokenPrice) {
        throw new Error(`Price not available for ${request.symbol}`);
      }

      const minPrice = parseFloat(indexTokenPrice.minPrice) / GMX_PRECISION.PRICE;
      const maxPrice = parseFloat(indexTokenPrice.maxPrice) / GMX_PRECISION.PRICE;
      const indexPrice = (minPrice + maxPrice) / 2;

      const priceData: GmxPriceData = {
        indexPrice,
        longTokenPrice: indexPrice, // Simplified
        shortTokenPrice: 1, // USDC = $1
      };

      // Build order parameters
      const orderParams = this.orderBuilder.buildCreateOrderParams(request, priceData);

      // Calculate execution fee
      const executionFee = await this.orderBuilder.getMinExecutionFee();
      orderParams.executionFee = executionFee;

      // If using USDC as collateral, need to approve token spending
      if (!request.reduceOnly) {
        const collateralAmount = orderParams.initialCollateralDeltaAmount;
        const usdcAddress = marketConfig.shortToken;

        // Check allowance
        const allowance = await this.auth.getTokenAllowance(
          usdcAddress,
          GMX_API_URLS[this.chain].api.includes('arbitrum')
            ? '0x7452c558d45f8afC8c83dAe62C3f8A5BE19c71f6' // Arbitrum Router
            : '0x820F5FfC5b525cD4d88Cd91aCd2119b38cB97b10' // Avalanche Router
        );

        if (allowance < collateralAmount) {
          this.debug('Approving USDC spending...');
          const approveTx = await this.auth.approveToken(
            usdcAddress,
            this.contracts.getAddresses().router,
            collateralAmount * 2n // Approve 2x for future orders
          );
          await approveTx.wait();
        }
      }

      // Create the order on-chain
      this.debug('Creating order on-chain...');
      const tx = await this.contracts.createOrder(orderParams, executionFee);
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction failed');
      }

      // Extract order key from events (simplified - would need proper event parsing)
      const orderKey = receipt.logs[0]?.topics[1] || receipt.hash;

      // Return order object
      return {
        id: orderKey,
        symbol: request.symbol,
        type: request.type,
        side: request.side,
        amount: request.amount,
        price: request.price,
        status: 'open',
        filled: 0,
        remaining: request.amount,
        reduceOnly: request.reduceOnly || false,
        postOnly: request.postOnly || false,
        clientOrderId: request.clientOrderId,
        timestamp: Date.now(),
        info: {
          txHash: receipt.hash,
          executionFee: executionFee.toString(),
          orderParams,
        },
      };
    } catch (error) {
      throw mapGmxError(error);
    }
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    this.ensureInitialized();

    if (!this.auth || !this.auth.canSign()) {
      throw new Error('Private key required for trading');
    }

    if (!this.contracts) {
      throw new Error('Contracts not initialized');
    }

    try {
      // Cancel the order on-chain
      const tx = await this.contracts.cancelOrder(orderId);
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction failed');
      }

      return {
        id: orderId,
        symbol: symbol || 'UNKNOWN',
        type: 'limit',
        side: 'buy',
        amount: 0,
        status: 'canceled',
        filled: 0,
        remaining: 0,
        reduceOnly: false,
        postOnly: false,
        timestamp: Date.now(),
        info: {
          txHash: receipt.hash,
        },
      };
    } catch (error) {
      throw mapGmxError(error);
    }
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    this.ensureInitialized();

    if (!this.auth || !this.auth.canSign()) {
      throw new Error('Private key required for trading');
    }

    try {
      // Fetch all open orders
      const openOrders = await this.fetchOpenOrders(symbol);

      // Cancel each order
      const canceledOrders: Order[] = [];
      for (const order of openOrders) {
        try {
          const canceled = await this.cancelOrder(order.id, order.symbol);
          canceledOrders.push(canceled);
        } catch (error) {
          this.warn(
            `Failed to cancel order ${order.id}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      return canceledOrders;
    } catch (error) {
      throw mapGmxError(error);
    }
  }

  async setLeverage(_symbol: string, _leverage: number): Promise<void> {
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
      this.marketsCache.set(market.marketToken.toLowerCase(), market);
    }
    this.marketsCacheTimestamp = now;

    return response.markets;
  }

  /**
   * Fetch token prices from API with caching
   */
  private async fetchPrices(): Promise<Map<string, GmxTickerPrice>> {
    const now = Date.now();

    // Return cached if fresh (shorter TTL for prices)
    if (this.pricesCache.size > 0 && now - this.pricesCacheTimestamp < this.pricesCacheTTL) {
      return this.pricesCache;
    }

    try {
      const url = `${this.apiBaseUrl}/prices/tickers`;
      const response = await this.request<GmxTickerPrice[]>('GET', url);

      // Update cache
      this.pricesCache.clear();
      for (const price of response) {
        this.pricesCache.set(price.tokenAddress.toLowerCase(), price);
      }
      this.pricesCacheTimestamp = now;
    } catch (error) {
      // Log but don't fail - prices are optional for some operations
      this.debug(
        `Failed to fetch prices: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return this.pricesCache;
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

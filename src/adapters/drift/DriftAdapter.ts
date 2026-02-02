/**
 * Drift Protocol Exchange Adapter
 *
 * Adapter for Drift Protocol on Solana.
 * Drift is a decentralized perpetuals DEX with cross-margin and up to 20x leverage.
 *
 * Key characteristics:
 * - On-chain positions via Solana program
 * - Hourly funding rate settlements
 * - Supports 10+ perpetual markets
 * - Cross-margin by default
 * - DLOB (Decentralized Limit Order Book)
 *
 * @see https://docs.drift.trade/
 * @see https://drift-labs.github.io/v2-teacher/
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
import { DriftNormalizer } from './DriftNormalizer.js';
import { DriftAuth, type DriftAuthConfig } from './DriftAuth.js';
import {
  DRIFT_API_URLS,
  DRIFT_PERP_MARKETS,
  DRIFT_MARKET_INDEX_MAP,
  DRIFT_PRECISION,
  unifiedToDrift,
  driftToUnified,
  getMarketIndex,
} from './constants.js';
import { mapDriftError } from './error-codes.js';
import {
  isValidMarket,
  getMarketConfig,
  buildOrderbookUrl,
  buildTradesUrl,
  validateOrderParams,
} from './utils.js';
import type {
  DriftL2OrderBook,
  DriftTrade,
  DriftFundingRate,
  DriftMarketStats,
  DriftPerpMarketAccount,
} from './types.js';

/**
 * Drift adapter configuration
 */
export interface DriftConfig extends ExchangeConfig {
  /** Solana private key for trading (optional for read-only) */
  privateKey?: string | Uint8Array;
  /** Wallet address for fetching positions/balances */
  walletAddress?: string;
  /** Sub-account ID (default: 0) */
  subAccountId?: number;
  /** Custom Solana RPC endpoint */
  rpcEndpoint?: string;
}

/**
 * Drift Protocol Exchange Adapter
 *
 * @example
 * ```typescript
 * // Read-only mode (market data only)
 * const drift = new DriftAdapter();
 * await drift.initialize();
 *
 * // Fetch ticker
 * const ticker = await drift.fetchTicker('SOL/USD:USD');
 *
 * // With wallet for positions
 * const drift = new DriftAdapter({
 *   walletAddress: 'your-solana-wallet-address',
 * });
 * await drift.initialize();
 * const positions = await drift.fetchPositions();
 * ```
 */
export class DriftAdapter extends BaseAdapter {
  readonly id = 'drift';
  readonly name = 'Drift Protocol';

  readonly has: Partial<FeatureMap> = {
    // Market data
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchFundingRate: true,
    fetchFundingRateHistory: true,
    fetchOHLCV: false, // Requires historical data API

    // Trading (requires Drift SDK integration)
    createOrder: false, // Requires @drift-labs/sdk
    cancelOrder: false,
    cancelAllOrders: false,
    createBatchOrders: false,
    cancelBatchOrders: false,

    // Account data
    fetchPositions: true, // Via DLOB API
    fetchBalance: true,
    fetchOpenOrders: true,
    fetchOrderHistory: false,
    fetchMyTrades: false,

    // Position management
    setLeverage: false, // Cross-margin, no per-market leverage
    setMarginMode: false, // Always cross margin

    // WebSocket (via DLOB server)
    watchOrderBook: false,
    watchTrades: false,
    watchTicker: false,
    watchPositions: false,
    watchOrders: false,
    watchBalance: false,
  };

  private normalizer: DriftNormalizer;
  private auth?: DriftAuth;
  private dlobBaseUrl: string;
  private isTestnet: boolean;
  private marketStatsCache: Map<number, { stats: DriftMarketStats; timestamp: number }> = new Map();
  private statsCacheTTL = 5000; // 5 seconds

  constructor(config: DriftConfig = {}) {
    super({
      timeout: 30000,
      ...config,
    });

    this.isTestnet = config.testnet || false;
    this.dlobBaseUrl = this.isTestnet
      ? DRIFT_API_URLS.devnet.dlob
      : DRIFT_API_URLS.mainnet.dlob;

    this.normalizer = new DriftNormalizer();

    // Initialize auth if credentials provided
    if (config.privateKey || config.walletAddress) {
      this.auth = new DriftAuth({
        privateKey: config.privateKey,
        walletAddress: config.walletAddress,
        subAccountId: config.subAccountId,
        rpcEndpoint: config.rpcEndpoint || (this.isTestnet
          ? DRIFT_API_URLS.devnet.rpc
          : DRIFT_API_URLS.mainnet.rpc),
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

    this.debug('Initializing Drift adapter...');

    try {
      // Validate API connectivity by fetching orderbook
      await this.request<DriftL2OrderBook>(
        'GET',
        buildOrderbookUrl(this.dlobBaseUrl, 0, 'perp', 5)
      );

      this._isReady = true;
      this.info('Drift adapter initialized successfully');
    } catch (error) {
      const mappedError = mapDriftError(error);
      this.error('Failed to initialize Drift adapter', mappedError);
      throw mappedError;
    }
  }

  // ==========================================================================
  // Symbol Conversion
  // ==========================================================================

  protected symbolToExchange(symbol: string): string {
    return unifiedToDrift(symbol);
  }

  protected symbolFromExchange(exchangeSymbol: string): string {
    return driftToUnified(exchangeSymbol);
  }

  // ==========================================================================
  // Market Data
  // ==========================================================================

  async fetchMarkets(params?: MarketParams): Promise<Market[]> {
    this.ensureInitialized();

    // Check cache first
    const cached = this.getPreloadedMarkets();
    if (cached) {
      return this.filterMarkets(cached, params);
    }

    try {
      // Build markets from constants (actual on-chain data requires SDK)
      const markets: Market[] = Object.entries(DRIFT_PERP_MARKETS).map(([key, config]) => ({
        id: key,
        symbol: config.symbol,
        base: config.baseAsset,
        quote: 'USD',
        settle: 'USD',
        active: true,
        minAmount: config.minOrderSize,
        maxAmount: 1000000, // Varies by market
        pricePrecision: Math.max(0, -Math.floor(Math.log10(config.tickSize))),
        amountPrecision: Math.max(0, -Math.floor(Math.log10(config.stepSize))),
        priceTickSize: config.tickSize,
        amountStepSize: config.stepSize,
        makerFee: -0.0002, // Maker rebate
        takerFee: 0.001, // 0.1% taker
        maxLeverage: config.maxLeverage,
        fundingIntervalHours: 1,
        contractSize: 1,
        info: {
          marketIndex: config.marketIndex,
          contractTier: config.contractTier,
          initialMarginRatio: config.initialMarginRatio,
          maintenanceMarginRatio: config.maintenanceMarginRatio,
        },
      }));

      return this.filterMarkets(markets, params);
    } catch (error) {
      throw mapDriftError(error);
    }
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    this.ensureInitialized();

    const driftSymbol = this.symbolToExchange(symbol);
    if (!isValidMarket(driftSymbol)) {
      throw new Error(`Invalid market: ${symbol}`);
    }

    try {
      const marketIndex = getMarketIndex(symbol);
      const orderbook = await this.request<DriftL2OrderBook>(
        'GET',
        buildOrderbookUrl(this.dlobBaseUrl, marketIndex, 'perp', 1)
      );

      // Build ticker from orderbook data
      const oraclePrice = parseFloat(orderbook.oraclePrice) / DRIFT_PRECISION.PRICE;
      const bestBid = orderbook.bids[0] ? parseFloat(orderbook.bids[0].price) / DRIFT_PRECISION.PRICE : oraclePrice * 0.999;
      const bestAsk = orderbook.asks[0] ? parseFloat(orderbook.asks[0].price) / DRIFT_PRECISION.PRICE : oraclePrice * 1.001;
      const markPrice = (bestBid + bestAsk) / 2;

      const config = getMarketConfig(symbol);

      return {
        symbol: config?.symbol || symbol,
        timestamp: Date.now(),
        last: markPrice,
        bid: bestBid,
        ask: bestAsk,
        high: markPrice, // Would need historical data
        low: markPrice,
        open: oraclePrice,
        close: markPrice,
        change: markPrice - oraclePrice,
        percentage: oraclePrice > 0 ? ((markPrice - oraclePrice) / oraclePrice) * 100 : 0,
        baseVolume: 0, // Would need stats API
        quoteVolume: 0,
        info: {
          marketIndex,
          oraclePrice,
          slot: orderbook.slot,
        },
      };
    } catch (error) {
      throw mapDriftError(error);
    }
  }

  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    this.ensureInitialized();

    const driftSymbol = this.symbolToExchange(symbol);
    if (!isValidMarket(driftSymbol)) {
      throw new Error(`Invalid market: ${symbol}`);
    }

    try {
      const marketIndex = getMarketIndex(symbol);
      const depth = params?.limit || 20;

      const orderbook = await this.request<DriftL2OrderBook>(
        'GET',
        buildOrderbookUrl(this.dlobBaseUrl, marketIndex, 'perp', depth)
      );

      return this.normalizer.normalizeOrderBook(orderbook);
    } catch (error) {
      throw mapDriftError(error);
    }
  }

  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    this.ensureInitialized();

    const driftSymbol = this.symbolToExchange(symbol);
    if (!isValidMarket(driftSymbol)) {
      throw new Error(`Invalid market: ${symbol}`);
    }

    try {
      const marketIndex = getMarketIndex(symbol);
      const limit = params?.limit || 50;

      const url = buildTradesUrl(this.dlobBaseUrl, marketIndex, 'perp', limit);
      const trades = await this.request<DriftTrade[]>('GET', url);

      return trades.map(t => this.normalizer.normalizeTrade(t));
    } catch (error) {
      throw mapDriftError(error);
    }
  }

  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    this.ensureInitialized();

    const driftSymbol = this.symbolToExchange(symbol);
    if (!isValidMarket(driftSymbol)) {
      throw new Error(`Invalid market: ${symbol}`);
    }

    try {
      const marketIndex = getMarketIndex(symbol);

      // Get funding rate from DLOB API
      const url = `${this.dlobBaseUrl}/fundingRate?marketIndex=${marketIndex}`;
      const funding = await this.request<DriftFundingRate>('GET', url);

      return this.normalizer.normalizeFundingRate(funding);
    } catch (error) {
      throw mapDriftError(error);
    }
  }

  async fetchFundingRateHistory(
    symbol: string,
    since?: number,
    limit?: number
  ): Promise<FundingRate[]> {
    this.ensureInitialized();

    const driftSymbol = this.symbolToExchange(symbol);
    if (!isValidMarket(driftSymbol)) {
      throw new Error(`Invalid market: ${symbol}`);
    }

    try {
      const marketIndex = getMarketIndex(symbol);
      const params = new URLSearchParams({
        marketIndex: marketIndex.toString(),
      });
      if (limit) params.set('limit', limit.toString());

      const url = `${this.dlobBaseUrl}/fundingRateHistory?${params.toString()}`;
      const history = await this.request<DriftFundingRate[]>('GET', url);

      return history.map(f => this.normalizer.normalizeFundingRate(f));
    } catch (error) {
      throw mapDriftError(error);
    }
  }

  // ==========================================================================
  // Account Data
  // ==========================================================================

  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    this.ensureInitialized();

    if (!this.auth?.canRead()) {
      throw new Error('Wallet address required to fetch positions');
    }

    const walletAddress = this.auth.getWalletAddress();
    const subAccountId = this.auth.getSubAccountId();

    if (!walletAddress) {
      throw new Error('Wallet address not configured');
    }

    try {
      // Fetch user positions from DLOB API
      const url = `${this.dlobBaseUrl}/user?userAccount=${walletAddress}&subAccountId=${subAccountId}`;
      const userData = await this.request<{
        perpPositions: Array<{
          marketIndex: number;
          baseAssetAmount: string;
          quoteAssetAmount: string;
          quoteEntryAmount: string;
          quoteBreakEvenAmount: string;
          settledPnl: string;
          lpShares: string;
          openOrders: number;
        }>;
      }>('GET', url);

      // Filter out empty positions and normalize
      const positions: Position[] = [];

      for (const pos of userData.perpPositions) {
        if (parseFloat(pos.baseAssetAmount) === 0) continue;

        // Get mark price from orderbook
        const orderbook = await this.request<DriftL2OrderBook>(
          'GET',
          buildOrderbookUrl(this.dlobBaseUrl, pos.marketIndex, 'perp', 1)
        );
        const oraclePrice = parseFloat(orderbook.oraclePrice) / DRIFT_PRECISION.PRICE;

        const position = this.normalizer.normalizePosition(
          {
            ...pos,
            lastCumulativeFundingRate: '0',
            openBids: '0',
            openAsks: '0',
            perLpBase: 0,
          },
          oraclePrice,
          oraclePrice
        );

        // Filter by symbols if provided
        if (!symbols || symbols.includes(position.symbol)) {
          positions.push(position);
        }
      }

      return positions;
    } catch (error) {
      throw mapDriftError(error);
    }
  }

  async fetchBalance(): Promise<Balance[]> {
    this.ensureInitialized();

    if (!this.auth?.canRead()) {
      throw new Error('Wallet address required to fetch balance');
    }

    const walletAddress = this.auth.getWalletAddress();
    const subAccountId = this.auth.getSubAccountId();

    if (!walletAddress) {
      throw new Error('Wallet address not configured');
    }

    try {
      // Fetch user account from DLOB API
      const url = `${this.dlobBaseUrl}/user?userAccount=${walletAddress}&subAccountId=${subAccountId}`;
      const userData = await this.request<{
        spotPositions: Array<{
          marketIndex: number;
          scaledBalance: string;
          balanceType: 'deposit' | 'borrow';
          cumulativeDeposits: string;
          openOrders: number;
        }>;
        totalCollateral: string;
        freeCollateral: string;
      }>('GET', url);

      const balances: Balance[] = [];

      // Add USDC balance (market index 0 for spot)
      const usdcPosition = userData.spotPositions.find(p => p.marketIndex === 0);
      if (usdcPosition) {
        const total = parseFloat(usdcPosition.scaledBalance) / DRIFT_PRECISION.QUOTE;
        balances.push({
          currency: 'USDC',
          total: usdcPosition.balanceType === 'deposit' ? total : -total,
          free: parseFloat(userData.freeCollateral) / DRIFT_PRECISION.QUOTE,
          used: parseFloat(userData.totalCollateral) / DRIFT_PRECISION.QUOTE -
                parseFloat(userData.freeCollateral) / DRIFT_PRECISION.QUOTE,
          usdValue: usdcPosition.balanceType === 'deposit' ? total : -total,
        });
      }

      return balances;
    } catch (error) {
      throw mapDriftError(error);
    }
  }

  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    this.ensureInitialized();

    if (!this.auth?.canRead()) {
      throw new Error('Wallet address required to fetch orders');
    }

    const walletAddress = this.auth.getWalletAddress();
    const subAccountId = this.auth.getSubAccountId();

    if (!walletAddress) {
      throw new Error('Wallet address not configured');
    }

    try {
      const url = `${this.dlobBaseUrl}/orders?userAccount=${walletAddress}&subAccountId=${subAccountId}`;
      const ordersData = await this.request<{
        orders: Array<{
          orderId: number;
          userOrderId: number;
          marketIndex: number;
          marketType: 'perp' | 'spot';
          orderType: string;
          direction: 'long' | 'short';
          baseAssetAmount: string;
          baseAssetAmountFilled: string;
          quoteAssetAmountFilled: string;
          price: string;
          status: string;
          reduceOnly: boolean;
          triggerPrice: string;
          triggerCondition: string;
          postOnly: string;
          immediateOrCancel: boolean;
          slot: number;
          maxTs: string;
          oraclePriceOffset: number;
          auctionDuration: number;
          auctionStartPrice: string;
          auctionEndPrice: string;
          existingPositionDirection: string;
        }>;
      }>('GET', url);

      const orders = ordersData.orders
        .filter(o => o.marketType === 'perp')
        .map(o => this.normalizer.normalizeOrder({
          ...o,
          orderType: o.orderType as any,
          direction: o.direction,
          status: o.status as any,
          triggerCondition: o.triggerCondition as any,
          postOnly: o.postOnly as any,
          existingPositionDirection: o.existingPositionDirection as any,
        }));

      if (symbol) {
        const marketIndex = getMarketIndex(symbol);
        return orders.filter(o => o.info?.marketIndex === marketIndex);
      }

      return orders;
    } catch (error) {
      throw mapDriftError(error);
    }
  }

  // ==========================================================================
  // Trading Operations (Not implemented - requires Drift SDK)
  // ==========================================================================

  async createOrder(request: OrderRequest): Promise<Order> {
    throw new Error(
      'Drift trading requires @drift-labs/sdk integration. ' +
      'Use the Drift SDK directly for trading operations: https://docs.drift.trade/sdk-documentation'
    );
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    throw new Error(
      'Drift trading requires @drift-labs/sdk integration. ' +
      'Use the Drift SDK directly for trading operations.'
    );
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    throw new Error(
      'Drift trading requires @drift-labs/sdk integration. ' +
      'Use the Drift SDK directly for trading operations.'
    );
  }

  async fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]> {
    this.warn('Order history requires indexing on-chain transactions');
    return [];
  }

  async fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]> {
    this.warn('Trade history requires indexing on-chain transactions');
    return [];
  }

  async setLeverage(symbol: string, leverage: number): Promise<void> {
    throw new Error('Drift uses cross-margin. Leverage is determined by position size relative to collateral.');
  }

  // ==========================================================================
  // Health Check
  // ==========================================================================

  protected async performApiHealthCheck(): Promise<void> {
    // Check DLOB API connectivity
    await this.request<DriftL2OrderBook>(
      'GET',
      buildOrderbookUrl(this.dlobBaseUrl, 0, 'perp', 1)
    );
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Filter markets by params
   */
  private filterMarkets(markets: Market[], params?: MarketParams): Market[] {
    if (!params) return markets;

    let filtered = markets;

    if (params.active !== undefined) {
      filtered = filtered.filter(m => m.active === params.active);
    }

    if (params.ids && params.ids.length > 0) {
      filtered = filtered.filter(m => params.ids!.includes(m.id));
    }

    return filtered;
  }

  /**
   * Get wallet address (for position queries)
   */
  async getAddress(): Promise<string | undefined> {
    return this.auth?.getWalletAddress();
  }

  /**
   * Get sub-account ID
   */
  getSubAccountId(): number {
    return this.auth?.getSubAccountId() ?? 0;
  }
}

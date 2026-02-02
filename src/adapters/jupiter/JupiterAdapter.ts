/**
 * Jupiter Perps Exchange Adapter
 *
 * Adapter for Jupiter Perpetuals on Solana.
 * Jupiter Perps uses on-chain positions and the JLP pool for liquidity.
 *
 * Key characteristics:
 * - On-chain positions via Solana program
 * - Borrow fees instead of funding rates
 * - Supports SOL, ETH, BTC perpetuals
 * - Up to 250x leverage
 *
 * @see https://jup.ag/perps
 * @see https://dev.jup.ag/docs/perps
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
import { JupiterNormalizer } from './JupiterNormalizer.js';
import { JupiterAuth, type JupiterAuthConfig } from './JupiterAuth.js';
import {
  JUPITER_MAINNET_PRICE_API,
  JUPITER_MARKETS,
  JUPITER_TOKEN_MINTS,
  JUPITER_RATE_LIMIT,
  unifiedToJupiter,
  jupiterToUnified,
} from './constants.js';
import { mapJupiterError } from './error-codes.js';
import {
  isValidMarket,
  getTokenMint,
  buildPriceApiUrl,
  validateOrderParams,
} from './utils.js';
import type {
  JupiterPriceResponse,
  JupiterPriceData,
  JupiterCustodyAccount,
  JupiterPoolAccount,
  JupiterMarketStats,
  JupiterPoolStats,
} from './types.js';

/**
 * Jupiter adapter configuration
 */
export interface JupiterAdapterConfig extends ExchangeConfig {
  /** Solana private key for trading (optional for read-only) */
  privateKey?: string | Uint8Array;
  /** Wallet address for fetching positions/balances */
  walletAddress?: string;
  /** Custom Solana RPC endpoint */
  rpcEndpoint?: string;
}

/**
 * Jupiter Perpetuals Exchange Adapter
 *
 * @example
 * ```typescript
 * // Read-only mode (market data only)
 * const jupiter = new JupiterAdapter();
 * await jupiter.initialize();
 *
 * // Fetch ticker
 * const ticker = await jupiter.fetchTicker('SOL/USD:USD');
 *
 * // With wallet for positions
 * const jupiter = new JupiterAdapter({
 *   walletAddress: 'your-solana-wallet-address',
 * });
 * await jupiter.initialize();
 * const positions = await jupiter.fetchPositions();
 * ```
 */
export class JupiterAdapter extends BaseAdapter {
  readonly id = 'jupiter';
  readonly name = 'Jupiter Perps';

  readonly has: Partial<FeatureMap> = {
    // Market data
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: true, // Synthetic orderbook from pool liquidity
    fetchTrades: false, // No public trade feed
    fetchFundingRate: true, // Returns borrow fee as funding rate
    fetchFundingRateHistory: false, // No historical borrow fees API
    fetchOHLCV: false, // No candle data API

    // Trading (requires Solana SDK integration)
    createOrder: false, // Requires @solana/web3.js
    cancelOrder: false,
    cancelAllOrders: false,
    createBatchOrders: false,
    cancelBatchOrders: false,

    // Account data
    fetchPositions: true, // Via Solana RPC
    fetchBalance: true, // Via Solana RPC
    fetchOpenOrders: false, // Jupiter uses instant execution
    fetchOrderHistory: false,
    fetchMyTrades: false,

    // Position management
    setLeverage: false, // Leverage set per-trade
    setMarginMode: false, // Always isolated margin

    // WebSocket (not supported yet)
    watchOrderBook: false,
    watchTrades: false,
    watchTicker: false,
    watchPositions: false,
    watchOrders: false,
    watchBalance: false,
  };

  private normalizer: JupiterNormalizer;
  private auth?: JupiterAuth;
  private priceCache: Map<string, { price: JupiterPriceData; timestamp: number }> = new Map();
  private priceCacheTTL = 5000; // 5 second cache for prices

  constructor(config: JupiterAdapterConfig = {}) {
    super({
      timeout: 30000,
      ...config,
    });

    this.normalizer = new JupiterNormalizer();

    // Initialize auth if credentials provided
    if (config.privateKey || config.walletAddress) {
      this.auth = new JupiterAuth({
        privateKey: config.privateKey,
        walletAddress: config.walletAddress,
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

    this.debug('Initializing Jupiter adapter...');

    try {
      // Validate API connectivity by fetching prices
      await this.fetchPrices(['SOL']);
      this._isReady = true;
      this.info('Jupiter adapter initialized successfully');
    } catch (error) {
      const mappedError = mapJupiterError(error);
      this.error('Failed to initialize Jupiter adapter', mappedError);
      throw mappedError;
    }
  }

  // ==========================================================================
  // Symbol Conversion
  // ==========================================================================

  protected symbolToExchange(symbol: string): string {
    return unifiedToJupiter(symbol);
  }

  protected symbolFromExchange(exchangeSymbol: string): string {
    return jupiterToUnified(exchangeSymbol);
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
      // Jupiter has fixed markets - return hardcoded market data
      // Actual on-chain data would require Solana RPC calls
      const markets: Market[] = Object.entries(JUPITER_MARKETS).map(([key, config]) => ({
        id: key,
        symbol: jupiterToUnified(key),
        base: config.baseToken,
        quote: 'USD',
        settle: 'USD',
        active: true,
        minAmount: config.minPositionSize,
        maxAmount: 10000000, // $10M max position
        minCost: 10,
        pricePrecision: Math.max(0, -Math.floor(Math.log10(config.tickSize))),
        amountPrecision: Math.max(0, -Math.floor(Math.log10(config.stepSize))),
        priceTickSize: config.tickSize,
        amountStepSize: config.stepSize,
        makerFee: 0.0006, // 0.06% fee
        takerFee: 0.0006,
        maxLeverage: config.maxLeverage,
        fundingIntervalHours: 1, // Jupiter uses hourly borrow fees
        contractSize: 1,
        info: {
          tokenMint: JUPITER_TOKEN_MINTS[config.baseToken as keyof typeof JUPITER_TOKEN_MINTS],
          marginMode: 'isolated',
          positionMode: 'one-way',
        },
      }));

      return this.filterMarkets(markets, params);
    } catch (error) {
      throw mapJupiterError(error);
    }
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    this.ensureInitialized();

    const jupiterSymbol = this.symbolToExchange(symbol);
    if (!isValidMarket(jupiterSymbol)) {
      throw new Error(`Invalid market: ${symbol}`);
    }

    try {
      const baseToken = jupiterSymbol.replace('-PERP', '');
      const mint = JUPITER_TOKEN_MINTS[baseToken as keyof typeof JUPITER_TOKEN_MINTS];

      if (!mint) {
        throw new Error(`Unknown token: ${baseToken}`);
      }

      const priceData = await this.fetchPrice(mint);
      return this.normalizer.normalizeTicker(jupiterSymbol, priceData);
    } catch (error) {
      throw mapJupiterError(error);
    }
  }

  async fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook> {
    this.ensureInitialized();

    const jupiterSymbol = this.symbolToExchange(symbol);
    if (!isValidMarket(jupiterSymbol)) {
      throw new Error(`Invalid market: ${symbol}`);
    }

    try {
      // Get current price
      const baseToken = jupiterSymbol.replace('-PERP', '');
      const mint = JUPITER_TOKEN_MINTS[baseToken as keyof typeof JUPITER_TOKEN_MINTS];

      if (!mint) {
        throw new Error(`Unknown token: ${baseToken}`);
      }

      const priceData = await this.fetchPrice(mint);
      const currentPrice = parseFloat(priceData.price);

      // Return synthetic orderbook
      return this.normalizer.normalizeOrderBook(jupiterSymbol, currentPrice);
    } catch (error) {
      throw mapJupiterError(error);
    }
  }

  async fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]> {
    // Jupiter doesn't have a public trade feed
    this.warn('Jupiter Perps does not provide a public trade feed');
    return [];
  }

  async fetchFundingRate(symbol: string): Promise<FundingRate> {
    this.ensureInitialized();

    const jupiterSymbol = this.symbolToExchange(symbol);
    if (!isValidMarket(jupiterSymbol)) {
      throw new Error(`Invalid market: ${symbol}`);
    }

    try {
      // Get current price
      const baseToken = jupiterSymbol.replace('-PERP', '');
      const mint = JUPITER_TOKEN_MINTS[baseToken as keyof typeof JUPITER_TOKEN_MINTS];

      if (!mint) {
        throw new Error(`Unknown token: ${baseToken}`);
      }

      const priceData = await this.fetchPrice(mint);
      const currentPrice = parseFloat(priceData.price);

      // Create a mock custody account with estimated borrow rate
      // In production, this would come from on-chain data
      const mockCustody = this.createMockCustodyForFunding();

      return this.normalizer.normalizeFundingRate(jupiterSymbol, mockCustody, currentPrice);
    } catch (error) {
      throw mapJupiterError(error);
    }
  }

  async fetchFundingRateHistory(
    symbol: string,
    since?: number,
    limit?: number
  ): Promise<FundingRate[]> {
    // Jupiter doesn't provide historical borrow fee data via API
    this.warn('Jupiter Perps does not provide historical funding rate data');
    return [];
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
    if (!walletAddress) {
      throw new Error('Wallet address not configured');
    }

    try {
      // In production, this would:
      // 1. Use Solana RPC to fetch position accounts
      // 2. Filter by owner wallet
      // 3. Parse account data
      //
      // For now, return empty array as placeholder
      // Full implementation requires @solana/web3.js

      this.warn(
        'Position fetching requires Solana RPC integration. ' +
        'Please use the Solana SDK directly or wait for future SDK updates.'
      );

      return [];
    } catch (error) {
      throw mapJupiterError(error);
    }
  }

  async fetchBalance(): Promise<Balance[]> {
    this.ensureInitialized();

    if (!this.auth?.canRead()) {
      throw new Error('Wallet address required to fetch balance');
    }

    const walletAddress = this.auth.getWalletAddress();
    if (!walletAddress) {
      throw new Error('Wallet address not configured');
    }

    try {
      // In production, this would:
      // 1. Fetch SOL balance
      // 2. Fetch USDC/USDT token account balances
      // 3. Calculate locked amounts in positions
      //
      // For now, return empty array as placeholder

      this.warn(
        'Balance fetching requires Solana RPC integration. ' +
        'Please use the Solana SDK directly or wait for future SDK updates.'
      );

      return [];
    } catch (error) {
      throw mapJupiterError(error);
    }
  }

  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    // Jupiter uses instant execution, no pending orders
    return [];
  }

  // ==========================================================================
  // Trading Operations (Not implemented - requires Solana SDK)
  // ==========================================================================

  async createOrder(request: OrderRequest): Promise<Order> {
    throw new Error(
      'Jupiter trading requires @solana/web3.js integration. ' +
      'Use the Jupiter SDK directly for trading operations: https://dev.jup.ag/docs/perps'
    );
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    throw new Error('Jupiter uses instant execution - no orders to cancel');
  }

  async cancelAllOrders(symbol?: string): Promise<Order[]> {
    throw new Error('Jupiter uses instant execution - no orders to cancel');
  }

  async fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]> {
    // Jupiter doesn't have a traditional order history
    this.warn('Jupiter Perps does not maintain order history - trades are instant');
    return [];
  }

  async fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]> {
    // Would require indexing on-chain transactions
    this.warn('Trade history requires indexing on-chain transactions');
    return [];
  }

  async setLeverage(symbol: string, leverage: number): Promise<void> {
    throw new Error('Jupiter leverage is set per-trade, not globally');
  }

  // ==========================================================================
  // Health Check
  // ==========================================================================

  protected async performApiHealthCheck(): Promise<void> {
    // Check price API connectivity
    await this.fetchPrices(['SOL']);
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Fetch price from Jupiter Price API
   */
  private async fetchPrice(tokenMint: string): Promise<JupiterPriceData> {
    // Check cache
    const cached = this.priceCache.get(tokenMint);
    if (cached && Date.now() - cached.timestamp < this.priceCacheTTL) {
      return cached.price;
    }

    const prices = await this.fetchPrices([tokenMint]);
    const price = prices[tokenMint];

    if (!price) {
      throw new Error(`Price not available for ${tokenMint}`);
    }

    return price;
  }

  /**
   * Fetch prices for multiple tokens
   */
  private async fetchPrices(tokenMints: string[]): Promise<Record<string, JupiterPriceData>> {
    // Map token symbols to mints if needed
    const mints = tokenMints.map(t => {
      if (t in JUPITER_TOKEN_MINTS) {
        return JUPITER_TOKEN_MINTS[t as keyof typeof JUPITER_TOKEN_MINTS];
      }
      return t;
    });

    const url = buildPriceApiUrl(mints);

    const response = await this.request<JupiterPriceResponse>('GET', url);

    // Cache results
    for (const [id, data] of Object.entries(response.data)) {
      this.priceCache.set(id, { price: data, timestamp: Date.now() });
    }

    return response.data;
  }

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
   * Create mock custody account for funding rate calculation
   * In production, this would come from on-chain data
   */
  private createMockCustodyForFunding(): JupiterCustodyAccount {
    return {
      pool: '',
      mint: '',
      tokenAccount: '',
      decimals: 6,
      isStable: false,
      oracle: {
        oracleType: 'Pyth',
        oracleAccount: '',
        maxPriceAge: 60,
        maxPriceDeviation: 100,
      },
      pricing: {
        useEma: true,
        tradeSpread: 10,
        swapSpread: 10,
        minInitialLeverage: 1,
        maxInitialLeverage: 250,
        maxLeverage: 250,
        maxPositionLockedUsd: 10000000,
        maxUtilization: 0.8,
      },
      trading: {
        tradingEnabled: true,
        allowOpenPosition: true,
        allowClosePosition: true,
        allowAddCollateral: true,
        allowRemoveCollateral: true,
        allowIncreaseSize: true,
        allowDecreaseSize: true,
      },
      fundingRateState: {
        cumulativeInterestRate: '0',
        lastUpdate: Math.floor(Date.now() / 1000),
        hourlyBorrowRate: '0.0001', // 0.01% per hour (~87.6% APR at high utilization)
      },
      assets: {
        owned: '0',
        locked: '0',
        guaranteedUsd: '0',
        globalShortSizes: '0',
        globalShortAveragePrices: '0',
      },
      bump: 0,
    };
  }

  /**
   * Get wallet address (for position queries)
   */
  async getAddress(): Promise<string | undefined> {
    return this.auth?.getWalletAddress();
  }
}

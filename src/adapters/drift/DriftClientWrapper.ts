/**
 * Drift Protocol Client Wrapper
 *
 * Wraps the @drift-labs/sdk DriftClient for trading operations.
 * Provides a simplified interface for order management.
 */

import type {
  Connection,
  PublicKey,
  TransactionSignature,
  Keypair,
} from '@solana/web3.js';

// Types for @drift-labs/sdk - actual import would be:
// import { DriftClient, OrderParams, PositionDirection, OrderType, ... } from '@drift-labs/sdk';

/**
 * Order parameters for placing orders
 */
export interface DriftOrderParams {
  orderType: 'market' | 'limit' | 'triggerMarket' | 'triggerLimit' | 'oracle';
  marketIndex: number;
  marketType: 'perp' | 'spot';
  direction: 'long' | 'short';
  baseAssetAmount: bigint;
  price?: bigint;
  triggerPrice?: bigint;
  triggerCondition?: 'above' | 'below';
  reduceOnly?: boolean;
  postOnly?: boolean;
  immediateOrCancel?: boolean;
  maxTs?: bigint;
  userOrderId?: number;
  oraclePriceOffset?: number;
  auctionDuration?: number;
  auctionStartPrice?: bigint;
  auctionEndPrice?: bigint;
}

/**
 * Place order result
 */
export interface PlaceOrderResult {
  txSig: string;
  orderId?: number;
  slot: number;
}

/**
 * Cancel order result
 */
export interface CancelOrderResult {
  txSig: string;
  orderId: number;
}

/**
 * Drift SDK client wrapper configuration
 */
export interface DriftClientWrapperConfig {
  /** Solana connection */
  connection: Connection;
  /** Wallet keypair for signing */
  keypair: Keypair;
  /** Sub-account ID (default: 0) */
  subAccountId?: number;
  /** Whether to use devnet */
  isDevnet?: boolean;
  /** Authority public key */
  authority?: PublicKey;
}

/**
 * Wrapper around @drift-labs/sdk DriftClient
 *
 * This class provides a simplified interface for trading operations.
 * It handles SDK initialization, user account management, and order execution.
 */
export class DriftClientWrapper {
  private readonly config: DriftClientWrapperConfig;
  private driftClient: any; // Would be DriftClient type
  private isInitialized = false;
  private userAccountPublicKey?: PublicKey;

  constructor(config: DriftClientWrapperConfig) {
    this.config = config;
  }

  /**
   * Initialize the Drift client and subscribe to user account
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Dynamic import to handle ESM module loading
      const driftSdk = await import('@drift-labs/sdk');
      const {
        DriftClient,
        Wallet,
        loadKeypair,
        initialize,
        BulkAccountLoader,
        getMarketsAndOraclesForSubscription,
      } = driftSdk;

      // Create wallet from keypair (cast to any to handle different @solana/web3.js versions)
      const wallet = new Wallet(this.config.keypair as any);

      // Get markets and oracles to subscribe to
      const { perpMarketIndexes, spotMarketIndexes, oracleInfos } =
        getMarketsAndOraclesForSubscription(this.config.isDevnet ? 'devnet' : 'mainnet-beta');

      // Create bulk account loader for efficient RPC usage (cast to any for different web3.js versions)
      const bulkAccountLoader = new BulkAccountLoader(
        this.config.connection as any,
        'confirmed',
        1000 // 1 second polling interval
      );

      // Initialize Drift client (cast connection to any for different web3.js versions)
      this.driftClient = new DriftClient({
        connection: this.config.connection as any,
        wallet,
        programID: new (await import('@solana/web3.js')).PublicKey(
          'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH'
        ),
        accountSubscription: {
          type: 'polling',
          accountLoader: bulkAccountLoader,
        },
        perpMarketIndexes,
        spotMarketIndexes,
        oracleInfos,
        env: this.config.isDevnet ? 'devnet' : 'mainnet-beta',
        subAccountIds: [this.config.subAccountId ?? 0],
        activeSubAccountId: this.config.subAccountId ?? 0,
      });

      // Subscribe to the drift client
      await this.driftClient.subscribe();

      // Get or initialize user account
      const userAccountExists = await this.driftClient.getUserAccountExists();
      if (!userAccountExists) {
        // User account needs to be initialized first
        console.warn(
          'Drift user account does not exist. ' +
          'Please deposit funds first to create an account.'
        );
      } else {
        // Subscribe to user account updates
        await this.driftClient.addUser(this.config.subAccountId ?? 0);
      }

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Drift client: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ensure client is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('DriftClientWrapper not initialized. Call initialize() first.');
    }
  }

  // ==========================================================================
  // Order Management
  // ==========================================================================

  /**
   * Place a perp order
   */
  async placePerpOrder(params: DriftOrderParams): Promise<PlaceOrderResult> {
    this.ensureInitialized();

    const driftSdk = await import('@drift-labs/sdk');
    const {
      OrderType,
      PositionDirection,
      MarketType,
      OrderTriggerCondition,
      PostOnlyParams,
    } = driftSdk;

    // Map order type
    const orderTypeMap: Record<string, any> = {
      market: OrderType.MARKET,
      limit: OrderType.LIMIT,
      triggerMarket: OrderType.TRIGGER_MARKET,
      triggerLimit: OrderType.TRIGGER_LIMIT,
      oracle: OrderType.ORACLE,
    };

    // Map direction
    const directionMap: Record<string, any> = {
      long: PositionDirection.LONG,
      short: PositionDirection.SHORT,
    };

    // Build order params
    const orderParams = {
      orderType: orderTypeMap[params.orderType] || OrderType.MARKET,
      marketIndex: params.marketIndex,
      marketType: MarketType.PERP,
      direction: directionMap[params.direction] || PositionDirection.LONG,
      baseAssetAmount: params.baseAssetAmount,
      price: params.price,
      triggerPrice: params.triggerPrice,
      triggerCondition: params.triggerCondition === 'above'
        ? OrderTriggerCondition.ABOVE
        : OrderTriggerCondition.BELOW,
      reduceOnly: params.reduceOnly ?? false,
      postOnly: params.postOnly ? PostOnlyParams.MUST_POST_ONLY : PostOnlyParams.NONE,
      immediateOrCancel: params.immediateOrCancel ?? false,
      maxTs: params.maxTs,
      userOrderId: params.userOrderId,
      oraclePriceOffset: params.oraclePriceOffset,
      auctionDuration: params.auctionDuration,
      auctionStartPrice: params.auctionStartPrice,
      auctionEndPrice: params.auctionEndPrice,
    };

    // Place the order
    const txSig = await this.driftClient.placePerpOrder(orderParams);

    // Wait for confirmation
    const confirmation = await this.config.connection.confirmTransaction(txSig, 'confirmed');

    return {
      txSig,
      slot: confirmation.context.slot,
    };
  }

  /**
   * Cancel an order by ID
   */
  async cancelOrder(orderId: number): Promise<CancelOrderResult> {
    this.ensureInitialized();

    const txSig = await this.driftClient.cancelOrder(orderId);

    await this.config.connection.confirmTransaction(txSig, 'confirmed');

    return {
      txSig,
      orderId,
    };
  }

  /**
   * Cancel all orders for a market
   */
  async cancelOrdersForMarket(marketIndex: number): Promise<CancelOrderResult[]> {
    this.ensureInitialized();

    const driftSdk = await import('@drift-labs/sdk');
    const { MarketType } = driftSdk;

    const txSig = await this.driftClient.cancelOrders(
      MarketType.PERP,
      marketIndex
    );

    await this.config.connection.confirmTransaction(txSig, 'confirmed');

    // Get orders that were canceled
    const user = this.driftClient.getUser();
    const orders = user.getOpenOrders();
    const canceledIds = orders
      .filter((o: any) => o.marketIndex === marketIndex)
      .map((o: any) => o.orderId);

    return canceledIds.map((orderId: number) => ({
      txSig,
      orderId,
    }));
  }

  /**
   * Cancel all perp orders
   */
  async cancelAllPerpOrders(): Promise<string> {
    this.ensureInitialized();

    const driftSdk = await import('@drift-labs/sdk');
    const { MarketType } = driftSdk;

    const txSig = await this.driftClient.cancelOrders(MarketType.PERP);

    await this.config.connection.confirmTransaction(txSig, 'confirmed');

    return txSig;
  }

  /**
   * Modify an existing order
   */
  async modifyOrder(
    orderId: number,
    newParams: Partial<DriftOrderParams>
  ): Promise<PlaceOrderResult> {
    this.ensureInitialized();

    // Cancel existing order
    await this.cancelOrder(orderId);

    // Get the original order details
    const user = this.driftClient.getUser();
    const orders = user.getOpenOrders();
    const originalOrder = orders.find((o: any) => o.orderId === orderId);

    if (!originalOrder) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Place new order with merged params
    const mergedParams: DriftOrderParams = {
      orderType: newParams.orderType || originalOrder.orderType,
      marketIndex: newParams.marketIndex ?? originalOrder.marketIndex,
      marketType: 'perp',
      direction: newParams.direction || (originalOrder.direction.long ? 'long' : 'short'),
      baseAssetAmount: newParams.baseAssetAmount ?? originalOrder.baseAssetAmount,
      price: newParams.price ?? originalOrder.price,
      triggerPrice: newParams.triggerPrice ?? originalOrder.triggerPrice,
      reduceOnly: newParams.reduceOnly ?? originalOrder.reduceOnly,
      postOnly: newParams.postOnly ?? (originalOrder.postOnly !== 'none'),
    };

    return this.placePerpOrder(mergedParams);
  }

  // ==========================================================================
  // Account Data
  // ==========================================================================

  /**
   * Get user's perp positions
   */
  async getPerpPositions(): Promise<any[]> {
    this.ensureInitialized();

    const user = this.driftClient.getUser();
    return user.getActivePerpPositions();
  }

  /**
   * Get user's spot positions (balances)
   */
  async getSpotPositions(): Promise<any[]> {
    this.ensureInitialized();

    const user = this.driftClient.getUser();
    return user.getActiveSpotPositions();
  }

  /**
   * Get user's open orders
   */
  async getOpenOrders(): Promise<any[]> {
    this.ensureInitialized();

    const user = this.driftClient.getUser();
    return user.getOpenOrders();
  }

  /**
   * Get free collateral
   */
  async getFreeCollateral(): Promise<bigint> {
    this.ensureInitialized();

    const user = this.driftClient.getUser();
    return user.getFreeCollateral();
  }

  /**
   * Get total collateral
   */
  async getTotalCollateral(): Promise<bigint> {
    this.ensureInitialized();

    const user = this.driftClient.getUser();
    return user.getTotalCollateral();
  }

  /**
   * Get leverage
   */
  async getLeverage(): Promise<number> {
    this.ensureInitialized();

    const user = this.driftClient.getUser();
    return user.getLeverage().toNumber() / 10000; // Convert from basis points
  }

  /**
   * Get unrealized PnL
   */
  async getUnrealizedPnL(): Promise<bigint> {
    this.ensureInitialized();

    const user = this.driftClient.getUser();
    return user.getUnrealizedPNL();
  }

  // ==========================================================================
  // Market Data
  // ==========================================================================

  /**
   * Get oracle price for a perp market
   */
  async getOraclePrice(marketIndex: number): Promise<bigint> {
    this.ensureInitialized();

    const perpMarket = this.driftClient.getPerpMarketAccount(marketIndex);
    if (!perpMarket) {
      throw new Error(`Perp market ${marketIndex} not found`);
    }

    const oracleData = this.driftClient.getOracleDataForPerpMarket(marketIndex);
    return oracleData.price;
  }

  /**
   * Get mark price for a perp market
   */
  async getMarkPrice(marketIndex: number): Promise<bigint> {
    this.ensureInitialized();

    const driftSdk = await import('@drift-labs/sdk');
    const { calculateReservePrice } = driftSdk;

    const perpMarket = this.driftClient.getPerpMarketAccount(marketIndex);
    if (!perpMarket) {
      throw new Error(`Perp market ${marketIndex} not found`);
    }

    const price = calculateReservePrice(perpMarket, this.driftClient.getOracleDataForPerpMarket(marketIndex));
    // Convert BN to bigint
    return BigInt(price.toString());
  }

  // ==========================================================================
  // Deposits and Withdrawals
  // ==========================================================================

  /**
   * Deposit collateral
   */
  async deposit(
    amount: bigint,
    spotMarketIndex: number,
    userTokenAccount?: PublicKey
  ): Promise<string> {
    this.ensureInitialized();

    const txSig = await this.driftClient.deposit(
      amount,
      spotMarketIndex,
      userTokenAccount
    );

    await this.config.connection.confirmTransaction(txSig, 'confirmed');

    return txSig;
  }

  /**
   * Withdraw collateral
   */
  async withdraw(
    amount: bigint,
    spotMarketIndex: number,
    userTokenAccount?: PublicKey
  ): Promise<string> {
    this.ensureInitialized();

    const txSig = await this.driftClient.withdraw(
      amount,
      spotMarketIndex,
      userTokenAccount
    );

    await this.config.connection.confirmTransaction(txSig, 'confirmed');

    return txSig;
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  /**
   * Unsubscribe and cleanup
   */
  async disconnect(): Promise<void> {
    if (this.driftClient && this.isInitialized) {
      await this.driftClient.unsubscribe();
      this.isInitialized = false;
    }
  }

  /**
   * Check if client is initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get the underlying DriftClient (for advanced usage)
   */
  getDriftClient(): any {
    this.ensureInitialized();
    return this.driftClient;
  }
}

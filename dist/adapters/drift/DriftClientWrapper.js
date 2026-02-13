/**
 * Drift Protocol Client Wrapper
 *
 * Wraps the @drift-labs/sdk DriftClient for trading operations.
 * Provides a simplified interface for order management.
 */
import { Logger } from '../../core/logger.js';
/**
 * Wrapper around @drift-labs/sdk DriftClient
 *
 * This class provides a simplified interface for trading operations.
 * It handles SDK initialization, user account management, and order execution.
 */
export class DriftClientWrapper {
    config;
    // is only available after dynamic import() at runtime. Cannot use static type because the SDK uses
    // ESM-only distribution with native Node addons requiring dynamic loading.
    driftClient;
    isInitialized = false;
    logger = new Logger('DriftClientWrapper');
    constructor(config) {
        this.config = config;
    }
    /**
     * Initialize the Drift client and subscribe to user account
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // Dynamic import to handle ESM module loading
            const driftSdk = await import('@drift-labs/sdk');
            const { DriftClient, Wallet, BulkAccountLoader, getMarketsAndOraclesForSubscription } = driftSdk;
            // Create wallet from keypair (cast to any to handle different @solana/web3.js versions)
            const wallet = new Wallet(this.config.keypair);
            // Get markets and oracles to subscribe to
            const { perpMarketIndexes, spotMarketIndexes, oracleInfos } = getMarketsAndOraclesForSubscription(this.config.isDevnet ? 'devnet' : 'mainnet-beta');
            // Create bulk account loader for efficient RPC usage (cast to any for different web3.js versions)
            const bulkAccountLoader = new BulkAccountLoader(this.config.connection, 'confirmed', 1000 // 1 second polling interval
            );
            // Initialize Drift client (cast connection to any for different web3.js versions)
            this.driftClient = new DriftClient({
                connection: this.config.connection,
                wallet,
                programID: new (await import('@solana/web3.js')).PublicKey('dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH'),
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
                this.logger.warn('Drift user account does not exist. ' + 'Please deposit funds first to create an account.');
            }
            else {
                // Subscribe to user account updates
                await this.driftClient.addUser(this.config.subAccountId ?? 0);
            }
            this.isInitialized = true;
        }
        catch (error) {
            throw new Error(`Failed to initialize Drift client: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Ensure client is initialized
     */
    ensureInitialized() {
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
    async placePerpOrder(params) {
        this.ensureInitialized();
        const driftSdk = await import('@drift-labs/sdk');
        const { OrderType, PositionDirection, MarketType, OrderTriggerCondition, PostOnlyParams } = driftSdk;
        // Map order type
        const orderTypeMap = {
            market: OrderType.MARKET,
            limit: OrderType.LIMIT,
            triggerMarket: OrderType.TRIGGER_MARKET,
            triggerLimit: OrderType.TRIGGER_LIMIT,
            oracle: OrderType.ORACLE,
        };
        // Map direction
        const directionMap = {
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
            ...(params.builderIdx !== undefined && { builderIdx: params.builderIdx }),
            ...(params.builderFee !== undefined && { builderFee: params.builderFee }),
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
    async cancelOrder(orderId) {
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
    async cancelOrdersForMarket(marketIndex) {
        this.ensureInitialized();
        const driftSdk = await import('@drift-labs/sdk');
        const { MarketType } = driftSdk;
        const txSig = await this.driftClient.cancelOrders(MarketType.PERP, marketIndex);
        await this.config.connection.confirmTransaction(txSig, 'confirmed');
        // Get orders that were canceled
        const user = this.driftClient.getUser();
        const orders = user.getOpenOrders();
        const canceledIds = orders
            .filter((o) => o.marketIndex === marketIndex)
            .map((o) => o.orderId);
        return canceledIds.map((orderId) => ({
            txSig,
            orderId,
        }));
    }
    /**
     * Cancel all perp orders
     */
    async cancelAllPerpOrders() {
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
    async modifyOrder(orderId, newParams) {
        this.ensureInitialized();
        // Cancel existing order
        await this.cancelOrder(orderId);
        // Get the original order details
        const user = this.driftClient.getUser();
        const orders = user.getOpenOrders();
        const originalOrder = orders.find((o) => o.orderId === orderId);
        if (!originalOrder) {
            throw new Error(`Order ${orderId} not found`);
        }
        // Place new order with merged params
        const mergedParams = {
            orderType: newParams.orderType || originalOrder.orderType,
            marketIndex: newParams.marketIndex ?? originalOrder.marketIndex,
            marketType: 'perp',
            direction: newParams.direction || (originalOrder.direction.long ? 'long' : 'short'),
            baseAssetAmount: newParams.baseAssetAmount ?? originalOrder.baseAssetAmount,
            price: newParams.price ?? originalOrder.price,
            triggerPrice: newParams.triggerPrice ?? originalOrder.triggerPrice,
            reduceOnly: newParams.reduceOnly ?? originalOrder.reduceOnly,
            postOnly: newParams.postOnly ?? originalOrder.postOnly !== 'none',
        };
        return this.placePerpOrder(mergedParams);
    }
    // ==========================================================================
    // Account Data
    // ==========================================================================
    /**
     * Get user's perp positions
     */
    async getPerpPositions() {
        this.ensureInitialized();
        const user = this.driftClient.getUser();
        return user.getActivePerpPositions();
    }
    /**
     * Get user's spot positions (balances)
     */
    async getSpotPositions() {
        this.ensureInitialized();
        const user = this.driftClient.getUser();
        return user.getActiveSpotPositions();
    }
    /**
     * Get user's open orders
     */
    async getOpenOrders() {
        this.ensureInitialized();
        const user = this.driftClient.getUser();
        return user.getOpenOrders();
    }
    /**
     * Get free collateral
     */
    async getFreeCollateral() {
        this.ensureInitialized();
        const user = this.driftClient.getUser();
        return user.getFreeCollateral();
    }
    /**
     * Get total collateral
     */
    async getTotalCollateral() {
        this.ensureInitialized();
        const user = this.driftClient.getUser();
        return user.getTotalCollateral();
    }
    /**
     * Get leverage
     */
    async getLeverage() {
        this.ensureInitialized();
        const user = this.driftClient.getUser();
        return user.getLeverage().toNumber() / 10000; // Convert from basis points
    }
    /**
     * Get unrealized PnL
     */
    async getUnrealizedPnL() {
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
    async getOraclePrice(marketIndex) {
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
    async getMarkPrice(marketIndex) {
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
    async deposit(amount, spotMarketIndex, userTokenAccount) {
        this.ensureInitialized();
        const txSig = await this.driftClient.deposit(amount, spotMarketIndex, userTokenAccount);
        await this.config.connection.confirmTransaction(txSig, 'confirmed');
        return txSig;
    }
    /**
     * Withdraw collateral
     */
    async withdraw(amount, spotMarketIndex, userTokenAccount) {
        this.ensureInitialized();
        const txSig = await this.driftClient.withdraw(amount, spotMarketIndex, userTokenAccount);
        await this.config.connection.confirmTransaction(txSig, 'confirmed');
        return txSig;
    }
    // ==========================================================================
    // Cleanup
    // ==========================================================================
    /**
     * Unsubscribe and cleanup
     */
    async disconnect() {
        if (this.driftClient && this.isInitialized) {
            await this.driftClient.unsubscribe();
            this.isInitialized = false;
        }
    }
    /**
     * Check if client is initialized
     */
    getIsInitialized() {
        return this.isInitialized;
    }
    /**
     * Get the underlying DriftClient (for advanced usage)
     */
    getDriftClient() {
        this.ensureInitialized();
        return this.driftClient;
    }
}
//# sourceMappingURL=DriftClientWrapper.js.map
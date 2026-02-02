/**
 * Drift Protocol Client Wrapper
 *
 * Wraps the @drift-labs/sdk DriftClient for trading operations.
 * Provides a simplified interface for order management.
 */
import type { Connection, PublicKey, Keypair } from '@solana/web3.js';
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
export declare class DriftClientWrapper {
    private readonly config;
    private driftClient;
    private isInitialized;
    private userAccountPublicKey?;
    constructor(config: DriftClientWrapperConfig);
    /**
     * Initialize the Drift client and subscribe to user account
     */
    initialize(): Promise<void>;
    /**
     * Ensure client is initialized
     */
    private ensureInitialized;
    /**
     * Place a perp order
     */
    placePerpOrder(params: DriftOrderParams): Promise<PlaceOrderResult>;
    /**
     * Cancel an order by ID
     */
    cancelOrder(orderId: number): Promise<CancelOrderResult>;
    /**
     * Cancel all orders for a market
     */
    cancelOrdersForMarket(marketIndex: number): Promise<CancelOrderResult[]>;
    /**
     * Cancel all perp orders
     */
    cancelAllPerpOrders(): Promise<string>;
    /**
     * Modify an existing order
     */
    modifyOrder(orderId: number, newParams: Partial<DriftOrderParams>): Promise<PlaceOrderResult>;
    /**
     * Get user's perp positions
     */
    getPerpPositions(): Promise<any[]>;
    /**
     * Get user's spot positions (balances)
     */
    getSpotPositions(): Promise<any[]>;
    /**
     * Get user's open orders
     */
    getOpenOrders(): Promise<any[]>;
    /**
     * Get free collateral
     */
    getFreeCollateral(): Promise<bigint>;
    /**
     * Get total collateral
     */
    getTotalCollateral(): Promise<bigint>;
    /**
     * Get leverage
     */
    getLeverage(): Promise<number>;
    /**
     * Get unrealized PnL
     */
    getUnrealizedPnL(): Promise<bigint>;
    /**
     * Get oracle price for a perp market
     */
    getOraclePrice(marketIndex: number): Promise<bigint>;
    /**
     * Get mark price for a perp market
     */
    getMarkPrice(marketIndex: number): Promise<bigint>;
    /**
     * Deposit collateral
     */
    deposit(amount: bigint, spotMarketIndex: number, userTokenAccount?: PublicKey): Promise<string>;
    /**
     * Withdraw collateral
     */
    withdraw(amount: bigint, spotMarketIndex: number, userTokenAccount?: PublicKey): Promise<string>;
    /**
     * Unsubscribe and cleanup
     */
    disconnect(): Promise<void>;
    /**
     * Check if client is initialized
     */
    getIsInitialized(): boolean;
    /**
     * Get the underlying DriftClient (for advanced usage)
     */
    getDriftClient(): any;
}
//# sourceMappingURL=DriftClientWrapper.d.ts.map
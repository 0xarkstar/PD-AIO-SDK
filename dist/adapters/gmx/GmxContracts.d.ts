/**
 * GMX v2 Contract Interfaces
 *
 * Provides typed interfaces for GMX v2 smart contracts on Arbitrum and Avalanche.
 * Uses ethers.js for contract interactions.
 */
import { ethers, type Provider, type Signer, type TransactionResponse } from 'ethers';
import { GMX_CONTRACTS } from './constants.js';
import type { GmxChain } from './GmxAdapter.js';
import type { GmxCreateOrderParams } from './types.js';
/**
 * Manages GMX v2 contract instances and interactions
 */
export declare class GmxContracts {
    private readonly chain;
    private readonly provider;
    private readonly signer?;
    private readonly addresses;
    private exchangeRouter?;
    private reader?;
    private dataStore?;
    private orderVault?;
    constructor(chain: GmxChain, provider: Provider, signer?: Signer);
    /**
     * Get ExchangeRouter contract instance
     */
    getExchangeRouter(): ethers.Contract;
    /**
     * Get Reader contract instance
     */
    getReader(): ethers.Contract;
    /**
     * Get DataStore contract instance
     */
    getDataStore(): ethers.Contract;
    /**
     * Get OrderVault contract instance
     */
    getOrderVault(): ethers.Contract;
    /**
     * Create a new order
     */
    createOrder(params: GmxCreateOrderParams, executionFee: bigint): Promise<TransactionResponse>;
    /**
     * Cancel an existing order
     */
    cancelOrder(orderKey: string): Promise<TransactionResponse>;
    /**
     * Send WETH/WAVAX for order execution fee
     */
    sendWnt(receiver: string, amount: bigint): Promise<TransactionResponse>;
    /**
     * Send tokens to a receiver
     */
    sendTokens(token: string, receiver: string, amount: bigint): Promise<TransactionResponse>;
    /**
     * Get account positions
     */
    getAccountPositions(account: string, start?: number, end?: number): Promise<GmxPositionData[]>;
    /**
     * Get account orders
     */
    getAccountOrders(account: string, start?: number, end?: number): Promise<GmxOrderData[]>;
    /**
     * Get a specific position
     */
    getPosition(positionKey: string): Promise<GmxPositionData | null>;
    /**
     * Calculate position key
     */
    getPositionKey(account: string, market: string, collateralToken: string, isLong: boolean): string;
    /**
     * Get a uint value from DataStore
     */
    getDataStoreUint(key: string): Promise<bigint>;
    /**
     * Get execution fee for a given gas limit
     */
    getExecutionFee(gasLimit: bigint): Promise<bigint>;
    /**
     * Encode order type to bytes32
     */
    private encodeOrderType;
    /**
     * Encode decrease position swap type
     */
    private encodeDecreaseSwapType;
    /**
     * Get contract addresses
     */
    getAddresses(): (typeof GMX_CONTRACTS)[GmxChain];
    /**
     * Get chain ID
     */
    getChainId(): number;
}
/**
 * Position data from contract
 */
export interface GmxPositionData {
    account: string;
    market: string;
    collateralToken: string;
    isLong: boolean;
    sizeInUsd: bigint;
    sizeInTokens: bigint;
    collateralAmount: bigint;
    borrowingFactor: bigint;
    fundingFeeAmountPerSize: bigint;
    longTokenClaimableFundingAmountPerSize: bigint;
    shortTokenClaimableFundingAmountPerSize: bigint;
    increasedAtBlock: bigint;
    decreasedAtBlock: bigint;
}
/**
 * Order data from contract
 */
export interface GmxOrderData {
    key: string;
    account: string;
    receiver: string;
    callbackContract: string;
    uiFeeReceiver: string;
    market: string;
    initialCollateralToken: string;
    swapPath: string[];
    orderType: number;
    decreasePositionSwapType: number;
    sizeDeltaUsd: bigint;
    initialCollateralDeltaAmount: bigint;
    triggerPrice: bigint;
    acceptablePrice: bigint;
    executionFee: bigint;
    callbackGasLimit: bigint;
    minOutputAmount: bigint;
    updatedAtBlock: bigint;
    isLong: boolean;
    isFrozen: boolean;
}
//# sourceMappingURL=GmxContracts.d.ts.map
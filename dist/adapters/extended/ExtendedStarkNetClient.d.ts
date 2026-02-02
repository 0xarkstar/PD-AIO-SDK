/**
 * Extended StarkNet Client
 *
 * StarkNet blockchain integration for Extended exchange
 * Handles on-chain position tracking and transaction submission
 */
import { type RawArgs } from 'starknet';
import type { ExtendedStarkNetState, ExtendedStarkNetTransaction } from './types.js';
export interface ExtendedStarkNetConfig {
    network: 'mainnet' | 'testnet';
    privateKey?: string;
    accountAddress?: string;
    rpcUrl?: string;
}
/**
 * StarkNet client for Extended exchange
 */
export declare class ExtendedStarkNetClient {
    private readonly provider;
    private account?;
    private readonly network;
    private readonly logger;
    constructor(config: ExtendedStarkNetConfig);
    /**
     * Initialize StarkNet account with private key
     */
    private initializeAccount;
    /**
     * Check if account is initialized
     */
    isAccountInitialized(): boolean;
    /**
     * Get account address
     */
    getAccountAddress(): string | undefined;
    /**
     * Get current block number
     */
    getBlockNumber(): Promise<number>;
    private static readonly ETH_CONTRACT_ADDRESS;
    /**
     * Get account state from StarkNet
     */
    getAccountState(address?: string): Promise<ExtendedStarkNetState>;
    /**
     * Get transaction status
     */
    getTransaction(txHash: string): Promise<ExtendedStarkNetTransaction>;
    /**
     * Map StarkNet transaction status to our format
     */
    private mapTransactionStatus;
    /**
     * Wait for transaction confirmation
     */
    waitForTransaction(txHash: string, confirmations?: number, timeoutMs?: number): Promise<ExtendedStarkNetTransaction>;
    /**
     * Call contract view function (read-only)
     */
    callContract(contractAddress: string, entrypoint: string, calldata?: RawArgs): Promise<string[]>;
    /**
     * Execute contract function (state-changing)
     * Requires initialized account
     */
    executeContract(contractAddress: string, entrypoint: string, calldata?: RawArgs): Promise<string>;
    /**
     * Get positions from StarkNet contract
     * (Placeholder - actual implementation depends on Extended's contract ABI)
     */
    getPositionsFromContract(contractAddress: string, accountAddress?: string): Promise<string[]>;
    /**
     * Submit order to StarkNet contract
     * (Placeholder - actual implementation depends on Extended's contract ABI)
     */
    submitOrderToContract(contractAddress: string, orderData: any): Promise<string>;
    /**
     * Get contract info
     */
    getContractInfo(contractAddress: string): Promise<any>;
    /**
     * Estimate fee for contract execution
     */
    estimateFee(contractAddress: string, entrypoint: string, calldata?: RawArgs): Promise<bigint>;
    /**
     * Cleanup resources
     */
    disconnect(): Promise<void>;
}
//# sourceMappingURL=ExtendedStarkNetClient.d.ts.map
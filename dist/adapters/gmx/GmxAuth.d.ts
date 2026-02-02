/**
 * GMX v2 Authentication
 *
 * Handles Ethereum wallet authentication for GMX v2 trading.
 * GMX uses on-chain transactions via the ExchangeRouter contract.
 */
import { ethers, type Signer, type Provider } from 'ethers';
import type { IAuthStrategy, RequestParams, AuthenticatedRequest } from '../../types/adapter.js';
import type { GmxChain } from './GmxAdapter.js';
/**
 * Configuration for GMX authentication
 */
export interface GmxAuthConfig {
    /** Ethereum private key */
    privateKey?: string;
    /** Pre-configured ethers Wallet instance */
    wallet?: ethers.Wallet;
    /** Wallet address (for read-only operations) */
    walletAddress?: string;
    /** Chain to use */
    chain: GmxChain;
    /** Custom RPC endpoint */
    rpcEndpoint?: string;
}
/**
 * Ethereum wallet authentication for GMX v2
 *
 * GMX v2 uses on-chain Ethereum transactions, so authentication
 * is done via transaction signing rather than API headers.
 *
 * For read operations (positions, balances), only the wallet address is needed.
 * For write operations (trading), the private key/wallet is required for signing.
 */
export declare class GmxAuth implements IAuthStrategy {
    private readonly wallet?;
    private readonly walletAddress?;
    private readonly chain;
    private readonly provider;
    private readonly rpcEndpoint;
    constructor(config: GmxAuthConfig);
    /**
     * Sign a request (required by IAuthStrategy interface)
     * GMX uses on-chain transaction signing, not HTTP request signing
     */
    sign(request: RequestParams): Promise<AuthenticatedRequest>;
    /**
     * GMX doesn't use HTTP header authentication
     * All authentication is done via transaction signing
     */
    getHeaders(): Record<string, string>;
    /**
     * Sign a message
     */
    signMessage(message: string): Promise<string>;
    /**
     * Sign typed data (EIP-712)
     */
    signTypedData(domain: ethers.TypedDataDomain, types: Record<string, ethers.TypedDataField[]>, value: Record<string, unknown>): Promise<string>;
    /**
     * Get the wallet address
     */
    getWalletAddress(): string | undefined;
    /**
     * Get the wallet instance (for contract interactions)
     */
    getWallet(): ethers.Wallet | undefined;
    /**
     * Get the signer (for contract interactions)
     */
    getSigner(): Signer | undefined;
    /**
     * Get the provider
     */
    getProvider(): Provider;
    /**
     * Get the chain
     */
    getChain(): GmxChain;
    /**
     * Get chain ID
     */
    getChainId(): number;
    /**
     * Get RPC endpoint
     */
    getRpcEndpoint(): string;
    /**
     * Check if authentication is configured for trading
     */
    canSign(): boolean;
    /**
     * Check if authentication is configured for read operations
     */
    canRead(): boolean;
    /**
     * Estimate gas for a transaction
     */
    estimateGas(tx: ethers.TransactionRequest): Promise<bigint>;
    /**
     * Get current gas price
     */
    getGasPrice(): Promise<bigint>;
    /**
     * Get current block number
     */
    getBlockNumber(): Promise<number>;
    /**
     * Wait for a transaction to be confirmed
     */
    waitForTransaction(txHash: string, confirmations?: number): Promise<ethers.TransactionReceipt | null>;
    /**
     * Get ETH balance of wallet
     */
    getBalance(): Promise<bigint>;
    /**
     * Get token balance
     */
    getTokenBalance(tokenAddress: string): Promise<bigint>;
    /**
     * Get token allowance
     */
    getTokenAllowance(tokenAddress: string, spenderAddress: string): Promise<bigint>;
    /**
     * Approve token spending
     */
    approveToken(tokenAddress: string, spenderAddress: string, amount: bigint): Promise<ethers.TransactionResponse>;
}
/**
 * Validate Ethereum address format
 */
export declare function isValidEthereumAddress(address: string): boolean;
/**
 * Validate Ethereum private key format
 */
export declare function isValidEthereumPrivateKey(key: string): boolean;
//# sourceMappingURL=GmxAuth.d.ts.map
/**
 * Jupiter Perps Authentication
 *
 * Handles Solana wallet authentication for Jupiter Perps trading.
 * Jupiter Perps requires on-chain transactions signed by the wallet.
 */
import type { IAuthStrategy, RequestParams, AuthenticatedRequest } from '../../types/adapter.js';
type Connection = import('@solana/web3.js').Connection;
type Keypair = import('@solana/web3.js').Keypair;
type PublicKey = import('@solana/web3.js').PublicKey;
type Transaction = import('@solana/web3.js').Transaction;
/**
 * Configuration for Jupiter authentication
 */
export interface JupiterAuthConfig {
    /** Solana private key (base58, JSON array, or Uint8Array) */
    privateKey?: string | Uint8Array;
    /** Wallet address (public key) - for read-only operations */
    walletAddress?: string;
    /** RPC endpoint for Solana */
    rpcEndpoint?: string;
}
/**
 * Solana wallet authentication for Jupiter Perps
 *
 * Jupiter Perps uses on-chain Solana transactions, so authentication
 * is done via transaction signing rather than API headers.
 *
 * For read operations (positions, balances), only the wallet address is needed.
 * For write operations (trading), the private key is required for signing.
 */
export declare class JupiterAuth implements IAuthStrategy {
    private keypair?;
    private walletAddress?;
    private publicKey?;
    private readonly rpcEndpoint;
    private connection?;
    private isInitialized;
    private readonly logger;
    constructor(config: JupiterAuthConfig);
    /**
     * Initialize keypair from private key
     */
    private initializeFromPrivateKey;
    /**
     * Async initialization of keypair (for dynamic import)
     */
    private initKeypairAsync;
    /**
     * Ensure async initialization is complete
     */
    ensureInitialized(): Promise<void>;
    /**
     * Sign a request (required by IAuthStrategy interface)
     * Jupiter uses on-chain transaction signing, not HTTP request signing
     */
    sign(request: RequestParams): Promise<AuthenticatedRequest>;
    /**
     * Jupiter doesn't use HTTP header authentication
     * All authentication is done via transaction signing
     */
    getHeaders(): Record<string, string>;
    /**
     * Sign a message
     */
    signMessage(message: string): Promise<Uint8Array>;
    /**
     * Sign bytes (for transaction signing)
     */
    signBytes(bytes: Uint8Array): Promise<Uint8Array>;
    /**
     * Sign a Solana transaction
     */
    signTransaction(transaction: Transaction): Promise<Transaction>;
    /**
     * Sign multiple Solana transactions
     */
    signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
    /**
     * Get the wallet address
     */
    getWalletAddress(): string | undefined;
    /**
     * Get the public key
     */
    getPublicKey(): PublicKey | undefined;
    /**
     * Get the keypair (for SDK usage)
     */
    getKeypair(): Keypair | undefined;
    /**
     * Check if authentication is configured for trading
     */
    canSign(): boolean;
    /**
     * Check if authentication is configured for read operations
     */
    canRead(): boolean;
    /**
     * Get RPC endpoint
     */
    getRpcEndpoint(): string;
    /**
     * Get Solana connection
     */
    getConnection(): Promise<Connection>;
    /**
     * Get SOL balance
     */
    getSolBalance(): Promise<number>;
    /**
     * Get token balance for an SPL token
     */
    getTokenBalance(tokenMint: string): Promise<number>;
    /**
     * Get associated token account address
     */
    getAssociatedTokenAddress(tokenMint: string): Promise<string>;
    /**
     * Parse private key from various formats
     */
    private parsePrivateKey;
}
/**
 * Validate Solana address format
 */
export declare function isValidSolanaAddress(address: string): boolean;
/**
 * Validate Solana private key format
 */
export declare function isValidSolanaPrivateKey(key: string | Uint8Array): boolean;
export {};
//# sourceMappingURL=JupiterAuth.d.ts.map
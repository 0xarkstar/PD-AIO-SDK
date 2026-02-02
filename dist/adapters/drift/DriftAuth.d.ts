/**
 * Drift Protocol Authentication
 *
 * Handles Solana wallet authentication for Drift Protocol trading.
 * Drift uses on-chain transactions signed by the wallet.
 */
import type { IAuthStrategy, RequestParams, AuthenticatedRequest } from '../../types/adapter.js';
type Connection = import('@solana/web3.js').Connection;
type Keypair = import('@solana/web3.js').Keypair;
type PublicKey = import('@solana/web3.js').PublicKey;
/**
 * Configuration for Drift authentication
 */
export interface DriftAuthConfig {
    /** Solana private key (base58 or Uint8Array) */
    privateKey?: string | Uint8Array;
    /** Wallet address (public key) - for read-only operations */
    walletAddress?: string;
    /** Sub-account ID (default: 0) */
    subAccountId?: number;
    /** RPC endpoint for Solana */
    rpcEndpoint?: string;
    /** Whether to use devnet */
    isDevnet?: boolean;
}
/**
 * Solana wallet authentication for Drift Protocol
 *
 * Drift uses on-chain Solana transactions, so authentication
 * is done via transaction signing rather than API headers.
 *
 * For read operations (positions, balances), only the wallet address is needed.
 * For write operations (trading), the private key is required for signing.
 */
export declare class DriftAuth implements IAuthStrategy {
    private keypair?;
    private walletAddress?;
    private publicKey?;
    private readonly subAccountId;
    private readonly rpcEndpoint;
    private readonly isDevnet;
    private connection?;
    private isInitialized;
    constructor(config: DriftAuthConfig);
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
     * Drift uses on-chain transaction signing, not HTTP request signing
     */
    sign(request: RequestParams): Promise<AuthenticatedRequest>;
    /**
     * Drift doesn't use HTTP header authentication
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
     * Get sub-account ID
     */
    getSubAccountId(): number;
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
     * Get whether using devnet
     */
    getIsDevnet(): boolean;
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
     * Create user account PDA info
     */
    getUserAccountInfo(): {
        authority: string;
        subAccountId: number;
    } | undefined;
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
//# sourceMappingURL=DriftAuth.d.ts.map
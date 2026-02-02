/**
 * Solana RPC Client for Jupiter Perps
 *
 * Provides Solana blockchain interaction for Jupiter Perpetuals trading.
 * Handles account fetching, transaction building, and submission.
 */
type Connection = import('@solana/web3.js').Connection;
type Transaction = import('@solana/web3.js').Transaction;
type TransactionInstruction = import('@solana/web3.js').TransactionInstruction;
type Keypair = import('@solana/web3.js').Keypair;
type ConfirmOptions = import('@solana/web3.js').ConfirmOptions;
type AccountInfo = import('@solana/web3.js').AccountInfo<Buffer>;
/**
 * Solana client configuration
 */
export interface SolanaClientConfig {
    /** RPC endpoint URL */
    rpcEndpoint?: string;
    /** Commitment level */
    commitment?: 'processed' | 'confirmed' | 'finalized';
    /** Custom confirm options */
    confirmOptions?: ConfirmOptions;
}
/**
 * Transaction result
 */
export interface TransactionResult {
    /** Transaction signature */
    signature: string;
    /** Slot number */
    slot: number;
    /** Block time (Unix timestamp) */
    blockTime?: number;
}
/**
 * Account fetch result
 */
export interface AccountFetchResult<T> {
    /** Account public key */
    pubkey: string;
    /** Parsed account data */
    data: T;
    /** Lamports (SOL balance) */
    lamports: number;
    /** Account owner program */
    owner: string;
}
/**
 * Solana RPC Client for Jupiter Perps operations
 *
 * Provides low-level Solana interaction:
 * - Account fetching and parsing
 * - Transaction building and signing
 * - Transaction submission and confirmation
 */
export declare class SolanaClient {
    private connection?;
    private readonly config;
    private isInitialized;
    constructor(config?: SolanaClientConfig);
    /**
     * Initialize the Solana connection
     */
    initialize(): Promise<void>;
    /**
     * Ensure connection is initialized
     */
    private ensureInitialized;
    /**
     * Get the connection instance
     */
    getConnection(): Connection;
    /**
     * Fetch account info
     */
    getAccountInfo(pubkey: string): Promise<AccountInfo | null>;
    /**
     * Fetch multiple accounts
     */
    getMultipleAccountsInfo(pubkeys: string[]): Promise<(AccountInfo | null)[]>;
    /**
     * Get SOL balance for an address
     */
    getBalance(pubkey: string): Promise<number>;
    /**
     * Get token account balance
     */
    getTokenBalance(tokenAccount: string): Promise<number>;
    /**
     * Get token accounts by owner
     */
    getTokenAccountsByOwner(owner: string, mint?: string): Promise<Array<{
        pubkey: string;
        balance: number;
        mint: string;
    }>>;
    /**
     * Fetch program accounts with filters
     */
    getProgramAccounts(programId: string, filters?: Array<{
        memcmp?: {
            offset: number;
            bytes: string;
        };
        dataSize?: number;
    }>): Promise<Array<{
        pubkey: string;
        account: AccountInfo;
    }>>;
    /**
     * Create a new transaction
     */
    createTransaction(): Promise<Transaction>;
    /**
     * Add instructions to a transaction
     */
    addInstructions(transaction: Transaction, instructions: TransactionInstruction[]): Promise<Transaction>;
    /**
     * Sign and send a transaction
     */
    sendTransaction(transaction: Transaction, signers: Keypair[]): Promise<TransactionResult>;
    /**
     * Simulate a transaction (for testing without execution)
     */
    simulateTransaction(transaction: Transaction): Promise<{
        success: boolean;
        logs: string[];
        unitsConsumed?: number;
        error?: string;
    }>;
    /**
     * Get transaction details
     */
    getTransaction(signature: string): Promise<{
        slot: number;
        blockTime: number | null;
        err: any;
        logs: string[];
    } | null>;
    /**
     * Get recent blockhash
     */
    getLatestBlockhash(): Promise<{
        blockhash: string;
        lastValidBlockHeight: number;
    }>;
    /**
     * Find Program Derived Address
     */
    findProgramAddress(seeds: (Uint8Array | Buffer)[], programId: string): Promise<{
        pubkey: string;
        bump: number;
    }>;
    /**
     * Create PDA with bump
     */
    createProgramAddress(seeds: (Uint8Array | Buffer)[], programId: string): Promise<string>;
    /**
     * Get Jupiter Perps position accounts for an owner
     */
    getJupiterPositions(owner: string): Promise<Array<{
        pubkey: string;
        account: AccountInfo;
    }>>;
    /**
     * Get Jupiter pool account
     */
    getJupiterPool(): Promise<{
        pubkey: string;
        account: AccountInfo;
    } | null>;
    /**
     * Get custody account for a token
     */
    getJupiterCustody(tokenMint: string): Promise<{
        pubkey: string;
        account: AccountInfo;
    } | null>;
    /**
     * Check if the client is initialized
     */
    isReady(): boolean;
    /**
     * Get the RPC endpoint
     */
    getRpcEndpoint(): string;
    /**
     * Get slot
     */
    getSlot(): Promise<number>;
    /**
     * Get block time for a slot
     */
    getBlockTime(slot: number): Promise<number | null>;
    /**
     * Disconnect (cleanup)
     */
    disconnect(): Promise<void>;
}
/**
 * Create a Solana client instance
 */
export declare function createSolanaClient(config?: SolanaClientConfig): SolanaClient;
export {};
//# sourceMappingURL=solana.d.ts.map
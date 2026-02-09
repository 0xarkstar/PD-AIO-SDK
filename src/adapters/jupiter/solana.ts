/**
 * Solana RPC Client for Jupiter Perps
 *
 * Provides Solana blockchain interaction for Jupiter Perpetuals trading.
 * Handles account fetching, transaction building, and submission.
 */

// We'll import these dynamically to handle the ESM module properly
type Connection = import('@solana/web3.js').Connection;
type Transaction = import('@solana/web3.js').Transaction;
type TransactionInstruction = import('@solana/web3.js').TransactionInstruction;
type Keypair = import('@solana/web3.js').Keypair;
type ConfirmOptions = import('@solana/web3.js').ConfirmOptions;
type AccountInfo = import('@solana/web3.js').AccountInfo<Buffer>;

import { SOLANA_DEFAULT_RPC, JUPITER_PERPS_PROGRAM_ID } from './constants.js';

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
export class SolanaClient {
  private connection?: Connection;
  private readonly config: Required<SolanaClientConfig>;
  private isInitialized = false;

  constructor(config: SolanaClientConfig = {}) {
    this.config = {
      rpcEndpoint: config.rpcEndpoint || SOLANA_DEFAULT_RPC,
      commitment: config.commitment || 'confirmed',
      confirmOptions: config.confirmOptions || {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      },
    };
  }

  /**
   * Initialize the Solana connection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const { Connection } = await import('@solana/web3.js');
      this.connection = new Connection(this.config.rpcEndpoint, this.config.commitment);
      this.isInitialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Solana connection: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Ensure connection is initialized
   */
  private ensureInitialized(): Connection {
    if (!this.isInitialized || !this.connection) {
      throw new Error('SolanaClient not initialized. Call initialize() first.');
    }
    return this.connection;
  }

  /**
   * Get the connection instance
   */
  getConnection(): Connection {
    return this.ensureInitialized();
  }

  // ==========================================================================
  // Account Operations
  // ==========================================================================

  /**
   * Fetch account info
   */
  async getAccountInfo(pubkey: string): Promise<AccountInfo | null> {
    const connection = this.ensureInitialized();
    const { PublicKey } = await import('@solana/web3.js');
    const publicKey = new PublicKey(pubkey);
    return connection.getAccountInfo(publicKey);
  }

  /**
   * Fetch multiple accounts
   */
  async getMultipleAccountsInfo(pubkeys: string[]): Promise<(AccountInfo | null)[]> {
    const connection = this.ensureInitialized();
    const { PublicKey } = await import('@solana/web3.js');
    const publicKeys = pubkeys.map((pk) => new PublicKey(pk));
    return connection.getMultipleAccountsInfo(publicKeys);
  }

  /**
   * Get SOL balance for an address
   */
  async getBalance(pubkey: string): Promise<number> {
    const connection = this.ensureInitialized();
    const { PublicKey } = await import('@solana/web3.js');
    const publicKey = new PublicKey(pubkey);
    const lamports = await connection.getBalance(publicKey);
    return lamports / 1e9; // Convert lamports to SOL
  }

  /**
   * Get token account balance
   */
  async getTokenBalance(tokenAccount: string): Promise<number> {
    const connection = this.ensureInitialized();
    const { PublicKey } = await import('@solana/web3.js');
    const publicKey = new PublicKey(tokenAccount);
    const balance = await connection.getTokenAccountBalance(publicKey);
    return parseFloat(balance.value.amount) / Math.pow(10, balance.value.decimals);
  }

  /**
   * Get token accounts by owner
   */
  async getTokenAccountsByOwner(
    owner: string,
    mint?: string
  ): Promise<Array<{ pubkey: string; balance: number; mint: string }>> {
    const connection = this.ensureInitialized();
    const { PublicKey } = await import('@solana/web3.js');
    const ownerPubkey = new PublicKey(owner);
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

    const filter = mint ? { mint: new PublicKey(mint) } : { programId: TOKEN_PROGRAM_ID };

    const accounts = await connection.getTokenAccountsByOwner(ownerPubkey, filter);

    return accounts.value.map(
      (account: { pubkey: { toBase58: () => string }; account: { data: Buffer } }) => {
        // Parse token account data
        const data = account.account.data;
        // Token account layout: 32 bytes mint, 32 bytes owner, 8 bytes amount
        const mintBytes = data.slice(0, 32);
        const amountBytes = data.slice(64, 72);

        const mintPubkey = new PublicKey(mintBytes);
        const amount = Buffer.from(amountBytes).readBigUInt64LE();

        return {
          pubkey: account.pubkey.toBase58(),
          balance: Number(amount),
          mint: mintPubkey.toBase58(),
        };
      }
    );
  }

  /**
   * Fetch program accounts with filters
   */
  async getProgramAccounts(
    programId: string,
    filters?: Array<{ memcmp?: { offset: number; bytes: string }; dataSize?: number }>
  ): Promise<Array<{ pubkey: string; account: AccountInfo }>> {
    const connection = this.ensureInitialized();
    const { PublicKey } = await import('@solana/web3.js');
    const programPubkey = new PublicKey(programId);

    const accounts = await connection.getProgramAccounts(programPubkey, {
      filters: filters
        ?.map((f) => {
          if (f.memcmp) {
            return { memcmp: f.memcmp };
          }
          if (f.dataSize !== undefined) {
            return { dataSize: f.dataSize };
          }
          return undefined;
        })
        .filter(
          (f): f is { memcmp: { offset: number; bytes: string } } | { dataSize: number } =>
            f !== undefined
        ),
    });

    return accounts.map(
      (account: { pubkey: { toBase58: () => string }; account: AccountInfo }) => ({
        pubkey: account.pubkey.toBase58(),
        account: account.account,
      })
    );
  }

  // ==========================================================================
  // Transaction Operations
  // ==========================================================================

  /**
   * Create a new transaction
   */
  async createTransaction(): Promise<Transaction> {
    const { Transaction } = await import('@solana/web3.js');
    const connection = this.ensureInitialized();

    const transaction = new Transaction();
    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

    return transaction;
  }

  /**
   * Add instructions to a transaction
   */
  async addInstructions(
    transaction: Transaction,
    instructions: TransactionInstruction[]
  ): Promise<Transaction> {
    for (const ix of instructions) {
      transaction.add(ix);
    }
    return transaction;
  }

  /**
   * Sign and send a transaction
   */
  async sendTransaction(transaction: Transaction, signers: Keypair[]): Promise<TransactionResult> {
    const connection = this.ensureInitialized();

    // Sign the transaction
    if (signers.length > 0) {
      transaction.sign(...signers);
    }

    // Send the transaction
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: this.config.commitment,
      maxRetries: 3,
    });

    // Confirm the transaction
    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: transaction.lastValidBlockHeight!,
      },
      this.config.commitment
    );

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    return {
      signature,
      slot: confirmation.context.slot,
    };
  }

  /**
   * Simulate a transaction (for testing without execution)
   */
  async simulateTransaction(transaction: Transaction): Promise<{
    success: boolean;
    logs: string[];
    unitsConsumed?: number;
    error?: string;
  }> {
    const connection = this.ensureInitialized();

    const simulation = await connection.simulateTransaction(transaction);

    return {
      success: simulation.value.err === null,
      logs: simulation.value.logs || [],
      unitsConsumed: simulation.value.unitsConsumed,
      error: simulation.value.err ? JSON.stringify(simulation.value.err) : undefined,
    };
  }

  /**
   * Get transaction details
   */
  async getTransaction(signature: string): Promise<{
    slot: number;
    blockTime: number | null;
    err: any;
    logs: string[];
  } | null> {
    const connection = this.ensureInitialized();
    const commitment =
      this.config.commitment === 'processed' ? 'confirmed' : this.config.commitment;
    const tx = await connection.getTransaction(signature, {
      commitment: commitment,
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return null;
    }

    return {
      slot: tx.slot,
      blockTime: tx.blockTime ?? null,
      err: tx.meta?.err,
      logs: tx.meta?.logMessages || [],
    };
  }

  /**
   * Get recent blockhash
   */
  async getLatestBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
    const connection = this.ensureInitialized();
    return connection.getLatestBlockhash();
  }

  // ==========================================================================
  // PDA Operations
  // ==========================================================================

  /**
   * Find Program Derived Address
   */
  async findProgramAddress(
    seeds: (Uint8Array | Buffer)[],
    programId: string
  ): Promise<{ pubkey: string; bump: number }> {
    const { PublicKey } = await import('@solana/web3.js');
    const programPubkey = new PublicKey(programId);

    const [pubkey, bump] = await PublicKey.findProgramAddress(seeds, programPubkey);

    return {
      pubkey: pubkey.toBase58(),
      bump,
    };
  }

  /**
   * Create PDA with bump
   */
  async createProgramAddress(seeds: (Uint8Array | Buffer)[], programId: string): Promise<string> {
    const { PublicKey } = await import('@solana/web3.js');
    const programPubkey = new PublicKey(programId);

    const pubkey = await PublicKey.createProgramAddress(seeds, programPubkey);
    return pubkey.toBase58();
  }

  // ==========================================================================
  // Jupiter-specific Operations
  // ==========================================================================

  /**
   * Get Jupiter Perps position accounts for an owner
   */
  async getJupiterPositions(
    owner: string
  ): Promise<Array<{ pubkey: string; account: AccountInfo }>> {
    const { PublicKey } = await import('@solana/web3.js');
    const ownerBytes = new PublicKey(owner).toBuffer();

    // Position account discriminator (first 8 bytes)
    // This would be derived from the Anchor IDL
    const POSITION_DISCRIMINATOR = Buffer.from([
      0x56,
      0x7a,
      0x88,
      0x4c,
      0x5c,
      0x47,
      0x12,
      0x8f, // Example - actual value from IDL
    ]);

    return this.getProgramAccounts(JUPITER_PERPS_PROGRAM_ID, [
      // Filter by discriminator
      {
        memcmp: {
          offset: 0,
          bytes: POSITION_DISCRIMINATOR.toString('base64'),
        },
      },
      // Filter by owner
      {
        memcmp: {
          offset: 8, // After discriminator
          bytes: ownerBytes.toString('base64'),
        },
      },
    ]);
  }

  /**
   * Get Jupiter pool account
   */
  async getJupiterPool(): Promise<{ pubkey: string; account: AccountInfo } | null> {
    // The pool address is a known PDA
    const { pubkey } = await this.findProgramAddress(
      [Buffer.from('pool')],
      JUPITER_PERPS_PROGRAM_ID
    );

    const account = await this.getAccountInfo(pubkey);
    if (!account) {
      return null;
    }

    return { pubkey, account };
  }

  /**
   * Get custody account for a token
   */
  async getJupiterCustody(
    tokenMint: string
  ): Promise<{ pubkey: string; account: AccountInfo } | null> {
    const { PublicKey } = await import('@solana/web3.js');
    const mintPubkey = new PublicKey(tokenMint);

    const { pubkey } = await this.findProgramAddress(
      [Buffer.from('custody'), mintPubkey.toBuffer()],
      JUPITER_PERPS_PROGRAM_ID
    );

    const account = await this.getAccountInfo(pubkey);
    if (!account) {
      return null;
    }

    return { pubkey, account };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if the client is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get the RPC endpoint
   */
  getRpcEndpoint(): string {
    return this.config.rpcEndpoint;
  }

  /**
   * Get slot
   */
  async getSlot(): Promise<number> {
    const connection = this.ensureInitialized();
    return connection.getSlot();
  }

  /**
   * Get block time for a slot
   */
  async getBlockTime(slot: number): Promise<number | null> {
    const connection = this.ensureInitialized();
    return connection.getBlockTime(slot);
  }

  /**
   * Disconnect (cleanup)
   */
  async disconnect(): Promise<void> {
    // Connection doesn't need explicit cleanup in web3.js
    this.isInitialized = false;
    this.connection = undefined;
  }
}

/**
 * Create a Solana client instance
 */
export function createSolanaClient(config?: SolanaClientConfig): SolanaClient {
  return new SolanaClient(config);
}

/**
 * Drift Protocol Authentication
 *
 * Handles Solana wallet authentication for Drift Protocol trading.
 * Drift uses on-chain transactions signed by the wallet.
 */

import type { IAuthStrategy, RequestParams, AuthenticatedRequest } from '../../types/adapter.js';
import { DRIFT_API_URLS } from './constants.js';

// We'll import these dynamically to handle the ESM module properly
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
export class DriftAuth implements IAuthStrategy {
  private keypair?: Keypair;
  private walletAddress?: string;
  private publicKey?: PublicKey;
  private readonly subAccountId: number;
  private readonly rpcEndpoint: string;
  private readonly isDevnet: boolean;
  private connection?: Connection;
  private isInitialized = false;

  constructor(config: DriftAuthConfig) {
    const apiUrls = config.isDevnet ? DRIFT_API_URLS.devnet : DRIFT_API_URLS.mainnet;
    this.rpcEndpoint = config.rpcEndpoint || apiUrls.rpc;
    this.subAccountId = config.subAccountId ?? 0;
    this.isDevnet = config.isDevnet ?? false;

    // Store the config for lazy initialization
    if (config.privateKey) {
      this.initializeFromPrivateKey(config.privateKey);
    } else if (config.walletAddress) {
      this.walletAddress = config.walletAddress;
    }
  }

  /**
   * Initialize keypair from private key
   */
  private initializeFromPrivateKey(privateKey: string | Uint8Array): void {
    try {
      const bytes = this.parsePrivateKey(privateKey);
      // Lazy import to handle ESM module
      this.initKeypairAsync(bytes);
    } catch (error) {
      console.warn(`Failed to initialize keypair: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Async initialization of keypair (for dynamic import)
   */
  private async initKeypairAsync(bytes: Uint8Array): Promise<void> {
    try {
      const { Keypair, Connection, PublicKey } = await import('@solana/web3.js');
      this.keypair = Keypair.fromSecretKey(bytes);
      this.publicKey = this.keypair.publicKey;
      this.walletAddress = this.publicKey.toBase58();
      this.connection = new Connection(this.rpcEndpoint, 'confirmed');
      this.isInitialized = true;
    } catch (error) {
      console.warn(`Failed to initialize Solana keypair: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ensure async initialization is complete
   */
  async ensureInitialized(): Promise<void> {
    if (!this.isInitialized && this.walletAddress) {
      try {
        const { Connection, PublicKey } = await import('@solana/web3.js');
        this.connection = new Connection(this.rpcEndpoint, 'confirmed');
        if (this.walletAddress) {
          this.publicKey = new PublicKey(this.walletAddress);
        }
        this.isInitialized = true;
      } catch (error) {
        throw new Error(`Failed to initialize Solana connection: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Sign a request (required by IAuthStrategy interface)
   * Drift uses on-chain transaction signing, not HTTP request signing
   */
  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    // Drift doesn't use HTTP request signing
    // Just return the request with empty headers
    return {
      ...request,
      headers: {},
    };
  }

  /**
   * Drift doesn't use HTTP header authentication
   * All authentication is done via transaction signing
   */
  getHeaders(): Record<string, string> {
    // No headers needed for Drift - uses on-chain transactions
    return {};
  }

  /**
   * Sign a message
   */
  async signMessage(message: string): Promise<Uint8Array> {
    if (!this.keypair) {
      throw new Error('Private key required for signing');
    }

    const { sign } = await import('@noble/ed25519');
    const messageBytes = new TextEncoder().encode(message);
    return sign(messageBytes, this.keypair.secretKey.slice(0, 32));
  }

  /**
   * Sign bytes (for transaction signing)
   */
  async signBytes(bytes: Uint8Array): Promise<Uint8Array> {
    if (!this.keypair) {
      throw new Error('Private key required for signing');
    }

    const { sign } = await import('@noble/ed25519');
    return sign(bytes, this.keypair.secretKey.slice(0, 32));
  }

  /**
   * Get the wallet address
   */
  getWalletAddress(): string | undefined {
    return this.walletAddress;
  }

  /**
   * Get the public key
   */
  getPublicKey(): PublicKey | undefined {
    return this.publicKey;
  }

  /**
   * Get the keypair (for SDK usage)
   */
  getKeypair(): Keypair | undefined {
    return this.keypair;
  }

  /**
   * Get sub-account ID
   */
  getSubAccountId(): number {
    return this.subAccountId;
  }

  /**
   * Check if authentication is configured for trading
   */
  canSign(): boolean {
    return this.keypair !== undefined;
  }

  /**
   * Check if authentication is configured for read operations
   */
  canRead(): boolean {
    return this.walletAddress !== undefined;
  }

  /**
   * Get RPC endpoint
   */
  getRpcEndpoint(): string {
    return this.rpcEndpoint;
  }

  /**
   * Get whether using devnet
   */
  getIsDevnet(): boolean {
    return this.isDevnet;
  }

  /**
   * Get Solana connection
   */
  async getConnection(): Promise<Connection> {
    await this.ensureInitialized();
    if (!this.connection) {
      throw new Error('Connection not initialized');
    }
    return this.connection;
  }

  /**
   * Get SOL balance
   */
  async getSolBalance(): Promise<number> {
    await this.ensureInitialized();
    if (!this.connection || !this.publicKey) {
      throw new Error('Connection or public key not initialized');
    }

    const balance = await this.connection.getBalance(this.publicKey);
    return balance / 1e9; // Convert lamports to SOL
  }

  /**
   * Get token balance for an SPL token
   */
  async getTokenBalance(tokenMint: string): Promise<number> {
    await this.ensureInitialized();
    if (!this.connection || !this.publicKey) {
      throw new Error('Connection or public key not initialized');
    }

    const { PublicKey } = await import('@solana/web3.js');
    const tokenMintPubkey = new PublicKey(tokenMint);

    // Get associated token account
    const tokenAccounts = await this.connection.getTokenAccountsByOwner(
      this.publicKey,
      { mint: tokenMintPubkey }
    );

    if (tokenAccounts.value.length === 0) {
      return 0;
    }

    // Parse account data to get balance
    // This is simplified - actual implementation would parse the account data
    const accountInfo = tokenAccounts.value[0];
    if (!accountInfo) {
      return 0;
    }

    // Account data layout: 64 bytes mint, 32 bytes owner, 8 bytes amount
    const data = accountInfo.account.data;
    const amountBytes = data.slice(64, 72);
    const amount = Buffer.from(amountBytes).readBigUInt64LE();

    return Number(amount);
  }

  /**
   * Create user account PDA info
   */
  getUserAccountInfo(): { authority: string; subAccountId: number } | undefined {
    if (!this.walletAddress) return undefined;

    return {
      authority: this.walletAddress,
      subAccountId: this.subAccountId,
    };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Parse private key from various formats
   */
  private parsePrivateKey(key: string | Uint8Array): Uint8Array {
    if (key instanceof Uint8Array) {
      return key;
    }

    // Try to parse as JSON array (common format from Solana CLI)
    if (key.startsWith('[')) {
      try {
        const parsed = JSON.parse(key) as number[];
        return new Uint8Array(parsed);
      } catch {
        throw new Error('Invalid private key JSON array format');
      }
    }

    // Try to parse as base58 (Phantom wallet format)
    if (/^[1-9A-HJ-NP-Za-km-z]+$/.test(key)) {
      try {
        // Use bs58 for base58 decoding
        const bs58 = require('bs58') as { decode: (str: string) => Uint8Array };
        return bs58.decode(key);
      } catch {
        throw new Error('Invalid base58 private key format');
      }
    }

    // Try hex format
    if (/^(0x)?[0-9a-fA-F]+$/.test(key)) {
      const hex = key.startsWith('0x') ? key.slice(2) : key;
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      }
      return bytes;
    }

    throw new Error('Unsupported private key format');
  }
}

/**
 * Validate Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  // Solana addresses are base58-encoded 32-byte public keys
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Validate Solana private key format
 */
export function isValidSolanaPrivateKey(key: string | Uint8Array): boolean {
  if (key instanceof Uint8Array) {
    return key.length === 64;
  }

  // JSON array format
  if (key.startsWith('[')) {
    try {
      const parsed = JSON.parse(key) as number[];
      return Array.isArray(parsed) && parsed.length === 64;
    } catch {
      return false;
    }
  }

  // Base58 format
  if (/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(key)) {
    return true;
  }

  // Hex format
  if (/^(0x)?[0-9a-fA-F]{128}$/.test(key)) {
    return true;
  }

  return false;
}

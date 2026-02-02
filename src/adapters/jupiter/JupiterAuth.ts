/**
 * Jupiter Perps Authentication
 *
 * Handles Solana wallet authentication for Jupiter Perps trading.
 * Jupiter Perps requires on-chain transactions signed by the wallet.
 */

import type { IAuthStrategy, RequestParams, AuthenticatedRequest } from '../../types/adapter.js';

/**
 * Configuration for Jupiter authentication
 */
export interface JupiterAuthConfig {
  /** Solana private key (base58 or array) */
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
export class JupiterAuth implements IAuthStrategy {
  private readonly privateKey?: Uint8Array;
  private readonly walletAddress?: string;
  private readonly rpcEndpoint: string;

  constructor(config: JupiterAuthConfig) {
    this.rpcEndpoint = config.rpcEndpoint || 'https://api.mainnet-beta.solana.com';

    if (config.privateKey) {
      this.privateKey = this.parsePrivateKey(config.privateKey);
      this.walletAddress = config.walletAddress || this.deriveWalletAddress();
    } else if (config.walletAddress) {
      this.walletAddress = config.walletAddress;
    }
  }

  /**
   * Sign a request (required by IAuthStrategy interface)
   * Jupiter uses on-chain transaction signing, not HTTP request signing
   */
  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    // Jupiter doesn't use HTTP request signing
    // Just return the request with empty headers
    return {
      ...request,
      headers: {},
    };
  }

  /**
   * Jupiter doesn't use HTTP header authentication
   * All authentication is done via transaction signing
   */
  getHeaders(): Record<string, string> {
    // No headers needed for Jupiter - uses on-chain transactions
    return {};
  }

  /**
   * Sign a message (for potential off-chain verification)
   */
  async signMessage(message: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error('Private key required for signing');
    }

    // Would use @solana/web3.js Keypair for actual signing
    // This is a placeholder - actual implementation requires Solana SDK
    const messageBytes = new TextEncoder().encode(message);
    return this.signBytes(messageBytes);
  }

  /**
   * Sign bytes (for transaction signing)
   */
  async signBytes(bytes: Uint8Array): Promise<string> {
    if (!this.privateKey) {
      throw new Error('Private key required for signing');
    }

    // Placeholder for actual Ed25519 signing
    // In production, use @solana/web3.js:
    // const keypair = Keypair.fromSecretKey(this.privateKey);
    // const signature = nacl.sign.detached(bytes, keypair.secretKey);
    // return bs58.encode(signature);

    // For now, return a placeholder that indicates signing is required
    throw new Error(
      'Transaction signing requires @solana/web3.js integration. ' +
      'Please use the Solana SDK directly for trading operations.'
    );
  }

  /**
   * Get the wallet address
   */
  getWalletAddress(): string | undefined {
    return this.walletAddress;
  }

  /**
   * Check if authentication is configured for trading
   */
  canSign(): boolean {
    return this.privateKey !== undefined;
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
   * Create an unsigned transaction instruction for Jupiter Perps
   * The actual transaction building requires Jupiter SDK
   */
  async createTransactionPayload(
    instruction: 'openPosition' | 'closePosition' | 'modifyPosition',
    params: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (!this.walletAddress) {
      throw new Error('Wallet address required for transaction creation');
    }

    // Return instruction data that would be used with Jupiter SDK
    return {
      instruction,
      owner: this.walletAddress,
      params,
      requiresSignature: true,
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
    // Would use bs58.decode in production
    // For now, assume it's a hex string or base58
    if (/^[1-9A-HJ-NP-Za-km-z]+$/.test(key)) {
      // Base58 format - would use bs58.decode
      throw new Error(
        'Base58 private key parsing requires bs58 library. ' +
        'Please provide private key as JSON array format.'
      );
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

  /**
   * Derive wallet address from private key
   * Placeholder - actual implementation requires @solana/web3.js
   */
  private deriveWalletAddress(): string {
    // In production:
    // const keypair = Keypair.fromSecretKey(this.privateKey);
    // return keypair.publicKey.toBase58();

    // Placeholder - return empty to indicate derivation not implemented
    throw new Error(
      'Wallet address derivation requires @solana/web3.js. ' +
      'Please provide walletAddress in config.'
    );
  }
}

/**
 * Validate Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  // Solana addresses are base58-encoded 32-byte public keys
  // Valid characters: 1-9, A-H, J-N, P-Z, a-k, m-z (no 0, I, O, l)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Validate Solana private key format
 */
export function isValidSolanaPrivateKey(key: string | Uint8Array): boolean {
  if (key instanceof Uint8Array) {
    // Solana uses 64-byte secret keys (32 bytes private + 32 bytes public)
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

  // Base58 format (approximately 87-88 characters for 64 bytes)
  if (/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(key)) {
    return true;
  }

  // Hex format (128 characters for 64 bytes)
  if (/^(0x)?[0-9a-fA-F]{128}$/.test(key)) {
    return true;
  }

  return false;
}

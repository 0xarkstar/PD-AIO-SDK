/**
 * Drift Protocol Authentication
 *
 * Handles Solana wallet authentication for Drift Protocol trading.
 * Drift uses on-chain transactions signed by the wallet.
 */

import type { IAuthStrategy, RequestParams, AuthenticatedRequest } from '../../types/adapter.js';

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
  private readonly privateKey?: Uint8Array;
  private readonly walletAddress?: string;
  private readonly subAccountId: number;
  private readonly rpcEndpoint: string;

  constructor(config: DriftAuthConfig) {
    this.rpcEndpoint = config.rpcEndpoint || 'https://api.mainnet-beta.solana.com';
    this.subAccountId = config.subAccountId ?? 0;

    if (config.privateKey) {
      this.privateKey = this.parsePrivateKey(config.privateKey);
      this.walletAddress = config.walletAddress || this.deriveWalletAddress();
    } else if (config.walletAddress) {
      this.walletAddress = config.walletAddress;
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
   * Sign a message (for potential off-chain verification)
   */
  async signMessage(message: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error('Private key required for signing');
    }

    // Would use @solana/web3.js Keypair for actual signing
    // This is a placeholder - actual implementation requires Solana SDK
    throw new Error(
      'Message signing requires @solana/web3.js integration. ' +
      'Please use the Drift SDK directly for signing operations.'
    );
  }

  /**
   * Sign bytes (for transaction signing)
   */
  async signBytes(bytes: Uint8Array): Promise<string> {
    if (!this.privateKey) {
      throw new Error('Private key required for signing');
    }

    throw new Error(
      'Transaction signing requires @solana/web3.js integration. ' +
      'Please use the Drift SDK directly for trading operations.'
    );
  }

  /**
   * Get the wallet address
   */
  getWalletAddress(): string | undefined {
    return this.walletAddress;
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
   * Create user account PDA info
   * Actual derivation requires @drift-labs/sdk
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

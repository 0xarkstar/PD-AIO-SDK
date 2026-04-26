/**
 * dYdX v4 Authentication Strategy
 *
 * dYdX v4 is built on Cosmos SDK and uses secp256k1 signatures.
 * For the Indexer API (read-only), no authentication is required.
 * For trading operations, the official dYdX client library handles signing.
 *
 * This module provides:
 * - Input validation for mnemonic / private key credentials
 * - Stubbed address derivation that throws NotSupportedError after validation
 *   (proper BIP39 → HD key → bech32 derivation requires Cosmos SDK libraries
 *   that are not yet integrated — see TODOs in derive methods below)
 *
 * Account-scoped operations (fetchPositions, fetchBalance, fetchOpenOrders,
 * fetchOrderHistory, fetchMyTrades) are unavailable until proper Cosmos SDK
 * derivation is implemented (e.g., @cosmjs/crypto or @dydxprotocol/v4-client-js).
 * Public read-only operations (fetchMarkets, fetchTicker, fetchOrderBook,
 * fetchTrades) do not require an address and remain fully functional.
 */

import type { AuthenticatedRequest, IAuthStrategy, RequestParams } from '../../types/index.js';
import { DYDX_DEFAULT_SUBACCOUNT_NUMBER } from './constants.js';
import {
  AuthenticationError,
  NotSupportedError,
  InvalidParameterError,
  NetworkError,
  PerpDEXError,
} from '../../types/errors.js';

/**
 * dYdX authentication configuration
 */
export interface DydxAuthConfig {
  /** Mnemonic phrase (24 words) */
  mnemonic?: string;
  /** Private key (hex string) */
  privateKey?: string;
  /** Subaccount number (default: 0) */
  subaccountNumber?: number;
  /** Whether using testnet */
  testnet?: boolean;
}

/**
 * dYdX v4 Authentication Strategy
 *
 * Note: dYdX v4's Indexer API is public for read operations.
 * Trading operations require the official @dydxprotocol/v4-client-js library
 * which handles Cosmos SDK transaction signing internally.
 *
 * This auth strategy validates credentials and tracks subaccount information,
 * but throws NotSupportedError for any operation that requires a derived address
 * until proper Cosmos SDK libraries are integrated.
 *
 * @example
 * ```typescript
 * const auth = new DydxAuth({
 *   mnemonic: 'your 24 word mnemonic phrase...',
 *   subaccountNumber: 0,
 * });
 *
 * // Throws NotSupportedError until Cosmos SDK derivation is integrated
 * const address = await auth.getAddress();
 * ```
 */
export class DydxAuth implements IAuthStrategy {
  private readonly mnemonic?: string;
  private readonly privateKey?: string;
  private readonly subaccountNumber: number;
  private readonly testnet: boolean;
  private address?: string;
  private initialized: boolean = false;

  constructor(config: DydxAuthConfig) {
    this.mnemonic = config.mnemonic;
    this.privateKey = config.privateKey;
    this.subaccountNumber = config.subaccountNumber ?? DYDX_DEFAULT_SUBACCOUNT_NUMBER;
    this.testnet = config.testnet ?? false;

    if (!this.mnemonic && !this.privateKey) {
      throw new AuthenticationError('Either mnemonic or privateKey must be provided', 'MISSING_CREDENTIALS', 'dydx');
    }
  }

  /**
   * Initialize the auth strategy by running input validation via derive methods.
   *
   * If input is invalid (wrong word count / wrong key length), throws
   * InvalidParameterError immediately. If input passes validation, the derive
   * methods throw NotSupportedError because real Cosmos SDK address derivation
   * is not yet wired in — the failure is intentionally loud so callers know
   * account-scoped operations are unavailable.
   *
   * PerpDEXError subclasses (InvalidParameterError, NotSupportedError, etc.)
   * are re-thrown as-is so callers can distinguish error types. Unknown errors
   * are wrapped in NetworkError.
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      if (this.mnemonic) {
        this.address = await this.deriveAddressFromMnemonic(this.mnemonic);
      } else if (this.privateKey) {
        this.address = await this.deriveAddressFromPrivateKey(this.privateKey);
      }
      this.initialized = true;
    } catch (error) {
      // Re-throw known PerpDEX errors (InvalidParameterError, NotSupportedError, etc.) unchanged
      if (error instanceof PerpDEXError) throw error;
      // Wrap unexpected errors
      throw new NetworkError(
        `Failed to initialize dYdX auth: ${error instanceof Error ? error.message : String(error)}`,
        'NETWORK_ERROR',
        'dydx'
      );
    }
  }

  /**
   * Validate mnemonic word count, then throw NotSupportedError.
   *
   * Input validation runs first so callers receive InvalidParameterError for
   * bad input. Once validation passes, NotSupportedError is thrown because
   * proper BIP39 → HD key → bech32 derivation is not yet implemented.
   *
   * TODO: Replace with proper Cosmos address derivation:
   *   1. `@cosmjs/crypto` — Bip39.decode(mnemonic) → seed
   *   2. `@cosmjs/crypto` — Slip10.derivePath(Slip10Curve.Secp256k1, seed, stringToPath("m/44'/118'/0'/0/0"))
   *   3. `@cosmjs/amino` — pubkeyToAddress(compressedPubkey, "dydx")
   *   Or use `@dydxprotocol/v4-client-js` CompositeClient which handles this internally.
   *
   * Required packages: @cosmjs/amino, @cosmjs/crypto, @cosmjs/proto-signing
   */
  private async deriveAddressFromMnemonic(mnemonic: string): Promise<string> {
    // Validate mnemonic has correct word count — throws InvalidParameterError for bad input
    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 24 && words.length !== 12) {
      throw new InvalidParameterError('Invalid mnemonic: must be 12 or 24 words', 'INVALID_PARAMETER', 'dydx');
    }

    // Input is valid but Cosmos SDK derivation is not yet integrated — fail loudly
    throw new NotSupportedError(
      'dYdX address derivation requires Cosmos SDK libraries that are not yet integrated. ' +
        'Account-scoped operations (fetchPositions, fetchBalance, fetchOpenOrders, ' +
        'fetchOrderHistory, fetchMyTrades) are unavailable until proper derivation is ' +
        'implemented (e.g., @cosmjs/crypto or @dydxprotocol/v4-client-js). Public ' +
        'read-only operations (fetchMarkets, fetchTicker, fetchOrderBook, fetchTrades) remain available.',
      'NOT_SUPPORTED',
      'dydx'
    );
  }

  /**
   * Validate private key length, then throw NotSupportedError.
   *
   * Same validation-first pattern as deriveAddressFromMnemonic: bad key length
   * yields InvalidParameterError; valid key yields NotSupportedError because
   * real secp256k1 → ripemd160(sha256(pubkey)) → bech32 derivation is not yet
   * implemented.
   *
   * TODO: Use @cosmjs/crypto Secp256k1.makeKeypair() + pubkeyToAddress()
   */
  private async deriveAddressFromPrivateKey(privateKey: string): Promise<string> {
    // Remove 0x prefix if present
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

    if (cleanKey.length !== 64) {
      throw new InvalidParameterError('Invalid private key: must be 32 bytes (64 hex characters)', 'INVALID_PARAMETER', 'dydx');
    }

    // Input is valid but Cosmos SDK derivation is not yet integrated — fail loudly
    throw new NotSupportedError(
      'dYdX address derivation requires Cosmos SDK libraries that are not yet integrated. ' +
        'Account-scoped operations (fetchPositions, fetchBalance, fetchOpenOrders, ' +
        'fetchOrderHistory, fetchMyTrades) are unavailable until proper derivation is ' +
        'implemented (e.g., @cosmjs/crypto or @dydxprotocol/v4-client-js). Public ' +
        'read-only operations (fetchMarkets, fetchTicker, fetchOrderBook, fetchTrades) remain available.',
      'NOT_SUPPORTED',
      'dydx'
    );
  }

  /**
   * Sign a request
   *
   * For dYdX Indexer API, most requests don't require signing.
   * Trading operations use the official SDK's internal signing.
   *
   * Note: sign() calls initialize() which throws NotSupportedError for valid
   * credentials. This means sign() is currently only usable for read-only
   * requests that do not need an address (getHeaders() alone suffices for those).
   */
  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    await this.initialize();

    // Indexer API requests generally don't require authentication
    // Trading requests are handled by the official dYdX client
    return {
      ...request,
      headers: this.getHeaders(),
    };
  }

  /**
   * Get authentication headers
   *
   * For Indexer API, only Content-Type is needed.
   * Trading operations use SDK-managed headers.
   */
  getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Refresh is not needed for dYdX Indexer API
   */
  async refresh(): Promise<void> {
    // No-op: dYdX doesn't use token-based auth for Indexer
  }

  /**
   * Get the dYdX address
   *
   * @throws NotSupportedError until Cosmos SDK derivation is integrated
   * @throws InvalidParameterError if credentials are malformed
   */
  async getAddress(): Promise<string> {
    await this.initialize();
    return this.address!;
  }

  /**
   * Get the subaccount number
   *
   * @returns The configured subaccount number
   */
  getSubaccountNumber(): number {
    return this.subaccountNumber;
  }

  /**
   * Get subaccount ID (address + subaccount number)
   *
   * dYdX uses the format: {address}/{subaccountNumber}
   *
   * @throws NotSupportedError until Cosmos SDK derivation is integrated
   */
  async getSubaccountId(): Promise<string> {
    const address = await this.getAddress();
    return `${address}/${this.subaccountNumber}`;
  }

  /**
   * Check if credentials are valid
   *
   * Returns false when credentials are malformed (InvalidParameterError) or
   * when derivation is unsupported (NotSupportedError). Returns false in both
   * cases because neither yields a usable address.
   */
  async verify(): Promise<boolean> {
    try {
      await this.initialize();
      return !!this.address;
    } catch {
      return false;
    }
  }

  /**
   * Check if this is testnet configuration
   */
  isTestnet(): boolean {
    return this.testnet;
  }

  /**
   * Check if auth has mnemonic (for trading operations)
   */
  hasMnemonic(): boolean {
    return !!this.mnemonic;
  }
}

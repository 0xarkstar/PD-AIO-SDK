/**
 * dYdX v4 Authentication Strategy
 *
 * dYdX v4 is built on Cosmos SDK and uses secp256k1 signatures.
 * For the Indexer API (read-only), no authentication is required.
 * For trading operations, the official dYdX client library handles signing.
 *
 * This module provides:
 * - Input validation for mnemonic / private key credentials
 * - Real Cosmos SDK address derivation (BIP39 → SLIP-10 → bech32 with "dydx"
 *   prefix) using `@cosmjs/crypto` and `@cosmjs/amino`
 *
 * Account-scoped operations (fetchPositions, fetchBalance, fetchOpenOrders,
 * fetchOrderHistory, fetchMyTrades) are now functional. Public read-only
 * operations (fetchMarkets, fetchTicker, fetchOrderBook, fetchTrades) do not
 * require an address and remain unaffected.
 *
 * Note: derivation runs in pure TypeScript (no native deps) — safe in any
 * Node 18+ environment per ADR-0001.
 */
import type { AuthenticatedRequest, IAuthStrategy, RequestParams } from '../../types/index.js';
/**
 * dYdX authentication configuration
 */
export interface DydxAuthConfig {
    /** Mnemonic phrase (12 or 24 words) */
    mnemonic?: string;
    /** Private key (hex string, 64 chars, optional 0x prefix) */
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
 * This auth strategy validates credentials, derives the dYdX bech32 address,
 * and tracks subaccount information.
 *
 * @example
 * ```typescript
 * const auth = new DydxAuth({
 *   mnemonic: 'your 24 word mnemonic phrase...',
 *   subaccountNumber: 0,
 * });
 *
 * const address = await auth.getAddress(); // "dydx1..."
 * ```
 */
export declare class DydxAuth implements IAuthStrategy {
    private readonly mnemonic?;
    private readonly privateKey?;
    private readonly subaccountNumber;
    private readonly testnet;
    private address?;
    private initialized;
    constructor(config: DydxAuthConfig);
    /**
     * Initialize the auth strategy by deriving the dYdX address from the
     * configured mnemonic or private key.
     *
     * Bad input (wrong word count / wrong key length) yields
     * InvalidParameterError. PerpDEXError subclasses are re-thrown unchanged so
     * callers can distinguish error types. Unknown errors are wrapped in
     * NetworkError.
     */
    private initialize;
    /**
     * Derive the dYdX bech32 address from a BIP39 mnemonic.
     *
     * Steps:
     *   1. Validate word count (12 or 24)
     *   2. BIP39 mnemonic → seed (`@cosmjs/crypto` `Bip39.mnemonicToSeed`)
     *   3. SLIP-10 derive secp256k1 privkey at Cosmos path m/44'/118'/0'/0/0
     *   4. secp256k1 keypair → compressed pubkey
     *   5. bech32 encode with "dydx" prefix (`pubkeyToAddress`)
     */
    private deriveAddressFromMnemonic;
    /**
     * Derive the dYdX bech32 address from a 32-byte secp256k1 private key.
     *
     * Steps:
     *   1. Strip optional 0x prefix and validate length (64 hex chars)
     *   2. Hex → 32-byte Uint8Array
     *   3. secp256k1 keypair → compressed pubkey
     *   4. bech32 encode with "dydx" prefix
     */
    private deriveAddressFromPrivateKey;
    /**
     * Sign a request
     *
     * For dYdX Indexer API, most requests don't require signing.
     * Trading operations use the official SDK's internal signing.
     */
    sign(request: RequestParams): Promise<AuthenticatedRequest>;
    /**
     * Get authentication headers
     *
     * For Indexer API, only Content-Type is needed.
     * Trading operations use SDK-managed headers.
     */
    getHeaders(): Record<string, string>;
    /**
     * Refresh is not needed for dYdX Indexer API
     */
    refresh(): Promise<void>;
    /**
     * Get the dYdX bech32 address derived from the configured credentials.
     *
     * @throws InvalidParameterError if credentials are malformed or derivation fails
     */
    getAddress(): Promise<string>;
    /**
     * Get the subaccount number
     *
     * @returns The configured subaccount number
     */
    getSubaccountNumber(): number;
    /**
     * Get subaccount ID (address + subaccount number)
     *
     * dYdX uses the format: {address}/{subaccountNumber}
     */
    getSubaccountId(): Promise<string>;
    /**
     * Check if credentials are valid
     *
     * Returns true when an address can be derived from the configured
     * credentials. Returns false for malformed input.
     */
    verify(): Promise<boolean>;
    /**
     * Check if this is testnet configuration
     */
    isTestnet(): boolean;
    /**
     * Check if auth has mnemonic (for trading operations)
     */
    hasMnemonic(): boolean;
}
//# sourceMappingURL=DydxAuth.d.ts.map
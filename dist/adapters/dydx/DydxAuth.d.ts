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
export declare class DydxAuth implements IAuthStrategy {
    private readonly mnemonic?;
    private readonly privateKey?;
    private readonly subaccountNumber;
    private readonly testnet;
    private address?;
    private initialized;
    constructor(config: DydxAuthConfig);
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
    private initialize;
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
    private deriveAddressFromMnemonic;
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
    private deriveAddressFromPrivateKey;
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
     * Get the dYdX address
     *
     * @throws NotSupportedError until Cosmos SDK derivation is integrated
     * @throws InvalidParameterError if credentials are malformed
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
     *
     * @throws NotSupportedError until Cosmos SDK derivation is integrated
     */
    getSubaccountId(): Promise<string>;
    /**
     * Check if credentials are valid
     *
     * Returns false when credentials are malformed (InvalidParameterError) or
     * when derivation is unsupported (NotSupportedError). Returns false in both
     * cases because neither yields a usable address.
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
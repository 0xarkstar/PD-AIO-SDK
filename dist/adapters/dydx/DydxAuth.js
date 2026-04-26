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
import { Bip39, EnglishMnemonic, Secp256k1, Slip10, Slip10Curve, stringToPath, } from '@cosmjs/crypto';
import { fromHex, toBase64 } from '@cosmjs/encoding';
import { pubkeyToAddress } from '@cosmjs/amino';
import { DYDX_DEFAULT_SUBACCOUNT_NUMBER } from './constants.js';
import { AuthenticationError, InvalidParameterError, NetworkError, PerpDEXError, } from '../../types/errors.js';
/**
 * dYdX HD derivation path — Cosmos coin type 118, account 0, change 0, index 0.
 * Both mainnet and testnet use the "dydx" bech32 prefix.
 */
const DYDX_HD_PATH = "m/44'/118'/0'/0/0";
const DYDX_BECH32_PREFIX = 'dydx';
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
export class DydxAuth {
    mnemonic;
    privateKey;
    subaccountNumber;
    testnet;
    address;
    initialized = false;
    constructor(config) {
        this.mnemonic = config.mnemonic;
        this.privateKey = config.privateKey;
        this.subaccountNumber = config.subaccountNumber ?? DYDX_DEFAULT_SUBACCOUNT_NUMBER;
        this.testnet = config.testnet ?? false;
        if (!this.mnemonic && !this.privateKey) {
            throw new AuthenticationError('Either mnemonic or privateKey must be provided', 'MISSING_CREDENTIALS', 'dydx');
        }
    }
    /**
     * Initialize the auth strategy by deriving the dYdX address from the
     * configured mnemonic or private key.
     *
     * Bad input (wrong word count / wrong key length) yields
     * InvalidParameterError. PerpDEXError subclasses are re-thrown unchanged so
     * callers can distinguish error types. Unknown errors are wrapped in
     * NetworkError.
     */
    async initialize() {
        if (this.initialized)
            return;
        try {
            if (this.mnemonic) {
                this.address = await this.deriveAddressFromMnemonic(this.mnemonic);
            }
            else if (this.privateKey) {
                this.address = await this.deriveAddressFromPrivateKey(this.privateKey);
            }
            this.initialized = true;
        }
        catch (error) {
            // Re-throw known PerpDEX errors (InvalidParameterError, etc.) unchanged
            if (error instanceof PerpDEXError)
                throw error;
            // Wrap unexpected errors
            throw new NetworkError(`Failed to initialize dYdX auth: ${error instanceof Error ? error.message : String(error)}`, 'NETWORK_ERROR', 'dydx');
        }
    }
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
    async deriveAddressFromMnemonic(mnemonic) {
        const trimmed = mnemonic.trim();
        const words = trimmed.split(/\s+/);
        if (words.length !== 24 && words.length !== 12) {
            throw new InvalidParameterError('Invalid mnemonic: must be 12 or 24 words', 'INVALID_PARAMETER', 'dydx');
        }
        try {
            const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(trimmed));
            const path = stringToPath(DYDX_HD_PATH);
            const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, path);
            const { pubkey } = await Secp256k1.makeKeypair(privkey);
            const compressed = Secp256k1.compressPubkey(pubkey);
            return pubkeyToAddress({ type: 'tendermint/PubKeySecp256k1', value: toBase64(compressed) }, DYDX_BECH32_PREFIX);
        }
        catch (err) {
            throw new InvalidParameterError(`Failed to derive dYdX address from mnemonic: ${err instanceof Error ? err.message : String(err)}`, 'DERIVATION_FAILED', 'dydx');
        }
    }
    /**
     * Derive the dYdX bech32 address from a 32-byte secp256k1 private key.
     *
     * Steps:
     *   1. Strip optional 0x prefix and validate length (64 hex chars)
     *   2. Hex → 32-byte Uint8Array
     *   3. secp256k1 keypair → compressed pubkey
     *   4. bech32 encode with "dydx" prefix
     */
    async deriveAddressFromPrivateKey(privateKey) {
        const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
        if (cleanKey.length !== 64) {
            throw new InvalidParameterError('Invalid private key: must be 32 bytes (64 hex characters)', 'INVALID_PARAMETER', 'dydx');
        }
        try {
            const privkeyBytes = fromHex(cleanKey);
            const { pubkey } = await Secp256k1.makeKeypair(privkeyBytes);
            const compressed = Secp256k1.compressPubkey(pubkey);
            return pubkeyToAddress({ type: 'tendermint/PubKeySecp256k1', value: toBase64(compressed) }, DYDX_BECH32_PREFIX);
        }
        catch (err) {
            throw new InvalidParameterError(`Failed to derive dYdX address from private key: ${err instanceof Error ? err.message : String(err)}`, 'DERIVATION_FAILED', 'dydx');
        }
    }
    /**
     * Sign a request
     *
     * For dYdX Indexer API, most requests don't require signing.
     * Trading operations use the official SDK's internal signing.
     */
    async sign(request) {
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
    getHeaders() {
        return {
            'Content-Type': 'application/json',
        };
    }
    /**
     * Refresh is not needed for dYdX Indexer API
     */
    async refresh() {
        // No-op: dYdX doesn't use token-based auth for Indexer
    }
    /**
     * Get the dYdX bech32 address derived from the configured credentials.
     *
     * @throws InvalidParameterError if credentials are malformed or derivation fails
     */
    async getAddress() {
        await this.initialize();
        return this.address;
    }
    /**
     * Get the subaccount number
     *
     * @returns The configured subaccount number
     */
    getSubaccountNumber() {
        return this.subaccountNumber;
    }
    /**
     * Get subaccount ID (address + subaccount number)
     *
     * dYdX uses the format: {address}/{subaccountNumber}
     */
    async getSubaccountId() {
        const address = await this.getAddress();
        return `${address}/${this.subaccountNumber}`;
    }
    /**
     * Check if credentials are valid
     *
     * Returns true when an address can be derived from the configured
     * credentials. Returns false for malformed input.
     */
    async verify() {
        try {
            await this.initialize();
            return !!this.address;
        }
        catch {
            return false;
        }
    }
    /**
     * Check if this is testnet configuration
     */
    isTestnet() {
        return this.testnet;
    }
    /**
     * Check if auth has mnemonic (for trading operations)
     */
    hasMnemonic() {
        return !!this.mnemonic;
    }
}
//# sourceMappingURL=DydxAuth.js.map
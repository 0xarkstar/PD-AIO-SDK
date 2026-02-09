/**
 * dYdX v4 Authentication Strategy
 *
 * dYdX v4 is built on Cosmos SDK and uses secp256k1 signatures.
 * For the Indexer API (read-only), no authentication is required.
 * For trading operations, the official dYdX client library handles signing.
 *
 * This module provides:
 * - Cosmos SDK wallet derivation from mnemonic
 * - Address generation for subaccount identification
 * - Signing support for trading operations (when using the official SDK)
 */
import { DYDX_DEFAULT_SUBACCOUNT_NUMBER } from './constants.js';
/**
 * dYdX v4 Authentication Strategy
 *
 * Note: dYdX v4's Indexer API is public for read operations.
 * Trading operations require the official @dydxprotocol/v4-client-js library
 * which handles Cosmos SDK transaction signing internally.
 *
 * This auth strategy is primarily used for:
 * 1. Generating the dYdX address from mnemonic/private key
 * 2. Tracking subaccount information
 * 3. Providing wallet context for trading operations
 *
 * @example
 * ```typescript
 * const auth = new DydxAuth({
 *   mnemonic: 'your 24 word mnemonic phrase...',
 *   subaccountNumber: 0,
 * });
 *
 * const address = auth.getAddress();
 * console.log(`dYdX Address: ${address}`);
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
            throw new Error('Either mnemonic or privateKey must be provided');
        }
    }
    /**
     * Initialize the auth strategy
     *
     * Derives the dYdX address from the mnemonic or private key.
     * This is called lazily when the address is first needed.
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            // For now, we'll use a placeholder address derivation
            // In production, you would use @cosmjs/proto-signing or @dydxprotocol/v4-client-js
            // to derive the actual Cosmos address from the mnemonic
            if (this.mnemonic) {
                // Derive address from mnemonic using Cosmos SDK HD path
                // dYdX uses: m/44'/118'/0'/0/0 (Cosmos standard)
                this.address = await this.deriveAddressFromMnemonic(this.mnemonic);
            }
            else if (this.privateKey) {
                // Derive address from private key
                this.address = await this.deriveAddressFromPrivateKey(this.privateKey);
            }
            this.initialized = true;
        }
        catch (error) {
            throw new Error(`Failed to initialize dYdX auth: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Derive dYdX address from mnemonic
     *
     * Note: This is a simplified implementation. In production,
     * use @cosmjs/proto-signing or @dydxprotocol/v4-client-js
     */
    async deriveAddressFromMnemonic(mnemonic) {
        // Validate mnemonic has correct word count
        const words = mnemonic.trim().split(/\s+/);
        if (words.length !== 24 && words.length !== 12) {
            throw new Error('Invalid mnemonic: must be 12 or 24 words');
        }
        // In a full implementation, you would:
        // 1. Use BIP39 to convert mnemonic to seed
        // 2. Derive key using HD path m/44'/118'/0'/0/0
        // 3. Get secp256k1 public key
        // 4. Hash public key to get Cosmos address
        // 5. Bech32 encode with 'dydx' prefix
        // For now, we'll compute a deterministic placeholder
        // Real implementation needs: @cosmjs/proto-signing
        const hash = this.simpleHash(mnemonic);
        return `dydx${hash.slice(0, 38)}`;
    }
    /**
     * Derive dYdX address from private key
     */
    async deriveAddressFromPrivateKey(privateKey) {
        // Remove 0x prefix if present
        const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
        if (cleanKey.length !== 64) {
            throw new Error('Invalid private key: must be 32 bytes (64 hex characters)');
        }
        // In a full implementation, you would:
        // 1. Parse private key as secp256k1 key
        // 2. Get public key
        // 3. Hash to Cosmos address format
        // 4. Bech32 encode with 'dydx' prefix
        const hash = this.simpleHash(cleanKey);
        return `dydx${hash.slice(0, 38)}`;
    }
    /**
     * Simple hash function for placeholder address generation
     * Real implementation should use proper cryptographic derivation
     */
    simpleHash(input) {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        // Convert to hex-like string
        const hexChars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < 40; i++) {
            hash = (hash << 5) - hash + i;
            hash = hash & hash;
            result += hexChars[Math.abs(hash) % 16];
        }
        return result;
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
     * Get the dYdX address
     *
     * @returns The derived dYdX address (bech32 format)
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
     * For dYdX, this validates that the mnemonic/private key
     * can derive a valid address.
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
     * Get the mnemonic (if available)
     *
     * Warning: Handle with care, this is sensitive data
     */
    getMnemonic() {
        return this.mnemonic;
    }
    /**
     * Check if auth has mnemonic (for trading operations)
     */
    hasMnemonic() {
        return !!this.mnemonic;
    }
}
//# sourceMappingURL=DydxAuth.js.map
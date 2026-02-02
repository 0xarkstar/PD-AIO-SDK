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
export declare class DydxAuth implements IAuthStrategy {
    private readonly mnemonic?;
    private readonly privateKey?;
    private readonly subaccountNumber;
    private readonly testnet;
    private address?;
    private initialized;
    constructor(config: DydxAuthConfig);
    /**
     * Initialize the auth strategy
     *
     * Derives the dYdX address from the mnemonic or private key.
     * This is called lazily when the address is first needed.
     */
    private initialize;
    /**
     * Derive dYdX address from mnemonic
     *
     * Note: This is a simplified implementation. In production,
     * use @cosmjs/proto-signing or @dydxprotocol/v4-client-js
     */
    private deriveAddressFromMnemonic;
    /**
     * Derive dYdX address from private key
     */
    private deriveAddressFromPrivateKey;
    /**
     * Simple hash function for placeholder address generation
     * Real implementation should use proper cryptographic derivation
     */
    private simpleHash;
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
     * Get the dYdX address
     *
     * @returns The derived dYdX address (bech32 format)
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
     * For dYdX, this validates that the mnemonic/private key
     * can derive a valid address.
     */
    verify(): Promise<boolean>;
    /**
     * Check if this is testnet configuration
     */
    isTestnet(): boolean;
    /**
     * Get the mnemonic (if available)
     *
     * Warning: Handle with care, this is sensitive data
     */
    getMnemonic(): string | undefined;
    /**
     * Check if auth has mnemonic (for trading operations)
     */
    hasMnemonic(): boolean;
}
//# sourceMappingURL=DydxAuth.d.ts.map
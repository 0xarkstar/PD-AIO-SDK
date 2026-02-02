/**
 * Lighter Authentication Strategy
 *
 * Implements IAuthStrategy for Lighter exchange.
 * Supports two authentication modes:
 * 1. FFI mode: Native library signing for full trading
 * 2. HMAC mode: HMAC-SHA256 for legacy/read-only operations
 */
import type { IAuthStrategy, RequestParams, AuthenticatedRequest } from '../../types/adapter.js';
import { LighterSigner } from './signer/index.js';
import { NonceManager } from './NonceManager.js';
import type { HTTPClient } from '../../core/http/HTTPClient.js';
/**
 * Lighter authentication configuration
 */
export interface LighterAuthConfig {
    apiPrivateKey?: string;
    apiPublicKey?: string;
    accountIndex?: number;
    apiKeyIndex?: number;
    chainId?: number;
    nativeLibraryPath?: string;
    apiKey?: string;
    apiSecret?: string;
    httpClient?: HTTPClient;
}
/**
 * Authentication mode
 */
export type AuthMode = 'ffi' | 'hmac' | 'none';
/**
 * Lighter Authentication Strategy
 *
 * Provides flexible authentication supporting both FFI-based native signing
 * and HMAC-based authentication.
 *
 * @example
 * ```typescript
 * // FFI mode
 * const auth = new LighterAuth({
 *   apiPrivateKey: '0x...',
 *   chainId: 300,
 *   httpClient: client,
 * });
 * await auth.initialize();
 *
 * // HMAC mode
 * const authHmac = new LighterAuth({
 *   apiKey: 'key',
 *   apiSecret: 'secret',
 * });
 * ```
 */
export declare class LighterAuth implements IAuthStrategy {
    private readonly config;
    private signer;
    private nonceManager;
    private authToken;
    private authTokenExpiry;
    private initialized;
    /** Token validity duration in seconds */
    private static readonly TOKEN_DURATION;
    /** Refresh token before expiry (seconds) */
    private static readonly TOKEN_REFRESH_BUFFER;
    constructor(config: LighterAuthConfig);
    /**
     * Get the current authentication mode
     */
    get mode(): AuthMode;
    /**
     * Check if authentication is configured
     */
    get isConfigured(): boolean;
    /**
     * Check if FFI signing is available
     */
    get hasFFISigning(): boolean;
    /**
     * Get the API key index (for FFI mode)
     */
    get apiKeyIndex(): number;
    /**
     * Get the account index (for FFI mode)
     */
    get accountIndex(): number;
    /**
     * Initialize the authentication strategy
     *
     * For FFI mode, initializes the native signer and nonce manager.
     * For HMAC mode, no initialization is required.
     */
    initialize(): Promise<void>;
    /**
     * Sign a request with appropriate authentication
     *
     * For FFI mode with POST/DELETE trading requests, uses auth token.
     * For HMAC mode, adds HMAC signature headers.
     */
    sign(request: RequestParams): Promise<AuthenticatedRequest>;
    /**
     * Get authentication headers
     *
     * Returns cached auth headers. For dynamic headers, use sign() instead.
     */
    getHeaders(): Record<string, string>;
    /**
     * Refresh authentication (refresh auth token for FFI mode)
     */
    refresh(): Promise<void>;
    /**
     * Get or create an auth token (FFI mode only)
     */
    getAuthToken(): Promise<string | null>;
    /**
     * Refresh the auth token
     */
    private refreshAuthToken;
    /**
     * Generate HMAC-SHA256 signature
     * Note: This is now async to support browser Web Crypto API
     */
    private generateHmacSignature;
    /**
     * Get the signer instance (for advanced usage)
     */
    getSigner(): LighterSigner | null;
    /**
     * Get the nonce manager (for advanced usage)
     */
    getNonceManager(): NonceManager | null;
    /**
     * Get next nonce for transaction signing
     */
    getNextNonce(): Promise<bigint>;
    /**
     * Reset nonce (call after transaction failures)
     */
    resetNonce(): void;
    /**
     * Rollback nonce by one (call when transaction not submitted)
     */
    rollbackNonce(): void;
    /**
     * Sync nonce with server
     */
    syncNonce(): Promise<void>;
}
//# sourceMappingURL=LighterAuth.d.ts.map
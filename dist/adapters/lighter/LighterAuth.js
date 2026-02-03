/**
 * Lighter Authentication Strategy
 *
 * Implements IAuthStrategy for Lighter exchange.
 * Supports two authentication modes:
 * 1. FFI mode: Native library signing for full trading
 * 2. HMAC mode: HMAC-SHA256 for legacy/read-only operations
 */
import { createHmacSha256 } from '../../utils/crypto.js';
import { LighterSigner, LighterWasmSigner } from './signer/index.js';
import { NonceManager } from './NonceManager.js';
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
export class LighterAuth {
    config;
    signer = null;
    nonceManager = null;
    authToken = null;
    authTokenExpiry = 0;
    initialized = false;
    /** Token validity duration in seconds */
    static TOKEN_DURATION = 3600;
    /** Refresh token before expiry (seconds) */
    static TOKEN_REFRESH_BUFFER = 300;
    constructor(config) {
        this.config = config;
    }
    /**
     * Get the current authentication mode
     */
    get mode() {
        if (this.config.apiPrivateKey) {
            return 'ffi';
        }
        if (this.config.apiKey && this.config.apiSecret) {
            return 'hmac';
        }
        return 'none';
    }
    /**
     * Check if authentication is configured
     */
    get isConfigured() {
        return this.mode !== 'none';
    }
    /**
     * Check if FFI signing is available
     */
    get hasFFISigning() {
        return this.signer !== null && this.signer.isInitialized;
    }
    /**
     * Get the API key index (for FFI mode)
     */
    get apiKeyIndex() {
        return this.config.apiKeyIndex ?? 255;
    }
    /**
     * Get the account index (for FFI mode)
     */
    get accountIndex() {
        return this.config.accountIndex ?? 0;
    }
    /**
     * Initialize the authentication strategy
     *
     * For FFI mode, initializes the native signer and nonce manager.
     * For HMAC mode, no initialization is required.
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        if (this.mode === 'ffi' && this.config.apiPrivateKey) {
            const signerConfig = {
                apiPrivateKey: this.config.apiPrivateKey,
                apiPublicKey: this.config.apiPublicKey,
                accountIndex: this.config.accountIndex,
                apiKeyIndex: this.config.apiKeyIndex,
                chainId: this.config.chainId ?? 300,
                libraryPath: this.config.nativeLibraryPath,
            };
            // Try native FFI signer first, fall back to WASM
            try {
                this.signer = new LighterSigner(signerConfig);
                await this.signer.initialize();
            }
            catch (nativeError) {
                // Native signer failed, try WASM fallback
                console.warn('Native FFI signer unavailable, falling back to WASM:', nativeError instanceof Error ? nativeError.message : nativeError);
                try {
                    this.signer = new LighterWasmSigner(signerConfig);
                    await this.signer.initialize();
                }
                catch (wasmError) {
                    // Both signers failed
                    console.warn('WASM signer initialization also failed:', wasmError instanceof Error ? wasmError.message : wasmError);
                    this.signer = null;
                }
            }
            // Initialize nonce manager if HTTP client is available
            if (this.config.httpClient) {
                this.nonceManager = new NonceManager({
                    httpClient: this.config.httpClient,
                    apiKeyIndex: this.config.apiKeyIndex ?? 255,
                });
            }
        }
        this.initialized = true;
    }
    /**
     * Sign a request with appropriate authentication
     *
     * For FFI mode with POST/DELETE trading requests, uses auth token.
     * For HMAC mode, adds HMAC signature headers.
     */
    async sign(request) {
        const headers = {};
        if (this.hasFFISigning) {
            // FFI mode: use auth token
            const token = await this.getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        else if (this.mode === 'hmac' && this.config.apiKey && this.config.apiSecret) {
            // HMAC mode
            const timestamp = (request.timestamp ?? Date.now()).toString();
            const signature = await this.generateHmacSignature(request.method, request.path, timestamp, request.body);
            headers['X-API-KEY'] = this.config.apiKey;
            headers['X-TIMESTAMP'] = timestamp;
            headers['X-SIGNATURE'] = signature;
        }
        return {
            ...request,
            headers,
        };
    }
    /**
     * Get authentication headers
     *
     * Returns cached auth headers. For dynamic headers, use sign() instead.
     */
    getHeaders() {
        const headers = {};
        if (this.authToken && Date.now() / 1000 < this.authTokenExpiry) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        else if (this.config.apiKey) {
            headers['X-API-KEY'] = this.config.apiKey;
        }
        return headers;
    }
    /**
     * Refresh authentication (refresh auth token for FFI mode)
     */
    async refresh() {
        if (this.hasFFISigning) {
            await this.refreshAuthToken();
        }
    }
    /**
     * Get or create an auth token (FFI mode only)
     */
    async getAuthToken() {
        if (!this.signer || !this.signer.isInitialized) {
            return null;
        }
        const now = Date.now() / 1000;
        // Check if token needs refresh
        if (!this.authToken || now >= this.authTokenExpiry - LighterAuth.TOKEN_REFRESH_BUFFER) {
            await this.refreshAuthToken();
        }
        return this.authToken;
    }
    /**
     * Refresh the auth token
     */
    async refreshAuthToken() {
        if (!this.signer || !this.signer.isInitialized) {
            return;
        }
        try {
            this.authToken = await this.signer.createAuthToken(LighterAuth.TOKEN_DURATION);
            this.authTokenExpiry = Date.now() / 1000 + LighterAuth.TOKEN_DURATION;
        }
        catch (error) {
            console.warn('Failed to refresh auth token:', error);
            this.authToken = null;
            this.authTokenExpiry = 0;
        }
    }
    /**
     * Generate HMAC-SHA256 signature
     * Note: This is now async to support browser Web Crypto API
     */
    async generateHmacSignature(method, path, timestamp, body) {
        const message = `${timestamp}${method}${path}${body ? JSON.stringify(body) : ''}`;
        return createHmacSha256(this.config.apiSecret, message);
    }
    /**
     * Get the signer instance (for advanced usage)
     */
    getSigner() {
        return this.signer;
    }
    /**
     * Get the nonce manager (for advanced usage)
     */
    getNonceManager() {
        return this.nonceManager;
    }
    /**
     * Get next nonce for transaction signing
     */
    async getNextNonce() {
        if (!this.nonceManager) {
            throw new Error('Nonce manager not initialized. Provide httpClient in config.');
        }
        return this.nonceManager.getNextNonce();
    }
    /**
     * Reset nonce (call after transaction failures)
     */
    resetNonce() {
        this.nonceManager?.reset();
    }
    /**
     * Rollback nonce by one (call when transaction not submitted)
     */
    rollbackNonce() {
        this.nonceManager?.rollback();
    }
    /**
     * Sync nonce with server
     */
    async syncNonce() {
        await this.nonceManager?.sync();
    }
}
//# sourceMappingURL=LighterAuth.js.map
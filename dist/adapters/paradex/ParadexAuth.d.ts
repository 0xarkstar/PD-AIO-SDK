/**
 * Paradex Authentication Strategy
 *
 * Implements multi-layer authentication for Paradex:
 * - API Key authentication (optional)
 * - JWT token management (auto-refresh)
 * - StarkNet ECDSA signatures (for trading operations)
 *
 * @see https://docs.paradex.trade/api/authentication
 */
import type { IAuthStrategy, AuthenticatedRequest, RequestParams } from '../../types/adapter.js';
import type { ParadexJWT } from './types.js';
/**
 * Paradex authentication configuration
 */
export interface ParadexAuthConfig {
    apiKey?: string;
    apiSecret?: string;
    privateKey?: string;
    starkPrivateKey?: string;
    testnet?: boolean;
}
/**
 * Paradex authentication strategy implementation
 *
 * Uses API key + JWT tokens + StarkNet signatures
 */
export declare class ParadexAuth implements IAuthStrategy {
    private readonly apiKey?;
    private readonly starkPrivateKey?;
    private jwtToken?;
    private readonly logger;
    constructor(config: ParadexAuthConfig);
    /**
     * Check if any credentials are configured
     */
    hasCredentials(): boolean;
    /**
     * Require authentication for private operations
     * @throws Error if no credentials are configured
     */
    requireAuth(): void;
    /**
     * Sign a request with authentication headers
     *
     * @param request - Request parameters
     * @returns Authenticated request with headers
     */
    sign(request: RequestParams): Promise<AuthenticatedRequest>;
    /**
     * Verify authentication credentials
     *
     * @returns true if credentials are valid (or no credentials for public API)
     */
    verify(): Promise<boolean>;
    /**
     * Get current JWT token if valid
     *
     * @returns JWT access token or undefined
     */
    getJWTToken(): string | undefined;
    /**
     * Set JWT token from authentication response
     *
     * @param jwt - JWT response from Paradex API
     */
    setJWTToken(jwt: ParadexJWT): void;
    /**
     * Clear stored JWT token
     */
    clearJWTToken(): void;
    /**
     * Get authentication headers (without signature)
     *
     * @returns Headers object
     */
    getHeaders(): Record<string, string>;
    /**
     * Get full authentication headers for a request
     *
     * @param method - HTTP method
     * @param path - API path
     * @param body - Optional request body
     * @returns Headers object with signature if required
     */
    getAuthHeaders(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: any): Promise<Record<string, string>>;
    /**
     * Get StarkNet private key
     *
     * @returns Private key or undefined
     */
    getStarkPrivateKey(): string | undefined;
    /**
     * Get StarkNet public key derived from private key
     *
     * @returns Public key (address) or undefined
     */
    deriveStarkPublicKey(): string | undefined;
    /**
     * Check if current JWT token is valid
     *
     * @returns true if token exists and not expired
     */
    private isTokenValid;
    /**
     * Check if request requires StarkNet signature
     *
     * @param method - HTTP method
     * @param path - API path
     * @returns true if signature required
     */
    private requiresSignature;
    /**
     * Sign request data with StarkNet ECDSA
     *
     * @param request - Request parameters
     * @returns Signature in format "0x{r},0x{s}"
     *
     * @throws {Error} If StarkNet private key not available
     */
    private signRequest;
    /**
     * Create message for StarkNet signing
     *
     * @param request - Request parameters
     * @param timestamp - Request timestamp
     * @returns Message string to sign
     */
    private createSignatureMessage;
    /**
     * Get StarkNet address from private key
     */
    getAddress(): string | undefined;
}
//# sourceMappingURL=ParadexAuth.d.ts.map
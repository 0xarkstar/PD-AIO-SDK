/**
 * Backpack Authentication Strategy
 *
 * Implements ED25519 signing for Backpack exchange
 */
import type { AuthenticatedRequest, IAuthStrategy, RequestParams } from '../../types/index.js';
export interface BackpackAuthConfig {
    /** API key for authentication */
    apiKey: string;
    /** API secret (private key) for signing - supports hex or base64 format */
    apiSecret: string;
}
export declare class BackpackAuth implements IAuthStrategy {
    private readonly apiKey;
    private readonly apiSecret;
    constructor(config: BackpackAuthConfig);
    /**
     * Sign a request with ED25519 signature
     */
    sign(request: RequestParams): Promise<AuthenticatedRequest>;
    /**
     * Get authentication headers
     */
    getHeaders(): Record<string, string>;
    /**
     * Sign request with ED25519 signature
     * Uses cross-platform buffer utilities for browser compatibility
     */
    signRequest(method: string, path: string, timestamp: string, body?: Record<string, unknown>): Promise<string>;
    /**
     * Verify if credentials are available
     */
    hasCredentials(): boolean;
    /**
     * Get the API key
     */
    getApiKey(): string;
}
//# sourceMappingURL=BackpackAuth.d.ts.map
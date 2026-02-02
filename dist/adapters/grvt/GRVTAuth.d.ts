/**
 * GRVT authentication strategy
 */
import type { Wallet } from 'ethers';
import type { IAuthStrategy, AuthenticatedRequest, RequestParams } from '../../types/adapter.js';
import type { GRVTOrderSignPayload } from './types.js';
/**
 * GRVT authentication configuration
 */
export interface GRVTAuthConfig {
    apiKey?: string;
    wallet?: Wallet;
    testnet?: boolean;
}
/**
 * GRVT authentication strategy implementation
 *
 * Uses API key + session cookie + EIP-712 signatures
 */
export declare class GRVTAuth implements IAuthStrategy {
    private readonly apiKey?;
    private readonly wallet?;
    private readonly testnet;
    private sessionCookie?;
    private nonce;
    constructor(config: GRVTAuthConfig);
    /**
     * Check if authentication credentials are available
     */
    hasCredentials(): boolean;
    /**
     * Require authentication for private methods
     * @throws {Error} if no credentials are configured
     */
    requireAuth(): void;
    /**
     * Sign a request with authentication headers
     */
    sign(request: RequestParams): Promise<AuthenticatedRequest>;
    /**
     * Get authentication headers
     */
    getHeaders(): Record<string, string>;
    /**
     * Verify authentication credentials
     */
    verify(): Promise<boolean>;
    /**
     * Get current session cookie
     */
    getSessionCookie(): string | undefined;
    /**
     * Set session cookie from authentication response
     */
    setSessionCookie(token: string, expiresIn?: number): void;
    /**
     * Clear session cookie
     */
    clearSessionCookie(): void;
    /**
     * Check if current session is valid
     */
    private isSessionValid;
    /**
     * Check if request requires signature
     */
    private requiresSignature;
    /**
     * Sign request data with wallet
     */
    private signRequest;
    /**
     * Create message for signing
     */
    private createSignatureMessage;
    /**
     * Sign order using EIP-712
     */
    signOrder(payload: GRVTOrderSignPayload): Promise<string>;
    /**
     * Get next nonce for order signing
     */
    getNextNonce(): number;
    /**
     * Reset nonce (useful after session refresh)
     */
    resetNonce(): void;
    /**
     * Get wallet address
     */
    getAddress(): string | undefined;
    /**
     * Convert ethers signature to GRVT ISignature format
     */
    parseSignature(signature: string): {
        r: string;
        s: string;
        v: number;
    };
    /**
     * Create ISignature object for API requests
     */
    createSignature(payload: GRVTOrderSignPayload): Promise<{
        signer: string;
        r: string;
        s: string;
        v: number;
        expiration: string;
        nonce: number;
    }>;
}
//# sourceMappingURL=GRVTAuth.d.ts.map
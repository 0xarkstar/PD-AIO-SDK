/**
 * Katana dual authentication strategy
 *
 * Combines HMAC-SHA256 for all private requests with EIP-712 signatures for writes.
 * Uses UUID v1 nonces with 60-second freshness window.
 */
import type { Wallet } from 'ethers';
import type { IAuthStrategy, AuthenticatedRequest, RequestParams } from '../../types/adapter.js';
import type { KatanaOrderSignPayload, KatanaCancelSignPayload } from './types.js';
/**
 * Katana authentication configuration
 */
export interface KatanaAuthConfig {
    apiKey?: string;
    apiSecret?: string;
    wallet?: Wallet;
    /**
     * Wallet address (0x…) for read-only auth without exposing a private key.
     * Used as the `wallet` query/body param on user-data endpoints.
     * If `wallet` is provided, its `.address` takes precedence.
     */
    walletAddress?: string;
    testnet?: boolean;
}
/**
 * Katana authentication strategy
 *
 * - HMAC-SHA256: Applied to all private requests via KP-API-KEY + KP-HMAC-SIGNATURE headers
 * - EIP-712: Applied to write operations (orders, cancels, withdrawals)
 */
export declare class KatanaAuth implements IAuthStrategy {
    private readonly apiKey?;
    private readonly apiSecret?;
    private readonly wallet?;
    private readonly walletAddress?;
    private readonly testnet;
    private _serverTimeOffset;
    constructor(config: KatanaAuthConfig);
    /**
     * Check if HMAC credentials are available
     */
    hasCredentials(): boolean;
    /**
     * Check if wallet is available for EIP-712 signing
     */
    hasWallet(): boolean;
    /**
     * Require HMAC authentication for private methods
     */
    requireAuth(): void;
    /**
     * Require wallet for write operations
     */
    requireWallet(): void;
    /**
     * Set server time offset for nonce accuracy
     */
    setServerTimeOffset(offset: number): void;
    /**
     * Generate fresh UUID v1 nonce
     *
     * UUID v1 embeds a timestamp — server time offset is tracked
     * to detect clock skew (logged as warning during initialize).
     */
    generateNonce(): string;
    /**
     * Get server time offset (ms). Positive = server ahead of local clock.
     */
    getServerTimeOffset(): number;
    /**
     * Get wallet address. Prefers the ethers Wallet (trading-capable),
     * falls back to the read-only `walletAddress` config field.
     */
    getAddress(): string | undefined;
    /**
     * Sign a request with HMAC-SHA256 headers.
     *
     * Auto-injects a UUID v1 nonce into the payload when missing — Katana requires
     * `nonce` in the query string (GET) or JSON body (POST/DELETE), and the signature
     * is computed over the payload *including* that nonce. Callers that already set
     * `nonce` (e.g. write endpoints that pre-build EIP-712 signed bodies) are not
     * overridden.
     *
     * GET: HMAC of URL-encoded query string (with injected nonce)
     * POST/DELETE: HMAC of JSON request body (with injected nonce)
     *
     * @returns AuthenticatedRequest with updated `params`/`body` reflecting the
     *   injected nonce; callers MUST use these for the actual HTTP request so the
     *   wire payload matches the signed payload.
     */
    sign(request: RequestParams): Promise<AuthenticatedRequest>;
    /**
     * Verify authentication credentials
     */
    verify(): Promise<boolean>;
    /**
     * Sign an order using EIP-712 typed data
     */
    signOrder(payload: KatanaOrderSignPayload): Promise<string>;
    /**
     * Sign a cancel request using EIP-712 typed data
     */
    signCancel(payload: KatanaCancelSignPayload): Promise<string>;
    /**
     * Get authentication headers (for simple GET requests)
     */
    getHeaders(): Record<string, string>;
}
//# sourceMappingURL=KatanaAuth.d.ts.map
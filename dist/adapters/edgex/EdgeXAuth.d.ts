/**
 * EdgeX Authentication Strategy
 *
 * Implements ECDSA + SHA3 signing for EdgeX exchange
 */
import type { AuthenticatedRequest, IAuthStrategy, RequestParams } from '../../types/index.js';
export interface EdgeXAuthConfig {
    /** StarkNet private key for signing */
    starkPrivateKey: string;
}
export declare class EdgeXAuth implements IAuthStrategy {
    private readonly starkPrivateKey;
    constructor(config: EdgeXAuthConfig);
    /**
     * Sign a request with ECDSA signature using SHA3 hash
     */
    sign(request: RequestParams): Promise<AuthenticatedRequest>;
    /**
     * Get authentication headers
     */
    getHeaders(): Record<string, string>;
    /**
     * Sign request with ECDSA signature using SHA3 hash
     *
     * EdgeX authentication process:
     * 1. Create message: {timestamp}{METHOD}{path}{sorted_params}
     * 2. Hash with SHA3-256
     * 3. Sign with ECDSA using private key
     *
     * @see https://edgex-1.gitbook.io/edgeX-documentation/api/authentication
     */
    signRequest(method: string, path: string, timestamp: string, body?: Record<string, unknown>): Promise<string>;
    /**
     * Verify if credentials are available
     */
    hasCredentials(): boolean;
}
//# sourceMappingURL=EdgeXAuth.d.ts.map
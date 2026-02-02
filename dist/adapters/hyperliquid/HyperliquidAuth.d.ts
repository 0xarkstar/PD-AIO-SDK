/**
 * Hyperliquid Authentication Strategy
 *
 * Implements EIP-712 signing for Hyperliquid exchange
 */
import { ethers } from 'ethers';
import type { AuthenticatedRequest, IAuthStrategy, RequestParams } from '../../types/index.js';
export declare class HyperliquidAuth implements IAuthStrategy {
    private readonly wallet;
    private nonce;
    constructor(wallet: ethers.Wallet);
    /**
     * Sign a request with EIP-712 signature
     */
    sign(request: RequestParams): Promise<AuthenticatedRequest>;
    /**
     * Get authentication headers
     */
    getHeaders(): Record<string, string>;
    /**
     * Sign an action using EIP-712
     */
    private signAction;
    /**
     * Get wallet address
     */
    getAddress(): string;
    /**
     * Create connection ID for WebSocket authentication
     */
    getConnectionId(): string;
}
//# sourceMappingURL=HyperliquidAuth.d.ts.map
/**
 * Ethereal Authentication Strategy
 *
 * Implements EIP-712 signing for Ethereal exchange.
 */
import { ethers } from 'ethers';
import type { AuthenticatedRequest, IAuthStrategy, RequestParams } from '../../types/index.js';
export declare class EtherealAuth implements IAuthStrategy {
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
     * Sign an order action using EIP-712
     */
    signOrderAction(action: Record<string, unknown>): Promise<{
        signature: string;
        nonce: string;
    }>;
    /**
     * Sign a cancellation action
     */
    signCancelAction(accountId: string, _orderId?: string): Promise<{
        signature: string;
        nonce: string;
    }>;
    /**
     * Get wallet address
     */
    getAddress(): string;
    /**
     * Get next nonce
     */
    getNextNonce(): string;
}
//# sourceMappingURL=EtherealAuth.d.ts.map
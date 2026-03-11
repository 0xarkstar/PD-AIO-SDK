/**
 * Avantis Authentication Strategy
 *
 * Avantis uses direct wallet signing for on-chain transactions.
 * Unlike EIP-712 exchanges, Avantis just needs wallet.sendTransaction.
 */
import { ethers } from 'ethers';
import type { AuthenticatedRequest, IAuthStrategy, RequestParams } from '../../types/index.js';
export declare class AvantisAuth implements IAuthStrategy {
    private readonly wallet;
    private readonly provider;
    constructor(privateKey: string, rpcUrl: string);
    /**
     * Sign a request (no-op for on-chain DEX, signing happens at tx level)
     */
    sign(request: RequestParams): Promise<AuthenticatedRequest>;
    /**
     * Get headers (not used for on-chain interactions)
     */
    getHeaders(): Record<string, string>;
    /**
     * Get the connected wallet instance for sending transactions
     */
    getWallet(): ethers.Wallet;
    /**
     * Get the JSON-RPC provider
     */
    getProvider(): ethers.JsonRpcProvider;
    /**
     * Get wallet address
     */
    getAddress(): string;
    /**
     * Get current nonce for the wallet
     */
    getNonce(): Promise<number>;
}
//# sourceMappingURL=AvantisAuth.d.ts.map
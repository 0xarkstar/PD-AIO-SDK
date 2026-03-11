/**
 * Avantis Authentication Strategy
 *
 * Avantis uses direct wallet signing for on-chain transactions.
 * Unlike EIP-712 exchanges, Avantis just needs wallet.sendTransaction.
 */
import { ethers } from 'ethers';
export class AvantisAuth {
    wallet;
    provider;
    constructor(privateKey, rpcUrl) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
    }
    /**
     * Sign a request (no-op for on-chain DEX, signing happens at tx level)
     */
    async sign(request) {
        return {
            ...request,
            headers: this.getHeaders(),
        };
    }
    /**
     * Get headers (not used for on-chain interactions)
     */
    getHeaders() {
        return {};
    }
    /**
     * Get the connected wallet instance for sending transactions
     */
    getWallet() {
        return this.wallet;
    }
    /**
     * Get the JSON-RPC provider
     */
    getProvider() {
        return this.provider;
    }
    /**
     * Get wallet address
     */
    getAddress() {
        return this.wallet.address;
    }
    /**
     * Get current nonce for the wallet
     */
    async getNonce() {
        return this.provider.getTransactionCount(this.wallet.address, 'pending');
    }
}
//# sourceMappingURL=AvantisAuth.js.map
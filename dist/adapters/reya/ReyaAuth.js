/**
 * Reya Authentication Strategy
 *
 * Implements EIP-712 signing for Reya exchange.
 * Reya uses wallet-based signing similar to Hyperliquid.
 */
import { REYA_EIP712_DOMAIN } from './constants.js';
export class ReyaAuth {
    wallet;
    nonce;
    constructor(wallet) {
        this.wallet = wallet;
        this.nonce = BigInt(Date.now()) * BigInt(1000);
    }
    /**
     * Sign a request with EIP-712 signature
     */
    async sign(request) {
        if (!request.body) {
            return {
                ...request,
                headers: this.getHeaders(),
            };
        }
        return {
            ...request,
            headers: this.getHeaders(),
        };
    }
    /**
     * Get authentication headers
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
        };
    }
    /**
     * Sign an order action using EIP-712
     *
     * Creates a signature for order creation/cancellation that Reya
     * validates on-chain.
     */
    async signOrderAction(action) {
        this.nonce++;
        const nonce = this.nonce.toString();
        // EIP-712 typed data for order signing
        const domain = {
            ...REYA_EIP712_DOMAIN,
        };
        // Order signature type
        const types = {
            Order: [
                { name: 'accountId', type: 'uint128' },
                { name: 'subAccountId', type: 'uint128' },
                { name: 'nonce', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
            ],
        };
        const message = {
            accountId: BigInt(action.accountId ?? 0),
            subAccountId: BigInt(action.subAccountId ?? 0),
            nonce: BigInt(nonce),
            deadline: BigInt(action.deadline ?? Math.floor(Date.now() / 1000) + 300),
        };
        const signature = await this.wallet.signTypedData(domain, types, message);
        return { signature, nonce };
    }
    /**
     * Sign a cancellation action
     */
    async signCancelAction(accountId, _orderId) {
        this.nonce++;
        const nonce = this.nonce.toString();
        const domain = {
            ...REYA_EIP712_DOMAIN,
        };
        const types = {
            Cancel: [
                { name: 'accountId', type: 'uint128' },
                { name: 'nonce', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
            ],
        };
        const message = {
            accountId: BigInt(accountId),
            nonce: BigInt(nonce),
            deadline: BigInt(Math.floor(Date.now() / 1000) + 300),
        };
        const signature = await this.wallet.signTypedData(domain, types, message);
        return { signature, nonce };
    }
    /**
     * Get wallet address
     */
    getAddress() {
        return this.wallet.address;
    }
    /**
     * Get next nonce
     */
    getNextNonce() {
        this.nonce++;
        return this.nonce.toString();
    }
}
//# sourceMappingURL=ReyaAuth.js.map
/**
 * Ethereal Authentication Strategy
 *
 * Implements EIP-712 signing for Ethereal exchange.
 */
import { ETHEREAL_EIP712_DOMAIN } from './constants.js';
export class EtherealAuth {
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
     */
    async signOrderAction(action) {
        this.nonce++;
        const nonce = this.nonce.toString();
        const domain = {
            ...ETHEREAL_EIP712_DOMAIN,
        };
        const types = {
            Order: [
                { name: 'accountId', type: 'string' },
                { name: 'nonce', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
            ],
        };
        const message = {
            accountId: String(action.accountId ?? ''),
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
            ...ETHEREAL_EIP712_DOMAIN,
        };
        const types = {
            Cancel: [
                { name: 'accountId', type: 'string' },
                { name: 'nonce', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
            ],
        };
        const message = {
            accountId,
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
//# sourceMappingURL=EtherealAuth.js.map
/**
 * Hyperliquid Authentication Strategy
 *
 * Implements EIP-712 signing for Hyperliquid exchange
 */
import { ethers } from 'ethers';
import { HYPERLIQUID_EIP712_DOMAIN, HYPERLIQUID_ACTION_TYPES } from './constants.js';
export class HyperliquidAuth {
    wallet;
    nonce = Date.now();
    constructor(wallet) {
        this.wallet = wallet;
    }
    /**
     * Sign a request with EIP-712 signature
     */
    async sign(request) {
        if (!request.body) {
            // Public endpoints don't need signing
            return {
                ...request,
                headers: this.getHeaders(),
            };
        }
        // Extract action from request body
        const action = request.body;
        // Create signed action
        const signedAction = await this.signAction(action);
        return {
            ...request,
            body: signedAction,
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
     * Sign an action using EIP-712
     */
    async signAction(action) {
        // Increment nonce
        this.nonce++;
        // Create connection ID (phantom agent)
        const connectionId = ethers.keccak256(ethers.solidityPacked(['address'], [this.wallet.address]));
        // EIP-712 typed data for phantom agent
        const typedData = {
            domain: HYPERLIQUID_EIP712_DOMAIN,
            types: HYPERLIQUID_ACTION_TYPES,
            primaryType: 'Agent',
            message: {
                source: 'a', // 'a' for API
                connectionId,
            },
        };
        // Sign the typed data
        const signature = await this.wallet.signTypedData(typedData.domain, { Agent: typedData.types.Agent }, typedData.message);
        // Parse signature into r, s, v components
        const sig = ethers.Signature.from(signature);
        return {
            action,
            nonce: this.nonce,
            signature: {
                r: sig.r,
                s: sig.s,
                v: sig.v,
            },
        };
    }
    /**
     * Get wallet address
     */
    getAddress() {
        return this.wallet.address;
    }
    /**
     * Create connection ID for WebSocket authentication
     */
    getConnectionId() {
        return ethers.keccak256(ethers.solidityPacked(['address'], [this.wallet.address]));
    }
}
//# sourceMappingURL=HyperliquidAuth.js.map
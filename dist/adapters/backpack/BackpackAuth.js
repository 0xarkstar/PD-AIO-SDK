/**
 * Backpack Authentication Strategy
 *
 * Implements ED25519 signing for Backpack exchange
 */
import * as ed from '@noble/ed25519';
import { toBuffer, fromBuffer } from '../../utils/buffer.js';
import { PerpDEXError } from '../../types/errors.js';
export class BackpackAuth {
    apiKey;
    apiSecret;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.apiSecret = config.apiSecret;
    }
    /**
     * Sign a request with ED25519 signature
     */
    async sign(request) {
        const timestamp = Date.now().toString();
        const signature = await this.signRequest(request.method, request.path, timestamp, request.body);
        return {
            ...request,
            headers: {
                ...this.getHeaders(),
                'X-API-KEY': this.apiKey,
                'X-Timestamp': timestamp,
                'X-Signature': signature,
            },
        };
    }
    /**
     * Get authentication headers
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'X-API-KEY': this.apiKey,
        };
    }
    /**
     * Sign request with ED25519 signature
     * Uses cross-platform buffer utilities for browser compatibility
     */
    async signRequest(method, path, timestamp, body) {
        try {
            // Create message to sign
            const message = `${method}${path}${timestamp}${body ? JSON.stringify(body) : ''}`;
            const messageBytes = new TextEncoder().encode(message);
            // Convert private key to Uint8Array
            // Support both hex (0x... or plain hex) and base64 formats
            let privateKey;
            if (this.apiSecret.startsWith('0x')) {
                // Hex format with 0x prefix
                privateKey = toBuffer(this.apiSecret.slice(2), 'hex');
            }
            else if (/^[0-9a-fA-F]+$/.test(this.apiSecret)) {
                // Plain hex format
                privateKey = toBuffer(this.apiSecret, 'hex');
            }
            else {
                // Assume base64 format (Backpack's default format)
                privateKey = toBuffer(this.apiSecret, 'base64');
            }
            // Sign the message with ED25519
            const signature = await ed.signAsync(messageBytes, privateKey);
            // Return signature as base64 string (Backpack expects base64)
            return fromBuffer(new Uint8Array(signature), 'base64');
        }
        catch (error) {
            throw new PerpDEXError(`Failed to sign request: ${error instanceof Error ? error.message : String(error)}`, 'SIGNATURE_ERROR', 'backpack');
        }
    }
    /**
     * Verify if credentials are available
     */
    hasCredentials() {
        return !!(this.apiKey && this.apiSecret);
    }
    /**
     * Get the API key
     */
    getApiKey() {
        return this.apiKey;
    }
}
//# sourceMappingURL=BackpackAuth.js.map
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
        const instruction = request.instruction ?? '';
        const signature = await this.signRequest(instruction, timestamp, request.body);
        return {
            ...request,
            headers: {
                ...this.getHeaders(),
                'X-API-KEY': this.apiKey,
                'X-Timestamp': timestamp,
                'X-Window': '5000',
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
     *
     * Backpack requires alphabetized query/body params with instruction prefix:
     * `instruction=orderExecute&orderType=Limit&price=100&...&timestamp=...&window=5000`
     *
     * Uses cross-platform buffer utilities for browser compatibility
     */
    async signRequest(instruction, timestamp, body) {
        try {
            // Build the params object: merge body params + instruction + timestamp + window
            const params = {};
            if (instruction) {
                params.instruction = instruction;
            }
            // Merge body params (flatten to string values)
            if (body) {
                for (const [key, value] of Object.entries(body)) {
                    if (value !== undefined && value !== null) {
                        params[key] = String(value);
                    }
                }
            }
            params.timestamp = timestamp;
            params.window = '5000';
            // Sort keys alphabetically and build the signing string
            const sortedKeys = Object.keys(params).sort();
            const message = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
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
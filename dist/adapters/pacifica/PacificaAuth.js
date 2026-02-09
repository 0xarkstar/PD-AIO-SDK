/**
 * Pacifica Authentication (Ed25519)
 *
 * Similar to Backpack auth pattern: method + path + timestamp + window + body signing
 */
import * as ed from '@noble/ed25519';
import { toBuffer, fromBuffer } from '../../utils/buffer.js';
import { PerpDEXError } from '../../types/errors.js';
import { PACIFICA_AUTH_WINDOW } from './constants.js';
export class PacificaAuth {
    apiKey;
    apiSecret;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.apiSecret = config.apiSecret;
    }
    async sign(request) {
        const timestamp = String(request.timestamp ?? Date.now());
        const window = String(PACIFICA_AUTH_WINDOW);
        const bodyStr = request.body ? JSON.stringify(request.body) : '';
        const message = `${request.method}${request.path}${timestamp}${window}${bodyStr}`;
        const signature = await this.signMessage(message);
        return {
            ...request,
            headers: {
                'X-API-KEY': this.apiKey,
                'X-Timestamp': timestamp,
                'X-Window': window,
                'X-Signature': signature,
                'Content-Type': 'application/json',
            },
        };
    }
    async signMessage(message) {
        try {
            const messageBytes = new TextEncoder().encode(message);
            const privateKey = toBuffer(this.apiSecret, 'hex');
            const signature = await ed.signAsync(messageBytes, privateKey);
            return fromBuffer(new Uint8Array(signature), 'base64');
        }
        catch (error) {
            throw new PerpDEXError(`Failed to sign request: ${error instanceof Error ? error.message : String(error)}`, 'SIGNATURE_ERROR', 'pacifica');
        }
    }
    getHeaders() {
        return {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
        };
    }
    hasCredentials() {
        return !!(this.apiKey && this.apiSecret);
    }
}
//# sourceMappingURL=PacificaAuth.js.map
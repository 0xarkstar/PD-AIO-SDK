/**
 * EdgeX Authentication Strategy
 *
 * Implements ECDSA + SHA3 signing for EdgeX exchange
 */
import { createSha3HashBuffer } from '../../utils/crypto.js';
import { ec } from 'starknet';
import { PerpDEXError } from '../../types/errors.js';
export class EdgeXAuth {
    starkPrivateKey;
    constructor(config) {
        this.starkPrivateKey = config.starkPrivateKey;
    }
    /**
     * Sign a request with ECDSA signature using SHA3 hash
     */
    async sign(request) {
        const timestamp = Date.now().toString();
        const signature = await this.signRequest(request.method, request.path, timestamp, request.body);
        return {
            ...request,
            headers: {
                ...this.getHeaders(),
                'X-edgeX-Api-Timestamp': timestamp,
                'X-edgeX-Api-Signature': signature,
            },
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
     * Sign request with ECDSA signature using SHA3 hash
     *
     * EdgeX authentication process:
     * 1. Create message: {timestamp}{METHOD}{path}{sorted_params}
     * 2. Hash with SHA3-256
     * 3. Sign with ECDSA using private key
     *
     * @see https://edgex-1.gitbook.io/edgeX-documentation/api/authentication
     */
    async signRequest(method, path, timestamp, body) {
        try {
            // Parse path and query parameters
            const [basePath, queryString] = path.split('?');
            // Build sorted query parameters
            let sortedParams = '';
            if (queryString) {
                const params = new URLSearchParams(queryString);
                const sortedKeys = Array.from(params.keys()).sort();
                sortedParams = sortedKeys.map((k) => `${k}=${params.get(k)}`).join('&');
            }
            else if (body) {
                const sortedKeys = Object.keys(body).sort();
                sortedParams = sortedKeys.map((k) => `${k}=${String(body[k])}`).join('&');
            }
            // Create message: timestamp + METHOD + path + sorted_params
            const message = `${timestamp}${method.toUpperCase()}${basePath}${sortedParams}`;
            // Hash with SHA3-256 (cross-platform)
            const messageHash = await createSha3HashBuffer(message);
            // Sign with ECDSA using private key
            const signature = ec.starkCurve.sign(messageHash, this.starkPrivateKey);
            // Return signature in hex format
            return `0x${signature.r.toString(16).padStart(64, '0')}${signature.s.toString(16).padStart(64, '0')}`;
        }
        catch (error) {
            throw new PerpDEXError(`Failed to sign request: ${error instanceof Error ? error.message : String(error)}`, 'SIGNATURE_ERROR', 'edgex');
        }
    }
    /**
     * Verify if credentials are available
     */
    hasCredentials() {
        return !!this.starkPrivateKey;
    }
}
//# sourceMappingURL=EdgeXAuth.js.map
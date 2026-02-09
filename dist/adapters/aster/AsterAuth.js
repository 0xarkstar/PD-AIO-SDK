/**
 * Aster Authentication (HMAC-SHA256)
 */
import { createHmacSha256 } from '../../utils/crypto.js';
import { ASTER_DEFAULT_RECV_WINDOW } from './constants.js';
export class AsterAuth {
    apiKey;
    apiSecret;
    recvWindow;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.apiSecret = config.apiSecret;
        this.recvWindow = config.recvWindow ?? ASTER_DEFAULT_RECV_WINDOW;
    }
    async sign(request) {
        const timestamp = request.timestamp ?? Date.now();
        const queryParams = this.buildQueryString(request, timestamp);
        const signature = await createHmacSha256(queryParams, this.apiSecret);
        return {
            ...request,
            params: {
                ...(request.params ?? {}),
                timestamp,
                recvWindow: this.recvWindow,
                signature,
            },
            headers: {
                'X-MBX-APIKEY': this.apiKey,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };
    }
    buildQueryString(request, timestamp) {
        const allParams = {
            ...(request.params ?? {}),
            timestamp,
            recvWindow: this.recvWindow,
        };
        // If body is an object, merge its params
        if (request.body && typeof request.body === 'object') {
            const bodyObj = request.body;
            for (const [key, value] of Object.entries(bodyObj)) {
                allParams[key] = value;
            }
        }
        return Object.entries(allParams)
            .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
            .join('&');
    }
    getHeaders() {
        return {
            'X-MBX-APIKEY': this.apiKey,
        };
    }
    hasCredentials() {
        return !!(this.apiKey && this.apiSecret);
    }
}
//# sourceMappingURL=AsterAuth.js.map
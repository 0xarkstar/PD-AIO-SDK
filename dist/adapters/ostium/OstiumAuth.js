/**
 * Ostium Authentication (EVM Wallet)
 *
 * Note: Ostium's on-chain interactions are read-only via RPC.
 * The sign() method is a no-op because Ostium does not require
 * request-level authentication for its REST API.
 *
 * Private key handling is deferred to the caller — this class
 * intentionally does NOT store private keys to minimize exposure.
 */
export class OstiumAuth {
    rpcUrl;
    constructor(config) {
        this.rpcUrl = config.rpcUrl;
    }
    getRpcUrl() {
        return this.rpcUrl;
    }
    async sign(request) {
        return { ...request };
    }
    getHeaders() {
        return { 'Content-Type': 'application/json' };
    }
    hasCredentials() {
        return !!this.rpcUrl;
    }
}
//# sourceMappingURL=OstiumAuth.js.map
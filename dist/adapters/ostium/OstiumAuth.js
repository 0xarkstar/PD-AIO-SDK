/**
 * Ostium Authentication (EVM Wallet)
 */
export class OstiumAuth {
    privateKey;
    rpcUrl;
    constructor(config) {
        this.privateKey = config.privateKey;
        this.rpcUrl = config.rpcUrl;
    }
    getPrivateKey() {
        return this.privateKey;
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
        return !!(this.privateKey && this.rpcUrl);
    }
    getAddress() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Wallet } = require('ethers');
        const wallet = new Wallet(this.privateKey);
        return wallet.address;
    }
}
//# sourceMappingURL=OstiumAuth.js.map
/**
 * Lighter Nonce Manager
 *
 * Manages nonce values for Lighter transaction signing.
 * Uses optimistic nonce incrementing with server synchronization.
 */
/**
 * NonceManager handles nonce management for Lighter transactions
 *
 * Implements optimistic nonce strategy:
 * - Fetches initial nonce from server on first use
 * - Increments locally for subsequent transactions
 * - Resyncs with server on transaction failures
 */
export class NonceManager {
    currentNonce = BigInt(-1);
    httpClient;
    apiKeyIndex;
    autoSync;
    syncPromise = null;
    lastSyncTime = 0;
    /** Minimum time between forced syncs (ms) */
    static MIN_SYNC_INTERVAL = 1000;
    constructor(config) {
        this.httpClient = config.httpClient;
        this.apiKeyIndex = config.apiKeyIndex;
        this.autoSync = config.autoSync ?? true;
    }
    /**
     * Get the next nonce value for a transaction
     *
     * On first call, syncs with the server to get the current nonce.
     * Subsequent calls return incrementing local values.
     *
     * @returns Next nonce value
     */
    async getNextNonce() {
        // Initialize from server if not yet synced
        if (this.currentNonce === BigInt(-1) && this.autoSync) {
            await this.sync();
        }
        // If still not initialized (autoSync disabled), throw
        if (this.currentNonce === BigInt(-1)) {
            throw new Error('Nonce not initialized. Call sync() first.');
        }
        // Return current and increment
        const nonce = this.currentNonce;
        this.currentNonce++;
        return nonce;
    }
    /**
     * Peek at the current nonce without incrementing
     *
     * @returns Current nonce value
     */
    peekNonce() {
        return this.currentNonce;
    }
    /**
     * Synchronize nonce with the server
     *
     * Should be called:
     * - On initialization (automatic if autoSync is true)
     * - After transaction failures that may indicate nonce issues
     * - If local nonce gets too far ahead of server
     */
    async sync() {
        // Prevent concurrent syncs
        if (this.syncPromise) {
            return this.syncPromise;
        }
        // Rate limit syncs
        const now = Date.now();
        if (now - this.lastSyncTime < NonceManager.MIN_SYNC_INTERVAL) {
            return;
        }
        this.syncPromise = this.doSync();
        try {
            await this.syncPromise;
        }
        finally {
            this.syncPromise = null;
        }
    }
    /**
     * Perform the actual sync operation
     */
    async doSync() {
        try {
            const response = await this.httpClient.get(`/api/v1/nextNonce?api_key_index=${this.apiKeyIndex}`);
            if (response.code === 0 && response.nonce !== undefined) {
                const serverNonce = BigInt(response.nonce);
                this.currentNonce = serverNonce;
                this.lastSyncTime = Date.now();
            }
            else {
                throw new Error(`Invalid nonce response: ${JSON.stringify(response)}`);
            }
        }
        catch (error) {
            // If we have a local nonce, keep using it
            if (this.currentNonce !== BigInt(-1)) {
                console.warn('Failed to sync nonce with server, using local value');
                return;
            }
            throw error;
        }
    }
    /**
     * Reset the nonce manager
     *
     * Forces re-sync on next getNextNonce() call.
     * Use after detected nonce errors or when account state changes.
     */
    reset() {
        this.currentNonce = BigInt(-1);
        this.lastSyncTime = 0;
        this.syncPromise = null;
    }
    /**
     * Set a specific nonce value
     *
     * Useful for recovery scenarios or manual override.
     * Use with caution - incorrect nonce will cause transaction failures.
     *
     * @param nonce - Nonce value to set
     */
    setNonce(nonce) {
        if (nonce < BigInt(0)) {
            throw new Error('Nonce cannot be negative');
        }
        this.currentNonce = nonce;
        this.lastSyncTime = Date.now();
    }
    /**
     * Rollback nonce by one
     *
     * Use when a transaction fails before submission
     * (not on server rejection, as the nonce was consumed).
     */
    rollback() {
        if (this.currentNonce > BigInt(0)) {
            this.currentNonce--;
        }
    }
    /**
     * Get time since last sync
     *
     * @returns Milliseconds since last successful sync
     */
    timeSinceSync() {
        if (this.lastSyncTime === 0) {
            return Infinity;
        }
        return Date.now() - this.lastSyncTime;
    }
    /**
     * Check if nonce is initialized
     */
    get isInitialized() {
        return this.currentNonce !== BigInt(-1);
    }
}
//# sourceMappingURL=NonceManager.js.map
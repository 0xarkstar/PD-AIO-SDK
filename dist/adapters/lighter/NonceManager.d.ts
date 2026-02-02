/**
 * Lighter Nonce Manager
 *
 * Manages nonce values for Lighter transaction signing.
 * Uses optimistic nonce incrementing with server synchronization.
 */
import { HTTPClient } from '../../core/http/HTTPClient.js';
/**
 * NonceManager configuration
 */
export interface NonceManagerConfig {
    /** HTTP client for API calls */
    httpClient: HTTPClient;
    /** API key index */
    apiKeyIndex: number;
    /** Whether to auto-sync on first call (default: true) */
    autoSync?: boolean;
}
/**
 * NonceManager handles nonce management for Lighter transactions
 *
 * Implements optimistic nonce strategy:
 * - Fetches initial nonce from server on first use
 * - Increments locally for subsequent transactions
 * - Resyncs with server on transaction failures
 */
export declare class NonceManager {
    private currentNonce;
    private readonly httpClient;
    private readonly apiKeyIndex;
    private readonly autoSync;
    private syncPromise;
    private lastSyncTime;
    /** Minimum time between forced syncs (ms) */
    private static readonly MIN_SYNC_INTERVAL;
    constructor(config: NonceManagerConfig);
    /**
     * Get the next nonce value for a transaction
     *
     * On first call, syncs with the server to get the current nonce.
     * Subsequent calls return incrementing local values.
     *
     * @returns Next nonce value
     */
    getNextNonce(): Promise<bigint>;
    /**
     * Peek at the current nonce without incrementing
     *
     * @returns Current nonce value
     */
    peekNonce(): bigint;
    /**
     * Synchronize nonce with the server
     *
     * Should be called:
     * - On initialization (automatic if autoSync is true)
     * - After transaction failures that may indicate nonce issues
     * - If local nonce gets too far ahead of server
     */
    sync(): Promise<void>;
    /**
     * Perform the actual sync operation
     */
    private doSync;
    /**
     * Reset the nonce manager
     *
     * Forces re-sync on next getNextNonce() call.
     * Use after detected nonce errors or when account state changes.
     */
    reset(): void;
    /**
     * Set a specific nonce value
     *
     * Useful for recovery scenarios or manual override.
     * Use with caution - incorrect nonce will cause transaction failures.
     *
     * @param nonce - Nonce value to set
     */
    setNonce(nonce: bigint): void;
    /**
     * Rollback nonce by one
     *
     * Use when a transaction fails before submission
     * (not on server rejection, as the nonce was consumed).
     */
    rollback(): void;
    /**
     * Get time since last sync
     *
     * @returns Milliseconds since last successful sync
     */
    timeSinceSync(): number;
    /**
     * Check if nonce is initialized
     */
    get isInitialized(): boolean;
}
//# sourceMappingURL=NonceManager.d.ts.map
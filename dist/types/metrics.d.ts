/**
 * API Metrics Types
 *
 * Types for tracking API usage, performance, and rate limits
 */
/**
 * Per-endpoint metrics
 */
export interface EndpointMetrics {
    /** Endpoint path/name */
    endpoint: string;
    /** Total number of requests */
    count: number;
    /** Total latency across all requests (ms) */
    totalLatency: number;
    /** Number of errors */
    errors: number;
    /** Minimum latency observed (ms) */
    minLatency: number;
    /** Maximum latency observed (ms) */
    maxLatency: number;
    /** Last request timestamp */
    lastRequestAt?: number;
}
/**
 * Overall API metrics
 */
export interface APIMetrics {
    /** Total number of API requests */
    totalRequests: number;
    /** Number of successful requests */
    successfulRequests: number;
    /** Number of failed requests */
    failedRequests: number;
    /** Number of rate limit hits */
    rateLimitHits: number;
    /** Average latency across all requests (ms) */
    averageLatency: number;
    /** Per-endpoint statistics */
    endpointStats: Map<string, EndpointMetrics>;
    /** When metrics collection started */
    startedAt: number;
    /** Last reset timestamp */
    lastResetAt?: number;
}
/**
 * Metrics snapshot for reporting
 */
export interface MetricsSnapshot {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    rateLimitHits: number;
    averageLatency: number;
    successRate: number;
    errorRate: number;
    endpoints: Array<{
        endpoint: string;
        count: number;
        averageLatency: number;
        errorRate: number;
    }>;
    collectionDuration: number;
    timestamp: number;
}
/**
 * Convert APIMetrics to snapshot for reporting
 */
export declare function createMetricsSnapshot(metrics: APIMetrics): MetricsSnapshot;
/**
 * Get top N endpoints by request count
 */
export declare function getTopEndpoints(metrics: APIMetrics, limit?: number): EndpointMetrics[];
/**
 * Get slowest endpoints by average latency
 */
export declare function getSlowestEndpoints(metrics: APIMetrics, limit?: number): Array<{
    endpoint: string;
    averageLatency: number;
    count: number;
}>;
/**
 * Get endpoints with highest error rates
 */
export declare function getMostErrorProneEndpoints(metrics: APIMetrics, limit?: number): Array<{
    endpoint: string;
    errorRate: number;
    errors: number;
    total: number;
}>;
//# sourceMappingURL=metrics.d.ts.map
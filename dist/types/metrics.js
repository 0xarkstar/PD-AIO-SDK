/**
 * API Metrics Types
 *
 * Types for tracking API usage, performance, and rate limits
 */
/**
 * Convert APIMetrics to snapshot for reporting
 */
export function createMetricsSnapshot(metrics) {
    const { totalRequests, successfulRequests, failedRequests, rateLimitHits, averageLatency, endpointStats, startedAt, } = metrics;
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;
    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;
    const endpoints = Array.from(endpointStats.values()).map((stats) => ({
        endpoint: stats.endpoint,
        count: stats.count,
        averageLatency: stats.count > 0 ? stats.totalLatency / stats.count : 0,
        errorRate: stats.count > 0 ? stats.errors / stats.count : 0,
    }));
    // Sort by request count (descending)
    endpoints.sort((a, b) => b.count - a.count);
    return {
        totalRequests,
        successfulRequests,
        failedRequests,
        rateLimitHits,
        averageLatency,
        successRate,
        errorRate,
        endpoints,
        collectionDuration: Date.now() - startedAt,
        timestamp: Date.now(),
    };
}
/**
 * Get top N endpoints by request count
 */
export function getTopEndpoints(metrics, limit = 10) {
    const endpoints = Array.from(metrics.endpointStats.values());
    endpoints.sort((a, b) => b.count - a.count);
    return endpoints.slice(0, limit);
}
/**
 * Get slowest endpoints by average latency
 */
export function getSlowestEndpoints(metrics, limit = 10) {
    const endpoints = Array.from(metrics.endpointStats.values()).map((stats) => ({
        endpoint: stats.endpoint,
        averageLatency: stats.count > 0 ? stats.totalLatency / stats.count : 0,
        count: stats.count,
    }));
    endpoints.sort((a, b) => b.averageLatency - a.averageLatency);
    return endpoints.slice(0, limit);
}
/**
 * Get endpoints with highest error rates
 */
export function getMostErrorProneEndpoints(metrics, limit = 10) {
    const endpoints = Array.from(metrics.endpointStats.values()).map((stats) => ({
        endpoint: stats.endpoint,
        errorRate: stats.count > 0 ? stats.errors / stats.count : 0,
        errors: stats.errors,
        total: stats.count,
    }));
    endpoints.sort((a, b) => b.errorRate - a.errorRate);
    return endpoints.slice(0, limit);
}
//# sourceMappingURL=metrics.js.map
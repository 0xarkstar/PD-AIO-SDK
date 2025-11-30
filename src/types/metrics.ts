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
  collectionDuration: number; // ms since metrics started
  timestamp: number;
}

/**
 * Convert APIMetrics to snapshot for reporting
 */
export function createMetricsSnapshot(metrics: APIMetrics): MetricsSnapshot {
  const { totalRequests, successfulRequests, failedRequests, rateLimitHits, averageLatency, endpointStats, startedAt } = metrics;

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
export function getTopEndpoints(metrics: APIMetrics, limit = 10): EndpointMetrics[] {
  const endpoints = Array.from(metrics.endpointStats.values());
  endpoints.sort((a, b) => b.count - a.count);
  return endpoints.slice(0, limit);
}

/**
 * Get slowest endpoints by average latency
 */
export function getSlowestEndpoints(metrics: APIMetrics, limit = 10): Array<{
  endpoint: string;
  averageLatency: number;
  count: number;
}> {
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
export function getMostErrorProneEndpoints(metrics: APIMetrics, limit = 10): Array<{
  endpoint: string;
  errorRate: number;
  errors: number;
  total: number;
}> {
  const endpoints = Array.from(metrics.endpointStats.values()).map((stats) => ({
    endpoint: stats.endpoint,
    errorRate: stats.count > 0 ? stats.errors / stats.count : 0,
    errors: stats.errors,
    total: stats.count,
  }));

  endpoints.sort((a, b) => b.errorRate - a.errorRate);
  return endpoints.slice(0, limit);
}

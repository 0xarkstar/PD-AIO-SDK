/**
 * Metrics HTTP Server
 *
 * Lightweight HTTP server for exposing Prometheus metrics and health endpoints.
 * Designed for production use with minimal dependencies.
 */
import { PrometheusMetrics } from './prometheus.js';
/**
 * Metrics server configuration
 */
export interface MetricsServerConfig {
    /**
     * Port to listen on (default: 9090)
     */
    port?: number;
    /**
     * Host to bind to (default: '0.0.0.0')
     */
    host?: string;
    /**
     * Enable authentication for metrics endpoint
     */
    enableAuth?: boolean;
    /**
     * Bearer token for authentication (required if enableAuth is true)
     */
    authToken?: string;
    /**
     * Custom Prometheus metrics instance
     */
    metrics?: PrometheusMetrics;
    /**
     * Additional health check function
     */
    healthCheck?: () => Promise<HealthCheckResponse> | HealthCheckResponse;
    /**
     * Enable CORS headers
     */
    enableCors?: boolean;
    /**
     * Custom CORS origin (default: '*')
     */
    corsOrigin?: string;
}
/**
 * Health check response
 */
export interface HealthCheckResponse {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    details?: Record<string, any>;
}
/**
 * Metrics HTTP Server
 *
 * Exposes Prometheus metrics via HTTP for scraping.
 *
 * @example
 * ```typescript
 * import { initializeMetrics } from './prometheus';
 * import { MetricsServer } from './metrics-server';
 *
 * // Initialize metrics
 * initializeMetrics({ metricPrefix: 'myapp_' });
 *
 * // Start metrics server
 * const server = new MetricsServer({ port: 9090 });
 * await server.start();
 *
 * // Prometheus can now scrape http://localhost:9090/metrics
 * ```
 */
export declare class MetricsServer {
    private server?;
    private config;
    private metrics;
    private startTime;
    private isRunning;
    private readonly logger;
    constructor(config?: MetricsServerConfig);
    /**
     * Start the metrics server
     */
    start(): Promise<void>;
    /**
     * Stop the metrics server
     */
    stop(): Promise<void>;
    /**
     * Check if server is running
     */
    getIsRunning(): boolean;
    /**
     * Get server address
     */
    getAddress(): {
        host: string;
        port: number;
    } | null;
    /**
     * Handle incoming HTTP request
     */
    private handleRequest;
    /**
     * Handle /metrics endpoint
     */
    private handleMetricsRequest;
    /**
     * Handle /health endpoint
     */
    private handleHealthRequest;
    /**
     * Handle root endpoint
     */
    private handleRootRequest;
    /**
     * Send HTTP response
     */
    private sendResponse;
}
/**
 * Create and start a metrics server
 *
 * @param config - Server configuration
 * @returns Running metrics server instance
 */
export declare function startMetricsServer(config?: MetricsServerConfig): Promise<MetricsServer>;
//# sourceMappingURL=metrics-server.d.ts.map
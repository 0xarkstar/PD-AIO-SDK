/**
 * Metrics HTTP Server
 *
 * Lightweight HTTP server for exposing Prometheus metrics and health endpoints.
 * Designed for production use with minimal dependencies.
 */
import { createServer } from 'http';
import { getMetrics, isMetricsInitialized } from './prometheus.js';
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
export class MetricsServer {
    server;
    config;
    metrics;
    startTime;
    isRunning = false;
    constructor(config = {}) {
        this.config = {
            port: config.port ?? 9090,
            host: config.host ?? '0.0.0.0',
            enableAuth: config.enableAuth ?? false,
            authToken: config.authToken,
            metrics: config.metrics ?? (isMetricsInitialized() ? getMetrics() : undefined),
            healthCheck: config.healthCheck,
            enableCors: config.enableCors ?? false,
            corsOrigin: config.corsOrigin ?? '*',
        };
        if (!this.config.metrics) {
            throw new Error('Metrics not initialized. Call initializeMetrics() or provide metrics instance in config.');
        }
        if (this.config.enableAuth && !this.config.authToken) {
            throw new Error('authToken is required when enableAuth is true');
        }
        this.metrics = this.config.metrics;
        this.startTime = Date.now();
    }
    /**
     * Start the metrics server
     */
    async start() {
        if (this.isRunning) {
            throw new Error('Metrics server is already running');
        }
        return new Promise((resolve, reject) => {
            this.server = createServer((req, res) => {
                this.handleRequest(req, res).catch((error) => {
                    console.error('Error handling request:', error);
                    this.sendResponse(res, 500, 'Internal Server Error');
                });
            });
            this.server.on('error', (error) => {
                reject(error);
            });
            this.server.listen(this.config.port, this.config.host, () => {
                this.isRunning = true;
                console.log(`Metrics server listening on http://${this.config.host}:${this.config.port}`);
                resolve();
            });
        });
    }
    /**
     * Stop the metrics server
     */
    async stop() {
        if (!this.isRunning || !this.server) {
            return;
        }
        return new Promise((resolve, reject) => {
            this.server.close((error) => {
                if (error) {
                    reject(error);
                }
                else {
                    this.isRunning = false;
                    console.log('Metrics server stopped');
                    resolve();
                }
            });
        });
    }
    /**
     * Check if server is running
     */
    getIsRunning() {
        return this.isRunning;
    }
    /**
     * Get server address
     */
    getAddress() {
        if (!this.isRunning || !this.server) {
            return null;
        }
        const address = this.server.address();
        if (!address || typeof address === 'string') {
            return null;
        }
        return {
            host: address.address,
            port: address.port,
        };
    }
    /**
     * Handle incoming HTTP request
     */
    async handleRequest(req, res) {
        // Add CORS headers if enabled
        if (this.config.enableCors) {
            res.setHeader('Access-Control-Allow-Origin', this.config.corsOrigin);
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
            // Handle preflight requests
            if (req.method === 'OPTIONS') {
                this.sendResponse(res, 204, '');
                return;
            }
        }
        // Only allow GET requests
        if (req.method !== 'GET') {
            this.sendResponse(res, 405, 'Method Not Allowed');
            return;
        }
        // Check authentication if enabled
        if (this.config.enableAuth) {
            const authHeader = req.headers.authorization;
            const expectedAuth = `Bearer ${this.config.authToken}`;
            if (!authHeader || authHeader !== expectedAuth) {
                res.setHeader('WWW-Authenticate', 'Bearer');
                this.sendResponse(res, 401, 'Unauthorized');
                return;
            }
        }
        // Route the request
        const url = req.url || '/';
        if (url === '/metrics') {
            await this.handleMetricsRequest(res);
        }
        else if (url === '/health') {
            await this.handleHealthRequest(res);
        }
        else if (url === '/') {
            this.handleRootRequest(res);
        }
        else {
            this.sendResponse(res, 404, 'Not Found');
        }
    }
    /**
     * Handle /metrics endpoint
     */
    async handleMetricsRequest(res) {
        try {
            const metricsText = await this.metrics.getMetrics();
            const contentType = this.metrics.getContentType();
            res.setHeader('Content-Type', contentType);
            this.sendResponse(res, 200, metricsText);
        }
        catch (error) {
            console.error('Error generating metrics:', error);
            this.sendResponse(res, 500, 'Error generating metrics');
        }
    }
    /**
     * Handle /health endpoint
     */
    async handleHealthRequest(res) {
        try {
            const uptime = Date.now() - this.startTime;
            let healthResponse = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime,
            };
            // Run custom health check if provided
            if (this.config.healthCheck) {
                const customHealth = await this.config.healthCheck();
                healthResponse = {
                    ...healthResponse,
                    ...customHealth,
                };
            }
            const statusCode = healthResponse.status === 'healthy' ? 200 : 503;
            res.setHeader('Content-Type', 'application/json');
            this.sendResponse(res, statusCode, JSON.stringify(healthResponse, null, 2));
        }
        catch (error) {
            console.error('Error in health check:', error);
            const errorResponse = {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                uptime: Date.now() - this.startTime,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            };
            res.setHeader('Content-Type', 'application/json');
            this.sendResponse(res, 503, JSON.stringify(errorResponse, null, 2));
        }
    }
    /**
     * Handle root endpoint
     */
    handleRootRequest(res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Metrics Server</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #333; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .endpoint {
      background: #f5f5f5;
      padding: 15px;
      margin: 10px 0;
      border-radius: 5px;
    }
    code {
      background: #e0e0e0;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
  </style>
</head>
<body>
  <h1>Perp DEX SDK - Metrics Server</h1>
  <p>This server exposes Prometheus metrics and health status.</p>

  <div class="endpoint">
    <h2>📊 <a href="/metrics">Metrics</a></h2>
    <p>Prometheus-compatible metrics endpoint</p>
    <code>GET /metrics</code>
  </div>

  <div class="endpoint">
    <h2>🏥 <a href="/health">Health</a></h2>
    <p>Application health status</p>
    <code>GET /health</code>
  </div>

  <hr>
  <p><small>Uptime: ${Math.floor((Date.now() - this.startTime) / 1000)}s</small></p>
</body>
</html>
    `.trim();
        res.setHeader('Content-Type', 'text/html');
        this.sendResponse(res, 200, html);
        return Promise.resolve();
    }
    /**
     * Send HTTP response
     */
    sendResponse(res, statusCode, body) {
        res.statusCode = statusCode;
        res.end(body);
    }
}
/**
 * Create and start a metrics server
 *
 * @param config - Server configuration
 * @returns Running metrics server instance
 */
export async function startMetricsServer(config) {
    const server = new MetricsServer(config);
    await server.start();
    return server;
}
//# sourceMappingURL=metrics-server.js.map
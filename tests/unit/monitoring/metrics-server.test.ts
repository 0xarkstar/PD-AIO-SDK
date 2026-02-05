/**
 * Metrics Server Tests
 *
 * Tests the HTTP server that exposes Prometheus metrics
 */

import { Registry } from 'prom-client';
import { initializeMetrics, PrometheusMetrics } from '../../../src/monitoring/prometheus.js';
import {
  MetricsServer,
  startMetricsServer,
  type HealthCheckResponse,
} from '../../../src/monitoring/metrics-server.js';

describe('MetricsServer', () => {
  let metrics: PrometheusMetrics;
  let registry: Registry;
  let server: MetricsServer;

  beforeEach(() => {
    registry = new Registry();
    metrics = initializeMetrics({
      registry,
      metricPrefix: 'test_',
      enableDefaultMetrics: false,
    });
  });

  afterEach(async () => {
    if (server && server.getIsRunning()) {
      await server.stop();
    }
    registry.clear();
  });

  describe('Initialization', () => {
    test('should create server with default config', () => {
      server = new MetricsServer({ metrics });
      expect(server).toBeDefined();
      expect(server.getIsRunning()).toBe(false);
    });

    test('should use global metrics if not provided in config', () => {
      // Global metrics was initialized in beforeEach via initializeMetrics
      // So creating server without metrics param should work
      const serverWithGlobal = new MetricsServer();
      expect(serverWithGlobal).toBeDefined();
    });

    test('should throw error if auth enabled without token', () => {
      expect(() => new MetricsServer({ metrics, enableAuth: true })).toThrow(
        'authToken is required when enableAuth is true'
      );
    });

    test('should accept custom port and host', () => {
      server = new MetricsServer({
        metrics,
        port: 9999,
        host: '127.0.0.1',
      });
      expect(server).toBeDefined();
    });
  });

  describe('Server Lifecycle', () => {
    test('should start and stop server', async () => {
      server = new MetricsServer({ metrics, port: 0 }); // Port 0 = random available port

      expect(server.getIsRunning()).toBe(false);

      await server.start();
      expect(server.getIsRunning()).toBe(true);

      const address = server.getAddress();
      expect(address).not.toBeNull();
      expect(address!.port).toBeGreaterThan(0);

      await server.stop();
      expect(server.getIsRunning()).toBe(false);
    });

    test('should throw error if starting already running server', async () => {
      server = new MetricsServer({ metrics, port: 0 });
      await server.start();

      await expect(server.start()).rejects.toThrow('Metrics server is already running');
    });

    test('should handle stop on non-running server', async () => {
      server = new MetricsServer({ metrics });
      await expect(server.stop()).resolves.not.toThrow();
    });
  });

  describe('HTTP Endpoints', () => {
    beforeEach(async () => {
      server = new MetricsServer({ metrics, port: 0 });
      await server.start();
    });

    test('should serve metrics endpoint', async () => {
      const address = server.getAddress()!;
      const url = `http://localhost:${address.port}/metrics`;

      const response = await fetch(url);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/plain');

      const text = await response.text();
      expect(text).toContain('test_');
    });

    test('should serve health endpoint', async () => {
      const address = server.getAddress()!;
      const url = `http://localhost:${address.port}/health`;

      const response = await fetch(url);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const json = await response.json();
      expect(json).toHaveProperty('status', 'healthy');
      expect(json).toHaveProperty('timestamp');
      expect(json).toHaveProperty('uptime');
    });

    test('should serve root endpoint with HTML', async () => {
      const address = server.getAddress()!;
      const url = `http://localhost:${address.port}/`;

      const response = await fetch(url);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');

      const html = await response.text();
      expect(html).toContain('Metrics Server');
      expect(html).toContain('/metrics');
      expect(html).toContain('/health');
    });

    test('should return 404 for unknown endpoints', async () => {
      const address = server.getAddress()!;
      const url = `http://localhost:${address.port}/unknown`;

      const response = await fetch(url);
      expect(response.status).toBe(404);
    });

    test('should return 405 for non-GET requests', async () => {
      const address = server.getAddress()!;
      const url = `http://localhost:${address.port}/metrics`;

      const response = await fetch(url, { method: 'POST' });
      expect(response.status).toBe(405);
    });
  });

  describe('Authentication', () => {
    test('should require authentication when enabled', async () => {
      server = new MetricsServer({
        metrics,
        port: 0,
        enableAuth: true,
        authToken: 'secret-token',
      });
      await server.start();

      const address = server.getAddress()!;
      const url = `http://localhost:${address.port}/metrics`;

      // Request without auth
      const response1 = await fetch(url);
      expect(response1.status).toBe(401);

      // Request with wrong auth
      const response2 = await fetch(url, {
        headers: { Authorization: 'Bearer wrong-token' },
      });
      expect(response2.status).toBe(401);

      // Request with correct auth
      const response3 = await fetch(url, {
        headers: { Authorization: 'Bearer secret-token' },
      });
      expect(response3.status).toBe(200);
    });

    test('should not require authentication when disabled', async () => {
      server = new MetricsServer({
        metrics,
        port: 0,
        enableAuth: false,
      });
      await server.start();

      const address = server.getAddress()!;
      const url = `http://localhost:${address.port}/metrics`;

      const response = await fetch(url);
      expect(response.status).toBe(200);
    });
  });

  describe('CORS', () => {
    test('should add CORS headers when enabled', async () => {
      server = new MetricsServer({
        metrics,
        port: 0,
        enableCors: true,
        corsOrigin: 'https://example.com',
      });
      await server.start();

      const address = server.getAddress()!;
      const url = `http://localhost:${address.port}/metrics`;

      const response = await fetch(url);
      expect(response.headers.get('access-control-allow-origin')).toBe('https://example.com');
      expect(response.headers.get('access-control-allow-methods')).toContain('GET');
    });

    test('should handle OPTIONS preflight requests', async () => {
      server = new MetricsServer({
        metrics,
        port: 0,
        enableCors: true,
      });
      await server.start();

      const address = server.getAddress()!;
      const url = `http://localhost:${address.port}/metrics`;

      const response = await fetch(url, { method: 'OPTIONS' });
      expect(response.status).toBe(204);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    test('should not add CORS headers when disabled', async () => {
      server = new MetricsServer({
        metrics,
        port: 0,
        enableCors: false,
      });
      await server.start();

      const address = server.getAddress()!;
      const url = `http://localhost:${address.port}/metrics`;

      const response = await fetch(url);
      expect(response.headers.get('access-control-allow-origin')).toBeNull();
    });
  });

  describe('Custom Health Check', () => {
    test('should use custom health check function', async () => {
      const customHealthCheck = jest.fn().mockResolvedValue({
        status: 'healthy',
        details: { custom: 'data' },
      } as HealthCheckResponse);

      server = new MetricsServer({
        metrics,
        port: 0,
        healthCheck: customHealthCheck,
      });
      await server.start();

      const address = server.getAddress()!;
      const url = `http://localhost:${address.port}/health`;

      const response = await fetch(url);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.details).toHaveProperty('custom', 'data');
      expect(customHealthCheck).toHaveBeenCalled();
    });

    test('should return 503 for unhealthy status', async () => {
      server = new MetricsServer({
        metrics,
        port: 0,
        healthCheck: async () => ({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime: 0,
        }),
      });
      await server.start();

      const address = server.getAddress()!;
      const url = `http://localhost:${address.port}/health`;

      const response = await fetch(url);
      expect(response.status).toBe(503);

      const json = await response.json();
      expect(json.status).toBe('unhealthy');
    });

    test('should handle health check errors gracefully', async () => {
      server = new MetricsServer({
        metrics,
        port: 0,
        healthCheck: async () => {
          throw new Error('Health check failed');
        },
      });
      await server.start();

      const address = server.getAddress()!;
      const url = `http://localhost:${address.port}/health`;

      const response = await fetch(url);
      expect(response.status).toBe(503);

      const json = await response.json();
      expect(json.status).toBe('unhealthy');
      expect(json.details).toHaveProperty('error');
    });
  });

  describe('Metrics Content', () => {
    test('should serve actual metrics data', async () => {
      // Record some metrics
      metrics.recordRequest('exchange1', 'fetchMarkets', 'success', 100);
      metrics.recordCircuitBreakerSuccess('exchange1');

      server = new MetricsServer({ metrics, port: 0 });
      await server.start();

      const address = server.getAddress()!;
      const url = `http://localhost:${address.port}/metrics`;

      const response = await fetch(url);
      const text = await response.text();

      expect(text).toContain('test_requests_total');
      expect(text).toContain('exchange="exchange1"');
      expect(text).toContain('test_circuit_breaker_successes_total');
    });
  });

  describe('Helper Functions', () => {
    test('startMetricsServer should create and start server', async () => {
      const runningServer = await startMetricsServer({ metrics, port: 0 });

      expect(runningServer.getIsRunning()).toBe(true);
      expect(runningServer.getAddress()).not.toBeNull();

      await runningServer.stop();
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid start/stop cycles', async () => {
      server = new MetricsServer({ metrics, port: 0 });

      await server.start();
      await server.stop();
      await server.start();
      await server.stop();

      expect(server.getIsRunning()).toBe(false);
    });

    test('should return null address when not running', () => {
      server = new MetricsServer({ metrics });
      expect(server.getAddress()).toBeNull();
    });
  });

  describe('Error Handling', () => {

    test('should reject when server emits error during startup (line 139)', async () => {
      // Use a port that requires elevated privileges to trigger EACCES error
      server = new MetricsServer({ metrics, port: 80, host: '127.0.0.1' });

      // On most systems, binding to port 80 without root privileges will fail
      // This should trigger the server 'error' event handler
      await expect(server.start()).rejects.toThrow();
    });

    test('should reject when address already in use (line 139)', async () => {
      // Start first server
      const server1 = new MetricsServer({ metrics, port: 9191, host: '127.0.0.1' });
      await server1.start();

      // Try to start second server on same port
      server = new MetricsServer({ metrics, port: 9191, host: '127.0.0.1' });

      try {
        await expect(server.start()).rejects.toThrow('EADDRINUSE');
      } finally {
        await server1.stop();
      }
    });

    test('should handle getMetrics error (lines 259-260)', async () => {
      // Create a metrics instance that throws on getMetrics
      const brokenMetrics = {
        getMetrics: jest.fn().mockRejectedValue(new Error('Metrics generation failed')),
        getContentType: jest.fn().mockReturnValue('text/plain'),
        recordRequest: jest.fn(),
        recordCircuitBreakerSuccess: jest.fn(),
      } as unknown as PrometheusMetrics;

      server = new MetricsServer({ metrics: brokenMetrics, port: 0 });
      await server.start();

      const address = server.getAddress()!;
      const url = `http://localhost:${address.port}/metrics`;

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const response = await fetch(url);
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe('Error generating metrics');

      consoleSpy.mockRestore();
    });

    test('should handle request handler throwing error (lines 133-134)', async () => {
      // Create a metrics instance that throws synchronously
      const throwingMetrics = {
        getMetrics: jest.fn().mockImplementation(() => {
          throw new Error('Sync error in handler');
        }),
        getContentType: jest.fn().mockReturnValue('text/plain'),
        recordRequest: jest.fn(),
        recordCircuitBreakerSuccess: jest.fn(),
      } as unknown as PrometheusMetrics;

      server = new MetricsServer({ metrics: throwingMetrics, port: 0 });
      await server.start();

      const address = server.getAddress()!;
      const url = `http://localhost:${address.port}/metrics`;

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const response = await fetch(url);
      expect(response.status).toBe(500);

      consoleSpy.mockRestore();
    });
  });
});

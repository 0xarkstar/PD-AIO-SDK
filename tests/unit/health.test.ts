/**
 * Health Check System Unit Tests
 */

import {
  determineHealthStatus,
  isHealthy,
  isCriticallyUnhealthy,
  type HealthCheckResult,
  type HealthStatus,
} from '../../src/types/health.js';

describe('Health Check Utilities', () => {
  describe('determineHealthStatus', () => {
    test('returns healthy when all components are good', () => {
      const status = determineHealthStatus(true, true, true);
      expect(status).toBe('healthy');
    });

    test('returns unhealthy when API is not reachable', () => {
      const status = determineHealthStatus(false, true, true);
      expect(status).toBe('unhealthy');
    });

    test('returns degraded when WebSocket is disconnected', () => {
      const status = determineHealthStatus(true, false, true);
      expect(status).toBe('degraded');
    });

    test('returns degraded when auth is invalid', () => {
      const status = determineHealthStatus(true, true, false);
      expect(status).toBe('degraded');
    });

    test('returns healthy when optional checks are undefined', () => {
      const status = determineHealthStatus(true, undefined, undefined);
      expect(status).toBe('healthy');
    });

    test('prioritizes API reachability over other checks', () => {
      const status = determineHealthStatus(false, true, false);
      expect(status).toBe('unhealthy');
    });
  });

  describe('isHealthy', () => {
    test('returns true for healthy status', () => {
      expect(isHealthy('healthy')).toBe(true);
    });

    test('returns true for degraded status', () => {
      expect(isHealthy('degraded')).toBe(true);
    });

    test('returns false for unhealthy status', () => {
      expect(isHealthy('unhealthy')).toBe(false);
    });
  });

  describe('isCriticallyUnhealthy', () => {
    test('returns true when status is unhealthy', () => {
      const result: HealthCheckResult = {
        status: 'unhealthy',
        latency: 100,
        exchange: 'test',
        api: { reachable: false, latency: 100 },
        timestamp: Date.now(),
      };

      expect(isCriticallyUnhealthy(result)).toBe(true);
    });

    test('returns true when API is not reachable', () => {
      const result: HealthCheckResult = {
        status: 'degraded',
        latency: 100,
        exchange: 'test',
        api: { reachable: false, latency: 100 },
        timestamp: Date.now(),
      };

      expect(isCriticallyUnhealthy(result)).toBe(true);
    });

    test('returns false when status is healthy', () => {
      const result: HealthCheckResult = {
        status: 'healthy',
        latency: 50,
        exchange: 'test',
        api: { reachable: true, latency: 50 },
        timestamp: Date.now(),
      };

      expect(isCriticallyUnhealthy(result)).toBe(false);
    });

    test('returns false when status is degraded but API is reachable', () => {
      const result: HealthCheckResult = {
        status: 'degraded',
        latency: 100,
        exchange: 'test',
        api: { reachable: true, latency: 100 },
        websocket: { connected: false, reconnecting: true },
        timestamp: Date.now(),
      };

      expect(isCriticallyUnhealthy(result)).toBe(false);
    });
  });
});

describe('HealthCheckResult structure', () => {
  test('contains required fields', () => {
    const result: HealthCheckResult = {
      status: 'healthy',
      latency: 75,
      exchange: 'hyperliquid',
      api: {
        reachable: true,
        latency: 50,
      },
      timestamp: Date.now(),
    };

    expect(result).toMatchObject({
      status: expect.any(String),
      latency: expect.any(Number),
      exchange: expect.any(String),
      api: expect.objectContaining({
        reachable: expect.any(Boolean),
        latency: expect.any(Number),
      }),
      timestamp: expect.any(Number),
    });
  });

  test('includes optional WebSocket health', () => {
    const result: HealthCheckResult = {
      status: 'healthy',
      latency: 75,
      exchange: 'hyperliquid',
      api: { reachable: true, latency: 50 },
      websocket: {
        connected: true,
        reconnecting: false,
        uptime: 60000,
      },
      timestamp: Date.now(),
    };

    expect(result.websocket).toBeDefined();
    expect(result.websocket?.connected).toBe(true);
    expect(result.websocket?.uptime).toBe(60000);
  });

  test('includes optional auth health', () => {
    const now = Date.now();
    const expiresAt = now + 300000; // 5 minutes

    const result: HealthCheckResult = {
      status: 'healthy',
      latency: 75,
      exchange: 'hyperliquid',
      api: { reachable: true, latency: 50 },
      auth: {
        valid: true,
        expiresAt,
        expiresIn: 300000,
        needsRefresh: false,
      },
      timestamp: now,
    };

    expect(result.auth).toBeDefined();
    expect(result.auth?.valid).toBe(true);
    expect(result.auth?.expiresAt).toBe(expiresAt);
  });

  test('includes optional rate limit status', () => {
    const result: HealthCheckResult = {
      status: 'healthy',
      latency: 75,
      exchange: 'hyperliquid',
      api: { reachable: true, latency: 50 },
      rateLimit: {
        remaining: 900,
        limit: 1200,
        resetAt: Date.now() + 60000,
        percentUsed: 25,
      },
      timestamp: Date.now(),
    };

    expect(result.rateLimit).toBeDefined();
    expect(result.rateLimit?.remaining).toBe(900);
    expect(result.rateLimit?.percentUsed).toBe(25);
  });

  test('includes error message when API check fails', () => {
    const result: HealthCheckResult = {
      status: 'unhealthy',
      latency: 5000,
      exchange: 'test',
      api: {
        reachable: false,
        latency: 5000,
        error: 'Connection timeout',
      },
      timestamp: Date.now(),
    };

    expect(result.api.error).toBe('Connection timeout');
  });
});

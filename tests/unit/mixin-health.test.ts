/**
 * HealthCheckMixin Unit Tests
 *
 * Tests the HealthCheckMixin factory function that adds health check
 * capabilities to adapter classes.
 */

import {
  HealthCheckMixin,
  type IHealthCheckMixinBase,
} from '../../src/adapters/base/mixins/HealthCheckMixin.js';
import type { FeatureMap, IAuthStrategy, Market, MarketParams } from '../../src/types/index.js';
import type { RateLimiter } from '../../src/core/RateLimiter.js';
import type { Constructor } from '../../src/adapters/base/mixins/LoggerMixin.js';

// Minimal base class implementing IHealthCheckMixinBase
class TestBase implements IHealthCheckMixinBase {
  readonly id: string;
  readonly has: Partial<FeatureMap>;
  authStrategy?: IAuthStrategy;
  rateLimiter?: RateLimiter;
  fetchMarketsShouldFail = false;

  constructor(
    id = 'test-exchange',
    has: Partial<FeatureMap> = {},
    authStrategy?: IAuthStrategy,
    rateLimiter?: RateLimiter
  ) {
    this.id = id;
    this.has = has;
    this.authStrategy = authStrategy;
    this.rateLimiter = rateLimiter;
  }

  async fetchMarkets(_params?: MarketParams): Promise<Market[]> {
    if (this.fetchMarketsShouldFail) {
      throw new Error('API unreachable');
    }
    return [];
  }
}

// Apply mixin
const TestWithHealth = HealthCheckMixin(TestBase as Constructor<TestBase>);

describe('HealthCheckMixin', () => {
  describe('healthCheck() - basic', () => {
    test('returns healthy when API is reachable', async () => {
      const instance = new TestWithHealth();
      const result = await instance.healthCheck();

      expect(result.status).toBe('healthy');
      expect(result.exchange).toBe('test-exchange');
      expect(result.api.reachable).toBe(true);
      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    test('returns unhealthy when API check fails', async () => {
      const instance = new TestWithHealth();
      instance.fetchMarketsShouldFail = true;

      const result = await instance.healthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.api.reachable).toBe(false);
      expect(result.api.error).toBeDefined();
    });

    test('includes latency measurement', async () => {
      const instance = new TestWithHealth();
      const result = await instance.healthCheck();

      expect(typeof result.latency).toBe('number');
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    test('includes timestamp', async () => {
      const before = Date.now();
      const instance = new TestWithHealth();
      const result = await instance.healthCheck();
      const after = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('healthCheck() - WebSocket check', () => {
    test('checks WebSocket when feature is supported and enabled', async () => {
      const instance = new TestWithHealth('test', { watchOrderBook: true });
      const result = await instance.healthCheck({ checkWebSocket: true });

      expect(result.websocket).toBeDefined();
      expect(result.websocket?.connected).toBe(false);
      expect(result.websocket?.reconnecting).toBe(false);
    });

    test('skips WebSocket check when disabled', async () => {
      const instance = new TestWithHealth('test', { watchOrderBook: true });
      const result = await instance.healthCheck({ checkWebSocket: false });

      expect(result.websocket).toBeUndefined();
    });

    test('skips WebSocket check when feature not supported', async () => {
      const instance = new TestWithHealth('test', {});
      const result = await instance.healthCheck({ checkWebSocket: true });

      expect(result.websocket).toBeUndefined();
    });

    test('returns degraded when WebSocket is disconnected', async () => {
      const instance = new TestWithHealth('test', { watchOrderBook: true });
      const result = await instance.healthCheck();

      // Default checkWebSocketHealth returns connected: false
      expect(result.status).toBe('degraded');
    });
  });

  describe('healthCheck() - auth check', () => {
    test('checks auth when authStrategy exists and enabled', async () => {
      const mockAuth: IAuthStrategy = {
        sign: jest.fn(),
        getHeaders: jest.fn(),
      } as unknown as IAuthStrategy;

      const instance = new TestWithHealth('test', {}, mockAuth);
      const result = await instance.healthCheck({ checkAuth: true });

      expect(result.auth).toBeDefined();
      expect(result.auth?.valid).toBe(true);
    });

    test('skips auth check when disabled', async () => {
      const mockAuth: IAuthStrategy = {
        sign: jest.fn(),
      } as unknown as IAuthStrategy;

      const instance = new TestWithHealth('test', {}, mockAuth);
      const result = await instance.healthCheck({ checkAuth: false });

      expect(result.auth).toBeUndefined();
    });

    test('skips auth check when no authStrategy', async () => {
      const instance = new TestWithHealth('test', {});
      const result = await instance.healthCheck({ checkAuth: true });

      expect(result.auth).toBeUndefined();
    });
  });

  describe('healthCheck() - rate limit', () => {
    test('includes rate limit when rateLimiter exists and enabled', async () => {
      const mockRateLimiter = {} as RateLimiter;
      const instance = new TestWithHealth('test', {}, undefined, mockRateLimiter);

      // Default getRateLimitStatus returns undefined, so rateLimit won't be set
      const result = await instance.healthCheck({ includeRateLimit: true });
      expect(result.rateLimit).toBeUndefined();
    });

    test('skips rate limit when disabled', async () => {
      const mockRateLimiter = {} as RateLimiter;
      const instance = new TestWithHealth('test', {}, undefined, mockRateLimiter);
      const result = await instance.healthCheck({ includeRateLimit: false });

      expect(result.rateLimit).toBeUndefined();
    });

    test('skips rate limit when no rateLimiter', async () => {
      const instance = new TestWithHealth('test', {});
      const result = await instance.healthCheck({ includeRateLimit: true });

      expect(result.rateLimit).toBeUndefined();
    });
  });

  describe('healthCheck() - default config', () => {
    test('uses default config values', async () => {
      const instance = new TestWithHealth();
      // Should not throw with empty config
      const result = await instance.healthCheck();
      expect(result).toBeDefined();
      expect(result.exchange).toBe('test-exchange');
    });

    test('uses default timeout of 5000ms', async () => {
      const instance = new TestWithHealth();
      const apiSpy = jest.spyOn(instance, 'checkApiHealth');
      await instance.healthCheck();
      expect(apiSpy).toHaveBeenCalledWith(5000);
    });
  });

  describe('checkApiHealth()', () => {
    test('returns reachable when API responds', async () => {
      const instance = new TestWithHealth();
      const result = await instance.checkApiHealth(5000);

      expect(result.reachable).toBe(true);
      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    test('returns unreachable when API fails', async () => {
      const instance = new TestWithHealth();
      instance.fetchMarketsShouldFail = true;

      const result = await instance.checkApiHealth(5000);

      expect(result.reachable).toBe(false);
      expect(result.error).toBe('API unreachable');
    });

    test('handles timeout', async () => {
      const instance = new TestWithHealth();
      // Override performApiHealthCheck to simulate slow response
      jest.spyOn(instance, 'performApiHealthCheck').mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const result = await instance.checkApiHealth(1); // 1ms timeout

      expect(result.reachable).toBe(false);
      expect(result.error).toBe('Health check timeout');
    });
  });

  describe('performApiHealthCheck()', () => {
    test('delegates to fetchMarkets with active filter', async () => {
      const instance = new TestWithHealth();
      const fetchSpy = jest.spyOn(instance, 'fetchMarkets');

      await instance.performApiHealthCheck();

      expect(fetchSpy).toHaveBeenCalledWith({ active: true });
    });
  });

  describe('checkWebSocketHealth()', () => {
    test('returns default disconnected state', async () => {
      const instance = new TestWithHealth();
      const result = await instance.checkWebSocketHealth();

      expect(result.connected).toBe(false);
      expect(result.reconnecting).toBe(false);
    });
  });

  describe('checkAuthHealth()', () => {
    test('returns valid when authStrategy exists', async () => {
      const mockAuth = {} as IAuthStrategy;
      const instance = new TestWithHealth('test', {}, mockAuth);

      const result = await instance.checkAuthHealth();
      expect(result.valid).toBe(true);
    });

    test('returns invalid when no authStrategy', async () => {
      const instance = new TestWithHealth();
      const result = await instance.checkAuthHealth();
      expect(result.valid).toBe(false);
    });
  });

  describe('getRateLimitStatus()', () => {
    test('returns undefined by default', () => {
      const instance = new TestWithHealth();
      expect(instance.getRateLimitStatus()).toBeUndefined();
    });
  });

  describe('error handling', () => {
    test('catches and records error on healthCheck failure', async () => {
      const instance = new TestWithHealth();
      // Make checkApiHealth throw
      jest.spyOn(instance, 'checkApiHealth').mockRejectedValue(new Error('unexpected'));

      const result = await instance.healthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.api.reachable).toBe(false);
      expect(result.api.error).toBe('unexpected');
    });

    test('handles non-Error exceptions', async () => {
      const instance = new TestWithHealth();
      jest.spyOn(instance, 'checkApiHealth').mockRejectedValue('string error');

      const result = await instance.healthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.api.error).toBe('Unknown error');
    });
  });
});

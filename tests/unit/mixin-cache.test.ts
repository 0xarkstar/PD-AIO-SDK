/**
 * CacheManagerMixin Unit Tests
 *
 * Tests the CacheManagerMixin factory function that adds market cache
 * management capabilities.
 */

import {
  CacheManagerMixin,
  type ICacheMixinBase,
} from '../../src/adapters/base/mixins/CacheManagerMixin.js';
import type { Market, MarketParams } from '../../src/types/index.js';
import type { Constructor } from '../../src/adapters/base/mixins/LoggerMixin.js';

// Mock market data
const mockMarkets: Market[] = [
  {
    id: 'BTC-USDT',
    symbol: 'BTC/USDT:USDT',
    base: 'BTC',
    quote: 'USDT',
    settle: 'USDT',
    type: 'swap',
    active: true,
    linear: true,
    inverse: false,
    contractSize: 1,
    precision: { amount: 3, price: 1, base: 8, quote: 2 },
    limits: {
      amount: { min: 0.001, max: 1000 },
      price: { min: 0.1, max: 1000000 },
      cost: { min: 1, max: 10000000 },
    },
  },
  {
    id: 'ETH-USDT',
    symbol: 'ETH/USDT:USDT',
    base: 'ETH',
    quote: 'USDT',
    settle: 'USDT',
    type: 'swap',
    active: true,
    linear: true,
    inverse: false,
    contractSize: 1,
    precision: { amount: 2, price: 2, base: 8, quote: 2 },
    limits: {
      amount: { min: 0.01, max: 10000 },
      price: { min: 0.01, max: 100000 },
      cost: { min: 1, max: 10000000 },
    },
  },
] as Market[];

// Minimal base class implementing ICacheMixinBase
class TestBase implements ICacheMixinBase {
  fetchMarketsCallCount = 0;

  async fetchMarkets(_params?: MarketParams): Promise<Market[]> {
    this.fetchMarketsCallCount++;
    return [...mockMarkets];
  }

  debug(_message: string, _meta?: Record<string, unknown>): void {
    // noop for tests
  }
}

// Apply mixin
const TestWithCache = CacheManagerMixin(TestBase as Constructor<TestBase>);

describe('CacheManagerMixin', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    test('starts with null cache', () => {
      const instance = new TestWithCache();
      expect(instance.marketCache).toBeNull();
      expect(instance.marketCacheExpiry).toBe(0);
    });

    test('has default TTL of 5 minutes', () => {
      const instance = new TestWithCache();
      expect(instance.marketCacheTTL).toBe(5 * 60 * 1000);
    });
  });

  describe('preloadMarkets()', () => {
    test('fetches and caches market data', async () => {
      const instance = new TestWithCache();

      await instance.preloadMarkets();

      expect(instance.marketCache).toHaveLength(2);
      expect(instance.marketCache![0].symbol).toBe('BTC/USDT:USDT');
      expect(instance.fetchMarketsCallCount).toBe(1);
    });

    test('sets cache expiry based on default TTL', async () => {
      const instance = new TestWithCache();
      const now = Date.now();

      await instance.preloadMarkets();

      expect(instance.marketCacheExpiry).toBeGreaterThanOrEqual(now + 5 * 60 * 1000);
    });

    test('accepts custom TTL', async () => {
      const instance = new TestWithCache();
      const now = Date.now();
      const customTTL = 10 * 60 * 1000; // 10 minutes

      await instance.preloadMarkets({ ttl: customTTL });

      expect(instance.marketCacheTTL).toBe(customTTL);
      expect(instance.marketCacheExpiry).toBeGreaterThanOrEqual(now + customTTL);
    });

    test('passes params to fetchMarketsFromAPI', async () => {
      const instance = new TestWithCache();
      const fetchSpy = jest.spyOn(instance, 'fetchMarketsFromAPI');

      const params: MarketParams = { active: true };
      await instance.preloadMarkets({ params });

      expect(fetchSpy).toHaveBeenCalledWith(params);
    });

    test('logs preload activity', async () => {
      const instance = new TestWithCache();
      const debugSpy = jest.spyOn(instance, 'debug');

      await instance.preloadMarkets();

      expect(debugSpy).toHaveBeenCalledWith('Preloading markets...');
      expect(debugSpy).toHaveBeenCalledWith('Preloaded markets', {
        count: 2,
        ttl: 5 * 60 * 1000,
      });
    });
  });

  describe('getPreloadedMarkets()', () => {
    test('returns null when cache is empty', () => {
      const instance = new TestWithCache();
      expect(instance.getPreloadedMarkets()).toBeNull();
    });

    test('returns cached markets when cache is valid', async () => {
      const instance = new TestWithCache();
      await instance.preloadMarkets();

      const markets = instance.getPreloadedMarkets();
      expect(markets).toHaveLength(2);
      expect(markets![0].symbol).toBe('BTC/USDT:USDT');
    });

    test('returns null when cache has expired', async () => {
      const instance = new TestWithCache();
      await instance.preloadMarkets({ ttl: 1000 }); // 1 second TTL

      // Advance time past TTL
      jest.advanceTimersByTime(1001);

      const markets = instance.getPreloadedMarkets();
      expect(markets).toBeNull();
    });

    test('clears cache when expired', async () => {
      const instance = new TestWithCache();
      await instance.preloadMarkets({ ttl: 1000 });

      jest.advanceTimersByTime(1001);
      instance.getPreloadedMarkets();

      expect(instance.marketCache).toBeNull();
      expect(instance.marketCacheExpiry).toBe(0);
    });

    test('logs when cache expires', async () => {
      const instance = new TestWithCache();
      await instance.preloadMarkets({ ttl: 1000 });

      const debugSpy = jest.spyOn(instance, 'debug');
      jest.advanceTimersByTime(1001);
      instance.getPreloadedMarkets();

      expect(debugSpy).toHaveBeenCalledWith('Market cache expired');
    });
  });

  describe('clearCache()', () => {
    test('resets cache to null', async () => {
      const instance = new TestWithCache();
      await instance.preloadMarkets();

      expect(instance.marketCache).not.toBeNull();

      instance.clearCache();

      expect(instance.marketCache).toBeNull();
      expect(instance.marketCacheExpiry).toBe(0);
    });

    test('clears cache even if already empty', () => {
      const instance = new TestWithCache();
      instance.clearCache();

      expect(instance.marketCache).toBeNull();
      expect(instance.marketCacheExpiry).toBe(0);
    });
  });

  describe('fetchMarketsFromAPI()', () => {
    test('delegates to fetchMarkets by default', async () => {
      const instance = new TestWithCache();
      const fetchSpy = jest.spyOn(instance, 'fetchMarkets');

      const result = await instance.fetchMarketsFromAPI();

      expect(fetchSpy).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    test('passes params to fetchMarkets', async () => {
      const instance = new TestWithCache();
      const fetchSpy = jest.spyOn(instance, 'fetchMarkets');

      const params: MarketParams = { active: true };
      await instance.fetchMarketsFromAPI(params);

      expect(fetchSpy).toHaveBeenCalledWith(params);
    });
  });

  describe('mixin composition', () => {
    test('preserves base class methods', () => {
      const instance = new TestWithCache();
      expect(typeof instance.fetchMarkets).toBe('function');
      expect(typeof instance.debug).toBe('function');
    });

    test('adds cache methods to class', () => {
      const instance = new TestWithCache();
      expect(typeof instance.clearCache).toBe('function');
      expect(typeof instance.preloadMarkets).toBe('function');
      expect(typeof instance.getPreloadedMarkets).toBe('function');
      expect(typeof instance.fetchMarketsFromAPI).toBe('function');
    });
  });
});

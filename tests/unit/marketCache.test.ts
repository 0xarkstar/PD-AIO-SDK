/**
 * Market Data Preloading Unit Tests
 */

import { BaseAdapter } from '../../src/adapters/base/BaseAdapter.js';
import type { Market, MarketParams } from '../../src/types/common.js';

// Mock adapter for testing
class MockAdapter extends BaseAdapter {
  readonly id = 'mock';
  readonly name = 'Mock Exchange';
  readonly has = {
    fetchMarkets: true,
  };

  private fetchCount = 0;
  private mockMarkets: Market[] = [
    {
      id: 'BTC-USDT',
      symbol: 'BTC/USDT:USDT',
      base: 'BTC',
      quote: 'USDT',
      settle: 'USDT',
      type: 'swap',
      spot: false,
      margin: false,
      swap: true,
      future: false,
      option: false,
      active: true,
      contract: true,
      linear: true,
      inverse: false,
      contractSize: 1,
      precision: {
        amount: 0.001,
        price: 0.1,
      },
      limits: {
        amount: { min: 0.001, max: 1000 },
        price: { min: 0.1, max: 1000000 },
        cost: { min: 5, max: undefined },
      },
    },
    {
      id: 'ETH-USDT',
      symbol: 'ETH/USDT:USDT',
      base: 'ETH',
      quote: 'USDT',
      settle: 'USDT',
      type: 'swap',
      spot: false,
      margin: false,
      swap: true,
      future: false,
      option: false,
      active: true,
      contract: true,
      linear: true,
      inverse: false,
      contractSize: 1,
      precision: {
        amount: 0.01,
        price: 0.01,
      },
      limits: {
        amount: { min: 0.01, max: 5000 },
        price: { min: 0.01, max: 100000 },
        cost: { min: 5, max: undefined },
      },
    },
  ];

  async initialize(): Promise<void> {
    this._isReady = true;
  }

  async disconnect(): Promise<void> {
    await super.disconnect();
  }

  async fetchMarkets(params?: MarketParams): Promise<Market[]> {
    this.fetchCount++;
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 10));
    return this.mockMarkets;
  }

  getFetchCount(): number {
    return this.fetchCount;
  }

  resetFetchCount(): void {
    this.fetchCount = 0;
  }

  // Required abstract methods (minimal implementation)
  async fetchTicker() {
    throw new Error('Not implemented');
  }
  async fetchOrderBook() {
    throw new Error('Not implemented');
  }
  async fetchTrades() {
    return [];
  }
  async fetchFundingRate() {
    throw new Error('Not implemented');
  }
  async fetchFundingRateHistory() {
    return [];
  }
  async createOrder() {
    throw new Error('Not implemented');
  }
  async cancelOrder() {
    throw new Error('Not implemented');
  }
  async cancelAllOrders() {
    return [];
  }
  async fetchPositions() {
    return [];
  }
  async fetchBalance() {
    return [];
  }
  async setLeverage() {}
  protected symbolToExchange(symbol: string) {
    return symbol;
  }
  protected symbolFromExchange(symbol: string) {
    return symbol;
  }
}

describe('Market Data Preloading', () => {
  let adapter: MockAdapter;

  beforeEach(async () => {
    adapter = new MockAdapter();
    await adapter.initialize();
  });

  afterEach(async () => {
    await adapter.disconnect();
  });

  describe('preloadMarkets', () => {
    test('loads and caches market data', async () => {
      await adapter.preloadMarkets();

      const cached = adapter.getPreloadedMarkets();
      expect(cached).not.toBeNull();
      expect(cached).toHaveLength(2);
      expect(cached![0].symbol).toBe('BTC/USDT:USDT');
      expect(cached![1].symbol).toBe('ETH/USDT:USDT');
    });

    test('uses default TTL if not specified', async () => {
      await adapter.preloadMarkets();

      const cached = adapter.getPreloadedMarkets();
      expect(cached).not.toBeNull();

      // Cache should still be valid after 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const stillCached = adapter.getPreloadedMarkets();
      expect(stillCached).not.toBeNull();
    });

    test('respects custom TTL', async () => {
      const shortTTL = 100; // 100ms
      await adapter.preloadMarkets({ ttl: shortTTL });

      const cached = adapter.getPreloadedMarkets();
      expect(cached).not.toBeNull();

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      const expired = adapter.getPreloadedMarkets();
      expect(expired).toBeNull();
    });

    test('overwrites previous cache', async () => {
      await adapter.preloadMarkets({ ttl: 1000 });
      const firstCacheTime = Date.now();

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Preload again with different TTL
      await adapter.preloadMarkets({ ttl: 5000 });
      const secondCache = adapter.getPreloadedMarkets();

      // Cache should be updated and valid
      expect(secondCache).not.toBeNull();
      expect(secondCache).toHaveLength(2);

      // New TTL should be respected - cache should still be valid after original TTL
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const stillValid = adapter.getPreloadedMarkets();
      expect(stillValid).not.toBeNull();
    });

    test('calls fetchMarkets to populate cache', async () => {
      adapter.resetFetchCount();

      await adapter.preloadMarkets();

      expect(adapter.getFetchCount()).toBe(1);
    });
  });

  describe('getPreloadedMarkets', () => {
    test('returns null when no cache exists', () => {
      const cached = adapter.getPreloadedMarkets();
      expect(cached).toBeNull();
    });

    test('returns cached data when valid', async () => {
      await adapter.preloadMarkets();

      const cached = adapter.getPreloadedMarkets();
      expect(cached).not.toBeNull();
      expect(cached).toHaveLength(2);
    });

    test('returns null when cache has expired', async () => {
      await adapter.preloadMarkets({ ttl: 50 });

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 100));

      const expired = adapter.getPreloadedMarkets();
      expect(expired).toBeNull();
    });

    test('clears cache on expiration', async () => {
      await adapter.preloadMarkets({ ttl: 50 });

      // First call after expiration should clear
      await new Promise((resolve) => setTimeout(resolve, 100));
      adapter.getPreloadedMarkets();

      // Second call should still return null
      const stillNull = adapter.getPreloadedMarkets();
      expect(stillNull).toBeNull();
    });

    test('does not mutate cached data', async () => {
      await adapter.preloadMarkets();

      const cached1 = adapter.getPreloadedMarkets();
      const cached2 = adapter.getPreloadedMarkets();

      expect(cached1).toBe(cached2); // Same reference
    });
  });

  describe('clearCache', () => {
    test('clears preloaded markets', async () => {
      await adapter.preloadMarkets();

      expect(adapter.getPreloadedMarkets()).not.toBeNull();

      adapter.clearCache();

      expect(adapter.getPreloadedMarkets()).toBeNull();
    });

    test('works when cache is already empty', () => {
      expect(() => adapter.clearCache()).not.toThrow();
      expect(adapter.getPreloadedMarkets()).toBeNull();
    });
  });

  describe('Cache lifecycle', () => {
    test('cache survives multiple reads', async () => {
      await adapter.preloadMarkets();

      const read1 = adapter.getPreloadedMarkets();
      const read2 = adapter.getPreloadedMarkets();
      const read3 = adapter.getPreloadedMarkets();

      expect(read1).not.toBeNull();
      expect(read2).not.toBeNull();
      expect(read3).not.toBeNull();
    });

    test('cache is cleared on disconnect', async () => {
      await adapter.preloadMarkets();

      expect(adapter.getPreloadedMarkets()).not.toBeNull();

      await adapter.disconnect();

      expect(adapter.getPreloadedMarkets()).toBeNull();
    });

    test('multiple preloads reset TTL', async () => {
      await adapter.preloadMarkets({ ttl: 200 });

      // Wait 100ms
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Preload again - should reset TTL
      await adapter.preloadMarkets({ ttl: 200 });

      // Wait another 100ms (total 200ms from first preload)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Cache should still be valid (only 100ms since second preload)
      const cached = adapter.getPreloadedMarkets();
      expect(cached).not.toBeNull();
    });
  });

  describe('TTL behavior', () => {
    test('cache expires after TTL', async () => {
      const ttl = 150;
      await adapter.preloadMarkets({ ttl });

      // Well before expiration - cache should be valid
      await new Promise((resolve) => setTimeout(resolve, ttl / 2));
      expect(adapter.getPreloadedMarkets()).not.toBeNull();

      // Well after expiration - cache should be expired
      await new Promise((resolve) => setTimeout(resolve, ttl));
      expect(adapter.getPreloadedMarkets()).toBeNull();
    });

    test('zero TTL expires immediately', async () => {
      await adapter.preloadMarkets({ ttl: 0 });

      // Even without delay, cache should be expired
      const cached = adapter.getPreloadedMarkets();
      expect(cached).toBeNull();
    });

    test('very long TTL persists', async () => {
      const longTTL = 1000000; // ~16 minutes
      await adapter.preloadMarkets({ ttl: longTTL });

      // After 1 second, cache should still be valid
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const cached = adapter.getPreloadedMarkets();
      expect(cached).not.toBeNull();
    });
  });

  describe('Edge cases', () => {
    test('handles empty market list', async () => {
      // Create adapter with no markets
      class EmptyMockAdapter extends MockAdapter {
        async fetchMarkets(): Promise<Market[]> {
          return [];
        }
      }

      const emptyAdapter = new EmptyMockAdapter();
      await emptyAdapter.initialize();

      await emptyAdapter.preloadMarkets();

      const cached = emptyAdapter.getPreloadedMarkets();
      expect(cached).not.toBeNull();
      expect(cached).toHaveLength(0);

      await emptyAdapter.disconnect();
    });

    test('handles fetchMarkets errors', async () => {
      class ErrorMockAdapter extends MockAdapter {
        async fetchMarkets(): Promise<Market[]> {
          throw new Error('API Error');
        }
      }

      const errorAdapter = new ErrorMockAdapter();
      await errorAdapter.initialize();

      await expect(errorAdapter.preloadMarkets()).rejects.toThrow('API Error');

      // Cache should remain null
      expect(errorAdapter.getPreloadedMarkets()).toBeNull();

      await errorAdapter.disconnect();
    });

    test('preload can be called multiple times', async () => {
      adapter.resetFetchCount();

      await adapter.preloadMarkets();
      await adapter.preloadMarkets();
      await adapter.preloadMarkets();

      expect(adapter.getFetchCount()).toBe(3);
      expect(adapter.getPreloadedMarkets()).not.toBeNull();
    });
  });
});

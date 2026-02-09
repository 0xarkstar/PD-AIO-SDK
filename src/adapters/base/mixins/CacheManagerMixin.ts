/**
 * Cache Manager Mixin
 *
 * Provides market cache management capabilities.
 */

import type { Market, MarketParams } from '../../../types/index.js';
import type { Constructor } from './LoggerMixin.js';

/**
 * Base interface for cache mixin requirements
 */
export interface ICacheMixinBase {
  fetchMarkets(params?: MarketParams): Promise<Market[]>;
  debug(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Interface for cache capabilities
 */
export interface ICacheCapable {
  clearCache(): void;
  preloadMarkets(options?: { ttl?: number; params?: MarketParams }): Promise<void>;
  getPreloadedMarkets(): Market[] | null;
}

/**
 * Cache Manager Mixin - adds market cache management to a class
 *
 * @example
 * ```typescript
 * class MyAdapter extends CacheManagerMixin(BaseClass) {
 *   async initialize() {
 *     await this.preloadMarkets({ ttl: 600000 });
 *   }
 * }
 * ```
 */
export function CacheManagerMixin<T extends Constructor<ICacheMixinBase>>(Base: T) {
  return class CacheManagerMixinClass extends Base {
    /**
     * Cached market data
     * @internal
     */
    marketCache: Market[] | null = null;

    /**
     * Cache expiry timestamp
     * @internal
     */
    marketCacheExpiry: number = 0;

    /**
     * Cache TTL in milliseconds (default: 5 minutes)
     * @internal
     */
    marketCacheTTL: number = 5 * 60 * 1000;

    /**
     * Clear all cached data
     */
    clearCache(): void {
      this.marketCache = null;
      this.marketCacheExpiry = 0;
    }

    /**
     * Preload market data with configurable TTL
     *
     * @param options - Configuration options
     * @param options.ttl - Time-to-live for cache in milliseconds (default: 5 minutes)
     * @param options.params - Additional parameters to pass to fetchMarkets()
     *
     * @example
     * ```typescript
     * // Preload markets with 10-minute cache
     * await exchange.preloadMarkets({ ttl: 600000 });
     *
     * // Later calls to fetchMarkets() will use cached data
     * const markets = await exchange.fetchMarkets(); // Uses cache
     * ```
     */
    async preloadMarkets(options?: { ttl?: number; params?: MarketParams }): Promise<void> {
      const ttl = options?.ttl ?? this.marketCacheTTL;
      const params = options?.params;

      this.debug('Preloading markets...');
      const markets = await this.fetchMarketsFromAPI(params);

      this.marketCache = markets;
      this.marketCacheExpiry = Date.now() + ttl;
      this.marketCacheTTL = ttl;

      this.debug('Preloaded markets', { count: markets.length, ttl });
    }

    /**
     * Get preloaded markets if cache is still valid
     *
     * @returns Cached markets if available and not expired, null otherwise
     *
     * @example
     * ```typescript
     * const cached = exchange.getPreloadedMarkets();
     * if (cached) {
     *   console.log('Using cached markets:', cached.length);
     * } else {
     *   console.log('Cache expired or empty, fetching fresh data');
     * }
     * ```
     */
    getPreloadedMarkets(): Market[] | null {
      if (!this.marketCache) {
        return null;
      }

      const isExpired = Date.now() >= this.marketCacheExpiry;
      if (isExpired) {
        this.debug('Market cache expired');
        this.marketCache = null;
        this.marketCacheExpiry = 0;
        return null;
      }

      return this.marketCache;
    }

    /**
     * Fetch markets from API (bypasses cache)
     * Subclasses should override this instead of fetchMarkets()
     * @internal
     */
    async fetchMarketsFromAPI(params?: MarketParams): Promise<Market[]> {
      // Default implementation delegates to fetchMarkets
      // Subclasses override this to provide actual API implementation
      return this.fetchMarkets(params);
    }
  };
}

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
    preloadMarkets(options?: {
        ttl?: number;
        params?: MarketParams;
    }): Promise<void>;
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
export declare function CacheManagerMixin<T extends Constructor<ICacheMixinBase>>(Base: T): {
    new (...args: any[]): {
        /**
         * Cached market data
         * @internal
         */
        marketCache: Market[] | null;
        /**
         * Cache expiry timestamp
         * @internal
         */
        marketCacheExpiry: number;
        /**
         * Cache TTL in milliseconds (default: 5 minutes)
         * @internal
         */
        marketCacheTTL: number;
        /**
         * Clear all cached data
         */
        clearCache(): void;
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
        preloadMarkets(options?: {
            ttl?: number;
            params?: MarketParams;
        }): Promise<void>;
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
        getPreloadedMarkets(): Market[] | null;
        /**
         * Fetch markets from API (bypasses cache)
         * Subclasses should override this instead of fetchMarkets()
         * @internal
         */
        fetchMarketsFromAPI(params?: MarketParams): Promise<Market[]>;
        fetchMarkets(params?: MarketParams): Promise<Market[]>;
        debug(message: string, meta?: Record<string, unknown>): void;
    };
} & T;
//# sourceMappingURL=CacheManagerMixin.d.ts.map
/**
 * Lighter Market Data Helper Functions
 *
 * Extracted from LighterAdapter to reduce file size.
 * Contains market data fetching and parsing logic.
 */
import type { Market, Ticker, OrderBook, Trade, FundingRate } from '../../types/common.js';
import type { LighterNormalizer } from './LighterNormalizer.js';
/** Market metadata for caching */
export interface MarketCacheEntry {
    baseDecimals: number;
    quoteDecimals: number;
    tickSize: number;
    stepSize: number;
}
/** Dependencies injected from the adapter */
export interface MarketDataDeps {
    normalizer: LighterNormalizer;
    marketIdCache: Map<string, number>;
    marketMetadataCache: Map<string, MarketCacheEntry>;
    request: <T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: Record<string, unknown>) => Promise<T>;
}
/**
 * Fetch and parse markets, populating caches
 */
export declare function fetchMarketsData(deps: MarketDataDeps): Promise<Market[]>;
/**
 * Fetch ticker for a specific symbol
 */
export declare function fetchTickerData(deps: MarketDataDeps, symbol: string): Promise<Ticker>;
/**
 * Fetch order book for a specific symbol
 */
export declare function fetchOrderBookData(deps: MarketDataDeps, symbol: string, limit: number, fetchMarkets: () => Promise<unknown>): Promise<OrderBook>;
/**
 * Fetch trades for a specific symbol
 * Uses /api/v1/recentTrades with market_id parameter
 */
export declare function fetchTradesData(deps: MarketDataDeps, symbol: string, limit: number, fetchMarkets: () => Promise<unknown>): Promise<Trade[]>;
/**
 * Fetch funding rate for a specific symbol
 * The API returns funding rates from multiple exchanges; we use the first match.
 */
export declare function fetchFundingRateData(deps: MarketDataDeps, symbol: string, fetchMarkets: () => Promise<unknown>): Promise<FundingRate>;
//# sourceMappingURL=LighterMarketData.d.ts.map
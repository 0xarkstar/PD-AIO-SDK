/**
 * Lighter Market Data Helper Functions
 *
 * Extracted from LighterAdapter to reduce file size.
 * Contains market data fetching and parsing logic.
 */

import type { Market, Ticker, OrderBook, Trade, FundingRate } from '../../types/common.js';
import { PerpDEXError } from '../../types/errors.js';
import type { LighterNormalizer } from './LighterNormalizer.js';
import type { LighterOrderBook, LighterTrade, LighterFundingRate } from './types.js';
import { mapError } from './utils.js';

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
  request: <T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: Record<string, unknown>
  ) => Promise<T>;
}

/**
 * Fetch and parse markets, populating caches
 */
export async function fetchMarketsData(deps: MarketDataDeps): Promise<Market[]> {
  try {
    const response = await deps.request<{ code: number; order_book_details: any[] }>(
      'GET',
      '/api/v1/orderBookDetails'
    );

    if (!response.order_book_details || !Array.isArray(response.order_book_details)) {
      throw new PerpDEXError('Invalid markets response', 'INVALID_RESPONSE', 'lighter');
    }

    // Filter for perp markets only
    const perpMarkets = response.order_book_details.filter((m: any) => m.market_type === 'perp');

    // Cache market_id and metadata for each symbol
    for (const market of perpMarkets) {
      if (market.symbol && market.market_id !== undefined) {
        deps.marketIdCache.set(market.symbol, market.market_id);
        deps.marketMetadataCache.set(market.symbol, {
          baseDecimals: market.base_decimals ?? 8,
          quoteDecimals: market.quote_decimals ?? 6,
          tickSize: parseFloat(market.tick_size ?? '0.01'),
          stepSize: parseFloat(market.step_size ?? '0.001'),
        });
      }
    }

    return perpMarkets.map((market: any) => deps.normalizer.normalizeMarket(market));
  } catch (error) {
    throw mapError(error);
  }
}

/**
 * Fetch ticker for a specific symbol
 */
export async function fetchTickerData(deps: MarketDataDeps, symbol: string): Promise<Ticker> {
  try {
    const lighterSymbol = deps.normalizer.toLighterSymbol(symbol);
    const response = await deps.request<{ code: number; order_book_details: any[] }>(
      'GET',
      '/api/v1/orderBookDetails'
    );

    if (!response.order_book_details) {
      throw new PerpDEXError('Invalid ticker response', 'INVALID_RESPONSE', 'lighter');
    }

    // Find the market matching the symbol
    const market = response.order_book_details.find(
      (m: any) => m.symbol === lighterSymbol && m.market_type === 'perp'
    );

    if (!market) {
      throw new PerpDEXError(`Market not found: ${symbol}`, 'INVALID_SYMBOL', 'lighter');
    }

    return deps.normalizer.normalizeTicker(market);
  } catch (error) {
    throw mapError(error);
  }
}

/**
 * Fetch order book for a specific symbol
 */
export async function fetchOrderBookData(
  deps: MarketDataDeps,
  symbol: string,
  limit: number,
  fetchMarkets: () => Promise<unknown>
): Promise<OrderBook> {
  try {
    const lighterSymbol = deps.normalizer.toLighterSymbol(symbol);

    // Get market_id from cache, or fetch markets first if cache is empty
    let marketId = deps.marketIdCache.get(lighterSymbol);
    if (marketId === undefined) {
      await fetchMarkets();
      marketId = deps.marketIdCache.get(lighterSymbol);
      if (marketId === undefined) {
        throw new PerpDEXError(`Market not found: ${symbol}`, 'INVALID_SYMBOL', 'lighter');
      }
    }

    // Lighter API requires market_id parameter for orderBookOrders endpoint
    const response = await deps.request<{ code: number; asks: any[]; bids: any[] }>(
      'GET',
      `/api/v1/orderBookOrders?market_id=${marketId}&limit=${limit}`
    );

    // Convert to LighterOrderBook format
    const orderBook: LighterOrderBook = {
      symbol: lighterSymbol,
      bids:
        response.bids?.map((b: any) => [
          parseFloat(b.price || '0'),
          parseFloat(b.remaining_base_amount || b.size || '0'),
        ]) || [],
      asks:
        response.asks?.map((a: any) => [
          parseFloat(a.price || '0'),
          parseFloat(a.remaining_base_amount || a.size || '0'),
        ]) || [],
      timestamp: Date.now(),
    };

    return deps.normalizer.normalizeOrderBook(orderBook);
  } catch (error) {
    throw mapError(error);
  }
}

/**
 * Fetch trades for a specific symbol
 * Uses /api/v1/recentTrades with market_id parameter
 */
export async function fetchTradesData(
  deps: MarketDataDeps,
  symbol: string,
  limit: number,
  fetchMarkets: () => Promise<unknown>
): Promise<Trade[]> {
  try {
    const lighterSymbol = deps.normalizer.toLighterSymbol(symbol);

    // Get market_id from cache, or fetch markets first to populate cache
    let marketId = deps.marketIdCache.get(lighterSymbol);
    if (marketId === undefined) {
      await fetchMarkets();
      marketId = deps.marketIdCache.get(lighterSymbol);
      if (marketId === undefined) {
        throw new PerpDEXError(`Market not found: ${symbol}`, 'INVALID_SYMBOL', 'lighter');
      }
    }

    const response = await deps.request<{ code: number; trades: any[] }>(
      'GET',
      `/api/v1/recentTrades?market_id=${marketId}&limit=${limit}`
    );

    const trades = response.trades || [];
    if (!Array.isArray(trades)) {
      throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'lighter');
    }

    return trades.map((trade: any) => {
      const normalizedTrade: LighterTrade = {
        id: String(trade.trade_id || trade.id || Date.now()),
        symbol: lighterSymbol,
        side: trade.is_maker_ask ? 'sell' : 'buy',
        price: parseFloat(trade.price || '0'),
        amount: parseFloat(trade.size || trade.amount || '0'),
        timestamp: typeof trade.timestamp === 'number' ? trade.timestamp : Date.now(),
      };
      return deps.normalizer.normalizeTrade(normalizedTrade);
    });
  } catch (error) {
    throw mapError(error);
  }
}

/**
 * Fetch funding rate for a specific symbol
 * The API returns funding rates from multiple exchanges; we use the first match.
 */
export async function fetchFundingRateData(
  deps: MarketDataDeps,
  symbol: string,
  fetchMarkets: () => Promise<unknown>
): Promise<FundingRate> {
  try {
    const lighterSymbol = deps.normalizer.toLighterSymbol(symbol);

    // Get market_id for filtering
    let marketId = deps.marketIdCache.get(lighterSymbol);
    if (marketId === undefined) {
      await fetchMarkets();
      marketId = deps.marketIdCache.get(lighterSymbol);
    }

    const response = await deps.request<{
      code: number;
      funding_rates: Array<{
        market_id: number;
        exchange: string;
        symbol: string;
        rate: number;
      }>;
    }>('GET', `/api/v1/funding-rates?symbol=${lighterSymbol}`);

    const rates = response.funding_rates || [];

    // Find the rate matching our market_id, or the first rate for this symbol
    const matchingRate =
      marketId !== undefined
        ? rates.find((r) => r.market_id === marketId)
        : rates.find((r) => r.symbol === lighterSymbol);

    // Build a LighterFundingRate from the API response
    const fundingRate = matchingRate?.rate ?? 0;

    const lighterFundingRate: LighterFundingRate = {
      symbol: lighterSymbol,
      fundingRate: typeof fundingRate === 'number' && !isNaN(fundingRate) ? fundingRate : 0,
      markPrice: 0, // Not provided by this endpoint
      nextFundingTime: Date.now() + 8 * 3600 * 1000, // Estimated next funding
    };

    return deps.normalizer.normalizeFundingRate(lighterFundingRate);
  } catch (error) {
    throw mapError(error);
  }
}

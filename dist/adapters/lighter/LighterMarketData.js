/**
 * Lighter Market Data Helper Functions
 *
 * Extracted from LighterAdapter to reduce file size.
 * Contains market data fetching and parsing logic.
 */
import { PerpDEXError } from '../../types/errors.js';
import { mapError } from './utils.js';
/**
 * Fetch and parse markets, populating caches
 */
export async function fetchMarketsData(deps) {
    try {
        const response = await deps.request('GET', '/api/v1/orderBookDetails');
        if (!response.order_book_details || !Array.isArray(response.order_book_details)) {
            throw new PerpDEXError('Invalid markets response', 'INVALID_RESPONSE', 'lighter');
        }
        // Filter for perp markets only
        const perpMarkets = response.order_book_details.filter((m) => m.market_type === 'perp');
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
        return perpMarkets.map((market) => deps.normalizer.normalizeMarket(market));
    }
    catch (error) {
        throw mapError(error);
    }
}
/**
 * Fetch ticker for a specific symbol
 */
export async function fetchTickerData(deps, symbol) {
    try {
        const lighterSymbol = deps.normalizer.toLighterSymbol(symbol);
        const response = await deps.request('GET', '/api/v1/orderBookDetails');
        if (!response.order_book_details) {
            throw new PerpDEXError('Invalid ticker response', 'INVALID_RESPONSE', 'lighter');
        }
        // Find the market matching the symbol
        const market = response.order_book_details.find((m) => m.symbol === lighterSymbol && m.market_type === 'perp');
        if (!market) {
            throw new PerpDEXError(`Market not found: ${symbol}`, 'INVALID_SYMBOL', 'lighter');
        }
        return deps.normalizer.normalizeTicker(market);
    }
    catch (error) {
        throw mapError(error);
    }
}
/**
 * Fetch order book for a specific symbol
 */
export async function fetchOrderBookData(deps, symbol, limit, fetchMarkets) {
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
        const response = await deps.request('GET', `/api/v1/orderBookOrders?market_id=${marketId}&limit=${limit}`);
        // Convert to LighterOrderBook format
        const orderBook = {
            symbol: lighterSymbol,
            bids: response.bids?.map((b) => [
                parseFloat(b.price || '0'),
                parseFloat(b.remaining_base_amount || b.size || '0')
            ]) || [],
            asks: response.asks?.map((a) => [
                parseFloat(a.price || '0'),
                parseFloat(a.remaining_base_amount || a.size || '0')
            ]) || [],
            timestamp: Date.now(),
        };
        return deps.normalizer.normalizeOrderBook(orderBook);
    }
    catch (error) {
        throw mapError(error);
    }
}
/**
 * Fetch trades for a specific symbol
 */
export async function fetchTradesData(deps, symbol, limit) {
    try {
        const lighterSymbol = deps.normalizer.toLighterSymbol(symbol);
        const response = await deps.request('GET', `/api/v1/trades?symbol=${lighterSymbol}&limit=${limit}`);
        const trades = response.trades || [];
        if (!Array.isArray(trades)) {
            throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'lighter');
        }
        return trades.map((trade) => {
            const normalizedTrade = {
                id: trade.id || trade.trade_id || String(Date.now()),
                symbol: lighterSymbol,
                side: (trade.side || 'buy').toLowerCase(),
                price: parseFloat(trade.price || '0'),
                amount: parseFloat(trade.size || trade.amount || '0'),
                timestamp: trade.timestamp || trade.created_at || Date.now(),
            };
            return deps.normalizer.normalizeTrade(normalizedTrade);
        });
    }
    catch (error) {
        throw mapError(error);
    }
}
/**
 * Fetch funding rate for a specific symbol
 */
export async function fetchFundingRateData(deps, symbol) {
    try {
        const lighterSymbol = deps.normalizer.toLighterSymbol(symbol);
        const response = await deps.request('GET', `/funding/${lighterSymbol}`);
        return deps.normalizer.normalizeFundingRate(response);
    }
    catch (error) {
        throw mapError(error);
    }
}
//# sourceMappingURL=LighterMarketData.js.map
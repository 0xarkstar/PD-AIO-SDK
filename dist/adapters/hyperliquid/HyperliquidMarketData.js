/**
 * Hyperliquid Market Data Helpers
 *
 * Extracted from HyperliquidAdapter to reduce file size.
 * Contains OHLCV fetching and funding rate logic.
 */
/** Interval mapping from unified timeframes to Hyperliquid intervals */
const INTERVAL_MAP = {
    '1m': '1m',
    '3m': '3m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '2h': '2h',
    '4h': '4h',
    '6h': '6h',
    '8h': '8h',
    '12h': '12h',
    '1d': '1d',
    '3d': '3d',
    '1w': '1w',
    '1M': '1M',
};
/** Default duration for each timeframe */
const DURATION_MAP = {
    '1m': 24 * 60 * 60 * 1000, // 24 hours of 1m candles
    '3m': 3 * 24 * 60 * 60 * 1000, // 3 days
    '5m': 5 * 24 * 60 * 60 * 1000, // 5 days
    '15m': 7 * 24 * 60 * 60 * 1000, // 7 days
    '30m': 14 * 24 * 60 * 60 * 1000, // 14 days
    '1h': 30 * 24 * 60 * 60 * 1000, // 30 days
    '2h': 60 * 24 * 60 * 60 * 1000, // 60 days
    '4h': 90 * 24 * 60 * 60 * 1000, // 90 days
    '6h': 120 * 24 * 60 * 60 * 1000, // 120 days
    '8h': 180 * 24 * 60 * 60 * 1000, // 180 days
    '12h': 365 * 24 * 60 * 60 * 1000, // 1 year
    '1d': 365 * 24 * 60 * 60 * 1000, // 1 year
    '3d': 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
    '1w': 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
    '1M': 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
};
/**
 * Get the Hyperliquid interval string for a unified timeframe
 */
export function getInterval(timeframe) {
    return INTERVAL_MAP[timeframe] || '1h';
}
/**
 * Get default duration based on timeframe for initial data fetch
 */
export function getDefaultDuration(timeframe) {
    return DURATION_MAP[timeframe] || 30 * 24 * 60 * 60 * 1000;
}
/**
 * Build OHLCV request parameters
 */
export function buildOHLCVRequest(exchangeSymbol, timeframe, params) {
    const now = Date.now();
    const defaultDuration = getDefaultDuration(timeframe);
    return {
        coin: exchangeSymbol,
        interval: getInterval(timeframe),
        startTime: params?.since ?? now - defaultDuration,
        endTime: params?.until ?? now,
    };
}
/**
 * Parse candle response into OHLCV tuples
 */
export function parseCandles(response, limit) {
    if (!response || !Array.isArray(response)) {
        return [];
    }
    // Apply limit if specified
    const candles = limit ? response.slice(-limit) : response;
    // Convert to OHLCV format
    return candles.map((candle) => [
        candle.t,
        parseFloat(candle.o),
        parseFloat(candle.h),
        parseFloat(candle.l),
        parseFloat(candle.c),
        parseFloat(candle.v),
    ]);
}
/**
 * Parse funding rate history into unified format
 */
export function parseFundingRates(response, symbol, markPrice, limit) {
    // Convert to unified format
    let fundingRates = response.map((rate) => ({
        symbol,
        fundingRate: parseFloat(rate.fundingRate),
        fundingTimestamp: rate.time,
        nextFundingTimestamp: rate.time + 8 * 3600 * 1000, // 8 hours
        markPrice,
        indexPrice: markPrice,
        fundingIntervalHours: 8,
    }));
    // Sort by timestamp descending (newest first)
    fundingRates.sort((a, b) => b.fundingTimestamp - a.fundingTimestamp);
    // Apply limit if provided
    if (limit) {
        fundingRates = fundingRates.slice(0, limit);
    }
    return fundingRates;
}
/**
 * Build a single funding rate from the latest entry
 */
export function buildCurrentFundingRate(latest, symbol, markPrice) {
    return {
        symbol,
        fundingRate: parseFloat(latest.fundingRate),
        fundingTimestamp: latest.time,
        nextFundingTimestamp: latest.time + 8 * 3600 * 1000, // 8 hours
        markPrice,
        indexPrice: markPrice,
        fundingIntervalHours: 8,
    };
}
//# sourceMappingURL=HyperliquidMarketData.js.map
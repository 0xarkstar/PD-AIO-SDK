/**
 * Hyperliquid Market Data Helpers
 *
 * Extracted from HyperliquidAdapter to reduce file size.
 * Contains OHLCV fetching and funding rate logic.
 */

import type { FundingRate, OHLCV, OHLCVParams, OHLCVTimeframe } from '../../types/index.js';

/** OHLCV candle response from Hyperliquid */
export interface HyperliquidCandle {
  t: number; // timestamp
  o: string; // open
  h: string; // high
  l: string; // low
  c: string; // close
  v: string; // volume
  n?: number; // number of trades (optional)
}

/** Interval mapping from unified timeframes to Hyperliquid intervals */
const INTERVAL_MAP: Record<OHLCVTimeframe, string> = {
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
const DURATION_MAP: Record<OHLCVTimeframe, number> = {
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
export function getInterval(timeframe: OHLCVTimeframe): string {
  return INTERVAL_MAP[timeframe] || '1h';
}

/**
 * Get default duration based on timeframe for initial data fetch
 */
export function getDefaultDuration(timeframe: OHLCVTimeframe): number {
  return DURATION_MAP[timeframe] || 30 * 24 * 60 * 60 * 1000;
}

/**
 * Build OHLCV request parameters
 */
export function buildOHLCVRequest(
  exchangeSymbol: string,
  timeframe: OHLCVTimeframe,
  params?: OHLCVParams
): { coin: string; interval: string; startTime: number; endTime: number } {
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
export function parseCandles(
  response: HyperliquidCandle[] | null | undefined,
  limit?: number
): OHLCV[] {
  if (!response || !Array.isArray(response)) {
    return [];
  }

  // Apply limit if specified
  const candles = limit ? response.slice(-limit) : response;

  // Convert to OHLCV format
  return candles.map(
    (candle): OHLCV => [
      candle.t,
      parseFloat(candle.o),
      parseFloat(candle.h),
      parseFloat(candle.l),
      parseFloat(candle.c),
      parseFloat(candle.v),
    ]
  );
}

/**
 * Parse funding rate history into unified format
 */
export function parseFundingRates(
  response: Array<{ coin: string; fundingRate: string; premium: string; time: number }>,
  symbol: string,
  markPrice: number,
  limit?: number
): FundingRate[] {
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
export function buildCurrentFundingRate(
  latest: { coin: string; fundingRate: string; premium: string; time: number },
  symbol: string,
  markPrice: number
): FundingRate {
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

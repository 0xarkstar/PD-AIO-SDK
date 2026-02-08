/**
 * Hyperliquid Market Data Helpers
 *
 * Extracted from HyperliquidAdapter to reduce file size.
 * Contains OHLCV fetching and funding rate logic.
 */
import type { FundingRate, OHLCV, OHLCVParams, OHLCVTimeframe } from '../../types/index.js';
/** OHLCV candle response from Hyperliquid */
export interface HyperliquidCandle {
    t: number;
    o: string;
    h: string;
    l: string;
    c: string;
    v: string;
    n?: number;
}
/**
 * Get the Hyperliquid interval string for a unified timeframe
 */
export declare function getInterval(timeframe: OHLCVTimeframe): string;
/**
 * Get default duration based on timeframe for initial data fetch
 */
export declare function getDefaultDuration(timeframe: OHLCVTimeframe): number;
/**
 * Build OHLCV request parameters
 */
export declare function buildOHLCVRequest(exchangeSymbol: string, timeframe: OHLCVTimeframe, params?: OHLCVParams): {
    coin: string;
    interval: string;
    startTime: number;
    endTime: number;
};
/**
 * Parse candle response into OHLCV tuples
 */
export declare function parseCandles(response: HyperliquidCandle[] | null | undefined, limit?: number): OHLCV[];
/**
 * Parse funding rate history into unified format
 */
export declare function parseFundingRates(response: Array<{
    coin: string;
    fundingRate: string;
    premium: string;
    time: number;
}>, symbol: string, markPrice: number, limit?: number): FundingRate[];
/**
 * Build a single funding rate from the latest entry
 */
export declare function buildCurrentFundingRate(latest: {
    coin: string;
    fundingRate: string;
    premium: string;
    time: number;
}, symbol: string, markPrice: number): FundingRate;
//# sourceMappingURL=HyperliquidMarketData.d.ts.map
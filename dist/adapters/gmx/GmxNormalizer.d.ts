/**
 * GMX v2 Data Normalizer
 *
 * Transforms GMX API responses and on-chain data to unified SDK format.
 */
import type { Market, Order, Position, Trade, FundingRate, Ticker, OHLCV } from '../../types/common.js';
import type { GmxMarketInfo, GmxPosition, GmxOrder, GmxTrade, GmxFundingRate, GmxCandlestick } from './types.js';
/**
 * Normalizer for GMX v2 data
 */
export declare class GmxNormalizer {
    /**
     * Extract base symbol from market name
     * @example "ENA/USD [ETH-USDC]" -> "ENA"
     * @example "ETH/USD" -> "ETH"
     */
    private extractBaseFromName;
    /**
     * Normalize market info to unified Market
     */
    normalizeMarket(market: GmxMarketInfo, chain: 'arbitrum' | 'avalanche'): Market;
    /**
     * Normalize multiple markets
     */
    normalizeMarkets(markets: GmxMarketInfo[], chain: 'arbitrum' | 'avalanche'): Market[];
    /**
     * Normalize position to unified Position
     */
    normalizePosition(position: GmxPosition, markPrice: number, chain: 'arbitrum' | 'avalanche'): Position;
    /**
     * Normalize order to unified Order
     */
    normalizeOrder(order: GmxOrder, marketPrice?: number): Order;
    /**
     * Normalize trade to unified Trade
     */
    normalizeTrade(trade: GmxTrade): Trade;
    /**
     * Normalize funding rate
     */
    normalizeFundingRate(funding: GmxFundingRate, indexPrice: number): FundingRate;
    /**
     * Normalize market info to ticker
     * Note: Price data requires separate fetch from tickers endpoint
     */
    normalizeTicker(market: GmxMarketInfo, priceData?: {
        minPrice: number;
        maxPrice: number;
    }): Ticker;
    /**
     * Normalize candlesticks to OHLCV
     */
    normalizeCandle(candle: GmxCandlestick): OHLCV;
    /**
     * Normalize candlesticks array
     */
    normalizeCandles(candles: GmxCandlestick[]): OHLCV[];
    /**
     * Calculate unrealized PnL
     */
    private calculateUnrealizedPnl;
    /**
     * Calculate liquidation price
     */
    private calculateLiquidationPrice;
    /**
     * Calculate margin ratio (percentage until liquidation)
     */
    private calculateMarginRatio;
    /**
     * Get precision from tick size
     */
    private getPrecisionFromTickSize;
}
//# sourceMappingURL=GmxNormalizer.d.ts.map
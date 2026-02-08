/**
 * Drift Protocol Data Normalizer
 *
 * Transforms Drift on-chain account data and API responses
 * to unified SDK format.
 */
import type { Market, Order, Position, Trade, FundingRate, Balance, Ticker, OrderBook, OHLCV } from '../../types/common.js';
import type { DriftPerpPosition, DriftSpotPosition, DriftOrder, DriftPerpMarketAccount, DriftL2OrderBook, DriftTrade, DriftFundingRate, DriftFundingRateRecord, DriftMarketStats, DriftCandle } from './types.js';
/**
 * Normalizer for Drift Protocol data
 */
export declare class DriftNormalizer {
    /**
     * Normalize perp market account to unified Market
     */
    normalizeMarket(market: DriftPerpMarketAccount): Market;
    /**
     * Normalize multiple markets
     */
    normalizeMarkets(markets: DriftPerpMarketAccount[]): Market[];
    /**
     * Normalize perp position to unified Position
     */
    normalizePosition(position: DriftPerpPosition, markPrice: number, _oraclePrice: number): Position;
    /**
     * Normalize order to unified Order
     */
    normalizeOrder(order: DriftOrder, marketPrice?: number): Order;
    /**
     * Normalize L2 orderbook
     */
    normalizeOrderBook(orderbook: DriftL2OrderBook): OrderBook;
    /**
     * Normalize trade
     */
    normalizeTrade(trade: DriftTrade): Trade;
    /**
     * Normalize funding rate
     */
    normalizeFundingRate(funding: DriftFundingRate | DriftFundingRateRecord, oraclePrice?: number): FundingRate;
    /**
     * Normalize ticker from market stats
     */
    normalizeTicker(stats: DriftMarketStats): Ticker;
    /**
     * Normalize balance from spot position
     */
    normalizeBalance(position: DriftSpotPosition, tokenPrice: number, tokenSymbol: string): Balance;
    /**
     * Normalize candle to OHLCV
     */
    normalizeCandle(candle: DriftCandle): OHLCV;
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
//# sourceMappingURL=DriftNormalizer.d.ts.map
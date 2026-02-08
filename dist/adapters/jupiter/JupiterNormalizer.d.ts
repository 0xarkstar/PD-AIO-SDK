/**
 * Jupiter Perps Data Normalizer
 *
 * Transforms Jupiter on-chain account data and API responses
 * to unified SDK format.
 */
import type { Market, Position, FundingRate, Balance, Ticker, OrderBook } from '../../types/common.js';
import type { JupiterPositionAccount, JupiterPoolAccount, JupiterCustodyAccount, JupiterMarketStats, JupiterPoolStats, JupiterPriceData, JupiterNormalizedPosition } from './types.js';
/**
 * Normalizer for Jupiter Perps data
 */
export declare class JupiterNormalizer {
    /**
     * Normalize market data from custody and pool accounts
     */
    normalizeMarket(marketKey: string, custody: JupiterCustodyAccount, pool: JupiterPoolAccount, _stats?: JupiterMarketStats): Market;
    /**
     * Normalize multiple markets
     */
    normalizeMarkets(custodies: Map<string, JupiterCustodyAccount>, pool: JupiterPoolAccount, stats?: Map<string, JupiterMarketStats>): Market[];
    /**
     * Normalize on-chain position account to unified Position
     */
    normalizePosition(positionAddress: string, position: JupiterPositionAccount, currentPrice: number, marketKey: string): Position;
    /**
     * Normalize position for internal SDK use
     */
    normalizePositionInternal(positionAddress: string, position: JupiterPositionAccount, currentPrice: number, marketKey: string): JupiterNormalizedPosition;
    /**
     * Normalize ticker from price API and stats
     */
    normalizeTicker(marketKey: string, priceData: JupiterPriceData, stats?: JupiterMarketStats): Ticker;
    /**
     * Normalize balance from pool stats
     * Jupiter uses JLP pool for collateral
     */
    normalizeBalance(currency: string, total: number, locked: number): Balance;
    /**
     * Normalize funding rate (Jupiter uses borrow fees, not funding rates)
     * We represent borrow fee as a pseudo-funding rate for unified interface
     */
    normalizeFundingRate(marketKey: string, custody: JupiterCustodyAccount, currentPrice: number): FundingRate;
    /**
     * Normalize order book (Jupiter doesn't have traditional orderbook)
     * Returns synthetic orderbook based on pool liquidity
     */
    normalizeOrderBook(marketKey: string, currentPrice: number, poolStats?: JupiterPoolStats): OrderBook;
    /**
     * Normalize pool stats to unified format
     */
    normalizePoolStats(stats: JupiterPoolStats): Record<string, unknown>;
    /**
     * Calculate unrealized PnL
     */
    private calculateUnrealizedPnl;
    /**
     * Calculate liquidation price
     * Simplified calculation - actual Jupiter calculation is more complex
     */
    private calculateLiquidationPrice;
    /**
     * Get price precision for market
     */
    private getPricePrecision;
    /**
     * Get amount precision for market
     */
    private getAmountPrecision;
}
//# sourceMappingURL=JupiterNormalizer.d.ts.map
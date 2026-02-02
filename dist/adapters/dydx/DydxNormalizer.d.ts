/**
 * dYdX v4 Data Normalizer
 *
 * Transforms dYdX Indexer API responses to unified SDK format.
 * dYdX v4 is built on Cosmos SDK and uses USD-denominated perpetuals.
 *
 * @see https://docs.dydx.exchange/
 */
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate, OHLCV } from '../../types/common.js';
import type { DydxPerpetualMarket, DydxOrder, DydxPerpetualPosition, DydxOrderBookResponse, DydxTrade, DydxFill, DydxHistoricalFunding, DydxSubaccount, DydxCandle } from './types.js';
/**
 * dYdX v4 Data Normalizer
 *
 * Provides data transformation between dYdX Indexer API and unified formats with:
 * - Symbol format conversions (BTC-USD ↔ BTC/USD:USD)
 * - Numeric string parsing
 * - Status mapping
 * - Position side detection
 *
 * @example
 * ```typescript
 * const normalizer = new DydxNormalizer();
 *
 * // Single entity
 * const market = normalizer.normalizeMarket(dydxMarket);
 *
 * // Batch processing
 * const markets = normalizer.normalizeMarkets(dydxMarkets);
 * ```
 */
export declare class DydxNormalizer {
    /**
     * Normalize dYdX market to unified format
     *
     * @param market - dYdX perpetual market data
     * @returns Unified market
     */
    normalizeMarket(market: DydxPerpetualMarket): Market;
    /**
     * Normalize multiple markets
     *
     * @param markets - Record of dYdX markets
     * @returns Array of unified markets
     */
    normalizeMarkets(markets: Record<string, DydxPerpetualMarket>): Market[];
    /**
     * Normalize dYdX order to unified format
     *
     * @param order - dYdX order
     * @returns Unified order
     */
    normalizeOrder(order: DydxOrder): Order;
    /**
     * Normalize multiple orders
     *
     * @param orders - Array of dYdX orders
     * @returns Array of unified orders
     */
    normalizeOrders(orders: DydxOrder[]): Order[];
    /**
     * Normalize dYdX order type to unified format
     */
    private normalizeOrderType;
    /**
     * Normalize dYdX order status to unified format
     */
    private normalizeOrderStatus;
    /**
     * Normalize time in force
     */
    private normalizeTimeInForce;
    /**
     * Normalize dYdX position to unified format
     *
     * @param position - dYdX perpetual position
     * @param oraclePrice - Current oracle price for the market
     * @returns Unified position
     */
    normalizePosition(position: DydxPerpetualPosition, oraclePrice?: number): Position;
    /**
     * Normalize multiple positions
     *
     * @param positions - Record of dYdX positions
     * @param oraclePrices - Map of oracle prices by ticker
     * @returns Array of unified positions
     */
    normalizePositions(positions: Record<string, DydxPerpetualPosition>, oraclePrices?: Record<string, number>): Position[];
    /**
     * Normalize dYdX order book to unified format
     *
     * @param orderBook - dYdX order book response
     * @param ticker - Market ticker
     * @returns Unified order book
     */
    normalizeOrderBook(orderBook: DydxOrderBookResponse, ticker: string): OrderBook;
    /**
     * Normalize dYdX trade to unified format
     *
     * @param trade - dYdX trade
     * @param ticker - Market ticker
     * @returns Unified trade
     */
    normalizeTrade(trade: DydxTrade, ticker: string): Trade;
    /**
     * Normalize multiple trades
     *
     * @param trades - Array of dYdX trades
     * @param ticker - Market ticker
     * @returns Array of unified trades
     */
    normalizeTrades(trades: DydxTrade[], ticker: string): Trade[];
    /**
     * Normalize dYdX fill to unified trade format
     *
     * @param fill - dYdX fill
     * @returns Unified trade
     */
    normalizeFill(fill: DydxFill): Trade;
    /**
     * Normalize multiple fills
     *
     * @param fills - Array of dYdX fills
     * @returns Array of unified trades
     */
    normalizeFills(fills: DydxFill[]): Trade[];
    /**
     * Normalize dYdX funding rate to unified format
     *
     * @param funding - dYdX historical funding data
     * @param oraclePrice - Current oracle price
     * @returns Unified funding rate
     */
    normalizeFundingRate(funding: DydxHistoricalFunding, oraclePrice?: number): FundingRate;
    /**
     * Normalize multiple funding rates
     *
     * @param fundingHistory - Array of dYdX funding records
     * @param oraclePrice - Current oracle price
     * @returns Array of unified funding rates
     */
    normalizeFundingHistory(fundingHistory: DydxHistoricalFunding[], oraclePrice?: number): FundingRate[];
    /**
     * Normalize dYdX subaccount to unified balance format
     *
     * @param subaccount - dYdX subaccount data
     * @returns Array of unified balances
     */
    normalizeBalance(subaccount: DydxSubaccount): Balance[];
    /**
     * Normalize market data to ticker format
     *
     * @param market - dYdX perpetual market data
     * @returns Unified ticker
     */
    normalizeTicker(market: DydxPerpetualMarket): Ticker;
    /**
     * Normalize dYdX candle to OHLCV format
     *
     * @param candle - dYdX candle data
     * @returns OHLCV tuple
     */
    normalizeCandle(candle: DydxCandle): OHLCV;
    /**
     * Normalize multiple candles
     *
     * @param candles - Array of dYdX candles
     * @returns Array of OHLCV tuples
     */
    normalizeCandles(candles: DydxCandle[]): OHLCV[];
}
//# sourceMappingURL=DydxNormalizer.d.ts.map
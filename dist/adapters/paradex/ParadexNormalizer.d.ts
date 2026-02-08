/**
 * Paradex Data Normalizer
 *
 * Transforms Paradex API responses to unified SDK format with precision safety,
 * batch processing optimization, and comprehensive validation.
 *
 * @see https://docs.paradex.trade
 */
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate, OrderSide, OrderType, TimeInForce } from '../../types/common.js';
import type { ParadexMarket, ParadexOrder, ParadexPosition, ParadexBalance, ParadexOrderBook, ParadexTrade, ParadexTicker, ParadexFundingRate } from './types.js';
/**
 * Paradex Data Normalizer
 *
 * Provides data transformation between Paradex and unified formats with:
 * - Precision-safe numeric conversions
 * - Batch processing optimization
 * - Symbol format conversions (bidirectional)
 * - Enum mappings
 *
 * @example
 * ```typescript
 * const normalizer = new ParadexNormalizer();
 *
 * // Single entity
 * const market = normalizer.normalizeMarket(paradexMarket);
 *
 * // Batch processing
 * const orders = normalizer.normalizeOrders(paradexOrders);
 *
 * // Reverse conversion
 * const paradexSymbol = normalizer.symbolFromCCXT('BTC/USD:USD');
 * ```
 */
export declare class ParadexNormalizer {
    /**
     * Convert Paradex symbol to CCXT format
     *
     * @param paradexSymbol - Paradex symbol (e.g., "BTC-USD-PERP", "ETH-USDC-PERP")
     * @returns CCXT formatted symbol (e.g., "BTC/USD:USD")
     *
     * @example
     * ```typescript
     * normalizer.symbolToCCXT('BTC-USD-PERP');  // "BTC/USD:USD"
     * normalizer.symbolToCCXT('ETH-USDC-PERP'); // "ETH/USDC:USDC"
     * normalizer.symbolToCCXT('BTC-USD');       // "BTC/USD" (spot)
     * ```
     */
    symbolToCCXT(paradexSymbol: string): string;
    /**
     * Convert CCXT symbol to Paradex format
     *
     * @param ccxtSymbol - CCXT formatted symbol (e.g., "BTC/USD:USD")
     * @returns Paradex symbol (e.g., "BTC-USD-PERP")
     *
     * @example
     * ```typescript
     * normalizer.symbolFromCCXT('BTC/USD:USD');    // "BTC-USD-PERP"
     * normalizer.symbolFromCCXT('ETH/USDC:USDC');  // "ETH-USDC-PERP"
     * normalizer.symbolFromCCXT('BTC/USD');        // "BTC-USD" (spot)
     * ```
     */
    symbolFromCCXT(ccxtSymbol: string): string;
    /**
     * Count decimal places in a string number
     *
     * @param value - String number (e.g., "0.001")
     * @returns Number of decimal places (e.g., 3)
     */
    private countDecimals;
    /**
     * Normalize Paradex market to unified format
     *
     * Handles both old SDK type format and actual API response format:
     * - API uses: order_size_increment, price_tick_size, min_notional, fee_config, delta1_cross_margin_params
     * - SDK type uses: step_size, tick_size, min_order_size, maker_fee_rate, taker_fee_rate, max_leverage
     *
     * @param paradexMarket - Paradex market data from API
     * @returns Unified market
     */
    normalizeMarket(paradexMarket: any): Market;
    /**
     * Batch normalize markets
     */
    normalizeMarkets(paradexMarkets: ParadexMarket[]): Market[];
    /**
     * Map Paradex order type to unified
     */
    private normalizeOrderType;
    /**
     * Map Paradex order side to unified
     */
    private normalizeOrderSide;
    /**
     * Map Paradex order status to unified
     */
    private normalizeOrderStatus;
    /**
     * Map Paradex time in force to unified
     */
    private normalizeTimeInForce;
    /**
     * Normalize Paradex order to unified format
     */
    normalizeOrder(paradexOrder: ParadexOrder): Order;
    /**
     * Batch normalize orders
     */
    normalizeOrders(paradexOrders: ParadexOrder[]): Order[];
    /**
     * Normalize Paradex position to unified format
     */
    normalizePosition(paradexPosition: ParadexPosition): Position;
    /**
     * Batch normalize positions
     */
    normalizePositions(paradexPositions: ParadexPosition[]): Position[];
    /**
     * Normalize Paradex balance to unified format
     */
    normalizeBalance(paradexBalance: ParadexBalance): Balance;
    /**
     * Batch normalize balances
     */
    normalizeBalances(paradexBalances: ParadexBalance[]): Balance[];
    /**
     * Normalize Paradex order book to unified format
     */
    normalizeOrderBook(paradexOrderBook: ParadexOrderBook): OrderBook;
    /**
     * Normalize Paradex trade to unified format
     */
    normalizeTrade(paradexTrade: ParadexTrade): Trade;
    /**
     * Batch normalize trades
     */
    normalizeTrades(paradexTrades: ParadexTrade[]): Trade[];
    /**
     * Normalize Paradex ticker to unified format
     */
    normalizeTicker(paradexTicker: ParadexTicker): Ticker;
    /**
     * Batch normalize tickers
     */
    normalizeTickers(paradexTickers: ParadexTicker[]): Ticker[];
    /**
     * Normalize Paradex funding rate to unified format
     */
    normalizeFundingRate(paradexFunding: ParadexFundingRate): FundingRate;
    /**
     * Batch normalize funding rates
     */
    normalizeFundingRates(paradexFundingRates: ParadexFundingRate[]): FundingRate[];
    /**
     * Convert unified order type to Paradex format
     *
     * @param type - Unified order type
     * @param postOnly - Post-only flag
     * @returns Paradex order type
     */
    toParadexOrderType(type: OrderType, postOnly?: boolean): string;
    /**
     * Convert unified order side to Paradex format
     *
     * @param side - Unified order side
     * @returns Paradex order side
     */
    toParadexOrderSide(side: OrderSide): string;
    /**
     * Convert unified time in force to Paradex format
     *
     * @param tif - Unified time in force
     * @param postOnly - Post-only flag
     * @returns Paradex time in force
     */
    toParadexTimeInForce(tif?: TimeInForce, postOnly?: boolean): string;
}
//# sourceMappingURL=ParadexNormalizer.d.ts.map
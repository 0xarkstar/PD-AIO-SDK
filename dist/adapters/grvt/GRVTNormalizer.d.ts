/**
 * GRVT Data Normalizer
 *
 * Transforms GRVT API responses to unified SDK format with precision safety,
 * batch processing optimization, and comprehensive validation.
 *
 * @see https://docs.grvt.io
 */
import type { IInstrumentDisplay, IOrder, IPositions, ISpotBalance, IFill, ITicker, IOrderbookLevels, ITrade } from '@grvt/client/interfaces';
import type { Market, Order, Position, Balance, Trade, Ticker, OrderBook } from '../../types/common.js';
/**
 * GRVT Data Normalizer
 *
 * Provides data transformation between GRVT and unified formats with:
 * - Precision-safe numeric conversions
 * - Batch processing optimization
 * - Runtime validation with Zod
 * - Symbol format conversions
 *
 * @example
 * ```typescript
 * const normalizer = new GRVTNormalizer();
 *
 * // Single entity
 * const market = normalizer.normalizeMarket(grvtMarket);
 *
 * // Batch processing
 * const orders = normalizer.normalizeOrders(grvtOrders);
 * ```
 */
export declare class GRVTNormalizer {
    /**
     * Convert GRVT symbol to CCXT format
     *
     * @param grvtSymbol - GRVT symbol (e.g., "BTC-PERP", "ETH-PERP")
     * @returns CCXT formatted symbol (e.g., "BTC/USDT:USDT")
     *
     * @example
     * ```typescript
     * normalizer.symbolToCCXT('BTC-PERP');  // "BTC/USDT:USDT"
     * normalizer.symbolToCCXT('ETH-PERP');  // "ETH/USDT:USDT"
     * normalizer.symbolToCCXT('BTC-SPOT');  // "BTC/USDT"
     * ```
     */
    symbolToCCXT(grvtSymbol: string): string;
    /**
     * Convert CCXT symbol to GRVT format
     *
     * @param ccxtSymbol - CCXT formatted symbol (e.g., "BTC/USDT:USDT")
     * @returns GRVT symbol (e.g., "BTC_USDT_Perp")
     *
     * @example
     * ```typescript
     * normalizer.symbolFromCCXT('BTC/USDT:USDT'); // "BTC_USDT_Perp"
     * normalizer.symbolFromCCXT('ETH/USDT:USDT'); // "ETH_USDT_Perp"
     * normalizer.symbolFromCCXT('BTC/USDT');      // "BTC_USDT"
     * ```
     */
    symbolFromCCXT(ccxtSymbol: string): string;
    /**
     * Convert string to number with validation
     *
     * @param value - String value to convert
     * @param decimals - Number of decimal places (default: 8)
     * @returns Number
     *
     * @throws {PerpDEXError} If value is not a valid number
     */
    private toNumberSafe;
    /**
     * Convert number to string with precision
     *
     * @param value - Number to convert
     * @param decimals - Number of decimal places
     * @returns String representation
     */
    private toStringSafe;
    /**
     * Normalize GRVT market to unified format
     *
     * @param grvtMarket - GRVT market data from SDK
     * @returns Unified market
     */
    normalizeMarket(grvtMarket: IInstrumentDisplay): Market;
    /**
     * Batch normalize markets
     */
    normalizeMarkets(grvtMarkets: IInstrumentDisplay[]): Market[];
    /**
     * Map GRVT order type to unified
     */
    private mapOrderType;
    /**
     * Map GRVT order side to unified
     */
    private mapOrderSide;
    /**
     * Map GRVT order status to unified
     */
    private mapOrderStatus;
    /**
     * Map GRVT time in force to unified
     */
    private mapTimeInForce;
    /**
     * Normalize GRVT order to unified format
     */
    normalizeOrder(grvtOrder: IOrder): Order;
    /**
     * Map SDK order status to unified format
     */
    private mapSDKOrderStatus;
    /**
     * Map SDK time in force to unified format
     */
    private mapSDKTimeInForce;
    /**
     * Batch normalize orders
     */
    normalizeOrders(grvtOrders: IOrder[]): Order[];
    /**
     * Map GRVT position side to unified
     */
    private mapPositionSide;
    /**
     * Normalize GRVT position to unified format
     */
    normalizePosition(grvtPosition: IPositions): Position;
    /**
     * Batch normalize positions
     */
    normalizePositions(grvtPositions: IPositions[]): Position[];
    /**
     * Normalize GRVT balance to unified format
     */
    normalizeBalance(grvtBalance: ISpotBalance): Balance;
    /**
     * Batch normalize balances
     */
    normalizeBalances(grvtBalances: ISpotBalance[]): Balance[];
    /**
     * Normalize GRVT trade to unified format (public trades)
     */
    normalizeTrade(grvtTrade: ITrade): Trade;
    /**
     * Batch normalize trades
     */
    normalizeTrades(grvtTrades: ITrade[]): Trade[];
    /**
     * Normalize GRVT fill to unified trade format (user fills)
     */
    normalizeFill(grvtFill: IFill): Trade;
    /**
     * Batch normalize fills
     */
    normalizeFills(grvtFills: IFill[]): Trade[];
    /**
     * Normalize GRVT ticker to unified format
     */
    normalizeTicker(grvtTicker: ITicker): Ticker;
    /**
     * Batch normalize tickers
     */
    normalizeTickers(grvtTickers: ITicker[]): Ticker[];
    /**
     * Normalize GRVT order book to unified format
     */
    normalizeOrderBook(grvtOrderBook: IOrderbookLevels): OrderBook;
}
//# sourceMappingURL=GRVTNormalizer.d.ts.map
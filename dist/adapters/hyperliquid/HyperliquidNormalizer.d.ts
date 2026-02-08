/**
 * Hyperliquid Data Normalizer
 *
 * Transforms Hyperliquid API responses to unified SDK format.
 * Hyperliquid uses EIP-712 signing and a unique perpetual trading model.
 *
 * @see https://hyperliquid.gitbook.io
 */
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate } from '../../types/common.js';
import type { HyperliquidAsset, HyperliquidOpenOrder, HyperliquidPosition, HyperliquidL2Book, HyperliquidWsTrade, HyperliquidFill, HyperliquidUserFill, HyperliquidHistoricalOrder, HyperliquidFundingRate, HyperliquidUserState } from './types.js';
/**
 * Hyperliquid Data Normalizer
 *
 * Provides data transformation between Hyperliquid and unified formats with:
 * - Symbol format conversions (BASE-PERP ↔ BASE/USDT:USDT)
 * - Numeric string parsing
 * - Status mapping
 * - Position side detection
 *
 * @example
 * ```typescript
 * const normalizer = new HyperliquidNormalizer();
 *
 * // Single entity
 * const market = normalizer.normalizeMarket(hlAsset, 0);
 *
 * // Batch processing
 * const markets = normalizer.normalizeMarkets(hlAssets);
 *
 * // Symbol conversion
 * const unified = normalizer.symbolToCCXT('BTC-PERP'); // "BTC/USDT:USDT"
 * ```
 */
export declare class HyperliquidNormalizer {
    /**
     * Convert Hyperliquid symbol to CCXT format
     *
     * @param hyperliquidSymbol - Hyperliquid symbol (e.g., "BTC-PERP", "ETH-PERP")
     * @returns CCXT formatted symbol (e.g., "BTC/USDT:USDT")
     *
     * @example
     * ```typescript
     * normalizer.symbolToCCXT('BTC-PERP');  // "BTC/USDT:USDT"
     * normalizer.symbolToCCXT('ETH-PERP');  // "ETH/USDT:USDT"
     * ```
     */
    symbolToCCXT(hyperliquidSymbol: string): string;
    /**
     * Convert CCXT symbol to Hyperliquid format
     *
     * @param ccxtSymbol - CCXT symbol (e.g., "BTC/USDT:USDT")
     * @returns Hyperliquid formatted symbol (e.g., "BTC-PERP")
     *
     * @example
     * ```typescript
     * normalizer.symbolFromCCXT('BTC/USDT:USDT'); // "BTC-PERP"
     * normalizer.symbolFromCCXT('ETH/USDT:USDT'); // "ETH-PERP"
     * ```
     */
    symbolFromCCXT(ccxtSymbol: string): string;
    /**
     * Normalize Hyperliquid open order to unified format
     *
     * @param order - Hyperliquid open order
     * @param symbol - Exchange symbol (for reference)
     * @returns Unified order
     */
    normalizeOrder(order: HyperliquidOpenOrder, _symbol: string): Order;
    /**
     * Normalize multiple orders
     *
     * @param orders - Array of Hyperliquid orders
     * @param symbol - Exchange symbol
     * @returns Array of unified orders
     */
    normalizeOrders(orders: HyperliquidOpenOrder[], symbol: string): Order[];
    /**
     * Normalize Hyperliquid historical order to unified format
     *
     * @param historicalOrder - Hyperliquid historical order
     * @returns Unified order
     */
    normalizeHistoricalOrder(historicalOrder: HyperliquidHistoricalOrder): Order;
    /**
     * Normalize Hyperliquid position to unified format
     *
     * @param hlPosition - Hyperliquid position
     * @returns Unified position
     */
    normalizePosition(hlPosition: HyperliquidPosition): Position;
    /**
     * Normalize multiple positions
     *
     * @param positions - Array of Hyperliquid positions
     * @returns Array of unified positions
     */
    normalizePositions(positions: HyperliquidPosition[]): Position[];
    /**
     * Normalize Hyperliquid asset to unified market format
     *
     * @param asset - Hyperliquid asset
     * @param index - Market index
     * @returns Unified market
     */
    normalizeMarket(asset: HyperliquidAsset, index: number): Market;
    /**
     * Normalize multiple markets
     *
     * @param assets - Array of Hyperliquid assets
     * @returns Array of unified markets
     */
    normalizeMarkets(assets: HyperliquidAsset[]): Market[];
    /**
     * Normalize Hyperliquid L2 order book to unified format
     *
     * @param book - Hyperliquid L2 book
     * @returns Unified order book
     */
    normalizeOrderBook(book: HyperliquidL2Book): OrderBook;
    /**
     * Normalize Hyperliquid WebSocket trade to unified format
     *
     * @param trade - Hyperliquid WS trade
     * @returns Unified trade
     */
    normalizeTrade(trade: HyperliquidWsTrade): Trade;
    /**
     * Normalize Hyperliquid fill to unified trade format
     *
     * @param fill - Hyperliquid fill
     * @returns Unified trade
     */
    normalizeFill(fill: HyperliquidFill): Trade;
    /**
     * Normalize Hyperliquid user fill to unified trade format
     *
     * @param fill - Hyperliquid user fill
     * @returns Unified trade
     */
    normalizeUserFill(fill: HyperliquidUserFill): Trade;
    /**
     * Normalize multiple trades
     *
     * @param trades - Array of Hyperliquid trades
     * @returns Array of unified trades
     */
    normalizeTrades(trades: HyperliquidWsTrade[]): Trade[];
    /**
     * Normalize Hyperliquid funding rate to unified format
     *
     * @param fundingData - Hyperliquid funding rate
     * @param markPrice - Current mark price
     * @returns Unified funding rate
     */
    normalizeFundingRate(fundingData: HyperliquidFundingRate, markPrice: number): FundingRate;
    /**
     * Normalize Hyperliquid user state to unified balance format
     *
     * @param userState - Hyperliquid user state
     * @returns Array of unified balances
     */
    normalizeBalance(userState: HyperliquidUserState): Balance[];
    /**
     * Normalize ticker data
     *
     * @param coin - Hyperliquid coin symbol
     * @param data - Ticker data with mid price
     * @returns Unified ticker
     */
    normalizeTicker(coin: string, data: {
        mid: string;
        [key: string]: unknown;
    }): Ticker;
}
//# sourceMappingURL=HyperliquidNormalizer.d.ts.map
/**
 * Backpack Normalizer
 *
 * Transforms Backpack-specific data structures to unified SDK format
 */
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate } from '../../types/common.js';
import type { BackpackMarket, BackpackOrder, BackpackPosition, BackpackBalance, BackpackOrderBook, BackpackTrade, BackpackTicker, BackpackFundingRate } from './types.js';
export declare class BackpackNormalizer {
    /**
     * Normalize Backpack symbol to unified format
     *
     * Backpack uses underscore-separated format:
     * - New format: SOL_USDC_PERP, BTC_USDC_PERP (base_quote_perp)
     * - Legacy format: BTCUSDT_PERP, SOLUSDT_PERP (basequote_perp - for test compatibility)
     * - Spot: SOL_USDC, BTC_USDC
     *
     * @example
     * normalizeSymbol('SOL_USDC_PERP') // 'SOL/USDC:USDC'
     * normalizeSymbol('BTCUSDT_PERP') // 'BTC/USDT:USDT' (legacy)
     * normalizeSymbol('SOL_USDC') // 'SOL/USDC'
     */
    normalizeSymbol(backpackSymbol: string): string;
    /**
     * Convert unified symbol to Backpack format
     *
     * @example
     * toBackpackSymbol('SOL/USDC:USDC') // 'SOL_USDC_PERP'
     * toBackpackSymbol('BTC/USDC:USDC') // 'BTC_USDC_PERP'
     * toBackpackSymbol('SOL/USDC') // 'SOL_USDC'
     */
    toBackpackSymbol(symbol: string): string;
    /**
     * Normalize Backpack market to unified format
     */
    normalizeMarket(backpackMarket: BackpackMarket): Market;
    /**
     * Normalize Backpack order to unified format
     */
    normalizeOrder(backpackOrder: BackpackOrder): Order;
    /**
     * Normalize Backpack position to unified format
     */
    normalizePosition(backpackPosition: BackpackPosition): Position;
    /**
     * Normalize Backpack balance to unified format
     */
    normalizeBalance(backpackBalance: BackpackBalance): Balance;
    /**
     * Normalize Backpack order book to unified format
     */
    normalizeOrderBook(backpackOrderBook: BackpackOrderBook, symbol?: string): OrderBook;
    /**
     * Normalize Backpack trade to unified format
     */
    normalizeTrade(backpackTrade: BackpackTrade, symbol?: string): Trade;
    /**
     * Normalize Backpack ticker to unified format
     */
    normalizeTicker(backpackTicker: BackpackTicker): Ticker;
    /**
     * Normalize Backpack funding rate to unified format
     */
    normalizeFundingRate(backpackFunding: BackpackFundingRate): FundingRate;
    /**
     * Normalize Backpack order type to unified format
     */
    private normalizeOrderType;
    /**
     * Normalize Backpack order side to unified format
     */
    private normalizeOrderSide;
    /**
     * Normalize Backpack order status to unified format
     */
    private normalizeOrderStatus;
    /**
     * Normalize Backpack time in force to unified format
     */
    private normalizeTimeInForce;
    /**
     * Count decimal places in a string number
     */
    private countDecimals;
}
//# sourceMappingURL=BackpackNormalizer.d.ts.map
/**
 * Lighter Normalizer
 *
 * Transforms Lighter-specific data structures to unified SDK format
 */
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate } from '../../types/common.js';
import type { LighterOrder, LighterPosition, LighterBalance, LighterOrderBook, LighterTrade, LighterFundingRate } from './types.js';
export declare class LighterNormalizer {
    /**
     * Convert unified symbol to Lighter format
     * BTC/USDC:USDC -> BTC (Lighter uses simple symbol names for perps)
     */
    toLighterSymbol(symbol: string): string;
    /**
     * Convert Lighter symbol to unified format
     * BTC -> BTC/USDC:USDC (Lighter perps use USDC as quote/settle)
     */
    normalizeSymbol(lighterSymbol: string): string;
    /**
     * Normalize Lighter market to unified format
     * Handles real Lighter API response format from /api/v1/orderBookDetails
     */
    normalizeMarket(lighterMarket: any): Market;
    /**
     * Normalize Lighter order to unified format
     */
    normalizeOrder(lighterOrder: LighterOrder): Order;
    /**
     * Normalize Lighter position to unified format
     */
    normalizePosition(lighterPosition: LighterPosition): Position;
    /**
     * Normalize Lighter balance to unified format
     */
    normalizeBalance(lighterBalance: LighterBalance): Balance;
    /**
     * Normalize Lighter order book to unified format
     */
    normalizeOrderBook(lighterOrderBook: LighterOrderBook): OrderBook;
    /**
     * Normalize Lighter trade to unified format
     */
    normalizeTrade(lighterTrade: LighterTrade): Trade;
    /**
     * Normalize Lighter ticker to unified format
     * Handles real API response from /api/v1/orderBookDetails
     */
    normalizeTicker(lighterTicker: any): Ticker;
    /**
     * Normalize Lighter funding rate to unified format
     */
    normalizeFundingRate(lighterFundingRate: LighterFundingRate): FundingRate;
    /**
     * Map Lighter order status to unified status
     */
    private mapOrderStatus;
}
//# sourceMappingURL=LighterNormalizer.d.ts.map
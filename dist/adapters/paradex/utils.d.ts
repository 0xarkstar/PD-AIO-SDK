/**
 * Paradex utility functions for data normalization
 */
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate, OrderSide, OrderType, TimeInForce } from '../../types/common.js';
import type { ParadexMarket, ParadexOrder, ParadexPosition, ParadexBalance, ParadexOrderBook, ParadexTrade, ParadexTicker, ParadexFundingRate } from './types.js';
/**
 * Normalize Paradex symbol to unified format
 *
 * @example
 * normalizeSymbol('BTC-USD-PERP') // 'BTC/USD:USD'
 * normalizeSymbol('ETH-USD-PERP') // 'ETH/USD:USD'
 */
export declare function normalizeSymbol(paradexSymbol: string): string;
/**
 * Convert unified symbol to Paradex format
 *
 * @example
 * toParadexSymbol('BTC/USD:USD') // 'BTC-USD-PERP'
 * toParadexSymbol('ETH/USDC:USDC') // 'ETH-USDC-PERP'
 */
export declare function toParadexSymbol(symbol: string): string;
/**
 * Normalize Paradex market to unified format
 */
export declare function normalizeMarket(paradexMarket: ParadexMarket): Market;
/**
 * Normalize Paradex order to unified format
 */
export declare function normalizeOrder(paradexOrder: ParadexOrder): Order;
/**
 * Normalize Paradex position to unified format
 */
export declare function normalizePosition(paradexPosition: ParadexPosition): Position;
/**
 * Normalize Paradex balance to unified format
 */
export declare function normalizeBalance(paradexBalance: ParadexBalance): Balance;
/**
 * Normalize Paradex order book to unified format
 */
export declare function normalizeOrderBook(paradexOrderBook: ParadexOrderBook): OrderBook;
/**
 * Normalize Paradex trade to unified format
 */
export declare function normalizeTrade(paradexTrade: ParadexTrade): Trade;
/**
 * Normalize Paradex ticker to unified format
 */
export declare function normalizeTicker(paradexTicker: ParadexTicker): Ticker;
/**
 * Normalize Paradex funding rate to unified format
 */
export declare function normalizeFundingRate(paradexFunding: ParadexFundingRate): FundingRate;
/**
 * Convert unified order type to Paradex format
 */
export declare function toParadexOrderType(type: OrderType, postOnly?: boolean): string;
/**
 * Convert unified order side to Paradex format
 */
export declare function toParadexOrderSide(side: OrderSide): string;
/**
 * Convert unified time in force to Paradex format
 */
export declare function toParadexTimeInForce(tif?: TimeInForce, postOnly?: boolean): string;
/**
 * Map Paradex error to unified error code
 */
export declare function mapParadexError(error: unknown): {
    code: string;
    message: string;
};
//# sourceMappingURL=utils.d.ts.map
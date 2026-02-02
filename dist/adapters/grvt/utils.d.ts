/**
 * GRVT utility functions for data normalization
 */
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, OrderSide, OrderType, TimeInForce } from '../../types/common.js';
import type { GRVTMarket, GRVTOrder, GRVTPosition, GRVTBalance, GRVTOrderBook, GRVTTrade, GRVTTicker } from './types.js';
/**
 * Normalize GRVT symbol to unified format
 *
 * @example
 * normalizeSymbol('BTC_USDT_Perp') // 'BTC/USDT:USDT'
 * normalizeSymbol('ETH_USDT_Perp') // 'ETH/USDT:USDT'
 */
export declare function normalizeSymbol(grvtSymbol: string): string;
/**
 * Convert unified symbol to GRVT format
 *
 * @example
 * toGRVTSymbol('BTC/USDT:USDT') // 'BTC_USDT_Perp'
 * toGRVTSymbol('ETH/USDT:USDT') // 'ETH_USDT_Perp'
 */
export declare function toGRVTSymbol(symbol: string): string;
/**
 * Normalize GRVT market to unified format
 */
export declare function normalizeMarket(grvtMarket: GRVTMarket): Market;
/**
 * Normalize GRVT order to unified format
 */
export declare function normalizeOrder(grvtOrder: GRVTOrder): Order;
/**
 * Normalize GRVT position to unified format
 */
export declare function normalizePosition(grvtPosition: GRVTPosition): Position;
/**
 * Normalize GRVT balance to unified format
 */
export declare function normalizeBalance(grvtBalance: GRVTBalance): Balance;
/**
 * Normalize GRVT order book to unified format
 */
export declare function normalizeOrderBook(grvtOrderBook: GRVTOrderBook): OrderBook;
/**
 * Normalize GRVT trade to unified format
 */
export declare function normalizeTrade(grvtTrade: GRVTTrade): Trade;
/**
 * Normalize GRVT ticker to unified format
 */
export declare function normalizeTicker(grvtTicker: GRVTTicker): Ticker;
/**
 * Convert unified order type to GRVT format
 */
export declare function toGRVTOrderType(type: OrderType, postOnly?: boolean): string;
/**
 * Convert unified order side to GRVT format
 */
export declare function toGRVTOrderSide(side: OrderSide): string;
/**
 * Convert unified time in force to GRVT format
 */
export declare function toGRVTTimeInForce(tif?: TimeInForce, postOnly?: boolean): string;
/**
 * Map GRVT error to unified error code
 */
export declare function mapGRVTError(error: unknown): {
    code: string;
    message: string;
};
//# sourceMappingURL=utils.d.ts.map
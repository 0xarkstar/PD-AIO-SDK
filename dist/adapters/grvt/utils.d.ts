/**
 * GRVT utility functions for data normalization (pure, standalone).
 *
 * These mirror the `GRVTNormalizer` methods but as free functions over the REAL
 * GRVT shapes in `types.ts`. Kept for the public adapter surface + ergonomic
 * one-off conversions. GRVT numeric fields are STRINGS on the wire.
 */
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, OrderSide, TimeInForce } from '../../types/common.js';
import type { GRVTMarket, GRVTOrder, GRVTPosition, GRVTSpotBalance, GRVTOrderBook, GRVTTrade, GRVTTicker } from './types.js';
/**
 * Normalize a GRVT instrument string to a unified CCXT symbol.
 *
 * @example
 * normalizeSymbol('BTC_USDT_Perp') // 'BTC/USDT:USDT'
 */
export declare function normalizeSymbol(grvtSymbol: string): string;
/**
 * Convert a unified CCXT symbol to a GRVT instrument string.
 *
 * @example
 * toGRVTSymbol('BTC/USDT:USDT') // 'BTC_USDT_Perp'
 */
export declare function toGRVTSymbol(symbol: string): string;
/**
 * Convert a GRVT unix NANOSECOND timestamp string to epoch milliseconds.
 *
 * GRVT timestamps are ns strings EVERYWHERE on the wire (19 digits — e.g.
 * book/trade/ticker `event_time`, ticker `next_funding_time`, funding
 * `funding_time`, order `create_time`/`update_time`). 19-digit ns exceeds
 * `Number.MAX_SAFE_INTEGER`, so this string-slices the last 6 digits (exact)
 * instead of `parseInt(s)/1e6` (lossy float). Live-verified 2026-06-11.
 */
export declare function nsToMs(value: string): number;
/**
 * Normalize a GRVT instrument into a unified Market (fees are per-fill on GRVT).
 */
export declare function normalizeMarket(grvtMarket: GRVTMarket): Market;
/**
 * Normalize a GRVT account order (leg-based) into a unified Order.
 */
export declare function normalizeOrder(grvtOrder: GRVTOrder): Order;
/**
 * Normalize a GRVT position into a unified Position.
 */
export declare function normalizePosition(grvtPosition: GRVTPosition): Position;
/**
 * Normalize a GRVT spot balance into a unified Balance.
 */
export declare function normalizeBalance(grvtBalance: GRVTSpotBalance): Balance;
/**
 * Normalize a GRVT FULL order-book snapshot into a unified OrderBook.
 */
export declare function normalizeOrderBook(grvtOrderBook: GRVTOrderBook): OrderBook;
/**
 * Normalize a GRVT public trade into a unified Trade.
 */
export declare function normalizeTrade(grvtTrade: GRVTTrade): Trade;
/**
 * Normalize a GRVT ticker into a unified Ticker.
 */
export declare function normalizeTicker(grvtTicker: GRVTTicker): Ticker;
/**
 * Convert a unified order side to the GRVT wire side.
 */
export declare function toGRVTOrderSide(side: OrderSide): string;
/**
 * Convert a unified TimeInForce (+ postOnly) to the GRVT API TIF string.
 * Maker quotes (post_only) require GOOD_TILL_TIME.
 */
export declare function toGRVTTimeInForce(tif?: TimeInForce, postOnly?: boolean): string;
/**
 * Map a GRVT API error code/message to a unified error descriptor.
 */
export declare function mapGRVTError(error: unknown): {
    code: string;
    message: string;
};
//# sourceMappingURL=utils.d.ts.map
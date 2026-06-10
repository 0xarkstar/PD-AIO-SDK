/**
 * GRVT Data Normalizer.
 *
 * Transforms REAL GRVT API response shapes (see `types.ts`) into the SDK's
 * unified types. GRVT numeric fields are STRINGS on the wire; all conversions
 * go through `toNumberSafe`. Fees are per-fill (not per-instrument), so markets
 * carry 0 maker/taker fees here.
 *
 * @see https://api-docs.grvt.io/
 */
import type { Market, Order, Position, Balance, Trade, Ticker, OrderBook, FundingRate } from '../../types/common.js';
import type { GRVTMarket, GRVTOrder, GRVTPosition, GRVTSpotBalance, GRVTFill, GRVTTicker, GRVTOrderBook, GRVTTrade, GRVTFunding } from './types.js';
/**
 * GRVT Data Normalizer.
 *
 * Symbol convention: GRVT instruments are strings like `BTC_USDT_Perp`;
 * unified symbols are CCXT-style `BTC/USDT:USDT`.
 */
export declare class GRVTNormalizer {
    /**
     * Convert a GRVT instrument to a unified CCXT symbol.
     *
     * @example
     * symbolToCCXT('BTC_USDT_Perp') // 'BTC/USDT:USDT'
     * symbolToCCXT('BTC_USDT')      // 'BTC/USDT'
     */
    symbolToCCXT(grvtSymbol: string): string;
    /**
     * Convert a unified CCXT symbol to a GRVT instrument.
     *
     * @example
     * symbolFromCCXT('BTC/USDT:USDT') // 'BTC_USDT_Perp'
     * symbolFromCCXT('BTC/USDT')      // 'BTC_USDT'
     */
    symbolFromCCXT(ccxtSymbol: string): string;
    /**
     * Convert a GRVT string number to a finite number.
     *
     * @throws {PerpDEXError} if the value is not a valid number.
     */
    private toNumberSafe;
    /**
     * Count decimal places in a tick/step string (e.g. '0.5' -> 1, '0.001' -> 3).
     */
    private countDecimals;
    /**
     * Normalize a GRVT instrument into a unified Market. Fees are per-fill on
     * GRVT, so maker/taker are 0 here.
     */
    normalizeMarket(grvtMarket: GRVTMarket): Market;
    /**
     * Batch-normalize markets.
     */
    normalizeMarkets(grvtMarkets: GRVTMarket[]): Market[];
    /**
     * Normalize a GRVT account order (leg-based) into a unified Order.
     */
    normalizeOrder(grvtOrder: GRVTOrder): Order;
    /**
     * Batch-normalize orders.
     */
    normalizeOrders(grvtOrders: GRVTOrder[]): Order[];
    /**
     * Map a GRVT order status to the unified OrderStatus.
     */
    private mapOrderStatus;
    /**
     * Map a GRVT API TIF string to the unified TimeInForce.
     */
    private mapTimeInForce;
    /**
     * Normalize a GRVT position into a unified Position.
     */
    normalizePosition(grvtPosition: GRVTPosition): Position;
    /**
     * Batch-normalize positions.
     */
    normalizePositions(grvtPositions: GRVTPosition[]): Position[];
    /**
     * Normalize a GRVT spot balance into a unified Balance.
     */
    normalizeBalance(grvtBalance: GRVTSpotBalance): Balance;
    /**
     * Batch-normalize balances.
     */
    normalizeBalances(grvtBalances: GRVTSpotBalance[]): Balance[];
    /**
     * Normalize a GRVT public trade into a unified Trade.
     * `is_taker_buyer` true => the aggressor bought (side = 'buy').
     */
    normalizeTrade(grvtTrade: GRVTTrade): Trade;
    /**
     * Batch-normalize public trades.
     */
    normalizeTrades(grvtTrades: GRVTTrade[]): Trade[];
    /**
     * Normalize a GRVT user fill into a unified Trade (with fee).
     */
    normalizeFill(grvtFill: GRVTFill): Trade;
    /**
     * Batch-normalize fills.
     */
    normalizeFills(grvtFills: GRVTFill[]): Trade[];
    /**
     * Normalize a GRVT ticker into a unified Ticker. GRVT has no 24h high/low/open,
     * so those default to the last/mark price; baseVolume uses the 24h quote
     * volumes (buy + sell).
     */
    normalizeTicker(grvtTicker: GRVTTicker): Ticker;
    /**
     * Batch-normalize tickers.
     */
    normalizeTickers(grvtTickers: GRVTTicker[]): Ticker[];
    /**
     * Normalize a GRVT FULL order-book snapshot into a unified OrderBook.
     */
    normalizeOrderBook(grvtOrderBook: GRVTOrderBook): OrderBook;
    /**
     * Normalize a GRVT funding entry into a unified FundingRate.
     */
    normalizeFundingRate(grvtFunding: GRVTFunding): FundingRate;
    normalizeSymbol(exchangeSymbol: string): string;
    toExchangeSymbol(symbol: string): string;
}
//# sourceMappingURL=GRVTNormalizer.d.ts.map
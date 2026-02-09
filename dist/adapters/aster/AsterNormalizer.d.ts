/**
 * Aster Response Normalizer
 */
import type { Balance, FundingRate, Market, OHLCV, Order, OrderBook, Position, Ticker, Trade } from '../../types/common.js';
import type { AsterAccountBalance, AsterKlineResponse, AsterOrderBookResponse, AsterOrderResponse, AsterPositionRisk, AsterPremiumIndex, AsterSymbolInfo, AsterTicker24hr, AsterTradeResponse } from './types.js';
export declare class AsterNormalizer {
    normalizeMarket(info: AsterSymbolInfo): Market;
    normalizeTicker(raw: AsterTicker24hr, symbol?: string): Ticker;
    normalizeOrderBook(raw: AsterOrderBookResponse, symbol: string): OrderBook;
    normalizeTrade(raw: AsterTradeResponse, symbol: string): Trade;
    normalizeFundingRate(raw: AsterPremiumIndex, symbol: string): FundingRate;
    normalizeOHLCV(raw: AsterKlineResponse): OHLCV;
    normalizeOrder(raw: AsterOrderResponse, symbol?: string): Order;
    normalizePosition(raw: AsterPositionRisk, symbol?: string): Position;
    normalizeBalance(raw: AsterAccountBalance): Balance;
}
//# sourceMappingURL=AsterNormalizer.d.ts.map
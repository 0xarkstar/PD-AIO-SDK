/**
 * Pacifica Response Normalizer
 */
import type { Balance, FundingRate, Market, Order, OrderBook, Position, Ticker, Trade } from '../../types/common.js';
import type { PacificaAccountInfo, PacificaFundingHistory, PacificaMarket, PacificaOrderBook as PacificaOrderBookType, PacificaOrderResponse, PacificaPosition as PacificaPositionType, PacificaTicker, PacificaTradeResponse } from './types.js';
export declare class PacificaNormalizer {
    normalizeMarket(raw: PacificaMarket): Market;
    normalizeTicker(raw: PacificaTicker, symbol?: string): Ticker;
    normalizeOrderBook(raw: PacificaOrderBookType, symbol: string): OrderBook;
    normalizeTrade(raw: PacificaTradeResponse, symbol?: string): Trade;
    normalizeFundingRate(raw: PacificaFundingHistory, symbol: string): FundingRate;
    normalizeOrder(raw: PacificaOrderResponse, symbol?: string): Order;
    normalizePosition(raw: PacificaPositionType, symbol?: string): Position;
    normalizeBalance(raw: PacificaAccountInfo): Balance;
    private countDecimals;
}
//# sourceMappingURL=PacificaNormalizer.d.ts.map
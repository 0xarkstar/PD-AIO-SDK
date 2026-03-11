/**
 * Pacifica Response Normalizer
 *
 * Maps real Pacifica API responses to unified types.
 * @see https://docs.pacifica.fi/api-documentation/api/rest-api
 */
import type { Balance, FundingRate, Market, Order, OrderBook, Position, Ticker, Trade } from '../../types/common.js';
import type { PacificaAccountInfo, PacificaFundingHistory, PacificaMarket, PacificaOrderBook as PacificaOrderBookType, PacificaOrderResponse, PacificaPosition as PacificaPositionType, PacificaTicker, PacificaTradeResponse } from './types.js';
export declare class PacificaNormalizer {
    /**
     * Normalize /info market entry.
     * Real fields: symbol, tick_size, lot_size, max_leverage, min_order_size, etc.
     */
    normalizeMarket(raw: PacificaMarket): Market;
    /**
     * Normalize /info/prices entry.
     * Real fields: symbol, mark, mid, oracle, funding, next_funding,
     * open_interest, volume_24h, yesterday_price, timestamp
     */
    normalizeTicker(raw: PacificaTicker, symbol?: string): Ticker;
    normalizeOrderBook(raw: PacificaOrderBookType, symbol: string): OrderBook;
    /**
     * Normalize /trades entry.
     * Real fields: event_type, price, amount, side, cause, created_at
     */
    normalizeTrade(raw: PacificaTradeResponse, symbol?: string, index?: number): Trade;
    /**
     * Normalize /funding_rate/history entry.
     * Real fields: oracle_price, funding_rate, next_funding_rate, created_at
     */
    normalizeFundingRate(raw: PacificaFundingHistory, symbol: string): FundingRate;
    normalizeOrder(raw: PacificaOrderResponse, symbol?: string): Order;
    normalizePosition(raw: PacificaPositionType, symbol?: string): Position;
    normalizeBalance(raw: PacificaAccountInfo): Balance;
    private countDecimals;
    normalizeSymbol(exchangeSymbol: string): string;
    toExchangeSymbol(symbol: string): string;
}
//# sourceMappingURL=PacificaNormalizer.d.ts.map
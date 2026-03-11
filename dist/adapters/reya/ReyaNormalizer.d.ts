/**
 * Reya Data Normalizer
 *
 * Transforms Reya API responses to unified SDK format.
 */
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate, OHLCV } from '../../types/common.js';
import type { ReyaMarketDefinition, ReyaMarketSummary, ReyaOrder, ReyaPosition, ReyaAccountBalance, ReyaDepth, ReyaPerpExecution, ReyaPrice, ReyaCandleHistoryData } from './types.js';
export declare class ReyaNormalizer {
    symbolToCCXT(reyaSymbol: string): string;
    symbolFromCCXT(ccxtSymbol: string): string;
    normalizeMarket(definition: ReyaMarketDefinition, _summary?: ReyaMarketSummary): Market;
    normalizeTicker(summary: ReyaMarketSummary, price?: ReyaPrice): Ticker;
    normalizeOrderBook(depth: ReyaDepth): OrderBook;
    normalizeTrade(execution: ReyaPerpExecution): Trade;
    normalizeOrder(order: ReyaOrder): Order;
    normalizePosition(position: ReyaPosition): Position;
    normalizeBalance(balance: ReyaAccountBalance): Balance;
    normalizeFundingRate(summary: ReyaMarketSummary, markPrice: number): FundingRate;
    normalizeCandles(data: ReyaCandleHistoryData, limit?: number): OHLCV[];
    normalizeSymbol(exchangeSymbol: string): string;
    toExchangeSymbol(symbol: string): string;
}
//# sourceMappingURL=ReyaNormalizer.d.ts.map
/**
 * Ethereal Data Normalizer
 *
 * Transforms Ethereal API responses to unified SDK format.
 */
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate, OHLCV } from '../../types/common.js';
import type { EtherealMarketInfo, EtherealTicker, EtherealOrderBookResponse, EtherealTradeResponse, EtherealOrderResponse, EtherealPositionResponse, EtherealBalanceResponse, EtherealCandleResponse, EtherealFundingRateResponse } from './types.js';
export declare class EtherealNormalizer {
    symbolToCCXT(etherealSymbol: string): string;
    symbolFromCCXT(ccxtSymbol: string): string;
    normalizeMarket(info: EtherealMarketInfo): Market;
    normalizeTicker(raw: EtherealTicker, symbol: string, product?: EtherealMarketInfo): Ticker;
    normalizeOrderBook(raw: EtherealOrderBookResponse, symbol: string): OrderBook;
    normalizeTrade(raw: EtherealTradeResponse, symbol: string): Trade;
    normalizeOrder(raw: EtherealOrderResponse, symbol?: string): Order;
    normalizePosition(raw: EtherealPositionResponse, symbol?: string): Position;
    normalizeBalance(raw: EtherealBalanceResponse): Balance;
    normalizeFundingRate(raw: EtherealFundingRateResponse, symbol: string): FundingRate;
    normalizeCandles(candles: EtherealCandleResponse[]): OHLCV[];
    normalizeSymbol(exchangeSymbol: string): string;
    toExchangeSymbol(symbol: string): string;
}
//# sourceMappingURL=EtherealNormalizer.d.ts.map
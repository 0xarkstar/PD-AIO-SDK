/**
 * Ostium Response Normalizer
 */
import type { Balance, Market, Order, Position, Ticker, Trade } from '../../types/common.js';
import type { OstiumPairInfo, OstiumPriceResponse, OstiumSubgraphTrade, OstiumSubgraphPosition, OstiumOpenTrade } from './types.js';
export declare class OstiumNormalizer {
    normalizeMarket(pair: OstiumPairInfo): Market;
    normalizeTicker(raw: OstiumPriceResponse, pair: OstiumPairInfo): Ticker;
    normalizeTrade(raw: OstiumSubgraphTrade): Trade;
    normalizePosition(raw: OstiumSubgraphPosition, currentPrice?: number): Position;
    normalizeBalance(rawBalance: string, currency?: string): Balance;
    normalizeOrderFromTrade(raw: OstiumOpenTrade): Order;
}
//# sourceMappingURL=OstiumNormalizer.d.ts.map
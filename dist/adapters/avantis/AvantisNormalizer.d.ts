/**
 * Avantis Data Normalizer
 *
 * Transforms on-chain contract data to unified SDK format.
 * No normalizeOrderBook or normalizeTrade (oracle-based, no book/public trades).
 */
import type { Market, Position, Balance, Ticker, FundingRate } from '../../types/common.js';
import type { AvantisPairInfo, AvantisOpenTrade, AvantisBalance, AvantisPythPrice, AvantisFundingFees } from './types.js';
export declare class AvantisNormalizer {
    symbolToCCXT(pairIndex: number): string;
    normalizeMarket(pair: AvantisPairInfo): Market;
    normalizeTicker(pairIndex: number, pythPrice: AvantisPythPrice): Ticker;
    normalizePosition(trade: AvantisOpenTrade, markPrice: number): Position;
    normalizeBalance(balance: AvantisBalance): Balance;
    normalizeFundingRate(pairIndex: number, funding: AvantisFundingFees, markPrice: number): FundingRate;
}
//# sourceMappingURL=AvantisNormalizer.d.ts.map
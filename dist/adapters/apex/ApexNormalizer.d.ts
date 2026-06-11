/**
 * ApeX Omni Response Normalizer
 *
 * Wire-unit rules (all live-verified 2026-06-11):
 * - REST trades / funding timestamps are already epoch MS (passthrough).
 * - Ticker `nextFundingTime` is an ISO-8601 STRING → Date.parse → ms.
 * - WS frame `ts` is MICROSECONDS (16 digits) → usToMs → 13-digit ms.
 * - Funding rates are FRACTIONAL per HOURLY interval (19/19 captured gaps
 *   exactly 1.0h) → passthrough, fundingIntervalHours = 1.
 * - Klines arrive keyed BY SYMBOL: {"BTCUSDT":[...]} → unwrapKlines.
 * - Ticker `data` is an ARRAY of one object (adapter unwraps before calling).
 */
import type { FundingRate, Market, OHLCV, OrderBook, Ticker, Trade } from '../../types/common.js';
import type { ApexDepthData, ApexHistoryFund, ApexKline, ApexKlinesData, ApexPerpetualContract, ApexTicker, ApexTrade, ApexWSTrade } from './types.js';
export declare class ApexNormalizer {
    /** WS frame ts is MICROSECONDS (16 digits) → epoch ms (13 digits) */
    usToMs(microseconds: number): number;
    normalizeMarket(raw: ApexPerpetualContract): Market;
    /**
     * REST /depth data {a,b,s,u}. The schema HARD-REJECTS the silent-empty
     * {a:null,b:null,s:"",u:0} shape produced by a dash-symbol request.
     * /depth carries no timestamp field — ms timestamp is synthesized locally.
     */
    normalizeOrderBook(raw: ApexDepthData, symbol: string): OrderBook;
    /** REST /trades entry {i:uuid,p,S,v,s,T:ms} */
    normalizeTrade(raw: ApexTrade, symbol: string): Trade;
    /** WS recentlyTrade entry {T:ms,s,S,v,p,L,i:uuid} — same units as REST */
    normalizeWSTrade(raw: ApexWSTrade, symbol: string): Trade;
    /**
     * REST /ticker — caller unwraps the one-element data ARRAY first.
     * No bid/ask in the payload (derived from last, tagged in info); no
     * timestamp field (synthesized locally); price24hPcnt is a FRACTION.
     */
    normalizeTicker(raw: ApexTicker, symbol: string): Ticker;
    /**
     * Current funding from the /ticker payload (venue-authoritative source:
     * fundingRate + ISO nextFundingTime + mark/index prices).
     * Rate is FRACTIONAL per HOURLY interval — passthrough, no conversion.
     */
    normalizeFundingRateFromTicker(raw: ApexTicker, symbol: string): FundingRate;
    /**
     * /history-funding entry {symbol,rate,price,fundingTime:ms,fundingTimestamp:ms}.
     * No index price in the history payload — set to the settlement price with
     * an info tag rather than fabricating a value.
     */
    normalizeFundingRateHistoryEntry(raw: ApexHistoryFund, symbol: string): FundingRate;
    /** /klines data is keyed BY SYMBOL — unwrap {"BTCUSDT":[...]} */
    unwrapKlines(data: ApexKlinesData, noDashSymbol: string): ApexKline[];
    /** Kline {s,i,t:ms,o,h,l,c,v,tr} → unified [t,o,h,l,c,v] */
    normalizeOHLCV(raw: ApexKline): OHLCV;
}
//# sourceMappingURL=ApexNormalizer.d.ts.map
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
import { PerpDEXError } from '../../types/errors.js';
import { APEX_DEFAULT_MAKER_FEE, APEX_DEFAULT_TAKER_FEE, APEX_FUNDING_INTERVAL_HOURS, } from './constants.js';
import { parsePrecision, toUnifiedSymbol } from './utils.js';
import { ApexDepthDataSchema, ApexHistoryFundSchema, ApexKlineSchema, ApexPerpetualContractSchema, ApexTickerSchema, ApexTradeSchema, ApexWSTradeSchema, } from './types.js';
export class ApexNormalizer {
    /** WS frame ts is MICROSECONDS (16 digits) → epoch ms (13 digits) */
    usToMs(microseconds) {
        return Math.floor(microseconds / 1000);
    }
    normalizeMarket(raw) {
        const validated = ApexPerpetualContractSchema.parse(raw);
        return {
            // The DASH symbol is the canonical /symbols id; the NO-DASH twin
            // (crossSymbolName) is kept in info for depth/trades/ticker/klines/WS.
            id: validated.symbol,
            symbol: toUnifiedSymbol(validated.baseTokenId, validated.settleAssetId),
            base: validated.baseTokenId,
            quote: validated.settleAssetId,
            settle: validated.settleAssetId,
            active: validated.enableTrade === true && validated.isPrelaunch !== true,
            minAmount: parseFloat(validated.minOrderSize),
            maxAmount: validated.maxOrderSize ? parseFloat(validated.maxOrderSize) : undefined,
            pricePrecision: parsePrecision(validated.tickSize),
            amountPrecision: parsePrecision(validated.stepSize),
            priceTickSize: parseFloat(validated.tickSize),
            amountStepSize: parseFloat(validated.stepSize),
            // Venue-documented defaults — fees are not in the /symbols payload
            makerFee: APEX_DEFAULT_MAKER_FEE,
            takerFee: APEX_DEFAULT_TAKER_FEE,
            maxLeverage: parseFloat(validated.displayMaxLeverage),
            fundingIntervalHours: APEX_FUNDING_INTERVAL_HOURS,
            info: validated,
        };
    }
    /**
     * REST /depth data {a,b,s,u}. The schema HARD-REJECTS the silent-empty
     * {a:null,b:null,s:"",u:0} shape produced by a dash-symbol request.
     * /depth carries no timestamp field — ms timestamp is synthesized locally.
     */
    normalizeOrderBook(raw, symbol) {
        const validated = ApexDepthDataSchema.parse(raw);
        const bids = validated.b
            .map(([p, s]) => [parseFloat(p), parseFloat(s)])
            .sort((a, b) => b[0] - a[0]);
        const asks = validated.a
            .map(([p, s]) => [parseFloat(p), parseFloat(s)])
            .sort((a, b) => a[0] - b[0]);
        return {
            symbol,
            timestamp: Date.now(),
            bids,
            asks,
            sequenceId: validated.u,
            exchange: 'apex',
        };
    }
    /** REST /trades entry {i:uuid,p,S,v,s,T:ms} */
    normalizeTrade(raw, symbol) {
        const validated = ApexTradeSchema.parse(raw);
        const price = parseFloat(validated.p);
        const amount = parseFloat(validated.v);
        return {
            id: validated.i,
            symbol,
            side: validated.S === 'Buy' ? 'buy' : 'sell',
            price,
            amount,
            cost: price * amount,
            timestamp: validated.T,
            info: validated,
        };
    }
    /** WS recentlyTrade entry {T:ms,s,S,v,p,L,i:uuid} — same units as REST */
    normalizeWSTrade(raw, symbol) {
        const validated = ApexWSTradeSchema.parse(raw);
        const price = parseFloat(validated.p);
        const amount = parseFloat(validated.v);
        return {
            id: validated.i,
            symbol,
            side: validated.S === 'Buy' ? 'buy' : 'sell',
            price,
            amount,
            cost: price * amount,
            timestamp: validated.T,
            info: validated,
        };
    }
    /**
     * REST /ticker — caller unwraps the one-element data ARRAY first.
     * No bid/ask in the payload (derived from last, tagged in info); no
     * timestamp field (synthesized locally); price24hPcnt is a FRACTION.
     */
    normalizeTicker(raw, symbol) {
        const validated = ApexTickerSchema.parse(raw);
        const last = parseFloat(validated.lastPrice);
        const pcnt = parseFloat(validated.price24hPcnt);
        const open = pcnt !== -1 ? last / (1 + pcnt) : last;
        return {
            symbol,
            last,
            bid: last,
            ask: last,
            high: parseFloat(validated.highPrice24h),
            low: parseFloat(validated.lowPrice24h),
            open,
            close: last,
            change: last - open,
            percentage: pcnt * 100,
            baseVolume: parseFloat(validated.volume24h),
            quoteVolume: parseFloat(validated.turnover24h),
            timestamp: Date.now(),
            info: {
                ...validated,
                _bidAskSource: 'last_price',
                _timestampSource: 'local',
                _openSource: 'derived_from_price24hPcnt',
            },
        };
    }
    /**
     * Current funding from the /ticker payload (venue-authoritative source:
     * fundingRate + ISO nextFundingTime + mark/index prices).
     * Rate is FRACTIONAL per HOURLY interval — passthrough, no conversion.
     */
    normalizeFundingRateFromTicker(raw, symbol) {
        const validated = ApexTickerSchema.parse(raw);
        const nextFundingTimestamp = Date.parse(validated.nextFundingTime);
        if (Number.isNaN(nextFundingTimestamp)) {
            throw new PerpDEXError(`Invalid nextFundingTime: ${validated.nextFundingTime}`, 'INVALID_RESPONSE', 'apex');
        }
        return {
            symbol,
            fundingRate: parseFloat(validated.fundingRate),
            // Hourly cadence: the current interval opened one interval before next
            fundingTimestamp: nextFundingTimestamp - APEX_FUNDING_INTERVAL_HOURS * 3_600_000,
            nextFundingTimestamp,
            markPrice: parseFloat(validated.markPrice),
            indexPrice: parseFloat(validated.indexPrice),
            fundingIntervalHours: APEX_FUNDING_INTERVAL_HOURS,
            info: validated,
        };
    }
    /**
     * /history-funding entry {symbol,rate,price,fundingTime:ms,fundingTimestamp:ms}.
     * No index price in the history payload — set to the settlement price with
     * an info tag rather than fabricating a value.
     */
    normalizeFundingRateHistoryEntry(raw, symbol) {
        const validated = ApexHistoryFundSchema.parse(raw);
        const price = parseFloat(validated.price);
        return {
            symbol,
            fundingRate: parseFloat(validated.rate),
            fundingTimestamp: validated.fundingTime,
            nextFundingTimestamp: validated.fundingTime + APEX_FUNDING_INTERVAL_HOURS * 3_600_000,
            markPrice: price,
            indexPrice: price,
            fundingIntervalHours: APEX_FUNDING_INTERVAL_HOURS,
            info: {
                ...validated,
                _indexPriceSource: 'settlement_price',
            },
        };
    }
    /** /klines data is keyed BY SYMBOL — unwrap {"BTCUSDT":[...]} */
    unwrapKlines(data, noDashSymbol) {
        const klines = data?.[noDashSymbol];
        if (!Array.isArray(klines)) {
            throw new PerpDEXError(`Klines response missing symbol key: ${noDashSymbol}`, 'INVALID_RESPONSE', 'apex');
        }
        return klines;
    }
    /** Kline {s,i,t:ms,o,h,l,c,v,tr} → unified [t,o,h,l,c,v] */
    normalizeOHLCV(raw) {
        const validated = ApexKlineSchema.parse(raw);
        return [
            validated.t,
            parseFloat(validated.o),
            parseFloat(validated.h),
            parseFloat(validated.l),
            parseFloat(validated.c),
            parseFloat(validated.v),
        ];
    }
}
//# sourceMappingURL=ApexNormalizer.js.map
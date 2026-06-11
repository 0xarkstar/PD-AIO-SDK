/**
 * ApeX Omni Exchange-Specific Types
 *
 * Zod schemas validate RAW wire payloads (byte-captured 2026-06-11).
 * Envelope: success {data, timeCost} / error {code, msg, timeCost}.
 */
import { z } from 'zod';
import type { ExchangeConfig } from '../../types/adapter.js';
export interface ApexConfig extends ExchangeConfig {
    testnet?: boolean;
    timeout?: number;
}
/** Error envelope — arrives with HTTP 200 (e.g. {code:3,msg:"..."} for a bad symbol) */
export declare const ApexErrorEnvelopeSchema: z.ZodObject<{
    code: z.ZodNumber;
    msg: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    code: z.ZodNumber;
    msg: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    code: z.ZodNumber;
    msg: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type ApexErrorEnvelope = z.infer<typeof ApexErrorEnvelopeSchema>;
/** Generic success envelope */
export interface ApexEnvelope<T> {
    data: T;
    timeCost?: number;
}
/**
 * /v3/depth data: {a:[[px,sz]], b:[[px,sz]], s, u}
 *
 * HARD-REJECTS the silent-empty trap: /depth queried with the DASH symbol
 * form returns HTTP 200 {"data":{"a":null,"b":null,"s":"","u":0}} — a:null /
 * b:null / s:"" must NEVER normalize into an empty book.
 */
export declare const ApexDepthDataSchema: z.ZodObject<{
    a: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    b: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    s: z.ZodString;
    u: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    a: [string, string][];
    b: [string, string][];
    s: string;
    u: number;
}, {
    a: [string, string][];
    b: [string, string][];
    s: string;
    u: number;
}>;
export type ApexDepthData = z.infer<typeof ApexDepthDataSchema>;
/** /v3/trades data entry: {i:uuid, p, S:"Buy"|"Sell", v, s, T:ms} */
export declare const ApexTradeSchema: z.ZodObject<{
    i: z.ZodString;
    p: z.ZodString;
    S: z.ZodEnum<["Buy", "Sell"]>;
    v: z.ZodString;
    s: z.ZodString;
    T: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    i: z.ZodString;
    p: z.ZodString;
    S: z.ZodEnum<["Buy", "Sell"]>;
    v: z.ZodString;
    s: z.ZodString;
    T: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    i: z.ZodString;
    p: z.ZodString;
    S: z.ZodEnum<["Buy", "Sell"]>;
    v: z.ZodString;
    s: z.ZodString;
    T: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export type ApexTrade = z.infer<typeof ApexTradeSchema>;
/**
 * /v3/ticker data is an ARRAY of one object.
 * nextFundingTime is an ISO-8601 STRING (not epoch); price24hPcnt is a
 * FRACTION; openInterest is base units (the only public OI source);
 * oraclePrice/tradeCount captured as empty strings.
 */
export declare const ApexTickerSchema: z.ZodObject<{
    symbol: z.ZodString;
    fundingRate: z.ZodString;
    predictedFundingRate: z.ZodString;
    nextFundingTime: z.ZodString;
    indexPrice: z.ZodString;
    markPrice: z.ZodString;
    openInterest: z.ZodString;
    lastPrice: z.ZodString;
    highPrice24h: z.ZodString;
    lowPrice24h: z.ZodString;
    price24hPcnt: z.ZodString;
    turnover24h: z.ZodString;
    volume24h: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    fundingRate: z.ZodString;
    predictedFundingRate: z.ZodString;
    nextFundingTime: z.ZodString;
    indexPrice: z.ZodString;
    markPrice: z.ZodString;
    openInterest: z.ZodString;
    lastPrice: z.ZodString;
    highPrice24h: z.ZodString;
    lowPrice24h: z.ZodString;
    price24hPcnt: z.ZodString;
    turnover24h: z.ZodString;
    volume24h: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    fundingRate: z.ZodString;
    predictedFundingRate: z.ZodString;
    nextFundingTime: z.ZodString;
    indexPrice: z.ZodString;
    markPrice: z.ZodString;
    openInterest: z.ZodString;
    lastPrice: z.ZodString;
    highPrice24h: z.ZodString;
    lowPrice24h: z.ZodString;
    price24hPcnt: z.ZodString;
    turnover24h: z.ZodString;
    volume24h: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type ApexTicker = z.infer<typeof ApexTickerSchema>;
/** /v3/history-funding entry — DASH symbol; FRACTIONAL hourly rate; ms timestamps */
export declare const ApexHistoryFundSchema: z.ZodObject<{
    symbol: z.ZodString;
    rate: z.ZodString;
    price: z.ZodString;
    fundingTime: z.ZodNumber;
    fundingTimestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    rate: z.ZodString;
    price: z.ZodString;
    fundingTime: z.ZodNumber;
    fundingTimestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    rate: z.ZodString;
    price: z.ZodString;
    fundingTime: z.ZodNumber;
    fundingTimestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export type ApexHistoryFund = z.infer<typeof ApexHistoryFundSchema>;
export declare const ApexHistoryFundingDataSchema: z.ZodObject<{
    historyFunds: z.ZodArray<z.ZodObject<{
        symbol: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        fundingTime: z.ZodNumber;
        fundingTimestamp: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        symbol: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        fundingTime: z.ZodNumber;
        fundingTimestamp: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        symbol: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        fundingTime: z.ZodNumber;
        fundingTimestamp: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    totalSize: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    historyFunds: z.ZodArray<z.ZodObject<{
        symbol: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        fundingTime: z.ZodNumber;
        fundingTimestamp: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        symbol: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        fundingTime: z.ZodNumber;
        fundingTimestamp: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        symbol: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        fundingTime: z.ZodNumber;
        fundingTimestamp: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    totalSize: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    historyFunds: z.ZodArray<z.ZodObject<{
        symbol: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        fundingTime: z.ZodNumber;
        fundingTimestamp: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        symbol: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        fundingTime: z.ZodNumber;
        fundingTimestamp: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        symbol: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        fundingTime: z.ZodNumber;
        fundingTimestamp: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    totalSize: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export type ApexHistoryFundingData = z.infer<typeof ApexHistoryFundingDataSchema>;
/** /v3/klines record entry: {s, i, t:ms, o, h, l, c, v, tr} */
export declare const ApexKlineSchema: z.ZodObject<{
    s: z.ZodString;
    i: z.ZodString;
    t: z.ZodNumber;
    o: z.ZodString;
    h: z.ZodString;
    l: z.ZodString;
    c: z.ZodString;
    v: z.ZodString;
    tr: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    s: z.ZodString;
    i: z.ZodString;
    t: z.ZodNumber;
    o: z.ZodString;
    h: z.ZodString;
    l: z.ZodString;
    c: z.ZodString;
    v: z.ZodString;
    tr: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    s: z.ZodString;
    i: z.ZodString;
    t: z.ZodNumber;
    o: z.ZodString;
    h: z.ZodString;
    l: z.ZodString;
    c: z.ZodString;
    v: z.ZodString;
    tr: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type ApexKline = z.infer<typeof ApexKlineSchema>;
/** /v3/klines data is keyed BY SYMBOL: {"BTCUSDT":[kline,...]} */
export declare const ApexKlinesDataSchema: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
    s: z.ZodString;
    i: z.ZodString;
    t: z.ZodNumber;
    o: z.ZodString;
    h: z.ZodString;
    l: z.ZodString;
    c: z.ZodString;
    v: z.ZodString;
    tr: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    s: z.ZodString;
    i: z.ZodString;
    t: z.ZodNumber;
    o: z.ZodString;
    h: z.ZodString;
    l: z.ZodString;
    c: z.ZodString;
    v: z.ZodString;
    tr: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    s: z.ZodString;
    i: z.ZodString;
    t: z.ZodNumber;
    o: z.ZodString;
    h: z.ZodString;
    l: z.ZodString;
    c: z.ZodString;
    v: z.ZodString;
    tr: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, "many">>;
export type ApexKlinesData = z.infer<typeof ApexKlinesDataSchema>;
/**
 * /v3/symbols → data.contractConfig.perpetualContract[] entry (subset used).
 * `symbol` is the DASH form ("BTC-USDT"); `crossSymbolName` the NO-DASH form.
 * The payload also carries spotConfig / predictionContract / stockContract /
 * prelaunchContract — callers MUST filter to perpetualContract and respect
 * enableTrade / isPrelaunch.
 */
export declare const ApexPerpetualContractSchema: z.ZodObject<{
    symbol: z.ZodString;
    crossSymbolName: z.ZodString;
    settleAssetId: z.ZodString;
    baseTokenId: z.ZodString;
    tickSize: z.ZodString;
    stepSize: z.ZodString;
    minOrderSize: z.ZodString;
    maxOrderSize: z.ZodOptional<z.ZodString>;
    maxPositionSize: z.ZodOptional<z.ZodString>;
    displayMaxLeverage: z.ZodString;
    enableTrade: z.ZodBoolean;
    isPrelaunch: z.ZodOptional<z.ZodBoolean>;
    enableDisplay: z.ZodOptional<z.ZodBoolean>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    crossSymbolName: z.ZodString;
    settleAssetId: z.ZodString;
    baseTokenId: z.ZodString;
    tickSize: z.ZodString;
    stepSize: z.ZodString;
    minOrderSize: z.ZodString;
    maxOrderSize: z.ZodOptional<z.ZodString>;
    maxPositionSize: z.ZodOptional<z.ZodString>;
    displayMaxLeverage: z.ZodString;
    enableTrade: z.ZodBoolean;
    isPrelaunch: z.ZodOptional<z.ZodBoolean>;
    enableDisplay: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    crossSymbolName: z.ZodString;
    settleAssetId: z.ZodString;
    baseTokenId: z.ZodString;
    tickSize: z.ZodString;
    stepSize: z.ZodString;
    minOrderSize: z.ZodString;
    maxOrderSize: z.ZodOptional<z.ZodString>;
    maxPositionSize: z.ZodOptional<z.ZodString>;
    displayMaxLeverage: z.ZodString;
    enableTrade: z.ZodBoolean;
    isPrelaunch: z.ZodOptional<z.ZodBoolean>;
    enableDisplay: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">>;
export type ApexPerpetualContract = z.infer<typeof ApexPerpetualContractSchema>;
/** /v3/symbols full response data (subset) */
export interface ApexSymbolsData {
    contractConfig: {
        perpetualContract: ApexPerpetualContract[];
        [key: string]: unknown;
    };
    [key: string]: unknown;
}
/**
 * Orderbook frame: first `type:"snapshot"` (full book), then `type:"delta"`
 * (~138ms cadence). Size "0" deletes a level. `u` is strictly +1 continuous;
 * a snapshot RESETS u — on a u-gap the client must resubscribe/resync.
 * Frame `ts` is in MICROSECONDS (16 digits).
 */
export declare const ApexWSOrderBookFrameSchema: z.ZodObject<{
    topic: z.ZodString;
    type: z.ZodEnum<["snapshot", "delta"]>;
    data: z.ZodObject<{
        s: z.ZodString;
        b: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
        a: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
        u: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        a: [string, string][];
        b: [string, string][];
        s: string;
        u: number;
    }, {
        a: [string, string][];
        b: [string, string][];
        s: string;
        u: number;
    }>;
    cs: z.ZodOptional<z.ZodNumber>;
    ts: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    topic: z.ZodString;
    type: z.ZodEnum<["snapshot", "delta"]>;
    data: z.ZodObject<{
        s: z.ZodString;
        b: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
        a: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
        u: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        a: [string, string][];
        b: [string, string][];
        s: string;
        u: number;
    }, {
        a: [string, string][];
        b: [string, string][];
        s: string;
        u: number;
    }>;
    cs: z.ZodOptional<z.ZodNumber>;
    ts: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    topic: z.ZodString;
    type: z.ZodEnum<["snapshot", "delta"]>;
    data: z.ZodObject<{
        s: z.ZodString;
        b: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
        a: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
        u: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        a: [string, string][];
        b: [string, string][];
        s: string;
        u: number;
    }, {
        a: [string, string][];
        b: [string, string][];
        s: string;
        u: number;
    }>;
    cs: z.ZodOptional<z.ZodNumber>;
    ts: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export type ApexWSOrderBookFrame = z.infer<typeof ApexWSOrderBookFrameSchema>;
/** WS trade entry: {T:ms, s, S, v, p, L:tickDirection, i:uuid} */
export declare const ApexWSTradeSchema: z.ZodObject<{
    T: z.ZodNumber;
    s: z.ZodString;
    S: z.ZodEnum<["Buy", "Sell"]>;
    v: z.ZodString;
    p: z.ZodString;
    L: z.ZodString;
    i: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    T: z.ZodNumber;
    s: z.ZodString;
    S: z.ZodEnum<["Buy", "Sell"]>;
    v: z.ZodString;
    p: z.ZodString;
    L: z.ZodString;
    i: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    T: z.ZodNumber;
    s: z.ZodString;
    S: z.ZodEnum<["Buy", "Sell"]>;
    v: z.ZodString;
    p: z.ZodString;
    L: z.ZodString;
    i: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type ApexWSTrade = z.infer<typeof ApexWSTradeSchema>;
/**
 * Trades frame: first `type:"snapshot"` = recent-history array (dedupe by
 * uuid `i`), then `type:"delta"` arrays of live trades.
 */
export declare const ApexWSTradesFrameSchema: z.ZodObject<{
    topic: z.ZodString;
    type: z.ZodEnum<["snapshot", "delta"]>;
    data: z.ZodArray<z.ZodObject<{
        T: z.ZodNumber;
        s: z.ZodString;
        S: z.ZodEnum<["Buy", "Sell"]>;
        v: z.ZodString;
        p: z.ZodString;
        L: z.ZodString;
        i: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        T: z.ZodNumber;
        s: z.ZodString;
        S: z.ZodEnum<["Buy", "Sell"]>;
        v: z.ZodString;
        p: z.ZodString;
        L: z.ZodString;
        i: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        T: z.ZodNumber;
        s: z.ZodString;
        S: z.ZodEnum<["Buy", "Sell"]>;
        v: z.ZodString;
        p: z.ZodString;
        L: z.ZodString;
        i: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    cs: z.ZodOptional<z.ZodNumber>;
    ts: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    topic: z.ZodString;
    type: z.ZodEnum<["snapshot", "delta"]>;
    data: z.ZodArray<z.ZodObject<{
        T: z.ZodNumber;
        s: z.ZodString;
        S: z.ZodEnum<["Buy", "Sell"]>;
        v: z.ZodString;
        p: z.ZodString;
        L: z.ZodString;
        i: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        T: z.ZodNumber;
        s: z.ZodString;
        S: z.ZodEnum<["Buy", "Sell"]>;
        v: z.ZodString;
        p: z.ZodString;
        L: z.ZodString;
        i: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        T: z.ZodNumber;
        s: z.ZodString;
        S: z.ZodEnum<["Buy", "Sell"]>;
        v: z.ZodString;
        p: z.ZodString;
        L: z.ZodString;
        i: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    cs: z.ZodOptional<z.ZodNumber>;
    ts: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    topic: z.ZodString;
    type: z.ZodEnum<["snapshot", "delta"]>;
    data: z.ZodArray<z.ZodObject<{
        T: z.ZodNumber;
        s: z.ZodString;
        S: z.ZodEnum<["Buy", "Sell"]>;
        v: z.ZodString;
        p: z.ZodString;
        L: z.ZodString;
        i: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        T: z.ZodNumber;
        s: z.ZodString;
        S: z.ZodEnum<["Buy", "Sell"]>;
        v: z.ZodString;
        p: z.ZodString;
        L: z.ZodString;
        i: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        T: z.ZodNumber;
        s: z.ZodString;
        S: z.ZodEnum<["Buy", "Sell"]>;
        v: z.ZodString;
        p: z.ZodString;
        L: z.ZodString;
        i: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    cs: z.ZodOptional<z.ZodNumber>;
    ts: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export type ApexWSTradesFrame = z.infer<typeof ApexWSTradesFrameSchema>;
/** Subscribe/ping ack: {success, ret_msg, conn_id, request} */
export declare const ApexWSAckSchema: z.ZodObject<{
    success: z.ZodBoolean;
    ret_msg: z.ZodOptional<z.ZodString>;
    conn_id: z.ZodOptional<z.ZodString>;
    request: z.ZodOptional<z.ZodUnknown>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    success: z.ZodBoolean;
    ret_msg: z.ZodOptional<z.ZodString>;
    conn_id: z.ZodOptional<z.ZodString>;
    request: z.ZodOptional<z.ZodUnknown>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    success: z.ZodBoolean;
    ret_msg: z.ZodOptional<z.ZodString>;
    conn_id: z.ZodOptional<z.ZodString>;
    request: z.ZodOptional<z.ZodUnknown>;
}, z.ZodTypeAny, "passthrough">>;
export type ApexWSAck = z.infer<typeof ApexWSAckSchema>;
//# sourceMappingURL=types.d.ts.map
/**
 * ApeX Omni Exchange-Specific Types
 *
 * Zod schemas validate RAW wire payloads (byte-captured 2026-06-11).
 * Envelope: success {data, timeCost} / error {code, msg, timeCost}.
 */
import { z } from 'zod';
// =============================================================================
// Envelopes
// =============================================================================
/** Error envelope — arrives with HTTP 200 (e.g. {code:3,msg:"..."} for a bad symbol) */
export const ApexErrorEnvelopeSchema = z
    .object({
    code: z.number(),
    msg: z.string(),
})
    .passthrough();
// =============================================================================
// REST shapes
// =============================================================================
const ApexPriceLevelSchema = z.tuple([z.string(), z.string()]);
/**
 * /v3/depth data: {a:[[px,sz]], b:[[px,sz]], s, u}
 *
 * HARD-REJECTS the silent-empty trap: /depth queried with the DASH symbol
 * form returns HTTP 200 {"data":{"a":null,"b":null,"s":"","u":0}} — a:null /
 * b:null / s:"" must NEVER normalize into an empty book.
 */
export const ApexDepthDataSchema = z.object({
    a: z.array(ApexPriceLevelSchema),
    b: z.array(ApexPriceLevelSchema),
    s: z.string().min(1),
    u: z.number(),
});
/** /v3/trades data entry: {i:uuid, p, S:"Buy"|"Sell", v, s, T:ms} */
export const ApexTradeSchema = z
    .object({
    i: z.string(),
    p: z.string(),
    S: z.enum(['Buy', 'Sell']),
    v: z.string(),
    s: z.string(),
    T: z.number(),
})
    .passthrough();
/**
 * /v3/ticker data is an ARRAY of one object.
 * nextFundingTime is an ISO-8601 STRING (not epoch); price24hPcnt is a
 * FRACTION; openInterest is base units (the only public OI source);
 * oraclePrice/tradeCount captured as empty strings.
 */
export const ApexTickerSchema = z
    .object({
    symbol: z.string(),
    fundingRate: z.string(),
    predictedFundingRate: z.string(),
    nextFundingTime: z.string(),
    indexPrice: z.string(),
    markPrice: z.string(),
    openInterest: z.string(),
    lastPrice: z.string(),
    highPrice24h: z.string(),
    lowPrice24h: z.string(),
    price24hPcnt: z.string(),
    turnover24h: z.string(),
    volume24h: z.string(),
})
    .passthrough();
/** /v3/history-funding entry — DASH symbol; FRACTIONAL hourly rate; ms timestamps */
export const ApexHistoryFundSchema = z
    .object({
    symbol: z.string(),
    rate: z.string(),
    price: z.string(),
    fundingTime: z.number(),
    fundingTimestamp: z.number(),
})
    .passthrough();
export const ApexHistoryFundingDataSchema = z
    .object({
    historyFunds: z.array(ApexHistoryFundSchema),
    totalSize: z.number(),
})
    .passthrough();
/** /v3/klines record entry: {s, i, t:ms, o, h, l, c, v, tr} */
export const ApexKlineSchema = z
    .object({
    s: z.string(),
    i: z.string(),
    t: z.number(),
    o: z.string(),
    h: z.string(),
    l: z.string(),
    c: z.string(),
    v: z.string(),
    tr: z.string(),
})
    .passthrough();
/** /v3/klines data is keyed BY SYMBOL: {"BTCUSDT":[kline,...]} */
export const ApexKlinesDataSchema = z.record(z.array(ApexKlineSchema));
/**
 * /v3/symbols → data.contractConfig.perpetualContract[] entry (subset used).
 * `symbol` is the DASH form ("BTC-USDT"); `crossSymbolName` the NO-DASH form.
 * The payload also carries spotConfig / predictionContract / stockContract /
 * prelaunchContract — callers MUST filter to perpetualContract and respect
 * enableTrade / isPrelaunch.
 */
export const ApexPerpetualContractSchema = z
    .object({
    symbol: z.string(),
    crossSymbolName: z.string(),
    settleAssetId: z.string(),
    baseTokenId: z.string(),
    tickSize: z.string(),
    stepSize: z.string(),
    minOrderSize: z.string(),
    maxOrderSize: z.string().optional(),
    maxPositionSize: z.string().optional(),
    displayMaxLeverage: z.string(),
    enableTrade: z.boolean(),
    isPrelaunch: z.boolean().optional(),
    enableDisplay: z.boolean().optional(),
})
    .passthrough();
// =============================================================================
// WS shapes (wss://quote.omni.apex.exchange/realtime_public?v=2&timestamp=<ms>)
// =============================================================================
/**
 * Orderbook frame: first `type:"snapshot"` (full book), then `type:"delta"`
 * (~138ms cadence). Size "0" deletes a level. `u` is strictly +1 continuous;
 * a snapshot RESETS u — on a u-gap the client must resubscribe/resync.
 * Frame `ts` is in MICROSECONDS (16 digits).
 */
export const ApexWSOrderBookFrameSchema = z
    .object({
    topic: z.string(),
    type: z.enum(['snapshot', 'delta']),
    data: z.object({
        s: z.string(),
        b: z.array(ApexPriceLevelSchema),
        a: z.array(ApexPriceLevelSchema),
        u: z.number(),
    }),
    cs: z.number().optional(),
    ts: z.number(),
})
    .passthrough();
/** WS trade entry: {T:ms, s, S, v, p, L:tickDirection, i:uuid} */
export const ApexWSTradeSchema = z
    .object({
    T: z.number(),
    s: z.string(),
    S: z.enum(['Buy', 'Sell']),
    v: z.string(),
    p: z.string(),
    L: z.string(),
    i: z.string(),
})
    .passthrough();
/**
 * Trades frame: first `type:"snapshot"` = recent-history array (dedupe by
 * uuid `i`), then `type:"delta"` arrays of live trades.
 */
export const ApexWSTradesFrameSchema = z
    .object({
    topic: z.string(),
    type: z.enum(['snapshot', 'delta']),
    data: z.array(ApexWSTradeSchema),
    cs: z.number().optional(),
    ts: z.number(),
})
    .passthrough();
/** Subscribe/ping ack: {success, ret_msg, conn_id, request} */
export const ApexWSAckSchema = z
    .object({
    success: z.boolean(),
    ret_msg: z.string().optional(),
    conn_id: z.string().optional(),
    request: z.unknown().optional(),
})
    .passthrough();
//# sourceMappingURL=types.js.map
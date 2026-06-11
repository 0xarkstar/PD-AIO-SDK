/**
 * StandX Exchange-Specific Types
 *
 * Zod schemas validate RAW wire payloads (byte-captured 2026-06-11, keyless).
 * REST responses are BARE payloads (no {data} envelope); errors are JSON
 * {code,message} delivered with real HTTP statuses (401/429/…).
 *
 * Wire-type landmines encoded below:
 * - Depth level ordering is NOT guaranteed (venue-documented) — schemas
 *   accept unsorted levels; SORTING is the normalizer's job.
 * - query_symbol_market mixes STRING prices with NUMBER 24h stats.
 * - REST trades carry is_buyer_taker (NO side, NO id); WS trades carry side
 *   (NO is_buyer_taker) and an integer id.
 * - Timestamps: REST/price-channel `time` is ISO-8601 (up to ns precision);
 *   WS depth_book/public_trade `time` is epoch ms int.
 */
import { z } from 'zod';
import type { ExchangeConfig } from '../../types/adapter.js';
export interface StandxConfig extends ExchangeConfig {
    timeout?: number;
}
/** Error body — e.g. keyless /api/health → 401 {"code":401,"message":"missing jwt"} */
export declare const StandxErrorSchema: z.ZodObject<{
    code: z.ZodNumber;
    message: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    code: z.ZodNumber;
    message: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    code: z.ZodNumber;
    message: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type StandxError = z.infer<typeof StandxErrorSchema>;
/**
 * query_depth_book AND the WS depth_book frame `data` — SAME live-verified
 * shape: {asks,bids,last_price,mark_price,symbol,time:ms}. Level ordering is
 * NOT guaranteed (documented) — accepted unsorted here, sorted downstream.
 * `time` is optional (the docs example omits it; every live capture has it).
 */
export declare const StandxDepthBookSchema: z.ZodObject<{
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    symbol: z.ZodString;
    time: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    symbol: z.ZodString;
    time: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    symbol: z.ZodString;
    time: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export type StandxDepthBook = z.infer<typeof StandxDepthBookSchema>;
/** query_recent_trades entry — is_buyer_taker (NO side/id), ISO time */
export declare const StandxRestTradeSchema: z.ZodObject<{
    is_buyer_taker: z.ZodBoolean;
    price: z.ZodString;
    qty: z.ZodString;
    quote_qty: z.ZodString;
    symbol: z.ZodString;
    time: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    is_buyer_taker: z.ZodBoolean;
    price: z.ZodString;
    qty: z.ZodString;
    quote_qty: z.ZodString;
    symbol: z.ZodString;
    time: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    is_buyer_taker: z.ZodBoolean;
    price: z.ZodString;
    qty: z.ZodString;
    quote_qty: z.ZodString;
    symbol: z.ZodString;
    time: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type StandxRestTrade = z.infer<typeof StandxRestTradeSchema>;
/**
 * query_symbol_market — ticker + current-funding source.
 * Mixed wire types: prices are STRINGS, 24h stats are NUMBERS,
 * next_funding_time/time are ISO-8601 strings, spread is [bid, ask].
 */
export declare const StandxSymbolMarketSchema: z.ZodObject<{
    ask1: z.ZodString;
    bid1: z.ZodString;
    base: z.ZodString;
    quote: z.ZodString;
    funding_rate: z.ZodString;
    high_price_24h: z.ZodNumber;
    low_price_24h: z.ZodNumber;
    open_price_24h: z.ZodNumber;
    price_change: z.ZodNumber;
    price_change_pct: z.ZodNumber;
    index_price: z.ZodString;
    last_price: z.ZodString;
    mark_price: z.ZodString;
    next_funding_time: z.ZodString;
    spread: z.ZodTuple<[z.ZodString, z.ZodString], null>;
    symbol: z.ZodString;
    time: z.ZodString;
    volume_24h: z.ZodNumber;
    volume_quote_24h: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    ask1: z.ZodString;
    bid1: z.ZodString;
    base: z.ZodString;
    quote: z.ZodString;
    funding_rate: z.ZodString;
    high_price_24h: z.ZodNumber;
    low_price_24h: z.ZodNumber;
    open_price_24h: z.ZodNumber;
    price_change: z.ZodNumber;
    price_change_pct: z.ZodNumber;
    index_price: z.ZodString;
    last_price: z.ZodString;
    mark_price: z.ZodString;
    next_funding_time: z.ZodString;
    spread: z.ZodTuple<[z.ZodString, z.ZodString], null>;
    symbol: z.ZodString;
    time: z.ZodString;
    volume_24h: z.ZodNumber;
    volume_quote_24h: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    ask1: z.ZodString;
    bid1: z.ZodString;
    base: z.ZodString;
    quote: z.ZodString;
    funding_rate: z.ZodString;
    high_price_24h: z.ZodNumber;
    low_price_24h: z.ZodNumber;
    open_price_24h: z.ZodNumber;
    price_change: z.ZodNumber;
    price_change_pct: z.ZodNumber;
    index_price: z.ZodString;
    last_price: z.ZodString;
    mark_price: z.ZodString;
    next_funding_time: z.ZodString;
    spread: z.ZodTuple<[z.ZodString, z.ZodString], null>;
    symbol: z.ZodString;
    time: z.ZodString;
    volume_24h: z.ZodNumber;
    volume_quote_24h: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export type StandxSymbolMarket = z.infer<typeof StandxSymbolMarketSchema>;
/**
 * query_funding_rates entry — FRACTIONAL rate (0.0000125), HOURLY cadence,
 * ISO time. NO conversion needed (unlike grvt's percent-unit trap).
 */
export declare const StandxFundingEntrySchema: z.ZodObject<{
    funding_rate: z.ZodString;
    index_price: z.ZodString;
    mark_price: z.ZodString;
    symbol: z.ZodString;
    time: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    funding_rate: z.ZodString;
    index_price: z.ZodString;
    mark_price: z.ZodString;
    symbol: z.ZodString;
    time: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    funding_rate: z.ZodString;
    index_price: z.ZodString;
    mark_price: z.ZodString;
    symbol: z.ZodString;
    time: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type StandxFundingEntry = z.infer<typeof StandxFundingEntrySchema>;
/**
 * query_symbol_info entry — fees/ticks/leverage/decimals + status.
 * Precision arrives as DECIMAL COUNTS (price_tick_decimals=2 → tick 0.01).
 * Keyless; querying WITHOUT a symbol param returns ALL symbols (live-verified
 * 2026-06-11 — the docs mark symbol required, but the no-param form works).
 */
export declare const StandxSymbolInfoSchema: z.ZodObject<{
    base_asset: z.ZodString;
    quote_asset: z.ZodString;
    maker_fee: z.ZodString;
    taker_fee: z.ZodString;
    max_leverage: z.ZodString;
    min_order_qty: z.ZodString;
    max_order_qty: z.ZodString;
    price_tick_decimals: z.ZodNumber;
    qty_tick_decimals: z.ZodNumber;
    status: z.ZodString;
    symbol: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    base_asset: z.ZodString;
    quote_asset: z.ZodString;
    maker_fee: z.ZodString;
    taker_fee: z.ZodString;
    max_leverage: z.ZodString;
    min_order_qty: z.ZodString;
    max_order_qty: z.ZodString;
    price_tick_decimals: z.ZodNumber;
    qty_tick_decimals: z.ZodNumber;
    status: z.ZodString;
    symbol: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    base_asset: z.ZodString;
    quote_asset: z.ZodString;
    maker_fee: z.ZodString;
    taker_fee: z.ZodString;
    max_leverage: z.ZodString;
    min_order_qty: z.ZodString;
    max_order_qty: z.ZodString;
    price_tick_decimals: z.ZodNumber;
    qty_tick_decimals: z.ZodNumber;
    status: z.ZodString;
    symbol: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type StandxSymbolInfo = z.infer<typeof StandxSymbolInfoSchema>;
/**
 * query_market_overview — the markets list (= symbol DISCOVERY source; live
 * has 10 symbols while the docs reference page is stale at 4 — NEVER
 * hardcode symbols from docs).
 */
export declare const StandxMarketOverviewSchema: z.ZodObject<{
    summary: z.ZodObject<{
        symbol_count: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        symbol_count: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        symbol_count: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>;
    symbols: z.ZodArray<z.ZodObject<{
        base: z.ZodString;
        quote: z.ZodString;
        symbol: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        base: z.ZodString;
        quote: z.ZodString;
        symbol: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        base: z.ZodString;
        quote: z.ZodString;
        symbol: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    summary: z.ZodObject<{
        symbol_count: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        symbol_count: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        symbol_count: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>;
    symbols: z.ZodArray<z.ZodObject<{
        base: z.ZodString;
        quote: z.ZodString;
        symbol: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        base: z.ZodString;
        quote: z.ZodString;
        symbol: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        base: z.ZodString;
        quote: z.ZodString;
        symbol: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    summary: z.ZodObject<{
        symbol_count: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        symbol_count: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        symbol_count: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>;
    symbols: z.ZodArray<z.ZodObject<{
        base: z.ZodString;
        quote: z.ZodString;
        symbol: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        base: z.ZodString;
        quote: z.ZodString;
        symbol: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        base: z.ZodString;
        quote: z.ZodString;
        symbol: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">>;
export type StandxMarketOverview = z.infer<typeof StandxMarketOverviewSchema>;
/**
 * kline/history — TradingView-UDF column arrays: {s,t,o,h,l,c,v}.
 * `t` is unix SECONDS. s:"ok" carries data; s:"no_data" carries none;
 * anything else is an error status.
 */
export declare const StandxKlineHistorySchema: z.ZodObject<{
    s: z.ZodString;
    t: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    o: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    h: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    l: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    c: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    v: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    errmsg: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    s: z.ZodString;
    t: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    o: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    h: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    l: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    c: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    v: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    errmsg: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    s: z.ZodString;
    t: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    o: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    h: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    l: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    c: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    v: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    errmsg: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export type StandxKlineHistory = z.infer<typeof StandxKlineHistorySchema>;
/**
 * Every WS message: {seq, channel, symbol, data}. `seq` is CONNECTION-GLOBAL
 * (interleaved across channels — live capture shows depth seqs 1,7,9,… with
 * price/public_trade frames in the gaps), NOT per-channel. It is surfaced as
 * OrderBook.sequenceId for consumer-side gap awareness; per-channel gap-based
 * resync would false-positive on every interleaved frame.
 */
export declare const StandxWSFrameSchema: z.ZodObject<{
    seq: z.ZodNumber;
    channel: z.ZodString;
    symbol: z.ZodOptional<z.ZodString>;
    data: z.ZodUnknown;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    seq: z.ZodNumber;
    channel: z.ZodString;
    symbol: z.ZodOptional<z.ZodString>;
    data: z.ZodUnknown;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    seq: z.ZodNumber;
    channel: z.ZodString;
    symbol: z.ZodOptional<z.ZodString>;
    data: z.ZodUnknown;
}, z.ZodTypeAny, "passthrough">>;
export type StandxWSFrame = z.infer<typeof StandxWSFrameSchema>;
/**
 * public_trade frame data — ONE trade object per frame:
 * {id:int, price, qty, side:"buy"|"sell", symbol, time:epoch ms}.
 * `id` is a plain JSON number (~2.4e8 in capture, far below 2^53) —
 * normalized to String(id); no bigint reviver needed at current magnitudes.
 */
export declare const StandxWSTradeSchema: z.ZodObject<{
    id: z.ZodNumber;
    price: z.ZodString;
    qty: z.ZodString;
    side: z.ZodEnum<["buy", "sell"]>;
    symbol: z.ZodString;
    time: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodNumber;
    price: z.ZodString;
    qty: z.ZodString;
    side: z.ZodEnum<["buy", "sell"]>;
    symbol: z.ZodString;
    time: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodNumber;
    price: z.ZodString;
    qty: z.ZodString;
    side: z.ZodEnum<["buy", "sell"]>;
    symbol: z.ZodString;
    time: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export type StandxWSTrade = z.infer<typeof StandxWSTradeSchema>;
/**
 * price frame data — compact price snapshot; `time` is ISO-8601 with
 * NANOSECOND precision; spread is [bid, ask]. NO 24h stats on this channel.
 */
export declare const StandxWSPriceSchema: z.ZodObject<{
    base: z.ZodString;
    quote: z.ZodString;
    index_price: z.ZodString;
    last_price: z.ZodString;
    mark_price: z.ZodString;
    mid_price: z.ZodString;
    spread: z.ZodTuple<[z.ZodString, z.ZodString], null>;
    symbol: z.ZodString;
    time: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    base: z.ZodString;
    quote: z.ZodString;
    index_price: z.ZodString;
    last_price: z.ZodString;
    mark_price: z.ZodString;
    mid_price: z.ZodString;
    spread: z.ZodTuple<[z.ZodString, z.ZodString], null>;
    symbol: z.ZodString;
    time: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    base: z.ZodString;
    quote: z.ZodString;
    index_price: z.ZodString;
    last_price: z.ZodString;
    mark_price: z.ZodString;
    mid_price: z.ZodString;
    spread: z.ZodTuple<[z.ZodString, z.ZodString], null>;
    symbol: z.ZodString;
    time: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type StandxWSPrice = z.infer<typeof StandxWSPriceSchema>;
//# sourceMappingURL=types.d.ts.map
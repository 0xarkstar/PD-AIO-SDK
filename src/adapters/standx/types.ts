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

// =============================================================================
// Error shape
// =============================================================================

/** Error body — e.g. keyless /api/health → 401 {"code":401,"message":"missing jwt"} */
export const StandxErrorSchema = z
  .object({
    code: z.number(),
    message: z.string(),
  })
  .passthrough();

export type StandxError = z.infer<typeof StandxErrorSchema>;

// =============================================================================
// REST shapes (bare payloads)
// =============================================================================

const StandxPriceLevelSchema = z.tuple([z.string(), z.string()]);

/**
 * query_depth_book AND the WS depth_book frame `data` — SAME live-verified
 * shape: {asks,bids,last_price,mark_price,symbol,time:ms}. Level ordering is
 * NOT guaranteed (documented) — accepted unsorted here, sorted downstream.
 * `time` is optional (the docs example omits it; every live capture has it).
 */
export const StandxDepthBookSchema = z
  .object({
    asks: z.array(StandxPriceLevelSchema),
    bids: z.array(StandxPriceLevelSchema),
    symbol: z.string(),
    time: z.number().optional(),
  })
  .passthrough();

export type StandxDepthBook = z.infer<typeof StandxDepthBookSchema>;

/** query_recent_trades entry — is_buyer_taker (NO side/id), ISO time */
export const StandxRestTradeSchema = z
  .object({
    is_buyer_taker: z.boolean(),
    price: z.string(),
    qty: z.string(),
    quote_qty: z.string(),
    symbol: z.string(),
    time: z.string(),
  })
  .passthrough();

export type StandxRestTrade = z.infer<typeof StandxRestTradeSchema>;

/**
 * query_symbol_market — ticker + current-funding source.
 * Mixed wire types: prices are STRINGS, 24h stats are NUMBERS,
 * next_funding_time/time are ISO-8601 strings, spread is [bid, ask].
 */
export const StandxSymbolMarketSchema = z
  .object({
    ask1: z.string(),
    bid1: z.string(),
    base: z.string(),
    quote: z.string(),
    funding_rate: z.string(),
    high_price_24h: z.number(),
    low_price_24h: z.number(),
    open_price_24h: z.number(),
    price_change: z.number(),
    price_change_pct: z.number(),
    index_price: z.string(),
    last_price: z.string(),
    mark_price: z.string(),
    next_funding_time: z.string(),
    spread: z.tuple([z.string(), z.string()]),
    symbol: z.string(),
    time: z.string(),
    volume_24h: z.number(),
    volume_quote_24h: z.number(),
  })
  .passthrough();

export type StandxSymbolMarket = z.infer<typeof StandxSymbolMarketSchema>;

/**
 * query_funding_rates entry — FRACTIONAL rate (0.0000125), HOURLY cadence,
 * ISO time. NO conversion needed (unlike grvt's percent-unit trap).
 */
export const StandxFundingEntrySchema = z
  .object({
    funding_rate: z.string(),
    index_price: z.string(),
    mark_price: z.string(),
    symbol: z.string(),
    time: z.string(),
  })
  .passthrough();

export type StandxFundingEntry = z.infer<typeof StandxFundingEntrySchema>;

/**
 * query_symbol_info entry — fees/ticks/leverage/decimals + status.
 * Precision arrives as DECIMAL COUNTS (price_tick_decimals=2 → tick 0.01).
 * Keyless; querying WITHOUT a symbol param returns ALL symbols (live-verified
 * 2026-06-11 — the docs mark symbol required, but the no-param form works).
 */
export const StandxSymbolInfoSchema = z
  .object({
    base_asset: z.string(),
    quote_asset: z.string(),
    maker_fee: z.string(),
    taker_fee: z.string(),
    max_leverage: z.string(),
    min_order_qty: z.string(),
    max_order_qty: z.string(),
    price_tick_decimals: z.number(),
    qty_tick_decimals: z.number(),
    status: z.string(),
    symbol: z.string(),
  })
  .passthrough();

export type StandxSymbolInfo = z.infer<typeof StandxSymbolInfoSchema>;

/**
 * query_market_overview — the markets list (= symbol DISCOVERY source; live
 * has 10 symbols while the docs reference page is stale at 4 — NEVER
 * hardcode symbols from docs).
 */
export const StandxMarketOverviewSchema = z
  .object({
    summary: z.object({ symbol_count: z.number() }).passthrough(),
    symbols: z.array(
      z
        .object({
          base: z.string(),
          quote: z.string(),
          symbol: z.string(),
        })
        .passthrough()
    ),
  })
  .passthrough();

export type StandxMarketOverview = z.infer<typeof StandxMarketOverviewSchema>;

/**
 * kline/history — TradingView-UDF column arrays: {s,t,o,h,l,c,v}.
 * `t` is unix SECONDS. s:"ok" carries data; s:"no_data" carries none;
 * anything else is an error status.
 */
export const StandxKlineHistorySchema = z
  .object({
    s: z.string(),
    t: z.array(z.number()).optional(),
    o: z.array(z.number()).optional(),
    h: z.array(z.number()).optional(),
    l: z.array(z.number()).optional(),
    c: z.array(z.number()).optional(),
    v: z.array(z.number()).optional(),
    errmsg: z.string().optional(),
  })
  .passthrough();

export type StandxKlineHistory = z.infer<typeof StandxKlineHistorySchema>;

// =============================================================================
// WS shapes (wss://perps.standx.com/ws-stream/v1)
// =============================================================================

/**
 * Every WS message: {seq, channel, symbol, data}. `seq` is CONNECTION-GLOBAL
 * (interleaved across channels — live capture shows depth seqs 1,7,9,… with
 * price/public_trade frames in the gaps), NOT per-channel. It is surfaced as
 * OrderBook.sequenceId for consumer-side gap awareness; per-channel gap-based
 * resync would false-positive on every interleaved frame.
 */
export const StandxWSFrameSchema = z
  .object({
    seq: z.number(),
    channel: z.string(),
    symbol: z.string().optional(),
    data: z.unknown(),
  })
  .passthrough();

export type StandxWSFrame = z.infer<typeof StandxWSFrameSchema>;

/**
 * public_trade frame data — ONE trade object per frame:
 * {id:int, price, qty, side:"buy"|"sell", symbol, time:epoch ms}.
 * `id` is a plain JSON number (~2.4e8 in capture, far below 2^53) —
 * normalized to String(id); no bigint reviver needed at current magnitudes.
 */
export const StandxWSTradeSchema = z
  .object({
    id: z.number(),
    price: z.string(),
    qty: z.string(),
    side: z.enum(['buy', 'sell']),
    symbol: z.string(),
    time: z.number(),
  })
  .passthrough();

export type StandxWSTrade = z.infer<typeof StandxWSTradeSchema>;

/**
 * price frame data — compact price snapshot; `time` is ISO-8601 with
 * NANOSECOND precision; spread is [bid, ask]. NO 24h stats on this channel.
 */
export const StandxWSPriceSchema = z
  .object({
    base: z.string(),
    quote: z.string(),
    index_price: z.string(),
    last_price: z.string(),
    mark_price: z.string(),
    mid_price: z.string(),
    spread: z.tuple([z.string(), z.string()]),
    symbol: z.string(),
    time: z.string(),
  })
  .passthrough();

export type StandxWSPrice = z.infer<typeof StandxWSPriceSchema>;

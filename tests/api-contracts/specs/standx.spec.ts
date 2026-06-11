/**
 * StandX API Contract Specification
 *
 * Defines the expected API contract for StandX public endpoints
 * (https://perps.standx.com, recon-verified 2026-06-11, all keyless).
 *
 * Wire facts:
 * - Responses are BARE payloads (no {data} envelope); errors are JSON
 *   {code,message} with real HTTP statuses.
 * - Depth level ordering is NOT guaranteed (venue-documented) — the schema
 *   accepts unsorted levels; sorting is the normalizer's job.
 * - query_funding_rates REQUIRES start_time AND end_time (ms).
 * - kline/history is TradingView-UDF (columns, from/to in SECONDS).
 * - /api/health requires JWT (401 keyless) — kline/time is the keyless ping.
 * - Mixed wire types on query_symbol_market: prices are STRINGS, 24h stats
 *   are NUMBERS, next_funding_time/time are ISO-8601 strings.
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';
import { STANDX_API_URLS } from '../../../src/adapters/standx/constants.js';

// =============================================================================
// Response Schemas (RAW wire — bare payloads, no envelope)
// =============================================================================

const StandxPriceLevelSchema = z.tuple([z.string(), z.string()]);

/** /api/query_depth_book — {asks,bids,last_price,mark_price,symbol,time:ms} */
const StandxDepthResponseSchema = z
  .object({
    asks: z.array(StandxPriceLevelSchema),
    bids: z.array(StandxPriceLevelSchema),
    symbol: z.string(),
    time: z.number().optional(),
  })
  .passthrough();

/** /api/query_recent_trades — is_buyer_taker (NO side, NO id), ISO time */
const StandxTradesResponseSchema = z.array(
  z
    .object({
      is_buyer_taker: z.boolean(),
      price: z.string(),
      qty: z.string(),
      quote_qty: z.string(),
      symbol: z.string(),
      time: z.string(),
    })
    .passthrough()
);

/** /api/query_symbol_market — mixed string/number wire types */
const StandxSymbolMarketResponseSchema = z
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
    mid_price: z.string(),
    next_funding_time: z.string(), // ISO-8601, NOT epoch
    open_interest: z.string(),
    spread: z.tuple([z.string(), z.string()]),
    symbol: z.string(),
    time: z.string(), // ISO-8601
    volume_24h: z.number(),
    volume_quote_24h: z.number(),
  })
  .passthrough();

/** /api/query_funding_rates — FRACTIONAL hourly rates, ISO times */
const StandxFundingRatesResponseSchema = z.array(
  z
    .object({
      funding_rate: z.string(),
      index_price: z.string(),
      mark_price: z.string(),
      symbol: z.string(),
      time: z.string(), // ISO-8601
    })
    .passthrough()
);

/** /api/query_market_overview — the markets list (symbol discovery source) */
const StandxMarketOverviewResponseSchema = z
  .object({
    summary: z
      .object({
        symbol_count: z.number(),
      })
      .passthrough(),
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

/** /api/query_symbol_info — keyless; NO symbol param returns ALL symbols */
const StandxSymbolInfoResponseSchema = z.array(
  z
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
    .passthrough()
);

/** /api/kline/history — TradingView-UDF columns */
const StandxKlineHistoryResponseSchema = z
  .object({
    s: z.string(),
    t: z.array(z.number()).optional(), // SECONDS
    o: z.array(z.number()).optional(),
    h: z.array(z.number()).optional(),
    l: z.array(z.number()).optional(),
    c: z.array(z.number()).optional(),
    v: z.array(z.number()).optional(),
  })
  .passthrough();

/** /api/kline/time — bare unix seconds (the keyless ping; /api/health needs JWT) */
const StandxKlineTimeResponseSchema = z.number();

// =============================================================================
// API Specification
// =============================================================================

// query_funding_rates and kline/history REQUIRE time-window params — computed
// at module load so live contract validation queries a real recent window.
const NOW_MS = Date.now();
const DAY_MS = 86_400_000;

export const standxSpec: APISpecification = {
  exchange: 'standx',
  baseUrl: STANDX_API_URLS.mainnet.rest,
  version: '1.0.0',
  lastUpdated: '2026-06-11',
  endpoints: [
    {
      id: 'standx.fetchMarkets.overview',
      path: '/api/query_market_overview',
      method: 'GET',
      requiresAuth: false,
      responseSchema: StandxMarketOverviewResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 1000,
      description: 'All markets summary (symbol discovery — live has 10, docs stale at 4)',
    },
    {
      id: 'standx.fetchMarkets.symbolInfo',
      path: '/api/query_symbol_info',
      method: 'GET',
      requiresAuth: false,
      responseSchema: StandxSymbolInfoResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 1000,
      description: 'Symbol config for ALL symbols (fees/ticks/leverage; keyless, no param)',
    },
    {
      id: 'standx.fetchOrderBook',
      path: '/api/query_depth_book?symbol=BTC-USD',
      method: 'GET',
      requiresAuth: false,
      responseSchema: StandxDepthResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Order book (~130×130; level ordering NOT guaranteed — client sorts)',
    },
    {
      id: 'standx.fetchTrades',
      path: '/api/query_recent_trades?symbol=BTC-USD',
      method: 'GET',
      requiresAuth: false,
      responseSchema: StandxTradesResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Recent trades (is_buyer_taker, NO id/side fields, ISO time)',
    },
    {
      id: 'standx.fetchTicker',
      path: '/api/query_symbol_market?symbol=BTC-USD',
      method: 'GET',
      requiresAuth: false,
      responseSchema: StandxSymbolMarketResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Full market snapshot (ticker + funding source; mixed wire types)',
    },
    {
      id: 'standx.fetchFundingRateHistory',
      path: `/api/query_funding_rates?symbol=BTC-USD&start_time=${NOW_MS - DAY_MS}&end_time=${NOW_MS}`,
      method: 'GET',
      requiresAuth: false,
      responseSchema: StandxFundingRatesResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Funding history (FRACTIONAL hourly rates; start_time/end_time REQUIRED, ms)',
    },
    {
      id: 'standx.fetchOHLCV',
      path: `/api/kline/history?symbol=BTC-USD&resolution=1&from=${Math.floor((NOW_MS - 600_000) / 1000)}&to=${Math.floor(NOW_MS / 1000)}`,
      method: 'GET',
      requiresAuth: false,
      responseSchema: StandxKlineHistoryResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Klines (TradingView-UDF columns; from/to in SECONDS)',
    },
    {
      id: 'standx.fetchTime',
      path: '/api/kline/time',
      method: 'GET',
      requiresAuth: false,
      responseSchema: StandxKlineTimeResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 300,
      description: 'Server time in unix SECONDS (keyless ping — /api/health requires JWT)',
    },
  ],
};

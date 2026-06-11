/**
 * Extended API Contract Specification
 *
 * Defines the expected API contract for Extended exchange endpoints.
 * Extended is built on StarkNet.
 *
 * Shapes rewritten 2026-06-11 against the LIVE REST API (the previous
 * schemas described a fictional legacy wire):
 * - every response is wrapped in `{status: "OK", data: ...}` (errors:
 *   `{status: "ERROR", error: {code, message}}`)
 * - markets: `data: [{name, assetName, collateralAssetName, active, ...}]`
 * - orderbook: `data: {market, bid: [{qty, price}], ask: [{qty, price}]}`
 * - trades: `data: [{i, m, S, tT, T, p, q}]` — `i` is an int64 that EXCEEDS
 *   Number.MAX_SAFE_INTEGER (JSON.parse loses precision; see
 *   src/adapters/extended/types.ts parseExtendedWSTradesFrame)
 * - funding: `data: [{m, f, T}]` (requires startTime/endTime params)
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';
import { EXTENDED_API_URLS, EXTENDED_ENDPOINTS } from '../../../src/adapters/extended/constants.js';

// =============================================================================
// Response Schemas (live wire shapes, captured 2026-06-11)
// =============================================================================

/**
 * Success envelope: every Extended REST response is `{status, data}`
 */
function extendedEnvelope<T extends z.ZodTypeAny>(data: T) {
  return z
    .object({
      status: z.string(),
      data,
    })
    .passthrough();
}

/**
 * Extended Market Schema (`/api/v1/info/markets` entry)
 */
const ExtendedMarketSchema = z
  .object({
    name: z.string(),
    assetName: z.string(),
    collateralAssetName: z.string(),
    active: z.boolean(),
    status: z.string().optional(),
    assetPrecision: z.number().optional(),
    collateralAssetPrecision: z.number().optional(),
    marketStats: z.record(z.unknown()).optional(),
    tradingConfig: z.record(z.unknown()).optional(),
  })
  .passthrough();

/**
 * Extended Ticker Schema (`/api/v1/info/markets/{market}/stats` data)
 */
const ExtendedTickerStatsSchema = z
  .object({
    lastPrice: z.string(),
    askPrice: z.string(),
    bidPrice: z.string(),
    markPrice: z.string(),
    indexPrice: z.string(),
    fundingRate: z.string(),
    nextFundingRate: z.number(),
    dailyHigh: z.string(),
    dailyLow: z.string(),
    dailyVolume: z.string(),
    dailyVolumeBase: z.string(),
    dailyPriceChange: z.string(),
    dailyPriceChangePercentage: z.string(),
    openInterest: z.string().optional(),
    openInterestBase: z.string().optional(),
  })
  .passthrough();

/**
 * Extended Order Book Schema (`/api/v1/info/markets/{market}/orderbook` data)
 * Levels are `{qty, price}` objects under `bid`/`ask` (NOT bids/asks tuples).
 */
const ExtendedOrderBookSchema = z
  .object({
    market: z.string(),
    bid: z.array(z.object({ qty: z.string(), price: z.string() }).passthrough()),
    ask: z.array(z.object({ qty: z.string(), price: z.string() }).passthrough()),
  })
  .passthrough();

/**
 * Extended Trade Schema (`/api/v1/info/markets/{market}/trades` entry)
 * Identical field names to the WS publicTrades stream.
 */
const ExtendedTradeSchema = z
  .object({
    i: z.number(), // int64 — precision-lossy via JSON.parse, see header note
    m: z.string(),
    S: z.enum(['BUY', 'SELL']),
    tT: z.enum(['TRADE', 'LIQUIDATION', 'DELEVERAGE']),
    T: z.number(),
    p: z.string(),
    q: z.string(),
  })
  .passthrough();

/**
 * Extended Funding Rate Schema (`/api/v1/info/{market}/funding` entry)
 */
const ExtendedFundingRateSchema = z
  .object({
    m: z.string(),
    f: z.string(),
    T: z.number(),
  })
  .passthrough();

// =============================================================================
// API Specification
// =============================================================================

/**
 * Extended API Specification
 */
export const extendedSpec: APISpecification = {
  exchange: 'extended',
  baseUrl: EXTENDED_API_URLS.mainnet.rest,
  version: '1.0.0',
  lastUpdated: '2026-06-11',
  endpoints: [
    {
      id: 'extended.fetchMarkets',
      path: EXTENDED_ENDPOINTS.MARKETS,
      method: 'GET',
      requiresAuth: false,
      responseSchema: extendedEnvelope(z.array(ExtendedMarketSchema)),
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch all markets ({status, data:[...]} envelope)',
    },
    {
      id: 'extended.fetchTicker',
      path: EXTENDED_ENDPOINTS.TICKER_SYMBOL,
      method: 'GET',
      requiresAuth: false,
      responseSchema: extendedEnvelope(ExtendedTickerStatsSchema),
      rateLimit: 1,
      expectedResponseTime: 300,
      description: 'Fetch ticker stats for a market',
    },
    {
      id: 'extended.fetchOrderBook',
      path: EXTENDED_ENDPOINTS.ORDERBOOK,
      method: 'GET',
      requiresAuth: false,
      responseSchema: extendedEnvelope(ExtendedOrderBookSchema),
      rateLimit: 2,
      expectedResponseTime: 400,
      description: 'Fetch order book ({market, bid:[{qty,price}], ask:[...]})',
    },
    {
      id: 'extended.fetchTrades',
      path: EXTENDED_ENDPOINTS.TRADES,
      method: 'GET',
      requiresAuth: false,
      responseSchema: extendedEnvelope(z.array(ExtendedTradeSchema)),
      rateLimit: 1,
      expectedResponseTime: 400,
      description: 'Fetch recent trades ({i,m,S,tT,T,p,q} entries)',
    },
    {
      id: 'extended.fetchFundingHistory',
      path: EXTENDED_ENDPOINTS.FUNDING_RATE,
      method: 'GET',
      requiresAuth: false,
      responseSchema: extendedEnvelope(z.array(ExtendedFundingRateSchema)),
      rateLimit: 1,
      expectedResponseTime: 500,
      description:
        'Fetch funding rate history ({m,f,T} entries; requires startTime param — newest first)',
    },
  ],
};

/**
 * Extended Testnet API Specification
 */
export const extendedTestnetSpec: APISpecification = {
  ...extendedSpec,
  baseUrl: EXTENDED_API_URLS.testnet.rest,
  exchange: 'extended-testnet',
};

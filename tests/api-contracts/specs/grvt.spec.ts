/**
 * GRVT API Contract Specification.
 *
 * Ground-truthed 2026-05-26 against the REAL GRVT API. GRVT splits its API
 * across three hosts; the public market-data endpoints (POST `full/v1/*`,
 * `{ result }` envelope) live on the market-data host used as `baseUrl` here.
 * Authed endpoints are described for completeness but are skipped by the
 * contract validator (`skipAuthEndpoints: true`).
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';
import { GRVT_API_URLS } from '../../../src/adapters/grvt/constants.js';

/**
 * GRVT instrument (market) schema — instrument_hash + base_decimals, no fees.
 */
const GRVTInstrumentSchema = z
  .object({
    instrument: z.string(),
    instrument_hash: z.string(),
    base: z.string(),
    quote: z.string(),
    base_decimals: z.number(),
    quote_decimals: z.number(),
    tick_size: z.string(),
    min_size: z.string(),
    min_notional: z.string().optional(),
    kind: z.string(),
    is_active: z.boolean().optional(),
  })
  .passthrough();

/**
 * GRVT ticker schema (all numeric fields are strings; 24h quote volumes).
 */
const GRVTTickerSchema = z
  .object({
    instrument: z.string().optional(),
    mark_price: z.string().optional(),
    index_price: z.string().optional(),
    last_price: z.string().optional(),
    mid_price: z.string().optional(),
    best_bid_price: z.string().optional(),
    best_ask_price: z.string().optional(),
    best_bid_size: z.string().optional(),
    best_ask_size: z.string().optional(),
    buy_volume_24h_q: z.string().optional(),
    sell_volume_24h_q: z.string().optional(),
    open_interest: z.string().optional(),
    funding_rate: z.string().optional(),
    next_funding_time: z.string().optional(),
  })
  .passthrough();

/**
 * GRVT order book schema — FULL snapshot, `{ price, size, num_orders }` levels.
 */
const GRVTOrderBookSchema = z
  .object({
    event_time: z.string(),
    bids: z.array(z.object({ price: z.string(), size: z.string(), num_orders: z.number().optional() }).passthrough()),
    asks: z.array(z.object({ price: z.string(), size: z.string(), num_orders: z.number().optional() }).passthrough()),
  })
  .passthrough();

/**
 * GRVT trade schema — `is_taker_buyer`, string `trade_id`, `event_time`.
 */
const GRVTTradeSchema = z
  .object({
    event_time: z.string(),
    is_taker_buyer: z.boolean(),
    price: z.string(),
    size: z.string(),
    trade_id: z.string(),
  })
  .passthrough();

/**
 * GRVT funding schema.
 */
const GRVTFundingSchema = z
  .object({
    instrument: z.string().optional(),
    funding_rate: z.string(),
    mark_price: z.string().optional(),
    index_price: z.string().optional(),
  })
  .passthrough();

/**
 * GRVT API Specification (public market-data host).
 */
export const grvtSpec: APISpecification = {
  exchange: 'grvt',
  baseUrl: GRVT_API_URLS.mainnet.marketData,
  version: '2.0.0',
  lastUpdated: '2026-05-26',
  endpoints: [
    {
      id: 'grvt.fetchMarkets',
      path: '/full/v1/instruments',
      method: 'POST',
      requiresAuth: false,
      requestSchema: z.object({ kind: z.array(z.string()).optional(), is_active: z.boolean().optional() }),
      responseSchema: z.object({ result: z.array(GRVTInstrumentSchema) }),
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch all active perpetual instruments',
    },
    {
      id: 'grvt.fetchTicker',
      path: '/full/v1/ticker',
      method: 'POST',
      requiresAuth: false,
      requestSchema: z.object({ instrument: z.string() }),
      responseSchema: z.object({ result: GRVTTickerSchema }),
      rateLimit: 1,
      expectedResponseTime: 300,
      description: 'Fetch ticker for an instrument',
    },
    {
      id: 'grvt.fetchOrderBook',
      path: '/full/v1/book',
      method: 'POST',
      requiresAuth: false,
      requestSchema: z.object({ instrument: z.string(), depth: z.number().optional() }),
      responseSchema: z.object({ result: GRVTOrderBookSchema }),
      rateLimit: 2,
      expectedResponseTime: 400,
      description: 'Fetch a full order-book snapshot',
    },
    {
      id: 'grvt.fetchTrades',
      path: '/full/v1/trade',
      method: 'POST',
      requiresAuth: false,
      requestSchema: z.object({ instrument: z.string(), limit: z.number().optional() }),
      responseSchema: z.object({ result: z.array(GRVTTradeSchema) }),
      rateLimit: 2,
      expectedResponseTime: 400,
      description: 'Fetch recent public trades',
    },
    {
      id: 'grvt.fetchFundingRate',
      path: '/full/v1/funding',
      method: 'POST',
      requiresAuth: false,
      requestSchema: z.object({ instrument: z.string() }),
      responseSchema: z.object({ result: z.union([GRVTFundingSchema, z.array(GRVTFundingSchema)]) }),
      rateLimit: 1,
      expectedResponseTime: 300,
      description: 'Fetch funding rate for an instrument',
    },
    {
      // Authed (trades host); skipped by the validator (skipAuthEndpoints).
      id: 'grvt.createOrder',
      path: '/full/v1/create_order',
      method: 'POST',
      requiresAuth: true,
      requestSchema: z.object({
        order: z.object({
          sub_account_id: z.string(),
          is_market: z.boolean(),
          time_in_force: z.string(),
          post_only: z.boolean(),
          reduce_only: z.boolean(),
          legs: z.array(
            z.object({
              instrument: z.string(),
              size: z.string(),
              limit_price: z.string(),
              is_buying_asset: z.boolean(),
            })
          ),
          signature: z.object({
            r: z.string(),
            s: z.string(),
            v: z.number(),
            expiration: z.string(),
            nonce: z.number(),
            signer: z.string(),
          }),
          metadata: z.object({ client_order_id: z.string() }),
        }),
      }),
      responseSchema: z.object({ result: z.object({ order_id: z.string().optional() }).passthrough() }),
      rateLimit: 5,
      expectedResponseTime: 800,
      description: 'Create a signed order',
    },
    {
      id: 'grvt.cancelOrder',
      path: '/full/v1/cancel_order',
      method: 'POST',
      requiresAuth: true,
      requestSchema: z.object({
        sub_account_id: z.string(),
        order_id: z.string().optional(),
        client_order_id: z.string().optional(),
      }),
      responseSchema: z.object({ result: z.object({}).passthrough() }),
      rateLimit: 3,
      expectedResponseTime: 600,
      description: 'Cancel an order',
    },
  ],
};

/**
 * GRVT Testnet API Specification (testnet market-data host).
 */
export const grvtTestnetSpec: APISpecification = {
  ...grvtSpec,
  baseUrl: GRVT_API_URLS.testnet.marketData,
  exchange: 'grvt-testnet',
};

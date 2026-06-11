/**
 * ApeX Omni API Contract Specification
 *
 * Defines the expected API contract for ApeX Omni public endpoints
 * (https://omni.apex.exchange/api/v3, recon-verified 2026-06-11).
 *
 * Envelope: success {data, timeCost} / error {code, msg, timeCost}.
 * Symbol formats are STRICT and PER-ENDPOINT:
 * - NO-DASH "BTCUSDT": /depth /trades /ticker /klines
 * - DASH "BTC-USDT": /history-funding (+ `symbol` inside /symbols)
 * /depth with a dash symbol silently returns {a:null,b:null,s:"",u:0} — the
 * depth schema below hard-rejects that shape.
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';
import { APEX_API_URLS } from '../../../src/adapters/apex/constants.js';

// =============================================================================
// Response Schemas (RAW wire, envelope included)
// =============================================================================

const ApexPriceLevelSchema = z.tuple([z.string(), z.string()]);

/**
 * /v3/symbols — 731KB config; perps at data.contractConfig.perpetualContract[]
 */
const ApexSymbolsResponseSchema = z.object({
  data: z
    .object({
      contractConfig: z
        .object({
          perpetualContract: z.array(
            z
              .object({
                symbol: z.string(), // DASH form "BTC-USDT"
                crossSymbolName: z.string(), // NO-DASH form "BTCUSDT"
                settleAssetId: z.string(),
                baseTokenId: z.string(),
                tickSize: z.string(),
                stepSize: z.string(),
                minOrderSize: z.string(),
                enableTrade: z.boolean(),
              })
              .passthrough()
          ),
        })
        .passthrough(),
    })
    .passthrough(),
  timeCost: z.number(),
});

/**
 * /v3/depth — hard-rejects the silent-empty {a:null,b:null} dash-symbol trap
 */
const ApexDepthResponseSchema = z.object({
  data: z.object({
    a: z.array(ApexPriceLevelSchema),
    b: z.array(ApexPriceLevelSchema),
    s: z.string().min(1),
    u: z.number(),
  }),
  timeCost: z.number(),
});

/**
 * /v3/trades
 */
const ApexTradesResponseSchema = z.object({
  data: z.array(
    z.object({
      i: z.string(), // uuid
      p: z.string(),
      S: z.enum(['Buy', 'Sell']),
      v: z.string(),
      s: z.string(),
      T: z.number(), // epoch ms
    })
  ),
  timeCost: z.number(),
});

/**
 * /v3/ticker — data is an ARRAY of one object; nextFundingTime is ISO-8601 STRING
 */
const ApexTickerResponseSchema = z.object({
  data: z.array(
    z
      .object({
        symbol: z.string(),
        fundingRate: z.string(),
        predictedFundingRate: z.string(),
        nextFundingTime: z.string(), // ISO-8601, NOT epoch
        indexPrice: z.string(),
        markPrice: z.string(),
        openInterest: z.string(), // base units — only public OI source
        lastPrice: z.string(),
        highPrice24h: z.string(),
        lowPrice24h: z.string(),
        price24hPcnt: z.string(), // FRACTION
        turnover24h: z.string(),
        volume24h: z.string(),
      })
      .passthrough()
  ),
  timeCost: z.number(),
});

/**
 * /v3/history-funding — DASH symbol; rates FRACTIONAL per HOURLY interval; ms timestamps
 */
const ApexHistoryFundingResponseSchema = z.object({
  data: z.object({
    historyFunds: z.array(
      z.object({
        symbol: z.string(), // DASH form
        rate: z.string(),
        price: z.string(),
        fundingTime: z.number(), // epoch ms
        fundingTimestamp: z.number(), // epoch ms
      })
    ),
    totalSize: z.number(),
  }),
  timeCost: z.number(),
});

/**
 * /v3/klines — data keyed BY SYMBOL: {"BTCUSDT":[{s,i,t,o,h,l,c,v,tr}]}
 */
const ApexKlinesResponseSchema = z.object({
  data: z.record(
    z.array(
      z.object({
        s: z.string(),
        i: z.string(),
        t: z.number(), // epoch ms
        o: z.string(),
        h: z.string(),
        l: z.string(),
        c: z.string(),
        v: z.string(),
        tr: z.string(),
      })
    )
  ),
  timeCost: z.number(),
});

/**
 * /v3/time
 */
const ApexTimeResponseSchema = z.object({
  data: z.object({
    time: z.number(),
  }),
  timeCost: z.number(),
});

// =============================================================================
// API Specification
// =============================================================================

export const apexSpec: APISpecification = {
  exchange: 'apex',
  baseUrl: APEX_API_URLS.mainnet.rest,
  version: '1.0.0',
  lastUpdated: '2026-06-11',
  endpoints: [
    {
      id: 'apex.fetchMarkets',
      path: '/symbols',
      method: 'GET',
      requiresAuth: false,
      responseSchema: ApexSymbolsResponseSchema,
      rateLimit: 10,
      expectedResponseTime: 2000,
      description: 'Fetch full exchange config (731KB; perps under contractConfig.perpetualContract)',
    },
    {
      id: 'apex.fetchOrderBook',
      path: '/depth?symbol=BTCUSDT&limit=100',
      method: 'GET',
      requiresAuth: false,
      responseSchema: ApexDepthResponseSchema,
      rateLimit: 5,
      expectedResponseTime: 500,
      description: 'Fetch order book (NO-DASH symbol; dash silently returns null book)',
    },
    {
      id: 'apex.fetchTrades',
      path: '/trades?symbol=BTCUSDT&limit=50',
      method: 'GET',
      requiresAuth: false,
      responseSchema: ApexTradesResponseSchema,
      rateLimit: 5,
      expectedResponseTime: 500,
      description: 'Fetch recent trades (NO-DASH symbol)',
    },
    {
      id: 'apex.fetchTicker',
      path: '/ticker?symbol=BTCUSDT',
      method: 'GET',
      requiresAuth: false,
      responseSchema: ApexTickerResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch 24hr ticker (data is an ARRAY of one; ISO nextFundingTime)',
    },
    {
      id: 'apex.fetchFundingRateHistory',
      path: '/history-funding?symbol=BTC-USDT&limit=20',
      method: 'GET',
      requiresAuth: false,
      responseSchema: ApexHistoryFundingResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch funding history (DASH symbol; HOURLY fractional rates)',
    },
    {
      id: 'apex.fetchOHLCV',
      path: '/klines?symbol=BTCUSDT&interval=1&limit=3',
      method: 'GET',
      requiresAuth: false,
      responseSchema: ApexKlinesResponseSchema,
      rateLimit: 5,
      expectedResponseTime: 500,
      description: 'Fetch klines (data keyed BY SYMBOL; venue interval codes)',
    },
    {
      id: 'apex.fetchTime',
      path: '/time',
      method: 'GET',
      requiresAuth: false,
      responseSchema: ApexTimeResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 300,
      description: 'Fetch server time',
    },
  ],
};

export const apexTestnetSpec: APISpecification = {
  ...apexSpec,
  baseUrl: APEX_API_URLS.testnet.rest,
  exchange: 'apex-testnet',
};

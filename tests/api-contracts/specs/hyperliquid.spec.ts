/**
 * Hyperliquid API Contract Specification
 *
 * Defines the expected API contract for Hyperliquid exchange endpoints.
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';
import { HYPERLIQUID_MAINNET_API, HYPERLIQUID_TESTNET_API } from '../../../src/adapters/hyperliquid/constants.js';

/**
 * Hyperliquid Asset Schema (Market)
 */
const HyperliquidAssetSchema = z.object({
  name: z.string(),
  szDecimals: z.number(),
  maxLeverage: z.number().optional(),
  onlyIsolated: z.boolean().optional(),
});

/**
 * Hyperliquid Meta Response Schema
 */
const HyperliquidMetaSchema = z.object({
  universe: z.array(HyperliquidAssetSchema),
});

/**
 * Hyperliquid AllMids Schema (Ticker)
 */
const HyperliquidAllMidsSchema = z.object({
  mids: z.record(z.string()),
});

/**
 * Hyperliquid L2 Book Schema (OrderBook)
 */
const HyperliquidL2BookSchema = z.object({
  coin: z.string(),
  levels: z.array(
    z.array(
      z.object({
        px: z.string(),
        sz: z.string(),
        n: z.number(),
      })
    )
  ),
  time: z.number(),
});

/**
 * Hyperliquid Trade Schema
 */
const HyperliquidTradeSchema = z.object({
  coin: z.string(),
  side: z.string(),
  px: z.string(),
  sz: z.string(),
  time: z.number(),
  hash: z.string().optional(),
});

/**
 * Hyperliquid User State Schema (Balance/Position)
 */
const HyperliquidUserStateSchema = z.object({
  assetPositions: z.array(
    z.object({
      position: z.object({
        coin: z.string(),
        szi: z.string(),
        leverage: z.object({
          type: z.string(),
          value: z.number(),
        }),
        entryPx: z.string().optional(),
        positionValue: z.string().optional(),
        unrealizedPnl: z.string().optional(),
        liquidationPx: z.string().optional(),
      }),
    })
  ),
  marginSummary: z.object({
    accountValue: z.string(),
    totalNtlPos: z.string(),
    totalRawUsd: z.string(),
  }),
  crossMarginSummary: z.object({
    accountValue: z.string(),
    totalMarginUsed: z.string(),
  }),
});

/**
 * Hyperliquid Open Orders Schema
 */
const HyperliquidOpenOrdersSchema = z.array(
  z.object({
    order: z.object({
      coin: z.string(),
      side: z.string(),
      limitPx: z.string(),
      sz: z.string(),
      oid: z.number(),
      timestamp: z.number(),
      origSz: z.string(),
    }),
  })
);

/**
 * Hyperliquid Funding Rate Schema
 */
const HyperliquidFundingSchema = z.object({
  coin: z.string(),
  fundingRate: z.string(),
  premium: z.string().optional(),
  time: z.number(),
});

/**
 * Hyperliquid Order Response Schema
 */
const HyperliquidOrderResponseSchema = z.object({
  status: z.string(),
  response: z.object({
    type: z.string(),
    data: z.object({
      statuses: z.array(z.string()),
    }),
  }),
});

/**
 * Hyperliquid API Specification
 */
export const hyperliquidSpec: APISpecification = {
  exchange: 'hyperliquid',
  baseUrl: HYPERLIQUID_MAINNET_API,
  version: '1.0.0',
  lastUpdated: '2026-01-08',
  endpoints: [
    // Public Market Data Endpoints
    {
      id: 'hyperliquid.fetchMarkets',
      path: '/info',
      method: 'POST',
      requiresAuth: false,
      requestSchema: z.object({
        type: z.literal('meta'),
      }),
      responseSchema: HyperliquidMetaSchema,
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch all available markets',
    },
    {
      id: 'hyperliquid.fetchTicker',
      path: '/info',
      method: 'POST',
      requiresAuth: false,
      requestSchema: z.object({
        type: z.literal('allMids'),
      }),
      responseSchema: HyperliquidAllMidsSchema,
      rateLimit: 1,
      expectedResponseTime: 300,
      description: 'Fetch all mid prices',
    },
    {
      id: 'hyperliquid.fetchOrderBook',
      path: '/info',
      method: 'POST',
      requiresAuth: false,
      requestSchema: z.object({
        type: z.literal('l2Book'),
        coin: z.string(),
      }),
      responseSchema: HyperliquidL2BookSchema,
      rateLimit: 2,
      expectedResponseTime: 400,
      description: 'Fetch order book for a specific symbol',
    },
    {
      id: 'hyperliquid.fetchTrades',
      path: '/info',
      method: 'POST',
      requiresAuth: false,
      requestSchema: z.object({
        type: z.literal('recentTrades'),
        coin: z.string(),
      }),
      responseSchema: z.array(HyperliquidTradeSchema),
      rateLimit: 2,
      expectedResponseTime: 400,
      description: 'Fetch recent trades for a specific symbol',
    },
    {
      id: 'hyperliquid.fetchFundingRate',
      path: '/info',
      method: 'POST',
      requiresAuth: false,
      requestSchema: z.object({
        type: z.literal('metaAndAssetCtxs'),
      }),
      responseSchema: z.array(
        z.object({
          dayNtlVlm: z.string(),
          funding: z.string(),
          openInterest: z.string(),
          prevDayPx: z.string(),
          markPx: z.string(),
          midPx: z.string().optional(),
        })
      ),
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch funding rates for all symbols',
    },

    // Private Account Endpoints (require authentication)
    {
      id: 'hyperliquid.fetchPositions',
      path: '/info',
      method: 'POST',
      requiresAuth: true,
      requestSchema: z.object({
        type: z.literal('clearinghouseState'),
        user: z.string(),
      }),
      responseSchema: HyperliquidUserStateSchema,
      rateLimit: 2,
      expectedResponseTime: 600,
      description: 'Fetch user positions and balance',
    },
    {
      id: 'hyperliquid.fetchOpenOrders',
      path: '/info',
      method: 'POST',
      requiresAuth: true,
      requestSchema: z.object({
        type: z.literal('openOrders'),
        user: z.string(),
      }),
      responseSchema: HyperliquidOpenOrdersSchema,
      rateLimit: 2,
      expectedResponseTime: 500,
      description: 'Fetch user open orders',
    },
    {
      id: 'hyperliquid.createOrder',
      path: '/exchange',
      method: 'POST',
      requiresAuth: true,
      requestSchema: z.object({
        action: z.object({
          type: z.literal('order'),
          orders: z.array(
            z.object({
              a: z.number(), // asset
              b: z.boolean(), // is buy
              p: z.string(), // price
              s: z.string(), // size
              r: z.boolean(), // reduce only
              t: z.object({
                limit: z.object({
                  tif: z.string(), // time in force
                }),
              }),
            })
          ),
          grouping: z.string(),
        }),
        nonce: z.number(),
        signature: z.object({
          r: z.string(),
          s: z.string(),
          v: z.number(),
        }),
        vaultAddress: z.string().optional(),
      }),
      responseSchema: HyperliquidOrderResponseSchema,
      rateLimit: 5,
      expectedResponseTime: 1000,
      description: 'Create new order(s)',
    },
    {
      id: 'hyperliquid.cancelOrder',
      path: '/exchange',
      method: 'POST',
      requiresAuth: true,
      requestSchema: z.object({
        action: z.object({
          type: z.literal('cancel'),
          cancels: z.array(
            z.object({
              a: z.number(), // asset
              o: z.number(), // order id
            })
          ),
        }),
        nonce: z.number(),
        signature: z.object({
          r: z.string(),
          s: z.string(),
          v: z.number(),
        }),
      }),
      responseSchema: HyperliquidOrderResponseSchema,
      rateLimit: 3,
      expectedResponseTime: 800,
      description: 'Cancel order(s)',
    },
  ],
};

/**
 * Hyperliquid Testnet API Specification
 */
export const hyperliquidTestnetSpec: APISpecification = {
  ...hyperliquidSpec,
  baseUrl: HYPERLIQUID_TESTNET_API,
  exchange: 'hyperliquid-testnet',
};

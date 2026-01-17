/**
 * Lighter API Contract Specification
 *
 * Defines the expected API contract for Lighter exchange endpoints.
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';
import { LIGHTER_API_URLS } from '../../../src/adapters/lighter/constants.js';

/**
 * Lighter Market Schema
 */
const LighterMarketSchema = z.object({
  symbol: z.string(),
  base: z.string(),
  quote: z.string(),
  active: z.boolean(),
  minOrderSize: z.number().optional(),
  maxOrderSize: z.number().optional(),
  pricePrecision: z.number().optional(),
  sizePrecision: z.number().optional(),
});

/**
 * Lighter Ticker Schema
 */
const LighterTickerSchema = z.object({
  symbol: z.string(),
  last: z.number().optional(),
  bid: z.number().optional(),
  ask: z.number().optional(),
  high: z.number().optional(),
  low: z.number().optional(),
  volume: z.number().optional(),
  timestamp: z.number().optional(),
});

/**
 * Lighter OrderBook Schema
 */
const LighterOrderBookSchema = z.object({
  symbol: z.string(),
  bids: z.array(
    z.tuple([z.number(), z.number()]) // [price, size]
  ),
  asks: z.array(
    z.tuple([z.number(), z.number()]) // [price, size]
  ),
  timestamp: z.number().optional(),
});

/**
 * Lighter Trade Schema
 */
const LighterTradeSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  price: z.number(),
  size: z.number(),
  side: z.enum(['buy', 'sell']),
  timestamp: z.number(),
});

/**
 * Lighter Position Schema
 */
const LighterPositionSchema = z.object({
  symbol: z.string(),
  side: z.enum(['long', 'short']),
  size: z.number(),
  entryPrice: z.number().optional(),
  markPrice: z.number().optional(),
  liquidationPrice: z.number().optional(),
  unrealizedPnl: z.number().optional(),
  leverage: z.number().optional(),
});

/**
 * Lighter Funding Rate Schema
 */
const LighterFundingRateSchema = z.object({
  symbol: z.string(),
  fundingRate: z.number(),
  fundingTimestamp: z.number().optional(),
  nextFundingTime: z.number().optional(),
});

/**
 * Lighter API Specification
 */
export const lighterSpec: APISpecification = {
  exchange: 'lighter',
  baseUrl: LIGHTER_API_URLS.mainnet.rest,
  version: '1.0.0',
  lastUpdated: '2026-01-08',
  endpoints: [
    // Public Market Data Endpoints
    {
      id: 'lighter.fetchMarkets',
      path: '/markets',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(LighterMarketSchema),
      rateLimit: 1,
      expectedResponseTime: 1000,
      description: 'Fetch all available markets',
    },
    {
      id: 'lighter.fetchTicker',
      path: '/ticker/BTC-PERP',
      method: 'GET',
      requiresAuth: false,
      responseSchema: LighterTickerSchema,
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch ticker for a specific symbol',
    },
    {
      id: 'lighter.fetchOrderBook',
      path: '/orderbook/BTC-PERP',
      method: 'GET',
      requiresAuth: false,
      responseSchema: LighterOrderBookSchema,
      rateLimit: 2,
      expectedResponseTime: 800,
      description: 'Fetch order book for a specific symbol',
    },
    {
      id: 'lighter.fetchTrades',
      path: '/trades/BTC-PERP',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(LighterTradeSchema),
      rateLimit: 2,
      expectedResponseTime: 800,
      description: 'Fetch recent trades for a specific symbol',
    },
    {
      id: 'lighter.fetchFundingRate',
      path: '/funding/BTC-PERP',
      method: 'GET',
      requiresAuth: false,
      responseSchema: LighterFundingRateSchema,
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch funding rate for a specific symbol',
    },

    // Private Account Endpoints (require authentication)
    {
      id: 'lighter.fetchPositions',
      path: '/positions',
      method: 'GET',
      requiresAuth: true,
      responseSchema: z.array(LighterPositionSchema),
      rateLimit: 2,
      expectedResponseTime: 1000,
      description: 'Fetch user positions',
    },
    {
      id: 'lighter.fetchBalance',
      path: '/account/balance',
      method: 'GET',
      requiresAuth: true,
      responseSchema: z.object({
        equity: z.number(),
        marginUsed: z.number().optional(),
        availableMargin: z.number().optional(),
        unrealizedPnl: z.number().optional(),
      }),
      rateLimit: 2,
      expectedResponseTime: 800,
      description: 'Fetch account balance',
    },
  ],
};

/**
 * Lighter Testnet API Specification
 */
export const lighterTestnetSpec: APISpecification = {
  ...lighterSpec,
  baseUrl: LIGHTER_API_URLS.testnet.rest,
  exchange: 'lighter-testnet',
};

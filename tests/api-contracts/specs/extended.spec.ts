/**
 * Extended API Contract Specification
 *
 * Defines the expected API contract for Extended exchange endpoints.
 * Extended is built on StarkNet.
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';
import { EXTENDED_API_URLS, EXTENDED_ENDPOINTS } from '../../../src/adapters/extended/constants.js';

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Extended Market Schema
 */
const ExtendedMarketSchema = z.object({
  marketId: z.string(),
  symbol: z.string(),
  baseAsset: z.string(),
  quoteAsset: z.string(),
  settleAsset: z.string(),
  isActive: z.boolean(),
  minOrderQuantity: z.string(),
  maxOrderQuantity: z.string(),
  minPrice: z.string(),
  maxPrice: z.string(),
  quantityPrecision: z.number(),
  pricePrecision: z.number(),
  contractMultiplier: z.string(),
  maxLeverage: z.string(),
  fundingInterval: z.number(),
  settlementPeriod: z.number().optional(),
});

/**
 * Extended Ticker Schema
 */
const ExtendedTickerSchema = z.object({
  symbol: z.string(),
  lastPrice: z.string(),
  bidPrice: z.string(),
  askPrice: z.string(),
  volume24h: z.string(),
  quoteVolume24h: z.string(),
  high24h: z.string(),
  low24h: z.string(),
  priceChange24h: z.string(),
  priceChangePercent24h: z.string(),
  openInterest: z.string().optional(),
  indexPrice: z.string().optional(),
  markPrice: z.string().optional(),
  fundingRate: z.string().optional(),
  nextFundingTime: z.number().optional(),
  timestamp: z.number(),
});

/**
 * Extended Order Book Schema
 */
const ExtendedOrderBookSchema = z.object({
  symbol: z.string(),
  bids: z.array(z.tuple([z.string(), z.string()])),
  asks: z.array(z.tuple([z.string(), z.string()])),
  timestamp: z.number(),
  sequence: z.number().optional(),
  checksum: z.string().optional(),
});

/**
 * Extended Trade Schema
 */
const ExtendedTradeSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  price: z.string(),
  quantity: z.string(),
  side: z.enum(['buy', 'sell']),
  timestamp: z.number(),
  isMaker: z.boolean().optional(),
  tradeId: z.string().optional(),
});

/**
 * Extended Funding Rate Schema
 */
const ExtendedFundingRateSchema = z.object({
  symbol: z.string(),
  fundingRate: z.string(),
  fundingTime: z.number(),
  nextFundingTime: z.number().optional(),
  indexPrice: z.string(),
  markPrice: z.string(),
  premiumRate: z.string().optional(),
});

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
  lastUpdated: '2026-02-14',
  endpoints: [
    {
      id: 'extended.fetchMarkets',
      path: EXTENDED_ENDPOINTS.MARKETS,
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(ExtendedMarketSchema),
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch all markets',
    },
    {
      id: 'extended.fetchTicker',
      path: EXTENDED_ENDPOINTS.TICKER_SYMBOL,
      method: 'GET',
      requiresAuth: false,
      responseSchema: ExtendedTickerSchema,
      rateLimit: 1,
      expectedResponseTime: 300,
      description: 'Fetch ticker stats for a market',
    },
    {
      id: 'extended.fetchOrderBook',
      path: EXTENDED_ENDPOINTS.ORDERBOOK,
      method: 'GET',
      requiresAuth: false,
      responseSchema: ExtendedOrderBookSchema,
      rateLimit: 2,
      expectedResponseTime: 400,
      description: 'Fetch order book for a market',
    },
    {
      id: 'extended.fetchTrades',
      path: EXTENDED_ENDPOINTS.TRADES,
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(ExtendedTradeSchema),
      rateLimit: 1,
      expectedResponseTime: 400,
      description: 'Fetch recent trades for a market',
    },
    {
      id: 'extended.fetchFundingRate',
      path: EXTENDED_ENDPOINTS.FUNDING_RATE,
      method: 'GET',
      requiresAuth: false,
      responseSchema: ExtendedFundingRateSchema,
      rateLimit: 1,
      expectedResponseTime: 400,
      description: 'Fetch current funding rate for a market',
    },
    {
      id: 'extended.fetchFundingHistory',
      path: EXTENDED_ENDPOINTS.FUNDING_HISTORY,
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(ExtendedFundingRateSchema),
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch funding rate history for a market',
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

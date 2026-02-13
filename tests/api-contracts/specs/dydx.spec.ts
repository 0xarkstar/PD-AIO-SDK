/**
 * dYdX v4 API Contract Specification
 *
 * Defines the expected API contract for dYdX v4 Indexer API endpoints.
 * dYdX v4 is built on a Cosmos SDK L1 blockchain.
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';
import { DYDX_MAINNET_API, DYDX_TESTNET_API } from '../../../src/adapters/dydx/constants.js';

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * dYdX Perpetual Market Schema
 */
const DydxPerpetualMarketSchema = z.object({
  ticker: z.string(),
  status: z.string(),
  baseAsset: z.string(),
  quoteAsset: z.string(),
  oraclePrice: z.string(),
  priceChange24H: z.string(),
  volume24H: z.string(),
  trades24H: z.number(),
  openInterest: z.string(),
  openInterestUSDC: z.string(),
  nextFundingRate: z.string(),
  nextFundingAt: z.string(),
  initialMarginFraction: z.string(),
  maintenanceMarginFraction: z.string(),
  stepSize: z.string(),
  stepBaseQuantums: z.number(),
  subticksPerTick: z.number(),
  tickSize: z.string(),
  atomicResolution: z.number(),
  quantumConversionExponent: z.number(),
  basePositionNotional: z.string().optional(),
});

/**
 * dYdX Perpetual Markets Response Schema
 */
const DydxPerpetualMarketsResponseSchema = z.object({
  markets: z.record(DydxPerpetualMarketSchema),
});

/**
 * dYdX Order Book Response Schema
 */
const DydxOrderBookResponseSchema = z.object({
  bids: z.array(
    z.object({
      price: z.string(),
      size: z.string(),
    })
  ),
  asks: z.array(
    z.object({
      price: z.string(),
      size: z.string(),
    })
  ),
});

/**
 * dYdX Trades Response Schema
 */
const DydxTradesResponseSchema = z.object({
  trades: z.array(
    z.object({
      id: z.string(),
      side: z.string(),
      size: z.string(),
      price: z.string(),
      type: z.string(),
      createdAt: z.string(),
      createdAtHeight: z.string(),
    })
  ),
});

/**
 * dYdX Historical Funding Response Schema
 */
const DydxHistoricalFundingResponseSchema = z.object({
  historicalFunding: z.array(
    z.object({
      ticker: z.string(),
      rate: z.string(),
      price: z.string(),
      effectiveAt: z.string(),
      effectiveAtHeight: z.string(),
    })
  ),
});

/**
 * dYdX Candles Response Schema
 */
const DydxCandlesResponseSchema = z.object({
  candles: z.array(
    z.object({
      startedAt: z.string(),
      ticker: z.string(),
      resolution: z.string(),
      low: z.string(),
      high: z.string(),
      open: z.string(),
      close: z.string(),
      baseTokenVolume: z.string(),
      usdVolume: z.string(),
      trades: z.number(),
      startingOpenInterest: z.string(),
    })
  ),
});

// =============================================================================
// API Specification
// =============================================================================

/**
 * dYdX v4 API Specification
 */
export const dydxSpec: APISpecification = {
  exchange: 'dydx',
  baseUrl: DYDX_MAINNET_API,
  version: '1.0.0',
  lastUpdated: '2026-02-14',
  endpoints: [
    {
      id: 'dydx.fetchMarkets',
      path: '/perpetualMarkets',
      method: 'GET',
      requiresAuth: false,
      responseSchema: DydxPerpetualMarketsResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch all perpetual markets',
    },
    {
      id: 'dydx.fetchOrderBook',
      path: '/orderbooks/perpetualMarket/{symbol}',
      method: 'GET',
      requiresAuth: false,
      responseSchema: DydxOrderBookResponseSchema,
      rateLimit: 2,
      expectedResponseTime: 400,
      description: 'Fetch order book for a perpetual market',
    },
    {
      id: 'dydx.fetchTrades',
      path: '/trades?market={symbol}',
      method: 'GET',
      requiresAuth: false,
      responseSchema: DydxTradesResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 400,
      description: 'Fetch recent trades for a market',
    },
    {
      id: 'dydx.fetchFundingRate',
      path: '/historicalFunding?market={symbol}',
      method: 'GET',
      requiresAuth: false,
      responseSchema: DydxHistoricalFundingResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch historical funding rates for a market',
    },
    {
      id: 'dydx.fetchOHLCV',
      path: '/candles?market={symbol}&resolution=1HOUR',
      method: 'GET',
      requiresAuth: false,
      responseSchema: DydxCandlesResponseSchema,
      rateLimit: 2,
      expectedResponseTime: 500,
      description: 'Fetch OHLCV candles for a market',
    },
  ],
};

/**
 * dYdX v4 Testnet API Specification
 */
export const dydxTestnetSpec: APISpecification = {
  ...dydxSpec,
  baseUrl: DYDX_TESTNET_API,
  exchange: 'dydx-testnet',
};

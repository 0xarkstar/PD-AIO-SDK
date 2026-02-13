/**
 * GMX v2 API Contract Specification
 *
 * GMX is a decentralized perpetuals exchange on Arbitrum/Avalanche.
 * Uses REST API for market data; trading is on-chain via smart contracts.
 * No orderbook or trade history REST endpoints (AMM-based).
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';
import { GMX_ARBITRUM_API } from '../../../src/adapters/gmx/constants.js';

/**
 * Market info response schema (/markets/info)
 * Returns { markets: GmxMarketInfo[] }
 */
const GmxMarketInfoSchema = z.object({
  marketToken: z.string(),
  indexToken: z.string(),
  longToken: z.string(),
  shortToken: z.string(),
  name: z.string().optional(),
  isListed: z.boolean().optional(),
  longPoolAmount: z.string(),
  shortPoolAmount: z.string(),
  maxLongPoolAmount: z.string(),
  maxShortPoolAmount: z.string(),
  maxOpenInterestLong: z.string(),
  maxOpenInterestShort: z.string(),
  isDisabled: z.boolean(),
});

const GmxMarketsResponseSchema = z.object({
  markets: z.array(GmxMarketInfoSchema),
});

/**
 * Ticker price schema (/prices/tickers)
 * Returns GmxTickerPrice[]
 */
const GmxTickerPriceSchema = z.object({
  tokenAddress: z.string(),
  tokenSymbol: z.string().optional(),
  minPrice: z.string(),
  maxPrice: z.string(),
  updatedAt: z.number().optional(),
});

/**
 * Candlestick schema (/prices/candles)
 * Returns GmxCandlestick[]
 */
const GmxCandlestickSchema = z.object({
  timestamp: z.number(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
});

/**
 * GMX Arbitrum API Specification
 */
export const gmxSpec: APISpecification = {
  exchange: 'gmx',
  baseUrl: GMX_ARBITRUM_API,
  version: '1.0.0',
  lastUpdated: '2026-02-14',
  endpoints: [
    {
      id: 'gmx.fetchMarkets',
      path: '/markets/info',
      method: 'GET',
      requiresAuth: false,
      responseSchema: GmxMarketsResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 1000,
      description: 'Fetch all GMX v2 market information',
    },
    {
      id: 'gmx.fetchTickers',
      path: '/prices/tickers',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(GmxTickerPriceSchema),
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch token prices/tickers',
    },
    {
      id: 'gmx.fetchCandles',
      path: '/prices/candles',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(GmxCandlestickSchema),
      rateLimit: 2,
      expectedResponseTime: 800,
      description: 'Fetch OHLCV candles (requires tokenSymbol and period query params)',
    },
  ],
};

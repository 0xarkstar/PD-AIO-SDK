/**
 * Pacifica API Contract Specification
 *
 * Defines the expected API contract for Pacifica exchange endpoints.
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';
import { PACIFICA_API_URLS } from '../../../src/adapters/pacifica/constants.js';

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Pacifica Market Schema
 */
const PacificaMarketSchema = z.object({
  symbol: z.string(),
  base_currency: z.string(),
  quote_currency: z.string(),
  status: z.string(),
  price_step: z.string(),
  size_step: z.string(),
  min_size: z.string(),
  max_leverage: z.number(),
  maker_fee: z.string(),
  taker_fee: z.string(),
  funding_interval: z.number(),
});

/**
 * Pacifica Ticker/Price Schema
 */
const PacificaTickerSchema = z.object({
  symbol: z.string(),
  last_price: z.string(),
  mark_price: z.string(),
  index_price: z.string(),
  bid_price: z.string(),
  ask_price: z.string(),
  high_24h: z.string(),
  low_24h: z.string(),
  volume_24h: z.string(),
  quote_volume_24h: z.string(),
  open_interest: z.string(),
  funding_rate: z.string(),
  next_funding_time: z.number(),
  timestamp: z.number(),
});

/**
 * Pacifica Order Book Response Schema
 */
const PacificaOrderBookSchema = z.object({
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
  timestamp: z.number(),
  sequence: z.number(),
});

/**
 * Pacifica Trade Schema
 */
const PacificaTradeSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  price: z.string(),
  size: z.string(),
  side: z.enum(['buy', 'sell']),
  timestamp: z.number(),
});

/**
 * Pacifica Funding History Schema
 */
const PacificaFundingHistorySchema = z.object({
  symbol: z.string(),
  funding_rate: z.string(),
  mark_price: z.string(),
  index_price: z.string(),
  timestamp: z.number(),
});

// =============================================================================
// API Specification
// =============================================================================

/**
 * Pacifica API Specification
 */
export const pacificaSpec: APISpecification = {
  exchange: 'pacifica',
  baseUrl: PACIFICA_API_URLS.mainnet.rest,
  version: '1.0.0',
  lastUpdated: '2026-02-14',
  endpoints: [
    {
      id: 'pacifica.fetchMarkets',
      path: '/markets',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(PacificaMarketSchema),
      rateLimit: 5,
      expectedResponseTime: 500,
      description: 'Fetch all markets',
    },
    {
      id: 'pacifica.fetchTicker',
      path: '/prices?symbol={symbol}',
      method: 'GET',
      requiresAuth: false,
      responseSchema: PacificaTickerSchema,
      rateLimit: 1,
      expectedResponseTime: 300,
      description: 'Fetch ticker/price data for a symbol',
    },
    {
      id: 'pacifica.fetchOrderBook',
      path: '/book?symbol={symbol}&limit=20',
      method: 'GET',
      requiresAuth: false,
      responseSchema: PacificaOrderBookSchema,
      rateLimit: 2,
      expectedResponseTime: 400,
      description: 'Fetch order book for a symbol',
    },
    {
      id: 'pacifica.fetchTrades',
      path: '/trades?symbol={symbol}&limit=20',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(PacificaTradeSchema),
      rateLimit: 2,
      expectedResponseTime: 400,
      description: 'Fetch recent trades for a symbol',
    },
    {
      id: 'pacifica.fetchFundingRate',
      path: '/funding/historical?symbol={symbol}&limit=1',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(PacificaFundingHistorySchema),
      rateLimit: 1,
      expectedResponseTime: 400,
      description: 'Fetch historical funding rate for a symbol',
    },
  ],
};

/**
 * Pacifica Testnet API Specification
 */
export const pacificaTestnetSpec: APISpecification = {
  ...pacificaSpec,
  baseUrl: PACIFICA_API_URLS.testnet.rest,
  exchange: 'pacifica-testnet',
};

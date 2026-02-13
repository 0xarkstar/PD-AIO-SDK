/**
 * Variational API Contract Specification
 *
 * Defines the expected API contract for Variational exchange endpoints.
 * Variational is an RFQ-based perpetuals DEX.
 * Currently only /metadata/stats is publicly available.
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';
import { VARIATIONAL_API_URLS, VARIATIONAL_ENDPOINTS } from '../../../src/adapters/variational/constants.js';

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Variational Quote Data Schema (bid/ask at a given notional size)
 */
const VariationalQuoteDataSchema = z.object({
  bid: z.string(),
  ask: z.string(),
});

/**
 * Variational Quotes Schema (quotes at multiple notional sizes)
 */
const VariationalQuotesSchema = z.object({
  updated_at: z.string(),
  size_1k: VariationalQuoteDataSchema,
  size_100k: VariationalQuoteDataSchema,
  size_1m: VariationalQuoteDataSchema.optional(),
});

/**
 * Variational Open Interest Schema
 */
const VariationalOpenInterestSchema = z.object({
  long_open_interest: z.string(),
  short_open_interest: z.string(),
});

/**
 * Variational Listing Schema (per-market stats)
 */
const VariationalListingSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  mark_price: z.string(),
  volume_24h: z.string(),
  open_interest: VariationalOpenInterestSchema,
  funding_rate: z.string(),
  funding_interval_s: z.number(),
  base_spread_bps: z.string(),
  quotes: VariationalQuotesSchema,
});

/**
 * Variational Loss Refund Schema
 */
const VariationalLossRefundSchema = z.object({
  pool_size: z.string(),
  refunded_24h: z.string(),
});

/**
 * Variational /metadata/stats Response Schema
 */
const VariationalMetadataStatsSchema = z.object({
  total_volume_24h: z.string(),
  cumulative_volume: z.string(),
  tvl: z.string(),
  open_interest: z.string(),
  num_markets: z.number(),
  loss_refund: VariationalLossRefundSchema,
  listings: z.array(VariationalListingSchema),
});

// =============================================================================
// API Specification
// =============================================================================

/**
 * Variational API Specification
 */
export const variationalSpec: APISpecification = {
  exchange: 'variational',
  baseUrl: VARIATIONAL_API_URLS.mainnet.rest,
  version: '1.0.0',
  lastUpdated: '2026-02-14',
  endpoints: [
    {
      id: 'variational.fetchMetadataStats',
      path: VARIATIONAL_ENDPOINTS.METADATA_STATS,
      method: 'GET',
      requiresAuth: false,
      responseSchema: VariationalMetadataStatsSchema,
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch platform stats and per-listing market data',
    },
  ],
};

/**
 * Variational Testnet API Specification
 */
export const variationalTestnetSpec: APISpecification = {
  ...variationalSpec,
  baseUrl: VARIATIONAL_API_URLS.testnet.rest,
  exchange: 'variational-testnet',
};

/**
 * Ostium API Contract Specification
 *
 * Ostium is a perpetuals exchange on Arbitrum supporting crypto, forex,
 * stocks, commodities, and indices. Very limited REST API - only the
 * metadata backend price endpoint is testable via HTTP.
 * Most data comes from GraphQL subgraph and on-chain contracts.
 * No testnet variant.
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';
import { OSTIUM_METADATA_URL } from '../../../src/adapters/ostium/constants.js';

/**
 * Ostium price response schema
 * GET /PricePublish/latest-price?pair=BTC/USD
 */
const OstiumPriceResponseSchema = z.object({
  pair: z.string(),
  price: z.string(),
  timestamp: z.number(),
  source: z.string(),
});

/**
 * Ostium Metadata API Specification
 */
export const ostiumSpec: APISpecification = {
  exchange: 'ostium',
  baseUrl: OSTIUM_METADATA_URL,
  version: '1.0.0',
  lastUpdated: '2026-02-14',
  endpoints: [
    {
      id: 'ostium.fetchPrice',
      path: '/PricePublish/latest-price',
      method: 'GET',
      requiresAuth: false,
      responseSchema: OstiumPriceResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch latest price for a pair (requires pair query param, e.g., pair=BTC/USD)',
    },
  ],
};

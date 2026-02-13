/**
 * Jupiter Perps API Contract Specification
 *
 * Jupiter is an on-chain perpetuals exchange on Solana using the JLP pool.
 * Very limited REST API - only the Price API v3 is testable via HTTP.
 * Trading and position data come from on-chain Solana program accounts.
 * No testnet variant (mainnet only).
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';
import { JUPITER_MAINNET_PRICE_API } from '../../../src/adapters/jupiter/constants.js';

/**
 * Jupiter Price API v3 response schema
 * GET https://api.jup.ag/price/v3?ids={tokenMintAddress}
 * Returns { data: Record<string, JupiterPriceData>, timeTaken: number }
 */
const JupiterPriceDataSchema = z.object({
  id: z.string(),
  type: z.literal('derivedPrice'),
  price: z.string(),
  extraInfo: z
    .object({
      lastSwappedPrice: z
        .object({
          lastSwappedPrice: z.string(),
          lastJupiterSellPrice: z.string(),
          lastJupiterBuyPrice: z.string(),
        })
        .optional(),
      quotedPrice: z
        .object({
          buyPrice: z.string(),
          sellPrice: z.string(),
        })
        .optional(),
    })
    .optional(),
});

const JupiterPriceResponseSchema = z.object({
  data: z.record(JupiterPriceDataSchema),
  timeTaken: z.number(),
});

/**
 * Jupiter Price API Specification
 */
export const jupiterSpec: APISpecification = {
  exchange: 'jupiter',
  baseUrl: JUPITER_MAINNET_PRICE_API,
  version: '1.0.0',
  lastUpdated: '2026-02-14',
  endpoints: [
    {
      id: 'jupiter.fetchPrice',
      path: '',
      method: 'GET',
      requiresAuth: false,
      responseSchema: JupiterPriceResponseSchema,
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch token price (requires ids query param with token mint address)',
    },
  ],
};

/**
 * Drift Protocol API Contract Specification
 *
 * Drift is a decentralized perpetuals exchange on Solana.
 * Uses DLOB (Decentralized Limit Order Book) REST API for market data.
 * Trading is on-chain via Solana program instructions.
 */

import { z } from 'zod';
import type { APISpecification } from '../types.js';
import { DRIFT_MAINNET_DLOB_API, DRIFT_DEVNET_DLOB_API } from '../../../src/adapters/drift/constants.js';

/**
 * L2 Order book response schema (/l2)
 */
const DriftL2OrderBookSchema = z.object({
  marketIndex: z.number(),
  marketType: z.string(),
  bids: z.array(
    z.object({
      price: z.string(),
      size: z.string(),
      sources: z.record(z.string()).optional(),
    })
  ),
  asks: z.array(
    z.object({
      price: z.string(),
      size: z.string(),
      sources: z.record(z.string()).optional(),
    })
  ),
  oraclePrice: z.string(),
  slot: z.number(),
});

/**
 * Trade response schema (/trades)
 */
const DriftTradeSchema = z.object({
  recordId: z.string(),
  fillRecordId: z.string(),
  marketIndex: z.number(),
  marketType: z.string(),
  taker: z.string(),
  takerOrderId: z.number(),
  takerOrderDirection: z.string(),
  maker: z.string(),
  makerOrderId: z.number(),
  makerOrderDirection: z.string(),
  baseAssetAmount: z.string(),
  quoteAssetAmount: z.string(),
  fillPrice: z.string(),
  action: z.string(),
  actionExplanation: z.string(),
  txSig: z.string(),
  slot: z.number(),
  ts: z.number(),
});

/**
 * Funding rate response schema (/fundingRate)
 */
const DriftFundingRateSchema = z.object({
  marketIndex: z.number(),
  fundingRate: z.string(),
  fundingRateLong: z.string(),
  fundingRateShort: z.string(),
  cumulativeFundingRateLong: z.string(),
  cumulativeFundingRateShort: z.string(),
  oraclePrice: z.string(),
  markPriceTwap: z.string(),
  ts: z.number(),
});

/**
 * Funding rate history response schema (/fundingRateHistory)
 */
const DriftFundingRateRecordSchema = z.object({
  recordId: z.string(),
  marketIndex: z.number(),
  fundingRate: z.string(),
  fundingRateLong: z.string(),
  fundingRateShort: z.string(),
  cumulativeFundingRateLong: z.string(),
  cumulativeFundingRateShort: z.string(),
  oraclePriceTwap: z.string(),
  markPriceTwap: z.string(),
  periodRevenue: z.string(),
  baseAssetAmountWithAmm: z.string(),
  baseAssetAmountWithUnsettledLp: z.string(),
  ts: z.number(),
});

/**
 * Drift Mainnet DLOB API Specification
 */
export const driftSpec: APISpecification = {
  exchange: 'drift',
  baseUrl: DRIFT_MAINNET_DLOB_API,
  version: '1.0.0',
  lastUpdated: '2026-02-14',
  endpoints: [
    {
      id: 'drift.fetchOrderBook',
      path: '/l2',
      method: 'GET',
      requiresAuth: false,
      responseSchema: DriftL2OrderBookSchema,
      rateLimit: 2,
      expectedResponseTime: 500,
      description: 'Fetch L2 order book (requires marketIndex and marketType query params)',
    },
    {
      id: 'drift.fetchTrades',
      path: '/trades',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(DriftTradeSchema),
      rateLimit: 1,
      expectedResponseTime: 500,
      description: 'Fetch recent trades (requires marketIndex and marketType query params)',
    },
    {
      id: 'drift.fetchFundingRate',
      path: '/fundingRate',
      method: 'GET',
      requiresAuth: false,
      responseSchema: DriftFundingRateSchema,
      rateLimit: 1,
      expectedResponseTime: 400,
      description: 'Fetch current funding rate (requires marketIndex query param)',
    },
    {
      id: 'drift.fetchFundingRateHistory',
      path: '/fundingRateHistory',
      method: 'GET',
      requiresAuth: false,
      responseSchema: z.array(DriftFundingRateRecordSchema),
      rateLimit: 1,
      expectedResponseTime: 600,
      description: 'Fetch historical funding rates (requires marketIndex query param)',
    },
  ],
};

/**
 * Drift Devnet DLOB API Specification
 */
export const driftDevnetSpec: APISpecification = {
  ...driftSpec,
  baseUrl: DRIFT_DEVNET_DLOB_API,
  exchange: 'drift-devnet',
};

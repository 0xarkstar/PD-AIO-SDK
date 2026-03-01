/**
 * Ostium Exchange-Specific Types
 */

import { z } from 'zod';
import type { ExchangeConfig } from '../../types/adapter.js';

export interface OstiumConfig extends ExchangeConfig {
  /** Arbitrum RPC URL */
  rpcUrl?: string;
  /** EVM private key for signing transactions */
  privateKey?: string;
  /** Subgraph URL */
  subgraphUrl?: string;
  /** Metadata API URL */
  metadataUrl?: string;
  /** Referral/builder address for Ostium fee attribution (Ethereum address) */
  referralAddress?: string;
}

// --- Market Types ---

export interface OstiumPairInfo {
  pairIndex: number;
  name: string;
  from: string;
  to: string;
  groupIndex: number;
  groupName: string;
  spreadP: string;
  maxLeverage: number;
  minLeverage: number;
  maxPositionSize: string;
  minPositionSize: string;
  feedId: string;
}

export interface OstiumPriceResponse {
  pair: string;
  price: string;
  timestamp: number;
  source: string;
  // Additional fields that may be present in actual API responses
  mid?: string | number;
  bid?: string | number;
  ask?: string | number;
  timestampSeconds?: number;
}

// --- Contract Types ---

export interface OstiumTradeParams {
  pairIndex: number;
  positionSizeDai: string;
  openPrice: string;
  buy: boolean;
  leverage: number;
  tp: string;
  sl: string;
  referral: string;
}

export interface OstiumOpenTrade {
  trader: string;
  pairIndex: number;
  index: number;
  positionSizeDai: string;
  openPrice: string;
  buy: boolean;
  leverage: number;
  tp: string;
  sl: string;
  timestamp: number;
}

// --- Subgraph Types ---

export interface OstiumSubgraphTrade {
  id: string;
  trader: string;
  pairIndex: string;
  action: string;
  price: string;
  size: string;
  buy: boolean;
  leverage: string;
  pnl: string;
  timestamp: string;
  txHash: string;
}

export interface OstiumSubgraphPosition {
  id: string;
  trader: string;
  pairIndex: string;
  index: string;
  positionSizeDai: string;
  openPrice: string;
  buy: boolean;
  leverage: string;
  tp: string;
  sl: string;
  timestamp: string;
}

// --- Contract ABI Fragment Types ---

export interface OstiumContractAddresses {
  trading: string;
  storage: string;
  pairInfo: string;
  nftRewards: string;
  vault: string;
  collateral: string;
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

export const OstiumPairInfoSchema = z
  .object({
    pairIndex: z.number(),
    name: z.string(),
    from: z.string(),
    to: z.string(),
    groupIndex: z.number(),
    groupName: z.string(),
    spreadP: z.string(),
    maxLeverage: z.number(),
    minLeverage: z.number(),
    maxPositionSize: z.string(),
    minPositionSize: z.string(),
    feedId: z.string(),
  })
  .passthrough();

export const OstiumPriceResponseSchema = z
  .object({
    pair: z.string(),
    price: z.string(),
    timestamp: z.number(),
    source: z.string(),
    mid: z.union([z.string(), z.number()]).optional(),
    bid: z.union([z.string(), z.number()]).optional(),
    ask: z.union([z.string(), z.number()]).optional(),
    timestampSeconds: z.number().optional(),
  })
  .passthrough();

export const OstiumOpenTradeSchema = z
  .object({
    trader: z.string(),
    pairIndex: z.number(),
    index: z.number(),
    positionSizeDai: z.string(),
    openPrice: z.string(),
    buy: z.boolean(),
    leverage: z.number(),
    tp: z.string(),
    sl: z.string(),
    timestamp: z.number(),
  })
  .passthrough();

export const OstiumSubgraphTradeSchema = z
  .object({
    id: z.string(),
    trader: z.string(),
    pairIndex: z.string(),
    action: z.string(),
    price: z.string(),
    size: z.string(),
    buy: z.boolean(),
    leverage: z.string(),
    pnl: z.string(),
    timestamp: z.string(),
    txHash: z.string(),
  })
  .passthrough();

export const OstiumSubgraphPositionSchema = z
  .object({
    id: z.string(),
    trader: z.string(),
    pairIndex: z.string(),
    index: z.string(),
    positionSizeDai: z.string(),
    openPrice: z.string(),
    buy: z.boolean(),
    leverage: z.string(),
    tp: z.string(),
    sl: z.string(),
    timestamp: z.string(),
  })
  .passthrough();

/**
 * Avantis Exchange-Specific Types
 */

import { z } from 'zod';
import type { ExchangeConfig } from '../../types/adapter.js';

// =============================================================================
// Config
// =============================================================================

export interface AvantisConfig extends ExchangeConfig {
  /** Ethereum wallet private key for on-chain transactions */
  privateKey?: string;
  /** RPC URL for Base chain */
  rpcUrl?: string;
  /** Override trading contract address */
  contractAddress?: string;
}

// =============================================================================
// On-chain Pair Info
// =============================================================================

export interface AvantisPairInfo {
  pairIndex: number;
  from: string;
  to: string;
  spreadP: string;
  groupIndex: number;
  feeIndex: number;
}

export const AvantisPairInfoSchema = z
  .object({
    pairIndex: z.number(),
    from: z.string(),
    to: z.string(),
    spreadP: z.string(),
    groupIndex: z.number(),
    feeIndex: z.number(),
  })
  .passthrough();

// =============================================================================
// On-chain Trade (Position)
// =============================================================================

export interface AvantisOpenTrade {
  trader: string;
  pairIndex: number;
  index: number;
  initialPosToken: string;
  positionSizeDai: string;
  openPrice: string;
  buy: boolean;
  leverage: string;
  tp: string;
  sl: string;
}

export const AvantisOpenTradeSchema = z
  .object({
    trader: z.string(),
    pairIndex: z.number(),
    index: z.number(),
    initialPosToken: z.string(),
    positionSizeDai: z.string(),
    openPrice: z.string(),
    buy: z.boolean(),
    leverage: z.string(),
    tp: z.string(),
    sl: z.string(),
  })
  .passthrough();

// =============================================================================
// Open Limit Order
// =============================================================================

export interface AvantisOpenLimitOrder {
  trader: string;
  pairIndex: number;
  index: number;
  positionSize: string;
  buy: boolean;
  leverage: string;
  tp: string;
  sl: string;
  minPrice: string;
  maxPrice: string;
  block: number;
  tokenId: number;
}

export const AvantisOpenLimitOrderSchema = z
  .object({
    trader: z.string(),
    pairIndex: z.number(),
    index: z.number(),
    positionSize: z.string(),
    buy: z.boolean(),
    leverage: z.string(),
    tp: z.string(),
    sl: z.string(),
    minPrice: z.string(),
    maxPrice: z.string(),
    block: z.number(),
    tokenId: z.number(),
  })
  .passthrough();

// =============================================================================
// Pyth Oracle Price
// =============================================================================

export interface AvantisPythPrice {
  price: string;
  conf: string;
  expo: number;
  publishTime: number;
}

export const AvantisPythPriceSchema = z
  .object({
    price: z.string(),
    conf: z.string(),
    expo: z.number(),
    publishTime: z.number(),
  })
  .passthrough();

// =============================================================================
// Funding Fees
// =============================================================================

export interface AvantisFundingFees {
  accPerOiLong: string;
  accPerOiShort: string;
  lastUpdateBlock: number;
}

export const AvantisFundingFeesSchema = z
  .object({
    accPerOiLong: z.string(),
    accPerOiShort: z.string(),
    lastUpdateBlock: z.number(),
  })
  .passthrough();

// =============================================================================
// Order Params (for building transactions)
// =============================================================================

export interface AvantisOrderParams {
  trader: string;
  pairIndex: number;
  index: number;
  initialPosToken: number;
  positionSizeDai: string;
  openPrice: string;
  buy: boolean;
  leverage: number;
  tp: string;
  sl: string;
}

export const AvantisOrderParamsSchema = z
  .object({
    trader: z.string(),
    pairIndex: z.number(),
    index: z.number(),
    initialPosToken: z.number(),
    positionSizeDai: z.string(),
    openPrice: z.string(),
    buy: z.boolean(),
    leverage: z.number(),
    tp: z.string(),
    sl: z.string(),
  })
  .passthrough();

// =============================================================================
// Balance Info
// =============================================================================

export interface AvantisBalance {
  asset: string;
  balance: string;
  decimals: number;
}

export const AvantisBalanceSchema = z
  .object({
    asset: z.string(),
    balance: z.string(),
    decimals: z.number(),
  })
  .passthrough();

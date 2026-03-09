/**
 * Reya Exchange-Specific Types
 */

import { z } from 'zod';
import type { ExchangeConfig } from '../../types/adapter.js';

export interface ReyaConfig extends ExchangeConfig {
  /** Ethereum wallet private key for signing */
  privateKey?: string;
  /** Account ID for trading */
  accountId?: number;
  /** Exchange ID (default: 1 for perps) */
  exchangeId?: number;
}

// --- API Response Types ---

export interface ReyaMarketDefinition {
  symbol: string;
  marketId: number;
  minOrderQty: string;
  qtyStepSize: string;
  tickSize: string;
  liquidationMarginParameter: string;
  initialMarginParameter: string;
  maxLeverage: number;
  oiCap: string;
}

export const ReyaMarketDefinitionSchema = z
  .object({
    symbol: z.string(),
    marketId: z.number(),
    minOrderQty: z.string(),
    qtyStepSize: z.string(),
    tickSize: z.string(),
    liquidationMarginParameter: z.string(),
    initialMarginParameter: z.string(),
    maxLeverage: z.number(),
    oiCap: z.string(),
  })
  .passthrough();

export interface ReyaMarketSummary {
  symbol: string;
  updatedAt: number;
  longOiQty: string;
  shortOiQty: string;
  oiQty: string;
  fundingRate: string;
  longFundingValue: string;
  shortFundingValue: string;
  fundingRateVelocity: string;
  volume24h: string;
  pxChange24h?: string;
  throttledOraclePrice?: string;
  throttledPoolPrice?: string;
  pricesUpdatedAt?: number;
}

export const ReyaMarketSummarySchema = z
  .object({
    symbol: z.string(),
    updatedAt: z.number(),
    longOiQty: z.string(),
    shortOiQty: z.string(),
    oiQty: z.string(),
    fundingRate: z.string(),
    longFundingValue: z.string(),
    shortFundingValue: z.string(),
    fundingRateVelocity: z.string(),
    volume24h: z.string(),
    pxChange24h: z.string().optional(),
    throttledOraclePrice: z.string().optional(),
    throttledPoolPrice: z.string().optional(),
    pricesUpdatedAt: z.number().optional(),
  })
  .passthrough();

export interface ReyaPrice {
  symbol: string;
  oraclePrice: string;
  poolPrice?: string;
  updatedAt: number;
}

export const ReyaPriceSchema = z
  .object({
    symbol: z.string(),
    oraclePrice: z.string(),
    poolPrice: z.string().optional(),
    updatedAt: z.number(),
  })
  .passthrough();

export interface ReyaDepthLevel {
  px: string;
  qty: string;
}

export const ReyaDepthLevelSchema = z
  .object({
    px: z.string(),
    qty: z.string(),
  })
  .passthrough();

export interface ReyaDepth {
  symbol: string;
  type: 'SNAPSHOT' | 'UPDATE';
  bids: ReyaDepthLevel[];
  asks: ReyaDepthLevel[];
  updatedAt: number;
}

export const ReyaDepthSchema = z
  .object({
    symbol: z.string(),
    type: z.enum(['SNAPSHOT', 'UPDATE']),
    bids: z.array(ReyaDepthLevelSchema),
    asks: z.array(ReyaDepthLevelSchema),
    updatedAt: z.number(),
  })
  .passthrough();

export interface ReyaPerpExecution {
  exchangeId: number;
  symbol: string;
  accountId: number;
  qty: string;
  side: 'B' | 'A';
  price: string;
  fee: string;
  type: 'ORDER_MATCH' | 'LIQUIDATION' | 'ADL';
  timestamp: number;
  sequenceNumber: number;
}

export const ReyaPerpExecutionSchema = z
  .object({
    exchangeId: z.number(),
    symbol: z.string(),
    accountId: z.number(),
    qty: z.string(),
    side: z.enum(['B', 'A']),
    price: z.string(),
    fee: z.string(),
    type: z.enum(['ORDER_MATCH', 'LIQUIDATION', 'ADL']),
    timestamp: z.number(),
    sequenceNumber: z.number(),
  })
  .passthrough();

export interface ReyaOrder {
  exchangeId: number;
  symbol: string;
  accountId: number;
  orderId: string;
  qty?: string;
  execQty?: string;
  cumQty?: string;
  side: 'B' | 'A';
  limitPx: string;
  orderType: 'LIMIT' | 'TP' | 'SL';
  triggerPx?: string;
  timeInForce?: 'IOC' | 'GTC';
  reduceOnly?: boolean;
  status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  createdAt: number;
  lastUpdateAt: number;
}

export const ReyaOrderSchema = z
  .object({
    exchangeId: z.number(),
    symbol: z.string(),
    accountId: z.number(),
    orderId: z.string(),
    qty: z.string().optional(),
    execQty: z.string().optional(),
    cumQty: z.string().optional(),
    side: z.enum(['B', 'A']),
    limitPx: z.string(),
    orderType: z.enum(['LIMIT', 'TP', 'SL']),
    triggerPx: z.string().optional(),
    timeInForce: z.enum(['IOC', 'GTC']).optional(),
    reduceOnly: z.boolean().optional(),
    status: z.enum(['OPEN', 'FILLED', 'CANCELLED', 'REJECTED']),
    createdAt: z.number(),
    lastUpdateAt: z.number(),
  })
  .passthrough();

export interface ReyaPosition {
  exchangeId: number;
  symbol: string;
  accountId: number;
  qty: string;
  side: 'B' | 'A';
  avgEntryPrice: string;
  avgEntryFundingValue: string;
  lastTradeSequenceNumber: number;
}

export const ReyaPositionSchema = z
  .object({
    exchangeId: z.number(),
    symbol: z.string(),
    accountId: z.number(),
    qty: z.string(),
    side: z.enum(['B', 'A']),
    avgEntryPrice: z.string(),
    avgEntryFundingValue: z.string(),
    lastTradeSequenceNumber: z.number(),
  })
  .passthrough();

export interface ReyaAccountBalance {
  accountId: number;
  asset: string;
  realBalance: string;
  balanceDEPRECATED: string;
}

export const ReyaAccountBalanceSchema = z
  .object({
    accountId: z.number(),
    asset: z.string(),
    realBalance: z.string(),
    balanceDEPRECATED: z.string(),
  })
  .passthrough();

export interface ReyaAccount {
  accountId: number;
  name: string;
  type: 'MAINPERP' | 'SUBPERP' | 'SPOT';
}

export const ReyaAccountSchema = z
  .object({
    accountId: z.number(),
    name: z.string(),
    type: z.enum(['MAINPERP', 'SUBPERP', 'SPOT']),
  })
  .passthrough();

export interface ReyaCandleHistoryData {
  t: number[];
  o: string[];
  h: string[];
  l: string[];
  c: string[];
}

export const ReyaCandleHistoryDataSchema = z
  .object({
    t: z.array(z.number()),
    o: z.array(z.string()),
    h: z.array(z.string()),
    l: z.array(z.string()),
    c: z.array(z.string()),
  })
  .passthrough();

export interface ReyaCreateOrderRequest {
  exchangeId: number;
  symbol?: string;
  accountId: number;
  isBuy: boolean;
  limitPx: string;
  qty?: string;
  orderType: 'LIMIT' | 'TP' | 'SL';
  timeInForce?: 'IOC' | 'GTC';
  triggerPx?: string;
  reduceOnly?: boolean;
  signature: string;
  nonce: string;
  signerWallet: string;
  expiresAfter?: number;
  clientOrderId?: number;
}

export interface ReyaCreateOrderResponse {
  status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  execQty?: string;
  cumQty?: string;
  orderId?: string;
  clientOrderId?: number;
}

export const ReyaCreateOrderResponseSchema = z
  .object({
    status: z.enum(['OPEN', 'FILLED', 'CANCELLED', 'REJECTED']),
    execQty: z.string().optional(),
    cumQty: z.string().optional(),
    orderId: z.string().optional(),
    clientOrderId: z.number().optional(),
  })
  .passthrough();

export interface ReyaCancelOrderResponse {
  status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  orderId: string;
  clientOrderId?: number;
}

export const ReyaCancelOrderResponseSchema = z
  .object({
    status: z.enum(['OPEN', 'FILLED', 'CANCELLED', 'REJECTED']),
    orderId: z.string(),
    clientOrderId: z.number().optional(),
  })
  .passthrough();

export interface ReyaMassCancelResponse {
  cancelledCount: number;
}

export const ReyaMassCancelResponseSchema = z
  .object({
    cancelledCount: z.number(),
  })
  .passthrough();

export interface ReyaPerpExecutionList {
  data: ReyaPerpExecution[];
  meta: {
    limit: number;
    count: number;
    endTime?: number;
    startTime?: number;
  };
}

export const ReyaPerpExecutionListSchema = z
  .object({
    data: z.array(ReyaPerpExecutionSchema),
    meta: z
      .object({
        limit: z.number(),
        count: z.number(),
        endTime: z.number().optional(),
        startTime: z.number().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export interface ReyaAssetDefinition {
  asset: string;
  spotMarketSymbol?: string;
  priceHaircut: string;
  liquidationDiscount: string;
  status: 'ENABLED' | 'WITHDRAWAL_ONLY';
  decimals: number;
  displayDecimals: number;
}

export const ReyaAssetDefinitionSchema = z
  .object({
    asset: z.string(),
    spotMarketSymbol: z.string().optional(),
    priceHaircut: z.string(),
    liquidationDiscount: z.string(),
    status: z.enum(['ENABLED', 'WITHDRAWAL_ONLY']),
    decimals: z.number(),
    displayDecimals: z.number(),
  })
  .passthrough();

export interface ReyaFeeTierParameters {
  tierId: number;
  takerFee: string;
  makerFee: string;
  volume14d: string;
  tierType: 'REGULAR' | 'VIP';
}

export const ReyaFeeTierParametersSchema = z
  .object({
    tierId: z.number(),
    takerFee: z.string(),
    makerFee: z.string(),
    volume14d: z.string(),
    tierType: z.enum(['REGULAR', 'VIP']),
  })
  .passthrough();

export interface ReyaRequestError {
  error: string;
  message: string;
}

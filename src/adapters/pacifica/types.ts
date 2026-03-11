/**
 * Pacifica Exchange-Specific Types
 *
 * Based on real API responses from https://api.pacifica.fi/api/v1
 * @see https://docs.pacifica.fi/api-documentation/api/rest-api
 */

import { z } from 'zod';
import type { ExchangeConfig } from '../../types/adapter.js';

export interface PacificaConfig extends ExchangeConfig {
  apiKey?: string;
  apiSecret?: string;
  testnet?: boolean;
  timeout?: number;
  builderCode?: string;
  maxBuilderFeeRate?: number;
}

/**
 * Wrapper for all Pacifica API responses: { success: boolean, data: T }
 */
export interface PacificaApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * GET /info — market info
 * Real fields: symbol, tick_size, lot_size, max_leverage, funding_rate,
 * next_funding_rate, min_order_size, max_order_size, isolated_only, created_at
 */
export interface PacificaMarket {
  symbol: string;
  tick_size: string;
  lot_size: string;
  min_tick: string;
  max_tick: string;
  max_leverage: number;
  isolated_only: boolean;
  min_order_size: string;
  max_order_size: string;
  funding_rate: string;
  next_funding_rate: string;
  created_at: number;
}

/**
 * GET /info/prices — live price data
 * Real fields: symbol, mark, mid, oracle, funding, next_funding,
 * open_interest, volume_24h, yesterday_price, timestamp
 */
export interface PacificaTicker {
  symbol: string;
  mark: string;
  mid: string;
  oracle: string;
  funding: string;
  next_funding: string;
  open_interest: string;
  volume_24h: string;
  yesterday_price: string;
  timestamp: number;
}

export interface PacificaOrderBookLevel {
  p: string;
  a: string;
  n: number;
}

/**
 * GET /book?symbol=X — orderbook
 * Real format: { success: true, data: { s: "BTC", l: [[bids], [asks]], t: timestamp } }
 * Each level: { p: price, a: amount, n: numOrders }
 */
export interface PacificaOrderBook {
  s: string;
  l: PacificaOrderBookLevel[][];
  t: number;
}

/**
 * GET /trades?symbol=X — recent trade fills
 * Real fields: event_type, price, amount, side, cause, created_at
 */
export interface PacificaTradeResponse {
  event_type: string;
  price: string;
  amount: string;
  side: string;
  cause: string;
  created_at: number;
}

/**
 * GET /funding_rate/history?symbol=X — funding rate history
 * Real fields: oracle_price, bid_impact_price, ask_impact_price,
 * funding_rate, next_funding_rate, created_at
 */
export interface PacificaFundingHistory {
  oracle_price: string;
  bid_impact_price: string;
  ask_impact_price: string;
  funding_rate: string;
  next_funding_rate: string;
  created_at: number;
}

export interface PacificaOrderResponse {
  order_id: string;
  client_order_id?: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  price?: string;
  size: string;
  filled_size: string;
  avg_fill_price?: string;
  status: 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
  reduce_only: boolean;
  post_only: boolean;
  created_at: number;
  updated_at: number;
}

export interface PacificaPosition {
  symbol: string;
  side: 'long' | 'short';
  size: string;
  entry_price: string;
  mark_price: string;
  liquidation_price: string;
  unrealized_pnl: string;
  realized_pnl: string;
  leverage: number;
  margin_mode: 'cross' | 'isolated';
  margin: string;
  maintenance_margin: string;
  timestamp: number;
}

export interface PacificaAccountInfo {
  total_equity: string;
  available_balance: string;
  used_margin: string;
  unrealized_pnl: string;
  currency: string;
}

export interface PacificaBuilderCodeRequest {
  type: 'approve_builder_code';
  builder_code: string;
  max_fee_rate: number;
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

export const PacificaApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
  });

export const PacificaMarketSchema = z
  .object({
    symbol: z.string(),
    tick_size: z.string(),
    lot_size: z.string(),
    min_tick: z.string().optional(),
    max_tick: z.string().optional(),
    max_leverage: z.number(),
    isolated_only: z.boolean().optional(),
    min_order_size: z.string().optional(),
    max_order_size: z.string().optional(),
    funding_rate: z.string().optional(),
    next_funding_rate: z.string().optional(),
    created_at: z.number().optional(),
  })
  .passthrough();

export const PacificaTickerSchema = z
  .object({
    symbol: z.string(),
    mark: z.string(),
    mid: z.string(),
    oracle: z.string(),
    funding: z.string(),
    next_funding: z.string(),
    open_interest: z.string(),
    volume_24h: z.string(),
    yesterday_price: z.string(),
    timestamp: z.number(),
  })
  .passthrough();

export const PacificaOrderBookLevelSchema = z
  .object({
    p: z.string(),
    a: z.string(),
    n: z.number(),
  })
  .passthrough();

export const PacificaOrderBookSchema = z
  .object({
    s: z.string(),
    l: z.array(z.array(PacificaOrderBookLevelSchema)),
    t: z.number(),
  })
  .passthrough();

export const PacificaTradeResponseSchema = z
  .object({
    event_type: z.string(),
    price: z.union([z.string(), z.number()]),
    amount: z.union([z.string(), z.number()]),
    side: z.string(),
    cause: z.string().optional(),
    created_at: z.number(),
  })
  .passthrough();

export const PacificaFundingHistorySchema = z
  .object({
    oracle_price: z.string(),
    bid_impact_price: z.string().optional(),
    ask_impact_price: z.string().optional(),
    funding_rate: z.string(),
    next_funding_rate: z.string().optional(),
    created_at: z.number(),
  })
  .passthrough();

export const PacificaOrderResponseSchema = z
  .object({
    order_id: z.string(),
    client_order_id: z.string().optional(),
    symbol: z.string(),
    side: z.string(),
    type: z.string(),
    price: z.union([z.string(), z.number()]).optional(),
    size: z.union([z.string(), z.number()]),
    filled_size: z.union([z.string(), z.number()]),
    avg_fill_price: z.union([z.string(), z.number()]).optional(),
    status: z.string(),
    reduce_only: z.boolean(),
    post_only: z.boolean(),
    created_at: z.number(),
    updated_at: z.number(),
  })
  .passthrough();

export const PacificaPositionSchema = z
  .object({
    symbol: z.string(),
    side: z.string(),
    size: z.union([z.string(), z.number()]),
    entry_price: z.union([z.string(), z.number()]),
    mark_price: z.union([z.string(), z.number()]),
    liquidation_price: z.union([z.string(), z.number()]),
    unrealized_pnl: z.union([z.string(), z.number()]),
    realized_pnl: z.union([z.string(), z.number()]),
    leverage: z.number(),
    margin_mode: z.string(),
    margin: z.union([z.string(), z.number()]),
    maintenance_margin: z.union([z.string(), z.number()]),
    timestamp: z.number(),
  })
  .passthrough();

export const PacificaAccountInfoSchema = z
  .object({
    total_equity: z.string(),
    available_balance: z.string(),
    used_margin: z.string(),
    unrealized_pnl: z.string(),
    currency: z.string(),
  })
  .passthrough();

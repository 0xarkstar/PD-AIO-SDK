/**
 * Pacifica Exchange-Specific Types
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

export interface PacificaMarket {
  symbol: string;
  base_currency: string;
  quote_currency: string;
  status: string;
  price_step: string;
  size_step: string;
  min_size: string;
  max_leverage: number;
  maker_fee: string;
  taker_fee: string;
  funding_interval: number;
}

export interface PacificaTicker {
  symbol: string;
  last_price: string;
  mark_price: string;
  index_price: string;
  bid_price: string;
  ask_price: string;
  high_24h: string;
  low_24h: string;
  volume_24h: string;
  quote_volume_24h: string;
  open_interest: string;
  funding_rate: string;
  next_funding_time: number;
  timestamp: number;
}

export interface PacificaOrderBookLevel {
  price: string;
  size: string;
}

export interface PacificaOrderBook {
  bids: PacificaOrderBookLevel[];
  asks: PacificaOrderBookLevel[];
  timestamp: number;
  sequence: number;
}

export interface PacificaTradeResponse {
  id: string;
  symbol: string;
  price: string;
  size: string;
  side: 'buy' | 'sell';
  timestamp: number;
}

export interface PacificaFundingHistory {
  symbol: string;
  funding_rate: string;
  mark_price: string;
  index_price: string;
  timestamp: number;
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

export const PacificaMarketSchema = z
  .object({
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
  })
  .passthrough();

export const PacificaTickerSchema = z
  .object({
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
  })
  .passthrough();

export const PacificaOrderBookLevelSchema = z
  .object({
    price: z.string(),
    size: z.string(),
  })
  .passthrough();

export const PacificaOrderBookSchema = z
  .object({
    bids: z.array(PacificaOrderBookLevelSchema),
    asks: z.array(PacificaOrderBookLevelSchema),
    timestamp: z.number(),
    sequence: z.number(),
  })
  .passthrough();

export const PacificaTradeResponseSchema = z
  .object({
    id: z.string(),
    symbol: z.string(),
    price: z.union([z.string(), z.number()]),
    size: z.union([z.string(), z.number()]),
    side: z.string(),
    timestamp: z.number(),
  })
  .passthrough();

export const PacificaFundingHistorySchema = z
  .object({
    symbol: z.string(),
    funding_rate: z.string(),
    mark_price: z.string(),
    index_price: z.string(),
    timestamp: z.number(),
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

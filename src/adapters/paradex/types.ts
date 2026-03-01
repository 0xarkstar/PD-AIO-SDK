/**
 * Paradex-specific type definitions
 */

import { z } from 'zod';

/**
 * Paradex adapter configuration
 */
export interface ParadexConfig {
  apiKey?: string;
  apiSecret?: string;
  privateKey?: string;
  starkPrivateKey?: string;
  testnet?: boolean;
  rateLimitTier?: 'default' | 'premium';
}

/**
 * Paradex authentication configuration (alias for compatibility)
 */
export type ParadexAuthConfig = ParadexConfig;

/**
 * Paradex market response
 */
export interface ParadexMarket {
  symbol: string;
  base_currency: string;
  quote_currency: string;
  settlement_currency: string;
  status: string;
  min_order_size: string;
  max_order_size: string;
  tick_size: string;
  step_size: string;
  maker_fee_rate: string;
  taker_fee_rate: string;
  max_leverage: string;
  is_active: boolean;
}

export const ParadexMarketSchema = z
  .object({
    symbol: z.string(),
    base_currency: z.string(),
    quote_currency: z.string(),
    settlement_currency: z.string(),
    status: z.string(),
    min_order_size: z.string(),
    max_order_size: z.string(),
    tick_size: z.string(),
    step_size: z.string(),
    maker_fee_rate: z.string(),
    taker_fee_rate: z.string(),
    max_leverage: z.string(),
    is_active: z.boolean(),
  })
  .passthrough();

/**
 * Paradex order response
 */
export interface ParadexOrder {
  id: string;
  client_id?: string;
  market: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'LIMIT_MAKER';
  size: string;
  price?: string;
  filled_size: string;
  avg_fill_price?: string;
  status: 'PENDING' | 'OPEN' | 'PARTIAL' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  time_in_force: 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';
  post_only: boolean;
  reduce_only: boolean;
  created_at: number;
  updated_at: number;
}

export const ParadexOrderSchema = z
  .object({
    id: z.string(),
    client_id: z.string().optional(),
    market: z.string(),
    side: z.string(),
    type: z.string(),
    size: z.string(),
    price: z.string().optional(),
    filled_size: z.string(),
    avg_fill_price: z.string().optional(),
    status: z.string(),
    time_in_force: z.string(),
    post_only: z.boolean(),
    reduce_only: z.boolean(),
    created_at: z.number(),
    updated_at: z.number(),
  })
  .passthrough();

/**
 * Paradex position response
 */
export interface ParadexPosition {
  market: string;
  side: 'LONG' | 'SHORT';
  size: string;
  entry_price: string;
  mark_price: string;
  liquidation_price?: string;
  unrealized_pnl: string;
  realized_pnl: string;
  margin: string;
  leverage: string;
  last_updated: number;
}

export const ParadexPositionSchema = z
  .object({
    market: z.string(),
    side: z.string(),
    size: z.string(),
    entry_price: z.string(),
    mark_price: z.string(),
    liquidation_price: z.string().optional(),
    unrealized_pnl: z.string(),
    realized_pnl: z.string(),
    margin: z.string(),
    leverage: z.string(),
    last_updated: z.number(),
  })
  .passthrough();

/**
 * Paradex balance response
 */
export interface ParadexBalance {
  asset: string;
  total: string;
  available: string;
  locked: string;
}

export const ParadexBalanceSchema = z
  .object({
    asset: z.string(),
    total: z.string(),
    available: z.string(),
    locked: z.string(),
  })
  .passthrough();

/**
 * Paradex order book response
 */
export interface ParadexOrderBook {
  market: string;
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number;
  sequence: number;
}

export const ParadexOrderBookSchema = z
  .object({
    market: z.string(),
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
    timestamp: z.number(),
    sequence: z.number(),
  })
  .passthrough();

/**
 * Paradex trade response
 */
export interface ParadexTrade {
  id: string;
  market: string;
  side: 'BUY' | 'SELL';
  price: string;
  size: string;
  timestamp: number;
}

export const ParadexTradeSchema = z
  .object({
    id: z.string(),
    market: z.string(),
    side: z.string(),
    price: z.string(),
    size: z.string(),
    timestamp: z.number(),
  })
  .passthrough();

/**
 * Paradex ticker response
 */
export interface ParadexTicker {
  market: string;
  last_price: string;
  bid: string;
  ask: string;
  high_24h: string;
  low_24h: string;
  volume_24h: string;
  price_change_24h: string;
  price_change_percent_24h: string;
  timestamp: number;
}

export const ParadexTickerSchema = z
  .object({
    market: z.string(),
    last_price: z.string(),
    bid: z.string(),
    ask: z.string(),
    high_24h: z.string(),
    low_24h: z.string(),
    volume_24h: z.string(),
    price_change_24h: z.string(),
    price_change_percent_24h: z.string(),
    timestamp: z.number(),
  })
  .passthrough();

/**
 * Paradex funding rate response
 */
export interface ParadexFundingRate {
  market: string;
  rate: string;
  timestamp: number;
  next_funding_time: number;
  mark_price: string;
  index_price: string;
}

export const ParadexFundingRateSchema = z
  .object({
    market: z.string(),
    rate: z.string(),
    timestamp: z.number(),
    next_funding_time: z.number(),
    mark_price: z.string(),
    index_price: z.string(),
  })
  .passthrough();

/**
 * Paradex API market response (actual API format)
 * Extends the legacy ParadexMarket with additional fields from the real API.
 */
export interface ParadexAPIMarket {
  symbol: string;
  base_currency: string;
  quote_currency: string;
  settlement_currency: string;
  status?: string;
  is_active?: boolean;
  open_at?: number;

  // New API format fields
  price_tick_size?: string;
  order_size_increment?: string;
  min_notional?: string;
  funding_period_hours?: number;
  fee_config?: {
    api_fee?: {
      maker_fee?: { fee?: string };
      taker_fee?: { fee?: string };
    };
  };
  delta1_cross_margin_params?: {
    imf_base?: string;
  };

  // Legacy SDK format fields (backward compatible)
  tick_size?: string;
  step_size?: string;
  min_order_size?: string;
  max_order_size?: string;
  maker_fee_rate?: string;
  taker_fee_rate?: string;
  max_leverage?: string;
}

export const ParadexAPIMarketSchema = z
  .object({
    symbol: z.string(),
    base_currency: z.string(),
    quote_currency: z.string(),
    settlement_currency: z.string(),
    status: z.string().optional(),
    is_active: z.boolean().optional(),
    open_at: z.number().optional(),
    price_tick_size: z.string().optional(),
    order_size_increment: z.string().optional(),
    min_notional: z.string().optional(),
    funding_period_hours: z.number().optional(),
    fee_config: z
      .object({
        api_fee: z
          .object({
            maker_fee: z.object({ fee: z.string().optional() }).passthrough().optional(),
            taker_fee: z.object({ fee: z.string().optional() }).passthrough().optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .optional(),
    delta1_cross_margin_params: z
      .object({
        imf_base: z.string().optional(),
      })
      .passthrough()
      .optional(),
    tick_size: z.string().optional(),
    step_size: z.string().optional(),
    min_order_size: z.string().optional(),
    max_order_size: z.string().optional(),
    maker_fee_rate: z.string().optional(),
    taker_fee_rate: z.string().optional(),
    max_leverage: z.string().optional(),
  })
  .passthrough();

/**
 * Paradex JWT token response
 */
export interface ParadexJWT {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Paradex order sign payload
 */
export interface ParadexOrderSignPayload {
  market: string;
  side: 'BUY' | 'SELL';
  order_type: string;
  size: string;
  price: string;
  time_in_force: string;
  reduce_only: boolean;
  post_only: boolean;
  client_id?: string;
  expiry: number;
}

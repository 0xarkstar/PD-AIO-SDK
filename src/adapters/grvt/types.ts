/**
 * GRVT-specific type definitions
 */

/**
 * GRVT API response wrapper
 */
export interface GRVTResponse<T> {
  result: T;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * GRVT market information
 */
export interface GRVTMarket {
  instrument_id: string;
  instrument: string;
  base_currency: string;
  quote_currency: string;
  settlement_currency: string;
  instrument_type: 'PERP' | 'SPOT';
  is_active: boolean;
  maker_fee: string;
  taker_fee: string;
  max_leverage: string;
  min_size: string;
  max_size: string;
  tick_size: string;
  step_size: string;
  mark_price: string;
  index_price: string;
  funding_rate?: string;
  next_funding_time?: number;
  open_interest?: string;
}

/**
 * GRVT order book snapshot
 */
export interface GRVTOrderBook {
  instrument: string;
  bids: Array<[string, string]>; // [price, size]
  asks: Array<[string, string]>;
  timestamp: number;
  sequence: number;
}

/**
 * GRVT order
 */
export interface GRVTOrder {
  order_id: string;
  client_order_id?: string;
  instrument: string;
  order_type: 'MARKET' | 'LIMIT' | 'LIMIT_MAKER';
  side: 'BUY' | 'SELL';
  size: string;
  price?: string;
  time_in_force: 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';
  reduce_only: boolean;
  post_only: boolean;
  status: 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  filled_size: string;
  average_fill_price?: string;
  created_at: number;
  updated_at: number;
}

/**
 * GRVT position
 */
export interface GRVTPosition {
  instrument: string;
  side: 'LONG' | 'SHORT';
  size: string;
  entry_price: string;
  mark_price: string;
  liquidation_price?: string;
  unrealized_pnl: string;
  realized_pnl: string;
  margin: string;
  leverage: string;
  timestamp: number;
}

/**
 * GRVT balance
 */
export interface GRVTBalance {
  currency: string;
  total: string;
  available: string;
  reserved: string;
  unrealized_pnl: string;
}

/**
 * GRVT trade
 */
export interface GRVTTrade {
  trade_id: string;
  instrument: string;
  side: 'BUY' | 'SELL';
  price: string;
  size: string;
  timestamp: number;
  is_buyer_maker: boolean;
}

/**
 * GRVT ticker
 */
export interface GRVTTicker {
  instrument: string;
  last_price: string;
  best_bid: string;
  best_ask: string;
  volume_24h: string;
  high_24h: string;
  low_24h: string;
  price_change_24h: string;
  timestamp: number;
}

/**
 * GRVT order request
 */
export interface GRVTOrderRequest {
  instrument: string;
  order_type: 'MARKET' | 'LIMIT' | 'LIMIT_MAKER';
  side: 'BUY' | 'SELL';
  size: string;
  price?: string;
  time_in_force?: 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';
  reduce_only?: boolean;
  post_only?: boolean;
  client_order_id?: string;
}

/**
 * GRVT cancel order request
 */
export interface GRVTCancelRequest {
  order_id?: string;
  client_order_id?: string;
  instrument?: string;
}

/**
 * GRVT WebSocket subscription
 */
export interface GRVTSubscription {
  method: 'subscribe' | 'unsubscribe';
  params: {
    channels: string[];
  };
}

/**
 * GRVT WebSocket message
 */
export interface GRVTWsMessage {
  channel: string;
  data: unknown;
  timestamp: number;
}

/**
 * GRVT order book update
 */
export interface GRVTWsOrderBookUpdate {
  instrument: string;
  bids: Array<[string, string]>;
  asks: Array<[string, string]>;
  timestamp: number;
  sequence: number;
  is_snapshot: boolean;
}

/**
 * GRVT trade update
 */
export interface GRVTWsTradeUpdate {
  trades: GRVTTrade[];
}

/**
 * GRVT position update
 */
export interface GRVTWsPositionUpdate {
  positions: GRVTPosition[];
}

/**
 * GRVT order update
 */
export interface GRVTWsOrderUpdate {
  orders: GRVTOrder[];
}

/**
 * EIP-712 domain for GRVT
 */
export interface GRVTEip712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

/**
 * GRVT order signature payload
 */
export interface GRVTOrderSignPayload {
  instrument: string;
  order_type: string;
  side: string;
  size: string;
  price: string;
  time_in_force: string;
  reduce_only: boolean;
  post_only: boolean;
  nonce: number;
  expiry: number;
}

// =============================================================================
// Zod Validation Schemas
// =============================================================================

import { z } from 'zod';

/**
 * GRVT Market Schema
 */
export const GRVTMarketSchema = z.object({
  instrument_id: z.string(),
  instrument: z.string(),
  base_currency: z.string(),
  quote_currency: z.string(),
  settlement_currency: z.string(),
  instrument_type: z.enum(['PERP', 'SPOT']),
  is_active: z.boolean(),
  maker_fee: z.string(),
  taker_fee: z.string(),
  max_leverage: z.string(),
  min_size: z.string(),
  max_size: z.string(),
  tick_size: z.string(),
  step_size: z.string(),
  mark_price: z.string(),
  index_price: z.string(),
  funding_rate: z.string().optional(),
  next_funding_time: z.number().optional(),
  open_interest: z.string().optional(),
});

/**
 * GRVT Order Book Schema
 */
export const GRVTOrderBookSchema = z.object({
  instrument: z.string(),
  bids: z.array(z.tuple([z.string(), z.string()])),
  asks: z.array(z.tuple([z.string(), z.string()])),
  timestamp: z.number(),
  sequence: z.number(),
});

/**
 * GRVT Order Schema
 */
export const GRVTOrderSchema = z.object({
  order_id: z.string(),
  client_order_id: z.string().optional(),
  instrument: z.string(),
  order_type: z.enum(['MARKET', 'LIMIT', 'LIMIT_MAKER']),
  side: z.enum(['BUY', 'SELL']),
  size: z.string(),
  price: z.string().optional(),
  time_in_force: z.enum(['GTC', 'IOC', 'FOK', 'POST_ONLY']),
  reduce_only: z.boolean(),
  post_only: z.boolean(),
  status: z.enum(['PENDING', 'OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED']),
  filled_size: z.string(),
  average_fill_price: z.string().optional(),
  created_at: z.number(),
  updated_at: z.number(),
});

/**
 * GRVT Position Schema
 */
export const GRVTPositionSchema = z.object({
  instrument: z.string(),
  side: z.enum(['LONG', 'SHORT']),
  size: z.string(),
  entry_price: z.string(),
  mark_price: z.string(),
  liquidation_price: z.string().optional(),
  unrealized_pnl: z.string(),
  realized_pnl: z.string(),
  margin: z.string(),
  leverage: z.string(),
  timestamp: z.number(),
});

/**
 * GRVT Balance Schema
 */
export const GRVTBalanceSchema = z.object({
  currency: z.string(),
  total: z.string(),
  available: z.string(),
  reserved: z.string(),
  unrealized_pnl: z.string(),
});

/**
 * GRVT Trade Schema
 */
export const GRVTTradeSchema = z.object({
  trade_id: z.string(),
  instrument: z.string(),
  side: z.enum(['BUY', 'SELL']),
  price: z.string(),
  size: z.string(),
  timestamp: z.number(),
  is_buyer_maker: z.boolean(),
});

/**
 * GRVT Ticker Schema
 */
export const GRVTTickerSchema = z.object({
  instrument: z.string(),
  last_price: z.string(),
  best_bid: z.string(),
  best_ask: z.string(),
  volume_24h: z.string(),
  high_24h: z.string(),
  low_24h: z.string(),
  price_change_24h: z.string(),
  timestamp: z.number(),
});

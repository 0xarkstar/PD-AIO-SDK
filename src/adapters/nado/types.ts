/**
 * Nado Exchange Type Definitions
 *
 * TypeScript types and Zod schemas for Nado API requests and responses.
 *
 * @see https://docs.nado.xyz
 */

import { z } from 'zod';

/**
 * Nado API Response Wrapper
 */
export interface NadoResponse<T> {
  status: 'success' | 'failure';
  data?: T;
  error?: string;
  error_code?: number;
  request_type?: string;
}

export const NadoResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.enum(['success', 'failure']),
    data: dataSchema.optional(),
    error: z.string().optional(),
    error_code: z.number().optional(),
    request_type: z.string().optional(),
  });

/**
 * Nado Product (Market) Information
 */
export interface NadoProduct {
  product_id: number;
  symbol: string;
  base_currency: string;
  quote_currency: string;
  contract_size: string;
  tick_size: string;
  min_size: string;
  max_position_size?: string;
  maker_fee: string;
  taker_fee: string;
  is_active: boolean;
  product_type: 'perpetual' | 'spot' | 'future';
}

export const NadoProductSchema = z.object({
  product_id: z.number(),
  symbol: z.string(),
  base_currency: z.string(),
  quote_currency: z.string(),
  contract_size: z.string(),
  tick_size: z.string(),
  min_size: z.string(),
  max_position_size: z.string().optional(),
  maker_fee: z.string(),
  taker_fee: z.string(),
  is_active: z.boolean(),
  product_type: z.enum(['perpetual', 'spot', 'future']),
});

/**
 * Nado Order Book Level
 * Format: [price, size, num_orders]
 */
export type NadoOrderBookLevel = [string, string, number];

/**
 * Nado Order Book
 */
export interface NadoOrderBook {
  product_id: number;
  bids: NadoOrderBookLevel[];
  asks: NadoOrderBookLevel[];
  timestamp: number;
}

export const NadoOrderBookSchema = z.object({
  product_id: z.number(),
  bids: z.array(z.tuple([z.string(), z.string(), z.number()])),
  asks: z.array(z.tuple([z.string(), z.string(), z.number()])),
  timestamp: z.number(),
});

/**
 * Nado Order
 */
export interface NadoOrder {
  order_id: string;
  digest: string; // EIP712 signature hash
  product_id: number;
  sender: string; // Address
  price_x18: string;
  amount: string;
  side: 0 | 1; // 0 = buy, 1 = sell
  expiration: number;
  nonce: number;
  status: 'open' | 'filled' | 'cancelled' | 'expired' | 'rejected';
  filled_amount: string;
  remaining_amount: string;
  avg_fill_price?: string;
  timestamp: number;
  is_reduce_only?: boolean;
  post_only?: boolean;
  time_in_force?: 'gtc' | 'ioc' | 'fok';
}

export const NadoOrderSchema = z.object({
  order_id: z.string(),
  digest: z.string(),
  product_id: z.number(),
  sender: z.string(),
  price_x18: z.string(),
  amount: z.string(),
  side: z.union([z.literal(0), z.literal(1)]),
  expiration: z.number(),
  nonce: z.number(),
  status: z.enum(['open', 'filled', 'cancelled', 'expired', 'rejected']),
  filled_amount: z.string(),
  remaining_amount: z.string(),
  avg_fill_price: z.string().optional(),
  timestamp: z.number(),
  is_reduce_only: z.boolean().optional(),
  post_only: z.boolean().optional(),
  time_in_force: z.enum(['gtc', 'ioc', 'fok']).optional(),
});

/**
 * Nado Position
 */
export interface NadoPosition {
  product_id: number;
  subaccount: string; // Address
  size: string; // Positive for long, negative for short
  entry_price: string;
  mark_price: string;
  liquidation_price?: string;
  unrealized_pnl: string;
  realized_pnl: string;
  leverage: string;
  margin: string;
  timestamp: number;
}

export const NadoPositionSchema = z.object({
  product_id: z.number(),
  subaccount: z.string(),
  size: z.string(),
  entry_price: z.string(),
  mark_price: z.string(),
  liquidation_price: z.string().optional(),
  unrealized_pnl: z.string(),
  realized_pnl: z.string(),
  leverage: z.string(),
  margin: z.string(),
  timestamp: z.number(),
});

/**
 * Nado Balance (Subaccount Info)
 */
export interface NadoBalance {
  subaccount: string;
  quote_balance: string; // Available balance
  total_equity: string;
  used_margin: string;
  free_margin: string;
  unrealized_pnl: string;
  health: string; // Account health ratio
  timestamp: number;
}

export const NadoBalanceSchema = z.object({
  subaccount: z.string(),
  quote_balance: z.string(),
  total_equity: z.string(),
  used_margin: z.string(),
  free_margin: z.string(),
  unrealized_pnl: z.string(),
  health: z.string(),
  timestamp: z.number(),
});

/**
 * Nado Trade
 */
export interface NadoTrade {
  trade_id: string;
  product_id: number;
  price: string;
  size: string;
  side: 0 | 1; // 0 = buy, 1 = sell
  timestamp: number;
  is_maker: boolean;
}

export const NadoTradeSchema = z.object({
  trade_id: z.string(),
  product_id: z.number(),
  price: z.string(),
  size: z.string(),
  side: z.union([z.literal(0), z.literal(1)]),
  timestamp: z.number(),
  is_maker: z.boolean(),
});

/**
 * Nado Ticker
 */
export interface NadoTicker {
  product_id: number;
  symbol: string;
  last_price: string;
  mark_price: string;
  index_price: string;
  high_24h: string;
  low_24h: string;
  volume_24h: string;
  funding_rate?: string;
  next_funding_time?: number;
  open_interest?: string;
  timestamp: number;
}

export const NadoTickerSchema = z.object({
  product_id: z.number(),
  symbol: z.string(),
  last_price: z.string(),
  mark_price: z.string(),
  index_price: z.string(),
  high_24h: z.string(),
  low_24h: z.string(),
  volume_24h: z.string(),
  funding_rate: z.string().optional(),
  next_funding_time: z.number().optional(),
  open_interest: z.string().optional(),
  timestamp: z.number(),
});

/**
 * EIP712 Order Structure for Signing
 */
export interface NadoEIP712Order {
  sender: string;
  priceX18: string;
  amount: string;
  expiration: number;
  nonce: number;
  appendix: {
    productId: number;
    side: 0 | 1;
    reduceOnly: boolean;
    postOnly: boolean;
  };
}

/**
 * EIP712 Cancellation Structure
 */
export interface NadoEIP712Cancellation {
  sender: string;
  productIds: number[];
  digests: string[];
  nonce: number;
}

/**
 * EIP712 Stream Authentication
 */
export interface NadoEIP712StreamAuth {
  sender: string;
  expiration: number;
}

/**
 * Nado Contracts Info (from /contracts query)
 */
export interface NadoContracts {
  chain_id: number;
  endpoint_address: string;
  products: {
    [productId: string]: {
      address: string;
      symbol: string;
    };
  };
}

export const NadoContractsSchema = z.object({
  chain_id: z.number(),
  endpoint_address: z.string(),
  products: z.record(
    z.string(),
    z.object({
      address: z.string(),
      symbol: z.string(),
    })
  ),
});

/**
 * Nado Configuration
 */
export interface NadoConfig {
  wallet?: any; // ethers.Wallet
  privateKey?: string;
  testnet?: boolean;
  subaccount?: string; // Optional subaccount address
}

/**
 * Nado WebSocket Message Types
 */
export interface NadoWSMessage {
  type: 'query' | 'execute' | 'subscribe' | 'unsubscribe';
  channel?: string;
  data?: any;
}

/**
 * Nado WebSocket Subscription
 */
export interface NadoWSSubscription {
  channel: string;
  product_id?: number;
  subaccount?: string;
}

/**
 * Product ID to Symbol mapping cache
 */
export interface ProductMapping {
  productId: number;
  symbol: string;
  ccxtSymbol: string; // CCXT format: BTC/USDT:USDT
}

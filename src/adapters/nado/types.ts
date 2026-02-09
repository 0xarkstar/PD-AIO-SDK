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
 * Nado Symbol (Market) Information from /query?type=symbols
 *
 * This is the structure returned by the symbols endpoint.
 * Note: All numeric values are in x18 format (18 decimal places).
 */
export interface NadoSymbol {
  type: 'perp' | 'spot';
  product_id: number;
  symbol: string;
  price_increment_x18: string;
  size_increment: string;
  min_size: string;
  maker_fee_rate_x18: string;
  taker_fee_rate_x18: string;
  long_weight_initial_x18: string;
  long_weight_maintenance_x18: string;
  max_open_interest_x18?: string | null;
}

export const NadoSymbolSchema = z.object({
  type: z.enum(['perp', 'spot']),
  product_id: z.number(),
  symbol: z.string(),
  price_increment_x18: z.string(),
  size_increment: z.string(),
  min_size: z.string(),
  maker_fee_rate_x18: z.string(),
  taker_fee_rate_x18: z.string(),
  long_weight_initial_x18: z.string(),
  long_weight_maintenance_x18: z.string(),
  max_open_interest_x18: z.string().nullable().optional(),
});

/**
 * @deprecated Use NadoSymbol instead - this was based on incorrect API assumptions
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

/**
 * @deprecated Use NadoSymbolSchema instead
 */
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
 * Format: [price_x18, size_x18]
 */
export type NadoOrderBookLevel = [string, string];

/**
 * Nado Order Book (from market_liquidity endpoint)
 */
export interface NadoOrderBook {
  bids: NadoOrderBookLevel[];
  asks: NadoOrderBookLevel[];
}

export const NadoOrderBookSchema = z.object({
  bids: z.array(z.tuple([z.string(), z.string()])),
  asks: z.array(z.tuple([z.string(), z.string()])),
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
 * Nado Ticker (from market_prices endpoint)
 * Note: The API returns minimal price data (bid/ask only)
 */
export interface NadoTicker {
  product_id: number;
  bid_x18: string;
  ask_x18: string;
}

export const NadoTickerSchema = z.object({
  product_id: z.number(),
  bid_x18: z.string(),
  ask_x18: z.string(),
});

/**
 * EIP712 Order Structure for Signing
 *
 * Note: nonce is bigint because Nado uses 64-bit nonces that exceed
 * JavaScript's safe integer limit (2^53 - 1).
 */
export interface NadoEIP712Order {
  sender: string;
  priceX18: string;
  amount: string;
  expiration: number;
  nonce: bigint;
  appendix: {
    productId: number;
    side: 0 | 1;
    reduceOnly: boolean;
    postOnly: boolean;
  };
}

/**
 * EIP712 Cancellation Structure
 *
 * Note: nonce is bigint because Nado uses 64-bit nonces.
 */
export interface NadoEIP712Cancellation {
  sender: string;
  productIds: number[];
  digests: string[];
  nonce: bigint;
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
  chain_id: string;
  endpoint_addr: string;
  products?: {
    [productId: string]: {
      address: string;
      symbol: string;
    };
  };
}

export const NadoContractsSchema = z.object({
  chain_id: z.string(),
  endpoint_addr: z.string(),
  products: z
    .record(
      z.string(),
      z.object({
        address: z.string(),
        symbol: z.string(),
      })
    )
    .optional(),
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

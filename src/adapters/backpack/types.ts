/**
 * Backpack-specific type definitions
 */

import { z } from 'zod';

/**
 * Backpack adapter configuration
 */
export interface BackpackConfig {
  apiKey?: string;
  apiSecret?: string;
  ed25519PrivateKey?: string;
  testnet?: boolean;
  timeout?: number;
}

/**
 * Backpack market response
 * API uses camelCase
 */
export interface BackpackMarket {
  symbol: string;
  baseSymbol: string;
  quoteSymbol: string;
  marketType: 'SPOT' | 'PERP';
  orderBookState: string;
  visible: boolean;
  filters: {
    price: {
      tickSize: string;
      minPrice?: string;
      maxPrice?: string | null;
    };
    quantity: {
      stepSize: string;
      minQuantity: string;
      maxQuantity?: string | null;
    };
  };
  fundingInterval?: number | null;
  imfFunction?: unknown;
  mmfFunction?: unknown;
  positionLimitWeight?: unknown;
  openInterestLimit?: string;
}

export const BackpackMarketSchema = z
  .object({
    symbol: z.string(),
    baseSymbol: z.string().optional(),
    quoteSymbol: z.string().optional(),
    marketType: z.enum(['SPOT', 'PERP']).optional(),
    orderBookState: z.string().optional(),
    visible: z.boolean().optional(),
    filters: z
      .object({
        price: z
          .object({
            tickSize: z.string(),
            minPrice: z.string().optional(),
            maxPrice: z.string().nullable().optional(),
          })
          .optional(),
        quantity: z
          .object({
            stepSize: z.string(),
            minQuantity: z.string(),
            maxQuantity: z.string().nullable().optional(),
          })
          .optional(),
      })
      .optional(),
    fundingInterval: z.number().nullable().optional(),
    imfFunction: z.unknown().optional(),
    mmfFunction: z.unknown().optional(),
    positionLimitWeight: z.unknown().optional(),
    openInterestLimit: z.string().optional(),
  })
  .passthrough();

/**
 * Backpack order response
 */
export interface BackpackOrder {
  order_id: string;
  client_order_id?: string;
  market: string;
  side: 'Bid' | 'Ask' | 'BUY' | 'SELL';
  type: 'Market' | 'Limit' | 'PostOnly' | 'MARKET' | 'LIMIT' | 'POST_ONLY';
  size: string;
  price?: string;
  filled_size: string;
  avg_price?: string;
  status:
    | 'New'
    | 'Open'
    | 'PartiallyFilled'
    | 'Filled'
    | 'Cancelled'
    | 'Rejected'
    | 'NEW'
    | 'OPEN'
    | 'PARTIAL'
    | 'PARTIALLY_FILLED'
    | 'FILLED'
    | 'CANCELLED'
    | 'REJECTED';
  time_in_force: 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';
  post_only: boolean;
  reduce_only: boolean;
  created_at: number;
  updated_at: number;
}

export const BackpackOrderSchema = z
  .object({
    order_id: z.string(),
    client_order_id: z.string().optional(),
    market: z.string(),
    side: z.string(),
    type: z.string(),
    size: z.string(),
    price: z.string().optional(),
    filled_size: z.string(),
    avg_price: z.string().optional(),
    status: z.string(),
    time_in_force: z.string().optional(),
    post_only: z.boolean().optional(),
    reduce_only: z.boolean().optional(),
    created_at: z.number().optional(),
    updated_at: z.number().optional(),
  })
  .passthrough();

/**
 * Backpack position response
 */
export interface BackpackPosition {
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
  timestamp: number;
}

export const BackpackPositionSchema = z
  .object({
    market: z.string(),
    side: z.string().optional(),
    size: z.string().optional(),
    entry_price: z.string().optional(),
    mark_price: z.string().optional(),
    liquidation_price: z.string().optional(),
    unrealized_pnl: z.string().optional(),
    realized_pnl: z.string().optional(),
    margin: z.string().optional(),
    leverage: z.string().optional(),
    timestamp: z.number().optional(),
  })
  .passthrough();

/**
 * Backpack balance response
 */
export interface BackpackBalance {
  asset: string;
  total: string;
  available: string;
  locked: string;
}

export const BackpackBalanceSchema = z
  .object({
    asset: z.string(),
    total: z.string(),
    available: z.string(),
    locked: z.string(),
  })
  .passthrough();

/**
 * Backpack order book response (depth endpoint)
 */
export interface BackpackOrderBook {
  bids: [string, string][];
  asks: [string, string][];
  lastUpdateId?: string;
}

export const BackpackOrderBookSchema = z
  .object({
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
    lastUpdateId: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

/**
 * Backpack trade response
 * API uses camelCase
 */
export interface BackpackTrade {
  id: number;
  price: string;
  quantity: string;
  quoteQuantity: string;
  timestamp: number;
  isBuyerMaker: boolean;
}

export const BackpackTradeSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    price: z.string(),
    quantity: z.string(),
    quoteQuantity: z.string().optional(),
    timestamp: z.number().optional(),
    isBuyerMaker: z.boolean(),
  })
  .passthrough();

/**
 * Backpack ticker response
 * API returns camelCase fields
 */
export interface BackpackTicker {
  symbol: string;
  firstPrice: string;
  lastPrice: string;
  high: string;
  low: string;
  volume: string;
  quoteVolume: string;
  priceChange: string;
  priceChangePercent: string;
  trades: string;
}

export const BackpackTickerSchema = z
  .object({
    symbol: z.string(),
    firstPrice: z.string().optional(),
    lastPrice: z.string().optional(),
    high: z.string().optional(),
    low: z.string().optional(),
    volume: z.string().optional(),
    quoteVolume: z.string().optional(),
    priceChange: z.string().optional(),
    priceChangePercent: z.string().optional(),
    trades: z.string().optional(),
  })
  .passthrough();

/**
 * Backpack funding rate response
 * API returns: { fundingRate, intervalEndTimestamp, symbol }
 */
export interface BackpackFundingRate {
  symbol: string;
  fundingRate: string;
  intervalEndTimestamp: string;
}

export const BackpackFundingRateSchema = z
  .object({
    symbol: z.string(),
    fundingRate: z.string(),
    intervalEndTimestamp: z.string(),
  })
  .passthrough();

/**
 * Backpack order sign payload
 */
export interface BackpackOrderSignPayload {
  market: string;
  side: 'Bid' | 'Ask';
  order_type: string;
  size: string;
  price: string;
  time_in_force: string;
  reduce_only: boolean;
  post_only: boolean;
  timestamp: number;
}

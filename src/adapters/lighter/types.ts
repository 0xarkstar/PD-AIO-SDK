/**
 * Lighter-specific type definitions
 */

import { z } from 'zod';

/**
 * Lighter API configuration
 *
 * Supports two authentication modes:
 * 1. HMAC mode (legacy): Uses apiKey + apiSecret for HMAC-SHA256 signing
 * 2. WASM mode (recommended): Uses apiPrivateKey for WASM-based signing
 *
 * WASM mode is required for full trading functionality as it supports
 * the transaction signing required by the Lighter protocol.
 * Install @oraichain/lighter-ts-sdk for WASM signing support.
 */
export interface LighterConfig {
  // ============ HMAC Auth (Legacy) ============
  /** API key for HMAC authentication (legacy mode) */
  apiKey?: string;
  /** API secret for HMAC authentication (legacy mode) */
  apiSecret?: string;

  // ============ WASM Auth (Recommended - Full Trading) ============
  /** API private key (hex string) for WASM signing */
  apiPrivateKey?: string;
  /** API public key (hex string, optional - derived from private if not provided) */
  apiPublicKey?: string;
  /** Account index for trading (default: 0) */
  accountIndex?: number;
  /** API key index (default: 255 for main key) */
  apiKeyIndex?: number;

  // ============ Network Settings ============
  /** Use testnet (default: false) */
  testnet?: boolean;
  /** Chain ID override (300 = testnet, 304 = mainnet) */
  chainId?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Rate limit tier */
  rateLimitTier?: 'tier1' | 'tier2' | 'tier3';
}

export interface LighterMarket {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  active: boolean;
  minOrderSize: number;
  maxOrderSize: number;
  tickSize: number;
  stepSize: number;
  makerFee: number;
  takerFee: number;
  maxLeverage: number;
}

export interface LighterOrder {
  orderId: string;
  clientOrderId?: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  price?: number;
  size: number;
  filledSize: number;
  status: 'open' | 'filled' | 'cancelled' | 'partially_filled';
  timestamp: number;
  reduceOnly: boolean;
}

export const LighterOrderSchema = z
  .object({
    orderId: z.string(),
    clientOrderId: z.string().optional(),
    symbol: z.string(),
    side: z.enum(['buy', 'sell']),
    type: z.enum(['market', 'limit']),
    price: z.number().optional(),
    size: z.number(),
    filledSize: z.number(),
    status: z.enum(['open', 'filled', 'cancelled', 'partially_filled']),
    timestamp: z.number(),
    reduceOnly: z.boolean(),
  })
  .passthrough();

export interface LighterPosition {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  margin: number;
  leverage: number;
}

export const LighterPositionSchema = z
  .object({
    symbol: z.string(),
    side: z.enum(['long', 'short']),
    size: z.number(),
    entryPrice: z.number(),
    markPrice: z.number(),
    liquidationPrice: z.number(),
    unrealizedPnl: z.number(),
    margin: z.number(),
    leverage: z.number(),
  })
  .passthrough();

export interface LighterBalance {
  currency: string;
  total: number;
  available: number;
  reserved: number;
}

export const LighterBalanceSchema = z
  .object({
    currency: z.string(),
    total: z.number(),
    available: z.number(),
    reserved: z.number(),
  })
  .passthrough();

export interface LighterOrderBook {
  symbol: string;
  bids: Array<[number, number]>;
  asks: Array<[number, number]>;
  timestamp: number;
}

export interface LighterTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  timestamp: number;
}

export interface LighterTicker {
  symbol: string;
  last: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
}

export interface LighterFundingRate {
  symbol: string;
  fundingRate: number;
  markPrice: number;
  nextFundingTime: number;
}

export const LighterFundingRateSchema = z
  .object({
    symbol: z.string(),
    fundingRate: z.number(),
    markPrice: z.number(),
    nextFundingTime: z.number(),
  })
  .passthrough();

/**
 * Lighter API market response from /api/v1/orderBookDetails
 * This represents the actual API response format (snake_case string values),
 * distinct from the normalized LighterMarket interface above.
 */
export interface LighterAPIMarket {
  symbol: string;
  market_type?: string;
  status?: string;
  supported_price_decimals?: string | number;
  price_decimals?: string | number;
  supported_size_decimals?: string | number;
  size_decimals?: string | number;
  min_base_amount?: string;
  maker_fee?: string;
  taker_fee?: string;
  max_leverage?: string;
  default_initial_margin_fraction?: number;
  is_active?: boolean;
}

export const LighterAPIMarketSchema = z
  .object({
    symbol: z.string(),
    market_type: z.string().optional(),
    status: z.string().optional(),
    supported_price_decimals: z.union([z.string(), z.number()]).optional(),
    price_decimals: z.union([z.string(), z.number()]).optional(),
    supported_size_decimals: z.union([z.string(), z.number()]).optional(),
    size_decimals: z.union([z.string(), z.number()]).optional(),
    min_base_amount: z.string().optional(),
    maker_fee: z.string().optional(),
    taker_fee: z.string().optional(),
    max_leverage: z.string().optional(),
    default_initial_margin_fraction: z.number().optional(),
    is_active: z.boolean().optional(),
  })
  .passthrough();

/**
 * Lighter API ticker response from /api/v1/orderBookDetails
 * Real API returns ticker data alongside order book details.
 */
export interface LighterAPITicker {
  symbol: string;
  last_trade_price?: string;
  daily_price_high?: string;
  daily_price_low?: string;
  daily_base_token_volume?: string;
  daily_quote_token_volume?: string;
  daily_price_change?: string;
}

export const LighterAPITickerSchema = z
  .object({
    symbol: z.string(),
    last_trade_price: z.string().optional(),
    daily_price_high: z.string().optional(),
    daily_price_low: z.string().optional(),
    daily_base_token_volume: z.string().optional(),
    daily_quote_token_volume: z.string().optional(),
    daily_price_change: z.string().optional(),
  })
  .passthrough();

/**
 * EdgeX-specific type definitions
 */

import { z } from 'zod';

/**
 * EdgeX adapter configuration
 *
 * EdgeX uses StarkEx L2 for order signing with Pedersen hash + ECDSA.
 * The starkPrivateKey is required for all authenticated operations.
 */
export interface EdgeXConfig {
  /** StarkEx L2 private key for Pedersen hash signing (required for trading) */
  starkPrivateKey?: string;
  /** Use testnet environment */
  testnet?: boolean;
}

/**
 * EdgeX market response
 */
export interface EdgeXMarket {
  market_id: string;
  symbol: string;
  base_asset: string;
  quote_asset: string;
  settlement_asset: string;
  status: string;
  min_order_size: string;
  max_order_size: string;
  tick_size: string;
  step_size: string;
  maker_fee: string;
  taker_fee: string;
  max_leverage: string;
  is_active: boolean;
}

export const EdgeXMarketSchema = z
  .object({
    market_id: z.string(),
    symbol: z.string(),
    base_asset: z.string(),
    quote_asset: z.string(),
    settlement_asset: z.string(),
    status: z.string(),
    min_order_size: z.string(),
    max_order_size: z.string(),
    tick_size: z.string(),
    step_size: z.string(),
    maker_fee: z.string(),
    taker_fee: z.string(),
    max_leverage: z.string(),
    is_active: z.boolean(),
  })
  .passthrough();

/**
 * EdgeX order response
 */
export interface EdgeXOrder {
  order_id: string;
  client_order_id?: string;
  market: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  size: string;
  price?: string;
  filled_size: string;
  average_price?: string;
  status: 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  time_in_force: 'GTC' | 'IOC' | 'FOK';
  post_only: boolean;
  reduce_only: boolean;
  created_at: number;
  updated_at: number;
}

export const EdgeXOrderSchema = z
  .object({
    order_id: z.string(),
    client_order_id: z.string().optional(),
    market: z.string(),
    side: z.string(),
    type: z.string(),
    size: z.string(),
    price: z.union([z.string(), z.null()]).optional(),
    filled_size: z.string(),
    average_price: z.union([z.string(), z.null()]).optional(),
    status: z.string(),
    time_in_force: z.string(),
    post_only: z.boolean(),
    reduce_only: z.boolean(),
    created_at: z.number(),
    updated_at: z.number(),
  })
  .passthrough();

/**
 * EdgeX position response
 */
export interface EdgeXPosition {
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

export const EdgeXPositionSchema = z
  .object({
    market: z.string(),
    side: z.string(),
    size: z.string(),
    entry_price: z.string(),
    mark_price: z.string(),
    liquidation_price: z.union([z.string(), z.null()]).optional(),
    unrealized_pnl: z.string(),
    realized_pnl: z.string(),
    margin: z.string(),
    leverage: z.string(),
    timestamp: z.number(),
  })
  .passthrough();

/**
 * EdgeX balance response
 */
export interface EdgeXBalance {
  asset: string;
  total: string;
  available: string;
  locked: string;
}

export const EdgeXBalanceSchema = z
  .object({
    asset: z.string(),
    total: z.string(),
    available: z.string(),
    locked: z.string(),
  })
  .passthrough();

/**
 * EdgeX order book response
 */
export interface EdgeXOrderBook {
  market: string;
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number;
}

export const EdgeXOrderBookSchema = z
  .object({
    market: z.string(),
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
    timestamp: z.number(),
  })
  .passthrough();

/**
 * EdgeX trade response
 */
export interface EdgeXTrade {
  trade_id: string;
  market: string;
  side: 'BUY' | 'SELL';
  price: string;
  size: string;
  timestamp: number;
}

export const EdgeXTradeSchema = z
  .object({
    trade_id: z.string(),
    market: z.string(),
    side: z.string(),
    price: z.string(),
    size: z.string(),
    timestamp: z.number(),
  })
  .passthrough();

/**
 * EdgeX ticker response
 */
export interface EdgeXTicker {
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

export const EdgeXTickerSchema = z
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
 * EdgeX funding rate response
 */
export interface EdgeXFundingRate {
  market: string;
  rate: string;
  timestamp: number;
  next_funding_time: number;
  mark_price: string;
  index_price: string;
}

export const EdgeXFundingRateSchema = z
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
 * EdgeX API contract response from /api/v1/public/contract/getContracts
 * New API format with contractName/contractId fields.
 */
export interface EdgeXAPIContract {
  contractId: string;
  contractName: string;
  enableTrade?: boolean;
  minOrderSize?: string;
  tickSize?: string;
  stepSize?: string;
  defaultMakerFeeRate?: string;
  defaultTakerFeeRate?: string;
  riskTierList?: Array<{ maxLeverage?: string }>;
}

export const EdgeXAPIContractSchema = z
  .object({
    contractId: z.string(),
    contractName: z.string(),
    enableTrade: z.boolean().optional(),
    minOrderSize: z.string().optional(),
    tickSize: z.string().optional(),
    stepSize: z.string().optional(),
    defaultMakerFeeRate: z.string().optional(),
    defaultTakerFeeRate: z.string().optional(),
    riskTierList: z
      .array(
        z
          .object({
            maxLeverage: z.string().optional(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

/**
 * EdgeX API depth response from /api/v1/public/quote/getDepth
 */
export interface EdgeXDepthData {
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
}

export const EdgeXDepthDataSchema = z
  .object({
    bids: z.array(
      z
        .object({
          price: z.string(),
          size: z.string(),
        })
        .passthrough()
    ),
    asks: z.array(
      z
        .object({
          price: z.string(),
          size: z.string(),
        })
        .passthrough()
    ),
  })
  .passthrough();

/**
 * EdgeX API ticker response from /api/v1/public/quote/getTicker
 */
export interface EdgeXAPITicker {
  contractName?: string;
  lastPrice?: string;
  close?: string;
  open?: string;
  high?: string;
  low?: string;
  priceChange?: string;
  priceChangePercent?: string;
  size?: string;
  volume?: string;
  value?: string;
  endTime?: string;
}

export const EdgeXAPITickerSchema = z
  .object({
    contractName: z.string().optional(),
    lastPrice: z.string().optional(),
    close: z.string().optional(),
    open: z.string().optional(),
    high: z.string().optional(),
    low: z.string().optional(),
    priceChange: z.string().optional(),
    priceChangePercent: z.string().optional(),
    size: z.string().optional(),
    volume: z.string().optional(),
    value: z.string().optional(),
    endTime: z.string().optional(),
  })
  .passthrough();

/**
 * EdgeX API funding rate response from /api/v1/public/funding/getLatestFundingRate
 */
export interface EdgeXAPIFundingData {
  fundingRate?: string;
  fundingTime?: string;
  fundingTimestamp?: string;
  markPrice?: string;
  indexPrice?: string;
  nextFundingTime?: string;
}

export const EdgeXAPIFundingDataSchema = z
  .object({
    fundingRate: z.string().optional(),
    fundingTime: z.coerce.string().optional(),
    fundingTimestamp: z.coerce.string().optional(),
    markPrice: z.string().optional(),
    indexPrice: z.string().optional(),
    nextFundingTime: z.coerce.string().optional(),
  })
  .passthrough();

/**
 * EdgeX order sign payload
 */
export interface EdgeXOrderSignPayload {
  market: string;
  side: 'BUY' | 'SELL';
  order_type: string;
  size: string;
  price: string;
  time_in_force: string;
  reduce_only: boolean;
  post_only: boolean;
  nonce: number;
  expiry: number;
}

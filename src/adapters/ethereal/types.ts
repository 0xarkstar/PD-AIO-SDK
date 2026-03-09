/**
 * Ethereal Exchange-Specific Types
 */

import { z } from 'zod';
import type { ExchangeConfig } from '../../types/adapter.js';

export interface EtherealConfig extends ExchangeConfig {
  /** Ethereum wallet private key for EIP-712 signing */
  privateKey?: string;
  /** Account ID for trading */
  accountId?: string;
  /** Testnet flag */
  testnet?: boolean;
  /** Request timeout */
  timeout?: number;
}

// --- Market Info ---

export interface EtherealMarketInfo {
  symbol: string; // "ETH-USD"
  baseAsset: string; // "ETH"
  quoteAsset: string; // "USD"
  status: string; // "ACTIVE"
  tickSize: string;
  stepSize: string;
  minOrderSize: string;
  maxLeverage: number;
  makerFee: string;
  takerFee: string;
  fundingInterval: number; // hours
}

export const EtherealMarketInfoSchema = z
  .object({
    symbol: z.string(),
    baseAsset: z.string(),
    quoteAsset: z.string(),
    status: z.string(),
    tickSize: z.string(),
    stepSize: z.string(),
    minOrderSize: z.string(),
    maxLeverage: z.number(),
    makerFee: z.string(),
    takerFee: z.string(),
    fundingInterval: z.number(),
  })
  .passthrough();

// --- Ticker ---

export interface EtherealTicker {
  symbol: string;
  lastPrice: string;
  bestBid: string;
  bestAsk: string;
  high24h: string;
  low24h: string;
  open24h: string;
  volume24h: string;
  quoteVolume24h: string;
  priceChange24h: string;
  priceChangePercent24h: string;
  markPrice: string;
  indexPrice: string;
  timestamp: number;
}

export const EtherealTickerSchema = z
  .object({
    symbol: z.string(),
    lastPrice: z.string(),
    bestBid: z.string(),
    bestAsk: z.string(),
    high24h: z.string(),
    low24h: z.string(),
    open24h: z.string(),
    volume24h: z.string(),
    quoteVolume24h: z.string(),
    priceChange24h: z.string(),
    priceChangePercent24h: z.string(),
    markPrice: z.string(),
    indexPrice: z.string(),
    timestamp: z.number(),
  })
  .passthrough();

// --- Order Book ---

export interface EtherealOrderBookResponse {
  symbol: string;
  bids: [string, string][]; // [price, qty]
  asks: [string, string][];
  timestamp: number;
}

export const EtherealOrderBookResponseSchema = z
  .object({
    symbol: z.string(),
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
    timestamp: z.number(),
  })
  .passthrough();

// --- Trade ---

export interface EtherealTradeResponse {
  id: string;
  symbol: string;
  side: string; // "BUY" | "SELL"
  price: string;
  quantity: string;
  timestamp: number;
}

export const EtherealTradeResponseSchema = z
  .object({
    id: z.string(),
    symbol: z.string(),
    side: z.string(),
    price: z.string(),
    quantity: z.string(),
    timestamp: z.number(),
  })
  .passthrough();

// --- Order ---

export interface EtherealOrderResponse {
  orderId: string;
  symbol: string;
  side: string; // "BUY" | "SELL"
  type: string; // "LIMIT" | "MARKET"
  status: string; // "NEW" | "OPEN" | "FILLED" | "CANCELLED" | "REJECTED"
  price: string;
  avgPrice: string;
  quantity: string;
  filledQuantity: string;
  remainingQuantity: string;
  reduceOnly: boolean;
  postOnly: boolean;
  clientOrderId?: string;
  timeInForce: string;
  createdAt: number;
  updatedAt: number;
}

export const EtherealOrderResponseSchema = z
  .object({
    orderId: z.string(),
    symbol: z.string(),
    side: z.string(),
    type: z.string(),
    status: z.string(),
    price: z.string(),
    avgPrice: z.string(),
    quantity: z.string(),
    filledQuantity: z.string(),
    remainingQuantity: z.string(),
    reduceOnly: z.boolean(),
    postOnly: z.boolean(),
    clientOrderId: z.string().optional(),
    timeInForce: z.string(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .passthrough();

// --- Position ---

export interface EtherealPositionResponse {
  symbol: string;
  side: string; // "LONG" | "SHORT"
  size: string;
  entryPrice: string;
  markPrice: string;
  liquidationPrice: string;
  unrealizedPnl: string;
  realizedPnl: string;
  leverage: string;
  marginMode: string; // "cross" | "isolated"
  margin: string;
  updatedAt: number;
}

export const EtherealPositionResponseSchema = z
  .object({
    symbol: z.string(),
    side: z.string(),
    size: z.string(),
    entryPrice: z.string(),
    markPrice: z.string(),
    liquidationPrice: z.string(),
    unrealizedPnl: z.string(),
    realizedPnl: z.string(),
    leverage: z.string(),
    marginMode: z.string(),
    margin: z.string(),
    updatedAt: z.number(),
  })
  .passthrough();

// --- Balance ---

export interface EtherealBalanceResponse {
  asset: string;
  total: string;
  available: string;
  locked: string;
  updatedAt: number;
}

export const EtherealBalanceResponseSchema = z
  .object({
    asset: z.string(),
    total: z.string(),
    available: z.string(),
    locked: z.string(),
    updatedAt: z.number(),
  })
  .passthrough();

// --- Candles ---

export interface EtherealCandleResponse {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export const EtherealCandleResponseSchema = z
  .object({
    timestamp: z.number(),
    open: z.string(),
    high: z.string(),
    low: z.string(),
    close: z.string(),
    volume: z.string(),
  })
  .passthrough();

// --- Funding Rate ---

export interface EtherealFundingRateResponse {
  symbol: string;
  fundingRate: string;
  fundingTimestamp: number;
  nextFundingTimestamp: number;
  markPrice: string;
  indexPrice: string;
}

export const EtherealFundingRateResponseSchema = z
  .object({
    symbol: z.string(),
    fundingRate: z.string(),
    fundingTimestamp: z.number(),
    nextFundingTimestamp: z.number(),
    markPrice: z.string(),
    indexPrice: z.string(),
  })
  .passthrough();

// --- Order Request ---

export interface EtherealCreateOrderRequest {
  symbol: string;
  side: string;
  type: string;
  quantity: string;
  price?: string;
  stopPrice?: string;
  timeInForce?: string;
  reduceOnly?: boolean;
  postOnly?: boolean;
  clientOrderId?: string;
  signature: string;
  nonce: string;
  accountId: string;
}

// --- My Trade ---

export interface EtherealMyTradeResponse {
  id: string;
  orderId: string;
  symbol: string;
  side: string;
  price: string;
  quantity: string;
  fee: string;
  feeAsset: string;
  timestamp: number;
}

export const EtherealMyTradeResponseSchema = z
  .object({
    id: z.string(),
    orderId: z.string(),
    symbol: z.string(),
    side: z.string(),
    price: z.string(),
    quantity: z.string(),
    fee: z.string(),
    feeAsset: z.string(),
    timestamp: z.number(),
  })
  .passthrough();

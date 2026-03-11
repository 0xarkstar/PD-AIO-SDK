/**
 * Ethereal Exchange-Specific Types
 */

import { z } from 'zod';
import type { ExchangeConfig } from '../../types/adapter.js';

/** Wrapped response from Ethereal API endpoints that return { data: [...] } */
export interface EtherealDataResponse<T> {
  data: T;
}

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

// --- Market Info (from GET /product) ---

export interface EtherealMarketInfo {
  id: string; // UUID e.g. "bc7d5575-3711-4532-a000-312bfacfb767"
  ticker: string; // "BTCUSD"
  displayTicker: string; // "BTC-USD"
  status: string; // "ACTIVE"
  baseTokenName: string; // "BTC"
  quoteTokenName: string; // "USD"
  tickSize: string;
  lotSize: string; // step size for quantity
  minQuantity: string;
  maxQuantity: string;
  maxLeverage: number;
  makerFee: string;
  takerFee: string;
  volume24h: string;
  openInterest: string;
  fundingRate1h: string;
  minPrice: string;
  maxPrice: string;
  onchainId: number;
  engineType: number;
}

export const EtherealMarketInfoSchema = z
  .object({
    id: z.string(),
    ticker: z.string(),
    displayTicker: z.string(),
    status: z.string(),
    baseTokenName: z.string(),
    quoteTokenName: z.string(),
    tickSize: z.string(),
    lotSize: z.string(),
    minQuantity: z.string(),
    maxQuantity: z.string(),
    maxLeverage: z.number(),
    makerFee: z.string(),
    takerFee: z.string(),
  })
  .passthrough();

// --- Ticker (from GET /product/market-price + product data) ---

export interface EtherealTicker {
  productId: string;
  bestAskPrice: string;
  bestBidPrice: string;
  oraclePrice: string;
  price24hAgo: string;
}

export const EtherealTickerSchema = z
  .object({
    productId: z.string(),
    bestAskPrice: z.string(),
    bestBidPrice: z.string(),
    oraclePrice: z.string(),
    price24hAgo: z.string(),
  })
  .passthrough();

// --- Order Book (from GET /product/market-liquidity) ---

export interface EtherealOrderBookResponse {
  productId: string;
  timestamp: number;
  previousTimestamp: number;
  bids: [string, string][]; // [price, qty]
  asks: [string, string][];
}

export const EtherealOrderBookResponseSchema = z
  .object({
    productId: z.string(),
    timestamp: z.number(),
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
  })
  .passthrough();

// --- Trade (from GET /order/trade) ---

export interface EtherealTradeResponse {
  id: string;
  productId: string;
  makerOrderId: string;
  takerOrderId: string;
  makerSide: number; // 0 = buy, 1 = sell
  takerSide: number;
  price: string;
  filled: string; // quantity filled
  makerFeeUsd: string;
  takerFeeUsd: string;
  createdAt: number;
}

export const EtherealTradeResponseSchema = z
  .object({
    id: z.string(),
    productId: z.string(),
    price: z.string(),
    filled: z.string(),
    makerSide: z.number(),
    takerSide: z.number(),
    createdAt: z.number(),
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

// --- Funding Rate (from GET /funding/projected) ---

export interface EtherealFundingRateResponse {
  productId: string;
  fundingRateProjected1h: string;
  fundingRate1h: string;
}

export const EtherealFundingRateResponseSchema = z
  .object({
    productId: z.string(),
    fundingRateProjected1h: z.string(),
    fundingRate1h: z.string(),
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

// --- My Trade (same shape as EtherealTradeResponse, from GET /order/trade) ---

export type EtherealMyTradeResponse = EtherealTradeResponse;

export const EtherealMyTradeResponseSchema = EtherealTradeResponseSchema;

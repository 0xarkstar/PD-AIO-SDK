/**
 * Aster Exchange-Specific Types
 */

import { z } from 'zod';
import type { ExchangeConfig } from '../../types/adapter.js';

export interface AsterConfig extends ExchangeConfig {
  apiKey?: string;
  apiSecret?: string;
  testnet?: boolean;
  timeout?: number;
  /** Referral code for fee sharing */
  referralCode?: string;
}

// --- API Response Types ---

export interface AsterExchangeInfo {
  timezone: string;
  serverTime: number;
  symbols: AsterSymbolInfo[];
}

export interface AsterSymbolInfo {
  symbol: string; // "BTCUSDT"
  pair: string; // "BTCUSDT"
  contractType: string; // "PERPETUAL"
  deliveryDate: number;
  onboardDate: number;
  status: string; // "TRADING"
  baseAsset: string; // "BTC"
  quoteAsset: string; // "USDT"
  marginAsset: string; // "USDT"
  pricePrecision: number;
  quantityPrecision: number;
  baseAssetPrecision: number;
  quotePrecision: number;
  underlyingType: string;
  settlePlan: number;
  triggerProtect: string;
  filters: AsterFilter[];
  orderTypes: string[];
  timeInForce: string[];
  liquidationFee: string;
  marketTakeBound: string;
}

export const AsterSymbolInfoSchema = z
  .object({
    symbol: z.string(),
    pair: z.string(),
    contractType: z.string(),
    deliveryDate: z.number(),
    onboardDate: z.number(),
    status: z.string(),
    baseAsset: z.string(),
    quoteAsset: z.string(),
    marginAsset: z.string(),
    pricePrecision: z.number(),
    quantityPrecision: z.number(),
    baseAssetPrecision: z.number(),
    quotePrecision: z.number(),
    underlyingType: z.string(),
    settlePlan: z.number(),
    triggerProtect: z.string(),
    filters: z.array(z.any()), // AsterFilter is a union type
    orderTypes: z.array(z.string()),
    timeInForce: z.array(z.string()),
    liquidationFee: z.string(),
    marketTakeBound: z.string(),
  })
  .passthrough();

export type AsterFilter =
  | AsterPriceFilter
  | AsterLotSizeFilter
  | AsterMinNotionalFilter
  | AsterMaxOrdersFilter
  | AsterPercentPriceFilter;

export interface AsterPriceFilter {
  filterType: 'PRICE_FILTER';
  minPrice: string;
  maxPrice: string;
  tickSize: string;
}

export interface AsterLotSizeFilter {
  filterType: 'LOT_SIZE';
  minQty: string;
  maxQty: string;
  stepSize: string;
}

export interface AsterMinNotionalFilter {
  filterType: 'MIN_NOTIONAL';
  notional: string;
}

export interface AsterMaxOrdersFilter {
  filterType: 'MAX_NUM_ORDERS';
  limit: number;
}

export interface AsterPercentPriceFilter {
  filterType: 'PERCENT_PRICE';
  multiplierUp: string;
  multiplierDown: string;
  multiplierDecimal: string;
}

export interface AsterTicker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  lastPrice: string;
  lastQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export const AsterTicker24hrSchema = z
  .object({
    symbol: z.string(),
    priceChange: z.string(),
    priceChangePercent: z.string(),
    weightedAvgPrice: z.string(),
    lastPrice: z.string(),
    lastQty: z.string(),
    openPrice: z.string(),
    highPrice: z.string(),
    lowPrice: z.string(),
    volume: z.string(),
    quoteVolume: z.string(),
    openTime: z.number(),
    closeTime: z.number(),
    firstId: z.number(),
    lastId: z.number(),
    count: z.number(),
  })
  .passthrough();

export interface AsterOrderBookResponse {
  lastUpdateId: number;
  bids: [string, string][]; // [price, qty]
  asks: [string, string][];
  T: number;
}

export const AsterOrderBookResponseSchema = z
  .object({
    lastUpdateId: z.number(),
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
    T: z.number(),
  })
  .passthrough();

export interface AsterTradeResponse {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
}

export const AsterTradeResponseSchema = z
  .object({
    id: z.number(),
    price: z.string(),
    qty: z.string(),
    quoteQty: z.string(),
    time: z.number(),
    isBuyerMaker: z.boolean(),
  })
  .passthrough();

export interface AsterPremiumIndex {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  estimatedSettlePrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  interestRate: string;
  time: number;
}

export const AsterPremiumIndexSchema = z
  .object({
    symbol: z.string(),
    markPrice: z.string(),
    indexPrice: z.string(),
    estimatedSettlePrice: z.string(),
    lastFundingRate: z.string(),
    nextFundingTime: z.number(),
    interestRate: z.string(),
    time: z.number(),
  })
  .passthrough();

export interface AsterKlineResponse {
  0: number; // Open time
  1: string; // Open
  2: string; // High
  3: string; // Low
  4: string; // Close
  5: string; // Volume
  6: number; // Close time
  7: string; // Quote asset volume
  8: number; // Number of trades
  9: string; // Taker buy base volume
  10: string; // Taker buy quote volume
  11: string; // Ignore
}

export interface AsterOrderResponse {
  orderId: number;
  symbol: string;
  status: string;
  clientOrderId: string;
  price: string;
  avgPrice: string;
  origQty: string;
  executedQty: string;
  cumQuote: string;
  timeInForce: string;
  type: string;
  reduceOnly: boolean;
  closePosition: boolean;
  side: string; // "BUY" | "SELL"
  positionSide: string; // "BOTH" | "LONG" | "SHORT"
  stopPrice: string;
  workingType: string;
  origType: string;
  updateTime: number;
}

export const AsterOrderResponseSchema = z
  .object({
    orderId: z.number(),
    symbol: z.string(),
    status: z.string(),
    clientOrderId: z.string(),
    price: z.string(),
    avgPrice: z.string(),
    origQty: z.string(),
    executedQty: z.string(),
    cumQuote: z.string(),
    timeInForce: z.string(),
    type: z.string(),
    reduceOnly: z.boolean(),
    closePosition: z.boolean(),
    side: z.string(),
    positionSide: z.string(),
    stopPrice: z.string(),
    workingType: z.string(),
    origType: z.string(),
    updateTime: z.number(),
  })
  .passthrough();

export interface AsterPositionRisk {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  maxNotionalValue: string;
  marginType: string; // "cross" | "isolated"
  isolatedMargin: string;
  isAutoAddMargin: string;
  positionSide: string;
  notional: string;
  isolatedWallet: string;
  updateTime: number;
}

export const AsterPositionRiskSchema = z
  .object({
    symbol: z.string(),
    positionAmt: z.string(),
    entryPrice: z.string(),
    markPrice: z.string(),
    unRealizedProfit: z.string(),
    liquidationPrice: z.string(),
    leverage: z.string(),
    maxNotionalValue: z.string(),
    marginType: z.string(),
    isolatedMargin: z.string(),
    isAutoAddMargin: z.string(),
    positionSide: z.string(),
    notional: z.string(),
    isolatedWallet: z.string(),
    updateTime: z.number(),
  })
  .passthrough();

export interface AsterAccountBalance {
  accountAlias: string;
  asset: string;
  balance: string;
  crossWalletBalance: string;
  crossUnPnl: string;
  availableBalance: string;
  maxWithdrawAmount: string;
  marginAvailable: boolean;
  updateTime: number;
}

export const AsterAccountBalanceSchema = z
  .object({
    accountAlias: z.string(),
    asset: z.string(),
    balance: z.string(),
    crossWalletBalance: z.string(),
    crossUnPnl: z.string(),
    availableBalance: z.string(),
    maxWithdrawAmount: z.string(),
    marginAvailable: z.boolean(),
    updateTime: z.number(),
  })
  .passthrough();

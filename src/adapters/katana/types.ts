/**
 * Katana-specific type definitions and Zod schemas
 */

import { z } from 'zod';

// -- API Response Types --

/**
 * Katana market from GET /v1/markets
 */
export interface KatanaMarket {
  market: string;
  type: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  stepSize: string;
  tickSize: string;
  indexPrice: string;
  indexPrice24h: string;
  indexPricePercentChange: string;
  lastFundingRate: string;
  currentFundingRate: string;
  nextFundingTime: number;
  makerOrderMinimum: string;
  takerOrderMinimum: string;
  marketOrderExecutionPriceLimit: string;
  limitOrderExecutionPriceLimit: string;
  minimumPositionSize: string;
  maximumPositionSize: string;
  initialMarginFraction: string;
  maintenanceMarginFraction: string;
  basePositionSize: string;
  incrementalPositionSize: string;
  incrementalInitialMarginFraction: string;
  makerFeeRate: string;
  takerFeeRate: string;
  volume24h: string;
  trades24h: number;
  openInterest: string;
}

export const KatanaMarketSchema = z
  .object({
    market: z.string(),
    type: z.string(),
    status: z.string(),
    baseAsset: z.string(),
    quoteAsset: z.string(),
    stepSize: z.string(),
    tickSize: z.string(),
    indexPrice: z.string(),
    lastFundingRate: z.string(),
    currentFundingRate: z.string(),
    nextFundingTime: z.number(),
    makerOrderMinimum: z.string(),
    takerOrderMinimum: z.string(),
    minimumPositionSize: z.string(),
    maximumPositionSize: z.string(),
    initialMarginFraction: z.string(),
    maintenanceMarginFraction: z.string(),
    makerFeeRate: z.string(),
    takerFeeRate: z.string(),
    volume24h: z.string(),
    openInterest: z.string(),
  })
  .passthrough();

/**
 * Katana ticker from GET /v1/tickers
 */
export interface KatanaTicker {
  market: string;
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  closeQuantity: string;
  baseVolume: string;
  quoteVolume: string;
  percentChange: string;
  trades: number;
  ask: string;
  bid: string;
  markPrice: string;
  indexPrice: string;
  indexPrice24h: string;
  indexPricePercentChange: string;
  lastFundingRate: string;
  currentFundingRate: string;
  nextFundingTime: number;
  openInterest: string;
  sequence: number;
}

export const KatanaTickerSchema = z
  .object({
    market: z.string(),
    time: z.number(),
    open: z.string(),
    high: z.string(),
    low: z.string(),
    close: z.string(),
    baseVolume: z.string(),
    quoteVolume: z.string(),
    percentChange: z.string(),
    ask: z.string(),
    bid: z.string(),
    markPrice: z.string(),
    indexPrice: z.string(),
  })
  .passthrough();

/**
 * Katana orderbook from GET /v1/orderbook
 */
export interface KatanaOrderBook {
  sequence: number;
  bids: Array<[string, string, number]>; // [price, quantity, orderCount]
  asks: Array<[string, string, number]>;
  lastPrice: string;
  markPrice: string;
  indexPrice: string;
}

export const KatanaOrderBookSchema = z
  .object({
    sequence: z.number(),
    bids: z.array(z.tuple([z.string(), z.string(), z.number()])),
    asks: z.array(z.tuple([z.string(), z.string(), z.number()])),
    lastPrice: z.string(),
    markPrice: z.string(),
    indexPrice: z.string(),
  })
  .passthrough();

/**
 * Katana trade from GET /v1/trades
 */
export interface KatanaTrade {
  fillId: string;
  market: string;
  price: string;
  quantity: string;
  quoteQuantity: string;
  time: number;
  side: string;
  sequence: number;
}

export const KatanaTradeSchema = z
  .object({
    fillId: z.string(),
    market: z.string(),
    price: z.string(),
    quantity: z.string(),
    quoteQuantity: z.string(),
    time: z.number(),
    side: z.string(),
  })
  .passthrough();

/**
 * Katana OHLCV candle from GET /v1/candles
 */
export interface KatanaCandle {
  start: number;
  open: string;
  high: string;
  low: string;
  close: string;
  baseVolume: string;
  quoteVolume: string;
  trades: number;
  sequence: number;
}

export const KatanaCandleSchema = z
  .object({
    start: z.number(),
    open: z.string(),
    high: z.string(),
    low: z.string(),
    close: z.string(),
    baseVolume: z.string(),
    quoteVolume: z.string(),
    trades: z.number(),
  })
  .passthrough();

/**
 * Katana funding rate from GET /v1/fundingRates
 */
export interface KatanaFundingRate {
  market: string;
  rate: string;
  time: number;
}

export const KatanaFundingRateSchema = z
  .object({
    market: z.string(),
    rate: z.string(),
    time: z.number(),
  })
  .passthrough();

/**
 * Katana order from GET /v1/orders
 */
export interface KatanaOrder {
  orderId: string;
  clientOrderId: string;
  market: string;
  type: number;
  side: number;
  state: string;
  quantity: string;
  filledQuantity: string;
  limitPrice: string;
  triggerPrice: string;
  time: number;
  expirationTime?: number;
  fees: string;
  createdAt: number;
}

export const KatanaOrderSchema = z
  .object({
    orderId: z.string(),
    clientOrderId: z.string(),
    market: z.string(),
    type: z.number(),
    side: z.number(),
    state: z.string(),
    quantity: z.string(),
    filledQuantity: z.string(),
    limitPrice: z.string(),
    triggerPrice: z.string(),
    time: z.number(),
    fees: z.string(),
    createdAt: z.number(),
  })
  .passthrough();

/**
 * Katana position from GET /v1/positions
 */
export interface KatanaPosition {
  market: string;
  quantity: string;
  maximumQuantity: string;
  entryPrice: string;
  exitPrice: string;
  markPrice: string;
  indexPrice: string;
  liquidationPrice: string;
  value: string;
  realizedPnL: string;
  unrealizedPnL: string;
  marginRequirement: string;
  leverage: string;
  totalFunding: string;
  totalOpen: string;
  totalClose: string;
  adlQuintile: number;
  openedByFillId: string;
  lastFillId: string;
  time: number;
}

export const KatanaPositionSchema = z
  .object({
    market: z.string(),
    quantity: z.string(),
    entryPrice: z.string(),
    markPrice: z.string(),
    indexPrice: z.string(),
    liquidationPrice: z.string(),
    realizedPnL: z.string(),
    unrealizedPnL: z.string(),
    marginRequirement: z.string(),
    leverage: z.string(),
    adlQuintile: z.number(),
    time: z.number(),
  })
  .passthrough();

/**
 * Katana wallet/balance from GET /v1/wallets
 */
export interface KatanaWallet {
  wallet: string;
  equity: string;
  freeCollateral: string;
  heldCollateral: string;
  availableCollateral: string;
  buyingPower: string;
  leverage: string;
  marginRatio: string;
  quoteBalance: string;
  unrealizedPnL: string;
  makerFeeRate: string;
  takerFeeRate: string;
}

export const KatanaWalletSchema = z
  .object({
    wallet: z.string(),
    equity: z.string(),
    freeCollateral: z.string(),
    heldCollateral: z.string(),
    availableCollateral: z.string(),
    quoteBalance: z.string(),
    unrealizedPnL: z.string(),
  })
  .passthrough();

/**
 * Katana fill from GET /v1/fills
 */
export interface KatanaFill {
  fillId: string;
  orderId: string;
  market: string;
  price: string;
  quantity: string;
  quoteQuantity: string;
  side: string;
  time: number;
  fee: string;
  feeAsset: string;
  liquidity: string;
  sequence: number;
}

export const KatanaFillSchema = z
  .object({
    fillId: z.string(),
    orderId: z.string(),
    market: z.string(),
    price: z.string(),
    quantity: z.string(),
    quoteQuantity: z.string(),
    side: z.string(),
    time: z.number(),
    fee: z.string(),
  })
  .passthrough();

/**
 * Katana server time from GET /v1/time
 */
export interface KatanaServerTime {
  serverTime: number;
}

/**
 * Katana order request payload for POST /v1/orders
 */
export interface KatanaOrderRequest {
  nonce: string; // UUID v1
  wallet: string;
  market: string;
  type: number;
  side: number;
  quantity: string;
  limitPrice: string;
  triggerPrice: string;
  triggerType: number;
  callbackRate: string;
  conditionalOrderId: number;
  isReduceOnly: boolean;
  timeInForce: number;
  selfTradePrevention: number;
  isLiquidationAcquisitionOnly: boolean;
  delegatedPublicKey: string;
  clientOrderId: string;
  signature: string;
}

/**
 * Katana cancel request payload for DELETE /v1/orders
 */
export interface KatanaCancelRequest {
  nonce: string;
  wallet: string;
  orderId?: string;
  market?: string;
  signature: string;
}

/**
 * Katana WebSocket subscription message
 */
export interface KatanaWsSubscription {
  type: 'subscribe' | 'unsubscribe';
  channel: string;
  market?: string;
  interval?: string;
}

/**
 * Katana WebSocket message envelope
 */
export interface KatanaWsMessage {
  type: string;
  channel: string;
  market?: string;
  data: unknown;
}

/**
 * EIP-712 order signing payload
 */
export interface KatanaOrderSignPayload {
  nonce: string;
  wallet: string;
  market: string;
  type: number;
  side: number;
  quantity: string;
  limitPrice: string;
  triggerPrice: string;
  triggerType: number;
  callbackRate: string;
  conditionalOrderId: number;
  isReduceOnly: boolean;
  timeInForce: number;
  selfTradePrevention: number;
  isLiquidationAcquisitionOnly: boolean;
  delegatedPublicKey: string;
  clientOrderId: string;
}

/**
 * EIP-712 cancel signing payload
 */
export interface KatanaCancelSignPayload {
  nonce: string;
  wallet: string;
  orderId: string;
  market: string;
}

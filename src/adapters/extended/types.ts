/**
 * Extended Exchange Types
 *
 * TypeScript types and Zod schemas for Extended API responses
 */

import { z } from 'zod';

/**
 * Extended market data type (Legacy SDK format)
 */
export interface ExtendedMarket {
  marketId: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  settleAsset: string;
  isActive: boolean;
  minOrderQuantity: string;
  maxOrderQuantity: string;
  minPrice: string;
  maxPrice: string;
  quantityPrecision: number;
  pricePrecision: number;
  contractMultiplier: string;
  maxLeverage: string;
  fundingInterval: number;
  settlementPeriod?: number;
}

/**
 * Extended market data type (Actual API format)
 */
export interface ExtendedMarketApiFormat {
  name: string;
  assetName: string;
  collateralAssetName: string;
  active: boolean;
  tradingConfig?: {
    minOrderSize?: string;
    maxPositionValue?: string;
    maxLeverage?: string;
    minPriceChange?: string;
    minOrderSizeChange?: string;
  };
  assetPrecision?: number;
  collateralAssetPrecision?: number;
  contractMultiplier?: string;
  fundingInterval?: number;
  settlementPeriod?: number;
}

export const ExtendedMarketApiFormatSchema = z
  .object({
    name: z.string(),
    assetName: z.string(),
    collateralAssetName: z.string(),
    active: z.boolean(),
    tradingConfig: z
      .object({
        minOrderSize: z.string().optional(),
        maxPositionValue: z.string().optional(),
        maxLeverage: z.string().optional(),
        minPriceChange: z.string().optional(),
        minOrderSizeChange: z.string().optional(),
      })
      .passthrough()
      .optional(),
    assetPrecision: z.number().optional(),
    collateralAssetPrecision: z.number().optional(),
    contractMultiplier: z.string().optional(),
    fundingInterval: z.number().optional(),
    settlementPeriod: z.number().optional(),
  })
  .passthrough();

/**
 * Union type for Extended market data
 * Handles both legacy SDK type and actual API response format
 */
export type ExtendedMarketRaw = ExtendedMarket | ExtendedMarketApiFormat;

/**
 * Extended ticker data type
 */
export interface ExtendedTicker {
  symbol: string;
  lastPrice: string;
  bidPrice: string;
  askPrice: string;
  volume24h: string;
  quoteVolume24h: string;
  high24h: string;
  low24h: string;
  priceChange24h: string;
  priceChangePercent24h: string;
  openInterest?: string;
  indexPrice?: string;
  markPrice?: string;
  fundingRate?: string;
  nextFundingTime?: number;
  timestamp: number;
}

/**
 * Extended order book data type
 */
export interface ExtendedOrderBook {
  symbol: string;
  bids: [string, string][]; // [price, size]
  asks: [string, string][];
  timestamp: number;
  sequence?: number;
  checksum?: string;
}

/**
 * Extended trade data type
 */
export interface ExtendedTrade {
  id: string;
  symbol: string;
  price: string;
  quantity: string;
  side: 'buy' | 'sell';
  timestamp: number;
  isMaker?: boolean;
  tradeId?: string;
}

/**
 * Extended funding rate data type
 */
export interface ExtendedFundingRate {
  symbol: string;
  fundingRate: string;
  fundingTime: number;
  nextFundingTime?: number;
  indexPrice: string;
  markPrice: string;
  premiumRate?: string;
}

export const ExtendedFundingRateSchema = z
  .object({
    symbol: z.string(),
    fundingRate: z.string(),
    fundingTime: z.number(),
    nextFundingTime: z.number().optional(),
    indexPrice: z.string(),
    markPrice: z.string(),
    premiumRate: z.string().optional(),
  })
  .passthrough();

/**
 * Extended order data type
 */
export interface ExtendedOrder {
  orderId: string;
  clientOrderId?: string;
  symbol: string;
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  side: 'buy' | 'sell';
  status: 'pending' | 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected' | 'expired';
  price?: string;
  stopPrice?: string;
  quantity: string;
  filledQuantity?: string;
  remainingQuantity?: string;
  averagePrice?: string;
  leverage?: string;
  marginMode?: 'cross' | 'isolated';
  timestamp: number;
  updateTime?: number;
  postOnly?: boolean;
  reduceOnly?: boolean;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  fees?: {
    asset: string;
    amount: string;
  };
  starknetTxHash?: string;
}

/**
 * Extended position data type
 */
export interface ExtendedPosition {
  symbol: string;
  side: 'long' | 'short';
  size: string;
  entryPrice: string;
  markPrice: string;
  indexPrice?: string;
  liquidationPrice: string;
  margin: string;
  initialMargin: string;
  maintenanceMargin: string;
  leverage: string;
  marginMode: 'cross' | 'isolated';
  unrealizedPnl: string;
  realizedPnl: string;
  roi?: string;
  adlLevel?: number;
  timestamp: number;
  starknetPosition?: any;
}

/**
 * Extended balance data type
 */
export interface ExtendedBalance {
  asset: string;
  free: string;
  locked: string;
  total: string;
  availableMargin: string;
  usedMargin: string;
  equity?: string;
  timestamp?: number;
}

/**
 * Extended order request type
 */
export interface ExtendedOrderRequest {
  symbol: string;
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  side: 'buy' | 'sell';
  quantity: string;
  price?: string;
  stopPrice?: string;
  clientOrderId?: string;
  postOnly?: boolean;
  reduceOnly?: boolean;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  leverage?: string;
  marginMode?: 'cross' | 'isolated';
}

/**
 * Extended user fees type
 */
export interface ExtendedUserFees {
  maker: string;
  taker: string;
  tierLevel: string;
  volume30d: string;
  makerDiscount?: string;
  takerDiscount?: string;
}

/**
 * Extended portfolio type
 */
export interface ExtendedPortfolio {
  totalEquity: string;
  availableBalance: string;
  usedMargin: string;
  marginRatio: string;
  unrealizedPnl: string;
  realizedPnl: string;
  dailyPnl: string;
  weeklyPnl?: string;
  monthlyPnl?: string;
  timestamp: number;
}

/**
 * Extended leverage settings type
 */
export interface ExtendedLeverageSettings {
  symbol: string;
  leverage: string;
  maxLeverage: string;
  marginMode: 'cross' | 'isolated';
}

/**
 * Extended StarkNet account state type
 */
export interface ExtendedStarkNetState {
  address: string;
  balance: string;
  nonce: number;
  contractClass?: string;
  positions?: any[];
}

/**
 * Extended StarkNet transaction type
 */
export interface ExtendedStarkNetTransaction {
  txHash: string;
  status: 'pending' | 'accepted' | 'rejected';
  type: string;
  blockNumber?: number;
  timestamp?: number;
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

export const ExtendedMarketSchema = z
  .object({
    marketId: z.string().optional(),
    symbol: z.string(),
    baseAsset: z.string().optional(),
    quoteAsset: z.string().optional(),
    settleAsset: z.string().optional(),
    isActive: z.boolean().optional(),
    minOrderQuantity: z.string().optional(),
    maxOrderQuantity: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    quantityPrecision: z.number().optional(),
    pricePrecision: z.number().optional(),
    contractMultiplier: z.string().optional(),
    maxLeverage: z.string().optional(),
    fundingInterval: z.number().optional(),
    settlementPeriod: z.number().optional(),
  })
  .passthrough();

export const ExtendedTickerSchema = z
  .object({
    symbol: z.string(),
    lastPrice: z.string().optional(),
    bidPrice: z.string().optional(),
    askPrice: z.string().optional(),
    volume24h: z.string().optional(),
    quoteVolume24h: z.string().optional(),
    high24h: z.string().optional(),
    low24h: z.string().optional(),
    priceChange24h: z.string().optional(),
    priceChangePercent24h: z.string().optional(),
    openInterest: z.string().optional(),
    indexPrice: z.string().optional(),
    markPrice: z.string().optional(),
    fundingRate: z.string().optional(),
    nextFundingTime: z.number().optional(),
    timestamp: z.number().optional(),
  })
  .passthrough();

export const ExtendedOrderBookSchema = z
  .object({
    symbol: z.string(),
    bids: z.array(z.tuple([z.string(), z.string()])).optional(),
    asks: z.array(z.tuple([z.string(), z.string()])).optional(),
    timestamp: z.number().optional(),
    sequence: z.number().optional(),
    checksum: z.string().optional(),
  })
  .passthrough();

export const ExtendedTradeSchema = z
  .object({
    id: z.string(),
    symbol: z.string(),
    price: z.string().optional(),
    quantity: z.string().optional(),
    side: z.string().optional(),
    timestamp: z.number().optional(),
    isMaker: z.boolean().optional(),
    tradeId: z.string().optional(),
  })
  .passthrough();

export const ExtendedOrderSchema = z
  .object({
    orderId: z.string(),
    clientOrderId: z.string().optional(),
    symbol: z.string(),
    type: z.enum(['market', 'limit', 'stop', 'stop_limit']),
    side: z.enum(['buy', 'sell']),
    status: z.enum([
      'pending',
      'open',
      'filled',
      'partially_filled',
      'cancelled',
      'rejected',
      'expired',
    ]),
    price: z.string().optional(),
    stopPrice: z.string().optional(),
    quantity: z.string(),
    filledQuantity: z.string().optional(),
    remainingQuantity: z.string().optional(),
    averagePrice: z.string().optional(),
    leverage: z.string().optional(),
    marginMode: z.string().optional(),
    timestamp: z.number(),
    updateTime: z.number().optional(),
    postOnly: z.boolean().optional(),
    reduceOnly: z.boolean().optional(),
    timeInForce: z.string().optional(),
    fees: z
      .object({
        asset: z.string(),
        amount: z.string(),
      })
      .passthrough()
      .optional(),
    starknetTxHash: z.string().optional(),
  })
  .passthrough();

export const ExtendedPositionSchema = z
  .object({
    symbol: z.string(),
    side: z.enum(['long', 'short']),
    size: z.string(),
    entryPrice: z.string(),
    markPrice: z.string(),
    indexPrice: z.string().optional(),
    liquidationPrice: z.string(),
    margin: z.string(),
    initialMargin: z.string(),
    maintenanceMargin: z.string(),
    leverage: z.string(),
    marginMode: z.enum(['cross', 'isolated']),
    unrealizedPnl: z.string(),
    realizedPnl: z.string(),
    roi: z.string().optional(),
    adlLevel: z.number().optional(),
    timestamp: z.number(),
    starknetPosition: z.any().optional(),
  })
  .passthrough();

export const ExtendedBalanceSchema = z
  .object({
    asset: z.string(),
    free: z.string(),
    locked: z.string(),
    total: z.string(),
    availableMargin: z.string(),
    usedMargin: z.string(),
    equity: z.string().optional(),
    timestamp: z.number().optional(),
  })
  .passthrough();

// ============================================================================
// WebSocket Types
// ============================================================================

/**
 * WebSocket order book update
 */
export interface ExtendedWsOrderBookUpdate {
  channel: 'orderbook';
  symbol: string;
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number;
  sequence: number;
  checksum?: string;
}

/**
 * WebSocket trade update
 */
export interface ExtendedWsTradeUpdate {
  channel: 'trades';
  id: string;
  symbol: string;
  price: string;
  quantity: string;
  side: 'buy' | 'sell';
  timestamp: number;
}

/**
 * WebSocket ticker update
 */
export interface ExtendedWsTickerUpdate {
  channel: 'ticker';
  symbol: string;
  lastPrice: string;
  bidPrice: string;
  askPrice: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  quoteVolume24h: string;
  priceChange24h: string;
  priceChangePercent24h: string;
  timestamp: number;
}

/**
 * WebSocket position update
 */
export interface ExtendedWsPositionUpdate {
  channel: 'positions';
  positions: ExtendedPosition[];
  timestamp: number;
}

/**
 * WebSocket order update
 */
export interface ExtendedWsOrderUpdate {
  channel: 'orders';
  orders: ExtendedOrder[];
  timestamp: number;
}

/**
 * WebSocket balance update
 */
export interface ExtendedWsBalanceUpdate {
  channel: 'balance';
  balances: ExtendedBalance[];
  timestamp: number;
}

/**
 * WebSocket funding rate update
 */
export interface ExtendedWsFundingRateUpdate {
  channel: 'funding';
  symbol: string;
  fundingRate: string;
  fundingTime: number;
  nextFundingTime?: number;
  markPrice: string;
  indexPrice: string;
  timestamp: number;
}

/**
 * WebSocket message union type
 */
export type ExtendedWsMessage =
  | ExtendedWsOrderBookUpdate
  | ExtendedWsTradeUpdate
  | ExtendedWsTickerUpdate
  | ExtendedWsPositionUpdate
  | ExtendedWsOrderUpdate
  | ExtendedWsBalanceUpdate
  | ExtendedWsFundingRateUpdate;

/**
 * WebSocket subscription request
 */
export interface ExtendedWsSubscription {
  action: 'subscribe' | 'unsubscribe';
  channel: string;
  symbol?: string;
}

/**
 * WebSocket authentication message
 */
export interface ExtendedWsAuth {
  action: 'auth';
  apiKey: string;
  timestamp: number;
  signature?: string;
}

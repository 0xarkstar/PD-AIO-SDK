/**
 * Variational Exchange Types
 *
 * TypeScript types and Zod schemas for Variational API responses
 */

import { z } from 'zod';

/**
 * Variational /metadata/stats API response types
 */

// Quote object for different notional sizes
export interface VariationalQuoteData {
  bid: string;
  ask: string;
}

// Quotes at multiple notional sizes
export interface VariationalQuotes {
  updated_at: string;
  size_1k: VariationalQuoteData;
  size_100k: VariationalQuoteData;
  size_1m?: VariationalQuoteData; // Only for major assets
}

// Open interest breakdown
export interface VariationalOpenInterest {
  long_open_interest: string;
  short_open_interest: string;
}

// Per-listing statistics
export interface VariationalListing {
  ticker: string;
  name: string;
  mark_price: string;
  volume_24h: string;
  open_interest: VariationalOpenInterest;
  funding_rate: string;
  funding_interval_s: number;
  base_spread_bps: string;
  quotes: VariationalQuotes;
}

// Loss refund pool data
export interface VariationalLossRefund {
  pool_size: string;
  refunded_24h: string;
}

// Complete /metadata/stats response
export interface VariationalMetadataStats {
  total_volume_24h: string;
  cumulative_volume: string;
  tvl: string;
  open_interest: string;
  num_markets: number;
  loss_refund: VariationalLossRefund;
  listings: VariationalListing[];
}

/**
 * Variational market data type (normalized)
 */
export interface VariationalMarket {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: 'active' | 'inactive' | 'delisted';
  minOrderSize: string;
  maxOrderSize?: string;
  tickSize: string;
  contractSize?: string;
  maxLeverage?: string;
  fundingInterval?: number;
  settlementTime?: number;
}

/**
 * Variational ticker data type
 */
export interface VariationalTicker {
  symbol: string;
  lastPrice: string;
  bidPrice: string;
  askPrice: string;
  volume24h: string;
  high24h: string;
  low24h: string;
  priceChange24h: string;
  priceChangePercent24h: string;
  timestamp: number;
}

/**
 * Variational order book data type
 */
export interface VariationalOrderBook {
  symbol: string;
  bids: [string, string][]; // [price, size]
  asks: [string, string][];
  timestamp: number;
  sequence?: number;
}

/**
 * Variational trade data type
 */
export interface VariationalTrade {
  id: string;
  symbol: string;
  price: string;
  amount: string;
  side: 'buy' | 'sell';
  timestamp: number;
  isMaker?: boolean;
}

/**
 * Variational funding rate data type
 */
export interface VariationalFundingRate {
  symbol: string;
  fundingRate: string;
  fundingTime: number;
  nextFundingTime?: number;
  indexPrice?: string;
  markPrice?: string;
}

/**
 * Variational RFQ quote data type
 */
export interface VariationalQuote {
  quoteId: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: string;
  amount: string;
  expiresAt: number;
  marketMaker: string;
  spread?: string;
  timestamp: number;
}

/**
 * Variational order data type
 */
export interface VariationalOrder {
  orderId: string;
  clientOrderId?: string;
  symbol: string;
  type: 'market' | 'limit' | 'rfq';
  side: 'buy' | 'sell';
  status: 'pending' | 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected' | 'expired';
  price?: string;
  amount: string;
  filledAmount?: string;
  remainingAmount?: string;
  averagePrice?: string;
  timestamp: number;
  updateTime?: number;
  postOnly?: boolean;
  reduceOnly?: boolean;
  quoteId?: string; // For RFQ orders
  fees?: {
    asset: string;
    amount: string;
  };
}

/**
 * Variational position data type
 */
export interface VariationalPosition {
  symbol: string;
  side: 'long' | 'short';
  size: string;
  entryPrice: string;
  markPrice: string;
  liquidationPrice?: string;
  margin: string;
  leverage: string;
  unrealizedPnl: string;
  realizedPnl?: string;
  timestamp: number;
}

/**
 * Variational balance data type
 */
export interface VariationalBalance {
  asset: string;
  free: string;
  locked: string;
  total: string;
  availableMargin?: string;
  usedMargin?: string;
  timestamp?: number;
}

/**
 * Variational order request type
 */
export interface VariationalOrderRequest {
  symbol: string;
  type: 'market' | 'limit' | 'rfq';
  side: 'buy' | 'sell';
  amount: string;
  price?: string;
  clientOrderId?: string;
  postOnly?: boolean;
  reduceOnly?: boolean;
  quoteId?: string; // For RFQ orders
}

/**
 * Variational quote request type
 */
export interface VariationalQuoteRequest {
  symbol: string;
  side: 'buy' | 'sell';
  amount: string;
  maxSlippage?: string;
}

/**
 * Variational user fees type
 */
export interface VariationalUserFees {
  maker: string;
  taker: string;
  tierLevel?: string;
  volume30d?: string;
}

/**
 * Variational portfolio type
 */
export interface VariationalPortfolio {
  totalEquity: string;
  availableBalance: string;
  usedMargin: string;
  unrealizedPnl: string;
  realizedPnl: string;
  dailyPnl: string;
  timestamp: number;
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

export const VariationalMarketSchema = z
  .object({
    symbol: z.string(),
    baseAsset: z.string(),
    quoteAsset: z.string(),
    status: z.string(),
    minOrderSize: z.union([z.string(), z.number()]),
    maxOrderSize: z.union([z.string(), z.number()]).optional(),
    tickSize: z.union([z.string(), z.number()]),
    contractSize: z.union([z.string(), z.number()]).optional(),
    maxLeverage: z.union([z.string(), z.number()]).optional(),
    fundingInterval: z.number().optional(),
    settlementTime: z.number().optional(),
  })
  .passthrough();

export const VariationalTickerSchema = z
  .object({
    symbol: z.string(),
    lastPrice: z.string(),
    bidPrice: z.string(),
    askPrice: z.string(),
    volume24h: z.string(),
    high24h: z.string(),
    low24h: z.string(),
    priceChange24h: z.string(),
    priceChangePercent24h: z.string(),
    timestamp: z.number(),
  })
  .passthrough();

export const VariationalOrderBookSchema = z
  .object({
    symbol: z.string(),
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
    timestamp: z.number(),
    sequence: z.number().optional(),
  })
  .passthrough();

export const VariationalTradeSchema = z
  .object({
    id: z.string(),
    symbol: z.string(),
    price: z.union([z.string(), z.number()]),
    amount: z.union([z.string(), z.number()]),
    side: z.string(),
    timestamp: z.number(),
    isMaker: z.boolean().optional(),
  })
  .passthrough();

export const VariationalQuoteSchema = z
  .object({
    quoteId: z.string(),
    symbol: z.string(),
    side: z.string(),
    price: z.union([z.string(), z.number()]),
    amount: z.union([z.string(), z.number()]),
    expiresAt: z.number(),
    marketMaker: z.string(),
    spread: z.union([z.string(), z.number()]).optional(),
    timestamp: z.number(),
  })
  .passthrough();

export const VariationalOrderSchema = z
  .object({
    orderId: z.string(),
    clientOrderId: z.string().optional(),
    symbol: z.string(),
    type: z.string(),
    side: z.string(),
    status: z.string(),
    price: z.string().optional(),
    amount: z.union([z.string(), z.number()]),
    filledAmount: z.union([z.string(), z.number()]).optional(),
    remainingAmount: z.union([z.string(), z.number()]).optional(),
    averagePrice: z.union([z.string(), z.number()]).optional(),
    timestamp: z.number(),
    updateTime: z.number().optional(),
    postOnly: z.boolean().optional(),
    reduceOnly: z.boolean().optional(),
    quoteId: z.string().optional(),
    fees: z
      .object({
        asset: z.string(),
        amount: z.string(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const VariationalPositionSchema = z
  .object({
    symbol: z.string(),
    side: z.string(),
    size: z.union([z.string(), z.number()]),
    entryPrice: z.union([z.string(), z.number()]),
    markPrice: z.union([z.string(), z.number()]),
    liquidationPrice: z.union([z.string(), z.number()]).optional(),
    margin: z.union([z.string(), z.number()]),
    leverage: z.union([z.string(), z.number()]),
    unrealizedPnl: z.union([z.string(), z.number()]),
    realizedPnl: z.union([z.string(), z.number()]).optional(),
    timestamp: z.number(),
  })
  .passthrough();

export const VariationalBalanceSchema = z
  .object({
    asset: z.string(),
    free: z.string(),
    locked: z.string(),
    total: z.string(),
    availableMargin: z.string().optional(),
    usedMargin: z.string().optional(),
    timestamp: z.number().optional(),
  })
  .passthrough();

export const VariationalFundingRateSchema = z
  .object({
    symbol: z.string(),
    fundingRate: z.string(),
    fundingTime: z.number(),
    nextFundingTime: z.number().optional(),
    indexPrice: z.string().optional(),
    markPrice: z.string().optional(),
  })
  .passthrough();

export const VariationalQuoteDataSchema = z
  .object({
    bid: z.string(),
    ask: z.string(),
  })
  .passthrough();

export const VariationalQuotesSchema = z
  .object({
    updated_at: z.string(),
    size_1k: VariationalQuoteDataSchema,
    size_100k: VariationalQuoteDataSchema,
    size_1m: VariationalQuoteDataSchema.optional(),
  })
  .passthrough();

export const VariationalOpenInterestSchema = z
  .object({
    long_open_interest: z.string(),
    short_open_interest: z.string(),
  })
  .passthrough();

export const VariationalListingSchema = z
  .object({
    ticker: z.string(),
    name: z.string(),
    mark_price: z.string(),
    volume_24h: z.string(),
    open_interest: VariationalOpenInterestSchema,
    funding_rate: z.string(),
    funding_interval_s: z.number(),
    base_spread_bps: z.string(),
    quotes: VariationalQuotesSchema,
  })
  .passthrough();

export const VariationalLossRefundSchema = z
  .object({
    pool_size: z.string(),
    refunded_24h: z.string(),
  })
  .passthrough();

export const VariationalMetadataStatsSchema = z
  .object({
    total_volume_24h: z.string(),
    cumulative_volume: z.string(),
    tvl: z.string(),
    open_interest: z.string(),
    num_markets: z.number(),
    loss_refund: VariationalLossRefundSchema,
    listings: z.array(VariationalListingSchema),
  })
  .passthrough();

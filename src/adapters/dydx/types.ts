/**
 * dYdX v4 Exchange-Specific Types
 *
 * Type definitions for dYdX v4 Indexer API responses and WebSocket messages
 */

import { z } from 'zod';

// =============================================================================
// Market Types
// =============================================================================

export interface DydxPerpetualMarket {
  /** Market ticker (e.g., "BTC-USD") */
  ticker: string;
  /** Market status */
  status: 'ACTIVE' | 'PAUSED' | 'CANCEL_ONLY' | 'POST_ONLY' | 'INITIALIZING' | 'FINAL_SETTLEMENT';
  /** Base asset */
  baseAsset: string;
  /** Quote asset (USD) */
  quoteAsset: string;
  /** Oracle price */
  oraclePrice: string;
  /** Price change over 24h */
  priceChange24H: string;
  /** 24h trading volume */
  volume24H: string;
  /** Number of trades in 24h */
  trades24H: number;
  /** Open interest */
  openInterest: string;
  /** Open interest in USD */
  openInterestUSDC: string;
  /** Next funding rate */
  nextFundingRate: string;
  /** Next funding at timestamp */
  nextFundingAt: string;
  /** Initial margin fraction */
  initialMarginFraction: string;
  /** Maintenance margin fraction */
  maintenanceMarginFraction: string;
  /** Step size for order amounts */
  stepSize: string;
  /** Step base quantums */
  stepBaseQuantums: number;
  /** Subticks per tick */
  subticksPerTick: number;
  /** Tick size for prices */
  tickSize: string;
  /** Atomic resolution */
  atomicResolution: number;
  /** Quantum conversion exponent */
  quantumConversionExponent: number;
  /** Base position notional */
  basePositionNotional?: string;
}

export const DydxPerpetualMarketSchema = z
  .object({
    ticker: z.string(),
    status: z.string().optional(),
    baseAsset: z.string().optional(),
    quoteAsset: z.string().optional(),
    oraclePrice: z.string().optional(),
    priceChange24H: z.string().optional(),
    volume24H: z.string().optional(),
    trades24H: z.union([z.number(), z.string()]).optional(),
    openInterest: z.string().optional(),
    openInterestUSDC: z.string().optional(),
    nextFundingRate: z.string().optional(),
    nextFundingAt: z.string().optional(),
    initialMarginFraction: z.string().optional(),
    maintenanceMarginFraction: z.string().optional(),
    stepSize: z.string().optional(),
    stepBaseQuantums: z.number().optional(),
    subticksPerTick: z.number().optional(),
    tickSize: z.string().optional(),
    atomicResolution: z.number().optional(),
    quantumConversionExponent: z.number().optional(),
    basePositionNotional: z.string().optional(),
  })
  .passthrough();

export interface DydxPerpetualMarketsResponse {
  markets: Record<string, DydxPerpetualMarket>;
}

export const DydxPerpetualMarketsResponseSchema = z
  .object({
    markets: z.record(z.string(), DydxPerpetualMarketSchema),
  })
  .passthrough();

// =============================================================================
// Order Book Types
// =============================================================================

export interface DydxOrderBookLevel {
  price: string;
  size: string;
}

export const DydxOrderBookLevelSchema = z
  .object({
    price: z.string(),
    size: z.string(),
  })
  .passthrough();

export interface DydxOrderBookResponse {
  bids: DydxOrderBookLevel[];
  asks: DydxOrderBookLevel[];
}

export const DydxOrderBookResponseSchema = z
  .object({
    bids: z.array(DydxOrderBookLevelSchema),
    asks: z.array(DydxOrderBookLevelSchema),
  })
  .passthrough();

// =============================================================================
// Trade Types
// =============================================================================

export interface DydxTrade {
  id: string;
  side: 'BUY' | 'SELL';
  size: string;
  price: string;
  type: 'LIMIT' | 'LIQUIDATED' | 'DELEVERAGED';
  createdAt: string;
  createdAtHeight: string;
}

export const DydxTradeSchema = z
  .object({
    id: z.string(),
    side: z.string(),
    size: z.string(),
    price: z.string(),
    type: z.string(),
    createdAt: z.string(),
    createdAtHeight: z.string(),
  })
  .passthrough();

export interface DydxTradesResponse {
  trades: DydxTrade[];
}

export const DydxTradesResponseSchema = z
  .object({
    trades: z.array(DydxTradeSchema),
  })
  .passthrough();

// =============================================================================
// Order Types
// =============================================================================

export interface DydxOrder {
  id: string;
  subaccountId: string;
  clientId: string;
  clobPairId: string;
  side: 'BUY' | 'SELL';
  size: string;
  price: string;
  totalFilled: string;
  goodTilBlock?: string;
  goodTilBlockTime?: string;
  status: 'OPEN' | 'FILLED' | 'CANCELED' | 'BEST_EFFORT_CANCELED' | 'UNTRIGGERED' | 'PENDING';
  type:
    | 'LIMIT'
    | 'MARKET'
    | 'STOP_LIMIT'
    | 'STOP_MARKET'
    | 'TRAILING_STOP'
    | 'TAKE_PROFIT'
    | 'TAKE_PROFIT_MARKET';
  timeInForce: 'GTT' | 'FOK' | 'IOC';
  postOnly: boolean;
  reduceOnly: boolean;
  ticker: string;
  orderFlags: string;
  triggerPrice?: string;
  createdAtHeight?: string;
  updatedAt?: string;
  updatedAtHeight?: string;
  clientMetadata: string;
  removalReason?: string;
}

export const DydxOrderSchema = z
  .object({
    id: z.string(),
    subaccountId: z.string().optional(),
    clientId: z.union([z.string(), z.null()]).optional(),
    clobPairId: z.union([z.string(), z.number()]).optional(),
    side: z.string().optional(),
    size: z.string().optional(),
    price: z.union([z.string(), z.null()]).optional(),
    totalFilled: z.string().optional(),
    goodTilBlock: z.union([z.string(), z.number(), z.null()]).optional(),
    goodTilBlockTime: z.union([z.string(), z.number(), z.null()]).optional(),
    status: z.string().optional(),
    type: z.string().optional(),
    timeInForce: z.string().optional(),
    postOnly: z.boolean().optional(),
    reduceOnly: z.boolean().optional(),
    ticker: z.string().optional(),
    orderFlags: z.string().optional(),
    triggerPrice: z.union([z.string(), z.null()]).optional(),
    createdAtHeight: z.string().optional(),
    updatedAt: z.string().optional(),
    updatedAtHeight: z.string().optional(),
    clientMetadata: z.string().optional(),
    removalReason: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();

export interface DydxOrdersResponse {
  orders?: DydxOrder[];
}

export const DydxOrdersResponseSchema = z
  .object({
    orders: z.array(DydxOrderSchema).optional(),
  })
  .passthrough();

export interface DydxFill {
  id: string;
  side: 'BUY' | 'SELL';
  liquidity: 'TAKER' | 'MAKER';
  type: 'LIMIT' | 'LIQUIDATED' | 'DELEVERAGED';
  market: string;
  marketType: 'PERPETUAL';
  price: string;
  size: string;
  fee: string;
  createdAt: string;
  createdAtHeight: string;
  orderId?: string;
  clientMetadata?: string;
  subaccountNumber: number;
}

export const DydxFillSchema = z
  .object({
    id: z.string(),
    side: z.string().optional(),
    liquidity: z.string().optional(),
    type: z.string().optional(),
    market: z.string().optional(),
    marketType: z.string().optional(),
    price: z.string().optional(),
    size: z.string().optional(),
    fee: z.string().optional(),
    createdAt: z.string().optional(),
    createdAtHeight: z.string().optional(),
    orderId: z.string().optional(),
    clientMetadata: z.string().optional(),
    subaccountNumber: z.number().optional(),
  })
  .passthrough();

export interface DydxFillsResponse {
  fills: DydxFill[];
}

export const DydxFillsResponseSchema = z
  .object({
    fills: z.array(DydxFillSchema),
  })
  .passthrough();

// =============================================================================
// Position Types
// =============================================================================

export interface DydxPerpetualPosition {
  market: string;
  status: 'OPEN' | 'CLOSED' | 'LIQUIDATED';
  side: 'LONG' | 'SHORT';
  size: string;
  maxSize: string;
  entryPrice: string;
  exitPrice?: string;
  realizedPnl: string;
  unrealizedPnl: string;
  createdAt: string;
  createdAtHeight: string;
  closedAt?: string;
  sumOpen: string;
  sumClose: string;
  netFunding: string;
  subaccountNumber: number;
}

export const DydxPerpetualPositionSchema = z
  .object({
    market: z.string(),
    status: z.string().optional(),
    side: z.string().optional(),
    size: z.string().optional(),
    maxSize: z.string().optional(),
    entryPrice: z.string().optional(),
    exitPrice: z.string().optional().nullable(),
    realizedPnl: z.string().optional(),
    unrealizedPnl: z.string().optional(),
    createdAt: z.string().optional(),
    createdAtHeight: z.string().optional(),
    closedAt: z.string().optional().nullable(),
    sumOpen: z.string().optional(),
    sumClose: z.string().optional(),
    netFunding: z.string().optional(),
    subaccountNumber: z.number().optional(),
  })
  .passthrough();

export interface DydxAssetPosition {
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: string;
  assetId: string;
  subaccountNumber: number;
}

export const DydxAssetPositionSchema = z
  .object({
    symbol: z.string(),
    side: z.string(),
    size: z.string(),
    assetId: z.string(),
    subaccountNumber: z.number(),
  })
  .passthrough();

// =============================================================================
// Subaccount Types
// =============================================================================

export interface DydxSubaccount {
  address: string;
  subaccountNumber: number;
  equity: string;
  freeCollateral: string;
  pendingDeposits: string;
  pendingWithdrawals: string;
  marginEnabled: boolean;
  updatedAtHeight: string;
  latestProcessedBlockHeight: string;
  openPerpetualPositions: Record<string, DydxPerpetualPosition>;
  assetPositions: Record<string, DydxAssetPosition>;
}

export const DydxSubaccountSchema = z
  .object({
    address: z.string().optional(),
    subaccountNumber: z.number().optional(),
    equity: z.string().optional(),
    freeCollateral: z.string().optional(),
    pendingDeposits: z.string().optional(),
    pendingWithdrawals: z.string().optional(),
    marginEnabled: z.boolean().optional(),
    updatedAtHeight: z.string().optional(),
    latestProcessedBlockHeight: z.string().optional(),
    openPerpetualPositions: z.any().optional(),
    assetPositions: z.any().optional(),
  })
  .passthrough();

export interface DydxSubaccountResponse {
  subaccount: DydxSubaccount;
}

export const DydxSubaccountResponseSchema = z
  .object({
    subaccount: DydxSubaccountSchema,
  })
  .passthrough();

export interface DydxSubaccountsResponse {
  subaccounts: DydxSubaccount[];
}

export const DydxSubaccountsResponseSchema = z
  .object({
    subaccounts: z.array(DydxSubaccountSchema),
  })
  .passthrough();

// =============================================================================
// Funding Types
// =============================================================================

export interface DydxHistoricalFunding {
  ticker: string;
  rate: string;
  price: string;
  effectiveAt: string;
  effectiveAtHeight: string;
}

export const DydxHistoricalFundingSchema = z
  .object({
    ticker: z.string(),
    rate: z.string(),
    price: z.string(),
    effectiveAt: z.string(),
    effectiveAtHeight: z.string(),
  })
  .passthrough();

export interface DydxHistoricalFundingResponse {
  historicalFunding: DydxHistoricalFunding[];
}

export const DydxHistoricalFundingResponseSchema = z
  .object({
    historicalFunding: z.array(DydxHistoricalFundingSchema),
  })
  .passthrough();

// =============================================================================
// Candles (OHLCV) Types
// =============================================================================

export interface DydxCandle {
  startedAt: string;
  ticker: string;
  resolution: string;
  low: string;
  high: string;
  open: string;
  close: string;
  baseTokenVolume: string;
  usdVolume: string;
  trades: number;
  startingOpenInterest: string;
}

export const DydxCandleSchema = z
  .object({
    startedAt: z.string().optional(),
    ticker: z.string().optional(),
    resolution: z.string().optional(),
    low: z.string().optional(),
    high: z.string().optional(),
    open: z.string().optional(),
    close: z.string().optional(),
    baseTokenVolume: z.string().optional(),
    usdVolume: z.string().optional(),
    trades: z.union([z.number(), z.string()]).optional(),
    startingOpenInterest: z.string().optional(),
  })
  .passthrough();

export interface DydxCandlesResponse {
  candles: DydxCandle[];
}

export const DydxCandlesResponseSchema = z
  .object({
    candles: z.array(DydxCandleSchema),
  })
  .passthrough();

// =============================================================================
// Sparklines Types
// =============================================================================

export interface DydxSparklineResponse {
  [ticker: string]: string[];
}

// =============================================================================
// WebSocket Types
// =============================================================================

export interface DydxWsSubscription {
  type: 'subscribe' | 'unsubscribe';
  channel: string;
  id?: string;
  batched?: boolean;
}

export interface DydxWsMessage {
  type:
    | 'connected'
    | 'subscribed'
    | 'unsubscribed'
    | 'channel_data'
    | 'channel_batch_data'
    | 'error';
  connection_id?: string;
  message_id?: number;
  channel?: string;
  id?: string;
  contents?: unknown;
  version?: string;
}

export interface DydxWsMarketsContent {
  trading: Record<string, DydxPerpetualMarket>;
}

export interface DydxWsTradesContent {
  trades: DydxTrade[];
}

export interface DydxWsOrderBookContent {
  bids: DydxOrderBookLevel[];
  asks: DydxOrderBookLevel[];
}

export interface DydxWsOrderBookUpdateContent {
  bids?: DydxOrderBookLevel[];
  asks?: DydxOrderBookLevel[];
}

export interface DydxWsSubaccountContent {
  subaccount?: DydxSubaccount;
  orders?: DydxOrder[];
  fills?: DydxFill[];
  perpetualPositions?: DydxPerpetualPosition[];
  assetPositions?: DydxAssetPosition[];
  tradingReward?: {
    tradingReward: string;
    createdAt: string;
    createdAtHeight: string;
  };
}

export interface DydxWsCandleContent {
  candle: DydxCandle;
}

// =============================================================================
// Order Placement Types (for sending orders)
// =============================================================================

export interface DydxPlaceOrderParams {
  subaccountNumber: number;
  marketId: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET';
  timeInForce: 'GTT' | 'FOK' | 'IOC';
  price: string;
  size: string;
  postOnly?: boolean;
  reduceOnly?: boolean;
  triggerPrice?: string;
  clientId?: number;
  goodTilTimeInSeconds?: number;
  goodTilBlock?: number;
  execution?: 'DEFAULT' | 'POST_ONLY' | 'FOK' | 'IOC';
}

export interface DydxCancelOrderParams {
  subaccountNumber: number;
  orderId: string;
  orderFlags: string;
  clobPairId: number;
  goodTilBlock?: number;
  goodTilBlockTime?: number;
}

// =============================================================================
// Height/Block Types
// =============================================================================

export interface DydxHeightResponse {
  height: string;
  time: string;
}

// =============================================================================
// Transfer Types
// =============================================================================

export interface DydxTransfer {
  id: string;
  sender: {
    address: string;
    subaccountNumber?: number;
  };
  recipient: {
    address: string;
    subaccountNumber?: number;
  };
  size: string;
  createdAt: string;
  createdAtHeight: string;
  symbol: string;
  type: 'TRANSFER_IN' | 'TRANSFER_OUT' | 'DEPOSIT' | 'WITHDRAWAL';
  transactionHash?: string;
}

export interface DydxTransfersResponse {
  transfers: DydxTransfer[];
}

// =============================================================================
// PnL Types
// =============================================================================

export interface DydxHistoricalPnl {
  id: string;
  subaccountId: string;
  equity: string;
  totalPnl: string;
  netTransfers: string;
  createdAt: string;
  blockHeight: string;
  blockTime: string;
}

export interface DydxHistoricalPnlResponse {
  historicalPnl: DydxHistoricalPnl[];
}

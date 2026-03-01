/**
 * Drift Protocol Exchange-Specific Types
 *
 * Type definitions for Drift Protocol on-chain data and API responses.
 * Drift uses Solana program accounts for trading data.
 *
 * @see https://docs.drift.trade/
 * @see https://drift-labs.github.io/v2-teacher/
 */

import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

export type DriftOrderType = 'market' | 'limit' | 'triggerMarket' | 'triggerLimit' | 'oracle';

export type DriftDirection = 'long' | 'short';

export type DriftMarketType = 'perp' | 'spot';

export type DriftOrderStatus = 'open' | 'filled' | 'canceled' | 'expired';

export type DriftPositionDirection = 'long' | 'short';

export type DriftTriggerCondition = 'above' | 'below';

export type DriftPostOnlyParams = 'none' | 'mustPostOnly' | 'tryPostOnly' | 'slide';

// =============================================================================
// On-Chain Account Types
// =============================================================================

/**
 * Perpetual position account data
 */
export interface DriftPerpPosition {
  /** Market index */
  marketIndex: number;
  /** Base asset amount (positive for long, negative for short) */
  baseAssetAmount: string;
  /** Quote asset amount */
  quoteAssetAmount: string;
  /** Quote entry amount */
  quoteEntryAmount: string;
  /** Quote break-even amount */
  quoteBreakEvenAmount: string;
  /** Open orders count */
  openOrders: number;
  /** Open bids (base asset) */
  openBids: string;
  /** Open asks (base asset) */
  openAsks: string;
  /** Settled PnL */
  settledPnl: string;
  /** LP shares */
  lpShares: string;
  /** Last cumulative funding rate */
  lastCumulativeFundingRate: string;
  /** Per LP base */
  perLpBase: number;
}

export const DriftPerpPositionSchema = z
  .object({
    marketIndex: z.number(),
    baseAssetAmount: z.string(),
    quoteAssetAmount: z.string(),
    quoteEntryAmount: z.string(),
    quoteBreakEvenAmount: z.string(),
    openOrders: z.number(),
    openBids: z.string(),
    openAsks: z.string(),
    settledPnl: z.string(),
    lpShares: z.string(),
    lastCumulativeFundingRate: z.string(),
    perLpBase: z.number(),
  })
  .passthrough();

/**
 * Spot position account data
 */
export interface DriftSpotPosition {
  /** Market index */
  marketIndex: number;
  /** Scaled balance */
  scaledBalance: string;
  /** Balance type: deposit or borrow */
  balanceType: 'deposit' | 'borrow';
  /** Open orders count */
  openOrders: number;
  /** Cumulative deposits */
  cumulativeDeposits: string;
}

export const DriftSpotPositionSchema = z
  .object({
    marketIndex: z.number(),
    scaledBalance: z.string(),
    balanceType: z.string(),
    openOrders: z.number(),
    cumulativeDeposits: z.string(),
  })
  .passthrough();

/**
 * Order account data
 */
export interface DriftOrder {
  /** Order status */
  status: DriftOrderStatus;
  /** Order type */
  orderType: DriftOrderType;
  /** Market type */
  marketType: DriftMarketType;
  /** Slot order was placed */
  slot: number;
  /** Order ID */
  orderId: number;
  /** User order ID (client specified) */
  userOrderId: number;
  /** Market index */
  marketIndex: number;
  /** Price (PRICE_PRECISION) */
  price: string;
  /** Base asset amount (BASE_PRECISION) */
  baseAssetAmount: string;
  /** Base asset amount filled */
  baseAssetAmountFilled: string;
  /** Quote asset amount filled */
  quoteAssetAmountFilled: string;
  /** Direction */
  direction: DriftDirection;
  /** Reduce only flag */
  reduceOnly: boolean;
  /** Trigger price */
  triggerPrice: string;
  /** Trigger condition */
  triggerCondition: DriftTriggerCondition;
  /** Existing position direction (for close orders) */
  existingPositionDirection: DriftPositionDirection;
  /** Post only params */
  postOnly: DriftPostOnlyParams;
  /** Immediate or cancel flag */
  immediateOrCancel: boolean;
  /** Max timestamp */
  maxTs: string;
  /** Oracle price offset */
  oraclePriceOffset: number;
  /** Auction duration */
  auctionDuration: number;
  /** Auction start price */
  auctionStartPrice: string;
  /** Auction end price */
  auctionEndPrice: string;
}

export const DriftOrderSchema = z
  .object({
    status: z.string(),
    orderType: z.string(),
    marketType: z.string(),
    slot: z.number(),
    orderId: z.number(),
    userOrderId: z.number(),
    marketIndex: z.number(),
    price: z.string(),
    baseAssetAmount: z.string(),
    baseAssetAmountFilled: z.string(),
    quoteAssetAmountFilled: z.string(),
    direction: z.string(),
    reduceOnly: z.boolean(),
    triggerPrice: z.string(),
    triggerCondition: z.string(),
    existingPositionDirection: z.string(),
    postOnly: z.string(),
    immediateOrCancel: z.boolean(),
    maxTs: z.string(),
    oraclePriceOffset: z.number(),
    auctionDuration: z.number(),
    auctionStartPrice: z.string(),
    auctionEndPrice: z.string(),
  })
  .passthrough();

/**
 * User account data
 */
export interface DriftUserAccount {
  /** Authority public key */
  authority: string;
  /** Delegate public key */
  delegate: string;
  /** Sub-account ID */
  subAccountId: number;
  /** Name */
  name: string;
  /** Spot positions */
  spotPositions: DriftSpotPosition[];
  /** Perp positions */
  perpPositions: DriftPerpPosition[];
  /** Orders */
  orders: DriftOrder[];
  /** Last add perp LP shares timestamp */
  lastAddPerpLpSharesTs: string;
  /** Total deposits */
  totalDeposits: string;
  /** Total withdraws */
  totalWithdraws: string;
  /** Total social loss */
  totalSocialLoss: string;
  /** Settled perp PnL */
  settledPerpPnl: string;
  /** Cumulative spot fees */
  cumulativeSpotFees: string;
  /** Cumulative perp funding */
  cumulativePerpFunding: string;
  /** Liquidation margin freed */
  liquidationMarginFreed: string;
  /** Last active slot */
  lastActiveSlot: string;
  /** Is margin trading enabled */
  isMarginTradingEnabled: boolean;
  /** Idle flag */
  idle: boolean;
  /** Open orders */
  openOrders: number;
  /** Has open order */
  hasOpenOrder: boolean;
  /** Open auctions */
  openAuctions: number;
  /** Has open auction */
  hasOpenAuction: boolean;
}

// =============================================================================
// Market Account Types
// =============================================================================

/**
 * AMM (Automated Market Maker) data
 */
export interface DriftAMM {
  /** Oracle source */
  oracleSource: string;
  /** Base asset reserve */
  baseAssetReserve: string;
  /** Quote asset reserve */
  quoteAssetReserve: string;
  /** Square root K */
  sqrtK: string;
  /** Peg multiplier */
  pegMultiplier: string;
  /** Terminal quote asset reserve */
  terminalQuoteAssetReserve: string;
  /** Base asset amount with AMM */
  baseAssetAmountWithAmm: string;
  /** Base asset amount long */
  baseAssetAmountLong: string;
  /** Base asset amount short */
  baseAssetAmountShort: string;
  /** Quote asset amount */
  quoteAssetAmount: string;
  /** Quote entry amount long */
  quoteEntryAmountLong: string;
  /** Quote entry amount short */
  quoteEntryAmountShort: string;
  /** Quote break-even amount long */
  quoteBreakEvenAmountLong: string;
  /** Quote break-even amount short */
  quoteBreakEvenAmountShort: string;
  /** User LP shares */
  userLpShares: string;
  /** Last funding rate */
  lastFundingRate: string;
  /** Last funding rate long */
  lastFundingRateLong: string;
  /** Last funding rate short */
  lastFundingRateShort: string;
  /** Last 24h average funding rate */
  last24hAvgFundingRate: string;
  /** Total fee */
  totalFee: string;
  /** Total MM fee */
  totalMmFee: string;
  /** Total exchange fee */
  totalExchangeFee: string;
  /** Total fee minus distributions */
  totalFeeMinusDistributions: string;
  /** Total fee withdrawn */
  totalFeeWithdrawn: string;
  /** Total liquidation fee */
  totalLiquidationFee: string;
  /** Cumulative funding rate long */
  cumulativeFundingRateLong: string;
  /** Cumulative funding rate short */
  cumulativeFundingRateShort: string;
  /** Total social loss */
  totalSocialLoss: string;
  /** Ask base asset reserve */
  askBaseAssetReserve: string;
  /** Ask quote asset reserve */
  askQuoteAssetReserve: string;
  /** Bid base asset reserve */
  bidBaseAssetReserve: string;
  /** Bid quote asset reserve */
  bidQuoteAssetReserve: string;
  /** Last oracle normalised price */
  lastOracleNormalisedPrice: string;
  /** Last oracle reserve price spread pct */
  lastOracleReservePriceSpreadPct: string;
  /** Last bid price twap */
  lastBidPriceTwap: string;
  /** Last ask price twap */
  lastAskPriceTwap: string;
  /** Last mark price twap */
  lastMarkPriceTwap: string;
  /** Last mark price twap 5min */
  lastMarkPriceTwap5min: string;
  /** Last update slot */
  lastUpdateSlot: string;
  /** Last oracle confPct */
  lastOracleConfPct: string;
  /** Net revenue since last funding */
  netRevenueSinceLastFunding: string;
  /** Last funding rate timestamp */
  lastFundingRateTs: string;
  /** Funding period */
  fundingPeriod: string;
  /** Order step size */
  orderStepSize: string;
  /** Order tick size */
  orderTickSize: string;
  /** Min order size */
  minOrderSize: string;
  /** Max position size */
  maxPositionSize: string;
  /** Volume 24h */
  volume24h: string;
  /** Long intensity count */
  longIntensityCount: number;
  /** Long intensity volume */
  longIntensityVolume: string;
  /** Short intensity count */
  shortIntensityCount: number;
  /** Short intensity volume */
  shortIntensityVolume: string;
  /** Max spread */
  maxSpread: number;
  /** Max fill reserve fraction */
  maxFillReserveFraction: number;
  /** Max slippage ratio */
  maxSlippageRatio: number;
  /** Curve update intensity */
  curveUpdateIntensity: number;
  /** AMM jit intensity */
  ammJitIntensity: number;
  /** Oracle public key */
  oracle: string;
  /** Historical oracle data */
  historicalOracleData: {
    lastOraclePrice: string;
    lastOracleConf: string;
    lastOracleDelay: string;
    lastOraclePriceTwap: string;
    lastOraclePriceTwap5min: string;
    lastOraclePriceTwapTs: string;
  };
  /** Base spread */
  baseSpread: number;
  /** Max base asset reserve */
  maxBaseAssetReserve: string;
  /** Min base asset reserve */
  minBaseAssetReserve: string;
  /** Total LP shares */
  totalLpShares: string;
  /** Per LP base */
  perLpBase: number;
}

/**
 * Perp market account data
 */
export interface DriftPerpMarketAccount {
  /** Market status */
  status: string;
  /** Market index */
  marketIndex: number;
  /** PnL pool */
  pnlPool: {
    scaledBalance: string;
    marketIndex: number;
  };
  /** Name */
  name: string;
  /** AMM */
  amm: DriftAMM;
  /** Number of users with base */
  numberOfUsersWithBase: number;
  /** Number of users */
  numberOfUsers: number;
  /** Margin ratio initial */
  marginRatioInitial: number;
  /** Margin ratio maintenance */
  marginRatioMaintenance: number;
  /** Next fill record ID */
  nextFillRecordId: string;
  /** Next funding rate record ID */
  nextFundingRateRecordId: string;
  /** Next curve record ID */
  nextCurveRecordId: string;
  /** Imf factor */
  imfFactor: number;
  /** Unrealized PnL IMF factor */
  unrealizedPnlImfFactor: number;
  /** Liquidator fee */
  liquidatorFee: number;
  /** If liquidation fee */
  ifLiquidationFee: number;
  /** Unrealized PnL max imbalance */
  unrealizedPnlMaxImbalance: string;
  /** Expiry timestamp */
  expiryTs: string;
  /** Expiry price */
  expiryPrice: string;
  /** PnL pool */
  insuranceClaim: {
    revenueWithdrawSinceLastSettle: string;
    maxRevenueWithdrawPerPeriod: string;
    lastRevenueWithdrawTs: string;
    quoteSettledInsurance: string;
    quoteMaxInsurance: string;
  };
  /** Contract type */
  contractType: string;
  /** Contract tier */
  contractTier: string;
  /** Paused operations */
  pausedOperations: number;
  /** Quote spot market index */
  quoteSpotMarketIndex: number;
  /** Fee adjustment */
  feeAdjustment: number;
}

export const DriftPerpMarketAccountSchema = z
  .object({
    status: z.string(),
    marketIndex: z.number(),
    pnlPool: z
      .object({
        scaledBalance: z.string(),
        marketIndex: z.number(),
      })
      .passthrough(),
    name: z.string(),
    amm: z.any(), // AMM structure is complex and varies
    numberOfUsersWithBase: z.number(),
    numberOfUsers: z.number(),
    marginRatioInitial: z.coerce.number(),
    marginRatioMaintenance: z.coerce.number(),
    nextFillRecordId: z.string(),
    nextFundingRateRecordId: z.string(),
    nextCurveRecordId: z.string(),
    imfFactor: z.coerce.number(),
    unrealizedPnlImfFactor: z.coerce.number(),
    liquidatorFee: z.coerce.number(),
    ifLiquidationFee: z.coerce.number(),
    unrealizedPnlMaxImbalance: z.string(),
    expiryTs: z.string(),
    expiryPrice: z.string(),
    insuranceClaim: z.any(),
    contractType: z.string(),
    contractTier: z.string(),
    pausedOperations: z.number(),
    quoteSpotMarketIndex: z.number(),
    feeAdjustment: z.coerce.number(),
  })
  .passthrough();

// =============================================================================
// DLOB API Response Types
// =============================================================================

/**
 * L2 Order book response
 */
export interface DriftL2OrderBook {
  /** Market index */
  marketIndex: number;
  /** Market type */
  marketType: DriftMarketType;
  /** Market name (e.g., "SOL-PERP") */
  marketName?: string;
  /** Bids - array of [price, size] */
  bids: Array<{
    price: string;
    size: string;
    sources?: Record<string, string>;
  }>;
  /** Asks - array of [price, size] */
  asks: Array<{
    price: string;
    size: string;
    sources?: Record<string, string>;
  }>;
  /** Oracle price */
  oraclePrice: string;
  /** Slot */
  slot: number;
}

export const DriftL2OrderBookSchema = z
  .object({
    marketIndex: z.number(),
    marketType: z.string(),
    marketName: z.string().optional(),
    bids: z.array(
      z.object({
        price: z.string(),
        size: z.string(),
        sources: z.record(z.string(), z.string()).optional(),
      })
    ),
    asks: z.array(
      z.object({
        price: z.string(),
        size: z.string(),
        sources: z.record(z.string(), z.string()).optional(),
      })
    ),
    oraclePrice: z.string(),
    slot: z.number(),
  })
  .passthrough();

/**
 * Trade response from DLOB
 */
export interface DriftTrade {
  /** Trade record ID */
  recordId: string;
  /** Fill record ID */
  fillRecordId: string;
  /** Market index */
  marketIndex: number;
  /** Market type */
  marketType: DriftMarketType;
  /** Taker */
  taker: string;
  /** Taker order ID */
  takerOrderId: number;
  /** Taker order direction */
  takerOrderDirection: DriftDirection;
  /** Maker */
  maker: string;
  /** Maker order ID */
  makerOrderId: number;
  /** Maker order direction */
  makerOrderDirection: DriftDirection;
  /** Base asset amount (filled) */
  baseAssetAmount: string;
  /** Quote asset amount (filled) */
  quoteAssetAmount: string;
  /** Fill price */
  fillPrice: string;
  /** Action */
  action: string;
  /** Action explanation */
  actionExplanation: string;
  /** Transaction signature */
  txSig: string;
  /** Slot */
  slot: number;
  /** Timestamp (Unix seconds) */
  ts: number;
}

export const DriftTradeSchema = z
  .object({
    recordId: z.union([z.string(), z.number()]),
    fillRecordId: z.union([z.string(), z.number()]),
    marketIndex: z.number(),
    marketType: z.string(),
    taker: z.string(),
    takerOrderId: z.number(),
    takerOrderDirection: z.string(),
    maker: z.string(),
    makerOrderId: z.number(),
    makerOrderDirection: z.string(),
    baseAssetAmount: z.string(),
    quoteAssetAmount: z.string(),
    fillPrice: z.string(),
    action: z.string(),
    actionExplanation: z.string(),
    txSig: z.string(),
    slot: z.number(),
    ts: z.number(),
  })
  .passthrough();

/**
 * Funding rate response
 */
export interface DriftFundingRate {
  /** Market index */
  marketIndex: number;
  /** Funding rate (FUNDING_RATE_PRECISION) */
  fundingRate: string;
  /** Funding rate long */
  fundingRateLong: string;
  /** Funding rate short */
  fundingRateShort: string;
  /** Cumulative funding rate long */
  cumulativeFundingRateLong: string;
  /** Cumulative funding rate short */
  cumulativeFundingRateShort: string;
  /** Oracle price */
  oraclePrice: string;
  /** Mark price twap */
  markPriceTwap: string;
  /** Timestamp */
  ts: number;
}

export const DriftFundingRateSchema = z
  .object({
    marketIndex: z.number(),
    fundingRate: z.string(),
    fundingRateLong: z.string(),
    fundingRateShort: z.string(),
    cumulativeFundingRateLong: z.string(),
    cumulativeFundingRateShort: z.string(),
    oraclePrice: z.string(),
    markPriceTwap: z.string(),
    ts: z.number(),
  })
  .passthrough();

/**
 * Historical funding rate record
 */
export interface DriftFundingRateRecord {
  /** Record ID */
  recordId: string;
  /** Market index */
  marketIndex: number;
  /** Funding rate */
  fundingRate: string;
  /** Funding rate long */
  fundingRateLong: string;
  /** Funding rate short */
  fundingRateShort: string;
  /** Cumulative funding rate long */
  cumulativeFundingRateLong: string;
  /** Cumulative funding rate short */
  cumulativeFundingRateShort: string;
  /** Oracle price twap */
  oraclePriceTwap: string;
  /** Mark price twap */
  markPriceTwap: string;
  /** Period revenue */
  periodRevenue: string;
  /** Base asset amount with AMM */
  baseAssetAmountWithAmm: string;
  /** Base asset amount with unsettled LP */
  baseAssetAmountWithUnsettledLp: string;
  /** Timestamp */
  ts: number;
}

export const DriftFundingRateRecordSchema = z
  .object({
    recordId: z.union([z.string(), z.number()]),
    marketIndex: z.number(),
    fundingRate: z.string(),
    fundingRateLong: z.string(),
    fundingRateShort: z.string(),
    cumulativeFundingRateLong: z.string(),
    cumulativeFundingRateShort: z.string(),
    oraclePriceTwap: z.string(),
    markPriceTwap: z.string(),
    periodRevenue: z.string(),
    baseAssetAmountWithAmm: z.string(),
    baseAssetAmountWithUnsettledLp: z.string(),
    ts: z.number(),
  })
  .passthrough();

/**
 * Market stats/ticker
 */
export interface DriftMarketStats {
  /** Market index */
  marketIndex: number;
  /** Oracle price */
  oraclePrice: string;
  /** Mark price */
  markPrice: string;
  /** Bid price */
  bidPrice: string;
  /** Ask price */
  askPrice: string;
  /** Last fill price */
  lastFillPrice: string;
  /** 24h volume */
  volume24h: string;
  /** Open interest */
  openInterest: string;
  /** Open interest long */
  openInterestLong: string;
  /** Open interest short */
  openInterestShort: string;
  /** Funding rate */
  fundingRate: string;
  /** 24h funding rate */
  fundingRate24h: string;
  /** Next funding rate */
  nextFundingRate: string;
  /** Next funding timestamp */
  nextFundingTs: number;
  /** Timestamp */
  ts: number;
}

export const DriftMarketStatsSchema = z
  .object({
    marketIndex: z.number(),
    oraclePrice: z.string(),
    markPrice: z.string(),
    bidPrice: z.string(),
    askPrice: z.string(),
    lastFillPrice: z.string(),
    volume24h: z.string(),
    openInterest: z.string(),
    openInterestLong: z.string(),
    openInterestShort: z.string(),
    fundingRate: z.string(),
    fundingRate24h: z.string(),
    nextFundingRate: z.string(),
    nextFundingTs: z.number(),
    ts: z.number(),
  })
  .passthrough();

// =============================================================================
// OHLCV Types
// =============================================================================

/**
 * Candle data
 */
export interface DriftCandle {
  /** Start timestamp */
  start: number;
  /** End timestamp */
  end: number;
  /** Resolution (in seconds) */
  resolution: number;
  /** Open price */
  open: string;
  /** High price */
  high: string;
  /** Low price */
  low: string;
  /** Close price */
  close: string;
  /** Volume */
  volume: string;
  /** Trade count */
  trades: number;
}

export const DriftCandleSchema = z
  .object({
    start: z.number(),
    end: z.number(),
    resolution: z.number(),
    open: z.string(),
    high: z.string(),
    low: z.string(),
    close: z.string(),
    volume: z.string(),
    trades: z.number(),
  })
  .passthrough();

// =============================================================================
// Normalized Types for SDK
// =============================================================================

/**
 * Normalized position for SDK
 */
export interface DriftNormalizedPosition {
  /** Symbol in unified format */
  symbol: string;
  /** Market index */
  marketIndex: number;
  /** Position side */
  side: 'long' | 'short';
  /** Size in base asset */
  size: number;
  /** Size in USD */
  sizeUsd: number;
  /** Entry price */
  entryPrice: number;
  /** Mark price */
  markPrice: number;
  /** Liquidation price */
  liquidationPrice: number;
  /** Unrealized PnL */
  unrealizedPnl: number;
  /** Realized PnL */
  realizedPnl: number;
  /** Leverage */
  leverage: number;
  /** Margin used */
  marginUsed: number;
}

/**
 * Normalized order for SDK
 */
export interface DriftNormalizedOrder {
  /** Order ID */
  id: string;
  /** User order ID */
  userOrderId: number;
  /** Symbol in unified format */
  symbol: string;
  /** Market index */
  marketIndex: number;
  /** Order type */
  type: DriftOrderType;
  /** Side */
  side: 'buy' | 'sell';
  /** Amount */
  amount: number;
  /** Price */
  price: number;
  /** Filled amount */
  filled: number;
  /** Remaining amount */
  remaining: number;
  /** Status */
  status: 'open' | 'closed' | 'canceled' | 'expired';
  /** Reduce only */
  reduceOnly: boolean;
  /** Post only */
  postOnly: boolean;
  /** Timestamp */
  timestamp: number;
}

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
    symbol: z.string().optional(),
    market: z.string().optional(),
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
    // API format fields
    dailyHigh: z.string().optional(),
    dailyLow: z.string().optional(),
    dailyVolume: z.string().optional(),
    dailyVolumeBase: z.string().optional(),
    dailyPriceChange: z.string().optional(),
    dailyPriceChangePercentage: z.string().optional(),
  })
  .passthrough();

export const ExtendedOrderBookSchema = z
  .object({
    symbol: z.string().optional(),
    bids: z.array(z.tuple([z.string(), z.string()])).optional(),
    asks: z.array(z.tuple([z.string(), z.string()])).optional(),
    timestamp: z.number().optional(),
    sequence: z.number().optional(),
    checksum: z.string().optional(),
  })
  .passthrough();

/**
 * Trade schema accepting BOTH shapes:
 * - legacy SDK shape `{id, symbol, price, quantity, side, timestamp}`
 * - live API shape `{i, m, S, tT, T, p, q}` — REST `/trades` and the WS
 *   `publicTrades` stream share these field names (live-verified 2026-06-11;
 *   the old required `id`/`symbol` ZodErrored on every real wire trade).
 *
 * `i` accepts string (int64-safe, via the WS reviver) or number (REST
 * `JSON.parse`, may have lost precision past 2^53 — see
 * ExtendedWSTradeSchema).
 */
export const ExtendedTradeSchema = z
  .object({
    // Legacy SDK shape
    id: z.string().optional(),
    symbol: z.string().optional(),
    price: z.string().optional(),
    quantity: z.string().optional(),
    side: z.string().optional(),
    timestamp: z.number().optional(),
    isMaker: z.boolean().optional(),
    tradeId: z.string().optional(),
    // Live API shape (REST + WS)
    i: z.union([z.string(), z.number()]).optional(),
    m: z.string().optional(),
    S: z.string().optional(),
    tT: z.string().optional(),
    T: z.number().optional(),
    p: z.string().optional(),
    q: z.string().optional(),
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
// WebSocket Types (RAW wire envelopes, live-verified 2026-06-11)
//
// Real protocol: per-stream URLs ({base}/{stream}/{market}) where the HTTP
// upgrade IS the subscription — there are no subscribe/auth/ping frames and
// no channel-tagged messages. The previous ExtendedWs* types described a
// fictional multiplexed protocol on a dead host (NXDOMAIN).
// ============================================================================

/**
 * SNAPSHOT order book level: `{q: "<qty>", p: "<price>"}` (full depth;
 * captured first frame = 2414 bids + 5010 asks, 207,833 bytes).
 */
export const ExtendedWSSnapshotLevelSchema = z
  .object({
    q: z.string(),
    p: z.string(),
  })
  .passthrough();

/**
 * DELTA order book level: `{q: "<SIGNED change>", p: "<price>", c: "<new
 * ABSOLUTE qty>"}`. Apply rule: level qty := parseFloat(c); DELETE the level
 * when c == "0". `q` is informational only.
 */
export const ExtendedWSDeltaLevelSchema = z
  .object({
    q: z.string(),
    p: z.string(),
    c: z.string(),
  })
  .passthrough();

/**
 * Order book stream envelope (`{base}/orderbooks/{market}`):
 * `{type: "SNAPSHOT"|"DELTA", data: {t, m, b, a, d}, ts: <epoch ms>, seq}`.
 *
 * - `seq` starts at 1 on the SNAPSHOT and increments +1 per frame PER
 *   CONNECTION; reconnect ⇒ fresh SNAPSHOT, seq resets to 1.
 * - `d` is the depth mode: "f" = full book, "1" = BBO (`?depth=1`, every
 *   frame is a self-contained 1+1 SNAPSHOT). `?depth=10`/`?depth=20`
 *   SILENTLY FAIL live — client limits must be served by slicing the
 *   maintained book, never forwarded as `?depth`.
 */
export const ExtendedWSOrderBookSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('SNAPSHOT'),
      data: z
        .object({
          t: z.literal('SNAPSHOT'),
          m: z.string(),
          b: z.array(ExtendedWSSnapshotLevelSchema),
          a: z.array(ExtendedWSSnapshotLevelSchema),
          d: z.enum(['f', '1']),
        })
        .passthrough(),
      ts: z.number(),
      seq: z.number(),
    })
    .passthrough(),
  z
    .object({
      type: z.literal('DELTA'),
      data: z
        .object({
          t: z.literal('DELTA'),
          m: z.string(),
          b: z.array(ExtendedWSDeltaLevelSchema),
          a: z.array(ExtendedWSDeltaLevelSchema),
          d: z.enum(['f', '1']),
        })
        .passthrough(),
      ts: z.number(),
      seq: z.number(),
    })
    .passthrough(),
]);

export type ExtendedWSOrderBookFrame = z.infer<typeof ExtendedWSOrderBookSchema>;

/**
 * Public trade object on the wire — identical field names on REST `/trades`
 * and the WS `publicTrades` stream (live-verified 2026-06-11):
 * `{i: <int64 id>, m, S: "BUY"|"SELL", tT: "TRADE"|"LIQUIDATION"|"DELEVERAGE",
 *   T: <epoch ms>, p, q}`.
 *
 * int64 DECISION (live-proven corruption): wire `i:2064908781480841219` →
 * `JSON.parse` → `2064908781480841200` (last 2 digits LOST; `String(raw.i)`
 * after parse is already corrupted). The canonical decode path is
 * {@link parseExtendedWSTradesFrame}, which applies a bigint-preserving
 * reviver (quotes bare `"i":<digits>` BEFORE `JSON.parse`) so trade ids
 * survive byte-exact as strings. The schema also tolerates numbers for
 * callers that already JSON.parse'd a frame, but such ids may have silently
 * lost precision — do NOT rely on them for dedup/equality.
 */
export const ExtendedWSTradeSchema = z
  .object({
    i: z.union([z.string(), z.number()]),
    m: z.string(),
    S: z.enum(['BUY', 'SELL']),
    tT: z.enum(['TRADE', 'LIQUIDATION', 'DELEVERAGE']),
    T: z.number(),
    p: z.string(),
    q: z.string(),
  })
  .passthrough();

export type ExtendedWSTrade = z.infer<typeof ExtendedWSTradeSchema>;

/**
 * Trades stream envelope (`{base}/publicTrades/{market}`):
 * `{data: [trades], ts: <epoch ms>, seq}` — deliberately a SEPARATE schema
 * from the orderbook envelope: the wire has NO `type` field on trades frames.
 *
 * The FIRST frame per connection is a 50-trade HISTORICAL BACKFILL (trade
 * timestamps predate connect); consumers wanting live flow must gate it.
 */
export const ExtendedWSTradesSchema = z
  .object({
    data: z.array(ExtendedWSTradeSchema),
    ts: z.number(),
    seq: z.number(),
  })
  .passthrough();

export type ExtendedWSTradesFrame = z.infer<typeof ExtendedWSTradesSchema>;

/**
 * int64-safe decoder for a RAW trades frame (see {@link ExtendedWSTradeSchema}
 * for the precision rationale). Quotes bare `"i": <digits>` values before
 * `JSON.parse` so ids survive byte-exact as strings, then zod-validates.
 */
export function parseExtendedWSTradesFrame(rawText: string): ExtendedWSTradesFrame {
  const quoted = rawText.replace(/"i"\s*:\s*(\d+)/g, '"i":"$1"');
  return ExtendedWSTradesSchema.parse(JSON.parse(quoted));
}

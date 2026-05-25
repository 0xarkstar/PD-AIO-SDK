/**
 * GRVT-specific type definitions.
 *
 * Ground-truthed 2026-05-26 against the official GRVT api-docs + live API and
 * the working zo-mm-sim market-data parsers. These mirror the REAL GRVT REST
 * response shapes (all numeric fields are STRINGS on the wire):
 *  - instruments carry `instrument_hash` + `base_decimals` (used for signing),
 *    `kind: 'PERPETUAL'`, and NO per-instrument fee fields (fees are per-fill).
 *  - books are FULL snapshots with `{ price, size, num_orders }` levels + `event_time`.
 *  - trades carry `is_taker_buyer` (true => BUY aggressor) and a string `trade_id`.
 *  - tickers carry mark/index/last/mid + best bid/ask + 24h volume fields.
 *
 * Order EIP-712 signing input/output live in `signing.ts`
 * (`GrvtSignOrderInput` / `GrvtSignature`) — they are NOT redefined here.
 */

import { z } from 'zod';

// =============================================================================
// Response envelope
// =============================================================================

/**
 * Every GRVT REST response wraps its payload under `result`.
 */
export interface GRVTResult<T> {
  result: T;
}

// =============================================================================
// Market / instrument
// =============================================================================

/**
 * GRVT instrument (from `full/v1/instruments`). NO fee fields — fees are per-fill.
 */
export interface GRVTMarket {
  instrument: string;
  instrument_hash: string;
  base: string;
  quote: string;
  base_decimals: number;
  quote_decimals: number;
  tick_size: string;
  min_size: string;
  min_notional?: string;
  max_size?: string;
  funding_interval_hours?: number;
  kind: string;
  is_active?: boolean;
}

export const GRVTMarketSchema = z
  .object({
    instrument: z.string(),
    instrument_hash: z.string(),
    base: z.string(),
    quote: z.string(),
    base_decimals: z.number().int(),
    quote_decimals: z.number().int(),
    tick_size: z.string(),
    min_size: z.string(),
    min_notional: z.string().optional(),
    max_size: z.string().optional(),
    funding_interval_hours: z.number().optional(),
    kind: z.string(),
    is_active: z.boolean().optional(),
  })
  .passthrough();

// =============================================================================
// Order book
// =============================================================================

/**
 * GRVT order book level (object form, NOT a `[price, size]` tuple).
 */
export interface GRVTOrderBookLevel {
  price: string;
  size: string;
  num_orders?: number;
}

/**
 * GRVT order book FULL snapshot (from `full/v1/book` and the `v1.book.s` stream).
 * No sequence/diff — `event_time` (ns string) is the monotonic clock.
 */
export interface GRVTOrderBook {
  instrument?: string;
  event_time: string;
  bids: GRVTOrderBookLevel[];
  asks: GRVTOrderBookLevel[];
}

export const GRVTOrderBookLevelSchema = z
  .object({
    price: z.string(),
    size: z.string(),
    num_orders: z.number().optional(),
  })
  .passthrough();

export const GRVTOrderBookSchema = z
  .object({
    instrument: z.string().optional(),
    event_time: z.string(),
    bids: z.array(GRVTOrderBookLevelSchema),
    asks: z.array(GRVTOrderBookLevelSchema),
  })
  .passthrough();

// =============================================================================
// Trade
// =============================================================================

/**
 * GRVT public trade (from `full/v1/trade` and the `v1.trade` stream).
 */
export interface GRVTTrade {
  event_time: string;
  instrument?: string;
  is_taker_buyer: boolean;
  size: string;
  price: string;
  mark_price?: string;
  index_price?: string;
  trade_id: string;
  venue?: string;
  is_rpi?: boolean;
}

export const GRVTTradeSchema = z
  .object({
    event_time: z.string(),
    instrument: z.string().optional(),
    is_taker_buyer: z.boolean(),
    size: z.string(),
    price: z.string(),
    mark_price: z.string().optional(),
    index_price: z.string().optional(),
    trade_id: z.string(),
    venue: z.string().optional(),
    is_rpi: z.boolean().optional(),
  })
  .passthrough();

// =============================================================================
// Ticker
// =============================================================================

/**
 * GRVT ticker (from `full/v1/ticker` and the `v1.ticker.s` stream).
 * All numeric fields are STRINGS on the wire.
 */
export interface GRVTTicker {
  instrument?: string;
  event_time?: string;
  mark_price?: string;
  index_price?: string;
  last_price?: string;
  mid_price?: string;
  best_bid_price?: string;
  best_ask_price?: string;
  best_bid_size?: string;
  best_ask_size?: string;
  buy_volume_24h_q?: string;
  sell_volume_24h_q?: string;
  open_interest?: string;
  funding_rate?: string;
  next_funding_time?: string;
}

export const GRVTTickerSchema = z
  .object({
    instrument: z.string().optional(),
    event_time: z.string().optional(),
    mark_price: z.string().optional(),
    index_price: z.string().optional(),
    last_price: z.string().optional(),
    mid_price: z.string().optional(),
    best_bid_price: z.string().optional(),
    best_ask_price: z.string().optional(),
    best_bid_size: z.string().optional(),
    best_ask_size: z.string().optional(),
    buy_volume_24h_q: z.string().optional(),
    sell_volume_24h_q: z.string().optional(),
    open_interest: z.string().optional(),
    funding_rate: z.string().optional(),
    next_funding_time: z.string().optional(),
  })
  .passthrough();

// =============================================================================
// Funding
// =============================================================================

/**
 * GRVT funding-rate entry (from `full/v1/funding`).
 */
export interface GRVTFunding {
  instrument?: string;
  funding_rate?: string;
  funding_time?: string;
  mark_price?: string;
  index_price?: string;
  funding_interval_hours?: number;
}

// =============================================================================
// Order (account)
// =============================================================================

/**
 * One leg of a GRVT order on the wire.
 */
export interface GRVTOrderLeg {
  instrument: string;
  size: string;
  limit_price?: string;
  is_buying_asset: boolean;
}

/**
 * GRVT order state (status + traded/book sizes, parallel-indexed to legs).
 */
export interface GRVTOrderState {
  status?: string;
  traded_size?: string[];
  book_size?: string[];
  avg_fill_price?: string[];
  update_time?: string;
}

/**
 * GRVT order metadata (client order id + create time).
 */
export interface GRVTOrderMetadata {
  client_order_id?: string;
  create_time?: string;
}

/**
 * GRVT account order (from `create_order` result, `open_orders`, `order_history`).
 */
export interface GRVTOrder {
  order_id?: string;
  sub_account_id?: string;
  is_market?: boolean;
  time_in_force?: string;
  post_only?: boolean;
  reduce_only?: boolean;
  legs?: GRVTOrderLeg[];
  state?: GRVTOrderState;
  metadata?: GRVTOrderMetadata;
}

// =============================================================================
// Position / balance / fill
// =============================================================================

/**
 * GRVT position (from `full/v1/positions`).
 */
export interface GRVTPosition {
  instrument?: string;
  size?: string;
  notional?: string;
  entry_price?: string;
  mark_price?: string;
  unrealized_pnl?: string;
  realized_pnl?: string;
  est_liquidation_price?: string;
  leverage?: string;
  event_time?: string;
}

/**
 * GRVT spot balance (from `sub_account_summary.spot_balances`).
 */
export interface GRVTSpotBalance {
  currency?: string;
  balance?: string;
  index_price?: string;
}

/**
 * GRVT fill (user trade, from `full/v1/fill_history`). `fee` NEGATIVE = maker rebate.
 */
export interface GRVTFill {
  trade_id?: string;
  order_id?: string;
  instrument?: string;
  price?: string;
  size?: string;
  is_buyer?: boolean;
  is_taker?: boolean;
  fee?: string;
  event_time?: string;
}

// =============================================================================
// Auth
// =============================================================================

/**
 * GRVT API-key login response body (`POST {edge}/auth/api_key/login`).
 * The `gravity` session cookie + `X-Grvt-Account-Id` header arrive separately.
 */
export interface GRVTLoginResult {
  sub_account_id?: string;
  funding_account_address?: string;
}

/**
 * Resolved GRVT session after login.
 */
export interface GRVTSession {
  /** `gravity` cookie value (sent as `Cookie: gravity=...`). */
  cookie: string;
  /** Main account id (sent as `X-Grvt-Account-Id`). */
  accountId: string;
  /** Trading sub-account id (uint64 string; goes in every order/cancel body). */
  subAccountId?: string;
  /** Funding account address (EVM address of the funding account). */
  fundingAccountAddress?: string;
  /** Cookie expiry (ms epoch). */
  expiresAt: number;
}

// =============================================================================
// Request bodies (wire)
// =============================================================================

/**
 * GRVT create-order wire body (under `{ order: ... }`).
 */
export interface GRVTCreateOrderBody {
  sub_account_id: string;
  is_market: boolean;
  time_in_force: string;
  post_only: boolean;
  reduce_only: boolean;
  legs: Array<{
    instrument: string;
    size: string;
    limit_price: string;
    is_buying_asset: boolean;
  }>;
  signature: {
    r: string;
    s: string;
    v: number;
    expiration: string;
    nonce: number;
    signer: string;
  };
  metadata: {
    client_order_id: string;
  };
}

/**
 * GRVT cancel-order wire body.
 */
export interface GRVTCancelOrderBody {
  sub_account_id: string;
  order_id?: string;
  client_order_id?: string;
}

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
//# sourceMappingURL=types.js.map
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
/**
 * Every GRVT REST response wraps its payload under `result`.
 */
export interface GRVTResult<T> {
    result: T;
}
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
export declare const GRVTMarketSchema: z.ZodObject<{
    instrument: z.ZodString;
    instrument_hash: z.ZodString;
    base: z.ZodString;
    quote: z.ZodString;
    base_decimals: z.ZodNumber;
    quote_decimals: z.ZodNumber;
    tick_size: z.ZodString;
    min_size: z.ZodString;
    min_notional: z.ZodOptional<z.ZodString>;
    max_size: z.ZodOptional<z.ZodString>;
    funding_interval_hours: z.ZodOptional<z.ZodNumber>;
    kind: z.ZodString;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    instrument: z.ZodString;
    instrument_hash: z.ZodString;
    base: z.ZodString;
    quote: z.ZodString;
    base_decimals: z.ZodNumber;
    quote_decimals: z.ZodNumber;
    tick_size: z.ZodString;
    min_size: z.ZodString;
    min_notional: z.ZodOptional<z.ZodString>;
    max_size: z.ZodOptional<z.ZodString>;
    funding_interval_hours: z.ZodOptional<z.ZodNumber>;
    kind: z.ZodString;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    instrument: z.ZodString;
    instrument_hash: z.ZodString;
    base: z.ZodString;
    quote: z.ZodString;
    base_decimals: z.ZodNumber;
    quote_decimals: z.ZodNumber;
    tick_size: z.ZodString;
    min_size: z.ZodString;
    min_notional: z.ZodOptional<z.ZodString>;
    max_size: z.ZodOptional<z.ZodString>;
    funding_interval_hours: z.ZodOptional<z.ZodNumber>;
    kind: z.ZodString;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">>;
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
export declare const GRVTOrderBookLevelSchema: z.ZodObject<{
    price: z.ZodString;
    size: z.ZodString;
    num_orders: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    price: z.ZodString;
    size: z.ZodString;
    num_orders: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    price: z.ZodString;
    size: z.ZodString;
    num_orders: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export declare const GRVTOrderBookSchema: z.ZodObject<{
    instrument: z.ZodOptional<z.ZodString>;
    event_time: z.ZodString;
    bids: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    asks: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    instrument: z.ZodOptional<z.ZodString>;
    event_time: z.ZodString;
    bids: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    asks: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    instrument: z.ZodOptional<z.ZodString>;
    event_time: z.ZodString;
    bids: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    asks: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
        num_orders: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">>;
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
export declare const GRVTTradeSchema: z.ZodObject<{
    event_time: z.ZodString;
    instrument: z.ZodOptional<z.ZodString>;
    is_taker_buyer: z.ZodBoolean;
    size: z.ZodString;
    price: z.ZodString;
    mark_price: z.ZodOptional<z.ZodString>;
    index_price: z.ZodOptional<z.ZodString>;
    trade_id: z.ZodString;
    venue: z.ZodOptional<z.ZodString>;
    is_rpi: z.ZodOptional<z.ZodBoolean>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    event_time: z.ZodString;
    instrument: z.ZodOptional<z.ZodString>;
    is_taker_buyer: z.ZodBoolean;
    size: z.ZodString;
    price: z.ZodString;
    mark_price: z.ZodOptional<z.ZodString>;
    index_price: z.ZodOptional<z.ZodString>;
    trade_id: z.ZodString;
    venue: z.ZodOptional<z.ZodString>;
    is_rpi: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    event_time: z.ZodString;
    instrument: z.ZodOptional<z.ZodString>;
    is_taker_buyer: z.ZodBoolean;
    size: z.ZodString;
    price: z.ZodString;
    mark_price: z.ZodOptional<z.ZodString>;
    index_price: z.ZodOptional<z.ZodString>;
    trade_id: z.ZodString;
    venue: z.ZodOptional<z.ZodString>;
    is_rpi: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">>;
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
export declare const GRVTTickerSchema: z.ZodObject<{
    instrument: z.ZodOptional<z.ZodString>;
    event_time: z.ZodOptional<z.ZodString>;
    mark_price: z.ZodOptional<z.ZodString>;
    index_price: z.ZodOptional<z.ZodString>;
    last_price: z.ZodOptional<z.ZodString>;
    mid_price: z.ZodOptional<z.ZodString>;
    best_bid_price: z.ZodOptional<z.ZodString>;
    best_ask_price: z.ZodOptional<z.ZodString>;
    best_bid_size: z.ZodOptional<z.ZodString>;
    best_ask_size: z.ZodOptional<z.ZodString>;
    buy_volume_24h_q: z.ZodOptional<z.ZodString>;
    sell_volume_24h_q: z.ZodOptional<z.ZodString>;
    open_interest: z.ZodOptional<z.ZodString>;
    funding_rate: z.ZodOptional<z.ZodString>;
    next_funding_time: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    instrument: z.ZodOptional<z.ZodString>;
    event_time: z.ZodOptional<z.ZodString>;
    mark_price: z.ZodOptional<z.ZodString>;
    index_price: z.ZodOptional<z.ZodString>;
    last_price: z.ZodOptional<z.ZodString>;
    mid_price: z.ZodOptional<z.ZodString>;
    best_bid_price: z.ZodOptional<z.ZodString>;
    best_ask_price: z.ZodOptional<z.ZodString>;
    best_bid_size: z.ZodOptional<z.ZodString>;
    best_ask_size: z.ZodOptional<z.ZodString>;
    buy_volume_24h_q: z.ZodOptional<z.ZodString>;
    sell_volume_24h_q: z.ZodOptional<z.ZodString>;
    open_interest: z.ZodOptional<z.ZodString>;
    funding_rate: z.ZodOptional<z.ZodString>;
    next_funding_time: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    instrument: z.ZodOptional<z.ZodString>;
    event_time: z.ZodOptional<z.ZodString>;
    mark_price: z.ZodOptional<z.ZodString>;
    index_price: z.ZodOptional<z.ZodString>;
    last_price: z.ZodOptional<z.ZodString>;
    mid_price: z.ZodOptional<z.ZodString>;
    best_bid_price: z.ZodOptional<z.ZodString>;
    best_ask_price: z.ZodOptional<z.ZodString>;
    best_bid_size: z.ZodOptional<z.ZodString>;
    best_ask_size: z.ZodOptional<z.ZodString>;
    buy_volume_24h_q: z.ZodOptional<z.ZodString>;
    sell_volume_24h_q: z.ZodOptional<z.ZodString>;
    open_interest: z.ZodOptional<z.ZodString>;
    funding_rate: z.ZodOptional<z.ZodString>;
    next_funding_time: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
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
//# sourceMappingURL=types.d.ts.map
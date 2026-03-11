/**
 * Pacifica Exchange-Specific Types
 *
 * Based on real API responses from https://api.pacifica.fi/api/v1
 * @see https://docs.pacifica.fi/api-documentation/api/rest-api
 */
import { z } from 'zod';
import type { ExchangeConfig } from '../../types/adapter.js';
export interface PacificaConfig extends ExchangeConfig {
    apiKey?: string;
    apiSecret?: string;
    testnet?: boolean;
    timeout?: number;
    builderCode?: string;
    maxBuilderFeeRate?: number;
}
/**
 * Wrapper for all Pacifica API responses: { success: boolean, data: T }
 */
export interface PacificaApiResponse<T> {
    success: boolean;
    data: T;
}
/**
 * GET /info — market info
 * Real fields: symbol, tick_size, lot_size, max_leverage, funding_rate,
 * next_funding_rate, min_order_size, max_order_size, isolated_only, created_at
 */
export interface PacificaMarket {
    symbol: string;
    tick_size: string;
    lot_size: string;
    min_tick: string;
    max_tick: string;
    max_leverage: number;
    isolated_only: boolean;
    min_order_size: string;
    max_order_size: string;
    funding_rate: string;
    next_funding_rate: string;
    created_at: number;
}
/**
 * GET /info/prices — live price data
 * Real fields: symbol, mark, mid, oracle, funding, next_funding,
 * open_interest, volume_24h, yesterday_price, timestamp
 */
export interface PacificaTicker {
    symbol: string;
    mark: string;
    mid: string;
    oracle: string;
    funding: string;
    next_funding: string;
    open_interest: string;
    volume_24h: string;
    yesterday_price: string;
    timestamp: number;
}
export interface PacificaOrderBookLevel {
    p: string;
    a: string;
    n: number;
}
/**
 * GET /book?symbol=X — orderbook
 * Real format: { success: true, data: { s: "BTC", l: [[bids], [asks]], t: timestamp } }
 * Each level: { p: price, a: amount, n: numOrders }
 */
export interface PacificaOrderBook {
    s: string;
    l: PacificaOrderBookLevel[][];
    t: number;
}
/**
 * GET /trades?symbol=X — recent trade fills
 * Real fields: event_type, price, amount, side, cause, created_at
 */
export interface PacificaTradeResponse {
    event_type: string;
    price: string;
    amount: string;
    side: string;
    cause: string;
    created_at: number;
}
/**
 * GET /funding_rate/history?symbol=X — funding rate history
 * Real fields: oracle_price, bid_impact_price, ask_impact_price,
 * funding_rate, next_funding_rate, created_at
 */
export interface PacificaFundingHistory {
    oracle_price: string;
    bid_impact_price: string;
    ask_impact_price: string;
    funding_rate: string;
    next_funding_rate: string;
    created_at: number;
}
export interface PacificaOrderResponse {
    order_id: string;
    client_order_id?: string;
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    price?: string;
    size: string;
    filled_size: string;
    avg_fill_price?: string;
    status: 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
    reduce_only: boolean;
    post_only: boolean;
    created_at: number;
    updated_at: number;
}
export interface PacificaPosition {
    symbol: string;
    side: 'long' | 'short';
    size: string;
    entry_price: string;
    mark_price: string;
    liquidation_price: string;
    unrealized_pnl: string;
    realized_pnl: string;
    leverage: number;
    margin_mode: 'cross' | 'isolated';
    margin: string;
    maintenance_margin: string;
    timestamp: number;
}
export interface PacificaAccountInfo {
    total_equity: string;
    available_balance: string;
    used_margin: string;
    unrealized_pnl: string;
    currency: string;
}
export interface PacificaBuilderCodeRequest {
    type: 'approve_builder_code';
    builder_code: string;
    max_fee_rate: number;
}
export declare const PacificaApiResponseSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    data: T;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: T;
}>, any> extends infer T_1 ? { [k in keyof T_1]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: T;
}>, any>[k]; } : never, z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: T;
}> extends infer T_2 ? { [k_1 in keyof T_2]: z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: T;
}>[k_1]; } : never>;
export declare const PacificaMarketSchema: z.ZodObject<{
    symbol: z.ZodString;
    tick_size: z.ZodString;
    lot_size: z.ZodString;
    min_tick: z.ZodOptional<z.ZodString>;
    max_tick: z.ZodOptional<z.ZodString>;
    max_leverage: z.ZodNumber;
    isolated_only: z.ZodOptional<z.ZodBoolean>;
    min_order_size: z.ZodOptional<z.ZodString>;
    max_order_size: z.ZodOptional<z.ZodString>;
    funding_rate: z.ZodOptional<z.ZodString>;
    next_funding_rate: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    tick_size: z.ZodString;
    lot_size: z.ZodString;
    min_tick: z.ZodOptional<z.ZodString>;
    max_tick: z.ZodOptional<z.ZodString>;
    max_leverage: z.ZodNumber;
    isolated_only: z.ZodOptional<z.ZodBoolean>;
    min_order_size: z.ZodOptional<z.ZodString>;
    max_order_size: z.ZodOptional<z.ZodString>;
    funding_rate: z.ZodOptional<z.ZodString>;
    next_funding_rate: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    tick_size: z.ZodString;
    lot_size: z.ZodString;
    min_tick: z.ZodOptional<z.ZodString>;
    max_tick: z.ZodOptional<z.ZodString>;
    max_leverage: z.ZodNumber;
    isolated_only: z.ZodOptional<z.ZodBoolean>;
    min_order_size: z.ZodOptional<z.ZodString>;
    max_order_size: z.ZodOptional<z.ZodString>;
    funding_rate: z.ZodOptional<z.ZodString>;
    next_funding_rate: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export declare const PacificaTickerSchema: z.ZodObject<{
    symbol: z.ZodString;
    mark: z.ZodString;
    mid: z.ZodString;
    oracle: z.ZodString;
    funding: z.ZodString;
    next_funding: z.ZodString;
    open_interest: z.ZodString;
    volume_24h: z.ZodString;
    yesterday_price: z.ZodString;
    timestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    mark: z.ZodString;
    mid: z.ZodString;
    oracle: z.ZodString;
    funding: z.ZodString;
    next_funding: z.ZodString;
    open_interest: z.ZodString;
    volume_24h: z.ZodString;
    yesterday_price: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    mark: z.ZodString;
    mid: z.ZodString;
    oracle: z.ZodString;
    funding: z.ZodString;
    next_funding: z.ZodString;
    open_interest: z.ZodString;
    volume_24h: z.ZodString;
    yesterday_price: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const PacificaOrderBookLevelSchema: z.ZodObject<{
    p: z.ZodString;
    a: z.ZodString;
    n: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    p: z.ZodString;
    a: z.ZodString;
    n: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    p: z.ZodString;
    a: z.ZodString;
    n: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const PacificaOrderBookSchema: z.ZodObject<{
    s: z.ZodString;
    l: z.ZodArray<z.ZodArray<z.ZodObject<{
        p: z.ZodString;
        a: z.ZodString;
        n: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        p: z.ZodString;
        a: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        p: z.ZodString;
        a: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">, "many">;
    t: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    s: z.ZodString;
    l: z.ZodArray<z.ZodArray<z.ZodObject<{
        p: z.ZodString;
        a: z.ZodString;
        n: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        p: z.ZodString;
        a: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        p: z.ZodString;
        a: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">, "many">;
    t: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    s: z.ZodString;
    l: z.ZodArray<z.ZodArray<z.ZodObject<{
        p: z.ZodString;
        a: z.ZodString;
        n: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        p: z.ZodString;
        a: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        p: z.ZodString;
        a: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">, "many">;
    t: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const PacificaTradeResponseSchema: z.ZodObject<{
    event_type: z.ZodString;
    price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    amount: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    side: z.ZodString;
    cause: z.ZodOptional<z.ZodString>;
    created_at: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    event_type: z.ZodString;
    price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    amount: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    side: z.ZodString;
    cause: z.ZodOptional<z.ZodString>;
    created_at: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    event_type: z.ZodString;
    price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    amount: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    side: z.ZodString;
    cause: z.ZodOptional<z.ZodString>;
    created_at: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const PacificaFundingHistorySchema: z.ZodObject<{
    oracle_price: z.ZodString;
    bid_impact_price: z.ZodOptional<z.ZodString>;
    ask_impact_price: z.ZodOptional<z.ZodString>;
    funding_rate: z.ZodString;
    next_funding_rate: z.ZodOptional<z.ZodString>;
    created_at: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    oracle_price: z.ZodString;
    bid_impact_price: z.ZodOptional<z.ZodString>;
    ask_impact_price: z.ZodOptional<z.ZodString>;
    funding_rate: z.ZodString;
    next_funding_rate: z.ZodOptional<z.ZodString>;
    created_at: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    oracle_price: z.ZodString;
    bid_impact_price: z.ZodOptional<z.ZodString>;
    ask_impact_price: z.ZodOptional<z.ZodString>;
    funding_rate: z.ZodString;
    next_funding_rate: z.ZodOptional<z.ZodString>;
    created_at: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const PacificaOrderResponseSchema: z.ZodObject<{
    order_id: z.ZodString;
    client_order_id: z.ZodOptional<z.ZodString>;
    symbol: z.ZodString;
    side: z.ZodString;
    type: z.ZodString;
    price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    size: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    filled_size: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    avg_fill_price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    status: z.ZodString;
    reduce_only: z.ZodBoolean;
    post_only: z.ZodBoolean;
    created_at: z.ZodNumber;
    updated_at: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    order_id: z.ZodString;
    client_order_id: z.ZodOptional<z.ZodString>;
    symbol: z.ZodString;
    side: z.ZodString;
    type: z.ZodString;
    price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    size: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    filled_size: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    avg_fill_price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    status: z.ZodString;
    reduce_only: z.ZodBoolean;
    post_only: z.ZodBoolean;
    created_at: z.ZodNumber;
    updated_at: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    order_id: z.ZodString;
    client_order_id: z.ZodOptional<z.ZodString>;
    symbol: z.ZodString;
    side: z.ZodString;
    type: z.ZodString;
    price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    size: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    filled_size: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    avg_fill_price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    status: z.ZodString;
    reduce_only: z.ZodBoolean;
    post_only: z.ZodBoolean;
    created_at: z.ZodNumber;
    updated_at: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const PacificaPositionSchema: z.ZodObject<{
    symbol: z.ZodString;
    side: z.ZodString;
    size: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    entry_price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    mark_price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    liquidation_price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    unrealized_pnl: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    realized_pnl: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    leverage: z.ZodNumber;
    margin_mode: z.ZodString;
    margin: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    maintenance_margin: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    timestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    side: z.ZodString;
    size: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    entry_price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    mark_price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    liquidation_price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    unrealized_pnl: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    realized_pnl: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    leverage: z.ZodNumber;
    margin_mode: z.ZodString;
    margin: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    maintenance_margin: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    side: z.ZodString;
    size: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    entry_price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    mark_price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    liquidation_price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    unrealized_pnl: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    realized_pnl: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    leverage: z.ZodNumber;
    margin_mode: z.ZodString;
    margin: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    maintenance_margin: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const PacificaAccountInfoSchema: z.ZodObject<{
    total_equity: z.ZodString;
    available_balance: z.ZodString;
    used_margin: z.ZodString;
    unrealized_pnl: z.ZodString;
    currency: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    total_equity: z.ZodString;
    available_balance: z.ZodString;
    used_margin: z.ZodString;
    unrealized_pnl: z.ZodString;
    currency: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    total_equity: z.ZodString;
    available_balance: z.ZodString;
    used_margin: z.ZodString;
    unrealized_pnl: z.ZodString;
    currency: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
//# sourceMappingURL=types.d.ts.map
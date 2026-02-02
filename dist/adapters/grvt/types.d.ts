/**
 * GRVT-specific type definitions
 */
/**
 * GRVT API response wrapper
 */
export interface GRVTResponse<T> {
    result: T;
    error?: {
        code: number;
        message: string;
    };
}
/**
 * GRVT market information
 */
export interface GRVTMarket {
    instrument_id: string;
    instrument: string;
    base_currency: string;
    quote_currency: string;
    settlement_currency: string;
    instrument_type: 'PERP' | 'SPOT';
    is_active: boolean;
    maker_fee: string;
    taker_fee: string;
    max_leverage: string;
    min_size: string;
    max_size: string;
    tick_size: string;
    step_size: string;
    mark_price: string;
    index_price: string;
    funding_rate?: string;
    next_funding_time?: number;
    open_interest?: string;
}
/**
 * GRVT order book snapshot
 */
export interface GRVTOrderBook {
    instrument: string;
    bids: Array<[string, string]>;
    asks: Array<[string, string]>;
    timestamp: number;
    sequence: number;
}
/**
 * GRVT order
 */
export interface GRVTOrder {
    order_id: string;
    client_order_id?: string;
    instrument: string;
    order_type: 'MARKET' | 'LIMIT' | 'LIMIT_MAKER';
    side: 'BUY' | 'SELL';
    size: string;
    price?: string;
    time_in_force: 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';
    reduce_only: boolean;
    post_only: boolean;
    status: 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';
    filled_size: string;
    average_fill_price?: string;
    created_at: number;
    updated_at: number;
}
/**
 * GRVT position
 */
export interface GRVTPosition {
    instrument: string;
    side: 'LONG' | 'SHORT';
    size: string;
    entry_price: string;
    mark_price: string;
    liquidation_price?: string;
    unrealized_pnl: string;
    realized_pnl: string;
    margin: string;
    leverage: string;
    timestamp: number;
}
/**
 * GRVT balance
 */
export interface GRVTBalance {
    currency: string;
    total: string;
    available: string;
    reserved: string;
    unrealized_pnl: string;
}
/**
 * GRVT trade
 */
export interface GRVTTrade {
    trade_id: string;
    instrument: string;
    side: 'BUY' | 'SELL';
    price: string;
    size: string;
    timestamp: number;
    is_buyer_maker: boolean;
}
/**
 * GRVT ticker
 */
export interface GRVTTicker {
    instrument: string;
    last_price: string;
    best_bid: string;
    best_ask: string;
    volume_24h: string;
    high_24h: string;
    low_24h: string;
    price_change_24h: string;
    timestamp: number;
}
/**
 * GRVT order request
 */
export interface GRVTOrderRequest {
    instrument: string;
    order_type: 'MARKET' | 'LIMIT' | 'LIMIT_MAKER';
    side: 'BUY' | 'SELL';
    size: string;
    price?: string;
    time_in_force?: 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';
    reduce_only?: boolean;
    post_only?: boolean;
    client_order_id?: string;
}
/**
 * GRVT cancel order request
 */
export interface GRVTCancelRequest {
    order_id?: string;
    client_order_id?: string;
    instrument?: string;
}
/**
 * GRVT WebSocket subscription
 */
export interface GRVTSubscription {
    method: 'subscribe' | 'unsubscribe';
    params: {
        channels: string[];
    };
}
/**
 * GRVT WebSocket message
 */
export interface GRVTWsMessage {
    channel: string;
    data: unknown;
    timestamp: number;
}
/**
 * GRVT order book update
 */
export interface GRVTWsOrderBookUpdate {
    instrument: string;
    bids: Array<[string, string]>;
    asks: Array<[string, string]>;
    timestamp: number;
    sequence: number;
    is_snapshot: boolean;
}
/**
 * GRVT trade update
 */
export interface GRVTWsTradeUpdate {
    trades: GRVTTrade[];
}
/**
 * GRVT position update
 */
export interface GRVTWsPositionUpdate {
    positions: GRVTPosition[];
}
/**
 * GRVT order update
 */
export interface GRVTWsOrderUpdate {
    orders: GRVTOrder[];
}
/**
 * EIP-712 domain for GRVT
 */
export interface GRVTEip712Domain {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
}
/**
 * GRVT order signature payload
 */
export interface GRVTOrderSignPayload {
    instrument: string;
    order_type: string;
    side: string;
    size: string;
    price: string;
    time_in_force: string;
    reduce_only: boolean;
    post_only: boolean;
    nonce: number;
    expiry: number;
}
import { z } from 'zod';
/**
 * GRVT Market Schema
 */
export declare const GRVTMarketSchema: z.ZodObject<{
    instrument_id: z.ZodString;
    instrument: z.ZodString;
    base_currency: z.ZodString;
    quote_currency: z.ZodString;
    settlement_currency: z.ZodString;
    instrument_type: z.ZodEnum<["PERP", "SPOT"]>;
    is_active: z.ZodBoolean;
    maker_fee: z.ZodString;
    taker_fee: z.ZodString;
    max_leverage: z.ZodString;
    min_size: z.ZodString;
    max_size: z.ZodString;
    tick_size: z.ZodString;
    step_size: z.ZodString;
    mark_price: z.ZodString;
    index_price: z.ZodString;
    funding_rate: z.ZodOptional<z.ZodString>;
    next_funding_time: z.ZodOptional<z.ZodNumber>;
    open_interest: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    instrument: string;
    instrument_id: string;
    base_currency: string;
    quote_currency: string;
    settlement_currency: string;
    instrument_type: "PERP" | "SPOT";
    is_active: boolean;
    maker_fee: string;
    taker_fee: string;
    max_leverage: string;
    min_size: string;
    max_size: string;
    tick_size: string;
    step_size: string;
    mark_price: string;
    index_price: string;
    funding_rate?: string | undefined;
    next_funding_time?: number | undefined;
    open_interest?: string | undefined;
}, {
    instrument: string;
    instrument_id: string;
    base_currency: string;
    quote_currency: string;
    settlement_currency: string;
    instrument_type: "PERP" | "SPOT";
    is_active: boolean;
    maker_fee: string;
    taker_fee: string;
    max_leverage: string;
    min_size: string;
    max_size: string;
    tick_size: string;
    step_size: string;
    mark_price: string;
    index_price: string;
    funding_rate?: string | undefined;
    next_funding_time?: number | undefined;
    open_interest?: string | undefined;
}>;
/**
 * GRVT Order Book Schema
 */
export declare const GRVTOrderBookSchema: z.ZodObject<{
    instrument: z.ZodString;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    timestamp: z.ZodNumber;
    sequence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    instrument: string;
    bids: [string, string][];
    asks: [string, string][];
    sequence: number;
}, {
    timestamp: number;
    instrument: string;
    bids: [string, string][];
    asks: [string, string][];
    sequence: number;
}>;
/**
 * GRVT Order Schema
 */
export declare const GRVTOrderSchema: z.ZodObject<{
    order_id: z.ZodString;
    client_order_id: z.ZodOptional<z.ZodString>;
    instrument: z.ZodString;
    order_type: z.ZodEnum<["MARKET", "LIMIT", "LIMIT_MAKER"]>;
    side: z.ZodEnum<["BUY", "SELL"]>;
    size: z.ZodString;
    price: z.ZodOptional<z.ZodString>;
    time_in_force: z.ZodEnum<["GTC", "IOC", "FOK", "POST_ONLY"]>;
    reduce_only: z.ZodBoolean;
    post_only: z.ZodBoolean;
    status: z.ZodEnum<["PENDING", "OPEN", "PARTIALLY_FILLED", "FILLED", "CANCELLED", "REJECTED"]>;
    filled_size: z.ZodString;
    average_fill_price: z.ZodOptional<z.ZodString>;
    created_at: z.ZodNumber;
    updated_at: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    status: "OPEN" | "PENDING" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED" | "REJECTED";
    side: "BUY" | "SELL";
    order_type: "MARKET" | "LIMIT" | "LIMIT_MAKER";
    instrument: string;
    size: string;
    order_id: string;
    time_in_force: "GTC" | "IOC" | "FOK" | "POST_ONLY";
    reduce_only: boolean;
    post_only: boolean;
    filled_size: string;
    created_at: number;
    updated_at: number;
    price?: string | undefined;
    client_order_id?: string | undefined;
    average_fill_price?: string | undefined;
}, {
    status: "OPEN" | "PENDING" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED" | "REJECTED";
    side: "BUY" | "SELL";
    order_type: "MARKET" | "LIMIT" | "LIMIT_MAKER";
    instrument: string;
    size: string;
    order_id: string;
    time_in_force: "GTC" | "IOC" | "FOK" | "POST_ONLY";
    reduce_only: boolean;
    post_only: boolean;
    filled_size: string;
    created_at: number;
    updated_at: number;
    price?: string | undefined;
    client_order_id?: string | undefined;
    average_fill_price?: string | undefined;
}>;
/**
 * GRVT Position Schema
 */
export declare const GRVTPositionSchema: z.ZodObject<{
    instrument: z.ZodString;
    side: z.ZodEnum<["LONG", "SHORT"]>;
    size: z.ZodString;
    entry_price: z.ZodString;
    mark_price: z.ZodString;
    liquidation_price: z.ZodOptional<z.ZodString>;
    unrealized_pnl: z.ZodString;
    realized_pnl: z.ZodString;
    margin: z.ZodString;
    leverage: z.ZodString;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    side: "LONG" | "SHORT";
    timestamp: number;
    margin: string;
    instrument: string;
    size: string;
    mark_price: string;
    entry_price: string;
    unrealized_pnl: string;
    realized_pnl: string;
    leverage: string;
    liquidation_price?: string | undefined;
}, {
    side: "LONG" | "SHORT";
    timestamp: number;
    margin: string;
    instrument: string;
    size: string;
    mark_price: string;
    entry_price: string;
    unrealized_pnl: string;
    realized_pnl: string;
    leverage: string;
    liquidation_price?: string | undefined;
}>;
/**
 * GRVT Balance Schema
 */
export declare const GRVTBalanceSchema: z.ZodObject<{
    currency: z.ZodString;
    total: z.ZodString;
    available: z.ZodString;
    reserved: z.ZodString;
    unrealized_pnl: z.ZodString;
}, "strip", z.ZodTypeAny, {
    total: string;
    unrealized_pnl: string;
    currency: string;
    available: string;
    reserved: string;
}, {
    total: string;
    unrealized_pnl: string;
    currency: string;
    available: string;
    reserved: string;
}>;
/**
 * GRVT Trade Schema
 */
export declare const GRVTTradeSchema: z.ZodObject<{
    trade_id: z.ZodString;
    instrument: z.ZodString;
    side: z.ZodEnum<["BUY", "SELL"]>;
    price: z.ZodString;
    size: z.ZodString;
    timestamp: z.ZodNumber;
    is_buyer_maker: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    side: "BUY" | "SELL";
    timestamp: number;
    price: string;
    instrument: string;
    size: string;
    trade_id: string;
    is_buyer_maker: boolean;
}, {
    side: "BUY" | "SELL";
    timestamp: number;
    price: string;
    instrument: string;
    size: string;
    trade_id: string;
    is_buyer_maker: boolean;
}>;
/**
 * GRVT Ticker Schema
 */
export declare const GRVTTickerSchema: z.ZodObject<{
    instrument: z.ZodString;
    last_price: z.ZodString;
    best_bid: z.ZodString;
    best_ask: z.ZodString;
    volume_24h: z.ZodString;
    high_24h: z.ZodString;
    low_24h: z.ZodString;
    price_change_24h: z.ZodString;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    instrument: string;
    last_price: string;
    best_bid: string;
    best_ask: string;
    volume_24h: string;
    high_24h: string;
    low_24h: string;
    price_change_24h: string;
}, {
    timestamp: number;
    instrument: string;
    last_price: string;
    best_bid: string;
    best_ask: string;
    volume_24h: string;
    high_24h: string;
    low_24h: string;
    price_change_24h: string;
}>;
//# sourceMappingURL=types.d.ts.map
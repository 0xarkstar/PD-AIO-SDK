/**
 * GRVT-specific type definitions
 */
import { z } from 'zod';
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
export declare const GRVTMarketSchema: z.ZodObject<{
    instrument_id: z.ZodString;
    instrument: z.ZodString;
    base_currency: z.ZodString;
    quote_currency: z.ZodString;
    settlement_currency: z.ZodString;
    instrument_type: z.ZodString;
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
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    instrument_id: z.ZodString;
    instrument: z.ZodString;
    base_currency: z.ZodString;
    quote_currency: z.ZodString;
    settlement_currency: z.ZodString;
    instrument_type: z.ZodString;
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
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    instrument_id: z.ZodString;
    instrument: z.ZodString;
    base_currency: z.ZodString;
    quote_currency: z.ZodString;
    settlement_currency: z.ZodString;
    instrument_type: z.ZodString;
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
}, z.ZodTypeAny, "passthrough">>;
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
export declare const GRVTOrderBookSchema: z.ZodObject<{
    instrument: z.ZodString;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    timestamp: z.ZodNumber;
    sequence: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    instrument: z.ZodString;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    timestamp: z.ZodNumber;
    sequence: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    instrument: z.ZodString;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    timestamp: z.ZodNumber;
    sequence: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
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
export declare const GRVTOrderSchema: z.ZodObject<{
    order_id: z.ZodString;
    client_order_id: z.ZodOptional<z.ZodString>;
    instrument: z.ZodString;
    order_type: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    price: z.ZodOptional<z.ZodString>;
    time_in_force: z.ZodString;
    reduce_only: z.ZodBoolean;
    post_only: z.ZodBoolean;
    status: z.ZodString;
    filled_size: z.ZodString;
    average_fill_price: z.ZodOptional<z.ZodString>;
    created_at: z.ZodNumber;
    updated_at: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    order_id: z.ZodString;
    client_order_id: z.ZodOptional<z.ZodString>;
    instrument: z.ZodString;
    order_type: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    price: z.ZodOptional<z.ZodString>;
    time_in_force: z.ZodString;
    reduce_only: z.ZodBoolean;
    post_only: z.ZodBoolean;
    status: z.ZodString;
    filled_size: z.ZodString;
    average_fill_price: z.ZodOptional<z.ZodString>;
    created_at: z.ZodNumber;
    updated_at: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    order_id: z.ZodString;
    client_order_id: z.ZodOptional<z.ZodString>;
    instrument: z.ZodString;
    order_type: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    price: z.ZodOptional<z.ZodString>;
    time_in_force: z.ZodString;
    reduce_only: z.ZodBoolean;
    post_only: z.ZodBoolean;
    status: z.ZodString;
    filled_size: z.ZodString;
    average_fill_price: z.ZodOptional<z.ZodString>;
    created_at: z.ZodNumber;
    updated_at: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
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
export declare const GRVTPositionSchema: z.ZodObject<{
    instrument: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    entry_price: z.ZodString;
    mark_price: z.ZodString;
    liquidation_price: z.ZodOptional<z.ZodString>;
    unrealized_pnl: z.ZodString;
    realized_pnl: z.ZodString;
    margin: z.ZodString;
    leverage: z.ZodString;
    timestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    instrument: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    entry_price: z.ZodString;
    mark_price: z.ZodString;
    liquidation_price: z.ZodOptional<z.ZodString>;
    unrealized_pnl: z.ZodString;
    realized_pnl: z.ZodString;
    margin: z.ZodString;
    leverage: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    instrument: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    entry_price: z.ZodString;
    mark_price: z.ZodString;
    liquidation_price: z.ZodOptional<z.ZodString>;
    unrealized_pnl: z.ZodString;
    realized_pnl: z.ZodString;
    margin: z.ZodString;
    leverage: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
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
export declare const GRVTBalanceSchema: z.ZodObject<{
    currency: z.ZodString;
    total: z.ZodString;
    available: z.ZodString;
    reserved: z.ZodString;
    unrealized_pnl: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    currency: z.ZodString;
    total: z.ZodString;
    available: z.ZodString;
    reserved: z.ZodString;
    unrealized_pnl: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    currency: z.ZodString;
    total: z.ZodString;
    available: z.ZodString;
    reserved: z.ZodString;
    unrealized_pnl: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
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
export declare const GRVTTradeSchema: z.ZodObject<{
    trade_id: z.ZodString;
    instrument: z.ZodString;
    side: z.ZodString;
    price: z.ZodString;
    size: z.ZodString;
    timestamp: z.ZodNumber;
    is_buyer_maker: z.ZodBoolean;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    trade_id: z.ZodString;
    instrument: z.ZodString;
    side: z.ZodString;
    price: z.ZodString;
    size: z.ZodString;
    timestamp: z.ZodNumber;
    is_buyer_maker: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    trade_id: z.ZodString;
    instrument: z.ZodString;
    side: z.ZodString;
    price: z.ZodString;
    size: z.ZodString;
    timestamp: z.ZodNumber;
    is_buyer_maker: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">>;
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
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    instrument: z.ZodString;
    last_price: z.ZodString;
    best_bid: z.ZodString;
    best_ask: z.ZodString;
    volume_24h: z.ZodString;
    high_24h: z.ZodString;
    low_24h: z.ZodString;
    price_change_24h: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    instrument: z.ZodString;
    last_price: z.ZodString;
    best_bid: z.ZodString;
    best_ask: z.ZodString;
    volume_24h: z.ZodString;
    high_24h: z.ZodString;
    low_24h: z.ZodString;
    price_change_24h: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
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
//# sourceMappingURL=types.d.ts.map
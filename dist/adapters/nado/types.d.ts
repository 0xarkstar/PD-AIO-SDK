/**
 * Nado Exchange Type Definitions
 *
 * TypeScript types and Zod schemas for Nado API requests and responses.
 *
 * @see https://docs.nado.xyz
 */
import { z } from 'zod';
/**
 * Nado API Response Wrapper
 */
export interface NadoResponse<T> {
    status: 'success' | 'failure';
    data?: T;
    error?: string;
    error_code?: number;
    request_type?: string;
}
export declare const NadoResponseSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    status: z.ZodEnum<["success", "failure"]>;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    error_code: z.ZodOptional<z.ZodNumber>;
    request_type: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    status: z.ZodEnum<["success", "failure"]>;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    error_code: z.ZodOptional<z.ZodNumber>;
    request_type: z.ZodOptional<z.ZodString>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    status: z.ZodEnum<["success", "failure"]>;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    error_code: z.ZodOptional<z.ZodNumber>;
    request_type: z.ZodOptional<z.ZodString>;
}>, any>[k]; } : never, z.baseObjectInputType<{
    status: z.ZodEnum<["success", "failure"]>;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    error_code: z.ZodOptional<z.ZodNumber>;
    request_type: z.ZodOptional<z.ZodString>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: z.baseObjectInputType<{
    status: z.ZodEnum<["success", "failure"]>;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    error_code: z.ZodOptional<z.ZodNumber>;
    request_type: z.ZodOptional<z.ZodString>;
}>[k_1]; } : never>;
/**
 * Nado Symbol (Market) Information from /query?type=symbols
 *
 * This is the structure returned by the symbols endpoint.
 * Note: All numeric values are in x18 format (18 decimal places).
 */
export interface NadoSymbol {
    type: 'perp' | 'spot';
    product_id: number;
    symbol: string;
    price_increment_x18: string;
    size_increment: string;
    min_size: string;
    maker_fee_rate_x18: string;
    taker_fee_rate_x18: string;
    long_weight_initial_x18: string;
    long_weight_maintenance_x18: string;
    max_open_interest_x18?: string | null;
}
export declare const NadoSymbolSchema: z.ZodObject<{
    type: z.ZodEnum<["perp", "spot"]>;
    product_id: z.ZodNumber;
    symbol: z.ZodString;
    price_increment_x18: z.ZodString;
    size_increment: z.ZodString;
    min_size: z.ZodString;
    maker_fee_rate_x18: z.ZodString;
    taker_fee_rate_x18: z.ZodString;
    long_weight_initial_x18: z.ZodString;
    long_weight_maintenance_x18: z.ZodString;
    max_open_interest_x18: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    type: "perp" | "spot";
    product_id: number;
    price_increment_x18: string;
    size_increment: string;
    min_size: string;
    maker_fee_rate_x18: string;
    taker_fee_rate_x18: string;
    long_weight_initial_x18: string;
    long_weight_maintenance_x18: string;
    max_open_interest_x18?: string | null | undefined;
}, {
    symbol: string;
    type: "perp" | "spot";
    product_id: number;
    price_increment_x18: string;
    size_increment: string;
    min_size: string;
    maker_fee_rate_x18: string;
    taker_fee_rate_x18: string;
    long_weight_initial_x18: string;
    long_weight_maintenance_x18: string;
    max_open_interest_x18?: string | null | undefined;
}>;
/**
 * @deprecated Use NadoSymbol instead - this was based on incorrect API assumptions
 */
export interface NadoProduct {
    product_id: number;
    symbol: string;
    base_currency: string;
    quote_currency: string;
    contract_size: string;
    tick_size: string;
    min_size: string;
    max_position_size?: string;
    maker_fee: string;
    taker_fee: string;
    is_active: boolean;
    product_type: 'perpetual' | 'spot' | 'future';
}
/**
 * @deprecated Use NadoSymbolSchema instead
 */
export declare const NadoProductSchema: z.ZodObject<{
    product_id: z.ZodNumber;
    symbol: z.ZodString;
    base_currency: z.ZodString;
    quote_currency: z.ZodString;
    contract_size: z.ZodString;
    tick_size: z.ZodString;
    min_size: z.ZodString;
    max_position_size: z.ZodOptional<z.ZodString>;
    maker_fee: z.ZodString;
    taker_fee: z.ZodString;
    is_active: z.ZodBoolean;
    product_type: z.ZodEnum<["perpetual", "spot", "future"]>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    product_id: number;
    min_size: string;
    base_currency: string;
    quote_currency: string;
    contract_size: string;
    tick_size: string;
    maker_fee: string;
    taker_fee: string;
    is_active: boolean;
    product_type: "spot" | "perpetual" | "future";
    max_position_size?: string | undefined;
}, {
    symbol: string;
    product_id: number;
    min_size: string;
    base_currency: string;
    quote_currency: string;
    contract_size: string;
    tick_size: string;
    maker_fee: string;
    taker_fee: string;
    is_active: boolean;
    product_type: "spot" | "perpetual" | "future";
    max_position_size?: string | undefined;
}>;
/**
 * Nado Order Book Level
 * Format: [price_x18, size_x18]
 */
export type NadoOrderBookLevel = [string, string];
/**
 * Nado Order Book (from market_liquidity endpoint)
 */
export interface NadoOrderBook {
    bids: NadoOrderBookLevel[];
    asks: NadoOrderBookLevel[];
}
export declare const NadoOrderBookSchema: z.ZodObject<{
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
}, "strip", z.ZodTypeAny, {
    bids: [string, string][];
    asks: [string, string][];
}, {
    bids: [string, string][];
    asks: [string, string][];
}>;
/**
 * Nado Order
 */
export interface NadoOrder {
    order_id: string;
    digest: string;
    product_id: number;
    sender: string;
    price_x18: string;
    amount: string;
    side: 0 | 1;
    expiration: number;
    nonce: number;
    status: 'open' | 'filled' | 'cancelled' | 'expired' | 'rejected';
    filled_amount: string;
    remaining_amount: string;
    avg_fill_price?: string;
    timestamp: number;
    is_reduce_only?: boolean;
    post_only?: boolean;
    time_in_force?: 'gtc' | 'ioc' | 'fok';
}
export declare const NadoOrderSchema: z.ZodObject<{
    order_id: z.ZodString;
    digest: z.ZodString;
    product_id: z.ZodNumber;
    sender: z.ZodString;
    price_x18: z.ZodString;
    amount: z.ZodString;
    side: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
    expiration: z.ZodNumber;
    nonce: z.ZodNumber;
    status: z.ZodEnum<["open", "filled", "cancelled", "expired", "rejected"]>;
    filled_amount: z.ZodString;
    remaining_amount: z.ZodString;
    avg_fill_price: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodNumber;
    is_reduce_only: z.ZodOptional<z.ZodBoolean>;
    post_only: z.ZodOptional<z.ZodBoolean>;
    time_in_force: z.ZodOptional<z.ZodEnum<["gtc", "ioc", "fok"]>>;
}, "strip", z.ZodTypeAny, {
    status: "open" | "expired" | "rejected" | "filled" | "cancelled";
    side: 0 | 1;
    amount: string;
    timestamp: number;
    nonce: number;
    expiration: number;
    product_id: number;
    order_id: string;
    digest: string;
    sender: string;
    price_x18: string;
    filled_amount: string;
    remaining_amount: string;
    avg_fill_price?: string | undefined;
    time_in_force?: "ioc" | "fok" | "gtc" | undefined;
    post_only?: boolean | undefined;
    is_reduce_only?: boolean | undefined;
}, {
    status: "open" | "expired" | "rejected" | "filled" | "cancelled";
    side: 0 | 1;
    amount: string;
    timestamp: number;
    nonce: number;
    expiration: number;
    product_id: number;
    order_id: string;
    digest: string;
    sender: string;
    price_x18: string;
    filled_amount: string;
    remaining_amount: string;
    avg_fill_price?: string | undefined;
    time_in_force?: "ioc" | "fok" | "gtc" | undefined;
    post_only?: boolean | undefined;
    is_reduce_only?: boolean | undefined;
}>;
/**
 * Nado Position
 */
export interface NadoPosition {
    product_id: number;
    subaccount: string;
    size: string;
    entry_price: string;
    mark_price: string;
    liquidation_price?: string;
    unrealized_pnl: string;
    realized_pnl: string;
    leverage: string;
    margin: string;
    timestamp: number;
}
export declare const NadoPositionSchema: z.ZodObject<{
    product_id: z.ZodNumber;
    subaccount: z.ZodString;
    size: z.ZodString;
    entry_price: z.ZodString;
    mark_price: z.ZodString;
    liquidation_price: z.ZodOptional<z.ZodString>;
    unrealized_pnl: z.ZodString;
    realized_pnl: z.ZodString;
    leverage: z.ZodString;
    margin: z.ZodString;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    margin: string;
    leverage: string;
    timestamp: number;
    size: string;
    product_id: number;
    subaccount: string;
    entry_price: string;
    mark_price: string;
    unrealized_pnl: string;
    realized_pnl: string;
    liquidation_price?: string | undefined;
}, {
    margin: string;
    leverage: string;
    timestamp: number;
    size: string;
    product_id: number;
    subaccount: string;
    entry_price: string;
    mark_price: string;
    unrealized_pnl: string;
    realized_pnl: string;
    liquidation_price?: string | undefined;
}>;
/**
 * Nado Balance (Subaccount Info)
 */
export interface NadoBalance {
    subaccount: string;
    quote_balance: string;
    total_equity: string;
    used_margin: string;
    free_margin: string;
    unrealized_pnl: string;
    health: string;
    timestamp: number;
}
export declare const NadoBalanceSchema: z.ZodObject<{
    subaccount: z.ZodString;
    quote_balance: z.ZodString;
    total_equity: z.ZodString;
    used_margin: z.ZodString;
    free_margin: z.ZodString;
    unrealized_pnl: z.ZodString;
    health: z.ZodString;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    subaccount: string;
    unrealized_pnl: string;
    quote_balance: string;
    total_equity: string;
    used_margin: string;
    free_margin: string;
    health: string;
}, {
    timestamp: number;
    subaccount: string;
    unrealized_pnl: string;
    quote_balance: string;
    total_equity: string;
    used_margin: string;
    free_margin: string;
    health: string;
}>;
/**
 * Nado Trade
 */
export interface NadoTrade {
    trade_id: string;
    product_id: number;
    price: string;
    size: string;
    side: 0 | 1;
    timestamp: number;
    is_maker: boolean;
}
export declare const NadoTradeSchema: z.ZodObject<{
    trade_id: z.ZodString;
    product_id: z.ZodNumber;
    price: z.ZodString;
    size: z.ZodString;
    side: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<1>]>;
    timestamp: z.ZodNumber;
    is_maker: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    side: 0 | 1;
    price: string;
    timestamp: number;
    size: string;
    product_id: number;
    trade_id: string;
    is_maker: boolean;
}, {
    side: 0 | 1;
    price: string;
    timestamp: number;
    size: string;
    product_id: number;
    trade_id: string;
    is_maker: boolean;
}>;
/**
 * Nado Ticker (from market_prices endpoint)
 * Note: The API returns minimal price data (bid/ask only)
 */
export interface NadoTicker {
    product_id: number;
    bid_x18: string;
    ask_x18: string;
}
export declare const NadoTickerSchema: z.ZodObject<{
    product_id: z.ZodNumber;
    bid_x18: z.ZodString;
    ask_x18: z.ZodString;
}, "strip", z.ZodTypeAny, {
    product_id: number;
    bid_x18: string;
    ask_x18: string;
}, {
    product_id: number;
    bid_x18: string;
    ask_x18: string;
}>;
/**
 * EIP712 Order Structure for Signing
 *
 * Note: nonce is bigint because Nado uses 64-bit nonces that exceed
 * JavaScript's safe integer limit (2^53 - 1).
 */
export interface NadoEIP712Order {
    sender: string;
    priceX18: string;
    amount: string;
    expiration: number;
    nonce: bigint;
    appendix: {
        productId: number;
        side: 0 | 1;
        reduceOnly: boolean;
        postOnly: boolean;
    };
}
/**
 * EIP712 Cancellation Structure
 *
 * Note: nonce is bigint because Nado uses 64-bit nonces.
 */
export interface NadoEIP712Cancellation {
    sender: string;
    productIds: number[];
    digests: string[];
    nonce: bigint;
}
/**
 * EIP712 Stream Authentication
 */
export interface NadoEIP712StreamAuth {
    sender: string;
    expiration: number;
}
/**
 * Nado Contracts Info (from /contracts query)
 */
export interface NadoContracts {
    chain_id: string;
    endpoint_addr: string;
    products?: {
        [productId: string]: {
            address: string;
            symbol: string;
        };
    };
}
export declare const NadoContractsSchema: z.ZodObject<{
    chain_id: z.ZodString;
    endpoint_addr: z.ZodString;
    products: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        address: z.ZodString;
        symbol: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        address: string;
    }, {
        symbol: string;
        address: string;
    }>>>;
}, "strip", z.ZodTypeAny, {
    chain_id: string;
    endpoint_addr: string;
    products?: Record<string, {
        symbol: string;
        address: string;
    }> | undefined;
}, {
    chain_id: string;
    endpoint_addr: string;
    products?: Record<string, {
        symbol: string;
        address: string;
    }> | undefined;
}>;
/**
 * Nado Configuration
 */
export interface NadoConfig {
    wallet?: any;
    privateKey?: string;
    testnet?: boolean;
    subaccount?: string;
}
/**
 * Nado WebSocket Message Types
 */
export interface NadoWSMessage {
    type: 'query' | 'execute' | 'subscribe' | 'unsubscribe';
    channel?: string;
    data?: any;
}
/**
 * Nado WebSocket Subscription
 */
export interface NadoWSSubscription {
    channel: string;
    product_id?: number;
    subaccount?: string;
}
/**
 * Product ID to Symbol mapping cache
 */
export interface ProductMapping {
    productId: number;
    symbol: string;
    ccxtSymbol: string;
}
//# sourceMappingURL=types.d.ts.map
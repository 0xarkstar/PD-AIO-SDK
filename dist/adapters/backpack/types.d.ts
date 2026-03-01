/**
 * Backpack-specific type definitions
 */
import { z } from 'zod';
/**
 * Backpack adapter configuration
 */
export interface BackpackConfig {
    apiKey?: string;
    apiSecret?: string;
    ed25519PrivateKey?: string;
    testnet?: boolean;
    timeout?: number;
}
/**
 * Backpack market response
 * API uses camelCase
 */
export interface BackpackMarket {
    symbol: string;
    baseSymbol: string;
    quoteSymbol: string;
    marketType: 'SPOT' | 'PERP';
    orderBookState: string;
    visible: boolean;
    filters: {
        price: {
            tickSize: string;
            minPrice?: string;
            maxPrice?: string | null;
        };
        quantity: {
            stepSize: string;
            minQuantity: string;
            maxQuantity?: string | null;
        };
    };
    fundingInterval?: number | null;
    imfFunction?: unknown;
    mmfFunction?: unknown;
    positionLimitWeight?: unknown;
    openInterestLimit?: string;
}
export declare const BackpackMarketSchema: z.ZodObject<{
    symbol: z.ZodString;
    baseSymbol: z.ZodOptional<z.ZodString>;
    quoteSymbol: z.ZodOptional<z.ZodString>;
    marketType: z.ZodOptional<z.ZodEnum<["SPOT", "PERP"]>>;
    orderBookState: z.ZodOptional<z.ZodString>;
    visible: z.ZodOptional<z.ZodBoolean>;
    filters: z.ZodOptional<z.ZodObject<{
        price: z.ZodOptional<z.ZodObject<{
            tickSize: z.ZodString;
            minPrice: z.ZodOptional<z.ZodString>;
            maxPrice: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            tickSize: string;
            minPrice?: string | undefined;
            maxPrice?: string | null | undefined;
        }, {
            tickSize: string;
            minPrice?: string | undefined;
            maxPrice?: string | null | undefined;
        }>>;
        quantity: z.ZodOptional<z.ZodObject<{
            stepSize: z.ZodString;
            minQuantity: z.ZodString;
            maxQuantity: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            stepSize: string;
            minQuantity: string;
            maxQuantity?: string | null | undefined;
        }, {
            stepSize: string;
            minQuantity: string;
            maxQuantity?: string | null | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        price?: {
            tickSize: string;
            minPrice?: string | undefined;
            maxPrice?: string | null | undefined;
        } | undefined;
        quantity?: {
            stepSize: string;
            minQuantity: string;
            maxQuantity?: string | null | undefined;
        } | undefined;
    }, {
        price?: {
            tickSize: string;
            minPrice?: string | undefined;
            maxPrice?: string | null | undefined;
        } | undefined;
        quantity?: {
            stepSize: string;
            minQuantity: string;
            maxQuantity?: string | null | undefined;
        } | undefined;
    }>>;
    fundingInterval: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    imfFunction: z.ZodOptional<z.ZodUnknown>;
    mmfFunction: z.ZodOptional<z.ZodUnknown>;
    positionLimitWeight: z.ZodOptional<z.ZodUnknown>;
    openInterestLimit: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    baseSymbol: z.ZodOptional<z.ZodString>;
    quoteSymbol: z.ZodOptional<z.ZodString>;
    marketType: z.ZodOptional<z.ZodEnum<["SPOT", "PERP"]>>;
    orderBookState: z.ZodOptional<z.ZodString>;
    visible: z.ZodOptional<z.ZodBoolean>;
    filters: z.ZodOptional<z.ZodObject<{
        price: z.ZodOptional<z.ZodObject<{
            tickSize: z.ZodString;
            minPrice: z.ZodOptional<z.ZodString>;
            maxPrice: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            tickSize: string;
            minPrice?: string | undefined;
            maxPrice?: string | null | undefined;
        }, {
            tickSize: string;
            minPrice?: string | undefined;
            maxPrice?: string | null | undefined;
        }>>;
        quantity: z.ZodOptional<z.ZodObject<{
            stepSize: z.ZodString;
            minQuantity: z.ZodString;
            maxQuantity: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            stepSize: string;
            minQuantity: string;
            maxQuantity?: string | null | undefined;
        }, {
            stepSize: string;
            minQuantity: string;
            maxQuantity?: string | null | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        price?: {
            tickSize: string;
            minPrice?: string | undefined;
            maxPrice?: string | null | undefined;
        } | undefined;
        quantity?: {
            stepSize: string;
            minQuantity: string;
            maxQuantity?: string | null | undefined;
        } | undefined;
    }, {
        price?: {
            tickSize: string;
            minPrice?: string | undefined;
            maxPrice?: string | null | undefined;
        } | undefined;
        quantity?: {
            stepSize: string;
            minQuantity: string;
            maxQuantity?: string | null | undefined;
        } | undefined;
    }>>;
    fundingInterval: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    imfFunction: z.ZodOptional<z.ZodUnknown>;
    mmfFunction: z.ZodOptional<z.ZodUnknown>;
    positionLimitWeight: z.ZodOptional<z.ZodUnknown>;
    openInterestLimit: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    baseSymbol: z.ZodOptional<z.ZodString>;
    quoteSymbol: z.ZodOptional<z.ZodString>;
    marketType: z.ZodOptional<z.ZodEnum<["SPOT", "PERP"]>>;
    orderBookState: z.ZodOptional<z.ZodString>;
    visible: z.ZodOptional<z.ZodBoolean>;
    filters: z.ZodOptional<z.ZodObject<{
        price: z.ZodOptional<z.ZodObject<{
            tickSize: z.ZodString;
            minPrice: z.ZodOptional<z.ZodString>;
            maxPrice: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            tickSize: string;
            minPrice?: string | undefined;
            maxPrice?: string | null | undefined;
        }, {
            tickSize: string;
            minPrice?: string | undefined;
            maxPrice?: string | null | undefined;
        }>>;
        quantity: z.ZodOptional<z.ZodObject<{
            stepSize: z.ZodString;
            minQuantity: z.ZodString;
            maxQuantity: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            stepSize: string;
            minQuantity: string;
            maxQuantity?: string | null | undefined;
        }, {
            stepSize: string;
            minQuantity: string;
            maxQuantity?: string | null | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        price?: {
            tickSize: string;
            minPrice?: string | undefined;
            maxPrice?: string | null | undefined;
        } | undefined;
        quantity?: {
            stepSize: string;
            minQuantity: string;
            maxQuantity?: string | null | undefined;
        } | undefined;
    }, {
        price?: {
            tickSize: string;
            minPrice?: string | undefined;
            maxPrice?: string | null | undefined;
        } | undefined;
        quantity?: {
            stepSize: string;
            minQuantity: string;
            maxQuantity?: string | null | undefined;
        } | undefined;
    }>>;
    fundingInterval: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    imfFunction: z.ZodOptional<z.ZodUnknown>;
    mmfFunction: z.ZodOptional<z.ZodUnknown>;
    positionLimitWeight: z.ZodOptional<z.ZodUnknown>;
    openInterestLimit: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Backpack order response
 */
export interface BackpackOrder {
    order_id: string;
    client_order_id?: string;
    market: string;
    side: 'Bid' | 'Ask' | 'BUY' | 'SELL';
    type: 'Market' | 'Limit' | 'PostOnly' | 'MARKET' | 'LIMIT' | 'POST_ONLY';
    size: string;
    price?: string;
    filled_size: string;
    avg_price?: string;
    status: 'New' | 'Open' | 'PartiallyFilled' | 'Filled' | 'Cancelled' | 'Rejected' | 'NEW' | 'OPEN' | 'PARTIAL' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';
    time_in_force: 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';
    post_only: boolean;
    reduce_only: boolean;
    created_at: number;
    updated_at: number;
}
export declare const BackpackOrderSchema: z.ZodObject<{
    order_id: z.ZodString;
    client_order_id: z.ZodOptional<z.ZodString>;
    market: z.ZodString;
    side: z.ZodString;
    type: z.ZodString;
    size: z.ZodString;
    price: z.ZodOptional<z.ZodString>;
    filled_size: z.ZodString;
    avg_price: z.ZodOptional<z.ZodString>;
    status: z.ZodString;
    time_in_force: z.ZodOptional<z.ZodString>;
    post_only: z.ZodOptional<z.ZodBoolean>;
    reduce_only: z.ZodOptional<z.ZodBoolean>;
    created_at: z.ZodOptional<z.ZodNumber>;
    updated_at: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    order_id: z.ZodString;
    client_order_id: z.ZodOptional<z.ZodString>;
    market: z.ZodString;
    side: z.ZodString;
    type: z.ZodString;
    size: z.ZodString;
    price: z.ZodOptional<z.ZodString>;
    filled_size: z.ZodString;
    avg_price: z.ZodOptional<z.ZodString>;
    status: z.ZodString;
    time_in_force: z.ZodOptional<z.ZodString>;
    post_only: z.ZodOptional<z.ZodBoolean>;
    reduce_only: z.ZodOptional<z.ZodBoolean>;
    created_at: z.ZodOptional<z.ZodNumber>;
    updated_at: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    order_id: z.ZodString;
    client_order_id: z.ZodOptional<z.ZodString>;
    market: z.ZodString;
    side: z.ZodString;
    type: z.ZodString;
    size: z.ZodString;
    price: z.ZodOptional<z.ZodString>;
    filled_size: z.ZodString;
    avg_price: z.ZodOptional<z.ZodString>;
    status: z.ZodString;
    time_in_force: z.ZodOptional<z.ZodString>;
    post_only: z.ZodOptional<z.ZodBoolean>;
    reduce_only: z.ZodOptional<z.ZodBoolean>;
    created_at: z.ZodOptional<z.ZodNumber>;
    updated_at: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Backpack position response
 */
export interface BackpackPosition {
    market: string;
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
export declare const BackpackPositionSchema: z.ZodObject<{
    market: z.ZodString;
    side: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodString>;
    entry_price: z.ZodOptional<z.ZodString>;
    mark_price: z.ZodOptional<z.ZodString>;
    liquidation_price: z.ZodOptional<z.ZodString>;
    unrealized_pnl: z.ZodOptional<z.ZodString>;
    realized_pnl: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    leverage: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    market: z.ZodString;
    side: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodString>;
    entry_price: z.ZodOptional<z.ZodString>;
    mark_price: z.ZodOptional<z.ZodString>;
    liquidation_price: z.ZodOptional<z.ZodString>;
    unrealized_pnl: z.ZodOptional<z.ZodString>;
    realized_pnl: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    leverage: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    market: z.ZodString;
    side: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodString>;
    entry_price: z.ZodOptional<z.ZodString>;
    mark_price: z.ZodOptional<z.ZodString>;
    liquidation_price: z.ZodOptional<z.ZodString>;
    unrealized_pnl: z.ZodOptional<z.ZodString>;
    realized_pnl: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    leverage: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Backpack balance response
 */
export interface BackpackBalance {
    asset: string;
    total: string;
    available: string;
    locked: string;
}
export declare const BackpackBalanceSchema: z.ZodObject<{
    asset: z.ZodString;
    total: z.ZodString;
    available: z.ZodString;
    locked: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    asset: z.ZodString;
    total: z.ZodString;
    available: z.ZodString;
    locked: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    asset: z.ZodString;
    total: z.ZodString;
    available: z.ZodString;
    locked: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Backpack order book response (depth endpoint)
 */
export interface BackpackOrderBook {
    bids: [string, string][];
    asks: [string, string][];
    lastUpdateId?: string;
}
export declare const BackpackOrderBookSchema: z.ZodObject<{
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    lastUpdateId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    lastUpdateId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    lastUpdateId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Backpack trade response
 * API uses camelCase
 */
export interface BackpackTrade {
    id: number;
    price: string;
    quantity: string;
    quoteQuantity: string;
    timestamp: number;
    isBuyerMaker: boolean;
}
export declare const BackpackTradeSchema: z.ZodObject<{
    id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    price: z.ZodString;
    quantity: z.ZodString;
    quoteQuantity: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    isBuyerMaker: z.ZodBoolean;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    price: z.ZodString;
    quantity: z.ZodString;
    quoteQuantity: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    isBuyerMaker: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    price: z.ZodString;
    quantity: z.ZodString;
    quoteQuantity: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    isBuyerMaker: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Backpack ticker response
 * API returns camelCase fields
 */
export interface BackpackTicker {
    symbol: string;
    firstPrice: string;
    lastPrice: string;
    high: string;
    low: string;
    volume: string;
    quoteVolume: string;
    priceChange: string;
    priceChangePercent: string;
    trades: string;
}
export declare const BackpackTickerSchema: z.ZodObject<{
    symbol: z.ZodString;
    firstPrice: z.ZodOptional<z.ZodString>;
    lastPrice: z.ZodOptional<z.ZodString>;
    high: z.ZodOptional<z.ZodString>;
    low: z.ZodOptional<z.ZodString>;
    volume: z.ZodOptional<z.ZodString>;
    quoteVolume: z.ZodOptional<z.ZodString>;
    priceChange: z.ZodOptional<z.ZodString>;
    priceChangePercent: z.ZodOptional<z.ZodString>;
    trades: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    firstPrice: z.ZodOptional<z.ZodString>;
    lastPrice: z.ZodOptional<z.ZodString>;
    high: z.ZodOptional<z.ZodString>;
    low: z.ZodOptional<z.ZodString>;
    volume: z.ZodOptional<z.ZodString>;
    quoteVolume: z.ZodOptional<z.ZodString>;
    priceChange: z.ZodOptional<z.ZodString>;
    priceChangePercent: z.ZodOptional<z.ZodString>;
    trades: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    firstPrice: z.ZodOptional<z.ZodString>;
    lastPrice: z.ZodOptional<z.ZodString>;
    high: z.ZodOptional<z.ZodString>;
    low: z.ZodOptional<z.ZodString>;
    volume: z.ZodOptional<z.ZodString>;
    quoteVolume: z.ZodOptional<z.ZodString>;
    priceChange: z.ZodOptional<z.ZodString>;
    priceChangePercent: z.ZodOptional<z.ZodString>;
    trades: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Backpack funding rate response
 * API returns: { fundingRate, intervalEndTimestamp, symbol }
 */
export interface BackpackFundingRate {
    symbol: string;
    fundingRate: string;
    intervalEndTimestamp: string;
}
export declare const BackpackFundingRateSchema: z.ZodObject<{
    symbol: z.ZodString;
    fundingRate: z.ZodString;
    intervalEndTimestamp: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    fundingRate: z.ZodString;
    intervalEndTimestamp: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    fundingRate: z.ZodString;
    intervalEndTimestamp: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Backpack order sign payload
 */
export interface BackpackOrderSignPayload {
    market: string;
    side: 'Bid' | 'Ask';
    order_type: string;
    size: string;
    price: string;
    time_in_force: string;
    reduce_only: boolean;
    post_only: boolean;
    timestamp: number;
}
//# sourceMappingURL=types.d.ts.map
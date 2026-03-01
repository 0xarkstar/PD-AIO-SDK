/**
 * EdgeX-specific type definitions
 */
import { z } from 'zod';
/**
 * EdgeX adapter configuration
 *
 * EdgeX uses StarkEx L2 for order signing with Pedersen hash + ECDSA.
 * The starkPrivateKey is required for all authenticated operations.
 */
export interface EdgeXConfig {
    /** StarkEx L2 private key for Pedersen hash signing (required for trading) */
    starkPrivateKey?: string;
    /** Use testnet environment */
    testnet?: boolean;
}
/**
 * EdgeX market response
 */
export interface EdgeXMarket {
    market_id: string;
    symbol: string;
    base_asset: string;
    quote_asset: string;
    settlement_asset: string;
    status: string;
    min_order_size: string;
    max_order_size: string;
    tick_size: string;
    step_size: string;
    maker_fee: string;
    taker_fee: string;
    max_leverage: string;
    is_active: boolean;
}
export declare const EdgeXMarketSchema: z.ZodObject<{
    market_id: z.ZodString;
    symbol: z.ZodString;
    base_asset: z.ZodString;
    quote_asset: z.ZodString;
    settlement_asset: z.ZodString;
    status: z.ZodString;
    min_order_size: z.ZodString;
    max_order_size: z.ZodString;
    tick_size: z.ZodString;
    step_size: z.ZodString;
    maker_fee: z.ZodString;
    taker_fee: z.ZodString;
    max_leverage: z.ZodString;
    is_active: z.ZodBoolean;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    market_id: z.ZodString;
    symbol: z.ZodString;
    base_asset: z.ZodString;
    quote_asset: z.ZodString;
    settlement_asset: z.ZodString;
    status: z.ZodString;
    min_order_size: z.ZodString;
    max_order_size: z.ZodString;
    tick_size: z.ZodString;
    step_size: z.ZodString;
    maker_fee: z.ZodString;
    taker_fee: z.ZodString;
    max_leverage: z.ZodString;
    is_active: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    market_id: z.ZodString;
    symbol: z.ZodString;
    base_asset: z.ZodString;
    quote_asset: z.ZodString;
    settlement_asset: z.ZodString;
    status: z.ZodString;
    min_order_size: z.ZodString;
    max_order_size: z.ZodString;
    tick_size: z.ZodString;
    step_size: z.ZodString;
    maker_fee: z.ZodString;
    taker_fee: z.ZodString;
    max_leverage: z.ZodString;
    is_active: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">>;
/**
 * EdgeX order response
 */
export interface EdgeXOrder {
    order_id: string;
    client_order_id?: string;
    market: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    size: string;
    price?: string;
    filled_size: string;
    average_price?: string;
    status: 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';
    time_in_force: 'GTC' | 'IOC' | 'FOK';
    post_only: boolean;
    reduce_only: boolean;
    created_at: number;
    updated_at: number;
}
export declare const EdgeXOrderSchema: z.ZodObject<{
    order_id: z.ZodString;
    client_order_id: z.ZodOptional<z.ZodString>;
    market: z.ZodString;
    side: z.ZodString;
    type: z.ZodString;
    size: z.ZodString;
    price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    filled_size: z.ZodString;
    average_price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    status: z.ZodString;
    time_in_force: z.ZodString;
    post_only: z.ZodBoolean;
    reduce_only: z.ZodBoolean;
    created_at: z.ZodNumber;
    updated_at: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    order_id: z.ZodString;
    client_order_id: z.ZodOptional<z.ZodString>;
    market: z.ZodString;
    side: z.ZodString;
    type: z.ZodString;
    size: z.ZodString;
    price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    filled_size: z.ZodString;
    average_price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    status: z.ZodString;
    time_in_force: z.ZodString;
    post_only: z.ZodBoolean;
    reduce_only: z.ZodBoolean;
    created_at: z.ZodNumber;
    updated_at: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    order_id: z.ZodString;
    client_order_id: z.ZodOptional<z.ZodString>;
    market: z.ZodString;
    side: z.ZodString;
    type: z.ZodString;
    size: z.ZodString;
    price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    filled_size: z.ZodString;
    average_price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    status: z.ZodString;
    time_in_force: z.ZodString;
    post_only: z.ZodBoolean;
    reduce_only: z.ZodBoolean;
    created_at: z.ZodNumber;
    updated_at: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * EdgeX position response
 */
export interface EdgeXPosition {
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
export declare const EdgeXPositionSchema: z.ZodObject<{
    market: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    entry_price: z.ZodString;
    mark_price: z.ZodString;
    liquidation_price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    unrealized_pnl: z.ZodString;
    realized_pnl: z.ZodString;
    margin: z.ZodString;
    leverage: z.ZodString;
    timestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    market: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    entry_price: z.ZodString;
    mark_price: z.ZodString;
    liquidation_price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    unrealized_pnl: z.ZodString;
    realized_pnl: z.ZodString;
    margin: z.ZodString;
    leverage: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    market: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    entry_price: z.ZodString;
    mark_price: z.ZodString;
    liquidation_price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    unrealized_pnl: z.ZodString;
    realized_pnl: z.ZodString;
    margin: z.ZodString;
    leverage: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * EdgeX balance response
 */
export interface EdgeXBalance {
    asset: string;
    total: string;
    available: string;
    locked: string;
}
export declare const EdgeXBalanceSchema: z.ZodObject<{
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
 * EdgeX order book response
 */
export interface EdgeXOrderBook {
    market: string;
    bids: [string, string][];
    asks: [string, string][];
    timestamp: number;
}
export declare const EdgeXOrderBookSchema: z.ZodObject<{
    market: z.ZodString;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    timestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    market: z.ZodString;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    market: z.ZodString;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * EdgeX trade response
 */
export interface EdgeXTrade {
    trade_id: string;
    market: string;
    side: 'BUY' | 'SELL';
    price: string;
    size: string;
    timestamp: number;
}
export declare const EdgeXTradeSchema: z.ZodObject<{
    trade_id: z.ZodString;
    market: z.ZodString;
    side: z.ZodString;
    price: z.ZodString;
    size: z.ZodString;
    timestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    trade_id: z.ZodString;
    market: z.ZodString;
    side: z.ZodString;
    price: z.ZodString;
    size: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    trade_id: z.ZodString;
    market: z.ZodString;
    side: z.ZodString;
    price: z.ZodString;
    size: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * EdgeX ticker response
 */
export interface EdgeXTicker {
    market: string;
    last_price: string;
    bid: string;
    ask: string;
    high_24h: string;
    low_24h: string;
    volume_24h: string;
    price_change_24h: string;
    price_change_percent_24h: string;
    timestamp: number;
}
export declare const EdgeXTickerSchema: z.ZodObject<{
    market: z.ZodString;
    last_price: z.ZodString;
    bid: z.ZodString;
    ask: z.ZodString;
    high_24h: z.ZodString;
    low_24h: z.ZodString;
    volume_24h: z.ZodString;
    price_change_24h: z.ZodString;
    price_change_percent_24h: z.ZodString;
    timestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    market: z.ZodString;
    last_price: z.ZodString;
    bid: z.ZodString;
    ask: z.ZodString;
    high_24h: z.ZodString;
    low_24h: z.ZodString;
    volume_24h: z.ZodString;
    price_change_24h: z.ZodString;
    price_change_percent_24h: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    market: z.ZodString;
    last_price: z.ZodString;
    bid: z.ZodString;
    ask: z.ZodString;
    high_24h: z.ZodString;
    low_24h: z.ZodString;
    volume_24h: z.ZodString;
    price_change_24h: z.ZodString;
    price_change_percent_24h: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * EdgeX funding rate response
 */
export interface EdgeXFundingRate {
    market: string;
    rate: string;
    timestamp: number;
    next_funding_time: number;
    mark_price: string;
    index_price: string;
}
export declare const EdgeXFundingRateSchema: z.ZodObject<{
    market: z.ZodString;
    rate: z.ZodString;
    timestamp: z.ZodNumber;
    next_funding_time: z.ZodNumber;
    mark_price: z.ZodString;
    index_price: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    market: z.ZodString;
    rate: z.ZodString;
    timestamp: z.ZodNumber;
    next_funding_time: z.ZodNumber;
    mark_price: z.ZodString;
    index_price: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    market: z.ZodString;
    rate: z.ZodString;
    timestamp: z.ZodNumber;
    next_funding_time: z.ZodNumber;
    mark_price: z.ZodString;
    index_price: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
/**
 * EdgeX API contract response from /api/v1/public/contract/getContracts
 * New API format with contractName/contractId fields.
 */
export interface EdgeXAPIContract {
    contractId: string;
    contractName: string;
    enableTrade?: boolean;
    minOrderSize?: string;
    tickSize?: string;
    stepSize?: string;
    defaultMakerFeeRate?: string;
    defaultTakerFeeRate?: string;
    riskTierList?: Array<{
        maxLeverage?: string;
    }>;
}
export declare const EdgeXAPIContractSchema: z.ZodObject<{
    contractId: z.ZodString;
    contractName: z.ZodString;
    enableTrade: z.ZodOptional<z.ZodBoolean>;
    minOrderSize: z.ZodOptional<z.ZodString>;
    tickSize: z.ZodOptional<z.ZodString>;
    stepSize: z.ZodOptional<z.ZodString>;
    defaultMakerFeeRate: z.ZodOptional<z.ZodString>;
    defaultTakerFeeRate: z.ZodOptional<z.ZodString>;
    riskTierList: z.ZodOptional<z.ZodArray<z.ZodObject<{
        maxLeverage: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        maxLeverage: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        maxLeverage: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    contractId: z.ZodString;
    contractName: z.ZodString;
    enableTrade: z.ZodOptional<z.ZodBoolean>;
    minOrderSize: z.ZodOptional<z.ZodString>;
    tickSize: z.ZodOptional<z.ZodString>;
    stepSize: z.ZodOptional<z.ZodString>;
    defaultMakerFeeRate: z.ZodOptional<z.ZodString>;
    defaultTakerFeeRate: z.ZodOptional<z.ZodString>;
    riskTierList: z.ZodOptional<z.ZodArray<z.ZodObject<{
        maxLeverage: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        maxLeverage: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        maxLeverage: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    contractId: z.ZodString;
    contractName: z.ZodString;
    enableTrade: z.ZodOptional<z.ZodBoolean>;
    minOrderSize: z.ZodOptional<z.ZodString>;
    tickSize: z.ZodOptional<z.ZodString>;
    stepSize: z.ZodOptional<z.ZodString>;
    defaultMakerFeeRate: z.ZodOptional<z.ZodString>;
    defaultTakerFeeRate: z.ZodOptional<z.ZodString>;
    riskTierList: z.ZodOptional<z.ZodArray<z.ZodObject<{
        maxLeverage: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        maxLeverage: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        maxLeverage: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * EdgeX API depth response from /api/v1/public/quote/getDepth
 */
export interface EdgeXDepthData {
    bids: Array<{
        price: string;
        size: string;
    }>;
    asks: Array<{
        price: string;
        size: string;
    }>;
}
export declare const EdgeXDepthDataSchema: z.ZodObject<{
    bids: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    asks: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    bids: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    asks: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    bids: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    asks: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">>;
/**
 * EdgeX API ticker response from /api/v1/public/quote/getTicker
 */
export interface EdgeXAPITicker {
    contractName?: string;
    lastPrice?: string;
    close?: string;
    open?: string;
    high?: string;
    low?: string;
    priceChange?: string;
    priceChangePercent?: string;
    size?: string;
    volume?: string;
    value?: string;
    endTime?: string;
}
export declare const EdgeXAPITickerSchema: z.ZodObject<{
    contractName: z.ZodOptional<z.ZodString>;
    lastPrice: z.ZodOptional<z.ZodString>;
    close: z.ZodOptional<z.ZodString>;
    open: z.ZodOptional<z.ZodString>;
    high: z.ZodOptional<z.ZodString>;
    low: z.ZodOptional<z.ZodString>;
    priceChange: z.ZodOptional<z.ZodString>;
    priceChangePercent: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodString>;
    volume: z.ZodOptional<z.ZodString>;
    value: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    contractName: z.ZodOptional<z.ZodString>;
    lastPrice: z.ZodOptional<z.ZodString>;
    close: z.ZodOptional<z.ZodString>;
    open: z.ZodOptional<z.ZodString>;
    high: z.ZodOptional<z.ZodString>;
    low: z.ZodOptional<z.ZodString>;
    priceChange: z.ZodOptional<z.ZodString>;
    priceChangePercent: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodString>;
    volume: z.ZodOptional<z.ZodString>;
    value: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    contractName: z.ZodOptional<z.ZodString>;
    lastPrice: z.ZodOptional<z.ZodString>;
    close: z.ZodOptional<z.ZodString>;
    open: z.ZodOptional<z.ZodString>;
    high: z.ZodOptional<z.ZodString>;
    low: z.ZodOptional<z.ZodString>;
    priceChange: z.ZodOptional<z.ZodString>;
    priceChangePercent: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodString>;
    volume: z.ZodOptional<z.ZodString>;
    value: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * EdgeX API funding rate response from /api/v1/public/funding/getLatestFundingRate
 */
export interface EdgeXAPIFundingData {
    fundingRate?: string;
    fundingTime?: string;
    fundingTimestamp?: string;
    markPrice?: string;
    indexPrice?: string;
    nextFundingTime?: string;
}
export declare const EdgeXAPIFundingDataSchema: z.ZodObject<{
    fundingRate: z.ZodOptional<z.ZodString>;
    fundingTime: z.ZodOptional<z.ZodString>;
    fundingTimestamp: z.ZodOptional<z.ZodString>;
    markPrice: z.ZodOptional<z.ZodString>;
    indexPrice: z.ZodOptional<z.ZodString>;
    nextFundingTime: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    fundingRate: z.ZodOptional<z.ZodString>;
    fundingTime: z.ZodOptional<z.ZodString>;
    fundingTimestamp: z.ZodOptional<z.ZodString>;
    markPrice: z.ZodOptional<z.ZodString>;
    indexPrice: z.ZodOptional<z.ZodString>;
    nextFundingTime: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    fundingRate: z.ZodOptional<z.ZodString>;
    fundingTime: z.ZodOptional<z.ZodString>;
    fundingTimestamp: z.ZodOptional<z.ZodString>;
    markPrice: z.ZodOptional<z.ZodString>;
    indexPrice: z.ZodOptional<z.ZodString>;
    nextFundingTime: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * EdgeX order sign payload
 */
export interface EdgeXOrderSignPayload {
    market: string;
    side: 'BUY' | 'SELL';
    order_type: string;
    size: string;
    price: string;
    time_in_force: string;
    reduce_only: boolean;
    post_only: boolean;
    nonce: number;
    expiry: number;
}
//# sourceMappingURL=types.d.ts.map
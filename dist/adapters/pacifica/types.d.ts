/**
 * Pacifica Exchange-Specific Types
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
export interface PacificaMarket {
    symbol: string;
    base_currency: string;
    quote_currency: string;
    status: string;
    price_step: string;
    size_step: string;
    min_size: string;
    max_leverage: number;
    maker_fee: string;
    taker_fee: string;
    funding_interval: number;
}
export interface PacificaTicker {
    symbol: string;
    last_price: string;
    mark_price: string;
    index_price: string;
    bid_price: string;
    ask_price: string;
    high_24h: string;
    low_24h: string;
    volume_24h: string;
    quote_volume_24h: string;
    open_interest: string;
    funding_rate: string;
    next_funding_time: number;
    timestamp: number;
}
export interface PacificaOrderBookLevel {
    price: string;
    size: string;
}
export interface PacificaOrderBook {
    bids: PacificaOrderBookLevel[];
    asks: PacificaOrderBookLevel[];
    timestamp: number;
    sequence: number;
}
export interface PacificaTradeResponse {
    id: string;
    symbol: string;
    price: string;
    size: string;
    side: 'buy' | 'sell';
    timestamp: number;
}
export interface PacificaFundingHistory {
    symbol: string;
    funding_rate: string;
    mark_price: string;
    index_price: string;
    timestamp: number;
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
export declare const PacificaMarketSchema: z.ZodObject<{
    symbol: z.ZodString;
    base_currency: z.ZodString;
    quote_currency: z.ZodString;
    status: z.ZodString;
    price_step: z.ZodString;
    size_step: z.ZodString;
    min_size: z.ZodString;
    max_leverage: z.ZodNumber;
    maker_fee: z.ZodString;
    taker_fee: z.ZodString;
    funding_interval: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    base_currency: z.ZodString;
    quote_currency: z.ZodString;
    status: z.ZodString;
    price_step: z.ZodString;
    size_step: z.ZodString;
    min_size: z.ZodString;
    max_leverage: z.ZodNumber;
    maker_fee: z.ZodString;
    taker_fee: z.ZodString;
    funding_interval: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    base_currency: z.ZodString;
    quote_currency: z.ZodString;
    status: z.ZodString;
    price_step: z.ZodString;
    size_step: z.ZodString;
    min_size: z.ZodString;
    max_leverage: z.ZodNumber;
    maker_fee: z.ZodString;
    taker_fee: z.ZodString;
    funding_interval: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const PacificaTickerSchema: z.ZodObject<{
    symbol: z.ZodString;
    last_price: z.ZodString;
    mark_price: z.ZodString;
    index_price: z.ZodString;
    bid_price: z.ZodString;
    ask_price: z.ZodString;
    high_24h: z.ZodString;
    low_24h: z.ZodString;
    volume_24h: z.ZodString;
    quote_volume_24h: z.ZodString;
    open_interest: z.ZodString;
    funding_rate: z.ZodString;
    next_funding_time: z.ZodNumber;
    timestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    last_price: z.ZodString;
    mark_price: z.ZodString;
    index_price: z.ZodString;
    bid_price: z.ZodString;
    ask_price: z.ZodString;
    high_24h: z.ZodString;
    low_24h: z.ZodString;
    volume_24h: z.ZodString;
    quote_volume_24h: z.ZodString;
    open_interest: z.ZodString;
    funding_rate: z.ZodString;
    next_funding_time: z.ZodNumber;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    last_price: z.ZodString;
    mark_price: z.ZodString;
    index_price: z.ZodString;
    bid_price: z.ZodString;
    ask_price: z.ZodString;
    high_24h: z.ZodString;
    low_24h: z.ZodString;
    volume_24h: z.ZodString;
    quote_volume_24h: z.ZodString;
    open_interest: z.ZodString;
    funding_rate: z.ZodString;
    next_funding_time: z.ZodNumber;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const PacificaOrderBookLevelSchema: z.ZodObject<{
    price: z.ZodString;
    size: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    price: z.ZodString;
    size: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    price: z.ZodString;
    size: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const PacificaOrderBookSchema: z.ZodObject<{
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
    timestamp: z.ZodNumber;
    sequence: z.ZodNumber;
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
    timestamp: z.ZodNumber;
    sequence: z.ZodNumber;
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
    timestamp: z.ZodNumber;
    sequence: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const PacificaTradeResponseSchema: z.ZodObject<{
    id: z.ZodString;
    symbol: z.ZodString;
    price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    size: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    side: z.ZodString;
    timestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    symbol: z.ZodString;
    price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    size: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    side: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    symbol: z.ZodString;
    price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    size: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    side: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const PacificaFundingHistorySchema: z.ZodObject<{
    symbol: z.ZodString;
    funding_rate: z.ZodString;
    mark_price: z.ZodString;
    index_price: z.ZodString;
    timestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    funding_rate: z.ZodString;
    mark_price: z.ZodString;
    index_price: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    funding_rate: z.ZodString;
    mark_price: z.ZodString;
    index_price: z.ZodString;
    timestamp: z.ZodNumber;
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
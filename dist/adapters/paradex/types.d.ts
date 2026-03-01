/**
 * Paradex-specific type definitions
 */
import { z } from 'zod';
/**
 * Paradex adapter configuration
 */
export interface ParadexConfig {
    apiKey?: string;
    apiSecret?: string;
    privateKey?: string;
    starkPrivateKey?: string;
    testnet?: boolean;
    rateLimitTier?: 'default' | 'premium';
}
/**
 * Paradex authentication configuration (alias for compatibility)
 */
export type ParadexAuthConfig = ParadexConfig;
/**
 * Paradex market response
 */
export interface ParadexMarket {
    symbol: string;
    base_currency: string;
    quote_currency: string;
    settlement_currency: string;
    status: string;
    min_order_size: string;
    max_order_size: string;
    tick_size: string;
    step_size: string;
    maker_fee_rate: string;
    taker_fee_rate: string;
    max_leverage: string;
    is_active: boolean;
}
export declare const ParadexMarketSchema: z.ZodObject<{
    symbol: z.ZodString;
    base_currency: z.ZodString;
    quote_currency: z.ZodString;
    settlement_currency: z.ZodString;
    status: z.ZodString;
    min_order_size: z.ZodString;
    max_order_size: z.ZodString;
    tick_size: z.ZodString;
    step_size: z.ZodString;
    maker_fee_rate: z.ZodString;
    taker_fee_rate: z.ZodString;
    max_leverage: z.ZodString;
    is_active: z.ZodBoolean;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    base_currency: z.ZodString;
    quote_currency: z.ZodString;
    settlement_currency: z.ZodString;
    status: z.ZodString;
    min_order_size: z.ZodString;
    max_order_size: z.ZodString;
    tick_size: z.ZodString;
    step_size: z.ZodString;
    maker_fee_rate: z.ZodString;
    taker_fee_rate: z.ZodString;
    max_leverage: z.ZodString;
    is_active: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    base_currency: z.ZodString;
    quote_currency: z.ZodString;
    settlement_currency: z.ZodString;
    status: z.ZodString;
    min_order_size: z.ZodString;
    max_order_size: z.ZodString;
    tick_size: z.ZodString;
    step_size: z.ZodString;
    maker_fee_rate: z.ZodString;
    taker_fee_rate: z.ZodString;
    max_leverage: z.ZodString;
    is_active: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Paradex order response
 */
export interface ParadexOrder {
    id: string;
    client_id?: string;
    market: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT' | 'LIMIT_MAKER';
    size: string;
    price?: string;
    filled_size: string;
    avg_fill_price?: string;
    status: 'PENDING' | 'OPEN' | 'PARTIAL' | 'FILLED' | 'CANCELLED' | 'REJECTED';
    time_in_force: 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';
    post_only: boolean;
    reduce_only: boolean;
    created_at: number;
    updated_at: number;
}
export declare const ParadexOrderSchema: z.ZodObject<{
    id: z.ZodString;
    client_id: z.ZodOptional<z.ZodString>;
    market: z.ZodString;
    side: z.ZodString;
    type: z.ZodString;
    size: z.ZodString;
    price: z.ZodOptional<z.ZodString>;
    filled_size: z.ZodString;
    avg_fill_price: z.ZodOptional<z.ZodString>;
    status: z.ZodString;
    time_in_force: z.ZodString;
    post_only: z.ZodBoolean;
    reduce_only: z.ZodBoolean;
    created_at: z.ZodNumber;
    updated_at: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    client_id: z.ZodOptional<z.ZodString>;
    market: z.ZodString;
    side: z.ZodString;
    type: z.ZodString;
    size: z.ZodString;
    price: z.ZodOptional<z.ZodString>;
    filled_size: z.ZodString;
    avg_fill_price: z.ZodOptional<z.ZodString>;
    status: z.ZodString;
    time_in_force: z.ZodString;
    post_only: z.ZodBoolean;
    reduce_only: z.ZodBoolean;
    created_at: z.ZodNumber;
    updated_at: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    client_id: z.ZodOptional<z.ZodString>;
    market: z.ZodString;
    side: z.ZodString;
    type: z.ZodString;
    size: z.ZodString;
    price: z.ZodOptional<z.ZodString>;
    filled_size: z.ZodString;
    avg_fill_price: z.ZodOptional<z.ZodString>;
    status: z.ZodString;
    time_in_force: z.ZodString;
    post_only: z.ZodBoolean;
    reduce_only: z.ZodBoolean;
    created_at: z.ZodNumber;
    updated_at: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Paradex position response
 */
export interface ParadexPosition {
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
    last_updated: number;
}
export declare const ParadexPositionSchema: z.ZodObject<{
    market: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    entry_price: z.ZodString;
    mark_price: z.ZodString;
    liquidation_price: z.ZodOptional<z.ZodString>;
    unrealized_pnl: z.ZodString;
    realized_pnl: z.ZodString;
    margin: z.ZodString;
    leverage: z.ZodString;
    last_updated: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    market: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    entry_price: z.ZodString;
    mark_price: z.ZodString;
    liquidation_price: z.ZodOptional<z.ZodString>;
    unrealized_pnl: z.ZodString;
    realized_pnl: z.ZodString;
    margin: z.ZodString;
    leverage: z.ZodString;
    last_updated: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    market: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    entry_price: z.ZodString;
    mark_price: z.ZodString;
    liquidation_price: z.ZodOptional<z.ZodString>;
    unrealized_pnl: z.ZodString;
    realized_pnl: z.ZodString;
    margin: z.ZodString;
    leverage: z.ZodString;
    last_updated: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Paradex balance response
 */
export interface ParadexBalance {
    asset: string;
    total: string;
    available: string;
    locked: string;
}
export declare const ParadexBalanceSchema: z.ZodObject<{
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
 * Paradex order book response
 */
export interface ParadexOrderBook {
    market: string;
    bids: [string, string][];
    asks: [string, string][];
    timestamp: number;
    sequence: number;
}
export declare const ParadexOrderBookSchema: z.ZodObject<{
    market: z.ZodString;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    timestamp: z.ZodNumber;
    sequence: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    market: z.ZodString;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    timestamp: z.ZodNumber;
    sequence: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    market: z.ZodString;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    timestamp: z.ZodNumber;
    sequence: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Paradex trade response
 */
export interface ParadexTrade {
    id: string;
    market: string;
    side: 'BUY' | 'SELL';
    price: string;
    size: string;
    timestamp: number;
}
export declare const ParadexTradeSchema: z.ZodObject<{
    id: z.ZodString;
    market: z.ZodString;
    side: z.ZodString;
    price: z.ZodString;
    size: z.ZodString;
    timestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    market: z.ZodString;
    side: z.ZodString;
    price: z.ZodString;
    size: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    market: z.ZodString;
    side: z.ZodString;
    price: z.ZodString;
    size: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Paradex ticker response
 */
export interface ParadexTicker {
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
export declare const ParadexTickerSchema: z.ZodObject<{
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
 * Paradex funding rate response
 */
export interface ParadexFundingRate {
    market: string;
    rate: string;
    timestamp: number;
    next_funding_time: number;
    mark_price: string;
    index_price: string;
}
export declare const ParadexFundingRateSchema: z.ZodObject<{
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
 * Paradex API market response (actual API format)
 * Extends the legacy ParadexMarket with additional fields from the real API.
 */
export interface ParadexAPIMarket {
    symbol: string;
    base_currency: string;
    quote_currency: string;
    settlement_currency: string;
    status?: string;
    is_active?: boolean;
    open_at?: number;
    price_tick_size?: string;
    order_size_increment?: string;
    min_notional?: string;
    funding_period_hours?: number;
    fee_config?: {
        api_fee?: {
            maker_fee?: {
                fee?: string;
            };
            taker_fee?: {
                fee?: string;
            };
        };
    };
    delta1_cross_margin_params?: {
        imf_base?: string;
    };
    tick_size?: string;
    step_size?: string;
    min_order_size?: string;
    max_order_size?: string;
    maker_fee_rate?: string;
    taker_fee_rate?: string;
    max_leverage?: string;
}
export declare const ParadexAPIMarketSchema: z.ZodObject<{
    symbol: z.ZodString;
    base_currency: z.ZodString;
    quote_currency: z.ZodString;
    settlement_currency: z.ZodString;
    status: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    open_at: z.ZodOptional<z.ZodNumber>;
    price_tick_size: z.ZodOptional<z.ZodString>;
    order_size_increment: z.ZodOptional<z.ZodString>;
    min_notional: z.ZodOptional<z.ZodString>;
    funding_period_hours: z.ZodOptional<z.ZodNumber>;
    fee_config: z.ZodOptional<z.ZodObject<{
        api_fee: z.ZodOptional<z.ZodObject<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        api_fee: z.ZodOptional<z.ZodObject<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        api_fee: z.ZodOptional<z.ZodObject<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">>>;
    delta1_cross_margin_params: z.ZodOptional<z.ZodObject<{
        imf_base: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        imf_base: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        imf_base: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    tick_size: z.ZodOptional<z.ZodString>;
    step_size: z.ZodOptional<z.ZodString>;
    min_order_size: z.ZodOptional<z.ZodString>;
    max_order_size: z.ZodOptional<z.ZodString>;
    maker_fee_rate: z.ZodOptional<z.ZodString>;
    taker_fee_rate: z.ZodOptional<z.ZodString>;
    max_leverage: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    base_currency: z.ZodString;
    quote_currency: z.ZodString;
    settlement_currency: z.ZodString;
    status: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    open_at: z.ZodOptional<z.ZodNumber>;
    price_tick_size: z.ZodOptional<z.ZodString>;
    order_size_increment: z.ZodOptional<z.ZodString>;
    min_notional: z.ZodOptional<z.ZodString>;
    funding_period_hours: z.ZodOptional<z.ZodNumber>;
    fee_config: z.ZodOptional<z.ZodObject<{
        api_fee: z.ZodOptional<z.ZodObject<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        api_fee: z.ZodOptional<z.ZodObject<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        api_fee: z.ZodOptional<z.ZodObject<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">>>;
    delta1_cross_margin_params: z.ZodOptional<z.ZodObject<{
        imf_base: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        imf_base: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        imf_base: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    tick_size: z.ZodOptional<z.ZodString>;
    step_size: z.ZodOptional<z.ZodString>;
    min_order_size: z.ZodOptional<z.ZodString>;
    max_order_size: z.ZodOptional<z.ZodString>;
    maker_fee_rate: z.ZodOptional<z.ZodString>;
    taker_fee_rate: z.ZodOptional<z.ZodString>;
    max_leverage: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    base_currency: z.ZodString;
    quote_currency: z.ZodString;
    settlement_currency: z.ZodString;
    status: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    open_at: z.ZodOptional<z.ZodNumber>;
    price_tick_size: z.ZodOptional<z.ZodString>;
    order_size_increment: z.ZodOptional<z.ZodString>;
    min_notional: z.ZodOptional<z.ZodString>;
    funding_period_hours: z.ZodOptional<z.ZodNumber>;
    fee_config: z.ZodOptional<z.ZodObject<{
        api_fee: z.ZodOptional<z.ZodObject<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        api_fee: z.ZodOptional<z.ZodObject<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        api_fee: z.ZodOptional<z.ZodObject<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            maker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            taker_fee: z.ZodOptional<z.ZodObject<{
                fee: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                fee: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">>>;
    delta1_cross_margin_params: z.ZodOptional<z.ZodObject<{
        imf_base: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        imf_base: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        imf_base: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    tick_size: z.ZodOptional<z.ZodString>;
    step_size: z.ZodOptional<z.ZodString>;
    min_order_size: z.ZodOptional<z.ZodString>;
    max_order_size: z.ZodOptional<z.ZodString>;
    maker_fee_rate: z.ZodOptional<z.ZodString>;
    taker_fee_rate: z.ZodOptional<z.ZodString>;
    max_leverage: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Paradex JWT token response
 */
export interface ParadexJWT {
    access_token: string;
    token_type: string;
    expires_in: number;
}
/**
 * Paradex order sign payload
 */
export interface ParadexOrderSignPayload {
    market: string;
    side: 'BUY' | 'SELL';
    order_type: string;
    size: string;
    price: string;
    time_in_force: string;
    reduce_only: boolean;
    post_only: boolean;
    client_id?: string;
    expiry: number;
}
//# sourceMappingURL=types.d.ts.map
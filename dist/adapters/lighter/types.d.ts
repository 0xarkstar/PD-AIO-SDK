/**
 * Lighter-specific type definitions
 */
import { z } from 'zod';
/**
 * Lighter API configuration
 *
 * Supports two authentication modes:
 * 1. HMAC mode (legacy): Uses apiKey + apiSecret for HMAC-SHA256 signing
 * 2. WASM mode (recommended): Uses apiPrivateKey for WASM-based signing
 *
 * WASM mode is required for full trading functionality as it supports
 * the transaction signing required by the Lighter protocol.
 * Install @oraichain/lighter-ts-sdk for WASM signing support.
 */
export interface LighterConfig {
    /** API key for HMAC authentication (legacy mode) */
    apiKey?: string;
    /** API secret for HMAC authentication (legacy mode) */
    apiSecret?: string;
    /** API private key (hex string) for WASM signing */
    apiPrivateKey?: string;
    /** API public key (hex string, optional - derived from private if not provided) */
    apiPublicKey?: string;
    /** Account index for trading (default: 0) */
    accountIndex?: number;
    /** API key index (default: 255 for main key) */
    apiKeyIndex?: number;
    /** Use testnet (default: false) */
    testnet?: boolean;
    /** Chain ID override (300 = testnet, 304 = mainnet) */
    chainId?: number;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Rate limit tier */
    rateLimitTier?: 'tier1' | 'tier2' | 'tier3';
}
export interface LighterMarket {
    symbol: string;
    baseCurrency: string;
    quoteCurrency: string;
    active: boolean;
    minOrderSize: number;
    maxOrderSize: number;
    tickSize: number;
    stepSize: number;
    makerFee: number;
    takerFee: number;
    maxLeverage: number;
}
export interface LighterOrder {
    orderId: string;
    clientOrderId?: string;
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    price?: number;
    size: number;
    filledSize: number;
    status: 'open' | 'filled' | 'cancelled' | 'partially_filled';
    timestamp: number;
    reduceOnly: boolean;
}
export declare const LighterOrderSchema: z.ZodObject<{
    orderId: z.ZodString;
    clientOrderId: z.ZodOptional<z.ZodString>;
    symbol: z.ZodString;
    side: z.ZodEnum<["buy", "sell"]>;
    type: z.ZodEnum<["market", "limit"]>;
    price: z.ZodOptional<z.ZodNumber>;
    size: z.ZodNumber;
    filledSize: z.ZodNumber;
    status: z.ZodEnum<["open", "filled", "cancelled", "partially_filled"]>;
    timestamp: z.ZodNumber;
    reduceOnly: z.ZodBoolean;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    orderId: z.ZodString;
    clientOrderId: z.ZodOptional<z.ZodString>;
    symbol: z.ZodString;
    side: z.ZodEnum<["buy", "sell"]>;
    type: z.ZodEnum<["market", "limit"]>;
    price: z.ZodOptional<z.ZodNumber>;
    size: z.ZodNumber;
    filledSize: z.ZodNumber;
    status: z.ZodEnum<["open", "filled", "cancelled", "partially_filled"]>;
    timestamp: z.ZodNumber;
    reduceOnly: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    orderId: z.ZodString;
    clientOrderId: z.ZodOptional<z.ZodString>;
    symbol: z.ZodString;
    side: z.ZodEnum<["buy", "sell"]>;
    type: z.ZodEnum<["market", "limit"]>;
    price: z.ZodOptional<z.ZodNumber>;
    size: z.ZodNumber;
    filledSize: z.ZodNumber;
    status: z.ZodEnum<["open", "filled", "cancelled", "partially_filled"]>;
    timestamp: z.ZodNumber;
    reduceOnly: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">>;
export interface LighterPosition {
    symbol: string;
    side: 'long' | 'short';
    size: number;
    entryPrice: number;
    markPrice: number;
    liquidationPrice: number;
    unrealizedPnl: number;
    margin: number;
    leverage: number;
}
export declare const LighterPositionSchema: z.ZodObject<{
    symbol: z.ZodString;
    side: z.ZodEnum<["long", "short"]>;
    size: z.ZodNumber;
    entryPrice: z.ZodNumber;
    markPrice: z.ZodNumber;
    liquidationPrice: z.ZodNumber;
    unrealizedPnl: z.ZodNumber;
    margin: z.ZodNumber;
    leverage: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    side: z.ZodEnum<["long", "short"]>;
    size: z.ZodNumber;
    entryPrice: z.ZodNumber;
    markPrice: z.ZodNumber;
    liquidationPrice: z.ZodNumber;
    unrealizedPnl: z.ZodNumber;
    margin: z.ZodNumber;
    leverage: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    side: z.ZodEnum<["long", "short"]>;
    size: z.ZodNumber;
    entryPrice: z.ZodNumber;
    markPrice: z.ZodNumber;
    liquidationPrice: z.ZodNumber;
    unrealizedPnl: z.ZodNumber;
    margin: z.ZodNumber;
    leverage: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface LighterBalance {
    currency: string;
    total: number;
    available: number;
    reserved: number;
}
export declare const LighterBalanceSchema: z.ZodObject<{
    currency: z.ZodString;
    total: z.ZodNumber;
    available: z.ZodNumber;
    reserved: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    currency: z.ZodString;
    total: z.ZodNumber;
    available: z.ZodNumber;
    reserved: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    currency: z.ZodString;
    total: z.ZodNumber;
    available: z.ZodNumber;
    reserved: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface LighterOrderBook {
    symbol: string;
    bids: Array<[number, number]>;
    asks: Array<[number, number]>;
    timestamp: number;
}
export interface LighterTrade {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    price: number;
    amount: number;
    timestamp: number;
}
export interface LighterTicker {
    symbol: string;
    last: number;
    bid: number;
    ask: number;
    high: number;
    low: number;
    volume: number;
    timestamp: number;
}
export interface LighterFundingRate {
    symbol: string;
    fundingRate: number;
    markPrice: number;
    nextFundingTime: number;
}
export declare const LighterFundingRateSchema: z.ZodObject<{
    symbol: z.ZodString;
    fundingRate: z.ZodNumber;
    markPrice: z.ZodNumber;
    nextFundingTime: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    fundingRate: z.ZodNumber;
    markPrice: z.ZodNumber;
    nextFundingTime: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    fundingRate: z.ZodNumber;
    markPrice: z.ZodNumber;
    nextFundingTime: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Lighter API market response from /api/v1/orderBookDetails
 * This represents the actual API response format (snake_case string values),
 * distinct from the normalized LighterMarket interface above.
 */
export interface LighterAPIMarket {
    symbol: string;
    market_type?: string;
    status?: string;
    supported_price_decimals?: string | number;
    price_decimals?: string | number;
    supported_size_decimals?: string | number;
    size_decimals?: string | number;
    min_base_amount?: string;
    maker_fee?: string;
    taker_fee?: string;
    max_leverage?: string;
    default_initial_margin_fraction?: number;
    is_active?: boolean;
}
export declare const LighterAPIMarketSchema: z.ZodObject<{
    symbol: z.ZodString;
    market_type: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    supported_price_decimals: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    price_decimals: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    supported_size_decimals: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    size_decimals: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    min_base_amount: z.ZodOptional<z.ZodString>;
    maker_fee: z.ZodOptional<z.ZodString>;
    taker_fee: z.ZodOptional<z.ZodString>;
    max_leverage: z.ZodOptional<z.ZodString>;
    default_initial_margin_fraction: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    market_type: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    supported_price_decimals: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    price_decimals: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    supported_size_decimals: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    size_decimals: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    min_base_amount: z.ZodOptional<z.ZodString>;
    maker_fee: z.ZodOptional<z.ZodString>;
    taker_fee: z.ZodOptional<z.ZodString>;
    max_leverage: z.ZodOptional<z.ZodString>;
    default_initial_margin_fraction: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    market_type: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    supported_price_decimals: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    price_decimals: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    supported_size_decimals: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    size_decimals: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    min_base_amount: z.ZodOptional<z.ZodString>;
    maker_fee: z.ZodOptional<z.ZodString>;
    taker_fee: z.ZodOptional<z.ZodString>;
    max_leverage: z.ZodOptional<z.ZodString>;
    default_initial_margin_fraction: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Lighter API ticker response from /api/v1/orderBookDetails
 * Real API returns ticker data alongside order book details.
 */
export interface LighterAPITicker {
    symbol: string;
    last_trade_price?: string;
    daily_price_high?: string;
    daily_price_low?: string;
    daily_base_token_volume?: string;
    daily_quote_token_volume?: string;
    daily_price_change?: string;
}
export declare const LighterAPITickerSchema: z.ZodObject<{
    symbol: z.ZodString;
    last_trade_price: z.ZodOptional<z.ZodString>;
    daily_price_high: z.ZodOptional<z.ZodString>;
    daily_price_low: z.ZodOptional<z.ZodString>;
    daily_base_token_volume: z.ZodOptional<z.ZodString>;
    daily_quote_token_volume: z.ZodOptional<z.ZodString>;
    daily_price_change: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    last_trade_price: z.ZodOptional<z.ZodString>;
    daily_price_high: z.ZodOptional<z.ZodString>;
    daily_price_low: z.ZodOptional<z.ZodString>;
    daily_base_token_volume: z.ZodOptional<z.ZodString>;
    daily_quote_token_volume: z.ZodOptional<z.ZodString>;
    daily_price_change: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    last_trade_price: z.ZodOptional<z.ZodString>;
    daily_price_high: z.ZodOptional<z.ZodString>;
    daily_price_low: z.ZodOptional<z.ZodString>;
    daily_base_token_volume: z.ZodOptional<z.ZodString>;
    daily_quote_token_volume: z.ZodOptional<z.ZodString>;
    daily_price_change: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
//# sourceMappingURL=types.d.ts.map
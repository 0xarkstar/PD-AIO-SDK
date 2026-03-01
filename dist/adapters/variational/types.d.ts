/**
 * Variational Exchange Types
 *
 * TypeScript types and Zod schemas for Variational API responses
 */
import { z } from 'zod';
/**
 * Variational /metadata/stats API response types
 */
export interface VariationalQuoteData {
    bid: string;
    ask: string;
}
export interface VariationalQuotes {
    updated_at: string;
    size_1k: VariationalQuoteData;
    size_100k: VariationalQuoteData;
    size_1m?: VariationalQuoteData;
}
export interface VariationalOpenInterest {
    long_open_interest: string;
    short_open_interest: string;
}
export interface VariationalListing {
    ticker: string;
    name: string;
    mark_price: string;
    volume_24h: string;
    open_interest: VariationalOpenInterest;
    funding_rate: string;
    funding_interval_s: number;
    base_spread_bps: string;
    quotes: VariationalQuotes;
}
export interface VariationalLossRefund {
    pool_size: string;
    refunded_24h: string;
}
export interface VariationalMetadataStats {
    total_volume_24h: string;
    cumulative_volume: string;
    tvl: string;
    open_interest: string;
    num_markets: number;
    loss_refund: VariationalLossRefund;
    listings: VariationalListing[];
}
/**
 * Variational market data type (normalized)
 */
export interface VariationalMarket {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    status: 'active' | 'inactive' | 'delisted';
    minOrderSize: string;
    maxOrderSize?: string;
    tickSize: string;
    contractSize?: string;
    maxLeverage?: string;
    fundingInterval?: number;
    settlementTime?: number;
}
/**
 * Variational ticker data type
 */
export interface VariationalTicker {
    symbol: string;
    lastPrice: string;
    bidPrice: string;
    askPrice: string;
    volume24h: string;
    high24h: string;
    low24h: string;
    priceChange24h: string;
    priceChangePercent24h: string;
    timestamp: number;
}
/**
 * Variational order book data type
 */
export interface VariationalOrderBook {
    symbol: string;
    bids: [string, string][];
    asks: [string, string][];
    timestamp: number;
    sequence?: number;
}
/**
 * Variational trade data type
 */
export interface VariationalTrade {
    id: string;
    symbol: string;
    price: string;
    amount: string;
    side: 'buy' | 'sell';
    timestamp: number;
    isMaker?: boolean;
}
/**
 * Variational funding rate data type
 */
export interface VariationalFundingRate {
    symbol: string;
    fundingRate: string;
    fundingTime: number;
    nextFundingTime?: number;
    indexPrice?: string;
    markPrice?: string;
}
/**
 * Variational RFQ quote data type
 */
export interface VariationalQuote {
    quoteId: string;
    symbol: string;
    side: 'buy' | 'sell';
    price: string;
    amount: string;
    expiresAt: number;
    marketMaker: string;
    spread?: string;
    timestamp: number;
}
/**
 * Variational order data type
 */
export interface VariationalOrder {
    orderId: string;
    clientOrderId?: string;
    symbol: string;
    type: 'market' | 'limit' | 'rfq';
    side: 'buy' | 'sell';
    status: 'pending' | 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected' | 'expired';
    price?: string;
    amount: string;
    filledAmount?: string;
    remainingAmount?: string;
    averagePrice?: string;
    timestamp: number;
    updateTime?: number;
    postOnly?: boolean;
    reduceOnly?: boolean;
    quoteId?: string;
    fees?: {
        asset: string;
        amount: string;
    };
}
/**
 * Variational position data type
 */
export interface VariationalPosition {
    symbol: string;
    side: 'long' | 'short';
    size: string;
    entryPrice: string;
    markPrice: string;
    liquidationPrice?: string;
    margin: string;
    leverage: string;
    unrealizedPnl: string;
    realizedPnl?: string;
    timestamp: number;
}
/**
 * Variational balance data type
 */
export interface VariationalBalance {
    asset: string;
    free: string;
    locked: string;
    total: string;
    availableMargin?: string;
    usedMargin?: string;
    timestamp?: number;
}
/**
 * Variational order request type
 */
export interface VariationalOrderRequest {
    symbol: string;
    type: 'market' | 'limit' | 'rfq';
    side: 'buy' | 'sell';
    amount: string;
    price?: string;
    clientOrderId?: string;
    postOnly?: boolean;
    reduceOnly?: boolean;
    quoteId?: string;
}
/**
 * Variational quote request type
 */
export interface VariationalQuoteRequest {
    symbol: string;
    side: 'buy' | 'sell';
    amount: string;
    maxSlippage?: string;
}
/**
 * Variational user fees type
 */
export interface VariationalUserFees {
    maker: string;
    taker: string;
    tierLevel?: string;
    volume30d?: string;
}
/**
 * Variational portfolio type
 */
export interface VariationalPortfolio {
    totalEquity: string;
    availableBalance: string;
    usedMargin: string;
    unrealizedPnl: string;
    realizedPnl: string;
    dailyPnl: string;
    timestamp: number;
}
export declare const VariationalMarketSchema: z.ZodObject<{
    symbol: z.ZodString;
    baseAsset: z.ZodString;
    quoteAsset: z.ZodString;
    status: z.ZodString;
    minOrderSize: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    maxOrderSize: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    tickSize: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    contractSize: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    maxLeverage: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    fundingInterval: z.ZodOptional<z.ZodNumber>;
    settlementTime: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    baseAsset: z.ZodString;
    quoteAsset: z.ZodString;
    status: z.ZodString;
    minOrderSize: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    maxOrderSize: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    tickSize: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    contractSize: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    maxLeverage: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    fundingInterval: z.ZodOptional<z.ZodNumber>;
    settlementTime: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    baseAsset: z.ZodString;
    quoteAsset: z.ZodString;
    status: z.ZodString;
    minOrderSize: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    maxOrderSize: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    tickSize: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    contractSize: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    maxLeverage: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    fundingInterval: z.ZodOptional<z.ZodNumber>;
    settlementTime: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export declare const VariationalTickerSchema: z.ZodObject<{
    symbol: z.ZodString;
    lastPrice: z.ZodString;
    bidPrice: z.ZodString;
    askPrice: z.ZodString;
    volume24h: z.ZodString;
    high24h: z.ZodString;
    low24h: z.ZodString;
    priceChange24h: z.ZodString;
    priceChangePercent24h: z.ZodString;
    timestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    lastPrice: z.ZodString;
    bidPrice: z.ZodString;
    askPrice: z.ZodString;
    volume24h: z.ZodString;
    high24h: z.ZodString;
    low24h: z.ZodString;
    priceChange24h: z.ZodString;
    priceChangePercent24h: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    lastPrice: z.ZodString;
    bidPrice: z.ZodString;
    askPrice: z.ZodString;
    volume24h: z.ZodString;
    high24h: z.ZodString;
    low24h: z.ZodString;
    priceChange24h: z.ZodString;
    priceChangePercent24h: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const VariationalOrderBookSchema: z.ZodObject<{
    symbol: z.ZodString;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    timestamp: z.ZodNumber;
    sequence: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    timestamp: z.ZodNumber;
    sequence: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    timestamp: z.ZodNumber;
    sequence: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export declare const VariationalTradeSchema: z.ZodObject<{
    id: z.ZodString;
    symbol: z.ZodString;
    price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    amount: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    side: z.ZodString;
    timestamp: z.ZodNumber;
    isMaker: z.ZodOptional<z.ZodBoolean>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    symbol: z.ZodString;
    price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    amount: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    side: z.ZodString;
    timestamp: z.ZodNumber;
    isMaker: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    symbol: z.ZodString;
    price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    amount: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    side: z.ZodString;
    timestamp: z.ZodNumber;
    isMaker: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">>;
export declare const VariationalQuoteSchema: z.ZodObject<{
    quoteId: z.ZodString;
    symbol: z.ZodString;
    side: z.ZodString;
    price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    amount: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    expiresAt: z.ZodNumber;
    marketMaker: z.ZodString;
    spread: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    timestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    quoteId: z.ZodString;
    symbol: z.ZodString;
    side: z.ZodString;
    price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    amount: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    expiresAt: z.ZodNumber;
    marketMaker: z.ZodString;
    spread: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    quoteId: z.ZodString;
    symbol: z.ZodString;
    side: z.ZodString;
    price: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    amount: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    expiresAt: z.ZodNumber;
    marketMaker: z.ZodString;
    spread: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const VariationalOrderSchema: z.ZodObject<{
    orderId: z.ZodString;
    clientOrderId: z.ZodOptional<z.ZodString>;
    symbol: z.ZodString;
    type: z.ZodString;
    side: z.ZodString;
    status: z.ZodString;
    price: z.ZodOptional<z.ZodString>;
    amount: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    filledAmount: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    remainingAmount: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    averagePrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    timestamp: z.ZodNumber;
    updateTime: z.ZodOptional<z.ZodNumber>;
    postOnly: z.ZodOptional<z.ZodBoolean>;
    reduceOnly: z.ZodOptional<z.ZodBoolean>;
    quoteId: z.ZodOptional<z.ZodString>;
    fees: z.ZodOptional<z.ZodObject<{
        asset: z.ZodString;
        amount: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        asset: z.ZodString;
        amount: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        asset: z.ZodString;
        amount: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    orderId: z.ZodString;
    clientOrderId: z.ZodOptional<z.ZodString>;
    symbol: z.ZodString;
    type: z.ZodString;
    side: z.ZodString;
    status: z.ZodString;
    price: z.ZodOptional<z.ZodString>;
    amount: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    filledAmount: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    remainingAmount: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    averagePrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    timestamp: z.ZodNumber;
    updateTime: z.ZodOptional<z.ZodNumber>;
    postOnly: z.ZodOptional<z.ZodBoolean>;
    reduceOnly: z.ZodOptional<z.ZodBoolean>;
    quoteId: z.ZodOptional<z.ZodString>;
    fees: z.ZodOptional<z.ZodObject<{
        asset: z.ZodString;
        amount: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        asset: z.ZodString;
        amount: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        asset: z.ZodString;
        amount: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    orderId: z.ZodString;
    clientOrderId: z.ZodOptional<z.ZodString>;
    symbol: z.ZodString;
    type: z.ZodString;
    side: z.ZodString;
    status: z.ZodString;
    price: z.ZodOptional<z.ZodString>;
    amount: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    filledAmount: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    remainingAmount: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    averagePrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    timestamp: z.ZodNumber;
    updateTime: z.ZodOptional<z.ZodNumber>;
    postOnly: z.ZodOptional<z.ZodBoolean>;
    reduceOnly: z.ZodOptional<z.ZodBoolean>;
    quoteId: z.ZodOptional<z.ZodString>;
    fees: z.ZodOptional<z.ZodObject<{
        asset: z.ZodString;
        amount: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        asset: z.ZodString;
        amount: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        asset: z.ZodString;
        amount: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const VariationalPositionSchema: z.ZodObject<{
    symbol: z.ZodString;
    side: z.ZodString;
    size: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    entryPrice: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    markPrice: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    liquidationPrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    margin: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    leverage: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    unrealizedPnl: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    realizedPnl: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    timestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    side: z.ZodString;
    size: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    entryPrice: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    markPrice: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    liquidationPrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    margin: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    leverage: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    unrealizedPnl: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    realizedPnl: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    side: z.ZodString;
    size: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    entryPrice: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    markPrice: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    liquidationPrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    margin: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    leverage: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    unrealizedPnl: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    realizedPnl: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const VariationalBalanceSchema: z.ZodObject<{
    asset: z.ZodString;
    free: z.ZodString;
    locked: z.ZodString;
    total: z.ZodString;
    availableMargin: z.ZodOptional<z.ZodString>;
    usedMargin: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    asset: z.ZodString;
    free: z.ZodString;
    locked: z.ZodString;
    total: z.ZodString;
    availableMargin: z.ZodOptional<z.ZodString>;
    usedMargin: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    asset: z.ZodString;
    free: z.ZodString;
    locked: z.ZodString;
    total: z.ZodString;
    availableMargin: z.ZodOptional<z.ZodString>;
    usedMargin: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export declare const VariationalFundingRateSchema: z.ZodObject<{
    symbol: z.ZodString;
    fundingRate: z.ZodString;
    fundingTime: z.ZodNumber;
    nextFundingTime: z.ZodOptional<z.ZodNumber>;
    indexPrice: z.ZodOptional<z.ZodString>;
    markPrice: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    fundingRate: z.ZodString;
    fundingTime: z.ZodNumber;
    nextFundingTime: z.ZodOptional<z.ZodNumber>;
    indexPrice: z.ZodOptional<z.ZodString>;
    markPrice: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    fundingRate: z.ZodString;
    fundingTime: z.ZodNumber;
    nextFundingTime: z.ZodOptional<z.ZodNumber>;
    indexPrice: z.ZodOptional<z.ZodString>;
    markPrice: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const VariationalQuoteDataSchema: z.ZodObject<{
    bid: z.ZodString;
    ask: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    bid: z.ZodString;
    ask: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    bid: z.ZodString;
    ask: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const VariationalQuotesSchema: z.ZodObject<{
    updated_at: z.ZodString;
    size_1k: z.ZodObject<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    size_100k: z.ZodObject<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    size_1m: z.ZodOptional<z.ZodObject<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    updated_at: z.ZodString;
    size_1k: z.ZodObject<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    size_100k: z.ZodObject<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    size_1m: z.ZodOptional<z.ZodObject<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    updated_at: z.ZodString;
    size_1k: z.ZodObject<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    size_100k: z.ZodObject<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    size_1m: z.ZodOptional<z.ZodObject<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        bid: z.ZodString;
        ask: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const VariationalOpenInterestSchema: z.ZodObject<{
    long_open_interest: z.ZodString;
    short_open_interest: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    long_open_interest: z.ZodString;
    short_open_interest: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    long_open_interest: z.ZodString;
    short_open_interest: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const VariationalListingSchema: z.ZodObject<{
    ticker: z.ZodString;
    name: z.ZodString;
    mark_price: z.ZodString;
    volume_24h: z.ZodString;
    open_interest: z.ZodObject<{
        long_open_interest: z.ZodString;
        short_open_interest: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        long_open_interest: z.ZodString;
        short_open_interest: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        long_open_interest: z.ZodString;
        short_open_interest: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    funding_rate: z.ZodString;
    funding_interval_s: z.ZodNumber;
    base_spread_bps: z.ZodString;
    quotes: z.ZodObject<{
        updated_at: z.ZodString;
        size_1k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_100k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_1m: z.ZodOptional<z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        updated_at: z.ZodString;
        size_1k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_100k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_1m: z.ZodOptional<z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        updated_at: z.ZodString;
        size_1k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_100k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_1m: z.ZodOptional<z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    ticker: z.ZodString;
    name: z.ZodString;
    mark_price: z.ZodString;
    volume_24h: z.ZodString;
    open_interest: z.ZodObject<{
        long_open_interest: z.ZodString;
        short_open_interest: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        long_open_interest: z.ZodString;
        short_open_interest: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        long_open_interest: z.ZodString;
        short_open_interest: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    funding_rate: z.ZodString;
    funding_interval_s: z.ZodNumber;
    base_spread_bps: z.ZodString;
    quotes: z.ZodObject<{
        updated_at: z.ZodString;
        size_1k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_100k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_1m: z.ZodOptional<z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        updated_at: z.ZodString;
        size_1k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_100k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_1m: z.ZodOptional<z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        updated_at: z.ZodString;
        size_1k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_100k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_1m: z.ZodOptional<z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    ticker: z.ZodString;
    name: z.ZodString;
    mark_price: z.ZodString;
    volume_24h: z.ZodString;
    open_interest: z.ZodObject<{
        long_open_interest: z.ZodString;
        short_open_interest: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        long_open_interest: z.ZodString;
        short_open_interest: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        long_open_interest: z.ZodString;
        short_open_interest: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    funding_rate: z.ZodString;
    funding_interval_s: z.ZodNumber;
    base_spread_bps: z.ZodString;
    quotes: z.ZodObject<{
        updated_at: z.ZodString;
        size_1k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_100k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_1m: z.ZodOptional<z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        updated_at: z.ZodString;
        size_1k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_100k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_1m: z.ZodOptional<z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        updated_at: z.ZodString;
        size_1k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_100k: z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        size_1m: z.ZodOptional<z.ZodObject<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            bid: z.ZodString;
            ask: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">>;
}, z.ZodTypeAny, "passthrough">>;
export declare const VariationalLossRefundSchema: z.ZodObject<{
    pool_size: z.ZodString;
    refunded_24h: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    pool_size: z.ZodString;
    refunded_24h: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    pool_size: z.ZodString;
    refunded_24h: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const VariationalMetadataStatsSchema: z.ZodObject<{
    total_volume_24h: z.ZodString;
    cumulative_volume: z.ZodString;
    tvl: z.ZodString;
    open_interest: z.ZodString;
    num_markets: z.ZodNumber;
    loss_refund: z.ZodObject<{
        pool_size: z.ZodString;
        refunded_24h: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        pool_size: z.ZodString;
        refunded_24h: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        pool_size: z.ZodString;
        refunded_24h: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    listings: z.ZodArray<z.ZodObject<{
        ticker: z.ZodString;
        name: z.ZodString;
        mark_price: z.ZodString;
        volume_24h: z.ZodString;
        open_interest: z.ZodObject<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        funding_rate: z.ZodString;
        funding_interval_s: z.ZodNumber;
        base_spread_bps: z.ZodString;
        quotes: z.ZodObject<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        ticker: z.ZodString;
        name: z.ZodString;
        mark_price: z.ZodString;
        volume_24h: z.ZodString;
        open_interest: z.ZodObject<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        funding_rate: z.ZodString;
        funding_interval_s: z.ZodNumber;
        base_spread_bps: z.ZodString;
        quotes: z.ZodObject<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        ticker: z.ZodString;
        name: z.ZodString;
        mark_price: z.ZodString;
        volume_24h: z.ZodString;
        open_interest: z.ZodObject<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        funding_rate: z.ZodString;
        funding_interval_s: z.ZodNumber;
        base_spread_bps: z.ZodString;
        quotes: z.ZodObject<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    total_volume_24h: z.ZodString;
    cumulative_volume: z.ZodString;
    tvl: z.ZodString;
    open_interest: z.ZodString;
    num_markets: z.ZodNumber;
    loss_refund: z.ZodObject<{
        pool_size: z.ZodString;
        refunded_24h: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        pool_size: z.ZodString;
        refunded_24h: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        pool_size: z.ZodString;
        refunded_24h: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    listings: z.ZodArray<z.ZodObject<{
        ticker: z.ZodString;
        name: z.ZodString;
        mark_price: z.ZodString;
        volume_24h: z.ZodString;
        open_interest: z.ZodObject<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        funding_rate: z.ZodString;
        funding_interval_s: z.ZodNumber;
        base_spread_bps: z.ZodString;
        quotes: z.ZodObject<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        ticker: z.ZodString;
        name: z.ZodString;
        mark_price: z.ZodString;
        volume_24h: z.ZodString;
        open_interest: z.ZodObject<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        funding_rate: z.ZodString;
        funding_interval_s: z.ZodNumber;
        base_spread_bps: z.ZodString;
        quotes: z.ZodObject<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        ticker: z.ZodString;
        name: z.ZodString;
        mark_price: z.ZodString;
        volume_24h: z.ZodString;
        open_interest: z.ZodObject<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        funding_rate: z.ZodString;
        funding_interval_s: z.ZodNumber;
        base_spread_bps: z.ZodString;
        quotes: z.ZodObject<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    total_volume_24h: z.ZodString;
    cumulative_volume: z.ZodString;
    tvl: z.ZodString;
    open_interest: z.ZodString;
    num_markets: z.ZodNumber;
    loss_refund: z.ZodObject<{
        pool_size: z.ZodString;
        refunded_24h: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        pool_size: z.ZodString;
        refunded_24h: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        pool_size: z.ZodString;
        refunded_24h: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    listings: z.ZodArray<z.ZodObject<{
        ticker: z.ZodString;
        name: z.ZodString;
        mark_price: z.ZodString;
        volume_24h: z.ZodString;
        open_interest: z.ZodObject<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        funding_rate: z.ZodString;
        funding_interval_s: z.ZodNumber;
        base_spread_bps: z.ZodString;
        quotes: z.ZodObject<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        ticker: z.ZodString;
        name: z.ZodString;
        mark_price: z.ZodString;
        volume_24h: z.ZodString;
        open_interest: z.ZodObject<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        funding_rate: z.ZodString;
        funding_interval_s: z.ZodNumber;
        base_spread_bps: z.ZodString;
        quotes: z.ZodObject<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        ticker: z.ZodString;
        name: z.ZodString;
        mark_price: z.ZodString;
        volume_24h: z.ZodString;
        open_interest: z.ZodObject<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            long_open_interest: z.ZodString;
            short_open_interest: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        funding_rate: z.ZodString;
        funding_interval_s: z.ZodNumber;
        base_spread_bps: z.ZodString;
        quotes: z.ZodObject<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            updated_at: z.ZodString;
            size_1k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_100k: z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
            size_1m: z.ZodOptional<z.ZodObject<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                bid: z.ZodString;
                ask: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">>;
//# sourceMappingURL=types.d.ts.map
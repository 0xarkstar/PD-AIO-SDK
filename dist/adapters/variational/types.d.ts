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
    status: z.ZodEnum<["active", "inactive", "delisted"]>;
    minOrderSize: z.ZodString;
    maxOrderSize: z.ZodOptional<z.ZodString>;
    tickSize: z.ZodString;
    contractSize: z.ZodOptional<z.ZodString>;
    maxLeverage: z.ZodOptional<z.ZodString>;
    fundingInterval: z.ZodOptional<z.ZodNumber>;
    settlementTime: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    status: "active" | "inactive" | "delisted";
    baseAsset: string;
    quoteAsset: string;
    minOrderSize: string;
    tickSize: string;
    maxOrderSize?: string | undefined;
    contractSize?: string | undefined;
    maxLeverage?: string | undefined;
    fundingInterval?: number | undefined;
    settlementTime?: number | undefined;
}, {
    symbol: string;
    status: "active" | "inactive" | "delisted";
    baseAsset: string;
    quoteAsset: string;
    minOrderSize: string;
    tickSize: string;
    maxOrderSize?: string | undefined;
    contractSize?: string | undefined;
    maxLeverage?: string | undefined;
    fundingInterval?: number | undefined;
    settlementTime?: number | undefined;
}>;
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
}, "strip", z.ZodTypeAny, {
    symbol: string;
    timestamp: number;
    lastPrice: string;
    bidPrice: string;
    askPrice: string;
    volume24h: string;
    high24h: string;
    low24h: string;
    priceChange24h: string;
    priceChangePercent24h: string;
}, {
    symbol: string;
    timestamp: number;
    lastPrice: string;
    bidPrice: string;
    askPrice: string;
    volume24h: string;
    high24h: string;
    low24h: string;
    priceChange24h: string;
    priceChangePercent24h: string;
}>;
export declare const VariationalOrderBookSchema: z.ZodObject<{
    symbol: z.ZodString;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    timestamp: z.ZodNumber;
    sequence: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    timestamp: number;
    bids: [string, string][];
    asks: [string, string][];
    sequence?: number | undefined;
}, {
    symbol: string;
    timestamp: number;
    bids: [string, string][];
    asks: [string, string][];
    sequence?: number | undefined;
}>;
export declare const VariationalTradeSchema: z.ZodObject<{
    id: z.ZodString;
    symbol: z.ZodString;
    price: z.ZodString;
    amount: z.ZodString;
    side: z.ZodEnum<["buy", "sell"]>;
    timestamp: z.ZodNumber;
    isMaker: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    side: "buy" | "sell";
    timestamp: number;
    id: string;
    amount: string;
    price: string;
    isMaker?: boolean | undefined;
}, {
    symbol: string;
    side: "buy" | "sell";
    timestamp: number;
    id: string;
    amount: string;
    price: string;
    isMaker?: boolean | undefined;
}>;
export declare const VariationalQuoteSchema: z.ZodObject<{
    quoteId: z.ZodString;
    symbol: z.ZodString;
    side: z.ZodEnum<["buy", "sell"]>;
    price: z.ZodString;
    amount: z.ZodString;
    expiresAt: z.ZodNumber;
    marketMaker: z.ZodString;
    spread: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    side: "buy" | "sell";
    expiresAt: number;
    timestamp: number;
    amount: string;
    price: string;
    quoteId: string;
    marketMaker: string;
    spread?: string | undefined;
}, {
    symbol: string;
    side: "buy" | "sell";
    expiresAt: number;
    timestamp: number;
    amount: string;
    price: string;
    quoteId: string;
    marketMaker: string;
    spread?: string | undefined;
}>;
export declare const VariationalOrderSchema: z.ZodObject<{
    orderId: z.ZodString;
    clientOrderId: z.ZodOptional<z.ZodString>;
    symbol: z.ZodString;
    type: z.ZodEnum<["market", "limit", "rfq"]>;
    side: z.ZodEnum<["buy", "sell"]>;
    status: z.ZodEnum<["pending", "open", "filled", "partially_filled", "cancelled", "rejected", "expired"]>;
    price: z.ZodOptional<z.ZodString>;
    amount: z.ZodString;
    filledAmount: z.ZodOptional<z.ZodString>;
    remainingAmount: z.ZodOptional<z.ZodString>;
    averagePrice: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodNumber;
    updateTime: z.ZodOptional<z.ZodNumber>;
    postOnly: z.ZodOptional<z.ZodBoolean>;
    reduceOnly: z.ZodOptional<z.ZodBoolean>;
    quoteId: z.ZodOptional<z.ZodString>;
    fees: z.ZodOptional<z.ZodObject<{
        asset: z.ZodString;
        amount: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount: string;
        asset: string;
    }, {
        amount: string;
        asset: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    status: "open" | "expired" | "rejected" | "filled" | "pending" | "cancelled" | "partially_filled";
    type: "market" | "limit" | "rfq";
    side: "buy" | "sell";
    orderId: string;
    timestamp: number;
    amount: string;
    price?: string | undefined;
    clientOrderId?: string | undefined;
    averagePrice?: string | undefined;
    reduceOnly?: boolean | undefined;
    postOnly?: boolean | undefined;
    quoteId?: string | undefined;
    filledAmount?: string | undefined;
    remainingAmount?: string | undefined;
    updateTime?: number | undefined;
    fees?: {
        amount: string;
        asset: string;
    } | undefined;
}, {
    symbol: string;
    status: "open" | "expired" | "rejected" | "filled" | "pending" | "cancelled" | "partially_filled";
    type: "market" | "limit" | "rfq";
    side: "buy" | "sell";
    orderId: string;
    timestamp: number;
    amount: string;
    price?: string | undefined;
    clientOrderId?: string | undefined;
    averagePrice?: string | undefined;
    reduceOnly?: boolean | undefined;
    postOnly?: boolean | undefined;
    quoteId?: string | undefined;
    filledAmount?: string | undefined;
    remainingAmount?: string | undefined;
    updateTime?: number | undefined;
    fees?: {
        amount: string;
        asset: string;
    } | undefined;
}>;
export declare const VariationalPositionSchema: z.ZodObject<{
    symbol: z.ZodString;
    side: z.ZodEnum<["long", "short"]>;
    size: z.ZodString;
    entryPrice: z.ZodString;
    markPrice: z.ZodString;
    liquidationPrice: z.ZodOptional<z.ZodString>;
    margin: z.ZodString;
    leverage: z.ZodString;
    unrealizedPnl: z.ZodString;
    realizedPnl: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    margin: string;
    side: "long" | "short";
    timestamp: number;
    markPrice: string;
    size: string;
    leverage: string;
    unrealizedPnl: string;
    entryPrice: string;
    realizedPnl?: string | undefined;
    liquidationPrice?: string | undefined;
}, {
    symbol: string;
    margin: string;
    side: "long" | "short";
    timestamp: number;
    markPrice: string;
    size: string;
    leverage: string;
    unrealizedPnl: string;
    entryPrice: string;
    realizedPnl?: string | undefined;
    liquidationPrice?: string | undefined;
}>;
export declare const VariationalBalanceSchema: z.ZodObject<{
    asset: z.ZodString;
    free: z.ZodString;
    locked: z.ZodString;
    total: z.ZodString;
    availableMargin: z.ZodOptional<z.ZodString>;
    usedMargin: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    total: string;
    locked: string;
    asset: string;
    free: string;
    timestamp?: number | undefined;
    availableMargin?: string | undefined;
    usedMargin?: string | undefined;
}, {
    total: string;
    locked: string;
    asset: string;
    free: string;
    timestamp?: number | undefined;
    availableMargin?: string | undefined;
    usedMargin?: string | undefined;
}>;
//# sourceMappingURL=types.d.ts.map
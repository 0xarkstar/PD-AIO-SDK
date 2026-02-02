/**
 * Zod Validation Schemas
 *
 * Runtime validation for all external data
 */
import { z } from 'zod';
export declare const OrderTypeSchema: z.ZodEnum<["market", "limit", "stopMarket", "stopLimit"]>;
export declare const OrderSideSchema: z.ZodEnum<["buy", "sell"]>;
export declare const OrderStatusSchema: z.ZodEnum<["open", "closed", "canceled", "expired", "rejected", "filled", "partiallyFilled"]>;
export declare const TimeInForceSchema: z.ZodEnum<["GTC", "IOC", "FOK", "PO"]>;
export declare const OrderRequestSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    symbol: z.ZodString;
    type: z.ZodEnum<["market", "limit", "stopMarket", "stopLimit"]>;
    side: z.ZodEnum<["buy", "sell"]>;
    amount: z.ZodNumber;
    price: z.ZodOptional<z.ZodNumber>;
    stopPrice: z.ZodOptional<z.ZodNumber>;
    timeInForce: z.ZodOptional<z.ZodEnum<["GTC", "IOC", "FOK", "PO"]>>;
    reduceOnly: z.ZodDefault<z.ZodBoolean>;
    postOnly: z.ZodDefault<z.ZodBoolean>;
    clientOrderId: z.ZodOptional<z.ZodString>;
    leverage: z.ZodOptional<z.ZodNumber>;
    params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    type: "market" | "limit" | "stopMarket" | "stopLimit";
    side: "buy" | "sell";
    amount: number;
    reduceOnly: boolean;
    postOnly: boolean;
    params?: Record<string, unknown> | undefined;
    price?: number | undefined;
    clientOrderId?: string | undefined;
    stopPrice?: number | undefined;
    timeInForce?: "GTC" | "IOC" | "FOK" | "PO" | undefined;
    leverage?: number | undefined;
}, {
    symbol: string;
    type: "market" | "limit" | "stopMarket" | "stopLimit";
    side: "buy" | "sell";
    amount: number;
    params?: Record<string, unknown> | undefined;
    price?: number | undefined;
    clientOrderId?: string | undefined;
    stopPrice?: number | undefined;
    timeInForce?: "GTC" | "IOC" | "FOK" | "PO" | undefined;
    reduceOnly?: boolean | undefined;
    postOnly?: boolean | undefined;
    leverage?: number | undefined;
}>, {
    symbol: string;
    type: "market" | "limit" | "stopMarket" | "stopLimit";
    side: "buy" | "sell";
    amount: number;
    reduceOnly: boolean;
    postOnly: boolean;
    params?: Record<string, unknown> | undefined;
    price?: number | undefined;
    clientOrderId?: string | undefined;
    stopPrice?: number | undefined;
    timeInForce?: "GTC" | "IOC" | "FOK" | "PO" | undefined;
    leverage?: number | undefined;
}, {
    symbol: string;
    type: "market" | "limit" | "stopMarket" | "stopLimit";
    side: "buy" | "sell";
    amount: number;
    params?: Record<string, unknown> | undefined;
    price?: number | undefined;
    clientOrderId?: string | undefined;
    stopPrice?: number | undefined;
    timeInForce?: "GTC" | "IOC" | "FOK" | "PO" | undefined;
    reduceOnly?: boolean | undefined;
    postOnly?: boolean | undefined;
    leverage?: number | undefined;
}>, {
    symbol: string;
    type: "market" | "limit" | "stopMarket" | "stopLimit";
    side: "buy" | "sell";
    amount: number;
    reduceOnly: boolean;
    postOnly: boolean;
    params?: Record<string, unknown> | undefined;
    price?: number | undefined;
    clientOrderId?: string | undefined;
    stopPrice?: number | undefined;
    timeInForce?: "GTC" | "IOC" | "FOK" | "PO" | undefined;
    leverage?: number | undefined;
}, {
    symbol: string;
    type: "market" | "limit" | "stopMarket" | "stopLimit";
    side: "buy" | "sell";
    amount: number;
    params?: Record<string, unknown> | undefined;
    price?: number | undefined;
    clientOrderId?: string | undefined;
    stopPrice?: number | undefined;
    timeInForce?: "GTC" | "IOC" | "FOK" | "PO" | undefined;
    reduceOnly?: boolean | undefined;
    postOnly?: boolean | undefined;
    leverage?: number | undefined;
}>;
export declare const OrderSchema: z.ZodObject<{
    id: z.ZodString;
    symbol: z.ZodString;
    type: z.ZodEnum<["market", "limit", "stopMarket", "stopLimit"]>;
    side: z.ZodEnum<["buy", "sell"]>;
    amount: z.ZodNumber;
    price: z.ZodOptional<z.ZodNumber>;
    stopPrice: z.ZodOptional<z.ZodNumber>;
    status: z.ZodEnum<["open", "closed", "canceled", "expired", "rejected", "filled", "partiallyFilled"]>;
    filled: z.ZodNumber;
    remaining: z.ZodNumber;
    averagePrice: z.ZodOptional<z.ZodNumber>;
    timeInForce: z.ZodOptional<z.ZodEnum<["GTC", "IOC", "FOK", "PO"]>>;
    reduceOnly: z.ZodBoolean;
    postOnly: z.ZodBoolean;
    clientOrderId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodNumber;
    lastUpdateTimestamp: z.ZodOptional<z.ZodNumber>;
    info: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    filled: number;
    status: "open" | "closed" | "canceled" | "expired" | "rejected" | "filled" | "partiallyFilled";
    type: "market" | "limit" | "stopMarket" | "stopLimit";
    side: "buy" | "sell";
    timestamp: number;
    id: string;
    amount: number;
    remaining: number;
    reduceOnly: boolean;
    postOnly: boolean;
    info?: Record<string, unknown> | undefined;
    price?: number | undefined;
    clientOrderId?: string | undefined;
    stopPrice?: number | undefined;
    averagePrice?: number | undefined;
    timeInForce?: "GTC" | "IOC" | "FOK" | "PO" | undefined;
    lastUpdateTimestamp?: number | undefined;
}, {
    symbol: string;
    filled: number;
    status: "open" | "closed" | "canceled" | "expired" | "rejected" | "filled" | "partiallyFilled";
    type: "market" | "limit" | "stopMarket" | "stopLimit";
    side: "buy" | "sell";
    timestamp: number;
    id: string;
    amount: number;
    remaining: number;
    reduceOnly: boolean;
    postOnly: boolean;
    info?: Record<string, unknown> | undefined;
    price?: number | undefined;
    clientOrderId?: string | undefined;
    stopPrice?: number | undefined;
    averagePrice?: number | undefined;
    timeInForce?: "GTC" | "IOC" | "FOK" | "PO" | undefined;
    lastUpdateTimestamp?: number | undefined;
}>;
export declare const PositionSideSchema: z.ZodEnum<["long", "short"]>;
export declare const MarginModeSchema: z.ZodEnum<["cross", "isolated"]>;
export declare const PositionSchema: z.ZodObject<{
    symbol: z.ZodString;
    side: z.ZodEnum<["long", "short"]>;
    size: z.ZodNumber;
    entryPrice: z.ZodNumber;
    markPrice: z.ZodNumber;
    liquidationPrice: z.ZodNumber;
    unrealizedPnl: z.ZodNumber;
    realizedPnl: z.ZodNumber;
    leverage: z.ZodNumber;
    marginMode: z.ZodEnum<["cross", "isolated"]>;
    margin: z.ZodNumber;
    maintenanceMargin: z.ZodNumber;
    marginRatio: z.ZodNumber;
    timestamp: z.ZodNumber;
    info: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    side: "long" | "short";
    timestamp: number;
    markPrice: number;
    margin: number;
    size: number;
    leverage: number;
    unrealizedPnl: number;
    realizedPnl: number;
    marginMode: "cross" | "isolated";
    entryPrice: number;
    liquidationPrice: number;
    maintenanceMargin: number;
    marginRatio: number;
    info?: Record<string, unknown> | undefined;
}, {
    symbol: string;
    side: "long" | "short";
    timestamp: number;
    markPrice: number;
    margin: number;
    size: number;
    leverage: number;
    unrealizedPnl: number;
    realizedPnl: number;
    marginMode: "cross" | "isolated";
    entryPrice: number;
    liquidationPrice: number;
    maintenanceMargin: number;
    marginRatio: number;
    info?: Record<string, unknown> | undefined;
}>;
export declare const MarketSchema: z.ZodObject<{
    id: z.ZodString;
    symbol: z.ZodString;
    base: z.ZodString;
    quote: z.ZodString;
    settle: z.ZodString;
    active: z.ZodBoolean;
    minAmount: z.ZodNumber;
    maxAmount: z.ZodOptional<z.ZodNumber>;
    minCost: z.ZodOptional<z.ZodNumber>;
    pricePrecision: z.ZodNumber;
    amountPrecision: z.ZodNumber;
    priceTickSize: z.ZodNumber;
    amountStepSize: z.ZodNumber;
    makerFee: z.ZodNumber;
    takerFee: z.ZodNumber;
    maxLeverage: z.ZodNumber;
    fundingIntervalHours: z.ZodNumber;
    contractSize: z.ZodOptional<z.ZodNumber>;
    info: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    active: boolean;
    base: string;
    quote: string;
    settle: string;
    fundingIntervalHours: number;
    id: string;
    maxLeverage: number;
    pricePrecision: number;
    minAmount: number;
    amountPrecision: number;
    priceTickSize: number;
    amountStepSize: number;
    makerFee: number;
    takerFee: number;
    info?: Record<string, unknown> | undefined;
    contractSize?: number | undefined;
    maxAmount?: number | undefined;
    minCost?: number | undefined;
}, {
    symbol: string;
    active: boolean;
    base: string;
    quote: string;
    settle: string;
    fundingIntervalHours: number;
    id: string;
    maxLeverage: number;
    pricePrecision: number;
    minAmount: number;
    amountPrecision: number;
    priceTickSize: number;
    amountStepSize: number;
    makerFee: number;
    takerFee: number;
    info?: Record<string, unknown> | undefined;
    contractSize?: number | undefined;
    maxAmount?: number | undefined;
    minCost?: number | undefined;
}>;
export declare const PriceLevelSchema: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
export declare const OrderBookSchema: z.ZodObject<{
    symbol: z.ZodString;
    timestamp: z.ZodNumber;
    bids: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
    sequenceId: z.ZodOptional<z.ZodNumber>;
    checksum: z.ZodOptional<z.ZodString>;
    exchange: z.ZodString;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    exchange: string;
    timestamp: number;
    bids: [number, number][];
    asks: [number, number][];
    checksum?: string | undefined;
    sequenceId?: number | undefined;
}, {
    symbol: string;
    exchange: string;
    timestamp: number;
    bids: [number, number][];
    asks: [number, number][];
    checksum?: string | undefined;
    sequenceId?: number | undefined;
}>;
export declare const TradeSchema: z.ZodObject<{
    id: z.ZodString;
    symbol: z.ZodString;
    orderId: z.ZodOptional<z.ZodString>;
    side: z.ZodEnum<["buy", "sell"]>;
    price: z.ZodNumber;
    amount: z.ZodNumber;
    cost: z.ZodNumber;
    timestamp: z.ZodNumber;
    info: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    side: "buy" | "sell";
    timestamp: number;
    id: string;
    amount: number;
    price: number;
    cost: number;
    info?: Record<string, unknown> | undefined;
    orderId?: string | undefined;
}, {
    symbol: string;
    side: "buy" | "sell";
    timestamp: number;
    id: string;
    amount: number;
    price: number;
    cost: number;
    info?: Record<string, unknown> | undefined;
    orderId?: string | undefined;
}>;
export declare const FundingRateSchema: z.ZodObject<{
    symbol: z.ZodString;
    fundingRate: z.ZodNumber;
    fundingTimestamp: z.ZodNumber;
    nextFundingTimestamp: z.ZodNumber;
    markPrice: z.ZodNumber;
    indexPrice: z.ZodNumber;
    fundingIntervalHours: z.ZodNumber;
    info: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    fundingTimestamp: number;
    markPrice: number;
    indexPrice: number;
    fundingIntervalHours: number;
    fundingRate: number;
    nextFundingTimestamp: number;
    info?: Record<string, unknown> | undefined;
}, {
    symbol: string;
    fundingTimestamp: number;
    markPrice: number;
    indexPrice: number;
    fundingIntervalHours: number;
    fundingRate: number;
    nextFundingTimestamp: number;
    info?: Record<string, unknown> | undefined;
}>;
export declare const BalanceSchema: z.ZodObject<{
    currency: z.ZodString;
    total: z.ZodNumber;
    free: z.ZodNumber;
    used: z.ZodNumber;
    usdValue: z.ZodOptional<z.ZodNumber>;
    info: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    total: number;
    currency: string;
    free: number;
    used: number;
    info?: Record<string, unknown> | undefined;
    usdValue?: number | undefined;
}, {
    total: number;
    currency: string;
    free: number;
    used: number;
    info?: Record<string, unknown> | undefined;
    usdValue?: number | undefined;
}>;
export declare const TickerSchema: z.ZodObject<{
    symbol: z.ZodString;
    last: z.ZodNumber;
    bid: z.ZodNumber;
    bidVolume: z.ZodOptional<z.ZodNumber>;
    ask: z.ZodNumber;
    askVolume: z.ZodOptional<z.ZodNumber>;
    high: z.ZodNumber;
    low: z.ZodNumber;
    open: z.ZodNumber;
    close: z.ZodNumber;
    change: z.ZodNumber;
    percentage: z.ZodNumber;
    baseVolume: z.ZodNumber;
    quoteVolume: z.ZodNumber;
    timestamp: z.ZodNumber;
    info: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    open: number;
    close: number;
    timestamp: number;
    high: number;
    low: number;
    percentage: number;
    last: number;
    bid: number;
    ask: number;
    baseVolume: number;
    quoteVolume: number;
    change: number;
    info?: Record<string, unknown> | undefined;
    bidVolume?: number | undefined;
    askVolume?: number | undefined;
}, {
    symbol: string;
    open: number;
    close: number;
    timestamp: number;
    high: number;
    low: number;
    percentage: number;
    last: number;
    bid: number;
    ask: number;
    baseVolume: number;
    quoteVolume: number;
    change: number;
    info?: Record<string, unknown> | undefined;
    bidVolume?: number | undefined;
    askVolume?: number | undefined;
}>;
export declare const OHLCVTimeframeSchema: z.ZodEnum<["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M"]>;
/**
 * OHLCV tuple: [timestamp, open, high, low, close, volume]
 */
export declare const OHLCVSchema: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
export declare const OHLCVParamsSchema: z.ZodOptional<z.ZodObject<{
    limit: z.ZodOptional<z.ZodNumber>;
    since: z.ZodOptional<z.ZodNumber>;
    until: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
    since?: number | undefined;
    until?: number | undefined;
}, {
    limit?: number | undefined;
    since?: number | undefined;
    until?: number | undefined;
}>>;
export declare const MarketParamsSchema: z.ZodOptional<z.ZodObject<{
    active: z.ZodOptional<z.ZodBoolean>;
    ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    active?: boolean | undefined;
    ids?: string[] | undefined;
}, {
    active?: boolean | undefined;
    ids?: string[] | undefined;
}>>;
export declare const OrderBookParamsSchema: z.ZodOptional<z.ZodObject<{
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
}, {
    limit?: number | undefined;
}>>;
export declare const TradeParamsSchema: z.ZodOptional<z.ZodObject<{
    limit: z.ZodOptional<z.ZodNumber>;
    since: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
    since?: number | undefined;
}, {
    limit?: number | undefined;
    since?: number | undefined;
}>>;
export type OrderRequest = z.infer<typeof OrderRequestSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type Market = z.infer<typeof MarketSchema>;
export type OrderBook = z.infer<typeof OrderBookSchema>;
export type Trade = z.infer<typeof TradeSchema>;
export type FundingRate = z.infer<typeof FundingRateSchema>;
export type Balance = z.infer<typeof BalanceSchema>;
export type Ticker = z.infer<typeof TickerSchema>;
export type MarketParams = z.infer<typeof MarketParamsSchema>;
export type OrderBookParams = z.infer<typeof OrderBookParamsSchema>;
export type TradeParams = z.infer<typeof TradeParamsSchema>;
export type OHLCV = z.infer<typeof OHLCVSchema>;
export type OHLCVTimeframe = z.infer<typeof OHLCVTimeframeSchema>;
export type OHLCVParams = z.infer<typeof OHLCVParamsSchema>;
/**
 * Safely parse and validate data with detailed error messages
 */
export declare function validateData<T>(schema: z.ZodType<T>, data: unknown, context?: string): T | never;
/**
 * Validate array of items
 */
export declare function validateArray<T>(schema: z.ZodType<T>, data: unknown[], context?: string): T[] | never;
//# sourceMappingURL=schemas.d.ts.map
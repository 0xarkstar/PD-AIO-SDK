/**
 * Extended Exchange Types
 *
 * TypeScript types and Zod schemas for Extended API responses
 */
import { z } from 'zod';
/**
 * Extended market data type
 */
export interface ExtendedMarket {
    marketId: string;
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    settleAsset: string;
    isActive: boolean;
    minOrderQuantity: string;
    maxOrderQuantity: string;
    minPrice: string;
    maxPrice: string;
    quantityPrecision: number;
    pricePrecision: number;
    contractMultiplier: string;
    maxLeverage: string;
    fundingInterval: number;
    settlementPeriod?: number;
}
/**
 * Extended ticker data type
 */
export interface ExtendedTicker {
    symbol: string;
    lastPrice: string;
    bidPrice: string;
    askPrice: string;
    volume24h: string;
    quoteVolume24h: string;
    high24h: string;
    low24h: string;
    priceChange24h: string;
    priceChangePercent24h: string;
    openInterest?: string;
    indexPrice?: string;
    markPrice?: string;
    fundingRate?: string;
    nextFundingTime?: number;
    timestamp: number;
}
/**
 * Extended order book data type
 */
export interface ExtendedOrderBook {
    symbol: string;
    bids: [string, string][];
    asks: [string, string][];
    timestamp: number;
    sequence?: number;
    checksum?: string;
}
/**
 * Extended trade data type
 */
export interface ExtendedTrade {
    id: string;
    symbol: string;
    price: string;
    quantity: string;
    side: 'buy' | 'sell';
    timestamp: number;
    isMaker?: boolean;
    tradeId?: string;
}
/**
 * Extended funding rate data type
 */
export interface ExtendedFundingRate {
    symbol: string;
    fundingRate: string;
    fundingTime: number;
    nextFundingTime?: number;
    indexPrice: string;
    markPrice: string;
    premiumRate?: string;
}
/**
 * Extended order data type
 */
export interface ExtendedOrder {
    orderId: string;
    clientOrderId?: string;
    symbol: string;
    type: 'market' | 'limit' | 'stop' | 'stop_limit';
    side: 'buy' | 'sell';
    status: 'pending' | 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected' | 'expired';
    price?: string;
    stopPrice?: string;
    quantity: string;
    filledQuantity?: string;
    remainingQuantity?: string;
    averagePrice?: string;
    leverage?: string;
    marginMode?: 'cross' | 'isolated';
    timestamp: number;
    updateTime?: number;
    postOnly?: boolean;
    reduceOnly?: boolean;
    timeInForce?: 'GTC' | 'IOC' | 'FOK';
    fees?: {
        asset: string;
        amount: string;
    };
    starknetTxHash?: string;
}
/**
 * Extended position data type
 */
export interface ExtendedPosition {
    symbol: string;
    side: 'long' | 'short';
    size: string;
    entryPrice: string;
    markPrice: string;
    indexPrice?: string;
    liquidationPrice: string;
    margin: string;
    initialMargin: string;
    maintenanceMargin: string;
    leverage: string;
    marginMode: 'cross' | 'isolated';
    unrealizedPnl: string;
    realizedPnl: string;
    roi?: string;
    adlLevel?: number;
    timestamp: number;
    starknetPosition?: any;
}
/**
 * Extended balance data type
 */
export interface ExtendedBalance {
    asset: string;
    free: string;
    locked: string;
    total: string;
    availableMargin: string;
    usedMargin: string;
    equity?: string;
    timestamp?: number;
}
/**
 * Extended order request type
 */
export interface ExtendedOrderRequest {
    symbol: string;
    type: 'market' | 'limit' | 'stop' | 'stop_limit';
    side: 'buy' | 'sell';
    quantity: string;
    price?: string;
    stopPrice?: string;
    clientOrderId?: string;
    postOnly?: boolean;
    reduceOnly?: boolean;
    timeInForce?: 'GTC' | 'IOC' | 'FOK';
    leverage?: string;
    marginMode?: 'cross' | 'isolated';
}
/**
 * Extended user fees type
 */
export interface ExtendedUserFees {
    maker: string;
    taker: string;
    tierLevel: string;
    volume30d: string;
    makerDiscount?: string;
    takerDiscount?: string;
}
/**
 * Extended portfolio type
 */
export interface ExtendedPortfolio {
    totalEquity: string;
    availableBalance: string;
    usedMargin: string;
    marginRatio: string;
    unrealizedPnl: string;
    realizedPnl: string;
    dailyPnl: string;
    weeklyPnl?: string;
    monthlyPnl?: string;
    timestamp: number;
}
/**
 * Extended leverage settings type
 */
export interface ExtendedLeverageSettings {
    symbol: string;
    leverage: string;
    maxLeverage: string;
    marginMode: 'cross' | 'isolated';
}
/**
 * Extended StarkNet account state type
 */
export interface ExtendedStarkNetState {
    address: string;
    balance: string;
    nonce: number;
    contractClass?: string;
    positions?: any[];
}
/**
 * Extended StarkNet transaction type
 */
export interface ExtendedStarkNetTransaction {
    txHash: string;
    status: 'pending' | 'accepted' | 'rejected';
    type: string;
    blockNumber?: number;
    timestamp?: number;
}
export declare const ExtendedMarketSchema: z.ZodObject<{
    marketId: z.ZodString;
    symbol: z.ZodString;
    baseAsset: z.ZodString;
    quoteAsset: z.ZodString;
    settleAsset: z.ZodString;
    isActive: z.ZodBoolean;
    minOrderQuantity: z.ZodString;
    maxOrderQuantity: z.ZodString;
    minPrice: z.ZodString;
    maxPrice: z.ZodString;
    quantityPrecision: z.ZodNumber;
    pricePrecision: z.ZodNumber;
    contractMultiplier: z.ZodString;
    maxLeverage: z.ZodString;
    fundingInterval: z.ZodNumber;
    settlementPeriod: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    maxLeverage: string;
    fundingInterval: number;
    marketId: string;
    settleAsset: string;
    isActive: boolean;
    minOrderQuantity: string;
    maxOrderQuantity: string;
    minPrice: string;
    maxPrice: string;
    quantityPrecision: number;
    pricePrecision: number;
    contractMultiplier: string;
    settlementPeriod?: number | undefined;
}, {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    maxLeverage: string;
    fundingInterval: number;
    marketId: string;
    settleAsset: string;
    isActive: boolean;
    minOrderQuantity: string;
    maxOrderQuantity: string;
    minPrice: string;
    maxPrice: string;
    quantityPrecision: number;
    pricePrecision: number;
    contractMultiplier: string;
    settlementPeriod?: number | undefined;
}>;
export declare const ExtendedTickerSchema: z.ZodObject<{
    symbol: z.ZodString;
    lastPrice: z.ZodString;
    bidPrice: z.ZodString;
    askPrice: z.ZodString;
    volume24h: z.ZodString;
    quoteVolume24h: z.ZodString;
    high24h: z.ZodString;
    low24h: z.ZodString;
    priceChange24h: z.ZodString;
    priceChangePercent24h: z.ZodString;
    openInterest: z.ZodOptional<z.ZodString>;
    indexPrice: z.ZodOptional<z.ZodString>;
    markPrice: z.ZodOptional<z.ZodString>;
    fundingRate: z.ZodOptional<z.ZodString>;
    nextFundingTime: z.ZodOptional<z.ZodNumber>;
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
    quoteVolume24h: string;
    markPrice?: string | undefined;
    indexPrice?: string | undefined;
    fundingRate?: string | undefined;
    openInterest?: string | undefined;
    nextFundingTime?: number | undefined;
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
    quoteVolume24h: string;
    markPrice?: string | undefined;
    indexPrice?: string | undefined;
    fundingRate?: string | undefined;
    openInterest?: string | undefined;
    nextFundingTime?: number | undefined;
}>;
export declare const ExtendedOrderBookSchema: z.ZodObject<{
    symbol: z.ZodString;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    timestamp: z.ZodNumber;
    sequence: z.ZodOptional<z.ZodNumber>;
    checksum: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    timestamp: number;
    bids: [string, string][];
    asks: [string, string][];
    sequence?: number | undefined;
    checksum?: string | undefined;
}, {
    symbol: string;
    timestamp: number;
    bids: [string, string][];
    asks: [string, string][];
    sequence?: number | undefined;
    checksum?: string | undefined;
}>;
export declare const ExtendedTradeSchema: z.ZodObject<{
    id: z.ZodString;
    symbol: z.ZodString;
    price: z.ZodString;
    quantity: z.ZodString;
    side: z.ZodEnum<["buy", "sell"]>;
    timestamp: z.ZodNumber;
    isMaker: z.ZodOptional<z.ZodBoolean>;
    tradeId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    side: "buy" | "sell";
    timestamp: number;
    id: string;
    price: string;
    quantity: string;
    isMaker?: boolean | undefined;
    tradeId?: string | undefined;
}, {
    symbol: string;
    side: "buy" | "sell";
    timestamp: number;
    id: string;
    price: string;
    quantity: string;
    isMaker?: boolean | undefined;
    tradeId?: string | undefined;
}>;
export declare const ExtendedOrderSchema: z.ZodObject<{
    orderId: z.ZodString;
    clientOrderId: z.ZodOptional<z.ZodString>;
    symbol: z.ZodString;
    type: z.ZodEnum<["market", "limit", "stop", "stop_limit"]>;
    side: z.ZodEnum<["buy", "sell"]>;
    status: z.ZodEnum<["pending", "open", "filled", "partially_filled", "cancelled", "rejected", "expired"]>;
    price: z.ZodOptional<z.ZodString>;
    stopPrice: z.ZodOptional<z.ZodString>;
    quantity: z.ZodString;
    filledQuantity: z.ZodOptional<z.ZodString>;
    remainingQuantity: z.ZodOptional<z.ZodString>;
    averagePrice: z.ZodOptional<z.ZodString>;
    leverage: z.ZodOptional<z.ZodString>;
    marginMode: z.ZodOptional<z.ZodEnum<["cross", "isolated"]>>;
    timestamp: z.ZodNumber;
    updateTime: z.ZodOptional<z.ZodNumber>;
    postOnly: z.ZodOptional<z.ZodBoolean>;
    reduceOnly: z.ZodOptional<z.ZodBoolean>;
    timeInForce: z.ZodOptional<z.ZodEnum<["GTC", "IOC", "FOK"]>>;
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
    starknetTxHash: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    status: "open" | "expired" | "rejected" | "filled" | "pending" | "cancelled" | "partially_filled";
    type: "market" | "limit" | "stop_limit" | "stop";
    side: "buy" | "sell";
    orderId: string;
    timestamp: number;
    quantity: string;
    price?: string | undefined;
    clientOrderId?: string | undefined;
    stopPrice?: string | undefined;
    averagePrice?: string | undefined;
    timeInForce?: "GTC" | "IOC" | "FOK" | undefined;
    reduceOnly?: boolean | undefined;
    postOnly?: boolean | undefined;
    leverage?: string | undefined;
    marginMode?: "cross" | "isolated" | undefined;
    updateTime?: number | undefined;
    fees?: {
        amount: string;
        asset: string;
    } | undefined;
    filledQuantity?: string | undefined;
    remainingQuantity?: string | undefined;
    starknetTxHash?: string | undefined;
}, {
    symbol: string;
    status: "open" | "expired" | "rejected" | "filled" | "pending" | "cancelled" | "partially_filled";
    type: "market" | "limit" | "stop_limit" | "stop";
    side: "buy" | "sell";
    orderId: string;
    timestamp: number;
    quantity: string;
    price?: string | undefined;
    clientOrderId?: string | undefined;
    stopPrice?: string | undefined;
    averagePrice?: string | undefined;
    timeInForce?: "GTC" | "IOC" | "FOK" | undefined;
    reduceOnly?: boolean | undefined;
    postOnly?: boolean | undefined;
    leverage?: string | undefined;
    marginMode?: "cross" | "isolated" | undefined;
    updateTime?: number | undefined;
    fees?: {
        amount: string;
        asset: string;
    } | undefined;
    filledQuantity?: string | undefined;
    remainingQuantity?: string | undefined;
    starknetTxHash?: string | undefined;
}>;
export declare const ExtendedPositionSchema: z.ZodObject<{
    symbol: z.ZodString;
    side: z.ZodEnum<["long", "short"]>;
    size: z.ZodString;
    entryPrice: z.ZodString;
    markPrice: z.ZodString;
    indexPrice: z.ZodOptional<z.ZodString>;
    liquidationPrice: z.ZodString;
    margin: z.ZodString;
    initialMargin: z.ZodString;
    maintenanceMargin: z.ZodString;
    leverage: z.ZodString;
    marginMode: z.ZodEnum<["cross", "isolated"]>;
    unrealizedPnl: z.ZodString;
    realizedPnl: z.ZodString;
    roi: z.ZodOptional<z.ZodString>;
    adlLevel: z.ZodOptional<z.ZodNumber>;
    timestamp: z.ZodNumber;
    starknetPosition: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    side: "long" | "short";
    timestamp: number;
    markPrice: string;
    margin: string;
    size: string;
    leverage: string;
    unrealizedPnl: string;
    realizedPnl: string;
    marginMode: "cross" | "isolated";
    entryPrice: string;
    liquidationPrice: string;
    initialMargin: string;
    maintenanceMargin: string;
    indexPrice?: string | undefined;
    roi?: string | undefined;
    adlLevel?: number | undefined;
    starknetPosition?: any;
}, {
    symbol: string;
    side: "long" | "short";
    timestamp: number;
    markPrice: string;
    margin: string;
    size: string;
    leverage: string;
    unrealizedPnl: string;
    realizedPnl: string;
    marginMode: "cross" | "isolated";
    entryPrice: string;
    liquidationPrice: string;
    initialMargin: string;
    maintenanceMargin: string;
    indexPrice?: string | undefined;
    roi?: string | undefined;
    adlLevel?: number | undefined;
    starknetPosition?: any;
}>;
export declare const ExtendedBalanceSchema: z.ZodObject<{
    asset: z.ZodString;
    free: z.ZodString;
    locked: z.ZodString;
    total: z.ZodString;
    availableMargin: z.ZodString;
    usedMargin: z.ZodString;
    equity: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    total: string;
    locked: string;
    asset: string;
    free: string;
    availableMargin: string;
    usedMargin: string;
    timestamp?: number | undefined;
    equity?: string | undefined;
}, {
    total: string;
    locked: string;
    asset: string;
    free: string;
    availableMargin: string;
    usedMargin: string;
    timestamp?: number | undefined;
    equity?: string | undefined;
}>;
/**
 * WebSocket order book update
 */
export interface ExtendedWsOrderBookUpdate {
    channel: 'orderbook';
    symbol: string;
    bids: [string, string][];
    asks: [string, string][];
    timestamp: number;
    sequence: number;
    checksum?: string;
}
/**
 * WebSocket trade update
 */
export interface ExtendedWsTradeUpdate {
    channel: 'trades';
    id: string;
    symbol: string;
    price: string;
    quantity: string;
    side: 'buy' | 'sell';
    timestamp: number;
}
/**
 * WebSocket ticker update
 */
export interface ExtendedWsTickerUpdate {
    channel: 'ticker';
    symbol: string;
    lastPrice: string;
    bidPrice: string;
    askPrice: string;
    high24h: string;
    low24h: string;
    volume24h: string;
    quoteVolume24h: string;
    priceChange24h: string;
    priceChangePercent24h: string;
    timestamp: number;
}
/**
 * WebSocket position update
 */
export interface ExtendedWsPositionUpdate {
    channel: 'positions';
    positions: ExtendedPosition[];
    timestamp: number;
}
/**
 * WebSocket order update
 */
export interface ExtendedWsOrderUpdate {
    channel: 'orders';
    orders: ExtendedOrder[];
    timestamp: number;
}
/**
 * WebSocket balance update
 */
export interface ExtendedWsBalanceUpdate {
    channel: 'balance';
    balances: ExtendedBalance[];
    timestamp: number;
}
/**
 * WebSocket funding rate update
 */
export interface ExtendedWsFundingRateUpdate {
    channel: 'funding';
    symbol: string;
    fundingRate: string;
    fundingTime: number;
    nextFundingTime?: number;
    markPrice: string;
    indexPrice: string;
    timestamp: number;
}
/**
 * WebSocket message union type
 */
export type ExtendedWsMessage = ExtendedWsOrderBookUpdate | ExtendedWsTradeUpdate | ExtendedWsTickerUpdate | ExtendedWsPositionUpdate | ExtendedWsOrderUpdate | ExtendedWsBalanceUpdate | ExtendedWsFundingRateUpdate;
/**
 * WebSocket subscription request
 */
export interface ExtendedWsSubscription {
    action: 'subscribe' | 'unsubscribe';
    channel: string;
    symbol?: string;
}
/**
 * WebSocket authentication message
 */
export interface ExtendedWsAuth {
    action: 'auth';
    apiKey: string;
    timestamp: number;
    signature?: string;
}
//# sourceMappingURL=types.d.ts.map
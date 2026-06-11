/**
 * Extended Exchange Types
 *
 * TypeScript types and Zod schemas for Extended API responses
 */
import { z } from 'zod';
/**
 * Extended market data type (Legacy SDK format)
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
 * Extended market data type (Actual API format)
 */
export interface ExtendedMarketApiFormat {
    name: string;
    assetName: string;
    collateralAssetName: string;
    active: boolean;
    tradingConfig?: {
        minOrderSize?: string;
        maxPositionValue?: string;
        maxLeverage?: string;
        minPriceChange?: string;
        minOrderSizeChange?: string;
    };
    assetPrecision?: number;
    collateralAssetPrecision?: number;
    contractMultiplier?: string;
    fundingInterval?: number;
    settlementPeriod?: number;
}
export declare const ExtendedMarketApiFormatSchema: z.ZodObject<{
    name: z.ZodString;
    assetName: z.ZodString;
    collateralAssetName: z.ZodString;
    active: z.ZodBoolean;
    tradingConfig: z.ZodOptional<z.ZodObject<{
        minOrderSize: z.ZodOptional<z.ZodString>;
        maxPositionValue: z.ZodOptional<z.ZodString>;
        maxLeverage: z.ZodOptional<z.ZodString>;
        minPriceChange: z.ZodOptional<z.ZodString>;
        minOrderSizeChange: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        minOrderSize: z.ZodOptional<z.ZodString>;
        maxPositionValue: z.ZodOptional<z.ZodString>;
        maxLeverage: z.ZodOptional<z.ZodString>;
        minPriceChange: z.ZodOptional<z.ZodString>;
        minOrderSizeChange: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        minOrderSize: z.ZodOptional<z.ZodString>;
        maxPositionValue: z.ZodOptional<z.ZodString>;
        maxLeverage: z.ZodOptional<z.ZodString>;
        minPriceChange: z.ZodOptional<z.ZodString>;
        minOrderSizeChange: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    assetPrecision: z.ZodOptional<z.ZodNumber>;
    collateralAssetPrecision: z.ZodOptional<z.ZodNumber>;
    contractMultiplier: z.ZodOptional<z.ZodString>;
    fundingInterval: z.ZodOptional<z.ZodNumber>;
    settlementPeriod: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    name: z.ZodString;
    assetName: z.ZodString;
    collateralAssetName: z.ZodString;
    active: z.ZodBoolean;
    tradingConfig: z.ZodOptional<z.ZodObject<{
        minOrderSize: z.ZodOptional<z.ZodString>;
        maxPositionValue: z.ZodOptional<z.ZodString>;
        maxLeverage: z.ZodOptional<z.ZodString>;
        minPriceChange: z.ZodOptional<z.ZodString>;
        minOrderSizeChange: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        minOrderSize: z.ZodOptional<z.ZodString>;
        maxPositionValue: z.ZodOptional<z.ZodString>;
        maxLeverage: z.ZodOptional<z.ZodString>;
        minPriceChange: z.ZodOptional<z.ZodString>;
        minOrderSizeChange: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        minOrderSize: z.ZodOptional<z.ZodString>;
        maxPositionValue: z.ZodOptional<z.ZodString>;
        maxLeverage: z.ZodOptional<z.ZodString>;
        minPriceChange: z.ZodOptional<z.ZodString>;
        minOrderSizeChange: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    assetPrecision: z.ZodOptional<z.ZodNumber>;
    collateralAssetPrecision: z.ZodOptional<z.ZodNumber>;
    contractMultiplier: z.ZodOptional<z.ZodString>;
    fundingInterval: z.ZodOptional<z.ZodNumber>;
    settlementPeriod: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    name: z.ZodString;
    assetName: z.ZodString;
    collateralAssetName: z.ZodString;
    active: z.ZodBoolean;
    tradingConfig: z.ZodOptional<z.ZodObject<{
        minOrderSize: z.ZodOptional<z.ZodString>;
        maxPositionValue: z.ZodOptional<z.ZodString>;
        maxLeverage: z.ZodOptional<z.ZodString>;
        minPriceChange: z.ZodOptional<z.ZodString>;
        minOrderSizeChange: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        minOrderSize: z.ZodOptional<z.ZodString>;
        maxPositionValue: z.ZodOptional<z.ZodString>;
        maxLeverage: z.ZodOptional<z.ZodString>;
        minPriceChange: z.ZodOptional<z.ZodString>;
        minOrderSizeChange: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        minOrderSize: z.ZodOptional<z.ZodString>;
        maxPositionValue: z.ZodOptional<z.ZodString>;
        maxLeverage: z.ZodOptional<z.ZodString>;
        minPriceChange: z.ZodOptional<z.ZodString>;
        minOrderSizeChange: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    assetPrecision: z.ZodOptional<z.ZodNumber>;
    collateralAssetPrecision: z.ZodOptional<z.ZodNumber>;
    contractMultiplier: z.ZodOptional<z.ZodString>;
    fundingInterval: z.ZodOptional<z.ZodNumber>;
    settlementPeriod: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Union type for Extended market data
 * Handles both legacy SDK type and actual API response format
 */
export type ExtendedMarketRaw = ExtendedMarket | ExtendedMarketApiFormat;
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
export declare const ExtendedFundingRateSchema: z.ZodObject<{
    symbol: z.ZodString;
    fundingRate: z.ZodString;
    fundingTime: z.ZodNumber;
    nextFundingTime: z.ZodOptional<z.ZodNumber>;
    indexPrice: z.ZodString;
    markPrice: z.ZodString;
    premiumRate: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    fundingRate: z.ZodString;
    fundingTime: z.ZodNumber;
    nextFundingTime: z.ZodOptional<z.ZodNumber>;
    indexPrice: z.ZodString;
    markPrice: z.ZodString;
    premiumRate: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    fundingRate: z.ZodString;
    fundingTime: z.ZodNumber;
    nextFundingTime: z.ZodOptional<z.ZodNumber>;
    indexPrice: z.ZodString;
    markPrice: z.ZodString;
    premiumRate: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
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
    marketId: z.ZodOptional<z.ZodString>;
    symbol: z.ZodString;
    baseAsset: z.ZodOptional<z.ZodString>;
    quoteAsset: z.ZodOptional<z.ZodString>;
    settleAsset: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    minOrderQuantity: z.ZodOptional<z.ZodString>;
    maxOrderQuantity: z.ZodOptional<z.ZodString>;
    minPrice: z.ZodOptional<z.ZodString>;
    maxPrice: z.ZodOptional<z.ZodString>;
    quantityPrecision: z.ZodOptional<z.ZodNumber>;
    pricePrecision: z.ZodOptional<z.ZodNumber>;
    contractMultiplier: z.ZodOptional<z.ZodString>;
    maxLeverage: z.ZodOptional<z.ZodString>;
    fundingInterval: z.ZodOptional<z.ZodNumber>;
    settlementPeriod: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    marketId: z.ZodOptional<z.ZodString>;
    symbol: z.ZodString;
    baseAsset: z.ZodOptional<z.ZodString>;
    quoteAsset: z.ZodOptional<z.ZodString>;
    settleAsset: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    minOrderQuantity: z.ZodOptional<z.ZodString>;
    maxOrderQuantity: z.ZodOptional<z.ZodString>;
    minPrice: z.ZodOptional<z.ZodString>;
    maxPrice: z.ZodOptional<z.ZodString>;
    quantityPrecision: z.ZodOptional<z.ZodNumber>;
    pricePrecision: z.ZodOptional<z.ZodNumber>;
    contractMultiplier: z.ZodOptional<z.ZodString>;
    maxLeverage: z.ZodOptional<z.ZodString>;
    fundingInterval: z.ZodOptional<z.ZodNumber>;
    settlementPeriod: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    marketId: z.ZodOptional<z.ZodString>;
    symbol: z.ZodString;
    baseAsset: z.ZodOptional<z.ZodString>;
    quoteAsset: z.ZodOptional<z.ZodString>;
    settleAsset: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    minOrderQuantity: z.ZodOptional<z.ZodString>;
    maxOrderQuantity: z.ZodOptional<z.ZodString>;
    minPrice: z.ZodOptional<z.ZodString>;
    maxPrice: z.ZodOptional<z.ZodString>;
    quantityPrecision: z.ZodOptional<z.ZodNumber>;
    pricePrecision: z.ZodOptional<z.ZodNumber>;
    contractMultiplier: z.ZodOptional<z.ZodString>;
    maxLeverage: z.ZodOptional<z.ZodString>;
    fundingInterval: z.ZodOptional<z.ZodNumber>;
    settlementPeriod: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export declare const ExtendedTickerSchema: z.ZodObject<{
    symbol: z.ZodOptional<z.ZodString>;
    market: z.ZodOptional<z.ZodString>;
    lastPrice: z.ZodOptional<z.ZodString>;
    bidPrice: z.ZodOptional<z.ZodString>;
    askPrice: z.ZodOptional<z.ZodString>;
    volume24h: z.ZodOptional<z.ZodString>;
    quoteVolume24h: z.ZodOptional<z.ZodString>;
    high24h: z.ZodOptional<z.ZodString>;
    low24h: z.ZodOptional<z.ZodString>;
    priceChange24h: z.ZodOptional<z.ZodString>;
    priceChangePercent24h: z.ZodOptional<z.ZodString>;
    openInterest: z.ZodOptional<z.ZodString>;
    indexPrice: z.ZodOptional<z.ZodString>;
    markPrice: z.ZodOptional<z.ZodString>;
    fundingRate: z.ZodOptional<z.ZodString>;
    nextFundingTime: z.ZodOptional<z.ZodNumber>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    dailyHigh: z.ZodOptional<z.ZodString>;
    dailyLow: z.ZodOptional<z.ZodString>;
    dailyVolume: z.ZodOptional<z.ZodString>;
    dailyVolumeBase: z.ZodOptional<z.ZodString>;
    dailyPriceChange: z.ZodOptional<z.ZodString>;
    dailyPriceChangePercentage: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodOptional<z.ZodString>;
    market: z.ZodOptional<z.ZodString>;
    lastPrice: z.ZodOptional<z.ZodString>;
    bidPrice: z.ZodOptional<z.ZodString>;
    askPrice: z.ZodOptional<z.ZodString>;
    volume24h: z.ZodOptional<z.ZodString>;
    quoteVolume24h: z.ZodOptional<z.ZodString>;
    high24h: z.ZodOptional<z.ZodString>;
    low24h: z.ZodOptional<z.ZodString>;
    priceChange24h: z.ZodOptional<z.ZodString>;
    priceChangePercent24h: z.ZodOptional<z.ZodString>;
    openInterest: z.ZodOptional<z.ZodString>;
    indexPrice: z.ZodOptional<z.ZodString>;
    markPrice: z.ZodOptional<z.ZodString>;
    fundingRate: z.ZodOptional<z.ZodString>;
    nextFundingTime: z.ZodOptional<z.ZodNumber>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    dailyHigh: z.ZodOptional<z.ZodString>;
    dailyLow: z.ZodOptional<z.ZodString>;
    dailyVolume: z.ZodOptional<z.ZodString>;
    dailyVolumeBase: z.ZodOptional<z.ZodString>;
    dailyPriceChange: z.ZodOptional<z.ZodString>;
    dailyPriceChangePercentage: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodOptional<z.ZodString>;
    market: z.ZodOptional<z.ZodString>;
    lastPrice: z.ZodOptional<z.ZodString>;
    bidPrice: z.ZodOptional<z.ZodString>;
    askPrice: z.ZodOptional<z.ZodString>;
    volume24h: z.ZodOptional<z.ZodString>;
    quoteVolume24h: z.ZodOptional<z.ZodString>;
    high24h: z.ZodOptional<z.ZodString>;
    low24h: z.ZodOptional<z.ZodString>;
    priceChange24h: z.ZodOptional<z.ZodString>;
    priceChangePercent24h: z.ZodOptional<z.ZodString>;
    openInterest: z.ZodOptional<z.ZodString>;
    indexPrice: z.ZodOptional<z.ZodString>;
    markPrice: z.ZodOptional<z.ZodString>;
    fundingRate: z.ZodOptional<z.ZodString>;
    nextFundingTime: z.ZodOptional<z.ZodNumber>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    dailyHigh: z.ZodOptional<z.ZodString>;
    dailyLow: z.ZodOptional<z.ZodString>;
    dailyVolume: z.ZodOptional<z.ZodString>;
    dailyVolumeBase: z.ZodOptional<z.ZodString>;
    dailyPriceChange: z.ZodOptional<z.ZodString>;
    dailyPriceChangePercentage: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const ExtendedOrderBookSchema: z.ZodObject<{
    symbol: z.ZodOptional<z.ZodString>;
    bids: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">>;
    asks: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    sequence: z.ZodOptional<z.ZodNumber>;
    checksum: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodOptional<z.ZodString>;
    bids: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">>;
    asks: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    sequence: z.ZodOptional<z.ZodNumber>;
    checksum: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodOptional<z.ZodString>;
    bids: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">>;
    asks: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    sequence: z.ZodOptional<z.ZodNumber>;
    checksum: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Trade schema accepting BOTH shapes:
 * - legacy SDK shape `{id, symbol, price, quantity, side, timestamp}`
 * - live API shape `{i, m, S, tT, T, p, q}` — REST `/trades` and the WS
 *   `publicTrades` stream share these field names (live-verified 2026-06-11;
 *   the old required `id`/`symbol` ZodErrored on every real wire trade).
 *
 * `i` accepts string (int64-safe, via the WS reviver) or number (REST
 * `JSON.parse`, may have lost precision past 2^53 — see
 * ExtendedWSTradeSchema).
 */
export declare const ExtendedTradeSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    symbol: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodString>;
    side: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    isMaker: z.ZodOptional<z.ZodBoolean>;
    tradeId: z.ZodOptional<z.ZodString>;
    i: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    m: z.ZodOptional<z.ZodString>;
    S: z.ZodOptional<z.ZodString>;
    tT: z.ZodOptional<z.ZodString>;
    T: z.ZodOptional<z.ZodNumber>;
    p: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodOptional<z.ZodString>;
    symbol: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodString>;
    side: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    isMaker: z.ZodOptional<z.ZodBoolean>;
    tradeId: z.ZodOptional<z.ZodString>;
    i: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    m: z.ZodOptional<z.ZodString>;
    S: z.ZodOptional<z.ZodString>;
    tT: z.ZodOptional<z.ZodString>;
    T: z.ZodOptional<z.ZodNumber>;
    p: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodOptional<z.ZodString>;
    symbol: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodString>;
    side: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    isMaker: z.ZodOptional<z.ZodBoolean>;
    tradeId: z.ZodOptional<z.ZodString>;
    i: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    m: z.ZodOptional<z.ZodString>;
    S: z.ZodOptional<z.ZodString>;
    tT: z.ZodOptional<z.ZodString>;
    T: z.ZodOptional<z.ZodNumber>;
    p: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
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
    marginMode: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodNumber;
    updateTime: z.ZodOptional<z.ZodNumber>;
    postOnly: z.ZodOptional<z.ZodBoolean>;
    reduceOnly: z.ZodOptional<z.ZodBoolean>;
    timeInForce: z.ZodOptional<z.ZodString>;
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
    starknetTxHash: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
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
    marginMode: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodNumber;
    updateTime: z.ZodOptional<z.ZodNumber>;
    postOnly: z.ZodOptional<z.ZodBoolean>;
    reduceOnly: z.ZodOptional<z.ZodBoolean>;
    timeInForce: z.ZodOptional<z.ZodString>;
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
    starknetTxHash: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
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
    marginMode: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodNumber;
    updateTime: z.ZodOptional<z.ZodNumber>;
    postOnly: z.ZodOptional<z.ZodBoolean>;
    reduceOnly: z.ZodOptional<z.ZodBoolean>;
    timeInForce: z.ZodOptional<z.ZodString>;
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
    starknetTxHash: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
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
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
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
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
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
}, z.ZodTypeAny, "passthrough">>;
export declare const ExtendedBalanceSchema: z.ZodObject<{
    asset: z.ZodString;
    free: z.ZodString;
    locked: z.ZodString;
    total: z.ZodString;
    availableMargin: z.ZodString;
    usedMargin: z.ZodString;
    equity: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    asset: z.ZodString;
    free: z.ZodString;
    locked: z.ZodString;
    total: z.ZodString;
    availableMargin: z.ZodString;
    usedMargin: z.ZodString;
    equity: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    asset: z.ZodString;
    free: z.ZodString;
    locked: z.ZodString;
    total: z.ZodString;
    availableMargin: z.ZodString;
    usedMargin: z.ZodString;
    equity: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * SNAPSHOT order book level: `{q: "<qty>", p: "<price>"}` (full depth;
 * captured first frame = 2414 bids + 5010 asks, 207,833 bytes).
 */
export declare const ExtendedWSSnapshotLevelSchema: z.ZodObject<{
    q: z.ZodString;
    p: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    q: z.ZodString;
    p: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    q: z.ZodString;
    p: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
/**
 * DELTA order book level: `{q: "<SIGNED change>", p: "<price>", c: "<new
 * ABSOLUTE qty>"}`. Apply rule: level qty := parseFloat(c); DELETE the level
 * when c == "0". `q` is informational only.
 */
export declare const ExtendedWSDeltaLevelSchema: z.ZodObject<{
    q: z.ZodString;
    p: z.ZodString;
    c: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    q: z.ZodString;
    p: z.ZodString;
    c: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    q: z.ZodString;
    p: z.ZodString;
    c: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Order book stream envelope (`{base}/orderbooks/{market}`):
 * `{type: "SNAPSHOT"|"DELTA", data: {t, m, b, a, d}, ts: <epoch ms>, seq}`.
 *
 * - `seq` starts at 1 on the SNAPSHOT and increments +1 per frame PER
 *   CONNECTION; reconnect ⇒ fresh SNAPSHOT, seq resets to 1.
 * - `d` is the depth mode: "f" = full book, "1" = BBO (`?depth=1`, every
 *   frame is a self-contained 1+1 SNAPSHOT). `?depth=10`/`?depth=20`
 *   SILENTLY FAIL live — client limits must be served by slicing the
 *   maintained book, never forwarded as `?depth`.
 */
export declare const ExtendedWSOrderBookSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"SNAPSHOT">;
    data: z.ZodObject<{
        t: z.ZodLiteral<"SNAPSHOT">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        t: z.ZodLiteral<"SNAPSHOT">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        t: z.ZodLiteral<"SNAPSHOT">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, z.ZodTypeAny, "passthrough">>;
    ts: z.ZodNumber;
    seq: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    type: z.ZodLiteral<"SNAPSHOT">;
    data: z.ZodObject<{
        t: z.ZodLiteral<"SNAPSHOT">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        t: z.ZodLiteral<"SNAPSHOT">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        t: z.ZodLiteral<"SNAPSHOT">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, z.ZodTypeAny, "passthrough">>;
    ts: z.ZodNumber;
    seq: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    type: z.ZodLiteral<"SNAPSHOT">;
    data: z.ZodObject<{
        t: z.ZodLiteral<"SNAPSHOT">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        t: z.ZodLiteral<"SNAPSHOT">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        t: z.ZodLiteral<"SNAPSHOT">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, z.ZodTypeAny, "passthrough">>;
    ts: z.ZodNumber;
    seq: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
    type: z.ZodLiteral<"DELTA">;
    data: z.ZodObject<{
        t: z.ZodLiteral<"DELTA">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        t: z.ZodLiteral<"DELTA">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        t: z.ZodLiteral<"DELTA">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, z.ZodTypeAny, "passthrough">>;
    ts: z.ZodNumber;
    seq: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    type: z.ZodLiteral<"DELTA">;
    data: z.ZodObject<{
        t: z.ZodLiteral<"DELTA">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        t: z.ZodLiteral<"DELTA">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        t: z.ZodLiteral<"DELTA">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, z.ZodTypeAny, "passthrough">>;
    ts: z.ZodNumber;
    seq: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    type: z.ZodLiteral<"DELTA">;
    data: z.ZodObject<{
        t: z.ZodLiteral<"DELTA">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        t: z.ZodLiteral<"DELTA">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        t: z.ZodLiteral<"DELTA">;
        m: z.ZodString;
        b: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        a: z.ZodArray<z.ZodObject<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            q: z.ZodString;
            p: z.ZodString;
            c: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        d: z.ZodEnum<["f", "1"]>;
    }, z.ZodTypeAny, "passthrough">>;
    ts: z.ZodNumber;
    seq: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>]>;
export type ExtendedWSOrderBookFrame = z.infer<typeof ExtendedWSOrderBookSchema>;
/**
 * Public trade object on the wire — identical field names on REST `/trades`
 * and the WS `publicTrades` stream (live-verified 2026-06-11):
 * `{i: <int64 id>, m, S: "BUY"|"SELL", tT: "TRADE"|"LIQUIDATION"|"DELEVERAGE",
 *   T: <epoch ms>, p, q}`.
 *
 * int64 DECISION (live-proven corruption): wire `i:2064908781480841219` →
 * `JSON.parse` → `2064908781480841200` (last 2 digits LOST; `String(raw.i)`
 * after parse is already corrupted). The canonical decode path is
 * {@link parseExtendedWSTradesFrame}, which applies a bigint-preserving
 * reviver (quotes bare `"i":<digits>` BEFORE `JSON.parse`) so trade ids
 * survive byte-exact as strings. The schema also tolerates numbers for
 * callers that already JSON.parse'd a frame, but such ids may have silently
 * lost precision — do NOT rely on them for dedup/equality.
 */
export declare const ExtendedWSTradeSchema: z.ZodObject<{
    i: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    m: z.ZodString;
    S: z.ZodEnum<["BUY", "SELL"]>;
    tT: z.ZodEnum<["TRADE", "LIQUIDATION", "DELEVERAGE"]>;
    T: z.ZodNumber;
    p: z.ZodString;
    q: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    i: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    m: z.ZodString;
    S: z.ZodEnum<["BUY", "SELL"]>;
    tT: z.ZodEnum<["TRADE", "LIQUIDATION", "DELEVERAGE"]>;
    T: z.ZodNumber;
    p: z.ZodString;
    q: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    i: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    m: z.ZodString;
    S: z.ZodEnum<["BUY", "SELL"]>;
    tT: z.ZodEnum<["TRADE", "LIQUIDATION", "DELEVERAGE"]>;
    T: z.ZodNumber;
    p: z.ZodString;
    q: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type ExtendedWSTrade = z.infer<typeof ExtendedWSTradeSchema>;
/**
 * Trades stream envelope (`{base}/publicTrades/{market}`):
 * `{data: [trades], ts: <epoch ms>, seq}` — deliberately a SEPARATE schema
 * from the orderbook envelope: the wire has NO `type` field on trades frames.
 *
 * The FIRST frame per connection is a 50-trade HISTORICAL BACKFILL (trade
 * timestamps predate connect); consumers wanting live flow must gate it.
 */
export declare const ExtendedWSTradesSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        i: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
        m: z.ZodString;
        S: z.ZodEnum<["BUY", "SELL"]>;
        tT: z.ZodEnum<["TRADE", "LIQUIDATION", "DELEVERAGE"]>;
        T: z.ZodNumber;
        p: z.ZodString;
        q: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        i: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
        m: z.ZodString;
        S: z.ZodEnum<["BUY", "SELL"]>;
        tT: z.ZodEnum<["TRADE", "LIQUIDATION", "DELEVERAGE"]>;
        T: z.ZodNumber;
        p: z.ZodString;
        q: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        i: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
        m: z.ZodString;
        S: z.ZodEnum<["BUY", "SELL"]>;
        tT: z.ZodEnum<["TRADE", "LIQUIDATION", "DELEVERAGE"]>;
        T: z.ZodNumber;
        p: z.ZodString;
        q: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    ts: z.ZodNumber;
    seq: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    data: z.ZodArray<z.ZodObject<{
        i: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
        m: z.ZodString;
        S: z.ZodEnum<["BUY", "SELL"]>;
        tT: z.ZodEnum<["TRADE", "LIQUIDATION", "DELEVERAGE"]>;
        T: z.ZodNumber;
        p: z.ZodString;
        q: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        i: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
        m: z.ZodString;
        S: z.ZodEnum<["BUY", "SELL"]>;
        tT: z.ZodEnum<["TRADE", "LIQUIDATION", "DELEVERAGE"]>;
        T: z.ZodNumber;
        p: z.ZodString;
        q: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        i: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
        m: z.ZodString;
        S: z.ZodEnum<["BUY", "SELL"]>;
        tT: z.ZodEnum<["TRADE", "LIQUIDATION", "DELEVERAGE"]>;
        T: z.ZodNumber;
        p: z.ZodString;
        q: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    ts: z.ZodNumber;
    seq: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    data: z.ZodArray<z.ZodObject<{
        i: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
        m: z.ZodString;
        S: z.ZodEnum<["BUY", "SELL"]>;
        tT: z.ZodEnum<["TRADE", "LIQUIDATION", "DELEVERAGE"]>;
        T: z.ZodNumber;
        p: z.ZodString;
        q: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        i: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
        m: z.ZodString;
        S: z.ZodEnum<["BUY", "SELL"]>;
        tT: z.ZodEnum<["TRADE", "LIQUIDATION", "DELEVERAGE"]>;
        T: z.ZodNumber;
        p: z.ZodString;
        q: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        i: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
        m: z.ZodString;
        S: z.ZodEnum<["BUY", "SELL"]>;
        tT: z.ZodEnum<["TRADE", "LIQUIDATION", "DELEVERAGE"]>;
        T: z.ZodNumber;
        p: z.ZodString;
        q: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    ts: z.ZodNumber;
    seq: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export type ExtendedWSTradesFrame = z.infer<typeof ExtendedWSTradesSchema>;
/**
 * int64-safe decoder for a RAW trades frame (see {@link ExtendedWSTradeSchema}
 * for the precision rationale). Quotes bare `"i": <digits>` values before
 * `JSON.parse` so ids survive byte-exact as strings, then zod-validates.
 */
export declare function parseExtendedWSTradesFrame(rawText: string): ExtendedWSTradesFrame;
//# sourceMappingURL=types.d.ts.map
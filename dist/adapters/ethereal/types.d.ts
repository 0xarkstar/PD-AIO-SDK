/**
 * Ethereal Exchange-Specific Types
 */
import { z } from 'zod';
import type { ExchangeConfig } from '../../types/adapter.js';
/** Wrapped response from Ethereal API endpoints that return { data: [...] } */
export interface EtherealDataResponse<T> {
    data: T;
}
export interface EtherealConfig extends ExchangeConfig {
    /** Ethereum wallet private key for EIP-712 signing */
    privateKey?: string;
    /** Account ID for trading */
    accountId?: string;
    /** Testnet flag */
    testnet?: boolean;
    /** Request timeout */
    timeout?: number;
}
export interface EtherealMarketInfo {
    id: string;
    ticker: string;
    displayTicker: string;
    status: string;
    baseTokenName: string;
    quoteTokenName: string;
    tickSize: string;
    lotSize: string;
    minQuantity: string;
    maxQuantity: string;
    maxLeverage: number;
    makerFee: string;
    takerFee: string;
    volume24h: string;
    openInterest: string;
    fundingRate1h: string;
    minPrice: string;
    maxPrice: string;
    onchainId: number;
    engineType: number;
}
export declare const EtherealMarketInfoSchema: z.ZodObject<{
    id: z.ZodString;
    ticker: z.ZodString;
    displayTicker: z.ZodString;
    status: z.ZodString;
    baseTokenName: z.ZodString;
    quoteTokenName: z.ZodString;
    tickSize: z.ZodString;
    lotSize: z.ZodString;
    minQuantity: z.ZodString;
    maxQuantity: z.ZodString;
    maxLeverage: z.ZodNumber;
    makerFee: z.ZodString;
    takerFee: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    ticker: z.ZodString;
    displayTicker: z.ZodString;
    status: z.ZodString;
    baseTokenName: z.ZodString;
    quoteTokenName: z.ZodString;
    tickSize: z.ZodString;
    lotSize: z.ZodString;
    minQuantity: z.ZodString;
    maxQuantity: z.ZodString;
    maxLeverage: z.ZodNumber;
    makerFee: z.ZodString;
    takerFee: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    ticker: z.ZodString;
    displayTicker: z.ZodString;
    status: z.ZodString;
    baseTokenName: z.ZodString;
    quoteTokenName: z.ZodString;
    tickSize: z.ZodString;
    lotSize: z.ZodString;
    minQuantity: z.ZodString;
    maxQuantity: z.ZodString;
    maxLeverage: z.ZodNumber;
    makerFee: z.ZodString;
    takerFee: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export interface EtherealTicker {
    productId: string;
    bestAskPrice: string;
    bestBidPrice: string;
    oraclePrice: string;
    price24hAgo: string;
}
export declare const EtherealTickerSchema: z.ZodObject<{
    productId: z.ZodString;
    bestAskPrice: z.ZodString;
    bestBidPrice: z.ZodString;
    oraclePrice: z.ZodString;
    price24hAgo: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    productId: z.ZodString;
    bestAskPrice: z.ZodString;
    bestBidPrice: z.ZodString;
    oraclePrice: z.ZodString;
    price24hAgo: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    productId: z.ZodString;
    bestAskPrice: z.ZodString;
    bestBidPrice: z.ZodString;
    oraclePrice: z.ZodString;
    price24hAgo: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export interface EtherealOrderBookResponse {
    productId: string;
    timestamp: number;
    previousTimestamp: number;
    bids: [string, string][];
    asks: [string, string][];
}
export declare const EtherealOrderBookResponseSchema: z.ZodObject<{
    productId: z.ZodString;
    timestamp: z.ZodNumber;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    productId: z.ZodString;
    timestamp: z.ZodNumber;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    productId: z.ZodString;
    timestamp: z.ZodNumber;
    bids: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
    asks: z.ZodArray<z.ZodTuple<[z.ZodString, z.ZodString], null>, "many">;
}, z.ZodTypeAny, "passthrough">>;
export interface EtherealTradeResponse {
    id: string;
    productId: string;
    makerOrderId: string;
    takerOrderId: string;
    makerSide: number;
    takerSide: number;
    price: string;
    filled: string;
    makerFeeUsd: string;
    takerFeeUsd: string;
    createdAt: number;
}
export declare const EtherealTradeResponseSchema: z.ZodObject<{
    id: z.ZodString;
    productId: z.ZodString;
    price: z.ZodString;
    filled: z.ZodString;
    makerSide: z.ZodNumber;
    takerSide: z.ZodNumber;
    createdAt: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    productId: z.ZodString;
    price: z.ZodString;
    filled: z.ZodString;
    makerSide: z.ZodNumber;
    takerSide: z.ZodNumber;
    createdAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    productId: z.ZodString;
    price: z.ZodString;
    filled: z.ZodString;
    makerSide: z.ZodNumber;
    takerSide: z.ZodNumber;
    createdAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface EtherealOrderResponse {
    orderId: string;
    symbol: string;
    side: string;
    type: string;
    status: string;
    price: string;
    avgPrice: string;
    quantity: string;
    filledQuantity: string;
    remainingQuantity: string;
    reduceOnly: boolean;
    postOnly: boolean;
    clientOrderId?: string;
    timeInForce: string;
    createdAt: number;
    updatedAt: number;
}
export declare const EtherealOrderResponseSchema: z.ZodObject<{
    orderId: z.ZodString;
    symbol: z.ZodString;
    side: z.ZodString;
    type: z.ZodString;
    status: z.ZodString;
    price: z.ZodString;
    avgPrice: z.ZodString;
    quantity: z.ZodString;
    filledQuantity: z.ZodString;
    remainingQuantity: z.ZodString;
    reduceOnly: z.ZodBoolean;
    postOnly: z.ZodBoolean;
    clientOrderId: z.ZodOptional<z.ZodString>;
    timeInForce: z.ZodString;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    orderId: z.ZodString;
    symbol: z.ZodString;
    side: z.ZodString;
    type: z.ZodString;
    status: z.ZodString;
    price: z.ZodString;
    avgPrice: z.ZodString;
    quantity: z.ZodString;
    filledQuantity: z.ZodString;
    remainingQuantity: z.ZodString;
    reduceOnly: z.ZodBoolean;
    postOnly: z.ZodBoolean;
    clientOrderId: z.ZodOptional<z.ZodString>;
    timeInForce: z.ZodString;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    orderId: z.ZodString;
    symbol: z.ZodString;
    side: z.ZodString;
    type: z.ZodString;
    status: z.ZodString;
    price: z.ZodString;
    avgPrice: z.ZodString;
    quantity: z.ZodString;
    filledQuantity: z.ZodString;
    remainingQuantity: z.ZodString;
    reduceOnly: z.ZodBoolean;
    postOnly: z.ZodBoolean;
    clientOrderId: z.ZodOptional<z.ZodString>;
    timeInForce: z.ZodString;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface EtherealPositionResponse {
    symbol: string;
    side: string;
    size: string;
    entryPrice: string;
    markPrice: string;
    liquidationPrice: string;
    unrealizedPnl: string;
    realizedPnl: string;
    leverage: string;
    marginMode: string;
    margin: string;
    updatedAt: number;
}
export declare const EtherealPositionResponseSchema: z.ZodObject<{
    symbol: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    entryPrice: z.ZodString;
    markPrice: z.ZodString;
    liquidationPrice: z.ZodString;
    unrealizedPnl: z.ZodString;
    realizedPnl: z.ZodString;
    leverage: z.ZodString;
    marginMode: z.ZodString;
    margin: z.ZodString;
    updatedAt: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    entryPrice: z.ZodString;
    markPrice: z.ZodString;
    liquidationPrice: z.ZodString;
    unrealizedPnl: z.ZodString;
    realizedPnl: z.ZodString;
    leverage: z.ZodString;
    marginMode: z.ZodString;
    margin: z.ZodString;
    updatedAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    entryPrice: z.ZodString;
    markPrice: z.ZodString;
    liquidationPrice: z.ZodString;
    unrealizedPnl: z.ZodString;
    realizedPnl: z.ZodString;
    leverage: z.ZodString;
    marginMode: z.ZodString;
    margin: z.ZodString;
    updatedAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface EtherealBalanceResponse {
    asset: string;
    total: string;
    available: string;
    locked: string;
    updatedAt: number;
}
export declare const EtherealBalanceResponseSchema: z.ZodObject<{
    asset: z.ZodString;
    total: z.ZodString;
    available: z.ZodString;
    locked: z.ZodString;
    updatedAt: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    asset: z.ZodString;
    total: z.ZodString;
    available: z.ZodString;
    locked: z.ZodString;
    updatedAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    asset: z.ZodString;
    total: z.ZodString;
    available: z.ZodString;
    locked: z.ZodString;
    updatedAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface EtherealCandleResponse {
    timestamp: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
}
export declare const EtherealCandleResponseSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    open: z.ZodString;
    high: z.ZodString;
    low: z.ZodString;
    close: z.ZodString;
    volume: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    timestamp: z.ZodNumber;
    open: z.ZodString;
    high: z.ZodString;
    low: z.ZodString;
    close: z.ZodString;
    volume: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    timestamp: z.ZodNumber;
    open: z.ZodString;
    high: z.ZodString;
    low: z.ZodString;
    close: z.ZodString;
    volume: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export interface EtherealFundingRateResponse {
    productId: string;
    fundingRateProjected1h: string;
    fundingRate1h: string;
}
export declare const EtherealFundingRateResponseSchema: z.ZodObject<{
    productId: z.ZodString;
    fundingRateProjected1h: z.ZodString;
    fundingRate1h: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    productId: z.ZodString;
    fundingRateProjected1h: z.ZodString;
    fundingRate1h: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    productId: z.ZodString;
    fundingRateProjected1h: z.ZodString;
    fundingRate1h: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export interface EtherealCreateOrderRequest {
    symbol: string;
    side: string;
    type: string;
    quantity: string;
    price?: string;
    stopPrice?: string;
    timeInForce?: string;
    reduceOnly?: boolean;
    postOnly?: boolean;
    clientOrderId?: string;
    signature: string;
    nonce: string;
    accountId: string;
}
export type EtherealMyTradeResponse = EtherealTradeResponse;
export declare const EtherealMyTradeResponseSchema: z.ZodObject<{
    id: z.ZodString;
    productId: z.ZodString;
    price: z.ZodString;
    filled: z.ZodString;
    makerSide: z.ZodNumber;
    takerSide: z.ZodNumber;
    createdAt: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    productId: z.ZodString;
    price: z.ZodString;
    filled: z.ZodString;
    makerSide: z.ZodNumber;
    takerSide: z.ZodNumber;
    createdAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    productId: z.ZodString;
    price: z.ZodString;
    filled: z.ZodString;
    makerSide: z.ZodNumber;
    takerSide: z.ZodNumber;
    createdAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
//# sourceMappingURL=types.d.ts.map
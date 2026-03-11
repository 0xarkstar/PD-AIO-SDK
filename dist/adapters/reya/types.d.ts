/**
 * Reya Exchange-Specific Types
 */
import { z } from 'zod';
import type { ExchangeConfig } from '../../types/adapter.js';
export interface ReyaConfig extends ExchangeConfig {
    /** Ethereum wallet private key for signing */
    privateKey?: string;
    /** Account ID for trading */
    accountId?: number;
    /** Exchange ID (default: 1 for perps) */
    exchangeId?: number;
}
export interface ReyaMarketDefinition {
    symbol: string;
    marketId: number;
    minOrderQty: string;
    qtyStepSize: string;
    tickSize: string;
    liquidationMarginParameter: string;
    initialMarginParameter: string;
    maxLeverage: number;
    oiCap: string;
}
export declare const ReyaMarketDefinitionSchema: z.ZodObject<{
    symbol: z.ZodString;
    marketId: z.ZodNumber;
    minOrderQty: z.ZodString;
    qtyStepSize: z.ZodString;
    tickSize: z.ZodString;
    liquidationMarginParameter: z.ZodString;
    initialMarginParameter: z.ZodString;
    maxLeverage: z.ZodNumber;
    oiCap: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    marketId: z.ZodNumber;
    minOrderQty: z.ZodString;
    qtyStepSize: z.ZodString;
    tickSize: z.ZodString;
    liquidationMarginParameter: z.ZodString;
    initialMarginParameter: z.ZodString;
    maxLeverage: z.ZodNumber;
    oiCap: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    marketId: z.ZodNumber;
    minOrderQty: z.ZodString;
    qtyStepSize: z.ZodString;
    tickSize: z.ZodString;
    liquidationMarginParameter: z.ZodString;
    initialMarginParameter: z.ZodString;
    maxLeverage: z.ZodNumber;
    oiCap: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaMarketSummary {
    symbol: string;
    updatedAt: number;
    longOiQty: string;
    shortOiQty: string;
    oiQty: string;
    fundingRate: string;
    longFundingValue: string;
    shortFundingValue: string;
    fundingRateVelocity: string;
    volume24h: string;
    pxChange24h?: string;
    throttledOraclePrice?: string;
    throttledPoolPrice?: string;
    pricesUpdatedAt?: number;
}
export declare const ReyaMarketSummarySchema: z.ZodObject<{
    symbol: z.ZodString;
    updatedAt: z.ZodNumber;
    longOiQty: z.ZodString;
    shortOiQty: z.ZodString;
    oiQty: z.ZodString;
    fundingRate: z.ZodString;
    longFundingValue: z.ZodString;
    shortFundingValue: z.ZodString;
    fundingRateVelocity: z.ZodString;
    volume24h: z.ZodString;
    pxChange24h: z.ZodOptional<z.ZodString>;
    throttledOraclePrice: z.ZodOptional<z.ZodString>;
    throttledPoolPrice: z.ZodOptional<z.ZodString>;
    pricesUpdatedAt: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    updatedAt: z.ZodNumber;
    longOiQty: z.ZodString;
    shortOiQty: z.ZodString;
    oiQty: z.ZodString;
    fundingRate: z.ZodString;
    longFundingValue: z.ZodString;
    shortFundingValue: z.ZodString;
    fundingRateVelocity: z.ZodString;
    volume24h: z.ZodString;
    pxChange24h: z.ZodOptional<z.ZodString>;
    throttledOraclePrice: z.ZodOptional<z.ZodString>;
    throttledPoolPrice: z.ZodOptional<z.ZodString>;
    pricesUpdatedAt: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    updatedAt: z.ZodNumber;
    longOiQty: z.ZodString;
    shortOiQty: z.ZodString;
    oiQty: z.ZodString;
    fundingRate: z.ZodString;
    longFundingValue: z.ZodString;
    shortFundingValue: z.ZodString;
    fundingRateVelocity: z.ZodString;
    volume24h: z.ZodString;
    pxChange24h: z.ZodOptional<z.ZodString>;
    throttledOraclePrice: z.ZodOptional<z.ZodString>;
    throttledPoolPrice: z.ZodOptional<z.ZodString>;
    pricesUpdatedAt: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaPrice {
    symbol: string;
    oraclePrice: string;
    poolPrice?: string;
    updatedAt: number;
}
export declare const ReyaPriceSchema: z.ZodObject<{
    symbol: z.ZodString;
    oraclePrice: z.ZodString;
    poolPrice: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    oraclePrice: z.ZodString;
    poolPrice: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    oraclePrice: z.ZodString;
    poolPrice: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaDepthLevel {
    px: string;
    qty: string;
}
export declare const ReyaDepthLevelSchema: z.ZodObject<{
    px: z.ZodString;
    qty: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    px: z.ZodString;
    qty: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    px: z.ZodString;
    qty: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaDepth {
    symbol: string;
    type: 'SNAPSHOT' | 'UPDATE';
    bids: ReyaDepthLevel[];
    asks: ReyaDepthLevel[];
    updatedAt: number;
}
export declare const ReyaDepthSchema: z.ZodObject<{
    symbol: z.ZodString;
    type: z.ZodEnum<["SNAPSHOT", "UPDATE"]>;
    bids: z.ZodArray<z.ZodObject<{
        px: z.ZodString;
        qty: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        px: z.ZodString;
        qty: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        px: z.ZodString;
        qty: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    asks: z.ZodArray<z.ZodObject<{
        px: z.ZodString;
        qty: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        px: z.ZodString;
        qty: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        px: z.ZodString;
        qty: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    updatedAt: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    type: z.ZodEnum<["SNAPSHOT", "UPDATE"]>;
    bids: z.ZodArray<z.ZodObject<{
        px: z.ZodString;
        qty: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        px: z.ZodString;
        qty: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        px: z.ZodString;
        qty: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    asks: z.ZodArray<z.ZodObject<{
        px: z.ZodString;
        qty: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        px: z.ZodString;
        qty: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        px: z.ZodString;
        qty: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    updatedAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    type: z.ZodEnum<["SNAPSHOT", "UPDATE"]>;
    bids: z.ZodArray<z.ZodObject<{
        px: z.ZodString;
        qty: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        px: z.ZodString;
        qty: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        px: z.ZodString;
        qty: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    asks: z.ZodArray<z.ZodObject<{
        px: z.ZodString;
        qty: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        px: z.ZodString;
        qty: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        px: z.ZodString;
        qty: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    updatedAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaPerpExecution {
    exchangeId: number;
    symbol: string;
    accountId: number;
    qty: string;
    side: 'B' | 'A';
    price: string;
    fee: string;
    type: 'ORDER_MATCH' | 'LIQUIDATION' | 'ADL';
    timestamp: number;
    sequenceNumber: number;
}
export declare const ReyaPerpExecutionSchema: z.ZodObject<{
    exchangeId: z.ZodNumber;
    symbol: z.ZodString;
    accountId: z.ZodNumber;
    qty: z.ZodString;
    side: z.ZodEnum<["B", "A"]>;
    price: z.ZodString;
    fee: z.ZodString;
    type: z.ZodEnum<["ORDER_MATCH", "LIQUIDATION", "ADL"]>;
    timestamp: z.ZodNumber;
    sequenceNumber: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    exchangeId: z.ZodNumber;
    symbol: z.ZodString;
    accountId: z.ZodNumber;
    qty: z.ZodString;
    side: z.ZodEnum<["B", "A"]>;
    price: z.ZodString;
    fee: z.ZodString;
    type: z.ZodEnum<["ORDER_MATCH", "LIQUIDATION", "ADL"]>;
    timestamp: z.ZodNumber;
    sequenceNumber: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    exchangeId: z.ZodNumber;
    symbol: z.ZodString;
    accountId: z.ZodNumber;
    qty: z.ZodString;
    side: z.ZodEnum<["B", "A"]>;
    price: z.ZodString;
    fee: z.ZodString;
    type: z.ZodEnum<["ORDER_MATCH", "LIQUIDATION", "ADL"]>;
    timestamp: z.ZodNumber;
    sequenceNumber: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaOrder {
    exchangeId: number;
    symbol: string;
    accountId: number;
    orderId: string;
    qty?: string;
    execQty?: string;
    cumQty?: string;
    side: 'B' | 'A';
    limitPx: string;
    orderType: 'LIMIT' | 'TP' | 'SL';
    triggerPx?: string;
    timeInForce?: 'IOC' | 'GTC';
    reduceOnly?: boolean;
    status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'REJECTED';
    createdAt: number;
    lastUpdateAt: number;
}
export declare const ReyaOrderSchema: z.ZodObject<{
    exchangeId: z.ZodNumber;
    symbol: z.ZodString;
    accountId: z.ZodNumber;
    orderId: z.ZodString;
    qty: z.ZodOptional<z.ZodString>;
    execQty: z.ZodOptional<z.ZodString>;
    cumQty: z.ZodOptional<z.ZodString>;
    side: z.ZodEnum<["B", "A"]>;
    limitPx: z.ZodString;
    orderType: z.ZodEnum<["LIMIT", "TP", "SL"]>;
    triggerPx: z.ZodOptional<z.ZodString>;
    timeInForce: z.ZodOptional<z.ZodEnum<["IOC", "GTC"]>>;
    reduceOnly: z.ZodOptional<z.ZodBoolean>;
    status: z.ZodEnum<["OPEN", "FILLED", "CANCELLED", "REJECTED"]>;
    createdAt: z.ZodNumber;
    lastUpdateAt: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    exchangeId: z.ZodNumber;
    symbol: z.ZodString;
    accountId: z.ZodNumber;
    orderId: z.ZodString;
    qty: z.ZodOptional<z.ZodString>;
    execQty: z.ZodOptional<z.ZodString>;
    cumQty: z.ZodOptional<z.ZodString>;
    side: z.ZodEnum<["B", "A"]>;
    limitPx: z.ZodString;
    orderType: z.ZodEnum<["LIMIT", "TP", "SL"]>;
    triggerPx: z.ZodOptional<z.ZodString>;
    timeInForce: z.ZodOptional<z.ZodEnum<["IOC", "GTC"]>>;
    reduceOnly: z.ZodOptional<z.ZodBoolean>;
    status: z.ZodEnum<["OPEN", "FILLED", "CANCELLED", "REJECTED"]>;
    createdAt: z.ZodNumber;
    lastUpdateAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    exchangeId: z.ZodNumber;
    symbol: z.ZodString;
    accountId: z.ZodNumber;
    orderId: z.ZodString;
    qty: z.ZodOptional<z.ZodString>;
    execQty: z.ZodOptional<z.ZodString>;
    cumQty: z.ZodOptional<z.ZodString>;
    side: z.ZodEnum<["B", "A"]>;
    limitPx: z.ZodString;
    orderType: z.ZodEnum<["LIMIT", "TP", "SL"]>;
    triggerPx: z.ZodOptional<z.ZodString>;
    timeInForce: z.ZodOptional<z.ZodEnum<["IOC", "GTC"]>>;
    reduceOnly: z.ZodOptional<z.ZodBoolean>;
    status: z.ZodEnum<["OPEN", "FILLED", "CANCELLED", "REJECTED"]>;
    createdAt: z.ZodNumber;
    lastUpdateAt: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaPosition {
    exchangeId: number;
    symbol: string;
    accountId: number;
    qty: string;
    side: 'B' | 'A';
    avgEntryPrice: string;
    avgEntryFundingValue: string;
    lastTradeSequenceNumber: number;
}
export declare const ReyaPositionSchema: z.ZodObject<{
    exchangeId: z.ZodNumber;
    symbol: z.ZodString;
    accountId: z.ZodNumber;
    qty: z.ZodString;
    side: z.ZodEnum<["B", "A"]>;
    avgEntryPrice: z.ZodString;
    avgEntryFundingValue: z.ZodString;
    lastTradeSequenceNumber: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    exchangeId: z.ZodNumber;
    symbol: z.ZodString;
    accountId: z.ZodNumber;
    qty: z.ZodString;
    side: z.ZodEnum<["B", "A"]>;
    avgEntryPrice: z.ZodString;
    avgEntryFundingValue: z.ZodString;
    lastTradeSequenceNumber: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    exchangeId: z.ZodNumber;
    symbol: z.ZodString;
    accountId: z.ZodNumber;
    qty: z.ZodString;
    side: z.ZodEnum<["B", "A"]>;
    avgEntryPrice: z.ZodString;
    avgEntryFundingValue: z.ZodString;
    lastTradeSequenceNumber: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaAccountBalance {
    accountId: number;
    asset: string;
    realBalance: string;
    balanceDEPRECATED: string;
}
export declare const ReyaAccountBalanceSchema: z.ZodObject<{
    accountId: z.ZodNumber;
    asset: z.ZodString;
    realBalance: z.ZodString;
    balanceDEPRECATED: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    accountId: z.ZodNumber;
    asset: z.ZodString;
    realBalance: z.ZodString;
    balanceDEPRECATED: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    accountId: z.ZodNumber;
    asset: z.ZodString;
    realBalance: z.ZodString;
    balanceDEPRECATED: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaAccount {
    accountId: number;
    name: string;
    type: 'MAINPERP' | 'SUBPERP' | 'SPOT';
}
export declare const ReyaAccountSchema: z.ZodObject<{
    accountId: z.ZodNumber;
    name: z.ZodString;
    type: z.ZodEnum<["MAINPERP", "SUBPERP", "SPOT"]>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    accountId: z.ZodNumber;
    name: z.ZodString;
    type: z.ZodEnum<["MAINPERP", "SUBPERP", "SPOT"]>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    accountId: z.ZodNumber;
    name: z.ZodString;
    type: z.ZodEnum<["MAINPERP", "SUBPERP", "SPOT"]>;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaCandleHistoryData {
    t: number[];
    o: string[];
    h: string[];
    l: string[];
    c: string[];
}
export declare const ReyaCandleHistoryDataSchema: z.ZodObject<{
    t: z.ZodArray<z.ZodNumber, "many">;
    o: z.ZodArray<z.ZodString, "many">;
    h: z.ZodArray<z.ZodString, "many">;
    l: z.ZodArray<z.ZodString, "many">;
    c: z.ZodArray<z.ZodString, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    t: z.ZodArray<z.ZodNumber, "many">;
    o: z.ZodArray<z.ZodString, "many">;
    h: z.ZodArray<z.ZodString, "many">;
    l: z.ZodArray<z.ZodString, "many">;
    c: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    t: z.ZodArray<z.ZodNumber, "many">;
    o: z.ZodArray<z.ZodString, "many">;
    h: z.ZodArray<z.ZodString, "many">;
    l: z.ZodArray<z.ZodString, "many">;
    c: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaCreateOrderRequest {
    exchangeId: number;
    symbol?: string;
    accountId: number;
    isBuy: boolean;
    limitPx: string;
    qty?: string;
    orderType: 'LIMIT' | 'TP' | 'SL';
    timeInForce?: 'IOC' | 'GTC';
    triggerPx?: string;
    reduceOnly?: boolean;
    signature: string;
    nonce: string;
    signerWallet: string;
    expiresAfter?: number;
    clientOrderId?: number;
}
export interface ReyaCreateOrderResponse {
    status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'REJECTED';
    execQty?: string;
    cumQty?: string;
    orderId?: string;
    clientOrderId?: number;
}
export declare const ReyaCreateOrderResponseSchema: z.ZodObject<{
    status: z.ZodEnum<["OPEN", "FILLED", "CANCELLED", "REJECTED"]>;
    execQty: z.ZodOptional<z.ZodString>;
    cumQty: z.ZodOptional<z.ZodString>;
    orderId: z.ZodOptional<z.ZodString>;
    clientOrderId: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    status: z.ZodEnum<["OPEN", "FILLED", "CANCELLED", "REJECTED"]>;
    execQty: z.ZodOptional<z.ZodString>;
    cumQty: z.ZodOptional<z.ZodString>;
    orderId: z.ZodOptional<z.ZodString>;
    clientOrderId: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    status: z.ZodEnum<["OPEN", "FILLED", "CANCELLED", "REJECTED"]>;
    execQty: z.ZodOptional<z.ZodString>;
    cumQty: z.ZodOptional<z.ZodString>;
    orderId: z.ZodOptional<z.ZodString>;
    clientOrderId: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaCancelOrderResponse {
    status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'REJECTED';
    orderId: string;
    clientOrderId?: number;
}
export declare const ReyaCancelOrderResponseSchema: z.ZodObject<{
    status: z.ZodEnum<["OPEN", "FILLED", "CANCELLED", "REJECTED"]>;
    orderId: z.ZodString;
    clientOrderId: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    status: z.ZodEnum<["OPEN", "FILLED", "CANCELLED", "REJECTED"]>;
    orderId: z.ZodString;
    clientOrderId: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    status: z.ZodEnum<["OPEN", "FILLED", "CANCELLED", "REJECTED"]>;
    orderId: z.ZodString;
    clientOrderId: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaMassCancelResponse {
    cancelledCount: number;
}
export declare const ReyaMassCancelResponseSchema: z.ZodObject<{
    cancelledCount: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    cancelledCount: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    cancelledCount: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaPerpExecutionList {
    data: ReyaPerpExecution[];
    meta: {
        limit: number;
        count: number;
        endTime?: number;
        startTime?: number;
    };
}
export declare const ReyaPerpExecutionListSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        exchangeId: z.ZodNumber;
        symbol: z.ZodString;
        accountId: z.ZodNumber;
        qty: z.ZodString;
        side: z.ZodEnum<["B", "A"]>;
        price: z.ZodString;
        fee: z.ZodString;
        type: z.ZodEnum<["ORDER_MATCH", "LIQUIDATION", "ADL"]>;
        timestamp: z.ZodNumber;
        sequenceNumber: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        exchangeId: z.ZodNumber;
        symbol: z.ZodString;
        accountId: z.ZodNumber;
        qty: z.ZodString;
        side: z.ZodEnum<["B", "A"]>;
        price: z.ZodString;
        fee: z.ZodString;
        type: z.ZodEnum<["ORDER_MATCH", "LIQUIDATION", "ADL"]>;
        timestamp: z.ZodNumber;
        sequenceNumber: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        exchangeId: z.ZodNumber;
        symbol: z.ZodString;
        accountId: z.ZodNumber;
        qty: z.ZodString;
        side: z.ZodEnum<["B", "A"]>;
        price: z.ZodString;
        fee: z.ZodString;
        type: z.ZodEnum<["ORDER_MATCH", "LIQUIDATION", "ADL"]>;
        timestamp: z.ZodNumber;
        sequenceNumber: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    meta: z.ZodObject<{
        limit: z.ZodNumber;
        count: z.ZodNumber;
        endTime: z.ZodOptional<z.ZodNumber>;
        startTime: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        limit: z.ZodNumber;
        count: z.ZodNumber;
        endTime: z.ZodOptional<z.ZodNumber>;
        startTime: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        limit: z.ZodNumber;
        count: z.ZodNumber;
        endTime: z.ZodOptional<z.ZodNumber>;
        startTime: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    data: z.ZodArray<z.ZodObject<{
        exchangeId: z.ZodNumber;
        symbol: z.ZodString;
        accountId: z.ZodNumber;
        qty: z.ZodString;
        side: z.ZodEnum<["B", "A"]>;
        price: z.ZodString;
        fee: z.ZodString;
        type: z.ZodEnum<["ORDER_MATCH", "LIQUIDATION", "ADL"]>;
        timestamp: z.ZodNumber;
        sequenceNumber: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        exchangeId: z.ZodNumber;
        symbol: z.ZodString;
        accountId: z.ZodNumber;
        qty: z.ZodString;
        side: z.ZodEnum<["B", "A"]>;
        price: z.ZodString;
        fee: z.ZodString;
        type: z.ZodEnum<["ORDER_MATCH", "LIQUIDATION", "ADL"]>;
        timestamp: z.ZodNumber;
        sequenceNumber: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        exchangeId: z.ZodNumber;
        symbol: z.ZodString;
        accountId: z.ZodNumber;
        qty: z.ZodString;
        side: z.ZodEnum<["B", "A"]>;
        price: z.ZodString;
        fee: z.ZodString;
        type: z.ZodEnum<["ORDER_MATCH", "LIQUIDATION", "ADL"]>;
        timestamp: z.ZodNumber;
        sequenceNumber: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    meta: z.ZodObject<{
        limit: z.ZodNumber;
        count: z.ZodNumber;
        endTime: z.ZodOptional<z.ZodNumber>;
        startTime: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        limit: z.ZodNumber;
        count: z.ZodNumber;
        endTime: z.ZodOptional<z.ZodNumber>;
        startTime: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        limit: z.ZodNumber;
        count: z.ZodNumber;
        endTime: z.ZodOptional<z.ZodNumber>;
        startTime: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    data: z.ZodArray<z.ZodObject<{
        exchangeId: z.ZodNumber;
        symbol: z.ZodString;
        accountId: z.ZodNumber;
        qty: z.ZodString;
        side: z.ZodEnum<["B", "A"]>;
        price: z.ZodString;
        fee: z.ZodString;
        type: z.ZodEnum<["ORDER_MATCH", "LIQUIDATION", "ADL"]>;
        timestamp: z.ZodNumber;
        sequenceNumber: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        exchangeId: z.ZodNumber;
        symbol: z.ZodString;
        accountId: z.ZodNumber;
        qty: z.ZodString;
        side: z.ZodEnum<["B", "A"]>;
        price: z.ZodString;
        fee: z.ZodString;
        type: z.ZodEnum<["ORDER_MATCH", "LIQUIDATION", "ADL"]>;
        timestamp: z.ZodNumber;
        sequenceNumber: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        exchangeId: z.ZodNumber;
        symbol: z.ZodString;
        accountId: z.ZodNumber;
        qty: z.ZodString;
        side: z.ZodEnum<["B", "A"]>;
        price: z.ZodString;
        fee: z.ZodString;
        type: z.ZodEnum<["ORDER_MATCH", "LIQUIDATION", "ADL"]>;
        timestamp: z.ZodNumber;
        sequenceNumber: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    meta: z.ZodObject<{
        limit: z.ZodNumber;
        count: z.ZodNumber;
        endTime: z.ZodOptional<z.ZodNumber>;
        startTime: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        limit: z.ZodNumber;
        count: z.ZodNumber;
        endTime: z.ZodOptional<z.ZodNumber>;
        startTime: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        limit: z.ZodNumber;
        count: z.ZodNumber;
        endTime: z.ZodOptional<z.ZodNumber>;
        startTime: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaAssetDefinition {
    asset: string;
    spotMarketSymbol?: string;
    priceHaircut: string;
    liquidationDiscount: string;
    status: 'ENABLED' | 'WITHDRAWAL_ONLY';
    decimals: number;
    displayDecimals: number;
}
export declare const ReyaAssetDefinitionSchema: z.ZodObject<{
    asset: z.ZodString;
    spotMarketSymbol: z.ZodOptional<z.ZodString>;
    priceHaircut: z.ZodString;
    liquidationDiscount: z.ZodString;
    status: z.ZodEnum<["ENABLED", "WITHDRAWAL_ONLY"]>;
    decimals: z.ZodNumber;
    displayDecimals: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    asset: z.ZodString;
    spotMarketSymbol: z.ZodOptional<z.ZodString>;
    priceHaircut: z.ZodString;
    liquidationDiscount: z.ZodString;
    status: z.ZodEnum<["ENABLED", "WITHDRAWAL_ONLY"]>;
    decimals: z.ZodNumber;
    displayDecimals: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    asset: z.ZodString;
    spotMarketSymbol: z.ZodOptional<z.ZodString>;
    priceHaircut: z.ZodString;
    liquidationDiscount: z.ZodString;
    status: z.ZodEnum<["ENABLED", "WITHDRAWAL_ONLY"]>;
    decimals: z.ZodNumber;
    displayDecimals: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaFeeTierParameters {
    tierId: number;
    takerFee: string;
    makerFee: string;
    volume14d: string;
    tierType: 'REGULAR' | 'VIP';
}
export declare const ReyaFeeTierParametersSchema: z.ZodObject<{
    tierId: z.ZodNumber;
    takerFee: z.ZodString;
    makerFee: z.ZodString;
    volume14d: z.ZodString;
    tierType: z.ZodEnum<["REGULAR", "VIP"]>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    tierId: z.ZodNumber;
    takerFee: z.ZodString;
    makerFee: z.ZodString;
    volume14d: z.ZodString;
    tierType: z.ZodEnum<["REGULAR", "VIP"]>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    tierId: z.ZodNumber;
    takerFee: z.ZodString;
    makerFee: z.ZodString;
    volume14d: z.ZodString;
    tierType: z.ZodEnum<["REGULAR", "VIP"]>;
}, z.ZodTypeAny, "passthrough">>;
export interface ReyaRequestError {
    error: string;
    message: string;
}
//# sourceMappingURL=types.d.ts.map
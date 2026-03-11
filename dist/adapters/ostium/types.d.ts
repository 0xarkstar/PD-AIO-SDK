/**
 * Ostium Exchange-Specific Types
 */
import { z } from 'zod';
import type { ExchangeConfig } from '../../types/adapter.js';
export interface OstiumConfig extends ExchangeConfig {
    /** Arbitrum RPC URL */
    rpcUrl?: string;
    /** EVM private key for signing transactions */
    privateKey?: string;
    /** Subgraph URL */
    subgraphUrl?: string;
    /** Metadata API URL */
    metadataUrl?: string;
    /** Referral/builder address for Ostium fee attribution (Ethereum address) */
    referralAddress?: string;
}
export interface OstiumPairInfo {
    pairIndex: number;
    name: string;
    from: string;
    to: string;
    groupIndex: number;
    groupName: string;
    spreadP: string;
    maxLeverage: number;
    minLeverage: number;
    maxPositionSize: string;
    minPositionSize: string;
    feedId: string;
}
export interface OstiumPriceResponse {
    pair: string;
    price: string;
    timestamp: number;
    source: string;
    mid?: string | number;
    bid?: string | number;
    ask?: string | number;
    timestampSeconds?: number;
}
export interface OstiumTradeParams {
    pairIndex: number;
    positionSizeDai: string;
    openPrice: string;
    buy: boolean;
    leverage: number;
    tp: string;
    sl: string;
    referral: string;
}
export interface OstiumOpenTrade {
    trader: string;
    pairIndex: number;
    index: number;
    positionSizeDai: string;
    openPrice: string;
    buy: boolean;
    leverage: number;
    tp: string;
    sl: string;
    timestamp: number;
}
export interface OstiumSubgraphTrade {
    id: string;
    trader: string;
    pairIndex: string;
    action: string;
    price: string;
    size: string;
    buy: boolean;
    leverage: string;
    pnl: string;
    timestamp: string;
    txHash: string;
}
export interface OstiumSubgraphPosition {
    id: string;
    trader: string;
    pairIndex: string;
    index: string;
    positionSizeDai: string;
    openPrice: string;
    buy: boolean;
    leverage: string;
    tp: string;
    sl: string;
    timestamp: string;
}
export interface OstiumContractAddresses {
    trading: string;
    storage: string;
    pairInfo: string;
    nftRewards: string;
    vault: string;
    collateral: string;
}
export declare const OstiumPairInfoSchema: z.ZodObject<{
    pairIndex: z.ZodNumber;
    name: z.ZodString;
    from: z.ZodString;
    to: z.ZodString;
    groupIndex: z.ZodNumber;
    groupName: z.ZodString;
    spreadP: z.ZodString;
    maxLeverage: z.ZodNumber;
    minLeverage: z.ZodNumber;
    maxPositionSize: z.ZodString;
    minPositionSize: z.ZodString;
    feedId: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    pairIndex: z.ZodNumber;
    name: z.ZodString;
    from: z.ZodString;
    to: z.ZodString;
    groupIndex: z.ZodNumber;
    groupName: z.ZodString;
    spreadP: z.ZodString;
    maxLeverage: z.ZodNumber;
    minLeverage: z.ZodNumber;
    maxPositionSize: z.ZodString;
    minPositionSize: z.ZodString;
    feedId: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    pairIndex: z.ZodNumber;
    name: z.ZodString;
    from: z.ZodString;
    to: z.ZodString;
    groupIndex: z.ZodNumber;
    groupName: z.ZodString;
    spreadP: z.ZodString;
    maxLeverage: z.ZodNumber;
    minLeverage: z.ZodNumber;
    maxPositionSize: z.ZodString;
    minPositionSize: z.ZodString;
    feedId: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const OstiumPriceResponseSchema: z.ZodObject<{
    pair: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    source: z.ZodOptional<z.ZodString>;
    mid: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    bid: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    ask: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    timestampSeconds: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    pair: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    source: z.ZodOptional<z.ZodString>;
    mid: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    bid: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    ask: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    timestampSeconds: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    pair: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    source: z.ZodOptional<z.ZodString>;
    mid: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    bid: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    ask: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    timestampSeconds: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export declare const OstiumOpenTradeSchema: z.ZodObject<{
    trader: z.ZodString;
    pairIndex: z.ZodNumber;
    index: z.ZodNumber;
    positionSizeDai: z.ZodString;
    openPrice: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodNumber;
    tp: z.ZodString;
    sl: z.ZodString;
    timestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    trader: z.ZodString;
    pairIndex: z.ZodNumber;
    index: z.ZodNumber;
    positionSizeDai: z.ZodString;
    openPrice: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodNumber;
    tp: z.ZodString;
    sl: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    trader: z.ZodString;
    pairIndex: z.ZodNumber;
    index: z.ZodNumber;
    positionSizeDai: z.ZodString;
    openPrice: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodNumber;
    tp: z.ZodString;
    sl: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const OstiumSubgraphTradeSchema: z.ZodObject<{
    id: z.ZodString;
    trader: z.ZodString;
    pairIndex: z.ZodString;
    action: z.ZodString;
    price: z.ZodString;
    size: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodString;
    pnl: z.ZodString;
    timestamp: z.ZodString;
    txHash: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    trader: z.ZodString;
    pairIndex: z.ZodString;
    action: z.ZodString;
    price: z.ZodString;
    size: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodString;
    pnl: z.ZodString;
    timestamp: z.ZodString;
    txHash: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    trader: z.ZodString;
    pairIndex: z.ZodString;
    action: z.ZodString;
    price: z.ZodString;
    size: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodString;
    pnl: z.ZodString;
    timestamp: z.ZodString;
    txHash: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const OstiumSubgraphPositionSchema: z.ZodObject<{
    id: z.ZodString;
    trader: z.ZodString;
    pairIndex: z.ZodString;
    index: z.ZodString;
    positionSizeDai: z.ZodString;
    openPrice: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodString;
    tp: z.ZodString;
    sl: z.ZodString;
    timestamp: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    trader: z.ZodString;
    pairIndex: z.ZodString;
    index: z.ZodString;
    positionSizeDai: z.ZodString;
    openPrice: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodString;
    tp: z.ZodString;
    sl: z.ZodString;
    timestamp: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    trader: z.ZodString;
    pairIndex: z.ZodString;
    index: z.ZodString;
    positionSizeDai: z.ZodString;
    openPrice: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodString;
    tp: z.ZodString;
    sl: z.ZodString;
    timestamp: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
//# sourceMappingURL=types.d.ts.map
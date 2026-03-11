/**
 * Avantis Exchange-Specific Types
 */
import { z } from 'zod';
import type { ExchangeConfig } from '../../types/adapter.js';
export interface AvantisConfig extends ExchangeConfig {
    /** Ethereum wallet private key for on-chain transactions */
    privateKey?: string;
    /** RPC URL for Base chain */
    rpcUrl?: string;
    /** Override trading contract address */
    contractAddress?: string;
}
export interface AvantisPairInfo {
    pairIndex: number;
    from: string;
    to: string;
    spreadP: string;
    groupIndex: number;
    feeIndex: number;
}
export declare const AvantisPairInfoSchema: z.ZodObject<{
    pairIndex: z.ZodNumber;
    from: z.ZodString;
    to: z.ZodString;
    spreadP: z.ZodString;
    groupIndex: z.ZodNumber;
    feeIndex: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    pairIndex: z.ZodNumber;
    from: z.ZodString;
    to: z.ZodString;
    spreadP: z.ZodString;
    groupIndex: z.ZodNumber;
    feeIndex: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    pairIndex: z.ZodNumber;
    from: z.ZodString;
    to: z.ZodString;
    spreadP: z.ZodString;
    groupIndex: z.ZodNumber;
    feeIndex: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface AvantisOpenTrade {
    trader: string;
    pairIndex: number;
    index: number;
    initialPosToken: string;
    positionSizeDai: string;
    openPrice: string;
    buy: boolean;
    leverage: string;
    tp: string;
    sl: string;
}
export declare const AvantisOpenTradeSchema: z.ZodObject<{
    trader: z.ZodString;
    pairIndex: z.ZodNumber;
    index: z.ZodNumber;
    initialPosToken: z.ZodString;
    positionSizeDai: z.ZodString;
    openPrice: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodString;
    tp: z.ZodString;
    sl: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    trader: z.ZodString;
    pairIndex: z.ZodNumber;
    index: z.ZodNumber;
    initialPosToken: z.ZodString;
    positionSizeDai: z.ZodString;
    openPrice: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodString;
    tp: z.ZodString;
    sl: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    trader: z.ZodString;
    pairIndex: z.ZodNumber;
    index: z.ZodNumber;
    initialPosToken: z.ZodString;
    positionSizeDai: z.ZodString;
    openPrice: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodString;
    tp: z.ZodString;
    sl: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export interface AvantisOpenLimitOrder {
    trader: string;
    pairIndex: number;
    index: number;
    positionSize: string;
    buy: boolean;
    leverage: string;
    tp: string;
    sl: string;
    minPrice: string;
    maxPrice: string;
    block: number;
    tokenId: number;
}
export declare const AvantisOpenLimitOrderSchema: z.ZodObject<{
    trader: z.ZodString;
    pairIndex: z.ZodNumber;
    index: z.ZodNumber;
    positionSize: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodString;
    tp: z.ZodString;
    sl: z.ZodString;
    minPrice: z.ZodString;
    maxPrice: z.ZodString;
    block: z.ZodNumber;
    tokenId: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    trader: z.ZodString;
    pairIndex: z.ZodNumber;
    index: z.ZodNumber;
    positionSize: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodString;
    tp: z.ZodString;
    sl: z.ZodString;
    minPrice: z.ZodString;
    maxPrice: z.ZodString;
    block: z.ZodNumber;
    tokenId: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    trader: z.ZodString;
    pairIndex: z.ZodNumber;
    index: z.ZodNumber;
    positionSize: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodString;
    tp: z.ZodString;
    sl: z.ZodString;
    minPrice: z.ZodString;
    maxPrice: z.ZodString;
    block: z.ZodNumber;
    tokenId: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface AvantisPythPrice {
    price: string;
    conf: string;
    expo: number;
    publishTime: number;
}
export declare const AvantisPythPriceSchema: z.ZodObject<{
    price: z.ZodString;
    conf: z.ZodString;
    expo: z.ZodNumber;
    publishTime: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    price: z.ZodString;
    conf: z.ZodString;
    expo: z.ZodNumber;
    publishTime: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    price: z.ZodString;
    conf: z.ZodString;
    expo: z.ZodNumber;
    publishTime: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface AvantisFundingFees {
    accPerOiLong: string;
    accPerOiShort: string;
    lastUpdateBlock: number;
}
export declare const AvantisFundingFeesSchema: z.ZodObject<{
    accPerOiLong: z.ZodString;
    accPerOiShort: z.ZodString;
    lastUpdateBlock: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    accPerOiLong: z.ZodString;
    accPerOiShort: z.ZodString;
    lastUpdateBlock: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    accPerOiLong: z.ZodString;
    accPerOiShort: z.ZodString;
    lastUpdateBlock: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface AvantisOrderParams {
    trader: string;
    pairIndex: number;
    index: number;
    initialPosToken: number;
    positionSizeDai: string;
    openPrice: string;
    buy: boolean;
    leverage: number;
    tp: string;
    sl: string;
}
export declare const AvantisOrderParamsSchema: z.ZodObject<{
    trader: z.ZodString;
    pairIndex: z.ZodNumber;
    index: z.ZodNumber;
    initialPosToken: z.ZodNumber;
    positionSizeDai: z.ZodString;
    openPrice: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodNumber;
    tp: z.ZodString;
    sl: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    trader: z.ZodString;
    pairIndex: z.ZodNumber;
    index: z.ZodNumber;
    initialPosToken: z.ZodNumber;
    positionSizeDai: z.ZodString;
    openPrice: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodNumber;
    tp: z.ZodString;
    sl: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    trader: z.ZodString;
    pairIndex: z.ZodNumber;
    index: z.ZodNumber;
    initialPosToken: z.ZodNumber;
    positionSizeDai: z.ZodString;
    openPrice: z.ZodString;
    buy: z.ZodBoolean;
    leverage: z.ZodNumber;
    tp: z.ZodString;
    sl: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export interface AvantisBalance {
    asset: string;
    balance: string;
    decimals: number;
}
export declare const AvantisBalanceSchema: z.ZodObject<{
    asset: z.ZodString;
    balance: z.ZodString;
    decimals: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    asset: z.ZodString;
    balance: z.ZodString;
    decimals: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    asset: z.ZodString;
    balance: z.ZodString;
    decimals: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
//# sourceMappingURL=types.d.ts.map
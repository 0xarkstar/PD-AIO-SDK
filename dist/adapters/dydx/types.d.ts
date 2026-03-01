/**
 * dYdX v4 Exchange-Specific Types
 *
 * Type definitions for dYdX v4 Indexer API responses and WebSocket messages
 */
import { z } from 'zod';
export interface DydxPerpetualMarket {
    /** Market ticker (e.g., "BTC-USD") */
    ticker: string;
    /** Market status */
    status: 'ACTIVE' | 'PAUSED' | 'CANCEL_ONLY' | 'POST_ONLY' | 'INITIALIZING' | 'FINAL_SETTLEMENT';
    /** Base asset */
    baseAsset: string;
    /** Quote asset (USD) */
    quoteAsset: string;
    /** Oracle price */
    oraclePrice: string;
    /** Price change over 24h */
    priceChange24H: string;
    /** 24h trading volume */
    volume24H: string;
    /** Number of trades in 24h */
    trades24H: number;
    /** Open interest */
    openInterest: string;
    /** Open interest in USD */
    openInterestUSDC: string;
    /** Next funding rate */
    nextFundingRate: string;
    /** Next funding at timestamp */
    nextFundingAt: string;
    /** Initial margin fraction */
    initialMarginFraction: string;
    /** Maintenance margin fraction */
    maintenanceMarginFraction: string;
    /** Step size for order amounts */
    stepSize: string;
    /** Step base quantums */
    stepBaseQuantums: number;
    /** Subticks per tick */
    subticksPerTick: number;
    /** Tick size for prices */
    tickSize: string;
    /** Atomic resolution */
    atomicResolution: number;
    /** Quantum conversion exponent */
    quantumConversionExponent: number;
    /** Base position notional */
    basePositionNotional?: string;
}
export declare const DydxPerpetualMarketSchema: z.ZodObject<{
    ticker: z.ZodString;
    status: z.ZodOptional<z.ZodString>;
    baseAsset: z.ZodOptional<z.ZodString>;
    quoteAsset: z.ZodOptional<z.ZodString>;
    oraclePrice: z.ZodOptional<z.ZodString>;
    priceChange24H: z.ZodOptional<z.ZodString>;
    volume24H: z.ZodOptional<z.ZodString>;
    trades24H: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    openInterest: z.ZodOptional<z.ZodString>;
    openInterestUSDC: z.ZodOptional<z.ZodString>;
    nextFundingRate: z.ZodOptional<z.ZodString>;
    nextFundingAt: z.ZodOptional<z.ZodString>;
    initialMarginFraction: z.ZodOptional<z.ZodString>;
    maintenanceMarginFraction: z.ZodOptional<z.ZodString>;
    stepSize: z.ZodOptional<z.ZodString>;
    stepBaseQuantums: z.ZodOptional<z.ZodNumber>;
    subticksPerTick: z.ZodOptional<z.ZodNumber>;
    tickSize: z.ZodOptional<z.ZodString>;
    atomicResolution: z.ZodOptional<z.ZodNumber>;
    quantumConversionExponent: z.ZodOptional<z.ZodNumber>;
    basePositionNotional: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    ticker: z.ZodString;
    status: z.ZodOptional<z.ZodString>;
    baseAsset: z.ZodOptional<z.ZodString>;
    quoteAsset: z.ZodOptional<z.ZodString>;
    oraclePrice: z.ZodOptional<z.ZodString>;
    priceChange24H: z.ZodOptional<z.ZodString>;
    volume24H: z.ZodOptional<z.ZodString>;
    trades24H: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    openInterest: z.ZodOptional<z.ZodString>;
    openInterestUSDC: z.ZodOptional<z.ZodString>;
    nextFundingRate: z.ZodOptional<z.ZodString>;
    nextFundingAt: z.ZodOptional<z.ZodString>;
    initialMarginFraction: z.ZodOptional<z.ZodString>;
    maintenanceMarginFraction: z.ZodOptional<z.ZodString>;
    stepSize: z.ZodOptional<z.ZodString>;
    stepBaseQuantums: z.ZodOptional<z.ZodNumber>;
    subticksPerTick: z.ZodOptional<z.ZodNumber>;
    tickSize: z.ZodOptional<z.ZodString>;
    atomicResolution: z.ZodOptional<z.ZodNumber>;
    quantumConversionExponent: z.ZodOptional<z.ZodNumber>;
    basePositionNotional: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    ticker: z.ZodString;
    status: z.ZodOptional<z.ZodString>;
    baseAsset: z.ZodOptional<z.ZodString>;
    quoteAsset: z.ZodOptional<z.ZodString>;
    oraclePrice: z.ZodOptional<z.ZodString>;
    priceChange24H: z.ZodOptional<z.ZodString>;
    volume24H: z.ZodOptional<z.ZodString>;
    trades24H: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    openInterest: z.ZodOptional<z.ZodString>;
    openInterestUSDC: z.ZodOptional<z.ZodString>;
    nextFundingRate: z.ZodOptional<z.ZodString>;
    nextFundingAt: z.ZodOptional<z.ZodString>;
    initialMarginFraction: z.ZodOptional<z.ZodString>;
    maintenanceMarginFraction: z.ZodOptional<z.ZodString>;
    stepSize: z.ZodOptional<z.ZodString>;
    stepBaseQuantums: z.ZodOptional<z.ZodNumber>;
    subticksPerTick: z.ZodOptional<z.ZodNumber>;
    tickSize: z.ZodOptional<z.ZodString>;
    atomicResolution: z.ZodOptional<z.ZodNumber>;
    quantumConversionExponent: z.ZodOptional<z.ZodNumber>;
    basePositionNotional: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxPerpetualMarketsResponse {
    markets: Record<string, DydxPerpetualMarket>;
}
export declare const DydxPerpetualMarketsResponseSchema: z.ZodObject<{
    markets: z.ZodRecord<z.ZodString, z.ZodObject<{
        ticker: z.ZodString;
        status: z.ZodOptional<z.ZodString>;
        baseAsset: z.ZodOptional<z.ZodString>;
        quoteAsset: z.ZodOptional<z.ZodString>;
        oraclePrice: z.ZodOptional<z.ZodString>;
        priceChange24H: z.ZodOptional<z.ZodString>;
        volume24H: z.ZodOptional<z.ZodString>;
        trades24H: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        openInterest: z.ZodOptional<z.ZodString>;
        openInterestUSDC: z.ZodOptional<z.ZodString>;
        nextFundingRate: z.ZodOptional<z.ZodString>;
        nextFundingAt: z.ZodOptional<z.ZodString>;
        initialMarginFraction: z.ZodOptional<z.ZodString>;
        maintenanceMarginFraction: z.ZodOptional<z.ZodString>;
        stepSize: z.ZodOptional<z.ZodString>;
        stepBaseQuantums: z.ZodOptional<z.ZodNumber>;
        subticksPerTick: z.ZodOptional<z.ZodNumber>;
        tickSize: z.ZodOptional<z.ZodString>;
        atomicResolution: z.ZodOptional<z.ZodNumber>;
        quantumConversionExponent: z.ZodOptional<z.ZodNumber>;
        basePositionNotional: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        ticker: z.ZodString;
        status: z.ZodOptional<z.ZodString>;
        baseAsset: z.ZodOptional<z.ZodString>;
        quoteAsset: z.ZodOptional<z.ZodString>;
        oraclePrice: z.ZodOptional<z.ZodString>;
        priceChange24H: z.ZodOptional<z.ZodString>;
        volume24H: z.ZodOptional<z.ZodString>;
        trades24H: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        openInterest: z.ZodOptional<z.ZodString>;
        openInterestUSDC: z.ZodOptional<z.ZodString>;
        nextFundingRate: z.ZodOptional<z.ZodString>;
        nextFundingAt: z.ZodOptional<z.ZodString>;
        initialMarginFraction: z.ZodOptional<z.ZodString>;
        maintenanceMarginFraction: z.ZodOptional<z.ZodString>;
        stepSize: z.ZodOptional<z.ZodString>;
        stepBaseQuantums: z.ZodOptional<z.ZodNumber>;
        subticksPerTick: z.ZodOptional<z.ZodNumber>;
        tickSize: z.ZodOptional<z.ZodString>;
        atomicResolution: z.ZodOptional<z.ZodNumber>;
        quantumConversionExponent: z.ZodOptional<z.ZodNumber>;
        basePositionNotional: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        ticker: z.ZodString;
        status: z.ZodOptional<z.ZodString>;
        baseAsset: z.ZodOptional<z.ZodString>;
        quoteAsset: z.ZodOptional<z.ZodString>;
        oraclePrice: z.ZodOptional<z.ZodString>;
        priceChange24H: z.ZodOptional<z.ZodString>;
        volume24H: z.ZodOptional<z.ZodString>;
        trades24H: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        openInterest: z.ZodOptional<z.ZodString>;
        openInterestUSDC: z.ZodOptional<z.ZodString>;
        nextFundingRate: z.ZodOptional<z.ZodString>;
        nextFundingAt: z.ZodOptional<z.ZodString>;
        initialMarginFraction: z.ZodOptional<z.ZodString>;
        maintenanceMarginFraction: z.ZodOptional<z.ZodString>;
        stepSize: z.ZodOptional<z.ZodString>;
        stepBaseQuantums: z.ZodOptional<z.ZodNumber>;
        subticksPerTick: z.ZodOptional<z.ZodNumber>;
        tickSize: z.ZodOptional<z.ZodString>;
        atomicResolution: z.ZodOptional<z.ZodNumber>;
        quantumConversionExponent: z.ZodOptional<z.ZodNumber>;
        basePositionNotional: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    markets: z.ZodRecord<z.ZodString, z.ZodObject<{
        ticker: z.ZodString;
        status: z.ZodOptional<z.ZodString>;
        baseAsset: z.ZodOptional<z.ZodString>;
        quoteAsset: z.ZodOptional<z.ZodString>;
        oraclePrice: z.ZodOptional<z.ZodString>;
        priceChange24H: z.ZodOptional<z.ZodString>;
        volume24H: z.ZodOptional<z.ZodString>;
        trades24H: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        openInterest: z.ZodOptional<z.ZodString>;
        openInterestUSDC: z.ZodOptional<z.ZodString>;
        nextFundingRate: z.ZodOptional<z.ZodString>;
        nextFundingAt: z.ZodOptional<z.ZodString>;
        initialMarginFraction: z.ZodOptional<z.ZodString>;
        maintenanceMarginFraction: z.ZodOptional<z.ZodString>;
        stepSize: z.ZodOptional<z.ZodString>;
        stepBaseQuantums: z.ZodOptional<z.ZodNumber>;
        subticksPerTick: z.ZodOptional<z.ZodNumber>;
        tickSize: z.ZodOptional<z.ZodString>;
        atomicResolution: z.ZodOptional<z.ZodNumber>;
        quantumConversionExponent: z.ZodOptional<z.ZodNumber>;
        basePositionNotional: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        ticker: z.ZodString;
        status: z.ZodOptional<z.ZodString>;
        baseAsset: z.ZodOptional<z.ZodString>;
        quoteAsset: z.ZodOptional<z.ZodString>;
        oraclePrice: z.ZodOptional<z.ZodString>;
        priceChange24H: z.ZodOptional<z.ZodString>;
        volume24H: z.ZodOptional<z.ZodString>;
        trades24H: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        openInterest: z.ZodOptional<z.ZodString>;
        openInterestUSDC: z.ZodOptional<z.ZodString>;
        nextFundingRate: z.ZodOptional<z.ZodString>;
        nextFundingAt: z.ZodOptional<z.ZodString>;
        initialMarginFraction: z.ZodOptional<z.ZodString>;
        maintenanceMarginFraction: z.ZodOptional<z.ZodString>;
        stepSize: z.ZodOptional<z.ZodString>;
        stepBaseQuantums: z.ZodOptional<z.ZodNumber>;
        subticksPerTick: z.ZodOptional<z.ZodNumber>;
        tickSize: z.ZodOptional<z.ZodString>;
        atomicResolution: z.ZodOptional<z.ZodNumber>;
        quantumConversionExponent: z.ZodOptional<z.ZodNumber>;
        basePositionNotional: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        ticker: z.ZodString;
        status: z.ZodOptional<z.ZodString>;
        baseAsset: z.ZodOptional<z.ZodString>;
        quoteAsset: z.ZodOptional<z.ZodString>;
        oraclePrice: z.ZodOptional<z.ZodString>;
        priceChange24H: z.ZodOptional<z.ZodString>;
        volume24H: z.ZodOptional<z.ZodString>;
        trades24H: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        openInterest: z.ZodOptional<z.ZodString>;
        openInterestUSDC: z.ZodOptional<z.ZodString>;
        nextFundingRate: z.ZodOptional<z.ZodString>;
        nextFundingAt: z.ZodOptional<z.ZodString>;
        initialMarginFraction: z.ZodOptional<z.ZodString>;
        maintenanceMarginFraction: z.ZodOptional<z.ZodString>;
        stepSize: z.ZodOptional<z.ZodString>;
        stepBaseQuantums: z.ZodOptional<z.ZodNumber>;
        subticksPerTick: z.ZodOptional<z.ZodNumber>;
        tickSize: z.ZodOptional<z.ZodString>;
        atomicResolution: z.ZodOptional<z.ZodNumber>;
        quantumConversionExponent: z.ZodOptional<z.ZodNumber>;
        basePositionNotional: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    markets: z.ZodRecord<z.ZodString, z.ZodObject<{
        ticker: z.ZodString;
        status: z.ZodOptional<z.ZodString>;
        baseAsset: z.ZodOptional<z.ZodString>;
        quoteAsset: z.ZodOptional<z.ZodString>;
        oraclePrice: z.ZodOptional<z.ZodString>;
        priceChange24H: z.ZodOptional<z.ZodString>;
        volume24H: z.ZodOptional<z.ZodString>;
        trades24H: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        openInterest: z.ZodOptional<z.ZodString>;
        openInterestUSDC: z.ZodOptional<z.ZodString>;
        nextFundingRate: z.ZodOptional<z.ZodString>;
        nextFundingAt: z.ZodOptional<z.ZodString>;
        initialMarginFraction: z.ZodOptional<z.ZodString>;
        maintenanceMarginFraction: z.ZodOptional<z.ZodString>;
        stepSize: z.ZodOptional<z.ZodString>;
        stepBaseQuantums: z.ZodOptional<z.ZodNumber>;
        subticksPerTick: z.ZodOptional<z.ZodNumber>;
        tickSize: z.ZodOptional<z.ZodString>;
        atomicResolution: z.ZodOptional<z.ZodNumber>;
        quantumConversionExponent: z.ZodOptional<z.ZodNumber>;
        basePositionNotional: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        ticker: z.ZodString;
        status: z.ZodOptional<z.ZodString>;
        baseAsset: z.ZodOptional<z.ZodString>;
        quoteAsset: z.ZodOptional<z.ZodString>;
        oraclePrice: z.ZodOptional<z.ZodString>;
        priceChange24H: z.ZodOptional<z.ZodString>;
        volume24H: z.ZodOptional<z.ZodString>;
        trades24H: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        openInterest: z.ZodOptional<z.ZodString>;
        openInterestUSDC: z.ZodOptional<z.ZodString>;
        nextFundingRate: z.ZodOptional<z.ZodString>;
        nextFundingAt: z.ZodOptional<z.ZodString>;
        initialMarginFraction: z.ZodOptional<z.ZodString>;
        maintenanceMarginFraction: z.ZodOptional<z.ZodString>;
        stepSize: z.ZodOptional<z.ZodString>;
        stepBaseQuantums: z.ZodOptional<z.ZodNumber>;
        subticksPerTick: z.ZodOptional<z.ZodNumber>;
        tickSize: z.ZodOptional<z.ZodString>;
        atomicResolution: z.ZodOptional<z.ZodNumber>;
        quantumConversionExponent: z.ZodOptional<z.ZodNumber>;
        basePositionNotional: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        ticker: z.ZodString;
        status: z.ZodOptional<z.ZodString>;
        baseAsset: z.ZodOptional<z.ZodString>;
        quoteAsset: z.ZodOptional<z.ZodString>;
        oraclePrice: z.ZodOptional<z.ZodString>;
        priceChange24H: z.ZodOptional<z.ZodString>;
        volume24H: z.ZodOptional<z.ZodString>;
        trades24H: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        openInterest: z.ZodOptional<z.ZodString>;
        openInterestUSDC: z.ZodOptional<z.ZodString>;
        nextFundingRate: z.ZodOptional<z.ZodString>;
        nextFundingAt: z.ZodOptional<z.ZodString>;
        initialMarginFraction: z.ZodOptional<z.ZodString>;
        maintenanceMarginFraction: z.ZodOptional<z.ZodString>;
        stepSize: z.ZodOptional<z.ZodString>;
        stepBaseQuantums: z.ZodOptional<z.ZodNumber>;
        subticksPerTick: z.ZodOptional<z.ZodNumber>;
        tickSize: z.ZodOptional<z.ZodString>;
        atomicResolution: z.ZodOptional<z.ZodNumber>;
        quantumConversionExponent: z.ZodOptional<z.ZodNumber>;
        basePositionNotional: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxOrderBookLevel {
    price: string;
    size: string;
}
export declare const DydxOrderBookLevelSchema: z.ZodObject<{
    price: z.ZodString;
    size: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    price: z.ZodString;
    size: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    price: z.ZodString;
    size: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxOrderBookResponse {
    bids: DydxOrderBookLevel[];
    asks: DydxOrderBookLevel[];
}
export declare const DydxOrderBookResponseSchema: z.ZodObject<{
    bids: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    asks: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    bids: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    asks: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    bids: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    asks: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        price: z.ZodString;
        size: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxTrade {
    id: string;
    side: 'BUY' | 'SELL';
    size: string;
    price: string;
    type: 'LIMIT' | 'LIQUIDATED' | 'DELEVERAGED';
    createdAt: string;
    createdAtHeight: string;
}
export declare const DydxTradeSchema: z.ZodObject<{
    id: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    price: z.ZodString;
    type: z.ZodString;
    createdAt: z.ZodString;
    createdAtHeight: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    price: z.ZodString;
    type: z.ZodString;
    createdAt: z.ZodString;
    createdAtHeight: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    price: z.ZodString;
    type: z.ZodString;
    createdAt: z.ZodString;
    createdAtHeight: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxTradesResponse {
    trades: DydxTrade[];
}
export declare const DydxTradesResponseSchema: z.ZodObject<{
    trades: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        side: z.ZodString;
        size: z.ZodString;
        price: z.ZodString;
        type: z.ZodString;
        createdAt: z.ZodString;
        createdAtHeight: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        side: z.ZodString;
        size: z.ZodString;
        price: z.ZodString;
        type: z.ZodString;
        createdAt: z.ZodString;
        createdAtHeight: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        side: z.ZodString;
        size: z.ZodString;
        price: z.ZodString;
        type: z.ZodString;
        createdAt: z.ZodString;
        createdAtHeight: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    trades: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        side: z.ZodString;
        size: z.ZodString;
        price: z.ZodString;
        type: z.ZodString;
        createdAt: z.ZodString;
        createdAtHeight: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        side: z.ZodString;
        size: z.ZodString;
        price: z.ZodString;
        type: z.ZodString;
        createdAt: z.ZodString;
        createdAtHeight: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        side: z.ZodString;
        size: z.ZodString;
        price: z.ZodString;
        type: z.ZodString;
        createdAt: z.ZodString;
        createdAtHeight: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    trades: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        side: z.ZodString;
        size: z.ZodString;
        price: z.ZodString;
        type: z.ZodString;
        createdAt: z.ZodString;
        createdAtHeight: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        side: z.ZodString;
        size: z.ZodString;
        price: z.ZodString;
        type: z.ZodString;
        createdAt: z.ZodString;
        createdAtHeight: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        side: z.ZodString;
        size: z.ZodString;
        price: z.ZodString;
        type: z.ZodString;
        createdAt: z.ZodString;
        createdAtHeight: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxOrder {
    id: string;
    subaccountId: string;
    clientId: string;
    clobPairId: string;
    side: 'BUY' | 'SELL';
    size: string;
    price: string;
    totalFilled: string;
    goodTilBlock?: string;
    goodTilBlockTime?: string;
    status: 'OPEN' | 'FILLED' | 'CANCELED' | 'BEST_EFFORT_CANCELED' | 'UNTRIGGERED' | 'PENDING';
    type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET' | 'TRAILING_STOP' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET';
    timeInForce: 'GTT' | 'FOK' | 'IOC';
    postOnly: boolean;
    reduceOnly: boolean;
    ticker: string;
    orderFlags: string;
    triggerPrice?: string;
    createdAtHeight?: string;
    updatedAt?: string;
    updatedAtHeight?: string;
    clientMetadata: string;
    removalReason?: string;
}
export declare const DydxOrderSchema: z.ZodObject<{
    id: z.ZodString;
    subaccountId: z.ZodOptional<z.ZodString>;
    clientId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    clobPairId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    side: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    totalFilled: z.ZodOptional<z.ZodString>;
    goodTilBlock: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
    goodTilBlockTime: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
    status: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    timeInForce: z.ZodOptional<z.ZodString>;
    postOnly: z.ZodOptional<z.ZodBoolean>;
    reduceOnly: z.ZodOptional<z.ZodBoolean>;
    ticker: z.ZodOptional<z.ZodString>;
    orderFlags: z.ZodOptional<z.ZodString>;
    triggerPrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    createdAtHeight: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
    updatedAtHeight: z.ZodOptional<z.ZodString>;
    clientMetadata: z.ZodOptional<z.ZodString>;
    removalReason: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    subaccountId: z.ZodOptional<z.ZodString>;
    clientId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    clobPairId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    side: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    totalFilled: z.ZodOptional<z.ZodString>;
    goodTilBlock: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
    goodTilBlockTime: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
    status: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    timeInForce: z.ZodOptional<z.ZodString>;
    postOnly: z.ZodOptional<z.ZodBoolean>;
    reduceOnly: z.ZodOptional<z.ZodBoolean>;
    ticker: z.ZodOptional<z.ZodString>;
    orderFlags: z.ZodOptional<z.ZodString>;
    triggerPrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    createdAtHeight: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
    updatedAtHeight: z.ZodOptional<z.ZodString>;
    clientMetadata: z.ZodOptional<z.ZodString>;
    removalReason: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    subaccountId: z.ZodOptional<z.ZodString>;
    clientId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    clobPairId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    side: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    totalFilled: z.ZodOptional<z.ZodString>;
    goodTilBlock: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
    goodTilBlockTime: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
    status: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    timeInForce: z.ZodOptional<z.ZodString>;
    postOnly: z.ZodOptional<z.ZodBoolean>;
    reduceOnly: z.ZodOptional<z.ZodBoolean>;
    ticker: z.ZodOptional<z.ZodString>;
    orderFlags: z.ZodOptional<z.ZodString>;
    triggerPrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    createdAtHeight: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
    updatedAtHeight: z.ZodOptional<z.ZodString>;
    clientMetadata: z.ZodOptional<z.ZodString>;
    removalReason: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxOrdersResponse {
    orders?: DydxOrder[];
}
export declare const DydxOrdersResponseSchema: z.ZodObject<{
    orders: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        subaccountId: z.ZodOptional<z.ZodString>;
        clientId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        clobPairId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
        side: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        totalFilled: z.ZodOptional<z.ZodString>;
        goodTilBlock: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        goodTilBlockTime: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        status: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        timeInForce: z.ZodOptional<z.ZodString>;
        postOnly: z.ZodOptional<z.ZodBoolean>;
        reduceOnly: z.ZodOptional<z.ZodBoolean>;
        ticker: z.ZodOptional<z.ZodString>;
        orderFlags: z.ZodOptional<z.ZodString>;
        triggerPrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        removalReason: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        subaccountId: z.ZodOptional<z.ZodString>;
        clientId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        clobPairId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
        side: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        totalFilled: z.ZodOptional<z.ZodString>;
        goodTilBlock: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        goodTilBlockTime: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        status: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        timeInForce: z.ZodOptional<z.ZodString>;
        postOnly: z.ZodOptional<z.ZodBoolean>;
        reduceOnly: z.ZodOptional<z.ZodBoolean>;
        ticker: z.ZodOptional<z.ZodString>;
        orderFlags: z.ZodOptional<z.ZodString>;
        triggerPrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        removalReason: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        subaccountId: z.ZodOptional<z.ZodString>;
        clientId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        clobPairId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
        side: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        totalFilled: z.ZodOptional<z.ZodString>;
        goodTilBlock: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        goodTilBlockTime: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        status: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        timeInForce: z.ZodOptional<z.ZodString>;
        postOnly: z.ZodOptional<z.ZodBoolean>;
        reduceOnly: z.ZodOptional<z.ZodBoolean>;
        ticker: z.ZodOptional<z.ZodString>;
        orderFlags: z.ZodOptional<z.ZodString>;
        triggerPrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        removalReason: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    orders: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        subaccountId: z.ZodOptional<z.ZodString>;
        clientId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        clobPairId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
        side: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        totalFilled: z.ZodOptional<z.ZodString>;
        goodTilBlock: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        goodTilBlockTime: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        status: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        timeInForce: z.ZodOptional<z.ZodString>;
        postOnly: z.ZodOptional<z.ZodBoolean>;
        reduceOnly: z.ZodOptional<z.ZodBoolean>;
        ticker: z.ZodOptional<z.ZodString>;
        orderFlags: z.ZodOptional<z.ZodString>;
        triggerPrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        removalReason: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        subaccountId: z.ZodOptional<z.ZodString>;
        clientId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        clobPairId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
        side: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        totalFilled: z.ZodOptional<z.ZodString>;
        goodTilBlock: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        goodTilBlockTime: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        status: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        timeInForce: z.ZodOptional<z.ZodString>;
        postOnly: z.ZodOptional<z.ZodBoolean>;
        reduceOnly: z.ZodOptional<z.ZodBoolean>;
        ticker: z.ZodOptional<z.ZodString>;
        orderFlags: z.ZodOptional<z.ZodString>;
        triggerPrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        removalReason: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        subaccountId: z.ZodOptional<z.ZodString>;
        clientId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        clobPairId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
        side: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        totalFilled: z.ZodOptional<z.ZodString>;
        goodTilBlock: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        goodTilBlockTime: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        status: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        timeInForce: z.ZodOptional<z.ZodString>;
        postOnly: z.ZodOptional<z.ZodBoolean>;
        reduceOnly: z.ZodOptional<z.ZodBoolean>;
        ticker: z.ZodOptional<z.ZodString>;
        orderFlags: z.ZodOptional<z.ZodString>;
        triggerPrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        removalReason: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    orders: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        subaccountId: z.ZodOptional<z.ZodString>;
        clientId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        clobPairId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
        side: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        totalFilled: z.ZodOptional<z.ZodString>;
        goodTilBlock: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        goodTilBlockTime: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        status: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        timeInForce: z.ZodOptional<z.ZodString>;
        postOnly: z.ZodOptional<z.ZodBoolean>;
        reduceOnly: z.ZodOptional<z.ZodBoolean>;
        ticker: z.ZodOptional<z.ZodString>;
        orderFlags: z.ZodOptional<z.ZodString>;
        triggerPrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        removalReason: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        subaccountId: z.ZodOptional<z.ZodString>;
        clientId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        clobPairId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
        side: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        totalFilled: z.ZodOptional<z.ZodString>;
        goodTilBlock: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        goodTilBlockTime: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        status: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        timeInForce: z.ZodOptional<z.ZodString>;
        postOnly: z.ZodOptional<z.ZodBoolean>;
        reduceOnly: z.ZodOptional<z.ZodBoolean>;
        ticker: z.ZodOptional<z.ZodString>;
        orderFlags: z.ZodOptional<z.ZodString>;
        triggerPrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        removalReason: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        subaccountId: z.ZodOptional<z.ZodString>;
        clientId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        clobPairId: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
        side: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        totalFilled: z.ZodOptional<z.ZodString>;
        goodTilBlock: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        goodTilBlockTime: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodNull]>>;
        status: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        timeInForce: z.ZodOptional<z.ZodString>;
        postOnly: z.ZodOptional<z.ZodBoolean>;
        reduceOnly: z.ZodOptional<z.ZodBoolean>;
        ticker: z.ZodOptional<z.ZodString>;
        orderFlags: z.ZodOptional<z.ZodString>;
        triggerPrice: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        removalReason: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNull]>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxFill {
    id: string;
    side: 'BUY' | 'SELL';
    liquidity: 'TAKER' | 'MAKER';
    type: 'LIMIT' | 'LIQUIDATED' | 'DELEVERAGED';
    market: string;
    marketType: 'PERPETUAL';
    price: string;
    size: string;
    fee: string;
    createdAt: string;
    createdAtHeight: string;
    orderId?: string;
    clientMetadata?: string;
    subaccountNumber: number;
}
export declare const DydxFillSchema: z.ZodObject<{
    id: z.ZodString;
    side: z.ZodOptional<z.ZodString>;
    liquidity: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    market: z.ZodOptional<z.ZodString>;
    marketType: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodString>;
    fee: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    createdAtHeight: z.ZodOptional<z.ZodString>;
    orderId: z.ZodOptional<z.ZodString>;
    clientMetadata: z.ZodOptional<z.ZodString>;
    subaccountNumber: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    side: z.ZodOptional<z.ZodString>;
    liquidity: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    market: z.ZodOptional<z.ZodString>;
    marketType: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodString>;
    fee: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    createdAtHeight: z.ZodOptional<z.ZodString>;
    orderId: z.ZodOptional<z.ZodString>;
    clientMetadata: z.ZodOptional<z.ZodString>;
    subaccountNumber: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    side: z.ZodOptional<z.ZodString>;
    liquidity: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    market: z.ZodOptional<z.ZodString>;
    marketType: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodString>;
    fee: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    createdAtHeight: z.ZodOptional<z.ZodString>;
    orderId: z.ZodOptional<z.ZodString>;
    clientMetadata: z.ZodOptional<z.ZodString>;
    subaccountNumber: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxFillsResponse {
    fills: DydxFill[];
}
export declare const DydxFillsResponseSchema: z.ZodObject<{
    fills: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        side: z.ZodOptional<z.ZodString>;
        liquidity: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        market: z.ZodOptional<z.ZodString>;
        marketType: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        fee: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodOptional<z.ZodString>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        orderId: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        side: z.ZodOptional<z.ZodString>;
        liquidity: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        market: z.ZodOptional<z.ZodString>;
        marketType: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        fee: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodOptional<z.ZodString>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        orderId: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        side: z.ZodOptional<z.ZodString>;
        liquidity: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        market: z.ZodOptional<z.ZodString>;
        marketType: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        fee: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodOptional<z.ZodString>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        orderId: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    fills: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        side: z.ZodOptional<z.ZodString>;
        liquidity: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        market: z.ZodOptional<z.ZodString>;
        marketType: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        fee: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodOptional<z.ZodString>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        orderId: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        side: z.ZodOptional<z.ZodString>;
        liquidity: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        market: z.ZodOptional<z.ZodString>;
        marketType: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        fee: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodOptional<z.ZodString>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        orderId: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        side: z.ZodOptional<z.ZodString>;
        liquidity: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        market: z.ZodOptional<z.ZodString>;
        marketType: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        fee: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodOptional<z.ZodString>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        orderId: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    fills: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        side: z.ZodOptional<z.ZodString>;
        liquidity: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        market: z.ZodOptional<z.ZodString>;
        marketType: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        fee: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodOptional<z.ZodString>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        orderId: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        side: z.ZodOptional<z.ZodString>;
        liquidity: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        market: z.ZodOptional<z.ZodString>;
        marketType: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        fee: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodOptional<z.ZodString>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        orderId: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        side: z.ZodOptional<z.ZodString>;
        liquidity: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        market: z.ZodOptional<z.ZodString>;
        marketType: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodString>;
        fee: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodOptional<z.ZodString>;
        createdAtHeight: z.ZodOptional<z.ZodString>;
        orderId: z.ZodOptional<z.ZodString>;
        clientMetadata: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxPerpetualPosition {
    market: string;
    status: 'OPEN' | 'CLOSED' | 'LIQUIDATED';
    side: 'LONG' | 'SHORT';
    size: string;
    maxSize: string;
    entryPrice: string;
    exitPrice?: string;
    realizedPnl: string;
    unrealizedPnl: string;
    createdAt: string;
    createdAtHeight: string;
    closedAt?: string;
    sumOpen: string;
    sumClose: string;
    netFunding: string;
    subaccountNumber: number;
}
export declare const DydxPerpetualPositionSchema: z.ZodObject<{
    market: z.ZodString;
    status: z.ZodOptional<z.ZodString>;
    side: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodString>;
    maxSize: z.ZodOptional<z.ZodString>;
    entryPrice: z.ZodOptional<z.ZodString>;
    exitPrice: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    realizedPnl: z.ZodOptional<z.ZodString>;
    unrealizedPnl: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    createdAtHeight: z.ZodOptional<z.ZodString>;
    closedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sumOpen: z.ZodOptional<z.ZodString>;
    sumClose: z.ZodOptional<z.ZodString>;
    netFunding: z.ZodOptional<z.ZodString>;
    subaccountNumber: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    market: z.ZodString;
    status: z.ZodOptional<z.ZodString>;
    side: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodString>;
    maxSize: z.ZodOptional<z.ZodString>;
    entryPrice: z.ZodOptional<z.ZodString>;
    exitPrice: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    realizedPnl: z.ZodOptional<z.ZodString>;
    unrealizedPnl: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    createdAtHeight: z.ZodOptional<z.ZodString>;
    closedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sumOpen: z.ZodOptional<z.ZodString>;
    sumClose: z.ZodOptional<z.ZodString>;
    netFunding: z.ZodOptional<z.ZodString>;
    subaccountNumber: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    market: z.ZodString;
    status: z.ZodOptional<z.ZodString>;
    side: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodString>;
    maxSize: z.ZodOptional<z.ZodString>;
    entryPrice: z.ZodOptional<z.ZodString>;
    exitPrice: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    realizedPnl: z.ZodOptional<z.ZodString>;
    unrealizedPnl: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    createdAtHeight: z.ZodOptional<z.ZodString>;
    closedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sumOpen: z.ZodOptional<z.ZodString>;
    sumClose: z.ZodOptional<z.ZodString>;
    netFunding: z.ZodOptional<z.ZodString>;
    subaccountNumber: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxAssetPosition {
    symbol: string;
    side: 'LONG' | 'SHORT';
    size: string;
    assetId: string;
    subaccountNumber: number;
}
export declare const DydxAssetPositionSchema: z.ZodObject<{
    symbol: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    assetId: z.ZodString;
    subaccountNumber: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    assetId: z.ZodString;
    subaccountNumber: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    side: z.ZodString;
    size: z.ZodString;
    assetId: z.ZodString;
    subaccountNumber: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxSubaccount {
    address: string;
    subaccountNumber: number;
    equity: string;
    freeCollateral: string;
    pendingDeposits: string;
    pendingWithdrawals: string;
    marginEnabled: boolean;
    updatedAtHeight: string;
    latestProcessedBlockHeight: string;
    openPerpetualPositions: Record<string, DydxPerpetualPosition>;
    assetPositions: Record<string, DydxAssetPosition>;
}
export declare const DydxSubaccountSchema: z.ZodObject<{
    address: z.ZodOptional<z.ZodString>;
    subaccountNumber: z.ZodOptional<z.ZodNumber>;
    equity: z.ZodOptional<z.ZodString>;
    freeCollateral: z.ZodOptional<z.ZodString>;
    pendingDeposits: z.ZodOptional<z.ZodString>;
    pendingWithdrawals: z.ZodOptional<z.ZodString>;
    marginEnabled: z.ZodOptional<z.ZodBoolean>;
    updatedAtHeight: z.ZodOptional<z.ZodString>;
    latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
    openPerpetualPositions: z.ZodOptional<z.ZodAny>;
    assetPositions: z.ZodOptional<z.ZodAny>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    address: z.ZodOptional<z.ZodString>;
    subaccountNumber: z.ZodOptional<z.ZodNumber>;
    equity: z.ZodOptional<z.ZodString>;
    freeCollateral: z.ZodOptional<z.ZodString>;
    pendingDeposits: z.ZodOptional<z.ZodString>;
    pendingWithdrawals: z.ZodOptional<z.ZodString>;
    marginEnabled: z.ZodOptional<z.ZodBoolean>;
    updatedAtHeight: z.ZodOptional<z.ZodString>;
    latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
    openPerpetualPositions: z.ZodOptional<z.ZodAny>;
    assetPositions: z.ZodOptional<z.ZodAny>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    address: z.ZodOptional<z.ZodString>;
    subaccountNumber: z.ZodOptional<z.ZodNumber>;
    equity: z.ZodOptional<z.ZodString>;
    freeCollateral: z.ZodOptional<z.ZodString>;
    pendingDeposits: z.ZodOptional<z.ZodString>;
    pendingWithdrawals: z.ZodOptional<z.ZodString>;
    marginEnabled: z.ZodOptional<z.ZodBoolean>;
    updatedAtHeight: z.ZodOptional<z.ZodString>;
    latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
    openPerpetualPositions: z.ZodOptional<z.ZodAny>;
    assetPositions: z.ZodOptional<z.ZodAny>;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxSubaccountResponse {
    subaccount: DydxSubaccount;
}
export declare const DydxSubaccountResponseSchema: z.ZodObject<{
    subaccount: z.ZodObject<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    subaccount: z.ZodObject<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    subaccount: z.ZodObject<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">>;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxSubaccountsResponse {
    subaccounts: DydxSubaccount[];
}
export declare const DydxSubaccountsResponseSchema: z.ZodObject<{
    subaccounts: z.ZodArray<z.ZodObject<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    subaccounts: z.ZodArray<z.ZodObject<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    subaccounts: z.ZodArray<z.ZodObject<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        address: z.ZodOptional<z.ZodString>;
        subaccountNumber: z.ZodOptional<z.ZodNumber>;
        equity: z.ZodOptional<z.ZodString>;
        freeCollateral: z.ZodOptional<z.ZodString>;
        pendingDeposits: z.ZodOptional<z.ZodString>;
        pendingWithdrawals: z.ZodOptional<z.ZodString>;
        marginEnabled: z.ZodOptional<z.ZodBoolean>;
        updatedAtHeight: z.ZodOptional<z.ZodString>;
        latestProcessedBlockHeight: z.ZodOptional<z.ZodString>;
        openPerpetualPositions: z.ZodOptional<z.ZodAny>;
        assetPositions: z.ZodOptional<z.ZodAny>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxHistoricalFunding {
    ticker: string;
    rate: string;
    price: string;
    effectiveAt: string;
    effectiveAtHeight: string;
}
export declare const DydxHistoricalFundingSchema: z.ZodObject<{
    ticker: z.ZodString;
    rate: z.ZodString;
    price: z.ZodString;
    effectiveAt: z.ZodString;
    effectiveAtHeight: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    ticker: z.ZodString;
    rate: z.ZodString;
    price: z.ZodString;
    effectiveAt: z.ZodString;
    effectiveAtHeight: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    ticker: z.ZodString;
    rate: z.ZodString;
    price: z.ZodString;
    effectiveAt: z.ZodString;
    effectiveAtHeight: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxHistoricalFundingResponse {
    historicalFunding: DydxHistoricalFunding[];
}
export declare const DydxHistoricalFundingResponseSchema: z.ZodObject<{
    historicalFunding: z.ZodArray<z.ZodObject<{
        ticker: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        effectiveAt: z.ZodString;
        effectiveAtHeight: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        ticker: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        effectiveAt: z.ZodString;
        effectiveAtHeight: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        ticker: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        effectiveAt: z.ZodString;
        effectiveAtHeight: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    historicalFunding: z.ZodArray<z.ZodObject<{
        ticker: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        effectiveAt: z.ZodString;
        effectiveAtHeight: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        ticker: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        effectiveAt: z.ZodString;
        effectiveAtHeight: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        ticker: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        effectiveAt: z.ZodString;
        effectiveAtHeight: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    historicalFunding: z.ZodArray<z.ZodObject<{
        ticker: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        effectiveAt: z.ZodString;
        effectiveAtHeight: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        ticker: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        effectiveAt: z.ZodString;
        effectiveAtHeight: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        ticker: z.ZodString;
        rate: z.ZodString;
        price: z.ZodString;
        effectiveAt: z.ZodString;
        effectiveAtHeight: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxCandle {
    startedAt: string;
    ticker: string;
    resolution: string;
    low: string;
    high: string;
    open: string;
    close: string;
    baseTokenVolume: string;
    usdVolume: string;
    trades: number;
    startingOpenInterest: string;
}
export declare const DydxCandleSchema: z.ZodObject<{
    startedAt: z.ZodOptional<z.ZodString>;
    ticker: z.ZodOptional<z.ZodString>;
    resolution: z.ZodOptional<z.ZodString>;
    low: z.ZodOptional<z.ZodString>;
    high: z.ZodOptional<z.ZodString>;
    open: z.ZodOptional<z.ZodString>;
    close: z.ZodOptional<z.ZodString>;
    baseTokenVolume: z.ZodOptional<z.ZodString>;
    usdVolume: z.ZodOptional<z.ZodString>;
    trades: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    startingOpenInterest: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    startedAt: z.ZodOptional<z.ZodString>;
    ticker: z.ZodOptional<z.ZodString>;
    resolution: z.ZodOptional<z.ZodString>;
    low: z.ZodOptional<z.ZodString>;
    high: z.ZodOptional<z.ZodString>;
    open: z.ZodOptional<z.ZodString>;
    close: z.ZodOptional<z.ZodString>;
    baseTokenVolume: z.ZodOptional<z.ZodString>;
    usdVolume: z.ZodOptional<z.ZodString>;
    trades: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    startingOpenInterest: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    startedAt: z.ZodOptional<z.ZodString>;
    ticker: z.ZodOptional<z.ZodString>;
    resolution: z.ZodOptional<z.ZodString>;
    low: z.ZodOptional<z.ZodString>;
    high: z.ZodOptional<z.ZodString>;
    open: z.ZodOptional<z.ZodString>;
    close: z.ZodOptional<z.ZodString>;
    baseTokenVolume: z.ZodOptional<z.ZodString>;
    usdVolume: z.ZodOptional<z.ZodString>;
    trades: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    startingOpenInterest: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxCandlesResponse {
    candles: DydxCandle[];
}
export declare const DydxCandlesResponseSchema: z.ZodObject<{
    candles: z.ZodArray<z.ZodObject<{
        startedAt: z.ZodOptional<z.ZodString>;
        ticker: z.ZodOptional<z.ZodString>;
        resolution: z.ZodOptional<z.ZodString>;
        low: z.ZodOptional<z.ZodString>;
        high: z.ZodOptional<z.ZodString>;
        open: z.ZodOptional<z.ZodString>;
        close: z.ZodOptional<z.ZodString>;
        baseTokenVolume: z.ZodOptional<z.ZodString>;
        usdVolume: z.ZodOptional<z.ZodString>;
        trades: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        startingOpenInterest: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        startedAt: z.ZodOptional<z.ZodString>;
        ticker: z.ZodOptional<z.ZodString>;
        resolution: z.ZodOptional<z.ZodString>;
        low: z.ZodOptional<z.ZodString>;
        high: z.ZodOptional<z.ZodString>;
        open: z.ZodOptional<z.ZodString>;
        close: z.ZodOptional<z.ZodString>;
        baseTokenVolume: z.ZodOptional<z.ZodString>;
        usdVolume: z.ZodOptional<z.ZodString>;
        trades: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        startingOpenInterest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        startedAt: z.ZodOptional<z.ZodString>;
        ticker: z.ZodOptional<z.ZodString>;
        resolution: z.ZodOptional<z.ZodString>;
        low: z.ZodOptional<z.ZodString>;
        high: z.ZodOptional<z.ZodString>;
        open: z.ZodOptional<z.ZodString>;
        close: z.ZodOptional<z.ZodString>;
        baseTokenVolume: z.ZodOptional<z.ZodString>;
        usdVolume: z.ZodOptional<z.ZodString>;
        trades: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        startingOpenInterest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    candles: z.ZodArray<z.ZodObject<{
        startedAt: z.ZodOptional<z.ZodString>;
        ticker: z.ZodOptional<z.ZodString>;
        resolution: z.ZodOptional<z.ZodString>;
        low: z.ZodOptional<z.ZodString>;
        high: z.ZodOptional<z.ZodString>;
        open: z.ZodOptional<z.ZodString>;
        close: z.ZodOptional<z.ZodString>;
        baseTokenVolume: z.ZodOptional<z.ZodString>;
        usdVolume: z.ZodOptional<z.ZodString>;
        trades: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        startingOpenInterest: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        startedAt: z.ZodOptional<z.ZodString>;
        ticker: z.ZodOptional<z.ZodString>;
        resolution: z.ZodOptional<z.ZodString>;
        low: z.ZodOptional<z.ZodString>;
        high: z.ZodOptional<z.ZodString>;
        open: z.ZodOptional<z.ZodString>;
        close: z.ZodOptional<z.ZodString>;
        baseTokenVolume: z.ZodOptional<z.ZodString>;
        usdVolume: z.ZodOptional<z.ZodString>;
        trades: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        startingOpenInterest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        startedAt: z.ZodOptional<z.ZodString>;
        ticker: z.ZodOptional<z.ZodString>;
        resolution: z.ZodOptional<z.ZodString>;
        low: z.ZodOptional<z.ZodString>;
        high: z.ZodOptional<z.ZodString>;
        open: z.ZodOptional<z.ZodString>;
        close: z.ZodOptional<z.ZodString>;
        baseTokenVolume: z.ZodOptional<z.ZodString>;
        usdVolume: z.ZodOptional<z.ZodString>;
        trades: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        startingOpenInterest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    candles: z.ZodArray<z.ZodObject<{
        startedAt: z.ZodOptional<z.ZodString>;
        ticker: z.ZodOptional<z.ZodString>;
        resolution: z.ZodOptional<z.ZodString>;
        low: z.ZodOptional<z.ZodString>;
        high: z.ZodOptional<z.ZodString>;
        open: z.ZodOptional<z.ZodString>;
        close: z.ZodOptional<z.ZodString>;
        baseTokenVolume: z.ZodOptional<z.ZodString>;
        usdVolume: z.ZodOptional<z.ZodString>;
        trades: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        startingOpenInterest: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        startedAt: z.ZodOptional<z.ZodString>;
        ticker: z.ZodOptional<z.ZodString>;
        resolution: z.ZodOptional<z.ZodString>;
        low: z.ZodOptional<z.ZodString>;
        high: z.ZodOptional<z.ZodString>;
        open: z.ZodOptional<z.ZodString>;
        close: z.ZodOptional<z.ZodString>;
        baseTokenVolume: z.ZodOptional<z.ZodString>;
        usdVolume: z.ZodOptional<z.ZodString>;
        trades: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        startingOpenInterest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        startedAt: z.ZodOptional<z.ZodString>;
        ticker: z.ZodOptional<z.ZodString>;
        resolution: z.ZodOptional<z.ZodString>;
        low: z.ZodOptional<z.ZodString>;
        high: z.ZodOptional<z.ZodString>;
        open: z.ZodOptional<z.ZodString>;
        close: z.ZodOptional<z.ZodString>;
        baseTokenVolume: z.ZodOptional<z.ZodString>;
        usdVolume: z.ZodOptional<z.ZodString>;
        trades: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        startingOpenInterest: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">>;
export interface DydxSparklineResponse {
    [ticker: string]: string[];
}
export interface DydxWsSubscription {
    type: 'subscribe' | 'unsubscribe';
    channel: string;
    id?: string;
    batched?: boolean;
}
export interface DydxWsMessage {
    type: 'connected' | 'subscribed' | 'unsubscribed' | 'channel_data' | 'channel_batch_data' | 'error';
    connection_id?: string;
    message_id?: number;
    channel?: string;
    id?: string;
    contents?: unknown;
    version?: string;
}
export interface DydxWsMarketsContent {
    trading: Record<string, DydxPerpetualMarket>;
}
export interface DydxWsTradesContent {
    trades: DydxTrade[];
}
export interface DydxWsOrderBookContent {
    bids: DydxOrderBookLevel[];
    asks: DydxOrderBookLevel[];
}
export interface DydxWsOrderBookUpdateContent {
    bids?: DydxOrderBookLevel[];
    asks?: DydxOrderBookLevel[];
}
export interface DydxWsSubaccountContent {
    subaccount?: DydxSubaccount;
    orders?: DydxOrder[];
    fills?: DydxFill[];
    perpetualPositions?: DydxPerpetualPosition[];
    assetPositions?: DydxAssetPosition[];
    tradingReward?: {
        tradingReward: string;
        createdAt: string;
        createdAtHeight: string;
    };
}
export interface DydxWsCandleContent {
    candle: DydxCandle;
}
export interface DydxPlaceOrderParams {
    subaccountNumber: number;
    marketId: string;
    side: 'BUY' | 'SELL';
    type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET';
    timeInForce: 'GTT' | 'FOK' | 'IOC';
    price: string;
    size: string;
    postOnly?: boolean;
    reduceOnly?: boolean;
    triggerPrice?: string;
    clientId?: number;
    goodTilTimeInSeconds?: number;
    goodTilBlock?: number;
    execution?: 'DEFAULT' | 'POST_ONLY' | 'FOK' | 'IOC';
}
export interface DydxCancelOrderParams {
    subaccountNumber: number;
    orderId: string;
    orderFlags: string;
    clobPairId: number;
    goodTilBlock?: number;
    goodTilBlockTime?: number;
}
export interface DydxHeightResponse {
    height: string;
    time: string;
}
export interface DydxTransfer {
    id: string;
    sender: {
        address: string;
        subaccountNumber?: number;
    };
    recipient: {
        address: string;
        subaccountNumber?: number;
    };
    size: string;
    createdAt: string;
    createdAtHeight: string;
    symbol: string;
    type: 'TRANSFER_IN' | 'TRANSFER_OUT' | 'DEPOSIT' | 'WITHDRAWAL';
    transactionHash?: string;
}
export interface DydxTransfersResponse {
    transfers: DydxTransfer[];
}
export interface DydxHistoricalPnl {
    id: string;
    subaccountId: string;
    equity: string;
    totalPnl: string;
    netTransfers: string;
    createdAt: string;
    blockHeight: string;
    blockTime: string;
}
export interface DydxHistoricalPnlResponse {
    historicalPnl: DydxHistoricalPnl[];
}
//# sourceMappingURL=types.d.ts.map
/**
 * Hyperliquid Exchange-Specific Types
 */
import { z } from 'zod';
export interface HyperliquidMeta {
    universe: HyperliquidAsset[];
}
export declare const HyperliquidMetaSchema: z.ZodObject<{
    universe: z.ZodArray<z.ZodAny, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    universe: z.ZodArray<z.ZodAny, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    universe: z.ZodArray<z.ZodAny, "many">;
}, z.ZodTypeAny, "passthrough">>;
export interface HyperliquidAsset {
    name: string;
    szDecimals: number;
    maxLeverage: number;
    onlyIsolated?: boolean;
    marginTableId?: number;
}
export declare const HyperliquidAssetSchema: z.ZodObject<{
    name: z.ZodString;
    szDecimals: z.ZodNumber;
    maxLeverage: z.ZodNumber;
    onlyIsolated: z.ZodOptional<z.ZodBoolean>;
    marginTableId: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    name: z.ZodString;
    szDecimals: z.ZodNumber;
    maxLeverage: z.ZodNumber;
    onlyIsolated: z.ZodOptional<z.ZodBoolean>;
    marginTableId: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    name: z.ZodString;
    szDecimals: z.ZodNumber;
    maxLeverage: z.ZodNumber;
    onlyIsolated: z.ZodOptional<z.ZodBoolean>;
    marginTableId: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export interface HyperliquidOrderResponse {
    status: 'ok' | 'err';
    response: {
        type: 'order';
        data: {
            statuses: HyperliquidOrderStatus[];
        };
    };
}
export declare const HyperliquidOrderResponseSchema: z.ZodObject<{
    status: z.ZodEnum<["ok", "err"]>;
    response: z.ZodObject<{
        type: z.ZodLiteral<"order">;
        data: z.ZodObject<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodLiteral<"order">;
        data: z.ZodObject<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodLiteral<"order">;
        data: z.ZodObject<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    status: z.ZodEnum<["ok", "err"]>;
    response: z.ZodObject<{
        type: z.ZodLiteral<"order">;
        data: z.ZodObject<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodLiteral<"order">;
        data: z.ZodObject<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodLiteral<"order">;
        data: z.ZodObject<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    status: z.ZodEnum<["ok", "err"]>;
    response: z.ZodObject<{
        type: z.ZodLiteral<"order">;
        data: z.ZodObject<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodLiteral<"order">;
        data: z.ZodObject<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodLiteral<"order">;
        data: z.ZodObject<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            statuses: z.ZodArray<z.ZodAny, "many">;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>;
}, z.ZodTypeAny, "passthrough">>;
export type HyperliquidOrderStatus = {
    resting: {
        oid: number;
    };
} | {
    filled: {
        totalSz: string;
        avgPx: string;
        oid: number;
    };
} | {
    error: string;
};
export interface HyperliquidOpenOrder {
    coin: string;
    side: 'B' | 'A';
    limitPx: string;
    sz: string;
    oid: number;
    timestamp: number;
    origSz: string;
    cloid?: string;
}
export declare const HyperliquidOpenOrderSchema: z.ZodObject<{
    coin: z.ZodString;
    side: z.ZodString;
    limitPx: z.ZodString;
    sz: z.ZodString;
    oid: z.ZodNumber;
    timestamp: z.ZodNumber;
    origSz: z.ZodString;
    cloid: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    coin: z.ZodString;
    side: z.ZodString;
    limitPx: z.ZodString;
    sz: z.ZodString;
    oid: z.ZodNumber;
    timestamp: z.ZodNumber;
    origSz: z.ZodString;
    cloid: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    coin: z.ZodString;
    side: z.ZodString;
    limitPx: z.ZodString;
    sz: z.ZodString;
    oid: z.ZodNumber;
    timestamp: z.ZodNumber;
    origSz: z.ZodString;
    cloid: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export interface HyperliquidUserState {
    assetPositions: HyperliquidPosition[];
    crossMarginSummary: {
        accountValue: string;
        totalNtlPos: string;
        totalRawUsd: string;
    };
    marginSummary: {
        accountValue: string;
        totalNtlPos: string;
        totalMarginUsed: string;
    };
    withdrawable: string;
}
export declare const HyperliquidUserStateSchema: z.ZodObject<{
    assetPositions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    crossMarginSummary: z.ZodOptional<z.ZodAny>;
    marginSummary: z.ZodOptional<z.ZodAny>;
    withdrawable: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    assetPositions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    crossMarginSummary: z.ZodOptional<z.ZodAny>;
    marginSummary: z.ZodOptional<z.ZodAny>;
    withdrawable: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    assetPositions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    crossMarginSummary: z.ZodOptional<z.ZodAny>;
    marginSummary: z.ZodOptional<z.ZodAny>;
    withdrawable: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export interface HyperliquidPosition {
    position: {
        coin: string;
        entryPx: string;
        leverage: {
            type: 'cross' | 'isolated';
            value: number;
        };
        liquidationPx: string | null;
        marginUsed: string;
        positionValue: string;
        returnOnEquity: string;
        szi: string;
        unrealizedPnl: string;
    };
    type: 'oneWay';
}
export declare const HyperliquidPositionSchema: z.ZodObject<{
    position: z.ZodObject<{
        coin: z.ZodString;
        entryPx: z.ZodOptional<z.ZodString>;
        leverage: z.ZodOptional<z.ZodAny>;
        liquidationPx: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        marginUsed: z.ZodOptional<z.ZodString>;
        positionValue: z.ZodOptional<z.ZodString>;
        returnOnEquity: z.ZodOptional<z.ZodString>;
        szi: z.ZodOptional<z.ZodString>;
        unrealizedPnl: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        coin: z.ZodString;
        entryPx: z.ZodOptional<z.ZodString>;
        leverage: z.ZodOptional<z.ZodAny>;
        liquidationPx: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        marginUsed: z.ZodOptional<z.ZodString>;
        positionValue: z.ZodOptional<z.ZodString>;
        returnOnEquity: z.ZodOptional<z.ZodString>;
        szi: z.ZodOptional<z.ZodString>;
        unrealizedPnl: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        coin: z.ZodString;
        entryPx: z.ZodOptional<z.ZodString>;
        leverage: z.ZodOptional<z.ZodAny>;
        liquidationPx: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        marginUsed: z.ZodOptional<z.ZodString>;
        positionValue: z.ZodOptional<z.ZodString>;
        returnOnEquity: z.ZodOptional<z.ZodString>;
        szi: z.ZodOptional<z.ZodString>;
        unrealizedPnl: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>;
    type: z.ZodOptional<z.ZodAny>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    position: z.ZodObject<{
        coin: z.ZodString;
        entryPx: z.ZodOptional<z.ZodString>;
        leverage: z.ZodOptional<z.ZodAny>;
        liquidationPx: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        marginUsed: z.ZodOptional<z.ZodString>;
        positionValue: z.ZodOptional<z.ZodString>;
        returnOnEquity: z.ZodOptional<z.ZodString>;
        szi: z.ZodOptional<z.ZodString>;
        unrealizedPnl: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        coin: z.ZodString;
        entryPx: z.ZodOptional<z.ZodString>;
        leverage: z.ZodOptional<z.ZodAny>;
        liquidationPx: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        marginUsed: z.ZodOptional<z.ZodString>;
        positionValue: z.ZodOptional<z.ZodString>;
        returnOnEquity: z.ZodOptional<z.ZodString>;
        szi: z.ZodOptional<z.ZodString>;
        unrealizedPnl: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        coin: z.ZodString;
        entryPx: z.ZodOptional<z.ZodString>;
        leverage: z.ZodOptional<z.ZodAny>;
        liquidationPx: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        marginUsed: z.ZodOptional<z.ZodString>;
        positionValue: z.ZodOptional<z.ZodString>;
        returnOnEquity: z.ZodOptional<z.ZodString>;
        szi: z.ZodOptional<z.ZodString>;
        unrealizedPnl: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>;
    type: z.ZodOptional<z.ZodAny>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    position: z.ZodObject<{
        coin: z.ZodString;
        entryPx: z.ZodOptional<z.ZodString>;
        leverage: z.ZodOptional<z.ZodAny>;
        liquidationPx: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        marginUsed: z.ZodOptional<z.ZodString>;
        positionValue: z.ZodOptional<z.ZodString>;
        returnOnEquity: z.ZodOptional<z.ZodString>;
        szi: z.ZodOptional<z.ZodString>;
        unrealizedPnl: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        coin: z.ZodString;
        entryPx: z.ZodOptional<z.ZodString>;
        leverage: z.ZodOptional<z.ZodAny>;
        liquidationPx: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        marginUsed: z.ZodOptional<z.ZodString>;
        positionValue: z.ZodOptional<z.ZodString>;
        returnOnEquity: z.ZodOptional<z.ZodString>;
        szi: z.ZodOptional<z.ZodString>;
        unrealizedPnl: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        coin: z.ZodString;
        entryPx: z.ZodOptional<z.ZodString>;
        leverage: z.ZodOptional<z.ZodAny>;
        liquidationPx: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        marginUsed: z.ZodOptional<z.ZodString>;
        positionValue: z.ZodOptional<z.ZodString>;
        returnOnEquity: z.ZodOptional<z.ZodString>;
        szi: z.ZodOptional<z.ZodString>;
        unrealizedPnl: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>;
    type: z.ZodOptional<z.ZodAny>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Hyperliquid L2 orderbook level entry
 * Each level has price (px), size (sz), and number of orders (n)
 */
export interface HyperliquidL2Level {
    px: string;
    sz: string;
    n: number;
}
export declare const HyperliquidL2LevelSchema: z.ZodObject<{
    px: z.ZodString;
    sz: z.ZodString;
    n: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    px: z.ZodString;
    sz: z.ZodString;
    n: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    px: z.ZodString;
    sz: z.ZodString;
    n: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Hyperliquid L2 orderbook response
 * levels[0] = bids, levels[1] = asks
 */
export interface HyperliquidL2Book {
    coin: string;
    levels: [HyperliquidL2Level[], HyperliquidL2Level[]];
    time: number;
}
export declare const HyperliquidL2BookSchema: z.ZodObject<{
    coin: z.ZodString;
    levels: z.ZodTuple<[z.ZodArray<z.ZodObject<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">, z.ZodArray<z.ZodObject<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">], null>;
    time: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    coin: z.ZodString;
    levels: z.ZodTuple<[z.ZodArray<z.ZodObject<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">, z.ZodArray<z.ZodObject<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">], null>;
    time: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    coin: z.ZodString;
    levels: z.ZodTuple<[z.ZodArray<z.ZodObject<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">, z.ZodArray<z.ZodObject<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        px: z.ZodString;
        sz: z.ZodString;
        n: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">], null>;
    time: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Hyperliquid allMids REST API response
 * REST API returns: { "BTC": "82789.5", "ETH": "2720.8", ... }
 */
export type HyperliquidAllMids = Record<string, string>;
export declare const HyperliquidAllMidsSchema: z.ZodRecord<z.ZodString, z.ZodString>;
/**
 * Hyperliquid allMids WebSocket message
 * WebSocket returns: { mids: { "BTC": "82789.5", ... } }
 */
export interface HyperliquidAllMidsWsMessage {
    mids: Record<string, string>;
}
export declare const HyperliquidAllMidsWsMessageSchema: z.ZodObject<{
    mids: z.ZodRecord<z.ZodString, z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    mids: z.ZodRecord<z.ZodString, z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    mids: z.ZodRecord<z.ZodString, z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export interface HyperliquidFundingRate {
    coin: string;
    fundingRate: string;
    premium: string;
    time: number;
}
export declare const HyperliquidFundingRateSchema: z.ZodObject<{
    coin: z.ZodString;
    fundingRate: z.ZodString;
    premium: z.ZodString;
    time: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    coin: z.ZodString;
    fundingRate: z.ZodString;
    premium: z.ZodString;
    time: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    coin: z.ZodString;
    fundingRate: z.ZodString;
    premium: z.ZodString;
    time: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface HyperliquidWsSubscription {
    method: 'subscribe' | 'unsubscribe';
    subscription: {
        type: 'l2Book' | 'trades' | 'allMids' | 'user' | 'userEvents' | 'userFills';
        coin?: string;
        user?: string;
    };
}
export interface HyperliquidWsMessage {
    channel: string;
    data: unknown;
}
export interface HyperliquidWsL2BookUpdate {
    coin: string;
    levels: [HyperliquidL2Level[], HyperliquidL2Level[]];
    time: number;
}
export interface HyperliquidWsTrade {
    coin: string;
    side: 'B' | 'A';
    px: string;
    sz: string;
    time: number;
    hash: string;
}
export declare const HyperliquidWsTradeSchema: z.ZodObject<{
    coin: z.ZodString;
    side: z.ZodString;
    px: z.ZodString;
    sz: z.ZodString;
    time: z.ZodNumber;
    hash: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    coin: z.ZodString;
    side: z.ZodString;
    px: z.ZodString;
    sz: z.ZodString;
    time: z.ZodNumber;
    hash: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    coin: z.ZodString;
    side: z.ZodString;
    px: z.ZodString;
    sz: z.ZodString;
    time: z.ZodNumber;
    hash: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export interface HyperliquidWsUserEvent {
    user: string;
    fills?: HyperliquidFill[];
    liquidations?: unknown[];
}
export interface HyperliquidFill {
    coin: string;
    px: string;
    sz: string;
    side: 'B' | 'A';
    time: number;
    startPosition: string;
    dir: string;
    closedPnl: string;
    hash: string;
    oid: number;
    crossed: boolean;
    fee: string;
    tid: number;
}
export declare const HyperliquidFillSchema: z.ZodObject<{
    coin: z.ZodString;
    px: z.ZodString;
    sz: z.ZodString;
    side: z.ZodString;
    time: z.ZodNumber;
    startPosition: z.ZodString;
    dir: z.ZodString;
    closedPnl: z.ZodString;
    hash: z.ZodString;
    oid: z.ZodNumber;
    crossed: z.ZodBoolean;
    fee: z.ZodString;
    tid: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    coin: z.ZodString;
    px: z.ZodString;
    sz: z.ZodString;
    side: z.ZodString;
    time: z.ZodNumber;
    startPosition: z.ZodString;
    dir: z.ZodString;
    closedPnl: z.ZodString;
    hash: z.ZodString;
    oid: z.ZodNumber;
    crossed: z.ZodBoolean;
    fee: z.ZodString;
    tid: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    coin: z.ZodString;
    px: z.ZodString;
    sz: z.ZodString;
    side: z.ZodString;
    time: z.ZodNumber;
    startPosition: z.ZodString;
    dir: z.ZodString;
    closedPnl: z.ZodString;
    hash: z.ZodString;
    oid: z.ZodNumber;
    crossed: z.ZodBoolean;
    fee: z.ZodString;
    tid: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface HyperliquidHistoricalOrder {
    order: {
        coin: string;
        side: 'B' | 'A';
        limitPx: string;
        sz: string;
        oid: number;
        timestamp: number;
        origSz: string;
        cloid?: string;
        orderType?: string;
    };
    status: 'filled' | 'canceled' | 'open' | 'rejected';
    statusTimestamp: number;
}
export declare const HyperliquidHistoricalOrderSchema: z.ZodObject<{
    order: z.ZodObject<{
        coin: z.ZodString;
        side: z.ZodString;
        limitPx: z.ZodString;
        sz: z.ZodString;
        oid: z.ZodNumber;
        timestamp: z.ZodNumber;
        origSz: z.ZodString;
        cloid: z.ZodOptional<z.ZodString>;
        orderType: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        coin: z.ZodString;
        side: z.ZodString;
        limitPx: z.ZodString;
        sz: z.ZodString;
        oid: z.ZodNumber;
        timestamp: z.ZodNumber;
        origSz: z.ZodString;
        cloid: z.ZodOptional<z.ZodString>;
        orderType: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        coin: z.ZodString;
        side: z.ZodString;
        limitPx: z.ZodString;
        sz: z.ZodString;
        oid: z.ZodNumber;
        timestamp: z.ZodNumber;
        origSz: z.ZodString;
        cloid: z.ZodOptional<z.ZodString>;
        orderType: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>;
    status: z.ZodString;
    statusTimestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    order: z.ZodObject<{
        coin: z.ZodString;
        side: z.ZodString;
        limitPx: z.ZodString;
        sz: z.ZodString;
        oid: z.ZodNumber;
        timestamp: z.ZodNumber;
        origSz: z.ZodString;
        cloid: z.ZodOptional<z.ZodString>;
        orderType: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        coin: z.ZodString;
        side: z.ZodString;
        limitPx: z.ZodString;
        sz: z.ZodString;
        oid: z.ZodNumber;
        timestamp: z.ZodNumber;
        origSz: z.ZodString;
        cloid: z.ZodOptional<z.ZodString>;
        orderType: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        coin: z.ZodString;
        side: z.ZodString;
        limitPx: z.ZodString;
        sz: z.ZodString;
        oid: z.ZodNumber;
        timestamp: z.ZodNumber;
        origSz: z.ZodString;
        cloid: z.ZodOptional<z.ZodString>;
        orderType: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>;
    status: z.ZodString;
    statusTimestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    order: z.ZodObject<{
        coin: z.ZodString;
        side: z.ZodString;
        limitPx: z.ZodString;
        sz: z.ZodString;
        oid: z.ZodNumber;
        timestamp: z.ZodNumber;
        origSz: z.ZodString;
        cloid: z.ZodOptional<z.ZodString>;
        orderType: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        coin: z.ZodString;
        side: z.ZodString;
        limitPx: z.ZodString;
        sz: z.ZodString;
        oid: z.ZodNumber;
        timestamp: z.ZodNumber;
        origSz: z.ZodString;
        cloid: z.ZodOptional<z.ZodString>;
        orderType: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        coin: z.ZodString;
        side: z.ZodString;
        limitPx: z.ZodString;
        sz: z.ZodString;
        oid: z.ZodNumber;
        timestamp: z.ZodNumber;
        origSz: z.ZodString;
        cloid: z.ZodOptional<z.ZodString>;
        orderType: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>;
    status: z.ZodString;
    statusTimestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export interface HyperliquidUserFill {
    coin: string;
    px: string;
    sz: string;
    side: 'B' | 'A';
    time: number;
    startPosition: string;
    dir: string;
    closedPnl: string;
    hash: string;
    oid: number;
    crossed: boolean;
    fee: string;
    tid: number;
    feeToken: string;
}
export declare const HyperliquidUserFillSchema: z.ZodObject<{
    coin: z.ZodString;
    px: z.ZodString;
    sz: z.ZodString;
    side: z.ZodString;
    time: z.ZodNumber;
    startPosition: z.ZodString;
    dir: z.ZodString;
    closedPnl: z.ZodString;
    hash: z.ZodString;
    oid: z.ZodNumber;
    crossed: z.ZodBoolean;
    fee: z.ZodString;
    tid: z.ZodNumber;
    feeToken: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    coin: z.ZodString;
    px: z.ZodString;
    sz: z.ZodString;
    side: z.ZodString;
    time: z.ZodNumber;
    startPosition: z.ZodString;
    dir: z.ZodString;
    closedPnl: z.ZodString;
    hash: z.ZodString;
    oid: z.ZodNumber;
    crossed: z.ZodBoolean;
    fee: z.ZodString;
    tid: z.ZodNumber;
    feeToken: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    coin: z.ZodString;
    px: z.ZodString;
    sz: z.ZodString;
    side: z.ZodString;
    time: z.ZodNumber;
    startPosition: z.ZodString;
    dir: z.ZodString;
    closedPnl: z.ZodString;
    hash: z.ZodString;
    oid: z.ZodNumber;
    crossed: z.ZodBoolean;
    fee: z.ZodString;
    tid: z.ZodNumber;
    feeToken: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export interface HyperliquidOrderRequest {
    coin: string;
    is_buy: boolean;
    sz: number;
    limit_px: number;
    order_type: {
        limit: {
            tif: 'Gtc' | 'Ioc' | 'Alo';
        };
    } | {
        market: Record<string, never>;
    };
    reduce_only: boolean;
    cloid?: string;
}
export interface HyperliquidCancelRequest {
    coin: string;
    oid: number;
}
export interface HyperliquidAction {
    type: 'order' | 'cancel' | 'cancelByCloid' | 'batchModify';
    orders?: HyperliquidOrderRequest[];
    cancels?: HyperliquidCancelRequest[];
    grouping?: 'na';
    builder?: {
        b: string;
        f: number;
    };
}
export interface HyperliquidSignedAction {
    action: HyperliquidAction;
    nonce: number;
    signature: {
        r: string;
        s: string;
        v: number;
    };
    vaultAddress?: string;
}
export interface HyperliquidUserFees {
    userCrossRate: string;
    userAddRate: string;
    userSpotCrossRate: string;
    userSpotAddRate: string;
    activeReferralDiscount: string;
    dailyUserVlm: Array<{
        date: string;
        userCross: string;
        userAdd: string;
        exchange: string;
    }>;
    feeSchedule: {
        cross: string;
        add: string;
        spotCross: string;
        spotAdd: string;
        tiers: Array<{
            tier: number;
            vlm: string;
            crossRate: string;
            addRate: string;
        }>;
    };
}
export type PortfolioPeriod = 'day' | 'week' | 'month' | 'allTime' | 'perpDay' | 'perpWeek' | 'perpMonth' | 'perpAllTime';
export interface HyperliquidPortfolioPeriodData {
    accountValueHistory: Array<[number, string]>;
    pnlHistory: Array<[number, string]>;
    vlm: string;
}
export type HyperliquidPortfolio = Array<[PortfolioPeriod, HyperliquidPortfolioPeriodData]>;
export interface HyperliquidUserRateLimit {
    cumVlm: string;
    nRequestsUsed: number;
    nRequestsCap: number;
    nRequestsSurplus?: number;
}
//# sourceMappingURL=types.d.ts.map
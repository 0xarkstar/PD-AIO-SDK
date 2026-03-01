/**
 * Drift Protocol Exchange-Specific Types
 *
 * Type definitions for Drift Protocol on-chain data and API responses.
 * Drift uses Solana program accounts for trading data.
 *
 * @see https://docs.drift.trade/
 * @see https://drift-labs.github.io/v2-teacher/
 */
import { z } from 'zod';
export type DriftOrderType = 'market' | 'limit' | 'triggerMarket' | 'triggerLimit' | 'oracle';
export type DriftDirection = 'long' | 'short';
export type DriftMarketType = 'perp' | 'spot';
export type DriftOrderStatus = 'open' | 'filled' | 'canceled' | 'expired';
export type DriftPositionDirection = 'long' | 'short';
export type DriftTriggerCondition = 'above' | 'below';
export type DriftPostOnlyParams = 'none' | 'mustPostOnly' | 'tryPostOnly' | 'slide';
/**
 * Perpetual position account data
 */
export interface DriftPerpPosition {
    /** Market index */
    marketIndex: number;
    /** Base asset amount (positive for long, negative for short) */
    baseAssetAmount: string;
    /** Quote asset amount */
    quoteAssetAmount: string;
    /** Quote entry amount */
    quoteEntryAmount: string;
    /** Quote break-even amount */
    quoteBreakEvenAmount: string;
    /** Open orders count */
    openOrders: number;
    /** Open bids (base asset) */
    openBids: string;
    /** Open asks (base asset) */
    openAsks: string;
    /** Settled PnL */
    settledPnl: string;
    /** LP shares */
    lpShares: string;
    /** Last cumulative funding rate */
    lastCumulativeFundingRate: string;
    /** Per LP base */
    perLpBase: number;
}
export declare const DriftPerpPositionSchema: z.ZodObject<{
    marketIndex: z.ZodNumber;
    baseAssetAmount: z.ZodString;
    quoteAssetAmount: z.ZodString;
    quoteEntryAmount: z.ZodString;
    quoteBreakEvenAmount: z.ZodString;
    openOrders: z.ZodNumber;
    openBids: z.ZodString;
    openAsks: z.ZodString;
    settledPnl: z.ZodString;
    lpShares: z.ZodString;
    lastCumulativeFundingRate: z.ZodString;
    perLpBase: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    marketIndex: z.ZodNumber;
    baseAssetAmount: z.ZodString;
    quoteAssetAmount: z.ZodString;
    quoteEntryAmount: z.ZodString;
    quoteBreakEvenAmount: z.ZodString;
    openOrders: z.ZodNumber;
    openBids: z.ZodString;
    openAsks: z.ZodString;
    settledPnl: z.ZodString;
    lpShares: z.ZodString;
    lastCumulativeFundingRate: z.ZodString;
    perLpBase: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    marketIndex: z.ZodNumber;
    baseAssetAmount: z.ZodString;
    quoteAssetAmount: z.ZodString;
    quoteEntryAmount: z.ZodString;
    quoteBreakEvenAmount: z.ZodString;
    openOrders: z.ZodNumber;
    openBids: z.ZodString;
    openAsks: z.ZodString;
    settledPnl: z.ZodString;
    lpShares: z.ZodString;
    lastCumulativeFundingRate: z.ZodString;
    perLpBase: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Spot position account data
 */
export interface DriftSpotPosition {
    /** Market index */
    marketIndex: number;
    /** Scaled balance */
    scaledBalance: string;
    /** Balance type: deposit or borrow */
    balanceType: 'deposit' | 'borrow';
    /** Open orders count */
    openOrders: number;
    /** Cumulative deposits */
    cumulativeDeposits: string;
}
export declare const DriftSpotPositionSchema: z.ZodObject<{
    marketIndex: z.ZodNumber;
    scaledBalance: z.ZodString;
    balanceType: z.ZodString;
    openOrders: z.ZodNumber;
    cumulativeDeposits: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    marketIndex: z.ZodNumber;
    scaledBalance: z.ZodString;
    balanceType: z.ZodString;
    openOrders: z.ZodNumber;
    cumulativeDeposits: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    marketIndex: z.ZodNumber;
    scaledBalance: z.ZodString;
    balanceType: z.ZodString;
    openOrders: z.ZodNumber;
    cumulativeDeposits: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Order account data
 */
export interface DriftOrder {
    /** Order status */
    status: DriftOrderStatus;
    /** Order type */
    orderType: DriftOrderType;
    /** Market type */
    marketType: DriftMarketType;
    /** Slot order was placed */
    slot: number;
    /** Order ID */
    orderId: number;
    /** User order ID (client specified) */
    userOrderId: number;
    /** Market index */
    marketIndex: number;
    /** Price (PRICE_PRECISION) */
    price: string;
    /** Base asset amount (BASE_PRECISION) */
    baseAssetAmount: string;
    /** Base asset amount filled */
    baseAssetAmountFilled: string;
    /** Quote asset amount filled */
    quoteAssetAmountFilled: string;
    /** Direction */
    direction: DriftDirection;
    /** Reduce only flag */
    reduceOnly: boolean;
    /** Trigger price */
    triggerPrice: string;
    /** Trigger condition */
    triggerCondition: DriftTriggerCondition;
    /** Existing position direction (for close orders) */
    existingPositionDirection: DriftPositionDirection;
    /** Post only params */
    postOnly: DriftPostOnlyParams;
    /** Immediate or cancel flag */
    immediateOrCancel: boolean;
    /** Max timestamp */
    maxTs: string;
    /** Oracle price offset */
    oraclePriceOffset: number;
    /** Auction duration */
    auctionDuration: number;
    /** Auction start price */
    auctionStartPrice: string;
    /** Auction end price */
    auctionEndPrice: string;
}
export declare const DriftOrderSchema: z.ZodObject<{
    status: z.ZodString;
    orderType: z.ZodString;
    marketType: z.ZodString;
    slot: z.ZodNumber;
    orderId: z.ZodNumber;
    userOrderId: z.ZodNumber;
    marketIndex: z.ZodNumber;
    price: z.ZodString;
    baseAssetAmount: z.ZodString;
    baseAssetAmountFilled: z.ZodString;
    quoteAssetAmountFilled: z.ZodString;
    direction: z.ZodString;
    reduceOnly: z.ZodBoolean;
    triggerPrice: z.ZodString;
    triggerCondition: z.ZodString;
    existingPositionDirection: z.ZodString;
    postOnly: z.ZodString;
    immediateOrCancel: z.ZodBoolean;
    maxTs: z.ZodString;
    oraclePriceOffset: z.ZodNumber;
    auctionDuration: z.ZodNumber;
    auctionStartPrice: z.ZodString;
    auctionEndPrice: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    status: z.ZodString;
    orderType: z.ZodString;
    marketType: z.ZodString;
    slot: z.ZodNumber;
    orderId: z.ZodNumber;
    userOrderId: z.ZodNumber;
    marketIndex: z.ZodNumber;
    price: z.ZodString;
    baseAssetAmount: z.ZodString;
    baseAssetAmountFilled: z.ZodString;
    quoteAssetAmountFilled: z.ZodString;
    direction: z.ZodString;
    reduceOnly: z.ZodBoolean;
    triggerPrice: z.ZodString;
    triggerCondition: z.ZodString;
    existingPositionDirection: z.ZodString;
    postOnly: z.ZodString;
    immediateOrCancel: z.ZodBoolean;
    maxTs: z.ZodString;
    oraclePriceOffset: z.ZodNumber;
    auctionDuration: z.ZodNumber;
    auctionStartPrice: z.ZodString;
    auctionEndPrice: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    status: z.ZodString;
    orderType: z.ZodString;
    marketType: z.ZodString;
    slot: z.ZodNumber;
    orderId: z.ZodNumber;
    userOrderId: z.ZodNumber;
    marketIndex: z.ZodNumber;
    price: z.ZodString;
    baseAssetAmount: z.ZodString;
    baseAssetAmountFilled: z.ZodString;
    quoteAssetAmountFilled: z.ZodString;
    direction: z.ZodString;
    reduceOnly: z.ZodBoolean;
    triggerPrice: z.ZodString;
    triggerCondition: z.ZodString;
    existingPositionDirection: z.ZodString;
    postOnly: z.ZodString;
    immediateOrCancel: z.ZodBoolean;
    maxTs: z.ZodString;
    oraclePriceOffset: z.ZodNumber;
    auctionDuration: z.ZodNumber;
    auctionStartPrice: z.ZodString;
    auctionEndPrice: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
/**
 * User account data
 */
export interface DriftUserAccount {
    /** Authority public key */
    authority: string;
    /** Delegate public key */
    delegate: string;
    /** Sub-account ID */
    subAccountId: number;
    /** Name */
    name: string;
    /** Spot positions */
    spotPositions: DriftSpotPosition[];
    /** Perp positions */
    perpPositions: DriftPerpPosition[];
    /** Orders */
    orders: DriftOrder[];
    /** Last add perp LP shares timestamp */
    lastAddPerpLpSharesTs: string;
    /** Total deposits */
    totalDeposits: string;
    /** Total withdraws */
    totalWithdraws: string;
    /** Total social loss */
    totalSocialLoss: string;
    /** Settled perp PnL */
    settledPerpPnl: string;
    /** Cumulative spot fees */
    cumulativeSpotFees: string;
    /** Cumulative perp funding */
    cumulativePerpFunding: string;
    /** Liquidation margin freed */
    liquidationMarginFreed: string;
    /** Last active slot */
    lastActiveSlot: string;
    /** Is margin trading enabled */
    isMarginTradingEnabled: boolean;
    /** Idle flag */
    idle: boolean;
    /** Open orders */
    openOrders: number;
    /** Has open order */
    hasOpenOrder: boolean;
    /** Open auctions */
    openAuctions: number;
    /** Has open auction */
    hasOpenAuction: boolean;
}
/**
 * AMM (Automated Market Maker) data
 */
export interface DriftAMM {
    /** Oracle source */
    oracleSource: string;
    /** Base asset reserve */
    baseAssetReserve: string;
    /** Quote asset reserve */
    quoteAssetReserve: string;
    /** Square root K */
    sqrtK: string;
    /** Peg multiplier */
    pegMultiplier: string;
    /** Terminal quote asset reserve */
    terminalQuoteAssetReserve: string;
    /** Base asset amount with AMM */
    baseAssetAmountWithAmm: string;
    /** Base asset amount long */
    baseAssetAmountLong: string;
    /** Base asset amount short */
    baseAssetAmountShort: string;
    /** Quote asset amount */
    quoteAssetAmount: string;
    /** Quote entry amount long */
    quoteEntryAmountLong: string;
    /** Quote entry amount short */
    quoteEntryAmountShort: string;
    /** Quote break-even amount long */
    quoteBreakEvenAmountLong: string;
    /** Quote break-even amount short */
    quoteBreakEvenAmountShort: string;
    /** User LP shares */
    userLpShares: string;
    /** Last funding rate */
    lastFundingRate: string;
    /** Last funding rate long */
    lastFundingRateLong: string;
    /** Last funding rate short */
    lastFundingRateShort: string;
    /** Last 24h average funding rate */
    last24hAvgFundingRate: string;
    /** Total fee */
    totalFee: string;
    /** Total MM fee */
    totalMmFee: string;
    /** Total exchange fee */
    totalExchangeFee: string;
    /** Total fee minus distributions */
    totalFeeMinusDistributions: string;
    /** Total fee withdrawn */
    totalFeeWithdrawn: string;
    /** Total liquidation fee */
    totalLiquidationFee: string;
    /** Cumulative funding rate long */
    cumulativeFundingRateLong: string;
    /** Cumulative funding rate short */
    cumulativeFundingRateShort: string;
    /** Total social loss */
    totalSocialLoss: string;
    /** Ask base asset reserve */
    askBaseAssetReserve: string;
    /** Ask quote asset reserve */
    askQuoteAssetReserve: string;
    /** Bid base asset reserve */
    bidBaseAssetReserve: string;
    /** Bid quote asset reserve */
    bidQuoteAssetReserve: string;
    /** Last oracle normalised price */
    lastOracleNormalisedPrice: string;
    /** Last oracle reserve price spread pct */
    lastOracleReservePriceSpreadPct: string;
    /** Last bid price twap */
    lastBidPriceTwap: string;
    /** Last ask price twap */
    lastAskPriceTwap: string;
    /** Last mark price twap */
    lastMarkPriceTwap: string;
    /** Last mark price twap 5min */
    lastMarkPriceTwap5min: string;
    /** Last update slot */
    lastUpdateSlot: string;
    /** Last oracle confPct */
    lastOracleConfPct: string;
    /** Net revenue since last funding */
    netRevenueSinceLastFunding: string;
    /** Last funding rate timestamp */
    lastFundingRateTs: string;
    /** Funding period */
    fundingPeriod: string;
    /** Order step size */
    orderStepSize: string;
    /** Order tick size */
    orderTickSize: string;
    /** Min order size */
    minOrderSize: string;
    /** Max position size */
    maxPositionSize: string;
    /** Volume 24h */
    volume24h: string;
    /** Long intensity count */
    longIntensityCount: number;
    /** Long intensity volume */
    longIntensityVolume: string;
    /** Short intensity count */
    shortIntensityCount: number;
    /** Short intensity volume */
    shortIntensityVolume: string;
    /** Max spread */
    maxSpread: number;
    /** Max fill reserve fraction */
    maxFillReserveFraction: number;
    /** Max slippage ratio */
    maxSlippageRatio: number;
    /** Curve update intensity */
    curveUpdateIntensity: number;
    /** AMM jit intensity */
    ammJitIntensity: number;
    /** Oracle public key */
    oracle: string;
    /** Historical oracle data */
    historicalOracleData: {
        lastOraclePrice: string;
        lastOracleConf: string;
        lastOracleDelay: string;
        lastOraclePriceTwap: string;
        lastOraclePriceTwap5min: string;
        lastOraclePriceTwapTs: string;
    };
    /** Base spread */
    baseSpread: number;
    /** Max base asset reserve */
    maxBaseAssetReserve: string;
    /** Min base asset reserve */
    minBaseAssetReserve: string;
    /** Total LP shares */
    totalLpShares: string;
    /** Per LP base */
    perLpBase: number;
}
/**
 * Perp market account data
 */
export interface DriftPerpMarketAccount {
    /** Market status */
    status: string;
    /** Market index */
    marketIndex: number;
    /** PnL pool */
    pnlPool: {
        scaledBalance: string;
        marketIndex: number;
    };
    /** Name */
    name: string;
    /** AMM */
    amm: DriftAMM;
    /** Number of users with base */
    numberOfUsersWithBase: number;
    /** Number of users */
    numberOfUsers: number;
    /** Margin ratio initial */
    marginRatioInitial: number;
    /** Margin ratio maintenance */
    marginRatioMaintenance: number;
    /** Next fill record ID */
    nextFillRecordId: string;
    /** Next funding rate record ID */
    nextFundingRateRecordId: string;
    /** Next curve record ID */
    nextCurveRecordId: string;
    /** Imf factor */
    imfFactor: number;
    /** Unrealized PnL IMF factor */
    unrealizedPnlImfFactor: number;
    /** Liquidator fee */
    liquidatorFee: number;
    /** If liquidation fee */
    ifLiquidationFee: number;
    /** Unrealized PnL max imbalance */
    unrealizedPnlMaxImbalance: string;
    /** Expiry timestamp */
    expiryTs: string;
    /** Expiry price */
    expiryPrice: string;
    /** PnL pool */
    insuranceClaim: {
        revenueWithdrawSinceLastSettle: string;
        maxRevenueWithdrawPerPeriod: string;
        lastRevenueWithdrawTs: string;
        quoteSettledInsurance: string;
        quoteMaxInsurance: string;
    };
    /** Contract type */
    contractType: string;
    /** Contract tier */
    contractTier: string;
    /** Paused operations */
    pausedOperations: number;
    /** Quote spot market index */
    quoteSpotMarketIndex: number;
    /** Fee adjustment */
    feeAdjustment: number;
}
export declare const DriftPerpMarketAccountSchema: z.ZodObject<{
    status: z.ZodString;
    marketIndex: z.ZodNumber;
    pnlPool: z.ZodObject<{
        scaledBalance: z.ZodString;
        marketIndex: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        scaledBalance: z.ZodString;
        marketIndex: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        scaledBalance: z.ZodString;
        marketIndex: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>;
    name: z.ZodString;
    amm: z.ZodAny;
    numberOfUsersWithBase: z.ZodNumber;
    numberOfUsers: z.ZodNumber;
    marginRatioInitial: z.ZodNumber;
    marginRatioMaintenance: z.ZodNumber;
    nextFillRecordId: z.ZodString;
    nextFundingRateRecordId: z.ZodString;
    nextCurveRecordId: z.ZodString;
    imfFactor: z.ZodNumber;
    unrealizedPnlImfFactor: z.ZodNumber;
    liquidatorFee: z.ZodNumber;
    ifLiquidationFee: z.ZodNumber;
    unrealizedPnlMaxImbalance: z.ZodString;
    expiryTs: z.ZodString;
    expiryPrice: z.ZodString;
    insuranceClaim: z.ZodAny;
    contractType: z.ZodString;
    contractTier: z.ZodString;
    pausedOperations: z.ZodNumber;
    quoteSpotMarketIndex: z.ZodNumber;
    feeAdjustment: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    status: z.ZodString;
    marketIndex: z.ZodNumber;
    pnlPool: z.ZodObject<{
        scaledBalance: z.ZodString;
        marketIndex: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        scaledBalance: z.ZodString;
        marketIndex: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        scaledBalance: z.ZodString;
        marketIndex: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>;
    name: z.ZodString;
    amm: z.ZodAny;
    numberOfUsersWithBase: z.ZodNumber;
    numberOfUsers: z.ZodNumber;
    marginRatioInitial: z.ZodNumber;
    marginRatioMaintenance: z.ZodNumber;
    nextFillRecordId: z.ZodString;
    nextFundingRateRecordId: z.ZodString;
    nextCurveRecordId: z.ZodString;
    imfFactor: z.ZodNumber;
    unrealizedPnlImfFactor: z.ZodNumber;
    liquidatorFee: z.ZodNumber;
    ifLiquidationFee: z.ZodNumber;
    unrealizedPnlMaxImbalance: z.ZodString;
    expiryTs: z.ZodString;
    expiryPrice: z.ZodString;
    insuranceClaim: z.ZodAny;
    contractType: z.ZodString;
    contractTier: z.ZodString;
    pausedOperations: z.ZodNumber;
    quoteSpotMarketIndex: z.ZodNumber;
    feeAdjustment: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    status: z.ZodString;
    marketIndex: z.ZodNumber;
    pnlPool: z.ZodObject<{
        scaledBalance: z.ZodString;
        marketIndex: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        scaledBalance: z.ZodString;
        marketIndex: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        scaledBalance: z.ZodString;
        marketIndex: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>;
    name: z.ZodString;
    amm: z.ZodAny;
    numberOfUsersWithBase: z.ZodNumber;
    numberOfUsers: z.ZodNumber;
    marginRatioInitial: z.ZodNumber;
    marginRatioMaintenance: z.ZodNumber;
    nextFillRecordId: z.ZodString;
    nextFundingRateRecordId: z.ZodString;
    nextCurveRecordId: z.ZodString;
    imfFactor: z.ZodNumber;
    unrealizedPnlImfFactor: z.ZodNumber;
    liquidatorFee: z.ZodNumber;
    ifLiquidationFee: z.ZodNumber;
    unrealizedPnlMaxImbalance: z.ZodString;
    expiryTs: z.ZodString;
    expiryPrice: z.ZodString;
    insuranceClaim: z.ZodAny;
    contractType: z.ZodString;
    contractTier: z.ZodString;
    pausedOperations: z.ZodNumber;
    quoteSpotMarketIndex: z.ZodNumber;
    feeAdjustment: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * L2 Order book response
 */
export interface DriftL2OrderBook {
    /** Market index */
    marketIndex: number;
    /** Market type */
    marketType: DriftMarketType;
    /** Market name (e.g., "SOL-PERP") */
    marketName?: string;
    /** Bids - array of [price, size] */
    bids: Array<{
        price: string;
        size: string;
        sources?: Record<string, string>;
    }>;
    /** Asks - array of [price, size] */
    asks: Array<{
        price: string;
        size: string;
        sources?: Record<string, string>;
    }>;
    /** Oracle price */
    oraclePrice: string;
    /** Slot */
    slot: number;
}
export declare const DriftL2OrderBookSchema: z.ZodObject<{
    marketIndex: z.ZodNumber;
    marketType: z.ZodString;
    marketName: z.ZodOptional<z.ZodString>;
    bids: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
        sources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        price: string;
        size: string;
        sources?: Record<string, string> | undefined;
    }, {
        price: string;
        size: string;
        sources?: Record<string, string> | undefined;
    }>, "many">;
    asks: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
        sources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        price: string;
        size: string;
        sources?: Record<string, string> | undefined;
    }, {
        price: string;
        size: string;
        sources?: Record<string, string> | undefined;
    }>, "many">;
    oraclePrice: z.ZodString;
    slot: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    marketIndex: z.ZodNumber;
    marketType: z.ZodString;
    marketName: z.ZodOptional<z.ZodString>;
    bids: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
        sources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        price: string;
        size: string;
        sources?: Record<string, string> | undefined;
    }, {
        price: string;
        size: string;
        sources?: Record<string, string> | undefined;
    }>, "many">;
    asks: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
        sources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        price: string;
        size: string;
        sources?: Record<string, string> | undefined;
    }, {
        price: string;
        size: string;
        sources?: Record<string, string> | undefined;
    }>, "many">;
    oraclePrice: z.ZodString;
    slot: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    marketIndex: z.ZodNumber;
    marketType: z.ZodString;
    marketName: z.ZodOptional<z.ZodString>;
    bids: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
        sources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        price: string;
        size: string;
        sources?: Record<string, string> | undefined;
    }, {
        price: string;
        size: string;
        sources?: Record<string, string> | undefined;
    }>, "many">;
    asks: z.ZodArray<z.ZodObject<{
        price: z.ZodString;
        size: z.ZodString;
        sources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        price: string;
        size: string;
        sources?: Record<string, string> | undefined;
    }, {
        price: string;
        size: string;
        sources?: Record<string, string> | undefined;
    }>, "many">;
    oraclePrice: z.ZodString;
    slot: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Trade response from DLOB
 */
export interface DriftTrade {
    /** Trade record ID */
    recordId: string;
    /** Fill record ID */
    fillRecordId: string;
    /** Market index */
    marketIndex: number;
    /** Market type */
    marketType: DriftMarketType;
    /** Taker */
    taker: string;
    /** Taker order ID */
    takerOrderId: number;
    /** Taker order direction */
    takerOrderDirection: DriftDirection;
    /** Maker */
    maker: string;
    /** Maker order ID */
    makerOrderId: number;
    /** Maker order direction */
    makerOrderDirection: DriftDirection;
    /** Base asset amount (filled) */
    baseAssetAmount: string;
    /** Quote asset amount (filled) */
    quoteAssetAmount: string;
    /** Fill price */
    fillPrice: string;
    /** Action */
    action: string;
    /** Action explanation */
    actionExplanation: string;
    /** Transaction signature */
    txSig: string;
    /** Slot */
    slot: number;
    /** Timestamp (Unix seconds) */
    ts: number;
}
export declare const DriftTradeSchema: z.ZodObject<{
    recordId: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    fillRecordId: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    marketIndex: z.ZodNumber;
    marketType: z.ZodString;
    taker: z.ZodString;
    takerOrderId: z.ZodNumber;
    takerOrderDirection: z.ZodString;
    maker: z.ZodString;
    makerOrderId: z.ZodNumber;
    makerOrderDirection: z.ZodString;
    baseAssetAmount: z.ZodString;
    quoteAssetAmount: z.ZodString;
    fillPrice: z.ZodString;
    action: z.ZodString;
    actionExplanation: z.ZodString;
    txSig: z.ZodString;
    slot: z.ZodNumber;
    ts: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    recordId: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    fillRecordId: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    marketIndex: z.ZodNumber;
    marketType: z.ZodString;
    taker: z.ZodString;
    takerOrderId: z.ZodNumber;
    takerOrderDirection: z.ZodString;
    maker: z.ZodString;
    makerOrderId: z.ZodNumber;
    makerOrderDirection: z.ZodString;
    baseAssetAmount: z.ZodString;
    quoteAssetAmount: z.ZodString;
    fillPrice: z.ZodString;
    action: z.ZodString;
    actionExplanation: z.ZodString;
    txSig: z.ZodString;
    slot: z.ZodNumber;
    ts: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    recordId: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    fillRecordId: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    marketIndex: z.ZodNumber;
    marketType: z.ZodString;
    taker: z.ZodString;
    takerOrderId: z.ZodNumber;
    takerOrderDirection: z.ZodString;
    maker: z.ZodString;
    makerOrderId: z.ZodNumber;
    makerOrderDirection: z.ZodString;
    baseAssetAmount: z.ZodString;
    quoteAssetAmount: z.ZodString;
    fillPrice: z.ZodString;
    action: z.ZodString;
    actionExplanation: z.ZodString;
    txSig: z.ZodString;
    slot: z.ZodNumber;
    ts: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Funding rate response
 */
export interface DriftFundingRate {
    /** Market index */
    marketIndex: number;
    /** Funding rate (FUNDING_RATE_PRECISION) */
    fundingRate: string;
    /** Funding rate long */
    fundingRateLong: string;
    /** Funding rate short */
    fundingRateShort: string;
    /** Cumulative funding rate long */
    cumulativeFundingRateLong: string;
    /** Cumulative funding rate short */
    cumulativeFundingRateShort: string;
    /** Oracle price */
    oraclePrice: string;
    /** Mark price twap */
    markPriceTwap: string;
    /** Timestamp */
    ts: number;
}
export declare const DriftFundingRateSchema: z.ZodObject<{
    marketIndex: z.ZodNumber;
    fundingRate: z.ZodString;
    fundingRateLong: z.ZodString;
    fundingRateShort: z.ZodString;
    cumulativeFundingRateLong: z.ZodString;
    cumulativeFundingRateShort: z.ZodString;
    oraclePrice: z.ZodString;
    markPriceTwap: z.ZodString;
    ts: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    marketIndex: z.ZodNumber;
    fundingRate: z.ZodString;
    fundingRateLong: z.ZodString;
    fundingRateShort: z.ZodString;
    cumulativeFundingRateLong: z.ZodString;
    cumulativeFundingRateShort: z.ZodString;
    oraclePrice: z.ZodString;
    markPriceTwap: z.ZodString;
    ts: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    marketIndex: z.ZodNumber;
    fundingRate: z.ZodString;
    fundingRateLong: z.ZodString;
    fundingRateShort: z.ZodString;
    cumulativeFundingRateLong: z.ZodString;
    cumulativeFundingRateShort: z.ZodString;
    oraclePrice: z.ZodString;
    markPriceTwap: z.ZodString;
    ts: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Historical funding rate record
 */
export interface DriftFundingRateRecord {
    /** Record ID */
    recordId: string;
    /** Market index */
    marketIndex: number;
    /** Funding rate */
    fundingRate: string;
    /** Funding rate long */
    fundingRateLong: string;
    /** Funding rate short */
    fundingRateShort: string;
    /** Cumulative funding rate long */
    cumulativeFundingRateLong: string;
    /** Cumulative funding rate short */
    cumulativeFundingRateShort: string;
    /** Oracle price twap */
    oraclePriceTwap: string;
    /** Mark price twap */
    markPriceTwap: string;
    /** Period revenue */
    periodRevenue: string;
    /** Base asset amount with AMM */
    baseAssetAmountWithAmm: string;
    /** Base asset amount with unsettled LP */
    baseAssetAmountWithUnsettledLp: string;
    /** Timestamp */
    ts: number;
}
export declare const DriftFundingRateRecordSchema: z.ZodObject<{
    recordId: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    marketIndex: z.ZodNumber;
    fundingRate: z.ZodString;
    fundingRateLong: z.ZodString;
    fundingRateShort: z.ZodString;
    cumulativeFundingRateLong: z.ZodString;
    cumulativeFundingRateShort: z.ZodString;
    oraclePriceTwap: z.ZodString;
    markPriceTwap: z.ZodString;
    periodRevenue: z.ZodString;
    baseAssetAmountWithAmm: z.ZodString;
    baseAssetAmountWithUnsettledLp: z.ZodString;
    ts: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    recordId: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    marketIndex: z.ZodNumber;
    fundingRate: z.ZodString;
    fundingRateLong: z.ZodString;
    fundingRateShort: z.ZodString;
    cumulativeFundingRateLong: z.ZodString;
    cumulativeFundingRateShort: z.ZodString;
    oraclePriceTwap: z.ZodString;
    markPriceTwap: z.ZodString;
    periodRevenue: z.ZodString;
    baseAssetAmountWithAmm: z.ZodString;
    baseAssetAmountWithUnsettledLp: z.ZodString;
    ts: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    recordId: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    marketIndex: z.ZodNumber;
    fundingRate: z.ZodString;
    fundingRateLong: z.ZodString;
    fundingRateShort: z.ZodString;
    cumulativeFundingRateLong: z.ZodString;
    cumulativeFundingRateShort: z.ZodString;
    oraclePriceTwap: z.ZodString;
    markPriceTwap: z.ZodString;
    periodRevenue: z.ZodString;
    baseAssetAmountWithAmm: z.ZodString;
    baseAssetAmountWithUnsettledLp: z.ZodString;
    ts: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Market stats/ticker
 */
export interface DriftMarketStats {
    /** Market index */
    marketIndex: number;
    /** Oracle price */
    oraclePrice: string;
    /** Mark price */
    markPrice: string;
    /** Bid price */
    bidPrice: string;
    /** Ask price */
    askPrice: string;
    /** Last fill price */
    lastFillPrice: string;
    /** 24h volume */
    volume24h: string;
    /** Open interest */
    openInterest: string;
    /** Open interest long */
    openInterestLong: string;
    /** Open interest short */
    openInterestShort: string;
    /** Funding rate */
    fundingRate: string;
    /** 24h funding rate */
    fundingRate24h: string;
    /** Next funding rate */
    nextFundingRate: string;
    /** Next funding timestamp */
    nextFundingTs: number;
    /** Timestamp */
    ts: number;
}
export declare const DriftMarketStatsSchema: z.ZodObject<{
    marketIndex: z.ZodNumber;
    oraclePrice: z.ZodString;
    markPrice: z.ZodString;
    bidPrice: z.ZodString;
    askPrice: z.ZodString;
    lastFillPrice: z.ZodString;
    volume24h: z.ZodString;
    openInterest: z.ZodString;
    openInterestLong: z.ZodString;
    openInterestShort: z.ZodString;
    fundingRate: z.ZodString;
    fundingRate24h: z.ZodString;
    nextFundingRate: z.ZodString;
    nextFundingTs: z.ZodNumber;
    ts: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    marketIndex: z.ZodNumber;
    oraclePrice: z.ZodString;
    markPrice: z.ZodString;
    bidPrice: z.ZodString;
    askPrice: z.ZodString;
    lastFillPrice: z.ZodString;
    volume24h: z.ZodString;
    openInterest: z.ZodString;
    openInterestLong: z.ZodString;
    openInterestShort: z.ZodString;
    fundingRate: z.ZodString;
    fundingRate24h: z.ZodString;
    nextFundingRate: z.ZodString;
    nextFundingTs: z.ZodNumber;
    ts: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    marketIndex: z.ZodNumber;
    oraclePrice: z.ZodString;
    markPrice: z.ZodString;
    bidPrice: z.ZodString;
    askPrice: z.ZodString;
    lastFillPrice: z.ZodString;
    volume24h: z.ZodString;
    openInterest: z.ZodString;
    openInterestLong: z.ZodString;
    openInterestShort: z.ZodString;
    fundingRate: z.ZodString;
    fundingRate24h: z.ZodString;
    nextFundingRate: z.ZodString;
    nextFundingTs: z.ZodNumber;
    ts: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Candle data
 */
export interface DriftCandle {
    /** Start timestamp */
    start: number;
    /** End timestamp */
    end: number;
    /** Resolution (in seconds) */
    resolution: number;
    /** Open price */
    open: string;
    /** High price */
    high: string;
    /** Low price */
    low: string;
    /** Close price */
    close: string;
    /** Volume */
    volume: string;
    /** Trade count */
    trades: number;
}
export declare const DriftCandleSchema: z.ZodObject<{
    start: z.ZodNumber;
    end: z.ZodNumber;
    resolution: z.ZodNumber;
    open: z.ZodString;
    high: z.ZodString;
    low: z.ZodString;
    close: z.ZodString;
    volume: z.ZodString;
    trades: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    start: z.ZodNumber;
    end: z.ZodNumber;
    resolution: z.ZodNumber;
    open: z.ZodString;
    high: z.ZodString;
    low: z.ZodString;
    close: z.ZodString;
    volume: z.ZodString;
    trades: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    start: z.ZodNumber;
    end: z.ZodNumber;
    resolution: z.ZodNumber;
    open: z.ZodString;
    high: z.ZodString;
    low: z.ZodString;
    close: z.ZodString;
    volume: z.ZodString;
    trades: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Normalized position for SDK
 */
export interface DriftNormalizedPosition {
    /** Symbol in unified format */
    symbol: string;
    /** Market index */
    marketIndex: number;
    /** Position side */
    side: 'long' | 'short';
    /** Size in base asset */
    size: number;
    /** Size in USD */
    sizeUsd: number;
    /** Entry price */
    entryPrice: number;
    /** Mark price */
    markPrice: number;
    /** Liquidation price */
    liquidationPrice: number;
    /** Unrealized PnL */
    unrealizedPnl: number;
    /** Realized PnL */
    realizedPnl: number;
    /** Leverage */
    leverage: number;
    /** Margin used */
    marginUsed: number;
}
/**
 * Normalized order for SDK
 */
export interface DriftNormalizedOrder {
    /** Order ID */
    id: string;
    /** User order ID */
    userOrderId: number;
    /** Symbol in unified format */
    symbol: string;
    /** Market index */
    marketIndex: number;
    /** Order type */
    type: DriftOrderType;
    /** Side */
    side: 'buy' | 'sell';
    /** Amount */
    amount: number;
    /** Price */
    price: number;
    /** Filled amount */
    filled: number;
    /** Remaining amount */
    remaining: number;
    /** Status */
    status: 'open' | 'closed' | 'canceled' | 'expired';
    /** Reduce only */
    reduceOnly: boolean;
    /** Post only */
    postOnly: boolean;
    /** Timestamp */
    timestamp: number;
}
//# sourceMappingURL=types.d.ts.map
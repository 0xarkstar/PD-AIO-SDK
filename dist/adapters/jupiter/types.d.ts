/**
 * Jupiter Perps Exchange-Specific Types
 *
 * Type definitions for Jupiter Perpetuals on-chain data and API responses.
 * Jupiter Perps uses Solana program accounts for all trading data.
 *
 * @see https://dev.jup.ag/docs/perps
 */
import { z } from 'zod';
/**
 * Position side enum
 */
export type JupiterPositionSide = 'Long' | 'Short';
/**
 * Position account data from on-chain
 */
export interface JupiterPositionAccount {
    /** Owner's Solana wallet address */
    owner: string;
    /** Pool this position belongs to */
    pool: string;
    /** Custody account for the position */
    custody: string;
    /** Collateral custody for margin */
    collateralCustody: string;
    /** Position open time (Unix timestamp) */
    openTime: number;
    /** Last update time (Unix timestamp) */
    updateTime: number;
    /** Position side: Long or Short */
    side: JupiterPositionSide;
    /** Position price (entry price in USD) */
    price: string;
    /** Size in USD notional */
    sizeUsd: string;
    /** Size in tokens */
    sizeTokens: string;
    /** Collateral amount in USD */
    collateralUsd: string;
    /** Unrealized PnL in USD */
    unrealizedPnl: string;
    /** Realized PnL in USD */
    realizedPnl: string;
    /** Cumulative interest snapshot for borrow fee calculation */
    cumulativeInterestSnapshot: string;
    /** Locked amount */
    lockedAmount: string;
    /** Bump seed for PDA */
    bump: number;
}
export declare const JupiterPositionAccountSchema: z.ZodObject<{
    owner: z.ZodString;
    pool: z.ZodString;
    custody: z.ZodString;
    collateralCustody: z.ZodString;
    openTime: z.ZodNumber;
    updateTime: z.ZodNumber;
    side: z.ZodString;
    price: z.ZodString;
    sizeUsd: z.ZodString;
    sizeTokens: z.ZodString;
    collateralUsd: z.ZodString;
    unrealizedPnl: z.ZodString;
    realizedPnl: z.ZodString;
    cumulativeInterestSnapshot: z.ZodString;
    lockedAmount: z.ZodString;
    bump: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    owner: z.ZodString;
    pool: z.ZodString;
    custody: z.ZodString;
    collateralCustody: z.ZodString;
    openTime: z.ZodNumber;
    updateTime: z.ZodNumber;
    side: z.ZodString;
    price: z.ZodString;
    sizeUsd: z.ZodString;
    sizeTokens: z.ZodString;
    collateralUsd: z.ZodString;
    unrealizedPnl: z.ZodString;
    realizedPnl: z.ZodString;
    cumulativeInterestSnapshot: z.ZodString;
    lockedAmount: z.ZodString;
    bump: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    owner: z.ZodString;
    pool: z.ZodString;
    custody: z.ZodString;
    collateralCustody: z.ZodString;
    openTime: z.ZodNumber;
    updateTime: z.ZodNumber;
    side: z.ZodString;
    price: z.ZodString;
    sizeUsd: z.ZodString;
    sizeTokens: z.ZodString;
    collateralUsd: z.ZodString;
    unrealizedPnl: z.ZodString;
    realizedPnl: z.ZodString;
    cumulativeInterestSnapshot: z.ZodString;
    lockedAmount: z.ZodString;
    bump: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Position request account (pending orders)
 */
export interface JupiterPositionRequest {
    /** Owner's Solana wallet address */
    owner: string;
    /** Pool this request belongs to */
    pool: string;
    /** Position this request modifies (if existing) */
    position: string;
    /** Custody for the token being traded */
    custody: string;
    /** Request type: open, close, increase, decrease */
    requestType: JupiterRequestType;
    /** Side: Long or Short */
    side: JupiterPositionSide;
    /** Size change in USD */
    sizeUsdDelta: string;
    /** Collateral change in USD */
    collateralDelta: string;
    /** Price limit for execution */
    priceLimit: string;
    /** Request timestamp */
    timestamp: number;
    /** Counter for unique PDA derivation */
    counter: number;
    /** Take profit trigger price (optional) */
    takeProfitPrice?: string;
    /** Stop loss trigger price (optional) */
    stopLossPrice?: string;
    /** Bump seed for PDA */
    bump: number;
}
export type JupiterRequestType = 'OpenPosition' | 'ClosePosition' | 'IncreaseSize' | 'DecreaseSize' | 'AddCollateral' | 'RemoveCollateral';
/**
 * Pool account data
 */
export interface JupiterPoolAccount {
    /** Pool name */
    name: string;
    /** Pool admin address */
    admin: string;
    /** Mint address for LP token (JLP) */
    lpMint: string;
    /** Assets Under Management in USD */
    aumUsd: string;
    /** Total fees collected */
    totalFees: string;
    /** Custody account addresses */
    custodies: string[];
    /** Maximum AUM limit */
    maxAumUsd: string;
    /** Pool bump seed */
    bump: number;
    /** LP token bump seed */
    lpTokenBump: number;
    /** Fee schedule */
    fees: JupiterFeeSchedule;
}
export declare const JupiterPoolAccountSchema: z.ZodObject<{
    name: z.ZodString;
    admin: z.ZodString;
    lpMint: z.ZodString;
    aumUsd: z.ZodString;
    totalFees: z.ZodString;
    custodies: z.ZodArray<z.ZodString, "many">;
    maxAumUsd: z.ZodString;
    bump: z.ZodNumber;
    lpTokenBump: z.ZodNumber;
    fees: z.ZodObject<{
        swapFee: z.ZodNumber;
        addLiquidityFee: z.ZodNumber;
        removeLiquidityFee: z.ZodNumber;
        openPositionFee: z.ZodNumber;
        closePositionFee: z.ZodNumber;
        liquidationFee: z.ZodNumber;
        protocolShare: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        swapFee: z.ZodNumber;
        addLiquidityFee: z.ZodNumber;
        removeLiquidityFee: z.ZodNumber;
        openPositionFee: z.ZodNumber;
        closePositionFee: z.ZodNumber;
        liquidationFee: z.ZodNumber;
        protocolShare: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        swapFee: z.ZodNumber;
        addLiquidityFee: z.ZodNumber;
        removeLiquidityFee: z.ZodNumber;
        openPositionFee: z.ZodNumber;
        closePositionFee: z.ZodNumber;
        liquidationFee: z.ZodNumber;
        protocolShare: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    name: z.ZodString;
    admin: z.ZodString;
    lpMint: z.ZodString;
    aumUsd: z.ZodString;
    totalFees: z.ZodString;
    custodies: z.ZodArray<z.ZodString, "many">;
    maxAumUsd: z.ZodString;
    bump: z.ZodNumber;
    lpTokenBump: z.ZodNumber;
    fees: z.ZodObject<{
        swapFee: z.ZodNumber;
        addLiquidityFee: z.ZodNumber;
        removeLiquidityFee: z.ZodNumber;
        openPositionFee: z.ZodNumber;
        closePositionFee: z.ZodNumber;
        liquidationFee: z.ZodNumber;
        protocolShare: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        swapFee: z.ZodNumber;
        addLiquidityFee: z.ZodNumber;
        removeLiquidityFee: z.ZodNumber;
        openPositionFee: z.ZodNumber;
        closePositionFee: z.ZodNumber;
        liquidationFee: z.ZodNumber;
        protocolShare: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        swapFee: z.ZodNumber;
        addLiquidityFee: z.ZodNumber;
        removeLiquidityFee: z.ZodNumber;
        openPositionFee: z.ZodNumber;
        closePositionFee: z.ZodNumber;
        liquidationFee: z.ZodNumber;
        protocolShare: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    name: z.ZodString;
    admin: z.ZodString;
    lpMint: z.ZodString;
    aumUsd: z.ZodString;
    totalFees: z.ZodString;
    custodies: z.ZodArray<z.ZodString, "many">;
    maxAumUsd: z.ZodString;
    bump: z.ZodNumber;
    lpTokenBump: z.ZodNumber;
    fees: z.ZodObject<{
        swapFee: z.ZodNumber;
        addLiquidityFee: z.ZodNumber;
        removeLiquidityFee: z.ZodNumber;
        openPositionFee: z.ZodNumber;
        closePositionFee: z.ZodNumber;
        liquidationFee: z.ZodNumber;
        protocolShare: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        swapFee: z.ZodNumber;
        addLiquidityFee: z.ZodNumber;
        removeLiquidityFee: z.ZodNumber;
        openPositionFee: z.ZodNumber;
        closePositionFee: z.ZodNumber;
        liquidationFee: z.ZodNumber;
        protocolShare: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        swapFee: z.ZodNumber;
        addLiquidityFee: z.ZodNumber;
        removeLiquidityFee: z.ZodNumber;
        openPositionFee: z.ZodNumber;
        closePositionFee: z.ZodNumber;
        liquidationFee: z.ZodNumber;
        protocolShare: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Fee schedule for the pool
 */
export interface JupiterFeeSchedule {
    /** Swap fee (basis points) */
    swapFee: number;
    /** Add liquidity fee (basis points) */
    addLiquidityFee: number;
    /** Remove liquidity fee (basis points) */
    removeLiquidityFee: number;
    /** Open position fee (basis points) */
    openPositionFee: number;
    /** Close position fee (basis points) */
    closePositionFee: number;
    /** Liquidation fee (basis points) */
    liquidationFee: number;
    /** Protocol fee share (percentage) */
    protocolShare: number;
}
/**
 * Custody account data (per token in pool)
 */
export interface JupiterCustodyAccount {
    /** Pool this custody belongs to */
    pool: string;
    /** Token mint address */
    mint: string;
    /** Token account holding the tokens */
    tokenAccount: string;
    /** Decimals for the token */
    decimals: number;
    /** Is this a stable custody */
    isStable: boolean;
    /** Oracle configuration */
    oracle: JupiterOracleConfig;
    /** Pricing configuration */
    pricing: JupiterPricingConfig;
    /** Trading configuration */
    trading: JupiterTradingConfig;
    /** Funding rate state */
    fundingRateState: JupiterFundingRateState;
    /** Total assets in custody */
    assets: JupiterCustodyAssets;
    /** Custody bump seed */
    bump: number;
}
export declare const JupiterCustodyAccountSchema: z.ZodObject<{
    pool: z.ZodString;
    mint: z.ZodString;
    tokenAccount: z.ZodString;
    decimals: z.ZodNumber;
    isStable: z.ZodBoolean;
    oracle: z.ZodObject<{
        oracleType: z.ZodString;
        oracleAccount: z.ZodString;
        maxPriceAge: z.ZodNumber;
        maxPriceDeviation: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        oracleType: z.ZodString;
        oracleAccount: z.ZodString;
        maxPriceAge: z.ZodNumber;
        maxPriceDeviation: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        oracleType: z.ZodString;
        oracleAccount: z.ZodString;
        maxPriceAge: z.ZodNumber;
        maxPriceDeviation: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>;
    pricing: z.ZodObject<{
        useEma: z.ZodBoolean;
        tradeSpread: z.ZodNumber;
        swapSpread: z.ZodNumber;
        minInitialLeverage: z.ZodNumber;
        maxInitialLeverage: z.ZodNumber;
        maxLeverage: z.ZodNumber;
        maxPositionLockedUsd: z.ZodNumber;
        maxUtilization: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        useEma: z.ZodBoolean;
        tradeSpread: z.ZodNumber;
        swapSpread: z.ZodNumber;
        minInitialLeverage: z.ZodNumber;
        maxInitialLeverage: z.ZodNumber;
        maxLeverage: z.ZodNumber;
        maxPositionLockedUsd: z.ZodNumber;
        maxUtilization: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        useEma: z.ZodBoolean;
        tradeSpread: z.ZodNumber;
        swapSpread: z.ZodNumber;
        minInitialLeverage: z.ZodNumber;
        maxInitialLeverage: z.ZodNumber;
        maxLeverage: z.ZodNumber;
        maxPositionLockedUsd: z.ZodNumber;
        maxUtilization: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>;
    trading: z.ZodObject<{
        tradingEnabled: z.ZodBoolean;
        allowOpenPosition: z.ZodBoolean;
        allowClosePosition: z.ZodBoolean;
        allowAddCollateral: z.ZodBoolean;
        allowRemoveCollateral: z.ZodBoolean;
        allowIncreaseSize: z.ZodBoolean;
        allowDecreaseSize: z.ZodBoolean;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        tradingEnabled: z.ZodBoolean;
        allowOpenPosition: z.ZodBoolean;
        allowClosePosition: z.ZodBoolean;
        allowAddCollateral: z.ZodBoolean;
        allowRemoveCollateral: z.ZodBoolean;
        allowIncreaseSize: z.ZodBoolean;
        allowDecreaseSize: z.ZodBoolean;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        tradingEnabled: z.ZodBoolean;
        allowOpenPosition: z.ZodBoolean;
        allowClosePosition: z.ZodBoolean;
        allowAddCollateral: z.ZodBoolean;
        allowRemoveCollateral: z.ZodBoolean;
        allowIncreaseSize: z.ZodBoolean;
        allowDecreaseSize: z.ZodBoolean;
    }, z.ZodTypeAny, "passthrough">>;
    fundingRateState: z.ZodObject<{
        cumulativeInterestRate: z.ZodString;
        lastUpdate: z.ZodNumber;
        hourlyBorrowRate: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        cumulativeInterestRate: z.ZodString;
        lastUpdate: z.ZodNumber;
        hourlyBorrowRate: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        cumulativeInterestRate: z.ZodString;
        lastUpdate: z.ZodNumber;
        hourlyBorrowRate: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    assets: z.ZodObject<{
        owned: z.ZodString;
        locked: z.ZodString;
        guaranteedUsd: z.ZodString;
        globalShortSizes: z.ZodString;
        globalShortAveragePrices: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        owned: z.ZodString;
        locked: z.ZodString;
        guaranteedUsd: z.ZodString;
        globalShortSizes: z.ZodString;
        globalShortAveragePrices: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        owned: z.ZodString;
        locked: z.ZodString;
        guaranteedUsd: z.ZodString;
        globalShortSizes: z.ZodString;
        globalShortAveragePrices: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    bump: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    pool: z.ZodString;
    mint: z.ZodString;
    tokenAccount: z.ZodString;
    decimals: z.ZodNumber;
    isStable: z.ZodBoolean;
    oracle: z.ZodObject<{
        oracleType: z.ZodString;
        oracleAccount: z.ZodString;
        maxPriceAge: z.ZodNumber;
        maxPriceDeviation: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        oracleType: z.ZodString;
        oracleAccount: z.ZodString;
        maxPriceAge: z.ZodNumber;
        maxPriceDeviation: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        oracleType: z.ZodString;
        oracleAccount: z.ZodString;
        maxPriceAge: z.ZodNumber;
        maxPriceDeviation: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>;
    pricing: z.ZodObject<{
        useEma: z.ZodBoolean;
        tradeSpread: z.ZodNumber;
        swapSpread: z.ZodNumber;
        minInitialLeverage: z.ZodNumber;
        maxInitialLeverage: z.ZodNumber;
        maxLeverage: z.ZodNumber;
        maxPositionLockedUsd: z.ZodNumber;
        maxUtilization: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        useEma: z.ZodBoolean;
        tradeSpread: z.ZodNumber;
        swapSpread: z.ZodNumber;
        minInitialLeverage: z.ZodNumber;
        maxInitialLeverage: z.ZodNumber;
        maxLeverage: z.ZodNumber;
        maxPositionLockedUsd: z.ZodNumber;
        maxUtilization: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        useEma: z.ZodBoolean;
        tradeSpread: z.ZodNumber;
        swapSpread: z.ZodNumber;
        minInitialLeverage: z.ZodNumber;
        maxInitialLeverage: z.ZodNumber;
        maxLeverage: z.ZodNumber;
        maxPositionLockedUsd: z.ZodNumber;
        maxUtilization: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>;
    trading: z.ZodObject<{
        tradingEnabled: z.ZodBoolean;
        allowOpenPosition: z.ZodBoolean;
        allowClosePosition: z.ZodBoolean;
        allowAddCollateral: z.ZodBoolean;
        allowRemoveCollateral: z.ZodBoolean;
        allowIncreaseSize: z.ZodBoolean;
        allowDecreaseSize: z.ZodBoolean;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        tradingEnabled: z.ZodBoolean;
        allowOpenPosition: z.ZodBoolean;
        allowClosePosition: z.ZodBoolean;
        allowAddCollateral: z.ZodBoolean;
        allowRemoveCollateral: z.ZodBoolean;
        allowIncreaseSize: z.ZodBoolean;
        allowDecreaseSize: z.ZodBoolean;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        tradingEnabled: z.ZodBoolean;
        allowOpenPosition: z.ZodBoolean;
        allowClosePosition: z.ZodBoolean;
        allowAddCollateral: z.ZodBoolean;
        allowRemoveCollateral: z.ZodBoolean;
        allowIncreaseSize: z.ZodBoolean;
        allowDecreaseSize: z.ZodBoolean;
    }, z.ZodTypeAny, "passthrough">>;
    fundingRateState: z.ZodObject<{
        cumulativeInterestRate: z.ZodString;
        lastUpdate: z.ZodNumber;
        hourlyBorrowRate: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        cumulativeInterestRate: z.ZodString;
        lastUpdate: z.ZodNumber;
        hourlyBorrowRate: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        cumulativeInterestRate: z.ZodString;
        lastUpdate: z.ZodNumber;
        hourlyBorrowRate: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    assets: z.ZodObject<{
        owned: z.ZodString;
        locked: z.ZodString;
        guaranteedUsd: z.ZodString;
        globalShortSizes: z.ZodString;
        globalShortAveragePrices: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        owned: z.ZodString;
        locked: z.ZodString;
        guaranteedUsd: z.ZodString;
        globalShortSizes: z.ZodString;
        globalShortAveragePrices: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        owned: z.ZodString;
        locked: z.ZodString;
        guaranteedUsd: z.ZodString;
        globalShortSizes: z.ZodString;
        globalShortAveragePrices: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    bump: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    pool: z.ZodString;
    mint: z.ZodString;
    tokenAccount: z.ZodString;
    decimals: z.ZodNumber;
    isStable: z.ZodBoolean;
    oracle: z.ZodObject<{
        oracleType: z.ZodString;
        oracleAccount: z.ZodString;
        maxPriceAge: z.ZodNumber;
        maxPriceDeviation: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        oracleType: z.ZodString;
        oracleAccount: z.ZodString;
        maxPriceAge: z.ZodNumber;
        maxPriceDeviation: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        oracleType: z.ZodString;
        oracleAccount: z.ZodString;
        maxPriceAge: z.ZodNumber;
        maxPriceDeviation: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>;
    pricing: z.ZodObject<{
        useEma: z.ZodBoolean;
        tradeSpread: z.ZodNumber;
        swapSpread: z.ZodNumber;
        minInitialLeverage: z.ZodNumber;
        maxInitialLeverage: z.ZodNumber;
        maxLeverage: z.ZodNumber;
        maxPositionLockedUsd: z.ZodNumber;
        maxUtilization: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        useEma: z.ZodBoolean;
        tradeSpread: z.ZodNumber;
        swapSpread: z.ZodNumber;
        minInitialLeverage: z.ZodNumber;
        maxInitialLeverage: z.ZodNumber;
        maxLeverage: z.ZodNumber;
        maxPositionLockedUsd: z.ZodNumber;
        maxUtilization: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        useEma: z.ZodBoolean;
        tradeSpread: z.ZodNumber;
        swapSpread: z.ZodNumber;
        minInitialLeverage: z.ZodNumber;
        maxInitialLeverage: z.ZodNumber;
        maxLeverage: z.ZodNumber;
        maxPositionLockedUsd: z.ZodNumber;
        maxUtilization: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>;
    trading: z.ZodObject<{
        tradingEnabled: z.ZodBoolean;
        allowOpenPosition: z.ZodBoolean;
        allowClosePosition: z.ZodBoolean;
        allowAddCollateral: z.ZodBoolean;
        allowRemoveCollateral: z.ZodBoolean;
        allowIncreaseSize: z.ZodBoolean;
        allowDecreaseSize: z.ZodBoolean;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        tradingEnabled: z.ZodBoolean;
        allowOpenPosition: z.ZodBoolean;
        allowClosePosition: z.ZodBoolean;
        allowAddCollateral: z.ZodBoolean;
        allowRemoveCollateral: z.ZodBoolean;
        allowIncreaseSize: z.ZodBoolean;
        allowDecreaseSize: z.ZodBoolean;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        tradingEnabled: z.ZodBoolean;
        allowOpenPosition: z.ZodBoolean;
        allowClosePosition: z.ZodBoolean;
        allowAddCollateral: z.ZodBoolean;
        allowRemoveCollateral: z.ZodBoolean;
        allowIncreaseSize: z.ZodBoolean;
        allowDecreaseSize: z.ZodBoolean;
    }, z.ZodTypeAny, "passthrough">>;
    fundingRateState: z.ZodObject<{
        cumulativeInterestRate: z.ZodString;
        lastUpdate: z.ZodNumber;
        hourlyBorrowRate: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        cumulativeInterestRate: z.ZodString;
        lastUpdate: z.ZodNumber;
        hourlyBorrowRate: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        cumulativeInterestRate: z.ZodString;
        lastUpdate: z.ZodNumber;
        hourlyBorrowRate: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    assets: z.ZodObject<{
        owned: z.ZodString;
        locked: z.ZodString;
        guaranteedUsd: z.ZodString;
        globalShortSizes: z.ZodString;
        globalShortAveragePrices: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        owned: z.ZodString;
        locked: z.ZodString;
        guaranteedUsd: z.ZodString;
        globalShortSizes: z.ZodString;
        globalShortAveragePrices: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        owned: z.ZodString;
        locked: z.ZodString;
        guaranteedUsd: z.ZodString;
        globalShortSizes: z.ZodString;
        globalShortAveragePrices: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    bump: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Oracle configuration
 */
export interface JupiterOracleConfig {
    /** Oracle type: Pyth, Switchboard, etc */
    oracleType: string;
    /** Oracle account address */
    oracleAccount: string;
    /** Maximum age for oracle price (seconds) */
    maxPriceAge: number;
    /** Maximum deviation allowed (basis points) */
    maxPriceDeviation: number;
}
/**
 * Pricing configuration
 */
export interface JupiterPricingConfig {
    /** Use EMA pricing */
    useEma: boolean;
    /** Trade spread (basis points) */
    tradeSpread: number;
    /** Swap spread (basis points) */
    swapSpread: number;
    /** Min initial leverage */
    minInitialLeverage: number;
    /** Max initial leverage */
    maxInitialLeverage: number;
    /** Max leverage for position */
    maxLeverage: number;
    /** Max position locked amount */
    maxPositionLockedUsd: number;
    /** Max utilization */
    maxUtilization: number;
}
/**
 * Trading configuration
 */
export interface JupiterTradingConfig {
    /** Is trading enabled */
    tradingEnabled: boolean;
    /** Allow open position */
    allowOpenPosition: boolean;
    /** Allow close position */
    allowClosePosition: boolean;
    /** Allow add collateral */
    allowAddCollateral: boolean;
    /** Allow remove collateral */
    allowRemoveCollateral: boolean;
    /** Allow increase size */
    allowIncreaseSize: boolean;
    /** Allow decrease size */
    allowDecreaseSize: boolean;
}
/**
 * Funding rate state (borrow fee tracking)
 */
export interface JupiterFundingRateState {
    /** Cumulative interest rate (for borrow fee calculation) */
    cumulativeInterestRate: string;
    /** Last update timestamp */
    lastUpdate: number;
    /** Hourly borrow rate */
    hourlyBorrowRate: string;
}
/**
 * Custody assets
 */
export interface JupiterCustodyAssets {
    /** Owned amount */
    owned: string;
    /** Locked amount (in positions) */
    locked: string;
    /** Guaranteed USD (for liquidation protection) */
    guaranteedUsd: string;
    /** Global short sizes */
    globalShortSizes: string;
    /** Global short average prices */
    globalShortAveragePrices: string;
}
/**
 * Jupiter Price API v3 response
 */
export interface JupiterPriceResponse {
    data: Record<string, JupiterPriceData>;
    timeTaken: number;
}
/**
 * Price data for a single token
 */
export interface JupiterPriceData {
    id: string;
    type: 'derivedPrice';
    price: string;
    extraInfo?: {
        lastSwappedPrice?: {
            lastSwappedPrice: string;
            lastJupiterSellPrice: string;
            lastJupiterBuyPrice: string;
        };
        quotedPrice?: {
            buyPrice: string;
            sellPrice: string;
        };
        confidenceLevel?: string;
        depth?: {
            buyPriceImpact: Record<string, number>;
            sellPriceImpact: Record<string, number>;
        };
    };
}
export declare const JupiterPriceDataSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    price: z.ZodString;
    extraInfo: z.ZodOptional<z.ZodAny>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    type: z.ZodString;
    price: z.ZodString;
    extraInfo: z.ZodOptional<z.ZodAny>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    type: z.ZodString;
    price: z.ZodString;
    extraInfo: z.ZodOptional<z.ZodAny>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Pool stats response
 */
export interface JupiterPoolStats {
    /** Total pool AUM in USD */
    aumUsd: number;
    /** Total trading volume (24h) */
    volume24h: number;
    /** Total trading volume (7d) */
    volume7d: number;
    /** Total fees collected (24h) */
    fees24h: number;
    /** Total open interest */
    openInterest: number;
    /** Total long positions */
    longOpenInterest: number;
    /** Total short positions */
    shortOpenInterest: number;
    /** JLP price */
    jlpPrice: number;
    /** JLP supply */
    jlpSupply: number;
}
export declare const JupiterPoolStatsSchema: z.ZodObject<{
    aumUsd: z.ZodNumber;
    volume24h: z.ZodNumber;
    volume7d: z.ZodNumber;
    fees24h: z.ZodNumber;
    openInterest: z.ZodNumber;
    longOpenInterest: z.ZodNumber;
    shortOpenInterest: z.ZodNumber;
    jlpPrice: z.ZodNumber;
    jlpSupply: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    aumUsd: z.ZodNumber;
    volume24h: z.ZodNumber;
    volume7d: z.ZodNumber;
    fees24h: z.ZodNumber;
    openInterest: z.ZodNumber;
    longOpenInterest: z.ZodNumber;
    shortOpenInterest: z.ZodNumber;
    jlpPrice: z.ZodNumber;
    jlpSupply: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    aumUsd: z.ZodNumber;
    volume24h: z.ZodNumber;
    volume7d: z.ZodNumber;
    fees24h: z.ZodNumber;
    openInterest: z.ZodNumber;
    longOpenInterest: z.ZodNumber;
    shortOpenInterest: z.ZodNumber;
    jlpPrice: z.ZodNumber;
    jlpSupply: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Market stats for a single market
 */
export interface JupiterMarketStats {
    /** Market symbol */
    symbol: string;
    /** Oracle price */
    oraclePrice: number;
    /** Mark price */
    markPrice: number;
    /** 24h high */
    high24h: number;
    /** 24h low */
    low24h: number;
    /** 24h volume */
    volume24h: number;
    /** Open interest (longs) */
    longOpenInterest: number;
    /** Open interest (shorts) */
    shortOpenInterest: number;
    /** Current borrow rate (hourly) */
    borrowRate: number;
    /** Max leverage */
    maxLeverage: number;
}
export declare const JupiterMarketStatsSchema: z.ZodObject<{
    symbol: z.ZodString;
    oraclePrice: z.ZodNumber;
    markPrice: z.ZodNumber;
    high24h: z.ZodNumber;
    low24h: z.ZodNumber;
    volume24h: z.ZodNumber;
    longOpenInterest: z.ZodNumber;
    shortOpenInterest: z.ZodNumber;
    borrowRate: z.ZodNumber;
    maxLeverage: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    oraclePrice: z.ZodNumber;
    markPrice: z.ZodNumber;
    high24h: z.ZodNumber;
    low24h: z.ZodNumber;
    volume24h: z.ZodNumber;
    longOpenInterest: z.ZodNumber;
    shortOpenInterest: z.ZodNumber;
    borrowRate: z.ZodNumber;
    maxLeverage: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    oraclePrice: z.ZodNumber;
    markPrice: z.ZodNumber;
    high24h: z.ZodNumber;
    low24h: z.ZodNumber;
    volume24h: z.ZodNumber;
    longOpenInterest: z.ZodNumber;
    shortOpenInterest: z.ZodNumber;
    borrowRate: z.ZodNumber;
    maxLeverage: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Open position parameters
 */
export interface JupiterOpenPositionParams {
    /** Owner wallet address */
    owner: string;
    /** Market symbol (e.g., "SOL-PERP") */
    market: string;
    /** Position side: long or short */
    side: 'long' | 'short';
    /** Size in USD */
    sizeUsd: number;
    /** Collateral in USD */
    collateralUsd: number;
    /** Price limit (max for long, min for short) */
    priceLimit?: number;
    /** Take profit price (optional) */
    takeProfit?: number;
    /** Stop loss price (optional) */
    stopLoss?: number;
}
/**
 * Close position parameters
 */
export interface JupiterClosePositionParams {
    /** Position account address */
    positionAddress: string;
    /** Size to close in USD (use full size for complete close) */
    sizeUsd?: number;
    /** Price limit */
    priceLimit?: number;
}
/**
 * Modify position parameters
 */
export interface JupiterModifyPositionParams {
    /** Position account address */
    positionAddress: string;
    /** Size change in USD (positive to increase, negative to decrease) */
    sizeDelta?: number;
    /** Collateral change in USD (positive to add, negative to remove) */
    collateralDelta?: number;
}
/**
 * Normalized position for SDK
 */
export interface JupiterNormalizedPosition {
    /** Position account address (PDA) */
    id: string;
    /** Owner wallet address */
    owner: string;
    /** Market symbol in unified format */
    symbol: string;
    /** Position side: long or short */
    side: 'long' | 'short';
    /** Position size in base currency */
    size: number;
    /** Size in USD notional */
    sizeUsd: number;
    /** Entry price */
    entryPrice: number;
    /** Current mark price */
    markPrice: number;
    /** Collateral in USD */
    collateralUsd: number;
    /** Leverage */
    leverage: number;
    /** Unrealized PnL in USD */
    unrealizedPnl: number;
    /** Realized PnL in USD */
    realizedPnl: number;
    /** Liquidation price */
    liquidationPrice: number;
    /** Position open timestamp */
    openTime: number;
    /** Last update timestamp */
    updateTime: number;
}
//# sourceMappingURL=types.d.ts.map
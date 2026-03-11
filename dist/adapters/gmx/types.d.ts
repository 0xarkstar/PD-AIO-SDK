/**
 * GMX v2 Exchange-Specific Types
 *
 * Type definitions for GMX v2 API responses and on-chain data.
 *
 * @see https://docs.gmx.io/docs/api/rest-v2/
 */
import { z } from 'zod';
/**
 * Market info from /markets/info endpoint
 */
export interface GmxMarketInfo {
    /** Market token address (API field: marketToken) */
    marketToken: string;
    /** Index token address (API field: indexToken) */
    indexToken: string;
    /** Long token address (API field: longToken) */
    longToken: string;
    /** Short token address (API field: shortToken) */
    shortToken: string;
    /** Market name */
    name?: string;
    /** Whether market is listed */
    isListed?: boolean;
    /** Index token info (may not be in API response) */
    indexTokenInfo?: GmxTokenInfo;
    /** Long token info (may not be in API response) */
    longTokenInfo?: GmxTokenInfo;
    /** Short token info (may not be in API response) */
    shortTokenInfo?: GmxTokenInfo;
    longPoolAmount: string;
    shortPoolAmount: string;
    maxLongPoolAmount: string;
    maxShortPoolAmount: string;
    maxLongPoolUsdForDeposit: string;
    maxShortPoolUsdForDeposit: string;
    longPoolAmountAdjustment: string;
    shortPoolAmountAdjustment: string;
    poolValueMin: string;
    poolValueMax: string;
    reserveFactorLong: string;
    reserveFactorShort: string;
    openInterestReserveFactorLong: string;
    openInterestReserveFactorShort: string;
    maxOpenInterestLong: string;
    maxOpenInterestShort: string;
    totalBorrowingFees: string;
    positionImpactPoolAmount: string;
    minPositionImpactPoolAmount: string;
    positionImpactPoolDistributionRate: string;
    swapImpactPoolAmountLong: string;
    swapImpactPoolAmountShort: string;
    borrowingFactorLong: string;
    borrowingFactorShort: string;
    borrowingExponentFactorLong: string;
    borrowingExponentFactorShort: string;
    fundingFactor: string;
    fundingExponentFactor: string;
    fundingIncreaseFactorPerSecond: string;
    fundingDecreaseFactorPerSecond: string;
    thresholdForStableFunding: string;
    thresholdForDecreaseFunding: string;
    minFundingFactorPerSecond: string;
    maxFundingFactorPerSecond: string;
    pnlLongMax: string;
    pnlLongMin: string;
    pnlShortMax: string;
    pnlShortMin: string;
    netPnlMax: string;
    netPnlMin: string;
    maxPnlFactorForTradersLong: string;
    maxPnlFactorForTradersShort: string;
    minCollateralFactor: string;
    minCollateralFactorForOpenInterestLong: string;
    minCollateralFactorForOpenInterestShort: string;
    claimableFundingAmountLong: string;
    claimableFundingAmountShort: string;
    positionFeeFactorForPositiveImpact: string;
    positionFeeFactorForNegativeImpact: string;
    positionImpactFactorPositive: string;
    positionImpactFactorNegative: string;
    maxPositionImpactFactorPositive: string;
    maxPositionImpactFactorNegativePrice: string;
    positionImpactExponentFactor: string;
    swapFeeFactorForPositiveImpact: string;
    swapFeeFactorForNegativeImpact: string;
    swapImpactFactorPositive: string;
    swapImpactFactorNegative: string;
    swapImpactExponentFactor: string;
    longInterestInTokens: string;
    shortInterestInTokens: string;
    longInterestUsd: string;
    shortInterestUsd: string;
    longInterestInTokensUsingLongToken: string;
    longInterestInTokensUsingShortToken: string;
    shortInterestInTokensUsingLongToken: string;
    shortInterestInTokensUsingShortToken: string;
    isDisabled: boolean;
    virtualPoolAmountForLongToken: string;
    virtualPoolAmountForShortToken: string;
    virtualInventoryForPositions: string;
    virtualMarketId: string;
    virtualLongTokenId: string;
    virtualShortTokenId: string;
}
export declare const GmxMarketInfoSchema: z.ZodObject<{
    marketToken: z.ZodString;
    indexToken: z.ZodString;
    longToken: z.ZodString;
    shortToken: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    isListed: z.ZodOptional<z.ZodBoolean>;
    indexTokenInfo: z.ZodOptional<z.ZodObject<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>>;
    longTokenInfo: z.ZodOptional<z.ZodObject<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>>;
    shortTokenInfo: z.ZodOptional<z.ZodObject<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>>;
    longPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxLongPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxShortPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxLongPoolUsdForDeposit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxShortPoolUsdForDeposit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    longPoolAmountAdjustment: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortPoolAmountAdjustment: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    poolValueMin: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    poolValueMax: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    reserveFactorLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    reserveFactorShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    openInterestReserveFactorLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    openInterestReserveFactorShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxOpenInterestLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxOpenInterestShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    totalBorrowingFees: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionImpactPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    minPositionImpactPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionImpactPoolDistributionRate: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapImpactPoolAmountLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapImpactPoolAmountShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    borrowingFactorLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    borrowingFactorShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    borrowingExponentFactorLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    borrowingExponentFactorShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    fundingFactor: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    fundingExponentFactor: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    fundingIncreaseFactorPerSecond: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    fundingDecreaseFactorPerSecond: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    thresholdForStableFunding: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    thresholdForDecreaseFunding: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    minFundingFactorPerSecond: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxFundingFactorPerSecond: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    pnlLongMax: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    pnlLongMin: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    pnlShortMax: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    pnlShortMin: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    netPnlMax: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    netPnlMin: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxPnlFactorForTradersLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxPnlFactorForTradersShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    minCollateralFactor: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    minCollateralFactorForOpenInterestLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    minCollateralFactorForOpenInterestShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    claimableFundingAmountLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    claimableFundingAmountShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionFeeFactorForPositiveImpact: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionFeeFactorForNegativeImpact: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionImpactFactorPositive: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionImpactFactorNegative: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxPositionImpactFactorPositive: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxPositionImpactFactorNegativePrice: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionImpactExponentFactor: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapFeeFactorForPositiveImpact: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapFeeFactorForNegativeImpact: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapImpactFactorPositive: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapImpactFactorNegative: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapImpactExponentFactor: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    longInterestInTokens: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortInterestInTokens: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    longInterestUsd: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortInterestUsd: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    longInterestInTokensUsingLongToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    longInterestInTokensUsingShortToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortInterestInTokensUsingLongToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortInterestInTokensUsingShortToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    isDisabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    virtualPoolAmountForLongToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    virtualPoolAmountForShortToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    virtualInventoryForPositions: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    virtualMarketId: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    virtualLongTokenId: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    virtualShortTokenId: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    marketToken: z.ZodString;
    indexToken: z.ZodString;
    longToken: z.ZodString;
    shortToken: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    isListed: z.ZodOptional<z.ZodBoolean>;
    indexTokenInfo: z.ZodOptional<z.ZodObject<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>>;
    longTokenInfo: z.ZodOptional<z.ZodObject<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>>;
    shortTokenInfo: z.ZodOptional<z.ZodObject<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>>;
    longPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxLongPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxShortPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxLongPoolUsdForDeposit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxShortPoolUsdForDeposit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    longPoolAmountAdjustment: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortPoolAmountAdjustment: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    poolValueMin: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    poolValueMax: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    reserveFactorLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    reserveFactorShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    openInterestReserveFactorLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    openInterestReserveFactorShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxOpenInterestLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxOpenInterestShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    totalBorrowingFees: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionImpactPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    minPositionImpactPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionImpactPoolDistributionRate: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapImpactPoolAmountLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapImpactPoolAmountShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    borrowingFactorLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    borrowingFactorShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    borrowingExponentFactorLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    borrowingExponentFactorShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    fundingFactor: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    fundingExponentFactor: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    fundingIncreaseFactorPerSecond: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    fundingDecreaseFactorPerSecond: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    thresholdForStableFunding: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    thresholdForDecreaseFunding: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    minFundingFactorPerSecond: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxFundingFactorPerSecond: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    pnlLongMax: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    pnlLongMin: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    pnlShortMax: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    pnlShortMin: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    netPnlMax: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    netPnlMin: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxPnlFactorForTradersLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxPnlFactorForTradersShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    minCollateralFactor: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    minCollateralFactorForOpenInterestLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    minCollateralFactorForOpenInterestShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    claimableFundingAmountLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    claimableFundingAmountShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionFeeFactorForPositiveImpact: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionFeeFactorForNegativeImpact: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionImpactFactorPositive: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionImpactFactorNegative: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxPositionImpactFactorPositive: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxPositionImpactFactorNegativePrice: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionImpactExponentFactor: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapFeeFactorForPositiveImpact: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapFeeFactorForNegativeImpact: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapImpactFactorPositive: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapImpactFactorNegative: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapImpactExponentFactor: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    longInterestInTokens: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortInterestInTokens: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    longInterestUsd: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortInterestUsd: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    longInterestInTokensUsingLongToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    longInterestInTokensUsingShortToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortInterestInTokensUsingLongToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortInterestInTokensUsingShortToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    isDisabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    virtualPoolAmountForLongToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    virtualPoolAmountForShortToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    virtualInventoryForPositions: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    virtualMarketId: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    virtualLongTokenId: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    virtualShortTokenId: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    marketToken: z.ZodString;
    indexToken: z.ZodString;
    longToken: z.ZodString;
    shortToken: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    isListed: z.ZodOptional<z.ZodBoolean>;
    indexTokenInfo: z.ZodOptional<z.ZodObject<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>>;
    longTokenInfo: z.ZodOptional<z.ZodObject<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>>;
    shortTokenInfo: z.ZodOptional<z.ZodObject<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        address: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
        prices: z.ZodObject<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            minPrice: z.ZodString;
            maxPrice: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    }, z.ZodTypeAny, "passthrough">>>;
    longPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxLongPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxShortPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxLongPoolUsdForDeposit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxShortPoolUsdForDeposit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    longPoolAmountAdjustment: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortPoolAmountAdjustment: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    poolValueMin: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    poolValueMax: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    reserveFactorLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    reserveFactorShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    openInterestReserveFactorLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    openInterestReserveFactorShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxOpenInterestLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxOpenInterestShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    totalBorrowingFees: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionImpactPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    minPositionImpactPoolAmount: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionImpactPoolDistributionRate: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapImpactPoolAmountLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapImpactPoolAmountShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    borrowingFactorLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    borrowingFactorShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    borrowingExponentFactorLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    borrowingExponentFactorShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    fundingFactor: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    fundingExponentFactor: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    fundingIncreaseFactorPerSecond: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    fundingDecreaseFactorPerSecond: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    thresholdForStableFunding: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    thresholdForDecreaseFunding: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    minFundingFactorPerSecond: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxFundingFactorPerSecond: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    pnlLongMax: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    pnlLongMin: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    pnlShortMax: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    pnlShortMin: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    netPnlMax: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    netPnlMin: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxPnlFactorForTradersLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxPnlFactorForTradersShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    minCollateralFactor: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    minCollateralFactorForOpenInterestLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    minCollateralFactorForOpenInterestShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    claimableFundingAmountLong: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    claimableFundingAmountShort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionFeeFactorForPositiveImpact: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionFeeFactorForNegativeImpact: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionImpactFactorPositive: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionImpactFactorNegative: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxPositionImpactFactorPositive: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    maxPositionImpactFactorNegativePrice: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    positionImpactExponentFactor: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapFeeFactorForPositiveImpact: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapFeeFactorForNegativeImpact: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapImpactFactorPositive: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapImpactFactorNegative: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    swapImpactExponentFactor: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    longInterestInTokens: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortInterestInTokens: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    longInterestUsd: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortInterestUsd: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    longInterestInTokensUsingLongToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    longInterestInTokensUsingShortToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortInterestInTokensUsingLongToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shortInterestInTokensUsingShortToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    isDisabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    virtualPoolAmountForLongToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    virtualPoolAmountForShortToken: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    virtualInventoryForPositions: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    virtualMarketId: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    virtualLongTokenId: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    virtualShortTokenId: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Token info
 */
export interface GmxTokenInfo {
    address: string;
    symbol: string;
    decimals: number;
    prices: {
        minPrice: string;
        maxPrice: string;
    };
}
/**
 * Candlestick data tuple from /prices/candles endpoint
 * Format: [timestamp_seconds, open, high, low, close]
 */
export type GmxCandleTuple = number[];
export declare const GmxCandleTupleSchema: z.ZodArray<z.ZodNumber, "many">;
/**
 * Response wrapper from /prices/candles endpoint
 */
export interface GmxCandlesResponse {
    period: string;
    candles: GmxCandleTuple[];
}
export declare const GmxCandlesResponseSchema: z.ZodObject<{
    period: z.ZodString;
    candles: z.ZodArray<z.ZodArray<z.ZodNumber, "many">, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    period: z.ZodString;
    candles: z.ZodArray<z.ZodArray<z.ZodNumber, "many">, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    period: z.ZodString;
    candles: z.ZodArray<z.ZodArray<z.ZodNumber, "many">, "many">;
}, z.ZodTypeAny, "passthrough">>;
/**
 * @deprecated Use GmxCandleTuple instead — API returns tuples, not objects
 */
export interface GmxCandlestick {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
}
/**
 * Position data from subgraph
 */
export interface GmxPosition {
    account: string;
    market: string;
    collateralToken: string;
    sizeInUsd: string;
    sizeInTokens: string;
    collateralAmount: string;
    borrowingFactor: string;
    fundingFeeAmountPerSize: string;
    longTokenClaimableFundingAmountPerSize: string;
    shortTokenClaimableFundingAmountPerSize: string;
    increasedAtBlock: string;
    decreasedAtBlock: string;
    isLong: boolean;
}
export declare const GmxPositionSchema: z.ZodObject<{
    account: z.ZodString;
    market: z.ZodString;
    collateralToken: z.ZodString;
    sizeInUsd: z.ZodString;
    sizeInTokens: z.ZodString;
    collateralAmount: z.ZodString;
    borrowingFactor: z.ZodString;
    fundingFeeAmountPerSize: z.ZodString;
    longTokenClaimableFundingAmountPerSize: z.ZodString;
    shortTokenClaimableFundingAmountPerSize: z.ZodString;
    increasedAtBlock: z.ZodString;
    decreasedAtBlock: z.ZodString;
    isLong: z.ZodBoolean;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    account: z.ZodString;
    market: z.ZodString;
    collateralToken: z.ZodString;
    sizeInUsd: z.ZodString;
    sizeInTokens: z.ZodString;
    collateralAmount: z.ZodString;
    borrowingFactor: z.ZodString;
    fundingFeeAmountPerSize: z.ZodString;
    longTokenClaimableFundingAmountPerSize: z.ZodString;
    shortTokenClaimableFundingAmountPerSize: z.ZodString;
    increasedAtBlock: z.ZodString;
    decreasedAtBlock: z.ZodString;
    isLong: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    account: z.ZodString;
    market: z.ZodString;
    collateralToken: z.ZodString;
    sizeInUsd: z.ZodString;
    sizeInTokens: z.ZodString;
    collateralAmount: z.ZodString;
    borrowingFactor: z.ZodString;
    fundingFeeAmountPerSize: z.ZodString;
    longTokenClaimableFundingAmountPerSize: z.ZodString;
    shortTokenClaimableFundingAmountPerSize: z.ZodString;
    increasedAtBlock: z.ZodString;
    decreasedAtBlock: z.ZodString;
    isLong: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Order data from subgraph
 */
export interface GmxOrder {
    key: string;
    account: string;
    receiver: string;
    callbackContract: string;
    uiFeeReceiver: string;
    market: string;
    initialCollateralToken: string;
    swapPath: string[];
    orderType: number;
    decreasePositionSwapType: number;
    sizeDeltaUsd: string;
    initialCollateralDeltaAmount: string;
    triggerPrice: string;
    acceptablePrice: string;
    executionFee: string;
    callbackGasLimit: string;
    minOutputAmount: string;
    updatedAtBlock: string;
    isLong: boolean;
    isFrozen: boolean;
    status: string;
    createdTxn: string;
    cancelledTxn?: string;
    executedTxn?: string;
}
export declare const GmxOrderSchema: z.ZodObject<{
    key: z.ZodString;
    account: z.ZodString;
    receiver: z.ZodString;
    callbackContract: z.ZodString;
    uiFeeReceiver: z.ZodString;
    market: z.ZodString;
    initialCollateralToken: z.ZodString;
    swapPath: z.ZodArray<z.ZodString, "many">;
    orderType: z.ZodNumber;
    decreasePositionSwapType: z.ZodNumber;
    sizeDeltaUsd: z.ZodString;
    initialCollateralDeltaAmount: z.ZodString;
    triggerPrice: z.ZodString;
    acceptablePrice: z.ZodString;
    executionFee: z.ZodString;
    callbackGasLimit: z.ZodString;
    minOutputAmount: z.ZodString;
    updatedAtBlock: z.ZodString;
    isLong: z.ZodBoolean;
    isFrozen: z.ZodBoolean;
    status: z.ZodString;
    createdTxn: z.ZodString;
    cancelledTxn: z.ZodOptional<z.ZodString>;
    executedTxn: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    key: z.ZodString;
    account: z.ZodString;
    receiver: z.ZodString;
    callbackContract: z.ZodString;
    uiFeeReceiver: z.ZodString;
    market: z.ZodString;
    initialCollateralToken: z.ZodString;
    swapPath: z.ZodArray<z.ZodString, "many">;
    orderType: z.ZodNumber;
    decreasePositionSwapType: z.ZodNumber;
    sizeDeltaUsd: z.ZodString;
    initialCollateralDeltaAmount: z.ZodString;
    triggerPrice: z.ZodString;
    acceptablePrice: z.ZodString;
    executionFee: z.ZodString;
    callbackGasLimit: z.ZodString;
    minOutputAmount: z.ZodString;
    updatedAtBlock: z.ZodString;
    isLong: z.ZodBoolean;
    isFrozen: z.ZodBoolean;
    status: z.ZodString;
    createdTxn: z.ZodString;
    cancelledTxn: z.ZodOptional<z.ZodString>;
    executedTxn: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    key: z.ZodString;
    account: z.ZodString;
    receiver: z.ZodString;
    callbackContract: z.ZodString;
    uiFeeReceiver: z.ZodString;
    market: z.ZodString;
    initialCollateralToken: z.ZodString;
    swapPath: z.ZodArray<z.ZodString, "many">;
    orderType: z.ZodNumber;
    decreasePositionSwapType: z.ZodNumber;
    sizeDeltaUsd: z.ZodString;
    initialCollateralDeltaAmount: z.ZodString;
    triggerPrice: z.ZodString;
    acceptablePrice: z.ZodString;
    executionFee: z.ZodString;
    callbackGasLimit: z.ZodString;
    minOutputAmount: z.ZodString;
    updatedAtBlock: z.ZodString;
    isLong: z.ZodBoolean;
    isFrozen: z.ZodBoolean;
    status: z.ZodString;
    createdTxn: z.ZodString;
    cancelledTxn: z.ZodOptional<z.ZodString>;
    executedTxn: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Trade/Fill data from subgraph
 */
export interface GmxTrade {
    id: string;
    account: string;
    market: string;
    collateralToken: string;
    sizeDeltaUsd: string;
    sizeDeltaInTokens: string;
    collateralDeltaAmount: string;
    borrowingFactor: string;
    fundingFeeAmountPerSize: string;
    pnlUsd: string;
    priceImpactUsd: string;
    orderType: number;
    isLong: boolean;
    executionPrice: string;
    timestamp: number;
    transactionHash: string;
}
export declare const GmxTradeSchema: z.ZodObject<{
    id: z.ZodString;
    account: z.ZodString;
    market: z.ZodString;
    collateralToken: z.ZodString;
    sizeDeltaUsd: z.ZodString;
    sizeDeltaInTokens: z.ZodString;
    collateralDeltaAmount: z.ZodString;
    borrowingFactor: z.ZodString;
    fundingFeeAmountPerSize: z.ZodString;
    pnlUsd: z.ZodString;
    priceImpactUsd: z.ZodString;
    orderType: z.ZodNumber;
    isLong: z.ZodBoolean;
    executionPrice: z.ZodString;
    timestamp: z.ZodNumber;
    transactionHash: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    account: z.ZodString;
    market: z.ZodString;
    collateralToken: z.ZodString;
    sizeDeltaUsd: z.ZodString;
    sizeDeltaInTokens: z.ZodString;
    collateralDeltaAmount: z.ZodString;
    borrowingFactor: z.ZodString;
    fundingFeeAmountPerSize: z.ZodString;
    pnlUsd: z.ZodString;
    priceImpactUsd: z.ZodString;
    orderType: z.ZodNumber;
    isLong: z.ZodBoolean;
    executionPrice: z.ZodString;
    timestamp: z.ZodNumber;
    transactionHash: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    account: z.ZodString;
    market: z.ZodString;
    collateralToken: z.ZodString;
    sizeDeltaUsd: z.ZodString;
    sizeDeltaInTokens: z.ZodString;
    collateralDeltaAmount: z.ZodString;
    borrowingFactor: z.ZodString;
    fundingFeeAmountPerSize: z.ZodString;
    pnlUsd: z.ZodString;
    priceImpactUsd: z.ZodString;
    orderType: z.ZodNumber;
    isLong: z.ZodBoolean;
    executionPrice: z.ZodString;
    timestamp: z.ZodNumber;
    transactionHash: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Funding rate data
 */
export interface GmxFundingRate {
    market: string;
    fundingFactorPerSecond: string;
    longsPayShorts: boolean;
    fundingFeeAmountPerSizeLong: string;
    fundingFeeAmountPerSizeShort: string;
    timestamp: number;
}
export declare const GmxFundingRateSchema: z.ZodObject<{
    market: z.ZodString;
    fundingFactorPerSecond: z.ZodString;
    longsPayShorts: z.ZodBoolean;
    fundingFeeAmountPerSizeLong: z.ZodString;
    fundingFeeAmountPerSizeShort: z.ZodString;
    timestamp: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    market: z.ZodString;
    fundingFactorPerSecond: z.ZodString;
    longsPayShorts: z.ZodBoolean;
    fundingFeeAmountPerSizeLong: z.ZodString;
    fundingFeeAmountPerSizeShort: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    market: z.ZodString;
    fundingFactorPerSecond: z.ZodString;
    longsPayShorts: z.ZodBoolean;
    fundingFeeAmountPerSizeLong: z.ZodString;
    fundingFeeAmountPerSizeShort: z.ZodString;
    timestamp: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Price data from oracle
 */
export interface GmxPriceData {
    token: string;
    minPrice: string;
    maxPrice: string;
    timestamp: number;
}
/**
 * Market stats from subgraph
 */
export interface GmxMarketStats {
    marketAddress: string;
    longOpenInterest: string;
    shortOpenInterest: string;
    longOpenInterestInTokens: string;
    shortOpenInterestInTokens: string;
    netOpenInterest: string;
    volumeUsd24h: string;
    fees24h: string;
    lastPrice: string;
}
/**
 * Account stats from subgraph
 */
export interface GmxAccountStats {
    account: string;
    totalTrades: number;
    totalVolume: string;
    totalPnl: string;
    totalFees: string;
}
/**
 * Create order request params
 */
export interface GmxCreateOrderParams {
    receiver: string;
    callbackContract: string;
    uiFeeReceiver: string;
    market: string;
    initialCollateralToken: string;
    swapPath: string[];
    sizeDeltaUsd: bigint;
    initialCollateralDeltaAmount: bigint;
    triggerPrice: bigint;
    acceptablePrice: bigint;
    executionFee: bigint;
    callbackGasLimit: bigint;
    minOutputAmount: bigint;
    orderType: number;
    decreasePositionSwapType: number;
    isLong: boolean;
    shouldUnwrapNativeToken: boolean;
    referralCode: string;
}
/**
 * Normalized position for SDK
 */
export interface GmxNormalizedPosition {
    symbol: string;
    marketAddress: string;
    side: 'long' | 'short';
    size: number;
    sizeUsd: number;
    collateral: number;
    collateralUsd: number;
    entryPrice: number;
    markPrice: number;
    liquidationPrice: number;
    unrealizedPnl: number;
    unrealizedPnlPercent: number;
    leverage: number;
    borrowingFee: number;
    fundingFee: number;
}
/**
 * Normalized order for SDK
 */
export interface GmxNormalizedOrder {
    id: string;
    symbol: string;
    marketAddress: string;
    type: 'market' | 'limit' | 'stopMarket' | 'stopLimit';
    side: 'buy' | 'sell';
    isLong: boolean;
    amount: number;
    price: number;
    triggerPrice?: number;
    status: 'open' | 'filled' | 'cancelled' | 'expired';
    timestamp: number;
}
/**
 * Normalized trade for SDK
 */
export interface GmxNormalizedTrade {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    isLong: boolean;
    amount: number;
    price: number;
    cost: number;
    pnl: number;
    fee: number;
    timestamp: number;
    transactionHash: string;
}
//# sourceMappingURL=types.d.ts.map
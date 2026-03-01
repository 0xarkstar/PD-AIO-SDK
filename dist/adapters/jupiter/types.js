/**
 * Jupiter Perps Exchange-Specific Types
 *
 * Type definitions for Jupiter Perpetuals on-chain data and API responses.
 * Jupiter Perps uses Solana program accounts for all trading data.
 *
 * @see https://dev.jup.ag/docs/perps
 */
import { z } from 'zod';
export const JupiterPositionAccountSchema = z
    .object({
    owner: z.string(),
    pool: z.string(),
    custody: z.string(),
    collateralCustody: z.string(),
    openTime: z.number(),
    updateTime: z.number(),
    side: z.string(),
    price: z.string(),
    sizeUsd: z.string(),
    sizeTokens: z.string(),
    collateralUsd: z.string(),
    unrealizedPnl: z.string(),
    realizedPnl: z.string(),
    cumulativeInterestSnapshot: z.string(),
    lockedAmount: z.string(),
    bump: z.number(),
})
    .passthrough();
const JupiterFeeScheduleSchema = z
    .object({
    swapFee: z.number(),
    addLiquidityFee: z.number(),
    removeLiquidityFee: z.number(),
    openPositionFee: z.number(),
    closePositionFee: z.number(),
    liquidationFee: z.number(),
    protocolShare: z.number(),
})
    .passthrough();
export const JupiterPoolAccountSchema = z
    .object({
    name: z.string(),
    admin: z.string(),
    lpMint: z.string(),
    aumUsd: z.string(),
    totalFees: z.string(),
    custodies: z.array(z.string()),
    maxAumUsd: z.string(),
    bump: z.number(),
    lpTokenBump: z.number(),
    fees: JupiterFeeScheduleSchema,
})
    .passthrough();
const JupiterOracleConfigSchema = z
    .object({
    oracleType: z.string(),
    oracleAccount: z.string(),
    maxPriceAge: z.number(),
    maxPriceDeviation: z.number(),
})
    .passthrough();
const JupiterPricingConfigSchema = z
    .object({
    useEma: z.boolean(),
    tradeSpread: z.number(),
    swapSpread: z.number(),
    minInitialLeverage: z.number(),
    maxInitialLeverage: z.number(),
    maxLeverage: z.number(),
    maxPositionLockedUsd: z.number(),
    maxUtilization: z.number(),
})
    .passthrough();
const JupiterTradingConfigSchema = z
    .object({
    tradingEnabled: z.boolean(),
    allowOpenPosition: z.boolean(),
    allowClosePosition: z.boolean(),
    allowAddCollateral: z.boolean(),
    allowRemoveCollateral: z.boolean(),
    allowIncreaseSize: z.boolean(),
    allowDecreaseSize: z.boolean(),
})
    .passthrough();
const JupiterFundingRateStateSchema = z
    .object({
    cumulativeInterestRate: z.string(),
    lastUpdate: z.number(),
    hourlyBorrowRate: z.string(),
})
    .passthrough();
const JupiterCustodyAssetsSchema = z
    .object({
    owned: z.string(),
    locked: z.string(),
    guaranteedUsd: z.string(),
    globalShortSizes: z.string(),
    globalShortAveragePrices: z.string(),
})
    .passthrough();
export const JupiterCustodyAccountSchema = z
    .object({
    pool: z.string(),
    mint: z.string(),
    tokenAccount: z.string(),
    decimals: z.number(),
    isStable: z.boolean(),
    oracle: JupiterOracleConfigSchema,
    pricing: JupiterPricingConfigSchema,
    trading: JupiterTradingConfigSchema,
    fundingRateState: JupiterFundingRateStateSchema,
    assets: JupiterCustodyAssetsSchema,
    bump: z.number(),
})
    .passthrough();
export const JupiterPriceDataSchema = z
    .object({
    id: z.string(),
    type: z.string(),
    price: z.string(),
    extraInfo: z.any().optional(),
})
    .passthrough();
export const JupiterPoolStatsSchema = z
    .object({
    aumUsd: z.number(),
    volume24h: z.number(),
    volume7d: z.number(),
    fees24h: z.number(),
    openInterest: z.number(),
    longOpenInterest: z.number(),
    shortOpenInterest: z.number(),
    jlpPrice: z.number(),
    jlpSupply: z.number(),
})
    .passthrough();
export const JupiterMarketStatsSchema = z
    .object({
    symbol: z.string(),
    oraclePrice: z.number(),
    markPrice: z.number(),
    high24h: z.number(),
    low24h: z.number(),
    volume24h: z.number(),
    longOpenInterest: z.number(),
    shortOpenInterest: z.number(),
    borrowRate: z.number(),
    maxLeverage: z.number(),
})
    .passthrough();
//# sourceMappingURL=types.js.map
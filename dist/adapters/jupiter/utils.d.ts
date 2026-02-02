/**
 * Jupiter Perps Utility Functions
 *
 * Helper functions for Jupiter Perps adapter operations.
 */
import { JUPITER_MARKETS } from './constants.js';
/**
 * Get token mint address for a market
 */
export declare function getTokenMint(marketKey: string): string | undefined;
/**
 * Get market configuration
 */
export declare function getMarketConfig(symbol: string): (typeof JUPITER_MARKETS)[keyof typeof JUPITER_MARKETS] | undefined;
/**
 * Validate market exists
 */
export declare function isValidMarket(symbol: string): boolean;
/**
 * Format price with market-specific precision
 */
export declare function formatPrice(price: number, symbol: string): string;
/**
 * Format size with market-specific precision
 */
export declare function formatSize(size: number, symbol: string): string;
/**
 * Round price to tick size
 */
export declare function roundToTickSize(price: number, symbol: string): number;
/**
 * Round size to step size
 */
export declare function roundToStepSize(size: number, symbol: string): number;
/**
 * Validate leverage for market
 */
export declare function validateLeverage(leverage: number, symbol: string): {
    valid: boolean;
    reason?: string;
};
/**
 * Calculate size from collateral and leverage
 */
export declare function calculateSizeFromCollateral(collateralUsd: number, leverage: number, price: number): number;
/**
 * Calculate collateral from size and leverage
 */
export declare function calculateCollateralFromSize(sizeUsd: number, leverage: number): number;
/**
 * Position PDA seeds structure
 * Actual derivation requires @solana/web3.js PublicKey.findProgramAddress
 */
export interface PositionPDASeeds {
    prefix: string;
    owner: string;
    pool: string;
    custody: string;
    side: 'Long' | 'Short';
}
/**
 * Get position PDA seeds
 */
export declare function getPositionPDASeeds(owner: string, pool: string, custody: string, side: 'long' | 'short'): PositionPDASeeds;
/**
 * Build Jupiter Price API URL
 */
export declare function buildPriceApiUrl(tokenIds: string[]): string;
/**
 * Build Solana RPC request body
 */
export declare function buildRpcRequestBody(method: string, params: unknown[]): Record<string, unknown>;
/**
 * Calculate accumulated borrow fee
 *
 * Jupiter charges borrow fees that compound hourly based on position utilization.
 *
 * @param positionSizeUsd - Position size in USD
 * @param hourlyRate - Hourly borrow rate (decimal)
 * @param hoursHeld - Number of hours position has been held
 * @returns Total borrow fee in USD
 */
export declare function calculateBorrowFee(positionSizeUsd: number, hourlyRate: number, hoursHeld: number): number;
/**
 * Calculate annualized borrow rate from hourly rate
 */
export declare function hourlyToAnnualizedRate(hourlyRate: number): number;
/**
 * Calculate hourly rate from annualized rate
 */
export declare function annualizedToHourlyRate(annualizedRate: number): number;
/**
 * Calculate liquidation price for a position
 *
 * @param side - Position side
 * @param entryPrice - Entry price
 * @param collateralUsd - Collateral in USD
 * @param sizeUsd - Position size in USD
 * @param maintenanceMarginRate - Maintenance margin rate (default 1%)
 * @returns Liquidation price
 */
export declare function calculateLiquidationPrice(side: 'long' | 'short', entryPrice: number, collateralUsd: number, sizeUsd: number, maintenanceMarginRate?: number): number;
/**
 * Check if position would be liquidated at given price
 */
export declare function isLiquidatable(side: 'long' | 'short', entryPrice: number, currentPrice: number, collateralUsd: number, sizeUsd: number, maintenanceMarginRate?: number): boolean;
/**
 * Parse on-chain BN (big number) string to number
 * Jupiter stores values as scaled integers
 */
export declare function parseOnChainValue(value: string | number, decimals: number): number;
/**
 * Format number for on-chain value
 */
export declare function formatOnChainValue(value: number, decimals: number): string;
/**
 * Parse timestamp from on-chain (Unix seconds to milliseconds)
 */
export declare function parseOnChainTimestamp(timestamp: number | string): number;
/**
 * Validate position size meets minimum requirements
 */
export declare function validatePositionSize(sizeUsd: number, symbol: string): {
    valid: boolean;
    reason?: string;
};
/**
 * Validate order parameters
 */
export declare function validateOrderParams(params: {
    symbol: string;
    side: 'long' | 'short';
    sizeUsd: number;
    leverage: number;
}): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=utils.d.ts.map
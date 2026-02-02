/**
 * Jupiter Perps Utility Functions
 *
 * Helper functions for Jupiter Perps adapter operations.
 */
import { JUPITER_MARKETS, JUPITER_TOKEN_MINTS, unifiedToJupiter, getBaseToken, } from './constants.js';
// =============================================================================
// Token Utilities
// =============================================================================
/**
 * Get token mint address for a market
 */
export function getTokenMint(marketKey) {
    const baseToken = getBaseToken(marketKey.includes('-PERP') ? marketKey.replace('-PERP', '/USD:USD') : marketKey);
    return JUPITER_TOKEN_MINTS[baseToken];
}
/**
 * Get market configuration
 */
export function getMarketConfig(symbol) {
    const jupiterSymbol = symbol.includes('-PERP') ? symbol : unifiedToJupiter(symbol);
    return JUPITER_MARKETS[jupiterSymbol];
}
/**
 * Validate market exists
 */
export function isValidMarket(symbol) {
    const jupiterSymbol = symbol.includes('-PERP') ? symbol : unifiedToJupiter(symbol);
    return jupiterSymbol in JUPITER_MARKETS;
}
// =============================================================================
// Price Utilities
// =============================================================================
/**
 * Format price with market-specific precision
 */
export function formatPrice(price, symbol) {
    const config = getMarketConfig(symbol);
    const tickSize = config?.tickSize || 0.001;
    const precision = Math.max(0, -Math.floor(Math.log10(tickSize)));
    return price.toFixed(precision);
}
/**
 * Format size with market-specific precision
 */
export function formatSize(size, symbol) {
    const config = getMarketConfig(symbol);
    const stepSize = config?.stepSize || 0.001;
    const precision = Math.max(0, -Math.floor(Math.log10(stepSize)));
    return size.toFixed(precision);
}
/**
 * Round price to tick size
 */
export function roundToTickSize(price, symbol) {
    const config = getMarketConfig(symbol);
    const tickSize = config?.tickSize || 0.001;
    return Math.round(price / tickSize) * tickSize;
}
/**
 * Round size to step size
 */
export function roundToStepSize(size, symbol) {
    const config = getMarketConfig(symbol);
    const stepSize = config?.stepSize || 0.001;
    return Math.round(size / stepSize) * stepSize;
}
// =============================================================================
// Leverage Utilities
// =============================================================================
/**
 * Validate leverage for market
 */
export function validateLeverage(leverage, symbol) {
    const config = getMarketConfig(symbol);
    const maxLeverage = config?.maxLeverage || 100;
    if (leverage < 1) {
        return { valid: false, reason: 'Leverage must be at least 1x' };
    }
    if (leverage > maxLeverage) {
        return { valid: false, reason: `Maximum leverage for ${symbol} is ${maxLeverage}x` };
    }
    return { valid: true };
}
/**
 * Calculate size from collateral and leverage
 */
export function calculateSizeFromCollateral(collateralUsd, leverage, price) {
    return (collateralUsd * leverage) / price;
}
/**
 * Calculate collateral from size and leverage
 */
export function calculateCollateralFromSize(sizeUsd, leverage) {
    return sizeUsd / leverage;
}
/**
 * Get position PDA seeds
 */
export function getPositionPDASeeds(owner, pool, custody, side) {
    return {
        prefix: 'position',
        owner,
        pool,
        custody,
        side: side === 'long' ? 'Long' : 'Short',
    };
}
// =============================================================================
// URL Builders
// =============================================================================
/**
 * Build Jupiter Price API URL
 */
export function buildPriceApiUrl(tokenIds) {
    const baseUrl = 'https://api.jup.ag/price/v3';
    const params = new URLSearchParams({
        ids: tokenIds.join(','),
    });
    return `${baseUrl}?${params.toString()}`;
}
/**
 * Build Solana RPC request body
 */
export function buildRpcRequestBody(method, params) {
    return {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
    };
}
// =============================================================================
// Borrow Fee Calculations
// =============================================================================
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
export function calculateBorrowFee(positionSizeUsd, hourlyRate, hoursHeld) {
    // Compound interest formula: P * ((1 + r)^n - 1)
    return positionSizeUsd * (Math.pow(1 + hourlyRate, hoursHeld) - 1);
}
/**
 * Calculate annualized borrow rate from hourly rate
 */
export function hourlyToAnnualizedRate(hourlyRate) {
    // Compound 8760 hours per year
    return Math.pow(1 + hourlyRate, 8760) - 1;
}
/**
 * Calculate hourly rate from annualized rate
 */
export function annualizedToHourlyRate(annualizedRate) {
    return Math.pow(1 + annualizedRate, 1 / 8760) - 1;
}
// =============================================================================
// Liquidation Calculations
// =============================================================================
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
export function calculateLiquidationPrice(side, entryPrice, collateralUsd, sizeUsd, maintenanceMarginRate = 0.01) {
    const leverage = sizeUsd / collateralUsd;
    const maintenanceMargin = sizeUsd * maintenanceMarginRate;
    const availableMargin = collateralUsd - maintenanceMargin;
    const priceMovement = (availableMargin / sizeUsd) * entryPrice;
    if (side === 'long') {
        return entryPrice - priceMovement;
    }
    else {
        return entryPrice + priceMovement;
    }
}
/**
 * Check if position would be liquidated at given price
 */
export function isLiquidatable(side, entryPrice, currentPrice, collateralUsd, sizeUsd, maintenanceMarginRate = 0.01) {
    const liquidationPrice = calculateLiquidationPrice(side, entryPrice, collateralUsd, sizeUsd, maintenanceMarginRate);
    if (side === 'long') {
        return currentPrice <= liquidationPrice;
    }
    else {
        return currentPrice >= liquidationPrice;
    }
}
// =============================================================================
// Data Parsing
// =============================================================================
/**
 * Parse on-chain BN (big number) string to number
 * Jupiter stores values as scaled integers
 */
export function parseOnChainValue(value, decimals) {
    const num = typeof value === 'string' ? BigInt(value) : BigInt(Math.floor(value));
    const divisor = BigInt(10 ** decimals);
    const intPart = num / divisor;
    const fracPart = num % divisor;
    return Number(intPart) + Number(fracPart) / Number(divisor);
}
/**
 * Format number for on-chain value
 */
export function formatOnChainValue(value, decimals) {
    const scaled = BigInt(Math.floor(value * 10 ** decimals));
    return scaled.toString();
}
/**
 * Parse timestamp from on-chain (Unix seconds to milliseconds)
 */
export function parseOnChainTimestamp(timestamp) {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    // If timestamp is in seconds (less than year 3000 in ms), convert to ms
    if (ts < 32503680000) {
        return ts * 1000;
    }
    return ts;
}
// =============================================================================
// Validation
// =============================================================================
/**
 * Validate position size meets minimum requirements
 */
export function validatePositionSize(sizeUsd, symbol) {
    const config = getMarketConfig(symbol);
    const minSize = config?.minPositionSize || 0.001;
    if (sizeUsd < 10) {
        return { valid: false, reason: 'Minimum position size is $10 USD' };
    }
    return { valid: true };
}
/**
 * Validate order parameters
 */
export function validateOrderParams(params) {
    const errors = [];
    // Validate market
    if (!isValidMarket(params.symbol)) {
        errors.push(`Invalid market: ${params.symbol}`);
    }
    // Validate size
    const sizeValidation = validatePositionSize(params.sizeUsd, params.symbol);
    if (!sizeValidation.valid && sizeValidation.reason) {
        errors.push(sizeValidation.reason);
    }
    // Validate leverage
    const leverageValidation = validateLeverage(params.leverage, params.symbol);
    if (!leverageValidation.valid && leverageValidation.reason) {
        errors.push(leverageValidation.reason);
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
//# sourceMappingURL=utils.js.map
/**
 * Jupiter Perps Utility Functions
 *
 * Helper functions for Jupiter Perps adapter operations.
 */

import {
  JUPITER_MARKETS,
  JUPITER_TOKEN_MINTS,
  unifiedToJupiter,
  getBaseToken,
} from './constants.js';

// =============================================================================
// Token Utilities
// =============================================================================

/**
 * Get token mint address for a market
 */
export function getTokenMint(marketKey: string): string | undefined {
  const baseToken = getBaseToken(
    marketKey.includes('-PERP') ? marketKey.replace('-PERP', '/USD:USD') : marketKey
  );
  return JUPITER_TOKEN_MINTS[baseToken as keyof typeof JUPITER_TOKEN_MINTS];
}

/**
 * Get market configuration
 */
export function getMarketConfig(symbol: string): (typeof JUPITER_MARKETS)[keyof typeof JUPITER_MARKETS] | undefined {
  const jupiterSymbol = symbol.includes('-PERP') ? symbol : unifiedToJupiter(symbol);
  return JUPITER_MARKETS[jupiterSymbol as keyof typeof JUPITER_MARKETS];
}

/**
 * Validate market exists
 */
export function isValidMarket(symbol: string): boolean {
  const jupiterSymbol = symbol.includes('-PERP') ? symbol : unifiedToJupiter(symbol);
  return jupiterSymbol in JUPITER_MARKETS;
}

// =============================================================================
// Price Utilities
// =============================================================================

/**
 * Format price with market-specific precision
 */
export function formatPrice(price: number, symbol: string): string {
  const config = getMarketConfig(symbol);
  const tickSize = config?.tickSize || 0.001;
  const precision = Math.max(0, -Math.floor(Math.log10(tickSize)));
  return price.toFixed(precision);
}

/**
 * Format size with market-specific precision
 */
export function formatSize(size: number, symbol: string): string {
  const config = getMarketConfig(symbol);
  const stepSize = config?.stepSize || 0.001;
  const precision = Math.max(0, -Math.floor(Math.log10(stepSize)));
  return size.toFixed(precision);
}

/**
 * Round price to tick size
 */
export function roundToTickSize(price: number, symbol: string): number {
  const config = getMarketConfig(symbol);
  const tickSize = config?.tickSize || 0.001;
  return Math.round(price / tickSize) * tickSize;
}

/**
 * Round size to step size
 */
export function roundToStepSize(size: number, symbol: string): number {
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
export function validateLeverage(leverage: number, symbol: string): { valid: boolean; reason?: string } {
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
export function calculateSizeFromCollateral(
  collateralUsd: number,
  leverage: number,
  price: number
): number {
  return (collateralUsd * leverage) / price;
}

/**
 * Calculate collateral from size and leverage
 */
export function calculateCollateralFromSize(
  sizeUsd: number,
  leverage: number
): number {
  return sizeUsd / leverage;
}

// =============================================================================
// PDA Utilities (Program Derived Addresses)
// =============================================================================

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
export function getPositionPDASeeds(
  owner: string,
  pool: string,
  custody: string,
  side: 'long' | 'short'
): PositionPDASeeds {
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
export function buildPriceApiUrl(tokenIds: string[]): string {
  const baseUrl = 'https://api.jup.ag/price/v3';
  const params = new URLSearchParams({
    ids: tokenIds.join(','),
  });
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Build Solana RPC request body
 */
export function buildRpcRequestBody(
  method: string,
  params: unknown[]
): Record<string, unknown> {
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
export function calculateBorrowFee(
  positionSizeUsd: number,
  hourlyRate: number,
  hoursHeld: number
): number {
  // Compound interest formula: P * ((1 + r)^n - 1)
  return positionSizeUsd * (Math.pow(1 + hourlyRate, hoursHeld) - 1);
}

/**
 * Calculate annualized borrow rate from hourly rate
 */
export function hourlyToAnnualizedRate(hourlyRate: number): number {
  // Compound 8760 hours per year
  return Math.pow(1 + hourlyRate, 8760) - 1;
}

/**
 * Calculate hourly rate from annualized rate
 */
export function annualizedToHourlyRate(annualizedRate: number): number {
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
export function calculateLiquidationPrice(
  side: 'long' | 'short',
  entryPrice: number,
  collateralUsd: number,
  sizeUsd: number,
  maintenanceMarginRate = 0.01
): number {
  const maintenanceMargin = sizeUsd * maintenanceMarginRate;
  const availableMargin = collateralUsd - maintenanceMargin;
  const priceMovement = (availableMargin / sizeUsd) * entryPrice;

  if (side === 'long') {
    return entryPrice - priceMovement;
  } else {
    return entryPrice + priceMovement;
  }
}

/**
 * Check if position would be liquidated at given price
 */
export function isLiquidatable(
  side: 'long' | 'short',
  entryPrice: number,
  currentPrice: number,
  collateralUsd: number,
  sizeUsd: number,
  maintenanceMarginRate = 0.01
): boolean {
  const liquidationPrice = calculateLiquidationPrice(
    side,
    entryPrice,
    collateralUsd,
    sizeUsd,
    maintenanceMarginRate
  );

  if (side === 'long') {
    return currentPrice <= liquidationPrice;
  } else {
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
export function parseOnChainValue(
  value: string | number,
  decimals: number
): number {
  const num = typeof value === 'string' ? BigInt(value) : BigInt(Math.floor(value));
  const divisor = BigInt(10 ** decimals);
  const intPart = num / divisor;
  const fracPart = num % divisor;
  return Number(intPart) + Number(fracPart) / Number(divisor);
}

/**
 * Format number for on-chain value
 */
export function formatOnChainValue(value: number, decimals: number): string {
  const scaled = BigInt(Math.floor(value * 10 ** decimals));
  return scaled.toString();
}

/**
 * Parse timestamp from on-chain (Unix seconds to milliseconds)
 */
export function parseOnChainTimestamp(timestamp: number | string): number {
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
export function validatePositionSize(
  sizeUsd: number,
  _symbol: string
): { valid: boolean; reason?: string } {
  if (sizeUsd < 10) {
    return { valid: false, reason: 'Minimum position size is $10 USD' };
  }

  return { valid: true };
}

/**
 * Validate order parameters
 */
export function validateOrderParams(params: {
  symbol: string;
  side: 'long' | 'short';
  sizeUsd: number;
  leverage: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

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

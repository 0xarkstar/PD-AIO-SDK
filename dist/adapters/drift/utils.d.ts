/**
 * Drift Protocol Utility Functions
 *
 * Helper functions for Drift Protocol adapter operations.
 */
import { DRIFT_PERP_MARKETS } from './constants.js';
import type { DriftOrderType, DriftDirection, DriftPostOnlyParams } from './types.js';
/**
 * Get market configuration by symbol
 */
export declare function getMarketConfig(symbol: string): (typeof DRIFT_PERP_MARKETS)[keyof typeof DRIFT_PERP_MARKETS] | undefined;
/**
 * Get market configuration by index
 */
export declare function getMarketConfigByIndex(marketIndex: number): (typeof DRIFT_PERP_MARKETS)[keyof typeof DRIFT_PERP_MARKETS] | undefined;
/**
 * Validate market exists
 */
export declare function isValidMarket(symbol: string): boolean;
/**
 * Get all market indices
 */
export declare function getAllMarketIndices(): number[];
/**
 * Convert price to on-chain format (PRICE_PRECISION)
 */
export declare function priceToOnChain(price: number): string;
/**
 * Convert on-chain price to number
 */
export declare function priceFromOnChain(price: string | number): number;
/**
 * Convert base amount to on-chain format (BASE_PRECISION)
 */
export declare function baseToOnChain(amount: number): string;
/**
 * Convert on-chain base amount to number
 */
export declare function baseFromOnChain(amount: string | number): number;
/**
 * Convert quote amount to on-chain format (QUOTE_PRECISION)
 */
export declare function quoteToOnChain(amount: number): string;
/**
 * Convert on-chain quote amount to number
 */
export declare function quoteFromOnChain(amount: string | number): number;
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
 * Calculate position size from collateral and leverage
 */
export declare function calculatePositionSize(collateral: number, leverage: number, price: number): number;
/**
 * Calculate required collateral from position size and leverage
 */
export declare function calculateRequiredCollateral(positionSize: number, price: number, leverage: number): number;
/**
 * Convert SDK order type to Drift order type
 */
export declare function toDriftOrderType(type: 'market' | 'limit' | 'stopMarket' | 'stopLimit'): DriftOrderType;
/**
 * Convert SDK side to Drift direction
 */
export declare function toDriftDirection(side: 'buy' | 'sell'): DriftDirection;
/**
 * Convert Drift direction to SDK side
 */
export declare function fromDriftDirection(direction: DriftDirection): 'buy' | 'sell';
/**
 * Get post-only params
 */
export declare function getPostOnlyParams(postOnly: boolean, slide?: boolean): DriftPostOnlyParams;
/**
 * Validate order parameters
 */
export declare function validateOrderParams(params: {
    symbol: string;
    side: 'buy' | 'sell';
    amount: number;
    price?: number;
    type: 'market' | 'limit' | 'stopMarket' | 'stopLimit';
    leverage?: number;
}): {
    valid: boolean;
    errors: string[];
};
/**
 * Convert funding rate from on-chain format
 */
export declare function fundingRateFromOnChain(rate: string | number): number;
/**
 * Annualize hourly funding rate
 */
export declare function annualizeFundingRate(hourlyRate: number): number;
/**
 * Calculate funding payment
 */
export declare function calculateFundingPayment(positionSize: number, fundingRate: number, markPrice: number): number;
/**
 * Calculate liquidation price
 */
export declare function calculateLiquidationPrice(side: 'long' | 'short', entryPrice: number, leverage: number, maintenanceMarginRatio?: number): number;
/**
 * Check if position would be liquidated at given price
 */
export declare function isLiquidatable(side: 'long' | 'short', entryPrice: number, currentPrice: number, leverage: number, maintenanceMarginRatio?: number): boolean;
/**
 * Build DLOB API URL for orderbook
 */
export declare function buildOrderbookUrl(baseUrl: string, marketIndex: number, marketType?: 'perp' | 'spot', depth?: number): string;
/**
 * Build DLOB API URL for trades
 */
export declare function buildTradesUrl(baseUrl: string, marketIndex: number, marketType?: 'perp' | 'spot', limit?: number): string;
/**
 * Build historical data URL
 */
export declare function buildHistoricalUrl(marketSymbol: string, dataType: 'trades' | 'funding' | 'candles', date: Date): string;
/**
 * Get next funding timestamp
 */
export declare function getNextFundingTimestamp(): number;
/**
 * Get time until next funding
 */
export declare function getTimeUntilFunding(): number;
/**
 * Convert Solana slot to approximate timestamp
 * (slots are ~400ms each)
 */
export declare function slotToTimestamp(slot: number, referenceSlot?: number, referenceTime?: number): number;
//# sourceMappingURL=utils.d.ts.map
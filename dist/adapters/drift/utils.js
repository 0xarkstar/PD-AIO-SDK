/**
 * Drift Protocol Utility Functions
 *
 * Helper functions for Drift Protocol adapter operations.
 */
import { DRIFT_PERP_MARKETS, DRIFT_PRECISION, DRIFT_MARKET_INDEX_MAP, unifiedToDrift, } from './constants.js';
// =============================================================================
// Market Utilities
// =============================================================================
/**
 * Get market configuration by symbol
 */
export function getMarketConfig(symbol) {
    const driftSymbol = symbol.includes('-PERP') ? symbol : unifiedToDrift(symbol);
    return DRIFT_PERP_MARKETS[driftSymbol];
}
/**
 * Get market configuration by index
 */
export function getMarketConfigByIndex(marketIndex) {
    const marketKey = DRIFT_MARKET_INDEX_MAP[marketIndex];
    if (!marketKey)
        return undefined;
    return DRIFT_PERP_MARKETS[marketKey];
}
/**
 * Validate market exists
 */
export function isValidMarket(symbol) {
    const driftSymbol = symbol.includes('-PERP') ? symbol : unifiedToDrift(symbol);
    return driftSymbol in DRIFT_PERP_MARKETS;
}
/**
 * Get all market indices
 */
export function getAllMarketIndices() {
    return Object.values(DRIFT_PERP_MARKETS).map((m) => m.marketIndex);
}
// =============================================================================
// Price Utilities
// =============================================================================
/**
 * Convert price to on-chain format (PRICE_PRECISION)
 */
export function priceToOnChain(price) {
    return Math.floor(price * DRIFT_PRECISION.PRICE).toString();
}
/**
 * Convert on-chain price to number
 */
export function priceFromOnChain(price) {
    const p = typeof price === 'string' ? parseFloat(price) : price;
    return p / DRIFT_PRECISION.PRICE;
}
/**
 * Convert base amount to on-chain format (BASE_PRECISION)
 */
export function baseToOnChain(amount) {
    return Math.floor(amount * DRIFT_PRECISION.BASE).toString();
}
/**
 * Convert on-chain base amount to number
 */
export function baseFromOnChain(amount) {
    const a = typeof amount === 'string' ? parseFloat(amount) : amount;
    return a / DRIFT_PRECISION.BASE;
}
/**
 * Convert quote amount to on-chain format (QUOTE_PRECISION)
 */
export function quoteToOnChain(amount) {
    return Math.floor(amount * DRIFT_PRECISION.QUOTE).toString();
}
/**
 * Convert on-chain quote amount to number
 */
export function quoteFromOnChain(amount) {
    const a = typeof amount === 'string' ? parseFloat(amount) : amount;
    return a / DRIFT_PRECISION.QUOTE;
}
/**
 * Format price with market-specific precision
 */
export function formatPrice(price, symbol) {
    const config = getMarketConfig(symbol);
    const tickSize = config?.tickSize || 0.01;
    const precision = Math.max(0, -Math.floor(Math.log10(tickSize)));
    return price.toFixed(precision);
}
/**
 * Format size with market-specific precision
 */
export function formatSize(size, symbol) {
    const config = getMarketConfig(symbol);
    const stepSize = config?.stepSize || 0.01;
    const precision = Math.max(0, -Math.floor(Math.log10(stepSize)));
    return size.toFixed(precision);
}
/**
 * Round price to tick size
 */
export function roundToTickSize(price, symbol) {
    const config = getMarketConfig(symbol);
    const tickSize = config?.tickSize || 0.01;
    return Math.round(price / tickSize) * tickSize;
}
/**
 * Round size to step size
 */
export function roundToStepSize(size, symbol) {
    const config = getMarketConfig(symbol);
    const stepSize = config?.stepSize || 0.01;
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
    const maxLeverage = config?.maxLeverage || 20;
    if (leverage < 1) {
        return { valid: false, reason: 'Leverage must be at least 1x' };
    }
    if (leverage > maxLeverage) {
        return { valid: false, reason: `Maximum leverage for ${symbol} is ${maxLeverage}x` };
    }
    return { valid: true };
}
/**
 * Calculate position size from collateral and leverage
 */
export function calculatePositionSize(collateral, leverage, price) {
    return (collateral * leverage) / price;
}
/**
 * Calculate required collateral from position size and leverage
 */
export function calculateRequiredCollateral(positionSize, price, leverage) {
    return (positionSize * price) / leverage;
}
// =============================================================================
// Order Utilities
// =============================================================================
/**
 * Convert SDK order type to Drift order type
 */
export function toDriftOrderType(type) {
    switch (type) {
        case 'market':
            return 'market';
        case 'limit':
            return 'limit';
        case 'stopMarket':
            return 'triggerMarket';
        case 'stopLimit':
            return 'triggerLimit';
        default:
            return 'limit';
    }
}
/**
 * Convert SDK side to Drift direction
 */
export function toDriftDirection(side) {
    return side === 'buy' ? 'long' : 'short';
}
/**
 * Convert Drift direction to SDK side
 */
export function fromDriftDirection(direction) {
    return direction === 'long' ? 'buy' : 'sell';
}
/**
 * Get post-only params
 */
export function getPostOnlyParams(postOnly, slide) {
    if (!postOnly)
        return 'none';
    if (slide)
        return 'slide';
    return 'mustPostOnly';
}
/**
 * Validate order parameters
 */
export function validateOrderParams(params) {
    const errors = [];
    const config = getMarketConfig(params.symbol);
    // Validate market
    if (!config) {
        errors.push(`Invalid market: ${params.symbol}`);
        return { valid: false, errors };
    }
    // Validate size
    if (params.amount < config.minOrderSize) {
        errors.push(`Minimum order size is ${config.minOrderSize}`);
    }
    // Validate price for limit orders
    if ((params.type === 'limit' || params.type === 'stopLimit') && !params.price) {
        errors.push('Price is required for limit orders');
    }
    // Validate leverage
    if (params.leverage !== undefined) {
        const leverageValidation = validateLeverage(params.leverage, params.symbol);
        if (!leverageValidation.valid && leverageValidation.reason) {
            errors.push(leverageValidation.reason);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
// =============================================================================
// Funding Rate Utilities
// =============================================================================
/**
 * Convert funding rate from on-chain format
 */
export function fundingRateFromOnChain(rate) {
    const r = typeof rate === 'string' ? parseFloat(rate) : rate;
    return r / DRIFT_PRECISION.FUNDING_RATE;
}
/**
 * Annualize hourly funding rate
 */
export function annualizeFundingRate(hourlyRate) {
    return hourlyRate * 24 * 365;
}
/**
 * Calculate funding payment
 */
export function calculateFundingPayment(positionSize, fundingRate, markPrice) {
    return positionSize * markPrice * fundingRate;
}
// =============================================================================
// Liquidation Utilities
// =============================================================================
/**
 * Calculate liquidation price
 */
export function calculateLiquidationPrice(side, entryPrice, leverage, maintenanceMarginRatio = 0.05) {
    if (leverage <= 0)
        return 0;
    const liquidationThreshold = 1 - maintenanceMarginRatio;
    if (side === 'long') {
        return entryPrice * (1 - liquidationThreshold / leverage);
    }
    else {
        return entryPrice * (1 + liquidationThreshold / leverage);
    }
}
/**
 * Check if position would be liquidated at given price
 */
export function isLiquidatable(side, entryPrice, currentPrice, leverage, maintenanceMarginRatio = 0.05) {
    const liquidationPrice = calculateLiquidationPrice(side, entryPrice, leverage, maintenanceMarginRatio);
    if (side === 'long') {
        return currentPrice <= liquidationPrice;
    }
    else {
        return currentPrice >= liquidationPrice;
    }
}
// =============================================================================
// URL Builders
// =============================================================================
/**
 * Build DLOB API URL for orderbook
 */
export function buildOrderbookUrl(baseUrl, marketIndex, marketType = 'perp', depth) {
    const params = new URLSearchParams({
        marketIndex: marketIndex.toString(),
        marketType,
    });
    if (depth) {
        params.set('depth', depth.toString());
    }
    return `${baseUrl}/l2?${params.toString()}`;
}
/**
 * Build DLOB API URL for trades
 */
export function buildTradesUrl(baseUrl, marketIndex, marketType = 'perp', limit) {
    const params = new URLSearchParams({
        marketIndex: marketIndex.toString(),
        marketType,
    });
    if (limit) {
        params.set('limit', limit.toString());
    }
    return `${baseUrl}/trades?${params.toString()}`;
}
/**
 * Build historical data URL
 */
export function buildHistoricalUrl(marketSymbol, dataType, date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `https://drift-historical-data-v2.s3.eu-west-1.amazonaws.com/program/dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH/market/${marketSymbol}/${dataType}/${year}/${year}${month}${day}`;
}
// =============================================================================
// Time Utilities
// =============================================================================
/**
 * Get next funding timestamp
 */
export function getNextFundingTimestamp() {
    const now = Date.now();
    const hourMs = 3600000;
    return Math.ceil(now / hourMs) * hourMs;
}
/**
 * Get time until next funding
 */
export function getTimeUntilFunding() {
    return getNextFundingTimestamp() - Date.now();
}
/**
 * Convert Solana slot to approximate timestamp
 * (slots are ~400ms each)
 */
export function slotToTimestamp(slot, referenceSlot, referenceTime) {
    const slotDuration = 400; // ms
    if (referenceSlot && referenceTime) {
        return referenceTime + (slot - referenceSlot) * slotDuration;
    }
    // Approximate based on mainnet genesis
    const genesisTime = 1584282000000; // March 15, 2020
    return genesisTime + slot * slotDuration;
}
//# sourceMappingURL=utils.js.map
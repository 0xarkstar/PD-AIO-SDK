/**
 * PnL Calculation Functions
 *
 * Utilities for calculating profit/loss, liquidation prices, etc.
 */
/**
 * Calculate unrealized PnL for a position
 *
 * @param side - Position side ('long' or 'short')
 * @param entryPrice - Average entry price
 * @param currentPrice - Current market price
 * @param size - Position size in base currency
 * @returns Unrealized PnL in quote currency
 *
 * @example
 * ```typescript
 * // Long position: bought 1 BTC at $50,000, now $51,000
 * const pnl = calculateUnrealizedPnl('long', 50000, 51000, 1);
 * console.log(pnl); // 1000
 *
 * // Short position: sold 1 BTC at $50,000, now $49,000
 * const pnl = calculateUnrealizedPnl('short', 50000, 49000, 1);
 * console.log(pnl); // 1000
 * ```
 */
export function calculateUnrealizedPnl(side, entryPrice, currentPrice, size) {
    if (side === 'long') {
        return (currentPrice - entryPrice) * size;
    }
    else {
        return (entryPrice - currentPrice) * size;
    }
}
/**
 * Calculate liquidation price for a position
 *
 * @param side - Position side
 * @param entryPrice - Average entry price
 * @param leverage - Position leverage
 * @param maintenanceMarginRate - Maintenance margin rate (e.g., 0.005 for 0.5%)
 * @returns Liquidation price
 *
 * @example
 * ```typescript
 * // Long position at $50,000 with 10x leverage, 0.5% maintenance margin
 * const liqPrice = calculateLiquidationPrice('long', 50000, 10, 0.005);
 * console.log(liqPrice); // ~45,250
 * ```
 */
export function calculateLiquidationPrice(side, entryPrice, leverage, maintenanceMarginRate = 0.005) {
    const initialMarginRate = 1 / leverage;
    if (side === 'long') {
        // Long liquidation: price * (1 - initialMarginRate + maintenanceMarginRate)
        return entryPrice * (1 - initialMarginRate + maintenanceMarginRate);
    }
    else {
        // Short liquidation: price * (1 + initialMarginRate - maintenanceMarginRate)
        return entryPrice * (1 + initialMarginRate - maintenanceMarginRate);
    }
}
/**
 * Calculate position margin required
 *
 * @param positionValue - Position value (price * size)
 * @param leverage - Leverage multiplier
 * @returns Required margin
 */
export function calculateRequiredMargin(positionValue, leverage) {
    return positionValue / leverage;
}
/**
 * Calculate position value
 *
 * @param price - Current price
 * @param size - Position size
 * @returns Position notional value
 */
export function calculatePositionValue(price, size) {
    return price * size;
}
/**
 * Calculate ROE (Return on Equity)
 *
 * @param pnl - Profit/loss
 * @param margin - Initial margin
 * @returns ROE as decimal (e.g., 0.1 = 10%)
 */
export function calculateROE(pnl, margin) {
    if (margin === 0)
        return 0;
    return pnl / margin;
}
/**
 * Calculate margin ratio (used vs available)
 *
 * @param usedMargin - Currently used margin
 * @param totalMargin - Total available margin
 * @returns Margin ratio (0-1)
 */
export function calculateMarginRatio(usedMargin, totalMargin) {
    if (totalMargin === 0)
        return 1;
    return Math.min(1, usedMargin / totalMargin);
}
/**
 * Calculate effective leverage for a position
 *
 * @param positionValue - Notional position value
 * @param margin - Position margin
 * @returns Effective leverage
 */
export function calculateEffectiveLeverage(positionValue, margin) {
    if (margin === 0)
        return 0;
    return positionValue / margin;
}
/**
 * Calculate funding payment
 *
 * @param positionValue - Position notional value
 * @param fundingRate - Funding rate (e.g., 0.0001 for 0.01%)
 * @param isLong - Whether position is long
 * @returns Funding payment (positive = receive, negative = pay)
 */
export function calculateFundingPayment(positionValue, fundingRate, isLong) {
    const payment = positionValue * fundingRate;
    return isLong ? -payment : payment;
}
/**
 * Calculate break-even price including fees
 *
 * @param entryPrice - Entry price
 * @param side - Position side
 * @param takerFeeRate - Taker fee rate
 * @param makerFeeRate - Maker fee rate (for close)
 * @returns Break-even price
 */
export function calculateBreakEvenPrice(entryPrice, side, takerFeeRate, makerFeeRate = 0) {
    const totalFeeRate = takerFeeRate + makerFeeRate;
    if (side === 'long') {
        return entryPrice * (1 + totalFeeRate);
    }
    else {
        return entryPrice * (1 - totalFeeRate);
    }
}
/**
 * Calculate maximum position size given margin and leverage
 *
 * @param availableMargin - Available margin
 * @param leverage - Desired leverage
 * @param price - Current price
 * @returns Maximum position size in base currency
 */
export function calculateMaxPositionSize(availableMargin, leverage, price) {
    const maxPositionValue = availableMargin * leverage;
    return maxPositionValue / price;
}
/**
 * Calculate average entry price after adding to position
 *
 * @param currentSize - Current position size
 * @param currentEntryPrice - Current average entry price
 * @param addedSize - Size to add
 * @param addedPrice - Price of added position
 * @returns New average entry price
 */
export function calculateAverageEntryPrice(currentSize, currentEntryPrice, addedSize, addedPrice) {
    const totalValue = currentSize * currentEntryPrice + addedSize * addedPrice;
    const totalSize = currentSize + addedSize;
    if (totalSize === 0)
        return 0;
    return totalValue / totalSize;
}
/**
 * Calculate mark-to-market value
 *
 * @param size - Position size
 * @param entryPrice - Entry price
 * @param markPrice - Current mark price
 * @param side - Position side
 * @returns Mark-to-market value
 */
export function calculateMarkToMarket(size, entryPrice, markPrice, side) {
    const pnl = calculateUnrealizedPnl(side, entryPrice, markPrice, size);
    const positionValue = calculatePositionValue(entryPrice, size);
    return positionValue + pnl;
}
//# sourceMappingURL=pnl.js.map
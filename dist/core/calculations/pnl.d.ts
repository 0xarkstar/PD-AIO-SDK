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
export declare function calculateUnrealizedPnl(side: 'long' | 'short', entryPrice: number, currentPrice: number, size: number): number;
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
export declare function calculateLiquidationPrice(side: 'long' | 'short', entryPrice: number, leverage: number, maintenanceMarginRate?: number): number;
/**
 * Calculate position margin required
 *
 * @param positionValue - Position value (price * size)
 * @param leverage - Leverage multiplier
 * @returns Required margin
 */
export declare function calculateRequiredMargin(positionValue: number, leverage: number): number;
/**
 * Calculate position value
 *
 * @param price - Current price
 * @param size - Position size
 * @returns Position notional value
 */
export declare function calculatePositionValue(price: number, size: number): number;
/**
 * Calculate ROE (Return on Equity)
 *
 * @param pnl - Profit/loss
 * @param margin - Initial margin
 * @returns ROE as decimal (e.g., 0.1 = 10%)
 */
export declare function calculateROE(pnl: number, margin: number): number;
/**
 * Calculate margin ratio (used vs available)
 *
 * @param usedMargin - Currently used margin
 * @param totalMargin - Total available margin
 * @returns Margin ratio (0-1)
 */
export declare function calculateMarginRatio(usedMargin: number, totalMargin: number): number;
/**
 * Calculate effective leverage for a position
 *
 * @param positionValue - Notional position value
 * @param margin - Position margin
 * @returns Effective leverage
 */
export declare function calculateEffectiveLeverage(positionValue: number, margin: number): number;
/**
 * Calculate funding payment
 *
 * @param positionValue - Position notional value
 * @param fundingRate - Funding rate (e.g., 0.0001 for 0.01%)
 * @param isLong - Whether position is long
 * @returns Funding payment (positive = receive, negative = pay)
 */
export declare function calculateFundingPayment(positionValue: number, fundingRate: number, isLong: boolean): number;
/**
 * Calculate break-even price including fees
 *
 * @param entryPrice - Entry price
 * @param side - Position side
 * @param takerFeeRate - Taker fee rate
 * @param makerFeeRate - Maker fee rate (for close)
 * @returns Break-even price
 */
export declare function calculateBreakEvenPrice(entryPrice: number, side: 'long' | 'short', takerFeeRate: number, makerFeeRate?: number): number;
/**
 * Calculate maximum position size given margin and leverage
 *
 * @param availableMargin - Available margin
 * @param leverage - Desired leverage
 * @param price - Current price
 * @returns Maximum position size in base currency
 */
export declare function calculateMaxPositionSize(availableMargin: number, leverage: number, price: number): number;
/**
 * Calculate average entry price after adding to position
 *
 * @param currentSize - Current position size
 * @param currentEntryPrice - Current average entry price
 * @param addedSize - Size to add
 * @param addedPrice - Price of added position
 * @returns New average entry price
 */
export declare function calculateAverageEntryPrice(currentSize: number, currentEntryPrice: number, addedSize: number, addedPrice: number): number;
/**
 * Calculate mark-to-market value
 *
 * @param size - Position size
 * @param entryPrice - Entry price
 * @param markPrice - Current mark price
 * @param side - Position side
 * @returns Mark-to-market value
 */
export declare function calculateMarkToMarket(size: number, entryPrice: number, markPrice: number, side: 'long' | 'short'): number;
//# sourceMappingURL=pnl.d.ts.map
/**
 * Drift Protocol Order Builder
 *
 * Builds order parameters for Drift Protocol trading.
 * Converts unified order requests to Drift SDK format.
 */

import type { OrderRequest } from '../../types/index.js';
import {
  DRIFT_PERP_MARKETS,
  DRIFT_PRECISION,
  getMarketIndex,
  unifiedToDrift,
} from './constants.js';
import type { DriftOrderParams } from './DriftClientWrapper.js';

/**
 * Order builder configuration
 */
export interface DriftOrderBuilderConfig {
  /** Default sub-account ID */
  subAccountId?: number;
  /** Slippage tolerance for market orders (default: 0.01 = 1%) */
  slippageTolerance?: number;
  /** Auction duration for limit orders (default: 60 slots) */
  auctionDuration?: number;
  /** Builder code index (Drift DBC) */
  builderIdx?: number;
  /** Builder fee in basis points */
  builderFee?: number;
}

/**
 * Builds order parameters for Drift Protocol
 */
export class DriftOrderBuilder {
  private readonly config: {
    subAccountId: number;
    slippageTolerance: number;
    auctionDuration: number;
    builderIdx?: number;
    builderFee?: number;
  };

  constructor(config: DriftOrderBuilderConfig = {}) {
    this.config = {
      subAccountId: config.subAccountId ?? 0,
      slippageTolerance: config.slippageTolerance ?? 0.01,
      auctionDuration: config.auctionDuration ?? 60,
      builderIdx: config.builderIdx,
      builderFee: config.builderFee,
    };
  }

  /**
   * Build order parameters from a unified OrderRequest
   */
  buildOrderParams(request: OrderRequest, oraclePrice?: number): DriftOrderParams {
    // Get market configuration
    const marketKey = unifiedToDrift(request.symbol);
    const marketConfig = DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS];

    if (!marketConfig) {
      throw new Error(`Unknown market: ${request.symbol}`);
    }

    // Validate order
    this.validateOrder(request, marketConfig);

    // Calculate base asset amount (convert to Drift precision)
    const baseAssetAmount = BigInt(Math.floor(request.amount * DRIFT_PRECISION.BASE));

    // Determine order type
    const orderType = this.mapOrderType(request.type);

    // Determine direction
    const direction = this.getDirection(request.side, request.reduceOnly);

    // Calculate price (convert to Drift precision)
    let price: bigint | undefined;
    if (request.price) {
      price = BigInt(Math.floor(request.price * DRIFT_PRECISION.PRICE));
    } else if (request.type === 'market' && oraclePrice) {
      // For market orders, set a price with slippage tolerance
      const slippageMultiplier =
        direction === 'long'
          ? 1 + this.config.slippageTolerance
          : 1 - this.config.slippageTolerance;
      price = BigInt(Math.floor(oraclePrice * slippageMultiplier * DRIFT_PRECISION.PRICE));
    }

    // Calculate trigger price for stop orders
    let triggerPrice: bigint | undefined;
    let triggerCondition: 'above' | 'below' | undefined;
    if (request.stopPrice) {
      triggerPrice = BigInt(Math.floor(request.stopPrice * DRIFT_PRECISION.PRICE));
      // For longs, trigger above stop price; for shorts, trigger below
      triggerCondition = direction === 'long' ? 'below' : 'above';
    }

    // Build the order params
    const orderParams: DriftOrderParams = {
      orderType,
      marketIndex: marketConfig.marketIndex,
      marketType: 'perp',
      direction,
      baseAssetAmount,
      price,
      triggerPrice,
      triggerCondition,
      reduceOnly: request.reduceOnly ?? false,
      postOnly: request.postOnly ?? false,
      immediateOrCancel: request.timeInForce === 'IOC',
      userOrderId: request.clientOrderId ? parseInt(request.clientOrderId) : undefined,
    };

    // Add auction params for limit orders
    if (orderType === 'limit') {
      orderParams.auctionDuration = this.config.auctionDuration;
      if (oraclePrice && price) {
        // Set auction start and end prices for price improvement
        const auctionStartMultiplier = direction === 'long' ? 0.995 : 1.005;
        orderParams.auctionStartPrice = BigInt(
          Math.floor(oraclePrice * auctionStartMultiplier * DRIFT_PRECISION.PRICE)
        );
        orderParams.auctionEndPrice = price;
      }
    }

    // Add builder code fields if configured
    if (this.config.builderIdx !== undefined) {
      orderParams.builderIdx = this.config.builderIdx;
    }
    if (this.config.builderFee !== undefined) {
      orderParams.builderFee = this.config.builderFee;
    }

    return orderParams;
  }

  /**
   * Build parameters for closing a position
   */
  buildClosePositionParams(
    symbol: string,
    size: number,
    isLong: boolean,
    oraclePrice?: number
  ): DriftOrderParams {
    const marketKey = unifiedToDrift(symbol);
    const marketConfig = DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS];

    if (!marketConfig) {
      throw new Error(`Unknown market: ${symbol}`);
    }

    const baseAssetAmount = BigInt(Math.floor(Math.abs(size) * DRIFT_PRECISION.BASE));

    // To close, we need to trade in the opposite direction
    const direction = isLong ? 'short' : 'long';

    // Calculate acceptable price with slippage
    let price: bigint | undefined;
    if (oraclePrice) {
      const slippageMultiplier =
        direction === 'long'
          ? 1 + this.config.slippageTolerance
          : 1 - this.config.slippageTolerance;
      price = BigInt(Math.floor(oraclePrice * slippageMultiplier * DRIFT_PRECISION.PRICE));
    }

    return {
      orderType: 'market',
      marketIndex: marketConfig.marketIndex,
      marketType: 'perp',
      direction,
      baseAssetAmount,
      price,
      reduceOnly: true, // Always reduce-only for closing
    };
  }

  /**
   * Validate order parameters
   */
  private validateOrder(
    request: OrderRequest,
    marketConfig: (typeof DRIFT_PERP_MARKETS)[keyof typeof DRIFT_PERP_MARKETS]
  ): void {
    // Check minimum order size
    if (request.amount < marketConfig.minOrderSize) {
      throw new Error(
        `Order size ${request.amount} is below minimum ${marketConfig.minOrderSize} for ${request.symbol}`
      );
    }

    // Check leverage if specified
    if (request.leverage && request.leverage > marketConfig.maxLeverage) {
      throw new Error(
        `Leverage ${request.leverage}x exceeds maximum ${marketConfig.maxLeverage}x for ${request.symbol}`
      );
    }

    // Validate price for limit orders
    if (request.type === 'limit' && !request.price) {
      throw new Error('Price is required for limit orders');
    }

    // Validate stop price for trigger orders
    if ((request.type === 'stopMarket' || request.type === 'stopLimit') && !request.stopPrice) {
      throw new Error('Stop price is required for trigger orders');
    }

    // Validate amount step size
    const stepSize = marketConfig.stepSize;
    const remainder = request.amount % stepSize;
    if (remainder !== 0 && remainder / stepSize > 0.001) {
      throw new Error(`Order amount ${request.amount} does not conform to step size ${stepSize}`);
    }

    // Validate price tick size for limit orders
    if (request.price) {
      const tickSize = marketConfig.tickSize;
      const priceRemainder = request.price % tickSize;
      if (priceRemainder !== 0 && priceRemainder / tickSize > 0.001) {
        throw new Error(`Order price ${request.price} does not conform to tick size ${tickSize}`);
      }
    }
  }

  /**
   * Map unified order type to Drift order type
   */
  private mapOrderType(
    type: string
  ): 'market' | 'limit' | 'triggerMarket' | 'triggerLimit' | 'oracle' {
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
        return 'market';
    }
  }

  /**
   * Get direction based on side and reduce-only flag
   */
  private getDirection(side: 'buy' | 'sell', _reduceOnly?: boolean): 'long' | 'short' {
    // For regular orders: buy = long, sell = short
    // For reduce-only: logic is the same, but the order will reduce the position
    return side === 'buy' ? 'long' : 'short';
  }

  /**
   * Calculate required margin for an order
   */
  calculateRequiredMargin(
    symbol: string,
    amount: number,
    price: number,
    leverage?: number
  ): { margin: number; leverage: number } {
    const marketKey = unifiedToDrift(symbol);
    const marketConfig = DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS];

    if (!marketConfig) {
      throw new Error(`Unknown market: ${symbol}`);
    }

    // Calculate notional value
    const notional = amount * price;

    // Use provided leverage or calculate from initial margin ratio
    const effectiveLeverage = leverage || 1 / marketConfig.initialMarginRatio;
    const actualLeverage = Math.min(effectiveLeverage, marketConfig.maxLeverage);

    // Calculate margin
    const margin = notional / actualLeverage;

    return {
      margin,
      leverage: actualLeverage,
    };
  }

  /**
   * Calculate liquidation price for a position
   */
  calculateLiquidationPrice(
    symbol: string,
    entryPrice: number,
    leverage: number,
    isLong: boolean
  ): number {
    const marketKey = unifiedToDrift(symbol);
    const marketConfig = DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS];

    if (!marketConfig) {
      throw new Error(`Unknown market: ${symbol}`);
    }

    const maintenanceMargin = marketConfig.maintenanceMarginRatio;
    const liquidationThreshold = 1 - maintenanceMargin;

    if (isLong) {
      return entryPrice * (1 - liquidationThreshold / leverage);
    } else {
      return entryPrice * (1 + liquidationThreshold / leverage);
    }
  }

  /**
   * Get market configuration
   */
  getMarketConfig(
    symbol: string
  ): (typeof DRIFT_PERP_MARKETS)[keyof typeof DRIFT_PERP_MARKETS] | undefined {
    const marketKey = unifiedToDrift(symbol);
    return DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS];
  }

  /**
   * Get market index from symbol
   */
  getMarketIndex(symbol: string): number {
    return getMarketIndex(symbol);
  }

  /**
   * Round amount to step size
   */
  roundToStepSize(amount: number, symbol: string): number {
    const config = this.getMarketConfig(symbol);
    if (!config) {
      return amount;
    }

    const stepSize = config.stepSize;
    return Math.floor(amount / stepSize) * stepSize;
  }

  /**
   * Round price to tick size
   */
  roundToTickSize(price: number, symbol: string): number {
    const config = this.getMarketConfig(symbol);
    if (!config) {
      return price;
    }

    const tickSize = config.tickSize;
    return Math.round(price / tickSize) * tickSize;
  }
}

/**
 * Create a default order builder instance
 */
export function createOrderBuilder(config?: DriftOrderBuilderConfig): DriftOrderBuilder {
  return new DriftOrderBuilder(config);
}

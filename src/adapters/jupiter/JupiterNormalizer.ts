/**
 * Jupiter Perps Data Normalizer
 *
 * Transforms Jupiter on-chain account data and API responses
 * to unified SDK format.
 */

import type {
  Market,
  Position,
  FundingRate,
  Balance,
  Ticker,
  OrderBook,
} from '../../types/common.js';
import type {
  JupiterPositionAccount,
  JupiterPoolAccount,
  JupiterCustodyAccount,
  JupiterMarketStats,
  JupiterPoolStats,
  JupiterPriceData,
  JupiterNormalizedPosition,
} from './types.js';
import { jupiterToUnified, JUPITER_MARKETS } from './constants.js';

/**
 * Normalizer for Jupiter Perps data
 */
export class JupiterNormalizer {
  /**
   * Normalize market data from custody and pool accounts
   */
  normalizeMarket(
    marketKey: string,
    custody: JupiterCustodyAccount,
    pool: JupiterPoolAccount,
    _stats?: JupiterMarketStats
  ): Market {
    const marketConfig = JUPITER_MARKETS[marketKey as keyof typeof JUPITER_MARKETS];
    const symbol = jupiterToUnified(marketKey);
    const makerFee = pool.fees.openPositionFee / 10000;
    const takerFee = pool.fees.closePositionFee / 10000;

    return {
      id: marketKey,
      symbol,
      base: marketConfig?.baseToken || marketKey.replace('-PERP', ''),
      quote: 'USD',
      settle: 'USD',
      active: custody.trading.tradingEnabled,
      minAmount: marketConfig?.minPositionSize || 0.001,
      maxAmount: custody.pricing.maxPositionLockedUsd,
      minCost: 10, // $10 minimum
      pricePrecision: this.getPricePrecision(marketKey),
      amountPrecision: this.getAmountPrecision(marketKey),
      priceTickSize: marketConfig?.tickSize || 0.001,
      amountStepSize: marketConfig?.stepSize || 0.001,
      makerFee,
      takerFee,
      maxLeverage: custody.pricing.maxLeverage,
      fundingIntervalHours: 1, // Jupiter uses hourly borrow fees
      contractSize: 1,
      info: {
        custody: custody.mint,
        pool: pool.name,
        oracle: custody.oracle.oracleAccount,
        isStable: custody.isStable,
        maxUtilization: custody.pricing.maxUtilization,
        marginMode: 'isolated',
        positionMode: 'one-way',
      },
    };
  }

  /**
   * Normalize multiple markets
   */
  normalizeMarkets(
    custodies: Map<string, JupiterCustodyAccount>,
    pool: JupiterPoolAccount,
    stats?: Map<string, JupiterMarketStats>
  ): Market[] {
    const markets: Market[] = [];

    for (const [marketKey] of Object.entries(JUPITER_MARKETS)) {
      const custody = custodies.get(marketKey);
      if (custody) {
        markets.push(this.normalizeMarket(marketKey, custody, pool, stats?.get(marketKey)));
      }
    }

    return markets;
  }

  /**
   * Normalize on-chain position account to unified Position
   */
  normalizePosition(
    positionAddress: string,
    position: JupiterPositionAccount,
    currentPrice: number,
    marketKey: string
  ): Position {
    const symbol = jupiterToUnified(marketKey);
    const side = position.side === 'Long' ? 'long' : 'short';
    const sizeUsd = parseFloat(position.sizeUsd);
    const collateralUsd = parseFloat(position.collateralUsd);
    const entryPrice = parseFloat(position.price);
    const size = parseFloat(position.sizeTokens);
    const leverage = sizeUsd / collateralUsd;

    // Calculate unrealized PnL
    const unrealizedPnl = this.calculateUnrealizedPnl(side, size, entryPrice, currentPrice);

    // Calculate liquidation price
    const liquidationPrice = this.calculateLiquidationPrice(
      side,
      entryPrice,
      leverage,
      collateralUsd,
      sizeUsd
    );

    // Maintenance margin is approximately 1% of position size
    const maintenanceMargin = sizeUsd * 0.01;
    const marginRatio = ((collateralUsd - maintenanceMargin) / collateralUsd) * 100;

    return {
      symbol,
      side,
      size,
      entryPrice,
      markPrice: currentPrice,
      liquidationPrice,
      leverage,
      marginMode: 'isolated',
      margin: collateralUsd,
      maintenanceMargin,
      marginRatio,
      unrealizedPnl,
      realizedPnl: parseFloat(position.realizedPnl),
      timestamp: position.updateTime * 1000,
      info: {
        positionAddress,
        owner: position.owner,
        pool: position.pool,
        custody: position.custody,
        openTime: position.openTime,
        cumulativeInterestSnapshot: position.cumulativeInterestSnapshot,
        notional: sizeUsd,
      },
    };
  }

  /**
   * Normalize position for internal SDK use
   */
  normalizePositionInternal(
    positionAddress: string,
    position: JupiterPositionAccount,
    currentPrice: number,
    marketKey: string
  ): JupiterNormalizedPosition {
    const symbol = jupiterToUnified(marketKey);
    const side = position.side === 'Long' ? 'long' : 'short';
    const sizeUsd = parseFloat(position.sizeUsd);
    const collateralUsd = parseFloat(position.collateralUsd);
    const entryPrice = parseFloat(position.price);
    const size = parseFloat(position.sizeTokens);
    const leverage = sizeUsd / collateralUsd;

    const unrealizedPnl = this.calculateUnrealizedPnl(side, size, entryPrice, currentPrice);

    const liquidationPrice = this.calculateLiquidationPrice(
      side,
      entryPrice,
      leverage,
      collateralUsd,
      sizeUsd
    );

    return {
      id: positionAddress,
      owner: position.owner,
      symbol,
      side,
      size,
      sizeUsd,
      entryPrice,
      markPrice: currentPrice,
      collateralUsd,
      leverage,
      unrealizedPnl,
      realizedPnl: parseFloat(position.realizedPnl),
      liquidationPrice,
      openTime: position.openTime * 1000,
      updateTime: position.updateTime * 1000,
    };
  }

  /**
   * Normalize ticker from price API and stats
   */
  normalizeTicker(
    marketKey: string,
    priceData: JupiterPriceData,
    stats?: JupiterMarketStats
  ): Ticker {
    const symbol = jupiterToUnified(marketKey);
    const price = parseFloat(priceData.price);
    const now = Date.now();

    // Use price as fallback for required fields when no stats available
    const bid = priceData.extraInfo?.quotedPrice
      ? parseFloat(priceData.extraInfo.quotedPrice.buyPrice)
      : price * 0.9995; // Approximate 0.05% spread
    const ask = priceData.extraInfo?.quotedPrice
      ? parseFloat(priceData.extraInfo.quotedPrice.sellPrice)
      : price * 1.0005;

    return {
      symbol,
      timestamp: now,
      last: price,
      bid,
      ask,
      high: stats?.high24h ?? price,
      low: stats?.low24h ?? price,
      open: stats?.oraclePrice ?? price,
      close: price,
      change: 0, // Would need historical data
      percentage: 0,
      baseVolume: stats?.volume24h ? stats.volume24h / price : 0,
      quoteVolume: stats?.volume24h ?? 0,
      info: {
        oraclePrice: stats?.oraclePrice,
        markPrice: stats?.markPrice,
        longOpenInterest: stats?.longOpenInterest,
        shortOpenInterest: stats?.shortOpenInterest,
        confidenceLevel: priceData.extraInfo?.confidenceLevel,
      },
    };
  }

  /**
   * Normalize balance from pool stats
   * Jupiter uses JLP pool for collateral
   */
  normalizeBalance(currency: string, total: number, locked: number): Balance {
    return {
      currency,
      total,
      free: total - locked,
      used: locked,
    };
  }

  /**
   * Normalize funding rate (Jupiter uses borrow fees, not funding rates)
   * We represent borrow fee as a pseudo-funding rate for unified interface
   */
  normalizeFundingRate(
    marketKey: string,
    custody: JupiterCustodyAccount,
    currentPrice: number
  ): FundingRate {
    const symbol = jupiterToUnified(marketKey);
    const now = Date.now();
    const hourlyBorrowRate = parseFloat(custody.fundingRateState.hourlyBorrowRate);

    return {
      symbol,
      fundingRate: hourlyBorrowRate,
      fundingTimestamp: custody.fundingRateState.lastUpdate * 1000,
      nextFundingTimestamp: now + 3600000, // Next hour
      markPrice: currentPrice,
      indexPrice: currentPrice, // Jupiter uses oracle price as index
      fundingIntervalHours: 1,
      info: {
        cumulativeInterestRate: custody.fundingRateState.cumulativeInterestRate,
        isBorrowFee: true, // Indicate this is a borrow fee, not traditional funding
      },
    };
  }

  /**
   * Normalize order book (Jupiter doesn't have traditional orderbook)
   * Returns synthetic orderbook based on pool liquidity
   */
  normalizeOrderBook(
    marketKey: string,
    currentPrice: number,
    poolStats?: JupiterPoolStats
  ): OrderBook {
    const symbol = jupiterToUnified(marketKey);
    const now = Date.now();

    // Jupiter doesn't have a traditional order book
    // We create a synthetic one based on available liquidity
    const bids: [number, number][] = [];
    const asks: [number, number][] = [];

    // Generate synthetic depth based on pool AUM
    if (poolStats) {
      const availableLiquidity = poolStats.aumUsd * 0.1; // Assume 10% available for trading
      const levels = 10;
      const spreadBps = 5; // 0.05% spread

      for (let i = 0; i < levels; i++) {
        const bidPrice = currentPrice * (1 - (spreadBps + i * 2) / 10000);
        const askPrice = currentPrice * (1 + (spreadBps + i * 2) / 10000);
        const size = availableLiquidity / levels / currentPrice;

        bids.push([bidPrice, size]);
        asks.push([askPrice, size]);
      }
    }

    return {
      symbol,
      exchange: 'jupiter',
      bids,
      asks,
      timestamp: now,
    };
  }

  /**
   * Normalize pool stats to unified format
   */
  normalizePoolStats(stats: JupiterPoolStats): Record<string, unknown> {
    return {
      aumUsd: stats.aumUsd,
      volume24h: stats.volume24h,
      volume7d: stats.volume7d,
      fees24h: stats.fees24h,
      openInterest: stats.openInterest,
      longOpenInterest: stats.longOpenInterest,
      shortOpenInterest: stats.shortOpenInterest,
      jlpPrice: stats.jlpPrice,
      jlpSupply: stats.jlpSupply,
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Calculate unrealized PnL
   */
  private calculateUnrealizedPnl(
    side: 'long' | 'short',
    size: number,
    entryPrice: number,
    currentPrice: number
  ): number {
    if (side === 'long') {
      return size * (currentPrice - entryPrice);
    } else {
      return size * (entryPrice - currentPrice);
    }
  }

  /**
   * Calculate liquidation price
   * Simplified calculation - actual Jupiter calculation is more complex
   */
  private calculateLiquidationPrice(
    side: 'long' | 'short',
    entryPrice: number,
    leverage: number,
    _collateralUsd: number,
    _sizeUsd: number
  ): number {
    // Maintenance margin ~1% of position size
    const maintenanceMargin = 0.01;
    const liquidationThreshold = 1 - maintenanceMargin;

    if (side === 'long') {
      // Long liquidation: price drops until margin is consumed
      return entryPrice * (1 - liquidationThreshold / leverage);
    } else {
      // Short liquidation: price rises until margin is consumed
      return entryPrice * (1 + liquidationThreshold / leverage);
    }
  }

  /**
   * Get price precision for market
   */
  private getPricePrecision(marketKey: string): number {
    const config = JUPITER_MARKETS[marketKey as keyof typeof JUPITER_MARKETS];
    if (!config) return 6;

    // Derive precision from tick size
    const tickSize = config.tickSize;
    return Math.max(0, -Math.floor(Math.log10(tickSize)));
  }

  /**
   * Get amount precision for market
   */
  private getAmountPrecision(marketKey: string): number {
    const config = JUPITER_MARKETS[marketKey as keyof typeof JUPITER_MARKETS];
    if (!config) return 4;

    // Derive precision from step size
    const stepSize = config.stepSize;
    return Math.max(0, -Math.floor(Math.log10(stepSize)));
  }
}

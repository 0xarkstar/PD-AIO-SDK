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
  Order,
  Trade,
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
import {
  JupiterPositionAccountSchema,
  JupiterPoolAccountSchema,
  JupiterCustodyAccountSchema,
  JupiterPoolStatsSchema,
  JupiterPriceDataSchema,
} from './types.js';
import { jupiterToUnified, unifiedToJupiter, JUPITER_MARKETS } from './constants.js';

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
    const validatedCustody = JupiterCustodyAccountSchema.parse(custody);
    const validatedPool = JupiterPoolAccountSchema.parse(pool);
    const marketConfig = JUPITER_MARKETS[marketKey as keyof typeof JUPITER_MARKETS];
    const symbol = jupiterToUnified(marketKey);
    const fees = validatedPool.fees ?? { openPositionFee: 50, closePositionFee: 70 };
    const makerFee = (fees.openPositionFee ?? 50) / 10000;
    const takerFee = (fees.closePositionFee ?? 70) / 10000;

    const trading = validatedCustody.trading ?? { tradingEnabled: false };
    const pricing = validatedCustody.pricing ?? {
      maxPositionLockedUsd: 1000000,
      maxLeverage: 100,
      maxUtilization: 80,
    };
    const oracle = validatedCustody.oracle ?? { oracleAccount: '' };

    return {
      id: marketKey,
      symbol,
      base: marketConfig?.baseToken || marketKey.replace('-PERP', ''),
      quote: 'USD',
      settle: 'USD',
      active: trading.tradingEnabled ?? false,
      minAmount: marketConfig?.minPositionSize || 0.001,
      maxAmount: pricing.maxPositionLockedUsd ?? 1000000,
      minCost: 10, // $10 minimum
      pricePrecision: this.getPricePrecision(marketKey),
      amountPrecision: this.getAmountPrecision(marketKey),
      priceTickSize: marketConfig?.tickSize || 0.001,
      amountStepSize: marketConfig?.stepSize || 0.001,
      makerFee,
      takerFee,
      maxLeverage: pricing.maxLeverage ?? 100,
      fundingIntervalHours: 1, // Jupiter uses hourly borrow fees
      contractSize: 1,
      info: {
        custody: validatedCustody.mint ?? '',
        pool: validatedPool.name ?? '',
        oracle: oracle.oracleAccount ?? '',
        isStable: validatedCustody.isStable ?? false,
        maxUtilization: pricing.maxUtilization ?? 80,
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
    const validated = JupiterPositionAccountSchema.parse(position);
    const symbol = jupiterToUnified(marketKey);
    const sideStr = validated.side ?? 'Long';
    const side = sideStr === 'Long' ? 'long' : 'short';
    const sizeUsd = parseFloat(validated.sizeUsd ?? '0');
    const collateralUsd = parseFloat(validated.collateralUsd ?? '0');
    const entryPrice = parseFloat(validated.price ?? '0');
    const size = parseFloat(validated.sizeTokens ?? '0');
    const leverage = collateralUsd > 0 ? sizeUsd / collateralUsd : 1;

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
      realizedPnl: parseFloat(validated.realizedPnl ?? '0'),
      timestamp: (validated.updateTime ?? 0) * 1000,
      info: {
        positionAddress,
        owner: validated.owner ?? '',
        pool: validated.pool ?? '',
        custody: validated.custody ?? '',
        openTime: validated.openTime ?? 0,
        cumulativeInterestSnapshot: validated.cumulativeInterestSnapshot ?? '0',
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
    const validated = JupiterPriceDataSchema.parse(priceData);
    const symbol = jupiterToUnified(marketKey);
    const price = parseFloat(validated.price);
    const now = Date.now();

    // Use price as fallback for required fields when no stats available
    const bid = validated.extraInfo?.quotedPrice
      ? parseFloat(validated.extraInfo.quotedPrice.buyPrice)
      : price * 0.9995; // Approximate 0.05% spread
    const ask = validated.extraInfo?.quotedPrice
      ? parseFloat(validated.extraInfo.quotedPrice.sellPrice)
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
        confidenceLevel: validated.extraInfo?.confidenceLevel,
        _bidAskSource: 'calculated',
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
    const validated = JupiterCustodyAccountSchema.parse(custody);
    const symbol = jupiterToUnified(marketKey);
    const now = Date.now();
    const hourlyBorrowRate = parseFloat(validated.fundingRateState.hourlyBorrowRate);

    return {
      symbol,
      fundingRate: hourlyBorrowRate,
      fundingTimestamp: validated.fundingRateState.lastUpdate * 1000,
      nextFundingTimestamp: now + 3600000, // Next hour
      markPrice: currentPrice,
      indexPrice: currentPrice, // Jupiter uses oracle price as index
      fundingIntervalHours: 1,
      info: {
        cumulativeInterestRate: validated.fundingRateState.cumulativeInterestRate,
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
   * Normalize order data to unified Order
   * Jupiter uses instant execution, so orders are typically already filled
   */
  normalizeOrder(data: {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    type?: 'market' | 'limit';
    amount: number;
    price: number;
    filled?: number;
    status?: 'open' | 'closed' | 'canceled';
    timestamp?: number;
    leverage?: number;
    reduceOnly?: boolean;
    clientOrderId?: string;
    info?: Record<string, unknown>;
  }): Order {
    const filled = data.filled ?? data.amount;
    const remaining = data.amount - filled;

    return {
      id: data.id,
      symbol: data.symbol,
      type: data.type ?? 'market',
      side: data.side,
      amount: data.amount,
      price: data.price,
      status: data.status ?? 'closed',
      filled,
      remaining,
      averagePrice: data.price,
      reduceOnly: data.reduceOnly ?? false,
      postOnly: false,
      clientOrderId: data.clientOrderId,
      timestamp: data.timestamp ?? Date.now(),
      info: data.info,
    };
  }

  /**
   * Normalize trade data to unified Trade
   * Jupiter trades come from on-chain transaction parsing
   */
  normalizeTrade(data: {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    price: number;
    amount: number;
    timestamp?: number;
    fee?: { cost: number; currency: string };
    info?: Record<string, unknown>;
  }): Trade {
    return {
      id: data.id,
      symbol: data.symbol,
      side: data.side,
      price: data.price,
      amount: data.amount,
      cost: data.price * data.amount,
      fee: data.fee,
      timestamp: data.timestamp ?? Date.now(),
      info: data.info,
    };
  }

  /**
   * Normalize pool stats to unified format
   */
  normalizePoolStats(stats: JupiterPoolStats): Record<string, unknown> {
    const validated = JupiterPoolStatsSchema.parse(stats);
    return {
      aumUsd: validated.aumUsd,
      volume24h: validated.volume24h,
      volume7d: validated.volume7d,
      fees24h: validated.fees24h,
      openInterest: validated.openInterest,
      longOpenInterest: validated.longOpenInterest,
      shortOpenInterest: validated.shortOpenInterest,
      jlpPrice: validated.jlpPrice,
      jlpSupply: validated.jlpSupply,
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

  normalizeSymbol(exchangeSymbol: string): string {
    return jupiterToUnified(exchangeSymbol);
  }

  toExchangeSymbol(symbol: string): string {
    return unifiedToJupiter(symbol);
  }
}

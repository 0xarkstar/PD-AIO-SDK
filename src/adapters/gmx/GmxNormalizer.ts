/**
 * GMX v2 Data Normalizer
 *
 * Transforms GMX API responses and on-chain data to unified SDK format.
 */

import type {
  Market,
  Order,
  Position,
  Trade,
  FundingRate,
  Ticker,
  OHLCV,
} from '../../types/common.js';
import type {
  GmxMarketInfo,
  GmxPosition,
  GmxOrder,
  GmxTrade,
  GmxFundingRate,
  GmxCandlestick,
} from './types.js';
import {
  GMX_MARKETS,
  GMX_PRECISION,
  GMX_MARKET_ADDRESS_MAP,
  gmxToUnified,
  type GMXMarketKey,
} from './constants.js';

/**
 * Normalizer for GMX v2 data
 */
export class GmxNormalizer {
  /**
   * Extract base symbol from market name
   * @example "ENA/USD [ETH-USDC]" -> "ENA"
   * @example "ETH/USD" -> "ETH"
   */
  private extractBaseFromName(name: string | undefined): string {
    if (!name) return 'UNKNOWN';
    const match = name.match(/^([A-Z0-9]+)\//);
    return match?.[1] ?? 'UNKNOWN';
  }

  /**
   * Normalize market info to unified Market
   */
  normalizeMarket(market: GmxMarketInfo, chain: 'arbitrum' | 'avalanche'): Market {
    const marketKey = GMX_MARKET_ADDRESS_MAP[market.marketToken.toLowerCase()];
    const config = marketKey ? GMX_MARKETS[marketKey] : undefined;

    // Get base symbol from config or extract from market name
    const baseSymbol = config?.baseAsset || this.extractBaseFromName(market.name);
    const symbol = config?.symbol || `${baseSymbol}/USD`;

    // Price info may not be available in markets/info response
    // Use a reasonable default for calculations
    const maxOI = parseFloat(market.maxOpenInterestLong) / GMX_PRECISION.USD;

    return {
      id: market.marketToken,
      symbol,
      base: baseSymbol,
      quote: 'USD',
      settle: config?.settleAsset || 'USD',
      active: !market.isDisabled,
      minAmount: config?.minOrderSize || 0.001,
      maxAmount: maxOI > 0 ? maxOI : 1000000, // Fallback if price unavailable
      pricePrecision: this.getPrecisionFromTickSize(config?.tickSize || 0.01),
      amountPrecision: this.getPrecisionFromTickSize(config?.stepSize || 0.0001),
      priceTickSize: config?.tickSize || 0.01,
      amountStepSize: config?.stepSize || 0.0001,
      makerFee: 0.0005, // 0.05% base fee (varies with price impact)
      takerFee: 0.0007, // 0.07% base fee (varies with price impact)
      maxLeverage: config?.maxLeverage || 100,
      fundingIntervalHours: 1, // Continuous funding, normalized to 1h
      contractSize: 1,
      info: {
        marketToken: market.marketToken,
        indexToken: market.indexToken,
        longToken: market.longToken,
        shortToken: market.shortToken,
        chain,
        longPoolAmount: market.longPoolAmount,
        shortPoolAmount: market.shortPoolAmount,
        longInterestUsd: market.longInterestUsd,
        shortInterestUsd: market.shortInterestUsd,
        fundingFactor: market.fundingFactor,
        borrowingFactorLong: market.borrowingFactorLong,
        borrowingFactorShort: market.borrowingFactorShort,
      },
    };
  }

  /**
   * Normalize multiple markets
   */
  normalizeMarkets(markets: GmxMarketInfo[], chain: 'arbitrum' | 'avalanche'): Market[] {
    return markets.map(m => this.normalizeMarket(m, chain));
  }

  /**
   * Normalize position to unified Position
   */
  normalizePosition(
    position: GmxPosition,
    markPrice: number,
    chain: 'arbitrum' | 'avalanche'
  ): Position {
    const marketKey = GMX_MARKET_ADDRESS_MAP[position.market.toLowerCase()];
    const config = marketKey ? GMX_MARKETS[marketKey] : undefined;
    const symbol = config?.symbol || gmxToUnified(marketKey as GMXMarketKey);

    const sizeInUsd = parseFloat(position.sizeInUsd) / GMX_PRECISION.USD;
    const sizeInTokens = parseFloat(position.sizeInTokens) / (10 ** 18); // Assume 18 decimals
    const collateral = parseFloat(position.collateralAmount) / (10 ** 18);
    const side: 'long' | 'short' = position.isLong ? 'long' : 'short';

    const entryPrice = sizeInTokens > 0 ? sizeInUsd / sizeInTokens : markPrice;
    const notional = sizeInTokens * markPrice;

    // Calculate unrealized PnL
    const unrealizedPnl = this.calculateUnrealizedPnl(side, sizeInTokens, entryPrice, markPrice);

    // Estimate leverage
    const collateralUsd = collateral * markPrice; // Simplified - should use collateral token price
    const leverage = collateralUsd > 0 ? notional / collateralUsd : 0;

    // Calculate liquidation price (simplified)
    const maintenanceMargin = 0.01; // 1% maintenance margin
    const liquidationPrice = this.calculateLiquidationPrice(side, entryPrice, leverage, maintenanceMargin);

    return {
      symbol,
      side,
      size: sizeInTokens,
      entryPrice,
      markPrice,
      liquidationPrice,
      leverage,
      marginMode: 'cross', // GMX uses cross-margin
      margin: collateralUsd,
      maintenanceMargin: notional * maintenanceMargin,
      marginRatio: this.calculateMarginRatio(side, entryPrice, markPrice, leverage, maintenanceMargin),
      unrealizedPnl,
      realizedPnl: 0, // Would need historical data
      timestamp: Date.now(),
      info: {
        marketAddress: position.market,
        collateralToken: position.collateralToken,
        borrowingFactor: position.borrowingFactor,
        fundingFeeAmountPerSize: position.fundingFeeAmountPerSize,
        chain,
      },
    };
  }

  /**
   * Normalize order to unified Order
   */
  normalizeOrder(order: GmxOrder, marketPrice?: number): Order {
    const marketKey = GMX_MARKET_ADDRESS_MAP[order.market.toLowerCase()];
    const config = marketKey ? GMX_MARKETS[marketKey] : undefined;
    const symbol = config?.symbol || gmxToUnified(marketKey as GMXMarketKey);

    const sizeDeltaUsd = parseFloat(order.sizeDeltaUsd) / GMX_PRECISION.USD;
    const triggerPrice = parseFloat(order.triggerPrice) / GMX_PRECISION.PRICE;
    const acceptablePrice = parseFloat(order.acceptablePrice) / GMX_PRECISION.PRICE;

    // Map order type
    let type: 'market' | 'limit' | 'stopMarket' | 'stopLimit' = 'market';
    if (order.orderType === 0 || order.orderType === 1) {
      type = 'market';
    } else if (order.orderType === 2 || order.orderType === 3) {
      type = 'limit';
    } else if (order.orderType === 4) {
      type = 'stopMarket';
    }

    // Determine side
    const isIncrease = order.orderType === 0 || order.orderType === 2;
    const side: 'buy' | 'sell' = (isIncrease && order.isLong) || (!isIncrease && !order.isLong) ? 'buy' : 'sell';

    // Map status
    let status: 'open' | 'closed' | 'canceled' | 'expired' | 'filled' | 'partiallyFilled' | 'rejected' = 'open';
    if (order.status === 'Executed') status = 'filled';
    else if (order.status === 'Cancelled') status = 'canceled';
    else if (order.status === 'Expired') status = 'expired';
    else if (order.isFrozen) status = 'rejected';

    const price = triggerPrice > 0 ? triggerPrice : (marketPrice || acceptablePrice);
    const amount = price > 0 ? sizeDeltaUsd / price : 0;

    return {
      id: order.key,
      symbol,
      type,
      side,
      amount,
      price,
      stopPrice: order.orderType === 4 ? triggerPrice : undefined,
      status,
      filled: status === 'filled' ? amount : 0,
      remaining: status === 'filled' ? 0 : amount,
      averagePrice: undefined,
      reduceOnly: order.orderType === 1 || order.orderType === 3 || order.orderType === 4,
      postOnly: false,
      timestamp: parseInt(order.updatedAtBlock) * 1000, // Approximate
      info: {
        orderKey: order.key,
        orderType: order.orderType,
        marketAddress: order.market,
        isLong: order.isLong,
        decreasePositionSwapType: order.decreasePositionSwapType,
        executionFee: order.executionFee,
        acceptablePrice: order.acceptablePrice,
      },
    };
  }

  /**
   * Normalize trade to unified Trade
   */
  normalizeTrade(trade: GmxTrade): Trade {
    const marketKey = GMX_MARKET_ADDRESS_MAP[trade.market.toLowerCase()];
    const config = marketKey ? GMX_MARKETS[marketKey] : undefined;
    const symbol = config?.symbol || gmxToUnified(marketKey as GMXMarketKey);

    const sizeDeltaUsd = parseFloat(trade.sizeDeltaUsd) / GMX_PRECISION.USD;
    const executionPrice = parseFloat(trade.executionPrice) / GMX_PRECISION.PRICE;
    const sizeDeltaInTokens = parseFloat(trade.sizeDeltaInTokens) / (10 ** 18);

    // Determine side
    const isIncrease = trade.orderType === 0 || trade.orderType === 2;
    const side: 'buy' | 'sell' = (isIncrease && trade.isLong) || (!isIncrease && !trade.isLong) ? 'buy' : 'sell';

    return {
      id: trade.id,
      symbol,
      side,
      price: executionPrice,
      amount: Math.abs(sizeDeltaInTokens),
      cost: sizeDeltaUsd,
      timestamp: trade.timestamp * 1000,
      info: {
        marketAddress: trade.market,
        isLong: trade.isLong,
        orderType: trade.orderType,
        pnlUsd: trade.pnlUsd,
        priceImpactUsd: trade.priceImpactUsd,
        transactionHash: trade.transactionHash,
      },
    };
  }

  /**
   * Normalize funding rate
   */
  normalizeFundingRate(
    funding: GmxFundingRate,
    indexPrice: number
  ): FundingRate {
    const marketKey = GMX_MARKET_ADDRESS_MAP[funding.market.toLowerCase()];
    const config = marketKey ? GMX_MARKETS[marketKey] : undefined;
    const symbol = config?.symbol || gmxToUnified(marketKey as GMXMarketKey);

    // GMX funding rate is per second, convert to hourly
    const fundingFactorPerSecond = parseFloat(funding.fundingFactorPerSecond) / GMX_PRECISION.FACTOR;
    const hourlyRate = fundingFactorPerSecond * 3600;

    // Adjust sign based on direction
    const fundingRate = funding.longsPayShorts ? hourlyRate : -hourlyRate;

    return {
      symbol,
      fundingRate,
      fundingTimestamp: funding.timestamp * 1000,
      nextFundingTimestamp: (funding.timestamp + 3600) * 1000, // Next hour (continuous)
      markPrice: indexPrice,
      indexPrice,
      fundingIntervalHours: 1,
      info: {
        marketAddress: funding.market,
        fundingFactorPerSecond: funding.fundingFactorPerSecond,
        longsPayShorts: funding.longsPayShorts,
        fundingFeeAmountPerSizeLong: funding.fundingFeeAmountPerSizeLong,
        fundingFeeAmountPerSizeShort: funding.fundingFeeAmountPerSizeShort,
      },
    };
  }

  /**
   * Normalize market info to ticker
   * Note: Price data requires separate fetch from tickers endpoint
   */
  normalizeTicker(market: GmxMarketInfo, priceData?: { minPrice: number; maxPrice: number }): Ticker {
    const marketKey = GMX_MARKET_ADDRESS_MAP[market.marketToken.toLowerCase()];
    const config = marketKey ? GMX_MARKETS[marketKey] : undefined;

    // Get base symbol from config or extract from market name
    const baseSymbol = config?.baseAsset || this.extractBaseFromName(market.name);
    const symbol = config?.symbol || `${baseSymbol}/USD`;

    // Use provided price data or defaults
    const minPrice = priceData?.minPrice ?? 0;
    const maxPrice = priceData?.maxPrice ?? 0;
    const midPrice = (minPrice + maxPrice) / 2;
    const spread = maxPrice - minPrice;

    const longOI = parseFloat(market.longInterestUsd) / GMX_PRECISION.USD;
    const shortOI = parseFloat(market.shortInterestUsd) / GMX_PRECISION.USD;

    return {
      symbol,
      timestamp: Date.now(),
      last: midPrice,
      bid: minPrice,
      ask: maxPrice,
      high: midPrice, // Would need historical data
      low: midPrice,
      open: midPrice,
      close: midPrice,
      change: 0, // Would need historical data
      percentage: 0,
      baseVolume: 0, // Would need volume data
      quoteVolume: 0,
      info: {
        marketToken: market.marketToken,
        minPrice,
        maxPrice,
        spread,
        spreadPercent: midPrice > 0 ? (spread / midPrice) * 100 : 0,
        longOpenInterestUsd: longOI,
        shortOpenInterestUsd: shortOI,
        totalOpenInterestUsd: longOI + shortOI,
        imbalance: longOI - shortOI,
      },
    };
  }

  /**
   * Normalize candlesticks to OHLCV
   */
  normalizeCandle(candle: GmxCandlestick): OHLCV {
    return [
      candle.timestamp * 1000,
      candle.open,
      candle.high,
      candle.low,
      candle.close,
      0, // GMX candlestick endpoint doesn't include volume
    ];
  }

  /**
   * Normalize candlesticks array
   */
  normalizeCandles(candles: GmxCandlestick[]): OHLCV[] {
    return candles.map(c => this.normalizeCandle(c));
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
   */
  private calculateLiquidationPrice(
    side: 'long' | 'short',
    entryPrice: number,
    leverage: number,
    maintenanceMargin: number
  ): number {
    if (leverage <= 0) return 0;

    const liquidationThreshold = 1 - maintenanceMargin;

    if (side === 'long') {
      return entryPrice * (1 - liquidationThreshold / leverage);
    } else {
      return entryPrice * (1 + liquidationThreshold / leverage);
    }
  }

  /**
   * Calculate margin ratio (percentage until liquidation)
   */
  private calculateMarginRatio(
    side: 'long' | 'short',
    entryPrice: number,
    currentPrice: number,
    leverage: number,
    maintenanceMargin: number
  ): number {
    if (leverage <= 0 || entryPrice <= 0) return 100;

    const pnlPercent = side === 'long'
      ? (currentPrice - entryPrice) / entryPrice
      : (entryPrice - currentPrice) / entryPrice;

    const marginUsed = 1 / leverage;
    const currentMargin = marginUsed + pnlPercent;

    return Math.max(0, ((currentMargin - maintenanceMargin) / marginUsed) * 100);
  }

  /**
   * Get precision from tick size
   */
  private getPrecisionFromTickSize(tickSize: number): number {
    if (tickSize >= 1) return 0;
    return Math.max(0, -Math.floor(Math.log10(tickSize)));
  }
}

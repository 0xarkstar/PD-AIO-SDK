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
  GmxCandleTuple,
} from './types.js';
import {
  GmxMarketInfoSchema,
  GmxPositionSchema,
  GmxOrderSchema,
  GmxTradeSchema,
  GmxFundingRateSchema,
  GmxCandleTupleSchema,
} from './types.js';
import {
  GMX_MARKETS,
  GMX_PRECISION,
  GMX_MARKET_ADDRESS_MAP,
  gmxToUnified,
  getTokenDecimals,
  getTokenDecimalsByAddress,
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
   * Derive market configuration from API data for markets not in hardcoded constants
   * Uses available API fields to determine sensible defaults
   */
  private deriveMarketConfig(
    market: GmxMarketInfo,
    baseSymbol: string
  ): {
    minOrderSize: number;
    tickSize: number;
    stepSize: number;
    maxLeverage: number;
  } {
    // Get token decimals from API response if available
    const indexDecimals = market.indexTokenInfo?.decimals ?? 18;

    // Derive tick size based on token decimals and typical price ranges
    // Lower decimals = higher tick size (e.g., BTC has 8 decimals, needs larger tick)
    let tickSize: number;
    if (indexDecimals <= 8) {
      // BTC-like assets: $0.1 tick
      tickSize = 0.1;
    } else if (indexDecimals === 9) {
      // SOL-like assets: $0.001 tick
      tickSize = 0.001;
    } else {
      // ETH and most others: $0.01 tick
      tickSize = 0.01;
    }

    // Derive step size based on asset type (amount precision)
    let stepSize: number;
    let minOrderSize: number;
    if (indexDecimals <= 8) {
      // BTC-like: 0.00001 BTC step, 0.0001 BTC min
      stepSize = 0.00001;
      minOrderSize = 0.0001;
    } else if (indexDecimals === 9) {
      // SOL-like: 0.01 SOL step, 0.1 SOL min
      stepSize = 0.01;
      minOrderSize = 0.1;
    } else if (baseSymbol === 'DOGE' || baseSymbol === 'XRP') {
      // Low-price assets: 1 unit step, 10 units min
      stepSize = 1;
      minOrderSize = 10;
    } else {
      // ETH-like: 0.0001 ETH step, 0.001 ETH min
      stepSize = 0.0001;
      minOrderSize = 0.001;
    }

    // Derive max leverage from minCollateralFactor
    // minCollateralFactor is the minimum margin ratio (e.g., 0.01 = 1% = 100x max leverage)
    let maxLeverage = 100; // Default
    if (market.minCollateralFactor) {
      const minMarginRatio = parseFloat(market.minCollateralFactor) / GMX_PRECISION.FACTOR;
      if (minMarginRatio > 0) {
        // Max leverage = 1 / min margin ratio
        const derivedLeverage = 1 / minMarginRatio;
        // Cap at reasonable values and round down
        maxLeverage = Math.min(Math.floor(derivedLeverage), 100);
        // Ensure minimum of 1x
        maxLeverage = Math.max(maxLeverage, 1);
      }
    }

    return {
      minOrderSize,
      tickSize,
      stepSize,
      maxLeverage,
    };
  }

  /**
   * Normalize market info to unified Market
   */
  normalizeMarket(market: GmxMarketInfo, chain: 'arbitrum' | 'avalanche'): Market {
    const validated = GmxMarketInfoSchema.parse(market);
    const marketToken = validated.marketToken ?? '';
    const marketKey = GMX_MARKET_ADDRESS_MAP[marketToken.toLowerCase()];
    const config = marketKey ? GMX_MARKETS[marketKey] : undefined;

    // Get base symbol from config or extract from market name
    const baseSymbol = config?.baseAsset || this.extractBaseFromName(validated.name);
    const symbol = config?.symbol || `${baseSymbol}/USD`;

    // If config is not found, derive market parameters from API data
    const derivedConfig = config ? null : this.deriveMarketConfig(validated, baseSymbol);

    // Use config values if available, otherwise use derived values
    const minOrderSize = config?.minOrderSize ?? derivedConfig?.minOrderSize ?? 0.001;
    const tickSize = config?.tickSize ?? derivedConfig?.tickSize ?? 0.01;
    const stepSize = config?.stepSize ?? derivedConfig?.stepSize ?? 0.0001;
    const maxLeverage = config?.maxLeverage ?? derivedConfig?.maxLeverage ?? 100;

    // Calculate maxAmount from open interest limits
    const maxOILong = parseFloat(validated.maxOpenInterestLong ?? '0') / GMX_PRECISION.USD;
    const maxOIShort = parseFloat(validated.maxOpenInterestShort ?? '0') / GMX_PRECISION.USD;
    const maxOI = Math.max(maxOILong, maxOIShort);

    return {
      id: marketToken,
      symbol,
      base: baseSymbol,
      quote: 'USD',
      settle: config?.settleAsset || 'USD',
      active: !(validated.isDisabled ?? false),
      minAmount: minOrderSize,
      maxAmount: maxOI > 0 ? maxOI : 1000000, // Fallback if OI data unavailable
      pricePrecision: this.getPrecisionFromTickSize(tickSize),
      amountPrecision: this.getPrecisionFromTickSize(stepSize),
      priceTickSize: tickSize,
      amountStepSize: stepSize,
      makerFee: 0.0005, // 0.05% base fee (varies with price impact)
      takerFee: 0.0007, // 0.07% base fee (varies with price impact)
      maxLeverage,
      fundingIntervalHours: 1, // Continuous funding, normalized to 1h
      contractSize: 1,
      info: {
        marketToken: validated.marketToken ?? '',
        indexToken: validated.indexToken ?? '',
        longToken: validated.longToken ?? '',
        shortToken: validated.shortToken ?? '',
        chain,
        longPoolAmount: validated.longPoolAmount ?? '0',
        shortPoolAmount: validated.shortPoolAmount ?? '0',
        longInterestUsd: validated.longInterestUsd ?? '0',
        shortInterestUsd: validated.shortInterestUsd ?? '0',
        fundingFactor: validated.fundingFactor ?? '0',
        borrowingFactorLong: validated.borrowingFactorLong ?? '0',
        borrowingFactorShort: validated.borrowingFactorShort ?? '0',
        _configSource: config ? 'hardcoded' : 'derived',
      },
    };
  }

  /**
   * Normalize multiple markets
   */
  normalizeMarkets(markets: GmxMarketInfo[], chain: 'arbitrum' | 'avalanche'): Market[] {
    return markets.map((m) => this.normalizeMarket(m, chain));
  }

  /**
   * Normalize position to unified Position
   */
  normalizePosition(
    position: GmxPosition,
    markPrice: number,
    chain: 'arbitrum' | 'avalanche'
  ): Position {
    const validated = GmxPositionSchema.parse(position);
    const market = validated.market ?? '';
    const marketKey = GMX_MARKET_ADDRESS_MAP[market.toLowerCase()];
    const config = marketKey ? GMX_MARKETS[marketKey] : undefined;
    const symbol = config?.symbol || gmxToUnified(marketKey as GMXMarketKey);

    const sizeInUsd = parseFloat(validated.sizeInUsd ?? '0') / GMX_PRECISION.USD;
    const indexTokenDecimals = config ? getTokenDecimals(config.baseAsset) : 18;
    const sizeInTokens = parseFloat(validated.sizeInTokens ?? '0') / 10 ** indexTokenDecimals;
    const collateralDecimals = getTokenDecimalsByAddress(validated.collateralToken ?? '');
    const collateral = parseFloat(validated.collateralAmount ?? '0') / 10 ** collateralDecimals;
    const side: 'long' | 'short' = (validated.isLong ?? true) ? 'long' : 'short';

    const entryPrice = sizeInTokens > 0 ? sizeInUsd / sizeInTokens : markPrice;
    const notional = sizeInTokens * markPrice;

    // Calculate unrealized PnL
    const unrealizedPnl = this.calculateUnrealizedPnl(side, sizeInTokens, entryPrice, markPrice);

    // Estimate leverage
    const collateralUsd = collateral * markPrice; // Simplified - should use collateral token price
    const leverage = collateralUsd > 0 ? notional / collateralUsd : 0;

    // Calculate liquidation price (simplified)
    const maintenanceMargin = 0.01; // 1% maintenance margin
    const liquidationPrice = this.calculateLiquidationPrice(
      side,
      entryPrice,
      leverage,
      maintenanceMargin
    );

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
      marginRatio: this.calculateMarginRatio(
        side,
        entryPrice,
        markPrice,
        leverage,
        maintenanceMargin
      ),
      unrealizedPnl,
      realizedPnl: 0,
      timestamp: Date.now(),
      info: {
        marketAddress: validated.market ?? '',
        collateralToken: validated.collateralToken ?? '',
        borrowingFactor: validated.borrowingFactor ?? '0',
        fundingFeeAmountPerSize: validated.fundingFeeAmountPerSize ?? '0',
        chain,
        _realizedPnlSource: 'not_available',
      },
    };
  }

  /**
   * Normalize order to unified Order
   */
  normalizeOrder(order: GmxOrder, marketPrice?: number): Order {
    const validated = GmxOrderSchema.parse(order);
    const market = validated.market ?? '';
    const marketKey = GMX_MARKET_ADDRESS_MAP[market.toLowerCase()];
    const config = marketKey ? GMX_MARKETS[marketKey] : undefined;
    const symbol = config?.symbol || gmxToUnified(marketKey as GMXMarketKey);

    const sizeDeltaUsd = parseFloat(validated.sizeDeltaUsd ?? '0') / GMX_PRECISION.USD;
    const triggerPrice = parseFloat(validated.triggerPrice ?? '0') / GMX_PRECISION.PRICE;
    const acceptablePrice = parseFloat(validated.acceptablePrice ?? '0') / GMX_PRECISION.PRICE;

    // Map order type
    const orderType = validated.orderType ?? 0;
    let type: 'market' | 'limit' | 'stopMarket' | 'stopLimit' = 'market';
    if (orderType === 0 || orderType === 1) {
      type = 'market';
    } else if (orderType === 2 || orderType === 3) {
      type = 'limit';
    } else if (orderType === 4) {
      type = 'stopMarket';
    }

    // Determine side
    const isLong = validated.isLong ?? true;
    const isIncrease = orderType === 0 || orderType === 2;
    const side: 'buy' | 'sell' =
      (isIncrease && isLong) || (!isIncrease && !isLong) ? 'buy' : 'sell';

    // Map status
    let status:
      | 'open'
      | 'closed'
      | 'canceled'
      | 'expired'
      | 'filled'
      | 'partiallyFilled'
      | 'rejected' = 'open';
    const statusStr = validated.status ?? '';
    if (statusStr === 'Executed') status = 'filled';
    else if (statusStr === 'Cancelled') status = 'canceled';
    else if (statusStr === 'Expired') status = 'expired';
    else if (validated.isFrozen) status = 'rejected';

    const price = triggerPrice > 0 ? triggerPrice : marketPrice || acceptablePrice;
    const amount = price > 0 ? sizeDeltaUsd / price : 0;

    return {
      id: validated.key ?? '',
      symbol,
      type,
      side,
      amount,
      price,
      stopPrice: orderType === 4 ? triggerPrice : undefined,
      status,
      filled: status === 'filled' ? amount : 0,
      remaining: status === 'filled' ? 0 : amount,
      averagePrice: undefined,
      reduceOnly: orderType === 1 || orderType === 3 || orderType === 4,
      postOnly: false,
      timestamp: parseInt(validated.updatedAtBlock) * 1000, // Approximate
      info: {
        orderKey: validated.key,
        orderType: validated.orderType,
        marketAddress: validated.market,
        isLong: validated.isLong,
        decreasePositionSwapType: validated.decreasePositionSwapType,
        executionFee: validated.executionFee,
        acceptablePrice: validated.acceptablePrice,
      },
    };
  }

  /**
   * Normalize trade to unified Trade
   */
  normalizeTrade(trade: GmxTrade): Trade {
    const validated = GmxTradeSchema.parse(trade);
    const marketKey = GMX_MARKET_ADDRESS_MAP[validated.market.toLowerCase()];
    const config = marketKey ? GMX_MARKETS[marketKey] : undefined;
    const symbol = config?.symbol || gmxToUnified(marketKey as GMXMarketKey);

    const sizeDeltaUsd = parseFloat(validated.sizeDeltaUsd) / GMX_PRECISION.USD;
    const executionPrice = parseFloat(validated.executionPrice) / GMX_PRECISION.PRICE;
    const sizeDeltaInTokens = parseFloat(validated.sizeDeltaInTokens) / 10 ** 18;

    // Determine side
    const isIncrease = validated.orderType === 0 || validated.orderType === 2;
    const side: 'buy' | 'sell' =
      (isIncrease && validated.isLong) || (!isIncrease && !validated.isLong) ? 'buy' : 'sell';

    return {
      id: validated.id,
      symbol,
      side,
      price: executionPrice,
      amount: Math.abs(sizeDeltaInTokens),
      cost: sizeDeltaUsd,
      timestamp: validated.timestamp * 1000,
      info: {
        marketAddress: validated.market,
        isLong: validated.isLong,
        orderType: validated.orderType,
        pnlUsd: validated.pnlUsd,
        priceImpactUsd: validated.priceImpactUsd,
        transactionHash: validated.transactionHash,
      },
    };
  }

  /**
   * Normalize funding rate
   */
  normalizeFundingRate(funding: GmxFundingRate, indexPrice: number): FundingRate {
    const validated = GmxFundingRateSchema.parse(funding);
    const marketKey = GMX_MARKET_ADDRESS_MAP[validated.market.toLowerCase()];
    const config = marketKey ? GMX_MARKETS[marketKey] : undefined;
    const symbol = config?.symbol || gmxToUnified(marketKey as GMXMarketKey);

    // GMX funding rate is per second, convert to hourly
    const fundingFactorPerSecond =
      parseFloat(validated.fundingFactorPerSecond) / GMX_PRECISION.FACTOR;
    const hourlyRate = fundingFactorPerSecond * 3600;

    // Adjust sign based on direction
    const fundingRate = validated.longsPayShorts ? hourlyRate : -hourlyRate;

    return {
      symbol,
      fundingRate,
      fundingTimestamp: validated.timestamp * 1000,
      nextFundingTimestamp: (validated.timestamp + 3600) * 1000, // Next hour (continuous)
      markPrice: indexPrice,
      indexPrice,
      fundingIntervalHours: 1,
      info: {
        marketAddress: validated.market,
        fundingFactorPerSecond: validated.fundingFactorPerSecond,
        longsPayShorts: validated.longsPayShorts,
        fundingFeeAmountPerSizeLong: validated.fundingFeeAmountPerSizeLong,
        fundingFeeAmountPerSizeShort: validated.fundingFeeAmountPerSizeShort,
      },
    };
  }

  /**
   * Normalize market info to ticker
   * Note: Price data requires separate fetch from tickers endpoint
   */
  normalizeTicker(
    market: GmxMarketInfo,
    priceData?: { minPrice: number; maxPrice: number }
  ): Ticker {
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
        _bidAskSource: 'calculated',
      },
    };
  }

  /**
   * Normalize candlestick tuple to OHLCV
   * Input: [timestamp_seconds, open, high, low, close]
   */
  normalizeCandle(candle: GmxCandleTuple): OHLCV {
    const validated = GmxCandleTupleSchema.parse(candle);
    return [
      (validated[0] ?? 0) * 1000,
      validated[1] ?? 0,
      validated[2] ?? 0,
      validated[3] ?? 0,
      validated[4] ?? 0,
      0, // GMX candlestick endpoint doesn't include volume
    ];
  }

  /**
   * Normalize candlesticks array
   */
  normalizeCandles(candles: GmxCandleTuple[]): OHLCV[] {
    return candles.map((c) => this.normalizeCandle(c));
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

    const pnlPercent =
      side === 'long'
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

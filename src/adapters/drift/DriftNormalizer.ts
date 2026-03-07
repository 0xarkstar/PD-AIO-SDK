/**
 * Drift Protocol Data Normalizer
 *
 * Transforms Drift on-chain account data and API responses
 * to unified SDK format.
 */

import type {
  Market,
  Order,
  Position,
  Trade,
  FundingRate,
  Balance,
  Ticker,
  OrderBook,
  OHLCV,
} from '../../types/common.js';
import type {
  DriftPerpPosition,
  DriftSpotPosition,
  DriftOrder,
  DriftPerpMarketAccount,
  DriftL2OrderBook,
  DriftTrade,
  DriftFundingRate,
  DriftFundingRateRecord,
  DriftMarketStats,
  DriftCandle,
} from './types.js';
import {
  DriftPerpPositionSchema,
  DriftSpotPositionSchema,
  DriftOrderSchema,
  DriftPerpMarketAccountSchema,
  DriftL2OrderBookSchema,
  DriftTradeSchema,
  DriftFundingRateSchema,
  DriftFundingRateRecordSchema,
  DriftMarketStatsSchema,
  DriftCandleSchema,
} from './types.js';
import {
  driftToUnified,
  unifiedToDrift,
  DRIFT_PERP_MARKETS,
  DRIFT_MARKET_INDEX_MAP,
  DRIFT_PRECISION,
} from './constants.js';

/**
 * Normalizer for Drift Protocol data
 */
export class DriftNormalizer {
  /**
   * Normalize perp market account to unified Market
   */
  normalizeMarket(market: DriftPerpMarketAccount): Market {
    const validated = DriftPerpMarketAccountSchema.parse(market);
    const marketKey = DRIFT_MARKET_INDEX_MAP[validated.marketIndex ?? 0];
    const config = marketKey
      ? DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS]
      : undefined;
    const symbol =
      config?.symbol || driftToUnified(marketKey || `MARKET-${validated.marketIndex ?? 0}`);

    // AMM might be any type due to schema flexibility, provide defaults
    const amm = validated.amm;
    const tickSize =
      config?.tickSize ||
      (amm?.orderTickSize ? parseFloat(amm.orderTickSize) / DRIFT_PRECISION.PRICE : 0.01);
    const stepSize =
      config?.stepSize ||
      (amm?.orderStepSize ? parseFloat(amm.orderStepSize) / DRIFT_PRECISION.BASE : 0.001);
    const minOrderSize =
      config?.minOrderSize ||
      (amm?.minOrderSize ? parseFloat(amm.minOrderSize) / DRIFT_PRECISION.BASE : 0.001);

    return {
      id: marketKey || `PERP-${validated.marketIndex ?? 0}`,
      symbol,
      base:
        config?.baseAsset || validated.name?.split('-')[0] || `ASSET${validated.marketIndex ?? 0}`,
      quote: 'USD',
      settle: 'USD',
      active: validated.status === 'active',
      minAmount: minOrderSize,
      maxAmount: amm?.maxPositionSize
        ? parseFloat(amm.maxPositionSize) / DRIFT_PRECISION.BASE
        : Number.MAX_SAFE_INTEGER,
      pricePrecision: this.getPrecisionFromTickSize(tickSize),
      amountPrecision: this.getPrecisionFromTickSize(stepSize),
      priceTickSize: tickSize,
      amountStepSize: stepSize,
      makerFee: -0.0002, // Drift rebates makers (-0.02%)
      takerFee: 0.001, // 0.1% taker fee (varies by tier)
      maxLeverage:
        config?.maxLeverage || Math.floor(DRIFT_PRECISION.MARGIN / validated.marginRatioInitial),
      fundingIntervalHours: 1,
      contractSize: 1,
      info: {
        marketIndex: validated.marketIndex,
        contractTier: config?.contractTier || validated.contractTier,
        marginRatioInitial: validated.marginRatioInitial / DRIFT_PRECISION.MARGIN,
        marginRatioMaintenance: validated.marginRatioMaintenance / DRIFT_PRECISION.MARGIN,
        imfFactor: validated.imfFactor,
        numberOfUsers: validated.numberOfUsers,
      },
    };
  }

  /**
   * Normalize multiple markets
   */
  normalizeMarkets(markets: DriftPerpMarketAccount[]): Market[] {
    return markets.map((m) => this.normalizeMarket(m));
  }

  /**
   * Normalize perp position to unified Position
   */
  normalizePosition(
    position: DriftPerpPosition,
    markPrice: number,
    _oraclePrice: number
  ): Position {
    const validated = DriftPerpPositionSchema.parse(position);
    const marketKey = DRIFT_MARKET_INDEX_MAP[validated.marketIndex];
    const config = marketKey
      ? DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS]
      : undefined;
    const symbol = config?.symbol || driftToUnified(marketKey || `MARKET-${validated.marketIndex}`);

    const baseAmount = parseFloat(validated.baseAssetAmount) / DRIFT_PRECISION.BASE;
    const quoteAmount = parseFloat(validated.quoteAssetAmount) / DRIFT_PRECISION.QUOTE;
    const quoteEntry = parseFloat(validated.quoteEntryAmount) / DRIFT_PRECISION.QUOTE;
    const settledPnl = parseFloat(validated.settledPnl) / DRIFT_PRECISION.QUOTE;

    const side: 'long' | 'short' = baseAmount >= 0 ? 'long' : 'short';
    const size = Math.abs(baseAmount);
    const entryPrice = size > 0 ? Math.abs(quoteEntry) / size : 0;
    const notional = size * markPrice;

    // Calculate unrealized PnL
    const unrealizedPnl = this.calculateUnrealizedPnl(side, size, entryPrice, markPrice);

    // Estimate margin and leverage
    const margin = Math.abs(quoteAmount);
    const leverage = margin > 0 ? notional / margin : 0;

    // Calculate liquidation price
    const maintenanceMargin = config?.maintenanceMarginRatio || 0.05;
    const liquidationPrice = this.calculateLiquidationPrice(
      side,
      entryPrice,
      leverage,
      maintenanceMargin
    );

    // Margin ratio (how close to liquidation, 100% = safe, 0% = liquidated)
    const marginRatio = this.calculateMarginRatio(
      side,
      entryPrice,
      markPrice,
      leverage,
      maintenanceMargin
    );

    return {
      symbol,
      side,
      size,
      entryPrice,
      markPrice,
      liquidationPrice,
      leverage,
      marginMode: 'cross', // Drift uses cross margin
      margin,
      maintenanceMargin: notional * maintenanceMargin,
      marginRatio,
      unrealizedPnl,
      realizedPnl: settledPnl,
      timestamp: Date.now(),
      info: {
        marketIndex: validated.marketIndex,
        baseAssetAmount: validated.baseAssetAmount,
        quoteAssetAmount: validated.quoteAssetAmount,
        lpShares: validated.lpShares,
        openOrders: validated.openOrders,
      },
    };
  }

  /**
   * Normalize order to unified Order
   */
  normalizeOrder(order: DriftOrder, marketPrice?: number): Order {
    const validated = DriftOrderSchema.parse(order);
    const marketKey = DRIFT_MARKET_INDEX_MAP[validated.marketIndex];
    const config = marketKey
      ? DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS]
      : undefined;
    const symbol = config?.symbol || driftToUnified(marketKey || `MARKET-${validated.marketIndex}`);

    const baseAmount = parseFloat(validated.baseAssetAmount) / DRIFT_PRECISION.BASE;
    const filledAmount = parseFloat(validated.baseAssetAmountFilled) / DRIFT_PRECISION.BASE;
    const price = parseFloat(validated.price) / DRIFT_PRECISION.PRICE;

    // Map order type
    let type: 'market' | 'limit' | 'stopMarket' | 'stopLimit' = 'limit';
    if (validated.orderType === 'market') type = 'market';
    else if (validated.orderType === 'triggerMarket') type = 'stopMarket';
    else if (validated.orderType === 'triggerLimit') type = 'stopLimit';

    // Map status
    let status:
      | 'open'
      | 'closed'
      | 'canceled'
      | 'expired'
      | 'filled'
      | 'partiallyFilled'
      | 'rejected' = 'open';
    if (validated.status === 'filled')
      status = filledAmount >= baseAmount ? 'filled' : 'partiallyFilled';
    else if (validated.status === 'canceled') status = 'canceled';
    else if (validated.status === 'expired') status = 'expired';

    return {
      id: validated.orderId.toString(),
      symbol,
      type,
      side: validated.direction === 'long' ? 'buy' : 'sell',
      amount: baseAmount,
      price: price > 0 ? price : marketPrice,
      stopPrice:
        validated.triggerPrice !== '0'
          ? parseFloat(validated.triggerPrice) / DRIFT_PRECISION.PRICE
          : undefined,
      status,
      filled: filledAmount,
      remaining: baseAmount - filledAmount,
      averagePrice:
        filledAmount > 0
          ? parseFloat(validated.quoteAssetAmountFilled) / DRIFT_PRECISION.QUOTE / filledAmount
          : undefined,
      reduceOnly: validated.reduceOnly,
      postOnly: validated.postOnly !== 'none',
      clientOrderId: validated.userOrderId > 0 ? validated.userOrderId.toString() : undefined,
      timestamp: validated.slot * 400, // Approximate ms from slot
      info: {
        orderId: validated.orderId,
        userOrderId: validated.userOrderId,
        marketIndex: validated.marketIndex,
        orderType: validated.orderType,
        auctionDuration: validated.auctionDuration,
        oraclePriceOffset: validated.oraclePriceOffset,
      },
    };
  }

  /**
   * Normalize L2 orderbook
   */
  normalizeOrderBook(orderbook: DriftL2OrderBook): OrderBook {
    const validated = DriftL2OrderBookSchema.parse(orderbook);
    const marketKey = DRIFT_MARKET_INDEX_MAP[validated.marketIndex];
    const config = marketKey
      ? DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS]
      : undefined;
    const symbol = config?.symbol || driftToUnified(marketKey || `MARKET-${validated.marketIndex}`);

    const bids: [number, number][] = validated.bids.map((b) => [
      parseFloat(b.price) / DRIFT_PRECISION.PRICE,
      parseFloat(b.size) / DRIFT_PRECISION.BASE,
    ]);

    const asks: [number, number][] = validated.asks.map((a) => [
      parseFloat(a.price) / DRIFT_PRECISION.PRICE,
      parseFloat(a.size) / DRIFT_PRECISION.BASE,
    ]);

    return {
      symbol,
      exchange: 'drift',
      bids,
      asks,
      timestamp: Date.now(),
      sequenceId: validated.slot,
    };
  }

  /**
   * Normalize trade
   */
  normalizeTrade(trade: DriftTrade): Trade {
    const validated = DriftTradeSchema.parse(trade);
    const marketKey = DRIFT_MARKET_INDEX_MAP[validated.marketIndex ?? 0];
    const config = marketKey
      ? DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS]
      : undefined;
    const symbol =
      config?.symbol || driftToUnified(marketKey || `MARKET-${validated.marketIndex ?? 0}`);

    const amount = parseFloat(validated.baseAssetAmount ?? '0') / DRIFT_PRECISION.BASE;
    const price = parseFloat(validated.fillPrice ?? '0') / DRIFT_PRECISION.PRICE;

    return {
      id: String(validated.fillRecordId ?? validated.recordId ?? ''),
      symbol,
      side: validated.takerOrderDirection === 'long' ? 'buy' : 'sell',
      price,
      amount,
      cost: amount * price,
      timestamp: (validated.ts ?? 0) * 1000,
      info: {
        recordId: validated.recordId,
        taker: validated.taker,
        maker: validated.maker,
        txSig: validated.txSig,
        slot: validated.slot,
      },
    };
  }

  /**
   * Normalize funding rate
   */
  normalizeFundingRate(
    funding: DriftFundingRate | DriftFundingRateRecord,
    oraclePrice?: number
  ): FundingRate {
    // Try both schemas since this accepts a union type
    const validated =
      'oraclePrice' in funding
        ? DriftFundingRateSchema.parse(funding)
        : DriftFundingRateRecordSchema.parse(funding);
    const marketKey = DRIFT_MARKET_INDEX_MAP[validated.marketIndex];
    const config = marketKey
      ? DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS]
      : undefined;
    const symbol = config?.symbol || driftToUnified(marketKey || `MARKET-${validated.marketIndex}`);

    // Data API returns pre-processed decimal values, SDK returns raw integers
    // Heuristic: if |value| < 1, it's already processed; if |value| > 1000, it's raw
    const rawFundingRate = parseFloat(validated.fundingRate);
    const fundingRate =
      Math.abs(rawFundingRate) > 1000
        ? rawFundingRate / DRIFT_PRECISION.FUNDING_RATE
        : rawFundingRate;

    const rawMarkPrice =
      'markPriceTwap' in validated && typeof validated.markPriceTwap === 'string'
        ? parseFloat(validated.markPriceTwap)
        : oraclePrice || 0;
    const markPrice =
      Math.abs(rawMarkPrice) > 1000 ? rawMarkPrice / DRIFT_PRECISION.PRICE : rawMarkPrice;

    // DriftFundingRate has oraclePrice, DriftFundingRateRecord has oraclePriceTwap
    const rawIndexPrice =
      'oraclePrice' in validated && typeof validated.oraclePrice === 'string'
        ? parseFloat(validated.oraclePrice)
        : 'oraclePriceTwap' in validated && typeof validated.oraclePriceTwap === 'string'
          ? parseFloat(validated.oraclePriceTwap)
          : 0;
    const indexPrice =
      Math.abs(rawIndexPrice) > 1000 ? rawIndexPrice / DRIFT_PRECISION.PRICE : rawIndexPrice;

    const ts = validated.ts * 1000;

    return {
      symbol,
      fundingRate,
      fundingTimestamp: ts,
      nextFundingTimestamp: ts + 3600000, // Next hour
      markPrice,
      indexPrice,
      fundingIntervalHours: 1,
      info: {
        marketIndex: validated.marketIndex,
        fundingRateLong: validated.fundingRateLong,
        fundingRateShort: validated.fundingRateShort,
        cumulativeFundingRateLong: validated.cumulativeFundingRateLong,
        cumulativeFundingRateShort: validated.cumulativeFundingRateShort,
      },
    };
  }

  /**
   * Normalize ticker from market stats
   */
  normalizeTicker(stats: DriftMarketStats): Ticker {
    const validated = DriftMarketStatsSchema.parse(stats);
    const marketKey = DRIFT_MARKET_INDEX_MAP[validated.marketIndex];
    const config = marketKey
      ? DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS]
      : undefined;
    const symbol = config?.symbol || driftToUnified(marketKey || `MARKET-${validated.marketIndex}`);

    const markPrice = parseFloat(validated.markPrice) / DRIFT_PRECISION.PRICE;
    const oraclePrice = parseFloat(validated.oraclePrice) / DRIFT_PRECISION.PRICE;
    const bidPrice = parseFloat(validated.bidPrice) / DRIFT_PRECISION.PRICE;
    const askPrice = parseFloat(validated.askPrice) / DRIFT_PRECISION.PRICE;
    const volume = parseFloat(validated.volume24h) / DRIFT_PRECISION.QUOTE;

    return {
      symbol,
      timestamp: validated.ts * 1000,
      last: markPrice,
      bid: bidPrice,
      ask: askPrice,
      high: markPrice, // Would need historical data
      low: markPrice,
      open: oraclePrice,
      close: markPrice,
      change: markPrice - oraclePrice,
      percentage: oraclePrice > 0 ? ((markPrice - oraclePrice) / oraclePrice) * 100 : 0,
      baseVolume: volume / markPrice,
      quoteVolume: volume,
      info: {
        marketIndex: validated.marketIndex,
        oraclePrice,
        openInterest: parseFloat(validated.openInterest) / DRIFT_PRECISION.BASE,
        openInterestLong: parseFloat(validated.openInterestLong) / DRIFT_PRECISION.BASE,
        openInterestShort: parseFloat(validated.openInterestShort) / DRIFT_PRECISION.BASE,
        fundingRate: parseFloat(validated.fundingRate) / DRIFT_PRECISION.FUNDING_RATE,
        nextFundingTs: validated.nextFundingTs,
        _bidAskSource: 'orderbook',
      },
    };
  }

  /**
   * Normalize balance from spot position
   */
  normalizeBalance(position: DriftSpotPosition, tokenPrice: number, tokenSymbol: string): Balance {
    const validated = DriftSpotPositionSchema.parse(position);
    const scaledBalance = parseFloat(validated.scaledBalance);
    const isDeposit = validated.balanceType === 'deposit';

    // For deposits, positive balance; for borrows, negative
    const total = isDeposit ? scaledBalance : -scaledBalance;

    return {
      currency: tokenSymbol,
      total,
      free: isDeposit ? total : 0,
      used: isDeposit ? 0 : Math.abs(total),
      usdValue: total * tokenPrice,
      info: {
        marketIndex: validated.marketIndex,
        balanceType: validated.balanceType,
        cumulativeDeposits: validated.cumulativeDeposits,
      },
    };
  }

  /**
   * Normalize candle to OHLCV
   */
  normalizeCandle(candle: DriftCandle): OHLCV {
    const validated = DriftCandleSchema.parse(candle);
    return [
      validated.start * 1000,
      parseFloat(validated.open) / DRIFT_PRECISION.PRICE,
      parseFloat(validated.high) / DRIFT_PRECISION.PRICE,
      parseFloat(validated.low) / DRIFT_PRECISION.PRICE,
      parseFloat(validated.close) / DRIFT_PRECISION.PRICE,
      parseFloat(validated.volume) / DRIFT_PRECISION.QUOTE,
    ];
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

    // Return as percentage above maintenance margin
    return Math.max(0, ((currentMargin - maintenanceMargin) / marginUsed) * 100);
  }

  /**
   * Get precision from tick size
   */
  private getPrecisionFromTickSize(tickSize: number): number {
    if (tickSize >= 1) return 0;
    return Math.max(0, -Math.floor(Math.log10(tickSize)));
  }

  normalizeSymbol(exchangeSymbol: string): string {
    return driftToUnified(exchangeSymbol);
  }

  toExchangeSymbol(symbol: string): string {
    return unifiedToDrift(symbol);
  }
}

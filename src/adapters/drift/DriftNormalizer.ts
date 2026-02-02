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
  DriftNormalizedPosition,
  DriftNormalizedOrder,
} from './types.js';
import {
  driftToUnified,
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
    const marketKey = DRIFT_MARKET_INDEX_MAP[market.marketIndex];
    const config = marketKey ? DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS] : undefined;
    const symbol = config?.symbol || driftToUnified(marketKey || `MARKET-${market.marketIndex}`);

    const tickSize = config?.tickSize || parseFloat(market.amm.orderTickSize) / DRIFT_PRECISION.PRICE;
    const stepSize = config?.stepSize || parseFloat(market.amm.orderStepSize) / DRIFT_PRECISION.BASE;
    const minOrderSize = config?.minOrderSize || parseFloat(market.amm.minOrderSize) / DRIFT_PRECISION.BASE;

    return {
      id: marketKey || `PERP-${market.marketIndex}`,
      symbol,
      base: config?.baseAsset || market.name?.split('-')[0] || `ASSET${market.marketIndex}`,
      quote: 'USD',
      settle: 'USD',
      active: market.status === 'active',
      minAmount: minOrderSize,
      maxAmount: parseFloat(market.amm.maxPositionSize) / DRIFT_PRECISION.BASE,
      pricePrecision: this.getPrecisionFromTickSize(tickSize),
      amountPrecision: this.getPrecisionFromTickSize(stepSize),
      priceTickSize: tickSize,
      amountStepSize: stepSize,
      makerFee: -0.0002, // Drift rebates makers (-0.02%)
      takerFee: 0.001, // 0.1% taker fee (varies by tier)
      maxLeverage: config?.maxLeverage || Math.floor(DRIFT_PRECISION.MARGIN / market.marginRatioInitial),
      fundingIntervalHours: 1,
      contractSize: 1,
      info: {
        marketIndex: market.marketIndex,
        contractTier: config?.contractTier || market.contractTier,
        marginRatioInitial: market.marginRatioInitial / DRIFT_PRECISION.MARGIN,
        marginRatioMaintenance: market.marginRatioMaintenance / DRIFT_PRECISION.MARGIN,
        imfFactor: market.imfFactor,
        numberOfUsers: market.numberOfUsers,
      },
    };
  }

  /**
   * Normalize multiple markets
   */
  normalizeMarkets(markets: DriftPerpMarketAccount[]): Market[] {
    return markets.map(m => this.normalizeMarket(m));
  }

  /**
   * Normalize perp position to unified Position
   */
  normalizePosition(
    position: DriftPerpPosition,
    markPrice: number,
    oraclePrice: number
  ): Position {
    const marketKey = DRIFT_MARKET_INDEX_MAP[position.marketIndex];
    const config = marketKey ? DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS] : undefined;
    const symbol = config?.symbol || driftToUnified(marketKey || `MARKET-${position.marketIndex}`);

    const baseAmount = parseFloat(position.baseAssetAmount) / DRIFT_PRECISION.BASE;
    const quoteAmount = parseFloat(position.quoteAssetAmount) / DRIFT_PRECISION.QUOTE;
    const quoteEntry = parseFloat(position.quoteEntryAmount) / DRIFT_PRECISION.QUOTE;
    const settledPnl = parseFloat(position.settledPnl) / DRIFT_PRECISION.QUOTE;

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
    const marginRatio = this.calculateMarginRatio(side, entryPrice, markPrice, leverage, maintenanceMargin);

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
        marketIndex: position.marketIndex,
        baseAssetAmount: position.baseAssetAmount,
        quoteAssetAmount: position.quoteAssetAmount,
        lpShares: position.lpShares,
        openOrders: position.openOrders,
      },
    };
  }

  /**
   * Normalize order to unified Order
   */
  normalizeOrder(order: DriftOrder, marketPrice?: number): Order {
    const marketKey = DRIFT_MARKET_INDEX_MAP[order.marketIndex];
    const config = marketKey ? DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS] : undefined;
    const symbol = config?.symbol || driftToUnified(marketKey || `MARKET-${order.marketIndex}`);

    const baseAmount = parseFloat(order.baseAssetAmount) / DRIFT_PRECISION.BASE;
    const filledAmount = parseFloat(order.baseAssetAmountFilled) / DRIFT_PRECISION.BASE;
    const price = parseFloat(order.price) / DRIFT_PRECISION.PRICE;

    // Map order type
    let type: 'market' | 'limit' | 'stopMarket' | 'stopLimit' = 'limit';
    if (order.orderType === 'market') type = 'market';
    else if (order.orderType === 'triggerMarket') type = 'stopMarket';
    else if (order.orderType === 'triggerLimit') type = 'stopLimit';

    // Map status
    let status: 'open' | 'closed' | 'canceled' | 'expired' | 'filled' | 'partiallyFilled' | 'rejected' = 'open';
    if (order.status === 'filled') status = filledAmount >= baseAmount ? 'filled' : 'partiallyFilled';
    else if (order.status === 'canceled') status = 'canceled';
    else if (order.status === 'expired') status = 'expired';

    return {
      id: order.orderId.toString(),
      symbol,
      type,
      side: order.direction === 'long' ? 'buy' : 'sell',
      amount: baseAmount,
      price: price > 0 ? price : marketPrice,
      stopPrice: order.triggerPrice !== '0' ? parseFloat(order.triggerPrice) / DRIFT_PRECISION.PRICE : undefined,
      status,
      filled: filledAmount,
      remaining: baseAmount - filledAmount,
      averagePrice: filledAmount > 0
        ? parseFloat(order.quoteAssetAmountFilled) / DRIFT_PRECISION.QUOTE / filledAmount
        : undefined,
      reduceOnly: order.reduceOnly,
      postOnly: order.postOnly !== 'none',
      clientOrderId: order.userOrderId > 0 ? order.userOrderId.toString() : undefined,
      timestamp: order.slot * 400, // Approximate ms from slot
      info: {
        orderId: order.orderId,
        userOrderId: order.userOrderId,
        marketIndex: order.marketIndex,
        orderType: order.orderType,
        auctionDuration: order.auctionDuration,
        oraclePriceOffset: order.oraclePriceOffset,
      },
    };
  }

  /**
   * Normalize L2 orderbook
   */
  normalizeOrderBook(orderbook: DriftL2OrderBook): OrderBook {
    const marketKey = DRIFT_MARKET_INDEX_MAP[orderbook.marketIndex];
    const config = marketKey ? DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS] : undefined;
    const symbol = config?.symbol || driftToUnified(marketKey || `MARKET-${orderbook.marketIndex}`);

    const bids: [number, number][] = orderbook.bids.map(b => [
      parseFloat(b.price) / DRIFT_PRECISION.PRICE,
      parseFloat(b.size) / DRIFT_PRECISION.BASE,
    ]);

    const asks: [number, number][] = orderbook.asks.map(a => [
      parseFloat(a.price) / DRIFT_PRECISION.PRICE,
      parseFloat(a.size) / DRIFT_PRECISION.BASE,
    ]);

    return {
      symbol,
      exchange: 'drift',
      bids,
      asks,
      timestamp: Date.now(),
      sequenceId: orderbook.slot,
    };
  }

  /**
   * Normalize trade
   */
  normalizeTrade(trade: DriftTrade): Trade {
    const marketKey = DRIFT_MARKET_INDEX_MAP[trade.marketIndex];
    const config = marketKey ? DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS] : undefined;
    const symbol = config?.symbol || driftToUnified(marketKey || `MARKET-${trade.marketIndex}`);

    const amount = parseFloat(trade.baseAssetAmount) / DRIFT_PRECISION.BASE;
    const price = parseFloat(trade.fillPrice) / DRIFT_PRECISION.PRICE;

    return {
      id: trade.fillRecordId,
      symbol,
      side: trade.takerOrderDirection === 'long' ? 'buy' : 'sell',
      price,
      amount,
      cost: amount * price,
      timestamp: trade.ts * 1000,
      info: {
        recordId: trade.recordId,
        taker: trade.taker,
        maker: trade.maker,
        txSig: trade.txSig,
        slot: trade.slot,
      },
    };
  }

  /**
   * Normalize funding rate
   */
  normalizeFundingRate(funding: DriftFundingRate | DriftFundingRateRecord, oraclePrice?: number): FundingRate {
    const marketKey = DRIFT_MARKET_INDEX_MAP[funding.marketIndex];
    const config = marketKey ? DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS] : undefined;
    const symbol = config?.symbol || driftToUnified(marketKey || `MARKET-${funding.marketIndex}`);

    const fundingRate = parseFloat(funding.fundingRate) / DRIFT_PRECISION.FUNDING_RATE;
    const markPrice = 'markPriceTwap' in funding
      ? parseFloat(funding.markPriceTwap) / DRIFT_PRECISION.PRICE
      : (oraclePrice || 0);
    // DriftFundingRate has oraclePrice, DriftFundingRateRecord has oraclePriceTwap
    const indexPrice = 'oraclePrice' in funding
      ? parseFloat(funding.oraclePrice) / DRIFT_PRECISION.PRICE
      : parseFloat((funding as DriftFundingRateRecord).oraclePriceTwap) / DRIFT_PRECISION.PRICE;

    const ts = funding.ts * 1000;

    return {
      symbol,
      fundingRate,
      fundingTimestamp: ts,
      nextFundingTimestamp: ts + 3600000, // Next hour
      markPrice,
      indexPrice,
      fundingIntervalHours: 1,
      info: {
        marketIndex: funding.marketIndex,
        fundingRateLong: funding.fundingRateLong,
        fundingRateShort: funding.fundingRateShort,
        cumulativeFundingRateLong: funding.cumulativeFundingRateLong,
        cumulativeFundingRateShort: funding.cumulativeFundingRateShort,
      },
    };
  }

  /**
   * Normalize ticker from market stats
   */
  normalizeTicker(stats: DriftMarketStats): Ticker {
    const marketKey = DRIFT_MARKET_INDEX_MAP[stats.marketIndex];
    const config = marketKey ? DRIFT_PERP_MARKETS[marketKey as keyof typeof DRIFT_PERP_MARKETS] : undefined;
    const symbol = config?.symbol || driftToUnified(marketKey || `MARKET-${stats.marketIndex}`);

    const markPrice = parseFloat(stats.markPrice) / DRIFT_PRECISION.PRICE;
    const oraclePrice = parseFloat(stats.oraclePrice) / DRIFT_PRECISION.PRICE;
    const bidPrice = parseFloat(stats.bidPrice) / DRIFT_PRECISION.PRICE;
    const askPrice = parseFloat(stats.askPrice) / DRIFT_PRECISION.PRICE;
    const volume = parseFloat(stats.volume24h) / DRIFT_PRECISION.QUOTE;

    return {
      symbol,
      timestamp: stats.ts * 1000,
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
        marketIndex: stats.marketIndex,
        oraclePrice,
        openInterest: parseFloat(stats.openInterest) / DRIFT_PRECISION.BASE,
        openInterestLong: parseFloat(stats.openInterestLong) / DRIFT_PRECISION.BASE,
        openInterestShort: parseFloat(stats.openInterestShort) / DRIFT_PRECISION.BASE,
        fundingRate: parseFloat(stats.fundingRate) / DRIFT_PRECISION.FUNDING_RATE,
        nextFundingTs: stats.nextFundingTs,
      },
    };
  }

  /**
   * Normalize balance from spot position
   */
  normalizeBalance(
    position: DriftSpotPosition,
    tokenPrice: number,
    tokenSymbol: string
  ): Balance {
    const scaledBalance = parseFloat(position.scaledBalance);
    const isDeposit = position.balanceType === 'deposit';

    // For deposits, positive balance; for borrows, negative
    const total = isDeposit ? scaledBalance : -scaledBalance;

    return {
      currency: tokenSymbol,
      total,
      free: isDeposit ? total : 0,
      used: isDeposit ? 0 : Math.abs(total),
      usdValue: total * tokenPrice,
      info: {
        marketIndex: position.marketIndex,
        balanceType: position.balanceType,
        cumulativeDeposits: position.cumulativeDeposits,
      },
    };
  }

  /**
   * Normalize candle to OHLCV
   */
  normalizeCandle(candle: DriftCandle): OHLCV {
    return [
      candle.start * 1000,
      parseFloat(candle.open) / DRIFT_PRECISION.PRICE,
      parseFloat(candle.high) / DRIFT_PRECISION.PRICE,
      parseFloat(candle.low) / DRIFT_PRECISION.PRICE,
      parseFloat(candle.close) / DRIFT_PRECISION.PRICE,
      parseFloat(candle.volume) / DRIFT_PRECISION.QUOTE,
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

    const pnlPercent = side === 'long'
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
}

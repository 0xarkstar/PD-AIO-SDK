/**
 * Hyperliquid Data Normalizer
 *
 * Transforms Hyperliquid API responses to unified SDK format.
 * Hyperliquid uses EIP-712 signing and a unique perpetual trading model.
 *
 * @see https://hyperliquid.gitbook.io
 */

import type {
  Market,
  Order,
  Position,
  Balance,
  OrderBook,
  Trade,
  Ticker,
  FundingRate,
} from '../../types/common.js';
import {
  HYPERLIQUID_DEFAULT_PRECISION,
  HYPERLIQUID_FUNDING_INTERVAL_HOURS,
  hyperliquidToUnified,
} from './constants.js';
import type {
  HyperliquidAsset,
  HyperliquidOpenOrder,
  HyperliquidPosition,
  HyperliquidL2Book,
  HyperliquidWsTrade,
  HyperliquidFill,
  HyperliquidUserFill,
  HyperliquidHistoricalOrder,
  HyperliquidFundingRate,
  HyperliquidUserState,
} from './types.js';

/**
 * Hyperliquid Data Normalizer
 *
 * Provides data transformation between Hyperliquid and unified formats with:
 * - Symbol format conversions (BASE-PERP ↔ BASE/USDT:USDT)
 * - Numeric string parsing
 * - Status mapping
 * - Position side detection
 *
 * @example
 * ```typescript
 * const normalizer = new HyperliquidNormalizer();
 *
 * // Single entity
 * const market = normalizer.normalizeMarket(hlAsset, 0);
 *
 * // Batch processing
 * const markets = normalizer.normalizeMarkets(hlAssets);
 *
 * // Symbol conversion
 * const unified = normalizer.symbolToCCXT('BTC-PERP'); // "BTC/USDT:USDT"
 * ```
 */
export class HyperliquidNormalizer {
  // ===========================================================================
  // Symbol Conversion
  // ===========================================================================

  /**
   * Convert Hyperliquid symbol to CCXT format
   *
   * @param hyperliquidSymbol - Hyperliquid symbol (e.g., "BTC-PERP", "ETH-PERP")
   * @returns CCXT formatted symbol (e.g., "BTC/USDT:USDT")
   *
   * @example
   * ```typescript
   * normalizer.symbolToCCXT('BTC-PERP');  // "BTC/USDT:USDT"
   * normalizer.symbolToCCXT('ETH-PERP');  // "ETH/USDT:USDT"
   * ```
   */
  symbolToCCXT(hyperliquidSymbol: string): string {
    return hyperliquidToUnified(hyperliquidSymbol);
  }

  /**
   * Convert CCXT symbol to Hyperliquid format
   *
   * @param ccxtSymbol - CCXT symbol (e.g., "BTC/USDT:USDT")
   * @returns Hyperliquid formatted symbol (e.g., "BTC-PERP")
   *
   * @example
   * ```typescript
   * normalizer.symbolFromCCXT('BTC/USDT:USDT'); // "BTC-PERP"
   * normalizer.symbolFromCCXT('ETH/USDT:USDT'); // "ETH-PERP"
   * ```
   */
  symbolFromCCXT(ccxtSymbol: string): string {
    const [base] = ccxtSymbol.split('/');
    return `${base}-PERP`;
  }

  // ===========================================================================
  // Order Normalization
  // ===========================================================================

  /**
   * Normalize Hyperliquid open order to unified format
   *
   * @param order - Hyperliquid open order
   * @param symbol - Exchange symbol (for reference)
   * @returns Unified order
   */
  normalizeOrder(order: HyperliquidOpenOrder, symbol: string): Order {
    const unifiedSymbol = hyperliquidToUnified(order.coin);
    const isBuy = order.side === 'B';

    return {
      id: order.oid.toString(),
      symbol: unifiedSymbol,
      type: 'limit', // Hyperliquid open orders are always limit orders
      side: isBuy ? 'buy' : 'sell',
      amount: parseFloat(order.origSz),
      price: parseFloat(order.limitPx),
      status: 'open',
      filled: parseFloat(order.origSz) - parseFloat(order.sz),
      remaining: parseFloat(order.sz),
      reduceOnly: false,
      postOnly: false,
      clientOrderId: order.cloid,
      timestamp: order.timestamp,
    };
  }

  /**
   * Normalize multiple orders
   *
   * @param orders - Array of Hyperliquid orders
   * @param symbol - Exchange symbol
   * @returns Array of unified orders
   */
  normalizeOrders(orders: HyperliquidOpenOrder[], symbol: string): Order[] {
    return orders.map((order) => this.normalizeOrder(order, symbol));
  }

  /**
   * Normalize Hyperliquid historical order to unified format
   *
   * @param historicalOrder - Hyperliquid historical order
   * @returns Unified order
   */
  normalizeHistoricalOrder(historicalOrder: HyperliquidHistoricalOrder): Order {
    const order = historicalOrder.order;
    const unifiedSymbol = hyperliquidToUnified(order.coin);
    const isBuy = order.side === 'B';
    const origSize = parseFloat(order.origSz);
    const currentSize = parseFloat(order.sz);

    // Map Hyperliquid status to unified status
    let status: Order['status'];
    switch (historicalOrder.status) {
      case 'filled':
        status = 'filled';
        break;
      case 'canceled':
        status = 'canceled';
        break;
      case 'rejected':
        status = 'rejected';
        break;
      case 'open':
        status = 'open';
        break;
      default:
        status = 'open';
    }

    return {
      id: order.oid.toString(),
      symbol: unifiedSymbol,
      type: 'limit', // Historical orders are typically limits
      side: isBuy ? 'buy' : 'sell',
      amount: origSize,
      price: parseFloat(order.limitPx),
      status,
      filled: origSize - currentSize,
      remaining: currentSize,
      reduceOnly: false,
      postOnly: false,
      clientOrderId: order.cloid,
      timestamp: order.timestamp,
      lastUpdateTimestamp: historicalOrder.statusTimestamp,
      info: {
        orderType: order.orderType,
      },
    };
  }

  // ===========================================================================
  // Position Normalization
  // ===========================================================================

  /**
   * Normalize Hyperliquid position to unified format
   *
   * @param hlPosition - Hyperliquid position
   * @returns Unified position
   */
  normalizePosition(hlPosition: HyperliquidPosition): Position {
    const pos = hlPosition.position;
    const unifiedSymbol = hyperliquidToUnified(pos.coin);
    const size = Math.abs(parseFloat(pos.szi));
    const isLong = parseFloat(pos.szi) > 0;

    return {
      symbol: unifiedSymbol,
      side: isLong ? 'long' : 'short',
      size,
      entryPrice: parseFloat(pos.entryPx),
      markPrice: 0, // Need to fetch separately
      liquidationPrice: pos.liquidationPx ? parseFloat(pos.liquidationPx) : 0,
      unrealizedPnl: parseFloat(pos.unrealizedPnl),
      realizedPnl: 0, // Not provided in position data
      leverage: pos.leverage.value,
      marginMode: pos.leverage.type,
      margin: parseFloat(pos.marginUsed),
      maintenanceMargin: 0, // Not directly provided
      marginRatio: 0, // Calculate if needed
      timestamp: Date.now(),
    };
  }

  /**
   * Normalize multiple positions
   *
   * @param positions - Array of Hyperliquid positions
   * @returns Array of unified positions
   */
  normalizePositions(positions: HyperliquidPosition[]): Position[] {
    return positions.map((pos) => this.normalizePosition(pos));
  }

  // ===========================================================================
  // Market Normalization
  // ===========================================================================

  /**
   * Normalize Hyperliquid asset to unified market format
   *
   * @param asset - Hyperliquid asset
   * @param index - Market index
   * @returns Unified market
   */
  normalizeMarket(asset: HyperliquidAsset, index: number): Market {
    const unifiedSymbol = hyperliquidToUnified(asset.name);
    const [base = '', rest = ''] = unifiedSymbol.split('/');
    const [quote = '', settle = ''] = rest.split(':');

    return {
      id: index.toString(),
      symbol: unifiedSymbol,
      base,
      quote,
      settle,
      active: true,
      minAmount: Math.pow(10, -asset.szDecimals),
      pricePrecision: HYPERLIQUID_DEFAULT_PRECISION.price,
      amountPrecision: asset.szDecimals,
      priceTickSize: Math.pow(10, -HYPERLIQUID_DEFAULT_PRECISION.price),
      amountStepSize: Math.pow(10, -asset.szDecimals),
      makerFee: 0.0002, // 0.02%
      takerFee: 0.0005, // 0.05%
      maxLeverage: asset.maxLeverage,
      fundingIntervalHours: HYPERLIQUID_FUNDING_INTERVAL_HOURS,
      info: {
        onlyIsolated: asset.onlyIsolated,
      },
    };
  }

  /**
   * Normalize multiple markets
   *
   * @param assets - Array of Hyperliquid assets
   * @returns Array of unified markets
   */
  normalizeMarkets(assets: HyperliquidAsset[]): Market[] {
    return assets.map((asset, index) => this.normalizeMarket(asset, index));
  }

  // ===========================================================================
  // Order Book Normalization
  // ===========================================================================

  /**
   * Normalize Hyperliquid L2 order book to unified format
   *
   * @param book - Hyperliquid L2 book
   * @returns Unified order book
   */
  normalizeOrderBook(book: HyperliquidL2Book): OrderBook {
    const unifiedSymbol = hyperliquidToUnified(book.coin);

    const bids = book.levels[0]?.map(([price, size]) => [
      parseFloat(price),
      parseFloat(size),
    ]) as [number, number][] || [];

    const asks = book.levels[1]?.map(([price, size]) => [
      parseFloat(price),
      parseFloat(size),
    ]) as [number, number][] || [];

    return {
      symbol: unifiedSymbol,
      timestamp: book.time,
      bids,
      asks,
      exchange: 'hyperliquid',
    };
  }

  // ===========================================================================
  // Trade Normalization
  // ===========================================================================

  /**
   * Normalize Hyperliquid WebSocket trade to unified format
   *
   * @param trade - Hyperliquid WS trade
   * @returns Unified trade
   */
  normalizeTrade(trade: HyperliquidWsTrade): Trade {
    const unifiedSymbol = hyperliquidToUnified(trade.coin);
    const price = parseFloat(trade.px);
    const amount = parseFloat(trade.sz);

    return {
      id: trade.hash,
      symbol: unifiedSymbol,
      side: trade.side === 'B' ? 'buy' : 'sell',
      price,
      amount,
      cost: price * amount,
      timestamp: trade.time,
    };
  }

  /**
   * Normalize Hyperliquid fill to unified trade format
   *
   * @param fill - Hyperliquid fill
   * @returns Unified trade
   */
  normalizeFill(fill: HyperliquidFill): Trade {
    const unifiedSymbol = hyperliquidToUnified(fill.coin);
    const price = parseFloat(fill.px);
    const amount = parseFloat(fill.sz);

    return {
      id: fill.hash,
      symbol: unifiedSymbol,
      side: fill.side === 'B' ? 'buy' : 'sell',
      price,
      amount,
      cost: price * amount,
      timestamp: fill.time,
      info: {
        fee: fill.fee,
        closedPnl: fill.closedPnl,
        tid: fill.tid,
      },
    };
  }

  /**
   * Normalize Hyperliquid user fill to unified trade format
   *
   * @param fill - Hyperliquid user fill
   * @returns Unified trade
   */
  normalizeUserFill(fill: HyperliquidUserFill): Trade {
    // User fills have the same structure as regular fills, plus cloid
    return this.normalizeFill(fill as HyperliquidFill);
  }

  /**
   * Normalize multiple trades
   *
   * @param trades - Array of Hyperliquid trades
   * @returns Array of unified trades
   */
  normalizeTrades(trades: HyperliquidWsTrade[]): Trade[] {
    return trades.map((trade) => this.normalizeTrade(trade));
  }

  // ===========================================================================
  // Funding Rate Normalization
  // ===========================================================================

  /**
   * Normalize Hyperliquid funding rate to unified format
   *
   * @param fundingData - Hyperliquid funding rate
   * @param markPrice - Current mark price
   * @returns Unified funding rate
   */
  normalizeFundingRate(fundingData: HyperliquidFundingRate, markPrice: number): FundingRate {
    const unifiedSymbol = hyperliquidToUnified(fundingData.coin);

    return {
      symbol: unifiedSymbol,
      fundingRate: parseFloat(fundingData.fundingRate),
      fundingTimestamp: fundingData.time,
      nextFundingTimestamp: fundingData.time + HYPERLIQUID_FUNDING_INTERVAL_HOURS * 3600 * 1000,
      markPrice,
      indexPrice: markPrice, // Hyperliquid doesn't separate index price
      fundingIntervalHours: HYPERLIQUID_FUNDING_INTERVAL_HOURS,
    };
  }

  // ===========================================================================
  // Balance Normalization
  // ===========================================================================

  /**
   * Normalize Hyperliquid user state to unified balance format
   *
   * @param userState - Hyperliquid user state
   * @returns Array of unified balances
   */
  normalizeBalance(userState: HyperliquidUserState): Balance[] {
    const accountValue = parseFloat(userState.marginSummary.accountValue);
    const totalMarginUsed = parseFloat(userState.marginSummary.totalMarginUsed);
    const withdrawable = parseFloat(userState.withdrawable);

    return [
      {
        currency: 'USDT',
        total: accountValue,
        free: withdrawable,
        used: totalMarginUsed,
        usdValue: accountValue,
      },
    ];
  }

  // ===========================================================================
  // Ticker Normalization
  // ===========================================================================

  /**
   * Normalize ticker data
   *
   * @param coin - Hyperliquid coin symbol
   * @param data - Ticker data with mid price
   * @returns Unified ticker
   */
  normalizeTicker(coin: string, data: { mid: string; [key: string]: unknown }): Ticker {
    const unifiedSymbol = hyperliquidToUnified(coin);
    const mid = parseFloat(data.mid);

    return {
      symbol: unifiedSymbol,
      last: mid,
      bid: mid,
      ask: mid,
      high: mid,
      low: mid,
      open: mid,
      close: mid,
      change: 0,
      percentage: 0,
      baseVolume: 0,
      quoteVolume: 0,
      timestamp: Date.now(),
    };
  }
}

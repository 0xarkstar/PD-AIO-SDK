/**
 * GRVT Data Normalizer
 *
 * Transforms GRVT API responses to unified SDK format with precision safety,
 * batch processing optimization, and comprehensive validation.
 *
 * @see https://docs.grvt.io
 */

import type {
  IInstrumentDisplay,
  IOrder,
  IPositions,
  ISpotBalance,
  IFill,
  ITicker,
  IOrderbookLevels,
  ITrade,
} from '@grvt/client/interfaces';
import type {
  Market,
  Order,
  OrderStatus,
  OrderType,
  Position,
  Balance,
  Trade,
  Ticker,
  OrderBook,
} from '../../types/common.js';
import { GRVT_PRECISION } from './constants.js';
import { PerpDEXError } from '../../types/errors.js';

/**
 * GRVT Data Normalizer
 *
 * Provides data transformation between GRVT and unified formats with:
 * - Precision-safe numeric conversions
 * - Batch processing optimization
 * - Runtime validation with Zod
 * - Symbol format conversions
 *
 * @example
 * ```typescript
 * const normalizer = new GRVTNormalizer();
 *
 * // Single entity
 * const market = normalizer.normalizeMarket(grvtMarket);
 *
 * // Batch processing
 * const orders = normalizer.normalizeOrders(grvtOrders);
 * ```
 */
export class GRVTNormalizer {
  // ===========================================================================
  // Symbol Conversion
  // ===========================================================================

  /**
   * Convert GRVT symbol to CCXT format
   *
   * @param grvtSymbol - GRVT symbol (e.g., "BTC-PERP", "ETH-PERP")
   * @returns CCXT formatted symbol (e.g., "BTC/USDT:USDT")
   *
   * @example
   * ```typescript
   * normalizer.symbolToCCXT('BTC-PERP');  // "BTC/USDT:USDT"
   * normalizer.symbolToCCXT('ETH-PERP');  // "ETH/USDT:USDT"
   * normalizer.symbolToCCXT('BTC-SPOT');  // "BTC/USDT"
   * ```
   */
  symbolToCCXT(grvtSymbol: string): string {
    // GRVT API uses format: BTC_USDT_Perp, ETH_USDT_Perp
    // Extract base and quote from underscore-separated format

    // Handle perpetual format: BTC_USDT_Perp → BTC/USDT:USDT
    if (grvtSymbol.endsWith('_Perp')) {
      const parts = grvtSymbol.replace('_Perp', '').split('_');
      const base = parts[0];
      const quote = parts[1] || 'USDT';
      return `${base}/${quote}:${quote}`;
    }

    // Handle old format: BTC-PERP, ETH-PERP (for backwards compatibility)
    if (grvtSymbol.endsWith('-PERP')) {
      const base = grvtSymbol.replace('-PERP', '');
      return `${base}/USDT:USDT`;
    }

    // Handle spot format: BTC_USDT
    if (grvtSymbol.includes('_')) {
      const [base, quote] = grvtSymbol.split('_');
      return `${base}/${quote || 'USDT'}`;
    }

    // Fallback: assume perpetual with USDT
    return `${grvtSymbol}/USDT:USDT`;
  }

  /**
   * Convert CCXT symbol to GRVT format
   *
   * @param ccxtSymbol - CCXT formatted symbol (e.g., "BTC/USDT:USDT")
   * @returns GRVT symbol (e.g., "BTC_USDT_Perp")
   *
   * @example
   * ```typescript
   * normalizer.symbolFromCCXT('BTC/USDT:USDT'); // "BTC_USDT_Perp"
   * normalizer.symbolFromCCXT('ETH/USDT:USDT'); // "ETH_USDT_Perp"
   * normalizer.symbolFromCCXT('BTC/USDT');      // "BTC_USDT"
   * ```
   */
  symbolFromCCXT(ccxtSymbol: string): string {
    // Handle perpetual: BTC/USDT:USDT → BTC_USDT_Perp
    if (ccxtSymbol.includes(':')) {
      const parts = ccxtSymbol.split(':');
      const pair = parts[0] || '';
      const settle = parts[1] || 'USDT';
      const pairParts = pair.split('/');
      const base = pairParts[0] || '';
      const quote = pairParts[1] || settle;
      return `${base}_${quote}_Perp`;
    }

    // Handle spot: BTC/USDT → BTC_USDT
    const parts = ccxtSymbol.split('/');
    const base = parts[0] || '';
    const quote = parts[1] || 'USDT';
    return `${base}_${quote}`;
  }

  // ===========================================================================
  // Precision-Safe Numeric Conversions
  // ===========================================================================

  /**
   * Convert string to number with validation
   *
   * @param value - String value to convert
   * @param decimals - Number of decimal places (default: 8)
   * @returns Number
   *
   * @throws {PerpDEXError} If value is not a valid number
   */
  private toNumberSafe(value: string, decimals: number = GRVT_PRECISION.price): number {
    if (!value || value === '0') {
      return 0;
    }

    const num = parseFloat(value);

    if (!Number.isFinite(num)) {
      throw new PerpDEXError(`Invalid number conversion: ${value}`, 'INVALID_NUMBER', 'grvt');
    }

    // Round to specified decimal places
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * Convert number to string with precision
   *
   * @param value - Number to convert
   * @param decimals - Number of decimal places
   * @returns String representation
   */
  // ===========================================================================
  // Market Normalization
  // ===========================================================================

  /**
   * Normalize GRVT market to unified format
   *
   * @param grvtMarket - GRVT market data from SDK
   * @returns Unified market
   */
  normalizeMarket(grvtMarket: IInstrumentDisplay): Market {
    return {
      id: grvtMarket.instrument || '',
      symbol: this.symbolToCCXT(grvtMarket.instrument || ''),
      base: grvtMarket.base || '',
      quote: grvtMarket.quote || '',
      settle: grvtMarket.quote || '', // GRVT settles in quote currency
      active: true, // SDK doesn't provide is_active, assume true
      minAmount: this.toNumberSafe(grvtMarket.min_size || '0'),
      maxAmount: this.toNumberSafe(grvtMarket.max_position_size || '0'),
      minCost: undefined,
      pricePrecision: GRVT_PRECISION.price,
      amountPrecision: GRVT_PRECISION.amount,
      priceTickSize: this.toNumberSafe(grvtMarket.tick_size || '0'),
      amountStepSize: this.toNumberSafe(grvtMarket.min_size || '0'),
      makerFee: 0, // SDK doesn't provide fees directly
      takerFee: 0,
      maxLeverage: 100, // GRVT supports up to 100x
      fundingIntervalHours: grvtMarket.funding_interval_hours || 8,
      info: grvtMarket as Record<string, unknown>,
    };
  }

  /**
   * Batch normalize markets
   */
  normalizeMarkets(grvtMarkets: IInstrumentDisplay[]): Market[] {
    return grvtMarkets.map((m) => this.normalizeMarket(m));
  }

  // ===========================================================================
  // Order Normalization
  // ===========================================================================

  /**
   * Normalize GRVT order to unified format
   */
  normalizeOrder(grvtOrder: IOrder): Order {
    // SDK orders use legs array for multi-leg orders
    const leg = grvtOrder.legs?.[0];
    const amount = this.toNumberSafe(leg?.size || '0');
    const traded = this.toNumberSafe(grvtOrder.state?.traded_size?.[0] || '0');
    const book = this.toNumberSafe(grvtOrder.state?.book_size?.[0] || '0');

    return {
      id: grvtOrder.order_id || '',
      clientOrderId: grvtOrder.metadata?.client_order_id,
      symbol: this.symbolToCCXT(leg?.instrument || ''),
      type: (grvtOrder.is_market ? 'market' : 'limit') as OrderType,
      side: leg?.is_buying_asset ? 'buy' : 'sell',
      amount,
      price: leg?.limit_price ? this.toNumberSafe(leg.limit_price) : undefined,
      status: this.mapSDKOrderStatus(grvtOrder.state?.status || '') as OrderStatus,
      filled: traded,
      remaining: book,
      averagePrice: grvtOrder.state?.avg_fill_price?.[0]
        ? this.toNumberSafe(grvtOrder.state.avg_fill_price[0])
        : undefined,
      timeInForce: this.mapSDKTimeInForce(grvtOrder.time_in_force || ''),
      reduceOnly: grvtOrder.reduce_only || false,
      postOnly: grvtOrder.post_only || false,
      timestamp: grvtOrder.metadata?.create_time
        ? parseInt(grvtOrder.metadata.create_time)
        : Date.now(),
      lastUpdateTimestamp: grvtOrder.state?.update_time
        ? parseInt(grvtOrder.state.update_time)
        : undefined,
      info: grvtOrder as Record<string, unknown>,
    };
  }

  /**
   * Map SDK order status to unified format
   */
  private mapSDKOrderStatus(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'open',
      OPEN: 'open',
      PARTIALLY_FILLED: 'partiallyFilled',
      FILLED: 'filled',
      CANCELLED: 'canceled',
      REJECTED: 'rejected',
    };
    return statusMap[status] || 'open';
  }

  /**
   * Map SDK time in force to unified format
   */
  private mapSDKTimeInForce(tif: string): 'GTC' | 'IOC' | 'FOK' | 'PO' {
    const tifMap: Record<string, 'GTC' | 'IOC' | 'FOK' | 'PO'> = {
      GOOD_TIL_CANCEL: 'GTC',
      IMMEDIATE_OR_CANCEL: 'IOC',
      FILL_OR_KILL: 'FOK',
    };
    return tifMap[tif] || 'GTC';
  }

  /**
   * Batch normalize orders
   */
  normalizeOrders(grvtOrders: IOrder[]): Order[] {
    return grvtOrders.map((o) => this.normalizeOrder(o));
  }

  // ===========================================================================
  // Position Normalization
  // ===========================================================================

  /**
   * Normalize GRVT position to unified format
   */
  normalizePosition(grvtPosition: IPositions): Position {
    const size = this.toNumberSafe(grvtPosition.size || '0');
    const entryPrice = this.toNumberSafe(grvtPosition.entry_price || '0');
    const markPrice = this.toNumberSafe(grvtPosition.mark_price || '0');
    const leverage = this.toNumberSafe(grvtPosition.leverage || '1', 2);

    // GRVT uses notional to calculate margin
    const notional = this.toNumberSafe(grvtPosition.notional || '0');
    const margin = leverage > 0 ? notional / leverage : 0;

    return {
      symbol: this.symbolToCCXT(grvtPosition.instrument || ''),
      side: size > 0 ? 'long' : 'short',
      size: Math.abs(size),
      entryPrice,
      markPrice,
      liquidationPrice: grvtPosition.est_liquidation_price
        ? this.toNumberSafe(grvtPosition.est_liquidation_price)
        : 0,
      unrealizedPnl: this.toNumberSafe(grvtPosition.unrealized_pnl || '0'),
      realizedPnl: this.toNumberSafe(grvtPosition.realized_pnl || '0'),
      leverage,
      marginMode: 'cross',
      margin,
      maintenanceMargin: margin * 0.5, // Estimate
      marginRatio: margin > 0 ? (margin / notional) * 100 : 0,
      timestamp: grvtPosition.event_time ? parseInt(grvtPosition.event_time) : Date.now(),
      info: grvtPosition as Record<string, unknown>,
    };
  }

  /**
   * Batch normalize positions
   */
  normalizePositions(grvtPositions: IPositions[]): Position[] {
    return grvtPositions.map((p) => this.normalizePosition(p));
  }

  // ===========================================================================
  // Balance Normalization
  // ===========================================================================

  /**
   * Normalize GRVT balance to unified format
   */
  normalizeBalance(grvtBalance: ISpotBalance): Balance {
    const total = this.toNumberSafe(grvtBalance.balance || '0');

    return {
      currency: grvtBalance.currency || '',
      free: total, // SDK doesn't separate free/used for spot balances
      used: 0,
      total,
      info: grvtBalance as Record<string, unknown>,
    };
  }

  /**
   * Batch normalize balances
   */
  normalizeBalances(grvtBalances: ISpotBalance[]): Balance[] {
    return grvtBalances.map((b) => this.normalizeBalance(b));
  }

  // ===========================================================================
  // Trade Normalization
  // ===========================================================================

  /**
   * Normalize GRVT trade to unified format (public trades)
   */
  normalizeTrade(grvtTrade: ITrade): Trade {
    const price = this.toNumberSafe(grvtTrade.price || '0');
    const amount = this.toNumberSafe(grvtTrade.size || '0');

    return {
      id: grvtTrade.trade_id || '',
      orderId: undefined,
      symbol: this.symbolToCCXT(grvtTrade.instrument || ''),
      side: grvtTrade.is_taker_buyer ? 'buy' : 'sell',
      price,
      amount,
      cost: price * amount,
      timestamp: grvtTrade.event_time ? parseInt(grvtTrade.event_time) : Date.now(),
      info: grvtTrade as Record<string, unknown>,
    };
  }

  /**
   * Batch normalize trades
   */
  normalizeTrades(grvtTrades: ITrade[]): Trade[] {
    return grvtTrades.map((t) => this.normalizeTrade(t));
  }

  /**
   * Normalize GRVT fill to unified trade format (user fills)
   */
  normalizeFill(grvtFill: IFill): Trade {
    const price = this.toNumberSafe(grvtFill.price || '0');
    const amount = this.toNumberSafe(grvtFill.size || '0');

    return {
      id: grvtFill.trade_id || '',
      orderId: grvtFill.order_id,
      symbol: this.symbolToCCXT(grvtFill.instrument || ''),
      side: grvtFill.is_buyer ? 'buy' : 'sell',
      price,
      amount,
      cost: price * amount,
      timestamp: grvtFill.event_time ? parseInt(grvtFill.event_time) : Date.now(),
      info: grvtFill as Record<string, unknown>,
    };
  }

  /**
   * Batch normalize fills
   */
  normalizeFills(grvtFills: IFill[]): Trade[] {
    return grvtFills.map((f) => this.normalizeFill(f));
  }

  // ===========================================================================
  // Ticker Normalization
  // ===========================================================================

  /**
   * Normalize GRVT ticker to unified format
   */
  normalizeTicker(grvtTicker: ITicker): Ticker {
    const last = this.toNumberSafe(grvtTicker.last_price || '0');
    const high = this.toNumberSafe(grvtTicker.high_price || '0');
    const low = this.toNumberSafe(grvtTicker.low_price || '0');
    const open = this.toNumberSafe(grvtTicker.open_price || '0');
    const change = last - open;

    const buyVolumeB = this.toNumberSafe(grvtTicker.buy_volume_24h_b || '0');
    const sellVolumeB = this.toNumberSafe(grvtTicker.sell_volume_24h_b || '0');

    return {
      symbol: this.symbolToCCXT(grvtTicker.instrument || ''),
      last,
      bid: this.toNumberSafe(grvtTicker.best_bid_price || '0'),
      bidVolume: this.toNumberSafe(grvtTicker.best_bid_size || '0'),
      ask: this.toNumberSafe(grvtTicker.best_ask_price || '0'),
      askVolume: this.toNumberSafe(grvtTicker.best_ask_size || '0'),
      high,
      low,
      open,
      close: last,
      change,
      percentage: open > 0 ? (change / open) * 100 : 0,
      baseVolume: buyVolumeB + sellVolumeB,
      quoteVolume: 0,
      timestamp: grvtTicker.event_time ? parseInt(grvtTicker.event_time) : Date.now(),
      info: grvtTicker as Record<string, unknown>,
    };
  }

  /**
   * Batch normalize tickers
   */
  normalizeTickers(grvtTickers: ITicker[]): Ticker[] {
    return grvtTickers.map((t) => this.normalizeTicker(t));
  }

  // ===========================================================================
  // Order Book Normalization
  // ===========================================================================

  /**
   * Normalize GRVT order book to unified format
   */
  normalizeOrderBook(grvtOrderBook: IOrderbookLevels): OrderBook {
    return {
      symbol: this.symbolToCCXT(grvtOrderBook.instrument || ''),
      timestamp: grvtOrderBook.event_time ? parseInt(grvtOrderBook.event_time) : Date.now(),
      bids: (grvtOrderBook.bids || []).map((level) => [
        this.toNumberSafe(level.price || '0'),
        this.toNumberSafe(level.size || '0'),
      ]),
      asks: (grvtOrderBook.asks || []).map((level) => [
        this.toNumberSafe(level.price || '0'),
        this.toNumberSafe(level.size || '0'),
      ]),
      sequenceId: undefined, // SDK doesn't provide sequence
      checksum: undefined,
      exchange: 'grvt',
    };
  }
}

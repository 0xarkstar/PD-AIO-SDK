/**
 * GRVT Data Normalizer.
 *
 * Transforms REAL GRVT API response shapes (see `types.ts`) into the SDK's
 * unified types. GRVT numeric fields are STRINGS on the wire; all conversions
 * go through `toNumberSafe`. Fees are per-fill (not per-instrument), so markets
 * carry 0 maker/taker fees here.
 *
 * @see https://api-docs.grvt.io/
 */

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
  FundingRate,
  TimeInForce,
} from '../../types/common.js';
import { GRVT_ORDER_STATUS, GRVT_PRECISION, GRVT_MAX_LEVERAGE } from './constants.js';
import type {
  GRVTMarket,
  GRVTOrder,
  GRVTPosition,
  GRVTSpotBalance,
  GRVTFill,
  GRVTTicker,
  GRVTOrderBook,
  GRVTTrade,
  GRVTFunding,
} from './types.js';
import { PerpDEXError } from '../../types/errors.js';

/**
 * GRVT Data Normalizer.
 *
 * Symbol convention: GRVT instruments are strings like `BTC_USDT_Perp`;
 * unified symbols are CCXT-style `BTC/USDT:USDT`.
 */
export class GRVTNormalizer {
  // ===========================================================================
  // Symbol Conversion
  // ===========================================================================

  /**
   * Convert a GRVT instrument to a unified CCXT symbol.
   *
   * @example
   * symbolToCCXT('BTC_USDT_Perp') // 'BTC/USDT:USDT'
   * symbolToCCXT('BTC_USDT')      // 'BTC/USDT'
   */
  symbolToCCXT(grvtSymbol: string): string {
    if (grvtSymbol.endsWith('_Perp')) {
      const parts = grvtSymbol.replace('_Perp', '').split('_');
      const base = parts[0];
      const quote = parts[1] || 'USDT';
      return `${base}/${quote}:${quote}`;
    }

    // Legacy hyphen form (defensive)
    if (grvtSymbol.endsWith('-PERP')) {
      const base = grvtSymbol.replace('-PERP', '');
      return `${base}/USDT:USDT`;
    }

    if (grvtSymbol.includes('_')) {
      const [base, quote] = grvtSymbol.split('_');
      return `${base}/${quote || 'USDT'}`;
    }

    return `${grvtSymbol}/USDT:USDT`;
  }

  /**
   * Convert a unified CCXT symbol to a GRVT instrument.
   *
   * @example
   * symbolFromCCXT('BTC/USDT:USDT') // 'BTC_USDT_Perp'
   * symbolFromCCXT('BTC/USDT')      // 'BTC_USDT'
   */
  symbolFromCCXT(ccxtSymbol: string): string {
    if (ccxtSymbol.includes(':')) {
      const parts = ccxtSymbol.split(':');
      const pair = parts[0] || '';
      const settle = parts[1] || 'USDT';
      const pairParts = pair.split('/');
      const base = pairParts[0] || '';
      const quote = pairParts[1] || settle;
      return `${base}_${quote}_Perp`;
    }

    const parts = ccxtSymbol.split('/');
    const base = parts[0] || '';
    const quote = parts[1] || 'USDT';
    return `${base}_${quote}`;
  }

  // ===========================================================================
  // Numeric helpers
  // ===========================================================================

  /**
   * Convert a GRVT string number to a finite number.
   *
   * @throws {PerpDEXError} if the value is not a valid number.
   */
  private toNumberSafe(value: string | undefined): number {
    if (!value || value === '0') {
      return 0;
    }
    const num = parseFloat(value);
    if (!Number.isFinite(num)) {
      throw new PerpDEXError(`Invalid number conversion: ${value}`, 'INVALID_NUMBER', 'grvt');
    }
    return num;
  }

  /**
   * Count decimal places in a tick/step string (e.g. '0.5' -> 1, '0.001' -> 3).
   */
  private countDecimals(value: string | undefined): number {
    if (!value) {
      return GRVT_PRECISION.price;
    }
    const parts = value.split('.');
    return parts.length === 2 && parts[1] ? parts[1].length : 0;
  }

  // ===========================================================================
  // Market
  // ===========================================================================

  /**
   * Normalize a GRVT instrument into a unified Market. Fees are per-fill on
   * GRVT, so maker/taker are 0 here.
   */
  normalizeMarket(grvtMarket: GRVTMarket): Market {
    const instrument = grvtMarket.instrument || '';
    return {
      id: instrument,
      symbol: this.symbolToCCXT(instrument),
      base: grvtMarket.base || '',
      quote: grvtMarket.quote || '',
      settle: grvtMarket.quote || '',
      active: grvtMarket.is_active ?? true,
      minAmount: this.toNumberSafe(grvtMarket.min_size),
      maxAmount: grvtMarket.max_size ? this.toNumberSafe(grvtMarket.max_size) : undefined,
      minCost: grvtMarket.min_notional ? this.toNumberSafe(grvtMarket.min_notional) : undefined,
      pricePrecision: this.countDecimals(grvtMarket.tick_size),
      amountPrecision: this.countDecimals(grvtMarket.min_size),
      priceTickSize: this.toNumberSafe(grvtMarket.tick_size),
      amountStepSize: this.toNumberSafe(grvtMarket.min_size),
      makerFee: 0, // GRVT fees are per-fill, not per-instrument
      takerFee: 0,
      maxLeverage: GRVT_MAX_LEVERAGE,
      fundingIntervalHours: grvtMarket.funding_interval_hours ?? 8,
      info: grvtMarket as unknown as Record<string, unknown>,
    };
  }

  /**
   * Batch-normalize markets.
   */
  normalizeMarkets(grvtMarkets: GRVTMarket[]): Market[] {
    return grvtMarkets.map((m) => this.normalizeMarket(m));
  }

  // ===========================================================================
  // Order
  // ===========================================================================

  /**
   * Normalize a GRVT account order (leg-based) into a unified Order.
   */
  normalizeOrder(grvtOrder: GRVTOrder): Order {
    const leg = grvtOrder.legs?.[0];
    const amount = this.toNumberSafe(leg?.size);
    const traded = this.toNumberSafe(grvtOrder.state?.traded_size?.[0]);
    const book = this.toNumberSafe(grvtOrder.state?.book_size?.[0]);

    return {
      id: grvtOrder.order_id || '',
      clientOrderId: grvtOrder.metadata?.client_order_id,
      symbol: this.symbolToCCXT(leg?.instrument || ''),
      type: (grvtOrder.is_market ? 'market' : 'limit') as OrderType,
      side: leg?.is_buying_asset ? 'buy' : 'sell',
      amount,
      price: leg?.limit_price ? this.toNumberSafe(leg.limit_price) : undefined,
      status: this.mapOrderStatus(grvtOrder.state?.status || ''),
      filled: traded,
      remaining: book,
      averagePrice: grvtOrder.state?.avg_fill_price?.[0]
        ? this.toNumberSafe(grvtOrder.state.avg_fill_price[0])
        : undefined,
      timeInForce: this.mapTimeInForce(grvtOrder.time_in_force || ''),
      reduceOnly: grvtOrder.reduce_only || false,
      postOnly: grvtOrder.post_only || false,
      timestamp: grvtOrder.metadata?.create_time
        ? parseInt(grvtOrder.metadata.create_time, 10)
        : Date.now(),
      lastUpdateTimestamp: grvtOrder.state?.update_time
        ? parseInt(grvtOrder.state.update_time, 10)
        : undefined,
      info: grvtOrder as unknown as Record<string, unknown>,
    };
  }

  /**
   * Batch-normalize orders.
   */
  normalizeOrders(grvtOrders: GRVTOrder[]): Order[] {
    return grvtOrders.map((o) => this.normalizeOrder(o));
  }

  /**
   * Map a GRVT order status to the unified OrderStatus.
   */
  private mapOrderStatus(status: string): OrderStatus {
    const mapped = (GRVT_ORDER_STATUS as Record<string, OrderStatus>)[status];
    return mapped ?? 'open';
  }

  /**
   * Map a GRVT API TIF string to the unified TimeInForce.
   */
  private mapTimeInForce(tif: string): TimeInForce {
    const map: Record<string, TimeInForce> = {
      GOOD_TILL_TIME: 'GTC',
      IMMEDIATE_OR_CANCEL: 'IOC',
      FILL_OR_KILL: 'FOK',
    };
    return map[tif] ?? 'GTC';
  }

  // ===========================================================================
  // Position
  // ===========================================================================

  /**
   * Normalize a GRVT position into a unified Position.
   */
  normalizePosition(grvtPosition: GRVTPosition): Position {
    const size = this.toNumberSafe(grvtPosition.size);
    const entryPrice = this.toNumberSafe(grvtPosition.entry_price);
    const markPrice = this.toNumberSafe(grvtPosition.mark_price);
    const leverage = this.toNumberSafe(grvtPosition.leverage);
    const notional = this.toNumberSafe(grvtPosition.notional);
    const margin = leverage > 0 ? notional / leverage : 0;

    return {
      symbol: this.symbolToCCXT(grvtPosition.instrument || ''),
      side: size >= 0 ? 'long' : 'short',
      size: Math.abs(size),
      entryPrice,
      markPrice,
      liquidationPrice: grvtPosition.est_liquidation_price
        ? this.toNumberSafe(grvtPosition.est_liquidation_price)
        : 0,
      unrealizedPnl: this.toNumberSafe(grvtPosition.unrealized_pnl),
      realizedPnl: this.toNumberSafe(grvtPosition.realized_pnl),
      leverage,
      marginMode: 'cross',
      margin,
      maintenanceMargin: margin * 0.5,
      marginRatio: margin > 0 && notional > 0 ? (margin / notional) * 100 : 0,
      timestamp: grvtPosition.event_time ? parseInt(grvtPosition.event_time, 10) : Date.now(),
      info: grvtPosition as unknown as Record<string, unknown>,
    };
  }

  /**
   * Batch-normalize positions.
   */
  normalizePositions(grvtPositions: GRVTPosition[]): Position[] {
    return grvtPositions.map((p) => this.normalizePosition(p));
  }

  // ===========================================================================
  // Balance
  // ===========================================================================

  /**
   * Normalize a GRVT spot balance into a unified Balance.
   */
  normalizeBalance(grvtBalance: GRVTSpotBalance): Balance {
    const total = this.toNumberSafe(grvtBalance.balance);
    return {
      currency: grvtBalance.currency || '',
      free: total,
      used: 0,
      total,
      info: grvtBalance as unknown as Record<string, unknown>,
    };
  }

  /**
   * Batch-normalize balances.
   */
  normalizeBalances(grvtBalances: GRVTSpotBalance[]): Balance[] {
    return grvtBalances.map((b) => this.normalizeBalance(b));
  }

  // ===========================================================================
  // Trade / fill
  // ===========================================================================

  /**
   * Normalize a GRVT public trade into a unified Trade.
   * `is_taker_buyer` true => the aggressor bought (side = 'buy').
   */
  normalizeTrade(grvtTrade: GRVTTrade): Trade {
    const price = this.toNumberSafe(grvtTrade.price);
    const amount = this.toNumberSafe(grvtTrade.size);
    return {
      id: grvtTrade.trade_id || '',
      orderId: undefined,
      symbol: this.symbolToCCXT(grvtTrade.instrument || ''),
      side: grvtTrade.is_taker_buyer ? 'buy' : 'sell',
      price,
      amount,
      cost: price * amount,
      timestamp: grvtTrade.event_time ? parseInt(grvtTrade.event_time, 10) : Date.now(),
      info: grvtTrade as unknown as Record<string, unknown>,
    };
  }

  /**
   * Batch-normalize public trades.
   */
  normalizeTrades(grvtTrades: GRVTTrade[]): Trade[] {
    return grvtTrades.map((t) => this.normalizeTrade(t));
  }

  /**
   * Normalize a GRVT user fill into a unified Trade (with fee).
   */
  normalizeFill(grvtFill: GRVTFill): Trade {
    const price = this.toNumberSafe(grvtFill.price);
    const amount = this.toNumberSafe(grvtFill.size);
    const trade: Trade = {
      id: grvtFill.trade_id || '',
      orderId: grvtFill.order_id,
      symbol: this.symbolToCCXT(grvtFill.instrument || ''),
      side: grvtFill.is_buyer ? 'buy' : 'sell',
      price,
      amount,
      cost: price * amount,
      timestamp: grvtFill.event_time ? parseInt(grvtFill.event_time, 10) : Date.now(),
      info: grvtFill as unknown as Record<string, unknown>,
    };
    if (grvtFill.fee !== undefined) {
      trade.fee = { cost: this.toNumberSafe(grvtFill.fee), currency: 'USDT' };
    }
    return trade;
  }

  /**
   * Batch-normalize fills.
   */
  normalizeFills(grvtFills: GRVTFill[]): Trade[] {
    return grvtFills.map((f) => this.normalizeFill(f));
  }

  // ===========================================================================
  // Ticker
  // ===========================================================================

  /**
   * Normalize a GRVT ticker into a unified Ticker. GRVT has no 24h high/low/open,
   * so those default to the last/mark price; baseVolume uses the 24h quote
   * volumes (buy + sell).
   */
  normalizeTicker(grvtTicker: GRVTTicker): Ticker {
    const last = this.toNumberSafe(grvtTicker.last_price ?? grvtTicker.mark_price);
    const buyVolume = this.toNumberSafe(grvtTicker.buy_volume_24h_q);
    const sellVolume = this.toNumberSafe(grvtTicker.sell_volume_24h_q);

    return {
      symbol: this.symbolToCCXT(grvtTicker.instrument || ''),
      last,
      bid: this.toNumberSafe(grvtTicker.best_bid_price),
      bidVolume: this.toNumberSafe(grvtTicker.best_bid_size),
      ask: this.toNumberSafe(grvtTicker.best_ask_price),
      askVolume: this.toNumberSafe(grvtTicker.best_ask_size),
      high: last,
      low: last,
      open: last,
      close: last,
      change: 0,
      percentage: 0,
      baseVolume: 0,
      quoteVolume: buyVolume + sellVolume,
      timestamp: grvtTicker.event_time ? parseInt(grvtTicker.event_time, 10) : Date.now(),
      info: grvtTicker as unknown as Record<string, unknown>,
    };
  }

  /**
   * Batch-normalize tickers.
   */
  normalizeTickers(grvtTickers: GRVTTicker[]): Ticker[] {
    return grvtTickers.map((t) => this.normalizeTicker(t));
  }

  // ===========================================================================
  // Order book
  // ===========================================================================

  /**
   * Normalize a GRVT FULL order-book snapshot into a unified OrderBook.
   */
  normalizeOrderBook(grvtOrderBook: GRVTOrderBook): OrderBook {
    return {
      symbol: this.symbolToCCXT(grvtOrderBook.instrument || ''),
      timestamp: grvtOrderBook.event_time ? parseInt(grvtOrderBook.event_time, 10) : Date.now(),
      bids: (grvtOrderBook.bids || []).map(
        (level): [number, number] => [this.toNumberSafe(level.price), this.toNumberSafe(level.size)]
      ),
      asks: (grvtOrderBook.asks || []).map(
        (level): [number, number] => [this.toNumberSafe(level.price), this.toNumberSafe(level.size)]
      ),
      sequenceId: undefined,
      checksum: undefined,
      exchange: 'grvt',
    };
  }

  // ===========================================================================
  // Funding
  // ===========================================================================

  /**
   * Normalize a GRVT funding entry into a unified FundingRate.
   */
  normalizeFundingRate(grvtFunding: GRVTFunding): FundingRate {
    const fundingTimestamp = grvtFunding.funding_time
      ? parseInt(grvtFunding.funding_time, 10)
      : Date.now();
    const fundingIntervalHours = grvtFunding.funding_interval_hours ?? 8;
    const nextFundingTimestamp = fundingTimestamp + fundingIntervalHours * 60 * 60 * 1000;

    return {
      symbol: this.symbolToCCXT(grvtFunding.instrument || ''),
      fundingRate: this.toNumberSafe(grvtFunding.funding_rate),
      fundingTimestamp,
      nextFundingTimestamp,
      markPrice: this.toNumberSafe(grvtFunding.mark_price),
      indexPrice: this.toNumberSafe(grvtFunding.index_price),
      fundingIntervalHours,
      info: grvtFunding as unknown as Record<string, unknown>,
    };
  }

  // ===========================================================================
  // Symbol aliases (framework compatibility)
  // ===========================================================================

  normalizeSymbol(exchangeSymbol: string): string {
    return this.symbolToCCXT(exchangeSymbol);
  }

  toExchangeSymbol(symbol: string): string {
    return this.symbolFromCCXT(symbol);
  }
}

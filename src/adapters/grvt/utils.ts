/**
 * GRVT utility functions for data normalization (pure, standalone).
 *
 * These mirror the `GRVTNormalizer` methods but as free functions over the REAL
 * GRVT shapes in `types.ts`. Kept for the public adapter surface + ergonomic
 * one-off conversions. GRVT numeric fields are STRINGS on the wire.
 */

import type {
  Market,
  Order,
  Position,
  Balance,
  OrderBook,
  Trade,
  Ticker,
  OrderSide,
  OrderType,
  OrderStatus,
  TimeInForce,
} from '../../types/common.js';
import {
  GRVT_ORDER_SIDES,
  GRVT_TIME_IN_FORCE,
  GRVT_ORDER_STATUS,
  GRVT_MAX_LEVERAGE,
} from './constants.js';
import type {
  GRVTMarket,
  GRVTOrder,
  GRVTPosition,
  GRVTSpotBalance,
  GRVTOrderBook,
  GRVTTrade,
  GRVTTicker,
} from './types.js';

/**
 * Normalize a GRVT instrument string to a unified CCXT symbol.
 *
 * @example
 * normalizeSymbol('BTC_USDT_Perp') // 'BTC/USDT:USDT'
 */
export function normalizeSymbol(grvtSymbol: string): string {
  if (grvtSymbol.endsWith('_Perp')) {
    const parts = grvtSymbol.replace('_Perp', '').split('_');
    const base = parts[0];
    const quote = parts[1] || 'USDT';
    return `${base}/${quote}:${quote}`;
  }
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
 * Convert a unified CCXT symbol to a GRVT instrument string.
 *
 * @example
 * toGRVTSymbol('BTC/USDT:USDT') // 'BTC_USDT_Perp'
 */
export function toGRVTSymbol(symbol: string): string {
  if (symbol.includes(':')) {
    const parts = symbol.split(':');
    const pair = parts[0] || '';
    const settle = parts[1] || 'USDT';
    const pairParts = pair.split('/');
    const base = pairParts[0] || '';
    const quote = pairParts[1] || settle;
    return `${base}_${quote}_Perp`;
  }
  const parts = symbol.split('/');
  const base = parts[0] || '';
  const quote = parts[1] || 'USDT';
  return `${base}_${quote}`;
}

/**
 * Parse a GRVT string number into a finite number (0 for empty/undefined).
 */
function num(value: string | undefined): number {
  if (!value) return 0;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Count decimal places in a tick/step string.
 */
function countDecimals(value: string | undefined): number {
  if (!value) return 0;
  const parts = value.split('.');
  return parts.length === 2 && parts[1] ? parts[1].length : 0;
}

/**
 * Normalize a GRVT instrument into a unified Market (fees are per-fill on GRVT).
 */
export function normalizeMarket(grvtMarket: GRVTMarket): Market {
  const instrument = grvtMarket.instrument;
  return {
    id: instrument,
    symbol: normalizeSymbol(instrument),
    base: grvtMarket.base,
    quote: grvtMarket.quote,
    settle: grvtMarket.quote,
    active: grvtMarket.is_active ?? true,
    minAmount: num(grvtMarket.min_size),
    maxAmount: grvtMarket.max_size ? num(grvtMarket.max_size) : undefined,
    minCost: grvtMarket.min_notional ? num(grvtMarket.min_notional) : undefined,
    pricePrecision: countDecimals(grvtMarket.tick_size),
    amountPrecision: countDecimals(grvtMarket.min_size),
    priceTickSize: num(grvtMarket.tick_size),
    amountStepSize: num(grvtMarket.min_size),
    makerFee: 0,
    takerFee: 0,
    maxLeverage: GRVT_MAX_LEVERAGE,
    fundingIntervalHours: grvtMarket.funding_interval_hours ?? 8,
    info: grvtMarket as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize a GRVT account order (leg-based) into a unified Order.
 */
export function normalizeOrder(grvtOrder: GRVTOrder): Order {
  const leg = grvtOrder.legs?.[0];
  const amount = num(leg?.size);
  const traded = num(grvtOrder.state?.traded_size?.[0]);
  const book = num(grvtOrder.state?.book_size?.[0]);

  return {
    id: grvtOrder.order_id || '',
    clientOrderId: grvtOrder.metadata?.client_order_id,
    symbol: normalizeSymbol(leg?.instrument || ''),
    type: (grvtOrder.is_market ? 'market' : 'limit') as OrderType,
    side: leg?.is_buying_asset ? 'buy' : 'sell',
    amount,
    price: leg?.limit_price ? num(leg.limit_price) : undefined,
    filled: traded,
    remaining: book,
    averagePrice: grvtOrder.state?.avg_fill_price?.[0]
      ? num(grvtOrder.state.avg_fill_price[0])
      : undefined,
    status: normalizeOrderStatus(grvtOrder.state?.status || ''),
    timeInForce: normalizeTimeInForce(grvtOrder.time_in_force || ''),
    postOnly: grvtOrder.post_only || false,
    reduceOnly: grvtOrder.reduce_only || false,
    timestamp: grvtOrder.metadata?.create_time ? parseInt(grvtOrder.metadata.create_time, 10) : Date.now(),
    lastUpdateTimestamp: grvtOrder.state?.update_time
      ? parseInt(grvtOrder.state.update_time, 10)
      : undefined,
    info: grvtOrder as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize a GRVT position into a unified Position.
 */
export function normalizePosition(grvtPosition: GRVTPosition): Position {
  const size = num(grvtPosition.size);
  const leverage = num(grvtPosition.leverage);
  const notional = num(grvtPosition.notional);
  const margin = leverage > 0 ? notional / leverage : 0;

  return {
    symbol: normalizeSymbol(grvtPosition.instrument || ''),
    side: size >= 0 ? 'long' : 'short',
    marginMode: 'cross',
    size: Math.abs(size),
    entryPrice: num(grvtPosition.entry_price),
    markPrice: num(grvtPosition.mark_price),
    liquidationPrice: grvtPosition.est_liquidation_price ? num(grvtPosition.est_liquidation_price) : 0,
    unrealizedPnl: num(grvtPosition.unrealized_pnl),
    realizedPnl: num(grvtPosition.realized_pnl),
    margin,
    leverage,
    maintenanceMargin: margin * 0.5,
    marginRatio: margin > 0 && notional > 0 ? (margin / notional) * 100 : 0,
    timestamp: grvtPosition.event_time ? parseInt(grvtPosition.event_time, 10) : Date.now(),
    info: grvtPosition as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize a GRVT spot balance into a unified Balance.
 */
export function normalizeBalance(grvtBalance: GRVTSpotBalance): Balance {
  const total = num(grvtBalance.balance);
  return {
    currency: grvtBalance.currency || '',
    total,
    free: total,
    used: 0,
    info: grvtBalance as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize a GRVT FULL order-book snapshot into a unified OrderBook.
 */
export function normalizeOrderBook(grvtOrderBook: GRVTOrderBook): OrderBook {
  return {
    symbol: normalizeSymbol(grvtOrderBook.instrument || ''),
    exchange: 'grvt',
    bids: (grvtOrderBook.bids || []).map((lvl): [number, number] => [num(lvl.price), num(lvl.size)]),
    asks: (grvtOrderBook.asks || []).map((lvl): [number, number] => [num(lvl.price), num(lvl.size)]),
    timestamp: grvtOrderBook.event_time ? parseInt(grvtOrderBook.event_time, 10) : Date.now(),
  };
}

/**
 * Normalize a GRVT public trade into a unified Trade.
 */
export function normalizeTrade(grvtTrade: GRVTTrade): Trade {
  const price = num(grvtTrade.price);
  const amount = num(grvtTrade.size);
  return {
    id: grvtTrade.trade_id,
    symbol: normalizeSymbol(grvtTrade.instrument || ''),
    side: grvtTrade.is_taker_buyer ? 'buy' : 'sell',
    price,
    amount,
    cost: price * amount,
    timestamp: grvtTrade.event_time ? parseInt(grvtTrade.event_time, 10) : Date.now(),
    info: grvtTrade as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize a GRVT ticker into a unified Ticker.
 */
export function normalizeTicker(grvtTicker: GRVTTicker): Ticker {
  const last = num(grvtTicker.last_price ?? grvtTicker.mark_price);
  const buyVolume = num(grvtTicker.buy_volume_24h_q);
  const sellVolume = num(grvtTicker.sell_volume_24h_q);
  return {
    symbol: normalizeSymbol(grvtTicker.instrument || ''),
    last,
    open: last,
    close: last,
    bid: num(grvtTicker.best_bid_price),
    bidVolume: num(grvtTicker.best_bid_size),
    ask: num(grvtTicker.best_ask_price),
    askVolume: num(grvtTicker.best_ask_size),
    high: last,
    low: last,
    change: 0,
    percentage: 0,
    baseVolume: 0,
    quoteVolume: buyVolume + sellVolume,
    timestamp: grvtTicker.event_time ? parseInt(grvtTicker.event_time, 10) : Date.now(),
    info: grvtTicker as unknown as Record<string, unknown>,
  };
}

/**
 * Map a GRVT order status to the unified OrderStatus.
 */
function normalizeOrderStatus(grvtStatus: string): OrderStatus {
  const mapped = (GRVT_ORDER_STATUS as Record<string, OrderStatus>)[grvtStatus];
  return mapped ?? 'open';
}

/**
 * Map a GRVT API TIF string to the unified TimeInForce.
 */
function normalizeTimeInForce(grvtTif: string): TimeInForce {
  switch (grvtTif) {
    case 'IMMEDIATE_OR_CANCEL':
      return 'IOC';
    case 'FILL_OR_KILL':
      return 'FOK';
    case 'GOOD_TILL_TIME':
    default:
      return 'GTC';
  }
}

/**
 * Convert a unified order side to the GRVT wire side.
 */
export function toGRVTOrderSide(side: OrderSide): string {
  return side === 'buy' ? GRVT_ORDER_SIDES.buy : GRVT_ORDER_SIDES.sell;
}

/**
 * Convert a unified TimeInForce (+ postOnly) to the GRVT API TIF string.
 * Maker quotes (post_only) require GOOD_TILL_TIME.
 */
export function toGRVTTimeInForce(tif?: TimeInForce, postOnly?: boolean): string {
  if (postOnly) {
    return GRVT_TIME_IN_FORCE.GOOD_TILL_TIME;
  }
  switch (tif) {
    case 'IOC':
      return GRVT_TIME_IN_FORCE.IMMEDIATE_OR_CANCEL;
    case 'FOK':
      return GRVT_TIME_IN_FORCE.FILL_OR_KILL;
    case 'PO':
      return GRVT_TIME_IN_FORCE.GOOD_TILL_TIME;
    case 'GTC':
    default:
      return GRVT_TIME_IN_FORCE.GOOD_TILL_TIME;
  }
}

/**
 * Map a GRVT API error code/message to a unified error descriptor.
 */
export function mapGRVTError(error: unknown): { code: string; message: string } {
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: number | string; message?: string };
    switch (err.code) {
      case 1001:
        return { code: 'INVALID_ORDER', message: 'Invalid order parameters' };
      case 1002:
        return { code: 'INSUFFICIENT_MARGIN', message: 'Insufficient margin' };
      case 1003:
        return { code: 'ORDER_NOT_FOUND', message: 'Order not found' };
      case 1004:
        return { code: 'POSITION_NOT_FOUND', message: 'Position not found' };
      case 2001:
        return { code: 'INVALID_SIGNATURE', message: 'Invalid signature' };
      case 2002:
        return { code: 'EXPIRED_AUTH', message: 'Authentication expired' };
      case 2003:
        return { code: 'INVALID_API_KEY', message: 'Invalid API key' };
      case 4001:
        return { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded' };
      case 5001:
        return { code: 'EXCHANGE_UNAVAILABLE', message: 'Exchange unavailable' };
      default:
        return { code: 'UNKNOWN_ERROR', message: err.message ?? 'Unknown error occurred' };
    }
  }
  return { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' };
}

/**
 * Paradex utility functions for data normalization
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
  OrderSide,
  OrderType,
  OrderStatus,
  TimeInForce,
} from '../../types/common.js';
import {
  PARADEX_ORDER_TYPES,
  PARADEX_ORDER_SIDES,
  PARADEX_TIME_IN_FORCE,
} from './constants.js';
import type {
  ParadexMarket,
  ParadexOrder,
  ParadexPosition,
  ParadexBalance,
  ParadexOrderBook,
  ParadexTrade,
  ParadexTicker,
  ParadexFundingRate,
} from './types.js';

/**
 * Normalize Paradex symbol to unified format
 *
 * @example
 * normalizeSymbol('BTC-USD-PERP') // 'BTC/USD:USD'
 * normalizeSymbol('ETH-USD-PERP') // 'ETH/USD:USD'
 */
export function normalizeSymbol(paradexSymbol: string): string {
  // Paradex format: BTC-USD-PERP, ETH-USD-PERP
  const parts = paradexSymbol.split('-');

  if (parts.length === 3 && parts[2] === 'PERP') {
    const base = parts[0];
    const quote = parts[1];
    return `${base}/${quote}:${quote}`;
  }

  // Fallback for spot markets
  return paradexSymbol.replace('-', '/');
}

/**
 * Convert unified symbol to Paradex format
 *
 * @example
 * toParadexSymbol('BTC/USD:USD') // 'BTC-USD-PERP'
 * toParadexSymbol('ETH/USDC:USDC') // 'ETH-USDC-PERP'
 */
export function toParadexSymbol(symbol: string): string {
  const parts = symbol.split(':');

  if (parts.length === 2) {
    // Perpetual format
    const [pair = ""] = parts;
    const [base = "", quote = ""] = pair.split('/');
    return `${base}-${quote}-PERP`;
  }

  // Spot format
  return symbol.replace('/', '-');
}

/**
 * Normalize Paradex market to unified format
 */
export function normalizeMarket(paradexMarket: ParadexMarket): Market {
  const symbol = normalizeSymbol(paradexMarket.symbol);

  return {
    id: paradexMarket.symbol,
    symbol,
    base: paradexMarket.base_currency,
    quote: paradexMarket.quote_currency,
    settle: paradexMarket.settlement_currency,
    active: paradexMarket.is_active,
    minAmount: parseFloat(paradexMarket.min_order_size),
    pricePrecision: countDecimals(paradexMarket.tick_size),
    amountPrecision: countDecimals(paradexMarket.step_size),
    priceTickSize: parseFloat(paradexMarket.tick_size),
    amountStepSize: parseFloat(paradexMarket.step_size),
    makerFee: parseFloat(paradexMarket.maker_fee_rate),
    takerFee: parseFloat(paradexMarket.taker_fee_rate),
    maxLeverage: parseFloat(paradexMarket.max_leverage),
    fundingIntervalHours: 8,
  };
}

/**
 * Normalize Paradex order to unified format
 */
export function normalizeOrder(paradexOrder: ParadexOrder): Order {
  const symbol = normalizeSymbol(paradexOrder.market);

  return {
    id: paradexOrder.id,
    clientOrderId: paradexOrder.client_id,
    symbol,
    type: normalizeOrderType(paradexOrder.type),
    side: normalizeOrderSide(paradexOrder.side),
    amount: parseFloat(paradexOrder.size),
    price: paradexOrder.price ? parseFloat(paradexOrder.price) : undefined,
    filled: parseFloat(paradexOrder.filled_size),
    remaining: parseFloat(paradexOrder.size) - parseFloat(paradexOrder.filled_size),
    averagePrice: paradexOrder.avg_fill_price
      ? parseFloat(paradexOrder.avg_fill_price)
      : undefined,
    status: normalizeOrderStatus(paradexOrder.status),
    timeInForce: normalizeTimeInForce(paradexOrder.time_in_force),
    postOnly: paradexOrder.post_only,
    reduceOnly: paradexOrder.reduce_only,
    timestamp: paradexOrder.created_at,
    lastUpdateTimestamp: paradexOrder.updated_at,
    info: paradexOrder as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Paradex position to unified format
 */
export function normalizePosition(paradexPosition: ParadexPosition): Position {
  const symbol = normalizeSymbol(paradexPosition.market);
  const size = parseFloat(paradexPosition.size);
  const side = paradexPosition.side === 'LONG' ? 'long' : 'short';

  return {
    symbol,
    side,
    marginMode: 'cross',
    size: Math.abs(size),
    entryPrice: parseFloat(paradexPosition.entry_price),
    markPrice: parseFloat(paradexPosition.mark_price),
    liquidationPrice: paradexPosition.liquidation_price
      ? parseFloat(paradexPosition.liquidation_price)
      : 0,
    unrealizedPnl: parseFloat(paradexPosition.unrealized_pnl),
    realizedPnl: parseFloat(paradexPosition.realized_pnl),
    margin: parseFloat(paradexPosition.margin),
    leverage: parseFloat(paradexPosition.leverage),
    maintenanceMargin: parseFloat(paradexPosition.margin) * 0.025,
    marginRatio: 0,
    timestamp: paradexPosition.last_updated,
    info: paradexPosition as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Paradex balance to unified format
 */
export function normalizeBalance(paradexBalance: ParadexBalance): Balance {
  return {
    currency: paradexBalance.asset,
    total: parseFloat(paradexBalance.total),
    free: parseFloat(paradexBalance.available),
    used: parseFloat(paradexBalance.locked),
    info: paradexBalance as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Paradex order book to unified format
 */
export function normalizeOrderBook(paradexOrderBook: ParadexOrderBook): OrderBook {
  return {
    symbol: normalizeSymbol(paradexOrderBook.market),
    exchange: 'paradex',
    bids: paradexOrderBook.bids.map(([price, size]) => [
      parseFloat(price),
      parseFloat(size),
    ]),
    asks: paradexOrderBook.asks.map(([price, size]) => [
      parseFloat(price),
      parseFloat(size),
    ]),
    timestamp: paradexOrderBook.timestamp,
  };
}

/**
 * Normalize Paradex trade to unified format
 */
export function normalizeTrade(paradexTrade: ParadexTrade): Trade {
  const price = parseFloat(paradexTrade.price);
  const amount = parseFloat(paradexTrade.size);

  return {
    id: paradexTrade.id,
    symbol: normalizeSymbol(paradexTrade.market),
    side: normalizeOrderSide(paradexTrade.side),
    price,
    amount,
    cost: price * amount,
    timestamp: paradexTrade.timestamp,
    info: paradexTrade as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Paradex ticker to unified format
 */
export function normalizeTicker(paradexTicker: ParadexTicker): Ticker {
  const last = parseFloat(paradexTicker.last_price);
  const change = parseFloat(paradexTicker.price_change_24h);
  const percentage = parseFloat(paradexTicker.price_change_percent_24h);

  return {
    symbol: normalizeSymbol(paradexTicker.market),
    last,
    open: last - change,
    close: last,
    bid: parseFloat(paradexTicker.bid),
    ask: parseFloat(paradexTicker.ask),
    high: parseFloat(paradexTicker.high_24h),
    low: parseFloat(paradexTicker.low_24h),
    change,
    percentage,
    baseVolume: parseFloat(paradexTicker.volume_24h),
    quoteVolume: 0,
    timestamp: paradexTicker.timestamp,
    info: paradexTicker as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Paradex funding rate to unified format
 */
export function normalizeFundingRate(paradexFunding: ParadexFundingRate): FundingRate {
  return {
    symbol: normalizeSymbol(paradexFunding.market),
    fundingRate: parseFloat(paradexFunding.rate),
    fundingTimestamp: paradexFunding.timestamp,
    markPrice: parseFloat(paradexFunding.mark_price),
    indexPrice: parseFloat(paradexFunding.index_price),
    nextFundingTimestamp: paradexFunding.next_funding_time,
    fundingIntervalHours: 8,
    info: paradexFunding as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Paradex order type to unified format
 */
function normalizeOrderType(paradexType: string): OrderType {
  switch (paradexType) {
    case 'MARKET':
      return 'market';
    case 'LIMIT':
    case 'LIMIT_MAKER':
      return 'limit';
    default:
      return 'limit';
  }
}

/**
 * Normalize Paradex order side to unified format
 */
function normalizeOrderSide(paradexSide: string): OrderSide {
  return paradexSide === 'BUY' ? 'buy' : 'sell';
}

/**
 * Normalize Paradex order status to unified format
 */
function normalizeOrderStatus(paradexStatus: string): OrderStatus {
  const statusMap: Record<string, OrderStatus> = {
    PENDING: 'open',
    OPEN: 'open',
    PARTIAL: 'partiallyFilled',
    FILLED: 'filled',
    CANCELLED: 'canceled',
    REJECTED: 'rejected',
  };

  return statusMap[paradexStatus] ?? 'open';
}

/**
 * Normalize Paradex time in force to unified format
 */
function normalizeTimeInForce(paradexTif: string): TimeInForce {
  switch (paradexTif) {
    case 'GTC':
      return 'GTC';
    case 'IOC':
      return 'IOC';
    case 'FOK':
      return 'FOK';
    case 'POST_ONLY':
      return 'PO';
    default:
      return 'GTC';
  }
}

/**
 * Convert unified order type to Paradex format
 */
export function toParadexOrderType(type: OrderType, postOnly?: boolean): string {
  if (type === 'market') {
    return PARADEX_ORDER_TYPES.market;
  }

  if (postOnly) {
    return PARADEX_ORDER_TYPES.limitMaker;
  }

  return PARADEX_ORDER_TYPES.limit;
}

/**
 * Convert unified order side to Paradex format
 */
export function toParadexOrderSide(side: OrderSide): string {
  return side === 'buy' ? PARADEX_ORDER_SIDES.buy : PARADEX_ORDER_SIDES.sell;
}

/**
 * Convert unified time in force to Paradex format
 */
export function toParadexTimeInForce(tif?: TimeInForce, postOnly?: boolean): string {
  if (postOnly) {
    return PARADEX_TIME_IN_FORCE.POST_ONLY;
  }

  switch (tif) {
    case 'IOC':
      return PARADEX_TIME_IN_FORCE.IOC;
    case 'FOK':
      return PARADEX_TIME_IN_FORCE.FOK;
    case 'PO':
      return PARADEX_TIME_IN_FORCE.POST_ONLY;
    case 'GTC':
    default:
      return PARADEX_TIME_IN_FORCE.GTC;
  }
}

/**
 * Count decimal places in a string number
 */
function countDecimals(value: string): number {
  const parts = value.split('.');
  return parts.length === 2 && parts[1] ? parts[1].length : 0;
}

/**
 * Map Paradex error to unified error code
 */
export function mapParadexError(error: unknown): { code: string; message: string } {
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: number; message?: string };

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
        return { code: 'EXPIRED_AUTH', message: 'JWT token expired' };
      case 2003:
        return { code: 'INVALID_API_KEY', message: 'Invalid API key' };
      case 4001:
        return { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded' };
      case 5001:
        return { code: 'EXCHANGE_UNAVAILABLE', message: 'Exchange unavailable' };
      default:
        return {
          code: 'UNKNOWN_ERROR',
          message: (err.message as string | undefined) ?? 'Unknown error occurred',
        };
    }
  }

  return { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' };
}

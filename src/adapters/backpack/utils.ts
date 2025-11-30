/**
 * Backpack utility functions for data normalization
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
  BACKPACK_ORDER_TYPES,
  BACKPACK_ORDER_SIDES,
  BACKPACK_TIME_IN_FORCE,
  BACKPACK_ORDER_STATUS,
} from './constants.js';
import type {
  BackpackMarket,
  BackpackOrder,
  BackpackPosition,
  BackpackBalance,
  BackpackOrderBook,
  BackpackTrade,
  BackpackTicker,
  BackpackFundingRate,
} from './types.js';

/**
 * Normalize Backpack symbol to unified format
 *
 * @example
 * normalizeSymbol('BTCUSDT_PERP') // 'BTC/USDT:USDT'
 * normalizeSymbol('ETHUSDT_PERP') // 'ETH/USDT:USDT'
 */
export function normalizeSymbol(backpackSymbol: string): string {
  // Backpack format: BTCUSDT_PERP, ETHUSDT_PERP
  if (backpackSymbol.endsWith('_PERP')) {
    const pair = backpackSymbol.replace('_PERP', '');
    // Extract base and quote - usually quote is USDT
    const quote = 'USDT';
    const base = pair.replace(quote, '');
    return `${base}/${quote}:${quote}`;
  }

  // Fallback for spot markets
  return backpackSymbol;
}

/**
 * Convert unified symbol to Backpack format
 *
 * @example
 * toBackpackSymbol('BTC/USDT:USDT') // 'BTCUSDT_PERP'
 * toBackpackSymbol('ETH/USDT:USDT') // 'ETHUSDT_PERP'
 */
export function toBackpackSymbol(symbol: string): string {
  const parts = symbol.split(':');

  if (parts.length === 2) {
    // Perpetual format
    const [pair = ""] = parts;
    const [base = "", quote = ""] = pair.split('/');
    return `${base}${quote}_PERP`;
  }

  // Spot format
  return symbol;
}

/**
 * Normalize Backpack market to unified format
 */
export function normalizeMarket(backpackMarket: BackpackMarket): Market {
  const symbol = normalizeSymbol(backpackMarket.symbol);

  return {
    id: backpackMarket.symbol,
    symbol,
    base: backpackMarket.base_currency,
    quote: backpackMarket.quote_currency,
    settle: backpackMarket.settlement_currency,
    active: backpackMarket.is_active,
    minAmount: parseFloat(backpackMarket.min_order_size),
    pricePrecision: countDecimals(backpackMarket.tick_size),
    amountPrecision: countDecimals(backpackMarket.step_size),
    priceTickSize: parseFloat(backpackMarket.tick_size),
    amountStepSize: parseFloat(backpackMarket.step_size),
    makerFee: parseFloat(backpackMarket.maker_fee),
    takerFee: parseFloat(backpackMarket.taker_fee),
    maxLeverage: parseFloat(backpackMarket.max_leverage),
    fundingIntervalHours: 8,
  };
}

/**
 * Normalize Backpack order to unified format
 */
export function normalizeOrder(backpackOrder: BackpackOrder): Order {
  const symbol = normalizeSymbol(backpackOrder.market);

  return {
    id: backpackOrder.order_id,
    clientOrderId: backpackOrder.client_order_id,
    symbol,
    type: normalizeOrderType(backpackOrder.type),
    side: normalizeOrderSide(backpackOrder.side),
    amount: parseFloat(backpackOrder.size),
    price: backpackOrder.price ? parseFloat(backpackOrder.price) : undefined,
    filled: parseFloat(backpackOrder.filled_size),
    remaining: parseFloat(backpackOrder.size) - parseFloat(backpackOrder.filled_size),
    averagePrice: backpackOrder.avg_price
      ? parseFloat(backpackOrder.avg_price)
      : undefined,
    status: normalizeOrderStatus(backpackOrder.status),
    timeInForce: normalizeTimeInForce(backpackOrder.time_in_force),
    postOnly: backpackOrder.post_only,
    reduceOnly: backpackOrder.reduce_only,
    timestamp: backpackOrder.created_at,
    lastUpdateTimestamp: backpackOrder.updated_at,
    info: backpackOrder as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Backpack position to unified format
 */
export function normalizePosition(backpackPosition: BackpackPosition): Position {
  const symbol = normalizeSymbol(backpackPosition.market);
  const size = parseFloat(backpackPosition.size);
  const side = backpackPosition.side === 'LONG' ? 'long' : 'short';

  return {
    symbol,
    side,
    marginMode: 'cross',
    size: Math.abs(size),
    entryPrice: parseFloat(backpackPosition.entry_price),
    markPrice: parseFloat(backpackPosition.mark_price),
    liquidationPrice: backpackPosition.liquidation_price
      ? parseFloat(backpackPosition.liquidation_price)
      : 0,
    unrealizedPnl: parseFloat(backpackPosition.unrealized_pnl),
    realizedPnl: parseFloat(backpackPosition.realized_pnl),
    margin: parseFloat(backpackPosition.margin),
    leverage: parseFloat(backpackPosition.leverage),
    maintenanceMargin: parseFloat(backpackPosition.margin) * 0.05,
    marginRatio: 0,
    timestamp: backpackPosition.timestamp,
    info: backpackPosition as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Backpack balance to unified format
 */
export function normalizeBalance(backpackBalance: BackpackBalance): Balance {
  return {
    currency: backpackBalance.asset,
    total: parseFloat(backpackBalance.total),
    free: parseFloat(backpackBalance.available),
    used: parseFloat(backpackBalance.locked),
    info: backpackBalance as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Backpack order book to unified format
 */
export function normalizeOrderBook(backpackOrderBook: BackpackOrderBook): OrderBook {
  return {
    symbol: normalizeSymbol(backpackOrderBook.market),
    exchange: 'backpack',
    bids: backpackOrderBook.bids.map(([price, size]) => [
      parseFloat(price),
      parseFloat(size),
    ]),
    asks: backpackOrderBook.asks.map(([price, size]) => [
      parseFloat(price),
      parseFloat(size),
    ]),
    timestamp: backpackOrderBook.timestamp,
  };
}

/**
 * Normalize Backpack trade to unified format
 */
export function normalizeTrade(backpackTrade: BackpackTrade): Trade {
  const price = parseFloat(backpackTrade.price);
  const amount = parseFloat(backpackTrade.size);

  return {
    id: backpackTrade.id,
    symbol: normalizeSymbol(backpackTrade.market),
    side: normalizeOrderSide(backpackTrade.side),
    price,
    amount,
    cost: price * amount,
    timestamp: backpackTrade.timestamp,
    info: backpackTrade as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Backpack ticker to unified format
 */
export function normalizeTicker(backpackTicker: BackpackTicker): Ticker {
  const last = parseFloat(backpackTicker.last_price);
  const change = parseFloat(backpackTicker.price_change_24h);
  const percentage = parseFloat(backpackTicker.price_change_percent_24h);

  return {
    symbol: normalizeSymbol(backpackTicker.market),
    last,
    open: last - change,
    close: last,
    bid: parseFloat(backpackTicker.bid),
    ask: parseFloat(backpackTicker.ask),
    high: parseFloat(backpackTicker.high_24h),
    low: parseFloat(backpackTicker.low_24h),
    change,
    percentage,
    baseVolume: parseFloat(backpackTicker.volume_24h),
    quoteVolume: 0,
    timestamp: backpackTicker.timestamp,
    info: backpackTicker as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Backpack funding rate to unified format
 */
export function normalizeFundingRate(backpackFunding: BackpackFundingRate): FundingRate {
  return {
    symbol: normalizeSymbol(backpackFunding.market),
    fundingRate: parseFloat(backpackFunding.rate),
    fundingTimestamp: backpackFunding.timestamp,
    markPrice: parseFloat(backpackFunding.mark_price),
    indexPrice: parseFloat(backpackFunding.index_price),
    nextFundingTimestamp: backpackFunding.next_funding_time,
    fundingIntervalHours: 8,
    info: backpackFunding as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Backpack order type to unified format
 */
function normalizeOrderType(backpackType: string): OrderType {
  switch (backpackType) {
    case 'MARKET':
      return 'market';
    case 'LIMIT':
    case 'POST_ONLY':
      return 'limit';
    default:
      return 'limit';
  }
}

/**
 * Normalize Backpack order side to unified format
 */
function normalizeOrderSide(backpackSide: string): OrderSide {
  return backpackSide === 'BUY' ? 'buy' : 'sell';
}

/**
 * Normalize Backpack order status to unified format
 */
function normalizeOrderStatus(backpackStatus: string): OrderStatus {
  const statusMap: Record<string, OrderStatus> = {
    NEW: 'open',
    OPEN: 'open',
    PARTIAL: 'partiallyFilled',
    FILLED: 'filled',
    CANCELLED: 'canceled',
    REJECTED: 'rejected',
  };

  return statusMap[backpackStatus] ?? 'open';
}

/**
 * Normalize Backpack time in force to unified format
 */
function normalizeTimeInForce(backpackTif: string): TimeInForce {
  switch (backpackTif) {
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
 * Convert unified order type to Backpack format
 */
export function toBackpackOrderType(type: OrderType, postOnly?: boolean): string {
  if (type === 'market') {
    return BACKPACK_ORDER_TYPES.market;
  }

  if (postOnly) {
    return BACKPACK_ORDER_TYPES.postOnly;
  }

  return BACKPACK_ORDER_TYPES.limit;
}

/**
 * Convert unified order side to Backpack format
 */
export function toBackpackOrderSide(side: OrderSide): string {
  return side === 'buy' ? BACKPACK_ORDER_SIDES.buy : BACKPACK_ORDER_SIDES.sell;
}

/**
 * Convert unified time in force to Backpack format
 */
export function toBackpackTimeInForce(tif?: TimeInForce, postOnly?: boolean): string {
  if (postOnly) {
    return BACKPACK_TIME_IN_FORCE.POST_ONLY;
  }

  switch (tif) {
    case 'IOC':
      return BACKPACK_TIME_IN_FORCE.IOC;
    case 'FOK':
      return BACKPACK_TIME_IN_FORCE.FOK;
    case 'PO':
      return BACKPACK_TIME_IN_FORCE.POST_ONLY;
    case 'GTC':
    default:
      return BACKPACK_TIME_IN_FORCE.GTC;
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
 * Map Backpack error to unified error code
 */
export function mapBackpackError(error: unknown): { code: string; message: string } {
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
        return { code: 'EXPIRED_AUTH', message: 'Authentication expired' };
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

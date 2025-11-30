/**
 * EdgeX utility functions for data normalization
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
  EDGEX_ORDER_TYPES,
  EDGEX_ORDER_SIDES,
  EDGEX_TIME_IN_FORCE,
  EDGEX_ORDER_STATUS,
} from './constants.js';
import type {
  EdgeXMarket,
  EdgeXOrder,
  EdgeXPosition,
  EdgeXBalance,
  EdgeXOrderBook,
  EdgeXTrade,
  EdgeXTicker,
  EdgeXFundingRate,
} from './types.js';

/**
 * Normalize EdgeX symbol to unified format
 *
 * @example
 * normalizeSymbol('BTC-USDC-PERP') // 'BTC/USDC:USDC'
 * normalizeSymbol('ETH-USDC-PERP') // 'ETH/USDC:USDC'
 */
export function normalizeSymbol(edgexSymbol: string): string {
  // EdgeX format: BTC-USDC-PERP, ETH-USDC-PERP
  const parts = edgexSymbol.split('-');

  if (parts.length === 3 && parts[2] === 'PERP') {
    const base = parts[0];
    const quote = parts[1];
    return `${base}/${quote}:${quote}`;
  }

  // Fallback for spot markets
  return edgexSymbol.replace('-', '/');
}

/**
 * Convert unified symbol to EdgeX format
 *
 * @example
 * toEdgeXSymbol('BTC/USDC:USDC') // 'BTC-USDC-PERP'
 * toEdgeXSymbol('ETH/USDC:USDC') // 'ETH-USDC-PERP'
 */
export function toEdgeXSymbol(symbol: string): string {
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
 * Normalize EdgeX market to unified format
 */
export function normalizeMarket(edgexMarket: EdgeXMarket): Market {
  const symbol = normalizeSymbol(edgexMarket.symbol);

  return {
    id: edgexMarket.market_id,
    symbol,
    base: edgexMarket.base_asset,
    quote: edgexMarket.quote_asset,
    settle: edgexMarket.settlement_asset,
    active: edgexMarket.is_active,
    minAmount: parseFloat(edgexMarket.min_order_size),
    pricePrecision: countDecimals(edgexMarket.tick_size),
    amountPrecision: countDecimals(edgexMarket.step_size),
    priceTickSize: parseFloat(edgexMarket.tick_size),
    amountStepSize: parseFloat(edgexMarket.step_size),
    makerFee: parseFloat(edgexMarket.maker_fee),
    takerFee: parseFloat(edgexMarket.taker_fee),
    maxLeverage: parseFloat(edgexMarket.max_leverage),
    fundingIntervalHours: 8,
  };
}

/**
 * Normalize EdgeX order to unified format
 */
export function normalizeOrder(edgexOrder: EdgeXOrder): Order {
  const symbol = normalizeSymbol(edgexOrder.market);

  return {
    id: edgexOrder.order_id,
    clientOrderId: edgexOrder.client_order_id,
    symbol,
    type: normalizeOrderType(edgexOrder.type),
    side: normalizeOrderSide(edgexOrder.side),
    amount: parseFloat(edgexOrder.size),
    price: edgexOrder.price ? parseFloat(edgexOrder.price) : undefined,
    filled: parseFloat(edgexOrder.filled_size),
    remaining: parseFloat(edgexOrder.size) - parseFloat(edgexOrder.filled_size),
    averagePrice: edgexOrder.average_price
      ? parseFloat(edgexOrder.average_price)
      : undefined,
    status: normalizeOrderStatus(edgexOrder.status),
    timeInForce: normalizeTimeInForce(edgexOrder.time_in_force),
    postOnly: edgexOrder.post_only,
    reduceOnly: edgexOrder.reduce_only,
    timestamp: edgexOrder.created_at,
    lastUpdateTimestamp: edgexOrder.updated_at,
    info: edgexOrder as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize EdgeX position to unified format
 */
export function normalizePosition(edgexPosition: EdgeXPosition): Position {
  const symbol = normalizeSymbol(edgexPosition.market);
  const size = parseFloat(edgexPosition.size);
  const side = edgexPosition.side === 'LONG' ? 'long' : 'short';

  return {
    symbol,
    side,
    marginMode: 'cross',
    size: Math.abs(size),
    entryPrice: parseFloat(edgexPosition.entry_price),
    markPrice: parseFloat(edgexPosition.mark_price),
    liquidationPrice: edgexPosition.liquidation_price
      ? parseFloat(edgexPosition.liquidation_price)
      : 0,
    unrealizedPnl: parseFloat(edgexPosition.unrealized_pnl),
    realizedPnl: parseFloat(edgexPosition.realized_pnl),
    margin: parseFloat(edgexPosition.margin),
    leverage: parseFloat(edgexPosition.leverage),
    maintenanceMargin: parseFloat(edgexPosition.margin) * 0.04,
    marginRatio: 0,
    timestamp: edgexPosition.timestamp,
    info: edgexPosition as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize EdgeX balance to unified format
 */
export function normalizeBalance(edgexBalance: EdgeXBalance): Balance {
  return {
    currency: edgexBalance.asset,
    total: parseFloat(edgexBalance.total),
    free: parseFloat(edgexBalance.available),
    used: parseFloat(edgexBalance.locked),
    info: edgexBalance as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize EdgeX order book to unified format
 */
export function normalizeOrderBook(edgexOrderBook: EdgeXOrderBook): OrderBook {
  return {
    symbol: normalizeSymbol(edgexOrderBook.market),
    exchange: 'edgex',
    bids: edgexOrderBook.bids.map(([price, size]) => [
      parseFloat(price),
      parseFloat(size),
    ]),
    asks: edgexOrderBook.asks.map(([price, size]) => [
      parseFloat(price),
      parseFloat(size),
    ]),
    timestamp: edgexOrderBook.timestamp,
  };
}

/**
 * Normalize EdgeX trade to unified format
 */
export function normalizeTrade(edgexTrade: EdgeXTrade): Trade {
  const price = parseFloat(edgexTrade.price);
  const amount = parseFloat(edgexTrade.size);

  return {
    id: edgexTrade.trade_id,
    symbol: normalizeSymbol(edgexTrade.market),
    side: normalizeOrderSide(edgexTrade.side),
    price,
    amount,
    cost: price * amount,
    timestamp: edgexTrade.timestamp,
    info: edgexTrade as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize EdgeX ticker to unified format
 */
export function normalizeTicker(edgexTicker: EdgeXTicker): Ticker {
  const last = parseFloat(edgexTicker.last_price);
  const change = parseFloat(edgexTicker.price_change_24h);
  const percentage = parseFloat(edgexTicker.price_change_percent_24h);

  return {
    symbol: normalizeSymbol(edgexTicker.market),
    last,
    open: last - change,
    close: last,
    bid: parseFloat(edgexTicker.bid),
    ask: parseFloat(edgexTicker.ask),
    high: parseFloat(edgexTicker.high_24h),
    low: parseFloat(edgexTicker.low_24h),
    change,
    percentage,
    baseVolume: parseFloat(edgexTicker.volume_24h),
    quoteVolume: 0,
    timestamp: edgexTicker.timestamp,
    info: edgexTicker as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize EdgeX funding rate to unified format
 */
export function normalizeFundingRate(edgexFunding: EdgeXFundingRate): FundingRate {
  return {
    symbol: normalizeSymbol(edgexFunding.market),
    fundingRate: parseFloat(edgexFunding.rate),
    fundingTimestamp: edgexFunding.timestamp,
    markPrice: parseFloat(edgexFunding.mark_price),
    indexPrice: parseFloat(edgexFunding.index_price),
    nextFundingTimestamp: edgexFunding.next_funding_time,
    fundingIntervalHours: 8,
    info: edgexFunding as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize EdgeX order type to unified format
 */
function normalizeOrderType(edgexType: string): OrderType {
  switch (edgexType) {
    case 'MARKET':
      return 'market';
    case 'LIMIT':
      return 'limit';
    default:
      return 'limit';
  }
}

/**
 * Normalize EdgeX order side to unified format
 */
function normalizeOrderSide(edgexSide: string): OrderSide {
  return edgexSide === 'BUY' ? 'buy' : 'sell';
}

/**
 * Normalize EdgeX order status to unified format
 */
function normalizeOrderStatus(edgexStatus: string): OrderStatus {
  const statusMap: Record<string, OrderStatus> = {
    PENDING: 'open',
    OPEN: 'open',
    PARTIALLY_FILLED: 'partiallyFilled',
    FILLED: 'filled',
    CANCELLED: 'canceled',
    REJECTED: 'rejected',
  };

  return statusMap[edgexStatus] ?? 'open';
}

/**
 * Normalize EdgeX time in force to unified format
 */
function normalizeTimeInForce(edgexTif: string): TimeInForce {
  switch (edgexTif) {
    case 'GTC':
      return 'GTC';
    case 'IOC':
      return 'IOC';
    case 'FOK':
      return 'FOK';
    default:
      return 'GTC';
  }
}

/**
 * Convert unified order type to EdgeX format
 */
export function toEdgeXOrderType(type: OrderType): string {
  return type === 'market' ? EDGEX_ORDER_TYPES.market : EDGEX_ORDER_TYPES.limit;
}

/**
 * Convert unified order side to EdgeX format
 */
export function toEdgeXOrderSide(side: OrderSide): string {
  return side === 'buy' ? EDGEX_ORDER_SIDES.buy : EDGEX_ORDER_SIDES.sell;
}

/**
 * Convert unified time in force to EdgeX format
 */
export function toEdgeXTimeInForce(tif?: TimeInForce): string {
  switch (tif) {
    case 'IOC':
      return EDGEX_TIME_IN_FORCE.IOC;
    case 'FOK':
      return EDGEX_TIME_IN_FORCE.FOK;
    case 'GTC':
    default:
      return EDGEX_TIME_IN_FORCE.GTC;
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
 * Map EdgeX error to unified error code
 */
export function mapEdgeXError(error: unknown): { code: string; message: string } {
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

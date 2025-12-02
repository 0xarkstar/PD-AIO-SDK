/**
 * Lighter utility functions for data transformation and normalization
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
  OrderRequest,
} from '../../types/common.js';
import {
  PerpDEXError,
  InvalidOrderError,
  InsufficientMarginError,
  RateLimitError,
  ExchangeUnavailableError,
  InvalidSignatureError,
} from '../../types/errors.js';
import type {
  LighterMarket,
  LighterOrder,
  LighterPosition,
  LighterBalance,
  LighterOrderBook,
  LighterTrade,
  LighterTicker,
  LighterFundingRate,
} from './types.js';

/**
 * Convert unified symbol to Lighter format
 * BTC/USDT:USDT -> BTC-USDT-PERP
 */
export function toLighterSymbol(symbol: string): string {
  // Handle unified format: BTC/USDT:USDT -> BTC-USDT-PERP
  if (symbol.includes('/')) {
    const [base] = symbol.split('/');
    return `${base}-USDT-PERP`;
  }
  // Already in Lighter format or just base currency
  if (symbol.includes('-PERP')) {
    return symbol;
  }
  return `${symbol}-USDT-PERP`;
}

/**
 * Convert Lighter symbol to unified format
 * BTC-USDT-PERP -> BTC/USDT:USDT
 */
export function normalizeSymbol(lighterSymbol: string): string {
  // BTC-USDT-PERP -> BTC/USDT:USDT
  const parts = lighterSymbol.split('-');
  if (parts.length >= 2) {
    const base = parts[0];
    const quote = parts[1];
    return `${base}/${quote}:${quote}`;
  }
  return lighterSymbol;
}

/**
 * Normalize Lighter market to unified format
 */
export function normalizeMarket(lighterMarket: LighterMarket): Market {
  const symbol = normalizeSymbol(lighterMarket.symbol);
  const [baseQuote, settle] = symbol.split(':');
  const [base, quote] = (baseQuote || '').split('/');

  // Calculate precision from tick/step sizes
  const pricePrecision = Math.abs(Math.log10(lighterMarket.tickSize));
  const amountPrecision = Math.abs(Math.log10(lighterMarket.stepSize));

  return {
    id: lighterMarket.symbol,
    symbol,
    base: base || '',
    quote: quote || '',
    settle: settle || '',
    active: lighterMarket.active,
    minAmount: lighterMarket.minOrderSize,
    maxAmount: lighterMarket.maxOrderSize,
    pricePrecision,
    amountPrecision,
    priceTickSize: lighterMarket.tickSize,
    amountStepSize: lighterMarket.stepSize,
    makerFee: lighterMarket.makerFee,
    takerFee: lighterMarket.takerFee,
    maxLeverage: lighterMarket.maxLeverage,
    fundingIntervalHours: 8,
    info: lighterMarket as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Lighter order to unified format
 */
export function normalizeOrder(lighterOrder: LighterOrder): Order {
  return {
    id: lighterOrder.orderId,
    clientOrderId: lighterOrder.clientOrderId,
    symbol: normalizeSymbol(lighterOrder.symbol),
    type: lighterOrder.type,
    side: lighterOrder.side,
    price: lighterOrder.price,
    amount: lighterOrder.size,
    filled: lighterOrder.filledSize,
    remaining: lighterOrder.size - lighterOrder.filledSize,
    status: mapOrderStatus(lighterOrder.status),
    timestamp: lighterOrder.timestamp,
    reduceOnly: lighterOrder.reduceOnly,
    postOnly: false,
    info: lighterOrder as unknown as Record<string, unknown>,
  };
}

/**
 * Map Lighter order status to unified status
 */
function mapOrderStatus(
  status: 'open' | 'filled' | 'cancelled' | 'partially_filled'
): 'open' | 'closed' | 'canceled' {
  switch (status) {
    case 'open':
    case 'partially_filled':
      return 'open';
    case 'filled':
      return 'closed';
    case 'cancelled':
      return 'canceled';
    default:
      return 'open';
  }
}

/**
 * Normalize Lighter position to unified format
 */
export function normalizePosition(lighterPosition: LighterPosition): Position {
  return {
    symbol: normalizeSymbol(lighterPosition.symbol),
    side: lighterPosition.side,
    size: lighterPosition.size,
    entryPrice: lighterPosition.entryPrice,
    markPrice: lighterPosition.markPrice,
    liquidationPrice: lighterPosition.liquidationPrice,
    unrealizedPnl: lighterPosition.unrealizedPnl,
    realizedPnl: 0,
    margin: lighterPosition.margin,
    maintenanceMargin: 0,
    marginRatio: 0,
    leverage: lighterPosition.leverage,
    marginMode: 'cross',
    timestamp: Date.now(),
    info: lighterPosition as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Lighter balance to unified format
 */
export function normalizeBalance(lighterBalance: LighterBalance): Balance {
  return {
    currency: lighterBalance.currency,
    total: lighterBalance.total,
    free: lighterBalance.available,
    used: lighterBalance.reserved,
    info: lighterBalance as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Lighter order book to unified format
 */
export function normalizeOrderBook(lighterOrderBook: LighterOrderBook): OrderBook {
  return {
    exchange: 'lighter',
    symbol: normalizeSymbol(lighterOrderBook.symbol),
    bids: lighterOrderBook.bids,
    asks: lighterOrderBook.asks,
    timestamp: lighterOrderBook.timestamp,
  };
}

/**
 * Normalize Lighter trade to unified format
 */
export function normalizeTrade(lighterTrade: LighterTrade): Trade {
  return {
    id: lighterTrade.id,
    symbol: normalizeSymbol(lighterTrade.symbol),
    side: lighterTrade.side,
    price: lighterTrade.price,
    amount: lighterTrade.amount,
    cost: lighterTrade.price * lighterTrade.amount,
    timestamp: lighterTrade.timestamp,
    info: lighterTrade as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Lighter ticker to unified format
 */
export function normalizeTicker(lighterTicker: LighterTicker): Ticker {
  return {
    symbol: normalizeSymbol(lighterTicker.symbol),
    last: lighterTicker.last,
    open: lighterTicker.low,
    close: lighterTicker.last,
    bid: lighterTicker.bid,
    ask: lighterTicker.ask,
    high: lighterTicker.high,
    low: lighterTicker.low,
    change: 0,
    percentage: 0,
    baseVolume: lighterTicker.volume,
    quoteVolume: lighterTicker.volume * lighterTicker.last,
    timestamp: lighterTicker.timestamp,
    info: lighterTicker as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize Lighter funding rate to unified format
 */
export function normalizeFundingRate(lighterFundingRate: LighterFundingRate): FundingRate {
  return {
    symbol: normalizeSymbol(lighterFundingRate.symbol),
    fundingRate: lighterFundingRate.fundingRate,
    fundingTimestamp: Date.now(),
    fundingIntervalHours: 8,
    nextFundingTimestamp: lighterFundingRate.nextFundingTime,
    markPrice: lighterFundingRate.markPrice,
    indexPrice: lighterFundingRate.markPrice,
    info: lighterFundingRate as unknown as Record<string, unknown>,
  };
}

/**
 * Convert unified order request to Lighter format
 */
export function convertOrderRequest(
  request: OrderRequest,
  lighterSymbol: string
): Record<string, unknown> {
  const order: Record<string, unknown> = {
    symbol: lighterSymbol,
    side: request.side,
    type: request.type,
    quantity: request.amount,
  };

  if (request.price !== undefined) {
    order.price = request.price;
  }

  if (request.clientOrderId) {
    order.clientOrderId = request.clientOrderId;
  }

  if (request.reduceOnly) {
    order.reduceOnly = true;
  }

  if (request.postOnly) {
    order.timeInForce = 'PO'; // Post-only
  } else if (request.timeInForce) {
    order.timeInForce = request.timeInForce;
  }

  return order;
}

/**
 * Map Lighter errors to unified error types
 */
export function mapError(error: unknown): PerpDEXError {
  if (error instanceof PerpDEXError) {
    return error;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorLower = errorMessage.toLowerCase();
  const originalError = error instanceof Error ? error : undefined;

  // Rate limit errors
  if (errorLower.includes('rate limit') || errorLower.includes('too many requests')) {
    return new RateLimitError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 'lighter', undefined, originalError);
  }

  // Insufficient margin
  if (
    errorLower.includes('insufficient') &&
    (errorLower.includes('margin') || errorLower.includes('balance'))
  ) {
    return new InsufficientMarginError(
      'Insufficient margin for order',
      'INSUFFICIENT_MARGIN',
      'lighter',
      originalError
    );
  }

  // Invalid order errors
  if (
    errorLower.includes('invalid order') ||
    errorLower.includes('order size') ||
    errorLower.includes('price')
  ) {
    return new InvalidOrderError('Invalid order parameters', 'INVALID_ORDER', 'lighter', originalError);
  }

  // Authentication errors
  if (
    errorLower.includes('unauthorized') ||
    errorLower.includes('invalid signature') ||
    errorLower.includes('api key')
  ) {
    return new InvalidSignatureError(
      'Authentication failed',
      'INVALID_SIGNATURE',
      'lighter',
      originalError
    );
  }

  // Exchange unavailable
  if (
    errorLower.includes('timeout') ||
    errorLower.includes('network') ||
    errorLower.includes('unavailable')
  ) {
    return new ExchangeUnavailableError(
      'Exchange temporarily unavailable',
      'EXCHANGE_UNAVAILABLE',
      'lighter',
      originalError
    );
  }

  // Default to generic exchange error
  return new ExchangeUnavailableError(
    'Unknown exchange error',
    'UNKNOWN_ERROR',
    'lighter',
    originalError
  );
}

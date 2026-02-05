/**
 * Order Helpers
 *
 * Utility functions for creating common order types.
 * Provides CCXT-compatible convenience methods.
 */

import type { OrderRequest, OrderSide, OrderType } from '../../types/common.js';

/**
 * Create a limit buy order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param price - Limit price
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export function createLimitBuyOrderRequest(
  symbol: string,
  amount: number,
  price: number,
  params?: Record<string, unknown>
): OrderRequest {
  return {
    symbol,
    type: 'limit' as OrderType,
    side: 'buy' as OrderSide,
    amount,
    price,
    ...params,
  };
}

/**
 * Create a limit sell order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param price - Limit price
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export function createLimitSellOrderRequest(
  symbol: string,
  amount: number,
  price: number,
  params?: Record<string, unknown>
): OrderRequest {
  return {
    symbol,
    type: 'limit' as OrderType,
    side: 'sell' as OrderSide,
    amount,
    price,
    ...params,
  };
}

/**
 * Create a market buy order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export function createMarketBuyOrderRequest(
  symbol: string,
  amount: number,
  params?: Record<string, unknown>
): OrderRequest {
  return {
    symbol,
    type: 'market' as OrderType,
    side: 'buy' as OrderSide,
    amount,
    ...params,
  };
}

/**
 * Create a market sell order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export function createMarketSellOrderRequest(
  symbol: string,
  amount: number,
  params?: Record<string, unknown>
): OrderRequest {
  return {
    symbol,
    type: 'market' as OrderType,
    side: 'sell' as OrderSide,
    amount,
    ...params,
  };
}

/**
 * Create a stop loss order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param stopPrice - Stop trigger price
 * @param side - Order side (defaults to 'sell' for stop loss)
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export function createStopLossOrderRequest(
  symbol: string,
  amount: number,
  stopPrice: number,
  side: OrderSide = 'sell',
  params?: Record<string, unknown>
): OrderRequest {
  return {
    symbol,
    type: 'stopMarket' as OrderType,
    side,
    amount,
    stopPrice,
    reduceOnly: true,
    ...params,
  };
}

/**
 * Create a take profit order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param takeProfitPrice - Take profit price
 * @param side - Order side (defaults to 'sell' for take profit)
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export function createTakeProfitOrderRequest(
  symbol: string,
  amount: number,
  takeProfitPrice: number,
  side: OrderSide = 'sell',
  params?: Record<string, unknown>
): OrderRequest {
  return {
    symbol,
    type: 'limit' as OrderType,
    side,
    amount,
    price: takeProfitPrice,
    reduceOnly: true,
    ...params,
  };
}

/**
 * Create a stop limit order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param price - Limit price
 * @param stopPrice - Stop trigger price
 * @param side - Order side
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export function createStopLimitOrderRequest(
  symbol: string,
  amount: number,
  price: number,
  stopPrice: number,
  side: OrderSide,
  params?: Record<string, unknown>
): OrderRequest {
  return {
    symbol,
    type: 'stopLimit' as OrderType,
    side,
    amount,
    price,
    stopPrice,
    ...params,
  };
}

/**
 * Create a trailing stop order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param trailingDelta - Trailing distance (percentage or absolute)
 * @param side - Order side
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export function createTrailingStopOrderRequest(
  symbol: string,
  amount: number,
  trailingDelta: number,
  side: OrderSide = 'sell',
  params?: Record<string, unknown>
): OrderRequest {
  return {
    symbol,
    type: 'trailingStop' as OrderType,
    side,
    amount,
    reduceOnly: true,
    trailingDelta,
    ...params,
  } as OrderRequest;
}

/**
 * Validate an order request
 *
 * @param request - Order request to validate
 * @returns true if valid
 * @throws Error if invalid
 */
export function validateOrderRequest(request: OrderRequest): boolean {
  if (!request.symbol) {
    throw new Error('Order request must have a symbol');
  }

  if (!request.side || !['buy', 'sell'].includes(request.side)) {
    throw new Error('Order request must have a valid side (buy/sell)');
  }

  if (!request.type) {
    throw new Error('Order request must have a type');
  }

  if (typeof request.amount !== 'number' || request.amount <= 0) {
    throw new Error('Order request must have a positive amount');
  }

  if (request.type === 'limit' && (typeof request.price !== 'number' || request.price <= 0)) {
    throw new Error('Limit order must have a positive price');
  }

  if (
    (request.type === 'stopMarket' || request.type === 'stopLimit') &&
    (typeof request.stopPrice !== 'number' || request.stopPrice <= 0)
  ) {
    throw new Error('Stop order must have a positive stop price');
  }

  return true;
}

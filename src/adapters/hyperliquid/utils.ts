/**
 * Hyperliquid Utility Functions
 *
 * Helper functions for order conversion and error mapping.
 * Normalization functions have been moved to HyperliquidNormalizer.ts
 */

import {
  ExchangeUnavailableError,
  InsufficientMarginError,
  InvalidOrderError,
  InvalidSignatureError,
  OrderNotFoundError,
  PerpDEXError,
  PositionNotFoundError,
  RateLimitError,
} from '../../types/errors.js';
import type { OrderRequest } from '../../types/index.js';
import { HYPERLIQUID_ERROR_MESSAGES } from './constants.js';
import type { HyperliquidOrderRequest } from './types.js';

// =============================================================================
// Order Request Conversion
// =============================================================================

/**
 * Convert unified order request to Hyperliquid format
 *
 * This is a conversion utility, not a normalization function.
 * It transforms outgoing order requests from unified format to Hyperliquid's API format.
 *
 * @param request - Unified order request
 * @param exchangeSymbol - Hyperliquid symbol (e.g., "BTC-PERP")
 * @returns Hyperliquid order request
 */
export function convertOrderRequest(
  request: OrderRequest,
  exchangeSymbol: string
): HyperliquidOrderRequest {
  const isBuy = request.side === 'buy';

  // Determine order type
  let orderType: HyperliquidOrderRequest['order_type'];

  if (request.type === 'market') {
    orderType = { market: {} };
  } else {
    // Default to GTC for limit orders
    let tif: 'Gtc' | 'Ioc' | 'Alo' = 'Gtc';

    if (request.timeInForce === 'IOC') {
      tif = 'Ioc';
    } else if (request.postOnly) {
      tif = 'Alo'; // Post-only = Add Liquidity Only
    }

    orderType = { limit: { tif } };
  }

  return {
    coin: exchangeSymbol,
    is_buy: isBuy,
    sz: request.amount,
    limit_px: request.price ?? 0,
    order_type: orderType,
    reduce_only: request.reduceOnly ?? false,
    cloid: request.clientOrderId,
  };
}

// =============================================================================
// Error Mapping
// =============================================================================

/**
 * Map Hyperliquid errors to unified error types
 *
 * @param error - Error from Hyperliquid API
 * @returns Unified PerpDEXError
 */
export function mapError(error: unknown): PerpDEXError {
  if (error instanceof PerpDEXError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check known error patterns
    for (const [pattern, code] of Object.entries(HYPERLIQUID_ERROR_MESSAGES)) {
      if (message.includes(pattern)) {
        switch (code) {
          case 'INSUFFICIENT_MARGIN':
            return new InsufficientMarginError(error.message, code, 'hyperliquid', error);
          case 'INVALID_SIGNATURE':
            return new InvalidSignatureError(error.message, code, 'hyperliquid', error);
          case 'ORDER_WOULD_MATCH':
            return new InvalidOrderError(error.message, code, 'hyperliquid', error);
          case 'POSITION_NOT_FOUND':
            return new PositionNotFoundError(error.message, code, 'hyperliquid', error);
          case 'ORDER_NOT_FOUND':
            return new OrderNotFoundError(error.message, code, 'hyperliquid', error);
          case 'RATE_LIMIT_EXCEEDED':
            return new RateLimitError(error.message, code, 'hyperliquid', undefined, error);
        }
      }
    }

    // HTTP status code errors
    if (message.includes('429')) {
      return new RateLimitError('Rate limit exceeded', 'RATE_LIMIT', 'hyperliquid', undefined, error);
    }

    if (message.includes('503') || message.includes('502')) {
      return new ExchangeUnavailableError(
        'Exchange temporarily unavailable',
        'EXCHANGE_DOWN',
        'hyperliquid',
        error
      );
    }
  }

  // Default to generic exchange error
  return new ExchangeUnavailableError(
    'Unknown exchange error',
    'UNKNOWN_ERROR',
    'hyperliquid',
    error
  );
}

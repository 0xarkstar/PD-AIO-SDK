/**
 * Paradex Error Handling
 *
 * Provides error code constants and mapping functions for Paradex-specific errors.
 * Translates Paradex API error responses to unified SDK error types.
 *
 * @see https://docs.paradex.trade/api/errors
 */

import { includesValue } from '../../utils/type-guards.js';
import {
  PerpDEXError,
  InvalidOrderError,
  InsufficientMarginError,
  OrderNotFoundError,
  InvalidSignatureError,
  RateLimitError,
  ExchangeUnavailableError,
} from '../../types/errors.js';

/**
 * Paradex Client Error Codes
 */
export const PARADEX_CLIENT_ERRORS = {
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  INVALID_ORDER: 'INVALID_ORDER',
  INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  INVALID_PARAMS: 'INVALID_PARAMS',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

/**
 * Paradex Server Error Codes
 */
export const PARADEX_SERVER_ERRORS = {
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
} as const;

/**
 * Paradex Rate Limit Error
 */
export const PARADEX_RATE_LIMIT_ERROR = 'RATE_LIMIT_EXCEEDED';

/**
 * Map Paradex error to unified SDK error type
 */
export function mapParadexError(
  errorCode: string,
  message: string,
  originalError?: any
): PerpDEXError {
  switch (errorCode) {
    case PARADEX_CLIENT_ERRORS.INSUFFICIENT_MARGIN:
      return new InsufficientMarginError(message, errorCode, 'paradex', originalError);

    case PARADEX_CLIENT_ERRORS.INVALID_SIGNATURE:
    case PARADEX_CLIENT_ERRORS.UNAUTHORIZED:
      return new InvalidSignatureError(message, errorCode, 'paradex', originalError);

    case PARADEX_CLIENT_ERRORS.INVALID_ORDER:
    case PARADEX_CLIENT_ERRORS.INVALID_PARAMS:
      return new InvalidOrderError(message, errorCode, 'paradex', originalError);

    case PARADEX_CLIENT_ERRORS.ORDER_NOT_FOUND:
      return new OrderNotFoundError(message, errorCode, 'paradex', originalError);

    case PARADEX_RATE_LIMIT_ERROR:
      return new RateLimitError(message, errorCode, 'paradex', undefined, originalError);

    default:
      if (includesValue(Object.values(PARADEX_SERVER_ERRORS), errorCode)) {
        return new ExchangeUnavailableError(message, errorCode, 'paradex', originalError);
      }
      return new PerpDEXError(message, errorCode, 'paradex', originalError);
  }
}

/**
 * Map error from unknown type
 */
export function mapError(error: unknown): PerpDEXError {
  if (error instanceof PerpDEXError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const originalError = error instanceof Error ? error : undefined;

  // Extract error code from message if possible
  const messageLower = message.toLowerCase();
  let errorCode = 'UNKNOWN_ERROR';

  if (messageLower.includes('signature')) {
    errorCode = PARADEX_CLIENT_ERRORS.INVALID_SIGNATURE;
  } else if (messageLower.includes('margin') || messageLower.includes('insufficient')) {
    errorCode = PARADEX_CLIENT_ERRORS.INSUFFICIENT_MARGIN;
  } else if (messageLower.includes('not found')) {
    errorCode = PARADEX_CLIENT_ERRORS.ORDER_NOT_FOUND;
  } else if (messageLower.includes('rate limit')) {
    errorCode = PARADEX_RATE_LIMIT_ERROR;
  }

  return mapParadexError(errorCode, message, originalError);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(errorCode: string): boolean {
  return (
    includesValue(Object.values(PARADEX_SERVER_ERRORS), errorCode) ||
    errorCode === PARADEX_RATE_LIMIT_ERROR
  );
}

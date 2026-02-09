/**
 * Variational Error Codes
 *
 * Error code definitions and mapping functions for Variational exchange
 */

import { includesValue } from '../../utils/type-guards.js';
import {
  PerpDEXError,
  InsufficientMarginError,
  InvalidOrderError,
  OrderNotFoundError,
  InvalidSignatureError,
  RateLimitError,
  ExchangeUnavailableError,
  NetworkError,
} from '../../types/errors.js';

/**
 * Variational client error codes (4xx)
 */
export const VARIATIONAL_CLIENT_ERRORS = {
  INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  INVALID_ORDER: 'INVALID_ORDER',
  INVALID_SYMBOL: 'INVALID_SYMBOL',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INVALID_PRICE: 'INVALID_PRICE',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  POSITION_NOT_FOUND: 'POSITION_NOT_FOUND',
  QUOTE_NOT_FOUND: 'QUOTE_NOT_FOUND',
  QUOTE_EXPIRED: 'QUOTE_EXPIRED',
  INVALID_API_KEY: 'INVALID_API_KEY',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
} as const;

/**
 * Variational server error codes (5xx)
 */
export const VARIATIONAL_SERVER_ERRORS = {
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  MATCHING_ENGINE_ERROR: 'MATCHING_ENGINE_ERROR',
} as const;

/**
 * Variational rate limit error
 */
export const VARIATIONAL_RATE_LIMIT_ERROR = 'RATE_LIMIT_EXCEEDED';

/**
 * HTTP status code to error code mapping
 */
export const VARIATIONAL_HTTP_ERROR_CODES: Record<number, string> = {
  400: VARIATIONAL_CLIENT_ERRORS.INVALID_ORDER,
  401: VARIATIONAL_CLIENT_ERRORS.UNAUTHORIZED,
  403: VARIATIONAL_CLIENT_ERRORS.FORBIDDEN,
  404: VARIATIONAL_CLIENT_ERRORS.ORDER_NOT_FOUND,
  429: VARIATIONAL_RATE_LIMIT_ERROR,
  500: VARIATIONAL_SERVER_ERRORS.INTERNAL_ERROR,
  502: VARIATIONAL_SERVER_ERRORS.SERVICE_UNAVAILABLE,
  503: VARIATIONAL_SERVER_ERRORS.SERVICE_UNAVAILABLE,
  504: VARIATIONAL_SERVER_ERRORS.TIMEOUT,
};

/**
 * Error message to error code mapping
 */
export const VARIATIONAL_ERROR_MESSAGES: Record<string, string> = {
  'insufficient margin': VARIATIONAL_CLIENT_ERRORS.INSUFFICIENT_MARGIN,
  'insufficient balance': VARIATIONAL_CLIENT_ERRORS.INSUFFICIENT_MARGIN,
  'invalid signature': VARIATIONAL_CLIENT_ERRORS.INVALID_SIGNATURE,
  'signature verification failed': VARIATIONAL_CLIENT_ERRORS.INVALID_SIGNATURE,
  'invalid order': VARIATIONAL_CLIENT_ERRORS.INVALID_ORDER,
  'invalid symbol': VARIATIONAL_CLIENT_ERRORS.INVALID_SYMBOL,
  'invalid amount': VARIATIONAL_CLIENT_ERRORS.INVALID_AMOUNT,
  'invalid price': VARIATIONAL_CLIENT_ERRORS.INVALID_PRICE,
  'order not found': VARIATIONAL_CLIENT_ERRORS.ORDER_NOT_FOUND,
  'quote not found': VARIATIONAL_CLIENT_ERRORS.QUOTE_NOT_FOUND,
  'quote expired': VARIATIONAL_CLIENT_ERRORS.QUOTE_EXPIRED,
  'rate limit exceeded': VARIATIONAL_RATE_LIMIT_ERROR,
  'too many requests': VARIATIONAL_RATE_LIMIT_ERROR,
  'internal server error': VARIATIONAL_SERVER_ERRORS.INTERNAL_ERROR,
  'service unavailable': VARIATIONAL_SERVER_ERRORS.SERVICE_UNAVAILABLE,
  timeout: VARIATIONAL_SERVER_ERRORS.TIMEOUT,
  'matching engine error': VARIATIONAL_SERVER_ERRORS.MATCHING_ENGINE_ERROR,
};

/**
 * Check if error code is a client error
 */
export function isClientError(code: string): boolean {
  return includesValue(Object.values(VARIATIONAL_CLIENT_ERRORS), code);
}

/**
 * Check if error code is a server error
 */
export function isServerError(code: string): boolean {
  return includesValue(Object.values(VARIATIONAL_SERVER_ERRORS), code);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(code: string): boolean {
  // Server errors and rate limit errors are retryable
  return isServerError(code) || code === VARIATIONAL_RATE_LIMIT_ERROR;
}

/**
 * Extract error code from error message
 */
export function extractErrorCode(message: string): string {
  const lowerMessage = message.toLowerCase();

  for (const [keyword, code] of Object.entries(VARIATIONAL_ERROR_MESSAGES)) {
    if (lowerMessage.includes(keyword)) {
      return code;
    }
  }

  return 'UNKNOWN_ERROR';
}

/**
 * Extract error code from HTTP status
 */
export function extractErrorCodeFromStatus(status: number): string {
  return VARIATIONAL_HTTP_ERROR_CODES[status] || 'UNKNOWN_ERROR';
}

/**
 * Map Variational error to unified PerpDEXError
 */
export function mapVariationalError(
  code: string | number,
  message: string,
  context?: Record<string, unknown>
): PerpDEXError {
  // If code is a number, it's an HTTP status
  const errorCode = typeof code === 'number' ? extractErrorCodeFromStatus(code) : code;

  // Map to specific error types
  switch (errorCode) {
    case VARIATIONAL_CLIENT_ERRORS.INSUFFICIENT_MARGIN:
      return new InsufficientMarginError(message, errorCode, 'variational', context);

    case VARIATIONAL_CLIENT_ERRORS.INVALID_SIGNATURE:
    case VARIATIONAL_CLIENT_ERRORS.INVALID_API_KEY:
    case VARIATIONAL_CLIENT_ERRORS.UNAUTHORIZED:
      return new InvalidSignatureError(message, errorCode, 'variational', context);

    case VARIATIONAL_CLIENT_ERRORS.INVALID_ORDER:
    case VARIATIONAL_CLIENT_ERRORS.INVALID_SYMBOL:
    case VARIATIONAL_CLIENT_ERRORS.INVALID_AMOUNT:
    case VARIATIONAL_CLIENT_ERRORS.INVALID_PRICE:
    case VARIATIONAL_CLIENT_ERRORS.QUOTE_EXPIRED:
      return new InvalidOrderError(message, errorCode, 'variational', context);

    case VARIATIONAL_CLIENT_ERRORS.ORDER_NOT_FOUND:
    case VARIATIONAL_CLIENT_ERRORS.QUOTE_NOT_FOUND:
      return new OrderNotFoundError(message, errorCode, 'variational', context);

    case VARIATIONAL_RATE_LIMIT_ERROR:
      return new RateLimitError(message, errorCode, 'variational', undefined, context);

    case VARIATIONAL_SERVER_ERRORS.SERVICE_UNAVAILABLE:
    case VARIATIONAL_SERVER_ERRORS.TIMEOUT:
      return new ExchangeUnavailableError(message, errorCode, 'variational', context);

    case VARIATIONAL_SERVER_ERRORS.INTERNAL_ERROR:
    case VARIATIONAL_SERVER_ERRORS.MATCHING_ENGINE_ERROR:
      return new NetworkError(message, errorCode, 'variational', context);

    default:
      return new PerpDEXError(message, errorCode, 'variational', context);
  }
}

/**
 * Map HTTP response to error
 */
export function mapHTTPError(status: number, body: any): PerpDEXError {
  const message = body?.message || body?.error || `HTTP ${status}`;
  const errorCode = body?.code || extractErrorCodeFromStatus(status);

  return mapVariationalError(errorCode, message, {
    httpStatus: status,
    responseBody: body,
  });
}

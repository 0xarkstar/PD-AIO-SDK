/**
 * Extended Error Codes
 *
 * Error code definitions and mapping functions for Extended exchange
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
 * Extended client error codes (4xx)
 */
export const EXTENDED_CLIENT_ERRORS = {
  INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_API_KEY: 'INVALID_API_KEY',
  INVALID_ORDER: 'INVALID_ORDER',
  INVALID_SYMBOL: 'INVALID_SYMBOL',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  INVALID_PRICE: 'INVALID_PRICE',
  INVALID_LEVERAGE: 'INVALID_LEVERAGE',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  POSITION_NOT_FOUND: 'POSITION_NOT_FOUND',
  LEVERAGE_TOO_HIGH: 'LEVERAGE_TOO_HIGH',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  MARKET_CLOSED: 'MARKET_CLOSED',
  LIQUIDATION_RISK: 'LIQUIDATION_RISK',
} as const;

/**
 * Extended server error codes (5xx)
 */
export const EXTENDED_SERVER_ERRORS = {
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  MATCHING_ENGINE_ERROR: 'MATCHING_ENGINE_ERROR',
  STARKNET_ERROR: 'STARKNET_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

/**
 * Extended rate limit error
 */
export const EXTENDED_RATE_LIMIT_ERROR = 'RATE_LIMIT_EXCEEDED';

/**
 * Extended StarkNet-specific errors
 */
export const EXTENDED_STARKNET_ERRORS = {
  TRANSACTION_FAILED: 'STARKNET_TRANSACTION_FAILED',
  INVALID_SIGNATURE: 'STARKNET_INVALID_SIGNATURE',
  INSUFFICIENT_FUNDS: 'STARKNET_INSUFFICIENT_FUNDS',
  CONTRACT_ERROR: 'STARKNET_CONTRACT_ERROR',
  NONCE_MISMATCH: 'STARKNET_NONCE_MISMATCH',
} as const;

/**
 * HTTP status code to error code mapping
 */
export const EXTENDED_HTTP_ERROR_CODES: Record<number, string> = {
  400: EXTENDED_CLIENT_ERRORS.INVALID_ORDER,
  401: EXTENDED_CLIENT_ERRORS.UNAUTHORIZED,
  403: EXTENDED_CLIENT_ERRORS.FORBIDDEN,
  404: EXTENDED_CLIENT_ERRORS.ORDER_NOT_FOUND,
  429: EXTENDED_RATE_LIMIT_ERROR,
  500: EXTENDED_SERVER_ERRORS.INTERNAL_ERROR,
  502: EXTENDED_SERVER_ERRORS.SERVICE_UNAVAILABLE,
  503: EXTENDED_SERVER_ERRORS.SERVICE_UNAVAILABLE,
  504: EXTENDED_SERVER_ERRORS.TIMEOUT,
};

/**
 * Error message to error code mapping
 */
export const EXTENDED_ERROR_MESSAGES: Record<string, string> = {
  'insufficient margin': EXTENDED_CLIENT_ERRORS.INSUFFICIENT_MARGIN,
  'insufficient balance': EXTENDED_CLIENT_ERRORS.INSUFFICIENT_BALANCE,
  'invalid api key': EXTENDED_CLIENT_ERRORS.INVALID_API_KEY,
  'api key invalid': EXTENDED_CLIENT_ERRORS.INVALID_API_KEY,
  'invalid order': EXTENDED_CLIENT_ERRORS.INVALID_ORDER,
  'invalid symbol': EXTENDED_CLIENT_ERRORS.INVALID_SYMBOL,
  'invalid quantity': EXTENDED_CLIENT_ERRORS.INVALID_QUANTITY,
  'invalid price': EXTENDED_CLIENT_ERRORS.INVALID_PRICE,
  'invalid leverage': EXTENDED_CLIENT_ERRORS.INVALID_LEVERAGE,
  'leverage too high': EXTENDED_CLIENT_ERRORS.LEVERAGE_TOO_HIGH,
  'order not found': EXTENDED_CLIENT_ERRORS.ORDER_NOT_FOUND,
  'position not found': EXTENDED_CLIENT_ERRORS.POSITION_NOT_FOUND,
  'market closed': EXTENDED_CLIENT_ERRORS.MARKET_CLOSED,
  'liquidation risk': EXTENDED_CLIENT_ERRORS.LIQUIDATION_RISK,
  'rate limit exceeded': EXTENDED_RATE_LIMIT_ERROR,
  'too many requests': EXTENDED_RATE_LIMIT_ERROR,
  'internal server error': EXTENDED_SERVER_ERRORS.INTERNAL_ERROR,
  'service unavailable': EXTENDED_SERVER_ERRORS.SERVICE_UNAVAILABLE,
  timeout: EXTENDED_SERVER_ERRORS.TIMEOUT,
  'matching engine error': EXTENDED_SERVER_ERRORS.MATCHING_ENGINE_ERROR,
  'starknet error': EXTENDED_SERVER_ERRORS.STARKNET_ERROR,
  'transaction failed': EXTENDED_STARKNET_ERRORS.TRANSACTION_FAILED,
  'starknet transaction failed': EXTENDED_STARKNET_ERRORS.TRANSACTION_FAILED,
  'contract error': EXTENDED_STARKNET_ERRORS.CONTRACT_ERROR,
  'nonce mismatch': EXTENDED_STARKNET_ERRORS.NONCE_MISMATCH,
};

/**
 * Check if error code is a client error
 */
export function isClientError(code: string): boolean {
  return includesValue(Object.values(EXTENDED_CLIENT_ERRORS), code);
}

/**
 * Check if error code is a server error
 */
export function isServerError(code: string): boolean {
  return includesValue(Object.values(EXTENDED_SERVER_ERRORS), code);
}

/**
 * Check if error code is a StarkNet error
 */
export function isStarkNetError(code: string): boolean {
  return includesValue(Object.values(EXTENDED_STARKNET_ERRORS), code);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(code: string): boolean {
  // Server errors, rate limit errors, and some StarkNet errors are retryable
  return (
    isServerError(code) ||
    code === EXTENDED_RATE_LIMIT_ERROR ||
    code === EXTENDED_STARKNET_ERRORS.NONCE_MISMATCH
  );
}

/**
 * Extract error code from error message
 */
export function extractErrorCode(message: string): string {
  const lowerMessage = message.toLowerCase();

  for (const [keyword, code] of Object.entries(EXTENDED_ERROR_MESSAGES)) {
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
  return EXTENDED_HTTP_ERROR_CODES[status] || 'UNKNOWN_ERROR';
}

/**
 * Map Extended error to unified PerpDEXError
 */
export function mapExtendedError(
  code: string | number,
  message: string,
  context?: Record<string, unknown>
): PerpDEXError {
  // If code is a number, it's an HTTP status
  const errorCode = typeof code === 'number' ? extractErrorCodeFromStatus(code) : code;

  // Map to specific error types
  switch (errorCode) {
    case EXTENDED_CLIENT_ERRORS.INSUFFICIENT_MARGIN:
    case EXTENDED_CLIENT_ERRORS.INSUFFICIENT_BALANCE:
    case EXTENDED_CLIENT_ERRORS.LIQUIDATION_RISK:
      return new InsufficientMarginError(message, errorCode, 'extended', context);

    case EXTENDED_CLIENT_ERRORS.INVALID_API_KEY:
    case EXTENDED_CLIENT_ERRORS.UNAUTHORIZED:
    case EXTENDED_STARKNET_ERRORS.INVALID_SIGNATURE:
      return new InvalidSignatureError(message, errorCode, 'extended', context);

    case EXTENDED_CLIENT_ERRORS.INVALID_ORDER:
    case EXTENDED_CLIENT_ERRORS.INVALID_SYMBOL:
    case EXTENDED_CLIENT_ERRORS.INVALID_QUANTITY:
    case EXTENDED_CLIENT_ERRORS.INVALID_PRICE:
    case EXTENDED_CLIENT_ERRORS.INVALID_LEVERAGE:
    case EXTENDED_CLIENT_ERRORS.LEVERAGE_TOO_HIGH:
    case EXTENDED_CLIENT_ERRORS.MARKET_CLOSED:
      return new InvalidOrderError(message, errorCode, 'extended', context);

    case EXTENDED_CLIENT_ERRORS.ORDER_NOT_FOUND:
    case EXTENDED_CLIENT_ERRORS.POSITION_NOT_FOUND:
      return new OrderNotFoundError(message, errorCode, 'extended', context);

    case EXTENDED_RATE_LIMIT_ERROR:
      return new RateLimitError(message, errorCode, 'extended', undefined, context);

    case EXTENDED_SERVER_ERRORS.SERVICE_UNAVAILABLE:
    case EXTENDED_SERVER_ERRORS.TIMEOUT:
      return new ExchangeUnavailableError(message, errorCode, 'extended', context);

    case EXTENDED_SERVER_ERRORS.INTERNAL_ERROR:
    case EXTENDED_SERVER_ERRORS.MATCHING_ENGINE_ERROR:
    case EXTENDED_SERVER_ERRORS.DATABASE_ERROR:
    case EXTENDED_SERVER_ERRORS.STARKNET_ERROR:
    case EXTENDED_STARKNET_ERRORS.TRANSACTION_FAILED:
    case EXTENDED_STARKNET_ERRORS.CONTRACT_ERROR:
      return new NetworkError(message, errorCode, 'extended', context);

    default:
      return new PerpDEXError(message, errorCode, 'extended', context);
  }
}

/**
 * Map HTTP response to error
 */
export function mapHTTPError(status: number, body: any): PerpDEXError {
  const message = body?.message || body?.error || `HTTP ${status}`;

  // First try to get error code from response body
  let errorCode = body?.code;

  // If no code in body, try to extract from message content (more specific)
  if (!errorCode) {
    errorCode = extractErrorCode(message);
  }

  // If still no match, fall back to HTTP status code mapping
  if (errorCode === 'UNKNOWN_ERROR') {
    errorCode = extractErrorCodeFromStatus(status);
  }

  return mapExtendedError(errorCode, message, {
    httpStatus: status,
    responseBody: body,
  });
}

/**
 * Map StarkNet error to PerpDEXError
 */
export function mapStarkNetError(error: any): PerpDEXError {
  const message = error?.message || String(error);
  const code = extractErrorCode(message);

  return mapExtendedError(code, message, {
    starknetError: error,
    isStarkNetError: true,
  });
}

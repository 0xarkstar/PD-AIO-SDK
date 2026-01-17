/**
 * Backpack Error Handling
 *
 * Provides error code constants and mapping functions for Backpack-specific errors.
 * Translates Backpack API error responses to unified SDK error types.
 *
 * @see https://docs.backpack.exchange/api-reference/errors
 */

import {
  PerpDEXError,
  InvalidOrderError,
  InsufficientMarginError,
  OrderNotFoundError,
  PositionNotFoundError,
  InvalidSignatureError,
  ExpiredAuthError,
  RateLimitError,
  ExchangeUnavailableError,
} from '../../types/errors.js';

/**
 * Backpack Client Error Codes (1xxx - 2xxx)
 * These errors indicate client-side issues and should NOT be retried.
 */
export const BACKPACK_CLIENT_ERRORS = {
  // Order Errors (1xxx)
  INVALID_ORDER: 1001,
  INSUFFICIENT_MARGIN: 1002,
  ORDER_NOT_FOUND: 1003,
  POSITION_NOT_FOUND: 1004,
  INVALID_PRICE: 1005,
  INVALID_AMOUNT: 1006,
  MIN_SIZE_NOT_MET: 1007,
  MAX_SIZE_EXCEEDED: 1008,
  MARKET_CLOSED: 1009,
  INVALID_SYMBOL: 1010,

  // Authentication Errors (2xxx)
  INVALID_SIGNATURE: 2001,
  EXPIRED_AUTH: 2002,
  INVALID_API_KEY: 2003,
  MISSING_API_KEY: 2004,
  INSUFFICIENT_PERMISSIONS: 2005,
  INVALID_NONCE: 2006,

  // Validation Errors (3xxx)
  INVALID_PARAMS: 3001,
  MISSING_REQUIRED_FIELD: 3002,
  INVALID_FIELD_VALUE: 3003,
} as const;

/**
 * Backpack Rate Limit Error (4xxx)
 * Should be retried with exponential backoff.
 */
export const BACKPACK_RATE_LIMIT_ERROR = 4001;

/**
 * Backpack Server Error Codes (5xxx)
 * These errors indicate server-side issues and MAY be retried with backoff.
 */
export const BACKPACK_SERVER_ERRORS = {
  EXCHANGE_UNAVAILABLE: 5001,
  INTERNAL_ERROR: 5002,
  SERVICE_UNAVAILABLE: 5003,
  TIMEOUT: 5004,
  DATABASE_ERROR: 5005,
} as const;

/**
 * Backpack Network Errors
 * Connection and network-related errors that may be transient.
 */
export const BACKPACK_NETWORK_ERRORS = {
  ECONNRESET: 'ECONNRESET',
  ETIMEDOUT: 'ETIMEDOUT',
  ENOTFOUND: 'ENOTFOUND',
  ECONNREFUSED: 'ECONNREFUSED',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

/**
 * Check if an error code indicates a client error (non-retryable)
 *
 * @param errorCode - Error code to check
 * @returns true if client error
 */
export function isClientError(errorCode: number | string): boolean {
  const code = typeof errorCode === 'number' ? errorCode : parseInt(errorCode, 10);
  return (
    Object.values(BACKPACK_CLIENT_ERRORS).includes(code as any) ||
    (code >= 1000 && code < 4000)
  );
}

/**
 * Check if an error code indicates a server error (retryable)
 *
 * @param errorCode - Error code to check
 * @returns true if server error
 */
export function isServerError(errorCode: number | string): boolean {
  const code = typeof errorCode === 'number' ? errorCode : parseInt(errorCode, 10);
  return Object.values(BACKPACK_SERVER_ERRORS).includes(code as any) || code >= 5000;
}

/**
 * Check if an error code indicates a network error (retryable)
 *
 * @param errorCode - Error code to check
 * @returns true if network error
 */
export function isNetworkError(errorCode: string): boolean {
  return Object.values(BACKPACK_NETWORK_ERRORS).includes(errorCode as any);
}

/**
 * Check if an error should be retried
 *
 * @param errorCode - Error code to check
 * @returns true if retryable
 */
export function isRetryableError(errorCode: number | string): boolean {
  const code = typeof errorCode === 'number' ? errorCode : parseInt(errorCode, 10);
  return (
    isServerError(errorCode) ||
    (typeof errorCode === 'string' && isNetworkError(errorCode)) ||
    code === BACKPACK_RATE_LIMIT_ERROR
  );
}

/**
 * Map Backpack error code and message to unified SDK error type
 *
 * @param errorCode - Backpack error code (string or number)
 * @param message - Error message
 * @param originalError - Original error object (optional)
 * @returns Mapped PerpDEXError subclass
 *
 * @example
 * ```typescript
 * const backpackResponse = {
 *   code: 1002,
 *   message: 'Insufficient margin to place order',
 * };
 *
 * const error = mapBackpackError(
 *   backpackResponse.code,
 *   backpackResponse.message
 * );
 *
 * if (error instanceof InsufficientMarginError) {
 *   console.log('Need more collateral');
 * }
 * ```
 */
export function mapBackpackError(
  errorCode: string | number,
  message: string,
  originalError?: any
): PerpDEXError {
  const code = typeof errorCode === 'number' ? errorCode : parseInt(errorCode, 10);

  // Order Errors
  if (code === BACKPACK_CLIENT_ERRORS.INSUFFICIENT_MARGIN) {
    return new InsufficientMarginError(message, code.toString(), 'backpack', originalError);
  }

  if (code === BACKPACK_CLIENT_ERRORS.ORDER_NOT_FOUND) {
    return new OrderNotFoundError(message, code.toString(), 'backpack', originalError);
  }

  if (code === BACKPACK_CLIENT_ERRORS.POSITION_NOT_FOUND) {
    return new PositionNotFoundError(message, code.toString(), 'backpack', originalError);
  }

  if (
    code === BACKPACK_CLIENT_ERRORS.INVALID_ORDER ||
    code === BACKPACK_CLIENT_ERRORS.INVALID_PRICE ||
    code === BACKPACK_CLIENT_ERRORS.INVALID_AMOUNT ||
    code === BACKPACK_CLIENT_ERRORS.MIN_SIZE_NOT_MET ||
    code === BACKPACK_CLIENT_ERRORS.MAX_SIZE_EXCEEDED
  ) {
    return new InvalidOrderError(message, code.toString(), 'backpack', originalError);
  }

  // Authentication Errors
  if (code === BACKPACK_CLIENT_ERRORS.INVALID_SIGNATURE) {
    return new InvalidSignatureError(message, code.toString(), 'backpack', originalError);
  }

  if (code === BACKPACK_CLIENT_ERRORS.EXPIRED_AUTH) {
    return new ExpiredAuthError(message, code.toString(), 'backpack', originalError);
  }

  // Rate Limit
  if (code === BACKPACK_RATE_LIMIT_ERROR) {
    return new RateLimitError(message, code.toString(), 'backpack', undefined, originalError);
  }

  // Server/Network Errors (service unavailable)
  if (isServerError(code)) {
    return new ExchangeUnavailableError(message, code.toString(), 'backpack', originalError);
  }

  // Network errors
  if (typeof errorCode === 'string' && isNetworkError(errorCode)) {
    return new ExchangeUnavailableError(message, errorCode, 'backpack', originalError);
  }

  // Default: Generic PerpDEXError
  return new PerpDEXError(message, code.toString(), 'backpack', originalError);
}

/**
 * Extract error information from Backpack API response
 *
 * @param response - Backpack API response object
 * @returns Error code and message
 */
export function extractBackpackError(response: any): {
  code: number | string;
  message: string;
} {
  const code = response.code ?? response.error_code ?? 'UNKNOWN_ERROR';
  const message = response.message || response.error || 'Unknown error occurred';

  return { code, message };
}

/**
 * Map HTTP status code to error
 *
 * @param status - HTTP status code
 * @param statusText - HTTP status text
 * @returns Mapped error
 */
export function mapHttpError(status: number, statusText: string): PerpDEXError {
  // 429 Rate Limit
  if (status === 429) {
    return new RateLimitError(
      `Rate limit exceeded: ${statusText}`,
      BACKPACK_RATE_LIMIT_ERROR.toString(),
      'backpack',
      undefined  // retryAfter parameter
    );
  }

  // 4xx Client Errors
  if (status >= 400 && status < 500) {
    return new InvalidOrderError(
      `Client error (${status}): ${statusText}`,
      `HTTP_${status}`,
      'backpack'
    );
  }

  // 5xx Server Errors
  if (status >= 500) {
    return new ExchangeUnavailableError(
      `Server error (${status}): ${statusText}`,
      `HTTP_${status}`,
      'backpack'
    );
  }

  // Other
  return new PerpDEXError(
    `HTTP error (${status}): ${statusText}`,
    `HTTP_${status}`,
    'backpack'
  );
}

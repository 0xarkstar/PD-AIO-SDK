/**
 * Paradex Error Handling
 *
 * Provides error code constants and mapping functions for Paradex-specific errors.
 * Translates Paradex API error responses to unified SDK error types.
 *
 * @see https://docs.paradex.trade/api/errors
 */

import {
  PerpDEXError,
  InvalidOrderError,
  InsufficientMarginError,
  OrderNotFoundError,
  InvalidSignatureError,
  RateLimitError,
  ExchangeUnavailableError,
  ExpiredAuthError,
  InsufficientPermissionsError,
  PositionNotFoundError,
} from '../../types/errors.js';

/**
 * Paradex Client Error Codes (1xxx, 2xxx)
 * These errors indicate client-side issues and should NOT be retried.
 */
export const PARADEX_CLIENT_ERRORS = {
  // Order Errors (1xxx)
  INVALID_ORDER: 1001,
  INSUFFICIENT_MARGIN: 1002,
  ORDER_NOT_FOUND: 1003,
  POSITION_NOT_FOUND: 1004,
  INVALID_SIZE: 1005,
  INVALID_PRICE: 1006,
  MIN_SIZE_NOT_MET: 1007,
  MAX_SIZE_EXCEEDED: 1008,
  PRICE_OUT_OF_RANGE: 1009,
  SELF_TRADE: 1010,
  ORDER_ALREADY_FILLED: 1011,
  ORDER_ALREADY_CANCELLED: 1012,
  REDUCE_ONLY_VIOLATION: 1013,
  POST_ONLY_VIOLATION: 1014,
  INVALID_TIME_IN_FORCE: 1015,

  // Market/Instrument Errors (1xxx)
  INVALID_MARKET: 1020,
  MARKET_NOT_ACTIVE: 1021,
  MARKET_CLOSED: 1022,
  TRADING_HALTED: 1023,

  // Leverage/Margin Errors (1xxx)
  INVALID_LEVERAGE: 1030,
  MAX_LEVERAGE_EXCEEDED: 1031,
  INSUFFICIENT_BALANCE: 1032,
  MAX_POSITION_EXCEEDED: 1033,

  // Authentication & Authorization (2xxx)
  INVALID_SIGNATURE: 2001,
  EXPIRED_AUTH: 2002, // JWT expired
  INVALID_API_KEY: 2003,
  UNAUTHORIZED: 2004,
  FORBIDDEN: 2005,
  INVALID_REQUEST: 2006,

  // Validation Errors (2xxx)
  INVALID_PARAMS: 2010,
  MISSING_REQUIRED_FIELD: 2011,
  INVALID_TIMESTAMP: 2012,
  NONCE_TOO_LOW: 2013,
  NONCE_TOO_HIGH: 2014,
} as const;

/**
 * Paradex Rate Limit Error (4xxx)
 */
export const PARADEX_RATE_LIMIT_ERROR = 4001;

/**
 * Paradex Server Error Codes (5xxx)
 * These errors indicate server-side issues and MAY be retried with backoff.
 */
export const PARADEX_SERVER_ERRORS = {
  INTERNAL_ERROR: 5001,
  SERVICE_UNAVAILABLE: 5002,
  GATEWAY_TIMEOUT: 5003,
  DATABASE_ERROR: 5004,
  MATCHING_ENGINE_ERROR: 5005,
  SEQUENCER_ERROR: 5006,
  MAINTENANCE_MODE: 5007,
} as const;

/**
 * Paradex Network Errors
 * Connection and network-related errors that may be transient.
 */
export const PARADEX_NETWORK_ERRORS = {
  ECONNRESET: 'ECONNRESET',
  ETIMEDOUT: 'ETIMEDOUT',
  ENOTFOUND: 'ENOTFOUND',
  ECONNREFUSED: 'ECONNREFUSED',
  ECONNABORTED: 'ECONNABORTED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  WEBSOCKET_CLOSED: 'WEBSOCKET_CLOSED',
  WEBSOCKET_ERROR: 'WEBSOCKET_ERROR',
} as const;

/**
 * Check if an error code indicates a client error (non-retryable)
 *
 * @param code - Error code to check
 * @returns true if client error
 */
export function isClientError(code: string | number): boolean {
  const numericCode = typeof code === 'string' ? parseInt(code, 10) : code;
  if (isNaN(numericCode)) return false;

  return (
    (Object.values(PARADEX_CLIENT_ERRORS) as number[]).includes(numericCode) ||
    (numericCode >= 1000 && numericCode < 3000) ||
    (numericCode >= 400 && numericCode < 500)
  );
}

/**
 * Check if an error code indicates a server error (retryable)
 *
 * @param code - Error code to check
 * @returns true if server error
 */
export function isServerError(code: string | number): boolean {
  const numericCode = typeof code === 'string' ? parseInt(code, 10) : code;
  if (isNaN(numericCode)) return false;

  return (
    (Object.values(PARADEX_SERVER_ERRORS) as number[]).includes(numericCode) ||
    (numericCode >= 5000 && numericCode < 6000) ||
    (numericCode >= 500 && numericCode < 600)
  );
}

/**
 * Check if an error code indicates a network error (retryable)
 *
 * @param code - Error code to check
 * @returns true if network error
 */
export function isNetworkError(code: string): boolean {
  return Object.values(PARADEX_NETWORK_ERRORS).includes(code as any);
}

/**
 * Check if an error should be retried
 *
 * @param code - Error code to check
 * @returns true if retryable
 */
export function isRetryableError(code: string | number): boolean {
  const numericCode = typeof code === 'string' ? parseInt(code, 10) : code;

  return (
    isServerError(code) ||
    isNetworkError(code.toString()) ||
    numericCode === PARADEX_RATE_LIMIT_ERROR
  );
}

/**
 * Map Paradex error code and message to unified SDK error type
 *
 * @param errorCode - Paradex error code (string or number)
 * @param message - Error message
 * @param originalError - Original error object (optional)
 * @returns Mapped PerpDEXError subclass
 *
 * @example
 * ```typescript
 * const paradexResponse = {
 *   error: {
 *     code: 1002,
 *     message: 'Insufficient margin to place order',
 *   },
 * };
 *
 * const error = mapParadexError(
 *   paradexResponse.error.code,
 *   paradexResponse.error.message
 * );
 *
 * if (error instanceof InsufficientMarginError) {
 *   console.log('Need more collateral');
 * }
 * ```
 */
export function mapParadexError(
  errorCode: string | number,
  message: string,
  originalError?: any
): PerpDEXError {
  const numericCode = typeof errorCode === 'string' ? parseInt(errorCode, 10) : errorCode;
  const codeStr = errorCode.toString();

  // Authentication & Signature Errors (2xxx)
  if (
    numericCode === PARADEX_CLIENT_ERRORS.INVALID_SIGNATURE ||
    numericCode === PARADEX_CLIENT_ERRORS.INVALID_API_KEY
  ) {
    return new InvalidSignatureError(message, codeStr, 'paradex', originalError);
  }

  // Expired JWT Token
  if (numericCode === PARADEX_CLIENT_ERRORS.EXPIRED_AUTH) {
    return new ExpiredAuthError(message, codeStr, 'paradex', originalError);
  }

  // Permission Errors
  if (
    numericCode === PARADEX_CLIENT_ERRORS.UNAUTHORIZED ||
    numericCode === PARADEX_CLIENT_ERRORS.FORBIDDEN
  ) {
    return new InsufficientPermissionsError(message, codeStr, 'paradex', originalError);
  }

  // Insufficient Margin/Balance
  if (
    numericCode === PARADEX_CLIENT_ERRORS.INSUFFICIENT_MARGIN ||
    numericCode === PARADEX_CLIENT_ERRORS.INSUFFICIENT_BALANCE
  ) {
    return new InsufficientMarginError(message, codeStr, 'paradex', originalError);
  }

  // Order Not Found
  if (numericCode === PARADEX_CLIENT_ERRORS.ORDER_NOT_FOUND) {
    return new OrderNotFoundError(message, codeStr, 'paradex', originalError);
  }

  // Position Not Found
  if (numericCode === PARADEX_CLIENT_ERRORS.POSITION_NOT_FOUND) {
    return new PositionNotFoundError(message, codeStr, 'paradex', originalError);
  }

  // Invalid Order (general category)
  if (
    numericCode === PARADEX_CLIENT_ERRORS.INVALID_ORDER ||
    numericCode === PARADEX_CLIENT_ERRORS.INVALID_SIZE ||
    numericCode === PARADEX_CLIENT_ERRORS.INVALID_PRICE ||
    numericCode === PARADEX_CLIENT_ERRORS.MIN_SIZE_NOT_MET ||
    numericCode === PARADEX_CLIENT_ERRORS.MAX_SIZE_EXCEEDED ||
    numericCode === PARADEX_CLIENT_ERRORS.PRICE_OUT_OF_RANGE ||
    numericCode === PARADEX_CLIENT_ERRORS.SELF_TRADE ||
    numericCode === PARADEX_CLIENT_ERRORS.ORDER_ALREADY_FILLED ||
    numericCode === PARADEX_CLIENT_ERRORS.ORDER_ALREADY_CANCELLED ||
    numericCode === PARADEX_CLIENT_ERRORS.REDUCE_ONLY_VIOLATION ||
    numericCode === PARADEX_CLIENT_ERRORS.POST_ONLY_VIOLATION ||
    numericCode === PARADEX_CLIENT_ERRORS.INVALID_TIME_IN_FORCE ||
    numericCode === PARADEX_CLIENT_ERRORS.INVALID_MARKET ||
    numericCode === PARADEX_CLIENT_ERRORS.MARKET_NOT_ACTIVE ||
    numericCode === PARADEX_CLIENT_ERRORS.MARKET_CLOSED ||
    numericCode === PARADEX_CLIENT_ERRORS.TRADING_HALTED ||
    numericCode === PARADEX_CLIENT_ERRORS.INVALID_LEVERAGE ||
    numericCode === PARADEX_CLIENT_ERRORS.MAX_LEVERAGE_EXCEEDED ||
    numericCode === PARADEX_CLIENT_ERRORS.MAX_POSITION_EXCEEDED
  ) {
    return new InvalidOrderError(message, codeStr, 'paradex', originalError);
  }

  // Rate Limit
  if (numericCode === PARADEX_RATE_LIMIT_ERROR) {
    const retryAfter = extractRetryAfter(originalError);
    return new RateLimitError(message, codeStr, 'paradex', retryAfter, originalError);
  }

  // Server/Network Errors (service unavailable)
  if (isServerError(numericCode) || isNetworkError(codeStr)) {
    return new ExchangeUnavailableError(message, codeStr, 'paradex', originalError);
  }

  // Default: Generic PerpDEXError
  return new PerpDEXError(message, codeStr, 'paradex', originalError);
}

/**
 * Extract error information from Paradex API response
 *
 * @param response - Paradex API response object
 * @returns Error code and message
 */
export function extractParadexError(response: any): {
  code: string;
  message: string;
} {
  // Handle null/undefined
  if (!response) {
    return { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' };
  }

  // Paradex uses { code, message } or { error: { code, message } } format
  const errorObj = response.error || response;

  // Handle case where error is a string
  if (typeof errorObj === 'string') {
    return { code: 'UNKNOWN_ERROR', message: errorObj };
  }

  const code = errorObj.code?.toString() || 'UNKNOWN_ERROR';
  const message = errorObj.message || errorObj.error || 'Unknown error occurred';

  return { code, message };
}

/**
 * Map HTTP status code to error
 *
 * @param status - HTTP status code
 * @param statusText - HTTP status text
 * @param responseData - Optional response data
 * @returns Mapped error
 */
export function mapHttpError(
  status: number,
  statusText: string,
  responseData?: any
): PerpDEXError {
  // Try to extract Paradex error from response
  if (responseData && (responseData.error || responseData.code)) {
    const { code, message } = extractParadexError(responseData);
    return mapParadexError(code, message, responseData);
  }

  // 401 Unauthorized
  if (status === 401) {
    return new InvalidSignatureError(
      `Unauthorized: ${statusText}`,
      'UNAUTHORIZED',
      'paradex'
    );
  }

  // 403 Forbidden
  if (status === 403) {
    return new InsufficientPermissionsError(
      `Forbidden: ${statusText}`,
      'FORBIDDEN',
      'paradex'
    );
  }

  // 404 Not Found
  if (status === 404) {
    return new OrderNotFoundError(`Not found: ${statusText}`, 'NOT_FOUND', 'paradex');
  }

  // 429 Rate Limit
  if (status === 429) {
    const retryAfter = extractRetryAfter(responseData);
    return new RateLimitError(
      `Rate limit exceeded: ${statusText}`,
      PARADEX_RATE_LIMIT_ERROR.toString(),
      'paradex',
      retryAfter
    );
  }

  // 4xx Client Errors
  if (status >= 400 && status < 500) {
    return new InvalidOrderError(
      `Client error (${status}): ${statusText}`,
      `HTTP_${status}`,
      'paradex'
    );
  }

  // 503 Service Unavailable
  if (status === 503) {
    return new ExchangeUnavailableError(
      `Service unavailable: ${statusText}`,
      'SERVICE_UNAVAILABLE',
      'paradex'
    );
  }

  // 5xx Server Errors
  if (status >= 500) {
    return new ExchangeUnavailableError(
      `Server error (${status}): ${statusText}`,
      `HTTP_${status}`,
      'paradex'
    );
  }

  // Other
  return new PerpDEXError(
    `HTTP error (${status}): ${statusText}`,
    `HTTP_${status}`,
    'paradex'
  );
}

/**
 * Map axios error to PerpDEXError
 *
 * @param error - Axios error object
 * @returns Mapped error
 */
export function mapAxiosError(error: any): PerpDEXError {
  // HTTP errors with response (check FIRST - takes precedence)
  if (error.response) {
    const { status, statusText, data } = error.response;
    return mapHttpError(status, statusText, data);
  }

  // Network errors
  if (error.code && isNetworkError(error.code)) {
    return new ExchangeUnavailableError(
      error.message || 'Network error occurred',
      error.code,
      'paradex',
      error
    );
  }

  // Request timeout
  if (error.code === 'ECONNABORTED') {
    return new ExchangeUnavailableError(
      'Request timeout',
      'ETIMEDOUT',
      'paradex',
      error
    );
  }

  // Generic error
  return new PerpDEXError(
    error.message || 'Unknown error occurred',
    error.code || 'UNKNOWN_ERROR',
    'paradex',
    error
  );
}

/**
 * Extract retry-after value from error response
 *
 * @param error - Error object or response data
 * @returns Retry-after value in seconds, or undefined
 */
function extractRetryAfter(error: any): number | undefined {
  if (!error) return undefined;

  // Check headers
  if (error.headers && error.headers['retry-after']) {
    const value = parseInt(error.headers['retry-after'], 10);
    return isNaN(value) ? undefined : value;
  }

  // Check response headers
  if (error.response && error.response.headers && error.response.headers['retry-after']) {
    const value = parseInt(error.response.headers['retry-after'], 10);
    return isNaN(value) ? undefined : value;
  }

  // Check data.retryAfter or data.retry_after
  if (error.retryAfter || error.retry_after) {
    const value = parseInt(error.retryAfter || error.retry_after, 10);
    return isNaN(value) ? undefined : value;
  }

  return undefined;
}

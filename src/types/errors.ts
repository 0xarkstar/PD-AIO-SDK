/**
 * Error Hierarchy for Perp DEX SDK
 *
 * All errors extend PerpDEXError with exchange context
 */

/**
 * Base error class for all SDK errors
 */
export class PerpDEXError extends Error {
  /** Correlation ID for request tracing */
  public correlationId?: string;

  constructor(
    message: string,
    public readonly code: string,
    public readonly exchange: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'PerpDEXError';
    Object.setPrototypeOf(this, PerpDEXError.prototype);
  }

  /**
   * Set correlation ID for this error
   */
  withCorrelationId(correlationId: string): this {
    this.correlationId = correlationId;
    return this;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      exchange: this.exchange,
      correlationId: this.correlationId,
      originalError: this.originalError,
    };
  }
}

// =============================================================================
// General Exchange Errors (CCXT-compatible)
// =============================================================================

/**
 * General exchange error - base for exchange-specific errors
 */
export class ExchangeError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'ExchangeError';
    Object.setPrototypeOf(this, ExchangeError.prototype);
  }
}

/**
 * Feature not supported by exchange
 */
export class NotSupportedError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'NotSupportedError';
    Object.setPrototypeOf(this, NotSupportedError.prototype);
  }
}

/**
 * Bad request - malformed or invalid request parameters
 */
export class BadRequestError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'BadRequestError';
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * Bad response - invalid or unexpected API response
 */
export class BadResponseError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'BadResponseError';
    Object.setPrototypeOf(this, BadResponseError.prototype);
  }
}

/**
 * General authentication error
 */
export class AuthenticationError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

// =============================================================================
// Trading Errors
// =============================================================================

export class InsufficientMarginError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'InsufficientMarginError';
    Object.setPrototypeOf(this, InsufficientMarginError.prototype);
  }
}

export class OrderNotFoundError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'OrderNotFoundError';
    Object.setPrototypeOf(this, OrderNotFoundError.prototype);
  }
}

export class InvalidOrderError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'InvalidOrderError';
    Object.setPrototypeOf(this, InvalidOrderError.prototype);
  }
}

export class PositionNotFoundError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'PositionNotFoundError';
    Object.setPrototypeOf(this, PositionNotFoundError.prototype);
  }
}

// =============================================================================
// Network Errors
// =============================================================================

export class NetworkError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class RateLimitError extends PerpDEXError {
  constructor(
    message: string,
    code: string,
    exchange: string,
    public readonly retryAfter?: number,
    originalError?: unknown
  ) {
    super(message, code, exchange, originalError);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class ExchangeUnavailableError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'ExchangeUnavailableError';
    Object.setPrototypeOf(this, ExchangeUnavailableError.prototype);
  }
}

export class WebSocketDisconnectedError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'WebSocketDisconnectedError';
    Object.setPrototypeOf(this, WebSocketDisconnectedError.prototype);
  }
}

// =============================================================================
// Authentication Errors
// =============================================================================

export class InvalidSignatureError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'InvalidSignatureError';
    Object.setPrototypeOf(this, InvalidSignatureError.prototype);
  }
}

export class ExpiredAuthError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'ExpiredAuthError';
    Object.setPrototypeOf(this, ExpiredAuthError.prototype);
  }
}

export class InsufficientPermissionsError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'InsufficientPermissionsError';
    Object.setPrototypeOf(this, InsufficientPermissionsError.prototype);
  }
}

// =============================================================================
// Validation Errors
// =============================================================================

export class ValidationError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class InvalidSymbolError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'InvalidSymbolError';
    Object.setPrototypeOf(this, InvalidSymbolError.prototype);
  }
}

export class InvalidParameterError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'InvalidParameterError';
    Object.setPrototypeOf(this, InvalidParameterError.prototype);
  }
}

// =============================================================================
// Timeout Errors
// =============================================================================

export class TimeoutError extends PerpDEXError {
  constructor(
    message: string,
    code: string,
    exchange: string,
    public readonly timeoutMs?: number,
    originalError?: unknown
  ) {
    super(message, code, exchange, originalError);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class RequestTimeoutError extends TimeoutError {
  constructor(
    message: string,
    code: string,
    exchange: string,
    timeoutMs?: number,
    originalError?: unknown
  ) {
    super(message, code, exchange, timeoutMs, originalError);
    this.name = 'RequestTimeoutError';
    Object.setPrototypeOf(this, RequestTimeoutError.prototype);
  }
}

// =============================================================================
// Order Execution Errors
// =============================================================================

export class InsufficientBalanceError extends PerpDEXError {
  constructor(
    message: string,
    code: string,
    exchange: string,
    public readonly required?: number,
    public readonly available?: number,
    originalError?: unknown
  ) {
    super(message, code, exchange, originalError);
    this.name = 'InsufficientBalanceError';
    Object.setPrototypeOf(this, InsufficientBalanceError.prototype);
  }
}

export class OrderRejectedError extends PerpDEXError {
  constructor(
    message: string,
    code: string,
    exchange: string,
    public readonly reason?: string,
    originalError?: unknown
  ) {
    super(message, code, exchange, originalError);
    this.name = 'OrderRejectedError';
    Object.setPrototypeOf(this, OrderRejectedError.prototype);
  }
}

export class MinimumOrderSizeError extends PerpDEXError {
  constructor(
    message: string,
    code: string,
    exchange: string,
    public readonly minSize?: number,
    public readonly requestedSize?: number,
    originalError?: unknown
  ) {
    super(message, code, exchange, originalError);
    this.name = 'MinimumOrderSizeError';
    Object.setPrototypeOf(this, MinimumOrderSizeError.prototype);
  }
}

// =============================================================================
// DEX-Specific Errors
// =============================================================================

export class TransactionFailedError extends PerpDEXError {
  constructor(
    message: string,
    code: string,
    exchange: string,
    public readonly txHash?: string,
    originalError?: unknown
  ) {
    super(message, code, exchange, originalError);
    this.name = 'TransactionFailedError';
    Object.setPrototypeOf(this, TransactionFailedError.prototype);
  }
}

export class SlippageExceededError extends PerpDEXError {
  constructor(
    message: string,
    code: string,
    exchange: string,
    public readonly expectedPrice: number,
    public readonly actualPrice: number,
    originalError?: unknown
  ) {
    super(message, code, exchange, originalError);
    this.name = 'SlippageExceededError';
    Object.setPrototypeOf(this, SlippageExceededError.prototype);
  }
}

export class LiquidationError extends PerpDEXError {
  constructor(message: string, code: string, exchange: string, originalError?: unknown) {
    super(message, code, exchange, originalError);
    this.name = 'LiquidationError';
    Object.setPrototypeOf(this, LiquidationError.prototype);
  }
}

// =============================================================================
// Type Guards
// =============================================================================

export function isPerpDEXError(error: unknown): error is PerpDEXError {
  return error instanceof PerpDEXError;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

export function isAuthError(
  error: unknown
): error is InvalidSignatureError | ExpiredAuthError | InsufficientPermissionsError {
  return (
    error instanceof InvalidSignatureError ||
    error instanceof ExpiredAuthError ||
    error instanceof InsufficientPermissionsError
  );
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isExchangeError(error: unknown): error is ExchangeError {
  return error instanceof ExchangeError;
}

export function isNotSupportedError(error: unknown): error is NotSupportedError {
  return error instanceof NotSupportedError;
}

export function isBadRequestError(error: unknown): error is BadRequestError {
  return error instanceof BadRequestError;
}

export function isBadResponseError(error: unknown): error is BadResponseError {
  return error instanceof BadResponseError;
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isOrderError(
  error: unknown
): error is InvalidOrderError | OrderNotFoundError | OrderRejectedError {
  return (
    error instanceof InvalidOrderError ||
    error instanceof OrderNotFoundError ||
    error instanceof OrderRejectedError
  );
}

export function isTradingError(
  error: unknown
): error is InsufficientMarginError | InsufficientBalanceError | LiquidationError {
  return (
    error instanceof InsufficientMarginError ||
    error instanceof InsufficientBalanceError ||
    error instanceof LiquidationError
  );
}

// =============================================================================
// Standard Error Codes
// =============================================================================

/**
 * Standardized error codes used across all adapters.
 * When mapping exchange-specific errors, prefer using these standard codes.
 */
export const StandardErrorCodes = {
  // Generic
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  NOT_SUPPORTED: 'NOT_SUPPORTED',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  EXCHANGE_ERROR: 'EXCHANGE_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  BAD_RESPONSE: 'BAD_RESPONSE',

  // Authentication
  MISSING_CREDENTIALS: 'MISSING_CREDENTIALS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  EXPIRED_AUTH: 'EXPIRED_AUTH',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  EXCHANGE_UNAVAILABLE: 'EXCHANGE_UNAVAILABLE',
  WEBSOCKET_DISCONNECTED: 'WEBSOCKET_DISCONNECTED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_SYMBOL: 'INVALID_SYMBOL',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  INVALID_ORDER_TYPE: 'INVALID_ORDER_TYPE',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INVALID_PRICE: 'INVALID_PRICE',

  // Order Errors
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_REJECTED: 'ORDER_REJECTED',
  ORDER_ALREADY_FILLED: 'ORDER_ALREADY_FILLED',
  ORDER_ALREADY_CANCELLED: 'ORDER_ALREADY_CANCELLED',
  INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  MIN_ORDER_SIZE: 'MIN_ORDER_SIZE',
  MAX_ORDER_SIZE: 'MAX_ORDER_SIZE',
  PRICE_OUT_OF_RANGE: 'PRICE_OUT_OF_RANGE',

  // Position Errors
  POSITION_NOT_FOUND: 'POSITION_NOT_FOUND',
  MAX_LEVERAGE_EXCEEDED: 'MAX_LEVERAGE_EXCEEDED',
  REDUCE_ONLY_VIOLATION: 'REDUCE_ONLY_VIOLATION',

  // DEX-Specific
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  SLIPPAGE_EXCEEDED: 'SLIPPAGE_EXCEEDED',
  LIQUIDATION: 'LIQUIDATION',
  NONCE_ERROR: 'NONCE_ERROR',
} as const;

export type StandardErrorCode = (typeof StandardErrorCodes)[keyof typeof StandardErrorCodes];

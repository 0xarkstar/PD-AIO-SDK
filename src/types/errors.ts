/**
 * Error Hierarchy for Perp DEX SDK
 *
 * All errors extend PerpDEXError with exchange context
 */

/**
 * Base error class for all SDK errors
 */
export class PerpDEXError extends Error {
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

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      exchange: this.exchange,
      originalError: this.originalError,
    };
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

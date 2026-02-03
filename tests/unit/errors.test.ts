/**
 * Error Types Unit Tests
 *
 * Tests for all error classes and type guards in the SDK
 */

import {
  PerpDEXError,
  ExchangeError,
  NotSupportedError,
  BadRequestError,
  BadResponseError,
  AuthenticationError,
  InsufficientMarginError,
  OrderNotFoundError,
  InvalidOrderError,
  PositionNotFoundError,
  NetworkError,
  RateLimitError,
  ExchangeUnavailableError,
  WebSocketDisconnectedError,
  InvalidSignatureError,
  ExpiredAuthError,
  InsufficientPermissionsError,
  ValidationError,
  InvalidSymbolError,
  InvalidParameterError,
  TimeoutError,
  RequestTimeoutError,
  InsufficientBalanceError,
  OrderRejectedError,
  MinimumOrderSizeError,
  TransactionFailedError,
  SlippageExceededError,
  LiquidationError,
  isPerpDEXError,
  isRateLimitError,
  isAuthError,
  isNetworkError,
  isTimeoutError,
  isValidationError,
  isExchangeError,
  isNotSupportedError,
  isBadRequestError,
  isBadResponseError,
  isAuthenticationError,
  isOrderError,
  isTradingError,
  StandardErrorCodes,
} from '../../src/types/errors.js';

describe('PerpDEXError', () => {
  test('creates error with message, code, and exchange', () => {
    const error = new PerpDEXError('Test error', 'TEST_CODE', 'hyperliquid');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.exchange).toBe('hyperliquid');
    expect(error.name).toBe('PerpDEXError');
  });

  test('stores original error', () => {
    const originalError = new Error('Original error');
    const error = new PerpDEXError('Wrapped error', 'WRAP', 'test', originalError);
    expect(error.originalError).toBe(originalError);
  });

  test('withCorrelationId sets correlation ID and returns this', () => {
    const error = new PerpDEXError('Test', 'CODE', 'exchange');
    const result = error.withCorrelationId('corr-123');
    expect(result).toBe(error);
    expect(error.correlationId).toBe('corr-123');
  });

  test('toJSON returns serializable object', () => {
    const originalError = new Error('Original');
    const error = new PerpDEXError('Test', 'CODE', 'exchange', originalError);
    error.withCorrelationId('corr-456');
    const json = error.toJSON();
    expect(json).toEqual({
      name: 'PerpDEXError',
      message: 'Test',
      code: 'CODE',
      exchange: 'exchange',
      correlationId: 'corr-456',
      originalError: originalError,
    });
  });
});

describe('Error Subclasses', () => {
  test('ExchangeError', () => {
    const error = new ExchangeError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('ExchangeError');
  });

  test('NotSupportedError', () => {
    const error = new NotSupportedError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('NotSupportedError');
  });

  test('BadRequestError', () => {
    const error = new BadRequestError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('BadRequestError');
  });

  test('BadResponseError', () => {
    const error = new BadResponseError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('BadResponseError');
  });

  test('AuthenticationError', () => {
    const error = new AuthenticationError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('AuthenticationError');
  });

  test('InsufficientMarginError', () => {
    const error = new InsufficientMarginError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('InsufficientMarginError');
  });

  test('OrderNotFoundError', () => {
    const error = new OrderNotFoundError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('OrderNotFoundError');
  });

  test('InvalidOrderError', () => {
    const error = new InvalidOrderError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('InvalidOrderError');
  });

  test('PositionNotFoundError', () => {
    const error = new PositionNotFoundError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('PositionNotFoundError');
  });

  test('NetworkError', () => {
    const error = new NetworkError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('NetworkError');
  });

  test('RateLimitError with retryAfter', () => {
    const error = new RateLimitError('msg', 'CODE', 'ex', 5000, new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('RateLimitError');
    expect(error.retryAfter).toBe(5000);
  });

  test('ExchangeUnavailableError', () => {
    const error = new ExchangeUnavailableError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('ExchangeUnavailableError');
  });

  test('WebSocketDisconnectedError', () => {
    const error = new WebSocketDisconnectedError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('WebSocketDisconnectedError');
  });

  test('InvalidSignatureError', () => {
    const error = new InvalidSignatureError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('InvalidSignatureError');
  });

  test('ExpiredAuthError', () => {
    const error = new ExpiredAuthError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('ExpiredAuthError');
  });

  test('InsufficientPermissionsError', () => {
    const error = new InsufficientPermissionsError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('InsufficientPermissionsError');
  });

  test('ValidationError', () => {
    const error = new ValidationError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('ValidationError');
  });

  test('InvalidSymbolError', () => {
    const error = new InvalidSymbolError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('InvalidSymbolError');
  });

  test('InvalidParameterError', () => {
    const error = new InvalidParameterError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('InvalidParameterError');
  });

  test('TimeoutError with timeoutMs', () => {
    const error = new TimeoutError('msg', 'CODE', 'ex', 30000, new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('TimeoutError');
    expect(error.timeoutMs).toBe(30000);
  });

  test('RequestTimeoutError', () => {
    const error = new RequestTimeoutError('msg', 'CODE', 'ex', 10000, new Error('orig'));
    expect(error).toBeInstanceOf(TimeoutError);
    expect(error.name).toBe('RequestTimeoutError');
    expect(error.timeoutMs).toBe(10000);
  });

  test('InsufficientBalanceError with required and available', () => {
    const error = new InsufficientBalanceError('msg', 'CODE', 'ex', 100, 50, new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('InsufficientBalanceError');
    expect(error.required).toBe(100);
    expect(error.available).toBe(50);
  });

  test('OrderRejectedError with reason', () => {
    const error = new OrderRejectedError('msg', 'CODE', 'ex', 'reason', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('OrderRejectedError');
    expect(error.reason).toBe('reason');
  });

  test('MinimumOrderSizeError with sizes', () => {
    const error = new MinimumOrderSizeError('msg', 'CODE', 'ex', 0.01, 0.001, new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('MinimumOrderSizeError');
    expect(error.minSize).toBe(0.01);
    expect(error.requestedSize).toBe(0.001);
  });

  test('TransactionFailedError with txHash', () => {
    const error = new TransactionFailedError('msg', 'CODE', 'ex', '0xabc', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('TransactionFailedError');
    expect(error.txHash).toBe('0xabc');
  });

  test('SlippageExceededError with prices', () => {
    const error = new SlippageExceededError('msg', 'CODE', 'ex', 100, 95, new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('SlippageExceededError');
    expect(error.expectedPrice).toBe(100);
    expect(error.actualPrice).toBe(95);
  });

  test('LiquidationError', () => {
    const error = new LiquidationError('msg', 'CODE', 'ex', new Error('orig'));
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.name).toBe('LiquidationError');
  });
});

describe('Type Guards', () => {
  test('isPerpDEXError', () => {
    expect(isPerpDEXError(new PerpDEXError('t', 'c', 'e'))).toBe(true);
    expect(isPerpDEXError(new NetworkError('t', 'c', 'e'))).toBe(true);
    expect(isPerpDEXError(new Error('t'))).toBe(false);
    expect(isPerpDEXError(null)).toBe(false);
    expect(isPerpDEXError('error')).toBe(false);
  });

  test('isRateLimitError', () => {
    expect(isRateLimitError(new RateLimitError('t', 'c', 'e'))).toBe(true);
    expect(isRateLimitError(new NetworkError('t', 'c', 'e'))).toBe(false);
  });

  test('isAuthError - InvalidSignatureError', () => {
    expect(isAuthError(new InvalidSignatureError('t', 'c', 'e'))).toBe(true);
  });

  test('isAuthError - ExpiredAuthError', () => {
    expect(isAuthError(new ExpiredAuthError('t', 'c', 'e'))).toBe(true);
  });

  test('isAuthError - InsufficientPermissionsError', () => {
    expect(isAuthError(new InsufficientPermissionsError('t', 'c', 'e'))).toBe(true);
  });

  test('isAuthError - false for other errors', () => {
    expect(isAuthError(new AuthenticationError('t', 'c', 'e'))).toBe(false);
    expect(isAuthError(new NetworkError('t', 'c', 'e'))).toBe(false);
  });

  test('isNetworkError', () => {
    expect(isNetworkError(new NetworkError('t', 'c', 'e'))).toBe(true);
    expect(isNetworkError(new RateLimitError('t', 'c', 'e'))).toBe(false);
  });

  test('isTimeoutError', () => {
    expect(isTimeoutError(new TimeoutError('t', 'c', 'e'))).toBe(true);
    expect(isTimeoutError(new RequestTimeoutError('t', 'c', 'e'))).toBe(true);
    expect(isTimeoutError(new NetworkError('t', 'c', 'e'))).toBe(false);
  });

  test('isValidationError', () => {
    expect(isValidationError(new ValidationError('t', 'c', 'e'))).toBe(true);
    expect(isValidationError(new InvalidSymbolError('t', 'c', 'e'))).toBe(false);
  });

  test('isExchangeError', () => {
    expect(isExchangeError(new ExchangeError('t', 'c', 'e'))).toBe(true);
    expect(isExchangeError(new NetworkError('t', 'c', 'e'))).toBe(false);
  });

  test('isNotSupportedError', () => {
    expect(isNotSupportedError(new NotSupportedError('t', 'c', 'e'))).toBe(true);
    expect(isNotSupportedError(new ExchangeError('t', 'c', 'e'))).toBe(false);
  });

  test('isBadRequestError', () => {
    expect(isBadRequestError(new BadRequestError('t', 'c', 'e'))).toBe(true);
    expect(isBadRequestError(new BadResponseError('t', 'c', 'e'))).toBe(false);
  });

  test('isBadResponseError', () => {
    expect(isBadResponseError(new BadResponseError('t', 'c', 'e'))).toBe(true);
    expect(isBadResponseError(new BadRequestError('t', 'c', 'e'))).toBe(false);
  });

  test('isAuthenticationError', () => {
    expect(isAuthenticationError(new AuthenticationError('t', 'c', 'e'))).toBe(true);
    expect(isAuthenticationError(new InvalidSignatureError('t', 'c', 'e'))).toBe(false);
  });

  test('isOrderError - InvalidOrderError', () => {
    expect(isOrderError(new InvalidOrderError('t', 'c', 'e'))).toBe(true);
  });

  test('isOrderError - OrderNotFoundError', () => {
    expect(isOrderError(new OrderNotFoundError('t', 'c', 'e'))).toBe(true);
  });

  test('isOrderError - OrderRejectedError', () => {
    expect(isOrderError(new OrderRejectedError('t', 'c', 'e'))).toBe(true);
  });

  test('isOrderError - false for other', () => {
    expect(isOrderError(new InsufficientMarginError('t', 'c', 'e'))).toBe(false);
  });

  test('isTradingError - InsufficientMarginError', () => {
    expect(isTradingError(new InsufficientMarginError('t', 'c', 'e'))).toBe(true);
  });

  test('isTradingError - InsufficientBalanceError', () => {
    expect(isTradingError(new InsufficientBalanceError('t', 'c', 'e'))).toBe(true);
  });

  test('isTradingError - LiquidationError', () => {
    expect(isTradingError(new LiquidationError('t', 'c', 'e'))).toBe(true);
  });

  test('isTradingError - false for other', () => {
    expect(isTradingError(new InvalidOrderError('t', 'c', 'e'))).toBe(false);
  });
});

describe('StandardErrorCodes', () => {
  test('has expected codes', () => {
    expect(StandardErrorCodes.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
    expect(StandardErrorCodes.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    expect(StandardErrorCodes.ORDER_NOT_FOUND).toBe('ORDER_NOT_FOUND');
    expect(StandardErrorCodes.TRANSACTION_FAILED).toBe('TRANSACTION_FAILED');
  });
});

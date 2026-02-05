/**
 * Type System Unit Tests
 */

import {
  ORDER_TYPES,
  ORDER_SIDES,
  POSITION_SIDES,
  MARGIN_MODES,
  PerpDEXError,
  InsufficientMarginError,
  isPerpDEXError,
  isRateLimitError,
  RateLimitError,
} from '../../src/types/index.js';

describe('Type Constants', () => {
  test('ORDER_TYPES contains correct values', () => {
    expect(ORDER_TYPES).toEqual(['market', 'limit', 'stopMarket', 'stopLimit', 'takeProfit', 'trailingStop']);
  });

  test('ORDER_SIDES contains correct values', () => {
    expect(ORDER_SIDES).toEqual(['buy', 'sell']);
  });

  test('POSITION_SIDES contains correct values', () => {
    expect(POSITION_SIDES).toEqual(['long', 'short']);
  });

  test('MARGIN_MODES contains correct values', () => {
    expect(MARGIN_MODES).toEqual(['cross', 'isolated']);
  });
});

describe('Error Classes', () => {
  test('PerpDEXError creates error with correct properties', () => {
    const error = new PerpDEXError('Test error', 'TEST_CODE', 'hyperliquid');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.exchange).toBe('hyperliquid');
    expect(error.name).toBe('PerpDEXError');
  });

  test('InsufficientMarginError extends PerpDEXError', () => {
    const error = new InsufficientMarginError('Not enough margin', 'INSUFFICIENT_MARGIN', 'hyperliquid');

    expect(error).toBeInstanceOf(PerpDEXError);
    expect(error).toBeInstanceOf(InsufficientMarginError);
    expect(error.name).toBe('InsufficientMarginError');
  });

  test('RateLimitError includes retryAfter', () => {
    const error = new RateLimitError('Rate limited', 'RATE_LIMIT', 'hyperliquid', 5000);

    expect(error.retryAfter).toBe(5000);
  });

  test('Error toJSON serializes correctly', () => {
    const originalError = new Error('Original');
    const error = new PerpDEXError('Test', 'CODE', 'exchange', originalError);

    const json = error.toJSON();

    expect(json).toEqual({
      name: 'PerpDEXError',
      message: 'Test',
      code: 'CODE',
      exchange: 'exchange',
      originalError,
    });
  });
});

describe('Type Guards', () => {
  test('isPerpDEXError identifies PerpDEXError instances', () => {
    const perpError = new PerpDEXError('Test', 'CODE', 'exchange');
    const standardError = new Error('Test');

    expect(isPerpDEXError(perpError)).toBe(true);
    expect(isPerpDEXError(standardError)).toBe(false);
    expect(isPerpDEXError('not an error')).toBe(false);
  });

  test('isRateLimitError identifies RateLimitError instances', () => {
    const rateLimitError = new RateLimitError('Test', 'CODE', 'exchange');
    const perpError = new PerpDEXError('Test', 'CODE', 'exchange');

    expect(isRateLimitError(rateLimitError)).toBe(true);
    expect(isRateLimitError(perpError)).toBe(false);
  });
});

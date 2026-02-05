/**
 * Validation Middleware Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import {
  validate,
  validateSafe,
  validateOrderRequest,
  validateOrderBookParams,
  validateTradeParams,
  validateMarketParams,
  validateOHLCVParams,
  validateOHLCVTimeframe,
  validateArray,
  createValidator,
  validateResponse,
} from '../../src/core/validation/middleware.js';
import { PerpDEXError } from '../../src/types/errors.js';

describe('Validation Middleware', () => {
  const testSchema = z.object({
    name: z.string(),
    value: z.number(),
  });

  const validationOptions = {
    exchange: 'test-exchange',
  };

  describe('validate', () => {
    it('should return validated data for valid input', () => {
      const data = { name: 'test', value: 42 };
      const result = validate(testSchema, data, validationOptions);
      
      expect(result).toEqual(data);
    });

    it('should throw PerpDEXError for invalid input', () => {
      const data = { name: 'test', value: 'not a number' };
      
      expect(() => validate(testSchema, data, validationOptions))
        .toThrow(PerpDEXError);
    });

    it('should include exchange in error', () => {
      const data = { name: 123, value: 'invalid' };
      
      try {
        validate(testSchema, data, validationOptions);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PerpDEXError);
        expect((error as PerpDEXError).exchange).toBe('test-exchange');
      }
    });

    it('should include correlationId when provided', () => {
      const data = { invalid: true };
      
      try {
        validate(testSchema, data, {
          ...validationOptions,
          context: { correlationId: 'test-correlation-123' },
        });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PerpDEXError);
        expect((error as PerpDEXError).correlationId).toBe('test-correlation-123');
      }
    });

    it('should not throw when throwOnError is false', () => {
      const data = { invalid: true };
      
      // Should not throw
      const result = validate(testSchema, data, {
        ...validationOptions,
        throwOnError: false,
      });
      
      // Returns undefined for invalid data when not throwing
      expect(result).toBeUndefined();
    });

    it('should use custom error prefix', () => {
      const data = { name: 123 };
      
      try {
        validate(testSchema, data, {
          ...validationOptions,
          errorPrefix: 'Custom error prefix',
        });
        fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('Custom error prefix');
      }
    });
  });

  describe('validateSafe', () => {
    it('should return success true for valid input', () => {
      const data = { name: 'test', value: 42 };
      const result = validateSafe(testSchema, data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.errors).toBeUndefined();
    });

    it('should return success false for invalid input', () => {
      const data = { name: 123, value: 'invalid' };
      const result = validateSafe(testSchema, data);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should include field path in errors', () => {
      const data = { name: 123 };
      const result = validateSafe(testSchema, data);

      expect(result.errors!.some(e => e.field === 'name')).toBe(true);
    });
  });

  describe('validateOrderRequest', () => {
    it('should validate a valid order request', () => {
      const orderRequest = {
        symbol: 'BTC/USD:USD',
        side: 'buy',
        type: 'limit',
        amount: 1.0,
        price: 50000,
      };

      const result = validateOrderRequest(orderRequest, validationOptions);
      
      expect(result.symbol).toBe('BTC/USD:USD');
      expect(result.side).toBe('buy');
    });

    it('should throw for invalid order request', () => {
      const invalidOrder = {
        symbol: '', // Invalid: empty
        side: 'invalid', // Invalid: not buy/sell
        amount: -1, // Invalid: negative
      };

      expect(() => validateOrderRequest(invalidOrder, validationOptions))
        .toThrow();
    });

    it('should include correlationId on validation error', () => {
      const invalidOrder = { invalid: true };
      
      try {
        validateOrderRequest(invalidOrder, {
          ...validationOptions,
          context: { correlationId: 'order-correlation-456' },
        });
        fail('Should have thrown');
      } catch (error) {
        expect((error as PerpDEXError).correlationId).toBe('order-correlation-456');
      }
    });
  });

  describe('validateOrderBookParams', () => {
    it('should return undefined for undefined input', () => {
      const result = validateOrderBookParams(undefined, validationOptions);
      expect(result).toBeUndefined();
    });

    it('should return undefined for null input', () => {
      const result = validateOrderBookParams(null, validationOptions);
      expect(result).toBeUndefined();
    });

    it('should validate valid order book params', () => {
      const params = { limit: 10 };
      const result = validateOrderBookParams(params, validationOptions);
      
      expect(result).toBeDefined();
      expect(result?.limit).toBe(10);
    });
  });

  describe('validateTradeParams', () => {
    it('should return undefined for undefined input', () => {
      const result = validateTradeParams(undefined, validationOptions);
      expect(result).toBeUndefined();
    });

    it('should return undefined for null input', () => {
      const result = validateTradeParams(null, validationOptions);
      expect(result).toBeUndefined();
    });

    it('should validate valid trade params', () => {
      const params = { limit: 50 };
      const result = validateTradeParams(params, validationOptions);
      
      expect(result).toBeDefined();
    });
  });

  describe('validateMarketParams', () => {
    it('should return undefined for undefined input', () => {
      const result = validateMarketParams(undefined, validationOptions);
      expect(result).toBeUndefined();
    });

    it('should return undefined for null input', () => {
      const result = validateMarketParams(null, validationOptions);
      expect(result).toBeUndefined();
    });

    it('should validate valid market params (line 200)', () => {
      const params = { active: true, ids: ['BTC', 'ETH'] };
      const result = validateMarketParams(params, validationOptions);

      expect(result).toBeDefined();
      expect(result?.active).toBe(true);
      expect(result?.ids).toEqual(['BTC', 'ETH']);
    });
  });

  describe('validateOHLCVParams', () => {
    it('should return undefined for undefined input', () => {
      const result = validateOHLCVParams(undefined, validationOptions);
      expect(result).toBeUndefined();
    });

    it('should return undefined for null input', () => {
      const result = validateOHLCVParams(null, validationOptions);
      expect(result).toBeUndefined();
    });

    it('should validate valid OHLCV params', () => {
      const params = { limit: 100 };
      const result = validateOHLCVParams(params, validationOptions);
      
      expect(result).toBeDefined();
    });
  });

  describe('validateOHLCVTimeframe', () => {
    it('should validate valid timeframe', () => {
      const result = validateOHLCVTimeframe('1h', validationOptions);
      expect(result).toBe('1h');
    });

    it('should validate 1m timeframe', () => {
      const result = validateOHLCVTimeframe('1m', validationOptions);
      expect(result).toBe('1m');
    });

    it('should validate 1d timeframe', () => {
      const result = validateOHLCVTimeframe('1d', validationOptions);
      expect(result).toBe('1d');
    });

    it('should throw for invalid timeframe', () => {
      expect(() => validateOHLCVTimeframe('invalid', validationOptions))
        .toThrow();
    });
  });

  describe('validateArray', () => {
    it('should validate array of valid items', () => {
      const items = [
        { name: 'a', value: 1 },
        { name: 'b', value: 2 },
      ];
      
      const result = validateArray(testSchema, items, validationOptions);
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('a');
      expect(result[1].value).toBe(2);
    });

    it('should throw for invalid items', () => {
      const items = [
        { name: 'valid', value: 1 },
        { name: 123, value: 'invalid' }, // Invalid
      ];
      
      expect(() => validateArray(testSchema, items, validationOptions))
        .toThrow();
    });

    it('should handle empty array', () => {
      const result = validateArray(testSchema, [], validationOptions);
      expect(result).toHaveLength(0);
    });

    it('should include correlationId in array validation errors (line 277)', () => {
      const items = [
        { name: 'valid', value: 1 },
        { name: 123, value: 'invalid' }, // Invalid
      ];

      let caughtError: unknown;
      try {
        validateArray(testSchema, items, {
          ...validationOptions,
          context: { correlationId: 'array-ctx-999' },
        });
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(PerpDEXError);
      expect((caughtError as PerpDEXError).correlationId).toBe('array-ctx-999');
    });
  });

  describe('createValidator', () => {
    const validator = createValidator('test-exchange');

    it('should create validator with orderRequest method', () => {
      const orderRequest = {
        symbol: 'ETH/USD:USD',
        side: 'sell',
        type: 'market',
        amount: 2.5,
      };

      const result = validator.orderRequest(orderRequest);
      expect(result.symbol).toBe('ETH/USD:USD');
    });

    it('should create validator with orderBookParams method', () => {
      const result = validator.orderBookParams({ limit: 20 });
      expect(result?.limit).toBe(20);
    });

    it('should create validator with tradeParams method', () => {
      const result = validator.tradeParams({ limit: 100 });
      expect(result).toBeDefined();
    });

    it('should create validator with marketParams method', () => {
      const result = validator.marketParams(undefined);
      expect(result).toBeUndefined();
    });

    it('should create validator with ohlcvParams method', () => {
      const result = validator.ohlcvParams({ limit: 500 });
      expect(result).toBeDefined();
    });

    it('should create validator with ohlcvTimeframe method', () => {
      const result = validator.ohlcvTimeframe('4h');
      expect(result).toBe('4h');
    });

    it('should create validator with array method', () => {
      const items = [
        { name: 'x', value: 10 },
        { name: 'y', value: 20 },
      ];

      const result = validator.array(testSchema, items);
      expect(result).toHaveLength(2);
    });

    it('should pass context to validation methods', () => {
      const context = { correlationId: 'ctx-123' };

      expect(() => validator.orderRequest({ invalid: true }, context))
        .toThrow();
    });

    it('should have validate method for custom schemas (line 309)', () => {
      const customSchema = z.object({
        id: z.string(),
        count: z.number(),
      });

      // Test valid data
      const validData = { id: 'test-id', count: 42 };
      const result = validator.validate(customSchema, validData);
      expect(result).toEqual(validData);

      // Test invalid data throws
      expect(() => validator.validate(customSchema, { id: 123, count: 'invalid' }))
        .toThrow(PerpDEXError);
    });

    it('should include correlationId in validate method errors (line 277)', () => {
      const customSchema = z.object({ field: z.string() });
      const context = {
        correlationId: 'validate-ctx-789',
        adapter: 'test-exchange',
        method: 'testMethod',
        timestamp: Date.now(),
      };

      let caughtError: unknown;
      try {
        validator.validate(customSchema, { field: 123 }, context);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(PerpDEXError);
      expect((caughtError as PerpDEXError).correlationId).toBe('validate-ctx-789');
    });
  });

  describe('validateResponse decorator', () => {
    it('should create a method decorator', () => {
      const decorator = validateResponse(testSchema, 'test');
      expect(typeof decorator).toBe('function');
    });

    it('should validate method response', async () => {
      class TestClass {
        async getData() {
          return { name: 'test', value: 42 };
        }
      }

      const instance = new TestClass();
      const descriptor = Object.getOwnPropertyDescriptor(
        TestClass.prototype,
        'getData'
      )!;

      // Apply decorator
      const decorated = validateResponse(testSchema, 'test')(
        TestClass.prototype,
        'getData',
        descriptor
      );

      // Call decorated method
      const result = await decorated!.value.call(instance);
      expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('should throw for invalid response', async () => {
      class TestClass {
        async getData() {
          return { invalid: 'data' };
        }
      }

      const instance = new TestClass();
      const descriptor = Object.getOwnPropertyDescriptor(
        TestClass.prototype,
        'getData'
      )!;

      // Apply decorator
      const decorated = validateResponse(testSchema, 'test')(
        TestClass.prototype,
        'getData',
        descriptor
      );

      // Should throw for invalid response
      await expect(decorated!.value.call(instance))
        .rejects.toThrow(PerpDEXError);
    });
  });
});

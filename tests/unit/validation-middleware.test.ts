/**
 * Validation Middleware Unit Tests
 *
 * Tests for the validation middleware functions including
 * createValidator factory, validateSafe, and correlation ID support.
 */

import { z } from 'zod';
import {
  validate,
  validateSafe,
  validateOrderRequest,
  validateOrderBookParams,
  validateTradeParams,
  validateMarketParams,
  validateArray,
  createValidator,
} from '../../src/core/validation/middleware.js';
import { PerpDEXError, InvalidOrderError } from '../../src/types/errors.js';
import type { RequestContext } from '../../src/core/logger.js';

describe('Validation Middleware', () => {
  describe('validate', () => {
    const TestSchema = z.object({
      name: z.string().min(1),
      value: z.number().positive(),
    });

    it('should return validated data on success', () => {
      const data = { name: 'test', value: 42 };
      const result = validate(TestSchema, data, { exchange: 'test' });
      expect(result).toEqual(data);
    });

    it('should throw PerpDEXError on validation failure', () => {
      const invalidData = { name: '', value: -1 };
      expect(() => validate(TestSchema, invalidData, { exchange: 'test' })).toThrow(PerpDEXError);
    });

    it('should include exchange name in error', () => {
      const invalidData = { name: '', value: 42 };
      try {
        validate(TestSchema, invalidData, { exchange: 'hyperliquid' });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PerpDEXError);
        expect((error as PerpDEXError).exchange).toBe('hyperliquid');
      }
    });

    it('should include error prefix in message', () => {
      const invalidData = { name: '', value: 42 };
      try {
        validate(TestSchema, invalidData, { exchange: 'test', errorPrefix: 'Custom error' });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PerpDEXError);
        expect((error as PerpDEXError).message).toContain('Custom error');
      }
    });

    it('should attach correlation ID to error when context provided', () => {
      const invalidData = { name: '', value: 42 };
      const context: RequestContext = {
        correlationId: 'test-123',
        adapter: 'test',
        method: 'validate',
        timestamp: Date.now(),
      };

      try {
        validate(TestSchema, invalidData, { exchange: 'test', context });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PerpDEXError);
        expect((error as PerpDEXError).correlationId).toBe('test-123');
      }
    });

    it('should not throw when throwOnError is false', () => {
      const invalidData = { name: '', value: 42 };
      // With throwOnError: false, it should return undefined for data
      const result = validate(TestSchema, invalidData, { exchange: 'test', throwOnError: false });
      expect(result).toBeUndefined();
    });
  });

  describe('validateSafe', () => {
    const TestSchema = z.object({
      name: z.string().min(1),
      value: z.number().positive(),
    });

    it('should return success result with data on valid input', () => {
      const data = { name: 'test', value: 42 };
      const result = validateSafe(TestSchema, data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.errors).toBeUndefined();
    });

    it('should return failure result with errors on invalid input', () => {
      const invalidData = { name: '', value: -1 };
      const result = validateSafe(TestSchema, invalidData);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should include field names in validation errors', () => {
      const invalidData = { name: '', value: -1 };
      const result = validateSafe(TestSchema, invalidData);
      expect(result.errors).toBeDefined();

      const fields = result.errors!.map((e) => e.field);
      expect(fields).toContain('name');
      expect(fields).toContain('value');
    });

    it('should include error codes in validation errors', () => {
      const invalidData = { name: '', value: -1 };
      const result = validateSafe(TestSchema, invalidData);
      expect(result.errors).toBeDefined();

      const codes = result.errors!.map((e) => e.code);
      expect(codes.every((c) => typeof c === 'string')).toBe(true);
    });
  });

  describe('validateOrderRequest', () => {
    it('should validate correct limit order', () => {
      const order = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit' as const,
        side: 'buy' as const,
        amount: 0.1,
        price: 50000,
      };

      const result = validateOrderRequest(order, { exchange: 'test' });
      expect(result.symbol).toBe('BTC/USDT:USDT');
      expect(result.type).toBe('limit');
    });

    it('should throw InvalidOrderError for invalid order', () => {
      const invalidOrder = {
        symbol: '',
        type: 'limit' as const,
        side: 'buy' as const,
        amount: -1,
      };

      expect(() => validateOrderRequest(invalidOrder, { exchange: 'test' })).toThrow(
        InvalidOrderError
      );
    });

    it('should require price for limit orders', () => {
      const order = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit' as const,
        side: 'buy' as const,
        amount: 0.1,
        // No price
      };

      expect(() => validateOrderRequest(order, { exchange: 'test' })).toThrow(InvalidOrderError);
    });

    it('should not require price for market orders', () => {
      const order = {
        symbol: 'BTC/USDT:USDT',
        type: 'market' as const,
        side: 'buy' as const,
        amount: 0.1,
      };

      const result = validateOrderRequest(order, { exchange: 'test' });
      expect(result.type).toBe('market');
    });
  });

  describe('validateOrderBookParams', () => {
    it('should return undefined for undefined input', () => {
      const result = validateOrderBookParams(undefined, { exchange: 'test' });
      expect(result).toBeUndefined();
    });

    it('should return undefined for null input', () => {
      const result = validateOrderBookParams(null, { exchange: 'test' });
      expect(result).toBeUndefined();
    });

    it('should validate correct params', () => {
      const params = { limit: 100 };
      const result = validateOrderBookParams(params, { exchange: 'test' });
      expect(result).toEqual(params);
    });

    it('should throw for invalid limit', () => {
      const params = { limit: -1 };
      expect(() => validateOrderBookParams(params, { exchange: 'test' })).toThrow(PerpDEXError);
    });
  });

  describe('validateTradeParams', () => {
    it('should return undefined for undefined input', () => {
      const result = validateTradeParams(undefined, { exchange: 'test' });
      expect(result).toBeUndefined();
    });

    it('should validate correct params', () => {
      const params = { limit: 50, since: Date.now() };
      const result = validateTradeParams(params, { exchange: 'test' });
      expect(result?.limit).toBe(50);
    });
  });

  describe('validateMarketParams', () => {
    it('should return undefined for undefined input', () => {
      const result = validateMarketParams(undefined, { exchange: 'test' });
      expect(result).toBeUndefined();
    });

    it('should validate correct params', () => {
      const params = { active: true };
      const result = validateMarketParams(params, { exchange: 'test' });
      expect(result?.active).toBe(true);
    });
  });

  describe('validateArray', () => {
    // Schema with actual validation constraints
    const ItemSchema = z.object({
      id: z.string().min(1),
      value: z.number().positive(),
    });

    it('should validate array of valid items', () => {
      const items = [
        { id: '1', value: 10 },
        { id: '2', value: 20 },
      ];

      const result = validateArray(ItemSchema, items, { exchange: 'test' });
      expect(result).toHaveLength(2);
    });

    it('should include array index in error field', () => {
      const items = [
        { id: '1', value: 10 },
        { id: '', value: -1 }, // Invalid - empty id and negative value
      ];

      try {
        validateArray(ItemSchema, items, { exchange: 'test' });
        // Should throw since we have an invalid item
      } catch (error) {
        expect(error).toBeInstanceOf(PerpDEXError);
        expect((error as PerpDEXError).message).toContain('[1]');
      }
    });

    it('should return only valid items when throwOnError is false', () => {
      const items = [
        { id: '1', value: 10 },
        { id: '', value: -1 }, // Invalid - empty id and negative value
      ];

      // Should return only valid items when not throwing
      const result = validateArray(ItemSchema, items, { exchange: 'test', throwOnError: false });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should return empty array if all items invalid and throwOnError is false', () => {
      const items = [
        { id: '', value: -1 },
        { id: '', value: -2 },
      ];

      const result = validateArray(ItemSchema, items, { exchange: 'test', throwOnError: false });
      expect(result).toHaveLength(0);
    });
  });

  describe('createValidator', () => {
    it('should create validator bound to exchange', () => {
      const validator = createValidator('hyperliquid');

      const TestSchema = z.object({ value: z.number() });
      const result = validator.validate(TestSchema, { value: 42 });
      expect(result.value).toBe(42);
    });

    it('should throw errors with correct exchange', () => {
      const validator = createValidator('paradex');

      const TestSchema = z.object({ value: z.number().positive() });
      try {
        validator.validate(TestSchema, { value: -1 });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PerpDEXError);
        expect((error as PerpDEXError).exchange).toBe('paradex');
      }
    });

    it('should validate order requests', () => {
      const validator = createValidator('grvt');

      const order = {
        symbol: 'BTC/USDT:USDT',
        type: 'market' as const,
        side: 'buy' as const,
        amount: 0.1,
      };

      const result = validator.orderRequest(order);
      expect(result.symbol).toBe('BTC/USDT:USDT');
    });

    it('should pass correlation ID to validation', () => {
      const validator = createValidator('test');
      const context: RequestContext = {
        correlationId: 'ctx-456',
        adapter: 'test',
        method: 'test',
        timestamp: Date.now(),
      };

      const TestSchema = z.object({ value: z.number().positive() });
      try {
        validator.validate(TestSchema, { value: -1 }, context);
        fail('Should have thrown');
      } catch (error) {
        expect((error as PerpDEXError).correlationId).toBe('ctx-456');
      }
    });
  });
});

describe('Negative Test Cases', () => {
  describe('Edge Cases', () => {
    it('should handle completely missing data', () => {
      expect(() =>
        validateOrderRequest(undefined as any, { exchange: 'test' })
      ).toThrow();
    });

    it('should handle null data', () => {
      expect(() => validateOrderRequest(null as any, { exchange: 'test' })).toThrow();
    });

    it('should handle wrong type data', () => {
      expect(() => validateOrderRequest('not an object' as any, { exchange: 'test' })).toThrow();
    });

    it('should handle array instead of object', () => {
      expect(() => validateOrderRequest([] as any, { exchange: 'test' })).toThrow();
    });
  });

  describe('Invalid Field Types', () => {
    it('should reject string amount', () => {
      const order = {
        symbol: 'BTC/USDT:USDT',
        type: 'market' as const,
        side: 'buy' as const,
        amount: 'not a number' as any,
      };

      expect(() => validateOrderRequest(order, { exchange: 'test' })).toThrow(InvalidOrderError);
    });

    it('should reject invalid order type', () => {
      const order = {
        symbol: 'BTC/USDT:USDT',
        type: 'invalid_type' as any,
        side: 'buy' as const,
        amount: 0.1,
      };

      expect(() => validateOrderRequest(order, { exchange: 'test' })).toThrow(InvalidOrderError);
    });

    it('should reject invalid side', () => {
      const order = {
        symbol: 'BTC/USDT:USDT',
        type: 'market' as const,
        side: 'sideways' as any,
        amount: 0.1,
      };

      expect(() => validateOrderRequest(order, { exchange: 'test' })).toThrow(InvalidOrderError);
    });
  });

  describe('Boundary Values', () => {
    it('should reject zero amount', () => {
      const order = {
        symbol: 'BTC/USDT:USDT',
        type: 'market' as const,
        side: 'buy' as const,
        amount: 0,
      };

      expect(() => validateOrderRequest(order, { exchange: 'test' })).toThrow(InvalidOrderError);
    });

    it('should reject extremely large leverage', () => {
      const order = {
        symbol: 'BTC/USDT:USDT',
        type: 'market' as const,
        side: 'buy' as const,
        amount: 0.1,
        leverage: 1000,
      };

      expect(() => validateOrderRequest(order, { exchange: 'test' })).toThrow(InvalidOrderError);
    });

    it('should reject negative price', () => {
      const order = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit' as const,
        side: 'buy' as const,
        amount: 0.1,
        price: -50000,
      };

      expect(() => validateOrderRequest(order, { exchange: 'test' })).toThrow(InvalidOrderError);
    });
  });
});

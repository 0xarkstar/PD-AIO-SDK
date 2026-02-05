/**
 * Unit Tests for Lighter Order Utilities
 *
 * Tests the order conversion utility functions for Lighter
 */

import { describe, it, expect } from '@jest/globals';
import {
  toBaseUnits,
  toPriceUnits,
  fromBaseUnits,
  fromPriceUnits,
  mapOrderType,
  mapOrderTypeToString,
  mapTimeInForce,
  mapTimeInForceToString,
  convertOrderRequest,
  mapSideToLighter,
  mapSideFromLighter,
  calculateExpiration,
  validateLighterOrder,
} from '../../src/adapters/lighter/LighterOrderUtils.js';
import { OrderType, TimeInForce } from '../../src/adapters/lighter/signer/index.js';

describe('LighterOrderUtils', () => {
  describe('toBaseUnits', () => {
    it('should convert amount to base units with 8 decimals', () => {
      expect(toBaseUnits(1.5, 8)).toBe(BigInt(150000000));
    });

    it('should convert amount to base units with 18 decimals', () => {
      expect(toBaseUnits(1, 18)).toBe(BigInt('1000000000000000000'));
    });

    it('should handle very small amounts', () => {
      expect(toBaseUnits(0.00000001, 8)).toBe(BigInt(1));
    });

    it('should handle zero', () => {
      expect(toBaseUnits(0, 8)).toBe(BigInt(0));
    });
  });

  describe('fromBaseUnits', () => {
    it('should convert base units back to amount', () => {
      expect(fromBaseUnits(BigInt(150000000), 8)).toBe(1.5);
    });

    it('should handle number input', () => {
      expect(fromBaseUnits(150000000, 8)).toBe(1.5);
    });
  });

  describe('toPriceUnits', () => {
    it('should convert price to tick units', () => {
      expect(toPriceUnits(50000, 0.5)).toBe(100000);
    });

    it('should round to nearest tick', () => {
      expect(toPriceUnits(50000.25, 0.5)).toBe(100001);
    });
  });

  describe('fromPriceUnits', () => {
    it('should convert tick units back to price', () => {
      expect(fromPriceUnits(100000, 0.5)).toBe(50000);
    });
  });

  describe('mapOrderType', () => {
    it('should map limit order type', () => {
      expect(mapOrderType('limit')).toBe(OrderType.LIMIT);
      expect(mapOrderType('LIMIT')).toBe(OrderType.LIMIT);
    });

    it('should map market order type', () => {
      expect(mapOrderType('market')).toBe(OrderType.MARKET);
    });

    it('should map stop limit order type', () => {
      expect(mapOrderType('stop_limit')).toBe(OrderType.STOP_LIMIT);
      expect(mapOrderType('stop-limit')).toBe(OrderType.STOP_LIMIT);
      expect(mapOrderType('stoplimit')).toBe(OrderType.STOP_LIMIT);
    });

    it('should map stop market order type', () => {
      expect(mapOrderType('stop_market')).toBe(OrderType.STOP_MARKET);
    });

    it('should default to limit for unknown types', () => {
      expect(mapOrderType('unknown')).toBe(OrderType.LIMIT);
    });
  });

  describe('mapOrderTypeToString', () => {
    it('should map order types to strings', () => {
      expect(mapOrderTypeToString(OrderType.LIMIT)).toBe('limit');
      expect(mapOrderTypeToString(OrderType.MARKET)).toBe('market');
      expect(mapOrderTypeToString(OrderType.STOP_LIMIT)).toBe('stopLimit');
      expect(mapOrderTypeToString(OrderType.STOP_MARKET)).toBe('stopMarket');
    });
  });

  describe('mapTimeInForce', () => {
    it('should map GTC', () => {
      expect(mapTimeInForce('GTC')).toBe(TimeInForce.GTC);
    });

    it('should map IOC', () => {
      expect(mapTimeInForce('IOC')).toBe(TimeInForce.IOC);
    });

    it('should map FOK', () => {
      expect(mapTimeInForce('FOK')).toBe(TimeInForce.FOK);
    });

    it('should map POST_ONLY variants', () => {
      expect(mapTimeInForce('PO')).toBe(TimeInForce.POST_ONLY);
      expect(mapTimeInForce('POST_ONLY')).toBe(TimeInForce.POST_ONLY);
      expect(mapTimeInForce('POSTONLY')).toBe(TimeInForce.POST_ONLY);
    });

    it('should prioritize postOnly flag', () => {
      expect(mapTimeInForce('GTC', true)).toBe(TimeInForce.POST_ONLY);
    });

    it('should default to GTC', () => {
      expect(mapTimeInForce()).toBe(TimeInForce.GTC);
      expect(mapTimeInForce(undefined)).toBe(TimeInForce.GTC);
    });
  });

  describe('mapTimeInForceToString', () => {
    it('should map time in force to strings', () => {
      expect(mapTimeInForceToString(TimeInForce.GTC)).toBe('GTC');
      expect(mapTimeInForceToString(TimeInForce.IOC)).toBe('IOC');
      expect(mapTimeInForceToString(TimeInForce.FOK)).toBe('FOK');
      expect(mapTimeInForceToString(TimeInForce.POST_ONLY)).toBe('PO');
    });
  });

  describe('convertOrderRequest', () => {
    it('should convert a basic order request', () => {
      const request = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit' as const,
        side: 'buy' as const,
        amount: 1.5,
        price: 50000,
      };

      const result = convertOrderRequest(request, 'BTCUSDT');

      expect(result.symbol).toBe('BTCUSDT');
      expect(result.side).toBe('buy');
      expect(result.type).toBe('limit');
      expect(result.quantity).toBe(1.5);
      expect(result.price).toBe(50000);
    });

    it('should include optional fields', () => {
      const request = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit' as const,
        side: 'buy' as const,
        amount: 1.5,
        price: 50000,
        clientOrderId: 'test-123',
        reduceOnly: true,
      };

      const result = convertOrderRequest(request, 'BTCUSDT');

      expect(result.clientOrderId).toBe('test-123');
      expect(result.reduceOnly).toBe(true);
    });

    it('should set timeInForce for postOnly orders', () => {
      const request = {
        symbol: 'BTC/USDT:USDT',
        type: 'limit' as const,
        side: 'buy' as const,
        amount: 1.5,
        price: 50000,
        postOnly: true,
      };

      const result = convertOrderRequest(request, 'BTCUSDT');

      expect(result.timeInForce).toBe('PO');
    });
  });

  describe('mapSideToLighter / mapSideFromLighter', () => {
    it('should map buy side', () => {
      expect(mapSideToLighter('buy')).toBe(1);
      expect(mapSideFromLighter(1)).toBe('buy');
    });

    it('should map sell side', () => {
      expect(mapSideToLighter('sell')).toBe(2);
      expect(mapSideFromLighter(2)).toBe('sell');
    });
  });

  describe('calculateExpiration', () => {
    it('should return max safe integer for no expiry', () => {
      expect(calculateExpiration(0)).toBe(Number.MAX_SAFE_INTEGER);
      expect(calculateExpiration(-1)).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should calculate future timestamp for positive TTL', () => {
      const now = Date.now();
      const result = calculateExpiration(3600);

      expect(result).toBeGreaterThan(now);
      expect(result).toBeLessThanOrEqual(now + 3600 * 1000 + 100);
    });
  });

  describe('validateLighterOrder', () => {
    it('should validate a valid order', () => {
      expect(() => validateLighterOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 1,
        price: 50000,
      })).not.toThrow();
    });

    it('should throw for missing symbol', () => {
      expect(() => validateLighterOrder({
        type: 'limit',
        side: 'buy',
        amount: 1,
        price: 50000,
      } as any)).toThrow('symbol');
    });

    it('should throw for invalid side', () => {
      expect(() => validateLighterOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'invalid' as any,
        amount: 1,
        price: 50000,
      })).toThrow('side');
    });

    it('should throw for non-positive amount', () => {
      expect(() => validateLighterOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0,
        price: 50000,
      })).toThrow('amount');
    });

    it('should throw for limit order without price', () => {
      expect(() => validateLighterOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 1,
      })).toThrow('price');
    });

    it('should allow market order without price', () => {
      expect(() => validateLighterOrder({
        symbol: 'BTC/USDT:USDT',
        type: 'market',
        side: 'buy',
        amount: 1,
      })).not.toThrow();
    });
  });
});

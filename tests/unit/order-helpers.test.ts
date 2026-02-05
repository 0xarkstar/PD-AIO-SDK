/**
 * Unit Tests for Order Helpers
 *
 * Tests the order creation utility functions
 */

import { describe, it, expect } from '@jest/globals';
import {
  createLimitBuyOrderRequest,
  createLimitSellOrderRequest,
  createMarketBuyOrderRequest,
  createMarketSellOrderRequest,
  createStopLossOrderRequest,
  createTakeProfitOrderRequest,
  createStopLimitOrderRequest,
  validateOrderRequest,
} from '../../src/adapters/base/OrderHelpers.js';

describe('OrderHelpers', () => {
  describe('createLimitBuyOrderRequest', () => {
    it('should create a limit buy order request', () => {
      const request = createLimitBuyOrderRequest('BTC/USDT:USDT', 1.5, 50000);

      expect(request.symbol).toBe('BTC/USDT:USDT');
      expect(request.type).toBe('limit');
      expect(request.side).toBe('buy');
      expect(request.amount).toBe(1.5);
      expect(request.price).toBe(50000);
    });

    it('should merge additional params', () => {
      const request = createLimitBuyOrderRequest('BTC/USDT:USDT', 1.5, 50000, {
        clientOrderId: 'test-123',
        reduceOnly: true,
      });

      expect(request.clientOrderId).toBe('test-123');
      expect(request.reduceOnly).toBe(true);
    });
  });

  describe('createLimitSellOrderRequest', () => {
    it('should create a limit sell order request', () => {
      const request = createLimitSellOrderRequest('ETH/USDT:USDT', 10, 3000);

      expect(request.symbol).toBe('ETH/USDT:USDT');
      expect(request.type).toBe('limit');
      expect(request.side).toBe('sell');
      expect(request.amount).toBe(10);
      expect(request.price).toBe(3000);
    });
  });

  describe('createMarketBuyOrderRequest', () => {
    it('should create a market buy order request', () => {
      const request = createMarketBuyOrderRequest('BTC/USDT:USDT', 0.5);

      expect(request.symbol).toBe('BTC/USDT:USDT');
      expect(request.type).toBe('market');
      expect(request.side).toBe('buy');
      expect(request.amount).toBe(0.5);
      expect(request.price).toBeUndefined();
    });
  });

  describe('createMarketSellOrderRequest', () => {
    it('should create a market sell order request', () => {
      const request = createMarketSellOrderRequest('ETH/USDT:USDT', 5);

      expect(request.symbol).toBe('ETH/USDT:USDT');
      expect(request.type).toBe('market');
      expect(request.side).toBe('sell');
      expect(request.amount).toBe(5);
    });
  });

  describe('createStopLossOrderRequest', () => {
    it('should create a stop loss order request with default sell side', () => {
      const request = createStopLossOrderRequest('BTC/USDT:USDT', 1, 45000);

      expect(request.symbol).toBe('BTC/USDT:USDT');
      expect(request.type).toBe('stopMarket');
      expect(request.side).toBe('sell');
      expect(request.amount).toBe(1);
      expect(request.stopPrice).toBe(45000);
      expect(request.reduceOnly).toBe(true);
    });

    it('should allow buy side for short positions', () => {
      const request = createStopLossOrderRequest('BTC/USDT:USDT', 1, 55000, 'buy');

      expect(request.side).toBe('buy');
    });
  });

  describe('createTakeProfitOrderRequest', () => {
    it('should create a take profit order request', () => {
      const request = createTakeProfitOrderRequest('BTC/USDT:USDT', 1, 60000);

      expect(request.symbol).toBe('BTC/USDT:USDT');
      expect(request.type).toBe('limit');
      expect(request.side).toBe('sell');
      expect(request.amount).toBe(1);
      expect(request.price).toBe(60000);
      expect(request.reduceOnly).toBe(true);
    });
  });

  describe('createStopLimitOrderRequest', () => {
    it('should create a stop limit order request', () => {
      const request = createStopLimitOrderRequest('BTC/USDT:USDT', 1, 44500, 45000, 'sell');

      expect(request.symbol).toBe('BTC/USDT:USDT');
      expect(request.type).toBe('stopLimit');
      expect(request.side).toBe('sell');
      expect(request.amount).toBe(1);
      expect(request.price).toBe(44500);
      expect(request.stopPrice).toBe(45000);
    });
  });

  describe('validateOrderRequest', () => {
    it('should validate a valid limit order', () => {
      const request = createLimitBuyOrderRequest('BTC/USDT:USDT', 1, 50000);
      expect(validateOrderRequest(request)).toBe(true);
    });

    it('should validate a valid market order', () => {
      const request = createMarketBuyOrderRequest('BTC/USDT:USDT', 1);
      expect(validateOrderRequest(request)).toBe(true);
    });

    it('should throw for missing symbol', () => {
      expect(() => validateOrderRequest({
        type: 'market',
        side: 'buy',
        amount: 1,
      } as any)).toThrow('symbol');
    });

    it('should throw for invalid side', () => {
      expect(() => validateOrderRequest({
        symbol: 'BTC/USDT:USDT',
        type: 'market',
        side: 'invalid' as any,
        amount: 1,
      })).toThrow('side');
    });

    it('should throw for missing amount', () => {
      expect(() => validateOrderRequest({
        symbol: 'BTC/USDT:USDT',
        type: 'market',
        side: 'buy',
      } as any)).toThrow('amount');
    });

    it('should throw for non-positive amount', () => {
      expect(() => validateOrderRequest({
        symbol: 'BTC/USDT:USDT',
        type: 'market',
        side: 'buy',
        amount: 0,
      })).toThrow('amount');
    });

    it('should throw for limit order without price', () => {
      expect(() => validateOrderRequest({
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 1,
      })).toThrow('price');
    });

    it('should throw for stop order without stop price', () => {
      expect(() => validateOrderRequest({
        symbol: 'BTC/USDT:USDT',
        type: 'stopMarket',
        side: 'buy',
        amount: 1,
      })).toThrow('stop price');
    });
  });
});

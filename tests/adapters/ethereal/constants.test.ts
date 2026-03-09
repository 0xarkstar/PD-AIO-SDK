/**
 * Ethereal Constants Tests
 *
 * Tests for symbol mapping functions and constant values.
 */

import { describe, test, expect } from '@jest/globals';
import {
  unifiedToEthereal,
  etherealToUnified,
  ETHEREAL_API_URLS,
  ETHEREAL_RATE_LIMITS,
  ETHEREAL_ENDPOINT_WEIGHTS,
  ETHEREAL_ORDER_TYPES,
  ETHEREAL_ORDER_SIDES,
  ETHEREAL_TIME_IN_FORCE,
  ETHEREAL_ORDER_STATUS,
  ETHEREAL_KLINE_INTERVALS,
  ETHEREAL_DEFAULT_PRECISION,
  ETHEREAL_FUNDING_INTERVAL_HOURS,
  ETHEREAL_EIP712_DOMAIN,
  ETHEREAL_CHAIN_ID,
} from '../../../src/adapters/ethereal/constants.js';

describe('Ethereal Constants', () => {
  // =========================================================================
  // unifiedToEthereal
  // =========================================================================

  describe('unifiedToEthereal', () => {
    test('converts standard unified symbol', () => {
      expect(unifiedToEthereal('ETH/USD:USD')).toBe('ETH-USD');
    });

    test('converts BTC unified symbol', () => {
      expect(unifiedToEthereal('BTC/USD:USD')).toBe('BTC-USD');
    });

    test('converts symbol without settle part', () => {
      expect(unifiedToEthereal('SOL/USD')).toBe('SOL-USD');
    });

    test('throws on invalid symbol format (empty string)', () => {
      expect(() => unifiedToEthereal('')).toThrow('Invalid symbol format');
    });

    test('handles symbol with only base (no slash)', () => {
      // "ETH".split('/') -> ["ETH"], parts[1] is undefined, quotePart is ''
      // ''.split(':')[0] is '' -> quote defaults to 'USD' via ??
      // But quotePart.split(':')[0] returns '' (not nullish), so ?? doesn't trigger
      expect(unifiedToEthereal('ETH')).toBe('ETH-');
    });
  });

  // =========================================================================
  // etherealToUnified
  // =========================================================================

  describe('etherealToUnified', () => {
    test('converts standard Ethereal symbol', () => {
      expect(etherealToUnified('ETH-USD')).toBe('ETH/USD:USD');
    });

    test('converts BTC Ethereal symbol', () => {
      expect(etherealToUnified('BTC-USD')).toBe('BTC/USD:USD');
    });

    test('handles symbol without dash', () => {
      // No dash -> parts[0]=symbol, parts[1]=undefined -> quote="USD"
      expect(etherealToUnified('ETH')).toBe('ETH/USD:USD');
    });
  });

  // =========================================================================
  // Constant values
  // =========================================================================

  describe('constant values', () => {
    test('API URLs have mainnet and testnet', () => {
      expect(ETHEREAL_API_URLS.mainnet.rest).toContain('https://');
      expect(ETHEREAL_API_URLS.testnet.rest).toContain('testnet');
      expect(ETHEREAL_API_URLS.mainnet.websocket).toContain('wss://');
      expect(ETHEREAL_API_URLS.testnet.websocket).toContain('testnet');
    });

    test('rate limits are defined', () => {
      expect(ETHEREAL_RATE_LIMITS.rest.maxRequests).toBe(600);
      expect(ETHEREAL_RATE_LIMITS.rest.windowMs).toBe(60000);
      expect(ETHEREAL_RATE_LIMITS.order.maxRequests).toBe(300);
    });

    test('endpoint weights are defined for key features', () => {
      expect(ETHEREAL_ENDPOINT_WEIGHTS.fetchMarkets).toBe(1);
      expect(ETHEREAL_ENDPOINT_WEIGHTS.createOrder).toBe(5);
      expect(ETHEREAL_ENDPOINT_WEIGHTS.cancelAllOrders).toBe(10);
    });

    test('order types map correctly', () => {
      expect(ETHEREAL_ORDER_TYPES.market).toBe('MARKET');
      expect(ETHEREAL_ORDER_TYPES.limit).toBe('LIMIT');
    });

    test('order sides map correctly', () => {
      expect(ETHEREAL_ORDER_SIDES.buy).toBe('BUY');
      expect(ETHEREAL_ORDER_SIDES.sell).toBe('SELL');
    });

    test('time in force maps correctly', () => {
      expect(ETHEREAL_TIME_IN_FORCE.GTC).toBe('GTC');
      expect(ETHEREAL_TIME_IN_FORCE.PO).toBe('POST_ONLY');
    });

    test('order status maps to unified values', () => {
      expect(ETHEREAL_ORDER_STATUS.NEW).toBe('open');
      expect(ETHEREAL_ORDER_STATUS.FILLED).toBe('filled');
      expect(ETHEREAL_ORDER_STATUS.CANCELLED).toBe('canceled');
      expect(ETHEREAL_ORDER_STATUS.CANCELED).toBe('canceled');
      expect(ETHEREAL_ORDER_STATUS.PARTIALLY_FILLED).toBe('partiallyFilled');
    });

    test('kline intervals are defined', () => {
      expect(ETHEREAL_KLINE_INTERVALS['1h']).toBe('1h');
      expect(ETHEREAL_KLINE_INTERVALS['1d']).toBe('1d');
    });

    test('default precision values', () => {
      expect(ETHEREAL_DEFAULT_PRECISION.price).toBe(8);
      expect(ETHEREAL_DEFAULT_PRECISION.amount).toBe(6);
    });

    test('funding interval is 1 hour', () => {
      expect(ETHEREAL_FUNDING_INTERVAL_HOURS).toBe(1);
    });

    test('EIP-712 domain is defined', () => {
      expect(ETHEREAL_EIP712_DOMAIN.name).toBe('Ethereal');
      expect(ETHEREAL_EIP712_DOMAIN.version).toBe('1');
      expect(ETHEREAL_EIP712_DOMAIN.chainId).toBe(ETHEREAL_CHAIN_ID);
    });
  });
});

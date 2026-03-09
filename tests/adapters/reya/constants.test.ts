/**
 * Reya Constants Tests
 *
 * Tests for symbol mapping functions and constant values.
 */

import { describe, test, expect } from '@jest/globals';
import { unifiedToReya, reyaToUnified, REYA_CHAIN_ID, REYA_EIP712_DOMAIN, REYA_RATE_LIMIT, REYA_EXCHANGE_ID, REYA_FUNDING_INTERVAL_HOURS, REYA_DEFAULT_PRECISION } from '../../../src/adapters/reya/constants.js';

describe('Reya Constants', () => {
  // =========================================================================
  // unifiedToReya
  // =========================================================================

  describe('unifiedToReya', () => {
    test('converts BTC/USD:USD to BTCRUSDPERP', () => {
      expect(unifiedToReya('BTC/USD:USD')).toBe('BTCRUSDPERP');
    });

    test('converts ETH/USD:USD to ETHRUSDPERP', () => {
      expect(unifiedToReya('ETH/USD:USD')).toBe('ETHRUSDPERP');
    });

    test('converts SOL/USD:USD to SOLRUSDPERP', () => {
      expect(unifiedToReya('SOL/USD:USD')).toBe('SOLRUSDPERP');
    });

    test('handles symbol without settle part', () => {
      expect(unifiedToReya('BTC/USD')).toBe('BTCRUSDPERP');
    });

    test('throws on empty base', () => {
      expect(() => unifiedToReya('/USD:USD')).toThrow('Invalid symbol format');
    });

    test('defaults quote to empty when no slash present', () => {
      // 'BTC' has no '/' so parts[1] is undefined → quotePart is ''
      // quote becomes '' from split(':')[0], so result is 'BTCRPERP'
      expect(unifiedToReya('BTC')).toBe('BTCRPERP');
    });
  });

  // =========================================================================
  // reyaToUnified
  // =========================================================================

  describe('reyaToUnified', () => {
    test('converts BTCRUSDPERP to BTC/USD:USD', () => {
      expect(reyaToUnified('BTCRUSDPERP')).toBe('BTC/USD:USD');
    });

    test('converts ETHRUSDPERP to ETH/USD:USD', () => {
      expect(reyaToUnified('ETHRUSDPERP')).toBe('ETH/USD:USD');
    });

    test('converts SOLRUSDPERP to SOL/USD:USD', () => {
      expect(reyaToUnified('SOLRUSDPERP')).toBe('SOL/USD:USD');
    });

    test('handles spot market like WETHRUSD', () => {
      expect(reyaToUnified('WETHRUSD')).toBe('WETH/USD:USD');
    });

    test('returns raw symbol when no PERP or RUSD found', () => {
      expect(reyaToUnified('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  // =========================================================================
  // Static constants
  // =========================================================================

  describe('static constants', () => {
    test('REYA_CHAIN_ID is 1729', () => {
      expect(REYA_CHAIN_ID).toBe(1729);
    });

    test('REYA_EIP712_DOMAIN has correct shape', () => {
      expect(REYA_EIP712_DOMAIN).toEqual({
        name: 'Reya',
        version: '1',
        chainId: 1729,
      });
    });

    test('REYA_RATE_LIMIT has required fields', () => {
      expect(REYA_RATE_LIMIT.maxRequests).toBe(600);
      expect(REYA_RATE_LIMIT.windowMs).toBe(60000);
      expect(REYA_RATE_LIMIT.weights).toBeDefined();
      expect(REYA_RATE_LIMIT.weights.createOrder).toBe(5);
    });

    test('REYA_EXCHANGE_ID is 1', () => {
      expect(REYA_EXCHANGE_ID).toBe(1);
    });

    test('REYA_FUNDING_INTERVAL_HOURS is 1', () => {
      expect(REYA_FUNDING_INTERVAL_HOURS).toBe(1);
    });

    test('REYA_DEFAULT_PRECISION has price and amount', () => {
      expect(REYA_DEFAULT_PRECISION.price).toBe(8);
      expect(REYA_DEFAULT_PRECISION.amount).toBe(6);
    });
  });
});

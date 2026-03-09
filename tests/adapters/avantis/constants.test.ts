/**
 * Avantis Constants Unit Tests
 */

import { describe, test, expect } from '@jest/globals';
import {
  AVANTIS_PAIR_INDEX_MAP,
  AVANTIS_INDEX_TO_SYMBOL,
  AVANTIS_CONTRACTS_MAINNET,
  AVANTIS_CONTRACTS_TESTNET,
  AVANTIS_ORDER_TYPES,
  AVANTIS_DEFAULT_PRECISION,
  AVANTIS_FUNDING_INTERVAL_HOURS,
  AVANTIS_RATE_LIMIT,
  PYTH_PRICE_FEED_IDS,
  unifiedToAvantis,
  avantisToUnified,
} from '../../../src/adapters/avantis/constants.js';

describe('Avantis Constants', () => {
  describe('unifiedToAvantis', () => {
    test('should convert BTC/USD:USD to pair index 0', () => {
      expect(unifiedToAvantis('BTC/USD:USD')).toBe(0);
    });

    test('should convert ETH/USD:USD to pair index 1', () => {
      expect(unifiedToAvantis('ETH/USD:USD')).toBe(1);
    });

    test('should convert SOL/USD:USD to pair index 2', () => {
      expect(unifiedToAvantis('SOL/USD:USD')).toBe(2);
    });

    test('should throw for unsupported symbol', () => {
      expect(() => unifiedToAvantis('UNKNOWN/USD:USD')).toThrow('Unsupported Avantis symbol');
    });

    test('should handle symbol with only base part', () => {
      expect(unifiedToAvantis('BTC')).toBe(0);
    });
  });

  describe('avantisToUnified', () => {
    test('should convert pair index 0 to BTC/USD:USD', () => {
      expect(avantisToUnified(0)).toBe('BTC/USD:USD');
    });

    test('should convert pair index 1 to ETH/USD:USD', () => {
      expect(avantisToUnified(1)).toBe('ETH/USD:USD');
    });

    test('should convert pair index 7 to OP/USD:USD', () => {
      expect(avantisToUnified(7)).toBe('OP/USD:USD');
    });

    test('should throw for unknown pair index', () => {
      expect(() => avantisToUnified(999)).toThrow('Unknown Avantis pairIndex');
    });
  });

  describe('AVANTIS_PAIR_INDEX_MAP', () => {
    test('should have 8 pairs', () => {
      expect(Object.keys(AVANTIS_PAIR_INDEX_MAP)).toHaveLength(8);
    });

    test('should have sequential indices', () => {
      const values = Object.values(AVANTIS_PAIR_INDEX_MAP).sort((a, b) => a - b);
      expect(values).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });
  });

  describe('AVANTIS_INDEX_TO_SYMBOL', () => {
    test('should be reverse of AVANTIS_PAIR_INDEX_MAP', () => {
      for (const [symbol, index] of Object.entries(AVANTIS_PAIR_INDEX_MAP)) {
        expect(AVANTIS_INDEX_TO_SYMBOL[index]).toBe(symbol);
      }
    });
  });

  describe('Contract addresses', () => {
    test('mainnet contracts should have all required fields', () => {
      expect(AVANTIS_CONTRACTS_MAINNET).toHaveProperty('trading');
      expect(AVANTIS_CONTRACTS_MAINNET).toHaveProperty('storage');
      expect(AVANTIS_CONTRACTS_MAINNET).toHaveProperty('pairInfo');
      expect(AVANTIS_CONTRACTS_MAINNET).toHaveProperty('pythOracle');
      expect(AVANTIS_CONTRACTS_MAINNET).toHaveProperty('callbacks');
      expect(AVANTIS_CONTRACTS_MAINNET).toHaveProperty('usdc');
    });

    test('testnet contracts should have all required fields', () => {
      expect(AVANTIS_CONTRACTS_TESTNET).toHaveProperty('trading');
      expect(AVANTIS_CONTRACTS_TESTNET).toHaveProperty('storage');
      expect(AVANTIS_CONTRACTS_TESTNET).toHaveProperty('pairInfo');
      expect(AVANTIS_CONTRACTS_TESTNET).toHaveProperty('pythOracle');
      expect(AVANTIS_CONTRACTS_TESTNET).toHaveProperty('callbacks');
      expect(AVANTIS_CONTRACTS_TESTNET).toHaveProperty('usdc');
    });

    test('mainnet and testnet addresses should differ', () => {
      expect(AVANTIS_CONTRACTS_MAINNET.trading).not.toBe(AVANTIS_CONTRACTS_TESTNET.trading);
    });
  });

  describe('PYTH_PRICE_FEED_IDS', () => {
    test('should have feed IDs for all mapped pairs', () => {
      for (const base of Object.keys(AVANTIS_PAIR_INDEX_MAP)) {
        expect(PYTH_PRICE_FEED_IDS[base]).toBeDefined();
        expect(PYTH_PRICE_FEED_IDS[base]).toMatch(/^0x[a-f0-9]{64}$/);
      }
    });
  });

  describe('Static constants', () => {
    test('order types should be defined', () => {
      expect(AVANTIS_ORDER_TYPES.MARKET).toBe(0);
      expect(AVANTIS_ORDER_TYPES.LIMIT).toBe(1);
      expect(AVANTIS_ORDER_TYPES.STOP_LIMIT).toBe(2);
    });

    test('funding interval should be 1 hour', () => {
      expect(AVANTIS_FUNDING_INTERVAL_HOURS).toBe(1);
    });

    test('default precision values', () => {
      expect(AVANTIS_DEFAULT_PRECISION.price).toBe(8);
      expect(AVANTIS_DEFAULT_PRECISION.amount).toBe(6);
    });

    test('rate limit defaults', () => {
      expect(AVANTIS_RATE_LIMIT.maxRequests).toBe(100);
      expect(AVANTIS_RATE_LIMIT.windowMs).toBe(60000);
      expect(AVANTIS_RATE_LIMIT.weights).toBeDefined();
    });
  });
});

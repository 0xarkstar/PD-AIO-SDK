/**
 * Drift Protocol Constants Tests
 */

import { describe, test, expect } from '@jest/globals';
import {
  DRIFT_API_URLS,
  DRIFT_MAINNET_DLOB_API,
  DRIFT_MAINNET_DATA_API,
  DRIFT_DEVNET_DLOB_API,
  DRIFT_PROGRAM_ID,
  DRIFT_PRECISION,
  DRIFT_RATE_LIMIT,
  DRIFT_PERP_MARKETS,
  DRIFT_MARKET_INDEX_MAP,
  DRIFT_ORDER_TYPES,
  DRIFT_DIRECTIONS,
  DRIFT_MARKET_TYPES,
  DRIFT_FUNDING,
  DRIFT_WS_CHANNELS,
  DRIFT_ERROR_MESSAGES,
  unifiedToDrift,
  driftToUnified,
  getMarketIndex,
  getSymbolFromIndex,
  getBaseToken,
} from '../../src/adapters/drift/constants.js';

describe('Drift Constants', () => {
  describe('API URLs', () => {
    test('should have valid mainnet URLs', () => {
      expect(DRIFT_API_URLS.mainnet.dlob).toBe(DRIFT_MAINNET_DLOB_API);
      expect(DRIFT_API_URLS.mainnet.data).toBe(DRIFT_MAINNET_DATA_API);
      expect(DRIFT_API_URLS.mainnet.dlob).toContain('https://');
      expect(DRIFT_API_URLS.mainnet.rpc).toContain('https://');
    });

    test('should have valid devnet URLs', () => {
      expect(DRIFT_API_URLS.devnet.dlob).toBe(DRIFT_DEVNET_DLOB_API);
      expect(DRIFT_API_URLS.devnet.dlob).toContain('https://');
      expect(DRIFT_API_URLS.devnet.rpc).toContain('devnet');
    });
  });

  describe('Program ID', () => {
    test('should have valid Drift program ID', () => {
      expect(DRIFT_PROGRAM_ID).toBe('dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH');
      expect(DRIFT_PROGRAM_ID).toHaveLength(43); // Solana base58 pubkey
    });
  });

  describe('Precision Constants', () => {
    test('should have correct precision values', () => {
      expect(DRIFT_PRECISION.BASE).toBe(1e9);
      expect(DRIFT_PRECISION.QUOTE).toBe(1e6);
      expect(DRIFT_PRECISION.PRICE).toBe(1e6);
      expect(DRIFT_PRECISION.FUNDING_RATE).toBe(1e9);
      expect(DRIFT_PRECISION.MARGIN).toBe(1e4);
    });
  });

  describe('Rate Limits', () => {
    test('should have reasonable rate limits', () => {
      expect(DRIFT_RATE_LIMIT.maxRequests).toBeGreaterThan(0);
      expect(DRIFT_RATE_LIMIT.windowMs).toBeGreaterThan(0);
    });

    test('should have weights for different endpoints', () => {
      expect(DRIFT_RATE_LIMIT.weights.fetchMarkets).toBeDefined();
      expect(DRIFT_RATE_LIMIT.weights.fetchOrderBook).toBeDefined();
      expect(DRIFT_RATE_LIMIT.weights.createOrder).toBeDefined();
    });
  });

  describe('Perp Markets', () => {
    test('should have SOL-PERP market', () => {
      const sol = DRIFT_PERP_MARKETS['SOL-PERP'];
      expect(sol).toBeDefined();
      expect(sol.marketIndex).toBe(0);
      expect(sol.symbol).toBe('SOL/USD:USD');
      expect(sol.baseAsset).toBe('SOL');
      expect(sol.maxLeverage).toBe(20);
    });

    test('should have BTC-PERP market', () => {
      const btc = DRIFT_PERP_MARKETS['BTC-PERP'];
      expect(btc).toBeDefined();
      expect(btc.marketIndex).toBe(1);
      expect(btc.symbol).toBe('BTC/USD:USD');
      expect(btc.baseAsset).toBe('BTC');
      expect(btc.maxLeverage).toBe(20);
    });

    test('should have ETH-PERP market', () => {
      const eth = DRIFT_PERP_MARKETS['ETH-PERP'];
      expect(eth).toBeDefined();
      expect(eth.marketIndex).toBe(2);
      expect(eth.symbol).toBe('ETH/USD:USD');
      expect(eth.baseAsset).toBe('ETH');
    });

    test('should have valid market configuration', () => {
      for (const [key, market] of Object.entries(DRIFT_PERP_MARKETS)) {
        expect(market.marketIndex).toBeGreaterThanOrEqual(0);
        expect(market.symbol).toContain('/USD:USD');
        expect(market.baseAsset).toBeTruthy();
        expect(market.tickSize).toBeGreaterThan(0);
        expect(market.stepSize).toBeGreaterThan(0);
        expect(market.minOrderSize).toBeGreaterThan(0);
        expect(market.maxLeverage).toBeGreaterThan(0);
        expect(market.maintenanceMarginRatio).toBeLessThan(1);
      }
    });
  });

  describe('Market Index Map', () => {
    test('should correctly map indices to symbols', () => {
      expect(DRIFT_MARKET_INDEX_MAP[0]).toBe('SOL-PERP');
      expect(DRIFT_MARKET_INDEX_MAP[1]).toBe('BTC-PERP');
      expect(DRIFT_MARKET_INDEX_MAP[2]).toBe('ETH-PERP');
    });

    test('should be consistent with DRIFT_PERP_MARKETS', () => {
      for (const [index, symbol] of Object.entries(DRIFT_MARKET_INDEX_MAP)) {
        const market = DRIFT_PERP_MARKETS[symbol as keyof typeof DRIFT_PERP_MARKETS];
        expect(market).toBeDefined();
        expect(market.marketIndex).toBe(Number(index));
      }
    });
  });

  describe('Order Types', () => {
    test('should have all required order types', () => {
      expect(DRIFT_ORDER_TYPES.MARKET).toBe('market');
      expect(DRIFT_ORDER_TYPES.LIMIT).toBe('limit');
      expect(DRIFT_ORDER_TYPES.TRIGGER_MARKET).toBe('triggerMarket');
      expect(DRIFT_ORDER_TYPES.TRIGGER_LIMIT).toBe('triggerLimit');
      expect(DRIFT_ORDER_TYPES.ORACLE).toBe('oracle');
    });
  });

  describe('Directions', () => {
    test('should have long and short', () => {
      expect(DRIFT_DIRECTIONS.LONG).toBe('long');
      expect(DRIFT_DIRECTIONS.SHORT).toBe('short');
    });
  });

  describe('Market Types', () => {
    test('should have perp and spot', () => {
      expect(DRIFT_MARKET_TYPES.PERP).toBe('perp');
      expect(DRIFT_MARKET_TYPES.SPOT).toBe('spot');
    });
  });

  describe('Funding Constants', () => {
    test('should have hourly funding interval', () => {
      expect(DRIFT_FUNDING.intervalHours).toBe(1);
      expect(DRIFT_FUNDING.settlementFrequency).toBe(3600);
    });
  });

  describe('WebSocket Channels', () => {
    test('should have all required channels', () => {
      expect(DRIFT_WS_CHANNELS.ORDERBOOK).toBeDefined();
      expect(DRIFT_WS_CHANNELS.TRADES).toBeDefined();
      expect(DRIFT_WS_CHANNELS.FUNDING).toBeDefined();
      expect(DRIFT_WS_CHANNELS.USER).toBeDefined();
      expect(DRIFT_WS_CHANNELS.PERP_MARKETS).toBeDefined();
    });
  });

  describe('Error Messages', () => {
    test('should have error message patterns', () => {
      expect(Object.keys(DRIFT_ERROR_MESSAGES).length).toBeGreaterThan(0);
      for (const [pattern, code] of Object.entries(DRIFT_ERROR_MESSAGES)) {
        expect(typeof pattern).toBe('string');
        expect(typeof code).toBe('string');
      }
    });
  });

  describe('Symbol Conversion Functions', () => {
    describe('unifiedToDrift', () => {
      test('should convert unified symbol to Drift format', () => {
        expect(unifiedToDrift('SOL/USD:USD')).toBe('SOL-PERP');
        expect(unifiedToDrift('BTC/USD:USD')).toBe('BTC-PERP');
        expect(unifiedToDrift('ETH/USD:USD')).toBe('ETH-PERP');
      });

      test('should handle edge cases', () => {
        expect(unifiedToDrift('UNKNOWN/USD:USD')).toBe('UNKNOWN-PERP');
      });
    });

    describe('driftToUnified', () => {
      test('should convert Drift symbol to unified format', () => {
        expect(driftToUnified('SOL-PERP')).toBe('SOL/USD:USD');
        expect(driftToUnified('BTC-PERP')).toBe('BTC/USD:USD');
        expect(driftToUnified('ETH-PERP')).toBe('ETH/USD:USD');
      });

      test('should handle already unified format symbols', () => {
        expect(driftToUnified('SOL/USD:USD')).toBe('SOL/USD:USD/USD:USD');
      });
    });

    describe('getMarketIndex', () => {
      test('should return correct market index', () => {
        expect(getMarketIndex('SOL/USD:USD')).toBe(0);
        expect(getMarketIndex('BTC/USD:USD')).toBe(1);
        expect(getMarketIndex('ETH/USD:USD')).toBe(2);
      });

      test('should throw for unknown symbols', () => {
        expect(() => getMarketIndex('UNKNOWN/USD:USD')).toThrow();
      });
    });

    describe('getSymbolFromIndex', () => {
      test('should return correct drift symbol', () => {
        expect(getSymbolFromIndex(0)).toBe('SOL-PERP');
        expect(getSymbolFromIndex(1)).toBe('BTC-PERP');
        expect(getSymbolFromIndex(2)).toBe('ETH-PERP');
      });

      test('should return undefined for unknown index', () => {
        expect(getSymbolFromIndex(999)).toBeUndefined();
      });
    });

    describe('getBaseToken', () => {
      test('should extract base token', () => {
        expect(getBaseToken('SOL/USD:USD')).toBe('SOL');
        expect(getBaseToken('BTC/USD:USD')).toBe('BTC');
        expect(getBaseToken('SOL-PERP')).toBe('SOL-PERP');
      });
    });
  });
});

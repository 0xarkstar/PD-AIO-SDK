/**
 * Jupiter Constants Unit Tests
 */

import { describe, test, expect } from '@jest/globals';
import {
  JUPITER_API_URLS,
  JUPITER_PERPS_PROGRAM_ID,
  JLP_TOKEN_MINT,
  JUPITER_TOKEN_MINTS,
  JUPITER_MARKETS,
  JUPITER_RATE_LIMIT,
  JUPITER_BORROW_FEE,
  unifiedToJupiter,
  jupiterToUnified,
  getBaseToken,
} from '../../src/adapters/jupiter/constants.js';

describe('Jupiter Constants', () => {
  describe('API URLs', () => {
    test('has mainnet price API URL (Pyth Network)', () => {
      expect(JUPITER_API_URLS.mainnet.price).toBe('https://hermes.pyth.network/v2/updates/price/latest');
    });

    test('has mainnet stats API URL', () => {
      expect(JUPITER_API_URLS.mainnet.stats).toBe('https://perp-api.jup.ag');
    });
  });

  describe('Program IDs', () => {
    test('has valid perps program ID', () => {
      expect(JUPITER_PERPS_PROGRAM_ID).toBe('PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2verr');
    });

    test('has valid JLP token mint', () => {
      expect(JLP_TOKEN_MINT).toBe('27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4');
    });
  });

  describe('Token Mints', () => {
    test('has SOL mint', () => {
      expect(JUPITER_TOKEN_MINTS.SOL).toBe('So11111111111111111111111111111111111111112');
    });

    test('has ETH mint (Wormhole)', () => {
      expect(JUPITER_TOKEN_MINTS.ETH).toBe('7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs');
    });

    test('has BTC mint (Wormhole)', () => {
      expect(JUPITER_TOKEN_MINTS.BTC).toBe('3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh');
    });

    test('has USDC mint', () => {
      expect(JUPITER_TOKEN_MINTS.USDC).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    });

    test('has USDT mint', () => {
      expect(JUPITER_TOKEN_MINTS.USDT).toBe('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
    });
  });

  describe('Markets', () => {
    test('has SOL-PERP market', () => {
      const solMarket = JUPITER_MARKETS['SOL-PERP'];
      expect(solMarket).toBeDefined();
      expect(solMarket.symbol).toBe('SOL/USD:USD');
      expect(solMarket.baseToken).toBe('SOL');
      expect(solMarket.maxLeverage).toBe(250);
    });

    test('has ETH-PERP market', () => {
      const ethMarket = JUPITER_MARKETS['ETH-PERP'];
      expect(ethMarket).toBeDefined();
      expect(ethMarket.symbol).toBe('ETH/USD:USD');
      expect(ethMarket.baseToken).toBe('ETH');
      expect(ethMarket.maxLeverage).toBe(250);
    });

    test('has BTC-PERP market', () => {
      const btcMarket = JUPITER_MARKETS['BTC-PERP'];
      expect(btcMarket).toBeDefined();
      expect(btcMarket.symbol).toBe('BTC/USD:USD');
      expect(btcMarket.baseToken).toBe('BTC');
      expect(btcMarket.maxLeverage).toBe(250);
    });

    test('all markets have required properties', () => {
      for (const [key, market] of Object.entries(JUPITER_MARKETS)) {
        expect(market.symbol).toBeDefined();
        expect(market.baseToken).toBeDefined();
        expect(market.maxLeverage).toBeGreaterThan(0);
        expect(market.minPositionSize).toBeGreaterThan(0);
        expect(market.tickSize).toBeGreaterThan(0);
        expect(market.stepSize).toBeGreaterThan(0);
      }
    });
  });

  describe('Rate Limits', () => {
    test('has rate limit configuration', () => {
      expect(JUPITER_RATE_LIMIT.maxRequests).toBe(60);
      expect(JUPITER_RATE_LIMIT.windowMs).toBe(60000);
    });

    test('has endpoint weights', () => {
      expect(JUPITER_RATE_LIMIT.weights.fetchMarkets).toBeDefined();
      expect(JUPITER_RATE_LIMIT.weights.fetchTicker).toBeDefined();
      expect(JUPITER_RATE_LIMIT.weights.fetchPositions).toBeDefined();
      expect(JUPITER_RATE_LIMIT.weights.createOrder).toBeDefined();
    });
  });

  describe('Borrow Fee', () => {
    test('has borrow fee configuration', () => {
      expect(JUPITER_BORROW_FEE.intervalHours).toBe(1);
      expect(JUPITER_BORROW_FEE.minRate).toBe(0.0001);
      expect(JUPITER_BORROW_FEE.maxRate).toBe(0.01);
    });
  });
});

describe('Symbol Conversion', () => {
  describe('unifiedToJupiter', () => {
    test('converts SOL/USD:USD to SOL-PERP', () => {
      expect(unifiedToJupiter('SOL/USD:USD')).toBe('SOL-PERP');
    });

    test('converts ETH/USD:USD to ETH-PERP', () => {
      expect(unifiedToJupiter('ETH/USD:USD')).toBe('ETH-PERP');
    });

    test('converts BTC/USD:USD to BTC-PERP', () => {
      expect(unifiedToJupiter('BTC/USD:USD')).toBe('BTC-PERP');
    });

    test('throws on invalid symbol format', () => {
      expect(() => unifiedToJupiter('')).toThrow();
    });
  });

  describe('jupiterToUnified', () => {
    test('converts SOL-PERP to SOL/USD:USD', () => {
      expect(jupiterToUnified('SOL-PERP')).toBe('SOL/USD:USD');
    });

    test('converts ETH-PERP to ETH/USD:USD', () => {
      expect(jupiterToUnified('ETH-PERP')).toBe('ETH/USD:USD');
    });

    test('converts BTC-PERP to BTC/USD:USD', () => {
      expect(jupiterToUnified('BTC-PERP')).toBe('BTC/USD:USD');
    });
  });

  describe('getBaseToken', () => {
    test('extracts base token from unified symbol', () => {
      expect(getBaseToken('SOL/USD:USD')).toBe('SOL');
      expect(getBaseToken('ETH/USD:USD')).toBe('ETH');
      expect(getBaseToken('BTC/USD:USD')).toBe('BTC');
    });

    test('returns empty string for invalid symbol', () => {
      expect(getBaseToken('')).toBe('');
    });
  });
});

describe('Bidirectional Symbol Conversion', () => {
  const testCases = [
    { unified: 'SOL/USD:USD', jupiter: 'SOL-PERP' },
    { unified: 'ETH/USD:USD', jupiter: 'ETH-PERP' },
    { unified: 'BTC/USD:USD', jupiter: 'BTC-PERP' },
  ];

  test.each(testCases)('$unified <-> $jupiter', ({ unified, jupiter }) => {
    expect(unifiedToJupiter(unified)).toBe(jupiter);
    expect(jupiterToUnified(jupiter)).toBe(unified);
  });
});

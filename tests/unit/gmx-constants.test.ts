/**
 * GMX v2 Constants Unit Tests
 */

import { describe, test, expect } from '@jest/globals';
import {
  GMX_API_URLS,
  GMX_PRECISION,
  GMX_RATE_LIMIT,
  GMX_MARKETS,
  GMX_MARKET_ADDRESS_MAP,
  GMX_ORDER_TYPES,
  GMX_DECREASE_POSITION_SWAP_TYPES,
  GMX_CONTRACTS,
  GMX_ERROR_MESSAGES,
  GMX_FUNDING,
  GMX_ARBITRUM_API,
  GMX_AVALANCHE_API,
  unifiedToGmx,
  gmxToUnified,
  getMarketByAddress,
  getBaseToken,
  getTokenDecimals,
  getOraclePriceDivisor,
  getMarketsForChain,
  type GMXMarketKey,
} from '../../src/adapters/gmx/constants.js';

describe('GMX API URLs', () => {
  test('should have arbitrum endpoints', () => {
    expect(GMX_API_URLS.arbitrum).toBeDefined();
    expect(GMX_API_URLS.arbitrum.api).toContain('arbitrum');
    expect(GMX_API_URLS.arbitrum.chainId).toBe(42161);
  });

  test('should have avalanche endpoints', () => {
    expect(GMX_API_URLS.avalanche).toBeDefined();
    expect(GMX_API_URLS.avalanche.api).toContain('avalanche');
    expect(GMX_API_URLS.avalanche.chainId).toBe(43114);
  });

  test('should have testnet endpoints', () => {
    expect(GMX_API_URLS.arbitrumSepolia).toBeDefined();
    expect(GMX_API_URLS.arbitrumSepolia.chainId).toBe(421614);
  });

  test('should export shorthand API URLs', () => {
    expect(GMX_ARBITRUM_API).toBe(GMX_API_URLS.arbitrum.api);
    expect(GMX_AVALANCHE_API).toBe(GMX_API_URLS.avalanche.api);
  });
});

describe('GMX Precision Constants', () => {
  test('should have PRICE precision at 1e30', () => {
    expect(GMX_PRECISION.PRICE).toBe(1e30);
  });

  test('should have USD precision at 1e30', () => {
    expect(GMX_PRECISION.USD).toBe(1e30);
  });

  test('should have BASIS_POINTS at 1e4', () => {
    expect(GMX_PRECISION.BASIS_POINTS).toBe(10000);
  });

  test('should have token decimals defined', () => {
    expect(GMX_PRECISION.TOKEN_DECIMALS.ETH).toBe(18);
    expect(GMX_PRECISION.TOKEN_DECIMALS.BTC).toBe(8);
    expect(GMX_PRECISION.TOKEN_DECIMALS.USDC).toBe(6);
    expect(GMX_PRECISION.TOKEN_DECIMALS.AVAX).toBe(18);
  });
});

describe('GMX Rate Limits', () => {
  test('should have maxRequests defined', () => {
    expect(GMX_RATE_LIMIT.maxRequests).toBeGreaterThan(0);
  });

  test('should have window in milliseconds', () => {
    expect(GMX_RATE_LIMIT.windowMs).toBe(60000);
  });

  test('should have weights for various endpoints', () => {
    expect(GMX_RATE_LIMIT.weights.fetchMarkets).toBeDefined();
    expect(GMX_RATE_LIMIT.weights.fetchTicker).toBeDefined();
    expect(GMX_RATE_LIMIT.weights.fetchOHLCV).toBeDefined();
  });
});

describe('GMX Markets', () => {
  test('should have ETH/USD:ETH market on Arbitrum', () => {
    const market = GMX_MARKETS['ETH/USD:ETH'];
    expect(market).toBeDefined();
    expect(market.baseAsset).toBe('ETH');
    expect(market.quoteAsset).toBe('USD');
    expect(market.settleAsset).toBe('ETH');
    expect(market.chain).toBe('arbitrum');
    expect(market.marketAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  test('should have BTC/USD:BTC market on Arbitrum', () => {
    const market = GMX_MARKETS['BTC/USD:BTC'];
    expect(market).toBeDefined();
    expect(market.baseAsset).toBe('BTC');
    expect(market.chain).toBe('arbitrum');
    expect(market.maxLeverage).toBe(100);
  });

  test('should have AVAX/USD:AVAX market on Avalanche', () => {
    const market = GMX_MARKETS['AVAX/USD:AVAX'];
    expect(market).toBeDefined();
    expect(market.baseAsset).toBe('AVAX');
    expect(market.chain).toBe('avalanche');
  });

  test('all markets should have required properties', () => {
    for (const [key, market] of Object.entries(GMX_MARKETS)) {
      expect(market.marketAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(market.indexToken).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(market.longToken).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(market.shortToken).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(market.symbol).toBe(key);
      expect(market.baseAsset).toBeTruthy();
      expect(market.quoteAsset).toBe('USD');
      expect(market.maxLeverage).toBeGreaterThan(0);
      expect(market.minOrderSize).toBeGreaterThan(0);
      expect(['arbitrum', 'avalanche']).toContain(market.chain);
    }
  });
});

describe('GMX Market Address Map', () => {
  test('should map addresses to market keys', () => {
    const ethMarket = GMX_MARKETS['ETH/USD:ETH'];
    const mappedKey = GMX_MARKET_ADDRESS_MAP[ethMarket.marketAddress.toLowerCase()];
    expect(mappedKey).toBe('ETH/USD:ETH');
  });

  test('should have lowercase addresses as keys', () => {
    for (const key of Object.keys(GMX_MARKET_ADDRESS_MAP)) {
      expect(key).toBe(key.toLowerCase());
    }
  });

  test('should map all markets', () => {
    const marketCount = Object.keys(GMX_MARKETS).length;
    const mapCount = Object.keys(GMX_MARKET_ADDRESS_MAP).length;
    expect(mapCount).toBe(marketCount);
  });
});

describe('GMX Order Types', () => {
  test('should have market increase type', () => {
    expect(GMX_ORDER_TYPES.MARKET_INCREASE).toBe(0);
  });

  test('should have market decrease type', () => {
    expect(GMX_ORDER_TYPES.MARKET_DECREASE).toBe(1);
  });

  test('should have limit increase type', () => {
    expect(GMX_ORDER_TYPES.LIMIT_INCREASE).toBe(2);
  });

  test('should have limit decrease type', () => {
    expect(GMX_ORDER_TYPES.LIMIT_DECREASE).toBe(3);
  });

  test('should have stop loss type', () => {
    expect(GMX_ORDER_TYPES.STOP_LOSS).toBe(4);
  });

  test('should have liquidation type', () => {
    expect(GMX_ORDER_TYPES.LIQUIDATION).toBe(5);
  });
});

describe('GMX Decrease Position Swap Types', () => {
  test('should have NO_SWAP type', () => {
    expect(GMX_DECREASE_POSITION_SWAP_TYPES.NO_SWAP).toBe(0);
  });

  test('should have swap PNL to collateral type', () => {
    expect(GMX_DECREASE_POSITION_SWAP_TYPES.SWAP_PNL_TOKEN_TO_COLLATERAL).toBe(1);
  });

  test('should have swap collateral to PNL type', () => {
    expect(GMX_DECREASE_POSITION_SWAP_TYPES.SWAP_COLLATERAL_TO_PNL_TOKEN).toBe(2);
  });
});

describe('GMX Contracts', () => {
  test('should have Arbitrum contracts', () => {
    expect(GMX_CONTRACTS.arbitrum.exchangeRouter).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(GMX_CONTRACTS.arbitrum.dataStore).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(GMX_CONTRACTS.arbitrum.reader).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  test('should have Avalanche contracts', () => {
    expect(GMX_CONTRACTS.avalanche.exchangeRouter).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(GMX_CONTRACTS.avalanche.dataStore).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(GMX_CONTRACTS.avalanche.reader).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});

describe('GMX Error Messages', () => {
  test('should have insufficient collateral mapping', () => {
    expect(GMX_ERROR_MESSAGES['insufficient collateral']).toBe('INSUFFICIENT_MARGIN');
  });

  test('should have insufficient balance mapping', () => {
    expect(GMX_ERROR_MESSAGES['insufficient balance']).toBe('INSUFFICIENT_BALANCE');
  });

  test('should have position not found mapping', () => {
    expect(GMX_ERROR_MESSAGES['position not found']).toBe('POSITION_NOT_FOUND');
  });

  test('should have liquidation mapping', () => {
    expect(GMX_ERROR_MESSAGES['liquidation']).toBe('LIQUIDATION');
  });
});

describe('GMX Funding', () => {
  test('should have continuous calculation type', () => {
    expect(GMX_FUNDING.calculationType).toBe('continuous');
  });

  test('should have base rate factor', () => {
    expect(GMX_FUNDING.baseRateFactor).toBeDefined();
    expect(typeof GMX_FUNDING.baseRateFactor).toBe('number');
  });
});

describe('Symbol Conversion', () => {
  describe('unifiedToGmx', () => {
    test('should convert ETH/USD:ETH to GMX format', () => {
      expect(unifiedToGmx('ETH/USD:ETH')).toBe('ETH/USD:ETH');
    });

    test('should convert BTC/USD:BTC to GMX format', () => {
      expect(unifiedToGmx('BTC/USD:BTC')).toBe('BTC/USD:BTC');
    });

    test('should find market by base asset', () => {
      expect(unifiedToGmx('ETH/USD')).toBe('ETH/USD:ETH');
    });

    test('should return undefined for invalid symbol', () => {
      expect(unifiedToGmx('INVALID/USD')).toBeUndefined();
    });
  });

  describe('gmxToUnified', () => {
    test('should convert GMX format to unified', () => {
      expect(gmxToUnified('ETH/USD:ETH')).toBe('ETH/USD:ETH');
    });

    test('should convert BTC market', () => {
      expect(gmxToUnified('BTC/USD:BTC')).toBe('BTC/USD:BTC');
    });
  });
});

describe('getMarketByAddress', () => {
  test('should find ETH market by address', () => {
    const ethMarket = GMX_MARKETS['ETH/USD:ETH'];
    const found = getMarketByAddress(ethMarket.marketAddress);
    expect(found).toBeDefined();
    expect(found?.symbol).toBe('ETH/USD:ETH');
  });

  test('should handle lowercase address', () => {
    const ethMarket = GMX_MARKETS['ETH/USD:ETH'];
    const found = getMarketByAddress(ethMarket.marketAddress.toLowerCase());
    expect(found).toBeDefined();
  });

  test('should return undefined for unknown address', () => {
    expect(getMarketByAddress('0x0000000000000000000000000000000000000000')).toBeUndefined();
  });
});

describe('getBaseToken', () => {
  test('should extract base token from symbol', () => {
    expect(getBaseToken('ETH/USD:ETH')).toBe('ETH');
    expect(getBaseToken('BTC/USD:BTC')).toBe('BTC');
    expect(getBaseToken('SOL/USD:ETH')).toBe('SOL');
  });

  test('should handle symbols without colon', () => {
    expect(getBaseToken('ETH/USD')).toBe('ETH');
  });

  test('should return empty string for invalid symbol', () => {
    expect(getBaseToken('')).toBe('');
  });
});

describe('getMarketsForChain', () => {
  test('should get Arbitrum markets', () => {
    const markets = getMarketsForChain('arbitrum');
    expect(markets.length).toBeGreaterThan(0);
    expect(markets.every(m => m.chain === 'arbitrum')).toBe(true);
  });

  test('should get Avalanche markets', () => {
    const markets = getMarketsForChain('avalanche');
    expect(markets.length).toBeGreaterThan(0);
    expect(markets.every(m => m.chain === 'avalanche')).toBe(true);
  });

  test('should have ETH market on both chains', () => {
    const arbitrumMarkets = getMarketsForChain('arbitrum');
    const avalancheMarkets = getMarketsForChain('avalanche');

    expect(arbitrumMarkets.some(m => m.baseAsset === 'ETH')).toBe(true);
    expect(avalancheMarkets.some(m => m.baseAsset === 'ETH')).toBe(true);
  });
});

describe('getTokenDecimals', () => {
  test('should return 18 for ETH', () => {
    expect(getTokenDecimals('ETH')).toBe(18);
  });

  test('should return 8 for BTC', () => {
    expect(getTokenDecimals('BTC')).toBe(8);
  });

  test('should return 6 for USDC', () => {
    expect(getTokenDecimals('USDC')).toBe(6);
  });

  test('should return 18 for AVAX', () => {
    expect(getTokenDecimals('AVAX')).toBe(18);
  });

  test('should return 9 for SOL', () => {
    expect(getTokenDecimals('SOL')).toBe(9);
  });

  test('should return 18 (default) for unknown token', () => {
    expect(getTokenDecimals('UNKNOWN')).toBe(18);
  });

  test('should return 18 (default) for empty string', () => {
    expect(getTokenDecimals('')).toBe(18);
  });
});

describe('getOraclePriceDivisor', () => {
  test('should return 10^12 for ETH (18 decimals)', () => {
    expect(getOraclePriceDivisor('ETH')).toBe(1e12);
  });

  test('should return 10^22 for BTC (8 decimals)', () => {
    expect(getOraclePriceDivisor('BTC')).toBe(1e22);
  });

  test('should return 10^24 for USDC (6 decimals)', () => {
    expect(getOraclePriceDivisor('USDC')).toBe(1e24);
  });

  test('should return 10^21 for SOL (9 decimals)', () => {
    expect(getOraclePriceDivisor('SOL')).toBe(1e21);
  });

  test('should return 10^12 for unknown token (defaults to 18 decimals)', () => {
    expect(getOraclePriceDivisor('UNKNOWN')).toBe(1e12);
  });

  test('should be consistent with getTokenDecimals', () => {
    const assets = ['ETH', 'BTC', 'USDC', 'AVAX', 'SOL', 'LINK'];
    for (const asset of assets) {
      const decimals = getTokenDecimals(asset);
      const divisor = getOraclePriceDivisor(asset);
      expect(divisor).toBe(Math.pow(10, 30 - decimals));
    }
  });
});

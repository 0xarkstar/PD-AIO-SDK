/**
 * GMX v2 Adapter Unit Tests
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { GmxAdapter, type GmxConfig, type GmxChain } from '../../src/adapters/gmx/GmxAdapter.js';
import { GMX_API_URLS, GMX_MARKETS, GMX_PRECISION } from '../../src/adapters/gmx/constants.js';
import { GmxNormalizer } from '../../src/adapters/gmx/GmxNormalizer.js';

describe('GmxAdapter', () => {
  describe('Constructor', () => {
    test('should create adapter with default config', () => {
      const adapter = new GmxAdapter();
      expect(adapter.id).toBe('gmx');
      expect(adapter.name).toBe('GMX v2');
      expect(adapter.getChain()).toBe('arbitrum');
    });

    test('should create adapter with arbitrum chain', () => {
      const adapter = new GmxAdapter({ chain: 'arbitrum' });
      expect(adapter.getChain()).toBe('arbitrum');
      expect(adapter.getApiBaseUrl()).toBe(GMX_API_URLS.arbitrum.api);
    });

    test('should create adapter with avalanche chain', () => {
      const adapter = new GmxAdapter({ chain: 'avalanche' });
      expect(adapter.getChain()).toBe('avalanche');
      expect(adapter.getApiBaseUrl()).toBe(GMX_API_URLS.avalanche.api);
    });

    test('should store wallet address if provided', () => {
      const adapter = new GmxAdapter({
        chain: 'arbitrum',
        walletAddress: '0x1234567890123456789012345678901234567890',
      });
      expect(adapter.id).toBe('gmx');
    });
  });

  describe('Feature Map', () => {
    let adapter: GmxAdapter;

    beforeEach(() => {
      adapter = new GmxAdapter();
    });

    test('should support fetchMarkets', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
    });

    test('should support fetchTicker', () => {
      expect(adapter.has.fetchTicker).toBe(true);
    });

    test('should support fetchFundingRate', () => {
      expect(adapter.has.fetchFundingRate).toBe(true);
    });

    test('should support fetchOHLCV', () => {
      expect(adapter.has.fetchOHLCV).toBe(true);
    });

    test('should NOT support fetchOrderBook (AMM-based)', () => {
      expect(adapter.has.fetchOrderBook).toBe(false);
    });

    test('should NOT support fetchTrades (requires subgraph)', () => {
      expect(adapter.has.fetchTrades).toBe(false);
    });

    test('should support createOrder (on-chain via contracts)', () => {
      expect(adapter.has.createOrder).toBe(true);
    });

    test('should support cancelOrder (on-chain via contracts)', () => {
      expect(adapter.has.cancelOrder).toBe(true);
    });

    test('should support fetchPositions (via Reader contract)', () => {
      expect(adapter.has.fetchPositions).toBe(true);
    });

    test('should support fetchBalance (via RPC)', () => {
      expect(adapter.has.fetchBalance).toBe(true);
    });

    test('should NOT support WebSocket', () => {
      expect(adapter.has.watchOrderBook).toBe(false);
      expect(adapter.has.watchTrades).toBe(false);
      expect(adapter.has.watchTicker).toBe(false);
    });

    test('should NOT support setLeverage (per-position)', () => {
      expect(adapter.has.setLeverage).toBe(false);
    });

    test('should NOT support setMarginMode (always cross)', () => {
      expect(adapter.has.setMarginMode).toBe(false);
    });
  });

  describe('Uninitialized State', () => {
    let adapter: GmxAdapter;

    beforeEach(() => {
      adapter = new GmxAdapter();
    });

    test('fetchMarkets should throw when not initialized', async () => {
      await expect(adapter.fetchMarkets()).rejects.toThrow(/not initialized|initialize/i);
    });

    test('fetchTicker should throw when not initialized', async () => {
      await expect(adapter.fetchTicker('ETH/USD:ETH')).rejects.toThrow(/not initialized|initialize/i);
    });

    test('fetchFundingRate should throw when not initialized', async () => {
      await expect(adapter.fetchFundingRate('ETH/USD:ETH')).rejects.toThrow(/not initialized|initialize/i);
    });

    test('fetchOHLCV should throw when not initialized', async () => {
      await expect(adapter.fetchOHLCV('ETH/USD:ETH', '1h')).rejects.toThrow(/not initialized|initialize/i);
    });
  });

  describe('Unsupported Operations', () => {
    let adapter: GmxAdapter;

    beforeEach(() => {
      adapter = new GmxAdapter();
    });

    test('fetchOrderBook should throw not supported error', async () => {
      await expect(adapter.fetchOrderBook('ETH/USD:ETH')).rejects.toThrow(/orderbook/i);
    });

    test('fetchTrades should throw not supported error', async () => {
      await expect(adapter.fetchTrades('ETH/USD:ETH')).rejects.toThrow(/subgraph/i);
    });

    test('fetchPositions should throw not initialized error', async () => {
      await expect(adapter.fetchPositions()).rejects.toThrow(/not initialized/i);
    });

    test('fetchBalance should throw not initialized error', async () => {
      await expect(adapter.fetchBalance()).rejects.toThrow(/not initialized/i);
    });

    test('fetchOpenOrders should throw not initialized error', async () => {
      await expect(adapter.fetchOpenOrders()).rejects.toThrow(/not initialized/i);
    });

    test('fetchOrderHistory should throw not initialized error', async () => {
      await expect(adapter.fetchOrderHistory()).rejects.toThrow(/not initialized/i);
    });

    test('fetchMyTrades should throw subgraph required error', async () => {
      await expect(adapter.fetchMyTrades()).rejects.toThrow(/subgraph/i);
    });

    test('fetchFundingRateHistory should throw subgraph required error', async () => {
      await expect(adapter.fetchFundingRateHistory('ETH/USD:ETH')).rejects.toThrow(/subgraph/i);
    });

    test('createOrder should throw not initialized error', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'ETH/USD:ETH',
          type: 'market',
          side: 'buy',
          amount: 1,
        })
      ).rejects.toThrow(/not initialized/i);
    });

    test('cancelOrder should throw not initialized error', async () => {
      await expect(adapter.cancelOrder('order123', 'ETH/USD:ETH')).rejects.toThrow(/not initialized/i);
    });

    test('cancelAllOrders should throw not initialized error', async () => {
      await expect(adapter.cancelAllOrders()).rejects.toThrow(/not initialized/i);
    });

    test('setLeverage should throw not applicable error', async () => {
      await expect(adapter.setLeverage('ETH/USD:ETH', 10)).rejects.toThrow(/per-position/i);
    });
  });

  describe('Disconnect', () => {
    test('should disconnect cleanly', async () => {
      const adapter = new GmxAdapter();
      await adapter.disconnect();
      // Should not throw
    });
  });

  describe('Configuration', () => {
    test('should accept custom timeout', () => {
      const adapter = new GmxAdapter({ timeout: 60000 });
      expect(adapter.id).toBe('gmx');
    });

    test('should accept custom RPC endpoint', () => {
      const adapter = new GmxAdapter({
        chain: 'arbitrum',
        rpcEndpoint: 'https://custom-rpc.example.com',
      });
      expect(adapter.getChain()).toBe('arbitrum');
    });
  });

  describe('Chain Selection', () => {
    test('getChain should return configured chain', () => {
      const arbitrumAdapter = new GmxAdapter({ chain: 'arbitrum' });
      const avalancheAdapter = new GmxAdapter({ chain: 'avalanche' });

      expect(arbitrumAdapter.getChain()).toBe('arbitrum');
      expect(avalancheAdapter.getChain()).toBe('avalanche');
    });

    test('getApiBaseUrl should return correct URL for chain', () => {
      const arbitrumAdapter = new GmxAdapter({ chain: 'arbitrum' });
      const avalancheAdapter = new GmxAdapter({ chain: 'avalanche' });

      expect(arbitrumAdapter.getApiBaseUrl()).toContain('arbitrum');
      expect(avalancheAdapter.getApiBaseUrl()).toContain('avalanche');
    });
  });
});

describe('GmxAdapter Integration-ready', () => {
  test('should be importable from index', async () => {
    const { GmxAdapter, GmxNormalizer } = await import('../../src/adapters/gmx/index.js');
    expect(GmxAdapter).toBeDefined();
    expect(GmxNormalizer).toBeDefined();
  });

  test('should export all necessary types', async () => {
    const gmxModule = await import('../../src/adapters/gmx/index.js');

    // Adapter and config
    expect(gmxModule.GmxAdapter).toBeDefined();

    // Normalizer
    expect(gmxModule.GmxNormalizer).toBeDefined();

    // Constants
    expect(gmxModule.GMX_API_URLS).toBeDefined();
    expect(gmxModule.GMX_MARKETS).toBeDefined();
    expect(gmxModule.GMX_PRECISION).toBeDefined();

    // Error mapping
    expect(gmxModule.mapGmxError).toBeDefined();
    expect(gmxModule.GmxErrorCodes).toBeDefined();

    // Symbol conversion
    expect(gmxModule.unifiedToGmx).toBeDefined();
    expect(gmxModule.gmxToUnified).toBeDefined();
  });

  test('should be available from factory', async () => {
    const { createExchange, getSupportedExchanges, isExchangeSupported } = await import('../../src/factory.js');

    expect(getSupportedExchanges()).toContain('gmx');
    expect(isExchangeSupported('gmx')).toBe(true);

    const adapter = createExchange('gmx', { chain: 'arbitrum' });
    expect(adapter.id).toBe('gmx');
  });
});

describe('GmxNormalizer Unit Tests', () => {
  let normalizer: GmxNormalizer;

  beforeEach(() => {
    normalizer = new GmxNormalizer();
  });

  describe('normalizeMarket', () => {
    test('should normalize market info', () => {
      const mockMarketInfo = {
        marketToken: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        indexToken: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        longToken: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        shortToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        name: 'ETH/USD',
        isDisabled: false,
        maxOpenInterestLong: '100000000000000000000000000000000', // $100M
        maxOpenInterestShort: '100000000000000000000000000000000',
        longPoolAmount: '50000000000000000000000', // 50k ETH
        shortPoolAmount: '50000000000000000000000000', // $50M USDC
        longInterestUsd: '25000000000000000000000000000000', // $25M
        shortInterestUsd: '20000000000000000000000000000000', // $20M
        fundingFactor: '100000000000000', // 0.0001
        borrowingFactorLong: '50000000000000',
        borrowingFactorShort: '50000000000000',
      };

      const market = normalizer.normalizeMarket(mockMarketInfo, 'arbitrum');

      expect(market).toBeDefined();
      expect(market.id).toBe(mockMarketInfo.marketToken);
      expect(market.active).toBe(true);
      expect(market.base).toBeDefined();
      expect(market.quote).toBe('USD');
    });

    test('should handle disabled market', () => {
      const mockMarketInfo = {
        marketToken: '0xtest',
        indexToken: '0xtest',
        longToken: '0xtest',
        shortToken: '0xtest',
        name: 'TEST/USD',
        isDisabled: true,
        maxOpenInterestLong: '0',
        maxOpenInterestShort: '0',
        longPoolAmount: '0',
        shortPoolAmount: '0',
        longInterestUsd: '0',
        shortInterestUsd: '0',
        fundingFactor: '0',
        borrowingFactorLong: '0',
        borrowingFactorShort: '0',
      };

      const market = normalizer.normalizeMarket(mockMarketInfo, 'arbitrum');

      expect(market.active).toBe(false);
    });
  });

  describe('normalizeMarkets', () => {
    test('should normalize multiple markets', () => {
      const mockMarkets = [
        {
          marketToken: '0xmarket1',
          indexToken: '0xindex1',
          longToken: '0xlong1',
          shortToken: '0xshort1',
          name: 'ETH/USD',
          isDisabled: false,
          maxOpenInterestLong: '100000000000000000000000000000000',
          maxOpenInterestShort: '100000000000000000000000000000000',
          longPoolAmount: '0',
          shortPoolAmount: '0',
          longInterestUsd: '0',
          shortInterestUsd: '0',
          fundingFactor: '0',
          borrowingFactorLong: '0',
          borrowingFactorShort: '0',
        },
        {
          marketToken: '0xmarket2',
          indexToken: '0xindex2',
          longToken: '0xlong2',
          shortToken: '0xshort2',
          name: 'BTC/USD',
          isDisabled: false,
          maxOpenInterestLong: '100000000000000000000000000000000',
          maxOpenInterestShort: '100000000000000000000000000000000',
          longPoolAmount: '0',
          shortPoolAmount: '0',
          longInterestUsd: '0',
          shortInterestUsd: '0',
          fundingFactor: '0',
          borrowingFactorLong: '0',
          borrowingFactorShort: '0',
        },
      ];

      const markets = normalizer.normalizeMarkets(mockMarkets, 'arbitrum');

      expect(markets).toHaveLength(2);
    });
  });

  describe('normalizeTicker', () => {
    test('should normalize ticker with price data', () => {
      const mockMarketInfo = {
        marketToken: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        indexToken: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        longToken: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        shortToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        name: 'ETH/USD',
        isDisabled: false,
        maxOpenInterestLong: '100000000000000000000000000000000',
        maxOpenInterestShort: '100000000000000000000000000000000',
        longPoolAmount: '50000000000000000000000',
        shortPoolAmount: '50000000000000000000000000',
        longInterestUsd: '25000000000000000000000000000000',
        shortInterestUsd: '20000000000000000000000000000000',
        fundingFactor: '100000000000000',
        borrowingFactorLong: '50000000000000',
        borrowingFactorShort: '50000000000000',
      };

      const priceData = {
        minPrice: 2000,
        maxPrice: 2001,
      };

      const ticker = normalizer.normalizeTicker(mockMarketInfo, priceData);

      expect(ticker).toBeDefined();
      expect(ticker.last).toBeGreaterThan(0);
      expect(ticker.bid).toBeDefined();
      expect(ticker.ask).toBeDefined();
    });

    test('should normalize ticker without price data', () => {
      const mockMarketInfo = {
        marketToken: '0xtest',
        indexToken: '0xtest',
        longToken: '0xtest',
        shortToken: '0xtest',
        name: 'TEST/USD',
        isDisabled: false,
        maxOpenInterestLong: '0',
        maxOpenInterestShort: '0',
        longPoolAmount: '0',
        shortPoolAmount: '0',
        longInterestUsd: '0',
        shortInterestUsd: '0',
        fundingFactor: '0',
        borrowingFactorLong: '0',
        borrowingFactorShort: '0',
      };

      const ticker = normalizer.normalizeTicker(mockMarketInfo, undefined);

      expect(ticker).toBeDefined();
    });
  });

  describe('normalizeCandles', () => {
    test('should normalize OHLCV data', () => {
      const mockCandles = [
        {
          timestamp: 1700000000,
          open: '2000.5',
          high: '2050.0',
          low: '1980.0',
          close: '2020.0',
          volume: '1000000',
        },
        {
          timestamp: 1700003600,
          open: '2020.0',
          high: '2100.0',
          low: '2010.0',
          close: '2080.0',
          volume: '1200000',
        },
      ];

      const candles = normalizer.normalizeCandles(mockCandles);

      expect(candles).toHaveLength(2);
      expect(candles[0]).toHaveLength(6); // [timestamp, open, high, low, close, volume]
    });

    test('should handle empty candles array', () => {
      const candles = normalizer.normalizeCandles([]);
      expect(candles).toHaveLength(0);
    });
  });

  describe('normalizePosition', () => {
    test('should normalize long position', () => {
      const mockPosition = {
        market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        isLong: true,
        sizeInUsd: '100000000000000000000000000000000', // $100k
        sizeInTokens: '50000000000000000000', // 50 tokens
        collateralAmount: '10000000000000000000', // 10 tokens collateral
        collateralToken: '0xtoken',
        entryPrice: '0',
        borrowingFactor: '0',
        lastIncreasedTime: Date.now(),
      };

      const position = normalizer.normalizePosition(mockPosition, 2000, 'arbitrum');

      expect(position).toBeDefined();
      expect(position.side).toBe('long');
      expect(position.marginMode).toBe('cross');
    });

    test('should normalize short position', () => {
      const mockPosition = {
        market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        isLong: false,
        sizeInUsd: '50000000000000000000000000000000', // $50k
        sizeInTokens: '25000000000000000000', // 25 tokens
        collateralAmount: '5000000000000000000', // 5 tokens collateral
        collateralToken: '0xtoken',
        entryPrice: '0',
        borrowingFactor: '0',
        lastIncreasedTime: Date.now(),
      };

      const position = normalizer.normalizePosition(mockPosition, 2000, 'arbitrum');

      expect(position).toBeDefined();
      expect(position.side).toBe('short');
    });
  });

  describe('normalizeOrder', () => {
    test('should normalize market order', () => {
      const mockOrder = {
        key: '0xorderkey',
        market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        account: '0xaccount',
        receiver: '0xreceiver',
        callbackContract: '0xcallback',
        uiFeeReceiver: '0xuifee',
        orderType: 0, // MarketIncrease
        isLong: true,
        shouldUnwrapNativeToken: false,
        initialCollateralToken: '0xcollateral',
        sizeDeltaUsd: '100000000000000000000000000000000', // $100k
        initialCollateralDeltaAmount: '10000000000000000000',
        triggerPrice: '0',
        acceptablePrice: '0',
        executionFee: '100000000000000',
        callbackGasLimit: '0',
        minOutputAmount: '0',
        validFromTime: 0,
        updatedAtTime: Date.now(),
        isFrozen: false,
        autoCancel: false,
      };

      const order = normalizer.normalizeOrder(mockOrder, 2000);

      expect(order).toBeDefined();
      expect(order.id).toBe(mockOrder.key);
    });
  });

  describe('normalizeTrade', () => {
    test('should normalize trade', () => {
      const mockTrade = {
        id: '0xtradekey',
        timestamp: Math.floor(Date.now() / 1000),
        account: '0xaccount',
        market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        collateralToken: '0xcollateral',
        sizeDeltaUsd: '50000000000000000000000000000000', // $50k
        sizeDeltaInTokens: '25000000000000000000', // 25 tokens
        collateralDeltaAmount: '5000000000000000000',
        isLong: true,
        executionPrice: '2000000000000000000000000000000', // $2000
        pnlUsd: '1000000000000000000000000000000', // $1000 profit
        priceImpactUsd: '0',
        transactionHash: '0xtx',
        orderType: 0,
      };

      const trade = normalizer.normalizeTrade(mockTrade);

      expect(trade).toBeDefined();
      expect(trade.id).toBe(mockTrade.id);
      expect(trade.side).toBe('buy');
    });
  });

  describe('normalizeFundingRate', () => {
    test('should normalize funding rate', () => {
      const mockFunding = {
        market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        fundingFactorPerSecond: '1000000000000', // Per second funding factor
        timestamp: Date.now(),
      };

      const fundingRate = normalizer.normalizeFundingRate(mockFunding, 2000);

      expect(fundingRate).toBeDefined();
      expect(fundingRate.fundingRate).toBeDefined();
    });
  });
});

describe('GMX Constants', () => {
  test('GMX_MARKETS should contain expected markets', () => {
    expect(GMX_MARKETS).toBeDefined();
    expect(Object.keys(GMX_MARKETS).length).toBeGreaterThan(0);
  });

  test('GMX_PRECISION should have expected values', () => {
    expect(GMX_PRECISION).toBeDefined();
    expect(GMX_PRECISION.USD).toBeGreaterThan(0);
    expect(GMX_PRECISION.PRICE).toBeGreaterThan(0);
  });

  test('GMX_API_URLS should have arbitrum and avalanche', () => {
    expect(GMX_API_URLS.arbitrum).toBeDefined();
    expect(GMX_API_URLS.avalanche).toBeDefined();
    expect(GMX_API_URLS.arbitrum.api).toContain('arbitrum');
    expect(GMX_API_URLS.avalanche.api).toContain('avalanche');
  });

  test('GMX_API_URLS should have testnet config', () => {
    expect(GMX_API_URLS.arbitrumSepolia).toBeDefined();
    expect(GMX_API_URLS.arbitrumSepolia.chainId).toBe(421614);
  });
});

describe('GMX Symbol Conversion', () => {
  let unifiedToGmx: typeof import('../../src/adapters/gmx/constants.js').unifiedToGmx;
  let gmxToUnified: typeof import('../../src/adapters/gmx/constants.js').gmxToUnified;
  let getMarketByAddress: typeof import('../../src/adapters/gmx/constants.js').getMarketByAddress;
  let getBaseToken: typeof import('../../src/adapters/gmx/constants.js').getBaseToken;
  let getMarketsForChain: typeof import('../../src/adapters/gmx/constants.js').getMarketsForChain;
  let GMX_MARKET_ADDRESS_MAP: typeof import('../../src/adapters/gmx/constants.js').GMX_MARKET_ADDRESS_MAP;
  let GMX_ORDER_TYPES: typeof import('../../src/adapters/gmx/constants.js').GMX_ORDER_TYPES;
  let GMX_CONTRACTS: typeof import('../../src/adapters/gmx/constants.js').GMX_CONTRACTS;

  beforeAll(async () => {
    const gmxModule = await import('../../src/adapters/gmx/constants.js');
    unifiedToGmx = gmxModule.unifiedToGmx;
    gmxToUnified = gmxModule.gmxToUnified;
    getMarketByAddress = gmxModule.getMarketByAddress;
    getBaseToken = gmxModule.getBaseToken;
    getMarketsForChain = gmxModule.getMarketsForChain;
    GMX_MARKET_ADDRESS_MAP = gmxModule.GMX_MARKET_ADDRESS_MAP;
    GMX_ORDER_TYPES = gmxModule.GMX_ORDER_TYPES;
    GMX_CONTRACTS = gmxModule.GMX_CONTRACTS;
  });

  describe('unifiedToGmx', () => {
    test('should return existing market key unchanged', () => {
      expect(unifiedToGmx('ETH/USD:ETH')).toBe('ETH/USD:ETH');
      expect(unifiedToGmx('BTC/USD:BTC')).toBe('BTC/USD:BTC');
    });

    test('should find market by base asset', () => {
      const result = unifiedToGmx('ETH/USD');
      expect(result).toBeDefined();
      expect(result).toContain('ETH');
    });

    test('should return undefined for unknown market', () => {
      expect(unifiedToGmx('UNKNOWN/USD')).toBeUndefined();
      expect(unifiedToGmx('XYZ/ABC')).toBeUndefined();
    });

    test('should return undefined for empty string', () => {
      expect(unifiedToGmx('')).toBeUndefined();
    });

    test('should handle case-insensitive base asset', () => {
      const result = unifiedToGmx('eth/usd');
      expect(result).toBeDefined();
    });
  });

  describe('gmxToUnified', () => {
    test('should convert GMX market key to unified symbol', () => {
      expect(gmxToUnified('ETH/USD:ETH')).toBe('ETH/USD:ETH');
      expect(gmxToUnified('BTC/USD:BTC')).toBe('BTC/USD:BTC');
      expect(gmxToUnified('AVAX/USD:AVAX')).toBe('AVAX/USD:AVAX');
    });
  });

  describe('getMarketByAddress', () => {
    test('should find market by address', () => {
      const market = getMarketByAddress('0x70d95587d40A2caf56bd97485aB3Eec10Bee6336');
      expect(market).toBeDefined();
      expect(market?.baseAsset).toBe('ETH');
    });

    test('should find market with lowercase address', () => {
      const market = getMarketByAddress('0x70d95587d40a2caf56bd97485ab3eec10bee6336');
      expect(market).toBeDefined();
      expect(market?.baseAsset).toBe('ETH');
    });

    test('should return undefined for unknown address', () => {
      expect(getMarketByAddress('0x0000000000000000000000000000000000000000')).toBeUndefined();
    });
  });

  describe('getBaseToken', () => {
    test('should extract base token from symbol', () => {
      expect(getBaseToken('ETH/USD:ETH')).toBe('ETH');
      expect(getBaseToken('BTC/USD:BTC')).toBe('BTC');
      expect(getBaseToken('SOL/USD')).toBe('SOL');
    });

    test('should handle lowercase input', () => {
      expect(getBaseToken('eth/usd')).toBe('ETH');
    });

    test('should return empty string for invalid input', () => {
      expect(getBaseToken('')).toBe('');
    });
  });

  describe('getMarketsForChain', () => {
    test('should return arbitrum markets', () => {
      const markets = getMarketsForChain('arbitrum');
      expect(markets.length).toBeGreaterThan(0);
      expect(markets.every(m => m.chain === 'arbitrum')).toBe(true);
    });

    test('should return avalanche markets', () => {
      const markets = getMarketsForChain('avalanche');
      expect(markets.length).toBeGreaterThan(0);
      expect(markets.every(m => m.chain === 'avalanche')).toBe(true);
    });

    test('arbitrum should have more markets than avalanche', () => {
      const arbitrumMarkets = getMarketsForChain('arbitrum');
      const avalancheMarkets = getMarketsForChain('avalanche');
      expect(arbitrumMarkets.length).toBeGreaterThan(avalancheMarkets.length);
    });
  });

  describe('GMX_MARKET_ADDRESS_MAP', () => {
    test('should map addresses to market keys', () => {
      const ethAddress = '0x70d95587d40a2caf56bd97485ab3eec10bee6336';
      expect(GMX_MARKET_ADDRESS_MAP[ethAddress]).toBe('ETH/USD:ETH');
    });

    test('should have lowercase addresses as keys', () => {
      const keys = Object.keys(GMX_MARKET_ADDRESS_MAP);
      expect(keys.every(k => k === k.toLowerCase())).toBe(true);
    });
  });

  describe('GMX_ORDER_TYPES', () => {
    test('should have expected order types', () => {
      expect(GMX_ORDER_TYPES.MARKET_INCREASE).toBe(0);
      expect(GMX_ORDER_TYPES.MARKET_DECREASE).toBe(1);
      expect(GMX_ORDER_TYPES.LIMIT_INCREASE).toBe(2);
      expect(GMX_ORDER_TYPES.LIMIT_DECREASE).toBe(3);
      expect(GMX_ORDER_TYPES.STOP_LOSS).toBe(4);
      expect(GMX_ORDER_TYPES.LIQUIDATION).toBe(5);
    });
  });

  describe('GMX_CONTRACTS', () => {
    test('should have arbitrum contract addresses', () => {
      expect(GMX_CONTRACTS.arbitrum.exchangeRouter).toBeDefined();
      expect(GMX_CONTRACTS.arbitrum.router).toBeDefined();
      expect(GMX_CONTRACTS.arbitrum.dataStore).toBeDefined();
      expect(GMX_CONTRACTS.arbitrum.reader).toBeDefined();
      expect(GMX_CONTRACTS.arbitrum.orderVault).toBeDefined();
    });

    test('should have avalanche contract addresses', () => {
      expect(GMX_CONTRACTS.avalanche.exchangeRouter).toBeDefined();
      expect(GMX_CONTRACTS.avalanche.router).toBeDefined();
      expect(GMX_CONTRACTS.avalanche.dataStore).toBeDefined();
      expect(GMX_CONTRACTS.avalanche.reader).toBeDefined();
      expect(GMX_CONTRACTS.avalanche.orderVault).toBeDefined();
    });

    test('contract addresses should be valid ethereum addresses', () => {
      const arbitrumAddresses = Object.values(GMX_CONTRACTS.arbitrum);
      const avalancheAddresses = Object.values(GMX_CONTRACTS.avalanche);

      [...arbitrumAddresses, ...avalancheAddresses].forEach(address => {
        expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });
  });
});

describe('GMX Error Mapping', () => {
  let mapGmxError: typeof import('../../src/adapters/gmx/error-codes.js').mapGmxError;
  let GmxErrorCodes: typeof import('../../src/adapters/gmx/error-codes.js').GmxErrorCodes;

  beforeAll(async () => {
    const errorModule = await import('../../src/adapters/gmx/error-codes.js');
    mapGmxError = errorModule.mapGmxError;
    GmxErrorCodes = errorModule.GmxErrorCodes;
  });

  describe('mapGmxError', () => {
    test('should pass through PerpDEXError', async () => {
      const { PerpDEXError } = await import('../../src/types/errors.js');
      const perpError = new PerpDEXError('Test error', 'TEST_CODE', 'gmx');
      const result = mapGmxError(perpError);
      expect(result).toBe(perpError);
    });

    test('should map insufficient funds error', () => {
      const error = new Error('insufficient funds for transaction');
      const result = mapGmxError(error);
      expect(result.code).toBe('INSUFFICIENT_GAS');
    });

    test('should map nonce error', () => {
      const error = new Error('nonce too low');
      const result = mapGmxError(error);
      expect(result.code).toBe('NONCE_ERROR');
    });

    test('should map already known transaction error', () => {
      const error = new Error('transaction already known');
      const result = mapGmxError(error);
      expect(result.code).toBe('NONCE_ERROR');
    });

    test('should map signature error', () => {
      const error = new Error('invalid signature');
      const result = mapGmxError(error);
      expect(result.code).toBe('INVALID_SIGNATURE');
    });

    test('should map unauthorized error', () => {
      const error = new Error('unauthorized access');
      const result = mapGmxError(error);
      expect(result.code).toBe('INVALID_SIGNATURE');
    });

    test('should map rate limit error (429)', () => {
      const error = new Error('429 Too Many Requests');
      const result = mapGmxError(error);
      expect(result.code).toBe('RATE_LIMIT');
    });

    test('should map rate limit error (too many requests)', () => {
      const error = new Error('too many requests');
      const result = mapGmxError(error);
      expect(result.code).toBe('RATE_LIMIT');
    });

    test('should map 503 service unavailable', () => {
      const error = new Error('503 Service Unavailable');
      const result = mapGmxError(error);
      expect(result.code).toBe('API_UNAVAILABLE');
    });

    test('should map 502 bad gateway', () => {
      const error = new Error('502 Bad Gateway');
      const result = mapGmxError(error);
      expect(result.code).toBe('API_UNAVAILABLE');
    });

    test('should map 504 gateway timeout', () => {
      const error = new Error('504 Gateway Timeout');
      const result = mapGmxError(error);
      expect(result.code).toBe('API_UNAVAILABLE');
    });

    test('should map timeout error', () => {
      const error = new Error('request timed out');
      const result = mapGmxError(error);
      expect(result.code).toBe('TIMEOUT');
    });

    test('should map network error', () => {
      const error = new Error('network connection failed');
      const result = mapGmxError(error);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    test('should map connection error', () => {
      const error = new Error('connection refused');
      const result = mapGmxError(error);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    test('should map graphql error', () => {
      const error = new Error('graphql query failed');
      const result = mapGmxError(error);
      expect(result.code).toBe('SUBGRAPH_ERROR');
    });

    test('should map transaction reverted error', () => {
      const error = new Error('transaction reverted');
      const result = mapGmxError(error);
      expect(result.code).toBe('TX_REVERTED');
    });

    test('should map revert error', () => {
      const error = new Error('execution revert');
      const result = mapGmxError(error);
      expect(result.code).toBe('TX_REVERTED');
    });

    test('should map keeper error', () => {
      // Note: "keeper execution failed" matches "execution failed" pattern first
      // This tests the "keeper" pattern specifically
      const error = new Error('keeper unavailable');
      const result = mapGmxError(error);
      expect(result.code).toBe('KEEPER_ERROR');
    });

    test('should map invalid market error', () => {
      const error = new Error('market not found');
      const result = mapGmxError(error);
      expect(result.code).toBe('INVALID_MARKET');
    });

    test('should map disabled market error', () => {
      const error = new Error('market is disabled');
      const result = mapGmxError(error);
      expect(result.code).toBe('MARKET_DISABLED');
    });

    test('should map paused market error', () => {
      const error = new Error('market is paused');
      const result = mapGmxError(error);
      expect(result.code).toBe('MARKET_DISABLED');
    });

    test('should map position size error', () => {
      const error = new Error('position size exceeds limit');
      const result = mapGmxError(error);
      expect(result.code).toBe('MAX_POSITION_SIZE');
    });

    test('should map min collateral error', () => {
      const error = new Error('min collateral not met');
      const result = mapGmxError(error);
      expect(result.code).toBe('MIN_COLLATERAL');
    });

    test('should map unknown error to default', () => {
      const error = new Error('some random error');
      const result = mapGmxError(error);
      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    test('should handle non-Error objects', () => {
      const result = mapGmxError('string error');
      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    test('should handle null/undefined', () => {
      const result1 = mapGmxError(null);
      expect(result1.code).toBe('UNKNOWN_ERROR');

      const result2 = mapGmxError(undefined);
      expect(result2.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('GmxErrorCodes', () => {
    test('should have all expected error codes', () => {
      expect(GmxErrorCodes.INSUFFICIENT_MARGIN).toBe('INSUFFICIENT_MARGIN');
      expect(GmxErrorCodes.INSUFFICIENT_BALANCE).toBe('INSUFFICIENT_BALANCE');
      expect(GmxErrorCodes.INSUFFICIENT_GAS).toBe('INSUFFICIENT_GAS');
      expect(GmxErrorCodes.MAX_LEVERAGE_EXCEEDED).toBe('MAX_LEVERAGE_EXCEEDED');
      expect(GmxErrorCodes.MIN_ORDER_SIZE).toBe('MIN_ORDER_SIZE');
      expect(GmxErrorCodes.MAX_POSITION_SIZE).toBe('MAX_POSITION_SIZE');
      expect(GmxErrorCodes.MIN_COLLATERAL).toBe('MIN_COLLATERAL');
      expect(GmxErrorCodes.SLIPPAGE_EXCEEDED).toBe('SLIPPAGE_EXCEEDED');
      expect(GmxErrorCodes.INVALID_PRICE).toBe('INVALID_PRICE');
      expect(GmxErrorCodes.POSITION_NOT_FOUND).toBe('POSITION_NOT_FOUND');
      expect(GmxErrorCodes.POSITION_LIQUIDATED).toBe('POSITION_LIQUIDATED');
      expect(GmxErrorCodes.ORDER_NOT_FOUND).toBe('ORDER_NOT_FOUND');
      expect(GmxErrorCodes.ORDER_CANCELLED).toBe('ORDER_CANCELLED');
      expect(GmxErrorCodes.INVALID_MARKET).toBe('INVALID_MARKET');
      expect(GmxErrorCodes.ORACLE_ERROR).toBe('ORACLE_ERROR');
      expect(GmxErrorCodes.INVALID_ORACLE_PRICE).toBe('INVALID_ORACLE_PRICE');
      expect(GmxErrorCodes.MARKET_PAUSED).toBe('MARKET_PAUSED');
      expect(GmxErrorCodes.MARKET_DISABLED).toBe('MARKET_DISABLED');
      expect(GmxErrorCodes.TRANSACTION_FAILED).toBe('TRANSACTION_FAILED');
      expect(GmxErrorCodes.TX_REVERTED).toBe('TX_REVERTED');
      expect(GmxErrorCodes.NONCE_ERROR).toBe('NONCE_ERROR');
      expect(GmxErrorCodes.INVALID_SIGNATURE).toBe('INVALID_SIGNATURE');
      expect(GmxErrorCodes.KEEPER_ERROR).toBe('KEEPER_ERROR');
      expect(GmxErrorCodes.KEEPER_EXECUTION_FAILED).toBe('KEEPER_EXECUTION_FAILED');
      expect(GmxErrorCodes.RATE_LIMIT).toBe('RATE_LIMIT');
      expect(GmxErrorCodes.API_UNAVAILABLE).toBe('API_UNAVAILABLE');
      expect(GmxErrorCodes.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(GmxErrorCodes.TIMEOUT).toBe('TIMEOUT');
      expect(GmxErrorCodes.SUBGRAPH_ERROR).toBe('SUBGRAPH_ERROR');
      expect(GmxErrorCodes.LIQUIDATION).toBe('LIQUIDATION');
      expect(GmxErrorCodes.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
    });
  });
});

describe('GMX Auth Validation', () => {
  let isValidEthereumAddress: typeof import('../../src/adapters/gmx/GmxAuth.js').isValidEthereumAddress;
  let isValidEthereumPrivateKey: typeof import('../../src/adapters/gmx/GmxAuth.js').isValidEthereumPrivateKey;

  beforeAll(async () => {
    const authModule = await import('../../src/adapters/gmx/GmxAuth.js');
    isValidEthereumAddress = authModule.isValidEthereumAddress;
    isValidEthereumPrivateKey = authModule.isValidEthereumPrivateKey;
  });

  describe('isValidEthereumAddress', () => {
    test('should accept valid checksummed address', () => {
      expect(isValidEthereumAddress('0x70d95587d40A2caf56bd97485aB3Eec10Bee6336')).toBe(true);
    });

    test('should accept valid lowercase address', () => {
      expect(isValidEthereumAddress('0x70d95587d40a2caf56bd97485ab3eec10bee6336')).toBe(true);
    });

    test('should accept valid uppercase address', () => {
      expect(isValidEthereumAddress('0x70D95587D40A2CAF56BD97485AB3EEC10BEE6336')).toBe(true);
    });

    test('should accept address without 0x prefix (ethers.isAddress behavior)', () => {
      // ethers.isAddress accepts addresses without 0x prefix
      expect(isValidEthereumAddress('70d95587d40a2caf56bd97485ab3eec10bee6336')).toBe(true);
    });

    test('should reject short address', () => {
      expect(isValidEthereumAddress('0x70d95587d40a2caf56bd97485ab3eec10bee633')).toBe(false);
    });

    test('should reject long address', () => {
      expect(isValidEthereumAddress('0x70d95587d40a2caf56bd97485ab3eec10bee63360')).toBe(false);
    });

    test('should reject address with invalid characters', () => {
      expect(isValidEthereumAddress('0x70d95587d40a2caf56bd97485ab3eec10bee633g')).toBe(false);
    });

    test('should reject empty string', () => {
      expect(isValidEthereumAddress('')).toBe(false);
    });

    test('should reject non-hex string', () => {
      expect(isValidEthereumAddress('not an address')).toBe(false);
    });
  });

  describe('isValidEthereumPrivateKey', () => {
    test('should accept valid private key with 0x prefix', () => {
      const validKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(isValidEthereumPrivateKey(validKey)).toBe(true);
    });

    test('should accept valid private key without 0x prefix', () => {
      const validKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(isValidEthereumPrivateKey(validKey)).toBe(true);
    });

    test('should reject short private key', () => {
      expect(isValidEthereumPrivateKey('0x1234567890abcdef')).toBe(false);
    });

    test('should reject long private key', () => {
      const longKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef00';
      expect(isValidEthereumPrivateKey(longKey)).toBe(false);
    });

    test('should reject private key with invalid characters', () => {
      const invalidKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeg';
      expect(isValidEthereumPrivateKey(invalidKey)).toBe(false);
    });

    test('should reject empty string', () => {
      expect(isValidEthereumPrivateKey('')).toBe(false);
    });

    test('should reject non-hex string', () => {
      expect(isValidEthereumPrivateKey('not a private key')).toBe(false);
    });
  });
});

describe('GMX Subgraph Normalizers', () => {
  let GmxSubgraph: typeof import('../../src/adapters/gmx/GmxSubgraph.js').GmxSubgraph;
  let subgraph: InstanceType<typeof import('../../src/adapters/gmx/GmxSubgraph.js').GmxSubgraph>;

  beforeAll(async () => {
    const subgraphModule = await import('../../src/adapters/gmx/GmxSubgraph.js');
    GmxSubgraph = subgraphModule.GmxSubgraph;
    subgraph = new GmxSubgraph('arbitrum');
  });

  describe('normalizePosition', () => {
    test('should normalize long position correctly', () => {
      // GMX_PRECISION.USD = 1e30, so "1e32" = 100 USD
      const mockPosition = {
        id: 'pos-1',
        account: '0xaccount',
        market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        collateralToken: '0xusdc',
        sizeInUsd: '100000000000000000000000000000000', // 1e32 / 1e30 = 100 USD
        sizeInTokens: '50000000000000000000', // parseFloat = 5e19 (raw number used for entry price calc)
        collateralAmount: '10000000000000000000', // parseFloat = 1e19
        borrowingFactor: '0',
        fundingFeeAmountPerSize: '0',
        longTokenClaimableFundingAmountPerSize: '0',
        shortTokenClaimableFundingAmountPerSize: '0',
        increasedAtBlock: '1000',
        decreasedAtBlock: '0',
        isLong: true,
      };

      const result = subgraph.normalizePosition(mockPosition, 2000);

      expect(result.side).toBe('long');
      expect(result.isLong).toBe(true);
      expect(result.marketAddress).toBe(mockPosition.market);
      expect(result.sizeUsd).toBe(100); // 1e32 / 1e30 = 100 USD
      expect(result.collateral).toBe(1e19); // raw parseFloat
    });

    test('should normalize short position correctly', () => {
      const mockPosition = {
        id: 'pos-2',
        account: '0xaccount',
        market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        collateralToken: '0xusdc',
        sizeInUsd: '50000000000000000000000000000000', // 5e31 / 1e30 = 50 USD
        sizeInTokens: '25000000000000000000', // 25 tokens
        collateralAmount: '5000000000000000000', // 5 tokens
        borrowingFactor: '0',
        fundingFeeAmountPerSize: '0',
        longTokenClaimableFundingAmountPerSize: '0',
        shortTokenClaimableFundingAmountPerSize: '0',
        increasedAtBlock: '1000',
        decreasedAtBlock: '0',
        isLong: false,
      };

      const result = subgraph.normalizePosition(mockPosition, 2000);

      expect(result.side).toBe('short');
      expect(result.isLong).toBe(false);
      expect(result.sizeUsd).toBe(50); // 5e31 / 1e30 = 50 USD
    });

    test('should calculate leverage correctly', () => {
      // With sizeUsd=100 and collateral=10000, leverage = 100/10000 = 0.01
      const mockPosition = {
        id: 'pos-3',
        account: '0xaccount',
        market: '0xmarket',
        collateralToken: '0xusdc',
        sizeInUsd: '100000000000000000000000000000000', // 100 USD
        sizeInTokens: '50000000000000000000',
        collateralAmount: '10000', // 10000 collateral
        borrowingFactor: '0',
        fundingFeeAmountPerSize: '0',
        longTokenClaimableFundingAmountPerSize: '0',
        shortTokenClaimableFundingAmountPerSize: '0',
        increasedAtBlock: '1000',
        decreasedAtBlock: '0',
        isLong: true,
      };

      const result = subgraph.normalizePosition(mockPosition, 2000);

      // leverage = sizeUsd / collateral = 100 / 10000 = 0.01
      expect(result.leverage).toBe(100 / 10000);
    });
  });

  describe('normalizeOrder', () => {
    test('should normalize market increase order', () => {
      const mockOrder = {
        key: 'order-1',
        account: '0xaccount',
        receiver: '0xreceiver',
        callbackContract: '0x0',
        uiFeeReceiver: '0x0',
        market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        initialCollateralToken: '0xusdc',
        swapPath: [],
        orderType: 0, // MarketIncrease
        decreasePositionSwapType: 0,
        sizeDeltaUsd: '100000000000000000000000000000000', // $100k
        initialCollateralDeltaAmount: '10000000000000000000',
        triggerPrice: '0',
        acceptablePrice: '2000000000000000000000000000000', // $2000
        executionFee: '100000000000000',
        callbackGasLimit: '0',
        minOutputAmount: '0',
        updatedAtBlock: '1000',
        isLong: true,
        isFrozen: false,
        status: 'Created',
        createdTxn: '0xtx1',
        cancelledTxn: undefined,
        executedTxn: undefined,
      };

      const result = subgraph.normalizeOrder(mockOrder);

      expect(result.id).toBe('order-1');
      expect(result.type).toBe('market');
      expect(result.side).toBe('buy'); // Long increase = buy
      expect(result.isLong).toBe(true);
      expect(result.status).toBe('open');
    });

    test('should normalize limit decrease order', () => {
      // triggerPrice: 2.1e30 / 1e30 = 2.1
      const mockOrder = {
        key: 'order-2',
        account: '0xaccount',
        receiver: '0xreceiver',
        callbackContract: '0x0',
        uiFeeReceiver: '0x0',
        market: '0xmarket',
        initialCollateralToken: '0xusdc',
        swapPath: [],
        orderType: 3, // LimitDecrease
        decreasePositionSwapType: 0,
        sizeDeltaUsd: '50000000000000000000000000000000',
        initialCollateralDeltaAmount: '0',
        triggerPrice: '2100000000000000000000000000000', // 2.1e30 / 1e30 = 2.1
        acceptablePrice: '2095000000000000000000000000000',
        executionFee: '100000000000000',
        callbackGasLimit: '0',
        minOutputAmount: '0',
        updatedAtBlock: '1000',
        isLong: true,
        isFrozen: false,
        status: 'Executed',
        createdTxn: '0xtx1',
        cancelledTxn: undefined,
        executedTxn: '0xtx2',
      };

      const result = subgraph.normalizeOrder(mockOrder);

      expect(result.type).toBe('limit');
      expect(result.side).toBe('sell'); // Long decrease = sell
      expect(result.status).toBe('filled');
      expect(result.triggerPrice).toBe(2.1); // 2.1e30 / 1e30 = 2.1
    });

    test('should normalize stop loss order', () => {
      const mockOrder = {
        key: 'order-3',
        account: '0xaccount',
        receiver: '0xreceiver',
        callbackContract: '0x0',
        uiFeeReceiver: '0x0',
        market: '0xmarket',
        initialCollateralToken: '0xusdc',
        swapPath: [],
        orderType: 4, // StopLossDecrease
        decreasePositionSwapType: 0,
        sizeDeltaUsd: '50000000000000000000000000000000',
        initialCollateralDeltaAmount: '0',
        triggerPrice: '1900000000000000000000000000000', // $1900
        acceptablePrice: '1890000000000000000000000000000',
        executionFee: '100000000000000',
        callbackGasLimit: '0',
        minOutputAmount: '0',
        updatedAtBlock: '1000',
        isLong: true,
        isFrozen: false,
        status: 'Cancelled',
        createdTxn: '0xtx1',
        cancelledTxn: '0xtx3',
        executedTxn: undefined,
      };

      const result = subgraph.normalizeOrder(mockOrder);

      expect(result.type).toBe('stopMarket');
      expect(result.status).toBe('cancelled');
    });

    test('should normalize short order sides correctly', () => {
      const mockShortIncrease = {
        key: 'order-4',
        account: '0xaccount',
        receiver: '0xreceiver',
        callbackContract: '0x0',
        uiFeeReceiver: '0x0',
        market: '0xmarket',
        initialCollateralToken: '0xusdc',
        swapPath: [],
        orderType: 0, // MarketIncrease
        decreasePositionSwapType: 0,
        sizeDeltaUsd: '50000000000000000000000000000000',
        initialCollateralDeltaAmount: '5000000000000000000',
        triggerPrice: '0',
        acceptablePrice: '2000000000000000000000000000000',
        executionFee: '100000000000000',
        callbackGasLimit: '0',
        minOutputAmount: '0',
        updatedAtBlock: '1000',
        isLong: false, // Short
        isFrozen: false,
        status: 'Created',
        createdTxn: '0xtx1',
        cancelledTxn: undefined,
        executedTxn: undefined,
      };

      const result = subgraph.normalizeOrder(mockShortIncrease);

      expect(result.side).toBe('sell'); // Short increase = sell
      expect(result.isLong).toBe(false);
    });
  });

  describe('normalizeTrade', () => {
    test('should normalize trade correctly', () => {
      // All values are scaled by GMX_PRECISION (1e30)
      // sizeDeltaUsd: 1e32 / 1e30 = 100 USD
      // executionPrice: 2e30 / 1e30 = 2
      // pnlUsd: 5e30 / 1e30 = 5
      // priceImpactUsd: 1e27 / 1e30 = 0.001
      const mockTrade = {
        id: 'trade-1',
        account: '0xaccount',
        marketAddress: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        collateralTokenAddress: '0xusdc',
        sizeDeltaUsd: '100000000000000000000000000000000', // 1e32 / 1e30 = 100 USD
        collateralDeltaAmount: '10000000000000000000',
        orderType: 0, // MarketIncrease
        isLong: true,
        executionPrice: '2000000000000000000000000000000', // 2e30 / 1e30 = 2
        priceImpactUsd: '1000000000000000000000000000', // 1e27 / 1e30 = 0.001
        pnlUsd: '5000000000000000000000000000000', // 5e30 / 1e30 = 5
        timestamp: '1700000000',
        transactionHash: '0xtxhash',
      };

      const result = subgraph.normalizeTrade(mockTrade);

      expect(result.id).toBe('trade-1');
      expect(result.side).toBe('buy');
      expect(result.isLong).toBe(true);
      expect(result.price).toBe(2); // 2e30 / 1e30 = 2
      expect(result.cost).toBe(100); // 1e32 / 1e30 = 100 USD
      expect(result.pnl).toBe(5); // 5e30 / 1e30 = 5
      expect(result.priceImpact).toBe(0.001); // 1e27 / 1e30 = 0.001
      expect(result.timestamp).toBe(1700000000000); // milliseconds
      expect(result.transactionHash).toBe('0xtxhash');
    });

    test('should normalize short decrease trade', () => {
      const mockTrade = {
        id: 'trade-2',
        account: '0xaccount',
        marketAddress: '0xmarket',
        collateralTokenAddress: '0xusdc',
        sizeDeltaUsd: '50000000000000000000000000000000', // $50k
        collateralDeltaAmount: '5000000000000000000',
        orderType: 1, // MarketDecrease
        isLong: false, // Short
        executionPrice: '1900000000000000000000000000000', // $1900
        priceImpactUsd: '0',
        pnlUsd: '2500000000000000000000000000000', // $2500
        timestamp: '1700000100',
        transactionHash: '0xtxhash2',
      };

      const result = subgraph.normalizeTrade(mockTrade);

      expect(result.side).toBe('buy'); // Short decrease = buy (closing short)
      expect(result.isLong).toBe(false);
    });

    test('should handle trade without PnL', () => {
      const mockTrade = {
        id: 'trade-3',
        account: '0xaccount',
        marketAddress: '0xmarket',
        collateralTokenAddress: '0xusdc',
        sizeDeltaUsd: '50000000000000000000000000000000',
        collateralDeltaAmount: '5000000000000000000',
        orderType: 0,
        isLong: true,
        executionPrice: '2000000000000000000000000000000',
        priceImpactUsd: '0',
        timestamp: '1700000200',
        transactionHash: '0xtxhash3',
      };

      const result = subgraph.normalizeTrade(mockTrade);

      expect(result.pnl).toBe(0);
    });
  });
});

describe('GMX Additional Constants Tests', () => {
  let GMX_PRECISION: typeof import('../../src/adapters/gmx/constants.js').GMX_PRECISION;
  let GMX_DECREASE_POSITION_SWAP_TYPES: typeof import('../../src/adapters/gmx/constants.js').GMX_DECREASE_POSITION_SWAP_TYPES;
  let GMX_ERROR_MESSAGES: typeof import('../../src/adapters/gmx/constants.js').GMX_ERROR_MESSAGES;
  let GMX_FUNDING: typeof import('../../src/adapters/gmx/constants.js').GMX_FUNDING;
  let GMX_RATE_LIMIT: typeof import('../../src/adapters/gmx/constants.js').GMX_RATE_LIMIT;

  beforeAll(async () => {
    const constantsModule = await import('../../src/adapters/gmx/constants.js');
    GMX_PRECISION = constantsModule.GMX_PRECISION;
    GMX_DECREASE_POSITION_SWAP_TYPES = constantsModule.GMX_DECREASE_POSITION_SWAP_TYPES;
    GMX_ERROR_MESSAGES = constantsModule.GMX_ERROR_MESSAGES;
    GMX_FUNDING = constantsModule.GMX_FUNDING;
    GMX_RATE_LIMIT = constantsModule.GMX_RATE_LIMIT;
  });

  describe('GMX_PRECISION', () => {
    test('should have USD precision of 1e30', () => {
      expect(GMX_PRECISION.USD).toBe(1e30);
    });

    test('should have PRICE precision of 1e30', () => {
      expect(GMX_PRECISION.PRICE).toBe(1e30);
    });

    test('should have FACTOR precision of 1e30', () => {
      expect(GMX_PRECISION.FACTOR).toBe(1e30);
    });

    test('should have BASIS_POINTS of 1e4', () => {
      expect(GMX_PRECISION.BASIS_POINTS).toBe(1e4);
    });

    test('should have FLOAT precision of 1e8', () => {
      expect(GMX_PRECISION.FLOAT).toBe(1e8);
    });

    test('should have TOKEN_DECIMALS mapping', () => {
      expect(GMX_PRECISION.TOKEN_DECIMALS).toBeDefined();
      expect(GMX_PRECISION.TOKEN_DECIMALS.ETH).toBe(18);
      expect(GMX_PRECISION.TOKEN_DECIMALS.USDC).toBe(6);
      expect(GMX_PRECISION.TOKEN_DECIMALS.BTC).toBe(8);
    });
  });

  describe('GMX_DECREASE_POSITION_SWAP_TYPES', () => {
    test('should have expected swap types', () => {
      expect(GMX_DECREASE_POSITION_SWAP_TYPES.NO_SWAP).toBe(0);
      expect(GMX_DECREASE_POSITION_SWAP_TYPES.SWAP_PNL_TOKEN_TO_COLLATERAL).toBe(1);
      expect(GMX_DECREASE_POSITION_SWAP_TYPES.SWAP_COLLATERAL_TO_PNL_TOKEN).toBe(2);
    });
  });

  describe('GMX_ERROR_MESSAGES', () => {
    test('should have error message mappings', () => {
      expect(GMX_ERROR_MESSAGES).toBeDefined();
      expect(typeof GMX_ERROR_MESSAGES).toBe('object');
    });

    test('should map common error patterns', () => {
      const keys = Object.keys(GMX_ERROR_MESSAGES);
      expect(keys.length).toBeGreaterThan(0);
      expect(GMX_ERROR_MESSAGES['insufficient collateral']).toBe('INSUFFICIENT_MARGIN');
      expect(GMX_ERROR_MESSAGES['insufficient balance']).toBe('INSUFFICIENT_BALANCE');
      expect(GMX_ERROR_MESSAGES['oracle error']).toBe('ORACLE_ERROR');
    });
  });

  describe('GMX_FUNDING', () => {
    test('should have funding calculation type', () => {
      expect(GMX_FUNDING.calculationType).toBe('continuous');
    });

    test('should have base rate factor', () => {
      expect(GMX_FUNDING.baseRateFactor).toBeDefined();
      expect(GMX_FUNDING.baseRateFactor).toBeGreaterThan(0);
    });
  });

  describe('GMX_RATE_LIMIT', () => {
    test('should have rate limit config', () => {
      expect(GMX_RATE_LIMIT.maxRequests).toBe(60);
      expect(GMX_RATE_LIMIT.windowMs).toBe(60000);
    });

    test('should have weight config', () => {
      expect(GMX_RATE_LIMIT.weights).toBeDefined();
      expect(GMX_RATE_LIMIT.weights.fetchMarkets).toBe(1);
      expect(GMX_RATE_LIMIT.weights.fetchPositions).toBe(3);
    });
  });
});

// =============================================================================
// GmxContracts Tests (GmxContracts.ts - previously 0% coverage)
// =============================================================================

describe('GmxContracts', () => {
  let GmxContracts: typeof import('../../src/adapters/gmx/GmxContracts.js').GmxContracts;

  // Mock ethers.Contract to avoid actual blockchain calls
  const mockContractInstance = {
    createOrder: jest.fn(),
    cancelOrder: jest.fn(),
    sendWnt: jest.fn(),
    sendTokens: jest.fn(),
    getAccountPositions: jest.fn(),
    getAccountOrders: jest.fn(),
    getPosition: jest.fn(),
    getUint: jest.fn(),
    recordTransferIn: jest.fn(),
  };

  const mockProvider = {
    getFeeData: jest.fn().mockResolvedValue({ gasPrice: 100000000n }),
  };

  const mockSigner = {
    getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
  };

  beforeAll(async () => {
    const mod = await import('../../src/adapters/gmx/GmxContracts.js');
    GmxContracts = mod.GmxContracts;
  });

  describe('constructor', () => {
    test('should create with chain, provider, and signer', () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any, mockSigner as any);
      expect(contracts).toBeDefined();
    });

    test('should create without signer (read-only mode)', () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      expect(contracts).toBeDefined();
    });

    test('should accept avalanche chain', () => {
      const contracts = new GmxContracts('avalanche', mockProvider as any);
      expect(contracts).toBeDefined();
    });
  });

  describe('getAddresses', () => {
    test('should return arbitrum contract addresses', () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      const addresses = contracts.getAddresses();
      expect(addresses.exchangeRouter).toBeDefined();
      expect(addresses.reader).toBeDefined();
      expect(addresses.dataStore).toBeDefined();
      expect(addresses.orderVault).toBeDefined();
    });

    test('should return avalanche contract addresses', () => {
      const contracts = new GmxContracts('avalanche', mockProvider as any);
      const addresses = contracts.getAddresses();
      expect(addresses.exchangeRouter).toBeDefined();
      expect(addresses.reader).toBeDefined();
    });
  });

  describe('getChainId', () => {
    test('should return arbitrum chain id', () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      expect(contracts.getChainId()).toBe(GMX_API_URLS.arbitrum.chainId);
    });

    test('should return avalanche chain id', () => {
      const contracts = new GmxContracts('avalanche', mockProvider as any);
      expect(contracts.getChainId()).toBe(GMX_API_URLS.avalanche.chainId);
    });
  });

  describe('contract getters (lazy initialization)', () => {
    test('getExchangeRouter should return a contract instance', () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any, mockSigner as any);
      const router = contracts.getExchangeRouter();
      expect(router).toBeDefined();
    });

    test('getReader should return a contract instance', () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      const reader = contracts.getReader();
      expect(reader).toBeDefined();
    });

    test('getDataStore should return a contract instance', () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      const dataStore = contracts.getDataStore();
      expect(dataStore).toBeDefined();
    });

    test('getOrderVault should return a contract instance', () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any, mockSigner as any);
      const vault = contracts.getOrderVault();
      expect(vault).toBeDefined();
    });

    test('should cache contract instances (returns same object)', () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      const reader1 = contracts.getReader();
      const reader2 = contracts.getReader();
      expect(reader1).toBe(reader2);
    });

    test('should cache DataStore instances', () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      const ds1 = contracts.getDataStore();
      const ds2 = contracts.getDataStore();
      expect(ds1).toBe(ds2);
    });
  });

  describe('getPositionKey', () => {
    test('should compute a deterministic position key', () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      const key = contracts.getPositionKey(
        '0x1234567890123456789012345678901234567890',
        '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        true
      );
      expect(key).toBeDefined();
      expect(key).toMatch(/^0x[a-f0-9]{64}$/);
    });

    test('should produce different keys for long vs short', () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      const longKey = contracts.getPositionKey(
        '0x1234567890123456789012345678901234567890',
        '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        true
      );
      const shortKey = contracts.getPositionKey(
        '0x1234567890123456789012345678901234567890',
        '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        false
      );
      expect(longKey).not.toBe(shortKey);
    });
  });

  describe('trading operations require signer', () => {
    test('createOrder should throw without signer', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      await expect(
        contracts.createOrder({
          receiver: '0x1234567890123456789012345678901234567890',
          callbackContract: '0x0000000000000000000000000000000000000000',
          uiFeeReceiver: '0x0000000000000000000000000000000000000000',
          market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
          initialCollateralToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
          swapPath: [],
          orderType: 0,
          decreasePositionSwapType: 0,
          sizeDeltaUsd: 100000000000000000000000000000000n,
          initialCollateralDeltaAmount: 10000000n,
          triggerPrice: 0n,
          acceptablePrice: 2000000000000000000000000000000n,
          executionFee: 100000000000000n,
          callbackGasLimit: 0n,
          minOutputAmount: 0n,
          isLong: true,
          shouldUnwrapNativeToken: false,
        } as any, 100000000000000n)
      ).rejects.toThrow('Signer required');
    });

    test('cancelOrder should throw without signer', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      await expect(contracts.cancelOrder('0xorderkey')).rejects.toThrow('Signer required');
    });

    test('sendWnt should throw without signer', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      await expect(
        contracts.sendWnt('0x1234567890123456789012345678901234567890', 1000000000000000n)
      ).rejects.toThrow('Signer required');
    });

    test('sendTokens should throw without signer', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      await expect(
        contracts.sendTokens(
          '0xtoken',
          '0x1234567890123456789012345678901234567890',
          1000000n
        )
      ).rejects.toThrow('Signer required');
    });
  });

  describe('getExecutionFee', () => {
    test('should calculate execution fee with gas price buffer', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      const fee = await contracts.getExecutionFee(200000n);

      // baseGasLimit(500000) + gasLimit(200000) = 700000
      // 700000 * 100000000 = 70000000000000
      // with 20% buffer: 70000000000000 * 120 / 100 = 84000000000000
      expect(fee).toBe(84000000000000n);
    });
  });
});

// =============================================================================
// GmxAdapter HTTP methods (previously untested)
// =============================================================================

describe('GmxAdapter HTTP Methods', () => {
  let adapter: GmxAdapter;

  beforeEach(() => {
    adapter = new GmxAdapter({ chain: 'arbitrum' });
    (adapter as any)._isReady = true;
  });

  describe('symbolToExchange', () => {
    test('should convert valid unified symbol', () => {
      const result = (adapter as any).symbolToExchange('ETH/USD:ETH');
      expect(result).toBe('ETH/USD:ETH');
    });

    test('should throw for invalid symbol', () => {
      expect(() => (adapter as any).symbolToExchange('INVALID/UNKNOWN')).toThrow('Invalid market');
    });
  });

  describe('symbolFromExchange', () => {
    test('should pass through valid GMX market key', () => {
      const result = (adapter as any).symbolFromExchange('ETH/USD:ETH');
      expect(result).toBeDefined();
    });

    test('should return exchange symbol unchanged for unknown keys', () => {
      const result = (adapter as any).symbolFromExchange('UNKNOWN-SYMBOL');
      expect(result).toBe('UNKNOWN-SYMBOL');
    });
  });

  describe('timeframeToInterval', () => {
    test('should map 1m correctly', () => {
      expect((adapter as any).timeframeToInterval('1m')).toBe('1m');
    });

    test('should map 1h correctly', () => {
      expect((adapter as any).timeframeToInterval('1h')).toBe('1h');
    });

    test('should map 4h correctly', () => {
      expect((adapter as any).timeframeToInterval('4h')).toBe('4h');
    });

    test('should map 1d correctly', () => {
      expect((adapter as any).timeframeToInterval('1d')).toBe('1d');
    });

    test('should map 1w correctly', () => {
      expect((adapter as any).timeframeToInterval('1w')).toBe('1w');
    });

    test('should fallback unsupported 3m to 5m', () => {
      expect((adapter as any).timeframeToInterval('3m')).toBe('5m');
    });

    test('should fallback unsupported 2h to 4h', () => {
      expect((adapter as any).timeframeToInterval('2h')).toBe('4h');
    });

    test('should fallback unsupported 12h to 1d', () => {
      expect((adapter as any).timeframeToInterval('12h')).toBe('1d');
    });

    test('should default unknown timeframe to 1h', () => {
      expect((adapter as any).timeframeToInterval('unknown')).toBe('1h');
    });
  });
});

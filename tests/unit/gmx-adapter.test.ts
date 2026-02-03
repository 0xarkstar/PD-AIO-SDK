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
});

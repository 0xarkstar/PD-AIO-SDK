/**
 * GMX v2 Adapter Unit Tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { GmxAdapter, type GmxConfig, type GmxChain } from '../../src/adapters/gmx/GmxAdapter.js';
import { GMX_API_URLS } from '../../src/adapters/gmx/constants.js';

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

    test('should NOT support createOrder (on-chain)', () => {
      expect(adapter.has.createOrder).toBe(false);
    });

    test('should NOT support cancelOrder (on-chain)', () => {
      expect(adapter.has.cancelOrder).toBe(false);
    });

    test('should NOT support fetchPositions (requires subgraph)', () => {
      expect(adapter.has.fetchPositions).toBe(false);
    });

    test('should NOT support fetchBalance (requires RPC)', () => {
      expect(adapter.has.fetchBalance).toBe(false);
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

    test('fetchPositions should throw not supported error', async () => {
      await expect(adapter.fetchPositions()).rejects.toThrow(/subgraph/i);
    });

    test('fetchBalance should throw not supported error', async () => {
      await expect(adapter.fetchBalance()).rejects.toThrow(/RPC/i);
    });

    test('fetchOpenOrders should throw not supported error', async () => {
      await expect(adapter.fetchOpenOrders()).rejects.toThrow(/subgraph/i);
    });

    test('fetchOrderHistory should throw not supported error', async () => {
      await expect(adapter.fetchOrderHistory()).rejects.toThrow(/subgraph/i);
    });

    test('fetchMyTrades should throw not supported error', async () => {
      await expect(adapter.fetchMyTrades()).rejects.toThrow(/subgraph/i);
    });

    test('fetchFundingRateHistory should throw not supported error', async () => {
      await expect(adapter.fetchFundingRateHistory('ETH/USD:ETH')).rejects.toThrow(/subgraph/i);
    });

    test('createOrder should throw on-chain required error', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'ETH/USD:ETH',
          type: 'market',
          side: 'buy',
          amount: 1,
        })
      ).rejects.toThrow(/on-chain/i);
    });

    test('cancelOrder should throw on-chain required error', async () => {
      await expect(adapter.cancelOrder('order123', 'ETH/USD:ETH')).rejects.toThrow(/on-chain/i);
    });

    test('cancelAllOrders should throw on-chain required error', async () => {
      await expect(adapter.cancelAllOrders()).rejects.toThrow(/on-chain/i);
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

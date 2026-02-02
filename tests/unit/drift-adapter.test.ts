/**
 * Drift Protocol Adapter Tests
 *
 * These are unit tests for the DriftAdapter class.
 * Tests that require network calls are in integration tests.
 */

import { describe, test, expect } from '@jest/globals';
import { DriftAdapter } from '../../src/adapters/drift/DriftAdapter.js';
import type { DriftConfig } from '../../src/adapters/drift/DriftAdapter.js';

describe('DriftAdapter', () => {
  describe('constructor', () => {
    test('should create adapter with default config', () => {
      const adapter = new DriftAdapter();
      expect(adapter).toBeInstanceOf(DriftAdapter);
      expect(adapter.id).toBe('drift');
      expect(adapter.name).toBe('Drift Protocol');
    });

    test('should create adapter with wallet address', () => {
      const adapter = new DriftAdapter({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      });
      expect(adapter).toBeInstanceOf(DriftAdapter);
      expect(adapter.id).toBe('drift');
    });

    test('should accept testnet configuration', () => {
      const adapter = new DriftAdapter({
        testnet: true,
      });
      expect(adapter).toBeInstanceOf(DriftAdapter);
    });

    test('should accept custom timeout', () => {
      const adapter = new DriftAdapter({
        timeout: 60000,
      });
      expect(adapter).toBeInstanceOf(DriftAdapter);
    });
  });

  describe('capabilities', () => {
    let adapter: DriftAdapter;

    beforeAll(() => {
      adapter = new DriftAdapter();
    });

    test('should support market data features', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
    });

    test('should support funding rate features', () => {
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.fetchFundingRateHistory).toBe(true);
    });

    test('should support account features', () => {
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.fetchOpenOrders).toBe(true);
    });

    test('should not support OHLCV (requires historical data API)', () => {
      expect(adapter.has.fetchOHLCV).toBe(false);
    });

    test('should not support trading (requires Drift SDK)', () => {
      expect(adapter.has.createOrder).toBe(false);
      expect(adapter.has.cancelOrder).toBe(false);
      expect(adapter.has.cancelAllOrders).toBe(false);
      expect(adapter.has.createBatchOrders).toBe(false);
    });

    test('should not support websocket (not implemented)', () => {
      expect(adapter.has.watchOrderBook).toBe(false);
      expect(adapter.has.watchTrades).toBe(false);
      expect(adapter.has.watchTicker).toBe(false);
      expect(adapter.has.watchPositions).toBe(false);
    });

    test('should not support leverage/margin settings (cross-margin only)', () => {
      expect(adapter.has.setLeverage).toBe(false);
      expect(adapter.has.setMarginMode).toBe(false);
    });
  });

  describe('initialization', () => {
    test('should not be ready before initialization', () => {
      const adapter = new DriftAdapter();
      expect(adapter.isReady).toBe(false);
    });

    test('should require initialization before API calls', async () => {
      const adapter = new DriftAdapter();
      await expect(adapter.fetchTicker('SOL/USD:USD')).rejects.toThrow(/not initialized/);
    });

    test('should require initialization before fetchOrderBook', async () => {
      const adapter = new DriftAdapter();
      await expect(adapter.fetchOrderBook('SOL/USD:USD')).rejects.toThrow(/not initialized/);
    });

    test('should require initialization before fetchTrades', async () => {
      const adapter = new DriftAdapter();
      await expect(adapter.fetchTrades('SOL/USD:USD')).rejects.toThrow(/not initialized/);
    });

    test('should require initialization before fetchFundingRate', async () => {
      const adapter = new DriftAdapter();
      await expect(adapter.fetchFundingRate('SOL/USD:USD')).rejects.toThrow(/not initialized/);
    });
  });

  describe('trading restrictions', () => {
    let adapter: DriftAdapter;

    beforeAll(() => {
      adapter = new DriftAdapter({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      });
    });

    test('should reject createOrder (trading not supported)', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'SOL/USD:USD',
          side: 'buy',
          type: 'limit',
          amount: 1,
          price: 100,
        })
      ).rejects.toThrow();
    });

    test('should reject cancelOrder (trading not supported)', async () => {
      await expect(
        adapter.cancelOrder('order123', 'SOL/USD:USD')
      ).rejects.toThrow();
    });
  });

  describe('market validation', () => {
    test('fetchMarkets requires initialization', async () => {
      const adapter = new DriftAdapter();
      await expect(adapter.fetchMarkets()).rejects.toThrow(/not initialized/);
    });

    // Note: Full market validation tests are in integration tests
    // since fetchMarkets requires initialization (API call)
  });

  describe('configuration', () => {
    test('should handle different environment configs', () => {
      const mainnetAdapter = new DriftAdapter({ testnet: false });
      const testnetAdapter = new DriftAdapter({ testnet: true });

      expect(mainnetAdapter.id).toBe('drift');
      expect(testnetAdapter.id).toBe('drift');
    });

    test('should accept subaccount configuration', () => {
      const adapter = new DriftAdapter({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
        subAccountId: 1,
      });

      expect(adapter).toBeInstanceOf(DriftAdapter);
    });

    test('should accept custom RPC endpoint', () => {
      const adapter = new DriftAdapter({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
        rpcEndpoint: 'https://my-custom-rpc.example.com',
      });

      expect(adapter).toBeInstanceOf(DriftAdapter);
    });
  });
});

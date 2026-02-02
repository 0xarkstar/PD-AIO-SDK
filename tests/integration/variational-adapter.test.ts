/**
 * Variational Adapter Integration Tests
 *
 * Note: Most tests are skipped because Variational's API is under development.
 * These tests verify the adapter structure and error handling.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { VariationalAdapter } from '../../src/adapters/variational/VariationalAdapter.js';
import type { VariationalConfig } from '../../src/adapters/variational/types.js';
import { PerpDEXError } from '../../src/types/errors.js';

describe('Variational Adapter Integration Tests', () => {
  let adapter: VariationalAdapter;

  const config: VariationalConfig = {
    apiKey: process.env.VARIATIONAL_API_KEY || 'test_key',
    apiSecret: process.env.VARIATIONAL_API_SECRET || 'test_secret',
    testnet: true,
    rateLimitTier: 'default',
  };

  beforeAll(async () => {
    adapter = new VariationalAdapter(config);
    await adapter.initialize();
  });

  afterAll(async () => {
    await adapter.disconnect();
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(adapter).toBeDefined();
      expect(adapter.id).toBe('variational');
    });

    it('should have correct features', () => {
      // Public API methods implemented
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true); // RFQ-based order book
      expect(adapter.has.fetchFundingRate).toBe(true);

      // Trading API implemented
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.cancelAllOrders).toBe(true);

      // Account API implemented
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.fetchOrderHistory).toBe(true);
      expect(adapter.has.fetchMyTrades).toBe(true);

      // WebSocket/other methods still under development
      expect(adapter.has.fetchTrades).toBe(false);
      expect(adapter.has.watchOrderBook).toBe(false);
    });

    it('should not be disconnected after initialization', () => {
      expect(adapter.isDisconnected()).toBe(false);
    });
  });

  describe('Error Handling for Unimplemented Methods', () => {
    it('should throw error for fetchTrades (no trades endpoint for RFQ DEX)', async () => {
      await expect(adapter.fetchTrades('BTC/USDC:USDC')).rejects.toThrow(PerpDEXError);
    });

    it('should throw error for fetchPositions', async () => {
      await expect(adapter.fetchPositions()).rejects.toThrow(PerpDEXError);
    });

    it('should throw error for fetchBalance', async () => {
      await expect(adapter.fetchBalance()).rejects.toThrow(PerpDEXError);
    });

    it('should throw error for watchOrderBook', async () => {
      const generator = adapter.watchOrderBook('BTC/USDC:USDC');
      await expect(generator.next()).rejects.toThrow(PerpDEXError);
    });
  });

  // Skip network-dependent tests - Variational testnet is currently unavailable
  describe.skip('Trading Methods Error Handling', () => {
    // These tests verify error handling - actual API calls will fail with network errors
    // since the credentials are test values

    it('createOrder should throw PerpDEXError with test credentials', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'BTC/USDC:USDC',
          type: 'limit',
          side: 'buy',
          amount: 0.01,
          price: 50000,
        })
      ).rejects.toThrow(PerpDEXError);
    });

    it('cancelOrder should throw PerpDEXError with test credentials', async () => {
      await expect(adapter.cancelOrder('order123')).rejects.toThrow(PerpDEXError);
    });
  });

  // Skip - requires network access to testnet which is currently unavailable
  describe.skip('Parameter Validation', () => {
    it('should throw error for empty symbol in fetchTicker', async () => {
      await expect(adapter.fetchTicker('')).rejects.toThrow(PerpDEXError);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache without error', () => {
      expect(() => adapter.clearCache()).not.toThrow();
    });
  });

  describe('Connection Management', () => {
    it('should disconnect successfully', async () => {
      await adapter.disconnect();
      expect(adapter.isDisconnected()).toBe(true);
    });

    it('should reconnect after disconnect', async () => {
      await adapter.disconnect();
      await adapter.initialize();
      expect(adapter.isDisconnected()).toBe(false);
    });
  });

  // Skip network-dependent tests since Variational API is under development
  describe.skip('Market Data - Network Tests (Skipped - API Under Development)', () => {
    it('should fetch markets from API', async () => {
      const markets = await adapter.fetchMarkets();
      expect(markets).toBeDefined();
    });

    it('should fetch ticker from API', async () => {
      const ticker = await adapter.fetchTicker('BTC/USDC:USDC');
      expect(ticker).toBeDefined();
    });

    it('should perform health check', async () => {
      const health = await adapter.healthCheck();
      expect(health.status).toBe('healthy');
    });
  });
});

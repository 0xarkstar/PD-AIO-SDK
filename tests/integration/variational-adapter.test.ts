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
      // Only fetchMarkets and fetchTicker are implemented
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);

      // Everything else should be false (under development)
      expect(adapter.has.fetchOrderBook).toBe(false);
      expect(adapter.has.createOrder).toBe(false);
      expect(adapter.has.fetchPositions).toBe(false);
      expect(adapter.has.watchOrderBook).toBe(false);
    });

    it('should not be disconnected after initialization', () => {
      expect(adapter.isDisconnected()).toBe(false);
    });
  });

  describe('Error Handling for Unimplemented Methods', () => {
    it('should throw error for fetchOrderBook', async () => {
      await expect(adapter.fetchOrderBook('BTC/USDC:USDC')).rejects.toThrow(PerpDEXError);
    });

    it('should throw error for fetchTrades', async () => {
      await expect(adapter.fetchTrades('BTC/USDC:USDC')).rejects.toThrow(PerpDEXError);
    });

    it('should throw error for fetchFundingRate', async () => {
      await expect(adapter.fetchFundingRate('BTC/USDC:USDC')).rejects.toThrow(PerpDEXError);
    });

    it('should throw error for createOrder', async () => {
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

    it('should throw error for cancelOrder', async () => {
      await expect(adapter.cancelOrder('order123')).rejects.toThrow(PerpDEXError);
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

  describe('Parameter Validation', () => {
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

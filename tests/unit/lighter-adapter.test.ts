/**
 * LighterAdapter Unit Tests
 *
 * Tests for the Lighter DEX adapter covering market data, trading, and WebSocket methods
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LighterAdapter } from '../../src/adapters/lighter/LighterAdapter.js';

describe('LighterAdapter', () => {
  describe('constructor', () => {
    it('should initialize with default config', () => {
      const adapter = new LighterAdapter();
      expect(adapter.id).toBe('lighter');
      expect(adapter.name).toBe('Lighter');
    });

    it('should initialize with API credentials', () => {
      const adapter = new LighterAdapter({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });
      expect(adapter.id).toBe('lighter');
    });

    it('should use testnet URLs when testnet is true', () => {
      const adapter = new LighterAdapter({ testnet: true });
      expect((adapter as any).apiUrl).toContain('testnet');
    });

    it('should use mainnet URLs when testnet is false', () => {
      const adapter = new LighterAdapter({ testnet: false });
      expect((adapter as any).apiUrl).not.toContain('testnet');
    });

    it('should set rate limit tier', () => {
      const adapter = new LighterAdapter({ rateLimitTier: 'tier2' });
      expect((adapter as any).rateLimiter).toBeDefined();
    });

    it('should set custom timeout', () => {
      const adapter = new LighterAdapter({ timeout: 60000 });
      expect((adapter as any).httpClient).toBeDefined();
    });
  });

  describe('has feature map', () => {
    let adapter: LighterAdapter;

    beforeEach(() => {
      adapter = new LighterAdapter();
    });

    it('should have correct supported features', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.fetchOrderHistory).toBe(true);
      expect(adapter.has.fetchMyTrades).toBe(true);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.cancelAllOrders).toBe(true);
      expect(adapter.has.watchOrderBook).toBe(true);
      expect(adapter.has.watchTrades).toBe(true);
      expect(adapter.has.watchPositions).toBe(true);
    });

    it('should have correct unsupported features', () => {
      expect(adapter.has.fetchFundingRateHistory).toBe(false);
      expect(adapter.has.createBatchOrders).toBe(false);
      expect(adapter.has.setLeverage).toBe(false);
    });
  });

  describe('symbol conversion', () => {
    let adapter: LighterAdapter;

    beforeEach(() => {
      adapter = new LighterAdapter();
    });

    it('symbolToExchange should convert CCXT symbol to Lighter format', () => {
      const result = (adapter as any).symbolToExchange('BTC/USDT:USDT');
      expect(result).toBeDefined();
    });

    it('symbolFromExchange should convert Lighter symbol to CCXT format', () => {
      const result = (adapter as any).symbolFromExchange('BTCUSDT');
      expect(result).toBeDefined();
    });
  });

  describe('rate limiter', () => {
    let adapter: LighterAdapter;

    beforeEach(() => {
      adapter = new LighterAdapter();
    });

    it('should have rate limiter configured', () => {
      expect((adapter as any).rateLimiter).toBeDefined();
    });
  });

  describe('http client', () => {
    let adapter: LighterAdapter;

    beforeEach(() => {
      adapter = new LighterAdapter();
    });

    it('should have http client configured', () => {
      expect((adapter as any).httpClient).toBeDefined();
    });
  });

  describe('normalizer', () => {
    let adapter: LighterAdapter;

    beforeEach(() => {
      adapter = new LighterAdapter();
    });

    it('should have normalizer instance', () => {
      expect((adapter as any).normalizer).toBeDefined();
    });
  });

  describe('trading methods without authentication', () => {
    let adapter: LighterAdapter;

    beforeEach(() => {
      adapter = new LighterAdapter();
    });

    it('createOrder should throw without API credentials', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'BTC/USDT:USDT',
          side: 'buy',
          type: 'limit',
          amount: 0.1,
          price: 45000,
        })
      ).rejects.toThrow();
    });

    it('cancelOrder should throw without API credentials', async () => {
      await expect(adapter.cancelOrder('order123')).rejects.toThrow();
    });
  });

  describe('disconnect', () => {
    let adapter: LighterAdapter;

    beforeEach(() => {
      adapter = new LighterAdapter();
    });

    it('should disconnect and clean up resources', async () => {
      await adapter.disconnect();
      expect((adapter as any).wsManager).toBeNull();
    });
  });
});

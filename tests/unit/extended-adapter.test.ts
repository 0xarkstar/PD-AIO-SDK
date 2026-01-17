/**
 * ExtendedAdapter Unit Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ExtendedAdapter } from '../../src/adapters/extended/ExtendedAdapter.js';

describe('ExtendedAdapter', () => {
  describe('constructor', () => {
    it('should initialize with default config', () => {
      const adapter = new ExtendedAdapter();
      expect(adapter.id).toBe('extended');
      expect(adapter.name).toBe('Extended');
    });

    it('should initialize with API key', () => {
      const adapter = new ExtendedAdapter({ apiKey: 'test-key' });
      expect(adapter.id).toBe('extended');
    });

    it('should use testnet URLs when testnet is true', () => {
      const adapter = new ExtendedAdapter({ testnet: true });
      expect((adapter as any).apiUrl).toContain('testnet');
    });

    it('should use mainnet URLs when testnet is false', () => {
      const adapter = new ExtendedAdapter({ testnet: false });
      expect((adapter as any).apiUrl).not.toContain('testnet');
    });

    it('should set custom timeout', () => {
      const adapter = new ExtendedAdapter({ timeout: 60000 });
      expect((adapter as any).httpClient).toBeDefined();
    });

    it('should not initialize StarkNet client without credentials', () => {
      const adapter = new ExtendedAdapter();
      expect((adapter as any).starkNetClient).toBeUndefined();
    });
  });

  describe('has feature map', () => {
    let adapter: ExtendedAdapter;

    beforeEach(() => {
      adapter = new ExtendedAdapter();
    });

    it('should have correct supported features', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.fetchFundingRateHistory).toBe(true);
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.cancelAllOrders).toBe(true);
      expect(adapter.has.createBatchOrders).toBe(true);
      expect(adapter.has.cancelBatchOrders).toBe(true);
      expect(adapter.has.editOrder).toBe(true);
      expect(adapter.has.setLeverage).toBe(true);
      expect(adapter.has.setMarginMode).toBe(true);
    });

    it('should have WebSocket features marked false', () => {
      expect(adapter.has.watchOrderBook).toBe(false);
      expect(adapter.has.watchTrades).toBe(false);
      expect(adapter.has.watchTicker).toBe(false);
      expect(adapter.has.watchPositions).toBe(false);
      expect(adapter.has.watchOrders).toBe(false);
      expect(adapter.has.watchBalance).toBe(false);
      expect(adapter.has.watchFundingRate).toBe(false);
    });

    it('should have unsupported features marked false', () => {
      expect(adapter.has.fetchDeposits).toBe(false);
      expect(adapter.has.fetchWithdrawals).toBe(false);
      expect(adapter.has.fetchRateLimitStatus).toBe(false);
    });
  });

  describe('symbol conversion', () => {
    let adapter: ExtendedAdapter;

    beforeEach(() => {
      adapter = new ExtendedAdapter();
    });

    it('symbolToExchange should convert CCXT symbol', () => {
      const result = (adapter as any).symbolToExchange('BTC/USDT:USDT');
      expect(result).toBeDefined();
    });

    it('symbolFromExchange should convert exchange symbol', () => {
      const result = (adapter as any).symbolFromExchange('BTCUSDT');
      expect(result).toBeDefined();
    });
  });

  describe('rate limiter', () => {
    let adapter: ExtendedAdapter;

    beforeEach(() => {
      adapter = new ExtendedAdapter();
    });

    it('should have rate limiter configured', () => {
      expect((adapter as any).rateLimiter).toBeDefined();
    });
  });

  describe('http client', () => {
    let adapter: ExtendedAdapter;

    beforeEach(() => {
      adapter = new ExtendedAdapter();
    });

    it('should have http client configured', () => {
      expect((adapter as any).httpClient).toBeDefined();
    });
  });

  describe('normalizer', () => {
    let adapter: ExtendedAdapter;

    beforeEach(() => {
      adapter = new ExtendedAdapter();
    });

    it('should have normalizer instance', () => {
      expect((adapter as any).normalizer).toBeDefined();
    });
  });

  describe('initialize', () => {
    let adapter: ExtendedAdapter;

    beforeEach(() => {
      adapter = new ExtendedAdapter();
    });

    it('should mark adapter as ready', async () => {
      await adapter.initialize();
      expect((adapter as any)._isReady).toBe(true);
    });
  });

  describe('disconnect', () => {
    let adapter: ExtendedAdapter;

    beforeEach(() => {
      adapter = new ExtendedAdapter();
    });

    it('should disconnect cleanly', async () => {
      await adapter.initialize();
      await adapter.disconnect();
      expect((adapter as any)._isReady).toBe(false);
    });
  });

  describe('trading without authentication', () => {
    let adapter: ExtendedAdapter;

    beforeEach(() => {
      adapter = new ExtendedAdapter();
    });

    it('createOrder should throw without API key', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'BTC/USDT:USDT',
          side: 'buy',
          type: 'limit',
          amount: 0.1,
          price: 45000,
        })
      ).rejects.toThrow('API key required');
    });

    it('cancelOrder should throw without API key', async () => {
      await expect(adapter.cancelOrder('order123')).rejects.toThrow('API key required');
    });

    it('fetchPositions should throw without API key', async () => {
      await expect(adapter.fetchPositions()).rejects.toThrow('API key required');
    });

    it('fetchBalance should throw without API key', async () => {
      await expect(adapter.fetchBalance()).rejects.toThrow('API key required');
    });
  });

  describe('unsupported methods', () => {
    let adapter: ExtendedAdapter;

    beforeEach(() => {
      adapter = new ExtendedAdapter();
    });

    it('fetchDeposits should throw not supported', async () => {
      await expect(adapter.fetchDeposits()).rejects.toThrow('not supported');
    });

    it('fetchWithdrawals should throw not supported', async () => {
      await expect(adapter.fetchWithdrawals()).rejects.toThrow('not supported');
    });

    it('fetchRateLimitStatus should throw not supported', async () => {
      await expect(adapter.fetchRateLimitStatus()).rejects.toThrow('not supported');
    });
  });

  describe('WebSocket methods', () => {
    let adapter: ExtendedAdapter;

    beforeEach(() => {
      adapter = new ExtendedAdapter();
    });

    it('watchOrderBook should throw not implemented', async () => {
      const generator = adapter.watchOrderBook('BTC/USDT:USDT');
      await expect(generator.next()).rejects.toThrow('not implemented');
    });

    it('watchTrades should throw not implemented', async () => {
      const generator = adapter.watchTrades('BTC/USDT:USDT');
      await expect(generator.next()).rejects.toThrow('not implemented');
    });

    it('watchTicker should throw not implemented', async () => {
      const generator = adapter.watchTicker('BTC/USDT:USDT');
      await expect(generator.next()).rejects.toThrow('not implemented');
    });

    it('watchPositions should throw not implemented', async () => {
      const generator = adapter.watchPositions();
      await expect(generator.next()).rejects.toThrow('not implemented');
    });

    it('watchOrders should throw not implemented', async () => {
      const generator = adapter.watchOrders();
      await expect(generator.next()).rejects.toThrow('not implemented');
    });

    it('watchBalance should throw not implemented', async () => {
      const generator = adapter.watchBalance();
      await expect(generator.next()).rejects.toThrow('not implemented');
    });

    it('watchFundingRate should throw not implemented', async () => {
      const generator = adapter.watchFundingRate('BTC/USDT:USDT');
      await expect(generator.next()).rejects.toThrow('not implemented');
    });
  });
});

/**
 * VariationalAdapter Unit Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { VariationalAdapter } from '../../src/adapters/variational/VariationalAdapter.js';

describe('VariationalAdapter', () => {
  describe('constructor', () => {
    it('should initialize with default config', () => {
      const adapter = new VariationalAdapter();
      expect(adapter.id).toBe('variational');
      expect(adapter.name).toBe('Variational');
    });

    it('should initialize with API credentials', () => {
      const adapter = new VariationalAdapter({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });
      expect(adapter.id).toBe('variational');
    });

    it('should use testnet URLs when testnet is true', () => {
      const adapter = new VariationalAdapter({ testnet: true });
      expect((adapter as any).apiUrl).toContain('testnet');
    });

    it('should use mainnet URLs when testnet is false', () => {
      const adapter = new VariationalAdapter({ testnet: false });
      expect((adapter as any).apiUrl).not.toContain('testnet');
    });
  });

  describe('has feature map', () => {
    let adapter: VariationalAdapter;

    beforeEach(() => {
      adapter = new VariationalAdapter();
    });

    it('should have correct supported features', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
    });

    it('should have unsupported features marked false', () => {
      expect(adapter.has.fetchOrderBook).toBe(false);
      expect(adapter.has.fetchTrades).toBe(false);
      expect(adapter.has.fetchFundingRate).toBe(false);
      expect(adapter.has.createOrder).toBe(false);
      expect(adapter.has.cancelOrder).toBe(false);
      expect(adapter.has.fetchPositions).toBe(false);
    });
  });

  describe('symbol conversion', () => {
    let adapter: VariationalAdapter;

    beforeEach(() => {
      adapter = new VariationalAdapter();
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
    let adapter: VariationalAdapter;

    beforeEach(() => {
      adapter = new VariationalAdapter();
    });

    it('should have rate limiter configured', () => {
      expect((adapter as any).rateLimiter).toBeDefined();
    });
  });

  describe('http client', () => {
    let adapter: VariationalAdapter;

    beforeEach(() => {
      adapter = new VariationalAdapter();
    });

    it('should have http client configured', () => {
      expect((adapter as any).httpClient).toBeDefined();
    });
  });

  describe('normalizer', () => {
    let adapter: VariationalAdapter;

    beforeEach(() => {
      adapter = new VariationalAdapter();
    });

    it('should have normalizer instance', () => {
      expect((adapter as any).normalizer).toBeDefined();
    });
  });

  describe('disconnect', () => {
    let adapter: VariationalAdapter;

    beforeEach(() => {
      adapter = new VariationalAdapter();
    });

    it('should disconnect cleanly', async () => {
      await adapter.disconnect();
      expect((adapter as any)._isReady).toBe(false);
    });
  });

  describe('unsupported methods', () => {
    let adapter: VariationalAdapter;

    beforeEach(() => {
      adapter = new VariationalAdapter();
    });

    it('createOrder should throw not implemented', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'BTC/USDT:USDT',
          side: 'buy',
          type: 'limit',
          amount: 0.1,
          price: 45000,
        })
      ).rejects.toThrow('not implemented');
    });

    it('cancelOrder should throw not implemented', async () => {
      await expect(adapter.cancelOrder('order123')).rejects.toThrow('not implemented');
    });

    it('fetchPositions should throw not implemented', async () => {
      await expect(adapter.fetchPositions()).rejects.toThrow('not implemented');
    });

    it('fetchBalance should throw not implemented', async () => {
      await expect(adapter.fetchBalance()).rejects.toThrow('not implemented');
    });
  });
});

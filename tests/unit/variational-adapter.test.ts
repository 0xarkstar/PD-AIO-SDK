/**
 * VariationalAdapter Unit Tests
 *
 * Tests for the Variational DEX adapter covering public market data methods
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

    it('should set rate limit tier', () => {
      const adapter = new VariationalAdapter({ rateLimitTier: 'perIp' });
      expect((adapter as any).rateLimiter).toBeDefined();
    });

    it('should set custom timeout', () => {
      const adapter = new VariationalAdapter({ timeout: 60000 });
      expect((adapter as any).httpClient).toBeDefined();
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
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
    });

    it('should have trading features available', () => {
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.cancelAllOrders).toBe(true);
    });

    it('should have account features available', () => {
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.fetchOrderHistory).toBe(true);
      expect(adapter.has.fetchMyTrades).toBe(true);
    });

    it('should have correct unsupported features', () => {
      expect(adapter.has.fetchTrades).toBe(false);
      expect(adapter.has.fetchFundingRateHistory).toBe(false);
      expect(adapter.has.watchOrderBook).toBe(false);
      expect(adapter.has.watchTrades).toBe(false);
      expect(adapter.has.setLeverage).toBe(false);
      expect(adapter.has.setMarginMode).toBe(false);
    });
  });

  describe('symbol conversion', () => {
    let adapter: VariationalAdapter;

    beforeEach(() => {
      adapter = new VariationalAdapter();
    });

    it('symbolToExchange should convert CCXT symbol to Variational format', () => {
      const result = (adapter as any).symbolToExchange('BTC/USDC:USDC');
      expect(result).toBe('BTC-USDC-PERP');
    });

    it('symbolFromExchange should convert Variational symbol to CCXT format', () => {
      const result = (adapter as any).symbolFromExchange('BTC-USDC-PERP');
      expect(result).toBe('BTC/USDC:USDC');
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

  describe('trading methods without authentication', () => {
    let adapter: VariationalAdapter;

    beforeEach(() => {
      adapter = new VariationalAdapter();
    });

    it('createOrder should throw authentication error without credentials', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'BTC/USDC:USDC',
          side: 'buy',
          type: 'limit',
          amount: 0.1,
          price: 45000,
        })
      ).rejects.toThrow('API credentials required');
    });

    it('cancelOrder should throw authentication error without credentials', async () => {
      await expect(adapter.cancelOrder('order123')).rejects.toThrow('API credentials required');
    });

    it('cancelAllOrders should throw authentication error without credentials', async () => {
      await expect(adapter.cancelAllOrders()).rejects.toThrow('API credentials required');
    });

    it('requestQuote should throw authentication error without credentials', async () => {
      await expect(adapter.requestQuote('BTC/USDC:USDC', 'buy', 0.1)).rejects.toThrow(
        'API credentials required'
      );
    });

    it('acceptQuote should throw authentication error without credentials', async () => {
      await expect(adapter.acceptQuote('quote-123')).rejects.toThrow('API credentials required');
    });
  });

  describe('account methods without authentication', () => {
    let adapter: VariationalAdapter;

    beforeEach(() => {
      adapter = new VariationalAdapter();
    });

    it('fetchPositions should throw authentication error without credentials', async () => {
      await expect(adapter.fetchPositions()).rejects.toThrow('API credentials required');
    });

    it('fetchBalance should throw authentication error without credentials', async () => {
      await expect(adapter.fetchBalance()).rejects.toThrow('API credentials required');
    });

    it('fetchOrderHistory should throw authentication error without credentials', async () => {
      await expect(adapter.fetchOrderHistory()).rejects.toThrow('API credentials required');
    });

    it('fetchMyTrades should throw authentication error without credentials', async () => {
      await expect(adapter.fetchMyTrades()).rejects.toThrow('API credentials required');
    });
  });

  describe('validation', () => {
    let adapter: VariationalAdapter;

    beforeEach(() => {
      adapter = new VariationalAdapter();
    });

    it('fetchTicker should throw for empty symbol', async () => {
      await expect(adapter.fetchTicker('')).rejects.toThrow('Symbol is required');
    });

    it('fetchOrderBook should throw for empty symbol', async () => {
      await expect(adapter.fetchOrderBook('')).rejects.toThrow('Symbol is required');
    });

    it('fetchFundingRate should throw for empty symbol', async () => {
      await expect(adapter.fetchFundingRate('')).rejects.toThrow('Symbol is required');
    });
  });

  describe('disconnect', () => {
    let adapter: VariationalAdapter;

    beforeEach(() => {
      adapter = new VariationalAdapter();
    });

    it('should disconnect and clean up resources', async () => {
      await adapter.disconnect();
      expect((adapter as any).wsManager).toBeNull();
    });
  });
});

/**
 * HyperliquidAdapter Unit Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { HyperliquidAdapter } from '../../src/adapters/hyperliquid/HyperliquidAdapter.js';

describe('HyperliquidAdapter', () => {
  const testPrivateKey = '0x' + '1'.repeat(64);

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const adapter = new HyperliquidAdapter();
      expect(adapter.id).toBe('hyperliquid');
      expect(adapter.name).toBe('Hyperliquid');
    });

    it('should initialize with private key', () => {
      const adapter = new HyperliquidAdapter({ privateKey: testPrivateKey });
      expect(adapter.id).toBe('hyperliquid');
    });

    it('should use testnet URLs when testnet is true', () => {
      const adapter = new HyperliquidAdapter({ testnet: true });
      expect((adapter as any).apiUrl).toContain('testnet');
    });

    it('should use mainnet URLs when testnet is false', () => {
      const adapter = new HyperliquidAdapter({ testnet: false });
      expect((adapter as any).apiUrl).not.toContain('testnet');
    });
  });

  describe('has feature map', () => {
    let adapter: HyperliquidAdapter;

    beforeEach(() => {
      adapter = new HyperliquidAdapter();
    });

    it('should have correct supported features', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
    });
  });

  describe('symbol conversion', () => {
    let adapter: HyperliquidAdapter;

    beforeEach(() => {
      adapter = new HyperliquidAdapter();
    });

    it('symbolToExchange should convert CCXT symbol to Hyperliquid format', () => {
      // Hyperliquid uses just the base symbol (e.g., "BTC" not "BTC-PERP")
      const result = (adapter as any).symbolToExchange('BTC/USDC:USDC');
      expect(result).toBe('BTC');
    });

    it('symbolFromExchange should convert Hyperliquid symbol to unified format', () => {
      // Hyperliquid uses just the base symbol
      const result = (adapter as any).symbolFromExchange('BTC');
      expect(result).toBe('BTC/USDT:USDT');
    });

    it('symbolToExchange should handle ETH', () => {
      const result = (adapter as any).symbolToExchange('ETH/USDC:USDC');
      expect(result).toBe('ETH');
    });

    it('symbolFromExchange should handle ETH', () => {
      const result = (adapter as any).symbolFromExchange('ETH');
      expect(result).toBe('ETH/USDT:USDT');
    });
  });

  describe('rate limiter', () => {
    let adapter: HyperliquidAdapter;

    beforeEach(() => {
      adapter = new HyperliquidAdapter();
    });

    it('should have rate limiter configured', () => {
      expect((adapter as any).rateLimiter).toBeDefined();
    });
  });

  describe('normalizer', () => {
    let adapter: HyperliquidAdapter;

    beforeEach(() => {
      adapter = new HyperliquidAdapter();
    });

    it('should have normalizer instance', () => {
      expect((adapter as any).normalizer).toBeDefined();
    });
  });

  describe('trading without authentication', () => {
    let adapter: HyperliquidAdapter;

    beforeEach(() => {
      adapter = new HyperliquidAdapter();
    });

    it('createOrder should throw without private key', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'BTC/USDC:USDC',
          side: 'buy',
          type: 'limit',
          amount: 0.1,
          price: 45000,
        })
      ).rejects.toThrow();
    });
  });

  describe('disconnect', () => {
    let adapter: HyperliquidAdapter;

    beforeEach(() => {
      adapter = new HyperliquidAdapter();
    });

    it('should disconnect cleanly', async () => {
      await adapter.disconnect();
      expect((adapter as any)._isReady).toBe(false);
    });
  });
});

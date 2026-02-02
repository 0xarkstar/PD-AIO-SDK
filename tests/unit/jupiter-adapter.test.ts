/**
 * Jupiter Adapter Unit Tests
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { JupiterAdapter } from '../../src/adapters/jupiter/JupiterAdapter.js';

// Mock fetch for testing
const originalFetch = global.fetch;

describe('JupiterAdapter', () => {
  let adapter: JupiterAdapter;

  beforeEach(() => {
    // Reset fetch mock
    global.fetch = jest.fn() as jest.Mock;
  });

  afterEach(async () => {
    if (adapter) {
      await adapter.disconnect();
    }
    global.fetch = originalFetch;
  });

  describe('constructor', () => {
    test('creates adapter with default config', () => {
      adapter = new JupiterAdapter();

      expect(adapter.id).toBe('jupiter');
      expect(adapter.name).toBe('Jupiter Perps');
      expect(adapter.isReady).toBe(false);
    });

    test('creates adapter with custom config', () => {
      adapter = new JupiterAdapter({
        timeout: 60000,
        walletAddress: '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs',
      });

      expect(adapter.id).toBe('jupiter');
    });
  });

  describe('has', () => {
    beforeEach(() => {
      adapter = new JupiterAdapter();
    });

    test('supports market data features', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchFundingRate).toBe(true);
    });

    test('supports order book (synthetic)', () => {
      expect(adapter.has.fetchOrderBook).toBe(true);
    });

    test('supports createOrder, but not cancel (instant execution)', () => {
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(false); // Jupiter uses instant execution
      expect(adapter.has.cancelAllOrders).toBe(false); // Jupiter uses instant execution
    });

    test('supports account data', () => {
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
    });

    test('does not support WebSocket', () => {
      expect(adapter.has.watchOrderBook).toBe(false);
      expect(adapter.has.watchTrades).toBe(false);
      expect(adapter.has.watchTicker).toBe(false);
      expect(adapter.has.watchPositions).toBe(false);
    });
  });

  describe('initialize', () => {
    test('initializes successfully with mock response', async () => {
      adapter = new JupiterAdapter();

      // Mock successful price API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            'So11111111111111111111111111111111111111112': {
              id: 'So11111111111111111111111111111111111111112',
              type: 'derivedPrice',
              price: '98.50',
            },
          },
          timeTaken: 0.1,
        }),
      });

      await adapter.initialize();

      expect(adapter.isReady).toBe(true);
    });

    test('throws on initialization failure', async () => {
      adapter = new JupiterAdapter();

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(adapter.initialize()).rejects.toThrow();
    });

    test('skips if already initialized', async () => {
      adapter = new JupiterAdapter();

      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            'So11111111111111111111111111111111111111112': {
              id: 'So11111111111111111111111111111111111111112',
              type: 'derivedPrice',
              price: '98.50',
            },
          },
          timeTaken: 0.1,
        }),
      });

      await adapter.initialize();
      await adapter.initialize(); // Second call should skip

      expect(adapter.isReady).toBe(true);
      // Should only call fetch once (from first initialize)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchMarkets', () => {
    beforeEach(async () => {
      adapter = new JupiterAdapter();

      // Mock initialize
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            'So11111111111111111111111111111111111111112': {
              id: 'So11111111111111111111111111111111111111112',
              type: 'derivedPrice',
              price: '98.50',
            },
          },
          timeTaken: 0.1,
        }),
      });

      await adapter.initialize();
    });

    test('returns all markets', async () => {
      const markets = await adapter.fetchMarkets();

      expect(markets).toHaveLength(3); // SOL, ETH, BTC
      expect(markets.map(m => m.symbol)).toContain('SOL/USD:USD');
      expect(markets.map(m => m.symbol)).toContain('ETH/USD:USD');
      expect(markets.map(m => m.symbol)).toContain('BTC/USD:USD');
    });

    test('returns markets with correct structure', async () => {
      const markets = await adapter.fetchMarkets();
      const solMarket = markets.find(m => m.symbol === 'SOL/USD:USD');

      expect(solMarket).toBeDefined();
      expect(solMarket?.id).toBe('SOL-PERP');
      expect(solMarket?.base).toBe('SOL');
      expect(solMarket?.quote).toBe('USD');
      expect(solMarket?.settle).toBe('USD');
      expect(solMarket?.active).toBe(true);
      expect(solMarket?.maxLeverage).toBe(250);
      expect(solMarket?.info?.marginMode).toBe('isolated');
    });

    test('filters active markets', async () => {
      const markets = await adapter.fetchMarkets({ active: true });

      expect(markets.length).toBeGreaterThan(0);
      markets.forEach(m => {
        expect(m.active).toBe(true);
      });
    });

    test('filters by market IDs', async () => {
      const markets = await adapter.fetchMarkets({ ids: ['SOL-PERP'] });

      expect(markets).toHaveLength(1);
      expect(markets[0].id).toBe('SOL-PERP');
    });

    test('throws if not initialized', async () => {
      const uninitAdapter = new JupiterAdapter();

      await expect(uninitAdapter.fetchMarkets()).rejects.toThrow(
        'Jupiter Perps adapter not initialized'
      );
    });
  });

  describe('fetchTicker', () => {
    beforeEach(async () => {
      adapter = new JupiterAdapter();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            'So11111111111111111111111111111111111111112': {
              id: 'So11111111111111111111111111111111111111112',
              type: 'derivedPrice',
              price: '98.50',
              extraInfo: {
                quotedPrice: {
                  buyPrice: '98.48',
                  sellPrice: '98.52',
                },
              },
            },
          },
          timeTaken: 0.1,
        }),
      });

      await adapter.initialize();
    });

    test('fetches ticker for valid symbol', async () => {
      const ticker = await adapter.fetchTicker('SOL/USD:USD');

      expect(ticker.symbol).toBe('SOL/USD:USD');
      expect(ticker.last).toBe(98.5);
      expect(ticker.bid).toBe(98.48);
      expect(ticker.ask).toBe(98.52);
    });

    test('throws for invalid symbol', async () => {
      await expect(adapter.fetchTicker('INVALID/USD:USD')).rejects.toThrow(
        'Invalid market'
      );
    });

    test('throws if not initialized', async () => {
      const uninitAdapter = new JupiterAdapter();

      await expect(uninitAdapter.fetchTicker('SOL/USD:USD')).rejects.toThrow(
        'not initialized'
      );
    });
  });

  describe('fetchOrderBook', () => {
    beforeEach(async () => {
      adapter = new JupiterAdapter();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            'So11111111111111111111111111111111111111112': {
              id: 'So11111111111111111111111111111111111111112',
              type: 'derivedPrice',
              price: '100.00',
            },
          },
          timeTaken: 0.1,
        }),
      });

      await adapter.initialize();
    });

    test('returns synthetic order book', async () => {
      const orderBook = await adapter.fetchOrderBook('SOL/USD:USD');

      expect(orderBook.symbol).toBe('SOL/USD:USD');
      expect(orderBook.exchange).toBe('jupiter');
      expect(orderBook.bids).toBeInstanceOf(Array);
      expect(orderBook.asks).toBeInstanceOf(Array);
    });

    test('throws for invalid symbol', async () => {
      await expect(adapter.fetchOrderBook('INVALID/USD:USD')).rejects.toThrow(
        'Invalid market'
      );
    });
  });

  describe('fetchTrades', () => {
    beforeEach(async () => {
      adapter = new JupiterAdapter();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            'So11111111111111111111111111111111111111112': {
              id: 'So11111111111111111111111111111111111111112',
              type: 'derivedPrice',
              price: '100.00',
            },
          },
          timeTaken: 0.1,
        }),
      });

      await adapter.initialize();
    });

    test('returns empty array (no trade feed)', async () => {
      const trades = await adapter.fetchTrades('SOL/USD:USD');

      expect(trades).toEqual([]);
    });
  });

  describe('fetchFundingRate', () => {
    beforeEach(async () => {
      adapter = new JupiterAdapter();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            'So11111111111111111111111111111111111111112': {
              id: 'So11111111111111111111111111111111111111112',
              type: 'derivedPrice',
              price: '100.00',
            },
          },
          timeTaken: 0.1,
        }),
      });

      await adapter.initialize();
    });

    test('returns borrow fee as funding rate', async () => {
      const fundingRate = await adapter.fetchFundingRate('SOL/USD:USD');

      expect(fundingRate.symbol).toBe('SOL/USD:USD');
      expect(fundingRate.fundingIntervalHours).toBe(1);
      expect(fundingRate.markPrice).toBe(100);
      expect(typeof fundingRate.fundingRate).toBe('number');
    });

    test('throws for invalid symbol', async () => {
      await expect(adapter.fetchFundingRate('INVALID/USD:USD')).rejects.toThrow(
        'Invalid market'
      );
    });
  });

  describe('fetchFundingRateHistory', () => {
    beforeEach(async () => {
      adapter = new JupiterAdapter();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            'So11111111111111111111111111111111111111112': {
              id: 'So11111111111111111111111111111111111111112',
              type: 'derivedPrice',
              price: '100.00',
            },
          },
          timeTaken: 0.1,
        }),
      });

      await adapter.initialize();
    });

    test('returns empty array (not supported)', async () => {
      const history = await adapter.fetchFundingRateHistory('SOL/USD:USD');

      expect(history).toEqual([]);
    });
  });

  describe('fetchPositions', () => {
    test('throws without wallet address', async () => {
      adapter = new JupiterAdapter();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            'So11111111111111111111111111111111111111112': {
              id: 'So11111111111111111111111111111111111111112',
              type: 'derivedPrice',
              price: '100.00',
            },
          },
          timeTaken: 0.1,
        }),
      });

      await adapter.initialize();

      await expect(adapter.fetchPositions()).rejects.toThrow(
        'Wallet address required'
      );
    });

    test('requires Solana client for fetching positions with wallet', async () => {
      adapter = new JupiterAdapter({
        walletAddress: '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            'So11111111111111111111111111111111111111112': {
              id: 'So11111111111111111111111111111111111111112',
              type: 'derivedPrice',
              price: '100.00',
            },
          },
          timeTaken: 0.1,
        }),
      });

      await adapter.initialize();
      // Now requires Solana client initialization which throws when not properly configured
      await expect(adapter.fetchPositions()).rejects.toThrow();
    });
  });

  describe('fetchBalance', () => {
    test('throws without wallet address', async () => {
      adapter = new JupiterAdapter();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            'So11111111111111111111111111111111111111112': {
              id: 'So11111111111111111111111111111111111111112',
              type: 'derivedPrice',
              price: '100.00',
            },
          },
          timeTaken: 0.1,
        }),
      });

      await adapter.initialize();

      await expect(adapter.fetchBalance()).rejects.toThrow(
        'Wallet address required'
      );
    });
  });

  describe('fetchOpenOrders', () => {
    beforeEach(async () => {
      adapter = new JupiterAdapter();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            'So11111111111111111111111111111111111111112': {
              id: 'So11111111111111111111111111111111111111112',
              type: 'derivedPrice',
              price: '100.00',
            },
          },
          timeTaken: 0.1,
        }),
      });

      await adapter.initialize();
    });

    test('returns empty array (instant execution)', async () => {
      const orders = await adapter.fetchOpenOrders();

      expect(orders).toEqual([]);
    });
  });

  describe('trading operations', () => {
    beforeEach(async () => {
      adapter = new JupiterAdapter();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            'So11111111111111111111111111111111111111112': {
              id: 'So11111111111111111111111111111111111111112',
              type: 'derivedPrice',
              price: '100.00',
            },
          },
          timeTaken: 0.1,
        }),
      });

      await adapter.initialize();
    });

    test('createOrder throws without private key', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'SOL/USD:USD',
          side: 'buy',
          type: 'market',
          amount: 1,
        })
      ).rejects.toThrow('Private key required for trading');
    });

    test('cancelOrder throws', async () => {
      await expect(adapter.cancelOrder('order-id')).rejects.toThrow(
        'instant execution'
      );
    });

    test('cancelAllOrders throws', async () => {
      await expect(adapter.cancelAllOrders()).rejects.toThrow(
        'instant execution'
      );
    });

    test('setLeverage throws', async () => {
      await expect(adapter.setLeverage('SOL/USD:USD', 10)).rejects.toThrow(
        'leverage is set per-trade'
      );
    });
  });

  describe('getAddress', () => {
    test('returns wallet address when configured', async () => {
      adapter = new JupiterAdapter({
        walletAddress: '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs',
      });

      const address = await adapter.getAddress();

      expect(address).toBe('7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs');
    });

    test('returns undefined without wallet', async () => {
      adapter = new JupiterAdapter();

      const address = await adapter.getAddress();

      expect(address).toBeUndefined();
    });
  });
});

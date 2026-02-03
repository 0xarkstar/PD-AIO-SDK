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

describe('Jupiter Constants', () => {
  let unifiedToJupiter: typeof import('../../src/adapters/jupiter/constants.js').unifiedToJupiter;
  let jupiterToUnified: typeof import('../../src/adapters/jupiter/constants.js').jupiterToUnified;
  let getBaseToken: typeof import('../../src/adapters/jupiter/constants.js').getBaseToken;
  let JUPITER_MARKETS: typeof import('../../src/adapters/jupiter/constants.js').JUPITER_MARKETS;
  let JUPITER_TOKEN_MINTS: typeof import('../../src/adapters/jupiter/constants.js').JUPITER_TOKEN_MINTS;
  let JUPITER_API_URLS: typeof import('../../src/adapters/jupiter/constants.js').JUPITER_API_URLS;
  let JUPITER_PERPS_PROGRAM_ID: typeof import('../../src/adapters/jupiter/constants.js').JUPITER_PERPS_PROGRAM_ID;
  let JLP_TOKEN_MINT: typeof import('../../src/adapters/jupiter/constants.js').JLP_TOKEN_MINT;
  let JUPITER_BORROW_FEE: typeof import('../../src/adapters/jupiter/constants.js').JUPITER_BORROW_FEE;
  let JUPITER_ERROR_MESSAGES: typeof import('../../src/adapters/jupiter/constants.js').JUPITER_ERROR_MESSAGES;

  beforeAll(async () => {
    const jupiterModule = await import('../../src/adapters/jupiter/constants.js');
    unifiedToJupiter = jupiterModule.unifiedToJupiter;
    jupiterToUnified = jupiterModule.jupiterToUnified;
    getBaseToken = jupiterModule.getBaseToken;
    JUPITER_MARKETS = jupiterModule.JUPITER_MARKETS;
    JUPITER_TOKEN_MINTS = jupiterModule.JUPITER_TOKEN_MINTS;
    JUPITER_API_URLS = jupiterModule.JUPITER_API_URLS;
    JUPITER_PERPS_PROGRAM_ID = jupiterModule.JUPITER_PERPS_PROGRAM_ID;
    JLP_TOKEN_MINT = jupiterModule.JLP_TOKEN_MINT;
    JUPITER_BORROW_FEE = jupiterModule.JUPITER_BORROW_FEE;
    JUPITER_ERROR_MESSAGES = jupiterModule.JUPITER_ERROR_MESSAGES;
  });

  describe('symbol conversion', () => {
    test('unifiedToJupiter converts correctly', () => {
      expect(unifiedToJupiter('SOL/USD:USD')).toBe('SOL-PERP');
      expect(unifiedToJupiter('BTC/USD:USD')).toBe('BTC-PERP');
      expect(unifiedToJupiter('ETH/USD:USD')).toBe('ETH-PERP');
    });

    test('unifiedToJupiter throws on invalid format', () => {
      expect(() => unifiedToJupiter('')).toThrow();
    });

    test('jupiterToUnified converts correctly', () => {
      expect(jupiterToUnified('SOL-PERP')).toBe('SOL/USD:USD');
      expect(jupiterToUnified('BTC-PERP')).toBe('BTC/USD:USD');
      expect(jupiterToUnified('ETH-PERP')).toBe('ETH/USD:USD');
    });

    test('getBaseToken extracts base token', () => {
      expect(getBaseToken('SOL/USD:USD')).toBe('SOL');
      expect(getBaseToken('BTC/USD:USD')).toBe('BTC');
      expect(getBaseToken('ETH/USD:USD')).toBe('ETH');
    });

    test('getBaseToken returns empty for invalid input', () => {
      expect(getBaseToken('')).toBe('');
    });
  });

  describe('market definitions', () => {
    test('JUPITER_MARKETS has expected markets', () => {
      expect(JUPITER_MARKETS['SOL-PERP']).toBeDefined();
      expect(JUPITER_MARKETS['ETH-PERP']).toBeDefined();
      expect(JUPITER_MARKETS['BTC-PERP']).toBeDefined();
    });

    test('SOL-PERP has correct config', () => {
      expect(JUPITER_MARKETS['SOL-PERP'].symbol).toBe('SOL/USD:USD');
      expect(JUPITER_MARKETS['SOL-PERP'].baseToken).toBe('SOL');
      expect(JUPITER_MARKETS['SOL-PERP'].maxLeverage).toBe(250);
    });

    test('all markets have required properties', () => {
      for (const market of Object.values(JUPITER_MARKETS)) {
        expect(market.symbol).toBeDefined();
        expect(market.baseToken).toBeDefined();
        expect(market.maxLeverage).toBeGreaterThan(0);
        expect(market.minPositionSize).toBeGreaterThan(0);
        expect(market.tickSize).toBeGreaterThan(0);
        expect(market.stepSize).toBeGreaterThan(0);
      }
    });
  });

  describe('token mints', () => {
    test('JUPITER_TOKEN_MINTS has expected tokens', () => {
      expect(JUPITER_TOKEN_MINTS.SOL).toBeDefined();
      expect(JUPITER_TOKEN_MINTS.ETH).toBeDefined();
      expect(JUPITER_TOKEN_MINTS.BTC).toBeDefined();
      expect(JUPITER_TOKEN_MINTS.USDC).toBeDefined();
      expect(JUPITER_TOKEN_MINTS.USDT).toBeDefined();
    });

    test('token mints are valid Solana addresses', () => {
      for (const mint of Object.values(JUPITER_TOKEN_MINTS)) {
        expect(mint.length).toBeGreaterThan(30); // Solana addresses are base58 encoded
      }
    });
  });

  describe('API URLs', () => {
    test('mainnet price API is defined', () => {
      expect(JUPITER_API_URLS.mainnet.price).toContain('jup.ag');
    });

    test('mainnet stats API is defined', () => {
      expect(JUPITER_API_URLS.mainnet.stats).toContain('jup.ag');
    });
  });

  describe('program constants', () => {
    test('JUPITER_PERPS_PROGRAM_ID is defined', () => {
      expect(JUPITER_PERPS_PROGRAM_ID).toBeDefined();
      expect(JUPITER_PERPS_PROGRAM_ID.length).toBeGreaterThan(30);
    });

    test('JLP_TOKEN_MINT is defined', () => {
      expect(JLP_TOKEN_MINT).toBeDefined();
      expect(JLP_TOKEN_MINT.length).toBeGreaterThan(30);
    });
  });

  describe('borrow fee constants', () => {
    test('JUPITER_BORROW_FEE has expected values', () => {
      expect(JUPITER_BORROW_FEE.intervalHours).toBe(1);
      expect(JUPITER_BORROW_FEE.minRate).toBe(0.0001);
      expect(JUPITER_BORROW_FEE.maxRate).toBe(0.01);
    });
  });

  describe('error messages', () => {
    test('error messages are mapped', () => {
      expect(JUPITER_ERROR_MESSAGES['insufficient collateral']).toBe('INSUFFICIENT_MARGIN');
      expect(JUPITER_ERROR_MESSAGES['insufficient balance']).toBe('INSUFFICIENT_BALANCE');
      expect(JUPITER_ERROR_MESSAGES['max leverage exceeded']).toBe('MAX_LEVERAGE_EXCEEDED');
    });
  });
});

describe('JupiterNormalizer', () => {
  let JupiterNormalizer: typeof import('../../src/adapters/jupiter/JupiterNormalizer.js').JupiterNormalizer;
  let normalizer: InstanceType<typeof JupiterNormalizer>;

  beforeAll(async () => {
    const module = await import('../../src/adapters/jupiter/JupiterNormalizer.js');
    JupiterNormalizer = module.JupiterNormalizer;
    normalizer = new JupiterNormalizer();
  });

  describe('normalizePosition', () => {
    test('normalizes long position correctly', () => {
      const mockPosition = {
        side: 'Long',
        sizeUsd: '10000',
        sizeTokens: '100',
        collateralUsd: '1000',
        price: '100',
        realizedPnl: '50',
        unrealizedPnl: '500',
        updateTime: Math.floor(Date.now() / 1000),
        openTime: Math.floor(Date.now() / 1000) - 3600,
        owner: 'owner-address',
        pool: 'pool-address',
        custody: 'custody-address',
        cumulativeInterestSnapshot: '0',
      };

      const position = normalizer.normalizePosition(
        'position-address',
        mockPosition as any,
        105, // current price
        'SOL-PERP'
      );

      expect(position.symbol).toBe('SOL/USD:USD');
      expect(position.side).toBe('long');
      expect(position.size).toBe(100);
      expect(position.entryPrice).toBe(100);
      expect(position.markPrice).toBe(105);
      expect(position.leverage).toBe(10);
      expect(position.marginMode).toBe('isolated');
      expect(position.realizedPnl).toBe(50);
    });

    test('normalizes short position correctly', () => {
      const mockPosition = {
        side: 'Short',
        sizeUsd: '5000',
        sizeTokens: '2.5',
        collateralUsd: '500',
        price: '2000',
        realizedPnl: '0',
        unrealizedPnl: '-100',
        updateTime: Math.floor(Date.now() / 1000),
        openTime: Math.floor(Date.now() / 1000) - 7200,
        owner: 'owner-address',
        pool: 'pool-address',
        custody: 'custody-address',
        cumulativeInterestSnapshot: '0',
      };

      const position = normalizer.normalizePosition(
        'position-address-2',
        mockPosition as any,
        2040, // current price
        'ETH-PERP'
      );

      expect(position.side).toBe('short');
      expect(position.size).toBe(2.5);
      expect(position.leverage).toBe(10);
    });
  });

  describe('normalizeTicker', () => {
    test('normalizes ticker with price data', () => {
      const mockPriceData = {
        price: '100.50',
        id: 'So11111111111111111111111111111111111111112',
        type: 'derivedPrice',
        extraInfo: {
          quotedPrice: {
            buyPrice: '100.45',
            sellPrice: '100.55',
          },
          confidenceLevel: 'high',
        },
      };

      const ticker = normalizer.normalizeTicker(
        'SOL-PERP',
        mockPriceData as any,
        undefined
      );

      expect(ticker.symbol).toBe('SOL/USD:USD');
      expect(ticker.last).toBe(100.5);
      expect(ticker.bid).toBe(100.45);
      expect(ticker.ask).toBe(100.55);
    });

    test('normalizes ticker without quoted price', () => {
      const mockPriceData = {
        price: '50000',
        id: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
        type: 'derivedPrice',
      };

      const ticker = normalizer.normalizeTicker(
        'BTC-PERP',
        mockPriceData as any,
        undefined
      );

      expect(ticker.symbol).toBe('BTC/USD:USD');
      expect(ticker.last).toBe(50000);
      // Uses approximate 0.05% spread when no quoted price
      expect(ticker.bid).toBeLessThan(50000);
      expect(ticker.ask).toBeGreaterThan(50000);
    });

    test('normalizes ticker with stats', () => {
      const mockPriceData = {
        price: '3000',
        id: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
        type: 'derivedPrice',
      };

      const mockStats = {
        high24h: 3100,
        low24h: 2900,
        volume24h: 10000000,
        oraclePrice: 3000,
        markPrice: 3001,
        longOpenInterest: 5000000,
        shortOpenInterest: 4000000,
      };

      const ticker = normalizer.normalizeTicker(
        'ETH-PERP',
        mockPriceData as any,
        mockStats as any
      );

      expect(ticker.high).toBe(3100);
      expect(ticker.low).toBe(2900);
      expect(ticker.quoteVolume).toBe(10000000);
    });
  });

  describe('normalizeBalance', () => {
    test('normalizes balance correctly', () => {
      const balance = normalizer.normalizeBalance('USDC', 10000, 2500);

      expect(balance.currency).toBe('USDC');
      expect(balance.total).toBe(10000);
      expect(balance.free).toBe(7500);
      expect(balance.used).toBe(2500);
    });

    test('handles zero locked amount', () => {
      const balance = normalizer.normalizeBalance('SOL', 5, 0);

      expect(balance.total).toBe(5);
      expect(balance.free).toBe(5);
      expect(balance.used).toBe(0);
    });
  });

  describe('normalizeFundingRate', () => {
    test('normalizes funding rate (borrow fee)', () => {
      const mockCustody = {
        fundingRateState: {
          hourlyBorrowRate: '0.0001',
          lastUpdate: Math.floor(Date.now() / 1000),
          cumulativeInterestRate: '1.05',
        },
        mint: 'token-mint',
        trading: { tradingEnabled: true },
        pricing: { maxLeverage: 250 },
      };

      const fundingRate = normalizer.normalizeFundingRate(
        'SOL-PERP',
        mockCustody as any,
        100
      );

      expect(fundingRate.symbol).toBe('SOL/USD:USD');
      expect(fundingRate.fundingRate).toBe(0.0001);
      expect(fundingRate.markPrice).toBe(100);
      expect(fundingRate.indexPrice).toBe(100);
      expect(fundingRate.fundingIntervalHours).toBe(1);
      expect(fundingRate.info?.isBorrowFee).toBe(true);
    });
  });

  describe('normalizeOrderBook', () => {
    test('returns empty orderbook without stats', () => {
      const orderBook = normalizer.normalizeOrderBook('SOL-PERP', 100);

      expect(orderBook.symbol).toBe('SOL/USD:USD');
      expect(orderBook.exchange).toBe('jupiter');
      expect(orderBook.bids).toHaveLength(0);
      expect(orderBook.asks).toHaveLength(0);
    });

    test('generates synthetic orderbook with pool stats', () => {
      const mockPoolStats = {
        aumUsd: 100000000, // $100M AUM
        volume24h: 50000000,
        volume7d: 300000000,
        fees24h: 100000,
        openInterest: 80000000,
        longOpenInterest: 45000000,
        shortOpenInterest: 35000000,
        jlpPrice: 1.5,
        jlpSupply: 66666666,
      };

      const orderBook = normalizer.normalizeOrderBook(
        'SOL-PERP',
        100,
        mockPoolStats as any
      );

      expect(orderBook.symbol).toBe('SOL/USD:USD');
      expect(orderBook.bids.length).toBeGreaterThan(0);
      expect(orderBook.asks.length).toBeGreaterThan(0);
      // Bids should be below current price
      expect(orderBook.bids[0][0]).toBeLessThan(100);
      // Asks should be above current price
      expect(orderBook.asks[0][0]).toBeGreaterThan(100);
    });
  });

  describe('normalizePoolStats', () => {
    test('normalizes pool stats correctly', () => {
      const mockStats = {
        aumUsd: 100000000,
        volume24h: 50000000,
        volume7d: 300000000,
        fees24h: 100000,
        openInterest: 80000000,
        longOpenInterest: 45000000,
        shortOpenInterest: 35000000,
        jlpPrice: 1.5,
        jlpSupply: 66666666,
      };

      const normalized = normalizer.normalizePoolStats(mockStats as any);

      expect(normalized.aumUsd).toBe(100000000);
      expect(normalized.volume24h).toBe(50000000);
      expect(normalized.jlpPrice).toBe(1.5);
    });
  });

  describe('normalizeMarket', () => {
    test('normalizes market correctly', () => {
      const mockCustody = {
        mint: 'So11111111111111111111111111111111111111112',
        trading: { tradingEnabled: true },
        pricing: {
          maxLeverage: 250,
          maxPositionLockedUsd: 10000000,
          maxUtilization: 0.8,
        },
        oracle: {
          oracleAccount: 'oracle-address',
        },
        isStable: false,
      };

      const mockPool = {
        name: 'JLP',
        fees: {
          openPositionFee: 6, // 0.06%
          closePositionFee: 6,
        },
      };

      const market = normalizer.normalizeMarket(
        'SOL-PERP',
        mockCustody as any,
        mockPool as any
      );

      expect(market.id).toBe('SOL-PERP');
      expect(market.symbol).toBe('SOL/USD:USD');
      expect(market.base).toBe('SOL');
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('USD');
      expect(market.active).toBe(true);
      expect(market.maxLeverage).toBe(250);
      expect(market.makerFee).toBe(0.0006);
      expect(market.takerFee).toBe(0.0006);
    });

    test('normalizes inactive market', () => {
      const mockCustody = {
        mint: 'token-mint',
        trading: { tradingEnabled: false },
        pricing: {
          maxLeverage: 100,
          maxPositionLockedUsd: 5000000,
          maxUtilization: 0.5,
        },
        oracle: {
          oracleAccount: 'oracle-address',
        },
        isStable: false,
      };

      const mockPool = {
        name: 'JLP',
        fees: {
          openPositionFee: 10,
          closePositionFee: 10,
        },
      };

      const market = normalizer.normalizeMarket(
        'ETH-PERP',
        mockCustody as any,
        mockPool as any
      );

      expect(market.active).toBe(false);
    });
  });

  describe('normalizePositionInternal', () => {
    test('normalizes internal position format', () => {
      const mockPosition = {
        side: 'Long',
        sizeUsd: '20000',
        sizeTokens: '0.4',
        collateralUsd: '2000',
        price: '50000',
        realizedPnl: '100',
        unrealizedPnl: '1000',
        updateTime: Math.floor(Date.now() / 1000),
        openTime: Math.floor(Date.now() / 1000) - 3600,
        owner: 'owner-address',
        pool: 'pool-address',
        custody: 'custody-address',
        cumulativeInterestSnapshot: '0',
      };

      const position = normalizer.normalizePositionInternal(
        'position-address',
        mockPosition as any,
        52000,
        'BTC-PERP'
      );

      expect(position.id).toBe('position-address');
      expect(position.owner).toBe('owner-address');
      expect(position.symbol).toBe('BTC/USD:USD');
      expect(position.side).toBe('long');
      expect(position.size).toBe(0.4);
      expect(position.sizeUsd).toBe(20000);
      expect(position.entryPrice).toBe(50000);
      expect(position.markPrice).toBe(52000);
      expect(position.leverage).toBe(10);
    });
  });
});

/**
 * Drift Adapter HTTP Coverage Tests
 *
 * Additional tests focusing on HTTP-based methods to boost coverage to 50%+.
 * Tests initialize(), fetchMarkets(), fetchTicker(), fetchOrderBook(),
 * fetchFundingRate(), fetchPositions(), fetchBalance(), fetchOpenOrders().
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { DriftAdapter } from '../../src/adapters/drift/DriftAdapter.js';

describe('DriftAdapter HTTP Coverage', () => {
  const originalFetch = global.fetch;
  let adapter: DriftAdapter;

  beforeEach(() => {
    global.fetch = jest.fn() as jest.Mock;
  });

  afterEach(async () => {
    if (adapter) {
      await adapter.disconnect();
    }
    global.fetch = originalFetch;
  });

  describe('initialize with HTTP', () => {
    test('should initialize successfully with valid API response', async () => {
      adapter = new DriftAdapter();

      // Mock DLOB orderbook API call for validation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          marketIndex: 0,
          marketType: 'perp',
          slot: 123456,
          oraclePrice: '100000000',
          bids: [{ price: '99500000', size: '1000000000' }],
          asks: [{ price: '100500000', size: '1500000000' }],
        }),
      });

      await adapter.initialize();
      expect(adapter.isReady).toBe(true);
    });

    test('should map API errors during initialization', async () => {
      adapter = new DriftAdapter();

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(adapter.initialize()).rejects.toThrow();
    });

    test('should skip initialization if already ready', async () => {
      adapter = new DriftAdapter();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          marketIndex: 0,
          marketType: 'perp',
          slot: 123456,
          oraclePrice: '100000000',
          bids: [],
          asks: [],
        }),
      });

      await adapter.initialize();
      const firstCallCount = (global.fetch as jest.Mock).mock.calls.length;

      await adapter.initialize(); // Should skip
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(firstCallCount);
    });
  });

  describe('fetchMarkets with dynamic discovery', () => {
    beforeEach(async () => {
      adapter = new DriftAdapter();

      // Initialize
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          marketIndex: 0,
          marketType: 'perp',
          slot: 123456,
          oraclePrice: '100000000',
          bids: [],
          asks: [],
        }),
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();
    });

    test('should discover markets dynamically from DLOB', async () => {
      // Mock successful probes for market indices 0, 1, 2
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            marketName: 'SOL-PERP',
            marketIndex: 0,
            marketType: 'perp',
            slot: 123456,
            oraclePrice: '100000000',
            bids: [],
            asks: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            marketName: 'BTC-PERP',
            marketIndex: 1,
            marketType: 'perp',
            slot: 123456,
            oraclePrice: '50000000000',
            bids: [],
            asks: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            marketName: 'ETH-PERP',
            marketIndex: 2,
            marketType: 'perp',
            slot: 123456,
            oraclePrice: '3000000000',
            bids: [],
            asks: [],
          }),
        });

      // Mock remaining probes as failures
      for (let i = 3; i < 50; i++) {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Market not found'));
      }

      const markets = await adapter.fetchMarkets();
      expect(markets.length).toBeGreaterThanOrEqual(3);
      expect(markets.some(m => m.symbol === 'SOL/USD:USD')).toBe(true);
    });

    test('should fallback to hardcoded markets if discovery fails', async () => {
      // Mock all probes failing
      for (let i = 0; i < 50; i++) {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API down'));
      }

      const markets = await adapter.fetchMarkets();
      expect(markets.length).toBeGreaterThan(0);
      expect(markets[0]!.symbol).toBe('SOL/USD:USD'); // From constants
    });

    test('should filter markets by active param', async () => {
      // Mock discovery returning one disabled market
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          marketName: 'SOL-PERP',
          marketIndex: 0,
          marketType: 'perp',
          slot: 123456,
          oraclePrice: '100000000',
          bids: [],
          asks: [],
        }),
      });

      for (let i = 1; i < 50; i++) {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
      }

      const markets = await adapter.fetchMarkets({ active: true });
      expect(markets.every(m => m.active)).toBe(true);
    });

    test('should filter markets by ids', async () => {
      // Use fallback to constants
      for (let i = 0; i < 50; i++) {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
      }

      const markets = await adapter.fetchMarkets({ ids: ['SOL-PERP'] });
      expect(markets).toHaveLength(1);
      expect(markets[0]!.id).toBe('SOL-PERP');
    });
  });

  describe('fetchTicker with HTTP', () => {
    beforeEach(async () => {
      adapter = new DriftAdapter();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          marketIndex: 0,
          marketType: 'perp',
          slot: 123456,
          oraclePrice: '100000000',
          bids: [],
          asks: [],
        }),
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();
    });

    test('should fetch ticker with orderbook data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          marketIndex: 0,
          marketType: 'perp',
          slot: 123456,
          oraclePrice: '100000000', // 100
          bids: [{ price: '99500000', size: '1000000000' }],
          asks: [{ price: '100500000', size: '1500000000' }],
        }),
      });

      const ticker = await adapter.fetchTicker('SOL/USD:USD');
      expect(ticker.symbol).toBe('SOL/USD:USD');
      expect(ticker.bid).toBeCloseTo(99.5, 1);
      expect(ticker.ask).toBeCloseTo(100.5, 1);
      expect(ticker.last).toBeGreaterThan(0);
    });

    test('should throw for invalid market', async () => {
      await expect(adapter.fetchTicker('INVALID/USD:USD')).rejects.toThrow(/Invalid market/);
    });

    test('should handle missing bids/asks gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          marketIndex: 0,
          marketType: 'perp',
          slot: 123456,
          oraclePrice: '100000000',
          bids: [],
          asks: [],
        }),
      });

      const ticker = await adapter.fetchTicker('SOL/USD:USD');
      expect(ticker.symbol).toBe('SOL/USD:USD');
      expect(ticker.bid).toBeCloseTo(99.9, 1); // Fallback: oraclePrice * 0.999
      expect(ticker.ask).toBeCloseTo(100.1, 1); // Fallback: oraclePrice * 1.001
    });

    test('should map HTTP errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Timeout'));

      await expect(adapter.fetchTicker('SOL/USD:USD')).rejects.toThrow();
    });
  });

  describe('fetchOrderBook with HTTP', () => {
    beforeEach(async () => {
      adapter = new DriftAdapter();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          marketIndex: 0,
          marketType: 'perp',
          slot: 123456,
          oraclePrice: '100000000',
          bids: [],
          asks: [],
        }),
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();
    });

    test('should fetch orderbook with depth', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          marketIndex: 0,
          marketType: 'perp',
          slot: 123456,
          oraclePrice: '100000000',
          bids: [
            { price: '99500000', size: '1000000000' },
            { price: '99000000', size: '2000000000' },
          ],
          asks: [
            { price: '100500000', size: '1500000000' },
            { price: '101000000', size: '3000000000' },
          ],
        }),
      });

      const orderbook = await adapter.fetchOrderBook('SOL/USD:USD', { limit: 20 });
      expect(orderbook.symbol).toBe('SOL/USD:USD');
      expect(orderbook.bids).toHaveLength(2);
      expect(orderbook.asks).toHaveLength(2);
      expect(orderbook.bids[0]![0]).toBeCloseTo(99.5, 1);
      expect(orderbook.asks[0]![0]).toBeCloseTo(100.5, 1);
    });

    test('should throw for invalid market', async () => {
      await expect(adapter.fetchOrderBook('INVALID/USD:USD')).rejects.toThrow(/Invalid market/);
    });

    test('should use default depth if not specified', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          marketIndex: 0,
          marketType: 'perp',
          slot: 123456,
          oraclePrice: '100000000',
          bids: [],
          asks: [],
        }),
      });

      const orderbook = await adapter.fetchOrderBook('SOL/USD:USD');
      expect(orderbook).toBeDefined();
    });
  });

  describe('fetchFundingRate with HTTP', () => {
    beforeEach(async () => {
      adapter = new DriftAdapter();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          marketIndex: 0,
          marketType: 'perp',
          slot: 123456,
          oraclePrice: '100000000',
          bids: [],
          asks: [],
        }),
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();
    });

    test('should fetch funding rate from data API', async () => {
      // Mock global.fetch for the request method
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fundingRates: [
            {
              recordId: '1',
              marketIndex: 0,
              ts: 1704067200,
              fundingRate: '100000',
              fundingRateLong: '100000',
              fundingRateShort: '-100000',
              cumulativeFundingRateLong: '1000000',
              cumulativeFundingRateShort: '-1000000',
              oraclePriceTwap: '100000000',
              markPriceTwap: '100500000',
              periodRevenue: '0',
              baseAssetAmountWithAmm: '0',
              baseAssetAmountWithUnsettledLp: '0',
            },
          ],
        }),
      });

      const fundingRate = await adapter.fetchFundingRate('SOL/USD:USD');
      expect(fundingRate.symbol).toBe('SOL/USD:USD');
      expect(fundingRate.fundingRate).toBeDefined();
      expect(fundingRate.fundingIntervalHours).toBe(1);
    });

    test('should throw for invalid market', async () => {
      await expect(adapter.fetchFundingRate('INVALID/USD:USD')).rejects.toThrow(/Invalid market/);
    });

    test('should throw when no funding rate data available', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fundingRates: [],
        }),
      });

      // Error gets mapped to generic error by mapDriftError
      await expect(adapter.fetchFundingRate('SOL/USD:USD')).rejects.toThrow();
    });
  });

  describe('fetchFundingRateHistory with HTTP', () => {
    beforeEach(async () => {
      adapter = new DriftAdapter();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          marketIndex: 0,
          marketType: 'perp',
          slot: 123456,
          oraclePrice: '100000000',
          bids: [],
          asks: [],
        }),
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();
    });

    test('should fetch funding rate history', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fundingRates: [
            {
              recordId: '1',
              marketIndex: 0,
              ts: 1704067200,
              fundingRate: '100000',
              fundingRateLong: '100000',
              fundingRateShort: '-100000',
              cumulativeFundingRateLong: '1000000',
              cumulativeFundingRateShort: '-1000000',
              oraclePriceTwap: '100000000',
              markPriceTwap: '100500000',
              periodRevenue: '0',
              baseAssetAmountWithAmm: '0',
              baseAssetAmountWithUnsettledLp: '0',
            },
            {
              recordId: '2',
              marketIndex: 0,
              ts: 1704063600,
              fundingRate: '50000',
              fundingRateLong: '50000',
              fundingRateShort: '-50000',
              cumulativeFundingRateLong: '900000',
              cumulativeFundingRateShort: '-900000',
              oraclePriceTwap: '99500000',
              markPriceTwap: '99700000',
              periodRevenue: '0',
              baseAssetAmountWithAmm: '0',
              baseAssetAmountWithUnsettledLp: '0',
            },
          ],
        }),
      });

      const history = await adapter.fetchFundingRateHistory('SOL/USD:USD', undefined, 10);
      expect(history).toHaveLength(2);
      expect(history[0]!.symbol).toBe('SOL/USD:USD');
    });
  });

  describe('fetchPositions with HTTP', () => {
    beforeEach(async () => {
      adapter = new DriftAdapter({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          marketIndex: 0,
          marketType: 'perp',
          slot: 123456,
          oraclePrice: '100000000',
          bids: [],
          asks: [],
        }),
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();
    });

    test('should fetch positions with oracle prices', async () => {
      // First call: user data
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          perpPositions: [
            {
              marketIndex: 0,
              baseAssetAmount: '1000000000', // 1 SOL
              quoteAssetAmount: '100000000',
              quoteEntryAmount: '95000000',
              quoteBreakEvenAmount: '95000000',
              settledPnl: '5000000',
              lpShares: '0',
              openOrders: 0,
            },
          ],
        }),
      });

      // Second call: orderbook for market price
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          marketIndex: 0,
          marketType: 'perp',
          slot: 123456,
          oraclePrice: '100000000',
          bids: [],
          asks: [],
        }),
      });

      const positions = await adapter.fetchPositions();
      expect(positions).toHaveLength(1);
      expect(positions[0]!.symbol).toBe('SOL/USD:USD');
      expect(positions[0]!.size).toBeCloseTo(1, 1);
    });

    test('should filter positions by symbols', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          perpPositions: [
            {
              marketIndex: 0,
              baseAssetAmount: '1000000000',
              quoteAssetAmount: '100000000',
              quoteEntryAmount: '95000000',
              quoteBreakEvenAmount: '95000000',
              settledPnl: '0',
              lpShares: '0',
              openOrders: 0,
            },
            {
              marketIndex: 1,
              baseAssetAmount: '100000000',
              quoteAssetAmount: '5000000000',
              quoteEntryAmount: '4900000000',
              quoteBreakEvenAmount: '4900000000',
              settledPnl: '0',
              lpShares: '0',
              openOrders: 0,
            },
          ],
        }),
      });

      // Mock orderbook calls for both positions
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            marketIndex: 0,
            oraclePrice: '100000000',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            marketIndex: 1,
            oraclePrice: '50000000000',
          }),
        });

      const positions = await adapter.fetchPositions(['SOL/USD:USD']);
      expect(positions).toHaveLength(1);
      expect(positions[0]!.symbol).toBe('SOL/USD:USD');
    });
  });

  describe('fetchBalance with HTTP', () => {
    beforeEach(async () => {
      adapter = new DriftAdapter({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          marketIndex: 0,
          marketType: 'perp',
          slot: 123456,
          oraclePrice: '100000000',
          bids: [],
          asks: [],
        }),
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();
    });

    test('should fetch USDC balance', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          spotPositions: [
            {
              marketIndex: 0,
              scaledBalance: '10000000000',
              balanceType: 'deposit',
              cumulativeDeposits: '10000000000',
              openOrders: 0,
            },
          ],
          totalCollateral: '10000000000',
          freeCollateral: '5000000000',
        }),
      });

      const balances = await adapter.fetchBalance();
      expect(balances).toHaveLength(1);
      expect(balances[0]!.currency).toBe('USDC');
      expect(balances[0]!.total).toBeCloseTo(10000, 1);
      expect(balances[0]!.free).toBeCloseTo(5000, 1);
    });

    test('should return empty array when no spot positions', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          spotPositions: [],
          totalCollateral: '0',
          freeCollateral: '0',
        }),
      });

      const balances = await adapter.fetchBalance();
      expect(balances).toHaveLength(0);
    });
  });

  describe('fetchOpenOrders with HTTP', () => {
    beforeEach(async () => {
      adapter = new DriftAdapter({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          marketIndex: 0,
          marketType: 'perp',
          slot: 123456,
          oraclePrice: '100000000',
          bids: [],
          asks: [],
        }),
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();
    });

    test('should fetch open orders', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orders: [
            {
              orderId: 123,
              userOrderId: 1,
              marketIndex: 0,
              marketType: 'perp',
              orderType: 'limit',
              direction: 'long',
              baseAssetAmount: '1000000000',
              baseAssetAmountFilled: '0',
              quoteAssetAmountFilled: '0',
              price: '100000000',
              status: 'open',
              reduceOnly: false,
              triggerPrice: '0',
              triggerCondition: 'above',
              postOnly: 'none',
              immediateOrCancel: false,
              slot: 123456,
              maxTs: '0',
              oraclePriceOffset: 0,
              auctionDuration: 0,
              auctionStartPrice: '0',
              auctionEndPrice: '0',
              existingPositionDirection: 'long',
            },
          ],
        }),
      });

      const orders = await adapter.fetchOpenOrders();
      expect(orders).toHaveLength(1);
      expect(orders[0]!.symbol).toBe('SOL/USD:USD');
      expect(orders[0]!.type).toBe('limit');
      expect(orders[0]!.side).toBe('buy');
    });

    test('should filter orders by symbol', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orders: [
            {
              orderId: 123,
              userOrderId: 1,
              marketIndex: 0,
              marketType: 'perp',
              orderType: 'limit',
              direction: 'long',
              baseAssetAmount: '1000000000',
              baseAssetAmountFilled: '0',
              quoteAssetAmountFilled: '0',
              price: '100000000',
              status: 'open',
              reduceOnly: false,
              triggerPrice: '0',
              triggerCondition: 'above',
              postOnly: 'none',
              immediateOrCancel: false,
              slot: 123456,
              maxTs: '0',
              oraclePriceOffset: 0,
              auctionDuration: 0,
              auctionStartPrice: '0',
              auctionEndPrice: '0',
              existingPositionDirection: 'long',
            },
            {
              orderId: 124,
              userOrderId: 2,
              marketIndex: 1,
              marketType: 'perp',
              orderType: 'market',
              direction: 'short',
              baseAssetAmount: '100000000',
              baseAssetAmountFilled: '0',
              quoteAssetAmountFilled: '0',
              price: '0',
              status: 'open',
              reduceOnly: false,
              triggerPrice: '0',
              triggerCondition: 'above',
              postOnly: 'none',
              immediateOrCancel: false,
              slot: 123457,
              maxTs: '0',
              oraclePriceOffset: 0,
              auctionDuration: 0,
              auctionStartPrice: '0',
              auctionEndPrice: '0',
              existingPositionDirection: 'long',
            },
          ],
        }),
      });

      const orders = await adapter.fetchOpenOrders('SOL/USD:USD');
      expect(orders).toHaveLength(1);
      expect(orders[0]!.symbol).toBe('SOL/USD:USD');
    });

    test('should filter perp orders from spot orders', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orders: [
            {
              orderId: 123,
              userOrderId: 1,
              marketIndex: 0,
              marketType: 'spot',
              orderType: 'limit',
              direction: 'long',
              baseAssetAmount: '1000000000',
              baseAssetAmountFilled: '0',
              quoteAssetAmountFilled: '0',
              price: '100000000',
              status: 'open',
              reduceOnly: false,
              triggerPrice: '0',
              triggerCondition: 'above',
              postOnly: 'none',
              immediateOrCancel: false,
              slot: 123456,
              maxTs: '0',
              oraclePriceOffset: 0,
              auctionDuration: 0,
              auctionStartPrice: '0',
              auctionEndPrice: '0',
              existingPositionDirection: 'long',
            },
          ],
        }),
      });

      const orders = await adapter.fetchOpenOrders();
      expect(orders).toHaveLength(0); // Spot orders filtered out
    });
  });
});

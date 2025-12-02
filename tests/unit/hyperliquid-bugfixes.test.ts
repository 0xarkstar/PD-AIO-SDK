/**
 * Hyperliquid Bug Fixes Unit Tests
 *
 * Tests for Phase 0 critical bug fixes:
 * 1. fetchUserFees() - Fixed type mismatch with userCrossRate/userAddRate
 * 2. fetchPortfolio() - Fixed array structure vs object structure
 * 3. fetchRateLimitStatus() - Fixed nRequestsUsed/nRequestsCap fields
 */

import { HyperliquidAdapter } from '../../src/adapters/hyperliquid/HyperliquidAdapter.js';
import type {
  HyperliquidUserFees,
  HyperliquidPortfolio,
  HyperliquidUserRateLimit,
} from '../../src/adapters/hyperliquid/types.js';
import { Wallet } from 'ethers';

// Mock global fetch
global.fetch = jest.fn();

describe('Hyperliquid Bug Fixes - Phase 0', () => {
  let adapter: HyperliquidAdapter;
  let mockWallet: Wallet;

  beforeEach(async () => {
    mockWallet = Wallet.createRandom();
    adapter = new HyperliquidAdapter({
      testnet: true,
      wallet: mockWallet,
    });
    await adapter.initialize();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await adapter.disconnect();
  });

  describe('Bug 1: fetchUserFees() - Type Mismatch Fix', () => {
    test('correctly parses userCrossRate and userAddRate from API response', async () => {
      // Mock the actual API response structure
      const mockResponse: HyperliquidUserFees = {
        userCrossRate: '0.000315', // Taker fee (0.0315%)
        userAddRate: '0.000105', // Maker fee (0.0105%)
        userSpotCrossRate: '0.0002',
        userSpotAddRate: '0.0001',
        activeReferralDiscount: '0',
        dailyUserVlm: [
          {
            date: '2025-12-01',
            userCross: '1000.0',
            userAdd: '500.0',
            exchange: 'Hyperliquid',
          },
        ],
        feeSchedule: {
          cross: '0.00035',
          add: '0.00015',
          spotCross: '0.0002',
          spotAdd: '0.0001',
          tiers: [
            {
              tier: 1,
              vlm: '0',
              crossRate: '0.00035',
              addRate: '0.00015',
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const fees = await adapter.fetchUserFees();

      expect(fees).toEqual({
        maker: 0.000105,
        taker: 0.000315,
        info: mockResponse,
      });
    });

    test('handles zero fee rates correctly', async () => {
      const mockResponse: HyperliquidUserFees = {
        userCrossRate: '0',
        userAddRate: '0',
        userSpotCrossRate: '0',
        userSpotAddRate: '0',
        activeReferralDiscount: '0',
        dailyUserVlm: [],
        feeSchedule: {
          cross: '0',
          add: '0',
          spotCross: '0',
          spotAdd: '0',
          tiers: [],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const fees = await adapter.fetchUserFees();

      expect(fees.maker).toBe(0);
      expect(fees.taker).toBe(0);
    });
  });

  describe('Bug 2: fetchPortfolio() - Array Structure Fix', () => {
    test('correctly parses array of portfolio periods', async () => {
      // Mock the actual API response structure (array of tuples)
      const mockResponse: HyperliquidPortfolio = [
        [
          'day',
          {
            accountValueHistory: [
              [1733097600000, '10000.5'],
              [1733184000000, '10250.75'],
            ],
            pnlHistory: [
              [1733097600000, '0'],
              [1733184000000, '250.25'],
            ],
            vlm: '5000.0',
          },
        ],
        [
          'week',
          {
            accountValueHistory: [[1733097600000, '10000.5']],
            pnlHistory: [[1733097600000, '500.0']],
            vlm: '25000.0',
          },
        ],
        [
          'month',
          {
            accountValueHistory: [[1733097600000, '10000.5']],
            pnlHistory: [[1733097600000, '1000.0']],
            vlm: '100000.0',
          },
        ],
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const portfolio = await adapter.fetchPortfolio();

      expect(portfolio.totalValue).toBeCloseTo(10250.75);
      expect(portfolio.dailyPnl).toBeCloseTo(250.25);
      expect(portfolio.dailyPnlPercentage).toBeCloseTo(2.44, 1);
      expect(portfolio.weeklyPnl).toBeCloseTo(500.0);
      expect(portfolio.monthlyPnl).toBeCloseTo(1000.0);
    });

    test('handles empty history arrays', async () => {
      const mockResponse: HyperliquidPortfolio = [
        [
          'day',
          {
            accountValueHistory: [],
            pnlHistory: [],
            vlm: '0',
          },
        ],
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const portfolio = await adapter.fetchPortfolio();

      expect(portfolio.totalValue).toBe(0);
      expect(portfolio.dailyPnl).toBe(0);
      expect(portfolio.dailyPnlPercentage).toBe(0);
    });

    test('throws error when day period is missing', async () => {
      const mockResponse: HyperliquidPortfolio = [
        [
          'week',
          {
            accountValueHistory: [[1733097600000, '10000']],
            pnlHistory: [[1733097600000, '100']],
            vlm: '1000',
          },
        ],
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(adapter.fetchPortfolio()).rejects.toThrow(
        'Day period data not found in portfolio response'
      );
    });

    test('handles missing week and month periods', async () => {
      const mockResponse: HyperliquidPortfolio = [
        [
          'day',
          {
            accountValueHistory: [[1733184000000, '10000']],
            pnlHistory: [[1733184000000, '100']],
            vlm: '1000',
          },
        ],
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const portfolio = await adapter.fetchPortfolio();

      expect(portfolio.totalValue).toBeCloseTo(10000);
      expect(portfolio.dailyPnl).toBeCloseTo(100);
      expect(portfolio.weeklyPnl).toBe(0);
      expect(portfolio.monthlyPnl).toBe(0);
    });
  });

  describe('Bug 3: fetchRateLimitStatus() - Field Name Fix', () => {
    test('correctly parses nRequestsUsed and nRequestsCap', async () => {
      const mockResponse: HyperliquidUserRateLimit = {
        cumVlm: '2854574.593578',
        nRequestsUsed: 2890,
        nRequestsCap: 2864574,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const rateLimit = await adapter.fetchRateLimitStatus();

      expect(rateLimit.remaining).toBe(2864574 - 2890);
      expect(rateLimit.limit).toBe(2864574);
      expect(rateLimit.percentUsed).toBeCloseTo(0.1, 1);
      expect(rateLimit.resetAt).toBeGreaterThan(Date.now());
      expect(rateLimit.resetAt).toBeLessThan(Date.now() + 61000); // Within 61 seconds
    });

    test('handles zero usage correctly', async () => {
      const mockResponse: HyperliquidUserRateLimit = {
        cumVlm: '0',
        nRequestsUsed: 0,
        nRequestsCap: 1200000,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const rateLimit = await adapter.fetchRateLimitStatus();

      expect(rateLimit.remaining).toBe(1200000);
      expect(rateLimit.limit).toBe(1200000);
      expect(rateLimit.percentUsed).toBe(0);
    });

    test('handles near-limit usage', async () => {
      const mockResponse: HyperliquidUserRateLimit = {
        cumVlm: '1000000',
        nRequestsUsed: 1199000,
        nRequestsCap: 1200000,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const rateLimit = await adapter.fetchRateLimitStatus();

      expect(rateLimit.remaining).toBe(1000);
      expect(rateLimit.limit).toBe(1200000);
      expect(rateLimit.percentUsed).toBeCloseTo(99.92, 1);
    });

    test('includes optional nRequestsSurplus field', async () => {
      const mockResponse: HyperliquidUserRateLimit = {
        cumVlm: '5000000',
        nRequestsUsed: 500,
        nRequestsCap: 3000000,
        nRequestsSurplus: 100,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const rateLimit = await adapter.fetchRateLimitStatus();

      expect(rateLimit.remaining).toBe(3000000 - 500);
      expect(rateLimit.info).toHaveProperty('nRequestsSurplus', 100);
    });
  });

  describe('Integration: All Three Methods Work Together', () => {
    test('all methods execute without type errors', async () => {
      // Mock all three responses
      const mockFees: HyperliquidUserFees = {
        userCrossRate: '0.0003',
        userAddRate: '0.0001',
        userSpotCrossRate: '0.0002',
        userSpotAddRate: '0.0001',
        activeReferralDiscount: '0',
        dailyUserVlm: [],
        feeSchedule: {
          cross: '0.0003',
          add: '0.0001',
          spotCross: '0.0002',
          spotAdd: '0.0001',
          tiers: [],
        },
      };

      const mockPortfolio: HyperliquidPortfolio = [
        [
          'day',
          {
            accountValueHistory: [[Date.now(), '5000']],
            pnlHistory: [[Date.now(), '50']],
            vlm: '1000',
          },
        ],
      ];

      const mockRateLimit: HyperliquidUserRateLimit = {
        cumVlm: '1000',
        nRequestsUsed: 100,
        nRequestsCap: 1200,
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockFees })
        .mockResolvedValueOnce({ ok: true, json: async () => mockPortfolio })
        .mockResolvedValueOnce({ ok: true, json: async () => mockRateLimit });

      // Execute all three methods
      const fees = await adapter.fetchUserFees();
      const portfolio = await adapter.fetchPortfolio();
      const rateLimit = await adapter.fetchRateLimitStatus();

      // Verify all returned valid data
      expect(fees.maker).toBeDefined();
      expect(fees.taker).toBeDefined();
      expect(portfolio.totalValue).toBeDefined();
      expect(rateLimit.remaining).toBeDefined();
    });
  });
});

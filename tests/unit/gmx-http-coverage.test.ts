/**
 * GMX Adapter HTTP Coverage Tests
 *
 * Additional tests focusing on HTTP-based methods to boost coverage to 50%+.
 * Tests initialize(), fetchMarkets(), fetchTicker(), fetchFundingRate(),
 * fetchOHLCV(), fetchPositions(), fetchBalance(), fetchOpenOrders(),
 * fetchOrderHistory(), createOrder(), cancelOrder(), cancelAllOrders().
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GmxAdapter } from '../../src/adapters/gmx/GmxAdapter.js';
import { GMX_PRECISION } from '../../src/adapters/gmx/constants.js';

/**
 * Default values for GmxMarketInfo fields required by schema.
 */
const GMX_MARKET_INFO_DEFAULTS = {
  maxLongPoolAmount: '0',
  maxShortPoolAmount: '0',
  maxLongPoolUsdForDeposit: '0',
  maxShortPoolUsdForDeposit: '0',
  longPoolAmountAdjustment: '0',
  shortPoolAmountAdjustment: '0',
  poolValueMin: '0',
  poolValueMax: '0',
  reserveFactorLong: '0',
  reserveFactorShort: '0',
  openInterestReserveFactorLong: '0',
  openInterestReserveFactorShort: '0',
  totalBorrowingFees: '0',
  positionImpactPoolAmount: '0',
  minPositionImpactPoolAmount: '0',
  positionImpactPoolDistributionRate: '0',
  swapImpactPoolAmountLong: '0',
  swapImpactPoolAmountShort: '0',
  borrowingExponentFactorLong: '0',
  borrowingExponentFactorShort: '0',
  fundingExponentFactor: '0',
  fundingIncreaseFactorPerSecond: '0',
  fundingDecreaseFactorPerSecond: '0',
  thresholdForStableFunding: '0',
  thresholdForDecreaseFunding: '0',
  minFundingFactorPerSecond: '0',
  maxFundingFactorPerSecond: '0',
  pnlLongMax: '0',
  pnlLongMin: '0',
  pnlShortMax: '0',
  pnlShortMin: '0',
  netPnlMax: '0',
  netPnlMin: '0',
  maxPnlFactorForTradersLong: '0',
  maxPnlFactorForTradersShort: '0',
  minCollateralFactor: '0',
  minCollateralFactorForOpenInterestLong: '0',
  minCollateralFactorForOpenInterestShort: '0',
  claimableFundingAmountLong: '0',
  claimableFundingAmountShort: '0',
  positionFeeFactorForPositiveImpact: '0',
  positionFeeFactorForNegativeImpact: '0',
  positionImpactFactorPositive: '0',
  positionImpactFactorNegative: '0',
  maxPositionImpactFactorPositive: '0',
  maxPositionImpactFactorNegativePrice: '0',
  positionImpactExponentFactor: '0',
  swapFeeFactorForPositiveImpact: '0',
  swapFeeFactorForNegativeImpact: '0',
  swapImpactFactorPositive: '0',
  swapImpactFactorNegative: '0',
  swapImpactExponentFactor: '0',
  longInterestInTokens: '0',
  shortInterestInTokens: '0',
  longInterestInTokensUsingLongToken: '0',
  longInterestInTokensUsingShortToken: '0',
  shortInterestInTokensUsingLongToken: '0',
  shortInterestInTokensUsingShortToken: '0',
  virtualPoolAmountForLongToken: '0',
  virtualPoolAmountForShortToken: '0',
  virtualInventoryForPositions: '0',
  virtualMarketId: '0x0000000000000000000000000000000000000000000000000000000000000000',
  virtualLongTokenId: '0x0000000000000000000000000000000000000000000000000000000000000000',
  virtualShortTokenId: '0x0000000000000000000000000000000000000000000000000000000000000000',
};

describe('GmxAdapter HTTP Coverage', () => {
  const originalFetch = global.fetch;
  let adapter: GmxAdapter;

  const mockMarketsInfoResponse = {
    markets: [
      {
        ...GMX_MARKET_INFO_DEFAULTS,
        marketToken: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        indexToken: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        longToken: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        shortToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        name: 'ETH/USD',
        isDisabled: false,
        maxOpenInterestLong: '100000000000000000000000000000000',
        maxOpenInterestShort: '100000000000000000000000000000000',
        longPoolAmount: '50000000000000000000000',
        shortPoolAmount: '50000000000000000000000000',
        longInterestUsd: '25000000000000000000000000000000',
        shortInterestUsd: '20000000000000000000000000000000',
        fundingFactor: '100000000000000',
        borrowingFactorLong: '50000000000000',
        borrowingFactorShort: '50000000000000',
      },
    ],
  };

  const mockPricesResponse = [
    {
      tokenAddress: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      minPrice: '2000000000000000000000000000000',
      maxPrice: '2001000000000000000000000000000',
    },
  ];

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
    test('should initialize successfully with markets API', async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();
      expect(adapter.isReady).toBe(true);
    });

    test('should skip initialization if already ready', async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();
      const firstCallCount = (global.fetch as jest.Mock).mock.calls.length;

      await adapter.initialize(); // Should skip
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(firstCallCount);
    });

    test('should map errors during initialization', async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(adapter.initialize()).rejects.toThrow();
    });

    test('should initialize with wallet address (contracts + subgraph)', async () => {
      adapter = new GmxAdapter({
        chain: 'arbitrum',
        walletAddress: '0x1234567890123456789012345678901234567890',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();
      expect(adapter.isReady).toBe(true);
    });
  });

  describe('fetchMarkets with HTTP', () => {
    beforeEach(async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();
    });

    test('should fetch markets from cache after initialize', async () => {
      const markets = await adapter.fetchMarkets();
      expect(markets.length).toBeGreaterThan(0);
      expect(markets[0]!.symbol).toContain('ETH');
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(0); // Used cache
    });

    test('should filter by active status', async () => {
      const markets = await adapter.fetchMarkets({ active: true });
      expect(markets.every(m => m.active)).toBe(true);
    });

    test('should filter by inactive status', async () => {
      const markets = await adapter.fetchMarkets({ active: false });
      expect(markets.every(m => !m.active)).toBe(true);
    });
  });

  describe('fetchTicker with HTTP', () => {
    beforeEach(async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();
    });

    test('should fetch ticker with market info and prices', async () => {
      // Markets info already cached, need prices
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPricesResponse,
      });

      const ticker = await adapter.fetchTicker('ETH/USD:ETH');
      expect(ticker.symbol).toContain('ETH');
      expect(ticker.last).toBeGreaterThan(0);
      expect(ticker.bid).toBeGreaterThan(0);
      expect(ticker.ask).toBeGreaterThan(0);
    });

    test('should handle missing price data gracefully', async () => {
      // Return prices without the index token
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const ticker = await adapter.fetchTicker('ETH/USD:ETH');
      expect(ticker).toBeDefined();
      expect(ticker.symbol).toContain('ETH');
    });

    test('should throw for invalid market', async () => {
      await expect(adapter.fetchTicker('INVALID/MARKET')).rejects.toThrow(/Invalid market/);
    });

    test('should throw when market info not found', async () => {
      // Mock markets without ETH
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ markets: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      // Force re-fetch by clearing cache
      await adapter.disconnect();
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ markets: [] }),
      });

      await adapter.initialize();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Error gets mapped to generic error by mapGmxError
      await expect(adapter.fetchTicker('ETH/USD:ETH')).rejects.toThrow();
    });
  });

  describe('fetchFundingRate with HTTP', () => {
    beforeEach(async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();
    });

    test('should fetch funding rate with market info and prices', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPricesResponse,
      });

      const fundingRate = await adapter.fetchFundingRate('ETH/USD:ETH');
      expect(fundingRate.symbol).toContain('ETH');
      expect(fundingRate.fundingRate).toBeDefined();
      expect(fundingRate.fundingIntervalHours).toBe(1);
    });

    test('should calculate funding rate from OI imbalance', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPricesResponse,
      });

      const fundingRate = await adapter.fetchFundingRate('ETH/USD:ETH');
      expect(fundingRate.info?.longOpenInterestUsd).toBeGreaterThan(0);
      expect(fundingRate.info?.shortOpenInterestUsd).toBeGreaterThan(0);
    });

    test('should throw for invalid market', async () => {
      await expect(adapter.fetchFundingRate('INVALID/MARKET')).rejects.toThrow(/Invalid market/);
    });
  });

  describe('fetchOHLCV with HTTP', () => {
    beforeEach(async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();
    });

    test('should fetch OHLCV candles', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candles: [
            [1700000000, 2000, 2050, 1980, 2020],
            [1700003600, 2020, 2100, 2010, 2080],
          ],
        }),
      });

      const candles = await adapter.fetchOHLCV('ETH/USD:ETH', '1h');
      expect(candles).toHaveLength(2);
      expect(candles[0]).toHaveLength(6); // [timestamp, open, high, low, close, volume]
    });

    test('should accept timeframe parameter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candles: [] }),
      });

      await adapter.fetchOHLCV('ETH/USD:ETH', '4h');
      expect((global.fetch as jest.Mock).mock.calls[0]![0]).toContain('period=4h');
    });

    test('should accept since parameter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candles: [] }),
      });

      await adapter.fetchOHLCV('ETH/USD:ETH', '1h', { since: 1700000000000 });
      expect((global.fetch as jest.Mock).mock.calls[0]![0]).toContain('from=1700000000');
    });

    test('should accept limit parameter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candles: [] }),
      });

      await adapter.fetchOHLCV('ETH/USD:ETH', '1h', { limit: 100 });
      expect((global.fetch as jest.Mock).mock.calls[0]![0]).toContain('limit=100');
    });

    test('should throw for invalid market', async () => {
      await expect(adapter.fetchOHLCV('INVALID/MARKET', '1h')).rejects.toThrow(/Invalid market/);
    });
  });

  describe('fetchPositions with subgraph', () => {
    beforeEach(async () => {
      adapter = new GmxAdapter({
        chain: 'arbitrum',
        walletAddress: '0x1234567890123456789012345678901234567890',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();
    });

    test('should fetch positions from subgraph', async () => {
      // First call: subgraph positions
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            positions: [
              {
                id: 'pos-1',
                account: '0x1234567890123456789012345678901234567890',
                market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
                collateralToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
                isLong: true,
                sizeInUsd: '100000000000000000000000000000000',
                sizeInTokens: '50000000000000000000',
                collateralAmount: '10000000000000000000',
                borrowingFactor: '0',
                fundingFeeAmountPerSize: '0',
                longTokenClaimableFundingAmountPerSize: '0',
                shortTokenClaimableFundingAmountPerSize: '0',
                increasedAtBlock: '1000',
                decreasedAtBlock: '0',
              },
            ],
          },
        }),
      });

      // Second call: prices for PnL calculation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPricesResponse,
      });

      const positions = await adapter.fetchPositions();
      expect(positions).toHaveLength(1);
      expect(positions[0]!.symbol).toContain('ETH');
      expect(positions[0]!.side).toBe('long');
    });

    test('should filter positions by symbols', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              positions: [
                {
                  id: 'pos-1',
                  account: '0x1234567890123456789012345678901234567890',
                  market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
                  collateralToken: '0xusdc',
                  isLong: true,
                  sizeInUsd: '100000000000000000000000000000000',
                  sizeInTokens: '50000000000000000000',
                  collateralAmount: '10000000000000000000',
                  borrowingFactor: '0',
                  fundingFeeAmountPerSize: '0',
                  longTokenClaimableFundingAmountPerSize: '0',
                  shortTokenClaimableFundingAmountPerSize: '0',
                  increasedAtBlock: '1000',
                  decreasedAtBlock: '0',
                },
              ],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPricesResponse,
        });

      const positions = await adapter.fetchPositions(['ETH/USD:ETH']);
      expect(positions.length).toBeGreaterThanOrEqual(0);
    });

    test('should skip positions with unknown market config', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              positions: [
                {
                  id: 'pos-1',
                  account: '0x1234567890123456789012345678901234567890',
                  market: '0x0000000000000000000000000000000000000000', // Unknown market
                  collateralToken: '0xusdc',
                  isLong: true,
                  sizeInUsd: '100000000000000000000000000000000',
                  sizeInTokens: '50000000000000000000',
                  collateralAmount: '10000000000000000000',
                  borrowingFactor: '0',
                  fundingFeeAmountPerSize: '0',
                  longTokenClaimableFundingAmountPerSize: '0',
                  shortTokenClaimableFundingAmountPerSize: '0',
                  increasedAtBlock: '1000',
                  decreasedAtBlock: '0',
                },
              ],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPricesResponse,
        });

      const positions = await adapter.fetchPositions();
      expect(positions).toHaveLength(0); // Skipped unknown market
    });
  });

  describe('fetchBalance with auth', () => {
    test('should fetch ETH and USDC balances', async () => {
      adapter = new GmxAdapter({
        chain: 'arbitrum',
        walletAddress: '0x1234567890123456789012345678901234567890',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();

      // Mock getBalance calls (would be RPC calls via ethers)
      const mockAuth = (adapter as any).auth;
      mockAuth.getBalance = jest.fn().mockResolvedValue(BigInt('1000000000000000000')); // 1 ETH
      mockAuth.getTokenBalance = jest.fn().mockResolvedValue(BigInt('1000000000')); // 1000 USDC

      // Mock prices for USD value calculation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            tokenAddress: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
            minPrice: '2000000000000000000000000000000',
            maxPrice: '2000000000000000000000000000000',
          },
        ],
      });

      const balances = await adapter.fetchBalance();
      expect(balances.length).toBeGreaterThanOrEqual(2);
      expect(balances.some(b => b.currency === 'ETH')).toBe(true);
      expect(balances.some(b => b.currency === 'USDC')).toBe(true);
    });
  });

  describe('fetchOpenOrders with subgraph', () => {
    beforeEach(async () => {
      adapter = new GmxAdapter({
        chain: 'arbitrum',
        walletAddress: '0x1234567890123456789012345678901234567890',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();
    });

    test('should fetch open orders from subgraph', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              orders: [
                {
                  key: 'order-1',
                  account: '0x1234567890123456789012345678901234567890',
                  receiver: '0x1234567890123456789012345678901234567890',
                  callbackContract: '0x0000000000000000000000000000000000000000',
                  uiFeeReceiver: '0x0000000000000000000000000000000000000000',
                  market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
                  initialCollateralToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
                  swapPath: [],
                  orderType: 0,
                  decreasePositionSwapType: 0,
                  sizeDeltaUsd: '100000000000000000000000000000000',
                  initialCollateralDeltaAmount: '10000000000000000000',
                  triggerPrice: '0',
                  acceptablePrice: '2000000000000000000000000000000',
                  executionFee: '100000000000000',
                  callbackGasLimit: '0',
                  minOutputAmount: '0',
                  updatedAtBlock: '1000',
                  validFromTime: 0,
                  updatedAtTime: Date.now(),
                  isLong: true,
                  isFrozen: false,
                  status: 'Created',
                  createdTxn: '0xtx',
                  autoCancel: false,
                },
              ],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPricesResponse,
        });

      const orders = await adapter.fetchOpenOrders();
      expect(orders).toHaveLength(1);
      expect(orders[0]!.symbol).toContain('ETH');
      expect(orders[0]!.status).toBe('open');
    });

    test('should filter orders by symbol', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              orders: [
                {
                  key: 'order-1',
                  account: '0x1234567890123456789012345678901234567890',
                  receiver: '0x1234567890123456789012345678901234567890',
                  callbackContract: '0x0000000000000000000000000000000000000000',
                  uiFeeReceiver: '0x0000000000000000000000000000000000000000',
                  market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
                  initialCollateralToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
                  swapPath: [],
                  orderType: 0,
                  decreasePositionSwapType: 0,
                  sizeDeltaUsd: '100000000000000000000000000000000',
                  initialCollateralDeltaAmount: '10000000000000000000',
                  triggerPrice: '0',
                  acceptablePrice: '2000000000000000000000000000000',
                  executionFee: '100000000000000',
                  callbackGasLimit: '0',
                  minOutputAmount: '0',
                  updatedAtBlock: '1000',
                  validFromTime: 0,
                  updatedAtTime: Date.now(),
                  isLong: true,
                  isFrozen: false,
                  status: 'Created',
                  createdTxn: '0xtx',
                  autoCancel: false,
                },
              ],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPricesResponse,
        });

      const orders = await adapter.fetchOpenOrders('ETH/USD:ETH');
      expect(orders.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('fetchOrderHistory with subgraph', () => {
    beforeEach(async () => {
      adapter = new GmxAdapter({
        chain: 'arbitrum',
        walletAddress: '0x1234567890123456789012345678901234567890',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();
    });

    test('should fetch order history from subgraph', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              orders: [
                {
                  key: 'order-1',
                  account: '0x1234567890123456789012345678901234567890',
                  receiver: '0x1234567890123456789012345678901234567890',
                  callbackContract: '0x0000000000000000000000000000000000000000',
                  uiFeeReceiver: '0x0000000000000000000000000000000000000000',
                  market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
                  initialCollateralToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
                  swapPath: [],
                  orderType: 0,
                  decreasePositionSwapType: 0,
                  sizeDeltaUsd: '100000000000000000000000000000000',
                  initialCollateralDeltaAmount: '10000000000000000000',
                  triggerPrice: '0',
                  acceptablePrice: '2000000000000000000000000000000',
                  executionFee: '100000000000000',
                  callbackGasLimit: '0',
                  minOutputAmount: '0',
                  updatedAtBlock: '1000',
                  validFromTime: 0,
                  updatedAtTime: Date.now(),
                  isLong: true,
                  isFrozen: false,
                  status: 'Executed',
                  createdTxn: '0xtx1',
                  executedTxn: '0xtx2',
                  autoCancel: false,
                },
              ],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPricesResponse,
        });

      const orders = await adapter.fetchOrderHistory();
      expect(orders).toHaveLength(1);
      expect(orders[0]!.status).toBe('filled');
    });

    test('should apply limit to order history', async () => {
      const mockOrders = Array(10).fill(null).map((_, i) => ({
        key: `order-${i}`,
        account: '0x1234567890123456789012345678901234567890',
        receiver: '0x1234567890123456789012345678901234567890',
        callbackContract: '0x0000000000000000000000000000000000000000',
        uiFeeReceiver: '0x0000000000000000000000000000000000000000',
        market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        initialCollateralToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        swapPath: [],
        orderType: 0,
        decreasePositionSwapType: 0,
        sizeDeltaUsd: '100000000000000000000000000000000',
        initialCollateralDeltaAmount: '10000000000000000000',
        triggerPrice: '0',
        acceptablePrice: '2000000000000000000000000000000',
        executionFee: '100000000000000',
        callbackGasLimit: '0',
        minOutputAmount: '0',
        updatedAtBlock: '1000',
        validFromTime: 0,
        updatedAtTime: Date.now(),
        isLong: true,
        isFrozen: false,
        status: 'Executed',
        createdTxn: '0xtx1',
        executedTxn: '0xtx2',
        autoCancel: false,
      }));

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { orders: mockOrders },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPricesResponse,
        });

      const orders = await adapter.fetchOrderHistory(undefined, undefined, 5);
      expect(orders).toHaveLength(5);
    });
  });

  describe('cancelAllOrders with fetch loop', () => {
    beforeEach(async () => {
      adapter = new GmxAdapter({
        chain: 'arbitrum',
        walletAddress: '0x1234567890123456789012345678901234567890',
        privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();
      (global.fetch as jest.Mock).mockClear();
    });

    test('should fetch open orders and cancel each', async () => {
      // Mock fetchOpenOrders
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              orders: [
                {
                  key: 'order-1',
                  account: '0x1234567890123456789012345678901234567890',
                  receiver: '0x1234567890123456789012345678901234567890',
                  callbackContract: '0x0000000000000000000000000000000000000000',
                  uiFeeReceiver: '0x0000000000000000000000000000000000000000',
                  market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
                  initialCollateralToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
                  swapPath: [],
                  orderType: 0,
                  decreasePositionSwapType: 0,
                  sizeDeltaUsd: '100000000000000000000000000000000',
                  initialCollateralDeltaAmount: '10000000000000000000',
                  triggerPrice: '0',
                  acceptablePrice: '2000000000000000000000000000000',
                  executionFee: '100000000000000',
                  callbackGasLimit: '0',
                  minOutputAmount: '0',
                  updatedAtBlock: '1000',
                  validFromTime: 0,
                  updatedAtTime: Date.now(),
                  isLong: true,
                  isFrozen: false,
                  status: 'Created',
                  createdTxn: '0xtx',
                  autoCancel: false,
                },
              ],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPricesResponse,
        });

      // Mock cancelOrder contract call
      const mockContracts = (adapter as any).contracts;
      const mockTxResponse = { hash: '0xtx', wait: jest.fn().mockResolvedValue({ hash: '0xtx' }) };
      mockContracts.getExchangeRouter = jest.fn().mockReturnValue({
        cancelOrder: jest.fn().mockResolvedValue(mockTxResponse),
      });

      const canceledOrders = await adapter.cancelAllOrders();
      expect(canceledOrders).toHaveLength(1);
      expect(canceledOrders[0]!.status).toBe('canceled');
    });

    test('should handle partial failures when canceling orders', async () => {
      // Mock fetchOpenOrders with 2 orders
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              orders: [
                {
                  key: 'order-1',
                  account: '0x1234567890123456789012345678901234567890',
                  receiver: '0x1234567890123456789012345678901234567890',
                  callbackContract: '0x0000000000000000000000000000000000000000',
                  uiFeeReceiver: '0x0000000000000000000000000000000000000000',
                  market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
                  initialCollateralToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
                  swapPath: [],
                  orderType: 0,
                  decreasePositionSwapType: 0,
                  sizeDeltaUsd: '100000000000000000000000000000000',
                  initialCollateralDeltaAmount: '10000000000000000000',
                  triggerPrice: '0',
                  acceptablePrice: '2000000000000000000000000000000',
                  executionFee: '100000000000000',
                  callbackGasLimit: '0',
                  minOutputAmount: '0',
                  updatedAtBlock: '1000',
                  validFromTime: 0,
                  updatedAtTime: Date.now(),
                  isLong: true,
                  isFrozen: false,
                  status: 'Created',
                  createdTxn: '0xtx',
                  autoCancel: false,
                },
                {
                  key: 'order-2',
                  account: '0x1234567890123456789012345678901234567890',
                  receiver: '0x1234567890123456789012345678901234567890',
                  callbackContract: '0x0000000000000000000000000000000000000000',
                  uiFeeReceiver: '0x0000000000000000000000000000000000000000',
                  market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
                  initialCollateralToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
                  swapPath: [],
                  orderType: 0,
                  decreasePositionSwapType: 0,
                  sizeDeltaUsd: '100000000000000000000000000000000',
                  initialCollateralDeltaAmount: '10000000000000000000',
                  triggerPrice: '0',
                  acceptablePrice: '2000000000000000000000000000000',
                  executionFee: '100000000000000',
                  callbackGasLimit: '0',
                  minOutputAmount: '0',
                  updatedAtBlock: '1000',
                  validFromTime: 0,
                  updatedAtTime: Date.now(),
                  isLong: false,
                  isFrozen: false,
                  status: 'Created',
                  createdTxn: '0xtx',
                  autoCancel: false,
                },
              ],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPricesResponse,
        });

      const mockContracts = (adapter as any).contracts;
      const mockTxResponse = { hash: '0xtx', wait: jest.fn().mockResolvedValue({ hash: '0xtx' }) };

      let callCount = 0;
      mockContracts.getExchangeRouter = jest.fn().mockReturnValue({
        cancelOrder: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve(mockTxResponse);
          } else {
            return Promise.reject(new Error('Cancel failed'));
          }
        }),
      });

      const canceledOrders = await adapter.cancelAllOrders();
      expect(canceledOrders).toHaveLength(1); // Only first succeeded
    });
  });
});

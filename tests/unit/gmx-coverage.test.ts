/**
 * GMX Coverage Expansion Tests
 *
 * Additional tests for GmxContracts, GmxSubgraph, and GmxAdapter methods
 * that have low coverage. Targets uncovered branches and error paths.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GmxAdapter } from '../../src/adapters/gmx/GmxAdapter.js';
import { GmxContracts } from '../../src/adapters/gmx/GmxContracts.js';
import { GmxSubgraph } from '../../src/adapters/gmx/GmxSubgraph.js';
import { GMX_API_URLS, GMX_MARKETS, GMX_PRECISION } from '../../src/adapters/gmx/constants.js';

// =============================================================================
// GmxContracts — expanded coverage
// =============================================================================

describe('GmxContracts Extended Coverage', () => {
  const mockProvider = {
    getFeeData: jest.fn<() => Promise<any>>().mockResolvedValue({ gasPrice: 100000000n }),
  };

  const mockSigner = {
    getAddress: jest.fn<() => Promise<string>>().mockResolvedValue(
      '0x1234567890123456789012345678901234567890'
    ),
  };

  describe('getDataStoreUint', () => {
    test('should call DataStore getUint with key', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any, mockSigner as any);
      const dataStore = contracts.getDataStore();

      // Mock the getUint function on the contract
      (dataStore as any).getUint = jest.fn<() => Promise<bigint>>().mockResolvedValue(42n);

      const result = await contracts.getDataStoreUint('0xsomekey');
      expect(result).toBe(42n);
    });
  });

  describe('getAccountPositions', () => {
    test('should call reader getAccountPositions', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      const reader = contracts.getReader();

      const mockPositions = [
        {
          account: '0xacc',
          market: '0xmkt',
          collateralToken: '0xcol',
          isLong: true,
          sizeInUsd: 100n,
          sizeInTokens: 50n,
          collateralAmount: 10n,
          borrowingFactor: 0n,
          fundingFeeAmountPerSize: 0n,
          longTokenClaimableFundingAmountPerSize: 0n,
          shortTokenClaimableFundingAmountPerSize: 0n,
          increasedAtBlock: 1000n,
          decreasedAtBlock: 0n,
        },
      ];

      (reader as any).getAccountPositions = jest.fn<() => Promise<any>>().mockResolvedValue(mockPositions);

      const result = await contracts.getAccountPositions('0xaccount');
      expect(result).toHaveLength(1);
      expect(result[0]!.isLong).toBe(true);
    });

    test('should use default start and end values', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      const reader = contracts.getReader();
      (reader as any).getAccountPositions = jest.fn<() => Promise<any>>().mockResolvedValue([]);

      await contracts.getAccountPositions('0xaccount');
      expect((reader as any).getAccountPositions).toHaveBeenCalledWith(
        expect.anything(), // dataStore
        '0xaccount',
        0,
        100
      );
    });

    test('should accept custom start and end', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      const reader = contracts.getReader();
      (reader as any).getAccountPositions = jest.fn<() => Promise<any>>().mockResolvedValue([]);

      await contracts.getAccountPositions('0xaccount', 10, 50);
      expect((reader as any).getAccountPositions).toHaveBeenCalledWith(
        expect.anything(),
        '0xaccount',
        10,
        50
      );
    });
  });

  describe('getAccountOrders', () => {
    test('should call reader getAccountOrders', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      const reader = contracts.getReader();
      (reader as any).getAccountOrders = jest.fn<() => Promise<any>>().mockResolvedValue([]);

      const result = await contracts.getAccountOrders('0xaccount');
      expect(result).toHaveLength(0);
    });

    test('should accept custom start and end', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      const reader = contracts.getReader();
      (reader as any).getAccountOrders = jest.fn<() => Promise<any>>().mockResolvedValue([]);

      await contracts.getAccountOrders('0xaccount', 5, 25);
      expect((reader as any).getAccountOrders).toHaveBeenCalledWith(
        expect.anything(),
        '0xaccount',
        5,
        25
      );
    });
  });

  describe('getPosition', () => {
    test('should return position when found', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      const reader = contracts.getReader();

      const mockPosition = {
        account: '0xacc',
        market: '0xmkt',
        isLong: true,
        sizeInUsd: 100n,
      };
      (reader as any).getPosition = jest.fn<() => Promise<any>>().mockResolvedValue(mockPosition);

      const result = await contracts.getPosition('0xpositionkey');
      expect(result).toBeDefined();
      expect(result!.isLong).toBe(true);
    });

    test('should return null when position not found (error)', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any);
      const reader = contracts.getReader();
      (reader as any).getPosition = jest.fn<() => Promise<any>>().mockRejectedValue(
        new Error('Position not found')
      );

      const result = await contracts.getPosition('0xnonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getExecutionFee with null gas price', () => {
    test('should handle null gasPrice by using 0n', async () => {
      const providerWithNullGas = {
        getFeeData: jest.fn<() => Promise<any>>().mockResolvedValue({ gasPrice: null }),
      };

      const contracts = new GmxContracts('arbitrum', providerWithNullGas as any);
      const fee = await contracts.getExecutionFee(200000n);
      // (500000 + 200000) * 0 * 120 / 100 = 0
      expect(fee).toBe(0n);
    });
  });

  describe('createOrder with signer', () => {
    test('should encode and call exchangeRouter.createOrder', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any, mockSigner as any);
      const router = contracts.getExchangeRouter();

      const mockTxResponse = { hash: '0xtx', wait: jest.fn() };
      (router as any).createOrder = jest.fn<() => Promise<any>>().mockResolvedValue(mockTxResponse);

      const params = {
        receiver: '0x1234567890123456789012345678901234567890',
        callbackContract: '0x0000000000000000000000000000000000000000',
        uiFeeReceiver: '0x0000000000000000000000000000000000000000',
        market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        initialCollateralToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        swapPath: [],
        orderType: 0,
        decreasePositionSwapType: 0,
        sizeDeltaUsd: 100000000000000000000000000000000n,
        initialCollateralDeltaAmount: 10000000n,
        triggerPrice: 0n,
        acceptablePrice: 2000000000000000000000000000000n,
        executionFee: 100000000000000n,
        callbackGasLimit: 0n,
        minOutputAmount: 0n,
        isLong: true,
        shouldUnwrapNativeToken: false,
      };

      const result = await contracts.createOrder(params as any, 100000000000000n);
      expect(result).toBe(mockTxResponse);
      expect((router as any).createOrder).toHaveBeenCalled();
    });

    test('should encode various order types', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any, mockSigner as any);
      const router = contracts.getExchangeRouter();
      const mockTxResponse = { hash: '0xtx' };
      (router as any).createOrder = jest.fn<() => Promise<any>>().mockResolvedValue(mockTxResponse);

      // Test with LimitIncrease order type (2)
      const params = {
        receiver: '0x1234567890123456789012345678901234567890',
        callbackContract: '0x0000000000000000000000000000000000000000',
        uiFeeReceiver: '0x0000000000000000000000000000000000000000',
        market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        initialCollateralToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        swapPath: [],
        orderType: 2,
        decreasePositionSwapType: 1,
        sizeDeltaUsd: 100n,
        initialCollateralDeltaAmount: 10n,
        triggerPrice: 0n,
        acceptablePrice: 2000n,
        executionFee: 100n,
        callbackGasLimit: 0n,
        minOutputAmount: 0n,
        isLong: false,
        shouldUnwrapNativeToken: true,
        referralCode: '0xabc',
      };

      await contracts.createOrder(params as any, 100n);
      const call = (router as any).createOrder.mock.calls[0]![0];
      expect(call.isLong).toBe(false);
      expect(call.shouldUnwrapNativeToken).toBe(true);
    });

    test('should use ZeroHash for undefined referralCode', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any, mockSigner as any);
      const router = contracts.getExchangeRouter();
      const mockTxResponse = { hash: '0xtx' };
      (router as any).createOrder = jest.fn<() => Promise<any>>().mockResolvedValue(mockTxResponse);

      const params = {
        receiver: '0x1234567890123456789012345678901234567890',
        callbackContract: '0x0000000000000000000000000000000000000000',
        uiFeeReceiver: '0x0000000000000000000000000000000000000000',
        market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        initialCollateralToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        swapPath: [],
        orderType: 0,
        decreasePositionSwapType: 0,
        sizeDeltaUsd: 100n,
        initialCollateralDeltaAmount: 10n,
        triggerPrice: 0n,
        acceptablePrice: 2000n,
        executionFee: 100n,
        callbackGasLimit: 0n,
        minOutputAmount: 0n,
        isLong: true,
        shouldUnwrapNativeToken: false,
        // referralCode intentionally omitted
      };

      await contracts.createOrder(params as any, 100n);
      const call = (router as any).createOrder.mock.calls[0]![0];
      expect(call.referralCode).toBeDefined(); // Should be ZeroHash
    });
  });

  describe('cancelOrder with signer', () => {
    test('should call exchangeRouter.cancelOrder', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any, mockSigner as any);
      const router = contracts.getExchangeRouter();
      const mockTxResponse = { hash: '0xtx' };
      (router as any).cancelOrder = jest.fn<() => Promise<any>>().mockResolvedValue(mockTxResponse);

      const result = await contracts.cancelOrder('0xorderkey');
      expect(result).toBe(mockTxResponse);
    });
  });

  describe('sendWnt with signer', () => {
    test('should call exchangeRouter.sendWnt', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any, mockSigner as any);
      const router = contracts.getExchangeRouter();
      const mockTxResponse = { hash: '0xtx' };
      (router as any).sendWnt = jest.fn<() => Promise<any>>().mockResolvedValue(mockTxResponse);

      const result = await contracts.sendWnt('0xreceiver', 1000000000000000n);
      expect(result).toBe(mockTxResponse);
    });
  });

  describe('sendTokens with signer', () => {
    test('should call exchangeRouter.sendTokens', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any, mockSigner as any);
      const router = contracts.getExchangeRouter();
      const mockTxResponse = { hash: '0xtx' };
      (router as any).sendTokens = jest.fn<() => Promise<any>>().mockResolvedValue(mockTxResponse);

      const result = await contracts.sendTokens('0xtoken', '0xreceiver', 1000n);
      expect(result).toBe(mockTxResponse);
    });
  });

  describe('encodeOrderType edge cases', () => {
    test('should default to MarketIncrease for unknown order type', async () => {
      const contracts = new GmxContracts('arbitrum', mockProvider as any, mockSigner as any);
      const router = contracts.getExchangeRouter();
      const mockTxResponse = { hash: '0xtx' };
      (router as any).createOrder = jest.fn<() => Promise<any>>().mockResolvedValue(mockTxResponse);

      const params = {
        receiver: '0x1234567890123456789012345678901234567890',
        callbackContract: '0x0000000000000000000000000000000000000000',
        uiFeeReceiver: '0x0000000000000000000000000000000000000000',
        market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        initialCollateralToken: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        swapPath: [],
        orderType: 99, // Unknown order type
        decreasePositionSwapType: 99, // Unknown swap type
        sizeDeltaUsd: 100n,
        initialCollateralDeltaAmount: 10n,
        triggerPrice: 0n,
        acceptablePrice: 2000n,
        executionFee: 100n,
        callbackGasLimit: 0n,
        minOutputAmount: 0n,
        isLong: true,
        shouldUnwrapNativeToken: false,
      };

      await contracts.createOrder(params as any, 100n);
      // Should not throw — defaults to MarketIncrease/NoSwap
      expect((router as any).createOrder).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// GmxSubgraph — query methods (previously untested)
// =============================================================================

describe('GmxSubgraph Query Methods', () => {
  const originalFetch = global.fetch;
  let subgraph: GmxSubgraph;

  beforeEach(() => {
    subgraph = new GmxSubgraph('arbitrum');
    global.fetch = jest.fn() as jest.Mock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('fetchPositions', () => {
    test('should fetch and filter positions with non-zero size', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            positions: [
              { sizeInUsd: '1000000000000000000000000000000', isLong: true, market: '0x1' },
              { sizeInUsd: '0', isLong: false, market: '0x2' }, // Should be filtered out
            ],
          },
        }),
      });

      const result = await subgraph.fetchPositions('0xaccount');
      expect(result).toHaveLength(1);
      expect(result[0]!.isLong).toBe(true);
    });

    test('should lowercase the account address', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { positions: [] },
        }),
      });

      await subgraph.fetchPositions('0xABCDEF');
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0]![1]!.body as string);
      expect(body.variables.account).toBe('0xabcdef');
    });
  });

  describe('fetchOpenOrders', () => {
    test('should fetch open orders with Created status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            orders: [
              { key: 'order1', status: 'Created', orderType: 0 },
            ],
          },
        }),
      });

      const result = await subgraph.fetchOpenOrders('0xaccount');
      expect(result).toHaveLength(1);
      expect(result[0]!.key).toBe('order1');
    });
  });

  describe('fetchOrderHistory', () => {
    test('should fetch order history', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            orders: [
              { key: 'order1', status: 'Executed' },
              { key: 'order2', status: 'Cancelled' },
            ],
          },
        }),
      });

      const result = await subgraph.fetchOrderHistory('0xaccount');
      expect(result).toHaveLength(2);
    });

    test('should pass since parameter as block number', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { orders: [] },
        }),
      });

      await subgraph.fetchOrderHistory('0xaccount', 1700000000000);
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0]![1]!.body as string);
      expect(body.variables.since).toBe('1700000000');
    });

    test('should default since to 0 when not provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { orders: [] },
        }),
      });

      await subgraph.fetchOrderHistory('0xaccount');
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0]![1]!.body as string);
      expect(body.variables.since).toBe('0');
    });
  });

  describe('fetchAccountTrades', () => {
    test('should fetch account trades', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            tradeActions: [
              { id: 'trade1', isLong: true, orderType: 0, executionPrice: '2000000000000000000000000000000' },
            ],
          },
        }),
      });

      const result = await subgraph.fetchAccountTrades('0xaccount');
      expect(result).toHaveLength(1);
    });

    test('should pass since and limit parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { tradeActions: [] },
        }),
      });

      await subgraph.fetchAccountTrades('0xaccount', 1700000000000, 100);
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0]![1]!.body as string);
      expect(body.variables.since).toBe('1700000000');
      expect(body.variables.limit).toBe(100);
    });

    test('should default since to 0 and limit to 50', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { tradeActions: [] },
        }),
      });

      await subgraph.fetchAccountTrades('0xaccount');
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0]![1]!.body as string);
      expect(body.variables.since).toBe('0');
      expect(body.variables.limit).toBe(50);
    });
  });

  describe('fetchMarketTrades', () => {
    test('should fetch market trades', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            tradeActions: [
              { id: 'trade1', marketAddress: '0xmarket' },
            ],
          },
        }),
      });

      const result = await subgraph.fetchMarketTrades('0xmarket');
      expect(result).toHaveLength(1);
    });

    test('should lowercase market address', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { tradeActions: [] },
        }),
      });

      await subgraph.fetchMarketTrades('0xABCDEF');
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0]![1]!.body as string);
      expect(body.variables.market).toBe('0xabcdef');
    });
  });

  describe('query error handling', () => {
    test('should throw on non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(subgraph.fetchPositions('0xaccount')).rejects.toThrow(/subgraph request failed/i);
    });

    test('should throw on GraphQL errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Query syntax error' }],
        }),
      });

      await expect(subgraph.fetchPositions('0xaccount')).rejects.toThrow(/query syntax error/i);
    });

    test('should throw on empty data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: undefined,
        }),
      });

      await expect(subgraph.fetchPositions('0xaccount')).rejects.toThrow(/no data returned/i);
    });

    test('should handle GraphQL errors with empty array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [],
          data: { positions: [] },
        }),
      });

      // Empty errors array should not throw
      const result = await subgraph.fetchPositions('0xaccount');
      expect(result).toHaveLength(0);
    });
  });
});

// =============================================================================
// GmxAdapter — initialized state methods
// =============================================================================

describe('GmxAdapter Initialized Methods', () => {
  const originalFetch = global.fetch;
  let adapter: GmxAdapter;

  const mockMarketsInfoResponse = {
    markets: [
      {
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

  describe('fetchMarkets', () => {
    test('should fetch and normalize markets', async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      // Mock for initialize
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();

      // fetchMarkets will use cache from initialize
      const markets = await adapter.fetchMarkets();
      expect(markets.length).toBeGreaterThan(0);
    });

    test('should filter by active status', async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();

      const activeMarkets = await adapter.fetchMarkets({ active: true });
      expect(activeMarkets.every((m) => m.active)).toBe(true);
    });
  });

  describe('fetchTicker', () => {
    test('should throw for invalid market symbol', async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();

      await expect(adapter.fetchTicker('INVALID/MARKET')).rejects.toThrow();
    });
  });

  describe('fetchFundingRate', () => {
    test('should throw for invalid market symbol', async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();

      await expect(adapter.fetchFundingRate('INVALID/MARKET')).rejects.toThrow();
    });
  });

  describe('fetchOHLCV', () => {
    test('should throw for invalid market symbol', async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();

      await expect(adapter.fetchOHLCV('INVALID/MARKET')).rejects.toThrow();
    });
  });

  describe('fetchPositions (no auth)', () => {
    test('should throw when wallet not configured', async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();

      await expect(adapter.fetchPositions()).rejects.toThrow(/wallet address required/i);
    });
  });

  describe('fetchBalance (no auth)', () => {
    test('should throw when wallet not configured', async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();

      await expect(adapter.fetchBalance()).rejects.toThrow(/wallet address required/i);
    });
  });

  describe('fetchOpenOrders (no auth)', () => {
    test('should throw when wallet not configured', async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();

      await expect(adapter.fetchOpenOrders()).rejects.toThrow(/wallet address required/i);
    });
  });

  describe('createOrder (no auth)', () => {
    test('should throw when private key not configured', async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();

      await expect(
        adapter.createOrder({
          symbol: 'ETH/USD:ETH',
          type: 'market',
          side: 'buy',
          amount: 1,
        })
      ).rejects.toThrow(/private key required/i);
    });
  });

  describe('cancelOrder (no auth)', () => {
    test('should throw when private key not configured', async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();

      await expect(adapter.cancelOrder('0xorderkey')).rejects.toThrow(/private key required/i);
    });
  });

  describe('cancelAllOrders (no auth)', () => {
    test('should throw when private key not configured', async () => {
      adapter = new GmxAdapter({ chain: 'arbitrum' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketsInfoResponse,
      });

      await adapter.initialize();

      await expect(adapter.cancelAllOrders()).rejects.toThrow(/private key required/i);
    });
  });
});

// =============================================================================
// GmxSubgraph normalizeOrder edge cases
// =============================================================================

describe('GmxSubgraph Normalizer Edge Cases', () => {
  let subgraph: GmxSubgraph;

  beforeEach(() => {
    subgraph = new GmxSubgraph('arbitrum');
  });

  describe('normalizeOrder — frozen order', () => {
    test('should map Frozen status to open', () => {
      const frozenOrder = {
        key: 'order-frozen',
        account: '0xacc',
        receiver: '0xrec',
        callbackContract: '0x0',
        uiFeeReceiver: '0x0',
        market: '0xmarket',
        initialCollateralToken: '0xusdc',
        swapPath: [],
        orderType: 2, // LimitIncrease
        decreasePositionSwapType: 0,
        sizeDeltaUsd: '100000000000000000000000000000000',
        initialCollateralDeltaAmount: '10000000',
        triggerPrice: '2000000000000000000000000000000',
        acceptablePrice: '2000000000000000000000000000000',
        executionFee: '100000000000000',
        callbackGasLimit: '0',
        minOutputAmount: '0',
        updatedAtBlock: '1000',
        isLong: true,
        isFrozen: true,
        status: 'Frozen',
        createdTxn: '0xtx',
        cancelledTxn: undefined,
        executedTxn: undefined,
      };

      const result = subgraph.normalizeOrder(frozenOrder);
      expect(result.status).toBe('open');
    });
  });

  describe('normalizeOrder — expired order', () => {
    test('should map Expired status', () => {
      const expiredOrder = {
        key: 'order-expired',
        account: '0xacc',
        receiver: '0xrec',
        callbackContract: '0x0',
        uiFeeReceiver: '0x0',
        market: '0xmarket',
        initialCollateralToken: '0xusdc',
        swapPath: [],
        orderType: 3, // LimitDecrease
        decreasePositionSwapType: 0,
        sizeDeltaUsd: '100000000000000000000000000000000',
        initialCollateralDeltaAmount: '0',
        triggerPrice: '2000000000000000000000000000000',
        acceptablePrice: '2000000000000000000000000000000',
        executionFee: '100000000000000',
        callbackGasLimit: '0',
        minOutputAmount: '0',
        updatedAtBlock: '1000',
        isLong: false,
        isFrozen: false,
        status: 'Expired',
        createdTxn: '0xtx',
        cancelledTxn: undefined,
        executedTxn: undefined,
      };

      const result = subgraph.normalizeOrder(expiredOrder);
      expect(result.status).toBe('expired');
      expect(result.side).toBe('buy'); // Short decrease = buy
    });
  });

  describe('normalizeOrder — unknown status', () => {
    test('should default unknown status to open', () => {
      const unknownStatusOrder = {
        key: 'order-unknown',
        account: '0xacc',
        receiver: '0xrec',
        callbackContract: '0x0',
        uiFeeReceiver: '0x0',
        market: '0xmarket',
        initialCollateralToken: '0xusdc',
        swapPath: [],
        orderType: 5, // Liquidation
        decreasePositionSwapType: 0,
        sizeDeltaUsd: '100000000000000000000000000000000',
        initialCollateralDeltaAmount: '0',
        triggerPrice: '0',
        acceptablePrice: '0',
        executionFee: '100000000000000',
        callbackGasLimit: '0',
        minOutputAmount: '0',
        updatedAtBlock: '1000',
        isLong: true,
        isFrozen: false,
        status: 'UnknownStatus',
        createdTxn: '0xtx',
        cancelledTxn: undefined,
        executedTxn: undefined,
      };

      const result = subgraph.normalizeOrder(unknownStatusOrder);
      expect(result.status).toBe('open');
      expect(result.type).toBe('market'); // Liquidation maps to market
    });
  });

  describe('normalizePosition — zero sizeInTokens', () => {
    test('should handle zero tokens for entry price calculation', () => {
      const pos = {
        id: 'pos-zero',
        account: '0xacc',
        market: '0xmarket',
        collateralToken: '0xusdc',
        sizeInUsd: '0',
        sizeInTokens: '0',
        collateralAmount: '0',
        borrowingFactor: '0',
        fundingFeeAmountPerSize: '0',
        longTokenClaimableFundingAmountPerSize: '0',
        shortTokenClaimableFundingAmountPerSize: '0',
        increasedAtBlock: '1000',
        decreasedAtBlock: '0',
        isLong: true,
      };

      const result = subgraph.normalizePosition(pos, 2000);
      expect(result.entryPrice).toBe(0);
      expect(result.unrealizedPnl).toBe(0);
      expect(result.leverage).toBe(0);
    });
  });

  describe('normalizeTrade — without PnL and priceImpact', () => {
    test('should default missing pnlUsd and priceImpactUsd to 0', () => {
      const trade = {
        id: 'trade-no-pnl',
        account: '0xacc',
        marketAddress: '0xmarket',
        collateralTokenAddress: '0xusdc',
        sizeDeltaUsd: '100000000000000000000000000000000',
        collateralDeltaAmount: '10000000',
        orderType: 1, // MarketDecrease
        isLong: false,
        executionPrice: '2000000000000000000000000000000',
        priceImpactUsd: '', // Empty string
        timestamp: '1700000000',
        transactionHash: '0xtx',
        // pnlUsd intentionally omitted
      };

      const result = subgraph.normalizeTrade(trade);
      expect(result.pnl).toBe(0);
      expect(result.side).toBe('buy'); // Short decrease = buy
    });
  });

  describe('normalizeTrade — zero execution price', () => {
    test('should handle zero execution price for amount calculation', () => {
      const trade = {
        id: 'trade-zero-price',
        account: '0xacc',
        marketAddress: '0xmarket',
        collateralTokenAddress: '0xusdc',
        sizeDeltaUsd: '100000000000000000000000000000000',
        collateralDeltaAmount: '10000000',
        orderType: 0,
        isLong: true,
        executionPrice: '0',
        priceImpactUsd: '0',
        pnlUsd: '0',
        timestamp: '1700000000',
        transactionHash: '0xtx',
      };

      const result = subgraph.normalizeTrade(trade);
      expect(result.amount).toBe(0); // executionPrice is 0, so amount = 0
    });
  });
});

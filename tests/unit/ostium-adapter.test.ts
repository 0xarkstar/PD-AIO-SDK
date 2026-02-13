/**
 * Ostium Adapter Unit Tests
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { OstiumAdapter } from '../../src/adapters/ostium/OstiumAdapter.js';
import { OstiumNormalizer } from '../../src/adapters/ostium/OstiumNormalizer.js';
import { OstiumAuth } from '../../src/adapters/ostium/OstiumAuth.js';
import { OstiumContracts } from '../../src/adapters/ostium/OstiumContracts.js';
import { OstiumSubgraph } from '../../src/adapters/ostium/OstiumSubgraph.js';
import { mapOstiumError, OSTIUM_ERROR_PATTERNS } from '../../src/adapters/ostium/error-codes.js';
import {
  OSTIUM_PAIRS,
  OSTIUM_METADATA_URL,
  OSTIUM_CONTRACTS,
  OSTIUM_COLLATERAL_DECIMALS,
  OSTIUM_PRICE_DECIMALS,
} from '../../src/adapters/ostium/constants.js';
import {
  toOstiumPairIndex,
  toUnifiedSymbol,
  toUnifiedSymbolFromName,
  getPairInfo,
  formatCollateral,
  parseCollateral,
  formatPrice,
  parsePrice,
} from '../../src/adapters/ostium/utils.js';
import {
  PerpDEXError,
  NotSupportedError,
  InsufficientMarginError,
  InvalidOrderError,
  TransactionFailedError,
  ExchangeUnavailableError,
} from '../../src/types/errors.js';
import type {
  OstiumPriceResponse,
  OstiumSubgraphTrade,
  OstiumSubgraphPosition,
  OstiumOpenTrade,
  OstiumConfig,
} from '../../src/adapters/ostium/types.js';

// ============================================================================
// Mock fetch globally
// ============================================================================

const mockFetch = jest.fn() as jest.MockedFunction<typeof global.fetch>;
global.fetch = mockFetch;

// Mock ethers
jest.mock('ethers', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890';

  const MockWallet = jest.fn().mockImplementation(() => ({
    address: mockAddress,
    connect: jest.fn().mockReturnThis(),
  }));

  const MockJsonRpcProvider = jest.fn().mockImplementation(() => ({
    getBalance: jest.fn(),
    getBlockNumber: jest.fn(),
  }));

  const MockContract = jest.fn().mockImplementation(() => ({
    openTrade: jest.fn().mockResolvedValue({ hash: '0xabc123' } as never),
    closeTradeMarket: jest.fn().mockResolvedValue({ hash: '0xdef456' } as never),
    cancelOpenLimitOrder: jest.fn().mockResolvedValue({ hash: '0xghi789' } as never),
    openTrades: jest.fn().mockResolvedValue({
      trader: mockAddress,
      pairIndex: 0n,
      index: 0n,
      positionSizeDai: '1000000',
      openPrice: '500000000000',
      buy: true,
      leverage: 10n,
      tp: '0',
      sl: '0',
    } as never),
    openTradesCount: jest.fn().mockResolvedValue(1n as never),
    balanceOf: jest.fn().mockResolvedValue(1000000000n as never),
  }));

  return {
    Wallet: MockWallet,
    JsonRpcProvider: MockJsonRpcProvider,
    Contract: MockContract,
    ethers: {
      Wallet: MockWallet,
      JsonRpcProvider: MockJsonRpcProvider,
      Contract: MockContract,
    },
  };
});

// ============================================================================
// Test Data
// ============================================================================

const MOCK_PRICE_RESPONSE: OstiumPriceResponse = {
  pair: 'AAPL/USD',
  price: '175.50',
  timestamp: 1700000000000,
  source: 'pyth',
};

const MOCK_SUBGRAPH_TRADE: OstiumSubgraphTrade = {
  id: 'trade-1',
  trader: '0x1234567890123456789012345678901234567890',
  pairIndex: '2',
  action: 'OPEN',
  price: '175.50',
  size: '1000',
  buy: true,
  leverage: '10',
  pnl: '0',
  timestamp: '1700000000',
  txHash: '0xabc123',
};

const MOCK_SUBGRAPH_POSITION: OstiumSubgraphPosition = {
  id: 'pos-1',
  trader: '0x1234567890123456789012345678901234567890',
  pairIndex: '2',
  index: '0',
  positionSizeDai: '1000000000',
  openPrice: '17550000000000',
  buy: true,
  leverage: '10',
  tp: '0',
  sl: '0',
  timestamp: '1700000000',
};

const MOCK_OPEN_TRADE: OstiumOpenTrade = {
  trader: '0x1234567890123456789012345678901234567890',
  pairIndex: 2,
  index: 0,
  positionSizeDai: '1000000000',
  openPrice: '17550000000000',
  buy: true,
  leverage: 10,
  tp: '0',
  sl: '0',
  timestamp: 1700000000000,
};

// ============================================================================
// Constructor Tests
// ============================================================================

describe('OstiumAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should create adapter with default config', () => {
      const adapter = new OstiumAdapter();
      expect(adapter.id).toBe('ostium');
      expect(adapter.name).toBe('Ostium');
    });

    test('should create adapter with custom metadata URL', () => {
      const adapter = new OstiumAdapter({
        metadataUrl: 'https://custom-metadata.example.com',
      });
      expect(adapter.id).toBe('ostium');
    });

    test('should create adapter with privateKey', () => {
      const adapter = new OstiumAdapter({
        privateKey: '0x' + '1'.repeat(64),
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
      });
      expect(adapter.id).toBe('ostium');
    });

    test('should create adapter without auth for read-only mode', () => {
      const adapter = new OstiumAdapter();
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
    });

    test('should accept custom subgraph URL', () => {
      const adapter = new OstiumAdapter({
        subgraphUrl: 'https://custom-subgraph.example.com',
      });
      expect(adapter.id).toBe('ostium');
    });
  });

  // ==========================================================================
  // Feature Map Tests
  // ==========================================================================

  describe('Feature Map', () => {
    let adapter: OstiumAdapter;

    beforeEach(() => {
      adapter = new OstiumAdapter();
    });

    test('should support fetchMarkets', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
    });

    test('should support fetchTicker', () => {
      expect(adapter.has.fetchTicker).toBe(true);
    });

    test('should NOT support fetchOrderBook', () => {
      expect(adapter.has.fetchOrderBook).toBe(false);
    });

    test('should NOT support fetchTrades (subgraph removed)', () => {
      expect(adapter.has.fetchTrades).toBe(false);
    });

    test('should NOT support fetchFundingRate', () => {
      expect(adapter.has.fetchFundingRate).toBe(false);
    });

    test('should support createOrder', () => {
      expect(adapter.has.createOrder).toBe(true);
    });

    test('should support cancelOrder', () => {
      expect(adapter.has.cancelOrder).toBe(true);
    });

    test('should support fetchPositions', () => {
      expect(adapter.has.fetchPositions).toBe(true);
    });

    test('should support fetchBalance', () => {
      expect(adapter.has.fetchBalance).toBe(true);
    });

    test('should NOT support setLeverage', () => {
      expect(adapter.has.setLeverage).toBe(false);
    });
  });

  // ==========================================================================
  // Initialize Tests
  // ==========================================================================

  describe('initialize', () => {
    test('should set isReady to true', async () => {
      const adapter = new OstiumAdapter();
      await adapter.initialize();
      expect(adapter.isReady).toBe(true);
    });
  });

  // ==========================================================================
  // fetchMarkets Tests
  // ==========================================================================

  describe('fetchMarkets', () => {
    let adapter: OstiumAdapter;

    beforeEach(async () => {
      adapter = new OstiumAdapter();
      await adapter.initialize();
    });

    test('should return static pair definitions', async () => {
      const markets = await adapter.fetchMarkets();
      expect(markets.length).toBe(OSTIUM_PAIRS.length);
    });

    test('should normalize market correctly', async () => {
      const markets = await adapter.fetchMarkets();
      const btcMarket = markets.find((m) => m.base === 'BTC');

      expect(btcMarket).toBeDefined();
      expect(btcMarket!.symbol).toBe('BTC/USD:USD');
      expect(btcMarket!.settle).toBe('USDC');
      expect(btcMarket!.active).toBe(true);
      expect(btcMarket!.maxLeverage).toBe(150);
    });

    test('should include stock pairs', async () => {
      const markets = await adapter.fetchMarkets();
      const aaplMarket = markets.find((m) => m.base === 'AAPL');

      expect(aaplMarket).toBeDefined();
      expect(aaplMarket!.symbol).toBe('AAPL/USD:USD');
      expect(aaplMarket!.maxLeverage).toBe(50);
    });

    test('should include forex pairs', async () => {
      const markets = await adapter.fetchMarkets();
      const eurMarket = markets.find((m) => m.base === 'EUR');

      expect(eurMarket).toBeDefined();
      expect(eurMarket!.symbol).toBe('EUR/USD:USD');
      expect(eurMarket!.maxLeverage).toBe(250);
    });

    test('should include commodity pairs', async () => {
      const markets = await adapter.fetchMarkets();
      const goldMarket = markets.find((m) => m.base === 'XAU');

      expect(goldMarket).toBeDefined();
      expect(goldMarket!.symbol).toBe('XAU/USD:USD');
    });

    test('should include index pairs', async () => {
      const markets = await adapter.fetchMarkets();
      const spxMarket = markets.find((m) => m.base === 'SPX');

      expect(spxMarket).toBeDefined();
      expect(spxMarket!.symbol).toBe('SPX/USD:USD');
    });

    test('should have correct fee structure', async () => {
      const markets = await adapter.fetchMarkets();
      const btcMarket = markets.find((m) => m.base === 'BTC')!;

      expect(btcMarket.makerFee).toBe(0);
      expect(btcMarket.takerFee).toBe(0.0005); // 0.05% spread / 100
    });
  });

  // ==========================================================================
  // fetchTicker Tests
  // ==========================================================================

  describe('fetchTicker', () => {
    let adapter: OstiumAdapter;

    beforeEach(async () => {
      adapter = new OstiumAdapter();
      await adapter.initialize();
    });

    test('should fetch ticker from metadata API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_PRICE_RESPONSE,
      } as Response);

      const ticker = await adapter.fetchTicker('AAPL/USD:USD');

      expect(ticker.symbol).toBe('AAPL/USD:USD');
      expect(ticker.last).toBe(175.5);
      expect(ticker.bid).toBe(175.5);
      expect(ticker.ask).toBe(175.5);
      expect(ticker.timestamp).toBe(1700000000000);
    });

    test('should throw for unknown pair', async () => {
      await expect(adapter.fetchTicker('UNKNOWN/USD:USD')).rejects.toThrow(
        'Unknown Ostium pair'
      );
    });
  });

  // ==========================================================================
  // fetchOrderBook Tests
  // ==========================================================================

  describe('fetchOrderBook', () => {
    test('should throw NotSupportedError', async () => {
      const adapter = new OstiumAdapter();
      await adapter.initialize();

      await expect(adapter.fetchOrderBook('AAPL/USD:USD')).rejects.toThrow(
        NotSupportedError
      );
    });
  });

  // ==========================================================================
  // fetchTrades Tests
  // ==========================================================================

  describe('fetchTrades', () => {
    let adapter: OstiumAdapter;

    beforeEach(async () => {
      adapter = new OstiumAdapter();
      await adapter.initialize();
    });

    test('should throw NotSupportedError (subgraph removed)', async () => {
      await expect(adapter.fetchTrades('AAPL/USD:USD')).rejects.toThrow(NotSupportedError);
    });

    test('should mention subgraph removal in error message', async () => {
      await expect(adapter.fetchTrades('BTC/USD:USD')).rejects.toThrow('subgraph');
    });
  });

  // ==========================================================================
  // fetchFundingRate Tests
  // ==========================================================================

  describe('fetchFundingRate', () => {
    test('should throw NotSupportedError', async () => {
      const adapter = new OstiumAdapter();
      await adapter.initialize();

      await expect(adapter.fetchFundingRate('AAPL/USD:USD')).rejects.toThrow(
        NotSupportedError
      );
    });
  });

  // ==========================================================================
  // requireAuth Tests
  // ==========================================================================

  describe('requireAuth', () => {
    test('should throw when no privateKey for createOrder', async () => {
      const adapter = new OstiumAdapter();
      await adapter.initialize();

      await expect(
        adapter.createOrder({
          symbol: 'AAPL/USD:USD',
          type: 'market',
          side: 'buy',
          amount: 100,
        })
      ).rejects.toThrow('Private key required');
    });

    test('should throw when no privateKey for fetchPositions', async () => {
      const adapter = new OstiumAdapter();
      await adapter.initialize();

      await expect(adapter.fetchPositions()).rejects.toThrow('Private key required');
    });

    test('should throw when no privateKey for fetchBalance', async () => {
      const adapter = new OstiumAdapter();
      await adapter.initialize();

      await expect(adapter.fetchBalance()).rejects.toThrow('Private key required');
    });

    test('should throw when no privateKey for cancelOrder', async () => {
      const adapter = new OstiumAdapter();
      await adapter.initialize();

      await expect(adapter.cancelOrder('0-0')).rejects.toThrow('Private key required');
    });
  });

  // ==========================================================================
  // createOrder Tests
  // ==========================================================================

  describe('createOrder', () => {
    let adapter: OstiumAdapter;

    beforeEach(async () => {
      adapter = new OstiumAdapter({
        privateKey: '0x' + '1'.repeat(64),
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
      });
      await adapter.initialize();
    });

    test('should create a market buy order', async () => {
      const order = await adapter.createOrder({
        symbol: 'AAPL/USD:USD',
        type: 'market',
        side: 'buy',
        amount: 100,
        price: 175.5,
        leverage: 10,
      });

      expect(order.id).toBe('0xabc123');
      expect(order.symbol).toBe('AAPL/USD:USD');
      expect(order.type).toBe('market');
      expect(order.side).toBe('buy');
      expect(order.amount).toBe(100);
      expect(order.status).toBe('open');
    });

    test('should default leverage to 10', async () => {
      const order = await adapter.createOrder({
        symbol: 'BTC/USD:USD',
        type: 'market',
        side: 'buy',
        amount: 1000,
      });

      expect(order.status).toBe('open');
    });

    test('should handle sell orders', async () => {
      const order = await adapter.createOrder({
        symbol: 'ETH/USD:USD',
        type: 'market',
        side: 'sell',
        amount: 500,
        leverage: 20,
      });

      expect(order.side).toBe('sell');
    });

    test('should set reduceOnly from request', async () => {
      const order = await adapter.createOrder({
        symbol: 'BTC/USD:USD',
        type: 'market',
        side: 'sell',
        amount: 100,
        reduceOnly: true,
      });

      expect(order.reduceOnly).toBe(true);
    });

    test('should use referralAddress in openTrade when set', async () => {
      const refAdapter = new OstiumAdapter({
        privateKey: '0x' + '1'.repeat(64),
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        referralAddress: '0xREFERRAL_ADDRESS_HERE_1234567890123456',
      });
      await refAdapter.initialize();

      const spy = jest.spyOn((refAdapter as any).contracts, 'openTrade');
      await refAdapter.createOrder({
        symbol: 'BTC/USD:USD',
        type: 'market',
        side: 'buy',
        amount: 100,
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          referral: '0xREFERRAL_ADDRESS_HERE_1234567890123456',
        })
      );
    });

    test('should fall back to builderCode when referralAddress not set', async () => {
      const bcAdapter = new OstiumAdapter({
        privateKey: '0x' + '1'.repeat(64),
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        builderCode: '0xBUILDER_CODE_ADDR_1234567890123456789',
      });
      await bcAdapter.initialize();

      const spy = jest.spyOn((bcAdapter as any).contracts, 'openTrade');
      await bcAdapter.createOrder({
        symbol: 'ETH/USD:USD',
        type: 'market',
        side: 'buy',
        amount: 50,
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          referral: '0xBUILDER_CODE_ADDR_1234567890123456789',
        })
      );
    });

    test('should fall back to zero address when neither referralAddress nor builderCode set', async () => {
      const spy = jest.spyOn((adapter as any).contracts, 'openTrade');
      await adapter.createOrder({
        symbol: 'BTC/USD:USD',
        type: 'market',
        side: 'buy',
        amount: 100,
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          referral: '0x0000000000000000000000000000000000000000',
        })
      );
    });

    test('should use zero address when builderCodeEnabled=false', async () => {
      const disabledAdapter = new OstiumAdapter({
        privateKey: '0x' + '1'.repeat(64),
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        referralAddress: '0xREFERRAL_ADDRESS_HERE_1234567890123456',
        builderCodeEnabled: false,
      });
      await disabledAdapter.initialize();

      const spy = jest.spyOn((disabledAdapter as any).contracts, 'openTrade');
      await disabledAdapter.createOrder({
        symbol: 'BTC/USD:USD',
        type: 'market',
        side: 'buy',
        amount: 100,
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          referral: '0x0000000000000000000000000000000000000000',
        })
      );
    });

    test('should allow per-order builderCode override', async () => {
      const refAdapter = new OstiumAdapter({
        privateKey: '0x' + '1'.repeat(64),
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        referralAddress: '0xADAPTER_REFERRAL_12345678901234567890',
      });
      await refAdapter.initialize();

      const spy = jest.spyOn((refAdapter as any).contracts, 'openTrade');
      await refAdapter.createOrder({
        symbol: 'BTC/USD:USD',
        type: 'market',
        side: 'buy',
        amount: 100,
        builderCode: '0xORDER_OVERRIDE_ADDR_12345678901234567',
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          referral: '0xORDER_OVERRIDE_ADDR_12345678901234567',
        })
      );
    });

    test('should prefer referralAddress over builderCode', async () => {
      const bothAdapter = new OstiumAdapter({
        privateKey: '0x' + '1'.repeat(64),
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        referralAddress: '0xREFERRAL_ADDRESS_HERE_1234567890123456',
        builderCode: '0xBUILDER_CODE_ADDR_1234567890123456789',
      });
      await bothAdapter.initialize();

      const spy = jest.spyOn((bothAdapter as any).contracts, 'openTrade');
      await bothAdapter.createOrder({
        symbol: 'BTC/USD:USD',
        type: 'market',
        side: 'buy',
        amount: 100,
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          referral: '0xREFERRAL_ADDRESS_HERE_1234567890123456',
        })
      );
    });

    test('constructor stores referralAddress correctly', () => {
      const a = new OstiumAdapter({
        referralAddress: '0xABC123',
      });
      expect((a as any).referralAddress).toBe('0xABC123');
    });
  });

  // ==========================================================================
  // cancelOrder Tests
  // ==========================================================================

  describe('cancelOrder', () => {
    let adapter: OstiumAdapter;

    beforeEach(async () => {
      adapter = new OstiumAdapter({
        privateKey: '0x' + '1'.repeat(64),
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
      });
      await adapter.initialize();
    });

    test('should cancel order with valid ID', async () => {
      const result = await adapter.cancelOrder('2-0');

      expect(result.id).toBe('2-0');
      expect(result.symbol).toBe('AAPL/USD:USD');
      expect(result.status).toBe('canceled');
    });

    test('should throw for invalid order ID format', async () => {
      await expect(adapter.cancelOrder('invalid')).rejects.toThrow('Invalid order ID format');
    });

    test('should throw for non-numeric order ID', async () => {
      await expect(adapter.cancelOrder('abc-def')).rejects.toThrow(
        'Invalid order ID format'
      );
    });
  });

  // ==========================================================================
  // fetchPositions Tests
  // ==========================================================================

  describe('fetchPositions', () => {
    let adapter: OstiumAdapter;

    beforeEach(async () => {
      adapter = new OstiumAdapter({
        privateKey: '0x' + '1'.repeat(64),
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
      });
      await adapter.initialize();
    });

    test('should fetch positions via subgraph', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { positions: [MOCK_SUBGRAPH_POSITION] },
        }),
      } as Response);

      const positions = await adapter.fetchPositions();

      expect(positions.length).toBe(1);
      expect(positions[0].side).toBe('long');
      expect(positions[0].leverage).toBe(10);
      expect(positions[0].marginMode).toBe('isolated');
    });

    test('should return empty array when no positions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { positions: [] },
        }),
      } as Response);

      const positions = await adapter.fetchPositions();
      expect(positions).toEqual([]);
    });
  });

  // ==========================================================================
  // fetchBalance Tests
  // ==========================================================================

  describe('fetchBalance', () => {
    test('should fetch USDC balance', async () => {
      const adapter = new OstiumAdapter({
        privateKey: '0x' + '1'.repeat(64),
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
      });
      await adapter.initialize();

      const balances = await adapter.fetchBalance();

      expect(balances.length).toBe(1);
      expect(balances[0].currency).toBe('USDC');
      expect(balances[0].total).toBeGreaterThan(0);
      expect(balances[0].free).toBe(balances[0].total);
      expect(balances[0].used).toBe(0);
    });
  });

  // ==========================================================================
  // setLeverage Tests
  // ==========================================================================

  describe('setLeverage', () => {
    test('should throw NotSupportedError', async () => {
      const adapter = new OstiumAdapter();
      await adapter.initialize();

      await expect(adapter.setLeverage('AAPL/USD:USD', 10)).rejects.toThrow(
        NotSupportedError
      );
    });
  });

  // ==========================================================================
  // cancelAllOrders Tests
  // ==========================================================================

  describe('cancelAllOrders', () => {
    test('should throw NotSupportedError', async () => {
      const adapter = new OstiumAdapter();
      await adapter.initialize();

      await expect(adapter.cancelAllOrders()).rejects.toThrow(NotSupportedError);
    });
  });
});

// ============================================================================
// Error Mapping Tests
// ============================================================================

describe('mapOstiumError', () => {
  test('should return PerpDEXError as-is', () => {
    const original = new PerpDEXError('test', 'TEST', 'ostium');
    const mapped = mapOstiumError(original);
    expect(mapped).toBe(original);
  });

  test('should map insufficient funds error', () => {
    const error = new Error('Insufficient funds for gas');
    const mapped = mapOstiumError(error);
    expect(mapped).toBeInstanceOf(InsufficientMarginError);
    expect(mapped.code).toBe('INSUFFICIENT_FUNDS');
  });

  test('should map insufficient balance error', () => {
    const error = new Error('insufficient balance');
    const mapped = mapOstiumError(error);
    expect(mapped).toBeInstanceOf(InsufficientMarginError);
  });

  test('should map max leverage error', () => {
    const error = new Error('Max leverage exceeded');
    const mapped = mapOstiumError(error);
    expect(mapped).toBeInstanceOf(InvalidOrderError);
    expect(mapped.code).toBe('INVALID_ORDER');
  });

  test('should map min leverage error', () => {
    const error = new Error('Min leverage requirement');
    const mapped = mapOstiumError(error);
    expect(mapped).toBeInstanceOf(InvalidOrderError);
  });

  test('should map slippage error', () => {
    const error = new Error('Slippage too high');
    const mapped = mapOstiumError(error);
    expect(mapped).toBeInstanceOf(InvalidOrderError);
  });

  test('should map execution reverted error', () => {
    const error = new Error('execution reverted');
    const mapped = mapOstiumError(error);
    expect(mapped).toBeInstanceOf(TransactionFailedError);
    expect(mapped.code).toBe('TX_FAILED');
  });

  test('should map nonce too low error', () => {
    const error = new Error('nonce too low');
    const mapped = mapOstiumError(error);
    expect(mapped).toBeInstanceOf(TransactionFailedError);
  });

  test('should map replacement fee too low error', () => {
    const error = new Error('replacement fee too low');
    const mapped = mapOstiumError(error);
    expect(mapped).toBeInstanceOf(TransactionFailedError);
  });

  test('should map paused error', () => {
    const error = new Error('Trading is paused');
    const mapped = mapOstiumError(error);
    expect(mapped).toBeInstanceOf(ExchangeUnavailableError);
  });

  test('should map market closed error', () => {
    const error = new Error('market closed');
    const mapped = mapOstiumError(error);
    expect(mapped).toBeInstanceOf(ExchangeUnavailableError);
  });

  test('should map unknown error to PerpDEXError', () => {
    const error = new Error('something unexpected');
    const mapped = mapOstiumError(error);
    expect(mapped).toBeInstanceOf(PerpDEXError);
    expect(mapped.code).toBe('UNKNOWN');
  });

  test('should handle string errors', () => {
    const mapped = mapOstiumError('string error');
    expect(mapped).toBeInstanceOf(PerpDEXError);
    expect(mapped.exchange).toBe('ostium');
  });

  test('should map max position size error', () => {
    const error = new Error('max position size exceeded');
    const mapped = mapOstiumError(error);
    expect(mapped).toBeInstanceOf(InvalidOrderError);
  });

  test('should map wrong leverage error', () => {
    const error = new Error('wrong leverage');
    const mapped = mapOstiumError(error);
    expect(mapped).toBeInstanceOf(InvalidOrderError);
  });
});

// ============================================================================
// Normalizer Tests
// ============================================================================

describe('OstiumNormalizer', () => {
  let normalizer: OstiumNormalizer;

  beforeEach(() => {
    normalizer = new OstiumNormalizer();
  });

  describe('normalizeMarket', () => {
    test('should normalize BTC pair correctly', () => {
      const pair = OSTIUM_PAIRS[0]; // BTC/USD
      const market = normalizer.normalizeMarket(pair);

      expect(market.id).toBe('0');
      expect(market.symbol).toBe('BTC/USD:USD');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('USDC');
      expect(market.active).toBe(true);
      expect(market.maxLeverage).toBe(150);
    });

    test('should normalize AAPL pair correctly', () => {
      const pair = OSTIUM_PAIRS[2]; // AAPL/USD
      const market = normalizer.normalizeMarket(pair);

      expect(market.symbol).toBe('AAPL/USD:USD');
      expect(market.base).toBe('AAPL');
      expect(market.maxLeverage).toBe(50);
      expect(market.minAmount).toBe(50);
    });

    test('should include correct fee from spread', () => {
      const pair = OSTIUM_PAIRS[5]; // EUR/USD
      const market = normalizer.normalizeMarket(pair);

      expect(market.makerFee).toBe(0);
      expect(market.takerFee).toBe(0.0001); // 0.01 / 100
    });
  });

  describe('normalizeTicker', () => {
    test('should normalize price response', () => {
      const pair = OSTIUM_PAIRS[2]; // AAPL
      const ticker = normalizer.normalizeTicker(MOCK_PRICE_RESPONSE, pair);

      expect(ticker.symbol).toBe('AAPL/USD:USD');
      expect(ticker.last).toBe(175.5);
      expect(ticker.bid).toBe(175.5);
      expect(ticker.ask).toBe(175.5);
      expect(ticker.timestamp).toBe(1700000000000);
    });
  });

  describe('normalizeTrade', () => {
    test('should normalize buy trade', () => {
      const trade = normalizer.normalizeTrade(MOCK_SUBGRAPH_TRADE);

      expect(trade.id).toBe('trade-1');
      expect(trade.symbol).toBe('AAPL/USD:USD');
      expect(trade.side).toBe('buy');
      expect(trade.price).toBe(175.5);
      expect(trade.amount).toBe(1000);
      expect(trade.cost).toBe(175500);
      expect(trade.timestamp).toBe(1700000000000);
    });

    test('should normalize sell trade', () => {
      const sellTrade = { ...MOCK_SUBGRAPH_TRADE, buy: false };
      const trade = normalizer.normalizeTrade(sellTrade);

      expect(trade.side).toBe('sell');
    });
  });

  describe('normalizePosition', () => {
    test('should normalize long position', () => {
      const position = normalizer.normalizePosition(MOCK_SUBGRAPH_POSITION);

      expect(position.symbol).toBe('AAPL/USD:USD');
      expect(position.side).toBe('long');
      expect(position.leverage).toBe(10);
      expect(position.marginMode).toBe('isolated');
      expect(position.timestamp).toBe(1700000000000);
    });

    test('should normalize short position', () => {
      const shortPos = { ...MOCK_SUBGRAPH_POSITION, buy: false };
      const position = normalizer.normalizePosition(shortPos);

      expect(position.side).toBe('short');
    });

    test('should calculate PnL with current price', () => {
      const position = normalizer.normalizePosition(MOCK_SUBGRAPH_POSITION, 200);
      expect(position.markPrice).toBe(200);
    });

    test('should use entry price when no current price', () => {
      const position = normalizer.normalizePosition(MOCK_SUBGRAPH_POSITION);
      expect(position.markPrice).toBe(position.entryPrice);
      expect(position.unrealizedPnl).toBe(0); // markPrice == entryPrice
    });
  });

  describe('normalizeBalance', () => {
    test('should normalize USDC balance', () => {
      const balance = normalizer.normalizeBalance('1000000000');

      expect(balance.currency).toBe('USDC');
      expect(balance.total).toBe(1000);
      expect(balance.free).toBe(1000);
      expect(balance.used).toBe(0);
    });

    test('should handle custom currency', () => {
      const balance = normalizer.normalizeBalance('500000', 'DAI');
      expect(balance.currency).toBe('DAI');
      expect(balance.total).toBe(0.5);
    });
  });

  describe('normalizeOrderFromTrade', () => {
    test('should normalize open trade to order', () => {
      const order = normalizer.normalizeOrderFromTrade(MOCK_OPEN_TRADE);

      expect(order.id).toBe('2-0');
      expect(order.symbol).toBe('AAPL/USD:USD');
      expect(order.side).toBe('buy');
      expect(order.status).toBe('filled');
      expect(order.type).toBe('market');
      expect(order.reduceOnly).toBe(false);
      expect(order.postOnly).toBe(false);
    });

    test('should normalize sell open trade', () => {
      const sellTrade = { ...MOCK_OPEN_TRADE, buy: false };
      const order = normalizer.normalizeOrderFromTrade(sellTrade);
      expect(order.side).toBe('sell');
    });
  });
});

// ============================================================================
// Utils Tests
// ============================================================================

describe('Utils', () => {
  describe('toOstiumPairIndex', () => {
    test('should convert unified symbol to pair index', () => {
      expect(toOstiumPairIndex('BTC/USD:USD')).toBe(0);
      expect(toOstiumPairIndex('ETH/USD:USD')).toBe(1);
      expect(toOstiumPairIndex('AAPL/USD:USD')).toBe(2);
    });

    test('should throw for unknown pair', () => {
      expect(() => toOstiumPairIndex('UNKNOWN/USD:USD')).toThrow('Unknown Ostium pair');
    });

    test('should throw PerpDEXError for unknown pair', () => {
      expect(() => toOstiumPairIndex('UNKNOWN/USD:USD')).toThrow(PerpDEXError);
    });
  });

  describe('toUnifiedSymbol', () => {
    test('should convert pair index to unified symbol', () => {
      expect(toUnifiedSymbol(0)).toBe('BTC/USD:USD');
      expect(toUnifiedSymbol(2)).toBe('AAPL/USD:USD');
    });

    test('should return unknown for invalid index', () => {
      expect(toUnifiedSymbol(999)).toBe('UNKNOWN-999/USD:USD');
    });
  });

  describe('toUnifiedSymbolFromName', () => {
    test('should convert name to unified symbol', () => {
      expect(toUnifiedSymbolFromName('AAPL/USD')).toBe('AAPL/USD:USD');
      expect(toUnifiedSymbolFromName('BTC/USD')).toBe('BTC/USD:USD');
    });
  });

  describe('getPairInfo', () => {
    test('should return pair info for valid index', () => {
      const info = getPairInfo(2);
      expect(info).toBeDefined();
      expect(info!.name).toBe('AAPL/USD');
      expect(info!.from).toBe('AAPL');
    });

    test('should return undefined for invalid index', () => {
      expect(getPairInfo(999)).toBeUndefined();
    });
  });

  describe('formatCollateral', () => {
    test('should format amount to USDC decimals', () => {
      expect(formatCollateral(100)).toBe('100000000');
      expect(formatCollateral(0.5)).toBe('500000');
    });
  });

  describe('parseCollateral', () => {
    test('should parse USDC decimals to amount', () => {
      expect(parseCollateral('100000000')).toBe(100);
      expect(parseCollateral('500000')).toBe(0.5);
    });
  });

  describe('formatPrice', () => {
    test('should format price to contract decimals', () => {
      expect(formatPrice(175.5)).toBe('1755000000000');
    });
  });

  describe('parsePrice', () => {
    test('should parse contract decimals to price', () => {
      expect(parsePrice('1755000000000')).toBe(175.5);
    });
  });
});

// ============================================================================
// Auth Tests
// ============================================================================

describe('OstiumAuth', () => {
  test('should create auth with config', () => {
    const auth = new OstiumAuth({
      privateKey: '0x' + '1'.repeat(64),
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
    });

    expect(auth.hasCredentials()).toBe(true);
    expect(auth.getRpcUrl()).toBe('https://arb1.arbitrum.io/rpc');
  });

  test('should return headers', () => {
    const auth = new OstiumAuth({
      privateKey: '0x' + '1'.repeat(64),
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
    });

    const headers = auth.getHeaders();
    expect(headers['Content-Type']).toBe('application/json');
  });

  test('should sign request (passthrough for EVM)', async () => {
    const auth = new OstiumAuth({
      privateKey: '0x' + '1'.repeat(64),
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
    });

    const request = { method: 'GET' as const, path: '/test' };
    const signed = await auth.sign(request);
    expect(signed.method).toBe('GET');
    expect(signed.path).toBe('/test');
  });

  test('should report no credentials when empty', () => {
    const auth = new OstiumAuth({
      privateKey: '',
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
    });

    expect(auth.hasCredentials()).toBe(false);
  });
});

// ============================================================================
// Subgraph Tests
// ============================================================================

describe('OstiumSubgraph', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should use default URL', () => {
    const subgraph = new OstiumSubgraph();
    expect(subgraph).toBeDefined();
  });

  test('should use custom URL', () => {
    const subgraph = new OstiumSubgraph('https://custom.example.com');
    expect(subgraph).toBeDefined();
  });

  test('should fetch trades', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { trades: [MOCK_SUBGRAPH_TRADE] },
      }),
    } as Response);

    const subgraph = new OstiumSubgraph();
    const trades = await subgraph.fetchTrades(2, 100);

    expect(trades.length).toBe(1);
    expect(trades[0].id).toBe('trade-1');
  });

  test('should fetch positions', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { positions: [MOCK_SUBGRAPH_POSITION] },
      }),
    } as Response);

    const subgraph = new OstiumSubgraph();
    const positions = await subgraph.fetchPositions(
      '0x1234567890123456789012345678901234567890'
    );

    expect(positions.length).toBe(1);
  });

  test('should handle subgraph errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        errors: [{ message: 'Query failed' }],
      }),
    } as Response);

    const subgraph = new OstiumSubgraph();
    await expect(subgraph.fetchTrades(0)).rejects.toThrow('Subgraph error');
  });

  test('should handle HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const subgraph = new OstiumSubgraph();
    await expect(subgraph.fetchTrades(0)).rejects.toThrow('Subgraph query failed');
  });
});

// ============================================================================
// Constants Tests
// ============================================================================

describe('Constants', () => {
  test('should have correct number of pairs', () => {
    expect(OSTIUM_PAIRS.length).toBe(11);
  });

  test('should have unique pair indices', () => {
    const indices = OSTIUM_PAIRS.map((p) => p.pairIndex);
    const unique = new Set(indices);
    expect(unique.size).toBe(indices.length);
  });

  test('should have valid contract addresses', () => {
    expect(OSTIUM_CONTRACTS.trading).toMatch(/^0x[a-fA-F0-9]+$/);
    expect(OSTIUM_CONTRACTS.storage).toMatch(/^0x[a-fA-F0-9]+$/);
    expect(OSTIUM_CONTRACTS.collateral).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  test('should have valid metadata URL', () => {
    expect(OSTIUM_METADATA_URL).toContain('https://');
  });

  test('should have correct USDC decimals', () => {
    expect(OSTIUM_COLLATERAL_DECIMALS).toBe(6);
  });

  test('should have correct price decimals', () => {
    expect(OSTIUM_PRICE_DECIMALS).toBe(10);
  });
});

// ============================================================================
// Error Patterns Tests
// ============================================================================

describe('OSTIUM_ERROR_PATTERNS', () => {
  test('should have all required error patterns', () => {
    expect(OSTIUM_ERROR_PATTERNS['insufficient funds']).toBe('INSUFFICIENT_FUNDS');
    expect(OSTIUM_ERROR_PATTERNS['execution reverted']).toBe('EXECUTION_REVERTED');
    expect(OSTIUM_ERROR_PATTERNS['paused']).toBe('TRADING_PAUSED');
    expect(OSTIUM_ERROR_PATTERNS['slippage']).toBe('SLIPPAGE_EXCEEDED');
    expect(OSTIUM_ERROR_PATTERNS['nonce too low']).toBe('NONCE_TOO_LOW');
    expect(OSTIUM_ERROR_PATTERNS['market closed']).toBe('MARKET_CLOSED');
  });
});

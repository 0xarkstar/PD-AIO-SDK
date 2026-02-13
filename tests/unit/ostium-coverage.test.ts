/**
 * Ostium Coverage Tests
 * Covers: OstiumAuth, OstiumContracts, OstiumAdapter (additional methods),
 *         OstiumSubgraph (parameterized queries), OstiumNormalizer (real pair names)
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { OstiumAdapter } from '../../src/adapters/ostium/OstiumAdapter.js';
import { OstiumAuth } from '../../src/adapters/ostium/OstiumAuth.js';
import { OstiumContracts } from '../../src/adapters/ostium/OstiumContracts.js';
import { OstiumSubgraph } from '../../src/adapters/ostium/OstiumSubgraph.js';
import { OstiumNormalizer } from '../../src/adapters/ostium/OstiumNormalizer.js';
import { OSTIUM_PAIRS } from '../../src/adapters/ostium/constants.js';
import { toOstiumPairIndex, toUnifiedSymbol } from '../../src/adapters/ostium/utils.js';
import { PerpDEXError, NotSupportedError } from '../../src/types/errors.js';
import type {
  OstiumSubgraphTrade,
  OstiumSubgraphPosition,
  OstiumOpenTrade,
} from '../../src/adapters/ostium/types.js';

// ============================================================================
// Mock fetch globally
// ============================================================================

const mockFetch = jest.fn() as jest.MockedFunction<typeof global.fetch>;
global.fetch = mockFetch;

// Mock ethers
const mockAddress = '0x1234567890123456789012345678901234567890';

jest.mock('ethers', () => {
  const addr = '0x1234567890123456789012345678901234567890';

  const MockWallet = jest.fn().mockImplementation(() => ({
    address: addr,
    connect: jest.fn().mockReturnThis(),
  }));

  const MockJsonRpcProvider = jest.fn().mockImplementation(() => ({
    getBalance: jest.fn(),
    getBlockNumber: jest.fn(),
  }));

  const MockContract = jest.fn().mockImplementation(() => ({
    openTrade: jest.fn().mockResolvedValue({ hash: '0xabc123' } as never),
    closeTradeMarket: jest.fn().mockResolvedValue({ hash: '0xclose456' } as never),
    cancelOpenLimitOrder: jest.fn().mockResolvedValue({ hash: '0xcancel789' } as never),
    openTrades: jest.fn().mockResolvedValue({
      trader: addr,
      pairIndex: 0n,
      index: 0n,
      positionSizeDai: '1000000',
      openPrice: '500000000000',
      buy: true,
      leverage: 10n,
      tp: '0',
      sl: '0',
    } as never),
    openTradesCount: jest.fn().mockResolvedValue(3n as never),
    balanceOf: jest.fn().mockResolvedValue(5000000000n as never),
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

const MOCK_TRADE: OstiumSubgraphTrade = {
  id: 'cov-trade-1',
  trader: mockAddress,
  pairIndex: '0',
  action: 'OPEN',
  price: '50000.00',
  size: '500',
  buy: true,
  leverage: '20',
  pnl: '100',
  timestamp: '1700100000',
  txHash: '0xcov123',
};

const MOCK_POSITION: OstiumSubgraphPosition = {
  id: 'cov-pos-1',
  trader: mockAddress,
  pairIndex: '1',
  index: '0',
  positionSizeDai: '2000000000',
  openPrice: '30000000000000',
  buy: false,
  leverage: '5',
  tp: '0',
  sl: '0',
  timestamp: '1700200000',
};

const MOCK_OPEN_TRADE: OstiumOpenTrade = {
  trader: mockAddress,
  pairIndex: 5,
  index: 1,
  positionSizeDai: '500000000',
  openPrice: '1080000000000',
  buy: true,
  leverage: 50,
  tp: '0',
  sl: '0',
  timestamp: 1700300000000,
};

// ============================================================================
// OstiumAuth Tests
// ============================================================================

describe('OstiumAuth Coverage', () => {
  const authConfig = {
    privateKey: '0x' + '2'.repeat(64),
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
  };

  test('getAddress() returns wallet address', () => {
    const auth = new OstiumAuth(authConfig);
    const address = auth.getAddress();
    expect(address).toBe(mockAddress);
  });

  test('getPrivateKey() returns the configured key', () => {
    const auth = new OstiumAuth(authConfig);
    expect(auth.getPrivateKey()).toBe('0x' + '2'.repeat(64));
  });

  test('sign() returns request unchanged (passthrough)', async () => {
    const auth = new OstiumAuth(authConfig);
    const request = { method: 'POST' as const, path: '/trade', body: '{}' };
    const signed = await auth.sign(request);
    expect(signed.method).toBe('POST');
    expect(signed.path).toBe('/trade');
    expect(signed.body).toBe('{}');
  });

  test('hasCredentials() true when both privateKey and rpcUrl set', () => {
    const auth = new OstiumAuth(authConfig);
    expect(auth.hasCredentials()).toBe(true);
  });

  test('hasCredentials() false when empty privateKey', () => {
    const auth = new OstiumAuth({ privateKey: '', rpcUrl: 'https://arb1.arbitrum.io/rpc' });
    expect(auth.hasCredentials()).toBe(false);
  });

  test('hasCredentials() false when empty rpcUrl', () => {
    const auth = new OstiumAuth({ privateKey: '0x' + '1'.repeat(64), rpcUrl: '' });
    expect(auth.hasCredentials()).toBe(false);
  });

  test('getHeaders() returns Content-Type application/json', () => {
    const auth = new OstiumAuth(authConfig);
    const headers = auth.getHeaders();
    expect(headers).toEqual({ 'Content-Type': 'application/json' });
  });

  test('getRpcUrl() returns configured URL', () => {
    const auth = new OstiumAuth(authConfig);
    expect(auth.getRpcUrl()).toBe('https://arb1.arbitrum.io/rpc');
  });
});

// ============================================================================
// OstiumContracts Tests
// ============================================================================

describe('OstiumContracts Coverage', () => {
  let contracts: OstiumContracts;

  beforeEach(() => {
    jest.clearAllMocks();
    contracts = new OstiumContracts(
      'https://arb1.arbitrum.io/rpc',
      '0x' + '3'.repeat(64)
    );
  });

  test('closeTrade() calls closeTradeMarket and returns hash', async () => {
    const result = await contracts.closeTrade(0, 0);
    expect(result.hash).toBe('0xclose456');
  });

  test('cancelOrder() calls cancelOpenLimitOrder and returns hash', async () => {
    const result = await contracts.cancelOrder(2, 1);
    expect(result.hash).toBe('0xcancel789');
  });

  test('getOpenTrade() parses contract response into OstiumOpenTrade', async () => {
    const trade = await contracts.getOpenTrade(mockAddress, 0, 0);
    expect(trade.trader).toBe(mockAddress);
    expect(trade.pairIndex).toBe(0);
    expect(trade.index).toBe(0);
    expect(trade.positionSizeDai).toBe('1000000');
    expect(trade.openPrice).toBe('500000000000');
    expect(trade.buy).toBe(true);
    expect(trade.leverage).toBe(10);
    expect(typeof trade.timestamp).toBe('number');
  });

  test('getOpenTradeCount() returns count as number', async () => {
    const count = await contracts.getOpenTradeCount(mockAddress, 0);
    expect(count).toBe(3);
  });

  test('getCollateralBalance() reads balance from contract', async () => {
    const balance = await contracts.getCollateralBalance(mockAddress);
    expect(balance).toBe('5000000000');
  });

  test('getTraderAddress() derives wallet address from private key', () => {
    const address = contracts.getTraderAddress();
    expect(address).toBe(mockAddress);
  });

  test('openTrade() with all params returns tx hash', async () => {
    const result = await contracts.openTrade({
      pairIndex: 2,
      positionSizeDai: '100000000',
      openPrice: '17550000000000',
      buy: true,
      leverage: 10,
      tp: '20000000000000',
      sl: '15000000000000',
      referral: '0x0000000000000000000000000000000000000000',
    });
    expect(result.hash).toBe('0xabc123');
  });

  test('closeTrade() with different pair and index', async () => {
    const result = await contracts.closeTrade(5, 2);
    expect(result.hash).toBe('0xclose456');
  });

  test('cancelOrder() with different pair and index', async () => {
    const result = await contracts.cancelOrder(7, 3);
    expect(result.hash).toBe('0xcancel789');
  });

  test('constructor accepts custom contract addresses', () => {
    const customContracts = new OstiumContracts(
      'https://arb1.arbitrum.io/rpc',
      '0x' + '3'.repeat(64),
      {
        trading: '0x' + 'A'.repeat(40),
        storage: '0x' + 'B'.repeat(40),
        pairInfo: '0x' + 'C'.repeat(40),
        nftRewards: '0x' + 'D'.repeat(40),
        vault: '0x' + 'E'.repeat(40),
        collateral: '0x' + 'F'.repeat(40),
      }
    );
    expect(customContracts.getTraderAddress()).toBe(mockAddress);
  });

  test('openTrade() sell order', async () => {
    const result = await contracts.openTrade({
      pairIndex: 1,
      positionSizeDai: '50000000',
      openPrice: '30000000000000',
      buy: false,
      leverage: 20,
      tp: '0',
      sl: '0',
      referral: '0x0000000000000000000000000000000000000000',
    });
    expect(result.hash).toBe('0xabc123');
  });
});

// ============================================================================
// OstiumAdapter Additional Methods Tests
// ============================================================================

describe('OstiumAdapter Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchTicker per pair group', () => {
    let adapter: OstiumAdapter;

    beforeEach(async () => {
      adapter = new OstiumAdapter();
      await adapter.initialize();
    });

    test('fetchTicker for crypto pair (BTC)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pair: 'BTC/USD', price: '50000.00', timestamp: 1700000000000, source: 'pyth' }),
      } as Response);

      const ticker = await adapter.fetchTicker('BTC/USD:USD');
      expect(ticker.symbol).toBe('BTC/USD:USD');
      expect(ticker.last).toBe(50000);
    });

    test('fetchTicker for forex pair (EUR)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pair: 'EUR/USD', price: '1.08', timestamp: 1700000000000, source: 'pyth' }),
      } as Response);

      const ticker = await adapter.fetchTicker('EUR/USD:USD');
      expect(ticker.symbol).toBe('EUR/USD:USD');
      expect(ticker.last).toBe(1.08);
    });

    test('fetchTicker for stock pair (AAPL)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pair: 'AAPL/USD', price: '175.50', timestamp: 1700000000000, source: 'pyth' }),
      } as Response);

      const ticker = await adapter.fetchTicker('AAPL/USD:USD');
      expect(ticker.symbol).toBe('AAPL/USD:USD');
    });

    test('fetchTicker for commodity pair (XAU)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pair: 'XAU/USD', price: '2050.00', timestamp: 1700000000000, source: 'pyth' }),
      } as Response);

      const ticker = await adapter.fetchTicker('XAU/USD:USD');
      expect(ticker.symbol).toBe('XAU/USD:USD');
      expect(ticker.last).toBe(2050);
    });

    test('fetchTicker for index pair (SPX)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pair: 'SPX/USD', price: '4800.00', timestamp: 1700000000000, source: 'pyth' }),
      } as Response);

      const ticker = await adapter.fetchTicker('SPX/USD:USD');
      expect(ticker.symbol).toBe('SPX/USD:USD');
      expect(ticker.last).toBe(4800);
    });
  });

  describe('fetchTrades not supported', () => {
    test('should throw NotSupportedError (subgraph removed)', async () => {
      const adapter = new OstiumAdapter();
      await adapter.initialize();

      await expect(adapter.fetchTrades('BTC/USD:USD')).rejects.toThrow(NotSupportedError);
    });
  });

  describe('NotSupportedError methods', () => {
    let adapter: OstiumAdapter;

    beforeEach(async () => {
      adapter = new OstiumAdapter();
      await adapter.initialize();
    });

    test('fetchFundingRateHistory throws NotSupportedError', async () => {
      await expect(adapter.fetchFundingRateHistory('BTC/USD:USD')).rejects.toThrow(NotSupportedError);
    });

    test('fetchOrderHistory throws NotSupportedError', async () => {
      await expect(adapter.fetchOrderHistory('BTC/USD:USD')).rejects.toThrow(NotSupportedError);
    });

    test('fetchMyTrades throws NotSupportedError', async () => {
      await expect(adapter.fetchMyTrades('BTC/USD:USD')).rejects.toThrow(NotSupportedError);
    });

    test('fetchFundingRateHistory includes rollover fee message', async () => {
      await expect(adapter.fetchFundingRateHistory('BTC/USD:USD')).rejects.toThrow('rollover fees');
    });

    test('fetchOrderHistory includes REST message', async () => {
      await expect(adapter.fetchOrderHistory()).rejects.toThrow('not available via REST');
    });

    test('fetchMyTrades includes REST message', async () => {
      await expect(adapter.fetchMyTrades()).rejects.toThrow('not available via REST');
    });
  });

  describe('symbolToExchange and symbolFromExchange', () => {
    test('symbolToExchange converts unified to pair index string', () => {
      const adapter = new OstiumAdapter();
      // Access protected method via bracket notation
      const result = (adapter as unknown as { symbolToExchange: (s: string) => string }).symbolToExchange('BTC/USD:USD');
      expect(result).toBe('0');
    });

    test('symbolToExchange for AAPL', () => {
      const adapter = new OstiumAdapter();
      const result = (adapter as unknown as { symbolToExchange: (s: string) => string }).symbolToExchange('AAPL/USD:USD');
      expect(result).toBe('2');
    });

    test('symbolFromExchange converts pair index string to unified', () => {
      const adapter = new OstiumAdapter();
      const result = (adapter as unknown as { symbolFromExchange: (s: string) => string }).symbolFromExchange('0');
      expect(result).toBe('BTC/USD:USD');
    });

    test('symbolFromExchange for unknown index returns raw string', () => {
      const adapter = new OstiumAdapter();
      const result = (adapter as unknown as { symbolFromExchange: (s: string) => string }).symbolFromExchange('999');
      expect(result).toBe('999');
    });

    test('symbolFromExchange for EUR pair', () => {
      const adapter = new OstiumAdapter();
      const result = (adapter as unknown as { symbolFromExchange: (s: string) => string }).symbolFromExchange('5');
      expect(result).toBe('EUR/USD:USD');
    });
  });
});

// ============================================================================
// OstiumSubgraph Parameterized Queries Tests
// ============================================================================

describe('OstiumSubgraph Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetchTrades without pairIndex filter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { trades: [MOCK_TRADE] },
      }),
    } as Response);

    const subgraph = new OstiumSubgraph();
    const trades = await subgraph.fetchTrades(undefined, 50);

    expect(trades.length).toBe(1);
    expect(trades[0].id).toBe('cov-trade-1');

    // Verify the query uses variables (no string interpolation)
    const callBody = JSON.parse(mockFetch.mock.calls[0][1]!.body as string);
    expect(callBody.variables).toEqual({ first: 50 });
    expect(callBody.query).toContain('$first: Int!');
    expect(callBody.query).not.toContain('$pairIndex');
  });

  test('fetchTrades with pairIndex filter uses variables', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { trades: [MOCK_TRADE] },
      }),
    } as Response);

    const subgraph = new OstiumSubgraph();
    await subgraph.fetchTrades(2, 100);

    const callBody = JSON.parse(mockFetch.mock.calls[0][1]!.body as string);
    expect(callBody.variables).toEqual({ first: 100, pairIndex: '2' });
    expect(callBody.query).toContain('$pairIndex: String!');
    expect(callBody.query).toContain('where: { pairIndex: $pairIndex }');
  });

  test('fetchPositions uses variables with lowercased trader', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { positions: [MOCK_POSITION] },
      }),
    } as Response);

    const subgraph = new OstiumSubgraph();
    await subgraph.fetchPositions('0xABCD1234567890ABCDEF1234567890ABCDEF1234');

    const callBody = JSON.parse(mockFetch.mock.calls[0][1]!.body as string);
    expect(callBody.variables).toEqual({ trader: '0xabcd1234567890abcdef1234567890abcdef1234' });
    expect(callBody.query).toContain('$trader: String!');
  });

  test('fetchTrades network error handling', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

    const subgraph = new OstiumSubgraph();
    await expect(subgraph.fetchTrades(0)).rejects.toThrow('Network timeout');
  });

  test('fetchPositions network error handling', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

    const subgraph = new OstiumSubgraph();
    await expect(subgraph.fetchPositions(mockAddress)).rejects.toThrow('Connection refused');
  });

  test('fetchTrades with default limit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { trades: [] },
      }),
    } as Response);

    const subgraph = new OstiumSubgraph();
    await subgraph.fetchTrades(0);

    const callBody = JSON.parse(mockFetch.mock.calls[0][1]!.body as string);
    expect(callBody.variables.first).toBe(100);
  });

  test('fetchTrades subgraph error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        errors: [{ message: 'Invalid query syntax' }],
      }),
    } as Response);

    const subgraph = new OstiumSubgraph();
    await expect(subgraph.fetchTrades(0)).rejects.toThrow('Subgraph error');
  });

  test('fetchPositions returns empty array when no positions', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { positions: [] },
      }),
    } as Response);

    const subgraph = new OstiumSubgraph();
    const positions = await subgraph.fetchPositions(mockAddress);
    expect(positions).toEqual([]);
  });
});

// ============================================================================
// OstiumNormalizer with Real Pair Names Tests
// ============================================================================

describe('OstiumNormalizer Real Pair Names', () => {
  let normalizer: OstiumNormalizer;

  beforeEach(() => {
    normalizer = new OstiumNormalizer();
  });

  test('normalizeTrade returns real symbol for BTC (pairIndex 0)', () => {
    const trade = normalizer.normalizeTrade({ ...MOCK_TRADE, pairIndex: '0' });
    expect(trade.symbol).toBe('BTC/USD:USD');
  });

  test('normalizeTrade returns real symbol for ETH (pairIndex 1)', () => {
    const trade = normalizer.normalizeTrade({ ...MOCK_TRADE, pairIndex: '1' });
    expect(trade.symbol).toBe('ETH/USD:USD');
  });

  test('normalizeTrade returns UNKNOWN-N for unknown pairIndex', () => {
    const trade = normalizer.normalizeTrade({ ...MOCK_TRADE, pairIndex: '999' });
    expect(trade.symbol).toBe('UNKNOWN-999/USD:USD');
  });

  test('normalizePosition returns real symbol for ETH (pairIndex 1)', () => {
    const position = normalizer.normalizePosition(MOCK_POSITION);
    expect(position.symbol).toBe('ETH/USD:USD');
  });

  test('normalizePosition returns real symbol for BTC (pairIndex 0)', () => {
    const position = normalizer.normalizePosition({ ...MOCK_POSITION, pairIndex: '0' });
    expect(position.symbol).toBe('BTC/USD:USD');
  });

  test('normalizeOrderFromTrade returns real symbol for EUR (pairIndex 5)', () => {
    const order = normalizer.normalizeOrderFromTrade(MOCK_OPEN_TRADE);
    expect(order.symbol).toBe('EUR/USD:USD');
  });

  test('normalizeOrderFromTrade returns UNKNOWN-N for unknown pairIndex', () => {
    const order = normalizer.normalizeOrderFromTrade({ ...MOCK_OPEN_TRADE, pairIndex: 888 });
    expect(order.symbol).toBe('UNKNOWN-888/USD:USD');
  });
});

// ============================================================================
// PerpDEXError for toOstiumPairIndex Tests
// ============================================================================

describe('toOstiumPairIndex PerpDEXError', () => {
  test('throws PerpDEXError with PAIR_NOT_FOUND code', () => {
    try {
      toOstiumPairIndex('FAKE/USD:USD');
      fail('Expected PerpDEXError');
    } catch (error) {
      expect(error).toBeInstanceOf(PerpDEXError);
      expect((error as PerpDEXError).code).toBe('PAIR_NOT_FOUND');
      expect((error as PerpDEXError).exchange).toBe('ostium');
    }
  });

  test('throws PerpDEXError with descriptive message', () => {
    expect(() => toOstiumPairIndex('DOGE/USD:USD')).toThrow('Unknown Ostium pair: DOGE/USD:USD');
  });
});

// ============================================================================
// toUnifiedSymbol Coverage
// ============================================================================

describe('toUnifiedSymbol Coverage', () => {
  test('maps all 11 Ostium pairs correctly', () => {
    for (const pair of OSTIUM_PAIRS) {
      const symbol = toUnifiedSymbol(pair.pairIndex);
      expect(symbol).toBe(`${pair.from}/${pair.to}:${pair.to}`);
    }
  });

  test('returns UNKNOWN format for gap indices', () => {
    expect(toUnifiedSymbol(50)).toBe('UNKNOWN-50/USD:USD');
    expect(toUnifiedSymbol(-1)).toBe('UNKNOWN--1/USD:USD');
  });
});

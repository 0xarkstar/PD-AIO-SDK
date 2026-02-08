/**
 * dYdX Adapter Integration Tests
 *
 * Tests SDK wrapper integration (mocked fetch)
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { DydxAdapter } from '../../src/adapters/dydx/DydxAdapter.js';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('DydxAdapter Integration', () => {
  let adapter: DydxAdapter;
  let authAdapter: DydxAdapter;

  const mockMarketsResponse = {
    markets: {
      'BTC-USD': {
        ticker: 'BTC-USD',
        status: 'ACTIVE',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        oraclePrice: '50000',
        priceChange24H: '0.02',
        volume24H: '1000000',
        trades24H: 500,
        openInterest: '100',
        openInterestUSDC: '5000000',
        nextFundingRate: '0.0001',
        nextFundingAt: '2024-01-01T01:00:00Z',
        initialMarginFraction: '0.05',
        maintenanceMarginFraction: '0.03',
        stepSize: '0.001',
        stepBaseQuantums: 1000,
        subticksPerTick: 100,
        tickSize: '1',
        atomicResolution: -10,
        quantumConversionExponent: -9,
      },
    },
  };

  const mockOkResponse = (data: any): Response => ({
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  } as Response);

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();

    // Public adapter (no auth)
    adapter = new DydxAdapter({ testnet: true });

    // Authenticated adapter
    authAdapter = new DydxAdapter({
      testnet: true,
      mnemonic: 'test test test test test test test test test test test test test test test test test test test test test test test test',
    });
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  // ============================================================================
  // Market Data
  // ============================================================================

  test('should fetch markets via HTTP client', async () => {
    // Mock for initialize
    mockFetch.mockResolvedValueOnce(mockOkResponse(mockMarketsResponse));
    await adapter.initialize();

    // Mock for fetchMarkets
    mockFetch.mockResolvedValueOnce(mockOkResponse(mockMarketsResponse));
    const markets = await adapter.fetchMarkets();

    expect(markets).toBeDefined();
    expect(markets.length).toBeGreaterThan(0);
    expect(markets[0].symbol).toBe('BTC/USD:USD');
  });

  test('should fetch ticker', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse(mockMarketsResponse));
    await adapter.initialize();

    mockFetch.mockResolvedValueOnce(mockOkResponse(mockMarketsResponse));
    const ticker = await adapter.fetchTicker('BTC/USD:USD');

    expect(ticker.symbol).toBe('BTC/USD:USD');
    expect(ticker.last).toBeGreaterThan(0);
  });

  test('should fetch order book', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse(mockMarketsResponse));
    await adapter.initialize();

    mockFetch.mockResolvedValueOnce(mockOkResponse({
      bids: [{ price: '50000', size: '1.5' }],
      asks: [{ price: '50100', size: '1.2' }],
    }));

    const orderBook = await adapter.fetchOrderBook('BTC/USD:USD');

    expect(orderBook.symbol).toBe('BTC/USD:USD');
    expect(orderBook.bids.length).toBeGreaterThan(0);
    expect(orderBook.asks.length).toBeGreaterThan(0);
  });

  test('should fetch trades', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse(mockMarketsResponse));
    await adapter.initialize();

    mockFetch.mockResolvedValueOnce(mockOkResponse({
      trades: [
        {
          id: 'trade-1',
          side: 'BUY',
          size: '0.5',
          price: '49500',
          type: 'LIMIT',
          createdAt: '2024-01-01T10:00:00Z',
          createdAtHeight: '5000',
        },
      ],
    }));

    const trades = await adapter.fetchTrades('BTC/USD:USD');

    expect(trades.length).toBeGreaterThan(0);
    expect(trades[0].symbol).toBe('BTC/USD:USD');
  });

  test('should fetch funding rate', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse(mockMarketsResponse));
    await adapter.initialize();

    mockFetch.mockResolvedValueOnce(mockOkResponse(mockMarketsResponse));
    const fundingRate = await adapter.fetchFundingRate('BTC/USD:USD');

    expect(fundingRate.symbol).toBe('BTC/USD:USD');
    expect(fundingRate.fundingRate).toBeDefined();
    expect(fundingRate.fundingIntervalHours).toBe(1);
  });

  test('should fetch funding rate history', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse(mockMarketsResponse));
    await adapter.initialize();

    mockFetch.mockResolvedValueOnce(mockOkResponse({
      historicalFunding: [
        {
          ticker: 'BTC-USD',
          rate: '0.00012',
          price: '50000',
          effectiveAt: '2024-01-01T01:00:00Z',
          effectiveAtHeight: '10000',
        },
      ],
    }));

    // Mock additional market fetch for oracle price
    mockFetch.mockResolvedValueOnce(mockOkResponse(mockMarketsResponse));

    const history = await adapter.fetchFundingRateHistory('BTC/USD:USD', undefined, 1);

    expect(history.length).toBeGreaterThan(0);
    expect(history[0].symbol).toBe('BTC/USD:USD');
  });

  test('should fetch OHLCV data', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse(mockMarketsResponse));
    await adapter.initialize();

    mockFetch.mockResolvedValueOnce(mockOkResponse({
      candles: [
        {
          startedAt: '2024-01-01T00:00:00Z',
          ticker: 'BTC-USD',
          resolution: '1HOUR',
          low: '49500',
          high: '50500',
          open: '50000',
          close: '50200',
          baseTokenVolume: '100',
          usdVolume: '5000000',
          trades: 250,
          startingOpenInterest: '1000',
          orderbookMidPriceOpen: '50000',
          orderbookMidPriceClose: '50200',
        },
      ],
    }));

    const candles = await adapter.fetchOHLCV('BTC/USD:USD', '1h', { limit: 1 });

    expect(candles.length).toBeGreaterThan(0);
    expect(candles[0]).toHaveLength(6); // [timestamp, open, high, low, close, volume]
  });

  // ============================================================================
  // Error Handling
  // ============================================================================

  test('should handle API initialization errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(adapter.initialize()).rejects.toThrow();
  });

  test('should handle market not found error', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse(mockMarketsResponse));
    await adapter.initialize();

    mockFetch.mockResolvedValueOnce(mockOkResponse({ markets: {} }));

    await expect(adapter.fetchTicker('INVALID/USD:USD')).rejects.toThrow(/not found/);
  });

  test('should handle authentication requirement for trading', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse(mockMarketsResponse));
    await adapter.initialize();

    await expect(
      adapter.createOrder({
        symbol: 'BTC/USD:USD',
        side: 'buy',
        type: 'market',
        amount: 0.1,
      })
    ).rejects.toThrow(/Authentication required/);
  });

  test('should throw error for unsupported trading operations', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse(mockMarketsResponse));
    await adapter.initialize();

    // dYdX adapter requires official SDK for trading
    await expect(
      adapter.createOrder({
        symbol: 'BTC/USD:USD',
        side: 'buy',
        type: 'market',
        amount: 0.1,
      })
    ).rejects.toThrow();
  });
});

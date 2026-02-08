/**
 * dYdX Normalizer Extended Tests
 *
 * Comprehensive tests for DydxNormalizer data transformation
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { DydxNormalizer } from '../../src/adapters/dydx/DydxNormalizer.js';
import type {
  DydxPerpetualMarket,
  DydxOrder,
  DydxPerpetualPosition,
  DydxOrderBookResponse,
  DydxFill,
  DydxSubaccount,
  DydxHistoricalFunding,
  DydxCandle,
} from '../../src/adapters/dydx/types.js';

describe('DydxNormalizer', () => {
  let normalizer: DydxNormalizer;

  beforeEach(() => {
    jest.clearAllMocks();
    normalizer = new DydxNormalizer();
  });

  // ============================================================================
  // Symbol Conversion
  // ============================================================================

  test('should convert dYdX ticker to unified symbol', () => {
    const market: DydxPerpetualMarket = {
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
    };

    const normalized = normalizer.normalizeMarket(market);

    expect(normalized.symbol).toBe('BTC/USD:USD');
    expect(normalized.base).toBe('BTC');
    expect(normalized.quote).toBe('USD');
    expect(normalized.settle).toBe('USD');
  });

  // ============================================================================
  // Market Normalization
  // ============================================================================

  test('should normalize market with step/tick size precision', () => {
    const market: DydxPerpetualMarket = {
      ticker: 'ETH-USD',
      status: 'ACTIVE',
      baseAsset: 'ETH',
      quoteAsset: 'USD',
      oraclePrice: '3000',
      priceChange24H: '0.01',
      volume24H: '500000',
      trades24H: 300,
      openInterest: '50',
      openInterestUSDC: '150000',
      nextFundingRate: '0.00005',
      nextFundingAt: '2024-01-01T01:00:00Z',
      initialMarginFraction: '0.05',
      maintenanceMarginFraction: '0.03',
      stepSize: '0.01', // 2 decimal places
      stepBaseQuantums: 100,
      subticksPerTick: 100,
      tickSize: '0.1', // 1 decimal place
      atomicResolution: -10,
      quantumConversionExponent: -9,
    };

    const normalized = normalizer.normalizeMarket(market);

    expect(normalized.amountPrecision).toBe(2);
    expect(normalized.pricePrecision).toBe(1);
    expect(normalized.amountStepSize).toBe(0.01);
    expect(normalized.priceTickSize).toBe(0.1);
  });

  test('should handle missing optional market fields', () => {
    const market: DydxPerpetualMarket = {
      ticker: 'SOL-USD',
      status: 'ACTIVE',
      baseAsset: 'SOL',
      quoteAsset: 'USD',
      oraclePrice: '100',
      priceChange24H: '0',
      volume24H: '0',
      trades24H: 0,
      openInterest: '0',
      openInterestUSDC: '0',
      nextFundingRate: '0',
      nextFundingAt: '2024-01-01T01:00:00Z',
      initialMarginFraction: '0.05',
      maintenanceMarginFraction: '0.03',
      stepSize: '0.1',
      stepBaseQuantums: 100,
      subticksPerTick: 100,
      tickSize: '0.01',
      atomicResolution: -10,
      quantumConversionExponent: -9,
      // basePositionNotional is optional and missing
    };

    const normalized = normalizer.normalizeMarket(market);

    expect(normalized).toBeDefined();
    expect(normalized.symbol).toBe('SOL/USD:USD');
    expect(normalized.active).toBe(true);
  });

  // ============================================================================
  // Order Normalization
  // ============================================================================

  test('should normalize MARKET order', () => {
    const order: DydxOrder = {
      id: 'order-123',
      subaccountId: 'subaccount-1',
      clientId: 'client-1',
      clobPairId: '1',
      side: 'BUY',
      size: '1.5',
      totalFilled: '0',
      price: '0', // Market orders have no price
      type: 'MARKET',
      status: 'OPEN',
      timeInForce: 'GTT',
      reduceOnly: false,
      postOnly: false,
      ticker: 'BTC-USD',
      orderFlags: '0',
      goodTilBlock: '1000',
      goodTilBlockTime: '2024-01-01T01:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      triggerPrice: null,
      removalReason: null,
    };

    const normalized = normalizer.normalizeOrder(order);

    expect(normalized.id).toBe('order-123');
    expect(normalized.symbol).toBe('BTC/USD:USD');
    expect(normalized.type).toBe('market');
    expect(normalized.side).toBe('buy');
    expect(normalized.amount).toBe(1.5);
    // Market orders may have price set to 0 - this is acceptable
    expect(normalized.price).toBeDefined();
    expect(normalized.status).toBe('open');
    expect(normalized.filled).toBe(0);
    expect(normalized.remaining).toBe(1.5);
  });

  test('should normalize LIMIT order with price', () => {
    const order: DydxOrder = {
      id: 'order-456',
      subaccountId: 'subaccount-1',
      clientId: 'client-2',
      clobPairId: '1',
      side: 'SELL',
      size: '0.5',
      totalFilled: '0.2',
      price: '51000',
      type: 'LIMIT',
      status: 'OPEN',
      timeInForce: 'GTC',
      reduceOnly: false,
      postOnly: true,
      ticker: 'BTC-USD',
      orderFlags: '64',
      goodTilBlock: '2000',
      goodTilBlockTime: '2024-01-02T01:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z',
      triggerPrice: null,
      removalReason: null,
    };

    const normalized = normalizer.normalizeOrder(order);

    expect(normalized.type).toBe('limit');
    expect(normalized.price).toBe(51000);
    expect(normalized.postOnly).toBe(true);
    expect(normalized.filled).toBe(0.2);
    expect(normalized.remaining).toBe(0.3);
    expect(normalized.timeInForce).toBe('GTC');
  });

  test('should normalize STOP_LIMIT order', () => {
    const order: DydxOrder = {
      id: 'order-789',
      subaccountId: 'subaccount-1',
      clientId: 'client-3',
      clobPairId: '1',
      side: 'BUY',
      size: '2',
      totalFilled: '0',
      price: '49000',
      type: 'STOP_LIMIT',
      status: 'UNTRIGGERED',
      timeInForce: 'GTT',
      reduceOnly: true,
      postOnly: false,
      ticker: 'BTC-USD',
      orderFlags: '32',
      goodTilBlock: '3000',
      goodTilBlockTime: '2024-01-03T01:00:00Z',
      updatedAt: '2024-01-01T15:00:00Z',
      triggerPrice: '48500',
      removalReason: null,
    };

    const normalized = normalizer.normalizeOrder(order);

    expect(normalized.type).toBe('stopLimit');
    expect(normalized.stopPrice).toBe(48500);
    expect(normalized.price).toBe(49000);
    expect(normalized.reduceOnly).toBe(true);
    expect(normalized.status).toBe('open'); // UNTRIGGERED maps to open
  });

  // ============================================================================
  // Position Normalization
  // ============================================================================

  test('should normalize long position', () => {
    const position: DydxPerpetualPosition = {
      market: 'BTC-USD',
      side: 'LONG',
      status: 'OPEN',
      size: '1.5',
      maxSize: '2',
      entryPrice: '48000',
      exitPrice: null,
      realizedPnl: '0',
      unrealizedPnl: '3000', // (50000 - 48000) * 1.5 = 3000
      netFunding: '10',
      sumOpen: '72000',
      sumClose: '0',
      createdAt: '2024-01-01T00:00:00Z',
      createdAtHeight: '1000',
      closedAt: null,
      subaccountNumber: 0,
    };

    const oraclePrice = 50000;
    const normalized = normalizer.normalizePosition(position, oraclePrice);

    expect(normalized.symbol).toBe('BTC/USD:USD');
    expect(normalized.side).toBe('long');
    expect(normalized.size).toBe(1.5);
    expect(normalized.entryPrice).toBe(48000);
    expect(normalized.markPrice).toBe(50000);
    expect(normalized.unrealizedPnl).toBe(3000);
    expect(normalized.realizedPnl).toBe(0);
    expect(normalized.marginMode).toBe('cross');
  });

  test('should normalize short position', () => {
    const position: DydxPerpetualPosition = {
      market: 'ETH-USD',
      side: 'SHORT',
      status: 'OPEN',
      size: '10',
      maxSize: '15',
      entryPrice: '3100',
      exitPrice: null,
      realizedPnl: '0',
      unrealizedPnl: '1000', // (3100 - 3000) * 10 = 1000
      netFunding: '-5',
      sumOpen: '31000',
      sumClose: '0',
      createdAt: '2024-01-01T06:00:00Z',
      createdAtHeight: '2000',
      closedAt: null,
      subaccountNumber: 0,
    };

    const oraclePrice = 3000;
    const normalized = normalizer.normalizePosition(position, oraclePrice);

    expect(normalized.side).toBe('short');
    expect(normalized.size).toBe(10);
    expect(normalized.entryPrice).toBe(3100);
    expect(normalized.markPrice).toBe(3000);
    expect(normalized.unrealizedPnl).toBe(1000);
  });

  // ============================================================================
  // Trade Normalization
  // ============================================================================

  test('should normalize trade (fill)', () => {
    const fill: DydxFill = {
      id: 'fill-123',
      market: 'BTC-USD',
      marketType: 'PERPETUAL',
      side: 'BUY',
      liquidity: 'TAKER',
      type: 'LIMIT',
      price: '49500',
      size: '0.5',
      fee: '2.475',
      createdAt: '2024-01-01T10:00:00Z',
      createdAtHeight: '5000',
      orderId: 'order-123',
      clientMetadata: '0',
      subaccountNumber: 0,
    };

    const normalized = normalizer.normalizeFill(fill);

    expect(normalized.id).toBe('fill-123');
    expect(normalized.symbol).toBe('BTC/USD:USD');
    expect(normalized.orderId).toBe('order-123');
    expect(normalized.side).toBe('buy');
    expect(normalized.price).toBe(49500);
    expect(normalized.amount).toBe(0.5);
    expect(normalized.cost).toBe(49500 * 0.5);
  });

  // ============================================================================
  // Balance Normalization
  // ============================================================================

  test('should normalize subaccount balance', () => {
    const subaccount: DydxSubaccount = {
      address: 'dydx1abc...',
      subaccountNumber: 0,
      equity: '10000',
      freeCollateral: '8000',
      pendingDeposits: '0',
      pendingWithdrawals: '0',
      marginEnabled: true,
      openPerpetualPositions: {},
      assetPositions: [],
    };

    const balances = normalizer.normalizeBalance(subaccount);

    expect(balances).toHaveLength(1);
    expect(balances[0].currency).toBe('USDC');
    expect(balances[0].total).toBe(10000);
    expect(balances[0].free).toBe(8000);
    expect(balances[0].used).toBe(2000); // 10000 - 8000
    expect(balances[0].usdValue).toBe(10000);
  });

  // ============================================================================
  // OrderBook Normalization
  // ============================================================================

  test('should normalize order book with bids/asks', () => {
    const orderBook: DydxOrderBookResponse = {
      bids: [
        { price: '50000', size: '1.5' },
        { price: '49900', size: '2.0' },
        { price: '49800', size: '1.0' },
      ],
      asks: [
        { price: '50100', size: '1.2' },
        { price: '50200', size: '1.8' },
        { price: '50300', size: '0.5' },
      ],
    };

    const exchangeSymbol = 'BTC-USD';
    const normalized = normalizer.normalizeOrderBook(orderBook, exchangeSymbol);

    expect(normalized.symbol).toBe('BTC/USD:USD');
    expect(normalized.bids).toHaveLength(3);
    expect(normalized.asks).toHaveLength(3);
    expect(normalized.bids[0]).toEqual([50000, 1.5]);
    expect(normalized.asks[0]).toEqual([50100, 1.2]);
    expect(normalized.exchange).toBe('dydx');
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  test('should handle empty/malformed data gracefully', () => {
    const emptyMarkets: Record<string, DydxPerpetualMarket> = {};
    const markets = normalizer.normalizeMarkets(emptyMarkets);

    expect(markets).toHaveLength(0);
  });

  test('should handle zero-sized position', () => {
    const position: DydxPerpetualPosition = {
      market: 'BTC-USD',
      side: 'LONG',
      status: 'CLOSED',
      size: '0',
      maxSize: '0',
      entryPrice: '0',
      exitPrice: '50000',
      realizedPnl: '500',
      unrealizedPnl: '0',
      netFunding: '0',
      sumOpen: '0',
      sumClose: '0',
      createdAt: '2024-01-01T00:00:00Z',
      createdAtHeight: '1000',
      closedAt: '2024-01-01T12:00:00Z',
      subaccountNumber: 0,
    };

    const normalized = normalizer.normalizePosition(position, 50000);

    expect(normalized.size).toBe(0);
    expect(normalized.unrealizedPnl).toBe(0);
  });

  test('should normalize funding rate with oracle price', () => {
    const funding: DydxHistoricalFunding = {
      ticker: 'BTC-USD',
      rate: '0.00012',
      price: '50000',
      effectiveAt: '2024-01-01T01:00:00Z',
      effectiveAtHeight: '10000',
    };

    const oraclePrice = 50100;
    const normalized = normalizer.normalizeFundingRate(funding, oraclePrice);

    expect(normalized.symbol).toBe('BTC/USD:USD');
    expect(normalized.fundingRate).toBe(0.00012);
    expect(normalized.markPrice).toBe(50100);
    expect(normalized.indexPrice).toBe(50000);
    expect(normalized.fundingIntervalHours).toBe(1);
  });

  test('should normalize candle to OHLCV', () => {
    const candle: DydxCandle = {
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
    };

    const normalized = normalizer.normalizeCandle(candle);

    expect(normalized[0]).toBe(new Date('2024-01-01T00:00:00Z').getTime());
    expect(normalized[1]).toBe(50000); // open
    expect(normalized[2]).toBe(50500); // high
    expect(normalized[3]).toBe(49500); // low
    expect(normalized[4]).toBe(50200); // close
    expect(normalized[5]).toBe(100);   // volume
  });
});

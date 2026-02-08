/**
 * Drift Normalizer Extended Tests
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { DriftNormalizer } from '../../src/adapters/drift/DriftNormalizer.js';
import type {
  DriftPerpPosition,
  DriftOrder,
  DriftL2OrderBook,
  DriftTrade,
  DriftFundingRate,
  DriftSpotPosition,
} from '../../src/adapters/drift/types.js';

describe('DriftNormalizer', () => {
  let normalizer: DriftNormalizer;

  beforeEach(() => {
    jest.clearAllMocks();
    normalizer = new DriftNormalizer();
  });

  // ============================================================================
  // Market Normalization
  // ============================================================================

  test('should normalize market with oracle price', () => {
    const mockMarket = {
      marketIndex: 0,
      status: 'active' as const,
      name: 'SOL-PERP',
      contractTier: 'A',
      marginRatioInitial: 2000, // 20% in basis points
      marginRatioMaintenance: 500, // 5%
      imfFactor: 0,
      numberOfUsers: 1000,
      amm: {
        orderTickSize: '1000000', // Price precision
        orderStepSize: '100000000', // Amount precision
        minOrderSize: '10000000', // Min order
        maxPositionSize: '100000000000', // Max position
      },
    };

    const normalized = normalizer.normalizeMarket(mockMarket as any);

    expect(normalized.symbol).toBe('SOL/USD:USD');
    expect(normalized.base).toBe('SOL');
    expect(normalized.quote).toBe('USD');
    expect(normalized.settle).toBe('USD');
    expect(normalized.active).toBe(true);
    expect(normalized.marginMode).toBeUndefined(); // Markets don't have margin mode, positions do
  });

  // ============================================================================
  // Order Normalization
  // ============================================================================

  test('should normalize order with reduceOnly flag', () => {
    const order: DriftOrder = {
      status: 'open',
      orderType: 'limit',
      marketType: 'perp',
      slot: 12345,
      orderId: 42,
      userOrderId: 100,
      marketIndex: 0,
      price: '50000000000', // 50 USD in PRICE_PRECISION
      baseAssetAmount: '1000000000', // 1 SOL in BASE_PRECISION
      baseAssetAmountFilled: '0',
      quoteAssetAmountFilled: '0',
      direction: 'long',
      reduceOnly: true,
      triggerPrice: '0',
      triggerCondition: 'above',
      existingPositionDirection: 'long',
      postOnly: 'none',
      immediateOrCancel: false,
      oraclePriceOffset: 0,
      auctionDuration: 0,
      auctionStartPrice: '0',
      auctionEndPrice: '0',
      maxTs: '0',
    };

    const normalized = normalizer.normalizeOrder(order, 50);

    expect(normalized.symbol).toBe('SOL/USD:USD');
    expect(normalized.type).toBe('limit');
    expect(normalized.side).toBe('buy');
    expect(normalized.reduceOnly).toBe(true);
    expect(normalized.status).toBe('open');
  });

  // ============================================================================
  // Position Normalization
  // ============================================================================

  test('should normalize position with leverage', () => {
    const position: DriftPerpPosition = {
      marketIndex: 0,
      baseAssetAmount: '1000000000', // 1 SOL
      quoteAssetAmount: '50000000', // 50 USD
      quoteEntryAmount: '48000000', // 48 USD entry
      quoteBreakEvenAmount: '48000000',
      openOrders: 0,
      openBids: '0',
      openAsks: '0',
      settledPnl: '0',
      lpShares: '0',
      lastCumulativeFundingRate: '0',
      perLpBase: 0,
    };

    const markPrice = 50;
    const oraclePrice = 50;

    const normalized = normalizer.normalizePosition(position, markPrice, oraclePrice);

    expect(normalized.symbol).toBe('SOL/USD:USD');
    expect(normalized.side).toBe('long'); // Positive baseAssetAmount
    expect(normalized.size).toBeCloseTo(1, 1);
    expect(normalized.markPrice).toBe(50);
    expect(normalized.marginMode).toBe('cross');
    expect(normalized.leverage).toBeGreaterThan(0);
  });

  test('should handle short position', () => {
    const position: DriftPerpPosition = {
      marketIndex: 1,
      baseAssetAmount: '-2000000000', // -2 ETH (short)
      quoteAssetAmount: '6000000', // 6000 USD
      quoteEntryAmount: '6200000', // 6200 USD entry
      quoteBreakEvenAmount: '6200000',
      openOrders: 0,
      openBids: '0',
      openAsks: '0',
      settledPnl: '100000',
      lpShares: '0',
      lastCumulativeFundingRate: '0',
      perLpBase: 0,
    };

    const markPrice = 3000;
    const oraclePrice = 3000;

    const normalized = normalizer.normalizePosition(position, markPrice, oraclePrice);

    expect(normalized.side).toBe('short'); // Negative baseAssetAmount
    expect(normalized.size).toBeCloseTo(2, 1);
  });

  // ============================================================================
  // Balance Normalization
  // ============================================================================

  test('should normalize balance with unsettled PnL', () => {
    const spotPosition: DriftSpotPosition = {
      marketIndex: 0,
      scaledBalance: '10000000', // 10 USDC
      balanceType: 'deposit',
      openOrders: 0,
      cumulativeDeposits: '10000000',
    };

    const tokenPrice = 1.0;
    const tokenSymbol = 'USDC';

    const normalized = normalizer.normalizeBalance(spotPosition, tokenPrice, tokenSymbol);

    expect(normalized.currency).toBe('USDC');
    expect(normalized.total).toBeGreaterThan(0);
    expect(normalized.balanceType).toBeUndefined(); // balanceType is in info
    expect(normalized.info?.balanceType).toBe('deposit');
  });

  test('should handle borrow balance type', () => {
    const spotPosition: DriftSpotPosition = {
      marketIndex: 0,
      scaledBalance: '5000000', // 5 USDC borrowed
      balanceType: 'borrow',
      openOrders: 0,
      cumulativeDeposits: '0',
    };

    const tokenPrice = 1.0;
    const tokenSymbol = 'USDC';

    const normalized = normalizer.normalizeBalance(spotPosition, tokenPrice, tokenSymbol);

    expect(normalized.currency).toBe('USDC');
    expect(normalized.total).toBeLessThan(0); // Borrows are negative
    expect(normalized.used).toBeGreaterThan(0);
  });

  // ============================================================================
  // Order Book Normalization
  // ============================================================================

  test('should handle perp vs spot markets', () => {
    const orderbook: DriftL2OrderBook = {
      marketIndex: 0,
      slot: 12345,
      oraclePrice: '50000000000',
      bids: [
        { price: '50000000000', size: '1000000000' },
      ],
      asks: [
        { price: '50100000000', size: '800000000' },
      ],
    };

    const normalized = normalizer.normalizeOrderBook(orderbook);

    expect(normalized.symbol).toBe('SOL/USD:USD');
    expect(normalized.bids).toHaveLength(1);
    expect(normalized.asks).toHaveLength(1);
    expect(normalized.exchange).toBe('drift');
  });

  // ============================================================================
  // Trade Normalization
  // ============================================================================

  test('should normalize funding rate', () => {
    const funding: DriftFundingRate = {
      marketIndex: 0,
      ts: 1704067200, // Unix timestamp in seconds
      fundingRate: '100', // 0.0001% in FUNDING_RATE_PRECISION
      fundingRateLong: '100',
      fundingRateShort: '100',
      cumulativeFundingRateLong: '10000',
      cumulativeFundingRateShort: '10000',
      oraclePrice: '50000000000',
      markPriceTwap: '50050000000',
    };

    const normalized = normalizer.normalizeFundingRate(funding);

    expect(normalized.symbol).toBe('SOL/USD:USD');
    expect(normalized.fundingRate).toBeDefined();
    expect(normalized.fundingIntervalHours).toBe(1);
    expect(normalized.markPrice).toBeGreaterThan(0);
  });

  test('should normalize trade', () => {
    const trade: DriftTrade = {
      recordId: 'trade-123',
      fillRecordId: 'fill-123',
      marketIndex: 0,
      ts: 1704067200,
      slot: 12345,
      baseAssetAmount: '1000000000',
      fillPrice: '50000000000',
      takerOrderDirection: 'long',
      taker: 'taker-pubkey',
      maker: 'maker-pubkey',
      txSig: 'signature-xyz',
    };

    const normalized = normalizer.normalizeTrade(trade);

    expect(normalized.symbol).toBe('SOL/USD:USD');
    expect(normalized.side).toBe('buy'); // long direction
    expect(normalized.price).toBeGreaterThan(0);
    expect(normalized.amount).toBeGreaterThan(0);
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  test('should handle missing optional fields', () => {
    const minimalPosition: DriftPerpPosition = {
      marketIndex: 0,
      baseAssetAmount: '1000000000',
      quoteAssetAmount: '50000000',
      quoteEntryAmount: '50000000',
      quoteBreakEvenAmount: '50000000',
      openOrders: 0,
      openBids: '0',
      openAsks: '0',
      settledPnl: '0',
      lpShares: '0',
      lastCumulativeFundingRate: '0',
      perLpBase: 0,
    };

    const normalized = normalizer.normalizePosition(minimalPosition, 50, 50);

    expect(normalized).toBeDefined();
    expect(normalized.symbol).toBeDefined();
    expect(normalized.side).toBe('long');
  });

  test('should convert Drift symbols to unified', () => {
    const orderbook: DriftL2OrderBook = {
      marketIndex: 1, // ETH-PERP
      slot: 12345,
      oraclePrice: '3000000000000',
      bids: [],
      asks: [],
    };

    const normalized = normalizer.normalizeOrderBook(orderbook);

    expect(normalized.symbol).toContain('/USD:USD');
  });
});

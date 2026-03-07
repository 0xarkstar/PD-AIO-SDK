/**
 * DriftNormalizer Branch Coverage Tests
 *
 * Tests for funding rate union type variations:
 * - Raw integer values (|value| > 1000) vs pre-processed decimal values (|value| < 1)
 * - DriftFundingRate (has oraclePrice) vs DriftFundingRateRecord (has oraclePriceTwap)
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { DriftNormalizer } from '../../src/adapters/drift/DriftNormalizer.js';
import type {
  DriftFundingRate,
  DriftFundingRateRecord,
} from '../../src/adapters/drift/types.js';

describe('DriftNormalizer Funding Rate Branches', () => {
  let normalizer: DriftNormalizer;

  beforeEach(() => {
    normalizer = new DriftNormalizer();
  });

  // ============================================================================
  // Pre-processed decimal values (|value| < 1000) — Data API format
  // ============================================================================

  test('should handle pre-processed funding rate (small decimal)', () => {
    const funding: DriftFundingRate = {
      marketIndex: 0,
      fundingRate: '0.0001', // Already processed, not raw
      fundingRateLong: '0.0001',
      fundingRateShort: '-0.0001',
      cumulativeFundingRateLong: '0.01',
      cumulativeFundingRateShort: '-0.01',
      oraclePrice: '100.5', // Pre-processed price
      markPriceTwap: '100.6', // Pre-processed price
      ts: 1700000000,
    };

    const normalized = normalizer.normalizeFundingRate(funding);

    // Small values should pass through without division
    expect(normalized.fundingRate).toBe(0.0001);
    expect(normalized.markPrice).toBeCloseTo(100.6, 1);
    expect(normalized.indexPrice).toBeCloseTo(100.5, 1);
  });

  test('should handle pre-processed funding rate record (small decimal)', () => {
    const fundingRecord: DriftFundingRateRecord = {
      recordId: 'rec-1',
      marketIndex: 0,
      fundingRate: '0.0002',
      fundingRateLong: '0.0002',
      fundingRateShort: '-0.0002',
      cumulativeFundingRateLong: '0.02',
      cumulativeFundingRateShort: '-0.02',
      oraclePriceTwap: '50.5', // Pre-processed
      markPriceTwap: '50.6', // Pre-processed
      periodRevenue: '1000',
      baseAssetAmountWithAmm: '0',
      baseAssetAmountWithUnsettledLp: '0',
      ts: 1700000000,
    };

    const normalized = normalizer.normalizeFundingRate(fundingRecord);

    expect(normalized.fundingRate).toBe(0.0002);
    expect(normalized.markPrice).toBeCloseTo(50.6, 1);
    expect(normalized.indexPrice).toBeCloseTo(50.5, 1);
  });

  // ============================================================================
  // DriftFundingRate without markPriceTwap — uses oraclePrice fallback
  // ============================================================================

  test('should use oraclePrice parameter when markPriceTwap is missing', () => {
    const funding: DriftFundingRate = {
      marketIndex: 0,
      fundingRate: '0.00005',
      fundingRateLong: '0.00005',
      fundingRateShort: '-0.00005',
      cumulativeFundingRateLong: '0.005',
      cumulativeFundingRateShort: '-0.005',
      oraclePrice: '200.0',
      markPriceTwap: '0', // Zero — triggers oraclePrice fallback path
      ts: 1700000000,
    };

    const normalized = normalizer.normalizeFundingRate(funding, 199.5);

    // markPriceTwap is '0' which parses to 0, so heuristic: 0 < 1000, passes through as 0
    // But the code checks 'markPriceTwap' in validated first
    expect(normalized.fundingRate).toBe(0.00005);
    expect(normalized.indexPrice).toBeCloseTo(200.0, 1);
  });

  // ============================================================================
  // DriftFundingRateRecord — oraclePriceTwap path
  // ============================================================================

  test('should use oraclePriceTwap from FundingRateRecord', () => {
    const fundingRecord: DriftFundingRateRecord = {
      recordId: 'rec-2',
      marketIndex: 1,
      fundingRate: '500', // |500| < 1000, still pre-processed range
      fundingRateLong: '500',
      fundingRateShort: '-500',
      cumulativeFundingRateLong: '50000',
      cumulativeFundingRateShort: '-50000',
      oraclePriceTwap: '45000', // |45000| > 1000, needs division
      markPriceTwap: '45050', // |45050| > 1000, needs division
      periodRevenue: '0',
      baseAssetAmountWithAmm: '0',
      baseAssetAmountWithUnsettledLp: '0',
      ts: 1700000000,
    };

    const normalized = normalizer.normalizeFundingRate(fundingRecord);

    expect(normalized.fundingRate).toBe(500); // 500 < 1000, passes through
    // 45050 > 1000, so divided by DRIFT_PRECISION.PRICE
    expect(normalized.markPrice).toBeGreaterThan(0);
    expect(normalized.indexPrice).toBeGreaterThan(0);
  });

  // ============================================================================
  // Symbol conversion methods
  // ============================================================================

  test('should normalize exchange symbol to unified', () => {
    expect(normalizer.normalizeSymbol('SOL-PERP')).toBe('SOL/USD:USD');
  });

  test('should convert unified symbol to exchange', () => {
    expect(normalizer.toExchangeSymbol('SOL/USD:USD')).toBe('SOL-PERP');
  });

  // ============================================================================
  // Market normalization edge cases
  // ============================================================================

  test('should handle unknown market index', () => {
    const market = {
      marketIndex: 999, // No mapping exists
      status: 'active',
      name: 'UNKNOWN-PERP',
      marginRatioInitial: 500,
      marginRatioMaintenance: 300,
      imfFactor: 0,
      numberOfUsers: 0,
      numberOfUsersWithBase: 0,
      unrealizedPnlImfFactor: 0,
      liquidatorFee: 0,
      ifLiquidationFee: 0,
      contractType: 'perpetual',
      contractTier: 'A',
      pausedOperations: 0,
      quoteSpotMarketIndex: 0,
      feeAdjustment: 0,
      expiryTs: '0',
      expiryPrice: '0',
      unrealizedPnlMaxImbalance: '0',
      nextFillRecordId: '1',
      nextFundingRateRecordId: '1',
      nextCurveRecordId: '1',
      pnlPool: { scaledBalance: '0', marketIndex: 0 },
      insuranceClaim: {
        revenueWithdrawSinceLastSettle: '0',
        maxRevenueWithdrawPerPeriod: '0',
        lastRevenueWithdrawTs: '0',
        quoteSettledInsurance: '0',
        quoteMaxInsurance: '0',
      },
      amm: {},
    };

    const normalized = normalizer.normalizeMarket(market as any);
    // Should use fallback symbol based on marketIndex
    expect(normalized.id).toContain('999');
  });

  // ============================================================================
  // Order normalization — canceled and expired statuses
  // ============================================================================

  test('should normalize canceled order status', () => {
    const order = {
      orderId: 100,
      userOrderId: 0,
      marketIndex: 0,
      status: 'canceled',
      orderType: 'limit',
      marketType: 'perp',
      direction: 'long',
      baseAssetAmount: '1000000000',
      baseAssetAmountFilled: '0',
      quoteAssetAmountFilled: '0',
      price: '50000000000',
      reduceOnly: false,
      triggerPrice: '0',
      triggerCondition: 'above',
      existingPositionDirection: 'long',
      postOnly: 'none',
      immediateOrCancel: false,
      maxTs: '0',
      oraclePriceOffset: 0,
      auctionDuration: 0,
      auctionStartPrice: '0',
      auctionEndPrice: '0',
      slot: 100000,
    };

    const normalized = normalizer.normalizeOrder(order);
    expect(normalized.status).toBe('canceled');
  });

  test('should normalize expired order status', () => {
    const order = {
      orderId: 101,
      userOrderId: 0,
      marketIndex: 0,
      status: 'expired',
      orderType: 'triggerLimit',
      marketType: 'perp',
      direction: 'short',
      baseAssetAmount: '1000000000',
      baseAssetAmountFilled: '0',
      quoteAssetAmountFilled: '0',
      price: '50000000000',
      reduceOnly: false,
      triggerPrice: '49000000000',
      triggerCondition: 'below',
      existingPositionDirection: 'long',
      postOnly: 'none',
      immediateOrCancel: false,
      maxTs: '0',
      oraclePriceOffset: 0,
      auctionDuration: 0,
      auctionStartPrice: '0',
      auctionEndPrice: '0',
      slot: 100000,
    };

    const normalized = normalizer.normalizeOrder(order);
    expect(normalized.status).toBe('expired');
    expect(normalized.type).toBe('stopLimit');
  });

  // ============================================================================
  // Position edge cases
  // ============================================================================

  test('should handle zero-size position', () => {
    const position = {
      marketIndex: 0,
      baseAssetAmount: '0',
      quoteAssetAmount: '0',
      quoteEntryAmount: '0',
      quoteBreakEvenAmount: '0',
      openOrders: 0,
      openBids: '0',
      openAsks: '0',
      settledPnl: '0',
      lpShares: '0',
      lastCumulativeFundingRate: '0',
      perLpBase: 0,
    };

    const normalized = normalizer.normalizePosition(position, 100, 100);
    expect(normalized.size).toBe(0);
    expect(normalized.entryPrice).toBe(0);
    expect(normalized.leverage).toBe(0);
  });
});

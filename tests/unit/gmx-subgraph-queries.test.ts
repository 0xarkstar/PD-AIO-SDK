/**
 * GMX Subgraph Tests
 *
 * Tests for GmxSubgraph normalizers and data transformation
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { GmxSubgraph } from '../../src/adapters/gmx/GmxSubgraph.js';

describe('GmxSubgraph', () => {
  let subgraph: GmxSubgraph;

  beforeEach(() => {
    subgraph = new GmxSubgraph('arbitrum');
  });

  describe('constructor', () => {
    test('should create subgraph client for arbitrum', () => {
      const arb = new GmxSubgraph('arbitrum');
      expect(arb).toBeDefined();
    });

    test('should create subgraph client for avalanche', () => {
      const avax = new GmxSubgraph('avalanche');
      expect(avax).toBeDefined();
    });
  });

  describe('additional normalizePosition tests', () => {
    test('should calculate entry price from position data', () => {
      const mockPosition = {
        id: 'pos-test',
        account: '0xaccount',
        market: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
        collateralToken: '0xusdc',
        sizeInUsd: '200000000000000000000000000000000', // $200
        sizeInTokens: '100000000000000000000', // 100 tokens
        collateralAmount: '20000',
        borrowingFactor: '0',
        fundingFeeAmountPerSize: '0',
        longTokenClaimableFundingAmountPerSize: '0',
        shortTokenClaimableFundingAmountPerSize: '0',
        increasedAtBlock: '2000',
        decreasedAtBlock: '0',
        isLong: true,
      };

      const result = subgraph.normalizePosition(mockPosition, 2000);

      // Entry price calculated from sizeInUsd / sizeInTokens
      expect(result.entryPrice).toBeGreaterThan(0);
      expect(result.side).toBe('long');
    });

    test('should handle zero collateral gracefully', () => {
      const mockPosition = {
        id: 'pos-zero-collateral',
        account: '0xaccount',
        market: '0xmarket',
        collateralToken: '0xusdc',
        sizeInUsd: '100000000000000000000000000000000',
        sizeInTokens: '50000000000000000000',
        collateralAmount: '0', // Zero collateral
        borrowingFactor: '0',
        fundingFeeAmountPerSize: '0',
        longTokenClaimableFundingAmountPerSize: '0',
        shortTokenClaimableFundingAmountPerSize: '0',
        increasedAtBlock: '1000',
        decreasedAtBlock: '0',
        isLong: false,
      };

      const result = subgraph.normalizePosition(mockPosition, 2000);

      // When collateral is 0, sizeUsd / collateral = 0
      expect(result.leverage).toBe(0);
    });
  });

  describe('additional normalizeOrder tests', () => {
    test('should map market decrease order type correctly', () => {
      const mockOrder = {
        key: 'order-decrease',
        account: '0xaccount',
        receiver: '0xreceiver',
        callbackContract: '0x0',
        uiFeeReceiver: '0x0',
        market: '0xmarket',
        initialCollateralToken: '0xusdc',
        swapPath: [],
        orderType: 1, // MarketDecrease
        decreasePositionSwapType: 0,
        sizeDeltaUsd: '50000000000000000000000000000000',
        initialCollateralDeltaAmount: '0',
        triggerPrice: '0',
        acceptablePrice: '2000000000000000000000000000000',
        executionFee: '100000000000000',
        callbackGasLimit: '0',
        minOutputAmount: '0',
        updatedAtBlock: '1000',
        isLong: true,
        isFrozen: false,
        status: 'Created',
        createdTxn: '0xtx1',
        cancelledTxn: undefined,
        executedTxn: undefined,
      };

      const result = subgraph.normalizeOrder(mockOrder);

      expect(result.type).toBe('market');
      expect(result.side).toBe('sell'); // Long decrease = sell
    });

    test('should handle frozen order', () => {
      const mockOrder = {
        key: 'order-frozen',
        account: '0xaccount',
        receiver: '0xreceiver',
        callbackContract: '0x0',
        uiFeeReceiver: '0x0',
        market: '0xmarket',
        initialCollateralToken: '0xusdc',
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
        isLong: true,
        isFrozen: true, // Frozen
        status: 'Created',
        createdTxn: '0xtx1',
        cancelledTxn: undefined,
        executedTxn: undefined,
      };

      const result = subgraph.normalizeOrder(mockOrder);

      expect(result).toBeDefined();
    });
  });

  describe('additional normalizeTrade tests', () => {
    test('should handle liquidation trade', () => {
      const mockTrade = {
        id: 'trade-liq',
        account: '0xaccount',
        marketAddress: '0xmarket',
        collateralTokenAddress: '0xusdc',
        sizeDeltaUsd: '100000000000000000000000000000000',
        collateralDeltaAmount: '10000000000000000000',
        orderType: 5, // Liquidation
        isLong: true,
        executionPrice: '1900000000000000000000000000000',
        priceImpactUsd: '0',
        pnlUsd: '-5000000000000000000000000000000', // Negative PnL
        timestamp: '1700000000',
        transactionHash: '0xtxliq',
      };

      const result = subgraph.normalizeTrade(mockTrade);

      expect(result.pnl).toBe(-5); // Negative
    });

    test('should handle trade with zero price impact', () => {
      const mockTrade = {
        id: 'trade-zero-impact',
        account: '0xaccount',
        marketAddress: '0xmarket',
        collateralTokenAddress: '0xusdc',
        sizeDeltaUsd: '50000000000000000000000000000000',
        collateralDeltaAmount: '5000000000000000000',
        orderType: 0,
        isLong: false,
        executionPrice: '2000000000000000000000000000000',
        priceImpactUsd: '0',
        timestamp: '1700000100',
        transactionHash: '0xtx2',
      };

      const result = subgraph.normalizeTrade(mockTrade);

      expect(result.priceImpact).toBe(0);
    });
  });
});

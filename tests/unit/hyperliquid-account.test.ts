/**
 * HyperliquidAccount Unit Tests
 *
 * Tests for order history, trade history, and open order processing helpers.
 */

import { describe, it, expect } from '@jest/globals';
import {
  processOrderHistory,
  processUserFills,
  processOpenOrders,
} from '../../src/adapters/hyperliquid/HyperliquidAccount.js';
import type { HyperliquidNormalizer } from '../../src/adapters/hyperliquid/HyperliquidNormalizer.js';
import type { Order, Trade } from '../../src/types/common.js';

// Mock normalizer
function createMockNormalizer(): HyperliquidNormalizer {
  return {
    normalizeHistoricalOrder: (order: any): Order => ({
      id: String(order.oid),
      clientOrderId: order.cloid || '',
      symbol: `${order.coin}/USDT:USDT`,
      type: 'limit',
      side: order.side === 'B' ? 'buy' : 'sell',
      price: parseFloat(order.limitPx || '0'),
      amount: parseFloat(order.sz || '0'),
      filled: parseFloat(order.filledSz || '0'),
      remaining: parseFloat(order.sz || '0') - parseFloat(order.filledSz || '0'),
      status: order.status || 'closed',
      timestamp: order.timestamp || 0,
      info: order,
    }),
    normalizeUserFill: (fill: any): Trade => ({
      id: fill.tid || String(Date.now()),
      symbol: `${fill.coin}/USDT:USDT`,
      side: fill.side === 'B' ? 'buy' : 'sell',
      price: parseFloat(fill.px || '0'),
      amount: parseFloat(fill.sz || '0'),
      cost: parseFloat(fill.px || '0') * parseFloat(fill.sz || '0'),
      timestamp: fill.time || 0,
      fee: { cost: parseFloat(fill.fee || '0'), currency: 'USDT' },
      info: fill,
    }),
    normalizeOrder: (order: any, coin: string): Order => ({
      id: String(order.oid),
      clientOrderId: order.cloid || '',
      symbol: `${coin}/USDT:USDT`,
      type: 'limit',
      side: order.side === 'B' ? 'buy' : 'sell',
      price: parseFloat(order.limitPx || '0'),
      amount: parseFloat(order.sz || '0'),
      filled: 0,
      remaining: parseFloat(order.sz || '0'),
      status: 'open',
      timestamp: order.timestamp || 0,
      info: order,
    }),
  } as any;
}

describe('HyperliquidAccount', () => {
  const normalizer = createMockNormalizer();

  // =========================================================================
  // processOrderHistory
  // =========================================================================
  describe('processOrderHistory', () => {
    const mockOrders = [
      { oid: 1, coin: 'BTC', side: 'B', limitPx: '36000', sz: '0.1', filledSz: '0.1', status: 'filled', timestamp: 1700000000000 },
      { oid: 2, coin: 'ETH', side: 'A', limitPx: '2000', sz: '1.0', filledSz: '0.5', status: 'canceled', timestamp: 1700010000000 },
      { oid: 3, coin: 'BTC', side: 'A', limitPx: '37000', sz: '0.2', filledSz: '0.2', status: 'filled', timestamp: 1700020000000 },
    ];

    it('should normalize all orders', () => {
      const result = processOrderHistory(mockOrders, normalizer);
      expect(result).toHaveLength(3);
    });

    it('should sort by timestamp descending (newest first)', () => {
      const result = processOrderHistory(mockOrders, normalizer);
      expect(result[0].timestamp).toBe(1700020000000);
      expect(result[1].timestamp).toBe(1700010000000);
      expect(result[2].timestamp).toBe(1700000000000);
    });

    it('should filter by symbol', () => {
      const result = processOrderHistory(mockOrders, normalizer, 'BTC/USDT:USDT');
      expect(result).toHaveLength(2);
      expect(result.every((o) => o.symbol === 'BTC/USDT:USDT')).toBe(true);
    });

    it('should filter by since timestamp', () => {
      const result = processOrderHistory(mockOrders, normalizer, undefined, 1700005000000);
      expect(result).toHaveLength(2);
      expect(result.every((o) => o.timestamp >= 1700005000000)).toBe(true);
    });

    it('should apply limit', () => {
      const result = processOrderHistory(mockOrders, normalizer, undefined, undefined, 1);
      expect(result).toHaveLength(1);
      expect(result[0].timestamp).toBe(1700020000000); // newest
    });

    it('should combine symbol filter, since, and limit', () => {
      const result = processOrderHistory(mockOrders, normalizer, 'BTC/USDT:USDT', 1700005000000, 1);
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('BTC/USDT:USDT');
    });

    it('should return empty array for no matching orders', () => {
      const result = processOrderHistory(mockOrders, normalizer, 'SOL/USDT:USDT');
      expect(result).toHaveLength(0);
    });

    it('should handle empty input', () => {
      const result = processOrderHistory([], normalizer);
      expect(result).toHaveLength(0);
    });
  });

  // =========================================================================
  // processUserFills
  // =========================================================================
  describe('processUserFills', () => {
    const mockFills = [
      { tid: 't1', coin: 'BTC', side: 'B', px: '36000', sz: '0.1', fee: '3.6', time: 1700000000000 },
      { tid: 't2', coin: 'ETH', side: 'A', px: '2000', sz: '1.0', fee: '2.0', time: 1700010000000 },
      { tid: 't3', coin: 'BTC', side: 'A', px: '37000', sz: '0.05', fee: '1.85', time: 1700020000000 },
    ];

    it('should normalize all fills', () => {
      const result = processUserFills(mockFills, normalizer);
      expect(result).toHaveLength(3);
    });

    it('should sort by timestamp descending', () => {
      const result = processUserFills(mockFills, normalizer);
      expect(result[0].timestamp).toBe(1700020000000);
      expect(result[2].timestamp).toBe(1700000000000);
    });

    it('should filter by symbol', () => {
      const result = processUserFills(mockFills, normalizer, 'ETH/USDT:USDT');
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('ETH/USDT:USDT');
    });

    it('should filter by since timestamp', () => {
      const result = processUserFills(mockFills, normalizer, undefined, 1700005000000);
      expect(result).toHaveLength(2);
    });

    it('should apply limit', () => {
      const result = processUserFills(mockFills, normalizer, undefined, undefined, 2);
      expect(result).toHaveLength(2);
    });

    it('should handle empty input', () => {
      const result = processUserFills([], normalizer);
      expect(result).toHaveLength(0);
    });
  });

  // =========================================================================
  // processOpenOrders
  // =========================================================================
  describe('processOpenOrders', () => {
    const mockOpenOrders = [
      { oid: 10, coin: 'BTC', side: 'B', limitPx: '35000', sz: '0.5', origSz: '0.5', timestamp: 1700000000000 },
      { oid: 11, coin: 'ETH', side: 'A', limitPx: '2100', sz: '2.0', origSz: '2.0', timestamp: 1700010000000 },
      { oid: 12, coin: 'BTC', side: 'B', limitPx: '34000', sz: '1.0', origSz: '1.0', timestamp: 1700020000000 },
    ];

    it('should normalize all open orders', () => {
      const result = processOpenOrders(mockOpenOrders, normalizer);
      expect(result).toHaveLength(3);
      expect(result.every((o) => o.status === 'open')).toBe(true);
    });

    it('should filter by symbol', () => {
      const result = processOpenOrders(mockOpenOrders, normalizer, 'BTC/USDT:USDT');
      expect(result).toHaveLength(2);
      expect(result.every((o) => o.symbol === 'BTC/USDT:USDT')).toBe(true);
    });

    it('should return all orders when no symbol filter', () => {
      const result = processOpenOrders(mockOpenOrders, normalizer);
      expect(result).toHaveLength(3);
    });

    it('should return empty array for no matching symbol', () => {
      const result = processOpenOrders(mockOpenOrders, normalizer, 'SOL/USDT:USDT');
      expect(result).toHaveLength(0);
    });

    it('should handle empty input', () => {
      const result = processOpenOrders([], normalizer);
      expect(result).toHaveLength(0);
    });
  });
});

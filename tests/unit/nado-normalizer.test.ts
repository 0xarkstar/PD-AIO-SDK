/**
 * Unit Tests for NadoNormalizer
 *
 * Tests data normalization, precision safety, batch processing, and symbol conversion.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ethers } from 'ethers';
import { NadoNormalizer } from '../../src/adapters/nado/NadoNormalizer.js';
import { PerpDEXError } from '../../src/types/errors.js';
import type { ProductMapping } from '../../src/adapters/nado/types.js';

describe('NadoNormalizer', () => {
  let normalizer: NadoNormalizer;

  beforeEach(() => {
    normalizer = new NadoNormalizer();
  });

  // ===========================================================================
  // Symbol Conversion
  // ===========================================================================

  describe('symbolToCCXT', () => {
    it('should convert BTC-PERP to BTC/USDT:USDT', () => {
      const result = normalizer.symbolToCCXT('BTC-PERP');
      expect(result).toBe('BTC/USDT:USDT');
    });

    it('should convert ETH-PERP to ETH/USDT:USDT', () => {
      const result = normalizer.symbolToCCXT('ETH-PERP');
      expect(result).toBe('ETH/USDT:USDT');
    });

    it('should use custom quote asset', () => {
      const result = normalizer.symbolToCCXT('BTC-PERP', 'USDC');
      expect(result).toBe('BTC/USDC:USDC');
    });

    it('should handle uppercase symbols', () => {
      const result = normalizer.symbolToCCXT('AVAX-PERP');
      expect(result).toBe('AVAX/USDT:USDT');
    });

    it('should handle lowercase symbols', () => {
      const result = normalizer.symbolToCCXT('btc-perp');
      expect(result).toBe('btc/USDT:USDT');
    });

    it('should handle symbols with numbers', () => {
      const result = normalizer.symbolToCCXT('1INCH-PERP');
      expect(result).toBe('1INCH/USDT:USDT');
    });
  });

  describe('symbolFromCCXT', () => {
    it('should convert BTC/USDT:USDT to BTC-PERP', () => {
      const result = normalizer.symbolFromCCXT('BTC/USDT:USDT');
      expect(result).toBe('BTC-PERP');
    });

    it('should convert ETH/USDT:USDT to ETH-PERP', () => {
      const result = normalizer.symbolFromCCXT('ETH/USDT:USDT');
      expect(result).toBe('ETH-PERP');
    });

    it('should handle different quote assets', () => {
      const result = normalizer.symbolFromCCXT('BTC/USDC:USDC');
      expect(result).toBe('BTC-PERP');
    });

    it('should handle symbols with numbers', () => {
      const result = normalizer.symbolFromCCXT('1INCH/USDT:USDT');
      expect(result).toBe('1INCH-PERP');
    });

    it('should handle lowercase base', () => {
      const result = normalizer.symbolFromCCXT('btc/USDT:USDT');
      expect(result).toBe('btc-PERP');
    });
  });

  describe('symbol conversion round-trip', () => {
    const testSymbols = ['BTC-PERP', 'ETH-PERP', 'SOL-PERP', 'AVAX-PERP'];

    testSymbols.forEach((nadoSymbol) => {
      it(`should round-trip ${nadoSymbol}`, () => {
        const ccxtSymbol = normalizer.symbolToCCXT(nadoSymbol);
        const backToNado = normalizer.symbolFromCCXT(ccxtSymbol);
        expect(backToNado).toBe(nadoSymbol);
      });
    });
  });

  // ===========================================================================
  // Product Normalization
  // ===========================================================================

  describe('normalizeProduct', () => {
    it('should normalize basic product', () => {
      const nadoProduct = {
        product_id: 2,
        symbol: 'BTC-PERP',
        price_increment: ethers.parseUnits('0.01', 18).toString(),
        size_increment: ethers.parseUnits('0.0001', 18).toString(),
        min_size: ethers.parseUnits('0.001', 18).toString(),
        max_size: ethers.parseUnits('1000', 18).toString(),
      };

      const market = normalizer.normalizeProduct(nadoProduct);

      expect(market.id).toBe('2');
      expect(market.symbol).toBe('BTC/USDT:USDT');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USDT');
      expect(market.settle).toBe('USDT');
      expect(market.type).toBe('swap');
      expect(market.spot).toBe(false);
      expect(market.swap).toBe(true);
      expect(market.future).toBe(false);
      expect(market.linear).toBe(true);
      expect(market.inverse).toBe(false);
    });

    it('should normalize precision correctly', () => {
      const nadoProduct = {
        product_id: 2,
        symbol: 'BTC-PERP',
        price_increment: ethers.parseUnits('0.01', 18).toString(),
        size_increment: ethers.parseUnits('0.0001', 18).toString(),
        min_size: ethers.parseUnits('0.001', 18).toString(),
        max_size: ethers.parseUnits('1000', 18).toString(),
      };

      const market = normalizer.normalizeProduct(nadoProduct);

      expect(market.precision.price).toBeCloseTo(0.01, 5);
      expect(market.precision.amount).toBeCloseTo(0.0001, 5);
    });

    it('should normalize limits correctly', () => {
      const nadoProduct = {
        product_id: 2,
        symbol: 'BTC-PERP',
        price_increment: ethers.parseUnits('1', 18).toString(),
        size_increment: ethers.parseUnits('0.001', 18).toString(),
        min_size: ethers.parseUnits('0.01', 18).toString(),
        max_size: ethers.parseUnits('500', 18).toString(),
      };

      const market = normalizer.normalizeProduct(nadoProduct);

      expect(market.limits.amount.min).toBeCloseTo(0.01, 5);
      expect(market.limits.amount.max).toBeCloseTo(500, 5);
    });
  });

  // ===========================================================================
  // Order Normalization
  // ===========================================================================

  describe('normalizeOrder', () => {
    const mockMapping: ProductMapping = {
      productId: 2,
      symbol: 'BTC-PERP',
      ccxtSymbol: 'BTC/USDT:USDT',
    };

    it('should normalize basic order', () => {
      const nadoOrder = {
        order_id: '123',
        product_id: 2,
        sender: '0x123',
        price: ethers.parseUnits('80000', 18).toString(),
        amount: ethers.parseUnits('0.1', 18).toString(),
        side: 0, // buy
        status: 'open',
        reduce_only: false,
        post_only: true,
        filled: '0',
        timestamp: 1234567890,
      };

      const order = normalizer.normalizeOrder(nadoOrder, mockMapping);

      expect(order.id).toBe('123');
      expect(order.symbol).toBe('BTC/USDT:USDT');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.price).toBeCloseTo(80000, 2);
      expect(order.amount).toBeCloseTo(0.1, 5);
      expect(order.filled).toBe(0);
      expect(order.status).toBe('open');
      expect(order.reduceOnly).toBe(false);
      expect(order.postOnly).toBe(true);
    });

    it('should handle sell orders', () => {
      const nadoOrder = {
        order_id: '456',
        product_id: 2,
        sender: '0x123',
        price: ethers.parseUnits('80000', 18).toString(),
        amount: ethers.parseUnits('0.1', 18).toString(),
        side: 1, // sell
        status: 'open',
        reduce_only: false,
        post_only: false,
        filled: '0',
        timestamp: 1234567890,
      };

      const order = normalizer.normalizeOrder(nadoOrder, mockMapping);

      expect(order.side).toBe('sell');
    });

    it('should handle reduce-only orders', () => {
      const nadoOrder = {
        order_id: '789',
        product_id: 2,
        sender: '0x123',
        price: ethers.parseUnits('80000', 18).toString(),
        amount: ethers.parseUnits('0.1', 18).toString(),
        side: 1,
        status: 'open',
        reduce_only: true,
        post_only: false,
        filled: '0',
        timestamp: 1234567890,
      };

      const order = normalizer.normalizeOrder(nadoOrder, mockMapping);

      expect(order.reduceOnly).toBe(true);
    });
  });

  // ===========================================================================
  // Position Normalization
  // ===========================================================================

  describe('normalizePosition', () => {
    const mockMapping: ProductMapping = {
      productId: 2,
      symbol: 'BTC-PERP',
      ccxtSymbol: 'BTC/USDT:USDT',
    };

    it('should normalize long position', () => {
      const nadoPosition = {
        product_id: 2,
        amount: ethers.parseUnits('0.5', 18).toString(),
        entry_price: ethers.parseUnits('80000', 18).toString(),
        mark_price: ethers.parseUnits('81000', 18).toString(),
        liquidation_price: ethers.parseUnits('70000', 18).toString(),
        unrealized_pnl: ethers.parseUnits('500', 18).toString(),
        margin: ethers.parseUnits('8000', 18).toString(),
      };

      const position = normalizer.normalizePosition(nadoPosition, mockMapping);

      expect(position).not.toBeNull();
      expect(position!.symbol).toBe('BTC/USDT:USDT');
      expect(position!.side).toBe('long');
      expect(position!.contracts).toBeCloseTo(0.5, 5);
      expect(position!.entryPrice).toBeCloseTo(80000, 2);
      expect(position!.markPrice).toBeCloseTo(81000, 2);
      expect(position!.liquidationPrice).toBeCloseTo(70000, 2);
      expect(position!.unrealizedPnl).toBeCloseTo(500, 2);
      expect(position!.collateral).toBeCloseTo(8000, 2);
    });

    it('should normalize short position', () => {
      const nadoPosition = {
        product_id: 2,
        amount: ethers.parseUnits('-0.3', 18).toString(),
        entry_price: ethers.parseUnits('80000', 18).toString(),
        mark_price: ethers.parseUnits('79000', 18).toString(),
        liquidation_price: ethers.parseUnits('90000', 18).toString(),
        unrealized_pnl: ethers.parseUnits('300', 18).toString(),
        margin: ethers.parseUnits('8000', 18).toString(),
      };

      const position = normalizer.normalizePosition(nadoPosition, mockMapping);

      expect(position).not.toBeNull();
      expect(position!.side).toBe('short');
      expect(position!.contracts).toBeCloseTo(0.3, 5); // Absolute value
    });

    it('should return null for zero position', () => {
      const nadoPosition = {
        product_id: 2,
        amount: '0',
        entry_price: '0',
        mark_price: ethers.parseUnits('80000', 18).toString(),
        liquidation_price: '0',
        unrealized_pnl: '0',
        margin: '0',
      };

      const position = normalizer.normalizePosition(nadoPosition, mockMapping);

      expect(position).toBeNull();
    });
  });

  // ===========================================================================
  // Batch Processing
  // ===========================================================================

  describe('normalizeOrders', () => {
    const mockMappings = new Map<string, ProductMapping>([
      [
        '2',
        {
          productId: 2,
          symbol: 'BTC-PERP',
          ccxtSymbol: 'BTC/USDT:USDT',
        },
      ],
      [
        '3',
        {
          productId: 3,
          symbol: 'ETH-PERP',
          ccxtSymbol: 'ETH/USDT:USDT',
        },
      ],
    ]);

    it('should normalize multiple orders', () => {
      const nadoOrders = [
        {
          order_id: '1',
          product_id: 2,
          sender: '0x123',
          price: ethers.parseUnits('80000', 18).toString(),
          amount: ethers.parseUnits('0.1', 18).toString(),
          side: 0,
          status: 'open',
          reduce_only: false,
          post_only: false,
          filled: '0',
          timestamp: 123,
        },
        {
          order_id: '2',
          product_id: 3,
          sender: '0x123',
          price: ethers.parseUnits('4000', 18).toString(),
          amount: ethers.parseUnits('1', 18).toString(),
          side: 1,
          status: 'open',
          reduce_only: false,
          post_only: false,
          filled: '0',
          timestamp: 124,
        },
      ];

      const orders = normalizer.normalizeOrders(nadoOrders, mockMappings);

      expect(orders).toHaveLength(2);
      expect(orders[0].id).toBe('1');
      expect(orders[0].symbol).toBe('BTC/USDT:USDT');
      expect(orders[1].id).toBe('2');
      expect(orders[1].symbol).toBe('ETH/USDT:USDT');
    });

    it('should filter out orders with unmapped products', () => {
      const nadoOrders = [
        {
          order_id: '1',
          product_id: 2,
          sender: '0x123',
          price: ethers.parseUnits('80000', 18).toString(),
          amount: ethers.parseUnits('0.1', 18).toString(),
          side: 0,
          status: 'open',
          reduce_only: false,
          post_only: false,
          filled: '0',
          timestamp: 123,
        },
        {
          order_id: '2',
          product_id: 999, // Unknown product
          sender: '0x123',
          price: ethers.parseUnits('1000', 18).toString(),
          amount: ethers.parseUnits('1', 18).toString(),
          side: 1,
          status: 'open',
          reduce_only: false,
          post_only: false,
          filled: '0',
          timestamp: 124,
        },
      ];

      const orders = normalizer.normalizeOrders(nadoOrders, mockMappings);

      expect(orders).toHaveLength(1);
      expect(orders[0].id).toBe('1');
    });

    it('should handle empty orders array', () => {
      const orders = normalizer.normalizeOrders([], mockMappings);

      expect(orders).toEqual([]);
    });
  });

  describe('normalizePositions', () => {
    const mockMappings = new Map<string, ProductMapping>([
      [
        '2',
        {
          productId: 2,
          symbol: 'BTC-PERP',
          ccxtSymbol: 'BTC/USDT:USDT',
        },
      ],
      [
        '3',
        {
          productId: 3,
          symbol: 'ETH-PERP',
          ccxtSymbol: 'ETH/USDT:USDT',
        },
      ],
    ]);

    it('should normalize multiple positions', () => {
      const nadoPositions = [
        {
          product_id: 2,
          amount: ethers.parseUnits('0.5', 18).toString(),
          entry_price: ethers.parseUnits('80000', 18).toString(),
          mark_price: ethers.parseUnits('81000', 18).toString(),
          liquidation_price: ethers.parseUnits('70000', 18).toString(),
          unrealized_pnl: ethers.parseUnits('500', 18).toString(),
          margin: ethers.parseUnits('8000', 18).toString(),
        },
        {
          product_id: 3,
          amount: ethers.parseUnits('-2', 18).toString(),
          entry_price: ethers.parseUnits('4000', 18).toString(),
          mark_price: ethers.parseUnits('3900', 18).toString(),
          liquidation_price: ethers.parseUnits('4500', 18).toString(),
          unrealized_pnl: ethers.parseUnits('200', 18).toString(),
          margin: ethers.parseUnits('1000', 18).toString(),
        },
      ];

      const positions = normalizer.normalizePositions(nadoPositions, mockMappings);

      expect(positions).toHaveLength(2);
      expect(positions[0].symbol).toBe('BTC/USDT:USDT');
      expect(positions[0].side).toBe('long');
      expect(positions[1].symbol).toBe('ETH/USDT:USDT');
      expect(positions[1].side).toBe('short');
    });

    it('should filter out zero positions', () => {
      const nadoPositions = [
        {
          product_id: 2,
          amount: ethers.parseUnits('0.5', 18).toString(),
          entry_price: ethers.parseUnits('80000', 18).toString(),
          mark_price: ethers.parseUnits('81000', 18).toString(),
          liquidation_price: ethers.parseUnits('70000', 18).toString(),
          unrealized_pnl: ethers.parseUnits('500', 18).toString(),
          margin: ethers.parseUnits('8000', 18).toString(),
        },
        {
          product_id: 3,
          amount: '0', // Zero position
          entry_price: '0',
          mark_price: ethers.parseUnits('4000', 18).toString(),
          liquidation_price: '0',
          unrealized_pnl: '0',
          margin: '0',
        },
      ];

      const positions = normalizer.normalizePositions(nadoPositions, mockMappings);

      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe('BTC/USDT:USDT');
    });
  });

  // ===========================================================================
  // Edge Cases & Error Handling
  // ===========================================================================

  describe('precision safety', () => {
    it('should handle very large numbers', () => {
      const largeValue = ethers.parseUnits('999999999', 18).toString();
      const nadoProduct = {
        product_id: 1,
        symbol: 'TEST-PERP',
        price_increment: largeValue,
        size_increment: '1',
        min_size: '1',
        max_size: largeValue,
      };

      // Should not throw
      expect(() => normalizer.normalizeProduct(nadoProduct)).not.toThrow();
    });

    it('should handle very small numbers', () => {
      const smallValue = ethers.parseUnits('0.00000001', 18).toString();
      const nadoProduct = {
        product_id: 1,
        symbol: 'TEST-PERP',
        price_increment: smallValue,
        size_increment: smallValue,
        min_size: smallValue,
        max_size: '1000000000000000000',
      };

      // Should not throw
      expect(() => normalizer.normalizeProduct(nadoProduct)).not.toThrow();
    });
  });
});
